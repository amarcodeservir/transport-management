import React from "react";
import { useEffect, useState } from "react";
import {
  Video,
  BadgeCheck,
  ShieldCheck,
  Users,
  Truck,
  Package,
  Plane,
  Ship,
  MapPin,
  Bell,
} from "lucide-react";

const TRUST_BADGES = [
  { icon: BadgeCheck, label: "18+ Years Experience" },
  { icon: ShieldCheck, label: "ISO/IEC 27001:2022 Certified" },
  { icon: Users, label: "100+ Happy Clients" },
];

/* ---------------------------------------------------------
   Right-side decorative graphic: isometric package with
   floating notification / analytics / tracking cards.
--------------------------------------------------------- */
function TransportGraphic() {
  return (
    <div className="relative mx-auto h-[340px] w-[340px] lg:h-[400px] lg:w-[400px]">
      {/* soft glow behind the whole cluster */}
      <div className="absolute inset-0 rounded-full bg-[#F7941D]/10 blur-[70px]" />

      {/* base shadow platform */}
      <svg
        viewBox="0 0 400 400"
        className="lh-float-slow absolute inset-0 h-full w-full overflow-visible"
      >
        <polygon
          points="200,250 320,300 200,350 80,300"
          fill="url(#platformGradient)"
          opacity="0.55"
        />
        <defs>
          <linearGradient id="platformGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F7941D" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F7941D" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient id="cubeTop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDE7C6" />
            <stop offset="100%" stopColor="#F7C877" />
          </linearGradient>
          <linearGradient id="cubeLeft" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1B2A5B" />
            <stop offset="100%" stopColor="#131F45" />
          </linearGradient>
          <linearGradient id="cubeRight" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#243570" />
            <stop offset="100%" stopColor="#1B2A5B" />
          </linearGradient>
        </defs>

        {/* dashed connector lines */}
        <g stroke="#F7941D" strokeWidth="1.6" strokeDasharray="4 5" opacity="0.5">
          <path d="M150,130 L70,95" fill="none" />
          <path d="M255,140 L330,105" fill="none" />
          <path d="M255,225 L330,255" fill="none" />
        </g>

        {/* isometric package/cube */}
        <g className="lh-box">
          {/* top face */}
          <polygon points="200,90 280,130 200,170 120,130" fill="url(#cubeTop)" />
          {/* left face */}
          <polygon points="120,130 200,170 200,265 120,225" fill="url(#cubeLeft)" />
          {/* right face */}
          <polygon points="280,130 200,170 200,265 280,225" fill="url(#cubeRight)" />

          {/* tape lines on top */}
          <line x1="160" y1="112" x2="240" y2="150" stroke="#F7941D" strokeWidth="2" opacity="0.7" />
          <line x1="200" y1="93" x2="200" y2="168" stroke="#FCEBD1" strokeWidth="1.5" opacity="0.6" />

          {/* seal / badge dot on top */}
          <circle cx="200" cy="103" r="9" fill="#FFFFFF" opacity="0.9" />
          <circle cx="200" cy="103" r="9" fill="none" stroke="#F7941D" strokeWidth="2" />
        </g>
      </svg>

      {/* Card 1 — shipment notification (top-left) */}
      <div
        className="lh-card-float absolute left-0 top-[14%] flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-2.5 shadow-[0_10px_30px_-8px_rgba(27,42,91,0.25)] ring-1 ring-black/5"
        style={{ animationDelay: "0.2s" }}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F7941D]/15 text-[#F7941D]">
          <Bell className="h-4 w-4" strokeWidth={2.4} />
        </span>
        <div>
          <p className="text-[11.5px] font-bold leading-tight text-slate-800">
            Order Shipped
          </p>
          <p className="text-[10px] leading-tight text-slate-400">AWB #48213</p>
        </div>
      </div>

      {/* Card 2 — analytics (top-right) */}
      <div
        className="lh-card-float absolute right-0 top-[22%] flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-2.5 shadow-[0_10px_30px_-8px_rgba(27,42,91,0.25)] ring-1 ring-black/5"
        style={{ animationDelay: "0.9s" }}
      >
        <div className="flex items-end gap-[3px]">
          <span className="h-3 w-1.5 rounded-sm bg-[#F7941D]/40" />
          <span className="h-5 w-1.5 rounded-sm bg-[#F7941D]/70" />
          <span className="h-7 w-1.5 rounded-sm bg-[#F7941D]" />
        </div>
        <div>
          <p className="text-[11.5px] font-bold leading-tight text-slate-800">
            Live Dashboard
          </p>
          <p className="text-[10px] leading-tight text-slate-400">All branches</p>
        </div>
      </div>

      {/* Card 3 — tracking phone (bottom-right) */}
      <div
        className="lh-card-float absolute bottom-[8%] right-[6%] flex items-center gap-2.5 rounded-2xl bg-[#1B2A5B] p-2.5 shadow-[0_14px_34px_-8px_rgba(27,42,91,0.4)] ring-1 ring-white/10"
        style={{ animationDelay: "1.5s" }}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F7941D]/20 text-[#F7941D]">
          <MapPin className="h-4.5 w-4.5" strokeWidth={2.3} />
        </span>
        <div>
          <p className="text-[11.5px] font-bold leading-tight text-white">
            Live Tracking
          </p>
          <p className="text-[10px] leading-tight text-slate-300">On the way</p>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        @keyframes lh-rise {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lh-glow {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 1; }
        }
        @keyframes lh-blob-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(30px, -20px) scale(1.15); }
        }
        @keyframes lh-blob-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(-25px, 25px) scale(1.1); }
        }
        @keyframes lh-drift {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 0.7; }
          90%  { opacity: 0.4; }
          100% { transform: translateY(-140px) translateX(20px); opacity: 0; }
        }
        @keyframes lh-truck-move {
          0%   { left: -8%; opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { left: 96%; opacity: 0; }
        }
    
       
        @keyframes lh-node-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(247,148,29,0.45); }
          50%      { box-shadow: 0 0 0 7px rgba(247,148,29,0); }
        }
        @keyframes lh-node-bob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-5px); }
        }
        @keyframes lh-spark {
          0%   { offset-distance: 0%; opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
        @keyframes lh-card-bob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-9px); }
        }
        @keyframes lh-float-slow {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(6px); }
        }
        .lh-rail-dash { stroke-dasharray: 5 7; animation: lh-rail-dash 0.9s linear infinite; }
        .lh-node { animation: lh-node-pulse 2.8s ease-in-out infinite, lh-node-bob 4s ease-in-out infinite; }
        .lh-node:nth-child(2) { animation-delay: 0.6s, 0.6s; }
        .lh-node:nth-child(3) { animation-delay: 1.2s, 1.2s; }
        .lh-spark {
          offset-path: path("M1,1 L1,420");
          animation: lh-spark 4.5s linear infinite;
        }
        .lh-item { opacity: 0; animation: lh-rise 0.75s cubic-bezier(0.16,1,0.3,1) forwards; }
        .lh-bar-glow { animation: lh-glow 3.5s ease-in-out infinite; }
        .lh-blob-a { animation: lh-blob-a 9s ease-in-out infinite; }
        .lh-blob-b { animation: lh-blob-b 11s ease-in-out infinite; }
        .lh-particle { animation: lh-drift linear infinite; }
        .lh-truck { animation: lh-truck-move 8s ease-in-out infinite; }
        .lh-dash-line { stroke-dasharray: 6 8; animation: lh-dash 1s linear infinite; }
        .lh-box { animation: lh-box-bob 3.2s ease-in-out infinite; transform-origin: 200px 265px; }
        .lh-card-float { animation: lh-card-bob 4.2s ease-in-out infinite; }
        .lh-float-slow { animation: lh-float-slow 5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .lh-item { opacity: 1 !important; animation: none !important; }
          .lh-bar-glow, .lh-blob-a, .lh-blob-b, .lh-particle,
          .lh-truck, .lh-dash-line, .lh-box,
          .lh-rail-dash, .lh-node, .lh-spark,
          .lh-card-float, .lh-float-slow { animation: none !important; }
        }
      `}</style>

      <section className="relative isolate flex pt-10 min-h-[460px] w-full items-center overflow-hidden bg-white sm:min-h-[500px] lg:min-h-[560px]">
        {/* Top accent bar */}
        <div className="lh-bar-glow absolute inset-x-0 top-0 z-20 h-[3px] bg-gradient-to-r from-[#F7941D] via-amber-400 to-[#F7941D]" />

        {/* Ambient glow graphics — soft on white */}
        <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
          <div className="lh-blob-a absolute -left-24 top-0 h-80 w-80 rounded-full bg-[#F7941D]/12 blur-[100px]" />
          <div className="lh-blob-b absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#1B2A5B]/8 blur-[110px]" />
        </div>

        {/* Fine grid texture */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #1B2A5B 1px, transparent 1px), linear-gradient(to bottom, #1B2A5B 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />

        {/* Drifting particles */}
        <div className="pointer-events-none absolute inset-0 -z-10 hidden sm:block">
          {[
            { left: "10%", delay: "0s", dur: "7s", size: 3 },
            { left: "24%", delay: "1.4s", dur: "9s", size: 2 },
            { left: "38%", delay: "2.6s", dur: "8s", size: 3 },
            { left: "55%", delay: "0.6s", dur: "10s", size: 2 },
            { left: "70%", delay: "3.2s", dur: "7.5s", size: 3 },
          ].map((p, i) => (
            <span
              key={i}
              className="lh-particle absolute bottom-0 rounded-full bg-[#F7941D]/50"
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

        {/* Floating package icons — small transport-themed accents */}
        <div className="pointer-events-none absolute inset-0 -z-10 hidden lg:block">
          <Package
            className="lh-box absolute left-[6%] top-[22%] h-5 w-5 text-[#F7941D]/40"
            style={{ animationDelay: "0.3s" }}
          />
          <Package
            className="lh-box absolute left-[16%] top-[62%] h-4 w-4 text-[#1B2A5B]/25"
            style={{ animationDelay: "1.5s" }}
          />
        </div>

        {/* Left-side transport route graphic — decorative */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-0 hidden w-24 lg:block">
          <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 24 480" preserveAspectRatio="none">
            
            <circle className="lh-spark" r="3" fill="#F7941D" opacity="0.9" />
          </svg>

          <div className="lh-node absolute left-[4px] top-[8%] flex h-6 w-6 items-center justify-center rounded-full bg-[#F7941D]/10 ring-1 ring-[#F7941D]/40">
            <Ship className="h-3.5 w-3.5 text-[#F7941D]" strokeWidth={2.2} />
          </div>
          <div className="lh-node absolute left-[4px] top-[46%] flex h-6 w-6 items-center justify-center rounded-full bg-[#F7941D]/10 ring-1 ring-[#F7941D]/40">
            <Truck className="h-3.5 w-3.5 text-[#F7941D]" strokeWidth={2.2} />
          </div>
          <div className="lh-node absolute left-[4px] top-[84%] flex h-6 w-6 items-center justify-center rounded-full bg-[#F7941D]/10 ring-1 ring-[#F7941D]/40">
            <Plane className="h-3.5 w-3.5 rotate-90 text-[#F7941D]" strokeWidth={2.2} />
          </div>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center gap-10 px-5 py-14 sm:px-8 sm:py-16 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:py-20">
          <div className="max-w-3xl">
            <div
              className="lh-item mb-5 inline-flex items-center gap-2.5 rounded-full border border-[#1B2A5B]/15 bg-[#1B2A5B]/[0.04] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#B4680F]"
              style={{ animationDelay: "0s" }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F7941D] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#F7941D]" />
              </span>
              Trusted by 100+ logistics companies since 2007
              <span className="h-1.5 w-1.5 rounded-full bg-[#F7941D]" />
            </div>

            <h1 className="font-serif text-[1.5rem] font-bold leading-[1.22] tracking-tight text-[#101935] sm:text-[1.85rem] lg:text-[2.35rem]">
              <span className="lh-item block" style={{ animationDelay: "0.05s" }}>
                Replace Spreadsheets
              </span>
              <span className="lh-item block" style={{ animationDelay: "0.16s" }}>
                with a Complete
              </span>
              <span className="lh-item block text-[#F7941D]" style={{ animationDelay: "0.27s" }}>
                Logistics Management
              </span>
              <span className="lh-item block" style={{ animationDelay: "0.38s" }}>
                <span className="text-[#F7941D]">Software</span> — Built for
              </span>
              <span className="lh-item block" style={{ animationDelay: "0.49s" }}>
                India
              </span>
            </h1>

            <div
              className="lh-item mt-4 h-[3px] w-14 rounded-full bg-[#F7941D]"
              style={{ animationDelay: "0.55s" }}
            />

            <p
              className="lh-item mt-4 max-w-xl text-[13px] leading-relaxed text-slate-600 sm:text-[14px]"
              style={{ animationDelay: "0.62s" }}
            >
              Stop managing pickups on WhatsApp, billing on Excel, and E-Way
              Bills separately. One platform connects your entire operation —
              across every branch, every shipment, every rupee.
            </p>

            <div className="lh-item mt-7" style={{ animationDelay: "0.74s" }}>
              <button className="group inline-flex items-center gap-2.5 rounded-xl border-2 border-[#1B2A5B] px-6 py-3 text-[14px] font-bold text-[#1B2A5B] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#F7941D] hover:bg-[#F7941D]/10 hover:text-[#B4680F] hover:shadow-[0_8px_24px_-8px_rgba(247,148,29,0.4)] active:translate-y-0 sm:text-[15px]">
                <Video className="h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110" />
                Request Free Demo
              </button>
            </div>

            <div
              className="lh-item mt-8 flex flex-wrap items-center gap-x-8 gap-y-3"
              style={{ animationDelay: "0.86s" }}
            >
              {TRUST_BADGES.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 text-[13px] font-medium text-slate-600 sm:text-[13.5px]"
                >
                  <Icon className="h-4 w-4 text-[#F7941D]" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right-side isometric transport graphic */}
          <div
            className="lh-item hidden shrink-0 lg:block"
            style={{ animationDelay: "0.4s" }}
          >
            <TransportGraphic />
          </div>
        </div>

        {/* Animated truck-on-route graphic — signature transport motif, bottom-left */}
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 hidden sm:block">
          <div className="relative mx-auto h-8 w-full max-w-md sm:max-w-lg lg:ml-8 lg:mr-auto">
            <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 400 20">
              <line
                x1="0"
                y1="10"
                x2="400"
                y2="10"
                stroke="#F7941D"
                strokeWidth="2"
                strokeLinecap="round"
                className="lh-dash-line"
                opacity="0.4"
              />
            </svg>
            <div className="lh-truck absolute top-1/2 -translate-y-1/2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7941D] shadow-[0_0_16px_rgba(247,148,29,0.45)]">
                <Truck className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}