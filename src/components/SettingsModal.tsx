import React from 'react';
import { 
  X, 
  Settings, 
  Volume2, 
  Save, 
  RefreshCw, 
  MessageSquare, 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  Building2, 
  Sparkles,
  Info
} from 'lucide-react';
import { AccessibilitySettings, WhatsAppConfig, WeeklySchedule, EntityGroup, EventType } from '../types';
import { saveAccessibilitySettings, saveWhatsAppConfig, addWeeklySchedule, deleteWeeklySchedule } from '../utils/storage';
import { speakText } from '../utils/speech';
import { ENTITY_LIST, EVENT_TYPES } from '../data/entities';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessibility: AccessibilitySettings;
  setAccessibility: React.Dispatch<React.SetStateAction<AccessibilitySettings>>;
  whatsAppConfig: WhatsAppConfig;
  setWhatsAppConfig: React.Dispatch<React.SetStateAction<WhatsAppConfig>>;
  weeklySchedules: WeeklySchedule[];
  onRefreshData: () => void;
}

const DAYS_OF_WEEK = [
  { index: 0, label: 'Domingo' },
  { index: 1, label: 'Segunda-feira' },
  { index: 2, label: 'Terça-feira' },
  { index: 3, label: 'Quarta-feira' },
  { index: 4, label: 'Quinta-feira' },
  { index: 5, label: 'Sexta-feira' },
  { index: 6, label: 'Sábado' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  accessibility,
  setAccessibility,
  whatsAppConfig,
  setWhatsAppConfig,
  weeklySchedules,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = React.useState<'fixed_meetings' | 'whatsapp' | 'voice'>('fixed_meetings');

  // WhatsApp & Voice state
  const [groupName, setGroupName] = React.useState(whatsAppConfig.groupName);
  const [phoneOrLink, setPhoneOrLink] = React.useState(whatsAppConfig.phoneOrLink);
  const [speechSpeed, setSpeechSpeed] = React.useState(accessibility.speechSpeed);

  // New Weekly Schedule Form state
  const [selectedDayIndex, setSelectedDayIndex] = React.useState<number>(4); // Quinta-feira default
  const [selectedEntity, setSelectedEntity] = React.useState<EntityGroup>('Congregação Juparanã');
  const [selectedEventType, setSelectedEventType] = React.useState<EventType>('Reunião do Meio de Semana');
  const [startTime, setStartTime] = React.useState<string>('19:30');
  const [endTime, setEndTime] = React.useState<string>('21:15');
  const [notes, setNotes] = React.useState<string>('');
  const [isSubmittingSchedule, setIsSubmittingSchedule] = React.useState(false);

  React.useEffect(() => {
    setGroupName(whatsAppConfig.groupName);
    setPhoneOrLink(whatsAppConfig.phoneOrLink);
    setSpeechSpeed(accessibility.speechSpeed);
  }, [whatsAppConfig, accessibility, isOpen]);

  if (!isOpen) return null;

  const handleSaveGeneral = () => {
    const updatedWa: WhatsAppConfig = {
      ...whatsAppConfig,
      groupName: groupName.trim() || 'Grupo do Salão do Reino - Juparanã',
      phoneOrLink: phoneOrLink.trim(),
    };

    const updatedAcc: AccessibilitySettings = {
      ...accessibility,
      speechSpeed,
    };

    setWhatsAppConfig(updatedWa);
    saveWhatsAppConfig(updatedWa);

    setAccessibility(updatedAcc);
    saveAccessibilitySettings(updatedAcc);

    speakText('Configurações salvas com sucesso.', speechSpeed);
    onClose();
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const dayObj = DAYS_OF_WEEK.find(d => d.index === selectedDayIndex);
    if (!dayObj) return;

    setIsSubmittingSchedule(true);
    try {
      await addWeeklySchedule({
        dayOfWeek: dayObj.label,
        dayIndex: selectedDayIndex,
        entityGroup: selectedEntity,
        eventType: selectedEventType,
        startTime,
        endTime,
        notes: notes.trim(),
      });
      speakText(`Reunião de ${selectedEntity} na ${dayObj.label} cadastrada com sucesso.`, speechSpeed);
      setNotes('');
    } catch (err) {
      console.error('Erro ao salvar reunião semanal:', err);
      alert('Erro ao salvar dia fixo de reunião no banco de dados.');
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const handleDeleteSchedule = async (id: string, entity: string, day: string) => {
    try {
      await deleteWeeklySchedule(id);
      speakText(`Reunião de ${entity} na ${day} removida.`, speechSpeed);
    } catch (err) {
      console.error('Erro ao excluir reunião fixa:', err);
      alert('Erro ao remover reunião fixa.');
    }
  };

  const handlePopulateDefaults = async () => {
    setIsSubmittingSchedule(true);
    try {
      const defaults = [
        {
          dayOfWeek: 'Terça-feira',
          dayIndex: 2,
          entityGroup: 'Congregação Central' as EntityGroup,
          eventType: 'Reunião do Meio de Semana' as EventType,
          startTime: '19:30',
          endTime: '21:15',
          notes: 'Reunião Vida e Ministério Cristão',
        },
        {
          dayOfWeek: 'Quinta-feira',
          dayIndex: 4,
          entityGroup: 'Congregação Juparanã' as EntityGroup,
          eventType: 'Reunião do Meio de Semana' as EventType,
          startTime: '19:30',
          endTime: '21:15',
          notes: 'Reunião Vida e Ministério Cristão',
        },
        {
          dayOfWeek: 'Sábado',
          dayIndex: 6,
          entityGroup: 'Grupo Espanhol' as EntityGroup,
          eventType: 'Reunião de Fim de Semana' as EventType,
          startTime: '19:00',
          endTime: '20:45',
          notes: 'Discurso Público e Estudo de A Sentinela (Espanhol)',
        },
        {
          dayOfWeek: 'Domingo',
          dayIndex: 0,
          entityGroup: 'Congregação Juparanã' as EntityGroup,
          eventType: 'Reunião de Fim de Semana' as EventType,
          startTime: '09:00',
          endTime: '10:45',
          notes: 'Discurso Público e Estudo de A Sentinela',
        },
        {
          dayOfWeek: 'Domingo',
          dayIndex: 0,
          entityGroup: 'Congregação Central' as EntityGroup,
          eventType: 'Reunião de Fim de Semana' as EventType,
          startTime: '18:00',
          endTime: '19:45',
          notes: 'Discurso Público e Estudo de A Sentinela',
        },
      ];

      for (const item of defaults) {
        await addWeeklySchedule(item);
      }
      speakText('Dias fixos padrão das congregações cadastrados com sucesso.', speechSpeed);
    } catch (err) {
      console.error('Erro ao popular padrão:', err);
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border-4 border-amber-400 text-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 sm:p-3 rounded-full border-2 border-slate-600 focus:ring-4 focus:ring-amber-400"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="mb-5 border-b border-slate-800 pb-3">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4" />
            Painel de Configurações
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-amber-400">
            Configurações e Dias Fixos
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm">
            Cadastre os horários semanais das congregações e ajuste as preferências do aplicativo
          </p>
        </div>

        {/* Internal Navigation Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-6 bg-slate-850 p-1.5 rounded-2xl border-2 border-slate-700">
          <button
            onClick={() => setActiveTab('fixed_meetings')}
            className={`py-2.5 px-2 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'fixed_meetings'
                ? 'bg-amber-400 text-slate-950 shadow-md scale-[1.02]'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <CalendarIcon className="w-4 h-4 shrink-0" />
            <span className="truncate">Dias Fixos</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`py-2.5 px-2 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'whatsapp'
                ? 'bg-amber-400 text-slate-950 shadow-md scale-[1.02]'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="truncate">WhatsApp</span>
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`py-2.5 px-2 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'voice'
                ? 'bg-amber-400 text-slate-950 shadow-md scale-[1.02]'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Volume2 className="w-4 h-4 shrink-0" />
            <span className="truncate">Leitura por Voz</span>
          </button>
        </div>

        {/* TAB 1: Dias Fixos de Reuniões Semanais */}
        {activeTab === 'fixed_meetings' && (
          <div className="space-y-6">
            {/* Registration Form Box */}
            <div className="bg-slate-800/90 border-2 border-amber-500/60 rounded-2xl p-4 sm:p-5 shadow-md">
              <h3 className="text-lg font-black text-amber-300 flex items-center gap-2 mb-2">
                <Plus className="w-5 h-5 text-amber-400" />
                Cadastrar Dia Fixo de Reunião
              </h3>
              <p className="text-xs text-slate-300 mb-4 font-medium">
                Informe o dia da semana, qual congregação ou grupo utiliza o Salão do Reino e o horário reservado.
              </p>

              <form onSubmit={handleAddSchedule} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Day of Week */}
                  <div>
                    <label className="block text-slate-200 font-extrabold text-xs mb-1">
                      Dia da Semana:
                    </label>
                    <select
                      value={selectedDayIndex}
                      onChange={(e) => setSelectedDayIndex(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-900 border-2 border-slate-600 rounded-xl text-white font-bold text-sm focus:border-amber-400"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d.index} value={d.index}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Entity Group */}
                  <div>
                    <label className="block text-slate-200 font-extrabold text-xs mb-1">
                      Congregação / Grupo:
                    </label>
                    <select
                      value={selectedEntity}
                      onChange={(e) => setSelectedEntity(e.target.value as EntityGroup)}
                      className="w-full p-2.5 bg-slate-900 border-2 border-slate-600 rounded-xl text-white font-bold text-sm focus:border-amber-400"
                    >
                      {ENTITY_LIST.map((ent) => (
                        <option key={ent.id} value={ent.id}>
                          {ent.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Event Type */}
                  <div className="sm:col-span-1">
                    <label className="block text-slate-200 font-extrabold text-xs mb-1">
                      Tipo de Reunião:
                    </label>
                    <select
                      value={selectedEventType}
                      onChange={(e) => setSelectedEventType(e.target.value as EventType)}
                      className="w-full p-2.5 bg-slate-900 border-2 border-slate-600 rounded-xl text-white font-bold text-xs focus:border-amber-400"
                    >
                      {EVENT_TYPES.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Time */}
                  <div>
                    <label className="block text-slate-200 font-extrabold text-xs mb-1">
                      Horário Início:
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      className="w-full p-2.5 bg-slate-900 border-2 border-slate-600 rounded-xl text-amber-300 font-black text-sm focus:border-amber-400"
                    />
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-slate-200 font-extrabold text-xs mb-1">
                      Horário Término:
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                      className="w-full p-2.5 bg-slate-900 border-2 border-slate-600 rounded-xl text-amber-300 font-black text-sm focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-slate-200 font-extrabold text-xs mb-1">
                    Observações / Descrição (Opcional):
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Reunião Vida e Ministério / Estudo de A Sentinela"
                    className="w-full p-2.5 bg-slate-900 border-2 border-slate-600 rounded-xl text-white font-medium text-xs focus:border-amber-400"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmittingSchedule}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl border-2 border-emerald-300 shadow-md text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-5 h-5 text-slate-950" />
                  <span>{isSubmittingSchedule ? 'Salvando...' : '➕ Cadastrar Dia Fixo'}</span>
                </button>
              </form>
            </div>

            {/* List of Registered Weekly Schedules */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-amber-400" />
                  Dias Fixos de Reuniões Cadastrados ({weeklySchedules.length})
                </h3>

                {weeklySchedules.length === 0 && (
                  <button
                    onClick={handlePopulateDefaults}
                    disabled={isSubmittingSchedule}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs border border-amber-300 flex items-center gap-1 shadow"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Gerar Reuniões Padrão</span>
                  </button>
                )}
              </div>

              {weeklySchedules.length === 0 ? (
                <div className="bg-slate-800/60 border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center">
                  <Info className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-300">
                    Nenhum dia fixo cadastrado ainda.
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Você pode preencher o formulário acima ou clicar no botão "Gerar Reuniões Padrão" para cadastrar os horários habituais do Salão do Reino.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {weeklySchedules.map((sch) => {
                    const entInfo = ENTITY_LIST.find(e => e.id === sch.entityGroup);
                    return (
                      <div
                        key={sch.id}
                        className="bg-slate-800 border-2 border-slate-700 hover:border-slate-500 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-lg font-black text-xs uppercase">
                              📅 {sch.dayOfWeek}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-lg font-black text-xs uppercase ${entInfo?.badgeBg || 'bg-slate-700 text-white'}`}>
                              {sch.entityGroup}
                            </span>
                          </div>

                          <div className="text-sm font-extrabold text-white flex items-center gap-2">
                            <span>{sch.eventType}</span>
                            <span className="text-amber-300 font-mono text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                              ⏰ {sch.startTime} às {sch.endTime}
                            </span>
                          </div>

                          {sch.notes && (
                            <p className="text-xs text-slate-400 italic">
                              Obs: {sch.notes}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteSchedule(sch.id, sch.entityGroup, sch.dayOfWeek)}
                          className="p-2 text-red-400 hover:text-red-200 hover:bg-red-950/60 rounded-xl border border-red-900 transition-all shrink-0"
                          title="Excluir dia fixo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: WhatsApp Settings */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-5">
            <div className="bg-slate-800/90 border-2 border-slate-700 rounded-2xl p-5">
              <h3 className="text-lg font-black text-amber-300 flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                Grupo do WhatsApp da Congregação
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-slate-200 font-bold text-sm mb-1">
                    Nome do Grupo:
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Ex: Grupo Congregação Juparanã"
                    className="w-full p-3 bg-slate-900 border-2 border-slate-600 rounded-xl text-white font-bold text-base focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-200 font-bold text-sm mb-1">
                    Link do Grupo do WhatsApp ou Número (Opcional):
                  </label>
                  <input
                    type="text"
                    value={phoneOrLink}
                    onChange={(e) => setPhoneOrLink(e.target.value)}
                    placeholder="Ex: https://chat.whatsapp.com/..."
                    className="w-full p-3 bg-slate-900 border-2 border-slate-600 rounded-xl text-white font-bold text-base focus:border-amber-400"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Se informado, o botão de notificação abrirá diretamente este link do grupo.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveGeneral}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl border-2 border-emerald-300 text-base shadow-lg"
              >
                <Save className="w-5 h-5" />
                <span>Salvar Configuração do WhatsApp</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Voice Settings */}
        {activeTab === 'voice' && (
          <div className="space-y-5">
            <div className="bg-slate-800/90 border-2 border-slate-700 rounded-2xl p-5">
              <h3 className="text-lg font-black text-amber-300 flex items-center gap-2 mb-3">
                <Volume2 className="w-5 h-5 text-sky-400" />
                Velocidade da Leitura por Voz
              </h3>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSpeechSpeed(0.8)}
                  className={`p-3 rounded-xl border-2 font-bold text-sm ${
                    speechSpeed === 0.8
                      ? 'bg-amber-500 text-slate-950 border-amber-300 font-black'
                      : 'bg-slate-900 text-slate-300 border-slate-700'
                  }`}
                >
                  🐢 Lenta (0.8x)
                </button>

                <button
                  type="button"
                  onClick={() => setSpeechSpeed(1.0)}
                  className={`p-3 rounded-xl border-2 font-bold text-sm ${
                    speechSpeed === 1.0
                      ? 'bg-amber-500 text-slate-950 border-amber-300 font-black'
                      : 'bg-slate-900 text-slate-300 border-slate-700'
                  }`}
                >
                  🚶 Normal (1.0x)
                </button>

                <button
                  type="button"
                  onClick={() => setSpeechSpeed(1.2)}
                  className={`p-3 rounded-xl border-2 font-bold text-sm ${
                    speechSpeed === 1.2
                      ? 'bg-amber-500 text-slate-950 border-amber-300 font-black'
                      : 'bg-slate-900 text-slate-300 border-slate-700'
                  }`}
                >
                  🏃 Rápida (1.2x)
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveGeneral}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl border-2 border-emerald-300 text-base shadow-lg"
              >
                <Save className="w-5 h-5" />
                <span>Salvar Ajustes de Leitura</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Bottom Close */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            🔥 Salão do Reino Juparanã • Firebase Firestore Ativo
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-600 text-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
