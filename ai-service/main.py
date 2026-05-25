"""
Eventra AI Face Recognition Service
FastAPI + insightface buffalo_l (RetinaFace detection + ArcFace 512-d embeddings).

onnxruntime-gpu is used when CUDA is available; the code auto-detects providers.

Endpoints:
  GET  /health         — liveness probe
  POST /warmup         — pre-warm CUDA kernels (call once after container start)
  POST /detect         — detect all faces in an image, return embeddings + quality
  POST /embed-selfie   — single best-face embedding (rejects 0 or >1 faces)
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import Optional

import cv2
import httpx
import numpy as np
import onnxruntime as ort
from fastapi import FastAPI, HTTPException
from insightface.app import FaceAnalysis
from pydantic import BaseModel

# ─── Logging ────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger("eventra.ai")

# ─── Config (all tunable via env vars) ──────────────────────────
QUALITY_THRESHOLD: float = float(os.getenv("QUALITY_THRESHOLD", "0.30"))
DET_THRESHOLD:     float = float(os.getenv("DET_THRESHOLD",     "0.50"))
DET_SIZE:          int   = int(os.getenv("DET_SIZE",            "640"))
MODEL_NAME:        str   = os.getenv("MODEL_NAME",              "buffalo_l")

# Auto-select execution providers: prefer GPU, fall back to CPU
_available = ort.get_available_providers()
PROVIDERS: list[str] = [p for p in ("CUDAExecutionProvider", "CPUExecutionProvider") if p in _available]
logger.info("ONNX providers: %s", PROVIDERS)

# ─── Model (loaded once at startup) ─────────────────────────────
face_app: Optional[FaceAnalysis] = None


def _load_model() -> FaceAnalysis:
    app = FaceAnalysis(
        name=MODEL_NAME,
        providers=PROVIDERS,
        allowed_modules=["detection", "recognition"],
    )
    # ctx_id=0 → GPU 0; ctx_id=-1 → CPU
    ctx_id = 0 if "CUDAExecutionProvider" in PROVIDERS else -1
    app.prepare(ctx_id=ctx_id, det_thresh=DET_THRESHOLD, det_size=(DET_SIZE, DET_SIZE))
    logger.info("insightface %s loaded (ctx_id=%d)", MODEL_NAME, ctx_id)
    return app


@asynccontextmanager
async def lifespan(_: FastAPI):
    global face_app
    face_app = _load_model()
    yield


app = FastAPI(title="Eventra AI Service", version="1.0.0", lifespan=lifespan)

# ─── Utilities ───────────────────────────────────────────────────

async def _download_image(url: str) -> np.ndarray:
    """Download an image URL and decode to a BGR numpy array."""
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        resp = await client.get(url)
    if resp.status_code != 200:
        raise HTTPException(400, f"Image download failed (HTTP {resp.status_code}): {url}")
    arr = np.frombuffer(resp.content, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(400, "Could not decode image — unsupported format or corrupted file")
    return img


def _laplacian_blur(roi: np.ndarray) -> float:
    """Laplacian variance — higher = sharper.  Normalised to [0, 1] at 500."""
    if roi.size == 0:
        return 0.5
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    return float(min(1.0, cv2.Laplacian(gray, cv2.CV_64F).var() / 500.0))


def _compute_quality(face, img: np.ndarray) -> float:
    """
    Combined quality score in [0, 1]:
      35% detection confidence (det_score)
      25% face size relative to image area (normalised at 10% fill)
      20% pose score  (penalise roll/pitch/yaw deviation from frontal)
      20% sharpness   (Laplacian variance of the face ROI)
    """
    h, w = img.shape[:2]
    x1, y1, x2, y2 = (max(0, int(v)) for v in face.bbox)
    x2, y2 = min(w, x2), min(h, y2)
    face_area = max(0, x2 - x1) * max(0, y2 - y1)

    size_score  = min(1.0, (face_area / max(1, w * h)) / 0.10)
    blur_score  = _laplacian_blur(img[y1:y2, x1:x2])
    det_score   = float(face.det_score)

    pose_score = 1.0
    if hasattr(face, "pose") and face.pose is not None:
        roll, pitch, yaw = (float(v) for v in face.pose)
        deviation  = (abs(roll) + abs(pitch) + abs(yaw)) / 3.0
        pose_score = max(0.0, 1.0 - deviation / 40.0)

    q = 0.35 * det_score + 0.25 * size_score + 0.20 * pose_score + 0.20 * blur_score
    return round(min(1.0, max(0.0, q)), 4)


# ─── Request / Response schemas ──────────────────────────────────

class DetectRequest(BaseModel):
    imageUrl: str

class EmbedRequest(BaseModel):
    imageUrl: str


# ─── Endpoints ───────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status":       "ok",
        "model_loaded": face_app is not None,
        "providers":    PROVIDERS,
    }


@app.post("/warmup")
def warmup():
    """Run a blank frame through the model to pre-warm CUDA kernels / JIT."""
    if face_app is None:
        raise HTTPException(503, "Model not loaded")
    blank = np.zeros((640, 640, 3), dtype=np.uint8)
    face_app.get(blank)
    logger.info("Warmup complete")
    return {"status": "warmed", "providers": PROVIDERS}


@app.post("/detect")
async def detect_faces(body: DetectRequest):
    """
    Detect all faces in an image.

    Returns a list of face objects:
      bbox        [x1, y1, x2, y2]
      det_score   detection confidence [0, 1]
      quality     combined quality score [0, 1]
      embedding   512-d ArcFace vector — null if quality < QUALITY_THRESHOLD
    """
    if face_app is None:
        raise HTTPException(503, "Model not loaded")

    img   = await _download_image(body.imageUrl)
    faces = face_app.get(img)

    results = []
    for face in faces:
        quality = _compute_quality(face, img)
        include_emb = face.embedding is not None and quality >= QUALITY_THRESHOLD
        results.append({
            "bbox":      [round(float(v), 2) for v in face.bbox],
            "det_score": round(float(face.det_score), 4),
            "quality":   quality,
            "embedding": face.embedding.tolist() if include_emb else None,
        })

    logger.info("detect: %d faces found in %s", len(results), body.imageUrl[:80])
    return {"faces": results, "count": len(results)}


@app.post("/embed-selfie")
async def embed_selfie(body: EmbedRequest):
    """
    Generate a single embedding for a guest selfie.
    Rejects images with zero or multiple faces.
    """
    if face_app is None:
        raise HTTPException(503, "Model not loaded")

    img   = await _download_image(body.imageUrl)
    faces = face_app.get(img)

    if len(faces) == 0:
        raise HTTPException(422, "No face detected — please use a clear, well-lit selfie")
    if len(faces) > 1:
        raise HTTPException(422, f"{len(faces)} faces detected — selfie must contain exactly one person")

    face    = faces[0]
    quality = _compute_quality(face, img)

    if face.embedding is None:
        raise HTTPException(422, "Could not generate embedding — face quality too low")

    return {
        "embedding": face.embedding.tolist(),
        "det_score": round(float(face.det_score), 4),
        "quality":   quality,
        "bbox":      [round(float(v), 2) for v in face.bbox],
    }
