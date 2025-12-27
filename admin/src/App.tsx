import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Config = {
  id: number
  mode: 'NOW_PLAYING' | 'FIXED_TRACK'
  track_id: string | null
  theme: 'dark' | 'light'
  expose_now_playing: boolean
}

type Me = {
  id: string
  provider: string
}

type AuthProvider = 'none' | 'password' | 'github'

function LoginShell({
  hero,
  children,
}: {
  hero: ReactNode
  children: ReactNode
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950">
      <div className="absolute inset-0 bg-linear-to-br from-emerald-500/15 via-cyan-500/12 to-sky-600/18 blur-3xl" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-emerald-400/14 blur-3xl" />
        <div className="absolute -right-20 top-6 h-72 w-72 rounded-full bg-sky-400/14 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 h-52 w-52 rounded-full bg-teal-400/12 blur-3xl" />
      </div>
      <div className="relative z-10 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl space-y-6">
          <div className="text-center space-y-2">{hero}</div>
          {children}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [authProviders, setAuthProviders] = useState<AuthProvider[]>([])
  const [me, setMe] = useState<Me | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  const [config, setConfig] = useState<Config | null>(null)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [saving, setSaving] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)
  const [previewKey, setPreviewKey] = useState(0)

  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Spotify config states
  const [spotifyConfig, setSpotifyConfig] = useState<{
    configured: boolean
    clientId: string | null
    clientSecret: string | null
  } | null>(null)
  const [spotifyClientId, setSpotifyClientId] = useState('')
  const [spotifyClientSecret, setSpotifyClientSecret] = useState('')
  const [savingSpotify, setSavingSpotify] = useState(false)
  const [spotifyError, setSpotifyError] = useState<string | null>(null)
  const [spotifySuccess, setSpotifySuccess] = useState<string | null>(null)
  const [spotifyConnected, setSpotifyConnected] = useState(false)
  const [loadingSpotifyStatus, setLoadingSpotifyStatus] = useState(false)

  // Now Playing states
  const [nowPlaying, setNowPlaying] = useState<{
    isPlaying: boolean
    track: {
      name: string
      artists: string[]
      album: string
      albumArt: string | null
      url: string
    }
    lastPlayedAt?: string
  } | null>(null)
  const [loadingNowPlaying, setLoadingNowPlaying] = useState(false)

  // Feedback de cópia
  const [copiedEmbed, setCopiedEmbed] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [showFlagsModal, setShowFlagsModal] = useState(false)

  // Avatar do usuário (usa avatar do GitHub quando disponível)
  const userAvatar = me?.provider === 'github' ? `https://github.com/${me.id}.png?size=80` : null

  // 1) Descobre quais providers estão ativos (suporta múltiplos)
  useEffect(() => {
    const fetchAuthConfig = async () => {
      try {
        const res = await fetch('/api/auth-config')
        if (!res.ok) throw new Error('auth-config failed')
        const data = (await res.json()) as
          | { provider: AuthProvider }
          | { providers: AuthProvider[] }

        // Backward compatibility: se vier provider único
        if ('provider' in data && data.provider) {
          setAuthProviders([data.provider])
        } else if ('providers' in data && Array.isArray(data.providers)) {
          setAuthProviders(data.providers)
        } else {
          setAuthProviders([])
        }
      } catch (err) {
        console.error(err)
        setAuthError('Erro ao carregar configuração de autenticação.')
      }
    }

    fetchAuthConfig()
  }, [])

  // 2) Checa sessão (/api/me) depois de saber os providers
  useEffect(() => {
    if (!authProviders.length) return

    const checkAuth = async () => {
      setCheckingAuth(true)
      setAuthError(null)
      try {
        const res = await fetch('/api/me')
        if (res.status === 401) {
          setMe(null)
          return
        }
        if (!res.ok) throw new Error('me failed')
        const data = (await res.json()) as Me
        setMe(data)
      } catch (err) {
        console.error(err)
        setAuthError('Erro ao verificar autenticação.')
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuth()
  }, [authProviders])

  // 3) Carrega config quando autenticado
  useEffect(() => {
    if (!me) return
    const fetchConfig = async () => {
      setLoadingConfig(true)
      setConfigError(null)
      try {
        const res = await fetch('/api/config')
        if (!res.ok) throw new Error('config failed')
        const data = (await res.json()) as Config & {
          trackId?: string | null
          exposeNowPlaying?: boolean
        }
        // Normaliza snake/camel vindo do backend
        const normalized: Config = {
          ...data,
          track_id: data.track_id ?? data.trackId ?? null,
          expose_now_playing:
            data.expose_now_playing ?? data.exposeNowPlaying ?? true,
        }
        setConfig(normalized)
      } catch (err) {
        console.error(err)
        setConfigError('Erro ao carregar configuração.')
      } finally {
        setLoadingConfig(false)
      }
    }
    fetchConfig()
  }, [me])

  // Fetch now playing - memoized callback
  const fetchNowPlaying = useCallback(async () => {
    setLoadingNowPlaying(true)
    try {
      const res = await fetch('/api/spotify/now-playing')
      if (res.ok) {
        const data = await res.json()
        setNowPlaying(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingNowPlaying(false)
    }
  }, [])

  // 4) Carrega Spotify config quando autenticado
  useEffect(() => {
    if (!me) return
    const fetchSpotifyConfig = async () => {
      try {
        const res = await fetch('/api/spotify-config')
        if (!res.ok) throw new Error('spotify-config failed')
        const data = await res.json() as { configured: boolean; clientId: string | null; clientSecret: string | null }
        setSpotifyConfig(data)
        if (data.clientId) {
          setSpotifyClientId(data.clientId)
        }
        // Check if Spotify is connected (has access token)
        const statusRes = await fetch('/api/spotify/status')
        if (statusRes.ok) {
          const statusData = await statusRes.json() as { connected: boolean }
          setSpotifyConnected(statusData.connected)

          // Se conectado, busca now playing
          if (statusData.connected) {
            fetchNowPlaying()
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchSpotifyConfig()
  }, [me, fetchNowPlaying])

  async function handleSave(nextConfig?: Config) {
    const cfgToSave = nextConfig ?? config
    if (!cfgToSave) return
    setSaving(true)
    setConfigError(null)
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfgToSave),
      })
      if (!res.ok) throw new Error('save failed')
      setPreviewKey((k) => k + 1)
    } catch (err) {
      console.error(err)
      setConfigError('Erro ao salvar configuração.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveSpotify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingSpotify(true)
    setSpotifyError(null)
    setSpotifySuccess(null)

    try {
      const res = await fetch('/api/spotify-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: spotifyClientId,
          clientSecret: spotifyClientSecret,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setSpotifyError(data.error || 'Erro ao salvar credenciais')
        return
      }

      setSpotifySuccess('Credenciais salvas com sucesso!')
      setSpotifyClientSecret('') // Limpa o campo de secret após salvar

      // Recarrega config
      const configRes = await fetch('/api/spotify-config')
      if (configRes.ok) {
        const data = await configRes.json() as { configured: boolean; clientId: string | null; clientSecret: string | null }
        setSpotifyConfig(data)
      }
    } catch (err) {
      console.error(err)
      setSpotifyError('Erro ao salvar credenciais')
    } finally {
      setSavingSpotify(false)
    }
  }

  async function handleClearSpotify() {
    if (!confirm('Tem certeza que deseja remover as credenciais do Spotify?')) {
      return
    }

    setSavingSpotify(true)
    setSpotifyError(null)
    setSpotifySuccess(null)

    try {
      const res = await fetch('/api/spotify-config', { method: 'DELETE' })
      if (!res.ok) {
        setSpotifyError('Erro ao remover credenciais')
        return
      }

      setSpotifySuccess('Credenciais removidas com sucesso!')
      setSpotifyClientId('')
      setSpotifyClientSecret('')
      setSpotifyConfig(null)
      setSpotifyConnected(false)
    } catch (err) {
      console.error(err)
      setSpotifyError('Erro ao remover credenciais')
    } finally {
      setSavingSpotify(false)
    }
  }

  async function handleDisconnectSpotify() {
    if (!confirm('Tem certeza que deseja desconectar sua conta do Spotify?')) {
      return
    }

    setLoadingSpotifyStatus(true)
    try {
      const res = await fetch('/api/spotify/disconnect', { method: 'POST' })
      if (!res.ok) {
        setSpotifyError('Erro ao desconectar conta do Spotify')
        return
      }
      setSpotifyConnected(false)
      setSpotifySuccess('Conta do Spotify desconectada!')
    } catch (err) {
      console.error(err)
      setSpotifyError('Erro ao desconectar')
    } finally {
      setLoadingSpotifyStatus(false)
    }
  }

  async function handleLoginPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoginLoading(true)
    setAuthError(null)

    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      })

      if (!res.ok) {
        setAuthError('Usuário ou senha inválidos.')
        return
      }

      const meRes = await fetch('/api/me')
      if (!meRes.ok) {
        setAuthError('Erro ao obter informações do usuário.')
        return
      }
      const meData = (await meRes.json()) as Me
      setMe(meData)
      setLoginPassword('')
    } catch (err) {
      console.error(err)
      setAuthError('Erro ao fazer login.')
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await fetch('/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error(err)
    }
    setMe(null)
  }

  function handleLoginWithGithub() {
    window.location.href = '/auth/github'
  }

  const widgetUrl = me ? `/widget?user=${encodeURIComponent(me.id)}` : `/widget`
  const backendBase =
    (import.meta.env.VITE_BACKEND_URL as string) || 'http://127.0.0.1:3000'
  const jsonUrl = me
    ? `${backendBase}/user/api/${encodeURIComponent(me.id)}`
    : `${backendBase}/user/api/`

  const previewUrl = useMemo(() => {
    if (typeof window === 'undefined') return widgetUrl
    try {
      return new URL(widgetUrl, window.location.origin).toString()
    } catch {
      return widgetUrl
    }
  }, [widgetUrl])

  function handleConnectSpotify() {
    if (!spotifyConfig?.configured) {
      setSpotifyError('Configure suas credenciais do Spotify primeiro')
      return
    }
    // Redireciona para o fluxo OAuth (usando URL relativa para passar pelo proxy do Vite)
    window.location.href = '/auth/spotify'
  }

  const hasPassword = authProviders.includes('password')
  const hasGithub = authProviders.includes('github')
  const hasNone = authProviders.includes('none')

  // LOADING inicial
  if (!authProviders.length || checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-neutral-100">
        <p className="text-lg text-neutral-300">Carregando painel...</p>
      </div>
    )
  }

  // Se não autenticado → tela de login adequada pro provider
  if (!me) {
    // Caso multi-provider: mostrar ambos em layout moderno
    if (hasPassword && hasGithub) {
      return (
        <LoginShell
          hero={
            <>
              <h1 className="text-3xl font-semibold leading-tight text-white">
                Spotify Readme Admin
              </h1>
              <p className="text-sm text-neutral-300">Escolha como entrar para ajustar o widget.</p>
            </>
          }
        >
          <div className="fade-in-up rounded-3xl border border-white/6 bg-neutral-900/70 backdrop-blur-xl shadow-[0_20px_90px_rgba(0,0,0,0.5)] p-8 space-y-6 max-w-xl mx-auto">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-neutral-500">
                Login
              </p>
              <h2 className="text-lg font-semibold text-white">
                Entre no painel
              </h2>
              <p className="text-xs text-neutral-400 mt-1">Escolha a opção mais conveniente para você.</p>
            </div>

              {showFlagsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                  <button
                    type="button"
                    aria-label="Fechar flags"
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={() => setShowFlagsModal(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setShowFlagsModal(false)
                      }
                    }}
                  />
                  <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-950/95 p-6 shadow-2xl">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">Flags</p>
                        <h3 className="text-lg font-semibold text-white">Privacidade e exibição</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowFlagsModal(false)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-200 hover:border-emerald-400/60"
                      >
                        Fechar
                      </button>
                    </div>

                    <div className="space-y-4 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-white">Expor dados no JSON público</p>
                          <p className="text-xs text-neutral-400 leading-relaxed">
                            Quando ligado, o endpoint /user/api/&lt;usuario&gt; traz Now Playing ou a faixa fixa. Quando desligado, responde 204 (sem conteúdo), ocultando tudo.
                          </p>
                        </div>
                        <label className="inline-flex items-center gap-2 text-xs cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-white/20 bg-white/5"
                            checked={config.expose_now_playing}
                            onChange={(e) =>
                              setConfig({ ...config, expose_now_playing: e.target.checked })
                            }
                          />
                          <span className="text-neutral-200">{config.expose_now_playing ? 'Público' : 'Privado'}</span>
                        </label>
                      </div>

                      <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                        Lembre-se de clicar em "Salvar" no card principal para aplicar as flags.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            {authError && (
              <div className="rounded-xl border border-red-500/40 bg-red-900/40 px-4 py-3 text-xs text-red-100">
                {authError}
              </div>
            )}

            <div className="space-y-4">
              <div className="fade-in-up rounded-2xl border border-white/5 bg-neutral-900/80 p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-neutral-100">Com usuário e senha</p>
                    <p className="text-[11px] text-neutral-500">Credenciais locais do servidor.</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="w-5 h-5 fill-emerald-200"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                    </svg>
                  </div>
                </div>
                <form onSubmit={handleLoginPassword} className="space-y-3">
                  <label className="block text-xs text-neutral-400 space-y-1">
                    <span>Usuário</span>
                    <input
                      id="username"
                      className="w-full rounded-xl border border-neutral-700/80 bg-neutral-900/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70 transition"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      autoComplete="username"
                    />
                  </label>

                  <label className="block text-xs text-neutral-400 space-y-1">
                    <span>Senha</span>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        className="w-full rounded-xl border border-neutral-700/80 bg-neutral-900/80 px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70 transition"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors duration-200"
                      >
                        {showPassword ? (
                          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current transition-opacity duration-200 opacity-100">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current transition-opacity duration-200 opacity-100">
                            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm7.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3-.05 0-.11.01-.17.02z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full rounded-xl bg-linear-to-r from-emerald-400 via-emerald-500 to-cyan-500 text-neutral-900 text-sm font-semibold py-2.5 shadow-lg shadow-emerald-500/25 transition hover:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loginLoading ? 'Entrando...' : 'Entrar com senha'}
                  </button>
                </form>
              </div>

              <div className="fade-in-up rounded-2xl border border-white/5 bg-linear-to-br from-neutral-900/90 via-neutral-900/80 to-neutral-800/80 p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-neutral-100">Com GitHub</p>
                    <p className="text-[11px] text-neutral-500">OAuth seguro e verificado.</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center">
                    <svg
                      viewBox="0 0 16 16"
                      aria-hidden="true"
                      className="w-5 h-5 fill-white/80"
                    >
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.54 5.47 7.59.4.07.55-.17.55-.38 0-.19 0-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8Z" />
                    </svg>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLoginWithGithub}
                  className="w-full rounded-xl bg-white text-neutral-900 text-sm font-semibold py-3 px-4 flex items-center justify-center gap-2 transition hover:shadow-lg hover:-translate-y-px"
                >
                  <span>Continuar com GitHub</span>
                </button>
              </div>
            </div>
          </div>
        </LoginShell>
      )
    }

    if (hasPassword && !hasGithub) {
      return (
        <LoginShell
          hero={
            <>
              <h1 className="text-3xl font-semibold text-white">
                Entrar com usuário e senha
              </h1>
              <p className="text-sm text-neutral-300">Use as credenciais definidas no backend.</p>
            </>
          }
        >
          <div className="fade-in-up rounded-3xl border border-white/6 bg-neutral-900/75 backdrop-blur-xl shadow-[0_20px_90px_rgba(0,0,0,0.5)] p-8 space-y-6">
            <div>
              <p className="text-xs font-semibold text-neutral-100">Credenciais locais</p>
              <p className="text-[11px] text-neutral-400 mt-1">Use o usuário e senha configurados no servidor.</p>
            </div>

            {authError && (
              <div className="rounded-xl border border-red-500/40 bg-red-900/40 px-4 py-3 text-xs text-red-100">
                {authError}
              </div>
            )}

            <form onSubmit={handleLoginPassword} className="space-y-4">
              <label className="block text-xs text-neutral-400 space-y-1">
                <span>Usuário</span>
                <input
                  id="username"
                  className="w-full rounded-xl border border-neutral-700/80 bg-neutral-900/80 px-3 py-2.75 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70 transition"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  autoComplete="username"
                />
              </label>

              <label className="block text-xs text-neutral-400 space-y-1">
                <span>Senha</span>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="w-full rounded-xl border border-neutral-700/80 bg-neutral-900/80 px-3 py-2.75 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70 transition"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current transition-opacity duration-200 opacity-100">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current transition-opacity duration-200 opacity-100">
                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm7.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3-.05 0-.11.01-.17.02z" />
                      </svg>
                    )}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full rounded-xl bg-linear-to-r from-emerald-400 via-emerald-500 to-cyan-500 text-neutral-900 text-sm font-semibold py-3 shadow-lg shadow-emerald-500/25 transition hover:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loginLoading ? 'Entrando...' : 'Entrar no painel'}
              </button>
            </form>
          </div>
        </LoginShell>
      )
    }

    if (hasGithub && !hasPassword) {
      return (
        <LoginShell
          hero={
            <>
              <h1 className="text-3xl font-semibold text-white">Entrar com GitHub</h1>
              <p className="text-sm text-neutral-300">Conecte via OAuth para acessar o painel.</p>
            </>
          }
        >
          <div className="fade-in-up rounded-3xl border border-white/6 bg-neutral-900/75 backdrop-blur-xl shadow-[0_20px_90px_rgba(0,0,0,0.5)] p-8 space-y-6">
            <div>
              <p className="text-xs font-semibold text-neutral-100">Autenticação com GitHub</p>
              <p className="text-[11px] text-neutral-400 mt-1">Conecte com sua conta do GitHub via OAuth.</p>
            </div>

            {authError && (
              <div className="rounded-xl border border-red-500/40 bg-red-900/40 px-4 py-3 text-xs text-red-100">
                {authError}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-white">GitHub</span>
              <div className="h-10 w-10 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center">
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  className="w-5 h-5 fill-white/80"
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.54 5.47 7.59.4.07.55-.17.55-.38 0-.19 0-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8Z" />
                </svg>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLoginWithGithub}
              className="w-full rounded-xl bg-white text-neutral-900 text-sm font-semibold py-3 flex items-center justify-center gap-2 transition hover:shadow-lg hover:-translate-y-px"
            >
              <span>Entrar com GitHub</span>
            </button>
          </div>
        </LoginShell>
      )
    }

    // authProvider === "none" e mesmo assim sem me → algo errado
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-neutral-100">
        <p className="text-sm text-red-300">
          Algo deu errado com a autenticação (modo none).
        </p>
      </div>
    )
  }

  // Autenticado → painel normal
  if (loadingConfig || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-neutral-100">
        <p className="text-lg text-neutral-300">Carregando configuração...</p>
      </div>
    )
  }

  return (
    <>
      <div className="relative min-h-screen bg-neutral-950 text-neutral-50">
        <div className="absolute inset-0 bg-linear-to-br from-emerald-500/10 via-cyan-500/8 to-sky-600/12 blur-3xl" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-10 space-y-10">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-200/80">
              Dashboard
            </p>
            <h1 className="text-2xl font-semibold">Spotify Readme</h1>
          </div>
          <div className="flex items-center gap-2">
            {userAvatar && (
              <img
                src={userAvatar}
                alt={me.id}
                className="h-8 w-8 rounded-full border border-white/15 bg-neutral-800 object-cover"
              />
            )}
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-mono text-neutral-100">
              {me.id}
            </span>
            <a
              href={jsonUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-100 hover:border-emerald-400/50"
            >
              JSON
            </a>
            {!hasNone && (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-red-400/40 bg-red-500/15 px-3 py-1 text-[11px] text-red-100 hover:bg-red-500/25"
              >
                Sair
              </button>
            )}
          </div>
        </header>

        {/* SEÇÃO 1: Config + Preview */}
        <section className="space-y-3">
          <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">Configuração</p>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/8 bg-neutral-900/70 backdrop-blur-xl p-6 space-y-5 shadow-[0_20px_90px_rgba(0,0,0,0.45)] min-w-0">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">Widget</p>
                <p className="text-[11px] text-neutral-500">Modo, tema ou track fixa do widget</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, mode: 'NOW_PLAYING' })}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${config.mode === 'NOW_PLAYING'
                    ? 'border-emerald-400/60 bg-emerald-400/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                >
                  <span className="block text-xs uppercase tracking-[0.14em] text-neutral-400">
                    Modo
                  </span>
                  <span className="block text-base font-semibold">
                    Now Playing
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfig({ ...config, mode: 'FIXED_TRACK' })}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${config.mode === 'FIXED_TRACK'
                    ? 'border-emerald-400/60 bg-emerald-400/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                >
                  <span className="block text-xs uppercase tracking-[0.14em] text-neutral-400">
                    Modo
                  </span>
                  <span className="block text-base font-semibold">
                    Track fixa
                  </span>
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
                  onChange={(e) =>
                    setConfig({ ...config, track_id: e.target.value || null })
                  }
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Tema</p>
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, theme: 'dark' })}
                      className={`px-3 py-1.5 rounded-lg transition ${config.theme === 'dark'
                        ? 'bg-emerald-500 text-neutral-900'
                        : 'text-neutral-200 hover:bg-white/10'
                        }`}
                    >
                      Dark
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, theme: 'light' })}
                      className={`px-3 py-1.5 rounded-lg transition ${config.theme === 'light'
                        ? 'bg-emerald-500 text-neutral-900'
                        : 'text-neutral-200 hover:bg-white/10'
                        }`}
                    >
                      Light
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {configError && (
                      <span className="text-[11px] text-red-300">
                        {configError}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowFlagsModal(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-100 hover:border-emerald-400/60 hover:text-emerald-100 transition"
                    >
                      Flags / Privacidade
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSave()}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-emerald-400 via-emerald-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-neutral-900 shadow-lg shadow-emerald-500/25 hover:translate-y-px transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/8 bg-neutral-900/70 backdrop-blur-xl p-6 space-y-4 shadow-[0_20px_90px_rgba(0,0,0,0.45)] min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">Preview</p>
                  <p className="text-[11px] text-neutral-500">Rota pública para embutir o widget SVG</p>
                </div>
                <code className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-neutral-300">
                  /widget
                </code>
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/70">
                <img
                  key={previewKey}
                  src={widgetUrl}
                  alt="Preview do widget Spotify"
                  className="w-full"
                />
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`<img src="${previewUrl}" />`)
                    setCopiedEmbed(true)
                    setTimeout(() => setCopiedEmbed(false), 1400)
                  }}
                  className={`max-w-[320px] truncate text-left rounded-lg border px-2 py-1 transition cursor-pointer font-mono ${copiedEmbed ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100' : 'border-white/10 bg-white/5 hover:border-emerald-400/60'}`}
                >
                  {copiedEmbed ? 'Copiado!' : `<img src="${previewUrl}" />`}
                </button>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto rounded-lg border border-white/10 bg-white/5 px-2 py-1 hover:border-emerald-400/60 transition"
                >
                  Abrir
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(previewUrl)
                    setCopiedUrl(true)
                    setTimeout(() => setCopiedUrl(false), 1400)
                  }}
                  className={`rounded-lg border px-2 py-1 transition cursor-pointer ${copiedUrl ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100' : 'border-white/10 bg-white/5 hover:border-emerald-400/60'}`}
                >
                  {copiedUrl ? 'Copiado!' : 'Copiar URL'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 2: Spotify + Now Playing */}
        <section className="space-y-3">
          <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">Integração Spotify</p>
          <div className="grid gap-6 lg:grid-cols-2 items-start">
            <div className="rounded-3xl border border-white/8 bg-neutral-900/70 backdrop-blur-xl p-6 space-y-5 shadow-[0_20px_90px_rgba(0,0,0,0.45)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">Spotify API</p>
                  <h2 className="text-lg font-semibold">Credenciais</h2>
                </div>
                {spotifyConfig?.configured && (
                  <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-[11px] text-emerald-200">
                    ✓ Configurado
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveSpotify} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="spotify-client-id" className="block text-xs text-neutral-400">Client ID</label>
                  <input
                    id="spotify-client-id"
                    type="text"
                    className="w-full rounded-xl border border-neutral-700/80 bg-neutral-900/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70 transition"
                    value={spotifyClientId}
                    onChange={(e) => setSpotifyClientId(e.target.value)}
                    placeholder="Seu Spotify Client ID"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="spotify-client-secret" className="block text-xs text-neutral-400">Client Secret</label>
                  <input
                    id="spotify-client-secret"
                    type="password"
                    className="w-full rounded-xl border border-neutral-700/80 bg-neutral-900/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70 transition font-mono"
                    value={spotifyClientSecret}
                    onChange={(e) => setSpotifyClientSecret(e.target.value)}
                    placeholder={spotifyConfig?.configured ? spotifyConfig.clientSecret || 'Novo secret' : 'Seu Spotify Client Secret'}
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
                  <button
                    type="submit"
                    disabled={savingSpotify || !spotifyClientId || !spotifyClientSecret}
                    className="flex-1 rounded-xl bg-linear-to-r from-emerald-400 via-emerald-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-neutral-900 shadow-lg shadow-emerald-500/25 hover:translate-y-px transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {savingSpotify ? 'Salvando...' : spotifyConfig?.configured ? 'Atualizar' : 'Salvar'}
                  </button>

                  {spotifyConfig?.configured && (
                    <button
                      type="button"
                      onClick={handleClearSpotify}
                      disabled={savingSpotify}
                      className="rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-100 hover:bg-red-500/25 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-neutral-500 leading-relaxed">
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

              {/* Conectar conta do Spotify */}
              {spotifyConfig?.configured && (
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-neutral-400 mb-1">Conta do Spotify</p>
                    <p className="text-sm text-neutral-300">
                      {spotifyConnected ? 'Conta conectada com sucesso!' : 'Conecte sua conta para usar o modo Now Playing'}
                    </p>
                  </div>

                  {spotifyConnected ? (
                    <button
                      type="button"
                      onClick={handleDisconnectSpotify}
                      disabled={loadingSpotifyStatus}
                      className="w-full rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-100 hover:bg-red-500/25 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loadingSpotifyStatus ? 'Desconectando...' : 'Desconectar Spotify'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectSpotify}
                      className="w-full rounded-xl bg-[#1DB954] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1ed760] transition shadow-lg shadow-[#1DB954]/25"
                    >
                      Conectar com Spotify
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Now Playing Card */}
            {spotifyConnected && (
              <div className="rounded-3xl border border-white/8 bg-neutral-900/70 backdrop-blur-xl p-6 space-y-4 shadow-[0_20px_90px_rgba(0,0,0,0.45)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">Spotify</p>
                    <h2 className="text-lg font-semibold">Now Playing</h2>
                  </div>
                  <button
                    type="button"
                    onClick={fetchNowPlaying}
                    disabled={loadingNowPlaying}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10 transition disabled:opacity-50"
                  >
                    {loadingNowPlaying ? 'Carregando...' : 'Atualizar'}
                  </button>
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
                        <p className="font-semibold text-white truncate">{nowPlaying.track.name}</p>
                        <p className="text-sm text-neutral-400 truncate">{nowPlaying.track.artists.join(', ')}</p>
                        <p className="text-xs text-neutral-500 truncate">{nowPlaying.track.album}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-1 rounded-full ${nowPlaying.isPlaying ? 'bg-emerald-500/20 text-emerald-300' : 'bg-neutral-700/50 text-neutral-400'}`}>
                        {nowPlaying.isPlaying ? '▶ Tocando agora' : '⏸ Última tocada'}
                      </span>
                      {nowPlaying.lastPlayedAt && !nowPlaying.isPlaying && (
                        <span className="text-neutral-500">
                          {new Date(nowPlaying.lastPlayedAt).toLocaleString('pt-BR')}
                        </span>
                      )}
                    </div>

                    <a
                      href={nowPlaying.track.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-full rounded-xl bg-[#1DB954] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-[#1ed760] transition"
                    >
                      Abrir no Spotify
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400">
                    {loadingNowPlaying ? 'Carregando...' : 'Nenhuma música tocando ou recentemente tocada'}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>

      {showFlagsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Fechar flags"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowFlagsModal(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setShowFlagsModal(false)
              }
            }}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-950/95 p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">Flags</p>
                <h3 className="text-lg font-semibold text-white">Privacidade e exibição</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFlagsModal(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-200 hover:border-emerald-400/60"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid gap-3">
                <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] items-center">
                  <div className="space-y-1 leading-tight">
                    <p className="text-sm font-semibold text-white">Expor dados no JSON público</p>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Quando ligado, o endpoint /user/api/&lt;usuario&gt; traz Now Playing ou a faixa fixa. Quando desligado, responde 204 (sem conteúdo), ocultando tudo.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none justify-end">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={config.expose_now_playing}
                      onChange={async (e) => {
                        const next = { ...config, expose_now_playing: e.target.checked }
                        setConfig(next)
                        await handleSave(next)
                      }}
                    />
                    <div className="peer h-6 w-11 rounded-full bg-neutral-500/60 transition-colors duration-300 ease-out peer-checked:bg-emerald-500 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-white/40 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}