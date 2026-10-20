/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Deterministic B2B Sales Operating System - Main Dashboard
 * High-performance cockpit replacing manual Excel workbooks.
 * ZERO LLMs - Deterministic SQL, Regex Parsing, and Hardcoded Rule Matrices.
 */

import React, { useState, useEffect, useRef } from 'react';
import useSWR, { useSWRConfig } from 'swr';
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
  Code2,
  Copy,
  Check,
  RotateCcw,
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
  ChevronDown,
} from 'lucide-react';

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
  status: 'Active' | 'White-Space';
  contract_value: number;
  renewal_date?: string | null;
}

export interface CompetitorItem {
  id: number;
  company_id: number;
  competitor_name: string;
  threat_level: 'Active' | 'Monitoring' | 'Displaced';
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
  urgency: 'High' | 'Medium' | 'Low';
  reason: string;
  category: 'competitive' | 'budget_risk' | 'whitespace_expansion' | 'relationship' | 'expansion';
}

export interface CompanyHubResponse {
  company: CompanySummary;
  contacts: ContactItem[];
  products: ProductItem[];
  competitor_presence: CompetitorItem[];
  interactions: InteractionItem[];
  suggested_moves: SuggestedMove[];
}

// SWR Fetcher
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
};

export default function App() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [remarkInput, setRemarkInput] = useState<string>('');
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastTriggerNotice, setLastTriggerNotice] = useState<string | null>(null);

  // Theme State: 'dark' or 'light'
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Contact Selection State for Bulk Operations
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);

  // Modals State
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState<boolean>(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<ContactItem | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState<boolean>(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [isDispositionModalOpen, setIsDispositionModalOpen] = useState<boolean>(false);

  // Form inputs for modals
  const [newCompanyName, setNewCompanyName] = useState<string>('');
  const [newCompanyTier, setNewCompanyTier] = useState<string>('Tier 2');
  const [newCompanyScore, setNewCompanyScore] = useState<number>(75);
  const [newCompanyPipeline, setNewCompanyPipeline] = useState<number>(50000);

  const [contactNameInput, setContactNameInput] = useState<string>('');
  const [contactDesignationInput, setContactDesignationInput] = useState<string>('');
  const [contactRoleInput, setContactRoleInput] = useState<string>('Technical Evaluator');
  const [contactDispositionInput, setContactDispositionInput] = useState<string>('Cautious / Evaluating');
  const [contactEmailInput, setContactEmailInput] = useState<string>('');

  // Call modal inputs
  const [callNotesInput, setCallNotesInput] = useState<string>('');
  const [callTargetContactId, setCallTargetContactId] = useState<number | null>(null);

  // Email modal inputs
  const [emailSubjectInput, setEmailSubjectInput] = useState<string>('Quarterly Architecture Alignment & Roadmap');

  // Disposition bulk input
  const [bulkDispositionSelect, setBulkDispositionSelect] = useState<string>('Strong Champion');

  // Source Code Modal state
  const [activeCodeModal, setActiveCodeModal] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { mutate } = useSWRConfig();

  // Search SWR Hook
  const searchUrl = searchQuery.trim()
    ? `/api/companies/search?q=${encodeURIComponent(searchQuery.trim())}`
    : null;
  const { data: searchResults, isValidating: isSearching } = useSWR<CompanySummary[]>(
    searchUrl,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Hub Data SWR Hook
  const hubUrl = `/api/companies/${selectedCompanyId}/hub`;
  const {
    data: hubData,
    error: hubError,
    isLoading: isHubLoading,
  } = useSWR<CompanyHubResponse>(hubUrl, fetcher, {
    revalidateOnFocus: false,
  });

  // Source code file viewer
  const { data: codeData } = useSWR<{ filename: string; content: string }>(
    activeCodeModal ? `/api/source-code/${activeCodeModal}` : null,
    fetcher
  );

  // Handle keyboard shortcuts (Cmd+K or / to focus search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.metaKey && e.key === 'k')) && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Clear contact selection when switching company
  useEffect(() => {
    setSelectedContactIds([]);
    setSelectedContactId(null);
  }, [selectedCompanyId]);

  // Toggle Theme
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Submit Remark (Deterministic interaction logging)
  const handleSendRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarkInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setLastTriggerNotice(null);

    try {
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: selectedCompanyId,
          contact_id: selectedContactId,
          remark_text: remarkInput.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to persist interaction');
      }

      const result = await response.json();

      if (result.triggered_rules && result.triggered_rules.length > 0) {
        setLastTriggerNotice(
          `Deterministic regex parsed: ${result.triggered_rules.join(' & ')}`
        );
      }

      setRemarkInput('');
      await mutate(hubUrl);
    } catch (err) {
      console.error('Error logging remark:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Preset Helper
  const handleQuickInsert = (text: string) => {
    setRemarkInput(text);
  };

  // Checkbox management
  const handleToggleContact = (id: number) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
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

  // Create Company
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCompanyName.trim(),
          tier: newCompanyTier,
          health_score: newCompanyScore,
          open_pipeline: newCompanyPipeline,
        }),
      });
      if (res.ok) {
        const company = await res.json();
        setSelectedCompanyId(company.id);
        setIsAddCompanyOpen(false);
        setNewCompanyName('');
        setLastTriggerNotice(`Created new company account: ${company.name}`);
        await mutate(`/api/companies/${company.id}/hub`);
      }
    } catch (err) {
      console.error('Failed to create company:', err);
    }
  };

  // Create Contact
  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactNameInput.trim() || !contactDesignationInput.trim()) return;

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: selectedCompanyId,
          name: contactNameInput.trim(),
          designation: contactDesignationInput.trim(),
          role_type: contactRoleInput,
          disposition: contactDispositionInput,
          email: contactEmailInput.trim() || undefined,
        }),
      });
      if (res.ok) {
        setIsAddContactOpen(false);
        setContactNameInput('');
        setContactDesignationInput('');
        setContactEmailInput('');
        setLastTriggerNotice(`Added contact ${contactNameInput.trim()} to matrix.`);
        await mutate(hubUrl);
      }
    } catch (err) {
      console.error('Failed to add contact:', err);
    }
  };

  // Edit Contact
  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;

    try {
      const res = await fetch(`/api/contacts/${editingContact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingContact.name,
          designation: editingContact.designation,
          role_type: editingContact.role_type,
          disposition: editingContact.disposition,
          email: editingContact.email,
        }),
      });
      if (res.ok) {
        setEditingContact(null);
        setLastTriggerNotice(`Updated contact: ${editingContact.name}`);
        await mutate(hubUrl);
      }
    } catch (err) {
      console.error('Failed to update contact:', err);
    }
  };

  // Delete Individual Contact
  const handleDeleteContact = async (id: number, name: string) => {
    if (!confirm(`Delete contact ${name} from this account?`)) return;

    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedContactIds((prev) => prev.filter((i) => i !== id));
        if (selectedContactId === id) setSelectedContactId(null);
        setLastTriggerNotice(`Deleted contact ${name}.`);
        await mutate(hubUrl);
      }
    } catch (err) {
      console.error('Failed to delete contact:', err);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (!confirm(`Permanently delete ${selectedContactIds.length} selected contacts?`)) return;

    try {
      const res = await fetch('/api/contacts/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_ids: selectedContactIds,
          action: 'delete',
        }),
      });
      if (res.ok) {
        setSelectedContactIds([]);
        setLastTriggerNotice(`Bulk deleted selected contacts.`);
        await mutate(hubUrl);
      }
    } catch (err) {
      console.error('Bulk delete failed:', err);
    }
  };

  // Bulk Update Disposition
  const handleBulkUpdateDisposition = async () => {
    try {
      const res = await fetch('/api/contacts/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_ids: selectedContactIds,
          action: 'update_disposition',
          payload: { disposition: bulkDispositionSelect },
        }),
      });
      if (res.ok) {
        setIsDispositionModalOpen(false);
        setSelectedContactIds([]);
        setLastTriggerNotice(
          `Updated disposition of contacts to "${bulkDispositionSelect}". Rule engine recalculated.`
        );
        await mutate(hubUrl);
      }
    } catch (err) {
      console.error('Bulk disposition update failed:', err);
    }
  };

  // Log Call & Remarks
  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callNotesInput.trim()) return;

    try {
      const res = await fetch('/api/contacts/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_ids: selectedContactIds.length > 0 ? selectedContactIds : [callTargetContactId || 1],
          action: 'log_call',
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
        setCallNotesInput('');
        setSelectedContactIds([]);
        if (data.triggered_rules && data.triggered_rules.length > 0) {
          setLastTriggerNotice(
            `Call logged & regex parsed: ${data.triggered_rules.join(' & ')}`
          );
        } else {
          setLastTriggerNotice('Call interaction logged successfully.');
        }
        await mutate(hubUrl);
      }
    } catch (err) {
      console.error('Failed to log call:', err);
    }
  };

  // Send Email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/contacts/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_ids: selectedContactIds,
          action: 'send_email',
          payload: {
            template_subject: emailSubjectInput,
            company_id: selectedCompanyId,
          },
        }),
      });

      if (res.ok) {
        setIsEmailModalOpen(false);
        setSelectedContactIds([]);
        setLastTriggerNotice(`Dispatched email template to selected contacts and logged to account.`);
        await mutate(hubUrl);
      }
    } catch (err) {
      console.error('Failed to send email:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleResetDemo = async () => {
    try {
      await fetch('/api/reset-demo', { method: 'POST' });
      setLastTriggerNotice('Reset database state to original seed.');
      await mutate(hubUrl);
    } catch (e) {
      console.error(e);
    }
  };

  // Theme-derived classes
  const isDark = theme === 'dark';
  const themeClasses = {
    bg: isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900',
    headerBg: isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200 shadow-sm',
    cardBg: isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm',
    innerCardBg: isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200',
    tableBorder: isDark ? 'border-slate-800/60' : 'border-slate-200',
    tableHeader: isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500',
    rowHover: isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-100/60',
    inputBg: isDark ? 'bg-slate-800/80 border-slate-700 text-slate-200 placeholder:text-slate-500' : 'bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-400',
    bottomBarBg: isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200 shadow-xl',
    mutedText: isDark ? 'text-slate-400' : 'text-slate-500',
    headingText: isDark ? 'text-white' : 'text-slate-900',
  };

  return (
    <div className={`flex flex-col min-h-screen font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200 transition-colors duration-200 ${themeClasses.bg}`}>
      {/* ==================================================================== */}
      {/* TOP HEADER: Global Search, Quick Navigation, New Company, Light/Dark */}
      {/* ==================================================================== */}
      <header className={`sticky top-0 z-30 h-16 border-b px-6 flex items-center justify-between gap-4 backdrop-blur-md transition-colors ${themeClasses.headerBg}`}>
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="h-8 w-8 rounded bg-indigo-600 flex items-center justify-center font-bold text-white tracking-wider text-xs shadow-inner">
            OS
          </div>
          <div className="flex flex-col">
            <span className={`text-sm font-semibold tracking-tight whitespace-nowrap ${themeClasses.headingText}`}>
              Autonomous B2B Sales OS
            </span>
            <span className={`text-[11px] whitespace-nowrap ${themeClasses.mutedText}`}>
              Deterministic Rules · Zero LLMs · Postgres Engine
            </span>
          </div>
        </div>

        {/* Global Search Bar (Postgres ILIKE lookup) with keyboard shortcut */}
        <div className="relative flex-1 max-w-xl mx-2">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${themeClasses.mutedText}`} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search companies by name (Postgres ILIKE)... Press / to search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-16 py-2 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${themeClasses.inputBg}`}
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {isSearching ? (
                <Loader2 className={`w-3.5 h-3.5 animate-spin ${themeClasses.mutedText}`} />
              ) : (
                <kbd className={`hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded border ${isDark ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-200 border-slate-300 text-slate-600'}`}>
                  /
                </kbd>
              )}
            </div>
          </div>

          {/* Search Dropdown Results */}
          {searchQuery.trim().length > 0 && searchResults && (
            <div className={`absolute left-0 right-0 top-full mt-1.5 rounded-lg shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto divide-y ${isDark ? 'bg-slate-900 border border-slate-700 divide-slate-800' : 'bg-white border border-slate-200 divide-slate-100 shadow-lg'}`}>
              {searchResults.length === 0 ? (
                <div className={`px-4 py-3 text-xs ${themeClasses.mutedText}`}>
                  No accounts found matching "{searchQuery}"
                </div>
              ) : (
                searchResults.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCompanyId(c.id);
                      setSearchQuery('');
                    }}
                    className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors ${
                      isDark
                        ? selectedCompanyId === c.id
                          ? 'bg-indigo-950/40 text-indigo-300'
                          : 'hover:bg-slate-800 text-slate-200'
                        : selectedCompanyId === c.id
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold">{c.name}</span>
                      <span className={`text-[11px] ml-2 ${themeClasses.mutedText}`}>· {c.tier}</span>
                    </div>
                    <span className={`text-[11px] font-mono tabular-nums ${themeClasses.mutedText}`}>
                      Score {c.health_score} · ${(c.open_pipeline / 1000).toFixed(0)}k pipe
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Account Quick Selector Switcher & Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Quick Account Switcher */}
          <div className={`flex items-center p-1 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
            <button
              onClick={() => setSelectedCompanyId(1)}
              className={`px-3 py-1 text-xs rounded font-medium transition-all ${
                selectedCompanyId === 1
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Apex (1)
            </button>
            <button
              onClick={() => setSelectedCompanyId(2)}
              className={`px-3 py-1 text-xs rounded font-medium transition-all ${
                selectedCompanyId === 2
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vanguard (2)
            </button>
          </div>

          {/* New Company Button */}
          <button
            onClick={() => setIsAddCompanyOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Company</span>
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className={`p-2 rounded-lg border transition-colors ${
              isDark
                ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white'
                : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 shadow-sm'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Artifacts & Architecture Code Modal Button */}
          <button
            onClick={() => setActiveCodeModal('schema.sql')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              isDark
                ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white'
                : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 shadow-sm'
            }`}
            title="Inspect generated SQL schema, FastAPI models, regex parser, Docker, and Next.js files"
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden lg:inline">Inspect Code</span>
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* MAIN 3-COLUMN COCKPIT GRID */}
      {/* ==================================================================== */}
      <main className="flex-1 p-6 pb-36 max-w-[1720px] mx-auto w-full">
        {isHubLoading && !hubData ? (
          <div className="flex items-center justify-center h-96">
            <div className={`flex items-center gap-3 text-sm ${themeClasses.mutedText}`}>
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              Loading Account Hub Data via Deterministic API...
            </div>
          </div>
        ) : hubError ? (
          <div className="p-6 bg-rose-950/30 border border-rose-800 rounded-lg text-rose-300 text-sm">
            Failed to load account hub. Error fetching data.
          </div>
        ) : hubData ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ================================================================ */}
            {/* LEFT COLUMN: Account Health (lg:col-span-3) */}
            {/* ================================================================ */}
            <div className="lg:col-span-3 space-y-4">
              {/* Account Overview Card */}
              <div className={`border rounded-xl p-5 ${themeClasses.cardBg}`}>
                <div className={`flex items-center justify-between pb-3 border-b ${themeClasses.tableBorder}`}>
                  <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${themeClasses.mutedText}`}>
                    <Building2 className="w-4 h-4 text-indigo-500" />
                    Account Profile
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${isDark ? 'bg-slate-800 text-indigo-400' : 'bg-slate-100 text-indigo-700'}`}>
                    {hubData.company.tier}
                  </span>
                </div>

                <div className="mt-4">
                  <h1 className={`text-xl font-bold tracking-tight leading-tight ${themeClasses.headingText}`}>
                    {hubData.company.name}
                  </h1>
                  <p className={`text-xs mt-1 ${themeClasses.mutedText}`}>
                    Account #{hubData.company.id} · Relational Postgres Row
                  </p>
                </div>

                <div className={`grid grid-cols-2 gap-3 mt-5 pt-4 border-t ${themeClasses.tableBorder}`}>
                  {/* Health Score */}
                  <div className={`p-3 rounded-lg border ${themeClasses.innerCardBg}`}>
                    <span className={`text-[11px] uppercase tracking-wider block ${themeClasses.mutedText}`}>
                      Health Score
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span
                        className={`text-2xl font-bold font-mono tabular-nums ${
                          hubData.company.health_score >= 80
                            ? 'text-emerald-500'
                            : hubData.company.health_score >= 60
                            ? 'text-amber-500'
                            : 'text-rose-500'
                        }`}
                      >
                        {hubData.company.health_score}
                      </span>
                      <span className={`text-xs font-mono ${themeClasses.mutedText}`}>/ 100</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full mt-2 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                      <div
                        className={`h-full transition-all duration-500 ${
                          hubData.company.health_score >= 80
                            ? 'bg-emerald-500'
                            : hubData.company.health_score >= 60
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${hubData.company.health_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Open Pipeline */}
                  <div className={`p-3 rounded-lg border ${themeClasses.innerCardBg}`}>
                    <span className={`text-[11px] uppercase tracking-wider block ${themeClasses.mutedText}`}>
                      Open Pipeline
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={`text-2xl font-bold font-mono tabular-nums ${themeClasses.headingText}`}>
                        ${(hubData.company.open_pipeline / 1000).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>
                      <span className={`text-xs font-mono ${themeClasses.mutedText}`}>k</span>
                    </div>
                    <span className={`text-[10px] block mt-2 ${themeClasses.mutedText}`}>
                      Active ACV Potential
                    </span>
                  </div>
                </div>
              </div>

              {/* Competitor Presence Monitor */}
              <div className={`border rounded-xl p-5 ${themeClasses.cardBg}`}>
                <div className={`flex items-center justify-between pb-3 border-b ${themeClasses.tableBorder}`}>
                  <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${themeClasses.mutedText}`}>
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    Competitor Threat Monitor
                  </div>
                  <span className={`text-xs font-mono ${themeClasses.mutedText}`}>
                    {hubData.competitor_presence.length} Tracked
                  </span>
                </div>

                <div className="mt-3 divide-y divide-slate-800/40">
                  {hubData.competitor_presence.length === 0 ? (
                    <div className={`py-4 text-xs text-center ${themeClasses.mutedText}`}>
                      No active competitor signals logged yet.
                    </div>
                  ) : (
                    hubData.competitor_presence.map((comp) => (
                      <div key={comp.id} className="py-2.5 first:pt-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-semibold ${themeClasses.headingText}`}>
                            {comp.competitor_name}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                              comp.threat_level === 'Active'
                                ? 'bg-rose-950/60 border border-rose-800 text-rose-300'
                                : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {comp.threat_level}
                          </span>
                        </div>
                        {comp.notes && (
                          <p className={`text-[11px] mt-1 line-clamp-2 ${themeClasses.mutedText}`}>
                            {comp.notes}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Interactions Audit Trail */}
              <div className={`border rounded-xl p-5 ${themeClasses.cardBg}`}>
                <div className={`flex items-center justify-between pb-3 border-b ${themeClasses.tableBorder}`}>
                  <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${themeClasses.mutedText}`}>
                    <Activity className="w-4 h-4 text-indigo-500" />
                    Interactions Log
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono ${themeClasses.mutedText}`}>
                      {hubData.interactions.length} Entries
                    </span>
                    <button
                      onClick={handleResetDemo}
                      title="Reset seed data"
                      className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-500 hover:text-slate-300' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {hubData.interactions.length === 0 ? (
                    <div className={`py-3 text-xs text-center ${themeClasses.mutedText}`}>
                      No interactions logged. Use bottom bar to log remarks.
                    </div>
                  ) : (
                    hubData.interactions.map((inter) => (
                      <div
                        key={inter.id}
                        className={`p-2.5 rounded-lg border text-xs ${themeClasses.innerCardBg}`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-medium text-indigo-400 truncate max-w-[140px]">
                            {inter.contact_name || 'General Account'}
                          </span>
                          <span className={`font-mono tabular-nums text-[10px] ${themeClasses.mutedText}`}>
                            {new Date(inter.timestamp).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className={`text-[12px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {inter.remark_text}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ================================================================ */}
            {/* CENTER COLUMN: Key Contacts (with checkboxes, CRUD) & Products (lg:col-span-6) */}
            {/* ================================================================ */}
            <div className="lg:col-span-6 space-y-6">
              {/* Table 1: Key Contacts Matrix with Checkboxes & In-line CRUD */}
              <div className={`border rounded-xl p-5 ${themeClasses.cardBg}`}>
                <div className={`flex items-center justify-between pb-4 border-b ${themeClasses.tableBorder}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm font-bold tracking-tight">
                      <Users className="w-4 h-4 text-indigo-500" />
                      <span className={themeClasses.headingText}>Key Contacts Matrix</span>
                    </div>
                    {selectedContactIds.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-400 font-mono">
                        {selectedContactIds.length} Selected
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsAddContactOpen(true)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium transition-colors shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Contact</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b uppercase text-[10px] tracking-wider ${themeClasses.tableHeader}`}>
                        {/* Select All Checkbox */}
                        <th className="py-2.5 px-3 w-8">
                          <button
                            onClick={handleToggleSelectAll}
                            className="p-0.5 rounded hover:bg-slate-800 transition-colors"
                            title={
                              selectedContactIds.length === hubData.contacts.length
                                ? 'Deselect all'
                                : 'Select all'
                            }
                          >
                            {selectedContactIds.length === 0 ? (
                              <Square className="w-4 h-4 text-slate-400" />
                            ) : selectedContactIds.length === hubData.contacts.length ? (
                              <CheckSquare className="w-4 h-4 text-indigo-500" />
                            ) : (
                              <MinusSquare className="w-4 h-4 text-indigo-400" />
                            )}
                          </button>
                        </th>
                        <th className="py-2.5 px-3">Contact & Title</th>
                        <th className="py-2.5 px-3">Role Type</th>
                        <th className="py-2.5 px-3">Disposition</th>
                        <th className="py-2.5 px-3 text-right">Target</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${themeClasses.tableBorder}`}>
                      {hubData.contacts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className={`py-6 text-center ${themeClasses.mutedText}`}>
                            No contacts on file for this account. Click "Add Contact" above.
                          </td>
                        </tr>
                      ) : (
                        hubData.contacts.map((contact) => {
                          const isSelected = selectedContactIds.includes(contact.id);
                          return (
                            <tr
                              key={contact.id}
                              className={`transition-colors ${themeClasses.rowHover} ${
                                isSelected ? (isDark ? 'bg-indigo-950/30' : 'bg-indigo-50/70') : ''
                              }`}
                            >
                              {/* Row Checkbox */}
                              <td className="py-3 px-3">
                                <button
                                  onClick={() => handleToggleContact(contact.id)}
                                  className="p-0.5 rounded transition-colors"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-indigo-500" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-400 hover:text-slate-300" />
                                  )}
                                </button>
                              </td>

                              {/* Contact Name & In-Line Edit/Delete Icons */}
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2 group">
                                  <span className={`font-semibold ${themeClasses.headingText}`}>
                                    {contact.name}
                                  </span>

                                  {/* In-Line Action Buttons in front of / next to name */}
                                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => setEditingContact(contact)}
                                      className={`p-1 rounded hover:bg-slate-800 transition-colors ${themeClasses.mutedText} hover:text-indigo-400`}
                                      title={`Edit ${contact.name}`}
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteContact(contact.id, contact.name)}
                                      className={`p-1 rounded hover:bg-slate-800 transition-colors ${themeClasses.mutedText} hover:text-rose-400`}
                                      title={`Delete ${contact.name}`}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <div className={`text-[11px] ${themeClasses.mutedText}`}>
                                  {contact.designation} {contact.email ? `· ${contact.email}` : ''}
                                </div>
                              </td>

                              {/* Role Type */}
                              <td className="py-3 px-3">
                                <span className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                  {contact.role_type}
                                </span>
                              </td>

                              {/* Disposition */}
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-flex items-center text-[11px] font-medium ${
                                    contact.disposition.toLowerCase().includes('champion')
                                      ? 'text-emerald-500'
                                      : contact.disposition.toLowerCase().includes('blocker') ||
                                        contact.disposition.toLowerCase().includes('negative')
                                      ? 'text-rose-500'
                                      : 'text-amber-500'
                                  }`}
                                >
                                  {contact.disposition}
                                </span>
                              </td>

                              {/* Single Target Selection for Bottom Remark Bar */}
                              <td className="py-3 px-3 text-right">
                                <button
                                  onClick={() =>
                                    setSelectedContactId(
                                      selectedContactId === contact.id ? null : contact.id
                                    )
                                  }
                                  className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                                    selectedContactId === contact.id
                                      ? 'bg-indigo-600 text-white font-medium'
                                      : isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  {selectedContactId === contact.id ? 'Targeted' : 'Target'}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 2: Products (Active vs White-Space) */}
              <div className={`border rounded-xl p-5 ${themeClasses.cardBg}`}>
                <div className={`flex items-center justify-between pb-4 border-b ${themeClasses.tableBorder}`}>
                  <div className="flex items-center gap-2 text-sm font-bold tracking-tight">
                    <Package className="w-4 h-4 text-emerald-500" />
                    <span className={themeClasses.headingText}>Product Portfolio (Active vs White-Space)</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-emerald-500 font-medium">
                      {hubData.products.filter((p) => p.status === 'Active').length} Active
                    </span>
                    <span className={themeClasses.mutedText}>·</span>
                    <span className="text-indigo-400 font-medium">
                      {hubData.products.filter((p) => p.status === 'White-Space').length} White-Space
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b uppercase text-[10px] tracking-wider ${themeClasses.tableHeader}`}>
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3">Contract Status</th>
                        <th className="py-2.5 px-3 text-right">Contract Value</th>
                        <th className="py-2.5 px-3 text-right">Renewal Date</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${themeClasses.tableBorder}`}>
                      {hubData.products.length === 0 ? (
                        <tr>
                          <td colSpan={4} className={`py-4 text-center ${themeClasses.mutedText}`}>
                            No products mapped to this account.
                          </td>
                        </tr>
                      ) : (
                        hubData.products.map((prod) => (
                          <tr key={prod.id} className={`transition-colors ${themeClasses.rowHover}`}>
                            <td className="py-3 px-3">
                              <span className={`font-semibold ${themeClasses.headingText}`}>
                                {prod.product_name}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded ${
                                  prod.status === 'Active'
                                    ? isDark
                                      ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300'
                                      : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                    : isDark
                                    ? 'bg-indigo-950/60 border border-indigo-800/60 text-indigo-300'
                                    : 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                                }`}
                              >
                                {prod.status}
                              </span>
                            </td>
                            <td className={`py-3 px-3 text-right font-mono tabular-nums ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              {prod.contract_value > 0
                                ? `$${Number(prod.contract_value).toLocaleString()}`
                                : '—'}
                            </td>
                            <td className={`py-3 px-3 text-right font-mono text-[11px] ${themeClasses.mutedText}`}>
                              {prod.renewal_date || 'Open Opportunity'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ================================================================ */}
            {/* RIGHT COLUMN: Agent Nudges (Suggested Moves) (lg:col-span-3) */}
            {/* ================================================================ */}
            <div className="lg:col-span-3 space-y-4">
              <div className={`border rounded-xl p-5 ${themeClasses.cardBg}`}>
                <div className={`flex items-center justify-between pb-3 border-b ${themeClasses.tableBorder}`}>
                  <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${themeClasses.mutedText}`}>
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    Deterministic Suggested Moves
                  </div>
                  <span className={`text-[11px] font-mono ${themeClasses.mutedText}`}>
                    {hubData.suggested_moves.length} Rules Active
                  </span>
                </div>

                <p className={`text-[11px] mt-2 ${themeClasses.mutedText}`}>
                  Evaluated deterministically against PostgreSQL state and parsed interaction signals.
                </p>

                {/* Instant Notification Banner when regex triggers */}
                {lastTriggerNotice && (
                  <div className={`mt-3 p-2.5 rounded border text-[11px] flex items-start gap-2 ${isDark ? 'bg-amber-950/50 border-amber-800/80 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800'}`}>
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                    <span>{lastTriggerNotice}</span>
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  {hubData.suggested_moves.length === 0 ? (
                    <div className={`p-4 rounded-lg border text-xs text-center ${themeClasses.innerCardBg} ${themeClasses.mutedText}`}>
                      No friction rules triggered. Account is in nominal state.
                    </div>
                  ) : (
                    hubData.suggested_moves.map((move, idx) => {
                      const isRisk =
                        move.category === 'competitive' ||
                        move.category === 'budget_risk' ||
                        move.urgency === 'High';
                      const isOpportunity =
                        move.category === 'whitespace_expansion' ||
                        move.category === 'expansion';

                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-lg border transition-all ${
                            isRisk
                              ? isDark
                                ? 'bg-rose-950/20 border-rose-800/60 text-rose-200'
                                : 'bg-rose-50/80 border-rose-200 text-rose-900'
                              : isOpportunity
                              ? isDark
                                ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-200'
                                : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                              : isDark
                              ? 'bg-indigo-950/20 border-indigo-800/60 text-indigo-200'
                              : 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs tracking-tight">
                              {move.action}
                            </span>
                            <span
                              className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                                isRisk
                                  ? 'bg-rose-900/40 text-rose-300 border border-rose-700/50'
                                  : isOpportunity
                                  ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                                  : 'bg-indigo-900/40 text-indigo-300 border border-indigo-700/50'
                              }`}
                            >
                              {move.urgency} Urgency
                            </span>
                          </div>

                          <p className={`text-[11px] mt-2 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {move.reason}
                          </p>

                          <div className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] font-mono ${isDark ? 'border-slate-800/40 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                            <span>Category: {move.category}</span>
                            <span>Deterministic Rule</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Deterministic Regex Preset Chips */}
              <div className={`border rounded-xl p-4 text-xs space-y-2 ${themeClasses.innerCardBg}`}>
                <span className={`text-[11px] font-semibold uppercase tracking-wider block ${themeClasses.headingText}`}>
                  Click to Test Deterministic Rules:
                </span>
                <div className="space-y-1.5 text-[11px]">
                  <button
                    onClick={() =>
                      handleQuickInsert(
                        'Spoke with Marcus: Competitor X has entered the account with a pilot proposal.'
                      )
                    }
                    className={`w-full text-left p-2 rounded border transition-colors ${
                      isDark
                        ? 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/50 text-slate-300 hover:text-white'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-xs'
                    }`}
                  >
                    1. <span className="text-rose-500 font-mono font-medium">"Competitor X"</span> → auto-logs competitor & triggers "Pitch Bridge"
                  </button>
                  <button
                    onClick={() =>
                      handleQuickInsert(
                        'Elena mentioned budget locked until Q4 due to corporate spending freeze.'
                      )
                    }
                    className={`w-full text-left p-2 rounded border transition-colors ${
                      isDark
                        ? 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/50 text-slate-300 hover:text-white'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-xs'
                    }`}
                  >
                    2. <span className="text-amber-500 font-mono font-medium">"budget locked"</span> → triggers zero-capex deferral nudge
                  </button>
                  <button
                    onClick={() =>
                      handleQuickInsert(
                        'Team requested expansion proposal for Automated Customs Clearance.'
                      )
                    }
                    className={`w-full text-left p-2 rounded border transition-colors ${
                      isDark
                        ? 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/50 text-slate-300 hover:text-white'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-xs'
                    }`}
                  >
                    3. <span className="text-emerald-500 font-mono font-medium">"Automated Customs Clearance"</span> → white-space expansion
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* ==================================================================== */}
      {/* FLOATING ACTION BAR FOR SELECTED CONTACTS */}
      {/* ==================================================================== */}
      {selectedContactIds.length > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-2xl backdrop-blur-lg ${
            isDark
              ? 'bg-slate-900/95 border-indigo-500/40 text-white'
              : 'bg-white/95 border-indigo-200 text-slate-900 shadow-indigo-100/50'
          }`}>
            {/* Selected Count */}
            <div className="flex items-center gap-2 pr-3 border-r border-slate-700/60">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-mono font-bold">
                {selectedContactIds.length}
              </span>
              <span className="text-xs font-semibold whitespace-nowrap">
                Selected
              </span>
            </div>

            {/* Action 1: Make Call */}
            <button
              onClick={() => {
                setCallTargetContactId(selectedContactIds[0]);
                setIsCallModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-sm"
              title="Call contact and log remarks to trigger deterministic parser"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Make Call</span>
            </button>

            {/* Action 2: Send Email */}
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm"
              title="Send email template and log to interactions"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send Email</span>
            </button>

            {/* Action 3: Update Disposition */}
            <button
              onClick={() => setIsDispositionModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                isDark
                  ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
              title="Update buying disposition of selected contacts"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Update Disposition</span>
            </button>

            {/* Action 4: Bulk Delete */}
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-medium transition-colors shadow-sm"
              title="Delete selected contacts"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            {/* Clear Selection */}
            <button
              onClick={() => setSelectedContactIds([])}
              className={`p-1 rounded-md transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* FIXED BOTTOM INPUT BAR (Instant Mutate) */}
      {/* ==================================================================== */}
      <footer className={`fixed bottom-0 left-0 right-0 z-40 border-t px-6 py-3.5 backdrop-blur-md transition-colors ${themeClasses.bottomBarBg}`}>
        <form
          onSubmit={handleSendRemark}
          className="max-w-[1720px] mx-auto flex items-center gap-4"
        >
          {/* Target Stakeholder Chip */}
          <div className="hidden sm:flex items-center gap-2 text-xs shrink-0">
            <span className={themeClasses.mutedText}>Target Contact:</span>
            <span className={`font-semibold ${themeClasses.headingText}`}>
              {selectedContactId && hubData?.contacts
                ? hubData.contacts.find((c) => c.id === selectedContactId)?.name || 'General Account'
                : 'General Account'}
            </span>
            <span className={themeClasses.mutedText}>|</span>
          </div>

          {/* Input field */}
          <div className="relative flex-1">
            <input
              type="text"
              value={remarkInput}
              onChange={(e) => setRemarkInput(e.target.value)}
              placeholder="Type sales remark (e.g. 'Competitor X is running a pilot' or 'CFO stated budget locked')..."
              className={`w-full py-2.5 px-4 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                isDark
                  ? 'bg-slate-950 border border-slate-700 text-slate-200 placeholder:text-slate-500'
                  : 'bg-slate-100 border border-slate-300 text-slate-900 placeholder:text-slate-400'
              }`}
              disabled={isSubmitting}
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!remarkInput.trim() || isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold transition-all shrink-0 shadow-md cursor-pointer"
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

      {/* ==================================================================== */}
      {/* MODAL 1: ADD COMPANY */}
      {/* ==================================================================== */}
      {isAddCompanyOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${themeClasses.cardBg}`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
              <h3 className={`text-sm font-bold ${themeClasses.headingText}`}>Create New Account</h3>
              <button
                onClick={() => setIsAddCompanyOpen(false)}
                className={`p-1 rounded-md ${themeClasses.mutedText} hover:text-white`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="mt-4 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${themeClasses.mutedText}`}>
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Horizon Global Dynamics"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${themeClasses.inputBg}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${themeClasses.mutedText}`}>
                    Tier
                  </label>
                  <select
                    value={newCompanyTier}
                    onChange={(e) => setNewCompanyTier(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${themeClasses.inputBg}`}
                  >
                    <option value="Tier 1">Tier 1 (Enterprise)</option>
                    <option value="Tier 2">Tier 2 (Strategic)</option>
                    <option value="Tier 3">Tier 3 (Growth)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${themeClasses.mutedText}`}>
                    Health Score (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newCompanyScore}
                    onChange={(e) => setNewCompanyScore(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none ${themeClasses.inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${themeClasses.mutedText}`}>
                  Initial Pipeline ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={newCompanyPipeline}
                  onChange={(e) => setNewCompanyPipeline(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none ${themeClasses.inputBg}`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-700/40">
                <button
                  type="button"
                  onClick={() => setIsAddCompanyOpen(false)}
                  className={`px-3 py-2 rounded-lg text-xs ${themeClasses.mutedText} hover:bg-slate-800`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  Create Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: ADD CONTACT */}
      {/* ==================================================================== */}
      {isAddContactOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${themeClasses.cardBg}`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
              <h3 className={`text-sm font-bold ${themeClasses.headingText}`}>
                Add Key Contact to {hubData?.company.name}
              </h3>
              <button
                onClick={() => setIsAddContactOpen(false)}
                className={`p-1 rounded-md ${themeClasses.mutedText} hover:text-white`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="mt-4 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${themeClasses.mutedText}`}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jonathan Mercer"
                  value={contactNameInput}
                  onChange={(e) => setContactNameInput(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${themeClasses.inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${themeClasses.mutedText}`}>
                  Designation / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Head of Infrastructure & SecOps"
                  value={contactDesignationInput}
                  onChange={(e) => setContactDesignationInput(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${themeClasses.inputBg}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${themeClasses.mutedText}`}>
                    Role Type
                  </label>
                  <select
                    value={contactRoleInput}
                    onChange={(e) => setContactRoleInput(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${themeClasses.inputBg}`}
                  >
                    <option value="Champion">Champion</option>
                    <option value="Economic Buyer">Economic Buyer</option>
                    <option value="Technical Evaluator">Technical Evaluator</option>
                    <option value="Blocker">Blocker</option>
                    <option value="Influencer">Influencer</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${themeClasses.mutedText}`}>
                    Disposition
                  </label>
                  <select
                    value={contactDispositionInput}
                    onChange={(e) => setContactDispositionInput(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${themeClasses.inputBg}`}
                  >
                    <option value="Strong Champion">Strong Champion</option>
                    <option value="Cautious / Evaluating">Cautious / Evaluating</option>
                    <option value="Negative / Resistant">Negative / Resistant</option>
                    <option value="Neutral">Neutral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${themeClasses.mutedText}`}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. j.mercer@company.com"
                  value={contactEmailInput}
                  onChange={(e) => setContactEmailInput(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${themeClasses.inputBg}`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-700/40">
                <button
                  type="button"
                  onClick={() => setIsAddContactOpen(false)}
                  className={`px-3 py-2 rounded-lg text-xs ${themeClasses.mutedText} hover:bg-slate-800`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: EDIT CONTACT */}
      {/* ==================================================================== */}
      {editingContact && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${themeClasses.cardBg}`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
              <h3 className={`text-sm font-bold ${themeClasses.headingText}`}>
                Edit Contact: {editingContact.name}
              </h3>
              <button
                onClick={() => setEditingContact(null)}
                className={`p-1 rounded-md ${themeClasses.mutedText} hover:text-white`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateContact} className="mt-4 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${themeClasses.mutedText}`}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editingContact.name}
                  onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${themeClasses.inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${themeClasses.mutedText}`}>
                  Designation / Title
                </label>
                <input
                  type="text"
                  required
                  value={editingContact.designation}
                  onChange={(e) =>
                    setEditingContact({ ...editingContact, designation: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${themeClasses.inputBg}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${themeClasses.mutedText}`}>
                    Role Type
                  </label>
                  <select
                    value={editingContact.role_type}
                    onChange={(e) =>
                      setEditingContact({ ...editingContact, role_type: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${themeClasses.inputBg}`}
                  >
                    <option value="Champion">Champion</option>
                    <option value="Economic Buyer">Economic Buyer</option>
                    <option value="Technical Evaluator">Technical Evaluator</option>
                    <option value="Blocker">Blocker</option>
                    <option value="Influencer">Influencer</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${themeClasses.mutedText}`}>
                    Disposition
                  </label>
                  <select
                    value={editingContact.disposition}
                    onChange={(e) =>
                      setEditingContact({ ...editingContact, disposition: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${themeClasses.inputBg}`}
                  >
                    <option value="Strong Champion">Strong Champion</option>
                    <option value="Cautious / Evaluating">Cautious / Evaluating</option>
                    <option value="Negative / Resistant">Negative / Resistant</option>
                    <option value="Neutral">Neutral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${themeClasses.mutedText}`}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={editingContact.email || ''}
                  onChange={(e) =>
                    setEditingContact({ ...editingContact, email: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${themeClasses.inputBg}`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-700/40">
                <button
                  type="button"
                  onClick={() => setEditingContact(null)}
                  className={`px-3 py-2 rounded-lg text-xs ${themeClasses.mutedText} hover:bg-slate-800`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  Update Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: MAKE CALL & LOG REMARK */}
      {/* ==================================================================== */}
      {isCallModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${themeClasses.cardBg}`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-500" />
                <h3 className={`text-sm font-bold ${themeClasses.headingText}`}>
                  Make Call & Deterministically Parse Remarks
                </h3>
              </div>
              <button
                onClick={() => setIsCallModalOpen(false)}
                className={`p-1 rounded-md ${themeClasses.mutedText} hover:text-white`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogCall} className="mt-4 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${themeClasses.mutedText}`}>
                  Contact Being Called
                </label>
                <select
                  value={callTargetContactId || ''}
                  onChange={(e) => setCallTargetContactId(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${themeClasses.inputBg}`}
                >
                  {hubData?.contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.designation}) — {c.disposition}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${themeClasses.mutedText}`}>
                  Call Remarks & Intelligence Notes
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Record call outcome... Deterministic regex will scan for signals like 'Competitor X' or 'budget locked'!"
                  value={callNotesInput}
                  onChange={(e) => setCallNotesInput(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${themeClasses.inputBg}`}
                />
              </div>

              {/* Quick Call Note Templates */}
              <div className="space-y-1.5">
                <span className={`text-[11px] block ${themeClasses.mutedText}`}>
                  Quick Deterministic Call Templates:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setCallNotesInput(
                        'Completed executive debrief. Contact disclosed that Competitor X submitted a competitive proposal to procurement.'
                      )
                    }
                    className={`px-2 py-1 rounded text-[11px] border transition-colors ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                        : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    + Flag "Competitor X" Mention
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCallNotesInput(
                        'Stakeholder confirmed budget locked until Q4 audit completion. Need zero-capex pilot bridge.'
                      )
                    }
                    className={`px-2 py-1 rounded text-[11px] border transition-colors ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                        : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    + Flag "budget locked" Risk
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-700/40">
                <button
                  type="button"
                  onClick={() => setIsCallModalOpen(false)}
                  className={`px-3 py-2 rounded-lg text-xs ${themeClasses.mutedText} hover:bg-slate-800`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                >
                  Save Call & Re-run Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 5: SEND EMAIL TEMPLATE */}
      {/* ==================================================================== */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${themeClasses.cardBg}`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-500" />
                <h3 className={`text-sm font-bold ${themeClasses.headingText}`}>
                  Send Email to {selectedContactIds.length} Stakeholder(s)
                </h3>
              </div>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className={`p-1 rounded-md ${themeClasses.mutedText} hover:text-white`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="mt-4 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${themeClasses.mutedText}`}>
                  Email Template Subject
                </label>
                <input
                  type="text"
                  required
                  value={emailSubjectInput}
                  onChange={(e) => setEmailSubjectInput(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${themeClasses.inputBg}`}
                />
              </div>

              <div className="space-y-1.5">
                <span className={`text-[11px] block ${themeClasses.mutedText}`}>
                  Select Standard Template:
                </span>
                <div className="space-y-1">
                  {[
                    'Technical Architecture & Security Redlines',
                    'Competitive Displacement & Bridge Assessment',
                    'Quarterly Roadmap Review & Pilot Scope',
                  ].map((tmpl) => (
                    <button
                      key={tmpl}
                      type="button"
                      onClick={() => setEmailSubjectInput(tmpl)}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-[11px] border transition-colors ${
                        emailSubjectInput === tmpl
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 font-medium'
                          : isDark
                          ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                          : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      {tmpl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-700/40">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className={`px-3 py-2 rounded-lg text-xs ${themeClasses.mutedText} hover:bg-slate-800`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  Dispatch & Log Interaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 6: BATCH UPDATE DISPOSITION */}
      {/* ==================================================================== */}
      {isDispositionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl ${themeClasses.cardBg}`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
              <h3 className={`text-sm font-bold ${themeClasses.headingText}`}>
                Update Disposition ({selectedContactIds.length} Contacts)
              </h3>
              <button
                onClick={() => setIsDispositionModalOpen(false)}
                className={`p-1 rounded-md ${themeClasses.mutedText} hover:text-white`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${themeClasses.mutedText}`}>
                  New Disposition State
                </label>
                <select
                  value={bulkDispositionSelect}
                  onChange={(e) => setBulkDispositionSelect(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${themeClasses.inputBg}`}
                >
                  <option value="Strong Champion">Strong Champion</option>
                  <option value="Cautious / Evaluating">Cautious / Evaluating</option>
                  <option value="Negative / Resistant">Negative / Resistant</option>
                  <option value="Neutral">Neutral</option>
                </select>
              </div>

              <p className={`text-[11px] ${themeClasses.mutedText}`}>
                Setting disposition to "Negative / Resistant" will trigger the deterministic champion multi-threading move.
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-700/40">
                <button
                  type="button"
                  onClick={() => setIsDispositionModalOpen(false)}
                  className={`px-3 py-2 rounded-lg text-xs ${themeClasses.mutedText} hover:bg-slate-800`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkUpdateDisposition}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  Apply & Recalculate Moves
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SOURCE CODE & DDL ARTIFACTS MODAL */}
      {/* ==================================================================== */}
      {activeCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <Code2 className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Deliverables & Source Artifacts
                  </h3>
                  <p className="text-xs text-slate-400">
                    PostgreSQL DDL, FastAPI (Async), Next.js SWR page, and Docker Compose
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveCodeModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            {/* File Switcher Tabs */}
            <div className="flex items-center gap-1 px-6 py-2.5 bg-slate-950 border-b border-slate-800 overflow-x-auto">
              {[
                { name: 'schema.sql', label: '1. schema.sql' },
                { name: 'seed.sql', label: '1. seed.sql' },
                { name: 'main.py', label: '2. main.py (FastAPI)' },
                { name: 'parser.py', label: '2. parser.py (Regex)' },
                { name: 'models.py', label: '2. models.py' },
                { name: 'database.py', label: '2. database.py' },
                { name: 'page.tsx', label: '3. page.tsx (Next.js)' },
                { name: 'docker-compose.yml', label: '4. docker-compose.yml' },
              ].map((f) => (
                <button
                  key={f.name}
                  onClick={() => setActiveCodeModal(f.name)}
                  className={`px-3 py-1.5 text-xs font-mono rounded-md whitespace-nowrap transition-colors ${
                    activeCodeModal === f.name
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Code Content Area */}
            <div className="relative flex-1 p-6 overflow-y-auto bg-slate-950 font-mono text-xs text-slate-200">
              <div className="absolute top-4 right-6 flex items-center gap-2">
                <button
                  onClick={() => codeData?.content && copyToClipboard(codeData.content)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans transition-colors border border-slate-700 cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              {codeData ? (
                <pre className="whitespace-pre-wrap leading-relaxed select-text pt-2">
                  {codeData.content}
                </pre>
              ) : (
                <div className="flex items-center justify-center py-20 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading file content...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
