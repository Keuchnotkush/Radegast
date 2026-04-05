"""Update xStock prices on-chain from live market data."""
import os
import logging
import yfinance as yf
from web3 import Web3

from shared.constants import TICKERS, XSTOCK_SYMBOLS, XSTOCK_ADDRESSES, TICKER_TO_XSTOCK

logger = logging.getLogger(__name__)

OG_RPC = os.getenv("OG_RPC", "https://evmrpc-testnet.0g.ai")
PRIVATE_KEY = os.getenv("PRIVATE_KEY", "")
MOCK_PRICES_UPDATE = os.getenv("MOCK_PRICES_UPDATE", "true").lower() == "true"

# Minimal ABI for setPrice() — check with Manny for exact function name
PRICE_ABI = [
    {
        "inputs": [{"name": "price", "type": "uint256"}],
        "name": "setPrice",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    }
]

YFINANCE_TO_XSTOCK = dict(zip(TICKERS, XSTOCK_SYMBOLS))


async def fetch_live_prices() -> dict:
    """
    Fetch latest close prices for all 15 tickers via yfinance.
    Returns: {"TSLAx": 250.34, "AAPLx": 198.12, ...}
    """
    try:
        data = yf.download(TICKERS, period="1d", interval="1d")["Close"]
        prices = {}
        for ticker in TICKERS:
            xstock = YFINANCE_TO_XSTOCK[ticker]
            price = float(data[ticker].iloc[-1])
            prices[xstock] = round(price, 2)
        logger.info(f"[PRICES] Fetched live prices for {len(prices)} tickers")
        return prices
    except Exception as e:
        logger.error(f"[PRICES] yfinance failed: {e}")
        return {}


async def update_prices_onchain(prices: dict = None) -> list:
    """
    Update xStock prices on-chain by calling setPrice() on each contract.
    Prices in USD, converted to wei (price * 1e18) for on-chain storage.
    """
    if prices is None:
        prices = await fetch_live_prices()

    if not prices:
        return []

    results = []

    if MOCK_PRICES_UPDATE:
        for xstock, price in prices.items():
            logger.info(f"[MOCK PRICE] {xstock} -> ${price}")
            results.append({"token": xstock, "price": price, "tx_hash": None, "success": True})
        return results

    if not PRIVATE_KEY:
        logger.error("[PRICES] PRIVATE_KEY not set")
        return []

    try:
        w3 = Web3(Web3.HTTPProvider(OG_RPC))
        account = w3.eth.account.from_key(PRIVATE_KEY)
        nonce = w3.eth.get_transaction_count(account.address)

        for xstock, price in prices.items():
            try:
                contract_addr = XSTOCK_ADDRESSES.get(xstock)
                if not contract_addr:
                    continue

                contract = w3.eth.contract(
                    address=Web3.to_checksum_address(contract_addr),
                    abi=PRICE_ABI,
                )

                # Price in wei: $250.34 -> 250340000000000000000
                price_wei = w3.to_wei(price, "ether")

                tx = contract.functions.setPrice(price_wei).build_transaction({
                    "from": account.address,
                    "nonce": nonce,
                    "gas": 50000,
                    "gasPrice": w3.eth.gas_price,
                })

                signed = account.sign_transaction(tx)
                tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
                w3.eth.wait_for_transaction_receipt(tx_hash, timeout=15)

                nonce += 1
                tx_hex = tx_hash.hex()
                logger.info(f"[PRICE] {xstock} -> ${price} (tx: {tx_hex[:18]}...)")
                results.append({"token": xstock, "price": price, "tx_hash": tx_hex, "success": True})

            except Exception as e:
                logger.error(f"[PRICE] {xstock} failed: {e}")
                results.append({"token": xstock, "price": price, "tx_hash": None, "success": False})
                nonce += 1

        return results

    except Exception as e:
        logger.error(f"[PRICES] Fatal error: {e}")
        return []
