// src/app/admin/settings/page.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  User,
  Mail,
  Camera,
  Trash2,
  Save,
  RotateCcw,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const API_BASE = "https://ifbb-master.onrender.com";

interface AdminProfile {
  _id: string;
  fullName: string;
  email: string;
  image?: string;
}

interface FormData {
  fullName: string;
  email: string;
  avatarFile: File | null;
  avatarPreview: string | null;
  changePassword: {
    current: string;
    new: string;
    confirm: string;
  };
}

const INITIAL_FORM: FormData = {
  fullName: "",
  email: "",
  avatarFile: null,
  avatarPreview: null,
  changePassword: { current: "", new: "", confirm: "" },
};

export default function AdminSettings() {
  const { token, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Profile fetch
  useEffect(() => {
    if (!token || !isAuthenticated) return;

    const fetchProfile = async () => {
      setLoading(true);
      setStatus(null);

      try {
        const res = await fetch(`${API_BASE}/api/admin/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch profile - ${res.status}`);
        }

        const data = await res.json();

        if (data.success && data.admin) {
          const admin = data.admin;
          setProfile(admin);
          setForm({
            fullName: admin.fullName || "",
            email: admin.email || "",
            avatarFile: null,
            avatarPreview: admin.image || null,
            changePassword: { current: "", new: "", confirm: "" },
          });
        } else {
          throw new Error(data.message || "Invalid profile data");
        }
      } catch (err: any) {
        console.error("Fetch error:", err);
        setStatus({ type: "error", message: err.message || "Profile load nahi ho paya" });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, isAuthenticated]);

  // Cleanup blob URL
  useEffect(() => {
    return () => {
      if (form.avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(form.avatarPreview);
      }
    };
  }, [form.avatarPreview]);

  const isDirty =
    form.fullName !== (profile?.fullName || "") ||
    form.email !== (profile?.email || "") ||
    !!form.avatarFile ||
    form.changePassword.current !== "" ||
    form.changePassword.new !== "" ||
    form.changePassword.confirm !== "";

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (form.avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(form.avatarPreview);
    }

    const preview = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, avatarFile: file, avatarPreview: preview }));
    setStatus(null);
  };

  const removeAvatar = () => {
    if (form.avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(form.avatarPreview);
    }
    setForm((prev) => ({ ...prev, avatarFile: null, avatarPreview: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!profile || !token) return;

    setStatus(null);
    setSaving(true);

    // Client-side password check (backend ke saath match rakhne ke liye)
    if (form.changePassword.new || form.changePassword.confirm || form.changePassword.current) {
      if (!form.changePassword.current) {
        setStatus({ type: "error", message: "Current password daalna zaroori hai" });
        setSaving(false);
        return;
      }
      if (form.changePassword.new.length < 6) {
        setStatus({ type: "error", message: "Naya password kam se kam 6 characters ka hona chahiye" });
        setSaving(false);
        return;
      }
      if (form.changePassword.new !== form.changePassword.confirm) {
        setStatus({ type: "error", message: "Naya password aur confirm password match nahi kar rahe" });
        setSaving(false);
        return;
      }
    }

    try {
      const fd = new FormData();
      fd.append("fullName", form.fullName.trim());
      fd.append("email", form.email.trim());
      if (form.avatarFile) {
        fd.append("image", form.avatarFile);
      }

      if (form.changePassword.new) {
        fd.append("currentPassword", form.changePassword.current);
        fd.append("newPassword", form.changePassword.new);
        fd.append("confirmPassword", form.changePassword.confirm);    
      }

      const res = await fetch(`${API_BASE}/api/admin/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
        credentials: "include",
      });

      if (!res.ok) {
        let errorMessage = `Update fail hua (HTTP ${res.status})`;
        try {
          const errData = await res.json();
          errorMessage = errData.message || errData.error || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      const result = await res.json();

      setStatus({
        type: "success",
        message: result.message || "Profile successfully update ho gaya!",
      });

      // Password fields reset
      setForm((prev) => ({
        ...prev,
        avatarFile: null,
        changePassword: { current: "", new: "", confirm: "" },
      }));

      // Latest profile refresh
      const refreshRes = await fetch(`${API_BASE}/api/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (refreshRes.ok) {
        const newData = await refreshRes.json();
        if (newData.success && newData.admin) {
          setProfile(newData.admin);
          setForm((prev) => ({
            ...prev,
            fullName: newData.admin.fullName || prev.fullName,
            email: newData.admin.email || prev.email,
            avatarPreview: newData.admin.image || prev.avatarPreview,
          }));
        }
      }
    } catch (err: any) {
      console.error("Save error:", err);
      setStatus({
        type: "error",
        message: err.message || "Kuch gadbad ho gayi, thodi der baad try karo",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!profile) return;
    setForm({
      fullName: profile.fullName || "",
      email: profile.email || "",
      avatarFile: null,
      avatarPreview: profile.image || null,
      changePassword: { current: "", new: "", confirm: "" },
    });
    setStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Profile load ho raha hai...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-800">My Profile</h1>
          <p className="text-slate-600 mt-2">Manage your details and password here</p>
        </div>

        {status && (
          <div
            className={`rounded-2xl p-5 flex items-center gap-4 shadow-lg border-l-4 ${
              status.type === "success"
                ? "bg-green-50 border-green-500 text-green-800"
                : "bg-red-50 border-red-500 text-red-800"
            }`}
          >
            {status.type === "success" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
            <span className="font-semibold">{status.message}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/60 p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative group mb-6">
                <div className="w-40 h-40 rounded-full overflow-hidden ring-4 ring-indigo-100 shadow-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-1">
                  <div className="w-full h-full rounded-full overflow-hidden bg-white">
                    {form.avatarPreview ? (
                      <img src={form.avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : profile?.image ? (
                      <img src={profile.image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                        <User className="w-20 h-20 text-indigo-400" />
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                >
                  <Camera className="w-10 h-10 text-white" />
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transition text-sm font-medium flex items-center gap-2"
                >
                  <Camera size={16} /> Update Image
                </button>
{/* 
                {(form.avatarPreview || profile?.image) && (
                  <button
                    onClick={removeAvatar}
                    className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl border border-red-200 hover:bg-red-100 transition text-sm font-medium flex items-center gap-2"
                  >
                    <Trash2 size={16} /> Hatao
                  </button>
                )} */}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Fields */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 text-black md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <User size={16} /> Full Name
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 bg-white/80 transition"
                    placeholder="Sanjay Kumar Chauhan"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <Mail size={16} /> Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 bg-white/80 transition"
                    placeholder="admin@gmail.com"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl text-black shadow-2xl border border-white/60 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Update Password</h2>
              <p className="text-sm text-slate-500">Leave it blank if you don't want to change the password.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <input
              type="password"
              placeholder="Current Password"
              value={form.changePassword.current}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  changePassword: { ...s.changePassword, current: e.target.value },
                }))
              }
              className="px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 bg-white/80 transition"
            />
            <input
              type="password"
              placeholder="New Password"
              value={form.changePassword.new}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  changePassword: { ...s.changePassword, new: e.target.value },
                }))
              }
              className="px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 bg-white/80 transition"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={form.changePassword.confirm}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  changePassword: { ...s.changePassword, confirm: e.target.value },
                }))
              }
              className="px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 bg-white/80 transition"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <button
            onClick={handleReset}
            disabled={saving}
            className="px-8 py-4 rounded-xl border-2 border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} /> Reset
          </button>

          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className={`px-10 py-4 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-2xl flex items-center justify-center gap-3 min-w-[180px] ${
              !isDirty || saving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-105"
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}