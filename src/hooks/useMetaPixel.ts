import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

type QueuedMetaEvent = {
  eventName: string;
  payload: Record<string, unknown>;
  filterPaidOnly?: boolean;
  eventId?: string;
};

type PixelConfig = {
  pixel_id: string;
  fire_on_paid_only: boolean;
};

const activeMetaPixels = new Map<string, PixelConfig>();
const queuedMetaEvents: QueuedMetaEvent[] = [];
let metaLibraryLoaded = false;
let retryTimerActive = false;

function ensureFbqStub() {
  if (typeof window === "undefined") return null;
  if (window.fbq) return window.fbq;

  const n: any = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  };
  if (!window._fbq) window._fbq = n;
  n.push = n;
  n.loaded = false;
  n.version = "2.0";
  n.queue = [];
  window.fbq = n;

  // Inject the official script once
  if (!document.querySelector('script[data-meta-pixel="true"]')) {
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    s.dataset.metaPixel = "true";
    s.addEventListener("load", () => {
      metaLibraryLoaded = true;
      n.loaded = true;
      console.log("[Meta Pixel] Biblioteca carregada.");
      flushQueuedMetaEvents();
    });
    s.addEventListener("error", () => {
      console.error("[Meta Pixel] Falha ao carregar fbevents.js");
    });
    const first = document.getElementsByTagName("script")[0];
    first?.parentNode?.insertBefore(s, first);
  }
  return n;
}

function initMetaPixel(pixelId: string, fireOnPaidOnly: boolean) {
  const fbq = ensureFbqStub();
  if (!fbq || !pixelId || activeMetaPixels.has(pixelId)) return;
  activeMetaPixels.set(pixelId, { pixel_id: pixelId, fire_on_paid_only: fireOnPaidOnly });
  try {
    fbq("init", pixelId);
    // Fire PageView immediately (only to this pixel) — never filter PageView by paid-only
    fbq("trackSingle", pixelId, "PageView");
    console.log("[Meta Pixel] Init + PageView.", { pixelId });
  } catch (err) {
    console.error("[Meta Pixel] Erro no init.", { pixelId, err });
  }
}

function dispatchMetaEvent(
  eventName: string,
  payload: Record<string, unknown>,
  filterPaidOnly?: boolean,
  eventId?: string,
) {
  const fbq = ensureFbqStub();
  if (!fbq || !activeMetaPixels.size) return false;

  let fired = false;
  for (const [pixelId, config] of activeMetaPixels) {
    if (filterPaidOnly === true && !config.fire_on_paid_only) continue;
    if (filterPaidOnly === false && config.fire_on_paid_only) continue;
    try {
      if (eventId) {
        fbq("trackSingle", pixelId, eventName, payload, { eventID: eventId });
      } else {
        fbq("trackSingle", pixelId, eventName, payload);
      }
      fired = true;
      console.log("[Meta Pixel] Evento enviado.", { pixelId, eventName, filterPaidOnly, eventId });
    } catch (err) {
      console.error("[Meta Pixel] Falha ao disparar evento.", { pixelId, eventName, err });
    }
  }
  return fired;
}

function trackMetaEvent(
  eventName: string,
  payload: Record<string, unknown>,
  filterPaidOnly?: boolean,
  eventId?: string,
  allowQueue = true,
) {
  if (dispatchMetaEvent(eventName, payload, filterPaidOnly, eventId)) return;
  if (!allowQueue) return;

  queuedMetaEvents.push({ eventName, payload, filterPaidOnly, eventId });
  console.warn("[Meta Pixel] Evento enfileirado.", { eventName, filterPaidOnly });

  if (!retryTimerActive) {
    retryTimerActive = true;
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      flushQueuedMetaEvents();
      if (queuedMetaEvents.length === 0 || attempts >= 30) {
        clearInterval(interval);
        retryTimerActive = false;
      }
    }, 1000);
  }
}

function flushQueuedMetaEvents() {
  if (!queuedMetaEvents.length || !activeMetaPixels.size) return;
  const events = queuedMetaEvents.splice(0, queuedMetaEvents.length);
  events.forEach((e) => {
    if (!dispatchMetaEvent(e.eventName, e.payload, e.filterPaidOnly, e.eventId)) {
      queuedMetaEvents.push(e);
    }
  });
}

export function useMetaPixel(tenantUserId?: string | null) {
  const { data: pixels } = useQuery({
    queryKey: ["meta-pixels-active", tenantUserId],
    enabled: !!tenantUserId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracking_pixels_public" as any)
        .select("pixel_id, fire_on_paid_only, platform, active, user_id")
        .eq("user_id", tenantUserId!)
        .eq("platform", "meta")
        .eq("active", true);
      if (error) throw error;
      return data as any[];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => { ensureFbqStub(); }, []);

  useEffect(() => {
    if (pixels && pixels.length > 0) {
      pixels.forEach((p: any) => initMetaPixel(p.pixel_id, p.fire_on_paid_only ?? false));
      flushQueuedMetaEvents();
    }
  }, [pixels]);

  return { pixels };
}

export function trackMetaViewContent(opts: {
  contentId: string;
  contentName: string;
  value?: number;
  currency?: string;
}) {
  trackMetaEvent(
    "ViewContent",
    {
      content_type: "product",
      content_ids: [opts.contentId],
      content_name: opts.contentName,
      currency: opts.currency || "BRL",
      value: Number(opts.value || 0),
    },
    false,
  );
}

export function trackMetaInitiateCheckout(opts: {
  contentId: string;
  contentName: string;
  value: number;
  currency?: string;
}) {
  trackMetaEvent(
    "InitiateCheckout",
    {
      content_type: "product",
      content_ids: [opts.contentId],
      content_name: opts.contentName,
      currency: opts.currency || "BRL",
      value: Number(opts.value || 0),
    },
    false,
  );
}

export function trackMetaPurchase(
  value: number,
  currency = "BRL",
  options: {
    orderId?: string;
    contentId?: string;
    contentName?: string;
    quantity?: number;
    filterPaidOnly?: boolean;
  } = {},
) {
  const normalized = Number(value);
  const payload: Record<string, unknown> = {
    content_type: "product",
    currency,
    value: Number.isFinite(normalized) ? normalized : 0,
  };
  if (options.contentId) {
    payload.content_ids = [options.contentId];
    payload.contents = [{
      id: options.contentId,
      quantity: options.quantity || 1,
      item_price: Number.isFinite(normalized) ? normalized : 0,
    }];
  }
  if (options.contentName) payload.content_name = options.contentName;
  if (options.orderId) payload.order_id = options.orderId;

  // event_id = orderId → permite deduplicação com CAPI server-side
  trackMetaEvent("Purchase", payload, options.filterPaidOnly, options.orderId);
}
