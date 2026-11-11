import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
  Smartphone,
  Play,
  RotateCcw,
} from 'lucide-react';
import { getLanguageByCode } from '../data/languages';
import { startRingingTone, stopRingingTone } from '../utils/audioTelephony';

interface IncomingCallDetectorProps {
  isStandbyActive: boolean;
  onToggleStandby: (active: boolean) => void;
  onIncomingCallAccepted: (callParams: {
    contactName: string;
    contactNumber: string;
    contactLang: string;
    userLang: string;
    scenario: string;
  }) => void;
  userLang: string;
  contactLang: string;
}

export const IncomingCallDetector: React.FC<IncomingCallDetectorProps> = ({
  isStandbyActive,
  onToggleStandby,
  onIncomingCallAccepted,
  userLang,
  contactLang,
}) => {
  const [incomingCall, setIncomingCall] = useState<{
    callerName: string;
    callerNumber: string;
    callerLang: string;
    location: string;
    scenario: string;
  } | null>(null);

  const [testCountdown, setTestCountdown] = useState<number | null>(null);
  const [autoAnswerDelay, setAutoAnswerDelay] = useState(0); // 0 = manual pick up, 3 = 3s
  const [wakeLockActive, setWakeLockActive] = useState(false);

  const wakeLockRef = useRef<any>(null);
  const countdownTimerRef = useRef<number | null>(null);

  const userLangObj = getLanguageByCode(userLang);

  // Request WakeLock when standby is active so the mobile phone does not sleep
  useEffect(() => {
    async function requestWakeLock() {
      if (isStandbyActive && 'wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          setWakeLockActive(true);
        } catch (e) {
          console.debug('WakeLock error:', e);
        }
      } else if (!isStandbyActive && wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
          setWakeLockActive(false);
        } catch {}
      }
    }

    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, [isStandbyActive]);

  // Handle countdown for simulated incoming call
  useEffect(() => {
    if (testCountdown !== null && testCountdown > 0) {
      countdownTimerRef.current = window.setTimeout(() => {
        setTestCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (testCountdown === 0) {
      setTestCountdown(null);
      triggerIncomingCall({
        callerName: contactLang === 'ary' ? 'Mehdi Benjelloun' : 'Kenji Takahashi',
        callerNumber: contactLang === 'ary' ? '+212 5 22 40 50 60' : '+81 3 5555 0192',
        callerLang: contactLang || 'ary',
        location: contactLang === 'ary' ? 'Casablanca, Maroc' : 'Tokyo, Japon',
        scenario: contactLang === 'ary' ? 'Dédouanement & Fret Port Tanger Med' : 'Appel international urgent fret maritime',
      });
    }

    return () => {
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    };
  }, [testCountdown]);

  // Trigger Incoming Call state
  const triggerIncomingCall = (caller: {
    callerName: string;
    callerNumber: string;
    callerLang: string;
    location: string;
    scenario: string;
  }) => {
    setIncomingCall(caller);
    startRingingTone();

    // Trigger mobile vibration if supported
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([400, 250, 400, 250, 600]);
      } catch {}
    }

    // Auto-answer if configured
    if (autoAnswerDelay > 0) {
      setTimeout(() => {
        acceptCall(caller);
      }, autoAnswerDelay * 1000);
    }
  };

  const acceptCall = (caller: typeof incomingCall) => {
    if (!caller) return;
    stopRingingTone();
    if ('vibrate' in navigator) navigator.vibrate(0);
    setIncomingCall(null);

    onIncomingCallAccepted({
      contactName: caller.callerName,
      contactNumber: caller.callerNumber,
      contactLang: caller.callerLang,
      userLang: userLang || 'fr',
      scenario: caller.scenario,
    });
  };

  const rejectCall = () => {
    stopRingingTone();
    if ('vibrate' in navigator) navigator.vibrate(0);
    setIncomingCall(null);
  };

  const contactLangObj = incomingCall ? getLanguageByCode(incomingCall.callerLang) : getLanguageByCode(contactLang);

  return (
    <>
      {/* Fullscreen Incoming Call Screen when phone rings */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-slate-950 via-slate-900 to-black flex flex-col justify-between items-center py-12 px-6 animate-fade-in text-white">
          {/* Top: Caller Info */}
          <div className="flex flex-col items-center text-center mt-8">
            <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-blue-500/80 flex items-center justify-center text-2xl font-bold text-white shadow-2xl mb-4 animate-bounce">
              {incomingCall.callerName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>

            <div className="text-xs uppercase tracking-widest text-blue-400 font-semibold mb-1">
              Appel Téléphonique Entrant
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
              {incomingCall.callerName}
            </h2>

            <div className="flex items-center gap-2 text-slate-300 font-mono text-sm mb-2">
              <span>{incomingCall.callerNumber}</span>
              <span>·</span>
              <span>{incomingCall.location}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/80 border border-slate-700/80 rounded-full text-xs text-slate-200">
              <span className="text-base">{contactLangObj.flag}</span>
              <span>Langue de l'interlocuteur : <strong>{contactLangObj.name}</strong></span>
            </div>

            <div className="mt-4 text-xs text-emerald-400 flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span>Traduction vocale instantanée prête à s'activer au décrochage</span>
            </div>
          </div>

          {/* Bottom Action Buttons: Reject vs Answer */}
          <div className="w-full max-w-sm flex items-center justify-around mb-8">
            {/* Reject */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={rejectCall}
                className="w-18 h-18 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-950/60 active:scale-95 transition-all"
                aria-label="Refuser l'appel"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
              <span className="text-xs text-slate-400 font-medium">Refuser</span>
            </div>

            {/* Accept & Start Translation */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => acceptCall(incomingCall)}
                className="w-20 h-20 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-950/80 active:scale-95 transition-all animate-pulse"
                aria-label="Décrocher et démarrer la traduction vocale"
              >
                <Phone className="w-9 h-9 fill-current" />
              </button>
              <span className="text-xs text-emerald-400 font-bold">
                Décrocher & Traduire
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Standby Banner / Mode Configuration Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isStandbyActive ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              <Zap className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Mode "Démarrage Automatique sur Appel"
                </h3>
                {isStandbyActive && (
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded font-mono font-semibold">
                    VEILLE ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                L'application reste prête en arrière-plan. Dès qu'un appel entrant ou sortant survient,
                elle active instantanément l'écran de traduction vocale et le micro sans délai.
              </p>
            </div>
          </div>

          {/* Standby Toggle Switch */}
          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isStandbyActive}
                onChange={(e) => onToggleStandby(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Test Trigger Button for Mobile Verification */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span>Tester le déclenchement immédiat sur votre smartphone :</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (testCountdown === null) setTestCountdown(4);
                else setTestCountdown(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-semibold transition-all"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>
                {testCountdown !== null
                  ? `Appel entrant dans ${testCountdown}s... (annuler)`
                  : 'Recevoir un Appel Entrant Test'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
