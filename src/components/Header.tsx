import React from 'react';
import { KeyRound, Moon, Sun, Navigation } from 'lucide-react';
import { TokenStatus } from '../types/route';

interface HeaderProps {
  nightMode: boolean;
  onToggleNightMode: () => void;
  tokenStatus: TokenStatus;
  onOpenSettings: () => void;
  activeTab: 'route' | 'presets' | 'pace' | 'guide';
  setActiveTab: (tab: 'route' | 'presets' | 'pace' | 'guide') => void;
}

export const Header: React.FC<HeaderProps> = ({
  nightMode,
  onToggleNightMode,
  tokenStatus,
  onOpenSettings,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-6 z-20">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
          <Navigation className="w-5 h-5 -rotate-45" />
        </div>
        <div>
          <a
            href="/"
            className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>SG RunRoute</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
              SLA OneMap
            </span>
          </a>
        </div>
      </div>

      {/* Zone 2: Navigation Links (Single-line, quiet hover) */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-300">
        <button
          onClick={() => setActiveTab('route')}
          className={`transition-colors whitespace-nowrap pb-0.5 ${
            activeTab === 'route'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-500'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Planner & Route
        </button>
        <button
          onClick={() => setActiveTab('presets')}
          className={`transition-colors whitespace-nowrap pb-0.5 ${
            activeTab === 'presets'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-500'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Singapore Presets
        </button>
        <button
          onClick={() => setActiveTab('pace')}
          className={`transition-colors whitespace-nowrap pb-0.5 ${
            activeTab === 'pace'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-500'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Pace & Splits
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`transition-colors whitespace-nowrap pb-0.5 ${
            activeTab === 'guide'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-500'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          OneMap Guide
        </button>
      </nav>

      {/* Zone 3: Controls & API Settings */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Night Map Tiles Toggle */}
        <button
          onClick={onToggleNightMode}
          className={`h-9 px-3 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
            nightMode
              ? 'bg-slate-800 text-sky-300 border-slate-700 hover:bg-slate-700'
              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
          }`}
          title={nightMode ? 'Switch to Daytime Tiles' : 'Switch to SLA Night Tiles (Ideal for Night Runners)'}
        >
          {nightMode ? (
            <>
              <Moon className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Night Tiles</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Day Tiles</span>
            </>
          )}
        </button>

        {/* API Settings Trigger */}
        <button
          onClick={onOpenSettings}
          className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-600/20 cursor-pointer whitespace-nowrap"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>OneMap API</span>
          <span
            className={`w-2 h-2 rounded-full ${
              tokenStatus.isValid ? 'bg-emerald-300' : 'bg-amber-300'
            }`}
            title={tokenStatus.isValid ? 'Active OneMap Token' : 'Local / Demo Mode'}
          />
        </button>
      </div>
    </header>
  );
};
