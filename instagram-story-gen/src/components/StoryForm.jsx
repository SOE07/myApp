import { useRef } from 'react'
import * as XLSX from 'xlsx'

const MAX = {
  tag: 30,
  title: 60,
  subheadline: 100,
  bullet: 80,
  cta: 60,
  bullets: 5,
}

function CharCount({ value, max }) {
  const len = value?.length ?? 0
  return (
    <span className={`text-xs block text-right mt-1 ${len >= max ? 'text-red-400' : 'text-slate-500'}`}>
      {len}/{max}
    </span>
  )
}

function Field({ label, children }) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function Slider({ label, value, min, max, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-28 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-purple-500 h-1.5"
      />
      <span className="text-xs text-slate-400 w-10 text-right">{value}px</span>
    </div>
  )
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-28 shrink-0">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded border border-slate-600 cursor-pointer bg-transparent"
      />
      <span className="text-xs text-slate-500">{value}</span>
    </div>
  )
}

const INPUT_CLS =
  'w-full bg-slate-900 text-white text-sm rounded-lg border border-slate-600 px-3 py-2.5 outline-none placeholder:text-slate-500 focus:border-purple-500 transition-colors'

export default function StoryForm({
  formData,
  onChange,
  settings,
  onSettingsChange,
  bgImage,
  onBgUpload,
  onBgRemove,
  onExcelImport,
  onExport,
  onReset,
  slideCount,
}) {
  const fileInputRef = useRef(null)
  const excelInputRef = useRef(null)

  const set = (key, value) => onChange({ ...formData, [key]: value })
  const setSetting = (key, value) => onSettingsChange({ ...settings, [key]: value })

  const setBullet = (idx, value) => {
    const next = [...formData.bullets]
    next[idx] = value
    onChange({ ...formData, bullets: next })
  }

  const addBullet = () => {
    if (formData.bullets.length >= MAX.bullets) return
    onChange({ ...formData, bullets: [...formData.bullets, ''] })
  }

  const removeBullet = (idx) => {
    onChange({ ...formData, bullets: formData.bullets.filter((_, i) => i !== idx) })
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) onBgUpload(file)
    e.target.value = ''
  }

  const handleExcelChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet)
      onExcelImport(rows)
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ══════ Left column: Inhalte ══════ */}
        <div>
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Inhalte</h2>

          {/* ── Excel Import ── */}
          <div className="mb-5 p-4 rounded-lg border border-dashed border-slate-600">
            <p className="text-sm font-medium text-slate-300 mb-2">Excel Import</p>
            <p className="text-xs text-slate-500 mb-3">
              Spalten: Thema, Titel, Subheadline, Bullet1–Bullet5, CTA
            </p>
            <input
              ref={excelInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleExcelChange}
            />
            <button
              type="button"
              className="text-sm bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
              onClick={() => excelInputRef.current?.click()}
            >
              Excel-Datei laden
            </button>
          </div>

          {/* ── Template Upload ── */}
          <div className="mb-5 p-4 rounded-lg border border-dashed border-slate-600">
            <p className="text-sm font-medium text-slate-300 mb-2">Hintergrund-Template</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {bgImage ? (
              <div className="flex items-center gap-3">
                <img src={bgImage} alt="Template" className="w-16 h-28 object-cover rounded" />
                <div>
                  <p className="text-xs text-slate-400">Template aktiv</p>
                  <button
                    type="button"
                    className="text-xs text-red-400 hover:text-red-300 mt-1 transition-colors"
                    onClick={onBgRemove}
                  >
                    Entfernen
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="text-sm bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                Bild hochladen
              </button>
            )}
          </div>

          {/* ── Thema ── */}
          <Field label="Thema">
            <input
              type="text"
              className={INPUT_CLS}
              placeholder="z.B. Marktanalyse"
              maxLength={MAX.tag}
              value={formData.tag}
              onChange={(e) => set('tag', e.target.value)}
            />
            <CharCount value={formData.tag} max={MAX.tag} />
          </Field>

          {/* ── Titel ── */}
          <Field label="Titel">
            <input
              type="text"
              className={INPUT_CLS}
              placeholder="Hauptüberschrift der Story"
              maxLength={MAX.title}
              value={formData.title}
              onChange={(e) => set('title', e.target.value)}
            />
            <CharCount value={formData.title} max={MAX.title} />
          </Field>

          {/* ── Subheadline ── */}
          <Field label="Subheadline">
            <textarea
              className={`${INPUT_CLS} resize-none`}
              rows={2}
              placeholder="Kurze Beschreibung oder Kontext"
              maxLength={MAX.subheadline}
              value={formData.subheadline}
              onChange={(e) => set('subheadline', e.target.value)}
            />
            <CharCount value={formData.subheadline} max={MAX.subheadline} />
          </Field>

          {/* ── Bullet Points ── */}
          <Field label="Bullet Points">
            <div className="space-y-2">
              {formData.bullets.map((bullet, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-14 shrink-0">
                      Punkt {idx + 1}
                    </span>
                    <input
                      type="text"
                      className={`${INPUT_CLS} flex-1`}
                      placeholder={`Bullet Point ${idx + 1}`}
                      maxLength={MAX.bullet}
                      value={bullet}
                      onChange={(e) => setBullet(idx, e.target.value)}
                    />
                    <button
                      type="button"
                      className="text-slate-500 hover:text-red-400 text-lg leading-none px-1 transition-colors"
                      onClick={() => removeBullet(idx)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="pl-16">
                    <CharCount value={bullet} max={MAX.bullet} />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="mt-2 text-sm text-purple-400 hover:text-purple-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
              disabled={formData.bullets.length >= MAX.bullets}
              onClick={addBullet}
            >
              + Bullet hinzufügen
            </button>
          </Field>

          {/* ── CTA ── */}
          <Field label="CTA / Footer Text">
            <input
              type="text"
              className={INPUT_CLS}
              placeholder="Optional, z.B. Folge @TradingInsights"
              maxLength={MAX.cta}
              value={formData.cta}
              onChange={(e) => set('cta', e.target.value)}
            />
            <CharCount value={formData.cta} max={MAX.cta} />
          </Field>
        </div>

        {/* ══════ Right column: Einstellungen ══════ */}
        <div>
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Einstellungen</h2>

          {/* ── Schriftgröße & Abstände ── */}
          <div className="mb-5 p-4 rounded-lg border border-slate-700 space-y-3">
            <p className="text-sm font-medium text-slate-300 mb-1">Schriftgröße & Abstände</p>
            <Slider
              label="Titel"
              value={settings.titleFontSize}
              min={40}
              max={120}
              onChange={(v) => setSetting('titleFontSize', v)}
            />
            <Slider
              label="Subheadline"
              value={settings.subFontSize}
              min={20}
              max={60}
              onChange={(v) => setSetting('subFontSize', v)}
            />
            <Slider
              label="Bullets"
              value={settings.bulletFontSize}
              min={20}
              max={60}
              onChange={(v) => setSetting('bulletFontSize', v)}
            />
            <Slider
              label="CTA"
              value={settings.ctaFontSize}
              min={20}
              max={60}
              onChange={(v) => setSetting('ctaFontSize', v)}
            />
            <Slider
              label="Bullet-Abstand"
              value={settings.bulletSpacing}
              min={60}
              max={160}
              onChange={(v) => setSetting('bulletSpacing', v)}
            />
          </div>

          {/* ── Farben ── */}
          <div className="mb-5 p-4 rounded-lg border border-slate-700 space-y-3">
            <p className="text-sm font-medium text-slate-300 mb-1">Farben</p>
            <ColorPicker
              label="Titel"
              value={settings.titleColor}
              onChange={(v) => setSetting('titleColor', v)}
            />
            <ColorPicker
              label="Bulletpoints"
              value={settings.bulletColor}
              onChange={(v) => setSetting('bulletColor', v)}
            />
          </div>

          {/* ── Rahmen / Border ── */}
          <div className="mb-5 p-4 rounded-lg border border-slate-700 space-y-3">
            <p className="text-sm font-medium text-slate-300 mb-1">Rahmen</p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-28 shrink-0">Anzeigen</span>
              <button
                type="button"
                className={`relative w-10 h-5 rounded-full transition-colors ${settings.showBorder ? 'bg-purple-500' : 'bg-slate-600'}`}
                onClick={() => setSetting('showBorder', !settings.showBorder)}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${settings.showBorder ? 'translate-x-5' : ''}`}
                />
              </button>
              <span className="text-xs text-slate-500">
                {settings.showBorder ? 'Ein' : 'Aus'}
              </span>
            </div>
            {settings.showBorder && (
              <ColorPicker
                label="Rahmenfarbe"
                value={settings.borderColor}
                onChange={(v) => setSetting('borderColor', v)}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Actions (full width below both columns) ── */}
      <div className="mt-6">
        <button
          type="button"
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-colors"
          onClick={onExport}
        >
          Story herunterladen{slideCount > 1 ? ` (${slideCount} Slides)` : ''}
        </button>

        <div className="text-center mt-3">
          <button
            type="button"
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            onClick={onReset}
          >
            Zurücksetzen
          </button>
        </div>
      </div>
    </div>
  )
}
