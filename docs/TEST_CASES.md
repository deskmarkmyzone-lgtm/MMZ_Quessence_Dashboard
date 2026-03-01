# MMZ Dashboard -- Comprehensive Test Cases

> **Project:** Mark My Zone Property Management Dashboard
> **Version:** 1.0
> **Date:** 2026-03-02
> **Total Test Cases:** 198
> **Framework:** Next.js 14 (App Router), Supabase, TypeScript
> **Portals:** PM (Property Manager) and Owner

---

## Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Module 1: Authentication](#module-1-authentication)
3. [Module 2: PM Dashboard](#module-2-pm-dashboard)
4. [Module 3: Communities CRUD](#module-3-communities-crud)
5. [Module 4: Owners CRUD](#module-4-owners-crud)
6. [Module 5: Flats CRUD](#module-5-flats-crud)
7. [Module 6: Tenant Management](#module-6-tenant-management)
8. [Module 7: Rent Payments](#module-7-rent-payments)
9. [Module 8: Expenses](#module-8-expenses)
10. [Module 9: Community Maintenance](#module-9-community-maintenance)
11. [Module 10: Document Generation](#module-10-document-generation)
12. [Module 11: Approvals Workflow](#module-11-approvals-workflow)
13. [Module 12: Analytics](#module-12-analytics)
14. [Module 13: Reports](#module-13-reports)
15. [Module 14: Audit Log](#module-14-audit-log)
16. [Module 15: Settings](#module-15-settings)
17. [Module 16: Notifications](#module-16-notifications)
18. [Module 17: Global Search](#module-17-global-search)
19. [Module 18: Data Import](#module-18-data-import)
20. [Module 19: Owner Portal](#module-19-owner-portal)
21. [Module 20: Cross-Cutting Concerns](#module-20-cross-cutting-concerns)
22. [Module 21: Deployment & PWA](#module-21-deployment--pwa)
23. [Summary Table](#summary-table)

---

## Test Environment Setup

### Prerequisites

| Requirement | Details |
|---|---|
| Supabase Project | Running instance with all tables, RLS policies, and storage bucket `mmz-files` configured |
| Environment Variables | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` set in `.env.local` |
| Google OAuth | Configured in Supabase Auth with valid redirect URLs |
| pm_users Entry | At least one row in `pm_users` table with valid email and `is_active = true` |
| owners Entry | At least one row in `owners` table with valid email, `is_active = true`, and `auth_user_id` linked |
| Test Accounts | Google account for OAuth, email/password accounts for both PM and Owner roles |
| Browser | Chrome (latest), Firefox (latest), Safari (latest) |
| Devices | Desktop (1920x1080), Tablet (768x1024), Mobile (375x812) |

### Test Data Setup

1. Create at least 2 communities with full address details
2. Create at least 3 owners with varying brokerage calculation methods (days_of_rent, percentage, fixed_amount)
3. Create at least 6 flats across communities with different statuses (occupied, vacant, under_maintenance)
4. Create at least 3 active tenants (mix of family and bachelor types) and 1 past tenant
5. Record at least 5 rent payments across different months and payment methods
6. Record at least 3 expenses across different categories
7. Create at least 2 documents in different statuses (draft, pending_approval, approved, published)
8. Record at least 2 community maintenance entries

---

## Module 1: Authentication

### TC-AUTH-001: Google OAuth Login -- Success

- **Precondition**: Google OAuth is configured in Supabase; user's email exists in `pm_users` table
- **Steps**:
  1. Navigate to `/login`
  2. Verify the page displays the MMZ logo, "Welcome back" heading, and "Continue with Google" button
  3. Click "Continue with Google"
  4. Complete Google sign-in flow in the OAuth popup
  5. Wait for redirect
- **Expected Result**: User is redirected to `/auth/callback`, then to `/auth/role-check`, and finally to `/pm` dashboard. No error messages displayed.
- **Priority**: Critical
- **Status**: Not Tested

### TC-AUTH-002: Google OAuth Login -- Error Handling

- **Precondition**: Google OAuth is configured but user cancels the Google sign-in
- **Steps**:
  1. Navigate to `/login`
  2. Click "Continue with Google"
  3. Cancel or close the Google OAuth popup
- **Expected Result**: User remains on `/login` page. An error message appears: "Failed to start Google sign-in. Please try again." The button is re-enabled after error.
- **Priority**: High
- **Status**: Not Tested

### TC-AUTH-003: Google OAuth Login -- Loading State

- **Precondition**: Google OAuth is configured
- **Steps**:
  1. Navigate to `/login`
  2. Click "Continue with Google"
  3. Observe the button state during the OAuth redirect
- **Expected Result**: Button text changes to "Signing in..." and the button becomes disabled during the loading state. The Google icon remains visible.
- **Priority**: Medium
- **Status**: Not Tested

### TC-AUTH-004: Email/Password Sign Up -- Success

- **Precondition**: Email confirmation is disabled in Supabase Auth settings (or auto-confirm is enabled)
- **Steps**:
  1. Navigate to `/login`
  2. Click "Sign in with Email & Password"
  3. Verify redirect to `/login/email`
  4. Click the "Sign Up" tab
  5. Enter a new valid email: `testuser@example.com`
  6. Enter password: `StrongPass123`
  7. Enter confirm password: `StrongPass123`
  8. Click "Create Account"
- **Expected Result**: Account is created, user is automatically signed in, and redirected to `/auth/role-check`. If user is not in `pm_users` or `owners` tables, they are redirected to `/access-denied`.
- **Priority**: Critical
- **Status**: Not Tested

### TC-AUTH-005: Email/Password Sign Up -- Weak Password

- **Precondition**: User is on the sign-up form
- **Steps**:
  1. Navigate to `/login/email`
  2. Click the "Sign Up" tab
  3. Enter email: `test@example.com`
  4. Enter password: `123` (less than 6 characters)
  5. Enter confirm password: `123`
  6. Click "Create Account"
- **Expected Result**: Error message displays: "Password must be at least 6 characters". Form is not submitted. The `minLength={6}` HTML validation may also prevent submission.
- **Priority**: High
- **Status**: Not Tested

### TC-AUTH-006: Email/Password Sign Up -- Password Mismatch

- **Precondition**: User is on the sign-up form
- **Steps**:
  1. Navigate to `/login/email`
  2. Click the "Sign Up" tab
  3. Enter email: `test@example.com`
  4. Enter password: `StrongPass123`
  5. Enter confirm password: `DifferentPass456`
  6. Click "Create Account"
- **Expected Result**: Error message displays: "Passwords do not match". Account is not created.
- **Priority**: High
- **Status**: Not Tested

### TC-AUTH-007: Email/Password Sign Up -- Existing Email

- **Precondition**: An account already exists with the test email
- **Steps**:
  1. Navigate to `/login/email`
  2. Click the "Sign Up" tab
  3. Enter email of an already-registered user
  4. Enter valid password and confirmation
  5. Click "Create Account"
- **Expected Result**: Supabase returns an error. Error message is displayed to the user (e.g., "User already registered").
- **Priority**: High
- **Status**: Not Tested

### TC-AUTH-008: Email/Password Sign In -- Success

- **Precondition**: A registered user exists with known email and password, and their email is in `pm_users`
- **Steps**:
  1. Navigate to `/login/email`
  2. Verify "Sign In" tab is active by default
  3. Enter valid email and password
  4. Click "Sign In"
- **Expected Result**: User is signed in and redirected to `/auth/role-check`, then to the appropriate portal (`/pm` for PM users, `/owner` for owners).
- **Priority**: Critical
- **Status**: Not Tested

### TC-AUTH-009: Email/Password Sign In -- Wrong Password

- **Precondition**: A registered user exists
- **Steps**:
  1. Navigate to `/login/email`
  2. Enter valid email but incorrect password
  3. Click "Sign In"
- **Expected Result**: Error message displays (Supabase returns "Invalid login credentials"). User remains on the sign-in page.
- **Priority**: High
- **Status**: Not Tested

### TC-AUTH-010: Email/Password Sign In -- Unregistered Email

- **Precondition**: No user exists with the provided email
- **Steps**:
  1. Navigate to `/login/email`
  2. Enter an unregistered email and any password
  3. Click "Sign In"
- **Expected Result**: Error message displays: "Invalid login credentials". User remains on the sign-in page.
- **Priority**: High
- **Status**: Not Tested

### TC-AUTH-011: Role-Based Redirect -- PM User

- **Precondition**: User is authenticated; email matches a row in `pm_users` with `is_active = true`
- **Steps**:
  1. Sign in with email that matches a `pm_users` entry
  2. Observe the redirect behavior
- **Expected Result**: User is redirected to `/pm`. If `auth_user_id` was null in `pm_users`, it is now auto-linked to the Supabase auth user ID.
- **Priority**: Critical
- **Status**: Not Tested

### TC-AUTH-012: Role-Based Redirect -- Owner User

- **Precondition**: User is authenticated; email matches a row in `owners` with `is_active = true`, `onboarding_completed = true`
- **Steps**:
  1. Sign in with email that matches an `owners` entry
  2. Observe the redirect behavior
- **Expected Result**: User is redirected to `/owner` dashboard. If `auth_user_id` was null in `owners`, it is now auto-linked.
- **Priority**: Critical
- **Status**: Not Tested

### TC-AUTH-013: Role-Based Redirect -- Owner Not Onboarded

- **Precondition**: User is authenticated; email matches an `owners` entry with `onboarding_completed = false`
- **Steps**:
  1. Sign in with email of an owner who has not completed onboarding
  2. Observe the redirect behavior
- **Expected Result**: User is redirected to `/owner/welcome` instead of `/owner`.
- **Priority**: High
- **Status**: Not Tested

### TC-AUTH-014: Role-Based Redirect -- Access Denied

- **Precondition**: User is authenticated but their email is NOT in `pm_users` or `owners` tables
- **Steps**:
  1. Sign in with an email not present in either `pm_users` or `owners`
  2. Observe the redirect behavior
- **Expected Result**: User is redirected to `/access-denied` page with an appropriate message.
- **Priority**: Critical
- **Status**: Not Tested

### TC-AUTH-015: Protected Route Access Without Auth

- **Precondition**: User is NOT authenticated (no active session)
- **Steps**:
  1. Clear all cookies / sign out
  2. Attempt to navigate directly to `/pm`
  3. Attempt to navigate directly to `/owner`
  4. Attempt to navigate directly to `/pm/flats`
- **Expected Result**: All protected routes redirect to `/login`. Public routes (`/login`, `/login/email`, `/access-denied`) remain accessible.
- **Priority**: Critical
- **Status**: Not Tested

### TC-AUTH-016: Authenticated User Accessing Login Page

- **Precondition**: User is already authenticated with an active session
- **Steps**:
  1. Sign in successfully
  2. Navigate to `/login` or `/login/email` directly
- **Expected Result**: User is redirected to `/auth/role-check` and then to their appropriate portal.
- **Priority**: Medium
- **Status**: Not Tested

### TC-AUTH-017: Password Visibility Toggle

- **Precondition**: User is on the email/password login form
- **Steps**:
  1. Navigate to `/login/email`
  2. Enter a password in the password field
  3. Click the eye icon next to the password field
  4. Observe the password field
  5. Click the eye icon again
- **Expected Result**: Clicking the eye icon toggles the password field between `type="password"` (obscured) and `type="text"` (visible). The icon toggles between Eye and EyeOff.
- **Priority**: Low
- **Status**: Not Tested

### TC-AUTH-018: Sign In / Sign Up Tab Switch

- **Precondition**: User is on `/login/email`
- **Steps**:
  1. Navigate to `/login/email`
  2. Verify "Sign In" tab is active and shows email + password fields only
  3. Click "Sign Up" tab
  4. Verify "Confirm Password" field appears
  5. Click "Sign In" tab again
  6. Verify "Confirm Password" field disappears
- **Expected Result**: Switching between tabs changes the form layout. Any error messages are cleared when switching tabs. The heading and description text update accordingly.
- **Priority**: Medium
- **Status**: Not Tested

### TC-AUTH-019: Back to Login Navigation

- **Precondition**: User is on `/login/email`
- **Steps**:
  1. Navigate to `/login/email`
  2. Click "Back to login" link with arrow icon
- **Expected Result**: User is navigated back to `/login` (the main login page with Google OAuth option).
- **Priority**: Low
- **Status**: Not Tested

---

## Module 2: PM Dashboard

### TC-DASH-001: KPI Cards Display Correct Data

- **Precondition**: PM user is authenticated; test data exists (flats, owners, rent payments)
- **Steps**:
  1. Navigate to `/pm`
  2. Observe the KPI cards section
- **Expected Result**: Dashboard displays 6 KPI cards: Total Flats, Occupied, Vacant, Under Maintenance, Rent Collected (current month), and Total Owners. Values match the database counts. Rent collection shows currency formatting in INR.
- **Priority**: Critical
- **Status**: Not Tested

### TC-DASH-002: Rent Collection KPI Accuracy

- **Precondition**: Known rent payment amounts exist for the current month
- **Steps**:
  1. Record a rent payment for the current month in the database
  2. Navigate to `/pm`
  3. Verify the "Rent Collected" KPI
- **Expected Result**: "Rent Collected" shows the sum of all `rent_payments.amount` where `payment_month` falls within the current calendar month. "Rent Expected" shows the sum of `inclusive_rent` for all occupied flats.
- **Priority**: Critical
- **Status**: Not Tested

### TC-DASH-003: Pending Rents Alert

- **Precondition**: At least one occupied flat has no rent payment recorded for the current month
- **Steps**:
  1. Navigate to `/pm`
  2. Check the "Pending Rents" count
- **Expected Result**: "Pending Rents" count matches the number of occupied flats that have no payment recorded in `rent_payments` for the current month.
- **Priority**: High
- **Status**: Not Tested

### TC-DASH-004: Vacant Flats Section

- **Precondition**: At least one flat with `status = "vacant"` exists
- **Steps**:
  1. Navigate to `/pm`
  2. Scroll to the Vacant Flats section
- **Expected Result**: Vacant flats table shows flat number, owner name, BHK type, vacant since date, days vacant, expected rent, and estimated revenue lost. Revenue lost is calculated as `inclusive_rent * months_vacant`.
- **Priority**: High
- **Status**: Not Tested

### TC-DASH-005: Outstanding Invoices Section

- **Precondition**: Documents with status "published" or "approved" exist
- **Steps**:
  1. Navigate to `/pm`
  2. Scroll to the Outstanding Invoices section
- **Expected Result**: Up to 5 most recent published/approved documents are shown with document number, owner name, amount, issue date, and days outstanding. Documents over 30 days old show "overdue" status.
- **Priority**: High
- **Status**: Not Tested

### TC-DASH-006: Alerts Section from Notifications

- **Precondition**: Unread notifications exist with `recipient_type = "pm"`
- **Steps**:
  1. Navigate to `/pm`
  2. Check the Alerts section
- **Expected Result**: Up to 10 unread notifications displayed, categorized by type (overdue, lease expiring, partial payment). Each alert shows message, severity indicator, and links to `/pm/notifications`.
- **Priority**: Medium
- **Status**: Not Tested

### TC-DASH-007: Background Job Execution

- **Precondition**: Active tenants with expiring leases and occupied flats with overdue rent exist
- **Steps**:
  1. Navigate to `/pm` (triggers `checkLeaseExpirations()` and `checkRentOverdue()`)
  2. Check the `notifications` table
- **Expected Result**: Lease expiration and rent overdue notifications are created in the `notifications` table. Dashboard renders without delay (jobs are fire-and-forget).
- **Priority**: Medium
- **Status**: Not Tested

### TC-DASH-008: Dashboard Skeleton Loading State

- **Precondition**: PM user is authenticated
- **Steps**:
  1. Navigate to `/pm` on a slow connection (throttle network)
  2. Observe the loading state
- **Expected Result**: Skeleton loaders (animated pulse placeholders) are shown for KPI cards and content sections while data is loading.
- **Priority**: Low
- **Status**: Not Tested

---

## Module 3: Communities CRUD

### TC-COMM-001: List Communities

- **Precondition**: Multiple active communities exist in the database
- **Steps**:
  1. Navigate to `/pm/communities`
  2. Observe the community listing
- **Expected Result**: All communities with `is_active = true` are displayed, sorted by name. Each entry shows name, address, city, total units, and community type.
- **Priority**: Critical
- **Status**: Not Tested

### TC-COMM-002: Search Communities

- **Precondition**: Multiple communities exist
- **Steps**:
  1. Navigate to `/pm/communities`
  2. Enter a partial community name in the search field
- **Expected Result**: The community list filters in real-time to show only communities whose name matches the search query (case-insensitive).
- **Priority**: High
- **Status**: Not Tested

### TC-COMM-003: Create Community -- All Fields

- **Precondition**: PM user is authenticated
- **Steps**:
  1. Navigate to `/pm/communities`
  2. Click "Add Community" or navigate to `/pm/communities/new/edit`
  3. Fill in all fields:
     - Name: "Prestige Lakeside Habitat"
     - Address: "Survey No. 123, Gachibowli"
     - City: "Hyderabad"
     - State: "Telangana"
     - Pincode: "500032"
     - Total Units: 200
     - Community Type: "gated_community"
     - Contact Person Name: "Ravi Kumar"
     - Contact Person Phone: "9876543210"
     - Contact Person Email: "ravi@example.com"
     - Association Name: "Prestige RWA"
  4. Click "Save" / "Create"
- **Expected Result**: Community is created in the database. User is redirected to the community detail page or the communities list. Success toast/notification appears. An audit log entry is created with action "create" and entity_type "community".
- **Priority**: Critical
- **Status**: Not Tested

### TC-COMM-004: Create Community -- Validation (Empty Name)

- **Precondition**: PM user is on the create community form
- **Steps**:
  1. Navigate to `/pm/communities/new/edit`
  2. Leave the "Name" field empty
  3. Fill in other fields
  4. Attempt to save
- **Expected Result**: Error message displays: "Community name is required". The community is not created.
- **Priority**: High
- **Status**: Not Tested

### TC-COMM-005: Create Community -- Minimum Fields

- **Precondition**: PM user is on the create community form
- **Steps**:
  1. Navigate to `/pm/communities/new/edit`
  2. Enter only the name: "Test Community"
  3. Leave all other fields blank
  4. Click "Save"
- **Expected Result**: Community is created successfully with only the name field populated. All optional fields are stored as null. City and state default to empty strings.
- **Priority**: Medium
- **Status**: Not Tested

### TC-COMM-006: Edit Community

- **Precondition**: A community exists in the database
- **Steps**:
  1. Navigate to `/pm/communities/{id}/edit`
  2. Modify the community name and address
  3. Click "Save"
- **Expected Result**: Community record is updated in the database. User is redirected. Both `/pm/communities` and `/pm/communities/{id}` paths are revalidated. An audit log entry is created with action "update".
- **Priority**: Critical
- **Status**: Not Tested

### TC-COMM-007: View Community Detail

- **Precondition**: A community exists with associated flats and owners
- **Steps**:
  1. Navigate to `/pm/communities/{id}`
  2. Observe the detail page
- **Expected Result**: Community detail page shows all community fields, associated flats count, and linked information. Back navigation works correctly.
- **Priority**: High
- **Status**: Not Tested

### TC-COMM-008: Delete (Soft-Delete) Community

- **Precondition**: A community exists with no critical dependencies
- **Steps**:
  1. Navigate to `/pm/communities/{id}`
  2. Click "Delete" or "Deactivate"
  3. Confirm the action in the confirmation dialog
- **Expected Result**: Community is soft-deleted (`is_active` set to `false`). Community no longer appears in the active list. An audit log entry is created with action "delete". Associated data is preserved.
- **Priority**: High
- **Status**: Not Tested

### TC-COMM-009: Community Not Found

- **Precondition**: No community exists with the given ID
- **Steps**:
  1. Navigate to `/pm/communities/nonexistent-uuid`
- **Expected Result**: A 404 "Not Found" page is displayed.
- **Priority**: Medium
- **Status**: Not Tested

---

## Module 4: Owners CRUD

### TC-OWN-001: List Owners

- **Precondition**: Multiple active owners exist
- **Steps**:
  1. Navigate to `/pm/owners`
  2. Observe the owner listing
- **Expected Result**: All owners with `is_active = true` are displayed. Each entry shows name, email, phone, brokerage method, number of linked flats, and GST status.
- **Priority**: Critical
- **Status**: Not Tested

### TC-OWN-002: Search Owners

- **Precondition**: Multiple owners exist
- **Steps**:
  1. Navigate to `/pm/owners`
  2. Enter a partial owner name or email in the search field
- **Expected Result**: Owner list filters to show matching owners. Search is case-insensitive and matches against name and email.
- **Priority**: High
- **Status**: Not Tested

### TC-OWN-003: Create Owner -- Days of Rent Brokerage

- **Precondition**: PM user is authenticated
- **Steps**:
  1. Navigate to `/pm/owners/new/edit`
  2. Fill in required fields:
     - Name: "Rajesh Sharma"
     - Email: "rajesh@example.com"
  3. Set brokerage calculation method to "days_of_rent"
  4. Set brokerage days to 10
  5. Fill optional fields (phone, PAN, address)
  6. Click "Save"
- **Expected Result**: Owner is created with `brokerage_calc_method = "days_of_rent"` and `brokerage_days = 10`. Audit log entry created.
- **Priority**: Critical
- **Status**: Not Tested

### TC-OWN-004: Create Owner -- Percentage Brokerage

- **Precondition**: PM user is authenticated
- **Steps**:
  1. Navigate to `/pm/owners/new/edit`
  2. Fill in name and email
  3. Set brokerage calculation method to "percentage"
  4. Set brokerage percentage to 5.0
  5. Click "Save"
- **Expected Result**: Owner is created with `brokerage_calc_method = "percentage"` and `brokerage_percentage = 5.0`.
- **Priority**: High
- **Status**: Not Tested

### TC-OWN-005: Create Owner -- Fixed Amount Brokerage

- **Precondition**: PM user is authenticated
- **Steps**:
  1. Navigate to `/pm/owners/new/edit`
  2. Fill in name and email
  3. Set brokerage calculation method to "fixed_amount"
  4. Set fixed brokerage amount to 15000
  5. Click "Save"
- **Expected Result**: Owner is created with `brokerage_calc_method = "fixed_amount"` and `brokerage_fixed_amount = 15000`.
- **Priority**: High
- **Status**: Not Tested

### TC-OWN-006: Create Owner -- Validation (Missing Required Fields)

- **Precondition**: PM user is on the create owner form
- **Steps**:
  1. Navigate to `/pm/owners/new/edit`
  2. Leave name empty, enter email
  3. Click "Save"
  4. Then clear email, enter name
  5. Click "Save"
- **Expected Result**: First attempt shows "Owner name is required". Second attempt shows "Owner email is required". Neither creates an owner.
- **Priority**: High
- **Status**: Not Tested

### TC-OWN-007: Create Owner -- GST Configuration

- **Precondition**: PM user is on the create owner form
- **Steps**:
  1. Navigate to `/pm/owners/new/edit`
  2. Fill in name and email
  3. Toggle `gst_applicable` to true
  4. Enter a GST number: "37AABCT1332L1ZM"
  5. Click "Save"
- **Expected Result**: Owner is created with `gst_applicable = true` and `gst_number` stored. GST status is reflected in the owner detail view.
- **Priority**: High
- **Status**: Not Tested

### TC-OWN-008: Create Owner -- Family Group

- **Precondition**: PM user is on the create owner form
- **Steps**:
  1. Navigate to `/pm/owners/new/edit`
  2. Fill in name and email
  3. Enter family group name: "Sharma Family"
  4. Click "Save"
- **Expected Result**: Owner is created with `family_group_name = "Sharma Family"`. This owner can later be grouped with other owners sharing the same family group name for family brokerage invoicing.
- **Priority**: Medium
- **Status**: Not Tested

### TC-OWN-009: Edit Owner

- **Precondition**: An owner exists in the database
- **Steps**:
  1. Navigate to `/pm/owners/{id}/edit`
  2. Modify the owner's phone number and brokerage method
  3. Click "Save"
- **Expected Result**: Owner record is updated. Audit log entry created with action "update" and changed fields recorded. Paths are revalidated.
- **Priority**: Critical
- **Status**: Not Tested

### TC-OWN-010: View Owner Detail with Linked Flats

- **Precondition**: An owner exists with at least 2 flats linked
- **Steps**:
  1. Navigate to `/pm/owners/{id}`
  2. Observe the detail page
- **Expected Result**: Owner detail page shows all personal information, brokerage configuration, GST details, communication preference, family group, and a list of all flats linked to this owner with their statuses.
- **Priority**: High
- **Status**: Not Tested

### TC-OWN-011: Generate Onboarding Token

- **Precondition**: An owner exists who has not yet been onboarded
- **Steps**:
  1. Navigate to `/pm/owners/{id}`
  2. Click "Generate Onboarding Link"
- **Expected Result**: A unique 48-character hex token is generated and stored in `owners.onboarding_token`. `onboarding_completed` is set to `false`. The link can be shared with the owner. Audit log entry created.
- **Priority**: Medium
- **Status**: Not Tested

### TC-OWN-012: Owner Communication Preference

- **Precondition**: PM user is on the owner form
- **Steps**:
  1. Navigate to `/pm/owners/new/edit`
  2. Fill in required fields
  3. Select communication preference: "both" (WhatsApp and Email)
  4. Click "Save"
- **Expected Result**: Owner is created with `communication_pref = "both"`. Valid options are: "whatsapp", "email", "both".
- **Priority**: Low
- **Status**: Not Tested

---

## Module 5: Flats CRUD

### TC-FLAT-001: List Flats -- Default View

- **Precondition**: Multiple flats exist with different statuses
- **Steps**:
  1. Navigate to `/pm/flats`
  2. Observe the flat listing
- **Expected Result**: All active flats are displayed ordered by flat_number. Each flat shows: flat number, BHK type, community name, owner name, tenant name (if occupied), inclusive rent, and status badge (occupied=green, vacant=red, under_maintenance=yellow).
- **Priority**: Critical
- **Status**: Not Tested

### TC-FLAT-002: View Mode Toggle -- List/Card/Grid

- **Precondition**: Flats exist in the database
- **Steps**:
  1. Navigate to `/pm/flats`
  2. Click the "List" view toggle
  3. Observe the layout
  4. Click the "Card" view toggle
  5. Observe the layout
  6. Click the "Grid" view toggle
  7. Observe the layout
- **Expected Result**: List view shows tabular data. Card view shows individual cards with more detail. Grid view shows a compact grid. All views display the same data. The selected view mode is visually indicated.
- **Priority**: High
- **Status**: Not Tested

### TC-FLAT-003: Filter Flats by Community

- **Precondition**: Flats exist across multiple communities
- **Steps**:
  1. Navigate to `/pm/flats`
  2. Select a community from the community filter dropdown
- **Expected Result**: Only flats belonging to the selected community are displayed. The filter dropdown lists all active communities.
- **Priority**: High
- **Status**: Not Tested

### TC-FLAT-004: Filter Flats by Owner

- **Precondition**: Flats exist across multiple owners
- **Steps**:
  1. Navigate to `/pm/flats`
  2. Select an owner from the owner filter dropdown
- **Expected Result**: Only flats owned by the selected owner are displayed.
- **Priority**: High
- **Status**: Not Tested

### TC-FLAT-005: Filter Flats by Status

- **Precondition**: Flats exist with different statuses
- **Steps**:
  1. Navigate to `/pm/flats`
  2. Select "Occupied" from the status filter
  3. Then select "Vacant"
  4. Then select "Under Maintenance"
- **Expected Result**: Each selection filters the list to show only flats with the matching status.
- **Priority**: High
- **Status**: Not Tested

### TC-FLAT-006: Search Flats

- **Precondition**: Multiple flats exist
- **Steps**:
  1. Navigate to `/pm/flats`
  2. Enter a flat number (e.g., "3154") in the search field
- **Expected Result**: The list filters to show only flats whose flat number matches the search query.
- **Priority**: High
- **Status**: Not Tested

### TC-FLAT-007: Create Flat -- All Fields

- **Precondition**: At least one community and one owner exist
- **Steps**:
  1. Navigate to `/pm/flats/new/edit`
  2. Select a community from the dropdown
  3. Select an owner from the dropdown
  4. Enter flat number: "3154"
  5. Select BHK type: "2BHK"
  6. Enter carpet area: 1100 sft
  7. Enter base rent: 22000
  8. Enter maintenance amount: 3500
  9. Set rent due day: 5
  10. Set status: "vacant"
  11. Enter notes: "Corner flat, good ventilation"
  12. Click "Save"
- **Expected Result**: Flat is created. `inclusive_rent` is auto-calculated as `22000 + 3500 = 25500`. For flat number "3154": `tower = 3`, `floor = 15`, `unit = 4` (auto-derived from 4-digit number). Audit log entry created.
- **Priority**: Critical
- **Status**: Not Tested

### TC-FLAT-008: Create Flat -- Validation

- **Precondition**: PM user is on the create flat form
- **Steps**:
  1. Navigate to `/pm/flats/new/edit`
  2. Leave flat number empty and try to save
  3. Leave community unselected and try to save
  4. Leave owner unselected and try to save
  5. Leave BHK type unselected and try to save
  6. Enter base rent as 0 and try to save
- **Expected Result**: Each missing required field produces the corresponding error: "Flat number is required", "Community is required", "Owner is required", "BHK type is required", "Base rent is required and must be positive".
- **Priority**: High
- **Status**: Not Tested

### TC-FLAT-009: Create Flat -- Auto Maintenance Calculation

- **Precondition**: PM user is on the create flat form
- **Steps**:
  1. Navigate to `/pm/flats/new/edit`
  2. Fill in required fields
  3. Enter base rent: 20000
  4. Enter maintenance: 4000
  5. Observe the inclusive rent field
- **Expected Result**: The inclusive rent is automatically calculated as `base_rent + maintenance_amount = 24000` and displayed/stored correctly.
- **Priority**: High
- **Status**: Not Tested

### TC-FLAT-010: Create Flat -- Tower/Floor/Unit Derivation

- **Precondition**: PM user is creating a flat
- **Steps**:
  1. Create a flat with flat number "2083"
  2. Create a flat with flat number "A101" (non-4-digit)
- **Expected Result**: For "2083": tower=2, floor=8, unit=3. For "A101": tower=null, floor=null, unit=null (non-4-digit flat numbers do not trigger derivation).
- **Priority**: Medium
- **Status**: Not Tested

### TC-FLAT-011: Edit Flat -- Status Change

- **Precondition**: A flat exists with status "vacant"
- **Steps**:
  1. Navigate to `/pm/flats/{id}/edit`
  2. Change status to "under_maintenance"
  3. Click "Save"
- **Expected Result**: Flat status is updated to "under_maintenance". Audit log records the change. Both `/pm/flats` and `/pm/flats/{id}` paths are revalidated.
- **Priority**: High
- **Status**: Not Tested

### TC-FLAT-012: Edit Flat -- Rent Update Recalculation

- **Precondition**: A flat exists with base_rent=20000 and maintenance_amount=3000
- **Steps**:
  1. Navigate to `/pm/flats/{id}/edit`
  2. Change base rent to 22000
  3. Click "Save"
- **Expected Result**: `inclusive_rent` is recalculated as `22000 + 3000 = 25000`. The system fetches current values for any field not provided and recalculates correctly.
- **Priority**: High
- **Status**: Not Tested

### TC-FLAT-013: View Flat Detail -- Overview Tab

- **Precondition**: A flat exists with an active tenant
- **Steps**:
  1. Navigate to `/pm/flats/{id}`
  2. View the overview section
- **Expected Result**: Detail page shows flat number, community, owner, BHK type, carpet area, base rent, maintenance, inclusive rent, status, rent due day, and notes. Tenant section shows active tenant name and type.
- **Priority**: Critical
- **Status**: Not Tested

### TC-FLAT-014: View Flat Detail -- Rent History Tab

- **Precondition**: Rent payments have been recorded for this flat
- **Steps**:
  1. Navigate to `/pm/flats/{id}`
  2. Switch to the "Rent" or rent history tab
- **Expected Result**: Rent payment history is displayed chronologically with payment month, amount, date, method, status (full/partial), and proof files if uploaded.
- **Priority**: High
- **Status**: Not Tested

### TC-FLAT-015: View Flat Detail -- Expenses Tab

- **Precondition**: Expenses have been recorded for this flat
- **Steps**:
  1. Navigate to `/pm/flats/{id}`
  2. Switch to the "Expenses" tab
- **Expected Result**: Expense history shows date, category, description, amount, vendor, who reported, who paid, and recovery status.
- **Priority**: High
- **Status**: Not Tested

### TC-FLAT-016: View Flat Detail -- Maintenance Tab

- **Precondition**: Community maintenance records exist for this flat
- **Steps**:
  1. Navigate to `/pm/flats/{id}`
  2. Switch to the "Maintenance" tab
- **Expected Result**: Maintenance records show quarter, period, amount, previous pending, total, paid status, and paid date.
- **Priority**: Medium
- **Status**: Not Tested

### TC-FLAT-017: View Flat Detail -- Documents Tab

- **Precondition**: Documents have been generated for this flat's owner
- **Steps**:
  1. Navigate to `/pm/flats/{id}`
  2. Switch to the "Documents" tab
- **Expected Result**: Related documents are listed with type, document number, period, total, and current status.
- **Priority**: Medium
- **Status**: Not Tested

### TC-FLAT-018: Back Navigation from Flat Edit

- **Precondition**: User is on the flat edit page
- **Steps**:
  1. Navigate to `/pm/flats/{id}/edit`
  2. Click the back button/arrow
- **Expected Result**: User is navigated back to `/pm/flats/{id}` (the flat detail page), not to the flats list.
- **Priority**: Medium
- **Status**: Not Tested

---

## Module 6: Tenant Management

### TC-TEN-001: Add Tenant -- Family Type

- **Precondition**: A vacant flat exists
- **Steps**:
  1. Navigate to `/pm/flats/{id}/tenant/edit`
  2. Enter tenant name: "Suresh Kumar"
  3. Enter phone: "9876543210"
  4. Enter email: "suresh@example.com"
  5. Select tenant type: "family"
  6. Select occupation type: "employee"
  7. Enter company name: "Infosys"
  8. Enter family member count: 4
  9. Set lease start date: 2026-03-01
  10. Set lease end date: 2027-02-28
  11. Enter security deposit: 150000
  12. Enter monthly rent: 22000
  13. Enter monthly maintenance: 3500
  14. Click "Save"
- **Expected Result**: Tenant is created with `tenant_type = "family"`. Flat status is automatically updated to "occupied". `monthly_inclusive_rent` is calculated as 25500. Audit log entry created. Owner is notified ("New Tenant Added" notification).
- **Priority**: Critical
- **Status**: Not Tested

### TC-TEN-002: Add Tenant -- Bachelor Type with Occupants

- **Precondition**: A vacant flat exists
- **Steps**:
  1. Navigate to `/pm/flats/{id}/tenant/edit`
  2. Enter tenant name: "Vikram Patel"
  3. Select tenant type: "bachelor"
  4. Enter bachelor occupant count: 3
  5. Select bachelor gender: "male"
  6. Enter gender breakdown: "3 males"
  7. Enter monthly rent: 18000
  8. Click "Save"
- **Expected Result**: Tenant is created with `tenant_type = "bachelor"`, `bachelor_occupant_count = 3`, `bachelor_gender = "male"`. Flat status changes to "occupied".
- **Priority**: High
- **Status**: Not Tested

### TC-TEN-003: Add Past Tenant

- **Precondition**: A flat exists (any status)
- **Steps**:
  1. Navigate to `/pm/flats/{id}/tenant/edit?past=true`
  2. Enter tenant name: "Previous Tenant"
  3. Fill in other required fields
  4. Set `is_active` to false
  5. Enter exit date: 2025-12-31
  6. Enter exit reason: "Relocated to another city"
  7. Click "Save"
- **Expected Result**: Tenant is created with `is_active = false`, `exit_date`, and `exit_reason` populated. The flat status is NOT changed to "occupied" (since the tenant is inactive).
- **Priority**: High
- **Status**: Not Tested

### TC-TEN-004: Add Tenant -- Validation

- **Precondition**: PM user is on the add tenant form
- **Steps**:
  1. Navigate to `/pm/flats/{id}/tenant/edit`
  2. Leave name empty and try to save
- **Expected Result**: Error message: "Tenant name is required". Tenant is not created.
- **Priority**: High
- **Status**: Not Tested

### TC-TEN-005: Edit Tenant

- **Precondition**: An active tenant exists
- **Steps**:
  1. Navigate to `/pm/flats/{id}/tenant/edit`
  2. Modify the tenant's phone number and occupation type
  3. Click "Save"
- **Expected Result**: Tenant record is updated in the database. Audit log entry created with changes recorded.
- **Priority**: High
- **Status**: Not Tested

### TC-TEN-006: View Tenant Detail

- **Precondition**: An active tenant exists for the flat
- **Steps**:
  1. Navigate to `/pm/flats/{id}/tenant`
- **Expected Result**: Tenant detail page shows all tenant information including name, phone, email, type, occupation, family/bachelor details, lease dates, deposit, rent, and any uploaded documents (Aadhaar, PAN, etc.). Agreement URL is displayed if available.
- **Priority**: High
- **Status**: Not Tested

### TC-TEN-007: View Tenant -- No Active Tenant

- **Precondition**: A flat exists with no active tenant
- **Steps**:
  1. Navigate to `/pm/flats/{id}/tenant`
- **Expected Result**: Empty state is displayed with the "No Active Tenant" message, a UserPlus icon, and two action buttons: "Add Tenant" and "Add Past Tenant".
- **Priority**: Medium
- **Status**: Not Tested

### TC-TEN-008: Tenant Exit Wizard -- Step 1 (Exit Details)

- **Precondition**: A flat has an active tenant
- **Steps**:
  1. Navigate to `/pm/flats/{id}/tenant/exit`
  2. Verify tenant info is displayed (name, phone, lease dates, deposit, rent)
  3. Enter exit date: 2026-03-15
  4. Enter exit reason: "Lease ended, relocating"
- **Expected Result**: Exit details form shows pre-populated tenant and flat information. Exit date and reason fields are editable.
- **Priority**: Critical
- **Status**: Not Tested

### TC-TEN-009: Tenant Exit Wizard -- Completion

- **Precondition**: Exit details have been entered in the tenant exit form
- **Steps**:
  1. Complete all steps of the tenant exit wizard
  2. Confirm the exit
- **Expected Result**: Tenant's `is_active` is set to `false`, `exit_date` and `exit_reason` are stored. Flat status is automatically changed to "vacant". Audit log entry created. Owner receives "Tenant Exited" notification.
- **Priority**: Critical
- **Status**: Not Tested

### TC-TEN-010: Past Tenants Section

- **Precondition**: A flat has both an active and past tenants
- **Steps**:
  1. Navigate to `/pm/flats/{id}/tenant`
  2. Scroll to the "Past Tenants" section
- **Expected Result**: Past tenants are listed below the active tenant section, ordered by exit date (most recent first). Each past tenant shows name, type, lease dates, exit date, and exit reason.
- **Priority**: Medium
- **Status**: Not Tested

### TC-TEN-011: Tenant Document Uploads

- **Precondition**: A tenant exists and the upload form is available
- **Steps**:
  1. Navigate to tenant edit form
  2. Upload an Aadhaar document (image/PDF)
  3. Upload a PAN document
  4. Upload employment proof
  5. Upload rental agreement
- **Expected Result**: Each document is uploaded to Supabase Storage under the path `tenant/{tenant_id}/{category}/`. File IDs are stored in the respective columns (`aadhaar_file_id`, `pan_file_id`, `employment_proof_file_id`, `agreement_file_id`).
- **Priority**: High
- **Status**: Not Tested

### TC-TEN-012: Tenant Exit -- Flat Not Found

- **Precondition**: An invalid flat ID is used
- **Steps**:
  1. Navigate to `/pm/flats/nonexistent-uuid/tenant/exit`
- **Expected Result**: A 404 Not Found page is displayed (via `notFound()` function).
- **Priority**: Medium
- **Status**: Not Tested

### TC-TEN-013: Tenant Type -- Bachelor Gender Options

- **Precondition**: User is creating a bachelor-type tenant
- **Steps**:
  1. Navigate to tenant creation form
  2. Select tenant type: "bachelor"
  3. Observe available gender options
- **Expected Result**: Gender dropdown shows options: "male", "female", "mixed". The selected gender is stored in `bachelor_gender`. Additional breakdown can be entered in `bachelor_gender_breakdown`.
- **Priority**: Low
- **Status**: Not Tested

---

## Module 7: Rent Payments

### TC-RENT-001: Record Full Payment

- **Precondition**: An occupied flat with an active tenant exists
- **Steps**:
  1. Navigate to `/pm/rent/record`
  2. Select a flat from the dropdown (shows flat number, community, owner, tenant)
  3. Tenant is auto-populated from the selected flat
  4. Enter amount: 25500 (matches inclusive rent)
  5. Select payment date: 2026-03-01
  6. Select payment month: 2026-03
  7. Select payment method: "bank_transfer"
  8. Set payment status: "full"
  9. Enter payment reference: "UTR12345"
  10. Click "Save"
- **Expected Result**: Rent payment record is created. Amount, date, month, method, status, and reference are stored. Audit log entry created. Owner receives "Rent Payment Recorded" notification.
- **Priority**: Critical
- **Status**: Not Tested

### TC-RENT-002: Record Partial Payment

- **Precondition**: An occupied flat with inclusive_rent = 25500 exists
- **Steps**:
  1. Navigate to `/pm/rent/record`
  2. Select a flat
  3. Enter amount: 15000 (less than inclusive rent)
  4. Set payment status: "partial"
  5. Enter remarks: "Remaining 10500 promised by 10th"
  6. Click "Save"
- **Expected Result**: Rent payment record is created with `payment_status = "partial"` and the partial amount. Remarks are stored.
- **Priority**: High
- **Status**: Not Tested

### TC-RENT-003: Record Payment -- Validation

- **Precondition**: User is on the rent recording form
- **Steps**:
  1. Navigate to `/pm/rent/record`
  2. Try to save without selecting a flat
  3. Try to save without selecting a tenant
  4. Try to save with amount = 0
  5. Try to save with a negative amount
- **Expected Result**: Error messages: "Flat is required", "Tenant is required", "Amount must be positive" respectively. No payment is recorded.
- **Priority**: High
- **Status**: Not Tested

### TC-RENT-004: Upload Payment Proof

- **Precondition**: User is recording a rent payment
- **Steps**:
  1. Navigate to `/pm/rent/record`
  2. Fill in required payment fields
  3. Upload a payment proof image (screenshot of bank transaction)
  4. Click "Save"
- **Expected Result**: The file is uploaded to Supabase Storage. The `proof_file_ids` array in the rent payment record contains the storage path. The proof image is viewable from the payment detail.
- **Priority**: High
- **Status**: Not Tested

### TC-RENT-005: Rent Payments List View

- **Precondition**: Multiple rent payments have been recorded
- **Steps**:
  1. Navigate to `/pm/rent`
  2. Observe the payments list
- **Expected Result**: Up to 100 most recent rent payments are displayed, ordered by payment date descending. Each entry shows flat number, community, owner, tenant name, amount, date, month, method, and status. Filter options for owner, month, and method are available.
- **Priority**: Critical
- **Status**: Not Tested

### TC-RENT-006: Filter Rent Payments by Owner

- **Precondition**: Payments exist for multiple owners
- **Steps**:
  1. Navigate to `/pm/rent`
  2. Select an owner from the filter dropdown
- **Expected Result**: Only payments for flats owned by the selected owner are displayed.
- **Priority**: High
- **Status**: Not Tested

### TC-RENT-007: Filter Rent Payments by Month

- **Precondition**: Payments exist across multiple months
- **Steps**:
  1. Navigate to `/pm/rent`
  2. Select a specific month from the filter
- **Expected Result**: Only payments for the selected month are displayed.
- **Priority**: High
- **Status**: Not Tested

### TC-RENT-008: Monthly Rent Grid View

- **Precondition**: Flats and payments exist
- **Steps**:
  1. Navigate to `/pm/rent/monthly`
  2. Observe the grid
- **Expected Result**: A grid shows all active flats as rows and the last 6 months as columns. Each cell shows payment status: "paid" (green), "partial" (yellow), "unpaid" (red/empty). Flat details (flat number, tenant name, inclusive rent, owner) are shown in row headers. Owner filter dropdown is available.
- **Priority**: Critical
- **Status**: Not Tested

### TC-RENT-009: Monthly Rent Grid -- Owner Filter

- **Precondition**: Flats belonging to different owners exist
- **Steps**:
  1. Navigate to `/pm/rent/monthly`
  2. Select a specific owner from the filter
- **Expected Result**: Grid is filtered to show only flats belonging to the selected owner.
- **Priority**: High
- **Status**: Not Tested

### TC-RENT-010: Bulk Rent Recording

- **Precondition**: Multiple occupied flats with active tenants exist
- **Steps**:
  1. Navigate to `/pm/rent/bulk`
  2. Observe the bulk entry interface
  3. Enter payment details for multiple flats simultaneously
  4. Submit the bulk entries
- **Expected Result**: Multiple rent payments are recorded in a single operation. Each payment is individually validated and recorded with proper audit logging.
- **Priority**: High
- **Status**: Not Tested

### TC-RENT-011: Rent Base/Maintenance Portion Split

- **Precondition**: A flat has distinct base_rent and maintenance_amount
- **Steps**:
  1. Navigate to `/pm/rent/record`
  2. Select a flat with base_rent=20000, maintenance=3500
  3. Verify the base rent portion and maintenance portion fields are pre-filled or available
  4. Record a payment
- **Expected Result**: Payment record stores `base_rent_portion` and `maintenance_portion` separately if provided. The sum should equal the total amount.
- **Priority**: Medium
- **Status**: Not Tested

---

## Module 8: Expenses

### TC-EXP-001: Record Expense -- All Fields

- **Precondition**: A flat exists with an active tenant
- **Steps**:
  1. Navigate to `/pm/expenses/record`
  2. Select a flat from the dropdown
  3. Select category: "electrical"
  4. Enter description: "Replaced ceiling fan in master bedroom"
  5. Enter amount: 2500
  6. Enter expense date: 2026-02-28
  7. Enter vendor name: "Kumar Electricals"
  8. Enter vendor phone: "9876543210"
  9. Select reported by: "tenant"
  10. Select paid by: "pm"
  11. Enter remarks: "Fan was non-functional since last month"
  12. Click "Save"
- **Expected Result**: Expense is recorded with all fields. `recovery_status` is set to "pending" since paid by PM. Audit log entry created. Owner receives "Expense Recorded" notification with category and amount.
- **Priority**: Critical
- **Status**: Not Tested

### TC-EXP-002: Record Expense -- Validation

- **Precondition**: User is on the expense recording form
- **Steps**:
  1. Navigate to `/pm/expenses/record`
  2. Try to save without selecting a flat
  3. Try to save without selecting a category
  4. Try to save with empty description
  5. Try to save with amount = 0
- **Expected Result**: Error messages: "Flat is required", "Category is required", "Description is required", "Amount must be positive". No expense is recorded.
- **Priority**: High
- **Status**: Not Tested

### TC-EXP-003: Upload Expense Receipt

- **Precondition**: User is recording an expense
- **Steps**:
  1. Navigate to `/pm/expenses/record`
  2. Fill in required expense fields
  3. Upload a receipt image
  4. Click "Save"
- **Expected Result**: Receipt image is uploaded to Supabase Storage. The `receipt_file_ids` array contains the storage path. The receipt is viewable from the expense detail.
- **Priority**: High
- **Status**: Not Tested

### TC-EXP-004: Expenses List View

- **Precondition**: Multiple expenses have been recorded
- **Steps**:
  1. Navigate to `/pm/expenses`
  2. Observe the expenses list
- **Expected Result**: Expenses are displayed with flat number, category label (human-readable), description, amount, date, vendor, reported by, paid by, recovery status. Filters for category and status are available.
- **Priority**: Critical
- **Status**: Not Tested

### TC-EXP-005: Expense Categories

- **Precondition**: User is recording an expense
- **Steps**:
  1. Navigate to `/pm/expenses/record`
  2. Open the category dropdown
- **Expected Result**: Categories available: Deep Cleaning, Paint, Electrical, Plumbing, AC Servicing, Geyser Repair, Carpentry, Pest Control, Chimney, Other.
- **Priority**: Medium
- **Status**: Not Tested

### TC-EXP-006: Expense Reporter Options

- **Precondition**: User is recording an expense
- **Steps**:
  1. Navigate to `/pm/expenses/record`
  2. Check the "reported by" options
- **Expected Result**: Options available: "tenant", "pm_inspection", "owner".
- **Priority**: Low
- **Status**: Not Tested

### TC-EXP-007: Expense Payer Options

- **Precondition**: User is recording an expense
- **Steps**:
  1. Navigate to `/pm/expenses/record`
  2. Check the "paid by" options
- **Expected Result**: Options available: "pm", "owner", "tenant". When "pm" is selected, the recovery status is set to "pending" for later billing.
- **Priority**: Medium
- **Status**: Not Tested

### TC-EXP-008: Filter Expenses by Category

- **Precondition**: Expenses exist across multiple categories
- **Steps**:
  1. Navigate to `/pm/expenses`
  2. Select "Electrical" from the category filter
- **Expected Result**: Only expenses with `category = "electrical"` are displayed.
- **Priority**: Medium
- **Status**: Not Tested

---

## Module 9: Community Maintenance

### TC-MAINT-001: Record Maintenance -- Success

- **Precondition**: Active flats exist
- **Steps**:
  1. Navigate to `/pm/maintenance`
  2. Click "Record Maintenance"
  3. Select a flat from the dropdown
  4. Enter quarter: "Q1-2026"
  5. Enter period start: 2026-01-01
  6. Enter period end: 2026-03-31
  7. Enter maintenance amount: 12000
  8. Enter previous pending: 3000
  9. Set is_paid: true
  10. Enter paid date: 2026-03-01
  11. Click "Save"
- **Expected Result**: Maintenance record created. `total_amount` is auto-calculated as `12000 + 3000 = 15000`. Audit log entry created with flat number in description.
- **Priority**: Critical
- **Status**: Not Tested

### TC-MAINT-002: Record Maintenance -- Validation

- **Precondition**: User is on the maintenance recording form
- **Steps**:
  1. Try to save without selecting a flat
  2. Try to save with empty quarter
  3. Try to save without period dates
  4. Try to save with maintenance amount = 0
- **Expected Result**: Corresponding error messages: "Flat is required", "Quarter is required", "Period start/end date is required", "Maintenance amount must be positive".
- **Priority**: High
- **Status**: Not Tested

### TC-MAINT-003: Maintenance List View

- **Precondition**: Maintenance records exist
- **Steps**:
  1. Navigate to `/pm/maintenance`
  2. Observe the listing
- **Expected Result**: Up to 100 records displayed, ordered by period_start descending. Each shows flat number, BHK, carpet area, owner name, quarter, maintenance amount, previous pending, total, and paid status.
- **Priority**: High
- **Status**: Not Tested

### TC-MAINT-004: Maintenance -- Unpaid Record

- **Precondition**: Recording maintenance for a flat
- **Steps**:
  1. Record maintenance with `is_paid = false`
  2. Leave paid_date and paid_by empty
- **Expected Result**: Record is created with `is_paid = false`, `paid_date = null`, `paid_by = null`. The total amount remains calculated correctly.
- **Priority**: Medium
- **Status**: Not Tested

---

## Module 10: Document Generation

### TC-DOC-001: Document Type Selection Page

- **Precondition**: PM user is authenticated
- **Steps**:
  1. Navigate to `/pm/documents/generate`
  2. Observe the available document types
- **Expected Result**: Five document types are displayed as cards: Brokerage Invoice, Flat Expenses Bill, Maintenance Tracker, Rental Credit Report, and Flat Annexure. Each card shows title, description, and an icon.
- **Priority**: High
- **Status**: Not Tested

### TC-DOC-002: Generate Brokerage Invoice -- Single Owner

- **Precondition**: An owner has at least one flat with an active tenant who has a lease start date
- **Steps**:
  1. Navigate to `/pm/documents/generate/brokerage`
  2. Select an owner from the dropdown
  3. Verify eligible tenants (those with active lease) are shown
  4. Select tenants for brokerage calculation
  5. Verify brokerage amount is calculated based on owner's brokerage_calc_method
  6. Review the generated invoice preview with line items
  7. Click "Generate"
- **Expected Result**: Document is created with `document_type = "brokerage_invoice"`, `status = "draft"`. Line items contain tenant name, flat number, tower, BHK, carpet area, inclusive rent, lease start, and calculated brokerage. Subtotal, TDS (if applicable), GST (if owner has GST), and grand total are computed. Bank details from MMZ settings are included.
- **Priority**: Critical
- **Status**: Not Tested

### TC-DOC-003: Generate Brokerage Invoice -- Family Group

- **Precondition**: Multiple owners share the same `family_group_name`
- **Steps**:
  1. Navigate to `/pm/documents/generate/brokerage`
  2. Select an owner who belongs to a family group
  3. Observe that tenants from all family members' flats are included
  4. Generate the invoice
- **Expected Result**: The brokerage invoice includes line items for tenants across all flats owned by family group members. The `family_group_id` is populated in the document record.
- **Priority**: High
- **Status**: Not Tested

### TC-DOC-004: Generate Brokerage Invoice -- Days of Rent Calculation

- **Precondition**: Owner has `brokerage_calc_method = "days_of_rent"` and `brokerage_days = 10`
- **Steps**:
  1. Generate a brokerage invoice for this owner
  2. Verify the calculation
- **Expected Result**: Brokerage amount per flat = `(inclusive_rent / 30) * brokerage_days`. For a flat with inclusive_rent=25500 and 10 days: `(25500/30)*10 = 8500`.
- **Priority**: High
- **Status**: Not Tested

### TC-DOC-005: Generate Brokerage Invoice -- Percentage Calculation

- **Precondition**: Owner has `brokerage_calc_method = "percentage"` and `brokerage_percentage = 5`
- **Steps**:
  1. Generate a brokerage invoice for this owner
  2. Verify the calculation
- **Expected Result**: Brokerage amount per flat = `inclusive_rent * (brokerage_percentage / 100)`. For inclusive_rent=25500 and 5%: `25500 * 0.05 = 1275`.
- **Priority**: High
- **Status**: Not Tested

### TC-DOC-006: Generate Flat Expenses Bill

- **Precondition**: PM-paid expenses with `recovery_status = "pending"` exist for at least one owner's flats
- **Steps**:
  1. Navigate to `/pm/documents/generate/expenses`
  2. Select an owner
  3. Verify expenses grouped by flat are shown
  4. Review line items with category, description, amount, date, vendor
  5. Generate the bill
- **Expected Result**: Document is created with `document_type = "expenses_bill"`. Only PM-paid expenses with pending recovery are included. Line items are grouped by flat with category breakdown.
- **Priority**: Critical
- **Status**: Not Tested

### TC-DOC-007: Generate Maintenance Tracker

- **Precondition**: Community maintenance records exist for flats
- **Steps**:
  1. Navigate to `/pm/documents/generate/maintenance`
  2. Select an owner
  3. Review quarterly maintenance charges
  4. Generate the tracker
- **Expected Result**: Document is created with `document_type = "maintenance_tracker"`. Shows quarterly summary per flat with pending amounts.
- **Priority**: High
- **Status**: Not Tested

### TC-DOC-008: Generate Rental Credit Report

- **Precondition**: Rent payments exist for a flat with an active tenant
- **Steps**:
  1. Navigate to `/pm/documents/generate/rental-credit`
  2. Select an owner and flat
  3. Review the month-by-month rent payment breakdown
  4. Generate the report
- **Expected Result**: Document is created with `document_type = "rental_credit_report"`. Shows full rent payment history during the tenancy period with monthly breakdown.
- **Priority**: High
- **Status**: Not Tested

### TC-DOC-009: Generate Flat Annexure

- **Precondition**: A flat with an active tenant exists
- **Steps**:
  1. Navigate to `/pm/documents/generate/annexure`
  2. Select a flat
  3. Fill in room-by-room inventory checklist
  4. Set condition for each item (good/fair/poor/damaged/missing/new)
  5. Calculate deposit deductions if applicable
  6. Generate the annexure
- **Expected Result**: Document is created with `document_type = "flat_annexure"`. Contains room-by-room inventory with conditions and deposit deduction calculation.
- **Priority**: High
- **Status**: Not Tested

### TC-DOC-010: Document List View

- **Precondition**: Multiple documents exist in various statuses
- **Steps**:
  1. Navigate to `/pm/documents`
  2. Observe the listing
- **Expected Result**: Documents are listed with document number, type, owner name, period, grand total, status badge, created date. Filter/search options are available.
- **Priority**: Critical
- **Status**: Not Tested

### TC-DOC-011: View Document Detail

- **Precondition**: A document exists
- **Steps**:
  1. Navigate to `/pm/documents/{id}`
  2. Review the document detail
- **Expected Result**: Full document detail is displayed including all line items, financial calculations, bank details, status history, and action buttons appropriate to the current status.
- **Priority**: High
- **Status**: Not Tested

### TC-DOC-012: Document Creation -- Validation

- **Precondition**: User is generating a document
- **Steps**:
  1. Try to generate a document without selecting an owner
  2. Try to generate a document without selecting a type
- **Expected Result**: Error messages: "Owner is required", "Document type is required".
- **Priority**: High
- **Status**: Not Tested

---

## Module 11: Approvals Workflow

### TC-APPR-001: Submit Document for Approval

- **Precondition**: A document exists with `status = "draft"`
- **Steps**:
  1. Navigate to `/pm/documents/{id}`
  2. Click "Submit for Approval"
- **Expected Result**: Document status changes to "pending_approval". `submitted_by` and `submitted_at` fields are populated. Audit log entry created. The document appears in `/pm/approvals`.
- **Priority**: Critical
- **Status**: Not Tested

### TC-APPR-002: Approve Document

- **Precondition**: A document exists with `status = "pending_approval"`, approver is a different PM user than the submitter
- **Steps**:
  1. Navigate to `/pm/approvals`
  2. Find the pending document in the list
  3. Click "Approve"
- **Expected Result**: Document status changes to "approved". `approved_by` and `approved_at` fields are populated. Audit log entry created. The submitter receives a "Document Approved" notification.
- **Priority**: Critical
- **Status**: Not Tested

### TC-APPR-003: Reject Document

- **Precondition**: A document exists with `status = "pending_approval"`
- **Steps**:
  1. Navigate to `/pm/approvals`
  2. Find the pending document
  3. Click "Reject"
  4. Enter rejection reason: "Incorrect brokerage calculation for flat 3154"
  5. Confirm rejection
- **Expected Result**: Document status changes to "rejected". `rejection_reason`, `rejected_by`, and `rejected_at` fields are populated. Audit log entry created. The submitter receives a "Document Rejected" notification with the reason.
- **Priority**: Critical
- **Status**: Not Tested

### TC-APPR-004: Publish Document

- **Precondition**: A document exists with `status = "approved"`
- **Steps**:
  1. Navigate to `/pm/documents/{id}`
  2. Click "Publish"
- **Expected Result**: Document status changes to "published". `published_by` and `published_at` fields are populated. Audit log entry created. The owner receives a "New Document Published" notification. Document becomes visible in the owner portal statements page.
- **Priority**: Critical
- **Status**: Not Tested

### TC-APPR-005: Record Document Payment

- **Precondition**: A document exists with `status = "published"` and `payment_received = false`
- **Steps**:
  1. Navigate to `/pm/documents/{id}`
  2. Click "Record Payment"
  3. Enter amount equal to grand total
  4. Enter payment date
  5. Select payment method
  6. Enter reference number
  7. Confirm
- **Expected Result**: `payment_received` is set to `true`. `payment_received_amount`, `payment_received_date`, `payment_received_method`, and `payment_received_reference` are stored. Audit log entry created.
- **Priority**: High
- **Status**: Not Tested

### TC-APPR-006: Record Document Payment -- Already Paid

- **Precondition**: A document exists with `payment_received = true`
- **Steps**:
  1. Navigate to `/pm/documents/{id}`
  2. Attempt to record payment again
- **Expected Result**: Error message: "Payment has already been recorded for this document".
- **Priority**: Medium
- **Status**: Not Tested

### TC-APPR-007: Record Document Payment -- Not Published

- **Precondition**: A document exists with `status = "draft"` or `status = "approved"`
- **Steps**:
  1. Attempt to record payment for a non-published document
- **Expected Result**: Error message: "Payment can only be recorded for published documents".
- **Priority**: Medium
- **Status**: Not Tested

### TC-APPR-008: Approvals Page -- Empty State

- **Precondition**: No documents with `status = "pending_approval"` exist
- **Steps**:
  1. Navigate to `/pm/approvals`
- **Expected Result**: Page displays an empty state indicating no pending approvals.
- **Priority**: Low
- **Status**: Not Tested

### TC-APPR-009: Approvals Page -- List Display

- **Precondition**: Multiple documents with `status = "pending_approval"` exist
- **Steps**:
  1. Navigate to `/pm/approvals`
- **Expected Result**: All pending documents are listed with: document number, document type, owner name, period label, grand total, submitted by (PM user name), and submitted date. Ordered by submitted_at descending.
- **Priority**: High
- **Status**: Not Tested

---

## Module 12: Analytics

### TC-ANAL-001: Occupancy Distribution Chart

- **Precondition**: Flats exist with different statuses
- **Steps**:
  1. Navigate to `/pm/analytics`
  2. Observe the occupancy chart
- **Expected Result**: A pie/donut chart shows the distribution of flats by status: Occupied (green), Vacant (red), Under Maintenance (yellow). Segments with zero count are hidden.
- **Priority**: High
- **Status**: Not Tested

### TC-ANAL-002: Monthly Rent Collection Chart

- **Precondition**: Rent payments exist for the last 6 months
- **Steps**:
  1. Navigate to `/pm/analytics`
  2. Observe the monthly rent collection chart
- **Expected Result**: A bar/line chart shows 6 months of data. Each month displays "Collected" (actual payments) and "Expected" (sum of inclusive rents for occupied flats). Month labels use short format (e.g., "Jan", "Feb").
- **Priority**: High
- **Status**: Not Tested

### TC-ANAL-003: Top Repair Categories Chart

- **Precondition**: Expenses exist across multiple categories
- **Steps**:
  1. Navigate to `/pm/analytics`
  2. Observe the repair categories breakdown
- **Expected Result**: Top 8 expense categories displayed sorted by total amount descending. Shows category name, count of expenses, and total amount.
- **Priority**: Medium
- **Status**: Not Tested

### TC-ANAL-004: Rent Punctuality Report

- **Precondition**: Occupied flats with rent payment history exist
- **Steps**:
  1. Navigate to `/pm/analytics`
  2. Observe the rent punctuality section
- **Expected Result**: For each occupied flat, shows: flat number, tenant name, on-time count, late count, unpaid count, and a punctuality score (percentage). A payment is "on time" if paid within 3 days of the due day.
- **Priority**: High
- **Status**: Not Tested

### TC-ANAL-005: Vacancy Revenue Impact

- **Precondition**: Vacant flats exist
- **Steps**:
  1. Navigate to `/pm/analytics`
  2. Observe the vacancy impact section
- **Expected Result**: For each of the last 6 months, shows: month label, number of vacant flats in that month, and estimated revenue lost (sum of inclusive_rent for flats that were vacant in that period).
- **Priority**: Medium
- **Status**: Not Tested

---

## Module 13: Reports

### TC-RPT-001: Annual Report -- Default View

- **Precondition**: Data exists for the current year
- **Steps**:
  1. Navigate to `/pm/reports`
  2. Observe the report page
- **Expected Result**: Page shows current year report by default. Summary section displays: total rent collected, total expenses, total brokerage earned, total TDS deducted, and net revenue. Per-owner breakdown table is displayed below.
- **Priority**: Critical
- **Status**: Not Tested

### TC-RPT-002: Report -- Year Filter

- **Precondition**: Data exists for multiple years
- **Steps**:
  1. Navigate to `/pm/reports`
  2. Change the year to a previous year (e.g., 2025)
- **Expected Result**: All data is recalculated for the selected year. URL updates with `?year=2025`.
- **Priority**: High
- **Status**: Not Tested

### TC-RPT-003: Report -- Owner Filter

- **Precondition**: Data exists for multiple owners
- **Steps**:
  1. Navigate to `/pm/reports`
  2. Select a specific owner from the filter
- **Expected Result**: Report is filtered to show only data for the selected owner. URL updates with `?owner={id}`. Summary recalculates for the filtered data.
- **Priority**: High
- **Status**: Not Tested

### TC-RPT-004: Report -- Per-Owner Breakdown

- **Precondition**: An owner has flats with rent payments and expenses
- **Steps**:
  1. Navigate to `/pm/reports`
  2. Expand an owner's row
- **Expected Result**: Owner row shows: owner name, flat count, rent collected, expense total, brokerage earned, TDS deducted, and net amount. Expanded view shows per-flat breakdown with flat number, rent collected, and expense total.
- **Priority**: High
- **Status**: Not Tested

---

## Module 14: Audit Log

### TC-AUDIT-001: View Audit Log

- **Precondition**: Various operations have been performed (creates, updates, deletes)
- **Steps**:
  1. Navigate to `/pm/audit`
  2. Observe the log entries
- **Expected Result**: Up to 100 most recent audit entries displayed, ordered by created_at descending. Each entry shows: action type, entity type, actor name, actor role, description, and timestamp.
- **Priority**: High
- **Status**: Not Tested

### TC-AUDIT-002: Audit Log Entry -- Create Action

- **Precondition**: A new entity was just created (e.g., a flat)
- **Steps**:
  1. Create a flat
  2. Navigate to `/pm/audit`
  3. Find the corresponding entry
- **Expected Result**: Audit entry exists with `action = "create"`, `entity_type = "flat"`, and a description like 'Created flat "3154" in community {id}'.
- **Priority**: Medium
- **Status**: Not Tested

### TC-AUDIT-003: Audit Log Entry -- Update Action

- **Precondition**: An entity was just updated
- **Steps**:
  1. Update an owner's details
  2. Navigate to `/pm/audit`
  3. Find the corresponding entry
- **Expected Result**: Audit entry exists with `action = "update"`, `entity_type = "owner"`, description includes the owner name, and changes are recorded.
- **Priority**: Medium
- **Status**: Not Tested

---

## Module 15: Settings

### TC-SET-001: View Team Members

- **Precondition**: Team members exist in `pm_users`
- **Steps**:
  1. Navigate to `/pm/settings`
  2. View the Team section
- **Expected Result**: All team members are listed with: name, email, role, active status, and joined date.
- **Priority**: High
- **Status**: Not Tested

### TC-SET-002: Add Team Member

- **Precondition**: PM user has admin/super_admin role
- **Steps**:
  1. Navigate to `/pm/settings`
  2. Click "Add Team Member"
  3. Enter email: "newmember@mmz.com"
  4. Enter name: "New PM User"
  5. Select role: "manager"
  6. Click "Save"
- **Expected Result**: New row is inserted in `pm_users` table with the provided email, name, and role. `auth_user_id` is null (will be linked on first login). Audit log entry created.
- **Priority**: Critical
- **Status**: Not Tested

### TC-SET-003: Add Team Member -- Validation

- **Precondition**: User is adding a team member
- **Steps**:
  1. Try to add with empty email
  2. Try to add with empty name
  3. Try to add without selecting a role
- **Expected Result**: Error messages: "Email is required", "Name is required", "Role is required".
- **Priority**: High
- **Status**: Not Tested

### TC-SET-004: Update Team Member Role

- **Precondition**: A team member exists
- **Steps**:
  1. Navigate to `/pm/settings`
  2. Change a team member's role from "manager" to "admin"
  3. Save
- **Expected Result**: The team member's role is updated in `pm_users`. Audit log entry created.
- **Priority**: High
- **Status**: Not Tested

### TC-SET-005: Deactivate Team Member

- **Precondition**: A team member exists with `is_active = true`
- **Steps**:
  1. Navigate to `/pm/settings`
  2. Click deactivate on a team member
  3. Confirm
- **Expected Result**: Team member's `is_active` is set to `false`. They can no longer sign in. Audit log entry created.
- **Priority**: High
- **Status**: Not Tested

### TC-SET-006: Update Bank Details

- **Precondition**: PM user is on settings page
- **Steps**:
  1. Navigate to `/pm/settings`
  2. Go to Bank Details section
  3. Enter bank name: "HDFC Bank"
  4. Enter account holder name: "Mark My Zone LLP"
  5. Enter account number: "50200012345678"
  6. Enter IFSC code: "HDFC0001234"
  7. Enter branch name: "Gachibowli"
  8. Enter UPI ID: "mmz@hdfcbank"
  9. Click "Save"
- **Expected Result**: Bank details are saved in `mmz_settings`. These details are used in document generation. Audit log entry created. If no row exists, it is upserted with id=1.
- **Priority**: Critical
- **Status**: Not Tested

### TC-SET-007: Update Invoice Settings

- **Precondition**: PM user is on settings page
- **Steps**:
  1. Navigate to `/pm/settings`
  2. Go to Invoice Settings section
  3. Enter company name: "Mark My Zone LLP"
  4. Enter company address: "123 Tech Park, Gachibowli"
  5. Enter GSTIN: "37AABCT1332L1ZM"
  6. Enter PAN: "AABCT1332L"
  7. Enter invoice prefix: "MMZ"
  8. Enter footer note: "Thank you for your business"
  9. Click "Save"
- **Expected Result**: Invoice settings are saved in `mmz_settings`. These are used for document header/footer generation. Audit log entry created.
- **Priority**: High
- **Status**: Not Tested

### TC-SET-008: Update Notification Preferences

- **Precondition**: PM user is authenticated
- **Steps**:
  1. Navigate to `/pm/settings`
  2. Go to Notification Preferences section
  3. Toggle in-app notifications for "rent_overdue" to enabled
  4. Toggle email notifications for "lease_expiring" to disabled
  5. Save preferences
- **Expected Result**: Notification preferences are upserted in `notification_preferences` table with `user_type = "pm"`, the PM user's ID, and the updated enabled/disabled states. Preferences are unique per `(user_type, user_id, notification_type)`.
- **Priority**: Medium
- **Status**: Not Tested

### TC-SET-009: Settings -- Available Roles

- **Precondition**: User is on the add/edit team member form
- **Steps**:
  1. View the role dropdown options
- **Expected Result**: Available roles are: "super_admin", "admin", "manager".
- **Priority**: Low
- **Status**: Not Tested

---

## Module 16: Notifications

### TC-NOTIF-001: PM Notifications Page

- **Precondition**: Notifications exist for the PM
- **Steps**:
  1. Navigate to `/pm/notifications`
- **Expected Result**: Up to 50 most recent notifications displayed, ordered by created_at descending. Each notification shows: type icon, title, message, timestamp, and read/unread status.
- **Priority**: High
- **Status**: Not Tested

### TC-NOTIF-002: Mark Notification as Read

- **Precondition**: An unread notification exists
- **Steps**:
  1. Navigate to `/pm/notifications`
  2. Click on an unread notification
- **Expected Result**: The notification's `is_read` field is set to `true`. Visual styling changes from unread (bold/highlighted) to read.
- **Priority**: Medium
- **Status**: Not Tested

### TC-NOTIF-003: Notification Types

- **Precondition**: Various actions have triggered notifications
- **Steps**:
  1. Record a rent payment (triggers "expense_recorded" notification to owner, note: uses same type)
  2. Add a tenant (triggers "tenant_added" notification to owner)
  3. Exit a tenant (triggers "tenant_exited" notification to owner)
  4. Publish a document (triggers "statement_published" notification to owner)
  5. Approve a document (triggers "document_approved" notification to submitter)
  6. Reject a document (triggers "document_rejected" notification to submitter)
- **Expected Result**: Each action creates the corresponding notification with correct recipient_type, recipient_id, notification_type, title, and message.
- **Priority**: High
- **Status**: Not Tested

### TC-NOTIF-004: Owner Notifications Page

- **Precondition**: An owner is authenticated and has notifications
- **Steps**:
  1. Sign in as an owner
  2. Navigate to `/owner/notifications`
- **Expected Result**: Owner sees only notifications where `recipient_type = "owner"` and `recipient_id` matches their owner ID.
- **Priority**: High
- **Status**: Not Tested

---

## Module 17: Global Search

### TC-SRCH-001: Open Global Search with Keyboard Shortcut

- **Precondition**: PM user is on any PM portal page
- **Steps**:
  1. Press Cmd+K (macOS) or Ctrl+K (Windows)
- **Expected Result**: The command dialog/search palette opens with focus on the search input field.
- **Priority**: High
- **Status**: Not Tested

### TC-SRCH-002: Close Global Search

- **Precondition**: Global search dialog is open
- **Steps**:
  1. Press Escape
  2. Alternatively, press Cmd+K / Ctrl+K again
- **Expected Result**: The search dialog closes.
- **Priority**: Medium
- **Status**: Not Tested

### TC-SRCH-003: Search Flats by Number

- **Precondition**: Global search is open; flats exist in the database
- **Steps**:
  1. Open global search
  2. Type "3154"
- **Expected Result**: The "Flats" group shows matching flats (e.g., "Flat 3154 -- Suresh Kumar (Family)"). Selecting the result navigates to `/pm/flats/{id}`.
- **Priority**: High
- **Status**: Not Tested

### TC-SRCH-004: Search Owners by Name

- **Precondition**: Global search is open; owners exist
- **Steps**:
  1. Open global search
  2. Type "Rajesh"
- **Expected Result**: The "Owners" group shows matching owners with flat count (e.g., "Rajesh Sharma (3 flats)"). Selecting navigates to `/pm/owners/{id}`.
- **Priority**: High
- **Status**: Not Tested

### TC-SRCH-005: Quick Actions

- **Precondition**: Global search is open
- **Steps**:
  1. Open global search
  2. Observe the "Quick Actions" group
- **Expected Result**: Quick actions listed: "Record Rent Payment", "Record Expense", "Add New Flat", "Generate Brokerage Invoice", "Generate Expenses Bill", "Generate Maintenance Tracker". Selecting each navigates to the correct route.
- **Priority**: High
- **Status**: Not Tested

### TC-SRCH-006: Navigation Items

- **Precondition**: Global search is open
- **Steps**:
  1. Open global search
  2. Type "settings"
- **Expected Result**: The "Navigation" group shows "Settings" option. Selecting navigates to `/pm/settings`. All 11 navigation items are available: Dashboard, Communities, Owners, Flats, Rent Payments, Monthly Rent Grid, Expenses, Maintenance, Documents, Analytics, Settings.
- **Priority**: Medium
- **Status**: Not Tested

### TC-SRCH-007: Search -- Empty Results

- **Precondition**: Global search is open
- **Steps**:
  1. Open global search
  2. Type "zzzznonexistent"
- **Expected Result**: "No results found." message is displayed.
- **Priority**: Low
- **Status**: Not Tested

### TC-SRCH-008: Search -- Loading State

- **Precondition**: Global search is opened for the first time
- **Steps**:
  1. Open global search
  2. Observe the Flats and Owners groups while data loads
- **Expected Result**: "Loading flats..." and "Loading owners..." messages appear while data is being fetched. Once loaded, the actual items appear.
- **Priority**: Low
- **Status**: Not Tested

---

## Module 18: Data Import

### TC-IMP-001: Import Page Access

- **Precondition**: PM user is authenticated
- **Steps**:
  1. Navigate to `/pm/import`
  2. Observe the import options
- **Expected Result**: Import page is displayed with options for CSV data import. Communities and owners dropdowns are pre-populated for flat imports.
- **Priority**: Medium
- **Status**: Not Tested

### TC-IMP-002: CSV Import -- Success

- **Precondition**: A valid CSV file is prepared with correct column headers
- **Steps**:
  1. Navigate to `/pm/import`
  2. Upload a properly formatted CSV file
  3. Map columns if necessary
  4. Click "Import"
- **Expected Result**: Data is imported successfully. New records are created in the database. Import results summary is shown (rows imported, rows skipped, errors).
- **Priority**: High
- **Status**: Not Tested

### TC-IMP-003: CSV Import -- Invalid Format

- **Precondition**: User has a malformed CSV file
- **Steps**:
  1. Navigate to `/pm/import`
  2. Upload a CSV with incorrect column headers or data types
- **Expected Result**: Validation errors are displayed. No data is imported into the database.
- **Priority**: Medium
- **Status**: Not Tested

### TC-IMP-004: Data Migration Page

- **Precondition**: PM user is authenticated
- **Steps**:
  1. Navigate to `/pm/import/migrate`
- **Expected Result**: Migration page is accessible and shows data migration options for transferring data from external systems.
- **Priority**: Low
- **Status**: Not Tested

---

## Module 19: Owner Portal

### TC-OWNP-001: Owner Dashboard

- **Precondition**: Owner is authenticated with at least 2 flats
- **Steps**:
  1. Sign in as an owner
  2. Navigate to `/owner`
- **Expected Result**: Dashboard shows: owner's name greeting, list of their flats with status/tenant/rent info, current month rent status (paid/unpaid) for each flat, recent activity (payments and expenses), and unread notification count.
- **Priority**: Critical
- **Status**: Not Tested

### TC-OWNP-002: Owner Flats List

- **Precondition**: Owner is authenticated with multiple flats
- **Steps**:
  1. Navigate to `/owner/flats`
- **Expected Result**: All flats owned by the user are listed with flat number, community, BHK, carpet area, status, tenant info, and rent amount.
- **Priority**: High
- **Status**: Not Tested

### TC-OWNP-003: Owner Flat Detail with Rent History

- **Precondition**: Owner has a flat with rent payment history
- **Steps**:
  1. Navigate to `/owner/flats/{id}`
  2. Verify the flat belongs to the authenticated owner
- **Expected Result**: Flat detail shows: flat number, community, BHK, sqft, status, tenant info (name, type, lease dates), rent breakdown (base/maintenance/inclusive), rent history (up to 24 months with amount, date, status, method), and expense history. Payment proof URLs are displayed as viewable links/images.
- **Priority**: Critical
- **Status**: Not Tested

### TC-OWNP-004: Owner Flat Detail -- Unauthorized Access

- **Precondition**: Owner is authenticated; a flat exists that belongs to a different owner
- **Steps**:
  1. Navigate to `/owner/flats/{other-owner-flat-id}`
- **Expected Result**: 404 Not Found page is displayed (the query filters by `owner_id` so the flat is not returned).
- **Priority**: High
- **Status**: Not Tested

### TC-OWNP-005: Owner Statements -- Published Only

- **Precondition**: Documents exist for the owner in various statuses (draft, approved, published)
- **Steps**:
  1. Navigate to `/owner/statements`
- **Expected Result**: Only documents with `status = "published"` are displayed. Draft, pending, approved, and rejected documents are NOT visible. Statements show: document type, document number, period, grand total, and published date.
- **Priority**: Critical
- **Status**: Not Tested

### TC-OWNP-006: Owner Statement Detail

- **Precondition**: A published document exists for the owner
- **Steps**:
  1. Navigate to `/owner/statements/{id}`
- **Expected Result**: Full statement detail is displayed including all line items, financial calculations, and bank details for payment.
- **Priority**: High
- **Status**: Not Tested

### TC-OWNP-007: Owner Profile Page

- **Precondition**: Owner is authenticated
- **Steps**:
  1. Navigate to `/owner/profile`
- **Expected Result**: Profile page shows owner's name, email, phone, and other personal details. Editing capability may be available.
- **Priority**: Medium
- **Status**: Not Tested

### TC-OWNP-008: Owner Welcome / Onboarding

- **Precondition**: Owner's `onboarding_completed = false`
- **Steps**:
  1. Sign in as the owner
  2. Verify redirect to `/owner/welcome`
  3. Review pre-populated owner information (name, email, phone)
  4. View assigned flats
  5. Complete the onboarding flow
- **Expected Result**: Welcome page shows owner's info and their assigned flats with community names, BHK types, statuses, and tenant names. After completing onboarding, `onboarding_completed` is set to `true` and the owner is redirected to `/owner`.
- **Priority**: High
- **Status**: Not Tested

### TC-OWNP-009: Owner Dashboard -- Activity Feed

- **Precondition**: Owner has flats with recent rent payments and expenses
- **Steps**:
  1. Navigate to `/owner`
  2. Scroll to the activity feed
- **Expected Result**: Recent activity shows up to 10 items combining rent payments and expenses, sorted by date descending. Each entry shows a descriptive message with flat number and amount in INR format.
- **Priority**: Medium
- **Status**: Not Tested

### TC-OWNP-010: Owner Payment Proof Viewing

- **Precondition**: Rent payments with proof files exist
- **Steps**:
  1. Navigate to `/owner/flats/{id}`
  2. Find a rent payment with proof_file_ids
  3. Click to view the proof
- **Expected Result**: Payment proof images/files are accessible via public URLs from Supabase Storage. Images are displayed inline or in a modal. Both new upload paths and legacy full URLs are handled correctly.
- **Priority**: High
- **Status**: Not Tested

---

## Module 20: Cross-Cutting Concerns

### TC-CC-001: Dark Mode Toggle

- **Precondition**: User is on any page of the application
- **Steps**:
  1. Find the theme toggle button (sun/moon icon in the header)
  2. Click to switch from light to dark mode
  3. Verify the entire page theme changes
  4. Click again to switch back to light mode
- **Expected Result**: All pages consistently apply the selected theme. Background colors change from light (`bg-bg-page`) to dark. Text colors invert appropriately. The theme preference persists across page navigations and is available on the login page as well.
- **Priority**: High
- **Status**: Not Tested

### TC-CC-002: Dark Mode -- Logo Swap

- **Precondition**: User is on the login page
- **Steps**:
  1. Navigate to `/login`
  2. Observe the logo in light mode
  3. Toggle to dark mode
  4. Observe the logo
- **Expected Result**: Light mode shows `logo-dark.svg` (dark logo on light background). Dark mode shows `logo-light.svg` (light logo on dark background). Swap uses CSS classes `dark:hidden` and `hidden dark:block`.
- **Priority**: Low
- **Status**: Not Tested

### TC-CC-003: Responsive Design -- Desktop

- **Precondition**: User is on a desktop browser (viewport >= 1024px)
- **Steps**:
  1. Navigate through all major pages: Dashboard, Flats, Owners, Rent, Expenses, Documents, Settings
  2. Verify layout at 1920x1080 resolution
- **Expected Result**: Full sidebar navigation is visible. Content area uses multi-column grids (e.g., 6 KPI cards in a row, 4 flat cards per row). Tables display all columns. No horizontal scrolling required.
- **Priority**: High
- **Status**: Not Tested

### TC-CC-004: Responsive Design -- Tablet

- **Precondition**: User is on a tablet browser (viewport ~768px)
- **Steps**:
  1. Resize browser to 768x1024
  2. Navigate through major pages
- **Expected Result**: Layout adjusts: sidebar may collapse to icon-only or hamburger menu. Grid columns reduce (e.g., 3 KPI cards per row, 2 flat cards per row). Content remains readable without horizontal scrolling.
- **Priority**: High
- **Status**: Not Tested

### TC-CC-005: Responsive Design -- Mobile

- **Precondition**: User is on a mobile browser (viewport ~375px)
- **Steps**:
  1. Resize browser to 375x812
  2. Navigate through major pages
- **Expected Result**: Single-column layout. Sidebar is replaced by a hamburger menu or bottom navigation. KPI cards stack vertically. Tables may switch to card-based layouts. All content is accessible without horizontal scrolling.
- **Priority**: High
- **Status**: Not Tested

### TC-CC-006: File Upload with Compression

- **Precondition**: User is on a form with file upload capability
- **Steps**:
  1. Navigate to rent recording or expense recording form
  2. Upload a large image file (> 5MB)
  3. Observe the upload process
- **Expected Result**: Image is compressed before upload to reduce file size. The file is uploaded to Supabase Storage under the path `{entity_type}/{entity_id}/{category}/{timestamp}-{filename}`. A file reference record is created in `file_references` table with path, URL, name, size, and type.
- **Priority**: Medium
- **Status**: Not Tested

### TC-CC-007: File Upload -- Server Action

- **Precondition**: User is uploading a file
- **Steps**:
  1. Upload a file via any form that supports file uploads
  2. Check the storage bucket
- **Expected Result**: File is stored at the path `{entityType}/{entityId}/{category}/{timestamp}-{filename}` in the `mmz-files` bucket. Public URL is generated and returned. File reference metadata is stored in the database.
- **Priority**: Medium
- **Status**: Not Tested

### TC-CC-008: Navigation -- Sidebar Links

- **Precondition**: PM user is on any page
- **Steps**:
  1. Click each sidebar navigation link: Dashboard, Communities, Owners, Flats, Rent Payments, Expenses, Maintenance, Documents, Analytics, Approvals, Audit Log, Settings, Reports
- **Expected Result**: Each link navigates to the correct page without errors. The active page is highlighted in the sidebar.
- **Priority**: High
- **Status**: Not Tested

### TC-CC-009: Navigation -- Back Buttons

- **Precondition**: User is on a detail or edit page
- **Steps**:
  1. Navigate to `/pm/flats/{id}/edit`
  2. Click the back arrow button
  3. Navigate to `/pm/rent/record`
  4. Click the back arrow (should go to `/pm/rent`)
- **Expected Result**: Back buttons navigate to the expected parent page using `backHref` props on PageHeader components. Browser back button also works as expected.
- **Priority**: Medium
- **Status**: Not Tested

### TC-CC-010: Error Handling -- Network Error

- **Precondition**: User is on any form
- **Steps**:
  1. Disconnect from the network (simulate offline)
  2. Attempt to save a form
- **Expected Result**: An error message is displayed indicating the operation failed. The application does not crash. Data is not corrupted.
- **Priority**: High
- **Status**: Not Tested

### TC-CC-011: Error Handling -- Validation Errors Display

- **Precondition**: User is on any form with validation
- **Steps**:
  1. Submit a form with invalid data
  2. Observe error handling
- **Expected Result**: Server action returns `{ success: false, error: "..." }`. The error message is displayed to the user near the form or as a toast notification. The form does not reset (user can correct and retry).
- **Priority**: High
- **Status**: Not Tested

### TC-CC-012: Empty States

- **Precondition**: Database is empty or specific entities do not exist
- **Steps**:
  1. View `/pm/communities` with no communities
  2. View `/pm/flats` with no flats
  3. View `/pm/rent` with no payments
  4. View `/pm/expenses` with no expenses
  5. View `/pm/notifications` with no notifications
- **Expected Result**: Each page shows an appropriate empty state message and/or icon with a call-to-action button to create the first item.
- **Priority**: Medium
- **Status**: Not Tested

### TC-CC-013: Loading States -- Skeleton Loaders

- **Precondition**: User navigates to any page
- **Steps**:
  1. Navigate to `/pm/flats` (throttle network to slow 3G)
  2. Observe the page during loading
- **Expected Result**: Animated pulse skeleton loaders are displayed matching the layout of the final content (cards, tables, etc.) via React Suspense fallbacks. Content replaces skeletons when data loads.
- **Priority**: Medium
- **Status**: Not Tested

### TC-CC-014: Accessibility -- Keyboard Navigation

- **Precondition**: User is on any page
- **Steps**:
  1. Use Tab key to navigate through interactive elements
  2. Use Enter/Space to activate buttons and links
  3. Use arrow keys in dropdown menus
  4. Use Escape to close modals and dialogs
- **Expected Result**: All interactive elements are focusable and operable via keyboard. Focus indicators are visible. Tab order follows a logical sequence. Dialogs trap focus correctly.
- **Priority**: Medium
- **Status**: Not Tested

### TC-CC-015: Accessibility -- Form Labels

- **Precondition**: User is on any form page
- **Steps**:
  1. Inspect form inputs for associated labels
  2. Check that labels use `htmlFor` matching input `id`
- **Expected Result**: All form inputs have associated `<Label>` components with `htmlFor` attributes matching the input `id` (e.g., `htmlFor="email"` and `id="email"`).
- **Priority**: Medium
- **Status**: Not Tested

### TC-CC-016: Accessibility -- Screen Reader Compatibility

- **Precondition**: Screen reader software is available (VoiceOver on macOS)
- **Steps**:
  1. Enable VoiceOver
  2. Navigate through the login page
  3. Navigate through the PM dashboard
  4. Interact with forms
- **Expected Result**: Screen reader announces page headings, form labels, button text, status badges, and navigation items correctly. Images have alt text.
- **Priority**: Medium
- **Status**: Not Tested

### TC-CC-017: Currency Formatting

- **Precondition**: Pages with monetary values are rendered
- **Steps**:
  1. Navigate to the PM dashboard
  2. Observe rent amounts on flat detail pages
  3. Observe amounts in document previews
- **Expected Result**: All monetary values are displayed in INR format using the Rupee symbol and Indian number formatting (e.g., "12,50,000" for 1.25 million).
- **Priority**: Medium
- **Status**: Not Tested

### TC-CC-018: Date Formatting

- **Precondition**: Pages with dates are rendered
- **Steps**:
  1. Observe dates across the application (dashboard, payments, documents)
- **Expected Result**: Dates are consistently formatted in Indian locale (`en-IN`) using patterns like "1 Mar 2026" (day month year).
- **Priority**: Low
- **Status**: Not Tested

### TC-CC-019: Predictive Maintenance Page

- **Precondition**: PM user is authenticated
- **Steps**:
  1. Navigate to `/pm/predictive-maintenance`
- **Expected Result**: Predictive maintenance page loads and displays relevant information about predicted maintenance needs.
- **Priority**: Low
- **Status**: Not Tested

### TC-CC-020: Root Page Redirect

- **Precondition**: User navigates to the root URL
- **Steps**:
  1. Navigate to `/`
- **Expected Result**: Unauthenticated users are redirected to `/login`. Authenticated users are redirected to their appropriate portal via `/auth/role-check`.
- **Priority**: Medium
- **Status**: Not Tested

### TC-CC-021: Access Denied Page

- **Precondition**: User's email is not found in pm_users or owners
- **Steps**:
  1. Navigate to `/access-denied`
- **Expected Result**: A clear access denied message is displayed with instructions on what to do (contact administrator, or sign out and use a different account).
- **Priority**: Medium
- **Status**: Not Tested

### TC-CC-022: Audit Trail Completeness

- **Precondition**: Perform a full workflow: create community, create owner, create flat, add tenant, record rent, record expense, generate document, approve, publish
- **Steps**:
  1. Execute the full workflow above
  2. Navigate to `/pm/audit`
  3. Verify all actions are logged
- **Expected Result**: Every create, update, and delete operation across all entity types (community, owner, flat, tenant, rent_payment, expense, document, pm_user, settings) has a corresponding audit log entry with accurate actor, action, entity, and description information.
- **Priority**: High
- **Status**: Not Tested

---

## Module 21: Deployment & PWA

### TC-DEPLOY-001: Vercel Auto-Deploy

- **Precondition**: Code pushed to GitHub `main` branch
- **Steps**:
  1. Push a commit to the `main` branch of `deskmarkmyzone-lgtm/MMZ_Quessence_Dashboard`
  2. Open Vercel dashboard
  3. Wait for deployment to complete
- **Expected Result**: New deployment appears in Vercel, site is live at `app.markmyzone.com` with the latest changes.
- **Priority**: Critical
- **Status**: Passed

### TC-DEPLOY-002: Custom Domain Access

- **Precondition**: DNS configured, Vercel domain added
- **Steps**:
  1. Open `https://app.markmyzone.com` in a browser
  2. Verify the login page loads
  3. Verify HTTPS certificate is valid
- **Expected Result**: Site loads with valid SSL, MMZ login page displayed correctly.
- **Priority**: Critical
- **Status**: Passed

### TC-DEPLOY-003: Google OAuth on Production Domain

- **Precondition**: Google Cloud Console and Supabase configured with production URLs
- **Steps**:
  1. Navigate to `https://app.markmyzone.com/login`
  2. Click "Continue with Google"
  3. Complete Google sign-in
- **Expected Result**: User is authenticated and redirected to `/pm` (PM user) or `/owner` (Owner user). No redirect to localhost.
- **Priority**: Critical
- **Status**: Not Tested

### TC-PWA-001: Android PWA Install

- **Precondition**: Site deployed and accessible
- **Steps**:
  1. Open `app.markmyzone.com` in Chrome on Android
  2. Tap the three-dot menu → "Install app" or "Add to home screen"
  3. Confirm installation
  4. Open the app from the home screen
- **Expected Result**: App installs with MMZ logo icon. Opens in standalone mode (no browser URL bar). Login page displays correctly.
- **Priority**: High
- **Status**: Passed

### TC-PWA-002: iOS PWA Install

- **Precondition**: Site deployed and accessible
- **Steps**:
  1. Open `app.markmyzone.com` in Safari on iPhone
  2. Tap the Share button (box with arrow)
  3. Scroll down and tap "Add to Home Screen"
  4. Confirm with "Add"
  5. Open the app from the home screen
- **Expected Result**: App appears on home screen with MMZ icon. Opens in standalone mode. Login page displays correctly.
- **Priority**: High
- **Status**: Passed

### TC-PWA-003: PWA Auto-Update After Deployment

- **Precondition**: PWA installed on device, new code deployed to Vercel
- **Steps**:
  1. Have the PWA installed and open
  2. Push a visible UI change (e.g., text change) to GitHub
  3. Wait for Vercel deployment to complete
  4. Keep the PWA open for up to 5 minutes (or close and reopen)
- **Expected Result**: The PWA auto-detects the new service worker and reloads with the updated UI. No manual cache clear needed.
- **Priority**: High
- **Status**: Not Tested

### TC-PWA-004: PWA Manifest Icons

- **Precondition**: Manifest configured with PNG icons
- **Steps**:
  1. Open Chrome DevTools → Application → Manifest
  2. Verify icons section shows PNG icons (256x256)
  3. Verify `start_url` is `/pm`
  4. Verify `display` is `standalone`
- **Expected Result**: Manifest is valid, all icons resolve correctly, no warnings in DevTools.
- **Priority**: Medium
- **Status**: Passed

### TC-PWA-005: iPhone Sidebar Full Height

- **Precondition**: Using iPhone with Dynamic Island or notch (iPhone 14+)
- **Steps**:
  1. Open the PWA on iPhone
  2. Login to PM portal
  3. Tap the hamburger menu icon
  4. Observe the sidebar height
- **Expected Result**: Sidebar extends full height of the visible screen, properly accounting for the Dynamic Island/notch and bottom home indicator. No gaps at top or bottom.
- **Priority**: High
- **Status**: Passed

### TC-PWA-006: Sidebar Collapsed Logo

- **Precondition**: Logged into PM portal on desktop
- **Steps**:
  1. View the collapsed sidebar (64px width)
  2. Observe the icon at the top
- **Expected Result**: The MMZ logo icon (from apple-touch-icon.png) is displayed instead of a generic "M" letter. Icon is 32x32 pixels with rounded corners.
- **Priority**: Low
- **Status**: Passed

### TC-PWA-007: Favicon Display

- **Precondition**: Site loaded in browser
- **Steps**:
  1. Open `app.markmyzone.com` in any browser
  2. Check the browser tab icon
  3. Check bookmarks if saved
- **Expected Result**: Browser tab shows the MMZ favicon (32x32 PNG). Bookmark shows the same icon.
- **Priority**: Low
- **Status**: Passed

### TC-PWA-008: Service Worker No-Cache Headers

- **Precondition**: Site deployed on Vercel
- **Steps**:
  1. Open Chrome DevTools → Network
  2. Navigate to the site
  3. Find `sw.js` in the network requests
  4. Check the response headers
- **Expected Result**: `Cache-Control: no-cache, no-store, must-revalidate` is present on `sw.js` response headers.
- **Priority**: Medium
- **Status**: Not Tested

### TC-DEPLOY-004: Monthly Rent Grid Back Button

- **Precondition**: Logged in as PM user
- **Steps**:
  1. Navigate to `/pm/rent`
  2. Click "Monthly" to go to the monthly rent grid
  3. Observe the page header
  4. Click the back arrow
- **Expected Result**: Page header shows a back arrow. Clicking it navigates back to `/pm/rent`.
- **Priority**: Low
- **Status**: Passed

---

## Summary Table

| # | Module | Test Cases | Critical | High | Medium | Low |
|---|--------|-----------|----------|------|--------|-----|
| 1 | Authentication | 19 | 6 | 7 | 4 | 2 |
| 2 | PM Dashboard | 8 | 2 | 3 | 2 | 1 |
| 3 | Communities CRUD | 9 | 2 | 4 | 2 | 1 |
| 4 | Owners CRUD | 12 | 2 | 5 | 3 | 2 |
| 5 | Flats CRUD | 18 | 3 | 8 | 5 | 2 |
| 6 | Tenant Management | 13 | 3 | 5 | 3 | 2 |
| 7 | Rent Payments | 11 | 3 | 5 | 2 | 1 |
| 8 | Expenses | 8 | 2 | 3 | 2 | 1 |
| 9 | Community Maintenance | 4 | 1 | 2 | 1 | 0 |
| 10 | Document Generation | 12 | 3 | 7 | 1 | 1 |
| 11 | Approvals Workflow | 9 | 4 | 2 | 2 | 1 |
| 12 | Analytics | 5 | 0 | 3 | 2 | 0 |
| 13 | Reports | 4 | 1 | 3 | 0 | 0 |
| 14 | Audit Log | 3 | 0 | 1 | 2 | 0 |
| 15 | Settings | 9 | 2 | 4 | 2 | 1 |
| 16 | Notifications | 4 | 0 | 3 | 1 | 0 |
| 17 | Global Search | 8 | 0 | 4 | 2 | 2 |
| 18 | Data Import | 4 | 0 | 1 | 2 | 1 |
| 19 | Owner Portal | 10 | 3 | 4 | 2 | 1 |
| 20 | Cross-Cutting Concerns | 22 | 0 | 7 | 11 | 4 |
| 21 | Deployment & PWA | 12 | 3 | 4 | 2 | 3 |
| | **TOTAL** | **198** | **40** | **85** | **45** | **28** |

### Priority Distribution

| Priority | Count | Percentage |
|----------|-------|------------|
| Critical | 40 | 20.2% |
| High | 85 | 42.9% |
| Medium | 45 | 22.7% |
| Low | 28 | 14.1% |
| **Total** | **198** | **100%** |

### Test Execution Status

| Status | Count |
|--------|-------|
| Not Tested | 189 |
| Passed | 9 |
| Failed | 0 |
| Blocked | 0 |

---

## Appendix A: Supabase Tables Referenced

| Table | Used In |
|-------|---------|
| `pm_users` | Auth role check, Team management, Audit logging |
| `owners` | Owner CRUD, Brokerage, Documents, Owner portal |
| `communities` | Community CRUD, Flat association |
| `flats` | Flat CRUD, Rent, Expenses, Maintenance, Documents |
| `tenants` | Tenant CRUD, Rent payments, Documents |
| `rent_payments` | Rent recording, Dashboard KPIs, Analytics |
| `expenses` | Expense recording, Documents, Analytics |
| `community_maintenance` | Maintenance recording, Documents |
| `documents` | Document generation, Approvals, Owner statements |
| `audit_log` | Audit log page, All mutations |
| `notifications` | Alerts, PM/Owner notification pages |
| `notification_preferences` | Settings |
| `mmz_settings` | Bank details, Invoice settings, Document generation |
| `file_references` | File upload tracking |

## Appendix B: Key Routes

| Route | Portal | Description |
|-------|--------|-------------|
| `/login` | Public | Google OAuth login |
| `/login/email` | Public | Email/password sign in and sign up |
| `/auth/callback` | Public | OAuth callback handler |
| `/auth/role-check` | Public | Role-based redirect logic |
| `/access-denied` | Public | Unauthorized access page |
| `/pm` | PM | Dashboard with KPIs and alerts |
| `/pm/communities` | PM | Community list |
| `/pm/communities/new/edit` | PM | Create community |
| `/pm/communities/[id]` | PM | Community detail |
| `/pm/communities/[id]/edit` | PM | Edit community |
| `/pm/owners` | PM | Owners list |
| `/pm/owners/new/edit` | PM | Create owner |
| `/pm/owners/[id]` | PM | Owner detail |
| `/pm/owners/[id]/edit` | PM | Edit owner |
| `/pm/flats` | PM | Flats list with view toggle |
| `/pm/flats/new/edit` | PM | Create flat |
| `/pm/flats/[id]` | PM | Flat detail (tabs) |
| `/pm/flats/[id]/edit` | PM | Edit flat |
| `/pm/flats/[id]/tenant` | PM | Tenant detail |
| `/pm/flats/[id]/tenant/edit` | PM | Add/edit tenant |
| `/pm/flats/[id]/tenant/exit` | PM | Tenant exit wizard |
| `/pm/rent` | PM | Rent payments list |
| `/pm/rent/record` | PM | Record rent payment |
| `/pm/rent/monthly` | PM | Monthly rent grid |
| `/pm/rent/bulk` | PM | Bulk rent recording |
| `/pm/expenses` | PM | Expenses list |
| `/pm/expenses/record` | PM | Record expense |
| `/pm/maintenance` | PM | Community maintenance |
| `/pm/documents` | PM | Documents list |
| `/pm/documents/[id]` | PM | Document detail |
| `/pm/documents/generate` | PM | Document type selection |
| `/pm/documents/generate/brokerage` | PM | Brokerage invoice generator |
| `/pm/documents/generate/expenses` | PM | Expenses bill generator |
| `/pm/documents/generate/maintenance` | PM | Maintenance tracker generator |
| `/pm/documents/generate/rental-credit` | PM | Rental credit report generator |
| `/pm/documents/generate/annexure` | PM | Flat annexure generator |
| `/pm/approvals` | PM | Pending approvals |
| `/pm/analytics` | PM | Analytics and charts |
| `/pm/reports` | PM | Annual financial reports |
| `/pm/audit` | PM | Audit log |
| `/pm/settings` | PM | Team, bank, invoice, notifications |
| `/pm/notifications` | PM | PM notifications |
| `/pm/import` | PM | CSV data import |
| `/pm/import/migrate` | PM | Data migration |
| `/pm/predictive-maintenance` | PM | Predictive maintenance |
| `/owner` | Owner | Owner dashboard |
| `/owner/flats` | Owner | Owner's flats list |
| `/owner/flats/[id]` | Owner | Flat detail with rent history |
| `/owner/statements` | Owner | Published statements |
| `/owner/statements/[id]` | Owner | Statement detail |
| `/owner/profile` | Owner | Profile page |
| `/owner/notifications` | Owner | Owner notifications |
| `/owner/welcome` | Owner | Onboarding flow |
