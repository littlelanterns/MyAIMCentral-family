# PRD-31 Permission Matrix Addendum

**Generated from:** PRD-31 session follow-up, March 22, 2026
**Purpose:** Resolves interaction rules between the three access layers, specifies default states, defines permission level profiles, updates the PermissionGate component, and clarifies the relationship between `member_feature_toggles` and PRD-02's `member_permissions`.

---

## The Three Layers — Interaction Rules

### Layer Summary

| Layer | What It Controls | Who Sets It | Where It Lives |
|-------|-----------------|-------------|----------------|
| **Layer 1: Platform Tier Gating** | Which features are available at which tier for which role groups | Admin (Tenise) | `feature_access_v2` table, Admin Console Screen 4 |
| **Layer 2: Family Feature Toggles** | Which tier-allowed features are enabled for each specific family member | Mom | `member_feature_toggles` table, Permission Hub |
| **Layer 3: Granular Permissions** | What level of access (none/view/contribute/manage) a member has within an enabled feature, per child | Mom | `member_permissions` table (PRD-02), Permission Hub detail view |

### How They Stack

```
REQUEST: "Can David view Emma's tasks?"

Layer 1 — Tier Check:
  → Is 'tasks' available for role_group 'dad_adult' at this family's tier?
  → Look up feature_access_v2(feature_key='tasks', role_group='dad_adult')
  → min_tier = 'enhanced', family tier = 'enhanced' → YES, tier allows it
  
Layer 2 — Mom's Toggle:
  → Has mom enabled 'tasks' for David?
  → Look up member_feature_toggles(member_id=David, feature_key='tasks')
  → enabled = true → YES, mom allows it

Layer 3 — Granular Permission:
  → What level does David have for Emma's tasks?
  → Look up member_permissions(member_id=David, target_member_id=Emma, feature_key='tasks')
  → access_level = 'contribute' → David can VIEW and MARK COMPLETE but not DELETE
  → Return { allowed: true, level: 'contribute' }
```

### Key Rules

1. **Each layer can only restrict, never expand.** Layer 1 sets the ceiling. Layer 2 can only turn things OFF within that ceiling. Layer 3 can only restrict within what Layer 2 allows.

2. **Layer 2 toggle OFF overrides Layer 3.** If mom toggles Tasks OFF for David in Layer 2, his Layer 3 per-child task permissions are irrelevant — he can't access Tasks at all. When mom toggles Tasks back ON, his Layer 3 settings are restored (they persist in `member_permissions` regardless of the Layer 2 toggle).

3. **Layer 2 toggle ON does not mean full access.** It means "this feature is available to this member, subject to their Layer 3 permissions." David having Tasks toggled ON + Layer 3 'view' for Emma means he can see but not modify Emma's tasks.

4. **Founding family override bypasses Layer 1 only.** Founding families with completed onboarding skip the tier check — all features are "tier-allowed." Layers 2 and 3 still apply normally. Mom can still toggle features off for specific members, and granular permissions still control per-child access.

5. **"Never" in Layer 1 cannot be overridden.** If admin sets a feature to "Never" for a role group, no tier upgrade, no founding status, and no mom toggle can enable it. It does not appear as a toggleable row in mom's Permission Hub for that member type — it appears as "···" (not available).

6. **Tier-sampling (credit-based temporary access) bypasses Layer 1 for a single session.** When a user spends credits to sample an above-tier feature, Layer 1 is temporarily satisfied for that session. Layers 2 and 3 still apply.

---

## Permission Level Profiles

### Overview

When mom adds a family member or first opens the Permission Hub for an existing member who has no toggles yet, the system presents three access levels: **Light**, **Balanced**, and **Maximum**. Each level is a pre-defined set of feature toggle states specific to the member's role type.

These profiles are **seed data** — static lookup tables authored during the build phase, not AI-generated per family. No API calls. The system suggests a default level based on the member's role, mom selects (or changes) the level, and all `member_feature_toggles` rows are pre-populated accordingly. Mom can then adjust individual toggles.

### Profile Suggestion by Role

| Role Type | Suggested Default | Rationale |
|-----------|------------------|-----------|
| Dad / Additional Adult | Balanced | Most co-parents need meaningful access but mom may want to restrict sensitive personal features initially. |
| Special Adult | Light | Caregivers need shift-scoped access to kid logistics. Minimal by default, mom expands as trust builds. |
| Independent Teen | Balanced | Teens need their own feature set but some features (financial, reporting) may not be appropriate. |
| Guided Kid | Light | Younger kids get basic interactive features. Mom expands as readiness grows. |
| Play Kid | Light | Youngest members get minimal, visual-only features. |

