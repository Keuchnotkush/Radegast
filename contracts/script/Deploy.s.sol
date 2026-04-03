// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "forge-std/Script.sol";
import "../src/XStockMock.sol";
import "../src/ConsensusSettlement.sol";
import "../src/ProofOfSolvency.sol";
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);

        XStockMock tsla = new XStockMock("Tesla xStock", "TSLAx", 250e6);
        XStockMock aapl = new XStockMock("Apple xStock", "AAPLx", 198e6);
        XStockMock nvda = new XStockMock("NVIDIA xStock", "NVDAx", 140e6);
        XStockMock goog = new XStockMock("Google xStock", "GOOGx", 175e6);
        XStockMock amzn = new XStockMock("Amazon xStock", "AMZNx", 185e6);
        XStockMock meta = new XStockMock("Meta xStock", "METAx", 510e6);
        XStockMock spy = new XStockMock("S&P 500 xStock", "SPYx", 530e6);
        XStockMock ndx = new XStockMock("Nasdaq xStock", "NDXx", 480e6);
        XStockMock mstr = new XStockMock("MicroStrategy xStock", "MSTRx", 1700e6);
        XStockMock msft = new XStockMock("Microsoft xStock", "MSFTx", 420e6);
        XStockMock jpm = new XStockMock("JPMorgan xStock", "JPMx", 240e6);
        XStockMock visa = new XStockMock("Visa xStock", "Vx", 310e6);
        XStockMock xom = new XStockMock("Exxon xStock", "XOMx", 115e6);
        XStockMock lly = new XStockMock("Eli Lilly xStock", "LLYx", 780e6);
        XStockMock lvmh = new XStockMock("LVMH xStock", "LVMHx", 750e6);

        address d = vm.addr(pk);
        uint256 M = tsla.MINTER_ROLE();

        tsla.grantRoles(d, M);
        aapl.grantRoles(d, M);
        nvda.grantRoles(d, M);
        goog.grantRoles(d, M);
        amzn.grantRoles(d, M);
        meta.grantRoles(d, M);
        spy.grantRoles(d, M);
        ndx.grantRoles(d, M);
        mstr.grantRoles(d, M);
        msft.grantRoles(d, M);
        jpm.grantRoles(d, M);
        visa.grantRoles(d, M);
        xom.grantRoles(d, M);
        lly.grantRoles(d, M);
        lvmh.grantRoles(d, M);

        ConsensusSettlement cs = new ConsensusSettlement();
        cs.grantRoles(d, cs.SUBMITTER_ROLE());

        new ProofOfSolvency(address(0));

        vm.stopBroadcast();
    }
}
