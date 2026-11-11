import React from 'react';
import { Phone, Radio, History, Settings, PhoneCall } from 'lucide-react';

interface NavbarProps {
  activeTab: 'call' | 'intercom' | 'history' | 'settings';
  setActiveTab: (tab: 'call' | 'intercom' | 'history' | 'settings') => void;
  isInCall: boolean;
  onOpenDialer: () => void;
  recordingsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isInCall,
  onOpenDialer,
  recordingsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
              VoxCall Translate
            </span>
          </div>
        </div>

        {/* Zone 2: 4 single-line nav links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-sm font-medium">
          <button
            onClick={() => setActiveTab('call')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'call'
                ? 'bg-slate-800 text-blue-400 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Appel Téléphonique</span>
            {isInCall && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('intercom')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'intercom'
                ? 'bg-slate-800 text-blue-400 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Interphone Bilingue</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'history'
                ? 'bg-slate-800 text-blue-400 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historique Enregistré</span>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              ({recordingsCount})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'settings'
                ? 'bg-slate-800 text-blue-400 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Paramètres Voix</span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {isInCall ? (
            <button
              onClick={() => setActiveTab('call')}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-700/60 rounded-lg hover:bg-emerald-900/60 transition-colors whitespace-nowrap shrink-0"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Appel en cours</span>
            </button>
          ) : (
            <button
              onClick={onOpenDialer}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Lancer un Appel</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav subrow */}
      <div className="flex md:hidden items-center justify-around border-t border-slate-800 px-2 py-2 bg-slate-900/95 text-xs">
        <button
          onClick={() => setActiveTab('call')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${
            activeTab === 'call' ? 'text-blue-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>Appel</span>
        </button>
        <button
          onClick={() => setActiveTab('intercom')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${
            activeTab === 'intercom' ? 'text-blue-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Interphone</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${
            activeTab === 'history' ? 'text-blue-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historique ({recordingsCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${
            activeTab === 'settings' ? 'text-blue-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Paramètres</span>
        </button>
      </div>
    </header>
  );
};
