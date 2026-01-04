import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  LogOut,
  Settings,
  Key,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { admin, loading: adminLoading, logout, changePassword } = useAdminAuth();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = usePlatformStats();
  const { data: funnelStats, isLoading: funnelLoading } = useFunnelStatsAdmin();
  const { data: allUsers, isLoading: usersLoading } = useAllUsers();
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(30);

  const [userSearch, setUserSearch] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!admin) {
    // Redirect to admin login
    navigate('/admin/login', { replace: true });
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

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

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 border-b border-slate-700 bg-slate-800/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
              <p className="text-xs text-slate-400">{admin.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => refetchStats()} variant="outline" size="sm" className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-700">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleLogout} variant="destructive" size="sm" className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl text-white">Platform Overview</h1>
              <Badge variant="outline" className="gap-1 border-slate-600 text-slate-300">
                <Shield className="h-3 w-3" />
                {admin.role}
              </Badge>
            </div>
            <p className="mt-1 text-slate-400">Platform-wide analytics and user management</p>
          </div>
        </div>

        {statsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : stats ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_users}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.new_users_today} today, +{stats.new_users_week} this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Trials</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">{stats.active_trials}</div>
                <p className="text-xs text-muted-foreground">Users in 7-day trial</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Paid Subscriptions</CardTitle>
                <Crown className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{stats.active_subscriptions}</div>
                <p className="text-xs text-muted-foreground">{stats.conversion_rate}% conversion rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Churned</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{stats.churned_users}</div>
                <p className="text-xs text-muted-foreground">Expired or canceled</p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {stats && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_customers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_invoices}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.total_outstanding)}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-slate-700">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="funnel" className="gap-2 data-[state=active]:bg-slate-700">
              <TrendingUp className="h-4 w-4" />
              Funnel Stats
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2 data-[state=active]:bg-slate-700">
              <Activity className="h-4 w-4" />
              Recent Activity
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-slate-700">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>View and manage all platform users</CardDescription>
                <div className="pt-2">
                  <Input
                    placeholder="Search by email or name..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
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
                          <TableRow key={user.user_id}>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="funnel">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Funnel Messages by Day</CardTitle>
                  <CardDescription>Users reached at each funnel step</CardDescription>
                </CardHeader>
                <CardContent>
                  {funnelLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
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
                    <p className="text-center text-muted-foreground py-8">No funnel data yet</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Total Messages Sent</CardTitle>
                  <CardDescription>Across all channels</CardDescription>
                </CardHeader>
                <CardContent>
                  {funnelStats?.total_messages_sent ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-[#25D366]/10">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="h-6 w-6 text-[#25D366]" />
                          <span className="font-medium">WhatsApp</span>
                        </div>
                        <span className="text-2xl font-bold">{funnelStats.total_messages_sent.whatsapp}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-blue-500/10">
                        <div className="flex items-center gap-3">
                          <Mail className="h-6 w-6 text-blue-500" />
                          <span className="font-medium">Email</span>
                        </div>
                        <span className="text-2xl font-bold">{funnelStats.total_messages_sent.email}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-purple-500/10">
                        <div className="flex items-center gap-3">
                          <Phone className="h-6 w-6 text-purple-500" />
                          <span className="font-medium">SMS</span>
                        </div>
                        <span className="text-2xl font-bold">{funnelStats.total_messages_sent.sms}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No messages sent yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest platform events</CardDescription>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 rounded-lg border bg-card">
                        {getActivityIcon(activity.activity_type)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{activity.description}</p>
                          <p className="text-xs text-muted-foreground truncate">{activity.user_email}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(activity.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your admin account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-md">
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
                  className="w-full"
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </main>
    </div>
  );
}
