import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Building2, Image, Monitor, Palette, RotateCcw, Save, Sparkles, Upload, Check } from "lucide-react";
import {
  getMyOrganization,
  updateMyOrganization,
  uploadMyBrandingAssets,
} from "../services/api.js/settingsService.js";
import {
  BRANDING_UPDATED_EVENT,
  DEFAULT_BRANDING,
  THEME_PRESETS,
  extractThemeFromImage,
  getThemeStyle,
  resolveBrandingAssetUrl,
} from "../utils/branding.js";

const defaults = {
  name: "", code: "", logo: "", browser_title: "", favicon: "",
  primary_color: DEFAULT_BRANDING.primary_color, secondary_color: DEFAULT_BRANDING.secondary_color,
  accent_color: DEFAULT_BRANDING.accent_color, sidebar_color: DEFAULT_BRANDING.sidebar_color,
  gst_number: "", pan_number: "",
  cin_number: "", email: "", phone: "", website: "", address: "", city: "", state: "",
  country: "India", pincode: "", timezone: "Asia/Kolkata", currency: "INR", date_format: "DD/MM/YYYY",
  invoice_prefix: "INV", support_email: "", billing_email: "", bank_name: "", bank_account_number: "",
  bank_ifsc: "", bank_branch: "", payment_terms: "Due on Receipt",
};

const fields = {
  identity: [
    ["name", "Organization Name"], ["code", "Organization Code"], ["email", "Primary Email"],
    ["phone", "Phone"], ["website", "Website"], ["support_email", "Support Email"],
  ],
  legal: [["gst_number", "GST Number"], ["pan_number", "PAN Number"], ["cin_number", "CIN Number"]],
  address: [["address", "Address"], ["city", "City"], ["state", "State"], ["country", "Country"], ["pincode", "Pincode"]],
  finance: [
    ["bank_name", "Bank Name"], ["bank_account_number", "Bank Account Number"], ["bank_ifsc", "Bank IFSC"],
    ["bank_branch", "Bank Branch"], ["billing_email", "Billing Email"], ["payment_terms", "Payment Terms"],
  ],
};

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/x-icon", "image/vnd.microsoft.icon"];

const useImagePreview = (file, reference) => {
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (!file) {
      setPreview(resolveBrandingAssetUrl(reference));
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, reference]);
  return preview;
};

