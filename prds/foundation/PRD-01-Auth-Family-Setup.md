# PRD-01: Auth & Family Setup

**Status:** Not Started
**Dependencies:** None — this is the foundation everything else builds on
**Created:** February 28, 2026
**Last Updated:** February 28, 2026

---

## Overview

This PRD covers everything needed to get people into the MyAIM Family system: mom's account creation, family structure setup, member roles, login flows for all five member types, PIN and visual password authentication, tablet/family device hub, Special Adult invites, and the foundational database tables that every other feature depends on.

MyAIM Family is a mom-first platform. Mom is always the first account created, always the primary administrator, and always has full visibility. Every other family member's access flows from her. This PRD establishes that hierarchy and provides the auth infrastructure that every subsequent PRD builds on.

The tier gating infrastructure (subscription tables, feature access hooks) is also established here — all returning true during beta, but structurally ready for monetization later.

> **Mom experience goal:** Creating an account and landing in her personal space should feel instant and unintimidating. Family setup happens naturally when she's ready — never forced. When she does set up her family, describing them in her own words and seeing the AI parse it correctly should feel like magic.

---

## User Stories

### Account Creation
- As a new user (mom), I want to create an account with email and password so I can start using the app.
- As a new user, after creating my account I want to go straight to my personal space so I can explore without being forced through a setup process.

### Family Setup
- As a mom, when I tap MyFamily for the first time, I want to be guided into adding my family members so the setup happens naturally when I'm ready for it.
- As a mom, if I tap a feature that needs family members, I want a friendly nudge to set up my family rather than seeing a broken or empty screen.
- As a mom, I want to bulk-add my family members using natural language so I don't have to fill out a form for each of my nine kids.
- As a mom, I want the system to suggest dashboard modes based on what I tell it about each person so I don't have to research what "Guided" vs "Independent" means upfront.
- As a mom, I want to create a fun Family Login Name that my family uses to identify us when logging in from a shared device.
- As a mom, I want to be able to change the Family Login Name later if our family identity evolves.

### Login — Mom
- As mom, I want to log in with my email and password and go straight to my Command Center.
- As mom, I want to stay logged in on my device so I don't have to log in every time.
- As mom, I want to reset my password via email if I forget it.

### Login — Dad / Additional Adult
- As dad, I want to receive an invitation from mom and create my own email/password login so I have my own access nested under our family.
- As dad, I want to be able to log in via PIN from a shared family device as a quick alternative.
- As dad, I want to save my personal dashboard to my phone's home screen as an app.

### Login — Independent (Teen)
- As a teen, I want to receive an invitation from mom and create my own login so I can access my personal space.
- As a teen, I want to use PIN login from the family tablet so it's fast and easy.
- As a teen, I want to save my dashboard to my phone as an app.

### Login — Guided / Play (Kids)
- As a young family member, I want to tap my name on the family device and use a simple PIN or picture password to get to my stuff.
- As a parent, I want the option to set "no authentication" for my youngest kids so they can just tap their name.

### Login — Special Adults
- As a mom, I want to invite a grandparent or babysitter so they can access the kids' tasks and schedules when they're helping out.
- As a Special Adult, I want a simple way to get into the system without needing to understand the whole app.

### Tablet / Family Device
- As a family, we want a shared family dashboard on our tablet that stays on all the time like a digital wallpaper — our alternative to Skylight that works on any device.
- As a family member, I want to tap my name on the hub and get to my personal experience quickly.
- As a mom, I want to save different entry points to different devices — the family dashboard on the family tablet, my personal dashboard on my phone.

---

## Screens

### Screen 1: Welcome / Landing

**What the user sees:**
- App name and branding (AIMagicforMoms aesthetic from brandboard)
- Tagline: "Your skills. Your talents. Your interests. Amplified."
- Two buttons: "Create Account" and "Sign In"
- Clean, warm design

**Interactions:**
- Tap "Create Account" → goes to Screen 2
- Tap "Sign In" → goes to Screen 3

---

### Screen 2: Create Account (Mom Only)

**Important:** This screen is exclusively for the primary parent (mom) creating the family's account. All other family members (dad, teens, Special Adults) join through invitation links generated by mom. They never see this screen.

**What the user sees:**
- "Create Your Account" heading
- Fields: Display Name, Email, Password, Confirm Password
- Password strength indicator (weak/medium/strong) that updates as user types
- Password requirements shown below field: at least 8 characters
- "Create Account" button
- "Already have an account? Sign In" link
- Terms of Service checkbox
- "Joining a family? Use your invite link instead." — small helper text for people who landed here by mistake when they should be using an invite

**Interactions:**
- User fills in all fields
- Tap "Create Account":
  - Validates: all fields required, email format valid, password minimum 8 characters, passwords match
  - On validation failure: inline error messages below the relevant field (red text, not toast/popup)
  - On success: creates Supabase auth user, creates family record (mom as primary parent), creates family_member record for mom, redirects to Command Center
  - On duplicate email: "An account with this email already exists. Sign in instead?" with link

**Data created on success:**
- `auth.users` record (Supabase built-in)
- `families` record with mom as `primary_parent_id`
- `family_members` record for mom with `role = 'primary_parent'`, `dashboard_mode = 'adult'`
- `subscription_tiers` record with default free tier
- `feature_access` records with all features enabled (beta mode)

