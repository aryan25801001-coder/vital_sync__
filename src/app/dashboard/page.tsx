'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    Activity, AlertTriangle, ArrowLeft, BedDouble, CheckCircle,
    Clock, Cpu, Globe, Heart, Navigation, Radio, RefreshCw,
    Shield, Truck, Users, Zap, X
} from 'lucide-react';
import EmergencySidebar from '@/components/EmergencySidebar';
import AmbulanceTracker from '@/components/AmbulanceTracker';
import VitalSigns from '@/components/VitalSigns';
import HospitalCard from '@/components/HospitalCard';
import { MOCK_HOSPITALS, MOCK_PATIENTS, MOCK_REFERRALS } from '@/data/mockData';
import { findOptimalHospital, PatientCase } from '@/lib/algorithms/findOptimalHospital';

const CONDITION_MAP: Record<string, PatientCase> = {
    p001: {
        condition: 'trauma',
        severity: 'critical',
        requiredSpecialists: ['Neurosurgery', 'Trauma Surgery'],
        currentLat: 28.62,
        currentLng: 77.19,
        needsIcu: true,
        needsHeli: false,
    },
    p002: {
        condition: 'cardiac',
        severity: 'critical',
        requiredSpecialists: ['Cardiology', 'Interventional Cardiology'],
        currentLat: 28.53,
        currentLng: 77.39,
        needsIcu: true,
        needsHeli: false,
    },
    p003: {
        condition: 'pediatric',
        severity: 'high',
        requiredSpecialists: ['Pediatrics', 'Pediatric Surgery'],
        currentLat: 28.70,
        currentLng: 77.10,
        needsIcu: false,
        needsHeli: false,
    },
};

