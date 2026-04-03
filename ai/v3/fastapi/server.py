import asyncio, os
from contextlib import asynccontextmanager
from fastapi import FastAPI

async def bg():
    while True:
        await asyncio.sleep(int(os.getenv("AGENT_INTERVAL","60")))

@asynccontextmanager
async def lifespan(app):
    t = asyncio.create_task(bg()); yield; t.cancel()

app = FastAPI(title="Radegast AI", lifespan=lifespan)

@app.get("/health")
def health(): return {"status":"ok"}

@app.post("/api/consensus")
def consensus(p: dict):
    return {"consensus_label":"MEDIUM","consensus_score":50.0,"confidence":1.0,"suggestions":["Mock"]}
