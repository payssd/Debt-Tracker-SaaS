import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCustomers, useAddInvoice } from '@/hooks/useSupabaseData';

export default function AddInvoice() {
  const navigate = useNavigate();
  const { data: customers = [], isLoading: customersLoading } = useCustomers();
  const addInvoiceMutation = useAddInvoice();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    customerId: '',
    invoiceNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    amount: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId || !formData.invoiceNumber || !formData.dueDate || !formData.amount) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addInvoiceMutation.mutateAsync({
        customer_id: formData.customerId,
        invoice_number: formData.invoiceNumber.trim(),
        issue_date: formData.issueDate,
        due_date: formData.dueDate,
        amount: parseFloat(formData.amount),
      });

      toast({
        title: 'Invoice Added',
        description: `Invoice ${formData.invoiceNumber} has been created.`,
      });

      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add invoice. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (customersLoading) {
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
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <Button variant="ghost" className="gap-2 -ml-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <FileText className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle>Create New Invoice</CardTitle>
                <CardDescription>Add a new invoice for tracking</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="customer">
                  Customer <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                >
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
                {customers.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No customers found. <a href="/customers/new" className="text-primary underline">Add a customer first</a>.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">
                  Invoice Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="invoiceNumber"
                  placeholder="e.g., INV-007"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">
                    Issue Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">
                    Due Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">
                  Amount (KES) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g., 25000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  min="0"
                  step="0.01"
                  required
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
                <Button type="submit" className="flex-1" disabled={addInvoiceMutation.isPending}>
                  {addInvoiceMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Invoice'
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
