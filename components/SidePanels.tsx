import React, { useState } from 'react';
import { Intersection, GeminiAnalysis, Incident, GeminiIncidentAnalysis, RealWorldIntel, TrafficStats } from '../types';
import { LightBulbIcon, ArrowsRightLeftIcon, ClockIcon, PlayIcon, SparklesIcon, CheckCircleIcon, ExclamationTriangleIcon, ChatBubbleBottomCenterTextIcon, ShieldCheckIcon, SignalIcon, BoltIcon, CloudIcon, CpuChipIcon } from '@heroicons/react/24/outline';

interface IntersectionDetailsProps {
    intersection: Intersection;
    setIntersections: React.Dispatch<React.SetStateAction<Intersection[]>>;
    queueMap: Record<string, number>;
}

export const IntersectionDetails: React.FC<IntersectionDetailsProps> = ({ intersection, setIntersections, queueMap }) => {
    const nsQueue = (queueMap[`${intersection.id}_N`] || 0) + (queueMap[`${intersection.id}_S`] || 0);
    const ewQueue = (queueMap[`${intersection.id}_E`] || 0) + (queueMap[`${intersection.id}_W`] || 0);

    const handleOverride = (override: 'NS_GREEN' | 'EW_GREEN' | 'EMERGENCY_ALL_RED' | null) => {
        setIntersections(prev => prev.map(i => i.id === intersection.id ? { ...i, overrideState: override } : i));
    };

    return (
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
            <div className="pb-4 border-b border-white/10">
                <h3 className="text-lg font-tech font-bold text-white uppercase">{intersection.label}</h3>
                <p className="font-mono text-xs text-gray-500">{intersection.id}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-surface text-center">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">N-S Queue</p>
                    <p className="text-2xl font-tech text-white">{nsQueue}</p>
                </div>
                 <div className="p-3 rounded-lg bg-surface text-center">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">E-W Queue</p>
                    <p className="text-2xl font-tech text-white">{ewQueue}</p>
                </div>
            </div>

             <div className="p-3 rounded-lg bg-surface flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <ClockIcon className="w-5 h-5 text-accent"/>
                   <span className="text-sm">Timer</span>
                </div>
                <span className="font-mono text-white bg-black/30 px-2 py-1 rounded text-sm">{intersection.timer}f</span>
             </div>
             <div className="p-3 rounded-lg bg-surface flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <PlayIcon className="w-5 h-5 text-green-500"/>
                   <span className="text-sm">Green Duration</span>
                </div>
                <span className="font-mono text-white bg-black/30 px-2 py-1 rounded text-sm">{intersection.greenDuration}f</span>
             </div>

            <div className="mt-4">
                <h4 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-2">Manual Override</h4>
                <div className="space-y-2">
                    <button onClick={() => handleOverride('NS_GREEN')} className="w-full text-left p-2 rounded bg-surface hover:bg-surfaceHighlight transition-colors text-sm">Force North-South Green</button>
                    <button onClick={() => handleOverride('EW_GREEN')} className="w-full text-left p-2 rounded bg-surface hover:bg-surfaceHighlight transition-colors text-sm">Force East-West Green</button>
                    <button onClick={() => handleOverride('EMERGENCY_ALL_RED')} className="w-full text-left p-2 rounded bg-surface hover:bg-surfaceHighlight transition-colors text-sm text-red-400">Emergency All Red</button>
                    <button onClick={() => handleOverride(null)} className="w-full text-left p-2 rounded bg-surface hover:bg-surfaceHighlight transition-colors text-sm text-yellow-400">Return to Auto</button>
                </div>
            </div>
        </div>
    );
};

interface IntelFeedProps {
    analysis: GeminiAnalysis | null;
    isAnalyzing: boolean;
    onAnalyze: () => void;
    onApply: () => void;
    realWorldIntel: RealWorldIntel | null;
    isIntelLoading: boolean;
    onGetIntel: (query: string, useLocation: boolean) => void;
}

