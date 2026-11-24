"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Filter,
  MessageSquare,
  PhoneCall,
  RefreshCw,
  Send,
  ShieldAlert,
  Sprout,
  UserCheck,
} from "lucide-react";

type CaseChannel = "PWA" | "USSD (*384*31059#)";
type CaseStatus = "New" | "Confirmed" | "Corrected" | "Escalated";

type ExtensionCase = {
  id: string;
  farmerName: string;
  farmerPhone: string;
  channel: CaseChannel;
  location: string;
  crop: string;
  submittedAt: string;
  onsetTiming: string;
  symptoms: string;
  aiAssessment: string;
  confidence: string;
  safeNextStep: string;
  status: CaseStatus;
  officerNote: string;
};

const INITIAL_CASES: ExtensionCase[] = [
  {
    id: "CASE-104",
    farmerName: "John Mwangi",
    farmerPhone: "+254712345678",
    channel: "PWA",
    location: "Njoro, Nakuru County",
    crop: "Maize",
    submittedAt: "12 mins ago",
    onsetTiming: "3–5 days ago",
    symptoms:
      "Yellowing lower leaves with small pale streaks and leaf-tip wilting after light rain.",
    aiAssessment:
      "Possible nitrogen deficiency or early foliar stress; verify moisture & drainage before applying inputs.",
    confidence: "Moderate (76%)",
    safeNextStep:
      "Inspect lower canopy and soil moisture; avoid heavy top-dressing until drainage is checked.",
    status: "New",
    officerNote: "",
  },
  {
    id: "CASE-103",
    farmerName: "Mary Wanjiku",
    farmerPhone: "+254722987654",
    channel: "USSD (*384*31059#)",
    location: "Kuresoi / Njoro Border",
    crop: "Potatoes",
    submittedAt: "38 mins ago",
    onsetTiming: "1–2 days ago",
    symptoms:
      "Requested extension callback via Kiswahili USSD menu (Swali la mazao -> Nipigie simu) for leaf spots.",
    aiAssessment:
      "USSD callback intake logged; requires visual/symptom verification and localized advisory SMS.",
    confidence: "USSD Intake",
    safeNextStep:
      "Call farmer or send concise Kiswahili guidance on field scouting and safe crop protection.",
    status: "New",
    officerNote: "",
  },
  {
    id: "CASE-102",
    farmerName: "Peter Karanja",
    farmerPhone: "+254701554433",
    channel: "PWA",
    location: "Mau Narok / Njoro",
    crop: "Tomatoes",
    submittedAt: "2 hrs ago",
    onsetTiming: "Over 1 week ago",
    symptoms: "Irregular dark patches on older leaves after cool wet mornings.",
    aiAssessment: "Early/late blight risk elevated by cool damp conditions.",
    confidence: "High (84%)",
    safeNextStep:
      "Remove heavily affected lower leaves away from plot and follow county fungicide label instructions.",
    status: "Confirmed",
    officerNote: "Verified symptoms; advised morning scouting and label-compliant spray.",
  },
];

const SMS_TEMPLATES = [
  {
    label: "SW · Ushauri wa Mazao",
    text: "FarmAssist Njoro: Kagua majani ya mazao asubuhi na epuka kumwagilia kupita kiasi mvua ikinyesha. Wasiliana na afisa wa ugani ukiona mabadiliko zaidi.",
  },
  {
    label: "EN · Field Scouting",
    text: "FarmAssist Nakuru: Scout lower leaves this morning, delay extra irrigation if rain is falling, and follow safe label instructions before any treatment.",
  },
  {
    label: "SW · Simu ya Kurudishiwa",
    text: "FarmAssist: Tumepokea ombi lako kupitia *384*31059#. Afisa wa ugani Grace Achieng atawasiliana nawe hivi punde.",
  },
];

