import React, { useRef, useEffect, useLayoutEffect } from 'react';
import { GRID_SIZE, BLOCK_SIZE, ROAD_WIDTH, CAR_SIZE, YELLOW_DURATION, MAX_SPEED, ACCELERATION, DECELERATION, getCanvasSize } from '../constants';
import { Intersection, Car, LightState, VehicleType, Incident } from '../types';

interface SimulationCanvasProps {
  intersections: Intersection[];
  setIntersections: React.Dispatch<React.SetStateAction<Intersection[]>>;
  cars: Car[];
  setCars: React.Dispatch<React.SetStateAction<Car[]>>;
  onUpdateStats: (totalCars: number, avgSpeed: number, queueMap: Record<string, number>) => void;
  isRunning: boolean;
  onIntersectionSelect: (id: string) => void;
  onCarSelect: (id: string) => void;
  selectedCarId: string | null;
  scenarioKey: string;
  cvModeActive: boolean;
  recentlyUpdatedJunctions: Set<string>;
  incidents: Incident[];
  onIncidentSelect: (id: string) => void;
  selectedIncidentId: string | null;
  closedRoads: Set<string>;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  intersections,
  setIntersections,
  cars,
  setCars,
  onUpdateStats,
  isRunning,
  onIntersectionSelect,
  onCarSelect,
  selectedCarId,
  scenarioKey,
  cvModeActive,
  recentlyUpdatedJunctions,
  incidents,
  onIncidentSelect,
  selectedIncidentId,
  closedRoads,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameCountRef = useRef(0);
  const requestRef = useRef<number>(0);
  const confidenceMap = useRef<Map<string, number>>(new Map()).current;

  const physicsState = useRef({
    intersections: intersections,
    cars: cars,
    currentScenarioKey: scenarioKey,
    selectedCarId: selectedCarId,
    recentlyUpdatedJunctions: recentlyUpdatedJunctions,
    incidents: incidents,
    selectedIncidentId: selectedIncidentId,
    closedRoads: closedRoads,
  });

  useLayoutEffect(() => {
    if (scenarioKey !== physicsState.current.currentScenarioKey) {
       physicsState.current.intersections = intersections;
       physicsState.current.cars = cars;
       physicsState.current.currentScenarioKey = scenarioKey;
    }
    physicsState.current.cars = cars;
    physicsState.current.selectedCarId = selectedCarId;
    physicsState.current.recentlyUpdatedJunctions = recentlyUpdatedJunctions;
    physicsState.current.incidents = incidents;
    physicsState.current.selectedIncidentId = selectedIncidentId;
    physicsState.current.closedRoads = closedRoads;
  }, [intersections, cars, scenarioKey, selectedCarId, recentlyUpdatedJunctions, incidents, selectedIncidentId, closedRoads]);

  const getLaneCenter = (gridIdx: number, isVertical: boolean, isForward: boolean) => {
    const roadCenter = (gridIdx + 0.5) * BLOCK_SIZE;
    const offset = ROAD_WIDTH / 4;
    return isForward ? (isVertical ? roadCenter - offset : roadCenter - offset) : (isVertical ? roadCenter + offset : roadCenter + offset);
  };

