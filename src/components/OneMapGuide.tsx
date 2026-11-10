import React from 'react';
import { BookOpen, KeyRound, Map, ShieldAlert, Sparkles, Footprints, Bike } from 'lucide-react';

interface OneMapGuideProps {
  onOpenSettings: () => void;
  onSelectTab: (tab: 'route' | 'presets' | 'pace') => void;
}

export const OneMapGuide: React.FC<OneMapGuideProps> = ({ onOpenSettings, onSelectTab }) => {
  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-200">
      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Singapore Land Authority (SLA) OneMap Integration</span>
        </div>
        <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80 mt-1.5 leading-relaxed">
          SG RunRoute is built specifically for runners in Singapore. It leverages the authoritative
          national geospatial platform, SLA OneMap, to calculate precise pedestrian and PCN
          (Park Connector Network) running paths with exact distance and elevation telemetry.
        </p>
      </div>

      {/* Routing Modes */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Map className="w-3.5 h-3.5 text-sky-500" />
          <span>SLA Routing Modes Explained</span>
        </h4>

        <div className="space-y-2 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 flex items-start gap-2.5">
            <Footprints className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                walk (Footpaths & Streets)
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Calculates the shortest walkable pedestrian route utilizing zebra crossings, overhead bridges, and sheltered walkways across Singapore.
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 flex items-start gap-2.5">
            <Bike className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                cycle (PCN & Cycling Paths)
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Favors dedicated Park Connector Networks, coastal tarmac paths (e.g. East Coast Park, Kallang, Marina Bay), and off-road shared running paths with minimal road crossings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Getting SLA API Key */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5 text-amber-500" />
          <span>Setting Up Your OneMap Credentials</span>
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          SLA provides free access to developers and runners. You can register for a free account at{' '}
          <a
            href="https://www.onemap.gov.sg/apidocs/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 dark:text-emerald-400 underline font-medium"
          >
            onemap.gov.sg/apidocs
          </a>{' '}
          and either paste your JWT token or enter your email/password in the API Settings modal.
        </p>

        <button
          type="button"
          onClick={onOpenSettings}
          className="mt-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Open API Settings</span>
        </button>
      </div>

      {/* Singapore Tropical Running Tips */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          <span>Singapore Running Tips</span>
        </h4>
        <ul className="space-y-1.5 text-slate-600 dark:text-slate-400 list-disc list-inside">
          <li>
            <strong className="text-slate-700 dark:text-slate-200">Night Tiles:</strong> Toggle Night Mode in the top bar for dark aesthetic mapping and night running along illuminated PCNs.
          </li>
          <li>
            <strong className="text-slate-700 dark:text-slate-200">Hydration Points:</strong> All major PCN nodes (Parkland Green, Marina Barrage, Bishan Park) have potable water dispensers.
          </li>
          <li>
            <strong className="text-slate-700 dark:text-slate-200">Export GPX:</strong> Transfer routes directly to Garmin Connect, Apple Watch Workout, or Strava before heading out.
          </li>
        </ul>
      </div>
    </div>
  );
};
