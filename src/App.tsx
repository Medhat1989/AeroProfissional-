import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Plus, 
  Upload, 
  Video, 
  CheckCircle2, 
  Briefcase, 
  Users, 
  LayoutDashboard, 
  ChevronRight, 
  Search,
  ArrowRight,
  FileText,
  Play,
  Square,
  RefreshCw,
  Clock,
  User,
  ShieldCheck,
  Star,
  Download,
  X,
  Trash2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

import { PDFDocument } from 'pdf-lib';

// --- Types ---
type ViewState = 'landing' | 'apply' | 'admin' | 'success';

interface Candidate {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  height?: string;
  weight?: string;
  lastFlightDate?: string;
  lastOperator?: string;
  nearestAirport?: string;
  isSenior?: boolean;
  hasEasa?: boolean;
  easaRef?: string;
  hasEasaMedical?: boolean;
  rotation?: string;
  status: 'Pending' | 'Screened' | 'Internal Review' | 'Accepted' | 'Rejected';
  appliedAt: string;
  videoUrl?: string;
  photoUrl?: string; // Live photograph from candidate
  docs: string[];
  docUrls?: { [name: string]: string }; // Map of document names to object URLs
  score?: number;
  aiSummary?: string;
  cvAnalysis?: string; // AI generated CV analysis
  hrComments?: string[];
}

// --- Mock Data ---
const MOCK_CANDIDATES: Candidate[] = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    mobile: '+44 7700 900123',
    role: 'Senior Cabin Crew',
    height: '172cm',
    weight: '65kg',
    lastFlightDate: '2024-02-28',
    lastOperator: 'British Airways',
    nearestAirport: 'LHR',
    isSenior: true,
    hasEasa: true,
    easaRef: 'EASA.UK.123456',
    hasEasaMedical: true,
    rotation: '14 weeks ON/ 2 weeks Off',
    status: 'Screened',
    appliedAt: '2024-03-12',
    docs: ['CV_Sarah.pdf', 'Passport_Scan.pdf', 'EASA_Attestation.pdf', 'Medical_Cert.pdf', 'Photo_Headshot.jpg', 'Photo_FullBody.jpg'],
    score: 88,
    aiSummary: 'Exceptional communication skills and emergency response training. Previous experience with long-haul international flights.'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'm.chen@example.com',
    mobile: '+852 9123 4567',
    role: 'Flight Attendant (Bilingual)',
    height: '178cm',
    weight: '72kg',
    lastFlightDate: '2024-03-05',
    lastOperator: 'Cathay Pacific',
    nearestAirport: 'HKG',
    isSenior: false,
    hasEasa: false,
    hasEasaMedical: true,
    rotation: '21 Weeks ON / 3Weeks Off',
    status: 'Pending',
    appliedAt: '2024-03-14',
    docs: ['Michael_Chen_Cabin.pdf', 'Passport.pdf', 'Medical.pdf', 'FullBody.jpg'],
    score: 92,
    aiSummary: 'Fluent in Mandarin and English. High focus on customer service excellence and safety protocols.'
  }
];

// --- Components ---

const Header = ({ view, setView }: { view: ViewState, setView: (v: ViewState) => void }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-brand-border h-20 flex items-center justify-between px-12">
    <div 
      className="flex items-center gap-4 cursor-pointer group" 
      onClick={() => setView('landing')}
    >
      <img 
        src="https://i.ibb.co/HL31wDVs/aeroprofessional-limited-logo-removebg-preview.png" 
        alt="AeroProfissional" 
        className="h-10 w-auto brightness-125 hover:scale-105 transition-transform"
        referrerPolicy="no-referrer"
      />
      <span className="font-sans font-extrabold text-xl tracking-[0.1em] text-brand-accent uppercase hidden sm:block">AeroProfissional</span>
    </div>
    <div className="flex items-center gap-12">
      <button 
        onClick={() => setView('landing')}
        className={`text-xs uppercase tracking-widest font-bold ${view === 'landing' ? 'text-white' : 'text-brand-dim hover:text-white'} transition-colors`}
      >
        Solutions
      </button>
      <button 
        onClick={() => setView('admin')}
        className={`text-xs uppercase tracking-widest font-bold ${view === 'admin' ? 'text-white' : 'text-brand-dim hover:text-white'} transition-all flex items-center gap-2`}
      >
        <LayoutDashboard className="w-4 h-4" />
        Admin Console
      </button>
      <button 
        onClick={() => setView('apply')}
        className="bg-brand-accent text-black px-8 py-3 rounded-sm text-xs font-black uppercase tracking-wider hover:scale-105 transition-all shadow-[0_0_20px_var(--color-brand-accent-glow)] flex items-center gap-3"
      >
        Open Profile
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  </nav>
);

