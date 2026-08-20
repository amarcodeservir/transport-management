import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getShipments } from "../services/api.js/shipmentService.js";
import { getVehicles, getDrivers, assignShipment } from "../services/api.js/fleetService.js";
import { X } from "lucide-react";

const STATUS_STYLES = {
  Booked: "bg-orange-50 text-orange-700 border-orange-200",
  "In Transit": "bg-amber-50 text-amber-700 border-amber-200",
  Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
  "Out For Delivery": "bg-neutral-100 text-neutral-800 border-neutral-300",
  "Picked Up": "bg-orange-50 text-orange-700 border-orange-200",
  BOOKED: "bg-orange-50 text-orange-700 border-orange-200",
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  ASSIGNED: "bg-blue-50 text-blue-700 border-blue-200",
  IN_TRANSIT: "bg-amber-50 text-amber-700 border-amber-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const fmtDate = (val) => {
  if (!val) return "—";
  try { return new Date(val).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return val; }
};
const fmtTime = (val) => val || "—";
const fmtNum = (val) => (val !== null && val !== undefined && val !== "") ? val : "—";

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{label}</span>
      <span className="text-sm text-neutral-900 mt-0.5 break-all">{value ?? "—"}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold uppercase tracking-widest text-[#ef8b1c]">{title}</span>
        <div className="flex-1 h-px bg-orange-200" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
        {children}
      </div>
    </div>
  );
}

function ExpandedRow({ s }) {
  return (
    <tr>
      <td colSpan={10} className="px-0 pb-2">
        <div className="mx-4 mb-2 rounded-2xl border border-orange-200 bg-orange-50/40 p-5 shadow-inner text-neutral-800">
          <Section title="Shipment Details">
            <DetailRow label="Shipment Number" value={s.shipment_number} />
            <DetailRow label="Tracking Number" value={s.tracking_number} />
            <DetailRow label="LR Number" value={s.lr_number} />
            <DetailRow label="Order ID" value={s.order_id} />
            <DetailRow label="Ref Number" value={s.ref_number} />
            <DetailRow label="Indent Number" value={s.indent_number} />
            <DetailRow label="Indent Date" value={s.indent_date} />
            <DetailRow label="Booking Date" value={fmtDate(s.booking_date)} />
            <DetailRow label="Shipment Date" value={fmtDate(s.shipment_date)} />
            <DetailRow label="Shipment Type" value={s.shipment_type} />
            <DetailRow label="Service Type" value={s.service_type} />
            <DetailRow label="Mode" value={s.mode} />
            <DetailRow label="Payment Mode" value={s.payment_mode} />
            <DetailRow label="Current Status" value={s.current_status} />
            <DetailRow label="Current Location" value={s.current_location} />
            <DetailRow label="Remarks" value={s.remarks} />
          </Section>

          <Section title="Route">
            <DetailRow label="Origin" value={s.origin} />
            <DetailRow label="Destination" value={s.destination} />
          </Section>

          <Section title="Customer & Organisation">
            <DetailRow label="Customer ID" value={s.customer_id} />
            <DetailRow label="Organisation ID" value={s.organization_id} />
            <DetailRow label="Created By" value={s.created_by} />
          </Section>
        </div>
      </td>
    </tr>
  );
}

