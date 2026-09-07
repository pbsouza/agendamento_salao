import { EntityGroup, EventType } from '../types';

export interface EntityInfo {
  id: EntityGroup;
  name: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  iconName: string;
}

export const ENTITY_LIST: EntityInfo[] = [
  {
    id: 'Congregação Juparanã',
    name: 'Congregação Juparanã',
    description: 'Reuniões ordinárias, limpezas e atividades da Congregação Juparanã',
    badgeBg: 'bg-blue-700 text-white',
    badgeText: 'blue',
    borderColor: 'border-blue-600',
    iconName: 'Building2',
  },
  {
    id: 'Congregação Central',
    name: 'Congregação Central',
    description: 'Reuniões ordinárias, limpezas e atividades da Congregação Central',
    badgeBg: 'bg-indigo-700 text-white',
    badgeText: 'indigo',
    borderColor: 'border-indigo-600',
    iconName: 'Landmark',
  },
  {
    id: 'Grupo Espanhol',
    name: 'Grupo Espanhol',
    description: 'Reuniões e atividades em idioma espanhol',
    badgeBg: 'bg-amber-700 text-white',
    badgeText: 'amber',
    borderColor: 'border-amber-600',
    iconName: 'Globe',
  },
  {
    id: 'Viajante',
    name: 'Viajante (Superintendente de Circuito)',
    description: 'Visitas do superintendente de circuito, reuniões com pioneiros e anciãos',
    badgeBg: 'bg-purple-700 text-white',
    badgeText: 'purple',
    borderColor: 'border-purple-600',
    iconName: 'UserCheck',
  },
  {
    id: 'Manutenção',
    name: 'Manutenção',
    description: 'Serviços de reparo, pintura, jardinagem e conservação do prédio',
    badgeBg: 'bg-teal-700 text-white',
    badgeText: 'teal',
    borderColor: 'border-teal-600',
    iconName: 'Wrench',
  },
  {
    id: 'Comissão de Funcionamento',
    name: 'Comissão de Funcionamento',
    description: 'Reuniões administrativas da comissão do Salão do Reino',
    badgeBg: 'bg-slate-800 text-white',
    badgeText: 'slate',
    borderColor: 'border-slate-700',
    iconName: 'ShieldAlert',
  },
  {
    id: 'Associação Jurídica',
    name: 'Associação Jurídica',
    description: 'Assembleias, reuniões corporativas e assuntos legais da associação',
    badgeBg: 'bg-stone-800 text-white',
    badgeText: 'stone',
    borderColor: 'border-stone-700',
    iconName: 'Scale',
  },
];

export interface EventTypeInfo {
  id: EventType;
  label: string;
  defaultDurationHours: number;
  iconName: string;
}

export const EVENT_TYPES: EventTypeInfo[] = [
  {
    id: 'Reunião do Meio de Semana',
    label: 'Reunião do Meio de Semana',
    defaultDurationHours: 2,
    iconName: 'BookOpen',
  },
  {
    id: 'Reunião de Fim de Semana',
    label: 'Reunião de Fim de Semana',
    defaultDurationHours: 2,
    iconName: 'Users',
  },
  {
    id: 'Limpeza do Salão',
    label: 'Limpeza do Salão',
    defaultDurationHours: 2,
    iconName: 'Sparkles',
  },
  {
    id: 'Manutenção',
    label: 'Manutenção e Reparos',
    defaultDurationHours: 3,
    iconName: 'Wrench',
  },
  {
    id: 'Reunião da Comissão',
    label: 'Reunião da Comissão',
    defaultDurationHours: 2,
    iconName: 'Briefcase',
  },
  {
    id: 'Treinamento / Escola',
    label: 'Treinamento ou Escola',
    defaultDurationHours: 2,
    iconName: 'GraduationCap',
  },
  {
    id: 'Reunião de Grupo',
    label: 'Reunião de Grupo de Saída',
    defaultDurationHours: 1.5,
    iconName: 'MapPin',
  },
  {
    id: 'Visita do Viajante',
    label: 'Visita do Superintendente',
    defaultDurationHours: 3,
    iconName: 'Award',
  },
  {
    id: 'Reunião Trimestral',
    label: 'Reunião Trimestral',
    defaultDurationHours: 2,
    iconName: 'CalendarRange',
  },
  {
    id: 'Outro Uso',
    label: 'Outro Uso Autorizado',
    defaultDurationHours: 2,
    iconName: 'CalendarPlus',
  },
];
