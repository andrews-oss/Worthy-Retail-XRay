import React, { useState, useMemo, useEffect } from 'react';
import {
Trophy, ShieldAlert, Zap, Compass, AlertTriangle,
ChevronRight, RefreshCw, Printer, Target, Save,
CheckCircle2, Layout, BarChart3, Info, Share2
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
getAuth,
signInAnonymously,
onAuthStateChanged,
signInWithCustomToken
} from 'firebase/auth';
import {
getFirestore,
collection,
addDoc,
serverTimestamp
} from 'firebase/firestore';

// --- FIREBASE INITIALIZATION ---
// These global variables are provided by the environment
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'worthy-xray-default';

// --- DATA: Archetypes ---
const ARCHETYPES = {
SOLID: {
id: 'SOLID',
name: 'Solid Foundation',
tagline: 'The Legacy-Ready Leader',
color: '#059669',
icon: <Trophy className="w-12 h-12" />,
status: "Legacy Ready",
description: "Equilibrium across all three pillars. You drive exceptional results while maintaining a culture of deep trust and psychological safety.",
prescription: "Ready for multi-unit leadership or executive mentorship. Shift focus from individual store performance to scaling the BFP framework.",
striveFor: "Legacy Scaling & Mentorship"
},
BUREAUCRAT: {
id: 'BUREAUCRAT',
name: 'The Bureaucrat',
tagline: 'Operational Stagnation',
color: '#2563eb',
icon: <ShieldAlert className="w-12 h-12" />,
status: "Stagnant",
description: "Trust is present, but velocity is low. Processes are prioritized over results, leading to a 'wait-and-see' culture that loses to faster competitors.",
prescription: "Inject Fuel. Implement aggressive KPI targets and agile feedback loops immediately. Reward speed over compliance.",
striveFor: "Fuel Injection & Velocity"
},
BURNOUT: {
id: 'BURNOUT',
name: 'Burnout Driver',
tagline: 'Velocity Risk Profile',
color: '#f97316',
icon: <Zap className="w-12 h-12" />,
status: "Human Debt High",
description: "KPIs are met through brute force. High velocity creates 'Human Debt' that leads to a sudden cliff of attrition and cultural erosion.",
prescription: "Recover Purpose. Shift from 'Command & Control' to 'Clarity & Care.' You must stabilize the Bedrock before the human debt comes due.",
striveFor: "Purpose Recovery & Bedrock Stability"
},
VISIONARY: {
id: 'VISIONARY',
name: 'Performative Visionary',
tagline: 'The Hollow Leader',
color: '#9333ea',
icon: <Compass className="w-12 h-12" />,
status: "Hollow Foundation",
description: "Charismatic and high on purpose, but you fail in execution and foundation. The team loves the dream but is exhausted by the lack of operational reality.",
prescription: "Stabilize Bedrock. Stop selling the future and start fixing the present. Implement systems that ensure promises are kept.",
striveFor: "Structural Integrity & Systems"
},
ACCIDENTAL: {
id: 'ACCIDENTAL',
name: 'The Accidental Leader',
tagline: 'Critical Structural Fragility',
color: '#dc2626',
icon: <AlertTriangle className="w-12 h-12" />,
status: "Critical Risk",
description: "Technical expert promoted into leadership without a blueprint. You are currently operating in a state of survival mode across all pillars.",
prescription: "BFP Foundations. Immediate enrollment in radical ownership and leadership training. Build a blueprint before attempting to scale.",
striveFor: "Core BFP Foundations"
}
};

