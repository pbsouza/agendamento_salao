import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AccessibilitySettings, Reservation, WhatsAppConfig, WeeklySchedule } from '../types';

const ACCESSIBILITY_STORAGE_KEY = 'kingdom_hall_accessibility_v1';

const WHATSAPP_CONFIG_KEY = 'kingdom_hall_whatsapp_config_v1';

export const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  fontSize: 'large', // Default to large font for elderly users
  highContrast: false,
  autoReadSteps: true,
  speechSpeed: 1.0,
};

export const DEFAULT_WHATSAPP_CONFIG: WhatsAppConfig = {
  groupName: 'Grupo do Salão do Reino - Juparanã',
  phoneOrLink: '',
  autoOpenWhatsapp: true,
};

const RESERVATIONS_CACHE_KEY = 'kingdom_hall_reservations_cache_v1';
const SCHEDULES_CACHE_KEY = 'kingdom_hall_schedules_cache_v1';

function getCachedReservations(): Reservation[] {
  try {
    const data = localStorage.getItem(RESERVATIONS_CACHE_KEY);
    if (!data) return [];
    const list: Reservation[] = JSON.parse(data);
    return list.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  } catch {
    return [];
  }
}

function setCachedReservations(list: Reservation[]): void {
  try {
    localStorage.setItem(RESERVATIONS_CACHE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Cache write failed:', err);
  }
}

function getCachedSchedules(): WeeklySchedule[] {
  try {
    const data = localStorage.getItem(SCHEDULES_CACHE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setCachedSchedules(list: WeeklySchedule[]): void {
  try {
    localStorage.setItem(SCHEDULES_CACHE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Cache write failed:', err);
  }
}

// Real-time Firestore Subscription for Reservations with Offline Cache Fallback
export function subscribeReservations(
  onData: (reservations: Reservation[]) => void
): () => void {
  // Deliver cached data immediately to prevent blank delay
  const initialCache = getCachedReservations();
  if (initialCache.length > 0) {
    onData(initialCache);
  }

  try {
    const colRef = collection(db, 'reservations');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Reservation[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<Reservation, 'id'>;
          list.push({
            ...data,
            id: docSnap.id,
          });
        });
        // Sort reservations chronologically by date and start time
        list.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
        // Cache locally for offline/fallback use
        setCachedReservations(list);
        // Check and archive past reservations automatically
        checkAndArchivePastReservations(list);
        onData(list);
      },
      (error) => {
        console.warn('Firestore subscription offline/error, using cache:', error);
        onData(getCachedReservations());
      }
    );
  } catch (err) {
    console.warn('Could not initialize reservations subscription, using local cache:', err);
    onData(getCachedReservations());
    return () => {};
  }
}

// Automatically update status to 'archived' in Firestore for past reservations
export async function checkAndArchivePastReservations(
  reservations: Reservation[]
): Promise<Reservation[]> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentDay = String(now.getDate()).padStart(2, '0');
  const currentDateStr = `${currentYear}-${currentMonth}-${currentDay}`;

  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;

  const updatedList: Reservation[] = [];

  for (const res of reservations) {
    if (res.status === 'archived') {
      updatedList.push(res);
      continue;
    }

    let shouldArchive = false;
    if (res.date < currentDateStr) {
      shouldArchive = true;
    } else if (res.date === currentDateStr && res.endTime < currentTimeStr) {
      shouldArchive = true;
    }

    if (shouldArchive) {
      const archivedRes: Reservation = { ...res, status: 'archived' };
      updatedList.push(archivedRes);
      // Asynchronously update in Firestore
      updateReservation(archivedRes).catch((err) =>
        console.error('Failed to auto-archive reservation in Firestore:', err)
      );
    } else {
      updatedList.push(res);
    }
  }

  return updatedList;
}

export async function addReservation(
  reservation: Omit<Reservation, 'id' | 'createdAt' | 'status'>
): Promise<Reservation> {
  const id = 'res-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const newRes: Reservation = {
    ...reservation,
    id,
    createdAt: new Date().toISOString(),
    status: 'active',
  };

  // Immediate local cache update
  const cached = getCachedReservations();
  setCachedReservations([...cached, newRes]);

  try {
    const docRef = doc(db, 'reservations', id);
    await setDoc(docRef, newRes);
  } catch (err) {
    console.warn('Could not save reservation to Firestore, stored in local cache:', err);
  }
  return newRes;
}

export async function updateReservation(reservation: Reservation): Promise<void> {
  const cached = getCachedReservations();
  setCachedReservations(cached.map((r) => (r.id === reservation.id ? reservation : r)));

  try {
    const docRef = doc(db, 'reservations', reservation.id);
    await setDoc(docRef, reservation, { merge: true });
  } catch (err) {
    console.warn('Could not update in Firestore, stored in local cache:', err);
  }
}

