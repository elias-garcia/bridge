// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/WrappedToken.sol";
import "../src/Bridge.sol";

contract DeployDest is Script {
    function run() external {
        address attestor = vm.envAddress("ATTESTOR_ADDRESS");
        address admin    = vm.envAddress("ADMIN_ADDRESS");

        vm.startBroadcast();
        WrappedToken wrappedToken = new WrappedToken("Wrapped ARKIV Token", "wARKV", admin);
        Bridge bridge = new Bridge(attestor, admin);
        vm.stopBroadcast();

        console.log("wrappedToken :", address(wrappedToken));
        console.log("bridge       :", address(bridge));
    }
}
