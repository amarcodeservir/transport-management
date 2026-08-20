import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import React from "react";
import {
  BadgeCheck,
  Ban,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  FileText,
  Loader2,
  Plus,
  Printer,
  Search,
  Send,
  Truck,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { createInvoice, getInvoiceTemplate, getInvoiceShipments, getInvoices, updateInvoiceStatus } from "../services/api.js/invoiceService";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const money = (value) => currency.format(Number(value || 0));
const formatDate = (value) => value
  ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  : "-";

const chargeFields = [
  ["freight_charge", "Freight charge"],
  ["loading_charge", "Loading charge"],
  ["unloading_charge", "Unloading charge"],
  ["fuel_surcharge", "Fuel surcharge"],
  ["insurance_charge", "Insurance charge"],
  ["other_charge", "Other charge"],
  ["maintenance_charge", "Vehicle maintenance"],
];

const statusStyles = {
  DRAFT: "border-slate-200 bg-slate-50 text-slate-700",
  ISSUED: "border-blue-200 bg-blue-50 text-blue-700",
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-700",
};

const emptyForm = { shipment_id: "", due_date: "", tax_amount: "", discount_amount: "", notes: "" };

export default function Invoices() {
  const invoicesTitleId = React.useId();
  const [invoices, setInvoices] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [printingId, setPrintingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [invoiceResult, shipmentResult] = await Promise.allSettled([getInvoices(), getInvoiceShipments()]);
      if (invoiceResult.status === "fulfilled") setInvoices(invoiceResult.value.data || []);
      setShipments(shipmentResult.status === "fulfilled" ? (shipmentResult.value.data || []) : []);

      if (invoiceResult.status === "rejected" && shipmentResult.status === "rejected") {
        toast.error("Invoice data load nahi hua");
      } else if (shipmentResult.status === "rejected") {
        toast.error(shipmentResult.reason?.response?.data?.message || "Eligible shipments load nahi hui");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invoice data load nahi hua");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event) => { if (event.key === "Escape") setOpen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const chooseShipment = (id) => {
    const shipment = shipments.find((item) => String(item.shipment_id) === String(id));
    setSelected(shipment || null);
    setForm((previous) => ({
      ...previous,
      shipment_id: id,
      tax_amount: shipment?.tax_amount || "",
      discount_amount: shipment?.discount_amount || "",
    }));
  };

  const subtotal = selected
    ? chargeFields.reduce((sum, [key]) => sum + Number(selected[key] || 0), 0)
    : 0;
  const total = Math.max(0, subtotal + Number(form.tax_amount || 0) - Number(form.discount_amount || 0));

  const filtered = useMemo(() => invoices.filter((invoice) => {
    const searchText = `${invoice.invoice_number} ${invoice.shipment_number || ""} ${invoice.tracking_number || ""} ${invoice.origin || ""} ${invoice.destination || ""}`.toLowerCase();
    return searchText.includes(query.trim().toLowerCase()) && (status === "ALL" || invoice.status === status);
  }), [invoices, query, status]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createInvoice(form);
      toast.success("Invoice generate ho gaya");
      setOpen(false);
      setSelected(null);
      setForm(emptyForm);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Invoice generate nahi hua");
    } finally {
      setSaving(false);
    }
  };

  const print = async (id) => {
    setPrintingId(id);
    try {
      const html = await getInvoiceTemplate(id);
      const popup = window.open("", "_blank", "width=900,height=1000");
      if (!popup) return toast.error("Popup blocked. Browser popup allow karein.");
      popup.document.open();
      popup.document.write(html);
      popup.document.close();
      popup.onload = () => popup.print();
    } catch (error) {
      toast.error(error.response?.data?.message || "Invoice PDF template load nahi hua");
    } finally {
      setPrintingId(null);
    }
  };

  const changeStatus = async (id, value) => {
    setUpdatingId(id);
    try {
      await updateInvoiceStatus(id, value);
      toast.success("Invoice status update ho gaya");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Status update nahi hua");
    } finally {
      setUpdatingId(null);
    }
  };

  const totalAmount = invoices.reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0);
  const paidAmount = invoices.filter((invoice) => invoice.status === "PAID").reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0);
  const stats = [
    { label: "Total Invoices", value: invoices.length, helper: "All generated bills", icon: FileText, tone: "bg-blue-50 text-blue-700", accent: "from-blue-500 to-indigo-500" },
    { label: "Issued", value: invoices.filter((invoice) => invoice.status === "ISSUED").length, helper: "Awaiting collection", icon: Send, tone: "bg-amber-50 text-amber-700", accent: "from-amber-400 to-orange-500" },
    { label: "Paid", value: invoices.filter((invoice) => invoice.status === "PAID").length, helper: `${money(paidAmount)} collected`, icon: BadgeCheck, tone: "bg-emerald-50 text-emerald-700", accent: "from-emerald-400 to-teal-500" },
    { label: "Total Amount", value: money(totalAmount), helper: "Gross invoice value", icon: CircleDollarSign, tone: "bg-violet-50 text-violet-700", accent: "from-violet-500 to-fuchsia-500" },
  ];

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8" aria-labelledby={invoicesTitleId}>
      <div className="mx-auto max-w-[1500px] space-y-6">
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-500"><CircleDollarSign size={14} /> Billing & Collections</p>
            <h1 id={invoicesTitleId} className="text-3xl font-bold tracking-tight text-slate-900">Invoices</h1>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">Completed shipments ke charges se accurate invoice banayein, status manage karein aur printable copy nikalein.</p>
          </div>
          <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-100"><Plus size={18} /> Create Invoice</button>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article key={stat.label} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/70">
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.accent}`} />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{stat.label}</p>
                    <p className="mt-2 truncate text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{stat.helper}</p>
                  </div>
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.tone}`}><Icon size={21} /></span>
                </div>
              </article>
            );
          })}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="relative flex-1">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" placeholder="Search invoice number, shipment, tracking or route..." value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
            <div className="relative min-w-48">
              <select className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="ALL">All invoice statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="ISSUED">Issued</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <ChevronDown size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between px-1 text-xs text-slate-500">
            <span>{filtered.length} of {invoices.length} invoices</span>
            {(query || status !== "ALL") && <button type="button" onClick={() => { setQuery(""); setStatus("ALL"); }} className="font-semibold text-orange-600 hover:text-orange-700">Clear filters</button>}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div><h2 className="font-bold text-slate-900">Invoice Register</h2><p className="mt-0.5 text-xs text-slate-500">Generated invoices and their payment status</p></div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{invoices.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full text-sm">
              <thead className="bg-slate-50/90">
                <tr>{["Invoice", "Shipment / Route", "Invoice Date", "Subtotal", "Tax", "Discount", "Total", "Status", "Actions"].map((heading) => <th className="whitespace-nowrap px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500" key={heading}>{heading}</th>)}</tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 3 }).map((_, index) => (
                  <tr className="border-t border-slate-100" key={index}>{Array.from({ length: 9 }).map((__, cell) => <td className="px-5 py-5" key={cell}><span className="block h-3 animate-pulse rounded-full bg-slate-100" /></td>)}</tr>
                )) : filtered.length === 0 ? (
                  <tr><td colSpan="9" className="px-6 py-16"><div className="mx-auto flex max-w-md flex-col items-center text-center"><span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500"><FileText size={28} /></span><h3 className="mt-4 text-lg font-bold text-slate-900">{invoices.length ? "Matching invoice nahi mili" : "Abhi koi invoice nahi hai"}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{invoices.length ? "Search ya status filter change karke dobara dekhein." : "Completed shipment select karke pehla invoice generate karein."}</p><button type="button" onClick={invoices.length ? () => { setQuery(""); setStatus("ALL"); } : openCreate} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16} /> {invoices.length ? "Clear Filters" : "Create Invoice"}</button></div></td></tr>
                ) : filtered.map((invoice) => (
                  <tr className="border-t border-slate-100 transition hover:bg-orange-50/30" key={invoice.id}>
                    <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><FileText size={18} /></span><div><p className="font-bold text-slate-900">{invoice.invoice_number}</p><p className="mt-0.5 text-xs text-slate-400">Tax invoice</p></div></div></td>
                    <td className="px-5 py-4"><p className="font-semibold text-slate-800">Shipment #{invoice.shipment_number || "-"}</p><p className="mt-1 max-w-52 truncate text-xs text-slate-500">{invoice.origin || "-"} <span className="text-orange-400">to</span> {invoice.destination || "-"}</p><p className="mt-0.5 text-[11px] text-slate-400">{invoice.tracking_number || "No tracking number"}</p></td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600"><span className="inline-flex items-center gap-2"><CalendarDays size={15} className="text-slate-400" /> {formatDate(invoice.invoice_date)}</span></td>
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-700">{money(invoice.subtotal)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">{money(invoice.tax_amount)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-red-500">-{money(invoice.discount_amount)}</td>
                    <td className="whitespace-nowrap px-5 py-4"><p className="text-base font-bold text-slate-950">{money(invoice.total_amount)}</p></td>
                    <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[invoice.status] || statusStyles.DRAFT}`}>{invoice.status === "PAID" ? <CheckCircle2 size={13} /> : invoice.status === "CANCELLED" ? <Ban size={13} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}{invoice.status}</span></td>
                    <td className="px-5 py-4"><div className="flex items-center gap-2"><button type="button" disabled={printingId === invoice.id} onClick={() => print(invoice.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700 transition hover:border-orange-300 hover:bg-orange-100 disabled:opacity-50">{printingId === invoice.id ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />} PDF</button><div className="relative"><select disabled={updatingId === invoice.id} className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-orange-400 disabled:opacity-50" value={invoice.status} onChange={(event) => changeStatus(invoice.id, event.target.value)}><option value="DRAFT">Draft</option><option value="ISSUED">Issued</option><option value="PAID">Paid</option><option value="CANCELLED">Cancelled</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" /></div></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 py-8 backdrop-blur-sm sm:items-center">
          <form onSubmit={save} className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-100 bg-white px-6 py-5 sm:px-7">
              <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">Billing · New Invoice</p><h2 className="mt-1 text-2xl font-bold text-slate-900">Create Invoice</h2><p className="mt-1 text-sm text-slate-500">Completed shipment aur verified charges se invoice generate karein.</p></div><button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800" aria-label="Close create invoice modal"><X size={19} /></button></div>
            </div>

            <div className="max-h-[72vh] space-y-5 overflow-y-auto p-6 sm:p-7">
              <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"><Truck size={16} className="text-orange-500" /> Completed shipment *</span><div className="relative"><select required className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-10 text-sm text-slate-800 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" value={form.shipment_id} onChange={(event) => chooseShipment(event.target.value)}><option value="">Select shipment for billing</option>{shipments.map((shipment) => <option key={shipment.shipment_id} value={shipment.shipment_id}>{shipment.shipment_number} — {shipment.origin || "-"} to {shipment.destination || "-"}</option>)}</select><ChevronDown size={17} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" /></div></label>
              {!shipments.length && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">Abhi koi completed, uninvoiced shipment available nahi hai. Shipment ko complete karne ke baad uske saved charges yahan automatically dikh jayenge.</p>}

              {selected ? (
                <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                  <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"><div className="mb-4 flex items-center justify-between"><div><h3 className="font-bold text-slate-900">Charge breakdown</h3><p className="text-xs text-slate-500">Shipment #{selected.shipment_number}</p></div><span className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 shadow-sm">Shipment + maintenance</span></div><div className="space-y-2.5">{chargeFields.map(([key, label]) => <div className={`flex items-center justify-between text-sm ${key === "maintenance_charge" ? "mt-3 border-t border-dashed border-slate-300 pt-3" : ""}`} key={key}><span className="text-slate-600">{key === "maintenance_charge" && selected.maintenance_services ? `${label} (${selected.maintenance_services} service)` : label}</span><span className="font-semibold text-slate-800">{money(selected[key])}</span></div>)}</div><div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-300 pt-4"><span className="font-bold text-slate-900">Subtotal</span><span className="text-lg font-bold text-slate-950">{money(subtotal)}</span></div>{subtotal <= 0 && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">Invoice banane se pehle shipment charge ya assigned vehicle ka maintenance cost add karein.</p>}</section>

                  <section className="space-y-4"><div className="grid grid-cols-2 gap-3"><label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Tax amount</span><input type="number" min="0" step="0.01" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" placeholder="0.00" value={form.tax_amount} onChange={(event) => setForm((previous) => ({ ...previous, tax_amount: event.target.value }))} /></label><label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Discount</span><input type="number" min="0" step="0.01" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" placeholder="0.00" value={form.discount_amount} onChange={(event) => setForm((previous) => ({ ...previous, discount_amount: event.target.value }))} /></label></div><label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Due date</span><input type="date" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" value={form.due_date} onChange={(event) => setForm((previous) => ({ ...previous, due_date: event.target.value }))} /></label><label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Invoice notes</span><textarea rows="3" className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" placeholder="Payment terms or additional notes..." value={form.notes} onChange={(event) => setForm((previous) => ({ ...previous, notes: event.target.value }))} /></label></section>
                </div>
              ) : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center"><Truck size={25} className="mx-auto text-slate-400" /><p className="mt-3 text-sm font-semibold text-slate-700">Charge details dekhne ke liye shipment select karein</p><p className="mt-1 text-xs text-slate-500">Sirf completed aur uninvoiced shipments eligible hain.</p></div>}

              {selected && <div className="flex flex-col gap-3 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-orange-600">Grand Total</p><p className="mt-1 text-3xl font-black text-slate-950">{money(total)}</p></div><div className="text-left text-xs leading-5 text-slate-500 sm:text-right">Subtotal {money(subtotal)}<br />Tax {money(form.tax_amount)} · Discount {money(form.discount_amount)}</div></div>}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:px-7"><button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200">Cancel</button><button disabled={saving || !selected || subtotal <= 0} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">{saving ? <Loader2 size={17} className="animate-spin" /> : <FileText size={17} />}{saving ? "Generating..." : "Generate Invoice"}</button></div>
          </form>
        </div>,
        document.body,
      )}
    </div>
  );
}
