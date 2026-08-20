import { useEffect, useRef, useState } from "react";
import { ArrowRight, Clock } from "lucide-react";
import React from "react";

/**
 * Logistics Mitra — Urgency CTA Banner
 * Shares the "manifest" design language with the rest of the page: a
 * clipped ticket corner (via a border-safe dog-ear overlay, not
 * clip-path), a rotated stamp badge, and a dashed route line.
 */

export default function Banners() {
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
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

        @keyframes cb-rise {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cb-route-dash { to { stroke-dashoffset: -24; } }
        @keyframes cb-truck-drive {
          0%   { transform: translateX(-6%); opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translateX(106%); opacity: 0; }
        }
        @keyframes cb-stamp-in {
          from { opacity: 0; transform: rotate(-18deg) scale(0.7); }
          to   { opacity: 1; transform: rotate(-8deg) scale(1); }
        }
        .cb-item {
          opacity: 0;
          animation: cb-rise 0.7s cubic-bezier(0.16,1,0.3,1) forwards;
          animation-play-state: paused;
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
        }
        .cb-active .cb-item { animation-play-state: running; }
        .cb-stamp {
          opacity: 0;
          animation: cb-stamp-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards;
          animation-play-state: paused;
          animation-delay: 0.4s;
        }
        .cb-active .cb-stamp { animation-play-state: running; }
        .cb-route-line { stroke-dasharray: 5 7; animation: cb-route-dash 1s linear infinite; }
        .cb-truck-track { animation: cb-truck-drive 6s linear infinite; }
        .cb-arrow { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .cb-btn:hover .cb-arrow { transform: translateX(5px); }
        .cb-btn:focus-visible { outline: 2px solid #F7941D; outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) {
          .cb-item, .cb-stamp { opacity: 1 !important; animation: none !important; transform: rotate(-8deg) !important; }
          .cb-route-line, .cb-truck-track { animation: none !important; }
        }
      `}</style>

      <section
        ref={ref}
        className={`w-full bg-[#F4F5FA] px-3 py-3 my-20 sm:px-3 sm:py-4 ${active ? "cb-active" : ""}`}
      >
        <div
          className="cb-item relative mx-auto max-w-7xl overflow-visible rounded-[14px] rounded-tr-none border border-dashed border-[#F7941D]/45 bg-gradient-to-br from-[#141B3C] via-[#1B2A5B] to-[#1B2A5B]"
          style={{ animationDelay: "0.05s" }}
        >
          {/* dog-ear corner notch — overlay triangles instead of clip-path, so the dashed border stays intact on every edge */}
          <span
            className="pointer-events-none absolute right-0 top-0 h-[22px] w-[22px]"
            style={{ background: "linear-gradient(135deg, transparent 50%, rgba(247,148,29,0.5) 50%)" }}
          />
          <span
            className="pointer-events-none absolute right-0 top-0 h-[19px] w-[19px]"
            style={{ background: "linear-gradient(135deg, transparent 50%, #F4F5FA 50%)" }}
          />

          {/* rotated "running late" stamp badge */}
          <div className="cb-stamp absolute -left-2.5 -top-3 z-10 flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 border-dashed border-[#F7941D] bg-[#1B2A5B] text-center shadow-lg">
            <Clock className="h-3.5 w-3.5 text-[#F7941D]" strokeWidth={2.4} />
            <span className="mt-1 font-mono text-[7.5px] font-bold leading-none tracking-[0.1em] text-[#F7941D]">
              PENDING
            </span>
          </div>

          {/* subtle grid texture — the one restrained ambient touch */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />

          <div className="relative flex flex-col items-start gap-4 px-5 pb-5 pt-6 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:pb-6 sm:pt-6">
            <div>
              <div className="mb-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#F7941D]/80">
                Manual Reconciliation · Every Month
              </div>
              <h3
                className="text-[1.4rem] font-bold leading-snug text-white sm:text-[1.75rem]"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                Your trucks are moving.{" "}
                <span className="text-[#F7941D]">Your billing shouldn't lag behind.</span>
              </h3>
              <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-slate-300 sm:text-[14.5px]">
                Every trip logged on paper or a spreadsheet is a trip that
                gets billed late, disputed, or missed entirely. Bring booking,
                POD, and invoicing onto one platform and close the gap.
              </p>
            </div>

            <button className="cb-btn group flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F7941D] to-amber-500 px-6 py-3.5 text-[14.5px] font-bold text-white shadow-[0_6px_20px_-6px_rgba(247,148,29,0.6)] transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0 sm:w-auto">
              See How We Fix This
              <ArrowRight className="cb-arrow h-4 w-4" />
            </button>
          </div>

          {/* dashed route line with a traveling truck along the bottom edge */}
          <div className="pointer-events-none relative h-5 overflow-hidden rounded-b-[14px]">
            <svg className="absolute inset-x-6 top-1/2 h-2 w-[calc(100%-3rem)] -translate-y-1/2 sm:inset-x-10 sm:w-[calc(100%-5rem)]" viewBox="0 0 100 2" preserveAspectRatio="none">
              <line
                x1="0" y1="1" x2="100" y2="1"
                stroke="#F7941D" strokeOpacity="0.35" strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                className="cb-route-line"
              />
            </svg>
          </div>
        </div>
      </section>
    </>
  );
}