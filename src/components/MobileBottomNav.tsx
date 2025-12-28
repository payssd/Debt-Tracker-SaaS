import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Gift,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ClipboardList, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/referrals', label: 'Referrals', icon: Gift },
];

const moreNavItems = [
  { href: '/statements', label: 'Statements', icon: ClipboardList },
  { href: '/reminders', label: 'Reminders', icon: MessageSquare },
];

export function MobileBottomNav() {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Backdrop blur background */}
      <div className="absolute inset-0 bg-background/90 backdrop-blur-lg border-t border-border" />
      
      {/* Navigation items */}
      <div className="relative flex items-center justify-around px-2 pb-safe">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center min-w-[56px] py-2 px-2 rounded-xl transition-all duration-200',
                'active:scale-95 tap-highlight-transparent',
                active 
                  ? 'text-primary' 
                  : 'text-muted-foreground'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
                active && 'bg-primary/10'
              )}>
                <Icon className={cn(
                  'h-5 w-5 transition-all duration-200',
                  active && 'scale-110'
                )} />
              </div>
              <span className={cn(
                'text-[10px] font-medium mt-0.5 transition-all duration-200',
                active ? 'opacity-100' : 'opacity-70'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
        
        {/* More dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex flex-col items-center justify-center min-w-[56px] py-2 px-2 rounded-xl transition-all duration-200',
                'active:scale-95 tap-highlight-transparent text-muted-foreground'
              )}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200">
                <MoreHorizontal className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium mt-0.5 opacity-70">More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mb-2">
            {moreNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem key={item.href} asChild>
                  <Link to={item.href} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
