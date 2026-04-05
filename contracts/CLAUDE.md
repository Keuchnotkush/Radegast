# Contracts — Radegast

Solidity smart contracts for tokenized xStocks, AI consensus settlement, and ZK proof of solvency.

## Stack
- Solidity 0.8.24, Foundry, Solady (ERC20, OwnableRoles)
- Optimizer: 10 runs (dev setting)

## Contracts
| Contract | Purpose |
|---|---|
| `XStockMock` | ERC-20 tokenized stock with price oracle, mint/burn via MINTER_ROLE |
| `ConsensusSettlement` | Records AI consensus votes (score, confidence, label, provider agreement) with 0G DA hash |
| `ProofOfSolvency` | Stores ZK attestations — verifier contract validates Noir proofs, emits verifyId for bank checks |
| `ProofRegistry` | Simplified attestation store — submit/check without ZK verifier |
| `MockUSDC` | ERC-20 mock stablecoin for demo trading |

## Deploy
15 xStock tokens: TSLAx, AAPLx, NVDAx, GOOGx, AMZNx, METAx, SPYx, NDXx, MSTRx, MSFTx, JPMx, Vx, XOMx, LLYx, LVMHx.
Deployer gets MINTER_ROLE on all tokens and SUBMITTER_ROLE on ConsensusSettlement.

## Commands
```bash
forge build        # Compile
forge test         # Run tests
forge script script/Deploy.s.sol --rpc-url $RPC --broadcast  # Deploy
```

## Conventions
- Solady over OpenZeppelin (smaller, gas-optimized)
- Role-based access via OwnableRoles (`_ROLE_0`, `_ROLE_1`, etc.)
- Prices stored as uint192 (USD cents or scaled), timestamps as uint64/uint32
- Short variable names in structs for tight packing
