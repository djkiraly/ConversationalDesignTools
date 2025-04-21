import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Settings, FileText, GitGraph } from 'lucide-react';
import SettingsDialog from './SettingsDialog';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Settings Dialog */}
      <SettingsDialog 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />
      
      {/* Bottom toolbar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border py-2 px-4 flex justify-center items-center gap-6 shadow-lg">
        <Link href="/">
          <div className={`flex flex-col items-center px-4 py-2 hover:text-primary rounded-md transition-colors cursor-pointer ${location === '/' || location.startsWith('/use-case/') ? 'text-primary' : 'text-muted-foreground'}`}>
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">Home</span>
          </div>
        </Link>
        
        <Link href="/transcripts">
          <div className={`flex flex-col items-center px-4 py-2 hover:text-primary rounded-md transition-colors cursor-pointer ${location === '/transcripts' || location.startsWith('/transcript/') ? 'text-primary' : 'text-muted-foreground'}`}>
            <FileText className="h-6 w-6" />
            <span className="text-xs mt-1">Transcripts</span>
          </div>
        </Link>
        
        <Link href="/journey-maps">
          <div className={`flex flex-col items-center px-4 py-2 hover:text-primary rounded-md transition-colors cursor-pointer ${location === '/journey-maps' || location.startsWith('/journey-map/') ? 'text-primary' : 'text-muted-foreground'}`}>
            <GitGraph className="h-6 w-6" />
            <span className="text-xs mt-1">Journey Maps</span>
          </div>
        </Link>
        
        <div 
          className="flex flex-col items-center px-4 py-2 hover:text-primary rounded-md transition-colors cursor-pointer text-muted-foreground"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="h-6 w-6" />
          <span className="text-xs mt-1">Settings</span>
        </div>
      </div>
      
      {/* Add bottom padding to account for the fixed toolbar */}
      <div className="h-20"></div>
    </div>
  );
}