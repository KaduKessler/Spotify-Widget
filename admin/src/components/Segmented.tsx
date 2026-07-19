export default function Segmented<T extends string>({
  value,
  options,
  onChange,
  className = '',
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div
      className={`inline-flex rounded-xl border border-white/10 bg-white/5 p-1 text-xs ${className}`}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 ${
            value === opt.value
              ? 'bg-emerald-500 text-neutral-900'
              : 'text-neutral-200 hover:bg-white/10'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
