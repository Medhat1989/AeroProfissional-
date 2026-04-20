import { useState, useRef, useEffect, ChangeEvent } from 'react';
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
  Trash2,
  ArrowUpDown,
  Cpu,
  Zap,
  Brain,
  Menu
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { PDFDocument } from 'pdf-lib';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from './lib/firebase';
import { saveCandidates, loadCandidates } from './lib/storage';

// --- Types ---
type ViewState = 'splash' | 'landing' | 'apply' | 'admin' | 'success';

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
  videoAnalysis?: string; // AI generated Video presence analysis
  videoScore?: number; // Score specifically for the video introduction
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

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Detail: ', JSON.stringify(errInfo));
  return errInfo;
}

// --- Components ---

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] bg-brand-bg flex items-center justify-center overflow-hidden">
      {/* Background Atmosphere */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 2 }}
        className="absolute inset-0"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-accent/20 rounded-full blur-[120px]" />
      </motion.div>

      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 bg-brand-accent/40 blur-2xl rounded-full animate-pulse" />
          <img 
            src="https://i.ibb.co/HL31wDVs/aeroprofessional-limited-logo-removebg-preview.png" 
            alt="AeroProfissional" 
            className="h-32 w-auto relative z-10 brightness-125"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <h1 className="text-2xl font-black uppercase tracking-[0.4em] text-white">AeroProfissional</h1>
          <div className="flex items-center gap-3">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-brand-accent" />
            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-accent">Neural Intelligence</span>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-brand-accent" />
          </div>
        </motion.div>

        {/* Loading Progress Bar */}
        <div className="absolute bottom-[-100px] w-64 h-[2px] bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 3.5, ease: "easeInOut" }}
            className="h-full bg-brand-accent shadow-[0_0_15px_rgba(0,242,255,1)]"
          />
        </div>
      </div>
    </div>
  );
};

const Header = ({ view, setView }: { view: ViewState, setView: (v: ViewState) => void }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  if (view === 'splash') return null;

  const menuItems = [
    { label: 'Solutions', action: () => setView('landing') },
    { label: 'Admin Console', action: () => setView('admin'), icon: <LayoutDashboard className="w-4 h-4" /> }
  ];

  const handleAction = (cb: () => void) => {
    cb();
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-black/50 backdrop-blur-md border-b border-brand-border h-20 flex items-center justify-between px-6 md:px-12">
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
        <span className="font-sans font-extrabold text-xl tracking-[0.1em] text-brand-accent uppercase hidden lg:block">AeroProfissional</span>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-12">
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

      {/* Mobile Menu Trigger */}
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="md:hidden w-10 h-10 flex items-center justify-center text-white"
      >
        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-0 right-0 bg-brand-bg/95 backdrop-blur-3xl border-b border-brand-border p-8 flex flex-col gap-8 md:hidden shadow-2xl"
          >
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleAction(item.action)}
                className="text-left text-sm uppercase tracking-widest font-black text-brand-dim hover:text-brand-accent flex items-center gap-4 py-2"
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            <button 
              onClick={() => handleAction(() => setView('apply'))}
              className="bg-brand-accent text-black px-8 py-4 rounded-xl text-xs font-black uppercase tracking-wider shadow-xl flex items-center justify-center gap-3"
            >
              Open Profile
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const LandingHero = ({ onStart, onAdmin }: { onStart: () => void, onAdmin: () => void }) => (
  <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
    {/* Dynamic Background Elements */}
    <div className="absolute top-1/4 -right-20 w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl" />
    <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl" />

    <div className="max-w-6xl w-full mx-auto relative z-10 text-center mb-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-accent mb-6 block">Future of Recruitment</span>
        <h1 className="text-5xl md:text-8xl font-sans font-bold tracking-tight leading-[1.1] mb-8 bg-gradient-to-br from-white to-brand-dim bg-clip-text text-transparent">
          One Platform. <br />
          Dual Gateway.
        </h1>
        <p className="text-lg md:text-xl text-brand-dim max-w-2xl mx-auto mb-16 leading-relaxed">
          The industry's most advanced cabin crew screening infrastructure. 
          Choose your access point beneath the AeroProfissional neural architecture.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Candidate Access */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          whileHover={{ y: -10 }}
          onClick={onStart}
          className="group relative p-10 bg-brand-card border border-brand-border rounded-[2.5rem] cursor-pointer hover:border-brand-accent transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-16 h-16 rounded-2xl bg-brand-accent/10 flex items-center justify-center mb-8 border border-brand-accent/20 shadow-[0_0_30px_rgba(0,242,255,0.1)] group-hover:bg-brand-accent transition-colors">
            <User className="w-8 h-8 text-brand-accent group-hover:text-black transition-colors" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-4">Open Profile</h3>
          <p className="text-brand-dim text-sm leading-relaxed mb-8">
            Begin your journey. 120-second immersive introduction, secure visual asset vault, and real-time verification pipeline.
          </p>
          <div className="flex items-center gap-3 text-brand-accent font-black uppercase tracking-widest text-[10px]">
            Start Application <ArrowRight className="w-4 h-4" />
          </div>
        </motion.div>

        {/* Admin Console Access */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          whileHover={{ y: -10 }}
          onClick={onAdmin}
          className="group relative p-10 bg-brand-card border border-brand-border rounded-[2.5rem] cursor-pointer hover:border-brand-accent transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-16 h-16 rounded-2xl bg-brand-accent/10 flex items-center justify-center mb-8 border border-brand-accent/20 shadow-[0_0_30px_rgba(0,242,255,0.1)] group-hover:bg-brand-accent transition-colors">
            <LayoutDashboard className="w-8 h-8 text-brand-accent group-hover:text-black transition-colors" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-4">Admin Console</h3>
          <p className="text-brand-dim text-sm leading-relaxed mb-8">
            Access the neural pipeline. Monitor applications, execute AI screenings, and export high-fidelity candidate dossiers.
          </p>
          <div className="flex items-center gap-3 text-brand-accent font-black uppercase tracking-widest text-[10px]">
            Enter Dashboard <ArrowRight className="w-4 h-4" />
          </div>
        </motion.div>
      </div>
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
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        }, 
        audio: true 
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play().catch(e => console.error("Video play failed", e));
      }
    } catch (err) {
      console.error("Error accessing camera", err);
    }
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    
    // Detect best supported MIME type for mobile (especially iOS/Safari)
    const types = [
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    let selectedType = '';
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        selectedType = type;
        break;
      }
    }

    const options = selectedType ? { mimeType: selectedType } : {};
    try {
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: selectedType || 'video/mp4' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          const base64 = loadEvent.target?.result as string;
          onComplete(base64);
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorder.start(1000); // Collect data every second for safety
      setRecording(true);
    } catch (err) {
      console.error("MediaRecorder start failed", err);
    }
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

