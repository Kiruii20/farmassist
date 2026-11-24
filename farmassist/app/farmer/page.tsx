'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  supabase,
  saveOfflineCase,
  getPendingCount,
  syncPendingCases,
} from '@/lib/supabase';

type MarketRow = {
  id: string;
  market_name: string;
  produce: string;
  price_per_kg: number;
  distance_km: number;
  demand_level: string;
};

type DiagnosisResult = {
  possibleCauses: string;
  confidence: number;
  reasoning: string;
  safeNextStep: string;
};

export default function FarmerPage() {
  const [lang, setLang] = useState<'en' | 'sw'>('en');
  const [tab, setTab] = useState<'home' | 'crop' | 'market'>('home');
  const [farmerName, setFarmerName] = useState('John Mwangi');
  const [farmerPhone, setFarmerPhone] = useState('+254712345678');
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [toast, setToast] = useState('');

  // Crop check state
  const [crop, setCrop] = useState('Tomatoes');
  const [onsetTiming, setOnsetTiming] = useState('2–3 days ago');
  const [symptoms, setSymptoms] = useState('');
  const [consent, setConsent] = useState(false);
  const [imageBase64, setImageBase64] = useState('');
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [previewUrl, setPreviewUrl] = useState('');
  const [loadingDiag, setLoadingDiag] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  // Market state
  const [produce, setProduce] = useState('Maize');
  const [bags, setBags] = useState(10);
  const [transportRate, setTransportRate] = useState(2);
  const [markets, setMarkets] = useState<MarketRow[]>([]);

  const t = (en: string, sw: string) => (lang === 'sw' ? sw : en);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    setPendingCount(getPendingCount());

    const handleOnline = async () => {
      setIsOffline(false);
      const sent = await syncPendingCases();
      setPendingCount(getPendingCount());
      if (sent > 0) {
        setToast(
          t(
            `Back online. ${sent} waiting item(s) synced!`,
            `Umerudi mtandaoni. Vitu ${sent} vimetumwa!`
          )
        );
        setTimeout(() => setToast(''), 4500);
      }
    };

    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load cached or live market prices
    const cached = localStorage.getItem('farmassist_markets');
    if (cached) setMarkets(JSON.parse(cached));

    supabase
      .from('market_prices')
      .select('*')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setMarkets(data);
          localStorage.setItem('farmassist_markets', JSON.stringify(data));
        }
      });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [lang]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMimeType(file.type || 'image/jpeg');
    setPreviewUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result || '').split(',')[1] || '';
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }

  async function submitCropCheck(e: React.FormEvent) {
    e.preventDefault();
    if (previewUrl && !consent) {
      alert(
        t(
          'Please tick consent under the Data Protection Act, 2019 before sending a photo.',
          'Tafadhali weka alama ya idhini chini ya Sheria ya Ulinzi wa Data, 2019 kabla ya kutuma picha.'
        )
      );
      return;
    }

    const payload = {
      farmerName,
      farmerPhone,
      crop,
      onsetTiming,
      symptoms,
      imageBase64: imageBase64 || undefined,
      mimeType: imageBase64 ? mimeType : undefined,
      photoUrl: previewUrl || null,
      consentGranted: consent,
    };

    if (isOffline || !navigator.onLine) {
      const count = saveOfflineCase(payload);
      setPendingCount(count);
      setResult({
        possibleCauses: t(
          'Dark spots can come from blight, bacterial spot, nutrient shortage, or sun scorch.',
          'Madoa meusi yanaweza kutokana na ukungu (blight), bakteria, au upungufu wa virutubisho.'
        ),
        confidence: 40,
        reasoning: t(
          'Saved offline on your phone. Full AI analysis and officer sync will run when connected.',
          'Imehifadhiwa kwenye simu bila mtandao. Uchambuzi kamili utafanyika ukiunganishwa.'
        ),
        safeNextStep: t(
          'Check again in 2 days to see if spots spread before buying spray.',
          'Angalia tena baada ya siku 2 kuona kama madoa yanaenea kabla ya kununua dawa.'
        ),
      });
      return;
    }

    setLoadingDiag(true);
    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.case) {
        setResult({
          possibleCauses: json.case.ai_possible_causes,
          confidence: json.case.ai_confidence,
          reasoning: json.case.ai_reasoning,
          safeNextStep: json.case.ai_safe_next_step,
        });
      }
    } finally {
      setLoadingDiag(false);
    }
  }

  const filteredMarkets = markets
    .filter((m) => m.produce === produce)
    .map((m) => {
      const gross90 = m.price_per_kg * 90 * bags;
      const transportCost = m.distance_km * transportRate * bags;
      const netPerKg = m.price_per_kg - (m.distance_km * transportRate) / 90;
      return { ...m, gross90, transportCost, netPerKg };
    })
    .sort((a, b) => b.netPerKg - a.netPerKg);

  return (
    <div className="min-h-screen max-w-md mx-auto pb-24 px-4 pt-4">
      <div className="flex items-center justify-between mb-3">
        <Link href="/" className="text-xs font-bold text-[var(--pr)] underline">
          ← {t('All Roles', 'Majukumu Yote')}
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOffline((v) => !v)}
            className="text-xs px-3 py-1 rounded-full border border-[var(--bd)] bg-[var(--sf)] font-semibold"
          >
            {isOffline ? t('Offline (Sim)', 'Huna Mtandao') : 'Online'}
          </button>
          <button
            onClick={() => setLang((l) => (l === 'en' ? 'sw' : 'en'))}
            className="text-xs px-3 py-1 rounded-full border border-[var(--bd)] bg-[var(--sf)] font-bold"
          >
            {lang.toUpperCase()}
          </button>
        </div>
      </div>

      {toast && (
        <div className="mb-3 rounded-xl bg-[var(--pr2)] text-[var(--pr)] px-4 py-2.5 text-sm font-semibold">
          {toast}
        </div>
      )}

      {(isOffline || pendingCount > 0) && (
        <div className="mb-3 rounded-xl bg-[var(--wn2)] text-[var(--wn)] px-4 py-2.5 text-xs font-semibold flex justify-between items-center">
          <span>
            {isOffline
              ? t('Offline mode: changes save locally.', 'Huna mtandao: data inahifadhiwa.')
              : t(`${pendingCount} item(s) waiting to sync`, `Vitu ${pendingCount} vinasubiri`)}
          </span>
          {!isOffline && pendingCount > 0 && (
            <button
              onClick={async () => {
                await syncPendingCases();
                setPendingCount(getPendingCount());
              }}
              className="underline font-bold"
            >
              Sync now
            </button>
          )}
        </div>
      )}

      {tab === 'home' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[var(--sf)] border border-[var(--bd)] p-4">
            <p className="text-xs uppercase font-bold text-[var(--mu)]">Njoro, Nakuru County</p>
            <h1 className="text-2xl font-bold mt-0.5">
              {t(`Good morning, ${farmerName.split(' ')[0]}`, `Habari, ${farmerName.split(' ')[0]}`)}
            </h1>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <input
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                className="rounded-lg border border-[var(--bd)] bg-[var(--bg)] px-2.5 py-1.5"
                placeholder="Farmer name"
              />
              <input
                value={farmerPhone}
                onChange={(e) => setFarmerPhone(e.target.value)}
                className="rounded-lg border border-[var(--bd)] bg-[var(--bg)] px-2.5 py-1.5"
                placeholder="+2547..."
              />
            </div>
          </div>

          <div
            className="rounded-3xl p-5 text-white shadow-md"
            style={{ background: 'linear-gradient(140deg, var(--g1), var(--g2))' }}
          >
            <p className="text-xs opacity-85">{t('Today in Njoro', 'Leo Njoro')}</p>
            <p className="text-3xl font-bold mt-1">22° · {t('Light rain', 'Mvua nyepesi')}</p>
            <p className="text-xs mt-2 bg-black/20 rounded-xl p-2.5">
              {t(
                'Rain expected tomorrow. Consider delaying irrigation.',
                'Mvua inatarajiwa kesho. Fikiria kuahirisha kumwagilia.'
              )}
            </p>
          </div>

          <button
            onClick={() => setTab('crop')}
            className="w-full text-left rounded-2xl bg-[var(--sf)] border border-[var(--bd)] p-4 flex items-center justify-between"
          >
            <div>
              <b className="block text-base">{t('Crop health check', 'Kagua afya ya zao')}</b>
              <span className="text-xs text-[var(--mu)]">
                {t('Snap a leaf photo & get AI + officer help', 'Piga picha ya jani upate ushauri')}
              </span>
            </div>
            <span className="rounded-full bg-[var(--or)] text-white text-xs font-bold px-3 py-1.5">
              {t('Start', 'Anza')}
            </span>
          </button>

          <button
            onClick={() => setTab('market')}
            className="w-full text-left rounded-2xl bg-[var(--sf)] border border-[var(--bd)] p-4 flex items-center justify-between"
          >
            <div>
              <b className="block text-base">{t('Compare market prices', 'Linganisha bei za soko')}</b>
              <span className="text-xs text-[var(--mu)]">
                {t('Nakuru Town, Njoro, Molo & Gilgil', 'Nakuru Town, Njoro, Molo na Gilgil')}
              </span>
            </div>
            <span className="rounded-full bg-[var(--pr2)] text-[var(--pr)] text-xs font-bold px-3 py-1.5">
              {t('View', 'Tazama')}
            </span>
          </button>
        </div>
      )}

      {tab === 'crop' && (
        <form onSubmit={submitCropCheck} className="space-y-4">
          <div className="rounded-2xl bg-[var(--sf)] border border-[var(--bd)] p-4 space-y-3">
            <h2 className="text-lg font-bold">{t('Check crop health', 'Kagua afya ya zao')}</h2>

            <div>
              <label className="block text-xs font-bold mb-1">{t('Crop', 'Zao')}</label>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="w-full rounded-xl border border-[var(--bd)] bg-[var(--bg)] p-2.5 text-sm"
              >
                <option value="Tomatoes">{t('Tomatoes', 'Nyanya')}</option>
                <option value="Maize">{t('Maize', 'Mahindi')}</option>
                <option value="Beans">{t('Beans', 'Maharagwe')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                {t('When did you first notice it?', 'Uliliona lini?')}
              </label>
              <select
                value={onsetTiming}
                onChange={(e) => setOnsetTiming(e.target.value)}
                className="w-full rounded-xl border border-[var(--bd)] bg-[var(--bg)] p-2.5 text-sm"
              >
                <option value="Today">{t('Today', 'Leo')}</option>
                <option value="2–3 days ago">{t('2–3 days ago', 'Siku 2–3 zilizopita')}</option>
                <option value="Over a week">{t('Over a week', 'Zaidi ya wiki')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                {t('Leaf photo (optional)', 'Picha ya jani (si lazima)')}
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onFileChange}
                className="w-full text-xs"
              />
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Leaf preview"
                  className="mt-2 h-36 w-full object-cover rounded-xl"
                />
              )}
            </div>

            {previewUrl && (
              <label className="flex items-start gap-2 text-xs text-[var(--mu)]">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  {t(
                    'I agree to share this photo with FarmAssist and extension officers (Data Protection Act, 2019).',
                    'Ninakubali picha hii ishirikiwe na FarmAssist na maafisa wa ugani (Sheria ya Ulinzi wa Data, 2019).'
                  )}
                </span>
              </label>
            )}

            <div>
              <label className="block text-xs font-bold mb-1">
                {t('Extra notes', 'Maelezo ya ziada')}
              </label>
              <input
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder={t('e.g. dark spots on lower leaves', 'mf. madoa meusi chini')}
                className="w-full rounded-xl border border-[var(--bd)] bg-[var(--bg)] p-2.5 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loadingDiag}
              className="w-full rounded-xl bg-[var(--pr)] text-[var(--prx)] py-3 font-bold text-sm disabled:opacity-50"
            >
              {loadingDiag
                ? t('Analyzing...', 'Inachambua...')
                : isOffline
                  ? t('Save offline & sync later', 'Hifadhi bila mtandao')
                  : t('Check crop & send to Grace', 'Kagua na tuma kwa Grace')}
            </button>
          </div>

          {result && (
            <div className="rounded-2xl bg-[var(--wn2)] text-[var(--wn)] p-4 space-y-2 text-sm">
              <p className="text-xs font-bold uppercase">
                {t('Possible causes', 'Sababu zinazowezekana')} ({result.confidence}%)
              </p>
              <p>{result.possibleCauses}</p>
              <p className="text-xs opacity-90">{result.reasoning}</p>
              <div className="rounded-xl bg-[var(--pr2)] text-[var(--pr)] p-3 font-semibold">
                {t('Safe next step', 'Hatua salama')}: {result.safeNextStep}
              </div>
            </div>
          )}
        </form>
      )}

      {tab === 'market' && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-[var(--sf)] border border-[var(--bd)] p-4 grid grid-cols-3 gap-2 text-xs">
            <div>
              <label className="font-bold block mb-1">{t('Produce', 'Zao')}</label>
              <select
                value={produce}
                onChange={(e) => setProduce(e.target.value)}
                className="w-full rounded-lg border border-[var(--bd)] bg-[var(--bg)] p-2"
              >
                <option value="Maize">{t('Maize', 'Mahindi')}</option>
                <option value="Tomatoes">{t('Tomatoes', 'Nyanya')}</option>
                <option value="Beans">{t('Beans', 'Maharagwe')}</option>
              </select>
            </div>
            <div>
              <label className="font-bold block mb-1">{t('Bags (90kg)', 'Magunia')}</label>
              <input
                type="number"
                min={1}
                value={bags}
                onChange={(e) => setBags(Math.max(1, Number(e.target.value) || 1))}
                className="w-full rounded-lg border border-[var(--bd)] bg-[var(--bg)] p-2"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">{t('Rate/km/bag', 'KSh/km')}</label>
              <input
                type="number"
                min={0}
                max={20}
                value={transportRate}
                onChange={(e) => setTransportRate(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-lg border border-[var(--bd)] bg-[var(--bg)] p-2"
              />
            </div>
          </div>

          {filteredMarkets.map((m, idx) => (
            <div
              key={m.id}
              className={`rounded-2xl bg-[var(--sf)] border p-4 ${
                idx === 0 ? 'border-2 border-[var(--pr)]' : 'border-[var(--bd)]'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <b className="text-base">{m.market_name}</b>
                  <p className="text-xs text-[var(--mu)]">
                    {m.distance_km} km · {t('Demand', 'Mahitaji')}: {m.demand_level}
                  </p>
                </div>
                <div className="text-right">
                  <b className="text-lg text-[var(--pr)]">KSh {m.price_per_kg}/kg</b>
                  <p className="text-xs text-[var(--mu)]">
                    {t('Net', 'Halisi')}: KSh {m.netPerKg.toFixed(1)}/kg
                  </p>
                </div>
              </div>
              <p className="text-xs text-[var(--mu)] mt-2 pt-2 border-t border-[var(--bd)]">
                {t('Est. value', 'Thamani')}: KSh {m.gross90.toLocaleString()} ·{' '}
                {t('Transport', 'Usafiri')}: KSh {m.transportCost.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-[var(--sf)] border-t border-[var(--bd)] flex justify-around py-2 max-w-md mx-auto">
        <button
          onClick={() => setTab('home')}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
            tab === 'home' ? 'bg-[var(--pr2)] text-[var(--pr)]' : 'text-[var(--mu)]'
          }`}
        >
          {t('Home', 'Nyumbani')}
        </button>
        <button
          onClick={() => setTab('crop')}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
            tab === 'crop' ? 'bg-[var(--pr2)] text-[var(--pr)]' : 'text-[var(--mu)]'
          }`}
        >
          {t('Crops', 'Mazao')}
        </button>
        <button
          onClick={() => setTab('market')}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
            tab === 'market' ? 'bg-[var(--pr2)] text-[var(--pr)]' : 'text-[var(--mu)]'
          }`}
        >
          {t('Market', 'Soko')}
        </button>
      </nav>
    </div>
  );
}