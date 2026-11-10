import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Milestone } from '../types/route';
import { formatPace } from '../utils/polyline';
import { Locate, Maximize2, Flag, Navigation as NavIcon } from 'lucide-react';

interface MapCanvasProps {
  nightMode: boolean;
  startCoord: [number, number] | null;
  endCoord: [number, number] | null;
  startName?: string;
  endName?: string;
  routePoints: [number, number][];
  milestones: Milestone[];
  paceSeconds: number;
  pinMode: 'start' | 'end' | 'none';
  setPinMode: (mode: 'start' | 'end' | 'none') => void;
  onMapClickCoord: (coord: [number, number]) => void;
  onMarkerDragEnd: (type: 'start' | 'end', coord: [number, number]) => void;
}

const SG_CENTER: [number, number] = [1.3521, 103.8198];
const SG_BOUNDS = L.latLngBounds([1.15, 103.60], [1.48, 104.08]);

export const MapCanvas: React.FC<MapCanvasProps> = ({
  nightMode,
  startCoord,
  endCoord,
  startName,
  endName,
  routePoints,
  milestones,
  paceSeconds,
  pinMode,
  setPinMode,
  onMapClickCoord,
  onMarkerDragEnd,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const polylineLayerRef = useRef<L.Polyline | null>(null);
  const polylineGlowLayerRef = useRef<L.Polyline | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);
  const milestoneMarkersRef = useRef<L.Marker[]>([]);

  // 1. Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: SG_CENTER,
      zoom: 12,
      minZoom: 11,
      maxZoom: 19,
      maxBounds: SG_BOUNDS,
      maxBoundsViscosity: 0.8,
      zoomControl: false, // We'll position controls cleanly
    });

    // Custom top-right zoom control
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial Tile Layer: SLA OneMap Default or Night
    const tileUrl = nightMode
      ? 'https://www.onemap.gov.sg/maps/tiles/Night/{z}/{x}/{y}.png'
      : 'https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png';

    const tiles = L.tileLayer(tileUrl, {
      minZoom: 11,
      maxZoom: 19,
      detectRetina: true,
      attribution: 'Map data © contributors, Singapore Land Authority',
    }).addTo(map);

    tileLayerRef.current = tiles;
    mapInstanceRef.current = map;

    // Handle map clicks
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onMapClickCoord([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
    });

    // Ensure map tiles redraw smoothly after container layout settles
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. React to Night / Day Tile Layer Toggle
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    const tileUrl = nightMode
      ? 'https://www.onemap.gov.sg/maps/tiles/Night/{z}/{x}/{y}.png'
      : 'https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png';

    tileLayerRef.current.setUrl(tileUrl);
  }, [nightMode]);

  // 3. Update Start Marker (Green Pin)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (startCoord) {
      const startIcon = L.divIcon({
        className: 'endpoint-marker-start',
        html: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      if (!startMarkerRef.current) {
        const marker = L.marker(startCoord, {
          icon: startIcon,
          draggable: true,
          title: 'Start Location',
        }).addTo(map);

        marker.on('dragend', (e) => {
          const latlng = e.target.getLatLng();
          onMarkerDragEnd('start', [Number(latlng.lat.toFixed(6)), Number(latlng.lng.toFixed(6))]);
        });

        startMarkerRef.current = marker;
      } else {
        startMarkerRef.current.setLatLng(startCoord);
      }

      startMarkerRef.current.bindPopup(
        `<div class="font-sans">
          <div class="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Start Point</div>
          <div class="text-xs font-semibold text-white mt-0.5">${startName || 'Starting Location'}</div>
          <div class="text-[10px] text-slate-400 font-mono mt-1">${startCoord[0].toFixed(5)}, ${startCoord[1].toFixed(5)}</div>
          <div class="text-[9px] text-slate-500 mt-1 italic">Drag pin to reposition</div>
        </div>`
      );
    } else if (startMarkerRef.current) {
      map.removeLayer(startMarkerRef.current);
      startMarkerRef.current = null;
    }
  }, [startCoord, startName, onMarkerDragEnd]);

  // 4. Update End Marker (Rose Pin)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (endCoord) {
      const endIcon = L.divIcon({
        className: 'endpoint-marker-end',
        html: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      if (!endMarkerRef.current) {
        const marker = L.marker(endCoord, {
          icon: endIcon,
          draggable: true,
          title: 'Finish Location',
        }).addTo(map);

        marker.on('dragend', (e) => {
          const latlng = e.target.getLatLng();
          onMarkerDragEnd('end', [Number(latlng.lat.toFixed(6)), Number(latlng.lng.toFixed(6))]);
        });

        endMarkerRef.current = marker;
      } else {
        endMarkerRef.current.setLatLng(endCoord);
      }

      endMarkerRef.current.bindPopup(
        `<div class="font-sans">
          <div class="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Finish Point</div>
          <div class="text-xs font-semibold text-white mt-0.5">${endName || 'Destination'}</div>
          <div class="text-[10px] text-slate-400 font-mono mt-1">${endCoord[0].toFixed(5)}, ${endCoord[1].toFixed(5)}</div>
          <div class="text-[9px] text-slate-500 mt-1 italic">Drag pin to reposition</div>
        </div>`
      );
    } else if (endMarkerRef.current) {
      map.removeLayer(endMarkerRef.current);
      endMarkerRef.current = null;
    }
  }, [endCoord, endName, onMarkerDragEnd]);

  // 5. Update Polyline and Auto-Fit Bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old polyline
    if (polylineGlowLayerRef.current) {
      map.removeLayer(polylineGlowLayerRef.current);
      polylineGlowLayerRef.current = null;
    }
    if (polylineLayerRef.current) {
      map.removeLayer(polylineLayerRef.current);
      polylineLayerRef.current = null;
    }

    if (routePoints.length >= 2) {
      // Background glow for outstanding contrast on both dark & light basemaps
      const glowLine = L.polyline(routePoints, {
        color: '#064e3b',
        weight: 8,
        opacity: 0.6,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Vibrant runner track
      const mainLine = L.polyline(routePoints, {
        color: '#10b981',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      polylineGlowLayerRef.current = glowLine;
      polylineLayerRef.current = mainLine;

      // Auto-fit bounds with padding
      const bounds = mainLine.getBounds();
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    }
  }, [routePoints]);

  // 6. Update 1 km Milestone Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old milestones
    milestoneMarkersRef.current.forEach((m) => map.removeLayer(m));
    milestoneMarkersRef.current = [];

    milestones.forEach((m) => {
      const splitTimeSecs = m.km * paceSeconds;
      const splitMins = Math.floor(splitTimeSecs / 60);
      const splitRemSecs = splitTimeSecs % 60;
      const formattedSplit = `${splitMins}:${splitRemSecs.toString().padStart(2, '0')}`;

      const milestoneIcon = L.divIcon({
        className: 'milestone-marker',
        html: `<span>${m.km}</span>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker(m.coord, {
        icon: milestoneIcon,
        title: `${m.km} km Milestone`,
      }).addTo(map);

      marker.bindPopup(
        `<div class="font-sans text-center">
          <div class="text-[10px] text-sky-400 font-bold uppercase tracking-wider">Milestone Split</div>
          <div class="text-base font-bold text-white font-mono mt-0.5">${m.km} km</div>
          <div class="text-xs text-emerald-400 font-mono mt-1 font-semibold">Est. ${formattedSplit}</div>
          <div class="text-[9px] text-slate-400 mt-0.5">at ${formatPace(paceSeconds)} /km pace</div>
        </div>`
      );

      milestoneMarkersRef.current.push(marker);
    });
  }, [milestones, paceSeconds]);

  // Map Controls Helpers
  const handleRecenterSingapore = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(SG_CENTER, 12, { animate: true });
    }
  };

  const handleFitRoute = () => {
    if (mapInstanceRef.current && polylineLayerRef.current) {
      mapInstanceRef.current.fitBounds(polylineLayerRef.current.getBounds(), {
        padding: [60, 60],
        maxZoom: 16,
      });
    } else if (mapInstanceRef.current && (startCoord || endCoord)) {
      const coords: [number, number][] = [];
      if (startCoord) coords.push(startCoord);
      if (endCoord) coords.push(endCoord);
      mapInstanceRef.current.fitBounds(L.latLngBounds(coords), { padding: [100, 100] });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[350px] overflow-hidden bg-slate-950">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Map Control Bar (Top Left) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        {/* Active Pin Placement Mode Indicator */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/80 shadow-lg text-xs">
          <button
            type="button"
            onClick={() => setPinMode(pinMode === 'start' ? 'none' : 'start')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all cursor-pointer ${
              pinMode === 'start'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Click to activate: Next map click will set Start Pin"
          >
            <NavIcon className="w-3.5 h-3.5" />
            <span>Set Start Pin</span>
          </button>

          <button
            type="button"
            onClick={() => setPinMode(pinMode === 'end' ? 'none' : 'end')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all cursor-pointer ${
              pinMode === 'end'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Click to activate: Next map click will set Finish Pin"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Set End Pin</span>
          </button>
        </div>

        {/* Pin placement active banner */}
        {pinMode !== 'none' && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs shadow-md animate-pulse">
            Click anywhere on the map to place {pinMode === 'start' ? 'Start' : 'Finish'} Pin
          </div>
        )}
      </div>

      {/* Bottom Floating Map Actions */}
      <div className="absolute bottom-6 right-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={handleRecenterSingapore}
          className="h-9 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer"
          title="Recenter Singapore map"
        >
          <Locate className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Recenter SG</span>
        </button>

        {routePoints.length > 0 && (
          <button
            type="button"
            onClick={handleFitRoute}
            className="h-9 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer"
            title="Fit Route Bounds"
          >
            <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Fit Route</span>
          </button>
        )}
      </div>
    </div>
  );
};