---

### Screen 3: Sign In

**What the user sees:**
- "Welcome Back" heading
- Fields: Email, Password
- "Sign In" button
- "Forgot Password?" link
- "Create an Account" link
- "Family Member Login" link (goes to PIN login flow — Screen 4)

**Interactions:**
- Tap "Sign In" with email/password:
  - On success: loads family context, redirects to Command Center (mom) or appropriate shell dashboard (dad/teen with own auth account)
  - On failure: "Invalid email or password. Please try again." (generic — never reveal whether email exists)
- Tap "Family Member Login" → goes to Screen 4

**Session persistence:**
- Supabase handles session tokens automatically
- Session persists across app closes and device restarts
- User stays logged in until explicit sign out or refresh token expires

---

### Screen 4: Family Member Login (PIN Flow)

**What the user sees:**
- "Family Login" heading
- Step 1: "Enter your Family Login Name" — single text field
- After valid family name entered → Step 2: member selection
- Step 2: Grid/list of family member names (with avatars if set) for this family. Only members with `dashboard_enabled = true` appear.
- After member selected → Step 3: authentication
- Step 3: Depends on member's configured auth method:
  - **PIN:** Four-digit PIN entry (large, mobile-friendly number pad)
  - **Visual password:** Grid of images, tap in the correct order
  - **None:** Skips straight to dashboard (for youngest kids, if mom configured this)

**Interactions:**
- Enter Family Login Name → system validates, shows member list or "Family not found" error
- Tap member name → shows their auth method
- Enter PIN/visual password:
  - On success: load member context, redirect to their shell dashboard
  - On failure: "Incorrect PIN. Please try again, or ask mom to reset it." (child-friendly language)
  - After 5 failed attempts: lock for 5 minutes, suggest asking mom
- "Back" at any step returns to previous step

**Error states:**
- Family not found: "We couldn't find a family with that name. Check the spelling and try again."
- Member not found: shouldn't happen since they select from a list, but handle gracefully
- Forgot PIN: "Ask mom to reset your PIN. She can find it in Settings → Family Members → [Your Name]."

---

### Screen 5: Family Setup — Natural Trigger

Family setup is NOT triggered automatically after account creation. Instead, it opens naturally when mom needs it.

**Trigger 1 — Mom taps MyFamily:**
If no family members exist (other than mom herself), the bulk add flow (Screen 6) opens automatically instead of showing an empty family management page.

**Trigger 2 — Mom taps a family-dependent feature:**
Features that require family members (family dashboard, task assignment to kids, caregiver tools, shared calendar, etc.) show a friendly message instead of an empty/broken state:

**What the user sees:**
- Warm message: "This feature works with your family members. Let's get them added!"
- Brief explanation: "Once you add your family, you'll be able to [feature-specific benefit]."
- "Set Up MyFamily" button (primary) → navigates to MyFamily, which triggers the bulk add flow
- "Not right now" link → dismisses, returns to previous screen

**This message does NOT block exploration.** Mom can dismiss it and keep exploring other features. Personal features (journal, tasks, LifeLantern, LiLa, etc.) all work without family members.

---

### Screen 6: Family Setup — Bulk Add

**What the user sees:**
- "Tell Me About Your Family" heading
- Warm intro: "Just describe your family in your own words — the AI will figure out the rest."
- Large text area with placeholder: "For example: 'My husband is Marcus. Our kids are Amelia (15), Finn (12), Rosie (9), and baby Henry (2). My mom Linda helps with the kids on Tuesdays.'"
- "Add My Family" button
- "Or add one at a time" link (goes to manual add form)

**After AI parsing → Preview screen:**
- Each parsed member shown as an editable card:
  - Name (editable)
  - Relationship (dropdown: spouse/partner, child, special adult — editable)
  - Age (editable, optional)
  - Suggested dashboard mode (editable):
    - Spouse/partner → Additional Adult
    - Child age ~13+ → Independent
    - Child age ~8-12 → Guided
    - Child age ~3-7 → Play
    - Child under 3 → Context Only (no dashboard)
    - Adult child mentioned as "moved out", "in college", etc. → Out of Nest
    - Son/daughter-in-law, grandchildren, and their spouses → Out of Nest (anyone below mom on the family tree, or married to someone below mom)
    - Grandparents, aunts, uncles, cousins → Special Adult (if they help with kids) or not added (extended family context is a future feature)
    - Special adult → Special Adult
  - Household status: "In Household", "Out of Nest", or "Context Only" (editable)
  - Checkbox to include/exclude from import
- Duplicate detection: if a parsed name matches an existing member, flag it
- "Confirm & Add" button
- "Add More" button to return to text input

**Interactions:**
- Mom reviews the AI's parsing, adjusts anything that's wrong
- Tap "Confirm & Add" → creates `family_members` records for all selected members
- After adding, shows: "Family added! You can configure PINs, permissions, and other details for each member anytime from Family Management."
- Option: "Set Up Family Login Name" (goes to Screen 7) or "Do This Later"

