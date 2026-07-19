import { Check, Copy, ExternalLink, ShieldCheck } from 'lucide-react'
import Button from './Button'
import Segmented from './Segmented'

type Config = {
  id: number
  mode: 'NOW_PLAYING' | 'FIXED_TRACK'
  track_id: string | null
  theme: 'dark' | 'light'
  expose_now_playing: boolean
}

export type WidgetEditorCardProps = {
  config: Config
  saving: boolean
  configError: string | null
  onChangeMode: (mode: Config['mode']) => void
  onChangeTrackId: (value: string | null) => void
  onChangeTheme: (theme: Config['theme']) => void
  onOpenFlags: () => void
  onSave: () => void
  customBg: string
  customColor: string
  customScale: number
  onChangeCustomBg: (value: string) => void
  onChangeCustomColor: (value: string) => void
  onChangeCustomScale: (value: number) => void
  widgetUrl: string
  previewUrl: string
  previewKey: number
  previewLoading: boolean
  onPreviewLoad: () => void
  onPreviewError: () => void
  copiedFormat: 'markdown' | 'html' | 'url' | null
  onCopyMarkdown: () => void
  onCopyHtml: () => void
  onCopyUrl: () => void
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs text-neutral-400">{children}</span>
}

function ColorSwatch({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (hex: string) => void
  label: string
}) {
  return (
    <input
      type="color"
      aria-label={label}
      value={`#${value}`}
      onChange={(e) => onChange(e.target.value.slice(1))}
      className="h-8 w-9 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-transparent transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0.5"
    />
  )
}

function EmbedChip({
  label,
  snippet,
  copied,
  onCopy,
}: {
  label: string
  snippet: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      className={`inline-flex min-w-0 items-center gap-1.5 truncate rounded-lg border px-2.5 py-1.5 text-left font-mono text-[11px] transition-all duration-150 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 ${copied ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100' : 'border-white/10 bg-white/5 text-neutral-300 hover:border-emerald-400/60'}`}
    >
      <span className="shrink-0 text-[10px] uppercase tracking-[0.08em] text-neutral-500">
        {label}
      </span>
      {copied ? (
        <Check aria-hidden="true" className="h-3 w-3 shrink-0" />
      ) : (
        <Copy aria-hidden="true" className="h-3 w-3 shrink-0" />
      )}
      <span className="truncate">{copied ? 'Copiado!' : snippet}</span>
    </button>
  )
}

