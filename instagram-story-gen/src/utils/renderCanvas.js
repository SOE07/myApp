/**
 * Canvas rendering engine for Instagram Story Generator
 * Output: 1080 × 1920 px (native), scalable via `scale` parameter
 */

// ─────────────────────────────────────────────────────────────
// Configurable brand constants
// ─────────────────────────────────────────────────────────────
const CONFIG = {
  brandName: 'TradingInsights',
  brandInitials: 'TI',
  accentColor: '#F59E0B',
  bgDark: '#0A0E1A',
  bgMid: '#0D1B2A',
}

// Native canvas dimensions (before scaling)
const W = 1080
const H = 1920

// ─────────────────────────────────────────────────────────────
// Font loading via FontFace API (Google Fonts CDN)
// Call once before the first render; safe to call multiple times.
// ─────────────────────────────────────────────────────────────
let _fontsLoaded = false

export async function loadFonts() {
  if (typeof document === 'undefined' || _fontsLoaded) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href =
    'https://fonts.googleapis.com/css2?family=Outfit:wght@800&family=Inter:wght@400;600&display=swap'
  document.head.appendChild(link)

  await document.fonts.ready
  await Promise.all([
    document.fonts.load('800 48px Outfit'),
    document.fonts.load('400 36px Inter'),
    document.fonts.load('600 28px Inter'),
  ])

  _fontsLoaded = true
}

// ─────────────────────────────────────────────────────────────
// Helper: auto line-wrap with optional max-line clamping
//
// @param  {CanvasRenderingContext2D} ctx
// @param  {string}  text
// @param  {number}  x           left edge
// @param  {number}  y           top of first line (textBaseline = 'top')
// @param  {number}  maxWidth    wrap width
// @param  {number}  lineHeight  px between line tops
// @param  {number}  [maxLines]  hard cap; last line gets "…" if exceeded
// @return {number}  y-coordinate of the last drawn line
// ─────────────────────────────────────────────────────────────
export function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
  const words = text.split(' ')
  let line = ''
  let currentY = y
  let linesDrawn = 0

  const flush = (str, atY, ellipsis = false) => {
    let out = str.trimEnd()
    if (ellipsis) {
      while (out.length > 0 && ctx.measureText(out + '\u2026').width > maxWidth) {
        out = out.slice(0, -1)
      }
      out += '\u2026'
    }
    ctx.fillText(out, x, atY)
    linesDrawn++
  }

  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i]
    if (ctx.measureText(test).width > maxWidth && line !== '') {
      if (linesDrawn + 1 >= maxLines) {
        flush(line, currentY, true)
        return currentY
      }
      flush(line, currentY)
      line = words[i]
      currentY += lineHeight
    } else {
      line = test
    }
  }

  if (line) flush(line, currentY)
  return currentY
}

// ─────────────────────────────────────────────────────────────
// Internal draw helpers
// ─────────────────────────────────────────────────────────────

function drawBackground(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, CONFIG.bgDark)
  grad.addColorStop(1, CONFIG.bgMid)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)
}

function drawGrid(ctx) {
  ctx.save()
  ctx.strokeStyle = '#1E3A5F'
  ctx.globalAlpha = 0.1
  ctx.lineWidth = 1
  const step = 80
  for (let x = 0; x <= W; x += step) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }
  for (let y = 0; y <= H; y += step) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }
  ctx.restore()
}

