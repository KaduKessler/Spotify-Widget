import { Eye, EyeOff, Github } from 'lucide-react'
import type { ReactNode } from 'react'
import Button from './Button'

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
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <img
              src="/favicon.svg"
              alt=""
              className="h-14 w-14 rounded-2xl shadow-lg"
            />
          </div>
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

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-white/10" />
      <span className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">
        ou
      </span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  )
}

type PasswordFormProps = {
  loginUsername: string
  loginPassword: string
  loginLoading: boolean
  showPassword: boolean
  onUsernameChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onToggleShowPassword: () => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}

function PasswordForm({
  loginUsername,
  loginPassword,
  loginLoading,
  showPassword,
  onUsernameChange,
  onPasswordChange,
  onToggleShowPassword,
  onSubmit,
}: PasswordFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block text-xs text-neutral-400 space-y-1">
        <span>Usuário</span>
        <input
          id="username"
          className="w-full rounded-xl border border-neutral-700/80 bg-neutral-900/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70 transition"
          value={loginUsername}
          onChange={(e) => onUsernameChange(e.target.value)}
          autoComplete="username"
          required
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
            required
          />
          <button
            type="button"
            onClick={onToggleShowPassword}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-300 transition-colors duration-200"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" className="w-4 h-4" />
            ) : (
              <Eye aria-hidden="true" className="w-4 h-4" />
            )}
          </button>
        </div>
      </label>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={loginLoading}
        loadingText="Entrando..."
      >
        Entrar com senha
      </Button>
    </form>
  )
}

function GithubButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl bg-white text-neutral-900 text-sm font-semibold py-2.5 px-4 flex items-center justify-center gap-2 transition hover:shadow-lg hover:-translate-y-px"
    >
      <Github aria-hidden="true" className="w-4 h-4" />
      <span>Continuar com GitHub</span>
    </button>
  )
}

function CardHeader() {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.28em] text-neutral-400">
        Login
      </p>
      <h2 className="text-lg font-semibold text-white">Entre no painel</h2>
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
  const passwordForm = (
    <PasswordForm
      loginUsername={loginUsername}
      loginPassword={loginPassword}
      loginLoading={loginLoading}
      showPassword={showPassword}
      onUsernameChange={onUsernameChange}
      onPasswordChange={onPasswordChange}
      onToggleShowPassword={onToggleShowPassword}
      onSubmit={onSubmitPassword}
    />
  )

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
        <div className="fade-in-up rounded-3xl border border-white/6 bg-neutral-900/70 backdrop-blur-xl shadow-[0_20px_90px_rgba(0,0,0,0.5)] p-8 space-y-5">
          <CardHeader />
          {authError && <ErrorBanner message={authError} />}
          {passwordForm}
          <Divider />
          <GithubButton onClick={onLoginGithub} />
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
        <div className="fade-in-up rounded-3xl border border-white/6 bg-neutral-900/75 backdrop-blur-xl shadow-[0_20px_90px_rgba(0,0,0,0.5)] p-8 space-y-5">
          <CardHeader />
          {authError && <ErrorBanner message={authError} />}
          {passwordForm}
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
        <div className="fade-in-up rounded-3xl border border-white/6 bg-neutral-900/75 backdrop-blur-xl shadow-[0_20px_90px_rgba(0,0,0,0.5)] p-8 space-y-5">
          <CardHeader />
          {authError && <ErrorBanner message={authError} />}
          <GithubButton onClick={onLoginGithub} />
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