**Important:** Age suggestions for dashboard mode are *suggestions only*. The UI never labels modes by age range. Mom can assign any mode to any child. The system says "We suggest Guided Mode for Rosie" not "Guided Mode is for ages 8-12."

---

### Screen 7: Family Login Name Setup

**What the user sees:**
- "Create Your Family Login Name" heading
- Explanation: "This is the fun name your family will type when logging in from a shared device. Make it memorable and uniquely you!"
- Text input field with validation:
  - Must be unique across all families
  - 3-30 characters
  - Letters, numbers, and these special characters: & - _ !
  - Case-insensitive for login (stored as entered for display)
- Examples shown: "otterpops&olives", "TheSmithCrew", "LlamaFam2025"
- "Save" button
- "Skip for Now" link

**Interactions:**
- As user types, real-time uniqueness check (debounced)
- If taken: "That name is already in use. Try another!"
- On save: stored on `families.family_login_name`
- Can be changed later from Family Management settings

---

### Screen 8: Forgot Password

**What the user sees:**
- "Reset Your Password" heading
- Brief text: "Enter your email and we'll send you a reset link."
- Field: Email
- "Send Reset Link" button
- "Back to Sign In" link

**Interactions:**
- Tap "Send Reset Link":
  - Always shows: "If an account exists with this email, you'll receive a reset link." (never reveal whether email exists)
  - Supabase sends password reset email
- User clicks link in email → Supabase handles redirect to password reset form
- After successful reset → redirect to Sign In

---

### Screen 9: Tablet / Family Device Hub

The family hub is designed to be an always-on family dashboard — a digital wallpaper that replaces dedicated hardware like Skylight. It runs on any device (tablet, old phone, mounted screen).

**What the user sees:**
- Family name/branding at top
- Configurable widget area showing shared family content:
  - Family Calendar widget (stub — wired in Calendar PRD)
  - Shared Goals / Chart widgets (stub — wired in Widgets PRD)
  - Dinner Menu widget (stub — future)
  - Family Reminders (stub — wired in Rhythms PRD)
  - "Coming Soon" — exciting upcoming events (stub)
- Widgets are drag-and-drop arrangeable by mom
- Widget sizes: Small, Medium, Large — mom configures per widget
- Remaining widgets auto-organize to fill available space around manually-placed widgets
- All widgets optional, mom configures which appear in settings
- Member selection area: grid of family member names/avatars
  - Tap a member → authenticate (PIN/visual/none per member config) → their shell

**Always-On Mode:**
- Mom can configure the family tablet to have NO session timeout for the hub view
- The hub stays active indefinitely as a family information display
- Individual member sessions (after tapping in) still have their own timeout settings
- When a member's session times out, the device returns to the hub — not to a login screen

**PWA Installation:**
- The family hub (`/hub` or `/family`) can be saved to a device's home screen as a PWA
- Each member's personal dashboard can also be saved as a separate PWA icon on their personal device
- Different URLs = different home screen apps:
  - Family tablet: saves `/hub` → "Smith Family" app icon
  - Mom's phone: saves `/dashboard` → "MyAIM" app icon
  - Teen's phone: saves `/dashboard` → their personal app icon
- PWA manifest and offline behavior detailed in a later PRD (PWA/Offline), but the URL structure must support this from the start

> **Forward note:** PWA manifest, service worker, and offline behavior are deferred to a dedicated PWA/Offline PRD. PRD-01 only requires that the URL routing structure supports separate installable entry points.

**Interactions:**
- Tap member name → auth method based on their config:
  - PIN → show PIN pad
  - Visual password → show image grid
  - None → go directly to their dashboard
  - Full login → show email/password form
- Settings gear icon → requires mom's PIN or full auth to access

**When a member is logged in on tablet:**
- "Switch Member" or "Back to Hub" button always visible in header
- Tap → returns to hub view (logs out current member)
- Auto-logout after configurable inactivity timeout (default: 30 minutes for adults, 15 minutes for kids, "never" available for hub view)

---

### Screen 10: Member Invitations (Account Creation for Non-Mom Members)

**Important principle:** Mom is the only person who creates an account from the landing page. Everyone else — dad, teens, Special Adults — joins through an invitation that mom generates. Their accounts are always nested under mom's family.

**What mom sees (in MyFamily / Family Management):**
- For any family member who should have their own email/password login, mom taps "Create Login Invitation"
- Three invite delivery methods, mom picks:

**Method 1: Email Invite**
- Mom enters (or confirms) the person's email
- System sends an invitation email with a unique link
- Recipient clicks link → creates their password (name and family are pre-filled) → account linked to their existing `family_members` record
- Status shown to mom: "Invited — waiting for [Name] to accept"

**Method 2: QR Code / Share Link**
- Mom taps "Generate Invite Link"
- System creates a unique, expiring link (7 days default, mom can adjust) and displays a QR code
- Mom shares via text, shows the QR code, or sends the link through any messaging app
- Recipient opens link or scans QR → same account creation flow
- Mom can revoke or regenerate the link anytime

**Method 3: Direct Setup (PIN Only, No Separate Account)**
- Mom sets up the member's access directly: name + PIN
- No email needed, no separate auth account
- Member logs in via the Family Member Login flow (Family Login Name → their name → PIN)
- Simplest option — good for younger teens, kids who need PIN access, or temporary caregivers

