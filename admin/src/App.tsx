import { useEffect, useState } from 'react'

type Config = {
  id: number
  mode: 'NOW_PLAYING' | 'FIXED_TRACK'
  track_id: string | null
  theme: 'dark' | 'light'
}

export default function App() {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewKey, setPreviewKey] = useState(0)

  // Carrega config inicial
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config')
        if (!res.ok) throw new Error('Falha ao buscar config')
        const data = (await res.json()) as Config
        setConfig(data)
      } catch (err) {
        console.error(err)
        setError('Erro ao carregar configuração.')
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [])

  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!res.ok) throw new Error('Falha ao salvar config')

      // força refresh do preview (busta cache do <img>)
      setPreviewKey((k) => k + 1)
    } catch (err) {
      console.error(err)
      setError('Erro ao salvar configuração.')
    } finally {
      setSaving(false)
    }
  }

  const handleModeChange = (mode: Config['mode']) => {
    setConfig((prev) => (prev ? { ...prev, mode } : prev))
  }

  const handleThemeChange = (theme: Config['theme']) => {
    setConfig((prev) => (prev ? { ...prev, theme } : prev))
  }

  const handleTrackChange = (value: string) => {
    setConfig((prev) =>
      prev ? { ...prev, track_id: value.trim() || null } : prev,
    )
  }

  if (loading || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-neutral-100">
        <p className="text-lg text-neutral-300">Carregando painel...</p>
      </div>
    )
  }

  const widgetUrl = `/widget?ts=${previewKey}`

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl bg-neutral-900/80 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Spotify Readme · Admin</h1>
            <p className="text-xs text-neutral-400">
              Controle do widget usado no seu README.
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
                  onClick={() => handleModeChange('NOW_PLAYING')}
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
                  onClick={() => handleModeChange('FIXED_TRACK')}
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
                htmlFor="track_id"
                className="text-sm font-semibold text-neutral-200"
              >
                Track fixa
              </label>
              <input
                id="track_id"
                type="text"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                placeholder="Cole aqui o ID ou URL da música no Spotify"
                value={config.track_id ?? ''}
                onChange={(e) => handleTrackChange(e.target.value)}
              />
              <p className="text-[11px] text-neutral-500">
                No futuro a gente faz o parser da URL pra extrair o ID. Por
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
                  onClick={() => handleThemeChange('dark')}
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
                  onClick={() => handleThemeChange('light')}
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
              {error ? (
                <span className="text-xs text-red-400">{error}</span>
              ) : (
                <span className="text-[11px] text-neutral-500">
                  Última config carregada do banco local.
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
              Esse preview está carregando diretamente de <code>/widget</code>{' '}
              usando as configs atuais.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
