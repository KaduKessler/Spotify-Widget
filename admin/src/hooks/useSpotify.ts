import { useCallback, useEffect, useMemo, useState } from 'react'
import { del, post, postJson, requestJson } from '../api/client'
import { withMinDuration } from '../lib/withMinDuration'
import type { Me } from './useAuth'

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
} | null

type SpotifyConfig = {
  configured: boolean
  clientId: string | null
  clientSecret: string | null
} | null

export function useSpotify(me: Me | null) {
  const [spotifyConfig, setSpotifyConfig] = useState<SpotifyConfig>(null)
  const [spotifyClientId, setSpotifyClientId] = useState('')
  const [spotifyClientSecret, setSpotifyClientSecret] = useState('')
  const [savingSpotify, setSavingSpotify] = useState(false)
  const [spotifyError, setSpotifyError] = useState<string | null>(null)
  const [spotifySuccess, setSpotifySuccess] = useState<string | null>(null)
  const [spotifyConnected, setSpotifyConnected] = useState(false)
  const [loadingSpotifyStatus, setLoadingSpotifyStatus] = useState(false)

  const [nowPlaying, setNowPlaying] = useState<NowPlaying>(null)
  const [loadingNowPlaying, setLoadingNowPlaying] = useState(false)

  // Redirect URI que precisa ser cadastrada no app do Spotify Developer
  // Dashboard. Mesma origem usada pra iniciar o fluxo (ver handleConnectSpotify).
  const spotifyRedirectUri = useMemo(() => {
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '')
    return `${backendUrl}/auth/spotify/callback`
  }, [])

  const fetchNowPlaying = useCallback(async () => {
    setLoadingNowPlaying(true)
    try {
      const data = await withMinDuration(
        requestJson<NowPlaying>('/api/spotify/now-playing'),
      )
      setNowPlaying(data)
    } catch (_err) {
      // ignore errors from now-playing
    } finally {
      setLoadingNowPlaying(false)
    }
  }, [])

  // Carrega Spotify config quando autenticado
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

  function handleConnectSpotify() {
    if (!spotifyConfig?.configured) {
      setSpotifyError('Configure suas credenciais do Spotify primeiro')
      return
    }
    // Precisa ir direto pro backend (nao pelo proxy do vite): o cookie de
    // state e validado no callback, que o Spotify chama na origem do
    // APP_URL, nao na origem do vite dev server.
    const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
    window.location.href = `${backendUrl}/auth/spotify`
  }

  return {
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
    spotifyRedirectUri,
    setSpotifyClientId,
    setSpotifyClientSecret,
    fetchNowPlaying,
    handleSaveSpotify,
    handleClearSpotify,
    handleDisconnectSpotify,
    handleConnectSpotify,
  }
}
