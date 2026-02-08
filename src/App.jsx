import React, { useState, useMemo, useEffect } from 'react';
import { 
  Trophy, ShieldAlert, Zap, Compass, AlertTriangle, 
  ChevronRight, RefreshCw, Printer, Target, 
  BarChart3, Lock, ArrowLeft,
  PlayCircle, GraduationCap, Users, LayoutDashboard,
  Activity, ShieldCheck, 
  ArrowRight, HeartPulse, UserCheck,
  Flame, Microscope, Building2, Store, AlertOctagon,
  FileSearch, ClipboardCheck, Scale, Gavel,
  Fingerprint, EyeOff, UploadCloud, CheckCircle2,
  Loader2
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

// --- CLOUD INITIALIZATION (BOARD-READY AUTO-HANDSHAKE) ---
let db = null;
let auth = null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'worthy-retail-xray';

// --- DATA MODEL: ENTERPRISE RISK & INTEGRITY ---

const THRIVE_ENGINE = [
  { l: 'T', w: 'Total Agency', d: 'Peak autonomous capacity; delivering results without expensive management overhead.' },
  { l: 'H', w: 'Health', d: 'Physical and mental wellbeing as a leadership duty to mitigate liability and "Human Debt".' },
  { l: 'R', w: 'Resilience', d: 'System-wide absorption of shocks; maintaining margin during market or regulatory volatility.' },
  { l: 'I', w: 'Inclusion', d: 'Statutory compliance regarding fairness; minimizing EEOC and discrimination exposure.' },
  { l: 'V', w: 'Values', d: 'Behavioral integrity; ensuring floor conduct aligns with brand governance standards.' },
  { l: 'E', w: 'Effectiveness', d: 'Execution discipline; removing operational friction to maximize velocity and margin.' }
];

const ARCHETYPES = {
  SCALER: { 
    id: 'SCALER', name: 'Ecosystem Scaler', color: '#059669', icon: <Trophy className="w-10 h-10"/>, 
    status: "Enterprise Asset", riskLevel: "NEGLIGIBLE",
    quote: "Elite alignment of the BFP Backbone and THRIVE behavioral engine.",
    meaning: "Your BFP Backbone is secure. The THRIVE engine is firing autonomously—specifically excelling in 'Total Agency.' You represent the benchmark for global brand scaling.",
    riskImplications: "Minimal material exposure. Successional readiness is the primary focus for multi-unit expansion.",
    striveFor: "Global Multi-Unit Architecture" 
  },
  SOLID: { 
    id: 'SOLID', name: 'Solid Foundation', color: '#10b981', icon: <UserCheck className="w-10 h-10"/>, 
    status: "Legacy Ready", riskLevel: "LOW",
    quote: "Strong structural integrity across all leadership priorities.",
    meaning: "Consistent professional operator. Bedrock is secure. To reach 'Scaler' status, focus on the 'Total Agency' lever—empowering your team to lead autonomously.",
    riskImplications: "Operational plateau. Slight risk of friction as ecosystem complexity grows, particularly across multi-site oversight.",
    striveFor: "Autonomous Leadership" 
  },
  MAVERICK: { 
    id: 'MAVERICK', name: 'High-Performance Maverick', color: '#f59e0b', icon: <Gavel className="w-10 h-10"/>, 
    status: "High Liability Risk", riskLevel: "CRITICAL",
    quadrant: "High P&L Contribution / High Behavioral Risk",
    quote: "Commercial results achieved through non-compliant shortcut behaviors.",
    meaning: "A commercial win but a statutory nightmare. You hit targets by fracturing Bedrock. In the US market, this represents a critical litigation risk (EEOC/OSHA).",
    riskImplications: "Material litigation, regulatory penalties, and long-term brand erosion.",
    protocol: "Monitor: Compliance KPIs. Boundary: HR standards. Remediate: Track 1, Module 1.",
    striveFor: "Regulated Velocity" 
  },
  BUREAUCRAT: { 
    id: 'BUREAUCRAT', name: 'Compliant Bureaucrat', color: '#2563eb', icon: <ShieldAlert className="w-10 h-10"/>, 
    status: "Operational Drag", riskLevel: "MEDIUM",
    quote: "High Bedrock integrity but critically low operational velocity.",
    meaning: "Bedrock is secure, but Fuel is absent. The unit is bogged down in red tape. Your THRIVE engine lacks 'Effectiveness.' You are safe, but losing market share.",
    riskImplications: "Market share loss and uncompetitive labor efficiency ratios.",
    striveFor: "System Decoupling" 
  },
  BURNOUT: { 
    id: 'BURNOUT', name: 'Burnout Driver', color: '#ef4444', icon: <Flame className="w-10 h-10"/>, 
    status: "Human Debt High", riskLevel: "HIGH",
    quote: "KPIs achieved through 'Human Debt' at the expense of health.",
    meaning: "Velocity achieved through brute force. You are destroying team health markers. This leads to a collapse of Bedrock and massive turnover costs.",
    riskImplications: "Mass voluntary turnover and high recruitment costs.",
    striveFor: "Capacity Recovery" 
  },
  VISIONARY: { 
    id: 'VISIONARY', name: 'Performative Visionary', color: '#8b5cf6', icon: <Compass className="w-10 h-10"/>, 
    status: "Hollow Backbone", riskLevel: "MEDIUM/HIGH",
    quote: "High purpose alignment but failing in execution and systems.",
    meaning: "Leadership is charisma-led rather than system-led. The Backbone is fractured at Bedrock and Fuel. The team is inspired but exhausted.",
    riskImplications: "Inventory shrink and loss of operational consistency.",
    striveFor: "Structural Hardening" 
  },
  HUMANIST: { 
    id: 'HUMANIST', name: 'Cultural Humanist', color: '#ec4899', icon: <HeartPulse className="w-10 h-10"/>, 
    status: "Low Execution", riskLevel: "MEDIUM",
    quote: "Strong human connection but missing the operational edge.",
    meaning: "High trust but zero accountability. You have created a family, not a performance ecosystem. Margin erosion is inevitable.",
    riskImplications: "Margin erosion and consistent KPI failure.",
    striveFor: "Accountable Performance" 
  },
  ACCIDENTAL: { 
    id: 'ACCIDENTAL', name: 'Accidental Leader', color: '#b91c1c', icon: <AlertTriangle className="w-10 h-10"/>, 
    status: "Total Risk", riskLevel: "CRITICAL",
    quote: "Technical expert managing on survival instinct alone.",
    meaning: "Complete BFP Backbone fracture. Leading on instinct rather than infrastructure. Total liability for any scalable ecosystem.",
    riskImplications: "Total unit failure and legal non-compliance.",
    striveFor: "Core Integrity Foundations" 
  }
};

const CURRICULUM = {
    B: { title: "Bedrock: Compliance", track1: "Bulletproof Shift", track2: "BFP Operating System" },
    F: { title: "Fuel: Velocity", track1: "Running the Numbers", track2: "Leading Through Data" },
    P: { title: "Purpose: Legacy", track1: "Coaching & Agency", track2: "Multi-Unit Coaching" }
};

const PROGRAMME = {
  frontLine: {
    B: [{ name: "Remediation Path", title: "Track 1, Module 1: Bulletproof Shift", desc: "Hard-coding compliance, safety (OSHA), and health standards into daily floor rhythms." }],
    F: [{ name: "Performance Sprint", title: "Track 1, Module 2: Running the Numbers", desc: "Hard-wiring the P&L: conversion, labor spend, and margin maintenance." }],
    P: [{ name: "Legacy Path", title: "Track 1, Module 3: Coaching & Agency", desc: "Activating 'Total Agency' to reduce management overhead and increase retention." }]
  },
  multiUnit: {
    B: [{ name: "Remediation Path", title: "Track 2, Module 1: BFP as an OS", desc: "Installing the strategic backbone across regions to stabilize multi-site risk." }],
    F: [{ name: "Performance Sprint", title: "Track 2, Module 2: Leading Through Data", desc: "Multi-site dashboard mastery to identify performance leaks globally." }],
    P: [{ name: "Legacy Path", title: "Track 2, Module 4: Multi-Unit Coaching", desc: "Evolving store visits from 'policing' into 'legacy architecture' sessions." }]
  }
};

const QUESTIONS = [
  { id: 1, pillar: 'B', text: "My team feels safe admitting mistakes to me without fear of retribution." },
  { id: 2, pillar: 'B', text: "I default to transparency and radical honesty even during peak pressure." },
  { id: 3, pillar: 'B', text: "Workplace safety and compliance protocols (OSHA/EEOC) are never bypassed for speed." },
  { id: 4, pillar: 'B', text: "Conflict within the team is resolved through direct, values-led, respectful dialogue." },
  { id: 5, pillar: 'B', text: "Diversity of thought and neurodiversity are actively welcomed in our decisions." },
  { id: 6, pillar: 'B', text: "I have a clear system for auditing 'Psychological Safety' on the retail floor." },
  { id: 7, pillar: 'B', text: "The team knows I consistently 'have their back' when facing external pressure." },
  { id: 8, pillar: 'B', text: "We have a 'Truth-Default' culture where bad news travels faster than good news." },
  { id: 9, pillar: 'B', text: "Mental and physical health are treated as a shared leadership duty." },
  { id: 10, pillar: 'F', text: "We hit KPIs without relying on 'Brute Force' or constant intervention." },
  { id: 11, pillar: 'F', text: "Our operational systems accelerate speed rather than acting as red tape." },
  { id: 12, pillar: 'F', text: "I have data-driven systems to measure the team's execution velocity." },
  { id: 13, pillar: 'F', text: "The team solves 80% of floor-level problems in <60 seconds without me." },
  { id: 14, pillar: 'F', text: "We use technology and digital tools effectively to automate repetitive tasks." },
  { id: 15, pillar: 'F', text: "We can pivot floor strategy or layout within 24 hours based on market data." },
  { id: 16, pillar: 'F', text: "Decision loops are fast, feedback-rich, and clearly understood by the team." },
  { id: 17, pillar: 'F', text: "I spend less than 20% of my shift 'firefighting' operational glitches." },
  { id: 18, pillar: 'F', text: "The team shows high resilience and discipline during seasonal peaks." },
  { id: 19, pillar: 'P', text: "Every team member can articulate our unit's 'Why' beyond just sales targets." },
  { id: 20, pillar: 'P', text: "The team treats this ecosystem as a legacy they are building." },
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
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [integritySigned, setIntegritySigned] = useState(false);

  // --- ONE-TIME FIREBASE INIT ---
  useEffect(() => {
    const rawConfig = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
    if (rawConfig) {
      try {
        const config = typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig;
        const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
        auth = getAuth(app);
        db = getFirestore(app);

        const initAuth = async () => {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        };
        initAuth();
        const unsub = onAuthStateChanged(auth, setUser);
        return () => unsub();
      } catch (err) {
        console.error("Firebase Handshake Error:", err);
      }
    }
  }, []);

  // --- RECALIBRATED ARCHETYPE ENGINE ---
  const results = useMemo(() => {
    const answeredKeys = Object.keys(answers);
    if (answeredKeys.length < QUESTIONS.length) return null;
    
    const s = { B: 0, F: 0, P: 0 };
    QUESTIONS.forEach(q => s[q.pillar] += (answers[q.id] || 0));
    const b = Math.round((s.B/45)*100), f = Math.round((s.F/45)*100), p = Math.round((s.P/45)*100);
    const avg = (b + f + p) / 3;

    // Reliability Check
    const fives = Object.values(answers).filter(v => v === 5).length;
    const reliability = fives > 23 ? 45 : 94; 

    let arch = ARCHETYPES.ACCIDENTAL;
    
    // VARIANCE-LEAD LOGIC LADDER
    if (avg >= 85) arch = ARCHETYPES.SCALER;
    else if (f >= 78 && b <= 68) arch = ARCHETYPES.MAVERICK; 
    else if (f >= 78 && p <= 68) arch = ARCHETYPES.BURNOUT;  
    else if (avg >= 72) arch = ARCHETYPES.SOLID;            
    else if (b >= 75 && f <= 65) arch = ARCHETYPES.BUREAUCRAT; 
    else if (p >= 75 && f <= 65) arch = ARCHETYPES.VISIONARY;  
    else if (b >= 75 && p <= 72) arch = ARCHETYPES.HUMANIST;   
    else if (avg >= 58) arch = ARCHETYPES.SOLID; 
    else arch = ARCHETYPES.ACCIDENTAL;

    const lowest = [{id: 'B', val: b}, {id: 'F', val: f}, {id: 'P', val: p}].reduce((prev, curr) => (prev.val < curr.val) ? prev : curr);

    return { ...arch, scores: { b, f, p }, lowestPillar: lowest.id, reliability };
  }, [answers]);

  // --- AUTO-SUBMIT HOOK (BOARD-GRADE RELIABILITY) ---
  useEffect(() => {
    const syncData = async () => {
      if (results && user && db && syncStatus === 'idle') {
        setSyncStatus('syncing');
        try {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'assessments'), {
            userName, teamCode: teamCode.toUpperCase() || "UNASSIGNED", scope, 
            archetype: results.id, scores: results.scores, reliability: results.reliability, 
            timestamp: new Date().toISOString(), createdAt: serverTimestamp(),
            userId: user.uid
          });
          setSyncStatus('success');
        } catch (e) {
          console.error("Auto-sync failure:", e);
          setSyncStatus('error');
        }
      }
    };
    
    if (view === 'results') syncData();
  }, [view, results, user, db, syncStatus, userName, teamCode, scope]);

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
        <span>AUDIT DATE: {new Date().toLocaleDateString()}</span>
        <span>ENTERPRISE INTEGRITY HUB | CONFIDENTIAL</span>
        <span>PAGE {page} OF 3</span>
    </div>
  );

  // --- VIEWS ---

  if (view === 'welcome') return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4 text-[#002147]">
      <div className="max-w-xl w-full bg-white p-8 md:p-16 rounded-[40px] shadow-2xl border-t-[12px] border-[#002147] text-center relative">
        <div className="absolute top-4 right-8 text-[8px] font-black opacity-20 uppercase tracking-widest">v2.9 Board-Master</div>
        <p className="uppercase tracking-widest text-[#C5A059] font-black text-[10px] mb-4">Enterprise Human-Risk Management</p>
        <h1 className="text-4xl md:text-6xl font-serif font-black mb-8 leading-tight">Human Risk Audit</h1>
        <div className="space-y-6 text-left mb-10">
            <div className="bg-slate-900 p-6 rounded-3xl text-white">
                <p className="text-[10px] font-black uppercase text-[#C5A059] mb-2 flex items-center gap-2"><Fingerprint size={14}/> Forensic Integrity Protocol</p>
                <p className="text-xs font-bold leading-relaxed opacity-80 mb-4">Accurate reporting is essential for regional compliance mapping. Response bias is monitored.</p>
                <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={integritySigned} onChange={(e)=>setIntegritySigned(e.target.checked)} className="w-5 h-5 accent-[#C5A059] rounded"/>
                    <span className="text-[10px] font-black uppercase group-hover:text-[#C5A059] transition-colors">I declare these inputs are factually accurate.</span>
                </label>
            </div>
            <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Audit Scope</label>
                <div className="flex gap-2">
                    <button onClick={()=>setScope('frontLine')} className={`flex-1 p-4 rounded-2xl border-2 font-bold transition-all ${scope==='frontLine'?'border-[#C5A059] text-[#C5A059] bg-[#C5A059]/5 shadow-sm':'border-slate-100 text-slate-300'}`}>Front-Line</button>
                    <button onClick={()=>setScope('multiUnit')} className={`flex-1 p-4 rounded-2xl border-2 font-bold transition-all ${scope==='multiUnit'?'border-[#C5A059] text-[#C5A059] bg-[#C5A059]/5 shadow-sm':'border-slate-100 text-slate-300'}`}>Multi-Unit</button>
                </div>
            </div>
            <input type="text" value={userName} onChange={(e)=>setUserName(e.target.value)} placeholder="Leader Full Name..." className="w-full p-5 border-2 rounded-2xl font-bold outline-none focus:border-[#C5A059]" />
            <input type="text" value={teamCode} onChange={(e)=>setTeamCode(e.target.value)} placeholder="Region / Hub ID" className="w-full p-5 border-2 rounded-2xl font-bold outline-none focus:border-[#C5A059] uppercase" />
        </div>
        <button disabled={!userName || !integritySigned} onClick={()=>setView('quiz')} className="w-full bg-[#002147] text-white py-6 rounded-full font-black text-xl active:scale-95 transition-all shadow-xl hover:bg-[#C5A059] disabled:opacity-30">Execute Forensic Audit</button>
      </div>
      <button onClick={()=>setView('team_dashboard')} className="mt-8 text-slate-300 text-[10px] font-black uppercase tracking-widest hover:text-[#002147] transition-all"><LayoutDashboard className="inline mr-2" size={14}/> Access Analytics Hub</button>
    </div>
  );

  if (view === 'quiz') return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4 text-[#002147]">
      <div className="max-w-2xl w-full bg-white p-6 md:p-14 rounded-[32px] md:rounded-[40px] shadow-2xl border relative overflow-hidden">
        <div className="absolute top-0 left-0 h-1.5 bg-[#002147] transition-all duration-300" style={{width:`${((currentStep+1)/QUESTIONS.length)*100}%`}} />
        <p className="text-[#C5A059] font-black uppercase text-[10px] tracking-widest mb-10">Audit Point {currentStep+1} / {QUESTIONS.length}</p>
        <h3 className="text-xl md:text-3xl font-medium mb-12 leading-tight italic text-slate-800">"{QUESTIONS[currentStep].text}"</h3>
        <div className="grid grid-cols-1 gap-3">
          {[5,4,3,2,1].map(v => (
            <button key={v} onClick={()=>{
              setAnswers(prev => {
                const updated = {...prev, [QUESTIONS[currentStep].id]:v};
                if(Object.keys(updated).length === QUESTIONS.length) {
                    setTimeout(() => setView('results'), 400);
                }
                return updated;
              });
              if(currentStep < QUESTIONS.length-1) setCurrentStep(currentStep+1);
            }} className="w-full text-left p-5 rounded-2xl border-2 border-slate-50 hover:border-[#C5A059] font-bold text-slate-600 active:bg-slate-50 transition-all flex justify-between items-center group">
              <span>{v===5?'Strongly Agree':v===1?'Strongly Disagree':v===4?'Agree':v===2?'Disagree':'Neutral'}</span>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-[#C5A059] transition-colors"/>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (view === 'results' && results) return (
    <div className="min-h-screen bg-[#cbd5e1] py-12 px-6 overflow-x-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 gap-4 print:hidden">
            <div className="flex gap-4 w-full md:w-auto">
                <button onClick={()=>window.print()} className="flex-1 md:flex-none bg-[#002147] text-white px-8 py-4 rounded-full font-black flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-transform font-bold tracking-tight"><Printer size={18}/> Export Diagnostic PDF</button>
                <div className={`flex-1 md:flex-none px-6 py-4 rounded-full font-black flex items-center justify-center gap-2 border-2 transition-all ${syncStatus === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : syncStatus === 'error' ? 'bg-red-50 border-red-500 text-red-600' : 'bg-white border-slate-200 text-slate-400'}`}>
                    {syncStatus === 'syncing' ? <Loader2 className="animate-spin" size={18}/> : syncStatus === 'success' ? <CheckCircle2 size={18}/> : <Activity size={18}/>}
                    {syncStatus === 'syncing' ? 'Analyzing...' : syncStatus === 'success' ? 'Hub Synchronized' : syncStatus === 'error' ? 'Sync Error' : 'Transmitting...'}
                </div>
            </div>
            <button onClick={()=>window.location.reload()} className="text-[#002147] font-black uppercase text-[10px] tracking-widest hover:underline transition-all font-bold"><RefreshCw className="inline mr-2" size={14}/> Restart Audit</button>
        </div>

        <div className="max-w-[1280px] mx-auto space-y-12">
            {/* Page 1: Cover */}
            <div className="report-slide bg-[#FAF9F6] p-8 md:p-24 border-t-[14px] border-[#002147] shadow-2xl flex flex-col min-h-[720px] rounded-[40px] print:rounded-none">
                <div className="flex-grow flex flex-col justify-center">
                    <p className="uppercase tracking-[0.4em] text-[#C5A059] font-black text-[10px] md:text-sm mb-4 font-bold">Confidential Human-Risk Report</p>
                    <h1 className="text-4xl md:text-8xl font-serif font-black text-[#002147] mb-6 md:mb-10 leading-[1.1]">Leadership Forensic<br/>Audit Profile</h1>
                    <div className="flex items-center gap-6 mt-4">
                        <div className="p-4 bg-white shadow-xl rounded-2xl border-2 border-slate-100 min-w-[200px]">
                             <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Identified Asset</p>
                             <p className="text-xl font-black text-[#002147] uppercase">{userName}</p>
                        </div>
                        <div className="p-4 bg-white shadow-xl rounded-2xl border-2 border-slate-100 min-w-[200px]">
                             <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Audit Type</p>
                             <p className="text-xl font-black text-[#002147] uppercase">{scope==='frontLine'?'Front-Line':'Multi-Unit'}</p>
                        </div>
                    </div>
                </div>
                <ReportFooter page={1} />
            </div>

            {/* Page 2: Summary */}
            <div className="report-slide bg-[#FAF9F6] p-8 md:p-24 border-t-[14px] border-[#002147] shadow-2xl min-h-[720px] flex flex-col rounded-[40px] print:rounded-none">
                <div className="flex justify-between items-start mb-12 border-b pb-8">
                    <h2 className="text-4xl font-serif font-black text-[#002147]">Clinical Exposure Summary</h2>
                    <div className={`p-4 rounded-2xl border-2 text-center min-w-[200px] ${results.reliability < 60 ? 'border-red-500 bg-red-50' : 'border-emerald-500 bg-emerald-50'}`}>
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Evidence Confidence</p>
                        <p className={`text-2xl font-black ${results.reliability < 60 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {results.reliability}% {results.reliability < 60 ? <EyeOff className="inline ml-1" size={20}/> : <ShieldCheck className="inline ml-1" size={20}/>}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-20 flex-grow items-start">
                    <div>
                        <div className="flex items-center gap-6 mb-10">
                            <div className="p-4 bg-white shadow-xl rounded-2xl text-[#002147] border-2 border-slate-100 scale-125 origin-left">
                                {React.cloneElement(results.icon, {size: 40, className: "w-10 h-10"})}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-[#C5A059] tracking-widest mb-1 font-bold">Operating Archetype</p>
                                <h3 className="text-2xl md:text-4xl font-serif font-black text-[#002147] uppercase">{results.name}</h3>
                            </div>
                        </div>
                        <p className="text-base md:text-2xl text-slate-600 italic leading-relaxed font-medium mb-10">"{results.quote}"</p>
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 relative">
                             <div className="absolute top-4 right-4 px-3 py-1 bg-white rounded-full border text-[10px] font-black uppercase font-black" style={{color: results.riskLevel === 'CRITICAL' ? '#dc2626' : '#64748b'}}>
                                <AlertOctagon size={12} className="inline mr-1"/> Liability: {results.riskLevel}
                             </div>
                             <p className="text-[10px] font-black uppercase text-[#C5A059] tracking-widest mb-3 font-bold underline text-[#C5A059]">The THRIVE Engine Insight</p>
                             <p className="text-sm md:text-lg text-slate-500 leading-relaxed font-medium">{results.meaning}</p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white p-6 md:p-10 rounded-[40px] border shadow-xl relative overflow-hidden">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] mb-4 font-bold">Exposure Implications</p>
                            <p className="text-slate-600 text-sm md:text-xl mb-10 leading-relaxed font-bold italic">"{results.riskImplications}"</p>
                            <div className="flex items-center gap-3 font-bold text-[#002147] border-t pt-8 text-xs md:text-base"><FileSearch className="text-[#C5A059]" size={20}/> Evidence-Backed Assessment</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                             {THRIVE_ENGINE.map(t => (
                                <div key={t.l} className="p-3 bg-white border rounded-xl text-center group cursor-help relative hover:border-[#C5A059] transition-colors">
                                    <p className="text-xl font-serif font-black text-[#C5A059]">{t.l}</p>
                                    <p className="text-[8px] font-black uppercase text-slate-400">{t.w}</p>
                                    <div className="absolute bottom-full left-0 w-64 p-4 bg-slate-900 text-white text-[11px] rounded-2xl opacity-0 group-hover:opacity-100 transition-all z-50 mb-3 pointer-events-none shadow-2xl text-left border border-white/10">
                                        <p className="font-black text-[#C5A059] uppercase mb-1">{t.w} Control</p>
                                        {t.d}
                                    </div>
                                </div>
                             ))}
                        </div>
                        <div className="mt-4"><PillarBar label="Bedrock (Compliance)" value={results.scores.b} color="#002147" /><PillarBar label="Fuel (Velocity)" value={results.scores.f} color="#C5A059" /><PillarBar label="Purpose (Retention)" value={results.scores.p} color="#64748b" /></div>
                    </div>
                </div>
                <ReportFooter page={2} />
            </div>

            {/* Page 3: Roadmap */}
            <div className="report-slide bg-[#FAF9F6] p-8 md:p-24 border-t-[14px] border-[#C5A059] shadow-2xl min-h-[720px] flex flex-col rounded-[40px] print:rounded-none">
                <div className="flex items-center gap-4 mb-10 border-b pb-8 font-bold"><div className="bg-[#002147] text-[#C5A059] p-4 rounded-full shadow-lg"><ClipboardCheck size={32} /></div><h2 className="text-2xl md:text-4xl font-serif font-bold text-[#002147]">Leadership Integrity Remediation</h2></div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-grow">
                  <div className="lg:col-span-5 bg-white p-8 md:p-12 rounded-[48px] border shadow-xl text-center flex flex-col items-center justify-center">
                    <GraduationCap size={64} className="text-[#002147] mb-6" />
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest font-bold">Mandatory Mitigation</p>
                    <h3 className="text-2xl md:text-4xl font-serif font-bold text-[#002147] mb-4 font-bold">Repair Tier: {CURRICULUM[results.lowestPillar].title.split(':')[0]}</h3>
                    <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium">To mitigate identified exposures, the following modules must be completed within 90 days as standard corporate due diligence.</p>
                  </div>
                  <div className="lg:col-span-7 flex flex-col gap-4">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest font-bold">Assigned Remediation (Track {scope==='frontLine'?'1':'2'})</p>
                    {PROGRAMME[scope][results.lowestPillar].map((mod, idx) => (
                      <div key={idx} className="bg-white p-6 md:p-8 rounded-3xl border hover:border-[#C5A059] transition-all flex items-start gap-5 group shadow-sm">
                        <div className="bg-slate-50 text-slate-300 group-hover:bg-[#C5A059] group-hover:text-white p-4 rounded-2xl transition-all shadow-sm"><PlayCircle size={24} /></div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest mb-1">{mod.name}</p>
                          <h4 className="font-bold text-[#002147] text-lg md:text-xl tracking-tight text-left block w-full font-bold">{mod.title}</h4>
                          <p className="text-sm md:text-base text-slate-500 mt-2 leading-relaxed font-medium">{mod.desc}</p>
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 p-8 bg-slate-900 rounded-[32px] text-white border-2 border-slate-800 shadow-2xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-6 opacity-10"><ShieldCheck size={100}/></div>
                         <p className="text-[10px] font-black uppercase text-[#C5A059] tracking-widest mb-2 relative z-10 font-bold">Integrity Commitment</p>
                         <p className="text-[10px] text-slate-400 mb-4 italic leading-relaxed">Leader acknowledges remediation track and commits to 90-day review.</p>
                         <div className="w-full bg-[#C5A059] text-white px-10 py-5 rounded-2xl font-black shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all uppercase tracking-widest text-sm relative z-10">
                            Remediation Path Activated <ArrowRight size={20}/>
                         </div>
                    </div>
                  </div>
                </div>
                <ReportFooter page={3} />
            </div>
        </div>
        <style>{`
          .report-slide { page-break-after: always; break-after: page; }
          @media print { 
            body { background: white !important; padding: 0 !important; } 
            .print\\:hidden { display: none !important; } 
            .report-slide { width: 1280px !important; height: 720px !important; border-radius: 0 !important; padding: 60px 80px !important; margin: 0 !important; border-top: 14px solid #002147 !important; break-after: page; page-break-after: always; display: flex !important; } 
            @page { size: 1280px 720px; margin: 0; } 
          }
        `}</style>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-[#002147] font-bold">
        <Activity className="animate-spin text-[#C5A059] mb-4" size={48} />
        <p className="font-serif text-2xl font-bold tracking-tight">Syncing Forensic Integrity Sync...</p>
    </div>
  );
}
