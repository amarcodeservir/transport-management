/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  AlertTriangle, ArrowRight, Banknote, Building2,
  CheckCircle2, ChevronDown, ChevronUp, CircleDollarSign, Clock3,
  ExternalLink, FileCheck2, Globe2, IndianRupee, Mail, MapPin,
  Package, Phone, RefreshCw, Search, ShieldCheck, Truck, UserRound,
  UsersRound, Warehouse,
} from "lucide-react";
import { getAllOrganizations, getOrganizationDashboard } from "../services/api.js/organizationService.js";
import { getShipments } from "../services/api.js/shipmentService.js";
import { getLiveTracking } from "../services/api.js/liveTrackingService.js";
import { resolveBrandingAssetUrl } from "../utils/branding.js";

const STATUS_COLORS = {
  PENDING: "#f59e0b",
  UNASSIGNED: "#94a3b8",
  ASSIGNED: "#3b82f6",
  IN_TRANSIT: "#f97316",
  OUT_FOR_DELIVERY: "#8b5cf6",
  DELIVERED: "#22c55e",
  POD_UPLOADED: "#14b8a6",
  COMPLETED: "#059669",
  CANCELLED: "#ef4444",
};

const normalizeRole = (role = "") => String(role).trim().toLowerCase().replace(/[-\s]+/g, "_");
const labelStatus = (value = "") => String(value || "PENDING").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const formatMoney = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";
const formatDateTime = (value) => value ? new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "No activity yet";
const percentage = (value, maximum) => maximum ? Math.min(100, Math.round((Number(value || 0) / Number(maximum)) * 100)) : 0;

const SUBSCRIPTION_TONES = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  TRIAL: "bg-blue-50 text-blue-700 ring-blue-600/10",
  PAST_DUE: "bg-amber-50 text-amber-700 ring-amber-600/10",
  SUSPENDED: "bg-red-50 text-red-700 ring-red-600/10",
  EXPIRED: "bg-rose-50 text-rose-700 ring-rose-600/10",
};