export default function OfficerConsolePage() {
  const [cases, setCases] = useState<ExtensionCase[]>(INITIAL_CASES);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_CASES[0].id);
  const [statusFilter, setStatusFilter] = useState<"All" | CaseStatus>("All");
  const [correctionText, setCorrectionText] = useState<string>("");
  const [smsMessage, setSmsMessage] = useState<string>(SMS_TEMPLATES[0].text);
  const [smsSending, setSmsSending] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  const filteredCases = useMemo(() => {
    if (statusFilter === "All") return cases;
    return cases.filter((c) => c.status === statusFilter);
  }, [cases, statusFilter]);

  const activeCase = useMemo(() => {
    return (
      filteredCases.find((c) => c.id === selectedId) ||
      cases.find((c) => c.id === selectedId) ||
      filteredCases[0] ||
      cases[0]
    );
  }, [cases, filteredCases, selectedId]);

  function showBanner(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  function handleDecision(decision: "Confirmed" | "Corrected" | "Escalated") {
    if (!activeCase) return;
    setCases((prev) =>
      prev.map((item) => {
        if (item.id !== activeCase.id) return item;
        const note =
          decision === "Corrected" && correctionText.trim()
            ? `Corrected diagnosis: ${correctionText.trim()}`
            : decision === "Confirmed"
            ? "Confirmed AI preliminary guidance for local field conditions."
            : "Escalated to senior agronomist / county specialist review.";
        return {
          ...item,
          status: decision,
          officerNote: note,
        };
      })
    );
    if (decision === "Corrected") {
      setCorrectionText("");
    }
    showBanner(`Case ${activeCase.id} marked as ${decision}.`);
  }

  async function handleSendSms(e: React.FormEvent) {
    e.preventDefault();
    if (!activeCase) return;
    if (!smsMessage.trim()) {
      showBanner("Please enter an SMS advisory message first.");
      return;
    }

    setSmsSending(true);
    try {
      const res = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: activeCase.farmerPhone,
          message: smsMessage.trim(),
          caseId: activeCase.id,
        }),
      });
      if (res.ok) {
        showBanner(`SMS advisory dispatched to ${activeCase.farmerName} (${activeCase.farmerPhone}).`);
      } else {
        showBanner(
          `SMS preview logged for ${activeCase.farmerPhone} (check /api/sms & AT sandbox config).`
        );
      }
    } catch {
      showBanner(`SMS advisory queued for ${activeCase.farmerPhone}.`);
    } finally {
      setSmsSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f4ed] text-[#17231b]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Top Navigation */}
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
              onClick={() => showBanner("Case queue refreshed.")}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#dcd5c5] bg-[#fffdf9] px-3 py-1.5 text-xs font-semibold text-[#17231b] transition hover:bg-[#efeae0]"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#184e35]" />
              <span>Refresh Queue</span>
            </button>
            <Link
              href="/farmer"
              className="rounded-full bg-[#184e35] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#236847]"
            >
              Farmer PWA
            </Link>
          </div>
        </div>

        {/* Header */}
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#236847]">
              Nakuru County Extension Desk · Human-in-the-Loop Triage
            </p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
              <UserCheck className="h-6 w-6 text-[#184e35]" />
              <span>Grace Achieng — Extension Officer Console</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-[#e3ddd0] bg-[#fffdf9] px-3.5 py-2 text-xs">
            <span className="font-semibold text-[#4e5d52]">Active Cases:</span>
            <span className="rounded-full bg-[#eef6f1] px-2.5 py-0.5 font-bold text-[#184e35]">
              {cases.length}
            </span>
          </div>
        </div>

        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 rounded-2xl border border-[#cde0d4] bg-[#eef6f1] px-4 py-3 text-xs font-semibold text-[#184e35]"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{toast}</span>
          </motion.div>
        )}

        {/* Filter Bar */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#4e5d52]">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter:</span>
          </span>
          {(["All", "New", "Confirmed", "Corrected", "Escalated"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                statusFilter === st
                  ? "bg-[#184e35] text-white"
                  : "border border-[#e3ddd0] bg-[#fffdf9] text-[#4e5d52] hover:text-[#17231b]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Split Queue + Inspector */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left Queue */}
          <div className="space-y-2.5 lg:col-span-5">
            {filteredCases.map((item) => {
              const selected = activeCase?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selected
                      ? "border-[#184e35] bg-[#eef6f1]/70 shadow-xs"
                      : "border-[#e3ddd0] bg-[#fffdf9] hover:border-[#236847]/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-[#4e5d52]">
                        {item.id} · {item.submittedAt}
                      </span>
                      <p className="text-sm font-bold text-[#17231b]">{item.farmerName}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        item.status === "New"
                          ? "bg-[#fef3c7] text-[#92400e]"
                          : item.status === "Escalated"
                          ? "bg-red-100 text-red-800"
                          : "bg-[#e8f5ee] text-[#184e35]"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#4e5d52]">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#17231b]">
                      <Sprout className="h-3.5 w-3.5 text-[#184e35]" />
                      {item.crop}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <PhoneCall className="h-3 w-3 text-[#d97706]" />
                      {item.channel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Inspector + SMS Composer */}
          {activeCase && (
            <div className="space-y-5 lg:col-span-7">
              <div className="space-y-4 rounded-3xl border border-[#e3ddd0] bg-[#fffdf9] p-5">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#efeae0] pb-3.5">
                  <div>
                    <span className="text-xs font-bold text-[#236847]">
                      {activeCase.id} · {activeCase.channel}
                    </span>
                    <h2 className="text-lg font-bold text-[#17231b]">
                      {activeCase.farmerName} — {activeCase.crop}
                    </h2>
                    <p className="text-xs text-[#4e5d52]">
                      {activeCase.location} · {activeCase.farmerPhone} · Onset:{" "}
                      {activeCase.onsetTiming}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#f2ede2] px-3 py-1 text-xs font-semibold text-[#17231b]">
                    {activeCase.confidence}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#4e5d52]">
                    Reported Symptoms / Intake
                  </p>
                  <p className="mt-1 rounded-2xl bg-[#f7f4ed] p-3 text-sm text-[#17231b]">
                    {activeCase.symptoms}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#4e5d52]">
                    AI Preliminary Assessment
                  </p>
                  <p className="mt-1 rounded-2xl bg-[#eef6f1] p-3 text-xs font-medium text-[#184e35]">
                    {activeCase.aiAssessment}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#e3ddd0] bg-[#fcfaf5] p-3 text-xs text-[#4e5d52]">
                  <strong className="text-[#17231b]">Recommended Safe Action: </strong>
                  {activeCase.safeNextStep}
                </div>

                {activeCase.officerNote && (
                  <div className="rounded-2xl border border-[#cde0d4] bg-[#eef6f1]/60 p-3 text-xs font-medium text-[#184e35]">
                    <strong>Officer Record: </strong>
                    {activeCase.officerNote}
                  </div>
                )}

                {/* Correction Input + Decision Buttons */}
                <div className="space-y-3 border-t border-[#efeae0] pt-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#4e5d52]">
                      Officer Correction Note (Optional when correcting AI output)
                    </label>
                    <input
                      type="text"
                      value={correctionText}
                      onChange={(e) => setCorrectionText(e.target.value)}
                      placeholder="e.g., Confirmed fall armyworm early whorl damage; advise safe scouting..."
                      className="mt-1 w-full rounded-xl border border-[#dcd5c5] bg-[#f7f4ed] px-3 py-2 text-xs text-[#17231b] focus:border-[#236847] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleDecision("Confirmed")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#184e35] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#236847]"
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      <span>Confirm</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDecision("Corrected")}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#236847] bg-[#eef6f1] px-4 py-2 text-xs font-bold text-[#184e35] transition hover:bg-[#dff0e5]"
                    >
                      <span>Correct</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDecision("Escalated")}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-[#fef3c7] px-4 py-2 text-xs font-bold text-[#92400e] transition hover:bg-[#fde68a]"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      <span>Escalate</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SMS Advisory Sender */}
              <form
                onSubmit={handleSendSms}
                className="space-y-3 rounded-3xl border border-[#e3ddd0] bg-[#fffdf9] p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[#184e35]" />
                    <h3 className="text-sm font-bold text-[#17231b]">
                      Send Farmer SMS Advisory ({activeCase.farmerPhone})
                    </h3>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      smsMessage.length > 160 ? "text-red-700" : "text-[#4e5d52]"
                    }`}
                  >
                    {smsMessage.length}/160 chars
                  </span>
                </div>

                {/* Quick Templates */}
                <div className="flex flex-wrap gap-1.5">
                  {SMS_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() => setSmsMessage(tpl.text)}
                      className="rounded-lg border border-[#dcd5c5] bg-[#f7f4ed] px-2.5 py-1 text-[11px] font-semibold text-[#17231b] transition hover:bg-[#ece6d8]"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  className="w-full rounded-xl border border-[#dcd5c5] bg-[#f7f4ed] px-3 py-2 text-xs text-[#17231b] focus:border-[#236847] focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={smsSending}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#184e35] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#236847] disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{smsSending ? "Sending SMS..." : "Send SMS Advisory"}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}