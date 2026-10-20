"""
Deterministic B2B Sales Operating System - SQLAlchemy & Pydantic Models
"""

from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    Text,
    DateTime,
    Date,
    Boolean,
    ForeignKey,
    func,
)
from sqlalchemy.orm import relationship
from .database import Base


# ============================================================================
# SQLAlchemy ORM Models
# ============================================================================

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    website = Column(String(255), nullable=True)
    tier = Column(String(50), nullable=False, default="Tier 2")
    industry = Column(String(150), nullable=True)
    corporate_office = Column(String(150), nullable=True)
    telecom_spend = Column(String(100), nullable=True)
    health_status = Column(String(50), nullable=False, default="CRITICAL")
    health_score = Column(Integer, nullable=False, default=70)
    last_meeting_date = Column(Date, nullable=True)
    next_meeting_date = Column(Date, nullable=True)
    open_pipeline = Column(Numeric(14, 2), nullable=False, default=0.00)
    oldest_opp_days = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    contacts = relationship("Contact", back_populates="company", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="company", cascade="all, delete-orphan")
    competitors = relationship("CompetitorPresence", back_populates="company", cascade="all, delete-orphan")
    interactions = relationship("Interaction", back_populates="company", cascade="all, delete-orphan")


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    is_key_contact = Column(Boolean, nullable=False, default=False, index=True)
    designation = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    contact_number = Column(String(50), nullable=True)
    mobile_number = Column(String(50), nullable=True)
    email_id = Column(String(255), nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    remarks = Column(Text, nullable=True)
    last_meeting_date = Column(Date, nullable=True)
    next_meeting_date = Column(Date, nullable=True)
    appointment_given = Column(String(50), default="No")
    appointment_date = Column(Date, nullable=True)
    meeting_status = Column(String(100), default="Follow-up Needed")
    product = Column(String(255), nullable=True)
    opp_snapshot = Column(String(255), nullable=True)
    role_type = Column(String(100), default="Champion")
    disposition = Column(String(100), default="Cautious / Evaluating")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company", back_populates="contacts")
    interactions = relationship("Interaction", back_populates="contact")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    product_name = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False)  # 'Active' or 'White-Space'
    contract_value = Column(Numeric(12, 2), default=0.00)
    renewal_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company", back_populates="products")


class CompetitorPresence(Base):
    __tablename__ = "competitor_presence"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    competitor_name = Column(String(255), nullable=False)
    threat_level = Column(String(50), nullable=False, default="Active")  # 'Active', 'Monitoring', 'Displaced'
    first_detected_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)

    company = relationship("Company", back_populates="competitors")


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    contact_name = Column(String(255), nullable=True)
    remark_text = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    company = relationship("Company", back_populates="interactions")
    contact = relationship("Contact", back_populates="interactions")


# ============================================================================
# Pydantic Schemas
# ============================================================================

class ContactOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    company_id: int
    is_key_contact: bool
    designation: str
    name: str
    contact_number: Optional[str] = None
    mobile_number: Optional[str] = None
    email_id: Optional[str] = None
    linkedin_url: Optional[str] = None
    remarks: Optional[str] = None
    last_meeting_date: Optional[date] = None
    next_meeting_date: Optional[date] = None
    appointment_given: Optional[str] = "No"
    appointment_date: Optional[date] = None
    meeting_status: Optional[str] = "Follow-up Needed"
    product: Optional[str] = None
    opp_snapshot: Optional[str] = None
    role_type: Optional[str] = "Champion"
    disposition: Optional[str] = "Cautious / Evaluating"


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    company_id: int
    product_name: str
    status: str
    contract_value: float
    renewal_date: Optional[date] = None


class CompetitorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    company_id: int
    competitor_name: str
    threat_level: str
    first_detected_at: Optional[datetime] = None
    notes: Optional[str] = None


class InteractionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    company_id: int
    contact_id: Optional[int] = None
    contact_name: Optional[str] = "General Account"
    remark_text: str
    timestamp: datetime


class SuggestedMove(BaseModel):
    action: str
    urgency: str
    reason: str
    category: str


class CompanySummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    website: Optional[str] = None
    tier: str
    industry: Optional[str] = None
    corporate_office: Optional[str] = None
    telecom_spend: Optional[str] = None
    health_status: str
    health_score: int
    last_meeting_date: Optional[date] = None
    next_meeting_date: Optional[date] = None
    open_pipeline: float
    oldest_opp_days: int


class CompanyHubResponse(BaseModel):
    company: CompanySummary
    key_contacts: List[ContactOut]
    other_contacts: List[ContactOut]
    products: List[ProductOut]
    competitor_presence: List[CompetitorOut]
    interactions: List[InteractionOut]
    suggested_moves: List[SuggestedMove]


class InteractionCreate(BaseModel):
    company_id: int
    contact_id: Optional[int] = None
    contact_name: Optional[str] = "General Account"
    remark_text: str


class InteractionResponse(BaseModel):
    success: bool
    interaction: InteractionOut
    triggered_rules: List[str]
    suggested_moves: List[SuggestedMove]
    nudges: List[SuggestedMove]
