import React, { useMemo } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import CustomerSidebar from "./customerSidebar";

export default function CustomerDashboardLayout() {
  const navigate = useNavigate();
  const user = useMemo(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <CustomerSidebar />
      <div className="flex-1 min-h-screen">
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#F7941D] font-semibold">Customer Dashboard</p>
            <h1 className="text-lg font-semibold text-slate-900">Welcome, {user?.name || "Customer"}</h1>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Logout
          </button>
        </header>
        <main className="p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
