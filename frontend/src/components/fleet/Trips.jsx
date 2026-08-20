import React, { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import toast from "react-hot-toast";
import { getTrips, createTrip, getVehicles, getDrivers } from "../../services/api.js/fleetService.js";

const initialFormState = {
  trip_number: "",
  vehicle_id: "",
  driver_id: "",
  origin: "",
  destination: "",
  start_date: "",
  end_date: "",
  status: "Planned",
  shipment_id: "",
};

export default function Trips() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialFormState);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        getTrips(),
        getVehicles(),
        getDrivers()
      ]);
      setTrips(tripsRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setDrivers(driversRes.data || []);
    } catch (error) {
      toast.error("Failed to load trips data.");
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
    if (!form.trip_number || !form.vehicle_id || !form.driver_id || !form.origin || !form.destination) {
      toast.error("Trip Number, Vehicle, Driver, Origin and Destination are required.");
      return;
    }

    setSaving(true);
    try {
      await createTrip(form);
      toast.success("Trip created successfully!");
      setForm(initialFormState);
      setIsModalOpen(false);
      fetchData(); // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create trip.");
    } finally {
      setSaving(false);
    }
  };

  // Helper to find names
  const getVehicleName = (id) => {
    const v = vehicles.find(v => v.id === parseInt(id));
    return v ? v.vehicle_number : "Unknown";
  };

  const getDriverName = (id) => {
    const d = drivers.find(d => d.id === parseInt(id));
    return d ? d.name : "Unknown";
  };

  return (
    <div className="min-h-screen bg-orange-50/40 p-4 lg:p-8 relative">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Trips</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              Manage and track fleet trips.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="self-start sm:self-auto inline-flex items-center gap-2 rounded-xl bg-[#ef8b1c] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#f66402] hover:text-white transition"
          >
            + Create Trip
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-20 flex justify-center items-center">
              <div className="text-center text-neutral-400 text-sm">Loading trips...</div>
            </div>
          ) : trips.length === 0 ? (
            <div className="p-20 flex justify-center items-center">
              <div className="text-center text-neutral-400 text-sm">No trips found.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-neutral-50 text-neutral-600 font-medium border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4">Trip Number</th>
                    <th className="px-6 py-4">Vehicle</th>
                    <th className="px-6 py-4">Driver</th>
                    <th className="px-6 py-4">Route</th>
                    <th className="px-6 py-4">Dates</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {trips.map((t) => (
                    <tr key={t.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-neutral-900">{t.trip_number}</td>
                      <td className="px-6 py-4 text-neutral-600">{getVehicleName(t.vehicle_id)}</td>
                      <td className="px-6 py-4 text-neutral-600">{getDriverName(t.driver_id)}</td>
                      <td className="px-6 py-4 text-neutral-600">{t.origin} → {t.destination}</td>
                      <td className="px-6 py-4 text-neutral-600">
                        {t.start_date ? new Date(t.start_date).toLocaleDateString() : 'N/A'} -
                        {t.end_date ? new Date(t.end_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${t.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          t.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                          {t.status}
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
              <h2 className="text-lg font-bold text-neutral-800">Create New Trip</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="tripForm" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Trip Number *</label>
                  <input type="text" name="trip_number" value={form.trip_number} onChange={handleChange} placeholder="e.g. TRP-1001" required className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-white">
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Assign Vehicle *</label>
                  <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange} required className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-white">
                    <option value="">Select Vehicle</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.vehicle_number}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Assign Driver *</label>
                  <select name="driver_id" value={form.driver_id} onChange={handleChange} required className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-white">
                    <option value="">Select Driver</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Origin *</label>
                  <input type="text" name="origin" value={form.origin} onChange={handleChange} placeholder="e.g. Mumbai" required className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Destination *</label>
                  <input type="text" name="destination" value={form.destination} onChange={handleChange} placeholder="e.g. Pune" required className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Start Date</label>
                  <input type="date" name="start_date" value={form.start_date} onChange={handleChange} className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Expected End Date</label>
                  <input type="date" name="end_date" value={form.end_date} onChange={handleChange} className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Shipment ID (Optional)</label>
                  <input type="text" name="shipment_id" value={form.shipment_id} onChange={handleChange} placeholder="Link to a shipment ID" className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" />
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
                form="tripForm"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#ef8b1c] hover:bg-[#f66402] shadow transition disabled:opacity-70"
              >
                {saving ? "Saving..." : "Save Trip"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
