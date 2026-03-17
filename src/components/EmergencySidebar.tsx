'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Wifi, WifiOff, X } from 'lucide-react';
import { useRealtime } from '@/hooks/useSocket';
import { useState } from 'react';

function timeAgo(date: Date) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
}

export default function EmergencySidebar() {
    const { notifications, isConnected, newAlert } = useRealtime();
    const [dismissed, setDismissed] = useState<string[]>([]);

    const urgencyColors = {
        critical: { border: 'border-red-500', bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-500' },
        high: { border: 'border-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-500' },
        moderate: { border: 'border-cyan-500', bg: 'bg-cyan-500/10', text: 'text-cyan-400', dot: 'bg-cyan-500' },
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-cyan-500/20">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Bell size={16} className="text-cyan-400" />
                        <span className="text-sm font-semibold text-cyan-300 uppercase tracking-widest">Live Feed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {isConnected ? (
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                <Wifi size={12} className="text-green-400" />
                            </div>
                        ) : (
                            <WifiOff size={12} className="text-red-400" />
                        )}
                    </div>
                </div>
                <div className="text-xs text-slate-500">
                    {notifications.length} active events
                </div>
            </div>

            {/* New Alert Banner */}
            <AnimatePresence>
                {newAlert && !dismissed.includes(newAlert.id) && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="m-3 rounded-xl overflow-hidden"
                    >
                        <div className="blink-alert border border-red-500/60 rounded-xl p-3 relative">
                            <button
                                onClick={() => setDismissed((p) => [...p, newAlert.id])}
                                className="absolute top-2 right-2 text-slate-400 hover:text-white"
                            >
                                <X size={12} />
                            </button>
                            <div className="flex items-start gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 animate-pulse flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-red-300">{newAlert.title}</p>
                                    <p className="text-xs text-slate-300 mt-0.5">{newAlert.message}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {notifications.map((notif, i) => {
                    const colors = urgencyColors[notif.urgency];
                    return (
                        <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`rounded-xl p-3 border ${colors.border} ${colors.bg} cursor-pointer hover:brightness-110 transition-all`}
                        >
                            <div className="flex items-start gap-2">
                                <div className={`w-2 h-2 rounded-full ${colors.dot} mt-1.5 flex-shrink-0`} />
                                <div className="min-w-0">
                                    <p className={`text-xs font-semibold ${colors.text} leading-tight`}>{notif.title}</p>
                                    <p className="text-xs text-slate-400 mt-0.5 leading-tight">{notif.message}</p>
                                    <p className="text-xs text-slate-600 mt-1">{timeAgo(notif.timestamp)}</p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Footer status */}
            <div className="p-3 border-t border-cyan-500/10">
                <div className="text-xs text-slate-600 text-center">
                    Socket.io · Zero-latency handshake
                </div>
            </div>
        </div>
    );
}
