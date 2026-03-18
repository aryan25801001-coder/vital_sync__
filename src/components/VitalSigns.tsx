'use client';
import { motion } from 'framer-motion';
import { Heart, Activity, Wind, Thermometer, Brain, Droplets, AlertTriangle } from 'lucide-react';

interface VitalsProps {
    vitals: {
        hr: number;
        bp: string;
        spo2: number;
        temp: number;
        rr: number;
        gcs: number;
    };
    severity: string;
}

function VitalCard({ icon, label, value, unit, isAlert, color }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    unit: string;
    isAlert?: boolean;
    color: string;
}) {
    return (
        <motion.div
            animate={isAlert ? { borderColor: ['rgba(255,59,107,0.3)', 'rgba(255,59,107,0.9)', 'rgba(255,59,107,0.3)'] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`glass-card p-3 flex flex-col gap-1 relative overflow-hidden ${isAlert ? 'border-red-500/50' : ''}`}
        >
            {isAlert && (
                <div className="absolute top-1 right-1">
                    <AlertTriangle size={10} className="text-red-400 animate-pulse" />
                </div>
            )}
            <div className={`flex items-center gap-1.5 text-xs ${color}`}>
                {icon}
                <span className="uppercase tracking-widest text-slate-600 text-[10px] font-bold">{label}</span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-2xl font-black font-mono tracking-tight ${isAlert ? 'text-red-600' : color}`}>{value}</span>
                <span className="text-xs text-slate-500 font-medium">{unit}</span>
            </div>
        </motion.div>
    );
}

export default function VitalSigns({ vitals, severity }: VitalsProps) {
    const isCritical = severity === 'critical';

    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <Activity size={14} className="text-cyan-400" />
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Live Vitals</span>
                {isCritical && (
                    <span className="ml-auto text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full pulse-red">
                        CRITICAL
                    </span>
                )}
            </div>

            <div className="grid grid-cols-3 gap-2">
                <VitalCard
                    icon={<Heart size={12} className="heartbeat" />}
                    label="HR"
                    value={vitals.hr}
                    unit="bpm"
                    isAlert={vitals.hr > 110 || vitals.hr < 50}
                    color="text-red-600"
                />
                <VitalCard
                    icon={<Activity size={12} />}
                    label="BP"
                    value={vitals.bp}
                    unit="mmHg"
                    isAlert={parseInt(vitals.bp) < 90}
                    color="text-purple-600"
                />
                <VitalCard
                    icon={<Droplets size={12} />}
                    label="SpO2"
                    value={vitals.spo2}
                    unit="%"
                    isAlert={vitals.spo2 < 95}
                    color="text-blue-700"
                />
                <VitalCard
                    icon={<Thermometer size={12} />}
                    label="Temp"
                    value={vitals.temp}
                    unit="°C"
                    isAlert={vitals.temp > 38.5}
                    color="text-orange-600"
                />
                <VitalCard
                    icon={<Wind size={12} />}
                    label="RR"
                    value={vitals.rr}
                    unit="/min"
                    isAlert={vitals.rr > 25}
                    color="text-teal-600"
                />
                <VitalCard
                    icon={<Brain size={12} />}
                    label="GCS"
                    value={vitals.gcs}
                    unit="/15"
                    isAlert={vitals.gcs < 10}
                    color="text-amber-600"
                />
            </div>

            {/* EKG simulation */}
            <div className="mt-3 rounded-xl bg-black/30 border border-green-500/20 p-2 overflow-hidden">
                <svg width="100%" height="40" viewBox="0 0 400 40">
                    <polyline
                        className="ekg-line"
                        points="0,20 40,20 60,20 70,5 80,35 90,10 100,20 140,20 180,20 190,5 200,35 210,10 220,20 260,20 300,20 310,5 320,35 330,10 340,20 400,20"
                        fill="none"
                        stroke="#00ff88"
                        strokeWidth="1.5"
                    />
                </svg>
                <div className="text-xs text-green-400/60 font-mono text-center -mt-1">ECG · LEAD II · 25mm/s</div>
            </div>
        </div>
    );
}
