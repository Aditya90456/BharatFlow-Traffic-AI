export enum LightState {
  RED = 'RED',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW'
}

export type VehicleType = 'CAR' | 'AUTO' | 'BUS' | 'POLICE';
export type VehicleTypeOrBroken = VehicleType | 'BROKEN_DOWN';


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
  overrideState?: 'NS_GREEN' | 'EW_GREEN' | 'EMERGENCY_ALL_RED' | null;
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
  mission?: { type: 'PATROL' | 'RESPONSE', targetId: string | null } | null;
  isBrokenDown?: boolean;
}

export interface Road {
    id: string; // e.g., "INT-0-0_INT-1-0"
    name: string; // e.g., "MG Road"
    intersection1Id: string;
    intersection2Id: string;
}

export interface TrafficStats {
  totalCars: number;
  avgSpeed: number;
  congestionLevel: number; // 0-100
  carbonEmission: number; // Simulated kg
  incidents: number;
}

export interface Incident {
  id: string;
  type: 'BREAKDOWN' | 'ACCIDENT' | 'CONSTRUCTION';
  location: Coordinates;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: number;
  blocksSegmentId?: string; // e.g., "INT-0-0_INT-1-0"
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

export interface JunctionAnalysisResult {
    analysis: string;
    recommendation: string;
    reason: string;
}

export interface GeminiIncidentAnalysis {
    timestamp: number;
    assessment: string;
    recommended_action: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface RealWorldIntel {
  timestamp: number;
  intel: string;
  sources: GroundingChunk[];
}

export interface SearchResult {
  type: 'CITY' | 'INTERSECTION' | 'ROAD';
  id: string;
  name: string;
}

export type AiSearchAction = 
  | { name: 'select_object', args: { type: 'INTERSECTION' | 'CAR' | 'ROAD', name_or_id: string } } 
  | { name: 'find_most_congested_junction', args: {} }
  | { name: 'find_all_units_of_type', args: { type: VehicleTypeOrBroken } }
  | { name: 'find_incidents_by_severity', args: { severity: 'LOW' | 'MEDIUM' | 'HIGH' } };

export interface CongestedJunctionInfo {
  id: string;
  label: string;
  nsQueue: number;
  ewQueue: number;
}