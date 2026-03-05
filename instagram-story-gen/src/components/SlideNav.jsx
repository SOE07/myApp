export default function SlideNav({
  slides,
  activeIndex,
  onSelect,
  onAdd,
  onRemove,
  onDuplicate,
}) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Slides ({slides.length})
        </h2>
        <button
          type="button"
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          onClick={onAdd}
        >
          + Slide hinzufügen
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {slides.map((slide, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            className={`relative group flex-shrink-0 w-20 h-14 rounded-lg cursor-pointer
              flex flex-col items-center justify-center text-xs
              border-2 transition-colors
              ${index === activeIndex
                ? 'border-purple-500 bg-slate-700'
                : 'border-slate-600 bg-slate-800 hover:border-slate-500'}`}
          >
            <span className="font-bold text-white">{index + 1}</span>
            {slide.tag && (
              <span className="text-[10px] text-slate-400 truncate w-16 text-center">
                {slide.tag}
              </span>
            )}

            {/* Hover actions */}
            <div className="absolute -top-1.5 -right-1.5 hidden group-hover:flex gap-0.5">
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); onDuplicate(index) }}
                className="w-5 h-5 rounded-full bg-slate-600 text-white text-[10px] flex items-center justify-center hover:bg-purple-500"
                title="Duplizieren"
              >
                +
              </span>
              {slides.length > 1 && (
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); onRemove(index) }}
                  className="w-5 h-5 rounded-full bg-slate-600 text-red-400 text-[10px] flex items-center justify-center hover:bg-red-600 hover:text-white"
                  title="Entfernen"
                >
                  x
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
