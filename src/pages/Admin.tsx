import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  usePlatformStats,
  useFunnelStatsAdmin,
  useAllUsers,
  useRecentActivity,
} from '@/hooks/useAdmin';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { AdminLayout } from '@/components/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  UserPlus,
  Crown,
  Clock,
  XCircle,
  BarChart3,
  MessageSquare,
  Mail,
  Phone,
  Shield,
  RefreshCw,
  Key,
  FileText,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { admin, loading: adminLoading, changePassword } = useAdminAuth();
  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: funnelStats, isLoading: funnelLoading } = useFunnelStatsAdmin();
  const { data: allUsers, isLoading: usersLoading } = useAllUsers();
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(30);

  const [activeTab, setActiveTab] = useState('overview');
  const [userSearch, setUserSearch] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30 animate-pulse">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      </div>
    );
  }

  if (!admin) {
    navigate('/admin/login', { replace: true });
    return null;
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 4) {
      toast({
        title: 'Error',
        description: 'Password must be at least 4 characters',
        variant: 'destructive',
      });
      return;
    }

    setChangingPassword(true);
    const { error } = await changePassword(currentPassword, newPassword);
    setChangingPassword(false);

    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Password changed successfully',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const filteredUsers = allUsers?.filter(
    (user) =>
      user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Trial</Badge>;
      case 'expired':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Expired</Badge>;
      case 'canceled':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Canceled</Badge>;
      default:
        return <Badge variant="secondary">None</Badge>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'signup':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'subscription':
        return <Crown className="h-4 w-4 text-blue-500" />;
      case 'funnel':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatCurrency = (amount: number) => {
    const safeAmount = Number(amount) || 0;
    const formatted = new Intl.NumberFormat('en-KE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safeAmount);
    return `Ksh ${formatted}`;
  };

  // 3D Card Component
  const StatCard = ({ title, value, subtitle, icon: Icon, gradient, trend }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    gradient: string;
    trend?: { value: number; positive: boolean };
  }) => (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500" />
      <div className="relative bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                {trend && (
                  <span className={`flex items-center ${trend.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {trend.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {trend.value}%
                  </span>
                )}
                {subtitle}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );

  // Render Overview Tab
  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="text-sm font-medium text-white/80">Admin Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, Admin! 👋</h1>
          <p className="text-white/80">Here's what's happening on your platform today</p>
        </div>
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : stats ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Users"
              value={stats.total_users}
              subtitle={`+${stats.new_users_today} today`}
              icon={Users}
              gradient="from-blue-500 to-cyan-500"
              trend={{ value: stats.new_users_week, positive: true }}
            />
            <StatCard
              title="Active Trials"
              value={stats.active_trials}
              subtitle="Users in 7-day trial"
              icon={Clock}
              gradient="from-violet-500 to-purple-500"
            />
            <StatCard
              title="Paid Subscriptions"
              value={stats.active_subscriptions}
              subtitle={`${stats.conversion_rate}% conversion`}
              icon={Crown}
              gradient="from-emerald-500 to-green-500"
              trend={{ value: Number(stats.conversion_rate), positive: true }}
            />
            <StatCard
              title="Churned Users"
              value={stats.churned_users}
              subtitle="Expired or canceled"
              icon={XCircle}
              gradient="from-red-500 to-rose-500"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <StatCard
              title="Total Customers"
              value={stats.total_customers}
              subtitle="Across all users"
              icon={Users}
              gradient="from-indigo-500 to-blue-500"
            />
            <StatCard
              title="Total Invoices"
              value={stats.total_invoices}
              subtitle="Created on platform"
              icon={FileText}
              gradient="from-amber-500 to-orange-500"
            />
            <StatCard
              title="Outstanding Amount"
              value={formatCurrency(stats.total_outstanding)}
              subtitle="Pending collection"
              icon={DollarSign}
              gradient="from-pink-500 to-rose-500"
            />
          </div>
        </>
      ) : null}
    </div>
  );

  // Render Users Tab
  const renderUsers = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">All Users</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">View and manage all platform users</p>
          </div>
          <Input
            placeholder="Search by email or name..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
        {usersLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Customers</TableHead>
                  <TableHead>Invoices</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => (
                  <TableRow key={user.user_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(user.subscription_status)}</TableCell>
                    <TableCell>{user.plan_name || '-'}</TableCell>
                    <TableCell>{user.customer_count}</TableCell>
                    <TableCell>{user.invoice_count}</TableCell>
                    <TableCell>{formatCurrency(user.outstanding_total)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );

  // Render Funnel Tab
  const renderFunnel = () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Funnel Messages by Day</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Users reached at each funnel step</p>
        {funnelLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : funnelStats?.by_day && funnelStats.by_day.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Users</TableHead>
                <TableHead><MessageSquare className="h-4 w-4 text-[#25D366]" /></TableHead>
                <TableHead><Mail className="h-4 w-4 text-blue-500" /></TableHead>
                <TableHead><Phone className="h-4 w-4 text-purple-500" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funnelStats.by_day.map((day) => (
                <TableRow key={day.day_number}>
                  <TableCell className="font-medium">Day {day.day_number}</TableCell>
                  <TableCell>{day.users_count}</TableCell>
                  <TableCell>{day.whatsapp_sent}</TableCell>
                  <TableCell>{day.email_sent}</TableCell>
                  <TableCell>{day.sms_sent}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-slate-500 py-12">No funnel data yet</p>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Total Messages Sent</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Across all channels</p>
        {funnelStats?.total_messages_sent ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[#25D366]/10 to-[#25D366]/5 border border-[#25D366]/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#25D366]">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <span className="font-medium">WhatsApp</span>
              </div>
              <span className="text-2xl font-bold">{funnelStats.total_messages_sent.whatsapp}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <span className="font-medium">Email</span>
              </div>
              <span className="text-2xl font-bold">{funnelStats.total_messages_sent.email}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <span className="font-medium">SMS</span>
              </div>
              <span className="text-2xl font-bold">{funnelStats.total_messages_sent.sms}</span>
            </div>
          </div>
        ) : (
          <p className="text-center text-slate-500 py-12">No messages sent yet</p>
        )}
      </div>
    </div>
  );

  // Render Activity Tab
  const renderActivity = () => (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Recent Activity</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Latest platform events</p>
      {activityLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : recentActivity && recentActivity.length > 0 ? (
        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-600 shadow-sm">
                {getActivityIcon(activity.activity_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{activity.description}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{activity.user_email}</p>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {new Date(activity.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-slate-500 py-12">No recent activity</p>
      )}
    </div>
  );

  // Render Settings Tab
  const renderSettings = () => (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50 max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
          <Key className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Change Password</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Update your admin account password</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-password">Current Password</Label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
          />
        </div>
        <Button 
          onClick={handleChangePassword} 
          disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
        >
          {changingPassword ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Changing...
            </>
          ) : (
            <>
              <Key className="mr-2 h-4 w-4" />
              Change Password
            </>
          )}
        </Button>
      </div>
    </div>
  );

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'users':
        return renderUsers();
      case 'funnel':
        return renderFunnel();
      case 'activity':
        return renderActivity();
      case 'settings':
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
}
