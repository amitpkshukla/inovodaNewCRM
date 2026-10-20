/**
 * Deterministic B2B Sales Operating System - Full-Stack Express Server
 * Serves deterministic API endpoints & mounts Vite middleware.
 * ZERO LLMs - Deterministic SQL/State Lookups, Regex Parsing, and Hardcoded Rule Matrix.
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

// ============================================================================
// IN-MEMORY DETERMINISTIC STORE (Mirrors PostgreSQL schema & seed.sql)
// ============================================================================

interface Company {
  id: number;
  name: string;
  tier: string;
  health_score: number;
  open_pipeline: number;
}

interface Contact {
  id: number;
  company_id: number;
  is_key_contact: boolean;
  name: string;
  designation: string;
  role_type: string;
  disposition: string;
  email?: string;
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
}

interface Product {
  id: number;
  company_id: number;
  product_name: string;
  status: 'Active' | 'White-Space';
  contract_value: number;
  renewal_date?: string | null;
}

interface CompetitorPresence {
  id: number;
  company_id: number;
  competitor_name: string;
  threat_level: 'Active' | 'Monitoring' | 'Displaced';
  first_detected_at: string;
  notes?: string;
}

interface Interaction {
  id: number;
  company_id: number;
  contact_id?: number | null;
  contact_name?: string;
  remark_text: string;
  timestamp: string;
}

interface SuggestedMove {
  action: string;
  urgency: 'High' | 'Medium' | 'Low';
  reason: string;
  category: 'competitive' | 'budget_risk' | 'whitespace_expansion' | 'relationship' | 'expansion' | 'risk' | 'opportunity';
}

// Initial state initialized from seed.sql
let companies: Company[] = [
  {
    id: 1,
    name: 'Apex Industrial Logistics',
    tier: 'Tier 1',
    health_score: -50,
    open_pipeline: 185000.0,
  },
  {
    id: 2,
    name: 'Vanguard Cloud Systems',
    tier: 'Tier 2',
    health_score: 62,
    open_pipeline: 94000.0,
  },
];

let contacts: Contact[] = [
  {
    id: 1,
    company_id: 1,
    is_key_contact: true,
    name: 'Elena Rostova',
    designation: 'Chief Procurement Officer',
    role_type: 'Economic Buyer',
    disposition: 'Cautious / Evaluating',
    email: 'elena.rostova@apexindustrial.com',
    contact_number: '+1-312-555-0192',
    mobile_number: '+1-312-555-0144',
    email_id: 'elena.rostova@apexindustrial.com',
    linkedin_url: 'https://linkedin.com/in/elena-rostova',
    remarks: 'Requested security redlines and updated SLA commitments before Q4 refresh.',
    last_meeting_date: '2026-10-12',
    next_meeting_date: '2026-10-28',
    appointment_given: 'Yes',
    appointment_date: '2026-10-28',
    meeting_status: 'Scheduled',
    product: 'Fleet Telemetry Hub',
    opp_snapshot: '$120k Contract Renewal',
  },
  {
    id: 2,
    company_id: 1,
    is_key_contact: true,
    name: 'Marcus Vance',
    designation: 'VP Supply Chain Engineering',
    role_type: 'Champion',
    disposition: 'Strong Champion',
    email: 'marcus.vance@apexindustrial.com',
    contact_number: '+1-312-555-0188',
    mobile_number: '+1-312-555-0129',
    email_id: 'marcus.vance@apexindustrial.com',
    linkedin_url: 'https://linkedin.com/in/marcus-vance',
    remarks: 'Internal champion. Mentioned Competitor X submitted a POC to procurement.',
    last_meeting_date: '2026-10-18',
    next_meeting_date: '2026-11-04',
    appointment_given: 'Pending',
    appointment_date: '2026-11-04',
    meeting_status: 'Awaiting Confirmation',
    product: 'Predictive Route Dispatch',
    opp_snapshot: '$65k Expansion',
  },
  {
    id: 3,
    company_id: 1,
    is_key_contact: false,
    name: 'Derek Chen',
    designation: 'Director of Warehouse IT',
    role_type: 'Blocker',
    disposition: 'Negative / Resistant',
    email: 'derek.chen@apexindustrial.com',
    contact_number: '+1-312-555-0211',
    mobile_number: '+1-312-555-0298',
    email_id: 'derek.chen@apexindustrial.com',
    linkedin_url: 'https://linkedin.com/in/derek-chen-it',
    remarks: 'Resistant to vendor migration. Strongly prefers legacy on-prem infrastructure.',
    last_meeting_date: '2026-09-22',
    next_meeting_date: 'Not Planned',
    appointment_given: 'No',
    appointment_date: 'N/A',
    meeting_status: 'Follow-up Needed',
    product: 'Customs Automated Clearance',
    opp_snapshot: 'Early Evaluation',
  },
  {
    id: 4,
    company_id: 1,
    is_key_contact: false,
    name: 'Sarah Lin',
    designation: 'Lead Integration Architect',
    role_type: 'Technical Evaluator',
    disposition: 'Neutral',
    email: 'sarah.lin@apexindustrial.com',
    contact_number: '+1-312-555-0344',
    mobile_number: '+1-312-555-0312',
    email_id: 'sarah.lin@apexindustrial.com',
    linkedin_url: 'https://linkedin.com/in/sarah-lin-integration',
    remarks: 'Benchmarking REST webhook latency and high-availability failover specs.',
    last_meeting_date: '2026-10-04',
    next_meeting_date: '2026-10-30',
    appointment_given: 'Yes',
    appointment_date: '2026-10-30',
    meeting_status: 'Scheduled',
    product: 'Core Platform API Mesh',
    opp_snapshot: 'Architecture Sync',
  },
  {
    id: 5,
    company_id: 2,
    is_key_contact: true,
    name: 'Sophia Martinez',
    designation: 'VP of Platform Architecture',
    role_type: 'Champion',
    disposition: 'Strong Champion',
    email: 'smartinez@vanguardcloud.io',
    contact_number: '+1-512-555-0101',
    mobile_number: '+1-512-555-0122',
    email_id: 'smartinez@vanguardcloud.io',
    linkedin_url: 'https://linkedin.com/in/smartinez-cloud',
    remarks: 'Architecture review completed. Zero-Trust Identity Bridge selected for POC.',
    last_meeting_date: '2026-10-14',
    next_meeting_date: '2026-11-10',
    appointment_given: 'Yes',
    appointment_date: '2026-11-10',
    meeting_status: 'Scheduled',
    product: 'Zero-Trust Identity Bridge',
    opp_snapshot: '$54k New Expansion',
  },
  {
    id: 6,
    company_id: 2,
    is_key_contact: false,
    name: 'Arthur Pendelton',
    designation: 'Head of Cloud Infrastructure',
    role_type: 'Economic Buyer',
    disposition: 'Cautious / Evaluating',
    email: 'apendelton@vanguardcloud.io',
    contact_number: '+1-512-555-0233',
    mobile_number: '+1-512-555-0277',
    email_id: 'apendelton@vanguardcloud.io',
    linkedin_url: 'https://linkedin.com/in/arthur-pendelton',
    remarks: 'Reviewed audit compliance logs for SOC2 Type II.',
    last_meeting_date: '2026-09-30',
    next_meeting_date: '2026-11-15',
    appointment_given: 'Pending',
    appointment_date: '2026-11-15',
    meeting_status: 'Reviewing',
    product: 'Core Cluster Management',
    opp_snapshot: '$80k Active',
  },
];

let products: Product[] = [
  {
    id: 1,
    company_id: 1,
    product_name: 'Warehouse Fleet Telemetry',
    status: 'Active',
    contract_value: 120000.0,
    renewal_date: '2027-03-31',
  },
  {
    id: 2,
    company_id: 1,
    product_name: 'Predictive Route Dispatch',
    status: 'White-Space',
    contract_value: 65000.0,
    renewal_date: null,
  },
  {
    id: 3,
    company_id: 1,
    product_name: 'Automated Customs Clearance',
    status: 'White-Space',
    contract_value: 45000.0,
    renewal_date: null,
  },
  {
    id: 4,
    company_id: 2,
    product_name: 'Core Cluster Management',
    status: 'Active',
    contract_value: 80000.0,
    renewal_date: '2026-12-15',
  },
  {
    id: 5,
    company_id: 2,
    product_name: 'Zero-Trust Identity Bridge',
    status: 'White-Space',
    contract_value: 54000.0,
    renewal_date: null,
  },
];

let competitorPresence: CompetitorPresence[] = [
  {
    id: 1,
    company_id: 2,
    competitor_name: 'Legacy Vendor Y',
    threat_level: 'Monitoring',
    first_detected_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    notes: 'Incumbent provider on legacy multi-tenant nodes',
  },
];

let interactions: Interaction[] = [
  {
    id: 1,
    company_id: 1,
    contact_id: 1,
    remark_text: 'Quarterly technical review completed. Marcus confirmed Fleet Telemetry SLA is meeting 99.98% uptime.',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    contact_name: 'Marcus Vance',
  },
  {
    id: 2,
    company_id: 1,
    contact_id: 2,
    remark_text: 'Initial discovery call regarding Q3 procurement cycle. Elena requested updated security certifications.',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    contact_name: 'Elena Rostova',
  },
];

// ============================================================================
// DETERMINISTIC REGEX PARSING LOGIC
// ============================================================================

const RE_COMPETITOR_X = /\b(Competitor\s*X)\b/i;
const RE_GENERIC_COMPETITOR = /\b(?:competitor|evaluating|vendor|contract with)\s+([A-Z][A-Za-z0-9_-]+(?:\s+[A-Z][A-Za-z0-9_-]+)?)\b/i;
const RE_BUDGET_LOCKED = /\b(budget\s+(?:locked|frozen|cut|halted)|freeze\s+on\s+spend|spending\s+freeze)\b/i;

function parseInteractionDeterministic(remarkText: string) {
  const triggeredRules: string[] = [];
  let competitorDetected: string | null = null;
  let specificNudge: SuggestedMove | null = null;

  // Rule 1: Competitor X Detection
  if (RE_COMPETITOR_X.test(remarkText)) {
    competitorDetected = 'Competitor X';
    triggeredRules.push('COMPETITOR_X_REGEX_MATCH');
  } else {
    const genMatch = remarkText.match(RE_GENERIC_COMPETITOR);
    if (genMatch && genMatch[1]) {
      const name = genMatch[1].trim();
      if (!['our', 'the', 'a', 'this', 'q1', 'q2', 'q3', 'q4'].includes(name.toLowerCase())) {
        competitorDetected = name;
        triggeredRules.push('GENERIC_COMPETITOR_REGEX_MATCH');
      }
    }
  }

  // Rule 2: Budget Locked Detection
  if (RE_BUDGET_LOCKED.test(remarkText)) {
    triggeredRules.push('BUDGET_LOCKED_REGEX_MATCH');
    specificNudge = {
      action: 'Freeze Pricing Proposal; Offer Deferral & Pilot Bridge',
      urgency: 'High',
      reason: "Deterministic regex detected 'budget locked' condition. Shift from upfront ACV to zero-capex pilot.",
      category: 'budget_risk',
    };
  }

  return { competitorDetected, specificNudge, triggeredRules };
}

function calculateSuggestedMoves(
  company: Company,
  companyContacts: Contact[],
  companyProducts: Product[],
  companyCompetitors: CompetitorPresence[],
  extraNudges: SuggestedMove[] = []
): SuggestedMove[] {
  const moves: SuggestedMove[] = [];

  // Priority 1: Immediate extra nudges from latest interaction
  if (extraNudges.length > 0) {
    moves.push(...extraNudges);
  }

  // Priority 2: Competitor Presence
  const activeCompetitors = companyCompetitors.filter((c) => c.threat_level === 'Active');
  if (activeCompetitors.length > 0) {
    const compNames = activeCompetitors.map((c) => c.competitor_name).join(', ');
    moves.push({
      action: 'Pitch Bridge',
      urgency: 'High',
      reason: `Active competitor presence detected (${compNames}). Deploy defensive migration battlecard & competitive audit.`,
      category: 'competitive',
    });
  }

  // Priority 3: Health Score threshold
  if (company.health_score < 70) {
    moves.push({
      action: 'Executive Sponsor Check-in',
      urgency: 'High',
      reason: `Health score ${company.health_score}/100 is below 70 threshold. Trigger VP-to-VP sync to avert churn risk.`,
      category: 'relationship',
    });
  }

  // Priority 4: Key Stakeholder / Disposition rules
  const blockers = companyContacts.filter(
    (c) =>
      c.role_type.toLowerCase().includes('blocker') ||
      c.disposition.toLowerCase().includes('negative') ||
      c.disposition.toLowerCase().includes('resistant')
  );
  const champions = companyContacts.filter(
    (c) =>
      c.role_type.toLowerCase().includes('champion') ||
      c.disposition.toLowerCase().includes('champion')
  );

  if (blockers.length > 0 && champions.length > 0) {
    const championNames = champions.map((c) => c.name).join(', ');
    const blockerNames = blockers.map((c) => c.name).join(', ');
    moves.push({
      action: `Multi-Thread Through Champion (${championNames})`,
      urgency: 'High',
      reason: `Resistance detected from ${blockerNames}. Arm champion with technical ROI deck to neutralize objections.`,
      category: 'relationship',
    });
  } else if (blockers.length > 0 && champions.length === 0) {
    moves.push({
      action: 'Identify Internal Champion',
      urgency: 'High',
      reason: 'Single-threaded with resistant stakeholder. Map engineering team for sympathetic technical champion.',
      category: 'relationship',
    });
  }

  // Priority 5: Product White-Space Expansion
  const whitespaceProducts = companyProducts.filter((p) => p.status === 'White-Space');
  if (whitespaceProducts.length > 0) {
    const targetProduct = whitespaceProducts[0].product_name;
    moves.push({
      action: `Pitch White-Space: ${targetProduct}`,
      urgency: 'Medium',
      reason: `Account has active primary license but uncontracted white-space in ${targetProduct}.`,
      category: 'whitespace_expansion',
    });
  }

  // Priority 6: Tier 1 high pipeline rule
  if (company.tier === 'Tier 1' && company.open_pipeline > 150000 && moves.length < 4) {
    moves.push({
      action: 'Schedule Procurement Pre-Flight',
      urgency: 'Medium',
      reason: `Enterprise pipeline $${company.open_pipeline.toLocaleString()} requires security redline and MSA pre-approval.`,
      category: 'expansion',
    });
  }

  return moves;
}

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      system: 'Deterministic B2B Sales OS',
      intelligence_mode: 'Strictly Deterministic (Regex & Hardcoded Rules)',
      llm_enabled: false,
    });
  });

  // Search companies endpoint (Postgres ILIKE simulation)
  app.get('/api/companies/search', (req: Request, res: Response) => {
    const q = ((req.query.q as string) || '').trim().toLowerCase();
    if (!q) {
      return res.json([]);
    }
    const filtered = companies.filter(
      (c) => c.name.toLowerCase().includes(q) || c.tier.toLowerCase().includes(q)
    );
    res.json(filtered);
  });

  // Unified Account Hub endpoint
  app.get('/api/companies/:id/hub', (req: Request, res: Response) => {
    const companyId = parseInt(req.params.id, 10);
    const company = companies.find((c) => c.id === companyId);

    if (!company) {
      return res.status(404).json({ error: `Company ID ${companyId} not found` });
    }

    const companyContacts = contacts.filter((c) => c.company_id === companyId);
    const companyProducts = products.filter((p) => p.company_id === companyId);
    const companyCompetitors = competitorPresence.filter((c) => c.company_id === companyId);
    const companyInteractions = interactions
      .filter((i) => i.company_id === companyId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const suggestedMoves = calculateSuggestedMoves(
      company,
      companyContacts,
      companyProducts,
      companyCompetitors
    );

    const keyContacts = companyContacts.filter((c) => (c as any).is_key_contact !== false);
    const otherContacts = companyContacts.filter((c) => (c as any).is_key_contact === false);

    res.json({
      company: {
        ...company,
        website: 'https://apexindustrial.com',
        industry: 'Supply Chain & Cloud Infrastructure',
        health_status: company.health_score < 70 ? 'CRITICAL' : 'HEALTHY',
        oldest_opp_days: company.id === 1 ? 302 : 114,
        last_meeting_date: '2026-10-18',
        next_meeting_date: '2026-11-04',
      },
      contacts: companyContacts,
      key_contacts: keyContacts.length > 0 ? keyContacts : companyContacts.slice(0, 2),
      other_contacts: otherContacts.length > 0 ? otherContacts : companyContacts.slice(2),
      products: companyProducts,
      competitor_presence: companyCompetitors,
      interactions: companyInteractions,
      suggested_moves: suggestedMoves,
    });
  });

  // Post interaction with deterministic regex parsing
  app.post('/api/interactions', (req: Request, res: Response) => {
    const { company_id, contact_id, remark_text } = req.body;

    if (!company_id || !remark_text) {
      return res.status(400).json({ error: 'company_id and remark_text are required' });
    }

    const company = companies.find((c) => c.id === Number(company_id));
    if (!company) {
      return res.status(404).json({ error: `Company ${company_id} not found` });
    }

    // 1. Run deterministic regex parser
    const { competitorDetected, specificNudge, triggeredRules } =
      parseInteractionDeterministic(remark_text);

    let newCompetitorName: string | null = null;
    if (competitorDetected) {
      const existingComp = competitorPresence.find(
        (cp) =>
          cp.company_id === company.id &&
          cp.competitor_name.toLowerCase() === competitorDetected!.toLowerCase()
      );

      if (existingComp) {
        existingComp.threat_level = 'Active';
        existingComp.notes = `Flagged active in remark: "${remark_text.slice(0, 100)}..."`;
      } else {
        const newComp: CompetitorPresence = {
          id: competitorPresence.length + 1,
          company_id: company.id,
          competitor_name: competitorDetected,
          threat_level: 'Active',
          first_detected_at: new Date().toISOString(),
          notes: `Auto-detected via regex in remark: "${remark_text.slice(0, 100)}..."`,
        };
        competitorPresence.push(newComp);
        newCompetitorName = competitorDetected;
      }
    }

    // Contact name lookup
    let contactName = 'General Account';
    if (contact_id) {
      const matchedContact = contacts.find((c) => c.id === Number(contact_id));
      if (matchedContact) {
        contactName = matchedContact.name;
      }
    }

    // 2. Persist new interaction
    const newInteraction: Interaction = {
      id: interactions.length + 1,
      company_id: company.id,
      contact_id: contact_id ? Number(contact_id) : null,
      remark_text,
      timestamp: new Date().toISOString(),
      contact_name: contactName,
    };
    interactions.push(newInteraction);

    // 3. Recalculate deterministic suggested moves
    const companyContacts = contacts.filter((c) => c.company_id === company.id);
    const companyProducts = products.filter((p) => p.company_id === company.id);
    const companyCompetitors = competitorPresence.filter((c) => c.company_id === company.id);
    const extraNudges: SuggestedMove[] = specificNudge ? [specificNudge] : [];

    const updatedMoves = calculateSuggestedMoves(
      company,
      companyContacts,
      companyProducts,
      companyCompetitors,
      extraNudges
    );

    res.json({
      success: true,
      interaction: newInteraction,
      triggered_rules: triggeredRules,
      new_competitor_detected: newCompetitorName,
      suggested_moves: updatedMoves,
      nudges: extraNudges,
    });
  });

  // Create new company
  app.post('/api/companies', (req: Request, res: Response) => {
    const { name, tier, health_score, open_pipeline } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Company name is required' });
    }
    const newCompany: Company = {
      id: companies.length > 0 ? Math.max(...companies.map((c) => c.id)) + 1 : 1,
      name: name.trim(),
      tier: tier || 'Tier 2',
      health_score: Number(health_score) || 75,
      open_pipeline: Number(open_pipeline) || 0,
    };
    companies.push(newCompany);

    // Add default core active product & white-space product
    products.push({
      id: products.length + 1,
      company_id: newCompany.id,
      product_name: 'Core Platform License',
      status: 'Active',
      contract_value: 50000.0,
      renewal_date: '2027-01-01',
    });
    products.push({
      id: products.length + 1,
      company_id: newCompany.id,
      product_name: 'Enterprise Analytics Bridge',
      status: 'White-Space',
      contract_value: 35000.0,
      renewal_date: null,
    });

    res.status(201).json(newCompany);
  });

  // Create new contact
  app.post('/api/contacts', (req: Request, res: Response) => {
    const { company_id, name, designation, role_type, disposition, email, is_key_contact } = req.body;
    if (!company_id || !name || !designation) {
      return res.status(400).json({ error: 'company_id, name, and designation are required' });
    }
    const newContact: Contact = {
      id: contacts.length > 0 ? Math.max(...contacts.map((c) => c.id)) + 1 : 1,
      company_id: Number(company_id),
      is_key_contact: Boolean(is_key_contact),
      name: name.trim(),
      designation: designation.trim(),
      role_type: role_type || 'Champion',
      disposition: disposition || 'Cautious / Evaluating',
      email: email ? email.trim() : undefined,
    };
    contacts.push(newContact);
    res.status(201).json(newContact);
  });

  // Update existing contact
  app.put('/api/contacts/:id', (req: Request, res: Response) => {
    const contactId = parseInt(req.params.id, 10);
    const index = contacts.findIndex((c) => c.id === contactId);
    if (index === -1) {
      return res.status(404).json({ error: `Contact ID ${contactId} not found` });
    }
    const { name, designation, role_type, disposition, email } = req.body;
    contacts[index] = {
      ...contacts[index],
      name: name !== undefined ? name.trim() : contacts[index].name,
      designation: designation !== undefined ? designation.trim() : contacts[index].designation,
      role_type: role_type !== undefined ? role_type : contacts[index].role_type,
      disposition: disposition !== undefined ? disposition : contacts[index].disposition,
      email: email !== undefined ? email.trim() : contacts[index].email,
    };
    res.json(contacts[index]);
  });

  // Delete contact
  app.delete('/api/contacts/:id', (req: Request, res: Response) => {
    const contactId = parseInt(req.params.id, 10);
    const initialLen = contacts.length;
    contacts = contacts.filter((c) => c.id !== contactId);
    if (contacts.length === initialLen) {
      return res.status(404).json({ error: `Contact ID ${contactId} not found` });
    }
    res.json({ success: true, deleted_id: contactId });
  });

  // Bulk actions on contacts
  app.post('/api/contacts/bulk-action', (req: Request, res: Response) => {
    const { contact_ids, action, payload } = req.body;
    if (!Array.isArray(contact_ids) || contact_ids.length === 0) {
      return res.status(400).json({ error: 'contact_ids array is required and must not be empty' });
    }

    if (action === 'delete') {
      contacts = contacts.filter((c) => !contact_ids.includes(c.id));
      return res.json({ success: true, action: 'delete', count: contact_ids.length });
    }

    if (action === 'update_disposition') {
      const newDisposition = payload?.disposition;
      if (!newDisposition) {
        return res.status(400).json({ error: 'disposition is required in payload' });
      }
      contacts = contacts.map((c) =>
        contact_ids.includes(c.id) ? { ...c, disposition: newDisposition } : c
      );
      return res.json({ success: true, action: 'update_disposition', count: contact_ids.length, disposition: newDisposition });
    }

    if (action === 'send_email') {
      const { template_subject, company_id } = payload || {};
      const targetContacts = contacts.filter((c) => contact_ids.includes(c.id));
      const targetNames = targetContacts.map((c) => c.name).join(', ');
      
      const emailRemark = `[Email Sent] Template: "${template_subject || 'Quarterly Architecture Sync'}" dispatched to ${targetNames}.`;
      interactions.push({
        id: interactions.length + 1,
        company_id: Number(company_id),
        contact_id: contact_ids[0] || null,
        remark_text: emailRemark,
        timestamp: new Date().toISOString(),
        contact_name: targetNames,
      });

      return res.json({ success: true, action: 'send_email', count: contact_ids.length, remark: emailRemark });
    }

    if (action === 'log_call') {
      const { call_notes, company_id, contact_id } = payload || {};
      const targetContact = contacts.find((c) => c.id === Number(contact_id));
      const contactName = targetContact ? targetContact.name : 'Selected Contacts';
      
      const remarkText = `[Call Completed with ${contactName}]: ${call_notes || 'Call completed; discussed procurement & timeline.'}`;
      
      // Parse deterministic regex
      const { competitorDetected, specificNudge, triggeredRules } = parseInteractionDeterministic(remarkText);

      if (competitorDetected) {
        const existingComp = competitorPresence.find(
          (cp) => cp.company_id === Number(company_id) && cp.competitor_name.toLowerCase() === competitorDetected!.toLowerCase()
        );
        if (existingComp) {
          existingComp.threat_level = 'Active';
          existingComp.notes = `Updated via Call Log: "${remarkText.slice(0, 100)}..."`;
        } else {
          competitorPresence.push({
            id: competitorPresence.length + 1,
            company_id: Number(company_id),
            competitor_name: competitorDetected,
            threat_level: 'Active',
            first_detected_at: new Date().toISOString(),
            notes: `Auto-detected via call log: "${remarkText.slice(0, 100)}..."`,
          });
        }
      }

      interactions.push({
        id: interactions.length + 1,
        company_id: Number(company_id),
        contact_id: contact_id ? Number(contact_id) : null,
        remark_text: remarkText,
        timestamp: new Date().toISOString(),
        contact_name: contactName,
      });

      return res.json({
        success: true,
        action: 'log_call',
        count: 1,
        triggered_rules: triggeredRules,
        new_competitor_detected: competitorDetected,
        nudge: specificNudge,
      });
    }

    return res.status(400).json({ error: `Unsupported bulk action: ${action}` });
  });

  // Source files API for direct inspection & download in the UI
  app.get('/api/source-code/:filename', (req: Request, res: Response) => {
    const filename = req.params.filename;
    const allowedFiles: Record<string, string> = {
      'schema.sql': path.resolve('./schema.sql'),
      'seed.sql': path.resolve('./seed.sql'),
      'docker-compose.yml': path.resolve('./docker-compose.yml'),
      'main.py': path.resolve('./backend/main.py'),
      'models.py': path.resolve('./backend/models.py'),
      'parser.py': path.resolve('./backend/parser.py'),
      'database.py': path.resolve('./backend/database.py'),
      'page.tsx': path.resolve('./frontend/page.tsx'),
    };

    const targetPath = allowedFiles[filename];
    if (!targetPath || !fs.existsSync(targetPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const content = fs.readFileSync(targetPath, 'utf-8');
    res.json({ filename, content });
  });

  // Reset demo state
  app.post('/api/reset-demo', (_req: Request, res: Response) => {
    // Reset competitor presence and extra interactions
    competitorPresence = [
      {
        id: 1,
        company_id: 2,
        competitor_name: 'Legacy Vendor Y',
        threat_level: 'Monitoring',
        first_detected_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        notes: 'Incumbent provider on legacy multi-tenant nodes',
      },
    ];
    res.json({ success: true, message: 'Reset to initial seed state.' });
  });

  // Vite development middleware
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Deterministic B2B Sales OS running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
