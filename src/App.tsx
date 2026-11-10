/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { MapCanvas } from './components/MapCanvas';
import { RouteSearchInput } from './components/RouteSearchInput';
import { PresetSelector } from './components/PresetSelector';
import { PaceCalculator } from './components/PaceCalculator';
import { TurnByTurnCues } from './components/TurnByTurnCues';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import { OneMapGuide } from './components/OneMapGuide';
import { Toast, ToastMessage } from './components/Toast';
import {
  RouteType,
  TokenStatus,
  RouteInstruction,
  Milestone,
  PresetRoute,
} from './types/route';
import {
  getStoredTokenStatus,
  getRunningRoute,
} from './services/onemapService';
import {
  decodePolyline,
  calculateMilestones,
  isWithinSingapore,
} from './utils/polyline';
import { PRESET_ROUTES } from './data/presets';
import {
  ArrowUpDown,
  Footprints,
  Bike,
  Sparkles,
  Play,
  RotateCcw,
  Sliders,
  ChevronUp,
  ChevronDown,
  Layers,
} from 'lucide-react';

export default function App() {
  // Theme & Night Mode
  const [nightMode, setNightMode] = useState<boolean>(() => {
    return localStorage.getItem('sgrunroute_night') === 'true';
  });

  // Authentication Token Status
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>(() => getStoredTokenStatus());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Active Sidebar Tab
  const [activeTab, setActiveTab] = useState<'route' | 'presets' | 'pace' | 'guide'>('route');

  // Mobile Drawer State
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(true);

  // Route Planning State
  const [startCoord, setStartCoord] = useState<[number, number] | null>(null);
  const [endCoord, setEndCoord] = useState<[number, number] | null>(null);
  const [startName, setStartName] = useState<string>('');
  const [endName, setEndName] = useState<string>('');
  const [routeType, setRouteType] = useState<RouteType>('walk');
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>('marina-bay-loop');

  // Computed Route & Telemetry
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [instructions, setInstructions] = useState<(RouteInstruction | string)[]>([]);
  const [totalDistanceKm, setTotalDistanceKm] = useState<number>(0);

  // Pace & Runner Settings
  const [paceSeconds, setPaceSeconds] = useState<number>(330); // 5:30 /km
  const [runnerWeightKg, setRunnerWeightKg] = useState<number>(68);

  // Map Pin Dropping Mode
  const [pinMode, setPinMode] = useState<'start' | 'end' | 'none'>('none');

  // Loading & Toasts
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Add toast helper
  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync Night Mode with HTML dark class
  useEffect(() => {
    if (nightMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sgrunroute_night', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sgrunroute_night', 'false');
    }
  }, [nightMode]);

  // Load preset route
  const handleSelectPreset = useCallback(
    async (preset: PresetRoute) => {
      setSelectedPresetId(preset.id);
      setStartCoord(preset.startCoord);
      setStartName(preset.startName);
      setEndCoord(preset.endCoord);
      setEndName(preset.endName);
      setRouteType(preset.routeType);
      setActiveTab('route');

      setIsRoutingLoading(true);
      try {
        const routeData = await getRunningRoute(
          preset.startCoord[0],
          preset.startCoord[1],
          preset.endCoord[0],
          preset.endCoord[1],
          preset.routeType,
          tokenStatus.token || undefined
        );

        if (routeData && routeData.route_geometry) {
          const decoded = decodePolyline(routeData.route_geometry);
          setRoutePoints(decoded);

          const distKm = (routeData.route_summary?.total_distance || 0) / 1000;
          setTotalDistanceKm(distKm || preset.approxDistanceKm);

          const computedMilestones = calculateMilestones(decoded);
          setMilestones(computedMilestones);

          setInstructions(routeData.route_instructions || []);
          addToast(`Loaded "${preset.title}" (${distKm.toFixed(2)} km)`, 'success');
        }
      } catch (err: any) {
        addToast(err?.message || 'Failed to generate route', 'error');
      } finally {
        setIsRoutingLoading(false);
      }
    },
    [tokenStatus.token, addToast]
  );

  // Initialize with Marina Bay Loop preset on first load
  useEffect(() => {
    const defaultPreset = PRESET_ROUTES[0];
    if (defaultPreset) {
      handleSelectPreset(defaultPreset);
    }
  }, []);

  // Handle Route Generation Trigger
  const handleGenerateRoute = async (
    customStart?: [number, number],
    customEnd?: [number, number],
    customType?: RouteType
  ) => {
    const s = customStart || startCoord;
    const e = customEnd || endCoord;
    const type = customType || routeType;

    if (!s || !e) {
      addToast('Please specify both Start and End points in Singapore.', 'error');
      return;
    }

    setIsRoutingLoading(true);
    try {
      const data = await getRunningRoute(
        s[0],
        s[1],
        e[0],
        e[1],
        type,
        tokenStatus.token || undefined
      );

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.route_geometry) {
        throw new Error('No geometry received from OneMap routing service.');
      }

      const decoded = decodePolyline(data.route_geometry);
      setRoutePoints(decoded);

      const distKm = (data.route_summary?.total_distance || 0) / 1000;
      setTotalDistanceKm(distKm);

      const computedMilestones = calculateMilestones(decoded);
      setMilestones(computedMilestones);

      setInstructions(data.route_instructions || []);
      addToast(`Route calculated: ${distKm.toFixed(2)} km`, 'success');
    } catch (err: any) {
      addToast(err?.message || 'Routing request failed.', 'error');
    } finally {
      setIsRoutingLoading(false);
    }
  };

  // Swap Start & End Points
  const handleSwapPoints = () => {
    const oldStartCoord = startCoord;
    const oldStartName = startName;

    setStartCoord(endCoord);
    setStartName(endName);
    setEndCoord(oldStartCoord);
    setEndName(oldStartName);

    if (endCoord && oldStartCoord) {
      handleGenerateRoute(endCoord, oldStartCoord);
    }
  };

  // Reset planner
  const handleReset = () => {
    setStartCoord(null);
    setStartName('');
    setEndCoord(null);
    setEndName('');
    setRoutePoints([]);
    setMilestones([]);
    setInstructions([]);
    setTotalDistanceKm(0);
    setSelectedPresetId(undefined);
    addToast('Planner reset. Search or tap map to drop pins.', 'info');
  };

  // GPS Current Location handler
  const handleUseGps = () => {
    if (!navigator.geolocation) {
      addToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGpsLoading(false);
        const { latitude, longitude } = pos.coords;

        if (!isWithinSingapore(latitude, longitude)) {
          addToast(
            `GPS location (${latitude.toFixed(3)}, ${longitude.toFixed(
              3
            )}) is outside Singapore. OneMap covers the Singapore territory.`,
            'error'
          );
          return;
        }

        const coord: [number, number] = [Number(latitude.toFixed(6)), Number(longitude.toFixed(6))];
        const name = `My Current Location (${coord[0].toFixed(4)}, ${coord[1].toFixed(4)})`;
        setStartCoord(coord);
        setStartName(name);
        addToast('Acquired current Singapore GPS coordinates for Start Point.', 'success');

        if (endCoord) {
          handleGenerateRoute(coord, endCoord);
        }
      },
      (err) => {
        setIsGpsLoading(false);
        addToast(`GPS Error: ${err.message}`, 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Map Click Listener for placing pins
  const handleMapClickCoord = (coord: [number, number]) => {
    if (pinMode === 'start') {
      setStartCoord(coord);
      setStartName(`Map Pin (${coord[0].toFixed(4)}, ${coord[1].toFixed(4)})`);
      setPinMode('none');
      addToast('Start Pin set on map.', 'success');
      if (endCoord) {
        handleGenerateRoute(coord, endCoord);
      }
    } else if (pinMode === 'end') {
      setEndCoord(coord);
      setEndName(`Map Pin (${coord[0].toFixed(4)}, ${coord[1].toFixed(4)})`);
      setPinMode('none');
      addToast('Finish Pin set on map.', 'success');
      if (startCoord) {
        handleGenerateRoute(startCoord, coord);
      }
    } else {
      // Natural sequential pin placement
      if (!startCoord) {
        setStartCoord(coord);
        setStartName(`Map Start (${coord[0].toFixed(4)}, ${coord[1].toFixed(4)})`);
        addToast('Start point placed. Click again to set Finish point.', 'info');
      } else if (!endCoord) {
        setEndCoord(coord);
        setEndName(`Map Finish (${coord[0].toFixed(4)}, ${coord[1].toFixed(4)})`);
        handleGenerateRoute(startCoord, coord);
      } else {
        // Both exist, update end
        setEndCoord(coord);
        setEndName(`Map Finish (${coord[0].toFixed(4)}, ${coord[1].toFixed(4)})`);
        handleGenerateRoute(startCoord, coord);
      }
    }
  };

  // Marker Drag End Listener
  const handleMarkerDragEnd = (type: 'start' | 'end', coord: [number, number]) => {
    if (type === 'start') {
      setStartCoord(coord);
      setStartName(`Point (${coord[0].toFixed(4)}, ${coord[1].toFixed(4)})`);
      if (endCoord) {
        handleGenerateRoute(coord, endCoord);
      }
    } else {
      setEndCoord(coord);
      setEndName(`Point (${coord[0].toFixed(4)}, ${coord[1].toFixed(4)})`);
      if (startCoord) {
        handleGenerateRoute(startCoord, coord);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Top Bar adhering to 3-zone contract */}
      <Header
        nightMode={nightMode}
        onToggleNightMode={() => setNightMode(!nightMode)}
        tokenStatus={tokenStatus}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Split-Screen Workspace */}
      <div className="relative flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Control Panel / Mobile Drawer */}
        <aside
          className={`w-full md:w-[420px] lg:w-[460px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col z-20 transition-all duration-200 ${
            isMobileDrawerOpen ? 'max-h-[60vh] md:max-h-full' : 'max-h-12 md:max-h-full'
          }`}
        >
          {/* Mobile Drawer Grab Header */}
          <div className="md:hidden flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Route Controls</span>
              {totalDistanceKm > 0 && (
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {totalDistanceKm.toFixed(2)} km
                </span>
              )}
            </div>
            <button
              onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              {isMobileDrawerOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {/* Sidebar Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Tab: Planner & Route */}
            {activeTab === 'route' && (
              <>
                {/* Search inputs */}
                <div className="space-y-3">
                  <RouteSearchInput
                    label="Start Location (Green Pin)"
                    placeholder="Search building, park, postal code..."
                    pointType="start"
                    coord={startCoord}
                    name={startName}
                    onSelectLocation={(coord, name) => {
                      setStartCoord(coord);
                      setStartName(name);
                      if (endCoord) handleGenerateRoute(coord, endCoord);
                    }}
                    onClear={() => {
                      setStartCoord(null);
                      setStartName('');
                    }}
                    onUseGps={handleUseGps}
                    isGpsLoading={isGpsLoading}
                    userToken={tokenStatus.token || undefined}
                  />

                  {/* Swap Start & End Button */}
                  <div className="flex items-center justify-center -my-1">
                    <button
                      type="button"
                      onClick={handleSwapPoints}
                      disabled={!startCoord && !endCoord}
                      className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-40 cursor-pointer"
                      title="Swap Start and Finish points"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <RouteSearchInput
                    label="Finish Location (Red Pin)"
                    placeholder="Search destination in Singapore..."
                    pointType="end"
                    coord={endCoord}
                    name={endName}
                    onSelectLocation={(coord, name) => {
                      setEndCoord(coord);
                      setEndName(name);
                      if (startCoord) handleGenerateRoute(startCoord, coord);
                    }}
                    onClear={() => {
                      setEndCoord(null);
                      setEndName('');
                    }}
                    userToken={tokenStatus.token || undefined}
                  />
                </div>

                {/* Routing Mode Toggle (walk vs cycle) */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    SLA Routing Network
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setRouteType('walk');
                        if (startCoord && endCoord) handleGenerateRoute(startCoord, endCoord, 'walk');
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        routeType === 'walk'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Footprints className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Footpaths & Walk</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRouteType('cycle');
                        if (startCoord && endCoord) handleGenerateRoute(startCoord, endCoord, 'cycle');
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        routeType === 'cycle'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Bike className="w-3.5 h-3.5 text-sky-500" />
                      <span>PCN & Cycling Paths</span>
                    </button>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleGenerateRoute()}
                    disabled={isRoutingLoading || !startCoord || !endCoord}
                    className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isRoutingLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Calculating OneMap Route...</span>
                      </span>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Generate Route</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Reset start and end points"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Runner Telemetry & Dynamic Pace Calculator */}
                {totalDistanceKm > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <PaceCalculator
                      distanceKm={totalDistanceKm}
                      paceSeconds={paceSeconds}
                      onPaceChange={setPaceSeconds}
                      runnerWeightKg={runnerWeightKg}
                      onWeightChange={setRunnerWeightKg}
                    />

                    {/* Step-by-Step Cue Sheet & GPX Export */}
                    <TurnByTurnCues
                      instructions={instructions}
                      points={routePoints}
                      distanceKm={totalDistanceKm}
                      routeName={
                        startName && endName ? `${startName} to ${endName}` : 'Singapore Run Route'
                      }
                    />
                  </div>
                )}
              </>
            )}

            {/* Tab: Presets */}
            {activeTab === 'presets' && (
              <PresetSelector
                selectedPresetId={selectedPresetId}
                onSelectPreset={handleSelectPreset}
              />
            )}

            {/* Tab: Pace & Splits */}
            {activeTab === 'pace' && (
              <PaceCalculator
                distanceKm={totalDistanceKm > 0 ? totalDistanceKm : 5.0}
                paceSeconds={paceSeconds}
                onPaceChange={setPaceSeconds}
                runnerWeightKg={runnerWeightKg}
                onWeightChange={setRunnerWeightKg}
              />
            )}

            {/* Tab: OneMap Guide */}
            {activeTab === 'guide' && (
              <OneMapGuide
                onOpenSettings={() => setIsSettingsOpen(true)}
                onSelectTab={setActiveTab}
              />
            )}
          </div>
        </aside>

        {/* Right Canvas: Interactive Leaflet SLA OneMap */}
        <main className="flex-1 relative h-full w-full">
          <MapCanvas
            nightMode={nightMode}
            startCoord={startCoord}
            endCoord={endCoord}
            startName={startName}
            endName={endName}
            routePoints={routePoints}
            milestones={milestones}
            paceSeconds={paceSeconds}
            pinMode={pinMode}
            setPinMode={setPinMode}
            onMapClickCoord={handleMapClickCoord}
            onMarkerDragEnd={handleMarkerDragEnd}
          />
        </main>
      </div>

      {/* SLA OneMap API Settings Modal */}
      <ApiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        tokenStatus={tokenStatus}
        onTokenUpdated={() => setTokenStatus(getStoredTokenStatus())}
      />

      {/* Toast Feedback */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
