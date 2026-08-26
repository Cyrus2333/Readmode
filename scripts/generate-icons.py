#!/usr/bin/env python3
"""Generate the PNG extension icons from the hand-authored SVG geometry.

The Chrome manifest uses PNGs for broad compatibility, while icons/icon.svg is
kept as the source of truth for the product UI and store artwork.
"""
from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "icons"
SCALE = 4
BASE = 128

BG = (49, 94, 251, 255)       # #315EFB
MINT = (167, 243, 208, 255)   # #A7F3D0
WHITE = (255, 255, 255, 255)


def cubic(p0, p1, p2, p3, steps=24):
    points = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        points.append((
            u**3 * p0[0] + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * p3[0],
            u**3 * p0[1] + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * p3[1],
        ))
    return points


def distance_to_segment(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    if dx == dy == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def rounded_rect_contains(x, y, left, top, right, bottom, radius):
    if left + radius <= x <= right - radius or top + radius <= y <= bottom - radius:
        return left <= x <= right and top <= y <= bottom
    cx = left + radius if x < left + radius else right - radius
    cy = top + radius if y < top + radius else bottom - radius
    return math.hypot(x - cx, y - cy) <= radius


def paint(canvas, size, points, color, width):
    radius = width / 2
    for y in range(size):
        for x in range(size):
            px, py = (x + 0.5) / SCALE, (y + 0.5) / SCALE
            if any(distance_to_segment(px, py, *a, *b) <= radius for a, b in zip(points, points[1:])):
                canvas[y * size + x] = color


def render(size):
    hi = BASE * SCALE
    canvas = [(0, 0, 0, 0)] * (hi * hi)
    for y in range(hi):
        for x in range(hi):
            px, py = (x + 0.5) / SCALE, (y + 0.5) / SCALE
            if rounded_rect_contains(px, py, 0, 0, 128, 128, 28):
                canvas[y * hi + x] = BG

    # Mint page-corner bracket.
    paint(canvas, hi, [(80, 18), (104, 18), (104, 43)], MINT, 8)

    # White monogram: vertical stem, bowl, and angled leg.
    bowl = cubic((67, 31), (79.7, 31), (90, 41.3), (90, 54), steps=28)
    bowl += cubic((90, 54), (90, 66.7), (79.7, 77), (67, 77), steps=28)[1:]
    paint(canvas, hi, [(39, 101), (39, 31), (67, 31)] + bowl[1:] + [(64, 77), (94, 101)], WHITE, 11)

    # Box-filter downsample for clean small-size edges.
    pixels = bytearray()
    for y in range(size):
        start_y = round(y * hi / size)
        end_y = round((y + 1) * hi / size)
        for x in range(size):
            start_x = round(x * hi / size)
            end_x = round((x + 1) * hi / size)
            samples = [canvas[row * hi + col]
                       for row in range(start_y, end_y)
                       for col in range(start_x, end_x)]
            pixels.extend(round(sum(p[c] for p in samples) / len(samples)) for c in range(4))
    return bytes(pixels)


def png_chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)


def write_png(path, size, rgba):
    rows = b"".join(b"\x00" + rgba[y * size * 4:(y + 1) * size * 4] for y in range(size))
    png = b"\x89PNG\r\n\x1a\n"
    png += png_chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    png += png_chunk(b"IDAT", zlib.compress(rows, 9))
    png += png_chunk(b"IEND", b"")
    path.write_bytes(png)


for icon_size in (16, 32, 48, 128):
    write_png(OUT_DIR / f"icon-{icon_size}.png", icon_size, render(icon_size))
