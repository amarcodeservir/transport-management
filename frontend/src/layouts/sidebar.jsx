import { useEffect, useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  Truck,
  FileText,
  Users,
  Receipt,
  Settings,
  Package,
  MapPin,
  Wallet,
  CalendarClock,
  Lock,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileBarChart,
  PlusCircle,
  BarChart3,
  Building,
  UserCog,
  Globe,
  CreditCard,
  Activity,
  ClipboardCheck,
  Bell,
} from "lucide-react";
/* eslint-disable */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Logistics Mitra — Sidebar Navigation
 * Collapsible sidebar with navigation items, user profile, and logout.
 * Features: hover expand, active states, smooth animations.
 */

const adminSidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Package, label: "Shipments", href: "/dashboard/admin-shipments" },
  { icon: Truck, label: "Fleet", href: "/dashboard/fleet" },
  { icon: MapPin, label: "Tracking", href: "/dashboard/tracking" },
  { icon: FileText, label: "E-Way Bill", href: "#eway-bill" },
  { icon: Users, label: "Clients", href: "/dashboard/customers" },
  { icon: Receipt, label: "Billing", href: "#billing" },
  { icon: CalendarClock, label: "Pickup Schedule", href: "#pickup" },
  { icon: Wallet, label: "COD Collection", href: "#cod" },
  { icon: FileBarChart, label: "Reports", href: "#reports" },
  { icon: Lock, label: "Access Control", href: "#access" },
  { icon: Settings, label: "Settings", href: "#settings" },
];

const customerSidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: MapPin, label: "Transport Near Me", href: "/dashboard/transport-near-me" },
  { icon: Package, label: "Create Shipment", href: "/dashboard/shipments/add" },
  { icon: Truck, label: "Tracking", href: "/dashboard/tracking" },
];

const driverSidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: ClipboardCheck, label: "My Assignments", href: "/dashboard/operations/assignments" },
  { icon: MapPin, label: "My Live Deliveries", href: "/dashboard/operations/live-tracking" },
  { icon: ClipboardCheck, label: "POD / Delivery Closure", href: "/dashboard/pod" },
];

const superAdminSidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Building, label: "Organizations", href: "/dashboard/organizations" },
  { icon: UserCog, label: "Organization Admins", href: "/dashboard/organization-admins" },
  { icon: Globe, label: "Global Operations", href: "/dashboard/global-operations" },
  { icon: Truck, label: "Global Fleet", href: "/dashboard/global-fleet" },
  { icon: Users, label: "Customers", href: "/dashboard/customers" },
  { icon: CreditCard, label: "Billing & Subscriptions", href: "/dashboard/billing" },
  { icon: FileBarChart, label: "Reports", href: "/dashboard/reports" },
  { icon: Activity, label: "Activity Logs", href: "/dashboard/activity-logs" },
];

const orgAdminSidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Customers", href: "/dashboard/customers" },
  { icon: Truck, label: "Fleet Management", href: "#fleet" },
  { icon: Package, label: "Shipments", href: "#shipments" },
  { icon: Activity, label: "Operations", href: "#operations" },
  { icon: ClipboardCheck, label: "POD / Deliveries", href: "/dashboard/pod" },
  { icon: Receipt, label: "Billing", href: "#billing" },
  { icon: FileBarChart, label: "Reports", href: "/dashboard/reports" },
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

const normalizeRole = (role = "") => String(role).trim().toLowerCase().replace(/[-\s]+/g, "_");

const getSidebarItems = (role) => {
  const normRole = normalizeRole(role);
  if (normRole === 'customer') {
    return customerSidebarItems;
  }
  if (normRole === 'super_admin') {
    return superAdminSidebarItems;
  }
  if (normRole === 'organization_admin') {
    return orgAdminSidebarItems;
  }
  if (normRole === 'driver') {
    return driverSidebarItems;
  }
  return adminSidebarItems;
};

