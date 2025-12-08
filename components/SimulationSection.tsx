import React, { useState } from 'react';
import { SimulationCanvas } from './SimulationCanvas';
import { TrafficStats, Intersection, Car, Incident, Road, SearchResult } from '../types';
import { PlayIcon, PauseIcon, ArrowsPointingOutIcon, GlobeAsiaAustraliaIcon, Squares2X2Icon, CpuChipIcon, MagnifyingGlassIcon, MapIcon, ArrowsRightLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface SimulationSectionProps {
  currentCity: string;
  isRunning: boolean;
  setIsRunning: (val: boolean) => void;
  intersections: Intersection[];
  setIntersections: React.Dispatch<React.SetStateAction<Intersection[]>>;
  cars: Car[];
  setCars: React.Dispatch<React.SetStateAction<Car[]>>;
  onUpdateStats: (total: number, speed: number, queues: Record<string, number>) => void;
  onIntersectionSelect: (id: string) => void;
  onCarSelect: (id: string) => void;
  selectedCarId: string | null;
  stats: TrafficStats;
  viewMode: 'GRID' | 'SATELLITE';
  setViewMode: (mode: 'GRID' | 'SATELLITE') => void;
  cvModeActive: boolean;
  setCvModeActive: (active: boolean) => void;
  recentlyUpdatedJunctions: Set<string>;
  incidents: Incident[];
  onIncidentSelect: (id: string) => void;
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
  selectedIncidentId: string | null;
  closedRoads: Set<string>;
  roads: Road[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  onSearchResultSelect: (result: SearchResult) => void;
  isAiSearching: boolean;
  handleAiSearch: (query: string) => void;
  highlightedVehicleIds: Set<string> | null;
  highlightedIncidentIds: Set<string> | null;
}

export const SimulationSection: React.FC<SimulationSectionProps> = ({
  currentCity,
  isRunning,
  setIsRunning,
  intersections,
  setIntersections,
  cars,
  setCars,
  onUpdateStats,
  onIntersectionSelect,
  onCarSelect,
  selectedCarId,
  stats,
  viewMode,
  setViewMode,
  cvModeActive,
  setCvModeActive,
  recentlyUpdatedJunctions,
  incidents,
  onIncidentSelect,
  setIncidents,
  selectedIncidentId,
  closedRoads,
  roads,
  searchQuery,
  setSearchQuery,
  searchResults,
  onSearchResultSelect,
  isAiSearching,
  handleAiSearch,
  highlightedVehicleIds,
  highlightedIncidentIds,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const groupedResults = searchResults.reduce((acc, result) => {
    const type = result.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(result);
    return acc;
  }, {} as Record<SearchResult['type'], SearchResult[]>);

  const resultOrder: SearchResult['type'][] = ['CITY', 'INTERSECTION', 'ROAD'];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery) {
      e.preventDefault();
      handleAiSearch(searchQuery);
      setIsSearchFocused(false);
    }
  };

  return (
    <main className={`
      absolute inset-0 flex flex-col min-w-0 bg-surfaceHighlight/30 rounded-2xl border p-1.5 backdrop-blur-sm overflow-hidden transition-all duration-300
      ${cvModeActive ? 'border-green-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-white/5'}
    `}>
        
        {/* Inner Container for the Monitor Look */}
        <div className="flex-1 flex flex-col bg-background/50 rounded-xl border border-white/5 relative overflow-hidden">
            
            {/* Simulation Header / Toolbar */}
            <div className="h-12 border-b border-white/5 bg-surface/50 flex items-center justify-between px-4 gap-4 z-30">
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                    <div>
                        <h2 className="text-sm font-tech font-bold text-white tracking-widest uppercase">
                           SECTOR FEED: <span className="text-accent">{currentCity}</span>
                        </h2>
                    </div>
                </div>
                
                <div className="flex-1 flex justify-center min-w-0">
                    <div className="relative w-full max-w-lg">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Filter or ask AI (e.g., 'find police cars')"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-surface/80 border border-border rounded-lg pl-9 pr-20 py-1.5 text-sm placeholder-gray-500 focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                        />
                         {isAiSearching ? (
                            <svg className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                           searchQuery && <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center text-gray-600 text-[10px] font-mono border border-gray-700 rounded px-1.5 py-0.5">
                                AI <span className="ml-1">↵</span>
                            </div>
                        )}
                         {isSearchFocused && searchResults.length > 0 && (
                            <div className="absolute top-full mt-2 w-full bg-surface border border-border rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in duration-200">
                                <ul className="max-h-80 overflow-y-auto">
                                    {resultOrder.map(type => {
                                      if (!groupedResults[type]) return null;
                                      return (
                                        <li key={type}>
                                          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-background/50 sticky top-0">
                                            {type}s
                                          </div>
                                          <ul>
                                            {groupedResults[type].map(result => (
                                              <li
                                                key={result.id}
                                                className="flex items-center gap-3 px-3 py-2 hover:bg-accent/10 cursor-pointer text-sm"
                                                onMouseDown={() => onSearchResultSelect(result)}
                                              >
                                                {result.type === 'CITY' && <GlobeAsiaAustraliaIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                                                {result.type === 'INTERSECTION' && <Squares2X2Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                                                {result.type === 'ROAD' && <ArrowsRightLeftIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                                                <span className="text-gray-200 truncate">{result.name}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </li>
                                      )
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                     <button 
                       onClick={() => setIsRunning(!isRunning)} 
                       className={`
                         flex items-center gap-2 px-3 py-1 rounded text-[10px] font-mono font-bold border transition-all uppercase tracking-wider
                         ${isRunning ? 'border-accent/30 bg-accent/10 text-accent hover:bg-accent/20' : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500'}
                       `}
                     >
                        {isRunning ? <PauseIcon className="w-3 h-3" /> : <PlayIcon className="w-3 h-3" />}
                        {isRunning ? 'Live' : 'Paused'}
                     </button>
                     <div className="w-px h-4 bg-white/10 mx-1"></div>
                     <button
                        onClick={() => setCvModeActive(!cvModeActive)}
                        className={`text-gray-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10 ${cvModeActive ? 'bg-green-500/10 !text-green-400' : ''}`}
                        title="Toggle CV Analysis Overlay"
                     >
                        <CpuChipIcon className="w-4 h-4" />
                     </button>
                     <button
                        onClick={() => setViewMode(viewMode === 'GRID' ? 'SATELLITE' : 'GRID')}
                        className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10"
                        title={`Switch to ${viewMode === 'GRID' ? 'Satellite' : 'Grid'} View`}
                     >
                        {viewMode === 'GRID' ? <GlobeAsiaAustraliaIcon className="w-4 h-4" /> : <Squares2X2Icon className="w-4 h-4" />}
                     </button>
                     <button className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10">
                        <ArrowsPointingOutIcon className="w-4 h-4" />
                     </button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className={`
                flex-1 relative flex items-center justify-center bg-[#08090d] shadow-inner overflow-hidden group
                ${viewMode === 'SATELLITE' ? 'satellite-view-container' : ''}
            `}>
                   
                   {/* HUD Elements */}
                   <div className="absolute top-4 left-4 text-[10px] font-mono text-accent/50 pointer-events-none z-20">
                       CAM-01 [{cvModeActive ? 'CV-MODE' : 'ACTIVE'}]
                   </div>
                   <div className="absolute top-4 right-4 text-[10px] font-mono text-accent/50 pointer-events-none z-20">
                       {isRunning ? 'REC ●' : 'PAUSED'}
                   </div>

                   {/* Corner Brackets */}
                   <div className="hud-bracket hud-bracket-tl opacity-50 group-hover:opacity-100 z-20"></div>
                   <div className="hud-bracket hud-bracket-tr opacity-50 group-hover:opacity-100 z-20"></div>
                   <div className="hud-bracket hud-bracket-bl opacity-50 group-hover:opacity-100 z-20"></div>
                   <div className="hud-bracket hud-bracket-br opacity-50 group-hover:opacity-100 z-20"></div>
                   
                   {/* Grid Background */}
                   <div className="absolute inset-0 pointer-events-none opacity-10 z-10" 
                        style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px'}}>
                   </div>

                   <div className={`relative transition-all duration-700 ease-in-out ${viewMode === 'SATELLITE' ? 'satellite-view-canvas' : 'grid-view-canvas'}`}>
                      <SimulationCanvas 
                          intersections={intersections}
                          setIntersections={setIntersections}
                          cars={cars}
                          setCars={setCars}
                          onUpdateStats={onUpdateStats}
                          isRunning={isRunning}
                          onIntersectionSelect={onIntersectionSelect}
                          onCarSelect={onCarSelect}
                          selectedCarId={selectedCarId}
                          scenarioKey={currentCity}
                          cvModeActive={cvModeActive}
                          recentlyUpdatedJunctions={recentlyUpdatedJunctions}
                          incidents={incidents}
                          onIncidentSelect={onIncidentSelect}
                          setIncidents={setIncidents}
                          selectedIncidentId={selectedIncidentId}
                          closedRoads={closedRoads}
                          roads={roads}
                          highlightedVehicleIds={highlightedVehicleIds}
                          highlightedIncidentIds={highlightedIncidentIds}
                      />
                   </div>
                   
                   {/* Overlay Stats - Floating Glass Cards */}
                   <div className="absolute bottom-6 left-6 pointer-events-none flex flex-col gap-2 z-20">
                         <div className="bg-black/80 backdrop-blur border-l-2 border-accent pl-3 pr-4 py-2 rounded-r shadow-2xl">
                            <div className="text-[9px] text-gray-400 font-bold tracking-widest uppercase mb-0.5">Active Units</div>
                            <div className="text-xl font-tech text-white leading-none tracking-wider">{stats.totalCars}</div>
                         </div>
                         <div className="bg-black/80 backdrop-blur border-l-2 border-saffron pl-3 pr-4 py-2 rounded-r shadow-2xl">
                            <div className="text-[9px] text-gray-400 font-bold tracking-widest uppercase mb-0.5">Velocity</div>
                            <div className="text-xl font-tech text-white leading-none tracking-wider">{stats.avgSpeed.toFixed(1)} <span className="text-[9px] text-gray-500">px/f</span></div>
                         </div>
                   </div>
            </div>
        </div>
    </main>
  );
};