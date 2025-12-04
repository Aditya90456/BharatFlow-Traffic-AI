import React, { useRef, useEffect, useLayoutEffect } from 'react';
import { GRID_SIZE, BLOCK_SIZE, ROAD_WIDTH, CAR_SIZE, YELLOW_DURATION, MAX_SPEED, ACCELERATION, DECELERATION, getCanvasSize } from '../constants';
import { Intersection, Car, LightState, VehicleType } from '../types';

interface SimulationCanvasProps {
  intersections: Intersection[];
  setIntersections: React.Dispatch<React.SetStateAction<Intersection[]>>;
  cars: Car[];
  setCars: React.Dispatch<React.SetStateAction<Car[]>>;
  onUpdateStats: (totalCars: number, avgSpeed: number, queueMap: Record<string, number>) => void;
  isRunning: boolean;
  onIntersectionSelect: (id: string) => void;
  scenarioKey: string;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  intersections,
  setIntersections,
  cars,
  setCars,
  onUpdateStats,
  isRunning,
  onIntersectionSelect,
  scenarioKey
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameCountRef = useRef(0);
  const requestRef = useRef<number>(0);

  // SOURCE OF TRUTH: Local mutable state for the physics loop
  const physicsState = useRef({
    intersections: intersections,
    cars: cars,
    currentScenarioKey: scenarioKey
  });

  // Sync Props to Physics State on Scenario Change
  useLayoutEffect(() => {
    if (scenarioKey !== physicsState.current.currentScenarioKey) {
       physicsState.current.intersections = intersections;
       physicsState.current.cars = cars;
       physicsState.current.currentScenarioKey = scenarioKey;
    }
  }, [intersections, cars, scenarioKey]);

  // Helper: Get Lane Center (LHT)
  const getLaneCenter = (gridIdx: number, isVertical: boolean, isForward: boolean) => {
    const roadCenter = (gridIdx + 0.5) * BLOCK_SIZE;
    const offset = ROAD_WIDTH / 4;
    return isForward ? (isVertical ? roadCenter - offset : roadCenter - offset) : (isVertical ? roadCenter + offset : roadCenter + offset);
  };

  // Improved Spawn Logic
  const spawnCar = (currentCars: Car[]): Car | null => {
    const edge = Math.floor(Math.random() * 4); 
    const laneIdx = Math.floor(Math.random() * GRID_SIZE);
    
    let x = 0, y = 0, dir: 'N'|'S'|'E'|'W' = 'S';
    
    // Logic for LHT Spawning
    if (edge === 0) { // Spawning Top (Southbound, Left Side)
      x = getLaneCenter(laneIdx, true, true);
      y = -CAR_SIZE * 3;
      dir = 'S';
    } else if (edge === 1) { // Spawning Right (Westbound, Bottom Side)
      x = GRID_SIZE * BLOCK_SIZE + CAR_SIZE * 3;
      y = getLaneCenter(laneIdx, false, false); 
      dir = 'W';
    } else if (edge === 2) { // Spawning Bottom (Northbound, Right Side)
      x = getLaneCenter(laneIdx, true, false);
      y = GRID_SIZE * BLOCK_SIZE + CAR_SIZE * 3;
      dir = 'N';
    } else { // Spawning Left (Eastbound, Top Side)
      x = -CAR_SIZE * 3;
      y = getLaneCenter(laneIdx, false, true);
      dir = 'E';
    }

    const r = Math.random();
    let type: VehicleType = 'CAR';
    let length = CAR_SIZE;
    let width = CAR_SIZE * 0.6;
    let maxSpeed = MAX_SPEED;

    if (r > 0.92) {
      type = 'BUS';
      length = CAR_SIZE * 3.5;
      width = CAR_SIZE * 1.3;
      maxSpeed = MAX_SPEED * 0.7; 
    } else if (r > 0.65) {
      type = 'AUTO';
      length = CAR_SIZE * 0.8;
      width = CAR_SIZE * 0.7;
      maxSpeed = MAX_SPEED * 0.85;
    }

    const safeDistance = length * 3;
    const isBlocked = currentCars.some(c => 
      Math.abs(c.x - x) < safeDistance && Math.abs(c.y - y) < safeDistance
    );

    if (isBlocked) return null;

    return {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      dir,
      speed: maxSpeed * 0.5,
      targetIntersectionId: null,
      state: 'ACCELERATING',
      type,
      width,
      length
    };
  };

  const drawCityBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // 1. Base Layer
    ctx.fillStyle = '#030305';
    ctx.fillRect(0, 0, width, height);

