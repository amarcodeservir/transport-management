import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getVehicleDocuments, createVehicleDocument, getVehicles } from "../../services/api.js/fleetService.js";

const initialDoc = {
  vehicle_id: "",
  document_type: "",
  document_number: "",
  expiry_date: "",
  status: "Active",
};

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialDoc);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsRes, vehiclesRes] = await Promise.all([getVehicleDocuments(), getVehicles()]);
      setDocuments(docsRes.data || []);
      setVehicles(vehiclesRes.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Documents load nahi ho paye.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.vehicle_id || !form.document_type || !form.document_number || !form.expiry_date) {
      toast.error("Vehicle, document type, number aur expiry date required hain.");
      return;
    }

    setSaving(true);
    try {
      const response = await createVehicleDocument(form);
      toast.success("Document successfully added");
      setDocuments((prev) => [response.data, ...prev]);
      setForm(initialDoc);
    } catch (error) {
      toast.error(error.response?.data?.message || "Document create karne mein error aaya.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50/30 p-4 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-white border border-orange-100 p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Vehicle Documents</h1>
          <p className="mt-2 text-sm text-slate-500">
            Store and monitor vehicle documents like permits, insurance, and fitness certificates.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Add Document</h2>
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
                  Document Type
                  <input
                    value={form.document_type}
                    onChange={(e) => setForm((prev) => ({ ...prev, document_type: e.target.value }))}
                    placeholder="Permit / Insurance"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  Document Number
                  <input
                    value={form.document_number}
                    onChange={(e) => setForm((prev) => ({ ...prev, document_number: e.target.value }))}
                    placeholder="DOC-2345"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  Expiry Date
                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => setForm((prev) => ({ ...prev, expiry_date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  Status
                  <select
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
                  >
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                  </select>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 items-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#F7941D] px-6 text-sm font-semibold text-white transition hover:bg-[#d87a03] disabled:cursor-not-allowed disabled:bg-orange-200"
                >
                  {saving ? "Saving..." : "Add Document"}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Document List</h2>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Number</th>
                    <th className="px-4 py-3">Expiry</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        Loading documents...
                      </td>
                    </tr>
                  ) : documents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        Koi document record nahi mila.
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4">{doc.vehicle_number || doc.vehicle_id || "—"}</td>
                        <td className="px-4 py-4">{doc.document_type}</td>
                        <td className="px-4 py-4">{doc.document_number}</td>
                        <td className="px-4 py-4">{doc.expiry_date}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {doc.status}
                          </span>
                        </td>
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
