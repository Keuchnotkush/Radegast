"""Submit consensus result on-chain via ConsensusSettlement contract."""
import os
import logging
from typing import Optional

from shared.types import ConsensusResult, RiskLabel

logger = logging.getLogger(__name__)

MOCK_ONCHAIN = os.getenv("MOCK_ONCHAIN", "true").lower() == "true"
OG_RPC = os.getenv("OG_RPC", "https://evmrpc-testnet.0g.ai")
PRIVATE_KEY = os.getenv("PRIVATE_KEY", "")
CONSENSUS_SETTLEMENT = os.getenv("CONSENSUS_SETTLEMENT", "")

# Label mapping: LOW=0, MEDIUM=1, HIGH=2
LABEL_TO_INT = {
    RiskLabel.LOW: 0,
    RiskLabel.MEDIUM: 1,
    RiskLabel.HIGH: 2,
}

# ABI for ConsensusSettlement.submit() — from Foundry build output
SUBMIT_ABI = [
    {
        "type": "function",
        "name": "submit",
        "inputs": [
            {"name": "u", "type": "address", "internalType": "address"},
            {"name": "s", "type": "uint16", "internalType": "uint16"},
            {"name": "c", "type": "uint16", "internalType": "uint16"},
            {"name": "l", "type": "uint8", "internalType": "uint8"},
            {"name": "a", "type": "uint8", "internalType": "uint8"},
            {"name": "t", "type": "uint8", "internalType": "uint8"},
            {"name": "d", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [
            {"name": "id", "type": "uint256", "internalType": "uint256"},
        ],
        "stateMutability": "nonpayable",
    }
]


async def submit_onchain(user: str, result: ConsensusResult) -> Optional[str]:
    """
    Call ConsensusSettlement.submit(user, score, confidence, label, agreed, total, daHash).
    Score and confidence in basis points (72.3 → 7230, 0.67 → 6700).

    Returns tx_hash or None.
    """
    if MOCK_ONCHAIN:
        mock_tx = f"0xmock_{hash(f'{user}{result.consensus_score}') & 0xFFFFFFFF:08x}"
        logger.info(f"[MOCK ONCHAIN] tx_hash = {mock_tx}")
        return mock_tx

    if not CONSENSUS_SETTLEMENT or not PRIVATE_KEY:
        logger.error("CONSENSUS_SETTLEMENT or PRIVATE_KEY not set")
        return None

    try:
        from web3 import Web3

        w3 = Web3(Web3.HTTPProvider(OG_RPC))
        account = w3.eth.account.from_key(PRIVATE_KEY)

        contract = w3.eth.contract(
            address=Web3.to_checksum_address(CONSENSUS_SETTLEMENT),
            abi=SUBMIT_ABI,
        )

        # Convert to basis points
        score_bp = int(result.consensus_score * 100)      # 72.3 → 7230
        confidence_bp = int(result.confidence * 10000)     # 0.67 → 6700
        label_int = LABEL_TO_INT[result.consensus_label]

        # Parse agreed/total from "2/3"
        parts = result.providers_agreed.split("/")
        agreed = int(parts[0])
        total = int(parts[1])

        # daHash as bytes32
        da_hash_bytes = bytes.fromhex(result.da_hash[2:] if result.da_hash else "0" * 64)
        da_hash_bytes = da_hash_bytes[:32].ljust(32, b'\x00')

        # Build and send transaction
        tx = contract.functions.submit(
            Web3.to_checksum_address(user),
            score_bp,
            confidence_bp,
            label_int,
            agreed,
            total,
            da_hash_bytes,
        ).build_transaction({
            'from': account.address,
            'nonce': w3.eth.get_transaction_count(account.address),
            'gas': 200000,
            'gasPrice': w3.eth.gas_price,
        })

        signed = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)

        tx_hex = "0x" + tx_hash.hex()
        logger.info(f"[ON-CHAIN] ConsensusSettlement.submit() tx = {tx_hex[:18]}...")
        return tx_hex

    except Exception as e:
        logger.error(f"[ON-CHAIN] Failed: {e}")
        return None
