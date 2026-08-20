import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { RefreshCw, Search, Truck, UserRound, MapPin, CalendarDays, CheckCircle2 } from "lucide-react";
import { getTrips, updateTrip } from "../services/api.js/fleetService.js";

const ACTIVE_STATUSES = ["Booked", "Planned", "ASSIGNED", "ACCEPTED", "In Progress", "In Transit", "Out for Delivery"];
const statusLabel = (s) => String(s || "").replaceAll("_", " ");
const statusClass = (s) => ["In Transit", "In Progress", "OUT_FOR_DELIVERY", "Out for Delivery"].includes(s) ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200";

export default function ActiveTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [updating, setUpdating] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const result = await getTrips({ active: true }); setTrips(result?.data || []); }
    catch (error) { toast.error(error.response?.data?.message || "Failed to load active trips"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => trips.filter(t => {
    const q = search.toLowerCase().trim();
    const text = [t.trip_number, t.origin, t.destination, t.Vehicle?.vehicle_number, t.Driver?.name, t.Shipment?.shipment_number].join(" ").toLowerCase();
    return (!q || text.includes(q)) && (!status || t.status === status);
  }), [trips, search, status]);

  const changeStatus = async (trip, nextStatus) => {
    setUpdating(trip.id);
    try { await updateTrip(trip.id, { status: nextStatus }); toast.success(`Trip ${statusLabel(nextStatus).toLowerCase()}`); await load(); }
    catch (error) { toast.error(error.response?.data?.message || "Failed to update trip"); }
    finally { setUpdating(null); }
  };

  const counts = { total: trips.length, booked: trips.filter(t => ["Booked", "Planned", "ASSIGNED", "ACCEPTED"].includes(t.status)).length, transit: trips.filter(t => ["In Progress", "In Transit"].includes(t.status)).length, delivery: trips.filter(t => ["Out for Delivery", "OUT_FOR_DELIVERY"].includes(t.status)).length };

  return <div className="min-h-screen bg-slate-50 p-6 lg:p-8"><div className="max-w-7xl mx-auto space-y-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"><div><h1 className="text-2xl font-bold text-slate-800">Active Trips</h1><p className="text-sm text-slate-500 mt-1">Monitor assigned vehicles, drivers and live trip progress.</p></div><button onClick={load} className="self-start inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:text-orange-600"><RefreshCw size={16} /> Refresh</button></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[["All Active", counts.total], ["Booked", counts.booked], ["In Transit", counts.transit], ["Out for Delivery", counts.delivery]].map(([name, value]) => <div key={name} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-2xl font-bold text-slate-800">{value}</p><p className="text-xs uppercase tracking-wider text-slate-500">{name}</p></div>)}</div>
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-3"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search trip, shipment, vehicle, driver or route..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-orange-400" /></div><select value={status} onChange={e => setStatus(e.target.value)} className="rounded-xl border border-slate-200 px-3 text-sm bg-white"><option value="">All active statuses</option>{ACTIVE_STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}</select></div>
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50 border-b border-slate-200"><tr>{["Trip / Shipment","Vehicle","Driver","Route","Start Date","Status","Action"].map(h => <th key={h} className="px-5 py-3.5 text-xs uppercase tracking-wider text-slate-500">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan="7" className="py-16 text-center text-sm text-slate-500">Loading active trips...</td></tr> : filtered.length === 0 ? <tr><td colSpan="7" className="py-16 text-center text-sm text-slate-500">No active trips found.</td></tr> : filtered.map(t => <tr key={t.id} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-semibold text-sm text-slate-800">{t.trip_number}</p><p className="text-xs text-slate-500">{t.Shipment?.shipment_number || (t.shipment_id ? `Shipment #${t.shipment_id}` : "Unlinked trip")}</p></td><td className="px-5 py-4"><p className="text-sm font-medium flex items-center gap-1.5"><Truck size={14} className="text-orange-500" />{t.Vehicle?.vehicle_number || t.vehicle_id}</p></td><td className="px-5 py-4"><p className="text-sm font-medium flex items-center gap-1.5"><UserRound size={14} className="text-blue-500" />{t.Driver?.name || t.driver_id}</p><p className="text-xs text-slate-500">{t.Driver?.mobile || ""}</p></td><td className="px-5 py-4"><p className="text-sm text-slate-700 flex items-center gap-1"><MapPin size={13} className="text-slate-400" />{t.origin} → {t.destination}</p></td><td className="px-5 py-4 text-sm text-slate-600"><span className="flex items-center gap-1"><CalendarDays size={13} />{t.start_date ? new Date(t.start_date).toLocaleDateString("en-IN") : "-"}</span></td><td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${statusClass(t.status)}`}>{statusLabel(t.status)}</span></td><td className="px-5 py-4"><select disabled={updating === t.id} value={t.status} onChange={e => changeStatus(t, e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white"><option value={t.status}>{statusLabel(t.status)}</option>{["In Progress", "In Transit", "Out for Delivery", "Delivered", "Completed", "Cancelled"].filter(s => s !== t.status).map(s => <option key={s} value={s}>{s}</option>)}</select></td></tr>)}</tbody></table></div></div>
  </div></div>;
}