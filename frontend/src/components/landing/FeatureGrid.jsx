import { useEffect, useRef, useState } from "react";
import {
  FileText,
  LayoutDashboard,
  CalendarClock,
  Truck,
  MapPin,
  Wallet,
  Receipt,
  FileBarChart,
  Users,
  BarChart3,
  Lock,
  Package,
} from "lucide-react";
import React from "react";

const MODULES = [
  {
    id: 1,
    icon: FileText,
    key: true,
    title: "E-Way Bill — Integrated & Auto-Managed",
    description: "Auto-generate, extend, and track E-Way Bills within the platform. Expiry alerts before they lapse. No third-party tool needed.",
    tags: ["Auto-extend", "Expiry alerts", "No add-on cost"],
  },
  {
    id: 2,
    icon: LayoutDashboard,
    key: true,
    title: "Multi-Branch Real-Time Dashboard",
    description: "See every branch's performance live — consignments, in-transit, delivered, RTO, delayed and unbilled — all in one screen.",
    tags: ["Multi-branch", "Real-time"],
  },
  {
    id: 3,
    icon: CalendarClock,
    key: true,
    title: "Pickup & Booking with LR/AWB Auto-Gen",
    description: "Schedule pickups, auto-generate AWB/LR numbers, capture volumetric weight, assign vehicles, and generate field runsheets instantly.",
    tags: ["AWB Auto-gen", "Runsheet"],
  },
  {
    id: 4,
    icon: Truck,
    key: true,
    title: "Dispatch, Manifest & Transit Tracking",
    description: "Create manifests, allocate vehicles, and track every shipment in-transit with arrival scans at hubs across your branch network.",
    tags: ["Manifest gen", "Hub scanning"],
  },
  {
    id: 5,
    icon: MapPin,
    key: true,
    title: "Delivery & ePOD — Photo, Sign & OTP",
    description: "Assign delivery runsheets. Field team captures photo proof, signature, or OTP-based ePOD from the mobile app. Customers get SMS/email instantly.",
    tags: ["Photo POD", "OTP verify", "SMS alerts"],
  },
  {
    id: 6,
    icon: Wallet,
    key: true,
    title: "COD Collection & Auto-Reconciliation",
    description: "Track COD from the field in real-time. Field agents confirm via mobile. Client-wise outstanding and full ledger — auto-reconciled.",
    tags: ["OTP confirm", "Client ledger"],
  },
  {
    id: 7,
    icon: Receipt,
    key: true,
    title: "Smart Billing & Auto Invoice",
    description: "Client-wise billing with fuel surcharge, FOV, and other charges auto-calculated by rate contracts. Unbilled shipments flagged instantly.",
    tags: ["GST billing", "Rate contract"],
  },
  {
    id: 8,
    icon: FileBarChart,
    key: true,
    title: "GSTR Reports — One-Click, CA-Ready",
    description: "GSTR-1 & GSTR-3B reports auto-generated. State-wise GST, RCM billing, and E-invoicing — all automated. No more 2-day month-end struggle.",
    tags: ["GSTR-1 & 3B", "RCM billing", "E-invoice"],
  },
  {
    id: 9,
    icon: Users,
    key: true,
    title: "Client & Contract Management",
    description: "Manage customers, pricing contracts, SLAs, and per-client performance data. Per-client SMS/email alerts for booking, delivery, and non-delivery events.",
    tags: ["SLA tracking", "Auto-alerts"],
  },
  {
    id: 10,
    icon: BarChart3,
    key: true,
    title: "MIS, Sales & Admin Reports",
    description: "Branch-wise performance, TAT analysis, booking/dispatch/delivery reports — filterable by date, branch, client. Management-ready analytics in one click.",
    tags: ["TAT analysis", "Admin reports", "Sales analytics"],
  },
  {
    id: 11,
    icon: Lock,
    key: true,
    title: "Role-Based User Access Control",
    description: "Secure, role-based access for admins, branch managers, billing staff, and field agents. Each user sees only what they need.",
    tags: ["ISO certified", "Branch-level", "Role-based"],
  },
  {
    id: 12,
    icon: Package,
    key: true,
    title: "Shipment Booking & LR/AWB",
    description: "Standardized LR and AWB generation with GSTIN validation, consignor/consignee details, and volumetric weight — the way Indian logistics actually works.",
    tags: ["LR gen", "GSTIN validate", "Volumetric weight"],
  },
];

