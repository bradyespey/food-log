import React from 'react';
import { cn } from '../../utils/cn';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, rows = 4, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-semibold uppercase text-muted-foreground">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          rows={rows}
          className={cn(
            'block w-full rounded-lg border-border bg-card/80 text-foreground shadow-sm placeholder:text-muted-foreground/70 focus:border-primary focus:ring-primary text-sm transition-colors duration-200',
            'resize-vertical',
            error && 'border-destructive focus:border-destructive focus:ring-destructive',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {helperText && !error && <p className="text-xs text-muted-foreground">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
