import React from 'react';
import { 
  X, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  PlusCircle, 
  Share2, 
  Building2
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = React.useState(0);

  const steps = [
    {
      title: '1. O que é este aplicativo?',
      icon: Building2,
      iconColor: 'text-amber-400 bg-amber-500/20 border-amber-500/40',
      description: 'Este sistema foi feito de forma muito simples para você agendar horários do Salão do Reino da Congregação Juparanã e demais congregações.',
      details: [
        'Organiza reuniões, limpezas, manutenções e visitas do viajante.',
        'Evita conflitos de horário entre congregações e reuniões fixas.',
        'Arquiva os agendamentos antigos automaticamente.'
      ]
    },
    {
      title: '2. Como fazer um agendamento?',
      icon: PlusCircle,
      iconColor: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40',
      description: 'O processo é guiado passo a passo em telas bem explicadas:',
      details: [
        'Passo 1: Escolha sua congregação ou comissão.',
        'Passo 2: Escolha a atividade (reunião, limpeza, manutenção, etc.).',
        'Passo 3: Selecione o dia e o horário desejado (com aviso imediato de conflitos).',
        'Passo 4: Informe o nome do responsável e telefone de contato.',
        'Passo 5: Confirme a reserva e compartilhe com os irmãos!'
      ]
    },
    {
      title: '3. Visão do Calendário Mensal',
      icon: CalendarIcon,
      iconColor: 'text-sky-400 bg-sky-500/20 border-sky-500/40',
      description: 'Veja todos os agendamentos organizados mês a mês:',
      details: [
        'Navegue entre os meses usando as setas ou vá direto para "Hoje".',
        'Filtre por congregação específica para ver apenas os eventos do seu grupo.',
        'Clique em qualquer dia do calendário para ver todos os detalhes ou agendar diretamente para aquela data.',
        'Alterne entre a visão mensal em grade ou em lista/cartões quando preferir.'
      ]
    },
    {
      title: '4. Aviso no WhatsApp do Grupo',
      icon: Share2,
      iconColor: 'text-green-400 bg-green-500/20 border-green-500/40',
      description: 'Envie a lista completa ou a confirmação no WhatsApp com um clique:',
      details: [
        'Ao concluir um agendamento, o botão verde de WhatsApp envia a lista de todos os agendamentos ativos para o grupo.',
        'Você também pode clicar no botão "Enviar no WhatsApp" na tela inicial a qualquer momento.',
        'Configure o nome do grupo e o link nas Configurações no topo da página.'
      ]
    }
  ];

  const stepData = steps[currentStep];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-4 border-amber-400 text-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-300 p-3 rounded-full border-2 border-slate-600 focus:ring-4 focus:ring-amber-400"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 border-b border-slate-800 pb-4">
          <span className="bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-md uppercase tracking-wider">
            Tutorial de Ajuda
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-amber-400 mt-2">
            Como Usar o Aplicativo
          </h2>
          <p className="text-slate-300 text-sm sm:text-base">
            Instruções simples de navegação para irmãos e irmãs
          </p>
        </div>

        {/* Card Content */}
        <div className="bg-slate-800/90 border-2 border-slate-700 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-2xl border-2 ${stepData.iconColor}`}>
              <stepData.icon className="w-8 h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-amber-300">
              {stepData.title}
            </h3>
          </div>

          <p className="text-slate-100 text-base sm:text-lg font-medium leading-relaxed mb-4">
            {stepData.description}
          </p>

          <ul className="space-y-3">
            {stepData.details.map((detail, idx) => (
              <li key={idx} className="flex items-start gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-700">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-slate-200 text-sm sm:text-base font-semibold">
                  {detail}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Step Indicators & Navigation */}
        <div className="mt-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`w-3.5 h-3.5 rounded-full transition-all ${
                  idx === currentStep
                    ? 'bg-amber-400 scale-125 ring-2 ring-amber-300'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
            <span className="text-slate-400 text-xs font-extrabold ml-2">
              Passo {currentStep + 1} de {steps.length}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold rounded-xl border-2 border-slate-600 text-base"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Anterior</span>
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl border-2 border-amber-300 text-base shadow-lg"
              >
                <span>Próximo</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl border-2 border-emerald-300 text-base shadow-lg"
              >
                <span>Entendi! Começar a Usar</span>
                <CheckCircle2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

