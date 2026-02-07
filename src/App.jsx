import React, { useState, useMemo } from 'react';
import {
Trophy, ShieldAlert, Zap, Compass, AlertTriangle,
ChevronRight, RefreshCw, Printer, Target
} from 'lucide-react';

const ARCHETYPES = {
SOLID: {
id: 'SOLID', name: 'Solid Foundation', tagline: 'The Legacy-Ready Leader', theme: 'emerald', color: '#059669', icon: <Trophy className="w-12 h-12" />,
scores: { b: 95, f: 92, p: 95 }, status: "Legacy Ready",
description: "Equilibrium across all three pillars. You drive results while maintaining deep trust.",
prescription: "You are ready for multi-unit leadership. Focus on scaling the BFP framework.",
striveFor: "Legacy Scaling & Mentorship"
},
BUREAUCRAT: {
id: 'BUREAUCRAT', name: 'The Bureaucrat', tagline: 'Operational Stagnation', theme: 'blue', color: '#2563eb', icon: <ShieldAlert className="w-12 h-12" />,
scores: { b: 88, f: 32, p: 55 }, status: "Stagnant",
description: "Trust is present, but velocity is low. Processes are prioritized over results.",
prescription: "Inject Fuel. Implement aggressive KPI targets and agile feedback loops.",
striveFor: "Fuel Injection & Velocity"
},
BURNOUT: {
id: 'BURNOUT', name: 'Burnout Driver', tagline: 'Velocity Risk Profile', theme: 'orange', color: '#f97316', icon: <Zap className="w-12 h-12" />,
scores: { b: 42, f: 96, p: 28 }, status: "Human Debt High",
description: "KPIs are met through brute force. High velocity but low psychological safety.",
prescription: "Recover Purpose. Shift from 'Command & Control' to 'Clarity & Care.'",
striveFor: "Purpose Recovery & Bedrock Stability"
},
VISIONARY: {
id: 'VISIONARY', name: 'Performative Visionary', tagline: 'The Hollow Leader', theme: 'purple', color: '#9333ea', icon: <Compass className="w-12 h-12" />,
scores: { b: 35, f: 25, p: 92 }, status: "Hollow Foundation",
description: "Charismatic but fails in execution. The team loves the dream but hates the reality.",
prescription: "Stabilize Bedrock. Stop selling the future and start fixing the present.",
striveFor: "Structural Integrity & Systems"
},
ACCIDENTAL: {
id: 'ACCIDENTAL', name: 'The Accidental Leader', tagline: 'Critical Structural Fragility', theme: 'red', color: '#dc2626', icon: <AlertTriangle className="w-12 h-12" />,
scores: { b: 18, f: 22, p: 12 }, status: "Critical Risk",
description: "Technical expert leading on instinct. Survival mode across all pillars.",
prescription: "BFP Foundations. Immediate enrollment in radical ownership training.",
striveFor: "Core BFP Foundations"
}
};

const QUESTIONS = [
{ id: 1, pillar: 'B', text: "My team feels safe admitting mistakes to me without fear of retribution." },
{ id: 2, pillar: 'B', text: "When pressure is high, I default to transparency rather than withholding information." },
{ id: 3, pillar: 'B', text: "Trust within the team is strong enough that we don't need excessive oversight." },
{ id: 4, pillar: 'F', text: "We consistently hit our operational KPIs without requiring 'brute force' efforts." },
{ id: 5, pillar: 'F', text: "Our internal processes are lean and help us move faster rather than slowing us down." },
{ id: 6, pillar: 'F', text: "I have a systematic way to measure and improve our operational velocity." },
{ id: 7, pillar: 'P', text: "Every member of my team can clearly state the 'Why' behind our store's goals." },
{ id: 8, pillar: 'P', text: "The team feels a sense of ownership over the store’s long-term legacy." },
{ id: 9, pillar: 'P', text: "Personal growth and purpose are discussed as often as sales targets." },
];