const LandingHero = ({ onStart }: { onStart: () => void }) => (
  <div className="pt-40 pb-20 px-12 max-w-7xl mx-auto">
    <div className="grid lg:grid-cols-2 gap-16 items-center">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-6xl md:text-8xl font-sans font-bold tracking-tight leading-[1.1] mb-8 bg-gradient-to-br from-white to-brand-dim bg-clip-text text-transparent">
          Show Them<br />
          The Real You.
        </h1>
        <p className="text-xl text-brand-dim max-w-lg mb-12 leading-relaxed">
          Streamline your professional entry. One 2-minute recording, encrypted document storage, and instant AI-driven screening for top-tier roles.
        </p>
        
        <div className="flex flex-col gap-4 mb-12">
          {[
            "120-Second High-Definition Video Profiling",
            "Secure ISO-27001 Document Vault",
            "Automated Candidate Scorecard Generation"
          ].map((feat, i) => (
            <div key={i} className="flex items-center gap-4 bg-brand-glass border-l-2 border-brand-accent p-4 rounded-r-lg">
               <CheckCircle2 className="w-4 h-4 text-brand-accent" />
               <span className="text-sm font-medium text-brand-text">{feat}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <button 
            onClick={onStart}
            className="w-full sm:w-auto px-10 py-5 bg-brand-accent text-black rounded-sm text-sm font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_30px_var(--color-brand-accent-glow)] flex items-center justify-center gap-3"
          >
            Open Profile
            <ArrowRight className="w-5 h-5" />
          </button>
          <button className="w-full sm:w-auto px-10 py-5 border border-brand-border bg-transparent text-brand-text rounded-sm text-sm font-black uppercase tracking-widest hover:bg-brand-glass transition-all">
            Watch Demo
          </button>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative"
      >
        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-brand-card border border-brand-border shadow-[0_40px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <img 
            src="https://picsum.photos/seed/recruitment/1200/900" 
            className="w-full h-full object-cover opacity-60"
            alt="Landing"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-bg/80 via-transparent to-transparent" />
          
          <div className="absolute inset-0 p-8 flex flex-col justify-between pointer-events-none">
            <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full w-fit border border-red-500/30">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Live Recording</span>
            </div>
            
            <div className="flex justify-between items-end">
              <div className="font-mono text-3xl text-white tracking-tighter">01:42</div>
              <div className="text-right">
                 <div className="text-lg font-bold text-white">Sarah Jenkins</div>
                 <div className="text-[10px] uppercase tracking-widest text-brand-accent font-black">Senior Cabin Crew</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </div>
);

const VideoRecorder = ({ onComplete }: { onComplete: (base64: string) => void }) => {
  const [recording, setRecording] = useState(false);
  const [timer, setTimer] = useState(120);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      console.error("Error accessing camera", err);
    }
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const base64 = loadEvent.target?.result as string;
        onComplete(base64);
      };
      reader.readAsDataURL(blob);
    };
    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (recording && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0 && recording) {
      stopRecording();
    }
    return () => clearInterval(interval);
  }, [recording, timer]);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  return (
    <div className="bg-brand-card rounded-3xl overflow-hidden relative border border-brand-border group">
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        className={`w-full aspect-video object-cover pointer-events-none transition-opacity duration-1000 ${previewUrl ? 'opacity-0 absolute' : 'opacity-60'}`} 
      />
      {previewUrl && (
        <video 
          src={previewUrl} 
          controls 
          className="w-full aspect-video object-cover" 
        />
      )}

      {!previewUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
          <div className="absolute top-8 left-8 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
             <div className={`w-2 h-2 rounded-full ${recording ? 'bg-red-500 animate-pulse' : 'bg-brand-dim'}`} />
             <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white">
               {recording ? 'Stream Active' : 'Sensor Ready'}
             </span>
             <span className="w-px h-3 bg-white/20" />
             <span className="font-mono text-[10px] font-black tracking-widest text-brand-accent">
               {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
             </span>
          </div>

          {!recording ? (
             <motion.button 
               whileHover={{ scale: 1.1 }}
               whileTap={{ scale: 0.9 }}
               onClick={startRecording}
               className="w-24 h-24 rounded-full border-[8px] border-brand-accent/20 flex items-center justify-center group-hover:border-brand-accent/40 transition-colors"
             >
               <div className="w-12 h-12 rounded-full bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]" />
             </motion.button>
          ) : (
             <motion.button 
               whileHover={{ scale: 1.1 }}
               whileTap={{ scale: 0.9 }}
               onClick={stopRecording}
               className="w-24 h-24 rounded-full border-[8px] border-red-500/20 flex items-center justify-center"
             >
               <Square className="w-8 h-8 text-red-500 fill-red-500" />
             </motion.button>
          )}

          <div className="absolute bottom-8 text-center">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-dim">
               {recording ? 'Recording session in progress' : 'Initialize video capture'}
             </p>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="absolute top-8 right-8">
          <button 
            onClick={() => { setPreviewUrl(null); setTimer(120); }}
            className="flex items-center gap-2 bg-brand-accent text-black px-6 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
          >
            <RefreshCw className="w-3 h-3" />
            Restart Stream
          </button>
        </div>
      )}
    </div>
  );
};

