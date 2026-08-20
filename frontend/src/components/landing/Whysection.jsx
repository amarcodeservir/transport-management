import { useEffect, useRef, useState } from "react";
import React from "react";
import { Check, X, Minus, ShieldCheck, ArrowRight, Truck } from "lucide-react";

const rows = [
  {
    feature: "Built for Indian logistics (LR, AWB, Docket workflows)",
    mitra: { type: "yes", label: "Built-in logistics workflows" },
    other: { type: "no", label: "Expensive customisation" },
  },
  {
    feature: "E-Way Bill & GST compliance integrated",
    mitra: { type: "yes", label: "Built-in, no extra cost" },
    other: { type: "partial", label: "Add-on or third-party" },
  },
  {
    feature: "Multi-branch real-time operational dashboard",
    mitra: { type: "yes", label: "Live across all branches" },
    other: { type: "partial", label: "Custom dev required" },
  },
  {
    feature: "COD collection with OTP field confirmation",
    mitra: { type: "yes", label: "OTP + auto-reconcile" },
    other: { type: "no", label: "Not available" },
  },
  {
    feature: "AWB / LR auto-generation with volumetric weight",
    mitra: { type: "yes", label: "Auto-numbered" },
    other: { type: "no", label: "Manual entry" },
  },
  {
    feature: "GSTR-1 & GSTR-3B report auto-generation",
    mitra: { type: "yes", label: "One click, CA-ready" },
    other: { type: "partial", label: "Manual or third-party" },
  },
  {
    feature: "Photo + Signature ePOD from mobile field app",
    mitra: { type: "yes", label: "Photo, signature, OTP" },
    other: { type: "partial", label: "Basic or absent" },
  },
  {
    feature: "Logistics domain expertise behind the product",
    mitra: { type: "yes", label: "18 Yrs, 100+ clients" },
    other: { type: "no", label: "Generic software company" },
  },
  {
    feature: "Data security certification",
    mitra: { type: "yes", label: "ISO/IEC 27001:2022" },
    other: { type: "partial", label: "Varies / self-declared" },
  },
];

function StatusPill({ status }) {
  const styles = {
    yes: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    no: "bg-rose-50 text-rose-600 ring-1 ring-rose-200",
    partial: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  };
  const icons = {
    yes: <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />,
    no: <X className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />,
    partial: <Minus className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.03em] ${styles[status.type]}`}
    >
      {icons[status.type]}
      {status.label}
    </span>
  );
}

export default function LogisticsComparison() {
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
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

        @keyframes lc-rise {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lc-row-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes lc-route-dash { to { stroke-dashoffset: -24; } }
        @keyframes lc-truck-drive {
          0%   { transform: translateX(-6%); opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translateX(106%); opacity: 0; }
        }
        .lc-item {
          opacity: 0;
          animation: lc-rise 0.6s cubic-bezier(0.16,1,0.3,1) forwards;
          animation-play-state: paused;
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
        }
        .lc-active .lc-item { animation-play-state: running; }
        .lc-row {
          opacity: 0;
          animation: lc-row-fade 0.5s ease forwards;
          animation-play-state: paused;
        }
        .lc-active .lc-row { animation-play-state: running; }
        .lc-route-line { stroke-dasharray: 5 7; animation: lc-route-dash 1s linear infinite; }
        .lc-truck-track { animation: lc-truck-drive 6s linear infinite; }
        .lc-arrow { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .lc-cta-btn:hover .lc-arrow { transform: translateX(5px); }
        .lc-cta-btn:focus-visible { outline: 2px solid #F7941D; outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) {
          .lc-item, .lc-row { opacity: 1 !important; animation: none !important; }
          .lc-route-line, .lc-truck-track { animation: none !important; }
        }
      `}</style>

      <div
        ref={ref}
        className={`flex w-full items-center justify-center bg-[#F4F5FA] p-4 sm:p-8 ${active ? "lc-active" : ""}`}
      >
        <div className="w-full max-w-6xl">
          {/* eyebrow — matches the manifest heading used across the page */}
          <div
            className="lc-item flex items-center justify-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F7941D]"
            style={{ animationDelay: "0.02s" }}
          >
            <span className="h-px w-8 bg-[#F7941D]/40 sm:w-12" />
            Platform Comparison · 9 Capabilities
            <span className="h-px w-8 bg-[#F7941D]/40 sm:w-12" />
          </div>

          {/* Heading */}
          <h1
            className="lc-item mt-4 text-center text-3xl font-bold leading-tight tracking-tight text-[#1B2A5B] sm:text-4xl"
            style={{ fontFamily: "'Oswald', sans-serif", animationDelay: "0.08s" }}
          >
            Built Only for Logistics.{" "}
            <span className="text-[#F7941D]">Not Adapted From Something Else.</span>
          </h1>
          <p
            className="lc-item mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-slate-500 sm:text-base"
            style={{ animationDelay: "0.14s" }}
          >
            Generic ERPs and foreign logistics software force you to adapt your
            business to their system. Logistics Mitra was designed ground-up
            for Indian logistics companies — and the difference shows in every
            workflow, every report, and every compliance feature.
          </p>

          {/* Table card */}
          <div
            className="lc-item mt-10 overflow-hidden rounded-[16px] bg-white ring-1 ring-[#1B2A5B]/10"
            style={{ animationDelay: "0.2s", boxShadow: "0 20px 60px -15px rgba(27,42,91,0.15)" }}
          >
            {/* Header row */}
            <div className="grid grid-cols-[1.4fr_1fr_1fr] sm:grid-cols-[1.6fr_1fr_1fr]">
              <div className="flex items-center px-5 py-4 sm:px-7">
                <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:text-xs">
                  Feature / Capability
                </span>
              </div>
              <div className="mx-1 mt-1 flex items-center justify-center rounded-t-[12px] bg-gradient-to-br from-[#141B3C] to-[#1B2A5B] px-3 py-4 sm:px-5">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white sm:text-sm">
                  <ShieldCheck className="h-4 w-4 text-[#F7941D]" />
                  Logistics Mitra
                </span>
              </div>
              <div className="flex items-center justify-center px-3 py-4 sm:px-5">
                <span className="text-center font-mono text-[10.5px] font-bold uppercase tracking-[0.06em] text-slate-400 sm:text-xs">
                  Generic ERP / Other
                </span>
              </div>
            </div>

            {/* Rows */}
            <div>
              {rows.map((row, i) => (
                <div
                  key={row.feature}
                  className={`lc-row grid grid-cols-[1.4fr_1fr_1fr] items-center sm:grid-cols-[1.6fr_1fr_1fr] ${i !== rows.length - 1 ? "border-b border-dashed border-[#1B2A5B]/12" : ""
                    }`}
                  style={{ animationDelay: `${0.3 + i * 0.05}s` }}
                >
                  <div className="px-5 py-4 sm:px-7">
                    <span className="text-[13px] font-medium text-slate-700 sm:text-sm">
                      {row.feature}
                    </span>
                  </div>
                  <div className="mx-1 flex h-full items-center justify-center bg-[#F7941D]/[0.05] px-2 py-3 sm:px-4">
                    <StatusPill status={row.mitra} />
                  </div>
                  <div className="flex justify-center px-2 py-3 sm:px-4">
                    <StatusPill status={row.other} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA banner */}

        </div>
      </div>
    </>
  );
}