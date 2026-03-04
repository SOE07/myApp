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
  showPageNumber: false,
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

function drawBackground(ctx, bgImage) {
  ctx.fillStyle = CONFIG.bgDark
  ctx.fillRect(0, 0, W, H)

  if (bgImage) {
    ctx.drawImage(bgImage, 0, 0, W, H)
  }
}

function drawBorders(ctx, settings) {
  if (!settings.showBorder) return

  const bw = CONFIG.borderWidth
  const base = settings.borderColor

  // Derive lighter and darker shades from the base color for gradient
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

  // Create gradient for the borders
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, light)
  grad.addColorStop(0.5, base)
  grad.addColorStop(1, dark)

  // Left border
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, bw, H)

  // Top border
  const topGrad = ctx.createLinearGradient(0, 0, W, 0)
  topGrad.addColorStop(0, light)
  topGrad.addColorStop(0.5, base)
  topGrad.addColorStop(1, dark)
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

// Tag / Thema ──────────────────────────────────────────────────
function drawTag(ctx, tag, settings) {
  if (!tag) return
  const fontSize = settings.tagFontSize
  const LEFT = 80
  const TOP = 80

  ctx.save()

  // Draw tag pill background
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

  // Draw tag text
  ctx.globalAlpha = 1
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(text, LEFT + 16, TOP + 10)

  ctx.restore()
}

// Title ────────────────────────────────────────────────────────
function drawTitle(ctx, title, settings) {
  const fontSize = settings.titleFontSize
  const LINE_HEIGHT = Math.round(fontSize * 1.25)
  const LEFT = 80
  const TOP = 400
  ctx.save()
  ctx.fillStyle = settings.titleColor
  ctx.font = `800 ${fontSize}px Outfit`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const lastLineY = wrapText(ctx, title, LEFT, TOP, W - 160, LINE_HEIGHT, 3)
  ctx.restore()
  return lastLineY + LINE_HEIGHT
}

// Subheadline ──────────────────────────────────────────────────
function drawSubheadline(ctx, text, startY, settings) {
  const fontSize = settings.subFontSize
  const LINE_HEIGHT = Math.round(fontSize * 1.37)
  const LEFT = 80
  ctx.save()
  ctx.fillStyle = '#C0C0CC'
  ctx.font = `400 ${fontSize}px Inter`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const lastLineY = wrapText(ctx, text, LEFT, startY, W - 160, LINE_HEIGHT, 2)
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

    // Teal chevron "›"
    ctx.save()
    ctx.fillStyle = CONFIG.tealColor
    ctx.font = `600 ${fontSize}px Inter`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('\u203A', LEFT, y - 2)
    ctx.restore()

    // Bullet text
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
function drawCTA(ctx, cta, settings) {
  if (!cta) return
  const fontSize = settings.ctaFontSize
  const LEFT = W / 2
  const BOTTOM = H - 100

  ctx.save()
  ctx.fillStyle = CONFIG.tealColor
  ctx.font = `600 ${fontSize}px Inter`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText(cta, LEFT, BOTTOM)
  ctx.restore()
}

// Page indicator (e.g. "1 von 3") ─────────────────────────────
function drawPageNumber(ctx, slideIndex, slideCount, settings) {
  if (!settings.showPageNumber || slideCount <= 1) return

  const text = `${slideIndex + 1} von ${slideCount}`
  const fontSize = 28
  const x = W / 2
  const y = H - 60

  ctx.save()
  ctx.font = `600 ${fontSize}px Inter`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.fillText(text, x, y)
  ctx.restore()
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

  // Third chevron
  ctx.beginPath()
  ctx.moveTo(x + 60, y)
  ctx.lineTo(x + 85, y + 30)
  ctx.lineTo(x + 60, y + 60)
  ctx.stroke()

  ctx.restore()
}

// ─────────────────────────────────────────────────────────────
// Main render function
// ─────────────────────────────────────────────────────────────
function renderCanvas(ctx, data, scale = 1, settings = {}, bgImage = null, slideIndex = 0, slideCount = 1) {
  const s = { ...DEFAULT_SETTINGS, ...settings }

  ctx.save()
  ctx.scale(scale, scale)

  // Layer 0: background (with optional template image)
  drawBackground(ctx, bgImage)

  // Layer 1: 3D wireframe mesh at bottom (skip if custom bg)
  if (!bgImage) {
    drawWireframeMesh(ctx)
  }

  // Layer 2: borders (left + top)
  drawBorders(ctx, s)

  // Layer 3: tag / Thema
  drawTag(ctx, data.tag, s)

  // Layer 4: title
  const titleEndY = drawTitle(ctx, data.title, s)

  // Layer 5: subheadline – 40px below title
  const subStartY = titleEndY + 40
  const subEndY = drawSubheadline(ctx, data.subheadline, subStartY, s)

  // Layer 6: bullet points – 50px below subheadline
  const bulletStartY = subEndY + 50
  drawBullets(ctx, data.bullets, bulletStartY, s)

  // Layer 7: CTA at bottom
  drawCTA(ctx, data.cta, s)

  // Layer 8: page indicator (top-right)
  drawPageNumber(ctx, slideIndex, slideCount, s)

  // Layer 9: double chevron icon bottom-right
  drawChevronIcon(ctx)

  ctx.restore()
}

export { DEFAULT_SETTINGS }
export default renderCanvas
