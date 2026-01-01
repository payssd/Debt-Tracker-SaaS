-- =====================================================
-- PARTIAL PAYMENTS FEATURE
-- =====================================================

-- Create payments table to track individual payments against invoices
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'mobile_money', 'card', 'cheque', 'other')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add amount_paid column to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(12, 2) DEFAULT 0;

-- Update invoice status check constraint to include 'Partial'
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check 
  CHECK (status IN ('Pending', 'Partial', 'Paid', 'Overdue'));

-- Create index for faster payment lookups
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

-- Enable RLS on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for payments
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
CREATE POLICY "Users can insert own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payments" ON payments;
CREATE POLICY "Users can update own payments" ON payments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own payments" ON payments;
CREATE POLICY "Users can delete own payments" ON payments
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update invoice amount_paid and status after payment changes
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid DECIMAL(12, 2);
  v_invoice_amount DECIMAL(12, 2);
  v_due_date DATE;
  v_new_status TEXT;
BEGIN
  -- Get invoice details
  SELECT amount, due_date INTO v_invoice_amount, v_due_date
  FROM invoices
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  -- Calculate total paid for this invoice
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM payments
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  -- Determine new status
  IF v_total_paid >= v_invoice_amount THEN
    v_new_status := 'Paid';
  ELSIF v_total_paid > 0 THEN
    -- Check if overdue
    IF v_due_date < CURRENT_DATE THEN
      v_new_status := 'Overdue';
    ELSE
      v_new_status := 'Partial';
    END IF;
  ELSE
    -- No payments
    IF v_due_date < CURRENT_DATE THEN
      v_new_status := 'Overdue';
    ELSE
      v_new_status := 'Pending';
    END IF;
  END IF;

  -- Update invoice
  UPDATE invoices
  SET 
    amount_paid = v_total_paid,
    status = v_new_status
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to auto-update invoice when payments change
DROP TRIGGER IF EXISTS trigger_payment_insert ON payments;
CREATE TRIGGER trigger_payment_insert
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_payment_status();

DROP TRIGGER IF EXISTS trigger_payment_update ON payments;
CREATE TRIGGER trigger_payment_update
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_payment_status();

DROP TRIGGER IF EXISTS trigger_payment_delete ON payments;
CREATE TRIGGER trigger_payment_delete
  AFTER DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_payment_status();

-- Function to recalculate customer outstanding based on invoice balances
CREATE OR REPLACE FUNCTION update_customer_outstanding_with_payments(p_customer_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE customers
  SET outstanding_total = (
    SELECT COALESCE(SUM(amount - COALESCE(amount_paid, 0)), 0)
    FROM invoices
    WHERE customer_id = p_customer_id
    AND status != 'Paid'
  )
  WHERE id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing invoices to have amount_paid = 0 for non-paid, and amount_paid = amount for paid
UPDATE invoices SET amount_paid = 0 WHERE status IN ('Pending', 'Overdue') AND amount_paid IS NULL;
UPDATE invoices SET amount_paid = amount WHERE status = 'Paid' AND (amount_paid IS NULL OR amount_paid = 0);

-- Add updated_at trigger for payments
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
