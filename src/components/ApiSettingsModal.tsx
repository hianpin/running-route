import React, { useState } from 'react';
import {
  X,
  KeyRound,
  ShieldCheck,
  ExternalLink,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { TokenStatus } from '../types/route';
import {
  saveToken,
  clearStoredToken,
  fetchTokenWithCredentials,
} from '../services/onemapService';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenStatus: TokenStatus;
  onTokenUpdated: () => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
  tokenStatus,
  onTokenUpdated,
}) => {
  const [tab, setTab] = useState<'paste' | 'credentials'>('paste');
  const [pastedToken, setPastedToken] = useState(tokenStatus.token || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  if (!isOpen) return null;

  const handleSavePasted = () => {
    const trimmed = pastedToken.trim();
    if (!trimmed) {
      setStatusMsg({ type: 'error', text: 'Please paste a valid JWT access token.' });
      return;
    }
    saveToken(trimmed);
    setStatusMsg({ type: 'success', text: 'Token successfully saved to local storage!' });
    onTokenUpdated();
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleFetchToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setStatusMsg({ type: 'error', text: 'Email and password are both required.' });
      return;
    }

    setIsLoading(true);
    setStatusMsg(null);

    try {
      const data = await fetchTokenWithCredentials(email, password);
      setStatusMsg({
        type: 'success',
        text: `New 72-hour token issued and saved! (Expires: ${new Date(
          data.expiry_timestamp * 1000
        ).toLocaleString()})`,
      });
      setPastedToken(data.access_token);
      onTokenUpdated();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to authenticate with OneMap. Please verify your credentials.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    clearStoredToken();
    setPastedToken('');
    setStatusMsg({ type: 'success', text: 'Token removed. Running in Demo / Fallback mode.' });
    onTokenUpdated();
  };

  // Format expiry timestamp
  let expiryDisplay = 'No active token';
  if (tokenStatus.expiryTimestamp) {
    const expiryDate = new Date(tokenStatus.expiryTimestamp * 1000);
    const now = new Date();
    const diffHours = Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 3600));
    if (diffHours > 0) {
      expiryDisplay = `Valid for ~${diffHours} more hours (${expiryDate.toLocaleDateString()})`;
    } else {
      expiryDisplay = 'Expired (Please refresh)';
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                SLA OneMap API Settings
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Configure Singapore Land Authority authentication
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Status Banner */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3 text-xs">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                {tokenStatus.isValid ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>SLA OneMap API Active</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span>Demo Mode (Preset Coordinates & Local Simulation)</span>
                  </>
                )}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {tokenStatus.token ? expiryDisplay : 'Basemap tiles work freely without credentials.'}
              </div>
            </div>

            {tokenStatus.token && (
              <button
                onClick={handleClear}
                className="px-2.5 py-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg border border-rose-200 dark:border-rose-900/60 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`mx-4 mt-3 p-3 rounded-xl text-xs flex items-start gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 leading-relaxed">{statusMsg.text}</div>
          </div>
        )}

        {/* Mode Switch Tabs */}
        <div className="p-4 pb-2">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium">
            <button
              onClick={() => setTab('paste')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                tab === 'paste'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Option 1: Paste JWT Token
            </button>
            <button
              onClick={() => setTab('credentials')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                tab === 'credentials'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Option 2: Login & Auto-Fetch
            </button>
          </div>
        </div>

        {/* Tab 1: Paste Token */}
        {tab === 'paste' && (
          <div className="p-4 pt-1 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                JWT Access Token
              </label>
              <textarea
                rows={3}
                value={pastedToken}
                onChange={(e) => setPastedToken(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full mt-1.5 p-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={handleSavePasted}
              className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Save Access Token</span>
            </button>
          </div>
        )}

        {/* Tab 2: Login & Auto-Fetch */}
        {tab === 'credentials' && (
          <form onSubmit={handleFetchToken} className="p-4 pt-1 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                OneMap Registered Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="runner@example.sg"
                className="w-full mt-1.5 h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                OneMap Account Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full mt-1.5 h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Requesting Token from SLA...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Request 72-Hour Token</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Info */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Need a free OneMap developer account?</span>
          <a
            href="https://www.onemap.gov.sg/apidocs/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
          >
            <span>OneMap Docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
