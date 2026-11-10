import React, { useState } from 'react';
import { RouteInstruction } from '../types/route';
import {
  Download,
  Copy,
  Check,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  Flag,
  Navigation,
} from 'lucide-react';
import { downloadGPXFile } from '../utils/polyline';

interface TurnByTurnCuesProps {
  instructions: (RouteInstruction | string)[];
  points: [number, number][];
  distanceKm: number;
  routeName: string;
  onHoverStep?: (index: number | null) => void;
}

export const TurnByTurnCues: React.FC<TurnByTurnCuesProps> = ({
  instructions,
  points,
  distanceKm,
  routeName,
}) => {
  const [copied, setCopied] = useState(false);

  const handleExportGPX = () => {
    if (points.length === 0) return;
    downloadGPXFile(points, routeName, distanceKm);
  };

  const handleCopySummary = async () => {
    if (points.length === 0) return;
    const text = `SG RunRoute: ${routeName}\nTotal Distance: ${distanceKm.toFixed(
      2
    )} km\nGenerated via SLA OneMap Running Navigator\nPoints: ${points.length} waypoints`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const getStepIcon = (actionText: string) => {
    const text = actionText.toLowerCase();
    if (text.includes('right')) return <CornerUpRight className="w-3.5 h-3.5 text-sky-500" />;
    if (text.includes('left')) return <CornerUpLeft className="w-3.5 h-3.5 text-amber-500" />;
    if (text.includes('arrive') || text.includes('finish') || text.includes('destination')) {
      return <Flag className="w-3.5 h-3.5 text-rose-500" />;
    }
    if (text.includes('start') || text.includes('head')) {
      return <Navigation className="w-3.5 h-3.5 text-emerald-500" />;
    }
    return <ArrowUp className="w-3.5 h-3.5 text-slate-400" />;
  };

  const normalizedSteps = instructions.map((item) => {
    if (typeof item === 'string') {
      return {
        instruction: item,
        distance: 0,
        action: item,
      };
    }
    return item;
  });

  return (
    <div className="space-y-3">
      {/* Top action bar: Export GPX & Copy */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleExportGPX}
          disabled={points.length === 0}
          className="flex-1 h-9 px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export GPX for Garmin / Watch</span>
        </button>

        <button
          type="button"
          onClick={handleCopySummary}
          disabled={points.length === 0}
          className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Copy route summary"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
        </button>
      </div>

      {/* Step by step instructions */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Step-by-Step Cue Sheet
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {normalizedSteps.length} directions
          </div>
        </div>

        <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {normalizedSteps.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No turn directions available for this route.
            </div>
          ) : (
            normalizedSteps.map((step, idx) => (
              <div
                key={idx}
                className="p-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  {getStepIcon(step.action || step.instruction)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                    {step.instruction}
                  </div>
                  {step.distance > 0 && (
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {step.distance >= 1000
                        ? `${(step.distance / 1000).toFixed(2)} km`
                        : `${Math.round(step.distance)} m`}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
