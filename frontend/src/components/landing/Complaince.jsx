import React from "react";
import {
  FileCheck2,
  Receipt,
  BellRing,
  Landmark,
  MessageCircleMore,
  ShieldCheck,
  FileSpreadsheet,
  Cloud,
  Flag,
} from "lucide-react";

const tags = [
  { label: "E-Way Bill Integration", icon: FileCheck2 },
  { label: "GST E-Invoice", icon: Receipt },
  { label: "GSTR-1 & GSTR-3B", icon: FileSpreadsheet },
  { label: "TDS Receivable/Payable", icon: Landmark },
  { label: "SMS & Email Auto-Alerts", icon: MessageCircleMore },
  { label: "ISO/IEC 27001:2022", icon: ShieldCheck },
];

const cards = [
  {
    title: "E-Way Bill Auto-Management",
    desc: "Auto-extend E-Way Bill validity. Expiry alerts before it lapses. Consolidated e-way bill printing for multi-shipment trips.",
    icon: FileCheck2,
  },
  {
    title: "GST-Ready Invoicing",
    desc: "State-wise GST calculation, Reverse Charge (RCM) billing, and GST invoice generation — all automated by party and route.",
    icon: Receipt,
  },
  {
    title: "Client Auto-Alert System",
    desc: "Per-client SMS and Email configurations for Booking, Delivered, and Undelivered events. Clients stay informed automatically.",
    icon: BellRing,
  },
  {
    title: "Secure Cloud Infrastructure",
    desc: "ISO/IEC 27001:2022 certified security practices. Role-based access control so only the right people see the right data.",
    icon: Cloud,
  },
];

export default function IndiaComplianceSection() {
  return (
    <section
      id="compliance"
      className="relative w-full overflow-hidden bg-[#0B1230] py-14 font-[Inter,ui-sans-serif] sm:py-16"
    >
      {/* Ambient glow accents */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#F5860C]/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-indigo-500/10 blur-[110px]" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        {/* Left column */}
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#C9CFE8] ring-1 ring-white/15">
            <Flag className="h-3.5 w-3.5 text-[#F5860C]" />
            India-First Compliance
          </div>

          <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-white sm:text-[2.6rem]">
            Built for Indian Regulations.
            <br />
            <span className="text-[#F5860C]">Built for Indian Operations.</span>
          </h1>

          <p className="mt-5 max-w-md text-sm leading-relaxed text-[#9AA3C4] sm:text-[15px]">
            Every compliance requirement that Indian logistics companies face is
            already built into Logistics Mitra — not an add-on, not a plugin.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {tags.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-lg bg-white/[0.04] px-4 py-2 text-xs font-semibold text-[#F0B978] ring-1 ring-[#F5860C]/40 transition-colors hover:bg-white/[0.07] hover:ring-[#F5860C]/70 sm:text-[13px]"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Right column — feature grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cards.map(({ title, desc, icon: Icon }) => (
            <div
              key={title}
              className="group relative rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 ring-1 ring-white/10 transition-all duration-300 hover:ring-[#F5860C]/50 sm:p-6"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5860C]/15 ring-1 ring-[#F5860C]/30 transition-colors group-hover:bg-[#F5860C]/25">
                <Icon className="h-5 w-5 text-[#F5860C]" strokeWidth={2} />
              </div>
              <h3 className="mb-2 text-[15px] font-bold leading-snug text-white sm:text-base">
                {title}
              </h3>
              <p className="text-[12.5px] leading-relaxed text-[#9AA3C4] sm:text-[13px]">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}