import React, { useState, useEffect } from 'react';
import { GlobeAltIcon, ArrowRightIcon, CpuChipIcon, BoltIcon, ServerIcon, CodeBracketIcon, MapIcon, TableCellsIcon, SparklesIcon, ShieldCheckIcon, ClockIcon, CameraIcon, ChatBubbleLeftRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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
    const intervalId = setInterval(() => {
      setRoutes(prevRoutes =>
        prevRoutes.map(route => ({
          ...route,
          congestion: Math.max(5, Math.min(95, route.congestion + (Math.random() - 0.5) * 20)),
        }))
      );
    }, 2000);

    return () => clearInterval(intervalId);
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