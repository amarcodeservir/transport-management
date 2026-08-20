import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { getMaintenanceRecords, createMaintenanceRecord, getVehicles } from "../../services/api.js/fleetService.js";

const initialFormState = {
  vehicle_id: "",
  service_date: "",
  service_type: "",
  cost: "",
  next_service: "",
  notes: "",
};

export default function Maintenance() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialFormState);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [maintenanceRes, vehiclesRes] = await Promise.all([
        getMaintenanceRecords(),
        getVehicles()
      ]);
      setRecords(maintenanceRes.data || []);
      setVehicles(vehiclesRes.data || []);
    } catch (error) {
      toast.error("Failed to load maintenance records.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicle_id || !form.service_date || !form.service_type) {
      toast.error("Vehicle, Service Date and Service Type are required.");
      return;
    }

    setSaving(true);
    try {
      await createMaintenanceRecord(form);
      toast.success("Maintenance record created successfully!");
      setForm(initialFormState);
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create maintenance record.");
    } finally {
      setSaving(false);
    }
  };

  const getVehicleName = (id) => {
    const v = vehicles.find(v => v.id === parseInt(id));
    return v ? v.vehicle_number : "Unknown";
  };

  return (
    <div className="min-h-screen bg-orange-50/40 p-4 lg:p-8 relative">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Maintenance</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              Log and track vehicle maintenance.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="self-start sm:self-auto inline-flex items-center gap-2 rounded-xl bg-[#ef8b1c] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#f66402] transition"
          >
            + Add Maintenance Log
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-20 flex justify-center items-center">
              <div className="text-center text-neutral-400 text-sm">Loading records...</div>
            </div>
          ) : records.length === 0 ? (
            <div className="p-20 flex justify-center items-center">
              <div className="text-center text-neutral-400 text-sm">No maintenance logs found.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-neutral-50 text-neutral-600 font-medium border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4">Vehicle</th>
                    <th className="px-6 py-4">Service Date</th>
                    <th className="px-6 py-4">Service Type</th>
                    <th className="px-6 py-4">Cost (₹)</th>
                    <th className="px-6 py-4">Next Service</th>
                    <th className="px-6 py-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-neutral-900">{getVehicleName(r.vehicle_id)}</td>
                      <td className="px-6 py-4 text-neutral-600">{r.service_date ? new Date(r.service_date).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-6 py-4 text-neutral-600 capitalize">{r.service_type}</td>
                      <td className="px-6 py-4 text-neutral-600">₹{r.cost}</td>
                      <td className="px-6 py-4 text-neutral-600">{r.next_service ? new Date(r.next_service).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-6 py-4 text-neutral-600 max-w-[200px] truncate">{r.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 pt-20">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-orange-50/30">
              <h2 className="text-lg font-bold text-neutral-800">Add Maintenance Log</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="maintenanceForm" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Vehicle *</label>
                  <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange} required className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-white">
                    <option value="">Select Vehicle</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.vehicle_number}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Service Type *</label>
                  <select name="service_type" value={form.service_type} onChange={handleChange} required className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-white">
                    <option value="">Select Type</option>
                    <option value="Routine Service">Routine Service</option>
                    <option value="Repair">Repair</option>
                    <option value="Part Replacement">Part Replacement</option>
                    <option value="Tyre Change">Tyre Change</option>
                    <option value="Oil Change">Oil Change</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Service Date *</label>
                  <input type="date" name="service_date" value={form.service_date} onChange={handleChange} required className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Next Service Date</label>
                  <input type="date" name="next_service" value={form.next_service} onChange={handleChange} className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Cost (₹)</label>
                  <input type="number" name="cost" value={form.cost} onChange={handleChange} placeholder="e.g. 5000" className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Notes</label>
                  <textarea name="notes" value={form.notes} onChange={handleChange} rows="3" placeholder="Details about the maintenance..." className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-none"></textarea>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-neutral-100 flex justify-end gap-3 bg-neutral-50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="maintenanceForm"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#ef8b1c] hover:bg-[#f66402] shadow transition disabled:opacity-70"
              >
                {saving ? "Saving..." : "Save Log"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
