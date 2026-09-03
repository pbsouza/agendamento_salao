import React from 'react';
import { 
  Sun, 
  Moon, 
  HelpCircle, 
  Settings, 
  PlusCircle, 
  Calendar as CalendarIcon, 
  Archive,
  Type,
  Building2
} from 'lucide-react';
import { AccessibilitySettings } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  accessibility: AccessibilitySettings;
  setAccessibility: React.Dispatch<React.SetStateAction<AccessibilitySettings>>;
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
  onOpenTutorial,
  onOpenSettings,
  activeTab,
  setActiveTab,
  activeCount,
  archivedCount,
}) => {
  const cycleFontSize = () => {
    const sizes: Array<'normal' | 'large' | 'extra-large'> = ['normal', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(accessibility.fontSize);
    const nextSize = sizes[(currentIndex + 1) % sizes.length];
    setAccessibility(prev => ({ ...prev, fontSize: nextSize }));
  };

  const toggleHighContrast = () => {
    setAccessibility(prev => ({ ...prev, highContrast: !prev.highContrast }));
  };

  return (
    <header className="bg-white text-slate-900 border-b border-slate-200 shadow-sm no-print sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main Header Bar */}
        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          {/* Section Title */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer" 
            onClick={() => setActiveTab('calendar')}
          >
            <div className="p-2 bg-slate-900 text-white rounded-lg shadow-sm">
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
                Calendário de Reservas
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Salão do Reino
              </p>
            </div>
          </div>

          {/* Quick Utility Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Font Size Button */}
            <button
              onClick={cycleFontSize}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-bold text-xs border border-slate-200 transition-all"
              title="Mudar Tamanho da Fonte"
            >
              <Type className="w-3.5 h-3.5 text-slate-600" />
              <span>{accessibility.fontSize === 'normal' ? 'A' : accessibility.fontSize === 'large' ? 'A+' : 'A++'}</span>
            </button>

            {/* High Contrast Button */}
            <button
              onClick={toggleHighContrast}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-all"
              title="Alternar Alto Contraste"
            >
              {accessibility.highContrast ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Tutorial Button */}
            <button
              onClick={onOpenTutorial}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-lg font-bold text-xs border border-sky-200 transition-all"
              title="Ajuda e Instruções"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">Ajuda</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs border border-slate-200 transition-all"
              title="Configurações e Dias Fixos"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Configurar</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="py-2.5 flex items-center justify-start sm:justify-end">
          <nav className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-0.5 sm:pb-0">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs sm:text-sm transition-all border ${
                activeTab === 'calendar'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Calendário</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === 'calendar' ? 'bg-slate-800 text-amber-300' : 'bg-slate-100 text-slate-600'
              }`}>
                {activeCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('wizard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs sm:text-sm transition-all border ${
                activeTab === 'wizard'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nova Reserva</span>
            </button>

            <button
              onClick={() => setActiveTab('archived')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm transition-all border ${
                activeTab === 'archived'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Archive className="w-3.5 h-3.5 text-slate-500" />
              <span>Arquivados</span>
              {archivedCount > 0 && (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full font-bold">
                  {archivedCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
