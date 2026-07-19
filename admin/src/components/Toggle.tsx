export type ToggleProps = {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
}

export default function Toggle({
  id,
  checked,
  onChange,
  label,
  disabled = false,
}: ToggleProps) {
  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-3 text-sm text-neutral-300 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer select-none'}`}
    >
      <span className="relative inline-flex shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="h-6 w-11 rounded-full bg-neutral-500/60 transition-colors duration-300 ease-out peer-checked:bg-emerald-500 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-emerald-500/70 peer-focus-visible:outline-offset-2 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-white/40 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
      </span>
      <span>{label}</span>
    </label>
  )
}
