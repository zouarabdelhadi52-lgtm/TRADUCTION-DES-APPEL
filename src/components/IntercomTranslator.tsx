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
} from 'lucide-react';
import { TranscriptTurn, CallRecord, AudioSettings } from '../types';
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '../data/languages';
import { speakTranslatedText, stopSpeaking } from '../utils/audioTelephony';
import { translateSpeech, generateCallSummary } from '../utils/api';
import { SpeechRecognitionManager, isSpeechRecognitionSupported } from '../utils/speechRecognition';

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
  const [interimText, setInterimText] = useState('');
  const [inputTextUser, setInputTextUser] = useState('');
  const [inputTextContact, setInputTextContact] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionStartTime] = useState<number>(Date.now());

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
      // Toggle off
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

      // Play synthesized audio
      if (audioSettings.autoSpeak) {
        const speakLang = speaker === 'user' ? contactLangObj.bcp47 : userLangObj.bcp47;
        speakTranslatedText(result.translatedText, speakLang, {
          rate: audioSettings.speechRate,
          pitch: audioSettings.speechPitch,
          volume: audioSettings.speechVolume,
        });
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

  const handleReplayTurn = (turn: TranscriptTurn) => {
    const lang = turn.speaker === 'user' ? contactLangObj.bcp47 : userLangObj.bcp47;
    speakTranslatedText(turn.translatedText, lang, {
      rate: audioSettings.speechRate,
      pitch: audioSettings.speechPitch,
      volume: audioSettings.speechVolume,
    });
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
    alert('Session enregistrée avec succès dans votre historique !');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            Mode Interphone & Traduction Alternée
          </h1>
          <p className="text-slate-400 text-xs">
            Traduisez une conversation orale continue à deux personnes en face-à-face ou haut-parleur.
          </p>
        </div>

        {/* Language Swap Bar */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl">
          {/* User Lang */}
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
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Inverser les langues"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          {/* Contact Lang */}
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

      {/* Main Conversation Stream */}
      <div className="h-[420px] overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 mb-6 shadow-inner space-y-4">
        {transcript.length === 0 && !interimText && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-blue-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">
              Prêt pour la traduction directe
            </p>
            <p className="text-xs text-slate-400 max-w-sm">
              Appuyez sur le micro de votre côté ou du côté de votre interlocuteur pour commencer.
            </p>
          </div>
        )}

        {transcript.map((t) => {
          const isUser = t.speaker === 'user';
          return (
            <div
              key={t.id}
              className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
            >
              <div className="text-[11px] text-slate-400 mb-1 px-1">
                <span className="font-semibold text-slate-300">
                  {isUser ? userLangObj.name : contactLangObj.name}
                </span>
                <span> · {t.timestamp}</span>
              </div>

              <div
                className={`max-w-lg rounded-2xl p-4 border shadow-sm ${
                  isUser
                    ? 'bg-slate-900 border-slate-800 text-white rounded-tl-none'
                    : 'bg-blue-950/70 border-blue-800 text-white rounded-tr-none'
                }`}
              >
                <div className="text-sm mb-2 font-medium">{t.originalText}</div>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-0.5">
                      Traduction ({isUser ? contactLangObj.name : userLangObj.name})
                    </div>
                    <div className="text-sm font-semibold text-slate-200">
                      {t.translatedText}
                    </div>
                    {audioSettings.showPhonetics && t.phonetic && (
                      <div className="text-xs font-mono text-amber-300/80 italic mt-0.5">
                        {t.phonetic}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleReplayTurn(t)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {interimText && (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs italic text-blue-300">
            Écoute ({activeSpeaker === 'user' ? userLangObj.name : contactLangObj.name}) : « {interimText} »
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Dual Intercom Controls Deck */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Side: User Channel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{userLangObj.flag}</span>
              <span className="text-sm font-bold text-white">Canal 1 · {userLangObj.name}</span>
            </div>
            {activeSpeaker === 'user' && (
              <span className="text-xs font-semibold text-blue-400 animate-pulse">
                Micro ouvert
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => startVoiceInput('user')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                activeSpeaker === 'user'
                  ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {activeSpeaker === 'user' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{activeSpeaker === 'user' ? 'Arrêter de parler' : 'Parler en ' + userLangObj.name}</span>
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
              className="flex-1 bg-slate-950 border border-slate-800 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!inputTextUser.trim()}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Right Side: Contact Channel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{contactLangObj.flag}</span>
              <span className="text-sm font-bold text-white">Canal 2 · {contactLangObj.name}</span>
            </div>
            {activeSpeaker === 'contact' && (
              <span className="text-xs font-semibold text-emerald-400 animate-pulse">
                Micro ouvert
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => startVoiceInput('contact')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                activeSpeaker === 'contact'
                  ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {activeSpeaker === 'contact' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{activeSpeaker === 'contact' ? 'Arrêter de parler' : 'Parler en ' + contactLangObj.name}</span>
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
              className="flex-1 bg-slate-950 border border-slate-800 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!inputTextContact.trim()}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Save Session to History Button */}
      {transcript.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveToHistory}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Disc className="w-3.5 h-3.5 text-blue-400" />
            <span>{isSaving ? 'Génération de la synthèse...' : 'Enregistrer cette session dans l\'historique'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
