import { Check, Copy, ExternalLink } from 'lucide-react'

export type WidgetPreviewCardProps = {
  widgetUrl: string
  previewUrl: string
  previewKey: number
  previewLoading: boolean
  onPreviewLoad: () => void
  onPreviewError: () => void
  copiedEmbed: boolean
  copiedUrl: boolean
  onCopyEmbed: () => void
  onCopyUrl: () => void
}

export default function WidgetPreviewCard({
  widgetUrl,
  previewUrl,
  previewKey,
  previewLoading,
  onPreviewLoad,
  onPreviewError,
  copiedEmbed,
  copiedUrl,
  onCopyEmbed,
  onCopyUrl,
}: WidgetPreviewCardProps) {
  const previewSrc = `${widgetUrl}${widgetUrl.includes('?') ? '&' : '?'}_=${previewKey}`

  return (
    <div className="rounded-3xl border border-white/8 bg-neutral-900/70 backdrop-blur-xl p-6 space-y-4 shadow-[0_20px_90px_rgba(0,0,0,0.45)] min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">
            Preview
          </p>
          <p className="text-[11px] text-neutral-400">
            Rota pública para embutir o widget SVG
          </p>
        </div>
        <code className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-neutral-300">
          /widget
        </code>
      </div>
      <div className="relative aspect-[495/160] w-full overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/70">
        {previewLoading && (
          <div className="absolute inset-0 animate-pulse bg-linear-to-r from-white/5 via-white/10 to-white/5" />
        )}
        <img
          key={previewKey}
          src={previewSrc}
          alt="Preview do widget Spotify"
          className={`h-full w-full object-cover transition-opacity duration-200 ${previewLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={onPreviewLoad}
          onError={onPreviewError}
        />
      </div>
      <div className="flex items-center gap-2 text-[11px] text-neutral-400">
        <button
          type="button"
          onClick={onCopyEmbed}
          className={`inline-flex max-w-[320px] items-center gap-1.5 truncate text-left rounded-lg border px-2 py-1 transition cursor-pointer font-mono ${copiedEmbed ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100' : 'border-white/10 bg-white/5 hover:border-emerald-400/60'}`}
        >
          {copiedEmbed ? (
            <Check aria-hidden="true" className="w-3 h-3 shrink-0" />
          ) : (
            <Copy aria-hidden="true" className="w-3 h-3 shrink-0" />
          )}
          {copiedEmbed ? 'Copiado!' : `<img src="${previewUrl}" />`}
        </button>
        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 hover:border-emerald-400/60 transition"
        >
          Abrir
          <ExternalLink aria-hidden="true" className="w-3 h-3" />
        </a>
        <button
          type="button"
          onClick={onCopyUrl}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 transition cursor-pointer ${copiedUrl ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100' : 'border-white/10 bg-white/5 hover:border-emerald-400/60'}`}
        >
          {copiedUrl ? (
            <Check aria-hidden="true" className="w-3 h-3" />
          ) : (
            <Copy aria-hidden="true" className="w-3 h-3" />
          )}
          {copiedUrl ? 'Copiado!' : 'Copiar URL'}
        </button>
      </div>
    </div>
  )
}
