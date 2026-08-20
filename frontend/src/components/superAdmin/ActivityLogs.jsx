import React,{ useCallback, useEffect, useState } from "react";
import { Activity, Building2, CalendarDays, Search, ShieldCheck, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { getActivityLogs } from "../../services/api.js/activityLogService.js";

const pretty = (value) => String(value || "").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const actionTone = (action) => {
  if (String(action).includes("CREATED")) return "bg-emerald-50 text-emerald-700";
  if (String(action).includes("PASSWORD")) return "bg-violet-50 text-violet-700";
  if (String(action).includes("SUBSCRIPTION")) return "bg-blue-50 text-blue-700";
  if (String(action).includes("STATUS")) return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-700";
};

export default function ActivityLogs() {
  const [data, setData] = useState({ rows: [], organizations: [], actions: [], summary: {} });
  const [filters, setFilters] = useState({ search: "", organization_id: "", action: "", from: "", to: "" });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getActivityLogs(filters);
      setData(response.data || { rows: [], organizations: [], actions: [], summary: {} });
    } catch (error) {
      toast.error(error.response?.data?.message || "Activity logs load nahi hue.");
    } finally {
      setLoading(false);
    }
  }, [filters]);
  useEffect(() => { load(); }, [load]);

  const summary = data.summary || {};
  const cards = [
    { label: "Total Events", value: summary.total || 0, icon: Activity, tone: "bg-orange-50 text-orange-600" },
    { label: "Today", value: summary.today || 0, icon: CalendarDays, tone: "bg-blue-50 text-blue-600" },
    { label: "Active Actors", value: summary.actors || 0, icon: UserRound, tone: "bg-violet-50 text-violet-600" },
    { label: "Organizations", value: summary.organizations || 0, icon: Building2, tone: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <div className="min-h-full space-y-6 bg-slate-50/60 p-4 sm:p-6 lg:p-8">
      <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-500">Security & Governance</p><h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">Activity Logs</h1><p className="mt-1 text-sm text-slate-500">Super Admin actions aur organization-level changes ka audit trail.</p></div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => { const Icon = card.icon; return <div key={card.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60"><div className="flex items-center justify-between"><div><div className="text-2xl font-bold text-slate-900">{card.value}</div><div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</div></div><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.tone}`}><Icon size={19} /></span></div></div>; })}</div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/60 lg:grid-cols-[1fr_220px_220px_160px_160px]">
        <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={filters.search} onChange={(event) => setFilters((previous) => ({ ...previous, search: event.target.value }))} placeholder="Search actor, organization or activity..." className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-50" /></div>
        <select value={filters.organization_id} onChange={(event) => setFilters((previous) => ({ ...previous, organization_id: event.target.value }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">All organizations</option>{data.organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name} ({organization.code})</option>)}</select>
        <select value={filters.action} onChange={(event) => setFilters((previous) => ({ ...previous, action: event.target.value }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">All actions</option>{data.actions.map((action) => <option key={action} value={action}>{pretty(action)}</option>)}</select>
        <input type="date" aria-label="From date" value={filters.from} onChange={(event) => setFilters((previous) => ({ ...previous, from: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
        <input type="date" aria-label="To date" value={filters.to} onChange={(event) => setFilters((previous) => ({ ...previous, to: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80"><tr>{["Time", "Action", "Description", "Organization", "Actor"].map((heading) => <th key={heading} className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan="5" className="px-5 py-16 text-center text-slate-500">Loading activity logs...</td></tr> : data.rows.length === 0 ? <tr><td colSpan="5" className="px-5 py-16"><div className="mx-auto flex max-w-md flex-col items-center text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500"><ShieldCheck size={25} /></span><h3 className="mt-4 font-semibold text-slate-800">No activity found</h3><p className="mt-1 text-sm text-slate-500">New Super Admin actions automatically yahan record honge.</p></div></td></tr> : data.rows.map((row) => (
                <tr key={row.id} className="text-slate-700 transition hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-5 py-4"><div className="font-medium text-slate-800">{new Date(row.created_at).toLocaleDateString("en-IN")}</div><div className="text-xs text-slate-500">{new Date(row.created_at).toLocaleTimeString("en-IN")}</div></td>
                  <td className="px-5 py-4"><span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${actionTone(row.action)}`}>{pretty(row.action)}</span></td>
                  <td className="min-w-72 px-5 py-4"><div className="font-medium text-slate-800">{row.description}</div><div className="mt-0.5 text-xs text-slate-500">{pretty(row.entity_type)} #{row.entity_id || "-"}</div></td>
                  <td className="whitespace-nowrap px-5 py-4"><div>{row.organization_name || "Platform"}</div><div className="text-xs text-slate-500">{row.organization_code || "Global"}</div></td>
                  <td className="whitespace-nowrap px-5 py-4"><div>{row.actor_name || "System"}</div><div className="text-xs text-slate-500">{row.actor_email || "Automated action"}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