    // 2. City Blocks (Pseudo-3D)
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

             // Base Block
             ctx.fillStyle = '#0A0B10';
             ctx.fillRect(xStart, yStart, w, h);

             // Inner details (Circuit pattern)
             ctx.strokeStyle = '#13141C';
             ctx.lineWidth = 2;
             ctx.strokeRect(xStart + 10, yStart + 10, w - 20, h - 20);

             // "Building" Extrusions
             ctx.fillStyle = '#0F111A';
             const bSize = Math.min(w, h) * 0.6;
             const bx = xStart + (w - bSize)/2;
             const by = yStart + (h - bSize)/2;
             
             // Shadow
             ctx.fillStyle = 'rgba(0,0,0,0.5)';
             ctx.fillRect(bx + 4, by + 4, bSize, bSize);
             
             // Top Face
             ctx.fillStyle = '#181A24';
             ctx.fillRect(bx, by, bSize, bSize);
             
             // Tech Accent on Roof
             ctx.fillStyle = '#1E293B';
             ctx.fillRect(bx + bSize*0.2, by + bSize*0.2, bSize*0.6, bSize*0.6);
             
             // Glow Dot (Rooftop Light)
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

  const drawRoads = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Road Surface
    ctx.lineWidth = ROAD_WIDTH;
    ctx.lineCap = 'butt';
    ctx.strokeStyle = '#111218'; // Dark Asphalt
    
    // Vertical
    for (let x = 0; x < GRID_SIZE; x++) {
      const cx = (x + 0.5) * BLOCK_SIZE;
      
      // Road Bed
      ctx.strokeStyle = '#111218';
      ctx.lineWidth = ROAD_WIDTH;
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, height); ctx.stroke();
      
