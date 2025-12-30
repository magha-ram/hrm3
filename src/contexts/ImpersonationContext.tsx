import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface ImpersonatedCompany {
  id: string;
  name: string;
  slug: string;
}

interface ImpersonationContextValue {
  isImpersonating: boolean;
  impersonatedCompany: ImpersonatedCompany | null;
  startImpersonation: (company: ImpersonatedCompany) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  effectiveCompanyId: string | null;
}

const ImpersonationContext = createContext<ImpersonationContextValue | undefined>(undefined);

export const useImpersonation = () => {
  const context = useContext(ImpersonationContext);
  if (!context) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
};

export const ImpersonationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isPlatformAdmin, currentCompanyId, user } = useAuth();
  const [impersonatedCompany, setImpersonatedCompany] = useState<ImpersonatedCompany | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const startImpersonation = useCallback(async (company: ImpersonatedCompany) => {
    if (!isPlatformAdmin) {
      toast.error('Only platform admins can impersonate companies');
      return;
    }

    // Generate a session ID for this impersonation
    const sessionId = crypto.randomUUID();
    sessionIdRef.current = sessionId;

    // Log impersonation start to dedicated table
    try {
      await supabase.from('impersonation_logs').insert({
        admin_user_id: user?.user_id,
        company_id: company.id,
        company_name: company.name,
        action: 'start',
        session_id: sessionId,
        user_agent: navigator.userAgent,
        metadata: {
          company_slug: company.slug,
        },
      });
    } catch (err) {
      console.error('Failed to log impersonation start:', err);
    }

    setImpersonatedCompany(company);
    toast.success(`Now viewing as ${company.name}`);
  }, [isPlatformAdmin, user?.user_id]);

  const stopImpersonation = useCallback(async () => {
    if (impersonatedCompany) {
      // Log impersonation end
      try {
        await supabase.from('impersonation_logs').insert({
          admin_user_id: user?.user_id,
          company_id: impersonatedCompany.id,
          company_name: impersonatedCompany.name,
          action: 'end',
          session_id: sessionIdRef.current,
          user_agent: navigator.userAgent,
          metadata: {
            company_slug: impersonatedCompany.slug,
          },
        });
      } catch (err) {
        console.error('Failed to log impersonation end:', err);
      }
    }

    sessionIdRef.current = null;
    setImpersonatedCompany(null);
    toast.info('Impersonation ended');
  }, [impersonatedCompany, user?.user_id]);

  // The effective company ID is the impersonated company if impersonating,
  // otherwise the user's actual current company
  const effectiveCompanyId = impersonatedCompany?.id || currentCompanyId;

  const value: ImpersonationContextValue = {
    isImpersonating: !!impersonatedCompany,
    impersonatedCompany,
    startImpersonation,
    stopImpersonation,
    effectiveCompanyId,
  };

  return (
    <ImpersonationContext.Provider value={value}>
      {children}
    </ImpersonationContext.Provider>
  );
};