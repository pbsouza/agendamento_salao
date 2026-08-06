import { EntityGroup, Reservation } from '../types';

export function getEntityEmoji(entity: EntityGroup): string {
  switch (entity) {
    case 'Congregação Central':
      return '🟨';
    case 'Congregação Juparanã':
      return '🟥';
    case 'Grupo Espanhol':
      return '🟩';
    case 'Viajante':
      return '🟦';
    case 'Manutenção':
      return '🟫';
    case 'Associação Jurídica':
      return '⬜';
    case 'Comissão de Funcionamento':
      return '🟧';
    default:
      return '🟩';
  }
}

export function getShortEntityName(entity: EntityGroup): string {
  switch (entity) {
    case 'Congregação Central':
      return 'Central';
    case 'Congregação Juparanã':
      return 'Juparanã';
    default:
      return entity;
  }
}

export function formatWhatsAppMessage(input: Reservation | Reservation[]): string {
  const items = Array.isArray(input) ? input : [input];
  if (items.length === 0) return '';

  const firstDateYear = items[0].date ? items[0].date.split('-')[0] : '2026';

  let bodyText = `*RESERVAS DO SALÃO ${firstDateYear}*⬇️\n\n`;

  items.forEach((res, idx) => {
    const emoji = getEntityEmoji(res.entityGroup);
    const shortEntity = getShortEntityName(res.entityGroup);
    const [, month, day] = res.date.split('-');
    const dateFormatted = `${day}/${month}`;
    const eventName = res.title && res.title.trim() ? res.title : res.eventType;

    bodyText += `${emoji} = ${shortEntity} (${res.responsibleName})\n`;
    bodyText += `🗓️ ${dateFormatted}\n`;
    bodyText += `🕞 ${res.startTime}\n`;
    bodyText += `Evento: ${eventName}`;

    if (idx < items.length - 1) {
      bodyText += '\n\n-+-+-+-+-+-+-+-+-+-+-+-\n\n';
    }
  });

  bodyText += `\n\n\n*Obs.: Favor atualizarem sempre que aprovado por data.*\n\n`;
  bodyText += `*Legenda:*\n`;
  bodyText += `🟨 = Central \n`;
  bodyText += `🟥 = Juparanã \n`;
  bodyText += `🟩 = Grupo Espanhol \n`;
  bodyText += `🟦 = Viajante\n`;
  bodyText += `🟫 = Manutenção\n`;
  bodyText += `⬜ = Associação Jurídica`;

  return bodyText;
}

export function openWhatsAppSharing(message: string, phoneOrLink?: string) {
  const encodedText = encodeURIComponent(message);
  
  if (phoneOrLink && phoneOrLink.startsWith('https://chat.whatsapp.com/')) {
    // Group link directly
    window.open(phoneOrLink, '_blank');
    return;
  }

  if (phoneOrLink && phoneOrLink.trim().length > 5) {
    const cleanPhone = phoneOrLink.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank');
    return;
  }

  // Default web share link for WhatsApp
  window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
}

