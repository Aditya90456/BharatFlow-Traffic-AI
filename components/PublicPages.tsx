import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GlobeAltIcon, ArrowRightIcon, CpuChipIcon, BoltIcon, ServerIcon, CodeBracketIcon, MapIcon, TableCellsIcon, SparklesIcon, ShieldCheckIcon, ClockIcon, CameraIcon, ChatBubbleLeftRightIcon, ExclamationTriangleIcon, StopCircleIcon, MicrophoneIcon, ChevronUpDownIcon, LightBulbIcon, ServerStackIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { SimulationCanvas } from './SimulationCanvas';
import { Car, Incident, Intersection, JunctionAnalysisResult, LightState, Road, TrafficStats } from '../types';
import { analyzeJunction } from '../services/geminiService';
import { CITY_CONFIGS, INITIAL_GREEN_DURATION, GRID_SIZE } from '../constants';


// Shared Layout for Public Pages
interface PublicLayoutProps {
  children: React.ReactNode;
  title: string;
  activePage: string;
  onNavigate: (page: string) => void;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children, title, activePage, onNavigate }) => {
  const navItems = [
    { id: 'LANDING', label: 'Home' },
    { id: 'FEATURES', label: 'Capabilities' },
    { id: 'AI_FEATURES', label: 'AI Core' },
    { id: 'JUNCTIONS_AI', label: 'Junctions AI' },
    { id: 'ML_DESIGN', label: 'ML Design' },
    { id: 'REALTIME_AI', label: 'Live AI' },
    { id: 'PUBLIC_MAP', label: 'Live Grid' },
    { id: 'PUBLIC_DATA', label: 'Data' },
    { id: 'API_DOCS', label: 'API' },
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-white font-sans selection:bg-accent selection:text-black flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-white/5 bg-[#050508]/90">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 group cursor-pointer" 
            onClick={() => onNavigate('LANDING')}
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-saffron to-red-600 flex items-center justify-center shadow-lg shadow-saffron/20">
              <GlobeAltIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-tech font-bold tracking-widest leading-none">
                BHARAT<span className="text-saffron">FLOW</span>
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navItems.slice(1).map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`text-sm font-medium transition-colors relative group ${activePage === item.id ? 'text-accent' : 'text-gray-400 hover:text-white'}`}
              >
                {item.label}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-accent transition-all ${activePage === item.id ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('DASHBOARD')}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-accent/50 transition-all text-sm font-bold"
            >
              <span>Access Grid</span>
              <ArrowRightIcon className="w-4 h-4 text-accent" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <div className="pt-32 pb-12 px-6 border-b border-white/5 relative overflow-hidden">
         <div className="absolute inset-0 bg-mesh opacity-30"></div>
         <div className="max-w-7xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-mono tracking-wider mb-4">
               <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
               PUBLIC ACCESS TERMINAL
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-tech text-white uppercase tracking-wide">
              {title}
            </h1>
         </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/50 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600 font-mono">
           <div>© 2024 BharatFlow AI Systems. Government of India Smart City Initiative.</div>
           <div className="flex gap-6">
             <button className="hover:text-white transition-colors">Privacy</button>
             <button className="hover:text-white transition-colors">Terms</button>
             <button className="hover:text-white transition-colors">Contact</button>
           </div>
        </div>
      </footer>
    </div>
  );
};

// --- PAGES ---

export const FeaturesPage: React.FC<{onNavigate: (p: string) => void}> = ({ onNavigate }) => (
  <PublicLayout title="System Capabilities" activePage="FEATURES" onNavigate={onNavigate}>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { icon: CpuChipIcon, title: "Gemini 2.5 Neural Core", desc: "Advanced LLM processing for real-time traffic pattern recognition and signal optimization." },
        { icon: MapIcon, title: "High-Fidelity Physics Engine", desc: "A detailed digital twin of city traffic, simulating vehicle dynamics and driver behavior for accurate predictions." },
        { icon: BoltIcon, title: "Instant Optimization", desc: "Receive AI-generated signal timing adjustments and apply them to the grid with a single click." },
        { icon: ServerIcon, title: "Government Grade Security", desc: "AES-256 encrypted channels ensuring secure command and control over traffic infrastructure." },
        { icon: TableCellsIcon, title: "Predictive Analytics", desc: "Historical data modeling to predict congestion spikes during festivals and rush hours." },
        { icon: GlobeAltIcon, title: "Pan-India Coverage", desc: "Scalable architecture supporting 30+ major cities from Tier-1 metros to tourist hubs." }
      ].map((feat, idx) => (
        <div key={idx} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-accent/50 transition-all group">
           <feat.icon className="w-10 h-10 text-gray-500 group-hover:text-accent transition-colors mb-4" />
           <h3 className="text-xl font-bold text-white mb-2">{feat.title}</h3>
           <p className="text-sm text-gray-400 leading-relaxed">{feat.desc}</p>
        </div>
      ))}
    </div>
  </PublicLayout>
);

