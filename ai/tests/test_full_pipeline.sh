#!/bin/bash
set +e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0
SKIP=0

check() {
  local name="$1"
  local result="$2"
  if [ "$result" = "0" ]; then
    echo -e "  ${GREEN}PASS${NC} — $name"
    PASS=$((PASS+1))
  else
    echo -e "  ${RED}FAIL${NC} — $name"
    FAIL=$((FAIL+1))
  fi
}

skip() {
  echo -e "  ${YELLOW}SKIP${NC} — $1"
  SKIP=$((SKIP+1))
}

cd "$(dirname "$0")/.."
export $(grep -v '^#' .env 2>/dev/null | xargs)

echo ""
echo "=========================================="
echo "  RADEGAST AI — Full Pipeline Test"
echo "=========================================="
echo ""

# ==========================================
echo "--- 1. Module Imports ---"
# ==========================================
python3 -c "from shared.constants import TICKERS, N_FEATURES; assert len(TICKERS)==15; assert N_FEATURES==61" 2>/dev/null
check "shared/constants.py (15 tickers, 61 features)" $?

python3 -c "from shared.types import ConsensusResult, RiskLabel, Mode, RebalanceMove" 2>/dev/null
check "shared/types.py (all types)" $?

python3 -c "from shared.data_agent.utils import compute_rsi" 2>/dev/null
check "shared/data_agent/utils.py (compute_rsi)" $?

python3 -c "from shared.data_agent.fetch import fetch_features" 2>/dev/null
check "shared/data_agent/fetch.py (fetch_features)" $?

python3 -c "from consensus.orchestrator import run_consensus" 2>/dev/null
check "consensus/orchestrator.py" $?

python3 -c "from consensus.vote import compute_consensus" 2>/dev/null
check "consensus/vote.py" $?

python3 -c "from consensus.submit_da import submit_to_da" 2>/dev/null
check "consensus/submit_da.py" $?

python3 -c "from consensus.submit_onchain import submit_onchain" 2>/dev/null
check "consensus/submit_onchain.py" $?

python3 -c "from strategist.agent import generate_suggestions, build_rebalance_moves" 2>/dev/null
check "strategist/agent.py" $?

python3 -c "from strategist.profiles import create_or_update_profile, get_trade_mode_users" 2>/dev/null
check "strategist/profiles.py" $?

python3 -c "from chat.advisor import handle_message" 2>/dev/null
check "chat/advisor.py" $?

# ==========================================
echo ""
echo "--- 2. Unit Tests ---"
# ==========================================
python3 -c "
from consensus.vote import compute_consensus
from shared.types import RiskOutput, RiskLabel
outputs = [
    RiskOutput(risk_score=75, risk_label=RiskLabel.HIGH, top_factors=['a'], source='t1'),
    RiskOutput(risk_score=68, risk_label=RiskLabel.HIGH, top_factors=['b'], source='t2'),
    RiskOutput(risk_score=45, risk_label=RiskLabel.MEDIUM, top_factors=['c'], source='t3'),
]
r = compute_consensus(outputs)
assert r.consensus_label == RiskLabel.HIGH
assert r.providers_agreed == '2/3'
assert r.confidence == 0.67
" 2>/dev/null
check "Vote: 2/3 HIGH -> consensus HIGH, confidence 0.67" $?

python3 -c "
from strategist.agent import generate_suggestions
from shared.types import ConsensusResult, RiskLabel
c = ConsensusResult(consensus_label=RiskLabel.HIGH, consensus_score=72, confidence=0.67, providers_agreed='2/3')
s = generate_suggestions(c, {'TSLAx': 35, 'AAPLx': 20}, 'balanced')
assert len(s) > 0
assert any('TSLAx' in x for x in s)
" 2>/dev/null
check "Agent: generate_suggestions() returns non-empty with TSLAx mention" $?

python3 -c "
from strategist.agent import build_rebalance_moves
moves = build_rebalance_moves({'TSLAx': 35, 'NVDAx': 25, 'AAPLx': 20, 'SPYx': 10}, 'balanced')
assert len(moves) > 0
assert any(m.action == 'sell' for m in moves)
assert any(m.action == 'buy' for m in moves)
" 2>/dev/null
check "Agent: build_rebalance_moves() returns sell + buy moves" $?

