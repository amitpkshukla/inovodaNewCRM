"use client";

import React, { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  Search,
  Building2,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Activity,
  Layers,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface CompanySummary {
  id: number;
  name: string;
  website?: string;
  tier: string;
  industry?: string;
  corporate_office?: string;
  health_status: string;
  health_score: number;
  open_pipeline: number;
  oldest_opp_days: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

export default function LandingSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const searchUrl = searchQuery.trim()
    ? `/api/companies/search?q=${encodeURIComponent(searchQuery.trim())}`
    : `/api/companies/search?q=a`;

  const { data: companies, isValidating: isSearching } = useSWR<CompanySummary[]>(
    searchUrl,
    fetcher,
    { revalidateOnFocus: false }
  );

  return (
    <div className="flex-1 flex flex-col p-8 max-w-6xl mx-auto w-full">
      {/* Hero Search Section */}
      <div className="text-center py-10 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800 text-indigo-300 text-xs font-mono font-medium">
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span>PostgreSQL Relational Sales Operating Console</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Deterministic B2B Sales OS
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Instant account telemetry, deterministic regex threat detection, and 14-column stakeholder matrices powered by pure SQL queries.
        </p>

        {/* Global Search Input */}
        <div className="relative max-w-2xl mx-auto mt-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search accounts by name (Postgres ILIKE)... e.g. Apex, Vanguard"
            className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xl transition-all"
          />
          {isSearching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
          )}
        </div>
      </div>

      {/* Account Directory Grid */}
      <div className="space-y-4 mt-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Target Enterprise Accounts ({companies ? companies.length : 0})</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            Click to launch Account 360 Dashboard
          </span>
        </div>

        {!companies && (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-2 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            <span>Querying PostgreSQL database...</span>
          </div>
        )}

        {companies && companies.length === 0 && (
          <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-xl text-slate-400 text-xs">
            No accounts match "{searchQuery}". Try searching "Apex" or "Vanguard".
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companies &&
            companies.map((c) => (
              <Link
                key={c.id}
                href={`/accounts/${c.id}`}
                className="group p-5 rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-800/80 hover:border-indigo-500/50 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300">
                      {c.tier}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        c.health_status === "CRITICAL"
                          ? "bg-rose-950/70 text-rose-300 border border-rose-800"
                          : "bg-amber-950/70 text-amber-300 border border-amber-800"
                      }`}
                    >
                      {c.health_status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors mt-3">
                    {c.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {c.industry || "Enterprise Logistics & Cloud"}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-5 pt-3 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Health</span>
                    <span
                      className={`font-mono font-bold ${
                        c.health_score < 0 ? "text-rose-400" : "text-amber-400"
                      }`}
                    >
                      {c.health_score} / 100
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Pipeline</span>
                    <span className="font-mono font-bold text-slate-200">
                      ${(c.open_pipeline / 1000).toFixed(0)}k
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Oldest Opp</span>
                    <span className="font-mono font-bold text-amber-400">
                      {c.oldest_opp_days}d
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end text-xs font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Open Account 360</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
