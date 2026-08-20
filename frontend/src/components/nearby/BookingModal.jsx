/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { createTransportBooking } from "../../services/api.js/nearbyTransportService.js";

export default function BookingModal({ provider, pickupLocation, onClose }) {
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "null"), []);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    pickup_location: pickupLocation || "", drop_location: "", vehicle_type: provider.vehicleTypes?.[0] || "",
    goods_type: "", approximate_weight: "", pickup_date: "", pickup_time: "",
    customer_name: user?.name || "", phone: user?.phone || "",
  });
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await createTransportBooking({ ...form, transporter_id: provider._id, approximate_weight: Number(form.approximate_weight) });
      toast.success("Transport request submitted"); onClose();
    } catch (error) { toast.error(error.response?.data?.message || "Could not submit booking"); }
    finally { setSaving(false); }
  };
  return <div className="near-modal-backdrop" role="dialog" aria-modal="true">
    <form onSubmit={submit} className="near-modal">
      <div className="flex items-start justify-between border-b border-slate-100 p-5"><div><p className="text-xs font-bold uppercase tracking-wider text-orange-500">Book this transport</p><h2 className="mt-1 text-xl font-bold text-slate-900">{provider.companyName}</h2></div><button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X size={20} /></button></div>
      <div className="grid max-h-[68vh] grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
        {[["pickup_location","Pickup Location"],["drop_location","Drop Location"],["goods_type","Goods Type"],["approximate_weight","Approximate Weight (kg)"],["pickup_date","Pickup Date"],["pickup_time","Pickup Time"],["customer_name","Customer Name"],["phone","Phone Number"]].map(([name,label]) => <label key={name} className={name.includes("location") ? "sm:col-span-2" : ""}><span className="near-label">{label}</span><input required min={name === "approximate_weight" ? "1" : undefined} type={name === "pickup_date" ? "date" : name === "pickup_time" ? "time" : name === "approximate_weight" ? "number" : "text"} name={name} value={form[name]} onChange={update} className="near-input" /></label>)}
        <label><span className="near-label">Vehicle Type</span><select required name="vehicle_type" value={form.vehicle_type} onChange={update} className="near-input"><option value="">Select vehicle</option>{provider.vehicleTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
      </div>
      <div className="flex justify-end gap-3 border-t border-slate-100 p-5"><button type="button" onClick={onClose} className="near-btn-secondary">Cancel</button><button disabled={saving} className="near-btn-primary">{saving ? "Submitting…" : "Submit Request"}</button></div>
    </form>
  </div>;
}
