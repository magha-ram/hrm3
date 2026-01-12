import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Download, CheckCircle, Clock, Eye } from 'lucide-react';
import { useAlertHistory } from '@/hooks/useAlertRules';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function AlertHistoryTable() {
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: alerts, isLoading } = useAlertHistory({ limit: 100 });

  const filteredAlerts = alerts?.filter(alert => {
    const matchesModule = moduleFilter === 'all' || alert.module === moduleFilter;
    const matchesSearch = !searchQuery || 
      alert.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.module.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesModule && matchesSearch;
  });

  const modules = [...new Set(alerts?.map(a => a.module) || [])];

  const handleExport = () => {
    if (!filteredAlerts) return;
    
    const headers = ['Triggered At', 'Module', 'Metric', 'Value', 'Threshold', 'Severity', 'Status', 'Message'];
    const rows = filteredAlerts.map(a => [
      format(new Date(a.triggered_at), 'yyyy-MM-dd HH:mm:ss'),
      a.module,
      a.metric_name,
      a.metric_value,
      a.threshold,
      a.severity,
      a.is_resolved ? 'Resolved' : a.is_acknowledged ? 'Acknowledged' : 'Active',
      a.message || '',
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `alert-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Alert History</CardTitle>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search alerts..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {modules.map((module) => (
                <SelectItem key={module} value={module}>
                  {module}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No alerts found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAlerts?.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(alert.triggered_at), 'MMM d, HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{alert.module}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          alert.severity === 'critical' ? 'destructive' :
                          alert.severity === 'warning' ? 'secondary' : 'outline'
                        }
                      >
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {alert.message}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {alert.metric_value} / {alert.threshold}
                    </TableCell>
                    <TableCell>
                      {alert.is_resolved ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      ) : alert.is_acknowledged ? (
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          <Eye className="h-3 w-3 mr-1" />
                          Ack'd
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Active</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Summary */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredAlerts?.length || 0} of {alerts?.length || 0} alerts
        </div>
      </CardContent>
    </Card>
  );
}
