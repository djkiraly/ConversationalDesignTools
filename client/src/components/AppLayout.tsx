import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { CheckCircle2, Settings, Map, Home, Users, ClipboardList } from 'lucide-react';
import SettingsDialog from './SettingsDialog';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Define menu items with their properties
  const menuItems = useMemo(() => {
    // Define all menu items (excluding Home and Settings which will be positioned separately)
    const items = [
      {
        name: "Action Plan",
        path: "/action-plan",
        icon: <ClipboardList className="h-6 w-6" />,
        isActive: location === '/action-plan'
      },
      {
        name: "Customer Journey",
        path: "/customer-journey",
        icon: <Map className="h-6 w-6" />,
        isActive: location === '/customer-journey'
      },
      {
        name: "Customers",
        path: "/customers",
        icon: <Users className="h-6 w-6" />,
        isActive: location === '/customers'
      },
      {
        name: "Happy Path",
        path: "/happy-path",
        icon: <CheckCircle2 className="h-6 w-6" />,
        isActive: location === '/happy-path' || location.startsWith('/use-case/')
      }
    ];
    
    // Sort alphabetically by name
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [location]);

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
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border py-2 px-4 flex justify-center items-center shadow-lg">
        {/* Center-aligned container with minimal spacing */}
        <div className="flex items-center justify-center gap-3 max-w-xl mx-auto">
          {/* Home (Always leftmost) */}
          <Link href="/">
            <div className={`flex flex-col items-center px-2 py-2 hover:text-primary rounded-md transition-colors cursor-pointer ${location === '/' || location === '/home' ? 'text-primary' : 'text-muted-foreground'}`}>
              <Home className="h-6 w-6" />
              <span className="text-xs mt-1">Home</span>
            </div>
          </Link>
          
          {/* Middle pages (alphabetically ordered) */}
          {menuItems.map((item) => (
            <Link href={item.path} key={item.path}>
              <div className={`flex flex-col items-center px-2 py-2 hover:text-primary rounded-md transition-colors cursor-pointer ${item.isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {item.icon}
                <span className="text-xs mt-1">{item.name}</span>
              </div>
            </Link>
          ))}
          
          {/* Settings (Always rightmost) */}
          <div 
            className="flex flex-col items-center px-2 py-2 hover:text-primary rounded-md transition-colors cursor-pointer text-muted-foreground"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-6 w-6" />
            <span className="text-xs mt-1">Settings</span>
          </div>
        </div>
      </div>
      
      {/* Add bottom padding to account for the fixed toolbar */}
      <div className="h-20"></div>
    </div>
  );
}