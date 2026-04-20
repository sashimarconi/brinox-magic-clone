import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PLATFORM_HOSTNAMES = [
  "localhost",
  "voidtok.site",
  "www.voidtok.site",
  "voidtok.lovable.app",
];

export interface DomainInfo {
  isCustomDomain: boolean;
  ownerUserId: string | null;
  domain: string;
  verified: boolean;
}

/**
 * Resolves the current hostname:
 * - Platform hostnames → not custom
 * - Hostnames cadastrados em custom_domains → custom de um único usuário
 * - Demais hostnames → fallback para ownerUserId=null (comportamento anterior)
 */
export function useDomainResolver() {
  const hostname = window.location.hostname;

  const isPlatform = PLATFORM_HOSTNAMES.some(
    (h) => hostname === h || hostname.endsWith(`.lovableproject.com`) || hostname.endsWith(`.lovable.app`)
  );

  const { data, isLoading } = useQuery({
    queryKey: ["domain-resolve", hostname],
    queryFn: async (): Promise<DomainInfo> => {
      if (isPlatform) {
        return { isCustomDomain: false, ownerUserId: null, domain: hostname, verified: false };
      }

      // Tenta encontrar dono específico
      const { data: domainRow } = await (supabase as any)
        .from("custom_domains_public")
        .select("user_id, domain, verified")
        .eq("domain", hostname)
        .maybeSingle();

      if (domainRow?.user_id) {
        return {
          isCustomDomain: true,
          ownerUserId: domainRow.user_id,
          domain: domainRow.domain,
          verified: domainRow.verified,
        };
      }

      // Fallback: comportamento anterior (não compartilhado)
      return {
        isCustomDomain: true,
        ownerUserId: null,
        domain: hostname,
        verified: true,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    domainInfo: data ?? { isCustomDomain: false, ownerUserId: null, domain: hostname, verified: false },
    isLoading,
    isPlatform,
  };
}
