// src/app/admin/settings/page.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { User, Mail, Globe, Bell, Lock, Check, X, Camera, Trash2, Save, RotateCcw, Shield } from "lucide-react";
import Img from '../../../../src/components/assets/sanjay.jpeg'

type ProfileForm = {
  name: string;
  email: string;
  avatarFile?: File | null;
  avatarPreview?: string | null;
  notifications: {
    email: boolean;
    sms: boolean;
  };
  timezone: string;
  changePassword: {
    current: string;
    newPass: string;
    confirm: string;
  };
};

const INITIAL: ProfileForm = {
  name: "Sanjay Admin",
  email: "sanjay@ifbb.example",
  avatarFile: null,
  avatarPreview: null,
  notifications: { email: true, sms: false },
  timezone: "Asia/Kolkata",
  changePassword: { current: "", newPass: "", confirm: "" },
};

export default function AdminSettings() {
  const [form, setForm] = useState<ProfileForm>(INITIAL);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const isDirty =
    form.name !== INITIAL.name ||
    form.email !== INITIAL.email ||
    !!form.avatarFile ||
    form.notifications.email !== INITIAL.notifications.email ||
    form.notifications.sms !== INITIAL.notifications.sms ||
    form.timezone !== INITIAL.timezone ||
    !!form.changePassword.current ||
    !!form.changePassword.newPass ||
    !!form.changePassword.confirm;

  useEffect(() => {
    return () => {
      if (form.avatarPreview) URL.revokeObjectURL(form.avatarPreview);
    };
  }, []);

  function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (form.avatarPreview) URL.revokeObjectURL(form.avatarPreview);
    const url = URL.createObjectURL(f);
    setForm((s) => ({ ...s, avatarFile: f, avatarPreview: url }));
    e.currentTarget.value = "";
    setStatus(null);
  }

  function removeAvatar() {
    if (form.avatarPreview) URL.revokeObjectURL(form.avatarPreview);
    setForm((s) => ({ ...s, avatarFile: null, avatarPreview: null }));
    if (fileRef.current) fileRef.current.value = "";
    setStatus(null);
  }

  function updateField<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((s) => ({ ...s, [key]: value }));
    setStatus(null);
  }

  function updateNestedNotification(key: keyof ProfileForm["notifications"], val: boolean) {
    setForm((s) => ({ ...s, notifications: { ...s.notifications, [key]: val } }));
    setStatus(null);
  }

  function updatePasswordField(field: keyof ProfileForm["changePassword"], val: string) {
    setForm((s) => ({ ...s, changePassword: { ...s.changePassword, [field]: val } }));
    setStatus(null);
  }

  async function saveProfileToApi(payload: FormData | Record<string, any>) {
    return new Promise<{ success: boolean; message?: string }>((res) => {
      setTimeout(() => res({ success: true, message: "Profile updated successfully!" }), 1000);
    });
  }

  async function onSave() {
    setStatus(null);
    setSaving(true);

    const pw = form.changePassword;
    if (pw.current || pw.newPass || pw.confirm) {
      if (!pw.current) {
        setStatus({ type: "error", text: "Enter current password to change it." });
        setSaving(false);
        return;
      }
      if (pw.newPass.length < 6) {
        setStatus({ type: "error", text: "New password must be at least 6 characters." });
        setSaving(false);
        return;
      }
      if (pw.newPass !== pw.confirm) {
        setStatus({ type: "error", text: "New password and confirm password do not match." });
        setSaving(false);
        return;
      }
    }

    try {
      let resp;
      if (form.avatarFile) {
        const fd = new FormData();
        fd.append("name", form.name);
        fd.append("email", form.email);
        fd.append("timezone", form.timezone);
        fd.append("notifications", JSON.stringify(form.notifications));
        if (form.changePassword.newPass) {
          fd.append("currentPassword", form.changePassword.current);
          fd.append("newPassword", form.changePassword.newPass);
        }
        fd.append("avatar", form.avatarFile);
        resp = await saveProfileToApi(fd);
      } else {
        const payload = {
          name: form.name,
          email: form.email,
          timezone: form.timezone,
          notifications: form.notifications,
          passwordChange: form.changePassword.newPass
            ? { current: form.changePassword.current, newPass: form.changePassword.newPass }
            : null,
        };
        resp = await saveProfileToApi(payload);
      }

      if (resp?.success) {
        setStatus({ type: "success", text: resp.message ?? "Saved successfully." });
        setForm((s) => ({ ...s, changePassword: { current: "", newPass: "", confirm: "" } }));
      } else {
        setStatus({ type: "error", text: resp?.message ?? "Save failed." });
      }
    } catch (err) {
      setStatus({ type: "error", text: "Save error. Check console." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="w-full max-w-5xl mx-auto">
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Profile Information</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-36 h-36 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 p-1 shadow-2xl">
                    <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                      {form.avatarPreview ? (
                        <Image src={Img} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <User className="w-12 h-12 text-slate-300" />
                          <span className="text-xs text-slate-400 mt-2">No Photo</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => fileRef.current && fileRef.current.click()}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                  >
                    <Camera className="w-4 h-4" />
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors duration-200 flex items-center gap-2 text-sm font-medium border border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>

                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
              </div>

              {/* Form Fields */}
              <div className="lg:col-span-2 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                      <User className="w-4 h-4 text-slate-500" />
                      Full Name
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-200 text-black px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                      <Mail className="w-4 h-4 text-slate-500" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-200 px-4 text-black py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                      <Globe className="w-4 h-4 text-slate-500" />
                      Timezone
                    </label>
                    <select
                      value={form.timezone}
                      onChange={(e) => updateField("timezone", e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-200 px-4 text-black py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white"
                    >
                      <option>Asia/Kolkata</option>
                      <option>UTC</option>
                      <option>Europe/London</option>
                      <option>America/New_York</option>
                    </select>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Security Settings</h2>
                <p className="text-xs text-slate-500 mt-1">Update your password to keep your account secure</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Lock className="w-4 h-4 text-slate-500" />
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={form.changePassword.current}
                  onChange={(e) => updatePasswordField("current", e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 text-black px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 bg-white"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Lock className="w-4 h-4 text-slate-500" />
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={form.changePassword.newPass}
                  onChange={(e) => updatePasswordField("newPass", e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 px-4 text-black py-3 text-sm outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 bg-white"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Lock className="w-4 h-4 text-slate-500" />
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={form.changePassword.confirm}
                  onChange={(e) => updatePasswordField("confirm", e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-black text-sm outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 bg-white"
                />
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2 text-xs text-slate-500 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
              <Shield className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>Leave password fields empty if you don't want to change your password. New password must be at least 6 characters.</span>
            </div>
          </div>

          {/* Status Message */}
          {status && (
            <div
              className={`rounded-2xl p-4 flex items-center gap-3 shadow-lg ${
                status.type === "success"
                  ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-2 border-green-200"
                  : "bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-2 border-red-200"
              }`}
              role="status"
              aria-live="polite"
            >
              {status.type === "success" ? (
                <Check className="w-5 h-5 flex-shrink-0" />
              ) : (
                <X className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="font-medium">{status.text}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span>
                  {isDirty ? (
                    <span className="font-semibold text-blue-600">You have unsaved changes</span>
                  ) : (
                    <span>All changes saved</span>
                  )}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (form.avatarPreview) URL.revokeObjectURL(form.avatarPreview);
                    setForm(INITIAL);
                    if (fileRef.current) fileRef.current.value = "";
                    setStatus(null);
                  }}
                  disabled={saving}
                  className="px-6 py-3 rounded-xl border-2 border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>

                <button
                  type="button"
                  onClick={onSave}
                  disabled={!isDirty || saving}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl ${
                    !isDirty || saving
                      ? "bg-slate-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-105"
                  }`}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}