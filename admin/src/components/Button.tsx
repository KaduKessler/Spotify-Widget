import type { ReactNode } from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  loading?: boolean
  fullWidth?: boolean
}

const variantStyles = {
  primary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  secondary: 'bg-neutral-600 hover:bg-neutral-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  outline: 'border border-neutral-600 hover:border-neutral-500 hover:bg-neutral-900/50 text-neutral-300',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs font-medium',
  md: 'px-4 py-2 text-sm font-medium',
  lg: 'px-6 py-3 text-base font-medium',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled = false,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const variantStyle = variantStyles[variant]
  const sizeStyle = sizeStyles[size]
  const widthStyle = fullWidth ? 'w-full' : ''

  const combinedClassName = `${baseStyles} ${variantStyle} ${sizeStyle} ${widthStyle} ${className}`

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
              <title>Loading</title>
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
            Carregando...
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && <span className="inline-flex">{icon}</span>}
            {children}
            {icon && iconPosition === 'right' && <span className="inline-flex">{icon}</span>}
          </>
        )}
      </span>
    </button>
  )
}
