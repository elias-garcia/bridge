// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/Token.sol";
import "../src/Bridge.sol";

contract DeploySource is Script {
    function run() external {
        address attestor = vm.envAddress("ATTESTOR_ADDRESS");
        address admin = vm.envAddress("ADMIN_ADDRESS");

        vm.startBroadcast();
        Token token = new Token("ARKIV Token", "ARKV");
        Bridge bridge = new Bridge(attestor, admin);
        vm.stopBroadcast();

        console.log("token  :", address(token));
        console.log("bridge :", address(bridge));
    }
}
