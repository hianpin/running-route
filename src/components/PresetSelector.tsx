import React from 'react';
import { PRESET_ROUTES } from '../data/presets';
import { PresetRoute } from '../types/route';
import { Flame, ArrowRight, Sparkles } from 'lucide-react';

interface PresetSelectorProps {
  selectedPresetId?: string;
  onSelectPreset: (preset: PresetRoute) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  selectedPresetId,
  onSelectPreset,
}) => {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Curated Singapore Runs</span>
        </h3>
        <span className="text-[11px] text-slate-400">One-tap load</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {PRESET_ROUTES.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`w-full text-left p-3 rounded-xl border transition-all text-xs cursor-pointer group relative overflow-hidden ${
                isSelected
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-500/70 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {preset.title}
                </div>
                <div className="shrink-0 flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  <span>{preset.approxDistanceKm.toFixed(1)} km</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {preset.subtitle}
              </div>

              {/* Clean metadata without pill boxes */}
              <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                <span className="text-slate-700 dark:text-slate-300">{preset.tag}</span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-0.5">
                  <Flame className="w-2.5 h-2.5 text-orange-500" />
                  <span>{preset.difficulty}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span>{preset.routeType === 'cycle' ? 'PCN Tracks' : 'Walk & Footpaths'}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