  const spawnCar = (currentCars: Car[]): Car | null => {
    const edge = Math.floor(Math.random() * 4); 
    const laneIdx = Math.floor(Math.random() * GRID_SIZE);
    
    let x = 0, y = 0, dir: 'N'|'S'|'E'|'W' = 'S';
    
    if (edge === 0) { // Top (Southbound, Left)
      x = getLaneCenter(laneIdx, true, true);
      y = -CAR_SIZE * 3;
      dir = 'S';
    } else if (edge === 1) { // Right (Westbound, Bottom)
      x = GRID_SIZE * BLOCK_SIZE + CAR_SIZE * 3;
      y = getLaneCenter(laneIdx, false, false); 
      dir = 'W';
    } else if (edge === 2) { // Bottom (Northbound, Right)
      x = getLaneCenter(laneIdx, true, false);
      y = GRID_SIZE * BLOCK_SIZE + CAR_SIZE * 3;
      dir = 'N';
    } else { // Left (Eastbound, Top)
      x = -CAR_SIZE * 3;
      y = getLaneCenter(laneIdx, false, true);
      dir = 'E';
    }

    const r = Math.random();
    let type: VehicleType = 'CAR';
    let length = CAR_SIZE;
    let width = CAR_SIZE * 0.6;

    if (currentCars.filter(c => c.type === 'POLICE').length < 2 && r > 0.98) {
      type = 'POLICE';
      length = CAR_SIZE * 1.5;
      width = CAR_SIZE * 0.7;
    } else if (r > 0.92) {
      type = 'BUS';
      length = CAR_SIZE * 3.5;
      width = CAR_SIZE * 1.3;
    } else if (r > 0.65) {
      type = 'AUTO';
      length = CAR_SIZE * 0.8;
      width = CAR_SIZE * 0.7;
    }

    const isBlocked = currentCars.some(c => 
      Math.abs(c.x - x) < length * 3 && Math.abs(c.y - y) < length * 3
    );

    if (isBlocked) return null;

    return {
      id: Math.random().toString(36).substr(2, 9),
      x, y, dir,
      speed: MAX_SPEED * 0.5,
      targetIntersectionId: null,
      state: 'ACCELERATING',
      type, width, length,
      mission: type === 'POLICE' ? { type: 'PATROL', targetId: null } : null,
    };
  };

  const drawCityBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#030305';
    ctx.fillRect(0, 0, width, height);