const ApplicationWizard = ({ onComplete }: { onComplete: (c: Partial<Candidate>) => void }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: '',
    height: '',
    weight: '',
    lastFlightDate: '',
    lastOperator: '',
    nearestAirport: '',
    isSenior: 'no',
    hasEasa: 'no',
    easaRef: '',
    hasEasaMedical: 'no',
    rotation: '14 weeks ON/ 2 weeks Off',
    docs: [] as string[],
    docUrls: {} as { [name: string]: string },
    photoUrl: ''
  });
  const [videoBase64, setVideoBase64] = useState<string | null>(null);

  const roles = ["Senior Cabin Crew", "Flight Attendant", "First Class Service Specialist", "Language Specialist (Cabin)", "Ground Support"];
  const rotations = ["14 weeks ON/ 2 weeks Off", "21 Weeks ON / 3Weeks Off"];

  const handleNext = () => setStep(s => s + 1);

  const handleSubmit = () => {
    onComplete({
      name: formData.name,
      email: formData.email,
      mobile: formData.mobile,
      role: formData.role,
      height: formData.height,
      weight: formData.weight,
      lastFlightDate: formData.lastFlightDate,
      lastOperator: formData.lastOperator,
      nearestAirport: formData.nearestAirport,
      isSenior: formData.isSenior === 'yes',
      hasEasa: formData.hasEasa === 'yes',
      easaRef: formData.easaRef,
      hasEasaMedical: formData.hasEasaMedical === 'yes',
      rotation: formData.rotation,
      docs: formData.docs,
      docUrls: formData.docUrls,
      photoUrl: formData.photoUrl,
      appliedAt: new Date().toISOString().split('T')[0],
      status: 'Pending',
      videoUrl: videoBase64 || undefined
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-32 px-6">
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-12">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-1 flex-1 transition-all ${step >= i ? 'bg-brand-accent' : 'bg-brand-border'}`} />
          ))}
        </div>
        <h2 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-brand-dim bg-clip-text text-transparent">
          {step === 1 && "Personal Profile."}
          {step === 2 && "Aviation Experience."}
          {step === 3 && "The Spotlight."}
          {step === 4 && "Document Vault."}
          {step === 5 && "Review Application."}
        </h2>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-[10px] uppercase font-black tracking-widest text-brand-dim ml-1">Full Name & Surname</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-brand-glass border border-brand-border focus:border-brand-accent rounded-xl outline-none transition-all text-white"
                  placeholder="Medhat Khalil"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] uppercase font-black tracking-widest text-brand-dim ml-1">Email Address</label>
                <input 
                  type="email" 
                  className="w-full p-4 bg-brand-glass border border-brand-border focus:border-brand-accent rounded-xl outline-none transition-all text-white"
                  placeholder="medhat@aeroprofessional.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] uppercase font-black tracking-widest text-brand-dim ml-1">Mobile Number</label>
                <input 
                  type="tel" 
                  className="w-full p-4 bg-brand-glass border border-brand-border focus:border-brand-accent rounded-xl outline-none transition-all text-white"
                  placeholder="+44 7700 900000"
                  value={formData.mobile}
                  onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] uppercase font-black tracking-widest text-brand-dim ml-1">Height (cm)</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-brand-glass border border-brand-border focus:border-brand-accent rounded-xl outline-none transition-all text-white"
                  placeholder="180cm"
                  value={formData.height}
                  onChange={e => setFormData({ ...formData, height: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] uppercase font-black tracking-widest text-brand-dim ml-1">Weight (kg)</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-brand-glass border border-brand-border focus:border-brand-accent rounded-xl outline-none transition-all text-white"
                  placeholder="75kg"
                  value={formData.weight}
                  onChange={e => setFormData({ ...formData, weight: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] uppercase font-black tracking-widest text-brand-dim ml-1">Preferred Role</label>
                <select 
                  className="w-full p-4 bg-brand-glass border border-brand-border focus:border-brand-accent rounded-xl outline-none transition-all text-white appearance-none"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="" className="bg-brand-bg">Select role...</option>
                  {roles.map(r => <option key={r} value={r} className="bg-brand-bg">{r}</option>)}
                </select>
              </div>
            </div>
            <button 
              disabled={!formData.name || !formData.email || !formData.mobile || !formData.role}
              onClick={handleNext}
              className="w-full py-5 bg-brand-accent text-black rounded-lg font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-30 shadow-[0_0_30px_var(--color-brand-accent-glow)] flex items-center justify-center gap-3"
            >
              Experience Details <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-[10px] uppercase font-black tracking-widest text-brand-dim ml-1">Date of Last Flight</label>
                <input 
                  type="date" 
                  className="w-full p-4 bg-brand-glass border border-brand-border focus:border-brand-accent rounded-xl outline-none transition-all text-white inverted-scheme"
                  value={formData.lastFlightDate}
                  onChange={e => setFormData({ ...formData, lastFlightDate: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] uppercase font-black tracking-widest text-brand-dim ml-1">Last Operator / Airline</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-brand-glass border border-brand-border focus:border-brand-accent rounded-xl outline-none transition-all text-white"
                  placeholder="Etihad, Emirates, etc."
                  value={formData.lastOperator}
                  onChange={e => setFormData({ ...formData, lastOperator: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] uppercase font-black tracking-widest text-brand-dim ml-1">Nearest Airport to your city</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-brand-glass border border-brand-border focus:border-brand-accent rounded-xl outline-none transition-all text-white"
                  placeholder="LHR, DXB, JFK"
                  value={formData.nearestAirport}
                  onChange={e => setFormData({ ...formData, nearestAirport: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] uppercase font-black tracking-widest text-brand-dim ml-1">Senior Cabin Crew Experience?</label>
                <select 
                  className="w-full p-4 bg-brand-glass border border-brand-border focus:border-brand-accent rounded-xl outline-none transition-all text-white appearance-none"
                  value={formData.isSenior}
                  onChange={e => setFormData({ ...formData, isSenior: e.target.value })}
                >
                  <option value="no" className="bg-brand-bg">No</option>
                  <option value="yes" className="bg-brand-bg">Yes</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] uppercase font-black tracking-widest text-brand-dim ml-1">Valid EASA Attestation?</label>
                <select 
                  className="w-full p-4 bg-brand-glass border border-brand-border focus:border-brand-accent rounded-xl outline-none transition-all text-white appearance-none"
                  value={formData.hasEasa}
                  onChange={e => setFormData({ ...formData, hasEasa: e.target.value })}
                >
                  <option value="no" className="bg-brand-bg">No</option>
                  <option value="yes" className="bg-brand-bg">Yes</option>
                </select>
              </div>
              {formData.hasEasa === 'yes' && (
                <div className="space-y-3">
                  <label className="block text-[10px] uppercase font-black tracking-widest text-brand-dim ml-1">EASA Reference Number</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-brand-glass border border-brand-border focus:border-brand-accent rounded-xl outline-none transition-all text-white"
                    placeholder="EASA.XX.XXXXXX"
                    value={formData.easaRef}
                    onChange={e => setFormData({ ...formData, easaRef: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-3">
                <label className="block text-[10px] uppercase font-black tracking-widest text-brand-dim ml-1">Valid EASA Medical?</label>
                <select 
                  className="w-full p-4 bg-brand-glass border border-brand-border focus:border-brand-accent rounded-xl outline-none transition-all text-white appearance-none"
                  value={formData.hasEasaMedical}
                  onChange={e => setFormData({ ...formData, hasEasaMedical: e.target.value })}
                >
                  <option value="no" className="bg-brand-bg">No</option>
                  <option value="yes" className="bg-brand-bg">Yes</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] uppercase font-black tracking-widest text-brand-dim ml-1">Preferred Rotation</label>
                <select 
                  className="w-full p-4 bg-brand-glass border border-brand-border focus:border-brand-accent rounded-xl outline-none transition-all text-white appearance-none"
                  value={formData.rotation}
                  onChange={e => setFormData({ ...formData, rotation: e.target.value })}
                >
                  {rotations.map(r => <option key={r} value={r} className="bg-brand-bg">{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 py-4 border border-brand-border text-brand-dim rounded-lg font-black uppercase tracking-widest hover:text-white transition-colors">Back</button>
              <button onClick={handleNext} className="flex-[2] py-4 bg-brand-accent text-black rounded-lg font-black uppercase tracking-widest transition-all hover:scale-[1.02]">Next: Video Introduction</button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <p className="text-brand-dim">
              Record a 2-minute introduction. Please share your passion for aviation and why you are the ideal candidate for <span className="text-brand-accent font-bold">{formData.role}</span>.
            </p>
            <VideoRecorder onComplete={(base64) => setVideoBase64(base64)} />
            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="flex-1 py-5 border border-brand-border text-brand-dim rounded-lg font-black uppercase tracking-widest hover:text-white transition-colors">Back</button>
              <button 
                onClick={handleNext}
                disabled={!videoBase64}
                className="flex-[2] py-5 bg-brand-accent text-black rounded-lg font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:scale-[1.02]"
              >
                Continue to Evidence
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'cv', label: 'Upload your CV' },
                { id: 'passport', label: 'Copy of Passport' },
                { id: 'easa', label: 'EASA Attestation Copy' },
                { id: 'medical', label: 'Medical Certificate' },
                { id: 'photo', label: 'Recent Photograph' },
                { id: 'fullbody', label: 'Full-Body Photograph' }
              ].map(upload => (
                <div key={upload.id} className="relative bg-brand-glass border border-dashed border-brand-border p-6 text-center rounded-2xl hover:border-brand-accent transition-all group">
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onload = (loadEvent) => {
                          const base64 = loadEvent.target?.result as string;
                          const filename = `${upload.label}: ${file.name}`;
                          
                          setFormData(prev => {
                            const newDocs = [...prev.docs];
                            if (!newDocs.includes(filename)) {
                              newDocs.push(filename);
                            }
                            const newDocUrls = { ...prev.docUrls, [filename]: base64 };
                            
                            // Auto-update photoUrl if it's the "Recent Photograph"
                            let newPhotoUrl = prev.photoUrl;
                            if (upload.id === 'photo') {
                              newPhotoUrl = base64;
                            }
                            
                            return { ...prev, docs: newDocs, docUrls: newDocUrls, photoUrl: newPhotoUrl };
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <Upload className="w-6 h-6 text-brand-accent mx-auto mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-dim group-hover:text-white">{upload.label}</span>
                </div>
              ))}
            </div>

            {formData.docs.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-dim border-b border-brand-border pb-1">Verified Manifest</h4>
                {formData.docs.map((doc, idx) => (
                  <div key={idx} className="bg-brand-glass border border-brand-border p-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3 h-3 text-brand-accent" />
                      <span className="text-[10px] font-medium text-brand-text truncate">{doc}</span>
                    </div>
                    <CheckCircle2 className="w-3 h-3 text-brand-accent" />
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-4">
              <button 
                onClick={handleSubmit}
                className="flex-[2] py-5 bg-brand-accent text-black rounded-lg font-black uppercase tracking-[0.2em] shadow-[0_0_40px_var(--color-brand-accent-glow)] hover:scale-[1.02] transition-all"
              >
                Submit Application
              </button>
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div 
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4 p-6 bg-brand-glass rounded-3xl border border-brand-border">
                <div className="flex justify-between items-center border-b border-brand-border pb-3 mb-4">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-brand-accent">Identity</h4>
                  <button onClick={() => setStep(1)} className="text-[8px] uppercase font-bold text-brand-dim hover:text-white transition-colors">Edit</button>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-brand-dim uppercase">Name: <span className="text-white font-bold ml-2">{formData.name}</span></p>
                  <p className="text-[10px] text-brand-dim uppercase">Email: <span className="text-white font-bold ml-2">{formData.email}</span></p>
                  <p className="text-[10px] text-brand-dim uppercase">Mobile: <span className="text-white font-bold ml-2">{formData.mobile}</span></p>
                  <p className="text-[10px] text-brand-dim uppercase">Physical: <span className="text-white font-bold ml-2">{formData.height}cm / {formData.weight}kg</span></p>
                  <p className="text-[10px] text-brand-dim uppercase">Role: <span className="text-white font-bold ml-2">{formData.role}</span></p>
                </div>
              </div>

              <div className="space-y-4 p-6 bg-brand-glass rounded-3xl border border-brand-border">
                <div className="flex justify-between items-center border-b border-brand-border pb-3 mb-4">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-brand-accent">Aviation</h4>
                  <button onClick={() => setStep(2)} className="text-[8px] uppercase font-bold text-brand-dim hover:text-white transition-colors">Edit</button>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-brand-dim uppercase">Last Op: <span className="text-white font-bold ml-2">{formData.lastOperator}</span></p>
                  <p className="text-[10px] text-brand-dim uppercase">Last Flt: <span className="text-white font-bold ml-2">{formData.lastFlightDate}</span></p>
                  <p className="text-[10px] text-brand-dim uppercase">EASA: <span className="text-white font-bold ml-2">{formData.hasEasa === 'yes' ? `YES (${formData.easaRef})` : 'NO'}</span></p>
                  <p className="text-[10px] text-brand-dim uppercase">Rotation: <span className="text-white font-bold ml-2">{formData.rotation}</span></p>
                </div>
              </div>

              <div className="space-y-4 p-6 bg-brand-glass rounded-3xl border border-brand-border md:col-span-2">
                <div className="flex justify-between items-center border-b border-brand-border pb-3 mb-4">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-brand-accent">Assets & Media</h4>
                  <div className="flex gap-4">
                    <button onClick={() => setStep(3)} className="text-[8px] uppercase font-bold text-brand-dim hover:text-white transition-colors">Edit Video</button>
                    <button onClick={() => setStep(4)} className="text-[8px] uppercase font-bold text-brand-dim hover:text-white transition-colors">Edit Docs</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.docs.map(d => (
                    <span key={d} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] text-brand-dim">{d}</span>
                  ))}
                </div>
                {videoBase64 && (
                  <div className="flex items-center gap-2 mt-4 text-brand-accent">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[8px] uppercase font-black tracking-widest">Video Stream Ready</span>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              className="w-full py-6 bg-brand-accent text-black rounded-lg font-black uppercase tracking-[0.2em] text-lg shadow-[0_0_50px_var(--color-brand-accent-glow)] hover:scale-[1.02] transition-all"
            >
              Submit Application
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SuccessScreen = ({ onReset }: { onReset: () => void }) => (
  <div className="max-w-2xl mx-auto py-40 px-6 text-center">
    <motion.div 
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="w-24 h-24 border-4 border-brand-accent rounded-sm rotate-45 flex items-center justify-center mx-auto mb-12 shadow-[0_0_50px_var(--color-brand-accent-glow)]"
    >
      <CheckCircle2 className="w-10 h-10 text-brand-accent -rotate-45" />
    </motion.div>
    <h2 className="text-6xl font-black tracking-tighter mb-6 text-white">SUBMIT SUCCESSFUL.</h2>
    <p className="text-xl text-brand-dim mb-16 max-w-lg mx-auto leading-relaxed">
      Thank you for your application to AeroProfissional. Your profile has been successfully uploaded to our recruitment index.
    </p>
    <button 
      onClick={onReset}
      className="px-12 py-5 bg-brand-accent text-black rounded-sm font-black uppercase tracking-[0.2em] shadow-[0_0_30px_var(--color-brand-accent-glow)] hover:scale-105 transition-all"
    >
      Return to Interface
    </button>
  </div>
);

const AdminDashboard = ({ candidates, setCandidates }: { candidates: Candidate[], setCandidates: (c: Candidate[] | ((prev: Candidate[]) => Candidate[])) => void }) => {
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [screening, setScreening] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [previewAsset, setPreviewAsset] = useState<{ url: string, name: string } | null>(null);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  const deleteCandidate = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
    if (selected?.id === id) setSelected(null);
    setCandidateToDelete(null);
  };

  const addComment = () => {
    if (!selected || !newComment.trim()) return;
    const updatedCandidate = {
      ...selected,
      hrComments: [...(selected.hrComments || []), newComment.trim()]
    };
    setCandidates(prev => prev.map(c => c.id === selected.id ? updatedCandidate : c));
    setSelected(updatedCandidate);
    setNewComment('');
  };

  const downloadAsPdf = async (candidate: Candidate) => {
    const mainJsPDF = new jsPDF('p', 'mm', 'a4');
    const width = mainJsPDF.internal.pageSize.getWidth();
    const height = mainJsPDF.internal.pageSize.getHeight();
    
    // Page 1: Main Dossier Summary
    if (pdfRef.current) {
      const element = pdfRef.current;
      const originalDisplay = element.style.display;
      element.style.display = 'block';
      
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });
        const imgData = canvas.toDataURL('image/png', 1.0);
        const imgProps = mainJsPDF.getImageProperties(imgData);
        const pdfPageHeight = (imgProps.height * width) / imgProps.width;
        
        mainJsPDF.addImage(imgData, 'PNG', 0, 0, width, pdfPageHeight);
      } catch (error) {
        console.error("Summary page capture failed:", error);
      } finally {
        element.style.display = originalDisplay;
      }
    }

    // Process all Documents
    const docEntries = Object.entries(candidate.docUrls || {});
    const pdfToMerge: string[] = [];

    for (const [name, url] of docEntries) {
      const isPdf = url.startsWith('data:application/pdf') || name.toLowerCase().includes('.pdf');
      
      if (isPdf) {
        pdfToMerge.push(url);
        continue;
      }

      // Handle as Image in jsPDF
      try {
        const img = new Image();
        img.src = url;
        img.crossOrigin = "anonymous";
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        mainJsPDF.addPage();
        
        // Header
        mainJsPDF.setFillColor(248, 249, 250);
        mainJsPDF.rect(0, 0, width, 25, 'F');
        mainJsPDF.setDrawColor(0, 242, 255);
        mainJsPDF.setLineWidth(1);
        mainJsPDF.line(0, 25, width, 25);
        
        mainJsPDF.setFont("helvetica", "bold");
        mainJsPDF.setFontSize(10);
        mainJsPDF.setTextColor(0, 184, 204);
        mainJsPDF.text("AEROPROFESSIONAL VERIFIED ASSET", 15, 12);
        
        mainJsPDF.setFontSize(14);
        mainJsPDF.setTextColor(0, 0, 0);
        mainJsPDF.text(name.split(': ')[0], 15, 20);

        const availableHeight = height - 40;
        const availableWidth = width - 30;
        let targetWidth = img.width;
        let targetHeight = img.height;
        const ratio = Math.min(availableWidth / targetWidth, availableHeight / targetHeight);
        targetWidth *= ratio;
        targetHeight *= ratio;
        
        const xOffset = (width - targetWidth) / 2;
        const yOffset = 30 + (availableHeight - targetHeight) / 2;
        
        // Auto-detect format from base64 if possible
        const format = url.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        mainJsPDF.addImage(img, format, xOffset, yOffset, targetWidth, targetHeight, undefined, 'FAST');
        
        mainJsPDF.setFontSize(8);
        mainJsPDF.setTextColor(150, 150, 150);
        mainJsPDF.text(`Digital Fingerprint: ${name.split(': ')[1] || 'Aviation Manifest'}`, 15, height - 10);
      } catch (err) {
        console.warn(`Could not add image asset ${name} to PDF:`, err);
      }
    }

    // Final Stage: Merge with PDF-LIB
    try {
      const summaryBytes = mainJsPDF.output('arraybuffer');
      const mergedPdf = await PDFDocument.load(summaryBytes);

      for (const pdfDataUri of pdfToMerge) {
        try {
          // fetch works for data URIs
          const response = await fetch(pdfDataUri);
          const pdfBytes = await response.arrayBuffer();
          const docToEmbed = await PDFDocument.load(pdfBytes);
          const pages = await mergedPdf.copyPages(docToEmbed, docToEmbed.getPageIndices());
          pages.forEach(p => mergedPdf.addPage(p));
        } catch (mergeErr) {
          console.error("Failed to merge PDF asset:", mergeErr);
        }
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `AeroProfessional_Dossier_Full_${candidate.name.replace(/\s+/g, '_')}.pdf`;
      link.click();
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
    } catch (err) {
      console.error("PDF-LIB merging failed, falling back to basic PDF:", err);
      mainJsPDF.save(`AeroProfessional_Dossier_Partial_${candidate.name.replace(/\s+/g, '_')}.pdf`);
    }
  };

  const downloadFileAsPdf = async (url: string, fileName: string) => {
    if (!url) return;
    
    // Check if it's already a PDF
    if (fileName.toLowerCase().endsWith('.pdf')) {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      return;
    }

    // Otherwise, wrap in PDF (assumes image)
    try {
      const pdf = new jsPDF();
      const img = new Image();
      img.src = url;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();
      pdf.addImage(img, 'JPEG', 0, 0, width, height);
      pdf.save(`${fileName.split('.')[0]}.pdf`);
    } catch (err) {
      console.error("File to PDF conversion failed:", err);
      // Fallback to normal download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
    }
  };

  const performAIScreening = async (candidate: Candidate) => {
    setScreening(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-latest",
        contents: `Act as a senior aviation recruiter. Analyze this cabin crew candidate profile (treating the provided experience data as the core CV content) and provide:
        1. A high-level screening summary (max 2 sentences).
        2. A detailed "CV Professional Scan" which identifies key strengths, potential gaps, and suitability for international flight operations (3-4 bullet points).
        3. A numerical score out of 100.
        
        Candidate Name: ${candidate.name}
        Role: ${candidate.role}
        Physicals: ${candidate.height} / ${candidate.weight}
        Experience: ${candidate.lastOperator} (Last flight: ${candidate.lastFlightDate})
        Nearest Airport: ${candidate.nearestAirport}
        Senior Status: ${candidate.isSenior ? 'Yes' : 'No'}
        EASA Details: ${candidate.hasEasa ? candidate.easaRef : 'N/A'}
        Rotation Preference: ${candidate.rotation}
        Documents Uploaded: ${candidate.docs.join(', ')}
        
        Format your response strictly as a JSON object: { "summary": string, "cvScan": string, "score": number }`
      });

      const resText = response.text || '{ "summary": "Analysis complete.", "cvScan": "Competitive aviation profile.", "score": 85 }';
      const cleanJson = resText.replace(/```json|```/g, '').trim();
      const result = JSON.parse(cleanJson);

      setCandidates(prev => prev.map(c => 
        c.id === candidate.id ? { ...c, aiSummary: result.summary, cvAnalysis: result.cvScan, score: result.score, status: 'Screened' } : c
      ));
      if (selected?.id === candidate.id) {
        setSelected({ ...selected, aiSummary: result.summary, cvAnalysis: result.cvScan, score: result.score, status: 'Screened' });
      }
    } catch (err) {
      console.error("AI Error:", err);
    } finally {
      setScreening(false);
    }
  };

  return (
    <div className="pt-32 px-12 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
        <div>
          <h2 className="text-5xl font-bold tracking-tight mb-3 text-white">Console Pipeline</h2>
          <p className="text-brand-dim">Neural candidate screening & profile verification.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-brand-glass px-6 py-3 rounded-xl flex items-center gap-3 border border-brand-border">
            <Users className="w-5 h-5 text-brand-accent" />
            <span className="font-bold text-white">{candidates.length} <span className="text-brand-dim font-medium uppercase tracking-widest text-[10px] ml-2">Total Pool</span></span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Sidebar List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-dim" />
            <input 
              type="text" 
              placeholder="Query candidate index..."
              className="w-full pl-11 pr-4 py-4 bg-brand-glass rounded-xl outline-none border border-brand-border focus:border-brand-accent transition-all text-white placeholder:text-brand-dim/50"
            />
          </div>
          {candidates.map(candidate => (
            <motion.div 
              key={candidate.id}
              whileHover={{ x: 4 }}
              onClick={() => setSelected(candidate)}
              className={`p-5 rounded-2xl cursor-pointer border-l-4 transition-all ${selected?.id === candidate.id ? 'bg-brand-accent/10 border-brand-accent shadow-[0_0_20px_rgba(0,242,255,0.1)]' : 'bg-brand-glass border-transparent hover:bg-brand-glass/80'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={candidate.photoUrl || `https://picsum.photos/seed/${candidate.id}/100/100`}
                      className="w-10 h-10 rounded-lg object-cover border border-white/10"
                      alt="Avatar"
                      referrerPolicy="no-referrer"
                    />
                    {candidate.videoUrl && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-accent rounded-full flex items-center justify-center border-2 border-brand-bg">
                        <Play className="w-2 h-2 text-black fill-black" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white text-md">{candidate.name}</div>
                    <div className="text-[9px] text-brand-dim uppercase tracking-wider">{candidate.nearestAirport}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCandidateToDelete(candidate);
                    }}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  {candidate.score && (
                    <div className={`text-[10px] px-2 py-1 rounded font-black tracking-widest ${selected?.id === candidate.id ? 'bg-brand-accent text-black' : 'bg-brand-dim/20 text-brand-dim'}`}>
                      {candidate.score}% MATCH
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-brand-dim mb-4">{candidate.role}</div>
              <div className="flex items-center justify-between border-t border-brand-border pt-4">
                <span className={`text-[10px] uppercase tracking-[0.2em] font-black ${candidate.status === 'Pending' ? 'text-orange-400' : 'text-brand-accent'}`}>
                  {candidate.status}
                </span>
                <span className="text-[10px] opacity-40 font-mono text-white">{candidate.appliedAt}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Panel */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-brand-card border border-brand-border rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-3xl">
              <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
                <div className="flex items-center gap-8">
                  <div className="relative">
                    <img 
                      src={selected.photoUrl || `https://picsum.photos/seed/${selected.id}/200/200`} 
                      className="w-28 h-28 rounded-2xl object-cover border-2 border-brand-border" 
                      alt="Pfp"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center border-4 border-brand-bg">
                      <ShieldCheck className="w-4 h-4 text-black" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-4xl font-bold tracking-tight text-white mb-3">{selected.name}</h3>
                    <div className="flex flex-wrap gap-3">
                      <span className="bg-brand-accent/10 border border-brand-accent/20 px-3 py-1 rounded-sm text-[10px] uppercase font-black tracking-wider text-brand-accent">{selected.role}</span>
                      <span className="bg-brand-glass px-3 py-1 rounded-sm text-[10px] font-mono text-brand-dim lowercase">{selected.email}</span>
                      <span className="bg-brand-glass px-3 py-1 rounded-sm text-[10px] font-mono text-brand-dim lowercase">{selected.mobile}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                  <button 
                    onClick={() => downloadAsPdf(selected)}
                    className="px-8 py-4 bg-brand-glass text-white border border-brand-border rounded-sm font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-white/10 transition-all shadow-xl"
                  >
                    <Download className="w-4 h-4 text-brand-accent" />
                    Export PDF
                  </button>
                  <button 
                    onClick={() => performAIScreening(selected)}
                    disabled={screening}
                    className="px-8 py-4 bg-brand-accent text-black rounded-sm font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-[0_0_20px_var(--color-brand-accent-glow)] disabled:opacity-30"
                  >
                    {screening ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    {screening ? 'Neural Screening...' : 'Execute AI Scan'}
                  </button>
                  <button 
                    onClick={() => setCandidateToDelete(selected)}
                    className="px-4 py-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-sm hover:bg-red-500/20 transition-all flex items-center justify-center"
                    title="Delete Candidate"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                {[
                  { label: 'Height/Weight', value: `${selected.height} / ${selected.weight}` },
                  { label: 'Last Flight', value: selected.lastFlightDate },
                  { label: 'Base/Airport', value: selected.nearestAirport },
                  { label: 'Rotation', value: selected.rotation },
                  { label: 'Senior Crew', value: selected.isSenior ? 'YES' : 'NO' },
                  { label: 'EASA Attest', value: selected.hasEasa ? 'YES' : 'NO' },
                  { label: 'EASA Medical', value: selected.hasEasaMedical ? 'YES' : 'NO' },
                  { label: 'Last Operator', value: selected.lastOperator }
                ].map(stat => (
                  <div key={stat.label} className="bg-black/20 p-4 rounded-xl border border-brand-border">
                    <div className="text-[8px] font-black uppercase tracking-widest text-brand-dim mb-1">{stat.label}</div>
                    <div className="text-[10px] font-bold text-white uppercase">{stat.value || 'N/A'}</div>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-16">
                <div className="space-y-12">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dim flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-accent" /> Video Stream Analysis
                    </h4>
                    <div 
                      onClick={() => setPlayingVideo(selected.videoUrl || `https://www.w3schools.com/html/mov_bbb.mp4`)} // Default mock video
                      className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative group border border-brand-border cursor-pointer hover:border-brand-accent transition-all"
                    >
                      {selected.videoUrl ? (
                        <video 
                          src={selected.videoUrl} 
                          className="w-full h-full object-cover opacity-50 transition-all duration-700 group-hover:opacity-80"
                          muted
                        />
                      ) : (
                        <img 
                          src={`https://picsum.photos/seed/video${selected.id}/800/450`} 
                          className="w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700" 
                          alt="Thumbnail"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-brand-accent border-[6px] border-black flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(0,242,255,0.4)]">
                          <Play className="w-6 h-6 text-black fill-black" />
                        </div>
                      </div>
                      <div className="absolute top-4 left-4 flex gap-2">
                        <div className="bg-black/60 px-2 py-1 rounded text-[8px] font-black tracking-widest text-red-500 border border-red-500/30">ENCRYPTED</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dim flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-accent" /> Document Vault
                    </h4>
                    <div className="grid gap-3">
                      {selected.videoUrl && (
                        <a 
                          href={selected.videoUrl} 
                          download={`Introduction_${selected.name.replace(/\s+/g, '_')}.webm`}
                          className="group flex items-center justify-between p-5 bg-brand-accent/10 border border-brand-accent/20 rounded-xl hover:bg-brand-accent/20 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <Play className="w-5 h-5 text-brand-accent" />
                            <span className="text-xs font-bold text-white tracking-wide italic">introduction_reel.mp4</span>
                          </div>
                          <Download className="w-4 h-4 text-brand-accent" />
                        </a>
                      )}
                      {selected.docs.map(doc => (
                        <a 
                          key={doc} 
                          href={selected.docUrls?.[doc]} 
                          onClick={(e) => {
                            e.preventDefault();
                            if (selected.docUrls?.[doc]) {
                              downloadFileAsPdf(selected.docUrls[doc], doc.split(': ')[1]);
                            }
                          }}
                          className={`group flex items-center justify-between p-5 bg-black/40 rounded-xl border border-brand-border hover:border-brand-accent transition-all cursor-pointer ${!selected.docUrls?.[doc] ? 'pointer-events-none opacity-50' : ''}`}
                        >
                          <div className="flex items-center gap-4">
                            <FileText className="w-5 h-5 text-brand-dim group-hover:text-brand-accent" />
                            <span className="text-xs font-bold text-white tracking-wide">{doc}</span>
                          </div>
                          {selected.docUrls?.[doc] ? (
                            <div className="flex gap-2">
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  setPreviewAsset({ url: selected.docUrls![doc], name: doc });
                                }}
                                className="p-2 hover:bg-white/10 rounded-lg text-brand-dim hover:text-white transition-all"
                              >
                                <Search className="w-4 h-4" />
                              </button>
                              <Download 
                                onClick={(e) => {
                                  e.preventDefault();
                                  downloadFileAsPdf(selected.docUrls![doc], doc.split(': ')[1]);
                                }}
                                className="w-4 h-4 text-brand-accent opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" 
                              />
                            </div>
                          ) : (
                            <div className="text-brand-accent font-black text-[10px]">MOCK</div>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-12">
                  <div className="space-y-8">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dim flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-accent" /> Neural Screening & CV Scan
                    </h4>
                    {selected.aiSummary ? (
                      <div className="p-8 bg-brand-accent border-l-4 border-black text-black space-y-8">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Personnel Quality Score</div>
                            <div className="text-5xl font-black italic">{selected.score}%</div>
                          </div>
                          <div className="w-16 h-16 rounded-full border-4 border-black/10 flex items-center justify-center text-2xl font-black italic">AP</div>
                        </div>
                        
                        <div className="bg-black/5 p-5 rounded-2xl border border-black/10">
                           <p className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">Professional summary</p>
                           <p className="text-sm font-bold leading-relaxed">{selected.aiSummary}</p>
                        </div>

                        <div className="bg-white/20 p-5 rounded-2xl border border-white/20">
                           <p className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">Full CV Intelligence Scan</p>
                           <p className="text-xs font-bold leading-relaxed whitespace-pre-wrap">{selected.cvAnalysis || "Run scan to extract digital profile."}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-64 border-2 border-dashed border-brand-border rounded-3xl flex flex-col items-center justify-center text-brand-dim gap-4 bg-brand-glass">
                        <Search className="w-10 h-10 opacity-20" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Awaiting scanner execution</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 p-2 bg-brand-glass rounded-2xl border border-brand-border">
                    <button className="flex-1 py-4 bg-brand-accent text-black rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all">
                      Hire Candidate
                    </button>
                    <button className="flex-1 py-4 bg-transparent text-red-400 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500/10 transition-colors">
                      Decline
                    </button>
                  </div>
                </div>
              </div>

              {/* HR Comments Section */}
              <div className="mt-12 p-8 bg-brand-glass border border-brand-border rounded-3xl">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dim mb-6 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-400" /> Professional HR Commentary
                </h4>
                <div className="space-y-4 mb-8">
                  {selected.hrComments?.map((comment, idx) => (
                    <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10 text-xs text-white leading-relaxed italic">
                      "{comment}"
                    </div>
                  ))}
                  {!selected.hrComments?.length && <p className="text-[10px] text-brand-dim italic">No internal logs for this candidate.</p>}
                </div>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="Add internal verification note..."
                    className="flex-1 bg-black/40 border border-brand-border rounded-xl px-4 py-3 outline-none focus:border-brand-accent text-white text-xs"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addComment()}
                  />
                  <button 
                    onClick={addComment}
                    className="px-6 py-3 bg-brand-accent text-black rounded-xl font-bold uppercase tracking-widest text-[10px]"
                  >
                    Post Note
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[600px] border-2 border-dashed border-brand-border rounded-[2.5rem] flex flex-col items-center justify-center text-brand-dim gap-6 bg-brand-glass">
               <Briefcase className="w-16 h-16 opacity-5" />
               <p className="text-[10px] font-black uppercase tracking-[0.3em]">Initialize candidate selection</p>
            </div>
          )}
        </div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {playingVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12"
          >
            <div 
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              onClick={() => setPlayingVideo(null)}
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)] border border-brand-border"
            >
              <button 
                onClick={() => setPlayingVideo(null)}
                className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white hover:bg-brand-accent hover:text-black transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              
              <video 
                src={playingVideo} 
                className="w-full h-full object-contain"
                autoPlay 
                controls
              />
              
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/5">
                  <div className="text-brand-accent text-[10px] font-black uppercase tracking-[0.2em] mb-1">Candidate Profile Stream</div>
                  <div className="text-white font-bold text-lg">{selected?.name}</div>
                  <div className="text-brand-dim text-xs uppercase tracking-widest">{selected?.role}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden PDF Template - BRIGHT MOOD */}
      {selected && (
        <div 
          ref={pdfRef}
          style={{ 
            display: 'none', 
            position: 'absolute', 
            left: '-9999px',
            width: '850px',
            background: '#ffffff',
            color: '#1a1a1a',
            padding: '50px',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          {/* Cover Page Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '50px', borderBottom: '4px solid #00f2ff', paddingBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
              <img 
                src={selected.photoUrl || `https://picsum.photos/seed/${selected.id}/200/200`} 
                style={{ width: '150px', height: '150px', borderRadius: '20px', objectFit: 'cover', border: '1px solid rgba(0,0,0,0.1)' }}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
              <div>
                <h1 style={{ fontSize: '42px', fontWeight: '950', letterSpacing: '-0.03em', margin: 0, color: '#000' }}>{selected.name}</h1>
                <p style={{ color: '#00b8cc', fontWeight: '900', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '4px', margin: '8px 0' }}>{selected.role}</p>
                <p style={{ color: '#666', fontSize: '14px', margin: 0, fontWeight: '500' }}>{selected.email} • {selected.mobile}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <img 
                src="https://i.ibb.co/HL31wDVs/aeroprofessional-limited-logo-removebg-preview.png" 
                style={{ height: '55px', filter: 'invert(1) brightness(0.2)' }}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
              <p style={{ fontSize: '11px', color: '#999', marginTop: '15px', fontWeight: '900', letterSpacing: '2px' }}>AEROPROFESSIONAL PERSONNEL FILE</p>
            </div>
          </div>

          {/* Main Intelligence Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', marginBottom: '50px' }}>
            <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '25px', border: '1px solid #eee' }}>
              <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '3px', color: '#00b8cc', marginBottom: '20px', fontWeight: '900' }}>Vantage CV Career Scan</h3>
              <div style={{ fontSize: '12px', color: '#333', lineHeight: '1.8', whiteSpace: 'pre-wrap', fontWeight: '500' }}>
                {selected.cvAnalysis || "Recruiters Note: Candidate has completed all registration modules. Run neural scan for AI career mapping."}
              </div>
            </div>

            <div style={{ spaceY: '25px' }}>
              <div style={{ background: '#00f2ff', color: 'black', padding: '30px', borderRadius: '25px', boxShadow: '0 15px 40px rgba(0,242,255,0.3)' }}>
                <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(0,0,0,0.5)', marginBottom: '15px', fontWeight: '900' }}>Neural Screening</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <span style={{ fontSize: '56px', fontWeight: '950', letterSpacing: '-3px' }}>{selected.score || '--'}%</span>
                  <div style={{ width: '55px', height: '55px', borderRadius: '50%', background: 'black', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>AI</div>
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.6', fontWeight: '600' }}>{selected.aiSummary || 'Deployment Summary: Pending neural evaluation.'}</p>
              </div>

              <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '20px', border: '1px solid #eee', marginTop: '25px' }}>
                <h3 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: '#00b8cc', marginBottom: '15px', fontWeight: '900' }}>Flight Metrics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  {[
                    { l: 'Physique', v: `${selected.height}cm / ${selected.weight}kg` },
                    { l: 'Airlines', v: selected.lastOperator },
                    { l: 'Base', v: selected.nearestAirport },
                    { l: 'Seniority', v: selected.isSenior ? 'YES' : 'NO' },
                    { l: 'Medical', v: selected.hasEasaMedical ? 'VALID' : 'EXPIRED' }
                  ].map(s => (
                    <div key={s.l}>
                      <div style={{ fontSize: '8px', color: '#999', textTransform: 'uppercase' }}>{s.l}</div>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#000' }}>{s.v || 'N/A'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Visual Evidence Section (Optional/Preview only, PDF generation adds pages manually) */}
          <div style={{ background: '#f8f9fa', padding: '40px', borderRadius: '30px', border: '1px solid #eee', marginTop: '30px' }}>
            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '4px', color: '#00b8cc', marginBottom: '30px', fontWeight: '950', textAlign: 'center' }}>
              Summary Asset Registry
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {selected.docs.slice(0, 4).map(doc => (
                <div key={doc} style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'white', padding: '15px', borderRadius: '15px', border: '1px solid #eee' }}>
                  <div style={{ width: '40px', height: '40px', background: '#00f2ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 style={{ width: '20px', height: '20px', color: 'black' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: '900', color: '#000', margin: 0 }}>{doc.split(': ')[0]}</p>
                    <p style={{ fontSize: '8px', color: '#999', margin: 0 }}>VERIFIED COMPLIANCE</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '60px', paddingTop: '30px', borderTop: '2px solid #eee', fontSize: '10px', color: '#999', textAlign: 'center', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px' }}>
            EVIDENCE INTEGRITY ASSURED BY AEROPROFISSIONAL NEURAL PIPELINE
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      <AnimatePresence>
        {previewAsset && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-8 md:p-24"
          >
            <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setPreviewAsset(null)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full h-full bg-brand-glass border border-brand-border rounded-[3rem] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)]"
            >
              <div className="p-8 border-b border-brand-border flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white">{previewAsset.name.split(': ')[0]}</h3>
                  <p className="text-[10px] text-brand-dim uppercase tracking-[0.3em] mt-1">{previewAsset.name.split(': ')[1]}</p>
                </div>
                <button 
                  onClick={() => setPreviewAsset(null)}
                  className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-brand-accent hover:text-black transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 bg-black/40 flex items-center justify-center p-12 overflow-auto">
                <img 
                  src={previewAsset.url} 
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" 
                  alt="Preview"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-8 border-t border-brand-border bg-black/20 flex justify-center">
                <button 
                  onClick={() => downloadFileAsPdf(previewAsset.url, previewAsset.name.split(': ')[1])}
                  className="px-12 py-4 bg-brand-accent text-black rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-105 transition-all"
                >
                  <Download className="w-4 h-4" /> Download as PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {candidateToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setCandidateToDelete(null)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-brand-card border border-brand-border rounded-[2rem] p-10 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                  <Trash2 className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Purge Candidate Profile?</h3>
              <p className="text-brand-dim text-sm leading-relaxed mb-8">
                You are about to permanently delete <span className="text-white font-bold">{candidateToDelete.name}'s</span> entire dossier and verification history from the AeroProfessional index. This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setCandidateToDelete(null)}
                  className="flex-1 py-4 bg-brand-glass text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => deleteCandidate(candidateToDelete.id)}
                  className="flex-1 py-4 bg-red-500 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:scale-[1.02] transition-all"
                >
                  Confirm Purge
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem('aeroprofessional_candidates');
    if (saved) {
      try {
        // Hydrate from localStorage
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to hydrate candidates:", e);
        return MOCK_CANDIDATES;
      }
    }
    return MOCK_CANDIDATES;
  });

  // Persist candidates to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('aeroprofessional_candidates', JSON.stringify(candidates));
    } catch (e) {
      console.warn("Storage limit exceeded. Large media files (videos) may not persist after refresh.", e);
    }
  }, [candidates]);

  const handleApply = (newCand: Partial<Candidate>) => {
    const candidate: Candidate = {
      ...newCand as any,
      id: (candidates.length + 1).toString(),
      status: 'Pending',
      docs: newCand.docs || []
    };
    setCandidates([candidate, ...candidates]);
    setView('success');
  };

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text selection:bg-brand-accent selection:text-black">
      <Header view={view} setView={setView} />
      
      <main>
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LandingHero onStart={() => setView('apply')} />
            </motion.div>
          )}

          {view === 'apply' && (
            <motion.div 
              key="apply"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ApplicationWizard onComplete={handleApply} />
            </motion.div>
          )}

          {view === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SuccessScreen onReset={() => setView('landing')} />
            </motion.div>
          )}

          {view === 'admin' && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminDashboard candidates={candidates} setCandidates={setCandidates} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-brand-border py-16 px-12 mt-auto bg-black/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-4">
             <img 
               src="https://i.ibb.co/HL31wDVs/aeroprofessional-limited-logo-removebg-preview.png" 
               alt="AeroProfissional" 
               className="h-8 w-auto brightness-75"
               referrerPolicy="no-referrer"
             />
             <span className="font-black uppercase tracking-widest text-brand-accent">AeroProfissional</span>
          </div>
          <div className="flex gap-12 text-[10px] uppercase font-black tracking-widest text-brand-dim">
             <a href="#" className="hover:text-white transition-colors">Privacy Protocol</a>
             <a href="#" className="hover:text-white transition-colors">Candidate Terms</a>
             <span className="text-white/20">System Status: <span className="text-brand-accent">Operational</span></span>
          </div>
          <div className="text-[10px] text-white/10 font-mono">
            &copy; 2026 AEROPROFISSIONAL LTD. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}
