# MMZ Dashboard — Project Status & Handoff Document

> **Last Updated**: 2026-03-02
>
> This document tracks what has been built, what's left, and everything a new developer
> needs to pick this project up. For the full business requirements, data model, and
> design guidelines see [REQUIREMENTS.md](./REQUIREMENTS.md).

---

## Table of Contents

1. [Why This Project Exists](#1-why-this-project-exists)
2. [What We Built](#2-what-we-built)
3. [Phase Completion Summary](#3-phase-completion-summary)
4. [Complete Route Inventory (57 routes)](#4-complete-route-inventory-57-routes)
5. [Architecture Overview](#5-architecture-overview)
6. [File Inventory](#6-file-inventory)
7. [Phase 1 — PM Core (COMPLETED)](#7-phase-1--pm-core-completed)
8. [Phase 2 — Owner Portal + Documents (COMPLETED)](#8-phase-2--owner-portal--documents-completed)
9. [Phase 3 — Polish + Scale (COMPLETED)](#9-phase-3--polish--scale-completed)
10. [Phase 4 — Advanced (PARTIALLY COMPLETED)](#10-phase-4--advanced-partially-completed)
11. [PARKED — Items for Future Development](#11-parked--items-for-future-development)
12. [Database & Migrations](#12-database--migrations)
13. [How to Run the Project](#13-how-to-run-the-project)
14. [How Auth Works](#14-how-auth-works)
15. [Key Design Decisions](#15-key-design-decisions)
16. [Known Limitations](#16-known-limitations)
17. [Testing Checklist](#17-testing-checklist)
18. [For the Next Developer](#18-for-the-next-developer)

---

## 1. Why This Project Exists

**Company**: Mark My Zone (MMZ) — a property management firm in Hyderabad, India.

**Problem**: MMZ manages ~300 flats across Prestige High Fields (2500 total units, 22 owners). They were running everything on:
- 5 types of Excel spreadsheets (invoices, expenses, maintenance, rental credits, annexures)
- WhatsApp groups for communication with owners and tenants
- RecordBook app (rekord.in) for basic record-keeping
- Manual photo sharing of payment proofs

This was error-prone, unscalable, and gave owners no visibility into their properties.

**Solution**: A full-stack Progressive Web App (PWA) that replaces ALL manual tools. Two portals:
1. **PM Portal** — for the MMZ team to manage communities, owners, flats, tenants, rent, expenses, documents, analytics
2. **Owner Portal** — for property owners to view their flats, rent history, expenses, and published statements

**Business Model**:
- MMZ charges a one-time brokerage fee when placing a new tenant (8 days to 1 month of rent)
- Owner deducts 2% TDS before paying MMZ
- MMZ pays vendors for repairs upfront, bills owners at cost (no markup)

For the full business context, see [REQUIREMENTS.md sections 1-6](./REQUIREMENTS.md).

---

## 2. What We Built

| Metric | Count |
|--------|-------|
| Total Routes | 57 |
| PM Portal Pages | 44 |
| Owner Portal Pages | 8 |
| Shared Pages (Login, etc.) | 5 |
| Data Access Layer Functions | 42+ |
| Server Action Functions | 34+ |
| Shared UI Components | 13 |
| Form Components | 6 |
| PDF Templates | 6 |
| Database Migrations | 4 |
| Custom Hooks | 2 |

**Build Status**: 0 errors, 57 routes compiled. Deployed to Vercel at app.markmyzone.com.

---

## 3. Phase Completion Summary

| Phase | Description | Status | Completion Date |
|-------|-------------|--------|----------------|
| Phase 1 | PM Core — CRUD, Auth, Dashboard, Layout | **COMPLETED** | Feb 2026 |
| Phase 2 | Owner Portal + All 5 Document Types + Approvals | **COMPLETED** | Feb 2026 |
| Phase 3 | Polish — Session Persistence, Scroll Restoration, WhatsApp Share, Analytics, Vacancy Tracking | **COMPLETED** | Mar 2026 |
| Phase 4 | Advanced — Predictive Maintenance | **PARTIALLY COMPLETED** | Mar 2026 |
| Phase 4+ | WhatsApp API, Tenant Portal, Multi-language, Tally export, etc. | **PARKED** | — |
| Phase 5 | Deployment — GitHub, Vercel, PWA fixes, favicon, auto-update | **COMPLETED** | Mar 2026 |

---

## 4. Complete Route Inventory (57 routes)

### Shared / Auth (5 routes)
| Route | Purpose | Type |
|-------|---------|------|
| `/` | Root redirect (→ /login or /pm or /owner) | Static |
| `/login` | Login page — Google OAuth + Email magic link | Static |
| `/login/email` | Email magic link input | Static |
| `/access-denied` | "Contact your property manager" error page | Static |
| `/auth/callback` | OAuth callback handler (route.ts, not page) | API |

### PM Portal (44 routes)
| Route | Purpose | Data Source |
|-------|---------|------------|
| `/pm` | PM Dashboard — KPI cards, alerts, recent activity, vacancy tracker | Real DB |
| `/pm/communities` | Communities list with search/filter | Real DB |
| `/pm/communities/[id]` | Community detail — info + linked owners/flats | Real DB |
| `/pm/communities/[id]/edit` | Edit community form | Real DB |
| `/pm/communities/new/edit` | Add new community form | Real DB |
| `/pm/owners` | Owners list with search/filter | Real DB |
| `/pm/owners/[id]` | Owner detail — info, brokerage config, flats, documents | Real DB |
| `/pm/owners/[id]/edit` | Edit owner form | Real DB |
| `/pm/owners/new/edit` | Add new owner form | Real DB |
| `/pm/flats` | Flats list — List/Card/Grid views, advanced filters | Real DB |
| `/pm/flats/[id]` | Flat detail — tabbed view (Overview, Rent, Expenses, Maintenance, Documents, Notes) | Real DB |
| `/pm/flats/[id]/edit` | Edit flat form | Real DB |
| `/pm/flats/new/edit` | Add new flat form | Real DB |
| `/pm/flats/[id]/tenant` | Tenant profile (PM-only, hidden from owners) | Real DB |
| `/pm/flats/[id]/tenant/edit` | Add/edit tenant — multi-step form with bachelor occupant support | Real DB |
| `/pm/flats/[id]/tenant/exit` | Tenant Exit Wizard — 3-step (details → deductions → generate PDF) | Real DB |
| `/pm/rent` | Rent payments list with filters | Real DB |
| `/pm/rent/record` | Record rent payment — smart flat search, proof upload | Real DB |
| `/pm/rent/monthly` | Monthly rent grid — rows=flats, cols=months, cells=status | Real DB |
| `/pm/rent/bulk` | Bulk rent recording (batch import) | Real DB |
| `/pm/expenses` | Expenses list with category/recovery filters | Real DB |
| `/pm/expenses/record` | Record expense — category, vendor, receipt upload | Real DB |
| `/pm/maintenance` | Community quarterly maintenance — record + filter + search | Real DB |
| `/pm/documents` | Documents list — filter by type/status/owner | Real DB |
| `/pm/documents/[id]` | Document detail — preview, version history timeline, approval buttons, payment tracking | Real DB |
| `/pm/documents/generate` | Document generation hub (select type) | Real DB |
| `/pm/documents/generate/brokerage` | Generate brokerage invoice — auto TDS/GST calculation | Real DB |
| `/pm/documents/generate/expenses` | Generate flat expenses bill | Real DB |
| `/pm/documents/generate/maintenance` | Generate maintenance tracker | Real DB |
| `/pm/documents/generate/rental-credit` | Generate rental credit report | Real DB |
| `/pm/documents/generate/annexure` | Generate flat annexure (move-in/move-out inventory) | Real DB |
| `/pm/approvals` | Approval queue — approve/reject documents with comments | Real DB |
| `/pm/analytics` | Analytics dashboard — 6 charts (rent collection, repairs, occupancy, vacancy impact, punctuality) | Real DB |
| `/pm/predictive-maintenance` | Predictive maintenance — AI risk scoring, overdue services, category insights | Real DB |
| `/pm/reports` | Reports generation — export summaries | Real DB |
| `/pm/notifications` | PM notification center — mark read, filter by type | Real DB |
| `/pm/audit` | Audit log — who did what, when, with search/filter | Real DB |
| `/pm/import` | Data import tools | Real DB |
| `/pm/import/migrate` | Migration from old Supabase project | Real DB |
| `/pm/settings` | Settings — team management, bank details, invoice config, notification preferences | Real DB |

### Owner Portal (8 routes)
| Route | Purpose | Data Source |
|-------|---------|------------|
| `/owner` | Owner dashboard — greeting, property cards, recent activity | Real DB |
| `/owner/welcome` | First-time onboarding — confirm details, review properties, accept ToS | Real DB |
| `/owner/flats` | Owner's flats list (all communities) | Real DB |
| `/owner/flats/[id]` | Flat detail — rent history with proof viewer, expenses, maintenance | Real DB |
| `/owner/statements` | Published documents only (not drafts) | Real DB |
| `/owner/statements/[id]` | Statement detail with PDF/Excel download | Real DB |
| `/owner/profile` | Owner profile management | Real DB |
| `/owner/notifications` | Owner notifications | Real DB |

---

## 5. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 14 (App Router)               │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ PM Portal│  │  Owner   │  │  Auth /  │              │
│  │ /pm/*    │  │  Portal  │  │  Login   │              │
│  │ 44 pages │  │  /owner/*│  │  /login  │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │              │              │                     │
│  ┌────▼──────────────▼──────────────▼─────┐             │
│  │         Server Components (RSC)         │             │
│  │     Fetch data via DAL functions        │             │
│  └────────────────┬───────────────────────┘             │
│                    │                                     │
│  ┌────────────────▼───────────────────────┐             │
│  │      Data Access Layer (DAL)            │             │
│  │      src/lib/dal/ — 15 files            │             │
│  │      42+ query functions                │             │
│  └────────────────┬───────────────────────┘             │
│                    │                                     │
│  ┌────────────────▼───────────────────────┐             │
│  │      Server Actions Layer               │             │
│  │      src/lib/actions/ — 17 files        │             │
│  │      34+ mutation functions             │             │
│  └────────────────┬───────────────────────┘             │
│                    │                                     │
└────────────────────┼─────────────────────────────────────┘
                     │
           ┌─────────▼─────────┐
           │  Supabase (Postgres)│
           │  + Auth (Google OAuth)│
           │  + Storage (files)  │
           │  + RLS policies     │
           └─────────────────────┘
```

### Data Flow Pattern

Every page follows the same pattern:

```
[Server Component] page.tsx
  → calls DAL function (e.g., getFlats())
  → passes data as props to Client Component

[Client Component] *-content.tsx
  → receives data via props
  → handles interactivity (filters, search, modals)
  → persists filter state in URL search params
  → calls Server Actions for mutations
```

### Key Patterns
- **Server Components by default** — all data fetching happens server-side
- **Client Components only for interactivity** — marked with `"use client"`
- **URL search params for filters** — shareable, bookmarkable, persisted across navigation
- **Scroll restoration** — custom hook saves/restores scroll position per route
- **View mode persistence** — localStorage remembers list/card/grid preference per screen
- **Skeleton loading** — every page has a `loading.tsx` with shimmer skeletons

---

## 6. File Inventory

### Data Access Layer (`src/lib/dal/`)
| File | Key Functions |
|------|-------------|
| `auth.ts` | `getCurrentAuthUser()`, `getPmUser()`, `getOwnerByAuthId()`, `getOwnerByEmail()` |
| `communities.ts` | `getCommunities()`, `getCommunityById()`, `getCommunityWithStats()` |
| `owners.ts` | `getOwners()`, `getOwnerById()`, `getOwnersList()` |
| `flats.ts` | `getFlats()`, `getFlatById()`, `getFlatsList()`, `getOccupiedFlatsForRentRecording()` |
| `tenants.ts` | `getActiveTenantByFlatId()`, `getTenantById()`, `getPastTenantsByFlatId()` |
| `rent-payments.ts` | `getRentPayments()`, `getRentPaymentsByFlatId()`, `getMonthlyRentGrid()` |
| `expenses.ts` | `getExpenses()`, `getExpensesByFlatId()` |
| `documents.ts` | `getDocuments()`, `getDocumentById()`, `getPendingApprovals()` |
| `maintenance.ts` | `getMaintenance()`, `getMaintenanceByFlatId()` |
| `notifications.ts` | `getNotifications()`, `getUnreadCount()` |
| `audit-log.ts` | `getAuditLog()` |
| `settings.ts` | `getSettings()`, `getTeamMembers()` |
| `dashboard.ts` | `getDashboardKPIs()`, `getRecentActivity()`, `getVacantFlats()`, `getAlerts()` |
| `predictive-maintenance.ts` | `getExpensesForPrediction()`, `getActiveFlatsForPrediction()` |
| `index.ts` | Barrel export of all DAL functions |

### Server Actions (`src/lib/actions/`)
| File | Key Functions |
|------|-------------|
| `communities.ts` | `createCommunity()`, `updateCommunity()`, `deleteCommunity()` |
| `owners.ts` | `createOwner()`, `updateOwner()`, `generateOnboardingToken()` |
| `flats.ts` | `createFlat()`, `updateFlat()` |
| `tenants.ts` | `createTenant()`, `updateTenant()`, `exitTenant()` |
| `rent-payments.ts` | `recordRentPayment()` |
| `expenses.ts` | `recordExpense()` |
| `maintenance.ts` | `recordMaintenance()` |
| `documents.ts` | `createDocument()`, `submitForApproval()`, `approveDocument()`, `rejectDocument()`, `publishDocument()`, `recordDocumentPayment()` |
| `notifications.ts` | `createNotification()`, `markNotificationAsRead()`, `markAllNotificationsAsRead()` |
| `settings.ts` | `updateBankDetails()`, `updateInvoiceSettings()`, `addTeamMember()`, `updateTeamMemberRole()`, `deactivateTeamMember()`, `updateNotificationPreferences()` |
| `storage.ts` | `uploadFile()`, `getFileUrl()` |
| `notes.ts` | `addNote()`, `getNotesByEntity()` |
| `audit.ts` | `logAudit()` |
| `lease-alerts.ts` | `checkLeaseExpirations()` |
| `rent-overdue.ts` | `checkRentOverdue()` |
| `types.ts` | Shared action result types |
| `index.ts` | Barrel export |

### Shared Components (`src/components/shared/`)
| Component | Purpose |
|-----------|---------|
| `kpi-card.tsx` | Animated KPI card with trend indicator |
| `status-badge.tsx` | Auto-colored badge for 13+ status types |
| `page-header.tsx` | Page title + description + optional action button |
| `empty-state.tsx` | Empty list placeholder with icon + message + CTA |
| `skeleton-loader.tsx` | Shimmer skeleton components (table, cards, dashboard) |
| `file-upload.tsx` | Drag-drop with image compression + preview |
| `image-viewer.tsx` | Lightbox for payment proofs and receipts |
| `confirm-dialog.tsx` | Destructive action confirmation modal |
| `global-search.tsx` | Cmd+K search across all entities |
| `export-buttons.tsx` | PDF/Excel/Share/WhatsApp export dropdown |
| `notes-section.tsx` | Comments/notes thread on any entity |
| `sortable-list.tsx` | Drag-and-drop reorderable list |
| `keyboard-shortcuts.tsx` | Keyboard shortcut handler |

### Form Components (`src/components/forms/`)
| Component | Purpose |
|-----------|---------|
| `community-form.tsx` | Community CRUD form |
| `owner-form.tsx` | Owner form with brokerage fee config |
| `flat-form.tsx` | Flat form with community/owner selectors |
| `tenant-form.tsx` | Multi-step tenant form (basic → occupation → docs → lease → bachelor occupants) |
| `rent-payment-form.tsx` | Smart flat search, auto-fill amounts, proof upload |
| `expense-form.tsx` | Category, vendor, receipt upload |

### PDF Templates (`src/lib/pdf/`)
| Template | Generates |
|----------|-----------|
| `brokerage-invoice.tsx` | Brokerage Invoice with TDS/GST calculation |
| `expenses-bill.tsx` | Flat Expenses Bill (periodic) |
| `maintenance-tracker.tsx` | Community Maintenance Tracker (quarterly) |
| `rental-credit-report.tsx` | Rental Credit Report (per flat) |
| `flat-annexure.tsx` | Flat Annexure (move-in/move-out inventory + deposit calc) |
| `document-pdf.tsx` | Generic document PDF wrapper |

### Layout Components (`src/components/layout/`)
| Component | Purpose |
|-----------|---------|
| `pm-sidebar.tsx` | PM sidebar — 16 nav items, collapsible, hover-expand, mobile drawer |
| `pm-header.tsx` | PM header — community filter, global search, theme toggle, notifications, avatar |
| `owner-header.tsx` | Owner header — greeting, notification bell, profile |
| `owner-bottom-nav.tsx` | Owner mobile bottom navigation |
| `theme-toggle.tsx` | Dark/light mode toggle |

### Hooks (`src/lib/hooks/`)
| Hook | Purpose |
|------|---------|
| `use-persisted-view.ts` | Saves list/card/grid view preference per screen in localStorage |
| `use-scroll-restoration.ts` | Saves/restores scroll position per route pathname |

### Utilities (`src/lib/utils/`)
| File | Purpose |
|------|---------|
| `calculations.ts` | Brokerage + TDS + GST calculations |
| `format.ts` | Indian currency formatting, date formatting |
| `flat-number.ts` | Parse XYZN flat numbers → tower/floor/unit |
| `image-compress.ts` | browser-image-compression wrapper |

---

## 7. Phase 1 — PM Core (COMPLETED)

**Goal**: Everything the PM team needs to stop using Excel/RecordBook.

### What was built:
- [x] Project scaffolding — Next.js 14 + TypeScript + Tailwind + shadcn/ui
- [x] Supabase client setup — browser, server, middleware clients
- [x] Auth — Google OAuth + Email magic link via Supabase Auth
- [x] Role-based routing — PM users go to `/pm`, owners go to `/owner`
- [x] PM Layout — collapsible sidebar (16 nav items), header with community filter + search + notifications
- [x] Theme system — dark/light mode with CSS custom properties (42 design tokens)
- [x] PM Dashboard — 8 KPI cards, quick actions, alerts strip, recent activity feed, vacancy tracker
- [x] Communities CRUD — list, detail, add/edit forms with validation
- [x] Owners CRUD — list, detail, add/edit with brokerage fee config, family grouping
- [x] Flats CRUD — list (3 view modes), detail (6 tabs), add/edit with community/owner selectors
- [x] Tenant management — full profiling (family + bachelor), document fields, lease details
- [x] Rent payment recording — smart flat search, auto-fill, proof upload, image compression
- [x] Expense recording — category dropdown, vendor info, receipt upload
- [x] Community maintenance tracking — quarterly charges, filter/search with URL params
- [x] Overdue rent tracking — automatic detection of flats past due date
- [x] Database schema — 4 migration files, full schema with enums, triggers, functions
- [x] Row Level Security — PM sees all, Owner sees only their data, tenant data hidden from owners
- [x] Skeleton loading states — every page has shimmer skeletons
- [x] Toast notifications — sonner for all CRUD feedback

---

## 8. Phase 2 — Owner Portal + Documents (COMPLETED)

**Goal**: Owner visibility + all 5 document types with approval workflow.

### What was built:
- [x] Owner authentication — Google login matched to owner email in DB
- [x] Owner onboarding flow — welcome page, confirm details, review properties, accept ToS
- [x] Owner dashboard — greeting, property cards with status, recent activity feed
- [x] Owner flat detail — rent history with payment proof viewer, expenses, maintenance
- [x] Owner statements — published documents only (drafts hidden), PDF/Excel download
- [x] Owner notifications — owner-specific notification center
- [x] Owner profile — edit name/phone
- [x] Owner bottom navigation — mobile-optimized nav bar
- [x] Brokerage invoice generation — auto-pull new tenants, TDS/GST calculation, line item editing
- [x] Flat expenses bill generation — pull PM-paid expenses by period, formatted table
- [x] Maintenance tracker generation — quarterly charges per flat per owner
- [x] Rental credit report generation — full rent history per flat for a tenancy
- [x] Flat annexure generation — room-by-room inventory, condition tracking, deposit deduction calculator
- [x] Document preview — full preview with formatted line items
- [x] Approval workflow — Draft → Pending Approval → Approved → Published (or Rejected)
- [x] Version history timeline — who created, edited, approved, rejected, published (with timestamps)
- [x] Owner payment tracking — record when owner pays MMZ's invoice
- [x] Invoice numbering — auto-incrementing (MMZ/INV/2026/0001 format)
- [x] PDF generation — @react-pdf/renderer with templates matching Excel formats
- [x] Excel export — xlsx (SheetJS) export from any list view
- [x] Tenant Exit Wizard — 3-step (confirm → deposit deductions → generate PDF + mark vacant)

---

## 9. Phase 3 — Polish + Scale (COMPLETED)

**Goal**: Production-ready polish — session persistence, analytics, sharing.

### What was built:
- [x] URL param persistence — search, filters persisted in URL on all 11 list pages
- [x] Scroll restoration — custom hook saves/restores scroll per route
- [x] View mode persistence — localStorage remembers list/card/grid per screen
- [x] Analytics dashboard — 6 interactive charts:
  - Monthly rent collection (bar chart)
  - Top repair categories (horizontal bar chart)
  - Occupancy status (donut pie chart)
  - Vacancy revenue impact (area chart)
  - Rent punctuality ranking (sortable table)
  - KPI summary cards (occupancy rate, collection rate, total repairs, avg punctuality)
- [x] WhatsApp share buttons — on export dropdown + document detail page
- [x] Vacancy revenue impact tracking — monthly lost revenue from vacant flats
- [x] Document version history — immutable timeline of all actions on documents
- [x] Audit log — full searchable/filterable audit trail with URL params
- [x] Data import tools — import page + migration from old Supabase
- [x] Reports page — export summaries and reports
- [x] Bulk rent recording — batch import of rent payments
- [x] Global search — Cmd+K search across flats, tenants, owners
- [x] Keyboard shortcuts — Cmd+K (search), theme toggle, view modes
- [x] Lease expiration alerts — automatic detection of expiring leases
- [x] Notes/comments system — threaded notes on any entity, internal vs owner-visible

---

## 10. Phase 4 — Advanced (PARTIALLY COMPLETED)

### Completed:
- [x] **Predictive Maintenance** — AI-powered maintenance predictions based on repair history patterns

#### How Predictive Maintenance Works:

**Algorithm**:
1. Each repair category has a known service interval (AC: 180 days, Geyser: 365 days, etc.)
2. If a flat has 2+ repairs in a category, the system computes the actual average interval from that flat's history (adaptive learning)
3. Compares days since last service vs expected interval to determine overdue status
4. Calculates a **Risk Score (0-100)** per flat based on:
   - How overdue the worst category is (up to 60 points)
   - Number of overdue categories (up to 20 points)
   - Total repair frequency (up to 15 points)
5. Risk levels: Critical (70+), High (45+), Medium (20+), Low (<20)

**UI** at `/pm/predictive-maintenance`:
- 4 KPI cards: At-Risk Flats, Overdue Services, Estimated 90-Day Cost, Categories Tracked
- Overdue Services by Category chart (horizontal bar)
- Service Intervals panel (observed averages per category)
- Flat prediction cards — expandable, sorted by risk score, showing per-category predictions with overdue/remaining days, recent repair history
- Filters: search, risk level, sort by risk/overdue/cost — all persisted in URL

### Parked (not started):
See [Section 11](#11-parked--items-for-future-development) below.

### Phase 5 — Deployment & Infrastructure (COMPLETED)

**Goal**: Production deployment, PWA fixes, and developer experience improvements.

#### What was built/fixed:
- [x] **GitHub repository** — Code pushed to `deskmarkmyzone-lgtm/MMZ_Quessence_Dashboard`
- [x] **Vercel deployment** — Auto-deploys on push, live at `https://mmz-quessence-dashboard.vercel.app`
- [x] **Custom domain** — `app.markmyzone.com` (via Namecheap CNAME → Vercel)
- [x] **Google OAuth production config** — Updated Google Cloud Console + Supabase redirect URLs for production domain
- [x] **CSS HMR fix** — Bypassed `next-pwa` wrapper in development mode to prevent CSS hot-reload breaking
- [x] **Turbopack** — Enabled `--turbo` flag for faster dev server CSS updates
- [x] **PostCSS** — Added `autoprefixer` to PostCSS config
- [x] **Favicon + webclip** — Added 32x32 PNG favicon, apple-touch-icon (256x256), PWA icons
- [x] **Android PWA icon** — Added PNG icons to manifest.json (Android requires PNG, not SVG)
- [x] **iPhone sidebar fix** — Changed `h-screen` to `h-dvh` for Dynamic Island safe area
- [x] **Sidebar logo** — Replaced generic "M" icon with actual MMZ logo in collapsed sidebar
- [x] **PWA auto-update** — Added PWAUpdater component that detects new deployments and auto-reloads
- [x] **No-cache headers** — `sw.js` and `manifest.json` served with `no-cache` to ensure fresh service worker
- [x] **Monthly rent back button** — Added `backHref` to monthly rent grid page header

---

## 11. PARKED — Items for Future Development

These items are scoped, understood, and ready to be picked up — but have NOT been started.
They are ordered by business priority.

### Priority 1 — Near-Term (Next sprint when ready)

| Feature | Description | Prerequisites | Estimated Effort |
|---------|-------------|---------------|-----------------|
| **WhatsApp Business API** | Automated message sending via Interakt or AiSensy. Replace manual WhatsApp sharing with programmatic delivery of rent reminders, statement notifications, and overdue alerts. | Meta Business Verification (2-5 days, needs GST certificate + website), Interakt/AiSensy account (~Rs.1,200-1,700/month) | 1-2 weeks |
| **Automated Rent Reminders** | System automatically sends notifications 3 days before due date, on due date, and 3 days after if unpaid. Currently overdue detection exists but notifications are manual. | WhatsApp API or email service setup | 3-5 days |
| **Email Notification Sending** | Currently all notifications are in-app only. Add actual email delivery for critical events (statement published, rent overdue, lease expiring). | Email service (Resend, SendGrid, or Supabase email) | 3-5 days |
| **GST-Compliant Invoicing** | Add GSTIN field, HSN/SAC codes, proper GST breakup on brokerage invoices. Currently TDS is calculated but GST is a boolean flag only. | GST registration details from MMZ | 2-3 days |

### Priority 2 — Medium-Term (Month 3-6)

| Feature | Description | Prerequisites | Estimated Effort |
|---------|-------------|---------------|-----------------|
| **Tenant Portal** | Self-service portal for tenants: view lease, submit maintenance requests, see payment history. Data model already supports it (tenant table exists). | New auth flow for tenants, new route group `/tenant/*` | 2-3 weeks |
| **Financial Reports** | Yearly tax summaries per owner: total rent received, total expenses, net income, TDS certificates. Exportable for CA/tax filing. | None — data already in DB | 1 week |
| **Bulk Rent from Bank Statement** | Import bank statement CSV, auto-match transactions to flats by reference/amount, bulk-mark as paid. `/pm/rent/bulk` page exists but needs bank statement parsing. | Bank statement format specification | 1 week |
| **Tally / Zoho Books Export** | Export financial data in Tally XML or Zoho Books CSV format for accounting integration. | Tally/Zoho format documentation | 3-5 days |
| **Digital Signature Integration** | Digital signatures on rental agreements and annexures. E-sign (Aadhaar-based or simple). | E-sign provider (DigiLocker, Leegality, or similar) | 1-2 weeks |

### Priority 3 — Long-Term (Month 6-12)

| Feature | Description | Prerequisites | Estimated Effort |
|---------|-------------|---------------|-----------------|
| **Multi-Language Support** | Telugu + Hindi translations for owner portal. PM portal stays English. | Translation strings, i18n library (next-intl) | 1-2 weeks |
| **Automated Lease Document Generation** | Auto-generate rental agreement PDFs from template with tenant/owner details filled in. | Legal template approval from MMZ | 1 week |
| **Supabase Realtime** | Live notifications via Supabase Realtime subscriptions. Currently notifications are fetched on page load only. | None — Supabase already supports it | 2-3 days |

### Priority 4 — Future Vision (Year 2+)

| Feature | Description |
|---------|-------------|
| **AI-Powered Rent Pricing** | Market comparison and rent optimization suggestions based on area, BHK, community data |
| **IoT Integration** | Smart locks for vacant flats, water meter readings, energy monitoring |
| **White-Label Solution** | Package the dashboard for other property management companies |
| **Native Mobile App** | React Native / Expo app for PM field use (camera integration, GPS tagging) |
| **Multi-City Expansion** | Optimizations for managing communities across multiple cities |

---

## 12. Database & Migrations

### Migration Files (`supabase/migrations/`)

| File | Purpose | Lines |
|------|---------|-------|
| `001_initial_schema.sql` | Full schema — 20+ tables, enums, triggers, functions | 629 |
| `002_storage_and_rls.sql` | Storage bucket + Row Level Security policies | 52 |
| `003_seed_data.sql` | Seed data — demo community, owners, flats, tenants | 404 |
| `010_owner_payment_tracking.sql` | Payment tracking columns on documents table | 9 |

### Key Tables
| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `pm_users` | PM team members | → auth.users |
| `communities` | Housing communities | 1 → N flats |
| `owners` | Property owners | → auth.users, 1 → N flats |
| `flats` | Residential units | → community, → owner, 1 → N tenants |
| `tenants` | Tenants (PM-only data) | → flat, 1 → N bachelor_occupants |
| `rent_payments` | Monthly rent records | → flat, → tenant |
| `expenses` | Repair/maintenance expenses | → flat |
| `community_maintenance` | Quarterly charges | → flat |
| `documents` | Invoices/statements | → owner, → community |
| `flat_annexures` | Move-in/out inventory | → flat, → tenant |
| `annexure_rooms` | Rooms in annexure | → annexure |
| `annexure_items` | Items per room | → room |
| `annexure_deductions` | Deposit deductions | → annexure |
| `rent_revisions` | Rent change history | → flat |
| `notes` | Comments on any entity | Polymorphic (entity_type + entity_id) |
| `notifications` | In-app notifications | → pm_user or → owner |
| `audit_log` | Immutable audit trail | → any entity |
| `file_references` | File metadata | → any entity |
| `mmz_settings` | System configuration | Singleton |
| `notification_preferences` | Per-user notification prefs | → pm_user or → owner |

### RLS Summary
| Role | Access |
|------|--------|
| PM (any role) | Read all data. Write based on role (super_admin > admin > manager). |
| Owner | Read only their own flats + published documents. Cannot see tenant phone/docs, drafts, other owners' data. |
| Unauthenticated | No access to any table. |

---

## 13. How to Run the Project

### Prerequisites
- Node.js 18+
- npm or yarn
- A Supabase project (free tier works)

### Setup Steps

```bash
# 1. Clone and install
cd MMZ_Dashboard
npm install

# 2. Create .env.local from template
cp .env.example .env.local

# 3. Fill in Supabase credentials in .env.local:
#    NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
#    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
#    SUPABASE_SERVICE_ROLE_KEY=eyJ...

# 4. Apply database migrations in Supabase SQL Editor:
#    Run supabase/migrations/001_initial_schema.sql
#    Run supabase/migrations/002_storage_and_rls.sql
#    Run supabase/migrations/003_seed_data.sql
#    Run supabase/migrations/010_owner_payment_tracking.sql

# 5. Enable Google OAuth in Supabase Dashboard:
#    Authentication → Providers → Google → Enable
#    Add Google Client ID and Secret

# 6. Run development server
npm run dev    # → http://localhost:3000

# 7. Build for production
npm run build  # Should show 0 errors, 57 routes
npm start      # Production server
```

### Production Deployment

The app is deployed on Vercel with auto-deploy from GitHub:

- **Repository**: `https://github.com/deskmarkmyzone-lgtm/MMZ_Quessence_Dashboard`
- **Vercel URL**: `https://mmz-quessence-dashboard.vercel.app`
- **Custom Domain**: `app.markmyzone.com`
- **DNS**: Namecheap CNAME record `app` → `cname.vercel-dns.com`

#### Post-Deploy Configuration
After deploying to a new domain, update:
1. **Supabase** → Authentication → URL Configuration → Site URL + Redirect URLs
2. **Google Cloud Console** → OAuth Client → Authorized JS Origins + Redirect URIs

### Environment Variables
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anon (public) key
SUPABASE_SERVICE_ROLE_KEY=        # Supabase service role key (server-only)

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Mark My Zone"
```

---

## 14. How Auth Works

```
User visits app
  → Middleware checks Supabase session
  → No session → redirect to /login
  → Has session → check user type:
     - Email found in pm_users table → PM portal (/pm/*)
     - Email found in owners table → Owner portal (/owner/*)
     - Neither → /access-denied

PM roles: super_admin > admin > manager
  - super_admin: everything + team management + audit log + settings
  - admin: everything except team management
  - manager: CRUD operations, cannot approve documents or delete records

Owner auto-linking:
  - PM creates owner with email (e.g., krishna@gmail.com)
  - Owner signs in with Google using that email
  - System auto-links auth.users.id → owners.auth_user_id
  - Owner sees only their flats via RLS
```

---

## 15. Key Design Decisions

### Why Next.js 14 App Router (not Pages Router)?
- Server Components reduce client-side JS (faster mobile loads)
- Server Actions eliminate need for API routes
- Built-in streaming and Suspense for loading states
- Better AI coding support (LLMs understand App Router well)

### Why Supabase (not Firebase)?
- PostgreSQL with full SQL support (complex queries, joins, aggregates)
- Row Level Security built into the database (not application-level)
- Free tier with 500MB storage, unlimited API calls
- Self-hostable if needed later

### Why URL params for filters (not useState)?
- Shareable — PM can share a filtered view with a colleague
- Bookmarkable — save commonly used filter combinations
- Persistent — survives page refresh, back/forward navigation
- SEO-friendly — search engines can index filtered views

### Why @react-pdf/renderer (not jsPDF)?
- React component syntax for PDF templates (JSX, not imperative API)
- Better typography and layout control
- Consistent rendering across browsers
- Reuses existing React knowledge

### Why Google Drive was dropped for Supabase Storage?
- Simpler architecture — one service instead of two
- No Google API OAuth complexity
- Supabase Storage integrates natively with RLS
- 1GB free tier is sufficient for current scale

### Why no global state library (Redux, Zustand)?
- Server Components handle data fetching (no client-side cache needed)
- URL params handle filter state (shared, persistent)
- localStorage handles preferences (view mode, theme)
- Current scale doesn't need it — reassess if real-time collaboration is added

---

## 16. Known Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| Notifications are in-app only | Owners must open the app to see updates | Add email notifications (Priority 1 parked item) |
| WhatsApp sharing is manual | PM must copy/paste or use share button | Add WhatsApp API (Priority 1 parked item) |
| No offline support | App doesn't work without internet | PWA config exists but offline caching is basic |
| Single-tenant database | All communities share one Supabase project | Fine for current scale; shard if needed at 10+ communities |
| No automated tests | No unit/integration/e2e tests | Should add before onboarding new developers |
| File storage limited to 1GB | Supabase free tier storage limit | Upgrade to Pro ($25/mo) when approaching limit |
| Flat numbers assume XYZN format | Only works for Prestige High Fields numbering | Free-text flat numbers supported for other communities |
| No CI/CD pipeline | Manual deploys via Vercel | Set up GitHub Actions if team grows |
| PWA icon change requires reinstall | Changing the app icon requires users to uninstall and reinstall the PWA | OS-level limitation, no workaround |

---

## 17. Testing Checklist

Use this to verify the application works correctly after any major changes.

### Auth
- [ ] Google login works for PM user
- [ ] Google login works for Owner
- [ ] Unknown email → access denied page
- [ ] Email magic link sends and works
- [ ] PM cannot access owner routes and vice versa

### PM CRUD
- [ ] Create community → appears in list
- [ ] Create owner with brokerage config → appears in list
- [ ] Create flat linked to community + owner → appears in list
- [ ] Add tenant to flat → flat status changes to "Occupied"
- [ ] Record rent payment with proof image → appears in flat history
- [ ] Record expense with receipt → appears in expenses list
- [ ] Record maintenance charge → appears in maintenance list

### Documents
- [ ] Generate brokerage invoice → TDS/GST math correct
- [ ] Generate expenses bill → pulls correct expenses
- [ ] Generate maintenance tracker → pulls correct quarterly charges
- [ ] Generate rental credit report → shows full rent history
- [ ] Generate annexure → room inventory + deposit calculation
- [ ] Submit for approval → status changes to "Pending"
- [ ] Approve document → status changes to "Approved"
- [ ] Publish document → owner can see it
- [ ] Download PDF → formatted correctly
- [ ] Download Excel → data correct

### Owner Portal
- [ ] Owner sees only their flats
- [ ] Owner CANNOT see tenant phone numbers
- [ ] Owner CANNOT see draft documents
- [ ] Owner can view rent proofs (images)
- [ ] Owner can download published statements
- [ ] Owner first-time welcome flow works

### Analytics
- [ ] Dashboard KPIs show correct counts
- [ ] All 6 analytics charts render with data
- [ ] Predictive maintenance shows risk scores

### Polish
- [ ] Dark/light mode toggle works on all pages
- [ ] Filters persist in URL on all list pages
- [ ] Scroll position restored on back navigation
- [ ] View mode (list/card/grid) remembered per screen
- [ ] WhatsApp share opens WhatsApp with pre-filled text
- [ ] Search works across flats, tenants, owners (Cmd+K)

---

## 18. For the Next Developer

### Getting Oriented

1. **Start here**: Read this document top to bottom.
2. **Business context**: Read [REQUIREMENTS.md](./REQUIREMENTS.md) sections 1-6 for the full business model.
3. **Database**: Read `supabase/migrations/001_initial_schema.sql` — the schema is the source of truth.
4. **Types**: Read `src/types/index.ts` — all TypeScript interfaces mirror the DB schema.
5. **Pick a page**: Read any `page.tsx` → its `*-content.tsx` → the DAL function it calls → the action it uses. The pattern is consistent across all 57 routes.

### Code Patterns to Follow

**Adding a new list page**:
```
1. Create DAL function in src/lib/dal/
2. Create server component page.tsx that calls DAL
3. Create client component *-content.tsx that receives data as props
4. Add URL param persistence for filters
5. Create loading.tsx with skeleton
6. Add nav item in pm-sidebar.tsx
```

**Adding a new form**:
```
1. Create Zod schema in the form component
2. Create server action in src/lib/actions/
3. Wire form onSubmit → action → revalidatePath
4. Add audit logging via logAudit()
5. Show toast on success/error
```

**Adding a new document type**:
```
1. Add to DocumentType enum in types + DB
2. Create generate page in /pm/documents/generate/
3. Create PDF template in src/lib/pdf/
4. Add to document-pdf.tsx switch statement
5. Add to generate hub page
```

### Things That Might Trip You Up
- `inclusive_rent` is a **generated column** in Postgres (`base_rent + maintenance_amount`). Don't try to insert it directly.
- The `audit_log` table is **append-only** — no UPDATE or DELETE operations.
- Owner's `auth_user_id` is NULL until they first sign in (auto-linked on first Google login).
- PM sidebar uses `hover-to-expand` on desktop — test interactions with both collapsed and expanded states.
- The `flat.tenant` field from Supabase returns an **array** (because tenants is 1-to-many), even though only one tenant is active at a time. Always filter for `is_active === true`.

### Tech Stack Quick Reference
| What | Where |
|------|-------|
| Framework | Next.js 14.2.35 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 3.4.1 + 42 CSS custom properties |
| UI Library | shadcn/ui (Radix UI primitives) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Google OAuth + Email magic link) |
| File Storage | Supabase Storage |
| PDF Generation | @react-pdf/renderer |
| Excel Export | xlsx (SheetJS) |
| Charts | Recharts |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| Toasts | Sonner |
| Theme | next-themes |
| Image Compression | browser-image-compression |
| Drag & Drop | dnd-kit |
| Command Palette | cmdk |
| Hosting | Vercel (auto-deploy from GitHub) |
| Domain | app.markmyzone.com (Namecheap) |
| PWA | next-pwa + custom PWAUpdater auto-reload |

---

*This document should be updated whenever significant features are added or architectural decisions change.*
