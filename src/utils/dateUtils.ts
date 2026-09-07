import { Reservation } from '../types';

/**
 * Calculates the Tuesday-to-Sunday week period for the Circuit Overseer's visit (Visita do Superintendente).
 * Starts strictly on Tuesday and concludes on Sunday.
 */
export function getCircuitOverseerWeek(referenceDateStr: string): { startDate: string; endDate: string } {
  if (!referenceDateStr || !referenceDateStr.includes('-')) {
    const now = new Date();
    const yr = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const da = String(now.getDate()).padStart(2, '0');
    referenceDateStr = `${yr}-${mo}-${da}`;
  }

  const [y, m, d] = referenceDateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado

  let daysToTuesday = 0;
  if (dayOfWeek === 0) {
    // Sunday is the final day of the visit week; the visit started 5 days prior on Tuesday
    daysToTuesday = -5;
  } else if (dayOfWeek === 1) {
    // Monday is the preparation day; the visit begins tomorrow on Tuesday
    daysToTuesday = 1;
  } else {
    // Tuesday (2) through Saturday (6): Tuesday is (2 - dayOfWeek)
    daysToTuesday = 2 - dayOfWeek;
  }

  const tuesday = new Date(y, m - 1, d + daysToTuesday);
  const sunday = new Date(tuesday.getFullYear(), tuesday.getMonth(), tuesday.getDate() + 5);

  const formatDate = (dt: Date): string => {
    const yr = dt.getFullYear();
    const mo = String(dt.getMonth() + 1).padStart(2, '0');
    const da = String(dt.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  return {
    startDate: formatDate(tuesday),
    endDate: formatDate(sunday),
  };
}

/**
 * Checks if a specific calendar day is covered by a reservation (supporting single day or multi-day range).
 */
export function isDateInReservation(res: Reservation, targetDateStr: string): boolean {
  if (res.endDate) {
    return targetDateStr >= res.date && targetDateStr <= res.endDate;
  }
  return res.date === targetDateStr;
}

/**
 * Formats a friendly date display for reservations, highlighting the Tuesday to Sunday week for visits.
 */
export function formatReservationDateDisplay(res: Reservation): string {
  const [sy, sm, sd] = res.date.split('-');
  if (!res.endDate || res.endDate === res.date) {
    return `${sd}/${sm}/${sy}`;
  }

  const [ey, em, ed] = res.endDate.split('-');
  if (sm === em && sy === ey) {
    return `${sd} a ${ed}/${sm}/${sy} (Terça a Domingo)`;
  }
  return `${sd}/${sm} a ${ed}/${em}/${ey} (Terça a Domingo)`;
}
