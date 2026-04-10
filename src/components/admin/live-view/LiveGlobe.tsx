import { useMemo, useEffect, useRef, useState } from "react";
import * as topojson from "topojson-client";

interface LiveGlobeProps {
  visitors: { session_id: string; latitude?: number | null; longitude?: number | null }[];
  className?: string;
}

// Equirectangular projection: convert lat/lng to SVG coordinates
function project(lat: number, lng: number, width: number, height: number): [number, number] {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return [x, y];
}

const MAP_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function LiveGlobe({ visitors, className }: LiveGlobeProps) {
  const [landPath, setLandPath] = useState<string>("");
  const svgRef = useRef<SVGSVGElement>(null);
  const W = 960;
  const H = 480;

  // Load world topology once
  useEffect(() => {
    let cancelled = false;
    fetch(MAP_URL)
      .then(r => r.json())
      .then(topo => {
        if (cancelled) return;
        const land = topojson.feature(topo, topo.objects.countries) as any;
        // Build SVG path from GeoJSON using equirectangular projection
        const pathStr = land.features
          .map((f: any) => geoToPath(f.geometry, W, H))
          .join(" ");
        setLandPath(pathStr);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Only show visitors with real coordinates
  const realVisitors = useMemo(() => {
    return visitors.filter(
      v => v.latitude != null && v.longitude != null && (v.latitude !== 0 || v.longitude !== 0)
    );
  }, [visitors]);

  return (
    <div className={className} style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <div className="absolute inset-0 bg-[#0c0a1a] rounded-xl overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Grid */}
          {Array.from({ length: 17 }, (_, i) => {
            const x = ((i + 1) / 18) * W;
            return <line key={`v${i}`} x1={x} y1={0} x2={x} y2={H} stroke="#8b5cf6" strokeWidth="0.3" opacity="0.15" />;
          })}
          {Array.from({ length: 8 }, (_, i) => {
            const y = ((i + 1) / 9) * H;
            return <line key={`h${i}`} x1={0} y1={y} x2={W} y2={y} stroke="#8b5cf6" strokeWidth="0.3" opacity="0.15" />;
          })}

          {/* Country shapes */}
          {landPath && (
            <path
              d={landPath}
              fill="rgba(139,92,246,0.18)"
              stroke="rgba(139,92,246,0.45)"
              strokeWidth="0.5"
            />
          )}

          {/* Visitor pulses */}
          <defs>
            <radialGradient id="pulseGrad">
              <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#4ADE80" stopOpacity="0" />
            </radialGradient>
          </defs>

          {realVisitors.map(v => {
            const [cx, cy] = project(v.latitude!, v.longitude!, W, H);
            return (
              <g key={v.session_id}>
                {/* Pulse ring */}
                <circle cx={cx} cy={cy} r="8" fill="url(#pulseGrad)">
                  <animate attributeName="r" values="4;12;4" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0.15;0.7" dur="2s" repeatCount="indefinite" />
                </circle>
                {/* Dot */}
                <circle cx={cx} cy={cy} r="3" fill="#4ADE80" stroke="#0c0a1a" strokeWidth="1" />
              </g>
            );
          })}
        </svg>

        {/* Ambient glow overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-transparent to-violet-950/30 pointer-events-none" />

        {/* Empty state */}
        {realVisitors.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs text-muted-foreground/50">Aguardando visitantes com geolocalização…</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple equirectangular GeoJSON → SVG path converter
function geoToPath(geometry: any, w: number, h: number): string {
  if (!geometry) return "";
  const parts: string[] = [];

  const ring = (coords: number[][]) => {
    return coords
      .map((c, i) => {
        const [x, y] = project(c[1], c[0], w, h);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join("") + "Z";
  };

  if (geometry.type === "Polygon") {
    geometry.coordinates.forEach((r: number[][]) => parts.push(ring(r)));
  } else if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach((poly: number[][][]) =>
      poly.forEach((r: number[][]) => parts.push(ring(r)))
    );
  }
  return parts.join(" ");
}
