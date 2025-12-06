import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Car, Intersection, Incident } from '../types';
import { BLOCK_SIZE, ROAD_WIDTH } from '../constants';
import { 
    TruckIcon, // CAR
    PaperAirplaneIcon, // POLICE
    ShieldExclamationIcon, // INCIDENT
} from '@heroicons/react/24/solid';

interface MapViewProps {
    intersections: Intersection[];
    cars: Car[];
    incidents: Incident[];
    onSelectCar: (id: string) => void;
    onSelectIncident: (id: string) => void;
    visibleLayers: { traffic: boolean, incidents: boolean, units: boolean };
    selectedCarId: string | null;
    selectedIncidentId: string | null;
}

const getCongestionColor = (percentage: number) => {
    if (percentage > 75) return 'hsl(0, 70%, 50%)'; // Red
    if (percentage > 40) return 'hsl(45, 80%, 50%)'; // Yellow
    return 'hsl(120, 70%, 40%)'; // Green
};

export const MapView: React.FC<MapViewProps> = ({ 
    intersections, cars, incidents, onSelectCar, onSelectIncident, visibleLayers,
    selectedCarId, selectedIncidentId
}) => {
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1.2 });
    const [isDragging, setIsDragging] = useState(false);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const mapRef = useRef<HTMLDivElement>(null);

    const roadSegments = useMemo(() => {
        const segments: { key: string, x1: number, y1: number, x2: number, y2: number, congestion: number }[] = [];
        const carCountPerSegment: Record<string, number> = {};
        
        intersections.forEach(i1 => {
            const i2h = intersections.find(i2 => i2.x === i1.x + 1 && i2.y === i1.y);
            if (i2h) {
                const key = `${i1.id}-${i2h.id}`;
                segments.push({ key, x1: i1.x, y1: i1.y, x2: i2h.x, y2: i2h.y, congestion: 0 });
                carCountPerSegment[key] = 0;
            }
            const i2v = intersections.find(i2 => i2.y === i1.y + 1 && i2.x === i1.x);
            if (i2v) {
                const key = `${i1.id}-${i2v.id}`;
                segments.push({ key, x1: i1.x, y1: i1.y, x2: i2v.x, y2: i2v.y, congestion: 0 });
                carCountPerSegment[key] = 0;
            }
        });

        cars.forEach(car => {
            const gridX = Math.floor(car.x / BLOCK_SIZE);
            const gridY = Math.floor(car.y / BLOCK_SIZE);
            segments.forEach(seg => {
                const isHorizontal = seg.y1 === seg.y2;
                if (isHorizontal && gridY === seg.y1 && gridX >= seg.x1 && gridX < seg.x2) {
                    carCountPerSegment[seg.key]++;
                } else if (!isHorizontal && gridX === seg.x1 && gridY >= seg.y1 && gridY < seg.y2) {
                    carCountPerSegment[seg.key]++;
                }
            });
        });
        
        return segments.map(seg => ({ ...seg, congestion: Math.min(100, (carCountPerSegment[seg.key] / 5) * 100)}));

    }, [intersections, cars]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        mapRef.current!.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        mapRef.current!.style.cursor = 'grab';
    };

    const handleWheel = (e: React.WheelEvent) => {
        const scaleAmount = -e.deltaY * 0.001;
        setTransform(prev => ({ ...prev, scale: Math.min(Math.max(0.5, prev.scale + scaleAmount), 3) }));
    };
    
    const getCarRotation = (dir: 'N'|'S'|'E'|'W') => {
        if (dir === 'N') return -90;
        if (dir === 'S') return 90;
        if (dir === 'W') return 180;
        return 0; // E
    };

    return (
        <div 
            ref={mapRef}
            className="w-full h-full bg-[#08090d] overflow-hidden select-none"
            style={{ cursor: 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        >
            <div 
                className="transition-transform duration-100 ease-linear"
                style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
            >
                <div className="absolute top-0 left-0">
                    {/* Roads and Traffic */}
                    {roadSegments.map(({ key, x1, y1, x2, y2, congestion }) => {
                        const isHorizontal = y1 === y2;
                        const style: React.CSSProperties = {
                            position: 'absolute',
                            background: visibleLayers.traffic ? getCongestionColor(congestion) : '#333',
                            transition: 'background 0.5s ease'
                        };
                        if (isHorizontal) {
                            style.left = x1 * BLOCK_SIZE + BLOCK_SIZE / 2;
                            style.top = y1 * BLOCK_SIZE + BLOCK_SIZE / 2 - ROAD_WIDTH / 2;
                            style.width = BLOCK_SIZE;
                            style.height = ROAD_WIDTH;
                        } else {
                            style.left = x1 * BLOCK_SIZE + BLOCK_SIZE / 2 - ROAD_WIDTH / 2;
                            style.top = y1 * BLOCK_SIZE + BLOCK_SIZE / 2;
                            style.width = ROAD_WIDTH;
                            style.height = BLOCK_SIZE;
                        }
                        return <div key={key} style={style} />;
                    })}

                    {/* Intersections */}
                    {intersections.map(i => (
                        <div key={i.id}
                            style={{
                                position: 'absolute',
                                left: i.x * BLOCK_SIZE + BLOCK_SIZE / 2,
                                top: i.y * BLOCK_SIZE + BLOCK_SIZE / 2,
                                width: ROAD_WIDTH,
                                height: ROAD_WIDTH,
                                background: '#111',
                                borderRadius: '50%',
                                transform: 'translate(-50%, -50%)',
                                border: '2px solid #444',
                            }}
                        >
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-white/40 text-[10px] font-mono whitespace-nowrap">{i.label}</span>
                        </div>
                    ))}
                    
                    {/* Units (Cars) */}
                    {visibleLayers.units && cars.map(car => {
                      const isSelected = car.id === selectedCarId;
                      const iconColor = car.type === 'POLICE' ? 'text-blue-400' : car.type === 'BUS' ? 'text-red-400' : 'text-gray-400';
                      return (
                        <div 
                          key={car.id}
                          className="absolute transition-all duration-500 ease-linear group cursor-pointer"
                          style={{ left: car.x, top: car.y, transform: `translate(-50%, -50%) rotate(${getCarRotation(car.dir)}deg)`}}
                          onClick={() => onSelectCar(car.id)}
                        >
                            {isSelected && (
                                <div className="absolute -inset-2 rounded-full border-2 border-saffron animate-pulse"></div>
                            )}
                            <PaperAirplaneIcon className={`w-6 h-6 transform transition-colors ${iconColor} ${isSelected ? 'text-saffron drop-shadow-[0_0_10px_#FF9933]' : 'group-hover:text-white'}`}/>
                        </div>
                      )
                    })}
                    
                    {/* Incidents */}
                    {visibleLayers.incidents && incidents.map(incident => {
                        const isSelected = incident.id === selectedIncidentId;
                        return (
                            <div
                                key={incident.id}
                                className="absolute transition-all duration-500 ease-linear group cursor-pointer"
                                style={{ left: incident.location.x, top: incident.location.y, transform: 'translate(-50%, -50%)' }}
                                onClick={() => onSelectIncident(incident.id)}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center animate-pulse
                                    ${incident.severity === 'HIGH' ? 'bg-red-500/50' : 'bg-orange-500/50'}`}>
                                    <ShieldExclamationIcon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-yellow-300'}`} />
                                </div>
                                 {isSelected && (
                                    <div className="absolute -inset-2 rounded-full border-2 border-yellow-300 animate-ping opacity-75"></div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};