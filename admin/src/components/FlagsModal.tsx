export type FlagsModalProps = {
  open: boolean
  onClose: () => void
  exposeNowPlaying: boolean
  onToggleExpose: (checked: boolean) => void
}

export default function FlagsModal({
  open,
  onClose,
  exposeNowPlaying,
  onToggleExpose,
}: FlagsModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Fechar flags"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClose()
          }
        }}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-950/95 p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">
              Flags
            </p>
            <h3 className="text-lg font-semibold text-white">
              Privacidade e exibição
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-200 hover:border-emerald-400/60"
          >
            Fechar
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div className="grid gap-3">
            <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] items-center">
              <div className="space-y-1 leading-tight">
                <p
                  id="expose-now-playing-label"
                  className="text-sm font-semibold text-white"
                >
                  Expor dados no JSON público
                </p>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Quando ligado, o endpoint /user/api/&lt;usuario&gt; traz Now
                  Playing ou a faixa fixa. Quando desligado, responde 204 (sem
                  conteúdo), ocultando tudo.
                </p>
              </div>
              <label
                className="relative inline-flex items-center cursor-pointer select-none justify-end"
                aria-labelledby="expose-now-playing-label"
              >
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={exposeNowPlaying}
                  onChange={(e) => onToggleExpose(e.target.checked)}
                />
                <div className="peer h-6 w-11 rounded-full bg-neutral-500/60 transition-colors duration-300 ease-out peer-checked:bg-emerald-500 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-white/40 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
