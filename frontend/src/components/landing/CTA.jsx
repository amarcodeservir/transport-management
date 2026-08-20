import { useEffect, useRef, useState } from "react";
import React from "react";
import { Clock, Building2, LayoutGrid, ShieldCheck, Truck, Route } from "lucide-react";

/**
 * Logistics Mitra — Stats / Trust Bar
 * Themed as a waybill / consignment manifest: ticket-stub cards with a
 * torn perforation line, a curved "route" connecting each stat as a
 * waypoint, and an ink-stamp treatment for the certification badge.
 */

const STATS = [
  { icon: Clock, value: 18, suffix: "+", label: "Years in Business", code: "SINCE 2008" },
  { icon: Building2, value: 100, suffix: "+", label: "Logistics Companies", code: "PAN-INDIA" },
  { icon: LayoutGrid, value: 12, suffix: "+", label: "Core Modules", code: "PLATFORM" },
  { icon: ShieldCheck, value: null, label: "27001:2022 Data Security", code: "CERTIFIED" },
];

const PAGE_BG = "#F4F5FA";

function useCountUp(target, active, duration = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active || target === null) return;
    let start = null;
    let raf;

    const step = (ts) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);

  return value;
}

function StampCard({ stat, index }) {
  const Icon = stat.icon;
  return (
    <div
      className="lm-stat-item relative flex flex-col items-center justify-center gap-2 rounded-[10px] border border-[#1B2A5B]/12 bg-white px-5 py-7 text-center shadow-[0_4px_16px_-8px_rgba(27,42,91,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_-12px_rgba(27,42,91,0.18)]"
      style={{
        animationDelay: `${0.12 * index}s`,
        clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)",
      }}
    >
      <span className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-[#F7941D]/10 blur-2xl" />
      <div
        className="flex h-16 w-16 -rotate-6 items-center justify-center rounded-full border-2 border-dashed border-[#F7941D]/70 text-[#1B2A5B]"
      >
        <Icon className="h-6 w-6" strokeWidth={2.2} />
      </div>
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F7941D]">
        {stat.code}
      </div>
      <div className="text-[15px] font-bold leading-snug text-[#1B2A5B]" style={{ fontFamily: "'Oswald', sans-serif" }}>
        ISO Certified
      </div>
      <div className="text-[12px] font-medium leading-snug text-slate-500">
        {stat.label}
      </div>
    </div>
  );
}

function StatItem({ stat, active, index }) {
  const count = useCountUp(stat.value, active);
  const Icon = stat.icon;

  if (stat.value === null) {
    return <StampCard stat={stat} index={index} />;
  }

  return (
    <div
      className="lm-stat-item relative flex items-stretch overflow-hidden rounded-[10px] border border-[#1B2A5B]/12 bg-white pr-4 shadow-[0_4px_16px_-8px_rgba(27,42,91,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_-12px_rgba(27,42,91,0.18)]"
      style={{
        animationDelay: `${0.12 * index}s`,
        clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)",
      }}
    >
      {/* icon / code stub */}
      <div className="flex w-16 flex-none flex-col items-center justify-center gap-2 py-6 sm:w-[4.5rem]">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#1B2A5B]/[0.06] text-[#F7941D] ring-1 ring-[#1B2A5B]/[0.08]">
          <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
        </span>
      </div>

      {/* torn perforation divider */}
      <div className="relative my-2 w-px flex-none border-l-2 border-dashed border-[#1B2A5B]/20">
        <span
          className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full"
          style={{ backgroundColor: PAGE_BG }}
        />
        <span
          className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full"
          style={{ backgroundColor: PAGE_BG }}
        />
      </div>

      {/* value */}
      <div className="flex flex-1 flex-col justify-center gap-1 py-5 pl-4 text-left">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F7941D]">
          {stat.code}
        </div>
        <div
          className="text-[2rem] font-bold leading-none tabular-nums text-[#1B2A5B] sm:text-[2.15rem]"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          {count}
          {stat.suffix}
        </div>
        <div className="text-[12.5px] font-medium leading-snug text-slate-500">
          {stat.label}
        </div>
      </div>
    </div>
  );
}

