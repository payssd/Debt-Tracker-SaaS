import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp,
  Activity,
  Settings,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function AdminLayout({ children, activeTab, onTabChange }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'funnel', label: 'Funnel Stats', icon: TrendingUp },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out",
          "bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl",
          "border-r border-slate-200/50 dark:border-slate-700/50",
          "shadow-xl shadow-slate-200/20 dark:shadow-slate-950/50",
          isCollapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200/50 dark:border-slate-700/50">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105">
              <Shield className="h-5 w-5 text-white" />
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 animate-pulse" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Admin Portal
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Debt Tracker</span>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <div className={cn("mb-3", !isCollapsed && "px-2")}>
            {!isCollapsed && <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Navigation</span>}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange?.(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                  "text-sm font-medium",
                  isActive 
                    ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
                  isCollapsed && "justify-center"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", isActive && "drop-shadow-sm")} />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200/50 dark:border-slate-700/50">
          {/* Logout */}
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
              "text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>

          {/* User */}
          {!isCollapsed && (
            <div className="mt-3 p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 ring-2 ring-indigo-500/20">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm font-semibold">
                    {admin?.email?.charAt(0).toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {admin?.email}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        isCollapsed ? "ml-[72px]" : "ml-64"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm text-slate-500 dark:text-slate-400">Live Dashboard</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20">
                <Shield className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  {admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
