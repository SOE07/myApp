import { useEffect, useRef, useState } from 'react'
import renderCanvas, { loadFonts } from '../utils/renderCanvas'

const SCALE = 0.375
const W = 1080
const H = 1920

export default function StoryPreview({ formData, settings, bgImage, slideIndex, slideCount }) {
  const canvasRef = useRef(null)
  const bgImageRef = useRef(null)
  const [fontsReady, setFontsReady] = useState(false)

  // Load fonts once on mount
  useEffect(() => {
    loadFonts().then(() => setFontsReady(true))
  }, [])

  // Load background image when bgImage data URL changes
  useEffect(() => {
    if (!bgImage) {
      bgImageRef.current = null
      return
    }
    const img = new Image()
    img.onload = () => {
      bgImageRef.current = img
      // Trigger re-render
      const canvas = canvasRef.current
      if (canvas && fontsReady) {
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        renderCanvas(ctx, formData, SCALE, settings, img, slideIndex, slideCount)
      }
    }
    img.src = bgImage
  }, [bgImage])

  // Re-render canvas whenever formData, settings change or fonts load
  useEffect(() => {
    if (!fontsReady) return
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    renderCanvas(ctx, formData, SCALE, settings, bgImageRef.current, slideIndex, slideCount)
  }, [formData, settings, fontsReady, bgImage, slideIndex, slideCount])

  return (
    <div>
      <p className="text-xs text-slate-500 mb-2 tracking-wide">
        Vorschau &middot; 1080 &times; 1920 px
        {slideCount > 1 && <> &middot; Slide {slideIndex + 1} von {slideCount}</>}
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