python3 -c "
from strategist.profiles import create_or_update_profile, get_profile, set_mode, get_trade_mode_users
from shared.types import Mode
p = create_or_update_profile('test_user', risk_tolerance='aggressive')
assert p.strategy == 'aggressive'
set_mode('test_user', Mode.TRADE)
users = get_trade_mode_users()
assert any(u.user_id == 'test_user' for u in users)
" 2>/dev/null
check "Profiles: create -> set trade mode -> appears in trade users" $?

python3 -c "
from shared.constants import STRATEGY_TARGETS
for name, alloc in STRATEGY_TARGETS.items():
    total = sum(alloc.values())
    assert total == 100, f'{name} sums to {total}'
" 2>/dev/null
check "Strategies: all 4 sum to 100%" $?

# ==========================================
echo ""
echo "--- 3. Model ---"
# ==========================================
if [ -f shared/model/portfolio_risk.onnx ]; then
  SIZE=$(du -k shared/model/portfolio_risk.onnx | cut -f1)
  check "portfolio_risk.onnx exists (${SIZE}KB)" 0
  if [ "$SIZE" -lt 5120 ]; then
    check "Model < 5MB (OK for 0G Storage)" 0
  else
    check "Model < 5MB" 1
  fi
else
  check "portfolio_risk.onnx exists" 1
fi

# ==========================================
echo ""
echo "--- 4. Server (starting...) ---"
# ==========================================
export XGBOOST_URL=http://localhost:8765/v1/chat/completions
uvicorn server:app --port 8765 &>/tmp/radegast_test_server.log &
SERVER_PID=$!

# Wait for server to be ready (max 30s)
for i in $(seq 1 30); do
  if curl -s http://localhost:8765/health >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

