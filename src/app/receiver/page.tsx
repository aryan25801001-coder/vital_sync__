'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    Activity, AlertTriangle, ArrowLeft, Brain, CheckCircle,
    Clock, FileText, Heart, Shield, Truck, User, Wifi, Zap
} from 'lucide-react';
import VitalSigns from '@/components/VitalSigns';
import { MOCK_PATIENTS, MOCK_REFERRALS } from '@/data/mockData';
import { useRealtime } from '@/hooks/useSocket';

export default function ReceiverPage() {
    const { notifications } = useRealtime();
    const [activeReferral, setActiveReferral] = useState<any>(MOCK_REFERRALS[0]);
    const [activePatient, setActivePatient] = useState<any>(MOCK_PATIENTS[0]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [packetReceived, setPacketReceived] = useState(false);
    const [countdown, setCountdown] = useState(480); // 8 min in seconds
    const [readinessChecked, setReadinessChecked] = useState<Record<string, boolean>>({});
    const [incomingAlert, setIncomingAlert] = useState<any>(null);
    const [showIncomingPopup, setShowIncomingPopup] = useState(false);

    useEffect(() => {
        if (notifications.length > 0) {
            const latest = notifications[0];
            if (latest.type === 'new_referral') {
                // Use detailed patient data if available (synced from sender)
                if (latest.patientData) {
                    setActivePatient(latest.patientData);
                    setActiveReferral({
                        id: latest.id,
                        fromHospital: latest.patientData.currentHospital || 'Sender',
                        status: 'pending',
                        initiatedAt: latest.timestamp,
                        eta: 15,
                        urgency: latest.urgency
                    });
                    setPacketReceived(true);
                    
                    // Trigger visual alert
                    setIncomingAlert(latest);
                    setShowIncomingPopup(true);
                } else {
                    // Fallback to mock data search
                    const p = MOCK_PATIENTS.find(p => p.id === latest.referralId) || {
                        id: latest.referralId,
                        name: 'Synced Patient',
                        age: '??',
                        bloodType: '??',
                        condition: latest.message,
                        vitals: { hr: 90, bp: '120/80', spo2: 98, gcs: 15 },
                        severity: latest.urgency,
                        allergies: [],
                    };
                    setActivePatient(p);
                    setActiveReferral({
                        ...latest,
                        fromHospital: latest.message.split('from ')[1]?.split(' →')[0] || 'Sender'
                    });
                }
            }
        }
    }, [notifications]);

    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        // Simulate packet arrival
        const t = setTimeout(() => setPacketReceived(true), 2000);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (countdown <= 0) return;
        const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
        return () => clearInterval(t);
    }, [countdown]);

    const toggleCheck = (item: string) => {
        setReadinessChecked(prev => ({ ...prev, [item]: !prev[item] }));
    };

    const readinessItems = [
        { id: 'trauma_bay', label: 'Trauma Bay 3 Cleared', category: 'room', icon: '🏥' },
        { id: 'neuro_team', label: 'Neurosurgery Team Alerted', category: 'staff', icon: '👨‍⚕️' },
        { id: 'ct_ready', label: 'CT Scanner Pre-warmed', category: 'equipment', icon: '📡' },
        { id: 'blood_ready', label: 'Type B+ Blood Ready (4 units)', category: 'supplies', icon: '🩸' },
        { id: 'icu_reserved', label: 'ICU Bed 4A Reserved', category: 'room', icon: '🛏️' },
        { id: 'penicillin_alert', label: 'Penicillin Allergy Flagged System-wide', category: 'alert', icon: '⚠️' },
        { id: 'anesthesia', label: 'Anesthesia Team On Standby', category: 'staff', icon: '💉' },
        { id: 'or_ready', label: 'OR #2 Prepped for Craniotomy', category: 'equipment', icon: '🔬' },
        { id: 'ventilator', label: 'Ventilator Unit Sync\'d & Tested', category: 'equipment', icon: '🛠️' },
        { id: 'ecg_bypass', label: 'ECG Bypass Protocol Initialized', category: 'alert', icon: '📉' },
        { id: 'pharmacy_priority', label: 'Pharmacy Stat Order Processed', category: 'supplies', icon: '💊' },
        { id: 'lab_priority', label: 'Lab Techs on High-Priority Alert', category: 'staff', icon: '🧪' },
        { id: 'rapid_infuser', label: 'Rapid Infuser System Prepared', category: 'equipment', icon: '⚡' },
        { id: 'xray_notify', label: 'X-Ray Department Notified', category: 'staff', icon: '📷' },
        { id: 'social_worker', label: 'Social Worker Assigned to Case', category: 'staff', icon: '🤝' },
        { id: 'belongings', label: 'Patient Belongings Inventory Form Ready', category: 'supplies', icon: '🎒' },
    ];

    const readinessCount = Object.values(readinessChecked).filter(Boolean).length;
    const readinessPct = Math.round((readinessCount / readinessItems.length) * 100);

    const mins = Math.floor(countdown / 60);
    const secs = countdown % 60;
    const isUrgent = countdown < 120;

    return (
        <div className="min-h-screen grid-bg">
            {/* Top Bar */}
            <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
                <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-blue-700 transition-colors text-sm font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                            <ArrowLeft size={14} />
                            Exit System
                        </Link>
                        <div className="w-px h-4 bg-slate-300" />
                        <div className="flex items-center gap-2">
                            <Activity size={18} className="text-blue-700" />
                            <span className="font-extrabold text-slate-900 tracking-tight text-lg">Vital<span className="text-blue-600">Sync</span></span>
                            <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-black tracking-widest uppercase ml-1">RECEIVER NODE</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs">
                        <div className="flex items-center gap-1.5 font-black text-blue-700 border-2 border-blue-200 px-3 py-1.5 rounded-full bg-blue-50 tracking-wide">
                            UNIT: TRAUMA CENTER
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-emerald-700 font-black tracking-wide uppercase">ACTIVE SYNC</span>
                        </div>
                        <div suppressHydrationWarning className="font-mono text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg font-bold shadow-sm">{currentTime.toLocaleTimeString()}</div>
                    </div>
                </div>
            </header>

            {/* Pre-arrival packet banner */}
            <AnimatePresence>
                {packetReceived && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="bg-teal-500/10 border-b border-teal-500/30 px-6 py-3 flex items-center gap-3"
                    >
                        <CheckCircle size={16} className="text-teal-600" />
                        <span className="text-sm text-teal-700 font-bold uppercase tracking-tight">Pre-arrival Clinical Packet Integrated</span>
                        <span className="text-sm text-slate-500">— Patient vitals, imaging, and allergies synced. Zero manual data entry required.</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Incoming Alert Popup */}
            <AnimatePresence>
                {showIncomingPopup && (
                    <motion.div
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        className="fixed top-20 right-6 z-[100] w-96 glass-card p-0 overflow-hidden border-red-500/50 shadow-[0_0_40px_rgba(255,59,107,0.3)]"
                    >
                        <div className="bg-red-500/20 px-4 py-2 border-b border-red-500/30 flex justify-between items-center">
                            <span className="text-[10px] font-black text-red-400 tracking-widest uppercase flex items-center gap-2">
                                <Zap size={12} className="animate-pulse" />
                                Urgent Sync Alert
                            </span>
                            <button onClick={() => setShowIncomingPopup(false)} className="text-slate-500 hover:text-white">
                                <Zap size={14} />
                            </button>
                        </div>
                        <div className="p-4">
                            <h4 className="text-white font-bold text-lg mb-1">{incomingAlert?.patientData?.name || 'Incoming Patient'}</h4>
                            <p className="text-xs text-slate-400 mb-3">{incomingAlert?.message}</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowIncomingPopup(false)}
                                    className="flex-1 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-500 transition-all shadow-[0_0_15px_rgba(255,0,0,0.3)]"
                                >
                                    VIEW FULL CASE
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

                {/* ETA Countdown + Patient Banner */}
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Countdown */}
                    <motion.div
                        animate={isUrgent ? { borderColor: ['rgba(255,59,107,0.3)', 'rgba(255,59,107,0.9)', 'rgba(255,59,107,0.3)'] } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                        className={`glass-card p-6 flex flex-col items-center justify-center text-center ${isUrgent ? 'border-red-500/50' : 'border-purple-500/30'}`}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <Truck size={14} className={isUrgent ? 'text-red-600' : 'text-purple-600'} />
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Ambulance ETA</span>
                        </div>
                        <div
                            className="text-6xl font-black font-mono"
                            style={{
                                color: isUrgent ? '#dc2626' : '#2563eb',
                            }}
                        >
                            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                        </div>
                        <div className="text-xs text-slate-500 mt-2">Unit AMB-07 · {activeReferral.fromHospital}</div>
                        <div className="mt-3 w-full bg-slate-800 rounded-full h-2">
                            <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{
                                    width: `${100 - (countdown / 480) * 100}%`,
                                    background: isUrgent ? '#dc2626' : '#2563eb',
                                }}
                            />
                        </div>
                    </motion.div>

                    {/* Patient Identity */}
                    <div className="glass-card p-6 md:col-span-2">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-xs text-red-400 font-bold uppercase tracking-widest">INCOMING CRITICAL PATIENT</span>
                                </div>
                                <h1 className="text-3xl font-black text-slate-900">{activePatient.name}</h1>
                                <div className="text-slate-600 text-sm mt-2 font-medium">
                                    Age {activePatient.age} · Blood Group: <span className="font-bold text-slate-800">{activePatient.bloodType}</span> · MRN: <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">{activePatient.mrn || 'PENDING'}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <div className={`text-xs font-black px-3 py-1.5 rounded-full border-2 ${activePatient.severity === 'critical' ? 'border-red-500 text-red-700 bg-red-50 shadow-[0_0_10px_rgba(239,68,68,0.2)] pulse-red' : 'border-orange-500 text-orange-700 bg-orange-50'}`}>
                                    {activePatient.severity === 'critical' ? 'ESI LEVEL 1 — CRITICAL' : 'ESI LEVEL 2 — HIGH'}
                                </div>
                                <div className="text-xs text-slate-600 font-bold mt-1">Triage Score: {activePatient.triageLevel || 1}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm mt-4">
                            <div>
                                <div className="text-slate-600 text-xs font-semibold mb-1 uppercase tracking-wider">Condition</div>
                                <div className="font-bold text-red-600 text-base">{activePatient.condition}</div>
                            </div>
                            <div>
                                <div className="text-slate-600 text-xs font-semibold mb-1 uppercase tracking-wider">⚠️ Allergies</div>
                                <div className="font-bold text-amber-700 text-base">{activePatient.allergies?.join(', ') || 'NKDA'}</div>
                            </div>
                            <div>
                                <div className="text-slate-600 text-xs font-semibold mb-1 uppercase tracking-wider">From Hospital</div>
                                <div className="font-bold text-slate-700 text-base">{activePatient.currentHospital}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vitals + Readiness */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Live Vitals */}
                    <div className="glass-card p-5">
                        <VitalSigns vitals={activePatient.vitals} severity={activePatient.severity} />
                        <div className="mt-4 pt-4 border-t border-slate-800">
                            <div className="text-xs text-slate-500 mb-2">FHIR Attachments — Pre-arrived</div>
                            <div className="space-y-2">
                                {[
                                    { name: 'CT_Head_DICOM.dcm', type: 'CT Scan', size: '48.2 MB', status: '✅ Synced' },
                                    { name: 'ER_Report_Admission.pdf', type: 'ER Report', size: '1.4 MB', status: '✅ Synced' },
                                    { name: 'BloodWork_CBC_BMP.pdf', type: 'Lab Results', size: '0.8 MB', status: '✅ Synced' },
                                ].map(f => (
                                    <div key={f.name} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 hover:bg-white transition-colors shadow-sm">
                                        <div className="bg-teal-100 p-2 rounded-lg">
                                            <FileText size={16} className="text-teal-700" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-mono text-slate-900 font-bold truncate">{f.name}</div>
                                            <div className="text-xs text-slate-600 font-medium">{f.type} · {f.size}</div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[10px] text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-tighter">{f.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Readiness Checklist */}
                    <div className="glass-card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Shield size={14} className="text-cyan-600" />
                                <span className="text-xs font-bold text-cyan-700 uppercase tracking-widest">Pre-Arrival Readiness</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div
                                    className="text-sm font-black font-mono"
                                    style={{ color: readinessPct >= 75 ? '#059669' : readinessPct >= 50 ? '#d97706' : '#dc2626' }}
                                >
                                    {readinessPct}%
                                </div>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-slate-800 rounded-full h-2 mb-4">
                            <motion.div
                                animate={{ width: `${readinessPct}%` }}
                                className="h-full rounded-full transition-all"
                                style={{
                                    background: readinessPct >= 75 ? '#10b981' : readinessPct >= 50 ? '#f59e0b' : '#ef4444',
                                }}
                            />
                        </div>

                        <div className="space-y-2 overflow-y-auto max-h-72">
                            {readinessItems.map((item) => (
                                <motion.div
                                    key={item.id}
                                    whileHover={{ scale: 1.01 }}
                                    onClick={() => toggleCheck(item.id)}
                                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${readinessChecked[item.id]
                                        ? 'bg-emerald-50 border border-emerald-200'
                                        : 'bg-white border border-slate-200 hover:border-teal-500/50 shadow-sm'
                                        }`}
                                >
                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${readinessChecked[item.id] ? 'border-emerald-500 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-slate-300 bg-slate-50'
                                        }`}>
                                        {readinessChecked[item.id] && <CheckCircle size={14} className="text-white" />}
                                    </div>
                                    <span className="text-base">{item.icon}</span>
                                    <span className={`text-sm flex-1 font-bold ${readinessChecked[item.id] ? 'text-slate-400' : 'text-slate-900'}`}>
                                        {item.label}
                                    </span>
                                </motion.div>
                            ))}
                        </div>

                        {readinessPct === 100 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-4 p-3 rounded-xl bg-green-500/15 border border-green-500/40 text-center"
                            >
                                <div className="text-green-400 font-bold">✅ TEAM READY — AWAITING PATIENT</div>
                                <div className="text-xs text-slate-400 mt-1">All systems GO for incoming transfer</div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Case Summary */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Brain size={14} className="text-purple-600" />
                        <span className="text-xs font-bold text-purple-700 uppercase tracking-widest">AI-Generated Pre-Arrival Brief</span>
                        <span className="ml-2 text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-bold">Powered by VitalSync Protocol Engine</span>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6 text-sm">
                        <div className="bg-red-50/50 p-3 rounded-xl border border-red-100">
                            <h3 className="font-extrabold text-red-700 mb-2 uppercase tracking-tight flex items-center gap-1.5">
                                <AlertTriangle size={14} /> Critical Alerts
                            </h3>
                            <ul className="space-y-1.5 text-slate-800 font-medium">
                                <li>• GCS score {activePatient.vitals.gcs} — severe trauma likely</li>
                                <li>• SpO₂ {activePatient.vitals.spo2}% — supplemental O₂ required</li>
                                <li>• BP {activePatient.vitals.bp} — hemodynamic monitoring needed</li>
                                <li>• Allergy Flag: {activePatient.allergies?.join(', ') || 'NONE'}</li>
                            </ul>
                        </div>
                        <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                            <h3 className="font-extrabold text-amber-800 mb-2 uppercase tracking-tight flex items-center gap-1.5">
                                <Activity size={14} /> Tests Already Done
                            </h3>
                            <ul className="space-y-1.5 text-slate-800 font-medium">
                                <li>✅ CT Head (Non-contrast) — Synced</li>
                                <li>✅ CBC, BMP, Coagulation Panel</li>
                                <li>✅ Blood Type & Cross-match (B+)</li>
                                <li>✅ 12-Lead ECG — Normal Sinus</li>
                                <li>⏳ CT Chest/Abdomen — pending</li>
                            </ul>
                        </div>
                        <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                            <h3 className="font-extrabold text-emerald-800 mb-2 uppercase tracking-tight flex items-center gap-1.5">
                                <CheckCircle size={14} /> Recommended Actions
                            </h3>
                            <ul className="space-y-1.5 text-slate-800 font-medium">
                                <li>• Neurosurgery consult IMMEDIATELY on arrival</li>
                                <li>• Prepare OR for possible craniotomy</li>
                                <li>• 2 large-bore IVs, transfusion protocol</li>
                                <li>• ICP monitoring kit to trauma bay</li>
                                <li>• No PO, NPO status from arrival</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
