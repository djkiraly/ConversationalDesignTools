import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Bottom toolbar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border py-2 px-4 flex justify-center items-center shadow-lg">
        <Link href="/">
          <div className={`flex flex-col items-center px-4 py-2 hover:text-primary rounded-md transition-colors cursor-pointer ${location === '/' || location.startsWith('/use-case/') ? 'text-primary' : 'text-muted-foreground'}`}>
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">Home</span>
          </div>
        </Link>
      </div>
      
      {/* Add bottom padding to account for the fixed toolbar */}
      <div className="h-20"></div>
    </div>
  );
}