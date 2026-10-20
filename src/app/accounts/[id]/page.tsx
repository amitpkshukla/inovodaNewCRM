"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import Link from "next/link";
import {
  Building2,
  TrendingUp,
  Send,
  Users,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  Activity,
  ArrowLeft,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface Contact {
  id: number;
  company_id: number;
  is_key_contact: boolean;
  designation: string;
  name: string;
  contact_number?: string;
  mobile_number?: string;
  email_id?: string;
  linkedin_url?: string;
  remarks?: string;
  last_meeting_date?: string;
  next_meeting_date?: string;
  appointment_given?: string;
  appointment_date?: string;
  meeting_status?: string;
  product?: string;
  opp_snapshot?: string;
  role_type?: string;
  disposition?: string;
}

interface CompanySummary {
  id: number;
  name: string;
  website?: string;
  tier: string;
  industry?: string;
  corporate_office?: string;
  telecom_spend?: string;
  health_status: string;
  health_score: number;
  last_meeting_date?: string;
  next_meeting_date?: string;
  open_pipeline: number;
  oldest_opp_days: number;
}

interface SuggestedMove {
  action: string;
  urgency: string;
  reason: string;
  category: string;
}

interface CompanyHubResponse {
  company: CompanySummary;
  key_contacts: Contact[];
  other_contacts: Contact[];
  products: any[];
  competitor_presence: any[];
  interactions: any[];
  suggested_moves: SuggestedMove[];
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

export default function AccountDetailPage() {
  const params = useParams();
  const accountId = params?.id ? String(params.id) : "1";

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [remarkInput, setRemarkInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastTriggerNotice, setLastTriggerNotice] = useState<string | null>(null);

  const { mutate } = useSWRConfig();
  const hubUrl = `/api/companies/${accountId}/hub`;

  const {
    data: hubData,
    error: hubError,
    isLoading,
  } = useSWR<CompanyHubResponse>(hubUrl, fetcher, {
    revalidateOnFocus: false,
  });

  const handleRowClick = (contact: Contact) => {
    setSelectedContact(contact);
  };

  const handleSendRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarkInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setLastTriggerNotice(null);

    try {
      const response = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: Number(accountId),
          contact_id: selectedContact?.id || null,
          contact_name: selectedContact?.name || "General Account",
          remark_text: remarkInput.trim(),
        }),
      });

      if (!response.ok) throw new Error("Failed to save interaction");

      const result = await response.json();

      if (result.triggered_rules && result.triggered_rules.length > 0) {
        setLastTriggerNotice(
          `Deterministic regex parsed: ${result.triggered_rules.join(" & ")}`
        );
      }

      setRemarkInput("");
      await mutate(hubUrl);
    } catch (err) {
      console.error("Failed to post interaction:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !hubData) {
    return (
      <div className="flex-1 flex items-center justify-center py-32 text-slate-400 gap-3 text-sm">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
        <span>Loading Account 360 from PostgreSQL...</span>
      </div>
    );
  }

  if (hubError || !hubData) {
    return (
      <div className="flex-1 p-8 max-w-4xl mx-auto">
        <div className="p-6 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 text-sm">
          Failed to load account #{accountId} from PostgreSQL database.
          <div className="mt-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Accounts</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { company, key_contacts, other_contacts, suggested_moves } = hubData;

  return (
    <div className="flex-1 flex flex-col p-6 pb-28 max-w-[1800px] mx-auto w-full">
      {/* Account Top Title Banner */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Back to search"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  {company.name}
                </h1>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300">
                  {company.tier}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Account 360 Workspace · Database Row #{company.id} · {company.industry || "Supply Chain & Cloud"}
              </p>
            </div>
          </div>
        </div>

        {lastTriggerNotice && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-300 text-xs font-mono">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>{lastTriggerNotice}</span>
          </div>
        )}
      </div>

      {/* 3-Column Cockpit Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================================================================ */}
        {/* LEFT COLUMN: Health Card (lg:col-span-3) */}
        {/* ================================================================ */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-400" />
                Account Health
              </span>
              <span className="text-[11px] font-mono text-slate-500">PostgreSQL</span>
            </div>

            {/* Health Status (CRITICAL) */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                Health Status
              </span>
              <div className="mt-1.5">
                <span
                  className={`inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border ${
                    company.health_status === "CRITICAL"
                      ? "bg-rose-950/80 text-rose-300 border-rose-800"
                      : "bg-amber-950/80 text-amber-300 border-amber-800"
                  }`}
                >
                  {company.health_status}
                </span>
              </div>
            </div>

            {/* Health Score (-50) */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                Health Score
              </span>
              <div
                className={`mt-1 text-2xl font-bold font-mono tabular-nums ${
                  company.health_score < 0 ? "text-rose-400" : "text-amber-400"
                }`}
              >
                {company.health_score}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Threshold: 70
              </span>
            </div>

            {/* Last Meeting Date */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                Last Meeting Date
              </span>
              <div className="mt-1 text-sm font-semibold text-slate-200 font-mono">
                {company.last_meeting_date || "2026-10-18"}
              </div>
            </div>

            {/* Next Meeting Date */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                Next Meeting Date
              </span>
              <div className="mt-1 text-sm font-semibold text-amber-300 font-mono">
                {company.next_meeting_date || "Not Planned"}
              </div>
            </div>

            {/* Open Pipeline */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                Open Pipeline
              </span>
              <div className="mt-1 text-xl font-bold font-mono tabular-nums text-white">
                ${Number(company.open_pipeline).toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Active ACV in Review
              </span>
            </div>

            {/* Oldest Opp Days */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                Oldest Opp Days
              </span>
              <div className="mt-1 text-xl font-bold font-mono tabular-nums text-amber-400">
                {company.oldest_opp_days} Days
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Exceeds 90-day velocity standard
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* CENTER COLUMN: Data Tables (Key & Other Contacts) (lg:col-span-6) */}
        {/* ================================================================ */}
        <div className="lg:col-span-6 space-y-6">
          {/* Table 1: Key Contacts */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Table 1: Key Contacts
                </h2>
              </div>
              <span className="text-xs font-mono text-indigo-400">
                {key_contacts.length} Decision Makers
              </span>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Designation</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Contact Number</th>
                    <th className="py-2.5 px-3">Mobile Number</th>
                    <th className="py-2.5 px-3">Email ID</th>
                    <th className="py-2.5 px-3">Linkedin URL</th>
                    <th className="py-2.5 px-3">Remarks</th>
                    <th className="py-2.5 px-3">Last Meeting Date</th>
                    <th className="py-2.5 px-3">Next Meeting Date</th>
                    <th className="py-2.5 px-3">Appointment Given</th>
                    <th className="py-2.5 px-3">Appointment Date</th>
                    <th className="py-2.5 px-3">Meeting Status</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">OPP Snapshot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {key_contacts.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => handleRowClick(c)}
                      className={`cursor-pointer transition-colors hover:bg-indigo-950/30 ${
                        selectedContact?.id === c.id ? "bg-indigo-950/50" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{c.designation}</td>
                      <td className="py-2.5 px-3 font-bold text-indigo-300">{c.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{c.contact_number || "—"}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{c.mobile_number || "—"}</td>
                      <td className="py-2.5 px-3 text-slate-300">{c.email_id || "—"}</td>
                      <td className="py-2.5 px-3">
                        {c.linkedin_url ? (
                          <a
                            href={c.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-400 hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>Profile</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2.5 px-3 max-w-[220px] truncate text-slate-300" title={c.remarks || ""}>
                        {c.remarks || "—"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{c.last_meeting_date || "—"}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{c.next_meeting_date || "—"}</td>
                      <td className="py-2.5 px-3">{c.appointment_given || "No"}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{c.appointment_date || "—"}</td>
                      <td className="py-2.5 px-3 font-medium text-emerald-400">{c.meeting_status || "Open"}</td>
                      <td className="py-2.5 px-3 text-indigo-300">{c.product || "Core Platform"}</td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-200">{c.opp_snapshot || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Other Contacts */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Table 2: Other Contacts
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {other_contacts.length} Influencers & Evaluators
              </span>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Designation</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Contact Number</th>
                    <th className="py-2.5 px-3">Mobile Number</th>
                    <th className="py-2.5 px-3">Email ID</th>
                    <th className="py-2.5 px-3">Linkedin URL</th>
                    <th className="py-2.5 px-3">Remarks</th>
                    <th className="py-2.5 px-3">Last Meeting Date</th>
                    <th className="py-2.5 px-3">Next Meeting Date</th>
                    <th className="py-2.5 px-3">Appointment Given</th>
                    <th className="py-2.5 px-3">Appointment Date</th>
                    <th className="py-2.5 px-3">Meeting Status</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">OPP Snapshot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {other_contacts.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => handleRowClick(c)}
                      className={`cursor-pointer transition-colors hover:bg-indigo-950/30 ${
                        selectedContact?.id === c.id ? "bg-indigo-950/50" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{c.designation}</td>
                      <td className="py-2.5 px-3 font-bold text-indigo-300">{c.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{c.contact_number || "—"}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{c.mobile_number || "—"}</td>
                      <td className="py-2.5 px-3 text-slate-300">{c.email_id || "—"}</td>
                      <td className="py-2.5 px-3">
                        {c.linkedin_url ? (
                          <a
                            href={c.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-400 hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>Profile</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2.5 px-3 max-w-[220px] truncate text-slate-300" title={c.remarks || ""}>
                        {c.remarks || "—"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{c.last_meeting_date || "—"}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{c.next_meeting_date || "—"}</td>
                      <td className="py-2.5 px-3">{c.appointment_given || "No"}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{c.appointment_date || "—"}</td>
                      <td className="py-2.5 px-3 font-medium text-amber-400">{c.meeting_status || "Follow-up Needed"}</td>
                      <td className="py-2.5 px-3 text-indigo-300">{c.product || "Integration Bridge"}</td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-200">{c.opp_snapshot || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* RIGHT COLUMN: Suggested Moves (Nudges) (lg:col-span-3) */}
        {/* ================================================================ */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Suggested Moves
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {suggested_moves.length} Active Rules
              </span>
            </div>

            {suggested_moves.length === 0 ? (
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 text-xs text-slate-400 text-center">
                No active threat rules fired. Account is in nominal state.
              </div>
            ) : (
              suggested_moves.map((n, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border space-y-2 ${
                    n.category === "risk"
                      ? "bg-rose-950/20 border-rose-800/70 text-rose-200"
                      : "bg-emerald-950/20 border-emerald-800/70 text-emerald-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      {n.category === "risk" ? (
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <span>{n.category === "risk" ? "Competitor Threat" : "White-Space Opportunity"}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-semibold border ${
                        n.urgency === "High" || n.urgency === "Critical"
                          ? "bg-rose-900/60 text-rose-300 border-rose-700/60"
                          : "bg-emerald-900/60 text-emerald-300 border-emerald-700/60"
                      }`}
                    >
                      {n.urgency}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-white">{n.action}</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{n.reason}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* FIXED BOTTOM INPUT BAR */}
      {/* ================================================================ */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800 px-6 py-3.5 backdrop-blur-md shadow-2xl">
        <form onSubmit={handleSendRemark} className="max-w-[1800px] mx-auto flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 shrink-0">
            <span className="font-semibold text-indigo-300">
              {selectedContact ? `Target: ${selectedContact.name}` : "General Account"}
            </span>
            <span className="text-slate-600">|</span>
          </div>

          <div className="relative flex-1">
            <input
              type="text"
              value={remarkInput}
              onChange={(e) => setRemarkInput(e.target.value)}
              placeholder={
                selectedContact
                  ? `Logging remark for ${selectedContact.name}`
                  : "Logging remark for General Account (click a row to target a contact)..."
              }
              className="w-full py-2.5 px-4 bg-slate-950 border border-slate-700 rounded-lg text-xs md:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!remarkInput.trim() || isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors shadow-md cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Send Remark</span>
          </button>
        </form>
      </footer>
    </div>
  );
}
