import React from 'react';
import { 
  Building2, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  Share2, 
  Trash2, 
  Volume2, 
  Printer, 
  Search, 
  Filter,
  PlusCircle,
  AlertTriangle,
  X,
  Settings
} from 'lucide-react';
import { EntityGroup, Reservation, WhatsAppConfig, WeeklySchedule } from '../types';
import { ENTITY_LIST } from '../data/entities';
import { deleteReservation } from '../utils/storage';
import { speakText } from '../utils/speech';
import { formatWhatsAppMessage, openWhatsAppSharing } from '../utils/whatsapp';

interface CalendarViewProps {
  reservations: Reservation[];
  weeklySchedules: WeeklySchedule[];
  onRefresh: () => void;
  onOpenWizard: () => void;
  onOpenSettings: () => void;
  speechSpeed: number;
  whatsAppConfig: WhatsAppConfig;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  reservations,
  weeklySchedules,
  onRefresh,
  onOpenWizard,
  onOpenSettings,
  speechSpeed,
  whatsAppConfig,
}) => {
  const [selectedEntityFilter, setSelectedEntityFilter] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [showWeeklyModal, setShowWeeklyModal] = React.useState(false);
  
  // State for in-app delete modal
  const [reservationToDelete, setReservationToDelete] = React.useState<Reservation | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Active reservations only
  const activeList = reservations.filter(r => r.status === 'active');

  // Filter logic
  const filteredReservations = activeList.filter(item => {
    if (selectedEntityFilter !== 'all' && item.entityGroup !== selectedEntityFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchGroup = item.entityGroup.toLowerCase().includes(q);
      const matchType = item.eventType.toLowerCase().includes(q);
      const matchName = item.responsibleName.toLowerCase().includes(q);
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDate = item.date.includes(q);
      return matchGroup || matchType || matchName || matchTitle || matchDate;
    }
    return true;
  });

  // Sort by Date & Time ascending
  filteredReservations.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  const promptDelete = (res: Reservation) => {
    setReservationToDelete(res);
  };

  const confirmDeleteAction = async () => {
    if (!reservationToDelete) return;
    setIsDeleting(true);
    try {
      await deleteReservation(reservationToDelete.id);
      speakText('Agendamento excluído com sucesso.', speechSpeed);
      onRefresh();
    } catch (err) {
      console.error('Error deleting reservation:', err);
      alert('Erro ao excluir agendamento no banco de dados.');
    } finally {
      setIsDeleting(false);
      setReservationToDelete(null);
    }
  };

  const handleSpeakReservation = (res: Reservation) => {
    const [y, m, d] = res.date.split('-');
    const text = `Agendamento para ${res.entityGroup}. Atividade: ${res.eventType}. Data: dia ${d} do mês ${m}. Horário: das ${res.startTime} às ${res.endTime}. Responsável: ${res.responsibleName}.`;
    speakText(text, speechSpeed);
  };

  const handleShareWhatsApp = (res: Reservation) => {
    const msg = formatWhatsAppMessage(res);
    openWhatsAppSharing(msg, whatsAppConfig.phoneOrLink);
  };

  const handleShareAllWhatsApp = () => {
    if (filteredReservations.length === 0) {
      speakText('Não há agendamentos para compartilhar.', speechSpeed);
      return;
    }
    const msg = formatWhatsAppMessage(filteredReservations);
    openWhatsAppSharing(msg, whatsAppConfig.phoneOrLink);
  };

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
              .btn-print { padding: 12px 24px; font-size: 15px; font-weight: 800; background: #059669; color: #fff; border: none; border-radius: 12px; cursor: pointer; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
              .btn-print:hover { background: #047857; }
              @media print {
                .no-print { display: none !important; }
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <div style="text-align: center;" class="no-print">
              <button class="btn-print" onclick="window.print()">
                🖨️ Imprimir Quadro de Avisos
              </button>
            </div>
            <h1>🏠 SALÃO DO REINO DAS TESTEMUNHAS DE JEOVÁ - JUPARANÃ</h1>
            <h2>QUADRO DE AVISOS E RESERVAS DE USO DO SALÃO</h2>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Horário</th>
                  <th>Grupo / Congregação</th>
                  <th>Evento / Atividade</th>
                  <th>Responsável / Contato</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml || '<tr><td colspan="5" style="text-align:center; padding: 30px; font-weight: bold; color: #64748b;">Nenhum agendamento ativo cadastrado.</td></tr>'}
              </tbody>
            </table>
            <p style="margin-top: 35px; font-size: 11px; text-align: center; color: #94a3b8;">
              Documento gerado em ${new Date().toLocaleDateString('pt-BR')} - Sistema de Gestão do Salão do Reino
            </p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        try { printWindow.print(); } catch (e) { console.error(e); }
      }, 300);
    } else {
      window.print();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Top Banner & Print Controls */}
      <div className="bg-slate-900 border-4 border-amber-400 text-white rounded-3xl p-6 shadow-xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-md uppercase tracking-wider">
            Agenda do Salão do Reino
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
            Próximos Agendamentos ({filteredReservations.length})
          </h2>
          <p className="text-slate-300 text-sm sm:text-base">
            Horários reservados para reuniões, manutenções e atividades
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={onOpenWizard}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl border-2 border-emerald-300 shadow-lg text-base"
          >
            <PlusCircle className="w-6 h-6" />
            <span>Novo Agendamento</span>
          </button>

          <button
            onClick={() => setShowWeeklyModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-extrabold rounded-2xl border-2 border-amber-400/80 text-sm shadow-md transition-all"
            title="Ver Tabela de Dias Fixos de Reunião"
          >
            <CalendarIcon className="w-5 h-5 text-amber-400" />
            <span>Dias Fixos ({weeklySchedules.length})</span>
          </button>

          <button
            onClick={handleShareAllWhatsApp}
            className="flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl border-2 border-emerald-400 text-sm shadow-md"
            title="Enviar toda a agenda no WhatsApp"
          >
            <Share2 className="w-5 h-5 text-emerald-200" />
            <span>Enviar no WhatsApp</span>
          </button>

          <button
            onClick={handlePrintSchedule}
            className="flex items-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl border-2 border-amber-300 text-sm shadow-md transition-all"
            title="Imprimir quadro de avisos"
          >
            <Printer className="w-5 h-5 text-slate-950" />
            <span className="inline">Imprimir Quadro</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border-4 border-slate-300 rounded-3xl p-5 shadow-lg mb-6 space-y-4 no-print">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-6 h-6 text-slate-400 absolute left-4 top-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por grupo, irmão responsável, tipo ou data..."
            className="w-full pl-13 pr-4 py-3.5 border-4 border-slate-300 rounded-2xl text-base sm:text-lg font-bold text-slate-900 focus:border-amber-500 focus:ring-4 focus:ring-amber-200"
          />
        </div>

        {/* Entity Filter Badges */}
        <div>
          <span className="text-slate-700 font-extrabold text-sm mb-2 flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-600" />
            Filtrar por Grupo / Congregação:
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => {
                setSelectedEntityFilter('all');
                speakText('Mostrando todas as congregações', speechSpeed);
              }}
              className={`px-4 py-2 rounded-xl font-extrabold text-sm border-2 transition-all ${
                selectedEntityFilter === 'all'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
            >
              Todos os Grupos
            </button>

            {ENTITY_LIST.map((ent) => {
              const isSelected = selectedEntityFilter === ent.id;
              return (
                <button
                  key={ent.id}
                  onClick={() => {
                    setSelectedEntityFilter(ent.id);
                    speakText(`Filtrando por ${ent.name}`, speechSpeed);
                  }}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm border-2 transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-amber-300 border-amber-400 shadow'
                      : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {ent.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reservation Cards List */}
      {filteredReservations.length === 0 ? (
        <div className="bg-slate-50 border-4 border-dashed border-slate-300 rounded-3xl p-10 text-center my-8">
          <CalendarIcon className="w-16 h-16 text-slate-400 mx-auto mb-3" />
          <h3 className="text-2xl font-black text-slate-800">
            Nenhum agendamento encontrado
          </h3>
          <p className="text-slate-600 text-base max-w-md mx-auto mt-1 font-medium">
            O banco de dados está pronto para receber novos agendamentos. Clique no botão verde abaixo para agendar.
          </p>
          <button
            onClick={onOpenWizard}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl border-2 border-emerald-300 text-lg shadow-lg"
          >
            <PlusCircle className="w-6 h-6" />
            <span>Criar Novo Agendamento</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReservations.map((res) => {
            const entInfo = ENTITY_LIST.find(e => e.id === res.entityGroup);
            const [y, m, d] = res.date.split('-');
            const formattedDate = `${d}/${m}/${y}`;

            return (
              <div
                key={res.id}
                className="bg-white border-4 border-slate-300 hover:border-amber-400 rounded-3xl p-5 shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Entity Badge & Date Tag */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-lg font-extrabold text-xs uppercase tracking-wider ${entInfo?.badgeBg || 'bg-slate-800 text-white'}`}>
                      {res.entityGroup}
                    </span>

                    <span className="bg-amber-100 text-amber-950 border-2 border-amber-400 font-black text-sm px-3 py-1 rounded-xl">
                      📅 {formattedDate}
                    </span>
                  </div>

                  {/* Title & Type */}
                  <h3 className="text-xl font-black text-slate-900 leading-snug">
                    {res.eventType}
                  </h3>
                  {res.title && res.title !== res.eventType && (
                    <p className="text-slate-600 text-sm font-semibold mt-0.5 italic">
                      "{res.title}"
                    </p>
                  )}

                  {/* Time Badge */}
                  <div className="mt-3 bg-slate-900 text-amber-400 p-3 rounded-2xl font-black text-lg flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>⏰ das {res.startTime} às {res.endTime}</span>
                  </div>

                  {/* Responsible & Phone */}
                  <div className="mt-4 space-y-1.5 pt-3 border-t-2 border-slate-100 text-slate-800">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <User className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>Responsável: {res.responsibleName}</span>
                    </div>

                    {res.responsiblePhone && (
                      <div className="flex items-center gap-2 font-semibold text-xs text-slate-600">
                        <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{res.responsiblePhone}</span>
                      </div>
                    )}

                    {res.notes && (
                      <p className="text-xs text-slate-500 italic mt-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        Obs: {res.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Action Toolbar */}
                <div className="mt-5 pt-4 border-t-2 border-slate-200 flex items-center justify-between gap-2 no-print">
                  <button
                    onClick={() => handleSpeakReservation(res)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-amber-100 text-slate-800 font-bold rounded-xl text-xs border border-slate-300"
                    title="Ouvir em voz alta"
                  >
                    <Volume2 className="w-4 h-4 text-amber-600" />
                    <span>Ouvir</span>
                  </button>

                  <button
                    onClick={() => handleShareWhatsApp(res)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs border border-emerald-400 shadow-sm"
                    title="Enviar no WhatsApp"
                  >
                    <Share2 className="w-4 h-4 text-emerald-200" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => promptDelete(res)}
                    className="flex items-center gap-1 p-2 text-red-600 hover:bg-red-100 rounded-xl border-2 border-red-200 hover:border-red-400 transition-all font-bold text-xs"
                    title="Excluir Agendamento"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Viewing All Fixed Weekly Meetings */}
      {showWeeklyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-4 border-amber-400 rounded-3xl p-6 max-w-xl w-full text-white shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowWeeklyModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 text-amber-400 mb-2">
              <CalendarIcon className="w-8 h-8 shrink-0 text-amber-400" />
              <h3 className="text-2xl font-black text-amber-400">Reuniões Semanais Fixas</h3>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm mb-4 font-medium">
              Horários habituais de reuniões das congregações no Salão do Reino:
            </p>

            {weeklySchedules.length === 0 ? (
              <div className="bg-slate-800 p-6 rounded-2xl text-center border border-slate-700">
                <p className="text-sm text-slate-300 font-bold mb-3">Nenhuma reunião fixa cadastrada.</p>
                <button
                  onClick={() => {
                    setShowWeeklyModal(false);
                    onOpenSettings();
                  }}
                  className="px-4 py-2.5 bg-amber-500 text-slate-950 font-black rounded-xl text-xs"
                >
                  ⚙️ Abrir Configurações para Cadastrar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {weeklySchedules.map((sch) => {
                  const entInfo = ENTITY_LIST.find(e => e.id === sch.entityGroup);
                  return (
                    <div key={sch.id} className="bg-slate-800 p-3.5 rounded-2xl border border-slate-700 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-amber-400 uppercase">📅 {sch.dayOfWeek}</span>
                        <span className={`px-2 py-0.5 rounded font-extrabold ${entInfo?.badgeBg || 'bg-slate-700 text-white'}`}>
                          {sch.entityGroup}
                        </span>
                      </div>
                      <p className="text-sm font-extrabold text-white">{sch.eventType}</p>
                      <p className="text-xs text-amber-300 font-mono font-bold">⏰ das {sch.startTime} às {sch.endTime}</p>
                      {sch.notes && <p className="text-xs text-slate-400 italic">Obs: {sch.notes}</p>}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowWeeklyModal(false);
                  onOpenSettings();
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-xs border border-slate-600 flex items-center gap-1.5"
              >
                <Settings className="w-4 h-4" />
                <span>Cadastrar / Editar no Painel</span>
              </button>

              <button
                onClick={() => setShowWeeklyModal(false)}
                className="px-5 py-2.5 bg-amber-500 text-slate-950 font-black rounded-xl text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {reservationToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-4 border-red-500 rounded-3xl p-6 max-w-md w-full text-white shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setReservationToDelete(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 text-red-400 mb-3">
              <AlertTriangle className="w-8 h-8 shrink-0 text-red-500" />
              <h3 className="text-2xl font-black text-red-400">Excluir Agendamento</h3>
            </div>

            <p className="text-slate-200 text-base mb-2 font-semibold">
              Deseja realmente cancelar e excluir o agendamento de <strong className="text-amber-400">{reservationToDelete.entityGroup}</strong>?
            </p>

            <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700 text-xs text-slate-300 space-y-1 my-4">
              <p><strong>Atividade:</strong> {reservationToDelete.eventType}</p>
              <p><strong>Data:</strong> {reservationToDelete.date.split('-').reverse().join('/')}</p>
              <p><strong>Horário:</strong> das {reservationToDelete.startTime} às {reservationToDelete.endTime}</p>
              <p><strong>Responsável:</strong> {reservationToDelete.responsibleName}</p>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setReservationToDelete(null)}
                className="px-5 py-3 rounded-xl font-extrabold bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 text-slate-200 text-sm"
              >
                Cancelar
              </button>

              <button
                disabled={isDeleting}
                onClick={confirmDeleteAction}
                className="px-5 py-3 rounded-xl font-black bg-red-600 hover:bg-red-500 border-2 border-red-400 text-white text-sm shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-5 h-5" />
                <span>{isDeleting ? 'Excluindo...' : 'Sim, Excluir'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
