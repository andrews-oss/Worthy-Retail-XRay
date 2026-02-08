import React, { useState, useMemo, useEffect } from 'react';
import { 
  Trophy, ShieldAlert, Zap, Compass, AlertTriangle, 
  ChevronRight, RefreshCw, Printer, Target, Save, 
  CheckCircle2, BarChart3, Lock, ArrowLeft, BookOpen, 
  PlayCircle, GraduationCap, Users, LayoutDashboard,
  Activity, Calendar, ShieldCheck, TrendingUp, Search, User,
  ArrowRight, ShieldQuestion, Gauge, HeartPulse, UserCheck,
  ZapOff, Flame, Microscope, Building2, Store, AlertOctagon,
  FileSearch, ClipboardCheck, Scale, Gavel, ActivitySquare,
  ShieldHalf, Fingerprint, EyeOff
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
    const rawConfig = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
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
  } catch (e) { console.warn("Forensic Handshake Active."); }
};

initFirebase();

// --- DATA MODEL ---

const THRIVE_ENGINE = [
  { l: 'T', w: 'Total Agency', d: 'Peak autonomous capacity; delivering world-class output without expensive management overhead.' },
  { l: 'H', w: 'Health', d: 'Mitigation of "Human Debt" (Burnout) to protect the brand\'s primary asset and reduce liability claims.' },
  { l: 'R', w: 'Resilience', d: 'System-wide shock absorption; maintaining margin during market or regulatory volatility.' },
  { l: 'I', w: 'Inclusion', d: 'Statutory compliance regarding fairness and neurodiversity; minimizing EEOC exposure.' },
  { l: 'V', w: 'Values', d: 'Behavioral integrity; ensuring floor-level conduct aligns with brand governance standards.' },
  { l: 'E', w: 'Effectiveness', d: 'Execution discipline; removing operational friction to maximize velocity and margin.' }
];

const ARCHETYPES = {
  SCALER: { id: 'SCALER', name: 'Ecosystem Scaler', color: '#059669', icon: <Trophy className="w-10 h-10"/>, status: "Enterprise Asset", riskLevel: "NEGLIGIBLE", striveFor: "Global Multi-Unit Architecture" },
  SOLID: { id: 'SOLID', name: 'Solid Foundation', color: '#10b981', icon: <UserCheck className="w-10 h-10"/>, status: "Legacy Ready", riskLevel: "LOW", striveFor: "Autonomous Leadership" },
  MAVERICK: { id: 'MAVERICK', name: 'High-Performance Maverick', color: '#f59e0b', icon: <Gavel className="w-10 h-10"/>, status: "High Liability Risk", riskLevel: "CRITICAL", striveFor: "Regulated Velocity" },
  BUREAUCRAT: { id: 'BUREAUCRAT', name: 'Compliant Bureaucrat', color: '#2563eb', icon: <ShieldAlert className="w-10 h-10"/>, status: "Operational Drag", riskLevel: "MEDIUM", striveFor: "System Decoupling" },
  BURNOUT: { id: 'BURNOUT', name: 'Burnout Driver', color: '#ef4444', icon: <Flame className="w-10 h-10"/>, status: "Human Debt High", riskLevel: "HIGH", striveFor: "Capacity Recovery" },
  VISIONARY: { id: 'VISIONARY', name: 'Performative Visionary', color: '#8b5cf6', icon: <Compass className="w-10 h-10"/>, status: "Hollow Backbone", riskLevel: "MEDIUM/HIGH", striveFor: "Structural Hardening" },
  HUMANIST: { id: 'HUMANIST', name: 'Cultural Humanist', color: '#ec4899', icon: <HeartPulse className="w-10 h-10"/>, status: "Low Execution", riskLevel: "MEDIUM", striveFor: "Accountable Performance" },
  ACCIDENTAL: { id: 'ACCIDENTAL', name: 'Accidental Leader', color: '#b91c1c', icon: <AlertTriangle className="w-10 h-10"/>, status: "Total Risk", riskLevel: "CRITICAL", striveFor: "Core Integrity Foundations" }
};

