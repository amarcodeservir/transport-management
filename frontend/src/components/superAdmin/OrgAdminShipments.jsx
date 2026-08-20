/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Package, Search, Plus, Eye, Trash2, X, Truck, MapPin, Clock,
  CheckCircle2, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight,
  Calendar, User, ArrowRight, Edit2
} from "lucide-react";
import {
  getShipments, createShipment, updateShipment,
  deleteShipment, updateShipmentStatus, getShipmentById
} from "../../services/api.js/shipmentService";
import { getAllCustomers } from "../../services/api.js/customerService";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const STATUS_CONFIG = {
  PENDING:          { label: "Pending",          color: "bg-yellow-100 text-yellow-700 border-yellow-300",   dot: "bg-yellow-500"  },
  BOOKED:           { label: "Booked",            color: "bg-orange-100 text-orange-700 border-orange-300",   dot: "bg-orange-500"  },
  UNASSIGNED:       { label: "Unassigned",        color: "bg-slate-100  text-slate-600  border-slate-300",    dot: "bg-slate-400"   },
  ASSIGNED:         { label: "Assigned",          color: "bg-blue-100   text-blue-700   border-blue-300",     dot: "bg-blue-500"    },
  IN_TRANSIT:       { label: "In Transit",        color: "bg-amber-100  text-amber-700  border-amber-300",    dot: "bg-amber-500"   },
  OUT_FOR_DELIVERY: { label: "Out for Delivery",  color: "bg-purple-100 text-purple-700 border-purple-300",   dot: "bg-purple-500"  },
  DELIVERED:        { label: "Delivered",         color: "bg-green-100  text-green-700  border-green-300",    dot: "bg-green-500"   },
  POD_UPLOADED:     { label: "POD Uploaded",      color: "bg-teal-100 text-teal-700 border-teal-300",          dot: "bg-teal-500"    },
  COMPLETED:        { label: "Completed",         color: "bg-emerald-100 text-emerald-700 border-emerald-300",dot: "bg-emerald-500" },
  CANCELLED:        { label: "Cancelled",         color: "bg-red-100    text-red-700    border-red-300",      dot: "bg-red-500"     },
};
const ALL_STATUSES = Object.keys(STATUS_CONFIG);
const NEXT_STATUS_OPTIONS = {
  PENDING: ["UNASSIGNED", "CANCELLED"], BOOKED: ["UNASSIGNED", "CANCELLED"], UNASSIGNED: ["CANCELLED"], ASSIGNED: ["CANCELLED"], IN_TRANSIT: ["CANCELLED"], OUT_FOR_DELIVERY: ["CANCELLED"], DELIVERED: [], POD_UPLOADED: []
};