function UsageBar({ label, value, maximum, tone = "bg-orange-500" }) {
  const used = percentage(value, maximum);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="text-slate-500">{value}/{maximum || "∞"}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${tone}`} style={{ width: `${used}%` }} /></div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <span className="mt-0.5 rounded-lg bg-slate-100 p-1.5 text-slate-500"><Icon size={14} /></span>
      <div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="truncate text-sm font-medium text-slate-700">{value || "Not added"}</p></div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone = "orange", hint }) {
  const tones = {
    orange: "bg-orange-50 text-orange-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    slate: "bg-slate-100 text-slate-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        <span className={`rounded-xl p-2.5 ${tones[tone] || tones.orange}`}><Icon size={19} /></span>
      </div>
    </div>
  );
}

function ActionButton({ label, description, icon: Icon, onClick }) {
  return (
    <button onClick={onClick} className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-orange-200 hover:bg-orange-50/40">
      <span className="rounded-lg bg-orange-50 p-2 text-orange-600"><Icon size={17} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        <span className="block truncate text-xs text-slate-500">{description}</span>
      </span>
      <ArrowRight size={15} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-orange-500" />
    </button>
  );
}

function OrganizationCard({ organization, expanded, onToggle, onFocus }) {
  const subscription = organization.subscription || {};
  const operations = organization.operations || {};
  const fleet = organization.fleet || {};
  const users = organization.users || {};
  const billing = organization.billing || {};
  const contact = organization.contact || {};
  const location = organization.location || {};
  const logo = resolveBrandingAssetUrl(organization.logo);
  const address = [location.address, location.city, location.state, location.pincode].filter(Boolean).join(", ");
  const subscriptionTone = SUBSCRIPTION_TONES[String(subscription.status || "").toUpperCase()] || "bg-slate-100 text-slate-600 ring-slate-500/10";

  return (
    <article className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 transition ${expanded ? "ring-orange-200 shadow-md" : "ring-slate-200/80 hover:ring-slate-300"}`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-slate-100 text-lg font-bold text-orange-600 ring-1 ring-slate-200/60">
              {logo ? <img src={logo} alt="" className="h-full w-full object-contain p-1" /> : organization.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-bold text-slate-900">{organization.name}</h3><span className={`h-2 w-2 rounded-full ${String(organization.status).toUpperCase() === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"}`} /></div><p className="mt-0.5 text-xs font-medium text-slate-500">{organization.code} · Since {formatDate(organization.createdAt)}</p></div>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${subscriptionTone}`}>{labelStatus(subscription.plan)} · {labelStatus(subscription.status)}</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            ["Shipments", operations.shipments || 0, Package, "text-orange-600 bg-orange-50"],
            ["Customers", users.customers || 0, UsersRound, "text-blue-600 bg-blue-50"],
            ["Fleet", fleet.vehicles || 0, Truck, "text-violet-600 bg-violet-50"],
            ["Active trips", fleet.activeTrips || 0, Warehouse, "text-emerald-600 bg-emerald-50"],
          ].map(([label, value, Icon, tone]) => <div key={label} className="rounded-xl bg-slate-50/80 p-2.5"><span className={`mb-2 inline-flex rounded-lg p-1.5 ${tone}`}><Icon size={14} /></span><p className="text-lg font-bold leading-none text-slate-900">{value}</p><p className="mt-1 text-[11px] font-medium text-slate-500">{label}</p></div>)}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <DetailItem icon={Mail} label="Organization contact" value={contact.email} />
          <DetailItem icon={UserRound} label="Primary admin" value={contact.primaryAdminName ? `${contact.primaryAdminName} · ${contact.primaryAdminEmail || "No email"}` : "Admin not assigned"} />
          <DetailItem icon={MapPin} label="Location" value={address || "Location not added"} />
          <DetailItem icon={Phone} label="Phone" value={contact.phone} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 sm:grid-cols-2">
          <UsageBar label="Monthly shipments" value={operations.shipmentsThisMonth || 0} maximum={subscription.maxShipmentsPerMonth || 0} />
          <UsageBar label="Vehicle usage" value={fleet.vehicles || 0} maximum={subscription.maxVehicles || 0} tone="bg-blue-500" />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Billing</p><p className="text-sm font-bold text-slate-900">{formatMoney(billing.collectedAmount)} <span className="font-medium text-slate-400">collected</span></p></div>
          <div className="flex items-center gap-2">
            {operations.needsAttention > 0 && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{operations.needsAttention} need attention</span>}
            <button type="button" onClick={onToggle} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">{expanded ? "Hide details" : "Complete details"}{expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>
          </div>
        </div>
      </div>

      {expanded && <OrganizationExpandedDetails organization={organization} onFocus={onFocus} />}
    </article>
  );
}