const STATUS_CONFIG = {
    pending: { label: 'PENDING', color: '#d97706', bg: 'bg-orange-500/5', border: 'border-orange-500/20' },
    accepted: { label: 'ACCEPTED', color: '#059669', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
    'en-route': { label: 'EN ROUTE', color: '#2563eb', bg: 'bg-blue-500/5', border: 'border-blue-500/20' },
    arrived: { label: 'ARRIVED', color: '#0d9488', bg: 'bg-teal-500/5', border: 'border-teal-500/20' },
    cancelled: { label: 'CANCELLED', color: '#dc2626', bg: 'bg-red-500/5', border: 'border-red-500/20' },
};

export default function DashboardPage() {
    const [patients, setPatients] = useState(MOCK_PATIENTS);
    const [selectedPatient, setSelectedPatient] = useState(MOCK_PATIENTS[0]);
    const [showDiscovery, setShowDiscovery] = useState(false);
    const [hospitalRanks, setHospitalRanks] = useState<ReturnType<typeof findOptimalHospital>>([]);
    const [activeReferrals, setActiveReferrals] = useState(MOCK_REFERRALS);
    const [time, setTime] = useState(new Date());
    const [selectedReferral, setSelectedReferral] = useState(MOCK_REFERRALS[0]);
    const [showHandshake, setShowHandshake] = useState(false);
    const [showManualForm, setShowManualForm] = useState(false);
    const [showTransferForm, setShowTransferForm] = useState(false);

    // Manual Transfer State
    const [transferData, setTransferData] = useState({
        toHospital: '',
        eta: '15',
        priority: 'critical'
    });

    // Manual Patient Form State
    const [manualPatient, setManualPatient] = useState({
        name: '',
        age: '',
        bloodType: 'O+',
        allergiesStr: '',
        condition: 'Trauma',
        severity: 'critical',
        hr: '80',
        bp: '120/80',
        spo2: '98',
        gcs: '15'
    });

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newPatient = {
            id: `p_manual_${Date.now()}`,
            name: manualPatient.name || 'Unknown Patient',
            age: parseInt(manualPatient.age) || 0,
            bloodType: manualPatient.bloodType || 'O+',
            condition: manualPatient.condition,
            severity: manualPatient.severity as 'critical' | 'high',
            currentHospital: 'Sir Ganga Ram Hospital',
            mrn: `MRN-${Math.floor(Math.random() * 9000) + 1000}`,
            triageLevel: manualPatient.severity === 'critical' ? 1 : 2,
            vitals: {
                hr: parseInt(manualPatient.hr),
                bp: manualPatient.bp,
                spo2: parseInt(manualPatient.spo2),
                gcs: parseInt(manualPatient.gcs),
                temp: 37,
                rr: 16
            },
            allergies: manualPatient.allergiesStr ? manualPatient.allergiesStr.split(',').map(s => s.trim()) : [],
            admittedAt: new Date().toISOString()
        };
        setPatients(prev => [newPatient, ...prev]);
        setSelectedPatient(newPatient);
        setShowManualForm(false);

        // SYNC TO BACKEND (Notify Receiver of new manual intake)
        fetch('/api/sync/referrals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: newPatient.id,
                patientId: newPatient.mrn,
                fromHospital: newPatient.currentHospital,
                toHospital: 'ALL (Intake notification)', // Broadcast that a patient is ready
                status: 'pending',
                urgency: newPatient.severity,
                condition: newPatient.condition,
                fullPatientData: newPatient
            })
        }).catch(err => console.error('Sync failed:', err));
        // Clear form
        setManualPatient({
            name: '',
            age: '',
            bloodType: 'O+',
            allergiesStr: '',
            condition: 'Trauma',
            severity: 'critical',
            hr: '80',
            bp: '120/80',
            spo2: '98',
            gcs: '15'
        });
    };

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const runDiscovery = () => {
        // Find or create condition map for patientCase
        let cond = selectedPatient.condition.toLowerCase();
        if (cond.includes('trauma')) cond = 'trauma';
        else if (cond.includes('cardiac') || cond.includes('stemi') || cond.includes('mi')) cond = 'cardiac';
        else if (cond.includes('pediatric')) cond = 'pediatric';

        const patientCase: PatientCase = CONDITION_MAP[selectedPatient.id] || {
            condition: cond as any,
            severity: selectedPatient.severity as any,
            requiredSpecialists: [],
            currentLat: 28.62,
            currentLng: 77.19,
            needsIcu: selectedPatient.severity === 'critical',
            needsHeli: false
        };
        const results = findOptimalHospital(patientCase, MOCK_HOSPITALS);
        setHospitalRanks(results);
        setShowDiscovery(true);
        setTimeout(() => {
            document.getElementById('discovery-results')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    };

    const initiateHandshake = (hospitalId: string) => {
        const hospital = MOCK_HOSPITALS.find(h => h.id === hospitalId);
        if (!hospital) return;
        const newRef = {
            id: `ref_new_${Date.now()}`,
            patientId: selectedPatient.id,
            patientName: selectedPatient.name,
            fromHospital: selectedPatient.currentHospital,
            toHospital: hospital.name,
            status: 'pending' as const,
            urgency: selectedPatient.severity as 'critical' | 'high',
            initiatedAt: new Date().toISOString(),
            eta: 20,
            condition: selectedPatient.condition,
        };
        setActiveReferrals(prev => [newRef, ...prev]);
        
        // SYNC TO BACKEND (Real-time update for other laptops)
        fetch('/api/sync/referrals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRef)
        }).catch(err => console.error('Sync failed:', err));

        setShowHandshake(true);
        setShowDiscovery(false);
        setTimeout(() => setShowHandshake(false), 4000);
    };

    const handleManualTransfer = (e: React.FormEvent) => {
        e.preventDefault();
        const newRef = {
            id: `ref_man_${Date.now()}`,
            patientId: selectedPatient.id,
            patientName: selectedPatient.name,
            fromHospital: selectedPatient.currentHospital,
            toHospital: transferData.toHospital || 'Max Super Speciality Hospital',
            status: 'pending' as const,
            urgency: transferData.priority as 'critical' | 'high',
            initiatedAt: new Date().toISOString(),
            eta: parseInt(transferData.eta) || 15,
            condition: selectedPatient.condition,
        };
        setActiveReferrals(prev => [newRef, ...prev]);

        // SYNC TO BACKEND
        fetch('/api/sync/referrals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRef)
        }).catch(err => console.error('Sync failed:', err));

        setShowTransferForm(false);
        setShowHandshake(true);
        setTimeout(() => setShowHandshake(false), 4000);
    };

    const totalBeds = MOCK_HOSPITALS.reduce((s, h) => s + h.availableBeds, 0);
    const icuBeds = MOCK_HOSPITALS.reduce((s, h) => s + h.availableIcuBeds, 0);

    return (
        <div className="min-h-screen grid-bg flex flex-col">
            {/* Top Bar */}
            <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
                <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium">
                            <ArrowLeft size={14} />
                            Exit System
                        </Link>
                        <div className="w-px h-4 bg-slate-200" />
                        <div className="flex items-center gap-2">
                            <Activity size={18} className="text-blue-600" />
                            <span className="font-extrabold text-slate-900 tracking-tight">Vital<span className="text-blue-600">Sync</span></span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">SENDER</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full bg-blue-50">
                            UNIT: EMERGENCY ALPHA
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-emerald-600 font-bold">SERVER CONNECTED</span>
                        </div>
                        <div suppressHydrationWarning className="font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded">{time.toLocaleTimeString()}</div>
                        <Link href="/receiver">
                            <button className="bg-teal-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-teal-700 transition-all shadow-sm">
                                Switch to Receiver
                            </button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Handshake Alert */}
            <AnimatePresence>
                {showHandshake && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-green-500/15 border-b border-green-500/40 px-6 py-3 flex items-center gap-3"
                    >
                        <CheckCircle size={16} className="text-teal-600" />
                        <span className="text-sm text-teal-700 font-bold">REFERRAL HANDSHAKE INITIATED</span>
                        <span className="text-sm text-slate-500">— Secure clinical data handshake complete. Patient packet available for receiver.</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-1 overflow-hidden">
                {/* Main content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { icon: AlertTriangle, label: 'Critical Cases', value: MOCK_PATIENTS.filter(p => p.severity === 'critical').length, color: '#0d9488' },
                            { icon: Truck, label: 'En Route', value: activeReferrals.filter(r => r.status === 'en-route').length, color: '#0ea5e9' },
                            { icon: BedDouble, label: 'Available ICU', value: icuBeds, color: '#0d9488' },
                            { icon: Globe, label: 'Hospitals Online', value: MOCK_HOSPITALS.length, color: '#0ea5e9' },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="glass-card p-4 flex items-center gap-3"
                            >
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: stat.color + '15', border: `1px solid ${stat.color}40` }}
                                >
                                    <stat.icon size={18} style={{ color: stat.color }} />
                                </div>
                                <div>
                                    <div className="text-2xl font-black font-mono" style={{ color: stat.color }}>{stat.value}</div>
                                    <div className="text-xs text-slate-500">{stat.label}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Patient Selector */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Users size={14} className="text-cyan-400" />
                                <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Active Critical Patients</span>
                            </div>
                            <button
                                onClick={() => setShowManualForm(true)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-cyan-400 border border-cyan-400/40 bg-cyan-400/10 hover:bg-cyan-400/20 transition-all"
                            >
                                <Users size={12} />
                                Manual Patient Entry
                            </button>
                        </div>
                        <div className="grid md:grid-cols-3 gap-3">
                            {patients.map((p) => (
                                <motion.div
                                    key={p.id}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => { setSelectedPatient(p); setShowDiscovery(false); }}
                                    className={`glass-card p-4 cursor-pointer transition-all ${selectedPatient.id === p.id ? 'border-cyan-400/60 shadow-[0_0_20px_rgba(0,245,255,0.15)]' : 'hover:border-cyan-500/30'}`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="text-sm font-bold text-white">{p.name}</div>
                                            <div className="text-xs text-slate-500">Age {p.age} · {p.bloodType}</div>
                                        </div>
                                        <div className={`text-xs font-bold px-2 py-0.5 rounded-full border ${p.severity === 'critical' ? 'border-red-500/50 text-red-400 bg-red-500/10 pulse-red' : 'border-orange-500/50 text-orange-400 bg-orange-500/10'}`}>
                                            {p.triageLevel === 1 ? '🔴 ESI-1' : '🟠 ESI-2'}
                                        </div>
                                    </div>
                                    <div className="text-xs text-cyan-300 font-medium mb-1">{p.condition}</div>
                                    <div className="text-xs text-slate-500">@ {p.currentHospital}</div>
                                    <div className="flex gap-3 mt-2 text-xs text-slate-400">
                                        <span>❤️ {p.vitals.hr}</span>
                                        <span>🩸 {p.vitals.bp}</span>
                                        <span>⊕ {p.vitals.spo2}%</span>
                                        <span>🧠 GCS:{p.vitals.gcs}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Selected Patient Detail */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedPatient.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="grid md:grid-cols-2 gap-6"
                        >
                            {/* Vitals */}
                            <div className="glass-card p-5">
                                <VitalSigns vitals={selectedPatient.vitals} severity={selectedPatient.severity} />
                            </div>

                            {/* Patient Info + Actions */}
                            <div className="glass-card p-5 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield size={14} className="text-cyan-400" />
                                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Patient Detail</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">MRN</span>
                                        <span className="font-mono text-cyan-300">{selectedPatient.mrn}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Condition</span>
                                        <span className="text-white font-medium">{selectedPatient.condition}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Severity</span>
                                        <span className={selectedPatient.severity === 'critical' ? 'text-red-400 font-bold uppercase' : 'text-orange-400 font-bold uppercase'}>
                                            {selectedPatient.severity}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Allergies</span>
                                        <span className="text-amber-400">{selectedPatient.allergies.join(', ') || 'None'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Current Hospital</span>
                                        <span className="text-slate-300 text-xs">{selectedPatient.currentHospital}</span>
                                    </div>
                                </div>

                                {/* Document Links (FHIR Attachments) */}
                                <div>
                                    <div className="text-xs text-slate-500 mb-2">FHIR Attachments (Encrypted)</div>
                                    <div className="space-y-1">
                                        {['CT_Head_DICOM.dcm', 'ER_Report.pdf', 'BloodWork_CBC.pdf'].map(f => (
                                            <div key={f} className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/40 rounded-lg px-2 py-1">
                                                <Shield size={10} className="text-green-400 flex-shrink-0" />
                                                <span className="font-mono">{f}</span>
                                                <span className="ml-auto text-green-400">AES-256</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={runDiscovery}
                                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-black"
                                        style={{ background: 'linear-gradient(135deg, #00f5ff, #0088ff)', boxShadow: '0 0 20px rgba(0,245,255,0.3)' }}
                                    >
                                        <Cpu size={14} />
                                        Find Hospital
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => setShowTransferForm(true)}
                                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white border border-cyan-500/30 bg-cyan-500/10"
                                    >
                                        <Truck size={14} />
                                        Manual Transfer
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Ambulance Tracker */}
                    <AmbulanceTracker
                        fromLat={28.6200}
                        fromLng={77.1900}
                        toLat={28.5672}
                        toLng={77.2100}
                    />

                    {/* Hospital Discovery Results */}
                    <AnimatePresence>
                        {showDiscovery && (
                            <motion.div
                                id="discovery-results"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mb-6 border-t border-cyan-500/20 pt-6"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Cpu size={14} className="text-cyan-400" />
                                        <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">
                                            Optimal Hospitals for {selectedPatient.name} · {selectedPatient.condition}
                                        </span>
                                    </div>
                                    <button onClick={() => setShowDiscovery(false)} className="text-slate-500 hover:text-white">
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="grid md:grid-cols-3 gap-4">
                                    {hospitalRanks.slice(0, 3).map((h, i) => (
                                        <HospitalCard
                                            key={h.hospital.id}
                                            data={h}
                                            rank={i + 1}
                                            onSelect={() => initiateHandshake(h.hospital.id)}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Active Referrals Table */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Radio size={14} className="text-cyan-400" />
                            <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Active Referral Handshakes</span>
                        </div>
                        <div className="glass-card overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-cyan-500/10 text-xs text-slate-500 uppercase">
                                        <th className="text-left px-4 py-3">Patient</th>
                                        <th className="text-left px-4 py-3 hidden md:table-cell">From → To</th>
                                        <th className="text-left px-4 py-3">Status</th>
                                        <th className="text-left px-4 py-3 hidden md:table-cell">ETA</th>
                                        <th className="text-left px-4 py-3 hidden md:table-cell">Urgency</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeReferrals.map((ref, i) => {
                                        const status = STATUS_CONFIG[ref.status as keyof typeof STATUS_CONFIG];
                                        return (
                                            <motion.tr
                                                key={ref.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="border-b border-slate-800/50 hover:bg-cyan-500/5 cursor-pointer transition-colors"
                                                onClick={() => setSelectedReferral(ref)}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-white">{ref.patientName}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{ref.id}</div>
                                                </td>
                                                <td className="px-4 py-3 hidden md:table-cell">
                                                    <div className="text-xs text-slate-400 leading-relaxed">
                                                        <span className="text-red-400">{ref.fromHospital}</span>
                                                        <span className="text-slate-600"> → </span>
                                                        <span className="text-green-400">{ref.toHospital}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${status.bg} ${status.border}`}
                                                        style={{ color: status.color }}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 hidden md:table-cell">
                                                    <div className="flex items-center gap-1 text-amber-400">
                                                        <Clock size={12} />
                                                        <span className="font-mono">{ref.eta} min</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 hidden md:table-cell">
                                                    <span className={`text-xs ${ref.urgency === 'critical' ? 'text-red-400' : 'text-orange-400'}`}>
                                                        {ref.urgency?.toUpperCase()}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Emergency Sidebar */}
                <aside className="w-72 border-l border-cyan-500/15 hidden lg:flex flex-col backdrop-blur-xl">
                    <EmergencySidebar />
                </aside>
            </div>

            {/* Manual Entry Modal */}
            <AnimatePresence>
                {showManualForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="max-w-xl w-full glass-card p-6 border-cyan-500/30 shadow-[0_0_50px_rgba(0,245,255,0.2)]"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-white flex items-center gap-2">
                                    <Users className="text-cyan-400" size={20} />
                                    ADVANCED MANUAL PATIENT INTAKE
                                </h3>
                                <button onClick={() => setShowManualForm(false)} className="text-slate-500 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleManualSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Full Name</label>
                                        <input
                                            type="text" required
                                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                                            value={manualPatient.name}
                                            onChange={(e) => setManualPatient({ ...manualPatient, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Age</label>
                                        <input
                                            type="number" required
                                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                                            value={manualPatient.age}
                                            onChange={(e) => setManualPatient({ ...manualPatient, age: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Blood Type</label>
                                        <input
                                            type="text" placeholder="e.g. B+"
                                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                                            value={manualPatient.bloodType || ''}
                                            onChange={(e) => setManualPatient({ ...manualPatient, bloodType: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Allergies</label>
                                        <input
                                            type="text" placeholder="e.g. Penicillin"
                                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                                            value={manualPatient.allergiesStr || ''}
                                            onChange={(e) => setManualPatient({ ...manualPatient, allergiesStr: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Medical Condition</label>
                                        <select
                                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                                            value={manualPatient.condition}
                                            onChange={(e) => setManualPatient({ ...manualPatient, condition: e.target.value })}
                                        >
                                            <option value="Trauma">Trauma</option>
                                            <option value="Cardiac">Cardiac</option>
                                            <option value="Pediatric">Pediatric</option>
                                            <option value="Neuro">Neuro</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Severity</label>
                                        <select
                                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                                            value={manualPatient.severity}
                                            onChange={(e) => setManualPatient({ ...manualPatient, severity: e.target.value as any })}
                                        >
                                            <option value="critical">CRITICAL (ESI 1)</option>
                                            <option value="high">HIGH (ESI 2)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="p-4 border border-cyan-500/10 bg-cyan-500/5 rounded-xl">
                                    <div className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold mb-3">Manual Vitals Entry</div>
                                    <div className="grid grid-cols-4 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[8px] text-slate-500 uppercase font-bold">Heart Rate</label>
                                            <input type="text" className="w-full bg-black/30 border border-slate-700/50 rounded px-2 py-1 text-xs text-white" value={manualPatient.hr} onChange={(e) => setManualPatient({ ...manualPatient, hr: e.target.value })} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] text-slate-500 uppercase font-bold">BP</label>
                                            <input type="text" className="w-full bg-black/30 border border-slate-700/50 rounded px-2 py-1 text-xs text-white" value={manualPatient.bp} onChange={(e) => setManualPatient({ ...manualPatient, bp: e.target.value })} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] text-slate-500 uppercase font-bold">SPO2</label>
                                            <input type="text" className="w-full bg-black/30 border border-slate-700/50 rounded px-2 py-1 text-xs text-white" value={manualPatient.spo2} onChange={(e) => setManualPatient({ ...manualPatient, spo2: e.target.value })} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] text-slate-500 uppercase font-bold">GCS</label>
                                            <input type="text" className="w-full bg-black/30 border border-slate-700/50 rounded px-2 py-1 text-xs text-white" value={manualPatient.gcs} onChange={(e) => setManualPatient({ ...manualPatient, gcs: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3 rounded-xl bg-cyan-500 text-black font-black text-sm hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(0,245,255,0.3)] mt-2"
                                >
                                    INGEST PATIENT DATA
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Manual Transfer Modal */}
            <AnimatePresence>
                {showTransferForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="max-w-md w-full glass-card p-6 border-cyan-500/30 shadow-[0_0_50px_rgba(0,245,255,0.2)]"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-white flex items-center gap-2">
                                    <Truck className="text-cyan-400" size={20} />
                                    MANUAL TRANSFER REQUEST
                                </h3>
                                <button onClick={() => setShowTransferForm(false)} className="text-slate-500 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleManualTransfer} className="space-y-4">
                                <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl mb-4">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Selected Patient</div>
                                    <div className="text-sm font-bold text-white">{selectedPatient.name}</div>
                                    <div className="text-xs text-cyan-300">{selectedPatient.condition} · {selectedPatient.severity.toUpperCase()}</div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Receiving Hospital</label>
                                    <select
                                        required
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                                        value={transferData.toHospital}
                                        onChange={(e) => setTransferData({ ...transferData, toHospital: e.target.value })}
                                    >
                                        <option value="">Select Target Facility...</option>
                                        {MOCK_HOSPITALS.map(h => (
                                            <option key={h.id} value={h.name}>{h.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Estimated ETA (Min)</label>
                                        <input
                                            type="number" required
                                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                                            value={transferData.eta}
                                            onChange={(e) => setTransferData({ ...transferData, eta: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Priority</label>
                                        <select
                                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                                            value={transferData.priority}
                                            onChange={(e) => setTransferData({ ...transferData, priority: e.target.value })}
                                        >
                                            <option value="critical">STROLL-1 / CRITICAL</option>
                                            <option value="high">URGENT</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="text-[10px] text-slate-500 italic mt-2">
                                    Note: Manual transfer bypasses algorithm scoring and initiates immediate handshake protocol.
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3 rounded-xl bg-cyan-500 text-black font-black text-sm hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(0,245,255,0.3)] mt-2"
                                >
                                    INITIATE DIRECT HANDSHAKE
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}