export const AiFeaturesPage: React.FC<{onNavigate: (p: string) => void}> = ({ onNavigate }) => (
  <PublicLayout title="AI Core Intelligence" activePage="AI_FEATURES" onNavigate={onNavigate}>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { 
          icon: SparklesIcon, 
          title: "Dynamic Signal Optimization", 
          desc: "Gemini analyzes real-time vehicle queues and flow rates to dynamically adjust traffic signal timings, preventing gridlock before it starts." 
        },
        { 
          icon: ShieldCheckIcon, 
          title: "Emergency Vehicle Preemption", 
          desc: "The system automatically detects police units on 'RESPONSE' missions, creating 'green waves' by preemptively clearing their path through intersections." 
        },
        { 
          icon: ClockIcon, 
          title: "Predictive Congestion Modeling", 
          desc: "By learning from historical traffic data, the AI anticipates congestion hotspots during peak hours or events, allowing for proactive traffic management." 
        },
        { 
          icon: CameraIcon, 
          title: "Computer Vision Analysis", 
          desc: "Integrates with live camera feeds to identify vehicle types, density, and non-standard events, providing richer data for AI decision-making." 
        },
        { 
          icon: ChatBubbleLeftRightIcon,
          title: "Natural Language Directives", 
          desc: "Translates complex grid data into concise, human-readable status reports and actionable suggestions for command center operators." 
        },
        { 
          icon: ExclamationTriangleIcon,
          title: "Incident Response Intelligence", 
          desc: "When a breakdown occurs, Gemini provides a tactical assessment of its impact on traffic flow and recommends optimal rerouting strategies for nearby units." 
        }
      ].map((feat, idx) => (
        <div key={idx} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-accent/50 transition-all group">
           <feat.icon className="w-10 h-10 text-gray-500 group-hover:text-accent transition-colors mb-4" />
           <h3 className="text-xl font-bold text-white mb-2">{feat.title}</h3>
           <p className="text-sm text-gray-400 leading-relaxed">{feat.desc}</p>
        </div>
      ))}
    </div>
  </PublicLayout>
);


const CITY_NODES = [
  { id: 'DEL', name: 'Delhi', x: 450, y: 150 },
  { id: 'MUM', name: 'Mumbai', x: 250, y: 350 },
  { id: 'KOL', name: 'Kolkata', x: 800, y: 280 },
  { id: 'CHE', name: 'Chennai', x: 600, y: 500 },
  { id: 'BLR', name: 'Bangalore', x: 480, y: 520 },
  { id: 'HYD', name: 'Hyderabad', x: 520, y: 420 },
  { id: 'JAI', name: 'Jaipur', x: 350, y: 200 },
  { id: 'NAG', name: 'Nagpur', x: 550, y: 320 },
];

const INITIAL_ROUTES = [
  { id: 'D-J', from: 'DEL', to: 'JAI', congestion: 50 },
  { id: 'D-N', from: 'DEL', to: 'NAG', congestion: 50 },
  { id: 'J-M', from: 'JAI', to: 'MUM', congestion: 50 },
  { id: 'M-N', from: 'MUM', to: 'NAG', congestion: 50 },
  { id: 'N-H', from: 'NAG', to: 'HYD', congestion: 50 },
  { id: 'N-K', from: 'NAG', to: 'KOL', congestion: 50 },
  { id: 'H-B', from: 'HYD', to: 'BLR', congestion: 50 },
  { id: 'B-C', from: 'BLR', to: 'CHE', congestion: 50 },
  { id: 'H-C', from: 'HYD', to: 'CHE', congestion: 50 },
  { id: 'K-C', from: 'KOL', to: 'CHE', congestion: 50 },
];

