import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export type ModalShellProps = {
  title: string
  description?: string
  onClose: () => void
  maxWidth?: string
  children: ReactNode
}

export default function ModalShell({
  title,
  description,
  onClose,
  maxWidth = 'max-w-md',
  children,
}: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Fechar"
        className="modal-backdrop-in absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`modal-panel-in relative z-10 w-full ${maxWidth} space-y-4 rounded-2xl border border-white/10 bg-neutral-950/95 p-6 shadow-2xl`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {description && (
              <p className="mt-0.5 text-sm text-neutral-400">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="shrink-0 rounded-xl border border-white/10 bg-white/5 p-1.5 text-neutral-200 transition-all duration-150 hover:border-emerald-400/60 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
          >
            <X aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
