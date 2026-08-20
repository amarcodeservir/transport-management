import { useEffect, useRef, useState } from "react";
import { Clock, Star, Map, Monitor, AlertTriangle } from "lucide-react";
import React from 'react'
/**
 * Logistics Mitra — "The Real Problem" section
 * React + Tailwind. Cards fade/rise in on scroll, with hover lift + icon animation.
 * A colored top border matches each card's accent so it reads well at rest, not just on hover.
 */

const PROBLEMS = [
  {
    icon: Star,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
    accent: "#f59e0b",
    accentSoft: "rgba(244,63,94,0.16)",
    title: "Billing Delays & Revenue Leakage",
    description:
      "Unbilled shipments, missed charges, and manual invoice errors silently cut into your margins every month. By the time you catch it, the money is gone.",
    tag: "Revenue walking out the door",
  },
  {
    icon: Map,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    accent: "#f59e0b",
    accentSoft: "rgba(245,158,11,0.16)",
    title: "Zero Branch Visibility",
    description:
      "Your team in Mumbai has no idea what's happening in Chennai. Managers call drivers for updates. Customers chase you for delivery status. Chaos becomes normal.",
    tag: "Delayed decisions, angry clients",
  },
  {
    icon: Monitor,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-500",
    accent: "#f59e0b",
    accentSoft: "rgba(99,102,241,0.16)",
    title: "E-Way Bill & Compliance Nightmares",
    description:
      "E-Way Bill expiry alerts missed. GST invoices done manually. GSTR returns taking 2 days every month. One compliance mistake can stop your entire operation.",
    tag: "Penalties & business disruption",
  },
];

