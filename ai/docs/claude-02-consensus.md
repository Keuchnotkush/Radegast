# claude-02-consensus.md — Consensus Pipeline

## What this file creates
```
ai/consensus/
├── __init__.py
├── orchestrator.py        # 3 async calls + full pipeline
├── vote.py                # Majority vote (Counter.most_common)
├── submit_da.py           # ConsensusResult → 0G Storage → rootHash (= daHash)
└── submit_onchain.py      # web3.py → ConsensusSettlement.submit()
```

## Dependencies on shared (already built)
```python
from shared.constants import (
    TICKERS, MIN_PROVIDERS_REQUIRED, PROVIDER_TIMEOUT_S,
    RISK_HIGH_THRESHOLD, RISK_MEDIUM_THRESHOLD
)
from shared.types import (
    RiskOutput, RiskLabel, ConsensusResult, ConsensusRequest,
    PortfolioInput, RebalanceMove, Mode
)
from shared.data_agent.fetch import fetch_features
```

## Dependencies on other modules
```python
# These are called BY orchestrator but BUILT in other terminals:
# from strategist.agent import generate_suggestions, build_rebalance_moves  → claude-03
# from chat.advisor import ... → claude-04

# For now, orchestrator.py should work WITHOUT agent.py by returning
# ConsensusResult with empty suggestions/moves. Agent is plugged in later.
```

---

## File 1: `ai/consensus/orchestrator.py`

### Purpose
The main pipeline: fetch features → call 3 providers → vote → settle → return ConsensusResult.

```python
"""Orchestrator: runs the full consensus pipeline."""
import asyncio
import aiohttp
import json
import os
import logging
from typing import List, Optional

from shared.constants import MIN_PROVIDERS_REQUIRED, PROVIDER_TIMEOUT_S
from shared.types import (
    RiskOutput, RiskLabel, ConsensusResult, ConsensusRequest,
    PortfolioInput, Mode
)
from shared.data_agent.fetch import fetch_features
from consensus.vote import compute_consensus
from consensus.submit_da import submit_to_da
from consensus.submit_onchain import submit_onchain

logger = logging.getLogger(__name__)

# Provider URLs from env
PROVIDERS = [
    {
        "name": "xgboost",
        "url": os.getenv("XGBOOST_URL", "http://localhost:8000/v1/chat/completions"),
        "fallback_url": None,  # fallback is ONNX.js browser-side
    },
    {
        "name": "llm_a",
        "url": os.getenv("LLM_A_URL", ""),
        "fallback_url": os.getenv("LLM_A_FALLBACK_URL", ""),  # Groq
    },
    {
        "name": "llm_b",
        "url": os.getenv("LLM_B_URL", ""),
        "fallback_url": os.getenv("LLM_B_FALLBACK_URL", ""),  # Groq
    },
]


async def run_consensus(request: ConsensusRequest) -> ConsensusResult:
    """
    Full consensus pipeline:
    1. Fetch 61 features
    2. Call 3 providers in parallel (timeout 8s)
    3. Vote (majority)
    4. Submit to 0G Storage (DA)
    5. Submit on-chain (ConsensusSettlement)
    6. Return ConsensusResult
    """
    # Step 1: Fetch features
    portfolio = fetch_features(request.positions)

    # Step 2: Call 3 providers in parallel
    responses = await _call_providers(portfolio)

    # Filter valid responses
    valid = [r for r in responses if r is not None]
    if len(valid) < MIN_PROVIDERS_REQUIRED:
        logger.error(f"Only {len(valid)} valid responses, need {MIN_PROVIDERS_REQUIRED}")
        # Return a safe default
        return ConsensusResult(
            consensus_label=RiskLabel.MEDIUM,
            consensus_score=50.0,
            confidence=0.0,
            providers_agreed=f"{len(valid)}/3",
            suggestions=["Insufficient provider responses — defaulting to MEDIUM risk"],
        )

    # Step 3: Vote
    consensus = compute_consensus(valid)

    # Step 4: Submit to 0G Storage (DA proxy)
    da_hash = await submit_to_da(consensus)
    consensus.da_hash = da_hash

    # Step 5: Submit on-chain
    if request.mode == Mode.TRADE:
        tx_hash = await submit_onchain(request.user, consensus)
        consensus.tx_hash = tx_hash

    # Step 6: Generate suggestions or moves (plugged in from agent.py)
    # Import here to avoid circular imports
    try:
        from strategist.agent import generate_suggestions, build_rebalance_moves
        if request.mode == Mode.CONSEIL:
            consensus.suggestions = generate_suggestions(consensus, request.positions, request.strategy)
        else:
            consensus.moves = build_rebalance_moves(request.positions, request.strategy)
    except ImportError:
        logger.warning("agent.py not yet available — returning consensus without suggestions")

    return consensus


async def _call_providers(portfolio: PortfolioInput) -> List[Optional[RiskOutput]]:
    """Call 3 providers in parallel with timeout."""
    tasks = [
        _call_single_provider(p, portfolio) for p in PROVIDERS
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    outputs = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            logger.warning(f"Provider {PROVIDERS[i]['name']} failed: {result}")
            outputs.append(None)
        else:
            outputs.append(result)
    return outputs


async def _call_single_provider(provider: dict, portfolio: PortfolioInput) -> Optional[RiskOutput]:
    """Call a single provider. Try primary URL, then fallback."""
    urls = [provider["url"], provider.get("fallback_url", "")]
    urls = [u for u in urls if u]  # remove empty

    for url in urls:
        try:
            result = await _http_call(url, portfolio, provider["name"])
            if result:
                return result
        except Exception as e:
            logger.warning(f"Provider {provider['name']} at {url} failed: {e}")
            continue

    return None


async def _http_call(url: str, portfolio: PortfolioInput, source: str) -> Optional[RiskOutput]:
    """Make HTTP call to a provider endpoint."""
    payload = {
        "model": "radogost-risk" if source == "xgboost" else "default",
        "messages": [
            {"role": "user", "content": json.dumps({"features": portfolio.features, "positions": portfolio.positions})}
        ]
    }

    timeout = aiohttp.ClientTimeout(total=PROVIDER_TIMEOUT_S)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.post(url, json=payload, headers={"Content-Type": "application/json"}) as resp:
            if resp.status != 200:
                return None
            data = await resp.json()

            # Parse OpenAI-format response
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            parsed = json.loads(content)

            return RiskOutput(
                risk_score=float(parsed["risk_score"]),
                risk_label=RiskLabel(parsed["risk_label"]),
                top_factors=parsed.get("top_factors", []),
                source=parsed.get("source", source),
            )
```

