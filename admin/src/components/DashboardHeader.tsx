import { ExternalLink, LogOut } from 'lucide-react'

type RegistrationPolicy = 'open' | 'github_whitelist' | 'invite_only' | 'closed'

const policyLabels: Record<RegistrationPolicy, string> = {
  open: 'Aberta',
  github_whitelist: 'Whitelist GitHub',
  invite_only: 'Somente Convite',
  closed: 'Fechada',
}

export type DashboardHeaderProps = {
  username: string
  role: 'admin' | 'user' | 'viewer'
  avatarUrl: string | null
  jsonUrl: string
  registrationPolicy: RegistrationPolicy
  showLogout: boolean
  onLogout: () => void
}

const roleBadgeStyles: Record<DashboardHeaderProps['role'], string> = {
  admin: 'bg-red-500/20 text-red-300',
  user: 'bg-emerald-500/20 text-emerald-300',
  viewer: 'bg-sky-500/20 text-sky-300',
}

export default function DashboardHeader({
  username,
  role,
  avatarUrl,
  jsonUrl,
  registrationPolicy,
  showLogout,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 rounded-3xl border border-white/8 bg-neutral-900/70 backdrop-blur-xl px-5 py-4 shadow-[0_20px_90px_rgba(0,0,0,0.45)] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-200/80">
          Dashboard
        </p>
        <h1 className="text-2xl font-semibold">Spotify Widget</h1>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        {/* Secundário: contexto, baixo peso visual */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-400">
          <a
            href={jsonUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 hover:text-emerald-300 hover:bg-white/5 transition-colors"
          >
            JSON
            <ExternalLink aria-hidden="true" className="w-3 h-3" />
          </a>
          <span className="text-neutral-600">·</span>
          <span className="whitespace-nowrap">
            Política: {policyLabels[registrationPolicy]}
          </span>
        </div>

        {/* Primário: identidade + ação, peso visual alto */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-2 py-1">
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt={username}
                className="h-7 w-7 rounded-full border border-white/15 bg-neutral-800 object-cover"
              />
            )}
            <span className="text-xs font-mono text-neutral-100">
              {username}
            </span>
            <span
              className={`text-[10px] font-semibold uppercase rounded px-1.5 py-0.5 ${roleBadgeStyles[role]}`}
            >
              {role}
            </span>
          </div>
          {showLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1 rounded-full border border-red-400/40 bg-red-500/15 px-3 py-1 text-[11px] text-red-100 hover:bg-red-500/25 transition-colors"
            >
              <LogOut aria-hidden="true" className="w-3 h-3" />
              Sair
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