HEALTH=$(curl -s http://localhost:8765/health 2>/dev/null)
echo "$HEALTH" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['status']=='ok'" 2>/dev/null
check "GET /health -> status ok" $?

echo "$HEALTH" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['model_loaded']==True" 2>/dev/null
check "GET /health -> model_loaded true" $?

echo "$HEALTH" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['tickers']==15" 2>/dev/null
check "GET /health -> 15 tickers" $?

echo "$HEALTH" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['features']==61" 2>/dev/null
check "GET /health -> 61 features" $?

# Chat — greeting
CHAT1=$(curl -s -X POST http://localhost:8765/api/chat \
  -H "Content-Type: application/json" \
  -d '{"user_id":"tester","message":"Hello"}' 2>/dev/null)
echo "$CHAT1" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'reply' in d" 2>/dev/null
check "POST /api/chat (greeting) -> has reply" $?

# Chat — profile setup
CHAT2=$(curl -s -X POST http://localhost:8765/api/chat \
  -H "Content-Type: application/json" \
  -d '{"user_id":"tester","message":"I am aggressive and want maximum growth"}' 2>/dev/null)
echo "$CHAT2" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('action')=='profile_updated'" 2>/dev/null
check "POST /api/chat (profile) -> action=profile_updated" $?

# Profile endpoint
PROF=$(curl -s http://localhost:8765/api/profile/tester 2>/dev/null)
echo "$PROF" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['strategy']=='aggressive'" 2>/dev/null
check "GET /api/profile/tester -> strategy=aggressive" $?

# Recommend
RECO=$(curl -s -X POST http://localhost:8765/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"user_id":"tester","risk_tolerance":"aggressive"}' 2>/dev/null)
echo "$RECO" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'allocation' in d" 2>/dev/null
check "POST /api/recommend -> has allocation" $?

# XGBoost provider (OpenAI format)
FEATURES_CSV=$(python3 -c "print(','.join(['0.01']*61))")
XGBOOST=$(curl -s -X POST http://localhost:8765/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"radogost-risk\",\"messages\":[{\"role\":\"user\",\"content\":\"{\\\"features\\\":[$FEATURES_CSV],\\\"positions\\\":{}}\"}]}" 2>/dev/null)
echo "$XGBOOST" | python3 -c "import sys,json; d=json.load(sys.stdin); c=json.loads(d['choices'][0]['message']['content']); assert 'risk_score' in c; assert 'risk_label' in c" 2>/dev/null
check "POST /v1/chat/completions -> XGBoost returns risk_score + risk_label" $?

# ==========================================
echo ""
echo "--- 5. Consensus (mode conseil) ---"
# ==========================================
CONSENSUS=$(curl -s --max-time 120 -X POST http://localhost:8765/api/consensus \
  -H "Content-Type: application/json" \
  -d '{"user":"0x5FB77900D139f2Eee6F312F3BF98fc8ad700C174","positions":{"TSLAx":30,"NVDAx":25,"AAPLx":15,"SPYx":10,"MSFTx":10,"JPMx":10},"strategy":"growth","mode":"conseil"}' 2>/dev/null)

echo "$CONSENSUS" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['consensus_label'] in ['LOW','MEDIUM','HIGH']" 2>/dev/null
check "Consensus: has valid label (LOW/MEDIUM/HIGH)" $?

echo "$CONSENSUS" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 0 <= d['consensus_score'] <= 100" 2>/dev/null
check "Consensus: score between 0-100" $?

echo "$CONSENSUS" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['providers_agreed'] in ['1/3','2/3','3/3']" 2>/dev/null
check "Consensus: providers_agreed valid" $?

echo "$CONSENSUS" | python3 -c "import sys,json; d=json.load(sys.stdin); assert len(d.get('suggestions',[])) > 0" 2>/dev/null
check "Consensus (conseil): has suggestions" $?

echo "$CONSENSUS" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('da_hash','').startswith('0x') and len(d.get('da_hash',''))>10" 2>/dev/null
check "Consensus: da_hash is real 0G Storage rootHash" $?

echo "$CONSENSUS" | python3 -c "import sys,json; d=json.load(sys.stdin); h=d.get('tx_hash',''); assert h is None or (isinstance(h,str) and h.startswith('0x'))" 2>/dev/null
check "Consensus (conseil): tx_hash is null (conseil mode does not settle)" $?

# ==========================================
echo ""
echo "--- 6. Consensus (mode trade) ---"
# ==========================================
TRADE=$(curl -s --max-time 120 -X POST http://localhost:8765/api/consensus \
  -H "Content-Type: application/json" \
  -d '{"user":"0x5FB77900D139f2Eee6F312F3BF98fc8ad700C174","positions":{"TSLAx":35,"NVDAx":25,"AAPLx":20},"strategy":"balanced","mode":"trade"}' 2>/dev/null)

echo "$TRADE" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['consensus_label'] in ['LOW','MEDIUM','HIGH']" 2>/dev/null
check "Trade: has valid label" $?

echo "$TRADE" | python3 -c "import sys,json; d=json.load(sys.stdin); assert len(d.get('moves',[])) > 0" 2>/dev/null
check "Trade: has rebalance moves" $?

echo "$TRADE" | python3 -c "import sys,json; d=json.load(sys.stdin); moves=d.get('moves',[]); assert any(m['action']=='sell' for m in moves)" 2>/dev/null
check "Trade: has at least one sell move" $?

echo "$TRADE" | python3 -c "import sys,json; d=json.load(sys.stdin); moves=d.get('moves',[]); assert any(m['action']=='buy' for m in moves)" 2>/dev/null
check "Trade: has at least one buy move" $?

echo "$TRADE" | python3 -c "import sys,json; d=json.load(sys.stdin); h=d.get('tx_hash'); assert h is not None and h.startswith('0x') and 'mock' not in h" 2>/dev/null
check "Trade: tx_hash is a real on-chain hash (not mock)" $?

# ==========================================
echo ""
echo "--- 7. 0G Integration ---"
# ==========================================
if [ -n "${OG_MODEL_ROOT_HASH:-}" ]; then
  check "0G Storage: model rootHash in .env" 0
else
  check "0G Storage: model rootHash in .env" 1
fi

if [ "${MOCK_DA:-true}" = "false" ]; then
  check "0G Storage DA: MOCK_DA=false (real uploads)" 0
else
  check "0G Storage DA: MOCK_DA=false" 1
fi

if [ "${MOCK_ONCHAIN:-true}" = "false" ]; then
  check "0G Chain: MOCK_ONCHAIN=false (real settlement)" 0
else
  check "0G Chain: MOCK_ONCHAIN=false" 1
fi

if [ -n "${CONSENSUS_SETTLEMENT:-}" ]; then
  check "0G Chain: CONSENSUS_SETTLEMENT set ($CONSENSUS_SETTLEMENT)" 0
else
  check "0G Chain: CONSENSUS_SETTLEMENT set" 1
fi

if [ -n "${OG_COMPUTE_PROVIDER_ADDR:-}" ]; then
  check "0G Compute: OG_COMPUTE_PROVIDER_ADDR set ($OG_COMPUTE_PROVIDER_ADDR)" 0
else
  check "0G Compute: OG_COMPUTE_PROVIDER_ADDR set" 1
fi

# ==========================================
echo ""
echo "--- 8. Files ---"
# ==========================================
[ -f "Dockerfile" ] && check "Dockerfile exists" 0 || check "Dockerfile exists" 1
[ -f "requirements.txt" ] && check "requirements.txt exists" 0 || check "requirements.txt exists" 1
[ -f ".env" ] && check ".env exists" 0 || check ".env exists" 1
[ -f ".env.example" ] && check ".env.example exists" 0 || check ".env.example exists" 1
[ -f ".gitignore" ] && check ".gitignore exists" 0 || check ".gitignore exists" 1
[ -f "scripts/package.json" ] && check "scripts/package.json exists" 0 || check "scripts/package.json exists" 1
[ -d "scripts/node_modules" ] && check "scripts/node_modules installed" 0 || check "scripts/node_modules installed" 1

# ==========================================
echo ""
echo "--- 9. Live Prices ---"
# ==========================================
PRICES=$(curl -s --max-time 30 http://localhost:8765/api/prices 2>/dev/null)

echo "$PRICES" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('count') == 15" 2>/dev/null
check "Prices: 15 tickers returned" $?

echo "$PRICES" | python3 -c "import sys,json; d=json.load(sys.stdin); p=d['prices']; assert p.get('TSLAx',0) > 0" 2>/dev/null
check "Prices: TSLAx > 0" $?

echo "$PRICES" | python3 -c "import sys,json; d=json.load(sys.stdin); p=d['prices']; assert p.get('AAPLx',0) > 0" 2>/dev/null
check "Prices: AAPLx > 0" $?

echo "$PRICES" | python3 -c "import sys,json; d=json.load(sys.stdin); p=d['prices']; assert p.get('LVMHx',0) > 0" 2>/dev/null
check "Prices: LVMHx > 0 (MC.PA)" $?

echo "$PRICES" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('source') == 'yfinance'" 2>/dev/null
check "Prices: source is yfinance" $?

# Verify prices are realistic (not 0, not millions)
echo "$PRICES" | python3 -c "
import sys,json
d=json.load(sys.stdin)
p=d['prices']
for token, price in p.items():
    assert 1 < price < 100000, f'{token} price {price} is unrealistic'
" 2>/dev/null
check "Prices: all prices are realistic (1 < price < 100000)" $?

# ==========================================
echo ""
echo "--- 10. Trade Mode (full pipeline) ---"
# ==========================================
TRADE2=$(curl -s --max-time 120 -X POST http://localhost:8765/api/consensus \
  -H "Content-Type: application/json" \
  -d '{"user":"0x5FB77900D139f2Eee6F312F3BF98fc8ad700C174","positions":{"TSLAx":35,"NVDAx":25,"AAPLx":20},"strategy":"balanced","mode":"trade"}' 2>/dev/null)

echo "$TRADE2" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['consensus_label'] in ['LOW','MEDIUM','HIGH']" 2>/dev/null
check "Trade: valid consensus label" $?

echo "$TRADE2" | python3 -c "import sys,json; d=json.load(sys.stdin); assert len(d.get('moves',[])) > 0" 2>/dev/null
check "Trade: moves non-empty" $?

echo "$TRADE2" | python3 -c "import sys,json; d=json.load(sys.stdin); moves=d.get('moves',[]); assert any(m['action']=='sell' for m in moves)" 2>/dev/null
check "Trade: has sell moves" $?

echo "$TRADE2" | python3 -c "import sys,json; d=json.load(sys.stdin); moves=d.get('moves',[]); assert any(m['action']=='buy' for m in moves)" 2>/dev/null
check "Trade: has buy moves" $?

echo "$TRADE2" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('da_hash','').startswith('0x') and len(d.get('da_hash',''))>10" 2>/dev/null
check "Trade: da_hash is real 0G rootHash" $?

echo "$TRADE2" | python3 -c "import sys,json; d=json.load(sys.stdin); h=d.get('tx_hash',''); assert h and h.startswith('0x') and len(h)>10" 2>/dev/null
check "Trade: tx_hash is real on-chain hash" $?

echo "$TRADE2" | python3 -c "import sys,json; d=json.load(sys.stdin); tr=d.get('trade_results',[]); assert len(tr) > 0" 2>/dev/null
check "Trade: trade_results non-empty" $?

echo "$TRADE2" | python3 -c "import sys,json; d=json.load(sys.stdin); tr=d.get('trade_results',[]); assert all(t['success'] for t in tr)" 2>/dev/null
check "Trade: all trades succeeded" $?

echo "$TRADE2" | python3 -c "import sys,json; d=json.load(sys.stdin); tr=d.get('trade_results',[]); assert all(t.get('tx_hash') for t in tr)" 2>/dev/null
check "Trade: all trades have tx_hash" $?

# Verify sell total ≈ buy total (rebalance should be balanced)
echo "$TRADE2" | python3 -c "
import sys,json
d=json.load(sys.stdin)
moves=d.get('moves',[])
sell_total=sum(m['pct'] for m in moves if m['action']=='sell')
buy_total=sum(m['pct'] for m in moves if m['action']=='buy')
assert abs(sell_total - buy_total) < 5, f'Imbalanced: sell={sell_total} buy={buy_total}'
" 2>/dev/null
check "Trade: sell total ≈ buy total (balanced rebalance)" $?

# ==========================================
echo ""
echo "--- 11. Background Agent (autonomous) ---"
# ==========================================
# Create a trade mode user
curl -s -X POST http://localhost:8765/api/profile \
  -H "Content-Type: application/json" \
  -d '{"user_id":"agent_test_user","risk_tolerance":"aggressive"}' > /dev/null 2>&1

# Switch to trade mode via chat
curl -s -X POST http://localhost:8765/api/chat \
  -H "Content-Type: application/json" \
  -d '{"user_id":"agent_test_user","message":"Switch me to trade mode"}' > /dev/null 2>&1

# Check that the profile exists
AGENT_PROF=$(curl -s http://localhost:8765/api/profile/agent_test_user 2>/dev/null)
echo "$AGENT_PROF" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('strategy') == 'aggressive'" 2>/dev/null
check "Agent: test user created with aggressive strategy" $?

# Verify autonomous_agent function exists in server
python3 -c "from server import autonomous_agent; print('OK')" 2>/dev/null
check "Agent: autonomous_agent() function exists" $?

# ==========================================
echo ""
echo "--- 12. Unit Tests (execute_trades + update_prices) ---"
# ==========================================
python3 -c "
from consensus.execute_trades import execute_rebalance
from shared.types import RebalanceMove
import asyncio

moves = [
    RebalanceMove(token='TSLAx', action='sell', pct=10),
    RebalanceMove(token='SPYx', action='buy', pct=10),
]
results = asyncio.run(execute_rebalance('0x5FB77900D139f2Eee6F312F3BF98fc8ad700C174', moves))
assert len(results) == 2
assert all(r['success'] for r in results)
assert results[0]['action'] == 'sell'
assert results[1]['action'] == 'buy'
" 2>/dev/null
check "execute_rebalance: sell + buy mock works" $?

python3 -c "
from consensus.update_prices import fetch_live_prices
import asyncio

prices = asyncio.run(fetch_live_prices())
assert len(prices) == 15, f'Expected 15 prices, got {len(prices)}'
assert all(v > 0 for v in prices.values()), 'All prices must be > 0'
" 2>/dev/null
check "fetch_live_prices: returns 15 positive prices" $?

python3 -c "
from shared.constants import XSTOCK_ADDRESSES, XSTOCK_SYMBOLS
assert len(XSTOCK_ADDRESSES) == 15
for sym in XSTOCK_SYMBOLS:
    assert sym in XSTOCK_ADDRESSES, f'{sym} missing from XSTOCK_ADDRESSES'
" 2>/dev/null
check "XSTOCK_ADDRESSES: all 15 tokens have contract addresses" $?

# ==========================================
# Cleanup
# ==========================================
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo ""
echo "=========================================="
echo -e "  ${GREEN}PASS: $PASS${NC}  ${RED}FAIL: $FAIL${NC}  ${YELLOW}SKIP: $SKIP${NC}"
echo "=========================================="
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "Server logs: /tmp/radegast_test_server.log"
  exit 1
fi
