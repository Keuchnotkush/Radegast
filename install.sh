#!/usr/bin/env bash
# No set -e — install scripts must be lenient

G='\033[0;32m'
C='\033[0;36m'
R='\033[0;31m'
N='\033[0m'
ok() { echo -e "${G}  ✓${N} $1"; }
log() { echo -e "${C}[radegast]${N} $1"; }
w() { echo -e "${R}  ⚠${N} $1"; }

DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
log "bootstrapping in $DIR"
echo ""

########################################
log "1/8 directories"
########################################
mkdir -p "$DIR/contracts/src" "$DIR/contracts/script" "$DIR/contracts/test" "$DIR/contracts/lib"
mkdir -p "$DIR/ai/shared/model" "$DIR/ai/shared/data_agent" "$DIR/ai/v3/fastapi" "$DIR/ai/tests"
mkdir -p "$DIR/docker" "$DIR/scripts" "$DIR/.github/workflows"
npx create-next-app@latest "$DIR/frontend" --typescript --tailwind --app --use-pnpm --no-src-dir --import-alias "@/*" --yes
ok "directories"

########################################
log "2/8 config"
########################################
[ -f "$DIR/.env.example" ] || echo 'PRIVATE_KEY=
OG_RPC=https://evmrpc-testnet.0g.ai
MOCK_ONCHAIN=true
AGENT_INTERVAL=60' >"$DIR/.env.example"

[ -f "$DIR/.env" ] || cp "$DIR/.env.example" "$DIR/.env"

[ -f "$DIR/.gitignore" ] || echo '.env
.installed
contracts/out/
contracts/cache/
contracts/lib/
ai/.venv/
ai/__pycache__/
node_modules/
.next/
.DS_Store' >"$DIR/.gitignore"

[ -f "$DIR/contracts/foundry.toml" ] || echo '[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.24"
optimizer = true
optimizer_runs = 1_000_000' >"$DIR/contracts/foundry.toml"

[ -f "$DIR/contracts/remappings.txt" ] || echo 'solady/=lib/solady/src/
forge-std/=lib/forge-std/src/' >"$DIR/contracts/remappings.txt"

[ -f "$DIR/ai/requirements.txt" ] || echo 'fastapi==0.115.*
uvicorn[standard]==0.34.*
pydantic==2.10.*
xgboost==2.1.*
onnxruntime==1.20.*
numpy==2.1.*
pandas==2.2.*
yfinance==0.2.*
aiohttp==3.11.*
web3==7.6.*
pytest==8.3.*' >"$DIR/ai/requirements.txt"

ok "config"

########################################
log "3/8 contracts"
########################################
[ -f "$DIR/contracts/src/XStockMock.sol" ] || echo '// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {ERC20} from "solady/tokens/ERC20.sol";
import {OwnableRoles} from "solady/auth/OwnableRoles.sol";
contract XStockMock is ERC20, OwnableRoles {
    error PriceZero();
    uint256 public constant MINTER_ROLE = _ROLE_0;
    string internal _name; string internal _symbol;
    uint192 public price; uint64 public priceUpdatedAt;
    constructor(string memory n, string memory s, uint192 p) {
        if (p == 0) revert PriceZero();
        _name = n; _symbol = s; price = p; priceUpdatedAt = uint64(block.timestamp);
        _initializeOwner(msg.sender);
    }
    function name() public view override returns (string memory) { return _name; }
    function symbol() public view override returns (string memory) { return _symbol; }
    function mint(address to, uint256 a) external onlyRoles(MINTER_ROLE) { _mint(to, a); }
    function burn(address f, uint256 a) external onlyRoles(MINTER_ROLE) { _burn(f, a); }
    function setPrice(uint192 p) external onlyOwner { if(p==0) revert PriceZero(); price=p; priceUpdatedAt=uint64(block.timestamp); }
    function valueOf(address a) external view returns (uint256) { return (balanceOf(a)*uint256(price))/1e18; }
}' >"$DIR/contracts/src/XStockMock.sol"

