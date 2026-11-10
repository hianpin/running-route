import { Milestone } from '../types/route';

/**
 * Standard 5-digit precision Google Encoded Polyline decoder
 * Decodes into array of [latitude, longitude] pairs.
 */
export function decodePolyline(encoded: string): [number, number][] {
  if (!encoded || typeof encoded !== 'string') {
    return [];
  }

  const points: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

/**
 * Standard 5-digit precision Google Encoded Polyline encoder
 */
export function encodePolyline(points: [number, number][]): string {
  let output = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const [lat, lng] of points) {
    const late5 = Math.round(lat * 1e5);
    const lnge5 = Math.round(lng * 1e5);

    const dLat = late5 - prevLat;
    const dLng = lnge5 - prevLng;

    prevLat = late5;
    prevLng = lnge5;

    output += encodeSignedNumber(dLat);
    output += encodeSignedNumber(dLng);
  }

  return output;
}

function encodeSignedNumber(num: number): string {
  let sgn_num = num < 0 ? ~(num << 1) : num << 1;
  let encodeString = '';
  while (sgn_num >= 0x20) {
    encodeString += String.fromCharCode((0x20 | (sgn_num & 0x1f)) + 63);
    sgn_num >>= 5;
  }
  encodeString += String.fromCharCode(sgn_num + 63);
  return encodeString;
}

/**
 * Calculate Haversine distance in meters between two [lat, lng] coordinates
 */
export function calculateHaversineDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;

  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate total distance of polyline in meters
 */
export function calculateTotalPolylineDistance(points: [number, number][]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += calculateHaversineDistance(points[i], points[i + 1]);
  }
  return total;
}

/**
 * Interpolate 1 km milestone markers along the decoded polyline
 */
export function calculateMilestones(points: [number, number][]): Milestone[] {
  if (points.length < 2) return [];

  const milestones: Milestone[] = [];
  let accumulatedDist = 0;
  let targetKm = 1;
  let targetMeters = 1000;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const segmentDist = calculateHaversineDistance(p1, p2);

    if (segmentDist === 0) continue;

    while (accumulatedDist + segmentDist >= targetMeters) {
      const remainingNeeded = targetMeters - accumulatedDist;
      const fraction = Math.max(0, Math.min(1, remainingNeeded / segmentDist));

      const interpLat = p1[0] + fraction * (p2[0] - p1[0]);
      const interpLng = p1[1] + fraction * (p2[1] - p1[1]);

      milestones.push({
        km: targetKm,
        coord: [Number(interpLat.toFixed(6)), Number(interpLng.toFixed(6))],
      });

      targetKm += 1;
      targetMeters += 1000;
    }

    accumulatedDist += segmentDist;
  }

  return milestones;
}

/**
 * Check if coordinate is approximately within Singapore national boundaries
 * SG bounding box roughly: Lat 1.15 to 1.48, Lng 103.60 to 104.05
 */
export function isWithinSingapore(lat: number, lng: number): boolean {
  return lat >= 1.15 && lat <= 1.48 && lng >= 103.60 && lng <= 104.08;
}

/**
 * Format pace seconds (e.g. 330s -> "5:30")
 */
export function formatPace(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parse pace string "5:30" into total seconds per km (330)
 */
export function parsePace(paceStr: string): number {
  const parts = paceStr.split(':');
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10) || 5;
    const s = parseInt(parts[1], 10) || 30;
    return m * 60 + s;
  }
  const val = parseFloat(paceStr);
  return !isNaN(val) ? val * 60 : 330;
}

/**
 * Calculate estimated duration given distance in km and pace in seconds/km
 */
export function calculateRunDuration(distanceKm: number, paceSecondsPerKm: number): {
  totalSeconds: number;
  formatted: string;
} {
  const totalSeconds = Math.round(distanceKm * paceSecondsPerKm);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return {
      totalSeconds,
      formatted: `${hours}h ${minutes}m ${seconds > 0 ? `${seconds}s` : ''}`.trim(),
    };
  }
  return {
    totalSeconds,
    formatted: `${minutes}m ${seconds.toString().padStart(2, '0')}s`,
  };
}

/**
 * Calculate calories burned using standard runner energetics
 * Calories ≈ weightKg * distanceKm * 1.036
 */
export function calculateCaloriesBurned(distanceKm: number, weightKg: number = 68): number {
  return Math.round(distanceKm * weightKg * 1.036);
}

/**
 * Generate standard GPX XML 1.1 file content from route coordinates
 */
export function generateGPXString(
  points: [number, number][],
  routeName: string = 'SG RunRoute Track',
  distanceKm: number = 0
): string {
  const now = new Date().toISOString();
  const pointsXml = points
    .map(
      ([lat, lng]) =>
        `      <trkpt lat="${lat.toFixed(6)}" lon="${lng.toFixed(6)}">
        <ele>6.0</ele>
        <time>${now}</time>
      </trkpt>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="SG RunRoute - SLA OneMap Running Navigator" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(routeName)}</name>
    <desc>Singapore running route (${distanceKm.toFixed(2)} km) generated with SG RunRoute and Singapore Land Authority OneMap.</desc>
    <time>${now}</time>
    <keywords>running, Singapore, OneMap, PCN, workout, strava, garmin</keywords>
  </metadata>
  <trk>
    <name>${escapeXml(routeName)}</name>
    <type>running</type>
    <trkseg>
${pointsXml}
    </trkseg>
  </trk>
</gpx>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

/**
 * Trigger download of GPX file in the browser
 */
export function downloadGPXFile(
  points: [number, number][],
  routeName: string,
  distanceKm: number
): void {
  const gpxContent = generateGPXString(points, routeName, distanceKm);
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const sanitizedName = routeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  link.href = url;
  link.download = `sgrunroute-${sanitizedName || 'route'}.gpx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
