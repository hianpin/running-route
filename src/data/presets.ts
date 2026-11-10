import { PresetRoute } from '../types/route';
import { encodePolyline } from '../utils/polyline';

// Curated Singapore running landmarks for instant autocomplete fallback & quick suggestions
export const SG_RUNNER_LANDMARKS = [
  {
    SEARCHVAL: 'MARINA BAY SANDS EVENT PLAZA',
    BUILDING: 'Marina Bay Sands',
    ADDRESS: '10 Bayfront Avenue, Singapore 018956',
    POSTAL: '018956',
    LATITUDE: '1.283400',
    LONGITUDE: '103.858500',
  },
  {
    SEARCHVAL: 'MERLION PARK',
    BUILDING: 'One Fullerton Merlion Park',
    ADDRESS: '1 Fullerton Rd, Singapore 049213',
    POSTAL: '049213',
    LATITUDE: '1.286800',
    LONGITUDE: '103.854500',
  },
  {
    SEARCHVAL: 'GARDENS BY THE BAY EAST',
    BUILDING: 'Gardens by the Bay (Bay East Garden)',
    ADDRESS: '11 Rhu Cross, Singapore 437440',
    POSTAL: '437440',
    LATITUDE: '1.291500',
    LONGITUDE: '103.864300',
  },
  {
    SEARCHVAL: 'EAST COAST PARK PARKLAND GREEN',
    BUILDING: 'Parkland Green @ ECP',
    ADDRESS: '920 East Coast Parkway, Singapore 449875',
    POSTAL: '449875',
    LATITUDE: '1.300600',
    LONGITUDE: '103.908500',
  },
  {
    SEARCHVAL: 'BEDOK JETTY (EAST COAST PARK)',
    BUILDING: 'Bedok Jetty',
    ADDRESS: 'East Coast Park Service Rd, Singapore',
    POSTAL: '449876',
    LATITUDE: '1.302300',
    LONGITUDE: '103.926800',
  },
  {
    SEARCHVAL: 'MACRITCHIE RESERVOIR AMENITIES CENTRE',
    BUILDING: 'MacRitchie Reservoir Park',
    ADDRESS: 'MacRitchie Reservoir, Singapore 298717',
    POSTAL: '298717',
    LATITUDE: '1.341800',
    LONGITUDE: '103.834500',
  },
  {
    SEARCHVAL: 'BUKIT TIMAH NATURE RESERVE VISITOR CENTRE',
    BUILDING: 'Bukit Timah Nature Reserve',
    ADDRESS: '177 Hindhede Dr, Singapore 589333',
    POSTAL: '589333',
    LATITUDE: '1.354700',
    LONGITUDE: '103.776400',
  },
  {
    SEARCHVAL: 'SINGAPORE BOTANIC GARDENS (TANGELIN GATE)',
    BUILDING: 'Singapore Botanic Gardens',
    ADDRESS: '1 Cluny Rd, Singapore 259569',
    POSTAL: '259569',
    LATITUDE: '1.314200',
    LONGITUDE: '103.816200',
  },
  {
    SEARCHVAL: 'HARBOURFRONT MARANG TRAIL',
    BUILDING: 'Mount Faber Park Entrance',
    ADDRESS: 'Marang Rd / Telok Blangah, Singapore 099277',
    POSTAL: '099277',
    LATITUDE: '1.265300',
    LONGITUDE: '103.820700',
  },
  {
    SEARCHVAL: 'KENT RIDGE PARK CANOPY WALK',
    BUILDING: 'Kent Ridge Park',
    ADDRESS: 'Vigilante Dr, Singapore 118176',
    POSTAL: '118176',
    LATITUDE: '1.282800',
    LONGITUDE: '103.791500',
  },
  {
    SEARCHVAL: 'SINGAPORE SPORTS HUB (NATIONAL STADIUM)',
    BUILDING: 'Singapore National Stadium',
    ADDRESS: '1 Stadium Dr, Singapore 397629',
    POSTAL: '397629',
    LATITUDE: '1.303200',
    LONGITUDE: '103.874800',
  },
  {
    SEARCHVAL: 'BISHAN-ANG MO KIO PARK (RIVER PLAINS)',
    BUILDING: 'Bishan-Ang Mo Kio Park',
    ADDRESS: '1384 Ang Mo Kio Ave 1, Singapore 569932',
    POSTAL: '569932',
    LATITUDE: '1.361800',
    LONGITUDE: '103.846500',
  },
  {
    SEARCHVAL: 'PUNGGOL WATERWAY PARK',
    BUILDING: 'Punggol Waterway Park Centre',
    ADDRESS: 'Sentul Crescent, Singapore 821313',
    POSTAL: '821313',
    LATITUDE: '1.405500',
    LONGITUDE: '103.902200',
  },
  {
    SEARCHVAL: 'CHANGI JURASSIC MILE',
    BUILDING: 'Changi Airport Connector',
    ADDRESS: 'Airport Boulevard, Singapore 819663',
    POSTAL: '819663',
    LATITUDE: '1.348600',
    LONGITUDE: '103.988200',
  },
];

