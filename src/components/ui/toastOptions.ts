import type { DefaultToastOptions } from 'react-hot-toast';

export const toastOptions: DefaultToastOptions = {
  duration: 3600,
  style: {
    background: 'hsl(var(--popover) / 0.96)',
    color: 'hsl(var(--popover-foreground))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '0.875rem',
    padding: '0.75rem 0.9rem',
    boxShadow: '0 18px 50px -24px rgba(0, 0, 0, 0.58), 0 10px 18px -18px rgba(0, 0, 0, 0.46)',
    backdropFilter: 'blur(16px)',
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  success: {
    iconTheme: {
      primary: 'hsl(var(--primary))',
      secondary: 'hsl(var(--primary-foreground))',
    },
  },
  error: {
    duration: 5200,
    iconTheme: {
      primary: 'hsl(var(--destructive))',
      secondary: 'hsl(var(--destructive-foreground))',
    },
  },
};
