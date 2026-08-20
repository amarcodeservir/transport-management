import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Truck, UserCircle2, Lock, LogOut, ShieldCheck } from "lucide-react";

const items = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/customer-dashboard" },
  { icon: Truck, label: "Shipment Tracking", to: "/customer-dashboard/shipments" },
  { icon: UserCircle2, label: "Client / User", to: "/customer-dashboard/profile" },
  { icon: Lock, label: "Change Password", to: "/customer-dashboard/password" },
];

export default function CustomerSidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="w-full lg:w-80 bg-[#0F1A3A] text-white min-h-screen flex flex-col border-r border-white/10">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-[#F7941D] flex items-center justify-center shadow-lg shadow-orange-500/25">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-lg font-semibold leading-tight">Customer Portal</p>
            <p className="text-xs text-white/60">Role: customer</p>
          </div>
        </div>
        <div className="mt-5 rounded-2xl bg-white/5 p-4 border border-white/10">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Signed in as</p>
          <p className="mt-1 font-semibold">{user?.name || "Customer"}</p>
          <p className="text-sm text-white/60 truncate">{user?.email || ""}</p>
          <p className="mt-2 text-xs text-white/45">ID: {user?.customer_code || user?.id || "-"}</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/customer-dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors border ${isActive
                  ? "bg-[#F7941D] text-white border-[#F7941D] shadow-lg shadow-orange-500/20"
                  : "bg-white/0 text-white/80 border-white/10 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 bg-white/5 text-white/80 hover:bg-red-500/15 hover:text-red-200 transition-colors border border-white/10"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