**Who gets which method:**
- Dad/spouse: typically email invite or QR code (gets own auth account + PIN on family device)
- Independent teen: email invite, QR code, or direct setup (mom's choice based on the teen)
- Special Adult: any of the three methods
- Guided/Play kids: usually direct setup (PIN only) or no auth needed
- Out of Nest members: no login needed (context only)

**What the invited person sees when they click the link:**
- "You've been invited to join [Family Name] on MyAIM Family!"
- Pre-filled: their name, family name, their role in the family
- Fields to complete: email (if not already provided), create password
- "Join Family" button
- On success: account created, linked to their `family_members` record, redirected to their appropriate shell dashboard
- They automatically appear in the family hub member selection

---

## Visibility & Permissions

This PRD establishes the *role columns and auth infrastructure*. The detailed permission rules, granular access controls, and RLS policies are defined in PRD-02.

| Role | Auth Methods | What PRD-01 Establishes |
|------|-------------|------------------------|
| Mom / Primary Parent | Email/password (required) | Full account creation, family ownership, all settings access |
| Dad / Additional Adult | Email/password (optional) + PIN | Own auth account OR PIN-only. `role` column set. |
| Special Adult | Email invite, share link, or direct setup (PIN) | `role` column, `special_adult_assignments` table, invite infrastructure |
| Independent (Teen) | Email/password (optional) + PIN | `role` column, `dashboard_mode` column set to 'independent' |
| Guided / Play | PIN, visual password, or none | `role` column, `dashboard_mode` column, `auth_method` column |

### What PRD-01 Does NOT Define (Deferred to PRD-02)

> **Deferred:** All granular permission logic — to be resolved in PRD-02 (Permissions & Access Control).
- Granular per-feature permission rules
- Mom's control over dad's access per feature per child
- Teen transparency settings
- Special Adult scoping rules (what exactly they can see/do)
- View As mode
- RLS policy templates
- PermissionGate component

---

## Data Schema

### Table: `families`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| primary_parent_id | UUID | | NOT NULL | FK → auth.users. The mom/primary parent. |
| family_name | TEXT | | NOT NULL | Display name (e.g., "The Smith Family") |
| family_login_name | TEXT | null | NULL | Unique, case-insensitive login identifier. Nullable until set. |
| family_login_name_lower | TEXT | null | NULL | Lowercase version for case-insensitive lookups. Auto-set via trigger. |
| is_founding_family | BOOLEAN | false | NOT NULL | Founding Family program flag |
| founding_family_rates | JSONB | null | NULL | Per-tier special pricing for founding families |
| timezone | TEXT | 'America/Chicago' | NOT NULL | Family default timezone. Set from browser on creation. |
| tablet_hub_config | JSONB | '{"widgets": [], "layout": []}' | NOT NULL | Widget configuration: which widgets appear, their positions (drag-drop), and sizes (small/medium/large). Layout array stores grid positions. |
| tablet_hub_timeout | TEXT | 'never' | NOT NULL | Session timeout for hub view. Enum: 'never', '15min', '30min', '1hr', '4hr'. Default 'never' for always-on family wallpaper mode. |
| setup_completed | BOOLEAN | false | NOT NULL | Whether family members have been added |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy (basic — PRD-02 expands):** Primary parent can read/update own family. Family members can read their family record.

**Indexes:**
- `primary_parent_id` (unique — one family per primary parent for now)
- `family_login_name_lower` (unique, for login lookups)

---

### Table: `family_members`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| auth_user_id | UUID | null | NULL | FK → auth.users. Set for members with their own login (mom, dad, teens with accounts). Null for PIN-only members. |
| display_name | TEXT | | NOT NULL | Name shown in the app |
| nicknames | TEXT[] | '{}' | NOT NULL | Alternative names (for AI context) |
| role | TEXT | | NOT NULL | Enum: 'primary_parent', 'additional_adult', 'special_adult', 'member' |
| dashboard_mode | TEXT | null | NULL | Enum: 'adult', 'independent', 'guided', 'play'. Null for special_adult and context-only members. |

> **Decision rationale:** `role` describes *who you are* in the family (parent, adult, special adult, member). `dashboard_mode` describes *what you see* (which shell/layout). These are separate because a "member" (child) could be in any mode, and mode can change over time as a kid grows — without changing their role.
| relationship | TEXT | | NOT NULL | Enum: 'self', 'spouse', 'child', 'special' |
| custom_role | TEXT | null | NULL | Free text for special adults: "Grandparent", "Babysitter", etc. |
| age | INTEGER | null | NULL | Current age (optional, used for mode suggestions only — never displayed as mode labels) |
| date_of_birth | DATE | null | NULL | For birthday tracking and default PIN |
| in_household | BOOLEAN | true | NOT NULL | Lives in household (gets dashboard) vs. context-only |
| dashboard_enabled | BOOLEAN | true | NOT NULL | Whether member appears in login selection and has a dashboard |
| auth_method | TEXT | 'pin' | NOT NULL | Enum: 'full_login', 'pin', 'visual_password', 'none' |
| pin_hash | TEXT | null | NULL | Hashed PIN. Default PIN is birthday mm/dd until changed. |
| visual_password_config | JSONB | null | NULL | Image sequence configuration for visual password |
| avatar_url | TEXT | null | NULL | Profile image URL (Supabase Storage) |
| out_of_nest | BOOLEAN | false | NOT NULL | Adult child who has left home. Preserved in Archives but no active dashboard. |
| invite_status | TEXT | null | NULL | For invited members: 'pending', 'accepted', 'expired'. Null for directly-added members. |
| invite_token | TEXT | null | NULL | Unique invite token for email/link invites |
| invite_expires_at | TIMESTAMPTZ | null | NULL | When the invite link expires |
| onboarding_completed | BOOLEAN | false | NOT NULL | Whether this member has completed any first-use setup |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy (basic — PRD-02 expands):** Primary parent can CRUD all members in their family. Members can read their own record and read (but not update) other family member names/avatars for display purposes.

**Indexes:**
- `family_id` (list members by family)
- `auth_user_id` (lookup member by auth account)
- `family_id, role` (filter by role)
- `invite_token` (unique, for invite lookups)

---

### Table: `special_adult_assignments`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| special_adult_id | UUID | | NOT NULL | FK → family_members (the special adult) |
| assigned_member_id | UUID | | NOT NULL | FK → family_members (the kid they can access) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Primary parent can CRUD. Special adult can read their own assignments.

**Indexes:**
- `special_adult_id` (list all kids assigned to a caregiver)
- `assigned_member_id` (list all caregivers assigned to a kid)
- Unique constraint on `(special_adult_id, assigned_member_id)`

---

### Table: `subscription_tiers` (Infrastructure — All Unlocked for Beta)

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| name | TEXT | | NOT NULL | Enum: 'essential', 'enhanced', 'full_magic', 'creator' |
| display_name | TEXT | | NOT NULL | User-facing name |
| price_monthly | DECIMAL | | NOT NULL | Standard monthly price |
| price_yearly | DECIMAL | | NOT NULL | Standard yearly price |
| description | TEXT | | NOT NULL | Tier description |
| is_active | BOOLEAN | true | NOT NULL | Whether this tier is available |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**Seeded with tier definitions on first migration. Not user-editable.**

---

### Table: `family_subscriptions`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families (unique) |
| tier_id | UUID | | NOT NULL | FK → subscription_tiers |
| status | TEXT | 'active' | NOT NULL | Enum: 'active', 'cancelled', 'past_due', 'trialing' |
| is_founding_family | BOOLEAN | false | NOT NULL | Mirrors families.is_founding_family for query convenience |
| founding_rate_monthly | DECIMAL | null | NULL | Locked founding rate (null if not founding) |
| founding_rate_yearly | DECIMAL | null | NULL | Locked founding rate (null if not founding) |
| current_period_start | TIMESTAMPTZ | now() | NOT NULL | |
| current_period_end | TIMESTAMPTZ | null | NULL | Null during beta (no expiry) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Primary parent can read own subscription. All features check via `useCanAccess()` hook, not direct subscription queries.

---

### Table: `feature_access`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| tier_id | UUID | | NOT NULL | FK → subscription_tiers |
| feature_key | TEXT | | NOT NULL | Unique feature identifier (e.g., 'lila_optimizer', 'family_dashboards') |
| enabled | BOOLEAN | true | NOT NULL | Whether this feature is available at this tier. ALL true during beta. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**Unique constraint on `(tier_id, feature_key)`**

**Seeded during migration with all feature keys enabled for all tiers.**

---

### Auto-Created Records

When a new user creates an account via Screen 2, a database trigger creates:

1. A `families` record with the user as `primary_parent_id`
2. A `family_members` record for mom with `role = 'primary_parent'`, `dashboard_mode = 'adult'`, `relationship = 'self'`, `auth_method = 'full_login'`
3. A `family_subscriptions` record on the default tier with all features enabled

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_family_id UUID;
  default_tier_id UUID;
BEGIN
  -- Create family
  INSERT INTO public.families (primary_parent_id, family_name, timezone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'My Family'),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'America/Chicago')
  )
  RETURNING id INTO new_family_id;

  -- Create mom's family_member record
  INSERT INTO public.family_members (
    family_id, auth_user_id, display_name, role, dashboard_mode,
    relationship, auth_method, dashboard_enabled
  )
  VALUES (
    new_family_id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Mom'),
    'primary_parent',
    'adult',
    'self',
    'full_login',
    true
  );

  -- Create subscription on default tier (all features enabled)
  SELECT id INTO default_tier_id FROM public.subscription_tiers
    WHERE name = 'essential' LIMIT 1;

  INSERT INTO public.family_subscriptions (family_id, tier_id, status)
  VALUES (new_family_id, default_tier_id, 'active');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## Flows