export default function WidgetEditorCard({
  config,
  saving,
  configError,
  onChangeMode,
  onChangeTrackId,
  onChangeTheme,
  onOpenFlags,
  onSave,
  customBg,
  customColor,
  customScale,
  onChangeCustomBg,
  onChangeCustomColor,
  onChangeCustomScale,
  widgetUrl,
  previewUrl,
  previewKey,
  previewLoading,
  onPreviewLoad,
  onPreviewError,
  copiedFormat,
  onCopyMarkdown,
  onCopyHtml,
  onCopyUrl,
}: WidgetEditorCardProps) {
  const bgMode =
    customBg === 'transparent' ? 'transparent' : customBg ? 'custom' : 'default'
  const previewSrc = `${widgetUrl}${widgetUrl.includes('?') ? '&' : '?'}_=${previewKey}`

  return (
    <div
      className="fade-in-up overflow-hidden rounded-3xl border border-white/8 bg-neutral-900/70 backdrop-blur-xl shadow-[0_20px_90px_rgba(0,0,0,0.45)]"
      style={{ animationDelay: '60ms', animationFillMode: 'backwards' }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">
            Widget
          </p>
          <p className="text-[11px] text-neutral-400">
            Editor: ajuste e veja o resultado no mesmo lugar
          </p>
        </div>
        <code className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-neutral-300">
          /widget
        </code>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px]">
        {/* Canvas: preview + embed */}
        <div className="flex min-w-0 flex-col gap-4 p-6">
          <div className="relative flex min-h-[220px] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/70 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] p-6">
            <div
              className="relative w-full transition-[max-width] duration-150 ease-out"
              style={{ maxWidth: `${495 * customScale}px` }}
            >
              <div className="relative aspect-[495/160] w-full overflow-hidden rounded-lg shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
                {previewLoading && (
                  <div className="absolute inset-0 animate-pulse bg-linear-to-r from-white/5 via-white/10 to-white/5" />
                )}
                <img
                  key={previewKey}
                  src={previewSrc}
                  alt="Preview do widget Spotify"
                  className={`h-full w-full object-contain transition-opacity duration-200 ${previewLoading ? 'opacity-0' : 'opacity-100'}`}
                  onLoad={onPreviewLoad}
                  onError={onPreviewError}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-100">Embed</p>
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-neutral-300 transition-all duration-150 hover:border-emerald-400/60 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
            >
              Abrir
              <ExternalLink aria-hidden="true" className="w-3 h-3" />
            </a>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <EmbedChip
              label="MD"
              snippet={`![Spotify](${previewUrl})`}
              copied={copiedFormat === 'markdown'}
              onCopy={onCopyMarkdown}
            />
            <EmbedChip
              label="HTML"
              snippet={`<img src="${previewUrl}" />`}
              copied={copiedFormat === 'html'}
              onCopy={onCopyHtml}
            />
            <EmbedChip
              label="URL"
              snippet={previewUrl}
              copied={copiedFormat === 'url'}
              onCopy={onCopyUrl}
            />
          </div>
        </div>

        {/* Rail: controls */}
        <div className="flex flex-col gap-5 border-t border-white/10 bg-black/20 p-6 lg:border-t-0 lg:border-l">
          <div className="space-y-2">
            <FieldLabel>Modo</FieldLabel>
            <Segmented
              className="w-full"
              value={config.mode}
              onChange={onChangeMode}
              options={[
                { value: 'NOW_PLAYING', label: 'Now Playing' },
                { value: 'FIXED_TRACK', label: 'Track fixa' },
              ]}
            />
            {config.mode === 'FIXED_TRACK' && (
              <div className="field-reveal space-y-1.5 pt-1">
                <label
                  htmlFor="track_id"
                  className="block text-xs text-neutral-400"
                >
                  URL ou ID da música
                </label>
                <input
                  id="track_id"
                  type="text"
                  className="w-full rounded-xl border border-white/10 bg-neutral-900/80 px-3 py-2.5 text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
                  placeholder="ex: open.spotify.com/track/..."
                  value={config.track_id ?? ''}
                  onChange={(e) => onChangeTrackId(e.target.value || null)}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <FieldLabel>Tema</FieldLabel>
            <Segmented
              className="w-full"
              value={config.theme}
              onChange={onChangeTheme}
              options={[
                { value: 'dark', label: 'Dark' },
                { value: 'light', label: 'Light' },
              ]}
            />
          </div>

          <hr className="border-white/10" />

          <div className="space-y-2">
            <FieldLabel>Fundo</FieldLabel>
            <div className="flex items-center gap-2">
              <Segmented
                className="flex-1"
                value={bgMode}
                onChange={(mode) => {
                  if (mode === 'default') onChangeCustomBg('')
                  else if (mode === 'transparent')
                    onChangeCustomBg('transparent')
                  else onChangeCustomBg(customBg || '151b23')
                }}
                options={[
                  { value: 'default', label: 'Padrão' },
                  { value: 'transparent', label: 'Transp.' },
                  { value: 'custom', label: 'Cor' },
                ]}
              />
              {bgMode === 'custom' && (
                <ColorSwatch
                  label="Cor de fundo"
                  value={customBg}
                  onChange={onChangeCustomBg}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel>Cor do texto</FieldLabel>
            <div className="flex items-center gap-2">
              <Segmented
                className="flex-1"
                value={customColor ? 'custom' : 'default'}
                onChange={(mode) =>
                  onChangeCustomColor(
                    mode === 'custom' ? customColor || 'ffffff' : '',
                  )
                }
                options={[
                  { value: 'default', label: 'Padrão' },
                  { value: 'custom', label: 'Cor' },
                ]}
              />
              {customColor && (
                <ColorSwatch
                  label="Cor do texto"
                  value={customColor}
                  onChange={onChangeCustomColor}
                />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <FieldLabel>Tamanho</FieldLabel>
              <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-emerald-300">
                {Math.round(customScale * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.1}
              value={customScale}
              onChange={(e) => onChangeCustomScale(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-neutral-900 [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgba(255,255,255,0.15)] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-neutral-900 [&::-moz-range-thumb]:bg-emerald-400 focus-visible:outline-none [&:focus-visible::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(16,185,129,0.35)]"
              style={{
                background: `linear-gradient(to right, #34d399 0%, #34d399 ${((customScale - 0.5) / (3 - 0.5)) * 100}%, rgba(255,255,255,0.1) ${((customScale - 0.5) / (3 - 0.5)) * 100}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />
            <div className="flex items-center justify-between text-[10px] text-neutral-500">
              <span>50%</span>
              <span>300%</span>
            </div>
          </div>

          <div className="mt-auto space-y-2 pt-2">
            {configError && (
              <p className="text-[11px] text-red-300">{configError}</p>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                icon={<ShieldCheck className="w-3.5 h-3.5" />}
                onClick={onOpenFlags}
              >
                Flags
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
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
    </div>
  )
}
