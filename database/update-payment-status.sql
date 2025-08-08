-- Update payment status enum to include "unpaid" status
-- This migration adds "unpaid" status for invoices that are created but not yet paid

-- First, let's see current payment statuses
SELECT DISTINCT status FROM payments;

-- Update existing payments that might need the new status structure
-- Change any auto-generated payments that should be invoices to "unpaid"
UPDATE payments 
SET status = 'unpaid' 
WHERE status = 'pending' 
AND payment_proof IS NULL 
AND payment_method = 'bank_transfer'
AND notes LIKE '%Auto-generated invoice%';

-- Optional: Add a comment column if not exists (for better tracking)
-- ALTER TABLE payments ADD COLUMN invoice_type TEXT DEFAULT 'manual';

-- Update payment method for invoices waiting for user selection
UPDATE payments 
SET payment_method = 'pending_selection' 
WHERE status = 'unpaid' 
AND payment_proof IS NULL;

-- Show updated status distribution
SELECT status, COUNT(*) as count FROM payments GROUP BY status;
