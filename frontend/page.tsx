"use client";

import React, { useState, useEffect, useRef } from "react";
import useSWR, { useSWRConfig } from "swr";
import {
  Search,
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  Building2,
  Users,
  Package,
  Send,
  Loader2,
  Activity,
  PhoneCall,
  Mail,
  Edit2,
  Trash2,
  UserPlus,
  Plus,
  Sun,
  Moon,
  X,
  Filter,
  CheckSquare,
  Square,
  MinusSquare,
} from "lucide-react";

// ============================================================================
// TypeScript Interfaces for API Payloads
// ============================================================================

export interface CompanySummary {
  id: number;
  name: string;
  tier: string;
  health_score: number;
  open_pipeline: number;
}

export interface ContactItem {
  id: number;
  company_id: number;
  name: string;
  designation: string;
  role_type: string;
  disposition: string;
  email?: string;
}

export interface ProductItem {
  id: number;
  company_id: number;
  product_name: string;
  status: "Active" | "White-Space";
  contract_value: number;
  renewal_date?: string | null;
}

export interface CompetitorItem {
  id: number;
  company_id: number;
  competitor_name: string;
  threat_level: "Active" | "Monitoring" | "Displaced";
  first_detected_at?: string;
  notes?: string;
}

export interface InteractionItem {
  id: number;
  company_id: number;
  contact_id?: number | null;
  remark_text: string;
  timestamp: string;
  contact_name?: string;
}

export interface SuggestedMove {
  action: string;
  urgency: "High" | "Medium" | "Low";
  reason: string;
  category: "competitive" | "budget_risk" | "whitespace_expansion" | "relationship" | "expansion";
}

