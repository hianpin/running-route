export type RouteType = 'walk' | 'cycle';

export interface OneMapSearchResultItem {
  SEARCHVAL: string;
  BUILDING?: string;
  ADDRESS: string;
  POSTAL?: string;
  ROAD_NAME?: string;
  LATITUDE: string;
  LONGITUDE: string;
  X?: string;
  Y?: string;
}

export interface OneMapSearchResponse {
  found: number;
  totalNumPages: number;
  pageNum: number;
  results: OneMapSearchResultItem[];
}

export interface RouteInstruction {
  instruction: string;
  distance: number; // in meters
  duration: number; // in seconds
  action: string;
  type: string;
}

export interface RouteSummary {
  total_distance: number; // in meters
  total_time: number;     // in seconds
  start_point: [number, number];
  end_point: [number, number];
}

export interface OneMapRouteResponse {
  status_message?: string;
  route_geometry: string; // Google Encoded Polyline string
  route_instructions: (RouteInstruction | string)[];
  route_summary: RouteSummary;
  route_name?: string[];
  error?: string;
}

export interface Milestone {
  km: number;
  coord: [number, number]; // [lat, lng]
}

export interface PresetRoute {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  description: string;
  startName: string;
  startCoord: [number, number];
  endName: string;
  endCoord: [number, number];
  routeType: RouteType;
  difficulty: 'Easy' | 'Moderate' | 'Scenic' | 'Challenging';
  approxDistanceKm: number;
  highlights: string[];
}

export interface TokenStatus {
  token: string | null;
  expiryTimestamp: number | null; // unix timestamp in seconds
  isValid: boolean;
  source: 'local' | 'server' | 'none';
}
