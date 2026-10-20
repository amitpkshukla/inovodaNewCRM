"""
Deterministic B2B Sales Operating System - Regex Engine & Rule Matrix
ZERO LLMs, ZERO AI, ZERO Generative Hallucinations.
All intelligence is strictly deterministic via regex patterns and rule matrices.
"""

import re
from typing import List, Tuple, Dict, Any, Optional

# ============================================================================
# DETERMINISTIC REGEX PATTERNS
# ============================================================================

# Competitor detection regex: detects explicit "Competitor X", or general competitor phrases
RE_COMPETITOR_X = re.compile(r"\b(Competitor\s*X)\b", re.IGNORECASE)
RE_GENERIC_COMPETITOR = re.compile(
    r"\b(?:competitor|evaluating|vendor|contract with)\s+([A-Z][A-Za-z0-9_-]+(?:\s+[A-Z][A-Za-z0-9_-]+)?)\b",
    re.IGNORECASE,
)

# Budget locked pattern: matches "budget locked", "budget freeze", "capex frozen", etc.
RE_BUDGET_LOCKED = re.compile(
    r"\b(budget\s+(?:locked|frozen|cut|halted)|freeze\s+on\s+spend|spending\s+freeze)\b",
    re.IGNORECASE,
)

# Champion / blocker sentiment indicators
RE_CHAMPION_SIGNAL = re.compile(
    r"\b(champion|loves\s+the\s+tool|advocating|pushing\s+internally|greenlight)\b",
    re.IGNORECASE,
)
RE_BLOCKER_SIGNAL = re.compile(
    r"\b(blocker|pushback|resisting|prefers\s+legacy|reluctant)\b",
    re.IGNORECASE,
)

# White-space interest detection
RE_WHITESPACE_INTEREST = re.compile(
    r"\b(?:interested\s+in|asked\s+about|need|looking\s+for)\s+([A-Za-z0-9\s-]+)\b",
    re.IGNORECASE,
)


def parse_interaction_deterministic(
    remark_text: str,
) -> Tuple[Optional[str], Optional[Dict[str, Any]], List[str]]:
    """
    Deterministically parses sales notes using regex rules:
    - Returns (competitor_to_insert, specific_nudge, list_of_triggered_rule_keys)
    """
    triggered_rules: List[str] = []
    competitor_detected: Optional[str] = None
    specific_nudge: Optional[Dict[str, Any]] = None

    # Rule 1: Check for Competitor X
    if RE_COMPETITOR_X.search(remark_text):
        competitor_detected = "Competitor X"
        triggered_rules.append("COMPETITOR_X_REGEX_MATCH")
    else:
        generic_match = RE_GENERIC_COMPETITOR.search(remark_text)
        if generic_match:
            detected_name = generic_match.group(1).strip()
            # Avoid false positives with common words
            if detected_name.lower() not in {"our", "the", "a", "this", "q1", "q2", "q3", "q4"}:
                competitor_detected = detected_name
                triggered_rules.append("GENERIC_COMPETITOR_REGEX_MATCH")

    # Rule 2: Check for Budget Locked
    if RE_BUDGET_LOCKED.search(remark_text):
        triggered_rules.append("BUDGET_LOCKED_REGEX_MATCH")
        specific_nudge = {
            "action": "Freeze Pricing Proposal; Offer Deferral & Pilot Bridge",
            "urgency": "High",
            "reason": "Deterministic regex detected 'budget locked' condition. Shift from upfront ACV to zero-capex pilot.",
            "category": "budget_risk",
        }

    return competitor_detected, specific_nudge, triggered_rules


def calculate_suggested_moves(
    company: Any,
    contacts: List[Any],
    products: List[Any],
    competitors: List[Any],
    extra_nudges: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """
    Deterministic hardcoded rule engine to compute Suggested Moves.
    Evaluates account state without probabilistic variance.
    """
    moves: List[Dict[str, Any]] = []

    # Priority 1: Inject any immediate event nudges from parsing
    if extra_nudges:
        for n in extra_nudges:
            if n not in moves:
                moves.append(n)

    # Priority 2: Competitor Presence rules
    active_competitors = [
        c for c in competitors if getattr(c, "threat_level", "Active") == "Active"
    ]
    if active_competitors:
        comp_names = ", ".join(c.competitor_name for c in active_competitors)
        moves.append({
            "action": "Pitch Bridge",
            "urgency": "High",
            "reason": f"Active competitor presence detected ({comp_names}). Deploy defensive migration battlecard & competitive audit.",
            "category": "competitive",
        })

    # Priority 3: Account Health Score degradation rule
    health = getattr(company, "health_score", 100)
    if health < 70:
        moves.append({
            "action": "Executive Sponsor Check-in",
            "urgency": "High",
            "reason": f"Health score {health}/100 is below 70 threshold. Trigger VP-to-VP sync to avert churn risk.",
            "category": "relationship",
        })

    # Priority 4: Key Stakeholder / Disposition rules
    blockers = [c for c in contacts if "blocker" in getattr(c, "role_type", "").lower() or "negative" in getattr(c, "disposition", "").lower()]
    champions = [c for c in contacts if "champion" in getattr(c, "role_type", "").lower() or "champion" in getattr(c, "disposition", "").lower()]

    if blockers and champions:
        champion_names = ", ".join(c.name for c in champions)
        blocker_names = ", ".join(c.name for c in blockers)
        moves.append({
            "action": f"Multi-Thread Through Champion ({champion_names})",
            "urgency": "High",
            "reason": f"Resistance detected from {blocker_names}. Arm champion with technical ROI deck to neutralize objections.",
            "category": "relationship",
        })
    elif blockers and not champions:
        moves.append({
            "action": "Identify Internal Champion",
            "urgency": "High",
            "reason": "Single-threaded with resistant stakeholder. Map engineering team for sympathetic technical champion.",
            "category": "relationship",
        })

    # Priority 5: Product White-Space Expansion rules
    whitespace_products = [
        p for p in products if getattr(p, "status", "") == "White-Space"
    ]
    if whitespace_products:
        target_product = whitespace_products[0].product_name
        moves.append({
            "action": f"Pitch White-Space: {target_product}",
            "urgency": "Medium",
            "reason": f"Account has active primary license but uncontracted white-space in {target_product}.",
            "category": "whitespace_expansion",
        })

    # Priority 6: Tier 1 high pipeline rule
    tier = getattr(company, "tier", "")
    pipeline = float(getattr(company, "open_pipeline", 0) or 0)
    if tier == "Tier 1" and pipeline > 150000 and len(moves) < 4:
        moves.append({
            "action": "Schedule Procurement Pre-Flight",
            "urgency": "Medium",
            "reason": f"Enterprise pipeline ${pipeline:,.0f} requires security redline and MSA pre-approval.",
            "category": "expansion",
        })

    return moves
