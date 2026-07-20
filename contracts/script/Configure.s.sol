// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/Bridge.sol";
import "../src/WrappedToken.sol";

contract Configure is Script {
    function run(
        uint256 sourceChainId,
        address sourceToken,
        address sourceBridge,
        uint256 destChainId,
        address destToken,
        address destBridge
    ) external {
        vm.startBroadcast();

        if (block.chainid == sourceChainId) {
            Bridge(sourceBridge).configureToken(sourceToken, Bridge.Mode.LOCK, destChainId, destToken);
            console.log("Configured LOCK on source bridge:", sourceBridge);
        } else {
            Bridge(destBridge).configureToken(destToken, Bridge.Mode.MINT, sourceChainId, sourceToken);
            WrappedToken(destToken).grantRole(WrappedToken(destToken).MINTER_ROLE(), destBridge);
            console.log("Configured MINT on dest bridge  :", destBridge);
            console.log("Granted MINTER_ROLE to          :", destBridge);
        }

        vm.stopBroadcast();
    }
}