### Incoming Flows

| Source | How It Works |
|--------|-------------|
| Supabase Auth | User creates account → trigger creates family + member + subscription records |
| Special Adult invite link | Invited person clicks link → creates auth account → linked to existing family_members record |
| Bulk add (AI parsing) | Mom describes family → AI extracts members → creates family_members records |

### Outgoing Flows

| Destination | How It Works |
|-------------|-------------|
| Every other feature | All features query `family_members` for the current user's context, role, and dashboard_mode |
| Permission system (PRD-02) | Role and dashboard_mode columns drive all permission checks |
| Shell routing (PRD-04) | `dashboard_mode` determines which shell layout the member sees |
| LiLa context (PRD-05) | Family structure loaded as AI context for relevant conversations |
| Tier gating (all PRDs) | `useCanAccess(feature_key)` checks `feature_access` table via family's subscription tier |

---

## AI Integration

### Bulk Add Parsing

The family setup bulk add uses AI to parse natural language descriptions of family members into structured data.

**Input:** Free text describing family members (e.g., "My husband Marcus, kids Amelia 15, Finn 12, Rosie 9, baby Henry 2, and my mom Linda helps on Tuesdays")

**Output:** Structured array of members with: name, inferred relationship, inferred age, suggested dashboard mode, suggested household status

