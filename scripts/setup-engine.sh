#!/usr/bin/env bash
# LogicLand Engine setup — macOS / Linux
set -euo pipefail
cd "$(dirname "$0")/../logicland-engine"

echo "==> Creating virtual environment (.venv)"
python3 -m venv .venv
source .venv/bin/activate

echo "==> Upgrading pip"
python -m pip install --upgrade pip

echo "==> Installing dependencies"
pip install -r requirements.txt -r requirements-dev.txt

if [ ! -f .env ]; then
  echo "==> Creating .env from template"
  cp .env.example .env
  echo "    Remember to set LLM_API_KEY in logicland-engine/.env"
fi

echo "==> Running smoke tests"
pytest

echo ""
echo "Done. Start the engine with:"
echo "  cd logicland-engine && source .venv/bin/activate && uvicorn main:app --reload --port 8000"
