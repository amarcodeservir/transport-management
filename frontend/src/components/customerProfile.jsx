import React, { useMemo } from "react";
import { Route, MapPin, Building2, Mail, Phone, Hash, Globe } from "lucide-react";

const Row = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
    <p className="mt-2 text-sm font-medium text-slate-900 break-all">{value || "-"}</p>
  </div>
);

export default function CustomerProfile() {
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "null"), []);

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Client / User</h2>
        <p className="text-sm text-slate-500 mt-1">Your customer identity and contact details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Row icon={Hash} label="User ID" value={user?.customer_code || user?.id} />
        <Row icon={Route} label="Role" value={user?.role} />
        <Row icon={Mail} label="Email" value={user?.email} />
        <Row icon={Phone} label="Phone" value={user?.phone} />
        <Row icon={Building2} label="Company Name" value={user?.company_name} />
        <Row icon={Hash} label="GST Number" value={user?.gst_number} />
        <Row icon={Globe} label="Customer Type" value={user?.customer_type} />
        <Row icon={MapPin} label="Organization ID" value={user?.organization_id} />
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Address</h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Row icon={MapPin} label="Address" value={user?.address} />
          <Row icon={Route} label="City" value={user?.city} />
          <Row icon={Route} label="State" value={user?.state} />
          <Row icon={Route} label="Country" value={user?.country} />
          <Row icon={Route} label="Pincode" value={user?.pincode} />
          <Row icon={Route} label="Status" value={user?.status} />
        </div>
      </div>
    </div>
  );
}
