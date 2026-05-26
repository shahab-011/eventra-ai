"""
Eventra AI — photo editing utilities.

  apply_lut(img, lut_id)        — apply a named colour grade (12 built-in presets)
  auto_correct(img, params)     — auto exposure / white-balance / contrast
  smooth_skin(img, strength)    — bilateral-filter skin tones
  dhash(img)                    — 64-bit perceptual hash (16-char hex)
  composition_score(img)        — rule-of-thirds saliency score [0,1]
  write_cube_files(out_dir)     — export all presets as .cube files for external tools

LUT tables are 17×17×17 float32 grids built at import time (~60 KB each, ~720 KB total).
"""

from __future__ import annotations

import os
import logging
import tempfile
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from scipy.interpolate import RegularGridInterpolator

logger = logging.getLogger("eventra.edit")

# ─── LUT grid ────────────────────────────────────────────────────

LUT_SIZE = 17
_ax = np.linspace(0.0, 1.0, LUT_SIZE, dtype=np.float32)
_R, _G, _B = np.meshgrid(_ax, _ax, _ax, indexing="ij")  # each (17,17,17)


# ─── Curve / colour helpers ──────────────────────────────────────

def _scurve(x: np.ndarray, a: float = 0.25) -> np.ndarray:
    """Symmetric S-curve — lifts midtones in a natural way."""
    return np.clip(x + a * x * (1.0 - x) * (2.0 * x - 1.0), 0.0, 1.0)

def _gamma(x: np.ndarray, g: float) -> np.ndarray:
    return np.power(np.clip(x, 1e-7, 1.0), g)

def _lift(x: np.ndarray, lift: float) -> np.ndarray:
    """Raise the black point — shadow lift without clipping whites."""
    return np.clip(x + lift * (1.0 - x), 0.0, 1.0)

def _sat(r: np.ndarray, g: np.ndarray, b: np.ndarray, s: float):
    luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return (
        np.clip(luma + s * (r - luma), 0.0, 1.0),
        np.clip(luma + s * (g - luma), 0.0, 1.0),
        np.clip(luma + s * (b - luma), 0.0, 1.0),
    )


# ─── 12 colour grade transforms ──────────────────────────────────
# Each takes (R, G, B) ndarrays in [0,1] and returns (R', G', B').

def _identity(r, g, b):
    return r, g, b

def _natural(r, g, b):
    r, g, b = _scurve(r, 0.18), _scurve(g, 0.18), _scurve(b, 0.18)
    r, g, b = _sat(r, g, b, 0.92)
    r = np.clip(r + 0.012 * (1.0 - r), 0.0, 1.0)
    b = np.clip(b * 0.975, 0.0, 1.0)
    return r, g, b

def _warm_wedding(r, g, b):
    r = np.clip(r * 1.06 + 0.025 * (1.0 - r), 0.0, 1.0)
    g = np.clip(g * 1.01 + 0.01  * (1.0 - g), 0.0, 1.0)
    b = np.clip(b * 0.86, 0.0, 1.0)
    r, g, b = _sat(r, g, b, 0.80)
    r, g, b = _lift(r, 0.03), _lift(g, 0.02), _lift(b, 0.01)
    return r, g, b

def _cool_corporate(r, g, b):
    r = np.clip(r * 0.95, 0.0, 1.0)
    b = np.clip(b * 1.09, 0.0, 1.0)
    r, g, b = _sat(r, g, b, 0.82)
    r, g, b = _scurve(r, 0.22), _scurve(g, 0.22), _scurve(b, 0.22)
    return r, g, b

def _vivid(r, g, b):
    r, g, b = _sat(r, g, b, 1.40)
    r, g, b = _scurve(r, 0.32), _scurve(g, 0.32), _scurve(b, 0.32)
    return r, g, b

def _bw_classic(r, g, b):
    luma = _scurve(0.2126 * r + 0.7152 * g + 0.0722 * b, 0.28)
    return luma, luma, luma

