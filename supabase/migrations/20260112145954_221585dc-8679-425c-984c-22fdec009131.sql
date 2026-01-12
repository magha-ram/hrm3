-- Add missing leave_balances table
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  allocated_days NUMERIC(5,2) DEFAULT 0,
  used_days NUMERIC(5,2) DEFAULT 0,
  pending_days NUMERIC(5,2) DEFAULT 0,
  carried_over_days NUMERIC(5,2) DEFAULT 0,
  adjustment_days NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, employee_id, leave_type_id, year)
);

-- Add notification_events table
CREATE TABLE IF NOT EXISTS public.notification_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  title TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

-- Leave balances policies
CREATE POLICY "Users can view their company leave balances" ON public.leave_balances
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()));

CREATE POLICY "HR can manage leave balances" ON public.leave_balances
  FOR ALL USING (company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()));

-- Notification events policies
CREATE POLICY "Users can view their notifications" ON public.notification_events
  FOR SELECT USING (user_id = auth.uid() OR employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "System can create notifications" ON public.notification_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their notifications" ON public.notification_events
  FOR UPDATE USING (user_id = auth.uid());

-- Create leave-related RPC functions
CREATE OR REPLACE FUNCTION public.check_leave_balance(
  p_company_id UUID,
  p_employee_id UUID,
  p_leave_type_id UUID,
  p_days_requested NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_balance RECORD;
  v_available NUMERIC;
BEGIN
  SELECT * INTO v_balance FROM leave_balances
  WHERE company_id = p_company_id
    AND employee_id = p_employee_id
    AND leave_type_id = p_leave_type_id
    AND year = EXTRACT(YEAR FROM CURRENT_DATE);
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object('has_sufficient_balance', false, 'available_days', 0, 'message', 'No leave balance found');
  END IF;
  
  v_available := COALESCE(v_balance.allocated_days, 0) + COALESCE(v_balance.carried_over_days, 0) 
                 + COALESCE(v_balance.adjustment_days, 0) - COALESCE(v_balance.used_days, 0) - COALESCE(v_balance.pending_days, 0);
  
  RETURN jsonb_build_object(
    'has_sufficient_balance', v_available >= p_days_requested,
    'available_days', v_available,
    'requested_days', p_days_requested
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.accrue_leave_balances(
  p_company_id UUID,
  p_year INTEGER DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_year INTEGER := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE));
  v_count INTEGER := 0;
BEGIN
  -- Create leave balances for all employees and leave types
  INSERT INTO leave_balances (company_id, employee_id, leave_type_id, year, allocated_days)
  SELECT e.company_id, e.id, lt.id, v_year, COALESCE(lt.default_days, 0)
  FROM employees e
  CROSS JOIN leave_types lt
  WHERE e.company_id = p_company_id
    AND lt.company_id = p_company_id
    AND lt.is_active = true
    AND e.employment_status = 'active'
  ON CONFLICT (company_id, employee_id, leave_type_id, year) DO NOTHING;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN jsonb_build_object('success', true, 'balances_created', v_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.adjust_leave_balance(
  p_company_id UUID,
  p_employee_id UUID,
  p_leave_type_id UUID,
  p_adjustment_days NUMERIC,
  p_reason TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
  UPDATE leave_balances
  SET adjustment_days = COALESCE(adjustment_days, 0) + p_adjustment_days,
      updated_at = now()
  WHERE company_id = p_company_id
    AND employee_id = p_employee_id
    AND leave_type_id = p_leave_type_id
    AND year = v_year;
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Leave balance not found');
  END IF;
  
  RETURN jsonb_build_object('success', true, 'adjustment_days', p_adjustment_days);
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_leave_balances_updated_at
  BEFORE UPDATE ON public.leave_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_events_updated_at
  BEFORE UPDATE ON public.notification_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();