import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';

export function Layout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Desktop sidebar - hidden on mobile */}
        <AppSidebar />
        
        <SidebarInset>
          {/* Desktop header with sidebar trigger */}
          <header className="sticky top-0 z-40 hidden md:flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
            <SidebarTrigger className="-ml-1" />
          </header>
          
          {/* Mobile header - simplified */}
          <header className="sticky top-0 z-40 flex md:hidden h-14 items-center justify-center border-b bg-background/80 backdrop-blur-sm px-4 safe-top">
            <span className="text-lg font-semibold tracking-tight">Debt Tracker</span>
          </header>
          
          {/* Main content with mobile bottom padding for nav */}
          <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
            {children}
          </main>
        </SidebarInset>
        
        {/* Mobile bottom navigation */}
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
}
