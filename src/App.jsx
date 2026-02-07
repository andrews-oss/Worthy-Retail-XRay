import React, { useState, useMemo, useEffect } from 'react';
import {
Trophy, ShieldAlert, Zap, Compass, AlertTriangle,
ChevronRight, RefreshCw, Printer, Target, Save,
CheckCircle2, Layout, BarChart3, Lock, ArrowLeft
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

// SAFE DB INIT
let db = null;
let auth = null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'worthy-xray-prod';

try {
if (typeof __firebase_config !== 'undefined') {
const firebaseConfig = JSON.parse(__firebase_config);
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
auth = getAuth(app);
db = getFirestore(app);
}
} catch (e) { console.warn("Offline Mode Active"); }

const ARCHETYPES = {
SOLID: { id: 'SOLID', name: 'Solid Foundation', color: '#059669', icon: <Trophy />, status: "Legacy Ready", description: "Equilibrium across all three pillars.", prescription: "Ready for multi-unit leadership.", striveFor: "Legacy Scaling" },
BUREAUCRAT: { id: 'BUREAUCRAT', name: 'The Bureaucrat', color: '#2563eb', icon: <ShieldAlert />, status: "Stagnant", description: "Trust is present, but velocity is low.", prescription: "Inject Fuel immediately.", striveFor: "Fuel Injection" },
BURNOUT: { id: 'BURNOUT', name: 'Burnout Driver', color: '#f97316', icon: <Zap />, status: "Human Debt High", description: "KPIs met through brute force.", prescription: "Recover Purpose.", striveFor: "Purpose Recovery" },
VISIONARY: { id: 'VISIONARY', name: 'Performative Visionary', color: '#9333ea', icon: <Compass />, status: "Hollow Foundation", description: "Charismatic but fails in execution.", prescription: "Stabilize Bedrock systems.", striveFor: "Structural Integrity" },
ACCIDENTAL: { id: 'ACCIDENTAL', name: 'The Accidental Leader', color: '#dc2626', icon: <AlertTriangle />, status: "Critical Risk", description: "Technical expert leading on instinct.", prescription: "BFP Foundations required.", striveFor: "Core BFP Foundations" }
};

const QUESTIONS = [
{ id: 1, pillar: 'B', text: "My team feels safe admitting mistakes without fear." },
{ id: 2, pillar: 'B', text: "I default to transparency during high pressure." },
{ id: 3, pillar: 'B', text: "Trust is strong enough to avoid micromanagement." },
{ id: 4, pillar: 'B', text: "Conflict is resolved through direct dialogue." },
{ id: 5, pillar: 'B', text: "My team knows I have their back." },
{ id: 6, pillar: 'B', text: "We have a 'Truth-Default' culture." },
{ id: 7, pillar: 'F', text: "We hit KPIs without 'brute force' efforts." },
{ id: 8, pillar: 'F', text: "Processes accelerate our speed." },
{ id: 9, pillar: 'F', text: "I have systems to measure velocity." },
{ id: 10, pillar: 'F', text: "Decisions are made quickly using data." },
{ id: 11, pillar: 'F', text: "The team uses tech tools effectively." },
{ id: 12, pillar: 'F', text: "We can pivot strategy within 24 hours." },
{ id: 13, pillar: 'P', text: "Every team member knows our 'Why'." },
{ id: 14, pillar: 'P', text: "Team treats the store as a legacy." },
{ id: 15, pillar: 'P', text: "Growth is discussed as often as sales." },
{ id: 16, pillar: 'P', text: "Team understands their brand impact." },
{ id: 17, pillar: 'P', text: "We share a vision of 'Winning'." },
{ id: 18, pillar: 'P', text: "Morale stays high during tough periods." }
];

export default function App() {
const [view, setView] = useState('welcome');
const [answers, setAnswers] = useState({});
const [currentStep, setCurrentStep] = useState(0);
const [user, setUser] = useState(null);
const [userName, setUserName] = useState("");
const [isSaving, setIsSaving] = useState(false);
const [adminPassword, setAdminPassword] = useState("");
const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
const [assessments, setAssessments] = useState([]);

useEffect(() => {
if (auth) {
signInAnonymously(auth).catch(console.error);
return onAuthStateChanged(auth, setUser);
}
}, []);

useEffect(() => {
if (!db || !user || !isAdminAuthenticated) return;
return onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'assessments'), (s) => {
const d = s.docs.map(doc => ({ id: doc.id, ...doc.data() }));
setAssessments(d.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
});
}, [user, isAdminAuthenticated]);

const results = useMemo(() => {
if (Object.keys(answers).length < QUESTIONS.length) return null;
const s = { B: 0, F: 0, P: 0 };
QUESTIONS.forEach(q => s[q.pillar] += (answers[q.id] || 0));
const b = Math.round((s.B/30)*100), f = Math.round((s.F/30)*100), p = Math.round((s.P/30)*100);
let arch = ARCHETYPES.ACCIDENTAL;
if (b >= 80 && f >= 80 && p >= 80) arch = ARCHETYPES.SOLID;
else if (b >= 75 && f <= 55) arch = ARCHETYPES.BUREAUCRAT;
else if (f >= 80 && b <= 65) arch = ARCHETYPES.BURNOUT;
else if (p >= 80 && b <= 65) arch = ARCHETYPES.VISIONARY;
return { ...arch, scores: { b, f, p } };
}, [answers]);

const saveResults = async () => {
if (!db || !user || !results) return alert("Save failed: Database Offline");
setIsSaving(true);
try {
await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'assessments'), {
userName, archetype: results.id, scores: results.scores, timestamp: new Date().toISOString()
});
alert("Results Synced!");
} catch (e) { console.error(e); }
setIsSaving(false);
};