const QUESTIONS = [
  { id: 1, pillar: 'B', text: "My team feels safe admitting mistakes to me without fear of retribution." },
  { id: 2, pillar: 'B', text: "I default to transparency and radical honesty even during peak holiday pressure." },
  { id: 3, pillar: 'B', text: "Workplace safety and compliance protocols are never bypassed for speed." },
  { id: 4, pillar: 'B', text: "Conflict within the team is resolved through direct, values-led, respectful dialogue." },
  { id: 5, pillar: 'B', text: "Diversity of thought and neurodiversity are actively welcomed in our decisions." },
  { id: 6, pillar: 'B', text: "I have a clear system for auditing 'Psychological Safety' on the retail floor." },
  { id: 7, pillar: 'B', text: "The team knows I consistently 'have their back' when facing external pressure." },
  { id: 8, pillar: 'B', text: "We have a 'Truth-Default' culture where bad news travels faster than good news." },
  { id: 9, pillar: 'B', text: "Mental and physical health are treated as a shared leadership duty, not just policy." },
  { id: 10, pillar: 'F', text: "We hit KPIs without relying on 'Brute Force' or constant intervention." },
  { id: 11, pillar: 'F', text: "Our operational systems accelerate speed rather than acting as red tape." },
  { id: 12, pillar: 'F', text: "I have data-driven systems to measure the team's execution velocity." },
  { id: 13, pillar: 'F', text: "The team solves 80% of floor-level problems in <60 seconds without me." },
  { id: 14, pillar: 'F', text: "We use technology and digital tools effectively to automate repetitive tasks." },
  { id: 15, pillar: 'F', text: "We can pivot floor strategy or layout within 24 hours based on market data." },
  { id: 16, pillar: 'F', text: "Decision loops are fast, feedback-rich, and clearly understood by the team." },
  { id: 17, pillar: 'F', text: "I spend less than 20% of my shift 'firefighting' operational glitches." },
  { id: 18, pillar: 'F', text: "The team shows high resilience and discipline during seasonal peaks." },
  { id: 19, pillar: 'P', text: "Every team member can articulate our unit's 'Why' beyond sales targets." },
  { id: 20, pillar: 'P', text: "The team treats this ecosystem as a legacy they are building, not just a paycheck." },
  { id: 21, pillar: 'P', text: "Personal growth and career legacy are discussed as often as daily targets." },
  { id: 22, pillar: 'P', text: "The team understands the community and social impact of our brand presence." },
  { id: 23, pillar: 'P', text: "We share a unified vision of what 'Winning' looks like for the next 12 months." },
  { id: 24, pillar: 'P', text: "Staff morale remains high and mission-focused even during difficult trading periods." },
  { id: 25, pillar: 'P', text: "Team members act as 'Owner-Operators,' taking initiative without being asked." },
  { id: 26, pillar: 'P', text: "Our lived values are evident in every interaction, not just on a poster." },
  { id: 27, pillar: 'P', text: "Individual 'Agency' is encouraged; staff feel they have a genuine stake in our success." }
];

