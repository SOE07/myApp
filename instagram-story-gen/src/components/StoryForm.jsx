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

const INPUT_CLS =
  'w-full bg-slate-900 text-white text-sm rounded-lg border border-slate-600 px-3 py-2.5 outline-none placeholder:text-slate-500 focus:border-purple-500 transition-colors'

export default function StoryForm({ formData, onChange, onExport, onReset }) {
  const set = (key, value) => onChange({ ...formData, [key]: value })

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

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      {/* Thema */}
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

      {/* Titel */}
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

      {/* Subheadline */}
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

      {/* Bullet Points */}
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

      {/* CTA */}
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

      {/* Actions */}
      <button
        type="button"
        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-colors mt-2"
        onClick={onExport}
      >
        Story herunterladen
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
  )
}
