-- Add missing columns to email_logs
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add missing columns to expense_categories
ALTER TABLE public.expense_categories ADD COLUMN IF NOT EXISTS budget_limit numeric(12,2);

-- Add missing columns to expenses
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.expense_categories(id);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS expense_date date;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS reimbursed_at timestamptz;

-- Add trigger for email_logs updated_at
CREATE TRIGGER update_email_logs_updated_at
    BEFORE UPDATE ON public.email_logs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();