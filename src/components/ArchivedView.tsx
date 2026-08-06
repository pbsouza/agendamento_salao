import React from 'react';
import { Archive, Calendar, Clock, Trash2, Volume2, Info, AlertTriangle, X } from 'lucide-react';
import { Reservation } from '../types';
import { deleteReservation } from '../utils/storage';
import { speakText } from '../utils/speech';

interface ArchivedViewProps {
  reservations: Reservation[];
  onRefresh: () => void;
  speechSpeed: number;
}

export const ArchivedView: React.FC<ArchivedViewProps> = ({
  reservations,
  onRefresh,
  speechSpeed,
}) => {
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = React.useState(false);
  const [showClearAllModal, setShowClearAllModal] = React.useState(false);

  const archivedList = reservations.filter(r => r.status === 'archived');

  const confirmClearAllArchived = async () => {
    setIsDeletingAll(true);
    try {
      for (const res of archivedList) {
        await deleteReservation(res.id);
      }
      speakText('Histórico de arquivados limpo com sucesso.', speechSpeed);
      onRefresh();
    } catch (err) {
      console.error('Error clearing archived:', err);
    } finally {
      setIsDeletingAll(false);
      setShowClearAllModal(false);
    }
  };

  const confirmDeleteSingle = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteReservation(deleteTargetId);
      speakText('Agendamento removido do histórico.', speechSpeed);
      onRefresh();
    } catch (err) {
      console.error('Error deleting archived reservation:', err);
    } finally {
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border-4 border-slate-700 text-white rounded-3xl p-6 shadow-xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="bg-slate-700 text-slate-200 font-black text-xs px-3 py-1 rounded-md uppercase tracking-wider">
            Histórico Automático
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
            Agendamentos Arquivados ({archivedList.length})
          </h2>
          <p className="text-slate-300 text-sm sm:text-base">
            À medida que as datas passam, os registros são mantidos aqui para consulta
          </p>
        </div>

        {archivedList.length > 0 && (
          <button
            onClick={() => setShowClearAllModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-red-900/80 hover:bg-red-800 text-red-100 font-extrabold rounded-2xl border-2 border-red-700 text-sm transition-all"
          >
            <Trash2 className="w-5 h-5 text-red-300" />
            <span>Limpar Todo o Histórico</span>
          </button>
        )}
      </div>

      {/* Info Notice */}
      <div className="bg-sky-50 border-4 border-sky-400 text-sky-950 p-4 rounded-2xl mb-6 flex items-start gap-3">
        <Info className="w-6 h-6 text-sky-600 shrink-0 mt-0.5" />
        <p className="text-sm font-semibold leading-relaxed">
          <strong>Arquivamento Automático:</strong> O aplicativo verifica os horários continuamente. Sempre que o horário de término de um agendamento é ultrapassado, o registro é movido para este histórico de forma a manter a tela principal limpa e focada apenas nas próximas reuniões.
        </p>
      </div>

      {/* List */}
      {archivedList.length === 0 ? (
        <div className="bg-white border-4 border-slate-300 rounded-3xl p-10 text-center my-8">
          <Archive className="w-16 h-16 text-slate-400 mx-auto mb-3" />
          <h3 className="text-2xl font-black text-slate-800">
            Nenhum agendamento arquivado
          </h3>
          <p className="text-slate-600 text-base max-w-md mx-auto mt-1 font-medium">
            Quando os eventos programados forem concluídos, eles aparecerão aqui automaticamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {archivedList.map((res) => {
            const [y, m, d] = res.date.split('-');
            const formattedDate = `${d}/${m}/${y}`;

            return (
              <div
                key={res.id}
                className="bg-slate-100 border-4 border-slate-300 rounded-3xl p-5 shadow opacity-85 hover:opacity-100 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="bg-slate-800 text-slate-200 px-3 py-1 rounded-lg font-bold text-xs uppercase">
                      {res.entityGroup}
                    </span>
                    <span className="text-slate-600 font-extrabold text-sm">
                      📅 {formattedDate}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-800 line-through">
                    {res.eventType}
                  </h3>

                  <p className="text-slate-600 text-sm font-bold mt-1">
                    ⏰ {res.startTime} às {res.endTime}
                  </p>
                  <p className="text-slate-500 text-xs font-semibold mt-1">
                    Responsável: {res.responsibleName}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t-2 border-slate-200 flex items-center justify-between">
                  <button
                    onClick={() => {
                      speakText(`Agendamento arquivado de ${res.entityGroup} no dia ${formattedDate}`, speechSpeed);
                    }}
                    className="flex items-center gap-1 text-slate-700 font-bold text-xs hover:text-slate-900"
                  >
                    <Volume2 className="w-4 h-4 text-slate-500" />
                    <span>Ouvir</span>
                  </button>

                  <button
                    onClick={() => setDeleteTargetId(res.id)}
                    className="flex items-center gap-1 p-2 text-red-600 hover:bg-red-200 rounded-xl transition-all font-bold text-xs"
                    title="Apagar do Histórico"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span>Apagar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Single Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-4 border-red-500 rounded-3xl p-6 max-w-md w-full text-white shadow-2xl relative">
            <h3 className="text-2xl font-black text-red-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              Remover do Histórico
            </h3>
            <p className="text-slate-200 text-sm font-medium mb-6">
              Tem certeza de que deseja apagar permanentemente este agendamento arquivado?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2.5 rounded-xl font-bold bg-slate-800 text-slate-200 border border-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteSingle}
                className="px-4 py-2.5 rounded-xl font-black bg-red-600 hover:bg-red-500 text-white shadow-lg"
              >
                Sim, Apagar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Modal */}
      {showClearAllModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-4 border-red-500 rounded-3xl p-6 max-w-md w-full text-white shadow-2xl relative">
            <h3 className="text-2xl font-black text-red-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              Limpar Todo o Histórico
            </h3>
            <p className="text-slate-200 text-sm font-medium mb-6">
              Esta ação apagará permanentemente todos os registros do histórico arquivado. Deseja continuar?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearAllModal(false)}
                className="px-4 py-2.5 rounded-xl font-bold bg-slate-800 text-slate-200 border border-slate-600"
              >
                Cancelar
              </button>
              <button
                disabled={isDeletingAll}
                onClick={confirmClearAllArchived}
                className="px-4 py-2.5 rounded-xl font-black bg-red-600 hover:bg-red-500 text-white shadow-lg disabled:opacity-50"
              >
                {isDeletingAll ? 'Limpando...' : 'Sim, Limpar Tudo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
