import React from 'react';
import { 
  Mic, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  HelpCircle, 
  Settings, 
  PlusCircle, 
  Calendar as CalendarIcon, 
  Archive,
  Type,
  Phone
} from 'lucide-react';
import { AccessibilitySettings } from '../types';
import { isSpeaking, stopSpeaking, speakText } from '../utils/speech';

interface HeaderProps {
  accessibility: AccessibilitySettings;
  setAccessibility: React.Dispatch<React.SetStateAction<AccessibilitySettings>>;
  onOpenVoice: () => void;
  onOpenTutorial: () => void;
  onOpenSettings: () => void;
  activeTab: 'calendar' | 'wizard' | 'archived';
  setActiveTab: (tab: 'calendar' | 'wizard' | 'archived') => void;
  activeCount: number;
  archivedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  accessibility,
  setAccessibility,
  onOpenVoice,
  onOpenTutorial,
  onOpenSettings,
  activeTab,
  setActiveTab,
  activeCount,
  archivedCount,
}) => {
  const [speaking, setSpeaking] = React.useState(false);

  // Check speech state periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      setSpeaking(isSpeaking());
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const toggleSpeakingCurrentHeader = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      const textToSpeak = `Bem-vindo ao Gerenciador de Reservas do Salão do Reino das Testemunhas de Jeová, Congregação Juparanã. Você tem ${activeCount} agendamentos ativos. Use os botões grandes para agendar, ver calendário ou ouvir as opções.`;
      speakText(textToSpeak, accessibility.speechSpeed, () => setSpeaking(false));
      setSpeaking(true);
    }
  };

  const cycleFontSize = () => {
    const sizes: Array<'normal' | 'large' | 'extra-large'> = ['normal', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(accessibility.fontSize);
    const nextSize = sizes[(currentIndex + 1) % sizes.length];
    setAccessibility(prev => ({ ...prev, fontSize: nextSize }));
    
    const labels = {
      'normal': 'Tamanho de fonte normal ativado',
      'large': 'Tamanho de fonte grande ativado',
      'extra-large': 'Tamanho de fonte muito grande ativado'
    };
    speakText(labels[nextSize], accessibility.speechSpeed);
  };

  const toggleHighContrast = () => {
    const next = !accessibility.highContrast;
    setAccessibility(prev => ({ ...prev, highContrast: next }));
    speakText(next ? 'Modo de Alto Contraste ativado' : 'Modo de Alto Contraste desativado', accessibility.speechSpeed);
  };

  const todayStr = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <header className="bg-slate-900 text-white border-b-4 border-amber-500 shadow-md no-print sticky top-0 z-30">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Title & Location */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="bg-amber-500 text-slate-950 font-extrabold text-xs sm:text-sm px-2.5 py-1 rounded-md tracking-wider uppercase">
                Acessibilidade Total
              </span>
              <span className="text-slate-300 text-sm hidden sm:inline capitalize">
                {todayStr}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 text-amber-400">
              Salão do Reino Juparanã
            </h1>
            <p className="text-slate-300 text-sm sm:text-base font-medium">
              Agendamento de Uso das Congregações e Comissões
            </p>
          </div>

          {/* Accessibility Quick Actions */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {/* Audio Reader Toggle */}
            <button
              onClick={toggleSpeakingCurrentHeader}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all border-2 shadow-sm ${
                speaking 
                  ? 'bg-amber-500 text-slate-950 border-amber-300 animate-pulse' 
                  : 'bg-slate-800 text-slate-100 hover:bg-slate-700 border-slate-600'
              }`}
              title="Ouvir instruções em voz alta"
            >
              {speaking ? <VolumeX className="w-5 h-5 text-slate-950" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
              <span>{speaking ? 'Parar Voz' : 'Ouvir Tela'}</span>
            </button>

            {/* Voice Command Button */}
            <button
              onClick={onOpenVoice}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm border-2 border-emerald-400 shadow-sm transition-all"
              title="Comandos por Voz"
            >
              <Mic className="w-5 h-5 text-emerald-200" />
              <span>Falar Comando</span>
            </button>

            {/* Font Size Button */}
            <button
              onClick={cycleFontSize}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold text-sm border-2 border-slate-600 transition-all"
              title="Mudar Tamanho da Fonte"
            >
              <Type className="w-4 h-4 text-amber-400" />
              <span className="text-xs uppercase font-extrabold">{accessibility.fontSize === 'normal' ? 'A' : accessibility.fontSize === 'large' ? 'A+' : 'A++'}</span>
            </button>

            {/* High Contrast Button */}
            <button
              onClick={toggleHighContrast}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold border-2 border-slate-600 transition-all"
              title="Alternar Alto Contraste"
            >
              {accessibility.highContrast ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5 text-slate-300" />}
            </button>

            {/* Tutorial Button */}
            <button
              onClick={onOpenTutorial}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-sky-700 hover:bg-sky-600 text-white rounded-xl font-bold text-sm border-2 border-sky-400 shadow-sm transition-all"
              title="Como usar o aplicativo"
            >
              <HelpCircle className="w-5 h-5 text-sky-200" />
              <span className="hidden sm:inline">Ajuda</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border-2 border-slate-600 transition-all"
              title="Configurações"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Navigation Tabs - Very Large & High Contrast */}
        <nav className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-center sm:justify-start gap-3">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-extrabold text-base sm:text-lg transition-all border-2 ${
              activeTab === 'calendar'
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg scale-[1.02]'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <CalendarIcon className="w-6 h-6" />
            <span>Ver Agendamentos</span>
            <span className={`ml-1 text-xs px-2.5 py-0.5 rounded-full font-black ${
              activeTab === 'calendar' ? 'bg-slate-950 text-amber-300' : 'bg-slate-700 text-slate-200'
            }`}>
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('wizard')}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-black text-base sm:text-lg transition-all border-2 ${
              activeTab === 'wizard'
                ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-lg scale-[1.02]'
                : 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-500'
            }`}
          >
            <PlusCircle className="w-6 h-6 text-emerald-950" />
            <span>Fazer Novo Agendamento</span>
          </button>

          <button
            onClick={() => setActiveTab('archived')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-sm sm:text-base transition-all border-2 ${
              activeTab === 'archived'
                ? 'bg-slate-700 text-white border-slate-400 shadow'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <Archive className="w-5 h-5 text-slate-400" />
            <span>Histórico Arquivado</span>
            {archivedCount > 0 && (
              <span className="ml-1 text-xs bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                {archivedCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
