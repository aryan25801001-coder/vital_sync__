'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Activity, Shield, ArrowRight, Lock, Building2 } from 'lucide-react';

export default function LoginPage() {
    const [selectedRole, setSelectedRole] = useState<'A' | 'B' | null>(null);
    const router = useRouter();

    const handleLogin = (role: 'A' | 'B') => {
        // Mock login - in a real app, this would be actual auth
        if (role === 'A') {
            router.push('/dashboard');
        } else {
            router.push('/receiver');
        }
    };

    return (
        <div className="min-h-screen grid-bg flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full glass-card p-8 border-cyan-500/20"
            >
                <div className="flex flex-col items-center mb-10">
                    <div className="relative mb-4">
                        <Activity size={40} className="text-cyan-400" style={{ filter: 'drop-shadow(0 0 12px #00f5ff)' }} />
                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    </div>
                    <h1 className="text-2xl font-black text-white">Vital<span className="text-cyan-400">Sync</span> Auth</h1>
                    <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">Mission-Critical Access Control</p>
                </div>

                <div className="space-y-4">
                    <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(0, 245, 255, 0.1)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleLogin('A')}
                        className="w-full flex items-center gap-4 p-5 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 text-left transition-all group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:border-cyan-400">
                            <Building2 className="text-cyan-400" />
                        </div>
                        <div className="flex-1">
                            <div className="text-white font-bold">Hospital A (SENDER)</div>
                            <div className="text-xs text-slate-500">Trauma Centers & Primary Care</div>
                        </div>
                        <ArrowRight size={18} className="text-cyan-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(168, 85, 247, 0.1)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleLogin('B')}
                        className="w-full flex items-center gap-4 p-5 rounded-2xl border border-purple-500/30 bg-purple-500/5 text-left transition-all group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:border-purple-400">
                            <Shield className="text-purple-400" />
                        </div>
                        <div className="flex-1">
                            <div className="text-white font-bold">Hospital B (RECEIVER)</div>
                            <div className="text-xs text-slate-500">Specialist Centers & ICU Facilities</div>
                        </div>
                        <ArrowRight size={18} className="text-purple-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </motion.button>
                </div>

                <div className="mt-10 flex items-center gap-2 justify-center text-[10px] text-slate-600 font-mono tracking-tighter">
                    <Lock size={10} />
                    AES-256 SECURED · HL7 FHIR COMPLIANT · ZERO TRUST PROTOCOL
                </div>
            </motion.div>
        </div>
    );
}
