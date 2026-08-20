import React,   { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  IndianRupee,
  Loader2,
  MapPin,
  ReceiptText,
  Search,
  Truck,
  WalletCards,
  X,
} from "lucide-react";
import { getShipments } from "../services/api.js/shipmentService.js";
import { createPayment, getPaymentInvoices } from "../services/api.js/paymentService.js";
import { getInvoiceTemplate } from "../services/api.js/invoiceService.js";

const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
}).format(Number(value || 0));

const labelStatus = (value) => String(value || "PENDING")
  .replaceAll("_", " ")
  .toLowerCase()
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const statusTones = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/10",
  UNASSIGNED: "bg-slate-100 text-slate-700 ring-slate-500/10",
  ASSIGNED: "bg-blue-50 text-blue-700 ring-blue-600/10",
  IN_TRANSIT: "bg-violet-50 text-violet-700 ring-violet-600/10",
  OUT_FOR_DELIVERY: "bg-orange-50 text-orange-700 ring-orange-600/10",
  DELIVERED: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  POD_UPLOADED: "bg-teal-50 text-teal-700 ring-teal-600/10",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  CANCELLED: "bg-red-50 text-red-700 ring-red-600/10",
};

const formatDate = (value) => value
  ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  : "-";

const paymentDefaults = { payment_method: "UPI", reference_number: "" };

