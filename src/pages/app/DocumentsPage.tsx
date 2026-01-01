import { useState } from 'react';
import { FileText, Upload, Settings, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WriteGate, RoleGate } from '@/components/PermissionGate';
import { ModuleGuard } from '@/components/ModuleGuard';
import { DocumentUploadDialog } from '@/components/documents/DocumentUploadDialog';
import { DocumentList } from '@/components/documents/DocumentList';
import { DocumentTypeManager } from '@/components/documents/DocumentTypeManager';
import { DocumentExpiryAlerts } from '@/components/documents/DocumentExpiryAlerts';
import { useAllDocuments, useMyDocuments } from '@/hooks/useDocuments';
import { useUserRole } from '@/hooks/useUserRole';

export default function DocumentsPage() {
  const { isHROrAbove } = useUserRole();
  const { data: allDocuments = [], isLoading: allLoading } = useAllDocuments();
  const { data: myDocuments = [], isLoading: myLoading } = useMyDocuments();
  
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(isHROrAbove ? 'all' : 'my');

  const filteredAllDocs = allDocuments.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.employee?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.employee?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.document_type?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMyDocs = myDocuments.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.document_type?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingVerificationCount = allDocuments.filter(d => !d.is_verified).length;

  return (
    <ModuleGuard moduleId="documents">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Documents</h1>
            <p className="text-muted-foreground">Manage employee documents and files</p>
          </div>
          <WriteGate>
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </WriteGate>
        </div>

        {/* Stats Cards for HR */}
        {isHROrAbove && (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Documents</CardDescription>
                <CardTitle className="text-3xl">{allDocuments.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Verified</CardDescription>
                <CardTitle className="text-3xl text-green-600">
                  {allDocuments.filter(d => d.is_verified).length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending Verification</CardDescription>
                <CardTitle className="text-3xl text-amber-600">
                  {pendingVerificationCount}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              {isHROrAbove && <TabsTrigger value="all">All Documents</TabsTrigger>}
              <TabsTrigger value="my">My Documents</TabsTrigger>
              {isHROrAbove && (
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </TabsTrigger>
              )}
            </TabsList>

            {activeTab !== 'settings' && (
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </div>

          {isHROrAbove && (
            <TabsContent value="all" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Documents</CardTitle>
                  <CardDescription>
                    View and manage all employee documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DocumentList
                    documents={filteredAllDocs}
                    isLoading={allLoading}
                    showEmployee={true}
                    canVerify={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="my" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Documents</CardTitle>
                <CardDescription>
                  View your personal documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentList
                  documents={filteredMyDocs}
                  isLoading={myLoading}
                  showEmployee={false}
                  canVerify={false}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {isHROrAbove && (
            <TabsContent value="settings" className="mt-6">
              <DocumentTypeManager />
            </TabsContent>
          )}
        </Tabs>

        <DocumentUploadDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
        />
      </div>
    </ModuleGuard>
  );
}
