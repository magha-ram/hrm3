import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Trash2, Bell, BellOff } from 'lucide-react';
import { 
  useAlertRules, 
  useUpdateAlertRule, 
  useDeleteAlertRule,
  type AlertRule 
} from '@/hooks/useAlertRules';
import { AlertRuleFormDialog } from './AlertRuleFormDialog';
import { format } from 'date-fns';

const conditionLabels: Record<string, string> = {
  greater_than: '>',
  less_than: '<',
  equals: '=',
  greater_than_or_equal: '>=',
  less_than_or_equal: '<=',
};

export function AlertRulesManager() {
  const { data: rules, isLoading } = useAlertRules();
  const updateRule = useUpdateAlertRule();
  const deleteRule = useDeleteAlertRule();
  
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleToggleActive = (rule: AlertRule) => {
    updateRule.mutate({
      id: rule.id,
      updates: { is_active: !rule.is_active },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Alert Rules</CardTitle>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Active</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Channels</TableHead>
                  <TableHead>Last Triggered</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No alert rules configured. Create one to start monitoring.
                    </TableCell>
                  </TableRow>
                ) : (
                  rules?.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() => handleToggleActive(rule)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{rule.name}</span>
                          {rule.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {rule.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rule.module}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {rule.metric_name} {conditionLabels[rule.condition]} {rule.threshold}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            rule.severity === 'critical' ? 'destructive' :
                            rule.severity === 'warning' ? 'secondary' : 'outline'
                          }
                        >
                          {rule.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {rule.notification_channels.includes('in_app') && (
                            <Bell className="h-4 w-4 text-muted-foreground" />
                          )}
                          {rule.notification_channels.includes('email') && (
                            <span className="text-xs">📧</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {rule.last_triggered_at 
                          ? format(new Date(rule.last_triggered_at), 'MMM d, HH:mm')
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingRule(rule)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => deleteRule.mutate(rule.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Create/Edit Dialog */}
      <AlertRuleFormDialog
        open={isCreateOpen || !!editingRule}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingRule(null);
        }}
        rule={editingRule}
      />
    </>
  );
}