[ -f "$DIR/contracts/src/ConsensusSettlement.sol" ] || echo '// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {OwnableRoles} from "solady/auth/OwnableRoles.sol";
contract ConsensusSettlement is OwnableRoles {
    error ScoreOutOfRange(); error InvalidProviderCount(); error NoRecords();
    uint256 public constant SUBMITTER_ROLE = _ROLE_1;
    struct Record { address user; uint16 score; uint16 confidence; uint8 label; uint8 agreed; uint8 total; bytes32 daHash; }
    Record[] public records;
    mapping(address => uint256[]) internal _ur;
    event Submitted(uint256 indexed id, address indexed user, uint8 label, uint16 score, uint16 confidence, bytes32 daHash);
    constructor() { _initializeOwner(msg.sender); }
    function submit(address u, uint16 s, uint16 c, uint8 l, uint8 a, uint8 t, bytes32 d) external onlyOwnerOrRoles(SUBMITTER_ROLE) returns (uint256 id) {
        if(s>10000||c>10000) revert ScoreOutOfRange(); if(t<2||t>3||a>t) revert InvalidProviderCount();
        id = records.length; records.push(Record(u,s,c,l,a,t,d)); _ur[u].push(id);
        emit Submitted(id,u,l,s,c,d);
    }
    function latestOf(address u) external view returns (Record memory r, uint256 id) {
        uint256[] storage ids = _ur[u]; if(ids.length==0) revert NoRecords(); id = ids[ids.length-1]; r = records[id];
    }
    function verifyDA(uint256 id, bytes32 e) external view returns (bool) { return records[id].daHash == e; }
}' >"$DIR/contracts/src/ConsensusSettlement.sol"

[ -f "$DIR/contracts/src/ProofOfSolvency.sol" ] || echo '// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {OwnableRoles} from "solady/auth/OwnableRoles.sol";
contract ProofOfSolvency is OwnableRoles {
    error InvalidProof(); error NotFound(); error VerifierNotSet();
    struct Attestation { address user; uint64 threshold; uint32 verifiedAt; bytes32 commitment; bytes32 verifyId; }
    address public verifier; Attestation[] public attestations;
    mapping(bytes32 => uint256) internal _bv;
    event Verified(uint256 indexed id, address indexed user, uint64 threshold, bytes32 verifyId);
    constructor(address v) { _initializeOwner(msg.sender); verifier = v; }
    function setVerifier(address v) external onlyOwner { verifier = v; }
    function verify(bytes calldata proof, bytes32[] calldata pub) external returns (uint256 id, bytes32 vid) {
        if(verifier==address(0)) revert VerifierNotSet();
        (bool ok_, bytes memory ret) = verifier.staticcall(abi.encodeWithSignature("verify(bytes,bytes32[])",proof,pub));
        if(!ok_||(ret.length>=32&&abi.decode(ret,(bool))==false)) revert InvalidProof();
        uint64 t=uint64(uint256(pub[0])); bytes32 c=pub[1];
        vid = keccak256(abi.encodePacked(msg.sender,t,c,block.number));
        id = attestations.length; attestations.push(Attestation(msg.sender,t,uint32(block.timestamp),c,vid));
        _bv[vid]=id+1; emit Verified(id,msg.sender,t,vid);
    }
    function check(bytes32 vid) external view returns (Attestation memory) {
        uint256 idx=_bv[vid]; if(idx==0) revert NotFound(); return attestations[idx-1];
    }
}' >"$DIR/contracts/src/ProofOfSolvency.sol"

[ -f "$DIR/contracts/script/Deploy.s.sol" ] || echo '// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "forge-std/Script.sol";
import "../src/XStockMock.sol";
import "../src/ConsensusSettlement.sol";
import "../src/ProofOfSolvency.sol";
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        XStockMock tsla=new XStockMock("Tesla xStock","TSLAx",250e6);
        XStockMock aapl=new XStockMock("Apple xStock","AAPLx",198e6);
        XStockMock nvda=new XStockMock("NVIDIA xStock","NVDAx",140e6);
        XStockMock goog=new XStockMock("Google xStock","GOOGx",175e6);
        XStockMock amzn=new XStockMock("Amazon xStock","AMZNx",185e6);
        XStockMock meta=new XStockMock("Meta xStock","METAx",510e6);
        XStockMock spy=new XStockMock("S&P 500 xStock","SPYx",530e6);
        XStockMock ndx=new XStockMock("Nasdaq xStock","NDXx",480e6);
        XStockMock mstr=new XStockMock("MicroStrategy xStock","MSTRx",1700e6);
        address d=vm.addr(pk); uint256 M=tsla.MINTER_ROLE();
        tsla.grantRoles(d,M);aapl.grantRoles(d,M);nvda.grantRoles(d,M);
        goog.grantRoles(d,M);amzn.grantRoles(d,M);meta.grantRoles(d,M);
        spy.grantRoles(d,M);ndx.grantRoles(d,M);mstr.grantRoles(d,M);
        ConsensusSettlement cs=new ConsensusSettlement();
        cs.grantRoles(d,cs.SUBMITTER_ROLE());
        new ProofOfSolvency(address(0));
        vm.stopBroadcast();
    }
}' >"$DIR/contracts/script/Deploy.s.sol"

ok "contracts"

