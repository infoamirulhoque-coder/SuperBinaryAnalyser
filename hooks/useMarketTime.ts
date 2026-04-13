import { useState, useEffect, useCallback, useRef } from 'react';

// Bangladesh Timezone: UTC+6
const BD_OFFSET = 6 * 60 * 60 * 1000;

export interface SessionInfo {
  name: string;
  isActive: boolean;
  color: string;
  opens: string;  // HH:MM UTC
  closes: string;
}

export interface TimeInfo {
  bdTime: string;
  utcTime: string;
  bdDate: string;
  sessions: SessionInfo[];
  activeSessions: string[];
}

const getUTCHour = () => new Date().getUTCHours() + new Date().getUTCMinutes() / 60;

const SESSIONS: Array<{ name: string; start: number; end: number; color: string; opens: string; closes: string }> = [
  { name: 'Sydney', start: 22, end: 7, color: '#10B981', opens: '22:00', closes: '07:00' },
  { name: 'Tokyo', start: 0, end: 9, color: '#F59E0B', opens: '00:00', closes: '09:00' },
  { name: 'London', start: 8, end: 17, color: '#3B82F6', opens: '08:00', closes: '17:00' },
  { name: 'New York', start: 13, end: 22, color: '#EF4444', opens: '13:00', closes: '22:00' },
];

const isSessionActive = (start: number, end: number, utcHour: number): boolean => {
  if (start < end) return utcHour >= start && utcHour < end;
  return utcHour >= start || utcHour < end;
};

const formatTime = (date: Date, offsetMs: number = 0): string => {
  const adjusted = new Date(date.getTime() + offsetMs);
  const h = adjusted.getUTCHours().toString().padStart(2, '0');
  const m = adjusted.getUTCMinutes().toString().padStart(2, '0');
  const s = adjusted.getUTCSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const formatDate = (date: Date, offsetMs: number = 0): string => {
  const adjusted = new Date(date.getTime() + offsetMs);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[adjusted.getUTCDay()]}, ${adjusted.getUTCDate()} ${months[adjusted.getUTCMonth()]} ${adjusted.getUTCFullYear()}`;
};

export function useMarketTime() {
  const [timeInfo, setTimeInfo] = useState<TimeInfo>(() => {
    const now = new Date();
    const utcHour = getUTCHour();
    const sessions = SESSIONS.map((s) => ({
      name: s.name,
      isActive: isSessionActive(s.start, s.end, utcHour),
      color: s.color,
      opens: s.opens,
      closes: s.closes,
    }));
    return {
      bdTime: formatTime(now, BD_OFFSET),
      utcTime: formatTime(now),
      bdDate: formatDate(now, BD_OFFSET),
      sessions,
      activeSessions: sessions.filter((s) => s.isActive).map((s) => s.name),
    };
  });

  const update = useCallback(() => {
    const now = new Date();
    const utcHour = getUTCHour();
    const sessions = SESSIONS.map((s) => ({
      name: s.name,
      isActive: isSessionActive(s.start, s.end, utcHour),
      color: s.color,
      opens: s.opens,
      closes: s.closes,
    }));
    setTimeInfo({
      bdTime: formatTime(now, BD_OFFSET),
      utcTime: formatTime(now),
      bdDate: formatDate(now, BD_OFFSET),
      sessions,
      activeSessions: sessions.filter((s) => s.isActive).map((s) => s.name),
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [update]);

  return timeInfo;
}
