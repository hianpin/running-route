import React, { useState } from 'react';
import { Timer, Zap, Scale, ChevronsRight } from 'lucide-react';
import {
  formatPace,
  calculateRunDuration,
  calculateCaloriesBurned,
} from '../utils/polyline';

interface PaceCalculatorProps {
  distanceKm: number;
  paceSeconds: number;
  onPaceChange: (newPaceSeconds: number) => void;
  runnerWeightKg: number;
  onWeightChange: (weight: number) => void;
}

const COMMON_PACES = [
  { label: '4:30', seconds: 270, name: 'Tempo' },
  { label: '5:00', seconds: 300, name: 'Brisk' },
  { label: '5:30', seconds: 330, name: 'Standard' },
  { label: '6:00', seconds: 360, name: 'Endurance' },
  { label: '6:30', seconds: 390, name: 'Easy Jog' },
  { label: '7:00', seconds: 420, name: 'Recovery' },
];

export const PaceCalculator: React.FC<PaceCalculatorProps> = ({
  distanceKm,
  paceSeconds,
  onPaceChange,
  runnerWeightKg,
  onWeightChange,
}) => {
  const [showWeightInput, setShowWeightInput] = useState(false);

  const duration = calculateRunDuration(distanceKm, paceSeconds);
  const calories = calculateCaloriesBurned(distanceKm, runnerWeightKg);

  // Split table: generate split times for each km
  const totalKmFloor = Math.floor(distanceKm);
  const splits = [];
  for (let k = 1; k <= totalKmFloor; k++) {
    splits.push({
      km: k,
      cumulativeSeconds: k * paceSeconds,
    });
  }
  // Fractional final split if exists
  if (distanceKm > totalKmFloor && distanceKm - totalKmFloor > 0.05) {
    const remainingKm = distanceKm - totalKmFloor;
    splits.push({
      km: Number(distanceKm.toFixed(2)),
      cumulativeSeconds: Math.round(distanceKm * paceSeconds),
      isPartial: true,
      fractionKm: remainingKm,
    });
  }

  const formatSplitTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Primary KPI strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
            Total Distance
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {distanceKm > 0 ? distanceKm.toFixed(2) : '0.00'}
            <span className="text-xs font-normal text-slate-400 ml-1">km</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Est. Duration</span>
            <Timer className="w-3 h-3 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {distanceKm > 0 ? duration.formatted : '--:--'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Burned</span>
            <Zap className="w-3 h-3 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {distanceKm > 0 ? calories : '0'}
            <span className="text-xs font-normal text-slate-400 ml-1">kcal</span>
          </div>
        </div>
      </div>

      {/* Target Pace Control */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Timer className="w-4 h-4 text-emerald-500" />
            <span>Target Running Pace</span>
          </label>
          <div className="flex items-center gap-1 text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            <span>{formatPace(paceSeconds)}</span>
            <span className="text-xs font-normal text-slate-400">/km</span>
          </div>
        </div>

        {/* Pace Slider (210s = 3:30/km to 540s = 9:00/km) */}
        <div className="space-y-1">
          <input
            type="range"
            min={210}
            max={540}
            step={5}
            value={paceSeconds}
            onChange={(e) => onPaceChange(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>3:30 fast</span>
            <span>5:30 baseline</span>
            <span>9:00 jog/walk</span>
          </div>
        </div>

        {/* Quick Pace Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {COMMON_PACES.map((p) => {
            const isActive = Math.abs(paceSeconds - p.seconds) < 3;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => onPaceChange(p.seconds)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Optional Runner Weight Toggle */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setShowWeightInput(!showWeightInput)}
            className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
          >
            <Scale className="w-3 h-3 text-slate-400" />
            <span>Runner weight ({runnerWeightKg} kg)</span>
          </button>
          {showWeightInput && (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={40}
                max={150}
                value={runnerWeightKg}
                onChange={(e) => onWeightChange(Math.max(30, parseInt(e.target.value, 10) || 68))}
                className="w-14 h-6 text-xs text-center border border-slate-300 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
              />
              <span className="text-[10px] text-slate-400">kg</span>
            </div>
          )}
        </div>
      </div>

      {/* 1km Split Milestones Breakdown */}
      {splits.length > 0 && (
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1">
              <ChevronsRight className="w-3.5 h-3.5 text-emerald-500" />
              <span>Projected 1 km Splits</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Cumulative</span>
          </div>

          <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1">
            {splits.map((s, idx) => (
              <div
                key={idx}
                className="py-1.5 flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-300"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-bold text-[10px] flex items-center justify-center">
                    {s.isPartial ? 'FIN' : s.km}
                  </span>
                  <span>{s.isPartial ? `${s.km} km (Finish)` : `Split ${s.km} km`}</span>
                </div>
                <div className="tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                  {formatSplitTime(s.cumulativeSeconds)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
