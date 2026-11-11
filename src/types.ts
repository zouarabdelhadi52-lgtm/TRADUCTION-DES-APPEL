export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  bcp47: string;
  direction?: 'ltr' | 'rtl';
  samplePhrases: string[];
}

export interface TranscriptTurn {
  id: string;
  speaker: 'user' | 'contact';
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: string;
  timeSeconds: number;
  phonetic?: string;
  tone?: string;
  adaptationNote?: string;
}

export interface CallSummary {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  sentiment: string;
  keywords?: string[];
}

export interface CallRecord {
  id: string;
  contactName: string;
  contactNumber: string;
  contactAvatar?: string;
  callType: 'outgoing' | 'incoming';
  date: string;
  durationSeconds: number;
  durationFormatted: string;
  userLanguage: string;
  contactLanguage: string;
  transcript: TranscriptTurn[];
  summary?: CallSummary;
  audioUrl?: string; // Data URL or audio blob url
  hasAudioRecording: boolean;
  notes?: string;
  status: 'completed' | 'missed' | 'rejected';
}

export interface AudioSettings {
  autoSpeak: boolean;
  speechRate: number; // 0.8 - 1.4
  speechPitch: number; // 0.8 - 1.2
  speechVolume: number; // 0 - 1
  noiseSuppression: boolean;
  echoCancellation: boolean;
  soundEffects: boolean; // DTMF tones, call rings
  showPhonetics: boolean;
}
