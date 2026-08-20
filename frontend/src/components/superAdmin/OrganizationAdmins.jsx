import React,{ useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Edit3, KeyRound, PlusCircle, UserCog, X } from "lucide-react";
import {
  getOrganizationAdmins,
  createOrganizationAdmin,
  getAllOrganizations,
  updateOrganizationAdmin,
  resetOrganizationAdminPassword,
} from "../../services/api.js/organizationService";

const defaultForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  organization_id: "",
  status: "ACTIVE"
};

export default function OrganizationAdmins() {
  const [admins, setAdmins] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [resettingAdmin, setResettingAdmin] = useState(null);
  const [resetForm, setResetForm] = useState({ password: "", confirmPassword: "" });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [adminsRes, orgsRes] = await Promise.all([
        getOrganizationAdmins(),
        getAllOrganizations()
      ]);
      
      if (adminsRes?.success) setAdmins(adminsRes.data || []);
      if (orgsRes?.success) setOrganizations(orgsRes.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = () => {
    setEditingAdmin(null);
    setForm(defaultForm);
    setIsModalOpen(true);
  };

  const openEdit = (admin) => {
    setEditingAdmin(admin);
    setForm({
      name: admin.name || "",
      email: admin.email || "",
      password: "",
      phone: admin.phone || "",
      organization_id: String(admin.organization_id || ""),
      status: String(admin.status || "ACTIVE").toUpperCase(),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAdmin(null);
    setForm(defaultForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || (!editingAdmin && !form.password) || !form.organization_id) {
      toast.error("Name, Email, Organization aur new admin ke liye password required hai");
      return;
    }
    if (!editingAdmin && form.password.length < 6) return toast.error("Password minimum 6 characters ka hona chahiye");

    try {
      setSubmitting(true);
      const res = editingAdmin
        ? await updateOrganizationAdmin(editingAdmin.id, form)
        : await createOrganizationAdmin(form);
      if (res.success) {
        toast.success(editingAdmin ? "Organization Admin updated successfully" : "Organization Admin created successfully");
        fetchData();
        closeModal();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (resetForm.password.length < 6) return toast.error("Password minimum 6 characters ka hona chahiye");
    if (resetForm.password !== resetForm.confirmPassword) return toast.error("Password aur confirmation match nahi karte");
    setSubmitting(true);
    try {
      await resetOrganizationAdminPassword(resettingAdmin.id, resetForm.password);
      toast.success("Organization Admin password reset ho gaya");
      setResettingAdmin(null);
      setResetForm({ password: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Password reset nahi hua");
    } finally {
      setSubmitting(false);
    }
  };

  const getOrgName = (orgId) => {
    const org = organizations.find(o => o.id === parseInt(orgId, 10));
    return org ? org.name : "Unknown Org";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Organization Admins</h1>
          <p className="text-sm text-slate-500 mt-1">Manage admins for the registered organizations.</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#F7941D] text-white rounded-lg font-medium hover:bg-[#e08619] transition-colors"
        >
          <PlusCircle size={18} />
          <span>Add Admin</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-[#F7941D] rounded-full animate-spin"></div>
          </div>
        ) : admins.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <UserCog className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No Admins Found</h3>
            <p className="text-slate-500 mt-1 mb-6 max-w-sm">There are no organization admins registered yet.</p>
            <button
              onClick={openModal}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
            >
              Add First Admin
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin Name</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Organization</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-[#F7941D] font-bold">
                          {admin.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{admin.name}</p>
                          <p className="text-xs text-slate-500">Role: Org Admin</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-slate-700">{admin.email}</p>
                      <p className="text-xs text-slate-500">{admin.phone || "N/A"}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md inline-block">
                        {getOrgName(admin.organization_id)}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${String(admin.status).toUpperCase() === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {admin.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => openEdit(admin)} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"><Edit3 size={13} /> Edit</button>
                        <button type="button" onClick={() => { setResettingAdmin(admin); setResetForm({ password: "", confirmPassword: "" }); }} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100"><KeyRound size={13} /> Reset</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-xl transform transition-all">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">{editingAdmin ? "Edit Organization Admin" : "Create Organization Admin"}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Admin Name *</label>
                  <input required name="name" value={form.name} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#F7941D] outline-none" placeholder="Full Name" />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Email Address *</label>
                  <input required type="email" name="email" value={form.email} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#F7941D] outline-none" placeholder="admin@company.com" />
                </div>
                
                {!editingAdmin && <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Temporary Password *</label>
                  <input required minLength="6" type="password" name="password" value={form.password} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#F7941D] outline-none" placeholder="Minimum 6 characters" />
                </div>}

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Phone Number</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#F7941D] outline-none" placeholder="+91 98765 43210" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Select Organization *</label>
                  <select required name="organization_id" value={form.organization_id} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#F7941D] outline-none bg-white">
                    <option value="" disabled>Select an organization</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name} ({org.code})</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Account Status *</label>
                  <select required name="status" value={form.status} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#F7941D] outline-none bg-white"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 text-sm font-bold text-white bg-[#F7941D] hover:bg-[#e08619] rounded-xl transition-colors disabled:opacity-70 shadow-md shadow-orange-600/20">
                  {submitting ? "Saving..." : editingAdmin ? "Save Changes" : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resettingAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <form onSubmit={handleResetPassword} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-orange-500">Reset Password</p><h2 className="mt-1 text-xl font-bold text-slate-900">{resettingAdmin.name}</h2><p className="mt-1 text-xs text-slate-500">Naya temporary password admin ke saath securely share karein.</p></div><button type="button" disabled={submitting} onClick={() => setResettingAdmin(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={19} /></button></div>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700">New temporary password<input required minLength="6" type="password" value={resetForm.password} onChange={(event) => setResetForm((previous) => ({ ...previous, password: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-orange-400" /></label>
              <label className="block text-sm font-medium text-slate-700">Confirm password<input required minLength="6" type="password" value={resetForm.confirmPassword} onChange={(event) => setResetForm((previous) => ({ ...previous, confirmPassword: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-orange-400" /></label>
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" disabled={submitting} onClick={() => setResettingAdmin(null)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button><button disabled={submitting} className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{submitting ? "Resetting..." : "Reset Password"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
