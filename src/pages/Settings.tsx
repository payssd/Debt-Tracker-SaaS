import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import {
  useReminderSettings,
  useUpdateReminderSettings,
} from '@/hooks/useReminders';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Bell,
  Shield,
  Loader2,
  Save,
  Mail,
  Phone,
  MessageSquare,
  Key,
  Building2,
} from 'lucide-react';

export default function Settings() {
  const { user, updatePassword } = useAuth();
  const { data: reminderSettings, isLoading: settingsLoading } = useReminderSettings();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateSettingsMutation = useUpdateReminderSettings();
  const updateProfileMutation = useUpdateProfile();
  const { toast } = useToast();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.user_metadata?.name || '',
    email: user?.email || '',
  });

  // Company info form state
  const [companyForm, setCompanyForm] = useState({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_address: '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Reminder settings form state
  const [reminderForm, setReminderForm] = useState({
    auto_reminders_enabled: true,
    days_before_due: 3,
    days_after_overdue: 1,
    repeat_interval_days: 7,
    max_reminders_per_invoice: 5,
    whatsapp_enabled: true,
    email_enabled: false,
    sms_enabled: false,
    whatsapp_api_key: '',
    whatsapp_phone_number_id: '',
    email_api_key: '',
    email_from_address: '',
    sms_api_key: '',
    sms_from_number: '',
  });

  // Update forms when data loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.user_metadata?.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setCompanyForm({
        company_name: profile.company_name || '',
        company_email: profile.company_email || '',
        company_phone: profile.company_phone || '',
        company_address: profile.company_address || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (reminderSettings) {
      setReminderForm({
        auto_reminders_enabled: reminderSettings.auto_reminders_enabled,
        days_before_due: reminderSettings.days_before_due,
        days_after_overdue: reminderSettings.days_after_overdue,
        repeat_interval_days: reminderSettings.repeat_interval_days,
        max_reminders_per_invoice: reminderSettings.max_reminders_per_invoice,
        whatsapp_enabled: reminderSettings.whatsapp_enabled,
        email_enabled: reminderSettings.email_enabled,
        sms_enabled: reminderSettings.sms_enabled,
        whatsapp_api_key: reminderSettings.whatsapp_api_key || '',
        whatsapp_phone_number_id: reminderSettings.whatsapp_phone_number_id || '',
        email_api_key: reminderSettings.email_api_key || '',
        email_from_address: reminderSettings.email_from_address || '',
        sms_api_key: reminderSettings.sms_api_key || '',
        sms_from_number: reminderSettings.sms_from_number || '',
      });
    }
  }, [reminderSettings]);

  const handlePasswordUpdate = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await updatePassword(passwordForm.newPassword);
      if (error) throw error;

      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully.',
      });
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update password.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSaveReminderSettings = async () => {
    try {
      await updateSettingsMutation.mutateAsync(reminderForm);
      toast({
        title: 'Settings saved',
        description: 'Your reminder settings have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync({ name: profileForm.name });
      toast({
        title: 'Profile saved',
        description: 'Your profile information has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save profile information.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveCompanyInfo = async () => {
    try {
      await updateProfileMutation.mutateAsync(companyForm);
      toast({
        title: 'Company info saved',
        description: 'Your business information has been updated and will appear on invoices.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save company information.',
        variant: 'destructive',
      });
    }
  };

  if (settingsLoading || profileLoading) {
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your account and application preferences
          </p>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="business" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Business</span>
            </TabsTrigger>
            <TabsTrigger value="reminders" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Reminders</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Your account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Account Created</Label>
                  <p className="text-sm text-muted-foreground">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Unknown'}
                  </p>
                </div>

                <Separator />

                <Button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Tab */}
          <TabsContent value="business" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Information
                </CardTitle>
                <CardDescription>
                  This information will appear on your invoices and statements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company/Business Name *</Label>
                    <Input
                      id="company_name"
                      value={companyForm.company_name}
                      onChange={(e) =>
                        setCompanyForm((prev) => ({ ...prev, company_name: e.target.value }))
                      }
                      placeholder="Your Business Name"
                    />
                    <p className="text-xs text-muted-foreground">
                      Displayed on all invoices
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_email">Business Email</Label>
                    <Input
                      id="company_email"
                      type="email"
                      value={companyForm.company_email}
                      onChange={(e) =>
                        setCompanyForm((prev) => ({ ...prev, company_email: e.target.value }))
                      }
                      placeholder="business@example.com"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company_phone">Business Phone</Label>
                    <Input
                      id="company_phone"
                      type="tel"
                      value={companyForm.company_phone}
                      onChange={(e) =>
                        setCompanyForm((prev) => ({ ...prev, company_phone: e.target.value }))
                      }
                      placeholder="+254 748 188 128"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_address">Business Address</Label>
                    <Input
                      id="company_address"
                      value={companyForm.company_address}
                      onChange={(e) =>
                        setCompanyForm((prev) => ({ ...prev, company_address: e.target.value }))
                      }
                      placeholder="123 Main St, Nairobi"
                    />
                  </div>
                </div>

                <Separator />

                <Button
                  onClick={handleSaveCompanyInfo}
                  disabled={updateProfileMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Business Info
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reminders Tab */}
          <TabsContent value="reminders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Automatic Reminders
                </CardTitle>
                <CardDescription>
                  Configure when and how reminders are sent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Automatic Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically send reminders for overdue and upcoming invoices
                    </p>
                  </div>
                  <Switch
                    checked={reminderForm.auto_reminders_enabled}
                    onCheckedChange={(checked) =>
                      setReminderForm((prev) => ({ ...prev, auto_reminders_enabled: checked }))
                    }
                  />
                </div>

                <Separator />

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
                        value={reminderForm.days_before_due}
                        onChange={(e) =>
                          setReminderForm((prev) => ({
                            ...prev,
                            days_before_due: parseInt(e.target.value) || 3,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Days after overdue</Label>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={reminderForm.days_after_overdue}
                        onChange={(e) =>
                          setReminderForm((prev) => ({
                            ...prev,
                            days_after_overdue: parseInt(e.target.value) || 1,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Repeat interval (days)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={reminderForm.repeat_interval_days}
                        onChange={(e) =>
                          setReminderForm((prev) => ({
                            ...prev,
                            repeat_interval_days: parseInt(e.target.value) || 7,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max reminders per invoice</Label>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={reminderForm.max_reminders_per_invoice}
                        onChange={(e) =>
                          setReminderForm((prev) => ({
                            ...prev,
                            max_reminders_per_invoice: parseInt(e.target.value) || 5,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

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
                        checked={reminderForm.whatsapp_enabled}
                        onCheckedChange={(checked) =>
                          setReminderForm((prev) => ({ ...prev, whatsapp_enabled: checked }))
                        }
                      />
                    </div>
                    {reminderForm.whatsapp_enabled && (
                      <div className="grid gap-3 pt-2">
                        <div className="space-y-2">
                          <Label className="text-sm">Access Token</Label>
                          <Input
                            type="password"
                            placeholder="Your WhatsApp Business API token"
                            value={reminderForm.whatsapp_api_key}
                            onChange={(e) =>
                              setReminderForm((prev) => ({
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
                            value={reminderForm.whatsapp_phone_number_id}
                            onChange={(e) =>
                              setReminderForm((prev) => ({
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
                        checked={reminderForm.email_enabled}
                        onCheckedChange={(checked) =>
                          setReminderForm((prev) => ({ ...prev, email_enabled: checked }))
                        }
                      />
                    </div>
                    {reminderForm.email_enabled && (
                      <div className="grid gap-3 pt-2">
                        <div className="space-y-2">
                          <Label className="text-sm">API Key</Label>
                          <Input
                            type="password"
                            placeholder="Your Resend API key"
                            value={reminderForm.email_api_key}
                            onChange={(e) =>
                              setReminderForm((prev) => ({
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
                            value={reminderForm.email_from_address}
                            onChange={(e) =>
                              setReminderForm((prev) => ({
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
                        checked={reminderForm.sms_enabled}
                        onCheckedChange={(checked) =>
                          setReminderForm((prev) => ({ ...prev, sms_enabled: checked }))
                        }
                      />
                    </div>
                    {reminderForm.sms_enabled && (
                      <div className="grid gap-3 pt-2">
                        <div className="space-y-2">
                          <Label className="text-sm">Account SID:Auth Token</Label>
                          <Input
                            type="password"
                            placeholder="ACCOUNT_SID:AUTH_TOKEN"
                            value={reminderForm.sms_api_key}
                            onChange={(e) =>
                              setReminderForm((prev) => ({
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
                            value={reminderForm.sms_from_number}
                            onChange={(e) =>
                              setReminderForm((prev) => ({
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
                  className="w-full gap-2"
                  onClick={handleSaveReminderSettings}
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Reminder Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your account password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                      }
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                      }
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
                <Button
                  onClick={handlePasswordUpdate}
                  disabled={isUpdatingPassword || !passwordForm.newPassword}
                  className="gap-2"
                >
                  {isUpdatingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  Update Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Account Security
                </CardTitle>
                <CardDescription>
                  Security information for your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Last Sign In</Label>
                  <p className="text-sm text-muted-foreground">
                    {user?.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Unknown'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Email Verified</Label>
                  <p className="text-sm text-muted-foreground">
                    {user?.email_confirmed_at ? 'Yes' : 'No'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
