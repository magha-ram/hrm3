import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PerformancePage() {
  const { isFrozen, isHR } = useTenant();
  const canEdit = !isFrozen;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance</h1>
          <p className="text-muted-foreground">Track and manage performance reviews</p>
        </div>
        {canEdit && isHR && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Start Review Cycle
          </Button>
        )}
      </div>

      <Tabs defaultValue="my-reviews" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-reviews">My Reviews</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          {isHR && <TabsTrigger value="all">All Reviews</TabsTrigger>}
        </TabsList>

        <TabsContent value="my-reviews">
          <Card>
            <CardHeader>
              <CardTitle>My Performance Reviews</CardTitle>
              <CardDescription>View your completed and upcoming reviews</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No reviews found.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Reviews</CardTitle>
              <CardDescription>Reviews awaiting your input</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <p>No pending reviews.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isHR && (
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Reviews</CardTitle>
                <CardDescription>Company-wide review overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <p>No reviews in the system.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
