'use client';
import { motion } from 'framer-motion';
import { HospitalScore } from '@/lib/algorithms/findOptimalHospital';
import { MapPin, Clock, Star, Zap, BedDouble } from 'lucide-react';

interface HospitalCardProps {
    data: HospitalScore;
    rank: number;
    onSelect?: () => void;
}

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
    return (
        <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(value / max) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: color }}
            />
        </div>
    );
}

export default function HospitalCard({ data, rank, onSelect }: HospitalCardProps) {
    const { hospital, totalScore, breakdown, recommendation, eta } = data;

    const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32'];
    const rankColor = rankColors[rank - 1] || '#00f5ff';

    const scoreColor =
        totalScore >= 70 ? '#00ff88' :
            totalScore >= 50 ? '#ffa500' :
                totalScore >= 30 ? '#ff8c00' : '#ff3b6b';

    const bedPct = Math.round((hospital.availableBeds / hospital.totalBeds) * 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rank * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            onClick={onSelect}
            className="glass-card p-4 cursor-pointer hover:border-cyan-400/40 transition-all relative overflow-hidden"
        >
            {/* Rank badge */}
            <div
                className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: rankColor + '22', border: `1px solid ${rankColor}`, color: rankColor }}
            >
                #{rank}
            </div>

            {/* Score ring */}
            <div className="flex items-start gap-3 mb-3">
                <div className="relative">
                    <svg width="52" height="52" className="rotate-[-90deg]">
                        <circle cx="26" cy="26" r="22" fill="none" stroke="#1a2633" strokeWidth="4" />
                        <circle
                            cx="26" cy="26" r="22"
                            fill="none"
                            stroke={scoreColor}
                            strokeWidth="4"
                            strokeDasharray={`${(totalScore / 100) * 138} 138`}
                            strokeLinecap="round"
                            style={{ filter: `drop-shadow(0 0 4px ${scoreColor})` }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center rotate-90">
                        <span className="text-xs font-bold font-mono" style={{ color: scoreColor }}>{Math.round(totalScore)}</span>
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white leading-tight">{hospital.name}</h3>
                    {hospital.traumaCenter && (
                        <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-md">
                            Level I Trauma
                        </span>
                    )}
                </div>
            </div>

            {/* Score breakdown */}
            <div className="space-y-1.5 mb-3">
                <div>
                    <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-500">Specialization</span>
                        <span className="text-cyan-400 font-mono">{breakdown.specializationScore}/40</span>
                    </div>
                    <ScoreBar value={breakdown.specializationScore} max={40} color="#00f5ff" />
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-500">Distance</span>
                        <span className="text-purple-400 font-mono">{breakdown.distanceScore}/30</span>
                    </div>
                    <ScoreBar value={breakdown.distanceScore} max={30} color="#a855f7" />
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-500">Resources</span>
                        <span className="text-green-400 font-mono">{breakdown.resourceScore}/20</span>
                    </div>
                    <ScoreBar value={Math.max(0, breakdown.resourceScore)} max={20} color="#00ff88" />
                </div>
            </div>

            {/* Stats row */}
            <div className="flex gap-3 text-xs text-slate-400 mb-3">
                <div className="flex items-center gap-1">
                    <MapPin size={10} className="text-cyan-400" />
                    {hospital.distanceKm} km
                </div>
                <div className="flex items-center gap-1">
                    <Clock size={10} className="text-amber-400" />
                    {eta} min
                </div>
                <div className="flex items-center gap-1">
                    <BedDouble size={10} className="text-green-400" />
                    {hospital.availableBeds} beds
                </div>
                <div className="flex items-center gap-1">
                    <Star size={10} className="text-yellow-400" />
                    {hospital.successRate}%
                </div>
            </div>

            {/* Bed occupancy */}
            <div className="mb-3">
                <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-500">Bed Occupancy</span>
                    <span className={bedPct > 80 ? 'text-red-400' : bedPct > 60 ? 'text-amber-400' : 'text-green-400'}>
                        {100 - bedPct}% free
                    </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${bedPct}%` }}
                        className="h-full rounded-full"
                        style={{ background: bedPct > 80 ? '#ff3b6b' : bedPct > 60 ? '#ffa500' : '#00ff88' }}
                    />
                </div>
            </div>

            {/* Recommendation */}
            <div className="text-xs text-slate-400 leading-tight border-t border-slate-700/50 pt-2">
                {recommendation}
            </div>

            {/* Specialists */}
            <div className="mt-2 flex flex-wrap gap-1">
                {hospital.specialistsOnDuty.map((s) => (
                    <span key={s} className="text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                        {s}
                    </span>
                ))}
            </div>

            {/* CTA */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
                className="mt-3 w-full py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-black flex items-center justify-center gap-1"
                style={{ background: `linear-gradient(135deg, ${scoreColor}, ${scoreColor}99)`, boxShadow: `0 0 15px ${scoreColor}44` }}
            >
                <Zap size={10} />
                Initiate Handshake
            </motion.button>
        </motion.div>
    );
}
