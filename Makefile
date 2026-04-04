-include .env
export
OG_RPC ?= https://evmrpc-testnet.0g.ai

dev: .installed
	@echo "  ⚡ radegast — anvil:8545 api:8000 backend:4000 app:3000"
	@trap 'kill 0' INT; \
		anvil --chain-id 31337 --silent & \
		cd ai && .venv/bin/uvicorn v3.fastapi.server:app --host 0.0.0.0 --port 8000 --reload & \
		cd backend && node --watch server.js & \
		(test -f frontend/package.json && cd frontend && pnpm dev || sleep infinity) & \
		wait

.installed: install.sh
	@chmod +x install.sh && ./install.sh && touch .installed
front:
	@cd frontend && pnpm dev
backend:
	@cd backend && npm install && node --watch server.js
install:
	@rm -f .installed && $(MAKE) .installed

build:
	@cd contracts && forge build
test:
	@cd contracts && forge test -vvv
deploy-og:
	@cd contracts && forge script script/Deploy.s.sol --rpc-url $(OG_RPC) --broadcast -vvvv
deploy-local:
	@cd contracts && forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
deploy: up
	@echo "  ✓ deploy: containers up"
ai-train:
	@cd ai && .venv/bin/python shared/model/train.py
up:
	@docker compose -f docker/docker-compose.yml up -d --build
down:
	@docker compose -f docker/docker-compose.yml down
clean:
	@rm -rf contracts/out contracts/cache ai/__pycache__ .installed

# Run all checks locally (faster than waiting for CI)
check:
	@echo "  ▸ contracts"; cd contracts && forge build --sizes && forge test -vvv
	@echo "  ▸ ai"; cd ai && .venv/bin/python -m py_compile v3/fastapi/server.py && .venv/bin/pytest tests/ -v --tb=short 2>/dev/null || true
	@echo "  ▸ frontend"; cd frontend && pnpm lint 2>/dev/null || true && pnpm build
	@echo "  ✓ all checks passed"

# Open a PR from current branch to dev (needs gh cli)
pr:
	@branch=$$(git branch --show-current); \
	if [ "$$branch" = "dev" ] || [ "$$branch" = "main" ]; then \
		echo "  ✗ you're on $$branch, create a feature branch first"; exit 1; \
	fi; \
	git push -u origin $$branch && \
	gh pr create --base dev --fill --head $$branch && \
	echo "  ✓ PR created"

# Safe push: pull rebase first to avoid conflicts during rushes
push:
	@branch=$$(git branch --show-current); \
	git add -A && \
	git diff --cached --quiet && echo "nothing to commit" && exit 0 || true; \
	git commit -m "wip: $$(date +%H:%M)" && \
	git pull --rebase origin $$branch && \
	git push origin $$branch
	@echo "  ✓ pushed"

# Quick sync: fetch + rebase without pushing
sync:
	@branch=$$(git branch --show-current); \
	git fetch origin && \
	git rebase origin/$$branch && \
	echo "  ✓ synced with origin/$$branch"

.PHONY: dev install build test deploy-og deploy-local deploy ai-train up down clean check pr push sync front backend