def _cinematic(r, g, b):
    # Teal shadows, orange highlights (classic film look)
    darkness = np.clip(1.0 - (r * g * b) ** 0.33, 0.0, 1.0)
    r = np.clip(r - 0.05 * darkness * (1.0 - r) + 0.045 * r * r, 0.0, 1.0)
    b = np.clip(b + 0.055 * darkness * (1.0 - b) - 0.04 * b * b, 0.0, 1.0)
    r, g, b = _sat(r, g, b, 1.08)
    r, g, b = _scurve(r, 0.14), _scurve(g, 0.14), _scurve(b, 0.14)
    return r, g, b

def _film_fade(r, g, b):
    r, g, b = _lift(r, 0.065), _lift(g, 0.060), _lift(b, 0.055)
    r, g, b = _sat(r, g, b, 0.72)
    r = np.clip(r * 0.92, 0.0, 1.0)
    g = np.clip(g * 0.90, 0.0, 1.0)
    b = np.clip(b * 0.90, 0.0, 1.0)
    return r, g, b

def _sunset(r, g, b):
    r = np.clip(r * 1.09, 0.0, 1.0)
    g = np.clip(g * 0.97, 0.0, 1.0)
    b = np.clip(b * 0.80, 0.0, 1.0)
    r, g, b = _sat(r, g, b, 1.12)
    r, g, b = _lift(r, 0.02), _lift(g, 0.015), _lift(b, 0.01)
    return r, g, b

def _golden_hour(r, g, b):
    r = np.clip(r * 1.07 + 0.025, 0.0, 1.0)
    g = np.clip(g * 1.02 + 0.005, 0.0, 1.0)
    b = np.clip(b * 0.76, 0.0, 1.0)
    r, g, b = _sat(r, g, b, 1.06)
    return r, g, b

def _matte(r, g, b):
    r, g, b = _lift(r, 0.08), _lift(g, 0.07), _lift(b, 0.07)
    r = np.clip(r * 0.88, 0.0, 1.0)
    g = np.clip(g * 0.88, 0.0, 1.0)
    b = np.clip(b * 0.88, 0.0, 1.0)
    r, g, b = _sat(r, g, b, 0.70)
    return r, g, b

def _high_key(r, g, b):
    r, g, b = _lift(r, 0.04), _lift(g, 0.04), _lift(b, 0.04)
    r, g, b = _gamma(r, 0.85), _gamma(g, 0.85), _gamma(b, 0.87)
    r, g, b = _sat(r, g, b, 0.86)
    return r, g, b


# ─── LUT metadata (name + human-readable description) ────────────

LUT_META: list[dict] = [
    {"id": "identity",       "name": "Identity",        "description": "No grade applied — pass-through"},
    {"id": "natural",        "name": "Natural",         "description": "Balanced tones with mild warmth and contrast"},
    {"id": "warm_wedding",   "name": "Warm Wedding",    "description": "Golden warmth, lifted shadows, soft saturation"},
    {"id": "cool_corporate", "name": "Cool Corporate",  "description": "Clean blue-neutral with crisp contrast"},
    {"id": "vivid",          "name": "Vivid",           "description": "Punchy saturation and deep blacks"},
    {"id": "bw_classic",     "name": "B&W Classic",     "description": "Silver-toned monochrome with filmic S-curve"},
    {"id": "cinematic",      "name": "Cinematic",       "description": "Orange-teal film look — teal shadows, orange highlights"},
    {"id": "film_fade",      "name": "Film Fade",       "description": "Lifted blacks, muted palette, analogue feel"},
    {"id": "sunset",         "name": "Sunset",          "description": "Warm pinks and oranges for outdoor events"},
    {"id": "golden_hour",    "name": "Golden Hour",     "description": "Rich golden cast — perfect for outdoor ceremonies"},
    {"id": "matte",          "name": "Matte",           "description": "Soft lifted shadows and gentle gradients"},
    {"id": "high_key",       "name": "High Key",        "description": "Bright, airy look — great for white-dress portraits"},
]

