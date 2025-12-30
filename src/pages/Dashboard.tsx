import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import FunnelNotification from '@/components/FunnelNotification';
import OverdueNotification from '@/components/OverdueNotification';
import { StatCard } from '@/components/StatCard';
import { CustomerCard } from '@/components/CustomerCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCustomers, useInvoices } from '@/hooks/useSupabaseData';
import { useSubscription } from '@/context/SubscriptionContext';
import { useUserTypeLabels } from '@/hooks/useProfile';
import { formatCurrency } from '@/lib/data';
import { 
  Users, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  Plus, 
  Search,
  Loader2,
  Crown,
  Clock
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'overdue' | 'pending' | 'clear';

export default function Dashboard() {
  const { data: customers = [], isLoading: customersLoading } = useCustomers();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { subscription, isActive, isTrialing, trialDaysLeft, loading: subscriptionLoading } = useSubscription();
  const labels = useUserTypeLabels();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const isLoading = customersLoading || invoicesLoading || subscriptionLoading;

  const stats = useMemo(() => {
    const totalOutstanding = customers.reduce((sum, c) => sum + Number(c.outstanding_total), 0);
    const overdueCount = invoices.filter((inv) => inv.status === 'Overdue').length;
    const overdueAmount = invoices
      .filter((inv) => inv.status === 'Overdue')
      .reduce((sum, inv) => sum + Number(inv.amount), 0);
    const pendingCount = invoices.filter((inv) => inv.status === 'Pending').length;

    return {
      totalCustomers: customers.length,
      totalOutstanding,
      overdueCount,
      overdueAmount,
      pendingCount,
    };
  }, [customers, invoices]);

  const hasOverdueInvoices = (customerId: string) => {
    return invoices.some(inv => inv.customer_id === customerId && inv.status === 'Overdue');
  };

  const getPendingInvoicesCount = (customerId: string) => {
    return invoices.filter(inv => inv.customer_id === customerId && inv.status === 'Pending').length;
  };

  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.contact.toLowerCase().includes(query)
      );
    }

    // Apply filter
    if (filter === 'overdue') {
      filtered = filtered.filter((c) => hasOverdueInvoices(c.id));
    } else if (filter === 'pending') {
      filtered = filtered.filter((c) => getPendingInvoicesCount(c.id) > 0);
    } else if (filter === 'clear') {
      filtered = filtered.filter((c) => Number(c.outstanding_total) === 0);
    }

    return filtered;
  }, [customers, invoices, searchQuery, filter]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <FunnelNotification />
      <OverdueNotification />
      <div className="space-y-6 md:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Track your {labels.customers.toLowerCase()} and outstanding invoices
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/customers/new">
              <Button variant="outline" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">{labels.addCustomer}</span>
              </Button>
            </Link>
            <Link to="/invoices/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Invoice</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Subscription Status Card */}
        <Card className={cn(
          "border-l-4",
          isActive ? "border-l-green-500 bg-green-500/5" : "border-l-accent bg-accent/5"
        )}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isActive ? (
                  <Crown className="h-6 w-6 text-green-500" />
                ) : (
                  <Clock className="h-6 w-6 text-accent" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {isActive ? subscription?.plan?.name || 'Premium Plan' : 'Free Trial'}
                    </span>
                    <Badge className={cn(
                      "text-xs",
                      isActive 
                        ? "bg-green-500/10 text-green-600 border-green-500/20" 
                        : "bg-accent/10 text-accent border-accent/20"
                    )}>
                      {isActive ? 'Active' : `${trialDaysLeft} days left`}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isActive 
                      ? `${subscription?.billing_interval === 'yearly' ? 'Yearly' : 'Monthly'} subscription`
                      : 'Upgrade to unlock all features'}
                  </p>
                </div>
              </div>
              {!isActive && (
                <Link to="/pricing">
                  <Button size="sm" className="gap-1">
                    <Crown className="h-4 w-4" />
                    Upgrade
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={labels.totalCustomers}
            value={stats.totalCustomers}
            icon={Users}
            variant="default"
          />
          <StatCard
            title="Outstanding Amount"
            value={formatCurrency(stats.totalOutstanding)}
            icon={TrendingUp}
            variant="warning"
          />
          <StatCard
            title="Overdue Invoices"
            value={stats.overdueCount}
            icon={AlertTriangle}
            variant="danger"
          />
          <StatCard
            title="Pending Invoices"
            value={stats.pendingCount}
            icon={FileText}
            variant="default"
          />
        </div>

        {/* Customers Section */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">{labels.customers} Overview</h2>
            
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={labels.searchCustomers}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'overdue', label: 'Overdue' },
                  { key: 'pending', label: 'Pending' },
                  { key: 'clear', label: 'Clear' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setFilter(item.key as FilterType)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap',
                      filter === item.key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Cards Grid */}
          {filteredCustomers.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCustomers.map((customer) => (
                <CustomerCard
                  key={customer.id}
                  customer={{
                    id: customer.id,
                    name: customer.name,
                    contact: customer.contact,
                    address: customer.address || undefined,
                    outstandingTotal: Number(customer.outstanding_total),
                    createdAt: new Date(customer.created_at),
                  }}
                  invoices={invoices.map(inv => ({
                    id: inv.id,
                    invoiceNumber: inv.invoice_number,
                    customerId: inv.customer_id,
                    customerName: '',
                    issueDate: new Date(inv.issue_date),
                    dueDate: new Date(inv.due_date),
                    amount: Number(inv.amount),
                    status: inv.status,
                    statementGenerated: inv.statement_generated,
                  }))}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">{labels.noCustomers}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery || filter !== 'all'
                  ? 'Try adjusting your search or filter'
                  : labels.addFirstCustomer}
              </p>
              {!searchQuery && filter === 'all' && (
                <Link to="/customers/new" className="mt-4">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {labels.addCustomer}
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
