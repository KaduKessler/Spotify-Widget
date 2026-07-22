import { ExternalLink, Pause, Play, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'

type NowPlaying = {
  isPlaying: boolean
  track: {
    name: string
    artists: string[]
    album: string
    albumArt: string | null
    url: string
  }
  lastPlayedAt?: string
}

export type NowPlayingCardProps = {
  nowPlaying: NowPlaying | null
  loadingNowPlaying: boolean
  onRefresh: () => void
}

export default function NowPlayingCard({
  nowPlaying,
  loadingNowPlaying,
  onRefresh,
}: NowPlayingCardProps) {
  // Sem isso, o card mostra um snapshot congelado (ex: continua "Tocando"
  // mesmo depois de pausar no Spotify) ate alguem clicar em atualizar.
  useEffect(() => {
    const interval = setInterval(onRefresh, 15000)
    return () => clearInterval(interval)
  }, [onRefresh])

  return (
    <div
      className="fade-in-up flex items-center gap-3 rounded-2xl border border-white/8 bg-neutral-900/70 px-4 py-3 backdrop-blur-xl shadow-[0_20px_90px_rgba(0,0,0,0.45)]"
      style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}
    >
      <span className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-neutral-500">
        {nowPlaying?.isPlaying
          ? 'Tocando agora no Spotify'
          : 'Última música no Spotify'}
      </span>

      {nowPlaying ? (
        <>
          <div className="relative shrink-0">
            {nowPlaying.track.albumArt ? (
              <img
                src={nowPlaying.track.albumArt}
                alt=""
                className="h-8 w-8 rounded-md"
              />
            ) : (
              <div className="h-8 w-8 rounded-md bg-white/5" />
            )}
            {nowPlaying.isPlaying && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full border border-neutral-900 bg-emerald-500" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">
              <span className="font-semibold text-white">
                {nowPlaying.track.name}
              </span>
              <span className="text-neutral-500"> — </span>
              <span className="text-neutral-400">
                {nowPlaying.track.artists.join(', ')}
              </span>
            </p>
          </div>

          <span
            className={`hidden shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] sm:inline-flex ${nowPlaying.isPlaying ? 'bg-emerald-500/20 text-emerald-300' : 'bg-neutral-700/50 text-neutral-400'}`}
          >
            {nowPlaying.isPlaying ? (
              <Play aria-hidden="true" className="h-2.5 w-2.5" />
            ) : (
              <Pause aria-hidden="true" className="h-2.5 w-2.5" />
            )}
            {nowPlaying.isPlaying ? 'Tocando' : 'Última'}
          </span>

          <a
            href={nowPlaying.track.url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-lg p-1.5 text-neutral-400 transition-all duration-150 hover:bg-white/5 hover:text-emerald-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
            title="Abrir no Spotify"
          >
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
          </a>
        </>
      ) : (
        <p className="min-w-0 flex-1 truncate text-sm text-neutral-400">
          {loadingNowPlaying
            ? 'Carregando...'
            : 'Nenhuma música tocando ou recentemente tocada'}
        </p>
      )}

      <button
        type="button"
        onClick={onRefresh}
        disabled={loadingNowPlaying}
        className="shrink-0 rounded-lg p-1.5 text-neutral-400 transition-all duration-150 hover:bg-white/5 hover:text-emerald-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 disabled:opacity-50"
        title="Atualizar"
      >
        <RefreshCw
          aria-hidden="true"
          className={`h-4 w-4 ${loadingNowPlaying ? 'animate-spin' : ''}`}
        />
      </button>
    </div>
  )
}
