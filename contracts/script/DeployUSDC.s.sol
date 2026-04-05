// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "forge-std/Script.sol";
import "../src/MockUSDC.sol";

contract DeployUSDC is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        vm.startBroadcast(pk);

        MockUSDC usdc = new MockUSDC();
        // Grant MINTER_ROLE to deployer (backend signer)
        usdc.grantRoles(deployer, usdc.MINTER_ROLE());

        vm.stopBroadcast();

        console.log("MockUSDC deployed at:", address(usdc));
        console.log("MINTER_ROLE granted to:", deployer);
    }
}
