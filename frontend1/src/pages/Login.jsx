import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  BuildingOfficeIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(formData);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = (email, password) => {
    setFormData({ email, password });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-10">

      <div className="max-w-md w-full space-y-10">

        {/* LOGO */}
        <div className="text-center">
          <Link className="inline-flex items-center gap-3 mb-6" to="/">
            <BuildingOfficeIcon className="h-14 w-14 text-[#D4AF37]" />
            <span className="text-4xl font-extrabold text-[#D4AF37] tracking-wide">
              PropertyHub
            </span>
          </Link>

          <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
          <p className="text-gray-400 mt-2">
            Sign in to manage your properties
          </p>
        </div>

        {/* CARD */}
        <div className="p-8 rounded-2xl bg-white/10 backdrop-blur-xl shadow-2xl border border-white/10 space-y-6">

          {error && (
            <div className="bg-red-500/20 text-red-300 p-4 rounded-xl border border-red-500 flex justify-between">
              <div className="flex gap-3">
                <ExclamationCircleIcon className="h-6 w-6 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError("")}>×</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* EMAIL */}
            <div>
              <label className="text-gray-200 text-sm mb-1 block">Email</label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full bg-white/10 border border-white/20 text-white rounded-lg py-2.5 pl-10 pr-3 
                             focus:ring-2 focus:ring-[#D4AF37] outline-none placeholder-gray-400"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label className="text-gray-200 text-sm mb-1 block">Password</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/20 text-white rounded-lg py-2.5 pl-10 pr-3 
                             focus:ring-2 focus:ring-[#D4AF37] outline-none placeholder-gray-400"
                />
              </div>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] hover:bg-[#e5c56a] transition text-black font-semibold 
                         py-3 rounded-lg shadow-lg disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* ✅ TEST ACCOUNTS */}
          <div className="pt-4 border-t border-white/10">
            <p className="text-xs text-gray-400 text-center mb-2">
              TEST ACCOUNTS
            </p>

            {/* LANDLORD */}
            <button
              onClick={() => handleTestLogin("ria@example.com", "123456")}
              className="w-full text-left bg-white/5 hover:bg-white/20 border border-white/10 
                         text-gray-200 px-4 py-3 rounded-lg mb-2 transition"
            >
              <div className="flex justify-between">
                <span className="text-[#D4AF37] font-medium">
                  Ria (Landlord)
                </span>
                <span className="text-xs text-gray-300">Use →</span>
              </div>
              <p className="text-xs text-gray-400">ria@example.com</p>
            </button>

            {/* TENANT */}
            <button
              onClick={() =>
                handleTestLogin("akshatpratap@gmail.com", "123456")
              }
              className="w-full text-left bg-white/5 hover:bg-white/20 border border-white/10 
                         text-gray-200 px-4 py-3 rounded-lg transition"
            >
              <div className="flex justify-between">
                <span className="text-[#D4AF37] font-medium">
                  Akshat (Tenant)
                </span>
                <span className="text-xs text-gray-300">Use →</span>
              </div>
              <p className="text-xs text-gray-400">
                akshatpratap@gmail.com
              </p>
            </button>
          </div>
        </div>

        {/* REGISTER */}
        <p className="text-center text-gray-400 text-sm">
          Don’t have an account?{" "}
          <Link className="text-[#D4AF37] hover:text-[#e5c56a]" to="/register">
            Sign up
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;