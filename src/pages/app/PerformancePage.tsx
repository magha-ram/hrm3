import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, BarChart3, Star, CheckCircle2, Clock, FileEdit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { WriteGate, RoleGate } from '@/components/PermissionGate';
import { ModuleGuard } from '@/components/ModuleGuard';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  useMyReviews, 
  usePendingReviews, 
  useAllReviews, 
  useReviewStats 
} from '@/hooks/usePerformance';
import { ReviewFormDialog } from '@/components/performance/ReviewFormDialog';
import { ReviewDetailDialog } from '@/components/performance/ReviewDetailDialog';
import { ReviewStatusBadge } from '@/components/performance/ReviewStatusBadge';

export default function PerformancePage() {
  const { isHROrAbove, isManager } = useUserRole();
  const { data: myReviews = [], isLoading: myLoading } = useMyReviews();
  const { data: pendingReviews = [], isLoading: pendingLoading } = usePendingReviews();
  const { data: allReviews = [], isLoading: allLoading } = useAllReviews();
  const stats = useReviewStats();

  const [activeTab, setActiveTab] = useState('my-reviews');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [reviewDetailOpen, setReviewDetailOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  const handleViewReview = (id: string) => {
    setSelectedReviewId(id);
    setReviewDetailOpen(true);
  };

  const handleEditReview = (id: string) => {
    setEditingReviewId(id);
  };

  const reviewsToAcknowledge = myReviews.filter(r => r.status === 'completed');

  return (
    <ModuleGuard moduleId="performance">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Performance Reviews</h1>
            <p className="text-muted-foreground">Track and manage performance reviews</p>
          </div>
          <WriteGate>
            <RoleGate role="hr_manager">
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Start Review Cycle
              </Button>
            </RoleGate>
          </WriteGate>
        </div>

        {/* Stats */}
        {isHROrAbove && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Reviews</CardDescription>
                <CardTitle className="text-2xl">{stats.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Draft</CardDescription>
                <CardTitle className="text-2xl">{stats.draft}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>In Progress</CardDescription>
                <CardTitle className="text-2xl">{stats.inProgress}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completed</CardDescription>
                <CardTitle className="text-2xl text-green-600">{stats.completed + stats.acknowledged}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Avg. Rating</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-1">
                  {stats.averageRating.toFixed(1)}
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Alert for reviews to acknowledge */}
        {reviewsToAcknowledge.length > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/20 text-primary">
                    <FileEdit className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">You have {reviewsToAcknowledge.length} review(s) to acknowledge</p>
                    <p className="text-sm text-muted-foreground">
                      Review your completed performance reviews and provide your acknowledgment
                    </p>
                  </div>
                </div>
                <Button onClick={() => handleViewReview(reviewsToAcknowledge[0].id)}>
                  View Review
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="my-reviews">
              My Reviews
              {reviewsToAcknowledge.length > 0 && (
                <Badge variant="secondary" className="ml-2">{reviewsToAcknowledge.length}</Badge>
              )}
            </TabsTrigger>
            {(isManager || isHROrAbove) && (
              <TabsTrigger value="pending">
                Pending
                {pendingReviews.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{pendingReviews.length}</Badge>
                )}
              </TabsTrigger>
            )}
            {isHROrAbove && <TabsTrigger value="all">All Reviews</TabsTrigger>}
          </TabsList>

          {/* My Reviews Tab */}
          <TabsContent value="my-reviews" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>My Performance Reviews</CardTitle>
                <CardDescription>View your completed and acknowledged reviews</CardDescription>
              </CardHeader>
              <CardContent>
                {myLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : myReviews.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No performance reviews found.</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Review Period</TableHead>
                          <TableHead>Reviewer</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myReviews.map((review) => (
                          <TableRow key={review.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {format(new Date(review.review_period_start), 'MMM yyyy')} - {format(new Date(review.review_period_end), 'MMM yyyy')}
                                </p>
                                <p className="text-xs text-muted-foreground">{review.review_type || 'Annual'} Review</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {(review.reviewer as any)?.first_name} {(review.reviewer as any)?.last_name}
                            </TableCell>
                            <TableCell>
                              {review.overall_rating ? (
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">{review.overall_rating}</span>
                                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              <ReviewStatusBadge status={review.status} />
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewReview(review.id)}
                              >
                                View
                              </Button>
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

          {/* Pending Reviews Tab (for managers) */}
          {(isManager || isHROrAbove) && (
            <TabsContent value="pending" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Reviews</CardTitle>
                  <CardDescription>Reviews assigned to you for completion</CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : pendingReviews.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No pending reviews. You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingReviews.map((review) => (
                        <Card key={review.id} className="hover:border-primary/50 transition-colors">
                          <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="font-medium text-primary">
                                    {(review.employee as any)?.first_name?.[0]}{(review.employee as any)?.last_name?.[0]}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {(review.employee as any)?.first_name} {(review.employee as any)?.last_name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {(review.employee as any)?.job_title} • {((review.employee as any)?.department as any)?.name}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-sm font-medium">
                                    {format(new Date(review.review_period_start), 'MMM yyyy')} - {format(new Date(review.review_period_end), 'MMM yyyy')}
                                  </p>
                                  <ReviewStatusBadge status={review.status} />
                                </div>
                                <WriteGate>
                                  <Button onClick={() => handleEditReview(review.id)}>
                                    Complete Review
                                  </Button>
                                </WriteGate>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* All Reviews Tab (HR only) */}
          {isHROrAbove && (
            <TabsContent value="all" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Reviews</CardTitle>
                  <CardDescription>Company-wide review overview</CardDescription>
                </CardHeader>
                <CardContent>
                  {allLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : allReviews.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No reviews in the system.</p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Reviewer</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allReviews.map((review) => (
                            <TableRow key={review.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {(review.employee as any)?.first_name} {(review.employee as any)?.last_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{(review.employee as any)?.job_title}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {(review.reviewer as any)?.first_name} {(review.reviewer as any)?.last_name}
                              </TableCell>
                              <TableCell className="text-sm">
                                {format(new Date(review.review_period_start), 'MMM yyyy')} - {format(new Date(review.review_period_end), 'MMM yyyy')}
                              </TableCell>
                              <TableCell>
                                {review.overall_rating ? (
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">{review.overall_rating}</span>
                                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                  </div>
                                ) : '-'}
                              </TableCell>
                              <TableCell>
                                <ReviewStatusBadge status={review.status} />
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleViewReview(review.id)}
                                >
                                  View
                                </Button>
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
          )}
        </Tabs>
      </div>

      {/* Create Review Dialog */}
      <ReviewFormDialog 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        mode="create"
      />

      {/* Edit/Complete Review Dialog */}
      <ReviewFormDialog 
        open={!!editingReviewId}
        onOpenChange={(open) => !open && setEditingReviewId(null)}
        mode="complete"
        reviewId={editingReviewId}
      />

      {/* Review Detail Dialog */}
      <ReviewDetailDialog
        open={reviewDetailOpen}
        onOpenChange={setReviewDetailOpen}
        reviewId={selectedReviewId}
      />
    </ModuleGuard>
  );
}