// High fidelity preset coordinates for smooth preview
const MARINA_BAY_COORDS: [number, number][] = [
  [1.2834, 103.8585],
  [1.2842, 103.8592],
  [1.2858, 103.8604],
  [1.2871, 103.8611], // Helix Bridge approach
  [1.2882, 103.8605], // Helix Bridge
  [1.2895, 103.8592], // Youth Olympic Park
  [1.2899, 103.8576], // Float @ Marina Bay promenade
  [1.2893, 103.8562], // Esplanade Theatres on the Bay
  [1.2882, 103.8550], // Jubilee Bridge
  [1.2868, 103.8545], // Merlion Park
];

const ECP_COORDS: [number, number][] = [
  [1.3006, 103.9085], // Parkland Green
  [1.3009, 103.9125],
  [1.3012, 103.9168], // Marine Cove
  [1.3015, 103.9212], // Amber Beacon
  [1.3018, 103.9245],
  [1.3023, 103.9268], // Bedok Jetty
  [1.3027, 103.9315],
  [1.3032, 103.9372], // Coastal Playgrove
  [1.3038, 103.9430], // Siglap Canal Outflow
];

const MACRITCHIE_COORDS: [number, number][] = [
  [1.3418, 103.8345], // Amenities Centre
  [1.3445, 103.8312], // Lornie Trail
  [1.3482, 103.8265], // Chemperai Boardwalk
  [1.3530, 103.8190], // Golf Course fringe
  [1.3582, 103.8125], // Terentang Trail
  [1.3615, 103.8055], // TreeTop Walk approach
  [1.3590, 103.7950], // Rifle Range connector
  [1.3565, 103.7850], // Hindhede Nature Park
  [1.3547, 103.7764], // Bukit Timah Visitor Centre
];

const SOUTHERN_RIDGES_COORDS: [number, number][] = [
  [1.2653, 103.8207], // Marang Trail
  [1.2715, 103.8180], // Mount Faber Peak
  [1.2758, 103.8145], // Henderson Waves
  [1.2778, 103.8090], // Telok Blangah Hill Forest Walk
  [1.2795, 103.8015], // Alexandra Arch
  [1.2810, 103.7960], // Floral Walk
  [1.2828, 103.7915], // Kent Ridge Canopy Walk
];

const KALLANG_COORDS: [number, number][] = [
  [1.3032, 103.8748], // Stadium Riverside
  [1.3010, 103.8720], // Tanjong Rhu Promenade
  [1.2985, 103.8695], // Geylang River PCN
  [1.2950, 103.8670], // Bay East Garden North
  [1.2915, 103.8643], // Gardens by the Bay East
];