_TRANSFORM_FN = {
    "identity":       _identity,
    "natural":        _natural,
    "warm_wedding":   _warm_wedding,
    "cool_corporate": _cool_corporate,
    "vivid":          _vivid,
    "bw_classic":     _bw_classic,
    "cinematic":      _cinematic,
    "film_fade":      _film_fade,
    "sunset":         _sunset,
    "golden_hour":    _golden_hour,
    "matte":          _matte,
    "high_key":       _high_key,
}


# ─── Pre-built LUT tables (built once at import time) ────────────

def _build_table(fn) -> np.ndarray:
    r_out, g_out, b_out = fn(_R.copy(), _G.copy(), _B.copy())
    return np.stack([
        np.clip(r_out, 0.0, 1.0),
        np.clip(g_out, 0.0, 1.0),
        np.clip(b_out, 0.0, 1.0),
    ], axis=-1).astype(np.float32)

_LUT_TABLES: dict[str, np.ndarray] = {
    lut_id: _build_table(fn) for lut_id, fn in _TRANSFORM_FN.items()
}

# Cache interpolators (built lazily per LUT ID)
_INTERPOLATORS: dict[str, RegularGridInterpolator] = {}


def _get_interp(lut_id: str) -> RegularGridInterpolator:
    if lut_id not in _INTERPOLATORS:
        _INTERPOLATORS[lut_id] = RegularGridInterpolator(
            (_ax, _ax, _ax), _LUT_TABLES[lut_id],
            method="linear", bounds_error=False, fill_value=None,
        )
    return _INTERPOLATORS[lut_id]


# ─── Public API ───────────────────────────────────────────────────

def available_luts() -> list[dict]:
    return LUT_META


def apply_lut(img: np.ndarray, lut_id: str) -> np.ndarray:
    """Apply a named colour grade to a BGR uint8 image. Returns BGR uint8."""
    if lut_id not in _LUT_TABLES:
        raise ValueError(f"Unknown LUT: {lut_id!r}. Choose from: {list(_LUT_TABLES)}")
    if lut_id == "identity":
        return img

    interp = _get_interp(lut_id)
    h, w = img.shape[:2]
    # Convert BGR → RGB float [0,1] for the LUT, then back
    rgb = (img[:, :, ::-1].astype(np.float32) / 255.0).reshape(-1, 3)
    rgb_out = np.clip(interp(rgb), 0.0, 1.0)
    return (rgb_out.reshape(h, w, 3)[:, :, ::-1] * 255.0).astype(np.uint8)


def auto_correct(img: np.ndarray, params: dict) -> np.ndarray:
    """
    Apply automatic corrections before the LUT.

    params keys (all optional):
      auto_exposure: bool   — gamma-correct based on mean luminance
      auto_wb:       bool   — gray-world white balance
      auto_contrast: bool   — CLAHE on L channel
    """
    if params.get("auto_wb"):
        img = _auto_wb(img)
    if params.get("auto_exposure"):
        img = _auto_exposure(img)
    if params.get("auto_contrast"):
        img = _auto_contrast(img)
    return img


def smooth_skin(img: np.ndarray, strength: float = 0.5) -> np.ndarray:
    """Bilateral-filter skin-tone regions. strength ∈ [0, 1]."""
    if strength <= 0.0:
        return img
    d = int(9 + strength * 6)         # diameter 9–15
    sigma = 30.0 + strength * 40.0    # sigma 30–70
    blurred = cv2.bilateralFilter(img, d, sigma, sigma)
    mask = _skin_mask(img)
    alpha = (mask.astype(np.float32) / 255.0 * strength)[:, :, None]
    return (blurred.astype(np.float32) * alpha + img.astype(np.float32) * (1.0 - alpha)).astype(np.uint8)


