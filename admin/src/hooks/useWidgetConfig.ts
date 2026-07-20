import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { postJson, requestJson } from '../api/client'
import { withMinDuration } from '../lib/withMinDuration'
import type { Me } from './useAuth'

export type Config = {
  id: number
  mode: 'NOW_PLAYING' | 'FIXED_TRACK'
  track_id: string | null
  theme: 'dark' | 'light'
  expose_now_playing: boolean
}

export function useWidgetConfig(me: Me | null, refreshNowPlaying: () => void) {
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

  const [copiedFormat, setCopiedFormat] = useState<
    'markdown' | 'html' | 'url' | null
  >(null)
  const [showFlagsModal, setShowFlagsModal] = useState(false)

  // Carrega config quando autenticado
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

  // Debounce: evita disparar um fetch novo do SVG a cada tick de drag do
  // slider/color picker, e garante uma URL sempre nova pro preview (o
  // cache de imagem do navegador reusa a mesma URL se ela repetir, mesmo
  // com Cache-Control: no-cache do backend). Também sincroniza o card de
  // Now Playing quando o modo é NOW_PLAYING.
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
          refreshNowPlaying()
        }
      }, 400)
    },
    [config, refreshNowPlaying],
  )

  useEffect(() => {
    return () => {
      if (appearanceRefreshTimer.current) {
        clearTimeout(appearanceRefreshTimer.current)
      }
    }
  }, [])

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
        refreshNowPlaying()
      }
    } catch (err) {
      console.error(err)
      setConfigError('Erro ao salvar configuração.')
    } finally {
      setSaving(false)
    }
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

  const previewUrl = useMemo(() => {
    if (typeof window === 'undefined') return widgetUrl
    try {
      return new URL(widgetUrl, window.location.origin).toString()
    } catch {
      return widgetUrl
    }
  }, [widgetUrl])

  const jsonUrl = me ? `/user/api/${encodeURIComponent(me.id)}` : `/user/api/`

  function copyToClipboard(format: 'markdown' | 'html' | 'url') {
    const text =
      format === 'markdown'
        ? `![Spotify](${previewUrl})`
        : format === 'html'
          ? `<img src="${previewUrl}" />`
          : previewUrl
    navigator.clipboard.writeText(text)
    setCopiedFormat(format)
    setTimeout(() => setCopiedFormat(null), 1400)
  }

  return {
    config,
    setConfig,
    loadingConfig,
    saving,
    configError,
    previewKey,
    previewLoading,
    setPreviewLoading,
    customBg,
    customColor,
    customScale,
    setCustomBg,
    setCustomColor,
    setCustomScale,
    scheduleAppearanceRefresh,
    handleSave,
    widgetUrl,
    previewUrl,
    jsonUrl,
    copiedFormat,
    copyToClipboard,
    showFlagsModal,
    setShowFlagsModal,
  }
}
