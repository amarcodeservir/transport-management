import React,{ useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, ExternalLink, FileCheck2, Info, Navigation, RefreshCw, Search, Truck, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import { getDeliveries, getPodFile, submitPod, updateDeliveryStatus } from "../services/api.js/podService";
const pretty = (status) => String(status || "").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const podFilePrefix = "/api/pod/files/";
const getPodFilename = (value) => {
  const reference = String(value || "");
  if (!reference.startsWith(podFilePrefix)) return null;
  try {
    return decodeURIComponent(reference.slice(podFilePrefix.length));
  } catch {
    return null;
  }
};
const isValidExternalPodUrl = (value) => {
  try {
    const parsed = new URL(String(value || "").trim());
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};
const isViewablePod = (value) => Boolean(getPodFilename(value) || isValidExternalPodUrl(value));
const allowedPodTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const statusTone = {
  OUT_FOR_DELIVERY: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-blue-100 text-blue-700",
  POD_UPLOADED: "bg-teal-100 text-teal-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

export default function PodDeliveries() {
  const navigate = useNavigate();
  const role = useMemo(() => String(JSON.parse(localStorage.getItem("user") || "null")?.role || "").toLowerCase().replace(/[-\s]+/g, "_"), []);
  const isDriver = role === "driver";
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ pod_file: null, remarks: "" });
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [viewingId, setViewingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getDeliveries();
      setRows(result.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Deliveries load nahi hui.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => rows.filter((row) => {
    const text = `${row.shipment_number} ${row.tracking_number || ""} ${row.vehicle_number || ""} ${row.driver_name || ""} ${row.destination || ""}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (filter === "ALL" || row.current_status === filter);
  }), [rows, query, filter]);

  const openPod = (row) => {
    setSelected(row);
    setForm({ pod_file: null, remarks: "" });
  };

  const savePod = async (event) => {
    event.preventDefault();
    if (!form.pod_file) return toast.error("POD photo ya PDF select karein.");
    if (!allowedPodTypes.includes(form.pod_file.type)) return toast.error("Sirf PDF, JPG, PNG ya WEBP file upload karein.");
    if (form.pod_file.size > 10 * 1024 * 1024) return toast.error("POD file 10 MB ya usse chhoti honi chahiye.");
    setActionId(selected.shipment_id);
    try {
      await submitPod(selected.shipment_id, form);
      toast.success("POD upload ho gaya. Ab shipment complete ki ja sakti hai.");
      setSelected(null);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "POD submit nahi hua.");
    } finally {
      setActionId(null);
    }
  };

  const viewPod = async (row) => {
    if (isValidExternalPodUrl(row.pod_url)) {
      window.open(row.pod_url, "_blank", "noopener,noreferrer");
      return;
    }
    const filename = getPodFilename(row.pod_url);
    if (!filename) return toast.error("Valid POD file available nahi hai.");
    const viewer = window.open("", "_blank");
    setViewingId(row.shipment_id);
    try {
      const blob = await getPodFile(filename);
      const objectUrl = URL.createObjectURL(blob);
      if (viewer) {
        viewer.opener = null;
        viewer.location.replace(objectUrl);
      } else {
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.click();
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    } catch (error) {
      viewer?.close();
      toast.error(error.response?.data?.message || "POD file open nahi hui.");
    } finally {
      setViewingId(null);
    }
  };

  const moveNext = async (row, status) => {
    setActionId(row.shipment_id);
    try {
      await updateDeliveryStatus(row.shipment_id, { status });
      toast.success(status === "COMPLETED" ? "Delivery complete hui aur fleet release ho gaya." : "Shipment Delivered mark ho gaya. Ab POD upload karein.");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Status update nahi hua.");
    } finally {
      setActionId(null);
    }
  };

  const cards = [
    { label: "Mark Delivered", description: "Destination par pahunchi deliveries", value: rows.filter((row) => row.current_status === "OUT_FOR_DELIVERY").length, filter: "OUT_FOR_DELIVERY", icon: Truck, tone: "bg-violet-50 text-violet-600" },
    { label: "Upload POD", description: "Delivery proof upload pending", value: rows.filter((row) => row.current_status === "DELIVERED" && !isViewablePod(row.pod_url)).length, filter: "DELIVERED", icon: Upload, tone: "bg-orange-50 text-orange-600" },
    { label: "Ready to Complete", description: "POD uploaded, closure pending", value: rows.filter((row) => row.current_status === "POD_UPLOADED").length, filter: "POD_UPLOADED", icon: FileCheck2, tone: "bg-teal-50 text-teal-600" },
    { label: "Completed", description: "Trip closed and fleet released", value: rows.filter((row) => row.current_status === "COMPLETED").length, filter: "COMPLETED", icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600" },
  ];

  const workflow = [
    { number: 1, title: "Out for Delivery", description: "Driver Live Tracking se shipment ko delivery ke liye nikalega." },
    { number: 2, title: "Mark Delivered", description: "Destination par parcel handover hone ke baad delivery confirm karein." },
    { number: 3, title: "Upload POD", description: "Signed receipt, delivery photo ya PDF file directly upload karein." },
    { number: 4, title: "Complete", description: "Trip close hoga, fleet available hogi aur invoice ban sakega." },
  ];

  const actionFor = (row) => {
    const busy = actionId === row.shipment_id;
    if (row.current_status === "OUT_FOR_DELIVERY") return <button disabled={busy} onClick={() => moveNext(row, "DELIVERED")} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? "Updating..." : "Mark Delivered"}</button>;
    if (row.current_status === "DELIVERED") return <button disabled={busy} onClick={() => openPod(row)} className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><Upload size={13} /> Upload POD</button>;
    if (row.current_status === "POD_UPLOADED" && !isViewablePod(row.pod_url)) return <button disabled={busy} onClick={() => openPod(row)} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><Upload size={13} /> Upload POD File</button>;
    if (row.current_status === "POD_UPLOADED") return <button disabled={busy} onClick={() => moveNext(row, "COMPLETED")} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><CheckCircle2 size={13} /> {busy ? "Completing..." : "Complete"}</button>;
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 size={14} /> Closed</span>;
  };

  return (
    <div className="min-h-full space-y-6 bg-slate-50/60 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-500">Step 5 · Final Delivery</p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">Delivery Closure & POD</h1>
          <p className="mt-1 text-sm text-slate-500">Delivery confirm karein, proof save karein aur trip close karein.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 self-start rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-200 transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-100"><RefreshCw size={15} /> Refresh</button>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
        <div className="mb-4"><h2 className="font-semibold text-slate-900">Ye screen kaise kaam karti hai?</h2><p className="mt-0.5 text-sm text-slate-500">Har shipment ko left-to-right in chaar stages se close kiya jayega.</p></div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {workflow.map((step, index) => <div key={step.number} className="relative rounded-xl bg-slate-50/80 p-4"><div className="mb-3 flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-sm font-bold text-white shadow-sm shadow-orange-200">{step.number}</span>{index < workflow.length - 1 && <ArrowRight size={17} className="hidden text-slate-300 md:block" />}</div><h3 className="text-sm font-semibold text-slate-800">{step.title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{step.description}</p></div>)}
        </div>
        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-blue-50/80 px-4 py-3.5 text-sm text-blue-800 sm:flex-row sm:items-center sm:justify-between"><span className="flex items-start gap-2.5"><Info className="mt-0.5 shrink-0 text-blue-600" size={16} /><span>Shipment is page par tab aayega jab driver use Live Tracking me <strong>Out for Delivery</strong> karega.</span></span><button onClick={() => navigate("/dashboard/operations/live-tracking")} className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-800">Open Live Tracking <ArrowRight size={13} /></button></div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button type="button" onClick={() => setFilter(card.filter)} className={`rounded-2xl bg-white p-4 text-left shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${filter === card.filter ? "ring-2 ring-orange-400" : "ring-slate-200/60"}`} key={card.label}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-2xl font-bold tracking-tight text-slate-900">{card.value}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-600">{card.label}</div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{card.description}</p>
                </div>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.tone}`}><Icon size={19} /></span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/60 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-50" placeholder="Search shipment, vehicle or driver..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <select className="min-w-44 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-50" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="ALL">All deliveries</option><option value="OUT_FOR_DELIVERY">Out for Delivery</option><option value="DELIVERED">Delivered</option><option value="POD_UPLOADED">POD Uploaded</option><option value="COMPLETED">Completed</option></select>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80"><tr>{["Shipment", "Route", "Vehicle / Driver", "Expected", "Status", "POD", "Next Action"].map((heading) => <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500" key={heading}>{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan="7" className="px-5 py-16 text-center"><span className="inline-flex items-center gap-2 text-sm font-medium text-slate-500"><RefreshCw className="animate-spin text-orange-500" size={17} /> Loading deliveries...</span></td></tr> : visible.length === 0 ? <tr><td colSpan="7" className="p-8"><div className="mx-auto flex max-w-lg flex-col items-center py-6 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500"><Truck size={26} /></span><h3 className="mt-4 text-lg font-semibold text-slate-800">{rows.length ? "Is filter me koi delivery nahi hai" : "Abhi delivery closure ke liye koi shipment nahi hai"}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{rows.length ? "All deliveries select karein ya doosra status card open karein." : "Pehle shipment assign hoga, driver assignment accept karega aur Live Tracking me Out for Delivery karega. Uske baad shipment yahan automatically dikhai dega."}</p><div className="mt-5 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => navigate("/dashboard/operations/live-tracking")} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"><Navigation size={15} /> Live Tracking</button><button type="button" onClick={() => navigate(isDriver ? "/dashboard/operations/assignments" : "/dashboard/organization/shipments/all")} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700">{isDriver ? "My Assignments" : "View Shipments"} <ArrowRight size={14} /></button>{rows.length > 0 && <button type="button" onClick={() => setFilter("ALL")} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-blue-600">Clear Filter</button>}</div></div></td></tr> : visible.map((row) => (
              <tr className="text-slate-700 transition hover:bg-slate-50/70" key={row.shipment_id}>
                <td className="px-5 py-4"><div className="font-semibold text-slate-900">{row.shipment_number}</div><div className="mt-0.5 text-xs text-slate-500">{row.tracking_number || "No tracking number"}</div></td>
                <td className="px-5 py-4"><div>{row.origin || "-"}</div><div className="mt-0.5 text-xs text-slate-500">to {row.destination || "-"}</div></td>
                <td className="px-5 py-4"><div className="font-medium text-slate-800">{row.vehicle_number || "Unassigned"}</div><div className="mt-0.5 text-xs text-slate-500">{row.driver_name || "No driver"}</div></td>
                <td className="whitespace-nowrap px-5 py-4">{row.expected_delivery_date ? new Date(row.expected_delivery_date).toLocaleDateString("en-IN") : "-"}</td>
                <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[row.current_status] || "bg-slate-100 text-slate-700"}`}>{pretty(row.current_status)}</span></td>
                <td className="px-5 py-4">{row.pod_uploaded_at && isViewablePod(row.pod_url) ? <button type="button" disabled={viewingId === row.shipment_id} onClick={() => viewPod(row)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-50">{viewingId === row.shipment_id ? "Opening..." : "View POD"} <ExternalLink size={12} /></button> : row.current_status === "POD_UPLOADED" ? <button type="button" onClick={() => openPod(row)} className="text-xs font-semibold text-red-600">Upload valid file</button> : <span className="text-slate-400">Not uploaded</span>}</td>
                <td className="px-5 py-4">{actionFor(row)}</td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 py-8 backdrop-blur-[1px] sm:items-center">
          <form onSubmit={savePod} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-orange-500">Proof of Delivery</p><h2 className="text-xl font-semibold">{selected.shipment_number}</h2></div><button type="button" onClick={() => setSelected(null)}><X size={20} /></button></div>
            <label className="block text-sm font-medium text-slate-700">POD Photo / PDF *<input required type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" className="mt-1 block w-full cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-orange-500 file:px-3 file:py-2 file:font-semibold file:text-white" onChange={(event) => setForm((previous) => ({ ...previous, pod_file: event.target.files?.[0] || null }))} /><span className="mt-2 block text-xs font-normal text-slate-500">PDF, JPG, PNG ya WEBP — maximum 10 MB.</span>{form.pod_file && <span className="mt-2 block rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Selected: {form.pod_file.name} ({(form.pod_file.size / 1024 / 1024).toFixed(2)} MB)</span>}</label>
            <label className="block text-sm font-medium text-slate-700">Delivery remarks<textarea className="mt-1 w-full rounded-lg border px-3 py-2" rows="3" value={form.remarks} onChange={(event) => setForm((previous) => ({ ...previous, remarks: event.target.value }))} /></label>
            <p className="flex items-center gap-2 rounded-lg bg-teal-50 p-3 text-xs text-teal-700"><FileCheck2 size={15} /> Submit karne par status automatically POD Uploaded hoga.</p>
            <div className="flex justify-end gap-3"><button type="button" onClick={() => setSelected(null)} className="rounded-lg px-4 py-2 text-sm">Cancel</button><button disabled={!form.pod_file || actionId === selected.shipment_id} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{actionId === selected.shipment_id ? "Uploading..." : "Upload POD"}</button></div>
          </form>
        </div>,
        document.body,
      )}
    </div>
  );
}
