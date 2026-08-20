import React, { useState } from "react";
import { loginUser } from "../../services/api.js/authService.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  CheckCircle,
} from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      try {
        const data = await loginUser(email, password);
        if (!data.token || !data.user) {
          throw new Error("Login response is incomplete");
        }
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success(data.message || "Logged in successfully!");
        const role = String(data.user.role || "").trim().toLowerCase().replace(/[-\s]+/g, "_");
        navigate(role === "customer" ? "/dashboard/tracking" : "/dashboard", { replace: true });
      } catch (error) {
        toast.error(error.response?.data?.message || error.message || "Login failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <React.Fragment>
      <style>{`
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .login-left {
          animation: slide-in-left 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .login-right {
          animation: slide-in-right 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .login-form {
          animation: fade-in 0.8s ease-out forwards;
        }
        .input-field {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .input-field:focus {
          box-shadow: 0 0 0 3px rgba(14, 96, 168, 0.2);
          border-color: #0E60A8;
        }
        .input-field:focus + .input-icon {
          color: #0E60A8;
        }
      `}</style>

      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

          {/* Left Panel - Welcome Section */}
          <div className="login-left w-full md:w-[48%] bg-gradient-to-br from-[#0A2342] via-[#0E60A8] to-[#0A2342] p-8 md:p-12 flex flex-col justify-center relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl" />

            <div className="relative z-10">
              {/* Logo */}
              <div className="mb-8">
                <div className="inline-flex items-center justify-center bg-white rounded-2xl px-5 py-3 shadow-xl shadow-blue-950/30">
                  <img
                    src="/logo.png"
                    alt="Globalex Logistics"
                    className="h-14 w-auto max-w-[230px] object-contain"
                  />
                </div>
              </div>

              {/* Welcome content */}
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                Welcome Back!
              </h1>
              <p className="text-white/80 text-sm md:text-base leading-relaxed mb-8">
                Enterprise Logistics Management Platform — Log in to access fleet, shipments, live tracking & invoices.
              </p>

              {/* User badge */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-10 w-10 rounded-full border-2 border-white/20 flex items-center justify-center bg-white/10"
                    >
                      <User className="h-4 w-4 text-white/80" />
                    </div>
                  ))}
                </div>
                <span className="text-white/70 text-sm font-medium">Trusted across 100+ branches</span>
              </div>

              {/* Features list */}
              <div className="space-y-3">
                {[
                  "Real-time GPS shipment tracking",
                  "Automated E-Way Bill & Invoice generation",
                  "Smart fleet & driver assignment",
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-white/90">
                    <CheckCircle className="h-4 w-4 text-[#F7941D] shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Login Form */}
          <div className="login-right w-full md:w-[52%] p-8 md:p-12 flex flex-col justify-center bg-white">
            <div className="max-w-md w-full mx-auto">
              <div className="mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0E60A8]">Secure Portal Access</span>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">Sign In</h2>
                <p className="text-slate-500 text-sm mt-1">Enter your registered email and password</p>
              </div>

              <form onSubmit={handleSubmit} className="login-form space-y-5">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. admin@globalex.com"
                      className={`input-field w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl border ${
                        errors.email ? "border-red-400 bg-red-50/20" : "border-slate-200"
                      } text-slate-800 outline-none text-sm`}
                    />
                    <Mail className="input-icon absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700">
                      Password
                    </label>
                    <a href="#forgot" className="text-xs font-semibold text-[#0E60A8] hover:underline">
                      Forgot Password?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className={`input-field w-full pl-11 pr-11 py-3 bg-slate-50 rounded-xl border ${
                        errors.password ? "border-red-400 bg-red-50/20" : "border-slate-200"
                      } text-slate-800 outline-none text-sm`}
                    />
                    <Lock className="input-icon absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#0E60A8] focus:ring-[#0E60A8]"
                    />
                    <span className="text-xs text-slate-600 font-medium">Remember me on this device</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#0E60A8] to-[#0A2342] hover:opacity-95 text-white font-bold py-3.5 rounded-xl transition duration-200 shadow-md shadow-blue-900/10 flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>SIGN IN</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </React.Fragment>
  );
}
