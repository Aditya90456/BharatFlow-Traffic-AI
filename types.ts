export enum LightState {
  RED = 'RED',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW'
}

export type VehicleType = 'CAR' | 'AUTO' | 'BUS';

export interface Coordinates {
  x: number;
  y: number;
}

export interface Intersection {
  id: string;
  label: string; // Human readable name
  x: number; // Grid coordinate X (0-n)
  y: number; // Grid coordinate Y (0-n)
  lightState: {
    ns: LightState; // North-South
    ew: LightState; // East-West
  };
  timer: number; // Seconds remaining in current state
  greenDuration: number; // How long green lasts
}

export interface Car {
  id: string;
  x: number; // Pixel X
  y: number; // Pixel Y
  dir: 'N' | 'S' | 'E' | 'W';
  speed: number;
  targetIntersectionId: string | null;
  state: 'MOVING' | 'STOPPED' | 'ACCELERATING';
  type: VehicleType;
  width: number;
  length: number;
}

export interface TrafficStats {
  totalCars: number;
  avgSpeed: number;
  congestionLevel: number; // 0-100
  carbonEmission: number; // Simulated kg
}

export interface SimulationConfig {
  spawnRate: number; // Cars per second
  timeScale: number; // 1x, 2x, etc.
  autoOptimize: boolean;
}

export interface GeminiAnalysis {
  timestamp: number;
  analysis: string;
  suggestedChanges: {
    intersectionId: string;
    newGreenDuration: number;
    reason: string;
  }[];
}