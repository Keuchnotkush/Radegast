"""Wrapper Python pour 0G Compute via sidecar Node.js."""
import asyncio
import json
import os
import logging
from pathlib import Path
from typing import Optional, List

logger = logging.getLogger(__name__)

SCRIPT_PATH = Path(__file__).parent.parent / "scripts" / "og_compute_call.mjs"


async def _run_node(args: list, timeout: int = 15) -> dict:
    """Run the Node.js sidecar async and return parsed JSON."""
    cmd = ["node", str(SCRIPT_PATH)] + args
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env={**os.environ},
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        except asyncio.TimeoutError:
            proc.kill()
            await proc.communicate()
            return {"error": "Timeout"}

        output = stdout.decode().strip()
        if not output:
            return {"error": stderr.decode() or "No output"}
        return json.loads(output)
    except json.JSONDecodeError:
        return {"error": f"Invalid JSON: {output[:200]}"}
    except Exception as e:
        return {"error": str(e)}


async def list_services() -> List[dict]:
    """List available LLM services on 0G Compute."""
    result = await _run_node(["list"], timeout=15)
    if "error" in result:
        logger.error(f"[0G Compute] List failed: {result['error']}")
        return []
    return result.get("services", [])


async def setup_ledger(amount: str = "0.1") -> dict:
    """Deposit funds into 0G Compute ledger."""
    return await _run_node(["setup", amount], timeout=30)


async def call_provider(provider_address: str, prompt_json: str) -> Optional[str]:
    """
    Call an LLM provider via 0G Compute broker.
    Returns the content string or None on failure.
    """
    result = await _run_node(["call", provider_address, prompt_json], timeout=15)
    if "error" in result:
        logger.warning(f"[0G Compute] Call failed: {result['error']}")
        return None

    content = result.get("content", "")
    verified = result.get("verified", False)
    logger.info(f"[0G Compute] Response from {provider_address[:10]}... verified={verified}")
    return content
