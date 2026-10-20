import re
from typing import Dict, Any, List

HARDCODED_COMPETITORS: List[str] = [
    "Competitor X",
    "Salesforce",
    "HubSpot",
    "Zoho",
    "Dynamics 365",
    "Oracle CX",
    "SAP Sales Cloud",
    "Legacy Vendor Y",
    "Outreach",
    "Gong",
    "Clari",
]

URGENCY_PATTERNS: Dict[str, re.Pattern] = {
    "asap": re.compile(r"\b(asap|immediately|urgent|emergency|at once|critical blocker)\b", re.IGNORECASE),
    "cancel": re.compile(r"\b(cancel|canceling|churn|terminate|terminating|drop contract|cut spend)\b", re.IGNORECASE),
    "budget_locked": re.compile(r"\b(budget\s+(?:locked|frozen|cut|halted)|freeze\s+on\s+spend|spending\s+freeze)\b", re.IGNORECASE),
}

# Negation lookbehind / context pattern:
# We ignore issue keywords like "latency", "bug", "downtime", "churn risk" if preceded by "fixed", "resolved", "solved", "no", "not"
RESOLVED_NEGATION_PATTERN = re.compile(
    r"\b(?:fixed|resolved|solved|no|not|addressed|eliminated|prevented)\s+([a-zA-Z0-9_\s]{0,20}?)\b(latency|slowdown|bugs?|downtime|outage|churn|escalation)\b",
    re.IGNORECASE,
)

ISSUE_KEYWORDS: List[str] = ["latency", "slowdown", "bug", "downtime", "outage", "churn", "escalation"]


def parse_interaction_text(text: str) -> Dict[str, Any]:
    """
    Deterministic regex parsing engine for sales remarks and notes.
    Extracts competitors, urgency markers, and handles negation filtering.
    ZERO generative LLM hallucinations.
    """
    if not text:
        return {
            "competitors_detected": [],
            "urgency_detected": [],
            "issues_detected": [],
            "resolved_issues_ignored": [],
            "suggested_actions": [],
        }

    detected_competitors: List[str] = []
    for comp in HARDCODED_COMPETITORS:
        pattern = re.compile(rf"\b{re.escape(comp)}\b", re.IGNORECASE)
        if pattern.search(text):
            detected_competitors.append(comp)

    detected_urgency: List[str] = []
    for urgency_type, pattern in URGENCY_PATTERNS.items():
        if pattern.search(text):
            detected_urgency.append(urgency_type)

    # Check for resolved issue statements to negate false positives
    resolved_negation_matches = RESOLVED_NEGATION_PATTERN.findall(text)
    resolved_terms = [match[1].lower() for match in resolved_negation_matches]

    detected_issues: List[str] = []
    ignored_resolved: List[str] = []

    for issue in ISSUE_KEYWORDS:
        issue_regex = re.compile(rf"\b{re.escape(issue)}s?\b", re.IGNORECASE)
        if issue_regex.search(text):
            if issue.lower() in resolved_terms or any(issue.lower() in r for r in resolved_terms):
                ignored_resolved.append(issue)
            else:
                detected_issues.append(issue)

    # Deterministic Suggested Actions
    suggested_actions: List[Dict[str, str]] = []
    if detected_competitors:
        suggested_actions.append({
            "action": "Deploy Competitive Displacement Bridge",
            "urgency": "High",
            "reason": f"Active competitor mentions identified: {', '.join(detected_competitors)}",
        })

    if "cancel" in detected_urgency:
        suggested_actions.append({
            "action": "Trigger Emergency VP Retention Call",
            "urgency": "Critical",
            "reason": "Cancellation or churn signal detected in text remarks.",
        })

    if "asap" in detected_urgency:
        suggested_actions.append({
            "action": "Accelerate Pre-Sales Architecture Review",
            "urgency": "High",
            "reason": "Immediate execution urgency flagged in notes.",
        })

    if "budget_locked" in detected_urgency:
        suggested_actions.append({
            "action": "Offer Zero-Capex Pilot Bridge",
            "urgency": "High",
            "reason": "Budget locked signal detected; switch to deferred commercial terms.",
        })

    return {
        "text_length": len(text),
        "competitors_detected": detected_competitors,
        "urgency_detected": detected_urgency,
        "issues_detected": detected_issues,
        "resolved_issues_ignored": ignored_resolved,
        "suggested_actions": suggested_actions,
    }
