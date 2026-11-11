import React, { useState } from 'react';
import { Phone, Delete, Globe, User, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '../data/languages';
import { playDtmfTone } from '../utils/audioTelephony';

interface DialerPanelProps {
  onStartCall: (params: {
    contactName: string;
    contactNumber: string;
    userLang: string;
    contactLang: string;
    scenario?: string;
  }) => void;
  userLang: string;
  contactLang: string;
  setUserLang: (lang: string) => void;
  setContactLang: (lang: string) => void;
}

const PRESET_CONTACTS = [
  {
    name: 'Mehdi Benjelloun',
    number: '+212 5 22 40 50 60',
    lang: 'ary',
    role: 'Logistique & Transit · Casablanca',
    scenario: 'Dédouanement & Fret Port Tanger Med',
  },
  {
    name: 'Fatima-Zahra Alami',
    number: '+212 6 61 78 90 12',
    lang: 'ary',
    role: 'Relations Partenaires · Marrakech',
    scenario: 'Négociation commerciale et partenariats Maroc',
  },
  {
    name: 'Kenji Takahashi',
    number: '+81 3 5555 0192',
    lang: 'ja',
    role: 'Logistique Export · Tokyo',
    scenario: 'Coordination maritime & fret Tokyo',
  },
  {
    name: 'Sarah Jenkins',
    number: '+44 20 7946 0831',
    lang: 'en',
    role: 'Lead Architecte · Londres',
    scenario: 'Architecture cloud & support API',
  },
  {
    name: 'Elena Rossi',
    number: '+39 06 6987 4120',
    lang: 'it',
    role: 'Conciergerie · Rome',
    scenario: 'Réservation de suite et navette privée',
  },
  {
    name: 'Mateo Fernández',
    number: '+34 91 123 4567',
    lang: 'es',
    role: 'Directeur Commercial · Madrid',
    scenario: 'Négociation contrat de distribution',
  },
  {
    name: 'Youssef Al-Mansoor',
    number: '+971 4 312 0000',
    lang: 'ar',
    role: 'Partenaire Import · Dubaï',
    scenario: 'Approvisionnement & logistique Émirats',
  },
];

export const DialerPanel: React.FC<DialerPanelProps> = ({
  onStartCall,
  userLang,
  contactLang,
  setUserLang,
  setContactLang,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('+212 5 22 40 50 60');
  const [contactName, setContactName] = useState('Mehdi Benjelloun');
  const [scenario, setScenario] = useState('Dédouanement & Fret Port Tanger Med');

  const dialButtons = [
    { digit: '1', sub: '' },
    { digit: '2', sub: 'ABC' },
    { digit: '3', sub: 'DEF' },
    { digit: '4', sub: 'GHI' },
    { digit: '5', sub: 'JKL' },
    { digit: '6', sub: 'MNO' },
    { digit: '7', sub: 'PQRS' },
    { digit: '8', sub: 'TUV' },
    { digit: '9', sub: 'WXYZ' },
    { digit: '*', sub: '' },
    { digit: '0', sub: '+' },
    { digit: '#', sub: '' },
  ];

  const handleDigitPress = (digit: string) => {
    playDtmfTone(digit);
    setPhoneNumber((prev) => prev + digit);
  };

  const handleDeleteDigit = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleSelectContact = (c: typeof PRESET_CONTACTS[0]) => {
    setContactName(c.name);
    setPhoneNumber(c.number);
    setContactLang(c.lang);
    setScenario(c.scenario);
  };

  const handleCall = () => {
    onStartCall({
      contactName: contactName || 'Correspondant',
      contactNumber: phoneNumber || '+33 1 00 00 00 00',
      userLang,
      contactLang,
      scenario,
    });
  };

  const currentContactLangObj = getLanguageByCode(contactLang);
  const currentUserLangObj = getLanguageByCode(userLang);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Title & Language pair bar */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          Poste Téléphonique avec Traduction Vocale Instantanée
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Passez un appel téléphonique multilingue en temps réel. Chaque mot prononcé est
          traduit instantanément par IA et prononcé dans l'oreille de votre interlocuteur.
        </p>
      </div>

      {/* Language Pair Selector Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 mb-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* User Language */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Votre Langue (Appelant)</span>
            </label>
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2.5">
              <span className="text-xl" role="img" aria-label="user language flag">
                {currentUserLangObj.flag}
              </span>
              <select
                value={userLang}
                onChange={(e) => setUserLang(e.target.value)}
                className="bg-transparent text-white font-medium text-sm w-full focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Language */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Langue du Correspondant</span>
            </label>
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2.5">
              <span className="text-xl" role="img" aria-label="contact language flag">
                {currentContactLangObj.flag}
              </span>
              <select
                value={contactLang}
                onChange={(e) => setContactLang(e.target.value)}
                className="bg-transparent text-white font-medium text-sm w-full focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Phone dialpad */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col items-center">
          {/* Phone Display */}
          <div className="w-full mb-6">
            <div className="text-xs text-slate-400 font-medium mb-1 flex items-center justify-between">
              <span>Numéro à appeler</span>
              <span className="text-slate-500 font-mono text-[11px]">Fréquences DTMF actives</span>
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+33..."
                className="w-full bg-slate-950 border border-slate-800 text-white text-xl font-mono tracking-wider rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 text-center"
              />
              {phoneNumber.length > 0 && (
                <button
                  onClick={handleDeleteDigit}
                  aria-label="Effacer un chiffre"
                  className="absolute right-3 p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <Delete className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="mt-3">
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Nom du contact (optionnel)"
                className="w-full bg-slate-950/60 border border-slate-800/80 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Keypad Grid (3 x 4) */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mb-6">
            {dialButtons.map((btn) => (
              <button
                key={btn.digit}
                type="button"
                onClick={() => handleDigitPress(btn.digit)}
                className="h-16 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 active:scale-95 border border-slate-700/50 flex flex-col items-center justify-center transition-all shadow-sm group"
              >
                <span className="text-xl font-semibold text-white font-mono group-hover:text-blue-300">
                  {btn.digit}
                </span>
                {btn.sub ? (
                  <span className="text-[10px] font-medium tracking-widest text-slate-400">
                    {btn.sub}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {/* Big Call Button */}
          <button
            onClick={handleCall}
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-semibold flex items-center justify-center gap-3 shadow-lg shadow-emerald-950/50 transition-all text-base"
          >
            <Phone className="w-5 h-5 fill-current" />
            <span>Appeler avec Traduction en Direct</span>
          </button>
        </div>

        {/* Right Column: Fast Contacts & Scenarios */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick Contacts */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <span>Contacts Fréquents & Lignes Internationales</span>
              </h2>
              <span className="text-xs text-slate-500">Un clic pour composer</span>
            </div>

            <div className="space-y-2.5">
              {PRESET_CONTACTS.map((c) => {
                const langObj = getLanguageByCode(c.lang);
                const isSelected = contactNumberMatch(phoneNumber, c.number);

                return (
                  <div
                    key={c.number}
                    onClick={() => handleSelectContact(c)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-600/60'
                        : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-blue-400">
                        {c.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{c.name}</span>
                          <span className="text-xs text-slate-400">· {c.role}</span>
                        </div>
                        <div className="text-xs font-mono text-slate-400 mt-0.5">
                          {c.number}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60">
                        <span>{langObj.flag}</span>
                        <span>{langObj.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectContact(c);
                          handleCall();
                        }}
                        aria-label={`Appeler ${c.name}`}
                        className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simulation & Context Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Contexte & Scénario d'Appel (Guidage IA)</span>
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              Le contexte aide le modèle Gemini à choisir le vocabulaire technique adéquat
              et permet au simulateur d'interlocuteur de répondre de manière réaliste si vous testez seul.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                'Dédouanement & Fret Port Tanger Med',
                'Coordination maritime & fret Tokyo',
                'Architecture cloud & support API',
                'Réservation de suite et navette privée',
                'Négociation contrat de distribution',
                'Urgence médicale et pharmacie de garde',
                'Conversation libre & amicale',
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setScenario(s)}
                  className={`text-left text-xs p-2.5 rounded-lg border transition-colors ${
                    scenario === s
                      ? 'bg-blue-900/30 border-blue-500 text-blue-200 font-medium'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function contactNumberMatch(a: string, b: string) {
  return a.replace(/\s+/g, '') === b.replace(/\s+/g, '');
}
