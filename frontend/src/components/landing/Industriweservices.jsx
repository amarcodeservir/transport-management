import { useEffect, useRef, useState } from "react";
import React from "react";
import { Package, Truck, PackageCheck, ShoppingCart, BarChart3, Store } from "lucide-react";

const INDUSTRIES = [
    {
        id: 1,
        icon: Package,
        key: true,
        title: "3PL Logistics",
        description: "Multi-client billing, client-wise rate contracts, and real-time branch dashboards for managing complex 3PL operations from a single platform.",
    },
    {
        id: 2,
        icon: Truck,
        key: true,
        title: "Transport & Freight",
        description: "LR/Docket generation, vehicle allocation, manifest dispatch, and hub-to-hub transit tracking built for full-truckload and part-load operations.",
    },
    {
        id: 3,
        icon: PackageCheck,
        key: true,
        title: "Courier & Express",
        description: "AWB auto-generation, delivery runsheets, photo + OTP ePOD from the mobile app, and instant customer SMS/email alerts for every shipment.",
    },
    {
        id: 4,
        icon: ShoppingCart,
        key: true,
        title: "E-commerce Logistics",
        description: "Handle high-volume COD reconciliation, RTO management, and multi-channel shipment booking built to scale with peak-season surges.",
    },
    {
        id: 5,
        icon: BarChart3,
        key: true,
        title: "Distribution & Supply Chain",
        description: "Branch-wise dispatch planning, inter-branch transfers, and TAT analysis across your entire distribution network, all visible in one screen.",
    },
    {
        id: 6,
        icon: Store,
        key: true,
        title: "FMCG & Retail Distribution",
        description: "Manage high-velocity, multi-stop delivery routes with per-client billing rules, GST e-invoicing, and automatic GSTR report generation.",
    },
];

function IndustriesWeServe() {
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
            { threshold: 0.1 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

        @keyframes iw-rise {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes iw-icon-pop {
          0%   { transform: scale(0.7) rotate(-6deg); }
          60%  { transform: scale(1.1) rotate(3deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .iw-item {
          opacity: 0;
          animation: iw-rise 0.6s cubic-bezier(0.16,1,0.3,1) forwards;
          animation-play-state: paused;
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
        }
        .iw-active .iw-item { animation-play-state: running; }
        .iw-card {
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .iw-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 18px 34px -20px rgba(27,42,91,0.28);
        }
        .iw-card:hover .iw-icon-box { animation: iw-icon-pop 0.5s cubic-bezier(0.34,1.56,0.64,1); }
        @media (prefers-reduced-motion: reduce) {
          .iw-item { opacity: 1 !important; animation: none !important; }
          .iw-card, .iw-icon-box { animation: none !important; }
          .iw-card:hover { transform: none !important; }
        }
      `}</style>

            <section
                ref={ref}
                className={`w-full bg-white px-5 py-14 sm:px-8 sm:py-18 ${active ? "iw-active" : ""}`}
            >
                <div className="mx-auto max-w-6xl">
                    {/* Eyebrow */}
                    <div
                        className="iw-item flex items-center justify-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F7941D]"
                        style={{ animationDelay: "0.02s" }}
                    >
                        <span className="h-px w-8 bg-[#F7941D]/40 sm:w-12" />
                        Manifest of Industries · 6 Segments
                        <span className="h-px w-8 bg-[#F7941D]/40 sm:w-12" />
                    </div>

                    {/* Heading */}
                    <h2
                        className="iw-item mt-4 text-center text-[1.85rem] font-bold leading-tight tracking-tight text-[#1B2A5B] sm:text-4xl"
                        style={{ fontFamily: "'Oswald', sans-serif", animationDelay: "0.08s" }}
                    >
                        Industries We <span className="text-[#F7941D]">Serve.</span>
                    </h2>

                    {/* Subtext */}
                    <p
                        className="iw-item mx-auto mt-4 max-w-2xl text-center text-[14.5px] leading-relaxed text-slate-500 sm:text-base"
                        style={{ animationDelay: "0.14s" }}
                    >
                        One platform, tuned to how each side of Indian logistics actually
                        runs — from 3PL contracts to last-mile retail delivery.
                    </p>

                    {/* Grid */}
                    <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {INDUSTRIES.map((ind) => {
                            const Icon = ind.icon;
                            const borderColor = ind.key ? "rgba(247,148,29,0.55)" : "rgba(27,42,91,0.18)";
                            return (
                                <div
                                    key={ind.id}
                                    className={`iw-item iw-card relative flex min-h-[220px] flex-col rounded-[10px] rounded-tr-none border bg-white p-6 ${ind.key ? "border-[#F7941D]/55" : "border-[#1B2A5B]/[0.18]"
                                        }`}
                                    style={{ animationDelay: `${0.2 + (ind.id - 1) * 0.05}s` }}
                                >
                                    {/* dog-ear corner notch — overlay triangles instead of clip-path, so the border stays intact on every edge */}
                                    <span
                                        className="pointer-events-none absolute -right-px -top-px h-4 w-4"
                                        style={{ background: `linear-gradient(135deg, transparent 50%, ${borderColor} 50%)` }}
                                    />
                                    <span
                                        className="pointer-events-none absolute right-0 top-0 h-[13px] w-[13px]"
                                        style={{ background: "linear-gradient(135deg, transparent 50%, #ffffff 50%)" }}
                                    />

                                    <div className="flex items-start justify-between">
                                        <span className="font-mono text-[10.5px] font-semibold tracking-[0.1em] text-slate-400">
                                            IND·{String(ind.id).padStart(2, "0")}
                                        </span>
                                        {ind.key && (
                                            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#F7941D]">
                                                ★ Key
                                            </span>
                                        )}
                                    </div>

                                    <div
                                        className={`iw-icon-box mt-3 flex h-11 w-11 items-center justify-center rounded-[8px] ${ind.key ? "bg-[#F7941D]/10 text-[#F7941D]" : "bg-[#1B2A5B]/[0.06] text-[#1B2A5B]"
                                            }`}
                                    >
                                        <Icon className="h-5 w-5" strokeWidth={2.2} />
                                    </div>

                                    <h3
                                        className="mt-4 text-[16px] font-semibold leading-snug text-[#1B2A5B]"
                                        style={{ fontFamily: "'Oswald', sans-serif" }}
                                    >
                                        {ind.title}
                                    </h3>

                                    <p className="mt-2 flex-1 text-[13px] leading-relaxed text-slate-600">
                                        {ind.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </>
    );
}

export default IndustriesWeServe;