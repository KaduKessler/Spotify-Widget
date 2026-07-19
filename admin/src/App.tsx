import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { del, post, postJson, requestJson } from './api/client'
import DashboardHeader from './components/DashboardHeader'
import FlagsModal from './components/FlagsModal'
import GitHubWhitelistPanel from './components/GitHubWhitelistPanel'
import LoginScreen from './components/LoginScreen'
import SpotifyPanel from './components/SpotifyPanel'
import TabNav, { type TabId } from './components/TabNav'
import UsersPanel from './components/UsersPanel'
import WidgetEditorCard from './components/WidgetEditorCard'
import { withMinDuration } from './lib/withMinDuration'

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
  username: string
  avatar_url: string | null
  role: 'admin' | 'user' | 'viewer'
}

type AuthProvider = 'none' | 'password' | 'github'
type RegistrationPolicy = 'open' | 'github_whitelist' | 'invite_only' | 'closed'

export default function App() {
  const [authProviders, setAuthProviders] = useState<AuthProvider[]>([])
  const [registrationPolicy, setRegistrationPolicy] =
    useState<RegistrationPolicy>('open')
  const [me, setMe] = useState<Me | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  const [config, setConfig] = useState<Config | null>(null)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [saving, setSaving] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)
  const [previewKey, setPreviewKey] = useState(0)
  const [previewLoading, setPreviewLoading] = useState(true)

  // Aparência customizada do widget (só na URL, não persistida).
  // customBg/customColor/customScale = valor "ao vivo" (reflete nos
  // controles e no redimensionamento CSS instantâneo do preview).
  // applied* = valor "aplicado", debounced, é o que entra na URL real
  // do widget (evita 1 fetch por tick de drag do slider/color picker).
  const [customBg, setCustomBg] = useState('')
  const [customColor, setCustomColor] = useState('')
  const [customScale, setCustomScale] = useState(1)
  const [appliedBg, setAppliedBg] = useState('')
  const [appliedColor, setAppliedColor] = useState('')
  const [appliedScale, setAppliedScale] = useState(1)
  const appearanceRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

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
  const [copiedFormat, setCopiedFormat] = useState<
    'markdown' | 'html' | 'url' | null
  >(null)
  const [showFlagsModal, setShowFlagsModal] = useState(false)

  // Avatar do usuário (usa avatar do GitHub quando disponível)
  const userAvatar =
    me?.provider === 'github' ? `https://github.com/${me.id}.png?size=80` : null

  // Tabs state
  const [activeTab, setActiveTab] = useState<TabId>('config')

  // 1) Descobre quais providers estão ativos (suporta múltiplos)
  useEffect(() => {
    const fetchAuthConfig = async () => {
      try {
        const data = await requestJson<
          | { provider: AuthProvider; policy?: RegistrationPolicy }
          | { providers: AuthProvider[]; policy?: RegistrationPolicy }
        >('/api/auth-config')

        // Backward compatibility: se vier provider único
        if ('provider' in data && data.provider) {
          setAuthProviders([data.provider])
        } else if ('providers' in data && Array.isArray(data.providers)) {
          setAuthProviders(data.providers)
        } else {
          setAuthProviders([])
        }

        if ('policy' in data && data.policy) {
          setRegistrationPolicy(data.policy)
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
        const data = await requestJson<Me>('/api/me')
        setMe(data)
      } catch (err: unknown) {
        const status =
          err && typeof err === 'object' && 'status' in err
            ? (err as { status?: number }).status
            : undefined
        if (status === 401) {
          setMe(null)
          return
        }
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
        const data = await requestJson<
          Config & {
            trackId?: string | null
            exposeNowPlaying?: boolean
          }
        >('/api/config')
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
      const data = await withMinDuration(
        requestJson<{
          isPlaying: boolean
          track: {
            name: string
            artists: string[]
            album: string
            albumArt: string | null
            url: string
          }
          lastPlayedAt?: string
        }>('/api/spotify/now-playing'),
      )
      setNowPlaying(data)
      if (config?.mode === 'NOW_PLAYING') {
        setPreviewLoading(true)
        setPreviewKey((k) => k + 1)
      }
    } catch (_err) {
      // ignore errors from now-playing
    } finally {
      setLoadingNowPlaying(false)
    }
  }, [config])

  // Debounce: evita disparar um fetch novo do SVG a cada tick de drag do
  // slider/color picker, e garante uma URL sempre nova pro preview (o
  // cache de imagem do navegador reusa a mesma URL se ela repetir, mesmo
  // com Cache-Control: no-cache do backend). Também sincroniza o card de
  // Now Playing do SpotifyPanel quando o modo é NOW_PLAYING.
  const scheduleAppearanceRefresh = useCallback(
    (next: { bg: string; color: string; scale: number }) => {
      setPreviewLoading(true)
      if (appearanceRefreshTimer.current) {
        clearTimeout(appearanceRefreshTimer.current)
      }
      appearanceRefreshTimer.current = setTimeout(() => {
        setAppliedBg(next.bg)
        setAppliedColor(next.color)
        setAppliedScale(next.scale)
        setPreviewKey((k) => k + 1)
        if (config?.mode === 'NOW_PLAYING') {
          fetchNowPlaying()
        }
      }, 400)
    },
    [config, fetchNowPlaying],
  )

  useEffect(() => {
    return () => {
      if (appearanceRefreshTimer.current) {
        clearTimeout(appearanceRefreshTimer.current)
      }
    }
  }, [])

  // 4) Carrega Spotify config quando autenticado
  useEffect(() => {
    if (!me) return
    const fetchSpotifyConfig = async () => {
      try {
        const data = await requestJson<{
          configured: boolean
          clientId: string | null
          clientSecret: string | null
        }>('/api/spotify-config')
        setSpotifyConfig(data)
        if (data.clientId) {
          setSpotifyClientId(data.clientId)
        }
        // Check if Spotify is connected (has access token)
        try {
          const statusData = await requestJson<{ connected: boolean }>(
            '/api/spotify/status',
          )
          setSpotifyConnected(statusData.connected)
          if (statusData.connected) {
            fetchNowPlaying()
          }
        } catch (_err) {
          // ignore status errors
        }
      } catch (_err) {
        console.error(_err)
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
      await withMinDuration(postJson('/api/config', cfgToSave))
      setPreviewLoading(true)
      setPreviewKey((k) => k + 1)
      if (cfgToSave.mode === 'NOW_PLAYING') {
        fetchNowPlaying()
      }
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
      await withMinDuration(
        postJson('/api/spotify-config', {
          clientId: spotifyClientId,
          clientSecret: spotifyClientSecret,
        }),
      )

      setSpotifySuccess('Credenciais salvas com sucesso!')
      setSpotifyClientSecret('') // Limpa o campo de secret após salvar

      // Recarrega config
      try {
        const data = await requestJson<{
          configured: boolean
          clientId: string | null
          clientSecret: string | null
        }>('/api/spotify-config')
        setSpotifyConfig(data)
      } catch (_err) {
        // ignore
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
      await withMinDuration(del('/api/spotify-config'))
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
      await withMinDuration(post('/api/spotify/disconnect'))
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
      await withMinDuration(
        post('/auth/login', {
          username: loginUsername,
          password: loginPassword,
        }),
      )

      try {
        const meData = await requestJson<Me>('/api/me')
        setMe(meData)
        setLoginPassword('')
      } catch (_err) {
        setAuthError('Erro ao obter informações do usuário.')
        return
      }
    } catch (err: unknown) {
      const status =
        err && typeof err === 'object' && 'status' in err
          ? (err as { status?: number }).status
          : undefined
      if (status === 401 || status === 400) {
        setAuthError('Usuário ou senha inválidos.')
      } else {
        console.error(err)
        setAuthError('Erro ao fazer login.')
      }
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await post('/auth/logout')
    } catch (err) {
      console.error(err)
    }
    setMe(null)
  }

  function handleLoginWithGithub() {
    window.location.href = '/auth/github'
  }

  const widgetUrl = useMemo(() => {
    const base = me ? `/widget?user=${encodeURIComponent(me.id)}` : `/widget`
    const params = new URLSearchParams()
    if (appliedBg) params.set('bg', appliedBg)
    if (appliedColor) params.set('color', appliedColor)
    if (appliedScale !== 1) params.set('scale', String(appliedScale))
    const query = params.toString()
    if (!query) return base
    return `${base}${base.includes('?') ? '&' : '?'}${query}`
  }, [me, appliedBg, appliedColor, appliedScale])

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
    return (
      <LoginScreen
        hasPassword={hasPassword}
        hasGithub={hasGithub}
        authError={authError}
        loginUsername={loginUsername}
        loginPassword={loginPassword}
        loginLoading={loginLoading}
        showPassword={showPassword}
        onUsernameChange={setLoginUsername}
        onPasswordChange={setLoginPassword}
        onToggleShowPassword={() => setShowPassword((v) => !v)}
        onSubmitPassword={handleLoginPassword}
        onLoginGithub={handleLoginWithGithub}
      />
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
          <DashboardHeader
            username={me.username}
            role={me.role}
            avatarUrl={userAvatar}
            jsonUrl={jsonUrl}
            registrationPolicy={registrationPolicy}
            showLogout={!hasNone}
            onLogout={handleLogout}
          />

          <TabNav
            activeTab={activeTab}
            isAdmin={me.role === 'admin'}
            onChange={setActiveTab}
          />

          {/* Tab Content */}
          {activeTab === 'users' && me.role === 'admin' && <UsersPanel />}

          {activeTab === 'whitelist' && me.role === 'admin' && (
            <GitHubWhitelistPanel />
          )}

          {activeTab === 'config' && (
            <>
              <section className="space-y-3">
                <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
                  Configuração
                </p>
                <WidgetEditorCard
                  config={config}
                  saving={saving}
                  configError={configError}
                  onChangeMode={(mode) => setConfig({ ...config, mode })}
                  onChangeTrackId={(track_id) =>
                    setConfig({ ...config, track_id })
                  }
                  onChangeTheme={(theme) => setConfig({ ...config, theme })}
                  onOpenFlags={() => setShowFlagsModal(true)}
                  onSave={() => handleSave()}
                  customBg={customBg}
                  customColor={customColor}
                  customScale={customScale}
                  onChangeCustomBg={(value) => {
                    setCustomBg(value)
                    scheduleAppearanceRefresh({
                      bg: value,
                      color: customColor,
                      scale: customScale,
                    })
                  }}
                  onChangeCustomColor={(value) => {
                    setCustomColor(value)
                    scheduleAppearanceRefresh({
                      bg: customBg,
                      color: value,
                      scale: customScale,
                    })
                  }}
                  onChangeCustomScale={(value) => {
                    setCustomScale(value)
                    scheduleAppearanceRefresh({
                      bg: customBg,
                      color: customColor,
                      scale: value,
                    })
                  }}
                  widgetUrl={widgetUrl}
                  previewUrl={previewUrl}
                  previewKey={previewKey}
                  previewLoading={previewLoading}
                  onPreviewLoad={() => setPreviewLoading(false)}
                  onPreviewError={() => setPreviewLoading(false)}
                  copiedFormat={copiedFormat}
                  onCopyMarkdown={() => {
                    navigator.clipboard.writeText(`![Spotify](${previewUrl})`)
                    setCopiedFormat('markdown')
                    setTimeout(() => setCopiedFormat(null), 1400)
                  }}
                  onCopyHtml={() => {
                    navigator.clipboard.writeText(`<img src="${previewUrl}" />`)
                    setCopiedFormat('html')
                    setTimeout(() => setCopiedFormat(null), 1400)
                  }}
                  onCopyUrl={() => {
                    navigator.clipboard.writeText(previewUrl)
                    setCopiedFormat('url')
                    setTimeout(() => setCopiedFormat(null), 1400)
                  }}
                />
              </section>

              <SpotifyPanel
                spotifyConfig={spotifyConfig}
                spotifyClientId={spotifyClientId}
                spotifyClientSecret={spotifyClientSecret}
                savingSpotify={savingSpotify}
                spotifyError={spotifyError}
                spotifySuccess={spotifySuccess}
                spotifyConnected={spotifyConnected}
                loadingSpotifyStatus={loadingSpotifyStatus}
                nowPlaying={nowPlaying}
                loadingNowPlaying={loadingNowPlaying}
                onClientIdChange={setSpotifyClientId}
                onClientSecretChange={setSpotifyClientSecret}
                onSubmit={handleSaveSpotify}
                onClear={handleClearSpotify}
                onConnect={handleConnectSpotify}
                onDisconnect={handleDisconnectSpotify}
                onRefreshNowPlaying={fetchNowPlaying}
              />
            </>
          )}
        </div>
      </div>

      <FlagsModal
        open={showFlagsModal}
        onClose={() => setShowFlagsModal(false)}
        exposeNowPlaying={config?.expose_now_playing ?? false}
        onToggleExpose={(checked) => {
          setConfig((prev) => {
            if (!prev) return prev
            const next = { ...prev, expose_now_playing: checked }
            void handleSave(next)
            return next
          })
        }}
      />
    </>
  )
}
