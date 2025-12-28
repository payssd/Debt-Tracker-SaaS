import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useFunnelTemplates,
  useFunnelMetrics,
  useUserFunnelStatus,
  useTrialDay,
  useUpdateFunnelTemplate,
  useToggleFunnelTemplate,
  useTriggerFunnel,
  FunnelTemplate,
} from '@/hooks/useTrialFunnel';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Play,
  Mail,
  MessageSquare,
  Phone,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  BarChart3,
  Zap,
} from 'lucide-react';

export default function Funnel() {
  const { data: templates, isLoading: templatesLoading } = useFunnelTemplates();
  const { data: metrics, isLoading: metricsLoading } = useFunnelMetrics();
  const { data: userStatus } = useUserFunnelStatus();
  const { data: trialDay } = useTrialDay();
  const updateTemplate = useUpdateFunnelTemplate();
  const toggleTemplate = useToggleFunnelTemplate();
  const triggerFunnel = useTriggerFunnel();
  const { toast } = useToast();

  const [editingTemplate, setEditingTemplate] = useState<FunnelTemplate | null>(null);
  const [editForm, setEditForm] = useState({
    whatsapp_template: '',
    email_subject: '',
    email_template: '',
    sms_template: '',
  });

  const handleEditTemplate = (template: FunnelTemplate) => {
    setEditingTemplate(template);
    setEditForm({
      whatsapp_template: template.whatsapp_template || '',
      email_subject: template.email_subject || '',
      email_template: template.email_template || '',
      sms_template: template.sms_template || '',
    });
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    try {
      await updateTemplate.mutateAsync({
        id: editingTemplate.id,
        ...editForm,
      });
      toast({ title: 'Template updated', description: 'Message template saved successfully.' });
      setEditingTemplate(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update template.', variant: 'destructive' });
    }
  };

  const handleToggleTemplate = async (id: string, currentStatus: boolean) => {
    try {
      await toggleTemplate.mutateAsync({ id, is_active: !currentStatus });
      toast({
        title: currentStatus ? 'Template disabled' : 'Template enabled',
        description: `Day ${templates?.find((t) => t.id === id)?.day_number} messages ${currentStatus ? 'disabled' : 'enabled'}.`,
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to toggle template.', variant: 'destructive' });
    }
  };

  const handleTriggerFunnel = async () => {
    try {
      const result = await triggerFunnel.mutateAsync();
      toast({
        title: 'Funnel processed',
        description: `Processed ${result?.results?.processed || 0} users.`,
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to trigger funnel.', variant: 'destructive' });
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'trial':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'conversion':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'recovery':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
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
        return null;
    }
  };

  if (templatesLoading || metricsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const trialTemplates = templates?.filter((t) => t.phase === 'trial') || [];
  const conversionTemplates = templates?.filter((t) => t.phase === 'conversion') || [];
  const recoveryTemplates = templates?.filter((t) => t.phase === 'recovery') || [];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Trial Funnel</h1>
            <p className="mt-1 text-muted-foreground">
              7-Day Free Trial + 7-Day Follow-Up Conversion Funnel
            </p>
          </div>
          <Button onClick={handleTriggerFunnel} disabled={triggerFunnel.isPending} className="gap-2">
            {triggerFunnel.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run Funnel Now
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Trial</CardTitle>
              <Clock className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{metrics?.inTrial || 0}</div>
              <p className="text-xs text-muted-foreground">Day 0-6</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Converted</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{metrics?.converted || 0}</div>
              <p className="text-xs text-muted-foreground">
                {metrics?.totalUsers
                  ? `${((metrics.converted / metrics.totalUsers) * 100).toFixed(1)}% rate`
                  : '0% rate'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Churned</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{metrics?.churned || 0}</div>
              <p className="text-xs text-muted-foreground">After Day 14</p>
            </CardContent>
          </Card>
        </div>

        {/* Your Trial Status (if applicable) */}
        {trialDay && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Your Trial Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Day</p>
                  <p className="text-2xl font-bold">Day {trialDay.currentDay}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phase</p>
                  <Badge className={getPhaseColor(trialDay.phase)}>{trialDay.phase}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={trialDay.status === 'active' ? 'default' : 'secondary'}>
                    {trialDay.status}
                  </Badge>
                </div>
                {trialDay.daysRemaining > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Days Remaining</p>
                    <p className="text-2xl font-bold text-green-500">{trialDay.daysRemaining}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Funnel Templates */}
        <Tabs defaultValue="trial" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trial" className="gap-2">
              <Clock className="h-4 w-4" />
              Trial (Day 0-6)
            </TabsTrigger>
            <TabsTrigger value="conversion" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Conversion (Day 7)
            </TabsTrigger>
            <TabsTrigger value="recovery" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Recovery (Day 8-14)
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Your History
            </TabsTrigger>
          </TabsList>

          {/* Trial Phase */}
          <TabsContent value="trial">
            <Card>
              <CardHeader>
                <CardTitle>Phase 1: Free Trial (Day 0-6)</CardTitle>
                <CardDescription>
                  Users have FULL ACCESS during these 7 days. Build engagement and demonstrate value.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Channels</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trialTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">Day {template.day_number}</TableCell>
                        <TableCell>{template.purpose}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {template.whatsapp_enabled && getChannelIcon('whatsapp')}
                            {template.email_enabled && getChannelIcon('email')}
                            {template.sms_enabled && getChannelIcon('sms')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={template.is_active}
                            onCheckedChange={() => handleToggleTemplate(template.id, template.is_active)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conversion Phase */}
          <TabsContent value="conversion">
            <Card>
              <CardHeader>
                <CardTitle>Phase 2: Trial End + Conversion (Day 7)</CardTitle>
                <CardDescription>
                  Access restricted unless they subscribe. Strong upgrade prompt.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Channels</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversionTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">Day {template.day_number}</TableCell>
                        <TableCell>{template.purpose}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {template.whatsapp_enabled && getChannelIcon('whatsapp')}
                            {template.email_enabled && getChannelIcon('email')}
                            {template.sms_enabled && getChannelIcon('sms')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={template.is_active}
                            onCheckedChange={() => handleToggleTemplate(template.id, template.is_active)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recovery Phase */}
          <TabsContent value="recovery">
            <Card>
              <CardHeader>
                <CardTitle>Phase 3: Post-Trial Recovery (Day 8-14)</CardTitle>
                <CardDescription>
                  No trial access, only reminders to upgrade. Increasing urgency.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Channels</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recoveryTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">Day {template.day_number}</TableCell>
                        <TableCell>{template.purpose}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {template.whatsapp_enabled && getChannelIcon('whatsapp')}
                            {template.email_enabled && getChannelIcon('email')}
                            {template.sms_enabled && getChannelIcon('sms')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={template.is_active}
                            onCheckedChange={() => handleToggleTemplate(template.id, template.is_active)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User History */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Your Funnel History</CardTitle>
                <CardDescription>Messages you've received during your trial journey</CardDescription>
              </CardHeader>
              <CardContent>
                {userStatus && userStatus.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Day</TableHead>
                        <TableHead>Phase</TableHead>
                        <TableHead>WhatsApp</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>SMS</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userStatus.map((status) => (
                        <TableRow key={status.id}>
                          <TableCell className="font-medium">Day {status.day_number}</TableCell>
                          <TableCell>
                            <Badge className={getPhaseColor(status.phase)}>{status.phase}</Badge>
                          </TableCell>
                          <TableCell>
                            {status.whatsapp_sent ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>
                            {status.email_sent ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>
                            {status.sms_sent ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(status.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No funnel messages received yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Template Dialog */}
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Edit Day {editingTemplate?.day_number} - {editingTemplate?.purpose}
              </DialogTitle>
              <DialogDescription>
                Customize the message templates for this funnel step. Use {'{{name}}'}, {'{{app_url}}'},{' '}
                {'{{subscribe_url}}'}, etc. as placeholders.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* WhatsApp Template */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-[#25D366]" />
                  WhatsApp Message
                </Label>
                <Textarea
                  value={editForm.whatsapp_template}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, whatsapp_template: e.target.value }))
                  }
                  rows={6}
                  placeholder="WhatsApp message template..."
                />
              </div>

              {/* Email Template */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  Email Subject
                </Label>
                <Input
                  value={editForm.email_subject}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, email_subject: e.target.value }))
                  }
                  placeholder="Email subject line..."
                />
              </div>

              <div className="space-y-2">
                <Label>Email Body</Label>
                <Textarea
                  value={editForm.email_template}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, email_template: e.target.value }))
                  }
                  rows={10}
                  placeholder="Email body template..."
                />
              </div>

              {/* SMS Template */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-purple-500" />
                  SMS Message
                </Label>
                <Textarea
                  value={editForm.sms_template}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, sms_template: e.target.value }))
                  }
                  rows={3}
                  placeholder="SMS message (keep under 160 chars)..."
                />
                <p className="text-xs text-muted-foreground">
                  {editForm.sms_template.length}/160 characters
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate} disabled={updateTemplate.isPending}>
                  {updateTemplate.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