export default function ShipmentTracking() {
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "null"), []);
  const [shipments, setShipments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewingInvoiceId, setViewingInvoiceId] = useState(null);
  const [paymentForm, setPaymentForm] = useState(paymentDefaults);
  const [savingPayment, setSavingPayment] = useState(false);

  const fetchShipments = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await getShipments({ search: query, page: 1, limit: 200 });
      setShipments(response.shipments || response.data || []);
    } catch (error) {
      setShipments([]);
      toast.error(error.response?.data?.message || "Shipments load nahi ho sake");
    } finally {
      setLoading(false);
    }
  }, [query, user?.id]);

  const fetchInvoices = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await getPaymentInvoices();
      setInvoices(response.data || []);
    } catch {
      setInvoices([]);
    }
  }, [user?.id]);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);
  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const invoicesByShipment = useMemo(() => new Map(
    invoices.map((invoice) => [String(invoice.shipment_id), invoice]),
  ), [invoices]);

  const startPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm(paymentDefaults);
  };

  const closePayment = () => {
    if (savingPayment) return;
    setSelectedInvoice(null);
    setPaymentForm(paymentDefaults);
  };

  const viewInvoice = async (invoice) => {
    const popup = window.open("", "_blank", "width=900,height=1000");
    if (!popup) {
      toast.error("Popup blocked. Browser popup allow karein.");
      return;
    }
    popup.document.write("<p style='font-family:Arial;padding:24px'>Invoice load ho raha hai...</p>");
    setViewingInvoiceId(invoice.invoice_id);
    try {
      const html = await getInvoiceTemplate(invoice.invoice_id);
      popup.document.open();
      popup.document.write(html);
      popup.document.close();
      popup.focus();
    } catch (error) {
      popup.close();
      toast.error(error.response?.data?.message || "Invoice load nahi ho saka");
    } finally {
      setViewingInvoiceId(null);
    }
  };

  const submitPayment = async (event) => {
    event.preventDefault();
    if (!selectedInvoice) return;
    const reference = paymentForm.reference_number.trim();
    if (!reference) {
      toast.error("Transaction reference enter karein");
      return;
    }

    setSavingPayment(true);
    try {
      await createPayment({
        invoice_id: selectedInvoice.invoice_id,
        amount: Number(selectedInvoice.balance_amount || 0),
        payment_date: new Date().toISOString().slice(0, 10),
        payment_method: paymentForm.payment_method,
        reference_number: reference,
        notes: "Customer payment from shipment tracking",
      });
      toast.success("Payment successful. Invoice paid ho gaya.");
      setSelectedInvoice(null);
      setPaymentForm(paymentDefaults);
      await fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.message || "Payment save nahi ho saka");
    } finally {
      setSavingPayment(false);
    }
  };

  const paymentModal = selectedInvoice ? createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
      <form onSubmit={submitPayment} className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">Secure payment</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Pay Invoice</h2>
            <p className="mt-1 text-sm text-slate-500">{selectedInvoice.invoice_number} · Shipment #{selectedInvoice.shipment_number}</p>
          </div>
          <button type="button" onClick={closePayment} className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500 hover:bg-slate-100" aria-label="Close payment"><X size={19} /></button>
        </div>

        <div className="space-y-5 p-6">
          <section className="rounded-2xl bg-slate-900 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Amount payable</p>
            <p className="mt-2 text-3xl font-black">{money(selectedInvoice.balance_amount)}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-white/10 p-3"><p className="text-slate-400">Invoice total</p><p className="mt-1 font-bold">{money(selectedInvoice.total_amount)}</p></div>
              <div className="rounded-xl bg-white/10 p-3"><p className="text-slate-400">Already paid</p><p className="mt-1 font-bold text-emerald-300">{money(selectedInvoice.paid_amount)}</p></div>
            </div>
          </section>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Payment method *</span>
            <div className="relative">
              <CreditCard size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select value={paymentForm.payment_method} onChange={(event) => setPaymentForm((current) => ({ ...current, payment_method: event.target.value }))} className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100">
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CARD">Debit / Credit Card</option>
              </select>
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Transaction reference *</span>
            <input required value={paymentForm.reference_number} onChange={(event) => setPaymentForm((current) => ({ ...current, reference_number: event.target.value }))} placeholder="UPI / UTR / transaction ID" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            <span className="mt-2 block text-xs text-slate-400">Successful payment ka transaction reference enter karein.</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button type="button" disabled={savingPayment} onClick={closePayment} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50">Cancel</button>
          <button disabled={savingPayment} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">
            {savingPayment ? <Loader2 size={17} className="animate-spin" /> : <WalletCards size={17} />}
            {savingPayment ? "Processing..." : `Pay ${money(selectedInvoice.balance_amount)}`}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  ) : null;

  return (
    <React.Fragment>
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section>
          <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-500"><MapPin size={14} /> Customer tracking</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Shipment Tracking & Payment</h1>
          <p className="mt-1 text-sm text-slate-500">Apne shipments ka live status dekhein aur issued invoice ka payment yahin se karein.</p>
        </section>

        <form onSubmit={(event) => { event.preventDefault(); setQuery(search.trim()); }} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="relative">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by AWB, shipment number, origin or destination" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" />
            </label>
            <button type="submit" className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600">Search</button>
          </div>
        </form>

        <section className="space-y-4">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white"><div className="text-center"><Loader2 className="mx-auto animate-spin text-orange-500" /><p className="mt-3 text-sm text-slate-500">Shipments load ho rahe hain...</p></div></div>
          ) : shipments.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><div><Truck size={32} className="mx-auto text-slate-300" /><h2 className="mt-4 font-bold text-slate-800">Koi shipment nahi mila</h2><p className="mt-1 text-sm text-slate-500">Organization se shipment assign hone ke baad tracking details yahan dikhengi.</p></div></div>
          ) : shipments.map((shipment) => {
            const invoice = invoicesByShipment.get(String(shipment.id));
            const status = String(shipment.current_status || "PENDING").toUpperCase();
            const balance = Number(invoice?.balance_amount || 0);
            const isPaid = Boolean(invoice) && (invoice.status === "PAID" || balance <= 0.01);

            return (
              <article key={shipment.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Truck size={21} /></span>
                    <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">AWB / Tracking number</p><h2 className="mt-1 truncate text-xl font-bold text-slate-900">{shipment.tracking_number || shipment.shipment_number}</h2><p className="mt-0.5 text-xs text-slate-500">Shipment #{shipment.shipment_number}</p></div>
                  </div>
                  <span className={`self-start rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${statusTones[status] || statusTones.PENDING}`}>{labelStatus(status)}</span>
                </div>

                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div><p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400"><MapPin size={13} /> Route</p><p className="mt-2 text-sm font-semibold text-slate-700">{shipment.origin || "-"} → {shipment.destination || "-"}</p></div>
                  <div><p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400"><CalendarDays size={13} /> Booking</p><p className="mt-2 text-sm font-semibold text-slate-700">{formatDate(shipment.booking_date)}</p></div>
                  <div><p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400"><ReceiptText size={13} /> Invoice</p>{invoice ? <button type="button" disabled={viewingInvoiceId === invoice.invoice_id} onClick={() => viewInvoice(invoice)} className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50">{viewingInvoiceId === invoice.invoice_id ? <Loader2 size={14} className="animate-spin" /> : <ReceiptText size={14} />} View Invoice</button> : <p className="mt-2 text-sm font-semibold text-slate-700">{status === "COMPLETED" ? "Invoice pending" : "After completion"}</p>}</div>
                  <div><p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400"><IndianRupee size={13} /> Amount</p><p className="mt-2 text-sm font-bold text-slate-900">{money(invoice?.total_amount ?? shipment.total_amount)}</p></div>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  {!invoice ? (
                    <p className="flex items-center gap-2 text-sm font-medium text-slate-500"><Clock3 size={16} /> {status === "COMPLETED" ? "Organization invoice issue karega, uske baad payment available hoga." : "Shipment complete hone ke baad invoice aur payment available hoga."}</p>
                  ) : isPaid ? (
                    <p className="flex items-center gap-2 text-sm font-bold text-emerald-700"><CheckCircle2 size={17} /> Payment completed · {money(invoice.paid_amount)} paid</p>
                  ) : (
                    <><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Outstanding balance</p><p className="mt-0.5 text-lg font-black text-orange-600">{money(balance)}</p>{invoice.due_date && <p className="mt-0.5 text-xs text-slate-500">Due {formatDate(invoice.due_date)}</p>}</div><button type="button" onClick={() => startPayment(invoice)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-orange-600"><WalletCards size={17} /> Pay Now</button></>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </div>
      {paymentModal}
    </div>
    </React.Fragment>
  );
}
