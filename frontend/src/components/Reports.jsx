import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Loader2,
  MapPin,
  Package,
  Printer,
  RefreshCw,
  Scale,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import React from "react"
import toast from "react-hot-toast";
import { getReportSummary } from "../services/api.js/reportService";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const money = (value) => currency.format(Number(value || 0));
const pretty = (status) => String(status || "")
  .replaceAll("_", " ")
  .toLowerCase()
  .replace(/\b\w/g, (letter) => letter.toUpperCase());
const dateLabel = (value) => value
  ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  : "-";

const statusVisuals = {
  PENDING: { bar: "from-amber-400 to-orange-400", badge: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  UNASSIGNED: { bar: "from-slate-400 to-slate-500", badge: "bg-slate-100 text-slate-700", dot: "bg-slate-500" },
  ASSIGNED: { bar: "from-blue-400 to-indigo-500", badge: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  IN_TRANSIT: { bar: "from-cyan-400 to-blue-500", badge: "bg-cyan-50 text-cyan-700", dot: "bg-cyan-500" },
  OUT_FOR_DELIVERY: { bar: "from-violet-400 to-purple-500", badge: "bg-violet-50 text-violet-700", dot: "bg-violet-500" },
  DELIVERED: { bar: "from-teal-400 to-emerald-500", badge: "bg-teal-50 text-teal-700", dot: "bg-teal-500" },
  POD_UPLOADED: { bar: "from-emerald-400 to-green-500", badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  COMPLETED: { bar: "from-green-500 to-emerald-600", badge: "bg-green-50 text-green-700", dot: "bg-green-500" },
  CANCELLED: { bar: "from-red-400 to-rose-500", badge: "bg-red-50 text-red-700", dot: "bg-red-500" },
};

const defaultStatusVisual = { bar: "from-orange-400 to-orange-500", badge: "bg-orange-50 text-orange-700", dot: "bg-orange-500" };

export default function Reports() {
  const reportTitleId = React.useId();
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  const initialRange = { from: firstDay, to: today };
  const [range, setRange] = useState(initialRange);
  const [draftRange, setDraftRange] = useState(initialRange);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getReportSummary(range);
      setData(result.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Report load nahi hui");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const applyRange = () => {
    if (!draftRange.from || !draftRange.to) return toast.error("Report ki from aur to date select karein.");
    if (draftRange.from > draftRange.to) return toast.error("From date, to date se pehle honi chahiye.");
    setRange({ ...draftRange });
  };

  const kpis = data?.kpis || {};
  const statuses = data?.statuses || [];
  const routes = data?.routes || [];
  const totalShipments = Number(kpis.total_shipments || 0);
  const deliveredShipments = Number(kpis.delivered_shipments || 0);
  const invoicedAmount = Number(kpis.invoiced_amount || 0);
  const collectedAmount = Number(kpis.collected_amount || 0);
  const outstandingAmount = Math.max(0, invoicedAmount - collectedAmount);
  const deliveryRate = totalShipments ? Math.round((deliveredShipments / totalShipments) * 100) : 0;
  const collectionRate = invoicedAmount ? Math.min(100, Math.round((collectedAmount / invoicedAmount) * 100)) : 0;
  const statusTotal = statuses.reduce((sum, item) => sum + Number(item.count || 0), 0);

  const cards = [
    { label: "Total Shipments", value: totalShipments, helper: "All bookings in period", icon: Package, tone: "bg-blue-50 text-blue-700", accent: "from-blue-500 to-indigo-500" },
    { label: "Delivered", value: deliveredShipments, helper: `${deliveryRate}% delivery rate`, icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700", accent: "from-emerald-400 to-teal-500" },
    { label: "In Transit", value: Number(kpis.in_transit_shipments || 0), helper: "Currently moving", icon: Truck, tone: "bg-cyan-50 text-cyan-700", accent: "from-cyan-400 to-blue-500" },
    { label: "Total Weight", value: `${Number(kpis.total_weight || 0).toLocaleString("en-IN")} kg`, helper: "Shipment load handled", icon: Scale, tone: "bg-violet-50 text-violet-700", accent: "from-violet-500 to-purple-500" },
    { label: "Invoiced", value: money(invoicedAmount), helper: `${Number(kpis.invoice_count || 0)} generated invoices`, icon: FileText, tone: "bg-orange-50 text-orange-700", accent: "from-orange-400 to-amber-500" },
    { label: "Collected", value: money(collectedAmount), helper: `${collectionRate}% collection rate`, icon: Wallet, tone: "bg-green-50 text-green-700", accent: "from-green-400 to-emerald-500" },
    { label: "Outstanding", value: money(outstandingAmount), helper: "Receivable balance", icon: CircleDollarSign, tone: "bg-rose-50 text-rose-700", accent: "from-rose-400 to-red-500" },
    { label: "Active", value: Number(kpis.active_shipments || 0), helper: "Pending or assigned", icon: Activity, tone: "bg-amber-50 text-amber-700", accent: "from-amber-400 to-orange-500" },
  ];

  return (
    <div className="report-page min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8" aria-labelledby={reportTitleId}>
      <div className="mx-auto max-w-[1500px] space-y-6">
        <section className="report-hero flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-500"><BarChart3 size={14} /> Performance Analytics</p>
            <h1 id={reportTitleId} className="text-3xl font-bold tracking-tight text-slate-900">Business Reports</h1>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">Shipment operations, delivery performance aur billing collections ko ek consolidated view me analyze karein.</p>
            <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-500"><CalendarDays size={16} className="text-orange-500" /> {dateLabel(range.from)} <ArrowRight size={14} className="text-slate-400" /> {dateLabel(range.to)}</div>
          </div>
          <div className="print:hidden flex flex-wrap gap-2"><button type="button" disabled={loading} onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh</button><button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"><Printer size={16} /> Print Report</button></div>
        </section>

        <section className="print:hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><h2 className="font-bold text-slate-900">Report Period</h2><p className="mt-1 text-xs text-slate-500">Custom date range select karke report regenerate karein.</p></div><div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:max-w-2xl xl:grid-cols-[1fr_1fr_auto]"><label><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">From date</span><input type="date" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100" value={draftRange.from} onChange={(event) => setDraftRange((previous) => ({ ...previous, from: event.target.value }))} /></label><label><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">To date</span><input type="date" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100" value={draftRange.to} onChange={(event) => setDraftRange((previous) => ({ ...previous, to: event.target.value }))} /></label><button type="button" disabled={loading} onClick={applyRange} className="inline-flex items-center justify-center gap-2 self-end rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:opacity-50">{loading ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />} Apply Range</button></div></div>
        </section>

        {loading && !data ? (
          <div className="space-y-6"><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white p-5" key={index}><div className="h-3 w-24 rounded bg-slate-100" /><div className="mt-5 h-7 w-32 rounded bg-slate-100" /><div className="mt-3 h-3 w-28 rounded bg-slate-100" /></div>)}</div><div className="grid gap-6 lg:grid-cols-2"><div className="h-80 animate-pulse rounded-2xl bg-white" /><div className="h-80 animate-pulse rounded-2xl bg-white" /></div></div>
        ) : (
          <>
            <section className="report-kpi-grid grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((card) => { const Icon = card.icon; return <article key={card.label} className="report-kpi-card group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/70"><div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.accent}`} /><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{card.label}</p><p className="mt-2 truncate text-2xl font-bold text-slate-900">{card.value}</p><p className="mt-1 text-xs text-slate-500">{card.helper}</p></div><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.tone}`}><Icon size={21} /></span></div></article>; })}
            </section>

            <section className="report-analytics-grid grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <article className="report-panel overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-900">Shipment Status</h2><p className="mt-0.5 text-xs text-slate-500">Current status distribution in selected period</p></div><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{statusTotal} shipments</span></div>
                <div className="space-y-5 p-5 sm:p-6">
                  {statuses.length ? statuses.map((item) => {
                    const count = Number(item.count || 0);
                    const percentage = statusTotal ? Math.round((count / statusTotal) * 100) : 0;
                    const visual = statusVisuals[item.status] || defaultStatusVisual;
                    return <div key={item.status}><div className="mb-2 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${visual.dot}`} /><span className="text-sm font-semibold text-slate-700">{pretty(item.status)}</span></div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${visual.badge}`}>{percentage}%</span><span className="w-6 text-right text-sm font-bold text-slate-900">{count}</span></div></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full bg-gradient-to-r ${visual.bar} transition-all duration-500`} style={{ width: `${Math.max(percentage, 3)}%` }} /></div></div>;
                  }) : <div className="flex min-h-56 flex-col items-center justify-center text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><BarChart3 size={24} /></span><h3 className="mt-4 font-bold text-slate-800">No shipment activity</h3><p className="mt-1 text-sm text-slate-500">Selected period me shipment data available nahi hai.</p></div>}
                </div>
              </article>

              <article className="report-panel overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-900">Top Routes</h2><p className="mt-0.5 text-xs text-slate-500">Most used lanes and their delivery performance</p></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><MapPin size={19} /></span></div>
                <div className="overflow-x-auto">
                  {routes.length ? <table className="report-routes-table min-w-[640px] w-full text-sm"><thead className="bg-slate-50/90"><tr>{["Route", "Shipments", "Delivered", "Delivery Rate"].map((heading) => <th className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 ${heading === "Route" ? "text-left" : "text-right"}`} key={heading}>{heading}</th>)}</tr></thead><tbody>{routes.map((route, index) => { const shipmentCount = Number(route.shipments || 0); const deliveredCount = Number(route.delivered || 0); const rate = shipmentCount ? Math.round((deliveredCount / shipmentCount) * 100) : 0; return <tr className="border-t border-slate-100 transition hover:bg-orange-50/30" key={`${route.origin}-${route.destination}`}><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-500">{index + 1}</span><div className="flex items-center gap-2 font-semibold text-slate-800"><span className="max-w-28 truncate">{route.origin}</span><ArrowRight size={14} className="shrink-0 text-orange-500" /><span className="max-w-28 truncate">{route.destination}</span></div></div></td><td className="px-5 py-4 text-right font-bold text-slate-800">{shipmentCount}</td><td className="px-5 py-4 text-right font-bold text-emerald-600">{deliveredCount}</td><td className="px-5 py-4"><div className="ml-auto w-28"><div className="mb-1 flex justify-end text-xs font-bold text-slate-600">{rate}%</div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${rate}%` }} /></div></div></td></tr>; })}</tbody></table> : <div className="flex min-h-72 flex-col items-center justify-center p-6 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><MapPin size={24} /></span><h3 className="mt-4 font-bold text-slate-800">No route performance data</h3><p className="mt-1 text-sm text-slate-500">Selected period me route activity available nahi hai.</p></div>}
                </div>
              </article>
            </section>
          </>
        )}
      </div>
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          html, body, #root { height: auto !important; min-height: 0 !important; overflow: visible !important; background: white !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          #sidebar, .dashboard-sidebar-spacer, .dashboard-header { display: none !important; }
          .dashboard-layout, .dashboard-shell, .dashboard-main { display: block !important; position: static !important; width: 100% !important; height: auto !important; min-height: 0 !important; overflow: visible !important; background: white !important; }
          .report-page { width: 100% !important; min-height: 0 !important; padding: 0 !important; background: white !important; }
          .report-page > div { max-width: none !important; }
          .report-page > div > * + * { margin-top: 4mm !important; }
          .report-hero { padding: 0 !important; border: 0 !important; border-radius: 0 !important; background: white !important; color: #0f172a !important; box-shadow: none !important; }
          .report-hero h1 { font-size: 22pt !important; line-height: 1.1 !important; color: #0f172a !important; }
          .report-hero p, .report-hero div { color: #475569 !important; }
          .report-kpi-grid { display: grid !important; grid-template-columns: repeat(4, minmax(0, 1fr)) !important; gap: 3mm !important; }
          .report-kpi-card { min-height: 27mm !important; padding: 4mm !important; border-radius: 3mm !important; break-inside: avoid !important; box-shadow: none !important; }
          .report-kpi-card p { white-space: normal !important; overflow: visible !important; text-overflow: clip !important; }
          .report-kpi-card svg { width: 16px !important; height: 16px !important; }
          .report-analytics-grid { display: grid !important; grid-template-columns: 0.9fr 1.1fr !important; gap: 4mm !important; align-items: start !important; }
          .report-panel { border-radius: 3mm !important; break-inside: avoid-page !important; box-shadow: none !important; }
          .report-panel > div { padding: 3mm 4mm !important; }
          .report-routes-table { min-width: 0 !important; width: 100% !important; }
          .report-routes-table th, .report-routes-table td { padding: 2.5mm 3mm !important; }
          article, section, table, tr { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