def dhash(img: np.ndarray, size: int = 8) -> str:
    """64-bit difference hash — 16-char hex string."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, (size + 1, size), interpolation=cv2.INTER_AREA).astype(np.int32)
    diff = resized[:, 1:] > resized[:, :-1]   # (8, 8) bool — horizontal differences
    bits = diff.flatten()
    val = sum(int(b) << (63 - i) for i, b in enumerate(bits))
    return format(val & 0xFFFFFFFFFFFFFFFF, "016x")


def composition_score(img: np.ndarray) -> float:
    """
    Rule-of-thirds saliency score [0, 1].
    High score = main interest near a power point.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    sal = np.sqrt(gx ** 2 + gy ** 2)
    sal /= sal.max() + 1e-6

    h, w = sal.shape
    rad = max(20, min(h, w) // 9)
    best = 0.0
    for py in [h // 3, 2 * h // 3]:
        for px in [w // 3, 2 * w // 3]:
            y1, y2 = max(0, py - rad), min(h, py + rad)
            x1, x2 = max(0, px - rad), min(w, px + rad)
            best = max(best, float(sal[y1:y2, x1:x2].mean()))
    return round(min(1.0, best * 3.5), 3)


def write_cube_files(out_dir: str) -> list[str]:
    """
    Export all 12 LUT presets as .cube files (LUT_SIZE=17) for use in
    Lightroom, DaVinci Resolve, Final Cut Pro, etc.
    Returns list of written file paths.
    """
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    written = []
    for meta in LUT_META:
        lut_id   = meta["id"]
        filename = Path(out_dir) / f"{lut_id}.cube"
        table    = _LUT_TABLES[lut_id]
        with open(filename, "w") as f:
            f.write(f'TITLE "{meta["name"]}"\n')
            f.write(f"LUT_3D_SIZE {LUT_SIZE}\n\n")
            # .cube order: R varies fastest, then G, then B
            for ib in range(LUT_SIZE):
                for ig in range(LUT_SIZE):
                    for ir in range(LUT_SIZE):
                        r, g, b = table[ir, ig, ib]
                        f.write(f"{r:.6f} {g:.6f} {b:.6f}\n")
        written.append(str(filename))
        logger.info("Wrote %s", filename)
    return written


# ─── Internal helpers ────────────────────────────────────────────

def _auto_exposure(img: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    mean_lum = float(gray.mean()) / 255.0
    target   = 0.42
    if abs(mean_lum - target) < 0.05:
        return img
    gamma = np.log(target) / np.log(max(mean_lum, 1e-4))
    gamma = float(np.clip(gamma, 0.4, 2.5))
    table = (np.arange(256, dtype=np.float32) / 255.0) ** gamma * 255.0
    lut_1d = table.clip(0, 255).astype(np.uint8)
    return cv2.LUT(img, lut_1d)


def _auto_wb(img: np.ndarray) -> np.ndarray:
    """Gray-world white balance."""
    result = img.astype(np.float32)
    means = [result[:, :, c].mean() for c in range(3)]
    global_mean = sum(means) / 3.0
    for c in range(3):
        scale = global_mean / max(means[c], 1e-4)
        result[:, :, c] = np.clip(result[:, :, c] * scale, 0, 255)
    return result.astype(np.uint8)


def _auto_contrast(img: np.ndarray) -> np.ndarray:
    """CLAHE on the L channel of LAB."""
    lab  = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l     = clahe.apply(l)
    return cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)


def _skin_mask(img: np.ndarray) -> np.ndarray:
    """Binary mask of skin-toned pixels in HSV space."""
    hsv  = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    mask = cv2.inRange(hsv,
        np.array([0,  30,  60], dtype=np.uint8),
        np.array([22, 170, 255], dtype=np.uint8),
    )
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    return cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
