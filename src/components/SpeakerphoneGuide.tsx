import React, { useState } from 'react';
import {
  Volume2,
  Phone,
  Smartphone,
  Headphones,
  CheckCircle2,
  X,
  AlertCircle,
  HelpCircle,
  Play,
  Square,
  Sparkles,
} from 'lucide-react';
import { speakTranslatedText, stopSpeaking } from '../utils/audioTelephony';

interface SpeakerphoneGuideProps {
  isOpen?: boolean;
  onClose?: () => void;
  inline?: boolean;
}

export const SpeakerphoneGuide: React.FC<SpeakerphoneGuideProps> = ({
  isOpen = true,
  onClose,
  inline = false,
}) => {
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  const handleTestAudio = () => {
    if (isPlayingTest) {
      stopSpeaking();
      setIsPlayingTest(false);
      return;
    }

    setIsPlayingTest(true);
    speakTranslatedText(
      'Ceci est un test de diffusion sur haut-parleur. Le son doit être clair et audible pour vous et votre interlocuteur.',
      'fr-FR',
      {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        onEnd: () => setIsPlayingTest(false),
      }
    );
  };

  const content = (
    <div className="space-y-5 text-slate-200">
      {/* Alert Header Box */}
      <div className="bg-amber-950/40 border border-amber-800/80 rounded-2xl p-4 flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-amber-900/60 border border-amber-700/80 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
          <Volume2 className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-300 mb-1 flex items-center gap-1.5">
            <span>Règle d'or : Activez le Haut-Parleur sur votre téléphone</span>
          </h4>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            Sur smartphone (Android ou iPhone), les systèmes d'exploitation interdisent aux applications web d'intercepter directement le flux audio interne d'un appel téléphonique (GSM ou WhatsApp).
            <span className="font-semibold text-amber-100"> Le mode Haut-Parleur est donc indispensable pour permettre la traduction bidirectionnelle en direct.</span>
          </p>
        </div>
      </div>

      {/* 3 Steps Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Step 1 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800/80 text-blue-400 flex items-center justify-center font-bold text-xs mb-3">
              1
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <Smartphone className="w-4 h-4 text-blue-400" />
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                Mettre sur Haut-Parleur
              </h5>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dans votre application Téléphone ou WhatsApp, appuyez sur l'icône <span className="text-white font-semibold">« Haut-Parleur »</span> (Speaker) dès que votre correspondant décroche.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-blue-400/90 font-medium">
            Permet au micro de capter sa voix
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800/80 text-emerald-400 flex items-center justify-center font-bold text-xs mb-3">
              2
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <Phone className="w-4 h-4 text-emerald-400" />
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                Traduction Automatique
              </h5>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              VoxCall capte la voix de votre correspondant qui sort du haut-parleur, affiche les sous-titres traduits et vous les lit immédiatement.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-emerald-400/90 font-medium">
            Bascule automatique de tour
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-800/80 text-purple-400 flex items-center justify-center font-bold text-xs mb-3">
              3
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <Volume2 className="w-4 h-4 text-purple-400" />
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                Diffusion vers l'appel
              </h5>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Quand vous parlez, VoxCall prononce la traduction dans la langue de votre interlocuteur à voix haute pour qu'il l'entende distinctement.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-purple-400/90 font-medium">
            Compréhension instantanée
          </div>
        </div>
      </div>

      {/* Recommended Tips & Hands-Free Kit */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
        <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Headphones className="w-4 h-4 text-cyan-400" />
          <span>Astuces pour une qualité optimale</span>
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong className="text-white">Distance idéale :</strong> Tenez le téléphone à environ 20–40 cm de votre bouche en parlant d'une voix posée.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong className="text-white">Option Écouteurs :</strong> Vous pouvez utiliser des écouteurs simples pour écouter la traduction en privé pendant que le micro capte votre voix.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong className="text-white">Bascule de tour automatique :</strong> Dès qu'une phrase est prononcée, VoxCall passe automatiquement l'écoute à l'autre personne.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong className="text-white">Bouton Réécoute :</strong> Vous pouvez réécouter n'importe quelle phrase à tout moment d'un simple clic sur l'icône audio.</span>
          </div>
        </div>
      </div>

      {/* Test Speaker Button */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Vérifiez le volume de votre haut-parleur dès maintenant :</span>
        </div>
        <button
          onClick={handleTestAudio}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            isPlayingTest
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-950/40'
          }`}
        >
          {isPlayingTest ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Arrêter le test</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Tester le Haut-Parleur</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  if (inline) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800 text-blue-400 flex items-center justify-center">
              <Volume2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">
              Consigne & Réglage du Haut-Parleur Téléphonique
            </h3>
          </div>
        </div>
        {content}
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl relative">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-800 text-blue-400 flex items-center justify-center shadow-inner">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Consigne Haut-Parleur pour les Appels Réels
              </h3>
              <p className="text-xs text-slate-400">
                Guide de configuration pour une traduction fluide et bidirectionnelle
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {content}

        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            J'ai compris, fermer
          </button>
        </div>
      </div>
    </div>
  );
};
