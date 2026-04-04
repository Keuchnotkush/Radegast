// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "forge-std/Script.sol";
import "../src/ProofOfSolvency.sol";
contract RedeployPoS is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address verifier = vm.envAddress("HONK_VERIFIER");
        vm.startBroadcast(pk);

        new ProofOfSolvency(verifier);

        vm.stopBroadcast();
    }
}
