//src/components/ui/Button.tsx

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
type ButtonSize    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant
  size?:      ButtonSize
  isLoading?: boolean
  leftIcon?:  React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant   = 'primary',
  size      = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = [
    'inline-flex items-center justify-center rounded-full font-semibold',
    'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:opacity-50 disabled:pointer-events-none',
  ].join(' ')

  const variantStyles: Record<ButtonVariant,string> = {
    primary:   'bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline:   'border border-border bg-card/70 text-foreground hover:bg-secondary',
    danger:    'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    ghost:     'bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground',
  }

  const sizeStyles: Record<ButtonSize,string> = {
    sm: 'h-9 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  }

  const spinner = (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )

  return (
    <button
      disabled={disabled || isLoading}
      className={[
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      ].join(' ')}
      {...props}
    >
      {isLoading && spinner}
      {!isLoading && leftIcon  && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  )
}
