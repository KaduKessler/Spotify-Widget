import { ShieldCheck } from 'lucide-react'
import Button from './Button'

type Config = {
  id: number
  mode: 'NOW_PLAYING' | 'FIXED_TRACK'
  track_id: string | null
  theme: 'dark' | 'light'
  expose_now_playing: boolean
}

export type WidgetConfigCardProps = {
  config: Config
  saving: boolean
  configError: string | null
  onChangeMode: (mode: Config['mode']) => void
  onChangeTrackId: (value: string | null) => void
  onChangeTheme: (theme: Config['theme']) => void
  onOpenFlags: () => void
  onSave: () => void
}

export default function WidgetConfigCard({
  config,
  saving,
  configError,
  onChangeMode,
  onChangeTrackId,
  onChangeTheme,
  onOpenFlags,
  onSave,
}: WidgetConfigCardProps) {
  return (
    <div className="rounded-3xl border border-white/8 bg-neutral-900/70 backdrop-blur-xl p-6 space-y-5 shadow-[0_20px_90px_rgba(0,0,0,0.45)] min-w-0">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">
          Widget
        </p>
        <p className="text-[11px] text-neutral-400">
          Modo, tema ou track fixa do widget
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <button
          type="button"
          onClick={() => onChangeMode('NOW_PLAYING')}
          className={`rounded-2xl border px-3 py-3 text-left transition ${
            config.mode === 'NOW_PLAYING'
              ? 'border-emerald-400/60 bg-emerald-400/10'
              : 'border-white/10 bg-white/5 hover:border-white/20'
          }`}
        >
          <span className="block text-xs uppercase tracking-[0.14em] text-neutral-400">
            Modo
          </span>
          <span className="block text-base font-semibold">Now Playing</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeMode('FIXED_TRACK')}
          className={`rounded-2xl border px-3 py-3 text-left transition ${
            config.mode === 'FIXED_TRACK'
              ? 'border-emerald-400/60 bg-emerald-400/10'
              : 'border-white/10 bg-white/5 hover:border-white/20'
          }`}
        >
          <span className="block text-xs uppercase tracking-[0.14em] text-neutral-400">
            Modo
          </span>
          <span className="block text-base font-semibold">Track fixa</span>
        </button>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="track_id"
          className="text-sm font-semibold text-neutral-100"
        >
          Track fixa
        </label>
        <input
          id="track_id"
          type="text"
          className="w-full rounded-xl border border-white/10 bg-neutral-900/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
          placeholder="ID ou URL da música"
          value={config.track_id ?? ''}
          onChange={(e) => onChangeTrackId(e.target.value || null)}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Tema</p>
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1 text-xs">
            <button
              type="button"
              onClick={() => onChangeTheme('dark')}
              className={`px-3 py-1.5 rounded-lg transition ${
                config.theme === 'dark'
                  ? 'bg-emerald-500 text-neutral-900'
                  : 'text-neutral-200 hover:bg-white/10'
              }`}
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => onChangeTheme('light')}
              className={`px-3 py-1.5 rounded-lg transition ${
                config.theme === 'light'
                  ? 'bg-emerald-500 text-neutral-900'
                  : 'text-neutral-200 hover:bg-white/10'
              }`}
            >
              Light
            </button>
          </div>

          <div className="flex items-center gap-2">
            {configError && (
              <span className="text-[11px] text-red-300">{configError}</span>
            )}
            <Button
              variant="outline"
              size="sm"
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
              onClick={onOpenFlags}
            >
              Flags / Privacidade
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              loadingText="Salvando..."
              onClick={onSave}
            >
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