      // Lane Dividers (Glowing)
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.setLineDash([12, 18]);
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, height); ctx.stroke();
      
      // Edges (Neon Lines)
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)'; // Cyan faint glow
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - ROAD_WIDTH/2, 0); ctx.lineTo(cx - ROAD_WIDTH/2, height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + ROAD_WIDTH/2, 0); ctx.lineTo(cx + ROAD_WIDTH/2, height); ctx.stroke();
    }
    
    // Horizontal
    for (let y = 0; y < GRID_SIZE; y++) {
      const cy = (y + 0.5) * BLOCK_SIZE;
      
      // Road Bed
      ctx.strokeStyle = '#111218';
      ctx.lineWidth = ROAD_WIDTH;
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(width, cy); ctx.stroke();
      
      // Lane Dividers
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.setLineDash([12, 18]);
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(width, cy); ctx.stroke();

      // Edges
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, cy - ROAD_WIDTH/2); ctx.lineTo(width, cy - ROAD_WIDTH/2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, cy + ROAD_WIDTH/2); ctx.lineTo(width, cy + ROAD_WIDTH/2); ctx.stroke();
    }
  };

  const drawTrafficFlowOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number, cars: Car[], frame: number) => {
    ctx.save();
    
    // Calculate per-lane density
    const densityN: number[] = new Array(GRID_SIZE).fill(0);
    const densityS: number[] = new Array(GRID_SIZE).fill(0);
    const densityE: number[] = new Array(GRID_SIZE).fill(0);
    const densityW: number[] = new Array(GRID_SIZE).fill(0);
    
    cars.forEach(c => {
      const gridX = Math.floor(c.x / BLOCK_SIZE);
      const gridY = Math.floor(c.y / BLOCK_SIZE);
      if (c.dir === 'N' && gridX >= 0 && gridX < GRID_SIZE) densityN[gridX]++;
      if (c.dir === 'S' && gridX >= 0 && gridX < GRID_SIZE) densityS[gridX]++;
      if (c.dir === 'E' && gridY >= 0 && gridY < GRID_SIZE) densityE[gridY]++;
      if (c.dir === 'W' && gridY >= 0 && gridY < GRID_SIZE) densityW[gridY]++;
    });

    const getDensityColor = (count: number) => {
      if (count > 6) return 'rgba(239, 68, 68, 0.8)'; // Red
      if (count > 3) return 'rgba(245, 158, 11, 0.7)'; // Amber
      return 'rgba(6, 182, 212, 0.2)'; // Cyan
    };

    const spacing = 80; 
    const speed = 1.0;
    const offset = (frame * speed) % spacing;
    const arrowSize = 3;
    const laneOffset = ROAD_WIDTH / 4;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Draw Flows
    const drawArrows = (sx: number, sy: number, ex: number, ey: number, density: number, isVert: boolean, dirMultiplier: number) => {
      const color = getDensityColor(density);
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = density > 3 ? 6 : 0;

      if (isVert) {
        // Vertical
        for (let y = (dirMultiplier > 0 ? -spacing + offset : height + spacing - offset); 
             (dirMultiplier > 0 ? y < height : y > 0); 
             y += (dirMultiplier * spacing)) {
             
             // Check intersection gap
             const intY = Math.floor(y / BLOCK_SIZE);
             const intCenterY = (intY + 0.5) * BLOCK_SIZE;
             if (Math.abs(y - intCenterY) < ROAD_WIDTH/2) continue;

             ctx.beginPath();
             ctx.moveTo(sx - arrowSize, y - (dirMultiplier*arrowSize));
             ctx.lineTo(sx, y);
             ctx.lineTo(sx + arrowSize, y - (dirMultiplier*arrowSize));
             ctx.stroke();
        }
      } else {
        // Horizontal
        for (let x = (dirMultiplier > 0 ? -spacing + offset : width + spacing - offset);
             (dirMultiplier > 0 ? x < width : x > 0);
             x += (dirMultiplier * spacing)) {

             const intX = Math.floor(x / BLOCK_SIZE);
             const intCenterX = (intX + 0.5) * BLOCK_SIZE;
             if (Math.abs(x - intCenterX) < ROAD_WIDTH/2) continue;

             ctx.beginPath();
             ctx.moveTo(x - (dirMultiplier*arrowSize), sy - arrowSize);
             ctx.lineTo(x, sy);
             ctx.lineTo(x - (dirMultiplier*arrowSize), sy + arrowSize);
             ctx.stroke();
        }
      }
    };

    // Render Loops
    for (let x = 0; x < GRID_SIZE; x++) {
      const cx = (x + 0.5) * BLOCK_SIZE;
      drawArrows(cx - laneOffset, 0, 0, 0, densityS[x], true, 1);  // Southbound (Left)
      drawArrows(cx + laneOffset, 0, 0, 0, densityN[x], true, -1); // Northbound (Right)
    }
    for (let y = 0; y < GRID_SIZE; y++) {
      const cy = (y + 0.5) * BLOCK_SIZE;
      drawArrows(0, cy - laneOffset, 0, 0, densityE[y], false, 1);  // Eastbound (Top)
      drawArrows(0, cy + laneOffset, 0, 0, densityW[y], false, -1); // Westbound (Bottom)
    }

    ctx.shadowBlur = 0;
    ctx.restore();
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

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(-car.width/2 + 2, -car.length/2 + 2, car.width, car.length);

      // Body Color
      if (car.type === 'AUTO') ctx.fillStyle = '#FBBF24'; // Auto Yellow
      else if (car.type === 'BUS') ctx.fillStyle = '#EF4444'; // Bus Red
      else ctx.fillStyle = '#E2E8F0'; // Car White/Silver

      // Shape
      if (car.type === 'AUTO') {
        ctx.beginPath();
        ctx.moveTo(0, -car.length/2);
        ctx.lineTo(car.width/2, car.length/2);
        ctx.lineTo(-car.width/2, car.length/2);
        ctx.fill();
        // Roof
        ctx.fillStyle = '#111';
        ctx.fillRect(-car.width/3, -car.length/4, car.width/1.5, car.length/2);
      } else {
        // Car/Bus Body
        ctx.beginPath();
        ctx.roundRect(-car.width/2, -car.length/2, car.width, car.length, car.type === 'BUS' ? 1 : 2);
        ctx.fill();
        
        // Windshield / Roof
        ctx.fillStyle = '#1E293B';
        const glassMargin = car.type === 'BUS' ? 2 : 1;
        ctx.fillRect(-car.width/2 + glassMargin, -car.length/2 + 3, car.width - glassMargin*2, car.length * 0.25);
        ctx.fillRect(-car.width/2 + glassMargin, car.length/2 - car.length * 0.25 - 2, car.width - glassMargin*2, car.length * 0.20);
      }

      // Headlights (Yellow/White Glow)
      ctx.fillStyle = '#FEF08A';
      ctx.shadowColor = '#FEF08A';
      ctx.shadowBlur = 8;
      ctx.fillRect(-car.width/2 + 1, -car.length/2 - 1, 2, 2);
      ctx.fillRect(car.width/2 - 3, -car.length/2 - 1, 2, 2);
      
      // Taillights (Red Glow) - Brighter if Stopped
      ctx.fillStyle = car.state === 'STOPPED' ? '#EF4444' : '#7F1D1D';
      ctx.shadowColor = '#EF4444';
      ctx.shadowBlur = car.state === 'STOPPED' ? 10 : 0;
      
      ctx.fillRect(-car.width/2 + 1, car.length/2 - 1, 2, 2);
      ctx.fillRect(car.width/2 - 3, car.length/2 - 1, 2, 2);

      ctx.shadowBlur = 0;
      ctx.restore();
    });
  };

  const drawIntersections = (ctx: CanvasRenderingContext2D, ints: Intersection[]) => {
    ints.forEach(i => {
      const cx = (i.x + 0.5) * BLOCK_SIZE;
      const cy = (i.y + 0.5) * BLOCK_SIZE;
      const rw = ROAD_WIDTH;

      // Stop Lines
      ctx.fillStyle = '#334155';
      const stopLineOffset = rw * 0.7;
      const stopLineW = rw;
      const stopLineH = 4;
      ctx.fillRect(cx - stopLineW/2, cy - stopLineOffset, stopLineW, stopLineH); // N
      ctx.fillRect(cx - stopLineW/2, cy + stopLineOffset - stopLineH, stopLineW, stopLineH); // S
      ctx.fillRect(cx - stopLineOffset, cy - stopLineW/2, stopLineH, stopLineW); // W
      ctx.fillRect(cx + stopLineOffset - stopLineH, cy - stopLineW/2, stopLineH, stopLineW); // E

      // Traffic Light Orbs
      const drawLight = (lx: number, ly: number, state: LightState) => {
        // Casing
        ctx.fillStyle = '#0F172A';
        ctx.beginPath(); ctx.arc(lx, ly, 5, 0, Math.PI * 2); ctx.fill();
        
        // Light
        ctx.beginPath(); ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
        let color = '#333';
        if (state === LightState.GREEN) color = '#10B981';
        if (state === LightState.YELLOW) color = '#F59E0B';
        if (state === LightState.RED) color = '#EF4444';
        
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      };

      const lightOffset = rw/2 + 10;
      drawLight(cx - lightOffset, cy - lightOffset, i.lightState.ns); // Top Left (Controls Southbound) - LHT logic is subtle here
      drawLight(cx + lightOffset, cy + lightOffset, i.lightState.ns);
      drawLight(cx + lightOffset, cy - lightOffset, i.lightState.ew);
      drawLight(cx - lightOffset, cy + lightOffset, i.lightState.ew);

      // Label Overlay
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '600 11px Rajdhani';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 4;
      ctx.fillText(i.label, cx, cy);
      ctx.shadowBlur = 0;
    });
  };

  const draw = (ctx: CanvasRenderingContext2D, currentIntersections: Intersection[], currentCars: Car[]) => {
    const { width, height } = getCanvasSize();
    ctx.clearRect(0, 0, width, height);

    drawCityBackground(ctx, width, height);
    drawRoads(ctx, width, height);
    drawTrafficFlowOverlay(ctx, width, height, currentCars, frameCountRef.current);
    drawIntersections(ctx, currentIntersections);
    drawCars(ctx, currentCars);
  };

  // Main Physics & Render Loop
  useEffect(() => {
    if (!isRunning) return;
    
    const render = () => {
      frameCountRef.current++;
      
      const currentIntersections = physicsState.current.intersections;
      const currentCars = physicsState.current.cars;
      
      // Update Lights
      const nextIntersections = currentIntersections.map(i => {
        let next = { ...i };
        next.timer--;
        if (next.timer <= 0) {
          if (i.lightState.ns === LightState.GREEN) {
            next.lightState = { ns: LightState.YELLOW, ew: LightState.RED };
            next.timer = YELLOW_DURATION;
          } else if (i.lightState.ns === LightState.YELLOW) {
            next.lightState = { ns: LightState.RED, ew: LightState.GREEN };
            next.timer = i.greenDuration;
          } else if (i.lightState.ew === LightState.GREEN) {
            next.lightState = { ns: LightState.RED, ew: LightState.YELLOW };
            next.timer = YELLOW_DURATION;
          } else if (i.lightState.ew === LightState.YELLOW) {
            next.lightState = { ns: LightState.GREEN, ew: LightState.RED };
            next.timer = i.greenDuration;
          }
        }
        return next;
      });

      // Update Cars
      let nextCars = [...currentCars];
      
      if (frameCountRef.current % 25 === 0 && nextCars.length < 140) { 
        const newCar = spawnCar(nextCars);
        if (newCar) nextCars.push(newCar);
      }

      let totalSpeed = 0;
      const queueMap: Record<string, number> = {};
      const { width, height } = getCanvasSize();

      nextCars = nextCars.map(car => {
        let { x, y, dir, speed, state } = car;
        
        let nextInt: Intersection | undefined;
        let distToInt = Infinity;

        nextIntersections.forEach(i => {
          const cx = (i.x + 0.5) * BLOCK_SIZE;
          const cy = (i.y + 0.5) * BLOCK_SIZE;
          let d = Infinity;
          
          if (dir === 'N' && y > cy && Math.abs(x - cx) < ROAD_WIDTH) d = y - cy;
          else if (dir === 'S' && y < cy && Math.abs(x - cx) < ROAD_WIDTH) d = cy - y;
          else if (dir === 'W' && x > cx && Math.abs(y - cy) < ROAD_WIDTH) d = x - cx;
          else if (dir === 'E' && x < cx && Math.abs(y - cy) < ROAD_WIDTH) d = cx - x;
          
          if (d < distToInt) {
            distToInt = d;
            nextInt = i;
          }
        });

        let shouldStop = false;
        const stopLineOffset = ROAD_WIDTH * 0.6; 
        
        if (nextInt && distToInt < stopLineOffset + 20 && distToInt > stopLineOffset - 20) {
           const light = nextInt.lightState;
           if ((dir === 'N' || dir === 'S') && light.ns !== LightState.GREEN) shouldStop = true;
           if ((dir === 'E' || dir === 'W') && light.ew !== LightState.GREEN) shouldStop = true;
           if (distToInt < stopLineOffset) shouldStop = false;
        }

        const lookAhead = car.length * 2.0 + speed * 10; 
        const carAhead = nextCars.find(c => {
           if (c.id === car.id) return false;
           // Improved Lane Check
           const sameLane = (c.dir === dir) && 
             (dir === 'N' || dir === 'S' ? Math.abs(c.x - x) < 8 : Math.abs(c.y - y) < 8);
           
           if (!sameLane) return false;
           
           if (dir === 'N' && c.y < y && y - c.y < lookAhead) return true;
           if (dir === 'S' && c.y > y && c.y - y < lookAhead) return true;
           if (dir === 'W' && c.x < x && x - c.x < lookAhead) return true;
           if (dir === 'E' && c.x > x && c.x - x < lookAhead) return true;
           return false;
        });

        if (carAhead) shouldStop = true;

        if (shouldStop) {
          speed = Math.max(0, speed - DECELERATION);
          state = 'STOPPED';
          if (nextInt && speed === 0) {
             const k = `${nextInt.id}_${dir}`;
             queueMap[k] = (queueMap[k] || 0) + 1;
          }
        } else {
          speed = Math.min(MAX_SPEED, speed + ACCELERATION);
          state = 'MOVING';
          if (dir === 'N') y -= speed;
          if (dir === 'S') y += speed;
          if (dir === 'W') x -= speed;
          if (dir === 'E') x += speed;
        }

        totalSpeed += speed;
        return { ...car, x, y, speed, state };
      }).filter(c => {
        return c.x > -100 && c.x < width + 100 && c.y > -100 && c.y < height + 100;
      });

      // Update Physics State
      physicsState.current.intersections = nextIntersections;
      physicsState.current.cars = nextCars;

      // Draw
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) draw(ctx, nextIntersections, nextCars);
      }

      // Sync React State periodically
      setIntersections(nextIntersections);
      setCars(nextCars);
      
      if (frameCountRef.current % 30 === 0) {
        onUpdateStats(
          nextCars.length, 
          nextCars.length > 0 ? totalSpeed / nextCars.length : 0,
          queueMap
        );
      }

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning, onUpdateStats, setCars, setIntersections]); 

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const hitRadius = ROAD_WIDTH;
    const clicked = physicsState.current.intersections.find(i => {
      const cx = (i.x + 0.5) * BLOCK_SIZE;
      const cy = (i.y + 0.5) * BLOCK_SIZE;
      return x >= cx - hitRadius && x <= cx + hitRadius &&
             y >= cy - hitRadius && y <= cy + hitRadius;
    });

    if (clicked) onIntersectionSelect(clicked.id);
  };

  const { width, height } = getCanvasSize();

  return (
    <canvas 
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleCanvasClick}
      className="cursor-pointer"
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
      }}
    />
  );
};