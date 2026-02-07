import React, { useState, useMemo, useEffect } from 'react';
import { 
  Trophy, ShieldAlert, Zap, Compass, AlertTriangle, 
  ChevronRight, RefreshCw, Printer, Target, Save, 
  CheckCircle2, BarChart3, Lock, ArrowLeft, BookOpen, 
  PlayCircle, GraduationCap
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

// --- ROBUST FIREBASE INITIALIZATION ---
let db = null;
let auth = null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'worthy-retail-xray';

const initFirebase = () => {
  try {
    const rawConfig = import.meta.env.VITE_FIREBASE_CONFIG || (typeof __firebase_config !== 'undefined' ? __firebase_config : null);
    if (rawConfig) {
      const config = typeof rawConfig === 'string' ? JSON.parse(rawConfig.trim()) : rawConfig;
      const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
      auth = getAuth(app);
      db = getFirestore(app);
    }
  } catch (e) { console.error("Database connection pending..."); }
};

initFirebase();

const ARCHETYPES = {
  SOLID: { id: 'SOLID', name: 'Solid Foundation', color: '#059669', icon: <Trophy className="w-10 h-10 md:w-12 md:h-12" />, description: "Equilibrium across all three pillars. You drive exceptional results while maintaining deep trust.", prescription: "Ready for multi-unit leadership. Focus on scaling the BFP framework through mentorship.", striveFor: "Legacy Scaling" },
  BUREAUCRAT: { id: 'BUREAUCRAT', name: 'The Bureaucrat', color: '#2563eb', icon: <ShieldAlert className="w-10 h-10 md:w-12 md:h-12" />, description: "Trust is present, but velocity is low. Processes are prioritized over results.", prescription: "Inject Fuel immediately. Implement aggressive KPI targets and agile feedback loops.", striveFor: "Fuel Injection" },
  BURNOUT: { id: 'BURNOUT', name: 'Burnout Driver', color: '#f97316', icon: <Zap className="w-10 h-10 md:w-12 md:h-12" />, description: "KPIs met through brute force. High velocity but dangerously low Bedrock.", prescription: "Recover Purpose. Shift from 'Command & Control' to 'Clarity & Care' immediately.", striveFor: "Purpose Recovery" },
  VISIONARY: { id: 'VISIONARY', name: 'Performative Visionary', color: '#9333ea', icon: <Compass className="w-10 h-10 md:w-12 md:h-12" />, description: "Charismatic but fails in execution. The team loves the dream but is exhausted by reality.", prescription: "Stabilize Bedrock. Stop selling the future and start fixing the present systems.", striveFor: "Structural Integrity" },
  ACCIDENTAL: { id: 'ACCIDENTAL', name: 'The Accidental Leader', color: '#dc2626', icon: <AlertTriangle className="w-10 h-10 md:w-12 md:h-12" />, description: "Technical expert leading on instinct. Survival mode across all pillars.", prescription: "BFP Foundations. Enrollment in radical ownership and leadership basics is mandatory.", striveFor: "Core BFP Foundations" }
};

const CURRICULUM = {
  B: { title: "Bedrock: The Foundation", modules: [{ name: "Module 1: The Safety Gap", desc: "Auditing psychological safety and building the core trust required for retail." }, { name: "Module 2: Truth-Default Culture", desc: "Implementing transparency and communication systems that eliminate floor politics." }] },
  F: { title: "Fuel: The Velocity", modules: [{ name: "Module 3: Lean Retail Execution", desc: "Removing operational 'red tape' that kills your team's execution speed." }, { name: "Module 4: Agile Decision Loops", desc: "Training staff to solve problems in 60 seconds without needing you." }] },
  P: { title: "Purpose: The Legacy", modules: [{ name: "Module 5: The 'Why' Hierarchy", desc: "Connecting floor tasks to deep personal and community purpose." }, { name: "Module 6: Ownership Mindset", desc: "Building owner-operators who care about your store's success." }] }
};

const QUESTIONS = [
  { id: 1, pillar: 'B', text: "My team feels safe admitting mistakes to me without fear." },
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
      signInAnonymously(auth).then(setUser).catch(console.error);
      return onAuthStateChanged(auth, setUser);
    }
  }, []);

  useEffect(() => {
    if (!db || !user || !isAdminAuthenticated) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'assessments');
    return onSnapshot(q, (s) => {
      const d = s.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAssessments(d.sort((a,b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt)));
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
    const lowest = [{id: 'B', val: b}, {id: 'F', val: f}, {id: 'P', val: p}].reduce((p, c) => (p.val < c.val) ? p : c);
    return { ...arch, scores: { b, f, p }, lowestPillar: lowest.id };
  }, [answers]);

  const saveResults = async () => {
    if (!db || !user) return alert("System Syncing... Please wait 3 seconds and try again.");
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'assessments'), {
        userName, archetype: results.id, scores: results.scores, timestamp: new Date().toISOString(), createdAt: serverTimestamp()
      });
      alert("Success: Results synced to The Campus Dashboard.");
    } catch (e) { alert("Sync Error: " + e.message); }
    setIsSaving(false);
  };

  const PillarBar = ({ label, value, color }) => (
    <div className="w-full mb-4 md:mb-8">
      <div className="flex justify-between text-[10px] font-black uppercase mb-1 md:mb-2 text-slate-400 tracking-widest">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 md:h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full transition-all duration-1000" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );

  if (view === 'welcome') return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4 md:p-6 text-[#002147]">
      <div className="max-w-xl w-full bg-white p-8 md:p-16 rounded-[32px] md:rounded-[40px] shadow-2xl border-t-[10px] md:border-t-[12px] border-[#002147] text-center">
        <p className="uppercase tracking-widest text-[#C5A059] font-black text-[10px] md:text-xs mb-4">The Worthy Retail X-Ray</p>
        <h1 className="text-4xl md:text-6xl font-serif font-black mb-8 leading-tight">Leadership Diagnostic</h1>
        <input type="text" value={userName} onChange={(e)=>setUserName(e.target.value)} placeholder="Your Name..." className="w-full p-4 md:p-5 border-2 rounded-2xl text-center mb-6 md:mb-8 font-bold outline-none focus:border-[#C5A059]" />
        <button disabled={!userName} onClick={()=>setView('quiz')} className="w-full bg-[#002147] text-white py-4 md:py-5 rounded-full font-bold text-lg md:text-xl active:scale-95 transition-all">Start Analysis</button>
      </div>
      <button onClick={()=>setView('login')} className="mt-8 md:mt-12 text-slate-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-[#C5A059] transition-colors"><Lock size={12}/> Admin Portal</button>
    </div>
  );

  if (view === 'login') return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6 text-[#002147]">
      <div className="bg-white p-10 rounded-[32px] shadow-xl text-center max-w-sm w-full border">
        <Lock className="mx-auto mb-4 text-[#C5A059]" />
        <h2 className="text-2xl font-serif font-bold mb-6">Admin Access</h2>
        <input type="password" value={adminPassword} onChange={(e)=>setAdminPassword(e.target.value)} placeholder="Password..." className="w-full p-4 border rounded-xl mb-6 text-center" />
        <button onClick={()=>{if(adminPassword==='worthy2024'){setIsAdminAuthenticated(true); setView('admin');}else alert('Invalid Password');}} className="bg-[#002147] text-white p-4 rounded-full w-full font-bold active:scale-95 transition-transform">Enter Dashboard</button>
        <button onClick={()=>setView('welcome')} className="mt-4 text-slate-400 font-bold text-sm">Cancel</button>
      </div>
    </div>
  );

  if (view === 'quiz') return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white p-6 md:p-14 rounded-[32px] md:rounded-[40px] shadow-2xl border relative overflow-hidden">
        <div className="absolute top-0 left-0 h-1.5 bg-[#002147] transition-all duration-300" style={{width:`${((currentStep+1)/QUESTIONS.length)*100}%`}} />
        <h3 className="text-xl md:text-3xl font-medium mb-8 md:mb-12 leading-tight text-slate-800">"{QUESTIONS[currentStep].text}"</h3>
        <div className="space-y-2 md:space-y-3">
          {[5,4,3,2,1].map(v => (
            <button key={v} onClick={()=>{
              setAnswers({...answers, [QUESTIONS[currentStep].id]:v});
              if(currentStep < QUESTIONS.length-1) { setCurrentStep(currentStep+1); window.scrollTo(0,0); } else setView('results');
            }} className="w-full text-left p-4 md:p-5 rounded-2xl border-2 border-slate-50 hover:border-[#C5A059] font-bold text-slate-600 transition-all text-sm md:text-base">
              {v===5?'Strongly Agree':v===1?'Strongly Disagree':v===4?'Agree':v===2?'Disagree':'Neutral'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (view === 'results' && results) return (
    <div className="min-h-screen bg-[#cbd5e1] p-4 md:py-12 md:px-6 overflow-x-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-6 md:mb-10 gap-3 print:hidden">
            <div className="flex gap-2 w-full md:w-auto">
                <button onClick={()=>window.print()} className="flex-1 md:flex-none bg-[#002147] text-white px-6 py-4 rounded-full font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><Printer size={18}/> PDF</button>
                <button onClick={saveResults} className="flex-1 md:flex-none bg-[#C5A059] text-white px-6 py-4 rounded-full font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">{isSaving?'Syncing...':'Sync Data'}</button>
            </div>
            <button onClick={()=>{setAnswers({}); setCurrentStep(0); setView('welcome');}} className="w-full md:w-auto font-bold text-[#002147] bg-white/50 px-6 py-3 rounded-full hover:bg-white transition-all"><RefreshCw size={16} className="inline mr-2"/> Restart</button>
        </div>

        <div className="max-w-[1280px] mx-auto space-y-6 md:space-y-12">
            <div className="report-slide bg-[#FAF9F6] p-8 md:p-24 border-t-[10px] md:border-t-[14px] border-[#002147] shadow-2xl flex flex-col justify-center min-h-[400px] md:min-h-[720px] rounded-[24px] md:rounded-none">
                <p className="uppercase tracking-[0.3em] text-[#C5A059] font-black text-[10px] md:text-sm mb-4">Confidential Diagnostic</p>
                <h1 className="text-4xl md:text-8xl font-serif font-black text-[#002147] mb-6 md:mb-10 leading-[1.1]">Worthy Retail<br/>X-Ray Profile</h1>
                <p className="text-lg md:text-3xl italic text-slate-500">Prepared for: <span className="font-bold text-[#002147]">{userName}</span></p>
            </div>

            <div className="report-slide bg-[#FAF9F6] p-8 md:p-24 border-t-[10px] md:border-t-[14px] border-[#002147] shadow-2xl min-h-auto md:min-h-[720px] rounded-[24px] md:rounded-none">
                <h2 className="text-2xl md:text-4xl font-serif font-bold text-[#002147] mb-6 md:mb-12 border-b pb-4 md:pb-8 flex justify-between items-center">Analysis <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">BFP Framework</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20 items-start">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-4 mb-6 md:mb-10">
                            <div className="p-3 bg-white shadow-md rounded-xl text-[#002147] border">{results.icon}</div>
                            <div>
                                <div className="text-[10px] font-black uppercase text-[#002147] tracking-tighter opacity-50">Archetype</div>
                                <h3 className="text-2xl md:text-4xl font-serif font-black text-[#002147]">{results.name}</h3>
                            </div>
                        </div>
                        <p className="text-base md:text-2xl text-slate-600 italic mb-8 md:mb-12 leading-relaxed">"{results.description}"</p>
                        <PillarBar label="Bedrock (Trust)" value={results.scores.b} color="#002147" />
                        <PillarBar label="Fuel (Velocity)" value={results.scores.f} color="#C5A059" />
                        <PillarBar label="Purpose (Why)" value={results.scores.p} color="#64748b" />
                    </div>
                    <div className="bg-white p-6 md:p-12 rounded-[24px] md:rounded-[40px] border shadow-xl flex flex-col justify-center h-full">
                        <div className="text-[10px] font-black uppercase text-[#C5A059] mb-4">Strategic Priority</div>
                        <h4 className="text-xl md:text-2xl font-serif font-bold mb-4 md:mb-6 text-[#002147]">Strive For: {results.striveFor}</h4>
                        <p className="text-slate-500 text-sm md:text-xl mb-6 md:mb-10 leading-relaxed">{results.prescription}</p>
                        <div className="flex items-center gap-3 font-bold text-[#002147] border-t pt-6 md:pt-8 text-xs md:text-base"><Target className="text-[#C5A059]" size={20}/> Phase I Optimization</div>
                    </div>
                </div>
            </div>

            <div className="report-slide bg-[#FAF9F6] p-8 md:p-24 border-t-[10px] md:border-t-[14px] border-[#C5A059] shadow-2xl min-h-auto md:min-h-[720px] rounded-[24px] md:rounded-none">
                <div className="flex items-center gap-4 mb-10 border-b pb-8">
                  <div className="bg-[#002147] text-[#C5A059] p-4 rounded-full shadow-lg"><BookOpen size={32} /></div>
                  <h2 className="text-2xl md:text-4xl font-serif font-bold text-[#002147]">The Campus Roadmap</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-5 bg-white p-8 md:p-12 rounded-[32px] md:rounded-[48px] border shadow-xl text-center flex flex-col items-center justify-center">
                    <GraduationCap size={64} className="text-[#002147] mb-6" />
                    <h3 className="text-2xl font-serif font-bold text-[#002147] mb-4">{CURRICULUM[results.lowestPillar].title}</h3>
                    <p className="text-slate-500 text-sm md:text-base">Focus here to stabilize your foundational performance.</p>
                  </div>
                  <div className="lg:col-span-7 flex flex-col gap-4">
                    {CURRICULUM[results.lowestPillar].modules.map((mod, idx) => (
                      <div key={idx} className="bg-white p-6 md:p-8 rounded-3xl border hover:border-[#C5A059] transition-all flex items-start gap-5 group shadow-sm">
                        <div className="bg-slate-50 text-slate-300 group-hover:bg-[#C5A059] group-hover:text-white p-4 rounded-2xl transition-all"><PlayCircle size={24} /></div>
                        <div>
                          <h4 className="font-bold text-[#002147] text-lg md:text-xl">{mod.name}</h4>
                          <p className="text-sm md:text-base text-slate-500 mt-2 leading-relaxed">{mod.desc}</p>
                        </div>
                      </div>
                    ))}
                    <button className="bg-[#002147] text-white px-10 py-5 rounded-full font-bold shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all mt-4">Enroll in Masterclass <ChevronRight size={18} /></button>
                  </div>
                </div>
            </div>
        </div>

        <style>{`.report-slide { border-radius: 40px; } @media print { body { background: white !important; padding: 0 !important; } .print\\:hidden { display: none !important; } .report-slide { width: 1280px !important; height: 720px !important; border-radius: 0 !important; page-break-after: always !important; display: flex !important; flex-direction: column !important; padding: 80px !important; margin: 0 !important; } @page { size: 1280px 720px; margin: 0; } }`}</style>
    </div>
  );

  if (view === 'admin') return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 text-[#002147]">
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4"><BarChart3 className="text-[#C5A059]" size={24} /><h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight">Campus Admin</h1></div>
                <button onClick={()=>setView('welcome')} className="font-bold text-[#C5A059] flex items-center gap-2 bg-white px-4 py-2 rounded-lg border shadow-sm"><ArrowLeft size={16}/> Back</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="bg-white p-8 rounded-3xl shadow-sm border"><p className="text-[10px] font-black uppercase text-slate-400 mb-2">Total Diagnostics</p><p className="text-4xl font-serif font-black">{assessments.length}</p></div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border flex items-center gap-3 font-bold text-emerald-600">{db ? <CheckCircle2 size={24}/> : <RefreshCw className="animate-spin" size={24}/>} {db ? "Database Connected" : "Connecting..."}</div>
            </div>
            <div className="bg-white rounded-[24px] md:rounded-[40px] shadow-sm border overflow-hidden overflow-x-auto">
                <table className="w-full text-left"><thead className="bg-slate-50 border-b"><tr><th className="p-4 md:p-8 uppercase text-[10px] font-black text-slate-400">Leader</th><th className="p-4 md:p-8 uppercase text-[10px] font-black text-slate-400">Archetype</th><th className="p-4 md:p-8 uppercase text-[10px] font-black text-slate-400">Scores</th><th className="p-8 hidden md:table-cell uppercase text-[10px] font-black text-slate-400">Date</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                    {assessments.length === 0 ? <tr><td colSpan="4" className="p-20 text-center text-slate-400 italic font-serif">Waiting for cloud data...</td></tr> : assessments.map(e => (
                        <tr key={e.id} className="hover:bg-slate-50/50">
                            <td className="p-4 md:p-8 font-bold text-sm md:text-lg">{e.userName}</td>
                            <td className="p-4 md:p-8"><span className="px-2 py-1 rounded text-[10px] font-black uppercase border" style={{color: ARCHETYPES[e.archetype]?.color, borderColor: ARCHETYPES[e.archetype]?.color}}>{e.archetype}</span></td>
                            <td className="p-4 md:p-8 font-mono text-[10px] md:text-xs">{e.scores?.b}% / {e.scores?.f}% / {e.scores?.p}%</td>
                            <td className="hidden md:table-cell p-8 text-slate-300 text-sm">{e.timestamp ? new Date(e.timestamp).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                    ))}
                </tbody></table>
            </div>
        </div>
    </div>
  );
}