if (view === 'welcome') return (
<div className="min-h-screen flex flex-col items-center justify-center p-6 text-[#002147]">
<div className="max-w-2xl w-full bg-white p-12 rounded-[40px] shadow-2xl border-t-[12px] border-[#002147] text-center">
<h1 className="text-5xl font-serif font-black mb-10">Leadership X-Ray</h1>
<input type="text" value={userName} onChange={(e)=>setUserName(e.target.value)} placeholder="Your Name..." className="w-full p-5 border-2 rounded-2xl text-center mb-8 font-bold" />
<button disabled={!userName} onClick={()=>setView('quiz')} className="bg-[#002147] text-white px-12 py-5 rounded-full font-bold text-xl disabled:opacity-50">Start Diagnostic</button>
</div>
<button onClick={()=>setView('login')} className="mt-8 text-slate-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Lock size={12}/> Admin Portal</button>
</div>
);

if (view === 'login') return (
<div className="min-h-screen flex items-center justify-center p-6">
<div className="bg-white p-10 rounded-3xl shadow-xl text-center">
<h2 className="text-2xl font-serif font-bold mb-6">Admin Login</h2>
<input type="password" value={adminPassword} onChange={(e)=>setAdminPassword(e.target.value)} placeholder="Password..." className="w-full p-4 border rounded-xl mb-6 text-center" />
<button onClick={()=>{if(adminPassword==='worthy2024'){setIsAdminAuthenticated(true); setView('admin');}else alert('Wrong');}} className="bg-[#002147] text-white p-4 rounded-full w-full font-bold">Enter Dashboard</button>
</div>
</div>
);

if (view === 'quiz') return (
<div className="min-h-screen flex flex-col items-center justify-center p-4">
<div className="max-w-3xl w-full bg-white p-10 rounded-[40px] shadow-xl relative overflow-hidden">
<div className="absolute top-0 left-0 h-1 bg-[#002147]" style={{width:`${((currentStep+1)/QUESTIONS.length)*100}%`}} />
<h3 className="text-3xl font-medium mb-12 leading-tight">"{QUESTIONS[currentStep].text}"</h3>
<div className="space-y-3">
{[5,4,3,2,1].map(v => (
<button key={v} onClick={()=>{
setAnswers({...answers, [QUESTIONS[currentStep].id]:v});
if(currentStep < QUESTIONS.length-1) setCurrentStep(currentStep+1); else setView('results');
}} className="w-full text-left p-5 rounded-2xl border-2 hover:border-[#C5A059] font-bold text-slate-600">
{v===5?'Strongly Agree':v===1?'Strongly Disagree':v===4?'Agree':v===2?'Disagree':'Neutral'}
</button>
))}
</div>
</div>
</div>
);

