import type { ReactNode } from 'react'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?:
    | 'primary'
    | 'secondary'
    | 'danger'
    | 'success'
    | 'outline'
    | 'spotify'
  size?: 'sm' | 'md' | 'lg'
  shape?: 'rounded' | 'pill'
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  loading?: boolean
  loadingText?: string
  fullWidth?: boolean
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-linear-to-r from-emerald-400 via-emerald-500 to-cyan-500 text-neutral-900 shadow-lg shadow-emerald-500/25 hover:translate-y-px',
  secondary: 'bg-neutral-700 hover:bg-neutral-600 text-white',
  danger:
    'border border-red-400/40 bg-red-500/15 text-red-100 hover:bg-red-500/25',
  success:
    'bg-linear-to-r from-emerald-400 via-emerald-500 to-cyan-500 text-neutral-900 shadow-lg shadow-emerald-500/25 hover:translate-y-px',
  outline:
    'border border-white/10 bg-white/5 text-neutral-100 hover:border-emerald-400/60 hover:text-emerald-100',
  spotify:
    'bg-[#1DB954] text-white shadow-lg shadow-[#1DB954]/25 hover:bg-[#1ed760]',
}

const paddingStyles = {
  sm: 'px-3 py-1.5 text-xs font-semibold',
  md: 'px-4 py-2.5 text-sm font-semibold',
  lg: 'px-6 py-3 text-base font-semibold',
}

function getRadius(
  shape: ButtonProps['shape'],
  size: NonNullable<ButtonProps['size']>,
) {
  if (shape === 'pill') return 'rounded-full'
  return size === 'sm' ? 'rounded-lg' : 'rounded-xl'
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  icon,
  iconPosition = 'left',
  loading = false,
  loadingText = 'Carregando...',
  fullWidth = false,
  disabled = false,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles =
    'transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100'
  const variantStyle = variantStyles[variant]
  const sizeStyle = paddingStyles[size]
  const radiusStyle = getRadius(shape, size)
  const widthStyle = fullWidth ? 'w-full' : ''

  const combinedClassName = `${baseStyles} ${variantStyle} ${sizeStyle} ${radiusStyle} ${widthStyle} ${className}`

  return (
    <button
      disabled={disabled || loading}
      className={combinedClassName}
      {...props}
    >
      <span className="flex items-center justify-center gap-2">
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {loadingText}
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="inline-flex">{icon}</span>
            )}
            {children}
            {icon && iconPosition === 'right' && (
              <span className="inline-flex">{icon}</span>
            )}
          </>
        )}
      </span>
    </button>
  )
}
