import React, { useState } from 'react';
import {
  Search,
  PhoneIncoming,
  PhoneOutgoing,
  Play,
  FileText,
  Clock,
  Sparkles,
  Trash2,
  Calendar,
  Volume2,
} from 'lucide-react';
import { CallRecord, AudioSettings } from '../types';
import { getLanguageByCode } from '../data/languages';
import { CallDetailModal } from './CallDetailModal';

interface CallHistoryViewProps {
  calls: CallRecord[];
  audioSettings: AudioSettings;
  onDeleteCall: (id: string) => void;
  onUpdateCall: (updated: CallRecord) => void;
  onStartNewCall: () => void;
}

export const CallHistoryView: React.FC<CallHistoryViewProps> = ({
  calls,
  audioSettings,
  onDeleteCall,
  onUpdateCall,
  onStartNewCall,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [filterLang, setFilterLang] = useState<string>('all');

  const filteredCalls = calls.filter((call) => {
    const matchesSearch =
      call.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.contactNumber.includes(searchTerm) ||
      (call.notes && call.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (call.summary && call.summary.summary.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesLang =
      filterLang === 'all' ||
      call.contactLanguage === filterLang ||
      call.userLanguage === filterLang;

    return matchesSearch && matchesLang;
  });

  const totalMinutes = calls.reduce((acc, c) => acc + c.durationSeconds, 0) / 60;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
            Historique des Conversations Enregistrées
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Retrouvez tous vos enregistrements d'appels, réécoutez l'audio, consultez les
            transcriptions bilingues et les synthèses exécutives.
          </p>
        </div>

        <button
          onClick={onStartNewCall}
          className="self-start sm:self-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
        >
          Nouvel Appel Téléphonique
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium mb-1">Appels Enregistrés</div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              {calls.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-950/60 border border-blue-800/60 text-blue-400 flex items-center justify-center font-bold">
            <Volume2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium mb-1">Durée Cumulée</div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              {Math.round(totalMinutes)} min
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-950/60 border border-purple-800/60 text-purple-400 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium mb-1">Paires de Traduction</div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              {new Set(calls.map((c) => `${c.userLanguage}-${c.contactLanguage}`)).size}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search and Filters Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, numéro, sujet..."
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500 placeholder-slate-500"
          />
        </div>

        {/* Filter by language */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">Filtrer par langue :</span>
          <select
            value={filterLang}
            onChange={(e) => setFilterLang(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Toutes les langues</option>
            <option value="ary">Darija Marocaine (الدارجة المغربية 🇲🇦)</option>
            <option value="ja">Japonais (日本語)</option>
            <option value="en">Anglais (English)</option>
            <option value="it">Italien (Italiano)</option>
            <option value="es">Espagnol (Español)</option>
            <option value="ar">Arabe (العربية)</option>
            <option value="de">Allemand (Deutsch)</option>
          </select>
        </div>
      </div>

      {/* Calls List */}
      {filteredCalls.length === 0 ? (
        <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">
            Aucun enregistrement correspondant
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Passez votre premier appel téléphonique pour créer un enregistrement audio et une transcription bilingue.
          </p>
          <button
            onClick={onStartNewCall}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Démarrer un Appel Téléphonique
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCalls.map((call) => {
            const userLangObj = getLanguageByCode(call.userLanguage);
            const contactLangObj = getLanguageByCode(call.contactLanguage);

            return (
              <div
                key={call.id}
                onClick={() => setSelectedCall(call)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 sm:p-5 transition-all cursor-pointer group shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left zone: Contact & Details */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-blue-400 group-hover:border-blue-500/60 transition-colors shrink-0">
                    {call.contactAvatar || call.contactName.slice(0, 2)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                        {call.contactName}
                      </span>

                      {call.callType === 'outgoing' ? (
                        <PhoneOutgoing className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <PhoneIncoming className="w-3.5 h-3.5 text-emerald-400" />
                      )}

                      <span className="text-xs text-slate-400 font-mono">
                        {call.contactNumber}
                      </span>
                    </div>

                    {/* Metadata line without pills */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                      <span>{new Date(call.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{call.durationFormatted}</span>
                      <span aria-hidden="true">·</span>
                      <span>{userLangObj.flag} {userLangObj.name} ⇄ {contactLangObj.flag} {contactLangObj.name}</span>
                      <span aria-hidden="true">·</span>
                      <span>{call.transcript.length} répliques</span>
                    </div>

                    {/* Summary snippet if present */}
                    {call.summary?.summary && (
                      <p className="text-xs text-slate-300 mt-2 line-clamp-2 max-w-2xl leading-relaxed">
                        {call.summary.summary}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right zone: Play and Details button */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCall(call);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-semibold transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Consulter & Écouter</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Voulez-vous supprimer cet appel enregistré ?')) {
                        onDeleteCall(call.id);
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Call Modal */}
      {selectedCall && (
        <CallDetailModal
          call={selectedCall}
          audioSettings={audioSettings}
          onClose={() => setSelectedCall(null)}
          onDeleteCall={onDeleteCall}
          onUpdateCall={(updated) => {
            onUpdateCall(updated);
            setSelectedCall(updated);
          }}
        />
      )}
    </div>
  );
};