// --- DATA: 18 Comprehensive Questions ---
const QUESTIONS = [
// BEDROCK (Trust & Safety)
{ id: 1, pillar: 'B', text: "My team feels safe admitting mistakes to me without fear of retribution." },
{ id: 2, pillar: 'B', text: "I default to transparency during high pressure rather than withholding information." },
{ id: 3, pillar: 'B', text: "Trust within the team is strong enough that I rarely feel the need to micromanage daily tasks." },
{ id: 4, pillar: 'B', text: "Conflict within my team is resolved through open, direct dialogue rather than gossip or silence." },
{ id: 5, pillar: 'B', text: "My team knows I have their back when external pressures or difficult customer interactions arise." },
{ id: 6, pillar: 'B', text: "We have a 'Truth-Default' culture where being honest is more important than being polite." },
// FUEL (Velocity & Systems)
{ id: 7, pillar: 'F', text: "We consistently hit our operational KPIs without requiring last-minute 'brute force' efforts." },
{ id: 8, pillar: 'F', text: "Our internal processes and tech tools accelerate our speed rather than acting as red tape." },
{ id: 9, pillar: 'F', text: "I have clear, simple systems in place to measure and improve our team's operational velocity." },
{ id: 10, pillar: 'F', text: "Decisions in our store are made quickly based on data rather than waiting for consensus." },
{ id: 11, pillar: 'F', text: "My team uses checklists and automations effectively to simplify routine retail tasks." },
{ id: 12, pillar: 'F', text: "We can pivot store strategy or layout within 24 hours without causing operational chaos." },
// PURPOSE (Why & Ownership)
{ id: 13, pillar: 'P', text: "Every member of my team can clearly state the 'Why' behind our store's specific mission." },
{ id: 14, pillar: 'P', text: "The team treats the store as a legacy they are building together, not just a paycheck." },
{ id: 15, pillar: 'P', text: "Personal growth and individual purpose are discussed as often as sales targets." },
{ id: 16, pillar: 'P', text: "My team understands how their daily tasks contribute to the long-term success of the brand." },
{ id: 17, pillar: 'P', text: "We have a shared vision of what 'Winning' looks like that goes beyond just the numbers." },
{ id: 18, pillar: 'P', text: "Morale remains high and focused even when we are facing difficult sales periods." }
];

export default function App() {
const [view, setView] = useState('welcome');
const [answers, setAnswers] = useState({});
const [currentStep, setCurrentStep] = useState(0);
const [user, setUser] = useState(null);
const [isSaving, setIsSaving] = useState(false);
const [userName, setUserName] = useState("");
const [showSavedToast, setShowSavedToast] = useState(false);

// --- Auth & Firebase Logic ---
useEffect(() => {
const initAuth = async () => {
try {
if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
await signInWithCustomToken(auth, __initial_auth_token);
} else {
await signInAnonymously(auth);
}
} catch (err) {
console.error("Auth Error:", err);
}
};
initAuth();
const unsubscribe = onAuthStateChanged(auth, setUser);
return () => unsubscribe();
}, []);

// --- Calculation Logic ---
const results = useMemo(() => {
if (Object.keys(answers).length < QUESTIONS.length) return null;

const s = { B: 0, F: 0, P: 0 };
QUESTIONS.forEach(q => s[q.pillar] += (answers[q.id] || 0));

// Convert to percentages (Max 30 per pillar based on 6 questions * 5 points)
const bPct = Math.round((s.B / 30) * 100);
const fPct = Math.round((s.F / 30) * 100);
const pPct = Math.round((s.P / 30) * 100);

let base = ARCHETYPES.ACCIDENTAL;

// Refined threshold logic
if (bPct >= 80 && fPct >= 80 && pPct >= 80) base = ARCHETYPES.SOLID;
else if (bPct >= 75 && fPct <= 55) base = ARCHETYPES.BUREAUCRAT;
else if (fPct >= 80 && bPct <= 65) base = ARCHETYPES.BURNOUT;
else if (pPct >= 80 && bPct <= 65) base = ARCHETYPES.VISIONARY;
else if (bPct < 60 && fPct < 60 && pPct < 60) base = ARCHETYPES.ACCIDENTAL;
else base = ARCHETYPES.ACCIDENTAL; // Default fallback for low consistency

return { ...base, calculatedScores: { b: bPct, f: fPct, p: pPct } };
}, [answers]);

const saveResults = async () => {
if (!user || !results || !userName) return;
setIsSaving(true);
try {
await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'assessments'), {
userId: user.uid,
userName,
archetype: results.id,
scores: results.calculatedScores,
createdAt: serverTimestamp()
});
setShowSavedToast(true);
setTimeout(() => setShowSavedToast(false), 3000);
} catch (e) {
console.error("Save Error:", e);
}
setIsSaving(false);
};

// --- UI Components ---
const PillarBar = ({ label, value, color }) => (
<div className="w-full mb-6">
<div className="flex justify-between items-end mb-2">
<span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</span>
<span className="text-sm font-bold text-[#002147]">{value}%</span>
</div>
<div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
<div
className="h-full transition-all duration-1000 ease-out"
style={{ width: `${value}%`, backgroundColor: color }}
/>
</div>
</div>
);

