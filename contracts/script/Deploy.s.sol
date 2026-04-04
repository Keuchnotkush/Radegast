// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "forge-std/Script.sol";
import "../src/XStockMock.sol";
import "../src/ConsensusSettlement.sol";
import "../src/ProofOfSolvency.sol";
import "../src/UltraVerifier.sol";
contract Deploy is Script {
    function _deployToken(string memory n, string memory s, uint192 p, address d) internal returns (XStockMock t) {
        t = new XStockMock(n, s, p);
        t.grantRoles(d, t.MINTER_ROLE() | t.PRICE_UPDATER_ROLE());
    }

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address d = vm.addr(pk);
        vm.startBroadcast(pk);

        _deployToken("Tesla xStock", "TSLAx", 250e6, d);
        _deployToken("Apple xStock", "AAPLx", 198e6, d);
        _deployToken("NVIDIA xStock", "NVDAx", 140e6, d);
        _deployToken("Google xStock", "GOOGx", 175e6, d);
        _deployToken("Amazon xStock", "AMZNx", 185e6, d);
        _deployToken("Meta xStock", "METAx", 510e6, d);
        _deployToken("S&P 500 xStock", "SPYx", 530e6, d);
        _deployToken("Nasdaq xStock", "NDXx", 480e6, d);
        _deployToken("MicroStrategy xStock", "MSTRx", 1700e6, d);
        _deployToken("Microsoft xStock", "MSFTx", 420e6, d);
        _deployToken("JPMorgan xStock", "JPMx", 240e6, d);
        _deployToken("Visa xStock", "Vx", 310e6, d);
        _deployToken("Exxon xStock", "XOMx", 115e6, d);
        _deployToken("Eli Lilly xStock", "LLYx", 780e6, d);
        _deployToken("LVMH xStock", "LVMHx", 750e6, d);

        ConsensusSettlement cs = new ConsensusSettlement();
        cs.grantRoles(d, cs.SUBMITTER_ROLE());

        HonkVerifier verifier = new HonkVerifier();
        new ProofOfSolvency(address(verifier));

        vm.stopBroadcast();
    }
}
