//src/components/ui/Card.tsx

export interface CardProps {
  children: React.ReactNode
  className?: string
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div
    className={[
      'surface w-full min-w-0 max-w-full rounded-lg',
      className
    ].join(' ')}
  >
    {children}
  </div>
)

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={['min-w-0 p-4 sm:p-5 border-b border-border', className].join(' ')}>
    {children}
  </div>
)

export const CardTitle: React.FC<CardProps> = ({ children, className = '' }) => (
  <h3 className={['font-semibold text-base sm:text-lg text-foreground', className].join(' ')}>
    {children}
  </h3>
)

export const CardDescription: React.FC<CardProps> = ({ children, className = '' }) => (
  <p className={['text-sm text-muted-foreground mt-1', className].join(' ')}>
    {children}
  </p>
)

export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={['min-w-0 p-4 sm:p-5', className].join(' ')}>
    {children}
  </div>
)

export const CardFooter: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={['p-4 sm:p-5 border-t border-border', className].join(' ')}>
    {children}
  </div>
)