const ApplicationWizard = ({ onComplete, onBack }: { onComplete: (c: Partial<Candidate>) => void, onBack: () => void }) => {
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
  const [videoMethod, setVideoMethod] = useState<'none' | 'record' | 'upload'>('none');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const roles = ["Senior Cabin Crew", "Flight Attendant", "First Class Service Specialist", "Language Specialist (Cabin)", "Ground Support"];
  const rotations = ["14 weeks ON/ 2 weeks Off", "21 Weeks ON / 3Weeks Off"];

  const handleNext = () => setStep(s => s + 1);

  const handleSubmit = () => {
    console.log("Submitting candidate profile...", formData.name);
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
    <div className="max-w-3xl mx-auto py-20 px-6 sm:py-32">
      <div className="mb-12">
        <div className="flex items-center gap-2 md:gap-4 mb-8 md:mb-12">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-1 flex-1 transition-all rounded-full ${step >= i ? 'bg-brand-accent' : 'bg-brand-border'}`} />
          ))}
        </div>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-brand-dim bg-clip-text text-transparent">
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
                  placeholder="Jane Doe"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] uppercase font-black tracking-widest text-brand-dim ml-1">Email Address</label>
                <input 
                  type="email" 
                  className="w-full p-4 bg-brand-glass border border-brand-border focus:border-brand-accent rounded-xl outline-none transition-all text-white"
                  placeholder="jane.doe@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] uppercase font-black tracking-widest text-brand-dim ml-1">Mobile Number</label>
                <input 
                  type="tel" 
                  className="w-full p-4 bg-brand-glass border border-brand-border focus:border-brand-accent rounded-xl outline-none transition-all text-white"
                  placeholder="+44 20 7123 4567"
                  value={formData.mobile}
                  onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] uppercase font-black tracking-widest text-brand-dim ml-1">Height (cm)</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-brand-glass border border-brand-border focus:border-brand-accent rounded-xl outline-none transition-all text-white"
                  placeholder="e.g. 175cm"
                  value={formData.height}
                  onChange={e => setFormData({ ...formData, height: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] uppercase font-black tracking-widest text-brand-dim ml-1">Weight (kg)</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-brand-glass border border-brand-border focus:border-brand-accent rounded-xl outline-none transition-all text-white"
                  placeholder="e.g. 65kg"
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
            <div className="flex gap-4">
              <button 
                onClick={onBack}
                className="flex-1 py-5 border border-brand-border text-brand-dim rounded-lg font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors"
              >
                Back to Portal
              </button>
              <button 
                disabled={!formData.name || !formData.email || !formData.mobile || !formData.role}
                onClick={handleNext}
                className="flex-[2] py-5 bg-brand-accent text-black rounded-lg font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-30 shadow-[0_0_30px_var(--color-brand-accent-glow)] flex items-center justify-center gap-3"
              >
                Experience Details <ChevronRight className="w-5 h-5" />
              </button>
            </div>
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
                  placeholder="e.g. Global Airways"
                  value={formData.lastOperator}
                  onChange={e => setFormData({ ...formData, lastOperator: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] uppercase font-black tracking-widest text-brand-dim ml-1">Nearest Airport to your city</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-brand-glass border border-brand-border focus:border-brand-accent rounded-xl outline-none transition-all text-white"
                  placeholder="e.g. LHR"
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
                    placeholder="e.g. EASA.CC.123456"
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
            <div className="space-y-2">
              <p className="text-brand-dim text-sm">
                Complete your profile with a <span className="text-brand-accent font-bold">2-minute introduction</span>. Share your passion for aviation and why you are the ideal candidate for <span className="text-brand-accent font-bold">{formData.role}</span>.
              </p>
            </div>

            {videoMethod === 'none' && !videoBase64 && (
              <div className="grid md:grid-cols-2 gap-6">
                <motion.div 
                  whileHover={{ y: -5 }}
                  onClick={() => setVideoMethod('record')}
                  className="bg-brand-card border border-brand-border p-8 rounded-[2rem] text-center cursor-pointer group hover:border-brand-accent transition-all"
                >
                  <div className="w-16 h-16 rounded-2xl bg-brand-accent/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-brand-accent transition-colors">
                    <Video className="w-8 h-8 text-brand-accent group-hover:text-black transition-colors" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Record Live</h4>
                  <p className="text-[10px] uppercase font-black tracking-widest text-brand-dim mb-6">Capture introduction via camera</p>
                  <div className="text-[10px] font-black uppercase text-brand-accent opacity-0 group-hover:opacity-100 transition-opacity">Launch Recorder</div>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -5 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-brand-card border border-brand-border p-8 rounded-[2rem] text-center cursor-pointer group hover:border-brand-accent transition-all"
                >
                   <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="video/*"
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        const file = e.target.files[0];
                        // Optional size check for local warning before trying to upload
                        if (file.size > 100 * 1024 * 1024) { // 100MB soft limit for browser stability
                          alert("Video file exceeds 100MB. Please choose a smaller file for better performance.");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (loadEvent) => {
                          const base64 = loadEvent.target?.result as string;
                          setVideoBase64(base64);
                          setVideoMethod('upload');
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6 group-hover:bg-white transition-colors">
                    <Upload className="w-8 h-8 text-brand-dim group-hover:text-black transition-colors" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Upload Video</h4>
                  <p className="text-[10px] uppercase font-black tracking-widest text-brand-dim mb-6">Select asset from device storage</p>
                  <div className="text-[10px] font-black uppercase text-white opacity-0 group-hover:opacity-100 transition-opacity">Browse Files</div>
                </motion.div>
              </div>
            )}

            {(videoMethod === 'record' || (videoMethod === 'none' && !videoBase64)) && videoMethod !== 'upload' && (
              <div className={videoMethod === 'none' ? 'hidden' : ''}>
                <VideoRecorder onComplete={(base64) => setVideoBase64(base64)} />
              </div>
            )}

            {videoBase64 && (videoMethod === 'upload' || (videoMethod === 'record' && videoBase64)) && (
              <div className="space-y-6">
                <div className="relative group rounded-[2.5rem] overflow-hidden border border-brand-border bg-black">
                  <video src={videoBase64} controls className="w-full h-auto max-h-[70vh] object-contain" />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={() => {
                        setVideoBase64(null);
                        setVideoMethod('none');
                      }}
                      className="bg-red-500/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Reset Video
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button 
                onClick={() => {
                  if (videoMethod !== 'none') {
                    setVideoMethod('none');
                    setVideoBase64(null);
                  } else {
                    setStep(2);
                  }
                }} 
                className="flex-1 py-5 border border-brand-border text-brand-dim rounded-lg font-black uppercase tracking-widest hover:text-white transition-colors"
              >
                {videoMethod !== 'none' ? 'Choose Different Method' : 'Back'}
              </button>
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
                onClick={() => setStep(3)} 
                className="flex-1 py-5 border border-brand-border text-brand-dim rounded-lg font-black uppercase tracking-widest hover:text-white transition-colors"
              >
                Back
              </button>
              <button 
                onClick={handleNext}
                className="flex-[2] py-5 bg-brand-accent text-black rounded-lg font-black uppercase tracking-[0.2em] shadow-[0_0_40px_var(--color-brand-accent-glow)] hover:scale-[1.02] transition-all"
              >
                Review Profile
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
              {/* Photo & Identity */}
              <div className="md:col-span-2 flex flex-col md:flex-row items-center gap-8 p-8 bg-brand-glass rounded-[2rem] border border-brand-border">
                <div className="relative">
                  <img 
                    src={formData.photoUrl || `https://picsum.photos/seed/${formData.email}/200/200`} 
                    className="w-32 h-32 rounded-2xl object-cover border-2 border-brand-accent" 
                    alt="Applicant" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center border-4 border-brand-bg">
                    <User className="w-4 h-4 text-black" />
                  </div>
                </div>
                <div className="text-center md:text-left space-y-2">
                   <h3 className="text-3xl font-bold text-white uppercase tracking-tight">{formData.name}</h3>
                   <div className="flex flex-wrap justify-center md:justify-start gap-3">
                     <span className="bg-brand-accent/20 border border-brand-accent/30 px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-brand-accent uppercase">{formData.role}</span>
                     <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-mono text-brand-dim">{formData.email}</span>
                   </div>
                </div>
              </div>

              {/* Identity Details */}
              <div className="space-y-4 p-6 bg-brand-glass rounded-[2rem] border border-brand-border relative">
                <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-brand-accent">Personal Profile</h4>
                  <button onClick={() => setStep(1)} className="text-[10px] uppercase font-bold text-brand-dim hover:text-brand-accent transition-colors">Edit</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[8px] uppercase font-bold text-brand-dim block mb-1">Mobile</label>
                    <p className="text-xs font-bold text-white">{formData.mobile}</p>
                  </div>
                  <div>
                    <label className="text-[8px] uppercase font-bold text-brand-dim block mb-1">Weight</label>
                    <p className="text-xs font-bold text-white">{formData.weight}kg</p>
                  </div>
                  <div>
                    <label className="text-[8px] uppercase font-bold text-brand-dim block mb-1">Height</label>
                    <p className="text-xs font-bold text-white">{formData.height}cm</p>
                  </div>
                </div>
              </div>

              {/* Aviation Details */}
              <div className="space-y-4 p-6 bg-brand-glass rounded-[2rem] border border-brand-border">
                <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-brand-accent">Aviation Logistics</h4>
                  <button onClick={() => setStep(2)} className="text-[10px] uppercase font-bold text-brand-dim hover:text-brand-accent transition-colors">Edit</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[8px] uppercase font-bold text-brand-dim block mb-1">Last Flight</label>
                    <p className="text-xs font-bold text-white">{formData.lastFlightDate}</p>
                  </div>
                  <div>
                    <label className="text-[8px] uppercase font-bold text-brand-dim block mb-1">Operator</label>
                    <p className="text-xs font-bold text-white">{formData.lastOperator}</p>
                  </div>
                  <div>
                    <label className="text-[8px] uppercase font-bold text-brand-dim block mb-1">Base Port</label>
                    <p className="text-xs font-bold text-white">{formData.nearestAirport}</p>
                  </div>
                  <div>
                    <label className="text-[8px] uppercase font-bold text-brand-dim block mb-1">Rotation</label>
                    <p className="text-xs font-bold text-white truncate">{formData.rotation}</p>
                  </div>
                </div>
              </div>

              {/* Asset Playback */}
              <div className="md:col-span-2 space-y-6">
                <div className="p-8 bg-brand-card rounded-[2.5rem] border border-brand-border overflow-hidden relative">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-accent shadow-[0_0_10px_rgba(0,242,255,1)]" />
                      <h4 className="text-xs uppercase font-black tracking-widest text-white">Spotlight Check</h4>
                    </div>
                    <button onClick={() => setStep(3)} className="text-[10px] uppercase font-bold text-brand-dim hover:text-brand-accent transition-colors">Re-Record</button>
                  </div>
                  
                  {videoBase64 ? (
                    <div className="rounded-2xl overflow-hidden border border-brand-border bg-black">
                      <video 
                        src={videoBase64} 
                        controls 
                        className="w-full h-auto max-h-[500px] object-contain"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-white/5 rounded-2xl flex items-center justify-center border border-dashed border-brand-border">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-dim">Neural Stream Missing</p>
                    </div>
                  )}

                  <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-[10px] uppercase font-black tracking-widest text-brand-dim">Document Manifest</h4>
                      <button onClick={() => setStep(4)} className="text-[10px] uppercase font-bold text-brand-dim hover:text-brand-accent transition-colors">Modify Docs</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {formData.docs.map(doc => (
                         <div key={doc} className="px-4 py-2 bg-brand-glass border border-brand-border rounded-xl flex items-center gap-2">
                            <FileText className="w-3 h-3 text-brand-accent" />
                            <span className="text-[9px] font-bold text-brand-dim truncate max-w-[150px]">{doc}</span>
                         </div>
                       ))}
                       {formData.docs.length === 0 && (
                         <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">No Documents Uploaded</p>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-10 border-t border-brand-border">
               <button 
                 onClick={() => setStep(4)}
                 className="flex-1 py-5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/5 transition-all"
               >
                 Back to Docs
               </button>
               <button 
                onClick={handleSubmit}
                className="flex-[2] py-5 bg-brand-accent text-black rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-[0_0_50px_var(--color-brand-accent-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Confirm & Sync Profile (v1.0.9)
              </button>
            </div>
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
    <div className="mt-12">
      <button 
        onClick={onReset}
        className="text-[10px] font-black uppercase tracking-widest text-brand-dim hover:text-white transition-colors"
      >
        Back to Global Hub
      </button>
    </div>
  </div>
);

const AdminDashboard = ({ 
  candidates, 
  setCandidates, 
  onUpdate, 
  onDelete,
  onBack
}: { 
  candidates: Candidate[], 
  setCandidates: any,
  onUpdate: (id: string, updates: Partial<Candidate>) => Promise<void>,
  onDelete: (id: string) => Promise<void>,
  onBack: () => void
}) => {
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [screening, setScreening] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [previewAsset, setPreviewAsset] = useState<{ url: string, name: string } | null>(null);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  const [sortField, setSortField] = useState<'name' | 'appliedAt' | 'score'>('appliedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync selected candidate with real-time updates
  useEffect(() => {
    if (selected) {
      const updated = candidates.find(c => c.id === selected.id);
      if (updated) setSelected(updated);
    }
  }, [candidates]);

  const toggleSort = (field: 'name' | 'appliedAt' | 'score') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc'); // Default to desc for new field
    }
  };

  const filteredAndSortedCandidates = [...candidates]
    .filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nearestAirport?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'score') {
        valA = valA || 0;
        valB = valB || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const handleVideoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      const base64 = loadEvent.target?.result as string;
      await onUpdate(selected.id, { videoUrl: base64 });
    };
    reader.readAsDataURL(file);
  };

  const deleteCandidate = async (id: string) => {
    await onDelete(id);
    if (selected?.id === id) setSelected(null);
    setCandidateToDelete(null);
  };

  const addComment = async () => {
    if (!selected || !newComment.trim()) return;
    const updatedComments = [...(selected.hrComments || []), newComment.trim()];
    await onUpdate(selected.id, { hrComments: updatedComments });
    setNewComment('');
  };

  const downloadAsPdf = async (candidate: Candidate) => {
    const mainJsPDF = new jsPDF('p', 'mm', 'a4');
    const width = mainJsPDF.internal.pageSize.getWidth();
    const height = mainJsPDF.internal.pageSize.getHeight();
    
    // Page 1: Main Dossier Summary
    if (pdfRef.current) {
      const element = pdfRef.current;
      // Ensure the element is visible to html2canvas but not to the user
      const originalDisplay = element.style.display;
      const originalPosition = element.style.position;
      const originalVisibility = element.style.visibility;
      
      element.style.display = 'block';
      element.style.position = 'fixed';
      element.style.visibility = 'visible';
      element.style.zIndex = '-9999';
      
      try {
        const canvas = await html2canvas(element, {
          scale: 3,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });
        const imgData = canvas.toDataURL('image/png');
        const imgProps = mainJsPDF.getImageProperties(imgData);
        const pdfPageWidth = width;
        const pdfPageHeight = (imgProps.height * pdfPageWidth) / imgProps.width;
        
        mainJsPDF.addImage(imgData, 'PNG', 0, 0, pdfPageWidth, pdfPageHeight);
      } catch (error) {
        console.error("Summary page capture failed:", error);
      } finally {
        element.style.display = originalDisplay;
        element.style.position = originalPosition;
        element.style.visibility = originalVisibility;
        element.style.zIndex = 'auto';
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
        
        // Convert pixels to mm assuming 96 DPI for "Actual Size" reference
        const pxToMm = 25.4 / 96;
        let targetWidth = img.width * pxToMm;
        let targetHeight = img.height * pxToMm;

        // Ensure it fits the page (Scale down if larger than available space)
        const scaleDownRatio = Math.min(1, availableWidth / targetWidth, availableHeight / targetHeight);
        targetWidth *= scaleDownRatio;
        targetHeight *= scaleDownRatio;
        
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
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      
      const prompt = `Act as a senior aviation recruiter. Analyze this cabin crew candidate profile (treating the provided experience data as the core CV content) and provide:
        1. A high-level screening summary (max 2 sentences).
        2. A detailed "CV Professional Scan" which identifies key strengths, potential gaps, and suitability for international flight operations (3-4 bullet points).
        3. A "Video Impression Analysis" focusing on perceived presence, passion for aviation, and communication clarity as suggested by their profile and intro recording (max 2 sentences).
        4. A total numerical score out of 100, and a dedicated "Video Score" out of 100.
        
        Candidate Name: ${candidate.name}
        Role: ${candidate.role}
        Physicals: ${candidate.height} / ${candidate.weight}
        Experience: ${candidate.lastOperator} (Last flight: ${candidate.lastFlightDate})
        Nearest Airport: ${candidate.nearestAirport}
        Senior Status: ${candidate.isSenior ? 'Yes' : 'No'}
        EASA Details: ${candidate.hasEasa ? candidate.easaRef : 'N/A'}
        Rotation Preference: ${candidate.rotation}
        Documents Uploaded: ${candidate.docs.join(', ')}
        
        Format your response strictly as a JSON object: { "summary": string, "cvScan": string, "videoImpression": string, "score": number, "videoScore": number }`;

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      const resText = response.text || '{}';
      const cleanJson = resText.replace(/```json|```/g, '').trim();
      const aiResult = JSON.parse(cleanJson);

      await onUpdate(candidate.id, { 
        aiSummary: aiResult.summary, 
        cvAnalysis: aiResult.cvScan, 
        videoAnalysis: aiResult.videoImpression,
        videoScore: aiResult.videoScore,
        score: aiResult.score, 
        status: 'Screened' 
      });
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setScreening(false);
    }
  };

  return (
    <div className="pt-24 md:pt-32 px-6 md:px-12 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 md:mb-16">
        <div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-3 text-white">Console Pipeline</h2>
          <p className="text-brand-dim text-sm">Neural candidate screening & profile verification.</p>
        </div>
        <div className="flex w-full md:w-auto gap-4">
          <div className="flex-1 md:flex-none bg-brand-glass px-6 py-3 rounded-xl flex items-center gap-3 border border-brand-border">
            <Users className="w-5 h-5 text-brand-accent" />
            <span className="font-bold text-white text-sm md:text-base">{candidates.length} <span className="text-brand-dim font-medium uppercase tracking-widest text-[8px] md:text-[10px] ml-2">Total Pool</span></span>
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-3 bg-brand-accent text-black rounded-xl"
          >
            <Users className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 md:gap-12 relative items-start">
        {/* Sidebar List */}
        <div className={`lg:col-span-1 space-y-4 ${sidebarOpen ? 'block' : 'hidden lg:block'} fixed lg:relative inset-0 z-[60] lg:z-auto bg-brand-bg lg:bg-transparent p-6 lg:p-0`}>
          <div className="flex items-center justify-between md:hidden mb-6">
             <h3 className="text-xl font-bold text-white uppercase tracking-widest text-[10px]">Candidate Archive</h3>
             <button onClick={() => setSidebarOpen(false)} className="p-2 bg-white/5 rounded-lg text-white">
                <X className="w-5 h-5" />
             </button>
          </div>
          <div className="space-y-4 mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-dim" />
              <input 
                type="text" 
                placeholder="Query candidate index..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-4 bg-brand-glass rounded-xl outline-none border border-brand-border focus:border-brand-accent transition-all text-white placeholder:text-brand-dim/50"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-dim mr-2 shrink-0">Sort By:</span>
              {[
                { id: 'name', label: 'Name' },
                { id: 'appliedAt', label: 'Date' },
                { id: 'score', label: 'Score' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => toggleSort(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shrink-0 ${sortField === f.id ? 'bg-brand-accent text-black shadow-[0_0_15px_rgba(0,242,255,0.3)]' : 'bg-brand-glass text-brand-dim border border-brand-border hover:border-brand-accent/40'}`}
                >
                  {f.label}
                  {sortField === f.id && (
                    <ArrowUpDown className={`w-2.5 h-2.5 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-brand-accent/20 scrollbar-track-transparent">
            {filteredAndSortedCandidates.length > 0 ? (
              filteredAndSortedCandidates.map(candidate => (
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
                      {candidate.status === 'Pending' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            performAIScreening(candidate);
                          }}
                          disabled={screening}
                          className="p-2 bg-brand-accent/20 hover:bg-brand-accent/40 text-brand-accent rounded-lg transition-all border border-brand-accent/30 group"
                          title="Quick Quick Neural Scan"
                        >
                          <Zap className={`w-3 h-3 ${screening ? 'animate-pulse' : 'group-hover:scale-125 transition-transform'}`} />
                        </button>
                      )}
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
              ))
            ) : (
              <div className="p-12 text-center bg-brand-glass rounded-3xl border border-brand-border border-dashed">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-dim/50">No candidates match iteration</p>
              </div>
            )}
          </div>
          <button 
            onClick={onBack}
            className="w-full mt-8 py-5 bg-brand-glass border border-brand-border text-brand-dim rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-brand-accent hover:border-brand-accent/50 transition-all flex items-center justify-center gap-3"
          >
            Exit to Gateway Portal
          </button>
        </div>

        {/* Main Panel */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-brand-card border border-brand-border rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-3xl">
              <div className="flex flex-col md:flex-row justify-between items-start gap-8 md:gap-12 mb-12 md:mb-16">
                <div className="flex items-center gap-4 md:gap-8">
                  <div className="relative shrink-0">
                    <img 
                      src={selected.photoUrl || `https://picsum.photos/seed/${selected.id}/200/200`} 
                      className="w-16 h-16 md:w-28 md:h-28 rounded-xl md:rounded-2xl object-cover border-2 border-brand-border" 
                      alt="Pfp"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 bg-brand-accent rounded-lg flex items-center justify-center border-2 md:border-4 border-brand-bg">
                      <ShieldCheck className="w-3 h-3 md:w-4 md:h-4 text-black" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-4xl font-bold tracking-tight text-white mb-2 md:mb-3">{selected.name}</h3>
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      <span className="bg-brand-accent/10 border border-brand-accent/20 px-2 md:px-3 py-1 rounded-sm text-[8px] md:text-[10px] uppercase font-black tracking-wider text-brand-accent">{selected.role}</span>
                      <span className="bg-brand-glass px-2 md:px-3 py-1 rounded-sm text-[8px] md:text-[10px] font-mono text-brand-dim lowercase truncate max-w-[120px] md:max-w-none">{selected.email}</span>
                      {selected.status === 'Pending' ? (
                        <span className="bg-orange-400/10 border border-orange-400/20 px-2 md:px-3 py-1 rounded-sm text-[8px] md:text-[10px] uppercase font-black tracking-wider text-orange-400 flex items-center gap-2">
                          <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-orange-400 animate-pulse" />
                          <span className="hidden sm:inline">Neural Scan Required</span>
                          <span className="sm:hidden">Unscanned</span>
                        </span>
                      ) : (
                        <span className="bg-brand-accent/10 border border-brand-accent/20 px-2 md:px-3 py-1 rounded-sm text-[8px] md:text-[10px] uppercase font-black tracking-wider text-brand-accent flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="hidden sm:inline">Verified Profile</span>
                          <span className="sm:hidden">Verified</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full md:w-auto mt-4 md:mt-0">
                  <button 
                    onClick={() => downloadAsPdf(selected)}
                    className="w-full sm:flex-1 md:w-auto px-6 md:px-8 py-4 bg-brand-glass text-white border border-brand-border rounded-sm font-black uppercase tracking-widest text-[9px] md:text-xs flex items-center justify-center gap-3 hover:bg-white/10 transition-all shadow-xl"
                  >
                    <Download className="w-4 h-4 text-brand-accent" />
                    Export Dossier
                  </button>
                  <button 
                    onClick={() => performAIScreening(selected)}
                    disabled={screening}
                    className="w-full sm:flex-1 md:w-auto relative group px-6 md:px-10 py-4 bg-brand-accent text-black rounded-xl font-black uppercase tracking-[0.2em] text-[9px] md:text-[11px] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(0,242,255,0.4)] disabled:opacity-30 disabled:hover:scale-100"
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                    {screening ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                    {screening ? 'Neural Engine Active...' : 'Execute AI Scan'}
                  </button>
                  <button 
                    onClick={() => setCandidateToDelete(selected)}
                    className="hidden md:flex px-4 py-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-sm hover:bg-red-500/20 transition-all items-center justify-center"
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
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dim flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-brand-accent" /> Video Stream Analysis
                      </h4>
                      <button 
                        onClick={() => videoInputRef.current?.click()}
                        className="text-[10px] font-black uppercase tracking-widest text-brand-accent hover:text-white transition-colors flex items-center gap-2"
                      >
                        <Upload className="w-3 h-3" /> Replace Asset
                      </button>
                      <input 
                        type="file" 
                        ref={videoInputRef} 
                        onChange={handleVideoUpload} 
                        accept="video/*" 
                        className="hidden" 
                      />
                    </div>
                    <div 
                      onClick={() => setPlayingVideo(selected.videoUrl || `https://www.w3schools.com/html/mov_bbb.mp4`)} // Default mock video
                      className="bg-black rounded-2xl overflow-hidden shadow-2xl relative group border border-brand-border cursor-pointer hover:border-brand-accent transition-all min-h-[200px] flex items-center justify-center"
                    >
                      {selected.videoUrl ? (
                        <video 
                          src={selected.videoUrl} 
                          className="w-full h-auto max-h-[500px] object-contain opacity-50 transition-all duration-700 group-hover:opacity-80"
                          muted
                        />
                      ) : (
                        <div className="aspect-video w-full">
                          <img 
                            src={`https://picsum.photos/seed/video${selected.id}/800/450`} 
                            className="w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700" 
                            alt="Thumbnail"
                            referrerPolicy="no-referrer"
                          />
                        </div>
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

                        <div className="bg-white/10 p-5 rounded-2xl border border-white/10">
                           <div className="flex justify-between items-center mb-3">
                             <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Neural Video Intelligence</p>
                             <div className="text-[10px] font-black bg-black/20 px-2 py-0.5 rounded text-black">{selected.videoScore || '--'}/100</div>
                           </div>
                           <p className="text-xs font-bold leading-relaxed whitespace-pre-wrap italic opacity-80">"{selected.videoAnalysis || "Pending recording analysis."}"</p>
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
              className="relative w-full max-w-5xl bg-black rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)] border border-brand-border"
            >
              <button 
                onClick={() => setPlayingVideo(null)}
                className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white hover:bg-brand-accent hover:text-black transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              
              <video 
                src={playingVideo} 
                className="w-full h-auto max-h-[85vh] object-contain"
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
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', marginBottom: '40px' }}>
            <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '25px', border: '1px solid #eee' }}>
              <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '3px', color: '#00b8cc', marginBottom: '20px', fontWeight: '900' }}>Vantage CV Career Scan</h3>
              <div style={{ fontSize: '12px', color: '#333', lineHeight: '1.8', whiteSpace: 'pre-wrap', fontWeight: '500' }}>
                {selected.cvAnalysis || "Recruiters Note: Candidate has completed all registration modules. Run neural scan for AI career mapping."}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div style={{ background: '#00f2ff', color: 'black', padding: '30px', borderRadius: '25px', boxShadow: '0 15px 40px rgba(0,242,255,0.3)' }}>
                <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(0,0,0,0.5)', marginBottom: '15px', fontWeight: '900' }}>Overall Neural Suitability</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <span style={{ fontSize: '56px', fontWeight: '950', letterSpacing: '-3px' }}>{selected.score || '--'}%</span>
                  <div style={{ width: '55px', height: '55px', borderRadius: '50%', background: 'black', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>AI</div>
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.6', fontWeight: '600' }}>{selected.aiSummary || 'Deployment Summary: Pending neural evaluation.'}</p>
              </div>

              <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '20px', border: '1px solid #eee' }}>
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

          {/* New Video Intelligence Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', background: 'linear-gradient(to right, #ffffff, #f0fdff)', padding: '35px', borderRadius: '25px', border: '1px solid #e0faff', marginBottom: '40px' }}>
            <div style={{ borderRight: '1px solid #e0faff', paddingRight: '20px' }}>
              <div style={{ fontSize: '10px', fontWeight: '900', color: '#00b8cc', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '15px' }}>Video Presence Score</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                <span style={{ fontSize: '48px', fontWeight: '950', color: '#000' }}>{selected.videoScore || '--'}</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#666' }}>/ 100</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#eee', borderRadius: '10px', marginTop: '15px', overflow: 'hidden' }}>
                <div style={{ width: `${selected.videoScore || 0}%`, height: '100%', background: '#00f2ff' }} />
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#666', marginBottom: '15px', fontWeight: '900' }}>NEURAL VIDEO ANALYSIS REPORT</h3>
              <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#333', fontWeight: '500', margin: 0 }}>
                {selected.videoAnalysis || "Digital session not yet decoded. Run neural scanner to analyze candidate introduction and communication clarity."}
              </p>
            </div>
          </div>

          {/* Visual Evidence Section (Optimized for High Quality Dossier) */}
          <div style={{ background: '#f8f9fa', padding: '40px', borderRadius: '30px', border: '1px solid #eee', marginTop: '30px' }}>
            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '4px', color: '#00b8cc', marginBottom: '30px', fontWeight: '950', textAlign: 'center' }}>
              Summary Evidence Registry
            </h3>
            
            {/* High-Impact Visual Block for Primary Identification */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', marginBottom: '35px' }}>
              {[
                { label: 'Recent Photograph', id: 'photo', keywords: ['photograph', 'headshot'] },
                { label: 'Full-Body Photograph', id: 'fullbody', keywords: ['full-body', 'fullbody'] },
                { label: 'Copy of Passport', id: 'passport', keywords: ['passport', 'scan'] }
              ].map(item => {
                const docKey = selected.docs.find(d => 
                  d.toLowerCase().includes(item.label.toLowerCase()) ||
                  d.toLowerCase().includes(item.id) || 
                  item.keywords.some(k => d.toLowerCase().includes(k))
                );
                const url = docKey ? selected.docUrls?.[docKey] : null;
                const isPdf = url?.startsWith('data:application/pdf');

                return (
                  <div key={item.id} style={{ position: 'relative', background: '#fff', borderRadius: '20px', overflow: 'hidden', border: '1px solid #eee', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                    {url && (
                      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 5, background: '#00f2ff', padding: '4px 8px', borderRadius: '6px', fontSize: '6px', fontWeight: '950', color: 'black', textTransform: 'uppercase' }}>
                        Neural Verified
                      </div>
                    )}
                    <div style={{ height: '140px', background: '#f8fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '10px' }}>
                      {url && !isPdf ? (
                        <img 
                          src={url} 
                          style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: '4px' }}
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div style={{ textAlign: 'center', color: '#999' }}>
                          {isPdf ? <FileText style={{ width: '30px', height: '30px', opacity: 0.3, margin: '0 auto' }} /> : <Search style={{ width: '30px', height: '30px', opacity: 0.3, margin: '0 auto' }} />}
                          <p style={{ fontSize: '8px', fontWeight: '900', marginTop: '10px' }}>{isPdf ? 'SECURE PDF' : 'PENDING'}</p>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '12px', borderTop: '1px solid #eee', textAlign: 'center', background: '#fafbfc' }}>
                      <p style={{ fontSize: '9px', fontWeight: '900', color: '#000', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>{item.label}</p>
                      <p style={{ fontSize: '7px', color: url ? '#00b8cc' : '#999', margin: '2px 0 0', fontWeight: '900', letterSpacing: '1.5px' }}>{url ? 'ASSET VERIFIED' : 'AWAITING UPLOAD'}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Supplementary Documentation List */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {selected.docs
                .filter(d => !['Recent Photograph', 'Full-Body Photograph', 'Copy of Passport'].some(p => d.startsWith(p)))
                .map(doc => (
                <div key={doc} style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'white', padding: '15px', borderRadius: '15px', border: '1px solid #eee' }}>
                  <div style={{ width: '35px', height: '35px', background: '#00f2ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 style={{ width: '18px', height: '18px', color: 'black' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '9px', fontWeight: '900', color: '#000', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.split(': ')[0]}</p>
                    <p style={{ fontSize: '7px', color: '#999', margin: 0, fontWeight: '900' }}>COMPLIANT ARCHIVE</p>
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
  const [version] = useState('1.0.8-sync-fixed');
  const [view, setView] = useState<ViewState>('splash');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    console.log(`AeroProfissional Engine Initialized: v${version}`);
  }, []);

  // Real-time Firestore Sync
  useEffect(() => {
    const q = query(collection(db, 'candidates'), orderBy('appliedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cands = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Candidate[];
      setCandidates(cands);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'candidates');
    });
    return () => unsubscribe();
  }, []);

  const handleApply = async (newCand: Partial<Candidate>) => {
    console.log("handleApply transition initialized: [TARGET]", newCand.name);
    try {
      setIsUploading(true);
      let finalVideoUrl = newCand.videoUrl;

      // If we have a base64 video, convert to blob and upload to Storage
      if (newCand.videoUrl && newCand.videoUrl.startsWith('data:video')) {
        console.log("Stage 1: Binary conversion from base64 data stream...");
        const response = await fetch(newCand.videoUrl);
        const blob = await response.blob();
        
        console.log(`Stage 2: Cloud sync initiated. Payload size: ${(blob.size / (1024 * 1024)).toFixed(2)} MB`);
        const storageRef = ref(storage, `videos/${Date.now()}_${Math.random().toString(36).substring(7)}.webm`);
        const snapshot = await uploadBytes(storageRef, blob);
        finalVideoUrl = await getDownloadURL(snapshot.ref);
        console.log("Stage 3: Synchronization complete. Asset URL persistent.");
      }

      const candidateData = {
        ...newCand,
        videoUrl: finalVideoUrl,
        status: 'Pending',
        appliedAt: new Intl.DateTimeFormat('en-CA').format(new Date()),
        createdAt: serverTimestamp(),
        docs: newCand.docs || [],
        hrComments: []
      };
      
      console.log("Stage 4: Firestore record persistence...");
      const docRef = await addDoc(collection(db, 'candidates'), candidateData);
      console.log("Persistence success. Record identified as:", docRef.id);
      setView('success');
    } catch (error) {
      console.error("Critical System Interruption:", error);
      const errInfo = handleFirestoreError(error, OperationType.WRITE, 'candidates');
      alert(`System Transmission Protocol Failed: ${errInfo.error}. Please ensure high-bandwidth connectivity and retry.`);
    } finally {
      setIsUploading(false);
    }
  };

  const updateCandidate = async (id: string, updates: Partial<Candidate>) => {
    try {
      const candRef = doc(db, 'candidates', id);
      await updateDoc(candRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `candidates/${id}`);
    }
  };

  const deleteCandidate = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'candidates', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `candidates/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text selection:bg-brand-accent selection:text-black flex flex-col">
      {/* Global Loading Overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-brand-accent border-t-transparent rounded-full mb-8 shadow-[0_0_30px_rgba(0,242,255,0.4)]"
          />
          <h2 className="text-xl font-black uppercase tracking-[0.3em] text-white mb-2">Syncing Assets</h2>
          <p className="text-[10px] uppercase font-black tracking-widest text-brand-dim">Transmitting introduction data to AeroProfissional Index</p>
        </div>
      )}

      <Header view={view} setView={setView} />
      
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {view === 'splash' && (
            <motion.div 
              key="splash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SplashScreen onComplete={() => setView('landing')} />
            </motion.div>
          )}

          {view === 'landing' && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LandingHero onStart={() => setView('apply')} onAdmin={() => setView('admin')} />
            </motion.div>
          )}

          {view === 'apply' && (
            <motion.div 
              key="apply"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ApplicationWizard onComplete={handleApply} onBack={() => setView('landing')} />
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
              <AdminDashboard 
                candidates={candidates} 
                setCandidates={setCandidates} 
                onUpdate={updateCandidate}
                onDelete={deleteCandidate}
                onBack={() => setView('landing')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-brand-border py-12 md:py-16 px-6 md:px-12 mt-auto bg-black/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10 md:gap-12">
          <div className="flex items-center gap-4">
             <img 
               src="https://i.ibb.co/HL31wDVs/aeroprofessional-limited-logo-removebg-preview.png" 
               alt="AeroProfissional" 
               className="h-6 md:h-8 w-auto brightness-75"
               referrerPolicy="no-referrer"
             />
             <span className="font-black uppercase tracking-widest text-brand-accent text-[10px] md:text-xs">AeroProfissional</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-[8px] md:text-[10px] uppercase font-black tracking-widest text-brand-dim">
             <a href="#" className="hover:text-white transition-colors">Privacy Protocol</a>
             <a href="#" className="hover:text-white transition-colors">Candidate Terms</a>
             <span className="text-white/20">System Status: <span className="text-brand-accent">Operational</span></span>
          </div>
          <div className="text-[8px] md:text-[10px] text-white/10 font-mono text-center">
            &copy; 2026 AEROPROFISSIONAL LTD. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}
