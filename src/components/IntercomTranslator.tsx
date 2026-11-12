import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Send,
  ArrowRightLeft,
  Sparkles,
  Download,
  Copy,
  Check,
  Disc,
  RotateCcw,
  Square,
  VolumeX,
} from 'lucide-react';
import { TranscriptTurn, CallRecord, AudioSettings } from '../types';
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '../data/languages';
import { speakTranslatedText, stopSpeaking } from '../utils/audioTelephony';
import { translateSpeech, generateCallSummary } from '../utils/api';
import { SpeechRecognitionManager, isSpeechRecognitionSupported } from '../utils/speechRecognition';
import { SpeakerphoneGuide } from './SpeakerphoneGuide';

interface IntercomTranslatorProps {
  userLang: string;
  contactLang: string;
  setUserLang: (lang: string) => void;
  setContactLang: (lang: string) => void;
  audioSettings: AudioSettings;
  onSaveToHistory: (record: CallRecord) => void;
}

export const IntercomTranslator: React.FC<IntercomTranslatorProps> = ({
  userLang,
  contactLang,
  setUserLang,
  setContactLang,
  audioSettings,
  onSaveToHistory,
}) => {
  const [activeSpeaker, setActiveSpeaker] = useState<'user' | 'contact' | null>(null);
  const [autoSwitchTurn, setAutoSwitchTurn] = useState(audioSettings.autoSwitchTurn ?? true);
  const [interimText, setInterimText] = useState('');
  const [inputTextUser, setInputTextUser] = useState('');
  const [inputTextContact, setInputTextContact] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionStartTime] = useState<number>(Date.now());
  const [showSpeakerphoneGuide, setShowSpeakerphoneGuide] = useState(false);

  // Replay playing state
  const [playingState, setPlayingState] = useState<{
    turnId: string;
    type: 'original' | 'translated';
  } | null>(null);

  const userLangObj = getLanguageByCode(userLang);
  const contactLangObj = getLanguageByCode(contactLang);

  const speechManagerRef = useRef<SpeechRecognitionManager | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, interimText]);

  useEffect(() => {
    return () => {
      speechManagerRef.current?.stop();
      stopSpeaking();
    };
  }, []);

  const handleSwapLanguages = () => {
    const temp = userLang;
    setUserLang(contactLang);
    setContactLang(temp);
  };

  const startVoiceInput = (speaker: 'user' | 'contact') => {
    if (!isSpeechRecognitionSupported()) {
      alert('La reconnaissance vocale Web Speech n\'est pas supportée dans votre navigateur actuel.');
      return;
    }

    if (activeSpeaker === speaker) {
      speechManagerRef.current?.stop();
      setActiveSpeaker(null);
      setInterimText('');
      return;
    }

    speechManagerRef.current?.stop();
    setActiveSpeaker(speaker);

    const targetBcp47 = speaker === 'user' ? userLangObj.bcp47 : contactLangObj.bcp47;

    const manager = new SpeechRecognitionManager(
      (interim) => {
        setInterimText(interim);
      },
      (finalText) => {
        setInterimText('');
        handleProcessSpeech(finalText, speaker);
      },
      (err) => {
        console.warn('Speech err:', err);
        setActiveSpeaker(null);
        setInterimText('');
      },
      () => {
        setActiveSpeaker(null);
      }
    );

    speechManagerRef.current = manager;
    manager.start(targetBcp47);
  };

  const handleProcessSpeech = async (text: string, speaker: 'user' | 'contact') => {
    if (!text || !text.trim() || isTranslating) return;

    setIsTranslating(true);
    const source = speaker === 'user' ? userLangObj.name : contactLangObj.name;
    const target = speaker === 'user' ? contactLangObj.name : userLangObj.name;

    const elapsedSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    const timestamp = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    try {
      const result = await translateSpeech(
        text,
        source,
        target,
        speaker,
        transcript.map((t) => ({ speaker: t.speaker, text: t.originalText }))
      );

      const turn: TranscriptTurn = {
        id: `intercom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        speaker,
        originalText: text,
        translatedText: result.translatedText,
        sourceLang: speaker === 'user' ? userLang : contactLang,
        targetLang: speaker === 'user' ? contactLang : userLang,
        timestamp,
        timeSeconds: elapsedSeconds,
        phonetic: result.phonetic,
        tone: result.tone,
        adaptationNote: result.adaptationNote,
      };

      setTranscript((prev) => [...prev, turn]);

      const speakLang = speaker === 'user' ? contactLangObj.bcp47 : userLangObj.bcp47;
      const nextSpeaker = speaker === 'user' ? 'contact' : 'user';

      // Play synthesized audio
      if (audioSettings.autoSpeak) {
        speakTranslatedText(result.translatedText, speakLang, {
          rate: audioSettings.speechRate,
          pitch: audioSettings.speechPitch,
          volume: audioSettings.speechVolume,
          onEnd: () => {
            // Auto-switch turn to interlocutor
            if (autoSwitchTurn) {
              setTimeout(() => {
                startVoiceInput(nextSpeaker);
              }, 400);
            }
          },
        });
      } else if (autoSwitchTurn) {
        setTimeout(() => {
          startVoiceInput(nextSpeaker);
        }, 800);
      }
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSendManual = (speaker: 'user' | 'contact') => {
    const text = speaker === 'user' ? inputTextUser : inputTextContact;
    if (!text.trim()) return;

    if (speaker === 'user') setInputTextUser('');
    else setInputTextContact('');

    handleProcessSpeech(text.trim(), speaker);
  };

  // Replay speech (VO or Translation)
  const handleReplaySpeech = (turn: TranscriptTurn, type: 'original' | 'translated') => {
    if (playingState?.turnId === turn.id && playingState?.type === type) {
      stopSpeaking();
      setPlayingState(null);
      return;
    }

    stopSpeaking();
    setPlayingState({ turnId: turn.id, type });

    let textToSpeak = '';
    let langCode = '';

    if (type === 'original') {
      textToSpeak = turn.originalText;
      langCode = turn.speaker === 'user' ? userLangObj.bcp47 : contactLangObj.bcp47;
    } else {
      textToSpeak = turn.translatedText;
      langCode = turn.speaker === 'user' ? contactLangObj.bcp47 : userLangObj.bcp47;
    }

    speakTranslatedText(textToSpeak, langCode, {
      rate: audioSettings.speechRate,
      pitch: audioSettings.speechPitch,
      volume: audioSettings.speechVolume,
      onEnd: () => setPlayingState(null),
    });
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToHistory = async () => {
    if (transcript.length === 0 || isSaving) return;
    setIsSaving(true);

    const elapsedSeconds = Math.max(1, Math.floor((Date.now() - sessionStartTime) / 1000));
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    const durationFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    let summary = undefined;
    try {
      summary = await generateCallSummary(
        transcript,
        `Session Interphone (${contactLangObj.name})`,
        durationFormatted,
        `${userLangObj.name} ⇄ ${contactLangObj.name}`
      );
    } catch (e) {
      console.warn('Summary fail:', e);
    }

    const record: CallRecord = {
      id: `intercom-session-${Date.now()}`,
      contactName: `Interphone · ${contactLangObj.name}`,
      contactNumber: 'Canal direct',
      contactAvatar: 'IT',
      callType: 'outgoing',
      date: new Date().toISOString(),
      durationSeconds: elapsedSeconds,
      durationFormatted,
      userLanguage: userLang,
      contactLanguage: contactLang,
      transcript,
      summary,
      hasAudioRecording: false,
      status: 'completed',
      notes: 'Session de traduction interphone simultanée.',
    };

    onSaveToHistory(record);
    setIsSaving(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            Mode Interphone & Traduction Alternée
          </h1>
          <p className="text-slate-400 text-xs">
            Traduisez une conversation orale continue à deux personnes en face-à-face ou via le haut-parleur.
          </p>
        </div>

        {/* Language Selection & Guide Button */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setShowSpeakerphoneGuide(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/80 text-xs font-semibold transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Consigne Haut-Parleur</span>
          </button>

          <button
            onClick={() => setAutoSwitchTurn(!autoSwitchTurn)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              autoSwitchTurn
                ? 'bg-blue-950/70 border-blue-700/80 text-blue-200'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
            <span>Bascule auto : {autoSwitchTurn ? 'ON' : 'OFF'}</span>
          </button>

          {/* Language Swap Bar */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
            <div className="flex items-center gap-1.5 px-2">
              <span>{userLangObj.flag}</span>
              <select
                value={userLang}
                onChange={(e) => setUserLang(e.target.value)}
                className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSwapLanguages}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Inverser les langues"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1.5 px-2">
              <span>{contactLangObj.flag}</span>
              <select
                value={contactLang}
                onChange={(e) => setContactLang(e.target.value)}
                className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="h-[420px] overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 mb-4 shadow-inner space-y-4">
        {transcript.length === 0 && !interimText && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-blue-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">
              Prêt pour la traduction directe alternée
            </p>
            <p className="text-xs text-slate-400 max-w-sm">
              Appuyez sur le micro de votre côté. Une fois votre phrase prononcée, VoxCall bascule automatiquement sur l'interlocuteur.
            </p>
          </div>
        )}

        {transcript.map((t) => {
          const isUser = t.speaker === 'user';
          const isPlayingVO = playingState?.turnId === t.id && playingState?.type === 'original';
          const isPlayingVF = playingState?.turnId === t.id && playingState?.type === 'translated';

          return (
            <div
              key={t.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="text-[11px] text-slate-400 mb-1 px-1 flex items-center gap-2">
                <span className="font-semibold text-slate-300">
                  {isUser ? `Moi (${userLangObj.name})` : `Correspondant (${contactLangObj.name})`}
                </span>
                <span>·</span>
                <span className="font-mono">{t.timestamp}</span>
              </div>

              <div
                className={`max-w-xl rounded-2xl p-4 shadow-sm border ${
                  isUser
                    ? 'bg-blue-950/70 border-blue-800/80 text-white rounded-tr-none'
                    : 'bg-slate-900 border-slate-800 text-slate-100 rounded-tl-none'
                }`}
              >
                {/* Spoken original with VO replay */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="text-sm font-medium leading-relaxed">
                    {t.originalText}
                  </div>
                  <button
                    onClick={() => handleReplaySpeech(t, 'original')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
                      isPlayingVO
                        ? 'bg-amber-600 text-white animate-pulse'
                        : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white'
                    }`}
                    title="Réécouter la voix originale (VO)"
                  >
                    {isPlayingVO ? (
                      <>
                        <Square className="w-3 h-3 fill-current" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3" />
                        <span>Réécouter VO</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Translation with VF replay */}
                <div className="pt-2.5 border-t border-white/10 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-blue-300/90 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Traduction ({isUser ? contactLangObj.name : userLangObj.name})</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleReplaySpeech(t, 'translated')}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          isPlayingVF
                            ? 'bg-emerald-600 text-white animate-pulse'
                            : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white'
                        }`}
                        title="Réécouter la voix traduite"
                      >
                        {isPlayingVF ? (
                          <>
                            <Square className="w-3 h-3 fill-current" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3 h-3" />
                            <span>Réécouter Traduction</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => copyText(t.id, t.translatedText)}
                        className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white"
                        title="Copier la traduction"
                      >
                        {copiedId === t.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-sm font-semibold text-slate-200 leading-relaxed">
                    {t.translatedText}
                  </div>

                  {audioSettings.showPhonetics && t.phonetic && (
                    <div className="text-xs font-mono text-amber-300/80 italic mt-0.5">
                      Phonétique : {t.phonetic}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {interimText && (
          <div className={`flex flex-col ${activeSpeaker === 'user' ? 'items-end' : 'items-start'}`}>
            <div className="text-[11px] text-slate-400 mb-1 px-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <span>Capture en cours ({activeSpeaker === 'user' ? userLangObj.name : contactLangObj.name})...</span>
            </div>
            <div className="max-w-xl rounded-2xl p-3.5 bg-blue-900/30 border border-blue-600/40 text-blue-200 text-sm italic">
              « {interimText} »
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Dual Intercom Controls Deck */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User Side (Left) */}
        <div className={`bg-slate-900 border rounded-2xl p-4 transition-all ${
          activeSpeaker === 'user'
            ? 'border-blue-500/80 shadow-lg shadow-blue-950/50 bg-blue-950/20'
            : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{userLangObj.flag}</span>
              <div>
                <span className="text-sm font-bold text-white">Mon Côté</span>
                <span className="text-xs text-slate-400 ml-1.5 font-medium">({userLangObj.name})</span>
              </div>
            </div>
            {activeSpeaker === 'user' && (
              <span className="px-2 py-0.5 rounded-full bg-blue-950 border border-blue-700 text-blue-400 text-[10px] font-bold animate-pulse">
                Écoute active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => startVoiceInput('user')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                activeSpeaker === 'user'
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {activeSpeaker === 'user' ? (
                <>
                  <MicOff className="w-4 h-4 text-white" />
                  <span>Terminer la phrase</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-blue-400" />
                  <span>Parler en {userLangObj.name}</span>
                </>
              )}
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendManual('user');
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputTextUser}
              onChange={(e) => setInputTextUser(e.target.value)}
              placeholder={`Saisir en ${userLangObj.name}...`}
              className="flex-1 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!inputTextUser.trim() || isTranslating}
              className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Contact Side (Right) */}
        <div className={`bg-slate-900 border rounded-2xl p-4 transition-all ${
          activeSpeaker === 'contact'
            ? 'border-emerald-500/80 shadow-lg shadow-emerald-950/50 bg-emerald-950/20'
            : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{contactLangObj.flag}</span>
              <div>
                <span className="text-sm font-bold text-white">Côté Correspondant</span>
                <span className="text-xs text-slate-400 ml-1.5 font-medium">({contactLangObj.name})</span>
              </div>
            </div>
            {activeSpeaker === 'contact' && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400 text-[10px] font-bold animate-pulse">
                Écoute active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => startVoiceInput('contact')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                activeSpeaker === 'contact'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {activeSpeaker === 'contact' ? (
                <>
                  <MicOff className="w-4 h-4 text-white" />
                  <span>Terminer la phrase</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-emerald-400" />
                  <span>Parler en {contactLangObj.name}</span>
                </>
              )}
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendManual('contact');
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputTextContact}
              onChange={(e) => setInputTextContact(e.target.value)}
              placeholder={`Saisir en ${contactLangObj.name}...`}
              className="flex-1 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!inputTextContact.trim() || isTranslating}
              className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Save Session to History */}
      {transcript.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveToHistory}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>{isSaving ? 'Enregistrement...' : 'Enregistrer la conversation dans l\'historique'}</span>
          </button>
        </div>
      )}

      {/* Speakerphone Guide Modal */}
      {showSpeakerphoneGuide && (
        <SpeakerphoneGuide
          isOpen={showSpeakerphoneGuide}
          onClose={() => setShowSpeakerphoneGuide(false)}
        />
      )}
    </div>
  );
};
