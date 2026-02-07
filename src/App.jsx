import React, { useState, useMemo, useEffect } from 'react';
import {
Trophy, ShieldAlert, Zap, Compass, AlertTriangle,
ChevronRight, RefreshCw, Printer, Target, Save,
CheckCircle2, Layout, BarChart3, Info, Users,
ArrowLeft, Lock
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import {
getAuth,
signInAnonymously,
onAuthStateChanged
} from 'firebase/auth';
import {
getFirestore,
collection,
addDoc,
onSnapshot,
serverTimestamp
} from 'firebase/firestore';

// --- SAFE FIREBASE INITIALIZATION ---
let db = null;
let auth = null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'worthy-xray-prod';

try {
// We only initialize if the config is present (provided by environment or hardcoded)
if (typeof __firebase_config !== 'undefined') {
const firebaseConfig = JSON.parse(__firebase_config);
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
auth = getAuth(app);
db = getFirestore(app);
}
} catch (e) {
console.warn("Database not connected. Running in offline mode.");
}

const ARCHETYPES = {
SOLID: { id: 'SOLID', name: 'Solid Foundation', color: '#059669', icon: <Trophy className="w-12 h-12" />, status: "Legacy Ready", description: "Equilibrium across all three pillars. You drive results while maintaining deep trust.", prescription: "Ready for multi-unit leadership. Focus on scaling the BFP framework through mentorship.", striveFor: "Legacy Scaling" },
BUREAUCRAT: { id: 'BUREAUCRAT', name: 'The Bureaucrat', color: '#2563eb', icon: <ShieldAlert className="w-12 h-12" />, status: "Stagnant", description: "Trust is present, but velocity is low. Processes are prioritized over results.", prescription: "Inject Fuel. Implement aggressive KPI targets and agile feedback loops.", striveFor: "Fuel Injection" },
BURNOUT: { id: 'BURNOUT', name: 'Burnout Driver', color: '#f97316', icon: <Zap className="w-12 h-12" />, status: "Human Debt High", description: "KPIs met through brute force. High velocity but dangerously low Bedrock.", prescription: "Recover Purpose. Shift from 'Command & Control' to 'Clarity & Care'.", striveFor: "Purpose Recovery" },
VISIONARY: { id: 'VISIONARY', name: 'Performative Visionary', color: '#9333ea', icon: <Compass className="w-12 h-12" />, status: "Hollow Foundation", description: "Charismatic but fails in execution. The team loves the dream but is exhausted by reality.", prescription: "Stabilize Bedrock. Stop selling the future and start fixing the present systems.", striveFor: "Structural Integrity" },
ACCIDENTAL: { id: 'ACCIDENTAL', name: 'The Accidental Leader', color: '#dc2626', icon: <AlertTriangle className="w-12 h-12" />, status: "Critical Risk", description: "Technical expert leading on instinct. Survival mode across all pillars.", prescription: "BFP Foundations. Enrollment in leadership basic training is mandatory.", striveFor: "Core BFP Foundations" }
};

const QUESTIONS = [
{ id: 1, pillar: 'B', text: "My team feels safe admitting mistakes to me without fear of retribution." },
{ id: 2, pillar: 'B', text: "I default to transparency during high pressure rather than withholding information." },
{ id: 3, pillar: 'B', text: "Trust within the team is strong enough that I rarely feel the need to micromanage." },
{ id: 4, pillar: 'B', text: "Conflict within my team is resolved through open, direct dialogue." },
{ id: 5, pillar: 'B', text: "My team knows I have their back when external pressures arise." },
{ id: 6, pillar: 'B', text: "We have a 'Truth-Default' culture where honesty is valued over harmony." },
{ id: 7, pillar: 'F', text: "We consistently hit our operational KPIs without requiring 'brute force' efforts." },
{ id: 8, pillar: 'F', text: "Our internal processes accelerate our speed rather than acting as red tape." },
{ id: 9, pillar: 'F', text: "I have clear systems to measure and improve our team's operational velocity." },
{ id: 10, pillar: 'F', text: "Decisions are made quickly based on data rather than waiting for consensus." },
{ id: 11, pillar: 'F', text: "My team uses technology effectively to simplify routine retail tasks." },
{ id: 12, pillar: 'F', text: "We can pivot store strategy or layout within 24 hours without chaos." },
{ id: 13, pillar: 'P', text: "Every member of my team can clearly state the 'Why' behind our store mission." },
{ id: 14, pillar: 'P', text: "The team treats the store as a legacy they are building, not just a paycheck." },
{ id: 15, pillar: 'P', text: "Personal growth and purpose are discussed as often as sales targets." },
{ id: 16, pillar: 'P', text: "My team understands how their daily tasks contribute to the long-term success." },
{ id: 17, pillar: 'P', text: "We have a shared vision of what 'Winning' looks like beyond the numbers." },
{ id: 18, pillar: 'P', text: "Morale remains high even when we are facing difficult sales periods." }
];

export default function App() {
const [view, setView] = useState('welcome');
const [answers, setAnswers] = useState({});
const [currentStep, setCurrentStep] = useState(0);
const [user, setUser] = useState(null);
const [isSaving, setIsSaving] = useState(false);
const [userName, setUserName] = useState("");
const [adminPassword, setAdminPassword] = useState("");
const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
const [assessments, setAssessments] = useState([]);

useEffect(() => {
if (auth) {
signInAnonymously(auth).catch(console.error);
const unsubscribe = onAuthStateChanged(auth, setUser);
return () => unsubscribe();
}
}, []);

useEffect(() => {
if (!db || !user || !isAdminAuthenticated) return;
const q = collection(db, 'artifacts', appId, 'public', 'data', 'assessments');
const unsubscribe = onSnapshot(q, (snapshot) => {
const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
data.sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));
setAssessments(data);
});
return () => unsubscribe();
}, [user, isAdminAuthenticated]);

