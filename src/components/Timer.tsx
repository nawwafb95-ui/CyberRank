import React from 'react';
import { showToast } from '../lib/toast';

export function useDeadline(durationMs: number, persistKey: string) {
  const [deadline, setDeadline] = React.useState<number>(() => {
    const saved = Number(localStorage.getItem(persistKey) || 0);
    const now = Date.now();
    if (saved && saved > now) return saved;
    const next = now + durationMs;
    localStorage.setItem(persistKey, String(next));
    return next;
  });
  const remainingMs = Math.max(0, deadline - Date.now());
  const isExpired = remainingMs <= 0;
  return { deadline, remainingMs, isExpired, reset: () => setDeadline(Date.now() + durationMs) };
}

export function Timer({ deadline }: { deadline: number }) {
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 500);
    return () => clearInterval(id);
  }, []);
  const rem = Math.max(0, deadline - Date.now());
  const mm = String(Math.floor(rem / 60000)).padStart(2, '0');
  const ss = String(Math.floor((rem % 60000) / 1000)).padStart(2, '0');
  return <div className="timer">{mm}:{ss}</div>;
}

export function validateDeadline(deadline: number) {
  if (Date.now() > deadline) {
    showToast('Time expired. Auto-skipped.');
    return false;
  }
  return true;
}


