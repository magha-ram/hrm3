import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedCompany, stopImpersonation } = useImpersonation();
  const { isPlatformAdmin } = useAuth();
  const navigate = useNavigate();

  // Don't show banner if not a platform admin (safety check)
  if (!isPlatformAdmin || !isImpersonating || !impersonatedCompany) {
    return null;
  }

  const handleStop = async () => {
    await stopImpersonation();
    navigate('/platform/companies');
  };

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between z-50">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        <span className="text-sm font-medium">
          Viewing as: <strong>{impersonatedCompany.name}</strong>
          <span className="opacity-75 ml-1">({impersonatedCompany.slug})</span>
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleStop}
        className="text-amber-950 hover:bg-amber-600 hover:text-amber-950 h-7 px-2"
      >
        <X className="h-4 w-4 mr-1" />
        Exit
      </Button>
    </div>
  );
}
