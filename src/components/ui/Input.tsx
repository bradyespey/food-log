//src/components/ui/Input.tsx

import React, { useId, useMemo } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = useMemo(() => id || generatedId, [id, generatedId]);

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase text-muted-foreground">
            {label}
          </label>
        )}
        <input
          id={inputId}
          className={`block w-full rounded-lg border-border bg-card/80 text-foreground shadow-sm placeholder:text-muted-foreground/70 focus:border-primary focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''} ${className}`}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
