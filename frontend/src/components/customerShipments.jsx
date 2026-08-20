import React,{ useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { createShipment } from "../services/api.js/shipmentService.js";

const defaultForm = {
  customer_id: "",
  shipment_number: "",
  tracking_number: "",
  organization_id: "",
  ref_number: "",
  indent_number: "",
  lr_number: "",
  booking_date: new Date().toISOString().split("T")[0],
  shipment_date: "",
  pickup_date: "",
  weight: 0,
  shipment_type: "Domestic",
  service_type: "Standard",
  transport_mode: "",
  origin_city: "",
  destination_city: "",
  estimated_delivery_date: "",
  payment_mode: "prepaid",
  pod_url: "",

  freight_charge: 0,
  loading_charge: 0,
  unloading_charge: 0,
  fuel_surcharge: 0,
  insurance_charge: 0,
  other_charge: 0,
  discount_amount: 0,
  tax_amount: 0,

  special_instructions: "",

  pickup: {
    name: "",
    company_name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    pickup_date: "",
  },

  delivery: {
    name: "",
    company_name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    expected_delivery_date: "",
  },

  items: [
    {
      item_name: "",
      item_description: "",
      hsn_code: "",
      quantity: 1,
      unit: "PCS",
      weight: 0,
      total_value: 0,
      fragile: false,
      dangerous_goods: false,
    },
  ],

  packages: [
    {
      package_type: "",
      quantity: 1,
      length: 0,
      width: 0,
      height: 0,
      actual_weight: 0,
    }
  ],
};

const adminSteps = [
  "Basic Info",
  "Route",
  "Consignor",
  "Consignee",
  "Cargo & Packages",
  "Items",
  "Charges",
];

const customerSteps = adminSteps.slice(0, 4);

const createInitialForm = (user, isCustomer) => ({
  ...defaultForm,
  customer_id: isCustomer ? user?.id || "" : "",
  organization_id: isCustomer ? user?.organization_id || "" : "",
  pickup: { ...defaultForm.pickup },
  delivery: { ...defaultForm.delivery },
  items: defaultForm.items.map((item) => ({ ...item })),
  packages: defaultForm.packages.map((pkg) => ({ ...pkg })),
});

export default function CustomerShipments() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "null"), []);
  const isCustomer = String(user?.role || "").trim().toLowerCase().replace(/[-\s]+/g, "_") === "customer";
  const steps = isCustomer ? customerSteps : adminSteps;
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState(() => createInitialForm(user, isCustomer));

  const update = (path, value) => {
    if (!path.includes(".")) {
      setForm((p) => ({ ...p, [path]: value }));
      return;
    }
    const [first, rest] = path.split(".", 2);
    setForm((p) => ({ ...p, [first]: { ...p[first], [rest]: value } }));
  };

  const handleArrayAdd = (key, defaultObj) => {
    setForm((p) => ({ ...p, [key]: [...p[key], defaultObj] }));
  };

  const handleArrayUpdate = (key, index, field, value) => {
    setForm((p) => {
      const arr = [...p[key]];
      arr[index] = { ...arr[index], [field]: value };
      return { ...p, [key]: arr };
    });
  };

  const handleArrayRemove = (key, index) => {
    setForm((p) => ({
      ...p,
      [key]: p[key].filter((_, i) => i !== index),
    }));
  };

  const nextStep = () => {
    if (currentStep === 0) {
      if (!form.customer_id) {
        toast.error("Customer ID is required");
        return;
      }
      if (!form.booking_date) {
        toast.error("Booking Date is required");
        return;
      }
      if (!form.shipment_type) {
        toast.error("Shipment Type is required");
        return;
      }
    }
    if (currentStep === 1) {
      if (!form.origin_city) {
        toast.error("Origin City is required");
        return;
      }
      if (!form.destination_city) {
        toast.error("Destination City is required");
        return;
      }
    }
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const toChargeAmount = (value) => Math.max(0, Number(value) || 0);
  const roundCurrency = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

  const calculateSubtotal = (f) => {
    const subtotal = toChargeAmount(f.freight_charge)
      + toChargeAmount(f.loading_charge)
      + toChargeAmount(f.unloading_charge)
      + toChargeAmount(f.fuel_surcharge)
      + toChargeAmount(f.insurance_charge)
      + toChargeAmount(f.other_charge)
      - toChargeAmount(f.discount_amount);
    return roundCurrency(Math.max(0, subtotal));
  };

  const calculateTax = (f) => {
    const sub = calculateSubtotal(f);
    return roundCurrency((sub * toChargeAmount(f.tax_amount)) / 100);
  };

  const calculateTotal = (f) => roundCurrency(calculateSubtotal(f) + calculateTax(f));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_id || !form.booking_date) {
      toast.error("Please fill in basic required fields.");
      return;
    }
    if (isCustomer && (!form.pickup.name || !form.pickup.phone || !form.pickup.address)) {
      toast.error("Consignor name, phone aur address required hain.");
      return;
    }
    if (isCustomer && (!form.delivery.name || !form.delivery.phone || !form.delivery.address)) {
      toast.error("Consignee name, phone aur address required hain.");
      return;
    }

    const payload = {
      shipment_number: form.shipment_number || form.ref_number || undefined,
      tracking_number: form.tracking_number || undefined,
      lr_number: form.lr_number,
      customer_id: form.customer_id,
      organization_id: form.organization_id || undefined,
      ref_number: form.ref_number,
      indent_number: form.indent_number,
      booking_date: form.booking_date,
      shipment_date: form.shipment_date || undefined,
      weight: Number(form.weight) || 0,
      pickup_date: form.pickup.pickup_date || undefined,
      pickup_time_from: form.pickup.pickup_time_from || undefined,
      pickup_time_to: form.pickup.pickup_time_to || undefined,
      indent_date: form.indent_date || undefined,
      shipment_type: form.shipment_type || "Domestic",
      service_type: form.service_type || "Standard",
      mode: form.transport_mode || "ROAD",
      payment_mode: form.payment_mode || "PREPAID",
      origin: form.origin_city || "Origin",
      destination: form.destination_city || "Destination",
      expected_delivery_date: form.estimated_delivery_date || undefined,
      actual_delivery_date: undefined,
      current_status: "PENDING",
      remarks: form.special_instructions,
      pod_url: form.pod_url || null,

      sender: {
        party_type: "SENDER",
        name: form.pickup.name,
        company_name: form.pickup.company_name,
        mobile: form.pickup.phone,
        email: form.pickup.email,
        address: form.pickup.address,
        city: form.pickup.city,
        state: form.pickup.state,
        pincode: form.pickup.pincode,
        gst_number: form.pickup.gstin,
      },

      receiver: {
        party_type: "RECEIVER",
        name: form.delivery.name,
        company_name: form.delivery.company_name,
        mobile: form.delivery.phone,
        email: form.delivery.email,
        address: form.delivery.address,
        city: form.delivery.city,
        state: form.delivery.state,
        pincode: form.delivery.pincode,
        gst_number: form.delivery.gstin,
      },

      packages: form.packages.map((pkg) => ({
        package_type: pkg.package_type,
        quantity: Number(pkg.quantity) || 1,
        weight: Number(pkg.actual_weight) || 0,
        length: Number(pkg.length) || 0,
        width: Number(pkg.width) || 0,
        height: Number(pkg.height) || 0,
        volumetric_weight: Number(pkg.volumetric_weight) || 0,
        description: pkg.package_type || "Package",
      })),

      items: form.items.map((item) => ({
        item_name: item.item_name,
        item_description: item.item_description,
        hsn_code: item.hsn_code,
        quantity: Number(item.quantity) || 1,
        unit: item.unit || "PCS",
        weight: Number(item.weight) || 0,
        total_value: Number(item.total_value) || 0,
        fragile: item.fragile || false,
        dangerous_goods: item.dangerous_goods || false,
      })),

      charges: [
        {
          freight_charge: toChargeAmount(form.freight_charge),
          loading_charge: toChargeAmount(form.loading_charge),
          unloading_charge: toChargeAmount(form.unloading_charge),
          fuel_surcharge: toChargeAmount(form.fuel_surcharge),
          insurance_charge: toChargeAmount(form.insurance_charge),
          tax_amount: calculateTax(form),
          discount_amount: toChargeAmount(form.discount_amount),
          other_charge: toChargeAmount(form.other_charge),
          total_amount: calculateTotal(form),
        },
      ],
    };

    if (isCustomer) {
      delete payload.packages;
      delete payload.items;
      delete payload.charges;
    }

    try {
      setLoading(true);
      const response = await createShipment(payload);
      if (response?.success && response?.shipment_id) {
        toast.success(response.message || "Shipment created successfully");
        setForm(createInitialForm(user, isCustomer));
        setCurrentStep(0);
        if (user?.role === "admin" || user?.role === "super_admin" || user?.role === "organization_admin") {
          navigate("/dashboard/admin-shipments");
        } else {
          navigate("/dashboard/tracking");
        }
      } else {
        toast.error(response?.message || "Failed to create shipment");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error creating shipment");
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label, type, path, placeholder = "", options = []) => {
    const value = path.includes(".")
      ? form[path.split(".")[0]][path.split(".")[1]]
      : form[path];

    if (type === "select") {
      return (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">{label}</label>
          <select
            value={value}
            onChange={(e) => update(path, e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
          >
            <option value="">Select...</option>
            {options.map((o) => (
              <option key={o.value || o} value={o.value || o}>
                {o.label || o}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (type === "checkbox") {
      return (
        <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => update(path, e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
          />
          <span className="text-sm font-medium text-slate-700">{label}</span>
        </label>
      );
    }

    if (type === "textarea") {
      return (
        <div className="flex flex-col gap-1.5 col-span-full">
          <label className="text-sm font-medium text-slate-700">{label}</label>
          <textarea
            placeholder={placeholder}
            value={value}
            onChange={(e) => update(path, e.target.value)}
            rows={3}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <input
          type={type}
          min={type === "number" ? 0 : undefined}
          step={type === "number" ? "0.01" : undefined}
          placeholder={placeholder}
          value={value}
          onChange={(e) =>
            update(
              path,
              type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value
            )
          }
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight">Create Shipment</h1>
          <p className="text-slate-500 mt-2 text-sm">
            {isCustomer
              ? "Basic booking aur party details submit karein. Charges organization admin verify karke add karega."
              : "Fill in the details below to generate a new shipment order. Follow the steps sequentially."}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Progress Bar & Tabs */}
          <div className="flex overflow-x-auto border-b border-slate-200 hide-scrollbar bg-slate-50/50">
            {steps.map((label, idx) => (
              <button
                key={label}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`flex-shrink-0 px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${idx === currentStep
                  ? "border-[#f18d1c] text-[#f18d1c] bg-orange-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${idx === currentStep
                      ? "bg-[#f18d1c] text-white"
                      : "bg-slate-200 text-slate-600"
                      }`}
                  >
                    {idx + 1}
                  </span>
                  {label}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <div className="min-h-[400px]">
              {currentStep === 0 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Basic Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {!isCustomer && renderInput("Customer ID *", "number", "customer_id", "Enter ID")}
                    {!isCustomer && renderInput("Organization ID", "number", "organization_id", "Enter Org ID")}
                    {renderInput("Booking Date *", "date", "booking_date")}
                    {renderInput("Shipment Date", "date", "shipment_date")}
                    {renderInput("Weight (kg)", "number", "weight")}
                    {renderInput("Ref Number", "text", "ref_number", "e.g. REF-001")}
                    {renderInput("LR Number", "text", "lr_number", "e.g. LR-992")}
                    {renderInput("Indent Number", "text", "indent_number")}
                    {renderInput("Shipment Type", "select", "shipment_type", "", ["Domestic", "International"])}
                    {renderInput("Service Type", "select", "service_type", "", ["Standard", "Express", "Same Day"])}
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Route & Transport</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderInput("Origin City", "text", "origin_city")}
                    {renderInput("Destination City", "text", "destination_city")}
                    {renderInput("Transport Mode", "select", "transport_mode", "", ["ROAD", "AIR", "RAIL", "SEA"])}
                    {renderInput("Payment Mode", "select", "payment_mode", "", ["PREPAID", "TO_PAY", "CREDIT"])}
                    {renderInput("Est. Delivery Date", "date", "estimated_delivery_date")}
                    {!isCustomer && renderInput("POD URL", "text", "pod_url", "https://...")}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Consignor (Pickup) Details</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderInput("Sender Name", "text", "pickup.name", "John Doe")}
                    {renderInput("Company Name", "text", "pickup.company_name")}
                    {renderInput("Phone", "text", "pickup.phone")}
                    {renderInput("Email", "email", "pickup.email")}
                    {renderInput("City", "text", "pickup.city")}
                    {renderInput("State", "text", "pickup.state")}
                    {renderInput("Pincode", "text", "pickup.pincode")}
                    {renderInput("GSTIN", "text", "pickup.gstin")}
                    {renderInput("Pickup Date", "date", "pickup.pickup_date")}
                    {renderInput("Full Address", "textarea", "pickup.address")}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Consignee (Delivery) Details</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderInput("Receiver Name", "text", "delivery.name")}
                    {renderInput("Company Name", "text", "delivery.company_name")}
                    {renderInput("Phone", "text", "delivery.phone")}
                    {renderInput("Email", "email", "delivery.email")}
                    {renderInput("City", "text", "delivery.city")}
                    {renderInput("State", "text", "delivery.state")}
                    {renderInput("Pincode", "text", "delivery.pincode")}
                    {renderInput("GSTIN", "text", "delivery.gstin")}
                    {renderInput("Expected Delivery", "date", "delivery.expected_delivery_date")}
                    {renderInput("Full Address", "textarea", "delivery.address")}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Packages</h3>
                  </div>

                  <div className="space-y-6">
                    {form.packages.map((pkg, idx) => (
                      <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative group">
                        <div className="absolute top-4 right-4">
                          {form.packages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleArrayRemove("packages", idx)}
                              className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <h4 className="font-semibold text-slate-700 mb-4">Package {idx + 1}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-slate-700">Type</label>
                            <input value={pkg.package_type} onChange={e => handleArrayUpdate("packages", idx, "package_type", e.target.value)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm" placeholder="Box, Pallet..." />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-slate-700">Quantity</label>
                            <input type="number" value={pkg.quantity} onChange={e => handleArrayUpdate("packages", idx, "quantity", e.target.value)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-slate-700">Weight (kg)</label>
                            <input type="number" value={pkg.actual_weight} onChange={e => handleArrayUpdate("packages", idx, "actual_weight", e.target.value)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-slate-700">L x W x H (cm)</label>
                            <div className="flex gap-2">
                              <input placeholder="L" type="number" value={pkg.length} onChange={e => handleArrayUpdate("packages", idx, "length", e.target.value)} className="w-1/3 rounded-xl border border-slate-300 px-2 py-2 text-sm text-center" />
                              <input placeholder="W" type="number" value={pkg.width} onChange={e => handleArrayUpdate("packages", idx, "width", e.target.value)} className="w-1/3 rounded-xl border border-slate-300 px-2 py-2 text-sm text-center" />
                              <input placeholder="H" type="number" value={pkg.height} onChange={e => handleArrayUpdate("packages", idx, "height", e.target.value)} className="w-1/3 rounded-xl border border-slate-300 px-2 py-2 text-sm text-center" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleArrayAdd("packages", { package_type: "", quantity: 1, length: 0, width: 0, height: 0, actual_weight: 0 })}
                      className="text-orange-600 font-medium hover:text-orange-700 flex items-center gap-2"
                    >
                      + Add Another Package
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Items List</h3>
                  </div>

                  <div className="space-y-6">
                    {form.items.map((item, idx) => (
                      <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative group">
                        <div className="absolute top-4 right-4">
                          {form.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleArrayRemove("items", idx)}
                              className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <h4 className="font-semibold text-slate-700 mb-4">Item {idx + 1}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-slate-700">Item Name</label>
                            <input value={item.item_name} onChange={e => handleArrayUpdate("items", idx, "item_name", e.target.value)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-slate-700">HSN Code</label>
                            <input value={item.hsn_code} onChange={e => handleArrayUpdate("items", idx, "hsn_code", e.target.value)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-slate-700">Quantity</label>
                            <input type="number" value={item.quantity} onChange={e => handleArrayUpdate("items", idx, "quantity", e.target.value)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-slate-700">Unit</label>
                            <input value={item.unit} onChange={e => handleArrayUpdate("items", idx, "unit", e.target.value)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm" placeholder="PCS, KG, etc" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-slate-700">Weight (kg)</label>
                            <input type="number" value={item.weight} onChange={e => handleArrayUpdate("items", idx, "weight", e.target.value)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-slate-700">Total Value (₹)</label>
                            <input type="number" value={item.total_value} onChange={e => handleArrayUpdate("items", idx, "total_value", e.target.value)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm" />
                          </div>
                          <div className="flex flex-col gap-1.5 lg:col-span-3">
                            <label className="text-sm font-medium text-slate-700">Description</label>
                            <input value={item.item_description} onChange={e => handleArrayUpdate("items", idx, "item_description", e.target.value)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm" />
                          </div>
                          <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                            <input
                              type="checkbox"
                              checked={item.fragile}
                              onChange={(e) => handleArrayUpdate("items", idx, "fragile", e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                            />
                            <span className="text-sm font-medium text-slate-700">Fragile Item</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                            <input
                              type="checkbox"
                              checked={item.dangerous_goods}
                              onChange={(e) => handleArrayUpdate("items", idx, "dangerous_goods", e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm font-medium text-slate-700">Dangerous Goods</span>
                          </label>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleArrayAdd("items", { item_name: "", hsn_code: "", quantity: 1, item_description: "", unit: "PCS", weight: 0, total_value: 0, fragile: false, dangerous_goods: false })}
                      className="text-orange-600 font-medium hover:text-orange-700 flex items-center gap-2"
                    >
                      + Add Another Item
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 6 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Charges & Billing</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderInput("Freight Charges", "number", "freight_charge")}
                    {renderInput("Loading Charges", "number", "loading_charge")}
                    {renderInput("Unloading Charges", "number", "unloading_charge")}
                    {renderInput("Fuel Surcharge", "number", "fuel_surcharge")}
                    {renderInput("Insurance", "number", "insurance_charge")}
                    {renderInput("Other Charges", "number", "other_charge")}
                    {renderInput("Discount", "number", "discount_amount")}
                    {renderInput("GST Rate (%)", "number", "tax_amount")}
                  </div>

                  <div className="mt-8 p-6 rounded-3xl bg-orange-50 border border-orange-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1 w-full">
                      <h4 className="text-orange-900 font-medium text-lg">Billing Summary</h4>
                      <p className="text-sm text-orange-700 mt-1 mb-4">Breakdown of applicable charges and taxes.</p>
                      <div className="space-y-2 text-sm text-orange-800">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span className="font-semibold">₹ {calculateSubtotal(form).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax ({form.tax_amount || 0}%):</span>
                          <span className="font-semibold">₹ {calculateTax(form).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-orange-200 text-lg font-bold text-orange-900">
                          <span>Total Amount:</span>
                          <span>₹ {calculateTotal(form).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-[#f18d1c] flex items-center justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Back
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#f18d1c] hover:bg-[#f56502] shadow-sm transition-all active:scale-95"
                >
                  Continue to Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-[#ef8b1c] hover:bg-[#f56502] shadow-md shadow-orange-600/20 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    isCustomer ? "Submit Booking" : "Create Shipment Now"
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
