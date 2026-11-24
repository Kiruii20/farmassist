"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  CloudRain,
  Droplets,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sprout,
  Store,
  Sun,
  Wifi,
  WifiOff,
  AlertTriangle,
} from "lucide-react";

type ToolTab = "diagnose" | "weather" | "irrigation" | "planting" | "market";

type DiagnosisResult = {
  possibleCauses?: Array<{ name: string; likelihood?: string; notes?: string }> | string[];
  confidence?: string | number;
  summary?: string;
  safeNextStep?: string;
  caseId?: string;
};

type QueuedCase = {
  id: string;
  createdAt: string;
  payload: {
    farmerName: string;
    farmerPhone: string;
    crop: string;
    onsetTiming: string;
    symptoms: string;
    imageBase64?: string | null;
    mimeType?: string | null;
  };
};

const QUEUE_KEY = "farmassist_offline_queue";

const MARKET_ROWS = [
  {
    market: "Njoro Local Market",
    distanceKm: 6,
    grossPerBagKes: 3400,
    transportPerBagKes: 180,
    handlingKes: 90,
    demand: "Steady · High buyer turn-out",
  },
  {
    market: "Nakuru Wakulima Wholesale",
    distanceKm: 24,
    grossPerBagKes: 4150,
    transportPerBagKes: 520,
    handlingKes: 160,
    demand: "Strong · Bulk traders active",
  },
  {
    market: "Molo Roadside & Co-op",
    distanceKm: 19,
    grossPerBagKes: 3850,
    transportPerBagKes: 390,
    handlingKes: 120,
    demand: "Moderate · Good for graded sacks",
  },
];

