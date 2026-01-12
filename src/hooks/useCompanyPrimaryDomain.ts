import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PrimaryDomainResult {
  domainUrl: string | null;
  domainType: 'subdomain' | 'custom' | null;
  isLoading: boolean;
}

export function useCompanyPrimaryDomain(companyId: string | null): PrimaryDomainResult {
  const [domainUrl, setDomainUrl] = useState<string | null>(null);
  const [domainType, setDomainType] = useState<'subdomain' | 'custom' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setDomainUrl(null);
      setDomainType(null);
      return;
    }

    async function fetchPrimaryDomain() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .rpc('get_company_primary_domain', { p_company_id: companyId });

        if (error) {
          console.error('Error fetching primary domain:', error);
          setDomainUrl(null);
          setDomainType(null);
          return;
        }

        if (data) {
          setDomainUrl(data as string);
          setDomainType('custom');
        } else {
          setDomainUrl(null);
          setDomainType(null);
        }
      } catch (err) {
        console.error('Error fetching primary domain:', err);
        setDomainUrl(null);
        setDomainType(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrimaryDomain();
  }, [companyId]);

  return { domainUrl, domainType, isLoading };
}

// Utility function to get primary domain (for use after login)
export async function getCompanyPrimaryDomainUrl(companyId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_company_primary_domain', { p_company_id: companyId });

    if (error || !data) {
      return null;
    }

    return data as string || null;
  } catch {
    return null;
  }
}
