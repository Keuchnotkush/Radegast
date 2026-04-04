"""Execute rebalance moves on-chain via xStock contracts."""
import os
import json
import logging
from typing import List
from web3 import Web3

from shared.types import RebalanceMove
from shared.constants import XSTOCK_ADDRESSES

logger = logging.getLogger(__name__)

OG_RPC = os.getenv("OG_RPC", "https://evmrpc-testnet.0g.ai")
PRIVATE_KEY = os.getenv("PRIVATE_KEY", "")
MOCK_TRADES = os.getenv("MOCK_TRADES", "true").lower() == "true"

# Minimal ABI for mint() and burn() — Solady ERC-20 with roles
XSTOCK_ABI = [
    {
        "inputs": [{"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"}],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"name": "from", "type": "address"}, {"name": "amount", "type": "uint256"}],
        "name": "burn",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
]


async def execute_rebalance(user_address: str, moves: List[RebalanceMove]) -> List[dict]:
    """
    Execute burn/mint on xStock contracts for each move.

    - sell -> burn(user, amount)
    - buy  -> mint(user, amount)

    Returns list of {token, action, pct, tx_hash, success}.
    """
    results = []

    if MOCK_TRADES:
        for move in moves:
            mock_tx = f"0xmock_trade_{hash(f'{move.token}{move.action}{move.pct}') & 0xFFFFFFFF:08x}"
            logger.info(f"[MOCK TRADE] {move.action} {move.pct}% {move.token} -> {mock_tx}")
            results.append({
                "token": move.token,
                "action": move.action,
                "pct": move.pct,
                "tx_hash": mock_tx,
                "success": True,
            })
        return results

    if not PRIVATE_KEY:
        logger.error("[TRADE] PRIVATE_KEY not set")
        return results

    try:
        w3 = Web3(Web3.HTTPProvider(OG_RPC))
        account = w3.eth.account.from_key(PRIVATE_KEY)

        for move in moves:
            try:
                contract_addr = XSTOCK_ADDRESSES.get(move.token)
                if not contract_addr:
                    logger.error(f"[TRADE] No contract address for {move.token}")
                    results.append({"token": move.token, "action": move.action, "pct": move.pct, "tx_hash": None, "success": False})
                    continue

                contract = w3.eth.contract(
                    address=Web3.to_checksum_address(contract_addr),
                    abi=XSTOCK_ABI,
                )

                # Simplified amount: pct/10 tokens (10% -> 1 token)
                amount = w3.to_wei(move.pct / 10, "ether")
                user = Web3.to_checksum_address(user_address)

                if move.action == "sell":
                    fn = contract.functions.burn(user, amount)
                else:
                    fn = contract.functions.mint(user, amount)

                tx = fn.build_transaction({
                    "from": account.address,
                    "nonce": w3.eth.get_transaction_count(account.address),
                    "gas": 100000,
                    "gasPrice": w3.eth.gas_price,
                })

                signed = account.sign_transaction(tx)
                tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
                receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)

                tx_hex = tx_hash.hex()
                success = receipt.status == 1
                logger.info(f"[TRADE] {move.action} {move.pct}% {move.token} -> {tx_hex[:18]}... {'OK' if success else 'FAIL'}")

                results.append({
                    "token": move.token,
                    "action": move.action,
                    "pct": move.pct,
                    "tx_hash": tx_hex,
                    "success": success,
                })

            except Exception as e:
                logger.error(f"[TRADE] {move.action} {move.token} failed: {e}")
                results.append({"token": move.token, "action": move.action, "pct": move.pct, "tx_hash": None, "success": False})

        return results

    except Exception as e:
        logger.error(f"[TRADE] Fatal error: {e}")
        return results
