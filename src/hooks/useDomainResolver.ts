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
  /** When true, the domain is a "shared" storefront (not tied to a single user). */
  isShared: boolean;
}

/**
 * Resolves the current hostname:
 * - Platform hostnames → not custom
 * - Hostnames cadastrados em custom_domains → custom de um único usuário
 * - Demais hostnames → tratados como "shared" (compartilhados entre todas as contas)
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
        return { isCustomDomain: false, ownerUserId: null, domain: hostname, verified: false, isShared: false };
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
          isShared: false,
        };
      }

      // Fallback: domínio compartilhado (qualquer usuário pode usar)
      return {
        isCustomDomain: true,
        ownerUserId: null,
        domain: hostname,
        verified: true,
        isShared: true,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    domainInfo: data ?? { isCustomDomain: false, ownerUserId: null, domain: hostname, verified: false, isShared: false },
    isLoading,
    isPlatform,
  };
}
