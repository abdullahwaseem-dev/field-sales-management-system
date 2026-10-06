import { useEffect, useState } from 'react';
import { streamEvents } from '@/lib/api';

export interface LiveRow {
  employee_id: string;
  full_name_en: string;
  full_name_ar: string;
  team_en: string | null;
  team_ar: string | null;
  lat: number;
  lng: number;
  accuracy_m: number | null;
  recorded_at: string;
  event_id: string;
  status: 'present' | 'late' | 'absent' | 'suspected_fake' | 'confirmed_fake' | 'on_leave';
  check_in_at: string;
}

/** Live positions of on-duty reps: snapshot, then pushed updates (FR-DSH-01; within seconds of a ping). */
export function useLivePositions() {
  const [rows, setRows] = useState<Map<string, LiveRow>>(new Map());
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const ac = new AbortController();
    let retry: ReturnType<typeof setTimeout>;
    const connect = () => {
      streamEvents('/location/live/stream', (event, data) => {
        setConnected(true);
        setRows((prev) => {
          const next = new Map(prev);
          if (event === 'snapshot') {
            next.clear();
            for (const r of data as LiveRow[]) next.set(r.employee_id, r);
          } else if (event === 'update') next.set((data as LiveRow).employee_id, data as LiveRow);
          else if (event === 'remove') next.delete((data as { employee_id: string }).employee_id);
          return next;
        });
      }, ac.signal).catch(() => {
        setConnected(false);
        if (!ac.signal.aborted) retry = setTimeout(connect, 5_000);
      });
    };
    connect();
    return () => {
      ac.abort();
      clearTimeout(retry);
    };
  }, []);
  return { rows: [...rows.values()], connected };
}

export const initials = (name: string, arabic: boolean) =>
  arabic ? name.trim().charAt(0) : name.split(/[\s-]+/).filter((p) => p && p !== 'Al').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
