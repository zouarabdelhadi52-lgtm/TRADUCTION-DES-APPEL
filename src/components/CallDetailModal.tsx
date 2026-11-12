import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Download,
  Share2,
  Sparkles,
  Volume2,
  Copy,
  Check,
  RefreshCw,
  FileText,
  Clock,
  Phone,
  Trash2,
  Square,
  RotateCcw,
} from 'lucide-react';
import { CallRecord, CallSummary, AudioSettings, TranscriptTurn } from '../types';
import { getLanguageByCode } from '../data/languages';
import { speakTranslatedText, stopSpeaking } from '../utils/audioTelephony';
import { generateCallSummary } from '../utils/api';

interface CallDetailModalProps {
  call: CallRecord;
  audioSettings: AudioSettings;
  onClose: () => void;
  onDeleteCall: (id: string) => void;
  onUpdateCall: (updated: CallRecord) => void;
}

export const CallDetailModal: React.FC<CallDetailModalProps> = ({
  call,
  audioSettings,
  onClose,
  onDeleteCall,
  onUpdateCall,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isRegeneratingSummary, setIsRegeneratingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary'>('transcript');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingTurnState, setPlayingTurnState] = useState<{
    turnId: string;
    type: 'original' | 'translated';
  } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const simulationIntervalRef = useRef<number | null>(null);

  const userLangObj = getLanguageByCode(call.userLanguage);
  const contactLangObj = getLanguageByCode(call.contactLanguage);

  useEffect(() => {
    return () => {
      stopSpeaking();
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  const handleReplayTurnPhrase = (turn: TranscriptTurn, type: 'original' | 'translated') => {
    if (playingTurnState?.turnId === turn.id && playingTurnState?.type === type) {
      stopSpeaking();
      setPlayingTurnState(null);
      return;
    }

    stopSpeaking();
    setPlayingTurnState({ turnId: turn.id, type });

    const isUser = turn.speaker === 'user';
    let text = '';
    let lang = '';

    if (type === 'original') {
      text = turn.originalText;
      lang = isUser ? userLangObj.bcp47 : contactLangObj.bcp47;
    } else {
      text = turn.translatedText;
      lang = isUser ? contactLangObj.bcp47 : userLangObj.bcp47;
    }

    speakTranslatedText(text, lang, {
      rate: playbackSpeed,
      onEnd: () => setPlayingTurnState(null),
    });
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleTogglePlay = () => {
    if (call.audioUrl && audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current.play().catch(() => {});
        setIsPlayingAudio(true);
      }
      return;
    }

    // If simulated playback (for seeded sample calls with synthetic voices)
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    } else {
      setIsPlayingAudio(true);
      // Play through turns sequentially with speech synthesis
      let currentTurnIdx = 0;
      const playNextTurn = () => {
        if (currentTurnIdx >= call.transcript.length) {
          setIsPlayingAudio(false);
          setPlaybackTime(0);
          return;
        }

        const turn = call.transcript[currentTurnIdx];
        setPlaybackTime(turn.timeSeconds);

        const lang = turn.speaker === 'user' ? userLangObj.bcp47 : contactLangObj.bcp47;
        speakTranslatedText(turn.originalText, lang, {
          rate: playbackSpeed,
          onEnd: () => {
            currentTurnIdx++;
            playNextTurn();
          },
        });
      };

      playNextTurn();
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleRegenerateSummary = async () => {
    if (isRegeneratingSummary || call.transcript.length === 0) return;
    setIsRegeneratingSummary(true);

    try {
      const summary = await generateCallSummary(
        call.transcript,
        call.contactName,
        call.durationFormatted,
        `${userLangObj.name} ⇄ ${contactLangObj.name}`
      );

      const updated = { ...call, summary };
      onUpdateCall(updated);
    } catch (err) {
      console.error('Failed to regenerate summary:', err);
      alert('Impossible de régénérer la synthèse pour le moment.');
    } finally {
      setIsRegeneratingSummary(false);
    }
  };

  const handleCopyTranscript = () => {
    const fullText = call.transcript
      .map(
        (t) =>
          `[${t.timestamp}] ${t.speaker === 'user' ? 'Moi' : call.contactName} (${
            t.speaker === 'user' ? userLangObj.name : contactLangObj.name
          }):\n  Original: ${t.originalText}\n  Traduction: ${t.translatedText}`
      )
      .join('\n\n');

    navigator.clipboard.writeText(fullText);
    setCopiedId('full-transcript');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportTextFile = () => {
    const title = `Transcription-Appel_${call.contactName.replace(/\s+/g, '_')}_${call.date.slice(0, 10)}.txt`;
    const content = `=====================================================
VOXCALL TRANSLATE · ENREGISTREMENT D'APPEL TÉLÉPHONIQUE
=====================================================
Correspondant : ${call.contactName} (${call.contactNumber})
Date & Heure : ${new Date(call.date).toLocaleString('fr-FR')}
Durée : ${call.durationFormatted}
Paire Linguistique : ${userLangObj.name} ⇄ ${contactLangObj.name}
Contexte : ${call.notes || 'N/A'}

${
  call.summary
    ? `SYNTHÈSE EXÉCUTIVE IA :
-----------------------------------------------------
${call.summary.summary}

POINTS CLÉS :
${call.summary.keyPoints.map((p) => `- ${p}`).join('\n')}

ACTIONS À MENER :
${call.summary.actionItems.map((a) => `- [ ] ${a}`).join('\n')}
`
    : ''
}
TRANSCRIPTION BILINGUE SYNCHRONISÉE :
-----------------------------------------------------
${call.transcript
  .map(
    (t) =>
      `[${t.timestamp}] ${t.speaker === 'user' ? 'MOI' : call.contactName.toUpperCase()} :
Original (${t.speaker === 'user' ? userLangObj.name : contactLangObj.name}) : ${t.originalText}
Traduit (${t.speaker === 'user' ? contactLangObj.name : userLangObj.name}) : ${t.translatedText}
`
  )
  .join('\n')}
=====================================================
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = title;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-sm">
              {call.contactAvatar || call.contactName.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{call.contactName}</h2>
                <span className="text-sm">{contactLangObj.flag}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-mono">{call.contactNumber}</span>
                <span>·</span>
                <span>{new Date(call.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                <span>·</span>
                <span className="font-mono tabular-nums">{call.durationFormatted}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportTextFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              title="Exporter la transcription complète"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exporter (.TXT)</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Voulez-vous vraiment supprimer cet enregistrement d\'appel ?')) {
                  onDeleteCall(call.id);
                  onClose();
                }
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-red-950/80 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
              title="Supprimer cet appel"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Call Audio Player Strip */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePlay}
              className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all shadow-md active:scale-95"
              aria-label={isPlayingAudio ? 'Mettre en pause' : 'Écouter l\'enregistrement'}
            >
              {isPlayingAudio ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Enregistrement Audio de l'Appel</span>
                {call.hasAudioRecording && (
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded font-mono">
                    HD
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                {formatTime(playbackTime)} / {call.durationFormatted}
              </div>
            </div>
          </div>

          {/* Speed switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
            {[0.75, 1.0, 1.25, 1.5].map((spd) => (
              <button
                key={spd}
                onClick={() => handleSpeedChange(spd)}
                className={`px-2 py-0.5 rounded text-xs font-mono font-medium transition-colors ${
                  playbackSpeed === spd
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {call.audioUrl && (
            <audio
              ref={audioRef}
              src={call.audioUrl}
              onTimeUpdate={() => {
                if (audioRef.current) setPlaybackTime(audioRef.current.currentTime);
              }}
              onEnded={() => {
                setIsPlayingAudio(false);
                setPlaybackTime(0);
              }}
              className="hidden"
            />
          )}
        </div>

        {/* View Tabs: Transcript vs Summary */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800 bg-slate-900">
          <button
            onClick={() => setActiveTab('transcript')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'transcript'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Transcription Bilingue ({call.transcript.length} répliques)
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'summary'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Synthèse & Décisions IA</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-950">
          {activeTab === 'transcript' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span>Déroulé chronologique de la conversation</span>
                <button
                  onClick={handleCopyTranscript}
                  className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                >
                  {copiedId === 'full-transcript' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier tout</span>
                    </>
                  )}
                </button>
              </div>

              {call.transcript.map((t) => {
                const isUser = t.speaker === 'user';
                const isPlayingVO = playingTurnState?.turnId === t.id && playingTurnState?.type === 'original';
                const isPlayingVF = playingTurnState?.turnId === t.id && playingTurnState?.type === 'translated';

                return (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          {isUser ? `Moi (${userLangObj.name})` : `${call.contactName} (${contactLangObj.name})`}
                        </span>
                        <span>·</span>
                        <span className="font-mono">{t.timestamp}</span>
                        {t.tone && (
                          <span className="text-slate-500 font-medium">({t.tone})</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* VO Replay */}
                        <button
                          onClick={() => handleReplayTurnPhrase(t, 'original')}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                            isPlayingVO
                              ? 'bg-amber-600 text-white animate-pulse'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                          }`}
                          title="Réécouter la voix originale (VO)"
                        >
                          {isPlayingVO ? <Square className="w-3 h-3 fill-current" /> : <Volume2 className="w-3 h-3" />}
                          <span>{isPlayingVO ? 'Stop' : 'VO'}</span>
                        </button>

                        {/* VF Replay */}
                        <button
                          onClick={() => handleReplayTurnPhrase(t, 'translated')}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                            isPlayingVF
                              ? 'bg-emerald-600 text-white animate-pulse'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                          }`}
                          title="Réécouter la traduction"
                        >
                          {isPlayingVF ? <Square className="w-3 h-3 fill-current" /> : <RotateCcw className="w-3 h-3" />}
                          <span>{isPlayingVF ? 'Stop' : 'Traduction'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Original */}
                    <div className="text-sm text-slate-200">{t.originalText}</div>

                    {/* Translation */}
                    <div className="pt-2 border-t border-slate-800/80 text-xs text-blue-300 font-medium flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Traduction ({isUser ? contactLangObj.name : userLangObj.name}) :
                      </span>
                      <span>{t.translatedText}</span>
                      {t.phonetic && (
                        <span className="text-[11px] text-amber-300/80 font-mono italic">
                          Phonétique : {t.phonetic}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* AI Summary View */
            <div className="space-y-6">
              {call.summary ? (
                <>
                  {/* Executive Summary */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span>Synthèse de l'Appel</span>
                      </h3>
                      {call.summary.sentiment && (
                        <div className="text-xs text-emerald-400 font-semibold bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-0.5 rounded-md">
                          Climat : {call.summary.sentiment}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {call.summary.summary}
                    </p>
                  </div>

                  {/* Key Points */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-3">
                      Points Clés & Décisions
                    </h3>
                    <ul className="space-y-2">
                      {call.summary.keyPoints.map((pt, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Items */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-3">
                      Actions à Mener Suite à l'Appel
                    </h3>
                    <ul className="space-y-2">
                      {call.summary.actionItems.map((act, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Keywords */}
                  {call.summary.keywords && call.summary.keywords.length > 0 && (
                    <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-300">Thématiques :</span>
                      {call.summary.keywords.map((kw, i) => (
                        <span key={kw}>
                          {kw}
                          {i < call.summary!.keywords!.length - 1 && ' · '}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleRegenerateSummary}
                      disabled={isRegeneratingSummary}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingSummary ? 'animate-spin' : ''}`} />
                      <span>Actualiser la synthèse</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-400 mb-4">
                    Aucune synthèse n'a encore été générée pour cet appel.
                  </p>
                  <button
                    onClick={handleRegenerateSummary}
                    disabled={isRegeneratingSummary}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Générer la Synthèse avec Gemini</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
