import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  X,
  Search,
  Building2,
  Mail,
  Phone,
  MapPin,
  Hash,
  Globe,
  Users,
  CheckCircle2,
  Loader2,
  ChevronDown,
  UserCircle2,
  Pencil,
  Trash2,
  AlertTriangle,
  Lock,
  Shield,
} from "lucide-react";
import {
  getAllCustomers,
  createCustomer as apiCreateCustomer,
  updateCustomer as apiUpdateCustomer,
  deleteCustomer as apiDeleteCustomer,
} from "../services/api.js/customerService.js";
import { getDefaultOrganizationId, isAdminLikeRole } from "../utils/roleAccess.js";

const CUSTOMER_TYPES = ["Retail", "Wholesale", "Corporate", "Distributor"];
const STATUSES = ["Active", "Inactive"];

const EMPTY_FORM = {
  customer_code: "",
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "customer",
  company_name: "",
  gst_number: "",
  customer_type: "Retail",
  organization_id: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  status: "Active",
};

const inputClass =
  "w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F7941D]/30 focus:border-[#F7941D] transition-colors";

function Field({ label, icon: Icon, children, span }) {
  return (
    <div className={span ? "sm:col-span-2" : ""}>
      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5">
        {Icon && <Icon size={13} className="text-slate-400" />}
        {label}
      </label>
      {children}
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [justAddedCode, setJustAddedCode] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteClosing, setIsDeleteClosing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const user = React.useMemo(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoadingData(true);
      const result = await getAllCustomers();
      setCustomers(result.data || []);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toast.error("Failed to load customers from server.");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openCreateModal = () => {
    const nextCode = `CUST-${String((customers.length || 0) + 1001)}`;
    const organizationId = getDefaultOrganizationId(user, "");
    setEditingId(null);
    setForm({ ...EMPTY_FORM, customer_code: nextCode, role: "customer", organization_id: organizationId });
    setErrors({});
    setIsOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingId(customer.id);
    setForm({
      ...EMPTY_FORM,
      ...customer,
      password: "",
      role: "customer",
      organization_id: customer.organization_id || getDefaultOrganizationId(user, ""),
    });
    setErrors({});
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setEditingId(null);
    }, 180);
  };

  const update = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const next = {};
    const required = ["customer_code", "name", "email", "phone", "company_name"];
    required.forEach((key) => {
      if (!String(form[key] || "").trim()) next[key] = "Required";
    });
    if (!editingId && !String(form.password || "").trim()) {
      next.password = "Required";
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      next.email = "Invalid email";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = { ...form, role: "customer" };
      if (editingId && !String(payload.password || "").trim()) {
        delete payload.password;
      }

      if (editingId) {
        await apiUpdateCustomer(editingId, payload);
        toast.success("Customer updated successfully");
      } else {
        await apiCreateCustomer(payload);
        toast.success("Customer created successfully");
      }

      await fetchCustomers();
      setJustAddedCode(form.customer_code);
      closeModal();
      setTimeout(() => setJustAddedCode(null), 2200);
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error(error.response?.data?.message || "Failed to save customer.");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (customer) => {
    setDeleteTarget(customer);
  };

  const closeDeleteModal = () => {
    setIsDeleteClosing(true);
    setTimeout(() => {
      setDeleteTarget(null);
      setIsDeleteClosing(false);
    }, 180);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDeleteCustomer(deleteTarget.id);
      toast.success(`Customer ${deleteTarget.customer_code} deleted`);
      await fetchCustomers();
      closeDeleteModal();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error(error.response?.data?.message || "Failed to delete customer.");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = customers.filter((c) => {
    const q = query.toLowerCase();
    return [c.customer_code, c.name, c.email, c.phone, c.company_name, c.city, c.state]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <style>{`
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modal-in { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes modal-out { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(10px) scale(0.97); } }
        @keyframes row-in { from { opacity: 0; transform: translateY(-6px); background-color: rgba(247,148,29,0.12); } to { opacity: 1; transform: translateY(0); background-color: transparent; } }
        @keyframes toast-in { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes shake { 10%, 90% { transform: translateX(-1px); } 20%, 80% { transform: translateX(2px); } 30%, 50%, 70% { transform: translateX(-3px); } 40%, 60% { transform: translateX(3px); } }
        .backdrop-anim { animation: fade-in 0.18s ease-out forwards; }
        .modal-anim { animation: modal-in 0.22s cubic-bezier(0.16,1,0.3,1) forwards; }
        .modal-anim-out { animation: modal-out 0.18s ease-in forwards; }
        .row-new { animation: row-in 1.1s ease-out forwards; }
        .toast-anim { animation: toast-in 0.25s cubic-bezier(0.16,1,0.3,1) forwards; }
        .icon-shake:hover { animation: shake 0.4s ease-in-out; }
      `}</style>

      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
            <p className="text-slate-500 text-sm mt-1">{customers.length} customers on file</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdminLikeRole(user?.role) && (
              <button
                onClick={openCreateModal}
                className="group flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#F7941D] text-white font-medium text-sm hover:bg-[#e8831a] active:scale-[0.98] transition-all shadow-sm hover:shadow-md"
              >
                <Plus size={17} className="transition-transform group-hover:rotate-90 duration-200" />
                New Customer
              </button>
            )}
            {!isAdminLikeRole(user?.role) && (
              <span className="text-sm text-slate-500">Create customers from your organization dashboard or register as a customer from the public login screen.</span>
            )}
          </div>
        </div>

        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Search by code, name, email, phone, city..."
            className="pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#F7941D]/30 focus:border-[#F7941D] transition-colors"
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Code</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Contact</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wide hidden lg:table-cell">Company</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wide hidden lg:table-cell">Location</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wide hidden sm:table-cell">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${c.customer_code === justAddedCode ? "row-new" : ""}`}
                  >
                    <td className="py-3 px-4">
                      <span className="text-xs font-mono font-medium text-slate-500">{c.customer_code}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center text-[#F7941D] font-semibold text-xs shrink-0">
                          {(c.name || "").split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{c.name}</p>
                          <p className="text-xs text-slate-500">{c.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <p className="text-sm text-slate-600">{c.email}</p>
                      <p className="text-xs text-slate-400">{c.phone}</p>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <p className="text-sm text-slate-600">{c.company_name}</p>
                      <p className="text-xs text-slate-400">{c.organization_id || "-"}</p>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className="text-sm text-slate-600">{c.city}, {c.state}</span>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-50 text-[#c97315] border border-orange-100">
                        {c.customer_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${c.status === "Active" ? "bg-[#F7941D]" : "bg-slate-300"}`} />
                        <span className="text-sm text-slate-600">{c.status}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(c)}
                          title="Edit customer"
                          className="icon-shake p-2 rounded-lg text-slate-400 hover:text-[#F7941D] hover:bg-orange-50 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(c)}
                          title="Delete customer"
                          className="icon-shake p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!isLoadingData && filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      <p className="text-sm text-slate-500">No customers match your search</p>
                    </td>
                  </tr>
                )}

                {isLoadingData && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <Loader2 className="mx-auto mb-2 h-6 w-6 text-[#F7941D] animate-spin" />
                      <p className="text-sm text-slate-500">Loading customers...</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm backdrop-anim pt-20" onClick={closeModal}>
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl ${isClosing ? "modal-anim-out" : "modal-anim"}`}
          >
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center">
                  {editingId ? <Pencil className="h-4.5 w-4.5 text-[#F7941D]" /> : <UserCircle2 className="h-5 w-5 text-[#F7941D]" />}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{editingId ? "Edit Customer" : "New Customer"}</h2>
                  <p className="text-xs text-slate-500">{editingId ? "Update the customer's details" : "Fill in the details to add a customer"}</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
              <div>
                <p className="text-xs font-semibold text-[#F7941D] uppercase tracking-wide mb-3">Basic Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Customer Code" icon={Hash}>
                    <input value={form.customer_code} onChange={update("customer_code")} disabled={!!editingId} className={`${inputClass} ${editingId ? "opacity-60 cursor-not-allowed" : ""}`} />
                    {errors.customer_code && <p className="text-xs text-red-500 mt-1">{errors.customer_code}</p>}
                  </Field>
                  <Field label="Role" icon={Shield}>
                    <input value={form.role} readOnly className={`${inputClass} bg-slate-100 cursor-not-allowed`} />
                  </Field>
                  <Field label="Full Name" icon={UserCircle2}>
                    <input value={form.name} onChange={update("name")} placeholder="e.g. Rohit Sharma" className={inputClass} />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </Field>
                  <Field label="Email" icon={Mail}>
                    <input value={form.email} onChange={update("email")} placeholder="name@company.com" className={inputClass} />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </Field>
                  <Field label="Phone" icon={Phone}>
                    <input value={form.phone} onChange={update("phone")} placeholder="+91 98765 43210" className={inputClass} />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </Field>
                  <Field label={editingId ? "Password (optional)" : "Password"} icon={Lock}>
                    <input type="password" value={form.password} onChange={update("password")} placeholder={editingId ? "Leave blank to keep existing" : "Set a login password"} className={inputClass} />
                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                  </Field>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#F7941D] uppercase tracking-wide mb-3">Customer Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Company Name" icon={Building2}>
                    <input value={form.company_name} onChange={update("company_name")} className={inputClass} />
                    {errors.company_name && <p className="text-xs text-red-500 mt-1">{errors.company_name}</p>}
                  </Field>
                  <Field label="GST Number" icon={Hash}>
                    <input value={form.gst_number} onChange={update("gst_number")} placeholder="22AAAAA0000A1Z5" className={inputClass} />
                  </Field>
                  <Field label="Customer Type" icon={Users}>
                    <div className="relative">
                      <select value={form.customer_type} onChange={update("customer_type")} className={`${inputClass} appearance-none pr-9`}>
                        {CUSTOMER_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                      </select>
                      <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </Field>
                  <Field label="Organization ID" icon={Building2}>
                    <input
                      value={form.organization_id}
                      onChange={update("organization_id")}
                      className={`${inputClass} ${isAdminLikeRole(user?.role) ? "" : "bg-slate-100 cursor-not-allowed"}`}
                      readOnly={!isAdminLikeRole(user?.role)}
                    />
                  </Field>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#F7941D] uppercase tracking-wide mb-3">Address</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Address" icon={MapPin} span>
                    <input value={form.address} onChange={update("address")} className={inputClass} />
                  </Field>
                  <Field label="City">
                    <input value={form.city} onChange={update("city")} className={inputClass} />
                  </Field>
                  <Field label="State">
                    <input value={form.state} onChange={update("state")} className={inputClass} />
                  </Field>
                  <Field label="Pincode">
                    <input value={form.pincode} onChange={update("pincode")} className={inputClass} />
                  </Field>
                  <Field label="Country" icon={Globe}>
                    <input value={form.country} onChange={update("country")} className={inputClass} />
                  </Field>
                  <Field label="Status" icon={CheckCircle2}>
                    <div className="relative">
                      <select value={form.status} onChange={update("status")} className={`${inputClass} appearance-none pr-9`}>
                        {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                      <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </Field>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F7941D] text-white text-sm font-medium hover:bg-[#e8831a] active:scale-[0.98] transition-all disabled:opacity-70 shadow-sm">
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {editingId ? "Updating..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      {editingId ? "Save Changes" : "Create Customer"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm backdrop-anim" onClick={closeDeleteModal}>
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 ${isDeleteClosing ? "modal-anim-out" : "modal-anim"}`}
          >
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-base font-semibold text-slate-900">Delete customer?</h3>
                <p className="text-sm text-slate-500 mt-1">
                  This will permanently remove <span className="font-medium text-slate-700">{deleteTarget.name}</span> ({deleteTarget.customer_code}) from your customer list.
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button type="button" onClick={closeDeleteModal} className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
              <button type="button" onClick={confirmDelete} disabled={deleting} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-70 shadow-sm">
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {justAddedCode && (
        <div className="fixed bottom-6 left-1/2 toast-anim z-50">
          <div className="flex items-center gap-2 bg-slate-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg">
            <CheckCircle2 size={16} className="text-[#F7941D]" />
            Customer {justAddedCode} saved successfully
          </div>
        </div>
      )}
    </div>
  );
}