export const PRESET_ROUTES: PresetRoute[] = [
  {
    id: 'marina-bay-loop',
    title: 'Marina Bay Waterfront Loop',
    subtitle: 'MBS to Merlion via Helix & Jubilee Bridge',
    tag: 'Iconic Skyline',
    description: 'Singapore\'s signature waterfront loop offering panoramic skyline vistas of the Central Business District, ArtScience Museum, and Esplanade.',
    startName: 'Marina Bay Sands Event Plaza',
    startCoord: [1.2834, 103.8585],
    endName: 'Merlion Park / Fullerton Bay',
    endCoord: [1.2868, 103.8545],
    routeType: 'walk',
    difficulty: 'Scenic',
    approxDistanceKm: 3.6,
    highlights: ['Helix Bridge', 'Promenade Timber Decks', 'Merlion Vista', 'Waterfront Breeze'],
  },
  {
    id: 'east-coast-park-pcn',
    title: 'East Coast Park PCN Fast Flat',
    subtitle: 'Parkland Green to Bedok Jetty & Beyond',
    tag: 'Coastal PCN',
    description: 'Flat, wide, dedicated coastal track favored by Singapore marathoners for tempo sessions and breezy sunrise long runs.',
    startName: 'ECP Parkland Green',
    startCoord: [1.3006, 103.9085],
    endName: 'Bedok Jetty / Coastal PlayGrove',
    endCoord: [1.3038, 103.9430],
    routeType: 'cycle',
    difficulty: 'Easy',
    approxDistanceKm: 4.8,
    highlights: ['Strait of Singapore View', 'Dedicated Running Lane', 'Shaded Casuarina Trees', 'Water Points'],
  },
  {
    id: 'macritchie-bukit-timah',
    title: 'MacRitchie to Bukit Timah',
    subtitle: 'Central Catchment Nature Trail',
    tag: 'Trail & Green',
    description: 'The holy grail of tropical cross-country running in Singapore. Dirt tracks, gentle rolling terrain, and immersive primary rainforest.',
    startName: 'MacRitchie Reservoir Amenities Centre',
    startCoord: [1.3418, 103.8345],
    endName: 'Bukit Timah Nature Reserve Visitor Centre',
    endCoord: [1.3547, 103.7764],
    routeType: 'walk',
    difficulty: 'Challenging',
    approxDistanceKm: 9.8,
    highlights: ['Lush Rainforest Canopy', 'Wildlife Sightings', 'Rolling Terrain', 'TreeTop Environs'],
  },
  {
    id: 'southern-ridges',
    title: 'Southern Ridges Skyway',
    subtitle: 'Mount Faber to Kent Ridge Canopy',
    tag: 'Elevated & Hills',
    description: 'A breathtaking 10km trail linking Mount Faber, the dramatic Henderson Waves bridge, Telok Blangah Forest Walk, and Kent Ridge Park.',
    startName: 'HarbourFront Marang Trail',
    startCoord: [1.2653, 103.8207],
    endName: 'Kent Ridge Park Canopy Walk',
    endCoord: [1.2828, 103.7915],
    routeType: 'walk',
    difficulty: 'Moderate',
    approxDistanceKm: 5.2,
    highlights: ['Henderson Waves 36m High', 'Forest Walk Canopy', 'Port of Singapore Overlook'],
  },
  {
    id: 'kallang-bay-east',
    title: 'Kallang River to Bay East',
    subtitle: 'Sports Hub to Gardens by the Bay East',
    tag: 'River Promenade',
    description: 'Wide, uninterrupted riverfront PCN connecting the National Stadium at Kallang to the serene Bay East Gardens facing the Marina barrage.',
    startName: 'Singapore Sports Hub',
    startCoord: [1.3032, 103.8748],
    endName: 'Gardens by the Bay East',
    endCoord: [1.2915, 103.8643],
    routeType: 'cycle',
    difficulty: 'Easy',
    approxDistanceKm: 3.2,
    highlights: ['National Stadium Dome', 'Tanjong Rhu Lookout', 'Marina Barrage Horizon'],
  },
];

export const PRESET_GEOMETRY_MAP: Record<string, { geometry: string; points: [number, number][] }> = {
  'marina-bay-loop': {
    geometry: encodePolyline(MARINA_BAY_COORDS),
    points: MARINA_BAY_COORDS,
  },
  'east-coast-park-pcn': {
    geometry: encodePolyline(ECP_COORDS),
    points: ECP_COORDS,
  },
  'macritchie-bukit-timah': {
    geometry: encodePolyline(MACRITCHIE_COORDS),
    points: MACRITCHIE_COORDS,
  },
  'southern-ridges': {
    geometry: encodePolyline(SOUTHERN_RIDGES_COORDS),
    points: SOUTHERN_RIDGES_COORDS,
  },
  'kallang-bay-east': {
    geometry: encodePolyline(KALLANG_COORDS),
    points: KALLANG_COORDS,
  },
};
