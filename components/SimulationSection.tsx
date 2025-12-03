
import React from 'react';
import { SimulationCanvas } from './SimulationCanvas';
import { TrafficStats, Intersection, Car } from '../types';
import { PlayIcon, PauseIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

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
  stats: TrafficStats;
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
  stats
}) => {
  return (
    <main className="flex-1 relative flex flex-col min-w-0 bg-surfaceHighlight/30 rounded-2xl border border-white/5 p-1.5 backdrop-blur-sm overflow-hidden">
        
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
                     <button className="text-gray-500 hover:text-white transition-colors">
                        <ArrowsPointingOutIcon className="w-4 h-4" />
                     </button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative flex items-center justify-center bg-[#08090d] shadow-inner overflow-hidden group">
                   
                   {/* HUD Elements */}
                   <div className="absolute top-4 left-4 text-[10px] font-mono text-accent/50 pointer-events-none z-20">
                       CAM-01 [ACTIVE]
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

                   <SimulationCanvas 
                      intersections={intersections}
                      setIntersections={setIntersections}
                      cars={cars}
                      setCars={setCars}
                      onUpdateStats={onUpdateStats}
                      isRunning={isRunning}
                      onIntersectionSelect={onIntersectionSelect}
                      scenarioKey={currentCity}
                   />
                   
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
