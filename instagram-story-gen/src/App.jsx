import { useState, useCallback } from 'react'
import StoryForm from './components/StoryForm'
import StoryPreview from './components/StoryPreview'
import renderCanvas, { loadFonts } from './utils/renderCanvas'

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

function exportPNG(formData) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920
  const ctx = canvas.getContext('2d')

  loadFonts().then(() => {
    renderCanvas(ctx, formData, 1)

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

  const handleExport = useCallback(() => exportPNG(formData), [formData])
  const handleReset = useCallback(() => setFormData(INITIAL_DATA), [])

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
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8">
        {/* Left: Form (scrollable) */}
        <div className="order-2 lg:order-1 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:pr-2">
          <StoryForm
            formData={formData}
            onChange={setFormData}
            onExport={handleExport}
            onReset={handleReset}
          />
        </div>

        {/* Right: Preview (sticky) */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-6 lg:self-start flex justify-center">
          <StoryPreview formData={formData} />
        </div>
      </main>
    </div>
  )
}

export default App