export default function ProblemSection() {
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
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @keyframes ps-rise {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ps-badge-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(247,148,29,0.3); }
          50%      { box-shadow: 0 0 0 6px rgba(247,148,29,0); }
        }
        @keyframes ps-icon-pop {
          0%   { transform: scale(0.6) rotate(-8deg); opacity: 0; }
          60%  { transform: scale(1.08) rotate(3deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes ps-tag-shake {
          0%, 100% { transform: translateX(0); }
          20%      { transform: translateX(-1px); }
          40%      { transform: translateX(1px); }
          60%      { transform: translateX(-1px); }
          80%      { transform: translateX(1px); }
        }
        @keyframes ps-orb-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(26px, -18px) scale(1.1); }
        }
        @keyframes ps-orb-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(-22px, 20px) scale(1.08); }
        }
        @keyframes ps-particle-drift {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          12%  { opacity: 0.6; }
          88%  { opacity: 0.35; }
          100% { transform: translateY(-120px) translateX(16px); opacity: 0; }
        }
        @keyframes ps-divider-grow {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes ps-border-sweep {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .ps-orb-a { animation: ps-orb-a 8s ease-in-out infinite; }
        .ps-orb-b { animation: ps-orb-b 10s ease-in-out infinite; }
        .ps-particle { animation: ps-particle-drift linear infinite; }
        .ps-item {
          opacity: 0;
          animation: ps-rise 0.7s cubic-bezier(0.16,1,0.3,1) forwards;
          animation-play-state: paused;
        }
        .ps-active .ps-item { animation-play-state: running; }
        .ps-badge { animation: ps-badge-pulse 2.6s ease-in-out infinite; }
        .ps-divider {
          transform-origin: center;
          transform: scaleX(0);
        }
        .ps-active .ps-divider {
          animation: ps-divider-grow 0.6s cubic-bezier(0.16,1,0.3,1) forwards;
          animation-delay: 0.2s;
        }

        /* --- Card: colored top accent (always visible) + gradient border ring + glow + lift on hover ---
           NOTE: the entrance animation (ps-rise) lives on this same element via .ps-item.
           Hover styles below deliberately never touch the animation shorthand on
           .ps-card itself, since doing so would cancel ps-rise's forwards fill and snap
           opacity back to 0 (the card would appear to vanish on hover). The moving
           gradient instead animates on a separate ::after pseudo-element. */
        .ps-card {
          position: relative;
          isolation: isolate;
          height: 100%;
          display: flex;
          flex-direction: column;
          border-radius: 1rem;
          background: #ffffff;
          border: 1.5px solid #e5e9f0;
          border-top: 3px solid var(--ps-accent);
          padding: 1.5rem;
          overflow: hidden;
          transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), border-color 0.35s ease, box-shadow 0.35s ease;
          box-shadow: 0 4px 14px -8px var(--ps-accent-soft), 0 1px 2px rgba(27,42,91,0.04);
        }
        .ps-card:hover {
          transform: translateY(-7px);
          border-color: transparent;
          border-top-color: var(--ps-accent);
          box-shadow:
            0 22px 40px -22px var(--ps-accent-soft),
            0 0 0 4px var(--ps-accent-soft);
        }
        .ps-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(140px 100px at 85% -10%, var(--ps-accent-soft), transparent 70%);
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
          z-index: 0;
        }
        .ps-card:hover::before {
          opacity: 1;
        }
        /* animated gradient ring, isolated on its own layer/pseudo-element */
        .ps-card::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1.5px;
          background: linear-gradient(120deg, var(--ps-accent), transparent 35%, var(--ps-accent) 100%);
          background-size: 220% 220%;
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.35s ease;
          pointer-events: none;
          z-index: 0;
        }
        .ps-card:hover::after {
          opacity: 1;
          animation: ps-border-sweep 2.8s linear infinite;
        }
        .ps-icon-box {
          position: relative;
          z-index: 1;
          transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease;
          box-shadow: 0 0 0 5px var(--ps-accent-soft);
        }
        .ps-card:hover .ps-icon-box {
          animation: ps-icon-pop 0.55s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow: 0 0 0 6px var(--ps-accent-soft);
        }
        .ps-card:hover .ps-tag {
          animation: ps-tag-shake 0.4s ease-in-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .ps-item { opacity: 1 !important; animation: none !important; }
          .ps-badge, .ps-icon-box, .ps-tag, .ps-divider,
          .ps-orb-a, .ps-orb-b, .ps-particle { animation: none !important; }
          .ps-divider { transform: scaleX(1) !important; }
          .ps-card::after { animation: none !important; }
          .ps-card:hover { transform: none !important; }
        }
      `}</style>

      <section
        ref={ref}
        className={`relative w-full overflow-hidden bg-slate-50 px-5 py-6 sm:px-8 sm:py-8 ${active ? "ps-active" : ""}`}
      >
        {/* animated background orbs */}
        <div className="ps-orb-a pointer-events-none absolute -left-20 -top-16 h-72 w-72 rounded-full bg-[#F7941D]/10 blur-[90px]" />
        <div className="ps-orb-b pointer-events-none absolute -right-24 bottom-[-3rem] h-80 w-80 rounded-full bg-[#1B2A5B]/8 blur-[100px]" />

        {/* dotted texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage: "radial-gradient(#1B2A5B22 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* drifting particles */}
        <div className="pointer-events-none absolute inset-0 hidden sm:block">
          {[
            { left: "8%", delay: "0s", dur: "8s", size: 3 },
            { left: "22%", delay: "1.6s", dur: "10s", size: 2 },
            { left: "78%", delay: "0.8s", dur: "9s", size: 3 },
            { left: "92%", delay: "2.4s", dur: "11s", size: 2 },
          ].map((p, i) => (
            <span
              key={i}
              className="ps-particle absolute bottom-0 rounded-full bg-[#F7941D]/50"
              style={{
                left: p.left,
                width: p.size,
                height: p.size,
                animationDelay: p.delay,
                animationDuration: p.dur,
              }}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-6xl">          {/* Eyebrow badge */}
          <div className="ps-item flex justify-center" style={{ animationDelay: "0.02s" }}>
            <span className="ps-badge inline-flex items-center gap-2.5 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#F7941D]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F7941D]" />
              The Real Problem
              <span className="h-1.5 w-1.5 rounded-full bg-[#F7941D]" />
            </span>
          </div>

          {/* Heading */}
          <h2
            className="ps-item mt-5 text-center font-serif text-[1.55rem] font-bold leading-[1.25] tracking-tight text-[#1B2A5B] sm:text-[1.9rem] lg:text-[2.15rem]"
            style={{ animationDelay: "0.12s" }}
          >
            Still Running Your Logistics on{" "}
            <span className="text-[#F7941D]">Spreadsheets</span> and Phone
            Calls?
          </h2>

          {/* Divider */}
          <div
            className="ps-item mx-auto mt-4 flex justify-center"
            style={{ animationDelay: "0.18s" }}
          >
            <span className="ps-divider h-[3px] w-14 rounded-full bg-[#F7941D]" />
          </div>

          {/* Subtext */}
          <p
            className="ps-item mx-auto mt-4 max-w-2xl text-center text-[13.5px] leading-relaxed text-slate-500 sm:text-[14.5px]"
            style={{ animationDelay: "0.26s" }}
          >
            As your business grows across branches, cities, and warehouses —
            manual processes quietly drain your revenue and your time every
            single day.
          </p>

          {/* Cards */}
          <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PROBLEMS.map((p, i) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="ps-item ps-card"
                  style={{
                    animationDelay: `${0.32 + i * 0.12}s`,
                    "--ps-accent": p.accent,
                    "--ps-accent-soft": p.accentSoft,
                  }}
                >
                  <span
                    className={`ps-icon-box flex h-11 w-11 items-center justify-center rounded-xl ${p.iconBg} ${p.iconColor}`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                  </span>

                  <h3 className="relative z-[1] mt-4 text-[15.5px] font-bold text-[#1B2A5B]">
                    {p.title}
                  </h3>

                  <p className="relative z-[1] mt-2 flex-1 text-[13px] leading-relaxed text-slate-500">
                    {p.description}
                  </p>

                  <span className="ps-tag relative z-[1] mt-4 inline-flex w-fit items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-[12px] font-medium text-rose-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {p.tag}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}