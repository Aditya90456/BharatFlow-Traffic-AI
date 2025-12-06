import React from 'react';
import { SimulationCanvas } from './SimulationCanvas';
import { TrafficStats, Intersection, Car, Incident } from '../types';
import { PlayIcon, PauseIcon, ArrowsPointingOutIcon, GlobeAsiaAustraliaIcon, Squares2X2Icon, CpuChipIcon } from '@heroicons/react/24/outline';

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
  selectedIncidentId: string | null;
  closedRoads: Set<string>;
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
  selectedIncidentId,
  closedRoads,
}) => {
  return (
    <main className={`
      absolute inset-0 flex flex-col min-w-0 bg-surfaceHighlight/30 rounded-2xl border p-1.5 backdrop-blur-sm overflow-hidden transition-all duration-300
      ${cvModeActive ? 'border-green-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-white/5'}
    `}>
        
        {/* Inner Container for the Monitor Look */}
        <div className="flex-1 flex flex-col bg-background/50 rounded-xl border border-white/5 relative overflow-hidden">
            
            {/* Simulation Header / Toolbar */}
            <div className="h-12 border-b border-white/5 bg-surface/50 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                    <div>
                        <h2 className="text-sm font-tech font-bold text-white tracking-widest uppercase">
                           SECTOR FEED: <span className="text-accent">{currentCity}</span>
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-2">
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
                          selectedIncidentId={selectedIncidentId}
                          closedRoads={closedRoads}
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