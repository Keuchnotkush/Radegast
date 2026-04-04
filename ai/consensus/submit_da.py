"""Submit ConsensusResult to 0G Storage for data availability.

Production mode shells out to scripts/og_storage_upload.mjs (Node.js)
which uses @0gfoundation/0g-ts-sdk — the only reliable 0G Storage SDK.
"""
import json
import os
import hashlib
import logging
import subprocess
from pathlib import Path
from typing import Optional
from dataclasses import asdict

from shared.types import ConsensusResult

logger = logging.getLogger(__name__)

MOCK_DA = os.getenv("MOCK_DA", "true").lower() == "true"
UPLOAD_SCRIPT = Path(__file__).parent.parent / "scripts" / "og_storage_upload.mjs"
UPLOAD_TIMEOUT_S = 60


async def submit_to_da(result: ConsensusResult) -> Optional[str]:
    """
    Upload ConsensusResult JSON to 0G Storage.
    Returns rootHash (used as daHash for on-chain cross-reference).

    MOCK_DA=true  → deterministic SHA-256 hash (no network call).
    MOCK_DA=false → calls og_storage_upload.mjs via subprocess.
    """
    result_json = json.dumps(asdict(result), default=str)

    if MOCK_DA:
        mock_hash = "0x" + hashlib.sha256(result_json.encode()).hexdigest()
        logger.info(f"[MOCK DA] daHash = {mock_hash[:18]}...")
        return mock_hash

    return _upload_via_node(result_json)


def _upload_via_node(result_json: str) -> str:
    """Shell out to the Node.js 0G Storage upload script."""
    fallback_hash = "0x" + hashlib.sha256(result_json.encode()).hexdigest()

    if not UPLOAD_SCRIPT.exists():
        logger.error(f"[0G Storage] Script not found: {UPLOAD_SCRIPT}")
        return fallback_hash

    try:
        proc = subprocess.run(
            ["node", str(UPLOAD_SCRIPT), result_json],
            capture_output=True,
            text=True,
            timeout=UPLOAD_TIMEOUT_S,
            env={**os.environ},
        )

        if proc.returncode == 0:
            upload_result = json.loads(proc.stdout)
            root_hash = upload_result.get("rootHash")
            tx_hash = upload_result.get("txHash")
            logger.info(
                f"[0G Storage] Uploaded consensus blob, "
                f"rootHash={root_hash[:18]}... tx={tx_hash}"
            )
            return root_hash

        error = proc.stderr.strip() or "Unknown error"
        logger.error(f"[0G Storage] Upload failed (rc={proc.returncode}): {error}")
        return fallback_hash

    except subprocess.TimeoutExpired:
        logger.error(f"[0G Storage] Upload timed out ({UPLOAD_TIMEOUT_S}s)")
        return fallback_hash
    except Exception as e:
        logger.error(f"[0G Storage] Exception: {e}")
        return fallback_hash
