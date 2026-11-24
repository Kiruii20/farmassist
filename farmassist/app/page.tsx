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
  const [weatherExpanded, setWeatherExpanded] = useState(true);
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
      // Ignore storage read errors
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
      setSyncNotice(
        queuedCount > 0
          ? `Back online · ${queuedCount} queued check(s) ready to sync in Farmer PWA.`
          : "Connected · Live diagnostic & market sync active."
      );
      setTimeout(() => setSyncNotice(null), 4000);
    } else {
      setOfflineSim(true);
      setSyncNotice(
        "Low-data / Offline mode simulated · Checks save locally until reconnected."
      );
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
    <div className="relative min-h-screen overflow-x-clip text-[#132218]">
      {/* Subtle Ambient Glow Accents */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/15 blur-3xl" />

      <div className="relative mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Top Header + Role / Channel Dropdown */}
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#226b49]">
              Tuesday · Njoro, Nakuru County
            </p>
            <h1 className="mt-1 bg-gradient-to-r from-[#132218] via-[#184e35] to-[#226b49] bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
              Good morning, John
            </h1>
            <p className="mt-0.5 text-sm font-medium text-[#485b4f]">
              John Mwangi · Smallholder Farmer PWA
            </p>
          </div>

          <div className="relative shrink-0" ref={menuRef}>
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              className="inline-flex items-center gap-2 rounded-full border border-[#144b32]/15 bg-white/85 px-3.5 py-2 text-xs font-semibold text-[#132218] shadow-sm backdrop-blur-md transition hover:border-[#226b49]/40 hover:bg-white"
            >
              <span className="h-2 w-2 rounded-full bg-[#22b567] ring-2 ring-emerald-400/30" />
              <span>Role: John</span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-[#485b4f] transition-transform duration-200 ${
                  menuOpen ? "rotate-180" : ""
                }`}
              />
            </motion.button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 420, damping: 30 }}
                  className="absolute right-0 z-30 mt-2 w-72 origin-top-right rounded-2xl border border-[#144b32]/15 bg-white/95 p-2 shadow-2xl backdrop-blur-xl"
                >
                  <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#485b4f]">
                    Switch Persona &amp; Channel
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/farmer");
                    }}
                    className="flex w-full items-start gap-3 rounded-xl bg-emerald-50/90 p-2.5 text-left transition hover:bg-emerald-100/80"
                  >
                    <Sprout className="mt-0.5 h-4 w-4 shrink-0 text-[#144b32]" />
                    <div>
                      <div className="text-xs font-bold text-[#144b32]">
                        John Mwangi (Full Farmer PWA)
                      </div>
                      <div className="text-[11px] text-[#485b4f]">
                        Diagnose crops, offline queue &amp; market prices
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/officer");
                    }}
                    className="mt-1 flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition hover:bg-[#f4f7f2]"
                  >
                    <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#226b49]" />
                    <div>
                      <div className="text-xs font-bold text-[#132218]">
                        Grace Achieng (Officer Console)
                      </div>
                      <div className="text-[11px] text-[#485b4f]">
                        Review cases, confirm/correct AI &amp; send SMS
                      </div>
                    </div>
                  </button>

                  <a
                    href="#mary-ussd-channel"
                    onClick={() => setMenuOpen(false)}
                    className="mt-1 flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition hover:bg-[#f4f7f2]"
                  >
                    <PhoneCall className="mt-0.5 h-4 w-4 shrink-0 text-[#d97706]" />
                    <div>
                      <div className="text-xs font-bold text-[#132218]">
                        Mary Wanjiku (USSD *384*31059#)
                      </div>
                      <div className="text-[11px] text-[#485b4f]">
                        Feature-phone Kiswahili/English menu &amp; flow
                      </div>
                    </div>
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Sync / Connectivity Pill Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#144b32]/12 bg-white/80 px-3.5 py-2.5 shadow-xs backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-medium text-[#485b4f]">
            {offlineSim ? (
              <WifiOff className="h-4 w-4 text-[#d97706]" />
            ) : (
              <Wifi className="h-4 w-4 text-[#226b49]" />
            )}
            <span>
              {offlineSim
                ? "Offline mode active (simulated)"
                : "Low-data ready · Synced with FarmAssist cloud"}
            </span>
            {queuedCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                {queuedCount} queued
              </span>
            )}
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={handleToggleOffline}
            className="rounded-xl border border-[#144b32]/15 bg-[#f4f7f2] px-3 py-1 text-xs font-semibold text-[#132218] transition hover:bg-emerald-50"
          >
            {offlineSim ? "Go Online" : "Simulate Offline"}
          </motion.button>
        </div>

        {syncNotice && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2.5 rounded-xl border border-emerald-700/15 bg-emerald-50/90 px-3.5 py-2 text-xs font-medium text-[#144b32]"
          >
            {syncNotice}
          </motion.div>
        )}

        {/* Luminous Forest Weather & Advisory Card */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-[#11442d] via-[#195e3f] to-[#2b8259] p-5 text-white shadow-lg shadow-emerald-950/15 ring-1 ring-white/15"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-100/90">
                Today in Njoro
              </p>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="text-4xl font-extrabold tracking-tight">22°</span>
                <span className="text-sm font-medium text-emerald-100">Light rain</span>
              </div>
            </div>
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur-xs"
            >
              <CloudRain className="h-6 w-6 text-emerald-100" />
            </motion.div>
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
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-emerald-100 transition-transform duration-200 ${
                weatherExpanded ? "rotate-180" : ""
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
                  <p>
                    • Avoid foliar spraying right before expected showers so treatments aren&apos;t
                    washed off.
                  </p>
                  <p>• Check drainage trenches on lower tomato beds after rainfall.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* "What can we help with?" Tool Rows */}
        <section className="mt-7">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#485b4f]">
              FarmAssist Tools · What can we help with?
            </h2>
            <Link
              href="/farmer"
              className="text-xs font-bold text-[#144b32] transition hover:text-[#226b49] hover:underline"
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
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Link
                    href={tool.href}
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-[#144b32]/12 bg-white/85 p-3.5 shadow-xs backdrop-blur-md transition hover:border-[#226b49]/40 hover:bg-white hover:shadow-md"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#144b32] ring-1 ring-emerald-900/10 transition group-hover:bg-[#144b32] group-hover:text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#132218]">
                            {tool.title}
                          </span>
                          <span className="rounded-full bg-[#eef4ec] px-2 py-0.5 text-[10px] font-semibold text-[#226b49]">
                            {tool.badge}
                          </span>
                        </div>
                        <p className="text-xs text-[#485b4f]">{tool.subtitle}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#485b4f] transition group-hover:translate-x-0.5 group-hover:text-[#144b32]" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* "Your Farm" Active Crops Section */}
        <section className="mt-7">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#485b4f]">
              Your Farm · Active Crops
            </h2>
            <span className="text-xs font-medium text-[#485b4f]">2 plots tracked</span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CROP_PLOTS.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -2 }}
                className="flex flex-col justify-between rounded-2xl border border-[#144b32]/12 bg-white/85 p-4 shadow-xs backdrop-blur-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#132218]">
                      {item.name} · {item.plot}
                    </p>
                    <p className="mt-0.5 text-xs text-[#485b4f]">{item.stage}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      item.status === "Healthy"
                        ? "bg-emerald-100/90 text-[#144b32]"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#144b32]/10 pt-3">
                  <span className="text-[11px] text-[#485b4f]">Quick leaf check</span>
                  <Link
                    href={`/farmer?crop=${encodeURIComponent(item.cropQuery)}`}
                    className="inline-flex items-center gap-1 rounded-xl bg-[#144b32] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#226b49]"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Check</span>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Mary's USSD & Grace's Officer Quick Access Card */}
        <section
          id="mary-ussd-channel"
          className="mt-7 rounded-2xl border border-[#144b32]/12 bg-white/85 p-4 shadow-xs backdrop-blur-md"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-[#d97706]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#132218]">
                Mary Wanjiku · Feature-Phone USSD (*384*31059#)
              </h2>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
              EN / SW Live
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[#485b4f]">
            For farmers without smartphones, dial{" "}
            <strong className="text-[#132218]">*384*31059#</strong> in the Africa&apos;s Talking
            simulator (connected to <code className="text-[11px]">/api/ussd</code>). Choose{" "}
            <strong className="text-[#132218]">2 (Kiswahili)</strong> →{" "}
            <strong className="text-[#132218]">2 (Swali la mazao)</strong> to request an
            extension callback that appears directly in Grace&apos;s queue.
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
            <Link
              href="/officer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#144b32]/15 bg-[#f4f7f2] px-3.5 py-2 text-xs font-semibold text-[#132218] transition hover:bg-emerald-50"
            >
              <UserCheck className="h-3.5 w-3.5 text-[#144b32]" />
              <span>Open Grace&apos;s Officer Console</span>
            </Link>
            <span className="inline-flex items-center gap-1 text-[11px] text-[#485b4f]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#226b49]" />
              <span>Kenya DPA 2019 consent-gated</span>
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}