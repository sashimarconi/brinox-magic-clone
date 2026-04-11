import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

function getSessionId() {
  let sid = sessionStorage.getItem("visitor_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("visitor_session_id", sid);
  }
  return sid;
}

interface GeoData {
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
}

let cachedGeo: GeoData | null = null;
let geoPromise: Promise<GeoData | null> | null = null;

async function fetchGeoOnce(): Promise<GeoData | null> {
  if (cachedGeo) return cachedGeo;
  if (geoPromise) return geoPromise;

  geoPromise = (async () => {
    try {
      const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) });
      if (!res.ok) return null;
      const data = await res.json();
      cachedGeo = {
        city: data.city || "",
        region: data.region || "",
        country: data.country_name || "",
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
      };
      return cachedGeo;
    } catch {
      return null;
    }
  })();

  return geoPromise;
}

// Store the current tenant user_id for tracking
let currentTenantUserId: string | null = null;

export function setTrackingTenantUserId(userId: string | null) {
  currentTenantUserId = userId;
}

function getTenantUserId(): string | null {
  return currentTenantUserId;
}

export function usePageTracking(eventType: string = "page_view", metadata?: Record<string, unknown>) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;

    const userId = getTenantUserId();
    if (!userId) {
      // Retry once after a short delay (product data may still be loading)
      const timer = setTimeout(() => {
        const retryUserId = getTenantUserId();
        if (!retryUserId || tracked.current) return;
        tracked.current = true;
        doTrack(eventType, metadata, retryUserId);
      }, 2000);
      return () => clearTimeout(timer);
    }

    tracked.current = true;
    doTrack(eventType, metadata, userId);
  }, [eventType, metadata]);
}

function doTrack(eventType: string, metadata: Record<string, unknown> | undefined, userId: string) {
  const sessionId = getSessionId();
  const pageUrl = window.location.pathname;

  supabase.from("page_events").insert({
    event_type: eventType,
    page_url: pageUrl,
    session_id: sessionId,
    metadata: metadata || {},
    user_id: userId,
  } as any).then(({ error }) => {
    if (error) console.error("[Tracking] page_events insert error:", error.message);
  });

  fetchGeoOnce().then(geo => {
    const sessionData: any = {
      session_id: sessionId,
      last_seen_at: new Date().toISOString(),
      page_url: pageUrl,
      user_id: userId,
    };
    if (geo) {
      sessionData.city = geo.city;
      sessionData.region = geo.region;
      sessionData.country = geo.country;
      sessionData.latitude = geo.latitude;
      sessionData.longitude = geo.longitude;
    }
    supabase.from("visitor_sessions").upsert(sessionData, { onConflict: "session_id" }).then(({ error }) => {
      if (error) console.error("[Tracking] visitor_sessions upsert error:", error.message);
    });
  });
}

export function trackEvent(eventType: string, metadata?: Record<string, unknown>) {
  const sessionId = getSessionId();
  const userId = getTenantUserId();
  return supabase.from("page_events").insert({
    event_type: eventType,
    page_url: window.location.pathname,
    session_id: sessionId,
    metadata: metadata || {},
    ...(userId ? { user_id: userId } : {}),
  } as any);
}

// Heartbeat to keep session alive
export function useVisitorHeartbeat() {
  useEffect(() => {
    const sessionId = getSessionId();
    const interval = setInterval(() => {
      const userId = getTenantUserId();
      if (!userId) return;
      supabase.from("visitor_sessions").upsert(
        { session_id: sessionId, last_seen_at: new Date().toISOString(), page_url: window.location.pathname, user_id: userId },
        { onConflict: "session_id" }
      ).then();
    }, 30000);

    return () => clearInterval(interval);
  }, []);
}
