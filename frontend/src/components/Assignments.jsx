import React,{ useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, CheckCircle2, Plus, RefreshCw, RotateCcw, Search, Truck, UserRound, X } from "lucide-react";
import { createAssignment, getAssignments, updateAssignmentStatus } from "../services/api.js/assignmentService.js";
import { approveShipment, getShipments } from "../services/api.js/shipmentService.js";
import { getDrivers, getVehicles } from "../services/api.js/fleetService.js";

const pretty = (value) => String(value || "").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const statusStyle = {
  ASSIGNED: "border-blue-200 bg-blue-50 text-blue-700",
  ACCEPTED: "border-green-200 bg-green-50 text-green-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  RELEASED: "border-slate-200 bg-slate-50 text-slate-600",
};

export default function Assignments() {
  const userRole = useMemo(() => String(JSON.parse(localStorage.getItem("user") || "null")?.role || "").toLowerCase().replace(/[-\s]+/g, "_"), []);
  const isDriver = userRole === "driver";
  const [assignments, setAssignments] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [pendingShipments, setPendingShipments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ shipment_id: "", vehicle_id: "", driver_id: "", remarks: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [decisionId, setDecisionId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    if (isDriver) {
      try {
        const result = await getAssignments(status ? { status } : {});
        setAssignments(result?.data || []);
      } catch (error) {
        setAssignments([]);
        toast.error(error.response?.data?.message || "Assignments load nahi hue.");
      } finally {
        setLoading(false);
      }
      return;
    }

    const results = await Promise.allSettled([
      getAssignments(status ? { status } : {}),
      getShipments({ status: "UNASSIGNED", limit: 500 }),
      getShipments({ status: "PENDING", limit: 500 }),
      getVehicles(),
      getDrivers(),
    ]);
    const [assignmentResult, shipmentResult, pendingShipmentResult, vehicleResult, driverResult] = results;
    if (assignmentResult.status === "fulfilled") setAssignments(assignmentResult.value?.data || []);
    else { setAssignments([]); toast.error("Assignments load nahi hue."); }
    setShipments(shipmentResult.status === "fulfilled" ? shipmentResult.value?.shipments || [] : []);
    setPendingShipments(pendingShipmentResult.status === "fulfilled" ? pendingShipmentResult.value?.shipments || [] : []);
    setVehicles(vehicleResult.status === "fulfilled" ? (vehicleResult.value?.data || []).filter((item) => ["AVAILABLE", "ACTIVE"].includes(String(item.status).toUpperCase())) : []);
    setDrivers(driverResult.status === "fulfilled" ? (driverResult.value?.data || []).filter((item) => item.user_id && ["AVAILABLE", "ACTIVE"].includes(String(item.status).toUpperCase())) : []);
    setLoading(false);
  }, [isDriver, status]);

  useEffect(() => { load(); }, [load]);

  const approveForAssignment = async (shipment) => {
    setApprovingId(shipment.id);
    try {
      await approveShipment(shipment.id);
      setForm((current) => ({ ...current, shipment_id: String(shipment.id) }));
      toast.success(`${shipment.shipment_number} approved. Ab vehicle aur driver select karein.`);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Shipment approve nahi hua.");
    } finally {
      setApprovingId(null);
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return assignments;
    return assignments.filter((assignment) => [assignment.Shipment?.shipment_number, assignment.Vehicle?.vehicle_number, assignment.Driver?.name].some((value) => String(value || "").toLowerCase().includes(query)));
  }, [assignments, search]);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.shipment_id || !form.vehicle_id || !form.driver_id) return toast.error("Shipment, vehicle aur driver required hain.");
    setSaving(true);
    try {
      await createAssignment(form);
      toast.success("Shipment assigned; trip automatically create ho gaya.");
      setForm({ shipment_id: "", vehicle_id: "", driver_id: "", remarks: "" });
      setShowCreate(false);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Assignment failed.");
    } finally {
      setSaving(false);
    }
  };

  const changeAssignment = async (assignment, nextStatus) => {
    setDecisionId(assignment.id);
    try {
      const remarks = isDriver ? `${nextStatus === "ACCEPTED" ? "Accepted" : "Rejected"} by driver` : "Released by organization admin";
      await updateAssignmentStatus(assignment.id, nextStatus, remarks);
      if (nextStatus === "ACCEPTED") toast.success("Assignment accepted. Ab trip start kar sakte hain.");
      else if (nextStatus === "REJECTED") toast.success("Assignment rejected aur fleet release ho gaya.");
      else toast.success("Assignment released; fleet available hai.");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Assignment update nahi hua.");
    } finally {
      setDecisionId(null);
    }
  };

  const driverCards = [
    ["Awaiting Decision", assignments.filter((item) => item.status === "ASSIGNED").length, "border-blue-200 bg-blue-50 text-blue-900"],
    ["Accepted", assignments.filter((item) => item.status === "ACCEPTED").length, "border-green-200 bg-green-50 text-green-900"],
    ["Assignment History", assignments.length, "border-slate-200 bg-white text-slate-900"],
  ];

  return (
    <div className="min-h-full bg-slate-50 p-5 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">Step 3 · Assignment</p><h1 className="mt-1 text-2xl font-bold text-slate-900">{isDriver ? "My Assignments" : "Fleet Assignment"}</h1><p className="mt-1 text-sm text-slate-500">{isDriver ? "Naya assignment accept ya reject karein; accept ke baad Live Tracking me trip start hoga." : "Approved Unassigned shipment ko available vehicle aur driver ke saath link karein."}</p></div>
          <div className="flex gap-2"><button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600"><RefreshCw size={15} /> Refresh</button>{!isDriver && <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16} /> New Assignment</button>}</div>
        </div>

        {isDriver ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">{driverCards.map(([name, value, tone]) => <div key={name} className={`rounded-2xl border p-4 ${tone}`}><p className="text-xs font-bold uppercase">{name}</p><p className="mt-1 text-3xl font-bold">{value}</p></div>)}</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4"><p className="text-xs font-bold uppercase text-green-700">Ready Shipments</p><p className="mt-1 text-3xl font-bold text-green-900">{shipments.length}</p><p className="text-xs text-green-700">Approved and unassigned</p></div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-bold uppercase text-amber-700">Pending Approval</p><p className="mt-1 text-3xl font-bold text-amber-900">{pendingShipments.length}</p><p className="text-xs text-amber-700">Approve before assignment</p></div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4"><p className="text-xs font-bold uppercase text-blue-700">Available Vehicles</p><p className="mt-1 text-3xl font-bold text-blue-900">{vehicles.length}</p></div>
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4"><p className="text-xs font-bold uppercase text-orange-700">Available Drivers</p><p className="mt-1 text-3xl font-bold text-orange-900">{drivers.length}</p></div>
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shipment, vehicle or driver..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-400" /></div><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">All assignment statuses</option>{["ASSIGNED", "ACCEPTED", "REJECTED", "RELEASED"].map((item) => <option key={item} value={item}>{pretty(item)}</option>)}</select></div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50"><tr>{["Shipment", "Vehicle", "Driver", "Assigned At", "Status", "Action"].map((heading) => <th key={heading} className="px-5 py-3.5 text-xs uppercase tracking-wider text-slate-500">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? <tr><td colSpan="6" className="py-16 text-center text-sm text-slate-500">Loading assignments...</td></tr> : !filtered.length ? <tr><td colSpan="6" className="py-16 text-center text-sm text-slate-500">No assignments found.</td></tr> : filtered.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4"><p className="font-semibold text-slate-800">{assignment.Shipment?.shipment_number || `#${assignment.shipment_id}`}</p><p className="text-xs text-slate-500">{assignment.Shipment?.origin || "-"} → {assignment.Shipment?.destination || "-"}</p></td>
                    <td className="px-5 py-4"><p className="flex items-center gap-1.5 text-sm font-medium"><Truck size={14} className="text-orange-500" />{assignment.Vehicle?.vehicle_number || assignment.vehicle_id}</p><p className="text-xs text-slate-500">{assignment.Vehicle?.vehicle_type}</p></td>
                    <td className="px-5 py-4"><p className="flex items-center gap-1.5 text-sm font-medium"><UserRound size={14} className="text-blue-500" />{assignment.Driver?.name || assignment.driver_id}</p><p className="text-xs text-slate-500">{assignment.Driver?.mobile}</p></td>
                    <td className="px-5 py-4 text-xs text-slate-500">{assignment.assigned_at ? new Date(assignment.assigned_at).toLocaleString("en-IN") : "-"}</td>
                    <td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle[assignment.status] || statusStyle.ASSIGNED}`}>Assignment: {pretty(assignment.status)}</span><p className="mt-2 text-[11px] font-semibold text-slate-500">Shipment: {pretty(assignment.Shipment?.current_status || "PENDING")}</p></td>
                    <td className="px-5 py-4">
                      {isDriver && assignment.status === "ASSIGNED" ? <div className="flex gap-2"><button disabled={decisionId === assignment.id} onClick={() => changeAssignment(assignment, "ACCEPTED")} className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-50">Accept</button><button disabled={decisionId === assignment.id} onClick={() => changeAssignment(assignment, "REJECTED")} className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-50">Reject</button></div> : !isDriver && ["ASSIGNED", "ACCEPTED"].includes(assignment.status) ? <button disabled={decisionId === assignment.id} onClick={() => changeAssignment(assignment, "RELEASED")} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"><RotateCcw size={14} /> Release</button> : <span className="text-xs text-slate-400">{isDriver && assignment.status === "ACCEPTED" ? "Ready for trip" : "No action"}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showCreate && !isDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={submit} className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-orange-500">Assign Resources</p><h2 className="text-xl font-bold text-slate-800">Create Trip Assignment</h2></div><button type="button" onClick={() => setShowCreate(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div>
            {pendingShipments.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="flex gap-2 text-sm text-amber-800"><AlertTriangle size={18} className="shrink-0" /><span>Shipment bana hua hai, lekin approval pending hai. Yahin se approve karein:</span></div>
                <div className="mt-3 max-h-36 space-y-2 overflow-y-auto">
                  {pendingShipments.map((shipment) => (
                    <div key={shipment.id} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-amber-200">
                      <span className="min-w-0 truncate text-sm font-semibold text-slate-700">{shipment.shipment_number} · {shipment.origin || "-"} → {shipment.destination || "-"}</span>
                      <button type="button" disabled={approvingId === shipment.id} onClick={() => approveForAssignment(shipment)} className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                        {approvingId === shipment.id ? "Approving..." : "Approve & Select"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!shipments.length && !pendingShipments.length && <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700"><AlertTriangle size={18} className="shrink-0" /><span>Pehle ek shipment create karein.</span></div>}
            {(!vehicles.length || !drivers.length) && <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700"><AlertTriangle size={18} className="shrink-0" /><span>Assignment ke liye available vehicle aur linked-login wala available driver required hai.</span></div>}
            <select required value={form.shipment_id} onChange={(event) => setForm({ ...form, shipment_id: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"><option value="">Select approved shipment</option>{shipments.map((shipment) => <option key={shipment.id} value={shipment.id}>{shipment.shipment_number} · {shipment.origin || "-"} → {shipment.destination || "-"}</option>)}</select>
            <select required value={form.vehicle_id} onChange={(event) => setForm({ ...form, vehicle_id: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"><option value="">Select available vehicle</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.vehicle_number} · {vehicle.vehicle_type}</option>)}</select>
            <select required value={form.driver_id} onChange={(event) => setForm({ ...form, driver_id: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"><option value="">Select available driver</option>{drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name} · {driver.mobile}</option>)}</select>
            <textarea value={form.remarks} onChange={(event) => setForm({ ...form, remarks: event.target.value })} placeholder="Assignment remarks" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" />
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2.5 text-sm text-slate-600">Cancel</button><button disabled={saving || !shipments.length || !vehicles.length || !drivers.length} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}{saving ? "Assigning..." : "Assign & Create Trip"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
