import React, { useState, useEffect } from 'react';
import { CallRecord, AudioSettings } from './types';
import { INITIAL_CALL_RECORDS } from './data/sampleCalls';
import { Navbar } from './components/Navbar';
import { DialerPanel } from './components/DialerPanel';
import { ActiveCallScreen } from './components/ActiveCallScreen';
import { IntercomTranslator } from './components/IntercomTranslator';
import { CallHistoryView } from './components/CallHistoryView';
import { SettingsModal } from './components/SettingsModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { IncomingCallDetector } from './components/IncomingCallDetector';
import { SpeakerphoneGuide } from './components/SpeakerphoneGuide';
import { AndroidInstallModal } from './components/AndroidInstallModal';

const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  autoSpeak: true,
  autoSwitchTurn: true,
  speechRate: 1.0,
  speechPitch: 1.0,
  speechVolume: 1.0,
  noiseSuppression: true,
  echoCancellation: true,
  soundEffects: true,
  showPhonetics: true,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'call' | 'intercom' | 'history' | 'settings'>('call');
  const [isInCall, setIsInCall] = useState(false);
  const [isStandbyActive, setIsStandbyActive] = useState(true); // Auto-start on call enabled by default
  const [showSpeakerphoneGuide, setShowSpeakerphoneGuide] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);

  // Language pair (Default: Français ⇄ Darija Marocaine 🇲🇦)
  const [userLang, setUserLang] = useState('fr');
  const [contactLang, setContactLang] = useState('ary');

  // Active call details
  const [activeCallParams, setActiveCallParams] = useState({
    contactName: 'Mehdi Benjelloun',
    contactNumber: '+212 5 22 40 50 60',
    scenario: 'Dédouanement & Fret Port Tanger Med',
  });

  // Call history records loaded with localStorage persistence
  const [calls, setCalls] = useState<CallRecord[]>(() => {
    try {
      const stored = localStorage.getItem('voxcall_records');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return INITIAL_CALL_RECORDS;
  });

  // Audio settings
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => {
    try {
      const stored = localStorage.getItem('voxcall_settings');
      if (stored) return JSON.parse(stored);
    } catch {
      // Fallback
    }
    return DEFAULT_AUDIO_SETTINGS;
  });

  // Check protocol handler / URL params on initial load
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const callParam = params.get('call');
      if (callParam) {
        setActiveCallParams({
          contactName: 'Appel Direct',
          contactNumber: callParam,
          scenario: 'Appel direct déclenché',
        });
        setIsInCall(true);
        setActiveTab('call');
      }
    } catch {}
  }, []);

  // Sync calls to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('voxcall_records', JSON.stringify(calls));
    } catch (e) {
      console.warn('LocalStorage save error (likely quota):', e);
    }
  }, [calls]);

  // Sync settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('voxcall_settings', JSON.stringify(audioSettings));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [audioSettings]);

  // Start Call (Outgoing)
  const handleStartCall = (params: {
    contactName: string;
    contactNumber: string;
    userLang: string;
    contactLang: string;
    scenario?: string;
  }) => {
    setUserLang(params.userLang);
    setContactLang(params.contactLang);
    setActiveCallParams({
      contactName: params.contactName,
      contactNumber: params.contactNumber,
      scenario: params.scenario || 'Conversation générale',
    });
    setIsInCall(true);
    setActiveTab('call');
  };

  // Incoming Call Answered -> Auto-Start translation
  const handleIncomingCallAccepted = (callParams: {
    contactName: string;
    contactNumber: string;
    contactLang: string;
    userLang: string;
    scenario: string;
  }) => {
    setUserLang(callParams.userLang);
    setContactLang(callParams.contactLang);
    setActiveCallParams({
      contactName: callParams.contactName,
      contactNumber: callParams.contactNumber,
      scenario: callParams.scenario,
    });
    setIsInCall(true);
    setActiveTab('call');
  };

  // End Call callback
  const handleEndCall = (completedCall: CallRecord) => {
    setIsInCall(false);
    setCalls((prev) => [completedCall, ...prev]);
    setActiveTab('history');
  };

  const handleDeleteCall = (id: string) => {
    setCalls((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdateCall = (updated: CallRecord) => {
    setCalls((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* PWA Install Notification Bar */}
      <PWAInstallBanner />

      {/* Navigation Top Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isInCall={isInCall}
        onOpenDialer={() => {
          setIsInCall(false);
          setActiveTab('call');
        }}
        onOpenSpeakerphoneGuide={() => setShowSpeakerphoneGuide(true)}
        onOpenAndroidModal={() => setShowAndroidModal(true)}
        recordingsCount={calls.length}
      />

      {/* Incoming Call Standby Detector (Rings & vibration on incoming call) */}
      {!isInCall && (
        <div className="max-w-6xl mx-auto px-4 pt-4 w-full">
          <IncomingCallDetector
            isStandbyActive={isStandbyActive}
            onToggleStandby={setIsStandbyActive}
            onIncomingCallAccepted={handleIncomingCallAccepted}
            userLang={userLang}
            contactLang={contactLang}
          />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'call' && (
          isInCall ? (
            <ActiveCallScreen
              contactName={activeCallParams.contactName}
              contactNumber={activeCallParams.contactNumber}
              userLang={userLang}
              contactLang={contactLang}
              scenario={activeCallParams.scenario}
              audioSettings={audioSettings}
              onEndCall={handleEndCall}
            />
          ) : (
            <DialerPanel
              onStartCall={handleStartCall}
              userLang={userLang}
              contactLang={contactLang}
              setUserLang={setUserLang}
              setContactLang={setContactLang}
            />
          )
        )}

        {activeTab === 'intercom' && (
          <IntercomTranslator
            userLang={userLang}
            contactLang={contactLang}
            setUserLang={setUserLang}
            setContactLang={setContactLang}
            audioSettings={audioSettings}
            onSaveToHistory={(newRecord) => {
              setCalls((prev) => [newRecord, ...prev]);
            }}
          />
        )}

        {activeTab === 'history' && (
          <CallHistoryView
            calls={calls}
            audioSettings={audioSettings}
            onDeleteCall={handleDeleteCall}
            onUpdateCall={handleUpdateCall}
            onStartNewCall={() => {
              setIsInCall(false);
              setActiveTab('call');
            }}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsModal
            settings={audioSettings}
            onUpdateSettings={setAudioSettings}
          />
        )}
      </main>

      {/* Global Speakerphone Guide Modal */}
      {showSpeakerphoneGuide && (
        <SpeakerphoneGuide
          isOpen={showSpeakerphoneGuide}
          onClose={() => setShowSpeakerphoneGuide(false)}
        />
      )}

      {/* Global Android Hub & APK Modal */}
      {showAndroidModal && (
        <AndroidInstallModal
          isOpen={showAndroidModal}
          onClose={() => setShowAndroidModal(false)}
        />
      )}
    </div>
  );
}