export default function StatsSection() {
  const [active, setActive] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          obs.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

        @keyframes lm-stat-rise {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lm-bar-sweep {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes lm-truck-drive {
          0%   { transform: translateX(-10%); opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translateX(110%); opacity: 0; }
        }
        @keyframes lm-route-dash {
          to { stroke-dashoffset: -24; }
        }
        @keyframes lm-waypoint-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.25); }
        }
        .lm-stat-item {
          opacity: 0;
          animation: lm-stat-rise 0.7s cubic-bezier(0.16,1,0.3,1) forwards;
          animation-play-state: paused;
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
        }
        .lm-stats-active .lm-stat-item { animation-play-state: running; }
        .lm-bar-sweep {
          transform-origin: left;
          transform: scaleX(0);
        }
        .lm-stats-active .lm-bar-sweep {
          animation: lm-bar-sweep 1.1s cubic-bezier(0.16,1,0.3,1) forwards;
          animation-delay: 0.1s;
        }
        .lm-truck-track {
          animation: lm-truck-drive 14s linear infinite;
        }
        .lm-route-line {
          stroke-dasharray: 5 7;
          animation: lm-route-dash 1s linear infinite;
        }
        .lm-waypoint {
          animation: lm-waypoint-pulse 2.4s ease-in-out infinite;
        }
        .lm-waypoint:nth-child(2) { animation-delay: 0.3s; }
        .lm-waypoint:nth-child(3) { animation-delay: 0.6s; }
        .lm-waypoint:nth-child(4) { animation-delay: 0.9s; }
        @media (prefers-reduced-motion: reduce) {
          .lm-stat-item { opacity: 1 !important; animation: none !important; }
          .lm-bar-sweep { transform: scaleX(1) !important; animation: none !important; }
          .lm-truck-track, .lm-route-line, .lm-waypoint { animation: none !important; }
        }
      `}</style>

      <section
        ref={ref}
        className={`relative w-full overflow-hidden ${active ? "lm-stats-active" : ""}`}
        style={{ backgroundColor: PAGE_BG }}
      >
        {/* dispatch-map grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(#1B2A5B0d 1px, transparent 1px), linear-gradient(90deg, #1B2A5B0d 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* top accent line that sweeps in */}
        <div className="lm-bar-sweep absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#F7941D] via-amber-400 to-[#1B2A5B]" />

        {/* driving truck graphic along the top edge */}
        <div className="pointer-events-none absolute inset-x-0 top-[6px] h-6 overflow-hidden opacity-70">
          <div className="lm-truck-track absolute top-0">
            <Truck className="h-4 w-4 text-[#1B2A5B]" strokeWidth={2.4} />
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
          {/* manifest document header */}
          <div className="mb-3 flex items-center justify-between border-b border-dashed border-[#1B2A5B]/25 pb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1B2A5B]/70">
            <span className="flex items-center gap-1.5">
              <Route className="h-3.5 w-3.5 text-[#F7941D]" strokeWidth={2.4} />
              Manifest — Track Record
            </span>
            <span className="hidden sm:inline">No. LM / 2026 / STAT</span>
          </div>

          <h2
            className="mb-9 text-2xl font-semibold text-[#1B2A5B] sm:text-3xl"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            The numbers behind every consignment
          </h2>

          {/* curved route connecting each stat as a waypoint */}
          <div className="relative mb-3 hidden h-6 sm:block">
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
            >
              <path
                d="M12.5,14 Q25,4 37.5,14 T62.5,14 T87.5,14"
                fill="none"
                stroke="#1B2A5B"
                strokeOpacity="0.25"
                strokeWidth="1.4"
                vectorEffect="non-scaling-stroke"
                className="lm-route-line"
              />
            </svg>
            {[12.5, 37.5, 62.5, 87.5].map((pos, i) => (
              <span
                key={i}
                className="lm-waypoint absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#F7941D] shadow-[0_0_0_2px_rgba(27,42,91,0.15)]"
                style={{ left: `${pos}%` }}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {STATS.map((stat, i) => (
              <StatItem key={stat.label} stat={stat} active={active} index={i} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}