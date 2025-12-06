import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { LandingPage } from './components/LandingPage';
import { FeaturesPage, LiveMapPage, PublicDataPage, ApiDocsPage, AiFeaturesPage } from './components/PublicPages';
import { SimulationSection } from './components/SimulationSection';
import { CameraFeed } from './components/CameraFeed';
import { StatsCard } from './components/StatsCard';
import { VehicleDetails } from './components/VehicleDetails';
import { IntersectionDetails, IntelFeed, IncidentDetails, OverviewPanel } from './components/SidePanels';
import { analyzeTraffic, analyzeIncident, getRealWorldIntel } from './services/geminiService';
import { Incident, Intersection, Car, LightState, TrafficStats, GeminiAnalysis, GeminiIncidentAnalysis, RealWorldIntel } from './types';
import { GRID_SIZE, INITIAL_GREEN_DURATION, CITY_CONFIGS, CITY_COORDINATES, BLOCK_SIZE } from './constants';
import { 
  ArrowLeftOnRectangleIcon, ChartPieIcon, AdjustmentsHorizontalIcon, TruckIcon, SparklesIcon, VideoCameraIcon, GlobeAltIcon,
  ClockIcon, BoltIcon, CloudIcon, SignalIcon, ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

type ViewState = 'LANDING' | 'DASHBOARD' | 'FEATURES' | 'PUBLIC_MAP' | 'PUBLIC_DATA' | 'API_DOCS' | 'AI_FEATURES';
type ActiveTab = 'OVERVIEW' | 'JUNCTION' | 'UNIT' | 'INTEL' | 'CCTV' | 'INCIDENT';

// Boot Sequence Component
const SystemBoot: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [lines, setLines] = useState<string[]>([]);
  const bootLogs = [
    "INITIALIZING BHARATFLOW KERNEL v4.0.1...",
    "ESTABLISHING GEOSPATIAL LINK... [OK]",
    "LOADING CITY TOPOLOGY: BANGALORE (TESTBED)",
    "SYNCING WITH IoT SENSOR GRID: 99.8% COMPLETE",
    "CALIBRATING LHT PHYSICS ENGINE...",
    "STARTING AI TACTICAL ENGINE (GEMINI-2.5)...",
    "SYSTEM READY. COMMAND AWAITED."
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
        lightState: { ns: LightState.GREEN, ew: LightState.RED },
        timer: INITIAL_GREEN_DURATION,
        greenDuration: INITIAL_GREEN_DURATION,
        overrideState: null,
      });
    }
  }
  return arr;
};

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('LANDING');
  const [isBooting, setIsBooting] = useState(false);
  
  const [currentCity, setCurrentCity] = useState<string>("Bangalore");
  const [intersections, setIntersections] = useState<Intersection[]>(() => generateIntersections(CITY_CONFIGS["Bangalore"]));
  const [cars, setCars] = useState<Car[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  
  const [stats, setStats] = useState<TrafficStats>({ totalCars: 0, avgSpeed: 0, congestionLevel: 0, carbonEmission: 0, incidents: 0 });
  const [queueLengthMap, setQueueLengthMap] = useState<Record<string, number>>({});
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('OVERVIEW');
  const [selectedIntersectionId, setSelectedIntersectionId] = useState<string | null>(null);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const [isRunning, setIsRunning] = useState(true);
  const [viewMode, setViewMode] = useState<'GRID' | 'SATELLITE'>('GRID');
  const [cvModeActive, setCvModeActive] = useState(false);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [geminiAnalysis, setGeminiAnalysis] = useState<GeminiAnalysis | null>(null);
  const [isIncidentAnalyzing, setIsIncidentAnalyzing] = useState(false);
  const [geminiIncidentAnalysis, setGeminiIncidentAnalysis] = useState<GeminiIncidentAnalysis | null>(null);
  const [recentlyUpdatedJunctions, setRecentlyUpdatedJunctions] = useState<Set<string>>(new Set());
  
  const [isIntelLoading, setIsIntelLoading] = useState(false);
  const [realWorldIntel, setRealWorldIntel] = useState<RealWorldIntel | null>(null);

  const analysisCooldownRef = useRef(false);
  const breakdownIntervalRef = useRef<number | null>(null);
  const carsRef = useRef(cars);

  useEffect(() => {
    carsRef.current = cars;
  }, [cars]);
  
  const handleCarBreakdown = useCallback((brokenCar: Car) => {
      setIncidents(prevIncidents => {
        if (prevIncidents.some(inc => inc.id === `brk-${brokenCar.id}`)) {
          return prevIncidents;
        }

        const gridX = Math.floor(brokenCar.x / BLOCK_SIZE);
        const gridY = Math.floor(brokenCar.y / BLOCK_SIZE);
        let segmentId: string | undefined = undefined;

        let int1Id: string, int2Id: string;
        if (brokenCar.dir === 'E' || brokenCar.dir === 'W') {
            int1Id = `INT-${gridX}-${gridY}`;
            int2Id = `INT-${gridX + 1}-${gridY}`;
        } else {
            int1Id = `INT-${gridX}-${gridY}`;
            int2Id = `INT-${gridX}-${gridY + 1}`;
        }
        segmentId = [int1Id, int2Id].sort().join('_');

        const newIncident: Incident = {
            id: `brk-${brokenCar.id}`,
            type: 'BREAKDOWN',
            location: { x: brokenCar.x, y: brokenCar.y },
            description: `${brokenCar.type} broke down, blocking route.`,
            severity: 'HIGH',
            timestamp: Date.now(),
            blocksSegmentId: segmentId,
        };
        return [...prevIncidents, newIncident];
      });

      setCars(prevCars => prevCars.map(c => 
          c.id === brokenCar.id ? { ...c, isBrokenDown: true, speed: 0, state: 'STOPPED' } : c
      ));
  }, []);

  const closedRoads = useMemo(() => {
    return new Set(incidents.map(inc => inc.blocksSegmentId).filter((id): id is string => !!id));
  }, [incidents]);

  const handleCarBreakdownRef = useRef(handleCarBreakdown);
  useEffect(() => {
    handleCarBreakdownRef.current = handleCarBreakdown;
  }, [handleCarBreakdown]);

  useEffect(() => {
    if (isRunning && viewState === 'DASHBOARD') {
      breakdownIntervalRef.current = window.setInterval(() => {
        const potentialVictims = carsRef.current.filter(c => !c.isBrokenDown && c.type !== 'POLICE');
        if (potentialVictims.length > 1) {
          const victim = potentialVictims[Math.floor(Math.random() * potentialVictims.length)];
          handleCarBreakdownRef.current(victim);
        }
      }, 20000);
    } else if (breakdownIntervalRef.current) {
      clearInterval(breakdownIntervalRef.current);
    }

    return () => {
      if (breakdownIntervalRef.current) clearInterval(breakdownIntervalRef.current);
    };
  }, [isRunning, viewState]);

  useEffect(() => {
    if (isAnalyzing) {
      analysisCooldownRef.current = true;
      setTimeout(() => {
        analysisCooldownRef.current = false;
      }, 15000);
    }
  }, [isAnalyzing]);
  
  const handleUpdateStats = useCallback((totalCars: number, avgSpeed: number, queueMap: Record<string, number>) => {
    const totalQueued = Object.values(queueMap).reduce((sum, q) => sum + q, 0);
    const congestion = Math.min(100, Math.round((totalQueued / (totalCars + 1)) * 200 + (totalCars / 100) * 50));
    
    setStats(prevStats => ({
      ...prevStats,
      totalCars,
      avgSpeed,
      congestionLevel: isNaN(congestion) ? 0 : congestion,
      carbonEmission: totalCars * 0.12 * (1 + (isNaN(congestion) ? 0 : congestion)/100),
    }));
    setQueueLengthMap(queueMap);
  }, []);

  useEffect(() => {
    setStats(prev => ({...prev, incidents: incidents.length}));
  }, [incidents]);

  const handleIntersectionSelect = (id: string) => {
    setSelectedIntersectionId(id);
    setSelectedCarId(null);
    setSelectedIncidentId(null);
    setActiveTab('JUNCTION');
  };
  
  const handleCarSelect = (id: string) => {
    setSelectedCarId(id);
    setSelectedIntersectionId(null);
    setSelectedIncidentId(null);
    setActiveTab('UNIT');
  };
  
  const handleIncidentSelect = (id: string) => {
      setSelectedIncidentId(id);
      setSelectedCarId(null);
      setSelectedIntersectionId(null);
      setGeminiIncidentAnalysis(null);
      setActiveTab('INCIDENT');
  };

  const runGeminiAnalysis = async () => {
    if (analysisCooldownRef.current) return;
    setIsAnalyzing(true);
    const analysis = await analyzeTraffic(intersections, stats, queueLengthMap);
    setGeminiAnalysis(analysis);
    setIsAnalyzing(false);
  };
  
  const runGeminiIncidentAnalysis = async (incident: Incident) => {
      if(isIncidentAnalyzing) return;
      setIsIncidentAnalyzing(true);
      setGeminiIncidentAnalysis(null);
      const policeNearby = cars.filter(c => {
          if (c.type !== 'POLICE') return false;
          const dist = Math.hypot(c.x - incident.location.x, c.y - incident.location.y);
          return dist < 4 * BLOCK_SIZE;
      }).length;
      const analysis = await analyzeIncident(incident, policeNearby);
      setGeminiIncidentAnalysis(analysis);
      setIsIncidentAnalyzing(false);
  };
  
  const runRealWorldIntel = async (query: string, useLocation: boolean) => {
    setIsIntelLoading(true);
    setRealWorldIntel(null);
    let location: { latitude: number; longitude: number } | undefined = undefined;

    if (useLocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } catch (error) {
        console.error("Failed to get geolocation:", error);
      }
    }

    const intel = await getRealWorldIntel(query, currentCity, location);
    setRealWorldIntel(intel);
    setIsIntelLoading(false);
  };
  
  const applyGeminiSuggestions = () => {
    if (!geminiAnalysis || geminiAnalysis.suggestedChanges.length === 0) return;
    
    const updatedIds = new Set<string>();
    
    setIntersections(prev => 
      prev.map(i => {
        const change = geminiAnalysis.suggestedChanges.find(c => c.intersectionId === i.id);
        if (change) {
          updatedIds.add(i.id);
          return { ...i, greenDuration: change.newGreenDuration };
        }
        return i;
      })
    );
    
    setRecentlyUpdatedJunctions(updatedIds);
    setTimeout(() => {
      setRecentlyUpdatedJunctions(new Set());
    }, 5000);

    setGeminiAnalysis(null);
  };

  const initializeDashboard = (city: string) => {
    setCurrentCity(city);
    setIntersections(generateIntersections(CITY_CONFIGS[city]));
    setCars([]);
    setIncidents([]);
    setStats({ totalCars: 0, avgSpeed: 0, congestionLevel: 0, carbonEmission: 0, incidents: 0 });
    setActiveTab('OVERVIEW');
    setSelectedIntersectionId(null);
    setSelectedCarId(null);
    setSelectedIncidentId(null);
    setIsRunning(true);
    setGeminiAnalysis(null);
    setRealWorldIntel(null);
  };

  const handleNavigate = (page: string) => {
    if (page === 'DASHBOARD') {
      setIsBooting(true);
    } else {
      setIsBooting(false);
      setViewState(page as ViewState);
    }
  };

  const selectedIntersection = intersections.find(i => i.id === selectedIntersectionId);
  const selectedCar = cars.find(c => c.id === selectedCarId);
  const selectedIncident = incidents.find(i => i.id === selectedIncidentId);
  
  if (isBooting) {
    return <SystemBoot onComplete={() => {
        initializeDashboard(currentCity);
        setIsBooting(false);
        setViewState('DASHBOARD');
    }} />;
  }

  if (viewState === 'LANDING') return <LandingPage onNavigate={handleNavigate} />;
  if (viewState === 'FEATURES') return <FeaturesPage onNavigate={handleNavigate} />;
  if (viewState === 'PUBLIC_MAP') return <LiveMapPage onNavigate={handleNavigate} />;
  if (viewState === 'PUBLIC_DATA') return <PublicDataPage onNavigate={handleNavigate} />;
  if (viewState === 'API_DOCS') return <ApiDocsPage onNavigate={handleNavigate} />;
  if (viewState === 'AI_FEATURES') return <AiFeaturesPage onNavigate={handleNavigate} />;
  
  return (
    <div className="w-full h-screen bg-background bg-mesh text-gray-300 font-sans overflow-hidden flex animate-in fade-in duration-700">
      
      <div className="scanline"></div>
      
      {/* --- SIDEBAR --- */}
      <aside className="w-[380px] flex-shrink-0 glass rounded-r-2xl flex flex-col border-r border-t border-b border-white/5 z-20">
        <header className="h-16 flex-shrink-0 flex items-center gap-3 px-4 border-b border-white/5">
           <div className="w-9 h-9 rounded bg-gradient-to-br from-saffron to-red-600 flex items-center justify-center shadow-lg shadow-saffron/20 group cursor-pointer hover:scale-105 transition-transform" onClick={() => handleNavigate('LANDING')}>
               <GlobeAltIcon className="w-5 h-5 text-white group-hover:rotate-180 transition-transform duration-700" />
           </div>
           <div>
               <h1 className="text-xl font-tech font-bold tracking-[0.1em] text-white leading-none">
                 BHARAT<span className="text-saffron">FLOW</span>
               </h1>
               <div className="text-[10px] font-mono text-gray-500 tracking-[0.2em] uppercase">
                 COMMAND & CONTROL
               </div>
           </div>
        </header>
        
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-shrink-0 p-4 border-b border-white/5">
            <div className="grid grid-cols-2 gap-3">
              <StatsCard label="Congestion" value={`${stats.congestionLevel}%`} color={stats.congestionLevel > 60 ? 'danger' : 'success'} icon={<SignalIcon className="w-4 h-4"/>}/>
              <StatsCard label="Active Units" value={stats.totalCars} color="primary" icon={<TruckIcon className="w-4 h-4"/>}/>
              <StatsCard label="Avg. Speed" value={`${stats.avgSpeed.toFixed(0)} px/f`} color="accent" icon={<BoltIcon className="w-4 h-4"/>}/>
              <StatsCard label="Incidents" value={stats.incidents} color={stats.incidents > 0 ? 'warning' : 'saffron'} icon={<ExclamationTriangleIcon className="w-4 h-4"/>} />
            </div>
          </div>

          <nav className="flex-shrink-0 flex justify-around p-2 bg-black/20">
            {[
              { id: 'OVERVIEW', icon: ChartPieIcon, label: 'Overview' },
              { id: 'JUNCTION', icon: AdjustmentsHorizontalIcon, label: 'Junction' },
              { id: 'UNIT', icon: TruckIcon, label: 'Unit' },
              { id: 'INCIDENT', icon: ExclamationTriangleIcon, label: 'Incident' },
              { id: 'INTEL', icon: SparklesIcon, label: 'Intel' },
              { id: 'CCTV', icon: VideoCameraIcon, label: 'CCTV' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex-1 flex flex-col items-center p-2 rounded-lg transition-colors text-xs
                  ${activeTab === tab.id ? 'bg-accent/10 text-accent' : 'text-gray-500 hover:bg-white/5'}
                  ${
                    ((!selectedIntersection && tab.id === 'JUNCTION') || 
                     (!selectedCar && tab.id === 'UNIT') ||
                     (!selectedIncident && tab.id === 'INCIDENT')) 
                     ? 'opacity-50 cursor-not-allowed' : ''
                  }
                `}
                disabled={
                    (!selectedIntersection && tab.id === 'JUNCTION') || 
                    (!selectedCar && tab.id === 'UNIT') ||
                    (!selectedIncident && tab.id === 'INCIDENT')
                }
              >
                <tab.icon className="w-5 h-5 mb-1"/>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex-1 min-h-0 relative">
            {activeTab === 'OVERVIEW' &&
              <OverviewPanel
                stats={stats}
                currentCity={currentCity}
                totalJunctions={intersections.length}
              />
            }
            {activeTab === 'JUNCTION' && selectedIntersection && 
              <IntersectionDetails 
                intersection={selectedIntersection} 
                setIntersections={setIntersections}
                queueMap={queueLengthMap}
              />
            }
            {activeTab === 'UNIT' && selectedCar && 
              <VehicleDetails car={selectedCar} intersections={intersections} />
            }
            {activeTab === 'INCIDENT' && selectedIncident && 
              <IncidentDetails
                incident={selectedIncident}
                isAnalyzing={isIncidentAnalyzing}
                analysis={geminiIncidentAnalysis}
                onAnalyze={runGeminiIncidentAnalysis}
              />
            }
            {activeTab === 'INTEL' && 
              <IntelFeed 
                analysis={geminiAnalysis}
                isAnalyzing={isAnalyzing}
                onAnalyze={runGeminiAnalysis}
                onApply={applyGeminiSuggestions}
                realWorldIntel={realWorldIntel}
                isIntelLoading={isIntelLoading}
                onGetIntel={runRealWorldIntel}
              />
            }
          </div>
        </div>
      </aside>
      
      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 relative p-4">
        {activeTab !== 'CCTV' ? (
          <SimulationSection
            currentCity={currentCity}
            isRunning={isRunning}
            setIsRunning={setIsRunning}
            intersections={intersections}
            setIntersections={setIntersections}
            cars={cars}
            setCars={setCars}
            onUpdateStats={handleUpdateStats}
            onIntersectionSelect={handleIntersectionSelect}
            onCarSelect={handleCarSelect}
            onIncidentSelect={handleIncidentSelect}
            incidents={incidents}
            selectedIncidentId={selectedIncidentId}
            selectedCarId={selectedCarId}
            stats={stats}
            viewMode={viewMode}
            setViewMode={setViewMode}
            cvModeActive={cvModeActive}
            setCvModeActive={setCvModeActive}
            recentlyUpdatedJunctions={recentlyUpdatedJunctions}
            closedRoads={closedRoads}
          />
        ) : (
          <CameraFeed />
        )}
      </main>
    </div>
  );
};

export default App;