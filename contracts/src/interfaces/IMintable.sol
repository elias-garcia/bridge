// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @notice Interface that wrapped tokens must implement to be compatible with the Bridge.
interface IMintable {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}
