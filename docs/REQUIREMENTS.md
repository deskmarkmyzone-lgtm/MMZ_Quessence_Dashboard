# MMZ Dashboard — Complete Project Brain

> **This document is the single source of truth for the entire MMZ Dashboard project.**
> Every requirement, design decision, data model, screen, and technical detail lives here.
> Updated: 2026-03-02
>
> **For project status, completion tracking, and developer handoff guide, see [PROJECT_STATUS.md](./PROJECT_STATUS.md).**

---

## Table of Contents

1. [Business Model](#1-business-model)
2. [Money & Rent Flow](#2-money--rent-flow)
3. [Users & Roles](#3-users--roles)
4. [Flat Numbering System](#4-flat-numbering-system)
5. [Tenant Details](#5-tenant-details)
6. [Documents the System Must Generate](#6-documents-the-system-must-generate)
7. [Complete Feature List](#7-complete-feature-list)
8. [Tech Stack](#8-tech-stack)
9. [Data Migration](#9-data-migration)
10. [Old Dashboard Features to Carry Over](#10-old-dashboard-features-to-carry-over)
11. [WhatsApp Integration Plan](#11-whatsapp-integration-plan)
12. [Phased Build Approach](#12-phased-build-approach)
13. [Verification Plan](#13-verification-plan)
14. [Critical Files](#14-critical-files)
15. [Finding Old Supabase Credentials](#15-finding-old-supabase-credentials)
16. [Design Style & UX Requirements](#16-design-style--ux-requirements)
17. [User Journeys & Flows](#17-user-journeys--flows)
18. [Hiring Guidance](#18-hiring-guidance)
19. [Brand Guidelines](#19-brand-guidelines)
20. [Database Schema](#20-database-schema)
21. [Screen Inventory](#21-screen-inventory)
22. [Project Structure](#22-project-structure)
23. [Component Architecture](#23-component-architecture)
24. [API Routes & Data Flow](#24-api-routes--data-flow)
25. [Environment Variables](#25-environment-variables)
26. [Security & Row Level Security](#26-security--row-level-security)
27. [State Management & Data Flow](#27-state-management--data-flow)
28. [Calculations & Business Logic](#28-calculations--business-logic)
29. [PDF Template Specifications](#29-pdf-template-specifications)
30. [Keyboard Shortcuts](#30-keyboard-shortcuts)
31. [Error Handling & Edge Cases](#31-error-handling--edge-cases)
32. [Performance & Optimization](#32-performance--optimization)
33. [Future Roadmap](#33-future-roadmap)

---

## Context

**Company**: Mark My Zone (MMZ) — property management firm in Hyderabad, India.
**Current state**: 1 community (Prestige High Fields, 2500 total flats, ~300 under MMZ management, 22 owners). Managing via Excel + WhatsApp + RecordBook app (rekord.in).
**Goal**: Build a PWA dashboard to replace ALL manual tools (Excel, WhatsApp groups, RecordBook), serving both PM team and property owners.
**Current tools being replaced**: Excel spreadsheets (5 types), WhatsApp groups for communication, RecordBook (rekord.in) for record-keeping.
**Old dashboard location**: `/old_dashboard/realestate-frontend-main/` (Next.js 14, Pages Router — all features to be carried over).
**Reference designs**: `/Example_Dashboard_designs/` (5 PNG screenshots — analytics dashboards, sci-fi minimal style).

**Project Status (2026-03-02)**: Phases 1-4 fully built and functional. 57 routes, 0 build errors. Deployed to Vercel at `app.markmyzone.com`. PWA installable on Android and iOS. See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for full details.

---

## 1. Business Model (How MMZ Makes Money)

- **Brokerage fee (ONE-TIME)**: Charged when a NEW tenant is placed. Amount = 8 days to 1 month of the flat's total rent (inclusive of community maintenance). Varies per owner relationship.
- **TDS**: Owner deducts 2% TDS from brokerage before paying MMZ.
- **MMZ receives**: Brokerage minus 2% TDS.
- **Expense reimbursement**: MMZ pays vendors for repairs upfront. Bills the owner at cost (no markup). Owner reimburses.

---

## 2. Money & Rent Flow

```
TENANT ─── Base Rent ──────────────────────> OWNER
TENANT ─── Community Maintenance ──────────> COMMUNITY ASSOCIATION
MMZ ────── Tracks & Verifies (screenshots) ─> Records in Dashboard

When NEW tenant placed:
OWNER ──── Brokerage Fee (minus 2% TDS) ──> MMZ

When repairs done:
MMZ ────── Pays vendor upfront ────────────> V ok let's get going with the next phase ENDOR
OWNER ──── Reimburses at cost ─────────────> MMZ
```

---

## 3. Users & Roles

### Property Manager (PM) Portal
| Role | Permissions |
|------|------------|
| Super Admin | Everything: manage PM users, approve/publish statements, manage all communities, delete anything, view audit log, system settings |
| Admin | Everything except: manage PM users, system settings. Can approve statements. |
| Manager/Associate | Record rent payments, record expenses, add tenants, upload documents. Cannot approve statements, cannot delete records, cannot manage PM users. |

### Owner Portal
- Read-only access to their own flats (across all communities)
- View rent history with payment proofs
- View expenses/repairs
- View published statements & invoices
- Download PDFs/Excels
- **Cannot see**: Tenant phone numbers, PM internal notes, draft/pending documents, other owners' data

### Future: Tenant Portal (not in current scope but data model supports it)

---

## 4. Flat Numbering System

Prestige High Fields: `XYZN` where:
- `X` = Tower number (1-10)
- `YZ` = Floor number (01-99)
- `N` = Flat unit on that floor (1-9)

Example: Flat **3154** = Tower **3**, Floor **15**, Unit **4**

---

## 5. Tenant Details (PM-Only, Hidden from Owners)

### For all tenants:
- Name, phone, email
- Occupation type: Employee / Business owner
- If Employee: Company name, offer letter / employee ID (upload)
- If Business: Business name, business proof (upload)
- Aadhaar card (upload), PAN card (upload)
- Lease/Agreement start date, end date
- Monthly rent (base), maintenance portion, total inclusive rent
- Security deposit amount
- Rent due day of month

### For bachelor tenants (additional):
- Family status: **Bachelor**
- Number of occupants (e.g., 3)
- Gender: Boys / Girls / Mixed (e.g., "2 boys, 1 girl")
- **Each occupant's details**: Name, Aadhaar (upload), employment proof (upload)

### For family tenants (additional):
- Family status: **Family**
- Number of family members
- Spouse Aadhaar (upload, if applicable)

### Privacy rules:
- Owner **cannot see** tenant phone number
- Tenant (future portal) **cannot see** owner details

---

## 6. Documents the System Must Generate

### Document 1: Brokerage Invoice
**When**: One-time, when a new tenant is placed.
**Format** (from your Excel "Rental Invoice Final List"):
```
MARK MY ZONE
RENTAL INVOICE
Invoice No: [auto-generated]                    Date: [date]

To,
[Owner Name]
[Owner Address]

Dear Sir,
Sub: [Community Name] Rental Payment Invoice

Sl No | Flat Owner | Tenant | Tower | Flat No | BHK | Area | Rental Start | Flat Rental | Brokerage | TDS (2%) | Net Amount
1     | [name]     | [name] | 3     | 3245    | 2   | 1283 | 10 Oct 2025  | 45,376      | 12,100    | 605      | 11,495

Grand Total:                                                              | 91,775      | 4,589    | 87,186

BANK DETAILS:
Name: [MMZ Account Holder]
Bank: [Bank Name]
Acc No: [Account Number]
IFSC: [IFSC Code]
Branch: [Branch]
PAN: [PAN Number]

Kindly release the payment at the earliest.
AUTHORISED SIGNATORY
```

### Document 2: Flat Expenses Bill
**When**: Periodic (monthly/quarterly), whenever PM wants to bill owner for repairs.
**Format** (from your Excel "PHF 8 Members FLAT EXPENSIVES"):
```
MARK MY ZONE
[OWNER NAME] - FLAT EXPENSES [Period]          Date: [date]

Sl No | Flat No | BHK | SFT | Deep Cleaning | Paint Touch Up | AC's | Geyser's | Any Other | Remarks
1     | 2095    | 2   | 1283|               | 2,000          |      |          |           | Ceiling seepage
2     | 3301    | 2.5 | 1492|               |                |      | -        | 2,700     | Kitchen sink grouting

TOTAL AMOUNT:                  | 6,500 | 7,000 | 7,100 | 2,700 | 9,100
GRAND TOTAL: 32,400

[MMZ Bank Details]
AUTHORISED SIGNATORY
```

### Document 3: Community Maintenance Tracker
**When**: Quarterly, tracking community association charges per flat.
**Format** (from your Excel "PRAHATHI MADHU MAINTENANCE"):
```
[OWNER NAME] RENTAL FLATS MAINTENANCE          Date: [date]

S.No | Flat No | BHK | SFT | Maintenance | Q2     | Q3     | Previous Pending | Total Amount
1    | 3218    | 2BHK| 1283| 5,159       | 15,478 | 15,478 | 1,254           | 32,210

GRAND TOTAL: 2,83,600
```

### Document 4: Rental Credit Report (Per Flat)
**When**: On demand, shows full rent history for a flat during a tenancy.
**Format** (from your Excel "R KRISHNA KUMAR RENTAL FLATS"):
```
FLAT NO - [number]

AOR Start Date | Rent Received Date | Rent    | Maintenance | Inc Maint Rent | Remarks        | AOR Last Date
10-06-2025     |                    |         |             |                |                | 10-05-2026
               | 12-06-2025         |         |             | 1,12,000       | Security Dep   |
               | 11-06-2025         |         |             | 28,900         | June running   |
               | 01-07-2025         | 49,748  | 6,252       | 56,000         |                |
               | 02-08-2025         | 49,748  | 6,252       | 56,000         |                |
...
```

Also a **summary sheet** per owner:
```
[OWNER NAME] RENTAL FLATS

S.No | Flat No | Occupied | Bachelor/Family | Rent   | Maintenance | Inc Maint Rent | Remarks
1    | 3154    | Yes      | FAMILY          | 49,748 | 6,252       | 56,000         |
2    | 6292    | Yes      | GIRLS BACHELORS | 82,067 | 11,933      | 94,000         |
```

### Document 5: Flat Annexure (Move-In / Move-Out Inventory)
**When**: Created at move-in, verified at move-out. Used for deposit deduction calculation.
**Format** (from your Excel "Copy_of_Flat_No-8253_-_Annexure"):
```
PRESTIGE HIGH FIELDS FLAT - ANNEXURE
Flat Owner: [name]
Flat Number: [number]
Move-Out: [date]

I). Hall & Balcony
S.No | Description of Fixtures and Fittings        | Quantity
1    | Key for Main Door                            | 2
2    | Foyer Unit                                   | 1
...

II). Kitchen
...

III). Master Bedroom & Washroom
...

IV). Bedroom 1 & Washroom
...

V). Bedroom 2 & Common Washroom
...

DEPOSIT CALCULATION:
Security Deposit:          1,30,000
Dec 2025 Rent (deducted):   57,684
Jan 5-day Rent (deducted):  10,833
Pending Works:               11,600
  - Paint Touchups:    4,000
  - Deep Cleaning:     3,000
  - 3 AC Servicing:    1,800
  - Chimney Servicing:   700
  - 3 Geyser Servicing: 2,100

Total Refund Amount:         49,883

TENANT BANK DETAILS (for refund):
Name: [tenant name]
Bank: [bank]
A/C: [account number]
IFSC: [ifsc code]
```

---

## 7. Complete Feature List

### Core Features (All Portals)
- [x] Google social login + Email magic link authentication
- [x] Dark mode / Light mode (logos provided for both)
- [x] PWA (installable, add to homescreen)
- [x] Global search across all data
- [x] Advanced filters on every list/table view
- [x] Excel export from any screen
- [x] PDF export / generation for all document types
- [x] WhatsApp sharing of reports/documents
- [x] File attachments on any record (images, PDFs)
- [x] Image compression before upload (phone photos → <200KB)
- [x] Responsive design (mobile-first for PM field use)
- [x] Audit trail (who did what, when)

### PM Portal Features

**Community Management**
- Add/edit/deactivate communities
- Community details: name, address, city, pincode, total units, type, contact person

**Owner Management**
- Add/edit/deactivate owners
- Owner details: name, phone, email, PAN, address
- Brokerage fee configuration per owner (days of rent / percentage / fixed amount)
- GST applicable flag
- Communication preference (WhatsApp / Email / Both)
- Owner can belong to a "family group" (for grouped invoicing)

**Flat Management**
- Add/edit/deactivate flats linked to community + owner
- Flat details: number, tower, floor, unit, BHK type, carpet area (SFT), expected rent, maintenance amount, inclusive rent
- Flat status: Occupied / Vacant / Under Maintenance
- Management fee override per flat (optional)
- Rent due day per flat
- **Vacant flat maintenance tracking** (borne by owner)

**Tenant Management (PM-Only Data)**
- Add/edit tenants linked to flats
- Full tenant profiling: name, phone, email, Aadhaar, PAN, occupation, employment docs
- Bachelor details: occupant count, gender mix, individual occupant Aadhaar + employment docs
- Family details: member count, spouse Aadhaar
- Lease start/end dates, security deposit
- Rent breakdown: base rent + maintenance + inclusive rent
- Tenant move-out workflow (Tenant Exit Wizard):
  1. Select tenant
  2. Calculate deposit deductions (rent owed, repairs, cleaning)
  3. Generate exit PDF with annexure
  4. Update flat status to Vacant
  5. Archive tenant as "past tenant"
- Past tenant history per flat

**Rent Payment Tracking**
- Record rent payment: select flat, amount, date, payment method (GPay/PhonePe/Bank/Cash/UPI)
- Upload payment proof (screenshot)
- Mark as Full / Partial payment
- Support multiple partial payments per month
- Overdue rent tracking (past due date, no payment recorded)
- Rent status dashboard: Paid / Partial / Unpaid / Vacant per flat per month
- Bulk monthly view (all flats for a month at a glance)

**Expense/Repair Management**
- Record expense: select flat, category (Deep Cleaning/Paint/Electrical/Plumbing/AC/Geyser/Carpentry/Pest Control/Other)
- Description, amount, date, vendor name/phone
- Reported by: Tenant / PM Inspection / Owner
- Paid by: PM (to recover from owner) / Owner / Tenant
- Upload multiple receipt images
- Recovery status: Pending / Included in Statement / Recovered
- Expense history per flat

**Community Maintenance Tracking**
- Record quarterly maintenance charges per flat
- Track: Quarter, Amount, Previous Pending, Total
- View maintenance history per flat and per owner

**Flat Annexure / Inventory**
- Room-by-room fixture/fitting checklist per flat
- Rooms: Hall & Balcony, Kitchen, Master Bedroom, Bedroom 1, Bedroom 2, Common Washroom (configurable per BHK)
- Each item: Description, Quantity, Condition (at move-in and move-out)
- Create at move-in, verify at move-out
- Generate annexure PDF

**Document Generation & Invoicing**
- Brokerage Invoice generation (per owner or grouped by family)
- Flat Expenses Bill generation (per owner, periodic)
- Community Maintenance Tracker generation (per owner, quarterly)
- Rental Credit Report generation (per flat, full tenancy)
- Owner Summary Report (all flats for an owner with status)
- All documents: Preview → Save as Draft → Approve → Publish → PDF/Excel download → WhatsApp share
- Approval workflow: Manager creates draft → Admin/Super Admin approves → Published to owner
- Invoice numbering (auto-incrementing)
- MMZ bank details on all invoices

**Team & Permissions**
- Add/remove PM team members
- Assign roles: Super Admin / Admin / Manager
- Role-based access control (see role table in Section 3)
- Activity attribution (which team member did what)

**Dashboard**
- KPI cards: Total flats, Occupied, Vacant, Rent collected this month, Pending verifications, Overdue rents, Open maintenance issues
- Quick actions: Record Rent, Record Expense, Generate Invoice
- Alerts: Overdue rents, Pending approvals, Expiring leases (within 60 days)
- Recent activity feed
- Filter by community, by owner

**Data Management**
- Import data from Excel (CSV import for bulk data migration)
- Export any view as Excel or PDF
- Search across all registers (global search like RecordBook)
- Advanced filters on all list views

**View Modes (All List Screens)**
- **List View**: Table/row format with sortable columns (default for desktop)
- **Card/Thumbnail View**: Visual cards with key info + status badges (default for mobile, good for flats)
- **Grid View**: Compact grid for quick scanning (useful for monthly rent status across all flats)
- User can toggle between views; preference is remembered per screen

**Version History & Approval Audit**
- Every document/invoice tracks full version history:
  - Who created it and when
  - Who edited it, what changed, and when
  - Who submitted it for approval and when
  - Who approved/rejected it and when (with comments)
  - Who published it and when
- Version history is viewable as a timeline on any document
- Cannot be deleted — immutable audit trail
- Stored in `audit_log` table with entity_type + entity_id + JSONB details

**Data Analytics & Insights (PM Dashboard)**
- **Most recurring repairs**: Bar chart showing top 10 expense categories across all flats (e.g., "Geyser Repair" appears 47 times, "AC Servicing" appears 32 times)
- **Repair cost trends**: Line chart showing total monthly expense amounts over time
- **Rent payment punctuality**:
  - Per-flat scoring: "On time" (paid by due date), "Late" (paid after due date), "Unpaid"
  - Ranking: Best-paying flats vs worst-paying flats
  - Monthly heatmap: Rows = flats, Columns = months, Color = on time (green) / late (yellow) / unpaid (red)
- **Occupancy analytics**: Occupied vs Vacant over time, average vacancy duration, revenue impact of vacancies
- **Owner revenue breakdown**: Per-owner summary of total rent collected, total expenses, net brokerage earned
- **Community comparison** (when multiple communities exist): Side-by-side KPIs
- All analytics are filterable by community, owner, time period

**Multi-Community Support**
- Dashboard is built from day one to support multiple communities
- Community selector/filter at top of PM dashboard
- Each community has its own set of owners, flats, tenants
- Same owner can have flats across multiple communities (linked by email/phone)
- Analytics can be filtered per community or viewed across all
- Adding a new community = just filling a form (no code changes needed)

**Notifications System**
- In-app notification bell (top-right) with unread count badge
- Notification types:
  - Rent overdue (X days past due date, no payment recorded)
  - Lease expiring (60 days, 30 days, 7 days before expiry)
  - Document approved / rejected (by admin)
  - New expense recorded on owner's flat (visible to owner)
  - Statement published (visible to owner)
  - New tenant added to owner's flat
  - Maintenance charges updated
- Email notifications for critical events (configurable per user — on/off per type)
- Notification center: list of all notifications, mark as read, filter by type
- Owner gets notifications ONLY for events on their own flats

**Communication / Notes System**
- Comments/notes on any record (flat, tenant, rent payment, expense, statement)
- PM can add internal notes (visible to PM team only, hidden from owner)
- PM can add owner-visible notes (visible when owner views that record)
- Thread-style: multiple notes per record, timestamped, attributed to author
- @mention team members in notes (triggers notification)
- Owner can reply to notes on their published documents (read-only on other records)

**Rent Increase Tracking**
- Rent revision history per flat: date of revision, old rent, new rent, percentage change, reason
- When PM edits a flat's rent amount, system auto-logs the revision
- "Rent History" tab on flat detail shows timeline of all rent changes
- Analytics: average rent increase % across portfolio, flats due for revision (e.g., 11 months since last increase)
- Alert: "Lease renewal coming up in 30 days — consider rent revision"

**Owner Onboarding Flow**
- PM creates owner profile → system generates a unique onboarding link
- PM shares link with owner (via WhatsApp/email manually for now)
- Owner clicks link → Google sign-in → lands on welcome screen:
  1. "Welcome to Mark My Zone" with MMZ branding
  2. Confirm your name & contact details
  3. Review your properties (list of flats assigned to you)
  4. Accept terms of service
  5. Dashboard unlocked
- Owner sees a guided tour (tooltips) on first login: "This is your dashboard", "Here you see your flats", "Here are your statements"
- PM gets notified when owner completes onboarding

### Owner Portal Features
- View all flats across all communities
- Per-flat view: status, current tenant name (NOT phone), lease period
- Rent history per flat: month, amount, date, status, payment proof images
- Expense history per flat: date, category, description, amount, receipt images
- Community maintenance history per flat
- Published statements/invoices (read-only)
- PDF/Excel download of all published documents
- Profile management
- **Cannot see**: Tenant phone, PM internal notes, draft documents, other owners' data

---

## 8. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | **Next.js 14+ (App Router)** | Best AI coding support, seamless Vercel deploy, SSR for fast mobile loads |
| UI | **shadcn/ui + Tailwind CSS** | No dependency lock-in, beautiful defaults, dark mode built-in |
| Backend/DB | **Supabase (PostgreSQL)** | Free tier for data, built-in Auth + RLS |
| Hosting | **Vercel (free tier)** | Zero-config Next.js deploy, automatic HTTPS |
| Auth | **Supabase Auth (Google OAuth + Email magic link)** | No SMS cost, Google for convenience |
| File Storage | **Supabase Storage** | ~~Google Drive was originally planned but dropped for simplicity.~~ Supabase Storage integrates natively with RLS. 1GB free tier. |
| PDF | **@react-pdf/renderer** | Client-side PDF generation, no server cost |
| Excel | **SheetJS (xlsx)** | Client-side Excel generation, no server cost |
| Image Compression | **browser-image-compression** | Phone photos 5MB → 200KB before upload |
| PWA | **next-pwa or Serwist** | Installable, offline caching |
| Charts | **Recharts** | Dashboard analytics charts |

### File Storage Strategy: Google Drive
- Create dedicated Google account: `mmz.filestorage@gmail.com` (15GB free)
- Folder structure in Google Drive:
  ```
  MMZ Files/
  ├── Prestige High Fields/
  │   ├── Flat 3154/
  │   │   ├── Rent Proofs/
  │   │   │   ├── 2025-06/
  │   │   │   ├── 2025-07/
  │   │   ├── Expense Receipts/
  │   │   ├── Tenant Docs/
  │   │   │   ├── Aadhaar/
  │   │   │   ├── PAN/
  │   │   │   ├── Employment/
  │   │   ├── Agreements/
  │   │   ├── Annexures/
  │   │   └── Generated PDFs/
  │   ├── Flat 6292/
  │   └── ...
  ├── [Future Community]/
  └── ...
  ```
- Supabase stores the **Google Drive file ID** (not the file itself) in database columns
- Files retrieved via Google Drive API with sharing links
- Uploaded files are auto-compressed before upload

### Owner-to-Flat Mapping (How Owners Access Their Flats)
1. PM team adds owner in system with their **email** (e.g., krishna@gmail.com)
2. PM adds flats linked to that owner record
3. Owner visits dashboard → "Sign in with Google" using krishna@gmail.com
4. System matches Google account email to owner record in `owners` table
5. Owner automatically sees ONLY their linked flats — no manual mapping needed
6. If owner email not found → "No account found, contact your property manager"

### Monthly Cost
| Item | Cost |
|------|------|
| Vercel | Free |
| Supabase | Free (data only, no file storage needed) |
| Google Drive | Free (15GB via dedicated account) |
| Domain | ~Rs.500-800/year |
| **Total** | **Under Rs.200/month initially** |

**Production Infrastructure**:
- **Repository**: GitHub — `deskmarkmyzone-lgtm/MMZ_Quessence_Dashboard`
- **Hosting**: Vercel — auto-deploy on push to `main` branch
- **Domain**: `app.markmyzone.com` — CNAME via Namecheap → `cname.vercel-dns.com`
- **Auth**: Google OAuth (Google Cloud Console) + Supabase Auth

---

## 9. Data Migration

### From Old Supabase
- Read all data from old Supabase project (flats, tenancies, maintenance, rental_documents, profiles)
- Map to new schema (expanded with communities, owners, tenants, etc.)
- Migrate uploaded files from old storage to new storage
- **Required from user**: Old Supabase project URL + service_role key

### From Excel Files
- Current Excel data serves as format reference
- No automated import needed — data is already in old Supabase
- CSV import tool for any additional bulk data entry

---

## 10. Old Dashboard Features to Carry Over

All features from the old dashboard (Next.js 14, Pages Router) will be rebuilt:

- [x] Login (now with Google + Email instead of email/password)
- [x] Dashboard with stats cards, search, filters, property cards
- [x] Advanced filter panel (BHK, rent range, maintenance range, SFT, dates)
- [x] Owner filter sidebar
- [x] Flat CRUD (add, edit, delete with status badges)
- [x] Tenant management (add, edit, delete with full documentation)
- [x] Past tenant tracking with exit history
- [x] Tenant Exit Wizard (3-step: select → deductions → PDF)
- [x] Document management (multi-file upload, view, download)
- [x] Payment proof upload (multiple files per transaction)
- [x] Maintenance/expense tracking with severity and categories
- [x] Dark mode toggle
- [x] Session state persistence (search, filters, scroll position)
- [x] PDF generation (jsPDF → upgraded to @react-pdf/renderer)
- [x] Role-based UI (admin vs owner views)

**New additions not in old dashboard:**
- Google OAuth login
- Multi-community support
- Owner portal (separate authenticated view)
- Brokerage invoice generation with TDS calculation
- Flat expenses bill generation
- Community maintenance tracking
- Rental credit report generation
- Flat annexure/inventory system
- Approval workflow (draft → approve → publish)
- Bachelor tenant detailed profiling (occupant-level Aadhaar/employment)
- Owner family grouping for invoices
- Global search (RecordBook-style)
- WhatsApp sharing
- Excel export from any screen
- Audit trail
- Charts/analytics on dashboard
- PWA (installable)

---

## 11. WhatsApp Integration Plan

**Phase 1 (Now)**: Manual — use WhatsApp Business App (free) for broadcasts
**Phase 2 (When ready)**: Integrate Interakt or AiSensy (~Rs.1,200-1,700/month)
**Action item NOW**: Start Meta Business Verification (2-5 days) — needs GST certificate + website

---

## 12. Phased Build Approach

> **Current Status (2026-03-01)**: Phases 1-3 COMPLETE. Phase 4 partially complete (Predictive Maintenance done).
> For detailed completion tracking, see [PROJECT_STATUS.md](./PROJECT_STATUS.md).

### Phase 1 — PM Core ✅ COMPLETED
Everything the PM team needs to stop using Excel/RecordBook:
- [x] Project setup: Next.js + shadcn/ui + Supabase + Tailwind + PWA
- [x] Auth: Google login + email magic link, role-based routing
- [x] PM Dashboard with KPIs, search, filters
- [x] Communities CRUD
- [x] Owners CRUD with brokerage fee config
- [x] Flats CRUD with tenant info, status management
- [x] Tenant management: add/edit, bachelor/family details, document uploads
- [x] Rent payment recording with proof upload
- [x] Expense recording with receipt uploads
- [x] Community maintenance tracking
- [x] Basic document generation: Brokerage invoice, expenses bill
- [x] Overdue rent tracking
- [x] Dark/light mode
- [x] Row Level Security

### Phase 2 — Owner Portal + Documents ✅ COMPLETED
- [x] Owner authentication + portal
- [x] Owner dashboard: flats, rent status, recent activity
- [x] Owner flat detail view: rent history, expenses, proofs
- [x] Owner statement view (published only)
- [x] All 5 document types: full generation + preview + PDF + Excel
- [x] Approval workflow: draft → pending → published
- [x] Rental credit report per flat
- [x] Flat annexure/inventory system
- [x] Tenant exit wizard (rebuilt from old dashboard)
- [x] Invoice numbering, MMZ bank details, TDS calculation
- [x] WhatsApp share buttons

### Phase 3 — Polish + Scale ✅ COMPLETED
- [x] Data migration from old Supabase
- [x] CSV import tool for bulk data
- [x] Dashboard charts/analytics (6 interactive charts)
- [x] Vacancy tracking with revenue impact
- [x] Lease expiration alerts (60-day warning)
- [x] Security deposit tracking + move-out deposit calc
- [x] Lease document storage
- [x] Owner family grouping for invoices
- [x] Audit log UI
- [x] Owner payment tracking (did they pay our invoice?)
- [x] Global search (RecordBook-style, Cmd+K)
- [x] Advanced filters on all views
- [x] Session persistence (search, filters, scroll)
- [x] Mobile responsiveness polish
- [x] Notes/comments system on any entity
- [x] Bulk rent recording

### Phase 4 — Advanced (PARTIALLY COMPLETED)
- [x] Predictive maintenance (AI-powered, based on repair history patterns)
- [ ] WhatsApp automation — **PARKED** (needs Meta verification + Interakt/AiSensy)
- [ ] Automated rent reminders — **PARKED** (needs WhatsApp API or email service)
- [ ] Email notification sending — **PARKED** (needs email service)
- [ ] GST-compliant invoicing — **PARKED** (needs GST details from MMZ)
- [ ] Tenant portal — **PARKED** (future product surface)
- [ ] Financial reports (yearly tax summaries) — **PARKED**
- [ ] Multi-language (Telugu, Hindi) — **PARKED**
- [ ] Tally/Zoho export — **PARKED**
- [ ] Digital signature integration — **PARKED**

---

## 13. Verification Plan

### Phase 1 Checklist ✅ ALL PASSING
- [x] PM can log in with Google / email
- [x] PM can add community, owner (with fee config), flat (with tenant)
- [x] PM can record rent payment with GPay screenshot upload
- [x] PM can record expense with receipt upload
- [x] PM can track community maintenance charges
- [x] PM can generate brokerage invoice with correct TDS calculation
- [x] PM can generate expenses bill matching Excel format
- [x] Dashboard shows correct KPIs, overdue alerts
- [x] Search and filters work on all list views
- [x] Dark/light mode works with both logos
- [x] Works on mobile browser

### Phase 2 Checklist ✅ ALL PASSING
- [x] Owner can log in and see ONLY their own flats
- [x] Owner can view rent history with payment proof images
- [x] Owner CANNOT see tenant phone numbers
- [x] Owner can ONLY see published documents (not drafts)
- [x] PDF downloads match the Excel format templates exactly
- [x] Excel exports are properly formatted
- [x] Approval workflow: Manager → Admin → Published
- [x] Flat annexure can be created and exported

### End-to-End Test ✅ ALL PASSING
- [x] Create a community (Prestige High Fields)
- [x] Add an owner with 8-day brokerage fee
- [x] Add 3 flats (1 vacant, 2 occupied with tenants)
- [x] Record rent for both occupied flats with screenshot proofs
- [x] Record an expense for one flat
- [x] Generate brokerage invoice → verify TDS math
- [x] Generate expenses bill → verify matches Excel format
- [x] Generate rental credit report → verify per-flat history
- [x] Log in as owner → verify they see correct data, correct restrictions
- [x] Download PDF → verify formatting matches templates

---

## 14. Critical Files

| File | Purpose |
|------|---------|
| `supabase/migrations/001_initial_schema.sql` | Complete PostgreSQL schema — everything depends on this |
| `src/lib/supabase/middleware.ts` | Auth middleware — PM vs Owner routing, security boundary |
| `src/middleware.ts` | Next.js middleware — session refresh on every request |
| `src/lib/utils/calculations.ts` | Brokerage fee + TDS + GST calculations — core business logic |
| `src/lib/dal/` | Data Access Layer — all database query functions (15 files) |
| `src/lib/actions/` | Server Actions — all mutation functions (17 files) |
| `src/lib/pdf/` | PDF templates matching Excel formats (6 templates) |
| `src/types/index.ts` | TypeScript types mirroring the database schema |
| `src/components/layout/pm-sidebar.tsx` | PM navigation — 16 nav items, all routes listed here |
| `docs/PROJECT_STATUS.md` | Project status, parked items, developer handoff guide |
| `docs/REQUIREMENTS.md` | This file — full business requirements and specifications |

---

## 15. Finding Old Supabase Credentials

1. Go to **supabase.com** → Sign in
2. Select your old project from the dashboard
3. Go to **Settings** (gear icon in left sidebar)
4. Click **API** under "Configuration"
5. Copy: **Project URL** (looks like `https://xxxxx.supabase.co`)
6. Under "Project API keys", click **Reveal** on the `service_role` key
7. Share both with me — I'll read the data and map it to the new schema

---

## 16. Design Style & UX Requirements

**Style**: Sci-fi-inspired, analytics-forward, premium minimal. Think: the reference dashboard designs — clean data visualizations, slim icon sidebar, warm neutrals with purple accents, chart-heavy home screens.

**Key principles:**
- **Analytics-first home screen** — PM Dashboard is a data command center with charts, gauges, KPIs, and graphs (NOT a card-list dashboard)
- Premium minimal — clean, spacious, no clutter
- Light mode as default theme (with dark mode option)
- Subtle sci-fi aesthetic: soft accent glows, clean geometric charts, minimal glassmorphism
- **Slim icon-only sidebar** (64px) — always visible on desktop, icon rail with tooltips, theme-aware (light bg in light mode, dark bg in dark mode)
- NOT flashy/gaudy — restrained, professional, trustworthy (this handles people's money)
- Warm neutral base palette (#F8F7F4 page bg) with purple (#6C63FF) as the primary accent

**Dashboard Layout (PM):**
- Desktop: 64px slim sidebar (left) + top header bar with tabs (Overview/Analytics/Reports) + content area with greeting, KPIs row, chart rows
- Tablet: No sidebar — top header bar with logo, title, tabs, search, bell. Content stacks vertically.
- Mobile: Compact header (logo, title, search, bell) + content + bottom navigation (Home/Flats/Rent/Docs/More)

**PM Dashboard Home Screen Content:**
- Greeting row: "Good morning, [Name]" + date/period filter
- KPI row: 4 metric cards (Total Flats, Occupied, Revenue, Overdue) — each with icon, animated number, trend badge, mini progress bar
- Charts Row 1: Rent Collection bar chart (6-month view, collected vs pending bars) + Occupancy Rate gauge (circular, percentage, breakdown)
- Charts Row 2: Expense Breakdown donut chart (with legend) + Recent Payments list (4-5 items with status)

**Sidebar Design (PM Portal — Desktop only):**
- Width: 64px fixed (icon-only, no text labels — tooltips on hover)
- Top: MMZ "M" logo mark (36x36, purple accent bg)
- Middle: 7 navigation icons (Dashboard, Flats, Owners, Rent, Expenses, Documents, Analytics) — 44x44 touch targets, 12px corner radius
- Active state: accent purple tint background + purple icon color
- Inactive state: muted gray icon (#9CA3AF)
- Bottom: Settings icon + User avatar circle
- Border: 1px right border (subtle, theme-aware)
- Theme-aware: White background in light mode, dark background in dark mode

**Micro-interactions & Animations:**
- Skeleton loading → smooth fade to real content (every data load)
- Smooth page transitions (fade/slide between routes)
- Button hover effects (subtle scale + glow)
- Card hover: slight lift with shadow
- Toggle animations (smooth switch between views)
- Number counters that animate up on dashboard KPI cards
- Progress bars that fill smoothly
- Toast notifications slide in/out
- Table row highlight on hover
- Sidebar icon tooltip on hover (no collapse/expand — always icon-only)
- Modal open/close with backdrop blur
- File upload: drag zone pulse, upload progress bar, checkmark on complete
- Status badge color transitions
- Pull-to-refresh on mobile (PWA)
- Chart animations: bars grow up on load, gauge needle sweeps, donut segments animate in

**Loading states:**
- Skeleton screens on every data fetch (not spinners)
- Shimmer effect on skeleton elements
- Placeholder content that matches the layout of real content

**Images:**
- Unsplash placeholder images for now (community photos, flat images)
- Will be replaced with real photos later

**Interactive feel:**
- Dashboard should feel like a "playground" — enjoyable to use, not a chore
- Drag and drop where applicable (reorder items, file uploads)
- Keyboard shortcuts for power users (PM team uses this daily)
- Smooth scrolling, no jank
- Responsive: every screen must work beautifully on mobile AND desktop

---

## 17. User Journeys & Flows (Detailed)

### JOURNEY 1: PM First-Time Setup

```
PM opens app
  → Login screen (MMZ logo, "Sign in with Google" + "Sign in with Email")
  → PM clicks "Sign in with Google"
  → Google OAuth popup → selects account
  → System checks: is this email in pm_users table?
    → YES: Dashboard loads (with role-based menu)
    → NO: "Access denied. Contact your super admin."

FIRST TIME (Super Admin sets up the system):
  → Dashboard is empty, shows onboarding wizard:
    Step 1: "Add your first community" → Community form
    Step 2: "Add your first owner" → Owner form with fee config
    Step 3: "Add flats for this owner" → Flat form (can add multiple)
    Step 4: "Add tenant details" → Tenant form
    Step 5: "You're all set! Start recording rent payments."
  → Wizard can be skipped and done manually later
```

### JOURNEY 2: PM Daily Workflow — Recording Rent

```
PM receives GPay screenshot from tenant via WhatsApp
  → Opens MMZ Dashboard on phone
  → Taps "Record Rent" (quick action on dashboard)
  → Smart search: types "3154" or "Rahul"
    → Autocomplete: "Flat 3154 (T3-F15-U4) — Rahul Kumar — Prestige High Fields"
  → Selects flat
  → Form auto-fills: Expected rent (Rs.56,000), Payment month (Feb 2026), Due date (5th)
  → PM enters:
    - Amount received: 56,000
    - Payment date: 5 Feb 2026
    - Method: GPay
    - Status: Full payment
  → Taps "Upload Proof" → Camera opens (mobile) or file picker (desktop)
  → Takes photo / selects screenshot
  → Image auto-compressed (5MB → 200KB)
  → Preview shown → PM confirms
  → Taps "Save"
  → Success animation (checkmark)
  → Returns to dashboard — KPI "Rent Collected" counter increments
  → Flat status changes from "Pending" to "Paid" (green badge)
```

### JOURNEY 3: PM Records an Expense

```
PM gets a call: "Geyser not working in Flat 8061"
  → PM calls vendor, gets it repaired, pays Rs.3,800
  → Opens dashboard → "Record Expense" (quick action)
  → Selects flat: 8061
  → Category: Geyser (dropdown)
  → Description: "Geyser filament change"
  → Amount: 3,800
  → Date: 28 Feb 2026
  → Reported by: Tenant
  → Paid by: PM (to recover from owner)
  → Vendor: "Ravi Electricals" / 9876543210
  → Uploads receipt photo
  → Saves
  → Expense appears in Flat 8061 history
  → Recovery status: "Pending" (will be included in next owner bill)
```

### JOURNEY 4: PM Generates Brokerage Invoice

```
New tenant placed in Flat 2224 (Owner: Ajitha Krishna Kumar)
  → PM goes to Invoices → Generate Brokerage Invoice
  → Selects: Owner = "Krishna Kumar" family group (or individual)
  → System shows all NEW tenants placed since last invoice:
    - Flat 2224: Ajaypal Singh, started Dec 2025, rent Rs.58,000
    - Flat 3246: Amisha Bansal, started Jan 2026, rent Rs.51,000
  → Auto-calculates per flat:
    - Flat 2224: Brokerage = Rs.58,000 × 8/30 = Rs.15,467 | TDS 2% = Rs.309 | Net = Rs.15,158
    - Flat 3246: Brokerage = Rs.51,000 × 8/30 = Rs.13,600 | TDS 2% = Rs.272 | Net = Rs.13,328
    - Grand Total: Brokerage Rs.29,067 | TDS Rs.581 | Net Rs.28,486
  → PM reviews preview (matches Excel format)
  → Can add/remove line items manually
  → Saves as Draft
  → Submits for approval (if Manager role) OR approves directly (if Admin/Super Admin)
  → Once approved → Published
  → PM downloads PDF → shares via WhatsApp to owner
  → Owner also sees it in their portal
```

### JOURNEY 5: PM Generates Flat Expenses Bill

```
End of quarter — PM needs to bill owners for repair expenses
  → PM goes to Invoices → Generate Expenses Bill
  → Selects: Owner = "R. Venkat Ramana" | Period = Nov 2025 - Jan 2026
  → System pulls all PM-paid expenses for this owner's flats in the period:
    - Flat 2095: Paint Touch Up Rs.2,000
    - Flat 3301: Kitchen sink grouting Rs.2,700
    - Flat 4101: AC Servicing Rs.4,300, Geyser Servicing Rs.2,000
    - ... etc.
  → Auto-formats into the standard table (Flat No | BHK | SFT | Deep Cleaning | Paint | AC's | Geyser's | Other | Remarks)
  → Shows Grand Total: Rs.32,400
  → PM reviews, can adjust
  → Draft → Approve → Publish → PDF → WhatsApp share
```

### JOURNEY 6: PM Handles Tenant Exit

```
Tenant in Flat 8253 gives notice to vacate
  → PM goes to Flat 8253 → Tenant → "Initiate Exit"
  → Tenant Exit Wizard (3 steps):

  STEP 1: Confirm Exit Details
    - Tenant name: P V Srinidhi
    - Move-out date: 5 Jan 2026
    - Reason for exit (optional)

  STEP 2: Deposit Deductions
    - Security deposit: Rs.1,30,000
    - Deductions (PM adds line items):
      - Dec 2025 rent (unpaid): Rs.57,684
      - Jan 5-day rent (partial): Rs.10,833
      - Paint Touchups: Rs.4,000
      - Deep Cleaning: Rs.3,000
      - 3 AC Servicing: Rs.1,800
      - Chimney Servicing: Rs.700
      - 3 Geyser Servicing: Rs.2,100
    - Total deductions: Rs.80,117
    - Refund amount: Rs.49,883
    - Tenant bank details for refund: Name, Bank, Account, IFSC

  STEP 3: Review & Generate
    - Full annexure preview (room-by-room inventory)
    - Deposit calculation summary
    - "Generate Exit PDF" → PDF created with all details
    - "Complete Exit" → Tenant marked as past, flat status → Vacant
    - Exit PDF stored, linked to tenant record
    - Owner notified: "Tenant exited Flat 8253"
```

### JOURNEY 7: Owner Views Their Dashboard

```
Owner: Krishna Kumar
  → Opens app on phone
  → "Sign in with Google" → selects krishna@gmail.com
  → System matches email → loads owner profile
  → FIRST TIME: Welcome screen + guided tour (tooltips)

OWNER DASHBOARD:
  → Greeting: "Hello, Krishna Kumar"
  → Notification bell (1 new: "Statement for Jan 2026 is ready")
  → Property Summary Cards (card/thumbnail view):
    ┌─────────────────────────┐
    │ Flat 3154 | T3-F15-U4   │
    │ Prestige High Fields    │
    │ 2.5 BHK | 1492 sqft     │
    │ ● Occupied | Family      │
    │ Rent: Rs.56,000/month    │
    │ Feb Status: ✅ Paid       │
    └─────────────────────────┘

    ┌─────────────────────────┐
    │ Flat 6292 | T6-F29-U2   │
    │ Prestige High Fields    │
    │ 4 BHK | 2848 sqft        │
    │ ● Occupied | Bachelors   │
    │ Rent: Rs.94,000/month    │
    │ Feb Status: ⏳ Pending    │
    └─────────────────────────┘

    ┌─────────────────────────┐
    │ Flat 2282 | T2-F28-U2   │
    │ Prestige High Fields    │
    │ ○ Vacant                 │
    │ Maintenance: Rs.X/month  │
    └─────────────────────────┘

  → Recent Activity feed:
    - "Rent recorded for Flat 3154 — Rs.56,000 on 5 Feb 2026"
    - "Expense: Geyser repair Rs.2,000 for Flat 3154"
    - "Statement Jan 2026 published"

  → Taps Flat 3154:
    FLAT DETAIL VIEW (tabs):
    [Overview] [Rent History] [Expenses] [Documents]

    Rent History tab:
    Feb 2026 | Rs.56,000 | 5 Feb | ✅ Paid | 📎 View Proof
    Jan 2026 | Rs.56,000 | 1 Jan | ✅ Paid | 📎 View Proof
    Dec 2025 | Rs.56,000 | 6 Dec | ✅ Paid | 📎 View Proof
    ...

    Taps "View Proof" → full-size payment screenshot

  → Taps Statements (bottom nav):
    Published statements list:
    Jan 2026 | Brokerage Invoice | Rs.28,486 due | 📥 PDF
    Nov-Jan 2026 | Expenses Bill | Rs.32,400 due | 📥 PDF

    Taps Jan 2026 → Full statement view → Download PDF
```

### JOURNEY 8: PM Adds New Community (Future Expansion)

```
MMZ signs contract with a new community "Aparna Sarovar"
  → Super Admin → Communities → "Add Community"
  → Fills: Name = "Aparna Sarovar", Address, City = Hyderabad, Pincode, Total units = 1200
  → Saves
  → Now starts adding owners under this community
  → Owners who already exist in the system (from Prestige) can be linked to new flats in Aparna Sarovar
  → Their dashboard automatically shows flats from BOTH communities
  → PM dashboard: Community filter dropdown now shows "All | Prestige High Fields | Aparna Sarovar"
```

### JOURNEY 9: PM Team Member Onboarding

```
MMZ hires a new associate: Priya
  → Super Admin → Settings → Team → "Add Team Member"
  → Name: Priya, Email: priya@mmz.com, Role: Manager
  → Saves → Priya gets an email: "You've been added to MMZ Dashboard"
  → Priya signs in with Google (priya@mmz.com)
  → Sees PM dashboard with Manager-level access:
    - Can record rent, expenses, add tenants, upload docs
    - CANNOT approve statements, delete records, manage team, view audit log
```

---

## 18. Hiring Guidance (When Ready)

**When**: After Phase 1 is validated (week 4-5)
**What**: 1 full-stack developer — Next.js (App Router), TypeScript, Tailwind, Supabase, PostgreSQL
**Budget**: Rs.40,000-80,000/month (full-time) or Rs.500-1,000/hour (freelance)
**Where**: LinkedIn, Upwork, Hyderabad tech meetups
**Green flags**: Has built dashboards, knows Supabase, writes TypeScript
**Red flags**: Wants to change the tech stack, doesn't understand RLS

---

## 19. Brand Guidelines

### Company Identity
- **Full Name**: Mark My Zone
- **Abbreviation**: MMZ
- **Tagline**: MARK MY ZONE (displayed in logo)
- **Industry**: Property Management / Real Estate Services
- **Location**: Hyderabad, India

### Logo
- **Logo files location**: `/company_logo/`
- **Light version** (`MMZ LOGO LIGHT.svg`): White fill — for dark backgrounds
- **Dark version** (`MMZ LOGO DARK.svg`): Dark fill (#141414, 26.67% opacity) — for light backgrounds
- **Logo structure**: Stylized "M" icon (three vertical bars with pointed tops) + "MARK MY" in thin font + "ZONE" in bold block font
- **Viewbox**: 9118 x 6087 — landscape orientation
- **Usage rules**:
  - Always use the appropriate variant for the background
  - Minimum clear space: equal to the height of the "M" icon on all sides
  - Do NOT distort, rotate, or recolor the logo
  - Login screen: Large centered logo
  - Sidebar header: Small horizontal logo
  - PDF/Invoice header: Full logo with company name
  - Favicon: Extract the "M" icon only

### Color Palette

**Dark Theme (Primary)**
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0A0A0F` | Main background |
| `--bg-secondary` | `#12121A` | Cards, sidebar |
| `--bg-tertiary` | `#1A1A2E` | Elevated surfaces, modals |
| `--bg-hover` | `#22223A` | Hover states |
| `--border-primary` | `#2A2A3E` | Card borders, dividers |
| `--border-active` | `#3A3A5E` | Active/focused borders |
| `--text-primary` | `#F0F0F5` | Headings, primary text |
| `--text-secondary` | `#A0A0B5` | Descriptions, labels |
| `--text-muted` | `#6A6A80` | Placeholders, disabled |
| `--accent-primary` | `#6C63FF` | Primary buttons, links, active states |
| `--accent-glow` | `#6C63FF33` | Glow effects (20% opacity) |
| `--accent-gradient` | `linear-gradient(135deg, #6C63FF, #AB63FF)` | Gradient accents |
| `--success` | `#22C55E` | Paid, completed, active |
| `--warning` | `#F59E0B` | Pending, partial, late |
| `--danger` | `#EF4444` | Overdue, error, unpaid |
| `--info` | `#3B82F6` | Informational |

**Light Theme (Primary — Default)**
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-page` | `#F8F7F4` | Main page background (warm neutral) |
| `--bg-card` | `#FFFFFF` | Cards, panels |
| `--bg-sidebar` | `#FFFFFF` | Sidebar background (theme-aware) |
| `--bg-sidebar-hover` | `#F5F3EF` | Sidebar icon hover |
| `--bg-sidebar-active` | `#6C63FF10` | Active nav icon background tint |
| `--bg-elevated` | `#F3F1ED` | Elevated surfaces |
| `--bg-hover` | `#EDEAE5` | Hover states |
| `--border-primary` | `#E5E7EB` | Card borders, dividers |
| `--border-active` | `#D1D5DB` | Active/focused borders |
| `--border-subtle` | `#F0EDE8` | Subtle separators |
| `--text-primary` | `#1A1A2E` | Headings, primary text |
| `--text-secondary` | `#6B7280` | Descriptions, labels |
| `--text-muted` | `#9CA3AF` | Placeholders, disabled |
| `--accent-primary` | `#6C63FF` | Primary buttons, links, active states |
| `--accent-light` | `#8B83FF` | Lighter accent variant |
| `--accent-bg` | `#6C63FF12` | Accent tint background |
| `--accent-warm` | `#F59E0B` | Warm accent (amber) |
| `--accent-green` | `#10B981` | Green accent |

**Sidebar Tokens (Theme-Aware)**
| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--sidebar-bg` | `#FFFFFF` | `#12121A` | Sidebar background |
| `--sidebar-icon` | `#9CA3AF` | `#6A6A80` | Inactive icon color |
| `--sidebar-icon-active` | `#6C63FF` | `#6C63FF` | Active icon color |
| `--sidebar-border` | `#E5E7EB` | `#2A2A3E` | Right border |
| `--sidebar-hover` | `#F5F3EF` | `#22223A` | Hover state |
| `--sidebar-active-bg` | `#6C63FF10` | `#6C63FF20` | Active item tint |

**Chart/Analytics Color Tokens**
| Token | Hex | Usage |
|-------|-----|-------|
| `--chart-green` | `#22C55E` | Positive values, collected rent, success metrics |
| `--chart-amber` | `#F59E0B` | Pending values, warnings, partial |
| `--chart-blue` | `#3B82F6` | Informational, secondary data series |
| `--chart-purple` | `#6C63FF` | Primary accent in charts, active segments |
| `--chart-red` | `#EF4444` | Negative values, overdue, danger metrics |
| `--chart-teal` | `#14B8A6` | Tertiary data series, alternative positive |

### Typography
| Element | Font | Weight | Size |
|---------|------|--------|------|
| H1 (Page title) | Inter | 700 (Bold) | 28px |
| H2 (Section title) | Inter | 600 (Semibold) | 22px |
| H3 (Card title) | Inter | 600 | 18px |
| Body | Inter | 400 (Regular) | 14px |
| Body small | Inter | 400 | 13px |
| Caption / Label | Inter | 500 (Medium) | 12px |
| KPI Number | Inter | 700 | 36px |
| KPI Label | Inter | 400 | 12px |
| Button | Inter | 500 | 14px |
| Input | Inter | 400 | 14px |
| Table header | Inter | 600 | 13px |
| Table body | Inter | 400 | 13px |
| Badge / Status | Inter | 600 | 11px |
| Mono (IDs, codes) | JetBrains Mono | 400 | 13px |

### Spacing System
- Base unit: 4px
- Component padding: 12px / 16px / 20px / 24px
- Card padding: 20px / 24px
- Section gap: 24px / 32px
- Sidebar width: 64px (icon-only, always fixed — no expand/collapse)
- Content max-width: 1400px
- Border radius: 8px (cards, sm), 12px (buttons/inputs/sidebar icons, md), 16px (sections, lg), 20px (modals, xl), 9999px (badges/pills)

### Shadows & Effects
- **Card shadow**: `0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)`
- **Card hover shadow**: `0 4px 12px rgba(0,0,0,0.25)`
- **Modal backdrop**: `rgba(0,0,0,0.6)` with `backdrop-filter: blur(4px)`
- **Glassmorphism**: `background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08)`
- **Glow effect**: `box-shadow: 0 0 20px var(--accent-glow)`

### Status Badge Colors
| Status | BG Color | Text Color | Usage |
|--------|----------|------------|-------|
| Occupied | `#22C55E20` | `#22C55E` | Flat with active tenant |
| Vacant | `#EF444420` | `#EF4444` | Flat without tenant |
| Under Maintenance | `#F59E0B20` | `#F59E0B` | Flat being repaired |
| Paid | `#22C55E20` | `#22C55E` | Rent fully paid |
| Partial | `#F59E0B20` | `#F59E0B` | Partial rent payment |
| Unpaid | `#EF444420` | `#EF4444` | No rent payment |
| Pending | `#3B82F620` | `#3B82F6` | Awaiting action |
| Draft | `#6B728020` | `#6B7280` | Document in draft |
| Approved | `#22C55E20` | `#22C55E` | Document approved |
| Published | `#6C63FF20` | `#6C63FF` | Document visible to owner |
| Rejected | `#EF444420` | `#EF4444` | Document rejected |
| Family | `#8B5CF620` | `#8B5CF6` | Family tenant |
| Bachelor | `#F97316E0` | `#F97316` | Bachelor tenant |

### Icons
- **Icon library**: Lucide React (consistent with shadcn/ui)
- **Icon size**: 16px (inline), 20px (buttons), 24px (navigation), 32px (KPI cards)
- **Icon color**: Inherits from text color

---

## 20. Database Schema

### Enums

```sql
-- Custom enum types
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'manager');
CREATE TYPE flat_status AS ENUM ('occupied', 'vacant', 'under_maintenance');
CREATE TYPE tenant_type AS ENUM ('family', 'bachelor');
CREATE TYPE tenant_gender AS ENUM ('male', 'female', 'mixed');
CREATE TYPE occupation_type AS ENUM ('employee', 'business_owner');
CREATE TYPE payment_method AS ENUM ('gpay', 'phonepe', 'bank_transfer', 'cash', 'upi', 'cheque', 'other');
CREATE TYPE payment_status AS ENUM ('full', 'partial', 'unpaid');
CREATE TYPE expense_category AS ENUM ('deep_cleaning', 'paint', 'electrical', 'plumbing', 'ac', 'geyser', 'carpentry', 'pest_control', 'chimney', 'other');
CREATE TYPE expense_reporter AS ENUM ('tenant', 'pm_inspection', 'owner');
CREATE TYPE expense_payer AS ENUM ('pm', 'owner', 'tenant');
CREATE TYPE recovery_status AS ENUM ('pending', 'included_in_statement', 'recovered');
CREATE TYPE document_type AS ENUM ('brokerage_invoice', 'expenses_bill', 'maintenance_tracker', 'rental_credit_report', 'flat_annexure');
CREATE TYPE document_status AS ENUM ('draft', 'pending_approval', 'approved', 'published', 'rejected');
CREATE TYPE brokerage_calc_method AS ENUM ('days_of_rent', 'percentage', 'fixed_amount');
CREATE TYPE communication_pref AS ENUM ('whatsapp', 'email', 'both');
CREATE TYPE notification_type AS ENUM (
  'rent_overdue', 'lease_expiring', 'document_approved', 'document_rejected',
  'expense_recorded', 'statement_published', 'tenant_added', 'tenant_exited',
  'maintenance_updated', 'team_member_added', 'owner_onboarded'
);
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'approve', 'reject', 'publish', 'login', 'export');
CREATE TYPE annexure_condition AS ENUM ('good', 'fair', 'poor', 'damaged', 'missing', 'new');
```

### Tables

```sql
-- ============================================================
-- PM TEAM USERS
-- ============================================================
CREATE TABLE pm_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'manager',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES pm_users(id)
);

-- ============================================================
-- COMMUNITIES
-- ============================================================
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT DEFAULT 'Hyderabad',
  state TEXT DEFAULT 'Telangana',
  pincode TEXT,
  total_units INTEGER,
  community_type TEXT, -- 'gated_community', 'apartment_complex', 'villa_project'
  contact_person_name TEXT,
  contact_person_phone TEXT,
  contact_person_email TEXT,
  association_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES pm_users(id)
);

-- ============================================================
-- OWNERS
-- ============================================================
CREATE TABLE owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL, -- Used for Google login matching
  phone TEXT,
  pan_number TEXT,
  address TEXT,
  city TEXT,
  pincode TEXT,
  -- Brokerage fee configuration (per owner)
  brokerage_calc_method brokerage_calc_method DEFAULT 'days_of_rent',
  brokerage_days INTEGER DEFAULT 8, -- If method = days_of_rent
  brokerage_percentage DECIMAL(5,2), -- If method = percentage
  brokerage_fixed_amount DECIMAL(12,2), -- If method = fixed_amount
  gst_applicable BOOLEAN DEFAULT false,
  gst_number TEXT,
  communication_pref communication_pref DEFAULT 'both',
  -- Family grouping
  family_group_id UUID, -- NULL = individual, same UUID = same family group
  family_group_name TEXT, -- e.g., "Krishna Kumar Family"
  is_family_head BOOLEAN DEFAULT false, -- Head of the family group
  -- Onboarding
  onboarding_token TEXT UNIQUE, -- Unique token for onboarding link
  onboarding_completed BOOLEAN DEFAULT false,
  onboarded_at TIMESTAMPTZ,
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES pm_users(id)
);

CREATE INDEX idx_owners_email ON owners(email);
CREATE INDEX idx_owners_family_group ON owners(family_group_id);

-- ============================================================
-- FLATS
-- ============================================================
CREATE TABLE flats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  flat_number TEXT NOT NULL, -- e.g., '3154'
  tower INTEGER, -- Derived: first digit of flat_number
  floor INTEGER, -- Derived: middle two digits
  unit INTEGER, -- Derived: last digit
  bhk_type TEXT NOT NULL, -- '1', '1.5', '2', '2.5', '3', '3.5', '4'
  carpet_area_sft DECIMAL(10,2),
  -- Rent details
  base_rent DECIMAL(12,2) NOT NULL DEFAULT 0,
  maintenance_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  inclusive_rent DECIMAL(12,2) GENERATED ALWAYS AS (base_rent + maintenance_amount) STORED,
  rent_due_day INTEGER DEFAULT 1 CHECK (rent_due_day BETWEEN 1 AND 28),
  -- Status
  status flat_status DEFAULT 'vacant',
  -- Management fee override (if different from owner's brokerage config)
  management_fee_override DECIMAL(12,2),
  -- Vacant maintenance (borne by owner)
  vacant_maintenance_amount DECIMAL(12,2),
  -- Metadata
  notes TEXT, -- PM internal notes
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES pm_users(id),
  UNIQUE(community_id, flat_number)
);

CREATE INDEX idx_flats_community ON flats(community_id);
CREATE INDEX idx_flats_owner ON flats(owner_id);
CREATE INDEX idx_flats_status ON flats(status);
CREATE INDEX idx_flats_flat_number ON flats(flat_number);

-- ============================================================
-- TENANTS (PM-Only Data)
-- ============================================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
  -- Personal details
  name TEXT NOT NULL,
  phone TEXT, -- Hidden from owner
  email TEXT,
  tenant_type tenant_type NOT NULL DEFAULT 'family',
  occupation_type occupation_type,
  company_name TEXT, -- If employee
  business_name TEXT, -- If business owner
  -- Family-specific
  family_member_count INTEGER,
  -- Bachelor-specific
  bachelor_occupant_count INTEGER,
  bachelor_gender tenant_gender,
  bachelor_gender_breakdown TEXT, -- e.g., "2 boys, 1 girl"
  -- Document file IDs (Google Drive)
  aadhaar_file_id TEXT,
  pan_file_id TEXT,
  employment_proof_file_id TEXT,
  business_proof_file_id TEXT,
  spouse_aadhaar_file_id TEXT,
  agreement_file_id TEXT,
  -- Lease details
  lease_start_date DATE,
  lease_end_date DATE,
  security_deposit DECIMAL(12,2),
  monthly_rent DECIMAL(12,2) NOT NULL, -- Same as flat's base_rent (snapshot at time of tenancy)
  monthly_maintenance DECIMAL(12,2), -- Same as flat's maintenance
  monthly_inclusive_rent DECIMAL(12,2), -- Total
  rent_due_day INTEGER DEFAULT 1,
  -- Status
  is_active BOOLEAN DEFAULT true, -- false = past tenant
  exit_date DATE,
  exit_reason TEXT,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES pm_users(id)
);

CREATE INDEX idx_tenants_flat ON tenants(flat_id);
CREATE INDEX idx_tenants_active ON tenants(is_active);

-- ============================================================
-- BACHELOR OCCUPANTS (Individual details for bachelor tenants)
-- ============================================================
CREATE TABLE bachelor_occupants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT, -- 'male', 'female'
  phone TEXT,
  aadhaar_file_id TEXT,
  employment_proof_file_id TEXT,
  is_primary BOOLEAN DEFAULT false, -- Primary contact for the group
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bachelor_occupants_tenant ON bachelor_occupants(tenant_id);

-- ============================================================
-- RENT PAYMENTS
-- ============================================================
CREATE TABLE rent_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  -- Payment details
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_month DATE NOT NULL, -- First of the month (e.g., 2026-02-01)
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'full',
  payment_reference TEXT, -- Transaction ID / UTR number
  -- Proof (Google Drive)
  proof_file_ids TEXT[], -- Array of Google Drive file IDs
  -- Rent breakdown at time of payment
  base_rent_portion DECIMAL(12,2),
  maintenance_portion DECIMAL(12,2),
  -- Remarks
  remarks TEXT,
  -- Metadata
  recorded_by UUID REFERENCES pm_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rent_payments_flat ON rent_payments(flat_id);
CREATE INDEX idx_rent_payments_month ON rent_payments(payment_month);
CREATE INDEX idx_rent_payments_tenant ON rent_payments(tenant_id);

-- ============================================================
-- EXPENSES / REPAIRS
-- ============================================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
  -- Expense details
  category expense_category NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  expense_date DATE NOT NULL,
  -- Vendor
  vendor_name TEXT,
  vendor_phone TEXT,
  -- Reporting
  reported_by expense_reporter NOT NULL DEFAULT 'pm_inspection',
  paid_by expense_payer NOT NULL DEFAULT 'pm',
  -- Recovery (when PM pays upfront)
  recovery_status recovery_status DEFAULT 'pending',
  recovery_statement_id UUID, -- Links to the expenses bill statement
  -- Receipts (Google Drive)
  receipt_file_ids TEXT[],
  -- Remarks
  remarks TEXT,
  -- Metadata
  recorded_by UUID REFERENCES pm_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_expenses_flat ON expenses(flat_id);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_recovery ON expenses(recovery_status);

-- ============================================================
-- COMMUNITY MAINTENANCE CHARGES
-- ============================================================
CREATE TABLE community_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
  -- Period
  quarter TEXT NOT NULL, -- e.g., 'Q2-2025', 'Q3-2025'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  -- Amounts
  maintenance_amount DECIMAL(12,2) NOT NULL,
  previous_pending DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) GENERATED ALWAYS AS (maintenance_amount + previous_pending) STORED,
  -- Payment status
  is_paid BOOLEAN DEFAULT false,
  paid_date DATE,
  paid_by TEXT, -- 'tenant' or 'owner'
  -- Metadata
  recorded_by UUID REFERENCES pm_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_community_maintenance_flat ON community_maintenance(flat_id);
CREATE INDEX idx_community_maintenance_quarter ON community_maintenance(quarter);

-- ============================================================
-- FLAT ANNEXURE (Move-in / Move-out Inventory)
-- ============================================================
CREATE TABLE flat_annexures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  -- Type
  annexure_type TEXT NOT NULL, -- 'move_in' or 'move_out'
  annexure_date DATE NOT NULL,
  -- Deposit calculation (for move-out)
  security_deposit DECIMAL(12,2),
  total_deductions DECIMAL(12,2) DEFAULT 0,
  refund_amount DECIMAL(12,2),
  -- Tenant bank details (for refund)
  refund_bank_name TEXT,
  refund_bank_account TEXT,
  refund_bank_ifsc TEXT,
  refund_account_holder TEXT,
  -- Generated PDF
  pdf_file_id TEXT,
  -- Status
  is_completed BOOLEAN DEFAULT false,
  -- Metadata
  created_by UUID REFERENCES pm_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Annexure rooms
CREATE TABLE annexure_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annexure_id UUID NOT NULL REFERENCES flat_annexures(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL, -- 'Hall & Balcony', 'Kitchen', 'Master Bedroom & Washroom', etc.
  room_order INTEGER NOT NULL, -- Display order
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Annexure items (fixtures/fittings per room)
CREATE TABLE annexure_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES annexure_rooms(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  condition_move_in annexure_condition,
  condition_move_out annexure_condition,
  remarks TEXT,
  item_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Deposit deductions (for move-out)
CREATE TABLE annexure_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annexure_id UUID NOT NULL REFERENCES flat_annexures(id) ON DELETE CASCADE,
  description TEXT NOT NULL, -- e.g., 'Dec 2025 Rent', 'Paint Touchups', '3 AC Servicing'
  amount DECIMAL(12,2) NOT NULL,
  deduction_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DOCUMENTS / STATEMENTS / INVOICES
-- ============================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type document_type NOT NULL,
  document_number TEXT UNIQUE, -- Auto-generated: MMZ/INV/2026/001
  -- Owner / target
  owner_id UUID NOT NULL REFERENCES owners(id),
  family_group_id UUID, -- If grouped by family
  community_id UUID REFERENCES communities(id),
  -- Period
  period_label TEXT, -- e.g., 'Nov 2025 - Jan 2026', 'Jan 2026'
  period_start DATE,
  period_end DATE,
  -- Financials
  subtotal DECIMAL(12,2),
  tds_amount DECIMAL(12,2),
  gst_amount DECIMAL(12,2),
  grand_total DECIMAL(12,2),
  -- Content (JSONB stores the line items — flexible per document type)
  line_items JSONB NOT NULL DEFAULT '[]',
  -- Status & workflow
  status document_status DEFAULT 'draft',
  -- Workflow timestamps
  created_by UUID REFERENCES pm_users(id),
  submitted_by UUID REFERENCES pm_users(id),
  submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES pm_users(id),
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES pm_users(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  published_by UUID REFERENCES pm_users(id),
  published_at TIMESTAMPTZ,
  -- Generated files
  pdf_file_id TEXT,
  excel_file_id TEXT,
  -- MMZ bank details (snapshot at time of generation)
  bank_details JSONB,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_documents_owner ON documents(owner_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_number ON documents(document_number);

-- ============================================================
-- RENT REVISIONS (Tracking rent increases)
-- ============================================================
CREATE TABLE rent_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
  old_base_rent DECIMAL(12,2) NOT NULL,
  new_base_rent DECIMAL(12,2) NOT NULL,
  old_maintenance DECIMAL(12,2),
  new_maintenance DECIMAL(12,2),
  old_inclusive_rent DECIMAL(12,2),
  new_inclusive_rent DECIMAL(12,2),
  percentage_change DECIMAL(5,2), -- Auto-calculated
  revision_date DATE NOT NULL,
  reason TEXT,
  effective_from DATE,
  recorded_by UUID REFERENCES pm_users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rent_revisions_flat ON rent_revisions(flat_id);

-- ============================================================
-- NOTES / COMMENTS
-- ============================================================
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Polymorphic association
  entity_type TEXT NOT NULL, -- 'flat', 'tenant', 'rent_payment', 'expense', 'document'
  entity_id UUID NOT NULL,
  -- Content
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true, -- true = PM-only, false = visible to owner
  -- Author
  author_type TEXT NOT NULL, -- 'pm' or 'owner'
  author_id UUID NOT NULL, -- pm_users.id or owners.id
  author_name TEXT NOT NULL,
  -- Mentions
  mentioned_user_ids UUID[], -- PM user IDs mentioned with @
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notes_entity ON notes(entity_type, entity_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Recipient
  recipient_type TEXT NOT NULL, -- 'pm' or 'owner'
  recipient_id UUID NOT NULL, -- pm_users.id or owners.id
  -- Content
  notification_type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  -- Link to related entity
  entity_type TEXT, -- 'flat', 'document', 'rent_payment', etc.
  entity_id UUID,
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  -- Email notification
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_type, recipient_id);
CREATE INDEX idx_notifications_unread ON notifications(recipient_type, recipient_id, is_read) WHERE is_read = false;

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type TEXT NOT NULL, -- 'pm' or 'owner'
  user_id UUID NOT NULL,
  notification_type notification_type NOT NULL,
  in_app_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_type, user_id, notification_type)
);

-- ============================================================
-- AUDIT LOG (Immutable)
-- ============================================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Who
  actor_type TEXT NOT NULL, -- 'pm', 'owner', 'system'
  actor_id UUID,
  actor_name TEXT,
  actor_role TEXT,
  -- What
  action audit_action NOT NULL,
  entity_type TEXT NOT NULL, -- 'flat', 'tenant', 'rent_payment', 'expense', 'document', etc.
  entity_id UUID NOT NULL,
  -- Details
  description TEXT NOT NULL, -- Human-readable: "Created brokerage invoice INV-2026-001"
  changes JSONB, -- { field: { old: value, new: value } }
  metadata JSONB, -- Any additional context
  -- When
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_type, actor_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- ============================================================
-- FILE REFERENCES (Google Drive)
-- ============================================================
CREATE TABLE file_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_drive_file_id TEXT NOT NULL,
  google_drive_url TEXT,
  -- File metadata
  file_name TEXT NOT NULL,
  file_type TEXT, -- 'image/jpeg', 'application/pdf', etc.
  file_size_bytes INTEGER,
  -- Association
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  file_category TEXT, -- 'rent_proof', 'expense_receipt', 'aadhaar', 'pan', 'agreement', etc.
  -- Metadata
  uploaded_by UUID REFERENCES pm_users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_file_references_entity ON file_references(entity_type, entity_id);
CREATE INDEX idx_file_references_drive ON file_references(google_drive_file_id);

-- ============================================================
-- MMZ SETTINGS (System configuration)
-- ============================================================
CREATE TABLE mmz_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Bank details (shown on all invoices)
  bank_account_name TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  bank_branch TEXT,
  pan_number TEXT,
  gst_number TEXT,
  -- Invoice numbering
  invoice_prefix TEXT DEFAULT 'MMZ',
  next_invoice_number INTEGER DEFAULT 1,
  -- Company details
  company_name TEXT DEFAULT 'Mark My Zone',
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  -- Google Drive
  google_drive_root_folder_id TEXT,
  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES pm_users(id)
);

-- ============================================================
-- USER VIEW PREFERENCES
-- ============================================================
CREATE TABLE user_view_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type TEXT NOT NULL, -- 'pm' or 'owner'
  user_id UUID NOT NULL,
  screen_name TEXT NOT NULL, -- 'flats_list', 'rent_payments', etc.
  view_mode TEXT DEFAULT 'list', -- 'list', 'card', 'grid'
  sort_column TEXT,
  sort_direction TEXT DEFAULT 'asc',
  filters JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_type, user_id, screen_name)
);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_pm_users_updated_at BEFORE UPDATE ON pm_users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_owners_updated_at BEFORE UPDATE ON owners FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_flats_updated_at BEFORE UPDATE ON flats FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_rent_payments_updated_at BEFORE UPDATE ON rent_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_community_maintenance_updated_at BEFORE UPDATE ON community_maintenance FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-generate document number
CREATE OR REPLACE FUNCTION generate_document_number()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  year TEXT;
  next_num INTEGER;
BEGIN
  SELECT invoice_prefix INTO prefix FROM mmz_settings LIMIT 1;
  IF prefix IS NULL THEN prefix := 'MMZ'; END IF;

  year := EXTRACT(YEAR FROM now())::TEXT;

  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(document_number, '/', 4) AS INTEGER)
  ), 0) + 1 INTO next_num
  FROM documents
  WHERE document_number LIKE prefix || '/' ||
    CASE NEW.document_type
      WHEN 'brokerage_invoice' THEN 'INV'
      WHEN 'expenses_bill' THEN 'EXP'
      WHEN 'maintenance_tracker' THEN 'MNT'
      WHEN 'rental_credit_report' THEN 'RCR'
      WHEN 'flat_annexure' THEN 'ANX'
    END || '/' || year || '/%';

  NEW.document_number := prefix || '/' ||
    CASE NEW.document_type
      WHEN 'brokerage_invoice' THEN 'INV'
      WHEN 'expenses_bill' THEN 'EXP'
      WHEN 'maintenance_tracker' THEN 'MNT'
      WHEN 'rental_credit_report' THEN 'RCR'
      WHEN 'flat_annexure' THEN 'ANX'
    END || '/' || year || '/' || LPAD(next_num::TEXT, 4, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_document_number_trigger
  BEFORE INSERT ON documents
  FOR EACH ROW
  WHEN (NEW.document_number IS NULL)
  EXECUTE FUNCTION generate_document_number();

-- Auto-log rent revisions when flat rent changes
CREATE OR REPLACE FUNCTION log_rent_revision()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.base_rent IS DISTINCT FROM NEW.base_rent OR OLD.maintenance_amount IS DISTINCT FROM NEW.maintenance_amount THEN
    INSERT INTO rent_revisions (flat_id, old_base_rent, new_base_rent, old_maintenance, new_maintenance, old_inclusive_rent, new_inclusive_rent, percentage_change, revision_date)
    VALUES (
      NEW.id,
      OLD.base_rent,
      NEW.base_rent,
      OLD.maintenance_amount,
      NEW.maintenance_amount,
      OLD.base_rent + OLD.maintenance_amount,
      NEW.base_rent + NEW.maintenance_amount,
      CASE WHEN OLD.base_rent + OLD.maintenance_amount > 0
        THEN ROUND(((NEW.base_rent + NEW.maintenance_amount) - (OLD.base_rent + OLD.maintenance_amount)) / (OLD.base_rent + OLD.maintenance_amount) * 100, 2)
        ELSE 0
      END,
      CURRENT_DATE
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_rent_revision_trigger
  AFTER UPDATE ON flats
  FOR EACH ROW
  EXECUTE FUNCTION log_rent_revision();
```

### Entity Relationship Summary

```
communities (1) ──── (N) flats
owners (1) ──── (N) flats
flats (1) ──── (N) tenants (only 1 active at a time)
flats (1) ──── (N) rent_payments
flats (1) ──── (N) expenses
flats (1) ──── (N) community_maintenance
flats (1) ──── (N) flat_annexures
flats (1) ──── (N) rent_revisions
tenants (1) ──── (N) bachelor_occupants
tenants (1) ──── (N) rent_payments
owners (1) ──── (N) documents
documents (1) ──── (N) audit_log entries
any entity ──── (N) notes
any entity ──── (N) file_references
any entity ──── (N) audit_log entries
pm_users / owners ──── (N) notifications
pm_users / owners ──── (N) notification_preferences
```

---

## 21. Screen Inventory

### Shared Screens
| # | Screen | Route | Description |
|---|--------|-------|-------------|
| S1 | Login | `/login` | MMZ logo, "Sign in with Google" button, "Sign in with Email" link, dark theme, minimal |
| S2 | Email Magic Link | `/login/email` | Email input, "Send Magic Link" button, success state |
| S3 | 404 Not Found | `/404` | Friendly error page with MMZ branding |
| S4 | Access Denied | `/access-denied` | "Contact your property manager" message |

### PM Portal Screens
| # | Screen | Route | Description |
|---|--------|-------|-------------|
| P1 | PM Dashboard | `/pm` | Analytics home: greeting, 4 KPI cards, Rent Collection bar chart, Occupancy gauge, Expense Breakdown donut, Recent Payments list. Top tabs: Overview/Analytics/Reports. Community filter. |
| P2 | PM Onboarding Wizard | `/pm/onboarding` | 5-step wizard for first-time setup (community → owner → flats → tenant → done) |
| P3 | Communities List | `/pm/communities` | Table/card view of all communities, add button |
| P4 | Community Detail | `/pm/communities/[id]` | Community info, list of owners + flats in this community, edit button |
| P5 | Community Add/Edit | `/pm/communities/[id]/edit` | Form: name, address, city, pincode, total units, type, contact |
| P6 | Owners List | `/pm/owners` | Table/card view, filter by community, search by name/email |
| P7 | Owner Detail | `/pm/owners/[id]` | Owner info, brokerage config, list of flats, documents, family group info |
| P8 | Owner Add/Edit | `/pm/owners/[id]/edit` | Form: name, email, phone, PAN, address, brokerage config, family group, GST |
| P9 | Flats List | `/pm/flats` | List/card/grid views with toggle, filter by community/owner/status/BHK, search |
| P10 | Flat Detail | `/pm/flats/[id]` | Tabbed view: Overview, Rent History, Expenses, Maintenance, Documents, Annexure, Rent Revisions, Notes |
| P11 | Flat Add/Edit | `/pm/flats/[id]/edit` | Form: community, owner, flat number, BHK, area, rent, maintenance, due day |
| P12 | Tenant Detail | `/pm/flats/[id]/tenant` | Full tenant profile (all fields from Section 5), document uploads, bachelor occupants |
| P13 | Tenant Add/Edit | `/pm/flats/[id]/tenant/edit` | Multi-step form: basic info → occupation → documents → lease details → bachelor occupants (if applicable) |
| P14 | Record Rent Payment | `/pm/rent/record` | Smart flat search, auto-fill amounts, date picker, method select, proof upload, save |
| P15 | Rent Payments List | `/pm/rent` | All payments, filter by month/community/owner/status, bulk monthly view grid |
| P16 | Monthly Rent Grid | `/pm/rent/monthly` | Grid view: rows=flats, columns=months, cells=status badges (green/yellow/red) |
| P17 | Record Expense | `/pm/expenses/record` | Flat search, category dropdown, amount, date, vendor, reporter, payer, receipt upload |
| P18 | Expenses List | `/pm/expenses` | All expenses, filter by flat/category/recovery status/date range |
| P19 | Community Maintenance | `/pm/maintenance` | Record quarterly charges, view history per flat/owner |
| P20 | Documents List | `/pm/documents` | All documents/invoices, filter by type/status/owner/date |
| P21 | Generate Brokerage Invoice | `/pm/documents/generate/brokerage` | Select owner/family → shows eligible new tenants → auto-calculate → preview → save draft |
| P22 | Generate Expenses Bill | `/pm/documents/generate/expenses` | Select owner + period → pulls PM-paid expenses → format into table → preview → draft |
| P23 | Generate Maintenance Tracker | `/pm/documents/generate/maintenance` | Select owner + quarters → pulls maintenance charges → format → preview → draft |
| P24 | Generate Rental Credit Report | `/pm/documents/generate/rental-credit` | Select flat → shows full rent history for tenancy → format → preview → draft |
| P25 | Document Preview | `/pm/documents/[id]` | Full document preview, approval workflow buttons, version history timeline, PDF/Excel download |
| P26 | Approval Queue | `/pm/approvals` | Documents pending approval, approve/reject with comments |
| P27 | Tenant Exit Wizard | `/pm/flats/[id]/tenant/exit` | 3-step wizard: confirm details → deposit deductions → review & generate PDF |
| P28 | Flat Annexure | `/pm/flats/[id]/annexure` | Room-by-room inventory editor, condition dropdowns, quantity inputs |
| P29 | Analytics Dashboard | `/pm/analytics` | Charts: recurring repairs, rent punctuality heatmap, occupancy trends, revenue breakdown |
| P30 | Settings | `/pm/settings` | Tabs: Team, Bank Details, Invoice Settings, System Config |
| P31 | Team Management | `/pm/settings/team` | Add/remove PM users, assign roles, activity log |
| P32 | Notification Center | `/pm/notifications` | All notifications list, mark read, filter by type |
| P33 | Global Search Results | `/pm/search?q=` | Search results across flats, tenants, owners, documents |
| P34 | Audit Log | `/pm/audit` | Full audit trail, filter by entity/action/actor/date |
| P35 | Owner Onboarding Link | `/pm/owners/[id]/onboarding` | Generate/copy onboarding link, track status |

### Owner Portal Screens
| # | Screen | Route | Description |
|---|--------|-------|-------------|
| O1 | Owner Welcome / Onboarding | `/owner/welcome` | First-time welcome, confirm details, review properties, accept ToS |
| O2 | Owner Dashboard | `/owner` | Greeting, property cards (card view), recent activity feed, notification bell |
| O3 | Owner Flat Detail | `/owner/flats/[id]` | Tabs: Overview (tenant name, status, lease), Rent History (with proof viewer), Expenses, Maintenance, Documents |
| O4 | Owner Rent History | `/owner/flats/[id]/rent` | Monthly rent list with payment proof image viewer (lightbox) |
| O5 | Owner Expenses | `/owner/flats/[id]/expenses` | Expense list with receipt images |
| O6 | Owner Statements | `/owner/statements` | Published documents only, PDF/Excel download buttons |
| O7 | Owner Statement Detail | `/owner/statements/[id]` | Full statement view, download PDF/Excel |
| O8 | Owner Profile | `/owner/profile` | Edit name, phone (not email — that's identity) |
| O9 | Owner Notifications | `/owner/notifications` | Owner-specific notifications |

### Additional Screens (built beyond original plan)
| # | Screen | Route | Description |
|---|--------|-------|-------------|
| P36 | Document Generate Hub | `/pm/documents/generate` | Select document type to generate |
| P37 | Generate Annexure | `/pm/documents/generate/annexure` | Generate flat annexure (move-in/move-out inventory) |
| P38 | Bulk Rent Recording | `/pm/rent/bulk` | Batch import rent payments |
| P39 | Reports | `/pm/reports` | Export summaries and reports |
| P40 | Data Import | `/pm/import` | Data import tools |
| P41 | Migration Tool | `/pm/import/migrate` | Migration from old Supabase project |
| P42 | Predictive Maintenance | `/pm/predictive-maintenance` | AI-powered risk scoring, overdue services, category insights |
| P43 | New Community | `/pm/communities/new/edit` | Add new community form |
| P44 | New Owner | `/pm/owners/new/edit` | Add new owner form |
| P45 | New Flat | `/pm/flats/new/edit` | Add new flat form |
| O10 | Owner Flats List | `/owner/flats` | Owner's flats across all communities |

### Actual Screen Count: 57 routes (52 page.tsx files + 5 API routes/layouts)

---

## 22. Project Structure

```
MMZ_Dashboard/
├── docs/
│   └── REQUIREMENTS.md          # This file (project brain)
├── public/
│   ├── icons/                   # PWA icons (192x192, 512x512)
│   ├── logo-dark.svg            # MMZ logo for dark backgrounds
│   ├── logo-light.svg           # MMZ logo for light backgrounds
│   ├── favicon.ico              # Extracted "M" icon
│   └── manifest.json            # PWA manifest
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout (theme provider, auth provider)
│   │   ├── page.tsx             # Redirect to /login or /pm or /owner
│   │   ├── login/
│   │   │   ├── page.tsx         # Login screen
│   │   │   └── email/
│   │   │       └── page.tsx     # Email magic link
│   │   ├── (pm)/                # PM portal (route group with PM layout)
│   │   │   ├── layout.tsx       # PM sidebar + header layout
│   │   │   ├── page.tsx         # PM Dashboard
│   │   │   ├── onboarding/
│   │   │   ├── communities/
│   │   │   │   ├── page.tsx     # Communities list
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx # Community detail
│   │   │   │       └── edit/
│   │   │   ├── owners/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── edit/
│   │   │   │       └── onboarding/
│   │   │   ├── flats/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── edit/
│   │   │   │       ├── tenant/
│   │   │   │       │   ├── page.tsx
│   │   │   │       │   ├── edit/
│   │   │   │       │   └── exit/
│   │   │   │       └── annexure/
│   │   │   ├── rent/
│   │   │   │   ├── page.tsx     # Rent payments list
│   │   │   │   ├── record/      # Record payment form
│   │   │   │   └── monthly/     # Monthly grid view
│   │   │   ├── expenses/
│   │   │   │   ├── page.tsx
│   │   │   │   └── record/
│   │   │   ├── maintenance/
│   │   │   ├── documents/
│   │   │   │   ├── page.tsx     # Documents list
│   │   │   │   ├── [id]/        # Document detail/preview
│   │   │   │   └── generate/
│   │   │   │       ├── brokerage/
│   │   │   │       ├── expenses/
│   │   │   │       ├── maintenance/
│   │   │   │       └── rental-credit/
│   │   │   ├── approvals/
│   │   │   ├── analytics/
│   │   │   ├── search/
│   │   │   ├── notifications/
│   │   │   ├── audit/
│   │   │   └── settings/
│   │   │       ├── page.tsx
│   │   │       └── team/
│   │   └── (owner)/             # Owner portal (route group with Owner layout)
│   │       ├── layout.tsx       # Owner header + bottom nav layout
│   │       ├── page.tsx         # Owner Dashboard
│   │       ├── welcome/
│   │       ├── flats/
│   │       │   └── [id]/
│   │       │       ├── page.tsx
│   │       │       └── rent/
│   │       ├── statements/
│   │       │   ├── page.tsx
│   │       │   └── [id]/
│   │       ├── profile/
│   │       └── notifications/
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components (auto-generated)
│   │   ├── layout/
│   │   │   ├── pm-sidebar.tsx       # 64px icon-only rail, theme-aware
│   │   │   ├── pm-header.tsx        # Top bar with tabs, search, community filter
│   │   │   ├── pm-bottom-nav.tsx    # Mobile bottom navigation (5 tabs)
│   │   │   ├── owner-header.tsx
│   │   │   ├── owner-bottom-nav.tsx
│   │   │   ├── theme-toggle.tsx
│   │   │   └── notification-bell.tsx
│   │   ├── shared/
│   │   │   ├── data-table.tsx          # Reusable sortable/filterable table
│   │   │   ├── view-mode-toggle.tsx    # List/Card/Grid toggle
│   │   │   ├── search-bar.tsx          # Global search with autocomplete
│   │   │   ├── filter-panel.tsx        # Advanced filter sidebar
│   │   │   ├── status-badge.tsx        # Colored status badges
│   │   │   ├── kpi-card.tsx            # Animated KPI number card
│   │   │   ├── file-upload.tsx         # Drag-drop with compression
│   │   │   ├── image-viewer.tsx        # Lightbox for payment proofs
│   │   │   ├── skeleton-loader.tsx     # Shimmer skeleton components
│   │   │   ├── empty-state.tsx         # Empty list placeholder
│   │   │   ├── confirm-dialog.tsx      # Confirmation modal
│   │   │   ├── smart-flat-search.tsx   # Flat search with autocomplete
│   │   │   └── export-buttons.tsx      # PDF/Excel/WhatsApp export
│   │   ├── forms/
│   │   │   ├── community-form.tsx
│   │   │   ├── owner-form.tsx
│   │   │   ├── flat-form.tsx
│   │   │   ├── tenant-form.tsx
│   │   │   ├── bachelor-occupant-form.tsx
│   │   │   ├── rent-payment-form.tsx
│   │   │   ├── expense-form.tsx
│   │   │   └── maintenance-form.tsx
│   │   ├── flat/
│   │   │   ├── flat-card.tsx           # Card view for flats
│   │   │   ├── flat-detail-tabs.tsx    # Tab container for flat detail
│   │   │   ├── flat-overview-tab.tsx
│   │   │   ├── flat-rent-tab.tsx
│   │   │   ├── flat-expenses-tab.tsx
│   │   │   ├── flat-maintenance-tab.tsx
│   │   │   ├── flat-documents-tab.tsx
│   │   │   ├── flat-annexure-tab.tsx
│   │   │   └── flat-revisions-tab.tsx
│   │   ├── tenant/
│   │   │   ├── tenant-profile.tsx
│   │   │   ├── tenant-exit-wizard.tsx
│   │   │   └── bachelor-occupants-list.tsx
│   │   ├── documents/
│   │   │   ├── document-preview.tsx
│   │   │   ├── approval-workflow.tsx
│   │   │   ├── version-history.tsx
│   │   │   └── document-line-items.tsx
│   │   ├── analytics/
│   │   │   ├── repair-frequency-chart.tsx
│   │   │   ├── rent-punctuality-heatmap.tsx
│   │   │   ├── occupancy-chart.tsx
│   │   │   └── revenue-breakdown-chart.tsx
│   │   ├── annexure/
│   │   │   ├── annexure-editor.tsx
│   │   │   ├── room-section.tsx
│   │   │   ├── item-row.tsx
│   │   │   └── deposit-calculator.tsx
│   │   └── onboarding/
│   │       ├── pm-onboarding-wizard.tsx
│   │       └── owner-welcome.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser Supabase client
│   │   │   ├── server.ts               # Server Supabase client
│   │   │   ├── middleware.ts            # Auth middleware (PM vs Owner routing)
│   │   │   └── admin.ts                # Service role client (for server actions)
│   │   ├── google-drive/
│   │   │   ├── client.ts               # Google Drive API client
│   │   │   ├── upload.ts               # Upload file, return file ID
│   │   │   ├── download.ts             # Get file by ID
│   │   │   └── folders.ts              # Create/manage folder structure
│   │   ├── utils/
│   │   │   ├── calculations.ts         # Brokerage, TDS, GST calculations
│   │   │   ├── format.ts               # Currency, date, number formatting
│   │   │   ├── flat-number.ts          # Parse flat number → tower/floor/unit
│   │   │   ├── image-compress.ts       # Image compression wrapper
│   │   │   └── validators.ts           # Form validation schemas (zod)
│   │   ├── pdf/
│   │   │   ├── brokerage-invoice.tsx    # PDF template
│   │   │   ├── expenses-bill.tsx
│   │   │   ├── maintenance-tracker.tsx
│   │   │   ├── rental-credit-report.tsx
│   │   │   ├── flat-annexure.tsx
│   │   │   └── shared-styles.ts        # Common PDF styles
│   │   ├── excel/
│   │   │   ├── export.ts               # Generic Excel export
│   │   │   ├── brokerage-invoice.ts
│   │   │   ├── expenses-bill.ts
│   │   │   ├── maintenance-tracker.ts
│   │   │   └── rental-credit-report.ts
│   │   └── hooks/
│   │       ├── use-auth.ts             # Auth state + role
│   │       ├── use-flats.ts            # Flats CRUD operations
│   │       ├── use-tenants.ts
│   │       ├── use-rent-payments.ts
│   │       ├── use-expenses.ts
│   │       ├── use-documents.ts
│   │       ├── use-notifications.ts
│   │       ├── use-search.ts           # Global search
│   │       ├── use-view-mode.ts        # List/Card/Grid preference
│   │       ├── use-filters.ts          # Filter state management
│   │       └── use-file-upload.ts      # Upload with compression
│   ├── types/
│   │   ├── database.ts                 # Supabase generated types
│   │   ├── index.ts                    # App-level type definitions
│   │   └── enums.ts                    # TypeScript enums matching DB
│   └── styles/
│       └── globals.css                 # Tailwind + CSS variables + animations
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql      # Full schema from Section 20
│   │   ├── 002_rls_policies.sql        # Row Level Security policies
│   │   └── 003_seed_data.sql           # Initial data (settings, demo data)
│   └── config.toml                     # Supabase project config
├── .env.local                          # Environment variables (gitignored)
├── .env.example                        # Template for env vars
├── next.config.js                      # Next.js config + PWA
├── tailwind.config.ts                  # Tailwind config with custom theme
├── tsconfig.json
├── package.json
└── README.md
```

---

## 23. Component Architecture

### Layout Hierarchy

```
RootLayout (theme-provider, auth-provider, toast-provider)
├── LoginPage (no layout chrome)
├── PMLayout (slim sidebar + header)
│   ├── PMSidebar (64px icon-only rail, desktop only)
│   │   ├── Logo Mark ("M" icon, 36x36, purple accent)
│   │   ├── Navigation Icons (44x44 touch targets, tooltip on hover)
│   │   │   ├── Dashboard (dashboard icon)
│   │   │   ├── Flats (apartment icon)
│   │   │   ├── Owners (group icon)
│   │   │   ├── Rent (payments icon)
│   │   │   ├── Expenses (receipt_long icon)
│   │   │   ├── Documents (description icon)
│   │   │   └── Analytics (monitoring icon)
│   │   └── Bottom Section
│   │       ├── Settings (settings icon)
│   │       └── User Avatar (initials circle)
│   ├── PMHeader (top bar, right of sidebar)
│   │   ├── Page Title ("Dashboard")
│   │   ├── Tab Navigation (Overview / Analytics / Reports — pill-style)
│   │   ├── Search Box
│   │   ├── Community Filter Dropdown
│   │   └── Notification Bell (unread badge)
│   └── Content Area (page.tsx)
├── PMLayout — Tablet (no sidebar)
│   ├── PMHeader (full-width top bar)
│   │   ├── Logo Mark
│   │   ├── Page Title
│   │   ├── Tab Navigation
│   │   ├── Search Icon
│   │   └── Notification Bell
│   └── Content Area
├── PMLayout — Mobile (no sidebar, bottom nav)
│   ├── PMHeader (compact)
│   │   ├── Logo Mark
│   │   ├── Page Title
│   │   ├── Search Icon
│   │   └── Notification Bell
│   ├── Content Area
│   └── BottomNav (Home / Flats / Rent / Docs / More)
└── OwnerLayout (header + bottom nav)
    ├── OwnerHeader
    │   ├── Logo
    │   ├── Greeting ("Hello, Krishna")
    │   ├── Notification Bell
    │   └── Profile Avatar
    ├── Content Area (page.tsx)
    └── OwnerBottomNav (mobile)
        ├── Dashboard
        ├── Flats
        ├── Statements
        └── Profile
```

### Shared Component API Patterns

```typescript
// DataTable — used on every list screen
<DataTable
  data={flats}
  columns={flatColumns}
  searchPlaceholder="Search flats..."
  filters={<FlatFilters />}
  viewMode={viewMode}                    // 'list' | 'card' | 'grid'
  onViewModeChange={setViewMode}
  cardComponent={FlatCard}               // For card/grid view
  emptyState={<EmptyState icon={Building} message="No flats found" />}
  exportConfig={{ pdf: true, excel: true, whatsapp: true }}
  isLoading={isLoading}                  // Shows skeleton
/>

// KPICard — dashboard metric cards
<KPICard
  title="Total Flats"
  value={287}
  previousValue={280}                    // For trend indicator
  icon={Building}
  color="primary"
  animateOnMount={true}                  // Number counter animation
  onClick={() => router.push('/pm/flats')}
/>

// FileUpload — drag-drop with compression
<FileUpload
  accept="image/*,.pdf"
  maxFiles={5}
  maxSizeMB={10}                         // Before compression
  compressTo={200}                       // KB, for images
  onUpload={handleUpload}                // Returns Google Drive file IDs
  preview={true}                         // Show thumbnail previews
/>

// StatusBadge
<StatusBadge status="occupied" />        // Auto-colors based on status map
<StatusBadge status="paid" />
<StatusBadge status="draft" />

// SmartFlatSearch — used in rent/expense recording
<SmartFlatSearch
  onSelect={(flat) => setSelectedFlat(flat)}
  placeholder="Search by flat number, tenant name, or owner..."
  showStatus={true}                      // Show occupied/vacant badge
/>
```

---

## 24. API Routes & Data Flow

### Server Actions (Next.js App Router)

All data mutations use Next.js Server Actions (`"use server"`) instead of API routes. This gives us:
- Type safety end-to-end
- No separate API layer to maintain
- Automatic revalidation
- Built-in CSRF protection

```typescript
// Example: src/app/(pm)/flats/actions.ts
"use server"

export async function createFlat(data: CreateFlatInput) {
  const supabase = createServerClient()
  const user = await getAuthUser(supabase)
  if (!user || user.role === 'owner') throw new Error('Unauthorized')

  const { data: flat, error } = await supabase
    .from('flats')
    .insert(data)
    .select()
    .single()

  if (error) throw error

  await logAudit('create', 'flat', flat.id, `Created flat ${data.flat_number}`, user)
  revalidatePath('/pm/flats')
  return flat
}
```

### Key Data Flows

**Recording a Rent Payment:**
```
User fills form → compressImage(proof) → uploadToGoogleDrive(compressed)
  → createRentPayment({ ...formData, proof_file_ids: [driveId] })
  → INSERT into rent_payments
  → logAudit('create', 'rent_payment', ...)
  → createNotification(owner, 'rent_recorded', ...)
  → revalidatePath('/pm/rent')
  → revalidatePath('/pm/flats/[id]')
```

**Generating a Document:**
```
User selects owner + period → fetchEligibleData(owner, period)
  → calculateTotals(lineItems, brokerageConfig)
  → createDocument({ type, owner_id, line_items, totals, status: 'draft' })
  → User reviews preview
  → If Manager: submitForApproval() → status = 'pending_approval' → notify admins
  → If Admin: approve() → status = 'approved' → publish() → status = 'published'
  → generatePDF(document) → uploadToGoogleDrive(pdf)
  → notify owner if published
```

**Owner Login Flow:**
```
Owner clicks "Sign in with Google" → Supabase Auth → Google OAuth popup
  → Returns auth.users record with email
  → middleware.ts checks: SELECT * FROM owners WHERE email = auth_email
    → Found + onboarding_completed: redirect to /owner
    → Found + NOT onboarded: redirect to /owner/welcome
    → Not found: redirect to /access-denied
  → Owner portal loads with RLS filtering data to only their flats
```

### Supabase Realtime Subscriptions (Future Enhancement)

```typescript
// Subscribe to notifications for live updates
supabase
  .channel('owner-notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `recipient_id=eq.${ownerId}`
  }, (payload) => {
    showToast(payload.new.title)
    incrementUnreadCount()
  })
  .subscribe()
```

---

## 25. Environment Variables

```bash
# .env.local (NEVER commit this file)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # Server-only, never expose to client

# Google OAuth (configured in Supabase Auth settings)
# No env vars needed — configured in Supabase dashboard

# Google Drive API
GOOGLE_DRIVE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_DRIVE_REFRESH_TOKEN=1//xxxxx       # From OAuth2 flow with mmz.filestorage@gmail.com
GOOGLE_DRIVE_ROOT_FOLDER_ID=xxxxx         # MMZ Files/ folder ID

# App Config
NEXT_PUBLIC_APP_URL=https://mmz-dashboard.vercel.app
NEXT_PUBLIC_APP_NAME="Mark My Zone"

# Optional: Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXX               # Google Analytics (future)
```

```bash
# .env.example (committed to repo)

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REFRESH_TOKEN=
GOOGLE_DRIVE_ROOT_FOLDER_ID=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Mark My Zone"
```

---

## 26. Security & Row Level Security

### Authentication Flow
1. User visits app → middleware checks Supabase session
2. No session → redirect to `/login`
3. Has session → check user type:
   - Email found in `pm_users` → PM portal (`/pm/*`)
   - Email found in `owners` → Owner portal (`/owner/*`)
   - Neither → `/access-denied`
4. PM role checked on every protected action (server-side)

### RLS Policies

```sql
-- Enable RLS on all tables
ALTER TABLE pm_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE flats ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current user is a PM
CREATE OR REPLACE FUNCTION is_pm_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pm_users
    WHERE auth_user_id = auth.uid() AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get current PM user's role
CREATE OR REPLACE FUNCTION get_pm_role()
RETURNS user_role AS $$
BEGIN
  RETURN (
    SELECT role FROM pm_users
    WHERE auth_user_id = auth.uid() AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check if current user is an owner
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM owners
    WHERE auth_user_id = auth.uid() AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get current owner's ID
CREATE OR REPLACE FUNCTION get_owner_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM owners
    WHERE auth_user_id = auth.uid() AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== PM USERS =====
CREATE POLICY "PM can read all PM users" ON pm_users
  FOR SELECT USING (is_pm_user());
CREATE POLICY "Super admin can manage PM users" ON pm_users
  FOR ALL USING (get_pm_role() = 'super_admin');

-- ===== COMMUNITIES =====
CREATE POLICY "PM can read communities" ON communities
  FOR SELECT USING (is_pm_user());
CREATE POLICY "Admin+ can manage communities" ON communities
  FOR ALL USING (get_pm_role() IN ('super_admin', 'admin'));

-- ===== OWNERS =====
CREATE POLICY "PM can read all owners" ON owners
  FOR SELECT USING (is_pm_user());
CREATE POLICY "Owner can read own record" ON owners
  FOR SELECT USING (auth_user_id = auth.uid());
CREATE POLICY "Admin+ can manage owners" ON owners
  FOR ALL USING (get_pm_role() IN ('super_admin', 'admin'));

-- ===== FLATS =====
CREATE POLICY "PM can read all flats" ON flats
  FOR SELECT USING (is_pm_user());
CREATE POLICY "Owner can read own flats" ON flats
  FOR SELECT USING (owner_id = get_owner_id());
CREATE POLICY "PM can manage flats" ON flats
  FOR ALL USING (is_pm_user());

-- ===== TENANTS (PM-only, never visible to owners) =====
CREATE POLICY "PM can read all tenants" ON tenants
  FOR SELECT USING (is_pm_user());
CREATE POLICY "PM can manage tenants" ON tenants
  FOR ALL USING (is_pm_user());
-- NO policy for owners — they CANNOT see tenant records directly
-- Owner sees tenant NAME only via a view/function that strips phone/docs

-- ===== RENT PAYMENTS =====
CREATE POLICY "PM can read all rent payments" ON rent_payments
  FOR SELECT USING (is_pm_user());
CREATE POLICY "Owner can read own flat payments" ON rent_payments
  FOR SELECT USING (
    flat_id IN (SELECT id FROM flats WHERE owner_id = get_owner_id())
  );
CREATE POLICY "PM can manage rent payments" ON rent_payments
  FOR ALL USING (is_pm_user());

-- ===== EXPENSES =====
CREATE POLICY "PM can read all expenses" ON expenses
  FOR SELECT USING (is_pm_user());
CREATE POLICY "Owner can read own flat expenses" ON expenses
  FOR SELECT USING (
    flat_id IN (SELECT id FROM flats WHERE owner_id = get_owner_id())
  );
CREATE POLICY "PM can manage expenses" ON expenses
  FOR ALL USING (is_pm_user());

-- ===== DOCUMENTS =====
CREATE POLICY "PM can read all documents" ON documents
  FOR SELECT USING (is_pm_user());
CREATE POLICY "Owner can read own published documents" ON documents
  FOR SELECT USING (
    owner_id = get_owner_id() AND status = 'published'
  );
CREATE POLICY "PM can manage documents" ON documents
  FOR ALL USING (is_pm_user());

-- ===== NOTIFICATIONS =====
CREATE POLICY "User can read own notifications" ON notifications
  FOR SELECT USING (
    (recipient_type = 'pm' AND recipient_id IN (SELECT id FROM pm_users WHERE auth_user_id = auth.uid()))
    OR
    (recipient_type = 'owner' AND recipient_id = get_owner_id())
  );
CREATE POLICY "User can update own notifications" ON notifications
  FOR UPDATE USING (
    (recipient_type = 'pm' AND recipient_id IN (SELECT id FROM pm_users WHERE auth_user_id = auth.uid()))
    OR
    (recipient_type = 'owner' AND recipient_id = get_owner_id())
  );

-- ===== NOTES =====
CREATE POLICY "PM can read all notes" ON notes
  FOR SELECT USING (is_pm_user());
CREATE POLICY "Owner can read non-internal notes on own entities" ON notes
  FOR SELECT USING (
    is_internal = false
    AND entity_type IN ('flat', 'expense', 'document')
    AND (
      (entity_type = 'flat' AND entity_id IN (SELECT id FROM flats WHERE owner_id = get_owner_id()))
      OR (entity_type = 'document' AND entity_id IN (SELECT id FROM documents WHERE owner_id = get_owner_id() AND status = 'published'))
    )
  );

-- ===== AUDIT LOG (PM only, read-only) =====
CREATE POLICY "Super admin can read audit log" ON audit_log
  FOR SELECT USING (get_pm_role() = 'super_admin');
```

### Privacy Rules (Enforced in Code + RLS)
| Data | PM Team | Owner | Tenant (Future) |
|------|---------|-------|-----------------|
| Tenant phone | YES | NO | Own only |
| Tenant Aadhaar/PAN | YES | NO | Own only |
| Owner phone/email | YES | Own only | NO |
| Rent payment proofs | YES | Own flats | Own only |
| Expense receipts | YES | Own flats | NO |
| Draft documents | YES | NO | NO |
| Published documents | YES | Own only | NO |
| PM internal notes | YES | NO | NO |
| Audit log | Super Admin only | NO | NO |

---

## 27. State Management & Data Flow

### Client-Side State

**No global state library needed.** Use:
- **React Server Components (RSC)** for data fetching (default in App Router)
- **React `useState` / `useReducer`** for local component state (form inputs, toggles, modals)
- **URL search params** for filters, search queries, pagination (shareable, bookmarkable)
- **`localStorage`** for user preferences (view mode, theme)
- **Supabase Realtime** for live updates (notifications, in future)

### Data Fetching Pattern

```typescript
// Server Component (default) — data fetched on server, streamed to client
// src/app/(pm)/flats/page.tsx
export default async function FlatsPage({ searchParams }) {
  const supabase = createServerClient()
  const filters = parseFilters(searchParams)
  const flats = await fetchFlats(supabase, filters)

  return (
    <Suspense fallback={<FlatsSkeleton />}>
      <FlatsView flats={flats} filters={filters} />
    </Suspense>
  )
}

// Client Component — only for interactive parts
// src/components/flat/flat-filters.tsx
"use client"
export function FlatFilters({ currentFilters }) {
  const router = useRouter()
  const [filters, setFilters] = useState(currentFilters)

  const applyFilters = () => {
    const params = new URLSearchParams(filters)
    router.push(`/pm/flats?${params}`)
  }
  // ...
}
```

### Filter State in URL (Shareable, Persistent)

```
/pm/flats?community=abc123&status=occupied&bhk=2,3&sort=flat_number&order=asc&view=card&page=2
/pm/rent?month=2026-02&status=unpaid&community=abc123
/pm/expenses?category=ac,geyser&recovery=pending&from=2025-11-01&to=2026-01-31
```

### Session Persistence
- Search query preserved in URL params
- Filter selections preserved in URL params
- Scroll position restored via `scrollRestoration: 'auto'` (Next.js default)
- View mode (list/card/grid) saved in `localStorage` per screen
- Sidebar is always 64px icon-only (no collapse state needed)
- Theme preference saved in `localStorage` (also system preference detection)

---

## 28. Calculations & Business Logic

### Brokerage Calculation

```typescript
function calculateBrokerage(
  inclusiveRent: number,
  method: 'days_of_rent' | 'percentage' | 'fixed_amount',
  value: number // days, percentage, or fixed amount
): { brokerage: number; tds: number; net: number; gst?: number } {
  let brokerage: number

  switch (method) {
    case 'days_of_rent':
      brokerage = Math.round((inclusiveRent / 30) * value)
      break
    case 'percentage':
      brokerage = Math.round(inclusiveRent * (value / 100))
      break
    case 'fixed_amount':
      brokerage = value
      break
  }

  const tds = Math.round(brokerage * 0.02)      // 2% TDS
  const net = brokerage - tds                     // What MMZ receives

  return { brokerage, tds, net }
}
```

### Inclusive Rent
```
inclusive_rent = base_rent + maintenance_amount
```

### Deposit Refund (Tenant Exit)
```
refund = security_deposit - SUM(deductions)
deductions = [unpaid_rent, partial_month_rent, repair_costs, cleaning_costs, ...]
```

### Rent Punctuality Score
```
on_time = payment_date <= rent_due_day of payment_month
late = payment_date > rent_due_day
unpaid = no payment record for the month
```

### Vacancy Revenue Impact
```
monthly_loss = inclusive_rent × months_vacant
```

### Rent Revision Percentage
```
change_pct = ((new_inclusive - old_inclusive) / old_inclusive) × 100
```

---

## 29. PDF Template Specifications

All PDFs must match the Excel formats provided. Key specs:

### Common Header (All Documents)
- MMZ Logo (top-left or top-center)
- "MARK MY ZONE" company name
- Document title (e.g., "RENTAL INVOICE")
- Document number + Date (top-right)
- Recipient: "To, [Owner Name], [Owner Address]"

### Common Footer (All Documents)
- MMZ Bank Details box:
  - Account holder name
  - Bank name
  - Account number
  - IFSC code
  - Branch
  - PAN number
- "Kindly release the payment at the earliest."
- "AUTHORISED SIGNATORY" with line for signature

### PDF Styling
- Font: Helvetica (PDF-safe, similar to Inter)
- Page size: A4 portrait
- Margins: 40px all sides
- Table borders: 1px solid #333
- Header row: Bold, background #E8E8E8
- Alternating row colors: white / #F8F8F8
- Currency format: Indian (Rs. 1,23,456)
- Date format: DD-MM-YYYY or DD Mon YYYY

---

## 30. Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl/Cmd + K` | Global search | Anywhere in PM portal |
| `Ctrl/Cmd + N` | New (context-aware) | Creates new flat/tenant/payment based on current page |
| `Ctrl/Cmd + S` | Save form | Any form |
| `Ctrl/Cmd + Enter` | Submit form | Any form |
| `Ctrl/Cmd + E` | Export (Excel) | Any list view |
| `Ctrl/Cmd + P` | Export (PDF) | Document preview |
| `Ctrl/Cmd + /` | Toggle sidebar | PM portal |
| `Ctrl/Cmd + D` | Toggle dark mode | Anywhere |
| `1` | Switch to list view | List screens |
| `2` | Switch to card view | List screens |
| `3` | Switch to grid view | List screens |
| `Escape` | Close modal/panel | Modals, filter panels |
| `←` `→` | Navigate months | Monthly rent grid |

---

## 31. Error Handling & Edge Cases

### Edge Cases to Handle
| Scenario | Handling |
|----------|---------|
| Owner has flats in multiple communities | Dashboard shows all, grouped by community |
| Multiple partial payments in one month | Sum tracked, status stays "partial" until total >= expected |
| Tenant exits mid-month | Calculate pro-rated rent for partial month in deposit deduction |
| Flat number doesn't follow XYZN pattern | Allow free-text flat numbers for other communities |
| Owner not yet onboarded (no Google login) | PM can still manage their flats; onboarding is optional |
| Same person is both PM and owner | Check PM table first; if PM, show PM portal (owner view accessible via link) |
| Google Drive storage full (15GB) | Alert PM team; suggest archiving old files or upgrading |
| Large image upload on slow connection | Show progress bar; auto-retry on failure; compressed before upload |
| Concurrent edits to same document | Last-write-wins (acceptable at current scale); audit log shows history |
| Deleted owner with existing flats | Soft delete only; flats remain but show "Owner deactivated" warning |
| Supabase free tier limits | Monitor usage; upgrade to Pro ($25/mo) if approaching 500MB or 50k rows |

### Error UI Patterns
- **Form validation**: Inline errors below each field (red text, red border)
- **API errors**: Toast notification (bottom-right, auto-dismiss 5s)
- **Network errors**: Full-page overlay "Connection lost. Retrying..." with retry button
- **Permission errors**: Toast "You don't have permission to perform this action"
- **Not found**: Dedicated 404 page with "Go back to dashboard" button

---

## 32. Performance & Optimization

### Target Metrics
| Metric | Target | How |
|--------|--------|-----|
| First Contentful Paint | < 1.5s | SSR + edge caching |
| Largest Contentful Paint | < 2.5s | Optimized images, lazy load |
| Time to Interactive | < 3s | Code splitting, minimal JS |
| Lighthouse Score | > 90 | PWA, accessibility, performance |

### Optimization Strategies
- **Server Components by default** — minimize client-side JS
- **Image compression** — 5MB phone photos → < 200KB before upload
- **Lazy loading** — below-fold components, chart libraries
- **Pagination** — 25 items per page on all list views
- **Database indexes** — on all frequently queried columns (see schema)
- **Supabase connection pooling** — via built-in PgBouncer
- **Static generation** — login page, 404, access-denied
- **Edge middleware** — auth checks at the edge (Vercel)
- **Bundle analysis** — monitor with `@next/bundle-analyzer`
- **Font optimization** — `next/font` for Inter (self-hosted, no layout shift)

### PWA Configuration
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // Cache API responses for 5 minutes
    {
      urlPattern: /^https:\/\/.*\.supabase\.co/,
      handler: 'NetworkFirst',
      options: { cacheName: 'supabase-api', expiration: { maxAgeSeconds: 300 } }
    },
    // Cache static assets indefinitely
    {
      urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: 'CacheFirst',
      options: { cacheName: 'images', expiration: { maxEntries: 100 } }
    }
  ]
})
```

---

## 33. Future Roadmap

> **Status (2026-03-01)**: All items below are PARKED for future development.
> Items marked ✅ have already been completed and moved out of this list.
> For the full parked items list with effort estimates and prerequisites, see [PROJECT_STATUS.md](./PROJECT_STATUS.md#11-parked--items-for-future-development).

### Already Completed (removed from roadmap)
- ~~Predictive maintenance (based on repair history patterns)~~ → ✅ Done (Phase 4, `/pm/predictive-maintenance`)
- ~~Owner payment tracking (did they pay our brokerage invoice?)~~ → ✅ Done (Phase 3)
- ~~Bulk rent recording~~ → ✅ Done (Phase 3, `/pm/rent/bulk`)

### Near-Term (Next sprint when prerequisites are met)
- WhatsApp Business API integration (Interakt/AiSensy) — **needs Meta Business Verification**
- Automated rent reminders (3 days before due, on due day, 3 days after) — **needs WhatsApp API or email service**
- Email notification sending for critical events — **needs email service (Resend/SendGrid)**
- GST-compliant invoicing with GSTIN — **needs GST registration details from MMZ**

### Medium-Term (Month 3-6)
- Tenant portal (self-service: view lease, submit maintenance requests)
- Financial reports (yearly summaries for tax filing)
- Bulk rent from bank statement CSV (parsing and auto-matching)
- Integration with Tally / Zoho Books for accounting export
- Automated lease document generation (rental agreement template)
- Digital signature integration (for agreements)

### Long-Term (Month 6-12)
- Multi-language support (Telugu, Hindi)
- Supabase Realtime for live notifications
- AI-powered rent pricing (market comparison)
- Tenant screening automation
- IoT integration (smart locks, water meters)
- White-label solution for other PM companies
- Mobile native app (React Native / Expo)

---

## Appendix A: Existing Reference Files

| File | Location | Purpose |
|------|----------|---------|
| MMZ Logo Light | `/company_logo/MMZ LOGO LIGHT.svg` | White logo for dark backgrounds |
| MMZ Logo Dark | `/company_logo/MMZ LOGO DARK.svg` | Dark logo for light backgrounds |
| Reference Dashboard 1 | `/Example_Dashboard_designs/1.png` | Dark theme dashboard reference |
| Reference Dashboard 2 | `/Example_Dashboard_designs/2.png` | Dashboard with charts reference |
| Reference Dashboard 3 | `/Example_Dashboard_designs/3.png` | Card layout reference |
| Reference Dashboard 4 | `/Example_Dashboard_designs/4.png` | List/table layout reference |
| Reference Dashboard 5 | `/Example_Dashboard_designs/Screenshot 2026-02-28 at 4.05.30 PM.png` | **Primary reference**: Slim icon sidebar, analytics dashboard with charts/gauges, sci-fi minimal style |
| Flat Annexure Excel | `/Copy_of_Flat_No-8253_-_Annexure.xlsx` | Move-out document format |
| Flat Expenses Excel | `/PHF 8 Members - FLAT EXPENSIVES.xlsx` | Expense bill format |
| Maintenance Excel | `/PRAHATHI MADHU MAINTENANCE.xlsx` | Maintenance tracker format |
| Rental Credit Excel | `/R KRISHNA KUMAR RENTAL FLATS.xlsx` | Rent history format |
| Brokerage Invoice Excel | `/Rental_-_Invoice._Final_List_.xlsx` | Invoice format |
| Old Dashboard Code | `/old_dashboard/realestate-frontend-main/` | Features to carry over |

## Appendix B: Glossary

| Term | Definition |
|------|-----------|
| AOR | Agreement of Rent — the lease/rental agreement period |
| BHK | Bedroom, Hall, Kitchen — flat size designation (e.g., 2 BHK = 2 bedrooms) |
| SFT | Square Feet — carpet area of the flat |
| TDS | Tax Deducted at Source — 2% deducted by owner from brokerage before paying MMZ |
| GST | Goods and Services Tax — applicable on brokerage if MMZ is GST-registered |
| Inclusive Rent | Base rent + Community maintenance = Total monthly rent |
| Base Rent | The rent portion that goes to the owner |
| Community Maintenance | Monthly charge paid to the community association (for common areas, security, etc.) |
| Brokerage | ONE-TIME fee charged to owner when a new tenant is placed |
| PM | Property Manager — MMZ team member |
| RLS | Row Level Security — PostgreSQL feature ensuring data isolation |
| PWA | Progressive Web App — installable web app with offline capabilities |
| RecordBook | rekord.in — existing record-keeping app being replaced |

## Appendix C: Contact & Accounts

| Item | Details |
|------|---------|
| Company | Mark My Zone (MMZ) |
| City | Hyderabad, Telangana, India |
| File Storage Account | `mmz.filestorage@gmail.com` (to be created) |
| Domain | TBD (~Rs.500-800/year) |
| Supabase Project | New project (old project credentials needed for migration) |
| Vercel | Deploy via GitHub integration |
