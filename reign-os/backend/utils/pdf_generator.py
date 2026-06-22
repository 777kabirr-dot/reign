"""
ReportLab PDF builder for Reign OS monthly intelligence reports.

Design language (per spec):
  - Dark navy background  #1B2A4A
  - Cream text            #F4F1EA
  - Gold accents          #C9A84C
  - Helvetica throughout (built-in), bold for headings
  - Footer: "Prepared by Reign | Confidential | reign.in"
"""
from __future__ import annotations

import os
from typing import Any

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas as rl_canvas

NAVY = HexColor("#1B2A4A")
CREAM = HexColor("#F4F1EA")
GOLD = HexColor("#C9A84C")
DIM = HexColor("#9AA3B2")

PAGE_W, PAGE_H = A4
MARGIN = 22 * mm


def _paint_background(c: rl_canvas.Canvas) -> None:
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)


def _footer(c: rl_canvas.Canvas) -> None:
    c.setFillColor(GOLD)
    c.setLineWidth(0.6)
    c.setStrokeColor(GOLD)
    c.line(MARGIN, 16 * mm, PAGE_W - MARGIN, 16 * mm)
    c.setFont("Helvetica", 8)
    c.setFillColor(DIM)
    c.drawCentredString(
        PAGE_W / 2, 11 * mm, "Prepared by Reign  |  Confidential  |  reign.in"
    )


def _wrap(c: rl_canvas.Canvas, text: str, font: str, size: int, max_width: float) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        if c.stringWidth(trial, font, size) <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def _heading(c: rl_canvas.Canvas, text: str, y: float) -> float:
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(MARGIN, y, text)
    c.setStrokeColor(GOLD)
    c.setLineWidth(1)
    c.line(MARGIN, y - 4, MARGIN + 40 * mm, y - 4)
    return y - 14 * mm


def _truncate(c: rl_canvas.Canvas, text: str, font: str, size: int, max_width: float) -> str:
    if c.stringWidth(text, font, size) <= max_width:
        return text
    ellipsis = "…"
    while text and c.stringWidth(text + ellipsis, font, size) > max_width:
        text = text[:-1]
    return text + ellipsis