function OrganizationExpandedDetails({ organization, onFocus }) {
  const { contact = {}, compliance = {}, fleet = {}, location = {}, operations = {}, subscription = {}, billing = {}, users = {} } = organization;
  const registrationRows = [
    ["GSTIN", compliance.gstNumber], ["PAN", compliance.panNumber], ["CIN", compliance.cinNumber],
    ["Website", contact.website], ["Timezone", location.timezone], ["Joined", formatDate(organization.createdAt)],
  ];
  const metrics = [
    ["This month", operations.shipmentsThisMonth, "shipments"],
    ["In operation", operations.activeShipments, "shipments"],
    ["Delivered", operations.deliveredShipments, "shipments"],
    ["Delayed", operations.delayedShipments, "shipments"],
    ["Available fleet", `${fleet.availableVehicles}/${fleet.vehicles}`, "vehicles"],
    ["Available drivers", `${fleet.availableDrivers}/${fleet.drivers}`, "drivers"],
  ];

  return (
    <div className="border-t border-orange-100 bg-gradient-to-b from-orange-50/40 to-white p-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map(([label, value, suffix]) => <div key={label} className="rounded-xl border border-slate-100 bg-white p-3"><p className="text-lg font-bold text-slate-900">{value || 0}</p><p className="mt-0.5 text-[11px] font-semibold text-slate-500">{label}</p><p className="text-[10px] text-slate-400">{suffix}</p></div>)}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800"><ShieldCheck size={16} className="text-orange-500" /> Registration & profile</h4>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">{registrationRows.map(([label, value]) => <div key={label}><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 break-all text-xs font-semibold text-slate-700">{value || "Not added"}</p></div>)}</div>
          <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-600">{[location.address, location.city, location.state, location.country, location.pincode].filter(Boolean).join(", ") || "Full address not added"}</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800"><UsersRound size={16} className="text-blue-500" /> People & subscription</h4>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center"><div className="rounded-lg bg-slate-50 p-2"><p className="font-bold text-slate-900">{users.admins || 0}</p><p className="text-[10px] text-slate-500">Admins</p></div><div className="rounded-lg bg-slate-50 p-2"><p className="font-bold text-slate-900">{users.customers || 0}</p><p className="text-[10px] text-slate-500">Customers</p></div><div className="rounded-lg bg-slate-50 p-2"><p className="font-bold text-slate-900">{users.activeCustomers || 0}</p><p className="text-[10px] text-slate-500">Active</p></div></div>
          <div className="mt-3 space-y-1.5 text-xs"><p className="flex justify-between"><span className="text-slate-500">Admin limit</span><strong>{users.admins || 0}/{subscription.maxAdmins || "∞"}</strong></p><p className="flex justify-between"><span className="text-slate-500">User limit</span><strong>{users.customers || 0}/{subscription.maxUsers || "∞"}</strong></p><p className="flex justify-between"><span className="text-slate-500">Plan validity</span><strong>{formatDate(subscription.startDate)} — {formatDate(subscription.endDate)}</strong></p><p className="flex justify-between"><span className="text-slate-500">Billing cycle</span><strong>{labelStatus(subscription.billingCycle || "Not set")}</strong></p></div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800"><CircleDollarSign size={16} className="text-emerald-500" /> Financial overview</h4>
          <div className="mt-3 space-y-2 text-xs"><p className="flex justify-between rounded-lg bg-slate-50 p-2.5"><span className="text-slate-500">Plan price</span><strong>{formatMoney(subscription.price)}</strong></p><p className="flex justify-between rounded-lg bg-blue-50 p-2.5"><span className="text-blue-700">Total invoiced</span><strong className="text-blue-800">{formatMoney(billing.invoicedAmount)}</strong></p><p className="flex justify-between rounded-lg bg-emerald-50 p-2.5"><span className="text-emerald-700">Collected</span><strong className="text-emerald-800">{formatMoney(billing.collectedAmount)}</strong></p><p className="flex justify-between rounded-lg bg-red-50 p-2.5"><span className="text-red-700">Outstanding</span><strong className="text-red-800">{formatMoney(billing.outstandingAmount)}</strong></p></div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-orange-100 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>Last shipment activity: <strong className="text-slate-700">{formatDateTime(operations.lastActivity)}</strong></span><button type="button" onClick={onFocus} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 font-semibold text-white hover:bg-slate-800">Focus this organization <ArrowRight size={14} /></button></div>
    </div>
  );
}

