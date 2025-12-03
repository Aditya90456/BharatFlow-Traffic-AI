
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
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  intersections,
  setIntersections,
  cars,
  setCars,
  onUpdateStats,
  isRunning,
  onIntersectionSelect
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameCountRef = useRef(0);
  const requestRef = useRef<number>();

  // SOURCE OF TRUTH: Local mutable state for the physics loop.
  // We use this instead of props to ensure 60fps smoothness regardless of React render speed.
  const physicsState = useRef({
    intersections: intersections,
    cars: cars,
    // Track initialization to avoid overwriting simulation with stale props on re-renders
    initializedId: intersections[0]?.id 
  });

  // 1. Sync Props to Physics State ONLY when the "Scenario" changes (e.g. City switch)
  useLayoutEffect(() => {
    const currentFirstId = intersections[0]?.id;
    // If the city changed (different IDs), reset our local physics state to the new props
    if (currentFirstId !== physicsState.current.initializedId) {
       physicsState.current.intersections = intersections;
       physicsState.current.cars = cars;
       physicsState.current.initializedId = currentFirstId;
    }
    // Note: We DO NOT sync on every render, because props might be "stale" compared to our loop
  }, [intersections, cars]);


  // Helper: Get Lane Center for Left-Hand Traffic (LHT)
  const getLaneCenter = (gridIdx: number, isVertical: boolean, isForward: boolean) => {
    const roadCenter = (gridIdx + 0.5) * BLOCK_SIZE;
    const offset = ROAD_WIDTH / 4;
    
    if (isVertical) {
      // isForward = Southbound. Left (West).
      return isForward ? roadCenter - offset : roadCenter + offset;
    } else {
      // Horizontal
      // isForward = Eastbound. Left (North).
      return isForward ? roadCenter - offset : roadCenter + offset;
    }
  };

  // Spawn Logic
  const spawnCar = (currentCars: Car[]): Car | null => {
    const edge = Math.floor(Math.random() * 4); // 0: Top, 1: Right, 2: Bottom, 3: Left
    const laneIdx = Math.floor(Math.random() * GRID_SIZE);
    
    let x = 0, y = 0, dir: 'N'|'S'|'E'|'W' = 'S';
    
    if (edge === 0) { // Top Edge (Spawning Southbound)
      x = getLaneCenter(laneIdx, true, true);
      y = -CAR_SIZE * 3;
      dir = 'S';
    } else if (edge === 1) { // Right Edge (Spawning Westbound)
      x = GRID_SIZE * BLOCK_SIZE + CAR_SIZE * 3;
      y = getLaneCenter(laneIdx, false, false);
      dir = 'W';
    } else if (edge === 2) { // Bottom Edge (Spawning Northbound)
      x = getLaneCenter(laneIdx, true, false);
      y = GRID_SIZE * BLOCK_SIZE + CAR_SIZE * 3;
      dir = 'N';
    } else { // Left Edge (Spawning Eastbound)
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
      length = CAR_SIZE * 3;
      width = CAR_SIZE * 1.2;
      maxSpeed = MAX_SPEED * 0.7; 
    } else if (r > 0.65) {
      type = 'AUTO';
      length = CAR_SIZE * 0.9;
      width = CAR_SIZE * 0.65;
      maxSpeed = MAX_SPEED * 0.85;
    }

    const safeDistance = length * 2.5;
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

  // --- Drawing Functions ---
  
  const drawTrafficFlowOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number, cars: Car[], frame: number) => {
    ctx.save();
    
    // Animation params
    const spacing = 60; 
    const speed = 1.5;
    const offset = (frame * speed) % spacing;
    const arrowSize = 4;
    const laneOffset = ROAD_WIDTH / 4;

    // Helper to determine color based on density
    const getDensityColor = (count: number) => {
      if (count > 8) return 'rgba(239, 68, 68, 0.6)'; // Red (High)
      if (count > 4) return 'rgba(245, 158, 11, 0.5)'; // Amber (Med)
      return 'rgba(6, 182, 212, 0.3)'; // Cyan (Low)
    };

    // Calculate densities
    const vDensity: number[] = new Array(GRID_SIZE).fill(0);
    const hDensity: number[] = new Array(GRID_SIZE).fill(0);
    
    cars.forEach(c => {
      // Simple bucket mapping
      const gridX = Math.floor(c.x / BLOCK_SIZE);
      const gridY = Math.floor(c.y / BLOCK_SIZE);
      if (gridX >= 0 && gridX < GRID_SIZE && (c.dir === 'N' || c.dir === 'S')) vDensity[gridX]++;
      if (gridY >= 0 && gridY < GRID_SIZE && (c.dir === 'E' || c.dir === 'W')) hDensity[gridY]++;
    });

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // 1. Vertical Roads
    for (let x = 0; x < GRID_SIZE; x++) {
      const cx = (x + 0.5) * BLOCK_SIZE;
      const color = getDensityColor(vDensity[x]);
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 4;

      // Southbound (Left Lane)
      const sx = cx - laneOffset;
      for (let y = -spacing + offset; y < height; y += spacing) {
        if (y < -20 || y > height + 20) continue;
        // Check if inside intersection (don't draw over center)
        const intY = Math.floor(y / BLOCK_SIZE);
        const intCenterY = (intY + 0.5) * BLOCK_SIZE;
        if (Math.abs(y - intCenterY) < ROAD_WIDTH/2 - 10) continue;

        ctx.beginPath();
        ctx.moveTo(sx - arrowSize, y - arrowSize);
        ctx.lineTo(sx, y);
        ctx.lineTo(sx + arrowSize, y - arrowSize);
        ctx.stroke();
      }

      // Northbound (Right Lane)
      const nx = cx + laneOffset;
      for (let y = height + spacing - offset; y > 0; y -= spacing) {
        if (y < -20 || y > height + 20) continue;
        const intY = Math.floor(y / BLOCK_SIZE);
        const intCenterY = (intY + 0.5) * BLOCK_SIZE;
        if (Math.abs(y - intCenterY) < ROAD_WIDTH/2 - 10) continue;

        ctx.beginPath();
        ctx.moveTo(nx - arrowSize, y + arrowSize);
        ctx.lineTo(nx, y);
        ctx.lineTo(nx + arrowSize, y + arrowSize);
        ctx.stroke();
      }
    }

    // 2. Horizontal Roads
    for (let y = 0; y < GRID_SIZE; y++) {
      const cy = (y + 0.5) * BLOCK_SIZE;
      const color = getDensityColor(hDensity[y]);
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      
      // Westbound (Top Lane)
      const wx = cy - laneOffset; 
      // Using 'wx' for Y coordinate of lane here? No, horizontal.
      // cy is Y center. Lane is cy - laneOffset.
      const laneY_West = cy - laneOffset;
      
      for (let x = width + spacing - offset; x > 0; x -= spacing) {
        if (x < -20 || x > width + 20) continue;
        const intX = Math.floor(x / BLOCK_SIZE);
        const intCenterX = (intX + 0.5) * BLOCK_SIZE;
        if (Math.abs(x - intCenterX) < ROAD_WIDTH/2 - 10) continue;

        ctx.beginPath();
        ctx.moveTo(x + arrowSize, laneY_West - arrowSize);
        ctx.lineTo(x, laneY_West);
        ctx.lineTo(x + arrowSize, laneY_West + arrowSize);
        ctx.stroke();
      }

      // Eastbound (Bottom Lane)
      const laneY_East = cy + laneOffset;
      for (let x = -spacing + offset; x < width; x += spacing) {
        if (x < -20 || x > width + 20) continue;
        const intX = Math.floor(x / BLOCK_SIZE);
        const intCenterX = (intX + 0.5) * BLOCK_SIZE;
        if (Math.abs(x - intCenterX) < ROAD_WIDTH/2 - 10) continue;

        ctx.beginPath();
        ctx.moveTo(x - arrowSize, laneY_East - arrowSize);
        ctx.lineTo(x, laneY_East);
        ctx.lineTo(x - arrowSize, laneY_East + arrowSize);
        ctx.stroke();
      }
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  };

  const draw = (ctx: CanvasRenderingContext2D, currentIntersections: Intersection[], currentCars: Car[]) => {
    const { width, height } = getCanvasSize();
    ctx.clearRect(0, 0, width, height);

    // 1. City Background
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#0F1016';
    for(let x = 0; x <= GRID_SIZE; x++) {
      const xStart = x === 0 ? 0 : (x - 0.5) * BLOCK_SIZE + ROAD_WIDTH/2;
      const xEnd = x === GRID_SIZE ? width : (x + 0.5) * BLOCK_SIZE - ROAD_WIDTH/2;
      if (xEnd > xStart) {
        for(let y = 0; y <= GRID_SIZE; y++) {
          const yStart = y === 0 ? 0 : (y - 0.5) * BLOCK_SIZE + ROAD_WIDTH/2;
          const yEnd = y === GRID_SIZE ? height : (y + 0.5) * BLOCK_SIZE - ROAD_WIDTH/2;
          if (yEnd > yStart) {
            ctx.fillStyle = '#0F1016';
            ctx.fillRect(xStart, yStart, xEnd - xStart, yEnd - yStart);
            ctx.fillStyle = '#15161e';
            const pad = 10;
            if (xEnd - xStart > pad*2 && yEnd - yStart > pad*2) {
              ctx.fillRect(xStart + pad, yStart + pad, xEnd - xStart - pad*2, yEnd - yStart - pad*2);
              ctx.fillStyle = '#1a1c25';
              ctx.fillRect(xStart + pad + 15, yStart + pad + 15, xEnd - xStart - pad*2 - 30, yEnd - yStart - pad*2 - 40);
            }
          }
        }
      }
    }

    // 2. Roads
    ctx.lineWidth = ROAD_WIDTH;
    ctx.lineCap = 'butt';
    ctx.strokeStyle = '#1c1e26';
    for (let x = 0; x < GRID_SIZE; x++) {
      const cx = (x + 0.5) * BLOCK_SIZE;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle = '#2a2d3a';
      ctx.lineWidth = 2;
      ctx.setLineDash([15, 15]);
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = ROAD_WIDTH;
      ctx.strokeStyle = '#1c1e26';
    }
    for (let y = 0; y < GRID_SIZE; y++) {
      const cy = (y + 0.5) * BLOCK_SIZE;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle = '#2a2d3a';
      ctx.lineWidth = 2;
      ctx.setLineDash([15, 15]);
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = ROAD_WIDTH;
      ctx.strokeStyle = '#1c1e26';
    }

    // 2.5 TRAFFIC FLOW OVERLAY
    drawTrafficFlowOverlay(ctx, width, height, currentCars, frameCountRef.current);

    // 3. Intersections
    currentIntersections.forEach(i => {
      const cx = (i.x + 0.5) * BLOCK_SIZE;
      const cy = (i.y + 0.5) * BLOCK_SIZE;
      const rw = ROAD_WIDTH;

      ctx.fillStyle = '#374151';
      const cwOffset = rw * 0.7;
      const cwSize = rw;
      const cwThick = 6;
      ctx.fillRect(cx - cwSize/2, cy - cwOffset, cwSize, cwThick);
      ctx.fillRect(cx - cwSize/2, cy + cwOffset, cwSize, cwThick);
      ctx.fillRect(cx - cwOffset, cy - cwSize/2, cwThick, cwSize);
      ctx.fillRect(cx + cwOffset, cy - cwSize/2, cwThick, cwSize);

      const drawLight = (lx: number, ly: number, state: LightState) => {
        ctx.beginPath();
        ctx.arc(lx, ly, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#1f2937';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(lx, ly, 3, 0, Math.PI * 2);
        if (state === LightState.GREEN) {
          ctx.fillStyle = '#10b981';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 8;
        } else if (state === LightState.YELLOW) {
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 8;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      };

      drawLight(cx - rw/2 - 8, cy - rw/2 - 8, i.lightState.ns);
      drawLight(cx + rw/2 + 8, cy + rw/2 + 8, i.lightState.ns);
      drawLight(cx - rw/2 - 8, cy + rw/2 + 8, i.lightState.ew);
      drawLight(cx + rw/2 + 8, cy - rw/2 - 8, i.lightState.ew);

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 10px Rajdhani';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(i.label, cx, cy);
      ctx.shadowBlur = 0;
    });

    // 4. Cars
    currentCars.forEach(car => {
      ctx.save();
      ctx.translate(car.x, car.y);
      let angle = 0;
      if (car.dir === 'S') angle = Math.PI;
      if (car.dir === 'W') angle = -Math.PI / 2;
      if (car.dir === 'E') angle = Math.PI / 2;
      ctx.rotate(angle);

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-car.width/2 + 2, -car.length/2 + 2, car.width, car.length);

      if (car.type === 'AUTO') ctx.fillStyle = '#fbbf24';
      else if (car.type === 'BUS') ctx.fillStyle = '#ef4444';
      else ctx.fillStyle = '#cbd5e1';

      if (car.type === 'AUTO') {
        ctx.beginPath();
        ctx.moveTo(0, -car.length/2);
        ctx.lineTo(car.width/2, car.length/2);
        ctx.lineTo(-car.width/2, car.length/2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.fillRect(-car.width/3, -car.length/4, car.width/1.5, car.length/2);
      } else {
        ctx.beginPath();
        ctx.roundRect(-car.width/2, -car.length/2, car.width, car.length, 2);
        ctx.fill();
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-car.width/2 + 1, -car.length/2 + 2, car.width - 2, car.length * 0.2);
        if (car.type === 'BUS') {
           ctx.fillStyle = '#ffffff';
           ctx.fillRect(-car.width/2 + 2, -car.length * 0.2, car.width - 4, car.length * 0.5);
        }
      }

      ctx.fillStyle = '#fbbf24';
      ctx.globalAlpha = 0.8;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 6;
      ctx.fillRect(-car.width/2 + 1, -car.length/2 - 2, 2, 2);
      ctx.fillRect(car.width/2 - 3, -car.length/2 - 2, 2, 2);
      
      if (car.state === 'STOPPED') {
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = '#7f1d1d';
        ctx.shadowBlur = 0;
      }
      ctx.fillRect(-car.width/2 + 1, car.length/2, 2, 1);
      ctx.fillRect(car.width/2 - 3, car.length/2, 2, 1);
      ctx.restore();
    });
  };

  // Animation Loop Effect
  useEffect(() => {
    if (!isRunning) return;
    
    const render = () => {
      frameCountRef.current++;
      
      // Use Local Physics State for next frame calculation
      // This decouples physics from React render cycle
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
      
      if (frameCountRef.current % 25 === 0 && nextCars.length < 120) { 
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

        const lookAhead = car.length * 2.0 + speed * 5; 
        const carAhead = nextCars.find(c => {
           if (c.id === car.id) return false;
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

      // UPDATE LOCAL PHYSICS STATE
      physicsState.current.intersections = nextIntersections;
      physicsState.current.cars = nextCars;

      // Draw immediately with new data
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
           draw(ctx, nextIntersections, nextCars);
        }
      }

      // Sync with React State (UI)
      // Note: This triggers a re-render of App, but because we use physicsState.current for the next frame,
      // we are immune to the timing/stale data of that re-render.
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

  // Click Handler
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

    if (clicked) {
      onIntersectionSelect(clicked.id);
    }
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
        boxShadow: '0 0 50px rgba(0,0,0,0.5)'
      }}
    />
  );
};
