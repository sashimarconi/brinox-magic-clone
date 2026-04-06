import { useMemo } from "react";

interface LiveGlobeProps {
  visitors: { session_id: string; latitude?: number | null; longitude?: number | null }[];
  className?: string;
}

function sessionToCoords(sessionId: string): { lat: number; lng: number } {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = ((hash << 5) - hash) + sessionId.charCodeAt(i);
    hash |= 0;
  }
  const lat = -15 + ((Math.abs(hash) % 20) - 10);
  const lng = -50 + ((Math.abs(hash >> 8) % 20) - 10);
  return { lat, lng };
}

// Convert lat/lng to x/y percentage on a simple equirectangular projection
function toXY(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return { x, y };
}

export default function LiveGlobe({ visitors, className }: LiveGlobeProps) {
  const points = useMemo(() => {
    return visitors.map(v => {
      const hasReal = v.latitude != null && v.longitude != null && v.latitude !== 0 && v.longitude !== 0;
      const lat = hasReal ? v.latitude! : sessionToCoords(v.session_id).lat;
      const lng = hasReal ? v.longitude! : sessionToCoords(v.session_id).lng;
      return { ...toXY(lat, lng), id: v.session_id };
    });
  }, [visitors]);

  const serverPoint = toXY(-23.55, -46.63);

  return (
    <div className={className} style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      {/* Dark map background with grid */}
      <div className="absolute inset-0 bg-[#0c0a1a] rounded-xl overflow-hidden">
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          {/* Horizontal lines */}
          {Array.from({ length: 9 }, (_, i) => {
            const y = ((i + 1) / 10) * 100;
            return <line key={`h${i}`} x1="0%" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#8b5cf6" strokeWidth="0.5" />;
          })}
          {/* Vertical lines */}
          {Array.from({ length: 17 }, (_, i) => {
            const x = ((i + 1) / 18) * 100;
            return <line key={`v${i}`} x1={`${x}%`} y1="0%" x2={`${x}%`} y2="100%" stroke="#8b5cf6" strokeWidth="0.5" />;
          })}
        </svg>

        {/* Continent outlines - simplified SVG paths */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 500" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          {/* South America */}
          <path d="M280,220 L290,210 L310,215 L320,230 L315,260 L310,280 L300,310 L295,340 L285,360 L275,370 L270,350 L265,320 L270,290 L275,260 L280,240 Z" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
          {/* North America */}
          <path d="M180,80 L220,70 L260,75 L280,90 L285,110 L290,130 L280,150 L270,170 L260,180 L250,190 L240,185 L220,180 L200,170 L190,150 L180,130 L175,110 L180,90 Z" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
          {/* Africa */}
          <path d="M490,200 L510,190 L530,195 L540,210 L545,230 L540,260 L535,280 L525,300 L510,310 L500,300 L495,280 L490,260 L488,240 L490,220 Z" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
          {/* Europe */}
          <path d="M480,100 L500,95 L520,100 L530,110 L525,130 L515,140 L505,145 L495,140 L485,130 L480,120 Z" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
          {/* Asia */}
          <path d="M540,80 L600,70 L660,75 L720,85 L750,100 L760,120 L740,140 L710,160 L680,170 L650,175 L620,170 L590,160 L560,145 L545,130 L540,110 Z" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
          {/* Australia */}
          <path d="M740,290 L770,280 L800,285 L810,300 L800,320 L780,325 L760,320 L745,310 Z" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
        </svg>

        {/* Connection arcs from visitors to server */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {points.map(p => (
            <line
              key={`arc-${p.id}`}
              x1={`${p.x}%`}
              y1={`${p.y}%`}
              x2={`${serverPoint.x}%`}
              y2={`${serverPoint.y}%`}
              stroke="url(#arcGradient)"
              strokeWidth="1"
              opacity="0.4"
            />
          ))}
          <defs>
            <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
        </svg>

        {/* Visitor points */}
        {points.map(p => (
          <div
            key={p.id}
            className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 8px rgba(74, 222, 128, 0.6)",
            }}
          />
        ))}

        {/* Server point */}
        <div
          className="absolute w-3.5 h-3.5 rounded-full bg-violet-400 animate-pulse"
          style={{
            left: `${serverPoint.x}%`,
            top: `${serverPoint.y}%`,
            transform: "translate(-50%, -50%)",
            boxShadow: "0 0 12px rgba(167, 139, 250, 0.8)",
          }}
        />

        {/* Ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-transparent to-violet-950/30 pointer-events-none" />
      </div>
    </div>
  );
}
