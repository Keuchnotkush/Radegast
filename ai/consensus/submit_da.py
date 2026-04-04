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
