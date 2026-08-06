import React from 'react';
import { Mic, MicOff, Volume2, X, Check, HelpCircle, AlertCircle } from 'lucide-react';
import { createSpeechRecognizer, speakText, stopSpeaking } from '../utils/speech';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand: (command: string) => void;
  speechSpeed: number;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onCommand,
  speechSpeed,
}) => {
  const [isListening, setIsListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState('');
  const [statusMessage, setStatusMessage] = React.useState('Clique no microfone para falar');
  const [lastCommand, setLastCommand] = React.useState<string | null>(null);

  const recognizerRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!isOpen) {
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch {}
      }
      setIsListening(false);
      setTranscript('');
      setLastCommand(null);
      return;
    }

    // Greet user on opening voice modal
    speakText('Assistente de Voz ativado. Diga por exemplo: Agendar, Calendário, ou Ajuda.', speechSpeed);

    const recognizer = createSpeechRecognizer({
      onStart: () => {
        setIsListening(true);
        setStatusMessage('Ouvindo... Pode falar agora.');
      },
      onResult: (text, isFinal) => {
        setTranscript(text);
      },
      onCommandMatch: (cmd) => {
        setLastCommand(cmd);
        setStatusMessage(`Comando reconhecido: "${cmd.toUpperCase()}"!`);
        
        let confirmText = 'Comando processado.';
        if (cmd === 'agendar') confirmText = 'Abrindo novo agendamento.';
        if (cmd === 'tutorial') confirmText = 'Abrindo tutorial de ajuda.';
        if (cmd === 'inicio') confirmText = 'Voltando para o início.';
        if (cmd === 'historico') confirmText = 'Exibindo histórico arquivado.';

        speakText(confirmText, speechSpeed);

        setTimeout(() => {
          onCommand(cmd);
          onClose();
        }, 1200);
      },
      onError: (err) => {
        setIsListening(false);
        setStatusMessage('Não foi possível ouvir com clareza. Tente novamente.');
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    recognizerRef.current = recognizer;

    if (recognizer) {
      try {
        recognizer.start();
      } catch (e) {
        console.error(e);
      }
    } else {
      setStatusMessage('O navegador atual não suporta voz ativamente. Use os botões da tela.');
    }

    return () => {
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch {}
      }
    };
  }, [isOpen]);

  const toggleListening = () => {
    if (isListening) {
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch {}
      }
      setIsListening(false);
      setStatusMessage('Microfone pausado.');
    } else {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.start();
        } catch {
          // Re-create if ended
        }
      }
    }
  };

  const handleSimulatedCommand = (cmd: string) => {
    speakText(`Executando comando ${cmd}`, speechSpeed);
    onCommand(cmd);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-4 border-amber-400 text-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-300 p-3 rounded-full border-2 border-slate-600 focus:ring-4 focus:ring-amber-400"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-4 py-1.5 rounded-full text-sm font-black border border-amber-500/40 mb-2">
            <Mic className="w-4 h-4" />
            Navegação por Comando de Voz
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-amber-400">
            Fale com o Aplicativo
          </h2>
          <p className="text-slate-300 text-base mt-1">
            Diga o que deseja fazer de forma simples e direta
          </p>
        </div>

        {/* Mic Pulse Center Visual */}
        <div className="flex flex-col items-center justify-center my-6">
          <button
            onClick={toggleListening}
            className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center transition-all border-4 shadow-2xl focus:ring-8 focus:ring-amber-400 ${
              isListening
                ? 'bg-emerald-500 text-slate-950 border-emerald-300 animate-mic-pulse scale-105'
                : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700'
            }`}
          >
            {isListening ? (
              <Mic className="w-14 h-14" />
            ) : (
              <MicOff className="w-14 h-14" />
            )}
          </button>

          <p className="mt-4 text-center font-extrabold text-lg text-amber-300">
            {statusMessage}
          </p>

          {transcript && (
            <div className="mt-3 bg-slate-800/90 border-2 border-slate-700 rounded-2xl p-4 w-full text-center">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-1">
                Texto Ouvido:
              </span>
              <p className="text-xl font-black text-white italic">
                "{transcript}"
              </p>
            </div>
          )}
        </div>

        {/* Suggested Verbal Commands */}
        <div className="mt-6 pt-4 border-t border-slate-800">
          <p className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            Exemplos de Comandos (você pode falar ou clicar abaixo):
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handleSimulatedCommand('agendar')}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-extrabold rounded-xl border-2 border-slate-700 text-left text-sm flex items-center justify-between"
            >
              <span>"AGENDAR"</span>
              <Check className="w-4 h-4 opacity-70" />
            </button>

            <button
              onClick={() => handleSimulatedCommand('tutorial')}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-sky-300 font-extrabold rounded-xl border-2 border-slate-700 text-left text-sm flex items-center justify-between"
            >
              <span>"AJUDA / TUTORIAL"</span>
              <Check className="w-4 h-4 opacity-70" />
            </button>

            <button
              onClick={() => handleSimulatedCommand('inicio')}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-extrabold rounded-xl border-2 border-slate-700 text-left text-sm flex items-center justify-between"
            >
              <span>"INÍCIO / CALENDÁRIO"</span>
              <Check className="w-4 h-4 opacity-70" />
            </button>

            <button
              onClick={() => handleSimulatedCommand('historico')}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-purple-300 font-extrabold rounded-xl border-2 border-slate-700 text-left text-sm flex items-center justify-between"
            >
              <span>"HISTÓRICO"</span>
              <Check className="w-4 h-4 opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
