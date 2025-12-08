import React, { useState, useMemo } from 'react';
import { Car, Incident, Road } from '../types';
import { TruckIcon, ExclamationTriangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { MAX_SPEED } from '../constants';

interface DataHubProps {
    incidents: Incident[];
    cars: Car[];
    roads: Road[];
    onSelectIncident: (id: string) => void;
    onSelectCar: (id: string) => void;
}

type DataView = 'incidents' | 'vehicles';

const getRoadNameById = (roadId: string | undefined, roads: Road[]) => {
    if (!roadId) return 'At Intersection';
    const road = roads.find(r => r.id === roadId);
    return road ? road.name : 'Unknown Route';
};

export const DataHub: React.FC<DataHubProps> = ({ incidents, cars, roads, onSelectIncident, onSelectCar }) => {
    const [activeView, setActiveView] = useState<DataView>('incidents');
    const [filter, setFilter] = useState('');

    const filteredIncidents = useMemo(() => {
        if (!filter) return incidents;
        const lowerFilter = filter.toLowerCase();
        return incidents.filter(i =>
            i.id.toLowerCase().includes(lowerFilter) ||
            i.type.toLowerCase().includes(lowerFilter) ||
            i.severity.toLowerCase().includes(lowerFilter) ||
            getRoadNameById(i.blocksSegmentId, roads).toLowerCase().includes(lowerFilter)
        );
    }, [incidents, filter, roads]);

    const filteredCars = useMemo(() => {
        if (!filter) return cars;
        const lowerFilter = filter.toLowerCase();
        return cars.filter(c =>
            c.id.toLowerCase().includes(lowerFilter) ||
            c.type.toLowerCase().includes(lowerFilter) ||
            c.state.toLowerCase().includes(lowerFilter) ||
            (c.isBrokenDown && 'broken down'.includes(lowerFilter))
        );
    }, [cars, filter]);

    return (
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
            <div>
                <h3 className="text-lg font-tech font-bold text-white uppercase">Data Hub</h3>
                <p className="font-mono text-xs text-gray-500">Live Simulation Database View</p>
            </div>

            <div className="flex-shrink-0 flex flex-col gap-4">
                <div className="flex items-center gap-2 p-1 rounded-lg bg-surface">
                    <button
                        onClick={() => setActiveView('incidents')}
                        className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-md text-sm transition-colors ${activeView === 'incidents' ? 'bg-primary text-white font-bold' : 'text-gray-400 hover:bg-surfaceHighlight'}`}
                    >
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        Active Incidents ({incidents.length})
                    </button>
                    <button
                        onClick={() => setActiveView('vehicles')}
                        className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-md text-sm transition-colors ${activeView === 'vehicles' ? 'bg-primary text-white font-bold' : 'text-gray-400 hover:bg-surfaceHighlight'}`}
                    >
                        <TruckIcon className="w-4 h-4" />
                        Vehicle Fleet ({cars.length})
                    </button>
                </div>

                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <input
                        type="text"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder={`Filter ${activeView}...`}
                        className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm placeholder-gray-500 focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                    />
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto rounded-lg bg-surface border border-border">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-surfaceHighlight z-10 shadow-sm shadow-black/20">
                        {activeView === 'incidents' ? (
                            <tr className="text-xs text-gray-400 uppercase tracking-wider">
                                <th className="p-3">ID</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Severity</th>
                                <th className="p-3">Location</th>
                            </tr>
                        ) : (
                            <tr className="text-xs text-gray-400 uppercase tracking-wider">
                                <th className="p-3">ID</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">State</th>
                                <th className="p-3">Speed (km/h)</th>
                            </tr>
                        )}
                    </thead>
                    <tbody className="divide-y divide-border">
                        {activeView === 'incidents' ? (
                            filteredIncidents.length > 0 ? filteredIncidents.map(incident => (
                                <tr key={incident.id} onClick={() => onSelectIncident(incident.id)} className="hover:bg-accent/10 cursor-pointer font-mono text-xs">
                                    <td className="p-3 text-gray-500">{incident.id}</td>
                                    <td className="p-3 text-white">{incident.type}</td>
                                    <td className="p-3">
                                        <span className={
                                            incident.severity === 'HIGH' ? 'text-red-400' :
                                            incident.severity === 'MEDIUM' ? 'text-orange-400' : 'text-yellow-400'
                                        }>{incident.severity}</span>
                                    </td>
                                    <td className="p-3 text-saffron">{getRoadNameById(incident.blocksSegmentId, roads)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={4} className="text-center p-8 text-gray-600">No incidents match filter.</td></tr>
                            )
                        ) : (
                            filteredCars.length > 0 ? filteredCars.map(car => (
                                <tr key={car.id} onClick={() => onSelectCar(car.id)} className="hover:bg-accent/10 cursor-pointer font-mono text-xs">
                                    <td className="p-3 text-gray-500">{car.id}</td>
                                    <td className="p-3 text-white">{car.type}</td>
                                    <td className="p-3">
                                        <span className={
                                            car.isBrokenDown ? 'text-orange-400' :
                                            car.state === 'STOPPED' ? 'text-red-400' : 'text-green-400'
                                        }>{car.isBrokenDown ? 'BROKEN DOWN' : car.state}</span>
                                    </td>
                                    <td className="p-3 text-cyan-400">{(car.speed / MAX_SPEED * 60).toFixed(0)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={4} className="text-center p-8 text-gray-600">No vehicles match filter.</td></tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
