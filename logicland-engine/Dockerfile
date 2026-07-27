# LogicLand Intelligence Engine — production image (ADR-024)
FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

WORKDIR /app

# Non-root runtime user.
RUN adduser --disabled-password --gecos "" appuser

# Dependencies first for layer caching.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application code.
COPY . .
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Container-level liveness so orchestrators can restart a wedged process.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import os,urllib.request,sys; \
url='http://127.0.0.1:'+os.environ.get('PORT','8000')+'/health'; \
sys.exit(0 if urllib.request.urlopen(url, timeout=4).status==200 else 1)"

# Shell form so ${PORT} (injected by Render/Railway/Fly) is honoured.
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
