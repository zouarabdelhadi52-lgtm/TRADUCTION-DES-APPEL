// Helper for Web Speech Recognition API

// Type declaration for browser SpeechRecognition
interface IWindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as IWindowWithSpeech;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export class SpeechRecognitionManager {
  private recognition: any = null;
  private isListening = false;
  private currentLanguage = 'fr-FR';

  constructor(
    private onInterim: (text: string) => void,
    private onFinal: (text: string) => void,
    private onError: (err: string) => void,
    private onEnd: () => void
  ) {}

  start(bcp47Lang: string): boolean {
    if (!isSpeechRecognitionSupported()) {
      this.onError('La reconnaissance vocale Web Speech n\'est pas disponible dans ce navigateur. Utilisez la saisie vocale assistée.');
      return false;
    }

    this.stop();

    try {
      const win = window as IWindowWithSpeech;
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionClass();

      this.currentLanguage = bcp47Lang;
      this.recognition.lang = bcp47Lang;
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = item[0].transcript;
          if (item.isFinal) {
            if (text.trim()) {
              this.onFinal(text.trim());
            }
          } else {
            interimTranscript += text;
          }
        }
        if (interimTranscript) {
          this.onInterim(interimTranscript);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'not-allowed') {
          this.onError('Microphone bloqué : veuillez autoriser l\'accès au micro dans votre navigateur.');
        } else if (event.error === 'no-speech') {
          // Normal silence, ignore
        } else {
          this.onError(`Erreur audio: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onEnd();
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      console.warn('Error starting speech recognition:', err);
      this.onError(err?.message || 'Erreur d\'initialisation du micro');
      return false;
    }
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }
    this.isListening = false;
  }

  isActive(): boolean {
    return this.isListening;
  }
}
