import React,{ useCallback, useEffect, useState } from "react";
import { Building2, CalendarDays, CreditCard, Edit3, Search, ShieldCheck, TriangleAlert, X } from "lucide-react";
import toast from "react-hot-toast";
import { getSubscriptions, updateSubscription } from "../../services/api.js/subscriptionService.js";

const statusTone = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  TRIAL: "bg-blue-50 text-blue-700",
  PAST_DUE: "bg-amber-50 text-amber-700",
  SUSPENDED: "bg-red-50 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-600",
  EXPIRED: "bg-rose-50 text-rose-700",
};
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
const pretty = (value) => String(value || "").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function SubscriptionManagement() {
  const [data, setData] = useState({ rows: [], summary: {} });
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getSubscriptions(filters);
      setData(response.data || { rows: [], summary: {} });
    } catch (error) {
      toast.error(error.response?.data?.message || "Subscriptions load nahi hui.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      plan: row.plan || "TRIAL",
      status: row.status || "TRIAL",
      billing_cycle: row.billing_cycle || "MONTHLY",
      start_date: row.start_date || "",
      end_date: row.end_date || "",
      price: Number(row.price || 0),
      max_admins: Number(row.max_admins || 0),
      max_users: Number(row.max_users || 0),
      max_vehicles: Number(row.max_vehicles || 0),
      max_shipments_per_month: Number(row.max_shipments_per_month || 0),
      notes: row.notes || "",
    });
  };

  const change = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateSubscription(editing.organization_id, form);
      toast.success("Organization subscription update ho gayi.");
      setEditing(null);
      setForm(null);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Subscription update nahi hui.");
    } finally {
      setSaving(false);
    }
  };

  const summary = data.summary || {};
  const cards = [
    { label: "Organizations", value: summary.total || 0, icon: Building2, tone: "bg-orange-50 text-orange-600" },
    { label: "Active / Trial", value: summary.active || 0, icon: ShieldCheck, tone: "bg-emerald-50 text-emerald-600" },
    { label: "Need Attention", value: summary.attention || 0, icon: TriangleAlert, tone: "bg-amber-50 text-amber-600" },
    { label: "Subscription Value", value: money(summary.monthly_value), icon: CreditCard, tone: "bg-blue-50 text-blue-600" },
  ];

  return (
    <div className="min-h-full space-y-6 bg-slate-50/60 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-500">Super Admin Control</p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">Billing & Subscriptions</h1>
        <p className="mt-1 text-sm text-slate-500">Organization plans, validity, usage limits aur access status manage karein.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => { const Icon = card.icon; return <div key={card.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60"><div className="flex items-center justify-between gap-3"><div><div className="text-2xl font-bold text-slate-900">{card.value}</div><div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</div></div><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.tone}`}><Icon size={19} /></span></div></div>; })}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/60 md:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={filters.search} onChange={(event) => setFilters((previous) => ({ ...previous, search: event.target.value }))} placeholder="Search organization, code or email..." className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-50" /></div>
        <select value={filters.status} onChange={(event) => setFilters((previous) => ({ ...previous, status: event.target.value }))} className="min-w-48 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-50"><option value="">All subscription statuses</option>{["TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED", "EXPIRED"].map((status) => <option key={status} value={status}>{pretty(status)}</option>)}</select>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80"><tr>{["Organization", "Plan", "Validity", "Limits", "Price", "Action"].map((heading) => <th key={heading} className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan="6" className="px-5 py-16 text-center text-slate-500">Loading subscriptions...</td></tr> : data.rows.length === 0 ? <tr><td colSpan="6" className="px-5 py-16 text-center text-slate-500">No organizations found</td></tr> : data.rows.map((row) => (
                <tr key={row.organization_id} className="text-slate-700 transition hover:bg-slate-50/70">
                  <td className="px-5 py-4"><div className="font-semibold text-slate-900">{row.organization_name}</div><div className="mt-0.5 text-xs text-slate-500">{row.organization_code} · {row.organization_email}</div></td>
                  <td className="px-5 py-4"><div className="font-semibold text-slate-800">{pretty(row.plan)}</div><span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[row.status] || "bg-slate-100 text-slate-600"}`}>{pretty(row.status)}</span></td>
                  <td className="whitespace-nowrap px-5 py-4"><div className="inline-flex items-center gap-1.5"><CalendarDays size={14} className="text-slate-400" />{row.start_date || "Not set"}</div><div className="mt-1 text-xs text-slate-500">to {row.end_date || "No expiry"} · {pretty(row.billing_cycle)}</div></td>
                  <td className="px-5 py-4 text-xs leading-5 text-slate-600">{row.max_admins} admins · {row.max_users} users<br />{row.max_vehicles} vehicles · {row.max_shipments_per_month} shipments/month</td>
                  <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">{money(row.price)}</td>
                  <td className="px-5 py-4"><button type="button" onClick={() => openEdit(row)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"><Edit3 size={14} /> Manage</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && form && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 py-8 backdrop-blur-[1px]">
          <form onSubmit={save} className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div><p className="text-xs font-bold uppercase tracking-wider text-orange-500">Manage Subscription</p><h2 className="mt-1 text-xl font-bold text-slate-900">{editing.organization_name}</h2><p className="text-xs text-slate-500">{editing.organization_code}</p></div><button type="button" disabled={saving} onClick={() => setEditing(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={19} /></button></div>
            <div className="grid max-h-[65vh] grid-cols-1 gap-4 overflow-y-auto p-6 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Plan<select name="plan" value={form.plan} onChange={change} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5">{["TRIAL", "STARTER", "GROWTH", "ENTERPRISE", "CUSTOM"].map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="text-sm font-medium text-slate-700">Status<select name="status" value={form.status} onChange={change} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5">{["TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED", "EXPIRED"].map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="text-sm font-medium text-slate-700">Billing cycle<select name="billing_cycle" value={form.billing_cycle} onChange={change} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5">{["MONTHLY", "YEARLY", "CUSTOM"].map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="text-sm font-medium text-slate-700">Price (INR)<input required min="0" step="0.01" type="number" name="price" value={form.price} onChange={change} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
              <label className="text-sm font-medium text-slate-700">Start date<input type="date" name="start_date" value={form.start_date} onChange={change} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
              <label className="text-sm font-medium text-slate-700">End date<input type="date" name="end_date" value={form.end_date} onChange={change} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
              {[['max_admins','Max admins'],['max_users','Max users'],['max_vehicles','Max vehicles'],['max_shipments_per_month','Shipments per month']].map(([name, label]) => <label key={name} className="text-sm font-medium text-slate-700">{label}<input required min="0" type="number" name={name} value={form[name]} onChange={change} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>)}
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">Internal notes<textarea name="notes" value={form.notes} onChange={change} rows="3" className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5" /></label>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4"><button type="button" disabled={saving} onClick={() => setEditing(null)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button><button disabled={saving} className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save Subscription"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
