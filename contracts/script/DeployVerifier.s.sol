// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "forge-std/Script.sol";
import "../src/UltraVerifier.sol";
import "../src/ProofOfSolvency.sol";
contract DeployVerifier is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address pos = vm.envAddress("PROOF_OF_SOLVENCY");
        vm.startBroadcast(pk);

        HonkVerifier verifier = new HonkVerifier();
        ProofOfSolvency(pos).setVerifier(address(verifier));

        vm.stopBroadcast();
    }
}