export default function Settings() {
  const [form, setForm] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detectingColors, setDetectingColors] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const logoPreview = useImagePreview(logoFile, form.logo);
  const faviconPreview = useImagePreview(faviconFile, form.favicon);

  useEffect(() => {
    getMyOrganization()
      .then((response) => setForm({ ...defaults, ...(response.data || {}) }))
      .catch((error) => toast.error(error.response?.data?.message || "Settings load nahi hui"))
      .finally(() => setLoading(false));
  }, []);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const applyDetectedTheme = async (source) => {
    if (!source) return toast.error("Pehle logo select ya logo URL enter karein");
    setDetectingColors(true);
    try {
      const detectedTheme = await extractThemeFromImage(source);
      setForm((current) => ({ ...current, ...detectedTheme }));
      toast.success("Logo se theme colors detect ho gaye");
    } catch (error) {
      toast.error(error.message || "Logo se colors detect nahi ho sake; manual colors select karein");
    } finally {
      setDetectingColors(false);
    }
  };

  const applyPresetTheme = (preset) => {
    setForm((current) => ({
      ...current,
      primary_color: preset.primary_color,
      secondary_color: preset.secondary_color,
      accent_color: preset.accent_color,
    }));
    toast.success(`Theme switched to ${preset.name}`);
  };

  const selectImage = (setter, label, autoDetect = false) => async (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) return setter(null);
    if (!allowedImageTypes.includes(file.type)) {
      event.target.value = "";
      return toast.error(`${label} ke liye JPG, PNG, WEBP ya ICO file select karein`);
    }
    if (file.size > 2 * 1024 * 1024) {
      event.target.value = "";
      return toast.error(`${label} size 2MB se kam hona chahiye`);
    }
    setter(file);
    if (autoDetect) {
      await applyDetectedTheme(file);
    }
  };

  const resetTheme = () => {
    setForm((current) => ({
      ...current,
      primary_color: DEFAULT_BRANDING.primary_color,
      secondary_color: DEFAULT_BRANDING.secondary_color,
      accent_color: DEFAULT_BRANDING.accent_color,
      sidebar_color: DEFAULT_BRANDING.sidebar_color,
    }));
    toast.success("Default theme reset ho gaya");
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (logoFile || faviconFile) {
        const formData = new FormData();
        if (logoFile) formData.append("logo_file", logoFile);
        if (faviconFile) formData.append("favicon_file", faviconFile);
        await uploadMyBrandingAssets(formData);
      }
      const response = await updateMyOrganization(form);
      const updatedData = response.data || form;
      setForm((current) => ({ ...current, ...updatedData }));
      setLogoFile(null);
      setFaviconFile(null);
      setFileInputKey((current) => current + 1);
      window.dispatchEvent(new CustomEvent(BRANDING_UPDATED_EVENT, { detail: updatedData }));
      toast.success("Organization settings aur theme update ho gayi");
    } catch (error) {
      toast.error(error.response?.data?.message || "Settings save nahi ho saki");
    } finally {
      setSaving(false);
    }
  };

  const input = (name, label, options = {}) => (
    <label key={name} className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={options.type || "text"}
        maxLength={options.maxLength}
        value={form[name] || ""}
        onChange={change}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-slate-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        placeholder={options.placeholder || label}
      />
      {options.help && <span className="mt-1 block text-xs text-slate-500">{options.help}</span>}
    </label>
  );

  const sectionClass = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6";

  const colorControl = (name, label, help) => {
    const validColor = /^#[0-9A-F]{6}$/i.test(form[name] || "") ? form[name] : DEFAULT_BRANDING[name];
    return (
      <label key={name} className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
        <span className="block text-sm font-semibold text-slate-700">{label}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{help}</span>
        <span className="mt-3 flex items-center gap-2">
          <input type="color" name={name} value={validColor} onChange={change} className="h-11 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1" />
          <input name={name} value={form[name] || ""} onChange={change} maxLength={7} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2.5 font-mono text-sm uppercase outline-none focus:border-orange-400" />
        </span>
      </label>
    );
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 md:p-8">
      <form onSubmit={save} className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">Organization Control</p>
            <h1 className="text-3xl font-semibold text-slate-800">Organization & Theme Settings</h1>
            <p className="mt-1 text-slate-500">Company profile, preset theme palette, logo aur localization customizer.</p>
          </div>
          <button
            type="submit"
            disabled={loading || saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">Loading organization profile...</div>
        ) : (
          <>
            {/* THEME PRESET SELECTOR */}
            <section className={sectionClass}>
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-purple-50 p-2.5 text-purple-600"><Palette size={20} /></span>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">Theme Color Presets</h2>
                    <p className="text-sm text-slate-500">Choose a curated color theme or fine-tune custom brand colors.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetTheme}
                  className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  <RotateCcw size={14} /> Reset Theme
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {THEME_PRESETS.map((preset) => {
                  const isSelected =
                    form.primary_color?.toUpperCase() === preset.primary_color.toUpperCase() &&
                    form.secondary_color?.toUpperCase() === preset.secondary_color.toUpperCase();
                  return (
                    <button
                      type="button"
                      key={preset.name}
                      onClick={() => applyPresetTheme(preset)}
                      className={`group relative flex items-center justify-between rounded-xl border p-3.5 text-left transition ${
                        isSelected
                          ? "border-orange-500 bg-orange-50/30 ring-2 ring-orange-400/30"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-14 overflow-hidden rounded-lg border border-slate-200 shadow-xs">
                          <span className="h-full w-1/3" style={{ backgroundColor: preset.primary_color }} />
                          <span className="h-full w-1/3" style={{ backgroundColor: preset.secondary_color }} />
                          <span className="h-full w-1/3" style={{ backgroundColor: preset.accent_color }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{preset.name}</p>
                          <p className="font-mono text-[11px] text-slate-400">{preset.primary_color}</p>
                        </div>
                      </div>
                      {isSelected && <span className="rounded-full bg-orange-500 p-1 text-white"><Check size={14} /></span>}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="mb-3 text-sm font-semibold text-slate-700">Custom Color Palette</p>
                <div className="grid gap-4 md:grid-cols-3">
                  {colorControl("primary_color", "Primary Color", "Buttons, active menu & highlights")}
                  {colorControl("secondary_color", "Secondary Color", "Headings & dark surfaces")}
                  {colorControl("accent_color", "Accent Color", "Action badges & focus links")}
                </div>
              </div>
            </section>

            <section className={sectionClass}>
              <div className="mb-5 flex items-center gap-3">
                <span className="rounded-xl bg-orange-50 p-2.5 text-orange-500"><Monitor size={20} /></span>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Dashboard Branding</h2>
                  <p className="text-sm text-slate-500">Yahi branding organization ke admin, driver aur customer dashboard par dikhegi.</p>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-24 w-40 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-3">
                      {logoPreview ? <img src={logoPreview} alt="Organization logo preview" className="h-full w-full object-contain" /> : <Image className="text-slate-300" size={30} />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Dashboard Logo</p>
                      <p className="text-xs text-slate-500">PNG, JPG, WEBP (Max 2MB)</p>
                      <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50">
                        <Upload size={14} /> Upload Logo
                        <input key={`logo-${fileInputKey}`} type="file" accept={allowedImageTypes.join(",")} onChange={selectImage(setLogoFile, "Logo", true)} className="hidden" />
                      </label>
                    </div>
                  </div>
                  {input("browser_title", "Browser Title / Tab Name", { placeholder: "e.g. Achyuta Logistics Portal" })}
                </div>

                <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                      {faviconPreview ? <img src={faviconPreview} alt="Favicon preview" className="h-full w-full object-contain" /> : <Image className="text-slate-300" size={24} />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Browser Favicon</p>
                      <p className="text-xs text-slate-500">Square PNG, ICO (Max 2MB)</p>
                      <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50">
                        <Upload size={14} /> Upload Favicon
                        <input key={`favicon-${fileInputKey}`} type="file" accept={allowedImageTypes.join(",")} onChange={selectImage(setFaviconFile, "Favicon")} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className={sectionClass}>
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-xl bg-blue-50 p-2.5 text-blue-600"><Building2 size={20} /></span>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Identity & Contact Info</h2>
                  <p className="text-sm text-slate-500">Basic details, email, contact numbers & address.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {fields.identity.map(([name, label]) => input(name, label))}
              </div>
            </section>

            <section className={sectionClass}>
              <h2 className="mb-4 text-lg font-semibold text-slate-800">Tax & Registration</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {fields.legal.map(([name, label]) => input(name, label))}
              </div>
            </section>

            <section className={sectionClass}>
              <h2 className="mb-4 text-lg font-semibold text-slate-800">Registered Office Address</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {fields.address.map(([name, label]) => input(name, label))}
              </div>
            </section>

            <section className={sectionClass}>
              <h2 className="mb-4 text-lg font-semibold text-slate-800">Bank Account & Billing</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {fields.finance.map(([name, label]) => input(name, label))}
              </div>
            </section>
          </>
        )}
      </form>
    </div>
  );
}
