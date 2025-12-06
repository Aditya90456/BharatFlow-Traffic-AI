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

const turnOptions = ['straight', 'left', 'right'] as const;
type Turn = typeof turnOptions[number];
type Direction = 'N' | 'S' | 'E' | 'W';


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
        ctx.fillRect(-car.width/2 + glassMargin, -car.length/2 + 3, car.width - glassMargin*2, car.length * 0.3);
      }
      
      if (car.isBrokenDown) {
          const hazardOn = Math.floor(frameCountRef.current / 20) % 2 === 0;
          if (hazardOn) {
              ctx.fillStyle = 'rgba(255, 165, 0, 1)';
              ctx.shadowColor = 'rgba(255, 165, 0, 1)';
              ctx.shadowBlur = 10;
              ctx.fillRect(-car.width/2 - 2, -car.length/2 - 2, 3, 3);
              ctx.fillRect(car.width/2 - 1, -car.length/2 - 2, 3, 3);
              ctx.fillRect(-car.width/2 - 2, car.length/2 - 1, 3, 3);
              ctx.fillRect(car.width/2 - 1, car.length/2 - 1, 3, 3);
              ctx.shadowBlur = 0;
          }
      }

      ctx.restore();
      
      if (physicsState.current.selectedCarId === car.id) {
          ctx.strokeStyle = '#FF9933';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          const pulse = Math.abs(Math.sin(frameCountRef.current / 20)) * 5;
          ctx.beginPath();
          ctx.arc(car.x, car.y, car.length + pulse, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
      }
    });
  };

 const drawIntersections = (ctx: CanvasRenderingContext2D, intersectionsToDraw: Intersection[]) => {
    intersectionsToDraw.forEach(intersection => {
      const cx = (intersection.x + 0.5) * BLOCK_SIZE;
      const cy = (intersection.y + 0.5) * BLOCK_SIZE;
      
      ctx.fillStyle = '#111218';
      ctx.beginPath();
      ctx.rect(cx - ROAD_WIDTH/2, cy - ROAD_WIDTH/2, ROAD_WIDTH, ROAD_WIDTH);
      ctx.fill();
      
      const lightSize = 8;
      const lightOffset = ROAD_WIDTH/2 - lightSize;

      const colors = {
        [LightState.RED]: '#EF4444',
        [LightState.YELLOW]: '#F59E0B',
        [LightState.GREEN]: '#10B981'
      };
      
      // Draw NS Lights
      const nsColor = colors[intersection.lightState.ns];
      ctx.fillStyle = nsColor;
      ctx.shadowColor = nsColor;
      ctx.shadowBlur = intersection.lightState.ns !== LightState.RED ? 15 : 5;
      ctx.fillRect(cx - lightSize/2, cy - lightOffset, lightSize, lightSize); // Top
      ctx.fillRect(cx - lightSize/2, cy + lightOffset - lightSize, lightSize, lightSize); // Bottom
      
      // Draw EW Lights
      const ewColor = colors[intersection.lightState.ew];
      ctx.fillStyle = ewColor;
      ctx.shadowColor = ewColor;
      ctx.shadowBlur = intersection.lightState.ew !== LightState.RED ? 15 : 5;
      ctx.fillRect(cx - lightOffset, cy - lightSize/2, lightSize, lightSize); // Left
      ctx.fillRect(cx + lightOffset - lightSize, cy - lightSize/2, lightSize, lightSize); // Right
      
      ctx.shadowBlur = 0;

      if(physicsState.current.recentlyUpdatedJunctions.has(intersection.id)) {
        ctx.strokeStyle = '#06B6D4';
        ctx.lineWidth = 3;
        const pulse = 1 - (frameCountRef.current % 150) / 150; // fades out
        ctx.globalAlpha = pulse;
        ctx.beginPath();
        ctx.arc(cx, cy, ROAD_WIDTH * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    });
  };
  
  const drawCvOverlay = (ctx: CanvasRenderingContext2D, carsToDraw: Car[]) => {
     ctx.font = '10px "JetBrains Mono"';
     ctx.lineWidth = 1;
     carsToDraw.forEach(car => {
        const key = car.id;
        if (!confidenceMap.has(key)) {
           confidenceMap.set(key, 0.9 + Math.random() * 0.1);
        }
        const confidence = confidenceMap.get(key)!;
        
        ctx.strokeStyle = `rgba(16, 185, 129, ${0.3 + confidence * 0.5})`;
        ctx.beginPath();
        ctx.rect(car.x - car.width, car.y - car.length, car.width*2, car.length*2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
        const text = `${car.type}:${(confidence*100).toFixed(0)}%`;
        const textWidth = ctx.measureText(text).width;
        ctx.fillRect(car.x - textWidth/2 - 2, car.y - car.length - 14, textWidth + 4, 12);
        ctx.fillStyle = 'black';
        ctx.fillText(text, car.x - textWidth/2, car.y - car.length - 4);
     });
  };
  
   const drawIncidentMarkers = (ctx: CanvasRenderingContext2D, incidentsToDraw: Incident[]) => {
      incidentsToDraw.forEach(incident => {
         const { x, y } = incident.location;
         const isSelected = incident.id === physicsState.current.selectedIncidentId;
         const pulse = Math.abs(Math.sin(frameCountRef.current / 20));
         
         ctx.save();
         ctx.translate(x, y);

         ctx.fillStyle = `rgba(239, 68, 68, ${0.3 + pulse * 0.3})`;
         ctx.beginPath();
         ctx.arc(0, 0, 20 + pulse * 5, 0, Math.PI * 2);
         ctx.fill();

         ctx.fillStyle = '#EF4444';
         ctx.beginPath();
         ctx.moveTo(0, -10);
         ctx.lineTo(10, 5);
         ctx.lineTo(-10, 5);
         ctx.closePath();
         ctx.fill();
         ctx.strokeStyle = 'white';
         ctx.lineWidth = 1.5;
         ctx.stroke();

         ctx.fillStyle = 'white';
         ctx.font = 'bold 12px sans-serif';
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';
         ctx.fillText('!', 0, 3);
         
         if (isSelected) {
            ctx.strokeStyle = '#F59E0B';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 30 + pulse * 5, 0, Math.PI * 2);
            ctx.stroke();
         }

         ctx.restore();
      });
   };

  const animate = () => {
    frameCountRef.current++;
    const frame = frameCountRef.current;
    let newCars = [...physicsState.current.cars];
    let newIntersections = [...physicsState.current.intersections];

    if (isRunning) {
      // 1. Update intersection timers and light states
      newIntersections = newIntersections.map(intersection => {
        let timer = intersection.timer - 1;
        let ns = intersection.lightState.ns;
        let ew = intersection.lightState.ew;

        if (intersection.overrideState) {
          ns = (intersection.overrideState === 'NS_GREEN') ? LightState.GREEN : LightState.RED;
          ew = (intersection.overrideState === 'EW_GREEN') ? LightState.GREEN : LightState.RED;
          if (intersection.overrideState === 'EMERGENCY_ALL_RED') {
            ns = LightState.RED; ew = LightState.RED;
          }
        } else {
            if (timer <= 0) {
                if (ns === LightState.GREEN) {
                    ns = LightState.YELLOW;
                    timer = YELLOW_DURATION;
                } else if (ns === LightState.YELLOW) {
                    ns = LightState.RED;
                    ew = LightState.GREEN;
                    timer = intersection.greenDuration;
                } else if (ew === LightState.GREEN) {
                    ew = LightState.YELLOW;
                    timer = YELLOW_DURATION;
                } else if (ew === LightState.YELLOW) {
                    ew = LightState.RED;
                    ns = LightState.GREEN;
                    timer = intersection.greenDuration;
                }
            }
        }
        return { ...intersection, timer, lightState: { ns, ew } };
      });
      physicsState.current.intersections = newIntersections;

      // 2. Spawn new cars
      if (frame % 30 === 0 && newCars.length < 100) {
        const car = spawnCar(newCars);
        if (car) newCars.push(car);
      }

      const queueMap: Record<string, number> = {};

      // 3. Update car physics
      newCars = newCars.map(car => {
        if (car.isBrokenDown) return car;

        let { x, y, dir, speed, state, targetIntersectionId, mission } = car;
        
        const gridX = Math.floor(x / BLOCK_SIZE);
        const gridY = Math.floor(y / BLOCK_SIZE);
        
        if (car.type === 'POLICE' && car.mission) {
            const currentMission = car.mission;
            if (currentMission.type === 'RESPONSE' && currentMission.targetId) {
                // Response logic is handled at intersections
            } else { // PATROL
                if (frame % 300 === 0 && Math.random() < 0.2) { // Periodically pick a new patrol point
                    const randomInt = newIntersections[Math.floor(Math.random() * newIntersections.length)];
                    mission = { ...currentMission, targetId: randomInt.id };
                }
            }
        }

        // Set initial target intersection
        if (!targetIntersectionId) {
          if (dir === 'S') targetIntersectionId = `INT-${gridX}-${gridY}`;
          if (dir === 'N') targetIntersectionId = `INT-${gridX}-${gridY-1}`;
          if (dir === 'E') targetIntersectionId = `INT-${gridX}-${gridY}`;
          if (dir === 'W') targetIntersectionId = `INT-${gridX-1}-${gridY}`;
        }

        let isApproachingRed = false;
        let carInFront: Car | null = null;

        const currentIntersection = physicsState.current.intersections.find(i => i.id === targetIntersectionId);
        
        if (currentIntersection) {
          const intX = (currentIntersection.x + 0.5) * BLOCK_SIZE;
          const intY = (currentIntersection.y + 0.5) * BLOCK_SIZE;
          const dist = Math.hypot(x - intX, y - intY);
          
          const stoppingDist = (speed * speed) / (2 * DECELERATION) + car.length;
          
          const isPoliceResponding = car.type === 'POLICE' && mission?.type === 'RESPONSE';

          if (dist < stoppingDist && !isPoliceResponding) {
            const lightState = (dir === 'N' || dir === 'S') ? currentIntersection.lightState.ns : currentIntersection.lightState.ew;
            if (lightState === LightState.RED || (lightState === LightState.YELLOW && dist < ROAD_WIDTH/2)) {
              isApproachingRed = true;
            }
          }

          if (dist < ROAD_WIDTH * 1.5) { // Check for queues when close to intersection
              const queueKey = `${currentIntersection.id}_${dir}`;
              if (!queueMap[queueKey]) queueMap[queueKey] = 0;
              queueMap[queueKey]++;
          }
          
          // Intersection turning logic
          if (dist < 1 && speed < 0.1) {
            let chosenTurn: Turn | null = null;
            
            const possibleTurns: Record<Direction, Record<Turn, Direction>> = {
                N: { straight: 'N', left: 'E', right: 'W' },
                S: { straight: 'S', left: 'W', right: 'E' },
                E: { straight: 'E', left: 'S', right: 'N' },
                W: { straight: 'W', left: 'N', right: 'S' },
            };

            const getAvailableTurns = (): Turn[] => {
                const turns: Turn[] = [];
                const currentDir = car.dir;
                Object.keys(possibleTurns[currentDir]).forEach(turn => {
                    const nextDir = possibleTurns[currentDir][turn as Turn];
                    let nextGridX = currentIntersection.x;
                    let nextGridY = currentIntersection.y;
                    if (nextDir === 'E') nextGridX++;
                    if (nextDir === 'W') nextGridX--;
                    if (nextDir === 'S') nextGridY++;
                    if (nextDir === 'N') nextGridY--;

                    const segmentId1 = [`INT-${currentIntersection.x}-${currentIntersection.y}`, `INT-${nextGridX}-${nextGridY}`].sort().join('_');
                     if (!physicsState.current.closedRoads.has(segmentId1)) {
                        turns.push(turn as Turn);
                    }
                });
                return turns;
            };
            
            const availableTurns = getAvailableTurns();

            if (car.type === 'POLICE' && car.mission && car.mission.type === 'RESPONSE' && car.mission.targetId) {
                const targetInt = physicsState.current.intersections.find(i => i.id === car.mission!.targetId);
                if (targetInt) {
                    const dx = targetInt.x - currentIntersection.x;
                    const dy = targetInt.y - currentIntersection.y;

                    if (dir === 'N') {
                        if (dy < 0) chosenTurn = 'straight';
                        else if (dx > 0) chosenTurn = 'left';
                        else if (dx < 0) chosenTurn = 'right';
                    } else if (dir === 'S') {
                         if (dy > 0) chosenTurn = 'straight';
                         else if (dx < 0) chosenTurn = 'left';
                         else if (dx > 0) chosenTurn = 'right';
                    } else if (dir === 'E') {
                        if (dx > 0) chosenTurn = 'straight';
                        else if (dy > 0) chosenTurn = 'left';
                        else if (dy < 0) chosenTurn = 'right';
                    } else if (dir === 'W') {
                        if (dx < 0) chosenTurn = 'straight';
                        else if (dy < 0) chosenTurn = 'left';
                        else if (dy > 0) chosenTurn = 'right';
                    }
                    if (chosenTurn && !availableTurns.includes(chosenTurn)) {
                       chosenTurn = availableTurns.length > 0 ? availableTurns[Math.floor(Math.random() * availableTurns.length)] : null;
                    }
                }
            } else {
                chosenTurn = availableTurns.length > 0 ? availableTurns[Math.floor(Math.random() * availableTurns.length)] : null;
            }

            if (chosenTurn) {
                const turn = chosenTurn;
                const newDir = possibleTurns[dir][turn];
                dir = newDir;
                state = 'ACCELERATING';
                let nextGridX = currentIntersection.x;
                let nextGridY = currentIntersection.y;

                if (newDir === 'E') {
                    nextGridX++;
                    x = intX + ROAD_WIDTH/2 + 1;
                    y = getLaneCenter(gridY, false, true);
                } else if (newDir === 'W') {
                    nextGridX--;
                    x = intX - ROAD_WIDTH/2 - 1;
                    y = getLaneCenter(gridY, false, false);
                } else if (newDir === 'S') {
                    nextGridY++;
                    y = intY + ROAD_WIDTH/2 + 1;
                    x = getLaneCenter(gridX, true, true);
                } else if (newDir === 'N') {
                    nextGridY--;
                    y = intY - ROAD_WIDTH/2 - 1;
                    x = getLaneCenter(gridX, true, false);
                }
                
                if(nextGridX >= 0 && nextGridX < GRID_SIZE && nextGridY >= 0 && nextGridY < GRID_SIZE) {
                  targetIntersectionId = `INT-${nextGridX}-${nextGridY}`;
                } else {
                  targetIntersectionId = null; // Leaving grid
                }
            }
          }
        }
        
        carInFront = newCars.find(otherCar => {
           if (otherCar.id === car.id) return false;
           let dX = otherCar.x - x;
           let dY = otherCar.y - y;
           if (dir === 'N') return dY < 0 && dY > -40 && Math.abs(dX) < car.width;
           if (dir === 'S') return dY > 0 && dY < 40 && Math.abs(dX) < car.width;
           if (dir === 'E') return dX > 0 && dX < 40 && Math.abs(dY) < car.width;
           if (dir === 'W') return dX < 0 && dX > -40 && Math.abs(dY) < car.width;
           return false;
        });

        if (isApproachingRed || carInFront) {
          state = 'STOPPED';
          speed = Math.max(0, speed - DECELERATION);
        } else {
          state = 'MOVING';
          speed = Math.min(MAX_SPEED, speed + ACCELERATION);
        }
        
        if (dir === 'N') y -= speed;
        if (dir === 'S') y += speed;
        if (dir === 'E') x += speed;
        if (dir === 'W') x -= speed;

        return { ...car, x, y, dir, speed, state, targetIntersectionId, mission };
      }).filter(c => 
          c.x > -50 && c.x < GRID_SIZE * BLOCK_SIZE + 50 &&
          c.y > -50 && c.y < GRID_SIZE * BLOCK_SIZE + 50
      );

      // 4. Set state
      setCars(newCars);
      setIntersections(newIntersections);

      // 5. Update stats
      const totalSpeed = newCars.reduce((sum, car) => sum + car.speed, 0);
      onUpdateStats(newCars.length, newCars.length > 0 ? totalSpeed / newCars.length : 0, queueMap);
    }

    // 6. Drawing
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      const { width, height } = getCanvasSize();
      canvas.width = width;
      canvas.height = height;

      drawCityBackground(ctx, width, height);
      drawRoads(ctx, width, height, newCars, physicsState.current.closedRoads);
      drawIntersections(ctx, physicsState.current.intersections);
      drawCars(ctx, newCars);
      drawIncidentMarkers(ctx, physicsState.current.incidents);
      if (cvModeActive) {
        drawCvOverlay(ctx, newCars);
      }
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isRunning, cvModeActive]);
  
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Check for incident click first
    const clickedIncident = physicsState.current.incidents.find(incident => {
        const dist = Math.hypot(x - incident.location.x, y - incident.location.y);
        return dist < 30; 
    });

    if (clickedIncident) {
        onIncidentSelect(clickedIncident.id);
        return;
    }

    // Check for car click
    const clickedCar = physicsState.current.cars.find(car => {
      const dist = Math.hypot(x - car.x, y - car.y);
      return dist < car.length;
    });

    if (clickedCar) {
      onCarSelect(clickedCar.id);
      return;
    }

    // Check for intersection click
    const clickedIntersection = physicsState.current.intersections.find(i => {
      const intX = (i.x + 0.5) * BLOCK_SIZE;
      const intY = (i.y + 0.5) * BLOCK_SIZE;
      const dist = Math.hypot(x - intX, y - intY);
      return dist < ROAD_WIDTH / 2;
    });

    if (clickedIntersection) {
      onIntersectionSelect(clickedIntersection.id);
      return;
    }
  };


  return <canvas ref={canvasRef} onClick={handleCanvasClick} className="bg-[#030305]" />;
};