export interface CompanyHubResponse {
  company: CompanySummary;
  contacts: ContactItem[];
  products: ProductItem[];
  competitor_presence: CompetitorItem[];
  interactions: InteractionItem[];
  suggested_moves: SuggestedMove[];
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

export default function SalesOperatingSystemDashboard() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [remarkInput, setRemarkInput] = useState<string>("");
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastTriggerNotice, setLastTriggerNotice] = useState<string | null>(null);

  // Theme
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Selection for bulk actions
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);

  // Modals
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState<boolean>(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<ContactItem | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState<boolean>(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [isDispositionModalOpen, setIsDispositionModalOpen] = useState<boolean>(false);

  // Form states
  const [newCompanyName, setNewCompanyName] = useState<string>("");
  const [newCompanyTier, setNewCompanyTier] = useState<string>("Tier 2");
  const [newCompanyScore, setNewCompanyScore] = useState<number>(75);
  const [newCompanyPipeline, setNewCompanyPipeline] = useState<number>(50000);

  const [contactNameInput, setContactNameInput] = useState<string>("");
  const [contactDesignationInput, setContactDesignationInput] = useState<string>("");
  const [contactRoleInput, setContactRoleInput] = useState<string>("Technical Evaluator");
  const [contactDispositionInput, setContactDispositionInput] = useState<string>("Cautious / Evaluating");
  const [contactEmailInput, setContactEmailInput] = useState<string>("");

  const [callNotesInput, setCallNotesInput] = useState<string>("");
  const [callTargetContactId, setCallTargetContactId] = useState<number | null>(null);
  const [emailSubjectInput, setEmailSubjectInput] = useState<string>("Quarterly Architecture Alignment & Roadmap");
  const [bulkDispositionSelect, setBulkDispositionSelect] = useState<string>("Strong Champion");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { mutate } = useSWRConfig();

  // Search SWR
  const searchUrl = searchQuery.trim()
    ? `/api/companies/search?q=${encodeURIComponent(searchQuery.trim())}`
    : null;
  const { data: searchResults, isValidating: isSearching } = useSWR<CompanySummary[]>(
    searchUrl,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Hub Data SWR
  const hubUrl = `/api/companies/${selectedCompanyId}/hub`;
  const { data: hubData, error: hubError, isLoading: isHubLoading } = useSWR<CompanyHubResponse>(
    hubUrl,
    fetcher,
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    setSelectedContactIds([]);
    setSelectedContactId(null);
  }, [selectedCompanyId]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // Checkbox helpers
  const handleToggleContact = (id: number) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (!hubData?.contacts) return;
    if (selectedContactIds.length === hubData.contacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(hubData.contacts.map((c) => c.id));
    }
  };

  // Submit Remark
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
          company_id: selectedCompanyId,
          contact_id: selectedContactId,
          remark_text: remarkInput.trim(),
        }),
      });

      if (!response.ok) throw new Error("Failed to persist interaction");
      const result = await response.json();

      if (result.triggered_rules && result.triggered_rules.length > 0) {
        setLastTriggerNotice(`Deterministic regex parsed: ${result.triggered_rules.join(" & ")}`);
      }

      setRemarkInput("");
      await mutate(hubUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (!confirm(`Permanently delete ${selectedContactIds.length} selected contacts?`)) return;
    try {
      const res = await fetch("/api/contacts/bulk-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_ids: selectedContactIds, action: "delete" }),
      });
      if (res.ok) {
        setSelectedContactIds([]);
        await mutate(hubUrl);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Bulk Disposition
  const handleBulkUpdateDisposition = async () => {
    try {
      const res = await fetch("/api/contacts/bulk-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_ids: selectedContactIds,
          action: "update_disposition",
          payload: { disposition: bulkDispositionSelect },
        }),
      });
      if (res.ok) {
        setIsDispositionModalOpen(false);
        setSelectedContactIds([]);
        await mutate(hubUrl);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Call & Log
  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callNotesInput.trim()) return;

    try {
      const res = await fetch("/api/contacts/bulk-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_ids: selectedContactIds.length > 0 ? selectedContactIds : [callTargetContactId || 1],
          action: "log_call",
          payload: {
            call_notes: callNotesInput.trim(),
            company_id: selectedCompanyId,
            contact_id: callTargetContactId || selectedContactIds[0] || null,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsCallModalOpen(false);
        setCallNotesInput("");
        setSelectedContactIds([]);
        if (data.triggered_rules?.length) {
          setLastTriggerNotice(`Call logged & regex parsed: ${data.triggered_rules.join(" & ")}`);
        }
        await mutate(hubUrl);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send Email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/contacts/bulk-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_ids: selectedContactIds,
          action: "send_email",
          payload: { template_subject: emailSubjectInput, company_id: selectedCompanyId },
        }),
      });
      if (res.ok) {
        setIsEmailModalOpen(false);
        setSelectedContactIds([]);
        setLastTriggerNotice("Email dispatched to selected contacts.");
        await mutate(hubUrl);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isDark = theme === "dark";

  return (
    <div className={`flex flex-col min-h-screen font-sans antialiased transition-colors duration-200 ${
      isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      {/* Top Header */}
      <header className={`sticky top-0 z-30 h-16 border-b px-6 flex items-center justify-between gap-4 backdrop-blur-md ${
        isDark ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-slate-200 shadow-xs"
      }`}>
        <div className="flex items-center gap-3 shrink-0">
          <div className="h-8 w-8 rounded bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
            OS
          </div>
          <div>
            <span className="text-sm font-semibold tracking-tight">Autonomous B2B Sales OS</span>
            <span className="text-[11px] block text-slate-400">Deterministic Rules · Zero LLMs</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative flex-1 max-w-xl mx-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search companies (Postgres ILIKE)... Press / to focus"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-12 py-2 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
              isDark ? "bg-slate-800/80 border border-slate-700 text-slate-200" : "bg-slate-100 border border-slate-300 text-slate-900"
            }`}
          />
          {searchQuery.trim().length > 0 && searchResults && (
            <div className={`absolute left-0 right-0 top-full mt-1.5 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto divide-y ${
              isDark ? "bg-slate-900 border border-slate-700 divide-slate-800" : "bg-white border border-slate-200 divide-slate-100"
            }`}>
              {searchResults.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCompanyId(c.id);
                    setSearchQuery("");
                  }}
                  className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-indigo-600/10 ${
                    selectedCompanyId === c.id ? "text-indigo-500 font-semibold" : ""
                  }`}
                >
                  <span className="text-xs">{c.name} · {c.tier}</span>
                  <span className="text-xs font-mono tabular-nums">Score {c.health_score}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddCompanyOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Company</span>
          </button>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition-colors ${
              isDark ? "border-slate-700 bg-slate-800 text-amber-400" : "border-slate-300 bg-white text-indigo-600 shadow-xs"
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <main className="flex-1 p-6 pb-36 max-w-[1720px] mx-auto w-full">
        {hubData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Account Health */}
            <div className="lg:col-span-3 space-y-4">
              <div className={`p-5 rounded-xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
                  <span className="text-xs font-semibold uppercase text-slate-400">Account Health</span>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                    {hubData.company.tier}
                  </span>
                </div>
                <h1 className="text-xl font-bold mt-4">{hubData.company.name}</h1>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className={`p-3 rounded-lg border ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    <span className="text-[10px] text-slate-400 uppercase">Health Score</span>
                    <div className="text-2xl font-bold font-mono tabular-nums text-emerald-500">
                      {hubData.company.health_score}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    <span className="text-[10px] text-slate-400 uppercase">Pipeline</span>
                    <div className="text-2xl font-bold font-mono tabular-nums">
                      ${(hubData.company.open_pipeline / 1000).toFixed(0)}k
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Contacts & Products */}
            <div className="lg:col-span-6 space-y-6">
              <div className={`p-5 rounded-xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/40">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-bold">Key Contacts Matrix</span>
                  </div>
                  <button
                    onClick={() => setIsAddContactOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Contact</span>
                  </button>
                </div>

                <table className="w-full text-left text-xs mt-2">
                  <thead>
                    <tr className="border-b border-slate-700/40 text-slate-400 uppercase text-[10px]">
                      <th className="py-2.5 px-3 w-8">
                        <button onClick={handleToggleSelectAll}>
                          {selectedContactIds.length === hubData.contacts.length ? (
                            <CheckSquare className="w-4 h-4 text-indigo-500" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </th>
                      <th className="py-2.5 px-3">Contact</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Disposition</th>
                      <th className="py-2.5 px-3 text-right">Target</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/20">
                    {hubData.contacts.map((contact) => (
                      <tr key={contact.id}>
                        <td className="py-3 px-3">
                          <button onClick={() => handleToggleContact(contact.id)}>
                            {selectedContactIds.includes(contact.id) ? (
                              <CheckSquare className="w-4 h-4 text-indigo-500" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{contact.name}</span>
                            <button onClick={() => setEditingContact(contact)}>
                              <Edit2 className="w-3 h-3 text-slate-400 hover:text-indigo-400" />
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-400">{contact.designation}</div>
                        </td>
                        <td className="py-3 px-3">{contact.role_type}</td>
                        <td className="py-3 px-3 font-medium text-emerald-500">{contact.disposition}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedContactId(selectedContactId === contact.id ? null : contact.id)}
                            className={`px-2 py-1 rounded text-[11px] ${
                              selectedContactId === contact.id ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            Target
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Suggested Moves */}
            <div className="lg:col-span-3 space-y-4">
              <div className={`p-5 rounded-xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
                <span className="text-xs font-semibold uppercase text-slate-400">Deterministic Moves</span>
                <div className="mt-4 space-y-3">
                  {hubData.suggested_moves.map((move, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border text-xs ${
                        move.urgency === "High"
                          ? "bg-rose-950/20 border-rose-800/60 text-rose-300"
                          : "bg-emerald-950/20 border-emerald-800/60 text-emerald-300"
                      }`}
                    >
                      <div className="font-bold">{move.action}</div>
                      <p className="mt-1 text-[11px] text-slate-300">{move.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Bar for Selected Contacts */}
      {selectedContactIds.length > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-2xl backdrop-blur-lg bg-slate-900/95 border-indigo-500/40 text-white">
            <span className="text-xs font-semibold">{selectedContactIds.length} Selected</span>
            <button
              onClick={() => {
                setCallTargetContactId(selectedContactIds[0]);
                setIsCallModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Make Call</span>
            </button>
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send Email</span>
            </button>
            <button
              onClick={() => setIsDispositionModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs border border-slate-700"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Update Disposition</span>
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800 px-6 py-3.5">
        <form onSubmit={handleSendRemark} className="max-w-[1720px] mx-auto flex items-center gap-4">
          <input
            type="text"
            value={remarkInput}
            onChange={(e) => setRemarkInput(e.target.value)}
            placeholder="Type remark (e.g. 'Competitor X is running a pilot' or 'CFO stated budget locked')..."
            className="flex-1 py-2.5 px-4 bg-slate-950 border border-slate-700 rounded-lg text-xs md:text-sm text-slate-200"
          />
          <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold">
            Send Remark
          </button>
        </form>
      </footer>
    </div>
  );
}
