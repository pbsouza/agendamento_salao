import React from 'react';
import { 
  Building2, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  Share2, 
  Trash2, 
  Printer, 
  Filter,
  PlusCircle,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CalendarCheck,
  Check,
  Info
} from 'lucide-react';
import { EntityGroup, EventType, Reservation, WhatsAppConfig, WeeklySchedule } from '../types';
import { ENTITY_LIST, EVENT_TYPES } from '../data/entities';
import { deleteReservation, addReservation, checkTimeConflict } from '../utils/storage';
import { formatWhatsAppMessage, openWhatsAppSharing } from '../utils/whatsapp';

interface CalendarViewProps {
  reservations: Reservation[];
  weeklySchedules: WeeklySchedule[];
  onRefresh: () => void;
  onOpenWizard: (date?: string) => void;
  onOpenSettings: () => void;
  whatsAppConfig: WhatsAppConfig;
}

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

const WEEKDAY_NAMES = ['DOM.', 'SEG.', 'TER.', 'QUA.', 'QUI.', 'SEX.', 'SÁB.'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  reservations,
  weeklySchedules,
  onRefresh,
  onOpenWizard,
  onOpenSettings,
  whatsAppConfig,
}) => {
  // Current real date
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Calendar View month & year
  const [viewYear, setViewYear] = React.useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState<number>(today.getMonth()); // 0-indexed

  // Selected date on calendar (defaults to today)
  const [selectedDate, setSelectedDate] = React.useState<string>(todayStr);

  // Filters & modals
  const [selectedEntityFilter, setSelectedEntityFilter] = React.useState<string>('all');
  const [showFilterMenu, setShowFilterMenu] = React.useState<boolean>(false);
  const [showWeeklyModal, setShowWeeklyModal] = React.useState(false);

  // Deletion modal
  const [reservationToDelete, setReservationToDelete] = React.useState<Reservation | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Inline Quick Booking Form State for Selected Day
  const [bookingEntity, setBookingEntity] = React.useState<EntityGroup>('Congregação Juparanã');
  const [bookingEventType, setBookingEventType] = React.useState<EventType>('Reunião do Meio de Semana');
  const [bookingStartTime, setBookingStartTime] = React.useState('19:30');
  const [bookingEndTime, setBookingEndTime] = React.useState('21:30');
  const [bookingResponsibleName, setBookingResponsibleName] = React.useState('');
  const [bookingResponsiblePhone, setBookingResponsiblePhone] = React.useState('');
  const [bookingNotes, setBookingNotes] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [savedReservation, setSavedReservation] = React.useState<Reservation | null>(null);

  // Filter active reservations
  const activeList = reservations.filter(r => r.status === 'active');

  const filteredReservations = activeList.filter(item => {
    if (selectedEntityFilter !== 'all' && item.entityGroup !== selectedEntityFilter) {
      return false;
    }
    return true;
  });

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleGoToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(todayStr);
  };

  // Calendar Day Grid Computation
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayWeekIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  interface DayCell {
    dayNum: number;
    month: number;
    year: number;
    dateStr: string;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    reservations: Reservation[];
  }

  const calendarDays: DayCell[] = [];

  // Trailing days from previous month
  for (let i = firstDayWeekIndex - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    const mStr = String(m + 1).padStart(2, '0');
    const dStr = String(dayNum).padStart(2, '0');
    const dateStr = `${y}-${mStr}-${dStr}`;
    calendarDays.push({
      dayNum,
      month: m,
      year: y,
      dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDate,
      reservations: activeList.filter(r => r.date === dateStr),
    });
  }

  // Days in current month
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const mStr = String(viewMonth + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    const dateStr = `${viewYear}-${mStr}-${dStr}`;
    calendarDays.push({
      dayNum: d,
      month: viewMonth,
      year: viewYear,
      dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDate,
      reservations: activeList.filter(r => r.date === dateStr),
    });
  }

  // Leading days from next month to fill grid (total 35 or 42)
  const remainingCells = (calendarDays.length % 7 === 0) ? 0 : 7 - (calendarDays.length % 7);
  for (let d = 1; d <= remainingCells; d++) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    const mStr = String(m + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    const dateStr = `${y}-${mStr}-${dStr}`;
    calendarDays.push({
      dayNum: d,
      month: m,
      year: y,
      dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDate,
      reservations: activeList.filter(r => r.date === dateStr),
    });
  }

  // Conflict validation for the inline booking form on selected day
  const timeConflict = checkTimeConflict(
    selectedDate,
    bookingStartTime,
    bookingEndTime,
    reservations,
    undefined,
    weeklySchedules
  );

  // Handle day click
  const handleSelectDay = (cell: DayCell) => {
    setSelectedDate(cell.dateStr);
    setSavedReservation(null);
    if (!cell.isCurrentMonth) {
      setViewMonth(cell.month);
      setViewYear(cell.year);
    }
  };

  // Quick preset time selection
  const setQuickTimeSlot = (start: string, end: string, type?: EventType) => {
    setBookingStartTime(start);
    setBookingEndTime(end);
    if (type) {
      setBookingEventType(type);
    }
  };

  // Submit inline reservation for selected day
  const handleConfirmInlineBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingResponsibleName.trim()) {
      alert('Por favor, informe o nome do responsável.');
      return;
    }

    if (timeConflict) {
      const confirmProceed = window.confirm(
        `Atenção: Há conflito de horário com ${timeConflict.entityGroup} (${timeConflict.startTime} às ${timeConflict.endTime}). Deseja prosseguir mesmo assim?`
      );
      if (!confirmProceed) return;
    }

    setIsSubmitting(true);
    try {
      const newRes = await addReservation({
        entityGroup: bookingEntity,
        eventType: bookingEventType,
        title: bookingEventType,
        date: selectedDate,
        startTime: bookingStartTime,
        endTime: bookingEndTime,
        responsibleName: bookingResponsibleName.trim(),
        responsiblePhone: bookingResponsiblePhone.trim(),
        notes: bookingNotes.trim(),
      });

      setSavedReservation(newRes);
      setBookingResponsibleName('');
      setBookingNotes('');
      onRefresh();
    } catch (err) {
      console.error('Error saving reservation:', err);
      alert('Erro ao salvar agendamento no banco de dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete reservation
  const confirmDelete = async () => {
    if (!reservationToDelete) return;
    setIsDeleting(true);
    try {
      await deleteReservation(reservationToDelete.id);
      onRefresh();
    } catch (err) {
      console.error('Error deleting reservation:', err);
      alert('Erro ao excluir reserva.');
    } finally {
      setIsDeleting(false);
      setReservationToDelete(null);
    }
  };

  // WhatsApp share
  const handleShareReservationWhatsApp = (res: Reservation) => {
    const msg = formatWhatsAppMessage(res);
    openWhatsAppSharing(msg, whatsAppConfig.phoneOrLink);
  };

  const handleShareAllWhatsApp = () => {
    if (filteredReservations.length === 0) {
      alert('Não há agendamentos para compartilhar.');
      return;
    }
    const msg = formatWhatsAppMessage(filteredReservations);
    openWhatsAppSharing(msg, whatsAppConfig.phoneOrLink);
  };

  // Print schedule
  const handlePrintSchedule = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=750');
    if (printWindow) {
      const rowsHtml = filteredReservations.map(res => {
        const [y, m, d] = res.date.split('-');
        return `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold; font-size: 14px;">${d}/${m}/${y}</td>
            <td style="padding: 10px; font-size: 14px;">${res.startTime} às ${res.endTime}</td>
            <td style="padding: 10px; font-weight: bold; font-size: 14px;">${res.entityGroup}</td>
            <td style="padding: 10px; font-size: 14px;">${res.title || res.eventType}</td>
            <td style="padding: 10px; font-size: 14px;">${res.responsibleName} ${res.responsiblePhone ? `<br/><small style="color: #555;">${res.responsiblePhone}</small>` : ''}</td>
          </tr>
        `;
      }).join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Quadro de Avisos - Salão do Reino</title>
            <style>
              body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 25px; color: #1e293b; background: #fff; }
              h1 { font-size: 20px; font-weight: 900; text-align: center; margin-bottom: 4px; text-transform: uppercase; }
              h2 { font-size: 14px; font-weight: 700; text-align: center; color: #475569; margin-bottom: 25px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th { background-color: #f1f5f9; border-bottom: 2px solid #0f172a; padding: 12px 10px; text-align: left; font-size: 12px; font-weight: 800; text-transform: uppercase; }
              .btn-print { padding: 12px 24px; font-size: 15px; font-weight: 800; background: #059669; color: #fff; border: none; border-radius: 12px; cursor: pointer; margin-bottom: 20px; }
              @media print { .no-print { display: none !important; } body { padding: 0; } }
            </style>
          </head>
          <body>
            <div style="text-align: center;" class="no-print">
              <button class="btn-print" onclick="window.print()">Imprimir Quadro de Avisos</button>
            </div>
            <h1>SALÃO DO REINO DAS TESTEMUNHAS DE JEOVÁ - JUPARANÃ</h1>
            <h2>QUADRO DE AVISOS E RESERVAS DE USO DO SALÃO</h2>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Horário</th>
                  <th>Grupo / Congregação</th>
                  <th>Evento / Atividade</th>
                  <th>Responsável</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml || '<tr><td colspan="5" style="text-align:center; padding: 30px; font-weight: bold; color: #64748b;">Nenhum agendamento ativo cadastrado.</td></tr>'}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        try { printWindow.print(); } catch (e) { console.error(e); }
      }, 300);
    }
  };

  // Selected Date Info & Reservations
  const selectedDateObj = new Date(selectedDate + 'T12:00:00');
  const selectedDateFormatted = selectedDateObj.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const selectedDateShort = selectedDateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const selectedDateReservations = activeList.filter(r => r.date === selectedDate);

  // Group reservations for upcoming months display (matching screenshot bottom section)
  const upcomingMonths = [0, 1, 2].map(offset => {
    let m = viewMonth + offset;
    let y = viewYear;
    while (m > 11) {
      m -= 12;
      y += 1;
    }
    const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
    const label = `${MONTH_NAMES[m]} de ${y}`;
    const monthReservations = filteredReservations.filter(r => r.date.startsWith(monthKey));
    return { monthKey, label, monthReservations };
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Calendar Card Component (JW Hub Style) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
        
        {/* Month Title & Month Navigation (Matching Screenshot) */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 capitalize tracking-tight">
            {MONTH_NAMES[viewMonth]} de {viewYear}
          </h2>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleGoToToday}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm rounded-lg transition-colors border border-slate-200"
            >
              Hoje
            </button>
            <button
              onClick={handlePrevMonth}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
              title="Próximo Mês"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Weekday Row Header */}
        <div className="grid grid-cols-7 mb-2 text-center border-b border-slate-100 pb-2">
          {WEEKDAY_NAMES.map((weekday, idx) => (
            <span 
              key={weekday} 
              className={`text-xs sm:text-sm font-semibold tracking-wider ${
                idx === 0 ? 'text-amber-600' : 'text-slate-500'
              }`}
            >
              {weekday}
            </span>
          ))}
        </div>

        {/* Days Matrix Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
          {calendarDays.map((cell) => {
            const hasEvents = cell.reservations.length > 0;
            const isSelected = cell.isSelected;

            return (
              <button
                key={cell.dateStr}
                onClick={() => handleSelectDay(cell)}
                className={`min-h-[52px] sm:min-h-[64px] p-1 sm:p-2 rounded-xl flex flex-col items-center justify-between transition-all relative ${
                  isSelected
                    ? 'bg-slate-900 text-white font-black shadow-md scale-105 z-10 ring-2 ring-slate-900'
                    : cell.isCurrentMonth
                    ? 'hover:bg-slate-100 text-slate-800 font-medium'
                    : 'text-slate-400 font-normal hover:bg-slate-50'
                } ${cell.isToday && !isSelected ? 'border-2 border-amber-500 bg-amber-50/40 text-slate-900 font-bold' : ''}`}
              >
                <span className={`text-sm sm:text-base ${isSelected ? 'text-white' : ''}`}>
                  {cell.dayNum}
                </span>

                {/* Event Indicators */}
                <div className="flex items-center justify-center gap-1 w-full mt-1">
                  {hasEvents && (
                    <span 
                      className={`h-1.5 sm:h-2 rounded-full transition-all ${
                        isSelected 
                          ? 'w-4 bg-amber-400' 
                          : 'w-1.5 sm:w-2 bg-emerald-600'
                      }`}
                      title={`${cell.reservations.length} agendamento(s)`}
                    />
                  )}
                  {cell.reservations.length > 1 && (
                    <span className={`text-[9px] font-bold ${isSelected ? 'text-amber-300' : 'text-slate-500'}`}>
                      +{cell.reservations.length - 1}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Buttons Below Matrix (Matching Screenshot Layout) */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          {/* Left Action: Enter Availability / Reserve on Selected Day */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const el = document.getElementById('selected-day-booking-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-lg shadow transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Reservar no Dia ({selectedDateShort})</span>
            </button>
            
            <button
              onClick={() => onOpenWizard(selectedDate)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors border border-slate-200"
              title="Abrir Assistente Completo de 5 Passos"
            >
              <span>Assistente Guiado</span>
            </button>
          </div>

          {/* Right Action: Filters & Share */}
          <div className="flex items-center gap-2 relative">
            {/* Filter Button */}
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(prev => !prev)}
                className={`flex items-center gap-1.5 px-3.5 py-2 font-semibold text-xs sm:text-sm rounded-lg border transition-colors ${
                  selectedEntityFilter !== 'all'
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-slate-600" />
                <span>
                  {selectedEntityFilter === 'all' ? 'Filtros' : selectedEntityFilter.split(' ')[1] || 'Filtrado'}
                </span>
                <span className="text-[10px] ml-0.5">▾</span>
              </button>

              {/* Filter Dropdown */}
              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-2">
                  <div className="text-xs font-bold text-slate-500 px-3 py-1.5 border-b border-slate-100">
                    Filtrar por Congregação / Grupo:
                  </div>
                  <button
                    onClick={() => {
                      setSelectedEntityFilter('all');
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between ${
                      selectedEntityFilter === 'all' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Todas as Congregações</span>
                    {selectedEntityFilter === 'all' && <Check className="w-3.5 h-3.5 text-slate-700" />}
                  </button>
                  {ENTITY_LIST.map(ent => (
                    <button
                      key={ent.id}
                      onClick={() => {
                        setSelectedEntityFilter(ent.id);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between ${
                        selectedEntityFilter === ent.id ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{ent.name}</span>
                      {selectedEntityFilter === ent.id && <Check className="w-3.5 h-3.5 text-slate-700" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fixed Schedules Shortcut */}
            <button
              onClick={() => setShowWeeklyModal(true)}
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-colors"
              title="Ver Reuniões Fixas da Semana"
            >
              <CalendarCheck className="w-4 h-4 text-slate-700" />
            </button>

            {/* WhatsApp Share */}
            <button
              onClick={handleShareAllWhatsApp}
              className="flex items-center gap-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 transition-colors"
              title="Compartilhar lista de agendamentos no WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrintSchedule}
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-colors"
              title="Imprimir quadro de avisos"
            >
              <Printer className="w-4 h-4 text-slate-700" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION: SELECTED DAY DETAILS & OPTIONS FOR RESERVING (User's core request) */}
      <div 
        id="selected-day-booking-section" 
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6"
      >
        {/* Selected Day Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Dia Selecionado
              </span>
              {selectedDateReservations.length === 0 ? (
                <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Salão Livre
                </span>
              ) : (
                <span className="text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                  {selectedDateReservations.length} agendamento(s)
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 capitalize mt-0.5">
              {selectedDateFormatted}
            </h3>
          </div>

          <button
            onClick={() => onOpenWizard(selectedDate)}
            className="self-start sm:self-auto text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
          >
            <span>Usar assistente passo a passo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Existing Reservations on This Selected Day */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Agendamentos cadastrados neste dia:
          </h4>

          {selectedDateReservations.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <p className="text-sm text-slate-600 italic">
                Não há eventos para mostrar neste dia. O Salão do Reino está livre.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedDateReservations.map((res) => (
                <div 
                  key={res.id} 
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between gap-3 hover:border-slate-300 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800">
                        {res.entityGroup}
                      </span>
                      <span className="text-xs font-black text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {res.startTime} - {res.endTime}
                      </span>
                    </div>

                    <h5 className="text-sm font-bold text-slate-900">
                      {res.eventType}
                    </h5>

                    <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>Responsável: {res.responsibleName}</span>
                    </p>
                    {res.responsiblePhone && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{res.responsiblePhone}</span>
                      </p>
                    )}
                    {res.notes && (
                      <p className="text-xs text-slate-500 italic mt-1 bg-white p-1.5 rounded border border-slate-100">
                        Obs: {res.notes}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <button
                      onClick={() => handleShareReservationWhatsApp(res)}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={() => setReservationToDelete(res)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Successful Confirmation Alert */}
        {savedReservation && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h5 className="text-sm font-bold text-emerald-900">
                  Reserva salva com sucesso!
                </h5>
                <p className="text-xs text-emerald-700">
                  {savedReservation.entityGroup} • {savedReservation.eventType} ({savedReservation.startTime} às {savedReservation.endTime})
                </p>
              </div>
            </div>

            <button
              onClick={() => handleShareReservationWhatsApp(savedReservation)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Enviar no WhatsApp</span>
            </button>
          </div>
        )}

        {/* Booking Form on Selected Day */}
        <form onSubmit={handleConfirmInlineBooking} className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Opções para Reserva do Salão em {selectedDateShort}</span>
            </h4>
            <span className="text-xs text-slate-500">Preenchimento rápido</span>
          </div>

          {/* 1. Select Congregation / Entity Group */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. Selecione a Congregação ou Grupo:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ENTITY_LIST.map((ent) => {
                const isSelected = bookingEntity === ent.id;
                return (
                  <button
                    type="button"
                    key={ent.id}
                    onClick={() => setBookingEntity(ent.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {ent.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Select Event Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              2. Tipo de Uso / Atividade:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_TYPES.map((ev) => {
                const isSelected = bookingEventType === ev.id;
                return (
                  <button
                    type="button"
                    key={ev.id}
                    onClick={() => setBookingEventType(ev.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-amber-100 text-amber-950 border-amber-400 font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {ev.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Time Selection with Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                3. Horário Desejado:
              </label>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-500 font-medium mr-1">Atalhos:</span>
                <button
                  type="button"
                  onClick={() => setQuickTimeSlot('19:30', '21:30', 'Reunião do Meio de Semana')}
                  className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-semibold"
                >
                  19:30 - 21:30
                </button>
                <button
                  type="button"
                  onClick={() => setQuickTimeSlot('09:00', '11:00', 'Reunião de Fim de Semana')}
                  className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-semibold"
                >
                  09:00 - 11:00
                </button>
                <button
                  type="button"
                  onClick={() => setQuickTimeSlot('08:00', '11:00', 'Limpeza do Salão')}
                  className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-semibold"
                >
                  08:00 - 11:00 (Limpeza)
                </button>
                <button
                  type="button"
                  onClick={() => setQuickTimeSlot('08:00', '21:00', 'Visita do Viajante')}
                  className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-semibold"
                >
                  Dia Todo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <div>
                <span className="text-[11px] text-slate-500 font-medium">Início:</span>
                <input
                  type="time"
                  value={bookingStartTime}
                  onChange={(e) => setBookingStartTime(e.target.value)}
                  className="w-full mt-0.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium">Término:</span>
                <input
                  type="time"
                  value={bookingEndTime}
                  onChange={(e) => setBookingEndTime(e.target.value)}
                  className="w-full mt-0.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>
            </div>
          </div>

          {/* Conflict Warning if Detected */}
          {timeConflict && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900">
                  Aviso de Conflito de Horário!
                </p>
                <p className="text-xs text-amber-800">
                  Já existe um compromisso agendado para <strong>{timeConflict.entityGroup}</strong> das <strong>{timeConflict.startTime} às {timeConflict.endTime}</strong> ({timeConflict.eventType}).
                </p>
              </div>
            </div>
          )}

          {/* 4. Responsible Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                4. Nome do Irmão Responsável *:
              </label>
              <input
                type="text"
                value={bookingResponsibleName}
                onChange={(e) => setBookingResponsibleName(e.target.value)}
                placeholder="Ex: Irmão Roberto Silva"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Telefone / WhatsApp (Opcional):
              </label>
              <input
                type="tel"
                value={bookingResponsiblePhone}
                onChange={(e) => setBookingResponsiblePhone(e.target.value)}
                placeholder="Ex: (27) 99999-9999"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Observações (opcional):
            </label>
            <input
              type="text"
              value={bookingNotes}
              onChange={(e) => setBookingNotes(e.target.value)}
              placeholder="Ex: Utilizará o sistema de som e ar condicionado"
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
            />
          </div>

          {/* Confirmation Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Data: <strong>{selectedDateShort}</strong> • {bookingStartTime} às {bookingEndTime}
            </span>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Confirmar Reserva do Salão'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION: AGENDA DOS PRÓXIMOS MESES (Style of bottom screenshot) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Agenda dos Próximos Meses
          </h3>
          <span className="text-xs text-slate-400">
            {filteredReservations.length} total de eventos ativos
          </span>
        </div>

        {upcomingMonths.map((monthGroup) => (
          <div key={monthGroup.monthKey} className="space-y-2.5">
            <h4 className="text-base font-bold text-slate-900 capitalize">
              {monthGroup.label}
            </h4>

            {monthGroup.monthReservations.length === 0 ? (
              <p className="text-sm text-slate-500 italic pl-1">
                Não há eventos para mostrar.
              </p>
            ) : (
              <div className="space-y-2">
                {monthGroup.monthReservations.map((res) => {
                  const [y, m, d] = res.date.split('-');
                  const dateObj = new Date(res.date + 'T12:00:00');
                  const weekdayShort = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });
                  const dateDisplay = `${weekdayShort}, ${parseInt(d)} de ${MONTH_NAMES[parseInt(m) - 1].slice(0, 3)}. de ${y}`;

                  return (
                    <div
                      key={res.id}
                      className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-500 mb-0.5">
                          {dateDisplay}
                        </div>
                        <h5 className="text-sm sm:text-base font-bold text-slate-900">
                          {res.eventType} - {res.entityGroup}
                        </h5>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600">
                          <span className="font-semibold text-slate-800">
                            {res.startTime} às {res.endTime}
                          </span>
                          <span>•</span>
                          <span>Responsável: {res.responsibleName}</span>
                          {res.responsiblePhone && (
                            <>
                              <span>•</span>
                              <span>{res.responsiblePhone}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleShareReservationWhatsApp(res)}
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors"
                          title="Enviar no WhatsApp"
                        >
                          <Share2 className="w-4 h-4 text-emerald-600" />
                        </button>
                        <button
                          onClick={() => setReservationToDelete(res)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                          title="Excluir Reserva"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal: Weekly Fixed Schedules */}
      {showWeeklyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full text-slate-900 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowWeeklyModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-slate-900 mb-1">
              <CalendarCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <h3 className="text-xl font-bold">Reuniões Semanais Fixas</h3>
            </div>
            <p className="text-slate-600 text-xs sm:text-sm mb-4">
              Horários habituais de reuniões das congregações no Salão do Reino (já protegidos contra choques):
            </p>

            {weeklySchedules.length === 0 ? (
              <div className="bg-slate-50 p-6 rounded-xl text-center border border-slate-200">
                <p className="text-sm text-slate-600 font-semibold mb-3">
                  Nenhuma reunião fixa cadastrada.
                </p>
                <button
                  onClick={() => {
                    setShowWeeklyModal(false);
                    onOpenSettings();
                  }}
                  className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg text-xs"
                >
                  Abrir Configurações para Cadastrar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {weeklySchedules.map(ws => (
                  <div key={ws.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                        {ws.dayOfWeek}
                      </span>
                      <h5 className="text-sm font-bold text-slate-900 mt-1">
                        {ws.eventType} ({ws.entityGroup})
                      </h5>
                      <span className="text-xs text-slate-600 font-semibold">
                        {ws.startTime} às {ws.endTime}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {reservationToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full text-slate-900 shadow-2xl relative">
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900">Confirmar Exclusão</h3>
            </div>
            
            <p className="text-slate-600 text-sm mb-4">
              Tem certeza que deseja excluir o agendamento de <strong>{reservationToDelete.entityGroup}</strong> marcado para o dia <strong>{reservationToDelete.date}</strong> às <strong>{reservationToDelete.startTime}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setReservationToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
              >
                Cancelar
              </button>

              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir Agendamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
