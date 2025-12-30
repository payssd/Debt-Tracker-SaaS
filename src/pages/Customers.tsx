import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCustomers, useInvoices } from '@/hooks/useSupabaseData';
import { useUserTypeLabels } from '@/hooks/useProfile';
import { formatCurrency } from '@/lib/data';
import { Users, Plus, Search, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

export default function Customers() {
  const { data: customers = [], isLoading: customersLoading } = useCustomers();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const labels = useUserTypeLabels();
  const [searchQuery, setSearchQuery] = useState('');

  const isLoading = customersLoading || invoicesLoading;

  const hasOverdueInvoices = (customerId: string) => {
    return invoices.some(inv => inv.customer_id === customerId && inv.status === 'Overdue');
  };

  const getPendingInvoicesCount = (customerId: string) => {
    return invoices.filter(inv => inv.customer_id === customerId && inv.status === 'Pending').length;
  };

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const query = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.contact.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

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
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{labels.customers}</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your {labels.customers.toLowerCase()} database
            </p>
          </div>
          <Link to="/customers/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {labels.addCustomer}
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle>{labels.allCustomers}</CardTitle>
                  <CardDescription>{customers.length} total {labels.customers.toLowerCase()}</CardDescription>
                </div>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={labels.searchCustomers}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCustomers.length > 0 ? (
              <div className="divide-y">
                {filteredCustomers.map((customer) => {
                  const isOverdue = hasOverdueInvoices(customer.id);
                  const pendingCount = getPendingInvoicesCount(customer.id);

                  return (
                    <Link
                      key={customer.id}
                      to={`/customers/${customer.id}`}
                      className={cn(
                        'flex items-center justify-between py-4 px-2 -mx-2 rounded-lg transition-colors hover:bg-muted/50',
                        isOverdue && 'bg-status-overdue-bg/20'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isOverdue && (
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-status-overdue/10">
                            <AlertTriangle className="h-4 w-4 text-status-overdue" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate">{customer.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {customer.contact}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="font-semibold">
                            {formatCurrency(Number(customer.outstanding_total))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {pendingCount} pending
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 font-semibold">{labels.noCustomers}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchQuery
                    ? 'Try a different search term'
                    : labels.addFirstCustomer}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
