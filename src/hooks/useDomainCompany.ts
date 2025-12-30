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
  baseDomain: string | null;
}

// Known base domains for wildcard subdomain routing
// These are the domains where company subdomains are hosted
const KNOWN_BASE_DOMAINS = [
  'hr.nateshkumar.tech',    // Production wildcard domain
  'thefruitbazaar.com',     // Vercel production domain
  'lovable.app',            // Lovable hosting
  'vercel.app',             // Vercel hosting
];

/**
 * Extract subdomain from hostname for multi-level domain patterns
 * Examples:
 * - sala.hr.nateshkumar.tech → subdomain: "sala", baseDomain: "hr.nateshkumar.tech"
 * - mycompany.app.lovable.app → subdomain: "mycompany", baseDomain: "app.lovable.app"
 * - hr.nateshkumar.tech → subdomain: null (this is the root)
 */
function extractSubdomainInfo(hostname: string): { subdomain: string | null; baseDomain: string | null } {
  // Check against known base domains
  for (const baseDomain of KNOWN_BASE_DOMAINS) {
    if (hostname === baseDomain) {
      // This is the root domain, no subdomain
      return { subdomain: null, baseDomain };
    }
    
    if (hostname.endsWith(`.${baseDomain}`)) {
      // Extract subdomain (everything before the base domain)
      const subdomain = hostname.slice(0, hostname.length - baseDomain.length - 1);
      // Only take the first part if there are multiple levels
      const subdomainParts = subdomain.split('.');
      return { subdomain: subdomainParts[0], baseDomain };
    }
  }
  
  // Fallback: try to detect subdomain from generic patterns
  const parts = hostname.split('.');
  
  // For 4+ parts like "company.hr.domain.tld", first part is subdomain
  if (parts.length >= 4) {
    const subdomain = parts[0];
    const baseDomain = parts.slice(1).join('.');
    return { subdomain, baseDomain };
  }
  
  // For 3 parts like "company.domain.tld" or "hr.domain.tld"
  if (parts.length === 3) {
    // Check if first part could be a subdomain (not www, mail, etc.)
    const commonPrefixes = ['www', 'mail', 'ftp', 'api', 'admin'];
    if (!commonPrefixes.includes(parts[0].toLowerCase())) {
      return { subdomain: parts[0], baseDomain: parts.slice(1).join('.') };
    }
  }
  
  // For 2 parts (root domain), no subdomain
  return { subdomain: null, baseDomain: hostname };
}

export function useDomainCompany(): UseDomainCompanyResult {
  const [company, setCompany] = useState<DomainCompany | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [baseDomain, setBaseDomain] = useState<string | null>(null);

  useEffect(() => {
    const detectCompany = async () => {
      const hostname = window.location.hostname;
      
      console.log('[useDomainCompany] Detecting company for hostname:', hostname);
      
      // Skip detection for localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        console.log('[useDomainCompany] Localhost detected, skipping');
        setIsLoading(false);
        return;
      }

      // Extract subdomain and base domain
      const { subdomain: detectedSubdomain, baseDomain: detectedBaseDomain } = extractSubdomainInfo(hostname);
      
      console.log('[useDomainCompany] Extracted:', { subdomain: detectedSubdomain, baseDomain: detectedBaseDomain });
      
      setSubdomain(detectedSubdomain);
      setBaseDomain(detectedBaseDomain);

      // Try to find company by subdomain first
      if (detectedSubdomain) {
        console.log('[useDomainCompany] Looking up company by subdomain:', detectedSubdomain);
        
        const { data: domainData, error } = await supabase
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

        if (error) {
          console.error('[useDomainCompany] Error looking up subdomain:', error);
        }

        if (domainData?.companies) {
          const companyData = domainData.companies as unknown as DomainCompany;
          console.log('[useDomainCompany] Found company by subdomain:', companyData.name);
          setCompany(companyData);
          setIsLoading(false);
          return;
        }
        
        console.log('[useDomainCompany] No company found for subdomain:', detectedSubdomain);
      }

      // Try custom domain lookup (full hostname match)
      console.log('[useDomainCompany] Trying custom domain lookup for:', hostname);
      
      const { data: customDomainData, error: customError } = await supabase
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
        .eq('custom_domain', hostname)
        .eq('is_verified', true)
        .eq('is_active', true)
        .maybeSingle();

      if (customError) {
        console.error('[useDomainCompany] Error looking up custom domain:', customError);
      }

      if (customDomainData?.companies) {
        const companyData = customDomainData.companies as unknown as DomainCompany;
        console.log('[useDomainCompany] Found company by custom domain:', companyData.name);
        setCompany(companyData);
      } else {
        console.log('[useDomainCompany] No company found for hostname:', hostname);
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
    baseDomain,
  };
}
