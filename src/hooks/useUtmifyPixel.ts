import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    tikTokPixelId?: string;
  }
}

const loadedPixels = new Set<string>();

function injectUtmifyTikTokPixel(pixelId: string) {
  if (typeof window === "undefined" || !pixelId || loadedPixels.has(pixelId)) return;
  loadedPixels.add(pixelId);

  // Define o ID antes do script carregar (igual ao snippet oficial da Utmify)
  window.tikTokPixelId = pixelId;

  const existing = document.querySelector(
    `script[data-utmify-pixel="${pixelId}"]`
  ) as HTMLScriptElement | null;
  if (existing) return;

  const s = document.createElement("script");
  s.setAttribute("async", "");
  s.setAttribute("defer", "");
  s.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel-tiktok.js");
  s.dataset.utmifyPixel = pixelId;
  document.head.appendChild(s);
  console.log("[Utmify Pixel] Script injetado.", { pixelId });
}

/**
 * Carrega o pixel TikTok da Utmify (script client-side) configurado pelo dono da loja.
 * Multi-tenant safe: cada usuário injeta APENAS seu próprio pixel.
 */
export function useUtmifyPixel(tenantUserId?: string | null) {
  const { data: settings } = useQuery({
    queryKey: ["utmify-pixel", tenantUserId],
    enabled: !!tenantUserId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("utmify_settings" as any)
        .select("tiktok_pixel_id, active")
        .eq("user_id", tenantUserId!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (settings?.active && settings?.tiktok_pixel_id) {
      injectUtmifyTikTokPixel(settings.tiktok_pixel_id);
    }
  }, [settings]);
}
