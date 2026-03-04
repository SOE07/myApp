import { useState, useCallback } from 'react'
import StoryForm from './components/StoryForm'
import StoryPreview from './components/StoryPreview'
import SlideNav from './components/SlideNav'
import renderCanvas, { loadFonts, DEFAULT_SETTINGS } from './utils/renderCanvas'

const INITIAL_DATA = {
  tag: '',
  title: '',
  subheadline: '',
  bullets: [],
  cta: '',
  bgImage: null,
}

// ─── Helpers ─────────────────────────────────────────────────

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function parseExcelRow(row) {
  return {
    tag: row['Thema'] ?? row['thema'] ?? row['Tag'] ?? row['tag'] ?? '',
    title: row['Titel'] ?? row['titel'] ?? row['Title'] ?? row['title'] ?? '',
    subheadline:
      row['Subheadline'] ?? row['subheadline'] ?? row['Sub'] ?? row['sub'] ?? '',
    bullets: [
      row['Bullet1'] ?? row['bullet1'] ?? row['Bullet 1'] ?? '',
      row['Bullet2'] ?? row['bullet2'] ?? row['Bullet 2'] ?? '',
      row['Bullet3'] ?? row['bullet3'] ?? row['Bullet 3'] ?? '',
      row['Bullet4'] ?? row['bullet4'] ?? row['Bullet 4'] ?? '',
      row['Bullet5'] ?? row['bullet5'] ?? row['Bullet 5'] ?? '',
    ].filter((b) => b),
    cta: row['CTA'] ?? row['cta'] ?? row['Footer'] ?? row['footer'] ?? '',
    bgImage: null,
  }
}

async function exportSlides(slides, settings) {
  await loadFonts()

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]
    const canvas = document.createElement('canvas')
    canvas.setAttribute('width', '1080')
    canvas.setAttribute('height', '1920')
    canvas.width = 1080
    canvas.height = 1920

    const ctx = canvas.getContext('2d')

    const bgImg = slide.bgImage ? await loadImage(slide.bgImage) : null
    renderCanvas(ctx, slide, 1, settings, bgImg, i, slides.length)

    // Use toDataURL for reliable full-resolution export
    const dataURL = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    const slug = (slide.tag || 'story').toLowerCase().replace(/\s+/g, '-')
    const num = slides.length > 1 ? `-${i + 1}` : ''
    a.download = `story-${slug}${num}.png`
    a.href = dataURL
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    // Small delay between downloads so the browser doesn't block them
    if (i < slides.length - 1) {
      await new Promise((r) => setTimeout(r, 500))
    }
  }
}

// ─── App ─────────────────────────────────────────────────────

function App() {
  const [slides, setSlides] = useState([{ ...INITIAL_DATA }])
  const [activeIndex, setActiveIndex] = useState(0)
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS })

  const activeSlide = slides[activeIndex] ?? slides[0]

  // ── Slide CRUD ──

  const updateActiveSlide = useCallback(
    (data) => {
      setSlides((prev) =>
        prev.map((s, i) => (i === activeIndex ? { ...s, ...data } : s)),
      )
    },
    [activeIndex],
  )

  const addSlide = useCallback(() => {
    setSlides((prev) => {
      const next = [...prev, { ...INITIAL_DATA }]
      setActiveIndex(next.length - 1)
      return next
    })
  }, [])

  const removeSlide = useCallback(
    (index) => {
      setSlides((prev) => {
        if (prev.length <= 1) return prev
        const next = prev.filter((_, i) => i !== index)
        setActiveIndex((cur) => {
          if (cur >= next.length) return next.length - 1
          if (cur > index) return cur - 1
          return cur
        })
        return next
      })
    },
    [],
  )

  const duplicateSlide = useCallback((index) => {
    setSlides((prev) => {
      const copy = { ...prev[index], bullets: [...prev[index].bullets] }
      const next = [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)]
      setActiveIndex(index + 1)
      return next
    })
  }, [])

  // ── Background ──

  const handleBgUpload = useCallback(
    (file) => {
      if (!file) return
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          updateActiveSlide({ bgImage: e.target.result })
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    },
    [updateActiveSlide],
  )

  const handleBgRemove = useCallback(() => {
    updateActiveSlide({ bgImage: null })
  }, [updateActiveSlide])

  // ── Excel import: one slide per row ──

  const handleExcelImport = useCallback((rows) => {
    if (!rows || rows.length === 0) return
    const newSlides = rows.map(parseExcelRow)
    setSlides(newSlides)
    setActiveIndex(0)
  }, [])

  // ── Export ──

  const handleExport = useCallback(
    () => exportSlides(slides, settings),
    [slides, settings],
  )

  // ── Reset ──

  const handleReset = useCallback(() => {
    setSlides([{ ...INITIAL_DATA }])
    setActiveIndex(0)
    setSettings({ ...DEFAULT_SETTINGS })
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="px-6 py-4 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">SG</span>
        </div>
        <h1 className="text-lg font-semibold tracking-tight">Story Generator</h1>
      </header>

      {/* Main layout */}
      <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-8">
        {/* Left: Form (scrollable) */}
        <div className="order-2 xl:order-1 xl:max-h-[calc(100vh-5rem)] xl:overflow-y-auto xl:pr-2">
          <SlideNav
            slides={slides}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
            onAdd={addSlide}
            onRemove={removeSlide}
            onDuplicate={duplicateSlide}
          />
          <StoryForm
            formData={activeSlide}
            onChange={updateActiveSlide}
            settings={settings}
            onSettingsChange={setSettings}
            bgImage={activeSlide.bgImage}
            onBgUpload={handleBgUpload}
            onBgRemove={handleBgRemove}
            onExcelImport={handleExcelImport}
            onExport={handleExport}
            onReset={handleReset}
            slideCount={slides.length}
          />
        </div>

        {/* Right: Preview (sticky) */}
        <div className="order-1 xl:order-2 xl:sticky xl:top-6 xl:self-start flex justify-center">
          <StoryPreview
            formData={activeSlide}
            settings={settings}
            bgImage={activeSlide.bgImage}
            slideIndex={activeIndex}
            slideCount={slides.length}
          />
        </div>
      </main>
    </div>
  )
}

export default App
