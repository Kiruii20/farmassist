'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type CaseRow = {
  id: string;
  farmer_name: string;
  farmer_phone: string;
  channel: string;
  crop: string;
  onset_timing: string | null;
  symptoms: string | null;
  photo_url: string | null;
  ai_possible_causes: string | null;
  ai_confidence: number | null;
  ai_reasoning: string | null;
  ai_safe_next_step: string | null;
  status: string;
  officer_decision: string | null;
  officer_note: string | null;
  created_at: string;
};

export default function OfficerPage() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [smsPhone, setSmsPhone] = useState('+254712345678');
  const [smsText, setSmsText] = useState(
    'Mahindi/kilo: Nakuru Town KSh58, Molo KSh56. Thibitisha bei kabla ya kuuza. -Grace'
  );
  const [smsStatus, setSmsStatus] = useState('');

  async function loadCases() {
    const { data } = await supabase
      .from('diagnostic_cases')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setCases(data);
      if (!selectedId && data[0]) setSelectedId(data[0].id);
    }
  }

  useEffect(() => {
    loadCases();

    const channel = supabase
      .channel('realtime-cases')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'diagnostic_cases' },
        () => loadCases()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const activeCase = cases.find((c) => c.id === selectedId) || cases[0] || null;

  async function decideCase(decision: 'Confirmed' | 'Corrected' | 'Escalated') {
    if (!activeCase) return;
    const nextStatus = decision === 'Escalated' ? 'escalated' : 'reviewed';

    await supabase
      .from('diagnostic_cases')
      .update({
        status: nextStatus,
        officer_decision: decision,
        officer_note: note || `${decision} by Grace Achieng`,
      })
      .eq('id', activeCase.id);

    setNote('');
    loadCases();
  }

  async function sendBroadcastSms(e: React.FormEvent) {
    e.preventDefault();
    setSmsStatus('Sending...');
    const res = await fetch('/api/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: smsPhone, message: smsText }),
    });
    const data = await res.json();
    setSmsStatus(res.ok ? 'SMS sent!' : `Error: ${data.error || 'Failed'}`);
  }

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-xs font-bold text-[var(--pr)] underline">
            ← All Roles
          </Link>
          <h1 className="text-2xl font-bold mt-1">County Extension Console · Grace Achieng</h1>
        </div>
        <span className="rounded-full bg-[var(--pr2)] text-[var(--pr)] text-xs font-bold px-3 py-1">
          Live Realtime Sync
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-[var(--sf)] border border-[var(--bd)] p-4">
          <h2 className="font-bold text-base mb-3">Case Queue ({cases.length})</h2>
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {cases.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left rounded-xl border p-3 ${
                  activeCase?.id === c.id
                    ? 'border-[var(--pr)] bg-[var(--pr2)]'
                    : 'border-[var(--bd)] bg-[var(--bg)]'
                }`}
              >
                <div className="flex justify-between items-center">
                  <b>{c.farmer_name}</b>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--wn2)] text-[var(--wn)]">
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--mu)] mt-0.5">
                  {c.crop} · {c.channel.toUpperCase()} · {c.farmer_phone}
                </p>
              </button>
            ))}
            {cases.length === 0 && (
              <p className="text-sm text-[var(--mu)]">No cases yet. Submit one from John or Mary.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--sf)] border border-[var(--bd)] p-4 space-y-3">
          <h2 className="font-bold text-base">Case Review &amp; AI Reasoning</h2>
          {activeCase ? (
            <>
              <div className="text-sm">
                <b>{activeCase.farmer_name}</b> ({activeCase.farmer_phone}) · <b>{activeCase.crop}</b>
                <p className="text-xs text-[var(--mu)]">
                  Timing: {activeCase.onset_timing || 'N/A'} · AI Confidence:{' '}
                  {activeCase.ai_confidence ?? 40}%
                </p>
              </div>
              {activeCase.photo_url && (
                <img
                  src={activeCase.photo_url}
                  alt="Farmer crop submission"
                  className="h-36 w-full object-cover rounded-xl"
                />
              )}
              <div className="rounded-xl bg-[var(--bg)] p-3 text-xs space-y-1">
                <p>
                  <b>Possible causes:</b> {activeCase.ai_possible_causes}
                </p>
                <p>
                  <b>AI reasoning:</b> {activeCase.ai_reasoning}
                </p>
                <p>
                  <b>Safe next step:</b> {activeCase.ai_safe_next_step}
                </p>
                {activeCase.officer_decision && (
                  <p className="text-[var(--pr)] font-bold">
                    Decision: {activeCase.officer_decision} — {activeCase.officer_note}
                  </p>
                )}
              </div>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add advice or field note for the farmer..."
                className="w-full rounded-xl border border-[var(--bd)] bg-[var(--bg)] p-2 text-sm"
              />
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => decideCase('Confirmed')}
                  className="rounded-xl bg-[var(--pr)] text-[var(--prx)] py-2 text-xs font-bold"
                >
                  Confirm
                </button>
                <button
                  onClick={() => decideCase('Corrected')}
                  className="rounded-xl border border-[var(--bd)] bg-[var(--bg)] py-2 text-xs font-bold"
                >
                  Correct
                </button>
                <button
                  onClick={() => decideCase('Escalated')}
                  className="rounded-xl border border-[var(--bd)] bg-[var(--wn2)] text-[var(--wn)] py-2 text-xs font-bold"
                >
                  Escalate
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--mu)]">Select a case on the left.</p>
          )}
        </div>
      </div>

      <form
        onSubmit={sendBroadcastSms}
        className="rounded-2xl bg-[var(--sf)] border border-[var(--bd)] p-4 space-y-3"
      >
        <h2 className="font-bold text-base">Quick SMS Advisory (Kiswahili / English)</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            value={smsPhone}
            onChange={(e) => setSmsPhone(e.target.value)}
            placeholder="+2547..."
            className="rounded-xl border border-[var(--bd)] bg-[var(--bg)] p-2.5 text-sm"
          />
          <input
            value={smsText}
            onChange={(e) => setSmsText(e.target.value)}
            maxLength={160}
            className="sm:col-span-2 rounded-xl border border-[var(--bd)] bg-[var(--bg)] p-2.5 text-sm"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--mu)]">{smsText.length}/160 characters</span>
          <button
            type="submit"
            className="rounded-xl bg-[var(--pr)] text-[var(--prx)] px-4 py-2 text-xs font-bold"
          >
            Send SMS via Africa&apos;s Talking
          </button>
        </div>
        {smsStatus && <p className="text-xs font-bold text-[var(--pr)]">{smsStatus}</p>}
      </form>
    </div>
  );
}