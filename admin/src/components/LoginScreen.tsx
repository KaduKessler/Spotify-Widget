import type { ReactNode } from 'react'

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

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-500/40 bg-red-900/40 px-4 py-3 text-xs text-red-100">
      {message}
    </div>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="w-4 h-4 fill-current"
    >
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="w-4 h-4 fill-current"
    >
      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm7.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3-.05 0-.11.01-.17.02z" />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="w-5 h-5 fill-white/80"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.54 5.47 7.59.4.07.55-.17.55-.38 0-.19 0-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

type PasswordLoginCardProps = {
  loginUsername: string
  loginPassword: string
  loginLoading: boolean
  showPassword: boolean
  onUsernameChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onToggleShowPassword: () => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  compact?: boolean
}

function PasswordLoginCard({
  loginUsername,
  loginPassword,
  loginLoading,
  showPassword,
  onUsernameChange,
  onPasswordChange,
  onToggleShowPassword,
  onSubmit,
  compact,
}: PasswordLoginCardProps) {
  return (
    <div
      className={
        compact
          ? 'fade-in-up rounded-2xl border border-white/5 bg-neutral-900/80 p-5 shadow-sm space-y-4'
          : 'space-y-4'
      }
    >
      {compact && (
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-neutral-100">
              Com usuário e senha
            </p>
            <p className="text-[11px] text-neutral-500">
              Credenciais locais do servidor.
            </p>
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
      )}
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-xs text-neutral-400 space-y-1">
          <span>Usuário</span>
          <input
            id="username"
            className="w-full rounded-xl border border-neutral-700/80 bg-neutral-900/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70 transition"
            value={loginUsername}
            onChange={(e) => onUsernameChange(e.target.value)}
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
              onChange={(e) => onPasswordChange(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={onToggleShowPassword}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors duration-200"
            >
              <EyeIcon open={showPassword} />
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
  )
}

function GithubLoginCard({
  onClick,
  compact,
}: {
  onClick: () => void
  compact?: boolean
}) {
  return (
    <div
      className={
        compact
          ? 'fade-in-up rounded-2xl border border-white/5 bg-linear-to-br from-neutral-900/90 via-neutral-900/80 to-neutral-800/80 p-5 shadow-sm space-y-4'
          : 'space-y-4'
      }
    >
      {compact ? (
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-neutral-100">Com GitHub</p>
            <p className="text-[11px] text-neutral-500">
              OAuth seguro e verificado.
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center">
            <GithubIcon />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-white">GitHub</span>
          <div className="h-10 w-10 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center">
            <GithubIcon />
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-xl bg-white text-neutral-900 text-sm font-semibold py-3 px-4 flex items-center justify-center gap-2 transition hover:shadow-lg hover:-translate-y-px"
      >
        <span>{compact ? 'Continuar com GitHub' : 'Entrar com GitHub'}</span>
      </button>
    </div>
  )
}

export type LoginScreenProps = {
  hasPassword: boolean
  hasGithub: boolean
  authError: string | null
  loginUsername: string
  loginPassword: string
  loginLoading: boolean
  showPassword: boolean
  onUsernameChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onToggleShowPassword: () => void
  onSubmitPassword: (e: React.FormEvent<HTMLFormElement>) => void
  onLoginGithub: () => void
}

export default function LoginScreen({
  hasPassword,
  hasGithub,
  authError,
  loginUsername,
  loginPassword,
  loginLoading,
  showPassword,
  onUsernameChange,
  onPasswordChange,
  onToggleShowPassword,
  onSubmitPassword,
  onLoginGithub,
}: LoginScreenProps) {
  if (hasPassword && hasGithub) {
    return (
      <LoginShell
        hero={
          <>
            <h1 className="text-3xl font-semibold leading-tight text-white">
              Spotify Widget Admin
            </h1>
            <p className="text-sm text-neutral-300">
              Escolha como entrar para ajustar o widget.
            </p>
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
            <p className="text-xs text-neutral-400 mt-1">
              Escolha a opção mais conveniente para você.
            </p>
          </div>

          {authError && <ErrorBanner message={authError} />}

          <div className="space-y-4">
            <PasswordLoginCard
              compact
              loginUsername={loginUsername}
              loginPassword={loginPassword}
              loginLoading={loginLoading}
              showPassword={showPassword}
              onUsernameChange={onUsernameChange}
              onPasswordChange={onPasswordChange}
              onToggleShowPassword={onToggleShowPassword}
              onSubmit={onSubmitPassword}
            />
            <GithubLoginCard compact onClick={onLoginGithub} />
          </div>
        </div>
      </LoginShell>
    )
  }

  if (hasPassword) {
    return (
      <LoginShell
        hero={
          <>
            <h1 className="text-3xl font-semibold text-white">
              Entrar com usuário e senha
            </h1>
            <p className="text-sm text-neutral-300">
              Use as credenciais definidas no backend.
            </p>
          </>
        }
      >
        <div className="fade-in-up rounded-3xl border border-white/6 bg-neutral-900/75 backdrop-blur-xl shadow-[0_20px_90px_rgba(0,0,0,0.5)] p-8 space-y-6">
          <div>
            <p className="text-xs font-semibold text-neutral-100">
              Credenciais locais
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              Use o usuário e senha configurados no servidor.
            </p>
          </div>

          {authError && <ErrorBanner message={authError} />}

          <PasswordLoginCard
            loginUsername={loginUsername}
            loginPassword={loginPassword}
            loginLoading={loginLoading}
            showPassword={showPassword}
            onUsernameChange={onUsernameChange}
            onPasswordChange={onPasswordChange}
            onToggleShowPassword={onToggleShowPassword}
            onSubmit={onSubmitPassword}
          />
        </div>
      </LoginShell>
    )
  }

  if (hasGithub) {
    return (
      <LoginShell
        hero={
          <>
            <h1 className="text-3xl font-semibold text-white">
              Entrar com GitHub
            </h1>
            <p className="text-sm text-neutral-300">
              Conecte via OAuth para acessar o painel.
            </p>
          </>
        }
      >
        <div className="fade-in-up rounded-3xl border border-white/6 bg-neutral-900/75 backdrop-blur-xl shadow-[0_20px_90px_rgba(0,0,0,0.5)] p-8 space-y-6">
          <div>
            <p className="text-xs font-semibold text-neutral-100">
              Autenticação com GitHub
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              Conecte com sua conta do GitHub via OAuth.
            </p>
          </div>

          {authError && <ErrorBanner message={authError} />}

          <GithubLoginCard onClick={onLoginGithub} />
        </div>
      </LoginShell>
    )
  }

  // authProvider === "none" e mesmo assim sem sessão → algo errado
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-neutral-100">
      <p className="text-sm text-red-300">
        Algo deu errado com a autenticação (modo none).
      </p>
    </div>
  )
}