### Profile Definition Structure

Each profile is stored in `permission_level_profiles`:

```
permission_level_profiles:
  role_group: 'dad_adult'
  level: 'balanced'
  feature_key: 'tasks'
  enabled: true
```

One row per (role_group × level × feature_key). Three levels × 6 role groups × N feature keys = all combinations pre-defined. When mom selects "Balanced" for David (Dad), the system copies all rows matching (role_group='dad_adult', level='balanced') into `member_feature_toggles` for David.

### Profile Definitions by Role Group

#### Dad / Additional Adults

| Feature Category | Feature | Light | Balanced | Maximum |
|-----------------|---------|-------|----------|---------|
| **Family Tools** | Tasks & Routines | ✓ | ✓ | ✓ |
| | Calendar | ✓ | ✓ | ✓ |
| | Messages | ✓ | ✓ | ✓ |
| | Family Hub | ✓ | ✓ | ✓ |
| | Lists | ✓ | ✓ | ✓ |
| | Meetings | ✗ | ✓ | ✓ |
| | Family Feeds | ✗ | ✓ | ✓ |
| **Personal Growth** | Journal | ✗ | ✗ | ✓ |
| | Smart Notepad | ✗ | ✓ | ✓ |
| | Guiding Stars | ✗ | ✓ | ✓ |
| | Best Intentions | ✗ | ✓ | ✓ |
| | InnerWorkings | ✗ | ✗ | ✓ |
| | LifeLantern | ✗ | ✗ | ✓ |
| | Victory Recorder | ✓ | ✓ | ✓ |
| **AI Features** | LiLa General Chat | ✗ | ✓ | ✓ |
| | LiLa Optimizer | ✗ | ✗ | ✓ |
| | LiLa Help | ✓ | ✓ | ✓ |
| | LiLa Assist | ✗ | ✓ | ✓ |
| | AI Vault Browse | ✗ | ✗ | ✓ |
| | ThoughtSift | ✗ | ✗ | ✓ |
| | BookShelf | ✗ | ✗ | ✓ |
| **Planning** | BigPlans | ✗ | ✓ | ✓ |
| | Widgets & Trackers | ✓ | ✓ | ✓ |
| **Communication** | Safe Harbor | ✗ | ✗ | ✓ |
| | Relationship Tools | ✗ | ✓ | ✓ |

> **Rationale:** Light Dad sees family logistics (tasks, calendar, lists, hub) and can record victories but nothing personal or AI-powered. Balanced Dad gets most collaborative features plus LiLa access and personal goal-setting. Maximum Dad gets everything the tier allows — full partner mode.

#### Special Adults

| Feature Category | Feature | Light | Balanced | Maximum |
|-----------------|---------|-------|----------|---------|
| **Family Tools** | Tasks & Routines (assigned kids only) | ✓ | ✓ | ✓ |
| | Calendar (assigned kids only) | ✓ | ✓ | ✓ |
| | Messages (to mom/parents only) | ✗ | ✓ | ✓ |
| | Trackable Events | ✓ | ✓ | ✓ |
| | Notes & Instructions (read-only) | ✓ | ✓ | ✓ |
| | Shift Notes (write) | ✓ | ✓ | ✓ |
| **AI Features** | LiLa Help | ✓ | ✓ | ✓ |

> **Rationale:** Special Adults are shift-scoped — all access is already limited to active shifts and assigned children (PRD-02). Light gives them the basics during a shift. Balanced adds messaging to parents. Maximum is the same as Balanced for most features because the shift-scoping is the primary control. Most features are "Never" at the admin level for Special Adults, so the profile only covers the few that are available.

#### Independent Teens

