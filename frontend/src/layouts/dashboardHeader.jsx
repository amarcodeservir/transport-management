import { useEffect, useState } from "react";
/* eslint-disable react/prop-types, no-unused-vars */
import {
  Bell,
  Search,
  User,
  ChevronDown,
  Menu,
  X,
  Settings,
  LogOut,
  HelpCircle,
  Moon,
  Sun,
  MessageCircle,
  Sparkles,
  Calendar,
  Download,
  Plus,
  Truck,
  FileText,
  Users,
  Receipt,
} from "lucide-react";
import { TiThMenu } from "react-icons/ti";
import React from 'react'
import { getNotifications, markAllNotificationsRead } from "../services/api.js/notificationService.js";

/**
 * Logistics Mitra — Dashboard Header
 * Modern header with search, notifications, user menu, and quick actions.
 * Features: sticky, glass effect, dropdown menus, dark/light mode toggle.
 *
 * `user` is now a real prop: { name, email, avatarUrl? } — pass the logged-in
 * user's data from your auth context/store. `onLogout` and `onNavigate` let
 * the parent wire up real actions instead of hardcoded links.
 */

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

export default function DashboardHeader({
  isSidebarCollapsed,
  onMenuToggle,
  user,
  onLogout,
  onNavigate,
}) {
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const displayName = user?.name || "Guest User";
  const displayEmail = user?.email || "—";
  const initials = getInitials(user?.name);

  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.avatarUrl]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let active = true;
    const loadNotifications = async () => {
      try {
        const result = await getNotifications();
        if (active) setNotifications(result.data || []);
      } catch {
        if (active) setNotifications([]);
      }
    };
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  // Update current time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isNotificationsOpen) {
        const notifBtn = document.getElementById('notifications-btn');
        const notifDropdown = document.getElementById('notifications-dropdown');
        if (notifBtn && !notifBtn.contains(e.target) && notifDropdown && !notifDropdown.contains(e.target)) {
          setIsNotificationsOpen(false);
        }
      }
      if (isUserMenuOpen) {
        const userBtn = document.getElementById('user-menu-btn');
        const userDropdown = document.getElementById('user-menu-dropdown');
        if (userBtn && !userBtn.contains(e.target) && userDropdown && !userDropdown.contains(e.target)) {
          setIsUserMenuOpen(false);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isNotificationsOpen, isUserMenuOpen]);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = async () => {
    if (!onLogout) {
      setIsUserMenuOpen(false);
      return;
    }
    setLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setLoggingOut(false);
      setIsUserMenuOpen(false);
    }
  };

  const normalizedRole = String(user?.role || "").toLowerCase().replace(/[-\s]+/g, "_");
  const userMenuItems = [
    { icon: User, label: "Dashboard", to: "/dashboard" },
    ...(normalizedRole === "organization_admin" ? [{ icon: Settings, label: "Organization Settings", to: "/dashboard/settings" }] : []),
    ...(["customer", "driver"].includes(normalizedRole) ? [{ icon: Settings, label: "Change Password", to: "/dashboard/password" }] : []),
    { icon: HelpCircle, label: "Notifications", to: "/dashboard/notifications" },
  ];
  const unreadNotifications = notifications.filter((notification) => !notification.is_read).length;

  const readAllNotifications = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
    } catch {
      // The full notifications page will surface API errors if the request fails.
    }
  };

  return (
    <>
      <style>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-bell {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .dropdown-animate {
          animation: slide-down 0.2s ease-out forwards;
        }
        .notification-badge {
          animation: pulse-bell 2s ease-in-out infinite;
        }
        .search-input {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .search-input:focus {
          box-shadow: 0 0 0 3px rgba(247, 148, 29, 0.2);
          border-color: #F7941D;
        }
        .quick-action-btn {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .quick-action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px -8px rgba(247, 148, 29, 0.3);
        }
      `}</style>

      <header
        className={`
          dashboard-header sticky top-0 z-40 w-full transition-all duration-300
          ${scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-[0_4px_20px_-6px_rgba(27,42,91,0.08)] border-b border-slate-200'
            : 'bg-white border-b border-slate-100'
          }
          ${isDark ? 'dark:bg-gray-900/95 dark:border-gray-700' : ''}
        `}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          {/* Left section - Mobile toggle + Title */}
          <div className="flex items-center gap-4">
            {/* Menu toggle */}
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              {isSidebarCollapsed ? <Menu size={20} /> : <TiThMenu size={20} />}
            </button>

            <div>
              <h1 className="text-lg font-bold text-[#1B2A5B] dark:text-white">
                Dashboard
              </h1>

            </div>
          </div>

          {/* Center - Search bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search shipments, clients, invoices..."
                className="search-input w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-sm text-slate-700 dark:text-gray-200 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#F7941D] transition-colors"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500">
                <span className="px-1 py-0.5 rounded border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-700">⌘</span>
                <span className="px-1 py-0.5 rounded border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-700">K</span>
              </kbd>
            </div>
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick action buttons */}


            {/* Time */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-gray-800 text-sm text-slate-600 dark:text-gray-300">
              <Calendar size={14} className="text-slate-400 dark:text-gray-500" />
              <span>{currentTime}</span>
            </div>


            {/* Notifications */}
            <div className="relative">
              <button
                id="notifications-btn"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Bell size={18} className="text-slate-600 dark:text-gray-300" />
                {unreadNotifications > 0 && <><span className="notification-badge absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" /><span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 animate-ping opacity-75" /></>}
              </button>

              {/* Notifications dropdown */}
              {isNotificationsOpen && (
                <div
                  id="notifications-dropdown"
                  className="dropdown-animate absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-slate-200 dark:border-gray-700 overflow-hidden z-50"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-gray-700">
                    <h3 className="font-semibold text-slate-700 dark:text-white">Notifications</h3>
                    <button disabled={!unreadNotifications} onClick={readAllNotifications} className="text-xs text-[#F7941D] hover:underline disabled:opacity-40">Mark all read</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.slice(0, 5).map((notif) => {
                      const Icon = Bell;
                      return (
                        <button type="button" onClick={() => { setIsNotificationsOpen(false); onNavigate?.(notif.link || "/dashboard/notifications"); }} key={notif.id} className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors border-b border-slate-50 dark:border-gray-700/50 last:border-0 ${!notif.is_read ? "bg-orange-50/40" : ""}`}>
                          <div className="rounded-lg bg-slate-100 p-2 text-orange-500 dark:bg-gray-700">
                            <Icon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 dark:text-gray-200">{notif.title}</p>
                            <p className="truncate text-xs text-slate-400 dark:text-gray-500">{notif.message}</p>
                            <p className="text-[11px] text-slate-400">{notif.created_at ? new Date(notif.created_at).toLocaleString("en-IN") : ""}</p>
                          </div>
                        </button>
                      );
                    })}
                    {!notifications.length && <div className="px-4 py-8 text-center text-sm text-slate-400">No notifications</div>}
                  </div>
                  <div className="px-4 py-2 border-t border-slate-100 dark:border-gray-700 text-center">
                    <button onClick={() => onNavigate?.("/dashboard/notifications")} className="text-sm text-[#F7941D] hover:underline font-medium">View all notifications</button>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                id="user-menu-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-label={`Open profile menu for ${displayName}`}
                aria-expanded={isUserMenuOpen}
                title={displayName}
                className="profile-menu-button flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pl-2 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800"
              >
                {user?.avatarUrl && !avatarFailed ? (
                  <img
                    src={user.avatarUrl}
                    alt={displayName}
                    onError={() => setAvatarFailed(true)}
                    className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="profile-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm">
                    {initials === "?" ? <User size={16} /> : initials}
                  </div>
                )}
                <ChevronDown size={16} className={`profile-menu-chevron mr-0.5 shrink-0 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* User dropdown */}
              {isUserMenuOpen && (
                <div
                  id="user-menu-dropdown"
                  className="dropdown-animate absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-slate-200 dark:border-gray-700 overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-gray-700">
                    <p className="text-sm font-semibold text-slate-700 dark:text-white truncate">{displayName}</p>
                    <p className="text-xs text-slate-400 dark:text-gray-400 truncate">{displayEmail}</p>
                  </div>
                  <div className="py-1">
                    {userMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onNavigate?.(item.to);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <Icon size={16} className="text-slate-400 dark:text-gray-500" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-slate-100 dark:border-gray-700 py-1">
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-60"
                    >
                      <LogOut size={16} />
                      {loggingOut ? "Logging out..." : "Logout"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700 shadow-lg">
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-sm focus:outline-none focus:border-[#F7941D]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#F7941D] to-[#E8831A] text-white text-sm font-semibold">
                  <Plus size={16} />
                  New Shipment
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 text-sm font-semibold">
                  <Download size={16} />
                  Export
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
