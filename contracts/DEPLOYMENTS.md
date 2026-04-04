# Radegast — Deployed Contracts

**Network:** 0G Testnet (Chain 16602)
**RPC:** `https://evmrpc-testnet.0g.ai`
**Owner / Deployer:** `0x5FB77900D139f2Eee6F312F3BF98fc8ad700C174`

## xStock Tokens

| Token | Symbol | Address | Price |
|---|---|---|---|
| Tesla | TSLAx | `0x2dC821592626Ab6375E5B84b4EF94eCb1478EBa6` | $250 |
| Apple | AAPLx | `0xbF7878757DcbCF28E024aEFa7B03B3cF6267aE8c` | $198 |
| NVIDIA | NVDAx | `0xC82291F9b5f22FAecB5530DcF54E6D2086b45fde` | $140 |
| Google | GOOGx | `0x4eb8fEe5CBDBC434ee88F7781948e8799Ed7Fb82` | $175 |
| Amazon | AMZNx | `0xEfF7d05B11CC848Bf7EAbA74a6021B0567aB841d` | $185 |
| Meta | METAx | `0xa483a4342F4D4D8e27364876cF55f3baaFb93310` | $510 |
| S&P 500 | SPYx | `0xC04F35d970F08F09c23b8C97538fCf62a57c255C` | $530 |
| Nasdaq | NDXx | `0x88B700918cd051ffa6B02274DE53584695E06bce` | $480 |
| MicroStrategy | MSTRx | `0x6ce30D33c6091425bbe162cA353CDbffF7C090d9` | $1700 |
| Microsoft | MSFTx | `0x26F1B3D351Cb8a23E6cCeA93d5143Dc1e185cFA0` | $420 |
| JPMorgan | JPMx | `0x43da4eCBa6DfD3b901Dd5238a77608c52C420e5b` | $240 |
| Visa | Vx | `0x781C0de58df40F5f6a1b661F3CB0a5B551A3b683` | $310 |
| Exxon | XOMx | `0x2bEd346a985866B497E052fB807bE4E3FB4D015E` | $115 |
| Eli Lilly | LLYx | `0xa37e660218B3De658444648873d3016E1aD1681d` | $780 |
| LVMH | LVMHx | `0x425f1CF3e4f3762B58a32d24a80b7d767Af58441` | $750 |

All tokens minted with 15 units to deployer.

## Protocol Contracts

| Contract | Address | Purpose |
|---|---|---|
| ConsensusSettlement | `0x3dBCdad5Da3a7f345353d8387c7BE6EBe5F6524f` | Records AI consensus votes on-chain |
| ProofOfSolvency | `0x9ad38b9e70a23BE95186C5935930C6Ab05C49dD9` | Stores ZK attestations for bank verification |
| HonkVerifier | `0x71E560eC76Ac0CBA7F44D6ba557f0706257deFa1` | Noir UltraPlonk verifier (generated) |

## Roles

| Role | Holder | Contract |
|---|---|---|
| MINTER_ROLE (1) | Deployer | All xStock tokens |
| SUBMITTER_ROLE (2) | Deployer | ConsensusSettlement |
| Owner | Deployer | All contracts |

## Environment Variables

```bash
export OG_RPC=https://evmrpc-testnet.0g.ai
export TSLAX=0x2dC821592626Ab6375E5B84b4EF94eCb1478EBa6
export AAPLX=0xbF7878757DcbCF28E024aEFa7B03B3cF6267aE8c
export NVDAX=0xC82291F9b5f22FAecB5530DcF54E6D2086b45fde
export GOOGX=0x4eb8fEe5CBDBC434ee88F7781948e8799Ed7Fb82
export AMZNX=0xEfF7d05B11CC848Bf7EAbA74a6021B0567aB841d
export METAX=0xa483a4342F4D4D8e27364876cF55f3baaFb93310
export SPYX=0xC04F35d970F08F09c23b8C97538fCf62a57c255C
export NDXX=0x88B700918cd051ffa6B02274DE53584695E06bce
export MSTRX=0x6ce30D33c6091425bbe162cA353CDbffF7C090d9
export MSFTX=0x26F1B3D351Cb8a23E6cCeA93d5143Dc1e185cFA0
export JPMX=0x43da4eCBa6DfD3b901Dd5238a77608c52C420e5b
export VX=0x781C0de58df40F5f6a1b661F3CB0a5B551A3b683
export XOMX=0x2bEd346a985866B497E052fB807bE4E3FB4D015E
export LLYX=0xa37e660218B3De658444648873d3016E1aD1681d
export LVMHX=0x425f1CF3e4f3762B58a32d24a80b7d767Af58441
export CONSENSUS=0x3dBCdad5Da3a7f345353d8387c7BE6EBe5F6524f
export PROOF_OF_SOLVENCY=0x9ad38b9e70a23BE95186C5935930C6Ab05C49dD9
export HONK_VERIFIER=0x71E560eC76Ac0CBA7F44D6ba557f0706257deFa1
```
