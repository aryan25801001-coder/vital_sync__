'use client';
import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface AmbulanceTrackerProps {
    fromLat: number;
    fromLng: number;
    toLat: number;
    toLng: number;
    progress?: number; // 0-100
}

// Coordinate to pixel converter for SVG map
function latLngToXY(lat: number, lng: number, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }, width: number, height: number) {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * width;
    const y = height - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * height;
    return { x, y };
}

export default function AmbulanceTracker({ fromLat, fromLng, toLat, toLng, progress = 0 }: AmbulanceTrackerProps) {
    const [animProgress, setAnimProgress] = useState(progress);
    const animRef = useRef<NodeJS.Timeout | null>(null);

    const bounds = {
        minLat: Math.min(fromLat, toLat) - 0.05,
        maxLat: Math.max(fromLat, toLat) + 0.05,
        minLng: Math.min(fromLng, toLng) - 0.05,
        maxLng: Math.max(fromLng, toLng) + 0.05,
    };

    const W = 480, H = 280;

    const from = latLngToXY(fromLat, fromLng, bounds, W, H);
    const to = latLngToXY(toLat, toLng, bounds, W, H);

    // Interpolate ambulance position
    const ambX = from.x + (to.x - from.x) * (animProgress / 100);
    const ambY = from.y + (to.y - from.y) * (animProgress / 100);

    useEffect(() => {
        let p = 0;
        animRef.current = setInterval(() => {
            p = Math.min(p + 0.4, 95);
            setAnimProgress(p);
            if (p >= 95) clearInterval(animRef.current!);
        }, 100);
        return () => { if (animRef.current) clearInterval(animRef.current); };
    }, []);

    return (
        <div className="glass-card p-4 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
                <Navigation size={14} className="text-cyan-400" />
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Live Ambulance Track</span>
                <div className="ml-auto flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-red-400 font-mono">LIVE</span>
                </div>
            </div>

            {/* SVG Map */}
            <div className="relative rounded-xl overflow-hidden border border-cyan-500/20" style={{ background: '#060d1a' }}>
                <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
                    {/* Grid */}
                    <defs>
                        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(0,245,255,0.05)" strokeWidth="1" />
                        </pattern>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>
                    <rect width={W} height={H} fill="url(#grid)" />

                    {/* Route dashed line */}
                    <line
                        x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                        stroke="rgba(0,245,255,0.3)"
                        strokeWidth="2"
                        strokeDasharray="8,6"
                    />

                    {/* Progress line (traveled) */}
                    <line
                        x1={from.x} y1={from.y} x2={ambX} y2={ambY}
                        stroke="#00f5ff"
                        strokeWidth="3"
                        filter="url(#glow)"
                    />

                    {/* From Hospital */}
                    <circle cx={from.x} cy={from.y} r="12" fill="rgba(255,59,107,0.2)" stroke="#ff3b6b" strokeWidth="2" />
                    <circle cx={from.x} cy={from.y} r="6" fill="#ff3b6b" />
                    <text x={from.x} y={from.y - 18} textAnchor="middle" fill="#ff3b6b" fontSize="9" fontFamily="monospace">FROM</text>

                    {/* To Hospital */}
                    <circle cx={to.x} cy={to.y} r="12" fill="rgba(0,255,136,0.2)" stroke="#00ff88" strokeWidth="2" />
                    <circle cx={to.x} cy={to.y} r="6" fill="#00ff88" />
                    <text x={to.x} y={to.y - 18} textAnchor="middle" fill="#00ff88" fontSize="9" fontFamily="monospace">DEST</text>

                    {/* Ambulance Marker */}
                    <g transform={`translate(${ambX}, ${ambY})`}>
                        <circle r="14" fill="rgba(0,245,255,0.15)" stroke="#00f5ff" strokeWidth="2" />
                        <circle r="8" fill="#00f5ff" opacity="0.9" />
                        <circle r="14" fill="none" stroke="#00f5ff" strokeWidth="1" opacity="0.5">
                            <animate attributeName="r" values="14;24;14" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <text textAnchor="middle" dy="4" fill="#000" fontSize="9" fontWeight="bold" fontFamily="monospace">AMB</text>
                    </g>
                </svg>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
                    <div
                        className="h-full bg-cyan-400 transition-all duration-300"
                        style={{ width: `${animProgress}%`, boxShadow: '0 0 8px #00f5ff' }}
                    />
                </div>
            </div>

            {/* Stats row */}
            <div className="flex justify-between mt-3 text-xs text-slate-400">
                <span>Progress: <strong className="text-cyan-400">{Math.round(animProgress)}%</strong></span>
                <span>ETA: <strong className="text-amber-400">{Math.max(0, Math.round((1 - animProgress / 100) * 18))} min</strong></span>
                <span>Unit: <strong className="text-green-400">AMB-07</strong></span>
            </div>
        </div>
    );
}