| Feature Category | Feature | Light | Balanced | Maximum |
|-----------------|---------|-------|----------|---------|
| **Family Tools** | Tasks & Routines | ✓ | ✓ | ✓ |
| | Calendar | ✓ | ✓ | ✓ |
| | Messages | ✓ | ✓ | ✓ |
| | Family Hub | ✓ | ✓ | ✓ |
| | Lists | ✓ | ✓ | ✓ |
| | Family Feeds | ✗ | ✓ | ✓ |
| **Personal Growth** | Journal | ✗ | ✓ | ✓ |
| | Smart Notepad | ✗ | ✓ | ✓ |
| | Guiding Stars | ✗ | ✓ | ✓ |
| | Best Intentions | ✗ | ✓ | ✓ |
| | InnerWorkings | ✗ | ✗ | ✓ |
| | LifeLantern | ✗ | ✗ | ✓ |
| | Victory Recorder | ✓ | ✓ | ✓ |
| **AI Features** | LiLa General Chat | ✗ | ✓ | ✓ |
| | LiLa Help | ✓ | ✓ | ✓ |
| | LiLa Assist | ✗ | ✓ | ✓ |
| | AI Vault Browse | ✗ | ✗ | ✓ |
| **Planning** | BigPlans (goal + project only) | ✗ | ✓ | ✓ |
| | Widgets & Trackers | ✓ | ✓ | ✓ |
| **Gamification** | Full gamification system | ✓ | ✓ | ✓ |

> **Rationale:** Light Teen has basic family participation. Balanced Teen gets personal growth tools and LiLa access — the "growing independence" level. Maximum Teen gets the most available, including Vault browsing and LifeLantern.

#### Guided Kids

| Feature Category | Feature | Light | Balanced | Maximum |
|-----------------|---------|-------|----------|---------|
| **Family Tools** | Tasks & Routines | ✓ | ✓ | ✓ |
| | Calendar (view own) | ✓ | ✓ | ✓ |
| | Messages (to parents) | ✗ | ✓ | ✓ |
| | Family Hub | ✓ | ✓ | ✓ |
| **Personal Growth** | Write Drawer (Guided lite) | ✗ | ✓ | ✓ |
| | Guiding Stars (view only) | ✗ | ✗ | ✓ |
| | Victory Recorder | ✓ | ✓ | ✓ |
| **Gamification** | Full gamification system | ✓ | ✓ | ✓ |
| | Celebrate! button | ✓ | ✓ | ✓ |

> **Rationale:** Light Guided gets tasks, calendar, hub, victories, and gamification — the core daily experience. Balanced adds writing and messaging. Maximum adds Guiding Stars viewing. Most features are "Never" at admin level for Guided Kids.

#### Play Kids

| Feature Category | Feature | Light | Balanced | Maximum |
|-----------------|---------|-------|----------|---------|
| **Family Tools** | Tasks (tile-based) | ✓ | ✓ | ✓ |
| | Calendar (visual icons) | ✗ | ✓ | ✓ |
| | Family Hub | ✓ | ✓ | ✓ |
| **Gamification** | Full gamification system | ✓ | ✓ | ✓ |
| | Celebrate! button | ✓ | ✓ | ✓ |
| | Coloring (gamification) | ✗ | ✓ | ✓ |

> **Rationale:** Light Play gets tasks and gamification — just the daily activity loop. Balanced adds visual calendar and coloring. Maximum is the same as Balanced because Play Kids have very few available features.

---

## Mom's Selection Flow

### When It Appears

The permission level selection appears:
1. **On first member creation** — after mom adds a member via PRD-01's bulk add or individual add flow, before the member's account is finalized.
2. **First time mom opens Permission Hub** for a member who has no `member_feature_toggles` rows (legacy members from before this system).
3. **Anytime from the Permission Hub** — a [Change Access Level] button at the top of each member's column re-presents the three options.

### What Mom Sees

