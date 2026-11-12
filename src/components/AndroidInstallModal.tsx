import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  Share2,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Radio,
  Volume2,
  X,
  Sparkles,
  QrCode,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstalled, isInstallable, install } = usePWAInstall();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedApkGuide, setCopiedApkGuide] = useState(false);
  const [activeTab, setActiveTab] = useState<'install' | 'features' | 'apk'>('install');
  const [isAndroid, setIsAndroid] = useState(false);

  const appUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://ais-dev-qplbmoprbtrog2lvydqp2s-658959428819.europe-west2.run.app';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      setIsAndroid(/android/i.test(ua));
    }
  }, []);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyPWABuilderUrl = () => {
    const pwaBuilderUrl = `https://www.pwabuilder.com?site=${encodeURIComponent(appUrl)}`;
    navigator.clipboard.writeText(pwaBuilderUrl);
    setCopiedApkGuide(true);
    setTimeout(() => setCopiedApkGuide(false), 2500);
  };

  const handleDownloadTwaManifest = () => {
    const twaConfig = {
      packageId: "app.voxcall.translate",
      host: typeof window !== 'undefined' ? window.location.hostname : "voxcall.app",
      name: "VoxCall Translate",
      launcherName: "VoxCall",
      themeColor: "#0b0f19",
      navigationColor: "#0b0f19",
      backgroundColor: "#0b0f19",
      enableNotifications: true,
      startUrl: "/",
      iconUrl: `${appUrl}/pwa-512x512.png`,
      maskableIconUrl: `${appUrl}/pwa-maskable-512x512.png`,
      appVersionName: "1.0.0",
      appVersionCode: 1,
      minSdkVersion: 21,
      features: {
        locationDelegation: { enabled: false },
        playBilling: { enabled: false }
      }
    };

    const blob = new Blob([JSON.stringify(twaConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voxcall-android-twa-manifest.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // QR Code URL via Google Chart API fallback / direct standard QR generator for high contrast
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(appUrl)}&color=0b0f19&bgcolor=ffffff&margin=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl relative">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-600/60 text-emerald-400 flex items-center justify-center shadow-inner">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  VoxCall Translate pour Android
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-800 text-emerald-400">
                  WebAPK / APK
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Installation directe sur smartphone, gestion d'appels & packaging APK
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl my-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('install')}
            className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'install'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Installation Rapide (1-Clic)</span>
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'features'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Capacités Android</span>
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'apk'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Export APK & Play Store</span>
          </button>
        </div>

        {/* TAB 1: INSTALLATION RAPIDE (1-CLIC & QR CODE) */}
        {activeTab === 'install' && (
          <div className="space-y-4">
            {isAndroid ? (
              /* User is currently browsing on an Android device */
              <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-2xl p-5">
                <div className="flex items-center gap-2.5 text-emerald-300 font-bold text-sm mb-2">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <span>Votre smartphone Android est détecté !</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Vous pouvez installer VoxCall en un clic. L'application s'installera sous forme de <strong className="text-white">WebAPK officielle</strong> dans votre tiroir d'applications Android avec icône sur l'écran d'accueil.
                </p>

                {isInstallable ? (
                  <button
                    onClick={async () => {
                      const success = await install();
                      if (success) onClose();
                    }}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/60 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Installer VoxCall sur mon Android</span>
                  </button>
                ) : (
                  <div className="space-y-2 bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300">
                    <div className="font-semibold text-white mb-1">
                      Si le bouton ne s'affiche pas automatiquement :
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-blue-400 flex items-center justify-center text-[10px] font-bold">1</span>
                      <span>Dans <strong>Google Chrome</strong> ou <strong>Samsung Internet</strong>, appuyez sur les <strong>3 points (⋮)</strong> en haut à droite.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-blue-400 flex items-center justify-center text-[10px] font-bold">2</span>
                      <span>Sélectionnez <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* User is currently browsing on Desktop/PC and wants to install on their Android phone */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex flex-col items-center text-center p-3 bg-white rounded-2xl shadow-inner">
                  <img
                    src={qrCodeUrl}
                    alt="Scanner pour ouvrir sur Android"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                  <span className="mt-2 text-[11px] font-semibold text-slate-900 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scannez avec votre appareil photo Android</span>
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white">
                    Comment l'installer sur votre téléphone Android :
                  </h3>
                  <ol className="text-xs text-slate-300 space-y-2.5 list-none pl-0">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-950 border border-blue-700 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                      <span>Ouvrez l'appareil photo de votre smartphone Android et pointez le QR code ci-contre.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-950 border border-blue-700 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                      <span>Appuyez sur le lien qui s'affiche pour ouvrir l'application dans Chrome.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-950 border border-blue-700 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                      <span>Appuyez sur la bannière <strong>« Installer »</strong> en bas de l'écran.</span>
                    </li>
                  </ol>

                  {/* Copy Link Option */}
                  <div className="pt-2">
                    <button
                      onClick={handleCopyLink}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400">Lien copié dans le presse-papier !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copier le lien direct pour l'envoyer sur mobile</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Android WebAPK Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-blue-400 mb-1.5 flex items-center gap-1.5 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sans Play Store</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Aucun compte développeur requis, installation directe sans passer par les restrictions du store.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-emerald-400 mb-1.5 flex items-center gap-1.5 font-bold text-xs">
                  <Zap className="w-4 h-4" />
                  <span>Mises à Jour Auto</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  L'application se met à jour en arrière-plan automatiquement dès qu'une amélioration est publiée.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-amber-400 mb-1.5 flex items-center gap-1.5 font-bold text-xs">
                  <Volume2 className="w-4 h-4" />
                  <span>Haut-Parleur & Micro</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Accès complet au micro et haut-parleur avec réduction d'écho et suppression du bruit de fond.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FONCTIONNALITÉS ANDROID DÉBLOQUÉES */}
        {activeTab === 'features' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Expérience Native Android Complète</span>
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Une fois installée sur votre smartphone Android, VoxCall se comporte exactement comme une application téléchargée sur le Play Store :
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="font-bold text-white text-xs mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Mode Plein Écran (Standalone)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Aucune barre d'adresse de navigateur, barre de statut immersive couleur `#0b0f19`.
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="font-bold text-white text-xs mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Raccourcis Appui Long</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Maintenez l'icône de l'app sur votre écran d'accueil pour lancer directement un appel ou l'interphone.
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="font-bold text-white text-xs mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Maintien en Éveil (Screen Wake Lock)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    L'écran ne s'éteint pas pendant vos conversations téléphoniques actives.
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="font-bold text-white text-xs mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Vibration & Sonnerie Haptique</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Détection de sonnerie et vibrations téléphoniques natives lors des appels entrants.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-3.5 flex items-start gap-2.5 text-amber-200">
              <Volume2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-100">Rappel pour les appels téléphoniques GSM/WhatsApp :</strong>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  Pour traduire une conversation avec une personne au bout du fil, activez simplement le <strong>Haut-Parleur</strong> de votre téléphone. VoxCall capte sa voix en direct et diffuse la vôtre traduite.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PACKAGING APK (TWA / GOOGLE PLAY STORE) */}
        {activeTab === 'apk' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-400" />
                  <span>Génération de fichier APK autonome (Trusted Web Activity)</span>
                </h4>
                <span className="text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">
                  Android Studio / TWA
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Si vous désirez un fichier d'installation physique <strong className="text-white">.APK</strong> ou publier l'application sur le <strong className="text-white">Google Play Store</strong>, vous pouvez l'empaqueter en 1 clic grâce aux outils officiels Google :
              </p>

              {/* Steps to get APK via PWABuilder */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="font-bold text-white text-xs flex items-center justify-between">
                  <span>Méthode 1 : PWABuilder (Recommandé par Google & Microsoft)</span>
                  <span className="text-[10px] text-emerald-400 font-normal">Sans code</span>
                </div>
                <ol className="space-y-2 list-decimal pl-4 text-slate-400">
                  <li>
                    Rendez-vous sur <a href="https://www.pwabuilder.com" target="_blank" rel="noreferrer" className="text-blue-400 underline font-semibold">pwabuilder.com</a>.
                  </li>
                  <li>
                    Entrez l'URL de l'application : <code className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-200 font-mono text-[10px]">{appUrl}</code>.
                  </li>
                  <li>
                    Cliquez sur <strong>« Package for Android »</strong> pour télécharger directement votre fichier <strong>.APK</strong> et le dossier prêt pour le Google Play Store !
                  </li>
                </ol>

                <button
                  onClick={handleCopyPWABuilderUrl}
                  className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-2 transition-colors mt-2"
                >
                  {copiedApkGuide ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Lien PWABuilder copié !</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Copier le lien PWABuilder pré-configuré</span>
                    </>
                  )}
                </button>
              </div>

              {/* Bubblewrap CLI Option */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
                <div className="font-bold text-white text-xs flex items-center justify-between">
                  <span>Méthode 2 : Bubblewrap CLI (Outil officiel Google Chrome)</span>
                  <span className="text-[10px] text-slate-400 font-mono font-normal">CLI / Développeur</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Générez un projet Android natif en ligne de commande :
                </p>
                <div className="bg-slate-900 p-2.5 rounded-lg font-mono text-[11px] text-emerald-300 overflow-x-auto">
                  npm install -g @bubblewrap/cli<br />
                  bubblewrap init --manifest={appUrl}/manifest.webmanifest<br />
                  bubblewrap build
                </div>
                <button
                  onClick={handleDownloadTwaManifest}
                  className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Télécharger le twa-manifest.json configuré</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            Package ID : app.voxcall.translate · Standalone
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