// ─── Assign Modal ─────────────────────────────────────────────────────────────
function AssignModal({ shipment, vehicles, drivers, onClose, onAssigned }) {
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!vehicleId || !driverId) {
      toast.error("Vehicle aur Driver dono select karo.");
      return;
    }
    setSaving(true);
    try {
      await assignShipment(shipment.id, { vehicle_id: vehicleId, driver_id: driverId });
      toast.success(`Shipment ${shipment.shipment_number} assigned! Trip create ho gaya.`);
      onAssigned();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Assignment failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-orange-50/40">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Assign Shipment</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {shipment.shipment_number} · {shipment.origin} → {shipment.destination}
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 transition">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleAssign} className="p-6 space-y-4">
          {/* Vehicle */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
              Select Vehicle *
            </label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              required
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none bg-white"
            >
              <option value="">— Select Vehicle —</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_number} ({v.vehicle_type})
                </option>
              ))}
            </select>
          </div>

          {/* Driver */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
              Select Driver *
            </label>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              required
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none bg-white"
            >
              <option value="">— Select Driver —</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} · {d.mobile}
                </option>
              ))}
            </select>
          </div>

          {/* Info box */}
          <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700">
            ✦ Assignment ke baad shipment status <strong>ASSIGNED</strong> ho jayega aur ek <strong>Trip automatically create</strong> ho jayega.
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#ef8b1c] hover:bg-[#f66402] shadow transition disabled:opacity-60"
            >
              {saving ? "Assigning..." : "Assign Shipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AllShipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  // Assign modal state
  const [assignModalShipment, setAssignModalShipment] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const loadShipments = async () => {
    setLoading(true);
    try {
      const res = await getShipments();
      // Backend returns: { shipments: [...], pagination: {...} }
      if (res && Array.isArray(res.shipments)) {
        setShipments(res.shipments);
      } else if (Array.isArray(res)) {
        setShipments(res);
      } else if (res && Array.isArray(res.data)) {
        setShipments(res.data);
      } else {
        setShipments([]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load shipments.");
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  // Load vehicles & drivers once on mount (for assign modal)
  useEffect(() => {
    loadShipments();
    Promise.all([getVehicles(), getDrivers()])
      .then(([vRes, dRes]) => {
        setVehicles(vRes.data || []);
        setDrivers(dRes.data || []);
      })
      .catch(() => {});
  }, []);

  const filtered = shipments.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (s.shipment_number || "").toLowerCase().includes(q) ||
      (s.lr_number || "").toLowerCase().includes(q) ||
      (s.tracking_number || "").toLowerCase().includes(q) ||
      (s.origin || "").toLowerCase().includes(q) ||
      (s.destination || "").toLowerCase().includes(q) ||
      (s.sender_name || "").toLowerCase().includes(q) ||
      (s.receiver_name || "").toLowerCase().includes(q) ||
      String(s.customer_id || "").includes(q);
    const matchesStatus =
      !statusFilter || (s.current_status || "").toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const allStatuses = [...new Set(shipments.map((s) => s.current_status).filter(Boolean))];

  // Statuses that can be assigned
  const canAssign = (status) =>
    !status || ["BOOKED", "PENDING", "booked", "pending"].includes(status);

  return (
    <div className="min-h-screen bg-orange-50/40 p-4 lg:p-8">
      <div className="mx-auto max-w-[1400px] space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">All Shipments</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              {filtered.length} of {shipments.length} shipments — click any row to see full details
            </p>
          </div>
          <button
            onClick={loadShipments}
            className="self-start sm:self-auto inline-flex items-center gap-2 rounded-xl bg-[#ef8b1c] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#f66402] hover:text-white transition"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by AWB, LR, tracking, sender, receiver, origin, destination…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm outline-none focus:border-[#ef8b1c] focus:ring-2 focus:ring-orange-500/30"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 shadow-sm outline-none focus:border-[#ef8b1c] focus:ring-2 focus:ring-orange-500/30"
          >
            <option value="">All Statuses</option>
            {allStatuses.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="bg-orange-50 border-b border-orange-100 text-xs font-semibold uppercase tracking-wider text-[#ef8b1c]">
                  <th className="px-4 py-4 w-8"></th>
                  <th className="px-4 py-4 whitespace-nowrap">AWB / LR</th>
                  <th className="px-4 py-4 whitespace-nowrap">Customer ID</th>
                  <th className="px-4 py-4 whitespace-nowrap">Sender</th>
                  <th className="px-4 py-4 whitespace-nowrap">Receiver</th>
                  <th className="px-4 py-4 whitespace-nowrap">Route</th>
                  <th className="px-4 py-4 whitespace-nowrap">Mode / Type</th>
                  <th className="px-4 py-4 whitespace-nowrap">Status</th>
                  <th className="px-4 py-4 whitespace-nowrap">Booking Date</th>
                  <th className="px-4 py-4 whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-20 text-center text-neutral-400 text-sm">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-[#ef8b1c] border-t-transparent rounded-full animate-spin" />
                        Loading shipments…
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-20 text-center text-neutral-400 text-sm">
                      No shipments found.
                    </td>
                  </tr>
                ) : (
                  filtered.flatMap((s) => {
                    const isExpanded = expandedId === s.id;
                    return [
                      <tr
                        key={s.id}
                        className={`hover:bg-orange-50/60 transition-colors ${isExpanded ? "bg-orange-50" : ""}`}
                      >
                        <td
                          className="px-4 py-4 text-neutral-400 text-lg select-none cursor-pointer"
                          onClick={() => setExpandedId(isExpanded ? null : s.id)}
                        >
                          {isExpanded ? "▾" : "▸"}
                        </td>
                        <td
                          className="px-4 py-4 cursor-pointer"
                          onClick={() => setExpandedId(isExpanded ? null : s.id)}
                        >
                          <div className="font-semibold text-neutral-900 text-sm">{s.shipment_number || "—"}</div>
                          {s.lr_number && <div className="text-xs text-neutral-500 mt-0.5">LR: {s.lr_number}</div>}
                          {s.tracking_number && s.tracking_number !== s.shipment_number && (
                            <div className="text-xs text-neutral-500">TRK: {s.tracking_number}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-neutral-600 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : s.id)}>{s.customer_id || "—"}</td>
                        <td className="px-4 py-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                          <div className="text-sm font-medium text-neutral-900">{s.sender_name || "—"}</div>
                          {s.sender_city && <div className="text-xs text-neutral-400">{s.sender_city}</div>}
                          {s.sender_mobile && <div className="text-xs text-neutral-400">{s.sender_mobile}</div>}
                        </td>
                        <td className="px-4 py-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                          <div className="text-sm font-medium text-neutral-900">{s.receiver_name || "—"}</div>
                          {s.receiver_city && <div className="text-xs text-neutral-400">{s.receiver_city}</div>}
                          {s.receiver_mobile && <div className="text-xs text-neutral-400">{s.receiver_mobile}</div>}
                        </td>
                        <td className="px-4 py-4 text-sm text-neutral-600 whitespace-nowrap cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                          <span className="font-medium text-neutral-900">{s.origin || "—"}</span>
                          <span className="mx-1.5 text-[#ef8b1c]">→</span>
                          <span className="font-medium text-neutral-900">{s.destination || "—"}</span>
                        </td>
                        <td className="px-4 py-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                          <div className="text-sm text-neutral-700">{s.mode || "—"}</div>
                          <div className="text-xs text-neutral-400">{s.service_type || s.shipment_type || "—"}</div>
                        </td>
                        <td className="px-4 py-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${STATUS_STYLES[s.current_status] || "bg-neutral-100 text-neutral-600 border-neutral-200"}`}>
                            {s.current_status || "Unknown"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-neutral-600 whitespace-nowrap cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                          {fmtDate(s.booking_date)}
                        </td>
                        <td className="px-4 py-4">
                          {canAssign(s.current_status) ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); setAssignModalShipment(s); }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm whitespace-nowrap"
                            >
                              Assign →
                            </button>
                          ) : (
                            <span className="text-xs text-neutral-400">—</span>
                          )}
                        </td>
                      </tr>,
                      isExpanded ? <ExpandedRow key={"exp-" + s.id} s={s} /> : null,
                    ].filter(Boolean);
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && filtered.length > 0 && (
            <div className="px-6 py-3 border-t border-neutral-100 text-xs text-neutral-400">
              Showing {filtered.length} shipment{filtered.length !== 1 ? "s" : ""}
              {search || statusFilter ? " (filtered from " + shipments.length + ")" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {assignModalShipment && (
        <AssignModal
          shipment={assignModalShipment}
          vehicles={vehicles}
          drivers={drivers}
          onClose={() => setAssignModalShipment(null)}
          onAssigned={loadShipments}
        />
      )}
    </div>
  );
}