export default function FarmerWorkspacePage() {
  const [activeTab, setActiveTab] = useState<ToolTab>("diagnose");
  const [offlineSim, setOfflineSim] = useState(false);
  const [queue, setQueue] = useState<QueuedCase[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Diagnostic form state
  const [farmerName, setFarmerName] = useState("John Mwangi");
  const [farmerPhone, setFarmerPhone] = useState("+254712345678");
  const [crop, setCrop] = useState("Maize");
  const [onsetTiming, setOnsetTiming] = useState("3–5 days ago");
  const [symptoms, setSymptoms] = useState(
    "Yellowing lower leaves with small pale streaks and leaf-tip wilting after light rain."
  );
  const [consentChecked, setConsentChecked] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  // Market calculator state
  const [bagsCount, setBagsCount] = useState<number>(10);

  // Read URL query params (?tool=... or ?crop=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const toolParam = params.get("tool") as ToolTab | null;
    const cropParam = params.get("crop");
    if (
      toolParam &&
      ["diagnose", "weather", "irrigation", "planting", "market"].includes(toolParam)
    ) {
      setActiveTab(toolParam);
    }
    if (cropParam) {
      setCrop(cropParam);
      setActiveTab("diagnose");
    }
  }, []);

  // Load persisted offline queue
  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setQueue(parsed);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const persistQueue = useCallback((nextQueue: QueuedCase[]) => {
    setQueue(nextQueue);
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(nextQueue));
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const syncOfflineQueue = useCallback(async () => {
    if (queue.length === 0 || offlineSim) return;
    setSyncing(true);
    setErrorMsg(null);
    const remaining: QueuedCase[] = [];
    let syncedCount = 0;

    for (const item of queue) {
      try {
        const res = await fetch("/api/diagnose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });
        if (res.ok) {
          syncedCount += 1;
        } else {
          remaining.push(item);
        }
      } catch {
        remaining.push(item);
      }
    }

    persistQueue(remaining);
    setSyncing(false);
    if (syncedCount > 0) {
      setStatusBanner(
        `Synced ${syncedCount} offline case(s) to FarmAssist & Grace's queue.`
      );
      setTimeout(() => setStatusBanner(null), 4500);
    }
  }, [queue, offlineSim, persistQueue]);

  // Automatically sync when returning from simulated offline mode
  useEffect(() => {
    if (!offlineSim && queue.length > 0 && !syncing) {
      syncOfflineQueue();
    }
  }, [offlineSim, queue.length, syncing, syncOfflineQueue]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMimeType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null;
      if (!dataUrl) return;
      setImagePreview(dataUrl);
      const commaIndex = dataUrl.indexOf(",");
      setImageBase64(commaIndex !== -1 ? dataUrl.slice(commaIndex + 1) : dataUrl);
    };
    reader.readAsDataURL(file);
  }

  async function handleDiagnoseSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setResult(null);

    if (!consentChecked) {
      setErrorMsg(
        "Please tick the Kenya Data Protection Act (2019) consent box before submitting."
      );
      return;
    }

    if (!symptoms.trim()) {
      setErrorMsg("Please describe the crop symptoms observed.");
      return;
    }

    const payload = {
      farmerName: farmerName.trim() || "John Mwangi",
      farmerPhone: farmerPhone.trim() || "+254712345678",
      crop,
      onsetTiming,
      symptoms: symptoms.trim(),
      imageBase64,
      mimeType,
    };

    if (offlineSim) {
      const queuedItem: QueuedCase = {
        id: `q-${Date.now()}`,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        payload,
      };
      persistQueue([queuedItem, ...queue]);
      setStatusBanner(
        "Saved offline in queue. Switch back to Online to sync with Gemini & Grace's queue."
      );
      setTimeout(() => setStatusBanner(null), 4500);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Diagnostic request failed.");
      }

      const rawDiag = data?.diagnosis ?? data;
      const parsedDiag =
        typeof rawDiag === "string"
          ? (() => {
              try {
                return JSON.parse(rawDiag);
              } catch {
                return { summary: rawDiag };
              }
            })()
          : rawDiag || {};

      setResult({
        summary:
          parsedDiag.summary ||
          parsedDiag.assessment ||
          parsedDiag.overview ||
          "",
        confidence:
          parsedDiag.confidence || parsedDiag.confidenceLevel || "",
        safeNextStep:
          parsedDiag.safeNextStep ||
          parsedDiag.safe_next_step ||
          parsedDiag.advice ||
          parsedDiag.recommendedAction ||
          "",
        possibleCauses:
          parsedDiag.possibleCauses ||
          parsedDiag.possible_causes ||
          parsedDiag.causes ||
          [],
      });
      setStatusBanner("Diagnostic logged and sent to Grace's extension queue.");
      setTimeout(() => setStatusBanner(null), 4500);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Could not complete diagnostic check."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const tabs: Array<{ id: ToolTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "diagnose", label: "Crop health", icon: Sprout },
    { id: "weather", label: "Weather", icon: CloudRain },
    { id: "irrigation", label: "Irrigation", icon: Droplets },
    { id: "planting", label: "Planting", icon: Sun },
    { id: "market", label: "Market prices", icon: Store },
  ];

  return (
    <div className="min-h-screen bg-[#f7f4ed] text-[#17231b]">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Top Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#dcd5c5] bg-[#fffdf9] px-3.5 py-1.5 text-xs font-semibold text-[#17231b] transition hover:bg-[#efeae0]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to John&apos;s Hub</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOfflineSim((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                offlineSim
                  ? "border-[#f59e0b] bg-[#fef3c7] text-[#92400e]"
                  : "border-[#cde0d4] bg-[#eef6f1] text-[#184e35]"
              }`}
            >
              {offlineSim ? (
                <>
                  <WifiOff className="h-3.5 w-3.5" />
                  <span>Offline (Sim)</span>
                </>
              ) : (
                <>
                  <Wifi className="h-3.5 w-3.5" />
                  <span>Online</span>
                </>
              )}
            </button>

            <Link
              href="/officer"
              className="rounded-full bg-[#184e35] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#236847]"
            >
              Grace&apos;s Console
            </Link>
          </div>
        </div>

        {/* Workspace Header */}
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#236847]">
            Njoro, Nakuru County · Farmer Field Workspace
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            John Mwangi — Crop &amp; Farm Advisor
          </h1>
        </div>

        {/* Status / Queue Banner */}
        {statusBanner && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 rounded-2xl border border-[#cde0d4] bg-[#eef6f1] px-4 py-3 text-xs font-semibold text-[#184e35]"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{statusBanner}</span>
          </motion.div>
        )}

        {queue.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-xs">
            <div className="font-semibold text-[#92400e]">
              {queue.length} queued check(s) waiting in local storage
            </div>
            <button
              type="button"
              disabled={offlineSim || syncing}
              onClick={syncOfflineQueue}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#92400e] px-3 py-1.5 font-semibold text-white transition hover:bg-[#78350f] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Syncing..." : "Sync Now"}</span>
            </button>
          </div>
        )}

        {/* Interactive Tool Tabs */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                  active
                    ? "bg-[#184e35] text-white shadow-xs"
                    : "border border-[#e3ddd0] bg-[#fffdf9] text-[#4e5d52] hover:text-[#17231b]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Tool Content */}
        <AnimatePresence mode="wait">
          {activeTab === "diagnose" && (
            <motion.div
              key="diagnose"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="mt-5 space-y-5"
            >
              <form
                onSubmit={handleDiagnoseSubmit}
                className="space-y-4 rounded-3xl border border-[#e3ddd0] bg-[#fffdf9] p-5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#17231b]">
                    AI Crop Health Check
                  </h2>
                  <span className="rounded-full bg-[#eef6f1] px-2.5 py-0.5 text-[11px] font-semibold text-[#184e35]">
                    Gemini 2.5 Flash + Extension Queue
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#4e5d52]">
                      Farmer Name
                    </label>
                    <input
                      type="text"
                      value={farmerName}
                      onChange={(e) => setFarmerName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#dcd5c5] bg-[#f7f4ed] px-3 py-2 text-sm text-[#17231b] focus:border-[#236847] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#4e5d52]">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={farmerPhone}
                      onChange={(e) => setFarmerPhone(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#dcd5c5] bg-[#f7f4ed] px-3 py-2 text-sm text-[#17231b] focus:border-[#236847] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#4e5d52]">
                      Crop Type
                    </label>
                    <select
                      value={crop}
                      onChange={(e) => setCrop(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#dcd5c5] bg-[#f7f4ed] px-3 py-2 text-sm text-[#17231b] focus:border-[#236847] focus:outline-none"
                    >
                      <option value="Maize">Maize</option>
                      <option value="Tomatoes">Tomatoes</option>
                      <option value="Potatoes">Irish Potatoes</option>
                      <option value="Beans">Beans</option>
                      <option value="Cabbage">Cabbage</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#4e5d52]">
                      When Symptoms Started
                    </label>
                    <select
                      value={onsetTiming}
                      onChange={(e) => setOnsetTiming(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#dcd5c5] bg-[#f7f4ed] px-3 py-2 text-sm text-[#17231b] focus:border-[#236847] focus:outline-none"
                    >
                      <option value="Today">Today</option>
                      <option value="1–2 days ago">1–2 days ago</option>
                      <option value="3–5 days ago">3–5 days ago</option>
                      <option value="Over 1 week ago">Over 1 week ago</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4e5d52]">
                    Observed Symptoms
                  </label>
                  <textarea
                    rows={3}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Describe leaf spots, curling, yellowing, pests, or wilting..."
                    className="mt-1 w-full rounded-xl border border-[#dcd5c5] bg-[#f7f4ed] px-3 py-2 text-sm text-[#17231b] focus:border-[#236847] focus:outline-none"
                  />
                </div>

                {/* Leaf Photo Upload */}
                <div>
                  <label className="block text-xs font-semibold text-[#4e5d52]">
                    Leaf / Crop Photo (Optional)
                  </label>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#9eb5a8] bg-[#f7f4ed] px-4 py-2.5 text-xs font-semibold text-[#184e35] transition hover:bg-[#eef6f1]">
                      <Camera className="h-4 w-4" />
                      <span>{imagePreview ? "Change Photo" : "Upload Leaf Photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>

                    {imagePreview && (
                      <div className="flex items-center gap-2.5">
                        <img
                          src={imagePreview}
                          alt="Uploaded crop leaf preview"
                          className="h-12 w-12 rounded-lg border border-[#dcd5c5] object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setImageBase64(null);
                            setMimeType(null);
                          }}
                          className="text-xs font-semibold text-[#92400e] hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Kenya Data Protection Act (2019) Consent */}
                <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-[#e3ddd0] bg-[#f7f4ed] p-3 text-xs text-[#4e5d52]">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[#236847] text-[#184e35]"
                  />
                  <span>
                    <strong className="text-[#17231b]">
                      Kenya Data Protection Act (2019) Consent:
                    </strong>{" "}
                    I consent to sharing my crop photo, symptoms, and contact details with
                    FarmAssist and county extension officers for agricultural advisory.
                  </span>
                </label>

                {errorMsg && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#184e35] px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[#236847] active:scale-[0.99] disabled:opacity-60"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {submitting
                      ? "Analyzing with Gemini..."
                      : offlineSim
                      ? "Save to Offline Queue"
                      : "Run AI Crop Check"}
                  </span>
                </button>
              </form>

              {/* Diagnostic Output Card */}
              {result && (
                <div className="space-y-3 rounded-3xl border border-[#cde0d4] bg-[#fffdf9] p-5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-[#184e35]" />
                      <h3 className="text-base font-bold text-[#17231b]">
                        Preliminary Advisory ({crop})
                      </h3>
                    </div>
                    {result.confidence && (
                      <span className="rounded-full bg-[#eef6f1] px-3 py-0.5 text-xs font-semibold text-[#184e35]">
                        Confidence: {result.confidence}
                      </span>
                    )}
                  </div>
                  {!result.summary &&
            (!Array.isArray(result.possibleCauses) || result.possibleCauses.length === 0) &&
            !result.safeNextStep && (
              <pre className="overflow-x-auto rounded-xl bg-[#f7f4ed] p-3 text-[11px] text-[#17231b]">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}

                  {result.summary && (
                    <p className="text-sm text-[#17231b]">{result.summary}</p>
                  )}

                  {Array.isArray(result.possibleCauses) && result.possibleCauses.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#4e5d52]">
                        Possible Causes (Verify with Extension Officer)
                      </p>
                      <ul className="space-y-1.5">
                        {result.possibleCauses.map((cause, idx) => (
                          <li
                            key={idx}
                            className="rounded-xl border border-[#efeae0] bg-[#f7f4ed] px-3 py-2 text-xs text-[#17231b]"
                          >
                            {typeof cause === "string" ? (
                              cause
                            ) : (
                              <>
                                <strong>{cause.name}</strong>
                                {cause.likelihood ? ` · ${cause.likelihood}` : ""}
                                {cause.notes ? ` — ${cause.notes}` : ""}
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.safeNextStep && (
                    <div className="rounded-2xl bg-[#eef6f1] p-3.5 text-xs text-[#184e35]">
                      <strong className="font-bold">Safe Next Step: </strong>
                      <span>{result.safeNextStep}</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "weather" && (
            <motion.div
              key="weather"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-5 space-y-4 rounded-3xl border border-[#e3ddd0] bg-[#fffdf9] p-5"
            >
              <h2 className="text-base font-bold">Njoro Micro-Climate &amp; Forecast</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-[#eef6f1] p-4">
                  <p className="text-xs font-semibold text-[#236847]">Today</p>
                  <p className="mt-1 text-2xl font-bold text-[#184e35]">22° · Light rain</p>
                  <p className="mt-1 text-xs text-[#4e5d52]">Cool afternoon breeze; damp foliage.</p>
                </div>
                <div className="rounded-2xl bg-[#f7f4ed] p-4">
                  <p className="text-xs font-semibold text-[#4e5d52]">Tomorrow</p>
                  <p className="mt-1 text-2xl font-bold text-[#17231b]">20° · Showers</p>
                  <p className="mt-1 text-xs text-[#4e5d52]">Delay irrigation &amp; check plot drainage.</p>
                </div>
                <div className="rounded-2xl bg-[#f7f4ed] p-4">
                  <p className="text-xs font-semibold text-[#4e5d52]">3-Day Outlook</p>
                  <p className="mt-1 text-2xl font-bold text-[#17231b]">23° · Partly sunny</p>
                  <p className="mt-1 text-xs text-[#4e5d52]">Good window for scouting &amp; weeding.</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "irrigation" && (
            <motion.div
              key="irrigation"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-5 space-y-3 rounded-3xl border border-[#e3ddd0] bg-[#fffdf9] p-5"
            >
              <h2 className="text-base font-bold">Irrigation Guidance · Njoro Plots</h2>
              <p className="text-xs text-[#4e5d52]">
                With light rain today and showers forecast tomorrow, hold supplemental watering on
                Plot A (Maize) and Plot B (Tomatoes) unless topsoil feels dry below 5 cm.
              </p>
              <div className="rounded-2xl bg-[#eef6f1] p-3.5 text-xs text-[#184e35]">
                <strong>Best practice:</strong> Water early in the morning when irrigating to cut
                evaporation losses and limit prolonged leaf wetness overnight.
              </div>
            </motion.div>
          )}

          {activeTab === "planting" && (
            <motion.div
              key="planting"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-5 space-y-3 rounded-3xl border border-[#e3ddd0] bg-[#fffdf9] p-5"
            >
              <h2 className="text-base font-bold">Planting &amp; Plot Readiness</h2>
              <ul className="space-y-2 text-xs text-[#4e5d52]">
                <li className="rounded-xl bg-[#f7f4ed] p-3">
                  <strong className="text-[#17231b]">Seed &amp; Input Check:</strong> Use certified
                  seeds suited to Nakuru altitude and verify bag seal integrity before sowing.
                </li>
                <li className="rounded-xl bg-[#f7f4ed] p-3">
                  <strong className="text-[#17231b]">Row Spacing &amp; Weeding:</strong> Keep early
                  weed competition low during the first 3–6 weeks of crop establishment.
                </li>
              </ul>
            </motion.div>
          )}

          {activeTab === "market" && (
            <motion.div
              key="market"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-5 space-y-4 rounded-3xl border border-[#e3ddd0] bg-[#fffdf9] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold">Market Price &amp; Net Return Estimator</h2>
                  <p className="text-xs text-[#4e5d52]">
                    Compare gross price against transport and handling deductions.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold">
                  <span>Bags:</span>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={bagsCount}
                    onChange={(e) => setBagsCount(Math.max(1, Number(e.target.value) || 1))}
                    className="w-20 rounded-lg border border-[#dcd5c5] bg-[#f7f4ed] px-2.5 py-1.5 text-sm font-bold"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {MARKET_ROWS.map((m) => {
                  const netPerBag = m.grossPerBagKes - m.transportPerBagKes - m.handlingKes;
                  const totalNet = netPerBag * bagsCount;
                  return (
                    <div
                      key={m.market}
                      className="flex flex-col justify-between rounded-2xl border border-[#e3ddd0] bg-[#f7f4ed] p-4"
                    >
                      <div>
                        <p className="text-sm font-bold text-[#17231b]">{m.market}</p>
                        <p className="text-[11px] text-[#4e5d52]">{m.distanceKm} km away</p>
                        <p className="mt-2 text-xs text-[#4e5d52]">
                          Gross: <strong>KES {m.grossPerBagKes.toLocaleString()}</strong>/bag
                        </p>
                        <p className="text-xs text-[#4e5d52]">
                          Transport + handling: KES{" "}
                          {(m.transportPerBagKes + m.handlingKes).toLocaleString()}/bag
                        </p>
                      </div>
                      <div className="mt-3 border-t border-[#e3ddd0] pt-2.5">
                        <p className="text-[11px] font-semibold uppercase text-[#236847]">
                          Est. Net ({bagsCount} bags)
                        </p>
                        <p className="text-lg font-bold text-[#184e35]">
                          KES {totalNet.toLocaleString()}
                        </p>
                        <p className="mt-1 text-[11px] text-[#4e5d52]">{m.demand}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}