// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/Token.sol";
import "../src/WrappedToken.sol";
import "../src/Bridge.sol";

contract BridgeTest is Test {
    uint256 constant ATTESTOR_PK = 0xA11CE;
    uint256 constant SOURCE_CHAIN = 84532;
    uint256 constant DEST_CHAIN = 59141;

    address attestor;
    address admin;
    address user;

    Token token;
    WrappedToken wrappedToken;
    Bridge sourceBridge;
    Bridge destBridge;

    function setUp() public {
        attestor = vm.addr(ATTESTOR_PK);
        admin = makeAddr("admin");
        user = makeAddr("user");

        // Deploy source chain contracts
        vm.chainId(SOURCE_CHAIN);
        token = new Token("ARKIV Token", "ARKV");
        sourceBridge = new Bridge(attestor, admin);

        // Deploy dest chain contracts
        vm.chainId(DEST_CHAIN);
        wrappedToken = new WrappedToken("Wrapped ARKIV Token", "wARKV", admin);
        destBridge = new Bridge(attestor, admin);
        vm.prank(admin);
        wrappedToken.grantRole(keccak256("MINTER_ROLE"), address(destBridge));

        // Configure source bridge (LOCK)
        vm.chainId(SOURCE_CHAIN);
        vm.prank(admin);
        sourceBridge.configureToken(address(token), Bridge.Mode.LOCK, DEST_CHAIN, address(wrappedToken));

        // Configure dest bridge (MINT)
        vm.chainId(DEST_CHAIN);
        vm.prank(admin);
        destBridge.configureToken(address(wrappedToken), Bridge.Mode.MINT, SOURCE_CHAIN, address(token));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    function _sign(
        Bridge bridge,
        uint256 srcChainId,
        uint256 dstChainId,
        address srcToken,
        address recipient,
        uint256 amount,
        uint256 nonce
    ) internal view returns (bytes memory) {
        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("Bridge"),
                keccak256("1"),
                dstChainId,
                address(bridge)
            )
        );
        bytes32 structHash = keccak256(
            abi.encode(bridge.MESSAGE_TYPEHASH(), srcChainId, dstChainId, srcToken, recipient, amount, nonce)
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ATTESTOR_PK, digest);
        return abi.encodePacked(r, s, v);
    }

    // -------------------------------------------------------------------------
    // Tests
    // -------------------------------------------------------------------------

    function test_deposit_lock() public {
        uint256 amount = 100e18;
        vm.chainId(SOURCE_CHAIN);

        token.mint(user, amount);
        vm.prank(user);
        token.approve(address(sourceBridge), amount);

        vm.expectEmit(true, false, false, true, address(sourceBridge));
        emit Bridge.Deposited(user, SOURCE_CHAIN, DEST_CHAIN, address(token), amount, 0);

        vm.prank(user);
        sourceBridge.deposit(address(token), amount, user);

        assertEq(token.balanceOf(address(sourceBridge)), amount);
        assertEq(token.balanceOf(user), 0);
        assertEq(sourceBridge.outboundNonce(), 1);
    }

    function test_deposit_mint() public {
        uint256 amount = 100e18;
        vm.chainId(DEST_CHAIN);

        vm.prank(address(destBridge));
        wrappedToken.mint(user, amount);

        vm.expectEmit(true, false, false, true, address(destBridge));
        emit Bridge.Deposited(user, DEST_CHAIN, SOURCE_CHAIN, address(wrappedToken), amount, 0);

        vm.prank(user);
        destBridge.deposit(address(wrappedToken), amount, user);

        assertEq(wrappedToken.balanceOf(user), 0);
        assertEq(wrappedToken.totalSupply(), 0);
        assertEq(destBridge.outboundNonce(), 1);
    }

    function test_claim_mint() public {
        uint256 amount = 100e18;
        uint256 nonce = 0;
        vm.chainId(DEST_CHAIN);

        bytes memory sig = _sign(destBridge, SOURCE_CHAIN, DEST_CHAIN, address(token), user, amount, nonce);

        Bridge.BridgeMessage memory m = Bridge.BridgeMessage({
            srcChainId: SOURCE_CHAIN,
            dstChainId: DEST_CHAIN,
            srcToken: address(token),
            recipient: user,
            amount: amount,
            nonce: nonce
        });

        vm.expectEmit(true, false, false, true, address(destBridge));
        emit Bridge.Claimed(user, address(wrappedToken), amount, nonce);

        destBridge.claim(m, sig);

        assertEq(wrappedToken.balanceOf(user), amount);
    }

    function test_claim_lock() public {
        uint256 amount = 100e18;
        uint256 nonce = 0;

        // Seed source bridge with escrowed tokens
        vm.chainId(SOURCE_CHAIN);
        token.mint(address(sourceBridge), amount);

        bytes memory sig = _sign(sourceBridge, DEST_CHAIN, SOURCE_CHAIN, address(wrappedToken), user, amount, nonce);

        Bridge.BridgeMessage memory m = Bridge.BridgeMessage({
            srcChainId: DEST_CHAIN,
            dstChainId: SOURCE_CHAIN,
            srcToken: address(wrappedToken),
            recipient: user,
            amount: amount,
            nonce: nonce
        });

        sourceBridge.claim(m, sig);

        assertEq(token.balanceOf(user), amount);
        assertEq(token.balanceOf(address(sourceBridge)), 0);
    }

    function test_claim_replay_rejected() public {
        uint256 amount = 100e18;
        uint256 nonce = 0;
        vm.chainId(DEST_CHAIN);

        bytes memory sig = _sign(destBridge, SOURCE_CHAIN, DEST_CHAIN, address(token), user, amount, nonce);

        Bridge.BridgeMessage memory m = Bridge.BridgeMessage({
            srcChainId: SOURCE_CHAIN,
            dstChainId: DEST_CHAIN,
            srcToken: address(token),
            recipient: user,
            amount: amount,
            nonce: nonce
        });

        destBridge.claim(m, sig);

        bytes32 id = destBridge.messageId(SOURCE_CHAIN, DEST_CHAIN, address(token), user, amount, nonce);
        vm.expectRevert(abi.encodeWithSelector(Bridge.AlreadyClaimed.selector, id));
        destBridge.claim(m, sig);
    }

    function test_claim_bad_sig_rejected() public {
        uint256 amount = 100e18;
        uint256 wrongKey = 0xBAD;
        vm.chainId(DEST_CHAIN);

        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("Bridge"),
                keccak256("1"),
                DEST_CHAIN,
                address(destBridge)
            )
        );
        bytes32 structHash = keccak256(
            abi.encode(destBridge.MESSAGE_TYPEHASH(), SOURCE_CHAIN, DEST_CHAIN, address(token), user, amount, 0)
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongKey, digest);
        bytes memory sig = abi.encodePacked(r, s, v);

        Bridge.BridgeMessage memory m = Bridge.BridgeMessage({
            srcChainId: SOURCE_CHAIN,
            dstChainId: DEST_CHAIN,
            srcToken: address(token),
            recipient: user,
            amount: amount,
            nonce: 0
        });

        address recovered = vm.addr(wrongKey);
        vm.expectRevert(abi.encodeWithSelector(Bridge.BadAttestor.selector, recovered, attestor));
        destBridge.claim(m, sig);
    }

    function test_claim_wrong_chain_rejected() public {
        uint256 amount = 100e18;
        vm.chainId(DEST_CHAIN);

        bytes memory sig = _sign(destBridge, SOURCE_CHAIN, DEST_CHAIN, address(token), user, amount, 0);

        // dstChainId points to source chain instead of dest
        Bridge.BridgeMessage memory m = Bridge.BridgeMessage({
            srcChainId: SOURCE_CHAIN,
            dstChainId: SOURCE_CHAIN,
            srcToken: address(token),
            recipient: user,
            amount: amount,
            nonce: 0
        });

        vm.expectRevert(abi.encodeWithSelector(Bridge.WrongChain.selector, DEST_CHAIN, SOURCE_CHAIN));
        destBridge.claim(m, sig);
    }

    function test_deposit_unsupported_token_rejected() public {
        vm.chainId(SOURCE_CHAIN);
        address randomToken = makeAddr("randomToken");

        vm.expectRevert(abi.encodeWithSelector(Bridge.UnsupportedToken.selector, randomToken));
        vm.prank(user);
        sourceBridge.deposit(randomToken, 100e18, user);
    }
}
