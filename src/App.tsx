import React from 'react';
import { Header } from './components/Header';
import { CalendarView } from './components/CalendarView';
import { ReservationWizard } from './components/ReservationWizard';
import { ArchivedView } from './components/ArchivedView';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { TutorialModal } from './components/TutorialModal';
import { SettingsModal } from './components/SettingsModal';
import { Reservation, AccessibilitySettings, WhatsAppConfig, WeeklySchedule } from './types';
import { 
  subscribeReservations, 
  subscribeWeeklySchedules,
  loadAccessibilitySettings, 
  loadWhatsAppConfig
} from './utils/storage';
import { speakText } from './utils/speech';

export default function App() {
  const [reservations, setReservations] = React.useState<Reservation[]>([]);
  const [weeklySchedules, setWeeklySchedules] = React.useState<WeeklySchedule[]>([]);
  const [accessibility, setAccessibility] = React.useState<AccessibilitySettings>(loadAccessibilitySettings());
  const [whatsAppConfig, setWhatsAppConfig] = React.useState<WhatsAppConfig>(loadWhatsAppConfig());

  const [activeTab, setActiveTab] = React.useState<'calendar' | 'wizard' | 'archived'>('calendar');

  // Modals
  const [isVoiceOpen, setIsVoiceOpen] = React.useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  // Load and subscribe to real-time Firestore reservations and weekly schedules
  React.useEffect(() => {
    const unsubscribeRes = subscribeReservations((data) => {
      setReservations(data);
    });

    const unsubscribeSchedules = subscribeWeeklySchedules((data) => {
      setWeeklySchedules(data);
    });

    // Check on first visit if tutorial was seen
    const tutorialSeen = localStorage.getItem('kingdom_hall_tutorial_seen');
    if (!tutorialSeen) {
      setIsTutorialOpen(true);
      localStorage.setItem('kingdom_hall_tutorial_seen', 'true');
    }

    return () => {
      unsubscribeRes();
      unsubscribeSchedules();
    };
  }, []);


  // Handle voice commands
  const handleVoiceCommand = (command: string) => {
    if (command === 'agendar') {
      setActiveTab('wizard');
    } else if (command === 'tutorial') {
      setIsTutorialOpen(true);
    } else if (command === 'inicio') {
      setActiveTab('calendar');
    } else if (command === 'historico') {
      setActiveTab('archived');
    } else if (command === 'fonte') {
      setAccessibility(prev => {
        const nextSize = prev.fontSize === 'normal' ? 'large' : prev.fontSize === 'large' ? 'extra-large' : 'normal';
        return { ...prev, fontSize: nextSize };
      });
    } else if (command === 'contraste') {
      setAccessibility(prev => ({ ...prev, highContrast: !prev.highContrast }));
    } else if (command === 'ouvir') {
      const text = `Você está no aplicativo de Reservas do Salão do Reino Juparanã. Aba de navegação atual: ${
        activeTab === 'calendar' ? 'Ver agendamentos' : activeTab === 'wizard' ? 'Novo agendamento' : 'Histórico arquivado'
      }.`;
      speakText(text, accessibility.speechSpeed);
    }
  };

  const handleWizardComplete = (newRes: Reservation) => {
    setActiveTab('calendar');
  };

  const activeCount = reservations.filter(r => r.status === 'active').length;
  const archivedCount = reservations.filter(r => r.status === 'archived').length;

  return (
    <div className={`min-h-screen font-size-${accessibility.fontSize} ${accessibility.highContrast ? 'high-contrast' : ''}`}>
      {/* Accessible Header & Navigation */}
      <Header
        accessibility={accessibility}
        setAccessibility={setAccessibility}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeCount={activeCount}
        archivedCount={archivedCount}
      />

      {/* Main Content Body */}
      <main className="pb-16">
        {activeTab === 'calendar' && (
          <CalendarView
            reservations={reservations}
            weeklySchedules={weeklySchedules}
            onRefresh={() => {}}
            onOpenWizard={() => setActiveTab('wizard')}
            onOpenSettings={() => setIsSettingsOpen(true)}
            speechSpeed={accessibility.speechSpeed}
            whatsAppConfig={whatsAppConfig}
          />
        )}

        {activeTab === 'wizard' && (
          <ReservationWizard
            reservations={reservations}
            weeklySchedules={weeklySchedules}
            onComplete={handleWizardComplete}
            onCancel={() => setActiveTab('calendar')}
            speechSpeed={accessibility.speechSpeed}
            whatsAppConfig={whatsAppConfig}
          />
        )}

        {activeTab === 'archived' && (
          <ArchivedView
            reservations={reservations}
            onRefresh={() => {}}
            speechSpeed={accessibility.speechSpeed}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-6 text-center text-sm border-t-4 border-amber-500 no-print">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-extrabold text-slate-200">
            Gerenciador de Agendamentos do Salão do Reino - Juparanã
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Uso compartilhado entre Congregações, Grupos e Comissões. Projetado com Acessibilidade Total.
          </p>
        </div>
      </footer>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onCommand={handleVoiceCommand}
        speechSpeed={accessibility.speechSpeed}
      />

      {/* Tutorial / Onboarding Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        speechSpeed={accessibility.speechSpeed}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        accessibility={accessibility}
        setAccessibility={setAccessibility}
        whatsAppConfig={whatsAppConfig}
        setWhatsAppConfig={setWhatsAppConfig}
        weeklySchedules={weeklySchedules}
        onRefreshData={() => {}}
      />
    </div>
  );
}
