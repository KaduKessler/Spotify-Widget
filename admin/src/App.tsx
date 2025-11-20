import { useEffect, useState } from 'react'

type Config = {
  id: number
  mode: 'NOW_PLAYING' | 'FIXED_TRACK'
  track_id: string | null
  theme: 'dark' | 'light'
}

type Me = {
  id: string
  provider: string
}

export default function App() {
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

  // 1. Checa auth (/api/me)
  useEffect(() => {
    const checkAuth = async () => {
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
  }, [])

  // 2. Carrega config quando autenticado
  useEffect(() => {
    if (!me) return
    const fetchConfig = async () => {
      setLoadingConfig(true)
      setConfigError(null)
      try {
        const res = await fetch('/api/config')
        if (!res.ok) throw new Error('config failed')
        const data = (await res.json()) as Config
        setConfig(data)
      } catch (err) {
        console.error(err)
        setConfigError('Erro ao carregar configuração.')
      } finally {
        setLoadingConfig(false)
      }
    }
    fetchConfig()
  }, [me])

  async function handleSave() {
    if (!config) return
    setSaving(true)
    setConfigError(null)
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
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

  async function handleLogin(e: React.FormEvent) {
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

      // Depois de logar, refaz /api/me
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
      await fetch('/auth/logout', {
        method: 'POST',
      })
    } catch (err) {
      console.error(err)
    }

    // Resetar tudo para modo "não autenticado"
    setMe(null)
  }

  const widgetUrl = `/widget?ts=${previewKey}`

  // Loading inicial
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-neutral-100">
        <p className="text-lg text-neutral-300">Verificando sessão...</p>
      </div>
    )
  }

  // Se não autenticado → tela de login (modo password/none)
  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-neutral-100 px-4">
        <div className="w-full max-w-sm bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
          <h1 className="text-xl font-semibold mb-1">Spotify Readme · Login</h1>
          <p className="text-xs text-neutral-400 mb-4">
            Acesse o painel admin com usuário e senha configurados no servidor.
          </p>

          {authError && (
            <div className="mb-3 rounded-lg bg-red-900/30 border border-red-500/60 px-3 py-2 text-xs">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-medium mb-1"
              >
                Usuário
              </label>
              <input
                id="login-username"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-medium mb-1"
              >
                Senha
              </label>
              <input
                id="login-password"
                type="password"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full mt-2 rounded-lg bg-emerald-500/90 hover:bg-emerald-500 text-neutral-900 text-sm font-medium py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loginLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-4 text-[11px] text-neutral-500">
            Em modo <code>AUTH_PROVIDER=none</code>, essa tela nem aparece.
          </p>
        </div>
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
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl bg-neutral-900/80 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Spotify Readme · Admin</h1>
            <p className="text-xs text-neutral-400 flex items-center gap-3">
              Logado como <span className="font-mono">{me.id}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-md hover:bg-red-500/30 transition"
              >
                Logout
              </button>
            </p>
          </div>

          <code className="text-xs text-neutral-400 bg-neutral-950/70 px-3 py-1.5 rounded-lg border border-neutral-800">
            &lt;img src="https://seu-dominio/widget" /&gt;
          </code>
        </div>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] px-6 py-6">
          {/* Coluna do formulário */}
          <div className="space-y-5">
            {/* Modo */}
            <section>
              <h2 className="text-sm font-semibold text-neutral-200 mb-2">
                Modo de funcionamento
              </h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, mode: 'NOW_PLAYING' })}
                  className={`rounded-xl border px-3 py-2 text-left transition ${
                    config.mode === 'NOW_PLAYING'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-neutral-700 bg-neutral-900/60 hover:border-neutral-500'
                  }`}
                >
                  <span className="block font-medium">Now Playing</span>
                  <span className="block text-[11px] text-neutral-400">
                    Usa o que você está ouvindo agora no Spotify.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfig({ ...config, mode: 'FIXED_TRACK' })}
                  className={`rounded-xl border px-3 py-2 text-left transition ${
                    config.mode === 'FIXED_TRACK'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-neutral-700 bg-neutral-900/60 hover:border-neutral-500'
                  }`}
                >
                  <span className="block font-medium">Track fixa</span>
                  <span className="block text-[11px] text-neutral-400">
                    Mantém sempre a mesma música no widget.
                  </span>
                </button>
              </div>
            </section>

            {/* Track fixa */}
            <section className="space-y-1">
              <label
                htmlFor="track-id"
                className="text-sm font-semibold text-neutral-200"
              >
                Track fixa
              </label>
              <input
                id="track-id"
                type="text"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                placeholder="Cole aqui o ID ou URL da música no Spotify"
                value={config.track_id ?? ''}
                onChange={(e) =>
                  setConfig({ ...config, track_id: e.target.value || null })
                }
              />
              <p className="text-[11px] text-neutral-500">
                Depois a gente faz o parser da URL pra extrair o ID. Por
                enquanto, qualquer string vai pro campo <code>track_id</code>.
              </p>
            </section>

            {/* Tema */}
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-neutral-200">
                Tema do widget
              </h2>
              <div className="inline-flex rounded-xl border border-neutral-700 bg-neutral-900/70 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, theme: 'dark' })}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    config.theme === 'dark'
                      ? 'bg-emerald-500 text-neutral-900'
                      : 'text-neutral-300 hover:bg-neutral-800/80'
                  }`}
                >
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, theme: 'light' })}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    config.theme === 'light'
                      ? 'bg-emerald-500 text-neutral-900'
                      : 'text-neutral-300 hover:bg-neutral-800/80'
                  }`}
                >
                  Light
                </button>
              </div>
            </section>

            {/* Status + botão salvar */}
            <section className="flex items-center justify-between gap-3 pt-2">
              {configError ? (
                <span className="text-xs text-red-400">{configError}</span>
              ) : (
                <span className="text-[11px] text-neutral-500">
                  Config carregada do banco local.
                </span>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-medium text-neutral-900 shadow hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </section>
          </div>

          {/* Coluna do preview */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-neutral-200">
              Preview do widget
            </h2>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 flex items-center justify-center">
              <div className="w-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/80">
                <img
                  key={previewKey}
                  src={widgetUrl}
                  alt="Preview do widget Spotify"
                  className="w-full"
                />
              </div>
            </div>
            <p className="text-[11px] text-neutral-500">
              Esse preview carrega direto de <code>/widget</code> com as configs
              atuais.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
