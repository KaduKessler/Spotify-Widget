import { ExternalLink, Music, RefreshCw, Trash2, Unlink } from 'lucide-react'
import Button from './Button'

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

export type SpotifyPanelProps = {
  spotifyConfig: {
    configured: boolean
    clientId: string | null
    clientSecret: string | null
  } | null
  spotifyClientId: string
  spotifyClientSecret: string
  savingSpotify: boolean
  spotifyError: string | null
  spotifySuccess: string | null
  spotifyConnected: boolean
  loadingSpotifyStatus: boolean
  nowPlaying: NowPlaying | null
  loadingNowPlaying: boolean
  onClientIdChange: (value: string) => void
  onClientSecretChange: (value: string) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onClear: () => void
  onConnect: () => void
  onDisconnect: () => void
  onRefreshNowPlaying: () => void
}

export default function SpotifyPanel({
  spotifyConfig,
  spotifyClientId,
  spotifyClientSecret,
  savingSpotify,
  spotifyError,
  spotifySuccess,
  spotifyConnected,
  loadingSpotifyStatus,
  nowPlaying,
  loadingNowPlaying,
  onClientIdChange,
  onClientSecretChange,
  onSubmit,
  onClear,
  onConnect,
  onDisconnect,
  onRefreshNowPlaying,
}: SpotifyPanelProps) {
  return (
    <section className="space-y-3">
      <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
        Integração Spotify
      </p>
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <div className="rounded-3xl border border-white/8 bg-neutral-900/70 backdrop-blur-xl p-6 space-y-5 shadow-[0_20px_90px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
                Spotify API
              </p>
              <h2 className="text-lg font-semibold">Credenciais</h2>
            </div>
            {spotifyConfig?.configured && (
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-[11px] text-emerald-200">
                ✓ Configurado
              </span>
            )}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="spotify-client-id"
                className="block text-xs text-neutral-400"
              >
                Client ID
              </label>
              <input
                id="spotify-client-id"
                type="text"
                className="w-full rounded-xl border border-neutral-700/80 bg-neutral-900/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70 transition"
                value={spotifyClientId}
                onChange={(e) => onClientIdChange(e.target.value)}
                placeholder="Seu Spotify Client ID"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="spotify-client-secret"
                className="block text-xs text-neutral-400"
              >
                Client Secret
              </label>
              <input
                id="spotify-client-secret"
                type="password"
                className="w-full rounded-xl border border-neutral-700/80 bg-neutral-900/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70 transition font-mono"
                value={spotifyClientSecret}
                onChange={(e) => onClientSecretChange(e.target.value)}
                placeholder={
                  spotifyConfig?.configured
                    ? spotifyConfig.clientSecret || 'Novo secret'
                    : 'Seu Spotify Client Secret'
                }
              />
            </div>

            {spotifyError && (
              <div className="rounded-xl border border-red-500/40 bg-red-900/40 px-3 py-2 text-xs text-red-100">
                {spotifyError}
              </div>
            )}

            {spotifySuccess && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-900/40 px-3 py-2 text-xs text-emerald-100">
                {spotifySuccess}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={!spotifyClientId || !spotifyClientSecret}
                loading={savingSpotify}
                loadingText="Salvando..."
              >
                {spotifyConfig?.configured ? 'Atualizar' : 'Salvar'}
              </Button>

              {spotifyConfig?.configured && (
                <Button
                  type="button"
                  variant="danger"
                  icon={<Trash2 className="w-4 h-4" />}
                  disabled={savingSpotify}
                  onClick={onClear}
                >
                  Limpar
                </Button>
              )}
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Obtenha suas credenciais em{' '}
              <a
                href="https://developer.spotify.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline"
              >
                Spotify Developer Dashboard
              </a>
            </p>
          </form>

          {spotifyConfig?.configured && (
            <div className="pt-4 border-t border-white/5 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-neutral-400 mb-1">
                  Conta do Spotify
                </p>
                <p className="text-sm text-neutral-300">
                  {spotifyConnected
                    ? 'Conta conectada com sucesso!'
                    : 'Conecte sua conta para usar o modo Now Playing'}
                </p>
              </div>

              {spotifyConnected ? (
                <Button
                  variant="danger"
                  fullWidth
                  icon={<Unlink className="w-4 h-4" />}
                  loading={loadingSpotifyStatus}
                  loadingText="Desconectando..."
                  onClick={onDisconnect}
                >
                  Desconectar Spotify
                </Button>
              ) : (
                <Button
                  variant="spotify"
                  fullWidth
                  icon={<Music className="w-4 h-4" />}
                  onClick={onConnect}
                >
                  Conectar com Spotify
                </Button>
              )}
            </div>
          )}
        </div>

        {spotifyConnected && (
          <div className="rounded-3xl border border-white/8 bg-neutral-900/70 backdrop-blur-xl p-6 space-y-4 shadow-[0_20px_90px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
                  Spotify
                </p>
                <h2 className="text-lg font-semibold">Now Playing</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<RefreshCw className="w-3 h-3" />}
                loading={loadingNowPlaying}
                onClick={onRefreshNowPlaying}
              >
                Atualizar
              </Button>
            </div>

            {nowPlaying ? (
              <div className="space-y-3">
                <div className="flex gap-3">
                  {nowPlaying.track.albumArt && (
                    <img
                      src={nowPlaying.track.albumArt}
                      alt={nowPlaying.track.album}
                      className="w-16 h-16 rounded-lg shadow-lg"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">
                      {nowPlaying.track.name}
                    </p>
                    <p className="text-sm text-neutral-400 truncate">
                      {nowPlaying.track.artists.join(', ')}
                    </p>
                    <p className="text-xs text-neutral-400 truncate">
                      {nowPlaying.track.album}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`px-2 py-1 rounded-full ${nowPlaying.isPlaying ? 'bg-emerald-500/20 text-emerald-300' : 'bg-neutral-700/50 text-neutral-400'}`}
                  >
                    {nowPlaying.isPlaying
                      ? '▶ Tocando agora'
                      : '⏸ Última tocada'}
                  </span>
                  {nowPlaying.lastPlayedAt && !nowPlaying.isPlaying && (
                    <span className="text-neutral-400">
                      {new Date(nowPlaying.lastPlayedAt).toLocaleString(
                        'pt-BR',
                      )}
                    </span>
                  )}
                </div>

                <a
                  href={nowPlaying.track.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1DB954] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-[#1ed760] transition"
                >
                  Abrir no Spotify
                  <ExternalLink aria-hidden="true" className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <p className="text-sm text-neutral-400">
                {loadingNowPlaying
                  ? 'Carregando...'
                  : 'Nenhuma música tocando ou recentemente tocada'}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
