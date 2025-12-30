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

      const parts = hostname.split('.');

      // FIRST: Try full hostname as custom_domain (e.g., hr1.nateshkumar.tech)
      const { data: customDomainData } = await supabase
        .from('company_domains')
        .select(`
          company_id,
          subdomain,
          companies (
            id,
            name,
            slug,
            logo_url
          )
        `)
        .eq('custom_domain', hostname)
        .eq('is_verified', true)
        .eq('is_active', true)
        .maybeSingle();

      if (customDomainData?.companies) {
        const companyData = customDomainData.companies as unknown as DomainCompany;
        setCompany(companyData);
        if (customDomainData.subdomain) {
          setSubdomain(customDomainData.subdomain);
        }
        setIsLoading(false);
        return;
      }

      // THEN: Check for subdomain patterns (4+ parts like sala.hr.nateshkumar.tech)
      if (parts.length >= 4) {
        const detectedSubdomain = parts[0];
        setSubdomain(detectedSubdomain);

        const { data: subdomainData } = await supabase
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

        if (subdomainData?.companies) {
          const companyData = subdomainData.companies as unknown as DomainCompany;
          setCompany(companyData);
          setIsLoading(false);
          return;
        }
      }

      // For Lovable domains: check subdomain (e.g., company.xxx.lovable.app)
      if (hostname.endsWith('.lovable.app') && parts.length >= 3) {
        const detectedSubdomain = parts[0];
        setSubdomain(detectedSubdomain);

        const { data: subdomainData } = await supabase
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

        if (subdomainData?.companies) {
          const companyData = subdomainData.companies as unknown as DomainCompany;
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
