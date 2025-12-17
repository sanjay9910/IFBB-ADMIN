"use client";

import { useDispatch, useSelector } from "react-redux";
import { adminLogin } from "@/features/auth/authSlice";
import type { AppDispatch, RootState } from "@/store/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const { loading, error, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("12345678");

  /* ✅ Login success → dashboard */
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    dispatch(adminLogin({ email, password }));
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-black">
      {/* ================= LEFT IMAGE SECTION ================= */}
      <div className="relative hidden lg:flex items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=1600&auto=format&fit=crop"
          alt="Bodybuilder"
          className="absolute inset-0 w-full h-full object-cover scale-110 animate-[slowZoom_20s_linear_infinite]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />

        <div className="relative z-10 px-10">
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4 animate-fadeInUp">
            Welcome To Admin Panel
          </h1>
          <p className="text-gray-300 max-w-md animate-fadeInUp delay-150">
            Power your fitness empire. Manage courses, trainers, and athletes
            with strength & precision.
          </p>
        </div>
      </div>

      {/* ================= RIGHT LOGIN SECTION ================= */}
      <div className="flex items-center justify-center px-6">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8 animate-fadeIn"
        >
          {/* Logo / Title */}
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-2xl font-bold">
              IFBB
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Admin Login
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Login to manage fitness courses & content
            </p>
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition"
              placeholder="admin@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-3 text-center text-red-600 text-sm animate-shake">
              {error}
            </div>
          )}

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-black text-white rounded-lg font-semibold tracking-wide hover:bg-gray-900 transition disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-6">
            © {new Date().getFullYear()} IFBB Fitness Platform
          </p>
        </form>
      </div>

      {/* ================= ANIMATIONS ================= */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slowZoom {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.15);
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-4px);
          }
          75% {
            transform: translateX(4px);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
