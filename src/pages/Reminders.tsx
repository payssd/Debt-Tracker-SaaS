import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useCustomers, useCustomerInvoices } from '@/hooks/useSupabaseData';
import {
  useReminderSettings,
  useUpdateReminderSettings,
  useReminderHistory,
  useCustomersNeedingReminders,
  useRecordManualReminder,
} from '@/hooks/useReminders';
import { formatCurrency } from '@/lib/data';
import { format, formatDistanceToNow } from 'date-fns';
import {
  MessageSquare,
  Copy,
  Check,
  Send,
  Loader2,
  Settings,
  History,
  Bell,
  AlertTriangle,
  Clock,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Reminders() {
  const [searchParams] = useSearchParams();
  const initialCustomerId = searchParams.get('customer') || '';
  const [activeTab, setActiveTab] = useState('send');

  const { data: customers = [], isLoading: customersLoading } = useCustomers();
  const { data: reminderSettings, isLoading: settingsLoading } = useReminderSettings();
  const { data: reminderHistory = [], isLoading: historyLoading } = useReminderHistory(100);
  const { data: customersNeedingReminders = [], isLoading: needingRemindersLoading } = useCustomersNeedingReminders();
  const updateSettingsMutation = useUpdateReminderSettings();
  const recordManualReminderMutation = useRecordManualReminder();
  const { toast } = useToast();

  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId);
  const { data: allInvoices = [], isLoading: invoicesLoading } = useCustomerInvoices(selectedCustomerId);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    auto_reminders_enabled: reminderSettings?.auto_reminders_enabled ?? true,
    days_before_due: reminderSettings?.days_before_due ?? 3,
    days_after_overdue: reminderSettings?.days_after_overdue ?? 1,
    repeat_interval_days: reminderSettings?.repeat_interval_days ?? 7,
    max_reminders_per_invoice: reminderSettings?.max_reminders_per_invoice ?? 5,
    whatsapp_enabled: reminderSettings?.whatsapp_enabled ?? true,
    email_enabled: reminderSettings?.email_enabled ?? false,
    sms_enabled: reminderSettings?.sms_enabled ?? false,
    whatsapp_api_key: reminderSettings?.whatsapp_api_key ?? '',
    whatsapp_phone_number_id: reminderSettings?.whatsapp_phone_number_id ?? '',
    email_api_key: reminderSettings?.email_api_key ?? '',
    email_from_address: reminderSettings?.email_from_address ?? '',
    sms_api_key: reminderSettings?.sms_api_key ?? '',
    sms_from_number: reminderSettings?.sms_from_number ?? '',
  });

  // Update form when settings load
  useMemo(() => {
    if (reminderSettings) {
      setSettingsForm({
        auto_reminders_enabled: reminderSettings.auto_reminders_enabled,
        days_before_due: reminderSettings.days_before_due,
        days_after_overdue: reminderSettings.days_after_overdue,
        repeat_interval_days: reminderSettings.repeat_interval_days,
        max_reminders_per_invoice: reminderSettings.max_reminders_per_invoice,
        whatsapp_enabled: reminderSettings.whatsapp_enabled,
        email_enabled: reminderSettings.email_enabled,
        sms_enabled: reminderSettings.sms_enabled,
        whatsapp_api_key: reminderSettings.whatsapp_api_key ?? '',
        whatsapp_phone_number_id: reminderSettings.whatsapp_phone_number_id ?? '',
        email_api_key: reminderSettings.email_api_key ?? '',
        email_from_address: reminderSettings.email_from_address ?? '',
        sms_api_key: reminderSettings.sms_api_key ?? '',
        sms_from_number: reminderSettings.sms_from_number ?? '',
      });
    }
  }, [reminderSettings]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  const pendingInvoices = useMemo(
    () => allInvoices.filter((inv) => inv.status !== 'Paid'),
    [allInvoices]
  );

  const selectedInvoices = useMemo(
    () => pendingInvoices.filter((inv) => selectedInvoiceIds.includes(inv.id)),
    [pendingInvoices, selectedInvoiceIds]
  );

  const formatDateStr = (date: string) => format(new Date(date), 'MMM d, yyyy');

  const reminderMessage = useMemo(() => {
    if (!selectedCustomer || selectedInvoices.length === 0) return '';

    const totalInvoiced = selectedInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const totalPaid = selectedInvoices.reduce((sum, inv) => sum + Number(inv.amount_paid || 0), 0);
    const totalBalance = totalInvoiced - totalPaid;
    
    const invoiceList = selectedInvoices
      .map((inv) => {
        const paid = Number(inv.amount_paid || 0);
        const balance = Number(inv.amount) - paid;
        if (paid > 0) {
          return `• ${inv.invoice_number}: ${formatCurrency(Number(inv.amount))} (Paid: ${formatCurrency(paid)}, Balance: ${formatCurrency(balance)})`;
        }
        return `• ${inv.invoice_number}: ${formatCurrency(Number(inv.amount))} (Due: ${formatDateStr(inv.due_date)})`;
      })
      .join('\n');

    let message = `Hello ${selectedCustomer.name},

This is a friendly reminder about your outstanding invoice${selectedInvoices.length > 1 ? 's' : ''}:

${invoiceList}

`;

    if (totalPaid > 0) {
      message += `Total Invoiced: ${formatCurrency(totalInvoiced)}
Total Paid: ${formatCurrency(totalPaid)}
Balance Due: ${formatCurrency(totalBalance)}

`;
    } else {
      message += `Total Outstanding: ${formatCurrency(totalBalance)}

`;
    }

    message += `Kindly advise on payment. Thank you for your business!`;
    return message;
  }, [selectedCustomer, selectedInvoices]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoiceIds(pendingInvoices.map((inv) => inv.id));
    } else {
      setSelectedInvoiceIds([]);
    }
  };

  const handleInvoiceToggle = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoiceIds((prev) => [...prev, invoiceId]);
    } else {
      setSelectedInvoiceIds((prev) => prev.filter((id) => id !== invoiceId));
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(reminderMessage);
      setCopied(true);
      
      // Record manual reminder
      if (selectedCustomer && selectedInvoices.length > 0) {
        const total = selectedInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
        recordManualReminderMutation.mutate({
          customerId: selectedCustomer.id,
          invoiceIds: selectedInvoices.map(inv => inv.id),
          message: reminderMessage,
          channel: 'manual_copy',
          totalAmount: total,
        });
      }

      toast({
        title: 'Copied!',
        description: 'Reminder message copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy message.',
        variant: 'destructive',
      });
    }
  };

  const openWhatsApp = () => {
    if (!selectedCustomer) return;
    
    // Record manual reminder
    if (selectedInvoices.length > 0) {
      const total = selectedInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      recordManualReminderMutation.mutate({
        customerId: selectedCustomer.id,
        invoiceIds: selectedInvoices.map(inv => inv.id),
        message: reminderMessage,
        channel: 'whatsapp',
        totalAmount: total,
      });
    }

    // Clean phone number for WhatsApp - remove all non-digits
    let phone = selectedCustomer.contact.replace(/[^0-9+]/g, '');
    
    // Remove leading + if present, wa.me doesn't need it
    phone = phone.replace(/^\+/, '');
    
    // If number starts with 0, assume Nigeria and replace with 234
    if (phone.startsWith('0')) {
      phone = '234' + phone.substring(1);
    }
    
    // If number doesn't start with country code, assume Nigeria (234)
    if (phone.length <= 10) {
      phone = '234' + phone;
    }
    
    const encodedMessage = encodeURIComponent(reminderMessage);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    
    // Use location.href for better mobile compatibility
    window.location.href = whatsappUrl;
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedInvoiceIds([]);
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettingsMutation.mutateAsync(settingsForm);
      toast({
        title: 'Settings saved',
        description: 'Your reminder settings have been updated.',
      });
      setSettingsOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings.',
        variant: 'destructive',
      });
    }
  };

  const handleQuickReminder = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setActiveTab('send');
    // Auto-select all pending invoices for this customer
    const customerInvoices = customersNeedingReminders.find(c => c.customer.id === customerId);
    if (customerInvoices) {
      setSelectedInvoiceIds(customerInvoices.invoices.map(inv => inv.id));
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 text-[#25D366]" />;
      case 'email':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'sms':
        return <Phone className="h-4 w-4 text-purple-500" />;
      default:
        return <Copy className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
      case 'read':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (customersLoading || settingsLoading) {
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
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Payment Reminders
            </h1>
            <p className="mt-1 text-muted-foreground">
              Send automatic or manual payment reminders via WhatsApp, Email, or SMS
            </p>
          </div>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Reminder Settings</DialogTitle>
                <DialogDescription>
                  Configure automatic reminders and messaging channels
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Auto Reminders Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automatic Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically send reminders for overdue and upcoming invoices
                    </p>
                  </div>
                  <Switch
                    checked={settingsForm.auto_reminders_enabled}
                    onCheckedChange={(checked) =>
                      setSettingsForm((prev) => ({ ...prev, auto_reminders_enabled: checked }))
                    }
                  />
                </div>

                {/* Timing Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium">Timing</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Days before due date</Label>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={settingsForm.days_before_due}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({
                            ...prev,
                            days_before_due: parseInt(e.target.value) || 3,
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Send pre-due reminder this many days before
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Days after overdue</Label>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={settingsForm.days_after_overdue}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({
                            ...prev,
                            days_after_overdue: parseInt(e.target.value) || 1,
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Send first overdue reminder after this many days
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Repeat interval (days)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={settingsForm.repeat_interval_days}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({
                            ...prev,
                            repeat_interval_days: parseInt(e.target.value) || 7,
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Repeat overdue reminders every X days
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Max reminders per invoice</Label>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={settingsForm.max_reminders_per_invoice}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({
                            ...prev,
                            max_reminders_per_invoice: parseInt(e.target.value) || 5,
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Stop after this many reminders
                      </p>
                    </div>
                  </div>
                </div>

                {/* Channel Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium">Messaging Channels</h4>
                  
                  {/* WhatsApp */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-[#25D366]" />
                        <Label>WhatsApp Business API</Label>
                      </div>
                      <Switch
                        checked={settingsForm.whatsapp_enabled}
                        onCheckedChange={(checked) =>
                          setSettingsForm((prev) => ({ ...prev, whatsapp_enabled: checked }))
                        }
                      />
                    </div>
                    {settingsForm.whatsapp_enabled && (
                      <div className="grid gap-3 pt-2">
                        <div className="space-y-2">
                          <Label className="text-sm">Access Token</Label>
                          <Input
                            type="password"
                            placeholder="Your WhatsApp Business API token"
                            value={settingsForm.whatsapp_api_key}
                            onChange={(e) =>
                              setSettingsForm((prev) => ({
                                ...prev,
                                whatsapp_api_key: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Phone Number ID</Label>
                          <Input
                            placeholder="Your WhatsApp Phone Number ID"
                            value={settingsForm.whatsapp_phone_number_id}
                            onChange={(e) =>
                              setSettingsForm((prev) => ({
                                ...prev,
                                whatsapp_phone_number_id: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-blue-500" />
                        <Label>Email (Resend API)</Label>
                      </div>
                      <Switch
                        checked={settingsForm.email_enabled}
                        onCheckedChange={(checked) =>
                          setSettingsForm((prev) => ({ ...prev, email_enabled: checked }))
                        }
                      />
                    </div>
                    {settingsForm.email_enabled && (
                      <div className="grid gap-3 pt-2">
                        <div className="space-y-2">
                          <Label className="text-sm">API Key</Label>
                          <Input
                            type="password"
                            placeholder="Your Resend API key"
                            value={settingsForm.email_api_key}
                            onChange={(e) =>
                              setSettingsForm((prev) => ({
                                ...prev,
                                email_api_key: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">From Address</Label>
                          <Input
                            type="email"
                            placeholder="noreply@yourdomain.com"
                            value={settingsForm.email_from_address}
                            onChange={(e) =>
                              setSettingsForm((prev) => ({
                                ...prev,
                                email_from_address: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SMS */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-purple-500" />
                        <Label>SMS (Twilio)</Label>
                      </div>
                      <Switch
                        checked={settingsForm.sms_enabled}
                        onCheckedChange={(checked) =>
                          setSettingsForm((prev) => ({ ...prev, sms_enabled: checked }))
                        }
                      />
                    </div>
                    {settingsForm.sms_enabled && (
                      <div className="grid gap-3 pt-2">
                        <div className="space-y-2">
                          <Label className="text-sm">Account SID:Auth Token</Label>
                          <Input
                            type="password"
                            placeholder="ACCOUNT_SID:AUTH_TOKEN"
                            value={settingsForm.sms_api_key}
                            onChange={(e) =>
                              setSettingsForm((prev) => ({
                                ...prev,
                                sms_api_key: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">From Number</Label>
                          <Input
                            placeholder="+1234567890"
                            value={settingsForm.sms_from_number}
                            onChange={(e) =>
                              setSettingsForm((prev) => ({
                                ...prev,
                                sms_from_number: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleSaveSettings}
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Save Settings
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Auto Reminders Status */}
        <Card className={cn(
          "border-l-4",
          reminderSettings?.auto_reminders_enabled
            ? "border-l-green-500 bg-green-500/5"
            : "border-l-yellow-500 bg-yellow-500/5"
        )}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className={cn(
                  "h-6 w-6",
                  reminderSettings?.auto_reminders_enabled ? "text-green-500" : "text-yellow-500"
                )} />
                <div>
                  <p className="font-medium">
                    Automatic Reminders: {reminderSettings?.auto_reminders_enabled ? 'Enabled' : 'Disabled'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {reminderSettings?.auto_reminders_enabled
                      ? `Sending ${reminderSettings.days_before_due} days before due, repeating every ${reminderSettings.repeat_interval_days} days`
                      : 'Enable automatic reminders in settings'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {reminderSettings?.whatsapp_enabled && (
                  <Badge variant="outline" className="gap-1">
                    <MessageSquare className="h-3 w-3" /> WhatsApp
                  </Badge>
                )}
                {reminderSettings?.email_enabled && (
                  <Badge variant="outline" className="gap-1">
                    <Mail className="h-3 w-3" /> Email
                  </Badge>
                )}
                {reminderSettings?.sms_enabled && (
                  <Badge variant="outline" className="gap-1">
                    <Phone className="h-3 w-3" /> SMS
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="urgent" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Needs Attention</span>
              <span className="sm:hidden">Urgent</span>
              {customersNeedingReminders.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center">
                  {customersNeedingReminders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="send" className="gap-2">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send Reminder</span>
              <span className="sm:hidden">Send</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
              <span className="sm:hidden">History</span>
            </TabsTrigger>
          </TabsList>

          {/* Urgent Tab - Customers Needing Reminders */}
          <TabsContent value="urgent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Customers Needing Reminders
                </CardTitle>
                <CardDescription>
                  Invoices that are overdue or approaching due date
                </CardDescription>
              </CardHeader>
              <CardContent>
                {needingRemindersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : customersNeedingReminders.length > 0 ? (
                  <div className="space-y-3">
                    {customersNeedingReminders.map((item) => (
                      <div
                        key={item.customer.id}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-muted/50",
                          item.overdueCount > 0 && "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {item.overdueCount > 0 ? (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                              <Clock className="h-5 w-5 text-yellow-500" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{item.customer.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.overdueCount > 0 && (
                                <span className="text-red-500 font-medium">
                                  {item.overdueCount} overdue
                                </span>
                              )}
                              {item.overdueCount > 0 && item.preDueCount > 0 && ' • '}
                              {item.preDueCount > 0 && (
                                <span className="text-yellow-600">
                                  {item.preDueCount} due soon
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(item.totalAmount)}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.invoices.length} invoice{item.invoices.length > 1 ? 's' : ''}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleQuickReminder(item.customer.id)}
                            className="gap-1"
                          >
                            <Send className="h-4 w-4" />
                            <span className="hidden sm:inline">Remind</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
                    <h3 className="mt-4 font-semibold">All caught up!</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      No customers need reminders right now
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Send Tab - Manual Reminder */}
          <TabsContent value="send" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Invoice Selection */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                      <MessageSquare className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle>Select Invoices</CardTitle>
                      <CardDescription>
                        Choose which invoices to include in the reminder
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={selectedCustomerId} onValueChange={handleCustomerChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {invoicesLoading && selectedCustomerId && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}

                  {selectedCustomer && !invoicesLoading && pendingInvoices.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Checkbox
                          id="select-all"
                          checked={selectedInvoiceIds.length === pendingInvoices.length && pendingInvoices.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                        <label
                          htmlFor="select-all"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Select All ({pendingInvoices.length} invoices)
                        </label>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {pendingInvoices.map((invoice) => (
                          <div
                            key={invoice.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                id={invoice.id}
                                checked={selectedInvoiceIds.includes(invoice.id)}
                                onCheckedChange={(checked) =>
                                  handleInvoiceToggle(invoice.id, checked as boolean)
                                }
                              />
                              <div>
                                <p className="font-medium text-sm">{invoice.invoice_number}</p>
                                <p className="text-xs text-muted-foreground">
                                  Due: {formatDateStr(invoice.due_date)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {formatCurrency(Number(invoice.amount))}
                              </span>
                              <StatusBadge status={invoice.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCustomer && !invoicesLoading && pendingInvoices.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No pending invoices for this customer.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Message Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Message Preview</CardTitle>
                  <CardDescription>
                    Review the reminder message before sending
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={reminderMessage}
                    readOnly
                    className="min-h-[200px] resize-none font-mono text-sm"
                    placeholder="Select a customer and invoices to generate the reminder message..."
                  />

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={copyToClipboard}
                      disabled={!reminderMessage}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copied ? 'Copied!' : 'Copy Message'}
                    </Button>
                    <Button
                      className="flex-1 gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-primary-foreground"
                      onClick={openWhatsApp}
                      disabled={!reminderMessage}
                    >
                      <Send className="h-4 w-4" />
                      Send WhatsApp
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Reminder History
                </CardTitle>
                <CardDescription>
                  View all sent reminders and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : reminderHistory.length > 0 ? (
                  <div className="space-y-3">
                    {reminderHistory.map((reminder) => (
                      <div
                        key={reminder.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {getChannelIcon(reminder.channel)}
                          <div>
                            <p className="font-medium">
                              {reminder.customer?.name || 'Unknown Customer'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {reminder.reminder_type === 'pre_due' && 'Pre-due reminder'}
                              {reminder.reminder_type === 'overdue' && 'Overdue reminder'}
                              {reminder.reminder_type === 'manual' && 'Manual reminder'}
                              {' • '}
                              {formatDistanceToNow(new Date(reminder.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(reminder.total_amount)}</p>
                            <p className="text-xs text-muted-foreground">
                              {reminder.invoices_included?.length || 1} invoice{(reminder.invoices_included?.length || 1) > 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(reminder.status)}
                            <span className="text-sm capitalize">{reminder.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <h3 className="mt-4 font-semibold">No reminders sent yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your reminder history will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