**AI behavior:**
- Extract all people mentioned
- Infer relationship type from context ("my husband" → spouse, "my kids" → child, "my mom helps" → special adult)
- Infer age when mentioned
- Suggest dashboard mode based on relationship and age (suggestions only — mom confirms)
- Flag ambiguity: if uncertain about a relationship, show it as editable with a note
- Handle edge cases: step-children, half-siblings, foster children, non-traditional family structures — all valid, no assumptions

**This uses the same pattern as StewardShip's BulkAddCrew but adapted for family structure** (relationship types are family-specific, dashboard mode suggestions are added).

---

## Edge Cases

### No Family Members Added
- Mom can use the app solo without adding any family members
- All personal features work (journal, tasks, LifeLantern, etc.) — it's just her personal growth space
- Family-specific features (family dashboard, shared tasks, caregiver tools) show empty states with prompts to add family members

### Large Families
- No hard limit on family members (designed for 9+ kids)
- Bulk add handles long lists gracefully
- Member selection grid on tablet hub scrolls if needed
- PIN login member list is scrollable with search for very large families

### Duplicate Family Login Names
- Case-insensitive uniqueness check (stored lowercase for comparison, original case for display)
- Real-time validation as mom types
- Friendly suggestion if taken: "That name's taken! How about [variant]?"

### Special Adult Invite Expiry
- Email/link invites expire after configurable period (default: 7 days)
- Mom can resend or regenerate expired invites
- Expired invites show "This invite has expired. Ask [family name] to send a new one."

### Member with No Auth Method
- If a member has `auth_method = 'none'`, tapping their name on the hub goes directly to their dashboard
- This is intentional for very young children — mom made this choice in settings
- A lock icon does NOT appear next to their name (no visual indication of "less security")

### PIN Security
- Default PIN: if date of birth is set, default is mm/dd (e.g., March 15 = 0315). If no birthday, default is 0000.
- Mom is encouraged to change default PINs but not required to
- PINs are hashed before storage (never stored in plaintext)
- Mom can view/reset any family member's PIN from MyFamily
- "View PIN" in mom's settings shows the PIN temporarily (like a password reveal toggle)

### Session Management
- Mom login: session persists until explicit sign-out or refresh token expiry
- PIN login: session duration configurable by mom (default: 12 hours for adults, 4 hours for kids)
- Tablet auto-logout after inactivity: configurable (default: 30 min adults, 15 min kids)
- Session expiry: non-intrusive banner "Your session has ended. Tap to log back in." — doesn't lose current page if possible

### Dad/Teen Creating Own Account
- All non-mom accounts are created through invitations — never through the landing page "Create Account" flow
- Mom generates an invite from MyFamily (email, QR code, or share link)
- The invited person clicks the link, sets their password, and their new `auth.users` record is linked to their existing `family_members` record via `auth_user_id`
- They automatically appear in the family hub member selection and can log in independently from their own device
- Their account is always nested under the family — they cannot create a separate family

---

## Tier Gating

All features return true during beta. The infrastructure exists from day one. Every page and tool should have `useCanAccess()` wired so tier restrictions can be enabled via configuration later.

**Tier philosophy:**

> **Tier rationale:** Essential is the entry point — mom gets her personal growth space, with context-only family info for LiLa. Connected family features (dashboards, logins, invites) require Enhanced because they create significant additional infrastructure and support load. FullMagic removes all limits. Creator adds creator-specific tools TBD.
- **Essential:** Mom-only account. Personal features for mom. Context-only information about family members (names, ages, notes for LiLa context). No connected family dashboards, no family login, no member accounts.
- **Enhanced:** Connected family. Family Login Name, family hub/dashboard, member dashboards, PIN login, Special Adult invites, member account invitations.
- **FullMagic:** Everything. Unlimited additional adults, all advanced features.
- **Creator:** FullMagic plus creator-specific tools (details TBD in future PRDs).

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `family_dashboards` | Family member dashboard access | Enhanced |
| `family_login` | Family Login Name + PIN/visual login for members | Enhanced |
| `member_account_invites` | Invite family members to create own logins | Enhanced |
| `special_adult_access` | Special Adult invites and caregiver tools | Enhanced |
| `unlimited_adults` | More than 1 additional adult | FullMagic |
| `tablet_hub` | Family device hub view with always-on mode | Enhanced |