const results = useMemo(() => {
if (Object.keys(answers).length < QUESTIONS.length) return null;
const s = { B: 0, F: 0, P: 0 };
QUESTIONS.forEach(q => s[q.pillar] += (answers[q.id] || 0));
const bPct = Math.round((s.B / 30) * 100);
const fPct = Math.round((s.F / 30) * 100);
const pPct = Math.round((s.P / 30) * 100);

let base = ARCHETYPES.ACCIDENTAL;
if (bPct >= 80 && fPct >= 80 && pPct >= 80) base = ARCHETYPES.SOLID;
else if (bPct >= 75 && fPct <= 55) base = ARCHETYPES.BUREAUCRAT;
else if (fPct >= 80 && bPct <= 65) base = ARCHETYPES.BURNOUT;
else if (pPct >= 80 && bPct <= 65) base = ARCHETYPES.VISIONARY;

return { ...base, calculatedScores: { b: bPct, f: fPct, p: pPct } };
}, [answers]);

const saveResults = async () => {
if (!db || !user || !results || !userName) {
alert("Cloud storage not configured. Please use Print to PDF to save results.");
return;
}
setIsSaving(true);
try {
await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'assessments'), {
userId: user.uid, userName, archetype: results.id, scores: results.calculatedScores, timestamp: new Date().toISOString(), createdAt: serverTimestamp()
});
alert("Results synced to Campus Dashboard.");
} catch (e) { console.error(e); }
setIsSaving(false);
};

const checkAdminLogin = (e) => {
e.preventDefault();
if (adminPassword === "worthy2024") {
setIsAdminAuthenticated(true);
setView('admin');
} else {
alert("Invalid Admin Password");
}
};

const PillarBar = ({ label, value, color }) => (
<div className="w-full mb-6">
<div className="flex justify-between items-end mb-2">
<span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
<span className="text-sm font-bold text-[#002147]">{value}%</span>
</div>
<div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
<div className="h-full transition-all duration-1000" style={{ width: `${value}%`, backgroundColor: color }} />
</div>
</div>
);

