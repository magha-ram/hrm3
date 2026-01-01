import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Briefcase, Users, ExternalLink, MoreHorizontal, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { WriteGate, RoleGate } from '@/components/PermissionGate';
import { ModuleGuard } from '@/components/ModuleGuard';
import { useJobs, useCandidates, usePipelineStats, useUpdateCandidateStatus, useUpdateJob } from '@/hooks/useRecruitment';
import { useUserRole } from '@/hooks/useUserRole';
import { JobFormDialog } from '@/components/recruitment/JobFormDialog';
import { CandidateStatusBadge } from '@/components/recruitment/CandidateStatusBadge';

export default function RecruitmentPage() {
  const { isHROrAbove } = useUserRole();
  const { data: jobs = [], isLoading: jobsLoading } = useJobs();
  const { data: candidates = [], isLoading: candidatesLoading } = useCandidates();
  const pipelineStats = usePipelineStats();
  const updateJob = useUpdateJob();
  const updateCandidateStatus = useUpdateCandidateStatus();

  const [activeTab, setActiveTab] = useState('jobs');
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);

  const openJobs = jobs.filter(j => j.status === 'open');
  const draftJobs = jobs.filter(j => j.status === 'draft');

  const handlePublishJob = (id: string) => {
    updateJob.mutate({ id, status: 'open', published_at: new Date().toISOString() });
  };

  const handleCloseJob = (id: string) => {
    updateJob.mutate({ id, status: 'closed' });
  };

  return (
    <ModuleGuard moduleId="recruitment">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Recruitment</h1>
            <p className="text-muted-foreground">Manage job postings and candidates</p>
          </div>
          <div className="flex items-center gap-2">
            {openJobs.length > 0 && (
              <Button
                variant="outline"
                onClick={() => window.open('/careers', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Careers Page
              </Button>
            )}
            <WriteGate>
              <RoleGate role="hr_manager">
                <Button onClick={() => { setEditingJob(null); setJobDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Post Job
                </Button>
              </RoleGate>
            </WriteGate>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Open Jobs</CardDescription>
              <CardTitle className="text-2xl">{openJobs.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Applied</CardDescription>
              <CardTitle className="text-2xl">{pipelineStats.applied}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Screening</CardDescription>
              <CardTitle className="text-2xl">{pipelineStats.screening}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Interviewing</CardDescription>
              <CardTitle className="text-2xl">{pipelineStats.interviewing}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Offered</CardDescription>
              <CardTitle className="text-2xl">{pipelineStats.offered}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Hired</CardDescription>
              <CardTitle className="text-2xl text-green-600">{pipelineStats.hired}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-2xl">{pipelineStats.total}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="jobs">Job Postings</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Job Postings</CardTitle>
                <CardDescription>Manage your open positions</CardDescription>
              </CardHeader>
              <CardContent>
                {jobsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No job postings yet. Create your first job posting to start hiring.</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Position</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Candidates</TableHead>
                          <TableHead>Posted</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jobs.map((job) => {
                          const jobCandidates = candidates.filter(c => c.job_id === job.id);
                          return (
                            <TableRow key={job.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{job.title}</p>
                                  <p className="text-xs text-muted-foreground">{job.employment_type.replace('_', ' ')}</p>
                                </div>
                              </TableCell>
                              <TableCell>{(job.department as any)?.name || '-'}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm">
                                  <MapPin className="h-3 w-3" />
                                  {job.is_remote ? 'Remote' : job.location || '-'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  job.status === 'open' ? 'default' :
                                  job.status === 'draft' ? 'secondary' :
                                  'outline'
                                }>
                                  {job.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{jobCandidates.length}</TableCell>
                              <TableCell>
                                {job.published_at ? format(new Date(job.published_at), 'MMM d, yyyy') : '-'}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { setEditingJob(job); setJobDialogOpen(true); }}>
                                      Edit
                                    </DropdownMenuItem>
                                    {job.status === 'draft' && (
                                      <DropdownMenuItem onClick={() => handlePublishJob(job.id)}>
                                        Publish
                                      </DropdownMenuItem>
                                    )}
                                    {job.status === 'open' && (
                                      <DropdownMenuItem onClick={() => handleCloseJob(job.id)}>
                                        Close Position
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="candidates" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>All Candidates</CardTitle>
                <CardDescription>View and manage all applicants</CardDescription>
              </CardHeader>
              <CardContent>
                {candidatesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : candidates.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No candidates found.</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Candidate</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Applied</TableHead>
                          <TableHead className="w-[120px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {candidates.map((candidate) => (
                          <TableRow key={candidate.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{candidate.first_name} {candidate.last_name}</p>
                                <p className="text-xs text-muted-foreground">{candidate.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>{(candidate.job as any)?.title || '-'}</TableCell>
                            <TableCell>
                              <CandidateStatusBadge status={candidate.status} />
                            </TableCell>
                            <TableCell>
                              {format(new Date(candidate.created_at), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              <WriteGate>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      Actions
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => updateCandidateStatus.mutate({ id: candidate.id, status: 'screening' })}>
                                      Move to Screening
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateCandidateStatus.mutate({ id: candidate.id, status: 'interviewing' })}>
                                      Schedule Interview
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateCandidateStatus.mutate({ id: candidate.id, status: 'offered' })}>
                                      Make Offer
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateCandidateStatus.mutate({ id: candidate.id, status: 'hired' })}>
                                      Mark Hired
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="text-destructive"
                                      onClick={() => updateCandidateStatus.mutate({ id: candidate.id, status: 'rejected' })}
                                    >
                                      Reject
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </WriteGate>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pipeline" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Hiring Pipeline</CardTitle>
                <CardDescription>Visual overview of candidates by stage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {[
                    { label: 'Applied', key: 'applied', color: 'bg-blue-500' },
                    { label: 'Screening', key: 'screening', color: 'bg-purple-500' },
                    { label: 'Interviewing', key: 'interviewing', color: 'bg-amber-500' },
                    { label: 'Offered', key: 'offered', color: 'bg-cyan-500' },
                    { label: 'Hired', key: 'hired', color: 'bg-green-500' },
                    { label: 'Rejected', key: 'rejected', color: 'bg-red-500' },
                    { label: 'Withdrawn', key: 'withdrawn', color: 'bg-gray-500' },
                  ].map((stage) => {
                    const count = pipelineStats[stage.key as keyof typeof pipelineStats] || 0;
                    const stageCandidates = candidates.filter(c => c.status === stage.key);
                    
                    return (
                      <div key={stage.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                            <span className="text-sm font-medium">{stage.label}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                        <div className="space-y-1 max-h-[300px] overflow-auto">
                          {stageCandidates.slice(0, 10).map((candidate) => (
                            <div key={candidate.id} className="p-2 bg-muted/50 rounded text-xs">
                              <p className="font-medium truncate">{candidate.first_name} {candidate.last_name}</p>
                              <p className="text-muted-foreground truncate">{(candidate.job as any)?.title}</p>
                            </div>
                          ))}
                          {stageCandidates.length === 0 && (
                            <div className="p-2 text-xs text-muted-foreground text-center">
                              No candidates
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <JobFormDialog 
        open={jobDialogOpen} 
        onOpenChange={setJobDialogOpen}
        job={editingJob}
      />
    </ModuleGuard>
  );
}