**Hook pattern:** Every feature checks `useCanAccess('feature_key')` which queries the family's subscription tier against `feature_access`. During beta, all return `true`.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Tablet hub widget slots (calendar, goals, dinner, reminders, coming soon) | Widget rendering system | PRD-10 (Widgets), PRD-Calendar, PRD-Rhythms |
| Family Overview Card prompt after setup | Family LifeLantern conversational building | PRD-12 (LifeLantern) |
| Member Archive folder auto-creation on member add | Per-member Archive folders | PRD-13 (Archives) |
| Shell routing placeholder (returns dashboard_mode) | Full shell layout system | PRD-04 (Shell Routing) |
| Permission check placeholder (useCanAccess returns true) | Full permission engine | PRD-02 (Permissions) |
| Special Adult "what they can see" scoping | Caregiver tool access rules | PRD-02 (Permissions) + PRD-27 (Caregiver Tools) |

### Existing Stubs Wired by This PRD

None — this is PRD-01, nothing exists yet.

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] Mom can create account with email/password (only mom uses the landing page Create Account)
- [ ] Account creation triggers family + member + subscription records automatically
- [ ] Mom can sign in and stays signed in across sessions
- [ ] Mom can reset password via email
- [ ] After account creation, mom lands on Command Center (no forced setup flow)
- [ ] Tapping MyFamily with no members triggers bulk add flow automatically
- [ ] Tapping a family-dependent feature with no members shows friendly setup nudge
- [ ] Bulk add: mom describes family in natural language, AI parses into structured member data
- [ ] Bulk add includes Out of Nest designation for adult children who've left home
- [ ] Bulk add preview: mom can edit/adjust all parsed members before confirming
- [ ] Members created with correct role, dashboard_mode, relationship, household status
- [ ] Family Login Name: create, validate uniqueness, save. Changeable later.
- [ ] PIN login flow: Family Login Name → member select → PIN → dashboard
- [ ] PIN hashing (never plaintext)
- [ ] Default PIN: birthday mm/dd if birthday set, otherwise 0000
- [ ] Visual password configuration (stored, basic grid-of-images implementation)
- [ ] Auth method "none" works (tap name → straight to dashboard)
- [ ] Member invitations: mom generates invite (email, QR code, share link) for dad/teens/Special Adults to create their own login nested under the family
- [ ] Invite acceptance flow: invited person clicks link, sets password, linked to existing family_members record
- [ ] Special Adults can also be set up via direct setup (PIN only, no email needed)
- [ ] Tablet hub: family dashboard view with member selection grid, widget slots stubbed
- [ ] Tablet hub: "always-on" mode with no session timeout option for hub view
- [ ] Tablet hub: widgets drag-and-drop arrangeable, resizable (S/M/L), auto-organize remaining space
- [ ] URL structure supports PWA installation at multiple entry points (/hub, /dashboard)
- [ ] Tier infrastructure: subscription_tiers, feature_access, family_subscriptions tables seeded
- [ ] `useCanAccess()` hook exists and returns true for all features
- [ ] Every page and tool has `useCanAccess()` wired from day one
- [ ] `is_founding_family` flag on families table
- [ ] Basic RLS: users can only access their own family's data
- [ ] Auth error messages are security-conscious (never reveal email existence)
- [ ] All error messages inline, not toasts

### MVP When Dependency Is Ready
- [ ] Shell routing based on dashboard_mode (requires PRD-04)
- [ ] Tablet hub widgets render real data (requires Widget PRDs)
- [ ] Family Overview Card prompt after setup (requires PRD-12 LifeLantern)
- [ ] Per-member Archive folder creation on member add (requires PRD-13)
- [ ] Detailed permission scoping for all roles (requires PRD-02)

### Post-MVP
- [ ] Google OAuth for mom/adult accounts
- [ ] Change password from Settings
- [ ] Delete account from Settings (with full data cleanup)
- [ ] Email verification enforcement
- [ ] Rate limiting on auth attempts
- [ ] Biometric auth (fingerprint/face) as PIN alternative
- [ ] Multi-family support (one mom account, multiple families)
- [ ] Family member profile photos (upload/camera)
- [ ] Animated avatar selection for kids (instead of photos)

---

## Supabase Auth Configuration

### Providers (Initial)
- Email/password (enabled)
- Google OAuth (placeholder, post-launch)

### Email Templates
- **Confirmation email:** MyAIM Family branding. Warm, friendly. "Welcome to the family!"
- **Password reset email:** Clean, simple. "Reset your password."
- **Special Adult invite email:** Explains what the app is, what they'll be able to do, includes the invite link. Branded and warm.

### Session Settings
- Access token lifetime: 1 hour (Supabase default)
- Refresh token lifetime: 30 days
- Auto-refresh: enabled

---

## CLAUDE.md Additions from This PRD

