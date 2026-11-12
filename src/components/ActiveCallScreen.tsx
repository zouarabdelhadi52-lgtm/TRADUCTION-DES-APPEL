import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Radio,
  Send,
  Sparkles,
  Bot,
  Copy,
  Check,
  Disc,
  ArrowRightLeft,
  Square,
  HelpCircle,
  Headphones,
  RotateCcw,
  Sparkle,
} from 'lucide-react';
import { TranscriptTurn, CallRecord, AudioSettings } from '../types';
import { getLanguageByCode } from '../data/languages';
import { AudioVisualizer } from './AudioVisualizer';
import { SpeakerphoneGuide } from './SpeakerphoneGuide';
import {
  playCallConnectedTone,
  playCallEndedTone,
  startRingingTone,
  stopRingingTone,
  speakTranslatedText,
  stopSpeaking,
  CallAudioRecorder,
} from '../utils/audioTelephony';
import { translateSpeech, simulateRemoteCallerReply, generateCallSummary } from '../utils/api';
import { SpeechRecognitionManager, isSpeechRecognitionSupported } from '../utils/speechRecognition';

interface ActiveCallScreenProps {
  contactName: string;
  contactNumber: string;
  userLang: string;
  contactLang: string;
  scenario?: string;
  audioSettings: AudioSettings;
  onEndCall: (completedCall: CallRecord) => void;
}

