import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAddCustomer } from '@/hooks/useSupabaseData';

export default function AddCustomer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const addCustomerMutation = useAddCustomer();
  
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.contact.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addCustomerMutation.mutateAsync({
        name: formData.name.trim(),
        contact: formData.contact.trim(),
        address: formData.address.trim() || undefined,
      });

      toast({
        title: 'Customer Added',
        description: `${formData.name} has been added successfully.`,
      });

      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add customer. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <Button
          variant="ghost"
          className="gap-2 -ml-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <UserPlus className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle>Add New Customer</CardTitle>
                <CardDescription>
                  Enter customer details to start tracking their invoices
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Customer Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Mama Njeri Groceries"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">
                  Contact Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contact"
                  placeholder="e.g., +254 712 345 678"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Textarea
                  id="address"
                  placeholder="e.g., Kikuyu Road, Nairobi"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={addCustomerMutation.isPending}>
                  {addCustomerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Customer'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