    for(let x = 0; x <= GRID_SIZE; x++) {
      const xStart = x === 0 ? 0 : (x - 0.5) * BLOCK_SIZE + ROAD_WIDTH/2;
      const xEnd = x === GRID_SIZE ? width : (x + 0.5) * BLOCK_SIZE - ROAD_WIDTH/2;
      
      if (xEnd > xStart) {
        for(let y = 0; y <= GRID_SIZE; y++) {
          const yStart = y === 0 ? 0 : (y - 0.5) * BLOCK_SIZE + ROAD_WIDTH/2;
          const yEnd = y === GRID_SIZE ? height : (y + 0.5) * BLOCK_SIZE - ROAD_WIDTH/2;
          
          if (yEnd > yStart) {
             const w = xEnd - xStart;
             const h = yEnd - yStart;
             ctx.fillStyle = '#0A0B10';
             ctx.fillRect(xStart, yStart, w, h);
             ctx.strokeStyle = '#13141C';
             ctx.lineWidth = 2;
             ctx.strokeRect(xStart + 10, yStart + 10, w - 20, h - 20);
             const bSize = Math.min(w, h) * 0.6;
             const bx = xStart + (w - bSize)/2;
             const by = yStart + (h - bSize)/2;
             ctx.fillStyle = 'rgba(0,0,0,0.5)';
             ctx.fillRect(bx + 4, by + 4, bSize, bSize);
             ctx.fillStyle = '#181A24';
             ctx.fillRect(bx, by, bSize, bSize);
             ctx.fillStyle = '#1E293B';
             ctx.fillRect(bx + bSize*0.2, by + bSize*0.2, bSize*0.6, bSize*0.6);
             if ((x+y)%2 === 0) {
               ctx.fillStyle = '#06B6D4';
               ctx.globalAlpha = 0.3;
               ctx.beginPath();
               ctx.arc(bx + bSize*0.8, by + bSize*0.2, 2, 0, Math.PI*2);
               ctx.fill();
               ctx.globalAlpha = 1.0;
             }
          }
        }
      }
    }
  };

  const drawRoads = (ctx: CanvasRenderingContext2D, width: number, height: number, carsOnRoads: Car[], currentClosedRoads: Set<string>) => {
    ctx.lineWidth = ROAD_WIDTH;
    ctx.lineCap = 'butt';
    const roadSegments: Record<string, { count: number; x: number, y: number, isVertical: boolean }> = {};
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            roadSegments[`road-${x}-${y}-h`] = { count: 0, x, y, isVertical: false };
            roadSegments[`road-${x}-${y}-v`] = { count: 0, x, y, isVertical: true };
        }
    }

    carsOnRoads.forEach(car => {
        const roadX = Math.floor(car.x / BLOCK_SIZE);
        const roadY = Math.floor(car.y / BLOCK_SIZE);
        const key = car.dir === 'N' || car.dir === 'S' ? `road-${roadX}-${roadY}-v` : `road-${roadX}-${roadY}-h`;
        if (roadSegments[key]) {
            roadSegments[key].count++;
        }
    });

    for (let x = 0; x < GRID_SIZE; x++) {
      const cx = (x + 0.5) * BLOCK_SIZE;
      ctx.strokeStyle = '#111218';
      ctx.lineWidth = ROAD_WIDTH;
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, height); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.setLineDash([12, 18]);
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, height); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - ROAD_WIDTH/2, 0); ctx.lineTo(cx - ROAD_WIDTH/2, height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + ROAD_WIDTH/2, 0); ctx.lineTo(cx + ROAD_WIDTH/2, height); ctx.stroke();
    }
    for (let y = 0; y < GRID_SIZE; y++) {
      const cy = (y + 0.5) * BLOCK_SIZE;
      ctx.strokeStyle = '#111218';
      ctx.lineWidth = ROAD_WIDTH;
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(width, cy); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.setLineDash([12, 18]);
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(width, cy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, cy - ROAD_WIDTH/2); ctx.lineTo(width, cy - ROAD_WIDTH/2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, cy + ROAD_WIDTH/2); ctx.lineTo(width, cy + ROAD_WIDTH/2); ctx.stroke();
    }
    
    Object.values(roadSegments).forEach(seg => {
        if (seg.count > 2) {
            const congestionLevel = Math.min((seg.count - 2) / 4, 1);
            let color;
            if (congestionLevel > 0.75) {
                color = `rgba(239, 68, 68, ${0.2 + congestionLevel * 0.3})`;
            } else {
                color = `rgba(245, 158, 11, ${0.2 + congestionLevel * 0.3})`;
            }
            ctx.fillStyle = color;
            if (seg.isVertical) {
                const cx = (seg.x + 0.5) * BLOCK_SIZE;
                ctx.fillRect(cx - ROAD_WIDTH/2, seg.y * BLOCK_SIZE, ROAD_WIDTH, BLOCK_SIZE);
            } else {
                const cy = (seg.y + 0.5) * BLOCK_SIZE;
                ctx.fillRect(seg.x * BLOCK_SIZE, cy - ROAD_WIDTH/2, BLOCK_SIZE, ROAD_WIDTH);
            }
        }
    });

    ctx.lineWidth = 10;
    ctx.lineCap = 'butt';
    for (const segmentId of currentClosedRoads) {
        const [id1, id2] = segmentId.split('_');
        const int1 = physicsState.current.intersections.find(i => i.id === id1);
        const int2 = physicsState.current.intersections.find(i => i.id === id2);
        if (int1 && int2) {
            const x1 = (int1.x + 0.5) * BLOCK_SIZE;
            const y1 = (int1.y + 0.5) * BLOCK_SIZE;
            const x2 = (int2.x + 0.5) * BLOCK_SIZE;
            const y2 = (int2.y + 0.5) * BLOCK_SIZE;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            
            ctx.strokeStyle = '#EF4444';
            ctx.setLineDash([15, 10]);
            const pulse = Math.abs(Math.sin(frameCountRef.current / 30));
            ctx.lineWidth = 8 + pulse * 4;
            ctx.shadowColor = '#EF4444';
            ctx.shadowBlur = 15;
            ctx.stroke();
            
            ctx.lineDashOffset = 15;
            ctx.strokeStyle = '#FFFFFF';
            ctx.stroke();

            ctx.restore();
        }
    }
  };

  const drawCars = (ctx: CanvasRenderingContext2D, carsToDraw: Car[]) => {
    carsToDraw.forEach(car => {
      ctx.save();
      ctx.translate(car.x, car.y);
      let angle = 0;
      if (car.dir === 'S') angle = Math.PI;
      if (car.dir === 'W') angle = -Math.PI / 2;
      if (car.dir === 'E') angle = Math.PI / 2;
      ctx.rotate(angle);

      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(-car.width/2 + 2, -car.length/2 + 2, car.width, car.length);

      if (car.type === 'POLICE') {
        ctx.fillStyle = '#E2E8F0';
        ctx.beginPath();
        ctx.roundRect(-car.width/2, -car.length/2, car.width, car.length, 2);
        ctx.fill();

        const sirenOn = car.mission?.type === 'RESPONSE';
        if (sirenOn) {
            const whichLight = Math.floor(frameCountRef.current / 10) % 2 === 0;
            const color = whichLight ? '#3B82F6' : '#EF4444';
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, -car.length/4, car.width/3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
      } else if (car.type === 'AUTO') {
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.moveTo(0, -car.length/2);
        ctx.lineTo(car.width/2, car.length/2);
        ctx.lineTo(-car.width/2, car.length/2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.fillRect(-car.width/3, -car.length/4, car.width/1.5, car.length/2);
      } else {
        ctx.fillStyle = car.type === 'BUS' ? '#EF4444' : '#E2E8F0';
        ctx.beginPath();
        ctx.roundRect(-car.width/2, -car.length/2, car.width, car.length, car.type === 'BUS' ? 1 : 2);
        ctx.fill();
        ctx.fillStyle = '#1E293B';
        const glassMargin = car.type === 'BUS' ? 2 : 1;
        ctx.fillRect(-car.width/2 + glassMargin, -car.length/2 + 3, car.width - glassMargin*2, car.length * 0.25);
        ctx.fillRect(-car.width/2 + glassMargin, car.length/2 - car.length * 0.25 - 2, car.width - glassMargin*2, car.length * 0.20);
      }

      ctx.fillStyle = '#FEF08A';
      ctx.shadowColor = '#FEF08A';
      ctx.shadowBlur = 8;
      ctx.fillRect(-car.width/2 + 1, -car.length/2 - 1, 2, 2);
      ctx.fillRect(car.width/2 - 3, -car.length/2 - 1, 2, 2);
      
      const isBraking = car.state === 'STOPPED' || car.isBrokenDown;
      ctx.fillStyle = isBraking ? '#EF4444' : '#7F1D1D';
      ctx.shadowColor = '#EF4444';
      ctx.shadowBlur = isBraking ? 10 : 0;
      
      ctx.fillRect(-car.width/2 + 1, car.length/2 - 1, 2, 2);
      ctx.fillRect(car.width/2 - 3, car.length/2 - 1, 2, 2);

      if (car.isBrokenDown) {
        const hazardsOn = Math.floor(frameCountRef.current / 30) % 2 === 0;
        if (hazardsOn) {
            ctx.fillStyle = '#FF9933';
            ctx.shadowColor = '#FF9933';
            ctx.shadowBlur = 10;
            ctx.fillRect(-car.width/2 - 2, car.length/2 - 1, 2, 2);
            ctx.fillRect(car.width/2, car.length/2 - 1, 2, 2);
            ctx.fillRect(-car.width/2 - 2, -car.length/2 + 1, 2, 2);
            ctx.fillRect(car.width/2, -car.length/2 + 1, 2, 2);
        }
      }

      ctx.shadowBlur = 0;
      ctx.restore();
    });
  };

  const drawIntersections = (ctx: CanvasRenderingContext2D, ints: Intersection[], updatedJunctions: Set<string>) => {
    const frame = frameCountRef.current;

    ints.forEach(i => {
      const cx = (i.x + 0.5) * BLOCK_SIZE;
      const cy = (i.y + 0.5) * BLOCK_SIZE;
      const rw = ROAD_WIDTH;

      if (updatedJunctions.has(i.id)) {
        ctx.save();
        const pulseProgress = (frame % 120) / 120;
        const radius = rw / 2 + 15 + Math.sin(pulseProgress * Math.PI) * 5;
        const alpha = Math.max(0, 0.8 - Math.sin(pulseProgress * Math.PI));
        
        ctx.strokeStyle = `rgba(192, 132, 252, ${alpha})`;
        ctx.lineWidth = 4;
        ctx.shadowColor = `rgba(192, 132, 252, 1)`;
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.fillStyle = '#334155';
      const stopLineOffset = rw * 0.7;
      ctx.fillRect(cx - rw/2, cy - stopLineOffset, rw, 4);
      ctx.fillRect(cx - rw/2, cy + stopLineOffset - 4, rw, 4);
      ctx.fillRect(cx - stopLineOffset, cy - rw/2, 4, rw);
      ctx.fillRect(cx + stopLineOffset - 4, cy - rw/2, 4, rw);

      const drawLight = (lx: number, ly: number, state: LightState) => {
        ctx.fillStyle = '#0F172A';
        ctx.beginPath(); ctx.arc(lx, ly, 5, 0, Math.PI * 2); ctx.fill();
        
        ctx.beginPath(); ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
        let color = '#333', shadowColor = 'transparent';
        if (state === LightState.GREEN) { color = '#10B981'; shadowColor = color; }
        else if (state === LightState.RED) { color = '#EF4444'; shadowColor = color; }
        else if (state === LightState.YELLOW) { color = '#F59E0B'; shadowColor = color; }
        ctx.fillStyle = color;
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      };

      const lightOffset = rw * 0.4;

      if (i.overrideState === 'EMERGENCY_ALL_RED') {
        const flash = Math.floor(frame / 15) % 2 === 0;
        if (flash) {
            drawLight(cx - lightOffset, cy - lightOffset, LightState.RED);
            drawLight(cx + lightOffset, cy + lightOffset, LightState.RED);
            drawLight(cx + lightOffset, cy - lightOffset, LightState.RED);
            drawLight(cx - lightOffset, cy + lightOffset, LightState.RED);
        }
      } else {
        drawLight(cx - lightOffset, cy - lightOffset, i.lightState.ns);
        drawLight(cx + lightOffset, cy + lightOffset, i.lightState.ns);
        drawLight(cx + lightOffset, cy - lightOffset, i.lightState.ew);
        drawLight(cx - lightOffset, cy + lightOffset, i.lightState.ew);
      }
    });
  };

  const drawIncidents = (ctx: CanvasRenderingContext2D, incidentsToDraw: Incident[], selectedId: string | null) => {
    incidentsToDraw.forEach(incident => {
        const { x, y } = incident.location;
        const isSelected = incident.id === selectedId;

        ctx.save();
        ctx.translate(x, y);

        const pulseProgress = (frameCountRef.current % 120) / 120;
        const radius = 15 + Math.sin(pulseProgress * Math.PI) * 5;
        const alpha = 0.5 + Math.sin(pulseProgress * Math.PI) * 0.4;
        
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        
        let color = 'orange';
        if(incident.severity === 'HIGH') color = 'red';

        ctx.fillStyle = `rgba(${color === 'orange' ? '255, 165, 0' : '255, 0, 0'}, ${alpha * 0.2})`;
        ctx.fill();

        ctx.strokeStyle = `rgba(${color === 'orange' ? '249, 115, 22' : '239, 68, 68'}, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = isSelected ? '#FBBF24' : '#F97316';
        ctx.shadowColor = '#F97316';
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(8, 8);
        ctx.lineTo(-8, 8);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();
    });
  };

  const drawCVOverlay = (ctx: CanvasRenderingContext2D, carsToDraw: Car[]) => {
    ctx.save();
    carsToDraw.forEach(car => {
      const confidence = confidenceMap.get(car.id) || (Math.random() * 8 + 92);
      if (!confidenceMap.has(car.id)) confidenceMap.set(car.id, confidence);
      
      let color = car.type === 'BUS' ? '#EF4444' : car.type === 'AUTO' ? '#F59E0B' : '#06B6D4';
      if (car.type === 'POLICE') color = '#3B82F6';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.8;
      const padding = 4;
      ctx.strokeRect(car.x - car.width/2 - padding, car.y - car.length/2 - padding, car.width + padding*2, car.length + padding*2);
      ctx.fillStyle = color;
      ctx.font = '8px JetBrains Mono';
      ctx.fillText(`${car.type}:${confidence.toFixed(1)}%`, car.x - car.width/2 - padding, car.y - car.length/2 - padding - 4);
    });
    ctx.restore();
  };
  
  const animate = () => {
    frameCountRef.current++;
    const frame = frameCountRef.current;
    
    const { intersections: currentIntersections, cars: currentCars, incidents: currentIncidents, closedRoads: currentClosedRoads } = physicsState.current;
    
    const updatedIntersections = currentIntersections.map(i => {
      if (i.overrideState) {
        let newLightState = { ...i.lightState };
        if (i.overrideState === 'NS_GREEN') newLightState = { ns: LightState.GREEN, ew: LightState.RED };
        else if (i.overrideState === 'EW_GREEN') newLightState = { ns: LightState.RED, ew: LightState.GREEN };
        else if (i.overrideState === 'EMERGENCY_ALL_RED') newLightState = { ns: LightState.RED, ew: LightState.RED };
        return { ...i, lightState: newLightState, timer: 999 };
      }

      let newTimer = i.timer - 1;
      let newLightState = { ...i.lightState };
      
      if (newTimer <= 0) {
        if (i.lightState.ns === LightState.GREEN || i.lightState.ew === LightState.GREEN) {
          if (i.lightState.ns === LightState.GREEN) newLightState.ns = LightState.YELLOW;
          if (i.lightState.ew === LightState.GREEN) newLightState.ew = LightState.YELLOW;
          newTimer = YELLOW_DURATION;
        } else {
          newLightState = i.lightState.ns === LightState.YELLOW ? {ns: LightState.RED, ew: LightState.GREEN} : {ew: LightState.RED, ns: LightState.GREEN};
          newTimer = i.greenDuration;
        }
      }
      return { ...i, timer: newTimer, lightState: newLightState };
    });
    
    let newCars = [...currentCars];
    if (frame % 30 === 0) {
      const newCar = spawnCar(newCars);
      if (newCar) newCars.push(newCar);
    }
    
    const queueMap: Record<string, number> = {};
    
    newCars = newCars.map(car => {
      if (car.isBrokenDown) return car;

      let { x, y, dir, speed, state, targetIntersectionId, mission } = car;

      if (!targetIntersectionId) {
        const gridX = Math.floor(x / BLOCK_SIZE), gridY = Math.floor(y / BLOCK_SIZE);
        let targetX = -1, targetY = -1;
        if (dir === 'S' && y < (gridY + 0.5) * BLOCK_SIZE) { targetX = gridX; targetY = gridY; }
        else if (dir === 'N' && y > (gridY + 0.5) * BLOCK_SIZE) { targetX = gridX; targetY = gridY; }
        else if (dir === 'E' && x < (gridX + 0.5) * BLOCK_SIZE) { targetX = gridX; targetY = gridY; }
        else if (dir === 'W' && x > (gridX + 0.5) * BLOCK_SIZE) { targetX = gridX; targetY = gridY; }

        if (targetX >= 0 && targetX < GRID_SIZE && targetY >= 0 && targetY < GRID_SIZE) {
          targetIntersectionId = `INT-${targetX}-${targetY}`;
        }
      }
      
      const intersection = updatedIntersections.find(i => i.id === targetIntersectionId);
      let isRedLight = false;
      
      if (intersection) {
        const iX = (intersection.x + 0.5) * BLOCK_SIZE;
        const iY = (intersection.y + 0.5) * BLOCK_SIZE;
        const lights = intersection.lightState;
        
        const stopLineMargin = ROAD_WIDTH / 2;
        const decisionDistance = (speed * speed) / (2 * DECELERATION) + car.length;

        let isApproaching = false;
        let distanceToStopLine = Infinity;

        switch (dir) {
            case 'N':
                distanceToStopLine = y - (iY + stopLineMargin);
                if (distanceToStopLine > 0 && distanceToStopLine < decisionDistance) isApproaching = true;
                break;
            case 'S':
                distanceToStopLine = (iY - stopLineMargin) - y;
                if (distanceToStopLine > 0 && distanceToStopLine < decisionDistance) isApproaching = true;
                break;
            case 'W':
                distanceToStopLine = x - (iX + stopLineMargin);
                if (distanceToStopLine > 0 && distanceToStopLine < decisionDistance) isApproaching = true;
                break;
            case 'E':
                distanceToStopLine = (iX - stopLineMargin) - x;
                if (distanceToStopLine > 0 && distanceToStopLine < decisionDistance) isApproaching = true;
                break;
        }

        if (isApproaching) {
            if ((dir === 'N' || dir === 'S') && lights.ns !== LightState.GREEN) isRedLight = true;
            if ((dir === 'W' || dir === 'E') && lights.ew !== LightState.GREEN) isRedLight = true;
        }
      }
      
      let isBlocked = false;
      const SAFETY_BUFFER = 8;
      for (const other of newCars) {
        if (car.id === other.id) continue;
        
        const dx = other.x - car.x;
        const dy = other.y - car.y;
        
        let isDirectlyAhead = false;
        let distanceToOther = Infinity;

        switch (car.dir) {
            case 'N':
                if (dy < 0 && Math.abs(dx) < car.width) { isDirectlyAhead = true; distanceToOther = -dy; }
                break;
            case 'S':
                if (dy > 0 && Math.abs(dx) < car.width) { isDirectlyAhead = true; distanceToOther = dy; }
                break;
            case 'W':
                if (dx < 0 && Math.abs(dy) < car.width) { isDirectlyAhead = true; distanceToOther = -dx; }
                break;
            case 'E':
                if (dx > 0 && Math.abs(dy) < car.width) { isDirectlyAhead = true; distanceToOther = dx; }
                break;
        }
        
        if (isDirectlyAhead) {
            const safeFollowingDistance = (other.length / 2) + (car.length / 2) + SAFETY_BUFFER + (car.speed * 1.5);
            if (distanceToOther < safeFollowingDistance) {
                isBlocked = true;
                break;
            }
        }
      }
      
      let shouldYield = false;
      let maxSpeed = car.type === 'BUS' ? MAX_SPEED * 0.7 : car.type === 'AUTO' ? MAX_SPEED * 0.85 : MAX_SPEED;

      if (car.type === 'POLICE' && mission?.type === 'RESPONSE') {
        isRedLight = false;
        maxSpeed = MAX_SPEED * 1.5;
      } else if (car.type !== 'POLICE') {
        for (const other of newCars) {
          if (other.type === 'POLICE' && other.mission?.type === 'RESPONSE') {
            const dist = Math.hypot(other.x - x, other.y - y);
            if (dist < ROAD_WIDTH * 2) {
              shouldYield = true;
              break;
            }
          }
        }
      }

      if (isRedLight || isBlocked || shouldYield) {
        speed = Math.max(0, speed - DECELERATION);
        state = 'STOPPED';
        if (isRedLight && intersection) queueMap[`${intersection.id}_${dir}`] = (queueMap[`${intersection.id}_${dir}`] || 0) + 1;
      } else {
        speed = Math.min(maxSpeed, speed + ACCELERATION);
        state = speed < maxSpeed ? 'ACCELERATING' : 'MOVING';
      }

      if (dir === 'N') y -= speed; if (dir === 'S') y += speed;
      if (dir === 'W') x -= speed; if (dir === 'E') x += speed;

      if (intersection) {
        const iX = (intersection.x + 0.5) * BLOCK_SIZE, iY = (intersection.y + 0.5) * BLOCK_SIZE;
        if (Math.abs(x - iX) < car.speed * 2 && Math.abs(y - iY) < car.speed * 2) {
            targetIntersectionId = null;
            if (car.mission?.type === 'RESPONSE' && car.mission.targetId) {
                const targetInt = updatedIntersections.find(i => i.id === mission.targetId);
                if (targetInt) {
                    if (targetInt.x > intersection.x && dir !== 'E') dir = 'E';
                    else if (targetInt.x < intersection.x && dir !== 'W') dir = 'W';
                    else if (targetInt.y > intersection.y && dir !== 'S') dir = 'S';
                    else if (targetInt.y < intersection.y && dir !== 'N') dir = 'N';
                }
            } else {
                const possibleTurns = {
                    'N': { 'straight': 'N', 'left': 'W', 'right': 'E' },
                    'S': { 'straight': 'S', 'left': 'E', 'right': 'W' },
                    'E': { 'straight': 'E', 'left': 'N', 'right': 'S' },
                    'W': { 'straight': 'W', 'left': 'S', 'right': 'N' }
                };

                const getNextIntersectionCoords = (currentInt: Intersection, direction: 'N'|'S'|'E'|'W') => {
                    if (direction === 'N') return { x: currentInt.x, y: currentInt.y - 1 };
                    if (direction === 'S') return { x: currentInt.x, y: currentInt.y + 1 };
                    if (direction === 'E') return { x: currentInt.x + 1, y: currentInt.y };
                    if (direction === 'W') return { x: currentInt.x - 1, y: currentInt.y };
                    return {x: -1, y: -1};
                };
                
                let availableOptions = ['straight', 'left', 'right'];
                
                availableOptions = availableOptions.filter(turn => {
                    const nextDir = possibleTurns[dir][turn];
                    const nextCoords = getNextIntersectionCoords(intersection, nextDir);
                    return nextCoords.x >= 0 && nextCoords.x < GRID_SIZE && nextCoords.y >= 0 && nextCoords.y < GRID_SIZE;
                });

                availableOptions = availableOptions.filter(turn => {
                    const nextDir = possibleTurns[dir][turn];
                    const nextCoords = getNextIntersectionCoords(intersection, nextDir);
                    const nextIntId = `INT-${nextCoords.x}-${nextCoords.y}`;
                    const segmentId = [intersection.id, nextIntId].sort().join('_');
                    return !currentClosedRoads.has(segmentId);
                });
                
                if (availableOptions.length > 0) {
                    const chosenTurn = availableOptions[Math.floor(Math.random() * availableOptions.length)];
                    dir = possibleTurns[dir][chosenTurn];
                } else {
                    if (dir === 'N') dir = 'S'; else if (dir === 'S') dir = 'N';
                    else if (dir === 'E') dir = 'W'; else if (dir === 'W') dir = 'E';
                }
            }
            if (car.mission?.type === 'RESPONSE' && car.mission.targetId === intersection.id) {
              mission = { type: 'PATROL', targetId: null };
            }
        }
      }
      return { ...car, x, y, dir, speed, state, targetIntersectionId, mission };
    }).filter(c => c.x > -50 && c.x < getCanvasSize().width + 50 && c.y > -50 && c.y < getCanvasSize().height + 50);

    physicsState.current.intersections = updatedIntersections;
    physicsState.current.cars = newCars;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const { width, height } = getCanvasSize();
    if(canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);
    drawCityBackground(ctx, width, height);
    drawRoads(ctx, width, height, newCars, currentClosedRoads);
    if (cvModeActive) {
      ctx.save();
      ctx.filter = 'grayscale(1) contrast(1.5)';
      drawCars(ctx, newCars);
      ctx.restore();
      drawCVOverlay(ctx, newCars);
    } else {
      drawCars(ctx, newCars);
    }
    
    drawIncidents(ctx, currentIncidents, physicsState.current.selectedIncidentId);
    drawIntersections(ctx, updatedIntersections, physicsState.current.recentlyUpdatedJunctions);
    
    const selectedCar = newCars.find(c => c.id === physicsState.current.selectedCarId);
    if (selectedCar) {
      ctx.strokeStyle = '#FF9933';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#FF9933';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(selectedCar.x, selectedCar.y, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    const totalSpeed = newCars.reduce((sum, c) => sum + c.speed, 0);
    onUpdateStats(newCars.length, newCars.length > 0 ? totalSpeed / newCars.length : 0, queueMap);

    requestRef.current = requestAnimationFrame(animate);
  };
  
  useEffect(() => {
    if (isRunning) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isRunning]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    let clickedIncident = null;
    const CLICK_RADIUS = 20;
    for (const incident of physicsState.current.incidents) {
        if (Math.hypot(incident.location.x - x, incident.location.y - y) < CLICK_RADIUS) {
            clickedIncident = incident;
            break;
        }
    }

    if (clickedIncident) {
        onIncidentSelect(clickedIncident.id);
        return;
    }

    let clickedCar = null;
    for (const car of physicsState.current.cars) {
      if (Math.sqrt(Math.pow(car.x - x, 2) + Math.pow(car.y - y, 2)) < car.length) {
        clickedCar = car;
        break;
      }
    }

    if (clickedCar) {
      onCarSelect(clickedCar.id);
      return;
    }
    
    const gridX = Math.floor(x / BLOCK_SIZE), gridY = Math.floor(y / BLOCK_SIZE);
    const int = physicsState.current.intersections.find(i => i.x === gridX && i.y === gridY);
    if (int) {
      if (Math.abs(x - ((int.x + 0.5) * BLOCK_SIZE)) < BLOCK_SIZE / 2 && Math.abs(y - ((int.y + 0.5) * BLOCK_SIZE)) < BLOCK_SIZE / 2) {
        onIntersectionSelect(int.id);
        return;
      }
    }

    onIntersectionSelect("");
    onCarSelect("");
  };

  return <canvas ref={canvasRef} onClick={handleCanvasClick} className="w-full h-full" />;
};