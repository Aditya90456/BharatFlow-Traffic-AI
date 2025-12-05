import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SimulationSection } from './components/SimulationSection';
import { StatsCard } from './components/StatsCard';
import { LandingPage } from './components/LandingPage';
import { FeaturesPage, LiveMapPage, PublicDataPage, ApiDocsPage } from './components/PublicPages';
import { analyzeTraffic } from './services/geminiService';
import { Intersection, Car, LightState, TrafficStats, GeminiAnalysis } from './types';
import { GRID_SIZE, INITIAL_GREEN_DURATION, CITY_CONFIGS } from './constants';
import { 
  ExclamationTriangleIcon, 
  ChartBarIcon, Squares2X2Icon, SparklesIcon, MapIcon,
  ClockIcon, BoltIcon, GlobeAltIcon, SignalIcon,
  ChevronRightIcon, MagnifyingGlassIcon, MapPinIcon, BuildingOffice2Icon, ArrowLeftOnRectangleIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

type TabId = 'dash' | 'map' | 'analytics';
type ViewState = 'LANDING' | 'DASHBOARD' | 'FEATURES' | 'PUBLIC_MAP' | 'PUBLIC_DATA' | 'API_DOCS';
type ViewMode = 'GRID' | 'SATELLITE';

// Boot Sequence Component
const SystemBoot: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [lines, setLines] = useState<string[]>([]);
  const bootLogs = [
    "INITIALIZING BHARATFLOW KERNEL v3.0.1...",
    "MOUNTING SATELLITE UPLINK [OK]",
    "DECRYPTING SECURE CHANNELS... [OK]",
    "LOADING TRAFFIC TOPOLOGY MODULES...",
    "SYNCING WITH CITY SENSORS: 98% COMPLETE",
    "STARTING AI INFERENCE ENGINE (GEMINI-2.5)...",
    "SYSTEM READY."
  ];

  useEffect(() => {
    let delay = 0;
    bootLogs.forEach((log, index) => {
      delay += Math.random() * 400 + 200;
      setTimeout(() => {
        setLines(prev => [...prev, log]);
        if (index === bootLogs.length - 1) {
          setTimeout(onComplete, 800);
        }
      }, delay);
    });
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center font-mono text-green-500 p-8">
      <div className="w-full max-w-2xl">
        <div className="mb-4 border-b border-green-500/30 pb-2 flex justify-between">
           <span>BOOT_SEQUENCE</span>
           <span>SECURE_CONN</span>
        </div>
        <div className="space-y-1">
          {lines.map((line, i) => (
            <div key={i} className="animate-in fade-in duration-300">
              <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
              {line}
            </div>
          ))}
          <div className="animate-blink text-green-400 mt-2">_</div>
        </div>
      </div>
    </div>
  );
};

const generateIntersections = (cityNames: string[]): Intersection[] => {
  const arr: Intersection[] = [];
  let nameIdx = 0;
  for(let x=0; x<GRID_SIZE; x++) {
    for(let y=0; y<GRID_SIZE; y++) {
      arr.push({
        id: `INT-${x}-${y}`,
        label: cityNames[nameIdx++] || `Sector ${x}-${y}`,
        x,
        y,
        lightState: { ns: Math.random() > 0.5 ? LightState.GREEN : LightState.RED, ew: Math.random() > 0.5 ? LightState.RED : LightState.GREEN },
        timer: Math.floor(Math.random() * 100),
        greenDuration: INITIAL_GREEN_DURATION
      });
    }
  }
  return arr;
};

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('LANDING');
  const [isBooting, setIsBooting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('GRID');

  const [currentCity, setCurrentCity] = useState<string>("Bangalore");
  const [isRunning, setIsRunning] = useState(true);
  const [intersections, setIntersections] = useState<Intersection[]>(() => generateIntersections(CITY_CONFIGS["Bangalore"]));
  const [cars, setCars] = useState<Car[]>([]);
  const [stats, setStats] = useState<TrafficStats>({
    totalCars: 0,
    avgSpeed: 0,
    congestionLevel: 0,
    carbonEmission: 0
  });
  const [queueMap, setQueueMap] = useState<Record<string, number>>({});
  const [selectedIntersectionId, setSelectedIntersectionId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState<GeminiAnalysis | null>(null);
  const [logs, setLogs] = useState<string[]>(["BharatFlow OS v3.0 connected...", "Satellite feed synced.", "IoT Sensors: 98% ONLINE"]);
  const [history, setHistory] = useState<{time: string, congestion: number, speed: number}[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('dash');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{type: 'CITY'|'JUNCTION', label: string, id?: string}[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const lastHistoryUpdate = useRef(0);

  const addLog = (msg: string) => {
    setLogs(prev => [ `> ${new Date().toLocaleTimeString('en-US', {hour12:false})} ${msg}`, ...prev].slice(0, 10));
  };

  const initializeDashboard = (city: string) => {
    setCurrentCity(city);
    setIntersections(generateIntersections(CITY_CONFIGS[city]));
    setCars([]);
    setStats({
      totalCars: 0,
      avgSpeed: 0,
      congestionLevel: 0,
      carbonEmission: 0,
    });
    setQueueMap({});
    setSelectedIntersectionId(null);
    setIsAnalyzing(false);
    setAiInsights(null);
    setLogs([
      `> ${new Date().toLocaleTimeString('en-US', {hour12: false})} INITIALIZING ${city.toUpperCase()} GRID...`,
      "BharatFlow OS v3.0 connected.",
      "Satellite feed synced.",
      "IoT Sensors: 98% ONLINE",
    ]);
    setHistory([]);
    setActiveTab('dash');
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
    setIsRunning(true);
    setViewMode('GRID');
  };

  const searchableItems = useMemo(() => {
    const items: {type: 'CITY'|'JUNCTION', label: string, id?: string}[] = [];
    Object.keys(CITY_CONFIGS).forEach(city => {
      if (city !== currentCity) items.push({ type: 'CITY', label: city });
    });
    if (intersections.length > 0) {
       intersections.forEach(i => {
         items.push({ type: 'JUNCTION', label: i.label, id: i.id });
       });
    }
    return items;
  }, [currentCity, intersections]); 

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const results = searchableItems.filter(item => item.label.toLowerCase().includes(q));
    setSearchResults(results.slice(0, 50));
  }, [searchQuery, searchableItems]);

  const handleSearchSelect = (result: {type: 'CITY'|'JUNCTION', label: string, id?: string}) => {
    if (result.type === 'CITY') {
      initializeDashboard(result.label);
    } else if (result.type === 'JUNCTION' && result.id) {
      setSelectedIntersectionId(result.id);
      addLog(`Focusing optical sensors on ${result.label}`);
    }
    setSearchQuery("");
    setShowSearch(false);
  };

  const handleUpdateStats = useCallback((total: number, speed: number, queues: Record<string, number>) => {
    const totalQueued = Object.values(queues).reduce((a, b) => a + b, 0);
    const congestion = total > 0 ? (totalQueued / total) * 100 : 0;
    
    const newStats = {
      totalCars: total,
      avgSpeed: speed,
      congestionLevel: Math.round(congestion),
      carbonEmission: Math.round(total * 0.12 * (1 + congestion/100))
    };
    
    setStats(newStats);
    setQueueMap(queues);

    const now = Date.now();
    if (now - lastHistoryUpdate.current > 2000) {
      lastHistoryUpdate.current = now;
      setHistory(prev => [...prev, {
        time: new Date().toLocaleTimeString([], { hour12: false, minute:'2-digit', second:'2-digit' }),
        congestion: newStats.congestionLevel,
        speed: parseFloat(newStats.avgSpeed.toFixed(1))
      }].slice(-30));
    }
  }, []);

  const triggerAIAnalysis = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    addLog(`Initiating ${currentCity} Traffic Analysis...`);
    
    try {
      const result = await analyzeTraffic(intersections, stats, queueMap);
      setAiInsights(result);
      addLog("Analysis Complete. Optimizing signal phases...");
      
      if (result.suggestedChanges.length > 0) {
        setIntersections(prev => prev.map(int => {
          const change = result.suggestedChanges.find(c => c.intersectionId === int.id);
          if (change) {
            return { ...int, greenDuration: change.newGreenDuration };
          }
          return int;
        }));
        addLog(`Updated timings for ${result.suggestedChanges.length} junctions.`);
      }

    } catch (e) {
      addLog("ERR: Cloud Uplink Timeout. Retrying...");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createJam = () => {
    addLog("CRITICAL: Vehicle breakdown reported at central node.");
    setCars(prev => prev.map(c => {
       if (Math.abs(c.x - 300) < 100 && Math.abs(c.y - 300) < 100) {
         return { ...c, speed: 0, state: 'STOPPED' };
       }
       return c;
    }));
  };

  const handleLogout = () => {
    setIsRunning(false);
    setViewState('LANDING');
    setLogs([]); 
  };

  const handleNavigate = (page: string) => {
    if (page === 'DASHBOARD') {
      setIsBooting(true);
    } else {
      setIsBooting(false);
      setViewState(page as ViewState);
    }
  };


  // ROUTING LOGIC
  if (isBooting) {
    return <SystemBoot onComplete={() => {
        initializeDashboard(currentCity);
        setIsBooting(false);
        setViewState('DASHBOARD');
    }} />;
  }
  
  if (viewState === 'LANDING') {
    return <LandingPage onNavigate={handleNavigate} />;
  }

  if (viewState === 'FEATURES') return <FeaturesPage onNavigate={handleNavigate} />;
  if (viewState === 'PUBLIC_MAP') return <LiveMapPage onNavigate={handleNavigate} />;
  if (viewState === 'PUBLIC_DATA') return <PublicDataPage onNavigate={handleNavigate} />;
  if (viewState === 'API_DOCS') return <ApiDocsPage onNavigate={handleNavigate} />;

  // DASHBOARD RENDER
  const selectedIntersection = intersections.find(i => i.id === selectedIntersectionId);

  const TABS: { id: TabId; icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>> }[] = [
    { id: 'dash', icon: Squares2X2Icon },
    { id: 'map', icon: MapIcon },
    { id: 'analytics', icon: ChartBarIcon }
  ];

  return (
    <div className="relative w-full h-screen bg-background bg-mesh text-gray-300 font-sans overflow-hidden flex flex-col animate-in fade-in duration-700">
      
      {/* SCANLINE OVERLAY */}
      <div className="scanline"></div>

      {/* 1. TOP BAR HUD */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-surface/90 backdrop-blur-md z-50">
        <div className="flex items-center gap-8">
           {/* Logo */}
           <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded bg-gradient-to-br from-saffron to-red-600 flex items-center justify-center shadow-lg shadow-saffron/20 group cursor-pointer hover:scale-105 transition-transform border border-white/10" onClick={() => setViewState('LANDING')}>
               <GlobeAltIcon className="w-5 h-5 text-white group-hover:rotate-180 transition-transform duration-700" />
             </div>
             <div>
               <h1 className="text-xl font-tech font-bold tracking-[0.1em] text-white leading-none">
                 BHARAT<span className="text-saffron">FLOW</span>
               </h1>
               <div className="text-[10px] font-mono text-gray-500 tracking-[0.2em] uppercase flex items-center gap-1.5 mt-0.5">
                 <span className="text-accent">{currentCity.toUpperCase()}</span>
                 <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                 <span>LIVE</span>
               </div>
             </div>
           </div>
           
           {/* Search Bar */}
           <div className="relative w-80" ref={searchRef}>
             <div className={`
               flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300
               ${showSearch || searchQuery ? 'bg-surfaceHighlight border-accent/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-black/20 border-white/10 hover:border-white/20'}
             `}>
               <MagnifyingGlassIcon className={`w-4 h-4 ${showSearch ? 'text-accent' : 'text-gray-500'}`} />
               <input 
                 type="text" 
                 placeholder="Search sector or junction..." 
                 className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-600 w-full font-sans"
                 value={searchQuery}
                 onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                 onFocus={() => setShowSearch(true)}
                 onBlur={() => setTimeout(() => setShowSearch(false), 200)}
               />
             </div>

             {/* Search Dropdown */}
             {showSearch && searchResults.length > 0 && (
               <div className="absolute top-full left-0 w-full mt-2 bg-surface border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                 {searchResults.map((result, idx) => (
                   <button
                     key={`${result.type}-${result.label}-${idx}`}
                     className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left transition-colors border-b border-white/5 last:border-0"
                     onClick={() => handleSearchSelect(result)}
                   >
                     {result.type === 'CITY' ? (
                       <BuildingOffice2Icon className="w-4 h-4 text-saffron" />
                     ) : (
                       <MapPinIcon className="w-4 h-4 text-accent" />
                     )}
                     <div>
                       <div className="text-sm font-bold text-gray-200">{result.label}</div>
                       <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                         {result.type === 'CITY' ? 'SWITCH GRID' : 'LOCATE JUNCTION'}
                       </div>
                     </div>
                   </button>
                 ))}
               </div>
             )}
           </div>
        </div>

        {/* Right Status */}
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-green-900/10 border border-green-500/20 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-green-500 tracking-wider">SYSTEM OPTIMAL</span>
           </div>
           <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
              <ClockIcon className="w-4 h-4" />
              <span>{new Date().toLocaleTimeString()}</span>
           </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden p-4 gap-4 z-10">
        
        {/* 2. LEFT SIDEBAR (Navigation) */}
        <nav className="w-16 glass rounded-2xl flex flex-col items-center py-6 gap-6 z-40">
           {TABS.map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id)} 
               className={`p-3 rounded-xl transition-all relative group ${activeTab === tab.id ? 'text-accent' : 'text-gray-500 hover:text-gray-300'}`}
             >
                <div className={`absolute inset-0 bg-accent/10 rounded-xl scale-0 transition-transform duration-300 ${activeTab === tab.id ? 'scale-100' : 'group-hover:scale-75'}`}></div>
                <tab.icon className="w-6 h-6 relative z-10" />
                
                {/* Tooltip */}
                <div className="absolute left-14 bg-surface border border-white/10 px-2 py-1 rounded text-[10px] uppercase font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {tab.id}
                </div>
             </button>
           ))}
           <div className="flex-1"></div>
           <div className="w-8 h-px bg-white/10"></div>
           <button 
             onClick={handleLogout}
             className="p-3 text-gray-600 hover:text-red-400 transition-colors group relative"
             title="Logout"
           >
              <ArrowLeftOnRectangleIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
           </button>
        </nav>

        {/* 3. CENTER STAGE (Tabs Logic) */}
        {activeTab === 'dash' ? (
           <SimulationSection 
             currentCity={currentCity}
             isRunning={isRunning}
             setIsRunning={setIsRunning}
             intersections={intersections}
             setIntersections={setIntersections}
             cars={cars}
             setCars={setCars}
             onUpdateStats={handleUpdateStats}
             onIntersectionSelect={setSelectedIntersectionId}
             stats={stats}
             viewMode={viewMode}
             setViewMode={setViewMode}
          />
        ) : (
          <div className="flex-1 glass rounded-2xl flex items-center justify-center border border-white/5 relative overflow-hidden">
             <div className="absolute inset-0 bg-mesh opacity-20"></div>
             <div className="text-center relative z-10">
               <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 animate-pulse">
                 {activeTab === 'map' ? <MapIcon className="w-10 h-10 text-gray-500" /> : <ChartBarIcon className="w-10 h-10 text-gray-500" />}
               </div>
               <h3 className="text-xl font-bold text-gray-300 font-tech tracking-wider">
                  {activeTab === 'map' ? 'GEOSPATIAL LAYER' : 'ANALYTICS ENGINE'}
               </h3>
               <p className="text-xs text-gray-500 mt-2 font-mono uppercase">Initializing Sub-System...</p>
            </div>
          </div>
        )}

        {/* 4. RIGHT SIDEBAR (Intelligence Panel) */}
        <aside className="w-[380px] flex flex-col gap-4">
           
           {/* A. System Status Grid */}
           <div className="glass rounded-2xl p-4 grid grid-cols-2 gap-3">
              <StatsCard 
                label="Congestion" 
                value={stats.congestionLevel} 
                unit="%" 
                color={stats.congestionLevel > 70 ? 'danger' : 'success'}
                icon={<ExclamationTriangleIcon className="w-4 h-4"/>}
              />
              <StatsCard 
                label="Emission" 
                value={stats.carbonEmission} 
                unit="kg" 
                color="warning"
                icon={<BoltIcon className="w-4 h-4"/>}
              />
              <div className="col-span-2 h-24 bg-black/20 border border-white/5 rounded-lg p-3 relative min-h-0">
                 <div className="absolute top-2 right-2 flex gap-1">
                   <div className="w-1 h-1 rounded-full bg-red-500"></div>
                   <div className="w-1 h-1 rounded-full bg-yellow-500"></div>
                   <div className="w-1 h-1 rounded-full bg-green-500"></div>
                 </div>
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                       <defs>
                          <linearGradient id="colorCongestion" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <Area type="monotone" dataKey="congestion" stroke="#EF4444" strokeWidth={2} fill="url(#colorCongestion)" isAnimationActive={false} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* B. AI Core */}
           <div className="glass rounded-2xl p-1 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
              <div className="bg-surfaceHighlight rounded-xl p-5 border border-white/5 relative">
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                       <div className="relative">
                          <SparklesIcon className={`w-6 h-6 transition-all duration-500 ${isAnalyzing ? 'text-purple-400 animate-spin opacity-100 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'text-gray-400 opacity-70'}`} />
                          {isAnalyzing && <div className="absolute inset-0 bg-purple-500/50 blur-lg animate-pulse"></div>}
                       </div>
                       <div>
                          <h3 className={`text-sm font-bold transition-colors duration-300 ${isAnalyzing ? 'text-purple-300 animate-pulse' : 'text-white'}`}>Gemini Core</h3>
                          <p className="text-[10px] text-gray-500">Traffic Optimization Engine</p>
                       </div>
                    </div>
                    <button 
                       onClick={triggerAIAnalysis}
                       disabled={isAnalyzing}
                       className="px-3 py-1 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-500/30 text-purple-300 text-[10px] font-bold rounded uppercase transition-colors disabled:opacity-50"
                    >
                       {isAnalyzing ? 'Processing...' : 'Run Optimization'}
                    </button>
                 </div>
                 
                 <div className="bg-black/40 rounded p-3 min-h-[100px] text-xs leading-relaxed text-gray-300 border border-white/5 font-mono overflow-hidden relative">
                    {aiInsights?.analysis ? (
                       <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                         <div className="text-purple-300 text-[10px] mb-1 opacity-70">
                            ANALYSIS REPORT [ID: {aiInsights.timestamp.toString().slice(-6)}]
                         </div>
                         <span className="text-purple-100">{aiInsights.analysis}</span>
                       </div>
                    ) : (
                       <div className="text-gray-600 italic flex flex-col items-center justify-center h-full gap-2 opacity-50">
                          <CommandLineIcon className="w-5 h-5" />
                          <span>Waiting for input stream...</span>
                       </div>
                    )}
                 </div>
              </div>
           </div>

           {/* C. Intersection Details (Dynamic) */}
           <div className={`glass rounded-2xl flex-1 p-5 transition-all duration-500 flex flex-col ${selectedIntersection ? 'border-accent/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : ''}`}>
              {selectedIntersection ? (
                <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                    <div>
                      <h3 className="text-sm font-bold text-accent uppercase tracking-wider">{selectedIntersection.label}</h3>
                      <div className="text-[10px] text-gray-500 mt-1">LAT: {selectedIntersection.x * 120} / LNG: {selectedIntersection.y * 120}</div>
                    </div>
                    <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded border border-accent/20 font-mono">{selectedIntersection.id}</span>
                  </div>
                  
                  <div className="space-y-4 flex-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/30 p-2 rounded border border-white/5 relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-1 h-full ${selectedIntersection.lightState.ns === 'GREEN' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div className="text-[10px] text-gray-500 mb-1">N-S CORRIDOR</div>
                        <div className={`text-lg font-tech font-bold ${selectedIntersection.lightState.ns === 'GREEN' ? 'text-green-400' : 'text-red-400'}`}>
                           {selectedIntersection.lightState.ns}
                        </div>
                      </div>
                      <div className="bg-black/30 p-2 rounded border border-white/5 relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-1 h-full ${selectedIntersection.lightState.ew === 'GREEN' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div className="text-[10px] text-gray-500 mb-1">E-W CORRIDOR</div>
                        <div className={`text-lg font-tech font-bold ${selectedIntersection.lightState.ew === 'GREEN' ? 'text-green-400' : 'text-red-400'}`}>
                           {selectedIntersection.lightState.ew}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Phase Timer</span>
                        <span className="text-white font-mono">{selectedIntersection.timer}s</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white transition-all duration-1000 ease-linear shadow-[0_0_10px_white]"
                          style={{ width: `${(selectedIntersection.timer / selectedIntersection.greenDuration) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="mt-auto pt-4">
                      <div className="p-3 bg-red-900/10 border border-red-500/20 rounded flex items-center justify-between group cursor-pointer hover:bg-red-900/20 transition-colors" onClick={createJam}>
                         <div className="flex items-center gap-2">
                           <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                           <span className="text-xs text-red-400 font-bold">TRIGGER INCIDENT</span>
                         </div>
                         <ChevronRightIcon className="w-3 h-3 text-red-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                   <SignalIcon className="w-16 h-16 mb-4 text-gray-700" />
                   <p className="text-xs font-mono uppercase tracking-widest text-gray-500">Select a junction<br/>for live telemetry</p>
                </div>
              )}
           </div>

           {/* D. Log Terminal */}
           <div className="h-32 bg-black/80 border-t-2 border-white/10 p-3 font-mono text-[10px] overflow-y-auto rounded-b-lg custom-scrollbar">
              {logs.map((log, i) => (
                 <div key={i} className="mb-1 border-b border-white/5 pb-0.5 last:border-0">
                    <span className="text-gray-600 mr-2 opacity-50">{(i+1).toString().padStart(2, '0')}</span>
                    <span className={log.includes('ERR') ? 'text-red-400' : log.includes('Gemini') ? 'text-purple-300' : log.includes('CRITICAL') ? 'text-orange-400' : 'text-gray-400'}>
                       {log}
                    </span>
                 </div>
              ))}
              <div className="animate-pulse text-accent mt-1">_</div>
           </div>

        </aside>
      </div>
    </div>
  );
};

export default App;