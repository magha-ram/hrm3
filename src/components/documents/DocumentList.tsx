import { useState } from 'react';
import { format } from 'date-fns';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  MoreHorizontal,
  Eye,
  Trash2,
  ShieldCheck
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useVerifyDocument, useDeleteDocument } from '@/hooks/useDocuments';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

interface DocumentWithRelations {
  id: string;
  title: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  is_verified: boolean | null;
  issue_date: string | null;
  expiry_date: string | null;
  created_at: string;
  description: string | null;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  document_type?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface Props {
  documents: DocumentWithRelations[];
  isLoading?: boolean;
  showEmployee?: boolean;
  canVerify?: boolean;
}

export function DocumentList({ documents, isLoading, showEmployee = true, canVerify = false }: Props) {
  const { isHROrAbove } = useUserRole();
  const verifyDocument = useVerifyDocument();
  const deleteDocument = useDeleteDocument();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const handleDownload = async (doc: DocumentWithRelations) => {
    try {
      const { data, error } = await supabase.storage
        .from('employee-documents')
        .download(doc.file_url);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error('Failed to download document');
    }
  };

  const handleView = async (doc: DocumentWithRelations) => {
    try {
      const { data, error } = await supabase.storage
        .from('employee-documents')
        .createSignedUrl(doc.file_url, 60 * 5); // 5 minute signed URL

      if (error) throw error;

      window.open(data.signedUrl, '_blank');
    } catch (error: any) {
      toast.error('Failed to open document');
    }
  };

  const handleVerify = (id: string) => {
    verifyDocument.mutate(id);
  };

  const handleDelete = () => {
    if (selectedDocId) {
      deleteDocument.mutate(selectedDocId);
      setDeleteDialogOpen(false);
      setSelectedDocId(null);
    }
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { label: 'Expired', variant: 'destructive' as const, icon: AlertTriangle };
    } else if (daysUntilExpiry <= 30) {
      return { label: 'Expiring Soon', variant: 'secondary' as const, icon: Clock };
    }
    return null;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No documents found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              {showEmployee && <TableHead>Employee</TableHead>}
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => {
              const expiryStatus = getExpiryStatus(doc.expiry_date);
              
              return (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.file_name} • {formatFileSize(doc.file_size)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  {showEmployee && (
                    <TableCell>
                      {doc.employee ? (
                        <span className="text-sm">
                          {doc.employee.first_name} {doc.employee.last_name}
                        </span>
                      ) : '-'}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant="outline">
                      {doc.document_type?.name || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {doc.is_verified ? (
                        <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      {expiryStatus && (
                        <Badge variant={expiryStatus.variant}>
                          <expiryStatus.icon className="h-3 w-3 mr-1" />
                          {expiryStatus.label}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(doc.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(doc)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(doc)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        {canVerify && !doc.is_verified && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleVerify(doc.id)}>
                              <ShieldCheck className="h-4 w-4 mr-2" />
                              Verify Document
                            </DropdownMenuItem>
                          </>
                        )}
                        {isHROrAbove && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                setSelectedDocId(doc.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this document. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