export async function deleteReservation(id: string): Promise<void> {
  const cached = getCachedReservations();
  setCachedReservations(cached.filter((r) => r.id !== id));

  try {
    const docRef = doc(db, 'reservations', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Could not delete in Firestore, removed from local cache:', err);
  }
}

export function checkTimeConflict(
  date: string,
  startTime: string,
  endTime: string,
  reservationsList: Reservation[],
  excludeId?: string,
  weeklySchedules?: WeeklySchedule[]
): Reservation | null {
  const activeList = reservationsList.filter((r) => r.status === 'active');

  for (const item of activeList) {
    if (excludeId && item.id === excludeId) continue;
    if (item.date !== date) continue;

    // Time overlap logic: (StartA < EndB) AND (EndA > StartB)
    if (startTime < item.endTime && endTime > item.startTime) {
      return item;
    }
  }

  // Check fixed weekly schedules
  if (weeklySchedules && weeklySchedules.length > 0 && date) {
    const dateObj = new Date(date + 'T12:00:00');
    if (!isNaN(dateObj.getTime())) {
      const dayIndex = dateObj.getDay();

      for (const ws of weeklySchedules) {
        if (ws.dayIndex === dayIndex) {
          if (startTime < ws.endTime && endTime > ws.startTime) {
            return {
              id: ws.id,
              entityGroup: ws.entityGroup,
              eventType: ws.eventType,
              title: `Reunião Ficha (${ws.dayOfWeek})`,
              date: date,
              startTime: ws.startTime,
              endTime: ws.endTime,
              responsibleName: `Dia Fixo (${ws.entityGroup})`,
              responsiblePhone: '',
              notes: ws.notes || 'Horário reservado para reunião semanal fixa do Salão do Reino',
              createdAt: new Date().toISOString(),
              status: 'active',
              whatsappSent: false,
            };
          }
        }
      }
    }
  }

  return null;
}

export function subscribeWeeklySchedules(
  onData: (schedules: WeeklySchedule[]) => void
): () => void {
  const initialCache = getCachedSchedules();
  if (initialCache.length > 0) {
    onData(initialCache);
  }

  try {
    const colRef = collection(db, 'weekly_schedules');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: WeeklySchedule[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<WeeklySchedule, 'id'>;
          list.push({
            ...data,
            id: docSnap.id,
          });
        });
        // Sort by dayIndex then startTime
        list.sort((a, b) => {
          if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
          return a.startTime.localeCompare(b.startTime);
        });
        setCachedSchedules(list);
        onData(list);
      },
      (error) => {
        console.warn('Firestore weekly schedules offline/error, using cache:', error);
        onData(getCachedSchedules());
      }
    );
  } catch (err) {
    console.warn('Could not initialize weekly schedules subscription, using local cache:', err);
    onData(getCachedSchedules());
    return () => {};
  }
}

export async function addWeeklySchedule(
  schedule: Omit<WeeklySchedule, 'id'>
): Promise<WeeklySchedule> {
  const id = 'ws-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const newSchedule: WeeklySchedule = { ...schedule, id };
  const docRef = doc(db, 'weekly_schedules', id);
  await setDoc(docRef, newSchedule);
  return newSchedule;
}

export async function deleteWeeklySchedule(id: string): Promise<void> {
  const docRef = doc(db, 'weekly_schedules', id);
  await deleteDoc(docRef);
}

// Accessibility Settings Storage (stored in localStorage)

export function loadAccessibilitySettings(): AccessibilitySettings {
  try {
    const data = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
    if (!data) return DEFAULT_ACCESSIBILITY;
    return { ...DEFAULT_ACCESSIBILITY, ...JSON.parse(data) };
  } catch {
    return DEFAULT_ACCESSIBILITY;
  }
}

export function saveAccessibilitySettings(settings: AccessibilitySettings): void {
  try {
    localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving accessibility settings:', err);
  }
}

// WhatsApp Config Storage (stored in localStorage)
export function loadWhatsAppConfig(): WhatsAppConfig {
  try {
    const data = localStorage.getItem(WHATSAPP_CONFIG_KEY);
    if (!data) return DEFAULT_WHATSAPP_CONFIG;
    return { ...DEFAULT_WHATSAPP_CONFIG, ...JSON.parse(data) };
  } catch {
    return DEFAULT_WHATSAPP_CONFIG;
  }
}

export function saveWhatsAppConfig(config: WhatsAppConfig): void {
  try {
    localStorage.setItem(WHATSAPP_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving WhatsApp config:', err);
  }
}
