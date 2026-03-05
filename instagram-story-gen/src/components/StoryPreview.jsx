import { useEffect, useRef, useState } from 'react'
import renderCanvas, { loadFonts } from '../utils/renderCanvas'

const SCALE = 0.375
const W = 1080
const H = 1920

export default function StoryPreview({ formData }) {
  const canvasRef = useRef(null)
  const [fontsReady, setFontsReady] = useState(false)

  // Load fonts once on mount
  useEffect(() => {
    loadFonts().then(() => setFontsReady(true))
  }, [])

  // Re-render canvas whenever formData changes or fonts load
  useEffect(() => {
    if (!fontsReady) return
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    renderCanvas(ctx, formData, SCALE)
  }, [formData, fontsReady])

  return (
    <div>
      <p className="text-xs text-slate-500 mb-2 tracking-wide">
        Vorschau &middot; 1080 &times; 1920 px
      </p>
      <canvas
        ref={canvasRef}
        width={W * SCALE}
        height={H * SCALE}
        className="rounded-2xl shadow-2xl w-full max-w-[405px]"
      />
    </div>
  )
}