if (view === 'welcome') return (
<div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-[#002147]">
<div className="max-w-2xl w-full bg-white p-12 md:p-16 rounded-[40px] shadow-2xl border-t-[12px] border-[#002147] text-center">
<p className="uppercase tracking-[0.4em] text-[#C5A059] font-black text-xs mb-6">The Worthy Retail X-Ray</p>
<h1 className="text-5xl md:text-6xl font-serif font-black mb-10 leading-tight">Leadership<br/>Diagnostic</h1>
<div className="mb-10 text-left">
<label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Participant Name</label>
<input
type="text" value={userName} onChange={(e) => setUserName(e.target.value)}
placeholder="Enter your name..."
className="w-full p-5 border-2 border-slate-100 rounded-2xl text-center font-bold text-[#002147] focus:border-[#C5A059] outline-none"
/>
</div>
<button disabled={!userName} onClick={() => setView('quiz')} className="bg-[#002147] text-white px-12 py-6 rounded-full font-bold text-xl hover:bg-[#C5A059] transition-all disabled:opacity-50 active:scale-95">Start Analysis</button>
</div>
<button onClick={() => setView('login')} className="mt-12 text-slate-300 font-bold uppercase tracking-widest text-[10px] hover:text-[#C5A059] transition-colors flex items-center gap-2">
<Lock size={12}/> Campus Admin
</button>
</div>
);

if (view === 'login') return (
<div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
<div className="max-w-md w-full bg-white p-10 rounded-[32px] shadow-xl border text-center">
<Lock className="mx-auto mb-6 text-[#002147]" size={48} />
<h2 className="text-3xl font-serif font-bold text-[#002147] mb-8">Admin Access</h2>
<form onSubmit={checkAdminLogin}>
<input
type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
placeholder="Enter password..."
className="w-full p-4 border-2 border-slate-100 rounded-2xl text-center mb-6 outline-none focus:border-[#002147]"
/>
<div className="flex flex-col gap-4">
<button type="submit" className="bg-[#002147] text-white p-4 rounded-full font-bold">Login to Dashboard</button>
<button type="button" onClick={() => setView('welcome')} className="text-slate-400 font-bold">Cancel</button>
</div>
</form>
</div>
</div>
);

if (view === 'quiz') return (
<div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6">
<div className="max-w-3xl w-full bg-white p-10 md:p-14 rounded-[40px] shadow-2xl border relative">
<div className="absolute top-0 left-0 h-1.5 bg-[#002147] transition-all duration-300" style={{ width: `${((currentStep+1)/QUESTIONS.length)*100}%` }} />
<p className="text-[#C5A059] font-black uppercase text-[10px] tracking-widest mb-4">Step {currentStep+1} / {QUESTIONS.length}</p>
<h3 className="text-3xl font-medium text-slate-800 mb-12 leading-tight">"{QUESTIONS[currentStep].text}"</h3>
<div className="space-y-3">
{[5, 4, 3, 2, 1].map((val) => (
<button key={val} onClick={() => {
setAnswers({ ...answers, [QUESTIONS[currentStep].id]: val });
if (currentStep < QUESTIONS.length - 1) {
setCurrentStep(currentStep + 1);
window.scrollTo(0, 0);
} else setView('results');
}} className="w-full text-left px-8 py-5 rounded-2xl border-2 hover:border-[#C5A059] font-bold text-slate-600 active:scale-95 transition-transform">
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
<div className="flex gap-4">
<button onClick={() => window.print()} className="bg-[#002147] text-white px-8 py-4 rounded-full font-bold flex items-center gap-2"><Printer size={18}/> PDF</button>
<button onClick={saveResults} disabled={isSaving} className="bg-[#C5A059] text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:bg-[#002147] active:scale-95 transition-all shadow-lg">{isSaving ? "Syncing..." : "Sync to Campus"}</button>
</div>
<button onClick={() => {setAnswers({}); setCurrentStep(0); setView('welcome');}} className="font-bold text-[#002147]">New Test</button>
</div>
<div className="max-w-[1280px] mx-auto space-y-10">
<div className="report-slide bg-[#FAF9F6] p-20 border-t-[14px] border-[#002147] shadow-2xl flex flex-col justify-center min-h-[720px]">
<p className="uppercase tracking-[0.4em] text-[#C5A059] font-black text-xs mb-6">Confidential Diagnostic Report</p>
<h1 className="text-8xl font-serif font-black text-[#002147] mb-8 leading-tight">Worthy Retail<br/>X-Ray Profile</h1>
<p className="text-3xl text-[#C5A059] font-semibold italic">Prepared for: <span className="text-[#002147] font-bold">{userName}</span></p>
</div>
<div className="report-slide bg-[#FAF9F6] p-20 border-t-[14px] border-[#002147] shadow-2xl min-h-[720px]">
<h2 className="text-4xl font-serif font-bold text-[#002147] mb-12 border-b pb-8">Analysis: {results.name}</h2>
<div className="grid grid-cols-2 gap-20">
<div>
<p className="text-2xl text-slate-600 italic mb-10 leading-relaxed">"{results.description}"</p>
<div className="space-y-8">
<PillarBar label="Bedrock (Trust)" value={results.calculatedScores.b} color="#002147" />
<PillarBar label="Fuel (Velocity)" value={results.calculatedScores.f} color="#C5A059" />
<PillarBar label="Purpose (Why)" value={results.calculatedScores.p} color="#475569" />
</div>
</div>
<div className="bg-white p-12 rounded-[40px] border shadow-xl">
<h4 className="text-2xl font-serif font-bold text-[#002147] mb-6">Prescription</h4>
<p className="text-xl text-slate-500 mb-10 leading-relaxed">{results.prescription}</p>
<div className="flex items-center gap-3 font-bold text-[#002147] border-t pt-8"><Target className="text-[#C5A059]" /> {results.striveFor}</div>
</div>
</div>
</div>
</div>
<style>{`
@media print {
body { background: white !important; padding: 0 !important; }
.print\\:hidden { display: none !important; }
.report-slide {
width: 1280px !important;
height: 720px !important;
border: none !important;
box-shadow: none !important;
page-break-after: always !important;
display: flex !important;
flex-direction: column !important;
}
@page { size: 1280px 720px; margin: 0; }
}
`}</style>
</div>
);

if (view === 'admin') return (
<div className="min-h-screen bg-[#f8fafc] text-[#002147]">
<div className="bg-[#002147] text-white p-6 sticky top-0 z-50">
<div className="max-w-7xl mx-auto flex justify-between items-center">
<div className="flex items-center gap-4">
<BarChart3 className="text-[#C5A059]" size={32} />
<h1 className="text-2xl font-serif font-bold tracking-tight">Campus Admin Dashboard</h1>
</div>
<button onClick={() => setView('welcome')} className="flex items-center gap-2 font-bold text-[#C5A059] hover:text-white">
<ArrowLeft size={20}/> Back to App
</button>
</div>
</div>
<div className="max-w-7xl mx-auto p-10">
<div className="bg-white rounded-[40px] shadow-sm border overflow-hidden">
<table className="w-full text-left">
<thead className="bg-slate-50 border-b">
<tr>
<th className="px-8 py-4 uppercase text-[10px] font-black text-slate-400">Leader</th>
<th className="px-8 py-4 uppercase text-[10px] font-black text-slate-400">Archetype</th>
<th className="px-8 py-4 uppercase text-[10px] font-black text-slate-400">B / F / P</th>
<th className="px-8 py-4 uppercase text-[10px] font-black text-slate-400">Date</th>
</tr>
</thead>
<tbody className="divide-y">
{assessments.length === 0 ? (
<tr><td colSpan="4" className="p-20 text-center text-slate-400 italic">No cloud data synced. Check your Firebase settings.</td></tr>
) : assessments.map((e) => (
<tr key={e.id}>
<td className="px-8 py-6 font-bold">{e.userName}</td>
<td className="px-8 py-6">
<span className="px-3 py-1 bg-navy text-white text-[10px] font-black rounded uppercase" style={{backgroundColor: ARCHETYPES[e.archetype]?.color}}>
{ARCHETYPES[e.archetype]?.name}
</span>
</td>
<td className="px-8 py-6 font-mono text-xs">{e.scores?.b}% / {e.scores?.f}% / {e.scores?.p}%</td>
<td className="px-8 py-6 text-slate-400 text-sm">{e.timestamp ? new Date(e.timestamp).toLocaleDateString() : 'N/A'}</td>
</tr>
))}
</tbody>
</table>
</div>
</div>
</div>
);
}
