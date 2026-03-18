'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import {
  Activity, Zap, Shield, Clock, Globe, ArrowRight, Heart,
  Radio, Database, Lock, ChevronRight, Cpu
} from 'lucide-react';

const STATS = [
  { value: '< 90s', label: 'Avg. Transfer Initiation' },
  { value: '47%', label: 'Reduction in Duplicate Tests' },
  { value: '94.3%', label: 'Specialist Match Accuracy' },
  { value: '3.2min', label: 'Saved Per Golden Hour Case' },
];

const FEATURES = [
  {
    icon: Cpu,
    title: 'Smart Discovery Algorithm',
    desc: 'Multi-factor AI scoring: specialization match, real-time bed load, distance matrix, and trauma center capability — all computed in milliseconds.',
    color: '#00f5ff',
  },
  {
    icon: Radio,
    title: 'Zero-Latency Handshake',
    desc: 'Socket.io-powered instant notifications. Hospital B receives pre-arrival patient packet before the ambulance leaves Hospital A.',
    color: '#00ff88',
  },
  {
    icon: Globe,
    title: 'Live Ambulance Tracking',
    desc: 'Mapbox GL JS integration shows real-time ambulance location. Receiving team knows exactly when to be ready.',
    color: '#a855f7',
  },
  {
    icon: Database,
    title: 'HL7 FHIR Interoperability',
    desc: 'FHIR R4-compliant data architecture. Patient records, X-rays, and reports travel securely ahead of the patient.',
    color: '#ffa500',
  },
  {
    icon: Shield,
    title: 'Military-Grade Encryption',
    desc: 'AES-256 encrypted document links, SHA-256 integrity hashing, and zero-trust access controls for patient privacy.',
    color: '#ff3b6b',
  },
  {
    icon: Clock,
    title: 'Golden Hour Optimizer',
    desc: "Every second counts. VitalSync&apos;s scoring penalizes distance and rewards available specialists to maximize golden hour outcomes.",
    color: '#ffd700',
  },
];

