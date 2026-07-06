# LogicLand Engine setup — Windows (PowerShell)
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..\logicland-engine")

Write-Host "==> Creating virtual environment (.venv)"
python -m venv .venv
& .\.venv\Scripts\Activate.ps1

Write-Host "==> Upgrading pip"
python -m pip install --upgrade pip

Write-Host "==> Installing dependencies"
pip install -r requirements.txt -r requirements-dev.txt

if (-not (Test-Path .env)) {
    Write-Host "==> Creating .env from template"
    Copy-Item .env.example .env
    Write-Host "    Remember to set LLM_API_KEY in logicland-engine\.env"
}

Write-Host "==> Running smoke tests"
pytest

Write-Host ""
Write-Host "Done. Start the engine with:"
Write-Host "  cd logicland-engine; .\.venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8000"