- [ ] `families`, `family_members`, `special_adult_assignments`, `subscription_tiers`, `family_subscriptions`, `feature_access` table schemas
- [ ] Auto-creation trigger pattern: new auth user → family + member + subscription records
- [ ] Convention: all error messages inline, not toasts/popups
- [ ] Convention: security-conscious auth messaging (never reveal if email exists)
- [ ] Convention: PIN hashing required, never store plaintext
- [ ] Convention: default PIN is birthday mm/dd if birthday set, otherwise 0000. Mom can change anytime.
- [ ] Convention: dashboard mode is mom-assigned based on readiness, NEVER auto-assigned by age. No age labels in UI.
- [ ] Convention: mom is the ONLY account that creates from the landing page. All other accounts (dad, teens, Special Adults) are created through invitations generated by mom. Accounts are always nested under the family.
- [ ] Convention: family hub supports "always-on" mode with no session timeout for the hub view — acts as family digital wallpaper
- [ ] Convention: URL structure must support PWA installation at multiple entry points (hub, personal dashboard) so different devices can save different views as separate apps
- [ ] Convention: every page and tool must have `useCanAccess(feature_key)` wired from day one for future tier gating
- [ ] Convention: tablet hub widgets are drag-and-drop, resizable (S/M/L), with auto-organize for remaining space
- [ ] Convention: family setup is NOT triggered on account creation. It opens naturally when mom taps MyFamily (auto-opens bulk add if no members) or when she taps a family-dependent feature (shows friendly nudge with link to MyFamily).
- [ ] Convention: dashboard mode is mom-assigned based on readiness, NEVER auto-assigned by age. No age labels in UI.
- [ ] Convention: `useCanAccess(feature_key)` hook on every feature (returns true during beta)
- [ ] Convention: Family Login Name is case-insensitive for lookups, preserved-case for display
- [ ] Bulk add pattern: natural language → AI parsing → preview/edit → confirm
- [ ] Special Adult invite: three methods (email, link, direct setup). All result in same role + assignment records.
- [ ] Founding Family: `is_founding_family` flag, `founding_family_rates` JSONB, rates persist across tier changes, lost on cancellation

---

## DATABASE_SCHEMA.md Additions from This PRD

**Tables defined:** `families`, `family_members`, `special_adult_assignments`, `subscription_tiers`, `family_subscriptions`, `feature_access`

**Triggers defined:** `handle_new_user` (creates family + member + subscription on auth user creation), `family_login_name_lower` auto-set trigger

**Enums defined:**
- `family_members.role`: 'primary_parent', 'additional_adult', 'special_adult', 'member'
- `family_members.dashboard_mode`: 'adult', 'independent', 'guided', 'play'
- `family_members.relationship`: 'self', 'spouse', 'child', 'special'
- `family_members.auth_method`: 'full_login', 'pin', 'visual_password', 'none'
- `family_members.invite_status`: 'pending', 'accepted', 'expired'
- `subscription_tiers.name`: 'essential', 'enhanced', 'full_magic', 'creator'
- `family_subscriptions.status`: 'active', 'cancelled', 'past_due', 'trialing'

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Mom-only account creation from landing page** | All other members join through invitations. Keeps accounts nested under the family and prevents orphan accounts. |
| 2 | **Role vs dashboard_mode as separate columns** | Role = who you are (doesn't change). Mode = what you see (changes as kids grow). Cleaner than encoding both in one field. |
| 3 | **Family Login Name is changeable** | UUID is the real DB identifier. Login name is just a display/lookup field, so changing it has zero data impact. Families evolve. |
| 4 | **Three invite methods for non-mom members** | Email, QR code/link, and direct setup (PIN only). Different situations need different approaches — babysitter vs spouse vs teen. |
| 5 | **No forced family setup after registration** | Mom lands on Command Center immediately. Family setup triggers naturally when she taps MyFamily or a family-dependent feature. Less overwhelming. |
| 6 | **Default PIN is birthday mm/dd or 0000** | Simple default that's easy for families to remember. 0000 fallback when no birthday is set. |
| 7 | **Tablet hub supports "always-on" (no timeout)** | Designed to replace Skylight — a family digital wallpaper that stays up on a dedicated device. |
| 8 | **Out of Nest = descendants and their spouses only** | Below mom on the family tree. Not extended family (grandparents, aunts, uncles). Clear scoping rule. |
| 9 | **Four tiers: Essential, Enhanced, FullMagic, Creator** | No free tier. Essential is the entry point. Creator details TBD. All unlocked during beta. |
| 10 | **Widgets are drag-and-drop, resizable (S/M/L), auto-organize** | Widget layout system noted here for tablet hub, full implementation in Widget PRD. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Granular permission rules (who sees what per feature per child) | PRD-02 (Permissions & Access Control) |
| 2 | Shell routing and layout system | PRD-04 (Shell Routing & Layouts) |
| 3 | Widget rendering system and layout engine | PRD-10 or dedicated Widget PRD |
| 4 | PWA manifest, service worker, offline behavior | Future PWA/Offline PRD |
| 5 | Creator tier feature details | Future PRD when creator tools are scoped |
| 6 | Extended Family context archive folder | Future — not on near horizon |
| 7 | Visual password image library and configuration UI | Build prompt scope — PRD defines the data model only |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-02 | Invitation-based account creation for all non-mom members established | PRD-02 must define permission defaults for invited members upon acceptance |
| PRD-04 | `dashboard_mode` column drives shell selection | PRD-04 must consume this column for routing logic |
| PRD-02 Starter Prompt | Scope confirmed: PRD-01 handles auth, PRD-02 handles permissions | Update starter prompt to reference final PRD-01 decisions |

---

*End of PRD-01*
