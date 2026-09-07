export type EntityGroup = 
  | 'Congregação Juparanã'
  | 'Congregação Central'
  | 'Grupo Espanhol'
  | 'Viajante'
  | 'Manutenção'
  | 'Comissão de Funcionamento'
  | 'Associação Jurídica';

export type EventType =
  | 'Reunião do Meio de Semana'
  | 'Reunião de Fim de Semana'
  | 'Limpeza do Salão'
  | 'Manutenção'
  | 'Reunião da Comissão'
  | 'Treinamento / Escola'
  | 'Reunião de Grupo'
  | 'Visita do Viajante'
  | 'Reunião Trimestral'
  | 'Outro Uso';

export interface Reservation {
  id: string;
  entityGroup: EntityGroup;
  eventType: EventType;
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (opcional: término para períodos como Visita do Superintendente de Terça a Domingo)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  responsibleName: string;
  responsiblePhone: string;
  notes: string;
  createdAt: string;
  status: 'active' | 'archived';
  whatsappSent?: boolean;
}

export interface AccessibilitySettings {
  fontSize: 'normal' | 'large' | 'extra-large';
  highContrast: boolean;
  autoReadSteps: boolean;
  speechSpeed: number; // 0.8 to 1.2
}

export interface WhatsAppConfig {
  groupName: string;
  phoneOrLink: string;
  autoOpenWhatsapp: boolean;
}

export interface WeeklySchedule {
  id: string;
  dayOfWeek: string; // e.g., 'Segunda-feira', 'Terça-feira', etc.
  dayIndex: number; // 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado
  entityGroup: EntityGroup;
  eventType: EventType;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  notes?: string;
}

