import React from 'react';
import { Header } from './components/Header';
import { CalendarView } from './components/CalendarView';
import { ReservationWizard } from './components/ReservationWizard';
import { ArchivedView } from './components/ArchivedView';
import { TutorialModal } from './components/TutorialModal';
import { SettingsModal } from './components/SettingsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Reservation, AccessibilitySettings, WhatsAppConfig, WeeklySchedule } from './types';
import { 
  subscribeReservations, 
  subscribeWeeklySchedules,
  loadAccessibilitySettings, 
  loadWhatsAppConfig
} from './utils/storage';

export default function App() {
  const [reservations, setReservations] = React.useState<Reservation[]>([]);
  const [weeklySchedules, setWeeklySchedules] = React.useState<WeeklySchedule[]>([]);
  const [accessibility, setAccessibility] = React.useState<AccessibilitySettings>(loadAccessibilitySettings());
  const [whatsAppConfig, setWhatsAppConfig] = React.useState<WhatsAppConfig>(loadWhatsAppConfig());

  const [activeTab, setActiveTab] = React.useState<'calendar' | 'wizard' | 'archived'>('calendar');
  const [wizardInitialDate, setWizardInitialDate] = React.useState<string | undefined>(undefined);

  // Modals
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

  const handleOpenWizard = (date?: string) => {
    setWizardInitialDate(date);
    setActiveTab('wizard');
  };

  const handleWizardComplete = () => {
    setWizardInitialDate(undefined);
    setActiveTab('calendar');
  };

  const activeCount = reservations.filter(r => r.status === 'active').length;
  const archivedCount = reservations.filter(r => r.status === 'archived').length;

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 font-size-${accessibility.fontSize} ${accessibility.highContrast ? 'high-contrast' : ''}`}>
      {/* Accessible Header & Navigation */}
      <Header
        accessibility={accessibility}
        setAccessibility={setAccessibility}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab !== 'wizard') setWizardInitialDate(undefined);
          setActiveTab(tab);
        }}
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
            onOpenWizard={handleOpenWizard}
            onOpenSettings={() => setIsSettingsOpen(true)}
            whatsAppConfig={whatsAppConfig}
          />
        )}

        {activeTab === 'wizard' && (
          <ReservationWizard
            reservations={reservations}
            weeklySchedules={weeklySchedules}
            onComplete={handleWizardComplete}
            onCancel={() => {
              setWizardInitialDate(undefined);
              setActiveTab('calendar');
            }}
            whatsAppConfig={whatsAppConfig}
            initialDate={wizardInitialDate}
          />
        )}

        {activeTab === 'archived' && (
          <ArchivedView
            reservations={reservations}
            onRefresh={() => {}}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white text-slate-500 py-6 text-center text-xs border-t border-slate-200 no-print">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-bold text-slate-700">
            Salão do Reino das Testemunhas de Jeová - Juparanã
          </p>
          <p className="text-slate-400 mt-0.5">
            Calendário oficial de agendamentos e uso compartilhado do salão.
          </p>
        </div>
      </footer>

      {/* Tutorial / Onboarding Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
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

      {/* PWA Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}
