-- Add is_test_company flag to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_test_company boolean DEFAULT false;

-- Create index for filtering test companies
CREATE INDEX IF NOT EXISTS idx_companies_is_test_company ON public.companies(is_test_company) WHERE is_test_company = true;

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_created_at ON public.employees(created_at);
CREATE INDEX IF NOT EXISTS idx_payroll_entries_created_at ON public.payroll_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_leave_requests_created_at ON public.leave_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_attendance_summaries_employee_id ON public.attendance_summaries(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_history_employee_id ON public.salary_history(employee_id);

-- Create function to clean up test companies
CREATE OR REPLACE FUNCTION public.delete_test_company(_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    _is_test boolean;
BEGIN
    -- Verify company is marked as test
    SELECT is_test_company INTO _is_test FROM companies WHERE id = _company_id;
    
    IF NOT COALESCE(_is_test, false) THEN
        RAISE EXCEPTION 'Cannot delete non-test company';
    END IF;
    
    -- Delete in order respecting foreign keys
    DELETE FROM payroll_entries WHERE payroll_run_id IN (SELECT id FROM payroll_runs WHERE company_id = _company_id);
    DELETE FROM payroll_runs WHERE company_id = _company_id;
    DELETE FROM attendance_summaries WHERE company_id = _company_id;
    DELETE FROM time_entries WHERE company_id = _company_id;
    DELETE FROM leave_requests WHERE company_id = _company_id;
    DELETE FROM salary_history WHERE company_id = _company_id;
    DELETE FROM employment_history WHERE company_id = _company_id;
    DELETE FROM employee_documents WHERE company_id = _company_id;
    DELETE FROM employee_education WHERE company_id = _company_id;
    DELETE FROM employee_experience WHERE company_id = _company_id;
    DELETE FROM employee_shift_assignments WHERE company_id = _company_id;
    DELETE FROM performance_reviews WHERE company_id = _company_id;
    DELETE FROM expenses WHERE company_id = _company_id;
    DELETE FROM employees WHERE company_id = _company_id;
    DELETE FROM departments WHERE company_id = _company_id;
    DELETE FROM shifts WHERE company_id = _company_id;
    DELETE FROM leave_types WHERE company_id = _company_id;
    DELETE FROM document_types WHERE company_id = _company_id;
    DELETE FROM expense_categories WHERE company_id = _company_id;
    DELETE FROM candidates WHERE company_id = _company_id;
    DELETE FROM jobs WHERE company_id = _company_id;
    DELETE FROM company_email_settings WHERE company_id = _company_id;
    DELETE FROM company_email_templates WHERE company_id = _company_id;
    DELETE FROM company_settings WHERE company_id = _company_id;
    DELETE FROM company_domains WHERE company_id = _company_id;
    DELETE FROM company_subscriptions WHERE company_id = _company_id;
    DELETE FROM role_permissions WHERE company_id = _company_id;
    DELETE FROM user_permissions WHERE company_id = _company_id;
    DELETE FROM company_roles WHERE company_id = _company_id;
    DELETE FROM company_users WHERE company_id = _company_id;
    DELETE FROM companies WHERE id = _company_id;
    
    RETURN true;
END;
$function$;