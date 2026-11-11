import React, { useState } from 'react';
import { Smartphone, Download, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already installed in standalone mode, show subtle badge or hide
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      {/* Mobile Install Strip */}
      <div className="bg-gradient-to-r from-blue-900/40 via-blue-800/30 to-slate-900 border-b border-blue-700/40 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-200">
          <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong>Installer sur votre téléphone :</strong> Fonctionne comme une application native sans navigateur.
          </span>
        </div>

        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shrink-0 shadow-sm transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Installer</span>
        </button>
      </div>

      {/* Manual Installation Guide Modal (iOS or browsers without beforeinstallprompt) */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Installer VoxCall sur votre Téléphone
                </h3>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-5">
              Installez VoxCall directement sur votre smartphone pour l'utiliser en plein écran
              et profiter du démarrage automatique sur les appels entrants.
            </p>

            {isIOS ? (
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 mb-5 text-xs text-slate-300">
                <div className="font-semibold text-white mb-1 flex items-center gap-2">
                  <span>Instructions pour iPhone / iPad (Safari) :</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-900/60 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <span>
                    Appuyez sur le bouton <strong>Partager</strong> <Share className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> dans la barre de navigation de Safari.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-900/60 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <span>
                    Faites défiler vers le bas et sélectionnez <strong>Sur l'écran d'accueil</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-900/60 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <span>
                    Appuyez sur <strong>Ajouter</strong> en haut à droite. L'icône de l'application apparaîtra avec vos autres applications !
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 mb-5 text-xs text-slate-300">
                <div className="font-semibold text-white mb-1">
                  Instructions pour Android (Chrome / Edge / Samsung Internet) :
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-900/60 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <span>
                    Ouvrez le menu du navigateur (les 3 points verticaux en haut à droite).
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-900/60 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <span>
                    Appuyez sur <strong>Installer l'application</strong> ou <strong>Ajouter à l'écran d'accueil</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-900/60 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <span>
                    Confirmez l'installation. L'application démarrera désormais de façon autonome comme une app native !
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Sans passer par le Play Store ou l'App Store</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Affichage plein écran sans barre d'adresse</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Accès instantané au décrochage d'appel</span>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors"
            >
              Compris, fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
};
