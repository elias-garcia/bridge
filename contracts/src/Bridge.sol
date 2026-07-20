// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./interfaces/IMintable.sol";

/// @notice Symmetric bridge contract — identical bytecode deployed on both chains.
/// Behaviour per token is determined by its configured Mode:
///   LOCK: canonical token (e.g. ARKV on Base Sepolia)  — escrow on deposit, release on claim.
///   MINT: wrapped token  (e.g. wARKV on OP Sepolia)    — burn on deposit, mint on claim.
contract Bridge is AccessControl, Pausable, EIP712 {
    using SafeERC20 for IERC20;

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error ZeroAddress();

    error UnsupportedToken(address token);
    error ZeroAmount();
    error ZeroRecipient();
    error WrongChain(uint256 expected, uint256 actual);
    error AlreadyClaimed(bytes32 id);
    error BadAttestor(address recovered, address expected);
    error UnknownTokenPair(uint256 srcChainId, address srcToken);

    // -------------------------------------------------------------------------
    // Types
    // -------------------------------------------------------------------------

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    bytes32 public constant MESSAGE_TYPEHASH = keccak256(
        "BridgeMessage(uint256 srcChainId,uint256 dstChainId,address srcToken,address recipient,uint256 amount,uint256 nonce)"
    );

    enum Mode {
        NONE,
        LOCK,
        MINT
    }

    struct TokenConfig {
        Mode mode;
        uint256 remoteChainId;
        address remoteToken;
    }

    struct BridgeMessage {
        uint256 srcChainId;
        uint256 dstChainId;
        address srcToken;
        address recipient;
        uint256 amount;
        uint256 nonce;
    }

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    /// @notice Per-token bridge configuration.
    mapping(address => TokenConfig) public tokenConfigs;
    /// @notice Reverse lookup: (srcChainId, srcToken) => local token address.
    mapping(uint256 => mapping(address => address)) public localTokens;
    /// @notice Replay guard — tracks claimed message IDs.
    mapping(bytes32 => bool) public processed;

    uint256 public outboundNonce;
    address public attestor;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event Deposited(
        address indexed recipient,
        uint256 srcChainId,
        uint256 dstChainId,
        address srcToken,
        uint256 amount,
        uint256 nonce
    );

    event Claimed(
        address indexed recipient,
        address localToken,
        uint256 amount,
        uint256 nonce
    );

    event TokenConfigured(
        address localToken,
        Mode mode,
        uint256 remoteChainId,
        address remoteToken
    );

    event AttestorUpdated(
        address oldAttestor,
        address newAttestor
    );

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(address _attestor, address _admin) EIP712("Bridge", "1") {
        require(_attestor != address(0), ZeroAddress());
        require(_admin != address(0), ZeroAddress());

        attestor = _attestor;
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);
    }

    // -------------------------------------------------------------------------
    // Admin
    // -------------------------------------------------------------------------

    /// @notice Register a token for bridging. Must be called on both chains to wire the pair.
    function configureToken(
        address localToken,
        Mode mode,
        uint256 remoteChainId,
        address remoteToken
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(localToken != address(0) && remoteToken != address(0), ZeroAddress());

        tokenConfigs[localToken] = TokenConfig(mode, remoteChainId, remoteToken);
        localTokens[remoteChainId][remoteToken] = localToken;

        emit TokenConfigured(localToken, mode, remoteChainId, remoteToken);
    }

    function setAttestor(address _attestor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_attestor != address(0), ZeroAddress());
        emit AttestorUpdated(attestor, _attestor);
        attestor = _attestor;
    }

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    // -------------------------------------------------------------------------
    // Bridge
    // -------------------------------------------------------------------------

    /// @notice Outbound: lock (LOCK mode) or burn (MINT mode) tokens on this chain.
    /// Emits Deposited — the relayer watches this event and delivers to the destination.
    function deposit(address token, uint256 amount, address recipient) external whenNotPaused {
        TokenConfig memory cfg = tokenConfigs[token];
        require(cfg.mode != Mode.NONE, UnsupportedToken(token));
        require(amount > 0, ZeroAmount());
        require(recipient != address(0), ZeroRecipient());

        uint256 nonce = outboundNonce++;

        if (cfg.mode == Mode.LOCK) {
            // CEI: nonce already incremented before external call
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        } else {
            IMintable(token).burn(msg.sender, amount);
        }

        emit Deposited(recipient, block.chainid, cfg.remoteChainId, token, amount, nonce);
    }

    /// @notice Inbound: relayer submits an attestor-signed BridgeMessage → release (LOCK) or mint (MINT).
    function claim(BridgeMessage calldata m, bytes calldata sig) external whenNotPaused {
        require(m.dstChainId == block.chainid, WrongChain(block.chainid, m.dstChainId));

        bytes32 id = messageId(m.srcChainId, m.dstChainId, m.srcToken, m.recipient, m.amount, m.nonce);
        require(!processed[id], AlreadyClaimed(id));

        // Verify attestor EIP-712 signature
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(MESSAGE_TYPEHASH, m.srcChainId, m.dstChainId, m.srcToken, m.recipient, m.amount, m.nonce))
        );
        address recovered = ECDSA.recover(digest, sig);
        require(recovered == attestor, BadAttestor(recovered, attestor));

        // CEI: mark processed before any external call
        processed[id] = true;

        address localToken = localTokens[m.srcChainId][m.srcToken];
        require(localToken != address(0), UnknownTokenPair(m.srcChainId, m.srcToken));
        Mode mode = tokenConfigs[localToken].mode;

        if (mode == Mode.LOCK) {
            IERC20(localToken).safeTransfer(m.recipient, m.amount);
        } else {
            IMintable(localToken).mint(m.recipient, m.amount);
        }

        emit Claimed(localToken, m.recipient, m.amount, m.nonce);
    }

    // -------------------------------------------------------------------------
    // Views
    // -------------------------------------------------------------------------

    /// @notice Deterministic message ID — used as the replay-guard key and event index.
    function messageId(
        uint256 srcChainId,
        uint256 dstChainId,
        address srcToken,
        address recipient,
        uint256 amount,
        uint256 nonce
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(srcChainId, dstChainId, srcToken, recipient, amount, nonce));
    }
}