function drawDecorCircle(ctx) {
  ctx.save()
  ctx.globalAlpha = 0.3
  ctx.fillStyle = '#1A3A6B'
  ctx.beginPath()
  ctx.arc(W, 0, 300, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** Cross-browser pill/rounded-rect path helper */
function pathRoundRect(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
  } else {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }
}

// 1. Brand-Badge (Y:80) ──────────────────────────────────────
function drawBrandBadge(ctx) {
  const LEFT = 60
  const TOP = 80
  const R = 20 // radius → 40 × 40 px badge
  const cx = LEFT + R
  const cy = TOP + R

  ctx.save()
  ctx.fillStyle = CONFIG.accentColor
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = CONFIG.bgDark
  ctx.font = '600 15px Inter'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(CONFIG.brandInitials, cx, cy)
  ctx.restore()

  ctx.save()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '600 28px Inter'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(CONFIG.brandName, LEFT + R * 2 + 16, cy)
  ctx.restore()
}

// 2. Theme tag / pill (Y:180) ────────────────────────────────
function drawThemeTag(ctx, tag) {
  if (!tag) return
  const LEFT = 60
  const TOP = 180
  const PAD_X = 28
  const PAD_Y = 14
  const FONT_SIZE = 24
  const LETTER_SPACING = 3
  const text = tag.toUpperCase()

  ctx.save()
  ctx.font = `600 ${FONT_SIZE}px Inter`

  const textW = ctx.measureText(text).width + (text.length - 1) * LETTER_SPACING
  const badgeW = textW + PAD_X * 2
  const badgeH = FONT_SIZE + PAD_Y * 2

  ctx.fillStyle = CONFIG.accentColor
  pathRoundRect(ctx, LEFT, TOP, badgeW, badgeH, badgeH / 2)
  ctx.fill()

  ctx.fillStyle = CONFIG.bgDark
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  try { ctx.letterSpacing = `${LETTER_SPACING}px` } catch { /* older browsers */ }
  ctx.fillText(text, LEFT + PAD_X, TOP + badgeH / 2)
  ctx.restore()
}

// 3. Divider line (Y:240) ────────────────────────────────────
function drawDivider(ctx, y) {
  ctx.fillStyle = CONFIG.accentColor
  ctx.fillRect(60, y, 60, 3)
}

// 4. Title (Y:280) ───────────────────────────────────────────
function drawTitle(ctx, title) {
  const LINE_HEIGHT = 90
  ctx.save()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '800 72px Outfit'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const lastLineY = wrapText(ctx, title, 60, 280, W - 120, LINE_HEIGHT, 2)
  ctx.restore()
  return lastLineY
}

// 5. Subheadline (Y: nach Titel + 30px) ──────────────────────
function drawSubheadline(ctx, text, startY) {
  const LINE_HEIGHT = 52
  ctx.save()
  ctx.fillStyle = '#94A3B8'
  ctx.font = '400 38px Inter'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const lastLineY = wrapText(ctx, text, 60, startY, W - 120, LINE_HEIGHT, 2)
  ctx.restore()
  return lastLineY
}

// 6. Bullet points (Y: nach Sub + 60px) ──────────────────────
function drawBullets(ctx, bullets, startY) {
  if (!bullets || bullets.length === 0) return
  const SPACING = 70
  let y = startY

  bullets.forEach((text) => {
    ctx.save()
    ctx.fillStyle = CONFIG.accentColor
    ctx.font = '600 26px Inter'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText('\u25B6', 60, y + 18)
    ctx.restore()

    ctx.save()
    ctx.fillStyle = '#E2E8F0'
    ctx.font = '400 36px Inter'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(text, 116, y)
    ctx.restore()

    y += SPACING
  })
}

// 7. CTA footer (Y:1780) ─────────────────────────────────────
function drawCTAFooter(ctx, cta) {
  ctx.save()
  ctx.fillStyle = '#64748B'
  ctx.globalAlpha = 0.4
  ctx.fillRect(60, 1755, W - 120, 1)
  ctx.restore()

  if (!cta) return
  ctx.save()
  ctx.fillStyle = '#64748B'
  ctx.font = '400 30px Inter'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText(cta, W / 2, 1780)
  ctx.restore()
}

// ─────────────────────────────────────────────────────────────
// Main render function
//
// @param {CanvasRenderingContext2D} ctx
// @param {Object}  data
//   @param {string}   data.tag          – Theme pill label
//   @param {string}   data.title        – Main headline (max 2 lines)
//   @param {string}   data.subheadline  – Supporting copy (max 2 lines)
//   @param {string[]} data.bullets      – Array of bullet strings
//   @param {string}   [data.cta]        – Footer call-to-action text
// @param {number}  scale  1 = full export (1080×1920) | 0.375 = preview (405×720)
// ─────────────────────────────────────────────────────────────
function renderCanvas(ctx, data, scale = 1) {
  ctx.save()
  ctx.scale(scale, scale)

  // Layer 0: background
  drawBackground(ctx)
  drawGrid(ctx)
  drawDecorCircle(ctx)

  // Layer 1: brand header
  drawBrandBadge(ctx)

  // Layer 2: theme tag
  drawThemeTag(ctx, data.tag)

  // Layer 3: gold divider
  drawDivider(ctx, 240)

  // Layer 4: title (dynamic height)
  const titleLastY = drawTitle(ctx, data.title)

  // Layer 5: subheadline – 30px below title's last line
  const subStartY = titleLastY + 72 + 30
  const subLastY = drawSubheadline(ctx, data.subheadline, subStartY)

  // Layer 6: bullet points – 60px below subheadline's last line
  const bulletStartY = subLastY + 52 + 60
  drawBullets(ctx, data.bullets, bulletStartY)

  // Layer 7: CTA footer (anchored to bottom)
  drawCTAFooter(ctx, data.cta)

  ctx.restore()
}

export default renderCanvas

/* ─────────────────────────────────────────────────────────────
   TEST DATA & USAGE EXAMPLES
   ─────────────────────────────────────────────────────────────

   import renderCanvas, { loadFonts } from './utils/renderCanvas'

   const EXAMPLE_DATA = {
     tag: 'Marktanalyse',
     title: 'DAX erreicht historisches Allzeithoch',
     subheadline: 'Was bedeutet das für Anleger und wie positionierst du dich jetzt richtig?',
     bullets: [
       'Support bei 18.200 Punkten beachten',
       'Volumen bestätigt den Ausbruch',
       'Nächster Widerstand: 19.500 Punkte',
     ],
     cta: 'Folge @TradingInsights für tägliche Analysen',
   }

   // ── Preview (405 × 720, scale = 0.375) ──────────────────
   //
   // const canvas = document.getElementById('preview')
   // canvas.width  = 1080 * 0.375  // → 405
   // canvas.height = 1920 * 0.375  // → 720
   // const ctx = canvas.getContext('2d')
   // await loadFonts()
   // renderCanvas(ctx, EXAMPLE_DATA, 0.375)

   // ── Full export (1080 × 1920, scale = 1) ────────────────
   //
   // const canvas = document.createElement('canvas')
   // canvas.width  = 1080
   // canvas.height = 1920
   // const ctx = canvas.getContext('2d')
   // await loadFonts()
   // renderCanvas(ctx, EXAMPLE_DATA, 1)
   // const blob = await new Promise(r => canvas.toBlob(r, 'image/png'))
   // const url  = URL.createObjectURL(blob)

   // ── Test: Short title (1 line) ───────────────────────────
   // { tag: 'Strategie', title: 'Long-Setup im Anzug', subheadline: 'Einstieg bei Pullback.', bullets: [], cta: null }

   // ── Test: Long title (2 lines, truncation) ───────────────
   // { tag: 'News', title: 'Fed hält Zinsen stabil – Märkte reagieren mit starken Kursgewinnen in allen Sektoren', subheadline: 'Die Entscheidung war erwartet.', bullets: ['Tech-Sektor +3.2%'], cta: 'Mehr auf @TradingInsights' }

   // ── Test: No bullets / no CTA ────────────────────────────
   // { tag: 'Quote', title: '"Der Trend ist dein Freund."', subheadline: '– Jesse Livermore', bullets: [], cta: undefined }

   // ── Test: Many bullets (overflow check, limit ≤ 5) ───────
   // { tag: 'Setup', title: 'Checkliste', subheadline: 'Vor jedem Trade prüfen:', bullets: ['Trend bestätigt', 'Volumen steigt', 'Risk/Reward > 2:1', 'Stop-Loss gesetzt', 'Kein News-Event'], cta: 'Speichern!' }

   ───────────────────────────────────────────────────────────── */
