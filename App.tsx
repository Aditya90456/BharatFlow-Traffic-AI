import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { LandingPage } from './components/LandingPage';
import { FeaturesPage, LiveMapPage, PublicDataPage, ApiDocsPage, AiFeaturesPage, RealtimeAiPage, JunctionsAiPage, MlDesignPage } from './components/PublicPages';
import { SimulationSection } from './components/SimulationSection';
import { CameraFeed } from './components/CameraFeed';
import { StatsCard } from './components/StatsCard';
import { VehicleDetails } from './components/VehicleDetails';
import { IntersectionDetails, IntelFeed, IncidentDetails, OverviewPanel } from './components/SidePanels';
import { ResponsibleAiModal } from './components/ResponsibleAiModal';
import { DataHub } from './components/DataHub';
import { analyzeTraffic, analyzeIncident, getRealWorldIntel, interpretSearchQuery } from './services/geminiService';
import { Incident, Intersection, Car, LightState, TrafficStats, GeminiAnalysis, GeminiIncidentAnalysis, RealWorldIntel, Road, SearchResult, CongestedJunctionInfo } from './types';
import { GRID_SIZE, INITIAL_GREEN_DURATION, CITY_CONFIGS, CITY_COORDINATES, BLOCK_SIZE, ROAD_NAMES, MAX_SPEED } from './constants';
import { 
  ArrowLeftOnRectangleIcon, ChartPieIcon, AdjustmentsHorizontalIcon, TruckIcon, SparklesIcon, VideoCameraIcon, GlobeAltIcon,
  ClockIcon, BoltIcon, CloudIcon, SignalIcon, ExclamationTriangleIcon, CircleStackIcon
} from '@heroicons/react/24/outline';

type ViewState = 'LANDING' | 'DASHBOARD' | 'FEATURES' | 'PUBLIC_MAP' | 'PUBLIC_DATA' | 'API_DOCS' | 'AI_FEATURES' | 'REALTIME_AI' | 'JUNCTIONS_AI' | 'ML_DESIGN';
type ActiveTab = 'OVERVIEW' | 'JUNCTION' | 'UNIT' | 'INTEL' | 'CCTV' | 'INCIDENT' | 'DATA_HUB';

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

