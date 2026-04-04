"""Smoke tests — vérifie que tous les modules s'importent et que le serveur répond."""
import pytest
from fastapi.testclient import TestClient


def test_imports():
    from shared.constants import TICKERS, N_FEATURES
    assert len(TICKERS) == 15
    assert N_FEATURES == 61


def test_types():
    from shared.types import ConsensusResult, RiskLabel
    r = ConsensusResult(
        consensus_label=RiskLabel.HIGH,
        consensus_score=72.0,
        confidence=0.67,
        providers_agreed="2/3",
    )
    assert r.consensus_label == RiskLabel.HIGH


def test_vote():
    from consensus.vote import compute_consensus
    from shared.types import RiskOutput, RiskLabel
    outputs = [
        RiskOutput(risk_score=75, risk_label=RiskLabel.HIGH, top_factors=["a"], source="test1"),
        RiskOutput(risk_score=45, risk_label=RiskLabel.MEDIUM, top_factors=["b"], source="test2"),
        RiskOutput(risk_score=80, risk_label=RiskLabel.HIGH, top_factors=["c"], source="test3"),
    ]
    result = compute_consensus(outputs)
    assert result.consensus_label == RiskLabel.HIGH
    assert result.providers_agreed == "2/3"


def test_agent():
    from strategist.agent import generate_suggestions, build_rebalance_moves
    from shared.types import ConsensusResult, RiskLabel
    consensus = ConsensusResult(
        consensus_label=RiskLabel.HIGH,
        consensus_score=72.0,
        confidence=0.67,
        providers_agreed="2/3",
    )
    positions = {"TSLAx": 35, "AAPLx": 20, "NVDAx": 15, "SPYx": 10}
    suggestions = generate_suggestions(consensus, positions, "balanced")
    assert len(suggestions) > 0

    moves = build_rebalance_moves(positions, "balanced")
    assert isinstance(moves, list)


def test_server_health():
    from server import app
    client = TestClient(app)
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["tickers"] == 15
    assert data["features"] == 61


def test_server_chat():
    from server import app
    client = TestClient(app)
    r = client.post("/api/chat", json={"user_id": "test1", "message": "Hello"})
    assert r.status_code == 200
    assert "reply" in r.json()


def test_server_profile():
    from server import app
    client = TestClient(app)
    r = client.post("/api/profile", json={
        "user_id": "test1",
        "risk_tolerance": "moderate",
    })
    assert r.status_code == 200
    assert r.json()["strategy"] == "balanced"
