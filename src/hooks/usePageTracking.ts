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

/**
 * Track a page view. Pass the tenant's user_id directly.
 * When userId is provided, tracking fires immediately.
 */
export function usePageTracking(eventType: string = "page_view", userId?: string | null, metadata?: Record<string, unknown>) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current || !userId) return;
    tracked.current = true;

    const sessionId = getSessionId();
    const pageUrl = window.location.pathname;

    console.log("[Tracking] Tracking page event:", { eventType, userId, pageUrl });

    supabase.from("page_events").insert({
      event_type: eventType,
      page_url: pageUrl,
      session_id: sessionId,
      metadata: metadata || {},
      user_id: userId,
    } as any).then(({ error }) => {
      if (error) console.error("[Tracking] page_events insert error:", error.message);
      else console.log("[Tracking] page_events inserted OK");
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
        else console.log("[Tracking] visitor_sessions upserted OK");
      });
    });
  }, [eventType, userId, metadata]);
}

export function trackEvent(eventType: string, userId?: string | null, metadata?: Record<string, unknown>) {
  const sessionId = getSessionId();
  return supabase.from("page_events").insert({
    event_type: eventType,
    page_url: window.location.pathname,
    session_id: sessionId,
    metadata: metadata || {},
    ...(userId ? { user_id: userId } : {}),
  } as any);
}

// Heartbeat to keep session alive
export function useVisitorHeartbeat(userId?: string | null) {
  useEffect(() => {
    if (!userId) return;
    const sessionId = getSessionId();
    const interval = setInterval(() => {
      supabase.from("visitor_sessions").upsert(
        { session_id: sessionId, last_seen_at: new Date().toISOString(), page_url: window.location.pathname, user_id: userId },
        { onConflict: "session_id" }
      ).then();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId]);
}