```
┌─────────────────────────────────────────────────────────┐
│  Set Access Level for David (Dad)                        │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  How much access should David have?                      │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  ○  Light                                        │    │
│  │     View family logistics. Limited interaction.  │    │
│  │     Good for: getting started, building trust    │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  ●  Balanced  ★ Suggested                        │    │
│  │     Most family tools + personal features.       │    │
│  │     Good for: active co-parents                  │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  ○  Maximum                                      │    │
│  │     Everything your plan allows.                 │    │
│  │     Good for: fully equal partners               │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  [Apply]                                                 │
│                                                          │
│  You can adjust individual features after applying.      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### What Happens on Apply

1. System looks up all rows in `permission_level_profiles` matching (role_group, level).
2. For each feature key in the profile:
   a. Check Layer 1: is this feature available for this role group at the family's tier?
   b. If yes: create `member_feature_toggles` row with the profile's `enabled` value.
   c. If no (tier too low): create row with `enabled = false` AND set `blocked_by_tier = true` (so the Permission Hub knows to show 🔒 instead of a user-toggleable switch).
   d. If "Never" at admin level: do NOT create a row. These features don't appear for this member.
3. Also pre-populate the Layer 3 granular permissions (`member_permissions`) based on the selected level:
   - Light → defaults to 'view' for allowed features
   - Balanced → defaults to 'contribute' for most features, 'view' for sensitive ones
   - Maximum → defaults to 'manage' for all allowed features

### Changing Levels Later

When mom taps [Change Access Level] and selects a different level:
- A confirmation prompt appears: "This will reset David's feature access to the [Level] defaults. Your custom adjustments will be replaced. Continue?"
- On confirm: all `member_feature_toggles` rows for this member are deleted and re-created from the new profile.
- Layer 3 `member_permissions` are also reset to the new level's defaults.

> **Decision rationale:** Full reset on level change is simpler than trying to merge. Mom is warned, and the common case is using this during setup or when trust level changes significantly — both cases where a clean slate makes sense.

---

## Updated PermissionGate Component

### Current Pattern (PRD-02)

```tsx
<PermissionGate 
  action="view_dashboard" 
  targetMemberId={kidId} 
  featureKey="tasks"
  fallback={<NoAccessMessage />}
>
  <TaskList memberId={kidId} />
</PermissionGate>
```

Currently checks only Layer 3 (`usePermission()`).

### Updated Pattern (PRD-31)

```tsx
<PermissionGate 
  action="view_dashboard" 
  targetMemberId={kidId} 
  featureKey="tasks"
  fallback={<NoAccessMessage />}
  tierFallback={<UpgradePrompt featureKey="tasks" />}
  toggleFallback={<AskMomMessage featureKey="tasks" />}
>
  <TaskList memberId={kidId} />
</PermissionGate>
```

**New props:**
- `tierFallback` — rendered when Layer 1 blocks access (tier too low). Shows upgrade prompt with optional tier-sampling if credits available.
- `toggleFallback` — rendered when Layer 2 blocks access (mom toggled it off). Shows "This feature is available but hasn't been enabled for you" message. For kids: "Ask mom to enable this." For dad: same message.

**Resolution order inside PermissionGate:**
```
1. Call useCanAccess(featureKey, currentMemberId)
   → Checks Layer 1 (tier) and Layer 2 (mom toggle)
   → If blocked by tier: render tierFallback
   → If blocked by mom toggle: render toggleFallback

2. If Layer 1 + 2 pass, call usePermission(action, targetMemberId, featureKey)
   → Checks Layer 3 (granular permissions)
   → If blocked: render fallback (existing behavior)

