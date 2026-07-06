# LogicLand Intelligence Engine
FROM python:3.12-slim AS base
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
# Shell form so ${PORT} (set by Render/Railway/Fly) is honored; falls back to 8000.
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