if (view === 'results') return (
<div className="min-h-screen bg-[#cbd5e1] p-6">
<div className="max-w-6xl mx-auto flex justify-between items-center mb-8 print:hidden">
<button onClick={()=>window.print()} className="bg-[#002147] text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 shadow-lg"><Printer size={18}/> PDF</button>
<button onClick={saveResults} className="bg-[#C5A059] text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 shadow-lg">{isSaving?'Syncing...':'Sync to Campus'}</button>
<button onClick={()=>{setAnswers({}); setView('welcome');}} className="font-bold text-[#002147]">Restart</button>
</div>
<div className="max-w-[1280px] mx-auto space-y-10">
<div className="report-slide bg-[#FAF9F6] p-20 border-t-[14px] border-[#002147] shadow-2xl min-h-[720px] flex flex-col justify-center">
<p className="uppercase tracking-widest text-[#C5A059] font-black text-sm mb-4">Confidential Diagnostic</p>
<h1 className="text-8xl font-serif font-black text-[#002147] mb-8">Worthy Retail<br/>X-Ray Profile</h1>
<p className="text-2xl italic">Prepared for: <span className="font-bold">{userName}</span></p>
</div>
<div className="report-slide bg-[#FAF9F6] p-20 border-t-[14px] border-[#002147] shadow-2xl min-h-[720px]">
<h2 className="text-4xl font-serif font-bold text-[#002147] mb-12 border-b pb-8">Analysis: {results.name}</h2>
<div className="grid grid-cols-2 gap-20">
<div className="space-y-10">
<p className="text-2xl text-slate-600 italic">"{results.description}"</p>
{['Bedrock','Fuel','Purpose'].map((p,i)=>(
<div key={p}>
<div className="flex justify-between text-[10px] font-black uppercase mb-2"><span>{p}</span><span>{Object.values(results.scores)[i]}%</span></div>
<div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-[#002147]" style={{width:`${Object.values(results.scores)[i]}%`}}/></div>
</div>
))}
</div>
<div className="bg-white p-10 rounded-[40px] border shadow-xl">
<h4 className="text-2xl font-serif font-bold mb-6">Prescription</h4>
<p className="text-slate-500 mb-10 leading-relaxed">{results.prescription}</p>
<div className="flex items-center gap-3 font-bold text-[#002147] border-t pt-8"><Target className="text-[#C5A059]"/> {results.striveFor}</div>
</div>
</div>
</div>
</div>
<style>{`@media print { .print\\:hidden { display: none !important; } .report-slide { width: 1280px !important; height: 720px !important; border: none !important; box-shadow: none !important; page-break-after: always !important; } @page { size: 1280px 720px; margin: 0; } }`}</style>
</div>
);

if (view === 'admin') return (
<div className="min-h-screen bg-slate-50 p-10 text-[#002147]">
<div className="max-w-6xl mx-auto">
<div className="flex justify-between items-center mb-10">
<h1 className="text-3xl font-serif font-bold">Campus Admin</h1>
<button onClick={()=>setView('welcome')} className="font-bold text-[#C5A059]">Exit</button>
</div>
<div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
<table className="w-full text-left">
<thead className="bg-slate-50 border-b">
<tr><th className="p-6">Leader</th><th className="p-6">Archetype</th><th className="p-6">B/F/P</th><th className="p-6">Date</th></tr>
</thead>
<tbody className="divide-y">
{assessments.map(e => (
<tr key={e.id}><td className="p-6 font-bold">{e.userName}</td><td className="p-6 font-black uppercase text-[10px]">{e.archetype}</td><td className="p-6 font-mono text-xs">{e.scores?.b}% / {e.scores?.f}% / {e.scores?.p}%</td><td className="p-6 text-slate-400">{new Date(e.timestamp).toLocaleDateString()}</td></tr>
))}
</tbody>
</table>
</div>
</div>
</div>
);
}
