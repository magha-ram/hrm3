import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useTeamStats } from '@/hooks/useMyTeam';
import { Users, Clock, Calendar, UserMinus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function ManagerDashboardStats() {
  const { data: stats, isLoading } = useTeamStats();

  const statItems = [
    { 
      label: 'Team Size', 
      value: stats?.teamSize ?? 0, 
      icon: Users, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    { 
      label: 'Pending Approvals', 
      value: stats?.pendingApprovals ?? 0, 
      icon: Clock, 
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      highlight: (stats?.pendingApprovals ?? 0) > 0
    },
    { 
      label: 'Out Today', 
      value: stats?.outToday ?? 0, 
      icon: Calendar, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // If no team members, show a message
  if (!stats || stats.teamSize === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Team</h2>
        <Link to="/app/my-team">
          <Button variant="ghost" size="sm">View All</Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statItems.map((stat) => (
          <Card key={stat.label} className={stat.highlight ? 'border-amber-500/50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{stat.value}</span>
                {stat.highlight && (
                  <Badge variant="secondary" className="text-amber-600 bg-amber-100">
                    Needs attention
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Who's Out Today */}
      {stats.outToday > 0 && (
        <Card className="border-muted bg-muted/30">
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <UserMinus className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">Out Today:</span>{' '}
                {stats.onLeaveToday.join(', ')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
