// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/// @notice Faucet ERC20 with EIP-2612 permit, deployed on the source chain.
/// Open mint — anyone can call to self-serve tokens for testing.
contract Token is ERC20Permit {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) ERC20Permit(name) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
