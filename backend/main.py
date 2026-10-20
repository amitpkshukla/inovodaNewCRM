"""
Deterministic B2B Sales Operating System - FastAPI Application
Async SQLAlchemy with PostgreSQL, regex perception, and zero LLMs.
"""

from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import (
    Company,
    Contact,
    Product,
    CompetitorPresence,
    Interaction,
    CompanyHubResponse,
    CompanySummary,
    ContactOut,
    ProductOut,
    CompetitorOut,
    InteractionOut,
    InteractionCreate,
    InteractionResponse,
    SuggestedMove,
)
from services.perception import parse_interaction_text
from services.parsers import extract_text_from_document, unpivot_horizontal_remarks

app = FastAPI(
    title="Deterministic B2B Sales OS API",
    description="Deterministic B2B Sales Operating System Core Backend. Async SQLAlchemy + PostgreSQL. Zero LLMs.",
    version="2.0.0",
)

# Enable CORS for localhost:3000 and local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def calculate_deterministic_moves(
    company: Company,
    contacts: List[Contact],
    products: List[Product],
    competitors: List[CompetitorPresence],
    extra_nudges: Optional[List[dict]] = None,
) -> List[SuggestedMove]:
    moves: List[SuggestedMove] = []

    if extra_nudges:
        for n in extra_nudges:
            moves.append(
                SuggestedMove(
                    action=n.get("action", "Action Required"),
                    urgency=n.get("urgency", "High"),
                    reason=n.get("reason", "Detected via text parsing"),
                    category="risk" if n.get("urgency") in ["High", "Critical"] else "opportunity",
                )
            )

    # Active competitors
    active_comps = [c for c in competitors if c.threat_level == "Active"]
    if active_comps:
        comp_names = ", ".join(c.competitor_name for c in active_comps)
        moves.append(
            SuggestedMove(
                action="Deploy Competitive Displacement Bridge",
                urgency="High",
                reason=f"Active competitor presence detected ({comp_names}). Deploy defensive migration battlecard.",
                category="risk",
            )
        )

    # Blocker vs Champion multi-threading rule
    blockers = [c for c in contacts if (c.role_type and "blocker" in c.role_type.lower()) or (c.disposition and "negative" in c.disposition.lower())]
    champions = [c for c in contacts if (c.role_type and "champion" in c.role_type.lower()) or (c.disposition and "champion" in c.disposition.lower())]
    if blockers and champions:
        moves.append(
            SuggestedMove(
                action=f"Multi-Thread Through Champion ({champions[0].name})",
                urgency="High",
                reason=f"Objections logged by {blockers[0].name}. Arm {champions[0].name} with technical ROI deck.",
                category="risk",
            )
        )

    # White-space expansion rule
    whitespace_prods = [p for p in products if p.status == "White-Space"]
    if whitespace_prods:
        moves.append(
            SuggestedMove(
                action=f"Pitch White-Space: {whitespace_prods[0].product_name}",
                urgency="Medium",
                reason=f"Account has qualified whitespace opportunity in {whitespace_prods[0].product_name}.",
                category="opportunity",
            )
        )

    return moves


@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "system": "Deterministic B2B Sales OS",
        "intelligence": "Strict Regex & Deterministic Rule Matrix (No LLMs)",
        "database": "PostgreSQL Async SQLAlchemy",
    }


@app.get(
    "/api/companies/search",
    response_model=List[CompanySummary],
    tags=["Companies"],
    summary="Search companies using Postgres ILIKE query",
)
async def search_companies(
    q: str = Query(..., min_length=1, description="Company search term"),
    db: AsyncSession = Depends(get_db),
):
    search_pattern = f"%{q.strip()}%"
    stmt = (
        select(Company)
        .where(Company.name.ilike(search_pattern))
        .order_by(Company.tier.asc(), Company.name.asc())
        .limit(20)
    )
    result = await db.execute(stmt)
    companies = result.scalars().all()
    return [CompanySummary.model_validate(c) for c in companies]


@app.get(
    "/api/companies/{company_id}/hub",
    response_model=CompanyHubResponse,
    tags=["Account 360"],
    summary="Unified Account 360 data hub loaded from PostgreSQL",
)
async def get_company_hub(
    company_id: int,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Company)
        .where(Company.id == company_id)
        .options(
            selectinload(Company.contacts),
            selectinload(Company.products),
            selectinload(Company.competitors),
            selectinload(Company.interactions),
        )
    )
    result = await db.execute(stmt)
    company = result.scalar_one_or_none()

    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company ID {company_id} not found in PostgreSQL database.",
        )

    # Separate into Key Contacts vs Other Contacts
    key_contacts = [c for c in company.contacts if c.is_key_contact]
    other_contacts = [c for c in company.contacts if not c.is_key_contact]

    # Deterministic Suggested Moves calculation
    suggested_moves = calculate_deterministic_moves(
        company=company,
        contacts=company.contacts,
        products=company.products,
        competitors=company.competitors,
    )

    # Sort interactions descending
    sorted_interactions = sorted(
        company.interactions, key=lambda i: i.timestamp, reverse=True
    )

    return CompanyHubResponse(
        company=CompanySummary.model_validate(company),
        key_contacts=[ContactOut.model_validate(c) for c in key_contacts],
        other_contacts=[ContactOut.model_validate(c) for c in other_contacts],
        products=[ProductOut.model_validate(p) for p in company.products],
        competitor_presence=[CompetitorOut.model_validate(cp) for cp in company.competitors],
        interactions=[InteractionOut.model_validate(i) for i in sorted_interactions],
        suggested_moves=suggested_moves,
    )


