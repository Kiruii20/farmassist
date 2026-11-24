"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  ChevronRight,
  CloudRain,
  Droplets,
  MessageSquareText,
  PhoneCall,
  ShieldCheck,
  Sprout,
  Store,
  Sun,
  Wifi,
  WifiOff,
  Sparkles,
  UserCheck,
} from "lucide-react";

type CropPlot = {
  id: string;
  name: string;
  plot: string;
  stage: string;
  status: "Healthy" | "Watch";
  cropQuery: string;
};

const CROP_PLOTS: CropPlot[] = [
  {
    id: "maize-a",
    name: "Maize",
    plot: "Plot A",
    stage: "6 weeks · Knee-high",
    status: "Healthy",
    cropQuery: "Maize",
  },
  {
    id: "tomatoes-b",
    name: "Tomatoes",
    plot: "Plot B",
    stage: "4 weeks · Vegetative",
    status: "Watch",
    cropQuery: "Tomatoes",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const [offlineSim, setOfflineSim] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("farmassist_offline_queue");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setQueuedCount(parsed.length);
      }
    } catch {
      // Ignore storage read errors in restricted contexts
    }
  }, []);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function handleToggleOffline() {
    if (offlineSim) {
      setOfflineSim(false);
      if (queuedCount > 0) {
        setSyncNotice(`Back online · ${queuedCount} queued check(s) ready to sync in Farmer PWA.`);
      } else {
        setSyncNotice("Connected · Live diagnostic & market sync active.");
      }
      setTimeout(() => setSyncNotice(null), 4000);
    } else {
      setOfflineSim(true);
      setSyncNotice("Low-data / Offline mode simulated · Checks save locally until reconnected.");
      setTimeout(() => setSyncNotice(null), 4000);
    }
  }

  const tools = [
    {
      title: "Crop health",
      subtitle: "Leaf photo & symptom AI check with offline queue",
      href: "/farmer?tool=diagnose",
      icon: Sprout,
      badge: "AI + Photo",
    },
    {
      title: "Weather",
      subtitle: "Njoro micro-climate & 5-day rainfall outlook",
      href: "/farmer?tool=weather",
      icon: CloudRain,
      badge: "Njoro",
    },
    {
      title: "Irrigation",
      subtitle: "Soil moisture & watering schedule guidance",
      href: "/farmer?tool=irrigation",
      icon: Droplets,
      badge: "Smart tip",
    },
    {
      title: "Planting",
      subtitle: "Input timing & plot readiness checklist",
      href: "/farmer?tool=planting",
      icon: Sun,
      badge: "Seasonal",
    },
    {
      title: "Market prices",
      subtitle: "Nakuru & local wholesale net-profit comparison",
      href: "/farmer?tool=market",
      icon: Store,
      badge: "KES / crate",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f4ed] text-[#17231b]">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Top Header + Role / Channel Dropdown (Grace & Mary under John's hub) */}
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#236847]">
              Tuesday · Njoro, Nakuru County
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#17231b] sm:text-3xl">
              Good morning, John
            </h1>
            <p className="mt-0.5 text-sm text-[#4e5d52]">
              John Mwangi · Smallholder Farmer PWA
            </p>
          </div>

          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              className="inline-flex items-center gap-2 rounded-full border border-[#dcd5c5] bg-[#fffdf9] px-3.5 py-2 text-xs font-semibold text-[#17231b] shadow-xs transition hover:border-[#236847] hover:bg-[#f2efe7] active:scale-[0.98]"
            >
              <span className="h-2 w-2 rounded-full bg-[#236847]" />
              <span>Role: John</span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-[#4e5d52] transition-transform duration-200 ${
                  menuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 420, damping: 30 }}
                  className="absolute right-0 z-30 mt-2 w-72 origin-top-right rounded-2xl border border-[#e3ddd0] bg-[#fffdf9] p-2 shadow-xl"
                >
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#4e5d52]">
                    Switch Persona & Channel
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/farmer");
                    }}
                    className="flex w-full items-start gap-3 rounded-xl bg-[#eef6f1] p-2.5 text-left transition hover:bg-[#e2f0e7]"
                  >
                    <Sprout className="mt-0.5 h-4 w-4 shrink-0 text-[#184e35]" />
                    <div>
                      <div className="text-xs font-bold text-[#184e35]">
                        John Mwangi (Full Farmer PWA)
                      </div>
                      <div className="text-[11px] text-[#4e5d52]">
                        Diagnose crops, offline queue & market prices
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/officer");
                    }}
                    className="mt-1 flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition hover:bg-[#f5f1e8]"
                  >
                    <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#236847]" />
                    <div>
                      <div className="text-xs font-bold text-[#17231b]">
                        Grace Achieng (Officer Console)
                      </div>
                      <div className="text-[11px] text-[#4e5d52]">
                        Review cases, confirm/correct AI & send SMS
                      </div>
                    </div>
                  </button>

                  <a
                    href="#mary-ussd-channel"
                    onClick={() => setMenuOpen(false)}
                    className="mt-1 flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition hover:bg-[#f5f1e8]"
                  >
                    <PhoneCall className="mt-0.5 h-4 w-4 shrink-0 text-[#d97706]" />
                    <div>
                      <div className="text-xs font-bold text-[#17231b]">
                        Mary Wanjiku (USSD *384*31059#)
                      </div>
                      <div className="text-[11px] text-[#4e5d52]">
                        Feature-phone Kiswahili/English menu & flow
                      </div>
                    </div>
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Sync / Connectivity Pill Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#e3ddd0] bg-[#fffdf9] px-3.5 py-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-[#4e5d52]">
            {offlineSim ? (
              <WifiOff className="h-4 w-4 text-[#d97706]" />
            ) : (
              <Wifi className="h-4 w-4 text-[#236847]" />
            )}
            <span>
              {offlineSim
                ? "Offline mode active (simulated)"
                : "Low-data ready · Synced with FarmAssist cloud"}
            </span>
            {queuedCount > 0 && (
              <span className="rounded-full bg-[#fef3c7] px-2 py-0.5 text-[11px] font-semibold text-[#92400e]">
                {queuedCount} queued
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleToggleOffline}
            className="rounded-lg border border-[#dcd5c5] bg-[#f7f4ed] px-2.5 py-1 text-xs font-semibold text-[#17231b] transition hover:bg-[#ece6d8] active:scale-[0.98]"
          >
            {offlineSim ? "Go Online" : "Simulate Offline"}
          </button>
        </div>

        {syncNotice && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2.5 rounded-xl border border-[#cde0d4] bg-[#eef6f1] px-3.5 py-2 text-xs font-medium text-[#184e35]"
          >
            {syncNotice}
          </motion.div>
        )}

        {/* Prototype Forest-Green Weather & Advisory Card */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-[#184e35] via-[#1f5d40] to-[#297551] p-5 text-white shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-100/90">
                Today in Njoro
              </p>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="text-4xl font-bold tracking-tight">22°</span>
                <span className="text-sm font-medium text-emerald-100">Light rain</span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xs">
              <CloudRain className="h-6 w-6 text-emerald-100" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setWeatherExpanded((prev) => !prev)}
            className="mt-4 flex w-full items-center justify-between rounded-2xl bg-black/15 px-3.5 py-2.5 text-left transition hover:bg-black/20"
          >
            <div>
              <p className="text-xs font-semibold text-white">
                Rain expected tomorrow · Consider delaying irrigation
              </p>
              <p className="text-[11px] text-emerald-100/85">
                Tap to view field guidance for maize &amp; tomatoes
              </p>
            </div>
            <ChevronRight
              className={`h-4 w-4 shrink-0 text-emerald-100 transition-transform ${
                weatherExpanded ? "rotate-90" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {weatherExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-1.5 border-t border-white/15 pt-3 text-xs text-emerald-50">
                  <p>• Avoid foliar spraying right before expected showers so treatments aren&apos;t washed off.</p>
                  <p>• Check drainage trenches on lower tomato beds after rainfall.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* "What can we help with?" Tool Rows */}
        <section className="mt-7">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#4e5d52]">
              FarmAssist Tools · What can we help with?
            </h2>
            <Link
              href="/farmer"
              className="text-xs font-semibold text-[#184e35] hover:underline"
            >
              Open full workspace →
            </Link>
          </div>

          <div className="mt-3 space-y-2.5">
            {tools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index, duration: 0.25 }}
                >
                  <Link
                    href={tool.href}
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-[#e3ddd0] bg-[#fffdf9] p-3.5 shadow-2xs transition hover:border-[#236847]/50 hover:bg-[#fcfaf5] active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef6f1] text-[#184e35] transition group-hover:bg-[#184e35] group-hover:text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#17231b]">
                            {tool.title}
                          </span>
                          <span className="rounded-full bg-[#f2ede2] px-2 py-0.5 text-[10px] font-semibold text-[#4e5d52]">
                            {tool.badge}
                          </span>
                        </div>
                        <p className="text-xs text-[#4e5d52]">{tool.subtitle}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#4e5d52] transition group-hover:translate-x-0.5 group-hover:text-[#184e35]" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* "Your Farm" Active Crops Section */}
        <section className="mt-7">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#4e5d52]">
              Your Farm · Active Crops
            </h2>
            <span className="text-xs font-medium text-[#4e5d52]">2 plots tracked</span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CROP_PLOTS.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-[#e3ddd0] bg-[#fffdf9] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#17231b]">
                      {item.name} · {item.plot}
                    </p>
                    <p className="mt-0.5 text-xs text-[#4e5d52]">{item.stage}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      item.status === "Healthy"
                        ? "bg-[#e8f5ee] text-[#184e35]"
                        : "bg-[#fef3c7] text-[#92400e]"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#efeae0] pt-3">
                  <span className="text-[11px] text-[#4e5d52]">Quick leaf check</span>
                  <Link
                    href={`/farmer?crop=${encodeURIComponent(item.cropQuery)}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#184e35] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#236847]"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Check</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Mary's USSD & Grace's Officer Quick Access Card */}
        <section
          id="mary-ussd-channel"
          className="mt-7 rounded-2xl border border-[#e3ddd0] bg-[#fffdf9] p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-[#d97706]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#17231b]">
                Mary Wanjiku · Feature-Phone USSD (*384*31059#)
              </h2>
            </div>
            <span className="rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-[11px] font-semibold text-[#92400e]">
              EN / SW Live
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[#4e5d52]">
            For farmers without smartphones, dial{" "}
            <strong className="text-[#17231b]">*384*31059#</strong> in the Africa&apos;s Talking
            simulator (connected to <code className="text-[11px]">/api/ussd</code>). Choose{" "}
            <strong className="text-[#17231b]">2 (Kiswahili)</strong> →{" "}
            <strong className="text-[#17231b]">2 (Swali la mazao)</strong> to request an
            extension callback that appears directly in Grace&apos;s queue.
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
            <Link
              href="/officer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#dcd5c5] bg-[#f7f4ed] px-3.5 py-2 text-xs font-semibold text-[#17231b] transition hover:bg-[#ece6d8]"
            >
              <UserCheck className="h-3.5 w-3.5 text-[#184e35]" />
              <span>Open Grace&apos;s Officer Console</span>
            </Link>
            <span className="inline-flex items-center gap-1 text-[11px] text-[#4e5d52]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#236847]" />
              <span>Kenya DPA 2019 consent-gated</span>
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}