const getCongestionStyle = (level: number) => {
  if (level > 70) return { color: '#EF4444', thickness: 4, animationDuration: 5 }; // Red, thick, slow
  if (level > 40) return { color: '#F59E0B', thickness: 3, animationDuration: 3 }; // Yellow, medium, medium
  return { color: '#10B981', thickness: 2.5, animationDuration: 1.5 }; // Green, thin, fast
};

export const LiveMapPage: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => {
  const [routes, setRoutes] = useState(INITIAL_ROUTES);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRoutes(prevRoutes =>
        prevRoutes.map(route => ({
          ...route,
          congestion: Math.max(5, Math.min(95, route.congestion + (Math.random() - 0.5) * 20)),
        }))
      );
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <PublicLayout title="Live National Grid" activePage="PUBLIC_MAP" onNavigate={onNavigate}>
      <style>{`
        @keyframes move-flow {
            to { stroke-dashoffset: -20; }
        }
      `}</style>
      <div className="relative w-full aspect-video bg-[#0A0B10] rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center group">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #333 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

        <svg viewBox="0 0 1000 600" className="absolute inset-0 w-full h-full">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Background routes */}
           {routes.map(route => {
            const fromCity = CITY_NODES.find(c => c.id === route.from);
            const toCity = CITY_NODES.find(c => c.id === route.to);
            if (!fromCity || !toCity) return null;

            return (
              <line
                key={`${route.id}-bg`}
                x1={fromCity.x}
                y1={fromCity.y}
                x2={toCity.x}
                y2={toCity.y}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="8"
              />
            );
          })}
          
          {/* Active Animated Routes */}
          {routes.map(route => {
            const fromCity = CITY_NODES.find(c => c.id === route.from);
            const toCity = CITY_NODES.find(c => c.id === route.to);
            if (!fromCity || !toCity) return null;

            const { color, thickness, animationDuration } = getCongestionStyle(route.congestion);

            return (
              <line
                key={route.id}
                x1={fromCity.x}
                y1={fromCity.y}
                x2={toCity.x}
                y2={toCity.y}
                stroke={color}
                strokeWidth={thickness}
                strokeLinecap="round"
                strokeDasharray="1 19"
                className="transition-all duration-1000 ease-in-out"
                style={{
                  animation: `move-flow ${animationDuration}s linear infinite`,
                }}
                filter="url(#glow)"
              />
            );
          })}

          {/* Cities */}
          {CITY_NODES.map(city => (
            <g key={city.id} className="cursor-pointer group">
              <circle cx={city.x} cy={city.y} r="12" fill="#0A0B10" className="transition-all group-hover:fill-accent/20" />
              <circle cx={city.x} cy={city.y} r="6" fill="#06B6D4" className="transition-all group-hover:r-8 group-hover:opacity-50" />
              <circle cx={city.x} cy={city.y} r="8" fill="transparent" stroke="#06B6D4" strokeWidth="2" />
              <text
                x={city.x}
                y={city.y + 28}
                textAnchor="middle"
                fill="rgba(255, 255, 255, 0.7)"
                className="font-mono text-[12px] uppercase tracking-wider transition-all group-hover:fill-white"
              >
                {city.name}
              </text>
            </g>
          ))}
        </svg>

        <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-black to-transparent flex justify-between items-end z-10">
          <div>
            <div className="text-2xl font-tech font-bold text-white">45,000+</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Simulated Daily Vehicles</div>
          </div>
          <button onClick={() => onNavigate('DASHBOARD')} className="px-6 py-2 bg-accent text-black font-bold rounded hover:bg-white transition-colors">
            Launch Simulation
          </button>
        </div>
        
         <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-sm p-2 rounded border border-white/10">
            <div className="text-xs font-mono uppercase text-gray-400 mb-2">Congestion Legend</div>
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#10B981]"></div><span className="text-xs text-gray-300">Low</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#F59E0B]"></div><span className="text-xs text-gray-300">Medium</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#EF4444]"></div><span className="text-xs text-gray-300">High</span></div>
            </div>
        </div>

      </div>
    </PublicLayout>
  );
};