export const ActiveCallScreen: React.FC<ActiveCallScreenProps> = ({
  contactName,
  contactNumber,
  userLang,
  contactLang,
  scenario = 'Conversation générale',
  audioSettings,
  onEndCall,
}) => {
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ending'>('ringing');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isRecording, setIsRecording] = useState(true);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isContactSpeaking, setIsContactSpeaking] = useState(false);

  // Turn management & Auto-switch
  const [currentTurn, setCurrentTurn] = useState<'user' | 'contact'>('user');
  const [autoSwitchTurn, setAutoSwitchTurn] = useState(audioSettings.autoSwitchTurn ?? true);

  // Replay state
  const [playingState, setPlayingState] = useState<{
    turnId: string;
    type: 'original' | 'translated';
  } | null>(null);

  // Speakerphone guide modal & banner
  const [showSpeakerphoneModal, setShowSpeakerphoneModal] = useState(false);
  const [isSpeakerBannerDismissed, setIsSpeakerBannerDismissed] = useState(false);

  // Transcript state
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [interimUserText, setInterimUserText] = useState('');
  const [manualInputText, setManualInputText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSimulatingContact, setIsSimulatingContact] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const callRecorderRef = useRef<CallAudioRecorder | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionManager | null>(null);
  const callStartTimeRef = useRef<number>(Date.now());

  const userLangObj = getLanguageByCode(userLang);
  const contactLangObj = getLanguageByCode(contactLang);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, interimUserText]);

  // Initial call connection sequence
  useEffect(() => {
    let connectTimeout: number;

    if (audioSettings.soundEffects) {
      startRingingTone();
    }

    connectTimeout = window.setTimeout(() => {
      stopRingingTone();
      if (audioSettings.soundEffects) {
        playCallConnectedTone();
      }
      setCallStatus('connected');
      callStartTimeRef.current = Date.now();

      // Start Audio Recording
      callRecorderRef.current = new CallAudioRecorder();
      callRecorderRef.current.start().then((started) => {
        setIsRecording(started);
      });

      // Initialize Speech Recognition if supported
      initSpeechRecognition();
    }, 2200);

    return () => {
      clearTimeout(connectTimeout);
      stopRingingTone();
      stopSpeaking();
      speechRecognitionRef.current?.stop();
    };
  }, []);

  // Timer loop when connected
  useEffect(() => {
    if (callStatus !== 'connected') return;

    const timer = setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [callStatus]);

  // Format seconds to mm:ss
  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Setup Web Speech Recognition
  const initSpeechRecognition = () => {
    if (!isSpeechRecognitionSupported()) {
      setStatusNotice('Reconnaissance vocale non disponible. Utilisez le champ texte ou les phrases types ci-dessous.');
      return;
    }

    const manager = new SpeechRecognitionManager(
      (interim) => {
        setIsUserSpeaking(true);
        setInterimUserText(interim);
      },
      (finalText) => {
        setIsUserSpeaking(false);
        setInterimUserText('');
        handleProcessSpokenUtterance(finalText, 'user');
      },
      (errorMsg) => {
        setStatusNotice(errorMsg);
        setIsUserSpeaking(false);
      },
      () => {
        setIsUserSpeaking(false);
      }
    );

    speechRecognitionRef.current = manager;
    if (!isMuted) {
      manager.start(userLangObj.bcp47);
    }
  };

  // Toggle microphone
  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);

    if (nextMute) {
      speechRecognitionRef.current?.stop();
      setIsUserSpeaking(false);
      setInterimUserText('');
    } else {
      speechRecognitionRef.current?.start(userLangObj.bcp47);
    }
  };

  // Manual Turn Switch
  const handleManualSwitchTurn = () => {
    const nextTurn = currentTurn === 'user' ? 'contact' : 'user';
    setCurrentTurn(nextTurn);
    if (nextTurn === 'contact') {
      speechRecognitionRef.current?.stop();
      setStatusNotice(`Tour passé à ${contactName}. Vous pouvez écouter ou déclencher sa réponse.`);
    } else {
      speechRecognitionRef.current?.start(userLangObj.bcp47);
      setStatusNotice('C\'est à votre tour de parler.');
    }
  };

  // Process a spoken or typed utterance
  const handleProcessSpokenUtterance = async (
    text: string,
    speaker: 'user' | 'contact'
  ) => {
    if (!text || !text.trim() || isTranslating) return;

    setIsTranslating(true);
    setStatusNotice(null);

    const timeSeconds = durationSeconds;
    const timeFormatted = formatTimer(timeSeconds);

    const source = speaker === 'user' ? userLangObj.name : contactLangObj.name;
    const target = speaker === 'user' ? contactLangObj.name : userLangObj.name;

    try {
      const translationResult = await translateSpeech(
        text,
        source,
        target,
        speaker,
        transcript.map((t) => ({ speaker: t.speaker, text: t.originalText }))
      );

      const newTurn: TranscriptTurn = {
        id: `turn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        speaker,
        originalText: text,
        translatedText: translationResult.translatedText,
        sourceLang: speaker === 'user' ? userLang : contactLang,
        targetLang: speaker === 'user' ? contactLang : userLang,
        timestamp: timeFormatted,
        timeSeconds,
        phonetic: translationResult.phonetic,
        tone: translationResult.tone,
        adaptationNote: translationResult.adaptationNote,
      };

      setTranscript((prev) => [...prev, newTurn]);

      // Handle speech output and turn switching
      if (speaker === 'user') {
        if (audioSettings.autoSpeak && isSpeakerOn) {
          speakTranslatedText(translationResult.translatedText, contactLangObj.bcp47, {
            rate: audioSettings.speechRate,
            pitch: audioSettings.speechPitch,
            volume: audioSettings.speechVolume,
            onEnd: () => {
              // Automatic turn switch to contact
              if (autoSwitchTurn) {
                setCurrentTurn('contact');
                setStatusNotice(`Bascule automatique : au tour de ${contactName} de répondre...`);
                // Auto simulate contact reply after 1.2s for natural telephony pacing
                setTimeout(() => {
                  handleSimulateContactReply();
                }, 1200);
              }
            },
          });
        } else if (autoSwitchTurn) {
          // If autoSpeak is disabled, switch after 1s
          setTimeout(() => {
            setCurrentTurn('contact');
            setStatusNotice(`Bascule automatique : au tour de ${contactName} de répondre...`);
            setTimeout(() => {
              handleSimulateContactReply();
            }, 1000);
          }, 800);
        }
      } else {
        // Speaker is contact
        if (audioSettings.autoSpeak && isSpeakerOn) {
          speakTranslatedText(translationResult.translatedText, userLangObj.bcp47, {
            rate: audioSettings.speechRate,
            pitch: audioSettings.speechPitch,
            volume: audioSettings.speechVolume,
            onEnd: () => {
              setIsContactSpeaking(false);
              if (autoSwitchTurn) {
                setCurrentTurn('user');
                setStatusNotice('C\'est à votre tour de parler 🎙️');
                speechRecognitionRef.current?.start(userLangObj.bcp47);
              }
            },
          });
        } else {
          setIsContactSpeaking(false);
          if (autoSwitchTurn) {
            setCurrentTurn('user');
            setStatusNotice('C\'est à votre tour de parler 🎙️');
            speechRecognitionRef.current?.start(userLangObj.bcp47);
          }
        }
      }
    } catch (err: unknown) {
      console.error('Translation error:', err);
      setStatusNotice('Erreur de traduction temporaire.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Submit typed text (as caller)
  const handleSendManualText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualInputText.trim()) return;
    const text = manualInputText.trim();
    setManualInputText('');
    handleProcessSpokenUtterance(text, 'user');
  };

  // Simulate contact reply via Gemini AI / Persona engine
  const handleSimulateContactReply = async () => {
    if (isSimulatingContact) return;
    setIsSimulatingContact(true);
    setIsContactSpeaking(true);
    setStatusNotice(`${contactName} formule sa réponse en direct...`);

    const lastUserTurn = [...transcript].reverse().find((t) => t.speaker === 'user');
    const userUtterance = lastUserTurn?.originalText || 'Bonjour';

    try {
      const response = await simulateRemoteCallerReply(
        contactLangObj.name,
        userLangObj.name,
        contactName,
        scenario,
        transcript.map((t) => ({ speaker: t.speaker, text: t.originalText })),
        userUtterance
      );

      const timeSeconds = durationSeconds;
      const timeFormatted = formatTimer(timeSeconds);

      const newTurn: TranscriptTurn = {
        id: `turn-contact-${Date.now()}`,
        speaker: 'contact',
        originalText: response.replyInContactLanguage,
        translatedText: response.translatedToUserLanguage,
        sourceLang: contactLang,
        targetLang: userLang,
        timestamp: timeFormatted,
        timeSeconds,
        phonetic: response.phonetic,
        tone: 'Naturel',
      };

      setTranscript((prev) => [...prev, newTurn]);

      // Speak in French for user on speakerphone
      if (isSpeakerOn && audioSettings.autoSpeak) {
        speakTranslatedText(response.translatedToUserLanguage, userLangObj.bcp47, {
          rate: audioSettings.speechRate,
          pitch: audioSettings.speechPitch,
          volume: audioSettings.speechVolume,
          onEnd: () => {
            setIsContactSpeaking(false);
            if (autoSwitchTurn) {
              setCurrentTurn('user');
              setStatusNotice('C\'est à votre tour de parler 🎙️');
              speechRecognitionRef.current?.start(userLangObj.bcp47);
            }
          },
        });
      } else {
        setIsContactSpeaking(false);
        if (autoSwitchTurn) {
          setCurrentTurn('user');
          setStatusNotice('C\'est à votre tour de parler 🎙️');
          speechRecognitionRef.current?.start(userLangObj.bcp47);
        }
      }

      setStatusNotice(null);
    } catch (err) {
      console.error('Simulation error:', err);
      setStatusNotice('Impossible d\'obtenir la réponse de l\'interlocuteur.');
      setIsContactSpeaking(false);
    } finally {
      setIsSimulatingContact(false);
    }
  };

  // Replay speech for any sentence (Original VO or Translated VF)
  const handleReplaySpeech = (turn: TranscriptTurn, type: 'original' | 'translated') => {
    // If currently playing this exact turn and type, stop it
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

  const copyTranscriptText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Hang up and finalize call
  const handleHangUp = async () => {
    setCallStatus('ending');
    speechRecognitionRef.current?.stop();
    stopSpeaking();

    if (audioSettings.soundEffects) {
      playCallEndedTone();
    }

    let audioUrl: string | undefined = undefined;
    let hasAudio = false;

    if (callRecorderRef.current) {
      try {
        const { dataUrl } = await callRecorderRef.current.stop();
        if (dataUrl) {
          audioUrl = dataUrl;
          hasAudio = true;
        }
      } catch (err) {
        console.warn('Error saving audio record:', err);
      }
    }

    let summaryData = undefined;
    if (transcript.length > 0) {
      try {
        setStatusNotice('Génération de la synthèse intelligente d\'appel...');
        summaryData = await generateCallSummary(
          transcript,
          contactName,
          formatTimer(durationSeconds),
          `${userLangObj.name} ⇄ ${contactLangObj.name}`
        );
      } catch (err) {
        console.warn('Auto summary error:', err);
      }
    }

    const completedCall: CallRecord = {
      id: `call-${Date.now()}`,
      contactName,
      contactNumber,
      contactAvatar: contactName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      callType: 'outgoing',
      date: new Date().toISOString(),
      durationSeconds: Math.max(durationSeconds, 1),
      durationFormatted: formatTimer(durationSeconds),
      userLanguage: userLang,
      contactLanguage: contactLang,
      transcript: transcript.length > 0 ? transcript : [
        {
          id: 'turn-empty',
          speaker: 'user',
          originalText: 'Appel terminé.',
          translatedText: 'Call completed.',
          sourceLang: userLang,
          targetLang: contactLang,
          timestamp: '00:01',
          timeSeconds: 1,
        },
      ],
      summary: summaryData,
      audioUrl,
      hasAudioRecording: hasAudio || transcript.length > 0,
      status: 'completed',
      notes: scenario,
    };

    onEndCall(completedCall);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto px-2 sm:px-4 py-3">
      {/* Telephony Heads-Up Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg mb-2.5 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Contact Identity */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-blue-500/80 flex items-center justify-center text-base font-bold text-white shadow-inner">
              {contactName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{contactName}</span>
                <span className="text-xl" role="img" aria-label="contact flag">
                  {contactLangObj.flag}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span>{contactNumber}</span>
                <span>·</span>
                <span>{scenario}</span>
              </div>
            </div>
          </div>

          {/* Turn Indicator & Call Status */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Active Speaker Turn Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm transition-all ${
                currentTurn === 'user'
                  ? 'bg-blue-950/80 border-blue-700/80 text-blue-200'
                  : 'bg-emerald-950/80 border-emerald-700/80 text-emerald-200'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  currentTurn === 'user' ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400 animate-pulse'
                }`}
              />
              <span>
                {currentTurn === 'user'
                  ? `À vous de parler (${userLangObj.name})`
                  : `À l'interlocuteur (${contactLangObj.name})`}
              </span>
            </div>

            {/* Manual Switch Button */}
            <button
              onClick={handleManualSwitchTurn}
              title="Changer manuellement le tour de parole"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Passer le tour</span>
            </button>

            {/* Duration */}
            {callStatus === 'ringing' ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/70 border border-amber-800/80 text-amber-300 text-xs font-semibold animate-pulse">
                <Radio className="w-4 h-4 animate-spin" />
                <span>Composition en cours...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Durée</span>
                <span className="text-sm font-mono font-bold text-white tabular-nums">
                  {formatTimer(durationSeconds)}
                </span>
                {isRecording && (
                  <span className="flex items-center gap-1 text-[10px] text-red-400 font-mono ml-1">
                    <Disc className="w-3 h-3 animate-spin" />
                    <span>REC</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Audio Visualizer & Channel Bar */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">Canal bilingue :</span>
            <span>{userLangObj.name} {userLangObj.flag}</span>
            <span>⇄</span>
            <span>{contactLangObj.name} {contactLangObj.flag}</span>
            <span className="hidden md:inline">·</span>
            <button
              onClick={() => setAutoSwitchTurn(!autoSwitchTurn)}
              className={`hidden md:flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                autoSwitchTurn
                  ? 'bg-blue-950/60 border-blue-800 text-blue-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <span>Bascule auto : {autoSwitchTurn ? 'Active' : 'Manuelle'}</span>
            </button>
          </div>

          <div className="w-full sm:w-60">
            <AudioVisualizer
              isActive={isUserSpeaking || isContactSpeaking || callStatus === 'ringing'}
              color={isUserSpeaking ? '#3b82f6' : isContactSpeaking ? '#10b981' : '#f59e0b'}
              height={24}
              barsCount={24}
            />
          </div>
        </div>
      </div>

      {/* Prominent Speakerphone Guideline Banner */}
      {!isSpeakerBannerDismissed && (
        <div className="bg-amber-950/50 border border-amber-800/70 rounded-xl px-4 py-2.5 mb-2.5 flex items-center justify-between gap-3 text-xs text-amber-200 shadow-sm shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-900/70 text-amber-300 flex items-center justify-center shrink-0">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-amber-100">Consigne Haut-Parleur Téléphone :</span>
              <span className="text-amber-200/90 ml-1">
                Activez le haut-parleur de votre appel pour que le micro traduise les deux voix sans coupure.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowSpeakerphoneModal(true)}
              className="px-2.5 py-1 bg-amber-900/80 hover:bg-amber-800 border border-amber-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap text-[11px]"
            >
              Consigne détaillée ➔
            </button>
            <button
              onClick={() => setIsSpeakerBannerDismissed(true)}
              className="text-amber-400 hover:text-white text-base px-1 leading-none"
              title="Masquer le rappel"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Conversation Transcript Area */}
      <div className="flex-1 overflow-y-auto bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-2.5 shadow-inner space-y-3.5">
        {transcript.length === 0 && !interimUserText && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-blue-400">
              <Mic className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              Traduction vocale en temps réel prête
            </h3>
            <p className="text-xs text-slate-400 max-w-md mb-4 leading-relaxed">
              Parlez dans votre micro. La phrase sera traduite, prononcée à haute voix, puis VoxCall basculera automatiquement l'écoute vers votre correspondant.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
              <span className="text-[11px] text-slate-400 w-full mb-1">
                Phrases suggérées pour commencer :
              </span>
              {userLangObj.samplePhrases.slice(0, 3).map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => handleProcessSpokenUtterance(phrase, 'user')}
                  className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors text-left"
                >
                  « {phrase} »
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Turn items with Dual Replay Buttons */}
        {transcript.map((turn) => {
          const isUser = turn.speaker === 'user';
          const isPlayingOriginal = playingState?.turnId === turn.id && playingState?.type === 'original';
          const isPlayingTranslated = playingState?.turnId === turn.id && playingState?.type === 'translated';

          return (
            <div
              key={turn.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
            >
              {/* Speaker label & timestamp */}
              <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400 px-1">
                <span className="font-semibold text-slate-300">
                  {isUser ? `Moi (${userLangObj.name})` : `${contactName} (${contactLangObj.name})`}
                </span>
                <span>·</span>
                <span className="font-mono">{turn.timestamp}</span>
                {turn.tone && (
                  <>
                    <span>·</span>
                    <span className="text-slate-400">{turn.tone}</span>
                  </>
                )}
              </div>

              {/* Message Box */}
              <div
                className={`max-w-xl rounded-2xl p-4 shadow-sm border ${
                  isUser
                    ? 'bg-blue-950/70 border-blue-800/80 text-white rounded-tr-none'
                    : 'bg-slate-900 border-slate-800 text-slate-100 rounded-tl-none'
                }`}
              >
                {/* Spoken original with VO Replay button */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="text-sm font-medium leading-relaxed">
                    {turn.originalText}
                  </div>
                  <button
                    onClick={() => handleReplaySpeech(turn, 'original')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
                      isPlayingOriginal
                        ? 'bg-amber-600 text-white animate-pulse'
                        : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white'
                    }`}
                    title="Réécouter la voix originale (VO)"
                  >
                    {isPlayingOriginal ? (
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

                {/* Translation block with Translated Replay button */}
                <div className="pt-2.5 border-t border-white/10 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-blue-300/90 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Traduction ({isUser ? contactLangObj.name : userLangObj.name})</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Replay Translated Voice Button */}
                      <button
                        onClick={() => handleReplaySpeech(turn, 'translated')}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          isPlayingTranslated
                            ? 'bg-emerald-600 text-white animate-pulse'
                            : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white'
                        }`}
                        title="Réécouter la voix traduite"
                      >
                        {isPlayingTranslated ? (
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

                      {/* Copy Translation */}
                      <button
                        onClick={() => copyTranscriptText(turn.id, turn.translatedText)}
                        title="Copier la traduction"
                        className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                      >
                        {copiedId === turn.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-sm text-slate-200 font-semibold leading-relaxed">
                    {turn.translatedText}
                  </div>

                  {/* Phonetic transcription if present */}
                  {audioSettings.showPhonetics && turn.phonetic && (
                    <div className="text-xs font-mono text-amber-300/80 italic mt-0.5">
                      Phonétique : {turn.phonetic}
                    </div>
                  )}

                  {/* Adaptation note */}
                  {turn.adaptationNote && (
                    <div className="text-[11px] text-slate-400 mt-1">
                      Note : {turn.adaptationNote}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Interim speaking preview */}
        {interimUserText && (
          <div className="flex flex-col items-end">
            <div className="text-[11px] text-slate-400 mb-1 px-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <span>Écoute en cours...</span>
            </div>
            <div className="max-w-xl rounded-2xl rounded-tr-none p-3.5 bg-blue-900/30 border border-blue-600/40 text-blue-200 text-sm italic">
              « {interimUserText} »
            </div>
          </div>
        )}

        <div ref={transcriptEndRef} />
      </div>

      {/* Status Notice if any */}
      {statusNotice && (
        <div className="text-xs text-amber-300 bg-amber-950/60 border border-amber-800/80 px-3 py-1.5 rounded-lg mb-2 flex items-center justify-between">
          <span>{statusNotice}</span>
          <button
            onClick={() => setStatusNotice(null)}
            className="text-amber-400 hover:text-white text-xs ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* In-Call Controls Deck */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-lg shrink-0">
        {/* Quick Response Preset Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2.5 scrollbar-none text-xs">
          <span className="text-slate-400 font-medium whitespace-nowrap shrink-0">
            Phrases rapides :
          </span>
          {userLangObj.samplePhrases.slice(0, 4).map((p) => (
            <button
              key={p}
              onClick={() => handleProcessSpokenUtterance(p, 'user')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700 whitespace-nowrap shrink-0 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Text Input Row */}
        <form onSubmit={handleSendManualText} className="flex items-center gap-2 mb-2.5">
          <input
            type="text"
            value={manualInputText}
            onChange={(e) => setManualInputText(e.target.value)}
            placeholder={`Saisir une phrase en ${userLangObj.name} à traduire instantanément...`}
            className="flex-1 bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={!manualInputText.trim() || isTranslating}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition-colors shrink-0"
            aria-label="Traduire et prononcer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Telephony Action Buttons Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isMuted
                  ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
              <span>{isMuted ? 'Micro Coupé' : 'Micro Actif'}</span>
            </button>

            {/* Speaker Toggle */}
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`p-2 rounded-xl border text-xs transition-all ${
                isSpeakerOn
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  : 'bg-red-950/80 border-red-700 text-red-300'
              }`}
              title={isSpeakerOn ? 'Haut-parleur actif' : 'Haut-parleur désactivé'}
            >
              {isSpeakerOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Auto Switch Turn Toggle */}
            <button
              onClick={() => setAutoSwitchTurn(!autoSwitchTurn)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                autoSwitchTurn
                  ? 'bg-blue-950/70 border-blue-700/80 text-blue-200'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
              title="Bascule automatique du tour de parole après chaque traduction"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>Bascule auto : {autoSwitchTurn ? 'ON' : 'OFF'}</span>
            </button>

            {/* Speakerphone Guide Button */}
            <button
              onClick={() => setShowSpeakerphoneModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/80 transition-colors"
              title="Ouvrir les consignes pour le haut-parleur"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Consigne Haut-Parleur</span>
            </button>
          </div>

          {/* AI Remote Caller Simulation Button & Hangup */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateContactReply}
              disabled={isSimulatingContact}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-purple-950/80 hover:bg-purple-900/80 text-purple-200 border border-purple-800/80 transition-all disabled:opacity-50"
              title="Faire répondre le correspondant dans sa langue maternelle"
            >
              <Bot className="w-4 h-4 text-purple-400" />
              <span>
                {isSimulatingContact ? 'Réponse...' : 'Réponse Correspondant'}
              </span>
            </button>

            {/* Hangup Button */}
            <button
              onClick={handleHangUp}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/40 transition-all"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Raccrocher</span>
            </button>
          </div>
        </div>
      </div>

      {/* Speakerphone Guide Modal */}
      {showSpeakerphoneModal && (
        <SpeakerphoneGuide
          isOpen={showSpeakerphoneModal}
          onClose={() => setShowSpeakerphoneModal(false)}
        />
      )}
    </div>
  );
};
