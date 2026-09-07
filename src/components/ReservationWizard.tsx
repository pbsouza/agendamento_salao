import React from 'react';
import { 
  Building2, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Share2, 
  PlusCircle,
  HelpCircle,
  Award,
  X
} from 'lucide-react';
import { EntityGroup, EventType, Reservation, WhatsAppConfig, WeeklySchedule } from '../types';
import { ENTITY_LIST, EVENT_TYPES } from '../data/entities';
import { checkTimeConflict, addReservation } from '../utils/storage';
import { formatWhatsAppMessage, openWhatsAppSharing } from '../utils/whatsapp';
import { getCircuitOverseerWeek } from '../utils/dateUtils';

interface ReservationWizardProps {
  reservations: Reservation[];
  weeklySchedules?: WeeklySchedule[];
  onComplete: (newReservation: Reservation) => void;
  onCancel: () => void;
  speechSpeed?: number;
  whatsAppConfig: WhatsAppConfig;
  initialDate?: string;
}

export const ReservationWizard: React.FC<ReservationWizardProps> = ({
  reservations,
  weeklySchedules = [],
  onComplete,
  onCancel,
  whatsAppConfig,
  initialDate,
}) => {
  const [step, setStep] = React.useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [selectedEntity, setSelectedEntity] = React.useState<EntityGroup>('Congregação Juparanã');
  const [selectedEventType, setSelectedEventType] = React.useState<EventType>('Reunião do Meio de Semana');
  const [title, setTitle] = React.useState('');
  
  // Date & Time
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = React.useState(initialDate || todayStr);
  const [endDate, setEndDate] = React.useState<string | undefined>(undefined);
  const [startTime, setStartTime] = React.useState('19:30');
  const [endTime, setEndTime] = React.useState('21:30');

  // Responsible
  const [responsibleName, setResponsibleName] = React.useState('');
  const [responsiblePhone, setResponsiblePhone] = React.useState('');
  const [notes, setNotes] = React.useState('');

  // Conflict state
  const [conflict, setConflict] = React.useState<Reservation | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Completed Reservation Reference
  const [createdReservation, setCreatedReservation] = React.useState<Reservation | null>(null);

  // Auto conflict check on date/time change
  React.useEffect(() => {
    if (date && startTime && endTime) {
      const conflictFound = checkTimeConflict(date, startTime, endTime, reservations, undefined, weeklySchedules, endDate);
      setConflict(conflictFound);
    }
  }, [date, endDate, startTime, endTime, reservations, weeklySchedules]);

  // Quick date helper handlers
  const setQuickDate = (type: 'today' | 'tomorrow' | 'saturday' | 'sunday') => {
    const d = new Date();
    if (type === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    } else if (type === 'saturday') {
      d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
    } else if (type === 'sunday') {
      d.setDate(d.getDate() + ((0 - d.getDay() + 7) % 7 || 7));
    }
    const formatted = d.toISOString().split('T')[0];
    setDate(formatted);
  };

  // Quick week helper for Circuit Overseer visit
  const setQuickOverseerWeek = (offsetWeeks: number = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetWeeks * 7);
    const formatted = d.toISOString().split('T')[0];
    const week = getCircuitOverseerWeek(formatted);
    setDate(week.startDate);
    setEndDate(week.endDate);
  };

  // Submit Handler
  const handleConfirmReservation = async () => {
    if (!responsibleName.trim()) {
      alert('Por favor, informe o nome do responsável.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newRes = await addReservation({
        entityGroup: selectedEntity,
        eventType: selectedEventType,
        title: title.trim() || selectedEventType,
        date,
        endDate: selectedEventType === 'Visita do Viajante' ? (endDate || getCircuitOverseerWeek(date).endDate) : undefined,
        startTime,
        endTime,
        responsibleName: responsibleName.trim(),
        responsiblePhone: responsiblePhone.trim(),
        notes: notes.trim(),
        whatsappSent: false,
      });

      setCreatedReservation(newRes);
    } catch (err) {
      console.error('Error adding reservation to Firestore:', err);
      alert('Ocorreu um erro ao salvar o agendamento no Firebase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareWhatsApp = () => {
    // Filter active reservations
    let activeList = reservations.filter(r => r.status === 'active');

    // Ensure newly created reservation is included in the active list
    if (createdReservation && !activeList.some(r => r.id === createdReservation.id)) {
      activeList = [...activeList, createdReservation];
    }

    // Sort by date and start time
    activeList.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

    const listToShare = activeList.length > 0 ? activeList : (createdReservation ? [createdReservation] : []);
    const msg = formatWhatsAppMessage(listToShare);
    openWhatsAppSharing(msg, whatsAppConfig.phoneOrLink);
  };

  const handleFinishWizard = () => {
    if (createdReservation) {
      onComplete(createdReservation);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Wizard Header Card */}
      <div className="bg-slate-900 border-4 border-amber-400 text-white rounded-3xl p-6 shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="bg-emerald-500 text-slate-950 font-black text-xs px-3 py-1 rounded-md uppercase tracking-wider">
              Processo Guiado Passo a Passo
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
              Novo Agendamento
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              Preencha os dados de forma simples e sem complicações
            </p>
          </div>

          <button
            onClick={onCancel}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl text-sm border border-slate-600 shadow transition-all shrink-0"
          >
            <X className="w-5 h-5" />
            <span>Voltar ao Calendário</span>
          </button>
        </div>

        {/* Step Progress Pills */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-3 mt-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`flex flex-col items-center justify-center p-2 rounded-xl text-center border-2 transition-all ${
                step === s
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow'
                  : s < step
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600 font-bold'
                  : 'bg-slate-800 text-slate-400 border-slate-700 font-medium'
              }`}
            >
              <span className="text-xs uppercase tracking-tight">Passo</span>
              <span className="text-lg sm:text-2xl font-black leading-none">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ================= STEP 1: ENTITY SELECTION ================= */}
      {step === 1 && (
        <div className="bg-white border-4 border-slate-300 rounded-3xl p-6 sm:p-8 shadow-xl">
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-amber-600" />
            1. Quem está agendando?
          </h3>
          <p className="text-slate-600 text-base sm:text-lg mb-6 font-medium">
            Clique ou toque na sua congregação, grupo ou comissão:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {ENTITY_LIST.map((ent) => {
              const isSelected = selectedEntity === ent.id;
              return (
                <button
                  key={ent.id}
                  onClick={() => {
                    setSelectedEntity(ent.id);
                  }}
                  className={`p-5 rounded-2xl border-4 text-left transition-all flex items-start gap-4 ${
                    isSelected
                      ? 'bg-amber-50 border-amber-500 shadow-md ring-4 ring-amber-300'
                      : 'bg-slate-50 border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${ent.badgeBg} shrink-0 mt-0.5`}>
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                      {ent.name}
                    </h4>
                    <p className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">
                      {ent.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="mt-8 pt-6 border-t-2 border-slate-200 flex items-center justify-between">
            <button
              onClick={onCancel}
              className="px-6 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-2xl border-2 border-slate-300 text-base"
            >
              Cancelar
            </button>

            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl border-2 border-amber-300 text-lg shadow-lg"
            >
              <span>Avançar para o Passo 2</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: EVENT TYPE ================= */}
      {step === 2 && (
        <div className="bg-white border-4 border-slate-300 rounded-3xl p-6 sm:p-8 shadow-xl">
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-amber-600" />
            2. Qual é o motivo do agendamento?
          </h3>
          <p className="text-slate-600 text-base sm:text-lg mb-6 font-medium">
            Escolha o tipo de reunião ou atividade que será realizada:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {EVENT_TYPES.map((ev) => {
              const isSelected = selectedEventType === ev.id;
              const isSuperintendente = ev.id === 'Visita do Viajante';
              return (
                <button
                  key={ev.id}
                  onClick={() => {
                    setSelectedEventType(ev.id);
                    if (isSuperintendente) {
                      setSelectedEntity('Viajante');
                      const week = getCircuitOverseerWeek(date);
                      setDate(week.startDate);
                      setEndDate(week.endDate);
                    } else {
                      setEndDate(undefined);
                    }
                  }}
                  className={`p-4 rounded-2xl border-4 text-left transition-all flex items-center gap-4 ${
                    isSelected
                      ? 'bg-amber-50 border-amber-500 shadow-md ring-4 ring-amber-300'
                      : 'bg-slate-50 border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className={`p-3 rounded-xl shrink-0 ${isSuperintendente ? 'bg-purple-900 text-amber-300' : 'bg-slate-900 text-amber-400'}`}>
                    {isSuperintendente ? <Award className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black text-slate-900">
                      {ev.label}
                    </h4>
                    {isSuperintendente ? (
                      <span className="text-xs bg-purple-100 text-purple-900 font-extrabold px-2 py-0.5 rounded-md inline-block mt-0.5">
                        Período de 1 semana (Terça a Domingo)
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 font-bold">
                        Duração sugerida: ~{ev.defaultDurationHours} hora(s)
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <label className="block text-slate-800 font-black text-base sm:text-lg mb-2">
              Assunto ou Detalhe do Evento (Opcional):
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reunião especial, limpeza geral, etc."
              className="w-full p-4 border-4 border-slate-300 rounded-2xl text-lg font-bold focus:border-amber-500 focus:ring-4 focus:ring-amber-200"
            />
          </div>

          {/* Navigation Controls */}
          <div className="mt-8 pt-6 border-t-2 border-slate-200 flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-6 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-2xl border-2 border-slate-300 text-base"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>

            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl border-2 border-amber-300 text-lg shadow-lg"
            >
              <span>Avançar para o Passo 3</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: DATE & TIME ================= */}
      {step === 3 && (
        <div className="bg-white border-4 border-slate-300 rounded-3xl p-6 sm:p-8 shadow-xl">
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 flex items-center gap-3">
            <Clock className="w-8 h-8 text-amber-600" />
            3. Qual a data e horário desejados?
          </h3>
          <p className="text-slate-600 text-base sm:text-lg mb-6 font-medium">
            Escolha o dia e o horário de início e término no Salão do Reino:
          </p>

          {selectedEventType === 'Visita do Viajante' ? (
            /* Dedicated Circuit Overseer Visit Week Selection (Tuesday to Sunday) */
            <div className="mb-6 space-y-4">
              <div className="bg-purple-50 border-4 border-purple-400 p-5 rounded-2xl">
                <div className="flex items-start gap-3.5 mb-4">
                  <div className="p-3 bg-purple-900 text-amber-300 rounded-xl shrink-0">
                    <Award className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-purple-950">
                      Período da Visita: 1 Semana Completa (Terça a Domingo)
                    </h4>
                    <p className="text-sm font-bold text-purple-900 mt-1">
                      A visita do Superintendente de Circuito compreende 6 dias consecutivos de atividades no Salão do Reino, iniciando na <strong>Terça-feira</strong> e concluindo no <strong>Domingo</strong>.
                    </p>
                  </div>
                </div>

                {/* Quick Week Selectors */}
                <div className="mb-4">
                  <label className="block text-purple-950 font-extrabold text-sm mb-2">
                    Escolha rápida da semana da visita:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setQuickOverseerWeek(0)}
                      className="p-3 bg-white hover:bg-purple-100 border-2 border-purple-300 hover:border-purple-600 rounded-xl font-black text-purple-950 text-xs sm:text-sm shadow-sm transition-all"
                    >
                      📅 Esta Semana (Ter-Dom)
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickOverseerWeek(1)}
                      className="p-3 bg-white hover:bg-purple-100 border-2 border-purple-300 hover:border-purple-600 rounded-xl font-black text-purple-950 text-xs sm:text-sm shadow-sm transition-all"
                    >
                      🚀 Próxima Semana
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickOverseerWeek(2)}
                      className="p-3 bg-white hover:bg-purple-100 border-2 border-purple-300 hover:border-purple-600 rounded-xl font-black text-purple-950 text-xs sm:text-sm shadow-sm transition-all"
                    >
                      ✨ Em 2 Semanas
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickOverseerWeek(4)}
                      className="p-3 bg-white hover:bg-purple-100 border-2 border-purple-300 hover:border-purple-600 rounded-xl font-black text-purple-950 text-xs sm:text-sm shadow-sm transition-all"
                    >
                      🗓️ No Próximo Mês
                    </button>
                  </div>
                </div>

                {/* Date range picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border-2 border-purple-300 shadow-sm">
                    <label className="block text-slate-900 font-black text-sm mb-1.5">
                      🗓️ Selecione uma data de referência (ou Terça inicial):
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => {
                        const week = getCircuitOverseerWeek(e.target.value);
                        setDate(week.startDate);
                        setEndDate(week.endDate);
                      }}
                      className="w-full p-3 border-2 border-purple-400 rounded-xl text-base font-black focus:border-purple-600 focus:ring-2 focus:ring-purple-200"
                    />
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      O sistema calcula automaticamente o início (Terça) e término (Domingo).
                    </p>
                  </div>

                  <div className="bg-purple-900 text-white p-4 rounded-xl shadow-sm flex flex-col justify-center">
                    <span className="text-xs uppercase font-black text-amber-300 tracking-wider">
                      Semana Calculada da Visita
                    </span>
                    <div className="text-base sm:text-lg font-black mt-1">
                      Início: Terça-feira ({date.split('-').reverse().join('/')})
                    </div>
                    <div className="text-base sm:text-lg font-black text-amber-300">
                      Término: Domingo ({(endDate || getCircuitOverseerWeek(date).endDate).split('-').reverse().join('/')})
                    </div>
                    <span className="text-xs text-purple-200 font-bold mt-1">
                      6 dias de atividades reservadas para a congregação
                    </span>
                  </div>
                </div>
              </div>

              {/* Time inputs for the visit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-900 font-black text-base mb-1.5">
                    Horário Diário de Início das Atividades:
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-3.5 border-4 border-slate-300 rounded-2xl text-lg font-black focus:border-amber-500 focus:ring-4 focus:ring-amber-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-900 font-black text-base mb-1.5">
                    Horário Diário de Término das Atividades:
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-3.5 border-4 border-slate-300 rounded-2xl text-lg font-black focus:border-amber-500 focus:ring-4 focus:ring-amber-200"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Standard single-day flow */
            <>
              {/* Quick Date Presets */}
              <div className="mb-6">
                <label className="block text-slate-800 font-extrabold text-base mb-2">
                  Escolha rápida de dia:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setQuickDate('today')}
                    className="p-3 bg-slate-100 hover:bg-amber-100 border-2 border-slate-300 hover:border-amber-500 rounded-xl font-black text-slate-900 text-sm"
                  >
                    📅 Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate('tomorrow')}
                    className="p-3 bg-slate-100 hover:bg-amber-100 border-2 border-slate-300 hover:border-amber-500 rounded-xl font-black text-slate-900 text-sm"
                  >
                    🌅 Amanhã
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate('saturday')}
                    className="p-3 bg-slate-100 hover:bg-amber-100 border-2 border-slate-300 hover:border-amber-500 rounded-xl font-black text-slate-900 text-sm"
                  >
                    ✨ Próximo Sábado
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate('sunday')}
                    className="p-3 bg-slate-100 hover:bg-amber-100 border-2 border-slate-300 hover:border-amber-500 rounded-xl font-black text-slate-900 text-sm"
                  >
                    🏠 Próximo Domingo
                  </button>
                </div>
              </div>

              {/* Date Picker Input */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="md:col-span-1">
                  <label className="block text-slate-900 font-black text-base sm:text-lg mb-2">
                    Data do Agendamento:
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-4 border-4 border-slate-300 rounded-2xl text-lg font-black focus:border-amber-500 focus:ring-4 focus:ring-amber-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-900 font-black text-base sm:text-lg mb-2">
                    Horário de Início:
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-4 border-4 border-slate-300 rounded-2xl text-lg font-black focus:border-amber-500 focus:ring-4 focus:ring-amber-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-900 font-black text-base sm:text-lg mb-2">
                    Horário de Término:
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-4 border-4 border-slate-300 rounded-2xl text-lg font-black focus:border-amber-500 focus:ring-4 focus:ring-amber-200"
                  />
                </div>
              </div>
            </>
          )}

          {/* Conflict Warning Banner */}
          {conflict ? (
            <div className="bg-red-50 border-4 border-red-500 text-red-950 p-5 rounded-2xl flex items-start gap-4 mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xl font-black text-red-900">
                  ⚠️ ATENÇÃO: CONFLITO DE HORÁRIO ENCONTRADO!
                </h4>
                <p className="text-base font-bold text-red-800 mt-1">
                  Já existe um agendamento do grupo <span className="underline">{conflict.entityGroup}</span> nesta mesma data ({conflict.date}) das <span className="font-black">{conflict.startTime} às {conflict.endTime}</span>.
                </p>
                <p className="text-sm font-semibold text-red-700 mt-1">
                  Por favor, escolha outro horário ou entre em contato com {conflict.responsibleName} ({conflict.responsiblePhone || 'sem telefone registrado'}).
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border-4 border-emerald-500 text-emerald-950 p-4 rounded-2xl flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
              <p className="text-base font-black text-emerald-900">
                Horário Disponível! Nenhum outro grupo agendou neste horário.
              </p>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 pt-6 border-t-2 border-slate-200 flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-6 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-2xl border-2 border-slate-300 text-base"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>

            <button
              onClick={() => setStep(4)}
              disabled={Boolean(conflict)}
              className={`flex items-center gap-2 px-8 py-4 font-black rounded-2xl border-2 text-lg shadow-lg transition-all ${
                conflict
                  ? 'bg-slate-300 text-slate-500 border-slate-400 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300'
              }`}
            >
              <span>Avançar para o Passo 4</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 4: RESPONSIBLE PERSON ================= */}
      {step === 4 && (
        <div className="bg-white border-4 border-slate-300 rounded-3xl p-6 sm:p-8 shadow-xl">
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 flex items-center gap-3">
            <User className="w-8 h-8 text-amber-600" />
            4. Quem é o responsável pelo agendamento?
          </h3>
          <p className="text-slate-600 text-base sm:text-lg mb-6 font-medium">
            Informe seu nome e telefone para contato caso seja necessário conversar:
          </p>

          <div className="space-y-5">
            <div>
              <label className="block text-slate-900 font-black text-base sm:text-lg mb-2">
                Nome Completo do Responsável: *
              </label>
              <input
                type="text"
                required
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                placeholder="Ex: Irmão Antonio Silva"
                className="w-full p-4 border-4 border-slate-300 rounded-2xl text-lg font-bold focus:border-amber-500 focus:ring-4 focus:ring-amber-200"
              />
            </div>

            <div>
              <label className="block text-slate-900 font-black text-base sm:text-lg mb-2">
                Telefone de Contato (WhatsApp):
              </label>
              <input
                type="tel"
                value={responsiblePhone}
                onChange={(e) => setResponsiblePhone(e.target.value)}
                placeholder="Ex: (27) 99988-7766"
                className="w-full p-4 border-4 border-slate-300 rounded-2xl text-lg font-bold focus:border-amber-500 focus:ring-4 focus:ring-amber-200"
              />
            </div>

            <div>
              <label className="block text-slate-900 font-black text-base sm:text-lg mb-2">
                Observações ou Necessidades Especiais:
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Abrir os portões 30 min antes, ligar o sistema de som..."
                className="w-full p-4 border-4 border-slate-300 rounded-2xl text-lg font-bold focus:border-amber-500 focus:ring-4 focus:ring-amber-200"
              />
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="mt-8 pt-6 border-t-2 border-slate-200 flex items-center justify-between">
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-6 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-2xl border-2 border-slate-300 text-base"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>

            <button
              onClick={() => {
                if (!responsibleName.trim()) {
                  alert('Por favor, informe o nome do irmão responsável.');
                  return;
                }
                setStep(5);
              }}
              className="flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl border-2 border-amber-300 text-lg shadow-lg"
            >
              <span>Ver Resumo e Confirmar</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 5: CONFIRMATION & WHATSAPP ================= */}
      {step === 5 && (
        <div className="bg-white border-4 border-slate-300 rounded-3xl p-6 sm:p-8 shadow-xl">
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            5. Confirmação do Agendamento
          </h3>
          <p className="text-slate-600 text-base sm:text-lg mb-6 font-medium">
            Confira todos os dados antes de finalizar o agendamento:
          </p>

          {/* Summary Box */}
          <div className="bg-slate-900 border-4 border-amber-400 text-white rounded-2xl p-6 mb-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <span className="bg-amber-500 text-slate-950 font-black text-sm px-3 py-1 rounded-md uppercase">
                {selectedEntity}
              </span>
              <span className="text-slate-300 font-extrabold text-base">
                {selectedEventType === 'Visita do Viajante' && endDate ? (
                  `🗓️ ${date.split('-').reverse().join('/')} a ${endDate.split('-').reverse().join('/')} (Terça a Domingo)`
                ) : (
                  `📅 ${date.split('-').reverse().join('/')}`
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Atividade:</span>
                <span className="text-lg font-black text-amber-300">{selectedEventType}</span>
                {title && <p className="text-sm text-slate-300 mt-0.5">"{title}"</p>}
              </div>

              <div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Horário:</span>
                <span className="text-xl font-black text-white">⏰ {startTime} às {endTime}</span>
              </div>

              <div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Responsável:</span>
                <span className="text-base font-bold text-slate-100">👤 {responsibleName}</span>
              </div>

              <div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Contato WhatsApp:</span>
                <span className="text-base font-bold text-slate-100">📞 {responsiblePhone || 'Não informado'}</span>
              </div>
            </div>

            {notes && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Observações:</span>
                <p className="text-sm text-slate-200 italic font-medium">"{notes}"</p>
              </div>
            )}
          </div>

          {/* If already created, show WhatsApp trigger success */}
          {createdReservation ? (
            <div className="space-y-4">
              <div className="bg-emerald-100 border-4 border-emerald-500 text-emerald-950 p-6 rounded-2xl text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2 animate-bounce" />
                <h4 className="text-2xl font-black text-emerald-900">
                  🎉 AGENDAMENTO REALIZADO COM SUCESSO!
                </h4>
                <p className="text-base font-extrabold text-emerald-800 mt-1">
                  O registro já foi salvo no sistema da congregação.
                </p>
              </div>

              {/* Large Green WhatsApp Button */}
              <button
                onClick={handleShareWhatsApp}
                className="w-full flex items-center justify-center gap-3 p-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl sm:text-2xl rounded-2xl border-4 border-emerald-300 shadow-2xl transition-all"
              >
                <Share2 className="w-8 h-8" />
                <span>📱 Notificar no Grupo do WhatsApp</span>
              </button>

              <button
                onClick={handleFinishWizard}
                className="w-full p-4 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-lg rounded-2xl border-2 border-slate-700"
              >
                Ver Lista de Agendamentos
              </button>
            </div>
          ) : (
            <div className="mt-8 pt-6 border-t-2 border-slate-200 flex items-center justify-between gap-4">
              <button
                onClick={() => setStep(4)}
                className="flex items-center gap-2 px-6 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-2xl border-2 border-slate-300 text-base"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar</span>
              </button>

              <button
                onClick={handleConfirmReservation}
                className="flex-1 flex items-center justify-center gap-3 p-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl border-4 border-emerald-300 text-xl shadow-xl transition-all"
              >
                <CheckCircle2 className="w-8 h-8" />
                <span>CONFIRMAR AGENDAMENTO AGORA</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
