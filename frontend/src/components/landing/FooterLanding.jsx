import React from "react";
import { Truck, Mail, Phone, MapPin, ShieldCheck } from "lucide-react";
import { CiInstagram, CiLinkedin, CiFacebook, CiTwitter } from "react-icons/ci";

const linkGroups = [
  {
    title: "Product",
    links: ["Features", "E-Way Bill & GST", "Mobile Field App", "Integrations", "Pricing"],
  },
  {
    title: "Company",
    links: ["About Us", "Careers", "Clients", "Case Studies", "Contact"],
  },
  {
    title: "Resources",
    links: ["Blog", "Help Center", "API Docs", "Compliance Guide", "Live Demo"],
  },
];

const socials = [
  { icon: CiLinkedin, href: "#" },
  { icon: CiTwitter, href: "#" },
  { icon: CiFacebook, href: "#" },
  { icon: CiInstagram, href: "#" },
];

export default function Footer() {
  return (
    <footer className="relative w-full overflow-hidden bg-gradient-to-b from-[#141B3C] to-[#0B1230] font-[Inter,ui-sans-serif]">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-96 w-96 rounded-full bg-[#F7941D]/10 blur-[110px]" />
      <div className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-indigo-500/10 blur-[100px]" />

      <div className="relative mx-auto max-w-6xl px-6 pb-6 pt-12 sm:px-10">
        {/* Main grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7941D]/15 ring-1 ring-[#F7941D]/40">
                <img src="/logo.png" className="bg-white rounded" alt="" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-white">
                Difmo Logistics
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-[#9AA3C4]">
              Purpose-built logistics software for Indian transport & courier
              companies — compliance, operations, and growth in one platform.
            </p>

            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#F0B978]">
              <ShieldCheck className="h-4 w-4" />
              ISO/IEC 27001:2022 Certified
            </div>

            {/* Socials */}
            <div className="mt-5 flex gap-3">
              {socials.map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-[#9AA3C4] ring-1 ring-white/10 transition-colors hover:bg-[#F7941D]/20 hover:text-white hover:ring-[#F7941D]/40"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {linkGroups.map((group) => (
            <div key={group.title}>
              <h4 className="mb-3 text-sm font-bold text-white">{group.title}</h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-[#9AA3C4] transition-colors hover:text-[#F7941D]"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact strip */}
        <div className="mt-8 grid grid-cols-1 gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
              <Phone className="h-4 w-4 text-[#F7941D]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7392]">Call Us</p>
              <p className="text-sm font-medium text-white">+91 98765 43210</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
              <Mail className="h-4 w-4 text-[#F7941D]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7392]">Email Us</p>
              <p className="text-sm font-medium text-white">Difmogroup@gmail.com</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
              <MapPin className="h-4 w-4 text-[#F7941D]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7392]">Location</p>
              <p className="text-sm font-medium text-white">Lucknow, Uttar Pradesh, India</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-5 sm:flex-row">
          <p className="text-center text-xs text-[#6B7392] sm:text-left">
            © 2026 Difmo Logistics. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-[#6B7392] transition-colors hover:text-[#F7941D]">
              Privacy Policy
            </a>
            <a href="#" className="text-xs text-[#6B7392] transition-colors hover:text-[#F7941D]">
              Terms of Service
            </a>
            <a href="#" className="text-xs text-[#6B7392] transition-colors hover:text-[#F7941D]">
              Refund Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}