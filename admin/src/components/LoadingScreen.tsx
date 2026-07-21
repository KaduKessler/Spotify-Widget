export default function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-emerald-500/10 via-cyan-500/8 to-sky-600/12 blur-3xl" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <svg
          className="animate-spin h-8 w-8 text-emerald-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <title>Carregando</title>
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p className="text-sm text-neutral-400 tracking-wide">{label}</p>
      </div>
    </div>
  )
}
