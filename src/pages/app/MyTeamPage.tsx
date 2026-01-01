import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyTeam, useTeamStats } from '@/hooks/useMyTeam';
import { TeamAbsenceCalendar } from '@/components/team/TeamAbsenceCalendar';
import { Users, Calendar, UserCheck, Clock, AlertCircle } from 'lucide-react';

export default function MyTeamPage() {
  const { data: team, isLoading: teamLoading } = useMyTeam();
  const { data: stats, isLoading: statsLoading } = useTeamStats();

  const statItems = [
    { 
      label: 'Team Size', 
      value: stats?.teamSize ?? 0, 
      icon: Users, 
      color: 'text-blue-500' 
    },
    { 
      label: 'Pending Approvals', 
      value: stats?.pendingApprovals ?? 0, 
      icon: Clock, 
      color: 'text-amber-500' 
    },
    { 
      label: 'Out Today', 
      value: stats?.outToday ?? 0, 
      icon: Calendar, 
      color: 'text-green-500' 
    },
  ];

  if (teamLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!team || team.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">My Team</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Direct Reports</h3>
            <p className="text-muted-foreground">
              You don't have any direct reports assigned to you.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Team</h1>
        <p className="text-muted-foreground">Manage your direct reports</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statItems.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Who's Out Today Banner */}
      {stats && stats.outToday > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Out Today:</span>
              <span>{stats.onLeaveToday.join(', ')}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Team List and Calendar */}
      <Tabs defaultValue="team">
        <TabsList>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Team Members
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            Absence Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Direct Reports</CardTitle>
              <CardDescription>Your team members and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {team.map((member) => (
                  <div key={member.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>
                          {member.first_name[0]}{member.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {member.first_name} {member.last_name}
                          </span>
                          {member.is_on_leave && (
                            <Badge variant="secondary" className="text-xs">
                              On Leave
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {member.job_title || 'No title'} 
                          {member.department?.name && ` • ${member.department.name}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.pending_leave_count > 0 && (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {member.pending_leave_count} leave
                          </Badge>
                        )}
                        {member.pending_expense_count > 0 && (
                          <Badge variant="outline" className="gap-1">
                            {member.pending_expense_count} expense
                          </Badge>
                        )}
                        <Badge 
                          variant={member.employment_status === 'active' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {member.employment_status === 'active' ? (
                            <><UserCheck className="h-3 w-3 mr-1" /> Active</>
                          ) : (
                            member.employment_status
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <TeamAbsenceCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
}
