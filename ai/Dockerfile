FROM python:3.11-slim

# Node.js for 0G sidecar scripts (og_compute_call.mjs, og_storage_upload.mjs)
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Node.js dependencies for 0G SDKs
COPY scripts/package.json scripts/package-lock.json scripts/
RUN cd scripts && npm ci --production

COPY . .
EXPOSE 8000
CMD ["uvicorn","v3.fastapi.server:app","--host","0.0.0.0","--port","8000"]
