
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SimulationSection } from './components/SimulationSection';
import { StatsCard } from './components/StatsCard';
import { analyzeTraffic } from './services/geminiService';
import { Intersection, Car, LightState, TrafficStats, GeminiAnalysis } from './types';
import { GRID_SIZE, INITIAL_GREEN_DURATION, CITY_CONFIGS } from './constants';
import { 
  ExclamationTriangleIcon, 
  ChartBarIcon, Squares2X2Icon, SparklesIcon, MapIcon,
  ClockIcon, BoltIcon, GlobeAltIcon, ServerIcon, SignalIcon,
  ChevronRightIcon, MagnifyingGlassIcon, MapPinIcon, BuildingOffice2Icon
} from '@heroicons/react/24/outline';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

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
  const [activeTab, setActiveTab] = useState<'dash' | 'map' | 'analytics'>('dash');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{type: 'CITY'|'JUNCTION', label: string, id?: string}[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [ `> ${new Date().toLocaleTimeString('en-US', {hour12:false})} ${msg}`, ...prev].slice(0, 10));
  };

  // Optimization: Memoize searchable items to avoid recalculating on every traffic frame
  const searchableItems = useMemo(() => {
    const items: {type: 'CITY'|'JUNCTION', label: string, id?: string}[] = [];
    
    // 1. Cities
    Object.keys(CITY_CONFIGS).forEach(city => {
      if (city !== currentCity) items.push({ type: 'CITY', label: city });
    });

    // 2. Junctions (Use initial state logic or extract from current intersections if labels are stable)
    // We can iterate the current intersections array since we only care about Labels/IDs which are stable per city
    if (intersections.length > 0) {
       intersections.forEach(i => {
         items.push({ type: 'JUNCTION', label: i.label, id: i.id });
       });
    }
    return items;
  }, [currentCity, intersections.length > 0 ? intersections[0].id : 'init']); 
  // Dependency: Only re-run if city changes (implied by first ID change)

  // Search Logic
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults(prev => prev.length === 0 ? prev : []); // Guard to prevent loop
      return;
    }
    const q = searchQuery.toLowerCase();
    const results = searchableItems.filter(item => item.label.toLowerCase().includes(q));
    
    setSearchResults(results.slice(0, 50));
  }, [searchQuery, searchableItems]);

  // Handle Search Selection
  const handleSearchSelect = (result: {type: 'CITY'|'JUNCTION', label: string, id?: string}) => {
    if (result.type === 'CITY') {
      setCurrentCity(result.label);
      setIntersections(generateIntersections(CITY_CONFIGS[result.label]));
      setCars([]); // Reset traffic for new city
      addLog(`System migrated to ${result.label} Grid.`);
      setLogs(prev => [`> Initializing ${result.label} topology...`, ...prev]);
    } else if (result.type === 'JUNCTION' && result.id) {
      setSelectedIntersectionId(result.id);
      addLog(`Focusing optical sensors on ${result.label}`);
    }
    setSearchQuery("");
    setShowSearch(false);
  };

  const handleUpdateStats = (total: number, speed: number, queues: Record<string, number>) => {
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

    if (Date.now() % 2000 < 50) {
      setHistory(prev => [...prev, {
        time: new Date().toLocaleTimeString([], { hour12: false, minute:'2-digit', second:'2-digit' }),
        congestion: newStats.congestionLevel,
        speed: parseFloat(newStats.avgSpeed.toFixed(1))
      }].slice(-30));
    }
  };

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

  const selectedIntersection = intersections.find(i => i.id === selectedIntersectionId);

  return (
    <div className="relative w-full h-screen bg-background bg-mesh text-gray-300 font-sans overflow-hidden flex flex-col">
      
      {/* 1. TOP BAR HUD */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-8">
           {/* Logo */}
           <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded bg-gradient-to-br from-saffron to-red-600 flex items-center justify-center shadow-lg shadow-saffron/20 group cursor-pointer hover:scale-105 transition-transform">
               <GlobeAltIcon className="w-5 h-5 text-white group-hover:rotate-180 transition-transform duration-700" />
             </div>
             <div>
               <h1 className="text-xl font-tech font-bold tracking-widest text-white leading-none">
                 BHARAT<span className="text-saffron">FLOW</span>
               </h1>
               <div className="text-[10px] font-mono text-gray-500 tracking-[0.2em] uppercase flex items-center gap-1">
                 <span>{currentCity.toUpperCase()}</span>
                 <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                 <span>LIVE</span>
               </div>
             </div>
           </div>
           
           {/* Search Bar */}
           <div className="relative w-80" ref={searchRef}>
             <div className={`
               flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300
               ${showSearch || searchQuery ? 'bg-surfaceHighlight border-accent/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20'}
             `}>
               <MagnifyingGlassIcon className={`w-4 h-4 ${showSearch ? 'text-accent' : 'text-gray-500'}`} />
               <input 
                 type="text" 
                 placeholder="Search city or junction..." 
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
                     key={idx}
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
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-green-500 tracking-wider">SYSTEM ONLINE</span>
           </div>
           <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
              <ClockIcon className="w-4 h-4" />
              <span>{new Date().toLocaleTimeString()}</span>
           </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        
        {/* 2. LEFT SIDEBAR (Navigation) */}
        <nav className="w-16 glass rounded-2xl flex flex-col items-center py-6 gap-4 z-40">
           {[
             { id: 'dash', icon: Squares2X2Icon },
             { id: 'map', icon: MapIcon },
             { id: 'analytics', icon: ChartBarIcon }
           ].map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)} 
               className={`p-3 rounded-xl transition-all relative group ${activeTab === tab.id ? 'text-accent' : 'text-gray-500 hover:text-gray-300'}`}
             >
                <div className={`absolute inset-0 bg-accent/10 rounded-xl scale-0 transition-transform ${activeTab === tab.id ? 'scale-100' : 'group-hover:scale-75'}`}></div>
                <tab.icon className="w-6 h-6 relative z-10" />
             </button>
           ))}
           <div className="flex-1"></div>
           <div className="w-8 h-px bg-white/10"></div>
           <button className="p-3 text-gray-600 hover:text-white transition-colors">
              <ServerIcon className="w-5 h-5" />
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
          />
        ) : (
          <div className="flex-1 glass rounded-2xl flex items-center justify-center border border-white/5">
            <div className="text-center">
               <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                 {activeTab === 'map' ? <MapIcon className="w-8 h-8 text-gray-500" /> : <ChartBarIcon className="w-8 h-8 text-gray-500" />}
               </div>
               <h3 className="text-lg font-bold text-gray-300">
                  {activeTab === 'map' ? 'Geospatial View' : 'Analytics Engine'}
               </h3>
               <p className="text-sm text-gray-500 mt-2">Module currently initializing...</p>
            </div>
          </div>
        )}

        {/* 4. RIGHT SIDEBAR (Intelligence Panel) */}
        <aside className="w-[360px] flex flex-col gap-4">
           
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
              <div className="col-span-2 h-24 bg-white/[0.02] border border-white/5 rounded-lg p-3 relative min-h-0">
                 <div className="absolute top-2 right-2 flex gap-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                   <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                 </div>
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                       <defs>
                          <linearGradient id="colorCongestion" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <Area type="monotone" dataKey="congestion" stroke="#ef4444" strokeWidth={2} fill="url(#colorCongestion)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* B. AI Core */}
           <div className="glass rounded-2xl p-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
              <div className="bg-surfaceHighlight rounded-xl p-5 border border-white/5">
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                       <div className="relative">
                          {/* Animated Sparkles */}
                          <SparklesIcon className={`w-6 h-6 transition-all duration-500 ${isAnalyzing ? 'text-purple-400 animate-spin opacity-100 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'text-gray-400 opacity-70'}`} />
                          {isAnalyzing && <div className="absolute inset-0 bg-purple-500/50 blur-lg animate-pulse"></div>}
                       </div>
                       <div>
                          {/* Pulsing Text */}
                          <h3 className={`text-sm font-bold transition-colors duration-300 ${isAnalyzing ? 'text-purple-300 animate-pulse' : 'text-white'}`}>Gemini Core</h3>
                          <p className="text-[10px] text-gray-500">Traffic Optimization Engine</p>
                       </div>
                    </div>
                    <button 
                       onClick={triggerAIAnalysis}
                       disabled={isAnalyzing}
                       className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 text-purple-300 text-[10px] font-bold rounded uppercase transition-colors disabled:opacity-50"
                    >
                       {isAnalyzing ? 'Analyzing...' : 'Optimize'}
                    </button>
                 </div>
                 
                 <div className="bg-black/40 rounded p-3 min-h-[80px] text-xs leading-relaxed text-gray-300 border border-white/5 font-mono overflow-hidden relative">
                    {aiInsights?.analysis ? (
                       <span 
                        key={aiInsights.timestamp} 
                        className="text-purple-100 block animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-700 fill-mode-forwards"
                       >
                         {aiInsights.analysis}
                       </span>
                    ) : (
                       <span className="text-gray-600 italic flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-pulse"></span>
                          // Waiting for optimization request...
                       </span>
                    )}
                 </div>
              </div>
           </div>

           {/* C. Intersection Details (Dynamic) */}
           <div className={`glass rounded-2xl flex-1 p-5 transition-all duration-500 ${selectedIntersection ? 'border-accent/30' : ''}`}>
              {selectedIntersection ? (
                <>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                    <h3 className="text-sm font-bold text-accent uppercase tracking-wider">{selectedIntersection.label}</h3>
                    <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded border border-accent/20">{selectedIntersection.id}</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/30 p-2 rounded border border-white/5">
                        <div className="text-[10px] text-gray-500 mb-1">N-S SIGNAL</div>
                        <div className={`text-lg font-tech font-bold ${selectedIntersection.lightState.ns === 'GREEN' ? 'text-green-400' : 'text-red-400'}`}>
                           {selectedIntersection.lightState.ns}
                        </div>
                      </div>
                      <div className="bg-black/30 p-2 rounded border border-white/5">
                        <div className="text-[10px] text-gray-500 mb-1">E-W SIGNAL</div>
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
                          className="h-full bg-white transition-all duration-1000 ease-linear"
                          style={{ width: `${(selectedIntersection.timer / selectedIntersection.greenDuration) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="p-3 bg-red-900/10 border border-red-500/20 rounded flex items-center justify-between group cursor-pointer hover:bg-red-900/20 transition-colors" onClick={createJam}>
                       <span className="text-xs text-red-400 font-bold">REPORT INCIDENT</span>
                       <ChevronRightIcon className="w-3 h-3 text-red-500" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                   <SignalIcon className="w-12 h-12 mb-3 text-gray-600" />
                   <p className="text-xs font-mono uppercase">Select a junction<br/>for telemetry</p>
                </div>
              )}
           </div>

           {/* D. Log Terminal */}
           <div className="h-32 bg-black border-t-2 border-white/10 p-3 font-mono text-[10px] overflow-y-auto rounded-b-lg">
              {logs.map((log, i) => (
                 <div key={i} className="mb-1">
                    <span className="text-gray-600 mr-2">{i+1}</span>
                    <span className={log.includes('ERR') ? 'text-red-400' : log.includes('Gemini') ? 'text-purple-300' : 'text-gray-400'}>
                       {log}
                    </span>
                 </div>
              ))}
           </div>

        </aside>
      </div>
    </div>
  );
};

export default App;