function OrganizationPortfolio({ organizations, onFocusOrganization, onManageOrganizations }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState(null);
  const filteredOrganizations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return organizations.filter((organization) => {
      const searchable = [organization.name, organization.code, organization.contact?.email, organization.contact?.primaryAdminName, organization.location?.city, organization.location?.state].filter(Boolean).join(" ").toLowerCase();
      const statusMatch = statusFilter === "ALL" || String(organization.status).toUpperCase() === statusFilter;
      return statusMatch && (!query || searchable.includes(query));
    });
  }, [organizations, search, statusFilter]);

  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70">
      <div className="border-b border-slate-100 p-5 lg:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div><div className="flex items-center gap-2"><span className="rounded-lg bg-orange-50 p-2 text-orange-600"><Building2 size={18} /></span><div><h2 className="text-lg font-bold text-slate-900">Organization 360° overview</h2><p className="text-xs text-slate-500">Contact, plan, users, fleet, operations aur billing — ek jagah.</p></div></div></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search organization, admin, city..." className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-50" /></div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 outline-none focus:border-orange-300"><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select>
            <button type="button" onClick={onManageOrganizations} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Manage <ExternalLink size={14} /></button>
          </div>
        </div>
      </div>
      <div className="bg-slate-50/60 p-4 lg:p-5">
        <div className="mb-3 flex items-center justify-between text-xs text-slate-500"><span><strong className="text-slate-700">{filteredOrganizations.length}</strong> of {organizations.length} organizations</span><span>Click complete details for registration and financial data</span></div>
        {filteredOrganizations.length ? <div className="grid grid-cols-1 gap-4">{filteredOrganizations.map((organization) => <OrganizationCard key={organization.id} organization={organization} expanded={expandedId === organization.id} onToggle={() => setExpandedId((current) => current === organization.id ? null : organization.id)} onFocus={() => onFocusOrganization(organization.id)} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center"><Building2 className="mx-auto text-slate-300" size={30} /><p className="mt-3 font-semibold text-slate-700">No organizations found</p><p className="mt-1 text-sm text-slate-400">Search ya status filter change karke dekhein.</p></div>}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "null"), []);
  const role = normalizeRole(user?.role);
  const isCustomer = role === "customer";
  const isDriver = role === "driver";
  const isOrganizationAdmin = role === "organization_admin";
  const isSuperAdmin = role === "super_admin";
  const canManageOrganization = role === "organization_admin" || role === "super_admin";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    if (role !== "super_admin") return;
    getAllOrganizations()
      .then((response) => setOrganizations(response.data || []))
      .catch(() => setOrganizations([]));
  }, [role]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (isDriver) {
        const response = await getLiveTracking();
        const shipments = response?.data || [];
        const statusMap = shipments.reduce((map, shipment) => {
          const status = shipment.current_status || "ASSIGNED";
          map[status] = (map[status] || 0) + 1;
          return map;
        }, {});
        setData({
          shipments: shipments.length,
          assignedShipments: statusMap.ASSIGNED || 0,
          inTransitShipments: statusMap.IN_TRANSIT || 0,
          outForDeliveryShipments: statusMap.OUT_FOR_DELIVERY || 0,
          activeTrips: shipments.length,
          recentShipments: shipments.slice(0, 8).map((shipment) => ({ ...shipment, id: shipment.shipment_id })),
          statusBreakdown: Object.entries(statusMap).map(([status, value]) => ({ status, value })),
          trend: [],
        });
      } else if (isCustomer) {
        const response = await getShipments({ page: 1, limit: 200 });
        const shipments = response?.data || response?.shipments || [];
        const statusMap = shipments.reduce((map, shipment) => {
          const status = shipment.current_status || "PENDING";
          map[status] = (map[status] || 0) + 1;
          return map;
        }, {});
        const delivered = (statusMap.DELIVERED || 0) + (statusMap.POD_UPLOADED || 0) + (statusMap.COMPLETED || 0);
        setData({
          shipments: response?.pagination?.total ?? shipments.length,
          pendingShipments: statusMap.PENDING || 0,
          unassignedShipments: statusMap.UNASSIGNED || 0,
          assignedShipments: statusMap.ASSIGNED || 0,
          inTransitShipments: statusMap.IN_TRANSIT || 0,
          outForDeliveryShipments: statusMap.OUT_FOR_DELIVERY || 0,
          deliveredShipments: delivered,
          recentShipments: shipments.slice(0, 8),
          statusBreakdown: Object.entries(statusMap).map(([status, value]) => ({ status, value })),
          trend: [],
        });
      } else {
        const response = await getOrganizationDashboard(selectedOrganizationId ? { organization_id: selectedOrganizationId } : {});
        setData(response?.data || {});
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Dashboard data load nahi ho saka.");
    } finally {
      setLoading(false);
    }
  }, [isCustomer, isDriver, selectedOrganizationId]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const statusData = useMemo(() => (data?.statusBreakdown || []).map((item) => ({
    ...item,
    name: labelStatus(item.status),
    color: STATUS_COLORS[item.status] || "#cbd5e1",
  })), [data]);

  if (loading) {
    return <div className="flex min-h-[70vh] items-center justify-center bg-slate-50"><div className="text-center"><RefreshCw className="mx-auto animate-spin text-orange-500" /><p className="mt-3 text-sm text-slate-500">Live dashboard load ho raha hai...</p></div></div>;
  }

  if (error) {
    return <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 p-6"><div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center"><AlertTriangle className="mx-auto text-red-500" /><h2 className="mt-3 font-semibold text-slate-800">Dashboard unavailable</h2><p className="mt-1 text-sm text-slate-500">{error}</p><button onClick={loadDashboard} className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Try again</button></div></div>;
  }

  const organizationName = String(data?.organization?.name || (isCustomer ? user?.company_name : isDriver ? `${user?.name || "Driver"} · Driver Portal` : role === "super_admin" ? "All Organizations" : "Your Organization")).trim();
  const operationalCards = [
    { label: "Total Shipments", value: data?.shipments || 0, icon: Package, tone: "orange" },
    { label: "Pending Approval", value: data?.pendingShipments || 0, icon: Clock3, tone: "slate" },
    { label: "Unassigned", value: data?.unassignedShipments || 0, icon: AlertTriangle, tone: "red" },
    { label: "Active Trips", value: data?.activeTrips || data?.inTransitShipments || 0, icon: Truck, tone: "blue" },
    { label: "In Transit", value: data?.inTransitShipments || 0, icon: Warehouse, tone: "purple" },
    { label: "Out for Delivery", value: data?.outForDeliveryShipments || 0, icon: Truck, tone: "orange" },
    { label: "Delivered", value: data?.deliveredShipments || 0, icon: CheckCircle2, tone: "green", hint: `${data?.deliveredToday || 0} delivered today` },
    { label: "Delayed", value: data?.delayedShipments || 0, icon: AlertTriangle, tone: "red" },
  ];
  const superAdminCards = [
    { label: "Active Organizations", value: `${data?.activeOrganizations || 0}/${data?.organizations || 0}`, icon: Building2, tone: "orange", hint: "Live tenant accounts" },
    { label: "Organization Admins", value: data?.organizationAdmins || 0, icon: ShieldCheck, tone: "purple", hint: "Platform administrators" },
    { label: "Customers", value: data?.customers || 0, icon: UsersRound, tone: "blue", hint: "Across all organizations" },
    { label: "Total Shipments", value: data?.shipments || 0, icon: Package, tone: "orange", hint: `${data?.activeTrips || 0} active trips` },
    { label: "Vehicles", value: data?.vehicles || 0, icon: Truck, tone: "blue", hint: `${data?.availableVehicles || 0} available` },
    { label: "Drivers", value: data?.drivers || 0, icon: UserRound, tone: "green", hint: `${data?.availableDrivers || 0} available` },
    { label: "Needs Attention", value: (data?.pendingShipments || 0) + (data?.unassignedShipments || 0) + (data?.delayedShipments || 0), icon: AlertTriangle, tone: "red", hint: "Pending, unassigned & delayed" },
    { label: "Outstanding", value: formatMoney(data?.outstandingAmount), icon: CircleDollarSign, tone: "slate", hint: `${formatMoney(data?.collectedAmount)} collected` },
  ];
  const dashboardCards = isSuperAdmin ? superAdminCards : operationalCards;

  return (
    <div className="min-h-full bg-slate-50 p-3 sm:p-5 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {isSuperAdmin ? <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div><div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-500"><Globe2 size={14} /> Super Admin Command Center</div><h1 className="text-3xl font-bold tracking-tight text-slate-900">{selectedOrganizationId ? organizationName : "Organization Network"}</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Har organization ki health, operations, fleet, subscription aur collections ko ek unified view mein monitor karein.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row"><select aria-label="Dashboard organization" value={selectedOrganizationId} onChange={(event) => setSelectedOrganizationId(event.target.value)} className="min-w-56 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-orange-300"><option value="">All Organizations</option>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name} ({organization.code})</option>)}</select><button onClick={loadDashboard} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-600"><RefreshCw size={15} /> Refresh data</button></div>
        </section> : <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">{isCustomer ? "Customer Portal" : isDriver ? "My Assigned Deliveries" : "Organization Control Center"}</p><h1 className="mt-1 text-3xl font-bold text-slate-900">{organizationName}</h1><p className="mt-1 text-sm text-slate-500">Live logistics status, action queue aur financial overview.</p></div>
          <button onClick={loadDashboard} className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-orange-600"><RefreshCw size={15} /> Refresh</button>
        </div>}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {dashboardCards.map((card) => <StatCard key={card.label} {...card} />)}
        </div>

        {isSuperAdmin && <OrganizationPortfolio organizations={data?.organizationDetails || []} onFocusOrganization={(organizationId) => setSelectedOrganizationId(String(organizationId))} onManageOrganizations={() => navigate("/dashboard/organizations")} />}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-7">
            <div className="mb-4"><h2 className="font-semibold text-slate-900">30-Day Shipment Trend</h2><p className="text-xs text-slate-500">New bookings by day</p></div>
            <div className="h-64">
              {(data?.trend || []).length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={data.trend}><defs><linearGradient id="shipmentTrend" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f97316" stopOpacity={0.35} /><stop offset="100%" stopColor="#f97316" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip /><Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2.5} fill="url(#shipmentTrend)" /></AreaChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-slate-400">Trend ke liye abhi enough shipment data nahi hai.</div>}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-5">
            <div><h2 className="font-semibold text-slate-900">Shipment Status Mix</h2><p className="text-xs text-slate-500">Current operational distribution</p></div>
            <div className="grid grid-cols-1 items-center sm:grid-cols-2">
              <div className="h-52"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2}>{statusData.map((item) => <Cell key={item.status} fill={item.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
              <div className="space-y-2">{statusData.length ? statusData.map((item) => <div key={item.status} className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span><strong className="text-slate-800">{item.value}</strong></div>) : <p className="text-sm text-slate-400">No shipments</p>}</div>
            </div>
          </section>
        </div>

        {canManageOrganization && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900">Quick Actions</h2><p className="mb-4 text-xs text-slate-500">Recommended next operational steps</p>
              {isOrganizationAdmin ? <div className="space-y-2">
                <ActionButton label="Create Shipment" description="New booking starts in Pending" icon={Package} onClick={() => navigate("/dashboard/organization/shipments/all?create=1")} />
                <ActionButton label="Approve Pending" description={`${data?.pendingShipments || 0} shipments waiting`} icon={FileCheck2} onClick={() => navigate("/dashboard/organization/shipments/pending")} />
                <ActionButton label="Assign Fleet" description={`${data?.unassignedShipments || 0} shipments need assignment`} icon={Truck} onClick={() => navigate("/dashboard/operations/assignments")} />
                <ActionButton label="Pending POD" description={`${data?.podPending || 0} deliveries need proof`} icon={CheckCircle2} onClick={() => navigate("/dashboard/pod")} />
              </div> : <div className="space-y-2">
                <ActionButton label="Organizations" description={`${data?.activeOrganizations || 0} active organizations`} icon={Warehouse} onClick={() => navigate("/dashboard/organizations")} />
                <ActionButton label="Organization Admins" description={`${data?.organizationAdmins || 0} administrator accounts`} icon={UserRound} onClick={() => navigate("/dashboard/organization-admins")} />
                <ActionButton label="Global Operations" description={`${data?.shipments || 0} shipments across tenants`} icon={Package} onClick={() => navigate("/dashboard/global-operations")} />
                <ActionButton label="Global Fleet" description={`${data?.vehicles || 0} total vehicles`} icon={Truck} onClick={() => navigate("/dashboard/global-fleet")} />
              </div>}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900">Fleet Readiness</h2><p className="mb-4 text-xs text-slate-500">Resources available for new assignments</p>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Vehicles" value={`${data?.availableVehicles || 0}/${data?.vehicles || 0}`} icon={Truck} tone="orange" />
                <StatCard label="Drivers" value={`${data?.availableDrivers || 0}/${data?.drivers || 0}`} icon={UserRound} tone="blue" />
              </div>
              <button onClick={() => navigate(isOrganizationAdmin ? "/dashboard/fleet" : "/dashboard/global-fleet")} className="mt-3 flex w-full items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Open Fleet Management <ArrowRight size={15} /></button>
              {(data?.expiringDocuments || 0) > 0 && <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs font-medium text-amber-700">{data.expiringDocuments} compliance document(s) expire within 30 days.</p>}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900">Billing Snapshot</h2><p className="mb-4 text-xs text-slate-500">Invoices and collections</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span className="flex items-center gap-2 text-sm text-slate-600"><Banknote size={16} /> Invoiced</span><strong>{formatMoney(data?.invoicedAmount)}</strong></div>
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3"><span className="flex items-center gap-2 text-sm text-emerald-700"><IndianRupee size={16} /> Collected</span><strong className="text-emerald-800">{formatMoney(data?.collectedAmount)}</strong></div>
                <div className="flex items-center justify-between rounded-xl bg-red-50 p-3"><span className="flex items-center gap-2 text-sm text-red-700"><Clock3 size={16} /> Outstanding</span><strong className="text-red-800">{formatMoney(data?.outstandingAmount)}</strong></div>
              </div>
              <button onClick={() => navigate("/dashboard/billing/invoices")} className="mt-3 text-sm font-semibold text-orange-600">Manage invoices <ArrowRight size={14} className="inline" /></button>
            </section>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-semibold text-slate-900">Recent Shipments</h2><p className="text-xs text-slate-500">Latest operational activity</p></div><button onClick={() => navigate(isCustomer ? "/dashboard/tracking" : isDriver ? "/dashboard/operations/live-tracking" : isOrganizationAdmin ? "/dashboard/organization/shipments/all" : "/dashboard/global-operations")} className="text-sm font-semibold text-orange-600">View all</button></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Shipment</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Route</th><th className="px-5 py-3">Booking</th><th className="px-5 py-3">Expected</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{(data?.recentShipments || []).map((shipment) => <tr key={shipment.id} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-semibold text-slate-800">{shipment.shipment_number}</p><p className="text-xs text-slate-400">{shipment.tracking_number || "No tracking number"}</p></td><td className="px-5 py-4 text-slate-600">{shipment.customer_name || shipment.company_name || user?.name || "-"}</td><td className="px-5 py-4 text-slate-600">{shipment.origin || "-"} → {shipment.destination || "-"}</td><td className="px-5 py-4 text-slate-500">{formatDate(shipment.booking_date)}</td><td className="px-5 py-4 text-slate-500">{formatDate(shipment.expected_delivery_date)}</td><td className="px-5 py-4"><span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ color: STATUS_COLORS[shipment.current_status] || "#475569", backgroundColor: `${STATUS_COLORS[shipment.current_status] || "#94a3b8"}18` }}>{labelStatus(shipment.current_status)}</span></td></tr>)}{!(data?.recentShipments || []).length && <tr><td colSpan="6" className="px-5 py-12 text-center text-slate-400">Abhi koi shipment available nahi hai.</td></tr>}</tbody></table></div>
        </section>
      </div>
    </div>
  );
}
