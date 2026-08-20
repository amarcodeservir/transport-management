import React, { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import toast from "react-hot-toast";
import { getVehicles, createVehicle } from "../../services/api.js/fleetService.js";

const initialFormState = {
  vehicle_number: "",
  vehicle_type: "",
  brand: "",
  model: "",
  capacity: "",
  fuel_type: "",
  insurance_expiry: "",
  fitness_expiry: "",
  permit_expiry: "",
  status: "Active",
};

export default function Vehicles() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialFormState);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const response = await getVehicles();
      setVehicles(response.data || []);
    } catch (error) {
      toast.error("Failed to load vehicles.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicle_number || !form.vehicle_type) {
      toast.error("Vehicle Number and Type are required.");
      return;
    }

    setSaving(true);
    try {
      await createVehicle(form);
      toast.success("Vehicle created successfully!");
      setForm(initialFormState);
      setIsModalOpen(false);
      fetchVehicles();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create vehicle.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50/40 p-4 lg:p-8 relative">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Vehicles</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              Manage your fleet vehicles.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="self-start sm:self-auto inline-flex items-center gap-2 rounded-xl bg-[#ef8b1c] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#f66402] hover:text-white transition"
          >
            + Add Vehicle
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-20 flex justify-center items-center">
              <div className="text-center text-neutral-400 text-sm">Loading vehicles...</div>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="p-20 flex justify-center items-center">
              <div className="text-center text-neutral-400 text-sm">No vehicles found.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-neutral-50 text-neutral-600 font-medium border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4">Vehicle Number</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Brand/Model</th>
                    <th className="px-6 py-4">Capacity</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-neutral-900">{v.vehicle_number}</td>
                      <td className="px-6 py-4 text-neutral-600 capitalize">{v.vehicle_type}</td>
                      <td className="px-6 py-4 text-neutral-600">{v.brand} {v.model}</td>
                      <td className="px-6 py-4 text-neutral-600">{v.capacity} Tons</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${v.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                          {v.status}
                        </span>
                      </td>
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
              <h2 className="text-lg font-bold text-neutral-800">Add New Vehicle</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="vehicleForm" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Vehicle Number *</label>
                  <input type="text" name="vehicle_number" value={form.vehicle_number} onChange={handleChange} placeholder="e.g. MH 12 AB 1234" required className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Vehicle Type *</label>
                  <select name="vehicle_type" value={form.vehicle_type} onChange={handleChange} required className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-white">
                    <option value="">Select Type</option>
                    <option value="truck">Truck</option>
                    <option value="van">Van</option>
                    <option value="trailer">Trailer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Brand</label>
                  <input type="text" name="brand" value={form.brand} onChange={handleChange} placeholder="e.g. Tata" className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Model</label>
                  <input type="text" name="model" value={form.model} onChange={handleChange} placeholder="e.g. Signa" className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Capacity (Tons)</label>
                  <input type="number" name="capacity" value={form.capacity} onChange={handleChange} placeholder="e.g. 10" className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Fuel Type</label>
                  <select name="fuel_type" value={form.fuel_type} onChange={handleChange} className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-white">
                    <option value="">Select Fuel</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Petrol</option>
                    <option value="CNG">CNG</option>
                    <option value="EV">EV</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Insurance Expiry</label>
                  <input type="date" name="insurance_expiry" value={form.insurance_expiry} onChange={handleChange} className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Fitness Expiry</label>
                  <input type="date" name="fitness_expiry" value={form.fitness_expiry} onChange={handleChange} className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Permit Expiry</label>
                  <input type="date" name="permit_expiry" value={form.permit_expiry} onChange={handleChange} className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-white">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
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
                form="vehicleForm"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#ef8b1c] hover:bg-[#f66402] shadow transition disabled:opacity-70"
              >
                {saving ? "Saving..." : "Save Vehicle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
