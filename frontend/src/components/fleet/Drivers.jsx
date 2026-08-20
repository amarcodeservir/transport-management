import React,{ useCallback, useEffect, useState } from "react";
import { KeyRound, X } from "lucide-react";
import toast from "react-hot-toast";
import { createDriver, getDrivers, linkDriverLogin, resetDriverPassword } from "../../services/api.js/fleetService.js";
const initialFormState = {
  name: "",
  mobile: "",
  email: "",
  password: "",
  license_number: "",
  license_expiry: "",
  address: "",
  joining_date: "",
  status: "AVAILABLE",
};

const statusClass = (status) => {
  if (status === "AVAILABLE") return "bg-emerald-100 text-emerald-700";
  if (status === "ASSIGNED") return "bg-blue-100 text-blue-700";
  if (status === "ON_LEAVE") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
};

export default function Drivers() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [linkingDriver, setLinkingDriver] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [resettingDriver, setResettingDriver] = useState(null);
  const [resetForm, setResetForm] = useState({ password: "", confirmPassword: "" });

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getDrivers();
      setDrivers(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Drivers load nahi hue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setForm(initialFormState);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.mobile || !form.email || !form.password || !form.license_number) {
      toast.error("Name, mobile, login email, password aur license number required hain.");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password minimum 6 characters ka hona chahiye.");
      return;
    }

    setSaving(true);
    try {
      await createDriver(form);
      toast.success("Driver aur uska login create ho gaya.");
      setForm(initialFormState);
      setIsModalOpen(false);
      await fetchDrivers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Driver create nahi hua.");
    } finally {
      setSaving(false);
    }
  };

  const handleLinkLogin = async (event) => {
    event.preventDefault();
    if (!loginForm.email || loginForm.password.length < 6) return toast.error("Valid email aur minimum 6-character password required hai.");
    setSaving(true);
    try {
      await linkDriverLogin(linkingDriver.id, loginForm);
      toast.success("Existing driver ka portal login link ho gaya.");
      setLinkingDriver(null);
      setLoginForm({ email: "", password: "" });
      await fetchDrivers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Driver login link nahi hua.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (resetForm.password.length < 6) {
      return toast.error("Password minimum 6 characters ka hona chahiye.");
    }
    if (resetForm.password !== resetForm.confirmPassword) {
      return toast.error("New password aur confirm password match nahi karte.");
    }

    setSaving(true);
    try {
      await resetDriverPassword(resettingDriver.id, resetForm.password);
      toast.success("Driver ka temporary password reset ho gaya.");
      setResettingDriver(null);
      setResetForm({ password: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Driver password reset nahi hua.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50/40 p-4 lg:p-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">Step 1 - Fleet Setup</p>
            <h1 className="mt-1 text-2xl font-bold text-neutral-900">Drivers</h1>
            <p className="mt-1 text-sm text-neutral-500">Har driver ke saath secure portal login automatically create hota hai.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="self-start rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600">
            + Add Driver & Login
          </button>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          Driver ko shipment assign karne se pehle yahan uska login banayein. Wahi login driver ko sirf apni delivery, live tracking aur POD actions dikhayega.
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-20 text-center text-sm text-neutral-400">Loading drivers...</div>
          ) : drivers.length === 0 ? (
            <div className="p-20 text-center text-sm text-neutral-400">No drivers found. Pehla driver add karke flow start karein.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 font-medium text-neutral-600">
                  <tr>
                    <th className="px-6 py-4">Driver</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Login Email</th>
                    <th className="px-6 py-4">License</th>
                    <th className="px-6 py-4">Expiry</th>
                    <th className="px-6 py-4">Portal Login</th>
                    <th className="px-6 py-4">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {drivers.map((driver) => (
                    <tr key={driver.id} className="transition-colors hover:bg-neutral-50">
                      <td className="px-6 py-4 font-medium text-neutral-900">{driver.name}</td>
                      <td className="px-6 py-4 text-neutral-600">{driver.mobile}</td>
                      <td className="px-6 py-4 text-neutral-600">
                        {driver.login_email || <span className="text-neutral-400">{driver.user_id ? "Email unavailable" : "Login not created"}</span>}
                      </td>
                      <td className="px-6 py-4 uppercase text-neutral-600">{driver.license_number}</td>
                      <td className="px-6 py-4 text-neutral-600">{driver.license_expiry ? new Date(driver.license_expiry).toLocaleDateString("en-IN") : "N/A"}</td>
                      <td className="px-6 py-4">
                        {driver.user_id ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"><KeyRound size={12} /> Linked</span>
                            <button
                              type="button"
                              onClick={() => {
                                setResettingDriver(driver);
                                setResetForm({ password: "", confirmPassword: "" });
                              }}
                              className="rounded-lg bg-orange-50 px-2.5 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                            >
                              Reset Password
                            </button>
                          </div>
                        ) : <button onClick={() => { setLinkingDriver(driver); setLoginForm({ email: "", password: "" }); }} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"><KeyRound size={12} /> Create Login</button>}
                      </td>
                      <td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(driver.status)}`}>{String(driver.status || "UNKNOWN").replaceAll("_", " ")}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 pt-20">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 bg-orange-50/30 px-6 py-4">
              <div><h2 className="text-lg font-bold text-neutral-800">Add Driver & Portal Login</h2><p className="text-xs text-neutral-500">Login credentials driver ke saath securely share karein.</p></div>
              <button type="button" onClick={closeModal} className="text-neutral-400 hover:text-neutral-700"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form id="driverForm" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-neutral-700">Driver Name *<input name="name" value={form.name} onChange={handleChange} required className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-orange-500" placeholder="Ramesh Singh" /></label>
                <label className="text-sm font-medium text-neutral-700">Contact Number *<input name="mobile" value={form.mobile} onChange={handleChange} required className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-orange-500" placeholder="9876543210" /></label>
                <label className="text-sm font-medium text-neutral-700">Driver Login Email *<input type="email" name="email" value={form.email} onChange={handleChange} required className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-orange-500" placeholder="driver@company.com" /></label>
                <label className="text-sm font-medium text-neutral-700">Temporary Password *<input type="password" name="password" value={form.password} onChange={handleChange} minLength="6" required className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-orange-500" placeholder="Minimum 6 characters" /></label>
                <label className="text-sm font-medium text-neutral-700">License Number *<input name="license_number" value={form.license_number} onChange={handleChange} required className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-orange-500" placeholder="MH1220110001234" /></label>
                <label className="text-sm font-medium text-neutral-700">License Expiry<input type="date" name="license_expiry" value={form.license_expiry} onChange={handleChange} className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-orange-500" /></label>
                <label className="text-sm font-medium text-neutral-700">Joining Date<input type="date" name="joining_date" value={form.joining_date} onChange={handleChange} className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-orange-500" /></label>
                <label className="text-sm font-medium text-neutral-700">Initial Availability<select name="status" value={form.status} onChange={handleChange} className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 outline-none focus:border-orange-500"><option value="AVAILABLE">Available</option><option value="ON_LEAVE">On Leave</option><option value="INACTIVE">Inactive</option></select></label>
                <label className="text-sm font-medium text-neutral-700 sm:col-span-2">Address<textarea name="address" value={form.address} onChange={handleChange} rows="3" className="mt-1 w-full resize-none rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-orange-500" placeholder="Full residential address" /></label>
              </form>
            </div>

            <div className="flex justify-end gap-3 border-t border-neutral-100 bg-neutral-50 px-6 py-4">
              <button type="button" onClick={closeModal} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-200">Cancel</button>
              <button type="submit" form="driverForm" disabled={saving} className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:opacity-60">{saving ? "Creating..." : "Create Driver Login"}</button>
            </div>
          </div>
        </div>
      )}

      {linkingDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleLinkLogin} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-orange-500">Link Existing Driver</p><h2 className="text-xl font-bold text-neutral-800">{linkingDriver.name}</h2><p className="text-xs text-neutral-500">Is driver ke liye portal credentials create honge.</p></div><button type="button" onClick={() => setLinkingDriver(null)}><X size={20} /></button></div>
            <label className="block text-sm font-medium text-neutral-700">Login Email *<input required type="email" value={loginForm.email} onChange={(event) => setLoginForm((previous) => ({ ...previous, email: event.target.value }))} className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-orange-500" placeholder="driver@company.com" /></label>
            <label className="block text-sm font-medium text-neutral-700">Temporary Password *<input required minLength="6" type="password" value={loginForm.password} onChange={(event) => setLoginForm((previous) => ({ ...previous, password: event.target.value }))} className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-orange-500" placeholder="Minimum 6 characters" /></label>
            <div className="flex justify-end gap-3"><button type="button" onClick={() => setLinkingDriver(null)} className="rounded-xl px-4 py-2 text-sm text-neutral-600">Cancel</button><button disabled={saving} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Linking..." : "Create & Link Login"}</button></div>
          </form>
        </div>
      )}

      {resettingDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleResetPassword} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-orange-500">Reset Driver Password</p>
                <h2 className="text-xl font-bold text-neutral-800">{resettingDriver.name}</h2>
                <p className="mt-1 text-xs text-neutral-500">Naya temporary password driver ke saath securely share karein.</p>
              </div>
              <button type="button" disabled={saving} onClick={() => setResettingDriver(null)} className="disabled:opacity-50"><X size={20} /></button>
            </div>
            <label className="block text-sm font-medium text-neutral-700">
              New Temporary Password *
              <input
                required
                minLength="6"
                type="password"
                value={resetForm.password}
                onChange={(event) => setResetForm((previous) => ({ ...previous, password: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-orange-500"
                placeholder="Minimum 6 characters"
              />
            </label>
            <label className="block text-sm font-medium text-neutral-700">
              Confirm New Password *
              <input
                required
                minLength="6"
                type="password"
                value={resetForm.confirmPassword}
                onChange={(event) => setResetForm((previous) => ({ ...previous, confirmPassword: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-orange-500"
                placeholder="Password dobara enter karein"
              />
            </label>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Reset ke baad purana password turant kaam karna band kar dega.
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" disabled={saving} onClick={() => setResettingDriver(null)} className="rounded-xl px-4 py-2 text-sm text-neutral-600 disabled:opacity-50">Cancel</button>
              <button disabled={saving} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Resetting..." : "Reset Password"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
