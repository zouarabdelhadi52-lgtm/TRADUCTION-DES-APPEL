/**
 * Telephony Web Audio and Speech Synthesis helper
 */

// DTMF standard frequency map (Row Hz, Col Hz)
const DTMF_FREQUENCIES: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477],
};

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play standard DTMF touch-tone phone frequencies
 */
export function playDtmfTone(char: string, durationMs = 130): void {
  try {
    const freqs = DTMF_FREQUENCIES[char];
    if (!freqs) return;

    const ctx = getAudioContext();
    const [f1, f2] = freqs;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.frequency.setValueAtTime(f1, ctx.currentTime);
    osc2.frequency.setValueAtTime(f2, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + durationMs / 1000);
    osc2.stop(ctx.currentTime + durationMs / 1000);
  } catch (err) {
    console.debug('DTMF audio not available:', err);
  }
}

/**
 * Play telephone ringback tone (European / International style)
 */
let ringInterval: number | null = null;
export function startRingingTone(): void {
  stopRingingTone();
  try {
    const playRingCycle = () => {
      const ctx = getAudioContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.setValueAtTime(425, ctx.currentTime);
      osc2.frequency.setValueAtTime(475, ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + 1.0);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.2);
      osc2.stop(ctx.currentTime + 1.2);
    };

    playRingCycle();
    ringInterval = window.setInterval(playRingCycle, 3000);
  } catch (err) {
    console.debug('Ring audio error:', err);
  }
}

export function stopRingingTone(): void {
  if (ringInterval !== null) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
}

/**
 * Play telephone call connect tone
 */
export function playCallConnectedTone(): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

/**
 * Play telephone call end tone (busy signal)
 */
export function playCallEndedTone(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(480, now + i * 0.25);
      gain.gain.setValueAtTime(0.1, now + i * 0.25);
      gain.gain.setValueAtTime(0.001, now + i * 0.25 + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.25);
      osc.stop(now + i * 0.25 + 0.15);
    }
  } catch {
    // Ignore
  }
}

/**
 * Web Speech API Text-to-Speech (Instant voice synthesis)
 */
export function speakTranslatedText(
  text: string,
  bcp47Lang: string,
  options?: { rate?: number; pitch?: number; volume?: number; onEnd?: () => void }
): SpeechSynthesisUtterance | null {
  if (!('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported in this browser.');
    return null;
  }

  window.speechSynthesis.cancel(); // Stop any pending speech

  if (!text || !text.trim()) return null;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = bcp47Lang;
  utterance.rate = options?.rate ?? 1.0;
  utterance.pitch = options?.pitch ?? 1.0;
  utterance.volume = options?.volume ?? 1.0;

  // Attempt to select native matching voice
  const voices = window.speechSynthesis.getVoices();
  const matchingVoice =
    voices.find((v) => v.lang.toLowerCase() === bcp47Lang.toLowerCase()) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(bcp47Lang.split('-')[0].toLowerCase()));

  if (matchingVoice) {
    utterance.voice = matchingVoice;
  }

  if (options?.onEnd) {
    utterance.onend = options.onEnd;
    utterance.onerror = () => options.onEnd?.();
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * MediaRecorder helper for Call Recording
 */
export class CallAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(existingStream?: MediaStream): Promise<boolean> {
    try {
      this.audioChunks = [];
      if (existingStream) {
        this.stream = existingStream;
      } else {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : '';

      this.mediaRecorder = mimeType
        ? new MediaRecorder(this.stream, { mimeType })
        : new MediaRecorder(this.stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(250); // collect in 250ms chunks
      return true;
    } catch (err) {
      console.warn('CallAudioRecorder start error:', err);
      return false;
    }
  }

  async stop(): Promise<{ blob: Blob | null; dataUrl: string | null }> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve({ blob: null, dataUrl: null });
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ blob, dataUrl: reader.result as string });
        };
        reader.onerror = () => {
          resolve({ blob, dataUrl: null });
        };
        reader.readAsDataURL(blob);
      };

      this.mediaRecorder.stop();
    });
  }
}
