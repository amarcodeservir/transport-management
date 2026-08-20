import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getFuelLogs, createFuelLog, getVehicles } from "../../services/api.js/fleetService.js";

const initialFuelLog = {
  vehicle_id: "",
  date: "",
  liters: "",
  amount: "",
  odometer: "",
};

export default function FuelLogs() {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialFuelLog);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, vehiclesRes] = await Promise.all([getFuelLogs(), getVehicles()]);
      setLogs(logsRes.data || []);
      setVehicles(vehiclesRes.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Fuel log data load nahi ho paya.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.vehicle_id || !form.date || !form.liters || !form.amount) {
      toast.error("Vehicle, date, liters aur amount required hain.");
      return;
    }

    setSaving(true);
    try {
      const response = await createFuelLog(form);
      toast.success("Fuel log saved");
      setLogs((prev) => [response.data, ...prev]);
      setForm(initialFuelLog);
    } catch (error) {
      toast.error(error.response?.data?.message || "Fuel log create karne mein error aaya.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50/30 p-4 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-white border border-orange-100 p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Fuel Logs</h1>
          <p className="mt-2 text-sm text-slate-500">
            Record fuel fills and track consumption for each vehicle.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Add Fuel Log</h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  Vehicle
                  <select
                    value={form.vehicle_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, vehicle_id: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
                  >
                    <option value="">Select vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicle_number}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  Date
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  Liters
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.liters}
                    onChange={(e) => setForm((prev) => ({ ...prev, liters: e.target.value }))}
                    placeholder="Liters"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  Amount
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.amount}
                    onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="₹"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  Odometer
                  <input
                    type="number"
                    min="0"
                    value={form.odometer}
                    onChange={(e) => setForm((prev) => ({ ...prev, odometer: e.target.value }))}
                    placeholder="km"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 items-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#F7941D] px-6 text-sm font-semibold text-white transition hover:bg-[#d87a03] disabled:cursor-not-allowed disabled:bg-orange-200"
                >
                  {saving ? "Saving..." : "Add Fuel Log"}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Fuel Log History</h2>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Liters</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Odometer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        Loading fuel logs...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        Koi fuel log nahi mila.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4">{log.vehicle_number || log.vehicle_id || "—"}</td>
                        <td className="px-4 py-4">{log.date || "—"}</td>
                        <td className="px-4 py-4">{log.liters}</td>
                        <td className="px-4 py-4">₹{log.amount}</td>
                        <td className="px-4 py-4">{log.odometer || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
