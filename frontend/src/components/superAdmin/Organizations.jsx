import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { PlusCircle, Edit, Building2, AlertCircle } from "lucide-react";
import {
  getAllOrganizations,
  createOrganization,
  updateOrganization
} from "../../services/api.js/organizationService";

const defaultForm = {
  name: "",
  code: "",
  email: "",
  phone: "",
  gst_number: "",
  address: "",
  city: "",
  state: "",
  country: "",
  status: "ACTIVE"
};

export default function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const res = await getAllOrganizations();
      if (res?.success) {
        setOrganizations(res.data || []);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const openModal = (org = null) => {
    if (org) {
      setIsEditMode(true);
      setEditId(org.id);
      setForm({
        name: org.name || "",
        code: org.code || "",
        email: org.email || "",
        phone: org.phone || "",
        gst_number: org.gst_number || "",
        address: org.address || "",
        city: org.city || "",
        state: org.state || "",
        country: org.country || "",
        status: org.status || "ACTIVE"
      });
    } else {
      setIsEditMode(false);
      setEditId(null);
      setForm(defaultForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForm(defaultForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code || !form.email) {
      toast.error("Name, Code, and Email are required");
      return;
    }

    try {
      setSubmitting(true);
      if (isEditMode) {
        const res = await updateOrganization(editId, form);
        if (res.success) {
          toast.success("Organization updated successfully");
          fetchOrganizations();
          closeModal();
        }
      } else {
        const res = await createOrganization(form);
        if (res.success) {
          toast.success("Organization created successfully");
          fetchOrganizations();
          closeModal();
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Organizations</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all registered companies and their statuses.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-[#F7941D] text-white rounded-lg font-medium hover:bg-[#e08619] transition-colors"
        >
          <PlusCircle size={18} />
          <span>Add Organization</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-[#F7941D] rounded-full animate-spin"></div>
          </div>
        ) : organizations.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Building2 className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No Organizations Found</h3>
            <p className="text-slate-500 mt-1 mb-6 max-w-sm">You haven't added any organizations yet. Click the button below to get started.</p>
            <button
              onClick={() => openModal()}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
            >
              Add First Organization
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-[#F7941D] font-bold">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{org.name}</p>
                          <p className="text-xs text-slate-500">Code: {org.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-slate-700">{org.email}</p>
                      <p className="text-xs text-slate-500">{org.phone || "N/A"}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-slate-700">{org.city || "Unknown"}, {org.state || "Unknown"}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${org.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {org.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => openModal(org)}
                        className="p-2 text-slate-400 hover:text-[#F7941D] hover:bg-orange-50 rounded-lg transition-colors"
                        title="Edit Organization"
                      >
                        <Edit size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-20">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-xl transform transition-all">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {isEditMode ? "Edit Organization" : "Create New Organization"}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Company Name *</label>
                  <input required name="name" value={form.name} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#F7941D] focus:ring-1 focus:ring-[#F7941D] outline-none" placeholder="Enter company name" />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Organization Code *</label>
                  <input required name="code" value={form.code} onChange={handleChange} disabled={isEditMode} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 disabled:bg-slate-100 disabled:text-slate-500 focus:border-[#F7941D] outline-none" placeholder="e.g. ORG-001" />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">GST Number</label>
                  <input name="gst_number" value={form.gst_number} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#F7941D] outline-none" placeholder="Optional GSTIN" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Email Address *</label>
                  <input required type="email" name="email" value={form.email} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#F7941D] outline-none" placeholder="contact@company.com" />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Phone Number</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#F7941D] outline-none" placeholder="+91 98765 43210" />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2 mt-2">
                  <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Location Details</h3>
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Full Address</label>
                  <input name="address" value={form.address} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#F7941D] outline-none" placeholder="Street, building, area..." />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">City</label>
                  <input name="city" value={form.city} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#F7941D] outline-none" placeholder="City" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">State</label>
                  <input name="state" value={form.state} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#F7941D] outline-none" placeholder="State" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Country</label>
                  <input name="country" value={form.country} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#F7941D] outline-none" placeholder="Country" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#F7941D] outline-none bg-white">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 text-sm font-bold text-white bg-[#F7941D] hover:bg-[#e08619] rounded-xl transition-colors disabled:opacity-70 shadow-md shadow-orange-600/20">
                  {submitting ? "Saving..." : isEditMode ? "Save Changes" : "Create Organization"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
