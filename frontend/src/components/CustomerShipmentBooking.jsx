import React,{ useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ShipmentModal } from "./superAdmin/OrgAdminShipments.jsx";

export default function CustomerShipmentBooking() {
  const navigate = useNavigate();
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "null"), []);
  const close = () => navigate("/dashboard/tracking", { replace: true });

  return (
    <div className="min-h-full bg-slate-50">
      <ShipmentModal
        customerMode
        customers={user ? [user] : []}
        onClose={close}
        onSaved={close}
      />
    </div>
  );
}