export default function App() {
const [view, setView] = useState('welcome');
const [answers, setAnswers] = useState({});
const [currentStep, setCurrentStep] = useState(0);

const results = useMemo(() => {
if (Object.keys(answers).length < QUESTIONS.length) return null;
const s = { B: 0, F: 0, P: 0 };
QUESTIONS.forEach(q => s[q.pillar] += (answers[q.id] || 0));
if (s.B >= 13 && s.F >= 13 && s.P >= 13) return ARCHETYPES.SOLID;
if (s.B >= 11 && s.F <= 9) return ARCHETYPES.BUREAUCRAT;
if (s.F >= 13 && s.B <= 10) return ARCHETYPES.BURNOUT;
if (s.P >= 13 && s.B <= 10) return ARCHETYPES.VISIONARY;
return ARCHETYPES.ACCIDENTAL;
}, [answers]);

const PillarBar = ({ label, value, color }) => (
<div className="w-full">
<div className="flex justify-between items-end mb-2">
<span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</span>
<span className="text-sm font-bold text-[#002147]">{value}%</span>
</div>
<div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
<div className="h-full transition-all duration-1000" style={{ width: `${value}%`, backgroundColor: color }} />
</div>
</div>
);

if (view === 'welcome') return (
<div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6 text-[#002147]">
<div className="max-w-2xl w-full bg-white p-16 rounded-[40px] shadow-2xl border-t-[12px] border-[#002147] text-center">
<p className="uppercase tracking-[0.4em] text-[#C5A059] font-black text-sm mb-6">Worthy Retail X-Ray</p>
<h1 className="text-6xl font-serif font-black mb-8 leading-tight text-[#002147]">Leadership Diagnostic</h1>
<button onClick={() => setView('quiz')} className="bg-[#002147] text-white px-12 py-6 rounded-full font-bold text-xl hover:bg-[#C5A059] transition-all">Start Analysis</button>
</div>
</div>
);

if (view === 'quiz') return (
<div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6">
<div className="max-w-3xl w-full bg-white p-12 rounded-[40px] shadow-xl border">
<p className="text-[#C5A059] font-black uppercase text-xs mb-4">Question {currentStep + 1} / {QUESTIONS.length}</p>
<h3 className="text-3xl font-medium text-slate-800 mb-12">"{QUESTIONS[currentStep].text}"</h3>
<div className="space-y-3">
{[5, 4, 3, 2, 1].map((val) => (
<button key={val} onClick={() => {
setAnswers({ ...answers, [QUESTIONS[currentStep].id]: val });
if (currentStep < QUESTIONS.length - 1) setCurrentStep(currentStep + 1);
else setView('results');
}} className="w-full text-left px-8 py-5 rounded-2xl border-2 hover:border-[#C5A059] font-bold text-slate-600">
{val === 5 ? "Strongly Agree" : val === 1 ? "Strongly Disagree" : val === 4 ? "Agree" : val === 2 ? "Disagree" : "Neutral"}
</button>
))}
</div>
</div>
</div>
);

if (view === 'results' && results) return (
<div className="min-h-screen bg-[#cbd5e1] py-12 px-6">
<div className="max-w-6xl mx-auto flex justify-between items-center mb-12 print:hidden">
<button onClick={() => {setAnswers({}); setCurrentStep(0); setView('quiz');}} className="font-bold text-[#002147] flex items-center gap-2"><RefreshCw size={18}/> Restart</button>
<button onClick={() => window.print()} className="bg-[#002147] text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 shadow-lg"><Printer size={18}/> Generate PDF</button>
</div>
<div className="max-w-[1280px] mx-auto space-y-10">
<div className="slide-bg w-full aspect-[16/9] bg-[#FAF9F6] shadow-2xl relative overflow-hidden flex flex-col p-20 border-t-[14px] border-[#002147] print:shadow-none print:break-after-page">
<div className="flex-1 flex flex-col justify-center">
<p className="uppercase tracking-[0.4em] text-[#C5A059] font-black text-sm mb-4">Diagnostic Report</p>
<h1 className="text-[110px] font-serif font-black text-[#002147] leading-[0.9] mb-8">Worthy Retail<br/>X-Ray Profile</h1>
<div className="w-24 h-2 bg-[#002147] mt-8"></div>
</div>
</div>
<div className="slide-bg w-full aspect-[16/9] bg-[#FAF9F6] shadow-2xl relative overflow-hidden flex flex-col p-20 border-t-[14px] border-[#002147] print:shadow-none print:break-after-page">
<h2 className="text-4xl font-serif font-bold text-[#002147] mb-12 border-b pb-8">Analysis: {results.name}</h2>
<div className="grid grid-cols-12 gap-16 flex-1 items-start">
<div className="col-span-7">
<div className="flex items-center gap-6 mb-8">
<div className="p-4 bg-white shadow rounded-xl text-[#002147]">{results.icon}</div>
<div>
<div className="inline-block px-2 py-1 bg-[#002147] text-white text-[10px] font-black uppercase rounded mb-1">Status: {results.status}</div>
<h3 className="text-5xl font-serif font-black text-[#002147]">{results.name}</h3>
</div>
</div>
<p className="text-xl text-slate-600 mb-10 italic">"{results.description}"</p>
<div className="space-y-6">
<PillarBar label="Bedrock" value={results.scores.b} color="#002147" />
<PillarBar label="Fuel" value={results.scores.f} color="#C5A059" />
<PillarBar label="Purpose" value={results.scores.p} color="#475569" />
</div>
</div>
<div className="col-span-5 bg-white p-10 rounded-[32px] border shadow-xl">
<p className="text-[#C5A059] font-black uppercase text-xs mb-6">Prescription</p>
<h4 className="text-2xl font-serif font-bold text-[#002147] mb-4">Strive For: {results.striveFor}</h4>
<p className="text-slate-500 mb-8">{results.prescription}</p>
</div>
</div>
</div>
</div>
<style>{`@media print { body { background: white !important; padding: 0 !important; } .print\\:hidden { display: none !important; } .slide-bg { width: 100vw !important; height: 100vh !important; margin: 0 !important; page-break-after: always !important; -webkit-print-color-adjust: exact !important; } @page { size: 1280px 720px; margin: 0; } }`}</style>
</div>
);
}
