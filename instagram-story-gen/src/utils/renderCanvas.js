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
  accentColor: '#7B2FF7',   // Purple
  tealColor: '#2DD4BF',     // Teal/Cyan
  bgDark: '#08080F',        // Near-black
  bgMid: '#0A0A14',
  borderWidth: 24,
}

// Native canvas dimensions (before scaling)
const W = 1080
const H = 1920

// ─────────────────────────────────────────────────────────────
// Font loading via FontFace API (Google Fonts CDN)
// ─────────────────────────────────────────────────────────────
let _fontsLoaded = false

export async function loadFonts() {
  if (typeof document === 'undefined' || _fontsLoaded) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href =
    'https://fonts.googleapis.com/css2?family=Outfit:wght@700;800&family=Inter:wght@400;600&display=swap'
  document.head.appendChild(link)

  await document.fonts.ready
  await Promise.all([
    document.fonts.load('800 48px Outfit'),
    document.fonts.load('700 48px Outfit'),
    document.fonts.load('400 36px Inter'),
    document.fonts.load('600 28px Inter'),
  ])

  _fontsLoaded = true
}

// ─────────────────────────────────────────────────────────────
// Helper: auto line-wrap with optional max-line clamping
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
  ctx.fillStyle = CONFIG.bgDark
  ctx.fillRect(0, 0, W, H)
}

function drawBorders(ctx) {
  const bw = CONFIG.borderWidth

  // Create a purple gradient for the borders
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#9B4DFF')
  grad.addColorStop(0.5, '#7B2FF7')
  grad.addColorStop(1, '#5B1FD7')

  // Left border
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, bw, H)

  // Top border
  const topGrad = ctx.createLinearGradient(0, 0, W, 0)
  topGrad.addColorStop(0, '#9B4DFF')
  topGrad.addColorStop(0.5, '#7B2FF7')
  topGrad.addColorStop(1, '#5B1FD7')
  ctx.fillStyle = topGrad
  ctx.fillRect(0, 0, W, bw)
}

function drawWireframeMesh(ctx) {
  ctx.save()

  const meshTop = 1300
  const meshBottom = H - 40
  const cols = 20
  const rows = 12
  const vanishX = W / 2
  const vanishY = meshTop - 100

  ctx.strokeStyle = CONFIG.tealColor
  ctx.globalAlpha = 0.25
  ctx.lineWidth = 1.5

  // Generate grid points with perspective and wave
  const points = []
  for (let r = 0; r <= rows; r++) {
    const row = []
    const t = r / rows
    const y = vanishY + (meshBottom - vanishY) * Math.pow(t, 0.7)

    for (let c = 0; c <= cols; c++) {
      const s = c / cols
      const spread = 0.15 + 0.85 * Math.pow(t, 0.6)
      const x = vanishX + (s - 0.5) * W * 1.4 * spread

      // Add subtle wave displacement
      const wave = Math.sin(s * Math.PI * 3 + t * 2) * 30 * t
      row.push({ x, y: y + wave })
    }
    points.push(row)
  }

  // Draw horizontal lines
  for (let r = 0; r < points.length; r++) {
    ctx.beginPath()
    ctx.moveTo(points[r][0].x, points[r][0].y)
    for (let c = 1; c < points[r].length; c++) {
      ctx.lineTo(points[r][c].x, points[r][c].y)
    }
    ctx.stroke()
  }

  // Draw vertical lines
  for (let c = 0; c < points[0].length; c++) {
    ctx.beginPath()
    ctx.moveTo(points[0][c].x, points[0][c].y)
    for (let r = 1; r < points.length; r++) {
      ctx.lineTo(points[r][c].x, points[r][c].y)
    }
    ctx.stroke()
  }

  ctx.restore()
}

// Title ────────────────────────────────────────────────────────
function drawTitle(ctx, title) {
  const LINE_HEIGHT = 95
  const LEFT = 80
  const TOP = 400
  ctx.save()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '800 76px Outfit'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const lastLineY = wrapText(ctx, title, LEFT, TOP, W - 160, LINE_HEIGHT, 3)
  ctx.restore()
  return lastLineY
}

// Subheadline ──────────────────────────────────────────────────
function drawSubheadline(ctx, text, startY) {
  const LINE_HEIGHT = 52
  const LEFT = 80
  ctx.save()
  ctx.fillStyle = '#C0C0CC'
  ctx.font = '400 38px Inter'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const lastLineY = wrapText(ctx, text, LEFT, startY, W - 160, LINE_HEIGHT, 2)
  ctx.restore()
  return lastLineY
}

// Bullet points ────────────────────────────────────────────────
function drawBullets(ctx, bullets, startY) {
  if (!bullets || bullets.length === 0) return
  const SPACING = 75
  const LEFT = 80
  let y = startY

  bullets.forEach((text) => {
    // Teal chevron "›"
    ctx.save()
    ctx.fillStyle = CONFIG.tealColor
    ctx.font = '600 34px Inter'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('\u203A', LEFT, y - 2)
    ctx.restore()

    // Bullet text
    ctx.save()
    ctx.fillStyle = '#D4D4DD'
    ctx.font = '400 36px Inter'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(text, LEFT + 40, y)
    ctx.restore()

    y += SPACING
  })
}

// Double chevron icon (bottom-right) ──────────────────────────
function drawChevronIcon(ctx) {
  const x = W - 140
  const y = H - 200

  ctx.save()
  ctx.strokeStyle = CONFIG.tealColor
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.globalAlpha = 0.8

  // First chevron
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + 25, y + 30)
  ctx.lineTo(x, y + 60)
  ctx.stroke()

  // Second chevron
  ctx.beginPath()
  ctx.moveTo(x + 30, y)
  ctx.lineTo(x + 55, y + 30)
  ctx.lineTo(x + 30, y + 60)
  ctx.stroke()

  ctx.restore()
}

// ─────────────────────────────────────────────────────────────
// Main render function
// ─────────────────────────────────────────────────────────────
function renderCanvas(ctx, data, scale = 1) {
  ctx.save()
  ctx.scale(scale, scale)

  // Layer 0: background
  drawBackground(ctx)

  // Layer 1: 3D wireframe mesh at bottom
  drawWireframeMesh(ctx)

  // Layer 2: purple borders (left + top)
  drawBorders(ctx)

  // Layer 3: title
  const titleLastY = drawTitle(ctx, data.title)

  // Layer 4: subheadline – 40px below title
  const subStartY = titleLastY + 76 + 40
  const subLastY = drawSubheadline(ctx, data.subheadline, subStartY)

  // Layer 5: bullet points – 60px below subheadline
  const bulletStartY = subLastY + 52 + 60
  drawBullets(ctx, data.bullets, bulletStartY)

  // Layer 6: double chevron icon bottom-right
  drawChevronIcon(ctx)

  ctx.restore()
}

export default renderCanvas
