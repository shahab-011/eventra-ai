# ─────────────────────────────────────────────────────────────────────────────
# Eventra AI Service
#
# GPU build  (NVIDIA g4dn.xlarge — T4):
#   docker build -t eventra-ai .
#
# CPU build  (dev / t3 instances):
#   docker build --build-arg BASE=cpu -t eventra-ai .
#
# Run:
#   docker run --gpus all -p 8000:8000 \
#     -e QUALITY_THRESHOLD=0.30 \
#     -e DET_THRESHOLD=0.50 \
#     eventra-ai
# ─────────────────────────────────────────────────────────────────────────────

ARG BASE=gpu

# ── CPU base ─────────────────────────────────────────────────────────────────
FROM python:3.11-slim AS base-cpu
ENV ONNX_PKG="onnxruntime>=1.17,<2"

# ── GPU base (CUDA 12.1 / cuDNN 8) ───────────────────────────────────────────
FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04 AS base-gpu
ENV ONNX_PKG="onnxruntime-gpu>=1.17,<2"

# Install Python 3.11 on the Ubuntu/CUDA base
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3.11 python3.11-dev python3-pip && \
    ln -sf /usr/bin/python3.11 /usr/bin/python3 && \
    ln -sf /usr/bin/python3.11 /usr/bin/python && \
    rm -rf /var/lib/apt/lists/*

# ── Shared layers ────────────────────────────────────────────────────────────
FROM base-${BASE} AS final

# Runtime libs for OpenCV + libraw (needed by rawpy for RAW camera files)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libsm6 libxext6 libxrender1 libgomp1 curl \
    libraw-dev libjpeg-dev libpng-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt && \
    pip3 install --no-cache-dir "${ONNX_PKG}"

# Pre-download insightface buffalo_l model weights (~380 MB) at build time
# so the first container start is fast.  Uses CPU regardless of build target.
RUN python3 -c "\
from insightface.app import FaceAnalysis; \
a = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'], \
    allowed_modules=['detection','recognition']); \
a.prepare(ctx_id=-1, det_size=(160,160)); \
print('buffalo_l model weights cached')"

COPY . .

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s \
    CMD curl -sf http://localhost:8000/health | python3 -c \
        "import sys,json; d=json.load(sys.stdin); sys.exit(0 if d['status']=='ok' else 1)"

CMD ["uvicorn", "main:app", \
     "--host", "0.0.0.0", "--port", "8000", \
     "--workers", "1", \
     "--timeout-keep-alive", "30"]