---

## File 2: `ai/consensus/vote.py`

### Purpose
Take 2-3 RiskOutputs, compute majority vote.

```python
"""Majority vote across provider responses."""
from collections import Counter
from typing import List

from shared.types import RiskOutput, RiskLabel, ConsensusResult


def compute_consensus(outputs: List[RiskOutput]) -> ConsensusResult:
    """
    Majority vote on risk_label.
    Score = average of all risk_scores.
    Confidence = agreed / total.
    """
    total = len(outputs)
    assert total >= 2, f"Need at least 2 outputs, got {total}"

    # Majority vote on label
    labels = [o.risk_label for o in outputs]
    label_counts = Counter(labels)
    consensus_label, agreed = label_counts.most_common(1)[0]

    # Average score
    consensus_score = sum(o.risk_score for o in outputs) / total

    # Confidence
    confidence = round(agreed / total, 2)

    # Merge top_factors (deduplicated, ordered by frequency)
    all_factors = []
    for o in outputs:
        all_factors.extend(o.top_factors)
    factor_counts = Counter(all_factors)
    top_factors = [f for f, _ in factor_counts.most_common(3)]

    return ConsensusResult(
        consensus_label=consensus_label,
        consensus_score=round(consensus_score, 1),
        confidence=confidence,
        providers_agreed=f"{agreed}/{total}",
    )
```

---

## File 3: `ai/consensus/submit_da.py`

### Purpose
Upload ConsensusResult to 0G Storage as a blob. Return rootHash as daHash.

**NOTE: We use 0G Storage as DA proxy (not native DA which requires a Go node).**