export const IntelFeed: React.FC<IntelFeedProps> = ({ 
    analysis, isAnalyzing, onAnalyze, onApply,
    realWorldIntel, isIntelLoading, onGetIntel
}) => {
    const [query, setQuery] = useState('');
    const [useLocation, setUseLocation] = useState(false);

    const handleGetIntel = () => {
        if (query.trim()) {
            onGetIntel(query, useLocation);
        }
    };
    
    return (
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
            <div>
                <h3 className="text-lg font-tech font-bold text-white uppercase">AI Intelligence Feed</h3>
                <p className="font-mono text-xs text-gray-500">Grid Simulation & Real-World Analysis</p>
            </div>
            
            {/* Grid Simulation Analysis */}
            <div className="p-3 rounded-lg bg-surface flex flex-col gap-3">
                 <h4 className="text-xs font-mono uppercase tracking-widest text-gray-400">Grid Simulation Analysis</h4>
                <button
                    onClick={onAnalyze}
                    disabled={isAnalyzing}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/80 hover:bg-primary transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-sm"
                >
                    {isAnalyzing ? (
                        <><SparklesIcon className="w-4 h-4 animate-spin" /><span>Analyzing Grid...</span></>
                    ) : (
                        <><SparklesIcon className="w-4 h-4" /><span>Request Grid Analysis</span></>
                    )}
                </button>
                {analysis ? (
                    <div className="text-sm space-y-3 animate-in fade-in">
                        <div>
                           <p className="text-purple-300 font-bold text-xs mb-1">STATUS</p>
                           <p className="text-gray-300">{analysis.analysis}</p>
                        </div>
                        {analysis.suggestedChanges.length > 0 && (
                            <div>
                               <p className="text-purple-300 font-bold text-xs mb-1">ACTIONS</p>
                               <ul className="space-y-1">
                                  {analysis.suggestedChanges.map(change => (
                                    <li key={change.intersectionId} className="p-1.5 bg-black/30 border-l-2 border-accent rounded-r">
                                        <p className="font-bold text-accent text-xs">{change.intersectionId}</p>
                                        <p className="text-xs text-gray-400">{change.reason}</p>
                                    </li>
                                  ))}
                               </ul>
                            </div>
                        )}
                        {analysis.suggestedChanges.length > 0 && (
                             <button
                                onClick={onApply}
                                className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-lg bg-green-600 hover:bg-green-500 transition-colors text-sm"
                            >
                                <CheckCircleIcon className="w-4 h-4" />
                                Apply Suggestions
                            </button>
                        )}
                    </div>
                ) : (
                    <p className="text-xs text-gray-600 text-center py-2">No active grid analysis.</p>
                )}
            </div>

             {/* Real-World Intelligence */}
            <div className="p-3 rounded-lg bg-surface flex flex-col gap-3">
                <h4 className="text-xs font-mono uppercase tracking-widest text-gray-400">Real-World Intelligence</h4>
                <div className="relative">
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGetIntel()}
                        placeholder="e.g., major events today?"
                        className="w-full bg-black/50 border border-border rounded-md p-2 pr-20 text-sm focus:ring-accent focus:border-accent"
                    />
                    <button 
                        onClick={handleGetIntel}
                        disabled={isIntelLoading || !query.trim()}
                        className="absolute right-1 top-1 bottom-1 px-3 bg-primary rounded text-xs font-bold hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        {isIntelLoading ? '...' : 'Search'}
                    </button>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                    <input type="checkbox" checked={useLocation} onChange={(e) => setUseLocation(e.target.checked)} className="rounded bg-surface border-border text-primary focus:ring-primary" />
                    Add current location for context
                </label>

                <div className="min-h-[100px] flex flex-col">
                    {isIntelLoading && <p className="m-auto text-gray-500 text-sm">Searching the web...</p>}
                    {realWorldIntel && (
                        <div className="text-sm space-y-3 animate-in fade-in">
                        <p className="text-gray-300 whitespace-pre-wrap">{realWorldIntel.intel}</p>
                        {realWorldIntel.sources.length > 0 && (
                            <div>
                            <h5 className="text-xs font-bold text-gray-500 uppercase mb-1">Sources:</h5>
                            <ul className="space-y-1 list-disc list-inside">
                                {realWorldIntel.sources.map((source, index) => (
                                <li key={index}>
                                    <a href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="text-accent text-xs hover:underline truncate inline-block max-w-full">
                                    {source.web?.title || 'Unknown Source'}
                                    </a>
                                </li>
                                ))}
                            </ul>
                            </div>
                        )}
                        </div>
                    )}
                    {!isIntelLoading && !realWorldIntel && <p className="m-auto text-gray-600 text-xs text-center">Ask a question about real-world events affecting traffic.</p>}
                </div>
            </div>
        </div>
    );
};