// --- WELCOME VIEW ---
if (view === 'welcome') return (
<div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4 md:p-6 text-[#002147]">
<div className="max-w-2xl w-full bg-white p-8 md:p-16 rounded-[32px] md:rounded-[40px] shadow-2xl border-t-[12px] border-[#002147] text-center">
<p className="uppercase tracking-[0.4em] text-[#C5A059] font-black text-xs md:text-sm mb-6">The Worthy Retail X-Ray</p>
<h1 className="text-4xl md:text-6xl font-serif font-black mb-8 leading-tight">Leadership<br className="hidden md:block"/> Diagnostic</h1>
<p className="text-lg text-slate-500 mb-10 leading-relaxed max-w-md mx-auto">
Identify the structural fractures in your leadership across Bedrock, Fuel, and Purpose.
</p>
<div className="mb-10 text-left">
<label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Participant Name</label>
<input
type="text"
placeholder="Enter your name..."
className="w-full p-5 border-2 border-slate-100 rounded-2xl text-center font-bold text-[#002147] focus:border-[#C5A059] outline-none transition-all placeholder:text-slate-300"
value={userName}
onChange={(e) => setUserName(e.target.value)}
/>
</div>
<button
disabled={!userName}
onClick={() => setView('quiz')}
className="w-full md:w-auto bg-[#002147] text-white px-12 py-5 rounded-full font-bold text-lg md:text-xl hover:bg-[#C5A059] transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 shadow-xl"
>
Start Analysis
</button>
</div>
</div>
);

// --- QUIZ VIEW ---
if (view === 'quiz') {
const q = QUESTIONS[currentStep];
const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

return (
<div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4 md:p-6">
<div className="max-w-3xl w-full bg-white p-6 md:p-14 rounded-[32px] md:rounded-[48px] shadow-2xl border relative overflow-hidden">
<div className="absolute top-0 left-0 h-1.5 bg-[#002147] transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
<div className="flex justify-between items-center mb-8 md:mb-12">
<p className="text-[#C5A059] font-black uppercase text-[10px] tracking-widest">Step {currentStep + 1} of {QUESTIONS.length}</p>
<span className="bg-slate-50 px-3 py-1 rounded-lg font-mono text-xs font-bold text-slate-400">Pillar: {q.pillar}</span>
</div>
<h3 className="text-2xl md:text-4xl font-medium text-slate-800 mb-10 md:mb-16 leading-[1.2]">"{q.text}"</h3>
<div className="space-y-3">
{[
{ label: "Strongly Agree", val: 5 },
{ label: "Agree", val: 4 },
{ label: "Neutral", val: 3 },
{ label: "Disagree", val: 2 },
{ label: "Strongly Disagree", val: 1 },
].map((opt) => (
<button key={opt.val} onClick={() => {
setAnswers({ ...answers, [q.id]: opt.val });
if (currentStep < QUESTIONS.length - 1) {
setCurrentStep(currentStep + 1);
window.scrollTo(0, 0);
} else setView('results');
}} className="w-full text-left px-6 py-4 md:py-6 rounded-2xl border-2 border-slate-50 hover:border-[#C5A059] hover:bg-slate-50 transition-all font-bold text-slate-600 text-sm md:text-lg flex justify-between items-center group active:scale-[0.98]">
{opt.label}
<ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-[#C5A059]" />
</button>
))}
</div>
</div>
</div>
);
}

// --- RESULTS VIEW ---
if (view === 'results' && results) return (
<div className="min-h-screen bg-[#cbd5e1] py-6 md:py-12 px-4 md:px-6">

{/* ACTION HEADER (Hidden on Print) */}
<div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 gap-4 print:hidden">
<div className="flex gap-3 w-full md:w-auto">
<button
onClick={() => window.print()}
className="flex-1 md:flex-none bg-[#002147] text-white px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-[#C5A059] transition-all transform active:scale-95"
>
<Printer size={18}/> Print PDF
</button>
<button
onClick={saveResults}
disabled={isSaving}
className="flex-1 md:flex-none bg-[#C5A059] text-white px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-[#002147] transition-all transform active:scale-95 disabled:opacity-50"
>
<Save size={18}/> {isSaving ? "Syncing..." : "Sync to Campus"}
</button>
</div>
<button
onClick={() => {setAnswers({}); setCurrentStep(0); setView('welcome');}}
className="font-bold text-[#002147] flex items-center gap-2 bg-white/60 backdrop-blur-md px-6 py-3 rounded-full hover:bg-white transition-all border border-white/40"
>
<RefreshCw size={18}/> New Analysis
</button>
</div>

{/* TOAST NOTIFICATION */}
{showSavedToast && (
<div className="fixed top-8 right-8 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
<CheckCircle2 size={24} />
<span className="font-bold">Successfully synced to Campus Dashboard</span>
</div>
)}

{/* THE REPORT - 16:9 Slide Design */}
<div className="max-w-[1280px] mx-auto space-y-12">

{/* SLIDE 1: COVER */}
<div className="report-slide bg-[#FAF9F6] shadow-2xl flex flex-col p-8 md:p-24 border-t-[14px] border-[#002147] print:m-0 print:break-after-page relative overflow-hidden">
<div className="absolute top-0 right-0 p-10 opacity-5 text-[#002147]">
<Target size={300} />
</div>
<div className="flex-1 flex flex-col justify-center relative z-10">
<p className="uppercase tracking-[0.5em] text-[#C5A059] font-black text-xs md:text-sm mb-6">Confidential Diagnostic Report</p>
<h1 className="text-5xl md:text-[110px] font-serif font-black text-[#002147] leading-[0.9] mb-10">Worthy Retail<br/>X-Ray Profile</h1>
<p className="text-xl md:text-4xl text-[#C5A059] font-semibold italic">
Prepared for: <span className="text-[#002147] font-bold">{userName}</span>
</p>
<div className="w-32 h-2.5 bg-[#002147] mt-16"></div>
</div>
<div className="pt-10 flex justify-between items-center text-[#cbd5e1] font-black text-[10px] uppercase tracking-[0.3em] border-t">
<span>Worthy Retail | The Campus</span>
<span>Action Beats Intention™</span>
</div>
</div>

{/* SLIDE 2: ANALYSIS */}
<div className="report-slide bg-[#FAF9F6] shadow-2xl flex flex-col p-8 md:p-24 border-t-[14px] border-[#002147] print:m-0 print:break-after-page">
<h2 className="text-3xl md:text-5xl font-serif font-bold text-[#002147] mb-10 md:mb-16 border-b pb-8 flex justify-between items-center">
Analysis: {results.name}
<span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Metric Breakdown</span>
</h2>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-20 flex-1 items-start">
<div className="lg:col-span-7">
<div className="flex items-center gap-6 mb-8 md:mb-12">
<div className="p-5 bg-white shadow-xl rounded-2xl text-[#002147] border border-slate-50">{results.icon}</div>
<div>
<div className="inline-block px-3 py-1 bg-[#002147] text-white text-[10px] font-black uppercase rounded tracking-widest mb-2">Status: {results.status}</div>
<h3 className="text-4xl md:text-6xl font-serif font-black text-[#002147]">{results.name}</h3>
</div>
</div>
<p className="text-xl md:text-2xl text-slate-600 mb-12 italic leading-relaxed font-light">"{results.description}"</p>

<div className="space-y-4">
<PillarBar label="Bedrock (Psychological Safety)" value={results.calculatedScores.b} color="#002147" />
<PillarBar label="Fuel (Operational Velocity)" value={results.calculatedScores.f} color="#C5A059" />
<PillarBar label="Purpose (Ownership Clarity)" value={results.calculatedScores.p} color="#64748b" />
</div>
</div>

<div className="lg:col-span-5 flex flex-col gap-6">
<div className="bg-white p-8 md:p-12 rounded-[40px] border border-slate-100 shadow-2xl relative overflow-hidden">
<div className="absolute top-0 right-0 p-8 opacity-5 text-[#002147]"><Layout size={150} /></div>
<p className="text-[#C5A059] font-black uppercase tracking-widest text-[10px] block mb-6">Strategic Prescription</p>
<h4 className="text-2xl md:text-3xl font-serif font-bold text-[#002147] mb-6">Strive For:<br/>{results.striveFor}</h4>
<p className="text-slate-500 text-lg leading-relaxed mb-10">{results.prescription}</p>
<div className="flex items-center gap-3 font-bold text-[#002147] border-t pt-8">
<div className="w-10 h-10 rounded-full bg-[#002147] flex items-center justify-center text-[#C5A059]"><Target size={20} /></div>
BFP-THRIVE Phase I Roadmap
</div>
</div>
</div>
</div>

<div className="pt-10 flex justify-between items-center text-[#cbd5e1] font-black text-[10px] uppercase tracking-[0.3em]">
<span>Diagnostic Ver. 2.5</span>
<span>Proprietary Framework</span>
</div>
</div>
</div>

{/* DYNAMIC STYLING */}
<style>{`
/* WEB LAYOUT - Flexible and Responsive */
.report-slide {
width: 100%;
min-height: auto;
border-radius: 40px;
}

/* PRINT LAYOUT - Force 16:9 for PDF */
@media print {
body { background: white !important; padding: 0 !important; margin: 0 !important; }
.print\\:hidden { display: none !important; }
.report-slide {
width: 1280px !important;
height: 720px !important;
margin: 0 !important;
padding: 100px !important;
border-radius: 0 !important;
page-break-after: always !important;
-webkit-print-color-adjust: exact !important;
print-color-adjust: exact !important;
display: flex !important;
flex-direction: column !important;
box-shadow: none !important;
border: none !important;
}
@page { size: 1280px 720px; margin: 0; }
}
`}</style>
</div>
);
}