export default function FeaturesGrid() {
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

        @keyframes fg-rise {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fg-icon-pop {
          0%   { transform: scale(0.7) rotate(-6deg); }
          60%  { transform: scale(1.1) rotate(3deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .fg-item {
          opacity: 0;
          animation: fg-rise 0.6s cubic-bezier(0.16,1,0.3,1) forwards;
          animation-play-state: paused;
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
        }
        .fg-active .fg-item { animation-play-state: running; }
        .fg-card {
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .fg-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 18px 34px -20px rgba(27,42,91,0.28);
        }
        .fg-card:hover .fg-icon-box { animation: fg-icon-pop 0.5s cubic-bezier(0.34,1.56,0.64,1); }
        @media (prefers-reduced-motion: reduce) {
          .fg-item { opacity: 1 !important; animation: none !important; }
          .fg-card, .fg-icon-box { animation: none !important; }
          .fg-card:hover { transform: none !important; }
        }
      `}</style>

      <section
        ref={ref}
        className={`w-full bg-white px-5 py-16 sm:px-8 sm:py-20 ${active ? "fg-active" : ""}`}
      >
        <div className="mx-auto max-w-6xl">
          {/* Eyebrow — manifest heading, ties to the stats/CTA sections */}
          <div
            className="fg-item flex items-center justify-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F7941D]"
            style={{ animationDelay: "0.02s" }}
          >
            <span className="h-px w-8 bg-[#F7941D]/40 sm:w-12" />
            Manifest of Modules · 12 Items
            <span className="h-px w-8 bg-[#F7941D]/40 sm:w-12" />
          </div>

          {/* Heading */}
          <h2
            className="fg-item mt-4 text-center text-[1.85rem] font-bold leading-tight tracking-tight text-[#1B2A5B] sm:text-4xl lg:text-[2.4rem]"
            style={{ fontFamily: "'Oswald', sans-serif", animationDelay: "0.1s" }}
          >
            Twelve Modules. One Manifest Built for
            <span className="text-[#F7941D]">  Indian Logistics.</span>
          </h2>

          {/* Subtext */}
          <p
            className="fg-item mx-auto mt-4 max-w-2xl text-center text-[14.5px] leading-relaxed text-slate-500 sm:text-base"
            style={{ animationDelay: "0.18s" }}
          >
            Not a generic ERP retrofitted for logistics. Every feature was
            built from the ground up for how Indian transport and logistics
            companies actually operate.
          </p>

          {/* Grid */}
          <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => {
              const Icon = m.icon;
              const borderColor = m.key ? "rgba(247,148,29,0.55)" : "rgba(27,42,91,0.18)";
              return (
                <div
                  key={m.id}
                  className={`fg-item fg-card relative flex min-h-[290px] flex-col rounded-[10px] rounded-tr-none border bg-white p-6 ${m.key ? "border-[#F7941D]/55" : "border-[#1B2A5B]/[0.18]"
                    }`}
                  style={{ animationDelay: `${0.24 + (m.id - 1) * 0.05}s` }}
                >
                  {/* dog-ear corner notch — overlay triangles instead of clip-path, so the card border stays intact on every edge */}
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
                      MOD·{String(m.id).padStart(2, "0")}
                    </span>
                    {m.key && (
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#F7941D]">
                        ★ Key
                      </span>
                    )}
                  </div>

                  <div
                    className={`fg-icon-box mt-3 flex h-11 w-11 items-center justify-center rounded-[8px] ${m.key ? "bg-[#F7941D]/10 text-[#F7941D]" : "bg-[#1B2A5B]/[0.06] text-[#1B2A5B]"
                      }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                  </div>

                  <h3
                    className="mt-4 min-h-[48px] text-[16px] font-semibold leading-snug text-[#1B2A5B]"
                    style={{ fontFamily: "'Oswald', sans-serif" }}
                  >
                    {m.title}
                  </h3>

                  <p className="mt-2 flex-1 text-[13px] leading-relaxed text-slate-600">
                    {m.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {m.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-[4px] border border-dashed border-[#1B2A5B]/20 px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.03em] text-[#1B2A5B]/70"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}