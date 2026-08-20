import React,{ useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, Info, LocateFixed, MapPin, Navigation, RefreshCw, Search, Truck, X } from "lucide-react";
import toast from "react-hot-toast";
import { getLiveTracking, updateLiveLocation } from "../services/api.js/liveTrackingService";
const label = (status) => String(status || "").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const normalizeStatus = (status) => String(status || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
const nextStatuses = (status) => {
  const transitions = {
    ASSIGNED: ["IN_TRANSIT"],
    IN_TRANSIT: ["OUT_FOR_DELIVERY"],
    OUT_FOR_DELIVERY: ["DELIVERED"],
  };
  return transitions[normalizeStatus(status)] || [];
};

const GPS_OPTIONS = { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 };
const LIVE_UPDATE_INTERVAL_MS = 30000;
const coordinatesFromPosition = (position) => ({
  latitude: position.coords.latitude.toFixed(6),
  longitude: position.coords.longitude.toFixed(6),
  speed: Number.isFinite(position.coords.speed) ? Number((position.coords.speed * 3.6).toFixed(2)) : null,
  accuracy: Number.isFinite(position.coords.accuracy) ? Number(position.coords.accuracy.toFixed(2)) : null,
  heading: Number.isFinite(position.coords.heading) ? Number(position.coords.heading.toFixed(2)) : null,
});
const gpsErrorMessage = (error) => {
  if (!window.isSecureContext) return "GPS ke liye app HTTPS ya localhost par open karein.";
  if (error?.code === 1) return "Location permission blocked hai. Browser settings se Allow karein.";
  if (error?.code === 2) return "Device abhi location determine nahi kar pa raha.";
  if (error?.code === 3) return "GPS request timeout ho gayi. Dobara try karein.";
  return "Device location fetch nahi hui.";
};

export default function LiveTracking() {
  const userRole = useMemo(() => String(JSON.parse(localStorage.getItem("user") || "null")?.role || "").toLowerCase().replace(/[-\s]+/g, "_"), []);
  const isDriver = userRole === "driver";
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [liveShipmentId, setLiveShipmentId] = useState(null);
  const [lastGpsUpdate, setLastGpsUpdate] = useState(null);
  const [gpsMessage, setGpsMessage] = useState("");
  const [form, setForm] = useState({ latitude: "", longitude: "", speed: null, accuracy: null, heading: null, location: "", remarks: "", status: "IN_TRANSIT" });
  const watchIdRef = useRef(null);
  const livePushRef = useRef({ lastSentAt: 0, sending: false });

  const load = useCallback(async () => {
    try {
      const response = await getLiveTracking();
      setRows(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Live tracking load nahi ho saka.");
    } finally {
      setLoading(false);
    }
  }, []);

  const stopLiveGps = useCallback((showToast = true) => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    livePushRef.current = { lastSentAt: 0, sending: false };
    setLiveShipmentId(null);
    setGpsMessage("");
    if (showToast) toast.success("Live GPS sharing stop ho gayi.");
  }, []);

  const pushLivePosition = useCallback(async (row, position, force = false) => {
    const now = Date.now();
    if (livePushRef.current.sending || (!force && now - livePushRef.current.lastSentAt < LIVE_UPDATE_INTERVAL_MS)) return;

    const coordinates = coordinatesFromPosition(position);
    setGpsAccuracy(coordinates.accuracy);
    setGpsMessage("GPS mil gaya, server par update bhej rahe hain...");
    livePushRef.current.sending = true;
    try {
      await updateLiveLocation(row.shipment_id, {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        speed: coordinates.speed,
        accuracy: coordinates.accuracy,
        heading: coordinates.heading,
        location: `GPS: ${coordinates.latitude}, ${coordinates.longitude}`,
        remarks: `Automatic driver GPS update (accuracy ±${coordinates.accuracy}m)`,
      });
      livePushRef.current.lastSentAt = Date.now();
      setLastGpsUpdate(new Date());
      setGpsMessage(`Live GPS active · accuracy ±${coordinates.accuracy}m`);
      if (force) toast.success("Live GPS sharing start ho gayi.");
      await load();
    } catch (error) {
      const message = error.response?.data?.message || "GPS server par update nahi hua.";
      setGpsMessage(message);
      if (force) toast.error(message);
    } finally {
      livePushRef.current.sending = false;
    }
  }, [load]);

  const startLiveGps = useCallback((row) => {
    if (!isDriver) return;
    if (!navigator.geolocation) return toast.error("Is device/browser me GPS available nahi hai.");
    if (!window.isSecureContext) return toast.error("GPS ke liye app HTTPS ya localhost par open karein.");
    if (liveShipmentId === row.shipment_id) return stopLiveGps();

    stopLiveGps(false);
    setLiveShipmentId(row.shipment_id);
    setGpsMessage("Location permission ka wait ho raha hai...");
    let firstPosition = true;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        void pushLivePosition(row, position, firstPosition);
        firstPosition = false;
      },
      (error) => {
        const message = gpsErrorMessage(error);
        stopLiveGps(false);
        setGpsMessage(message);
        toast.error(message);
      },
      GPS_OPTIONS,
    );
  }, [isDriver, liveShipmentId, pushLivePosition, stopLiveGps]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => () => {
    if (watchIdRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  const visible = useMemo(() => rows.filter((row) => {
    const text = `${row.shipment_number} ${row.tracking_number || ""} ${row.vehicle_number || ""} ${row.driver_name || ""} ${row.location || ""}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (filter === "ALL" || row.current_status === filter);
  }), [rows, query, filter]);

  const open = (row) => {
    setSelected(row);
    setForm({
      latitude: row.latitude ?? "",
      longitude: row.longitude ?? "",
      speed: row.speed ?? null,
      accuracy: row.accuracy ?? null,
      heading: row.heading ?? null,
      location: row.location || "",
      remarks: "",
      status: "",
    });
    setGpsAccuracy(null);
  };

  const useDeviceLocation = () => {
    if (!navigator.geolocation) return toast.error("Is device/browser me GPS available nahi hai.");
    if (!window.isSecureContext) return toast.error("GPS ke liye app HTTPS ya localhost par open karein.");
    setLocating(true);
    setGpsMessage("Current GPS location fetch ho rahi hai...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = coordinatesFromPosition(position);
        setForm((previous) => ({ ...previous, latitude: coordinates.latitude, longitude: coordinates.longitude, speed: coordinates.speed, accuracy: coordinates.accuracy, heading: coordinates.heading, location: `GPS: ${coordinates.latitude}, ${coordinates.longitude}` }));
        setGpsAccuracy(coordinates.accuracy);
        setGpsMessage(`Current GPS mil gaya · accuracy ±${coordinates.accuracy}m`);
        setLocating(false);
      },
      (error) => {
        const message = gpsErrorMessage(error);
        setGpsMessage(message);
        setLocating(false);
        toast.error(message);
      },
      GPS_OPTIONS,
    );
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateLiveLocation(selected.shipment_id, form);
      const messages = { IN_TRANSIT: "Trip In Transit ho gaya.", OUT_FOR_DELIVERY: "Shipment Out for Delivery ho gaya.", DELIVERED: "Shipment Delivered ho gaya. Ab POD upload karein." };
      toast.success(messages[form.status] || "Live location update ho gayi.");
      setSelected(null);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Location update nahi hui.");
    } finally {
      setSaving(false);
    }
  };

  const cards = [
    { name: "Active Assignments", value: rows.length, icon: Activity, tone: "bg-orange-50 text-orange-600" },
    { name: "Assigned", value: rows.filter((row) => row.current_status === "ASSIGNED").length, icon: MapPin, tone: "bg-blue-50 text-blue-600" },
    { name: "In Transit", value: rows.filter((row) => row.current_status === "IN_TRANSIT").length, icon: Truck, tone: "bg-violet-50 text-violet-600" },
    { name: "Out for Delivery", value: rows.filter((row) => row.current_status === "OUT_FOR_DELIVERY").length, icon: Navigation, tone: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <div className="min-h-full space-y-6 bg-slate-50/60 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-500">Step 4 · Trip Execution</p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">Live Tracking</h1>
          <p className="mt-1 text-sm text-slate-500">Driver Live GPS every 30 seconds · Viewer auto-refresh every 10 seconds</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 self-start rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-200 transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-100"><RefreshCw size={15} /> Refresh</button>
      </div>

      <div className="flex items-start gap-3 rounded-2xl bg-blue-50/80 px-4 py-3.5 text-sm leading-6 text-blue-800">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600"><Info size={15} /></span>
        <p>Driver ko shipment ke saamne <span className="font-semibold">Start Live GPS</span> click karke browser location permission Allow karni hai. Page/tab open rehne tak coordinates every 30 seconds update honge.</p>
      </div>

      {isDriver && (
        <div className={`flex flex-col gap-3 rounded-2xl border px-4 py-3.5 text-sm sm:flex-row sm:items-center sm:justify-between ${liveShipmentId ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600"}`}>
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${liveShipmentId ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}><LocateFixed size={17} /></span>
            <div><p className="font-semibold">{liveShipmentId ? `Live GPS ON · Shipment #${rows.find((row) => row.shipment_id === liveShipmentId)?.shipment_number || liveShipmentId}` : "Live GPS OFF"}</p><p className="mt-0.5 text-xs">{gpsMessage || "Start karne par phone/browser ki actual latitude-longitude save hogi."}{lastGpsUpdate ? ` · Last sent ${lastGpsUpdate.toLocaleTimeString("en-IN")}` : ""}</p></div>
          </div>
          {liveShipmentId && <button type="button" onClick={() => stopLiveGps()} className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-700">Stop GPS</button>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-md" key={card.name}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold tracking-tight text-slate-900">{card.value}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{card.name}</div>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.tone}`}><Icon size={19} /></span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/60 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-50" placeholder="Search shipment, vehicle or driver..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <select className="min-w-44 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-50" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="ALL">All active</option><option value="ASSIGNED">Assigned</option><option value="IN_TRANSIT">In Transit</option><option value="OUT_FOR_DELIVERY">Out for Delivery</option></select>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80">
              <tr>{["Shipment / Trip", "Vehicle", "Driver", "Latest Location", "Coordinates", "Status", "Action"].map((heading) => <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500" key={heading}>{heading}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="7" className="px-5 py-16 text-center"><span className="inline-flex items-center gap-2 text-sm font-medium text-slate-500"><RefreshCw className="animate-spin text-orange-500" size={17} /> Loading live shipments...</span></td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan="7" className="px-5 py-14"><div className="mx-auto flex max-w-md flex-col items-center text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500"><MapPin size={25} /></span><h3 className="mt-4 text-base font-semibold text-slate-800">No active shipments found</h3><p className="mt-1.5 text-sm leading-6 text-slate-500">Assigned shipment active hote hi uski live location aur delivery status yahan dikhai dega.</p></div></td></tr>
              ) : visible.map((row) => (
                <tr className="text-slate-700 transition hover:bg-slate-50/70" key={row.shipment_id}>
                  <td className="px-5 py-4"><div className="font-semibold text-slate-900">{row.shipment_number}</div><div className="mt-0.5 text-xs text-slate-500">{row.trip_number || "No trip"}</div></td>
                  <td className="px-5 py-4">{row.vehicle_number || "Unassigned"}</td>
                  <td className="px-5 py-4">{row.driver_name || "Unassigned"}</td>
                  <td className="px-5 py-4"><div>{row.location || "Location pending"}</div><div className="mt-0.5 text-xs text-slate-400">{row.tracking_date ? new Date(row.tracking_date).toLocaleString("en-IN") : "No update"}</div></td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-500">{row.latitude != null && row.longitude != null ? <div><div>{row.latitude}, {row.longitude}</div><div className="mt-1 text-xs text-slate-400">{row.speed != null ? `${row.speed} km/h` : "Speed N/A"} · {row.accuracy != null ? `±${row.accuracy}m` : "Accuracy N/A"}{row.heading != null ? ` · ${row.heading}°` : ""}</div><a className="mt-1 inline-block text-xs font-semibold text-blue-600 hover:underline" href={`https://www.google.com/maps/search/?api=1&query=${row.latitude},${row.longitude}`} target="_blank" rel="noreferrer">Open in map</a></div> : "Not available"}</td>
                  <td className="px-5 py-4"><span className="inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">{label(row.current_status)}</span></td>
                  <td className="px-5 py-4"><div className="flex items-center gap-1.5">{isDriver && <button className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${liveShipmentId === row.shipment_id ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`} onClick={() => startLiveGps(row)}><LocateFixed size={14} /> {liveShipmentId === row.shipment_id ? "Stop GPS" : "Start Live GPS"}</button>}<button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50" onClick={() => open(row)}><Navigation size={14} /> Update</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form onSubmit={save} className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-orange-500">Location Update</p><h2 className="text-xl font-semibold">{selected.shipment_number}</h2></div><button type="button" onClick={() => setSelected(null)}><X size={20} /></button></div>
            <button type="button" disabled={locating} onClick={useDeviceLocation} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 disabled:opacity-50">{locating ? <RefreshCw size={16} className="animate-spin" /> : <LocateFixed size={16} />} {locating ? "Fetching Current GPS..." : "Use Current Device GPS"}</button>
            {gpsMessage && <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">{gpsMessage}{gpsAccuracy != null ? ` · Accuracy ±${gpsAccuracy}m` : ""}</div>}
            <p className="text-xs leading-5 text-slate-500">Latitude/Longitude phone GPS ke coordinates hain. Browser address nahi deta; Location/Landmark manually edit kar sakte hain.</p>
            <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium text-slate-700">Latitude *<input required type="number" step="any" className="mt-1 w-full rounded-lg border px-3 py-2" value={form.latitude} onChange={(event) => setForm((previous) => ({ ...previous, latitude: event.target.value }))} /></label><label className="text-sm font-medium text-slate-700">Longitude *<input required type="number" step="any" className="mt-1 w-full rounded-lg border px-3 py-2" value={form.longitude} onChange={(event) => setForm((previous) => ({ ...previous, longitude: event.target.value }))} /></label></div>
            <label className="block text-sm font-medium text-slate-700">Location / Landmark (optional)<div className="relative mt-1"><MapPin className="absolute left-3 top-2.5 text-slate-400" size={16} /><input className="w-full rounded-lg border py-2 pl-9 pr-3" placeholder="Current city / checkpoint" value={form.location} onChange={(event) => setForm((previous) => ({ ...previous, location: event.target.value }))} /></div></label>
            <label className="block text-sm font-medium text-slate-700">Delivery Status (optional)<select className="mt-1 w-full rounded-lg border bg-white px-3 py-2" value={form.status} onChange={(event) => setForm((previous) => ({ ...previous, status: event.target.value }))}><option value="">Keep {label(selected.current_status)} · location only</option>{nextStatuses(selected.current_status).map((status) => <option key={status} value={status}>Move to {label(status)}</option>)}</select></label>
            <label className="block text-sm font-medium text-slate-700">Remarks<input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.remarks} onChange={(event) => setForm((previous) => ({ ...previous, remarks: event.target.value }))} /></label>
            <div className="flex justify-end gap-3"><button type="button" onClick={() => setSelected(null)} className="rounded-lg px-4 py-2 text-sm">Cancel</button><button disabled={saving} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save Update"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