def build_report_pdf(
    out_path: str,
    client: dict[str, Any],
    month: str,
    summary_text: str,
    metrics: dict[str, int],
    mention_log: list[dict[str, Any]],
    content_log: list[dict[str, Any]],
) -> str:
    """Render the full report and return out_path."""
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    c = rl_canvas.Canvas(out_path, pagesize=A4)
    content_w = PAGE_W - 2 * MARGIN

    # ── Page 1 — Cover ──────────────────────────────────────────
    _paint_background(c)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 30)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 70 * mm, "REIGN")
    c.setFillColor(DIM)
    c.setFont("Helvetica", 10)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 78 * mm, "REPUTATION INTELLIGENCE")

    c.setStrokeColor(GOLD)
    c.setLineWidth(0.8)
    c.line(PAGE_W / 2 - 30 * mm, PAGE_H - 90 * mm, PAGE_W / 2 + 30 * mm, PAGE_H - 90 * mm)

    c.setFillColor(CREAM)
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 120 * mm, client.get("name", "Client"))
    c.setFillColor(CREAM)
    c.setFont("Helvetica", 14)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 132 * mm, "ORM Intelligence Report")
    c.setFillColor(GOLD)
    c.setFont("Helvetica", 12)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 142 * mm, month)

    c.setFillColor(DIM)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(PAGE_W / 2, 30 * mm, "C O N F I D E N T I A L")
    _footer(c)
    c.showPage()

    # ── Page 2 — Executive Summary ──────────────────────────────
    _paint_background(c)
    y = _heading(c, "Executive Summary", PAGE_H - 30 * mm)
    c.setFillColor(CREAM)
    c.setFont("Helvetica", 11)
    for para in summary_text.split("\n"):
        para = para.strip()
        if not para:
            y -= 4 * mm
            continue
        for line in _wrap(c, para, "Helvetica", 11, content_w):
            if y < 30 * mm:
                _footer(c)
                c.showPage()
                _paint_background(c)
                y = PAGE_H - 30 * mm
                c.setFillColor(CREAM)
                c.setFont("Helvetica", 11)
            c.drawString(MARGIN, y, line)
            y -= 6 * mm
        y -= 3 * mm
    _footer(c)
    c.showPage()

    # ── Page 3 — Metrics table ──────────────────────────────────
    _paint_background(c)
    y = _heading(c, "Key Metrics", PAGE_H - 30 * mm)
    rows = [
        ("Mentions monitored", metrics.get("mentions_monitored", 0)),
        ("Negative suppressed", metrics.get("negative_suppressed", 0)),
        ("Content published", metrics.get("content_published", 0)),
        ("SERP improvements", metrics.get("serp_improvements", 0)),
    ]
    row_h = 14 * mm
    for i, (label, value) in enumerate(rows):
        ry = y - i * row_h
        c.setStrokeColor(GOLD)
        c.setLineWidth(0.4)
        c.line(MARGIN, ry - 4 * mm, PAGE_W - MARGIN, ry - 4 * mm)
        c.setFillColor(CREAM)
        c.setFont("Helvetica", 12)
        c.drawString(MARGIN, ry, label)
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 18)
        c.drawRightString(PAGE_W - MARGIN, ry, str(value))
    _footer(c)
    c.showPage()

    # ── Page 4 — Mention log (top 10) ───────────────────────────
    _paint_background(c)
    y = _heading(c, "Significant Mentions", PAGE_H - 30 * mm)
    if not mention_log:
        c.setFillColor(DIM)
        c.setFont("Helvetica-Oblique", 11)
        c.drawString(MARGIN, y, "No mentions recorded for this period.")
    for m in mention_log[:10]:
        if y < 34 * mm:
            _footer(c)
            c.showPage()
            _paint_background(c)
            y = PAGE_H - 30 * mm
        sev = (m.get("severity") or "low").upper()
        title = _truncate(c, m.get("title") or "(untitled)", "Helvetica-Bold", 11, content_w - 28 * mm)
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(MARGIN, y, sev)
        c.setFillColor(CREAM)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(MARGIN + 26 * mm, y, title)
        y -= 5.5 * mm
        c.setFillColor(DIM)
        c.setFont("Helvetica", 8)
        meta = f"{(m.get('detected_at') or '')[:10]}  ·  {_truncate(c, m.get('url') or '', 'Helvetica', 8, content_w)}"
        c.drawString(MARGIN + 26 * mm, y, meta)
        y -= 9 * mm
    _footer(c)
    c.showPage()

    # ── Page 5 — Content published ──────────────────────────────
    _paint_background(c)
    y = _heading(c, "Content Published", PAGE_H - 30 * mm)
    if not content_log:
        c.setFillColor(DIM)
        c.setFont("Helvetica-Oblique", 11)
        c.drawString(MARGIN, y, "No content published for this period.")
    for item in content_log:
        if y < 34 * mm:
            _footer(c)
            c.showPage()
            _paint_background(c)
            y = PAGE_H - 30 * mm
        title = _truncate(c, item.get("title") or "(untitled)", "Helvetica-Bold", 11, content_w)
        c.setFillColor(CREAM)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(MARGIN, y, title)
        y -= 5.5 * mm
        c.setFillColor(GOLD)
        c.setFont("Helvetica", 8)
        meta = (
            f"{(item.get('type') or '').replace('_', ' ').upper()}  ·  "
            f"{item.get('platform') or ''}  ·  {(item.get('published_at') or '')[:10]}"
        )
        c.drawString(MARGIN, y, meta)
        y -= 4.5 * mm
        c.setFillColor(DIM)
        c.setFont("Helvetica", 8)
        c.drawString(MARGIN, y, _truncate(c, item.get("url") or "", "Helvetica", 8, content_w))
        y -= 9 * mm
    _footer(c)
    c.showPage()

    c.save()
    return out_path