export const PublicDataPage: React.FC<{onNavigate: (p: string) => void}> = ({ onNavigate }) => (
  <PublicLayout title="Open Data Portal" activePage="PUBLIC_DATA" onNavigate={onNavigate}>
    <div className="space-y-6">
       <div className="glass p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TableCellsIcon className="w-5 h-5 text-saffron" />
            <span>Monthly Congestion Reports</span>
          </h3>
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-gray-400">
                <thead className="text-xs uppercase bg-white/5 text-gray-300">
                   <tr>
                      <th className="p-3">Region</th>
                      <th className="p-3">Avg Speed (km/h)</th>
                      <th className="p-3">Congestion Idx</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                   {[
                     { r: 'Bangalore (Silk Board)', s: '12.4', c: 'High', st: 'Improving' },
                     { r: 'Mumbai (Andheri)', s: '18.2', c: 'Moderate', st: 'Stable' },
                     { r: 'Delhi (CP)', s: '24.5', c: 'Low', st: 'Optimal' },
                     { r: 'Hyderabad (Hitech)', s: '21.0', c: 'Moderate', st: 'Stable' },
                   ].map((row, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                         <td className="p-3 font-bold text-white">{row.r}</td>
                         <td className="p-3 font-mono">{row.s}</td>
                         <td className={`p-3 ${row.c === 'High' ? 'text-red-400' : row.c === 'Moderate' ? 'text-yellow-400' : 'text-green-400'}`}>{row.c}</td>
                         <td className="p-3">{row.st}</td>
                         <td className="p-3"><button className="text-accent hover:underline">Download CSV</button></td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  </PublicLayout>
);

export const ApiDocsPage: React.FC<{onNavigate: (p: string) => void}> = ({ onNavigate }) => (
  <PublicLayout title="Developer API" activePage="API_DOCS" onNavigate={onNavigate}>
    <div className="grid lg:grid-cols-3 gap-8">
       <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6 rounded-xl border border-white/10">
             <h3 className="text-lg font-bold text-white mb-2">Endpoint: Get Junction Status</h3>
             <p className="text-sm text-gray-400 mb-4">Retrieve real-time telemetry for a specific intersection node.</p>
             
             <div className="bg-black p-4 rounded-lg font-mono text-xs text-gray-300 border border-white/10 overflow-x-auto">
                <div className="flex gap-2 mb-2">
                   <span className="text-purple-400">GET</span>
                   <span className="text-green-400">https://api.bharatflow.gov.in/v1/junction/{'{id}'}</span>
                </div>
                <pre className="text-gray-500">
{`// Response
{
  "id": "INT-BANG-04",
  "status": "ONLINE",
  "congestion_level": 78.5,
  "incident_active": false
}`}
                </pre>
             </div>
          </div>
       </div>

       <div className="space-y-4">
          <div className="p-6 rounded-xl bg-accent/5 border border-accent/20">
             <CodeBracketIcon className="w-8 h-8 text-accent mb-3" />
             <h4 className="font-bold text-white">Request API Access</h4>
             <p className="text-xs text-gray-400 mt-2 mb-4">
                Access to the BharatFlow API is restricted to authorized municipal partners and research institutions.
             </p>
             <button onClick={() => onNavigate('DASHBOARD')} className="w-full py-2 bg-accent text-black font-bold text-sm rounded hover:bg-white transition-colors">
                Launch Console
             </button>
          </div>
       </div>
    </div>
  </PublicLayout>
);

// --- REAL-TIME AI PAGE ---

// Audio utility functions
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const Visualizer: React.FC<{ status: string }> = ({ status }) => {
    const isActive = status === 'LISTENING' || status === 'SPEAKING';
    return (
        <div className="flex items-center justify-center gap-1 h-12 w-full max-w-sm mx-auto">
            {Array.from({ length: 25 }).map((_, i) => (
                <div
                    key={i}
                    className="w-1 bg-accent/50 rounded-full transition-all duration-300"
                    style={{
                        height: isActive ? `${Math.sin((i / 25) * Math.PI) * 80 + (Math.random() * 20)}%` : '10%',
                        animation: isActive ? `wave 1.5s ease-in-out ${i * 0.05}s infinite alternate` : 'none',
                    }}
                />
            ))}
            <style>{`
                @keyframes wave {
                    from { transform: scaleY(0.2); opacity: 0.5; }
                    to { transform: scaleY(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};


export const RealtimeAiPage: React.FC<{onNavigate: (p: string) => void}> = ({ onNavigate }) => {
    const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'LISTENING' | 'SPEAKING' | 'ERROR'>('IDLE');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [currentInput, setCurrentInput] = useState('');
    const [currentOutput, setCurrentOutput] = useState('');
    const [history, setHistory] = useState<{ userInput: string; modelOutput: string }[]>([]);

    const aiRef = useRef<GoogleGenAI | null>(null);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, currentInput, currentOutput]);

    const stopSession = useCallback(async () => {
        setStatus('IDLE');
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) { console.error("Error closing session:", e); }
        }
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaSourceRef.current) mediaSourceRef.current.disconnect();

        if (inputAudioContextRef.current?.state !== 'closed') await inputAudioContextRef.current?.close();
        if (outputAudioContextRef.current?.state !== 'closed') await outputAudioContextRef.current?.close();

        sessionPromiseRef.current = null;
    }, []);

    useEffect(() => {
        return () => { stopSession(); };
    }, [stopSession]);

    const startSession = async () => {
        setStatus('CONNECTING');
        setErrorMessage(null);

        if (!aiRef.current) {
            try {
                aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
            } catch (e) {
                setErrorMessage("Failed to initialize AI. Check API Key.");
                setStatus('ERROR');
                return;
            }
        }

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
            setErrorMessage("Microphone access is required. Please grant permission.");
            setStatus('ERROR');
            return;
        }

        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        nextStartTimeRef.current = 0;

        sessionPromiseRef.current = aiRef.current.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                systemInstruction: 'You are an AI assistant for the BharatFlow traffic control center. Respond to voice commands concisely and professionally. Keep responses brief.',
                inputAudioTranscription: {},
                outputAudioTranscription: {},
            },
            callbacks: {
                onopen: () => {
                    setStatus('LISTENING');
                    mediaSourceRef.current = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current!);
                    scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        sessionPromiseRef.current?.then((session) => {
                            session.sendRealtimeInput({ media: createBlob(inputData) });
                        });
                    };
                    mediaSourceRef.current.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.inputTranscription) setCurrentInput(prev => prev + message.serverContent.inputTranscription.text);
                    if (message.serverContent?.outputTranscription) {
                        setCurrentOutput(prev => prev + message.serverContent.outputTranscription.text);
                        if (status !== 'SPEAKING') setStatus('SPEAKING');
                    }
                    if (message.serverContent?.turnComplete) {
                        const finalInput = currentInput + (message.serverContent?.inputTranscription?.text || '');
                        const finalOutput = currentOutput + (message.serverContent?.outputTranscription?.text || '');
                        if (finalInput.trim() && finalOutput.trim()) {
                            setHistory(prev => [...prev, { userInput: finalInput, modelOutput: finalOutput }]);
                        }
                        setCurrentInput('');
                        setCurrentOutput('');
                        setStatus('LISTENING');
                    }
                    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioData) {
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current!.currentTime);
                        const audioBuffer = await decodeAudioData(decode(audioData), outputAudioContextRef.current!, 24000, 1);
                        const source = outputAudioContextRef.current!.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputAudioContextRef.current!.destination);
                        source.addEventListener('ended', () => sourcesRef.current.delete(source));
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        sourcesRef.current.add(source);
                    }
                },
                onerror: (e) => {
                    setErrorMessage("A session error occurred. Please restart.");
                    setStatus('ERROR');
                    stopSession();
                },
                onclose: () => {
                    if (status !== 'IDLE' && status !== 'ERROR') stopSession();
                },
            },
        });
    };

    return (
      <PublicLayout title="Real-Time AI Assistant" activePage="REALTIME_AI" onNavigate={onNavigate}>
        <div className="bg-surface/50 border border-white/10 rounded-2xl p-6 flex flex-col max-w-3xl mx-auto w-full min-h-[60vh]">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className={`relative w-3 h-3 rounded-full ${status === 'LISTENING' || status === 'SPEAKING' ? 'bg-green-500' : 'bg-gray-600'}`}>
                {(status === 'LISTENING' || status === 'SPEAKING') && <div className="absolute inset-0 bg-green-400 rounded-full animate-ping"></div>}
              </div>
              <span className="font-mono text-sm text-gray-300 uppercase">{status}</span>
            </div>
            <button
                onClick={status === 'IDLE' || status === 'ERROR' ? startSession : stopSession}
                className="px-6 py-3 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors bg-primary hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed"
                disabled={status === 'CONNECTING'}
            >
                {status === 'IDLE' || status === 'ERROR' ? <><MicrophoneIcon className="w-5 h-5" /> Start Conversation</> : <><StopCircleIcon className="w-5 h-5" /> Stop Conversation</>}
            </button>
          </div>
          {errorMessage && <div className="mt-4 p-3 text-center bg-red-500/10 text-red-400 rounded-lg text-sm">{errorMessage}</div>}
          
          <Visualizer status={status} />

          <div className="flex-1 flex flex-col min-h-0 bg-background/50 rounded-lg p-4 overflow-y-auto mt-4">
              <div className="space-y-6 font-mono text-base">
                  {history.map((turn, index) => (
                      <div key={index} className="space-y-2">
                          <p className="text-gray-400"><span className="text-accent font-bold">YOU:</span> {turn.userInput}</p>
                          <p className="text-white"><span className="text-saffron font-bold">AI:</span> {turn.modelOutput}</p>
                      </div>
                  ))}
                  {currentInput && <p className="text-gray-500 italic"><span className="text-accent font-bold">YOU:</span> {currentInput}</p>}
                  {currentOutput && <p className="text-gray-200 italic"><span className="text-saffron font-bold">AI:</span> {currentOutput}</p>}
                  <div ref={transcriptEndRef} />
              </div>
          </div>
          <div className="text-center text-xs text-gray-600 font-mono pt-4">
              {status === 'LISTENING' ? 'Speak into your microphone...' : 'Press "Start Conversation" to activate the AI assistant.'}
          </div>
        </div>
      </PublicLayout>
    );
};

// --- JUNCTIONS AI PAGE ---

const generateSimIntersections = (cityNames: string[]): Intersection[] => {
  const arr: Intersection[] = [];
  let nameIdx = 0;
  for(let x=0; x<GRID_SIZE; x++) {
    for(let y=0; y<GRID_SIZE; y++) {
      arr.push({
        id: `INT-${x}-${y}`,
        label: cityNames[nameIdx++] || `Sector ${x}-${y}`,
        x,
        y,
        lightState: { ns: LightState.GREEN, ew: LightState.RED },
        timer: INITIAL_GREEN_DURATION,
        greenDuration: INITIAL_GREEN_DURATION,
        overrideState: null,
      });
    }
  }
  return arr;
};

export const JunctionsAiPage: React.FC<{onNavigate: (p: string) => void}> = ({ onNavigate }) => {
    const [intersections, setIntersections] = useState<Intersection[]>(() => generateSimIntersections(CITY_CONFIGS["Bangalore"]));
    const [cars, setCars] = useState<Car[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [queueLengthMap, setQueueLengthMap] = useState<Record<string, number>>({});
    const [selectedJunctionId, setSelectedJunctionId] = useState(intersections[0].id);
    
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<JunctionAnalysisResult | null>(null);

    const updateStats = useCallback((totalCars: number, avgSpeed: number, queueMap: Record<string, number>) => {
      setQueueLengthMap(queueMap);
    }, []);

    const selectedJunction = useMemo(() => {
        return intersections.find(i => i.id === selectedJunctionId);
    }, [intersections, selectedJunctionId]);
    
    const nsQueue = (queueLengthMap[`${selectedJunctionId}_N`] || 0) + (queueLengthMap[`${selectedJunctionId}_S`] || 0);
    const ewQueue = (queueLengthMap[`${selectedJunctionId}_E`] || 0) + (queueLengthMap[`${selectedJunctionId}_W`] || 0);

    const handleAnalyzeJunction = async () => {
        if (!selectedJunction) return;
        setIsAnalyzing(true);
        setAnalysisResult(null);
        const result = await analyzeJunction({
            id: selectedJunction.id,
            label: selectedJunction.label,
            nsQueue,
            ewQueue
        });
        setAnalysisResult(result);
        setIsAnalyzing(false);
    };

    return (
        <PublicLayout title="Junction AI Analysis" activePage="JUNCTIONS_AI" onNavigate={onNavigate}>
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Left Column: Simulation */}
                <div className="relative aspect-square bg-black rounded-xl border border-white/10 overflow-hidden shadow-2xl shadow-black/50">
                     <SimulationCanvas 
                          intersections={intersections}
                          setIntersections={setIntersections}
                          cars={cars}
                          setCars={setCars}
                          onUpdateStats={updateStats}
                          isRunning={true}
                          onIntersectionSelect={setSelectedJunctionId}
                          onCarSelect={() => {}}
                          selectedCarId={null}
                          scenarioKey={"Bangalore-Junctions"}
                          cvModeActive={false}
                          recentlyUpdatedJunctions={new Set()}
                          incidents={incidents}
                          onIncidentSelect={() => {}}
                          setIncidents={setIncidents}
                          selectedIncidentId={null}
                          closedRoads={new Set()}
                          roads={[]}
                          highlightedVehicleIds={null}
                          highlightedIncidentIds={null}
                          highlightedIntersectionId={selectedJunctionId}
                      />
                </div>

                {/* Right Column: Control Panel */}
                <div className="bg-surface/50 border border-white/10 rounded-2xl p-6 space-y-6">
                    <div>
                        <label htmlFor="junction-select" className="block text-sm font-medium text-gray-400 mb-2">Selected Junction</label>
                        <div className="relative">
                            <select
                                id="junction-select"
                                value={selectedJunctionId}
                                onChange={(e) => setSelectedJunctionId(e.target.value)}
                                className="w-full bg-surfaceHighlight border border-border rounded-lg pl-4 pr-10 py-3 text-lg font-bold appearance-none focus:ring-1 focus:ring-accent focus:border-accent"
                            >
                                {intersections.map(i => (
                                    <option key={i.id} value={i.id}>{i.label}</option>
                                ))}
                            </select>
                            <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-surfaceHighlight text-center">
                            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">N-S Queue</p>
                            <p className="text-3xl font-tech text-white">{nsQueue}</p>
                        </div>
                         <div className="p-4 rounded-lg bg-surfaceHighlight text-center">
                            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">E-W Queue</p>
                            <p className="text-3xl font-tech text-white">{ewQueue}</p>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">AI Tactical Analysis</h4>
                        <button
                            onClick={handleAnalyzeJunction}
                            disabled={isAnalyzing}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary hover:bg-blue-600 transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed text-base font-bold"
                        >
                            {isAnalyzing ? <><SparklesIcon className="w-5 h-5 animate-spin" /> Analyzing...</> : <><SparklesIcon className="w-5 h-5" /> Request AI Analysis</>}
                        </button>
                    </div>

                    <div className="p-4 rounded-lg bg-background border border-border min-h-[150px] flex flex-col justify-center animate-in fade-in">
                        {isAnalyzing && <p className="text-center text-gray-500 text-sm">AI is processing live telemetry...</p>}
                        {analysisResult ? (
                            <div className="space-y-4 text-sm">
                                <p><strong className="text-gray-400 font-semibold block mb-1">Assessment:</strong> <span className="text-gray-200">{analysisResult.analysis}</span></p>
                                <p><strong className="text-accent font-semibold block mb-1">Recommendation:</strong> <span className="text-white font-bold">{analysisResult.recommendation}</span></p>
                                <p><strong className="text-gray-400 font-semibold block mb-1">Rationale:</strong> <span className="text-gray-300">{analysisResult.reason}</span></p>
                            </div>
                        ) : !isAnalyzing && (
                             <div className="text-center text-gray-600">
                                <LightBulbIcon className="w-8 h-8 mx-auto mb-2"/>
                                <p>AI analysis will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

// --- ML DESIGN PAGE ---
const FlowArrow: React.FC<{ direction?: 'down' | 'right', className?: string }> = ({ direction = 'right', className }) => (
    <div className={`flex items-center justify-center ${direction === 'down' ? 'flex-col h-16' : 'w-16'} ${className}`}>
        <div className={`bg-border ${direction === 'down' ? 'w-px h-full' : 'h-px w-full'}`}></div>
        {direction === 'right' && <div className="w-2 h-2 border-r-2 border-b-2 border-border transform rotate-[-45deg] -ml-1"></div>}
        {direction === 'down' && <div className="w-2 h-2 border-r-2 border-b-2 border-border transform rotate-[45deg] -mt-1"></div>}
    </div>
);

const ArchBlock: React.FC<{ icon: React.FC<any>, title: string, items: string[], color: 'blue' | 'cyan' | 'green' | 'purple' }> = ({ icon: Icon, title, items, color }) => {
    const colors = {
        blue: 'border-blue-500/50 text-blue-400 bg-blue-500/5',
        cyan: 'border-cyan-500/50 text-cyan-400 bg-cyan-500/5',
        green: 'border-green-500/50 text-green-400 bg-green-500/5',
        purple: 'border-purple-500/50 text-purple-400 bg-purple-500/5',
    };
    return (
        <div className={`p-4 rounded-lg border ${colors[color]} flex-1`}>
            <div className="flex items-center gap-3 mb-3">
                <Icon className="w-6 h-6" />
                <h4 className="font-bold text-white text-base">{title}</h4>
            </div>
            <ul className="space-y-1.5 text-xs text-gray-400 list-disc list-inside">
                {items.map(item => <li key={item}>{item}</li>)}
            </ul>
        </div>
    );
};

export const MlDesignPage: React.FC<{onNavigate: (p: string) => void}> = ({ onNavigate }) => (
    <PublicLayout title="ML System Design" activePage="ML_DESIGN" onNavigate={onNavigate}>
        <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-lg text-gray-400 leading-relaxed">
                BharatFlow's intelligence is built on a multi-layered machine learning architecture. This diagram illustrates the end-to-end data flow, from raw sensor input to actionable traffic control directives.
            </p>
        </div>
        
        {/* Architecture Diagram */}
        <div className="bg-surface/50 border border-white/10 rounded-2xl p-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">

                {/* Column 1: Ingestion */}
                <div className="flex flex-col gap-4 w-full lg:w-1/3">
                    <h3 className="text-sm font-bold text-center uppercase tracking-wider text-gray-400">1. Data Ingestion & Perception</h3>
                    <ArchBlock icon={ServerStackIcon} title="Raw Data Sources" items={["IoT Road Sensors", "Live Camera Feeds", "Public Event APIs"]} color="blue" />
                    <FlowArrow direction="down" className="mx-auto" />
                    <ArchBlock icon={CameraIcon} title="Computer Vision" items={["Vehicle Detection & Classification", "Queue Length Counting", "Anomaly Detection (e.g., accidents)"]} color="blue" />
                </div>
                
                <FlowArrow className="transform rotate-90 lg:rotate-0" />

                {/* Column 2: Processing */}
                <div className="flex flex-col gap-4 w-full lg:w-1/3">
                     <h3 className="text-sm font-bold text-center uppercase tracking-wider text-gray-400">2. Core Processing & Prediction</h3>
                    <ArchBlock icon={ChartBarIcon} title="Predictive Analytics" items={["Time-Series Congestion Forecasting", "Incident Impact Modeling", "Event Correlation Engine"]} color="cyan" />
                    <FlowArrow direction="down" className="mx-auto" />
                    <ArchBlock icon={SparklesIcon} title="Gemini 2.5 Core" items={["Multi-modal Data Fusion", "Natural Language Reasoning", "Strategic Optimization"]} color="purple" />
                </div>

                <FlowArrow className="transform rotate-90 lg:rotate-0" />

                {/* Column 3: Intelligence */}
                <div className="flex flex-col gap-4 w-full lg:w-1/3">
                     <h3 className="text-sm font-bold text-center uppercase tracking-wider text-gray-400">3. Actionable Intelligence</h3>
                    <ArchBlock icon={ChatBubbleLeftRightIcon} title="AI-Generated Outputs" items={["Natural Language Insights", "Strategic Recommendations", "Operator Alerts & Notifications"]} color="green" />
                     <FlowArrow direction="down" className="mx-auto" />
                     <ArchBlock icon={CpuChipIcon} title="Grid Control Interface" items={["Optimized Signal Timings", "Emergency Vehicle Preemption", "Dynamic Rerouting suggestions"]} color="green" />
                </div>
            </div>
        </div>
        
        {/* Explanations */}
        <div className="mt-12 grid md:grid-cols-3 gap-8 text-sm">
            <div>
                <h4 className="font-bold text-lg text-white mb-3">Computer Vision</h4>
                <p className="text-gray-400 leading-relaxed">
                    Our CV models process video feeds in real-time to provide the foundational data for our digital twin. By identifying vehicle types, measuring queue lengths accurately, and detecting unusual events, this layer converts unstructured visual data into structured, actionable information for the AI core.
                </p>
            </div>
             <div>
                <h4 className="font-bold text-lg text-white mb-3">Predictive Analytics</h4>
                <p className="text-gray-400 leading-relaxed">
                    Using historical and real-time data, our time-series models forecast traffic flow minutes to hours in advance. This allows the system to be proactive rather than reactive, making adjustments to prevent congestion before it becomes critical.
                </p>
            </div>
             <div>
                <h4 className="font-bold text-lg text-white mb-3">Gemini 2.5 Core</h4>
                <p className="text-gray-400 leading-relaxed">
                    This is the central brain of BharatFlow. The Gemini model fuses data from all sources—CV, predictions, and external APIs—to build a holistic understanding of the traffic situation. It uses its advanced reasoning capabilities to formulate strategic recommendations in plain English for the human operator.
                </p>
            </div>
        </div>

    </PublicLayout>
);