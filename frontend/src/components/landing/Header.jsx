import { useEffect, useState } from "react";
import { Menu, X, ChevronRight, LogIn } from "lucide-react";
import React from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Why Us", href: "#why-us" },
  { label: "Compliance", href: "#compliance" },
  { label: "Contact", href: "#contact" },
];

export default function LogisticsHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    setMenuOpen(false);

    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.querySelector(targetId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
      return;
    }

    const element = document.querySelector(targetId);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    if (location.pathname !== "/") {
      navigate("/");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const solid = scrolled || menuOpen;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 w-full transition-all duration-300 ${solid
        ? "border-b border-slate-200/80 bg-white/95 shadow-md shadow-slate-900/5 backdrop-blur-md"
        : "border-b border-slate-200/40 bg-white/80 backdrop-blur-sm"
        }`}
    >
      <div className="mx-auto flex h-[80px] max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* Logo - Left */}
        <a
          href="#home"
          onClick={handleLogoClick}
          className="flex shrink-0 items-center transition-transform duration-200 hover:scale-[1.02]"
        >
          <img
            src="/logo.png"
            alt="Globalex Logistics"
            className="h-14 w-auto max-w-[220px] object-contain"
          />
        </a>

        {/* Desktop nav - Centered */}
        <nav className="hidden lg:flex items-center justify-center gap-9 flex-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="group relative text-[15px] font-semibold text-slate-700 transition-colors hover:text-[#0E60A8]"
            >
              {link.label}
              <span className="absolute -bottom-1.5 left-0 h-[2.5px] w-0 rounded-full bg-gradient-to-r from-[#0E60A8] to-[#F7941D] transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        {/* Desktop actions - Right */}
        <div className="hidden items-center gap-3 lg:flex">
          <button
            onClick={(e) => handleNavClick(e, "#contact")}
            className="relative overflow-hidden rounded-xl border-2 border-[#0E60A8] px-5 py-2.5 text-[15px] font-bold text-[#0E60A8] transition-all duration-300 hover:bg-[#0E60A8] hover:text-white hover:shadow-md shadow-slate-200"
          >
            Request Free Demo
          </button>

          <Link
            to="/login"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0E60A8] to-[#0A2342] px-5 py-2.5 text-[15px] font-bold text-white shadow-md transition-all duration-300 hover:opacity-95 hover:shadow-lg"
          >
            <LogIn className="h-[18px] w-[18px]" />
            Login
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((v) => !v)}
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-800 hover:bg-slate-100 lg:hidden"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`grid overflow-hidden border-t border-slate-100 bg-white transition-[grid-template-rows] duration-300 ease-out lg:hidden ${menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
      >
        <div className="min-h-0">
          <nav className="flex flex-col gap-1 px-5 py-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="flex items-center justify-between rounded-lg px-3 py-3 text-[15px] font-semibold text-slate-800 transition-colors hover:bg-slate-50"
              >
                {link.label}
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2.5 border-t border-slate-100 pt-4">
              <button
                onClick={(e) => handleNavClick(e, "#contact")}
                className="rounded-xl border-2 border-[#0E60A8] px-5 py-2.5 text-[15px] font-bold text-[#0E60A8] transition-colors hover:bg-[#0E60A8]/5"
              >
                Request Free Demo
              </button>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0E60A8] to-[#0A2342] px-5 py-2.5 text-[15px] font-bold text-white shadow-md"
              >
                <LogIn className="h-[18px] w-[18px]" />
                Login
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}