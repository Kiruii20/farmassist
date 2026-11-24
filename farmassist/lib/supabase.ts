import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const QUEUE_KEY = 'farmassist_pending_cases';

export type PendingCasePayload = {
  farmerName: string;
  farmerPhone: string;
  crop: string;
  onsetTiming: string;
  symptoms: string;
  imageBase64?: string;
  mimeType?: string;
  photoUrl?: string | null;
  consentGranted: boolean;
};

export function saveOfflineCase(payload: PendingCasePayload): number {
  if (typeof window === 'undefined') return 0;
  const current: Array<{ id: string; payload: PendingCasePayload }> = JSON.parse(
    localStorage.getItem(QUEUE_KEY) || '[]'
  );
  current.push({ id: crypto.randomUUID(), payload });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(current));
  return current.length;
}

export function getPendingCount(): number {
  if (typeof window === 'undefined') return 0;
  const current = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  return current.length;
}

export async function syncPendingCases(): Promise<number> {
  if (typeof window === 'undefined' || !navigator.onLine) return 0;
  const current: Array<{ id: string; payload: PendingCasePayload }> = JSON.parse(
    localStorage.getItem(QUEUE_KEY) || '[]'
  );
  if (current.length === 0) return 0;

  let uploaded = 0;
  const stillWaiting: Array<{ id: string; payload: PendingCasePayload }> = [];

  for (const item of current) {
    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });
      if (res.ok) uploaded += 1;
      else stillWaiting.push(item);
    } catch {
      stillWaiting.push(item);
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(stillWaiting));
  return uploaded;
}