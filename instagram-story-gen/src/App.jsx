import { useState, useCallback, useRef } from 'react'
import StoryForm from './components/StoryForm'
import StoryPreview from './components/StoryPreview'
import renderCanvas, { loadFonts, DEFAULT_SETTINGS } from './utils/renderCanvas'

const INITIAL_DATA = {
  tag: '',
  title: 'Zeit für einen Strategie-Check',
  subheadline: 'Lass dich nicht von Kursen treiben.',
  bullets: [
    'Überprüfe deine aktuelle Strategie',
    'Passe Ziele an die Marktlage an',
    'Setze klare Regeln für Ein- und Ausstiege',
  ],
  cta: '',
}

function exportPNG(formData, settings, bgImage) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920
  const ctx = canvas.getContext('2d')

  loadFonts().then(() => {
    renderCanvas(ctx, formData, 1, settings, bgImage)

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const slug = (formData.tag || 'story').toLowerCase().replace(/\s+/g, '-')
      a.download = `story-${slug}-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  })
}

function App() {
  const [formData, setFormData] = useState(INITIAL_DATA)
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS })
  const [bgImage, setBgImage] = useState(null)
  const bgImageRef = useRef(null)

  const handleExport = useCallback(
    () => exportPNG(formData, settings, bgImageRef.current),
    [formData, settings],
  )
  const handleReset = useCallback(() => {
    setFormData(INITIAL_DATA)
    setSettings({ ...DEFAULT_SETTINGS })
    setBgImage(null)
    bgImageRef.current = null
  }, [])

  const handleBgUpload = useCallback((file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        bgImageRef.current = img
        setBgImage(e.target.result)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }, [])

  const handleBgRemove = useCallback(() => {
    setBgImage(null)
    bgImageRef.current = null
  }, [])

  const handleExcelImport = useCallback((rows) => {
    if (!rows || rows.length === 0) return
    const row = rows[0]
    setFormData((prev) => ({
      ...prev,
      tag: row['Thema'] ?? row['thema'] ?? row['Tag'] ?? row['tag'] ?? prev.tag,
      title: row['Titel'] ?? row['titel'] ?? row['Title'] ?? row['title'] ?? prev.title,
      subheadline:
        row['Subheadline'] ?? row['subheadline'] ?? row['Sub'] ?? row['sub'] ?? prev.subheadline,
      bullets: [
        row['Bullet1'] ?? row['bullet1'] ?? row['Bullet 1'] ?? '',
        row['Bullet2'] ?? row['bullet2'] ?? row['Bullet 2'] ?? '',
        row['Bullet3'] ?? row['bullet3'] ?? row['Bullet 3'] ?? '',
        row['Bullet4'] ?? row['bullet4'] ?? row['Bullet 4'] ?? '',
        row['Bullet5'] ?? row['bullet5'] ?? row['Bullet 5'] ?? '',
      ].filter((b) => b),
      cta: row['CTA'] ?? row['cta'] ?? row['Footer'] ?? row['footer'] ?? prev.cta,
    }))
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
          <StoryForm
            formData={formData}
            onChange={setFormData}
            settings={settings}
            onSettingsChange={setSettings}
            bgImage={bgImage}
            onBgUpload={handleBgUpload}
            onBgRemove={handleBgRemove}
            onExcelImport={handleExcelImport}
            onExport={handleExport}
            onReset={handleReset}
          />
        </div>

        {/* Right: Preview (sticky) */}
        <div className="order-1 xl:order-2 xl:sticky xl:top-6 xl:self-start flex justify-center">
          <StoryPreview formData={formData} settings={settings} bgImage={bgImage} />
        </div>
      </main>
    </div>
  )
}

export default App