```python
"""Submit ConsensusResult to 0G Storage for data availability."""
import json
import os
import hashlib
import logging
from typing import Optional
from dataclasses import asdict

from shared.types import ConsensusResult

logger = logging.getLogger(__name__)

OG_STORAGE_INDEXER = os.getenv("OG_STORAGE_INDEXER", "https://indexer-storage-testnet-turbo.0g.ai")
OG_RPC = os.getenv("OG_RPC", "https://evmrpc-testnet.0g.ai")
PRIVATE_KEY = os.getenv("PRIVATE_KEY", "")
MOCK_DA = os.getenv("MOCK_DA", "true").lower() == "true"


async def submit_to_da(result: ConsensusResult) -> Optional[str]:
    """
    Upload ConsensusResult JSON to 0G Storage.
    Returns rootHash (used as daHash for on-chain cross-reference).
    
    In MOCK_DA mode, returns a deterministic hash of the result.
    In production, uses 0g-storage-sdk (Python) to upload.
    """
    result_json = json.dumps(asdict(result), default=str)

    if MOCK_DA:
        # Deterministic mock hash
        mock_hash = "0x" + hashlib.sha256(result_json.encode()).hexdigest()
        logger.info(f"[MOCK DA] daHash = {mock_hash[:18]}...")
        return mock_hash

    try:
        # Real 0G Storage upload via Python SDK
        # pip install 0g-storage-sdk
        from core.indexer import Indexer
        from core.file import ZgFile
        from eth_account import Account

        indexer = Indexer(OG_STORAGE_INDEXER)
        account = Account.from_key(PRIVATE_KEY)

        # Write result to temp file, upload, delete
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write(result_json)
            temp_path = f.name

        file = ZgFile.from_file_path(temp_path)
        upload_opts = {
            'tags': b'\x00',
            'finalityRequired': True,
            'taskSize': 10,
            'expectedReplica': 1,
            'skipTx': False,
            'account': account,
        }

        upload_result, err = indexer.upload(file, OG_RPC, account, upload_opts)
        file.close()
        os.unlink(temp_path)

        if err is None:
            root_hash = upload_result['rootHash']
            logger.info(f"[0G Storage] Uploaded consensus blob, rootHash = {root_hash[:18]}...")
            return root_hash
        else:
            logger.error(f"[0G Storage] Upload failed: {err}")
            # Fallback to mock
            return "0x" + hashlib.sha256(result_json.encode()).hexdigest()

    except Exception as e:
        logger.error(f"[0G Storage] Exception: {e}")
        return "0x" + hashlib.sha256(result_json.encode()).hexdigest()
```

---

## File 4: `ai/consensus/submit_onchain.py`

### Purpose
Call ConsensusSettlement.submit() on 0G Chain via web3.py.

```python
"""Submit consensus result on-chain via ConsensusSettlement contract."""
import os
import json
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


async def submit_onchain(user: str, result: ConsensusResult) -> Optional[str]:
    """
    Call ConsensusSettlement.submit(user, score, confidence, label, agreed, total, daHash).
    Score and confidence in basis points (72.3% = 7230).
    
    Returns tx_hash or None.
    MOCK_ONCHAIN=true by default until Manny deploys the contract.
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

        # ABI for submit() — Manny provides the full ABI
        # submit(address user, uint16 score, uint16 confidence, uint8 label,
        #        uint8 agreed, uint8 total, bytes32 daHash)
        abi = json.loads(os.getenv("CONSENSUS_ABI", "[]"))
        if not abi:
            logger.error("CONSENSUS_ABI not set")
            return None

        contract = w3.eth.contract(
            address=Web3.to_checksum_address(CONSENSUS_SETTLEMENT),
            abi=abi
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
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)

        tx_hex = tx_hash.hex()
        logger.info(f"[ON-CHAIN] ConsensusSettlement.submit() tx = {tx_hex[:18]}...")
        return tx_hex

    except Exception as e:
        logger.error(f"[ON-CHAIN] Failed: {e}")
        return None
```

---

## Verification
```bash
cd ai
python -c "
from consensus.vote import compute_consensus
from shared.types import RiskOutput, RiskLabel

outputs = [
    RiskOutput(risk_score=75, risk_label=RiskLabel.HIGH, top_factors=['TSLA vol'], source='xgboost'),
    RiskOutput(risk_score=68, risk_label=RiskLabel.HIGH, top_factors=['NVDA rsi'], source='llm_a'),
    RiskOutput(risk_score=45, risk_label=RiskLabel.MEDIUM, top_factors=['SPY ret'], source='llm_b'),
]
result = compute_consensus(outputs)
print(f'Label: {result.consensus_label}')       # HIGH
print(f'Score: {result.consensus_score}')        # 62.7
print(f'Confidence: {result.confidence}')        # 0.67
print(f'Agreed: {result.providers_agreed}')      # 2/3
"
```
