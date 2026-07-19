import { Check, Music, Trash2, Unlink } from 'lucide-react'
import Button from './Button'

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
  onClientIdChange: (value: string) => void
  onClientSecretChange: (value: string) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onClear: () => void
  onConnect: () => void
  onDisconnect: () => void
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
  onClientIdChange,
  onClientSecretChange,
  onSubmit,
  onClear,
  onConnect,
  onDisconnect,
}: SpotifyPanelProps) {
  return (
    <section className="space-y-3">
      <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
        Integração Spotify
      </p>
      <div
        className="fade-in-up rounded-3xl border border-white/8 bg-neutral-900/70 backdrop-blur-xl p-6 space-y-5 shadow-[0_20px_90px_rgba(0,0,0,0.45)]"
        style={{ animationDelay: '180ms', animationFillMode: 'backwards' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
              Spotify API
            </p>
            <h2 className="text-lg font-semibold">Credenciais</h2>
          </div>
          {spotifyConfig?.configured && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-[11px] text-emerald-200">
              <Check aria-hidden="true" className="h-3 w-3" />
              Configurado
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
              className="w-full rounded-xl border border-white/10 bg-neutral-900/80 px-3 py-2.5 text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
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
              className="w-full rounded-xl border border-white/10 bg-neutral-900/80 px-3 py-2.5 text-sm font-mono transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
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
    </section>
  )
}