const fmtDate = (v) => {
  if (!v) return "N/A";
  try { return new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return v; }
};
const today = () => new Date().toISOString().split("T")[0];

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "bg-slate-100 text-slate-600 border-slate-300", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatCard({ label, count, icon: Icon, color, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all hover:shadow-md ${
        active ? "border-[#F7941D] shadow-md shadow-orange-200/50 bg-orange-50" : "border-slate-200 bg-white hover:border-orange-200"
      }`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-lg font-bold text-slate-800 leading-tight">{count ?? 0}</p>
        <p className="text-xs text-slate-500 leading-tight">{label}</p>
      </div>
    </button>
  );
}

/* â”€â”€â”€ FIELD COMPONENT â”€â”€â”€ */
function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#F7941D] focus:ring-1 focus:ring-[#F7941D]/20 outline-none transition";
const selectCls = `${inputCls} bg-white`;

const toChargeAmount = (value) => Math.max(0, Number(value) || 0);
const roundCurrency = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
const calculateChargeTotal = (values) => roundCurrency(Math.max(
  0,
  toChargeAmount(values.freight_charge)
    + toChargeAmount(values.loading_charge)
    + toChargeAmount(values.unloading_charge)
    + toChargeAmount(values.fuel_surcharge)
    + toChargeAmount(values.insurance_charge)
    + toChargeAmount(values.other_charge)
    + toChargeAmount(values.tax_amount)
    - toChargeAmount(values.discount_amount)
));
const formatINR = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(toChargeAmount(value));

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/* CREATE / EDIT MODAL                         */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const EMPTY_FORM = {
  customer_id: "", booking_date: today(), lr_number: "",
  ref_number: "", shipment_number: "", indent_number: "",
  shipment_date: "", weight: 0,
  pickup_date: "", origin: "", destination: "",
  mode: "", service_type: "", payment_mode: "",
  expected_delivery_date: "", current_status: "PENDING", remarks: "",
  pod_url: "",
  sender_name: "", sender_mobile: "", sender_city: "", sender_address: "", sender_pincode: "",
  receiver_name: "", receiver_mobile: "", receiver_city: "", receiver_address: "", receiver_pincode: "",
  freight_charge: "", loading_charge: "", unloading_charge: "", fuel_surcharge: "", insurance_charge: "", other_charge: "", discount_amount: "", tax_amount: "",
};

export function ShipmentModal({ editData, customers = [], onClose, onSaved, customerMode = false }) {
  const isEdit = !!editData;
  const [form, setForm] = useState(() => {
    if (isEdit) {
      return {
        customer_id: editData.customer_id || "",
        booking_date: editData.booking_date?.split("T")[0] || today(),
        lr_number: editData.lr_number || "",
        ref_number: editData.ref_number || "",
        shipment_number: editData.shipment_number || "",
        indent_number: editData.indent_number || "",
        shipment_date: editData.shipment_date?.split("T")[0] || "",
        weight: editData.weight || 0,
        pickup_date: editData.pickup_date?.split("T")[0] || "",
        origin: editData.origin || "",
        destination: editData.destination || "",
        mode: editData.mode || "",
        service_type: editData.service_type || "",
        payment_mode: editData.payment_mode || "",
        expected_delivery_date: editData.expected_delivery_date?.split("T")[0] || "",
        current_status: editData.current_status || editData.status || "PENDING",
        remarks: editData.remarks || "",
        pod_url: editData.pod_url || "",
        sender_name: editData.sender_name || "",
        sender_mobile: editData.sender_mobile || "",
        sender_city: editData.sender_city || "",
        sender_address: editData.sender_address || "", sender_pincode: editData.sender_pincode || "",
        receiver_name: editData.receiver_name || "",
        receiver_mobile: editData.receiver_mobile || "",
        receiver_city: editData.receiver_city || "",
        receiver_address: editData.receiver_address || "", receiver_pincode: editData.receiver_pincode || "",
        freight_charge: editData.freight_charge ?? "",
        loading_charge: editData.loading_charge ?? "",
        unloading_charge: editData.unloading_charge ?? "",
        fuel_surcharge: editData.fuel_surcharge ?? "",
        insurance_charge: editData.insurance_charge ?? "",
        other_charge: editData.other_charge ?? "",
        discount_amount: editData.discount_amount ?? "",
        tax_amount: editData.tax_amount ?? "",
      };
    }
    return {
      ...EMPTY_FORM,
      customer_id: customerMode ? customers[0]?.id || "" : "",
    };
  });

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const STEPS = customerMode ? ["Basic Info", "Parties"] : ["Basic Info", "Parties", "Charges"];
  const totalSteps = STEPS.length;

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const onChange = e => set(e.target.name, e.target.value);
  const calculatedTotal = calculateChargeTotal(form);
  const hasCharges = [
    "freight_charge", "loading_charge", "unloading_charge", "fuel_surcharge",
    "insurance_charge", "other_charge", "discount_amount", "tax_amount"
  ].some((field) => toChargeAmount(form[field]) > 0);

  const handleSave = async () => {
    if (!form.customer_id) { toast.error("Customer is required"); setStep(1); return; }
    if (!form.booking_date) { toast.error("Booking date is required"); setStep(1); return; }
    if (customerMode && (!form.origin || !form.destination)) { toast.error("Origin and destination are required"); setStep(1); return; }
    if (customerMode && (!form.sender_name || !form.sender_mobile || !form.sender_address)) { toast.error("Sender name, mobile and address are required"); setStep(2); return; }
    if (customerMode && (!form.receiver_name || !form.receiver_mobile || !form.receiver_address)) { toast.error("Receiver name, mobile and address are required"); setStep(2); return; }

    const payload = {
      customer_id: form.customer_id,
      booking_date: form.booking_date,
      lr_number: form.lr_number || undefined,
      ref_number: form.ref_number || undefined,
      shipment_number: form.shipment_number || undefined,
      indent_number: form.indent_number || undefined,
      shipment_date: form.shipment_date || undefined,
      weight: Number(form.weight) || 0,
      pickup_date: form.pickup_date || undefined,
      origin: form.origin,
      destination: form.destination,
      mode: form.mode,
      service_type: form.service_type,
      payment_mode: form.payment_mode,
      expected_delivery_date: form.expected_delivery_date || undefined,
      current_status: form.current_status,
      remarks: form.remarks,
      sender: {
        name: form.sender_name, mobile: form.sender_mobile,
        city: form.sender_city, address: form.sender_address,
        pincode: form.sender_pincode, party_type: "sender"
      },
      receiver: {
        name: form.receiver_name, mobile: form.receiver_mobile,
        city: form.receiver_city, address: form.receiver_address,
        pincode: form.receiver_pincode, party_type: "receiver"
      },
      charges: !customerMode && (isEdit || hasCharges) ? [{
        freight_charge: toChargeAmount(form.freight_charge),
        loading_charge: toChargeAmount(form.loading_charge),
        unloading_charge: toChargeAmount(form.unloading_charge),
        fuel_surcharge: toChargeAmount(form.fuel_surcharge),
        insurance_charge: toChargeAmount(form.insurance_charge),
        other_charge: toChargeAmount(form.other_charge),
        discount_amount: toChargeAmount(form.discount_amount),
        tax_amount: toChargeAmount(form.tax_amount),
        total_amount: calculatedTotal
      }] : [],
      packages: [],
      items: [],
    };

    try {
      setSaving(true);
      if (isEdit) {
        await updateShipment(editData.id, { ...payload, shipment_number: form.shipment_number });
        toast.success(`Shipment and charges updated · ${formatINR(calculatedTotal)}`);
      } else {
        await createShipment(payload);
        toast.success("Shipment created!");
      }
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save shipment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center   pt-20">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{isEdit ? "Edit Shipment" : "Create New Shipment"}</h2>
            <div className="flex items-center gap-2 mt-2">
              {STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  <button onClick={() => setStep(i + 1)}
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full transition-colors ${step === i + 1 ? "bg-[#F7941D] text-white" : step > i + 1 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {step > i + 1 ? <CheckCircle2 size={12} /> : <span>{i + 1}.</span>}{s}
                  </button>
                  {i < STEPS.length - 1 && <div className="w-4 h-px bg-slate-300" />}
                </React.Fragment>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* STEP 1 â€” Basic Info */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Customer" required>
                <select name="customer_id" value={form.customer_id} onChange={onChange} disabled={customerMode} className={`${selectCls} ${customerMode ? "bg-slate-100 cursor-not-allowed" : ""}`}>
                  <option value="">Select customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.company_name ? `(${c.company_name})` : ""}</option>)}
                </select>
              </Field>
              <Field label="Booking Date" required>
                <input type="date" name="booking_date" value={form.booking_date} onChange={onChange} className={inputCls} />
              </Field>
              <Field label="Shipment #">
                <input name="shipment_number" value={form.shipment_number} onChange={onChange} placeholder="Auto-generated if empty" className={inputCls} />
              </Field>
              <Field label="LR Number">
                <input name="lr_number" value={form.lr_number} onChange={onChange} placeholder="LR / Consignment #" className={inputCls} />
              </Field>
              <Field label="Ref Number">
                <input name="ref_number" value={form.ref_number} onChange={onChange} placeholder="Reference #" className={inputCls} />
              </Field>
              <Field label="Indent Number">
                <input name="indent_number" value={form.indent_number} onChange={onChange} placeholder="Indent #" className={inputCls} />
              </Field>
              <Field label="Shipment Date">
                <input type="date" name="shipment_date" value={form.shipment_date} onChange={onChange} className={inputCls} />
              </Field>
              <Field label="Weight (kg)">
                <input type="number" name="weight" value={form.weight} onChange={onChange} placeholder="Total weight" className={inputCls} />
              </Field>
              <Field label="Pickup Date">
                <input type="date" name="pickup_date" value={form.pickup_date} onChange={onChange} className={inputCls} />
              </Field>
              <Field label="Origin">
                <input name="origin" value={form.origin} onChange={onChange} placeholder="From city / address" className={inputCls} />
              </Field>
              <Field label="Destination">
                <input name="destination" value={form.destination} onChange={onChange} placeholder="To city / address" className={inputCls} />
              </Field>
              <Field label="Mode">
                <select name="mode" value={form.mode} onChange={onChange} className={selectCls}>
                  <option value="">Select mode</option>
                  <option value="ROAD">Road</option>
                  <option value="RAIL">Rail</option>
                  <option value="AIR">Air</option>
                  <option value="SEA">Sea</option>
                </select>
              </Field>
              <Field label="Service Type">
                <select name="service_type" value={form.service_type} onChange={onChange} className={selectCls}>
                  <option value="">Select service</option>
                  <option value="EXPRESS">Express</option>
                  <option value="STANDARD">Standard</option>
                  <option value="ECONOMY">Economy</option>
                </select>
              </Field>
              <Field label="Payment Mode">
                <select name="payment_mode" value={form.payment_mode} onChange={onChange} className={selectCls}>
                  <option value="">Select payment mode</option>
                  <option value="PREPAID">Prepaid</option>
                  <option value="COD">Cash on Delivery</option>
                  <option value="TO_PAY">To Pay</option>
                </select>
              </Field>
              <Field label="Expected Delivery Date">
                <input type="date" name="expected_delivery_date" value={form.expected_delivery_date} onChange={onChange} className={inputCls} />
              </Field>
              <Field label="Status">
                <select name="current_status" value={isEdit ? form.current_status : "PENDING"} className={`${selectCls} bg-slate-100`} disabled>
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>)}
                </select>
              </Field>
              <Field label="POD URL">
                <input name="pod_url" value={form.pod_url} placeholder="Upload from POD module after delivery" className={`${inputCls} bg-slate-100`} disabled />
              </Field>
              <div className="md:col-span-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                {customerMode
                  ? "Booking Pending status mein save hogi. Organization admin charges verify karke approve aur fleet assign karega."
                  : "Step flow: shipment save karein, Pending shipment approve karein, phir Operations → Assignments se available vehicle aur driver assign karein."}
              </div>
              <Field label="Remarks" className="md:col-span-2">
                <input name="remarks" value={form.remarks} onChange={onChange} placeholder="Optional notes" className={inputCls} />
              </Field>
            </div>
          )}

          {/* STEP 2 â€” Sender & Receiver */}
          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-blue-700 uppercase tracking-widest border-b border-blue-100 pb-2">Sender (Consignor)</h3>
                <Field label="Name"><input name="sender_name" value={form.sender_name} onChange={onChange} placeholder="Sender full name" className={inputCls} /></Field>
                <Field label="Mobile"><input name="sender_mobile" value={form.sender_mobile} onChange={onChange} placeholder="+91..." className={inputCls} /></Field>
                <Field label="City"><input name="sender_city" value={form.sender_city} onChange={onChange} placeholder="City" className={inputCls} /></Field>
                <Field label="Address"><input name="sender_address" value={form.sender_address} onChange={onChange} placeholder="Street, area..." className={inputCls} /></Field>
                <Field label="Pincode"><input name="sender_pincode" value={form.sender_pincode} onChange={onChange} placeholder="000000" className={inputCls} /></Field>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-green-700 uppercase tracking-widest border-b border-green-100 pb-2">Receiver (Consignee)</h3>
                <Field label="Name"><input name="receiver_name" value={form.receiver_name} onChange={onChange} placeholder="Receiver full name" className={inputCls} /></Field>
                <Field label="Mobile"><input name="receiver_mobile" value={form.receiver_mobile} onChange={onChange} placeholder="+91..." className={inputCls} /></Field>
                <Field label="City"><input name="receiver_city" value={form.receiver_city} onChange={onChange} placeholder="City" className={inputCls} /></Field>
                <Field label="Address"><input name="receiver_address" value={form.receiver_address} onChange={onChange} placeholder="Street, area..." className={inputCls} /></Field>
                <Field label="Pincode"><input name="receiver_pincode" value={form.receiver_pincode} onChange={onChange} placeholder="000000" className={inputCls} /></Field>
              </div>
            </div>
          )}

          {/* STEP 3 â€” Charges */}
          {!customerMode && step === 3 && (
            <div className="space-y-5">
              <p className="text-sm text-slate-500">Enter the billing details for this shipment. All fields are optional.</p>
              <div className="grid grid-cols-2 gap-5">
                <Field label="Freight Charge (INR)">
                  <input type="number" min="0" step="0.01" name="freight_charge" value={form.freight_charge} onChange={onChange} placeholder="0.00" className={inputCls} />
                </Field>
                <Field label="Loading Charge (INR)">
                  <input type="number" min="0" step="0.01" name="loading_charge" value={form.loading_charge} onChange={onChange} placeholder="0.00" className={inputCls} />
                </Field>
                <Field label="Unloading Charge (INR)">
                  <input type="number" min="0" step="0.01" name="unloading_charge" value={form.unloading_charge} onChange={onChange} placeholder="0.00" className={inputCls} />
                </Field>
                <Field label="Fuel Surcharge (INR)">
                  <input type="number" min="0" step="0.01" name="fuel_surcharge" value={form.fuel_surcharge} onChange={onChange} placeholder="0.00" className={inputCls} />
                </Field>
                <Field label="Insurance Charge (INR)">
                  <input type="number" min="0" step="0.01" name="insurance_charge" value={form.insurance_charge} onChange={onChange} placeholder="0.00" className={inputCls} />
                </Field>
                <Field label="Other Charge (INR)">
                  <input type="number" min="0" step="0.01" name="other_charge" value={form.other_charge} onChange={onChange} placeholder="0.00" className={inputCls} />
                </Field>
                <Field label="Discount Amount (INR)">
                  <input type="number" min="0" step="0.01" name="discount_amount" value={form.discount_amount} onChange={onChange} placeholder="0.00" className={inputCls} />
                </Field>
                <Field label="Tax Amount (INR)">
                  <input type="number" min="0" step="0.01" name="tax_amount" value={form.tax_amount} onChange={onChange} placeholder="0.00" className={inputCls} />
                </Field>
                <Field label="Total Amount (INR)">
                  <input type="number" value={calculatedTotal.toFixed(2)} readOnly className={`${inputCls} bg-slate-100 font-semibold text-slate-700 cursor-not-allowed`} />
                  <p className="text-xs text-slate-400">Charges se automatically calculate hoga.</p>
                </Field>
              </div>
              {/* Summary preview */}
              {hasCharges && (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">Billing Summary</p>
                  <div className="space-y-2 text-sm">
                    {Number(form.freight_charge) > 0 && <div className="flex justify-between"><span className="text-slate-500">Freight</span><span className="font-medium">{formatINR(form.freight_charge)}</span></div>}
                    {Number(form.loading_charge) > 0 && <div className="flex justify-between"><span className="text-slate-500">Loading</span><span className="font-medium">{formatINR(form.loading_charge)}</span></div>}
                    {Number(form.unloading_charge) > 0 && <div className="flex justify-between"><span className="text-slate-500">Unloading</span><span className="font-medium">{formatINR(form.unloading_charge)}</span></div>}
                    {Number(form.fuel_surcharge) > 0 && <div className="flex justify-between"><span className="text-slate-500">Fuel</span><span className="font-medium">{formatINR(form.fuel_surcharge)}</span></div>}
                    {Number(form.insurance_charge) > 0 && <div className="flex justify-between"><span className="text-slate-500">Insurance</span><span className="font-medium">{formatINR(form.insurance_charge)}</span></div>}
                    {Number(form.other_charge) > 0 && <div className="flex justify-between"><span className="text-slate-500">Other</span><span className="font-medium">{formatINR(form.other_charge)}</span></div>}
                    {Number(form.discount_amount) > 0 && <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="font-medium">-{formatINR(form.discount_amount)}</span></div>}
                    {Number(form.tax_amount) > 0 && <div className="flex justify-between"><span className="text-slate-500">Tax</span><span className="font-medium">{formatINR(form.tax_amount)}</span></div>}
                    <div className="flex justify-between border-t pt-2 mt-1 font-bold text-slate-800">
                      <span>Total</span>
                      <span className="text-[#F7941D]">{formatINR(calculatedTotal)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <button type="button" onClick={step > 1 ? () => setStep(s => s - 1) : onClose}
            className="inline-flex items-center gap-1 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            {step > 1 ? <><ChevronLeft size={15} /> Back</> : "Cancel"}
          </button>
          <div className="flex items-center gap-3">
            {step < totalSteps ? (
              <button onClick={() => setStep(s => Math.min(s + 1, totalSteps))}
                className="inline-flex items-center gap-1 px-6 py-2.5 text-sm font-bold bg-[#F7941D] text-white rounded-xl hover:bg-[#e08619] transition-colors shadow-sm shadow-orange-400/30">
                Next <ChevronRight size={15} />
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2.5 text-sm font-bold bg-[#F7941D] text-white rounded-xl hover:bg-[#e08619] disabled:opacity-60 transition-colors shadow-sm shadow-orange-400/30">
                {saving ? "Saving..." : isEdit ? "Save Changes" : customerMode ? "Submit Booking" : "Create Shipment"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/* DETAIL DRAWER                               */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function ShipmentDrawer({ shipment, onClose, onStatusChange, onDelete, onEdit }) {
  const [newStatus, setNewStatus] = useState(shipment?.status || shipment?.current_status || "");
  const [changingStatus, setChangingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tracking, setTracking] = useState([]);

  useEffect(() => {
    let active = true;
    getShipmentById(shipment.id).then(result => {
      if (active) setTracking(result?.tracking || []);
    }).catch(() => {});
    return () => { active = false; };
  }, [shipment.id]);
  const status = shipment?.status || shipment?.current_status || "PENDING";
  const nextStatuses = NEXT_STATUS_OPTIONS[status] || [];

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === status) return;
    try { setChangingStatus(true); await onStatusChange(shipment.id, newStatus); }
    finally { setChangingStatus(false); }
  };
  const handleDelete = async () => {
    try { setDeleting(true); await onDelete(shipment.id); }
    finally { setDeleting(false); }
  };

  const Row = ({ label, value }) => (
    <div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm text-slate-800 mt-0.5 font-medium">{value || "N/A"}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Shipment Details</h2>
            <p className="text-sm text-slate-500">{shipment.shipment_number || `#${shipment.id}`}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            <button onClick={() => onEdit(shipment)} title="Edit" className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600"><Edit2 size={16} /></button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-5">
          <div className="bg-slate-50 rounded-2xl p-5">
            <p className="text-xs font-bold text-[#F7941D] uppercase tracking-widest mb-4">Shipment Info</p>
            <div className="grid grid-cols-2 gap-4">
              <Row label="Shipment #" value={shipment.shipment_number} />
              <Row label="LR Number" value={shipment.lr_number} />
              <Row label="Booking Date" value={fmtDate(shipment.booking_date)} />
              <Row label="Expected Delivery" value={fmtDate(shipment.expected_delivery_date)} />
              <Row label="Origin" value={shipment.origin} />
              <Row label="Destination" value={shipment.destination} />
              <Row label="Mode" value={shipment.mode} />
              <Row label="Payment Mode" value={shipment.payment_mode} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Sender</p>
              <p className="text-sm font-semibold text-slate-800">{shipment.sender_name || "N/A"}</p>
              <p className="text-xs text-slate-500">{shipment.sender_mobile}</p>
              <p className="text-xs text-slate-400 mt-0.5">{shipment.sender_city}</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-2">Receiver</p>
              <p className="text-sm font-semibold text-slate-800">{shipment.receiver_name || "N/A"}</p>
              <p className="text-xs text-slate-500">{shipment.receiver_mobile}</p>
              <p className="text-xs text-slate-400 mt-0.5">{shipment.receiver_city}</p>
            </div>
          </div>

          {(shipment.vehicle_id || shipment.driver_id) && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-3">Assignment</p>
              <div className="grid grid-cols-2 gap-4">
                <Row label="Vehicle" value={shipment.vehicle_number ? `${shipment.vehicle_number} (${shipment.vehicle_type || ""})` : shipment.vehicle_id} />
                <Row label="Driver" value={shipment.driver_name ? `${shipment.driver_name} - ${shipment.driver_mobile || ""}` : shipment.driver_id} />
                <Row label="License" value={shipment.driver_license_number} />
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-4">Shipment Timeline</p>
            <div className="space-y-4">
              {tracking.length === 0 ? <p className="text-sm text-slate-400">No tracking events yet.</p> : tracking.map((event, index) => (
                <div key={event.id || index} className="flex gap-3">
                  <div className="flex flex-col items-center"><span className="w-3 h-3 rounded-full bg-[#F7941D] mt-1" />{index < tracking.length - 1 && <span className="w-px flex-1 bg-orange-200" />}</div>
                  <div className="pb-2"><p className="text-sm font-semibold text-slate-800">{STATUS_CONFIG[event.status]?.label || event.status}</p><p className="text-xs text-slate-500">{event.remarks || "Status updated"}{event.location ? ` - ${event.location}` : ""}</p><p className="text-[11px] text-slate-400 mt-1">{event.tracking_date ? new Date(event.tracking_date).toLocaleString("en-IN") : ""}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">Update Status</p>
            <div className="flex gap-3">
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F7941D] outline-none bg-white">
                {[status, ...nextStatuses].map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>)}
              </select>
              <button onClick={handleStatusChange} disabled={changingStatus || newStatus === status}
                className="px-4 py-2.5 bg-[#F7941D] text-white rounded-xl text-sm font-semibold hover:bg-[#e08619] disabled:opacity-50 transition-colors">
                {changingStatus ? "..." : "Update"}
              </button>
            </div>
          </div>

          {shipment.remarks && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-yellow-700 uppercase tracking-widest mb-1">Remarks</p>
              <p className="text-sm text-slate-700">{shipment.remarks}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
          {confirmDelete ? (
            <div className="flex items-center gap-3 w-full">
              <p className="text-sm text-red-600 font-medium flex-1">Confirm delete?</p>
              <button onClick={() => setConfirmDelete(false)} className="px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium">
                <Trash2 size={15} /> Delete
              </button>
              <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Close</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/* MAIN PAGE                                   */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function OrgAdminShipments({ filterStatus }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(filterStatus || "ALL");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editShipment, setEditShipment] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    getAllCustomers().then(r => setCustomers(r?.data || r || [])).catch(() => {});
  }, []);

  const fetchShipments = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (statusFilter !== "ALL") {
        params.status = statusFilter;
        if (statusFilter === "ASSIGNED") params.assignment_scope = "active";
      }
      if (search) params.search = search;
      const res = await getShipments(params);
      setShipments(res?.shipments || res?.data || []);
      setPagination(res?.pagination || { page: 1, totalPages: 1, total: (res?.shipments || []).length });
    } catch { toast.error("Failed to load shipments"); }
    finally { setLoading(false); }
  }, [statusFilter, search]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getShipments({ limit: 500 });
      const list = res?.shipments || res?.data || [];
      const s = { ALL: list.length };
      list.forEach(sh => { const st = sh.status || sh.current_status || "PENDING"; s[st] = (s[st] || 0) + 1; });
      s.ASSIGNED = list.filter((shipment) => shipment.active_assignment_status || (shipment.status || shipment.current_status) === "ASSIGNED").length;
      setStats(s);
    } catch (error) {
      console.error("Shipment stats load failed:", error);
    }
  }, []);

  useEffect(() => { fetchShipments(1); }, [fetchShipments]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { if (filterStatus) setStatusFilter(filterStatus); }, [filterStatus]);

  const refresh = () => { fetchShipments(pagination.page); fetchStats(); };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateShipmentStatus(id, newStatus);
      toast.success("Status updated!");
      setSelectedShipment(p => p ? { ...p, status: newStatus, current_status: newStatus } : null);
      refresh();
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to update status"); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteShipment(id);
      toast.success("Shipment deleted");
      setSelectedShipment(null);
      refresh();
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to delete"); }
  };

  const handleSaved = () => { setShowModal(false); setEditShipment(null); refresh(); };

  const openEdit = async (shipmentRow) => {
    setSelectedShipment(null);
    try {
      const detail = await getShipmentById(shipmentRow.id);
      const shipment = detail?.shipment || shipmentRow;
      const charge = detail?.charges?.[0] || {};
      const sender = (detail?.parties || []).find((party) => String(party.party_type).toLowerCase() === "sender") || {};
      const receiver = (detail?.parties || []).find((party) => String(party.party_type).toLowerCase() === "receiver") || {};
      setEditShipment({
        ...shipmentRow,
        ...shipment,
        ...charge,
        id: shipment.id || shipmentRow.id,
        sender_name: sender.name || shipmentRow.sender_name || "",
        sender_mobile: sender.mobile || shipmentRow.sender_mobile || "",
        sender_city: sender.city || shipmentRow.sender_city || "",
        sender_address: sender.address || "",
        sender_pincode: sender.pincode || "",
        receiver_name: receiver.name || shipmentRow.receiver_name || "",
        receiver_mobile: receiver.mobile || shipmentRow.receiver_mobile || "",
        receiver_city: receiver.city || shipmentRow.receiver_city || "",
        receiver_address: receiver.address || "",
        receiver_pincode: receiver.pincode || "",
      });
      setShowModal(true);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Shipment charges load nahi hue");
    }
  };

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setEditShipment(null);
      setShowModal(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const statCards = [
    { key: "ALL",             label: "All",           icon: Package,      color: "bg-slate-100 text-slate-600" },
    { key: "PENDING",         label: "Pending",        icon: Clock,        color: "bg-yellow-100 text-yellow-600" },
    { key: "UNASSIGNED",      label: "Unassigned",     icon: AlertTriangle,color: "bg-slate-100 text-slate-500" },
    { key: "ASSIGNED",        label: "Assigned",       icon: User,         color: "bg-blue-100 text-blue-600" },
    { key: "IN_TRANSIT",      label: "In Transit",     icon: Truck,        color: "bg-amber-100 text-amber-600" },
    { key: "OUT_FOR_DELIVERY",label: "Out for Delivery",icon: MapPin,      color: "bg-purple-100 text-purple-600" },
    { key: "DELIVERED",       label: "Delivered",      icon: CheckCircle2, color: "bg-green-100 text-green-600" },
    { key: "COMPLETED",       label: "Completed",      icon: CheckCircle2, color: "bg-emerald-100 text-emerald-600" },
  ];

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Shipments</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage, track and update all shipments.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={refresh} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => { setEditShipment(null); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#F7941D] text-white rounded-xl text-sm font-bold hover:bg-[#e08619] transition-colors shadow-md shadow-orange-300/30">
            <Plus size={16} /> Create Shipment
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {statCards.map(sc => (
          <StatCard key={sc.key} label={sc.label} count={stats[sc.key] ?? 0}
            icon={sc.icon} color={sc.color} active={statusFilter === sc.key}
            onClick={() => setStatusFilter(sc.key)} />
        ))}
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchShipments(1)}
            placeholder="Search by shipment #, LR, ref number..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F7941D] outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white focus:border-[#F7941D]">
          <option value="ALL">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>)}
        </select>
        <button onClick={() => fetchShipments(1)}
          className="px-5 py-2.5 bg-[#F7941D] text-white rounded-xl text-sm font-semibold hover:bg-[#e08619] transition-colors">
          Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-9 h-9 border-4 border-slate-200 border-t-[#F7941D] rounded-full animate-spin" />
          </div>
        ) : shipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Package className="text-slate-400" size={30} />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No Shipments Found</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6">Create your first shipment or adjust the filters.</p>
            <button onClick={() => { setEditShipment(null); setShowModal(true); }}
              className="px-5 py-2.5 bg-[#F7941D] text-white rounded-xl text-sm font-bold hover:bg-[#e08619] transition-colors">
              + Create Shipment
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["Shipment", "Route", "Parties", "Date", "Status", ""].map(h => (
                      <th key={h} className="py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shipments.map(s => {
                    const status = s.status || s.current_status || "PENDING";
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-5">
                          <p className="text-sm font-bold text-slate-800">{s.shipment_number || `#${s.id}`}</p>
                          {s.lr_number && <p className="text-xs text-slate-500">LR: {s.lr_number}</p>}
                          {s.mode && <p className="text-xs text-slate-400 mt-0.5">{s.mode}</p>}
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5 text-sm text-slate-700">
                            <span className="max-w-24 truncate">{s.origin || "N/A"}</span>
                            <ArrowRight size={12} className="text-slate-400 flex-shrink-0" />
                            <span className="max-w-24 truncate">{s.destination || "N/A"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          {s.sender_name ? (
                            <div>
                              <p className="text-xs text-slate-500">From: <span className="font-medium text-slate-700">{s.sender_name}</span></p>
                              <p className="text-xs text-slate-500">To: <span className="font-medium text-slate-700">{s.receiver_name || "N/A"}</span></p>
                            </div>
                          ) : <span className="text-slate-400 text-xs">Not set</span>}
                        </td>
                        <td className="py-4 px-5">
                          <p className="text-xs text-slate-600 flex items-center gap-1"><Calendar size={11} className="text-slate-400" />{fmtDate(s.booking_date)}</p>
                          {s.expected_delivery_date && <p className="text-xs text-slate-400 mt-0.5">EDD: {fmtDate(s.expected_delivery_date)}</p>}
                        </td>
                        <td className="py-4 px-5"><StatusBadge status={status} />{s.active_assignment_status && status !== "ASSIGNED" && <p className="mt-1 text-[11px] font-medium text-blue-600">Assignment: {String(s.active_assignment_status).toLowerCase()}</p>}</td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openEdit(s)} title="Edit"
                              className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                              <Edit2 size={15} />
                            </button>
                            <button onClick={() => setSelectedShipment(s)} title="View"
                              className="p-2 rounded-lg text-slate-400 hover:text-[#F7941D] hover:bg-orange-50 transition-colors">
                              <Eye size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">Total: <span className="font-semibold text-slate-700">{pagination.total}</span></p>
                <div className="flex items-center gap-2">
                  <button onClick={() => fetchShipments(pagination.page - 1)} disabled={pagination.page <= 1}
                    className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"><ChevronLeft size={15} /></button>
                  <span className="text-sm font-medium text-slate-700 px-2">{pagination.page} / {pagination.totalPages}</span>
                  <button onClick={() => fetchShipments(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
                    className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"><ChevronRight size={15} /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedShipment && (
        <ShipmentDrawer shipment={selectedShipment} onClose={() => setSelectedShipment(null)}
          onStatusChange={handleStatusChange} onDelete={handleDelete} onEdit={openEdit} />
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <ShipmentModal editData={editShipment} customers={customers}
          onClose={() => { setShowModal(false); setEditShipment(null); }} onSaved={handleSaved} />
      )}
    </div>
  );
}