3. If all layers pass: render children
```

**Backward compatibility:** The existing `fallback` prop continues to work as before for Layer 3 denials. If `tierFallback` or `toggleFallback` are not provided, the component falls back to the generic `fallback` prop for all denial types.

---

## Relationship Between Tables

### `member_feature_toggles` vs `member_permissions`

These are **complementary, not redundant.** They answer different questions:

| Table | Question It Answers | Granularity | Values |
|-------|-------------------|-------------|--------|
| `member_feature_toggles` | "Can this member use this feature at all?" | Per member × per feature | Boolean (on/off) |
| `member_permissions` | "What can this member do with this child's data within this feature?" | Per member × per feature × per target child | Enum (none/view/contribute/manage) |

**Example:** David (Dad) has Tasks toggled ON in `member_feature_toggles`. That means he can access the Tasks feature. But his `member_permissions` say: Emma's tasks = 'manage', Jake's tasks = 'contribute', Gideon's tasks = 'view'. The toggle is the front gate; the permissions are the room-by-room access.

**When Layer 2 toggle is OFF:** Layer 3 permissions are ignored (feature is fully blocked) but NOT deleted. They persist in `member_permissions` so that when mom toggles the feature back ON, the granular settings are restored without needing reconfiguration.

---

## AI Vault Engagement — Feature Key Breakdown

Per the session decision, AI Vault engagement is split into separate feature keys:

| Feature Key | Description | Mom | Dad/Adults | Special Adults | Ind. Teens | Guided | Play |
|-------------|-------------|-----|-----------|---------------|-----------|--------|------|
| `vault_browse` | Browse AI Vault content | TBD | TBD | Never | TBD | Never | Never |
| `vault_consume` | Open/use Vault content | TBD | TBD | Never | TBD | Never | Never |
| `vault_hearts` | Heart/favorite Vault items | Follows `vault_browse` | Follows `vault_browse` | Never | Follows `vault_browse` | Never | Never |
| `vault_comments_post` | Post comments/discussions | TBD | Never | Never | Never | Never | Never |
| `vault_comments_read` | Read others' comments | TBD | Never | Never | Never | Never | Never |
| `vault_optimize_lila` | "Optimize with LiLa" on items | TBD | TBD | Never | TBD | Never | Never |
| `vault_toolbox_assign` | Add to AI Toolbox | TBD | TBD | Never | TBD | Never | Never |
| `vault_prompt_library` | Personal prompt library | TBD | TBD | Never | TBD | Never | Never |
| `vault_request_content` | Submit content requests | TBD | Never | Never | Never | Never | Never |

> **Decision:** AI Vault comments (posting AND reading) are mom-only. `vault_comments_post` and `vault_comments_read` are both set to "Never" for all non-mom role groups. Hearts follow the `vault_browse` access — anyone who can browse can heart.

---

## "Not Available" Display Rules for Mom's Permission Hub

Features that are "Never" at the admin level for a member's role group are displayed as "···" (not available) in mom's Permission Hub grid. They are:

- **Visible but non-interactive.** Mom sees that the feature exists but is not applicable to this member type.
- **No tooltip or upgrade prompt.** These are role-based restrictions, not tier-based. Upgrading won't unlock them.
- **Grouped at the bottom** of each category section, visually de-emphasized (lighter text, no toggle control).

Features that are **tier-locked** (available at a higher tier but not the family's current tier) are displayed as "🔒" with the tier name. These ARE interactive — tapping shows which tier unlocks the feature, and provides a path to the plan comparison screen.

```
Legend in Permission Hub:
  [✓] Enabled by you          — tap to disable
  [ ] Disabled by you         — tap to enable  
  🔒 Available at Full Magic   — tap to see plan details
  ··· Not available for [role] — informational, no action
```

---

## New Table: `permission_level_profiles`

Seed data defining what each access level (Light/Balanced/Maximum) means for each role group.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| role_group | TEXT | | NOT NULL | Enum: 'dad_adult', 'special_adult', 'independent_teen', 'guided_kid', 'play_kid' |
| level | TEXT | | NOT NULL | Enum: 'light', 'balanced', 'maximum' |
| feature_key | TEXT | | NOT NULL | FK → feature_key_registry |
| feature_enabled | BOOLEAN | | NOT NULL | Whether this feature is ON at this level |
| default_permission_level | TEXT | 'view' | NOT NULL | Default Layer 3 permission: 'none', 'view', 'contribute', 'manage' |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**Unique constraint:** `(role_group, level, feature_key)`

**RLS Policy:** Read-only for all authenticated users (needed by client to display profiles). Write access admin-only.

> **Note:** Mom role group is excluded — mom always has access to everything her tier allows. No profile needed.

---

## Updated `member_feature_toggles` Table

Adding a column to track whether a toggle is blocked by tier (for display purposes):

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| member_id | UUID | | NOT NULL | FK → family_members |
| feature_key | TEXT | | NOT NULL | FK → feature_key_registry |
| enabled | BOOLEAN | true | NOT NULL | Mom's toggle. |
| blocked_by_tier | BOOLEAN | false | NOT NULL | **NEW:** True when the family's tier doesn't allow this feature for this member's role group. Displayed as 🔒. Recalculated on tier change. |
| applied_profile_level | TEXT | null | NULL | **NEW:** Which profile level was last applied ('light', 'balanced', 'maximum'). NULL if mom has manually adjusted since. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Unique constraint:** `(family_id, member_id, feature_key)`

### On Tier Change

When a family upgrades or downgrades:
1. Query all `member_feature_toggles` rows for the family.
2. For each row, re-evaluate Layer 1: check `feature_access_v2` for (feature_key, member's role_group) against the new tier.
3. Update `blocked_by_tier` accordingly.
4. Features that were blocked and are now tier-allowed: set `blocked_by_tier = false`. The `enabled` value is unchanged (whatever mom last set or the profile defaulted).
5. Features that were allowed and are now tier-blocked: set `blocked_by_tier = true`. The `enabled` value is preserved for if they upgrade again.

This means on downgrade, mom doesn't lose her configuration — it's just temporarily blocked. On re-upgrade, everything comes back as she had it.

---

## Complete Access Check Flow (Updated)

```
useCanAccess(featureKey: string, memberId?: string): {
  allowed: boolean,
  blockedBy: 'none' | 'tier' | 'toggle' | 'never',
  upgradeTier?: string  // which tier would unlock this
}

