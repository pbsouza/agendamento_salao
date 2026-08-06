// Text-to-Speech and Speech Recognition helper module

let currentUtterance: SpeechSynthesisUtterance | null = null;

const MONTH_NAMES_PT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

/**
 * Formats dates, times, and numbers into natural spoken Portuguese.
 * E.g., "08/08" -> "8 de agosto", "2026-08-08" -> "8 de agosto de 2026"
 */
export function formatTextForNaturalSpeech(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // Pattern 1: YYYY-MM-DD (e.g. 2026-08-08)
  cleaned = cleaned.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_, year, month, day) => {
    const dNum = parseInt(day, 10);
    const mNum = parseInt(month, 10);
    const monthName = MONTH_NAMES_PT[mNum - 1] || month;
    return `${dNum} de ${monthName} de ${year}`;
  });

  // Pattern 2: DD/MM/YYYY (e.g. 08/08/2026)
  cleaned = cleaned.replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, (_, day, month, year) => {
    const dNum = parseInt(day, 10);
    const mNum = parseInt(month, 10);
    const monthName = MONTH_NAMES_PT[mNum - 1] || month;
    return `${dNum} de ${monthName} de ${year}`;
  });

  // Pattern 3: DD/MM (e.g. 08/08)
  cleaned = cleaned.replace(/\b(\d{1,2})\/(\d{1,2})\b/g, (_, day, month) => {
    const dNum = parseInt(day, 10);
    const mNum = parseInt(month, 10);
    if (mNum >= 1 && mNum <= 12) {
      const monthName = MONTH_NAMES_PT[mNum - 1];
      return `${dNum} de ${monthName}`;
    }
    return `${dNum} sobre ${mNum}`;
  });

  // Pattern 4: "mês 08" or "mês 8" -> "mês de agosto"
  cleaned = cleaned.replace(/\bmês (0?[1-9]|1[0-2])\b/gi, (_, month) => {
    const mNum = parseInt(month, 10);
    const monthName = MONTH_NAMES_PT[mNum - 1];
    return monthName ? `mês de ${monthName}` : `mês ${mNum}`;
  });

  // Pattern 5: "dia 08" -> "dia 8"
  cleaned = cleaned.replace(/\bdia 0(\d)\b/gi, 'dia $1');

  // Fix possible duplicated "dia dia"
  cleaned = cleaned.replace(/\b(no\s+dia|dia)\s+dia\b/gi, '$1');

  // Pattern 6: Time format HH:MM e.g. 19:30 -> 19 horas e 30 minutos
  cleaned = cleaned.replace(/\b(\d{1,2}):(\d{2})\b/g, (_, hours, minutes) => {
    const hNum = parseInt(hours, 10);
    const mNum = parseInt(minutes, 10);
    if (mNum === 0) {
      return `${hNum} horas`;
    }
    return `${hNum} horas e ${mNum} minutos`;
  });

  return cleaned;
}

export function speakText(text: string, rate: number = 1.0, onEnd?: () => void) {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported on this browser.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Clean markdown or html tags if present
  let cleanText = text.replace(/[*_#`]/g, '').trim();
  if (!cleanText) return;

  // Transform dates and times into natural spoken Portuguese
  cleanText = formatTextForNaturalSpeech(cleanText);

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'pt-BR';
  utterance.rate = rate;

  // Find a Portuguese voice if available
  const voices = window.speechSynthesis.getVoices();
  const ptVoice = voices.find(v => v.lang.includes('pt') || v.lang.includes('PT'));
  if (ptVoice) {
    utterance.voice = ptVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

export function isSpeaking(): boolean {
  if ('speechSynthesis' in window) {
    return window.speechSynthesis.speaking;
  }
  return false;
}

// Speech Recognition API definition
export interface VoiceCommandListener {
  onStart: () => void;
  onResult: (transcript: string, isFinal: boolean) => void;
  onCommandMatch: (command: string) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

export function createSpeechRecognizer(listener: VoiceCommandListener) {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'pt-BR';

  recognition.onstart = () => {
    listener.onStart();
  };

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    const currentText = (finalTranscript || interimTranscript).toLowerCase().trim();
    listener.onResult(currentText, Boolean(finalTranscript));

    if (finalTranscript) {
      // Check matching commands
      if (
        currentText.includes('agendar') ||
        currentText.includes('reservar') ||
        currentText.includes('nova reserva') ||
        currentText.includes('novo agendamento')
      ) {
        listener.onCommandMatch('agendar');
      } else if (
        currentText.includes('ajuda') ||
        currentText.includes('tutorial') ||
        currentText.includes('como usar') ||
        currentText.includes('instruções')
      ) {
        listener.onCommandMatch('tutorial');
      } else if (
        currentText.includes('ouvir') ||
        currentText.includes('ler') ||
        currentText.includes('falar')
      ) {
        listener.onCommandMatch('ouvir');
      } else if (
        currentText.includes('voltar') ||
        currentText.includes('inicio') ||
        currentText.includes('início') ||
        currentText.includes('cancelar') ||
        currentText.includes('fechar')
      ) {
        listener.onCommandMatch('inicio');
      } else if (
        currentText.includes('histórico') ||
        currentText.includes('historico') ||
        currentText.includes('passadas') ||
        currentText.includes('arquivadas')
      ) {
        listener.onCommandMatch('historico');
      } else if (
        currentText.includes('whatsapp') ||
        currentText.includes('mensagem') ||
        currentText.includes('notificar')
      ) {
        listener.onCommandMatch('whatsapp');
      } else if (
        currentText.includes('aumentar') ||
        currentText.includes('fonte') ||
        currentText.includes('tamanho')
      ) {
        listener.onCommandMatch('fonte');
      } else if (
        currentText.includes('contraste') ||
        currentText.includes('alto contraste')
      ) {
        listener.onCommandMatch('contraste');
      }
    }
  };

  recognition.onerror = (event: any) => {
    listener.onError(event.error || 'Erro ao ouvir áudio.');
  };

  recognition.onend = () => {
    listener.onEnd();
  };

  return recognition;
}