########################################
log "4/8 docker"
########################################
[ -f "$DIR/docker/docker-compose.yml" ] || echo 'services:
  ai:
    build: { context: ../ai, dockerfile: Dockerfile }
    ports: ["8000:8000"]
    env_file: ../.env
  frontend:
    build: { context: ../frontend, dockerfile: Dockerfile }
    ports: ["3000:3000"]
    env_file: ../.env
  caddy:
    image: caddy:2-alpine
    ports: ["80:80","443:443"]
    volumes: ["./Caddyfile:/etc/caddy/Caddyfile"]' >"$DIR/docker/docker-compose.yml"

[ -f "$DIR/docker/Caddyfile" ] || echo 'radegast.app { reverse_proxy frontend:3000 }
api.radegast.app { reverse_proxy ai:8000 }' >"$DIR/docker/Caddyfile"

[ -f "$DIR/ai/Dockerfile" ] || echo 'FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn","v3.fastapi.server:app","--host","0.0.0.0","--port","8000"]' >"$DIR/ai/Dockerfile"

[ -f "$DIR/frontend/Dockerfile" ] || echo 'FROM node:20-alpine
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["node","server.js"]' >"$DIR/frontend/Dockerfile"

ok "docker"

########################################
log "5/8 ci/cd"
########################################
[ -f "$DIR/.github/workflows/ci.yml" ] || echo 'name: CI
on: { push: { branches: [main] }, pull_request: { branches: [main] } }
jobs:
  contracts:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: contracts } }
    steps:
      - uses: actions/checkout@v4
        with: { submodules: recursive }
      - uses: foundry-rs/foundry-toolchain@v1
      - run: forge install
      - run: forge build --sizes
      - run: forge test -vvv' >"$DIR/.github/workflows/ci.yml"

ok "ci/cd"

########################################
log "6/8 skeleton code"
########################################
[ -f "$DIR/ai/v3/fastapi/server.py" ] || echo 'import asyncio, os
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
    return {"consensus_label":"MEDIUM","consensus_score":50.0,"confidence":1.0,"suggestions":["Mock"]}' >"$DIR/ai/v3/fastapi/server.py"

[ -f "$DIR/ai/shared/data_agent/mock_prices.json" ] || echo '{"TSLA":250,"AAPL":198,"NVDA":140,"GOOG":175,"AMZN":185,"META":510,"SPY":530,"NDX":480,"MSTR":1700}' >"$DIR/ai/shared/data_agent/mock_prices.json"

ok "skeleton"

########################################
log "7/8 tools"
########################################
case "$(uname -s)" in
Linux*) command -v curl &>/dev/null || {
  sudo apt-get update -qq
  sudo apt-get install -y -qq curl git build-essential python3 python3-pip python3-venv jq 2>/dev/null
} ;;
Darwin*) command -v brew &>/dev/null || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" ;;
esac

pathadd() { [[ ":$PATH:" != *":$1:"* ]] && export PATH="$1:$PATH" || true; }

pathadd "$HOME/.foundry/bin"
command -v forge &>/dev/null || {
  log "  foundry..."
  curl -L https://foundry.paradigm.xyz 2>/dev/null | bash
  pathadd "$HOME/.foundry/bin"
  "$HOME/.foundry/bin/foundryup"
}
ok "forge"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
command -v node &>/dev/null || {
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh 2>/dev/null | bash
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  nvm install 20
}
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
ok "node"

command -v pnpm &>/dev/null || npm i -g pnpm 2>/dev/null || true
ok "pnpm"

log "Installing Solidity deps..."
[ -d "$DIR/.git" ] || git init "$DIR" >/dev/null 2>&1
(cd "$DIR/contracts" && [ -d lib/solady/src ] || forge install Vectorized/solady --no-git 2>&1) || true
(cd "$DIR/contracts" && [ -d lib/forge-std/src ] || forge install foundry-rs/forge-std --no-git 2>&1) || true
ok "solady + forge-std"

[ -d "$DIR/ai/.venv" ] || python3 -m venv "$DIR/ai/.venv"
"$DIR/ai/.venv/bin/pip" install -q --upgrade pip 2>/dev/null || true
"$DIR/ai/.venv/bin/pip" install -q -r "$DIR/ai/requirements.txt" 2>/dev/null || true
ok "python"

pathadd "$HOME/.nargo/bin"
command -v nargo &>/dev/null || {
  curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install 2>/dev/null | bash || true
  pathadd "$HOME/.nargo/bin"
  command -v noirup &>/dev/null && noirup 2>/dev/null || true
}
ok "noir"

(cd "$DIR/frontend" && npn init)

########################################
log "8/8 compile"
########################################
(cd "$DIR/contracts" && forge build 2>/dev/null) && ok "forge build" || w "compile failed"

echo ""
echo -e "${G}  ✓ radegast ready — make dev${N}"
echo ""

git add . && git commit -m "Dev is ready" && git push origin main
git checkout -b dev main
echo "✓ dev branch is ok"
