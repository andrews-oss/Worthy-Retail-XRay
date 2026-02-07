import React, { useState, useMemo, useEffect } from 'react';
import { 
  Trophy, ShieldAlert, Zap, Compass, AlertTriangle, 
  ChevronRight, RefreshCw, Printer, Target, Save, 
  CheckCircle2, BarChart3, Lock, ArrowLeft, BookOpen, 
  PlayCircle, GraduationCap, Users, LayoutDashboard,
  TrendingUp, Activity, PieChart, Map
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

// --- CLOUD INITIALIZATION ---
let db = null;
let auth = null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'worthy-retail-xray';

const initFirebase = () => {
  try {
    const rawConfig = import.meta.env.VITE_FIREBASE_CONFIG || (typeof __firebase_config !== 'undefined' ? __firebase_config : null);
    if (rawConfig) {
      let config = rawConfig;
      if (typeof rawConfig === 'string') {
        const cleaned = rawConfig.trim().replace(/;$/, '').replace(/^[^{]*/, '').replace(/[^}]*$/, '');
        config = JSON.parse(cleaned);
      }
      const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
      auth = getAuth(app);
      db = getFirestore(app);
    }
  } catch (e) { console.error("Cloud connection pending..."); }
};

initFirebase();

const ARCHETYPES = {
  SOLID: { id: 'SOLID', name: 'Solid Foundation', color: '#059669', icon: <Trophy className="w-8 h-8" /> },
  BUREAUCRAT: { id: 'BUREAUCRAT', name: 'The Bureaucrat', color: '#2563eb', icon: <ShieldAlert className="w-8 h-8" /> },
  BURNOUT: { id: 'BURNOUT', name: 'Burnout Driver', color: '#f97316', icon: <Zap className="w-8 h-8" /> },
  VISIONARY: { id: 'VISIONARY', name: 'Performative Visionary', color: '#9333ea', icon: <Compass className="w-8 h-8" /> },
  ACCIDENTAL: { id: 'ACCIDENTAL', name: 'The Accidental Leader', color: '#dc2626', icon: <AlertTriangle className="w-8 h-8" /> }
};

const CURRICULUM = {
  B: { title: "Bedrock: The Foundation", modules: [{ name: "Module 1: The Safety Gap", desc: "Building trust on the floor." }, { name: "Module 2: Truth-Default Culture", desc: "Transparency systems." }] },
  F: { title: "Fuel: The Velocity", modules: [{ name: "Module 3: Lean Retail Execution", desc: "Removing operational friction." }, { name: "Module 4: Agile Decision Loops", desc: "Staff problem-solving." }] },
  P: { title: "Purpose: The Legacy", modules: [{ name: "Module 5: The 'Why' Hierarchy", desc: "Connecting tasks to mission." }, { name: "Module 6: Ownership Mindset", desc: "Building owner-operators." }] }
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
  const [teamCode, setTeamCode] = useState("");
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
    if (!db || !user) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'assessments');
    return onSnapshot(q, (s) => {
      const d = s.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAssessments(d.sort((a,b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt)));
    });
  }, [user]);

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
    const lowest = [{id: 'B', val: b}, {id: 'F', val: f}, {id: 'P', val: p}].reduce((prev, curr) => (prev.val < curr.val) ? prev : curr);
    return { ...arch, scores: { b, f, p }, lowestPillar: lowest.id };
  }, [answers]);

  const teamStats = useMemo(() => {
    const filtered = teamCode ? assessments.filter(a => a.teamCode?.toLowerCase() === teamCode.toLowerCase()) : [];
    if (filtered.length === 0) return null;
    const count = filtered.length;
    const bAvg = Math.round(filtered.reduce((acc, val) => acc + val.scores.b, 0) / count);
    const fAvg = Math.round(filtered.reduce((acc, val) => acc + val.scores.f, 0) / count);
    const pAvg = Math.round(filtered.reduce((acc, val) => acc + val.scores.p, 0) / count);
    return { bAvg, fAvg, pAvg, count, members: filtered };
  }, [assessments, teamCode]);

  const saveResults = async () => {
    if (!db || !user) return alert("Establishing Cloud Sync... Try again in 2 seconds.");
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'assessments'), {
        userName, teamCode, archetype: results.id, scores: results.scores, timestamp: new Date().toISOString(), createdAt: serverTimestamp()
      });
      alert("SUCCESS: Results synced to The Campus.");
    } catch (e) { alert("Sync Error: " + e.message); }
    setIsSaving(false);
  };

  const PillarBar = ({ label, value, color, small = false }) => (
    <div className={`w-full ${small ? 'mb-2' : 'mb-4 md:mb-8'}`}>
      <div className={`flex justify-between font-black uppercase mb-1 text-slate-400 ${small ? 'text-[8px]' : 'text-[10px]'}`}>
        <span>{label}</span><span>{value}%</span>
      </div>
      <div className={`${small ? 'h-1' : 'h-2 md:h-2.5'} bg-slate-100 rounded-full overflow-hidden`}>
        <div className="h-full transition-all duration-1000" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );

  if (view === 'welcome') return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4 md:p-6 text-[#002147]">
      <div className="max-w-xl w-full bg-white p-8 md:p-16 rounded-[40px] shadow-2xl border-t-[12px] border-[#002147] text-center">
        <p className="uppercase tracking-widest text-[#C5A059] font-black text-[10px] mb-4">The Worthy Retail X-Ray</p>
        <h1 className="text-4xl md:text-6xl font-serif font-black mb-10 leading-tight">Leadership Diagnostic</h1>
        
        <div className="space-y-4 mb-8">
            <div className="text-left">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-1 block">Your Identity</label>
                <input type="text" value={userName} onChange={(e)=>setUserName(e.target.value)} placeholder="Full Name..." className="w-full p-5 border-2 rounded-2xl font-bold outline-none focus:border-[#C5A059] transition-all" />
            </div>
            <div className="text-left relative">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-1 block">Team / Store Code</label>
                <input type="text" value={teamCode} onChange={(e)=>setTeamCode(e.target.value)} placeholder="Optional (e.g. STORE101)" className="w-full p-5 border-2 rounded-2xl font-bold outline-none focus:border-[#C5A059] transition-all uppercase" />
                {teamCode.length > 2 && (
                    <button onClick={()=>setView('team_dashboard')} className="absolute right-4 bottom-4 text-[#C5A059] font-black text-[10px] uppercase flex items-center gap-1 hover:text-[#002147] transition-colors"><LayoutDashboard size={14}/> View Team Insight</button>
                )}
            </div>
        </div>

        <button disabled={!userName} onClick={()=>setView('quiz')} className="w-full bg-[#002147] text-white py-5 rounded-full font-bold text-xl active:scale-95 transition-all shadow-xl hover:bg-[#C5A059]">Start Analysis</button>
      </div>
      <button onClick={()=>setView('login')} className="mt-12 text-slate-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-[#C5A059] transition-colors"><Lock size={12}/> Admin Portal</button>
    </div>
  );

  if (view === 'team_dashboard') return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 text-[#002147]">
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="bg-[#002147] text-[#C5A059] p-3 rounded-2xl shadow-lg"><Activity size={24} /></div>
                  <div>
                    <h1 className="text-2xl font-serif font-bold">Team Insight: {teamCode.toUpperCase()}</h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Aggregated Performance Data</p>
                  </div>
                </div>
                <button onClick={()=>setView('welcome')} className="bg-white px-6 py-3 rounded-xl border shadow-sm font-bold flex items-center gap-2 text-[#C5A059] hover:bg-slate-50 transition-all"><ArrowLeft size={18}/> Exit</button>
            </div>

            {!teamStats ? (
                <div className="bg-white p-20 rounded-[40px] border shadow-sm text-center">
                    <Users size={48} className="mx-auto mb-6 text-slate-200" />
                    <h2 className="text-2xl font-serif font-bold mb-2">No team data found</h2>
                    <p className="text-slate-400 mb-8">Ensure your team members use the code <span className="font-black text-[#002147]">{teamCode.toUpperCase()}</span></p>
                    <button onClick={()=>setView('welcome')} className="text-[#C5A059] font-black uppercase text-xs tracking-widest underline">Return to Start</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-[#002147] text-white p-10 rounded-[40px] shadow-xl">
                            <Users className="text-[#C5A059] mb-4" size={32} />
                            <p className="text-[10px] font-black uppercase text-white/50 tracking-widest mb-2">Reporting Leaders</p>
                            <p className="text-6xl font-serif font-black">{teamStats.count}</p>
                        </div>
                        <div className="bg-white p-10 rounded-[40px] shadow-sm border">
                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-10">Pillar Averages</h3>
                            <PillarBar label="Bedrock" value={teamStats.bAvg} color="#002147" />
                            <PillarBar label="Fuel" value={teamStats.fAvg} color="#C5A059" />
                            <PillarBar label="Purpose" value={teamStats.pAvg} color="#64748b" />
                        </div>
                    </div>
                    <div className="lg:col-span-8 bg-white rounded-[40px] shadow-sm border overflow-hidden">
                        <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Individual Team Breakdown</h3>
                            <div className="bg-white px-4 py-1.5 rounded-full border text-[10px] font-black text-[#C5A059] shadow-sm">LIVE FEED</div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <tbody className="divide-y">
                                    {teamStats.members.map(m => (
                                        <tr key={m.id} className="hover:bg-slate-50/50 transition-all group">
                                            <td className="p-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-[#002147] group-hover:bg-[#002147] group-hover:text-white transition-all">{m.userName.charAt(0)}</div>
                                                    <p className="font-bold text-lg">{m.userName}</p>
                                                </div>
                                            </td>
                                            <td className="p-8">
                                                <span className="px-3 py-1 rounded text-[10px] font-black uppercase border" style={{color: ARCHETYPES[m.archetype]?.color, borderColor: ARCHETYPES[m.archetype]?.color}}>
                                                    {m.archetype}
                                                </span>
                                            </td>
                                            <td className="p-8">
                                                <div className="flex gap-4">
                                                    <div className="w-16"><PillarBar label="B" value={m.scores.b} color="#002147" small /></div>
                                                    <div className="w-16"><PillarBar label="F" value={m.scores.f} color="#C5A059" small /></div>
                                                    <div className="w-16"><PillarBar label="P" value={m.scores.p} color="#64748b" small /></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );

  // ... (Keep the existing quiz, login, results, and admin views from previous master code)
  // [Truncated for brevity, assuming standard integration into the existing codebase]
}
