/**
 * Canvas rendering engine for Instagram Story Generator
 * Supports: Story (1080×1920, 9:16) and Post (1080×1350, 4:5)
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

// Format presets
export const FORMATS = {
  story: { label: 'Story (9:16)', w: 1080, h: 1920 },
  post:  { label: 'Post (4:5)',   w: 1080, h: 1350 },
}

// Default settings
const DEFAULT_SETTINGS = {
  titleFontSize: 76,
  subFontSize: 38,
  bulletFontSize: 36,
  ctaFontSize: 32,
  tagFontSize: 24,
  titleColor: '#FFFFFF',
  bulletColor: '#D4D4DD',
  bulletSpacing: 100,
  showBorder: true,
  borderColor: '#7B2FF7',
  borderLeft: true,
  borderTop: true,
  borderRight: false,
  borderBottom: false,
  showPageNumber: false,
  format: 'story',
}

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
// Internal draw helpers (all receive w, h as parameters)
// ─────────────────────────────────────────────────────────────

function drawBackground(ctx, w, h, bgImage) {
  ctx.fillStyle = CONFIG.bgDark
  ctx.fillRect(0, 0, w, h)

  if (bgImage) {
    ctx.drawImage(bgImage, 0, 0, w, h)
  }
}

function drawBorders(ctx, w, h, settings) {
  if (!settings.showBorder) return

  const bw = CONFIG.borderWidth
  const base = settings.borderColor

  const lighten = (hex, amt) => {
    let r = parseInt(hex.slice(1, 3), 16)
    let g = parseInt(hex.slice(3, 5), 16)
    let b = parseInt(hex.slice(5, 7), 16)
    r = Math.min(255, r + amt)
    g = Math.min(255, g + amt)
    b = Math.min(255, b + amt)
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  const light = lighten(base, 32)
  const dark = lighten(base, -32)

  // Vertical gradient (for left/right borders)
  const vGrad = ctx.createLinearGradient(0, 0, 0, h)
  vGrad.addColorStop(0, light)
  vGrad.addColorStop(0.5, base)
  vGrad.addColorStop(1, dark)

  // Horizontal gradient (for top/bottom borders)
  const hGrad = ctx.createLinearGradient(0, 0, w, 0)
  hGrad.addColorStop(0, light)
  hGrad.addColorStop(0.5, base)
  hGrad.addColorStop(1, dark)

  if (settings.borderLeft) {
    ctx.fillStyle = vGrad
    ctx.fillRect(0, 0, bw, h)
  }
  if (settings.borderRight) {
    ctx.fillStyle = vGrad
    ctx.fillRect(w - bw, 0, bw, h)
  }
  if (settings.borderTop) {
    ctx.fillStyle = hGrad
    ctx.fillRect(0, 0, w, bw)
  }
  if (settings.borderBottom) {
    ctx.fillStyle = hGrad
    ctx.fillRect(0, h - bw, w, bw)
  }
}

function drawWireframeMesh(ctx, w, h) {
  ctx.save()

  const meshTop = h * 0.677    // ~1300 for 1920, ~913 for 1350
  const meshBottom = h - 40
  const cols = 20
  const rows = 12
  const vanishX = w / 2
  const vanishY = meshTop - 100

  ctx.strokeStyle = CONFIG.tealColor
  ctx.globalAlpha = 0.25
  ctx.lineWidth = 1.5

  const points = []
  for (let r = 0; r <= rows; r++) {
    const row = []
    const t = r / rows
    const y = vanishY + (meshBottom - vanishY) * Math.pow(t, 0.7)

    for (let c = 0; c <= cols; c++) {
      const s = c / cols
      const spread = 0.15 + 0.85 * Math.pow(t, 0.6)
      const x = vanishX + (s - 0.5) * w * 1.4 * spread
      const wave = Math.sin(s * Math.PI * 3 + t * 2) * 30 * t
      row.push({ x, y: y + wave })
    }
    points.push(row)
  }

  for (let r = 0; r < points.length; r++) {
    ctx.beginPath()
    ctx.moveTo(points[r][0].x, points[r][0].y)
    for (let c = 1; c < points[r].length; c++) {
      ctx.lineTo(points[r][c].x, points[r][c].y)
    }
    ctx.stroke()
  }

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

// Tag / Thema ──────────────────────────────────────────────────
function drawTag(ctx, tag, settings) {
  if (!tag) return
  const fontSize = settings.tagFontSize
  const LEFT = 80
  const TOP = 80

  ctx.save()

  ctx.font = `700 ${fontSize}px Outfit`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const text = tag.toUpperCase()
  const metrics = ctx.measureText(text)
  const pillW = metrics.width + 32
  const pillH = fontSize + 20

  ctx.fillStyle = CONFIG.accentColor
  ctx.globalAlpha = 0.9
  const radius = pillH / 2
  ctx.beginPath()
  ctx.moveTo(LEFT + radius, TOP)
  ctx.lineTo(LEFT + pillW - radius, TOP)
  ctx.arcTo(LEFT + pillW, TOP, LEFT + pillW, TOP + radius, radius)
  ctx.arcTo(LEFT + pillW, TOP + pillH, LEFT + pillW - radius, TOP + pillH, radius)
  ctx.lineTo(LEFT + radius, TOP + pillH)
  ctx.arcTo(LEFT, TOP + pillH, LEFT, TOP + radius, radius)
  ctx.arcTo(LEFT, TOP, LEFT + radius, TOP, radius)
  ctx.closePath()
  ctx.fill()

  ctx.globalAlpha = 1
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(text, LEFT + 16, TOP + 10)

  ctx.restore()
}

// Title ────────────────────────────────────────────────────────
function drawTitle(ctx, w, title, settings) {
  const fontSize = settings.titleFontSize
  const LINE_HEIGHT = Math.round(fontSize * 1.25)
  const LEFT = 80
  const TOP = 400
  ctx.save()
  ctx.fillStyle = settings.titleColor
  ctx.font = `800 ${fontSize}px Outfit`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const lastLineY = wrapText(ctx, title, LEFT, TOP, w - 160, LINE_HEIGHT, 3)
  ctx.restore()
  return lastLineY + LINE_HEIGHT
}

// Subheadline ──────────────────────────────────────────────────
function drawSubheadline(ctx, w, text, startY, settings) {
  const fontSize = settings.subFontSize
  const LINE_HEIGHT = Math.round(fontSize * 1.37)
  const LEFT = 80
  ctx.save()
  ctx.fillStyle = '#C0C0CC'
  ctx.font = `400 ${fontSize}px Inter`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const lastLineY = wrapText(ctx, text, LEFT, startY, w - 160, LINE_HEIGHT, 2)
  ctx.restore()
  return lastLineY + LINE_HEIGHT
}

// Bullet points ────────────────────────────────────────────────
function drawBullets(ctx, bullets, startY, settings) {
  if (!bullets || bullets.length === 0) return startY
  const SPACING = settings.bulletSpacing
  const fontSize = settings.bulletFontSize
  const LEFT = 80
  let y = startY

  bullets.forEach((text) => {
    if (!text) return

    ctx.save()
    ctx.fillStyle = CONFIG.tealColor
    ctx.font = `600 ${fontSize}px Inter`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('\u203A', LEFT, y - 2)
    ctx.restore()

    ctx.save()
    ctx.fillStyle = settings.bulletColor
    ctx.font = `400 ${fontSize}px Inter`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(text, LEFT + 40, y)
    ctx.restore()

    y += SPACING
  })

  return y
}

// CTA / Footer ─────────────────────────────────────────────────
function drawCTA(ctx, w, h, cta, settings) {
  if (!cta) return
  const fontSize = settings.ctaFontSize

  ctx.save()
  ctx.fillStyle = CONFIG.tealColor
  ctx.font = `600 ${fontSize}px Inter`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(cta, w / 2, h - 110)
  ctx.restore()
}

// Page indicator (e.g. "1 von 3") ─────────────────────────────
function drawPageNumber(ctx, w, h, slideIndex, slideCount, settings) {
  if (!settings.showPageNumber || slideCount <= 1) return

  const text = `${slideIndex + 1} von ${slideCount}`
  const fontSize = 28

  ctx.save()
  ctx.font = `600 ${fontSize}px Inter`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.fillText(text, w / 2, h - 55)
  ctx.restore()
}

// Footer separator line ───────────────────────────────────────
function drawFooterSeparator(ctx, w, h) {
  ctx.save()
  ctx.strokeStyle = CONFIG.tealColor
  ctx.globalAlpha = 0.15
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(80, h - 160)
  ctx.lineTo(w - 80, h - 160)
  ctx.stroke()
  ctx.restore()
}

// ─────────────────────────────────────────────────────────────
// Main render function
// ─────────────────────────────────────────────────────────────
function renderCanvas(ctx, data, scale = 1, settings = {}, bgImage = null, slideIndex = 0, slideCount = 1) {
  const s = { ...DEFAULT_SETTINGS, ...settings }
  const fmt = FORMATS[s.format] || FORMATS.story
  const w = fmt.w
  const h = fmt.h

  ctx.save()
  ctx.scale(scale, scale)

  // Layer 0: background
  drawBackground(ctx, w, h, bgImage)

  // Layer 1: 3D wireframe mesh at bottom (skip if custom bg)
  if (!bgImage) {
    drawWireframeMesh(ctx, w, h)
  }

  // Layer 2: borders
  drawBorders(ctx, w, h, s)

  // Layer 3: tag / Thema
  drawTag(ctx, data.tag, s)

  // Layer 4: title
  const titleEndY = drawTitle(ctx, w, data.title, s)

  // Layer 5: subheadline
  const subStartY = titleEndY + 40
  const subEndY = drawSubheadline(ctx, w, data.subheadline, subStartY, s)

  // Layer 6: bullet points
  const bulletStartY = subEndY + 50
  drawBullets(ctx, data.bullets, bulletStartY, s)

  // Layer 7: footer separator
  drawFooterSeparator(ctx, w, h)

  // Layer 8: CTA
  drawCTA(ctx, w, h, data.cta, s)

  // Layer 9: page indicator
  drawPageNumber(ctx, w, h, slideIndex, slideCount, s)

  ctx.restore()
}

export { DEFAULT_SETTINGS }
export default renderCanvas
