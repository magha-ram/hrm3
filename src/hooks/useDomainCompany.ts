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

      // Check for subdomain pattern: {subdomain}.hrplatform.com or {subdomain}.lovable.app
      const parts = hostname.split('.');
      
      // Get base domain from platform settings (fallback to common patterns)
      const { data: baseDomainSetting } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'base_domain')
        .maybeSingle();
      
      const baseDomain = baseDomainSetting?.value ? 
        String(baseDomainSetting.value).replace(/"/g, '') : 
        'hrplatform.com';

      let detectedSubdomain: string | null = null;
      let customDomain: string | null = null;

      // Check if it's a subdomain of the base domain
      if (parts.length >= 2) {
        const potentialBase = parts.slice(-2).join('.');
        if (potentialBase === baseDomain || hostname.endsWith('.lovable.app')) {
          // It's a subdomain
          detectedSubdomain = parts[0];
          setSubdomain(detectedSubdomain);
        } else {
          // It's potentially a custom domain
          customDomain = hostname;
        }
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
