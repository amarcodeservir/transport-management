import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import React from "react";
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  FileText,
  Landmark,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  Search,
  Smartphone,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { createPayment, deletePayment, getPaymentInvoices, getPayments, updatePayment } from "../services/api.js/paymentService";

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

const paymentMethods = {
  BANK_TRANSFER: { label: "Bank Transfer", icon: Landmark, tone: "border-blue-200 bg-blue-50 text-blue-700" },
  UPI: { label: "UPI", icon: Smartphone, tone: "border-violet-200 bg-violet-50 text-violet-700" },
  CASH: { label: "Cash", icon: Banknote, tone: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  CHEQUE: { label: "Cheque", icon: FileText, tone: "border-amber-200 bg-amber-50 text-amber-700" },
  CARD: { label: "Card", icon: CreditCard, tone: "border-cyan-200 bg-cyan-50 text-cyan-700" },
};

const emptyForm = () => ({
  invoice_id: "",
  amount: "",
  payment_date: new Date().toISOString().slice(0, 10),
  payment_method: "BANK_TRANSFER",
  reference_number: "",
  notes: "",
});

export default function Payments() {
  const paymentsTitleId = React.useId();
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentResult, invoiceResult] = await Promise.all([getPayments(), getPaymentInvoices()]);
      setPayments(paymentResult.data || []);
      setInvoices(invoiceResult.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Payments load nahi hui.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!open && !pendingDelete) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      if (open && !saving) {
        setOpen(false);
        setEditing(null);
      }
      if (pendingDelete && !deleting) setPendingDelete(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [deleting, open, pendingDelete, saving]);

  const selected = invoices.find((invoice) => String(invoice.invoice_id) === String(form.invoice_id));
  const paymentLimit = selected
    ? Number(selected.balance_amount || 0) + (editing ? Number(editing.amount || 0) : 0)
    : 0;
  const progress = selected && Number(selected.total_amount) > 0
    ? Math.min(100, (Number(selected.paid_amount || 0) / Number(selected.total_amount)) * 100)
    : 0;

  const eligibleInvoices = useMemo(() => invoices.filter((invoice) => (
    Number(invoice.balance_amount) > 0 || String(invoice.invoice_id) === String(editing?.invoice_id)
  )), [editing, invoices]);

  const visible = useMemo(() => payments.filter((payment) => {
    const text = `${payment.invoice_number} ${payment.shipment_number || ""} ${payment.tracking_number || ""} ${payment.reference_number || ""} ${payment.notes || ""}`.toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (method === "ALL" || payment.payment_method === method);
  }), [method, payments, query]);

  const closeModal = () => {
    if (saving) return;
    setOpen(false);
    setEditing(null);
    setForm(emptyForm());
  };

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const startEdit = (payment) => {
    setEditing(payment);
    setForm({
      invoice_id: payment.invoice_id,
      amount: payment.amount,
      payment_date: String(payment.payment_date || "").slice(0, 10),
      payment_method: payment.payment_method,
      reference_number: payment.reference_number || "",
      notes: payment.notes || "",
    });
    setOpen(true);
  };

  const remove = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deletePayment(pendingDelete.id);
      toast.success("Payment delete ho gaya.");
      setPendingDelete(null);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Payment delete nahi hua.");
    } finally {
      setDeleting(false);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    const enteredAmount = Number(form.amount);
    if (!enteredAmount || enteredAmount <= 0) return toast.error("Valid payment amount enter karein.");
    if (selected && enteredAmount > paymentLimit + 0.01) return toast.error(`Payment ${money(paymentLimit)} se zyada nahi ho sakta.`);

    setSaving(true);
    try {
      if (editing) await updatePayment(editing.id, form);
      else await createPayment(form);
      toast.success(editing ? "Payment update ho gaya." : "Payment successfully record ho gaya.");
      setOpen(false);
      setEditing(null);
      setForm(emptyForm());
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Payment save nahi hua.");
    } finally {
      setSaving(false);
    }
  };

  const collected = payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const outstandingInvoices = invoices.filter((invoice) => Number(invoice.balance_amount) > 0);
  const outstanding = invoices.reduce((total, invoice) => total + Number(invoice.balance_amount || 0), 0);
  const stats = [
    { label: "Total Payments", value: payments.length, helper: "Recorded transactions", icon: Receipt, tone: "bg-blue-50 text-blue-700", accent: "from-blue-500 to-indigo-500" },
    { label: "Collected", value: money(collected), helper: "Total received amount", icon: TrendingUp, tone: "bg-emerald-50 text-emerald-700", accent: "from-emerald-400 to-teal-500" },
    { label: "Outstanding Invoices", value: outstandingInvoices.length, helper: "Collection still pending", icon: FileText, tone: "bg-amber-50 text-amber-700", accent: "from-amber-400 to-orange-500" },
    { label: "Outstanding", value: money(outstanding), helper: "Total receivable balance", icon: CircleDollarSign, tone: "bg-violet-50 text-violet-700", accent: "from-violet-500 to-fuchsia-500" },
  ];

  const paymentModal = open ? createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 py-8 backdrop-blur-sm sm:items-center">
      <form onSubmit={save} className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="border-b border-slate-100 bg-white px-6 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">Billing · Collection</p><h2 className="mt-1 text-2xl font-bold text-slate-900">{editing ? "Update Payment" : "Record Payment"}</h2><p className="mt-1 text-sm text-slate-500">Invoice ke against received amount aur transaction details save karein.</p></div>
            <button type="button" onClick={closeModal} className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800" aria-label="Close payment modal"><X size={19} /></button>
          </div>
        </div>

        <div className="max-h-[72vh] space-y-5 overflow-y-auto p-6 sm:p-7">
          <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"><FileText size={16} className="text-orange-500" /> Invoice *</span><div className="relative"><select required disabled={Boolean(editing)} className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-10 text-sm text-slate-800 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100" value={form.invoice_id} onChange={(event) => {
            const invoice = invoices.find((item) => String(item.invoice_id) === event.target.value);
            setForm((previous) => ({ ...previous, invoice_id: event.target.value, amount: invoice?.balance_amount || "" }));
          }}><option value="">Select outstanding invoice</option>{eligibleInvoices.map((invoice) => <option key={invoice.invoice_id} value={invoice.invoice_id}>{invoice.invoice_number} — Shipment {invoice.shipment_number} — Balance {money(invoice.balance_amount)}</option>)}</select><ChevronDown size={17} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" /></div>{!editing && eligibleInvoices.length === 0 && <span className="mt-2 block text-xs font-medium text-emerald-600">Sabhi invoices fully paid hain. Koi outstanding invoice available nahi hai.</span>}</label>

          {selected ? (
            <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Selected Invoice</p><p className="mt-1 text-lg font-bold text-slate-900">{selected.invoice_number}</p><p className="text-xs text-slate-500">Shipment #{selected.shipment_number}</p></div><span className="inline-flex items-center gap-1.5 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"><CheckCircle2 size={14} /> Active invoice</span></div>
              <div className="mt-4 grid grid-cols-3 gap-3"><div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Invoice total</p><p className="mt-1 text-sm font-bold text-slate-900">{money(selected.total_amount)}</p></div><div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Already paid</p><p className="mt-1 text-sm font-bold text-emerald-600">{money(selected.paid_amount)}</p></div><div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{editing ? "Editable limit" : "Remaining"}</p><p className="mt-1 text-sm font-bold text-orange-600">{money(paymentLimit)}</p></div></div>
              <div className="mt-4"><div className="mb-1.5 flex justify-between text-xs font-medium text-slate-500"><span>Collection progress</span><span>{progress.toFixed(0)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all" style={{ width: `${progress}%` }} /></div></div>
            </section>
          ) : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-7 text-center"><Wallet size={26} className="mx-auto text-slate-400" /><p className="mt-3 text-sm font-semibold text-slate-700">Payment details bharne ke liye invoice select karein</p><p className="mt-1 text-xs text-slate-500">Amount automatically invoice ke remaining balance se fill hoga.</p></div>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Payment amount *</span><div className="relative"><CircleDollarSign size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input required type="number" min="0.01" step="0.01" max={selected ? paymentLimit : undefined} className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100" placeholder="0.00" value={form.amount} onChange={(event) => setForm((previous) => ({ ...previous, amount: event.target.value }))} /></div></label>
            <label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Payment date *</span><div className="relative"><CalendarDays size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input required type="date" className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100" value={form.payment_date} onChange={(event) => setForm((previous) => ({ ...previous, payment_date: event.target.value }))} /></div></label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Payment method *</span><div className="relative"><select required className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-3 pr-9 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100" value={form.payment_method} onChange={(event) => setForm((previous) => ({ ...previous, payment_method: event.target.value }))}>{Object.entries(paymentMethods).map(([value, details]) => <option value={value} key={value}>{details.label}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" /></div></label>
            <label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Transaction / cheque reference</span><input className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100" placeholder="UTR, transaction ID or cheque no." value={form.reference_number} onChange={(event) => setForm((previous) => ({ ...previous, reference_number: event.target.value }))} /></label>
          </div>

          <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Payment notes</span><textarea rows="3" className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100" placeholder="Optional collection notes..." value={form.notes} onChange={(event) => setForm((previous) => ({ ...previous, notes: event.target.value }))} /></label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:px-7"><button type="button" onClick={closeModal} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200">Cancel</button><button disabled={saving || !selected} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">{saving ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}{saving ? "Saving..." : editing ? "Update Payment" : "Save Payment"}</button></div>
      </form>
    </div>,
    document.body,
  ) : null;

  const deleteModal = pendingDelete ? createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600"><AlertTriangle size={26} /></span><h2 className="mt-4 text-xl font-bold text-slate-900">Delete this payment?</h2><p className="mt-2 text-sm leading-6 text-slate-500">Invoice <strong className="text-slate-700">{pendingDelete.invoice_number}</strong> ka {money(pendingDelete.amount)} payment remove hoga aur invoice balance dobara calculate hoga.</p><div className="mt-6 flex justify-center gap-3"><button type="button" disabled={deleting} onClick={() => setPendingDelete(null)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">Keep Payment</button><button type="button" disabled={deleting} onClick={remove} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">{deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}{deleting ? "Deleting..." : "Delete Payment"}</button></div></div>
    </div>,
    document.body,
  ) : null;

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8" aria-labelledby={paymentsTitleId}>
      <div className="mx-auto max-w-[1500px] space-y-6">
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-500"><Wallet size={14} /> Billing & Collections</p><h1 id={paymentsTitleId} className="text-3xl font-bold tracking-tight text-slate-900">Payments</h1><p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">Invoice collections record karein, payment history manage karein aur outstanding balance real time track karein.</p></div>
          <button type="button" onClick={startCreate} className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-100"><Plus size={18} /> Record Payment</button>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => { const Icon = stat.icon; return <article key={stat.label} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/70"><div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.accent}`} /><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{stat.label}</p><p className="mt-2 truncate text-2xl font-bold text-slate-900">{stat.value}</p><p className="mt-1 text-xs text-slate-500">{stat.helper}</p></div><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.tone}`}><Icon size={21} /></span></div></article>; })}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 md:flex-row md:items-center"><label className="relative flex-1"><Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" placeholder="Search invoice, shipment, tracking or reference..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><div className="relative min-w-48"><select className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100" value={method} onChange={(event) => setMethod(event.target.value)}><option value="ALL">All payment methods</option>{Object.entries(paymentMethods).map(([value, details]) => <option value={value} key={value}>{details.label}</option>)}</select><ChevronDown size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" /></div></div><div className="mt-3 flex items-center justify-between px-1 text-xs text-slate-500"><span>{visible.length} of {payments.length} payments</span>{(query || method !== "ALL") && <button type="button" onClick={() => { setQuery(""); setMethod("ALL"); }} className="font-semibold text-orange-600 hover:text-orange-700">Clear filters</button>}</div></section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-900">Payment Register</h2><p className="mt-0.5 text-xs text-slate-500">Received collections and transaction references</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{payments.length} records</span></div><div className="overflow-x-auto"><table className="min-w-[1080px] w-full text-sm"><thead className="bg-slate-50/90"><tr>{["Payment Date", "Invoice", "Shipment", "Method", "Reference", "Amount", "Actions"].map((heading) => <th className="whitespace-nowrap px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500" key={heading}>{heading}</th>)}</tr></thead><tbody>{loading ? Array.from({ length: 3 }).map((_, index) => <tr className="border-t border-slate-100" key={index}>{Array.from({ length: 7 }).map((__, cell) => <td className="px-5 py-5" key={cell}><span className="block h-3 animate-pulse rounded-full bg-slate-100" /></td>)}</tr>) : visible.length === 0 ? <tr><td colSpan="7" className="px-6 py-16"><div className="mx-auto flex max-w-md flex-col items-center text-center"><span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Wallet size={28} /></span><h3 className="mt-4 text-lg font-bold text-slate-900">{payments.length ? "Matching payment nahi mili" : "Abhi koi payment record nahi hai"}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{payments.length ? "Search ya payment method filter change karke dobara dekhein." : "Outstanding invoice select karke pehla collection record karein."}</p><button type="button" onClick={payments.length ? () => { setQuery(""); setMethod("ALL"); } : startCreate} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16} /> {payments.length ? "Clear Filters" : "Record Payment"}</button></div></td></tr> : visible.map((payment) => { const details = paymentMethods[payment.payment_method] || paymentMethods.BANK_TRANSFER; const MethodIcon = details.icon; return <tr className="border-t border-slate-100 transition hover:bg-emerald-50/30" key={payment.id}><td className="whitespace-nowrap px-5 py-4"><span className="inline-flex items-center gap-2 text-slate-600"><CalendarDays size={15} className="text-slate-400" /> {formatDate(payment.payment_date)}</span></td><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Receipt size={18} /></span><div><p className="font-bold text-slate-900">{payment.invoice_number}</p><p className="mt-0.5 text-xs text-slate-400">Invoice collection</p></div></div></td><td className="px-5 py-4"><p className="font-semibold text-slate-800">Shipment #{payment.shipment_number || "-"}</p><p className="mt-1 text-xs text-slate-400">{payment.tracking_number || "No tracking number"}</p></td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${details.tone}`}><MethodIcon size={13} /> {details.label}</span></td><td className="px-5 py-4"><p className="max-w-44 truncate font-medium text-slate-600">{payment.reference_number || "No reference"}</p>{payment.notes && <p className="mt-1 max-w-44 truncate text-xs text-slate-400">{payment.notes}</p>}</td><td className="whitespace-nowrap px-5 py-4"><p className="text-base font-black text-emerald-600">+{money(payment.amount)}</p><p className="mt-0.5 text-[11px] font-medium text-emerald-500">Received</p></td><td className="px-5 py-4"><div className="flex items-center gap-2"><button type="button" onClick={() => startEdit(payment)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"><Pencil size={13} /> Edit</button><button type="button" onClick={() => setPendingDelete(payment)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"><Trash2 size={13} /> Delete</button></div></td></tr>; })}</tbody></table></div></section>
      </div>
      {paymentModal}
      {deleteModal}
    </div>
  );
}