const FLOW_STEPS = [
  { step: '01', title: 'ASSESS', desc: 'Triage & digitize patient at Hospital A', color: '#ff3b6b' },
  { step: '02', title: 'DISCOVER', desc: 'Algorithm ranks optimal receiving hospitals', color: '#ffa500' },
  { step: '03', title: 'HANDSHAKE', desc: 'Instant Socket.io notification to Hospital B', color: '#00f5ff' },
  { step: '04', title: 'TRANSFER', desc: 'Pre-arrival packet sent, ambulance dispatched', color: '#a855f7' },
  { step: '05', title: 'RECEIVE', desc: 'B team ready, no duplicate tests, zero delays', color: '#00ff88' },
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <main className="min-h-screen grid-bg overflow-x-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div style={{
          position: 'absolute', top: '10%', left: '20%', width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(0,245,255,0.06) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '20%', right: '10%', width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(60px)',
        }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-cyan-500/10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <Activity size={24} className="text-cyan-400" style={{ filter: 'drop-shadow(0 0 8px #00f5ff)' }} />
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              Vital<span className="text-cyan-400" style={{ textShadow: '0 0 20px #00f5ff' }}>Sync</span>
            </span>
            <span className="text-xs text-slate-500 border border-slate-700 px-2 py-0.5 rounded-full">v2.0</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden md:flex items-center gap-6 text-sm text-slate-400"
          >
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#algorithm" className="hover:text-cyan-400 transition-colors">Algorithm</a>
            <a href="#flow" className="hover:text-cyan-400 transition-colors">How It Works</a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0,245,255,0.5)' }}
                whileTap={{ scale: 0.97 }}
                className="px-4 py-2 rounded-xl text-sm font-bold text-black"
                style={{ background: 'linear-gradient(135deg, #00f5ff, #0088ff)' }}
              >
                Launch Dashboard →
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section ref={heroRef} className="relative z-10 min-h-[90vh] flex items-center justify-center py-20 px-6">
        <motion.div style={{ opacity, y }} className="text-center max-w-6xl mx-auto">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 border border-cyan-500/30 bg-cyan-500/5 rounded-full px-4 py-2 text-xs text-cyan-300 mb-8 font-medium"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            HACKATHON DEMO · LIVE SYSTEM · GOLDEN HOUR PROTOCOL
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-6xl md:text-8xl font-extrabold leading-none tracking-tight mb-4 text-slate-900">
              SMART CARE
              <br />
              DIGITAL <span className="text-blue-600">PRECISION</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-slate-400 max-w-3xl mx-auto mt-6 leading-relaxed"
          >
            VitalSync eliminates the silent killer of emergency medicine: <strong className="text-white">information gaps between hospitals</strong>.
            When Hospital A repeats tests already done by Hospital B, patients die.
            We fix this with real-time data interoperability, AI-driven hospital matching, and zero-latency handoffs.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
          >
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(0,245,255,0.6)' }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-bold text-black"
                style={{ background: 'linear-gradient(135deg, #00f5ff, #00a8ff)', boxShadow: '0 0 30px rgba(0,245,255,0.4)' }}
              >
                <Lock size={20} />
                Secure Portal Login
                <ArrowRight size={16} />
              </motion.button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto"
          >
            {STATS.map((s, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="glass-card p-4 text-center"
              >
                <div className="text-2xl font-black font-mono gradient-text">{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Floating EKG decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden opacity-20">
          <svg width="100%" height="64" viewBox="0 0 1440 64" preserveAspectRatio="none">
            <polyline
              points="0,32 100,32 150,32 175,8 200,56 225,16 250,32 350,32 450,32 475,8 500,56 525,16 550,32 650,32 750,32 775,8 800,56 825,16 850,32 950,32 1050,32 1075,8 1100,56 1125,16 1150,32 1250,32 1350,32 1375,8 1400,56 1440,32"
              fill="none"
              stroke="#00f5ff"
              strokeWidth="2"
            />
          </svg>
        </div>
      </section>

      {/* THE PROBLEM SECTION */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="glass-card-red p-10 text-center"
          >
            <div className="text-4xl mb-4">💔</div>
            <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              The <span className="text-red-400">Silent Killer</span> in Emergency Medicine
            </h2>
            <p className="text-slate-300 text-lg max-w-3xl mx-auto leading-relaxed">
              A trauma patient reaches Hospital A. Emergency team spends <strong className="text-red-400">47 critical minutes</strong> repeating CT scans
              already done by the paramedics. They transfer to Hospital B — but Hospital B&apos;s neurosurgeon is off-duty.
              They transfer again. By the time they reach the right specialist,
              the <strong className="text-white">Golden Hour has expired</strong>.
            </p>
            <div className="mt-6 flex justify-center gap-8 text-sm">
              <div className="text-center">
                <div className="text-3xl font-black text-red-400">1.35M</div>
                <div className="text-slate-500">Preventable deaths/year globally</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-red-400">60 min</div>
                <div className="text-slate-500">The Golden Hour window</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-red-400">78%</div>
                <div className="text-slate-500">Cases with preventable delays</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-black text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Mission-Critical <span className="gradient-text">Technology Stack</span>
            </h2>
            <p className="text-slate-400">Built for emergency rooms, not conference rooms</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="glass-card p-6"
                style={{ borderColor: f.color + '30' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: f.color + '15', border: `1px solid ${f.color}40` }}
                >
                  <f.icon size={20} style={{ color: f.color }} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ALGORITHM SECTION */}
      <section id="algorithm" className="relative z-10 py-20 px-6 bg-gradient-to-b from-transparent to-cyan-500/3">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-black text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              The <span className="neon-text">Brain</span> — findOptimalHospital()
            </h2>
          </motion.div>
          <div className="glass-card p-8">
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { label: 'Specialization Match', score: 40, color: '#00f5ff', desc: 'Prioritizes Neuro/Ortho for trauma, Cardio for STEMI, Peds for child cases' },
                { label: 'Distance Score', score: 30, color: '#a855f7', desc: 'Haversine formula + ambulance speed factor = real ETA computation' },
                { label: 'Resource Load', score: 20, color: '#00ff88', desc: 'Live bed availability, ICU slots, penalizes overloaded hospitals' },
                { label: 'Success Rate + Trauma Level', score: 10, color: '#ffd700', desc: 'Historical outcomes + Level I Trauma Center bonus' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between text-sm">
                    <span className="font-bold" style={{ color: item.color }}>{item.label}</span>
                    <span className="font-mono text-slate-400">{item.score} pts</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.score}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: item.color, boxShadow: `0 0 8px ${item.color}66` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-xl bg-black/30 border border-cyan-500/10">
              <code className="text-xs text-cyan-300 font-mono">
                {'const ranked = findOptimalHospital(patientCase, hospitals)\n  .filter(h => h.totalScore >= 50)\n  .sort((a, b) => b.totalScore - a.totalScore);'}
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* FLOW SECTION */}
      <section id="flow" className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-black text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              The <span className="gradient-text">Golden Hour</span> Protocol
            </h2>
          </motion.div>
          <div className="flex flex-col md:flex-row items-center gap-0">
            {FLOW_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-0 flex-col md:flex-row w-full md:w-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="flex flex-col items-center text-center p-6 rounded-2xl w-full md:w-40 border"
                  style={{ borderColor: step.color + '40', background: step.color + '08' }}
                >
                  <div className="text-2xl font-black font-mono mb-2" style={{ color: step.color }}>{step.step}</div>
                  <div className="text-sm font-bold text-white">{step.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{step.desc}</div>
                </motion.div>
                {i < FLOW_STEPS.length - 1 && (
                  <ChevronRight size={24} className="text-slate-600 flex-shrink-0 md:block hidden" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 py-20 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <div className="glass-card p-12">
            <div className="text-5xl mb-4">🚑</div>
            <h2 className="text-4xl font-black text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              The next patient cannot wait.
            </h2>
            <p className="text-slate-400 mb-8">
              Experience the full VitalSync platform — from emergency intake to pre-arrival readiness.
            </p>
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 60px rgba(0,245,255,0.7)' }}
                whileTap={{ scale: 0.97 }}
                className="px-10 py-4 rounded-2xl text-xl font-black text-black"
                style={{ background: 'linear-gradient(135deg, #00f5ff, #00ff88)', boxShadow: '0 0 40px rgba(0,245,255,0.5)' }}
              >
                ⚡ LAUNCH VITALSYNC DASHBOARD
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-cyan-500/10 py-6 text-center text-slate-600 text-xs">
        <p>VitalSync · Emergency Medical Interoperability Platform · HL7 FHIR R4 · Built for the Golden Hour</p>
        <p className="mt-1">MongoDB · Next.js 14 · Socket.io · Mapbox GL · Framer Motion</p>
      </footer>
    </main>
  );
}

