import React, { useState } from "react";
import toast from "react-hot-toast";
import { changePassword } from "../services/api.js/authService.js";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function CustomerPassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    try {
      setSubmitting(true);
      const data = await changePassword(currentPassword, newPassword);
      toast.success(data.message || "Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = "w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#F7941D]/30 focus:border-[#F7941D]";

  const PasswordField = ({ label, value, onChange, show, toggle }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input type={show ? "text" : "password"} value={value} onChange={onChange} className={fieldClass} />
        <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Change Password</h2>
        <p className="text-sm text-slate-500 mt-1">Update your login password from here</p>
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-orange-50 border border-orange-100 p-4 text-[#c97315]">
          <ShieldCheck className="h-5 w-5" />
          <p className="text-sm font-medium">Your password stays protected and is updated only for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField label="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} show={showCurrent} toggle={() => setShowCurrent((v) => !v)} />
          <PasswordField label="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} show={showNew} toggle={() => setShowNew((v) => !v)} />
          <PasswordField label="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} show={showConfirm} toggle={() => setShowConfirm((v) => !v)} />

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#F7941D] px-5 py-3 text-white text-sm font-semibold hover:bg-[#e8831a] transition-colors disabled:opacity-70"
            >
              {submitting ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