@app.post(
    "/api/interactions",
    response_model=InteractionResponse,
    tags=["Interactions"],
    summary="Log sales interaction with perception regex parsing and PostgreSQL persistence",
)
async def create_interaction(
    payload: InteractionCreate,
    db: AsyncSession = Depends(get_db),
):
    # 1. Fetch Company
    stmt = (
        select(Company)
        .where(Company.id == payload.company_id)
        .options(
            selectinload(Company.contacts),
            selectinload(Company.products),
            selectinload(Company.competitors),
        )
    )
    result = await db.execute(stmt)
    company = result.scalar_one_or_none()

    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company ID {payload.company_id} does not exist.",
        )

    # 2. Run Deterministic Perception Regex Engine
    perception_result = parse_interaction_text(payload.remark_text)
    triggered_rules: List[str] = []

    # If competitor detected in perception, insert or upgrade competitor_presence in PostgreSQL
    new_competitor_name: Optional[str] = None
    if perception_result["competitors_detected"]:
        for comp_name in perception_result["competitors_detected"]:
            triggered_rules.append(f"REGEX_COMPETITOR_{comp_name.upper()}")
            comp_stmt = select(CompetitorPresence).where(
                CompetitorPresence.company_id == payload.company_id,
                CompetitorPresence.competitor_name.ilike(comp_name),
            )
            existing_comp_res = await db.execute(comp_stmt)
            existing_comp = existing_comp_res.scalar_one_or_none()

            if existing_comp:
                existing_comp.threat_level = "Active"
                existing_comp.notes = f"Flagged in remark: '{payload.remark_text[:120]}...'"
            else:
                new_comp = CompetitorPresence(
                    company_id=payload.company_id,
                    competitor_name=comp_name,
                    threat_level="Active",
                    notes=f"Auto-detected via regex in remark: '{payload.remark_text[:120]}...'",
                )
                db.add(new_comp)
                company.competitors.append(new_comp)
                new_competitor_name = comp_name

    if "budget_locked" in perception_result["urgency_detected"]:
        triggered_rules.append("REGEX_BUDGET_LOCKED")

    # 3. Persist Interaction to PostgreSQL
    contact_name = payload.contact_name or "General Account"
    if payload.contact_id and not payload.contact_name:
        for c in company.contacts:
            if c.id == payload.contact_id:
                contact_name = c.name
                break

    new_interaction = Interaction(
        company_id=payload.company_id,
        contact_id=payload.contact_id,
        contact_name=contact_name,
        remark_text=payload.remark_text,
    )
    db.add(new_interaction)
    await db.commit()
    await db.refresh(new_interaction)

    # 4. Re-calculate Suggested Moves
    extra_nudges = perception_result.get("suggested_actions", [])
    updated_moves = calculate_deterministic_moves(
        company=company,
        contacts=company.contacts,
        products=company.products,
        competitors=company.competitors,
        extra_nudges=extra_nudges,
    )

    nudges_out = [
        SuggestedMove(
            action=n.get("action", ""),
            urgency=n.get("urgency", "High"),
            reason=n.get("reason", ""),
            category="risk",
        )
        for n in extra_nudges
    ]

    return InteractionResponse(
        success=True,
        interaction=InteractionOut.model_validate(new_interaction),
        triggered_rules=triggered_rules,
        suggested_moves=updated_moves,
        nudges=nudges_out,
    )


@app.post("/api/upload/excel", tags=["Ingest"])
async def upload_excel(
    file: UploadFile = File(...),
    id_vars: Optional[str] = Form(None),
    remark_columns: Optional[str] = Form(None),
):
    if not file.filename.lower().endswith((".xlsx", ".xls", ".csv")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an Excel workbook (.xlsx, .xls) or CSV.",
        )

    content = await file.read()
    id_columns_list = [c.strip() for c in id_vars.split(",")] if id_vars else None
    remark_columns_list = [c.strip() for c in remark_columns.split(",")] if remark_columns else None

    try:
        preview_rows = unpivot_horizontal_remarks(
            excel_source=content,
            id_vars=id_columns_list,
            remark_columns=remark_columns_list,
        )
        return {
            "filename": file.filename,
            "status": "unpivoted_success",
            "total_unpivoted_rows": len(preview_rows),
            "preview": preview_rows[:50],
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to unpivot Excel workbook: {str(e)}",
        )


@app.post("/api/upload/knowledge", tags=["Ingest"])
async def upload_knowledge(file: UploadFile = File(...)):
    content = await file.read()
    try:
        extracted_text = extract_text_from_document(content, file.filename)
        return {
            "filename": file.filename,
            "text_length": len(extracted_text),
            "sample_snippet": extracted_text[:800],
            "full_text": extracted_text,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to extract document text: {str(e)}",
        )