1. If no memberId provided, use current user's member_id

2. Get family's tier from family_subscriptions
   Get member's role + dashboard_mode from family_members
   Map to role_group: 
     primary_parent → 'mom'
     additional_adult → 'dad_adult'
     special_adult → 'special_adult'
     member + independent → 'independent_teen'
     member + guided → 'guided_kid'
     member + play → 'play_kid'

3. If role_group = 'mom':
   a. Check founding override:
      - families.is_founding_family = true
      - family_subscriptions.status = 'active'
      - families.founding_onboarding_complete = true
      → If all true: return { allowed: true, blockedBy: 'none' }
   b. Look up feature_access_v2(featureKey, 'mom')
   c. If min_tier = 'never': return { allowed: false, blockedBy: 'never' }
   d. If family tier >= min_tier: return { allowed: true, blockedBy: 'none' }
   e. Else: return { allowed: false, blockedBy: 'tier', upgradeTier: min_tier }

4. If role_group != 'mom':
   a. Check founding override (same as above — applies to all members)
      → If founding active: skip to step 4d
   b. Look up feature_access_v2(featureKey, role_group)
   c. If min_tier = 'never': return { allowed: false, blockedBy: 'never' }
   d. If family tier >= min_tier (or founding override):
      → Look up member_feature_toggles(member_id, featureKey)
      → If row exists and enabled = false: return { allowed: false, blockedBy: 'toggle' }
      → If row exists and blocked_by_tier = true: return { allowed: false, blockedBy: 'tier', upgradeTier: min_tier }
      → Else: return { allowed: true, blockedBy: 'none' }
   e. Else: return { allowed: false, blockedBy: 'tier', upgradeTier: min_tier }
```

**The `blockedBy` field** tells the UI which fallback to render:
- `'tier'` → show upgrade prompt (with tier-sampling option if credits available)
- `'toggle'` → show "Ask mom to enable" or "This feature is disabled"
- `'never'` → show "Not available for your account type" or hide entirely
- `'none'` → render the feature normally

---

## CLAUDE.md Additions from This Addendum

- [ ] Convention: Permission level profiles (Light/Balanced/Maximum) are seed data in `permission_level_profiles` table. No API calls. Mom selects on member creation; system pre-populates all `member_feature_toggles` and `member_permissions` rows from the profile.
- [ ] Convention: `member_feature_toggles` is pre-populated (not sparse). Every member has a row for every feature their role group could possibly access. Rows blocked by tier have `blocked_by_tier = true`.
- [ ] Convention: Layer 2 toggle OFF preserves Layer 3 `member_permissions` — they persist and are restored when the feature is re-enabled.
- [ ] Convention: Tier changes trigger a `blocked_by_tier` recalculation across all `member_feature_toggles` rows for the family. Mom's toggle states and Layer 3 permissions are never modified by tier changes.
- [ ] Convention: `useCanAccess()` returns `{ allowed, blockedBy, upgradeTier? }` — the `blockedBy` field drives which fallback UI to render (upgrade prompt, ask-mom message, or not-available indicator).
- [ ] Convention: `PermissionGate` accepts `tierFallback` and `toggleFallback` props in addition to the existing `fallback` prop. Falls back gracefully if new props aren't provided.
- [ ] Convention: AI Vault comments posting AND reading are mom-only (Never for all other role groups). Hearts follow `vault_browse` access.
- [ ] Convention: Changing a member's access level (Light/Balanced/Maximum) is a full reset of that member's toggles and permissions, not a merge. Mom is warned before applying.
- [ ] Convention: "Never" features appear as "···" in the Permission Hub — visible, non-interactive, de-emphasized. Tier-locked features appear as "🔒" — visible, interactive (shows upgrade info).

---

## DATABASE_SCHEMA.md Additions from This Addendum

New table: `permission_level_profiles` (seed data — role_group × level × feature_key × feature_enabled × default_permission_level)
Modified table: `member_feature_toggles` — added `blocked_by_tier` (BOOLEAN) and `applied_profile_level` (TEXT, nullable)
Edge Function added: `recalculate-tier-blocks` — triggered on tier change, recalculates `blocked_by_tier` for all family members

---

*End of PRD-31 Permission Matrix Addendum*
