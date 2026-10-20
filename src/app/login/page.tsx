"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("Sales");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (typeof window !== "undefined") {
      localStorage.setItem("user_role", role);
      localStorage.setItem("auth_token", "auth_session_" + Date.now());
    }

    setTimeout(() => {
      router.push("/");
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 selection:bg-indigo-500/30">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-7 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-11 w-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white mb-3 shadow-md shadow-indigo-600/30 font-bold text-sm">
            OS
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white">
            Deterministic B2B Sales OS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sign in to access your operating environment
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Operating Role
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
              >
                <option value="Admin">Admin</option>
                <option value="Sales">Sales</option>
              </select>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Select your system persona to configure workspace access.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-md cursor-pointer"
          >
            <span>{isLoading ? "Signing in..." : "Continue to Dashboard"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Role persists in localStorage</span>
        </div>
      </div>
    </div>
  );
}
