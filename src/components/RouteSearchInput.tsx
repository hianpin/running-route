import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2, Compass } from 'lucide-react';
import { searchAddress } from '../services/onemapService';
import { OneMapSearchResultItem } from '../types/route';

interface RouteSearchInputProps {
  label: string;
  placeholder: string;
  pointType: 'start' | 'end';
  coord: [number, number] | null;
  name: string;
  onSelectLocation: (coord: [number, number], name: string) => void;
  onClear: () => void;
  onUseGps?: () => void;
  isGpsLoading?: boolean;
  userToken?: string;
}

export const RouteSearchInput: React.FC<RouteSearchInputProps> = ({
  label,
  placeholder,
  pointType,
  coord,
  name,
  onSelectLocation,
  onClear,
  onUseGps,
  isGpsLoading,
  userToken,
}) => {
  const [query, setQuery] = useState(name);
  const [results, setResults] = useState<OneMapSearchResultItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external name changes (e.g. from preset or map click)
  useEffect(() => {
    setQuery(name);
  }, [name]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search (300ms)
  useEffect(() => {
    if (!query || query.length < 2 || query === name) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchAddress(query, userToken);
        setResults(data);
        setIsOpen(data.length > 0);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, name, userToken]);

  const handleSelect = (item: OneMapSearchResultItem) => {
    const lat = parseFloat(item.LATITUDE);
    const lng = parseFloat(item.LONGITUDE);
    if (!isNaN(lat) && !isNaN(lng)) {
      const displayName = item.BUILDING || item.SEARCHVAL || item.ADDRESS;
      setQuery(displayName);
      setIsOpen(false);
      onSelectLocation([lat, lng], displayName);
    }
  };

  const isStart = pointType === 'start';

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center justify-between mb-1 text-xs">
        <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isStart ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
          <span>{label}</span>
        </label>
        {isStart && onUseGps && (
          <button
            type="button"
            onClick={onUseGps}
            disabled={isGpsLoading}
            className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            {isGpsLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Compass className="w-3 h-3" />
            )}
            <span>Current GPS</span>
          </button>
        )}
      </div>

      <div className="relative flex items-center">
        <div className="absolute left-3 pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full h-10 pl-9 pr-9 text-xs rounded-xl border bg-white dark:bg-slate-900 transition-all outline-none focus:ring-2 ${
            isStart
              ? 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20 text-slate-900 dark:text-slate-100'
              : 'border-slate-200 dark:border-slate-700 focus:border-rose-500 focus:ring-rose-500/20 text-slate-900 dark:text-slate-100'
          }`}
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                onClear();
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {coord && (
        <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1">
          <MapPin className="w-3 h-3 text-slate-400" />
          <span>
            {coord[0].toFixed(5)}, {coord[1].toFixed(5)}
          </span>
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-50 py-1 divide-y divide-slate-100 dark:divide-slate-800">
          {results.map((item, idx) => (
            <button
              key={`${item.SEARCHVAL}-${idx}`}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 group cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {item.BUILDING || item.SEARCHVAL}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {item.ADDRESS}
                </div>
                {item.POSTAL && (
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                    Postal: {item.POSTAL}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
