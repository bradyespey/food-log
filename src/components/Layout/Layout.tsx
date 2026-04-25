//src/components/Layout/Layout.tsx

import { type ReactNode } from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: ReactNode;
  onLoadSample?: () => void;
}

export function Layout({ children, onLoadSample }: LayoutProps) {
  return (
    <div className="app-bg min-h-screen text-foreground transition-colors duration-150 lg:flex">
      <Navbar onLoadSample={onLoadSample} />
      <main className="w-full min-w-0 overflow-x-hidden px-3 py-4 sm:px-5 sm:py-6 lg:ml-80 lg:px-7 xl:px-9">
        {children}
      </main>
    </div>
  );
}
