import { useEffect, useState } from 'react'
import { post, requestJson } from '../api/client'
import { withMinDuration } from '../lib/withMinDuration'

export type Me = {
  id: string
  provider: string
  username: string
  avatar_url: string | null
  role: 'admin' | 'user' | 'viewer'
}

export type AuthProvider = 'none' | 'password' | 'github'
export type RegistrationPolicy =
  | 'open'
  | 'github_whitelist'
  | 'invite_only'
  | 'closed'

export function useAuth() {
  const [authProviders, setAuthProviders] = useState<AuthProvider[]>([])
  const [registrationPolicy, setRegistrationPolicy] =
    useState<RegistrationPolicy>('open')
  const [me, setMe] = useState<Me | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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

  // Avatar do usuário (usa avatar do GitHub quando disponível)
  const userAvatar =
    me?.provider === 'github' ? `https://github.com/${me.id}.png?size=80` : null

  const hasPassword = authProviders.includes('password')
  const hasGithub = authProviders.includes('github')
  const hasNone = authProviders.includes('none')

  return {
    authProviders,
    registrationPolicy,
    me,
    checkingAuth,
    authError,
    userAvatar,
    hasPassword,
    hasGithub,
    hasNone,
    loginUsername,
    loginPassword,
    loginLoading,
    showPassword,
    setLoginUsername,
    setLoginPassword,
    toggleShowPassword: () => setShowPassword((v) => !v),
    handleLoginPassword,
    handleLogout,
    handleLoginWithGithub,
  }
}