export default function App() {
  const [view, setView] = useState('welcome'); 
  const [scope, setScope] = useState('frontLine'); 
  const [answers, setAnswers] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [integritySigned, setIntegritySigned] = useState(false);

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
      setAssessments(s.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
    });
  }, [user]);

  // --- FORENSIC CALCULATOR ---
  const forensicResults = useMemo(() => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < QUESTIONS.length) return null;
    
    // 1. Reliability Check (Straight-lining detection)
    const valArray = Object.values(answers);
    const fives = valArray.filter(v => v === 5).length;
    const reliability = fives > (QUESTIONS.length * 0.9) ? 45 : 94; 

    // 2. Score Calculation
    const s = { B: 0, F: 0, P: 0 };
    QUESTIONS.forEach(q => s[q.pillar] += answers[q.id]);
    const b = Math.round((s.B/45)*100), f = Math.round((s.F/45)*100), p = Math.round((s.P/45)*100);
    const avg = (b + f + p) / 3;

    // 3. Archetype Logic
    let arch = ARCHETYPES.ACCIDENTAL;
    if (avg >= 83) arch = ARCHETYPES.SCALER;
    else if (avg >= 73) arch = ARCHETYPES.SOLID;
    else if (b >= 75 && f < 55) arch = ARCHETYPES.BUREAUCRAT;
    else if (f >= 75 && b < 50) arch = ARCHETYPES.MAVERICK;
    else if (f >= 75 && b < 65) arch = ARCHETYPES.BURNOUT;
    else if (p >= 75 && b < 65) arch = ARCHETYPES.VISIONARY;
    else if (b >= 75 && f < 50) arch = ARCHETYPES.HUMANIST;

    const lowest = [{id: 'B', val: b}, {id: 'F', val: f}, {id: 'P', val: p}].reduce((prev, curr) => (prev.val < curr.val) ? prev : curr);

    return { ...arch, scores: { b, f, p }, lowestPillar: lowest.id, reliability };
  }, [answers]);

  const saveResults = async () => {
    if (!db || !user || !forensicResults) return;
    setIsSaving(true);
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'assessments'), {
      userName, teamCode: teamCode.toUpperCase() || "NONE", scope, archetype: forensicResults.id, scores: forensicResults.scores, reliability: forensicResults.reliability, timestamp: new Date().toISOString()
    });
    alert("Audit Dispatched to Enterprise Hub.");
    setIsSaving(false);
  };

  const PillarBar = ({ label, value, color, small = false }) => (
    <div className={`w-full ${small ? 'mb-2' : 'mb-6'}`}>
      <div className={`flex justify-between font-black uppercase mb-1 text-slate-400 ${small ? 'text-[8px]' : 'text-[10px]'}`}>
        <span>{label}</span><span>{value}%</span>
      </div>
      <div className={`${small ? 'h-1.5' : 'h-2 md:h-3'} bg-slate-100 rounded-full overflow-hidden`}>
        <div className="h-full transition-all duration-1000" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );

  const ReportFooter = ({ page }) => (
    <div className="mt-12 flex justify-between items-center border-t border-slate-100 pt-8 text-[#cbd5e1] font-black text-[10px] uppercase tracking-[0.2em] w-full">
        <span>GENERATED: {new Date().toLocaleDateString()}</span>
        <span>RETAIL RISK AUDIT | CONFIDENTIAL</span>
        <span>PAGE {page} OF 2</span>
    </div>
  );

  // --- VIEWS ---

  if (view === 'welcome') return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4 text-[#002147]">
      <div className="max-w-xl w-full bg-white p-8 md:p-16 rounded-[40px] shadow-2xl border-t-[12px] border-[#002147] text-center">
        <p className="uppercase tracking-widest text-[#C5A059] font-black text-[10px] mb-4">Worthy Academy Enterprise</p>
        <h1 className="text-4xl md:text-6xl font-serif font-black mb-8 leading-tight">Human Risk Audit</h1>
        
        <div className="space-y-6 text-left mb-10">
            <div className="bg-slate-900 p-6 rounded-3xl text-white relative overflow-hidden">
                <Fingerprint className="absolute -right-2 -top-2 opacity-10" size={80}/>
                <p className="text-[10px] font-black uppercase text-[#C5A059] mb-2">Forensic Integrity Protocol</p>
                <p className="text-xs font-bold leading-relaxed opacity-80 mb-4">This audit employs statistical reliability checks to identify response bias. Accurate reporting is essential for enterprise compliance mapping.</p>
                <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={integritySigned} onChange={(e)=>setIntegritySigned(e.target.checked)} className="w-5 h-5 rounded border-2 accent-[#C5A059]"/>
                    <span className="text-[10px] font-black uppercase group-hover:text-[#C5A059] transition-colors">I declare these inputs are factually accurate.</span>
                </label>
            </div>

            <div><label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-1 block">Responsibility Scope</label>
                <div className="flex gap-2">
                    <button onClick={()=>setScope('frontLine')} className={`flex-1 p-4 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${scope==='frontLine'?'border-[#C5A059] bg-[#C5A059]/5 text-[#C5A059]':'border-slate-100 text-slate-400'}`}><Store size={18}/> Front-Line</button>
                    <button onClick={()=>setScope('multiUnit')} className={`flex-1 p-4 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${scope==='multiUnit'?'border-[#C5A059] bg-[#C5A059]/5 text-[#C5A059]':'border-slate-100 text-slate-400'}`}><Building2 size={18}/> Multi-Unit</button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <input type="text" value={userName} onChange={(e)=>setUserName(e.target.value)} placeholder="Full Name..." className="w-full p-5 border-2 rounded-2xl font-bold outline-none focus:border-[#C5A059]" />
                <input type="text" value={teamCode} onChange={(e)=>setTeamCode(e.target.value)} placeholder="Enterprise Hub ID (e.g. REGION04)" className="w-full p-5 border-2 rounded-2xl font-bold outline-none focus:border-[#C5A059] uppercase" />
            </div>
        </div>

        <button disabled={!userName || !integritySigned} onClick={()=>setView('quiz')} className="w-full bg-[#002147] text-white py-6 rounded-full font-black text-xl active:scale-95 transition-all shadow-xl hover:bg-[#C5A059] disabled:opacity-30 disabled:grayscale">Initialize Forensic Audit</button>
      </div>
    </div>
  );

  if (view === 'quiz') return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4 text-[#002147]">
      <div className="max-w-2xl w-full bg-white p-6 md:p-14 rounded-[32px] md:rounded-[40px] shadow-2xl border relative overflow-hidden">
        <div className="absolute top-0 left-0 h-1.5 bg-[#002147] transition-all duration-300" style={{width:`${((currentStep+1)/QUESTIONS.length)*100}%`}} />
        <div className="flex justify-between items-center mb-8">
            <p className="text-[#C5A059] font-black uppercase text-[10px] tracking-widest">Audit Point {currentStep+1} / {QUESTIONS.length}</p>
            <ShieldCheck size={16} className="text-slate-200"/>
        </div>
        <h3 className="text-xl md:text-3xl font-medium mb-10 leading-tight text-slate-800 italic">"{QUESTIONS[currentStep].text}"</h3>
        <div className="grid grid-cols-1 gap-3">
          {[5,4,3,2,1].map(v => (
            <button key={v} onClick={()=>{
              const newAnswers = {...answers, [QUESTIONS[currentStep].id]:v};
              setAnswers(newAnswers);
              if(currentStep < QUESTIONS.length-1) { 
                setCurrentStep(currentStep+1); 
              } else {
                setView('results');
              }
            }} className="w-full text-left p-5 rounded-2xl border-2 border-slate-50 hover:border-[#C5A059] font-bold text-slate-600 active:bg-slate-50 transition-all flex justify-between items-center">
              <span>{v===5?'Strongly Agree':v===1?'Strongly Disagree':v===4?'Agree':v===2?'Disagree':'Neutral'}</span>
              <ChevronRight size={16} className="text-slate-300"/>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (view === 'results' && forensicResults) return (
    <div className="min-h-screen bg-[#cbd5e1] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 gap-4 print:hidden">
            <div className="flex gap-2 w-full md:w-auto">
                <button onClick={()=>window.print()} className="flex-1 md:flex-none bg-[#002147] text-white px-8 py-4 rounded-full font-black flex items-center justify-center gap-2 shadow-xl"><Printer size={18}/> Export Clinical Profile</button>
                <button onClick={saveResults} className="flex-1 md:flex-none bg-[#C5A059] text-white px-8 py-4 rounded-full font-black shadow-xl">{isSaving?'Syncing...':'Submit to Board'}</button>
            </div>
            <button onClick={()=>window.location.reload()} className="text-[#002147] font-black uppercase text-[10px] tracking-widest"><RefreshCw className="inline mr-2" size={14}/> Restart Audit</button>
        </div>

        <div className="max-w-[1280px] mx-auto space-y-12">
            <div className="report-slide bg-[#FAF9F6] p-8 md:p-24 border-t-[14px] border-[#002147] shadow-2xl min-h-[720px] flex flex-col rounded-[40px]">
                <div className="flex justify-between items-start mb-12 border-b pb-8">
                    <h2 className="text-4xl font-serif font-black text-[#002147]">Clinical Risk Summary</h2>
                    <div className={`p-4 rounded-2xl border-2 text-center min-w-[200px] ${forensicResults.reliability < 60 ? 'border-red-500 bg-red-50' : 'border-emerald-500 bg-emerald-50'}`}>
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Evidence Confidence</p>
                        <p className={`text-2xl font-black ${forensicResults.reliability < 60 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {forensicResults.reliability}% {forensicResults.reliability < 60 ? <EyeOff className="inline ml-1" size={20}/> : <ShieldCheck className="inline ml-1" size={20}/>}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-20 flex-grow items-start">
                    <div>
                        <div className="flex items-center gap-6 mb-10">
                            <div className="p-4 bg-white shadow-xl rounded-2xl text-[#002147] border-2 border-slate-100 scale-125 origin-left">
                                {React.cloneElement(ARCHETYPES[forensicResults.id].icon, {size: 40})}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-[#C5A059] tracking-widest">Operating Archetype</p>
                                <h3 className="text-4xl font-serif font-black text-[#002147] uppercase">{forensicResults.name}</h3>
                            </div>
                        </div>
                        <p className="text-2xl text-slate-600 italic leading-relaxed mb-10">"{forensicResults.quote}"</p>
                        <div className="bg-white p-8 rounded-[40px] shadow-xl border relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-8 opacity-5"><Scale size={120}/></div>
                             <p className="text-[10px] font-black uppercase text-[#C5A059] tracking-widest mb-4">Strategic Assessment</p>
                             <p className="text-lg text-slate-500 font-bold leading-relaxed mb-6">{forensicResults.meaning}</p>
                             <div className="flex items-center gap-2 text-red-600 font-black uppercase text-xs">
                                <AlertOctagon size={16}/> Material Exposure: {forensicResults.riskLevel}
                             </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between h-full py-4">
                        <div>
                            <PillarBar label="Bedrock (Compliance)" value={forensicResults.scores.b} color="#002147" />
                            <PillarBar label="Fuel (Velocity)" value={forensicResults.scores.f} color="#C5A059" />
                            <PillarBar label="Purpose (Retention)" value={forensicResults.scores.p} color="#64748b" />
                        </div>
                        <div className="mt-12 grid grid-cols-2 gap-4">
                             {forensicResults.id === 'MAVERICK' && (
                                <div className="col-span-2 p-6 bg-red-900 text-white rounded-3xl border-4 border-red-500/20">
                                    <p className="text-[10px] font-black uppercase text-red-400 mb-2">Remediation Protocol</p>
                                    <p className="text-xs font-bold leading-relaxed">Mandatory Standards audit within 14 days. Failure to align creates brand liability.</p>
                                </div>
                             )}
                             <div className="p-6 bg-slate-100 rounded-3xl text-center">
                                 <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Strive For</p>
                                 <p className="text-sm font-black text-[#002147]">{forensicResults.striveFor}</p>
                             </div>
                             <div className="p-6 bg-slate-100 rounded-3xl text-center">
                                 <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Next Review</p>
                                 <p className="text-sm font-black text-[#002147]">90-DAY AUDIT</p>
                             </div>
                        </div>
                    </div>
                </div>
                <ReportFooter page={2} />
            </div>
        </div>
        <style>{`
          @media print { 
            body { background: white !important; padding: 0 !important; } 
            .print\\:hidden { display: none !important; } 
            .report-slide { width: 1280px !important; height: 720px !important; border-radius: 0 !important; padding: 60px 80px !important; margin: 0 !important; border-top: 14px solid #002147 !important; break-after: always; } 
            @page { size: 1280px 720px; margin: 0; } 
          }
        `}</style>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-[#002147] font-bold">
        <Activity className="animate-spin text-[#C5A059] mb-4" size={48} />
        <p className="font-serif text-2xl font-bold tracking-tight">Securing Forensic Integrity Protocol...</p>
    </div>
  );
}
