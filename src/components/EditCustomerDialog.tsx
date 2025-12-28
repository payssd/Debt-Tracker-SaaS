import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUpdateCustomer, Customer } from '@/hooks/useSupabaseData';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EditCustomerDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCustomerDialog({ customer, open, onOpenChange }: EditCustomerDialogProps) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const updateCustomer = useUpdateCustomer();
  const { toast } = useToast();

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setContact(customer.contact);
      setAddress(customer.address || '');
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        name: name.trim(),
        contact: contact.trim(),
        address: address.trim() || undefined,
      });
      toast({
        title: 'Customer updated',
        description: `${name} has been updated successfully.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update customer. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact">Contact</Label>
              <Input
                id="contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateCustomer.isPending}>
              {updateCustomer.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