export const IncidentDetails: React.FC<{
    incident: Incident;
    isAnalyzing: boolean;
    analysis: GeminiIncidentAnalysis | null;
    onAnalyze: (incident: Incident) => void;
}> = ({ incident, isAnalyzing, analysis, onAnalyze }) => {
    return (
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
            <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center
                  ${incident.severity === 'HIGH' ? 'bg-red-500/10 text-red-400' :
                    incident.severity === 'MEDIUM' ? 'bg-orange-500/10 text-orange-400' :
                    'bg-yellow-500/10 text-yellow-400'
                  }`}
                >
                    <ExclamationTriangleIcon className="w-7 h-7" />
                </div>
                <div>
                    <h3 className="text-lg font-tech font-bold text-white uppercase">{incident.type} EVENT</h3>
                    <p className="font-mono text-xs text-gray-500">{new Date(incident.timestamp).toLocaleString()}</p>
                </div>
            </div>
            
            <div className="p-3 rounded-lg bg-surface">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Description</p>
                <p className="text-sm text-gray-200">{incident.description}</p>
            </div>
            
            <div className="p-3 rounded-lg bg-surface">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Severity</p>
                <p className={`text-sm font-mono ${
                  incident.severity === 'HIGH' ? 'text-red-400' :
                  incident.severity === 'MEDIUM' ? 'text-orange-400' :
                  'text-yellow-400'
                }`}>{incident.severity}</p>
            </div>
            
            <div className="mt-4 p-3 rounded-lg bg-surface flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-gray-400">AI Tactical Assessment</h4>
                    <button
                        onClick={() => onAnalyze(incident)}
                        disabled={isAnalyzing}
                        className="p-1 rounded-full hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                       <SparklesIcon className={`w-4 h-4 text-primary ${isAnalyzing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {isAnalyzing && !analysis && (
                    <p className="text-sm text-gray-500 text-center py-4">Analyzing incident impact...</p>
                )}

                {analysis && (
                    <div className="space-y-3 text-sm animate-in fade-in">
                        <div className="flex items-start gap-3">
                           <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0"/>
                           <div>
                              <p className="text-purple-300 font-bold text-xs mb-1">ASSESSMENT</p>
                              <p className="text-gray-300">{analysis.assessment}</p>
                           </div>
                        </div>
                         <div className="flex items-start gap-3">
                           <ShieldCheckIcon className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0"/>
                            <div>
                              <p className="text-green-300 font-bold text-xs mb-1">RECOMMENDED ACTION</p>
                              <p className="text-gray-300">{analysis.recommended_action}</p>
                           </div>
                        </div>
                    </div>
                )}
                 {!isAnalyzing && !analysis && (
                    <p className="text-xs text-gray-600 text-center py-4">Request AI assessment for tactical advice.</p>
                )}
            </div>

        </div>
    );
};

export const OverviewPanel: React.FC<{
    stats: TrafficStats;
    currentCity: string;
    totalJunctions: number;
}> = ({ stats, currentCity, totalJunctions }) => {
     const congestionColor = stats.congestionLevel > 70 ? 'text-red-400' : stats.congestionLevel > 40 ? 'text-yellow-400' : 'text-green-400';
     const DetailItem: React.FC<{ icon: React.FC<any>, label: string, value: string | number, colorClass?: string }> = ({ icon: Icon, label, value, colorClass = "text-accent" }) => (
      <div className="flex items-start gap-4 p-3 rounded-lg bg-surface">
        <Icon className={`w-5 h-5 mt-1 flex-shrink-0 ${colorClass}`} />
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{label}</div>
          <div className={`font-mono text-sm text-white`}>{value}</div>
        </div>
      </div>
    );

    return (
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
            <div className="pb-4 border-b border-white/10">
                <h3 className="text-lg font-tech font-bold text-white uppercase">SYSTEM OVERVIEW</h3>
                <p className="font-mono text-xs text-gray-500">Live Telemetry for {currentCity}</p>
            </div>

            <div className="space-y-3">
                <DetailItem icon={SignalIcon} label="Congestion Status" value={`${stats.congestionLevel}%`} colorClass={congestionColor}/>
                <DetailItem icon={BoltIcon} label="Average Speed" value={`${stats.avgSpeed.toFixed(0)} px/f`} colorClass="text-cyan-400" />
                <DetailItem icon={CloudIcon} label="Simulated CO2 Emission" value={`${stats.carbonEmission.toFixed(2)} kg`} colorClass="text-gray-400" />
                 <DetailItem icon={CpuChipIcon} label="Managed Junctions" value={`${totalJunctions}`} colorClass="text-purple-400" />
            </div>

             <div className="mt-auto p-4 rounded-lg bg-surface text-center">
                <p className="text-xs text-gray-400">System status: <span className="text-green-400 font-bold">NOMINAL</span></p>
                <p className="text-[10px] text-gray-600 mt-1">All sensors online. AI core responsive.</p>
            </div>
        </div>
    );
};