const generateRoads = (city: string): Road[] => {
    const roadNames = ROAD_NAMES[city] || ROAD_NAMES["Bangalore"];
    const roads: Road[] = [];
    let hIdx = 0;
    let vIdx = 0;

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            // Horizontal road to the right
            if (x < GRID_SIZE - 1) {
                const id1 = `INT-${x}-${y}`;
                const id2 = `INT-${x + 1}-${y}`;
                roads.push({
                    id: [id1, id2].sort().join('_'),
                    name: roadNames.horizontal[hIdx % roadNames.horizontal.length],
                    intersection1Id: id1,
                    intersection2Id: id2,
                });
            }
            // Vertical road downwards
            if (y < GRID_SIZE - 1) {
                const id1 = `INT-${x}-${y}`;
                const id2 = `INT-${x}-${y + 1}`;
                roads.push({
                    id: [id1, id2].sort().join('_'),
                    name: roadNames.vertical[vIdx % roadNames.vertical.length],
                    intersection1Id: id1,
                    intersection2Id: id2,
                });
            }
        }
        hIdx++;
        vIdx++;
    }
    return roads;
};

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('LANDING');
  const [isBooting, setIsBooting] = useState(false);
  
  const [currentCity, setCurrentCity] = useState<string>("Bangalore");
  const [intersections, setIntersections] = useState<Intersection[]>(() => generateIntersections(CITY_CONFIGS["Bangalore"]));
  const [roads, setRoads] = useState<Road[]>(() => generateRoads("Bangalore"));
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
  const [intelIncidentMessage, setIntelIncidentMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [highlightedVehicleIds, setHighlightedVehicleIds] = useState<Set<string> | null>(null);
  const [highlightedIncidentIds, setHighlightedIncidentIds] = useState<Set<string> | null>(null);

  const [isResponsibleAiModalOpen, setIsResponsibleAiModalOpen] = useState(false);
  const [lastAnalysisInput, setLastAnalysisInput] = useState<CongestedJunctionInfo[] | null>(null);

  const analysisCooldownRef = useRef(false);

  const handleBootComplete = () => {
    setIsBooting(false);
    setViewState('DASHBOARD');
  };

  const handleNavigate = (page: string) => {
    if (page === 'DASHBOARD' && viewState !== 'DASHBOARD') {
      setIsBooting(true);
    } else {
      setViewState(page as ViewState);
    }
  };

  const changeCity = useCallback((newCity: string) => {
    if (CITY_CONFIGS[newCity]) {
      setCurrentCity(newCity);
      setIntersections(generateIntersections(CITY_CONFIGS[newCity]));
      setRoads(generateRoads(newCity));
      setCars([]);
      setIncidents([]);
      setActiveTab('OVERVIEW');
      setSelectedCarId(null);
      setSelectedIntersectionId(null);
      setSelectedIncidentId(null);
      setGeminiAnalysis(null);
      setRealWorldIntel(null);
      setIntelIncidentMessage(null);
      setHighlightedVehicleIds(null);
      setHighlightedIncidentIds(null);
    }
  }, []);
  
  const updateStats = useCallback((totalCars: number, avgSpeed: number, queueMap: Record<string, number>) => {
    const congestion = Math.min(100, Math.round((totalCars / 100) * 80 + (2.5 - avgSpeed) * 10));
    setStats({
      totalCars,
      avgSpeed,
      congestionLevel: Math.max(0, congestion),
      carbonEmission: totalCars * 0.01 + (2.5 - avgSpeed) * 0.02,
      incidents: incidents.length,
    });
    setQueueLengthMap(queueMap);
  }, [incidents.length]);

  const handleIntersectionSelect = useCallback((id: string) => {
    setSelectedIntersectionId(id);
    setSelectedCarId(null);
    setSelectedIncidentId(null);
    setActiveTab('JUNCTION');
    setHighlightedVehicleIds(null);
    setHighlightedIncidentIds(null);
  }, []);

  const handleCarSelect = useCallback((id: string) => {
    setSelectedCarId(id);
    setSelectedIntersectionId(null);
    setSelectedIncidentId(null);
    setActiveTab('UNIT');
    setHighlightedVehicleIds(null);
    setHighlightedIncidentIds(null);
  }, []);

  const handleIncidentSelect = useCallback((id: string) => {
    setSelectedIncidentId(id);
    setSelectedCarId(null);
    setActiveTab('INCIDENT');
    setHighlightedVehicleIds(null);
    setHighlightedIncidentIds(null);
  }, []);

  const runGeminiAnalysis = useCallback(async () => {
    if (analysisCooldownRef.current) return;
    setIsAnalyzing(true);
    analysisCooldownRef.current = true;

    const congestedIntersections: CongestedJunctionInfo[] = intersections
        .map(i => {
            const nsQueue = (queueLengthMap[`${i.id}_N`] || 0) + (queueLengthMap[`${i.id}_S`] || 0);
            const ewQueue = (queueLengthMap[`${i.id}_E`] || 0) + (queueLengthMap[`${i.id}_W`] || 0);
            return { id: i.id, label: i.label, nsQueue, ewQueue, totalQueue: nsQueue + ewQueue };
        })
        .filter(i => i.totalQueue > 5)
        .sort((a, b) => b.totalQueue - a.totalQueue)
        .map(({ totalQueue, ...rest }) => rest);
    
    setLastAnalysisInput(congestedIntersections);
    const analysis = await analyzeTraffic(congestedIntersections, stats);
    setGeminiAnalysis(analysis);
    setIsAnalyzing(false);
    setTimeout(() => analysisCooldownRef.current = false, 5000);
  }, [intersections, queueLengthMap, stats]);

  const applyGeminiSuggestions = useCallback(() => {
    if (!geminiAnalysis) return;
    const updatedIds = new Set<string>();
    setIntersections(prev => {
      return prev.map(intersection => {
        const change = geminiAnalysis.suggestedChanges.find(c => c.intersectionId === intersection.id);
        if (change) {
          updatedIds.add(intersection.id);
          return { ...intersection, greenDuration: change.newGreenDuration };
        }
        return intersection;
      });
    });
    setRecentlyUpdatedJunctions(updatedIds);
    setTimeout(() => setRecentlyUpdatedJunctions(new Set()), 10000); // Visual effect lasts 10s
    setGeminiAnalysis(null);
  }, [geminiAnalysis]);

  const runIncidentAnalysis = useCallback(async (incident: Incident) => {
      setIsIncidentAnalyzing(true);
      setGeminiIncidentAnalysis(null);
      const nearbyPolice = cars.filter(c => {
          if (c.type !== 'POLICE') return false;
          const dist = Math.hypot(c.x - incident.location.x, c.y - incident.location.y);
          return dist < BLOCK_SIZE * 2;
      }).length;
      const analysis = await analyzeIncident(incident, nearbyPolice);
      setGeminiIncidentAnalysis(analysis);
      setIsIncidentAnalyzing(false);
  }, [cars]);
  
  const getIntel = useCallback(async (query: string, useLocation: boolean) => {
    setIsIntelLoading(true);
    setRealWorldIntel(null);
    setIntelIncidentMessage(null);

    let location: { latitude: number; longitude: number } | undefined = undefined;
    if (useLocation && CITY_COORDINATES[currentCity]) {
      const cityCoords = CITY_COORDINATES[currentCity];
      location = { latitude: cityCoords.lat, longitude: cityCoords.lng };
    }
    
    const intel = await getRealWorldIntel(query, currentCity, intersections.map(i => i.label), location);
    
    // Check for incident creation directive
    const incidentMatch = intel.intel.match(/INCIDENT::(.+?)::(ACCIDENT|CONSTRUCTION)::(.+)/);
    if (incidentMatch) {
      const [, intersectionLabel, type, description] = incidentMatch;
      const targetIntersection = intersections.find(i => i.label === intersectionLabel.trim());
      if (targetIntersection) {
        const newIncident: Incident = {
          id: `INC-AI-${Date.now()}`,
          type: type as 'ACCIDENT' | 'CONSTRUCTION',
          location: { x: (targetIntersection.x + 0.5) * BLOCK_SIZE, y: (targetIntersection.y + 0.5) * BLOCK_SIZE },
          description,
          severity: type === 'ACCIDENT' ? 'HIGH' : 'MEDIUM',
          timestamp: Date.now(),
        };
        setIncidents(prev => [...prev, newIncident]);
        setIntelIncidentMessage(`AI detected a real-world event and created an incident marker at ${intersectionLabel}.`);
        // Clean up the intel text for display
        intel.intel = intel.intel.replace(/INCIDENT::.+/, '').trim();
      }
    }

    setRealWorldIntel(intel);
    setIsIntelLoading(false);
  }, [currentCity, intersections]);
  
  const handleSearchResultSelect = (result: SearchResult) => {
    setSearchQuery('');
    setSearchResults([]);
    if (result.type === 'CITY') {
      changeCity(result.name);
    } else if (result.type === 'INTERSECTION') {
      handleIntersectionSelect(result.id);
    } else if (result.type === 'ROAD') {
      const road = roads.find(r => r.id === result.id);
      if (road) {
        handleIntersectionSelect(road.intersection1Id);
      }
    }
  };

  const handleAiSearch = async (query: string) => {
    setIsAiSearching(true);
    setHighlightedVehicleIds(null);
    setHighlightedIncidentIds(null);

    const actions = await interpretSearchQuery(query, intersections, cars, incidents);

    if (actions && actions.length > 0) {
      const action = actions[0]; // Handle first action
      if (action.name === 'select_object') {
        const { type, name_or_id } = action.args;
        if (type === 'INTERSECTION') {
          const target = intersections.find(i => i.id === name_or_id || i.label.toLowerCase() === name_or_id.toLowerCase());
          if (target) handleIntersectionSelect(target.id);
        }
      } else if (action.name === 'find_most_congested_junction') {
          const congestedJunction = intersections
            .map(i => {
                const nsQueue = (queueLengthMap[`${i.id}_N`] || 0) + (queueLengthMap[`${i.id}_S`] || 0);
                const ewQueue = (queueLengthMap[`${i.id}_E`] || 0) + (queueLengthMap[`${i.id}_W`] || 0);
                return { ...i, totalQueue: nsQueue + ewQueue };
            })
            .sort((a, b) => b.totalQueue - a.totalQueue)[0];
          if(congestedJunction) handleIntersectionSelect(congestedJunction.id);

      } else if (action.name === 'find_all_units_of_type') {
          const { type } = action.args;
          const matchingIds = new Set<string>();
          cars.forEach(car => {
            if (type === 'BROKEN_DOWN' && car.isBrokenDown) {
              matchingIds.add(car.id);
            } else if (car.type === type) {
              matchingIds.add(car.id);
            }
          });
          setHighlightedVehicleIds(matchingIds);
      } else if (action.name === 'find_incidents_by_severity') {
          const { severity } = action.args;
          const matchingIds = new Set<string>();
          incidents.forEach(incident => {
              if (incident.severity === severity) {
                  matchingIds.add(incident.id);
              }
          });
          setHighlightedIncidentIds(matchingIds);
      }
    }
    setSearchQuery('');
    setIsAiSearching(false);
  };
  
  useEffect(() => {
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      const cityResults = Object.keys(CITY_CONFIGS)
        .filter(name => name.toLowerCase().includes(lowerQuery))
        .map(name => ({ type: 'CITY', id: name, name } as SearchResult));
      
      const intersectionResults = intersections
        .filter(i => i.label.toLowerCase().includes(lowerQuery))
        .map(i => ({ type: 'INTERSECTION', id: i.id, name: i.label } as SearchResult));
        
      const roadResults = roads
        .filter(r => r.name.toLowerCase().includes(lowerQuery))
        .map(r => ({ type: 'ROAD', id: r.id, name: r.name } as SearchResult));

      setSearchResults([...cityResults, ...intersectionResults, ...roadResults]);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, intersections, roads]);

  const selectedIntersection = useMemo(() => intersections.find(i => i.id === selectedIntersectionId), [intersections, selectedIntersectionId]);
  const selectedCar = useMemo(() => cars.find(c => c.id === selectedCarId), [cars, selectedCarId]);
  const selectedIncident = useMemo(() => incidents.find(i => i.id === selectedIncidentId), [incidents, selectedIncidentId]);

  return (
    <>
      {isBooting && <SystemBoot onComplete={handleBootComplete} />}

      {viewState === 'LANDING' && <LandingPage onNavigate={handleNavigate} />}
      {viewState === 'FEATURES' && <FeaturesPage onNavigate={handleNavigate} />}
      {viewState === 'AI_FEATURES' && <AiFeaturesPage onNavigate={handleNavigate} />}
      {viewState === 'REALTIME_AI' && <RealtimeAiPage onNavigate={handleNavigate} />}
      {viewState === 'JUNCTIONS_AI' && <JunctionsAiPage onNavigate={handleNavigate} />}
      {viewState === 'ML_DESIGN' && <MlDesignPage onNavigate={handleNavigate} />}
      {viewState === 'PUBLIC_MAP' && <LiveMapPage onNavigate={handleNavigate} />}
      {viewState === 'PUBLIC_DATA' && <PublicDataPage onNavigate={handleNavigate} />}
      {viewState === 'API_DOCS' && <ApiDocsPage onNavigate={handleNavigate} />}
      
      <div className={`
        fixed inset-0 bg-mesh bg-mesh-pattern transition-opacity duration-1000
        ${viewState === 'DASHBOARD' ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}>
        <div className="w-full h-full p-2.5 flex gap-2.5">

          {/* Left Panel: Main Simulation */}
          <div className="flex-[3] relative">
            <SimulationSection 
                currentCity={currentCity}
                isRunning={isRunning}
                setIsRunning={setIsRunning}
                intersections={intersections}
                setIntersections={setIntersections}
                cars={cars}
                setCars={setCars}
                onUpdateStats={updateStats}
                onIntersectionSelect={handleIntersectionSelect}
                onCarSelect={handleCarSelect}
                selectedCarId={selectedCarId}
                stats={stats}
                viewMode={viewMode}
                setViewMode={setViewMode}
                cvModeActive={cvModeActive}
                setCvModeActive={setCvModeActive}
                recentlyUpdatedJunctions={recentlyUpdatedJunctions}
                incidents={incidents}
                onIncidentSelect={handleIncidentSelect}
                setIncidents={setIncidents}
                selectedIncidentId={selectedIncidentId}
                closedRoads={new Set(incidents.filter(i => i.blocksSegmentId).map(i => i.blocksSegmentId!))}
                roads={roads}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchResults={searchResults}
                onSearchResultSelect={handleSearchResultSelect}
                isAiSearching={isAiSearching}
                handleAiSearch={handleAiSearch}
                highlightedVehicleIds={highlightedVehicleIds}
                highlightedIncidentIds={highlightedIncidentIds}
            />
          </div>

          {/* Right Panel: Controls & Details */}
          <div className="flex-1 min-w-[380px] flex flex-col gap-2.5">
            <div className="relative flex-1">
               {activeTab === 'CCTV' ? <CameraFeed /> : (
                 <div className="absolute inset-0 bg-surfaceHighlight/30 rounded-2xl border border-white/5 p-1.5 backdrop-blur-sm">
                    <div className="w-full h-full bg-background/50 rounded-xl border border-white/5 flex flex-col">
                        <div className="h-12 border-b border-white/5 bg-surface/50 flex items-center px-4">
                           <h2 className="text-sm font-tech font-bold text-white tracking-widest uppercase">
                            {activeTab} DETAILS
                           </h2>
                        </div>
                        <div className="flex-1 min-h-0">
                           {activeTab === 'OVERVIEW' && <OverviewPanel stats={stats} currentCity={currentCity} totalJunctions={intersections.length} />}
                           {activeTab === 'JUNCTION' && selectedIntersection && <IntersectionDetails intersection={selectedIntersection} setIntersections={setIntersections} queueMap={queueLengthMap} />}
                           {activeTab === 'UNIT' && selectedCar && <VehicleDetails car={selectedCar} intersections={intersections} roads={roads} />}
                           {activeTab === 'INTEL' && <IntelFeed analysis={geminiAnalysis} isAnalyzing={isAnalyzing} onAnalyze={runGeminiAnalysis} onApply={applyGeminiSuggestions} realWorldIntel={realWorldIntel} isIntelLoading={isIntelLoading} onGetIntel={getIntel} onOpenResponsibleAiModal={() => setIsResponsibleAiModalOpen(true)} incidentCreatedMessage={intelIncidentMessage} />}
                           {activeTab === 'INCIDENT' && selectedIncident && <IncidentDetails incident={selectedIncident} isAnalyzing={isIncidentAnalyzing} analysis={geminiIncidentAnalysis} onAnalyze={runIncidentAnalysis} roads={roads} />}
                           {activeTab === 'DATA_HUB' && <DataHub incidents={incidents} cars={cars} roads={roads} onSelectIncident={handleIncidentSelect} onSelectCar={handleCarSelect} />}
                        </div>
                    </div>
                </div>
               )}
            </div>

            <div className="flex-1 bg-surfaceHighlight/30 rounded-2xl border border-white/5 p-1.5 backdrop-blur-sm">
               <div className="w-full h-full bg-background/50 rounded-xl border border-white/5 flex flex-col">
                   <nav className="h-12 border-b border-white/5 bg-surface/50 grid grid-cols-7">
                        {[
                          { id: 'OVERVIEW', icon: ChartPieIcon }, { id: 'JUNCTION', icon: AdjustmentsHorizontalIcon },
                          { id: 'UNIT', icon: TruckIcon }, { id: 'INTEL', icon: SparklesIcon },
                          { id: 'CCTV', icon: VideoCameraIcon }, { id: 'INCIDENT', icon: ExclamationTriangleIcon },
                          { id: 'DATA_HUB', icon: CircleStackIcon }
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as ActiveTab)}
                                className={`flex items-center justify-center transition-colors border-b-2 ${activeTab === item.id ? 'text-accent border-accent bg-accent/5' : 'text-gray-500 border-transparent hover:bg-white/5 hover:text-white'}`}
                                title={item.id}
                            >
                                <item.icon className="w-5 h-5" />
                            </button>
                        ))}
                   </nav>
                   <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto">
                     <StatsCard label="Congestion" value={`${stats.congestionLevel}%`} unit="GRIDLOAD" color="danger" icon={<SignalIcon className="w-5 h-5"/>}/>
                     <StatsCard label="Avg Speed" value={stats.avgSpeed.toFixed(1)} unit="px/f" color="accent" icon={<BoltIcon className="w-5 h-5"/>} />
                     <StatsCard label="Simulated CO2" value={stats.carbonEmission.toFixed(2)} unit="kg" color="saffron" icon={<CloudIcon className="w-5 h-5"/>}/>
                   </div>
                   <button onClick={() => setViewState('LANDING')} className="m-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-bold flex items-center justify-center gap-2">
                     <ArrowLeftOnRectangleIcon className="w-4 h-4"/>
                     <span>DISCONNECT</span>
                   </button>
               </div>
            </div>
          </div>
        </div>
      </div>
      
      <ResponsibleAiModal 
        isOpen={isResponsibleAiModalOpen}
        onClose={() => setIsResponsibleAiModalOpen(false)}
        analysis={geminiAnalysis}
        analysisInput={lastAnalysisInput}
        stats={stats}
      />
    </>
  );
};

export default App;