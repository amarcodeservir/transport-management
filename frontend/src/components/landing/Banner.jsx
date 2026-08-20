import { useEffect, useRef, useState } from "react";
import { ArrowRight, Clock } from "lucide-react";
import React from "react";

/**
 * Logistics Mitra — Urgency CTA Banner
 * Shares the "manifest" design language with the stats bar: a clipped
 * ticket corner, dashed edge, a rotated stamp badge, and a dashed route
 * line — instead of stacked ambient glows and a shimmer sweep.
 *
 * The button navigates to the login page. If this project uses a router
 * (react-router, Next.js), swap the <a href="/login"> below for that
 * router's <Link>/navigate() — the href is kept so it still works as a
 * plain link either way.
 */

export default function CtaBanner({ loginHref = "/login" }) {
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
        @keyframes cb-route-dash {
          to { stroke-dashoffset: -24; }
        }
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
        .cb-route-line {
          stroke-dasharray: 5 7;
          animation: cb-route-dash 1s linear infinite;
        }
        .cb-truck-track { animation: cb-truck-drive 6s linear infinite; }
        .cb-arrow { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .cb-btn:hover .cb-arrow { transform: translateX(5px); }
        .cb-btn:focus-visible {
          outline: 2px solid #F7941D;
          outline-offset: 3px;
        }
        @media (prefers-reduced-motion: reduce) {
          .cb-item, .cb-stamp { opacity: 1 !important; animation: none !important; transform: rotate(-8deg) !important; }
          .cb-route-line, .cb-truck-track { animation: none !important; }
        }
      `}</style>

      <section
        ref={ref}
        className={`w-full bg-[#F4F5FA] px-2 py-2 sm:px-3 sm:py-7 ${active ? "cb-active" : ""}`}
      >
        <div
          className="cb-item relative mx-auto max-w-7xl overflow-visible rounded-[14px] border border-dashed border-[#F7941D]/35 bg-gradient-to-br from-[#141B3C] via-[#1B2A5B] to-[#1B2A5B]"
          style={{
            animationDelay: "0.05s",
            clipPath: "polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%)",
          }}
        >
          {/* rotated "urgent dispatch" stamp badge */}
          <div className="cb-stamp absolute -left-3 -top-4 z-10 flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-center rounded-full border-2 border-dashed border-[#F7941D] bg-[#1B2A5B] text-center shadow-lg">
            <Clock className="h-4 w-4 text-[#F7941D]" strokeWidth={2.4} />
            <span className="mt-1 font-mono text-[8px] font-bold leading-none tracking-[0.1em] text-[#F7941D]">
              URGENT
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

          <div className="relative flex flex-col items-start gap-6 px-6 pb-3 pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:pb-9 sm:pt-9">
            <div>
              <div className="mb-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#F7941D]/80">
                Fleet Billing · Consignment Backlog
              </div>
              <h3
                className="text-[1.4rem] font-bold leading-snug text-white sm:text-[1.75rem]"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                The longer you wait, the more it{" "}
                <span className="text-[#F7941D]">costs you.</span>
              </h3>
              <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-slate-300 sm:text-[14.5px]">
                Every month on spreadsheets means unreconciled freight, delayed
                PODs, and e-way bills that don't match your invoices.
              </p>
            </div>

            <a
              href={loginHref}
              className="cb-btn group flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F7941D] to-amber-500 px-6 py-3.5 text-[14.5px] font-bold text-white shadow-[0_6px_20px_-6px_rgba(247,148,29,0.6)] transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0 sm:w-auto"
            >
              Log In to Fix This
              <ArrowRight className="cb-arrow h-4 w-4" />
            </a>
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