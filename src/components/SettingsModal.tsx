import React from 'react';
import { Volume2, Sliders, Sparkles, Check, Play, Bell } from 'lucide-react';
import { AudioSettings } from '../types';
import { speakTranslatedText } from '../utils/audioTelephony';

interface SettingsModalProps {
  settings: AudioSettings;
  onUpdateSettings: (newSettings: AudioSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const handleChange = <K extends keyof AudioSettings>(key: K, value: AudioSettings[K]) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  const testVoice = () => {
    speakTranslatedText(
      'Bonjour, ceci est un test de synthèse vocale pour la traduction de vos appels téléphoniques.',
      'fr-FR',
      {
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        volume: settings.speechVolume,
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
          Paramètres Audio & Synthèse Vocale
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Ajustez la vitesse de parole, la tonalité de la voix, les effets sonores de téléphonie et l'affichage des transcriptions.
        </p>
      </div>

      <div className="space-y-6">
        {/* Voice Synthesis Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-blue-400" />
            <span>Moteur de Synthèse Vocale (Text-To-Speech)</span>
          </h2>

          <div className="space-y-5">
            {/* Auto speak toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">
                  Prononciation Automatique Instantanée
                </div>
                <div className="text-xs text-slate-400">
                  Prononce à haute voix la traduction dès qu'une phrase est terminée.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoSpeak}
                  onChange={(e) => handleChange('autoSpeak', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Speech Rate Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-300">Vitesse d'élocution</span>
                <span className="font-mono text-blue-400 font-bold">{settings.speechRate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.05"
                value={settings.speechRate}
                onChange={(e) => handleChange('speechRate', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Lent (0.7x)</span>
                <span>Normal (1.0x)</span>
                <span>Rapide (1.4x)</span>
              </div>
            </div>

            {/* Speech Pitch Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-300">Tonalité de la voix (Pitch)</span>
                <span className="font-mono text-blue-400 font-bold">{settings.speechPitch.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.05"
                value={settings.speechPitch}
                onChange={(e) => handleChange('speechPitch', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Plus grave</span>
                <span>Standard</span>
                <span>Plus aigu</span>
              </div>
            </div>

            {/* Test Voice Button */}
            <div className="pt-2">
              <button
                onClick={testVoice}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Tester la voix actuelle</span>
              </button>
            </div>
          </div>
        </div>

        {/* Telephony Effects & Display */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Options Téléphoniques & Affichage</span>
          </h2>

          <div className="space-y-4">
            {/* DTMF sound effects */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">
                  Effets Sonores & Sonnerie DTMF
                </div>
                <div className="text-xs text-slate-400">
                  Joue les tonalités de touches téléphoniques et la sonnerie d'appel.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.soundEffects}
                  onChange={(e) => handleChange('soundEffects', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Phonetics display */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">
                  Afficher les Guides Phonétiques
                </div>
                <div className="text-xs text-slate-400">
                  Affiche la romanisation pour le japonais, l'arabe, le chinois, le russe, etc.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showPhonetics}
                  onChange={(e) => handleChange('showPhonetics', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
