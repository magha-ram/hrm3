import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DomainCompany {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface UseDomainCompanyResult {
  company: DomainCompany | null;
  isLoading: boolean;
  isDomainBased: boolean;
  subdomain: string | null;
}

export function useDomainCompany(): UseDomainCompanyResult {
  const [company, setCompany] = useState<DomainCompany | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    const detectCompany = async () => {
      const hostname = window.location.hostname;
      
      // Skip detection for localhost and main app domain
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        setIsLoading(false);
        return;
      }

      // Auto-detect base domain from running environment
      const parts = hostname.split('.');
      
      let detectedSubdomain: string | null = null;
      let customDomain: string | null = null;

      // Check if it's a subdomain pattern
      if (parts.length >= 3) {
        // For patterns like: company.app.lovable.app or company.hrplatform.com
        if (hostname.endsWith('.lovable.app')) {
          // On Lovable: first part is the subdomain
          detectedSubdomain = parts[0];
          setSubdomain(detectedSubdomain);
        } else {
          // On custom domain: first part is the subdomain
          detectedSubdomain = parts[0];
          setSubdomain(detectedSubdomain);
        }
      } else if (parts.length === 2) {
        // This is a root domain (e.g., hrplatform.com) - could be a custom domain lookup
        customDomain = hostname;
      }

      // Try to find company by subdomain first
      if (detectedSubdomain) {
        const { data: domainData } = await supabase
          .from('company_domains')
          .select(`
            company_id,
            companies (
              id,
              name,
              slug,
              logo_url
            )
          `)
          .eq('subdomain', detectedSubdomain)
          .eq('is_active', true)
          .maybeSingle();

        if (domainData?.companies) {
          const companyData = domainData.companies as unknown as DomainCompany;
          setCompany(companyData);
          setIsLoading(false);
          return;
        }
      }

      // Try custom domain lookup
      if (customDomain) {
        const { data: domainData } = await supabase
          .from('company_domains')
          .select(`
            company_id,
            companies (
              id,
              name,
              slug,
              logo_url
            )
          `)
          .eq('custom_domain', customDomain)
          .eq('is_verified', true)
          .eq('is_active', true)
          .maybeSingle();

        if (domainData?.companies) {
          const companyData = domainData.companies as unknown as DomainCompany;
          setCompany(companyData);
        }
      }

      setIsLoading(false);
    };

    detectCompany();
  }, []);

  return {
    company,
    isLoading,
    isDomainBased: !!company,
    subdomain,
  };
}
