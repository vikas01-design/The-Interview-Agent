// Web Speech API Helper for TTS (Text-to-Speech) and STT (Speech-to-Text)

export interface SpeakOptions {
  rate?: number
  pitch?: number
  muted?: boolean
  onStart?: () => void
  onEnd?: () => void
  onError?: (err: any) => void
}

export function speakQuestion(text: string, options: SpeakOptions = {}) {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.')
    options.onError?.('Speech synthesis not supported')
    return
  }

  stopSpeech()

  if (options.muted) {
    options.onEnd?.()
    return
  }

  // Clean text from markdown formatting before speaking
  const cleanText = text
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_~#]/g, '')
    .trim()

  const utterance = new SpeechSynthesisUtterance(cleanText)
  utterance.rate = options.rate ?? 1.0
  utterance.pitch = options.pitch ?? 1.0

  // Try selecting a natural English voice
  const voices = window.speechSynthesis.getVoices()
  const preferredVoice = voices.find(
    (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
  ) || voices.find((v) => v.lang.startsWith('en'))

  if (preferredVoice) {
    utterance.voice = preferredVoice
  }

  utterance.onstart = () => {
    options.onStart?.()
  }

  utterance.onend = () => {
    options.onEnd?.()
  }

  utterance.onerror = (e) => {
    console.error('Speech synthesis error:', e)
    options.onError?.(e)
  }

  window.speechSynthesis.speak(utterance)
}

export function stopSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

export function pauseSpeech() {
  if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause()
  }
}

export function resumeSpeech() {
  if ('speechSynthesis' in window && window.speechSynthesis.paused) {
    window.speechSynthesis.resume()
  }
}

// ----------------------------------------------------
// Speech Recognition (Speech-to-Text) Wrapper
// ----------------------------------------------------

export class SpeechRecognitionManager {
  private recognition: any = null
  private listening: boolean = false

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition()
      this.recognition.continuous = true
      this.recognition.interimResults = true
      this.recognition.lang = 'en-US'
    }
  }

  public isSupported(): boolean {
    return !!this.recognition
  }

  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void
  ) {
    if (!this.recognition) {
      onError('Speech recognition is not supported in this browser.')
      return
    }

    if (this.listening) return

    let finalTranscript = ''

    this.recognition.onresult = (event: any) => {
      let interimTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' '
        } else {
          interimTranscript += event.results[i][0].transcript
        }
      }

      const combined = (finalTranscript + interimTranscript).trim()
      onResult(combined, false)
    }

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      if (event.error === 'not-allowed') {
        onError('Microphone permission denied. Switch to text mode or enable mic.')
      } else {
        onError(`Speech recognition error: ${event.error}`)
      }
    }

    this.recognition.onend = () => {
      this.listening = false
    }

    try {
      this.recognition.start()
      this.listening = true
    } catch (err) {
      console.error('Error starting recognition:', err)
      onError('Could not start microphone recording.')
    }
  }

  public stopListening() {
    if (this.recognition && this.listening) {
      try {
        this.recognition.stop()
      } catch (err) {
        console.error('Error stopping recognition:', err)
      }
      this.listening = false
    }
  }
}