export default function Sidebar({ isCollapsed, setIsCollapsed, branding }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [shipmentMenuOpen, setShipmentMenuOpen] = useState(false);
  const [fleetMenuOpen, setFleetMenuOpen] = useState(false);
  const [operationsMenuOpen, setOperationsMenuOpen] = useState(false);
  const [billingMenuOpen, setBillingMenuOpen] = useState(false);

  const user = React.useMemo(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  }, []);
  const menuItems = getSidebarItems(user?.role);
  const normalizedRole = normalizeRole(user?.role);
  const isCustomer = normalizedRole === 'customer';
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'super_admin' || normalizedRole === 'organization_admin';
  const isOrgAdmin = normalizedRole === 'organization_admin';

  const isShipmentRoute = location.pathname.startsWith('/dashboard/organization/shipments') || location.pathname.startsWith('/dashboard/shipments') || location.pathname.startsWith('/dashboard/admin-shipments') || location.pathname.startsWith('/dashboard/create-shipment');
  const isFleetRoute = location.pathname.startsWith('/dashboard/fleet') || location.pathname.startsWith('/dashboard/vehicles') || location.pathname.startsWith('/dashboard/drivers');
  const isOperationsRoute = location.pathname.startsWith('/dashboard/operations/');
  const isBillingRoute = location.pathname.startsWith('/dashboard/billing/');
  const isDashboardRoute = location.pathname === '/dashboard';

  useEffect(() => {
    setShipmentMenuOpen(isShipmentRoute);
  }, [isShipmentRoute]);

  useEffect(() => {
    setFleetMenuOpen(isFleetRoute);
  }, [isFleetRoute]);

  useEffect(() => {
    setOperationsMenuOpen(isOperationsRoute);
  }, [isOperationsRoute]);

  useEffect(() => {
    setBillingMenuOpen(isBillingRoute);
  }, [isBillingRoute]);

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (window.innerWidth < 1024 && isMobileOpen) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.contains(e.target)) {
          setIsMobileOpen(false);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileOpen]);

  // Handle window resize for mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .sidebar-enter {
          animation: slide-in 0.3s ease-out forwards;
        }
        .sidebar-overlay {
          animation: fade-in 0.2s ease-out forwards;
        }
        .sidebar-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .sidebar-scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .sidebar-item {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sidebar-item:hover {
          background: linear-gradient(135deg, rgba(247, 148, 29, 0.08), rgba(27, 42, 91, 0.05));
          transform: translateX(4px);
        }
        .sidebar-item-active {
          background: linear-gradient(135deg, rgba(247, 148, 29, 0.12), rgba(27, 42, 91, 0.08));
          border-right: 3px solid #F7941D;
        }
        .sidebar-item-active .sidebar-icon {
          color: #F7941D;
        }
        .sidebar-item-active .sidebar-label {
          color: #eea648ff;
          font-weight: 600;
        }
        .status-dot {
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @media (max-width: 1023px) {
          .sidebar-mobile-overlay {
            position: fixed;
            inset: 0;
            background: rgba(228, 228, 228, 1);
            z-index: 40;
          }
        }
      `}</style>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="sidebar-overlay lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile toggle button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#1B2A5B] text-black shadow-lg hover:bg-[#1B2A5B]/90 transition-colors"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        id="sidebar"
        style={{ width: isCollapsed ? 72 : 260 }}
        className={`fixed top-0 left-0 z-40 h-screen flex flex-col overflow-hidden bg-white text-black shadow-2xl transition-all duration-300 ${isMobileOpen ? 'translate-x-0 sidebar-enter' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div
          style={{ height: 76 }}
          className={`flex items-center px-4 border-b border-black/10 ${isCollapsed ? "justify-center" : "justify-between"}`}
        >
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <img
                src={branding?.logo || "/logo.png"}
                alt={`${branding?.name || "Globalex Logistics"} logo`}
                onError={(event) => { event.currentTarget.src = "/logo.png"; }}
                className="h-14 w-auto max-w-[170px] object-contain object-left"
              />
            </div>
          ) : (
            <img
              src={branding?.logo || "/logo.png"}
              alt={`${branding?.name || "Globalex Logistics"} logo`}
              onError={(event) => { event.currentTarget.src = "/logo.png"; }}
              className="h-12 w-12 object-contain"
            />
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain py-4 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || (item.href !== "/dashboard" && location.pathname.startsWith(item.href));

              if ((isAdmin && item.label === 'Shipments') || (isOrgAdmin && item.label === 'Shipments')) {
                const shipmentSubItems = isOrgAdmin
                  ? [
                    { href: '/dashboard/organization/shipments/all', icon: FileText, label: 'All Shipments' },
                    { href: '/dashboard/organization/shipments/pending', icon: Clock, label: 'Pending' },
                    { href: '/dashboard/organization/shipments/unassigned', icon: AlertTriangle, label: 'Unassigned' },
                    { href: '/dashboard/organization/shipments/assigned', icon: CheckCircle2, label: 'Assigned' },
                    { href: '/dashboard/organization/shipments/in-transit', icon: Truck, label: 'In Transit' },
                    { href: '/dashboard/organization/shipments/out-for-delivery', icon: MapPin, label: 'Out for Delivery' },
                    { href: '/dashboard/organization/shipments/delivered', icon: Package, label: 'Delivered' },
                    { href: '/dashboard/organization/shipments/completed', icon: CheckCircle2, label: 'Completed' },
                  ]
                  : [
                    { href: '/dashboard/create-shipment', icon: PlusCircle, label: 'Create Shipment' },
                    { href: '/dashboard/admin-shipments', icon: FileText, label: 'All Shipments' },
                  ];

                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShipmentMenuOpen((open) => !open);
                      }}
                      className={`
                        sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left cursor-pointer
                        ${isCollapsed ? 'justify-center' : ''}
                        ${isShipmentRoute ? 'sidebar-item-active' : 'hover:bg-black/5'}
                        group relative
                      `}
                    >
                      <Icon
                        className={`sidebar-icon h-5 w-5 shrink-0 transition-colors ${isShipmentRoute ? 'text-[#F7941D]' : 'text-black/60 group-hover:text-black'}`}
                      />
                      {!isCollapsed && (
                        <span className={`sidebar-label text-sm transition-colors ${isShipmentRoute ? 'text-black' : 'text-black/70 group-hover:text-black'}`}>
                          Shipments
                        </span>
                      )}
                      {!isCollapsed && (
                        <span className="ml-auto text-sm text-slate-500">{shipmentMenuOpen ? '−' : '+'}</span>
                      )}
                    </button>
                    {!isCollapsed && shipmentMenuOpen && (
                      <div className="ml-8 mt-2 space-y-1">
                        {shipmentSubItems.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = location.pathname === subItem.href;
                          return (
                            <button
                              key={subItem.href}
                              type="button"
                              onClick={() => {
                                navigate(subItem.href);
                                if (window.innerWidth < 1024) setIsMobileOpen(false);
                              }}
                              className={`flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm transition-colors ${isSubActive ? 'bg-slate-100 text-slate-900 font-medium border-l-2 border-[#F7941D]' : 'text-slate-700 hover:bg-slate-100'}`}
                            >
                              <SubIcon className={`h-4 w-4 ${isSubActive ? 'text-[#F7941D]' : 'text-slate-500'}`} />
                              <span>{subItem.label}</span>
                              {isSubActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#F7941D]" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              }

              if ((isAdmin && item.label === 'Fleet') || (isOrgAdmin && item.label === 'Fleet Management')) {
                const fleetSubItems = isOrgAdmin
                  ? [
                    { href: '/dashboard/fleet/vehicles', icon: Truck, label: 'Vehicles' },
                    { href: '/dashboard/fleet/drivers', icon: Users, label: 'Drivers' },
                    { href: '/dashboard/fleet/maintenance', icon: Settings, label: 'Maintenance' },
                  ]
                  : [
                    { href: '/dashboard/fleet/vehicles', icon: PlusCircle, label: 'Vehicles' },
                    { href: '/dashboard/fleet/drivers', icon: Users, label: 'Drivers' },
                    { href: '/dashboard/fleet/trips', icon: Package, label: 'Trips' },
                    { href: '/dashboard/fleet/fuel', icon: Wallet, label: 'Fuel' },
                    { href: '/dashboard/fleet/maintenance', icon: CalendarClock, label: 'Maintenance' },
                    { href: '/dashboard/fleet/documents', icon: FileText, label: 'Documents' },
                  ];
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setFleetMenuOpen((open) => !open);
                      }}
                      className={`
                        sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left cursor-pointer
                        ${isCollapsed ? 'justify-center' : ''}
                        ${isFleetRoute ? 'sidebar-item-active' : 'hover:bg-black/5'}
                        group relative
                      `}
                    >
                      <Icon
                        className={`sidebar-icon h-5 w-5 shrink-0 transition-colors ${isFleetRoute ? 'text-[#F7941D]' : 'text-black/60 group-hover:text-black'}`}
                      />
                      {!isCollapsed && (
                        <span className={`sidebar-label text-sm transition-colors ${isFleetRoute ? 'text-black' : 'text-black/70 group-hover:text-black'}`}>
                          {item.label}
                        </span>
                      )}
                      {!isCollapsed && (
                        <span className="ml-auto text-sm text-slate-500">{fleetMenuOpen ? '−' : '+'}</span>
                      )}
                    </button>
                    {!isCollapsed && fleetMenuOpen && (
                      <div className="ml-8 mt-2 space-y-1">
                        {fleetSubItems.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = location.pathname === subItem.href;
                          return (
                            <button
                              key={subItem.href}
                              type="button"
                              onClick={() => {
                                navigate(subItem.href);
                                if (window.innerWidth < 1024) setIsMobileOpen(false);
                              }}
                              className={`flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm transition-colors ${isSubActive ? 'bg-slate-100 text-slate-900 font-medium border-l-2 border-[#F7941D]' : 'text-slate-700 hover:bg-slate-100'}`}
                            >
                              <SubIcon className={`h-4 w-4 ${isSubActive ? 'text-[#F7941D]' : 'text-slate-500'}`} />
                              <span>{subItem.label}</span>
                              {isSubActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#F7941D]" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              }

              if (isOrgAdmin && item.label === 'Operations') {
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setOperationsMenuOpen((open) => !open);
                      }}
                      className={`
                        sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left cursor-pointer
                        ${isCollapsed ? 'justify-center' : ''}
                        ${isOperationsRoute ? 'sidebar-item-active' : 'hover:bg-black/5'}
                        group relative
                      `}
                    >
                      <Icon
                        className={`sidebar-icon h-5 w-5 shrink-0 transition-colors ${isOperationsRoute ? 'text-[#F7941D]' : 'text-black/60 group-hover:text-black'}`}
                      />
                      {!isCollapsed && (
                        <span className={`sidebar-label text-sm transition-colors ${isOperationsRoute ? 'text-black' : 'text-black/70 group-hover:text-black'}`}>
                          Operations
                        </span>
                      )}
                      {!isCollapsed && (
                        <span className="ml-auto text-sm text-slate-500">{operationsMenuOpen ? '−' : '+'}</span>
                      )}
                    </button>
                    {!isCollapsed && operationsMenuOpen && (
                      <div className="ml-8 mt-2 space-y-1">
                        {[
                          { href: '/dashboard/operations/assignments', icon: PlusCircle, label: 'Assignments' },
                          { href: '/dashboard/operations/active-trips', icon: Truck, label: 'Active Trips' },
                          { href: '/dashboard/operations/live-tracking', icon: MapPin, label: 'Live Tracking' },
                        ].map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = location.pathname === subItem.href;
                          return (
                            <button
                              key={subItem.href}
                              type="button"
                              onClick={() => {
                                navigate(subItem.href);
                                if (window.innerWidth < 1024) setIsMobileOpen(false);
                              }}
                              className={`flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm transition-colors ${isSubActive ? 'bg-slate-100 text-slate-900 font-medium border-l-2 border-[#F7941D]' : 'text-slate-700 hover:bg-slate-100'}`}
                            >
                              <SubIcon className={`h-4 w-4 ${isSubActive ? 'text-[#F7941D]' : 'text-slate-500'}`} />
                              <span>{subItem.label}</span>
                              {isSubActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#F7941D]" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              }

              if (isOrgAdmin && item.label === 'Billing') {
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setBillingMenuOpen((open) => !open);
                      }}
                      className={`
                        sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left cursor-pointer
                        ${isCollapsed ? 'justify-center' : ''}
                        ${isBillingRoute ? 'sidebar-item-active' : 'hover:bg-black/5'}
                        group relative
                      `}
                    >
                      <Icon
                        className={`sidebar-icon h-5 w-5 shrink-0 transition-colors ${isBillingRoute ? 'text-[#F7941D]' : 'text-black/60 group-hover:text-black'}`}
                      />
                      {!isCollapsed && (
                        <span className={`sidebar-label text-sm transition-colors ${isBillingRoute ? 'text-black' : 'text-black/70 group-hover:text-black'}`}>
                          Billing
                        </span>
                      )}
                      {!isCollapsed && (
                        <span className="ml-auto text-sm text-slate-500">{billingMenuOpen ? '−' : '+'}</span>
                      )}
                    </button>
                    {!isCollapsed && billingMenuOpen && (
                      <div className="ml-8 mt-2 space-y-1">
                        {[
                          { href: '/dashboard/billing/invoices', icon: Receipt, label: 'Invoices' },
                          { href: '/dashboard/billing/payments', icon: CreditCard, label: 'Payments' },
                        ].map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = location.pathname === subItem.href;
                          return (
                            <button
                              key={subItem.href}
                              type="button"
                              onClick={() => {
                                navigate(subItem.href);
                                if (window.innerWidth < 1024) setIsMobileOpen(false);
                              }}
                              className={`flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm transition-colors ${isSubActive ? 'bg-slate-100 text-slate-900 font-medium border-l-2 border-[#F7941D]' : 'text-slate-700 hover:bg-slate-100'}`}
                            >
                              <SubIcon className={`h-4 w-4 ${isSubActive ? 'text-[#F7941D]' : 'text-slate-500'}`} />
                              <span>{subItem.label}</span>
                              {isSubActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#F7941D]" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              }

              if (user?.role === 'customer' && item.label === 'Shipments') {
                return (
                  <React.Fragment key={item.label}>
                    <li key="shipments-toggle">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShipmentMenuOpen((open) => !open);
                          if (window.innerWidth < 1024) setIsMobileOpen(false);
                        }}
                        className={`
                          sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left cursor-pointer
                          ${isCollapsed ? 'justify-center' : ''}
                          ${isShipmentRoute ? 'sidebar-item-active' : 'hover:bg-black/5'}
                          group relative
                        `}
                      >
                        <Package
                          className={`sidebar-icon h-5 w-5 shrink-0 transition-colors ${isShipmentRoute ? 'text-[#F7941D]' : 'text-black/60 group-hover:text-black'}`}
                        />
                        {!isCollapsed && (
                          <span className={`sidebar-label text-sm transition-colors ${isShipmentRoute ? 'text-black' : 'text-black/70 group-hover:text-black'}`}>
                            Shipments
                          </span>
                        )}
                        {!isCollapsed && (
                          <span className="ml-auto text-sm text-slate-500">{shipmentMenuOpen ? '−' : '+'}</span>
                        )}
                      </button>
                      {!isCollapsed && shipmentMenuOpen && (
                        <div className="ml-8 mt-2 space-y-1">
                          {[
                            { href: '/dashboard/shipments/add', icon: PlusCircle, label: 'Add Shipment' },
                            { href: '/dashboard/shipments/all', icon: FileText, label: 'All Shipments' },
                            { href: '/dashboard/shipments/report', icon: BarChart3, label: 'Shipment Reports' },
                          ].map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = location.pathname === subItem.href;

                            return (
                              <button
                                key={subItem.href}
                                type="button"
                                onClick={() => {
                                  navigate(subItem.href);
                                  if (window.innerWidth < 1024) setIsMobileOpen(false);
                                }}
                                className={`flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm transition-colors ${isSubActive ? 'bg-slate-100 text-slate-900 font-medium border-l-2 border-[#F7941D]' : 'text-slate-700 hover:bg-slate-100'}`}
                              >
                                <SubIcon className={`h-4 w-4 ${isSubActive ? 'text-[#F7941D]' : 'text-slate-500'}`} />
                                <span>{subItem.label}</span>
                                {isSubActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#F7941D]" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </li>
                    <li key={item.label}>
                      <a
                        href={item.href}
                        onClick={(e) => {
                          e.preventDefault();
                          if (item.href.startsWith('/')) {
                            navigate(item.href);
                          }
                          if (window.innerWidth < 1024) setIsMobileOpen(false);
                        }}
                        className={`
                          sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
                          ${isCollapsed ? 'justify-center' : ''}
                          ${isActive ? 'sidebar-item-active' : 'hover:bg-black/5'}
                          group relative
                        `}
                      >
                        <Icon
                          className={`sidebar-icon h-5 w-5 shrink-0 transition-colors ${isActive ? 'text-[#F7941D]' : 'text-black/60 group-hover:text-black'}`}
                        />
                        {!isCollapsed && (
                          <span className={`sidebar-label text-sm transition-colors ${isActive ? 'text-black' : 'text-black/70 group-hover:text-black'}`}>
                            {item.label}
                          </span>
                        )}
                        {isCollapsed && (
                          <div className="absolute left-full ml-2 px-2 py-1 bg-[#0F1A3A] text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                            {item.label}
                          </div>
                        )}
                        {isActive && !isCollapsed && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#F7941D]" />
                        )}
                      </a>
                    </li>
                  </React.Fragment>
                );
              }

              return (
                <li key={item.label}>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      if (item.href.startsWith('/')) {
                        navigate(item.href);
                      }
                      if (window.innerWidth < 1024) setIsMobileOpen(false);
                    }}
                    className={`
                      sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
                      ${isCollapsed ? 'justify-center' : ''}
                      ${isActive ? 'sidebar-item-active' : 'hover:bg-black/5'}
                      group relative
                    `}
                  >
                    <Icon
                      className={`sidebar-icon h-5 w-5 shrink-0 transition-colors ${isActive ? 'text-[#F7941D]' : 'text-black/60 group-hover:text-black'}`}
                    />
                    {!isCollapsed && (
                      <span className={`sidebar-label text-sm transition-colors ${isActive ? 'text-black' : 'text-black/70 group-hover:text-black'}`}>
                        {item.label}
                      </span>
                    )}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-[#0F1A3A] text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                        {item.label}
                      </div>
                    )}
                    {isActive && !isCollapsed && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#F7941D]" />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

      </aside>

      {/* Main content padding for desktop */}
      <div className={`dashboard-sidebar-spacer transition-all duration-300 hidden lg:block`} style={{ marginLeft: isCollapsed ? 72 : 260 }} />
    </>
  );
}
