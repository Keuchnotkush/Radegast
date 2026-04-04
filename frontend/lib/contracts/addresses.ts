/* ─── Contract addresses per chain ───
 *
 * After running `make deploy-og`, paste the deployed addresses here.
 * The deploy script logs them to console.
 *
 * Ticker keys match the MARKET array in dashboard/store.tsx
 */

import type { Address } from "viem";

export interface DeployedAddresses {
  xStocks: Record<string, Address>;
  consensusSettlement: Address;
  proofOfSolvency: Address;
}

/* ─── 0G Testnet (chain 16602) ─── */
export const OG_TESTNET: DeployedAddresses = {
  xStocks: {
    TSLAx: "0x2dC821592626Ab6375E5B84b4EF94eCb1478EBa6",
    AAPLx: "0xbF7878757DcbCF28E024aEFa7B03B3cF6267aE8c",
    NVDAx: "0xC82291F9b5f22FAecB5530DcF54E6D2086b45fde",
    GOOGx: "0x4eb8fEe5CBDBC434ee88F7781948e8799Ed7Fb82",
    AMZNx: "0xEfF7d05B11CC848Bf7EAbA74a6021B0567aB841d",
    METAx: "0xa483a4342F4D4D8e27364876cF55f3baaFb93310",
    SPYx:  "0xC04F35d970F08F09c23b8C97538fCf62a57c255C",
    NDXx:  "0x88B700918cd051ffa6B02274DE53584695E06bce",
    MSTRx: "0x6ce30D33c6091425bbe162cA353CDbffF7C090d9",
    MSFTx: "0x26F1B3D351Cb8a23E6cCeA93d5143Dc1e185cFA0",
    JPMx:  "0x43da4eCBa6DfD3b901Dd5238a77608c52C420e5b",
    Vx:    "0x781C0de58df40F5f6a1b661F3CB0a5B551A3b683",
    XOMx:  "0x2bEd346a985866B497E052fB807bE4E3FB4D015E",
    LLYx:  "0xa37e660218B3De658444648873d3016E1aD1681d",
    LVMHx: "0x425f1CF3e4f3762B58a32d24a80b7d767Af58441",
  },
  consensusSettlement: "0x3dBCdad5Da3a7f345353d8387c7BE6EBe5F6524f",
  proofOfSolvency: "0x9ad38b9e70a23BE95186C5935930C6Ab05C49dD9",
};

/* ─── Local Anvil (chain 31337) ─── */
export const LOCAL: DeployedAddresses = {
  xStocks: {},
  consensusSettlement: "0x0000000000000000000000000000000000000000",
  proofOfSolvency: "0x0000000000000000000000000000000000000000",
};

/* ─── Ticker symbol → xStock symbol mapping ───
 *  Frontend uses "TSLA", contracts use "TSLAx"
 */
export const TICKER_TO_XSTOCK: Record<string, string> = {
  TSLA: "TSLAx", AAPL: "AAPLx", NVDA: "NVDAx", GOOGL: "GOOGx",
  AMZN: "AMZNx", META: "METAx", SPY: "SPYx", QQQ: "NDXx",
  MSTR: "MSTRx", MSFT: "MSFTx", JPM: "JPMx", V: "Vx",
  XOM: "XOMx", LLY: "LLYx", "MC.PA": "LVMHx",
};
