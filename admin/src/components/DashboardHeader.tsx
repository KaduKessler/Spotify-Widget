import { ChevronDown, ExternalLink, LogOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

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
  admin: 'bg-red-500/15 text-red-300',
  user: 'bg-emerald-500/15 text-emerald-300',
  viewer: 'bg-sky-500/15 text-sky-300',
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
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const initials = username.slice(0, 2).toUpperCase()

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <header className="fade-in-up relative z-30 flex items-center justify-between gap-4 rounded-3xl border border-white/8 bg-neutral-900/70 backdrop-blur-xl px-5 py-4 shadow-[0_20px_90px_rgba(0,0,0,0.45)]">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-200/80">
          Dashboard
        </p>
        <h1 className="text-2xl font-semibold">Spotify Widget</h1>
      </div>

      <div ref={rootRef} className="relative">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="user-menu-panel"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pl-1 pr-2.5 transition-all duration-150 hover:border-emerald-400/50 hover:bg-white/8 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-7 w-7 rounded-full border border-white/15 bg-neutral-800 object-cover"
            />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-cyan-500 text-[10px] font-bold text-neutral-900">
              {initials}
            </span>
          )}
          <span className="max-w-[8rem] truncate text-xs font-mono text-neutral-100 sm:max-w-[12rem]">
            {username}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`h-3.5 w-3.5 text-neutral-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <div
            id="user-menu-panel"
            className="modal-panel-in absolute right-0 top-[calc(100%+8px)] z-20 w-64 rounded-2xl border border-white/10 bg-neutral-950/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full border border-white/15 bg-neutral-800 object-cover"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-cyan-500 text-xs font-bold text-neutral-900">
                  {initials}
                </span>
              )}
              <div>
                <p className="text-sm font-mono text-neutral-100">{username}</p>
                <span
                  className={`mt-0.5 inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${roleBadgeStyles[role]}`}
                >
                  {role}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2.5 text-xs">
              <span className="text-neutral-400">Política de registro</span>
              <span className="font-medium text-neutral-100">
                {policyLabels[registrationPolicy]}
              </span>
            </div>

            <a
              href={jsonUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 transition-all duration-150 hover:border-emerald-400/50 hover:bg-white/8 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
            >
              JSON público
              <ExternalLink
                aria-hidden="true"
                className="h-3.5 w-3.5 text-neutral-400"
              />
            </a>

            {showLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="mt-2 flex w-full items-center justify-between gap-2 rounded-xl border border-red-400/25 bg-red-500/5 px-3 py-2 text-sm text-red-300 transition-all duration-150 hover:border-red-400/50 hover:bg-red-500/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
              >
                Sair
                <LogOut aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
