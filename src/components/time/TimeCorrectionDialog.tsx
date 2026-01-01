import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Edit } from 'lucide-react';

interface TimeCorrectionDialogProps {
  trigger?: React.ReactNode;
}

export function TimeCorrectionDialog({ trigger }: TimeCorrectionDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { companyId, employeeId } = useTenant();
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [clockIn, setClockIn] = useState('09:00');
  const [clockOut, setClockOut] = useState('17:00');
  const [reason, setReason] = useState('');

  const submitCorrection = useMutation({
    mutationFn: async () => {
      if (!companyId || !employeeId) throw new Error('Missing context');
      if (!reason.trim()) throw new Error('Reason is required for time corrections');

      const clockInTime = new Date(`${date}T${clockIn}:00`);
      const clockOutTime = new Date(`${date}T${clockOut}:00`);
      
      if (clockOutTime <= clockInTime) {
        throw new Error('Clock out must be after clock in');
      }

      const totalMinutes = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60);
      const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

      // Check if entry exists for this date
      const { data: existing } = await supabase
        .from('time_entries')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('date', date)
        .maybeSingle();

      if (existing) {
        // Update existing entry
        const { error } = await supabase
          .from('time_entries')
          .update({
            clock_in: clockInTime.toISOString(),
            clock_out: clockOutTime.toISOString(),
            total_hours: totalHours,
            notes: `[CORRECTION] ${reason}`,
            is_approved: false, // Reset approval for corrections
            metadata: { is_correction: true, correction_reason: reason },
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new entry
        const { error } = await supabase
          .from('time_entries')
          .insert({
            company_id: companyId,
            employee_id: employeeId,
            date,
            clock_in: clockInTime.toISOString(),
            clock_out: clockOutTime.toISOString(),
            total_hours: totalHours,
            notes: `[CORRECTION] ${reason}`,
            is_approved: false,
            metadata: { is_correction: true, correction_reason: reason },
          });

        if (error) throw error;
      }

      // Log the correction in audit
      await supabase.from('audit_logs').insert({
        company_id: companyId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        table_name: 'time_entries',
        action: existing ? 'update' : 'create',
        new_values: { date, clock_in: clockIn, clock_out: clockOut },
        metadata: { action_type: 'time_correction', reason },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast.success('Time correction submitted for approval');
      setOpen(false);
      setReason('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit correction');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Request Time Correction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Time Correction</DialogTitle>
          <DialogDescription>
            Submit a time correction for approval by your manager
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clockIn">Clock In</Label>
              <Input
                id="clockIn"
                type="time"
                value={clockIn}
                onChange={(e) => setClockIn(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clockOut">Clock Out</Label>
              <Input
                id="clockOut"
                type="time"
                value={clockOut}
                onChange={(e) => setClockOut(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Correction *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this correction is needed..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => submitCorrection.mutate()}
            disabled={submitCorrection.isPending || !reason.trim()}
          >
            {submitCorrection.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit Correction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
