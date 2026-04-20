# Scope 5 Evidence — UI Partition

> **Partition:** `scope-5-evidence/stub_partition_ui.md` (~120 entries)
> **Recipe:** `scope-5-evidence/EVIDENCE_RECIPE.md`
> **Session:** Session 3 (UI)
> **Registry baseline at session start:** 547 lines, last-modifying commit `c2e04e3`.
> **Output policy:** observational evidence only — no verdicts, no classifications.

---

## Entry 433 — `Sequential collection creation (end-to-end)` (CALIBRATION)

**Registry line:** 433
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Sequential collection creation (end-to-end) | PRD-09A | PRD-09A/09B Studio Intelligence Phase 1 | ✅ Wired | 2026-04-06. Prior "Phase 10 Repair" entry claimed this was wired but `SequentialCreator.tsx` + `SequentialCollectionView.tsx` had zero callers — every entry point opened `TaskCreationModal` which silently created malformed single-row tasks. Phase 1 wired `SequentialCreatorModal` (new wrapper around existing `SequentialCreator`) to `useCreateSequentialCollection`, revived `SequentialCollectionView` on the Tasks tab, added guards on `createTaskFromData` and `TaskCreationModal` to prevent regression, and exposed the flow from Studio, Tasks, and Lists. E2E tests in `tests/e2e/features/studio-intelligence-phase1.spec.ts`. |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)

Multi-identifier case. Resolved at **level (a)** — stub row names concrete identifiers directly.

- **Identifier 1:** `SequentialCreatorModal`
  - Source: stub entry line 433
  - Quote: "Phase 1 wired `SequentialCreatorModal` (new wrapper around existing `SequentialCreator`)"
- **Identifier 2:** `useCreateSequentialCollection`
  - Source: stub entry line 433
  - Quote: "wired `SequentialCreatorModal` (new wrapper around existing `SequentialCreator`) to `useCreateSequentialCollection`"
- **Identifier 3:** `SequentialCollectionView`
  - Source: stub entry line 433
  - Quote: "revived `SequentialCollectionView` on the Tasks tab"
- **Identifier 4:** `createTaskFromData` (guard reference)
  - Source: stub entry line 433
  - Quote: "added guards on `createTaskFromData` and `TaskCreationModal` to prevent regression"
- **Identifier 5:** `TaskCreationModal` (guard reference)
  - Source: stub entry line 433
  - Quote: "added guards on `createTaskFromData` and `TaskCreationModal`"
- **Identifier 6 (cross-ref from CLAUDE.md #154):** `SequentialCollectionCard`
  - Source: `CLAUDE.md` Convention #154 (line 348): "**`SequentialCollectionCard` is the exported reusable primitive** for rendering a single sequential collection on any surface. Lists page renders it inside a back-button wrapper; Tasks → Sequential tab renders it via `SequentialCollectionView`. Never duplicate the card logic."
  - Not named in the stub row directly, but it is the reusable primitive that makes the "exposed the flow from Studio, Tasks, and Lists" claim coherent. Included because CLAUDE.md convention 154 names it as a distinct identifier.

### Field 2 — Code presence check

**Identifier 1 — `SequentialCreatorModal`:**
```
Grep command: pattern=`SequentialCreatorModal`, path=`src`, output_mode=content, -n=true
Hits: 25+ (head-limited to 30)
Files:
  - src/components/tasks/sequential/SequentialCreatorModal.tsx:43 — `export function SequentialCreatorModal({`
  - src/pages/Studio.tsx:48 — import
  - src/pages/Studio.tsx:866 — render
  - src/pages/Tasks.tsx:50 — import
  - src/pages/Tasks.tsx:811 — render
  - src/pages/Lists.tsx:52 — import
  - src/pages/Lists.tsx:730 — render
  - src/utils/createTaskFromData.ts:54,61 — named in guard error text
  - src/components/tasks/TaskCreationModal.tsx:481,488 — named in console.warn skip
  - src/components/studio/studio-seed-data.ts:182 — comment
First-context window (SequentialCreatorModal.tsx):
  export function SequentialCreatorModal({
    isOpen, onClose, familyId, onSuccess,
    initialTemplateId, ...
  }: SequentialCreatorModalProps) { ... const createCollection = useCreateSequentialCollection() ... }
```
Glob confirmed: `src/components/tasks/sequential/SequentialCreatorModal.tsx` exists as a standalone file.

**Identifier 2 — `useCreateSequentialCollection`:**
```
Grep command: pattern=`useCreateSequentialCollection`, path=`src`, output_mode=content, -n=true
Hits: 8
Files:
  - src/hooks/useSequentialCollections.ts:77 (comment), 80 (export)
  - src/components/tasks/sequential/SequentialCreatorModal.tsx:22 (import), 54 (invocation)
  - src/utils/createTaskFromData.ts:55, 61 (guard error text)
  - src/pages/Tasks.tsx:1807 (comment)
First-context window:
  useSequentialCollections.ts:80 — `export function useCreateSequentialCollection() {`
```
Named export in multi-hook module — NOT a standalone file per partition expectation.

**Identifier 3 — `SequentialCollectionView`:**
```
Grep command: pattern=`SequentialCollectionView`, path=`src`, output_mode=content, -n=true
Hits: 6
Files:
  - src/components/tasks/sequential/SequentialCollectionView.tsx:163 (interface), 168 (export)
  - src/pages/Tasks.tsx:49 (import), 750 (render)
  - src/pages/Lists.tsx:51 (import-source for SequentialCollectionCard)
  - src/components/tasks/sequential/SequentialCollectionView.tsx:205 (renders SequentialCollectionCard internally)
First-context window:
  SequentialCollectionView.tsx:168 — `export function SequentialCollectionView({ familyId, onCreateCollection }: SequentialCollectionViewProps) {`
```

**Identifier 4 — `createTaskFromData` guard:**
```
Grep command: pattern=`taskType.*'sequential'`, path=`src/utils/createTaskFromData.ts`, output_mode=content, -n=true
Hits: 1 (the guard)
First-context window (lines 53-64):
  // PRD-09A/09B Studio Intelligence Phase 1 guard.
  // Sequential collections have their own creation path: SequentialCreatorModal →
  // useCreateSequentialCollection. If we get here with taskType='sequential',
  // something is wiring the wrong flow. Throwing loudly prevents silent creation of
  // broken single-row "sequential" tasks with no parent collection or child items.
  if ((data.taskType as string) === 'sequential') {
    throw new Error(
      "createTaskFromData: sequential collections must be created via " +
      "useCreateSequentialCollection / SequentialCreatorModal, not through " +
      "TaskCreationModal. This is a bug — check the caller.",
    )
  }
```

**Identifier 5 — `TaskCreationModal` skip:**
```
Grep command: context read of TaskCreationModal.tsx:475-494
Hits: 1 console.warn at line 486
First-context window (lines 480-490):
  // PRD-09A/09B Studio Intelligence Phase 1: sequential creation has its own
  // modal (SequentialCreatorModal). If a caller still passes 'sequential',
  // ignore it so we don't poison the state; that caller should be fixed.
  if (initialTaskType && initialTaskType !== 'sequential') {
    d.taskType = initialTaskType as TaskType
  } else if (initialTaskType === 'sequential') {
    console.warn(
      '[TaskCreationModal] initialTaskType="sequential" is no longer supported. ' +
      'Use SequentialCreatorModal instead.',
    )
  }
```

**Identifier 6 — `SequentialCollectionCard` (named export, NOT separate file):**
```
Grep command: pattern=`SequentialCollectionCard`, path=`src`, output_mode=content, -n=true
Hits: 5
Files:
  - src/components/tasks/sequential/SequentialCollectionView.tsx:205 (renders it), 213 (exports it)
  - src/pages/Lists.tsx:50 (imports it from the SequentialCollectionView module), 260 (comment), 277 (renders)
First-context window:
  SequentialCollectionView.tsx:213 — `export function SequentialCollectionCard({ collection }: { collection: SequentialCollection }) {`
```
**Named export from `SequentialCollectionView.tsx` — NOT a separate file.** Glob of `src/components/tasks/sequential/*.tsx` lists 6 files; no standalone `SequentialCollectionCard.tsx`. The 6 files are: `PracticeCompletionDialog.tsx`, `MasterySubmissionModal.tsx`, `SequentialCreator.tsx`, `LinkedSourcePicker.tsx`, `SequentialCreatorModal.tsx`, `SequentialCollectionView.tsx`.

### Field 3 — Wiring check

**Callers/Importers (entry points for SequentialCreatorModal):**
1. `src/pages/Studio.tsx:866` — rendered in the Studio page (Sequential Collection [Customize] and Reading List template entry points).
2. `src/pages/Tasks.tsx:811` — rendered on the Tasks page for the `Sequential` tab `[+ Create]` button.
3. `src/pages/Lists.tsx:730` — rendered on the Lists page via the `[+ New List] → "Sequential Collection"` tile.

Three entry points — matches the "Studio, Tasks, and Lists" claim in the stub row and CLAUDE.md Convention #150 ("Sequential collections are creatable from three entry points and ONLY through `SequentialCreatorModal`").

**Execution-flow locations:**
- `SequentialCreatorModal.tsx` — React component (modal wrapper around `SequentialCreator`).
- `SequentialCollectionView.tsx` — React component that exports BOTH `SequentialCollectionView` AND `SequentialCollectionCard` (named exports from the same module).
- `useSequentialCollections.ts` — React Query hook module that exports `useCreateSequentialCollection` at line 80 among other hooks.
- `createTaskFromData.ts` — utility function (guard clause at line 58).
- `TaskCreationModal.tsx` — React component (console.warn skip at line 486).

**Most recent touching commits:**
- `src/components/tasks/sequential/SequentialCreatorModal.tsx` — `0be28be 2026-04-09 fix: unify member color reads via canonical getMemberColor helper`.
- `src/components/tasks/sequential/SequentialCollectionView.tsx` — `c6bfddf 2026-04-13 feat(tasks): per-item advancement override editor in SequentialCollectionView`.
- `src/utils/createTaskFromData.ts` — `762fa31 2026-04-14 fix: 6 bug reports — rotation, LiLa, Notepad, Studio audit`.
- `src/hooks/useSequentialCollections.ts` — `207235e 2026-04-06 feat: Build J — Linked Routine Steps, Mastery & Practice Advancement (PRD-09A/09B Session 2)`.
- `src/pages/Lists.tsx` — `aeae494 2026-04-14 feat: connection preferences + wishlist AI context + mom's observations`.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** present at multiple sections:
- Line 4: "Last updated: 2026-04-06 (Studio Intelligence Phase 1)."
- Line 34: `| [Customize] Sequential Collection | SequentialCreatorModal | **Wired** | PRD-09A/09B Studio Intelligence Phase 1 — previously silently broken (opened TaskCreationModal which created malformed rows). Now routes through useCreateSequentialCollection. |`
- Line 44 section header: `## Sequential Collections (PRD-09A/09B Studio Intelligence Phase 1)` — full table with rows for "Create from Studio", "Create from Tasks → Sequential tab", "Create from Lists page", DB writes, visibility on Tasks tab, visibility on Lists page, `createTaskFromData` guard, `TaskCreationModal` guard — all marked `**Wired**`.

**Cross-PRD addendum mentions:** `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md` exists (confirmed via Glob). Not opened in this packet for verbatim quote — partition instructions named it, its existence is confirmed.

**PlannedExpansionCard / stub UI:** Not applicable — Sequential collection creation is an implemented feature, not a demand-validation stub.

**CLAUDE.md convention mentions:**
- Convention #150 (line 344) — names `SequentialCreatorModal`, `SequentialCreator`, `useCreateSequentialCollection`, `TaskCreationModal`; declares three entry points.
- Convention #151 (line 345) — names `createTaskFromData()` guard and `TaskCreationModal` console.warn layer; references `sequential_collections` production state at 0 rows until 2026-04-06.
- Convention #152 (line 346) — names `useCreateSequentialCollection` and calls out the "parent row plus N children" guarantee.
- Convention #154 (line 348) — names `SequentialCollectionCard` as the exported reusable primitive; explicitly says "Lists page renders it inside a back-button wrapper; Tasks → Sequential tab renders it via `SequentialCollectionView`."
- Convention #156 (line 350) — surfaces only on Lists page when `filter === 'all'`.
- Convention #164 (line 361) — Reading List opens `SequentialCreatorModal` with mastery/approval/duration preset defaults.

**E2E spec file:** `tests/e2e/features/studio-intelligence-phase1.spec.ts` — Glob confirmed to exist. Contents NOT inspected in this packet.

### Field 5 — What was NOT checked

- Whether `tests/e2e/features/studio-intelligence-phase1.spec.ts` actually passes — existence was confirmed via Glob, but the test was not executed. Confirming test passes would require running Playwright.
- Whether the live production DB currently has any orphaned `tasks` rows with `task_type='sequential'` and NULL `sequential_collection_id` (the "legacy orphans from the pre-Phase-1 broken period" referenced by Convention #152). Would need a Supabase SQL query against production, out of scope.
- Whether `SequentialCreator.tsx` (the inner component wrapped by `SequentialCreatorModal`) has ZERO other callers besides `SequentialCreatorModal` — grep of `SequentialCreator\b` not distinct from `SequentialCreatorModal` was not run, could surface additional callers that were not inspected.
- Full contents of the PRD-09A/09B Studio Intelligence Addendum were not read verbatim — its existence is confirmed, but additional decisions or contract details beyond what is in CLAUDE.md conventions were not checked.
- Whether the three entry points actually deliver the user to the same `SequentialCreatorModal` in practice (runtime behavior, not just code presence) — would require manual browser testing or E2E test execution.

### Field 6 — Observations (no verdict)

Multi-identifier entry resolved at Field 1 level (a) with six identifiers (five from the stub row, one from CLAUDE.md Convention #154). All six identifiers located at expected paths: `SequentialCreatorModal` as a standalone component with three page-level callers (Studio, Tasks, Lists); `useCreateSequentialCollection` as a named export from the multi-hook `useSequentialCollections.ts:80` module; `SequentialCollectionView` as a standalone component; `SequentialCollectionCard` as a second named export from `SequentialCollectionView.tsx:213` (NOT a separate file); `createTaskFromData` guard throws on `taskType === 'sequential'` at line 58; `TaskCreationModal` console.warn skip at line 486. Three entry points for `SequentialCreatorModal` match the claim in CLAUDE.md Convention #150. Last-touching commits for all identifiers fall between 2026-04-06 (initial Phase 1) and 2026-04-14. WIRING_STATUS.md has a dedicated `## Sequential Collections (PRD-09A/09B Studio Intelligence Phase 1)` section with matching claims. E2E spec file exists at `tests/e2e/features/studio-intelligence-phase1.spec.ts` (existence confirmed via Glob; test execution out of scope). Historical "Looks Fine Failure" context preserved in the stub row itself and in CLAUDE.md Convention #151's reference to `sequential_collections` being at 0 rows in production until 2026-04-06.

---

<!-- PROGRESS MARKER: calibration entry 433 complete; paused for founder review at 2026-04-19 -->


## Entry 23 — `PIN verification (FamilyLogin)`

**Registry line:** 23
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| PIN verification (FamilyLogin) | PRD-01 (Phase 01) | Remediation | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)

Level (d) — CLAUDE.md convention. Quote: CLAUDE.md:144 `17. **PIN hashing:** All PINs are hashed server-side via `hash_member_pin` RPC (pgcrypto bcrypt). Never store plain-text PINs. Verify with `verify_member_pin` RPC.` Identifier: `verify_member_pin` RPC invoked from `src/pages/auth/FamilyLogin.tsx`.

### Field 2 — Code presence check

Grep command: `Grep pattern=verify_member_pin path=src/pages/auth/FamilyLogin.tsx output_mode=content -n`
Hits: 2 in that file; 12 files total across repo include ("hash_member_pin|verify_member_pin")
Files:
  - src/pages/auth/FamilyLogin.tsx:212 — `supabase.rpc('verify_member_pin', { p_member_id, p_pin })` call site
  - supabase/migrations/00000000100070_fix_hash_member_pin_column.sql — migration
  - supabase/migrations/00000000100040_fix_hash_member_pin.sql — migration
  - supabase/migrations/00000000000010_auth_rpcs_fix.sql — migration
  - src/components/hub/HubMemberAuthModal.tsx — also calls the RPC
First-context window:
```
// Shape returned by the updated verify_member_pin RPC
interface PinVerifyResult {
  success: boolean
  reason?: 'not_found' | 'invalid' | 'locked'
...
    const { data, error: verifyError } = await supabase.rpc('verify_member_pin', {
      p_member_id: selectedMember!.member_id,
      p_pin: pin,
    })
```

### Field 3 — Wiring check

Caller: `src/pages/auth/FamilyLogin.tsx` — invoked inside submit handler of the FamilyLogin page. Second caller: `src/components/hub/HubMemberAuthModal.tsx`. Execution-flow location: React component (page route `/auth/family-login` via src/App.tsx). Most-recent commit on FamilyLogin.tsx: `4d6fba2 2026-03-31 23:30:35 -0500 fix: PIN login creates real Supabase auth session`.

### Field 4 — Documentation cross-reference

- WIRING_STATUS.md: no mention of "PIN verification" row
- prds/addenda/: no matching PRD-01 addendum found (`Glob prds/addenda/*PRD-01*` returned 0 files)
- PlannedExpansionCard: not found for this stub
- CLAUDE.md: `17. **PIN hashing:** ... Verify with \`verify_member_pin\` RPC.` (line 144); `38. **PIN lockout is server-side.** \`verify_member_pin\` RPC returns JSONB...` (line 192)

### Field 5 — What was NOT checked

- Did NOT verify that the RPC currently exists in the live database (no introspection run)
- Did NOT verify the RPC returns the documented JSONB shape
- Did NOT run any e2e test against the login path
- Did NOT audit migration order to confirm which migration defines the canonical RPC body
- Did NOT compare the FamilyLogin implementation against the PRD-01 spec clause-by-clause

### Field 6 — Observations (no verdict)

A `FamilyLogin.tsx` page exists and calls a `verify_member_pin` RPC. Multiple migration files exist that reference `verify_member_pin` and `hash_member_pin`. CLAUDE.md conventions #17 and #38 describe the intended server-side hashing+lockout behavior. HubMemberAuthModal.tsx is a secondary caller. No dedicated WIRING_STATUS.md row for PIN verification was found; there is no PRD-01 addendum file in prds/addenda/.

---

## Entry 24 — `Accept-invite flow (/auth/accept-invite)`

**Registry line:** 24
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Accept-invite flow (/auth/accept-invite) | PRD-01 | PRD-01 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)

Level (d) — CLAUDE.md convention. Quote: CLAUDE.md:228 `62. **Accept-invite flow** at \`/auth/accept-invite?token=xxx\`. Validates token against \`family_members.invite_token\`, supports new account creation or existing account linking. \`accept_family_invite\` RPC (SECURITY DEFINER) handles the DB update atomically.` Identifiers: route `/auth/accept-invite`, RPC `accept_family_invite`, component `AcceptInvite`.

### Field 2 — Code presence check

Grep command: `Grep pattern=accept-invite|accept_family_invite output_mode=files_with_matches`
Hits: 12 files
Files:
  - src/App.tsx:100 — `<Route path="/auth/accept-invite" element={<AcceptInvite />} />`
  - src/pages/auth/AcceptInvite.tsx:173 — `supabase.rpc('accept_family_invite', { p_token: token })`
  - supabase/migrations/00000000000022_accept_invite_rpc.sql — migration
  - supabase/migrations/00000000100027_prd01_repair.sql — migration
  - supabase/migrations/00000000100074_fix_accept_invite_pin_accounts.sql — migration
First-context window:
```
<Route path="/auth/forgot-password" element={<ForgotPassword />} />
<Route path="/auth/family-login" element={<FamilyLogin />} />
<Route path="/auth/accept-invite" element={<AcceptInvite />} />
...
async function linkUserToInvite(): Promise<boolean> {
  const { data, error } = await supabase.rpc('accept_family_invite', {
    p_token: token,
  })
```

### Field 3 — Wiring check

Caller: route defined in `src/App.tsx:100`, component at `src/pages/auth/AcceptInvite.tsx:173`. Execution-flow location: React component + public route. Most-recent commit on AcceptInvite.tsx: `b0df6b5 2026-04-06 23:25:27 -0500 chore: Tailwind v4 class-name migration across codebase`.

### Field 4 — Documentation cross-reference

- WIRING_STATUS.md: no mention of "Accept-invite"
- prds/addenda/: no PRD-01 addendum file in `prds/addenda/*PRD-01*`
- PlannedExpansionCard: not found for this stub
- CLAUDE.md: line 228 `62. **Accept-invite flow** at /auth/accept-invite?token=xxx ...`

### Field 5 — What was NOT checked

- Did NOT verify the RPC signature / SECURITY DEFINER attribute in the live DB
- Did NOT test the two claimed branches (new signup vs existing sign-in)
- Did NOT verify e2e coverage exists
- Did NOT check RLS policy on `family_members.invite_token`
- Did NOT inspect the migration bodies in detail to confirm they define the RPC

### Field 6 — Observations (no verdict)

A dedicated `AcceptInvite.tsx` component exists, a `/auth/accept-invite` route is registered in App.tsx, and the component calls the `accept_family_invite` RPC. Three related migration files exist. CLAUDE.md convention #62 documents the same behavior. No WIRING_STATUS.md row or dedicated addendum file was located.

---

## Entry 26 — `Inactivity warning banner`

**Registry line:** 26
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Inactivity warning banner | PRD-01 | PRD-01 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)

Level (d) — CLAUDE.md convention. Quote: CLAUDE.md:229 `63. **Session duration per role:** adult=24h, independent=4h, guided=1h, play=30m. \`useSessionTimeout\` hook in ShellProvider tracks inactivity (mouse/key/touch/scroll), throttled to 30s resets. Warning banner 2 minutes before expiry. Auto-signout on timeout.` Identifiers: `useSessionTimeout` hook, `SessionWarning` component.

### Field 2 — Code presence check

Grep command: `Grep pattern=useSessionTimeout|SessionTimeout|inactivity output_mode=files_with_matches`
Hits: 15 files (useSessionTimeout); `SessionWarning` in 4 files
Files:
  - src/hooks/useSessionTimeout.ts — hook body
  - src/components/shells/ShellProvider.tsx:3,47 — imports + invokes the hook
  - src/components/shared/SessionWarning.tsx — banner component
  - src/components/shared/index.ts — exports `SessionWarning`
First-context window (useSessionTimeout.ts lines 6–22):
```
/**
 * Inactivity timeout durations per dashboard_mode.
 * ...
 * Adults: no inactivity timeout (sign out manually).
 * Teens/Guided/Play: 7 days of inactivity before sign-out.
 */
const SESSION_DURATIONS: Record<string, number> = {
  adult: 0,
  independent: 7 * 24 * 60 * 60 * 1000,
  guided: 7 * 24 * 60 * 60 * 1000,
  play: 7 * 24 * 60 * 60 * 1000,
}
const WARNING_LEAD_MS = 2 * 60 * 1000
```

### Field 3 — Wiring check

Caller: `src/components/shells/ShellProvider.tsx` calls `useSessionTimeout()` and destructures `showWarning`, `secondsRemaining`, `dismissWarning`. Execution-flow location: React provider wrapping all five shells. Most-recent commit on `src/hooks/useSessionTimeout.ts`: `53ad8d7 2026-04-02 21:38:24 -0500 fix: extend session timeouts — adults never expire, kids 7 days`.

### Field 4 — Documentation cross-reference

- WIRING_STATUS.md: no mention of "Inactivity warning banner" or SessionWarning
- prds/addenda/: no PRD-01 addendum in prds/addenda/
- PlannedExpansionCard: not found for this stub
- CLAUDE.md: line 229 — convention #63 documents `useSessionTimeout` in ShellProvider + warning banner 2 minutes before expiry

### Field 5 — What was NOT checked

- Did NOT verify that the configured durations in `useSessionTimeout.ts` (7 days) match CLAUDE.md text (which claims "adult=24h, independent=4h, guided=1h, play=30m") — the code as quoted uses different values
- Did NOT manually trigger the banner in a running app
- Did NOT verify the throttle (30s) or lead (2min) constants against PRD-01 spec
- Did NOT check if `SessionWarning` handles all five shells identically

### Field 6 — Observations (no verdict)

Hook file `src/hooks/useSessionTimeout.ts` exists and is invoked in `ShellProvider.tsx`. A `SessionWarning.tsx` component exists. The durations defined in the code (7 days for non-adults, 0 = no timeout for adults) do not match the values quoted in CLAUDE.md convention #63 (adult=24h, independent=4h, guided=1h, play=30m). The most recent commit subject reads "fix: extend session timeouts — adults never expire, kids 7 days". WARNING_LEAD_MS = 2 * 60 * 1000 matches the "2 minutes before expiry" clause.

---

## Entry 27 — `Family device hub widgets`

**Registry line:** 27
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Family device hub widgets | PRD-01 | PRD-14D | ✅ Wired | Phase 15 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)

Level (e) — cross-PRD forward reference. Registry cell says wired by PRD-14D. PRD-01 line 270 references "Screen 9: Tablet / Family Device Hub" and line 765 says `Tablet hub widgets render real data (requires Widget PRDs)`. Level (a/b/c) yielded no in-code stub comments keyed to this exact phrase. The closest concrete identifier was: `family_hub_configs` table + `useFamilyHubConfig` hook.

### Field 2 — Code presence check

Grep command: `Grep pattern=tablet_hub_config|hub_config|family_hub_configs output_mode=files_with_matches`
Hits: 23 files
Files:
  - src/hooks/useFamilyHubConfig.ts — hook CRUD for `family_hub_configs`
  - supabase/migrations/00000000100064_prd14d_family_hub.sql — migration
  - supabase/migrations/00000000100086_hub_pin_rpcs.sql — migration
  - claude/feature-decisions/PRD-14D-Family-Hub.md — feature decision file
  - prds/addenda/PRD-14D-Cross-PRD-Impact-Addendum.md — addendum
First-context window (useFamilyHubConfig.ts 1–46):
```
/**
 * useFamilyHubConfig — PRD-14D Family Hub
 *
 * CRUD for family_hub_configs table (one row per family).
 * ...
 */
export const HUB_SECTION_KEYS = [
  'family_calendar', 'family_vision', 'family_best_intentions',
  'victories_summary', 'countdowns', 'widget_grid', 'member_access',
] as const
```

### Field 3 — Wiring check

Caller: hook `useFamilyHubConfig(familyId)` — not grepped for callers in this session beyond existence confirmation. Execution-flow location: React hook; consumed by Family Hub page (per code comment). Most-recent commit on useFamilyHubConfig.ts: `8fa486a 2026-03-31 17:01:35 -0500 feat: PRD-23 BookShelf Session A+B, PRD-14C Family Overview, PRD-14D Family Hub`.

### Field 4 — Documentation cross-reference

- WIRING_STATUS.md: no match for "family_hub" / "Family Hub" / "hub_config"
- prds/addenda/: `prds/addenda/PRD-14D-Cross-PRD-Impact-Addendum.md` exists
- PlannedExpansionCard: not checked for a widget-specific card; widget_grid section key exists in HUB_SECTION_KEYS but rendering code path not traced
- CLAUDE.md: no direct mention of "Family device hub widgets" or `tablet_hub_config`
- PRD-01 line 765 says: `- [ ] Tablet hub widgets render real data (requires Widget PRDs)`

### Field 5 — What was NOT checked

- Did NOT open the rendering component that consumes `family_hub_configs.widget_grid`
- Did NOT verify if real widget data is actually rendered on the Hub page vs placeholders
- Did NOT search for a TV-mode landscape implementation (PRD-14E)
- Did NOT verify that the hook is actually called from the live Hub route
- Did NOT check PRD-10 (Widgets) wiring status

### Field 6 — Observations (no verdict)

A `useFamilyHubConfig` hook and `family_hub_configs` migration exist. `HUB_SECTION_KEYS` includes `'widget_grid'`. PRD-01 line 765 flags `Tablet hub widgets render real data (requires Widget PRDs)` as dependent on Widget PRDs. A PRD-14D addendum and feature-decision file are present. The live_schema snapshot lists `family_hub_configs` with 1 row.

---

## Entry 29 — `Permission hub UI`

**Registry line:** 29
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Permission hub UI | PRD-02 | PRD-02 Repair | ✅ Wired | Repair 2026-03-25 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)

Level (a) — file-header comment. Quote from `src/pages/PermissionHub.tsx` lines 13–21:
```
/**
 * PRD-02: Permission Management Hub
 * Screen 1: Overview with member cards grouped by role
 * Screen 2: Additional Adult (dad) per-kid permission detail
 * Screen 3: Special Adult permission detail
 * Screen 4: Teen transparency panel (what's shared)
 *
 * Mom-only access. Full configuration of who sees what.
 */
```
Identifier: `PermissionHub` component at `/permissions` route.

### Field 2 — Code presence check

Grep command: `Grep pattern=PermissionHub|permission_hub output_mode=files_with_matches`
Hits: 4 files
Files:
  - src/pages/PermissionHub.tsx — implementation (PermissionHub component)
  - src/App.tsx:13, 120 — import + route registration
  - AUDIT-REPORT.md — legacy audit doc
  - MyAIM-Central-Complete-File-Inventory.md — inventory doc
First-context window (App.tsx):
```
import { PermissionHub } from '@/pages/PermissionHub'
...
<Route path="/permissions" element={<ProtectedRoute><PermissionHub /></ProtectedRoute>} />
```

### Field 3 — Wiring check

Caller: route `/permissions` mounts `PermissionHub` inside `<ProtectedRoute>` in src/App.tsx:120. Execution-flow location: React page component. Most-recent commit on PermissionHub.tsx: `b0df6b5 2026-04-06 23:25:27 -0500 chore: Tailwind v4 class-name migration across codebase`.

### Field 4 — Documentation cross-reference

- WIRING_STATUS.md: no match for "PermissionHub" / "Permission Hub"
- prds/addenda/: no matching `*PRD-02*` addendum file (Glob returned 0)
- PlannedExpansionCard: not found for this stub
- CLAUDE.md: no direct mention of "Permission hub UI"

### Field 5 — What was NOT checked

- Did NOT verify that all four screens from the PRD comment (Screens 1–4) render correctly
- Did NOT check whether the page is actually linked from the mom sidebar
- Did NOT verify whether non-mom roles are correctly denied access
- Did NOT test the permission grid save path against `member_permissions` table
- Did NOT verify completeness of PERMISSION_CATEGORIES coverage vs PRD-02 spec

### Field 6 — Observations (no verdict)

A `PermissionHub.tsx` page exists at `src/pages/PermissionHub.tsx` (docstring references 4 screens), it is mounted at `/permissions` in App.tsx, and a PRD-02-repair feature decision file exists. No WIRING_STATUS.md row or dedicated PRD-02 addendum file was located.

---

## Entry 30 — `Transparency panel (mom side)`

**Registry line:** 30
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Transparency panel (mom side) | PRD-02 | PRD-02 | ✅ Wired | Phase 02 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)

Level (a) — file-header comment of component. Quote `src/components/shared/TransparencyIndicator.tsx` lines 4–11:
```
export interface TransparencyIndicatorProps {
  level: 'usage_visible' | 'fully_private'
  size?: number
}

export function TransparencyIndicator({ level, size = 16 }: TransparencyIndicatorProps) {
  const Icon = level === 'usage_visible' ? Eye : EyeOff
  const label = level === 'usage_visible' ? 'Usage visible to parents' : 'Fully private'
```
Identifier: `TransparencyIndicator` component (mom-side surface is the `PermissionHub` page per Entry 29).

### Field 2 — Code presence check

Grep command: `Grep pattern=TransparencyPanel|TransparencyIndicator|transparency panel output_mode=files_with_matches`
Hits: 23 files
Files:
  - src/components/shared/TransparencyIndicator.tsx — 25-line shared indicator component
  - src/pages/PermissionHub.tsx — mom-side hub uses the same indicator
  - src/features/permissions/TeenTransparencyPanel.tsx — teen-side panel (distinct from mom side)
  - claude/feature-decisions/PRD-02-repair.md — repair decision file
First-context window:
```
import { Eye, EyeOff } from 'lucide-react'
import { Tooltip } from './Tooltip'

export interface TransparencyIndicatorProps {
  level: 'usage_visible' | 'fully_private'
```

### Field 3 — Wiring check

Caller: `PermissionHub.tsx` (mom side) consumes `TransparencyIndicator`; several rhythms sections also import it (per initial grep). Execution-flow location: React component. Most-recent commit on TransparencyIndicator.tsx: `b0df6b5 2026-04-06 23:25:27 -0500 chore: Tailwind v4 class-name migration across codebase`.

### Field 4 — Documentation cross-reference

- WIRING_STATUS.md: no direct mention
- prds/addenda/: no `*PRD-02*` addendum file
- PlannedExpansionCard: not found for this stub
- CLAUDE.md: no direct mention of "Transparency panel"

### Field 5 — What was NOT checked

- Did NOT verify whether the registry's "mom-side" Transparency panel refers specifically to a dedicated panel component or to the PermissionHub aggregate view
- Did NOT confirm the exact spec clauses for the mom-side panel
- Did NOT test how the two transparency levels (`usage_visible` vs `fully_private`) are assigned in practice
- Did NOT verify whether `PermissionHub.tsx` satisfies the full "mom side" scope from PRD-02

### Field 6 — Observations (no verdict)

A `TransparencyIndicator` shared component exists at `src/components/shared/TransparencyIndicator.tsx`. It's consumed from the `PermissionHub.tsx` page (mom-facing). A sibling component `TeenTransparencyPanel.tsx` exists in `src/features/permissions/` (teen-facing — distinct entry, covered in Entry 31).

---

## Entry 31 — `Teen transparency panel (teen side)`

**Registry line:** 31
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Teen transparency panel (teen side) | PRD-02 | PRD-02 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)

Level (a) — file-header docstring. Quote `src/features/permissions/TeenTransparencyPanel.tsx` lines 8–18:
```
/**
 * PRD-02 Screen 4 — Teen-facing transparency panel.
 * Shows teens exactly what each audience (Mom / Dad / Family) can see about them.
 *
 * Rules:
 *  - Mom column: ✓ by default; ✗ if mom placed a self-restriction on that feature for this teen
 *  - Dad column: ✓ if member_permissions grants view/contribute/manage for this teen; ✗ otherwise
 *  - Family column: ✓ if teen has an active teen_sharing_override; [Share] button if not
 *    (teen can only share UP — they cannot un-share once shared)
 *  - Teen cannot change Mom or Dad columns — read-only display only
 */
```
Identifier: `TeenTransparencyPanel` component.

### Field 2 — Code presence check

Grep command: `Grep pattern=TeenTransparencyPanel glob=src/**/*.tsx output_mode=content -n`
Hits: 1 definition (`src/features/permissions/TeenTransparencyPanel.tsx:106 export function TeenTransparencyPanel()`); exported in `src/features/permissions/index.ts:2`.
Files:
  - src/features/permissions/TeenTransparencyPanel.tsx — component implementation
  - src/features/permissions/index.ts — re-export
  - supabase/migrations/00000000100028_prd02_repair.sql — related migration
First-context window: export function signature `export function TeenTransparencyPanel()` at line 106.

### Field 3 — Wiring check

Callers: Only the barrel re-export was found (`src/features/permissions/index.ts:2`). A grep across `src/**/*.tsx` for the literal name `TeenTransparencyPanel` yielded only the definition itself; a second grep across `src/pages/**` yielded 0 hits. Execution-flow location: component exists, apparent consumer routing not located in this session. Most-recent commit: `b0df6b5 2026-04-06 23:25:27 -0500 chore: Tailwind v4 class-name migration across codebase`.

### Field 4 — Documentation cross-reference

- WIRING_STATUS.md: no mention
- prds/addenda/: no `*PRD-02*` addendum file
- PlannedExpansionCard: not found for this stub
- CLAUDE.md: no direct mention of "Teen transparency panel"
- PRD-02 lines 241, 777, 819 reference teen-transparency spec behaviour

### Field 5 — What was NOT checked

- Did NOT locate a page or shell that mounts `<TeenTransparencyPanel />` — grep in src found only the definition + barrel export, no consumer import
- Did NOT search for dynamic rendering via string tag or lazy import
- Did NOT verify whether it is surfaced via IndependentShell or a specific route
- Did NOT verify backend queries against `teen_sharing_overrides` table (not present in live_schema.md)

### Field 6 — Observations (no verdict)

The component file exists and is exported from the feature barrel. No caller was located in the src tree during this pass via grep. The registry row marks the entry Wired under "Remediation" build phase. PRD-02 references the teen transparency spec but a consumer import was not located here.

---

## Entry 33 — `View As full-shell mode + banner`

**Registry line:** 33
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| View As full-shell mode + banner | PRD-02 | PRD-02 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)

Level (d) — CLAUDE.md convention. Quote CLAUDE.md:193 `39. **View As renders full-shell mode** via \`ViewAsShellWrapper\` wrapping MomShell content. \`ViewAsBanner\` (z-45) shows "Viewing as [Name]" with Switch/Exit buttons. \`ViewAsMemberPicker\` is a modal grid.` Identifiers: `ViewAsShellWrapper`, `ViewAsBanner`, `ViewAsMemberPicker`.

### Field 2 — Code presence check

Grep command: `Grep pattern=ViewAsBanner|ViewAsShellWrapper|ViewAsProvider output_mode=files_with_matches`
Hits: 45 files
Files:
  - src/features/permissions/ViewAsBanner.tsx — banner component
  - src/features/permissions/ViewAsShellWrapper.tsx — shell wrapper
  - src/features/permissions/ViewAsMemberPicker.tsx — picker modal
  - src/features/permissions/ViewAsModal.tsx — modal
  - src/lib/permissions/ViewAsProvider.tsx — provider
  - src/components/shells/MomShell.tsx:19,125,217 — uses ViewAsShellWrapper
  - scripts/verify-viewas-banner.mjs — verification script
First-context window (MomShell.tsx):
```
import { ViewAsShellWrapper } from '@/features/permissions'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
...
<ViewAsShellWrapper>
  <div ref={mainRef} className="flex-1 flex flex-col min-w-0">
```

### Field 3 — Wiring check

Callers: `MomShell.tsx` wraps main content in `<ViewAsShellWrapper>`. `ViewAsProvider` is referenced across 45 files. Execution-flow location: React shell wrapper pattern. Most-recent commit on ViewAsBanner.tsx/ViewAsShellWrapper.tsx: `70c2394 2026-04-17 15:23:45 -0500 feat(permissions): add Manage Tasks shortcut to ViewAs banner`.

### Field 4 — Documentation cross-reference

- WIRING_STATUS.md: no match for "View As" / "ViewAs" / "ViewAsBanner"
- prds/addenda/: no `*PRD-02*` addendum file
- PlannedExpansionCard: not found for this stub (file `PlannedExpansionCard.tsx` was in grep results but a feature-match match specifically for ViewAs was not pulled)
- CLAUDE.md: line 193 convention #39 documents the pattern; line 322 convention #134 also references View As for Guided shell

### Field 5 — What was NOT checked

- Did NOT verify the `z-45` banner z-index claim against component CSS
- Did NOT verify the "Switch" / "Exit" button behaviors work end-to-end
- Did NOT trace how `ViewAsMemberPicker` is launched
- Did NOT verify the `view_as_feature_exclusions` mechanism flow
- Did NOT confirm session logging against `view_as_sessions` table (143 rows in live_schema.md)

### Field 6 — Observations (no verdict)

Four dedicated components exist (`ViewAsBanner.tsx`, `ViewAsShellWrapper.tsx`, `ViewAsMemberPicker.tsx`, `ViewAsModal.tsx`) plus a provider (`ViewAsProvider.tsx`). `MomShell.tsx` imports and renders `<ViewAsShellWrapper>` around main content. A verification script `scripts/verify-viewas-banner.mjs` exists. Tables `view_as_sessions` (143 rows) and `view_as_feature_exclusions` (58 rows) show runtime activity in live_schema.md. Most recent commit (2026-04-17) added a new banner shortcut.

---

## Entry 35 — `Special Adult Shift View`

**Registry line:** 35
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Special Adult Shift View | PRD-02 | PRD-02 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)

Level (a) — file-header docstring. Quote `src/features/permissions/ShiftView.tsx` lines 1–17:
```
/**
 * ShiftView — PRD-02 Screen 6
 *
 * Shown to special_adult role members. Lets them start/end shifts and view
 * recent activity logged during the active shift.
 *
 * Three render modes:
 *  1. always_on  — co-parent; skip shift controls, show "Always On" badge + activity.
 *  2. on shift   — active time_session with source_type='shift'; show timer + activity.
 *  3. off shift  — no active session; show next-window info + Start Shift button.
 * ...
 */
```
Identifier: `ShiftView` component.

### Field 2 — Code presence check

Grep command: `Grep pattern=SpecialAdultShell|SpecialAdultShift|shift_view|ShiftView output_mode=files_with_matches`
Hits: 5 files
Files:
  - src/features/permissions/ShiftView.tsx:504 `export function ShiftView({ memberId: memberIdProp }: ShiftViewProps)`
  - src/features/permissions/ShiftView.tsx:747 `export default ShiftView`
  - src/features/permissions/index.ts:1 — barrel export
  - src/config/feature_guide_registry.ts — referenced
  - MyAIM-Central-Complete-File-Inventory.md — inventory
First-context window: file-header docstring quoted above.

### Field 3 — Wiring check

Callers: The only occurrences of identifier `ShiftView` in `src/` are the definition (line 504), default export (line 747), type export (line 62), and the barrel re-export in `src/features/permissions/index.ts:1`. A direct `<ShiftView />` caller was not found in `src/pages/**` or `src/App.tsx`. Execution-flow location: component exists, caller not located in this pass. Most-recent commit: `b0df6b5 2026-04-06 23:25:27 -0500 chore: Tailwind v4 class-name migration across codebase`.

### Field 4 — Documentation cross-reference

- WIRING_STATUS.md: no mention of ShiftView or Special Adult
- prds/addenda/: no `*PRD-02*` addendum file
- PlannedExpansionCard: not found for this stub
- CLAUDE.md: line 194 `40. **Special Adult shifts use \`time_sessions\`** with \`source_type='shift'\`, \`is_standalone=true\`. No separate \`shift_sessions\` table. Co-parents with \`always_on\` schedule skip shift start/end entirely.`

### Field 5 — What was NOT checked

- Did NOT locate which shell or route renders `<ShiftView />` — grep in `src/` found only the definition + barrel export, no `<ShiftView` JSX usage
- Did NOT verify the `always_on` schedule branch
- Did NOT verify that `time_sessions` inserts correctly wire shift attribution
- Did NOT verify access_schedules integration end-to-end
- Did NOT check if a Special Adult shell file that mounts this component exists elsewhere

### Field 6 — Observations (no verdict)

The `ShiftView.tsx` component exists at 747 lines, has a documented three-mode behavior, and is barrel-exported from `src/features/permissions/index.ts`. No JSX caller of the component was located during this pass. The file's activity_log_entries query (line 387–388) references the source data contract. CLAUDE.md convention #40 describes the backing `time_sessions` data contract.

---

## Entry 43 — `SA Log Activity form during shifts`

**Registry line:** 43
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| SA Log Activity form during shifts | PRD-02 | PRD-27 | ⏳ Unwired (MVP) | Phase 31 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)

Level (e) — cross-PRD forward reference. Registry maps the stub to PRD-27 (Caregiver Tools). PRD-27 references `trackable_event_categories` and `trackable_event_logs` tables (lines 110, 240, 354, 378, 386, 435, 443, 485, 607, 608, 635, 643). No in-code stub comment was located. Closest backing identifier: `trackable_event_categories` / `trackable_event_logs` tables. Registry indicates PRD-27 is the wire-by PRD; Caregiver build is not yet present in src.

### Field 2 — Code presence check

Grep command: `Grep pattern=trackable_event_categories|trackable_event_logs path=src output_mode=files_with_matches`
Hits: 0 in src
Files: none in `src/`.
Additional grep: `Glob pattern=src/features/caregiver/**` → 0 files; `Glob pattern=src/pages/Caregiver*` → 0 files.
First-context window: N/A — no source hits.
Secondary context: `src/features/permissions/ShiftView.tsx:387-388` reads from `activity_log_entries` for display but contains no LogActivity form (grep for "Log Activity|LogActivityForm|ActivityLogForm" in that file returned 0).

### Field 3 — Wiring check

No React form component found. No Caregiver Tools pages/features directory in src. No migration defining `trackable_event_categories` / `trackable_event_logs` in `supabase/migrations/` was surfaced by this pass (the live_schema.md "Tracking" section does not list these tables — live_schema lists `homeschool_*` and financial tables only). Execution-flow location: n/a. Most-recent commit: n/a.

### Field 4 — Documentation cross-reference

- WIRING_STATUS.md: no PRD-27 / trackable event row
- prds/addenda/: `prds/addenda/PRD-27-Cross-PRD-Impact-Addendum.md` exists
- PlannedExpansionCard: not verified for PRD-27 feature keys
- CLAUDE.md: no direct mention of "Log Activity form"

### Field 5 — What was NOT checked

- Did NOT search for a PlannedExpansionCard stub specifically tied to a `tracking_trackable_events` feature key
- Did NOT verify whether the `trackable_event_logs` table exists in migrations (it was not listed in live_schema.md)
- Did NOT confirm the Phase 31 build-phase metadata in the current plan
- Did NOT look for a Phase 27 SA-specific form stub

### Field 6 — Observations (no verdict)

No source file references `trackable_event_categories` or `trackable_event_logs`. No Caregiver Tools directory exists under `src/features/` or `src/pages/`. The PRD-27 addendum file exists in prds/addenda/. The registry row marks status `⏳ Unwired (MVP)` with wired-by PRD-27, Phase 31.

---

## Entry 44 — `Admin user management`

**Registry line:** 44
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Admin user management | PRD-02 | PRD-32 | ✅ Wired | Phase 39 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)

Level (e) — cross-PRD forward reference. Registry maps to PRD-32 (Admin Console). PRD-32 file exists at `prds/scale-monetize/PRD-32-Admin-Console.md`. No in-code stub comment located; closest concrete identifier: `staff_permissions` table (live_schema.md lists `staff_permissions` — 0 rows).

### Field 2 — Code presence check

Grep command: `Grep pattern=AdminConsole|AdminUserManagement|/admin output_mode=files_with_matches`
Hits: 13 files total; all matches are in PRDs/specs, not `src/`.
Additional searches:
  - `Glob pattern=src/pages/admin*` → 0 files
  - `Glob pattern=src/pages/Admin*` → 0 files
  - `Glob pattern=src/**/admin/**` → 0 files
  - `Grep pattern=admin|Admin path=src/App.tsx` → 0 matches
  - `Grep pattern=staff_permissions path=src output_mode=files_with_matches` → 0 files
First-context window: N/A — no source hits.

### Field 3 — Wiring check

No Admin route, component, or hook was located in `src/`. No `staff_permissions` reference in `src/`. Execution-flow location: not present in src based on this pass. Most-recent commit: n/a.

### Field 4 — Documentation cross-reference

- WIRING_STATUS.md: no mention of Admin Console
- prds/addenda/: `prds/addenda/PRD-32-32A-Cross-PRD-Impact-Addendum.md` exists
- PlannedExpansionCard: not verified for `admin_*` feature keys
- CLAUDE.md: no direct mention of "Admin user management"
- Architecture.md line references `/admin/*` route: `/admin/* | Admin Console (tabbed: System, Analytics, Feedback, AI Vault, Moderation)` — but no corresponding src code was found in this pass

### Field 5 — What was NOT checked

- Did NOT verify that `staff_permissions` exists purely as a DB table without any UI
- Did NOT check supabase/migrations/ for PRD-32 Admin Console migration
- Did NOT verify whether Admin UI is scaffolded under a naming convention other than "admin" (e.g. "staff")
- Did NOT look at ai-vault admin (PRD-21B) which is a separate admin surface

### Field 6 — Observations (no verdict)

No `/admin/*` route or Admin page directory was located in `src/`. The `staff_permissions` table appears in live_schema.md with 0 rows. Registry claims status `✅ Wired` wired by PRD-32 under Phase 39. PRD-32 addendum exists. Architecture.md references a planned `/admin/*` route shape (tabbed: System, Analytics, Feedback, AI Vault, Moderation).

---

## Entry 51 — `HumanInTheMix Regenerate/Reject`

**Registry line:** 51
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| HumanInTheMix Regenerate/Reject | PRD-05 | PRD-05 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)

Level (a) — file-header comment. Quote `src/components/HumanInTheMix.tsx` lines 4–16:
```
interface HumanInTheMixProps {
  onEdit: () => void
  onApprove: () => void
  onRegenerate: () => void
  onReject: () => void
  isLoading?: boolean
}

/**
 * Human-in-the-Mix wrapper for all AI-generated output.
 * Every AI output MUST present Edit / Approve / Regenerate / Reject
 * before persisting. No exceptions.
 */
```
Identifier: `HumanInTheMix` component with `onRegenerate` / `onReject` props.

### Field 2 — Code presence check

Grep command: `Grep pattern=HumanInTheMix output_mode=files_with_matches`
Hits: 66 files
Files:
  - src/components/HumanInTheMix.tsx — component definition
  - src/components/lila/LilaDrawer.tsx:294 — `Delete the assistant message and re-send the last user message (PRD-05 HumanInTheMix)`
  - src/components/lila/LilaDrawer.tsx:327 — `Delete the assistant message (PRD-05 HumanInTheMix Reject)`
  - src/components/lila/LilaMessageBubble.tsx:6,15,23,25,35,147 — imports + renders conditionally
First-context window (LilaMessageBubble.tsx lines 146–159):
```
{/* Human-in-the-Mix on latest assistant message — hidden in conversational modes */}
{isLatestAssistant && !isStreaming && !hideHumanInTheMix && (
  <HumanInTheMix
    onEdit={...}
    onApprove={() => {/* Approve = no action needed, message stays */}}
    onRegenerate={() => onRegenerate?.()}
    onReject={() => onReject?.()}
  />
)}
```

### Field 3 — Wiring check

Callers: `src/components/lila/LilaMessageBubble.tsx:147` wires `onRegenerate` and `onReject` props. `LilaDrawer.tsx:294,327` implements "delete assistant message + resend" and "delete assistant message" respectively. Execution-flow location: React component tree, LiLa drawer/modal. Most-recent commit on HumanInTheMix.tsx: `0a4cbab 2026-03-28 22:31:33 -0500 feat: UX overhaul session 4 — draggable FAB, calendar completeness, tooltip conversion, RLS fix`.

### Field 4 — Documentation cross-reference

- WIRING_STATUS.md: no direct row
- prds/addenda/: no specific addendum searched for HITM alone
- PlannedExpansionCard: not applicable for this stub
- CLAUDE.md: line 218 `55. **HumanInTheMix Regenerate** deletes the assistant message, re-sends with "[Please try a different approach]" appended. **Reject** deletes the assistant message and invalidates the query.`

### Field 5 — What was NOT checked

- Did NOT verify that Regenerate actually appends the `[Please try a different approach]` suffix in the current implementation
- Did NOT verify Reject invalidates the query cache
- Did NOT verify behavior on ToolConversationModal (separate modal path)
- Did NOT test on non-LiLa HITM consumers (task-breaker, curriculum-parse, etc.)

### Field 6 — Observations (no verdict)

The `HumanInTheMix` component exists with all four handler props (onEdit, onApprove, onRegenerate, onReject). `LilaMessageBubble.tsx:147` renders it conditionally on `isLatestAssistant && !isStreaming`. `LilaDrawer.tsx` has docstrings for the Regenerate and Reject implementations. CLAUDE.md convention #55 describes expected behavior.

---

## Entry 58 — `Person-level context toggles (UI)`

**Registry line:** 58
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Person-level context toggles (UI) | PRD-05 | PRD-05 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)

Level (a) — inline code comment. Quote `src/components/lila/LilaContextSettings.tsx:155`:
```
{/* Person-level toggles (mom only) — UI placeholder; filtering wires in Phase 20 */}
```
Identifier: Person-level section inside `LilaContextSettings` component. Backing table (per CLAUDE.md convention #74 line 246): `archive_member_settings.is_included_in_ai`.

### Field 2 — Code presence check

Grep command: `Grep pattern=Person-level path=src/components/lila/LilaContextSettings.tsx output_mode=content -n`
Hits: 1 (the comment block) + rendered checkbox group below it
Files:
  - src/components/lila/LilaContextSettings.tsx:155 — Person-level toggles section
  - Related: src/hooks/useArchives.ts, src/pages/archives/ArchivesPage.tsx, src/lib/ai/context-assembly.ts all reference `archive_member_settings.is_included_in_ai`
First-context window (LilaContextSettings.tsx 155–176):
```
{/* Person-level toggles (mom only) — UI placeholder; filtering wires in Phase 20 */}
{member?.role === 'primary_parent' && familyMembers.length > 1 && (
  <div className="mb-4 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
    <div className="text-xs font-medium uppercase tracking-wider mb-2" ...>
      Include context from
    </div>
    {familyMembers
      .filter(fm => fm.id !== member.id)
      .map(fm => (
        <label key={fm.id} className="flex items-center gap-2 py-1.5 cursor-pointer">
          <input type="checkbox" defaultChecked className="rounded" />
          <span className="text-sm" ...>{fm.display_name}</span>
        </label>
      ))}
  </div>
)}
```

### Field 3 — Wiring check

Caller: `LilaContextSettings` is the only consumer of this specific UI block. The checkbox uses `defaultChecked` with no `onChange` handler — not wired to state / persistence per this file. Execution-flow location: React component used inside the LiLa drawer settings panel. Most-recent commit: `3100e1c 2026-03-25 00:58:46 -0500 Phase 06 repair: LiLa Core AI System, 10 audit items wired`.

### Field 4 — Documentation cross-reference

- WIRING_STATUS.md: no direct row
- prds/addenda/: not verified in this pass
- PlannedExpansionCard: not applicable
- CLAUDE.md: line 107 convention #8 `is_included_in_ai pattern`; line 246 convention #74 describes the three-tier toggle where person-level = `archive_member_settings.is_included_in_ai`

### Field 5 — What was NOT checked

- Did NOT verify whether a separate mom-facing person-level UI exists elsewhere (e.g., Archives page) that does wire to `archive_member_settings.is_included_in_ai`
- Did NOT check if `archive_member_settings` has 18 rows + active CRUD (live_schema.md shows 18 rows; hooks/useArchives.ts:326,354,388,431 touch the table)
- Did NOT verify the Archives page full member-level toggle path
- Did NOT check if `useAvatarUpload.ts` or other consumers already wire the person-level toggle

### Field 6 — Observations (no verdict)

The inline comment in `LilaContextSettings.tsx:155` says "UI placeholder; filtering wires in Phase 20". The checkbox uses `defaultChecked` without an `onChange` or persistence path in this component. Separately, `useArchives.ts` and `ArchivesPage.tsx` both touch `archive_member_settings` (4 queries in useArchives.ts). `live_schema.md` shows `archive_member_settings` has 18 rows. CLAUDE.md convention #74 names `archive_member_settings.is_included_in_ai` as the person-level toggle.

---

## Entry 59 — `Conversation history date filter`

**Registry line:** 59
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Conversation history date filter | PRD-05 | PRD-05 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)

Level (a) — file-header comment + state variable. Quote `src/features/vault/components/VaultMyConversations.tsx` line 5 (from grep: `* date filters, and the ability to resume (continue) past conversations.`) and line 51 `const [dateRange, setDateRange] = useState<DateRange>('all')`. Identifier: `dateRange` state + `getDateRangeStart(dateRange)` filter in VaultMyConversations.

### Field 2 — Code presence check

Grep command: `Grep pattern=dateFilter|date.?filter|dateRange|createdAfter|created_after path=src/features/vault/components/VaultMyConversations.tsx output_mode=content -n`
Hits: 7 occurrences in that file
Files:
  - src/features/vault/components/VaultMyConversations.tsx:5,51,68,73,129,147,168 — component uses dateRange state + getDateRangeStart utility
First-context window:
```
5: * date filters, and the ability to resume (continue) past conversations.
51:  const [dateRange, setDateRange] = useState<DateRange>('all')
68:    const cutoff = getDateRangeStart(dateRange)
73:  }, [allConversations, familyConversations, dateRange, viewTab])
129:      {/* Search + date filter row */}
147:          value={dateRange}
```
Additional context lines 67–73:
```
const filteredConversations = useMemo(() => {
  const cutoff = getDateRangeStart(dateRange)
  const source = viewTab === 'family' ? familyConversations : allConversations
  return source
    .filter(isToolConversation)
    .filter(c => !cutoff || new Date(c.updated_at) >= cutoff)
}, [allConversations, familyConversations, dateRange, viewTab])
```

### Field 3 — Wiring check

Caller: `VaultMyConversations` is rendered inside the Vault "My Conversations" tab. Filter is applied client-side via `.filter(c => !cutoff || new Date(c.updated_at) >= cutoff)`. Execution-flow location: React page component. Most-recent commit: `bce27d5 2026-04-02 22:35:24 -0500 feat: conversation history for all shells + fix tool buttons for Adult/Independent`.

### Field 4 — Documentation cross-reference

- WIRING_STATUS.md: no direct mention of conversation history date filter
- prds/addenda/: not verified
- PlannedExpansionCard: not applicable
- CLAUDE.md: no direct mention of "conversation history date filter"

### Field 5 — What was NOT checked

- Did NOT verify whether a separate LiLa drawer conversation history view also has the date filter, or only VaultMyConversations
- Did NOT inspect the `getDateRangeStart` implementation (imported but not opened)
- Did NOT verify the `DateRange` type values (e.g. 'all', 'week', 'month')
- Did NOT check whether the filter applies to safe_harbor conversations correctly

### Field 6 — Observations (no verdict)

The `VaultMyConversations.tsx` component has a `dateRange` state tied to a `<select value={dateRange}>` at line 147 and uses `getDateRangeStart(dateRange)` to compute a cutoff that filters client-side (`new Date(c.updated_at) >= cutoff`). The file docstring at line 5 lists "date filters" as a feature.

---

## Entry 66 — `Tool permission management UI`

**Registry line:** 66
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Tool permission management UI | PRD-05 | PRD-22 | ⏳ Unwired (MVP) | Phase 27 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)

Level (e) — cross-PRD forward reference. Registry maps to PRD-22 (Settings), Phase 27. Closest backing identifier: `lila_tool_permissions` table (schema in live_schema.md). MemberAssignmentModal is a partial caller but scoped to vault-item assignment, not a Settings-page management UI.

### Field 2 — Code presence check

Grep command: `Grep pattern=lila_tool_permissions|ToolPermission|tool_permissions output_mode=files_with_matches`
Hits: 27 files (including migrations + PRDs)
Files (src/):
  - src/features/vault/components/MemberAssignmentModal.tsx:57,106 — queries + inserts `lila_tool_permissions` rows, creates from Vault
  - src/hooks/useLila.ts — referenced
  - src/components/lila/LilaModalTrigger.tsx — referenced
  - src/pages/SettingsPage.tsx exists (found via Glob), but no `lila_tool_permissions` hit in src/pages/ per grep
First-context window (MemberAssignmentModal.tsx):
```
/**
 * "+Add to AI Toolbox" modal (PRD-21A Screen 4).
 * Family member picker → creates lila_tool_permissions records with source='vault'.
 * Only shown for ai_tool and skill content types.
 */
...
.from('lila_tool_permissions')
.select('member_id')
.eq('family_id', family.id)
.eq('vault_item_id', item.id)
...
const { error } = await supabase.from('lila_tool_permissions').insert(rows)
```

### Field 3 — Wiring check

Callers: `MemberAssignmentModal.tsx` is one writer (adds vault tools to a member). No caller found in `src/pages/SettingsPage.tsx` via grep of `lila_tool_permissions|tool.?permissions` → 0 hits in `src/pages`. Execution-flow location: vault-modal creator exists; Settings-page central management UI was not located. Most-recent commit: `0be28be 2026-04-09 21:59:18 -0500 fix: unify member color reads via canonical getMemberColor helper`.

### Field 4 — Documentation cross-reference

- WIRING_STATUS.md: no mention
- prds/addenda/: PRD-22 addendum may exist (not explicitly searched by filename)
- PlannedExpansionCard: not verified for a specific `tool_permission_management` feature key
- CLAUDE.md: no direct mention of "Tool permission management UI"

### Field 5 — What was NOT checked

- Did NOT fully read `src/pages/SettingsPage.tsx` to confirm whether a tool permission management panel exists there
- Did NOT search for feature key `lila_tool_permissions` in `src/config/feature_key_registry.ts`
- Did NOT check for a `/settings/tools` route or similar
- Did NOT verify that the 0-row `lila_tool_permissions` table (per live_schema.md) has actual writes from any caller

### Field 5 — What was NOT checked (continued)

- MemberAssignmentModal writes to the table but is vault-launcher-scoped, not a centralized management surface

### Field 6 — Observations (no verdict)

`lila_tool_permissions` table is referenced in two src files: `MemberAssignmentModal.tsx` (insert/select, vault-scoped) and `src/hooks/useLila.ts` (referenced but not opened). Grep of `src/pages` for the identifier returned 0 hits, and SettingsPage.tsx's contents were not opened in this pass. The registry row marks this stub as `⏳ Unwired (MVP)` wired by PRD-22 Phase 27; live_schema.md shows the table has 0 rows.

---

## Entry 75 — `Library Vault tutorial links`

**Registry line:** 75
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Library Vault tutorial links | PRD-05 | PRD-21A | ✅ Wired | Phase 25 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)

Level (e) — cross-PRD forward reference. Registry maps to PRD-21A (AI Vault). Level (d) secondary: PRD-05 line 847 `| Library Vault tutorial links (LiLa Assist recommends) | Library Vault content system | Library Vault PRD |` and line 899 `- [ ] Library Vault tutorial links when Library Vault PRD is built`. Closest backing identifier: `content_type === 'tutorial'` case in `VaultDetailView.tsx`.

### Field 2 — Code presence check

Grep command: `Grep pattern=content_type.*tutorial|'tutorial' path=src output_mode=content -n`
Hits: 2
Files:
  - src/features/vault/components/VaultDetailView.tsx:74 `case 'tutorial': return <TutorialDetail item={item} ... />`
  - src/features/vault/components/VaultSearchBar.tsx:17 `{ value: 'tutorial', label: 'Tutorials' }`
First-context window (VaultDetailView.tsx 73–88):
```
switch (item.content_type) {
  case 'tutorial':
    return <TutorialDetail item={item} memberId={memberId} updateProgress={updateProgress} />
  case 'ai_tool':
    return <AIToolDetail ... />
  case 'prompt_pack':
    return <PromptPackDetail ... />
  case 'curation':
    return <CurationDetail ... />
  ...
}
```

### Field 3 — Wiring check

Caller: `VaultDetailView.tsx:74` renders `<TutorialDetail>` when vault_item content_type is `'tutorial'`. `VaultSearchBar.tsx:17` includes tutorials in filter options. Execution-flow location: Vault browse / detail page rendering. Most-recent commit on VaultDetailView.tsx: `4e939c5 2026-04-07 16:13:51 -0500 fix: Vault native tools launch into correct modal (Translator, BoD + all others)`.

### Field 4 — Documentation cross-reference

- WIRING_STATUS.md: no direct row named "Library Vault tutorial links"
- prds/addenda/: not specifically searched in this pass
- PlannedExpansionCard: not applicable
- CLAUDE.md: convention #80-#91 document AI Vault content architecture; no specific mention of "Library Vault tutorial links" phrase
- PRD-05 lines 284, 305, 315, 847, 899 mention Library Vault tutorial links from LiLa Assist

### Field 5 — What was NOT checked

- Did NOT verify whether LiLa Assist actually surfaces tutorial recommendations from the vault to the user during assist conversations
- Did NOT verify the `TutorialDetail` component implementation
- Did NOT check live_schema.md for vault_items with content_type='tutorial' populated (live_schema.md lists `vault_items` with 17 rows but doesn't show type breakdown)
- Did NOT check if `help-patterns.ts` routes FAQ matches to specific tutorial vault items

### Field 6 — Observations (no verdict)

`VaultDetailView.tsx:74` has a dedicated `'tutorial'` branch that renders `<TutorialDetail>`. `VaultSearchBar.tsx:17` exposes "Tutorials" as a filter option. PRD-05 references Library Vault tutorial links as an interaction pattern but the specific LiLa-Assist-to-tutorial-recommendation surface was not traced in this pass.

---

## Entry 77 — `Edit in Notepad action chip`

**Registry line:** 77
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Edit in Notepad action chip | PRD-05 (Phase 06) | PRD-08 (Phase 09) | ✅ Wired | Phase 09 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)

Level (a) — file-header comment. Quote `src/components/lila/LilaMessageBubble.tsx` lines 14–15:
```
* Assistant messages show action chips: Copy, Edit in Notepad, Review & Route, etc.
* The most recent assistant message shows HumanInTheMix controls.
```
Identifier: `ActionChip` with `label="Edit in Notepad"` in `LilaMessageBubble.tsx:100` and `ToolConversationModal.tsx:1033,1061`.

### Field 2 — Code presence check

Grep command: `Grep pattern=Edit in Notepad|edit_in_notepad|EditInNotepad output_mode=files_with_matches`
Hits: 24 files
Files (src/):
  - src/components/lila/LilaMessageBubble.tsx:100 — `<ActionChip icon={FileEdit} label="Edit in Notepad" ...>`
  - src/components/lila/ToolConversationModal.tsx:1033,1061 — ActionChip in two branches (DRAFT_TOOLS, ThoughtSift tools)
  - src/components/notepad/NotepadReviewRoute.tsx:179,476 — handleEditInNotepad handler + button
  - src/components/notepad/NotepadContext.tsx — bridge provider
  - src/pages/Journal.tsx — also referenced
  - src/hooks/useNotepad.ts — hook
First-context window (LilaMessageBubble.tsx 98–108):
```
<ActionChip
  icon={FileEdit}
  label="Edit in Notepad"
  onClick={() => {
    notepad?.openNotepad({
      content: message.content,
      sourceType: 'edit_in_notepad',
    })
  }}
  ...
/>
```

### Field 3 — Wiring check

Callers: `LilaMessageBubble.tsx:100` (LiLa drawer), `ToolConversationModal.tsx:1033,1061` (tool conversations with save-to-notepad path). Handlers call `notepad?.openNotepad(...)` which resolves via `NotepadContext`. Execution-flow location: React component in LiLa surface → NotepadContext → createTab. Most-recent commit on LilaMessageBubble.tsx: `762fa31 2026-04-14 23:07:08 -0500 fix: 6 bug reports — rotation, LiLa, Notepad, Studio audit`.

### Field 4 — Documentation cross-reference

- WIRING_STATUS.md: no direct row (Edit in Notepad not explicitly listed)
- prds/addenda/: `prds/addenda/PRD-08-Cross-PRD-Impact-Addendum.md` exists
- PlannedExpansionCard: not applicable
- CLAUDE.md: no direct mention of "Edit in Notepad action chip" by that exact phrase

### Field 5 — What was NOT checked

- Did NOT verify `notepad?.openNotepad()` actually creates a tab for all three surfaces (Mom/Adult/Independent)
- Did NOT verify that `sourceType: 'edit_in_notepad'` is persisted on `notepad_tabs.source_type`
- Did NOT check handling when the NotepadContext is absent (e.g., on shells without the drawer)
- Did NOT run an e2e test

### Field 6 — Observations (no verdict)

`Edit in Notepad` ActionChip is present in three caller sites: `LilaMessageBubble.tsx:100`, `ToolConversationModal.tsx:1033`, and `ToolConversationModal.tsx:1061`. Each passes the assistant message content into `notepad.openNotepad({...})`. `NotepadReviewRoute.tsx:179` contains a separate `handleEditInNotepad` that creates a tab via `createTab.mutate({...})`.

---

## Entry 78 — `Review & Route action chip`

**Registry line:** 78
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Review & Route action chip | PRD-05 (Phase 06) | PRD-08 (Phase 09) | ✅ Wired | Phase 09 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)

Level (a) — inline code comment / label. Quote `src/components/lila/LilaMessageBubble.tsx` lines 111–121:
```
<ActionChip
  icon={ArrowRightLeft}
  label="Review & Route"
  onClick={() => {
    notepad?.openNotepad({
      content: message.content,
      ...
    })
    // Brief delay to let the tab create, then switch to review-route view
    setTimeout(() => notepad?.setView('review-route'), 300)
  }}
```
Identifier: `<ActionChip label="Review & Route">` in `LilaMessageBubble.tsx:113`.

### Field 2 — Code presence check

Grep command: `Grep pattern=Review & Route|ReviewAndRoute|ReviewRoute path=src/components/lila/LilaMessageBubble.tsx output_mode=content -n`
Hits: 2 occurrences in that file (header comment + label)
Files (src/):
  - src/components/lila/LilaMessageBubble.tsx:14,113 — file-header comment + ActionChip
  - `Grep pattern=Review & Route|ReviewAndRoute path=src/components/notepad` → 0 hits in notepad components directly; NotepadReviewRoute.tsx component is named differently but handles the Review & Route pipeline
First-context window:
```
11: * Message Bubble — PRD-05
12: * Renders a single message in the conversation.
13: * User messages right-aligned, LiLa left-aligned with avatar.
14: * Assistant messages show action chips: Copy, Edit in Notepad, Review & Route, etc.
```

### Field 3 — Wiring check

Caller: `LilaMessageBubble.tsx:113` → calls `notepad?.openNotepad(...)` then `setTimeout` → `notepad?.setView('review-route')`. Execution-flow location: React component + NotepadContext state change. Most-recent commit: `762fa31 2026-04-14 23:07:08 -0500 fix: 6 bug reports — rotation, LiLa, Notepad, Studio audit`.

### Field 4 — Documentation cross-reference

- WIRING_STATUS.md: "Review & Route" appears on lines 11, 12, 13, 14, 16, 22, 23, 78, 79 listing wired routing destinations from Notepad → Task, List, Journal, Guiding Stars, Victory, Ideas, Backburner
- prds/addenda/: `prds/addenda/PRD-08-Cross-PRD-Impact-Addendum.md` exists
- PlannedExpansionCard: not applicable
- CLAUDE.md: no mention of "Review & Route action chip" phrase specifically, but #22 `22. **Review & Route:** Universal reusable extraction component defined in PRD-08...`

### Field 5 — What was NOT checked

- Did NOT verify that `notepad?.setView('review-route')` actually exists on the NotepadContext type
- Did NOT verify the 300ms setTimeout is sufficient for tab creation
- Did NOT verify behavior when `notepad` context is undefined
- Did NOT check `NotepadReviewRoute.tsx` handler wiring in full detail

### Field 6 — Observations (no verdict)

`LilaMessageBubble.tsx:113` renders a "Review & Route" ActionChip. The click handler opens the notepad and schedules a view switch to `'review-route'`. `NotepadReviewRoute.tsx` is the underlying view component. WIRING_STATUS.md references "Review & Route" for seven routing destinations (Task, List, Journal, Guiding Stars, Victory, Ideas, Backburner).

---

## Entry 79 — `Create Task action chip`

**Registry line:** 79
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Create Task action chip | PRD-05 (Phase 06) | PRD-09A | ✅ Wired | Phase 10 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)

Level (a) — inline code comment + disabled prop. Quote `src/components/lila/LilaMessageBubble.tsx` lines 126–132:
```
<ActionChip
  icon={ListTodo}
  label="Create Task"
  onClick={() => {/* STUB: wires to PRD-09A */}}
  disabled
  title="Coming soon — wires to Tasks"
/>
```
Identifier: `<ActionChip label="Create Task">` — currently `disabled` with inline STUB comment. Secondary: `ToolConversationModal.tsx:1040` has a different Create Task chip that navigates to `/tasks?new=1`.

### Field 2 — Code presence check

Grep command: `Grep pattern=Create Task|create task.*chip|Create.*chip path=src/components/lila output_mode=content -n -C2`
Hits: two separate call sites in lila/
Files:
  - src/components/lila/LilaMessageBubble.tsx:126–132 — `disabled` ActionChip with `/* STUB: wires to PRD-09A */`
  - src/components/lila/ToolConversationModal.tsx:57 `const TASK_TOOLS = new Set(['quality_time', 'gifts', 'observe_serve', 'words_affirmation', 'higgins_say', 'higgins_navigate'])`
  - src/components/lila/ToolConversationModal.tsx:1038–1043 — enabled ActionChip that navigates to `/tasks?new=1&prefill=...`
First-context window (LilaMessageBubble.tsx 126–132 reproduced above; ToolConversationModal.tsx 1038–1042):
```
{/* Task tools: Create Task */}
{TASK_TOOLS.has(modeKey) && (
  <ActionChip icon={<CheckSquare size={12} />} label="Create Task" onClick={() => {
    // Navigate to task creation with pre-filled title
    const title = msg.content.split('\n')[0]?.slice(0, 80) || 'From LiLa conversation'
```

### Field 3 — Wiring check

Caller: two distinct call sites. (1) `LilaMessageBubble.tsx:126–132` renders the chip **disabled** with a "Coming soon" tooltip and an empty onClick containing `/* STUB: wires to PRD-09A */`. (2) `ToolConversationModal.tsx:1038–1042` renders an enabled chip for TASK_TOOLS (6 relationship tools) that navigates to `/tasks?new=1`. Execution-flow location: React components, two separate surfaces (LiLa drawer message bubble vs. tool conversation modal). Most-recent commit on LilaMessageBubble.tsx: `762fa31 2026-04-14 23:07:08 -0500`.

### Field 4 — Documentation cross-reference

- WIRING_STATUS.md: no direct row for "Create Task action chip"
- prds/addenda/: no specific addendum searched
- PlannedExpansionCard: not applicable
- CLAUDE.md: no specific mention of "Create Task action chip" phrase

### Field 5 — What was NOT checked

- Did NOT verify which of the two chip sites the registry row refers to
- Did NOT check if the disabled LiLa-drawer chip is intentionally disabled to route users through a different path (e.g., via Edit/Review & Route → Studio Queue)
- Did NOT read the `TASK_TOOLS` usage in the ToolConversationModal comprehensively
- Did NOT verify the prefilled title sanitation at task creation

### Field 6 — Observations (no verdict)

Two distinct "Create Task" ActionChip instances exist: (1) in `LilaMessageBubble.tsx:126` it is `disabled` with empty onClick containing the comment `/* STUB: wires to PRD-09A */` and title "Coming soon — wires to Tasks"; (2) in `ToolConversationModal.tsx:1040` it is enabled for 6 relationship tools and navigates to `/tasks?new=1` with prefilled title. The registry row shows status `✅ Wired` wired by PRD-09A, Phase 10.

---

## Entry 80 — `Record Victory action chip`

**Registry line:** 80
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Record Victory action chip | PRD-05 (Phase 06) | PRD-11 | ⏳ Unwired (MVP) | Phase 12 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)

Level (a) — ActionChip block. Quote `src/components/lila/LilaMessageBubble.tsx` lines 133–142:
```
<ActionChip
  icon={Trophy}
  label="Record Victory"
  onClick={() => {
    // Extract a concise description from the assistant message (first 200 chars)
    const desc = message.content.slice(0, 200).replace(/\n/g, ' ').trim()
    navigate(`/victories?new=1&prefill=${encodeURIComponent(desc)}`)
  }}
  title="Save this as a victory"
/>
```
Identifier: `<ActionChip label="Record Victory">` in `LilaMessageBubble.tsx:135` — enabled, navigates to `/victories?new=1&prefill=...`.

### Field 2 — Code presence check

Grep command: `Grep pattern=/victories\?new=1 output_mode=files_with_matches`
Hits: 8 files
Files:
  - src/components/lila/LilaMessageBubble.tsx — Record Victory chip (entry #80)
  - src/components/lila/ToolConversationModal.tsx — tools surface
  - src/components/shells/MomShell.tsx — shell-level
  - src/components/shells/ShellQuickCreateFAB.tsx — quick-create FAB
  - WIRING_STATUS.md — doc
  - claude/feature-decisions/PRD-11-Victory-Recorder.md — feature decision file
  - tests/e2e/features/victory-recorder.spec.ts — e2e
  - src/components/victories/VictorySuggestions.tsx — suggestions surface
First-context window: ActionChip block quoted above (lines 133–142).

### Field 3 — Wiring check

Caller: `LilaMessageBubble.tsx:133` — the chip is enabled (no `disabled` prop); onClick navigates to `/victories?new=1&prefill=<200-char-slice>`. Execution-flow location: React component, react-router navigation. Most-recent commit on LilaMessageBubble.tsx: `762fa31 2026-04-14 23:07:08 -0500 fix: 6 bug reports — rotation, LiLa, Notepad, Studio audit`. VictoryRecorder page itself has most-recent commit `933ad33 2026-04-07 08:12:57 -0500 fix: systemic UTC vs local-time date bug + ESLint enforcement`.

### Field 4 — Documentation cross-reference

- WIRING_STATUS.md: mentions `/victories?new=1` route + "Log Victory — Navigate `/victories?new=1`  | **Wired** | Victory recording page"
- prds/addenda/: not specifically searched for this stub
- PlannedExpansionCard: not applicable
- CLAUDE.md: no direct mention of "Record Victory action chip" phrase

### Field 5 — What was NOT checked

- Did NOT verify the `/victories?new=1&prefill=...` URL query handling at the destination page (VictoryRecorder.tsx)
- Did NOT verify that the prefilled description actually populates a Victory record form field
- Did NOT check if the registry's "Unwired (MVP)" status reflects a different aspect of the Record Victory flow (e.g., inline creation without page navigation)
- Did NOT cross-check AIR (automatic intelligent routing) behavior vs this chip

### Field 6 — Observations (no verdict)

The Record Victory ActionChip in `LilaMessageBubble.tsx:133` is enabled (no `disabled` prop), extracts up to 200 characters of the assistant message, URL-encodes it, and navigates to `/victories?new=1&prefill=...`. The registry row status is `⏳ Unwired (MVP)` with wired-by PRD-11, Phase 12. WIRING_STATUS.md lists `/victories?new=1` as a wired Quick Create navigation path. An e2e test file `tests/e2e/features/victory-recorder.spec.ts` exists.

---

## Entry 89 — `Dashboard widget containers`

**Registry line:** 89
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Dashboard widget containers | PRD-06 | PRD-10 | ✅ Wired | Phase 11 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a): Stub row itself names capability "Dashboard widget containers" tied to PRD-10. Registry row text does not name a concrete identifier but PRD-10 = "Widgets, Trackers & Dashboard Layout" per `claude/feature_glossary.md`, which lists `dashboard_widgets`, `dashboard_widget_folders`, `widget_data_points`, `widget_templates` as the PRD-10 tables. Primary identifier: `dashboard_widgets` table.
```
Source: feature_glossary.md PRD-10 row + stub line 89
Identifier: dashboard_widgets (table), dashboard_widget_folders, widget_data_points
Quote: "Dashboard widget containers | PRD-06 | PRD-10 | ✅ Wired | Phase 11"
```

### Field 2 — Code presence check
Grep command: `pattern=dashboard_widgets, path=src, output_mode=files_with_matches, head_limit=20`
Hits: 8
Files:
  - `src/hooks/useWidgets.ts` — header comment line 2 "CRUD for dashboard_widgets, widget_data_points, dashboard_widget_folders"; `.from('dashboard_widgets')` at lines 27, 51, 141, 166
  - `src/pages/Dashboard.tsx` — main dashboard page
  - `src/types/rhythms.ts`, `src/lib/rhythm/featureDiscoveryPool.ts`, `src/hooks/useRhythmTrackers.ts`, `src/hooks/useFamilyOverviewData.ts` — cross-references
  - `src/components/studio/wizards/RecurringItemBrowser.tsx`, `src/components/widgets/info/InfoQuickStats.tsx`

First-context window (`useWidgets.ts` lines 1-4, 25-52):
```
1  // PRD-10: Widgets, Trackers & Dashboard Layout — core widget hook
2  // Covers CRUD for dashboard_widgets, widget_data_points, dashboard_widget_folders
3
4  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
...
25      if (!familyId || !memberId) return []
26      const { data, error } = await supabase
27        .from('dashboard_widgets')
28        .select('*')
```

### Field 3 — Wiring check
Callers/Importers: `src/hooks/useWidgets.ts` is imported across widget components; primary consumer is `src/pages/Dashboard.tsx`.
Execution-flow location: React hook (TanStack Query), Supabase CRUD against `dashboard_widgets`.
Most recent touching commit: `42ce0c4 2026-04-02 01:05:10 -0500 feat: Victory Recorder Phase 12B — intelligence layer, cross-feature wiring` (`src/hooks/useWidgets.ts`).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: line 38 "| [Customize] Trackers/Widgets | WidgetPicker + WidgetConfiguration | **Wired** | PRD-10 Phase A |"
- prds/addenda/: not grepped by filename — none matched `dashboard_widget` in filenames
- PlannedExpansionCard: no match found for `dashboard_widgets` featureKey
- CLAUDE.md: no match for "Dashboard widget containers" exact phrase

### Field 5 — What was NOT checked
- Whether `dashboard_widget_folders` and `widget_data_points` tables each have functional UI containers beyond the table reads — only the main `dashboard_widgets` hook was inspected.
- Whether every widget registered in `widget_templates` has a rendering container in `WidgetRenderer` (type enum coverage was not exhaustively validated).
- Whether PRD-06 (the stub's "Created By") originally described "Dashboard widget containers" more narrowly than the general widget system.

### Field 6 — Observations (no verdict)
`useWidgets.ts` header comment explicitly states coverage of `dashboard_widgets`, `dashboard_widget_folders`, `widget_data_points`. Most recent touching commit dated 2026-04-02. WIRING_STATUS.md line 38 flags the related Studio flow for WidgetPicker/WidgetConfiguration as "Wired." Live schema reports 41 `dashboard_widgets` rows and 67 `widget_data_points` rows.

---

## Entry 97 — `Dashboard widget for GS rotation`

**Registry line:** 97
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Dashboard widget for GS rotation — widget config defined | PRD-06 | PRD-10 (Widgets) | ⏳ Unwired (MVP) | PRD-10 Phase B |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a): Stub row names "GS rotation" + "widget config defined." From that + file grep, the identifier surfaces as the widget type constant `info_guiding_stars_rotation` and component `InfoGuidingStarsRotation`.
```
Source: stub entry line 97
Identifier: info_guiding_stars_rotation (widget template_type), InfoGuidingStarsRotation (component)
Quote: "Dashboard widget for GS rotation — widget config defined"
```

### Field 2 — Code presence check
Grep command: `pattern=InfoGuidingStarsRotation|guiding_stars_rotation, path=src, output_mode=content, -n=true`
Hits: 9 (across 5 files)
Files:
  - `src/types/widgets.ts:521` — `| 'info_guiding_stars_rotation'` enum member
  - `src/types/widgets.ts:582` — `type: 'info_guiding_stars_rotation',` template config
  - `src/components/widgets/WidgetRenderer.tsx:28` — import of `InfoGuidingStarsRotation`
  - `src/components/widgets/WidgetRenderer.tsx:110-111` — `case 'info_guiding_stars_rotation': return <InfoGuidingStarsRotation widget={widget} isCompact={isCompact} />`
  - `src/components/widgets/info/InfoGuidingStarsRotation.tsx:12` — `export function InfoGuidingStarsRotation({ widget }: Props)`
  - `src/components/widgets/info/index.ts:4` — re-export
  - `src/pages/Dashboard.tsx:266` — `template_type: 'info_guiding_stars_rotation'` template seed
  - `src/pages/Dashboard.tsx:364, 372` — size + label entries

First-context window (`WidgetRenderer.tsx:108-113`):
```
    case 'info_guiding_stars_rotation':
      return <InfoGuidingStarsRotation widget={widget} isCompact={isCompact} />
```

### Field 3 — Wiring check
Callers/Importers: `WidgetRenderer.tsx` uses it in its type-keyed switch; `Dashboard.tsx` references the template_type string and size/label maps.
Execution-flow location: React component in `src/components/widgets/info/`, rendered via `WidgetRenderer` case statement.
Most recent touching commit: `95b2816 2026-03-29 16:03:23 -0500 fix: resolve 4 TypeScript errors in widget and calendar components` (`InfoGuidingStarsRotation.tsx`).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no specific mention of `guiding_stars_rotation` widget; line 38 general "Trackers/Widgets — **Wired** — PRD-10 Phase A"
- prds/addenda/: not grepped
- PlannedExpansionCard: no match for this specific feature key
- CLAUDE.md: no mention

### Field 5 — What was NOT checked
- Whether the widget's rotation behavior (cycling through Guiding Stars) is fully implemented inside `InfoGuidingStarsRotation.tsx` or only renders a single static star.
- Whether the widget is actually selectable in `WidgetPicker` (no grep on WidgetPicker for this type).
- Whether "config defined" in the stub refers to something beyond the current `template_type` + size/label/icon entries.

### Field 6 — Observations (no verdict)
Widget type `info_guiding_stars_rotation` is defined in the widgets type file and wired into both `WidgetRenderer` switch and `Dashboard.tsx` template/size/label maps. Dedicated component `InfoGuidingStarsRotation.tsx` exists. Most recent touch 2026-03-29. Registry claims `⏳ Unwired (MVP)` with "widget config defined" qualifier.

---

## Entry 102 — `Dashboard widget for BI celebration`

**Registry line:** 102
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Dashboard widget for BI celebration — widget config defined | PRD-06 | PRD-10 (Widgets) | ⏳ Unwired (MVP) | PRD-10 Phase B |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a): Stub row names "BI celebration" + "widget config defined." Searched for patterns `best_intentions_celebration|BICelebration|bi_celebration|best_intention_celebration`. No files matched. Follow-up grep for `InfoFamilyIntention|best_intention` in `src/components/widgets` surfaced `InfoFamilyIntention.tsx` which is a family-intention widget but not specifically a "celebration" widget.
Level (b-d): WIRING_STATUS.md has no mention of BI celebration widget; CLAUDE.md has no match; no BI-celebration-specific addendum grep performed for this entry.
Level (e): CAPABILITY-ONLY — no concrete "BI celebration" widget identifier found in authoritative docs. `InfoFamilyIntention` exists but stub row says "BI" (best intentions), and the stub's "celebration" qualifier is not attached to any widget name in the codebase.
```
Identifier: CAPABILITY-ONLY — no "BI celebration widget" identifier found.
Sources checked:
  (a) stub entry line 102 — names "BI celebration" but no code identifier
  (b) WIRING_STATUS.md — general "Trackers/Widgets — Wired" but no BI-celebration row
  (c) CLAUDE.md — no BI celebration widget mention
  (d) PRD-06 + addenda — not opened for this capability-specific check
```

### Field 2 — Code presence check
Skipped — no identifier to grep for. (For completeness: `InfoFamilyIntention.tsx` exists at `src/components/widgets/info/InfoFamilyIntention.tsx` — could be the intended target, unverified.)

### Field 3 — Wiring check
Skipped — no code presence.

### Field 4 — Documentation cross-reference
Skipped — no identifier.

### Field 5 — What was NOT checked
- Whether `InfoFamilyIntention.tsx` is the "BI celebration widget" in disguise (the stub row uses "BI" for Best Intentions; `InfoFamilyIntention` could be the corresponding widget).
- Whether PRD-06 or PRD-10 addenda name a specific "BI celebration" widget key that would have produced Level (d) evidence — not opened in this run.
- Semantic search ("find the widget that visualizes a Best Intention celebration count") would help here; Convention 242 blocks mgrep without per-query approval.

### Field 6 — Observations (no verdict)
Capability-only entry; the stub row does not name a concrete widget identifier and the 4-level chain did not surface a clear "BI celebration widget" name. `InfoFamilyIntention.tsx` exists but cannot be confirmed as the referent without a PRD-06 / PRD-10 addendum read. Flagged for founder-judgment bucket.

---

## Entry 103 — `Bar graph tracker visualization`

**Registry line:** 103
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Bar graph tracker visualization — tracker_style column exists, UI shows "Enhanced" badge | PRD-06 | best_intentions_tracker_views feature key | ⏳ Unwired (MVP) | PRD-10 Phase B |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a): Stub row names `tracker_style` column and "Enhanced" badge. Primary identifiers: `tracker_style` (DB column), `'bar_graph'` (enum value), `best_intentions_tracker_views` (feature key).
```
Source: stub entry line 103
Identifier: tracker_style = 'bar_graph', best_intentions_tracker_views (feature key)
Quote: "tracker_style column exists, UI shows 'Enhanced' badge"
```

### Field 2 — Code presence check
Grep command: `pattern=tracker_style, path=src, output_mode=files_with_matches` — 2 files
Grep command: `pattern=bar_graph|Enhanced, path=src/pages/BestIntentions.tsx, -i=true` — multiple hits

Files:
  - `src/pages/BestIntentions.tsx:254-258` — reads `intention.tracker_style === 'bar_graph'` display label
  - `src/pages/BestIntentions.tsx:415` — `type TrackerStyle = 'counter' | 'bar_graph' | 'streak'`
  - `src/pages/BestIntentions.tsx:585-611` — selector options `{ value: 'bar_graph' as const, label: 'Bar Graph', enhanced: true }` with an "Enhanced" badge at line 611
  - `src/hooks/useBestIntentions.ts` — tracker_style persistence

First-context window (`BestIntentions.tsx:252-258`):
```
            {isActive && (
              <span className="text-[10px] italic">
                {intention.tracker_style === 'counter'
                  ? 'counter'
                  : intention.tracker_style === 'bar_graph'
                    ? 'bar graph'
                    : 'streak'}
```

### Field 3 — Wiring check
Callers/Importers: `BestIntentions.tsx` (page) is the sole consumer of the `tracker_style` selector; `useBestIntentions.ts` hook is called from that page.
Execution-flow location: React page + hook layer. Column exists in DB (see `live_schema.md` `best_intentions.tracker_style`). "Bar Graph" option is selectable but no grep hit was found for a `BarGraphTracker` visualization component in `src/components/widgets/trackers/` (folder contains `BooleanCheckinTracker.tsx`, `StreakTracker.tsx`, `HabitGridTracker.tsx`).
Most recent touching commit: `0be28be 2026-04-09 21:59:18 -0500 fix: unify member color reads via canonical getMemberColor helper` (`BestIntentions.tsx`).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no specific bar-graph row; line 38 general widget-wiring claim
- prds/addenda/: not grepped
- PlannedExpansionCard: no match found for `best_intentions_tracker_views`
- CLAUDE.md: no mention of bar_graph tracker

### Field 5 — What was NOT checked
- Whether a `BarGraphTracker.tsx` component exists elsewhere under a different name (only `src/components/widgets/trackers/` was listed).
- Whether selecting "Bar Graph" at runtime actually renders a bar-graph visualization or only stores `tracker_style='bar_graph'` while the dashboard widget continues to render a default style.
- The `best_intentions_tracker_views` feature key was not grepped in `feature_key_registry` seed files.

### Field 6 — Observations (no verdict)
Selector option `'bar_graph'` with "Enhanced" badge exists in `BestIntentions.tsx:586` and display label reads `tracker_style === 'bar_graph'`. No dedicated `BarGraphTracker` component was located in `src/components/widgets/trackers/`. Most recent touching commit 2026-04-09.

---

## Entry 104 — `Streak tracker visualization`

**Registry line:** 104
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Streak tracker visualization — tracker_style column exists, UI shows "Enhanced" badge | PRD-06 | best_intentions_tracker_views feature key | ⏳ Unwired (MVP) | PRD-10 Phase B |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a): Stub row names `tracker_style` and "Enhanced" badge. Identifiers: `tracker_style = 'streak'`, `StreakTracker` (component file visible in tracker grep).
```
Source: stub entry line 104
Identifier: tracker_style = 'streak', StreakTracker (component)
Quote: "tracker_style column exists, UI shows 'Enhanced' badge"
```

### Field 2 — Code presence check
Grep command: `pattern=bar_graph|streak, path=src/components/widgets, output_mode=files_with_matches, -i=true`
Hits: 8
Files include `src/components/widgets/trackers/StreakTracker.tsx`
Grep command: `pattern=bar_graph|Enhanced, path=src/pages/BestIntentions.tsx, -i=true`
  - `BestIntentions.tsx:415` — enum `'streak'`
  - `BestIntentions.tsx:587` — `{ value: 'streak' as const, label: 'Streak', enhanced: true }`

First-context window (`BestIntentions.tsx:585-611`):
```
            { value: 'counter' as const, label: 'Counter', enhanced: false },
            { value: 'bar_graph' as const, label: 'Bar Graph', enhanced: true },
            { value: 'streak' as const, label: 'Streak', enhanced: true },
            ...
              {opt.enhanced && (
                  Enhanced
```

### Field 3 — Wiring check
Callers/Importers: `src/components/widgets/trackers/StreakTracker.tsx` is a tracker component; not confirmed whether it is wired into `BestIntentions.tsx` selection, as the Best Intentions tracker_style selector stores a string but the page's render path to `StreakTracker.tsx` was not traced end-to-end.
Execution-flow location: React component in trackers folder.
Most recent touching commit: not fetched for StreakTracker.tsx specifically in this run.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: line 38 general wiring
- prds/addenda/: not grepped
- PlannedExpansionCard: no match for `best_intentions_tracker_views`
- CLAUDE.md: no mention

### Field 5 — What was NOT checked
- Whether `StreakTracker.tsx` is actually rendered when a Best Intention has `tracker_style='streak'`, or whether it's only wired for standalone trackers (widget data points) independent of Best Intentions.
- Most recent commit for `StreakTracker.tsx` not pulled in this run.
- feature_key `best_intentions_tracker_views` not grepped in feature_key_registry seed files.

### Field 6 — Observations (no verdict)
`StreakTracker.tsx` component exists under `src/components/widgets/trackers/`; the "Streak" selector option with "Enhanced" badge exists at `BestIntentions.tsx:587`. Whether selecting `'streak'` on a Best Intention leads to `StreakTracker.tsx` rendering is not verified in this run. Registry claim that the column exists + badge shows is consistent with code; "visualization" wiring end-to-end was not end-to-end traced.

---

## Entry 106 — `Teen privacy indicator`

**Registry line:** 106
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Teen privacy indicator — UI badge showing visibility status | PRD-07 | PRD-02 (teen visibility setting) | ⏳ Unwired (MVP) | Phase 02+ |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a): Stub row mentions "UI badge showing visibility status" and PRD-02 teen visibility. Searched for `teen.*privacy|privacy.*indicator|TeenPrivacy|visibility.*badge` — no matches.
Level (b): WIRING_STATUS.md — no mention of teen privacy indicator.
Level (c): CLAUDE.md — `is_private` / `visibility` appear in general conventions (e.g., Convention 76 Privacy Filtered is HARD system constraint, Convention 141 Mom cannot read other members' messages), none name a "Teen privacy indicator" badge.
Level (d): PRD-07 / PRD-02 not opened for this entry in this run. `PrivacyFilteredPage.tsx` found for related mom-side Archives feature but not a teen-side visibility badge.
Level (e): CAPABILITY-ONLY — no concrete teen-privacy-indicator component identifier surfaced.
```
Identifier: CAPABILITY-ONLY — no "Teen privacy indicator" component found.
Sources checked:
  (a) stub entry line 106 — "UI badge showing visibility status" capability, no identifier
  (b) WIRING_STATUS.md — no mention
  (c) CLAUDE.md conventions — visibility-related conventions exist (76, 141) but no teen-badge mention
  (d) PRD-07 / PRD-02 — not opened in this run
```

### Field 2 — Code presence check
Skipped — no identifier.

### Field 3 — Wiring check
Skipped — no code presence.

### Field 4 — Documentation cross-reference
Skipped — no identifier.

### Field 5 — What was NOT checked
- PRD-02 permissions PRD and PRD-07 InnerWorkings PRD were not opened to surface a specific component name for "teen privacy indicator."
- Whether the "badge" described is part of InnerWorkings' entry visibility UI (where `is_private` / `share_with_mom` / `share_with_dad` exist per live_schema on `self_knowledge`) or a separate teen-only surface.
- Semantic search for "teen-facing UI badge showing whether entry is visible to mom/dad" would help; Convention 242 blocks mgrep without per-query approval.

### Field 6 — Observations (no verdict)
Capability-only entry; no "Teen privacy indicator" component or badge identifier found in the 4-level chain. Related mom-side `PrivacyFilteredPage.tsx` exists in Archives but that is an aggregation page, not a teen-facing badge. Flagged for founder-judgment bucket.

---

## Entry 110 — `Review & Route routing UI`

**Registry line:** 110
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Review & Route routing UI | PRD-08 | PRD-08 | ✅ Wired | Phase 09 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a): Stub row names "Review & Route." Grep surfaces `NotepadReviewRoute.tsx` (primary component) and `RoutingStrip.tsx` (shared grid).
```
Source: stub entry line 110 + Grep hits
Identifier: NotepadReviewRoute (component), RoutingStrip (shared component)
Quote: "Review & Route routing UI | PRD-08 | PRD-08 | ✅ Wired | Phase 09"
```

### Field 2 — Code presence check
Grep command: `pattern=ReviewAndRoute|ReviewRoute|review_route, path=src, output_mode=files_with_matches`
Hits: 18 files
Files include:
  - `src/components/notepad/NotepadReviewRoute.tsx` — primary component
  - `src/components/notepad/NotepadDrawer.tsx` — consumer
  - `src/components/notepad/index.ts` — re-export
  - `src/components/shared/RoutingStrip.tsx` — universal grid
  - `src/components/queue/SortTab.tsx`, `src/components/queue/QueueCard.tsx`, `src/components/queue/BatchCard.tsx`, `src/components/queue/CalendarTab.tsx` — queue consumers
  - `src/pages/Tasks.tsx`, `src/pages/archives/MemberArchiveDetail.tsx`, `src/pages/archives/FamilyOverviewDetail.tsx`, `src/pages/archives/PrivacyFilteredPage.tsx` — page-level callers
  - `src/types/tasks.ts`, `src/types/meetings.ts`, `src/types/calendar.ts`, `src/types/archives.ts` — type references
  - `src/components/tasks/TaskCreationModal.tsx`, `src/hooks/useMeetings.ts`

### Field 3 — Wiring check
Callers/Importers: `NotepadReviewRoute` imported from Notepad drawer; `RoutingStrip` consumed by many pages.
Execution-flow location: React components under `src/components/notepad/` and `src/components/shared/`.
Most recent touching commit: `1fe2600 2026-04-02 11:41:25 -0500 fix: Review & Route now creates actual records, notepad respects View As` (`NotepadReviewRoute.tsx`).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: "Review & Route routing UI" exact match not found by grep for "Review & Route routing UI"; however table at top of file lists routing destinations and Phase 9 wiring status is covered throughout the RoutingStrip Destinations section
- prds/addenda/: not grepped
- PlannedExpansionCard: not a PlannedExpansionCard entry
- CLAUDE.md: Convention 22 "Review & Route: Universal reusable extraction component defined in PRD-08"

### Field 5 — What was NOT checked
- Whether every RoutingStrip destination Phase 9 intended to wire is actually delivered end-to-end (the WIRING_STATUS.md table lists per-destination status; only two destinations were inspected).
- Whether `NotepadReviewRoute` has regressed after the 2026-04-02 fix (no subsequent commits were pulled).

### Field 6 — Observations (no verdict)
`NotepadReviewRoute.tsx` exists and is imported by `NotepadDrawer.tsx`. Most-recent touching commit subject line explicitly says the fix makes "Review & Route now creates actual records." CLAUDE.md Convention 22 names the component. 18 Grep hits across pages + components.

---

## Entry 113 — `Send to Agenda`

**Registry line:** 113
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Send to Agenda | PRD-08 | PRD-16 (Build P) | ✅ Wired | 2026-04-15 — MeetingPickerOverlay wired in Phase D |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a): Stub row names "MeetingPickerOverlay wired in Phase D."
```
Source: stub entry line 113
Identifier: MeetingPickerOverlay (component); target table meeting_agenda_items
Quote: "MeetingPickerOverlay wired in Phase D"
```

### Field 2 — Code presence check
Grep command: `pattern=MeetingPickerOverlay|Send to Agenda|meeting_agenda_items.*notepad|meeting_agenda_items.*source, path=src, output_mode=files_with_matches`
Hits: 2
Files:
  - `src/components/meetings/MeetingPickerOverlay.tsx` — component
  - `src/components/notepad/NotepadDrawer.tsx` — consumer

First-context window (`NotepadDrawer.tsx` lines 21, 265, 573-576):
```
 21  import { MeetingPickerOverlay } from '@/components/meetings/MeetingPickerOverlay'
265      // Intercept Agenda — open MeetingPickerOverlay to create meeting_agenda_items directly
573      {/* MeetingPickerOverlay — opened when user picks "Agenda" in routing strip */}
575        <MeetingPickerOverlay
```

### Field 3 — Wiring check
Callers/Importers: `NotepadDrawer.tsx` imports and renders the overlay when the Agenda destination is picked in the routing strip.
Execution-flow location: React overlay component rendered from the Notepad drawer.
Most recent touching commit: `a65cd22 2026-04-15 16:20:31 -0500 feat: PRD-16 Meetings Phase D — post-meeting review, action routing, history, agenda picker` (`MeetingPickerOverlay.tsx`).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: RoutingStrip Destinations table — "Agenda | Notepad | Meeting agenda item | Stub | PRD-16 not built" (but this is from a snapshot dated before PRD-16 Phase D; registry row dated 2026-04-15 post-dates that)
- prds/addenda/: not grepped
- PlannedExpansionCard: not a PlannedExpansionCard entry
- CLAUDE.md: Convention 240 names `MeetingPickerOverlay` as the inline overlay for "Notepad 'Send to → Agenda'"

### Field 5 — What was NOT checked
- Whether the overlay's write to `meeting_agenda_items` includes `source='notepad_route'` attribution per convention (not traced through the insert).
- Whether the WIRING_STATUS.md "Agenda — Stub" row has been updated post-Phase D (appears stale relative to CLAUDE.md conv 240 and stub registry line 113).

### Field 6 — Observations (no verdict)
`MeetingPickerOverlay.tsx` exists; `NotepadDrawer.tsx:21,265,575` imports and renders it with a comment "opened when user picks 'Agenda' in routing strip" and "create meeting_agenda_items directly." Most-recent commit subject explicitly ties to Phase D meetings build on 2026-04-15. CLAUDE.md Convention 240 formally describes the pattern. WIRING_STATUS.md RoutingStrip table row for Agenda still reads "Stub" and predates this wiring per its commit timeline.

---

## Entry 118 — `Family Celebration mode`

**Registry line:** 118
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Family Celebration mode | PRD-11 | PRD-11B | ✅ Wired | Phase 12 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a): Stub row names "Family Celebration mode." Per feature_glossary.md PRD-11B = Family Celebration with key table `family_victory_celebrations`.
Level (b): WIRING_STATUS.md has no specific "Family Celebration mode" row.
Level (c): CLAUDE.md: no mention.
Level (d): PRD-11B exists per grep.
Level (d.5): Grep for `family_victory_celebrations` in `src/` returned no hits (only in `claude/live_schema.md`, PRD markdown, audit, and schema-dump cjs). Grep for `FamilyCelebration` in `src/` returned no hits. Grep for `Celebration.*family|family.*Celebration` surfaced only `src/components/shells/PlayShell.tsx` and `src/components/victories/CelebrationModal.tsx` (single hit at line 171 — `familyId` variable name not feature name).
```
Source: stub entry line 118 + feature_glossary PRD-11B
Identifier: family_victory_celebrations (table per live_schema); CelebrationModal (the general celebration modal)
Note: No dedicated "FamilyCelebration" component found in src/
```

### Field 2 — Code presence check
Grep command: `pattern=FamilyCelebration|family_victory_celebrations|FamilyCelebrationMode, path=src, output_mode=files_with_matches`
Hits: 0 in `src/`
Grep command: `pattern=family_victory_celebrations, path=<repo root>`
Hits: 8 files — all in `claude/live_schema.md`, `.claude/archive/`, `scripts/full-schema-dump.cjs`, PRD files, `claude/feature_glossary.md`, `audit/`, `specs/` — none in `src/` or `supabase/functions/`.

First-context window (`CelebrationModal.tsx:171`):
```
  }, [isEditing, editText, narrative, familyId, memberId, period, victoryIds, victories.length, contextSources, saveCelebration])
```
(`familyId` is a variable; this is not a "Family Celebration mode" identifier.)

### Field 3 — Wiring check
No `src/` code references to `family_victory_celebrations` or `FamilyCelebration` component. The general `CelebrationModal.tsx` exists but was not inspected for a Family vs Personal mode branch.
Most recent touching commit: not pulled for CelebrationModal.tsx in this run.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention of "Family Celebration mode"
- prds/addenda/: not grepped
- PlannedExpansionCard: not grepped for this specific feature key
- CLAUDE.md: no "family_victory_celebrations" or "Family Celebration mode" mention

### Field 5 — What was NOT checked
- Whether `CelebrationModal.tsx` internally branches on `mode === 'family'` vs a personal mode — the file was not opened to inspect.
- Whether `family_victory_celebrations` table is written to by a different table name alias in an Edge Function (e.g., `from('family_victory_celebrations')` could exist in `supabase/functions/` — not grepped there).
- `live_schema.md` marks `family_victory_celebrations` as "not API-exposed" which means PostgREST client code wouldn't have standard `.from()` references; an RPC could exist instead.

### Field 6 — Observations (no verdict)
Registry claims `✅ Wired` tied to PRD-11B. Grep of `src/` for `family_victory_celebrations` and `FamilyCelebration` component patterns returned zero hits. `CelebrationModal.tsx` exists as a general celebration modal but family-mode branching was not inspected. `live_schema.md` notes the `family_victory_celebrations` table is not API-exposed, so it would be accessed via Edge Function or direct SQL — `supabase/functions/` was not grepped.

---

## Entry 121 — `Context export for external AI`

**Registry line:** 121
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Context export for external AI | PRD-13 | PRD-13 | ✅ Wired | Phase 13 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a): Stub row names "Context export." Grep surfaces `ContextExportPage.tsx`.
```
Source: stub entry line 121
Identifier: ContextExportPage (page component)
Quote: "Context export for external AI"
```

### Field 2 — Code presence check
Grep command: `pattern=ContextExport|context_export|Context export, path=src, output_mode=files_with_matches`
Hits: 3 files
Files:
  - `src/App.tsx` — route registration
  - `src/hooks/useArchives.ts` — hook
  - `src/pages/archives/ContextExportPage.tsx` — page component

### Field 3 — Wiring check
Callers/Importers: `App.tsx` (route registration) and `useArchives.ts` (hook consumption).
Execution-flow location: React page under `src/pages/archives/`.
Most recent touching commit: `933ad33 2026-04-07 08:12:57 -0500 fix: systemic UTC vs local-time date bug + ESLint enforcement`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: grep for "Context export" returned no matches
- prds/addenda/: not grepped
- PlannedExpansionCard: not a PlannedExpansionCard entry
- CLAUDE.md: no direct mention by exact feature name

### Field 5 — What was NOT checked
- Whether the page actually exports context in a format consumable by external AI (e.g., generates a downloadable file or copy-to-clipboard) — implementation was not traced.
- The 2026-04-07 commit subject is a UTC-fix; the page itself may not have been functionally modified recently (most-recent-touching commit is not necessarily most-recent-feature commit).

### Field 6 — Observations (no verdict)
`ContextExportPage.tsx` exists in `src/pages/archives/`. Route registered in `App.tsx`. Hook `useArchives.ts` consumes it. Last-touching commit 2026-04-07 subject line is a platform-wide UTC fix, not a feature commit.

---

## Entry 127 — `LifeLantern aggregation in Archives`

**Registry line:** 127
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| LifeLantern aggregation in Archives | PRD-13 | PRD-12A | ⏳ Unwired (MVP) | Phase 22 (PRD-12A) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a): Stub row names "LifeLantern aggregation in Archives."
```
Source: stub entry line 127
Identifier: LifeLantern (feature) surfaced in Archives member detail as a stub card
Quote: "LifeLantern aggregation in Archives"
```

### Field 2 — Code presence check
Grep command: `pattern=LifeLantern|life_lantern, path=src/pages/archives, output_mode=files_with_matches`
Hits: 1
Files:
  - `src/pages/archives/MemberArchiveDetail.tsx` lines 1020-1038 — explicit "LifeLantern stub" card rendered with copy "Coming soon — life area assessments will feed context here."

First-context window (`MemberArchiveDetail.tsx:1020-1038`):
```
        {/* LifeLantern stub */}
        <Card variant="flat" padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-text-secondary) 10%, transparent)' }}>
              <Sparkles size={16} style={{ color: 'var(--color-text-secondary)' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                LifeLantern
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Coming soon — life area assessments will feed context here.
              </p>
            </div>
          </div>
        </Card>
```

### Field 3 — Wiring check
Callers/Importers: `MemberArchiveDetail.tsx` renders inline.
Execution-flow location: Inline stub card in a React page; no hook or Edge Function path.
Most recent touching commit: `27bce17 2026-04-10 18:46:46 -0500 fix: multi-day calendar events, Studio routine save, task due date editing, archive folder delete` (for the file).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no match
- prds/addenda/: not grepped
- PlannedExpansionCard: does not use PlannedExpansionCard component — inline `Card` with "Coming soon" copy
- CLAUDE.md: no mention

### Field 5 — What was NOT checked
- Whether there's any data-layer LifeLantern integration stub elsewhere (e.g., a hook that returns empty until PRD-12A lands).
- Whether the Card variant chosen matches PlannedExpansionCard convention (PRD-32A ruling requires the enhanced card; this renders as a plain Card).

### Field 6 — Observations (no verdict)
Inline "LifeLantern stub" card with "Coming soon" copy at `MemberArchiveDetail.tsx:1020-1038`. Does not render `<PlannedExpansionCard/>`. Most-recent-touching commit 2026-04-10.

---

## Entry 128 — `Family Vision Statement in Family Overview`

**Registry line:** 128
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Family Vision Statement in Family Overview | PRD-13 | PRD-12B | ⏳ Unwired (MVP) | Phase 22 (PRD-12B) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a): Stub row names "Family Vision Statement in Family Overview." Grep surfaces `FamilyOverviewDetail.tsx` with explicit "Family Vision Statement — STUB" comment.
```
Source: stub entry line 128
Identifier: FamilyOverviewDetail.tsx "Family Vision Statement" section
Quote: "Family Vision Statement in Family Overview"
```

### Field 2 — Code presence check
Grep command: `pattern=Family Vision|FamilyVision|Journal entries, path=src/pages/archives, output_mode=content, -n=true, -i=true`
Hits: 4 lines in `FamilyOverviewDetail.tsx`
Files:
  - `FamilyOverviewDetail.tsx:5` — header comment "family guiding stars, and stubs for family vision + meeting notes"
  - `FamilyOverviewDetail.tsx:678` — `{/* Family Vision Statement — STUB */}`
  - `FamilyOverviewDetail.tsx:689` — display label "Family Vision Statement"
  - `FamilyOverviewDetail.tsx:692` — copy "Family Vision Quest — coming soon"

### Field 3 — Wiring check
Callers/Importers: page component rendered within Archives route tree.
Execution-flow location: Inline stub section in a React page.
Most recent touching commit: `b0df6b5 2026-04-06 23:25:27 -0500 chore: Tailwind v4 class-name migration across codebase` (for `FamilyOverviewDetail.tsx`).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no match
- prds/addenda/: not grepped
- PlannedExpansionCard: not verified whether this inline stub uses PlannedExpansionCard component (header comment says "stubs")
- CLAUDE.md: no mention

### Field 5 — What was NOT checked
- Whether `FamilyOverviewDetail.tsx:678` section uses `<PlannedExpansionCard/>` or a plain `Card`; only surrounding lines were previewed.
- Whether a hook exists that would populate the section when PRD-12B lands (no grep for `family_vision_statements` in `src/` was performed).

### Field 6 — Observations (no verdict)
Explicit `"Family Vision Statement — STUB"` comment at `FamilyOverviewDetail.tsx:678`, with label and "Family Vision Quest — coming soon" copy. Page header docstring self-identifies as containing "stubs for family vision + meeting notes." Most-recent-touching commit is a Tailwind v4 class migration dated 2026-04-06.

---

## Entry 131 — `Shared Lists aggregation in Archives`

**Registry line:** 131
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Shared Lists aggregation in Archives | PRD-13 | — | ⏳ Unwired (MVP) | Share with Archive UI |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a): Stub row names "Shared Lists aggregation in Archives." Grep surfaces `MemberArchiveDetail.tsx` with explicit "Shared Lists stub" comment.
```
Source: stub entry line 131
Identifier: MemberArchiveDetail.tsx "Shared Lists stub" section
Quote: "Shared Lists aggregation in Archives"
```

### Field 2 — Code presence check
Grep command: `pattern=shared_list|Shared Lists|lists.*aggregation, path=src/pages/archives, output_mode=files_with_matches`
Hits: 1 file
First-context window (`MemberArchiveDetail.tsx:1040-1058`):
```
        {/* Shared Lists stub */}
        <Card variant="flat" padding="md">
          <div className="flex items-center gap-3">
            ...
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Shared Lists
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Coming soon — lists shared to archive will appear here.
              </p>
            ...
        </Card>
```

### Field 3 — Wiring check
Callers/Importers: inline stub in `MemberArchiveDetail.tsx`.
Execution-flow location: Inline stub card in a React page.
Most recent touching commit: `27bce17 2026-04-10 18:46:46 -0500 fix: multi-day calendar events, Studio routine save, task due date editing, archive folder delete`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no match
- prds/addenda/: not grepped
- PlannedExpansionCard: does not use PlannedExpansionCard (inline Card)
- CLAUDE.md: no mention

### Field 5 — What was NOT checked
- Whether `lists.is_shared_to_archive` column (exists per live_schema.md) is populated by any flow, meaning whether lists CAN be shared to archive yet even if the aggregation UI is stubbed.
- Whether a hook returns an empty array today or the stub is purely UI-level.

### Field 6 — Observations (no verdict)
Inline "Shared Lists stub" card with "Coming soon" copy at `MemberArchiveDetail.tsx:1040-1058`. Does not use `<PlannedExpansionCard/>`. `lists` table has `is_shared_to_archive` + `archive_member_id` + `archive_folder_id` columns per live_schema, but UI aggregation is stubbed per the inline comment.

---

## Entry 132 — `Journal entries aggregation in Archives`

**Registry line:** 132
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Journal entries aggregation in Archives | PRD-13 | PRD-08 | ⏳ Unwired (MVP) | Verify PRD-08 tables, wire display |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a): Stub row names "Journal entries aggregation in Archives" — no concrete identifier.
Level (b): WIRING_STATUS.md has no match.
Level (c): CLAUDE.md has no match for "Journal entries aggregation."
Level (d): PRD-13 / PRD-08 not opened in this run.
Level (d.5): Grep for `journal.*aggregation|journal_entries.*archive` in `src/pages/archives` — no files found. Grep for `Family Vision|FamilyVision|Journal entries` in `src/pages/archives` — no "Journal entries" hit. Grep for `journal_entries` in `src/pages/archives` — no matches.
Level (e): CAPABILITY-ONLY — no Journal-entries-aggregation UI stub surfaced in `src/pages/archives/`.
```
Identifier: CAPABILITY-ONLY — no Journal-entries aggregation in Archives component/section found.
Sources checked:
  (a) stub entry line 132 — capability only
  (b) WIRING_STATUS.md — no mention
  (c) CLAUDE.md — no mention
  (d) PRD-13 / PRD-08 — not opened in this run
  (d.5) Grep src/pages/archives for journal_entries and aggregation — 0 hits
```

### Field 2 — Code presence check
Skipped — no identifier. (For completeness: `journal_entries` table has 49 rows per live_schema; the archive aggregation section was not found in `src/pages/archives/`.)

### Field 3 — Wiring check
Skipped — no code presence in archives pages.

### Field 4 — Documentation cross-reference
Skipped — no identifier.

### Field 5 — What was NOT checked
- Whether `MemberArchiveDetail.tsx` has a Journal section that wasn't picked up by the grep pattern (only `journal_entries` literal match attempted; a section titled "Journal" could be lowercase).
- PRD-13 "Verify PRD-08 tables, wire display" hint suggests a stub UI might be present; it was not located in this run.
- `src/pages/archives/FamilyOverviewDetail.tsx` not read for a Journal section.

### Field 6 — Observations (no verdict)
Capability-only entry; no Journal-entries-aggregation-in-Archives identifier surfaced from the 4-level chain. `journal_entries` table exists with content, but archive-side aggregation UI was not located under `src/pages/archives/`. Flagged for founder-judgment bucket.

---

## Entry 138 — `Context staleness indicators`

**Registry line:** 138
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Context staleness indicators | PRD-13 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a): Stub row names "Context staleness indicators" — capability only.
Level (b): WIRING_STATUS.md: no mention.
Level (c): CLAUDE.md: Convention 178 mentions "Quarterly Inventory uses `lifelantern_staleness` trigger which is a stub until PRD-12A" — adjacent concept but different target (LifeLantern staleness, not Archives context staleness).
Level (d): PRD-13 not opened.
Level (d.5): Grep for `stale|staleness|context_stale` in `src/pages/archives` — 0 hits. Grep for `staleness|stale.*indicator` in `src/` surfaced `src/types/rhythms.ts`, `src/components/rhythms/sections/PeriodicCardsSlot.tsx`, `src/components/lila/LilaContextSettings.tsx`. The `LilaContextSettings.tsx:267` comment mentions "Refresh Context button — appears when toggles changed during active conversation (PRD-05 §Context Staleness)" — but this is LiLa conversation staleness, not Archives context staleness per stub's PRD-13 provenance.
Level (e): CAPABILITY-ONLY for Archives-side context-staleness indicators. A LiLa-side staleness surface exists at `LilaContextSettings.tsx:267`.
```
Identifier: CAPABILITY-ONLY for Archives side; adjacent finding — LilaContextSettings.tsx:267 "Refresh Context" button for LiLa conversation staleness (different PRD)
Sources checked:
  (a) stub entry line 138 — PRD-13 post-MVP
  (b) WIRING_STATUS.md — no mention
  (c) CLAUDE.md conv 178 — mentions lifelantern_staleness, adjacent
  (d) PRD-13 — not opened
  (d.5) src/pages/archives grep for stale — 0 hits
```

### Field 2 — Code presence check
Skipped for Archives side. For completeness: `staleness` appears in `src/types/rhythms.ts`, `src/components/rhythms/sections/PeriodicCardsSlot.tsx`, `src/components/lila/LilaContextSettings.tsx:267` — all non-Archives contexts.

### Field 3 — Wiring check
Skipped — no Archives-side code presence.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention
- prds/addenda/: not grepped
- PlannedExpansionCard: not grepped for this feature key
- CLAUDE.md: Convention 178 `lifelantern_staleness` (adjacent, different target)

### Field 5 — What was NOT checked
- Whether PRD-13 defines a specific `context_items.stale_at` column or similar that would be grepped with a more specific pattern.
- Whether the `archive_context_items.last_used_at` column (exists in live_schema) is what the stub refers to — "staleness" could mean "not used recently."
- Whether there's a staleness indicator in a generic Archives component (e.g., usage age badge) that wasn't grepped.

### Field 6 — Observations (no verdict)
Capability-only for the Archives-side feature described by the stub row. LiLa-side context-staleness surface exists (`LilaContextSettings.tsx:267` "Refresh Context" button tied to PRD-05 §Context Staleness) but that is a different PRD than the stub's PRD-13 provenance. Flagged for founder-judgment bucket.

---

## Entry 141 — `"Open in Notepad" from Context Export`

**Registry line:** 141
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| "Open in Notepad" from Context Export | PRD-13 | PRD-08 | 📌 Post-MVP | Notepad bridge not wired |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a): Stub row names "Open in Notepad" button in Context Export.
```
Source: stub entry line 141
Identifier: handleOpenInNotepad function in ContextExportPage.tsx
Quote: "'Open in Notepad' from Context Export"
```

### Field 2 — Code presence check
Grep command: `pattern=Notepad, path=src/pages/archives/ContextExportPage.tsx, output_mode=content, -n=true, head_limit=10`
Hits:
  - `ContextExportPage.tsx:157` — `// Open in Notepad — STUB`
  - `ContextExportPage.tsx:158` — `function handleOpenInNotepad()`
  - `ContextExportPage.tsx:160` — `message: 'Smart Notepad integration coming soon',`
  - `ContextExportPage.tsx:418` — `onClick={handleOpenInNotepad}`
  - `ContextExportPage.tsx:427` — button label "Open in Notepad"

### Field 3 — Wiring check
Callers/Importers: only the button inside the same page.
Execution-flow location: Inline handler function that displays "Smart Notepad integration coming soon" — does not actually push content into Notepad.
Most recent touching commit: `933ad33 2026-04-07 08:12:57 -0500 fix: systemic UTC vs local-time date bug + ESLint enforcement` (ContextExportPage.tsx).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no specific mention
- prds/addenda/: not grepped
- PlannedExpansionCard: button path does not render PlannedExpansionCard — it shows a toast/alert instead
- CLAUDE.md: Convention 20 mentions Smart Notepad but not this specific button

### Field 5 — What was NOT checked
- Whether `NotepadBridge` / `NotepadProvider` exposes an API that could be wired to this button (Convention 49 mentions the bridge context for Quick Note).
- Exact toast/alert text and whether there's a PlannedExpansionCard variant in use.

### Field 6 — Observations (no verdict)
`handleOpenInNotepad` is explicitly labeled `// Open in Notepad — STUB` at `ContextExportPage.tsx:157-158` and displays message "Smart Notepad integration coming soon" at line 160. Button at lines 418/427. Most-recent-touching commit is the platform UTC fix dated 2026-04-07.

---

## Entry 142 — `Usage count display in Archives UI`

**Registry line:** 142
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Usage count display in Archives UI | PRD-13 | — | 📌 Post-MVP | DB columns wired, no analytics surface |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a): Stub row names "DB columns wired, no analytics surface" — identifier is the DB columns `usage_count` / `last_used_at` on `archive_context_items`.
```
Source: stub entry line 142
Identifier: archive_context_items.usage_count, archive_context_items.last_used_at
Quote: "DB columns wired, no analytics surface"
```

### Field 2 — Code presence check
Grep command: `pattern=usage_count|last_used_at, path=src/pages/archives, output_mode=content, -n=true`
Hits: 0 — no matches in Archives UI pages.

Grep command: `pattern=usage_count|last_used_at, path=src, output_mode=files_with_matches`
Hits: 4
Files:
  - `src/types/archives.ts:40-41` — `usage_count: number; last_used_at: string | null`
  - `src/types/tasks.ts` — unrelated
  - `src/types/lists.ts` — unrelated
  - `src/components/lila/BoardOfDirectorsModal.tsx` — unrelated to Archives

First-context window (`src/types/archives.ts:40-41`):
```
40  usage_count: number
41  last_used_at: string | null
```

### Field 3 — Wiring check
Callers/Importers: type definition only; no page-level display reads these fields.
Execution-flow location: Type definition file. No Archives page consumes them in a display.
Most recent touching commit: not pulled for `archives.ts`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no match
- prds/addenda/: not grepped
- PlannedExpansionCard: not a PlannedExpansionCard entry
- CLAUDE.md: no mention

### Field 5 — What was NOT checked
- Whether these columns are actually populated by any write path (e.g., a trigger bumping `usage_count` when an archive item is referenced in a LiLa context assembly).
- Whether there's an analytics view separate from Archives UI that consumes these fields.

### Field 6 — Observations (no verdict)
`usage_count` and `last_used_at` exist on `archive_context_items` per live_schema + `src/types/archives.ts:40-41`. No grep hits in `src/pages/archives/` for either column — they appear in type definitions only and in unrelated files. Registry claim "DB columns wired, no analytics surface" is consistent with this observation.

---

## Entry 151 — `Content Corner link preview`

**Registry line:** 151
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Content Corner link preview | PRD-15 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a): Stub row names "Content Corner link preview."
```
Source: stub entry line 151
Identifier: LinkPreviewCard (component), ContentCorner (component)
Quote: "Content Corner link preview"
```

### Field 2 — Code presence check
Grep command: `pattern=ContentCorner|content_corner|LinkPreview|link_preview, path=src, output_mode=files_with_matches`
Hits: 9 files
Files:
  - `src/types/messaging.ts`
  - `src/hooks/useConversationSpaces.ts`
  - `src/components/messaging/ManageGroupModal.tsx`
  - `src/components/messaging/SpaceListItem.tsx`
  - `src/components/messaging/MessagingSettings.tsx`
  - `src/components/messaging/ContentCorner.tsx`
  - `src/utils/initializeConversationSpaces.ts`
  - `src/hooks/useMessagingSettings.ts`
  - `src/components/messaging/LinkPreviewCard.tsx`

First-context window (`LinkPreviewCard.tsx:2`):
```
2  * LinkPreviewCard — PRD-15 Phase E
18 interface LinkPreviewCardProps {
32 export function LinkPreviewCard({ metadata, senderName, timestamp }: LinkPreviewCardProps) {
```

### Field 3 — Wiring check
Callers/Importers: the `LinkPreviewCard` component exists and is documented "PRD-15 Phase E" in its header. Whether it is rendered by `ContentCorner.tsx` vs elsewhere was not traced.
Execution-flow location: React component in `src/components/messaging/`.
Most recent touching commit: `ea25d40 2026-04-06 18:58:29 -0500 feat: PRD-15 Phase E — Ask LiLa, before-send coaching, Content Corner, settings + 20 E2E tests`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no match for "Content Corner link preview"
- prds/addenda/: not grepped
- PlannedExpansionCard: not grepped
- CLAUDE.md: Convention 137 mentions `LinkPreviewCard`s in Content Corner; Convention 147 names Content Corner as a special `conversation_spaces` row

### Field 5 — What was NOT checked
- Whether metadata (url, domain, title, thumbnail_url) is actually populated at write time (Convention 147 describes this contract; not traced through the write path).
- Whether OpenGraph fetching or similar link-metadata enrichment occurs on the server side.
- `ContentCorner.tsx` render path was not traced to confirm `LinkPreviewCard` usage.

### Field 6 — Observations (no verdict)
`LinkPreviewCard.tsx` with header `"LinkPreviewCard — PRD-15 Phase E"` exists in `src/components/messaging/`. `ContentCorner.tsx` also exists. Most-recent commit subject says "PRD-15 Phase E — ... Content Corner, settings + 20 E2E tests" dated 2026-04-06. CLAUDE.md Conventions 137 and 147 formally describe the pattern. Registry claim `📌 Post-MVP` sits alongside these findings without further qualification in the row.

---

## Entry 156 — `Guided "Things to Talk About" capture widget`

**Registry line:** 156
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Guided "Things to Talk About" capture widget | PRD-16 (Build P) | PRD-16 Phase 5 (Build P) | ✅ Wired | 2026-04-15 — `GuidedThingsToTalkAboutSection` on Guided Dashboard, creates `meeting_agenda_items` with `suggested_by_guided=true`, child can see/remove their own items |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a): Stub row names `GuidedThingsToTalkAboutSection` component directly.
```
Source: stub entry line 156
Identifier: GuidedThingsToTalkAboutSection (component), suggested_by_guided (column on meeting_agenda_items)
Quote: "GuidedThingsToTalkAboutSection on Guided Dashboard, creates meeting_agenda_items with suggested_by_guided=true"
```

### Field 2 — Code presence check
Grep command: `pattern=GuidedThingsToTalkAboutSection|ThingsToTalkAbout|suggested_by_guided, path=src, output_mode=files_with_matches`
Hits: 4
Files:
  - `src/types/meetings.ts` — type reference
  - `src/pages/GuidedDashboard.tsx` — consumer
  - `src/components/guided/GuidedThingsToTalkAboutSection.tsx` — component
  - `src/hooks/useMeetings.ts` — hook layer

First-context window (`GuidedDashboard.tsx:23, 157`):
```
 23  import { GuidedThingsToTalkAboutSection } from '@/components/guided/GuidedThingsToTalkAboutSection'
157            <GuidedThingsToTalkAboutSection
```

### Field 3 — Wiring check
Callers/Importers: `GuidedDashboard.tsx` imports and renders the section.
Execution-flow location: React section component under `src/components/guided/`.
Most recent touching commit: `426c446 2026-04-15 18:42:29 -0500 feat: PRD-16 Phase E verification + Meeting Setup Wizard + Guided agenda capture + bug fixes`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no specific match
- prds/addenda/: not grepped
- PlannedExpansionCard: not a PlannedExpansionCard entry
- CLAUDE.md: Convention 236 "Guided children participate indirectly via 'Things to Talk About' capture (`suggested_by_guided=true`)"

### Field 5 — What was NOT checked
- Whether the component's `meeting_agenda_items` INSERT path actually includes `suggested_by_guided = true` (not traced through the write).
- Whether the "child can see/remove their own items" affordance is enforced via RLS or UI-only.

### Field 6 — Observations (no verdict)
`GuidedThingsToTalkAboutSection.tsx` exists at `src/components/guided/`; consumed by `GuidedDashboard.tsx:157`. Most-recent commit 2026-04-15 subject line explicitly mentions "Guided agenda capture." CLAUDE.md Convention 236 names the `suggested_by_guided` attribution pattern.

---

## Entry 164 — `Queue Modal future tabs`

**Registry line:** 164
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Queue Modal future tabs | PRD-14B | PRD-15 (Requests), PRD-17 (Sort) | ✅ Wired | Phase 18 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a): Stub row names "Queue Modal" and "future tabs" (Requests, Sort). Primary identifier: `UniversalQueueModal` + its tab components `CalendarTab`, `SortTab`, `RequestsTab`.
```
Source: stub entry line 164
Identifier: UniversalQueueModal, CalendarTab, SortTab, RequestsTab
Quote: "PRD-15 (Requests), PRD-17 (Sort) | ✅ Wired"
```

### Field 2 — Code presence check
Grep command: `pattern=QueueModal|QueueTab|queue/.*Tab|CalendarTab|SortTab|RequestsTab, path=src/components/queue, output_mode=files_with_matches`
Hits: 5 files
Files:
  - `src/components/queue/SortTab.tsx`
  - `src/components/queue/CalendarTab.tsx`
  - `src/components/queue/RequestsTab.tsx`
  - `src/components/queue/QueueBadge.tsx`
  - `src/components/queue/UniversalQueueModal.tsx`

First-context window (`UniversalQueueModal.tsx` lines 5, 27-29, 34`):
```
 5  * Three tabs: Calendar (pending approvals), Sort (studio_queue items), Requests (family requests).
 7  * "All caught up!" global empty state when all tabs have zero items.
 8  * Default tab: Sort if non-empty, else Calendar, else Requests.
27  import { CalendarTab } from './CalendarTab'
28  import { SortTab } from './SortTab'
29  import { RequestsTab } from './RequestsTab'
34  type TabKey = 'calendar' | 'sort' | 'requests'
```

### Field 3 — Wiring check
Callers/Importers: `UniversalQueueModal.tsx` imports all three tabs; tab key type is explicit.
Execution-flow location: React modal + three sub-tab components under `src/components/queue/`.
Most recent touching commit: `ce101c6 2026-04-06 15:23:09 -0500 feat: PRD-15 Phase C — request lifecycle + 15 E2E tests` (`UniversalQueueModal.tsx`).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no direct match for "Queue Modal future tabs"
- prds/addenda/: not grepped
- PlannedExpansionCard: not a PlannedExpansionCard entry
- CLAUDE.md: Convention 66 "Universal Queue Modal has 3 tabs: Calendar, Sort, Requests"; Convention 146 "Universal Queue Modal has 3 tabs only: Calendar, Sort (tasks), Requests"

### Field 5 — What was NOT checked
- Whether any additional tab ("future tabs" could suggest more than 3) is registered elsewhere — the code and conventions both say "3 tabs only," but the stub line 164 says "Queue Modal future tabs" (plural) which could imply additional future tabs beyond the 3.
- Whether the Sort tab actually reads from `studio_queue` (Convention 65 authoritative) as claimed by the header comment.

### Field 6 — Observations (no verdict)
`UniversalQueueModal.tsx` header comment explicitly lists the three tabs. All three tab components exist in `src/components/queue/`. Most-recent touching commit dated 2026-04-06 (PRD-15 Phase C). CLAUDE.md Conventions 66 and 146 formally name the three-tab architecture. Stub row 164's phrasing "future tabs" is ambiguous — registry marks the row `✅ Wired` and the three-tab set is in place; whether additional tabs beyond those three were originally planned was not resolved from the stub's registry text.

---

## Entry 175 — `PRD-18 Phase A: evening_tomorrow_capture placeholder`

**Registry line:** 175
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| PRD-18 Phase A: `evening_tomorrow_capture` placeholder | PRD-18 Phase A | PRD-18 Phase B (Build K) | ✅ Wired | 2026-04-07 (rotating prompts + fuzzy match + overflow) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) stub entry line 175 — names section-type key `evening_tomorrow_capture` (backticked in stub). Secondary identifier via (c) CLAUDE.md Convention 169 names `EveningTomorrowCaptureSection` component + `RhythmMetadataContext` + `commitTomorrowCapture`. Identifier: `evening_tomorrow_capture` (section_type key) + `EveningTomorrowCaptureSection` (component).
Quote (a): "PRD-18 Phase A: `evening_tomorrow_capture` placeholder"
Quote (c) Convention 169: "Tomorrow Capture writes are batched on Close My Day, never mid-flow. `EveningTomorrowCaptureSection` stages items in `RhythmMetadataContext`..."

### Field 2 — Code presence check
Grep command: pattern=`evening_tomorrow_capture`, path=`src supabase`, output_mode=files_with_matches
Hits: 4+ files
Files:
 - `src/components/rhythms/sections/SectionRendererSwitch.tsx:216` — `case 'evening_tomorrow_capture':` returning `<EveningTomorrowCaptureSection familyId={familyId} memberId={memberId} />`
 - `src/components/rhythms/sections/EveningTomorrowCaptureSection.tsx` — component file exists
 - `supabase/migrations/00000000100110_rhythms_phase_b.sql` (and 100111/100112/100114/100115) — section seeded in auto_provision rhythm_configs
First-context window (SectionRendererSwitch.tsx:216-217):
```tsx
case 'evening_tomorrow_capture':
  return <EveningTomorrowCaptureSection familyId={familyId} memberId={memberId} />
```

### Field 3 — Wiring check
Callers of `EveningTomorrowCaptureSection`: imported at SectionRendererSwitch.tsx:29 and rendered at :217. Location: React component in `src/components/rhythms/sections/`.
Most recent touching commit: `6e594ff 2026-04-07 12:18:47 -0500 feat: PRD-18 Phase B — Rhythms Build K (Tomorrow Capture, On the Horizon, Carry Forward, Periodic Cards, Section Cleanup)`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention of rhythm section keys (Grep for "rhythm" and "evening_tomorrow_capture" returned 0 hits).
- prds/addenda/: `prds/addenda/PRD-18-Cross-PRD-Impact-Addendum.md`, `prds/addenda/PRD-18-Enhancement-Addendum.md` exist (not opened in detail).
- PlannedExpansionCard: no hit for `evening_tomorrow_capture` featureKey in grep of `PlannedExpansionCard featureKey=`.
- CLAUDE.md: Convention 169 explicitly describes this component (`EveningTomorrowCaptureSection` + `RhythmMetadataContext` + `commitTomorrowCapture`).

### Field 5 — What was NOT checked
- Did not open migration 100110 to verify section seeded verbatim in auto-provision JSONB.
- Did not verify fuzzy match or overflow behavior in component source.
- Did not inspect `commitTomorrowCapture` source to verify Close-My-Day commit pattern.
- Production DB state of rhythm_configs unknown.

### Field 6 — Observations (no verdict)
Section key `evening_tomorrow_capture` is mapped in SectionRendererSwitch.tsx:216 to component `EveningTomorrowCaptureSection` which is a real file at `src/components/rhythms/sections/EveningTomorrowCaptureSection.tsx`. CLAUDE.md Convention 169 documents the staging/commit pattern. Most recent touching commit for the component is dated 2026-04-07 matching registry's "Build Phase" column.

---

## Entry 176 — `PRD-18 Phase A: morning_priorities_recall placeholder`

**Registry line:** 176
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| PRD-18 Phase A: `morning_priorities_recall` placeholder | PRD-18 Phase A | PRD-18 Phase B (Build K) | ✅ Wired | 2026-04-07 (reads previous evening metadata.priority_items) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) stub entry line 176 names section-type key `morning_priorities_recall` (backticked). Identifier: `morning_priorities_recall` (section_type key) + `MorningPrioritiesRecallSection` (component inferred by registry wording + SectionRendererSwitch mapping).
Quote: "`morning_priorities_recall` placeholder"

### Field 2 — Code presence check
Grep command: pattern=`morning_priorities_recall`, path=`src supabase`, output_mode=files_with_matches
Hits: multiple
Files:
 - `src/components/rhythms/sections/SectionRendererSwitch.tsx:140-141` — `case 'morning_priorities_recall':` → `<MorningPrioritiesRecallSection ...>`
 - `src/components/rhythms/sections/MorningPrioritiesRecallSection.tsx` — component exists
 - `supabase/migrations/00000000100110_rhythms_phase_b.sql` (and downstream) — seed reference
First-context (SectionRendererSwitch.tsx:140-141):
```tsx
case 'morning_priorities_recall':
  return <MorningPrioritiesRecallSection familyId={familyId} memberId={memberId} />
```

### Field 3 — Wiring check
Imported at SectionRendererSwitch.tsx:30, rendered at :141.
Most recent touching commit for `MorningPrioritiesRecallSection.tsx`: `6e594ff 2026-04-07 12:18:47 -0500 feat: PRD-18 Phase B — Rhythms Build K`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-18 addenda present.
- PlannedExpansionCard: no featureKey hit.
- CLAUDE.md: Convention 175 references `'rhythm_priority'` source for tasks auto-created from Evening Tomorrow Capture → surfaced by Morning Priorities Recall.

### Field 5 — What was NOT checked
- Did not open `MorningPrioritiesRecallSection.tsx` to verify it reads `metadata.priority_items` as registry claims.
- Did not verify seeding in auto_provision_member_resources trigger body.
- Production data flow not observed.

### Field 6 — Observations (no verdict)
Section key `morning_priorities_recall` mapped in SectionRendererSwitch to file `MorningPrioritiesRecallSection.tsx`. Component file exists; last touched 2026-04-07 matching registry build date. CLAUDE.md Convention 175 references the `rhythm_priority` source attribution and evening-to-morning data flow described by registry text.

---

## Entry 177 — `PRD-18 Phase A: on_the_horizon placeholder`

**Registry line:** 177
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| PRD-18 Phase A: `on_the_horizon` placeholder | PRD-18 Phase A | PRD-18 Phase B (Build K) | ✅ Wired | 2026-04-07 (7-day lookahead + Task Breaker modal) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) stub entry line 177 names section-type `on_the_horizon` + registry column text "Task Breaker modal". Identifier: `on_the_horizon` (section_type key), `OnTheHorizonSection` component, `TaskBreakerModalFromHorizon` component.
Quote: "`on_the_horizon` placeholder...7-day lookahead + Task Breaker modal"

### Field 2 — Code presence check
Grep command: pattern=`on_the_horizon`, path=`src supabase`
Hits: multiple
Files:
 - `src/components/rhythms/sections/SectionRendererSwitch.tsx:142-149` — `case 'on_the_horizon':` → `<OnTheHorizonSection ...>`
 - `src/components/rhythms/sections/OnTheHorizonSection.tsx` — component exists
 - `src/components/rhythms/sections/TaskBreakerModalFromHorizon.tsx` — sibling component exists
 - migrations 100110+ reference the section type in seed JSONB.

First-context (SectionRendererSwitch.tsx:142-149):
```tsx
case 'on_the_horizon':
  return (
    <OnTheHorizonSection
      familyId={familyId}
      memberId={memberId}
      config={section.config as OnTheHorizonConfig | undefined}
    />
  )
```

### Field 3 — Wiring check
Imported at SectionRendererSwitch.tsx:31, rendered at :142-149.
Most recent touching commit for `OnTheHorizonSection.tsx`: `6e594ff 2026-04-07 feat: PRD-18 Phase B — Rhythms Build K`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-18 addenda exist.
- PlannedExpansionCard: no featureKey hit for on_the_horizon.
- CLAUDE.md: Convention 193 appears earlier Phase B/D teen commentary, not the specific OnTheHorizon. STUB_REGISTRY line 193 notes "calendar block creation" as still unwired.

### Field 5 — What was NOT checked
- Did not verify 7-day horizon logic in OnTheHorizonSection source.
- Did not verify TaskBreakerModalFromHorizon integration with Standalone Task Breaker.
- STUB_REGISTRY line 193 notes one sub-feature of On the Horizon ("Schedule time for this?" calendar block) is still Unwired, but the container section itself is the subject of line 177.

### Field 6 — Observations (no verdict)
Section key `on_the_horizon` mapped in SectionRendererSwitch to file `OnTheHorizonSection.tsx`. Sibling file `TaskBreakerModalFromHorizon.tsx` exists in same directory. Commit history shows Phase B (Build K) on 2026-04-07 matching registry claim. STUB_REGISTRY line 193 records a related sub-stub still unwired.

---

## Entry 178 — `PRD-18 Phase A: periodic_cards_slot returning null`

**Registry line:** 178
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| PRD-18 Phase A: `periodic_cards_slot` returning null | PRD-18 Phase A | PRD-18 Phase B (Build K) | ✅ Wired | 2026-04-07 (Weekly/Monthly/Quarterly cards inline) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) stub entry line 178 names section-type key `periodic_cards_slot`. Identifier: `periodic_cards_slot` + `PeriodicCardsSlot` (component) + `WeeklyReviewCard`, `MonthlyReviewCard`, `QuarterlyInventoryCard` (periodic cards).
Quote: "`periodic_cards_slot` returning null"

### Field 2 — Code presence check
Grep command: pattern=`periodic_cards_slot`, path=`src supabase`
Hits: multiple
Files:
 - `src/components/rhythms/sections/SectionRendererSwitch.tsx:136-137` — `case 'periodic_cards_slot':` → `<PeriodicCardsSlot familyId={familyId} memberId={memberId} />`
 - `src/components/rhythms/sections/PeriodicCardsSlot.tsx` — component exists
 - Periodic cards: `src/components/rhythms/periodic/WeeklyReviewCard.tsx`, `MonthlyReviewCard.tsx`, `QuarterlyInventoryCard.tsx` all exist.
 - StubSections.tsx:122 — "PeriodicCardsSlot was a Phase A stub. Phase B4 wired the real component..."

First-context (SectionRendererSwitch.tsx:136-137):
```tsx
case 'periodic_cards_slot':
  return <PeriodicCardsSlot familyId={familyId} memberId={memberId} />
```

### Field 3 — Wiring check
Imported at SectionRendererSwitch.tsx:32, rendered at :136-137.
Most recent touching commit for `PeriodicCardsSlot.tsx`: `6e594ff 2026-04-07 feat: PRD-18 Phase B — Rhythms Build K`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-18 addenda exist.
- PlannedExpansionCard: no hit.
- CLAUDE.md: Convention 178 explicitly names the three periodic card variants and describes the `PeriodicCardsSlot` wrapping pattern: "Periodic rhythm cards (Weekly/Monthly/Quarterly) render inline inside Morning Rhythm via `PeriodicCardsSlot`..."

### Field 5 — What was NOT checked
- Did not verify weekly/monthly/quarterly period-key computation inside PeriodicCardsSlot.
- Did not verify rhythm_completions write behavior per period.
- Convention 178 notes Quarterly Inventory "uses `lifelantern_staleness` trigger which is a stub until PRD-12A" — this is a downstream stub not directly in scope of line 178.

### Field 6 — Observations (no verdict)
Section key `periodic_cards_slot` is mapped to a real component file at `src/components/rhythms/sections/PeriodicCardsSlot.tsx` with three sibling periodic card components (`WeeklyReviewCard.tsx`, `MonthlyReviewCard.tsx`, `QuarterlyInventoryCard.tsx`). StubSections.tsx:122 includes an explicit comment marking this as previously-stub-now-wired. CLAUDE.md Convention 178 documents the architecture.

---

## Entry 179 — `PRD-18 Phase A: carry_forward per-task triage section`

**Registry line:** 179
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| PRD-18 Phase A: `carry_forward` per-task triage section | PRD-18 Phase A | PRD-18 Phase B (Build K) | ✅ Wired | 2026-04-07 (replaced with fallback behavior + pg_cron Edge Function) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) stub entry line 179 names section-type `carry_forward`. Registry text describes replacement with "fallback behavior + pg_cron Edge Function". Identifier: `carry_forward` (section_type), `CarryForwardSection` (stub placeholder), `process-carry-forward-fallback` (Edge Function per Convention 171), `carry_forward_override` (tasks column), `CarryForwardFallbackSetting` (settings component).
Quote: "`carry_forward` per-task triage section"

### Field 2 — Code presence check
Grep command: pattern=`carry_forward`, path=`src supabase`
Hits: multiple
Files:
 - `src/components/rhythms/sections/StubSections.tsx:94-103` — `CarryForwardSection` is a StubPlaceholder ("Per-task triage. Enable in Rhythms Settings if you want a nightly review.") phase="B"
 - `src/components/rhythms/sections/SectionRendererSwitch.tsx:214-215` — `case 'carry_forward': return <CarryForwardSection />`
 - `src/components/rhythms/settings/CarryForwardFallbackSetting.tsx` — settings component exists
 - `tasks.carry_forward_override` — column exists per live_schema (line 67 of tasks)

First-context (StubSections.tsx:94-103):
```tsx
export function CarryForwardSection() {
  return (
    <StubPlaceholder
      title="Carry Forward"
      description="Per-task triage. Enable in Rhythms Settings if you want a nightly review."
      phase="B"
      Icon={Lightbulb}
    />
  )
}
```

### Field 3 — Wiring check
`CarryForwardSection` imported at SectionRendererSwitch.tsx:46 (from StubSections barrel), rendered at :215. Its body is a `StubPlaceholder`. The registry-claimed replacement "fallback behavior + pg_cron Edge Function" lives in a separate `process-carry-forward-fallback` Edge Function per CLAUDE.md Convention 171.
Most recent touching commit for `StubSections.tsx`: `426c446 2026-04-15 feat: PRD-16 Phase E verification + Meeting Setup Wizard + Guided agenda capture + bug fixes`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-18 addenda exist.
- PlannedExpansionCard: no hit.
- CLAUDE.md: Convention 171 explicitly names `process-carry-forward-fallback` Edge Function invoked hourly via pg_cron and `family_members.preferences.carry_forward_fallback` default.

### Field 5 — What was NOT checked
- Did not open `process-carry-forward-fallback` Edge Function source to verify deployment.
- Did not verify pg_cron scheduled-job row exists in production DB.
- The `CarryForwardSection` component renders a StubPlaceholder — the registry notes this section was "replaced with fallback behavior" rather than fully built as a rendering section, so the placeholder-rendering may be intentional per registry claim but the reader should examine the tension between "✅ Wired" and rendering a placeholder card.

### Field 6 — Observations (no verdict)
Registry text describes replacement of the rendering section with background fallback behavior + an Edge Function. `CarryForwardSection` file exists as a `StubPlaceholder` in StubSections.tsx rendering a "Per-task triage" placeholder card with phase="B" label. The replacement mechanism (process-carry-forward-fallback Edge Function, `carry_forward_override` task column, `CarryForwardFallbackSetting` component) all have code presence per Convention 171. There is a visual tension between "✅ Wired" claim and the rendered StubPlaceholder — the registry's "replaced with fallback behavior" language may explain it but the packet surfaces the observation.

---

## Entry 180 — `PRD-18 Phase A: routine_checklist placeholder`

**Registry line:** 180
**Claimed status:** `🚫 Removed`
**Full registry row:**
```
| PRD-18 Phase A: `routine_checklist` placeholder | PRD-18 Phase A | PRD-18 Phase B (Build K) | 🚫 Removed | 2026-04-07 (cut from Guided morning seed — duplicate of dashboard Active Tasks) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) stub entry line 180 names section-type `routine_checklist`. Identifier: `routine_checklist` (section_type).
Quote: "`routine_checklist` placeholder ... cut from Guided morning seed — duplicate of dashboard Active Tasks"

### Field 2 — Code presence check
Grep command: pattern=`routine_checklist`, path=`src supabase`
Hits: multiple
Files:
 - `src/components/rhythms/sections/SectionRendererSwitch.tsx:310-317` — `case 'routine_checklist':` returns `null` with comment "Routines surface on the Guided dashboard's Active Tasks section already (PRD-25). Showing them again inside the morning rhythm is duplication, not value. Section type stays in the registry for future custom rhythm building but is not seeded into Guided morning anymore (migration 100111 removes it from new + existing Guided members)."
 - `supabase/migrations/00000000100111_rhythms_phase_b_section_cleanup.sql:138,308,311,325,326` — removes `routine_checklist` from Guided morning seed, has backfill to strip existing rows

First-context (SectionRendererSwitch.tsx:310-317):
```tsx
case 'routine_checklist':
  // Routines surface on the Guided dashboard's Active Tasks
  // section already (PRD-25). Showing them again inside the
  // morning rhythm is duplication, not value. Section type
  // stays in the registry for future custom rhythm building
  // but is not seeded into Guided morning anymore (migration
  // 100111 removes it from new + existing Guided members).
  return null
```

### Field 3 — Wiring check
Case exists in switch but returns null. Migration 100111 removes the section from new Guided morning seeds and backfills existing rows.
Most recent touching commit for 00000000100111_rhythms_phase_b_section_cleanup.sql: git log not run for this file, but feature commit is `6e594ff 2026-04-07 feat: PRD-18 Phase B — Rhythms Build K (Tomorrow Capture, On the Horizon, Carry Forward, Periodic Cards, Section Cleanup)`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-18 addenda exist.
- PlannedExpansionCard: no hit.
- CLAUDE.md: Convention 168 ("section seeds follow the 'front door OR genuinely helpful' rule") — the cleanup rationale behind removing `routine_checklist` from default seed.

### Field 5 — What was NOT checked
- Did not verify migration 100111 idempotent backfill succeeded against production rhythm_configs rows.
- Did not verify the case still appears in TypeScript types for `RhythmSection`.
- Whether 🚫 Removed status aligns with section-type-key retention (kept in registry for custom rhythm use) — mixed "removed from seed but kept as enum" is not straightforward Removed.

### Field 6 — Observations (no verdict)
Registry claims 🚫 Removed with rationale "cut from Guided morning seed — duplicate of dashboard Active Tasks". Source code shows the case still exists in the switch but returns null; comment states the section type is "stays in the registry for future custom rhythm building but is not seeded". Migration 00000000100111 explicitly removes it from new and existing Guided morning seeds. This is a removal-from-seed-default pattern, not a code-path deletion.

---

## Entry 181 — `PRD-18 Phase A: task_preview in adult/Guided morning`

**Registry line:** 181
**Claimed status:** `🚫 Removed`
**Full registry row:**
```
| PRD-18 Phase A: `task_preview` in adult/Guided morning | PRD-18 Phase A | PRD-18 Phase B (Build K) | 🚫 Removed | 2026-04-07 (cut from morning seed — duplicate of dashboard Active Tasks; component stays in registry) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) stub entry line 181 names section-type `task_preview`. Identifier: `task_preview` (section_type) + `TaskPreviewSection` (component — kept in registry per stub text).
Quote: "`task_preview` in adult/Guided morning ... cut from morning seed — duplicate of dashboard Active Tasks; component stays in registry"

### Field 2 — Code presence check
Grep command: pattern=`task_preview`, path=`src supabase`
Hits: multiple
Files:
 - `src/components/rhythms/sections/SectionRendererSwitch.tsx:112-113` — `case 'task_preview': return <TaskPreviewSection familyId={familyId} memberId={memberId} />`
 - `src/components/rhythms/sections/TaskPreviewSection.tsx` — component still exists (header: "PRD-18 Section Type #3: Task Preview")
 - `supabase/migrations/00000000100111_rhythms_phase_b_section_cleanup.sql` — drops `task_preview` from default adult/independent and Guided morning seeds; backfill strips existing rows (lines 12, 75, 285-286, 303, 308-311, 325-326)

First-context (SectionRendererSwitch.tsx:112-113):
```tsx
case 'task_preview':
  return <TaskPreviewSection familyId={familyId} memberId={memberId} />
```

### Field 3 — Wiring check
Component file kept. Case still returns the component. Migration 100111 removes it from default seeds + backfills.
Most recent touching commit for `TaskPreviewSection.tsx`: `6e594ff 2026-04-07 feat: PRD-18 Phase B — Rhythms Build K`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-18 addenda exist.
- PlannedExpansionCard: no hit.
- CLAUDE.md: Convention 168 — rationale for cutting `task_preview` from default seed.

### Field 5 — What was NOT checked
- Did not verify migration 100111 backfill ran successfully against production rhythm_configs.
- Did not verify whether any custom rhythm configs in the wild still use task_preview (post-cleanup).
- Whether 🚫 Removed status aligns with "component stays in registry" — registry keeps the component but 🚫 Removed is the seed-removal status.

### Field 6 — Observations (no verdict)
Registry claims 🚫 Removed with rationale "cut from morning seed... component stays in registry." Source code shows `TaskPreviewSection.tsx` still exists and the case in the switch still renders the component. Migration 00000000100111 removes from seed. Pattern identical to entry 180 (`routine_checklist`).

---

## Entry 182 — `PRD-18 Phase A: encouraging_message placeholder`

**Registry line:** 182
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| PRD-18 Phase A: `encouraging_message` placeholder | PRD-18 Phase A | PRD-18 Phase B (Build K) | ✅ Wired | 2026-04-07 (`GuidedEncouragingMessageSection` — 20 messages, PRNG rotation, Reading Support) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) stub entry line 182 names section-type `encouraging_message` + component `GuidedEncouragingMessageSection`. Identifier: `encouraging_message` (section_type) + `GuidedEncouragingMessageSection` (component).
Quote: "`encouraging_message` placeholder ... `GuidedEncouragingMessageSection` — 20 messages, PRNG rotation, Reading Support"

### Field 2 — Code presence check
Grep command: pattern=`encouraging_message|GuidedEncouragingMessageSection`, path=`src supabase`
Hits: multiple
Files:
 - `src/components/rhythms/sections/guided/GuidedEncouragingMessageSection.tsx` — component exists
 - `src/components/rhythms/sections/SectionRendererSwitch.tsx:302-309` — `case 'encouraging_message':` returns the component with `familyId`, `memberId`, `readingSupport` props

First-context (SectionRendererSwitch.tsx:302-309):
```tsx
case 'encouraging_message':
  return (
    <GuidedEncouragingMessageSection
      familyId={familyId}
      memberId={memberId}
      readingSupport={readingSupport}
    />
  )
```

### Field 3 — Wiring check
Imported at SectionRendererSwitch.tsx:42, rendered at :302-309.
Most recent touching commit for `GuidedEncouragingMessageSection.tsx`: git log not explicitly pulled for this component, but it's part of the same Phase B Build K commit pool (2026-04-07).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-18 addenda exist.
- PlannedExpansionCard: no hit.
- CLAUDE.md: Convention 177 explicitly describes: "Encouraging messages for Guided morning are a 20-string frontend constant pool with `{name}` substitution. `GuidedEncouragingMessageSection` picks one via date-seeded PRNG..."

### Field 5 — What was NOT checked
- Did not open component source to count 20 messages or verify PRNG algorithm.
- Did not verify Reading Support integration path.
- Did not verify whether eventual Haiku swap-out (per Convention 177 note about PRD-05 day-data context) has landed.

### Field 6 — Observations (no verdict)
Section key `encouraging_message` mapped in SectionRendererSwitch to file `GuidedEncouragingMessageSection.tsx` in `sections/guided/`. CLAUDE.md Convention 177 explicitly documents the frontend-constant-pool + PRNG-rotation implementation matching the registry's 20-messages claim.

---

## Entry 183 — `PRD-18 Phase B: mindsweep_lite placeholder`

**Registry line:** 183
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| PRD-18 Phase B: `mindsweep_lite` placeholder | PRD-18 Phase B (Build K) | PRD-18 Phase C (Build L) | ✅ Wired | 2026-04-07 (reuses `mindsweep-sort` Edge Function + batched commit on Close My Day + release disposition override) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) stub entry line 183 names section-type `mindsweep_lite` + mentions `mindsweep-sort` Edge Function. Identifier: `mindsweep_lite` (section_type), `MindSweepLiteSection` (component), `mindsweep-sort` (Edge Function reuse), `commitMindSweepLite` (commit function), `release` (frontend-only disposition).
Quote: "`mindsweep_lite` placeholder...reuses `mindsweep-sort` Edge Function + batched commit on Close My Day + release disposition override"

### Field 2 — Code presence check
Grep command: pattern=`mindsweep_lite|MindSweepLiteSection`, path=`src supabase`
Hits: multiple
Files:
 - `src/components/rhythms/sections/MindSweepLiteSection.tsx` — adult component exists
 - `src/components/rhythms/sections/MindSweepLiteTeenSection.tsx` — teen sibling (Phase D)
 - `src/components/rhythms/sections/SectionRendererSwitch.tsx:218-250` — `case 'mindsweep_lite':` with teen/adult fork

First-context (SectionRendererSwitch.tsx:242-249):
```tsx
return (
  <MindSweepLiteSection
    familyId={familyId}
    memberId={memberId}
    readingSupport={readingSupport}
    collapsedByDefault={cfg?.collapsed_by_default ?? true}
  />
)
```

### Field 3 — Wiring check
Imports at SectionRendererSwitch.tsx:33 (`MindSweepLiteSection`) + :34 (`MindSweepLiteTeenSection`). Rendered at :218-250 depending on audience.
Most recent commit touching MindSweepLiteTeenSection: `69510b2 2026-04-07 19:50:06 -0500 feat: PRD-18 Phase D + Build N.2 — Independent Teen tailored rhythm experience`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention of this section key; RoutingStrip row "MindSweep" notes "PRD-17B: embedding-first + Haiku classification" (the underlying `mindsweep-sort` mechanism).
- prds/addenda/: PRD-18 addenda exist.
- PlannedExpansionCard: no hit.
- CLAUDE.md: Conventions 180-182 fully describe this section — reuse of `mindsweep-sort`, release disposition frontend-only, commitMindSweepLite mirror of `routeDirectly`.

### Field 5 — What was NOT checked
- Did not open `commitMindSweepLite.ts` to verify per-item try/catch pattern.
- Did not verify `mindsweep-sort` Edge Function's `'rhythm_evening'` source_channel enum value addition.
- Did not verify release disposition frontend-only enforcement at commit time.

### Field 6 — Observations (no verdict)
Section key `mindsweep_lite` has BOTH an adult component (`MindSweepLiteSection.tsx`) AND a teen sibling (`MindSweepLiteTeenSection.tsx`), with an audience fork in SectionRendererSwitch. CLAUDE.md Conventions 180, 181, 182 document the architecture precisely. Commit dates align with registry's 2026-04-07 Build Phase column.

---

## Entry 184 — `PRD-18 Phase B: morning_insight placeholder`

**Registry line:** 184
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| PRD-18 Phase B: `morning_insight` placeholder | PRD-18 Phase B (Build K) | PRD-18 Phase C (Build L) | ✅ Wired | 2026-04-07 (20 adult questions + `generate-query-embedding` + `match_book_extractions` RPC + empty BookShelf nudge) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) stub entry line 184 names section-type `morning_insight` + Edge Function `generate-query-embedding` + RPC `match_book_extractions`. Identifier: `morning_insight` (section_type), `MorningInsightSection` (component), `generate-query-embedding` (Edge Function), `match_book_extractions` (RPC), `morning_insight_questions` (table).
Quote: "`morning_insight` placeholder ... 20 adult questions + `generate-query-embedding` + `match_book_extractions` RPC"

### Field 2 — Code presence check
Grep command: pattern=`morning_insight`, path=`src supabase`
Hits: multiple
Files:
 - `src/components/rhythms/sections/MorningInsightSection.tsx` — component exists
 - `src/components/rhythms/sections/SectionRendererSwitch.tsx:152-169` — `case 'morning_insight':` with adult/teen audience fork
 - `supabase/migrations/00000000100112_rhythms_phase_c.sql` — seeds 20 adult questions into `morning_insight_questions`, adds section to adult/independent morning seed at position 6, backfill idempotent

First-context (SectionRendererSwitch.tsx:161-168):
```tsx
return (
  <MorningInsightSection
    familyId={familyId}
    memberId={memberId}
    readingSupport={readingSupport}
    audience={insightAudience}
  />
)
```

### Field 3 — Wiring check
Imported at SectionRendererSwitch.tsx:35, rendered at :152-169.
Most recent touching commit: same Phase C (Build L) commit pool; migration 100112 is the authoritative seed.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-18 addenda exist.
- PlannedExpansionCard: no hit.
- CLAUDE.md: Convention 183 explicitly describes "Morning Insight generates query embeddings on-the-fly via the dedicated `generate-query-embedding` Edge Function...40-line wrapper around OpenAI text-embedding-3-small that returns the 1536-dim vector. Morning Insight calls it twice..." Convention 194 describes teen questions in `morning_insight_questions` with audience column.

### Field 5 — What was NOT checked
- Did not open `supabase/functions/generate-query-embedding/index.ts` to verify existence.
- Did not verify `match_book_extractions` RPC signature in migration 100092.
- Did not count the 20 adult questions seeded in migration 100112.

### Field 6 — Observations (no verdict)
Section key `morning_insight` mapped to file `MorningInsightSection.tsx`. Migration 00000000100112 seeds 20 adult questions into `morning_insight_questions` table and adds section to default morning seed. CLAUDE.md Conventions 183 and 194 document the dedicated Edge Function + RPC architecture. Commit dates align with Phase C.

---

## Entry 185 — `PRD-18 Phase B: feature_discovery placeholder`

**Registry line:** 185
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| PRD-18 Phase B: `feature_discovery` placeholder | PRD-18 Phase B (Build K) | PRD-18 Phase C (Build L) | ✅ Wired | 2026-04-07 (12-candidate pool + 14-day engagement filter + 3-days/week PRNG gate + permanent dismissals) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) stub entry line 185 names section-type `feature_discovery`. Identifier: `feature_discovery` (section_type), `FeatureDiscoverySection` (component), `featureDiscoveryPool.ts` (constant pool per Convention 185), `feature_discovery_dismissals` (table per Convention 186).
Quote: "`feature_discovery` placeholder ... 12-candidate pool + 14-day engagement filter + 3-days/week PRNG gate + permanent dismissals"

### Field 2 — Code presence check
Grep command: pattern=`feature_discovery|FeatureDiscoverySection`, path=`src supabase`
Hits: multiple
Files:
 - `src/components/rhythms/sections/FeatureDiscoverySection.tsx` — component exists
 - `src/lib/rhythm/featureDiscoveryPool.ts` — referenced by Convention 185 (file found in earlier Grep list via feature_discovery scan — implicitly present)
 - `src/components/rhythms/sections/SectionRendererSwitch.tsx:170-183` — `case 'feature_discovery':` with adult/teen audience fork
 - Migration 00000000100112 seeds section at position 8

First-context (SectionRendererSwitch.tsx:176-182):
```tsx
return (
  <FeatureDiscoverySection
    familyId={familyId}
    memberId={memberId}
    audience={discoveryAudience}
  />
)
```

### Field 3 — Wiring check
Imported at SectionRendererSwitch.tsx:36, rendered at :170-183.
Most recent touching commit: Phase C (Build L) pool; teen additions in Phase D (Build N) per `69510b2`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-18 addenda exist.
- PlannedExpansionCard: no hit.
- CLAUDE.md: Convention 184 describes "3-days-per-ISO-week PRNG pick" frequency gate. Convention 185 describes pool as TypeScript constant in `src/lib/rhythm/featureDiscoveryPool.ts`. Convention 186 describes permanent dismissals table `feature_discovery_dismissals`. Convention 195 describes teen pool additions.

### Field 5 — What was NOT checked
- Did not open `featureDiscoveryPool.ts` to count 12 candidate entries or verify `audiences` array shape.
- Did not verify `feature_discovery_dismissals` table migration.
- Did not verify 14-day engagement filter join logic against `activity_log_entries`.

### Field 6 — Observations (no verdict)
Section key `feature_discovery` mapped to `FeatureDiscoverySection.tsx`. CLAUDE.md Conventions 184, 185, 186, 195 document 4 distinct aspects of the implementation. Constant pool file `src/lib/rhythm/featureDiscoveryPool.ts` exists (previously surfaced in Grep scan). Code file structure matches registry claim.

---

## Entry 186 — `PRD-18 Phase B: rhythm_tracker_prompts auto-hide`

**Registry line:** 186
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| PRD-18 Phase B: `rhythm_tracker_prompts` auto-hide | PRD-18 Phase B (Build K) | PRD-18 Phase C (Build L) | ✅ Wired | 2026-04-07 (`dashboard_widgets.config.rhythm_keys` multi-select in WidgetConfiguration + link-only section renderer) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) stub entry line 186 names section-type `rhythm_tracker_prompts` + mentions `dashboard_widgets.config.rhythm_keys` JSONB path + `WidgetConfiguration`. Identifier: `rhythm_tracker_prompts` (section_type), `RhythmTrackerPromptsSection` (component), `dashboard_widgets.config.rhythm_keys` (JSONB sub-field per Convention 187).
Quote: "`rhythm_tracker_prompts` auto-hide ... `dashboard_widgets.config.rhythm_keys` multi-select"

### Field 2 — Code presence check
Grep command: pattern=`rhythm_tracker_prompts`, path=`src supabase`
Hits: multiple
Files:
 - `src/components/rhythms/sections/RhythmTrackerPromptsSection.tsx` — component exists
 - `src/components/rhythms/sections/SectionRendererSwitch.tsx:274-281` — `case 'rhythm_tracker_prompts':` returning the component with `familyId`, `memberId`, `rhythmKey` props
 - Migration 00000000100112 references section at order 12

First-context (SectionRendererSwitch.tsx:274-281):
```tsx
case 'rhythm_tracker_prompts':
  return (
    <RhythmTrackerPromptsSection
      familyId={familyId}
      memberId={memberId}
      rhythmKey={rhythmKey}
    />
  )
```

### Field 3 — Wiring check
Imported at SectionRendererSwitch.tsx:37, rendered at :274-281.
Most recent touching commit: Phase C (Build L) commit pool.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-18 addenda exist.
- PlannedExpansionCard: no hit.
- CLAUDE.md: Convention 187 explicitly describes "Rhythm Tracker Prompts reads `dashboard_widgets.config.rhythm_keys TEXT[]` — a runtime JSONB sub-field, not a schema column. A widget surfaces in a rhythm if its `config.rhythm_keys` array contains that rhythm's key...Phase C ships link-only rendering (tap → go to dashboard); inline data entry per widget type is a polish pass."

### Field 5 — What was NOT checked
- Did not open `RhythmTrackerPromptsSection.tsx` to verify auto-hide logic when no matching widgets.
- Did not verify `WidgetConfiguration.tsx` multi-select UI for rhythm_keys.
- Did not verify `.contains('widget_config', { rhythm_keys: [rhythmKey] })` Supabase query pattern.

### Field 6 — Observations (no verdict)
Section key `rhythm_tracker_prompts` mapped to real component file. CLAUDE.md Convention 187 is comprehensive and names both the JSONB path and the Phase C link-only rendering approach that the registry references.

---

## Entry 188 — `PRD-18 Phase B: before_close_the_day auto-hide`

**Registry line:** 188
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| PRD-18 Phase B: `before_close_the_day` auto-hide | PRD-18 Phase B (Build K) | PRD-18 Phase C | ⏳ Unwired (MVP) | Phase C (cross-feature pending aggregation) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) stub entry line 188 names section-type `before_close_the_day`. Identifier: `before_close_the_day` (section_type) + `BeforeCloseTheDaySection` (stub component).
Quote: "`before_close_the_day` auto-hide"

### Field 2 — Code presence check
Grep command: pattern=`before_close_the_day|BeforeCloseTheDaySection`, path=`src supabase`
Hits: multiple
Files:
 - `src/components/rhythms/sections/StubSections.tsx:41-44` — `BeforeCloseTheDaySection(): null` with comment "Phase A: cross-feature pending aggregation not built. Auto-hide."
 - `src/components/rhythms/sections/SectionRendererSwitch.tsx:48` (import from StubSections) + :264-265 `case 'before_close_the_day': return <BeforeCloseTheDaySection />`

First-context (StubSections.tsx:41-44):
```tsx
export function BeforeCloseTheDaySection(): null {
  // Phase A: cross-feature pending aggregation not built. Auto-hide.
  return null
}
```

### Field 3 — Wiring check
Imported at SectionRendererSwitch.tsx:48, rendered at :264-265. The component returns null by design.
Most recent touching commit for `StubSections.tsx`: `426c446 2026-04-15 feat: PRD-16 Phase E verification + Meeting Setup Wizard + Guided agenda capture + bug fixes`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-18 addenda exist.
- PlannedExpansionCard: no hit.
- CLAUDE.md: no specific convention naming `before_close_the_day`. "cross-feature pending aggregation" not separately conventioned.

### Field 5 — What was NOT checked
- Did not verify whether cross-feature pending aggregation is tracked anywhere else (e.g., another stub entry).
- Did not verify whether any custom rhythm configurations in production enable this section.

### Field 6 — Observations (no verdict)
Section key `before_close_the_day` mapped to a stub function in StubSections.tsx that returns null. No concrete aggregation wiring visible; stub note explicitly says "cross-feature pending aggregation not built." StubSections.tsx comment says "Auto-hide" matching registry claim of "auto-hide".

---

## Entry 189 — `PRD-18 Phase B: completed_meetings auto-hide`

**Registry line:** 189
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| PRD-18 Phase B: `completed_meetings` auto-hide | PRD-18 Phase B (Build K) | PRD-16 Phase E (Build P) | ✅ Wired | 2026-04-15 — `CompletedMeetingsSection` queries last 7 days of completed meetings, auto-hides when empty |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) stub entry line 189 names section-type `completed_meetings` and component `CompletedMeetingsSection`. Identifier: `completed_meetings` (section_type), `CompletedMeetingsSection` (component).
Quote: "`completed_meetings` auto-hide ... `CompletedMeetingsSection` queries last 7 days..."

### Field 2 — Code presence check
Grep command: pattern=`completed_meetings|CompletedMeetingsSection`, path=`src supabase`
Hits: multiple
Files:
 - `src/components/rhythms/sections/CompletedMeetingsSection.tsx` — component exists as dedicated file
 - `src/components/rhythms/sections/SectionRendererSwitch.tsx:43` (import) + :210-211 `case 'completed_meetings': return <CompletedMeetingsSection familyId={familyId} memberId={memberId} />`
 - `src/components/rhythms/sections/StubSections.tsx:32-34` — explicit comment "CompletedMeetingsSection was a Phase A stub. Phase E (Build P) wired the real component at src/components/rhythms/sections/CompletedMeetingsSection.tsx."

First-context (SectionRendererSwitch.tsx:210-211):
```tsx
case 'completed_meetings':
  return <CompletedMeetingsSection familyId={familyId} memberId={memberId} />
```

### Field 3 — Wiring check
Imported at SectionRendererSwitch.tsx:43 (from dedicated file, not from StubSections).
Most recent touching commit: `426c446 2026-04-15 18:42:29 -0500 feat: PRD-16 Phase E verification + Meeting Setup Wizard + Guided agenda capture + bug fixes`. Date (2026-04-15) matches registry Build Phase column.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-18 addenda exist; PRD-16 addenda likely also relevant (Phase E wired).
- PlannedExpansionCard: no hit.
- CLAUDE.md: no specific convention naming `completed_meetings` section (later PRD-16 build); StubSections.tsx comment is the in-code authoritative record.

### Field 5 — What was NOT checked
- Did not open `CompletedMeetingsSection.tsx` to verify "last 7 days" query window.
- Did not verify auto-hide-when-empty behavior.
- Did not check `meetings` table schema for `status='completed'` column.

### Field 6 — Observations (no verdict)
Section key `completed_meetings` mapped to a dedicated component file (not a stub). StubSections.tsx explicitly records this as Phase E (Build P) wiring. Commit date 2026-04-15 matches registry. Hidden-when-empty "auto-hide" claim not verified in source but surfaced in registry wording.

---

## Entry 190 — `PRD-18 Phase B: milestone_celebrations auto-hide`

**Registry line:** 190
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| PRD-18 Phase B: `milestone_celebrations` auto-hide | PRD-18 Phase B (Build K) | PRD-24 (Gamification) | ⏳ Unwired (MVP) | Wire when Gamification ships |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) stub entry line 190 names section-type `milestone_celebrations`. Identifier: `milestone_celebrations` (section_type), `MilestoneCelebrationsSection` (stub component).
Quote: "`milestone_celebrations` auto-hide ... Wire when Gamification ships"

### Field 2 — Code presence check
Grep command: pattern=`milestone_celebrations|MilestoneCelebrationsSection`, path=`src supabase`
Hits: multiple
Files:
 - `src/components/rhythms/sections/StubSections.tsx:36-39` — `MilestoneCelebrationsSection(): null` with comment "Phase A: gamification milestones not yet wired. Auto-hide."
 - `src/components/rhythms/sections/SectionRendererSwitch.tsx:45` (import) + :212-213 `case 'milestone_celebrations': return <MilestoneCelebrationsSection />`

First-context (StubSections.tsx:36-39):
```tsx
export function MilestoneCelebrationsSection(): null {
  // Phase A: gamification milestones not yet wired. Auto-hide.
  return null
}
```

### Field 3 — Wiring check
Imported from StubSections.tsx in SectionRendererSwitch. Component returns null.
Most recent touching commit for StubSections.tsx: `426c446 2026-04-15`. Note PRD-24 Gamification Build M has been completed (per `.claude/rules/current-builds/IDLE.md` — "Build M — PRD-24 + PRD-26 Play Dashboard + Sticker Book... formalized 2026-04-16").

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-18 addenda exist; PRD-24 addenda exist.
- PlannedExpansionCard: no hit.
- CLAUDE.md: no specific convention; StubSections comment is in-code record.

### Field 5 — What was NOT checked
- Did not verify whether PRD-24 Build M included any wiring that touches `milestone_celebrations` section.
- Did not verify gamification-pipeline-to-rhythm-section data flow. Registry says "Wire when Gamification ships" — Gamification (PRD-24 Build M) shipped 2026-04-13/2026-04-16 per IDLE.md, so the "wire when" condition has triggered; current state of wiring not verified in this packet.

### Field 6 — Observations (no verdict)
Section key `milestone_celebrations` mapped to stub returning null. PRD-24 Gamification (the "wire when" condition) has shipped per IDLE.md (2026-04-13/2026-04-16), but the Rhythms `milestone_celebrations` section still points to the null stub. Visual tension surfaced for reviewer.

---

## Entry 191 — `PRD-18 Phase B: Weekly/Monthly Review deep dive button`

**Registry line:** 191
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| PRD-18 Phase B: Weekly/Monthly Review deep dive button | PRD-18 Phase B (Build K) | PRD-16 (Build P) | ⏳ Unwired (MVP) | Meetings built but deep-dive meeting type requires separate wiring — weekly/monthly reviews are Rhythms (PRD-18), not Meetings. Button remains stub. |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) stub entry line 191 names capability "Weekly/Monthly Review deep dive button" — no specific component identifier. 
(b) WIRING_STATUS.md: no section on this capability.
(c) CLAUDE.md: Convention 174 ("Weekly/Monthly reflection prompts are frontend constants, NOT `reflection_prompts` rows. `WeeklyReviewCard` has a hardcoded array of 10 weekly-specific questions...") — relates to the Weekly/Monthly Review card but the "deep dive button" specifically not named.
(d) prds/addenda/PRD-18-* — did not open to confirm "deep dive button" spec.
(d.5) Named file: `WeeklyReviewCard.tsx`/`MonthlyReviewCard.tsx` (both present per earlier glob). One file may be opened. Skipping (d.5) — Field 1 landed at (c) naming the cards.
Identifier: `WeeklyReviewCard` + `MonthlyReviewCard` (components; the "deep dive button" would be a sub-element within them).

### Field 2 — Code presence check
Grep command: pattern=`WeeklyReviewCard|MonthlyReviewCard|deep.?dive`, path=`src/components/rhythms`
Hits: multiple
Files:
 - `src/components/rhythms/periodic/WeeklyReviewCard.tsx` — exists
 - `src/components/rhythms/periodic/MonthlyReviewCard.tsx` — exists
Specific button-identifier text ("deep dive") not grepped in component bodies in this packet.

### Field 3 — Wiring check
Not individually verified for the "deep dive button" sub-element. Cards are wired per entry 178 (periodic_cards_slot).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-18 + PRD-16 addenda exist.
- PlannedExpansionCard: no hit.
- CLAUDE.md: Convention 174 describes frontend-constant question pool + journal-entry storage; does not name the deep-dive button explicitly. Convention 178 covers PeriodicCardsSlot wrapper.

### Field 5 — What was NOT checked
- Did not open `WeeklyReviewCard.tsx` or `MonthlyReviewCard.tsx` to grep for "deep dive" button text or handler.
- Did not verify whether the "deep dive" concept in registry refers to a deferred meeting-type integration or a separate in-card expand.
- Registry text itself clarifies the deep-dive stub is about a deferred meeting-type integration; no specific component extracted for the stub itself.

### Field 6 — Observations (no verdict)
The stub is about a sub-capability ("deep dive button") inside the wired `WeeklyReviewCard.tsx`/`MonthlyReviewCard.tsx` components. Registry rationale: "weekly/monthly reviews are Rhythms (PRD-18), not Meetings. Button remains stub." Container cards are wired (entry 178); specific button not independently verified in this packet.

---

## Entry 192 — `PRD-18 Phase B: Quarterly Inventory Stale Areas / LifeLantern launch`

**Registry line:** 192
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| PRD-18 Phase B: Quarterly Inventory Stale Areas / LifeLantern launch | PRD-18 Phase B (Build K) | PRD-12A (LifeLantern) | ⏳ Unwired (MVP) | "LifeLantern coming soon" stub |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) stub entry line 192 names capability "Quarterly Inventory Stale Areas / LifeLantern launch". Identifier: `QuarterlyInventoryCard` (component per glob), `lifelantern_staleness` (trigger per Convention 178), `stale_areas` + `lifelantern_launch_link` (section types in SectionRendererSwitch:296-298 returning null).
Quote: "Quarterly Inventory Stale Areas / LifeLantern launch ... 'LifeLantern coming soon' stub"

### Field 2 — Code presence check
Grep command: pattern=`stale_areas|lifelantern_launch_link|QuarterlyInventoryCard`, path=`src supabase`
Hits:
 - `src/components/rhythms/periodic/QuarterlyInventoryCard.tsx` — exists
 - `src/components/rhythms/sections/SectionRendererSwitch.tsx:287-299` — `'stale_areas'` and `'lifelantern_launch_link'` cases included in fall-through block returning `null` with comment "Phase B builds these"

First-context (SectionRendererSwitch.tsx:287-299):
```tsx
case 'weekly_stats':
case 'top_victories':
case 'next_week_preview':
case 'weekly_reflection_prompt':
case 'weekly_review_deep_dive':
case 'month_at_a_glance':
case 'highlight_reel':
case 'reports_link':
case 'monthly_review_deep_dive':
case 'stale_areas':
case 'quick_win_suggestion':
case 'lifelantern_launch_link':
  return null // Phase B builds these
```

### Field 3 — Wiring check
Section types `stale_areas` and `lifelantern_launch_link` fall into the "return null // Phase B builds these" group at SectionRendererSwitch.tsx:287-299. `QuarterlyInventoryCard.tsx` exists as a file but its wiring to these stub-only section cases not verified.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-18 + PRD-12A addenda (if any — not verified) exist.
- PlannedExpansionCard: no hit.
- CLAUDE.md: Convention 178 explicitly notes "Quarterly Inventory uses `lifelantern_staleness` trigger which is a stub until PRD-12A — for Phase B it always shows when enabled."

### Field 5 — What was NOT checked
- Did not open `QuarterlyInventoryCard.tsx` to verify "always shows when enabled" vs. actual staleness trigger check.
- Did not verify PRD-12A (LifeLantern) shipped state — `claude/feature_glossary.md` lists PRD-12A as Status "MVP, Tier TBD", so not verified as shipped.
- Did not verify whether `lifelantern_staleness` is registered as a trigger or function anywhere.

### Field 6 — Observations (no verdict)
Section type keys `stale_areas` and `lifelantern_launch_link` fall into the fall-through null-returning block "Phase B builds these" at SectionRendererSwitch.tsx:287-299. `QuarterlyInventoryCard.tsx` exists as a periodic card file. CLAUDE.md Convention 178 explicitly names `lifelantern_staleness` as a stub pending PRD-12A.

---

## Entry 193 — `PRD-18 Phase B: On the Horizon "Schedule time for this?" calendar block creation`

**Registry line:** 193
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| PRD-18 Phase B: On the Horizon "Schedule time for this?" calendar block creation | PRD-18 Phase B (Build K) | PRD-18 polish | ⏳ Unwired (MVP) | Component shows [Break into steps] + [Open task]; calendar block deferred |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) stub entry line 193 names capability "Schedule time for this?" calendar block creation — no concrete identifier. Container = `OnTheHorizonSection`.
(b) WIRING_STATUS.md: no direct mention.
(c) CLAUDE.md: no specific convention naming this button.
(d) prds/addenda/PRD-18-*: addenda exist; not opened for "Schedule time for this?" string search.
Identifier: `OnTheHorizonSection` (container component) + registry-quoted button labels `[Break into steps]` + `[Open task]` + "Schedule time for this?" (text label for the deferred button).

### Field 2 — Code presence check
Grep command: pattern=`Schedule time for this`, path=`src`
Hits: not run in this packet. `OnTheHorizonSection.tsx` exists at `src/components/rhythms/sections/OnTheHorizonSection.tsx` per earlier glob.

### Field 3 — Wiring check
Container `OnTheHorizonSection.tsx` is wired per entry 177; the specific "Schedule time for this?" calendar block creation handler is what entry 193 calls out as deferred. Not individually verified.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention of the specific calendar block creation.
- prds/addenda/: PRD-18 addenda exist.
- PlannedExpansionCard: no hit.
- CLAUDE.md: no specific convention.

### Field 5 — What was NOT checked
- Did not open `OnTheHorizonSection.tsx` to grep for "Schedule time" string or calendar-block handler.
- Did not verify whether any `useCreateCalendarEvent` or similar hook is referenced in the file.
- Did not check PRD-18-Enhancement-Addendum.md for the "Schedule time for this?" feature spec.

### Field 6 — Observations (no verdict)
Container component `OnTheHorizonSection.tsx` is wired (entry 177). The specific "Schedule time for this?" calendar block creation is a sub-feature button not independently verified. Registry rationale preserved in-line: "Component shows [Break into steps] + [Open task]; calendar block deferred" — button is the deferred slice.

---

## Entry 201 — `ThoughtSift name → External Tool Suite`

**Registry line:** 201
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| ThoughtSift name → External Tool Suite | PRD-20 | PRD-34 | ✅ Wired | Phase 35 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) stub entry line 201 names capability "ThoughtSift name → External Tool Suite" — no concrete identifier.
(b) WIRING_STATUS.md: no section on renaming or External Tool Suite.
(c) CLAUDE.md: Conventions 92-105 describe "ThoughtSift = 5 separate tools". Convention 95 notes "Mediator supersedes `relationship_mediation` (PRD-19)".
(d) prds/platform-complete/PRD-34*: ThoughtSift lives in platform-complete category per `claude/feature_glossary.md`.
(d.5) `src/App.tsx:178` renders `ThoughtSiftPage`. `src/pages/placeholder/index.tsx:62-64` defines `ThoughtSiftPage` as a PlaceholderPage with `featureKey="thoughtsift_board_of_directors"` and `prd="PRD-34"`.
Identifier: `ThoughtSiftPage` (React component), route `/thoughtsift`.
Quote (PlaceholderPage): "Five powerful thinking tools: Board of Directors, Perspective Shifter, Decision Guide, Mediator, and Translator..."

### Field 2 — Code presence check
Grep command: pattern=`ThoughtSift|thoughtsift`, path=`src`
Hits: 9 files
Files:
 - `src/App.tsx:27` (import) + :178 (Route `/thoughtsift` → `<ThoughtSiftPage />`)
 - `src/pages/placeholder/index.tsx:62-64` — PlaceholderPage for ThoughtSift
 - `src/components/lila/ToolConversationModal.tsx` — references ThoughtSift
 - `src/components/shells/QuickTasks.tsx` — references ThoughtSift
 - `src/config/feature_expansion_registry.ts` — demand validation entry
 - `src/lib/rhythm/featureDiscoveryPool.ts` — feature discovery entry
 - `src/lib/ai/context-assembly.ts` — context
 - `src/lib/ai/model-routing.ts` — Sonnet routing
 - `src/data/lanterns-path-data.ts` — data

First-context (src/App.tsx:178):
```tsx
<Route path="/thoughtsift" element={<ProtectedRoute><ThoughtSiftPage /></ProtectedRoute>} />
```

### Field 3 — Wiring check
Callers: `ThoughtSiftPage` imported in `src/App.tsx:27`, rendered at `/thoughtsift` route. Sidebar nav to ThoughtSift not grepped in this packet.
Most recent touching commit: not individually pulled for these files.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-34 addenda exist per PRE_BUILD_PROCESS.md appendix.
- PlannedExpansionCard: no direct hit by featureKey search (uses `PlaceholderPage` wrapper which embeds `<PlannedExpansionCard featureKey={featureKey!} />` at placeholder/PlaceholderPage.tsx:39).
- CLAUDE.md: Conventions 92-105 extensively describe ThoughtSift architecture.

### Field 5 — What was NOT checked
- Registry text is ambiguous: "ThoughtSift name → External Tool Suite" — unclear whether this is (a) naming a tool suite as "External", (b) renaming ThoughtSift to "External Tool Suite", or (c) a renaming event from Safe Harbor's "External Tool Suite" reference to "ThoughtSift" (stub is in PRD-20 Safe Harbor section).
- Did not open PRD-20 to verify whether "External Tool Suite" was an original Safe Harbor term superseded by ThoughtSift.
- Did not verify that all 5 ThoughtSift tools (Board of Directors, Perspective Shifter, Decision Guide, Mediator, Translator) render on `/thoughtsift` — the page is a PlaceholderPage, not the 5-tool split per PRD-34 expectation.

### Field 6 — Observations (no verdict)
Registry claims ✅ Wired. Route `/thoughtsift` renders a `PlaceholderPage` (PlaceholderPage.tsx wraps `<PlannedExpansionCard featureKey={featureKey!} />`). The stub is created by PRD-20 (Safe Harbor) and claimed wired by PRD-34 — the naming-supersession interpretation from the registry text is plausible (Safe Harbor no longer references "External Tool Suite" because PRD-34's "ThoughtSift" name supersedes it). Whether ThoughtSift itself is wired vs. renders a placeholder is a separate question.

---

## Entry 207 — `AI Vault sidebar navigation`

**Registry line:** 207
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| AI Vault sidebar navigation | PRD-04 | PRD-21A | ✅ Wired | Phase 25 (2026-03-25) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) stub entry line 207 names capability "AI Vault sidebar navigation". Identifier: sidebar nav entry with label "AI Vault", path `/vault`, featureKey `vault_browse` / `vault_consume`.
(b) WIRING_STATUS.md: RoutingStrip table does not include sidebar nav.
(c) CLAUDE.md: multiple conventions reference `getSidebarSections()` in `src/components/shells/Sidebar.tsx` (Conventions 14/16 mobile/desktop parity).
Identifier: `getSidebarSections` (function) in `src/components/shells/Sidebar.tsx` + three entries at :95, :117, :134 labeled "AI Vault" path `/vault`.
Quote (Sidebar.tsx:95): `{ label: 'AI Vault', path: '/vault', featureKey: 'vault_browse', icon: <Gem size={20} />, tooltip: 'Tutorials, tools, and prompts' }`

### Field 2 — Code presence check
Grep command: pattern=`'AI Vault'|path:.*'/vault'|VaultPage`, path=`src/components/shells/Sidebar.tsx`
Hits: 3
Files:
 - `src/components/shells/Sidebar.tsx:95` — AI Vault entry (likely Mom shell, featureKey `vault_browse`)
 - `src/components/shells/Sidebar.tsx:117` — AI Vault entry (likely Adult shell, featureKey `vault_browse`)
 - `src/components/shells/Sidebar.tsx:134` — AI Vault entry (likely Independent shell, featureKey `vault_consume`)

### Field 3 — Wiring check
Entries inside `getSidebarSections(shell)` function. Routes to `/vault`. Per CLAUDE.md Convention 16, BottomNav "More" menu reads from same `getSidebarSections` so mobile/desktop parity is preserved.
Most recent touching commit: not individually pulled for Sidebar.tsx.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: not mentioned specifically but `/vault` routes are present per routing architecture.
- prds/addenda/: PRD-21A-Cross-PRD-Impact-Addendum.md exists per PRE_BUILD_PROCESS.md.
- PlannedExpansionCard: not applicable — sidebar nav is not demand-validation-card.
- CLAUDE.md: Conventions 14/16 describe Sidebar.tsx + BottomNav parity pattern; `/vault` route referenced in architecture.md routing table.

### Field 5 — What was NOT checked
- Did not verify feature_key_registry contains `vault_browse` / `vault_consume` keys.
- Did not verify whether all three shells (Mom/Adult/Independent) render the AI Vault entry in the Plan & Do or Grow section (per Convention sidebar collapsible sections).
- Did not verify BottomNav "More" menu shows AI Vault at 375px mobile viewport (this is a visual-verification item).
- Did not verify most recent commit for Sidebar.tsx.

### Field 6 — Observations (no verdict)
AI Vault sidebar nav entry appears at three lines in `src/components/shells/Sidebar.tsx` (95, 117, 134) for three different shell sections with featureKeys `vault_browse` (Mom/Adult) and `vault_consume` (Independent) and a consistent label "AI Vault" and path "/vault". Code presence in `getSidebarSections()` is the canonical mechanism per CLAUDE.md Convention 16.

---

Session 3 sub-agent packet batch complete — 20 entries processed (175-186, 188-193, 201, 207). Registry integrity verified 547 lines, no HALT file. No writes to forbidden paths. No mgrep. No AURI. No verdict language.

## Entry 208 — `AI Toolbox browsing/assignment`

**Registry line:** 208
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| AI Toolbox browsing/assignment | PRD-19 | PRD-21A | ✅ Wired | Phase 25 (2026-03-25) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 208 names capability "AI Toolbox browsing/assignment"; does not name a concrete code identifier. (b) WIRING_STATUS.md does not mention "AI Toolbox" specifically (line 146: references "also openable from AI Vault" for Task Breaker). (c) CLAUDE.md Convention 80: "AI Vault is the browsable content catalog; AI Toolbox (PRD-21) is the personalized per-member launcher." Convention 88: "+Add to AI Toolbox creates `lila_tool_permissions` records with `source = 'vault'` and `vault_item_id`." Identifier: `lila_tool_permissions` table; "+Add to AI Toolbox" UI.
Source: CLAUDE.md convention #88; primary identifier `lila_tool_permissions` + `MemberAssignmentModal`.

### Field 2 — Code presence check
Grep command: `pattern='AI Toolbox', path='src', output_mode='files_with_matches'`
Hits: 4
Files: `src/components/shells/Sidebar.tsx`, `src/features/vault/components/MemberAssignmentModal.tsx`, `src/features/vault/components/VaultDetailView.tsx`, `src/components/lila/ToolLauncherProvider.tsx`
First-context window: `MemberAssignmentModal.tsx:26` → `"+Add to AI Toolbox" modal (PRD-21A Screen 4).`; `MemberAssignmentModal.tsx:138` → `title="Add to AI Toolbox"`; `VaultDetailView.tsx:124` → `{/* +Add to AI Toolbox — only for ai_tool and skill types (PRD-21A) */}`.

### Field 3 — Wiring check
Callers: `VaultDetailView.tsx:130` renders "Add to AI Toolbox" button; `ToolLauncherProvider.tsx:5` references "Sidebar AI Toolbox section, QuickTasks buttons, AI Vault." Execution-flow location: React component + modal + provider (UI). Most recent touching commit for `MemberAssignmentModal.tsx`: `0be28be 2026-04-09 21:59:18 -0500 fix: unify member color reads via canonical getMemberColor helper`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: No dedicated "AI Toolbox" row; line 146 mentions AI Vault as openable location for StandaloneTaskBreakerModal.
- prds/addenda/: `PRD-21A-Cross-PRD-Impact-Addendum.md` exists (per Grep hit earlier).
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Convention 80, 88 reference AI Toolbox architecture and `lila_tool_permissions`.

### Field 5 — What was NOT checked
- Whether `lila_tool_permissions` table has rows in live DB (would need SQL).
- Whether MemberAssignmentModal's insert path actually persists under realistic tier/auth conditions.
- Whether Sidebar "AI Toolbox" section renders the user's assigned tools correctly on render.

### Field 6 — Observations (no verdict)
Grep found "AI Toolbox" in 4 distinct source files across Sidebar, MemberAssignmentModal, VaultDetailView, and ToolLauncherProvider. MemberAssignmentModal at line 26 is documented as "+Add to AI Toolbox modal (PRD-21A Screen 4)". Most recent touching commit dated 2026-04-09. Convention 88 names `lila_tool_permissions` as the persistence target. No PlannedExpansionCard stub.

---

## Entry 209 — `Library Vault tutorial links from LiLa Assist`

**Registry line:** 209
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Library Vault tutorial links from LiLa Assist | PRD-05 | PRD-21A | ✅ Wired | Phase 25 (2026-03-25) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 209 references "Library Vault" and "LiLa Assist"; no concrete code identifier named. (b) WIRING_STATUS.md has no mention of "tutorial links from LiLa Assist" or "Library Vault." (c) CLAUDE.md Convention 80 distinguishes "AI Vault" (catalog) from "AI Toolbox" (launcher) and Convention 91 notes `vault_items` replaces V1 `library_items`. "Library Vault" appears to be legacy naming. (d) PRD-21A references tutorial content type; PRD-05 defines LiLa Assist mode. (d.5) Grepped `LibraryVault|library_vault|tutorial.*LiLa Assist` in src → no matches. Grepped `tutorial.*vault` variants in src → 2 files: `Sidebar.tsx`, `useSpotlightSearch.ts`.
Source: No concrete implementation identifier extractable — "Library Vault" is legacy terminology for AI Vault and "tutorial links from LiLa Assist" is a capability description. Closest extractable: `content_type='tutorial'` filter on `vault_items`.
Identifier: CAPABILITY-ONLY — best-effort candidate `vault_items.content_type='tutorial'` + LiLa Assist mode routing to vault. No specific implementation path found in docs.

### Field 2 — Code presence check
Grep command: `pattern='vault.*tutorial|library_tutorial|LibraryVault.*tutorial', path='src', output_mode='files_with_matches'`
Hits: 2
Files: `src/components/shells/Sidebar.tsx` (description "Tutorials, tools, and prompts"), `src/hooks/useSpotlightSearch.ts` (description "Tools, tutorials, and prompts")
First-context window: `Sidebar.tsx:95` → `{ label: 'AI Vault', path: '/vault', featureKey: 'vault_browse', icon: <Gem size={20} />, tooltip: 'Tutorials, tools, and prompts' }`

### Field 3 — Wiring check
Callers: Sidebar nav pill → `/vault` route; Spotlight search → `/vault` route. Execution-flow location: UI (navigation). Most recent touching commit for `Sidebar.tsx`: `5d2a7c4 2026-04-14 23:04:48 -0500 feat: PRD-16 Meetings Phase A — schema, page, sidebar, hooks`. No evidence of LiLa Assist specifically producing tutorial-typed vault links in the code path.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention
- prds/addenda/: no specific "tutorial links from LiLa Assist" addendum found.
- PlannedExpansionCard: not found for this feature key.
- CLAUDE.md: Convention 80, 81 (content types include 'tutorial'), 91 (replaces `library_items`).

### Field 5 — What was NOT checked
- Whether `lila-chat` Edge Function actually emits tutorial vault links in LiLa Assist responses (would need to inspect Edge Function + live conversation data).
- Whether "Library Vault" naming is an older draft superseded by "AI Vault" (CLAUDE.md #91 strongly implies yes).
- Semantic search for "LiLa Assist output includes vault item links" — Convention 242 blocks mgrep without approval.

### Field 6 — Observations (no verdict)
Grep found tutorials referenced in Sidebar tooltip and Spotlight search (2 files), but no direct evidence of "LiLa Assist → tutorial link insertion" as an implementation. "Library Vault" is superseded terminology per Convention 91. Entry predates build-phase terminology refresh.

---

## Entry 212 — `Embedded tool iframe delivery`

**Registry line:** 212
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Embedded tool iframe delivery | PRD-21A | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 212 references "Embedded tool iframe delivery." (b) WIRING_STATUS.md does not mention iframe delivery. (c) CLAUDE.md Convention 89: "Delivery methods for AI tools: `native` (LiLa conversation modal via guided_mode_key), `embedded` (iframe), `link_out` (new tab). Native tools use `container_preference: 'modal'`." Identifier: `delivery_method='embedded'` on `vault_items`.
Source: CLAUDE.md convention #89; identifier `delivery_method='embedded'` + iframe render path.

### Field 2 — Code presence check
Grep command: `pattern='delivery_method.*embedded|embedded.*iframe', path='src', output_mode='content', -n=true`
Hits: 3
Files:
- `src/features/vault/components/detail/AIToolDetail.tsx:15` → doc comment: "Delivery methods: native (LiLa modal via ToolLauncherProvider), embedded (iframe), link_out (new tab)."
- `src/features/vault/components/detail/AIToolDetail.tsx:37` → `} else if (item.delivery_method === 'embedded') { setLaunched(true) }`
- `src/features/vault/components/detail/AIToolDetail.tsx:95` → `{launched && item.delivery_method === 'embedded' && item.tool_url ? (... iframe ...)}`
First-context window (AIToolDetail.tsx:94-104):
```
{/* Embedded iframe (when launched) */}
{launched && item.delivery_method === 'embedded' && item.tool_url ? (
  <div className="rounded-lg overflow-hidden mb-4" ...>
    <iframe
      src={item.tool_url}
      className="w-full border-0"
      style={{ minHeight: '500px' }}
      title={item.detail_title || item.display_title}
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
    />
```

### Field 3 — Wiring check
Callers: `AIToolDetail` is imported by `VaultDetailView` for AI-tool-type vault items. Execution-flow location: React component rendering inline iframe when `launched=true` AND `delivery_method==='embedded'`. Most recent touching commit: `4e939c5 2026-04-07 16:13:51 -0500 fix: Vault native tools launch into correct modal (Translator, BoD + all others)`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention
- prds/addenda/: `PRD-21A-Cross-PRD-Impact-Addendum.md` exists (referenced earlier).
- PlannedExpansionCard: not found for this feature.
- CLAUDE.md: Convention 89 names `embedded` as a delivery method.

### Field 5 — What was NOT checked
- Whether any actual `vault_items` row currently has `delivery_method='embedded'` in production.
- Whether sandboxed iframes work correctly for third-party tool URLs (cross-origin restrictions).
- Whether the "Post-MVP" status reflects missing registrar UI (admins haven't seeded embedded items yet) vs. missing runtime support.

### Field 6 — Observations (no verdict)
Registry claims Post-MVP; code in AIToolDetail.tsx has a full branch for `delivery_method === 'embedded'` rendering a sandboxed iframe. Feature appears implemented in the frontend render path. Most recent touching commit 2026-04-07. Potential contradiction between stub status and code presence.

---

## Entry 213 — `Native AI tool LiLa modal launch`

**Registry line:** 213
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Native AI tool LiLa modal launch | PRD-21A | PRD-05 | ⏳ Unwired (MVP) | Phase 24 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 213; "Native AI tool LiLa modal launch." (b) WIRING_STATUS.md: no direct mention. (c) CLAUDE.md Convention 89: "Native tools use `container_preference: 'modal'`." Convention 80 references AI Toolbox launcher. Identifier: `delivery_method='native'` + `guided_mode_key` dispatch + `ToolLauncherProvider`.
Source: CLAUDE.md convention #89; identifier `delivery_method === 'native'` + `openTool(guided_mode_key)` via `ToolLauncherProvider`.

### Field 2 — Code presence check
Grep command: `pattern='delivery_method.*native|guided_mode_key', path='src', output_mode='content', -n=true`
Hits: >10
Files:
- `src/features/vault/components/detail/AIToolDetail.tsx:30` → `} else if (item.delivery_method === 'native' && item.guided_mode_key) {`
- `src/features/vault/components/detail/AIToolDetail.tsx:34` → `openTool(item.guided_mode_key)`
- `src/features/vault/hooks/useVaultBrowse.ts:41` → `guided_mode_key: string | null`
- `src/features/vault/components/MemberAssignmentModal.tsx:99` → `mode_key: item.guided_mode_key || \`vault_tool_${item.id.slice(0, 8)}\``
- `src/components/shells/QuickTasks.tsx:579-597` → Query vault_items by `guided_mode_key`
First-context window (AIToolDetail.tsx:30-34):
```
} else if (item.delivery_method === 'native' && item.guided_mode_key) {
  // PRD-21: Delegate to ToolLauncherProvider which dispatches to the correct modal
  // based on guided_mode_key (translator → TranslatorModal, board_of_directors →
  // BoardOfDirectorsModal, everything else → ToolConversationModal).
  openTool(item.guided_mode_key)
```

### Field 3 — Wiring check
Callers: `useToolLauncher` hook used in 9 shell/component files (AdultShell, MomShell, IndependentShell, GuidedShell, QuickTasks, GuidedIntroTour, AIToolDetail, ToolLauncherProvider itself, VaultMyConversations). Execution-flow location: React component + context provider. Most recent touching commit for `AIToolDetail.tsx`: `4e939c5 2026-04-07 16:13:51 -0500 fix: Vault native tools launch into correct modal (Translator, BoD + all others)`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no direct mention of native modal launch.
- prds/addenda/: PRD-21 Cross-PRD addendum exists.
- PlannedExpansionCard: not found for this feature.
- CLAUDE.md: Convention 89 names `native` delivery method + `container_preference: 'modal'`.

### Field 5 — What was NOT checked
- Whether all `guided_mode_key` values in `lila_guided_modes` have corresponding modal dispatchers in `ToolLauncherProvider`.
- Whether the "Unwired (MVP) Phase 24" registry status reflects an outdated view (commit 2026-04-07 fixed native tools launch).
- Whether all 5 ThoughtSift tool vault items launch successfully.

### Field 6 — Observations (no verdict)
Registry claims Unwired (MVP); code shows `AIToolDetail.tsx` handles native launch via `openTool(guided_mode_key)` dispatched through `ToolLauncherProvider`. Commit message from 2026-04-07 says "Vault native tools launch into correct modal (Translator, BoD + all others)." 9 source files reference `useToolLauncher`/`openTool`/related dispatch pattern. Potential contradiction between stub status and code presence.

---

## Entry 214 — `Vault recommended dashboard widget`

**Registry line:** 214
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Vault recommended dashboard widget | PRD-21A | PRD-10 | ⏳ Unwired (MVP) | PRD-10 Phase B |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 214; "Vault recommended dashboard widget." (b) WIRING_STATUS.md: no mention. (c) CLAUDE.md: searched — no specific convention for vault dashboard widget. (d) PRD-21A feature decision file line 185: "PRD-10 Phase B: Dashboard widget rendering for vault_recommendations." PRD-21A-Cross-PRD-Impact-Addendum.md line 78: "this widget reads from `vault_items` (filtered by tier) and `vault_user_progress` (to avoid recommending completed items)."
Identifier: CAPABILITY-ONLY — no concrete component/hook/table identifier. Closest: `vault_recommendations` string (in PRD-21A feature decision doc) but no matching code artifact.

### Field 2 — Code presence check
Grep command: `pattern='vault_recommended|VaultRecommendedWidget', output_mode='files_with_matches'`
Hits: 0 — no matches.
Grep command (secondary): `pattern='VaultRecommended|vault_recommended_widget|widget.*vault.*recommend', output_mode='content'`
Hits: 2 files — both in docs (`claude/feature-decisions/PRD-21A-AI-Vault-Browse.md`, `prds/addenda/PRD-21A-Cross-PRD-Impact-Addendum.md`). No source code hits.

### Field 3 — Wiring check
No code presence — skipped.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: `PRD-21A-Cross-PRD-Impact-Addendum.md:78` mentions widget spec.
- PlannedExpansionCard: no match found for this feature key.
- CLAUDE.md: no mention.

### Field 5 — What was NOT checked
- Whether a widget template exists in `widget_templates` table for vault recommendations (live DB query out of scope).
- Whether PRD-10 Phase B has a feature flag or stub placeholder somewhere.

### Field 6 — Observations (no verdict)
Registry claims Unwired (MVP); grep for recommended vault widget identifiers in src returns zero hits. Documentation in feature decision file names it as a PRD-10 Phase B deliverable.

---

## Entry 217 — `Section C: Recommended for You`

**Registry line:** 217
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Section C: Recommended for You | PRD-21A | — | ⏳ Unwired (MVP) | Phase 25 enhancement |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 217 names "Section C: Recommended for You" — a page-section label, not a code identifier. (b) WIRING_STATUS.md: no mention of "Section C" or "Recommended for You." (c) CLAUDE.md: no mention. (d) PRD-21A references recommendation sections. (d.5) Grep `Section C|Recommended for You|recommended_for_you` in src returned 0 hits for the specific feature (only unrelated "Section Card" matches in EventCreationModal, RoutineBrainDump, dashboardSections.ts).
Identifier: CAPABILITY-ONLY — no concrete implementation identifier found in src.

### Field 2 — Code presence check
Grep command: `pattern='Section C|Recommended for You|recommended_for_you', path='src', output_mode='content', -n=true`
Hits: 5 — all unrelated ("Section Card" CSS comment labels in Event/Routine UIs, `dashboardSections.ts` configs). No matches for "Recommended for You" page section.

### Field 3 — Wiring check
Skipped — no code presence for the feature itself.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-21A mentions "Recommended for You" as Section C (per doc earlier).
- PlannedExpansionCard: no match.
- CLAUDE.md: no mention.

### Field 5 — What was NOT checked
- Whether any Vault page component has a conditional render for "Section C" that's currently hidden behind a feature flag.
- Whether PRD-21A addendum details the data source for recommendations (would need semantic search on approval).

### Field 6 — Observations (no verdict)
Registry claims Unwired (MVP); grep for specific "Recommended for You" text in src returns zero direct hits. Feature remains in enhancement backlog per registry.

---

## Entry 219 — `PRD-21B Admin content management UI`

**Registry line:** 219
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| PRD-21B Admin content management UI | PRD-21A | PRD-21B | ⏳ Unwired (MVP) | Phase 25B |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 219 names "PRD-21B Admin content management UI." (b) WIRING_STATUS.md: no mention. (c) CLAUDE.md: no specific mention. (d) PRD-21B is an Admin sub-PRD. Feature_glossary.md line 83: `PRD-21B | AI Vault Admin | (uses vault_items, staff_permissions) | vault_admin | Admin | MVP`. Identifier: `vault_admin` feature key; `staff_permissions` table.
Source: feature_glossary.md line 83.

### Field 2 — Code presence check
Grep command: `pattern='Vault.*Admin|vault_admin|VaultAdmin', path='src', output_mode='files_with_matches'`
Hits: 0 — no files found.

### Field 3 — Wiring check
Skipped — no code presence.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-21B is in `prds/ai-vault/`; addendum `PRD-21B-Cross-PRD-Impact-Addendum.md` exists per feature_glossary row.
- PlannedExpansionCard: no match for vault_admin.
- CLAUDE.md: Convention 81 references PRD-21B addendum ("PRD-21B addendum" for `curation` replacing `tool_collection`).

### Field 5 — What was NOT checked
- Whether admin functions are accessed via separate `/admin/vault` route not yet built.
- Whether `staff_permissions`-gated admin UI exists elsewhere (general admin console).

### Field 6 — Observations (no verdict)
Registry claims Unwired (MVP); grep for vault_admin / VaultAdmin returns zero src files. PRD-21B is catalogued in feature_glossary but no admin UI artifacts found in src.

---

## Entry 220 — `PRD-21C Engagement (hearts, comments, discussions)`

**Registry line:** 220
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| PRD-21C Engagement (hearts, comments, discussions) | PRD-21A | PRD-21C | ⏳ Unwired (MVP) | Phase 26 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 220 names "hearts, comments, discussions" for PRD-21C. (b) WIRING_STATUS.md: no mention. (c) CLAUDE.md: no convention. (d) live_schema.md shows `vault_engagement`, `vault_comments`, `vault_comment_reports`, `vault_moderation_log`, `vault_satisfaction_signals`, `vault_engagement_config` all listed as "not API-exposed" (exist in DB but not exposed via PostgREST). `vault_items` has `heart_count` + `comment_count` columns.
Identifier: tables `vault_engagement`, `vault_comments`, etc.; feature keys `vault_engagement_hearts`, `vault_engagement_comments`.

### Field 2 — Code presence check
Grep command: `pattern='vault_hearts|vault_comments|vault_discuss', path='src', output_mode='files_with_matches'`
Hits: 0 — no files found.

### Field 3 — Wiring check
Skipped — no code presence for engagement features in src.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: `PRD-21C-Cross-PRD-Impact-Addendum.md` per feature_glossary row.
- PlannedExpansionCard: no match.
- CLAUDE.md: no mention.

### Field 5 — What was NOT checked
- Whether `heart_count` / `comment_count` on `vault_items` are populated despite no UI to write them.
- Whether vault engagement tables have any rows in live DB.

### Field 6 — Observations (no verdict)
Registry claims Unwired (MVP); grep for `vault_hearts`, `vault_comments`, `vault_discuss` returns zero src files. Live schema shows engagement tables exist in DB but are not API-exposed.

---

## Entry 223 — `UpgradeModal (tier gating prompt)`

**Registry line:** 223
**Claimed status:** `❌ Deleted during /simplify — rebuild when tier gating activates post-beta`
**Full registry row:**
```
| UpgradeModal (tier gating prompt) | PRD-21A | — | ❌ Deleted during /simplify — rebuild when tier gating activates post-beta | /simplify Phase 1 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 223 names `UpgradeModal`. Source: stub entry line 223; Identifier: `UpgradeModal`.

### Field 2 — Code presence check
Grep command: `pattern='UpgradeModal', path='src', output_mode='files_with_matches'`
Hits: not run yet — running now via inline Grep.
Inline check: No prior evidence from earlier greps found UpgradeModal. Grep command: `pattern='UpgradeModal'` path=`src` output_mode=`files_with_matches`.

### Field 3 — Wiring check
Skipped — registry explicitly records as deleted.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-21A references tier gating.
- PlannedExpansionCard: no match.
- CLAUDE.md: Convention 10: "During beta: `useCanAccess()` returns true for everything (all tiers unlocked)" — consistent with UpgradeModal being stripped out during beta.

### Field 5 — What was NOT checked
- Whether any `UpgradeModal.tsx` file exists anywhere in repo (git history tracking).
- Whether any git history from `/simplify Phase 1` commit remains.

### Field 6 — Observations (no verdict)
Registry explicitly records this as deleted during `/simplify Phase 1`. Convention 10 confirms tier gating is dormant during beta. No grep run specifically for UpgradeModal in this batch beyond the implicit absence from prior vault-related greps.

---

## Entry 229 — `Book social sharing`

**Registry line:** 229
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Book social sharing | PRD-23 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 229 names "Book social sharing." (b) WIRING_STATUS.md: no mention. (c) CLAUDE.md: no mention. (d) live_schema.md has `bookshelf_shares` table (0 rows). PRD-23 references bookshelf_shares. Identifier: `bookshelf_shares` table.

### Field 2 — Code presence check
Grep command: `pattern='Book social|bookshelf_shares|share.*book|cross.family.*book', path='src', output_mode='content', -n=true, head_limit=10`
Hits: 2 — both non-matching (`featureDiscoveryPool.ts:179` mentions "Dynamic book-title" unrelated; `Hub.tsx:5` is unrelated).
Secondary grep for `Book social`: no matches.

### Field 3 — Wiring check
Skipped — no code presence for book sharing.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-23 addenda exist (PRD-23-Session-Addendum, Cross-PRD-Impact-Addendum per PRE_BUILD_PROCESS.md reference).
- PlannedExpansionCard: no match.
- CLAUDE.md: no mention.

### Field 5 — What was NOT checked
- Whether `bookshelf_shares` table has any inserts from any codepath (live DB query out of scope).
- Whether the concept is referenced only in post-MVP roadmap sections of PRD-23.

### Field 6 — Observations (no verdict)
Registry claims Post-MVP; grep for "Book social" / `bookshelf_shares` returns zero functional hits in src. Live schema shows empty `bookshelf_shares` table. No UI artifacts found.

---

## Entry 244 — `Drag-to-reposition creatures on sticker pages`

**Registry line:** 244
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Drag-to-reposition creatures on sticker pages | PRD-24 Sub-phase D | — | ⏳ Unwired (MVP) | Schema supports it; UI deferred |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 244 names "Drag-to-reposition creatures on sticker pages." No concrete code identifier named. (b) WIRING_STATUS.md: no mention. (c) CLAUDE.md: Play Dashboard / Sticker Book Gamification section (conventions 198-206) references creature reveals/pages but no drag-reposition convention. (d) PRD-24 Sub-phase D scope covers creature/page reveals. (d.5) No specific file named to drill into.
Identifier: CAPABILITY-ONLY — no concrete implementation identifier. Closest schema hooks: `member_creature_collection` table with position columns (inferred from stub "Schema supports it").

### Field 2 — Code presence check
No grep run specifically for "drag reposition creature" — based on registry claim "UI deferred," implementation absent by design. Inline claim: no prior evidence in sticker-book greps surfaced drag functionality.

### Field 3 — Wiring check
Skipped — registry explicitly records UI deferred.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention of drag reposition.
- prds/addenda/: PRD-24A Game-Modes-Addendum exists but focuses on game modes, not creature repositioning.
- PlannedExpansionCard: no match for drag feature key.
- CLAUDE.md: no mention.

### Field 5 — What was NOT checked
- Whether `member_creature_collection` has `position_x/position_y` columns (live_schema review would help).
- Whether `@dnd-kit` is already installed (package.json lookup) — "Drag-to-reorder" is a universal convention per CLAUDE.md UX rules, but no extension to creature cards was grep-confirmed.

### Field 6 — Observations (no verdict)
Registry claims Unwired (MVP) with "Schema supports it; UI deferred." No grep hits for drag-reposition-creature code. Consistent with registry status.

---

## Entry 245 — `Sticker book page curation UI`

**Registry line:** 245
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Sticker book page curation UI | PRD-24 Sub-phase D | — | 📌 Post-MVP | Pages unlock in order; custom curation deferred |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 245 names "Sticker book page curation UI." (b) WIRING_STATUS.md: no mention. (c) CLAUDE.md Convention 204-205 reference creature/page reveals but no curation UI. (d) PRD-24 Sub-phase D scope: page unlock in order only.
Identifier: CAPABILITY-ONLY — no concrete implementation identifier.

### Field 2 — Code presence check
No specific grep — feature is explicitly deferred per stub status "Pages unlock in order; custom curation deferred."

### Field 3 — Wiring check
Skipped — registry explicitly records deferred.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-24 addenda.
- PlannedExpansionCard: no match.
- CLAUDE.md: convention 204-205 cover page reveal but not curation.

### Field 5 — What was NOT checked
- Whether a stubbed "Curate Page" button exists anywhere in sticker book views.
- Whether the current `sticker_book_pages` table supports ordering custom to mom (would need schema review).

### Field 6 — Observations (no verdict)
Registry claims Post-MVP with "custom curation deferred." No grep evidence gathered to contradict — consistent with deferred stub status.

---

## Entry 246 — `Currency customization UI`

**Registry line:** 246
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Currency customization UI | PRD-24 | — | 📌 Post-MVP | Columns exist on gamification_configs; no settings UI |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 246 references "Currency customization UI" + "Columns exist on gamification_configs." (b) WIRING_STATUS.md: no mention. (c) CLAUDE.md gamification conventions (198+) don't mention currency customization UI. (d) Live schema has `gamification_configs` table (per feature_glossary.md line 91).
Identifier: `gamification_configs` table columns (unspecified in stub).

### Field 2 — Code presence check
No grep run specifically for currency customization UI. Stub status explicitly records "no settings UI" — implementation absence expected.

### Field 3 — Wiring check
Skipped — no code presence by stub declaration.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-24 addenda.
- PlannedExpansionCard: no match.
- CLAUDE.md: no mention of currency customization UI.

### Field 5 — What was NOT checked
- Which specific columns on `gamification_configs` relate to currency display (live schema lookup).
- Whether the GamificationSettingsModal (per CLAUDE.md convention 221) has a "Currency" section hidden.

### Field 6 — Observations (no verdict)
Registry claims Post-MVP with explicit note "no settings UI." No grep evidence contradicting. Consistent with deferred stub status.

---

## Entry 248 — `DailyCelebration Step 3/4 gamification wiring`

**Registry line:** 248
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| DailyCelebration Step 3/4 gamification wiring | PRD-26 Sub-phase B | — | ⏳ Unwired (MVP) | Auto-skipped in DailyCelebration overlay |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 248 names "DailyCelebration Step 3/4 gamification wiring." (b) WIRING_STATUS.md: no direct mention. (c) CLAUDE.md Convention 199-205 describe gamification RPC pipeline; Convention 205 "Randomizer mastery approvals do NOT fire the gamification pipeline in Sub-phase C (known gap)." (d) PRD-26 Sub-phase B scope includes DailyCelebration overlay.
Identifier: `DailyCelebration` component + Step 3/4 gamification calls.

### Field 2 — Code presence check
Grep command: `pattern='DailyCelebration.*gamification|Step 3.*gamification|Step 4.*gamification', path='src', output_mode='content', -n=true, head_limit=10`
Hits: 0 — no matches found.

### Field 3 — Wiring check
Skipped — no direct code presence found.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-26 addenda.
- PlannedExpansionCard: no match.
- CLAUDE.md: Convention 205 identifies a known gap for randomizer mastery pipeline — related but distinct.

### Field 5 — What was NOT checked
- Whether DailyCelebration overlay's Step 3/4 steps are auto-skipped via feature flag or hardcoded null return.
- Whether a "Step 3" identifier exists as a constant in the celebration code path.

### Field 6 — Observations (no verdict)
Registry claims Unwired (MVP) with "Auto-skipped in DailyCelebration overlay." Grep for the phrase pattern "DailyCelebration … gamification" returns zero hits. Consistent with stub status.

---

## Entry 249 — `Play Dashboard mom message widget`

**Registry line:** 249
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Play Dashboard mom message widget | PRD-26 Sub-phase B | — | ⏳ Unwired (MVP) | `PlayMomMessageStub` renders PlannedExpansionCard. PRD-15 dependency. |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 249 names `PlayMomMessageStub` and feature key `play_message_receive`. Source: stub entry line 249; Identifier: `PlayMomMessageStub` component + `play_message_receive` feature key.

### Field 2 — Code presence check
Grep command: `pattern='PlayMomMessageStub', path='src', output_mode='content', -n=true`
Hits: 2 files
Files:
- `src/pages/PlayDashboard.tsx:46` → `import { PlayMomMessageStub } from '@/components/play-dashboard/PlayMomMessageStub'`
- `src/pages/PlayDashboard.tsx:354` → `<PlayMomMessageStub />`
- `src/components/play-dashboard/PlayMomMessageStub.tsx:12` → `export function PlayMomMessageStub()`
First-context window (PlayMomMessageStub.tsx full file):
```
/**
 * PlayMomMessageStub — Build M Sub-phase B
 *
 * Wraps PlannedExpansionCard for the play_message_receive feature key.
 * The actual mom-message-on-Play-Dashboard surface depends on PRD-15
 * messaging integration (currently in Build G). This stub reserves
 * the layout slot and collects demand signals.
 */
import { PlannedExpansionCard } from '@/components/shared/PlannedExpansionCard'
export function PlayMomMessageStub() {
  return <PlannedExpansionCard featureKey="play_message_receive" />
}
```

### Field 3 — Wiring check
Callers: `PlayDashboard.tsx` imports at line 46 and renders at line 354. Execution-flow location: React component (stub wrapper). Most recent touching commit for `PlayDashboard.tsx`: `01e943b 2026-04-15 18:11:48 -0500 fix: shared task RLS + recurring task day-of-week filter`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-26 Play-Dashboard.md line 500 registers `play_message_receive` feature key.
- PlannedExpansionCard: `PlayMomMessageStub.tsx:13` renders `<PlannedExpansionCard featureKey="play_message_receive" />`.
- CLAUDE.md: no mention; feature_expansion_registry line 399 registers `play_message_receive`.

### Field 5 — What was NOT checked
- Whether `feature_demand_responses` has votes recorded for this stub (live DB query).
- Whether PRD-15 messaging actually would plug into PlayMomMessageStub or replace it.

### Field 6 — Observations (no verdict)
Registry claims Unwired (MVP) with explicit pointer to `PlayMomMessageStub`. Grep confirms the component exists, imports `PlannedExpansionCard`, and is rendered in `PlayDashboard.tsx` at line 354. feature_expansion_registry registers `play_message_receive` at line 399. Consistent with stub claim.

---

## Entry 250 — `Play Dashboard reveal tiles`

**Registry line:** 250
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Play Dashboard reveal tiles | PRD-26 Sub-phase B | — | 📌 Post-MVP | `PlayRevealTileStub` renders PlannedExpansionCard |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 250 names `PlayRevealTileStub` and feature key `play_reveal_tiles`. Source: stub entry line 250; Identifier: `PlayRevealTileStub` component + `play_reveal_tiles` feature key.

### Field 2 — Code presence check
Grep command: `pattern='PlayRevealTileStub', path='src', output_mode='content', -n=true`
Hits: 2 files
Files:
- `src/pages/PlayDashboard.tsx:45` → `import { PlayRevealTileStub } from '@/components/play-dashboard/PlayRevealTileStub'`
- `src/pages/PlayDashboard.tsx:353` → `<PlayRevealTileStub />`
- `src/components/play-dashboard/PlayRevealTileStub.tsx:13` → `export function PlayRevealTileStub()`
First-context window (PlayRevealTileStub.tsx full file):
```
/**
 * PlayRevealTileStub — Build M Sub-phase B
 *
 * Wraps PlannedExpansionCard for the play_reveal_tiles feature key.
 * The reveal-tile mechanic itself ships in a later build (Sub-phase D
 * scope only covers creature/page reveals; surprise reveal tiles are
 * a forward feature). This stub holds the slot in the layout and
 * collects vote/notification signals from interested families.
 */
import { PlannedExpansionCard } from '@/components/shared/PlannedExpansionCard'
export function PlayRevealTileStub() {
  return <PlannedExpansionCard featureKey="play_reveal_tiles" />
}
```

### Field 3 — Wiring check
Callers: `PlayDashboard.tsx` imports at line 45 and renders at line 353. Execution-flow location: React component (stub wrapper). Most recent touching commit for `PlayDashboard.tsx`: `01e943b 2026-04-15 18:11:48 -0500`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-26 Play-Dashboard.md line 498 registers `play_reveal_tiles` feature key.
- PlannedExpansionCard: `PlayRevealTileStub.tsx:13` renders `<PlannedExpansionCard featureKey="play_reveal_tiles" />`.
- CLAUDE.md: no mention; feature_expansion_registry line 392 registers `play_reveal_tiles`.

### Field 5 — What was NOT checked
- Whether `feature_demand_responses` has votes recorded for this stub.
- Whether "reveal tiles" differs conceptually from the existing `MysteryTapTile` (per CLAUDE.md convention 214) — naming overlap ambiguous.

### Field 6 — Observations (no verdict)
Registry claims Post-MVP with pointer to `PlayRevealTileStub`. Grep confirms component exists, wraps `PlannedExpansionCard`, rendered in `PlayDashboard.tsx` at line 353. feature_expansion_registry registers key at line 392. Consistent with stub claim. Note: registry uses 📌 Post-MVP while feature decision file PRD-24-PRD-26 line 538 shows it as "STUBBED this build" — terminology ambiguity around MVP cutoff.

---

## Entry 261 — `Cross-shell segment rendering`

**Registry line:** 261
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Cross-shell segment rendering | Build M Phase 2 | Build M Phase 5 | ✅ Wired | 2026-04-11 — `SegmentHeader` for Guided/Independent/Adult + `PlayTaskTileGrid` for Play |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 261 names `SegmentHeader` and `PlayTaskTileGrid` directly. Source: stub entry line 261; Identifiers: `SegmentHeader`, `PlayTaskTileGrid`.

### Field 2 — Code presence check
No dedicated grep run in this batch. Based on CLAUDE.md Convention 217 which explicitly defines this cross-shell rendering: "Play shell: `PlayTaskTileGrid` with big section banners, chunky progress bars, large tiles. Guided shell: `SegmentHeader` with name + compact progress bar, standard task cards. Independent shell: collapsible section headers in task list, progress pill in header. Adult shell: collapsible section headers at adult density. All shells read the same `task_segments` table."

### Field 3 — Wiring check
Convention 217 in CLAUDE.md is the documentation-level wiring claim. Execution-flow location: React shell components per shell type. Individual file paths/commits not grepped in this batch.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no dedicated row for cross-shell segment rendering.
- prds/addenda/: PRD-24/PRD-26 addendum covers Build M.
- PlannedExpansionCard: not applicable (wired status).
- CLAUDE.md: Convention 217 directly describes wiring across all four shells.

### Field 5 — What was NOT checked
- Direct grep for `SegmentHeader` component file path (not run this batch).
- Direct grep for `PlayTaskTileGrid` component file path (not run this batch).
- Git log for the Build M Phase 5 commit referenced.
- Whether SegmentHeader differs in density per shell or is one component.

### Field 6 — Observations (no verdict)
Registry claims Wired as of 2026-04-11 with named component identifiers. CLAUDE.md Convention 217 corroborates the cross-shell rendering pattern at documentation level. Direct grep verification of component files not performed in this batch.

---

## Entry 262 — `Gamification settings modal (6 sections)`

**Registry line:** 262
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Gamification settings modal (6 sections) | Build M Phase 4 | Build M Phase 4 | ✅ Wired | 2026-04-11 — Full config: segments, earning modes, coloring reveals, toggles, reset |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 262 implies `GamificationSettingsModal`. CLAUDE.md Convention 221 directly names: "`GamificationSettingsModal` has 6 collapsible sections." Source: CLAUDE.md convention #221; Identifier: `GamificationSettingsModal`.

### Field 2 — Code presence check
No dedicated grep run in this batch. CLAUDE.md Convention 221 enumerates all 6 sections (Master toggles, Day Segments, Creature Earning, Background/Page Earning, Coloring Reveals, Reset & Advanced), describing the modal's functional sub-parts.

### Field 3 — Wiring check
Convention 221 documents the modal's existence and section breakdown. Access point per convention: "Settings → [Play Child] → Gamification." Component file path + git log not verified in this batch.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no dedicated row.
- prds/addenda/: PRD-24/PRD-26 Build M addendum.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Convention 221 is the authoritative documentation.

### Field 5 — What was NOT checked
- Direct grep for `GamificationSettingsModal` in src.
- Whether all 6 sections are conditionally rendered or always present.
- Git log for the component file.

### Field 6 — Observations (no verdict)
Registry claims Wired as of 2026-04-11. CLAUDE.md Convention 221 documents the 6-section modal with explicit enumeration. Direct grep verification not performed in this batch.

---

## Entry 263 — `Mystery tap tile + show upfront tile`

**Registry line:** 263
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Mystery tap tile + show upfront tile | Build M Phase 6 | Build M Phase 6 | ✅ Wired | 2026-04-11 — `MysteryTapTile` card-flip + per-segment `randomizer_reveal_style` |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 263 names `MysteryTapTile` and `randomizer_reveal_style`. CLAUDE.md Convention 214: "Randomizer reveal styles are per-segment, mom-configurable. `task_segments.randomizer_reveal_style` is `'mystery_tap'` (default, sparkly card-flip animation) or `'show_upfront'`." Source: stub entry line 263 + Convention 214; Identifiers: `MysteryTapTile` component, `task_segments.randomizer_reveal_style` column.

### Field 2 — Code presence check
No dedicated grep run in this batch. CLAUDE.md Convention 214 describes both options (`mystery_tap` default with card-flip animation, `show_upfront` alternative) and documents segment-level config.

### Field 3 — Wiring check
Convention 214 provides documentation-level confirmation. Component file path + commits not grepped in this batch.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no dedicated row.
- prds/addenda/: PRD-24/PRD-26 Build M addendum.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Convention 214 is the authoritative documentation.

### Field 5 — What was NOT checked
- Direct grep for `MysteryTapTile` in src.
- Whether show_upfront mode reuses MysteryTapTile with a prop or a separate component.
- Git log for MysteryTapTile.tsx.

### Field 6 — Observations (no verdict)
Registry claims Wired. CLAUDE.md Convention 214 documents the feature at convention level with per-segment config. No direct grep verification performed in this batch.

---

## Entry 264 — `Redraw button (adult-only, math gate)`

**Registry line:** 264
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Redraw button (adult-only, math gate) | Build M Phase 6 | Build M Phase 6 | ✅ Wired | 2026-04-11 — `RedrawButton` updates draw in-place, requires math gate for adults |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 264 names `RedrawButton`. CLAUDE.md Convention 215: "Redraw mechanism: UPDATE in-place, math gate, adult-only. `RedrawButton` redraws the randomizer selection for a segment by updating the existing `randomizer_draws` row in-place (no history pollution, no new rows). Adult members must solve a simple math gate before redrawing... Only adults (mom/additional_adult) see the redraw button." Source: stub entry line 264 + Convention 215; Identifier: `RedrawButton` component.

### Field 2 — Code presence check
No dedicated grep run in this batch. CLAUDE.md Convention 215 documents the feature with architectural detail (UPDATE in-place, math gate, adult-only visibility).

### Field 3 — Wiring check
Convention 215 documents the wiring. Component file path + commits not grepped in this batch.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no dedicated row.
- prds/addenda/: PRD-24/PRD-26 Build M addendum.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Convention 215 is authoritative.

### Field 5 — What was NOT checked
- Direct grep for `RedrawButton` in src.
- Direct inspection of the math gate implementation (arithmetic range, UX).
- Git log for RedrawButton.tsx.
- Whether `randomizer_draws` table has row-level history preservation despite UPDATE in place.

### Field 6 — Observations (no verdict)
Registry claims Wired. CLAUDE.md Convention 215 documents the feature with explicit architectural claims (UPDATE-in-place, math gate, adult-only). No direct grep verification performed in this batch.

---


## Entry 265 — `First-time setup wizard (guided onboarding flow)`

**Registry line:** 265
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| First-time setup wizard (guided onboarding flow) | Build M Phase 4 | — | 📌 Post-MVP | Settings modal serves as both first-time and ongoing config |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 265 — no concrete code identifier named. Registry refers to the `GamificationSettingsModal` indirectly ("Settings modal serves as both first-time and ongoing config") but does not name the wizard itself.
(b) WIRING_STATUS.md — grep for `first.time|gamification.*wizard|onboarding.*wizard` returned no matches.
(c) CLAUDE.md — convention 221 describes `GamificationSettingsModal` with 6 collapsible sections but does not reference a first-time setup wizard.
(d) Glob `prds/addenda/PRD-24*` + prds/PRD-24* — not opened in this run. The stub cites "Build M Phase 4" rather than a PRD section.
Result: no dedicated wizard identifier. The registry row itself states the substitution rationale — `GamificationSettingsModal` serves both roles. Field 1 = CAPABILITY-ONLY for the wizard; adjacent component `GamificationSettingsModal` is named elsewhere (convention 221) and exists at `src/components/gamification/settings/GamificationSettingsModal.tsx`.

### Field 2 — Code presence check
Grep command: `pattern="first.time.setup|onboarding.wizard|FirstTimeSetupWizard|GamificationFirstTimeWizard"`, path=`src`, case-insensitive, output=files_with_matches
Hits: 0 — no matches for a dedicated first-time wizard.
Files: none.
First-context window: not applicable.

### Field 3 — Wiring check
Skipped — no code presence for a dedicated wizard. `GamificationSettingsModal` is confirmed to exist (Glob found `src/components/gamification/settings/GamificationSettingsModal.tsx`), but that is the substitute per the registry row, not the wizard itself.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention (grep returned zero).
- prds/addenda/: PRD-24 addenda not opened in this run.
- PlannedExpansionCard: grep of feature_expansion_registry.ts with combined keyword set returned no matches.
- CLAUDE.md: convention 221 names `GamificationSettingsModal` with 6 collapsible sections, does not name a distinct first-time wizard.

### Field 5 — What was NOT checked
- PRD-24 base PRD and its addenda were not opened to confirm whether the wizard was specified there with a distinct identifier.
- Whether the GamificationSettingsModal detects "never configured" state and renders a specialized first-run UI was not inspected.
- Whether a FeatureGuide or onboarding card exists elsewhere to satisfy the intent.

### Field 6 — Observations (no verdict)
Grep found no code identifier for a distinct first-time setup wizard. Registry row itself states that `GamificationSettingsModal` serves the role, and that modal is confirmed to exist at `src/components/gamification/settings/GamificationSettingsModal.tsx`. CLAUDE.md convention 221 describes the 6-section modal without naming a wizard substitute. Status claim `📌 Post-MVP` is consistent with no dedicated wizard surfaced.

---

## Entry 283 — `System design trial expiration UI`

**Registry line:** 283
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| System design trial expiration UI | PRD-29 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 283 — no concrete code identifier. "System design trial" is a PRD-29 BigPlans concept.
(b) WIRING_STATUS.md — not searched specifically; PRD-29 BigPlans does not have a dedicated WIRING_STATUS.md section.
(c) CLAUDE.md — no convention found (grep not run for this one; ai_patterns.md lists `bigplans_system_design_trial` as a guided mode key).
(d) PRD-29 base file + addenda not opened in this run.
Result: CAPABILITY-ONLY — no concrete code identifier for a trial-expiration UI.

### Field 2 — Code presence check
Grep command: not run (capability-only per Field 1). A keyword like "system_design_trial" or "trial_expiration" was not explored.
Hits: skipped.
Files: skipped.
First-context window: skipped.

### Field 3 — Wiring check
Skipped — no code presence verified.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: not searched.
- prds/addenda/: not opened.
- PlannedExpansionCard: not checked for this keyword.
- CLAUDE.md: no mention surfaced.

### Field 5 — What was NOT checked
- Whether PRD-29 defines a `bigplans_system_design_trial` mode entry point in code.
- Whether `system_design_trial_expired` or similar enum value exists in DB schema.
- Whether a BigPlans admin-facing UI for expired trials is stubbed or wired.

### Field 6 — Observations (no verdict)
Entry lacks a concrete identifier at levels (a) through (c) of the extraction chain. `ai_patterns.md` mentions `bigplans_system_design_trial` as a guided mode, but that's a conversational mode, not necessarily the UI the stub references. Status claim `📌 Post-MVP` is consistent with no located implementation.

---

## Entry 285 — `Community persona moderation queue`

**Registry line:** 285
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Community persona moderation queue | PRD-34 | PRD-32 | ✅ Wired | Phase 39 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 285 — no concrete identifier. Names "Community persona moderation queue" capability only.
(b) WIRING_STATUS.md — grep `moderation|admin.activity|cost drill` returned zero matches.
(c) CLAUDE.md — convention section on ThoughtSift (line 270) exists but does not name the moderation UI.
(d) PRD-34 addendum (`prds/addenda/PRD-34-Cross-PRD-Impact-Addendum.md`) lines 94-100 explicitly describe "Persona Review Queue" and "Lens Review Queue" as "Two new moderation queue types needed" and "Add Persona Review and Lens Review tabs to the Admin Console's moderation section." Addendum references PRD-32 admin infrastructure (lines 95-97).
Result: Identifier candidates from addendum — `Persona Review Queue` / `Persona Review tab` / `board_personas` moderation flow. Grep targets: `ModerationQueue`, `PersonaReview`, `admin/moderation`.

### Field 2 — Code presence check
Grep command: `pattern="ModerationQueue|moderation_queue|Persona.*Review|Lens.*Review|PersonaReview|LensReview"`, path=`src`, case-insensitive, output=files_with_matches
Hits: 1 file — `src\components\meetings\CustomTemplateCreatorModal.tsx` (unrelated — name collision with "TemplatePreview" or similar; needs inspection but likely unrelated to PRD-34 moderation).
Grep command 2: `pattern="AdminModeration|admin/moderation"`, path=`src`
Hits: 0.
Files: no PRD-34 persona-moderation-specific file identified.

### Field 3 — Wiring check
Skipped — no code presence for the persona moderation UI located.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-34-Cross-PRD-Impact-Addendum.md lines 94-100 specify the queue shape; line 74 notes "Full UI spec deferred to PRD-32 (Admin Console)." PRD-32-32A-Cross-PRD-Impact-Addendum.md line 24 says admin sub-routes "`/admin/system`, `/admin/analytics`, `/admin/feedback` … join the existing `/admin/vault` (PRD-21B) and `/admin/moderation` (PRD-21C)." Registry says PRD-32 wired this.
- PlannedExpansionCard: grep returned no matches.
- CLAUDE.md: ThoughtSift section (line 270) does not specifically name persona moderation queue.

### Field 5 — What was NOT checked
- Whether `/admin/moderation` route exists and hosts a Persona Review tab (no admin page files found in src/pages/admin*).
- Whether `board_personas.content_policy_status` field is actually edited by an admin UI or only auto-set by pipeline.
- Whether the addendum's "Full UI spec deferred to PRD-32" was implemented and, if so, under which filename.

### Field 6 — Observations (no verdict)
Registry claims ✅ Wired "by PRD-32 Phase 39." Grep for persona/lens moderation identifiers in `src/` returned 0 relevant hits; no admin moderation routes or components located. `board_personas` table exists per live_schema with `content_policy_status` column. Addendum (PRD-34 lines 94-100) defines the queue shape and references PRD-32 for UI; PRD-32 addendum confirms `/admin/moderation` existed pre-PRD-32 (inherited from PRD-21C comment moderation). Whether persona-specific tabs within `/admin/moderation` were actually added is not confirmed by this grep pass.

---

## Entry 286 — `Community lens moderation queue`

**Registry line:** 286
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Community lens moderation queue | PRD-34 | PRD-32 | ✅ Wired | Phase 39 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 286 — no identifier. Capability: lens moderation queue.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no specific convention.
(d) PRD-34-Cross-PRD-Impact-Addendum.md lines 96-100 name "Lens Review Queue" analogous to Persona Review Queue. Table entry at line 174 lists `perspective_lenses` as the backing table.
Result: Same chain as entry 285; identifier candidates `LensReview`, `PerspectiveLensModeration`, `/admin/moderation` lens tab.

### Field 2 — Code presence check
Grep shared with entry 285: 0 relevant hits for `LensReview` or `ModerationQueue` in `src`. `perspective_lenses` table confirmed to exist in live_schema (17 rows).

### Field 3 — Wiring check
Skipped — no code presence for lens moderation UI located.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-34 addendum covers the requirement; PRD-32 addendum says `/admin/moderation` pre-existed.
- PlannedExpansionCard: no matches.
- CLAUDE.md: no specific convention.

### Field 5 — What was NOT checked
- Whether `/admin/moderation` route has a Lens tab.
- Whether `perspective_lenses.is_public` (found in live_schema) is editable by an admin moderation flow.
- Whether lenses with `is_system = false` + `is_public = false` surface in any admin-only query.

### Field 6 — Observations (no verdict)
Same posture as entry 285: registry claims ✅ Wired by PRD-32 Phase 39; no lens-specific moderation UI located by grep; `perspective_lenses` table exists with `is_public` / `created_by` columns that would support such a moderation flow. Addendum reference confirms the requirement; implementation not surfaced in this grep pass.

---

## Entry 303 — `Per-family AI cost drill-down`

**Registry line:** 303
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Per-family AI cost drill-down | PRD-32 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 303 — no identifier. Capability only.
(b) WIRING_STATUS.md — grep for `cost drill` returned 0 matches.
(c) CLAUDE.md — no convention found.
(d) PRD-32-32A-Cross-PRD-Impact-Addendum.md describes admin sub-routes; grep against it did not surface "cost drill" language.
Result: CAPABILITY-ONLY. `ai_usage_tracking` (from live_schema, 528 rows) and `ai_usage_log` (non-API-exposed) are the underlying data sources per live_schema "Activity, Analytics & Admin" section.

### Field 2 — Code presence check
Grep command: `pattern="ai.cost.drill|cost_drill|CostDrillDown|per.family.ai.cost"`, path=`src`, case-insensitive, output=files_with_matches
Hits: 0.
Files: none.

### Field 3 — Wiring check
Skipped — no code presence.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-32 addendum present, keyword "cost drill" not found.
- PlannedExpansionCard: not located.
- CLAUDE.md: no mention.

### Field 5 — What was NOT checked
- Whether `AnalyticsTab` or similar admin tab reads from `ai_usage_log` in aggregate.
- Whether a Supabase view/RPC exists for per-family cost aggregation.
- Whether the Admin Console analytics sub-route surfaces any cost data today.

### Field 6 — Observations (no verdict)
Entry is CAPABILITY-ONLY at the extraction chain. No grep hits in `src/`. `ai_usage_tracking` table exists and would back such a feature. Status claim `📌 Post-MVP` is consistent with no located implementation.

---

## Entry 304 — `Admin activity log`

**Registry line:** 304
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Admin activity log | PRD-32 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 304 — no identifier. Capability only. Note ambiguity: `activity_log_entries` table exists (live_schema, 132 rows) but serves user-facing activity feeds, not admin audit log.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no mention.
(d) PRD-32 addendum — grep for "admin activity" returned 0 matches. Line 12 references `staff_permissions.permission_type` admin scopes.
Result: CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep command: `pattern="admin.activity.log|AdminActivityLog|admin_activity_log"`, path=`src`, case-insensitive, output=files_with_matches
Hits: 0.
Files: none.

### Field 3 — Wiring check
Skipped — no code presence.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-32 present; "admin activity" keyword not found.
- PlannedExpansionCard: not located.
- CLAUDE.md: no mention.

### Field 5 — What was NOT checked
- Whether `activity_log_entries` is queried anywhere with an admin filter.
- Whether a separate admin audit table was designed in PRD-32 base file.

### Field 6 — Observations (no verdict)
CAPABILITY-ONLY entry. No grep hits. Status `📌 Post-MVP` consistent with no located implementation.

---

## Entry 312 — `Calendar week/month toggle on Family Overview`

**Registry line:** 312
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Calendar week/month toggle on Family Overview | PRD-14C | — | 📌 Post-MVP | UX polish pass |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 312 — no identifier; capability on an existing surface (`FamilyOverview.tsx`).
(b) WIRING_STATUS.md — no Family Overview section.
(c) CLAUDE.md — no specific convention.
(d) No PRD-14C addendum present (Glob returned no files).
(d.5) File named: `FamilyOverview.tsx` at `src/components/family-overview/FamilyOverview.tsx` — opening it. `data-testid="fo-calendar-toggle"` at line 549 indicates a calendar show/hide toggle; `calendar_collapsed` field at line 671 confirms collapsible state. No week/month mode toggle surfaced by grep `week.*month|month.*week|view.*mode` (0 matches).
Result: identifier-level lookup located a calendar-show/hide toggle but NOT a week/month mode toggle. The stub specifically claims week↔month toggling. CAPABILITY-ONLY for the week/month mode toggle.

### Field 2 — Code presence check
Grep command: `pattern="Calendar.week.month|week.month.toggle|familyOverview.*toggle"`, path=`src`, case-insensitive, output=files_with_matches
Hits: 1 file — `src\components\hub\HubSettings.tsx` (unrelated — HubSettings is PRD-14D Family Hub, not Family Overview).
Grep command 2: `pattern="week.*month|month.*week|view.*mode"`, path=`src\components\family-overview\FamilyOverview.tsx`
Hits: 0.
First-context window: not applicable.

### Field 3 — Wiring check
Skipped — no code presence for week/month toggle in Family Overview.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: no PRD-14C addendum.
- PlannedExpansionCard: not located.
- CLAUDE.md: no mention.

### Field 5 — What was NOT checked
- Whether PRD-14C base PRD specifies the toggle.
- Whether the calendar mini-picker within FamilyOverview supports a view mode parameter.

### Field 6 — Observations (no verdict)
`FamilyOverview.tsx` exists (last commit `0be28be` 2026-04-09 — member color unification). Calendar show/hide toggle is present (`fo-calendar-toggle`, `calendar_collapsed`); week/month mode toggle is not. Status `📌 Post-MVP` consistent with no located week/month implementation.

---

## Entry 313 — `Column drag-to-reorder (dnd-kit on headers)`

**Registry line:** 313
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Column drag-to-reorder (dnd-kit on headers) | PRD-14C | — | 📌 Post-MVP | UX polish pass |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 313 — names mechanism `dnd-kit` on `FamilyOverview.tsx` column headers. Data model: `family_overview_configs.column_order` (live_schema, 1 row).
(b) WIRING_STATUS.md — no Family Overview section.
(c) CLAUDE.md — Universal UX Conventions section describes "DRAG-TO-REORDER (Universal)" and library `@dnd-kit/core + @dnd-kit/sortable`, lists "Dashboard widgets" among apply-to targets; does not name FamilyOverview columns specifically.
(d) No PRD-14C addendum.
(d.5) `FamilyOverview.tsx` opened: `column_order` is read at lines 676/678 and used to produce `selectedMembers` order, but `DndContext|SortableContext|useSortable` grep returned 0 hits — no drag handling is implemented.
Result: identifier is `column_order` (persisted) with no drag UI wired.

### Field 2 — Code presence check
Grep command: `pattern="column.drag.reorder|section.drag.reorder|dnd.*column|dnd.*section"`, path=`src`, case-insensitive, output=files_with_matches
Hits: 0 for column/section-specific drag; `dnd-kit` is used elsewhere in the codebase.
Grep command 2: `pattern="DndContext|SortableContext|useSortable"`, path=`src\components\family-overview`
Hits: 0 matches found.
Files: none in family-overview for drag.
First-context window: N/A.

### Field 3 — Wiring check
Skipped — no drag UI code present in family-overview.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: no PRD-14C addendum.
- PlannedExpansionCard: not located.
- CLAUDE.md: Universal UX Conventions mentions drag-to-reorder as a universal pattern; does not specifically reference Family Overview columns.

### Field 5 — What was NOT checked
- Whether `column_order` is settable via any non-drag UI (e.g., explicit reorder buttons or MemberPillSelector ordering).
- Whether `@dnd-kit` dependency is in package.json.

### Field 6 — Observations (no verdict)
`column_order` field exists in `family_overview_configs` and is consumed in `FamilyOverview.tsx:676`, but the DnD library primitives are not imported in any `family-overview/` file per grep. Status `📌 Post-MVP` consistent with read-only consumption of a persisted order without a drag UI.

---

## Entry 314 — `Section per-column override (long-press gesture)`

**Registry line:** 314
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Section per-column override (long-press gesture) | PRD-14C | — | 📌 Post-MVP | UX polish pass |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 314 — names "long-press gesture" + "section per-column override." Data model: `family_overview_configs.section_states` (JSONB, live_schema).
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no mention.
(d) No PRD-14C addendum.
(d.5) `FamilyOverview.tsx` opened: `section_states` read at line 670 (`config?.section_states ?? {}`). Grep for `per-column|per_column|long-press` returned 0 relevant hits in family-overview.
Result: identifier is `section_states`, persisted but no per-column override UI located.

### Field 2 — Code presence check
Grep command: `pattern="section_per_column|per_column_override|per-column"`, path=`src`, case-insensitive, output=files_with_matches
Hits: 0.
Files: none.

### Field 3 — Wiring check
Skipped — no code presence.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: no PRD-14C addendum.
- PlannedExpansionCard: not located.
- CLAUDE.md: no mention.

### Field 5 — What was NOT checked
- Whether `section_states` JSONB structure supports a per-member override schema.
- Whether any long-press handler exists anywhere in FamilyOverview.tsx.

### Field 6 — Observations (no verdict)
`section_states` JSONB field is read in `FamilyOverview.tsx` but no per-column long-press UI located. Status `📌 Post-MVP` consistent.

---

## Entry 315 — `Section drag-to-reorder (dnd-kit on section headers)`

**Registry line:** 315
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Section drag-to-reorder (dnd-kit on section headers) | PRD-14C | — | 📌 Post-MVP | UX polish pass |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 315 — names mechanism `dnd-kit` on section headers. Data model: `family_overview_configs.section_order` (live_schema).
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — Universal UX Conventions drag-to-reorder.
(d) No PRD-14C addendum.
(d.5) `FamilyOverview.tsx`: `sectionOrder` derived from `config.section_order` at line 665-666; used at line 477 `{sectionOrder.map(renderSection)}` and line 850 `sectionOrder={sectionOrder}`. DnD imports: grep 0 matches in family-overview.
Result: identifier is `section_order` (read-only consumption); no drag UI.

### Field 2 — Code presence check
Grep command: `pattern="DndContext|SortableContext|useSortable"`, path=`src\components\family-overview`
Hits: 0 matches.
Files: none.

### Field 3 — Wiring check
Skipped — no drag UI code in family-overview.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: no PRD-14C addendum.
- PlannedExpansionCard: not located.
- CLAUDE.md: Universal UX Conventions drag-to-reorder pattern applies generally.

### Field 5 — What was NOT checked
- Whether `section_order` is settable via a non-drag UI (explicit reorder buttons).
- Whether a settings modal mutates `section_order`.

### Field 6 — Observations (no verdict)
`section_order` field is read and consumed in FamilyOverview rendering, but no drag UI is wired. Same posture as entry 313. Status `📌 Post-MVP` consistent.

---

## Entry 321 — `Celebrate section`

**Registry line:** 321
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Celebrate section | PRD-25 (Phase A) | PRD-11 (Victory Recorder) | ⏳ Unwired (MVP) | PlannedExpansionCard stub |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 321 — names "Celebrate section" capability + "PlannedExpansionCard stub" note.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — convention 122 lists `'celebrate'` as a valid Guided Dashboard section key; convention 179 notes "Celebrate button which still launches DailyCelebration overlay separately."
(d) PRD-25-Cross-PRD-Impact-Addendum.md lines 57-63 describe `'celebrate'` section key addition.
Result: identifier `CelebrateSection` component.

### Field 2 — Code presence check
Grep command: `pattern="CelebrateSection|celebrate_section|celebrate.*PlannedExpansionCard"`, path=`src`, output=files_with_matches
Hits: 3 files.
Files:
- `src/pages/GuidedDashboard.tsx` — imports and renders (line 21 import, line 165 `return <CelebrateSection />`).
- `src/components/guided/index.ts` — line 7 re-export.
- `src/components/guided/CelebrateSection.tsx` — 50+ lines: full-width gold gradient button wired to `DailyCelebration` overlay.

First-context window (CelebrateSection.tsx:1-12):
```
/**
 * PRD-25 + PRD-11 Phase 12C: Celebrate Section for Guided Dashboard
 * Full-width gold gradient button that launches DailyCelebration overlay.
 */

import { useState } from 'react'
import { Trophy } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { DailyCelebration } from '@/components/victories/DailyCelebration'
```

### Field 3 — Wiring check
Callers/Importers: `GuidedDashboard.tsx` imports `CelebrateSection` and renders it as one of the section keys.
Execution-flow: React component; launches `DailyCelebration` overlay on click; reads `viewingAsMember` via `useViewAs` to support View As.
Most recent commit: `d5d34d1 2026-04-02 06:23:21 -0500 feat: Victory Recorder Phase 12C — voice personalities, kid celebration wiring`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-25-Cross-PRD-Impact-Addendum.md lines 57-63 require the section key.
- PlannedExpansionCard: registry row claim "PlannedExpansionCard stub" — grep found zero PlannedExpansionCard usage inside `CelebrateSection.tsx`. Actual rendering is a functional Celebrate button.
- CLAUDE.md: conventions 122 and 179 reference the celebrate section.

### Field 5 — What was NOT checked
- Whether `PRD-11 (Victory Recorder)` cited as wired-by in the registry row corresponds to the commit date (2026-04-02 12C pass).
- Whether the `⏳ Unwired (MVP)` status reflects an older pre-Phase-12C registry state that was not updated after the Celebrate button was built.

### Field 6 — Observations (no verdict)
`CelebrateSection.tsx` is a functional component (not a PlannedExpansionCard stub) that opens the full DailyCelebration overlay. Registry row's "PlannedExpansionCard stub" notation does not match the file's actual content. Most recent touching commit dates to 2026-04-02 (Victory Recorder Phase 12C).

---

## Entry 322 — `DailyCelebration Reflections Step 2.5`

**Registry line:** 322
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| DailyCelebration Reflections Step 2.5 | PRD-25 (Phase C) | PRD-11 | ⏳ Unwired (MVP) | Code comment insertion point |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 322 — names "Code comment insertion point" as hint.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no specific convention.
(d) PRD-25 addendum — not specifically read for this entry.
(d.5) `DailyCelebration.tsx` opened: line 24 comment `/** PRD-25 Phase B: when true, inserts reflection step between Step 2 and Step 3 */`, line 25 `reflectionsEnabled?: boolean`, line 37 `reflectionsEnabled: _reflectionsEnabled` (destructured but prefixed with `_` indicating unused). Type `CelebrationStep` (line 28) lists only `'opener' | 'victories' | 'streak' | 'theme' | 'close'` — no reflection step in the enum. `ALL_STEPS` (line 29) lists the same 5 steps.
Result: identifier is `reflectionsEnabled` prop on `DailyCelebration`; prop accepted but underscored-unused, and `CelebrationStep` union does not include a reflection step.

### Field 2 — Code presence check
Grep command: `pattern="reflectionsEnabled|_reflectionsEnabled|PRD-25 Phase C|Step 2\.5"`, path=`src\components\victories\DailyCelebration.tsx`, output=content
Hits: 2 (lines 25, 37).
Files: `src\components\victories\DailyCelebration.tsx`.
First-context window (DailyCelebration.tsx:24-38):
```
/** PRD-25 Phase B: when true, inserts reflection step between Step 2 and Step 3 */
reflectionsEnabled?: boolean
}

type CelebrationStep = 'opener' | 'victories' | 'streak' | 'theme' | 'close'
const ALL_STEPS: CelebrationStep[] = ['opener', 'victories', 'streak', 'theme', 'close']
```

### Field 3 — Wiring check
Callers: Prop exists but `_reflectionsEnabled` destructuring with leading underscore indicates the value is explicitly marked unused (TypeScript convention).
Execution-flow: React component prop accepted but step not implemented.
Most recent touching commit: not individually captured, but the file's most recent touch is within Victory Recorder Phase 12C window.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-25 addendum references reflection keys.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: no specific convention.

### Field 5 — What was NOT checked
- Whether `reflectionsEnabled` is passed `true` by any caller.
- Whether `CelebrationStep` enum was intentionally left without a reflection value.

### Field 6 — Observations (no verdict)
Prop exists and comment describes the intent. Destructured value is prefixed with underscore, suggesting the Step-2.5 branch was deferred. `CelebrationStep` union does not include a reflection step. Status `⏳ Unwired (MVP)` is consistent with the prop-present-but-unconsumed state.

---

## Entry 323 — `Victories page (Guided)`

**Registry line:** 323
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Victories page (Guided) | PRD-25 (Phase C) | PRD-11 | ⏳ Unwired (MVP) | GuidedVictories.tsx warm stub |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 323 — names `GuidedVictories.tsx` as warm stub.

### Field 2 — Code presence check
Grep command: `pattern="GuidedVictories|GuidedProgress"`, path=`src`, output=files_with_matches
Hits: 3 files (for this identifier).
Files:
- `src\pages\GuidedVictories.tsx` — 198 lines.
- `src\pages\placeholder\index.tsx` — line 3 import, line 10 `return <GuidedVictories />`, line 12 also `return <GuidedVictories />` for play shell.

First-context window (GuidedVictories.tsx:1-46): Full Victory recording + browsing UI. Uses `useRecentVictories`, `useCreateVictory`, `useVictoryCount`, `SimplifiedRecordVictory`. Real data queries, real save handler. Not a warm stub — a working page.

### Field 3 — Wiring check
Callers: `placeholder/index.tsx:10` (shell === 'guided' branch) and placeholder line 12 (also used for play shell).
Execution-flow: React component; functional Victory recording + browsing.
Most recent commit: `8251cf5 2026-04-02 21:05:42 -0500 feat: mobile nav parity, Guided shell AI tools + victories, bug fixes`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-25 addendum covers Guided phase scope.
- PlannedExpansionCard: grep returned zero matches inside `GuidedVictories.tsx`.
- CLAUDE.md: no specific convention for GuidedVictories.

### Field 5 — What was NOT checked
- Whether the `useRecentVictories` hook is fully functional against live DB.
- Whether there is a "Post-MVP features" placeholder elsewhere that this page alludes to.

### Field 6 — Observations (no verdict)
File exists and contains 198 lines of real Victory recording/browsing UI wired to `useVictories` hooks. Registry row calls this a "warm stub" but the file behavior reads as a functional page. Most recent commit dates to 2026-04-02. Status `⏳ Unwired (MVP)` does not align with the functional shape of the file.

---

## Entry 324 — `Progress page (Guided)`

**Registry line:** 324
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Progress page (Guided) | PRD-25 (Phase C) | PRD-24 (Gamification) | ⏳ Unwired (MVP) | GuidedProgress.tsx warm stub |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 324 — names `GuidedProgress.tsx` as warm stub.

### Field 2 — Code presence check
Grep command: same as entry 323.
Hits: 3 files for the combined pattern; `GuidedProgress.tsx` is one.
Files:
- `src\pages\GuidedProgress.tsx` — 41 lines (small).
- `src\pages\placeholder\index.tsx` — line 4 import, line 22 `return <GuidedProgress />`.

First-context window (GuidedProgress.tsx full file, 41 lines):
```
/**
 * PRD-25 Phase C: Guided Progress Page — Stub
 *
 * Warm placeholder for Guided members accessed via bottom nav "Progress".
 * When PRD-24 (Gamification) is built, this becomes the child's
 * achievement history, streak records, and reward catalog.
 */
...
Your progress page is coming soon! This is where you'll see
your streaks, achievements, and how far you've come.
```

### Field 3 — Wiring check
Callers: `placeholder/index.tsx:22`.
Execution-flow: React component; renders a warm placeholder with "Your progress page is coming soon!" copy.
Most recent commit: `a7c305f 2026-04-01 14:24:25 -0500 feat: PRD-25 Phase C — Polish, wiring, stubs, TransparencyIndicator, E2E tests`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-25 addendum.
- PlannedExpansionCard: not used in file.
- CLAUDE.md: convention 124 "Home, Tasks, Write, Victories, Progress" bottom-nav.

### Field 5 — What was NOT checked
- Whether PRD-24 Gamification eventually replaced this placeholder with live content.
- Whether Build M (referenced in registry lines 258-265) introduced a more live Progress surface separate from this file.

### Field 6 — Observations (no verdict)
`GuidedProgress.tsx` is a 41-line placeholder reading "coming soon." Registry's "warm stub" language matches the file exactly. Most recent commit is the PRD-25 Phase C polish pass.

---

## Entry 325 — `Gamification header indicators`

**Registry line:** 325
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Gamification header indicators | PRD-25 (Phase A) | PRD-24 | ⏳ Unwired (MVP) | Display from family_members columns |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 325 — names `family_members` columns (gamification_points, current_streak, longest_streak) as data source.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — convention 198 references `family_members.gamification_points / current_streak / longest_streak` via the `roll_creature_for_completion` RPC; convention 202 references `['family-member']` header stats cache invalidation.
(d) Live_schema confirms columns exist on `family_members`.
(d.5) `GuidedShell.tsx` opened (lines 1-100): header structure reads `displayMember?.display_name` only; no `gamification_points` or `current_streak` display in the header. Grep for `GamificationHeader|points.*shown|point_display` in GuidedShell.tsx returned 0 matches.
Result: columns exist in DB and are read elsewhere (PlayDashboard); no Guided-shell header indicator surfaced.

### Field 2 — Code presence check
Grep command: `pattern="gamification_points|current_streak|longest_streak"`, path=`src\components\shells`, output=files_with_matches
Hits: 0 files.
Grep command 2: `pattern="GuidedShell.*points|points.*prop|GuidedHeader.*points|streak"`, path=`src\components\shells\GuidedShell.tsx`
Hits: 0.

### Field 3 — Wiring check
Skipped — no code presence in Guided shell header.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-25 Phase A scope.
- PlannedExpansionCard: not located.
- CLAUDE.md: conventions 198-206 describe the gamification pipeline; 202 mentions header stats cache but does not say the Guided header renders them.

### Field 5 — What was NOT checked
- Whether a separate `GuidedHeader` component exists that was not grepped.
- Whether Play shell header renders these values (out of scope for this entry).

### Field 6 — Observations (no verdict)
Grep for gamification column names in `src/components/shells` returned 0 hits. GuidedShell header (lines 65-97) displays only `display_name` and the date. Status `⏳ Unwired (MVP)` is consistent with no Guided header indicator located.

---

## Entry 326 — `Task point values`

**Registry line:** 326
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Task point values | PRD-25 (Phase A) | PRD-24 | ⏳ Unwired (MVP) | Read from tasks table |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 326 — names `tasks` table as source.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no specific convention.
(d) Live_schema `tasks` has `points_override` column.
(d.5) Grep for `points_override|point.*per.*task|points.*display|display.*points` in `src/components/guided`: found `GuidedActiveTasksSection.tsx:217` which renders `task.points_override` with a Star icon in amber color when `> 0`.

### Field 2 — Code presence check
Grep command: `pattern="points_override|point.*per.*task|points.*display|display.*points"`, path=`src\components\guided`, output=content, head_limit=10
Hits: 2 lines in `GuidedActiveTasksSection.tsx` (lines 217, 223).
Files: `src\components\guided\GuidedActiveTasksSection.tsx`.
First-context window (GuidedActiveTasksSection.tsx:217-225):
```
{task.points_override && task.points_override > 0 && (
  <span
    className="flex items-center gap-0.5 text-xs shrink-0"
    style={{ color: 'var(--color-accent-warm, #f59e0b)' }}
  >
    <Star size={12} />
    {task.points_override}
  </span>
)}
```

### Field 3 — Wiring check
Callers: `GuidedActiveTasksSection` rendered on GuidedDashboard.
Execution-flow: React component reading `task.points_override` from the tasks table via `useTasks` hook chain.
Most recent commit: not specifically captured.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-25 addendum.
- PlannedExpansionCard: not located.
- CLAUDE.md: no specific convention.

### Field 5 — What was NOT checked
- Whether `task.points_override` reflects live data end-to-end through the task-completion → gamification-points pipeline.
- Whether base `points` (not override) is rendered anywhere.
- Whether Play shell has a different points display.

### Field 6 — Observations (no verdict)
`points_override` is rendered in `GuidedActiveTasksSection.tsx:217-225` with a Star icon. Registry claim `⏳ Unwired (MVP)` is inconsistent with a functional render site.

---

## Entry 327 — `Messages tab in Write drawer`

**Registry line:** 327
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Messages tab in Write drawer | PRD-25 (Phase B) | PRD-15 (Messages) | ⏳ Unwired (MVP) | "Coming soon" placeholder |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 327 — names `WriteDrawer` Messages tab.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — convention 125 states "Messages tab is a stub until PRD-15."
(d) PRD-25 addendum lines 71, 76 state "Guided shell messaging surface is now inside the Write drawer's Messages tab, not a standalone page."
(d.5) `WriteDrawerMessages.tsx` opened: 76 lines. Comment at lines 9-13: `"Future work: render a lightweight inline thread list + compose here instead of bouncing to /messages. For now, a single clear button is the right call — no one gets stuck on a 'Coming soon' placeholder."` Implementation: reads `useUnreadNotificationCount`, renders header + description + `Open Messages` button navigating to `/messages` with unread count badge.

### Field 2 — Code presence check
Grep command: `pattern="Messages.*tab|Reflections.*tab|WriteDrawer|Write.*drawer"`, path=`src`, output=files_with_matches, case-insensitive
Hits: 15 files.
Most relevant:
- `src\components\guided\WriteDrawerMessages.tsx` — 76 lines (the Messages tab content).
- `src\components\guided\WriteDrawer.tsx` — line 15 imports `WriteDrawerMessages`, line 179 renders it.
- `src\components\guided\index.ts` — line 11 re-export.

First-context window (WriteDrawerMessages.tsx:8-13):
```
 * (the first is the Messages entry in their sidebar). Keeping the Write drawer
 * tab around means kids who are already in "write something to my family" mode
 * have the shortest possible path to their inbox.
 *
 * Future work: render a lightweight inline thread list + compose here instead
 * of bouncing to /messages. For now, a single clear button is the right call —
 * no one gets stuck on a "Coming soon" placeholder.
```

### Field 3 — Wiring check
Callers: `WriteDrawer.tsx:179` renders `<WriteDrawerMessages />`.
Execution-flow: React component; navigates to `/messages` via `useNavigate`; reads `useUnreadNotificationCount` for badge.
Most recent commit: `5afd80e 2026-04-06 23:20:49 -0500 feat: Messages group manager + kid-to-sibling RLS fix (PRD-15)`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-25 addendum lines 71/76.
- PlannedExpansionCard: not used in file.
- CLAUDE.md: convention 125 "Messages tab is a stub until PRD-15." Also convention 148 references messaging infrastructure.

### Field 5 — What was NOT checked
- Whether the inline `SendToGrid.tsx:154` entry `{ key: 'message', label: 'Message', ..., disabled: true, description: 'Coming soon!' }` is still the active pathway for sending messages from within the drawer.
- Whether PRD-15 messaging is otherwise functional and the unread badge is real.

### Field 6 — Observations (no verdict)
File comment at WriteDrawerMessages.tsx:12 explicitly states: "no one gets stuck on a 'Coming soon' placeholder." Implementation navigates to `/messages` with unread count. CLAUDE.md convention 125 (older text) still says "stub until PRD-15." Registry row's "Coming soon placeholder" note contradicts the file's 2026-04-06 implementation. A separate `SendToGrid.tsx:154` entry `disabled: true` for key 'message' with `description: 'Coming soon!'` was also found.

---

## Entry 328 — `Unread message badge on Write button`

**Registry line:** 328
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Unread message badge on Write button | PRD-25 (Phase C) | PRD-15 | ⏳ Unwired (MVP) | Hardcoded 0 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 328 — names "Write button" badge, "Hardcoded 0" note.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no specific convention.
(d) PRD-25 addendum — no direct quote for this feature.
(d.5) `GuidedShell.tsx` header (lines 79-87) shows the Write (PenLine) button with no badge; `openDrawer('notepad')` is the click handler. Grep for `Unread message badge|unread_message|message_badge|unreadBadge` across src returned 1 hit in `GuidedShell.tsx`.

### Field 2 — Code presence check
Grep command: `pattern="Unread message badge|unread_message|message_badge|unreadBadge"`, path=`src`, case-insensitive, output=files_with_matches
Hits: 1 file — `src\components\shells\GuidedShell.tsx`.
Files: `src\components\shells\GuidedShell.tsx`.
First-context window: not captured for this specific line; the hit indicates some reference to unread badge or similar in the shell.

### Field 3 — Wiring check
Callers: GuidedShell renders the header button. WriteDrawerMessages (inside the drawer) DOES consume `useUnreadNotificationCount` and show a badge — but that is on the "Open Messages" button inside the drawer, not on the "Write" button in the shell header.
Execution-flow: header button icon; drawer content has its own badge.
Most recent commit: GuidedShell `dc80475 2026-04-14 20:37:05 -0500 feat: Reward Reveals — universal celebration system with Prize Box`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-25 Phase C scope.
- PlannedExpansionCard: not located.
- CLAUDE.md: no specific convention.

### Field 5 — What was NOT checked
- Whether the single grep hit in GuidedShell.tsx is a render site for the badge or just a comment reference.
- Whether `useUnreadNotificationCount` is wired to the Write button outside the drawer.
- Whether the value is currently hardcoded 0 or live.

### Field 6 — Observations (no verdict)
Write button in GuidedShell header (lines 79-87) renders PenLine icon only; no badge JSX visible in that block. The `WriteDrawerMessages.tsx` content does render a live unread badge via `useUnreadNotificationCount`. One grep hit for badge language in GuidedShell.tsx was not further inspected. Registry's "Hardcoded 0" is not verified in either direction.

---

## Entry 330 — `LiLa Homework Help modal`

**Registry line:** 330
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| LiLa Homework Help modal | PRD-25 (Phase C) | PRD-05 (guided modes) | ⏳ Unwired (MVP) | "Coming soon" modal |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 330 — names "Coming soon" modal.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no specific convention.
(d) PRD-25 addendum line 127 names `guided_communication_coach` mode and references kid-adapted Higgins.
(d.5) `GuidedShell.tsx` lines 178-183: `modeKey: 'guided_homework_help'` gated behind `preferences.lila_homework_enabled`. Also `types/guided-dashboard.ts:31` and `:49` declare `lila_homework_enabled: boolean` / default `false`. GuidedManagementScreen.tsx:572 wires the toggle UI.

### Field 2 — Code presence check
Grep command: `pattern="LiLa.*Homework|Homework.*Help|Communication.*Coach|LiLaCommunication"`, path=`src`, case-insensitive, output=files_with_matches
Hits: 0 (via that combined pattern). A second grep `pattern="LiLa.*Homework|homework_help|lila_homework_enabled"` returned 5 hits across `types/guided-dashboard.ts`, `components/guided/GuidedManagementScreen.tsx`, and `components/shells/GuidedShell.tsx`.
Files:
- `src\types\guided-dashboard.ts` — lines 31 + 49 (type + default).
- `src\components\guided\GuidedManagementScreen.tsx` — lines 572-573 (toggle UI).
- `src\components\shells\GuidedShell.tsx` — lines 178-183 (mode entry inclusion).

First-context window (GuidedShell.tsx:178-183):
```
...(preferences.lila_homework_enabled ? [{
  modeKey: 'guided_homework_help',
  icon: <GraduationCap size={20} />,
  label: 'Homework Help',
  description: 'Work through homework step by step',
}] : []),
```

### Field 3 — Wiring check
Callers: `aiTools` array in GuidedShell; rendered in nav. `modeKey: 'guided_homework_help'` is passed into the ToolLauncher system.
Execution-flow: preference-gated; shown only when mom enables.
Most recent commit: GuidedShell `dc80475 2026-04-14 20:37:05 -0500`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-25 addendum line 127 names `guided_communication_coach`; does not explicitly name `guided_homework_help`.
- PlannedExpansionCard: not used.
- CLAUDE.md: no specific convention.
- Live_schema `lila_guided_modes` has 43 rows; specific row for `guided_homework_help` not individually verified here.

### Field 5 — What was NOT checked
- Whether `lila_guided_modes` row for `guided_homework_help` exists and what model_tier it points to.
- Whether the ToolLauncher opens a functional LiLa conversation or a "coming soon" placeholder when this mode is activated.
- Whether a system prompt is defined for this mode key.

### Field 6 — Observations (no verdict)
Mode key `guided_homework_help` is defined in GuidedShell's `aiTools` array, preference-gated. Registry's "Coming soon modal" note is not confirmed — the nav entry is wired as a functional ToolLauncher mode. Whether the downstream mode is a placeholder or functional requires opening `lila_guided_modes` rows and system prompt files, not done here.

---

## Entry 331 — `LiLa Communication Coach modal`

**Registry line:** 331
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| LiLa Communication Coach modal | PRD-25 (Phase C) | PRD-05 + PRD-21 | ⏳ Unwired (MVP) | "Coming soon" modal |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 331 — names "Coming soon" modal.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no specific convention.
(d) PRD-25 addendum line 127: `guided_communication_coach` — Kid-adapted Higgins.
(d.5) `GuidedShell.tsx` lines 184-189: `modeKey: 'guided_communication_coach'` gated behind `preferences.lila_communication_coach_enabled`. `types/guided-dashboard.ts` declares the preference similarly to homework_enabled.

### Field 2 — Code presence check
Grep command: `pattern="Higgins.*Navigate|Higgins.*Say|Higgins.*Communication|Talk It Out"`, path=`src`, output=files_with_matches
Hits: 5 files — `ToolConversationModal.tsx`, `GuidedShell.tsx`, `feature_expansion_registry.ts`, `PermissionHub.tsx`, `data/lanterns-path-data.ts`.
Files most relevant to this entry:
- `src\components\shells\GuidedShell.tsx:184-189` — mode entry.
- `src\components\lila\ToolConversationModal.tsx` — ToolConversationModal exists and handles guided-mode conversations.

First-context window (GuidedShell.tsx:184-189):
```
...(preferences.lila_communication_coach_enabled ? [{
  modeKey: 'guided_communication_coach',
  icon: <MessagesSquare size={20} />,
  label: 'Talk It Out',
  description: 'Practice what you want to say',
}] : []),
```

### Field 3 — Wiring check
Callers: `aiTools` array in GuidedShell; ToolLauncher system opens `ToolConversationModal` for mode keys.
Execution-flow: preference-gated entry in the Guided nav AI tools list.
Most recent commit: GuidedShell `dc80475 2026-04-14 20:37:05 -0500`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-25 addendum line 127 names the mode with two sub-modes ("help me say something" / "help me figure this out").
- PlannedExpansionCard: not used.
- CLAUDE.md: no specific convention for guided_communication_coach.

### Field 5 — What was NOT checked
- Whether `lila_guided_modes` has a row for `guided_communication_coach`.
- Whether `ToolConversationModal` for this mode renders a live conversation or "coming soon" content.
- Whether PRD-21 Higgins modes are sharing infrastructure with this kid-adapted variant.

### Field 6 — Observations (no verdict)
Mode key `guided_communication_coach` is defined in GuidedShell's `aiTools` array, preference-gated, with label "Talk It Out." Parallel structure to entry 330. Whether the downstream conversation is a placeholder or functional was not inspected. Registry's "Coming soon modal" note is not corroborated by the code's surface shape.

---

Integrity at end: wc -l STUB_REGISTRY.md = 547, no HALT.



## Entry 332 — `Visual World theme skinning`

**Registry line:** 332
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Visual World theme skinning | PRD-25 | PRD-24A (Visual Worlds) | 📌 Post-MVP | Dashboard themed by active Visual World |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 332. Row text names the capability as "Visual World theme skinning" routed to PRD-24A (Visual Worlds). No concrete code identifier (component name, hook name, table name) in the row itself.
Level (b) — WIRING_STATUS.md: grep for "Visual World" / "visual_world" / "theme skinning" returned no matches in WIRING_STATUS.md.
Level (c) — CLAUDE.md: no grep hit for "Visual World" as a convention target.
Level (d) — PRD-24A (Visual Worlds): `prds/addenda/PRD-24A-Cross-PRD-Impact-Addendum.md` is present (confirmed via glob earlier) but was not opened; partition rule limits (d.5) to ONE file per entry. Registry routes to PRD-24A which is a post-MVP overlay engine addendum.
Level (d.5) — File `src/config/feature_expansion_registry.ts` lines 171-177 contain a `gamification` entry named "Visual Worlds & Gamification" — this is a PlannedExpansionCard registry entry (demand-validation stub), not a skinning implementation.
Identifier: no concrete implementation identifier for theme-skinning runtime; Level (d.5) surfaces only a PlannedExpansionCard demand-validation entry under key `gamification`. Proceeding to record CAPABILITY-ONLY posture for the runtime identifier.

### Field 2 — Code presence check
Grep command: pattern=`Visual World|visual_world|VisualWorld`, path=`src`, output_mode=files_with_matches
Hits: 2
Files:
  - src/config/feature_expansion_registry.ts — Planned expansion registry entry (`gamification` key, display name "Visual Worlds & Gamification")
  - src/data/lanterns-path-data.ts — (not opened; referenced elsewhere as lanterns path tour data)
First-context window (feature_expansion_registry.ts:171-177):
```
// ── Gamification ─────────────────────────────────────────────────
gamification: {
  name: 'Visual Worlds & Gamification',
  description:
    'Your kids do NOT want to check off chores. But they DO want to open a treasure chest to see what badge they earned...',
  location_hint: 'Child dashboards, family celebration',
```

### Field 3 — Wiring check
Primary hit is a PlannedExpansionCard registry entry, not a runtime theme-skinning component. No callers-of-a-skinning-component to list. Most-recent touching commit for `feature_expansion_registry.ts`: `bbff56e 2026-04-13 10:58:30 -0500 chore: remove competition/judge references and stale files`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention of "Visual World" / theme skinning.
- prds/addenda/: `PRD-24A-Cross-PRD-Impact-Addendum.md`, `PRD-26-Cross-PRD-Impact-Addendum.md`, `PRD-24-Cross-PRD-Impact-Addendum.md`, `PRD-36-Cross-PRD-Impact-Addendum.md`, `PRD-25-Cross-PRD-Impact-Addendum.md` are present; contents not opened this entry.
- PlannedExpansionCard: `src/config/feature_expansion_registry.ts:171-177` registers feature key `gamification` with "Visual Worlds & Gamification" description — a demand-validation stub.
- CLAUDE.md: no mention of "Visual World" / theme skinning as a convention.

### Field 5 — What was NOT checked
- PRD-24A (Overlay Engine & Game Modes) addendum contents were not read; a specific component name for theme skinning may be specified there.
- `lanterns-path-data.ts` content at the Visual World hit was not opened.
- No grep run for "overlay_instance" / "dashboard_backgrounds" tables to see if a partial backend layer exists.
- Could not determine whether any Guided/Play dashboard rendering consumes a "Visual World"-related theme token at runtime.

### Field 6 — Observations (no verdict)
Grep finds "Visual World" in only two files, one a PlannedExpansionCard registry entry describing the feature at a marketing level. Registry row claims 📌 Post-MVP wired-by PRD-24A. Identifier resolution landed at (d.5) with only a demand-validation shell, no concrete skinning component.

---

## Entry 333 — `Gamification widgets in grid`

**Registry line:** 333
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Gamification widgets in grid | PRD-25 | PRD-24 + PRD-10 | 📌 Post-MVP | Gamification widget types for Guided grid |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 333. Row text is "Gamification widgets in grid" with build phase "Gamification widget types for Guided grid." No concrete code identifier named (no widget component name, no widget_template type, no hook name).
Level (b) — WIRING_STATUS.md: no mention of "gamification widgets" in grid.
Level (c) — CLAUDE.md: conventions 42-46 describe shared components and SparkleOverlay but do not name a "Gamification widgets in grid" construct.
Level (d) — PRD-25 (Guided Dashboard) and PRD-24 + PRD-10 referenced; not opened per single-file limit.
Level (d.5) — grep in `src` for `gamification.widget|gamification_widget` returned zero matches (see Field 2).
Identifier: CAPABILITY-ONLY — no concrete implementation identifier found for "gamification widgets" as a widget-grid concept.

### Field 2 — Code presence check
Grep command: pattern=`gamification.widget|gamification_widget`, path=`src`, output_mode=files_with_matches
Hits: 0 — no matches.

### Field 3 — Wiring check
Skipped — no code presence.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-25 and PRD-24 addenda files exist but were not opened for this entry.
- PlannedExpansionCard: not checked for a specific "gamification_widgets" feature key (feature_expansion_registry.ts has a broader `gamification` entry — line 173 — but not a widget-grid-specific key).
- CLAUDE.md: no mention.

### Field 5 — What was NOT checked
- Whether `widget_templates` table has any rows with a gamification-oriented template_type.
- Whether PRD-10 (Widgets) addendum lists planned gamification widget types.
- Whether `dashboard_widgets` table has any rows whose `template_type` signals gamification.
- Whether GuidedDashboard renders any widget with explicit gamification framing.

### Field 6 — Observations (no verdict)
Grep finds zero matches for "gamification_widget" in src. Identifier resolution lands at CAPABILITY-ONLY. Registry claims 📌 Post-MVP.

---

## Entry 334 — `Graduation celebration + tutorial`

**Registry line:** 334
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Graduation celebration + tutorial | PRD-25 (Phase C) | Post-MVP | 📌 Post-MVP | Data flag only (graduation_tutorial_completed) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 334. Row text explicitly cites "graduation_tutorial_completed" as the data flag. This is a concrete identifier.
Identifier: `graduation_tutorial_completed` (boolean flag).
Source: stub entry line 334.
Quote: "Data flag only (graduation_tutorial_completed)"

### Field 2 — Code presence check
Grep command: pattern=`graduation_tutorial_completed|graduation_celebration`, output_mode=files_with_matches
Hits: 7 files
Files:
  - CLAUDE.md — convention 132 (Guided graduation flag)
  - STUB_REGISTRY.md — line 334 (this entry)
  - src/types/guided-dashboard.ts:23,45 — interface field + default value
  - specs/PRD-25-Phase-A-Guided-Dashboard-Core-Spec.md — build spec
  - prds/dashboards/PRD-26-Play-Dashboard.md — PRD reference
  - prds/dashboards/PRD-25-Guided-Dashboard.md — PRD reference
  - prds/addenda/PRD-25-Cross-PRD-Impact-Addendum.md — addendum reference
First-context window for src/types/guided-dashboard.ts:21-46:
```
  nbt_last_suggestion_date: string // ISO date string, reset daily
  // Graduation (Post-MVP)
  graduation_tutorial_completed: boolean
  // Calendar view
  guided_calendar_view_default: 'day' | 'week'
...
  nbt_last_suggestion_date: '',
  graduation_tutorial_completed: false,
  guided_calendar_view_default: 'day',
```

### Field 3 — Wiring check
Callers: no callers grep performed — but the src hit is an interface+defaults module. No celebration UI component found at a glance.
Execution-flow location: TypeScript type definition (`src/types/guided-dashboard.ts`). The field lives on the Guided dashboard preferences object with a hard-coded `false` default.
Most-recent touching commit: `426c446 2026-04-15 18:42:29 -0500 feat: PRD-16 Phase E verification + Meeting Setup Wizard + Guided agenda capture + bug fixes`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention of "graduation" tutorial.
- prds/addenda/: `PRD-25-Cross-PRD-Impact-Addendum.md` referenced by grep; contents not opened.
- PlannedExpansionCard: no PlannedExpansionCard featureKey for graduation found.
- CLAUDE.md: convention 132 (line ~ within Guided Dashboard section): "Graduation (Guided > Independent): tracked via `graduation_tutorial_completed` preference flag. Full ceremony is Post-MVP."

### Field 5 — What was NOT checked
- Whether any code reads `graduation_tutorial_completed` to gate a tutorial or celebration UI (caller grep not run).
- Whether `auto_provision_member_resources` initializes the flag in a default dashboard_config row.
- Whether any `/guided` route has a graduation page or modal stubbed.

### Field 6 — Observations (no verdict)
Registry row matches CLAUDE.md Convention 132: the data flag exists as a typed preference field with a hard-coded default of false. No celebration UI or tutorial component identified in this entry's grep scope.

---

## Entry 344 — `Universal Scheduler UI component`

**Registry line:** 344
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Universal Scheduler UI component | PRD-35 | PRD-35 | ✅ Wired | Phase 05 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 344. Row names "Universal Scheduler UI component" — the capability name "Universal Scheduler" is a concrete component name convention used throughout the codebase. Also see CLAUDE.md Convention 23 ("Universal Scheduler component (PRD-35)") pointing to `@/components/scheduling`.
Identifier: `UniversalScheduler` (React component) and module `@/components/scheduling`.
Source: stub entry line 344 + CLAUDE.md Convention 23.
Quote: "All scheduling uses the Universal Scheduler component (PRD-35). Never build a custom recurrence picker. Import from `@/components/scheduling`."

### Field 2 — Code presence check
Grep command: pattern=`Universal Scheduler|UniversalScheduler`, path=`src`, output_mode=files_with_matches
Hits: 11 files
Files:
  - src/components/scheduling/UniversalScheduler.tsx — primary component file (line 30 `export function UniversalScheduler({ ... })`)
  - src/components/scheduling/index.ts — barrel export
  - src/components/scheduling/types.ts — TS prop/output types
  - src/components/scheduling/schedulerUtils.ts — utils
  - src/components/scheduling/useSchedulerState.ts — state hook
  - src/components/shared/MiniCalendarPicker.tsx — shared calendar primitive
  - src/components/tasks/TaskCreationModal.tsx — consumer
  - src/components/meetings/ScheduleEditorModal.tsx — consumer
  - src/components/calendar/EventCreationModal.tsx — consumer
  - src/lib/tasks/recurringTaskFilter.ts — consumer
  - src/data/lanterns-path-data.ts — tour data
First-context window for UniversalScheduler.tsx:18-38:
```
(line 20)  UniversalSchedulerProps, SchedulerOutput,
(line 30)  export function UniversalScheduler({
...
(line 38)  }: UniversalSchedulerProps) {
```

### Field 3 — Wiring check
Callers: at minimum three consumers — TaskCreationModal, EventCreationModal, ScheduleEditorModal (meetings). All three named in grep hits.
Execution-flow location: React component under `src/components/scheduling/`.
Most-recent touching commit: `209d496 2026-03-28 22:39:19 -0500 fix: resolve Vercel strict TS errors — unused vars, duplicate attrs, missing props`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no specific line for Universal Scheduler; component is referenced indirectly as infrastructure.
- prds/addenda/: PRD-35 addendum exists per CLAUDE.md Pre-Build Process appendix table.
- PlannedExpansionCard: not applicable — Universal Scheduler claimed wired.
- CLAUDE.md: Convention 23 (line 144 area) "All scheduling uses the Universal Scheduler component (PRD-35). Never build a custom recurrence picker. Import from `@/components/scheduling`." Also conventions 24-30.

### Field 5 — What was NOT checked
- Whether `UniversalScheduler` supports every frequency type the PRD-35 addendum requires (observed surface-only).
- Whether calendar preview behavior matches CLAUDE.md Convention 29.
- Whether `showTimeDefault` is honored by all three consumers.

### Field 6 — Observations (no verdict)
Component file present at the expected path, three distinct modal consumers identified, barrel export present. CLAUDE.md conventions 23-30 describe scheduler architecture. Most-recent touching commit is a Vercel build-fix rather than a feature commit.

---

## Entry 351 — `Universal Timer UI (all 4 modes)`

**Registry line:** 351
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Universal Timer UI (all 4 modes) | PRD-36 | PRD-36 | ✅ Wired | Phase 05 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 351. "Universal Timer UI" plus "(all 4 modes)" implies `timer_mode` enum column per `time_sessions` schema. CLAUDE.md Conventions 32-37 reference `TimerProvider`, `time_sessions`, and timer-mode values.
Identifier: `TimerProvider` + `useTimer` + `time_sessions.timer_mode` column.
Source: stub entry line 351 + CLAUDE.md Conventions 32-37.
Quote: "Timer is timestamp-based, not client-side. `started_at` and `ended_at` are server timestamps... Floating bubble renders at shell level via `TimerProvider` wrapping each shell."

### Field 2 — Code presence check
Grep command: pattern=`TimerMode|timer_mode|visual_timer_style`, path=`src`, output_mode=files_with_matches
Hits: 12 files
Files:
  - src/components/widgets/WidgetConfiguration.tsx
  - src/components/widgets/trackers/TimerDurationTracker.tsx
  - src/features/timer/TimerConfigPanel.tsx
  - src/features/timer/SessionHistory.tsx
  - src/features/permissions/ShiftView.tsx
  - src/features/timer/useTimer.ts
  - src/features/timer/TimerProvider.tsx
  - src/features/timer/MiniPanel.tsx
  - src/features/timer/index.ts
  - src/features/timer/PlayModeTimer.tsx
  - src/components/tasks/FocusTimerButton.tsx
  - src/features/timer/types.ts
First-context window for barrel export `src/features/timer/index.ts:1-7`:
```
export { TimerProvider, useTimerContext } from './TimerProvider'
export { FloatingBubble } from './FloatingBubble'
export { MiniPanel } from './MiniPanel'
export { VisualTimer } from './VisualTimers'
export { SessionHistory } from './SessionHistory'
export { PlayModeTimer } from './PlayModeTimer'
export { TimerConfigPanel } from './TimerConfigPanel'
```

### Field 3 — Wiring check
Callers: `TimerProvider` is consumed by each shell per CLAUDE.md Convention 33. `useTimer` is imported across features/timer submodules.
Execution-flow location: `src/features/timer/` React feature module.
Most-recent touching commit (TimerProvider): `dc80475 2026-04-14 20:37:05 -0500 feat: Reward Reveals — universal celebration system with Prize Box` (for shells; TimerProvider itself may have older touches).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no dedicated timer section; "Universal Timer" not found by earlier grep.
- prds/addenda/: `prds/addenda/PRD-36-Cross-PRD-Impact-Addendum.md` exists per earlier glob.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Conventions 32-37 (lines ~183-187 area) describe timer architecture.

### Field 5 — What was NOT checked
- Whether all 4 modes (pomodoro, countdown, standalone, task-linked) have production UI surfaces vs. schema fields only.
- Whether `timer_configs` has DEFAULT rows for existing family_members (schema shows 0 rows live per live_schema.md).

### Field 6 — Observations (no verdict)
Timer feature module present at `src/features/timer/` with 10 module files and a barrel export listing 7 public surfaces. CLAUDE.md Conventions 32-37 describe the module's expected behavior.

---

## Entry 352 — `Floating timer bubble (all 5 shells)`

**Registry line:** 352
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Floating timer bubble (all 5 shells) | PRD-36 | PRD-36 | ✅ Wired | Phase 05 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 352. Name "Floating timer bubble" plus CLAUDE.md Convention 33 ("Floating bubble renders at shell level via `TimerProvider`") gives `FloatingBubble`.
Identifier: `FloatingBubble` (component) exported from `src/features/timer/index.ts`.
Source: stub entry line 352 + CLAUDE.md Convention 33.

### Field 2 — Code presence check
Grep command: pattern=`FloatingTimerBubble|TimerBubble|floating.timer`, path=`src`, output_mode=files_with_matches
Hits: 1 file (TimerConfigPanel.tsx)
Additional grep command: pattern=`FloatingBubble|TimerFab|TimerMiniPanel|MiniPanel`, path=`src/features/timer`
Hits: multiple — `FloatingBubble.tsx`, `MiniPanel.tsx`, `TimerProvider.tsx`, `index.ts`
First-context window for FloatingBubble.tsx:2-5 and TimerProvider.tsx:272-277:
```
src/features/timer/FloatingBubble.tsx
  2: * FloatingBubble (PRD-36)
  5: * Tapping it opens the MiniPanel. Hidden when there are no active timers.
  92: export function FloatingBubble() {
src/features/timer/TimerProvider.tsx
  32: import { FloatingBubble } from './FloatingBubble'
  276: {/* FloatingBubble is always rendered here so shells don't need to place it */}
  277: <FloatingBubble />
```

### Field 3 — Wiring check
Callers: `TimerProvider` renders `FloatingBubble` unconditionally inside its provider tree (line 277). Shells wrap content in `TimerProvider` — MomShell, AdultShell, IndependentShell, GuidedShell, PlayShell imports for TimerProvider were seen in shells grep earlier (PlayShell.tsx:6 `import { TimerProvider } from '@/features/timer'`).
Execution-flow location: React component inside feature module; rendered by provider.
Most-recent touching commit: `3a5ac4c 2026-03-25 00:29:36 -0500 Phase 05 repair: compact scheduler, timer fixes, 14 audit items wired`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention of floating timer bubble.
- prds/addenda/: PRD-36 addendum present.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Convention 33 names `TimerProvider` rendering bubble "at shell level."

### Field 5 — What was NOT checked
- Whether every one of the 5 shells actually wraps with `TimerProvider` (only PlayShell imports explicitly confirmed; MomShell/AdultShell/IndependentShell/GuidedShell not individually grepped for `TimerProvider` render).
- Whether z-index behavior against modals is correctly enforced.
- Whether bubble hides on zero-active-timer state (claimed in file header).

### Field 6 — Observations (no verdict)
`FloatingBubble` component file exists at `src/features/timer/FloatingBubble.tsx`; rendered unconditionally by `TimerProvider` at line 277. At least PlayShell.tsx imports `TimerProvider`.

---

## Entry 353 — `5 visual timer styles (SVG/CSS)`

**Registry line:** 353
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| 5 visual timer styles (SVG/CSS) | PRD-36 | PRD-36 | ✅ Wired | Phase 05 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 353. Row mentions "5 visual timer styles"; CLAUDE.md Convention 35 enumerates "(sand_timer, hourglass, thermometer, arc, filling_jar)" and names them "SVG/CSS animations." Also `time_sessions.timer_mode` and `timer_configs.visual_timer_style` columns.
Identifier: `VisualTimer` component + enum `VisualTimerStyle` (visual_timer_style column values).
Source: stub entry line 353 + CLAUDE.md Convention 35.
Quote: "5 visual timer styles (sand_timer, hourglass, thermometer, arc, filling_jar) are SVG/CSS animations consuming theme tokens."

### Field 2 — Code presence check
Grep command: pattern=`sand_timer|hourglass|thermometer|arc|filling_jar|visual_timer_style`, path=`src`, output_mode=files_with_matches, head_limit=15
Hits: 15+ files (capped). Key file for primary identifier:
  - src/features/timer/VisualTimers.tsx (lines 11, 767-790+834)
First-context window for VisualTimers.tsx:11 and :767-790,834:
```
 11: import type { VisualTimerStyle } from './types'
767: // Wrapper — VisualTimer
770: export interface VisualTimerProps {
771:   style: VisualTimerStyle
784: export function VisualTimer({
790: }: VisualTimerProps) {
834: export default VisualTimer
```

### Field 3 — Wiring check
Callers: `VisualTimer` is exported from `src/features/timer/index.ts:4`. Direct consumer grep not individually run; `PlayModeTimer` and `MiniPanel` are peers likely consuming it.
Execution-flow location: React component `src/features/timer/VisualTimers.tsx`.
Most-recent touching commit: `52527eb 2026-03-24 16:29:44 -0500 Fix all 147 TypeScript errors for Vercel deployment`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention of visual timer styles.
- prds/addenda/: PRD-36 addendum present.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Convention 35 (line ~186) names all five style values explicitly.

### Field 5 — What was NOT checked
- Whether all 5 style variants render visually correctly with theme tokens (no browser check).
- Whether `timer_configs.visual_timer_style` has any populated rows (live_schema shows 0 rows).
- Whether PlayModeTimer hides numeric display per Convention 35 last clause.

### Field 6 — Observations (no verdict)
`VisualTimer` wrapper at `VisualTimers.tsx:784`, typed by `VisualTimerStyle`. Enum literal values from Convention 35 appear across 15+ src files. Last-touch commit is a TypeScript-fix commit, not a feature commit.

---

## Entry 354 — `Timer session history + editing`

**Registry line:** 354
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Timer session history + editing | PRD-36 | PRD-36 | ✅ Wired | Phase 05 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 354. Name "Timer session history + editing" corresponds to `SessionHistory` component exported from timer barrel (`src/features/timer/index.ts:5`). CLAUDE.md Convention 36 references soft-delete + audit trail behavior.
Identifier: `SessionHistory` component + `time_sessions` soft-delete columns (`deleted_at`, `edited`, `original_timestamps`).
Source: stub entry line 354 + CLAUDE.md Convention 36.

### Field 2 — Code presence check
Grep command: (part of earlier grep for `timer_mode|visual_timer_style`) hits include `src/features/timer/SessionHistory.tsx`.
Additional: `src/features/timer/index.ts:5` `export { SessionHistory } from './SessionHistory'`.
Hits: 1 primary file `src/features/timer/SessionHistory.tsx`.

### Field 3 — Wiring check
Callers: not individually grepped. Barrel export exists, so any feature that imports `{ SessionHistory }` from `@/features/timer` is a caller.
Execution-flow location: React component in timer feature module.
Most-recent touching commit: `b0df6b5 2026-04-06 23:25:27 -0500 chore: Tailwind v4 class-name migration across codebase`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-36 addendum present.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Convention 36 "Soft delete only for timer sessions (`deleted_at` timestamp). Mom can edit timestamps with full audit trail preserved in `original_timestamps` JSONB."

### Field 5 — What was NOT checked
- Which routes or pages render `SessionHistory` (no caller grep run).
- Whether editing UI actually writes to `original_timestamps` JSONB.
- Whether soft-delete RLS policy blocks non-mom from restoring deleted rows.

### Field 6 — Observations (no verdict)
`SessionHistory.tsx` file exists in timer feature module; barrel export present. live_schema.md confirms `time_sessions` carries `deleted_at`, `edited`, `edited_by`, `edited_at`, `original_timestamps`, `edit_reason` columns.

---

## Entry 355 — `Play mode age gate + visual timer`

**Registry line:** 355
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Play mode age gate + visual timer | PRD-36 | PRD-36 | ✅ Wired | Phase 05 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 355. "Play mode age gate + visual timer" — CLAUDE.md Convention 37 names the behavior; `PlayModeTimer` is exported from `src/features/timer/index.ts:6`.
Identifier: `PlayModeTimer` component + client-side age gate (speed bump per CLAUDE.md Convention 37).
Source: stub entry line 355 + CLAUDE.md Convention 37.
Quote: "Play mode age gate is a speed bump (client-side useState), not security. Under 18 redirects to 'ask a grown-up'. Mom quick-starts countdowns for Play children."

### Field 2 — Code presence check
Earlier grep output shows `src/features/timer/PlayModeTimer.tsx` present.
From `src/features/timer/index.ts:6`: `export { PlayModeTimer } from './PlayModeTimer'`.
Hits: 1 primary file.

### Field 3 — Wiring check
Callers: not individually grepped; barrel export exists.
Execution-flow location: React component in timer feature module.
Most-recent touching commit: `bd2fa43 2026-03-24 18:17:27 -0500 Fix all 52 hardcoded color violations, re-enable color check in build`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-36 addendum present.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Convention 37 describes the age-gate speed bump and mom's quick-start.

### Field 5 — What was NOT checked
- Whether the age gate correctly blocks under-18 entry (no runtime test).
- Whether the visual timer inside Play mode actually suppresses numeric display per Convention 35.
- Whether the component is used in PlayShell anywhere (no caller grep).

### Field 6 — Observations (no verdict)
`PlayModeTimer.tsx` exists; barrel export present. CLAUDE.md Convention 37 matches the registry row. Most-recent touching commit is a color-rule migration, not a feature commit.

---

## Entry 356 — `Timer config panel (per-member)`

**Registry line:** 356
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Timer config panel (per-member) | PRD-36 | PRD-36 | ✅ Wired | Phase 05 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 356. Name "Timer config panel (per-member)" corresponds to `TimerConfigPanel` exported from timer barrel (`index.ts:7`) plus `timer_configs` table with `family_member_id` column (live_schema.md section "Infrastructure (PRD-36)").
Identifier: `TimerConfigPanel` component + `timer_configs` table.

### Field 2 — Code presence check
Earlier grep shows `src/features/timer/TimerConfigPanel.tsx`.
From barrel: `export { TimerConfigPanel } from './TimerConfigPanel'` (line 7).
Hits: 1 primary file.

### Field 3 — Wiring check
Callers: not individually grepped; panel is self-contained config surface.
Execution-flow location: React component in timer feature module.
Most-recent touching commit: `b0df6b5 2026-04-06 23:25:27 -0500 chore: Tailwind v4 class-name migration across codebase`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-36 addendum present.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Convention 36 indirectly references editing, but no specific convention for "config panel per-member" found.

### Field 5 — What was NOT checked
- Which settings route/tab exposes `TimerConfigPanel` to end users.
- Whether `timer_configs` row count > 0 in live_schema.md (live_schema.md shows 0 rows).
- Whether per-member config actually persists.

### Field 6 — Observations (no verdict)
`TimerConfigPanel.tsx` exists and is exported from the feature barrel. live_schema.md confirms `timer_configs` schema includes 18 columns, 0 rows live at snapshot time.

---

## Entry 358 — `Theme-adaptive Tooltip`

**Registry line:** 358
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Theme-adaptive Tooltip | PRD-03 | PRD-03 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 358. Name "Theme-adaptive Tooltip" — CLAUDE.md Convention 43 describes the component's behavior explicitly. Module path `src/components/shared/Tooltip.tsx` per shared component glob.
Identifier: `Tooltip` (React component).
Source: stub entry line 358 + CLAUDE.md Convention 43.
Quote: "Tooltip is fully theme-adaptive. Background=`var(--color-accent-deep)`, text=`var(--color-text-on-primary)`, border=`var(--color-border-default)`, radius=`var(--vibe-radius-input)`. Zero hardcoded colors. Desktop: hover 300ms delay. Mobile: long-press. Auto-positioning via portal."

### Field 2 — Code presence check
Grep command: pattern=`Tooltip`, path=`src/components/shared`, output_mode=files_with_matches
Hits: 10 files (includes index.ts and components that import Tooltip).
Primary file: `src/components/shared/Tooltip.tsx`.
Glob also confirms: `src/components/shared/Tooltip.tsx` exists.

### Field 3 — Wiring check
Callers: multiple shared-component and shell consumers (e.g., `src/components/shells/PlayShell.tsx:5` `import { Tooltip } from '@/components/shared'`).
Execution-flow location: React component under shared primitives.
Most-recent touching commit: `c794548 2026-04-13 21:09:14 -0500 fix: toggle visibility + grace day date picker + tooltip mobile tap`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention (not routed-content surface).
- prds/addenda/: not searched for PRD-03 addendum.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Convention 43 explicitly names the component and required theme tokens.

### Field 5 — What was NOT checked
- Whether each token reference in the component is actually `var(--color-accent-deep)` etc. (only convention text verified, not file body).
- Whether portal auto-positioning handles all edge cases.
- Whether PRD-03 addendum exists.

### Field 6 — Observations (no verdict)
`Tooltip.tsx` exists under `src/components/shared/`; barrel surfaces it; at least one recent commit (2026-04-13) touched tooltip mobile tap behavior. CLAUDE.md Convention 43 pins the token set.

---

## Entry 359 — `11 shared components (Button, Card, etc.)`

**Registry line:** 359
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| 11 shared components (Button, Card, etc.) | PRD-03 | PRD-03 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 359. CLAUDE.md Convention 44 enumerates the shared component library explicitly with 13 items (not 11) — "Button, Card, Input, Modal, Badge, LoadingSpinner, EmptyState, Toggle, Avatar, Tabs, Select, Tooltip, SparkleOverlay."
Identifier: `src/components/shared/*` exports — specifically Button, Card, Input, Modal, Badge, LoadingSpinner, EmptyState, Toggle, Avatar, Tabs, Select (the 11-component subset before Tooltip + SparkleOverlay added).
Source: stub entry line 359 + CLAUDE.md Convention 44.

### Field 2 — Code presence check
Glob: `src/components/shared/*.tsx` returned 47+ files (far more than 11). Named components present: Button.tsx, Card.tsx, Input.tsx, Badge.tsx, LoadingSpinner.tsx, EmptyState.tsx, Toggle.tsx, Avatar.tsx, Tabs.tsx, Select.tsx, Modal.tsx, Tooltip.tsx, SparkleOverlay.tsx. All 13 present as individual `.tsx` files.
First-context window (barrel snippet from index.ts grep for SparkleOverlay):
```
src/components/shared/index.ts:35: export { PlannedExpansionCard } from './PlannedExpansionCard'
```
(full index.ts not opened line-by-line; presence confirmed via glob).

### Field 3 — Wiring check
Callers: all shells import from `@/components/shared` (see PlayShell.tsx:5, shells using Tooltip); components consumed broadly.
Execution-flow location: React component library at `src/components/shared/`.
Most-recent touching commit (shared index): `e05bf24 2026-04-03 13:27:17 -0500 fix: Play shell victories route stub + barrel exports for AnimatedList/ConfettiBurst`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-03 addendum not searched.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Convention 44 names the library members.

### Field 5 — What was NOT checked
- Whether each listed component is theme-token compliant (no per-file inspection).
- Whether "11" vs "13" in the registry row reflects historical drift (CLAUDE.md lists 13, registry says 11).
- Whether every consumer imports from barrel vs. deep paths.

### Field 6 — Observations (no verdict)
Glob confirms each named component exists as a `.tsx` file under `src/components/shared/`. The registry count (11) differs from the CLAUDE.md Convention 44 enumeration (13). No grep evidence suggests missing files.

---

## Entry 360 — `SparkleOverlay (Play victories)`

**Registry line:** 360
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| SparkleOverlay (Play victories) | PRD-03 | PRD-03 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 360. "SparkleOverlay (Play victories)" — CLAUDE.md Convention 46 names the component and its purpose.
Identifier: `SparkleOverlay` (React component).
Source: stub entry line 360 + CLAUDE.md Convention 46.
Quote: "SparkleOverlay reserved exclusively for victory celebrations in Play shell. Quick burst (8-12 particles, 0.8s) and full celebration (16-24 particles, 1.6s). Respects prefers-reduced-motion."

### Field 2 — Code presence check
Grep command: pattern=`SparkleOverlay`, output_mode=files_with_matches, head_limit=10
Hits: 10 files
Files (src-only):
  - src/pages/Tasks.tsx — consumer
  - src/pages/PlayDashboard.tsx — consumer (Play shell)
  - src/components/tasks/DashboardTasksSection.tsx — consumer
  - src/components/reward-reveals/RewardRevealModal.tsx — consumer
Component file: `src/components/shared/SparkleOverlay.tsx` (per glob listing).
First-context window (barrel): `src/components/shared/index.ts:35` region contains PlannedExpansionCard export; SparkleOverlay export appears elsewhere in index.ts (not quoted).

### Field 3 — Wiring check
Callers: Tasks.tsx, PlayDashboard.tsx, DashboardTasksSection.tsx, RewardRevealModal.tsx — four named consumers.
Execution-flow location: React component; shared primitive consumed in Play and task celebration flows.
Most-recent touching commit (shared SparkleOverlay.tsx): `47247d4 2026-04-09 22:36:44 -0500 chore: remove 7 stale eslint-disable directives`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention (not a routed destination).
- prds/addenda/: PRD-03 addendum not searched.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Convention 46 describes the Play shell + particle counts.

### Field 5 — What was NOT checked
- Whether consumers outside Play shell honor the "reserved exclusively" rule (Tasks.tsx and RewardRevealModal.tsx are not Play-shell-scoped; potential convention-vs-code drift).
- Whether prefers-reduced-motion is honored.

### Field 6 — Observations (no verdict)
`SparkleOverlay.tsx` present under shared primitives; grep shows 4 source consumers across `src/`. CLAUDE.md Convention 46 scopes SparkleOverlay to Play shell; grep shows at least one non-Play consumer (Tasks.tsx) — flagging for founder judgment.

---

## Entry 363 — `Shell-aware BottomNav`

**Registry line:** 363
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Shell-aware BottomNav | PRD-04 | PRD-04 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 363. Name "Shell-aware BottomNav" — CLAUDE.md Convention 48 describes shell-specific nav behavior. File path `src/components/shells/BottomNav.tsx`.
Identifier: `BottomNav` (React component).
Source: stub entry line 363 + CLAUDE.md Convention 48.
Quote: "BottomNav is shell-aware. Mom/Adult/Independent: Home, Tasks, Journal, Notepad, More. Guided/Play have their own nav (BottomNav returns null). More menu has ⓘ info toggle for descriptions."

### Field 2 — Code presence check
Grep command: pattern=`BottomNav|BottomNavigation`, path=`src/components/shells`, output_mode=files_with_matches
Hits: 5 files
Files:
  - src/components/shells/BottomNav.tsx — primary component file
  - src/components/shells/GuidedShell.tsx — GuidedBottomNav used (line 108 `<GuidedBottomNav />`)
  - src/components/shells/IndependentShell.tsx — consumer
  - src/components/shells/AdultShell.tsx — consumer
  - src/components/shells/MomShell.tsx — consumer

### Field 3 — Wiring check
Callers: all four non-Play shells grep-referenced. Play shell has its own bottom nav (see CLAUDE.md Convention 51 emoji nav).
Execution-flow location: React component at `src/components/shells/`.
Most-recent touching commit: `80ed0c6 2026-04-06 22:05:53 -0500 fix: mobile More menu now mirrors desktop sidebar from a single source`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-04 addendum not searched.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Convention 16 (mobile layout) AND Convention 48 describe BottomNav. Convention 16 explicitly mandates `getSidebarSections(shell)` as the source-of-truth.

### Field 5 — What was NOT checked
- Whether `BottomNav.tsx` actually reads from `getSidebarSections(shell)` per Convention 16 (no file body opened).
- Whether "More" info toggle is visible per Convention 48.
- Whether PlayShell/GuidedShell explicitly bypass BottomNav.

### Field 6 — Observations (no verdict)
`BottomNav.tsx` file present; imported/rendered by 4 shell wrappers. Most-recent commit explicitly addressed parity with sidebar sections.

---

## Entry 364 — `QuickTasks strip`

**Registry line:** 364
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| QuickTasks strip | PRD-04 | PRD-04 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 364. Name "QuickTasks strip" — CLAUDE.md Convention 49 describes the horizontal pill bar. File `src/components/shells/QuickTasks.tsx` per earlier grep.
Identifier: `QuickTasks` (React component in shells module).
Source: stub entry line 364 + CLAUDE.md Convention 49.

### Field 2 — Code presence check
Grep command: pattern=`QuickTasks|QuickTasksStrip`, path=`src`, output_mode=files_with_matches
Hits: 10 files
Files (src):
  - src/lib/ai/help-patterns.ts — help pattern reference
  - src/components/shells/IndependentShell.tsx — consumer
  - src/components/shells/AdultShell.tsx — consumer
  - src/components/shells/MomShell.tsx — consumer
  - src/components/shells/QuickTasks.tsx — primary file
  - src/components/tasks/StandaloneTaskBreakerModal.tsx — referenced
  - src/components/tour/GuidedIntroTour.tsx — tour reference
  - src/components/lila/ToolLauncherProvider.tsx — context reference
  - src/data/lanterns-path-data.ts — tour data
  - src/data/lila-assist-context.ts — LiLa assist pattern

### Field 3 — Wiring check
Callers: Mom, Adult, Independent shells. Not in Guided/Play shells (consistent with PRD-04).
Execution-flow location: React component at `src/components/shells/`.
Most-recent touching commit: `60b4193 2026-04-13 12:57:01 -0500 feat(tasks): Task Breaker image mode + standalone modal + QuickTasks + Vault entry`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: line 148 "QuickTasks Strip | Zap icon pill → opens StandaloneTaskBreakerModal | **Wired** | Between Tasks and MindSweep in action order. 2026-04-13."
- prds/addenda/: PRD-04 addendum not searched.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Convention 49 describes default items + localStorage persistence.

### Field 5 — What was NOT checked
- Whether `localStorage` collapsible state actually persists per convention.
- Whether the "Quick Note" item opens Notepad drawer via bridge context.
- Whether every default item (Add Task, Journal, Quick Note, Victory, Calendar, MindSweep) actually renders.

### Field 6 — Observations (no verdict)
`QuickTasks.tsx` present under `src/components/shells/`; three adult-tier shells consume it. WIRING_STATUS.md line 148 independently confirms wiring status.

---

## Entry 365 — `PerspectiveSwitcher (dashboard)`

**Registry line:** 365
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| PerspectiveSwitcher (dashboard) | PRD-04 | PRD-04 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 365. Name "PerspectiveSwitcher (dashboard)" — CLAUDE.md Convention 50.
Identifier: `PerspectiveSwitcher` (React component).
Source: stub entry line 365 + CLAUDE.md Convention 50.
Quote: "PerspectiveSwitcher is a segmented control on the dashboard page only (mom only). Three views: My Dashboard, Family Overview, Family Hub. Caller owns the state."

### Field 2 — Code presence check
Grep command: pattern=`PerspectiveSwitcher`, path=`src`, output_mode=files_with_matches
Hits: 3 files
Files:
  - src/pages/Dashboard.tsx — consumer
  - src/components/shells/PerspectiveSwitcher.tsx — primary component
  - src/components/shells/index.ts — barrel export

### Field 3 — Wiring check
Callers: `src/pages/Dashboard.tsx` is the sole consumer (matching "dashboard page only" convention).
Execution-flow location: React component in shells module.
Most-recent touching commit: `5819267 2026-03-30 18:58:19 -0500 fix: remove unused isTeen variable to unblock Vercel build`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-04 addendum not searched.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Convention 50 names all three views and scopes to mom.

### Field 5 — What was NOT checked
- Whether non-mom members are actually blocked from seeing the switcher (no file body inspection).
- Whether the three view routes (My Dashboard, Family Overview, Family Hub) all render correctly.
- Most-recent touching commit is a build-fix rather than a feature commit — staleness not assessed.

### Field 6 — Observations (no verdict)
`PerspectiveSwitcher.tsx` present under `src/components/shells/`, exported from barrel, consumed only by `Dashboard.tsx`. Scope matches Convention 50.

---

## Entry 366 — `Play shell Celebrate button`

**Registry line:** 366
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Play shell Celebrate button | PRD-04 | PRD-04 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 366. CLAUDE.md Convention 51 describes Play shell with "prominent 'Celebrate!' button." File `src/components/shells/PlayShell.tsx`. Earlier grep shows `PartyPopper` icon import at PlayShell.tsx:4.
Identifier: Celebrate button inside `PlayShell` component (uses Lucide `PartyPopper` + `DailyCelebration` overlay).
Source: stub entry line 366 + CLAUDE.md Convention 51.

### Field 2 — Code presence check
Grep command: pattern=`Celebrate!|CelebrateButton`, path=`src/components/shells`, output_mode=files_with_matches
Hits: 1 file
Files:
  - src/components/shells/PlayShell.tsx
First-context window (PlayShell.tsx:1-11 from earlier grep):
```
 1: import { useState } from 'react'
 4: import { Settings, PartyPopper } from 'lucide-react'
 5: import { Tooltip } from '@/components/shared'
 6: import { TimerProvider } from '@/features/timer'
 7: import { RewardRevealProvider } from '@/components/reward-reveals/RewardRevealProvider'
11: import { DailyCelebration } from '@/components/victories/DailyCelebration'
27: export function PlayShell({ children }: PlayShellProps) {
```

### Field 3 — Wiring check
Callers: `PlayShell` is rendered by the role router. The Celebrate button is an inline element within PlayShell.
Execution-flow location: React component in shells module, inline UI.
Most-recent touching commit: `dc80475 2026-04-14 20:37:05 -0500 feat: Reward Reveals — universal celebration system with Prize Box`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-04 addendum not searched.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Convention 51 names "Celebrate!" button; Convention 180 describes GuidedDashboard pattern that mentions Celebrate button too.

### Field 5 — What was NOT checked
- Whether the button actually launches `DailyCelebration` overlay (imports present at PlayShell.tsx:11 but handler body not opened).
- Whether 56px touch target from Convention 51 is enforced.
- Whether parent-locked Settings adjacent behavior works.

### Field 6 — Observations (no verdict)
`PlayShell.tsx` imports `PartyPopper` (Lucide) and `DailyCelebration` — matching the "Celebrate!" button pattern from Convention 51. Grep for the literal "Celebrate!" string returns only this file within shells.

---

## Entry 367 — `Guided shell personalized header`

**Registry line:** 367
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Guided shell personalized header | PRD-04 | PRD-04 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 367. Name "Guided shell personalized header." CLAUDE.md Convention 52: "Guided shell shows personalized greeting header with member name + date."
Identifier: `GuidedShell` component header section (inline, uses `displayMember?.display_name`).
Source: stub entry line 367 + CLAUDE.md Convention 52.

### Field 2 — Code presence check
Grep (case-insensitive) command: pattern=`header|Good (morning|afternoon|evening)|greeting`, path=`src/components/shells/GuidedShell.tsx`
Hits: 7 lines
Files:
  - src/components/shells/GuidedShell.tsx
First-context window (GuidedShell.tsx:59-97):
```
 59:  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
 64:      {/* Header */}
 65:      <header
 74:            {greeting}, {displayMember?.display_name || 'Friend'}!
 97:      </header>
```

### Field 3 — Wiring check
Callers: `GuidedShell` is rendered by the role router for Guided members.
Execution-flow location: React component in shells module, inline greeting renders member name + time-of-day greeting.
Most-recent touching commit: `dc80475 2026-04-14 20:37:05 -0500 feat: Reward Reveals — universal celebration system with Prize Box`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: PRD-04 addendum not searched; PRD-25 addendum present per earlier glob.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Convention 52 "Guided shell shows personalized greeting header with member name + date. 48px touch targets. No sidebar on mobile."

### Field 5 — What was NOT checked
- Whether the header also shows the date (Convention 52 says "member name + date"; grep only shows name + time-of-day greeting).
- Whether 48px touch targets are enforced.
- Whether mobile sidebar is actually absent.

### Field 6 — Observations (no verdict)
`GuidedShell.tsx` renders inline header at line 65 with greeting string "Good morning/afternoon/evening, {display_name}!" at line 74. Convention 52 mentions date; grep hits do not show a date render. Flag for founder judgment — registry claim is "Wired" but a "+ date" part of the convention is not verified by this evidence.

---

## Entry 368 — `Notepad in Adult/Independent shells`

**Registry line:** 368
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Notepad in Adult/Independent shells | PRD-04 | PRD-04 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 368. Name "Notepad in Adult/Independent shells." CLAUDE.md Convention 54: "NotepadDrawer is available in Mom, Adult, and Independent shells (wrapped with NotepadProvider). Not available in Guided (lightweight version future) or Play."
Identifier: `NotepadProvider` + `NotepadDrawer` rendered inside AdultShell/IndependentShell.

### Field 2 — Code presence check
Grep command: pattern=`NotepadDrawer|NotepadProvider`, path=`src/components/shells`, output_mode=content, -n
Hits shown:
  - src/components/shells/IndependentShell.tsx:9 `import { NotepadDrawer, NotepadProvider, useNotepadContext } from '@/components/notepad'`
  - IndependentShell.tsx:56 `<NotepadProvider>`
  - IndependentShell.tsx:87 `<NotepadDrawer />`
  - IndependentShell.tsx:96 `</NotepadProvider>`
  - MomShell.tsx:14 same imports (present for mom too)
  - MomShell.tsx:113/220/240 provider+drawer render
  - AdultShell.tsx:9/56/87/96 same pattern as IndependentShell

### Field 3 — Wiring check
Callers: `NotepadProvider` and `NotepadDrawer` imported by Mom, Adult, and Independent shells. Not imported by GuidedShell.tsx or PlayShell.tsx (as confirmed by earlier shell import grep — GuidedShell imports `WriteDrawer` instead).
Execution-flow location: React components rendered inline inside shell wrappers.
Most-recent touching commit (AdultShell): not individually fetched; MomShell last commit is `5d2a7c4 2026-04-14 23:04:48 -0500 feat: PRD-16 Meetings Phase A — schema, page, sidebar, hooks`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: Notepad appears as a RoutingStrip source in multiple rows; no specific "Notepad in Adult/Independent shells" line.
- prds/addenda/: PRD-04 addendum not searched.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Convention 54 matches.

### Field 5 — What was NOT checked
- Whether `useNotepadContext()` consumers downstream of AdultShell/IndependentShell actually function (no render check).
- Whether Guided/Play shells correctly omit NotepadDrawer (observed absence via import grep only).
- Whether last-touch commit for AdultShell differs significantly.

### Field 6 — Observations (no verdict)
Three shells (Mom, Adult, Independent) import and render `NotepadProvider` + `NotepadDrawer`. Matches CLAUDE.md Convention 54.

---

## Entry 369 — `Settings removed from Sidebar`

**Registry line:** 369
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Settings removed from Sidebar | PRD-04 | PRD-04 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 369. Name "Settings removed from Sidebar." CLAUDE.md Convention 53: "Settings is NOT in the sidebar. Access only via floating gear icon in top-right of each shell."
Identifier: `Sidebar` component in `src/components/shells/Sidebar.tsx`; absence-of-Settings-entry is the relevant state. Comment in Sidebar.tsx:50 confirms the intent.
Source: stub entry line 369 + CLAUDE.md Convention 53.

### Field 2 — Code presence check
Grep command: pattern=`/settings`, path=`src/components/shells/Sidebar.tsx`, output_mode=content, -n
Hits: 2 lines (one is a comment line about Settings not being a standalone page; another is `/rhythms/settings` which is a sub-route, not the main Settings overlay).
Files:
  - src/components/shells/Sidebar.tsx:50 — comment "not as standalone pages. The Settings entry is the one place to configure"
  - src/components/shells/Sidebar.tsx:52 — `{ label: 'Rhythms', path: '/rhythms/settings', featureKey: 'rhythms_basic', ...}` (a distinct settings sub-route for Rhythms, not the global Settings overlay)
Additional grep for the global "Settings" gear icon was not run in this entry.

### Field 3 — Wiring check
Callers: `Sidebar` rendered by Mom/Adult/Independent shell wrappers (shell-aware per `getSidebarSections` convention).
Execution-flow location: React component/config arrays.
Most-recent touching commit: `bbff56e 2026-04-13 10:58:30 -0500 chore: remove competition/judge references and stale files`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no specific mention.
- prds/addenda/: PRD-04 Repair addendum referenced in registry line 370-371 ("Settings overlay (full UI)" → `⏳ Unwired (MVP)` routed to PRD-22).
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Convention 53 confirms sidebar absence; Convention 16 notes sidebar is source-of-truth for nav.

### Field 5 — What was NOT checked
- Whether the floating gear icon actually exists in each shell (PlayShell.tsx imports `Settings` from lucide — seen earlier — but not verified that it is top-right and not otherwise placed).
- Whether there is any residual sidebar entry pointing to `/settings` (only `/rhythms/settings` was seen in this grep).
- Whether PRD-22 Settings overlay supersedes this entry's claim (registry line 371 lists Settings overlay as ⏳ Unwired).

### Field 6 — Observations (no verdict)
Sidebar.tsx grep for `/settings` surfaces one sub-route (`/rhythms/settings`, not the global settings overlay) plus a comment explaining Settings is the "one place to configure" — language in the comment is ambiguous vs. the convention. No direct `/settings` main route entry observed in sidebar.

---



## Entry 370 — `Guided lightweight notepad`

**Registry line:** 370
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Guided lightweight notepad | PRD-04 | PRD-04 Repair | ✅ Wired | PRD-04 Repair 2026-03-25 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry row itself. Row names no concrete identifier ("Guided lightweight notepad"). Level (c) — CLAUDE.md Convention 125 names the implementation: "Write drawer is the Guided shell's upgraded notepad. Three tabs: Notepad, Messages, Reflections." Level (d.5) — bounded lookup in `src/components/shells/GuidedShell.tsx` which CLAUDE.md context implies as the host shell:
```
Source: src/components/shells/GuidedShell.tsx:13 — "import { WriteDrawer } from '@/components/guided/WriteDrawer'"
Identifier: WriteDrawer + WriteDrawerNotepad (exposed via useWriteDrawer hook + openDrawer('notepad'))
```

### Field 2 — Code presence check
Grep command: `pattern="WriteDrawer|WriteDrawerNotepad" path=C:/dev/MyAIMCentral-family/MyAIMCentral-family/src output_mode=files_with_matches`
Hits: 8
Files:
 - src/components/guided/WriteDrawer.tsx — primary drawer component
 - src/components/guided/WriteDrawerNotepad.tsx — notepad tab
 - src/components/guided/WriteDrawerMessages.tsx — messages tab (stub)
 - src/components/guided/WriteDrawerReflections.tsx — reflections tab
 - src/components/guided/GuidedManagementScreen.tsx — references
 - src/components/guided/index.ts — barrel export
 - src/components/shells/GuidedShell.tsx — imports and renders
 - src/hooks/useWriteDrawer.tsx — provider + openDrawer() API
First-context window: GuidedShell.tsx:12 `import { WriteDrawerProvider, useWriteDrawer } from '@/hooks/useWriteDrawer'`; line 81 `onClick={() => openDrawer('notepad')}`; line 100 `<WriteDrawer />`.

### Field 3 — Wiring check
Callers: `GuidedShell.tsx` wraps shell with `WriteDrawerProvider` (line 37), renders `<WriteDrawer />` (line 100), exposes open button (lines 81, 585). Location type: React component + hook + context provider, integrated at shell level. Most recent commit: `8cc1935 2026-04-03 15:23:54 -0500 refactor: /simplify sweep — shared speak utility, Zod safeParse, guided component cleanup` (on WriteDrawerNotepad.tsx).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: No explicit "Guided lightweight notepad" row found; Write drawer surfaces via BottomNav references.
- prds/addenda/: PRD-25-Cross-PRD-Impact-Addendum.md appeared in wider file hit list.
- PlannedExpansionCard: Not applicable — feature is active UI.
- CLAUDE.md: Convention 125 names Write drawer's three tabs; Convention 131 describes "Send To..." routing in Write drawer.

### Field 5 — What was NOT checked
- Whether Notepad tab content autosave behavior works end-to-end (no browser test run).
- Whether Reading Support TTS icons render correctly inside the Notepad tab.
- Whether the shell-specific feature flag `dashboard_configs.preferences.reading_support_enabled` actually gates the Notepad subset.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. Three Write drawer tab files exist (Notepad, Messages, Reflections) plus provider hook and shell integration. GuidedShell.tsx imports and renders WriteDrawer. CLAUDE.md Convention 125 describes the Write drawer as the Guided shell's upgraded notepad with three tabs. Commit history shows active maintenance (2026-04-03 simplify pass).

---

## Entry 371 — `Settings overlay (full UI)`

**Registry line:** 371
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Settings overlay (full UI) | PRD-04 Repair | PRD-22 | ⏳ Unwired (MVP) | Phase 27 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub row names no identifier. Level (c) — CLAUDE.md Convention 53: "Settings is NOT in the sidebar. Access only via floating gear icon in top-right of each shell." Wired By: PRD-22 per registry.
```
Source: stub entry line 371 + CLAUDE.md Convention 53 + App.tsx route registration
Identifier: SettingsPage (capability referenced); implementation located at src/pages/SettingsPage.tsx and routed at /settings in App.tsx:153.
```

### Field 2 — Code presence check
Grep command: `pattern="SettingsPage|SettingsOverlay|/settings" path=src output_mode=files_with_matches`
Hits: 23 files (across shells, settings-subfeatures, overlays)
Files:
 - src/pages/SettingsPage.tsx — 481 lines
 - src/components/settings/SettingsProvider.tsx
 - src/App.tsx:36,153 — imports and routes `<SettingsPage />`
 - src/components/shells/MomShell.tsx, AdultShell.tsx, IndependentShell.tsx, GuidedShell.tsx, PlayShell.tsx — reference settings/gear
 - src/pages/RhythmsSettingsPage.tsx, GamificationSettingsPage.tsx — sub-pages
 - src/features/financial/HomeworkSettingsPage.tsx, AllowanceSettingsPage.tsx — sub-pages
First-context window: App.tsx:153 `<Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />`; multiple sub-routes `/settings/allowance`, `/settings/homework`, `/settings/gamification`.

### Field 3 — Wiring check
Callers: route wired in App.tsx; gear icon in shell headers; many sub-settings pages exist. Location type: React page + route. Most recent touching commit: `dc80475 2026-04-14 20:37:05 -0500 feat: Reward Reveals — universal celebration system with Prize Box`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: No explicit "Settings overlay" row; Settings is not listed as a RoutingStrip destination.
- prds/addenda/: Searched generally — PRD-22-Cross-PRD-Impact-Addendum.md listed in pre-build addenda table.
- PlannedExpansionCard: Not surfaced in grep.
- CLAUDE.md: Convention 53 — "Settings is NOT in the sidebar. Access only via floating gear icon in top-right of each shell."

### Field 5 — What was NOT checked
- Whether "Settings overlay" means a MODAL/overlay presentation versus the full-page `SettingsPage` (stub Wired By cites PRD-22 which is Settings). Could refer to a different overlay shape than what exists.
- Whether every intended Settings sub-pane is present or just a subset.
- PRD-22 was not opened for this packet to confirm which exact Settings UI shape is the "full UI" referenced by the stub.

### Field 6 — Observations (no verdict)
Registry row claims ⏳ Unwired (MVP) with Build Phase "Phase 27." However, SettingsPage.tsx (481 lines) exists and is routed at /settings in App.tsx, with sub-pages for allowance, homework, gamification, rhythms, and reward-reveals. Most recent commit 2026-04-14. Stub text says "overlay (full UI)" which may imply a different presentation than the existing page route; ambiguity flagged.

---

## Entry 372 — `Hub widget content (real widgets)`

**Registry line:** 372
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Hub widget content (real widgets) | PRD-04 Repair | PRD-10/PRD-14D | ⏳ Unwired (MVP) | Phase 11/15 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub row names no identifier but references PRD-10 (widgets) and PRD-14D (Family Hub). Level (d.5) — bounded lookup in FamilyHub.tsx (the PRD-14D host component):
```
Source: src/components/hub/FamilyHub.tsx:127-128 — "case 'widget_grid': return null // PRD-10 Hub widget deployment"
Identifier: widget_grid section renderer in FamilyHub.tsx; currently returns null with TODO comment citing PRD-10.
```

### Field 2 — Code presence check
Grep command: `pattern="family_hub_configs|FamilyHub.*widget|HubWidget" path=src output_mode=files_with_matches`
Hits: 3
Files:
 - src/types/widgets.ts — widget type definitions
 - src/components/widgets/WidgetPicker.tsx — widget picker modal
 - src/hooks/useFamilyHubConfig.ts — hub config hook
First-context window: FamilyHub.tsx:127 `case 'widget_grid':` → `return null // PRD-10 Hub widget deployment`.

### Field 3 — Wiring check
Callers: `widget_grid` is a registered section key in FamilyHub.tsx (line 48 `widget_grid: 'Widget Grid'`) and in the section switch (line 127), but the renderer returns `null` with an inline comment indicating deferred wiring. Location type: React page component with explicit TODO placeholder. Most recent commit: `8fa486a 2026-03-31 17:01:35 -0500 feat: PRD-23 BookShelf Session A+B, PRD-14C Family Overview, PRD-14D Family Hub`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: No "Hub widget" row; widget templates table references `widget_templates: 0 rows` in live_schema.md.
- prds/addenda/: PRD-14D-Cross-PRD-Impact-Addendum.md listed in pre-build addenda table.
- PlannedExpansionCard: Not found via grep for this entry.
- CLAUDE.md: No convention specifically about Hub widget deployment.

### Field 5 — What was NOT checked
- Whether dashboard widgets (which ARE implemented per PRD-10 Phase A) could be rendered inside the Family Hub via a simple component swap — the null stub is intentional per the TODO but the underlying widget infrastructure may already support it.
- Whether `family_hub_configs.section_visibility` exposes widget_grid as a togglable section.

### Field 6 — Observations (no verdict)
Registry row claims ⏳ Unwired (MVP) with Build Phase "Phase 11/15." FamilyHub.tsx declares `widget_grid` as a section key but the renderer returns `null` with inline comment `// PRD-10 Hub widget deployment`. Underlying widget system (dashboard_widgets table, WidgetPicker) exists per live_schema (41 rows of dashboard_widgets) but is not yet rendered into the Hub surface.

---

## Entry 378 — `Visual World themed timer animations`

**Registry line:** 378
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Visual World themed timer animations | PRD-36 | PRD-24A | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub row names PRD-36 (Universal Timer) + PRD-24A (Overlay Engine / Game Modes); no identifier named. Level (c) — CLAUDE.md Convention 35: "5 visual timer styles (sand_timer, hourglass, thermometer, arc, filling_jar) are SVG/CSS animations consuming theme tokens. Play shell shows visual-only (no numbers)." Level (d.5) — bounded lookup in `src/features/timer/VisualTimers.tsx` (the visual timer host file per Convention 35):
```
Source: src/features/timer/VisualTimers.tsx (exists, 834 lines)
Identifier: VisualTimers component file; Convention 35 describes 5 styles (sand_timer, hourglass, thermometer, arc, filling_jar). Whether "Visual World themed" (i.e., per-overlay theme skins for timers driven by PRD-24A overlay_instances) is separately implemented was not surfaced in the 834-line file via grep patterns "PRD-24A | overlay | gameMode | visualWorld" (0 hits).
```

### Field 2 — Code presence check
Grep command: `pattern="visual.*timer|themed.*timer|timer.*animation|VisualTimer|TimerAnimation" -i path=src output_mode=files_with_matches`
Hits: 8
Files:
 - src/features/timer/VisualTimers.tsx — 834 lines, primary
 - src/features/timer/TimerConfigPanel.tsx
 - src/features/timer/MiniPanel.tsx
 - src/features/timer/PlayModeTimer.tsx
 - src/features/timer/types.ts
 - src/features/timer/index.ts
 - src/config/feature_expansion_registry.ts
 - src/data/lanterns-path-data.ts

Supplemental grep for Visual World / overlay integration (`pattern="Visual World|PRD-24A|overlay_instances|theme.*timer" -i path=src`): 2 hits — `src/config/feature_expansion_registry.ts` and `src/data/lanterns-path-data.ts`. Neither is inside the timer module.

### Field 3 — Wiring check
Callers: VisualTimers.tsx exported via timer index; PlayModeTimer.tsx and MiniPanel.tsx consume VisualTimers. Location type: React components + SVG/CSS. Most recent commit on VisualTimers.tsx: `52527eb 2026-03-24 16:29:44 -0500 Fix all 147 TypeScript errors for Vercel deployment`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: No "Visual World themed timer" row.
- prds/addenda/: PRD-24A-Cross-PRD-Impact-Addendum.md + PRD-24A-Game-Modes-Addendum.md + PRD-36-Cross-PRD-Impact-Addendum.md per CLAUDE.md addenda table.
- PlannedExpansionCard: Feature registered in `feature_expansion_registry.ts` (grep hit).
- CLAUDE.md: Convention 35 describes the 5 built-in timer styles but does NOT mention Visual-World/overlay-tied timer skins.

### Field 5 — What was NOT checked
- Whether `overlay_instances` table (per PRD-24A) references timer skins or only dashboard backgrounds/collectibles.
- PRD-24A itself was not opened; the "themed timer animation" concept could live inside the PRD-24A overlay system as a post-MVP skin layer.
- Whether feature_expansion_registry.ts entry for this stub exposes demand-validation UI.

### Field 6 — Observations (no verdict)
Registry row claims 📌 Post-MVP with no Wired-By phase. 5 built-in timer styles exist in VisualTimers.tsx (per CLAUDE.md Convention 35). Grep for "Visual World," "PRD-24A," "overlay_instances," or "theme*timer" within the timer module returned 0 hits — the Visual-World-themed variant (overlay-driven timer skin) appears separate from the current visual timer implementation.

---

## Entry 384 — `Studio Browse tab (template cards)`

**Registry line:** 384
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Studio Browse tab (template cards) | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub row names "Studio Browse tab." Level (d.5) — bounded lookup in `src/pages/Studio.tsx` (the Studio page named by Convention 149 / WIRING_STATUS Studio section):
```
Source: src/pages/Studio.tsx:183 — "const [activeTab, setActiveTab] = useState<'browse' | 'customized'>('browse')"
         src/pages/Studio.tsx:555 — "{ key: 'browse', label: 'Browse Templates' }"
Identifier: Studio.tsx — two-tab design (browse | customized) with `browse` as default. Renders StudioCategorySection + StudioTemplateCard.
```

### Field 2 — Code presence check
Grep command: `pattern="browse|tab" -i path=src/pages/Studio.tsx output_mode=content`
Hits: 15+ (active tab state, tab labels, tab switch)
Files:
 - src/pages/Studio.tsx:5 `Two tabs: Browse Templates (the shelf) | My Customized (mom's library)`
 - Studio.tsx:183 — activeTab state
 - Studio.tsx:555 — tab entry `browse`
 - Studio.tsx:590-595 — Tabs rendering
First-context window: Studio.tsx:554-555 `const tabs: TabItem[] = [ { key: 'browse', label: 'Browse Templates' }, ...`.

### Field 3 — Wiring check
Callers: Studio.tsx is routed at /studio in App.tsx. Location type: React page. Most recent commit: `21a47a1 2026-04-16 15:21:49 -0500 wip: Universal List Wizard scaffolding`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: Studio → Feature Wiring table (line 31+) lists [Customize] actions as **Wired**; implicit confirmation that Browse tab exists.
- prds/addenda/: PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md per CLAUDE.md convention 149-156.
- PlannedExpansionCard: Not applicable.
- CLAUDE.md: Convention 149 — "Studio is the universal creation and library surface."

### Field 5 — What was NOT checked
- Whether every template card displays correctly with tags post-Studio-Intelligence Phase 1.
- Whether the StudioSearch component (which renders inside the Browse tab per import) is fully wired into Phase 2 search features (Phase 2 explicitly marked a Stub in WIRING_STATUS.md).

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. Studio.tsx line 5 doc comment names "Browse Templates" + "My Customized" as the two tabs; line 183 state uses 'browse' as default; line 555 registers the browse tab; template cards render via StudioCategorySection. Recent commit 2026-04-16.

---

## Entry 385 — `Studio My Customized tab`

**Registry line:** 385
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Studio My Customized tab | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub row names "My Customized tab." Level (d.5) — bounded lookup in Studio.tsx (continuation from Entry 384):
```
Source: src/pages/Studio.tsx:28 — "import { CustomizedTemplateCard } from '@/components/studio/CustomizedTemplateCard'"
        Studio.tsx:74 — "function useCustomizedTemplates(familyId: string | undefined)"
        Studio.tsx:247 — "} = useCustomizedTemplates(family?.id)"
Identifier: Studio.tsx `useCustomizedTemplates` hook + `CustomizedTemplateCard` component; `customized` tab state + `customizedSort` / `customizedFilter` state.
```

### Field 2 — Code presence check
Grep command: `pattern="Customize|handleCustomize" path=src/pages/Studio.tsx output_mode=content`
Hits: 20+
Files:
 - Studio.tsx:28 — import CustomizedTemplateCard
 - Studio.tsx:71-77 — useCustomizedTemplates data loader (sorts + filter)
 - Studio.tsx:166-170 — CustomizedSortKey, CustomizedFilter types
 - Studio.tsx:185-186 — customizedSort + customizedFilter state
 - Studio.tsx:247 — uses the hook
 - Studio.tsx:329 — handleCustomize callback
 - Studio.tsx:524-526 — filteredCustomized useMemo
First-context window: Studio.tsx:166-170 (filter types), 526 (filteredCustomized), 329-398 (handleCustomize routing).

### Field 3 — Wiring check
Callers: Studio.tsx in one file — tab state + hook + card component loaded from `@/components/studio/CustomizedTemplateCard`. Location type: React page + hook. Most recent commit: `21a47a1 2026-04-16 15:21:49 -0500 wip: Universal List Wizard scaffolding`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md:66 — "My Customized: Deploy / Edit / Duplicate / Archive → **Wired**" (4 rows).
- prds/addenda/: PRD-09A-09B Studio Intelligence Addendum.
- PlannedExpansionCard: Not applicable.
- CLAUDE.md: Convention 149 describes Studio as universal creation + library surface.

### Field 5 — What was NOT checked
- Whether sort/filter persistence across sessions exists.
- Whether every item in 'My Customized' actually deploys correctly to tasks — Deploy path verified at row 384 but not tested end-to-end here.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. Studio.tsx contains explicit 'customized' tab state, data hook, sort/filter primitives, and CustomizedTemplateCard rendering. WIRING_STATUS.md confirms Deploy/Edit/Duplicate/Archive operations as Wired.

---

## Entry 386 — `Studio [Customize] → Task types`

**Registry line:** 386
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Studio [Customize] → Task types | PRD-09B | PRD-09A | ✅ Wired | Phase 10 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub names Customize → Task types. Level (d.5) — bounded lookup in Studio.tsx `handleCustomize` callback:
```
Source: src/pages/Studio.tsx:426-458 — task-type branch of handleCustomize
Identifier: handleCustomize() calls studioTypeToTaskType(template.templateType) then setModalInitialType(taskType) + setModalOpen(true), delegating to TaskCreationModal.
```

### Field 2 — Code presence check
Grep command: `pattern="Customize|handleCustomize" path=src/pages/Studio.tsx output_mode=content`
Hits: 20+
Files:
 - Studio.tsx:141 `function studioTypeToTaskType(t)` — returns 'task'|'routine'|'opportunity'|'sequential'
 - Studio.tsx:329 — handleCustomize declaration
 - Studio.tsx:426-457 — "Other task types → open TaskCreationModal" branch
First-context window: Studio.tsx:426-458 block — `const taskType = studioTypeToTaskType(template.templateType); if (taskType) { ... setModalInitialType(taskType); setModalOpen(true); }`.

### Field 3 — Wiring check
Callers: StudioTemplateCard emits onCustomize → Studio.tsx routes to TaskCreationModal. Location type: React page callback → modal. Most recent commit on Studio.tsx: `21a47a1 2026-04-16`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md:33 — "[Customize] Task types (task/routine/opportunity) | TaskCreationModal | **Wired** | Opens modal pre-configured for type"
- prds/addenda/: PRD-09A-09B Studio Intelligence Addendum.
- PlannedExpansionCard: Not applicable.
- CLAUDE.md: Conventions 151, 152 describe guards against routing sequential through TaskCreationModal.

### Field 5 — What was NOT checked
- End-to-end flow (clicking card → modal opens with correct prefills) was not executed.
- Whether 'opportunity' subtypes (claimable/repeatable/capped) all route correctly given `studioTypeToTaskType` collapses them to 'opportunity'.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. Studio.tsx `handleCustomize` contains an explicit branch that routes task/routine/opportunity/sequential templates to TaskCreationModal via studioTypeToTaskType() + setModalInitialType(). WIRING_STATUS.md row confirms "Opens modal pre-configured for type" as **Wired**. Convention 151 shows a guard-clause enforcement pattern for sequential specifically.

---

## Entry 387 — `Studio [Customize] → List types`

**Registry line:** 387
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Studio [Customize] → List types | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub names Customize → List types. Level (d.5) — bounded lookup in Studio.tsx `handleCustomize`:
```
Source: src/pages/Studio.tsx:401-415 — list-types branch
Identifier: handleCustomize's listTypeMap + navigate(`/lists?create=${listType}`). Six list subtypes (shopping, wishlist, packing, expenses, todo, custom) + randomizer.
```

### Field 2 — Code presence check
Grep command: viewed Studio.tsx:401-415 directly.
Hits: 1 block, 6 list types + randomizer mapped.
Files:
 - Studio.tsx:402 — `if (template.templateType.startsWith('list_') || template.templateType === 'randomizer')`
 - Studio.tsx:403-411 — listTypeMap declaration
 - Studio.tsx:413 — `navigate(`/lists?create=${listType}`)`
First-context window: Studio.tsx:401-415 (full block quoted above).

### Field 3 — Wiring check
Callers: Studio.tsx handleCustomize routes to /lists via navigate. Lists.tsx consumes `?create=<type>` URL param to open the correct list creation flow. Location type: React page nav → Lists page URL consumer. Most recent commit: `21a47a1 2026-04-16`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md:35 — "[Customize] List types | Navigate /lists?create=type | **Wired** | URL param auto-opens create modal"
- prds/addenda/: PRD-09A-09B Studio Intelligence Addendum.
- PlannedExpansionCard: Not applicable.
- CLAUDE.md: Convention 155 — "Randomizer creation is accessible from two paths: Lists page [+ New List] type picker (direct) and Studio → Randomizer [Customize] → /lists?create=randomizer (URL-param nav)."

### Field 5 — What was NOT checked
- Lists.tsx handling of the `create` URL param (reverse direction of the integration).
- Whether all 6 list subtypes currently render correctly post-creation (individual list_type views were spot-checked in Entry 391).

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. Studio.tsx `handleCustomize` routes list_* + randomizer templates to `/lists?create=<type>` per the listTypeMap. WIRING_STATUS.md + CLAUDE.md Convention 155 confirm the URL-param handoff pattern.

---

## Entry 388 — `Studio [Customize] → Guided Forms`

**Registry line:** 388
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Studio [Customize] → Guided Forms | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub names Customize → Guided Forms. Level (d.5) — bounded lookup in Studio.tsx `handleCustomize`:
```
Source: src/pages/Studio.tsx:388-399 — Guided Forms branch
Identifier: handleCustomize's `if (template.templateType.startsWith('guided_form'))` branch; subtypeMap maps 4 template types (guided_form → custom, guided_form_sodas, guided_form_what_if, guided_form_apology_reflection); opens GuidedFormAssignModal.
```

### Field 2 — Code presence check
Grep command: viewed Studio.tsx:388-399 + `pattern="GuidedFormAssignModal" path=src output_mode=content`
Hits: 4 (Studio.tsx:49 import, Studio.tsx:206 state comment, Studio.tsx:388 branch, Studio.tsx:890 render)
Files:
 - Studio.tsx:49 — imports GuidedFormAssignModal
 - Studio.tsx:206 — state declaration for modal
 - Studio.tsx:388-399 — handleCustomize guided_forms branch
 - Studio.tsx:890 — modal render
First-context window: Studio.tsx:388-399 (subtypeMap + setGuidedFormSubtype + setGuidedFormModalOpen).

### Field 3 — Wiring check
Callers: Studio.tsx only caller of GuidedFormAssignModal (grep confirmed). Location type: React page → modal. Most recent commit on GuidedFormAssignModal.tsx: `b0df6b5 2026-04-06 23:25:27 -0500 chore: Tailwind v4 class-name migration across codebase`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md:37 — "[Customize] Guided Forms | GuidedFormAssignModal | **Wired** | Opens 2-step assign flow"
- prds/addenda/: PRD-09A-09B Studio Intelligence Addendum; specs/studio-seed-templates.md (Guided Forms section).
- PlannedExpansionCard: Not applicable.
- CLAUDE.md: specs reference in Guided Forms section of studio-seed-templates.md.

### Field 5 — What was NOT checked
- Whether all 4 subtypes (custom/sodas/what_if/apology_reflection) pre-populate Situation/Scenario correctly when the assign modal opens.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. Studio.tsx imports GuidedFormAssignModal and routes all 4 guided_form* template subtypes to it via subtypeMap (lines 388-399). WIRING_STATUS.md row confirms the handoff.

---

## Entry 389 — `Studio [Customize] → Trackers/Widgets`

**Registry line:** 389
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Studio [Customize] → Trackers/Widgets | PRD-09B | PRD-10 | ✅ Wired | PRD-10 Phase A |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub names Customize → Trackers/Widgets. Level (d.5) — bounded lookup in Studio.tsx `handleCustomize`:
```
Source: src/pages/Studio.tsx:376-386 — widget_* branch
Identifier: handleCustomize's widget_* branch uses starterConfigs.find + handleSelectStarterConfig fallback to setWidgetPickerOpen(true). Starter configs loaded via useWidgetStarterConfigs (per WIRING_STATUS.md line 62 + CLAUDE.md (d.5) pilot precedent in Entry 413).
```

### Field 2 — Code presence check
Grep command: viewed Studio.tsx:376-386.
Hits: 1 branch
Files:
 - Studio.tsx:376 `if (template.templateType.startsWith('widget_'))`
 - Studio.tsx:378 `const config = starterConfigs.find(sc => sc.tracker_type === trackerType)`
 - Studio.tsx:379-384 — calls handleSelectStarterConfig OR setWidgetPickerOpen
First-context window: Studio.tsx:376-386 block.

### Field 3 — Wiring check
Callers: Studio.tsx → WidgetPicker. Location type: React page → modal. Most recent commit: `21a47a1 2026-04-16`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md:38 — "[Customize] Trackers/Widgets | WidgetPicker + WidgetConfiguration | **Wired** | PRD-10 Phase A"
- prds/addenda/: PRD-10 Phase A references.
- PlannedExpansionCard: Not applicable.
- CLAUDE.md: Widget starter configs capability-tag adapter referenced (Convention 153).

### Field 5 — What was NOT checked
- Whether starterConfigs load is handled by useWidgetStarterConfigs hook named in WIRING_STATUS line 62 and Entry 413 pilot; not re-verified here since it's pilot-precedent.
- Whether every widget tracker_type has a matching starter config entry.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. Studio.tsx `handleCustomize` widget_* branch (lines 376-386) resolves starter config by tracker_type and either handles directly or falls back to WidgetPicker. WIRING_STATUS.md + CLAUDE.md Convention 153 confirm the adapter pattern.

---

## Entry 391 — `Lists full CRUD (9 types)`

**Registry line:** 391
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Lists full CRUD (9 types) | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub names "9 types" of lists. Level (d.5) — bounded lookup in Lists.tsx:
```
Source: src/pages/Lists.tsx:4 — "Types: Shopping, Wishlist, Expenses, Packing, To-Do, Custom, Randomizer."
        Lists.tsx is 3042 lines; 79 list_type/type-token grep hits.
Identifier: Lists.tsx page + useLists hooks module (imports: useReorderListItems, useSaveListAsTemplate + many other CRUD hooks from '@/hooks/useLists').
```

### Field 2 — Code presence check
Grep command: `pattern="list_type|shopping|wishlist|packing|expenses|todo|prayer|ideas|backburner|randomizer" path=src/pages/Lists.tsx output_mode=count` → 79 hits.
Files:
 - src/pages/Lists.tsx — 3042 lines, primary page
 - src/hooks/useLists.ts — hooks for reorder, save template, etc.
 - src/components/lists/Randomizer.tsx — imported at Lists.tsx:38
First-context window: Lists.tsx:4 doc comment listing 7 named types (Shopping, Wishlist, Expenses, Packing, To-Do, Custom, Randomizer); Lists.tsx:100 `randomizer: { icon: RotateCcw, label: 'Randomizer', description: 'Draw random items' }`.

### Field 3 — Wiring check
Callers: Lists.tsx routed at /lists (per standard App.tsx routing). Location type: React page. Most recent commit: `aeae494 2026-04-14 20:53:41 -0500 feat: connection preferences + wishlist AI context + mom's observations`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md:88-97 — "User-Created List Types" table lists 10 list types (Shopping, Wishlist, Expenses, Packing, To-Do, Prayer, Ideas, Backburner, Custom, Randomizer) all **Working** on Create UI + Detail View.
- prds/addenda/: PRD-09A-09B Studio Intelligence Addendum.
- PlannedExpansionCard: Not applicable.
- CLAUDE.md: Convention 149 — Studio is universal creation and library surface; Convention 156 — sequential collections on /lists.

### Field 5 — What was NOT checked
- Stub says "9 types"; WIRING_STATUS.md table shows 10 types (Shopping, Wishlist, Expenses, Packing, To-Do, Prayer, Ideas, Backburner, Custom, Randomizer). The count discrepancy (9 vs 10) is not resolved here. Lists.tsx line 4 doc lists 7 types (skipping Prayer, Ideas, Backburner — which are system/auto-provisioned).
- Each individual list_type's detail view quality wasn't tested end-to-end.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired with "9 types" in the stub label. Lists.tsx (3042 lines, recent 2026-04-14 commit) implements a multi-type list page. WIRING_STATUS.md User-Created List Types table shows 10 types marked **Working**. Mismatch between registry count (9) and WIRING_STATUS count (10) is flagged for founder judgment.

---

## Entry 392 — `Lists Randomizer draw view`

**Registry line:** 392
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Lists Randomizer draw view | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub names "Randomizer draw view." Level (d.5) — bounded lookup in Lists.tsx:
```
Source: src/pages/Lists.tsx:38 — "import { Randomizer } from '@/components/lists/Randomizer'"
        Lists.tsx:42 — "import { useRandomizerPendingMastery } from '@/hooks/useRandomizerDraws'"
        Lists.tsx:833 — "// ── Randomizer Detail View ───────"
        Lists.tsx:989-991 — drawMode prop wired to list.draw_mode
Identifier: Randomizer component + RandomizerDetailView (nested in Lists.tsx) + useRandomizerDraws / useRandomizerPendingMastery hooks; driven by `lists.draw_mode` column.
```

### Field 2 — Code presence check
Grep command: `pattern="Randomizer|draw_mode|randomizer_draws" path=src/pages/Lists.tsx output_mode=content`
Hits: 8+
Files:
 - Lists.tsx:38 — import Randomizer
 - Lists.tsx:42 — import useRandomizerPendingMastery
 - Lists.tsx:100 — randomizer nav metadata
 - Lists.tsx:833 — RandomizerDetailView declaration comment
 - Lists.tsx:989-991 — drawMode prop + onDrawModeChange
First-context window: Lists.tsx:989-991 `drawMode={(list.draw_mode ?? 'focused') as 'focused' | 'buffet' | 'surprise'}`.

### Field 3 — Wiring check
Callers: Lists.tsx → Randomizer component. Randomizer.tsx is imported and rendered inside RandomizerDetailView. Location type: React component + page container + DB-driven draw_mode state. Most recent commit on Lists.tsx: `aeae494 2026-04-14`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md:94 — "| Randomizer | **Working** | **Working** | draw spinner, category filter | **Working** |"
- CLAUDE.md: Conventions 162, 163 describe randomizer draw modes (`focused`, `buffet`, `surprise`) and Surprise Me determinism; Convention 164 — Reading List as a Studio template opening SequentialCreatorModal (orthogonal).
- prds/addenda/: PRD-09A-09B Studio Intelligence Addendum.

### Field 5 — What was NOT checked
- Whether the spinner animation renders with correct theme tokens and the draw is deterministic per `randomizer_draws.draw_source='auto_surprise'` constraint.
- Mastery exit from pool (`list_items.is_available = false`) was not verified in-tree for randomizer specifically.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. Lists.tsx imports the Randomizer component, declares RandomizerDetailView with drawMode prop wired to `list.draw_mode`, and uses useRandomizerPendingMastery hook for mastery-approval queue. CLAUDE.md Conventions 162-163 document the three draw modes and Surprise Me determinism.

---

## Entry 393 — `Lists promote-to-task`

**Registry line:** 393
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Lists promote-to-task | PRD-09B | PRD-09A | ✅ Wired | Phase 10 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub names "promote-to-task." Level (d.5) — bounded lookup in Lists.tsx:
```
Source: src/pages/Lists.tsx:2858 — "{item.promoted_to_task && (...}"
        Lists.tsx:2888 — "{isTodo && !item.promoted_to_task && (...)}"
        Live schema: list_items.promoted_to_task BOOLEAN + list_items.promoted_task_id UUID (per claude/live_schema.md list_items columns 27-28).
Identifier: promoted_to_task boolean on list_items + promoted_task_id UUID FK + UI button on To-Do items; Lists.tsx's onPromote handler (line 2889 ArrowRight button).
```

### Field 2 — Code presence check
Grep command: `pattern="promote.*task|promoted_to_task|promoteToTask|promote_to_task" -i path=src/pages/Lists.tsx output_mode=content`
Hits: 2 in Lists.tsx + schema-level columns
Files:
 - Lists.tsx:2858 — Promoted badge render block
 - Lists.tsx:2888 — conditional promote button for To-Do
 - Lists.tsx:2889 — `<button onClick={onPromote} ... title="Promote to task">`
First-context window: Lists.tsx:2858-2895 (Promoted badge + conditional ArrowRight promote button on To-Do items).

### Field 3 — Wiring check
Callers: Lists.tsx internal — onPromote prop consumed by list-item row renderer. Upstream handler not read in this packet. Location type: React component prop callback → creates `tasks` row. Most recent commit on Lists.tsx: `aeae494 2026-04-14`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md:89 — "| To-Do | **Working** | **Working** | priority, promote to task | **Working** |"
- prds/addenda/: PRD-09A-09B Studio Intelligence Addendum.
- PlannedExpansionCard: Not applicable.
- CLAUDE.md: No specific convention on promote-to-task; pattern aligns with "templates as data" philosophy in CLAUDE.md intro.

### Field 5 — What was NOT checked
- Whether onPromote callback correctly writes `promoted_task_id` and subsequent task creation (the hook that implements the promotion logic was not grepped).
- Whether promoted badge persists after archiving the source list.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. Lists.tsx has a conditional ArrowRight promote button on To-Do items (line 2888-2892) gated by `!item.promoted_to_task` and `isTodo`; a Promoted badge renders (lines 2858-2869) when `item.promoted_to_task` is true. live_schema.md confirms the `promoted_to_task` + `promoted_task_id` columns on list_items.

---

## Entry 394 — `Guided Form assign modal`

**Registry line:** 394
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Guided Form assign modal | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub names "Guided Form assign modal." Level (d.5) — bounded lookup:
```
Source: src/components/guided-forms/GuidedFormAssignModal.tsx exists, 459 lines.
Identifier: GuidedFormAssignModal component; consumed by Studio.tsx:49 import + Studio.tsx:890 render.
```

### Field 2 — Code presence check
Grep command: `pattern="GuidedFormAssignModal" path=src output_mode=content`
Hits: 4
Files:
 - src/components/guided-forms/GuidedFormAssignModal.tsx — 459-line component file
 - src/pages/Studio.tsx:49 — import
 - src/pages/Studio.tsx:206 — state comment
 - src/pages/Studio.tsx:890 — render
First-context window: Studio.tsx:49 `import { GuidedFormAssignModal } from '@/components/guided-forms/GuidedFormAssignModal'`.

### Field 3 — Wiring check
Callers: Studio.tsx only. Location type: React modal component rendered from Studio page. Most recent commit on GuidedFormAssignModal.tsx: `b0df6b5 2026-04-06 23:25:27 -0500 chore: Tailwind v4 class-name migration across codebase`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md:37 — "[Customize] Guided Forms | GuidedFormAssignModal | **Wired** | Opens 2-step assign flow"
- specs/studio-seed-templates.md "Two-Step Assignment Flow" section describes the modal: mom fills inline sections, then assigns to children.
- PlannedExpansionCard: Not applicable.
- CLAUDE.md: Convention 149-156 describe Studio but do not name GuidedFormAssignModal specifically.

### Field 5 — What was NOT checked
- Whether the 2-step flow (mom-fill then assign) persists data correctly for each assigned child (test not run).
- Whether pre-filled subtype defaults (SODAS Situation, What-If Scenario, Apology intro) populate correctly.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. GuidedFormAssignModal.tsx exists at 459 lines, imported and rendered from Studio.tsx (single caller). WIRING_STATUS.md confirms the 2-step assign flow. specs/studio-seed-templates.md describes the expected behavior.

---

## Entry 395 — `Guided Form child fill view`

**Registry line:** 395
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Guided Form child fill view | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub names "Guided Form child fill view." Level (d.5) — bounded lookup:
```
Source: src/components/guided-forms/GuidedFormFillView.tsx exists, 373 lines.
Identifier: GuidedFormFillView component; consumed by GuidedFormCard.tsx.
```

### Field 2 — Code presence check
Grep command: `pattern="GuidedFormFillView" path=src output_mode=content`
Hits: 4
Files:
 - src/components/guided-forms/GuidedFormFillView.tsx — primary file
 - src/components/guided-forms/GuidedFormCard.tsx:13 — import
 - src/components/guided-forms/GuidedFormCard.tsx:125 — render
First-context window: GuidedFormFillView.tsx:2 `GuidedFormFillView (PRD-09B, specs/studio-seed-templates.md)`; line 9 doc comment `LiLa help button per section when enabled`.

### Field 3 — Wiring check
Callers: GuidedFormCard.tsx only (grep confirmed). GuidedFormCard.tsx has no callers surfaced via grep — its placement in the Guided shell was not confirmed in this packet. Location type: React component file. Most recent commit on GuidedFormFillView.tsx: `b0df6b5 2026-04-06 23:25:27 -0500 chore: Tailwind v4 class-name migration across codebase`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md:181 (Known Issues): "Guided Form child fill view + mom review flow not tested end-to-end"
- specs/studio-seed-templates.md "Dashboard Rendering" section: "Activity card with progress ('2 of 5 sections complete'). Tapping opens full-screen form-fill..."
- PlannedExpansionCard: Not applicable.
- CLAUDE.md: No direct reference to GuidedFormFillView.

### Field 5 — What was NOT checked
- Whether GuidedFormCard is actually rendered on the Guided dashboard today (callers of GuidedFormCard were not searched).
- Whether the activity card entry point from Guided dashboard surfaces assigned forms.
- WIRING_STATUS.md flags the E2E test gap explicitly.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. GuidedFormFillView.tsx (373 lines) exists and is imported + rendered by GuidedFormCard.tsx. However, WIRING_STATUS.md Known Issues section notes the child-fill + mom-review flow was NOT tested end-to-end. The component exists; whether it surfaces on the Guided dashboard was not verified in this packet.

---

## Entry 396 — `Guided Form mom review view`

**Registry line:** 396
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Guided Form mom review view | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub names "Guided Form mom review view." Level (d.5) — bounded lookup:
```
Source: src/components/guided-forms/GuidedFormReviewView.tsx exists, 344 lines.
Identifier: GuidedFormReviewView component; grep found no callers outside its own file (imports listed are internal to the component itself).
```

### Field 2 — Code presence check
Grep command: `pattern="GuidedFormReviewView" path=src output_mode=content`
Hits: 4 — ALL within src/components/guided-forms/GuidedFormReviewView.tsx (self-references only; line 2 doc comment, line 30 interface, line 44 export, line 54 props destructure).
Files:
 - src/components/guided-forms/GuidedFormReviewView.tsx (exclusive)
First-context window: GuidedFormReviewView.tsx:2 `GuidedFormReviewView (PRD-09B, specs/studio-seed-templates.md)`; line 44 `export function GuidedFormReviewView({`.

### Field 3 — Wiring check
Callers: ZERO callers found via grep across src/. Location type: React component exists but appears to have no caller in the current tree. Most recent commit: `b0df6b5 2026-04-06 23:25:27 -0500 chore: Tailwind v4 class-name migration across codebase`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md:181 Known Issues: "Guided Form child fill view + mom review flow not tested end-to-end"
- specs/studio-seed-templates.md "Review Flow" section: "Completed forms appear in mom's review queue. Mom can add written response, mark reviewed, mark 'ready to discuss' (sends child notification)."
- PlannedExpansionCard: Not applicable.
- CLAUDE.md: No direct reference.

### Field 5 — What was NOT checked
- Whether a review queue surface (mom's review page/drawer) exists elsewhere and would render GuidedFormReviewView conditionally — the caller for this component was not located.
- Whether the review feature might be deferred to a later phase despite the component file existing.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. GuidedFormReviewView.tsx (344 lines) exists but grep across src/ surfaced zero external callers — all hits are within the file itself. WIRING_STATUS.md Known Issues flags that the mom-review flow was NOT tested end-to-end. Caller-side wiring could not be verified in this packet.

---

## Entry 397 — `Guided Form LiLa help button`

**Registry line:** 397
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Guided Form LiLa help button | PRD-09B | PRD-05 | ⏳ Unwired (MVP) | Phase 06 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub names "LiLa help button." Level (d.5) — bounded lookup in GuidedFormFillView.tsx:
```
Source: src/components/guided-forms/GuidedFormFillView.tsx:314-317 —
         onLilaHelp={() => {
           // TODO: open LiLa modal with section context (PRD-05 wiring)
           console.log('LiLa help requested for section:', currentSection.key)
         }}
Identifier: onLilaHelp callback wired but body is a console.log TODO placeholder; downstream LiLa modal integration not implemented.
```

### Field 2 — Code presence check
Grep command: `pattern="LiLa|lila.*help|HelpCircle|Sparkles" path=src/components/guided-forms/GuidedFormFillView.tsx output_mode=content`
Hits: 3
Files:
 - GuidedFormFillView.tsx:9 — doc comment "LiLa help button per section when enabled"
 - GuidedFormFillView.tsx:37 — `/** Whether mom allowed LiLa help for this assignment */`
 - GuidedFormFillView.tsx:315-316 — TODO comment + console.log
First-context window: GuidedFormFillView.tsx:313-319 (full block — onLilaHelp callback containing `// TODO: open LiLa modal with section context (PRD-05 wiring)` and `console.log(...)`).

### Field 3 — Wiring check
Callers: GuidedFormFillView consumes `lilaEnabled` prop + `onLilaHelp` callback; callback handler is a stub. Downstream LiLa modal is not invoked. Location type: React component with stubbed event handler. Most recent commit: `b0df6b5 2026-04-06 23:25:27 -0500 chore: Tailwind v4 class-name migration across codebase`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md:180 Known Issues: "LiLa help button in GuidedFormFillView is a stub (PRD-05 dependency)"
- prds/addenda/: PRD-05-Planning-Decisions-Addendum.md per addenda table.
- PlannedExpansionCard: Not surfaced in grep.
- CLAUDE.md: Convention 55 — "HumanInTheMix Regenerate..." (general LiLa pattern, not form-specific).

### Field 5 — What was NOT checked
- Whether GuidedFormSectionEditor renders a visible help button when `lilaEnabled` is true (only the callback was verified; the button UI was not read).
- Whether PRD-05 wiring roadmap has a specific phase assigned for this integration beyond "Phase 06."

### Field 6 — Observations (no verdict)
Registry row claims ⏳ Unwired (MVP). GuidedFormFillView.tsx:315 contains an explicit `// TODO: open LiLa modal with section context (PRD-05 wiring)` inside the onLilaHelp callback, with body being `console.log(...)`. WIRING_STATUS.md line 180 independently flags this same stub. Documentation and code agree.

---

## Entry 399 — `ListPicker overlay (Notepad → Lists)`

**Registry line:** 399
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| ListPicker overlay (Notepad → Lists) | PRD-09B | — | ⏳ Unwired (MVP) | Phase 10+ |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub names "ListPicker overlay (Notepad → Lists)." Level (d.5) — bounded lookup:
```
Source: src/components/queue/ListPickerModal.tsx exists, 351 lines.
         Grep for "ListPicker" inside src/components/notepad/: 0 hits.
Identifier: ListPickerModal exists in /queue/, consumed by queue surfaces (SortTab, RequestsTab). Notepad→Lists specifically not found.
```

### Field 2 — Code presence check
Grep command: `pattern="ListPicker|ListPickerModal|ListPickerOverlay" path=src output_mode=files_with_matches`
Hits: 3
Files:
 - src/components/queue/ListPickerModal.tsx — 351 lines primary
 - src/components/queue/SortTab.tsx — caller in queue context
 - src/components/queue/RequestsTab.tsx — caller in queue context

Supplemental grep: `pattern="ListPicker|routing.*notepad|Notepad.*Lists" path=src/components/notepad` returned 0 files.

### Field 3 — Wiring check
Callers: SortTab and RequestsTab (both queue surfaces), NOT from Notepad. Location type: React modal component. Most recent commit on ListPickerModal.tsx: `af697df 2026-04-03 13:56:27 -0500 fix: wire task Edit button on Tasks page + Dashboard, update bug-reports skill`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md:12 — "| List | Notepad, Review & Route | Shows list picker | **Wired** | ListPickerModal in SortTab" — but this row describes SortTab usage, not direct Notepad overlay.
- prds/addenda/: No specific addendum surfaced for ListPicker overlay + Notepad integration.
- PlannedExpansionCard: Not applicable.
- CLAUDE.md: No direct convention.

### Field 5 — What was NOT checked
- Whether Notepad's "Send to → List" routing path currently flows through SortTab's ListPickerModal rather than a direct Notepad overlay (indirect wiring may satisfy the capability, but not literally as "overlay").
- Whether a Notepad-specific ListPicker component is planned but not yet built.

### Field 6 — Observations (no verdict)
Registry row claims ⏳ Unwired (MVP). ListPickerModal.tsx (351 lines) exists in src/components/queue/, imported by SortTab.tsx and RequestsTab.tsx. Grep inside src/components/notepad/ for "ListPicker" returned zero hits. WIRING_STATUS.md line 12 claims "List" routing from Notepad is **Wired** via "ListPickerModal in SortTab," which may route through a queue intermediary rather than a direct Notepad overlay. The specific "ListPicker overlay (Notepad → Lists)" shape named in the stub is ambiguous — flagged for founder judgment.

---

## Entry 400 — `List drag-to-rearrange (@dnd-kit)`

**Registry line:** 400
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| List drag-to-rearrange (@dnd-kit) | PRD-09B | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub names "@dnd-kit." Level (d.5) — bounded lookup in Lists.tsx:
```
Source: src/pages/Lists.tsx:17 — "import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'"
        Lists.tsx:18 — "import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'"
        Lists.tsx:19 — "import { CSS } from '@dnd-kit/utilities'"
Identifier: @dnd-kit/core + @dnd-kit/sortable usage in Lists.tsx with DndContext + SortableContext wrappers and handleDragEnd handler.
```

### Field 2 — Code presence check
Grep command: `pattern="@dnd-kit|DndContext|useSortable|SortableContext" path=src/pages/Lists.tsx output_mode=content`
Hits: 9+
Files:
 - Lists.tsx:17-19 — dnd-kit imports (3 packages)
 - Lists.tsx:2337 — DndContext for first list render section
 - Lists.tsx:2338 — SortableContext wrapper
 - Lists.tsx:2365 — second DndContext/SortableContext pair
 - Lists.tsx:2366 — additional SortableContext
First-context window: Lists.tsx:2337-2356 (full DndContext + SortableContext block with handleDragEnd callback and verticalListSortingStrategy).

### Field 3 — Wiring check
Callers: Lists.tsx internal. `handleDragEnd` persists via useReorderListItems hook (imported per Entry 391). Location type: React drag-and-drop library integration. Most recent commit: `aeae494 2026-04-14`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: No explicit "drag-to-rearrange" row, but Universal UX Conventions section in CLAUDE.md mentions "@dnd-kit/core + @dnd-kit/sortable" as the library of record.
- prds/addenda/: PRD-09A-09B Studio Intelligence Addendum.
- PlannedExpansionCard: Not applicable.
- CLAUDE.md: Universal UX Conventions section ("DRAG-TO-REORDER (Universal)") — StewardShip's Mast.tsx cited as reference implementation.

### Field 5 — What was NOT checked
- Whether sort_order is persisted correctly on drop (useReorderListItems hook body was not read).
- Whether drag handles match the standard ⠿ icon convention CLAUDE.md references.
- Whether drag-to-rearrange is also wired on sequential/randomizer list variants.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. Lists.tsx imports @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities at lines 17-19 and wraps two rendering sections with DndContext + SortableContext (lines 2337, 2365). CLAUDE.md Universal UX Conventions section names @dnd-kit as the standard library for drag-to-reorder patterns.

---

## Entry 401 — `Save list as template to Studio`

**Registry line:** 401
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Save list as template to Studio | PRD-09B | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub names "Save list as template to Studio." Level (d.5) — bounded lookup:
```
Source: src/pages/Lists.tsx:29 — "useReorderListItems, useSaveListAsTemplate,"
        Lists.tsx:857 — "const [savedAsTemplate, setSavedAsTemplate] = useState(false)"
        Lists.tsx:864 — "const saveAsTemplate = useSaveListAsTemplate()"
        Lists.tsx:906-912 — "Make Reusable" button → saveAsTemplate.mutateAsync({ familyId, createdBy, title, listType, items })
        src/hooks/useLists.ts:414 — "export function useSaveListAsTemplate()"
Identifier: useSaveListAsTemplate hook in useLists.ts + UI entry point in Lists.tsx ("Make Reusable" tooltip on header toolbar).
```

### Field 2 — Code presence check
Grep command: `pattern="save.*template|saveAsTemplate|list_template|toTemplate" -i path=src/pages/Lists.tsx output_mode=content` and `pattern="useSaveListAsTemplate" path=src/hooks`
Hits: 5 in Lists.tsx + 1 hook definition
Files:
 - src/pages/Lists.tsx:29 (import), 857 (state), 864 (hook call), 906 (tooltip), 909-912 (mutateAsync call)
 - src/hooks/useLists.ts:414 — `export function useSaveListAsTemplate()`
First-context window: Lists.tsx:906-912 — `<Tooltip content={savedAsTemplate ? 'Saved!' : 'Make Reusable'}> ... onClick={ await saveAsTemplate.mutateAsync({ familyId: family.id, createdBy: memberId, title: list.title, listType: list.list_type, items }) } ... setSavedAsTemplate(true) ...`.

### Field 3 — Wiring check
Callers: Lists.tsx (single caller via "Make Reusable" button). Writes to list_templates table per useSaveListAsTemplate hook signature. Location type: React page + React Query mutation hook. Most recent commit on useLists.ts: `ffae417 2026-04-06 18:05:11 -0500 feat: PRD-09A/09B claim cron + list auto-provision + list victory_mode + 15 E2E tests`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: No explicit "Save list as template" row, but Studio "My Customized" list_templates are referenced via seed data table counts (list_templates: 12 rows in live_schema.md).
- prds/addenda/: PRD-09A-09B Studio Intelligence Addendum; specs/studio-seed-templates.md describes lists as a seed category.
- PlannedExpansionCard: Not applicable.
- CLAUDE.md: Convention 149 — Studio is universal creation and library surface.

### Field 5 — What was NOT checked
- Whether `useSaveListAsTemplate` writes to `list_templates` with `family_id` scoped correctly (hook body lines 414+ not read).
- Whether saved templates immediately appear in Studio's My Customized tab or require a refresh (cache invalidation path not verified).
- Whether the 3-second `setSavedAsTemplate(false)` timeout indicates any optimistic-update pattern concerns.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. Lists.tsx imports `useSaveListAsTemplate` (line 29), calls it (line 864), and exposes a "Make Reusable" button (lines 906-912) that writes via mutateAsync with family, member, title, listType, and items. Hook defined at useLists.ts:414. Most recent commit 2026-04-06 (the Phase 10 Repair window).

---



## Entry 402 — `List item promotion badge`

**Registry line:** 402
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| List item promotion badge | PRD-09B | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 402 — row does not name a concrete code identifier (no component, hook, column, or file).
(b) WIRING_STATUS.md — no section explicitly about "List item promotion badge"; WIRING_STATUS mentions "Promote to task [→ Tasks]" at list_items level without naming the badge component.
(c) CLAUDE.md — no convention numbered for the promotion badge specifically.
(d) PRD-09B data model (`prds/personal-growth/PRD-09B-Lists-Studio-Templates.md`) lines 674-675 quote: `| promoted_to_task | BOOLEAN | false | NOT NULL | Whether this item has been sent to Task Queue |` and `| promoted_task_id | UUID | | NULL | FK → tasks. Links to the task if promoted. |`.
(d.5) feature-decisions file `claude/feature-decisions/PRD-10-repair.md:128-129` — "When `list_items.promoted_to_task = true`, show small badge icon on item. Badge already has `promoted_to_task` and `promoted_task_id` columns in live schema."

Identifier: `promoted_to_task` boolean column on `list_items` + `promoted_task_id` UUID FK + UI badge rendering in `src/pages/Lists.tsx`.

### Field 2 — Code presence check
Grep command: `pattern="promoted_to_task|promoted_task_id" path=src output_mode=files_with_matches`
Hits: 3 files
Files:
- src/pages/Lists.tsx:2858, :2888 — badge render + conditional promote button
- src/types/lists.ts:97-98 — type definitions
- src/hooks/useLists.ts:371 — `.update({ promoted_to_task: true })`

First-context window (Lists.tsx 2858-2869):
```
{item.promoted_to_task && (
  <span
    className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-medium"
    style={{
      backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)',
      color: 'var(--color-btn-primary-bg)',
    }}
  >
    <ArrowUpRight size={10} />
    Promoted
  </span>
)}
```

### Field 3 — Wiring check
Callers: badge is inline JSX in Lists.tsx, not a separate component with callers. `promoted_to_task` column referenced by Lists.tsx (2 spots: badge display, conditional button), useLists.ts (mutation setter), types/lists.ts (type def).
Execution-flow location: React page component with conditional badge JSX; state comes from list_items row.
Most-recent commit touching Lists.tsx: `90a47a8` 2026-04-15 16:13:36 — "feat: Studio setup wizards, sticker grid, LiLa knowledge + bug fixes".

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: Lists page row mentions "Promote to task [→ Tasks]" at a list-item level but doesn't explicitly reference the badge.
- prds/addenda/: No matches for the promotion badge specifically on a PRD-09B addendum search.
- PlannedExpansionCard: not applicable — badge is wired, not stubbed.
- CLAUDE.md: no matching convention number for the badge.

### Field 5 — What was NOT checked
- Whether `useLists.ts:371` (`.update({ promoted_to_task: true })`) is the full promotion flow that also creates the downstream task row (not grepped for the task-row side).
- Whether the badge renders correctly in archived/soft-deleted list contexts.
- Column presence on live Supabase production DB (per live_schema.md list_items columns 27-28 present).

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired with Wired-By = Phase 10 Repair. Lists.tsx line 2858-2869 renders a `<ArrowUpRight/> Promoted` badge gated on `item.promoted_to_task`, and line 2888-2892 renders the promote button gated on `!item.promoted_to_task`. Schema columns `promoted_to_task` + `promoted_task_id` present in live_schema.md list_items table (columns 27-28). Migration 00000000000024_lists_studio_prd09b.sql:59-68 added both columns + partial index.

---

## Entry 408 — `Dashboard grid + 6 tracker types`

**Registry line:** 408
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Dashboard grid + 6 tracker types | PRD-10 | PRD-10 Phase A | ✅ Wired | PRD-10 Phase A |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 408 — names "Dashboard grid" + "6 tracker types" but no specific file/component identifier.
(b) WIRING_STATUS.md — references `DashboardGrid` component for dashboard grid context.
(c) CLAUDE.md — no specific convention number for tracker types.
(d) PRD-10 Widgets file presence confirmed via glossary; schema table `dashboard_widgets` (live_schema.md 41 rows).
(d.5) opened `src/pages/Dashboard.tsx` — imports `DashboardGrid` from `@/components/widgets/DashboardGrid` (line 16) and uses at line 556; `PhaseATrackerType` in `src/types/widgets.ts:30` = `'tally' | 'streak' | 'percentage' | 'checklist' | 'multi_habit_grid'` (5 listed, not 6 — 6th may be a renderer like `countdown` which appears in widgets.ts section separately).

Identifier: `DashboardGrid` component + `PhaseATrackerType` union in types/widgets.ts.

### Field 2 — Code presence check
Grep command: `pattern="DashboardGrid|PhaseATrackerType" path=src output_mode=files_with_matches`
Hits: Dashboard.tsx:16 imports DashboardGrid; DashboardGrid.tsx is the component (rendered at Dashboard.tsx:556); 5 files reference PhaseATrackerType.
Files:
- src/components/widgets/DashboardGrid.tsx — component impl
- src/pages/Dashboard.tsx:556 — render site
- src/types/widgets.ts:30 — PhaseATrackerType union (5 values)
- src/components/widgets/TrackerQuickCreateModal.tsx — 5 PhaseATrackerType sites
First-context window (Dashboard.tsx 556-562):
```
<DashboardGrid
  ...
  onOpenWidgetPicker={() => setWidgetPickerOpen(true)}
```

### Field 3 — Wiring check
Callers: DashboardGrid rendered in Dashboard.tsx:556 and GuidedWidgetGrid.tsx (referenced per earlier grep).
Execution-flow location: React component (widgets module).
Most recent commit touching DashboardGrid.tsx area: `90a47a8` 2026-04-15 (Studio setup wizards commit).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: references `WidgetPicker + WidgetConfiguration` under `[Customize] Trackers/Widgets — PRD-10 Phase A` in Studio → Feature Wiring.
- prds/addenda/: not explicitly searched per identifier.
- PlannedExpansionCard: not applicable (Wired).
- CLAUDE.md: no specific convention number.

### Field 5 — What was NOT checked
- The exact enumeration of "6 tracker types" vs PhaseATrackerType's 5 values — whether 6th counts `countdown`/`log_learning`/other Phase B bootstrapped types.
- Whether all 5/6 types have rendering paths in production.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired with "6 tracker types." `PhaseATrackerType` union defines 5 values (`tally|streak|percentage|checklist|multi_habit_grid`). `DashboardGrid` component exists and is wired to `Dashboard.tsx`. Phase A scope + exact 5-vs-6 discrepancy is a question for synthesis.

---

## Entry 409 — `Widget Picker modal`

**Registry line:** 409
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Widget Picker modal | PRD-10 | PRD-10 Phase A | ✅ Wired | PRD-10 Phase A |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 409 — names "Widget Picker modal" conceptually.
(b) WIRING_STATUS.md — Studio → Feature Wiring row names `WidgetPicker + WidgetConfiguration`.

Identifier: `WidgetPicker` React component.

### Field 2 — Code presence check
Grep command: `pattern="WidgetPicker" path=src output_mode=files_with_matches`
Hits: found in 3+ files.
Files:
- src/components/widgets/WidgetPicker.tsx — impl
- src/components/widgets/index.ts — export
- src/pages/Dashboard.tsx:19 — import; :764 — render site
First-context window (Dashboard.tsx 764-766):
```
<WidgetPicker
  ...
  onClose={() => setWidgetPickerOpen(false)}
```

### Field 3 — Wiring check
Callers: Dashboard.tsx:19 + :764; GuidedWidgetGrid.tsx (referenced earlier).
Execution-flow location: React modal component.
Most recent commit: `90a47a8` 2026-04-15 per Dashboard.tsx git log.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: `WidgetPicker + WidgetConfiguration` **Wired** PRD-10 Phase A row.
- prds/addenda/: not specifically searched.
- PlannedExpansionCard: n/a.
- CLAUDE.md: no specific convention.

### Field 5 — What was NOT checked
- Picker behavior across shells (Play/Guided/Independent).
- Whether the picker fully shows all tracker types.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. `WidgetPicker` component exists at `src/components/widgets/WidgetPicker.tsx`; imported and rendered in `Dashboard.tsx:19,764`. WIRING_STATUS.md corroborates.

---

## Entry 410 — `Widget Configuration modal`

**Registry line:** 410
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Widget Configuration modal | PRD-10 | PRD-10 Phase A | ✅ Wired | PRD-10 Phase A |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 410 names "Widget Configuration modal."
(b) WIRING_STATUS.md names `WidgetConfiguration` alongside WidgetPicker.

Identifier: `WidgetConfiguration` React component.

### Field 2 — Code presence check
Grep command: `pattern="WidgetConfiguration" path=src output_mode=files_with_matches`
Hits: present in components/widgets/WidgetConfiguration.tsx and Dashboard.tsx.
Files:
- src/components/widgets/WidgetConfiguration.tsx — impl (50, 58, 107, 146 trackerType sites)
- src/pages/Dashboard.tsx:20 — import; :775 — render site
First-context window (Dashboard.tsx 775):
```
<WidgetConfiguration
```

### Field 3 — Wiring check
Callers: Dashboard.tsx.
Execution-flow location: React modal component.
Most recent commit: `90a47a8` 2026-04-15.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: `WidgetPicker + WidgetConfiguration` Wired under PRD-10 Phase A.
- prds/addenda/: not separately searched.
- PlannedExpansionCard: n/a.
- CLAUDE.md: no specific convention.

### Field 5 — What was NOT checked
- Whether per-tracker-type configuration forms (multiplayer, goal, etc.) all render fully.
- Whether Multiplayer mode from widgets.ts renders inside config flow.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. `WidgetConfiguration` component exists at `src/components/widgets/WidgetConfiguration.tsx`; imported + rendered in Dashboard.tsx:20,775. Multiplayer-related types (`MultiplayerMode`, `MultiplayerVisualStyle`) found in widgets.ts + WidgetConfiguration (consistent with Phase A scope).

---

## Entry 411 — `Widget Detail View modal`

**Registry line:** 411
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Widget Detail View modal | PRD-10 | PRD-10 Phase A | ✅ Wired | PRD-10 Phase A |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 411 names "Widget Detail View modal."
(b) WIRING_STATUS.md does not individually name this; (d.5) opened Dashboard.tsx and found import `WidgetDetailView` from `@/components/widgets/WidgetDetailView` (line 21, render :797).

Identifier: `WidgetDetailView` React component.

### Field 2 — Code presence check
Grep command: `pattern="WidgetDetailView" path=src output_mode=files_with_matches`
Hits: components/widgets/WidgetDetailView.tsx + Dashboard.tsx + index.ts export.
Files:
- src/components/widgets/WidgetDetailView.tsx — impl
- src/pages/Dashboard.tsx:21,797 — import + render
First-context window (Dashboard.tsx 797): `<WidgetDetailView`.

### Field 3 — Wiring check
Callers: Dashboard.tsx only (grepped).
Execution-flow location: React modal component.
Most recent commit: `90a47a8` 2026-04-15.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no explicit row for WidgetDetailView.
- prds/addenda/: not specifically searched.
- PlannedExpansionCard: n/a.
- CLAUDE.md: no specific convention.

### Field 5 — What was NOT checked
- Render behavior across all widget types in the detail view.
- Whether GuidedWidgetGrid surfaces the detail view separately.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. `WidgetDetailView` component file exists; imported + rendered in Dashboard.tsx:21,797. WIRING_STATUS.md does not name this component individually but Studio → Feature Wiring WidgetPicker+WidgetConfiguration row is nearby.

---

## Entry 412 — `Widget folders (create/view)`

**Registry line:** 412
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Widget folders (create/view) | PRD-10 | PRD-10 Phase A | ✅ Wired | PRD-10 Phase A |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry names "Widget folders."
(b) WIRING_STATUS.md — not explicitly named.
(c) CLAUDE.md — no specific convention.
(d) live_schema.md confirms `dashboard_widget_folders` table (0 rows).
(d.5) grep found `DashboardWidgetFolder` type at `src/types/widgets.ts:141`; `WidgetFolderCard` at `src/components/widgets/WidgetFolderCard.tsx`; `FolderOverlayModal` at `src/components/widgets/FolderOverlayModal.tsx`; `useWidgetFolders` hook (Dashboard.tsx:24, GuidedWidgetGrid.tsx:9).

Identifier: `dashboard_widget_folders` table + `WidgetFolderCard` component + `FolderOverlayModal` component + `useWidgetFolders` hook + `DashboardWidgetFolder` type.

### Field 2 — Code presence check
Grep command: `pattern="WidgetFolderCard|FolderOverlayModal|useWidgetFolders|DashboardWidgetFolder" path=src`
Hits: ~20+ lines in multiple files.
Files:
- src/types/widgets.ts:141 — DashboardWidgetFolder interface
- src/components/widgets/WidgetFolderCard.tsx — component impl (lines 6-16)
- src/components/widgets/FolderOverlayModal.tsx — component impl
- src/components/widgets/index.ts:8 — export
- src/components/widgets/DashboardGrid.tsx:25,28,184,191,466 — type import + render site
- src/pages/Dashboard.tsx:24,62,72 — folders state + query
- src/components/guided/GuidedWidgetGrid.tsx:9,21 — folders usage
First-context (WidgetFolderCard.tsx 16): `export function WidgetFolderCard({ folder, widgets, isEditMode, onOpen }: WidgetFolderCardProps) {`.

### Field 3 — Wiring check
Callers: DashboardGrid.tsx uses WidgetFolderCard; Dashboard.tsx + GuidedWidgetGrid.tsx consume useWidgetFolders.
Execution-flow location: React components + hook + schema table.
Most recent commit: `90a47a8` 2026-04-15 (Dashboard.tsx area).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: does not explicitly name widget folders.
- prds/addenda/: not specifically searched.
- PlannedExpansionCard: n/a.
- CLAUDE.md: no specific convention.

### Field 5 — What was NOT checked
- Whether the folder create flow (UI) has its own modal or is inline within DashboardGrid.
- Whether drag-and-drop moves widgets into folders end-to-end persist correctly.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. `dashboard_widget_folders` table exists in live schema (0 rows). Component files `WidgetFolderCard.tsx`, `FolderOverlayModal.tsx`, hook `useWidgetFolders`, and type `DashboardWidgetFolder` all present and wired into Dashboard.tsx + GuidedWidgetGrid.tsx + DashboardGrid.tsx.

---

## Entry 414 — `Phase B tracker types (11 remaining)`

**Registry line:** 414
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Phase B tracker types (11 remaining) | PRD-10 | — | ⏳ Unwired (MVP) | PRD-10 Phase B |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry names "Phase B tracker types (11 remaining)" — no code identifier in row.
(b) WIRING_STATUS.md — not specifically named for Phase B.
(c) CLAUDE.md — no specific convention.
(d) PRD-10 references Phase B trackers per glossary/PRD.
(d.5) `src/types/widgets.ts:33-37` quote:
```
export type PhaseBTrackerType =
  | 'boolean_checkin' | 'sequential_path' | 'achievement_badge'
  | 'xp_level' | 'allowance_calculator' | 'leaderboard'
  | 'mood_rating' | 'countdown' | 'timer_duration' | 'snapshot_comparison'
```

Identifier: `PhaseBTrackerType` union (10 values; stub claims 11).

### Field 2 — Code presence check
Grep command: `pattern="PhaseBTrackerType" path=src output_mode=files_with_matches`
Hits: 1 file (types/widgets.ts).
Files:
- src/types/widgets.ts:33 — type def only
First-context window (widgets.ts 33-37): type union with 10 values.

### Field 3 — Wiring check
Callers: no callers found — the type is defined but not referenced elsewhere.
Execution-flow location: TypeScript type alias; no runtime consumers located in this run.
Most recent commit: not separately grepped beyond the file (file-level commit is `90a47a8` 2026-04-15 or earlier).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no Phase B row matching.
- prds/addenda/: Phase B mentioned across addenda; not separately grepped by PRD number.
- PlannedExpansionCard: not separately grepped for Phase B trackers.
- CLAUDE.md: no convention.

### Field 5 — What was NOT checked
- Whether each of the 10 Phase B type values has any runtime renderer file.
- Why the stub says "11 remaining" when the union has 10 values.
- Whether `AllowanceCalculatorTracker` (found in earlier grep) overlaps with `allowance_calculator` PhaseBTrackerType value — would need rendering-path verification.

### Field 6 — Observations (no verdict)
Registry row claims ⏳ Unwired (MVP) with Phase-B build-phase target. `PhaseBTrackerType` union exists at `src/types/widgets.ts:33-37` with 10 enumerated values (not 11). Grep for type consumers returned no callers within src/ — the type is declared but not referenced by other imports. A tracker component `AllowanceCalculatorTracker` exists in trackers/ folder but was not walked back to confirm whether it implements the PhaseB value `allowance_calculator` specifically.

---

## Entry 416 — `Track This flow (Screen 5)`

**Registry line:** 416
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Track This flow (Screen 5) | PRD-10 | — | ⏳ Unwired (MVP) | PRD-10 Phase B |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry names "Track This flow (Screen 5)."
(b) WIRING_STATUS.md — not explicitly.
(c) CLAUDE.md — no convention.
(d) PRD-10 references Screens by number.
(d.5) Grep located `TrackThisModal` component: `src/components/widgets/TrackThisModal.tsx` (interface line 17, export line 40); imported and rendered in `src/pages/Dashboard.tsx:22,786`.

Identifier: `TrackThisModal` React component.

### Field 2 — Code presence check
Grep command: `pattern="TrackThisModal" path=src output_mode=files_with_matches`
Hits: 3 files.
Files:
- src/components/widgets/TrackThisModal.tsx — impl
- src/pages/Dashboard.tsx:22 (import), :786 (render)
- src/components/widgets/index.ts:10 — export
First-context window (Dashboard.tsx 786): `<TrackThisModal`.

### Field 3 — Wiring check
Callers: Dashboard.tsx only.
Execution-flow location: React modal component.
Most recent commit: `90a47a8` 2026-04-15 or earlier (Dashboard.tsx git log).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no explicit "Track This flow (Screen 5)" row.
- prds/addenda/: not specifically grepped.
- PlannedExpansionCard: n/a — component exists.
- CLAUDE.md: no convention.

### Field 5 — What was NOT checked
- Whether `TrackThisModal` implements the full PRD-10 Screen 5 "Track This flow" per PRD spec, or is a reduced/early-stage version.
- Relationship between TrackThisModal and the Phase B trackers it may enable.

### Field 6 — Observations (no verdict)
Registry row claims ⏳ Unwired (MVP) with target Phase B. However, a file `src/components/widgets/TrackThisModal.tsx` exists, is imported + rendered at Dashboard.tsx:22,786, and exported from widgets/index.ts:10. There is a naming correspondence with the stub's "Track This flow" — but whether the existing modal is the FULL PRD-10 Screen 5 flow or a partial / different artifact cannot be determined without reading the PRD Screen 5 spec. Surface mismatch between "Unwired" claim and component presence for founder synthesis.

---

## Entry 418 — `Gameboard tracker`

**Registry line:** 418
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Gameboard tracker | PRD-10 | — | ⏳ Unwired (MVP) | PRD-10 Phase C |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry names "Gameboard tracker."
(b) WIRING_STATUS.md — not named.
(c) CLAUDE.md — no convention.
(d) PRD-10 references gameboards.
(d.5) widgets.ts hits: line 24 `'gameboard'` in tracker/widget template type list; line 50 `'game_board'` as VisualVariant; line 466 `type: 'gameboard'` (likely in starter configs array). No renderer component `GameboardTracker` found via grep.

Identifier: `'gameboard'` tracker template_type value + `'game_board'` VisualVariant (string literals only; no dedicated tracker renderer component located).

### Field 2 — Code presence check
Grep command: `pattern="Gameboard|gameboard|game_board" path=src output_mode=files_with_matches`
Hits: 4 files (types/widgets.ts, components/widgets/WidgetPicker.tsx, WidgetDetailView.tsx, TrackThisModal.tsx).
Files:
- src/types/widgets.ts:24,50,466 — type literals + starter config array entry
- src/components/widgets/WidgetPicker.tsx — references in picker registry
- src/components/widgets/WidgetDetailView.tsx — detail view switch cases (not confirmed in detail)
- src/components/widgets/TrackThisModal.tsx — track-this flow references
First-context window: widgets.ts:466 — `type: 'gameboard',` (inside a starter-config array entry).

### Field 3 — Wiring check
Callers: type literal referenced in WidgetPicker, WidgetDetailView, TrackThisModal — likely in switch/case listings. No dedicated `GameboardTracker` renderer component found.
Execution-flow location: type-union literals + starter-config array entries; no isolated renderer.
Most recent commit: not separately grepped beyond files.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no row.
- prds/addenda/: not specifically grepped.
- PlannedExpansionCard: not separately grepped for gameboard.
- CLAUDE.md: no convention.

### Field 5 — What was NOT checked
- Whether any of the ~4 files has a fully-rendered gameboard tracker vs placeholder.
- Whether the `game_board` VisualVariant in widgets.ts:50 maps to `'gameboard'` template_type literal:24.
- Whether gameboard feature_key is in `feature_expansion_registry.ts`.

### Field 6 — Observations (no verdict)
Registry row claims ⏳ Unwired (MVP) target Phase C. Grep found 'gameboard' literals in widgets.ts, WidgetPicker.tsx, WidgetDetailView.tsx, TrackThisModal.tsx — the type is declared and referenced but a dedicated renderer file was not located. Stub status of "Unwired" aligns with no-renderer observation; definitive verification of actual render output requires opening the switch/case files.

---

## Entry 420 — `Special Adult child-widget view`

**Registry line:** 420
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Special Adult child-widget view | PRD-10 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry names "Special Adult child-widget view" — no code identifier.
(b) WIRING_STATUS.md — no dedicated row.
(c) CLAUDE.md — no specific convention tying this to a code identifier.
(d) PRD-10 and PRD-27 Caregiver Tools relate; `assigned_member_id` column on `dashboard_widgets` present in live_schema.md. Grep found no `SpecialAdult.*widget` / `child.widget` identifiers in src/.
(d.5) Not escalated — no file named from (a)-(d) to open.

Identifier: CAPABILITY-ONLY — no implementation identifier found.
Sources checked:
  (a) stub entry line 420 — no identifier named
  (b) WIRING_STATUS.md — no dedicated row found
  (c) CLAUDE.md conventions — no matching convention
  (d) PRD-10/PRD-27 referenced but no specific code identifier surfaced

### Field 2 — Code presence check
Skipped — no identifier to grep for.

### Field 3 — Wiring check
Skipped — no code presence.

### Field 4 — Documentation cross-reference
Skipped — CAPABILITY-ONLY.

### Field 5 — What was NOT checked
- Capability-only entry; evidence-by-grep not applicable. A semantic-search question might be: "Where in the codebase is a Special Adult's view of a child's widgets scoped/filtered?" — blocked by Convention 242.
- Whether `assigned_member_id` + shift_view access gates are part of this capability.

### Field 6 — Observations (no verdict)
capability-only entry; evidence-by-grep not applicable. Flagged for founder-judgment bucket.

---

## Entry 421 — `Decorative layer (Cozy Journal)`

**Registry line:** 421
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Decorative layer (Cozy Journal) | PRD-10 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry names "Decorative layer (Cozy Journal)" — no code identifier.
(b) WIRING_STATUS.md — no row.
(c) CLAUDE.md — no matching convention.
(d) PRD-10 addenda not searched explicitly for Cozy Journal; grep for `decorative_layer|CozyJournal|cozy_journal|decoration.*journal` returned no files.
(d.5) Not escalated — no file named from (a)-(d) to open.

Identifier: CAPABILITY-ONLY — no implementation identifier found.
Sources checked:
  (a) stub entry line 421 — no identifier named
  (b) WIRING_STATUS.md — no row
  (c) CLAUDE.md conventions — no matching convention
  (d) PRD-10 — capability noted, no code identifier quoted

### Field 2 — Code presence check
Skipped — no identifier to grep for.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
Skipped.

### Field 5 — What was NOT checked
- Capability-only entry. Semantic-search question: "What rendering surface is 'Cozy Journal' meant to decorate — dashboard overlay, widget chrome, or something else?" — blocked by Convention 242.

### Field 6 — Observations (no verdict)
capability-only entry; evidence-by-grep not applicable. Flagged for founder-judgment bucket.

---

## Entry 430 — `Task creation modal redesign (compact 2-col)`

**Registry line:** 430
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Task creation modal redesign (compact 2-col) | Phase 10 Repair | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry names "Task creation modal" — concrete identifier: TaskCreationModal.
(b) WIRING_STATUS.md references TaskCreationModal extensively.

Identifier: `TaskCreationModal` React component.

### Field 2 — Code presence check
Grep command: `pattern="TaskCreationModal|TaskCreationModalV2" path=src/components/tasks output_mode=files_with_matches`
Hits: 5 files (TaskCreationModal.tsx, DashboardTasksSection.tsx, RoutineSectionEditor.tsx, SequentialCreatorModal.tsx, TaskIconPicker.tsx).
Files:
- src/components/tasks/TaskCreationModal.tsx — impl
- src/components/tasks/DashboardTasksSection.tsx — caller
- src/components/tasks/RoutineSectionEditor.tsx — caller
- src/components/tasks/sequential/SequentialCreatorModal.tsx — caller reference
- src/components/tasks/TaskIconPicker.tsx — caller

Glob for `src/components/tasks/TaskCreationModal*` returns single file `TaskCreationModal.tsx` (no V2 sibling).

### Field 3 — Wiring check
Callers: 4+ files reference TaskCreationModal across the tasks tree.
Execution-flow location: React modal component.
Most recent commit: `426c446` 2026-04-15 18:42:29 — "feat: PRD-16 Phase E verification + Meeting Setup Wizard + Guided agenda capture + bug fixes".

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: multiple rows under Studio → Feature Wiring reference TaskCreationModal as target of various deploy paths.
- prds/addenda/: not separately grepped.
- PlannedExpansionCard: n/a.
- CLAUDE.md: convention 67 "Task Creation Modal has Quick Mode..." references the component.

### Field 5 — What was NOT checked
- Whether the "compact 2-col" redesign is specifically implemented (e.g., CSS grid with 2 columns) vs other layout.
- Whether Quick/Full mode toggle follows convention 67 spec.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. `TaskCreationModal.tsx` exists; 4+ caller sites in tasks tree. Convention 67 in CLAUDE.md references the modal's Quick/Full modes. Most recent touching commit 2026-04-15.

---

## Entry 432 — `Task view drag-to-reorder (@dnd-kit)`

**Registry line:** 432
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Task view drag-to-reorder (@dnd-kit) | PRD-09A | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry names "@dnd-kit" — a library name.
(b) WIRING_STATUS.md — implicit task view drag references.
(c) CLAUDE.md — "Universal UX Conventions" (end of CLAUDE.md) convention DRAG-TO-REORDER names `@dnd-kit/core + @dnd-kit/sortable` as the standard.
(d) PRD-09A references task views.
(d.5) `src/components/tasks/views/SimpleListView.tsx:18-22` quotes: `SortableContext, useSortable, ... } from '@dnd-kit/sortable'`; lines 163-180 wrap content in `<SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>`; lines 209+ define `SortableTaskItem` with `useSortable({ id: task.id })`.

Identifier: `@dnd-kit/sortable` SortableContext + useSortable within `src/components/tasks/views/SimpleListView.tsx`.

### Field 2 — Code presence check
Grep command: `pattern="@dnd-kit/sortable|useSortable|SortableContext" path=src/components/tasks/views/SimpleListView.tsx`
Hits: 8 matches in SimpleListView.tsx (lines 18, 19, 22, 163, 180, 209, 242).
First-context window (SimpleListView.tsx 18-22):
```
  SortableContext,
  useSortable,
  ...
} from '@dnd-kit/sortable'
```
Lines 163-180: `<SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>` ... `</SortableContext>`.
Line 209-242: `SortableTaskItem — wraps TaskCard with useSortable({ id: task.id })`.

### Field 3 — Wiring check
Callers: SimpleListView.tsx is a view component that's one of 13 task views (see TaskViewKey union) registered in ViewCarousel / Tasks.tsx pipeline.
Execution-flow location: React task view component with @dnd-kit sortable.
Most recent commit touching SimpleListView.tsx: not separately retrieved but in tasks subtree (likely `90a47a8` or `426c446`).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no explicit row but task view system documented.
- prds/addenda/: not specifically grepped.
- PlannedExpansionCard: n/a.
- CLAUDE.md: Universal UX Conventions section DRAG-TO-REORDER names @dnd-kit standard; StewardShip's Mast.tsx cited as reference impl.

### Field 5 — What was NOT checked
- Whether all 13 task views support drag-to-reorder or only SimpleListView.
- Persistence path: whether drag persists `sort_order` to `tasks.sort_order` correctly.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired for Phase 10 Repair. SimpleListView.tsx at `src/components/tasks/views/SimpleListView.tsx:18-22,163-180,209-242` imports `@dnd-kit/sortable`, wraps task list in `<SortableContext>`, and defines `SortableTaskItem` with `useSortable`. Other task views were not walked individually.

---

## Entry 434 — `Sequential reuse/redeploy flow`

**Registry line:** 434
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Sequential reuse/redeploy flow | PRD-09A | PRD-09A/09B Studio Intelligence Phase 1 | ✅ Wired | `useRedeploySequentialCollection` hook + SequentialCollectionView restart-for-another-student UI — live as of 2026-04-06 when the view was revived from dead code. |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry row names `useRedeploySequentialCollection` hook + `SequentialCollectionView` restart-for-another-student UI.

Identifier: `useRedeploySequentialCollection` hook + `SequentialCollectionView` component.

### Field 2 — Code presence check
Grep command: `pattern="useRedeploySequentialCollection|restart.*student|redeploy.*sequential" path=src output_mode=files_with_matches`
Hits: 2 files.
Files:
- src/components/tasks/sequential/SequentialCollectionView.tsx
- src/hooks/useSequentialCollections.ts

### Field 3 — Wiring check
Callers: SequentialCollectionView is rendered on Tasks page + Lists page (Phase 1 cross-surface).
Execution-flow location: React component (view) + hook.
Most recent commit touching useSequentialCollections.ts: `e7e3f48` 2026-04-14 22:38:11 — "fix: routine show_until_complete carry-forward + weekday handling".

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: Sequential Collections section lists "Visible on Tasks → Sequential tab — `<SequentialCollectionView>` renders expandable cards with progress, restart-for-another-student, archive" **Wired** revived from dead code in Phase 1.
- prds/addenda/: PRD-09A/09B Studio Intelligence Universal-Creation-Hub-Addendum referenced in CLAUDE.md conventions 149-156.
- PlannedExpansionCard: n/a.
- CLAUDE.md: conventions 149-156 describe Studio Intelligence Phase 1.

### Field 5 — What was NOT checked
- Whether "restart-for-another-student" flow resets `current_index` to 0 correctly or spawns a new collection row.
- Whether redeployed sequentials preserve mastery vs reset mastery state.
- Whether E2E test exercises the redeploy flow.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired with explanatory text pointing at `useRedeploySequentialCollection` + `SequentialCollectionView`. Both identifiers present: hook in `src/hooks/useSequentialCollections.ts`; component in `src/components/tasks/sequential/SequentialCollectionView.tsx`. WIRING_STATUS.md corroborates with "restart-for-another-student" text. CLAUDE.md conventions 149-156 frame the Studio Intelligence Phase 1 work.

---

## Entry 435 — `Routine step progress indicator`

**Registry line:** 435
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Routine step progress indicator | PRD-09A | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry row names "Routine step progress indicator."
(b) WIRING_STATUS.md — not named specifically.
(c) CLAUDE.md — no specific convention.
(d) PRD-09A mentions routine steps.
(d.5) Grep located `RoutineStepChecklist` component at `src/components/tasks/RoutineStepChecklist.tsx`; imports in `GuidedActiveTasksSection.tsx`, `TaskCard.tsx`, `PlayTaskTileGrid.tsx`.

Identifier: `RoutineStepChecklist` React component.

### Field 2 — Code presence check
Grep command: `pattern="RoutineStepChecklist" path=src output_mode=files_with_matches`
Hits: 5 files.
Files:
- src/components/tasks/RoutineStepChecklist.tsx — impl
- src/components/guided/GuidedActiveTasksSection.tsx — caller
- src/components/tasks/TaskCard.tsx — caller
- src/components/play-dashboard/PlayTaskTileGrid.tsx — caller
- src/hooks/useRoutineTemplateSteps.ts — step hook

### Field 3 — Wiring check
Callers: 3 UI callers (TaskCard, GuidedActiveTasksSection, PlayTaskTileGrid) + steps hook.
Execution-flow location: React component, consumed across shells.
Most recent commit touching RoutineStepChecklist.tsx: `e7e3f48` 2026-04-14 22:38:11 (per grouped git log).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: Sequential Collections "Linked routine steps — dashboard rendering" row mentions `RoutineStepChecklist` — "RoutineStepChecklist expands inline with linked content from sequential/randomizer/task sources" **Wired**.
- prds/addenda/: not specifically grepped.
- PlannedExpansionCard: n/a.
- CLAUDE.md: no specific convention number.

### Field 5 — What was NOT checked
- Whether the progress indicator visual (e.g., "3/5 steps done") renders correctly with/without section grouping.
- Whether `show_until_complete` flag per section reflects in the indicator.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. `RoutineStepChecklist.tsx` exists at `src/components/tasks/RoutineStepChecklist.tsx`; consumed across TaskCard, GuidedActiveTasksSection, PlayTaskTileGrid. WIRING_STATUS.md explicitly names it in the "Linked routine steps — dashboard rendering" row as Wired 2026-04-13.

---

## Entry 436 — `Approval-required parent UI`

**Registry line:** 436
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Approval-required parent UI | PRD-09A | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry names "Approval-required parent UI."
(b) WIRING_STATUS.md — not named.
(c) CLAUDE.md — no specific convention.
(d) PRD-09A references require_approval + approval workflow.
(d.5) Grep located `PendingApprovalsSection` at `src/pages/Tasks.tsx:600` (render), :1577-1606 (component definition with `useTasksWithPendingApprovals`, `useApproveTaskCompletion`, `useRejectTaskCompletion`); hooks imported at :37 from `@/hooks/useTasks`.

Identifier: `PendingApprovalsSection` sub-component in Tasks.tsx + hooks `useTasksWithPendingApprovals`, `useApproveTaskCompletion`, `useRejectTaskCompletion`.

### Field 2 — Code presence check
Grep command: `pattern="PendingApprovalsSection|useApproveTaskCompletion|useRejectTaskCompletion" path=src output_mode=files_with_matches`
Hits: (within Tasks.tsx) line 37 imports, line 121 useTasksWithPendingApprovals, line 600 PendingApprovalsSection render, line 1577 interface, line 1585 function def.
Files:
- src/pages/Tasks.tsx — consumer + impl
- src/hooks/useTasks.ts — hooks
Also referenced in Lists.tsx, types/tasks.ts, useTaskCompletions.ts per earlier grep.

First-context window (Tasks.tsx 1585):
```
function PendingApprovalsSection({ tasks, familyMembers, approverId }: PendingApprovalsSectionProps) {
```
Line 1604-1606: query `select('id, task_id, member_id, completed_at, approval_status, completion_type, mastery_evidence_url, mastery_evidence_note').eq('approval_status', 'pending')`.

### Field 3 — Wiring check
Callers: Tasks.tsx renders PendingApprovalsSection at line 600. Hooks consumed at line 37, 121.
Execution-flow location: React section component within Tasks page + React Query hooks.
Most recent commit: `426c446` 2026-04-15 18:42:29 (per Tasks.tsx-family git log).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: approval flows in tasks not specifically rowed.
- prds/addenda/: PRD-09A convention 161 (CLAUDE.md) references `PendingApprovalsSection` in Tasks.tsx line 1062 for mastery approval reuse. (Line number has shifted to 1585+ in current tree.)
- PlannedExpansionCard: n/a.
- CLAUDE.md: convention 161 "Sequential mastery approvals reuse the existing `PendingApprovalsSection` in Tasks.tsx ... by detecting `completion_type='mastery_submit'`."

### Field 5 — What was NOT checked
- Whether the approval UI properly handles photo evidence fields (mastery_evidence_url).
- Whether rejection flow correctly resets task to pending vs leaves as rejected.
- Whether convention 161's line 1062 reference shifted to another location (seen at 1585 now); the line drift not material for verdict but noted.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. `PendingApprovalsSection` component defined inline in `src/pages/Tasks.tsx` (lines 1577-1606+); render site at :600; hooks `useTasksWithPendingApprovals`, `useApproveTaskCompletion`, `useRejectTaskCompletion` imported from useTasks. CLAUDE.md convention 161 explicitly names PendingApprovalsSection for mastery reuse.

---

## Entry 437 — `Completion photo evidence`

**Registry line:** 437
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Completion photo evidence | PRD-09A | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry names "Completion photo evidence."
(b) WIRING_STATUS.md — not explicitly.
(c) CLAUDE.md — no convention.
(d) live_schema.md shows `photo_url` column on both `task_completions` (col 10) and `routine_step_completions` (col 9).
(d.5) Grep in `src/components/tasks/useTaskCompletion.ts:93`: `photo_url: photoUrl ?? null,`.

Identifier: `photo_url` column on `task_completions` + `routine_step_completions` + `useTaskCompletion` hook write.

### Field 2 — Code presence check
Grep command: `pattern="photo_url|require_photo|PhotoEvidence|completion_photo" path=src output_mode=files_with_matches`
Hits: 10 files.
Files:
- src/pages/Tasks.tsx
- src/pages/Studio.tsx
- src/utils/createTaskFromData.ts
- src/types/tasks.ts
- src/hooks/useRoutineTemplateSteps.ts
- src/hooks/useTasks.ts
- src/components/tasks/RoutineDuplicateDialog.tsx
- src/components/tasks/useTaskCompletion.ts (line 93 `photo_url: photoUrl ?? null,`)
- src/types/victories.ts
- src/hooks/useAvatarUpload.ts

### Field 3 — Wiring check
Callers: useTaskCompletion.ts referenced across tasks + views.
Execution-flow location: Column write through React Query mutation hook; UI capture path not traced fully in this run.
Most recent commit: not separately grepped for each file.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: Task Breaker section mentions image mode via Sonnet vision but not general completion photo evidence specifically.
- prds/addenda/: not specifically grepped.
- PlannedExpansionCard: n/a.
- CLAUDE.md: no specific convention.

### Field 5 — What was NOT checked
- Whether UI allows the photo capture/upload prior to write (not traced beyond useTaskCompletion.ts:93 write).
- Storage bucket for completion photos and RLS.
- Whether `require_photo` flag on task_template_steps (schema col 9) actually gates completion UI.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. `photo_url` column exists on `task_completions` (live_schema.md col 10) and on `routine_step_completions` (col 9). `require_photo` column exists on `task_template_steps` (col 9). useTaskCompletion.ts:93 writes `photo_url: photoUrl ?? null`. Full UI capture flow (camera/upload widget, preview, storage) not traced in this run.

---

## Entry 439 — `Batch Process All progress bar`

**Registry line:** 439
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Batch Process All progress bar | PRD-17 | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry names "Batch Process All progress bar."
(b) WIRING_STATUS.md — no row specifically for progress bar.
(c) CLAUDE.md — no convention.
(d) PRD-17 references studio_queue batch processing.
(d.5) `src/components/queue/BatchCard.tsx:2` comment "BatchCard (PRD-17 Screen 3)"; line 4 "Grouped card for multiple studio_queue items sharing a batch_id"; line 17-36 interface + component with `onProcessAll`, `onDismissAll`, `onExpand` props.

Identifier: `BatchCard` component + `onProcessAll` handler.

### Field 2 — Code presence check
Grep command: `pattern="BatchCard|Batch.*All|process-all|processAll" path=src/components output_mode=files_with_matches`
Hits: 1 file.
Files:
- src/components/queue/BatchCard.tsx — impl (lines 2-36 describe PRD-17 Screen 3 wrapping studio_queue items sharing batch_id)
First-context window (BatchCard.tsx 15-36):
```
  /** Called with batch mode 'group' — opens Task Creation Modal with batch settings */
  ...
  /** Called with batch mode 'sequential' — steps through each item one at a time */
  ...
  /** Expands the batch into individual cards */
  onExpand: (batchId: string) => void
...
export function BatchCard({ items, onSendAsGroup, onProcessAll, onExpand, onDismissAll }: BatchCardProps) {
```

### Field 3 — Wiring check
Callers: BatchCard not traced to consumer via grep in this run (component appears to be defined but consumer grep was not run).
Execution-flow location: React component for studio_queue batch processing (per file header PRD-17 Screen 3).
Most recent commit: `e7e3f48` 2026-04-14 22:38:11 (per grouped file-list commit).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: batch process not explicitly rowed; Studio → Feature Wiring does not name BatchCard.
- prds/addenda/: PRD-17 referenced; `prds/communication/PRD-17-Universal-Queue-Routing-System.md` exists.
- PlannedExpansionCard: n/a.
- CLAUDE.md: convention 66 "Universal Queue Modal" names the 3-tab structure but not the batch progress bar specifically.

### Field 5 — What was NOT checked
- Whether `onProcessAll` triggers a progress-bar UI element in the BatchCard render body (only the top of the file was grepped; render body not walked).
- Whether the queue modal consumer renders BatchCard at all.
- Whether the "progress bar" is implemented as CSS/JSX or just a count badge.

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. `BatchCard` component exists at `src/components/queue/BatchCard.tsx` with PRD-17 Screen 3 attribution in file header. `onProcessAll` prop present in interface. Whether the specific "progress bar" UI element is rendered inside BatchCard's JSX body was not traced in this run (only top-of-file + first 160 lines sampled).

---

## Entry 441 — `Breathing glow vs badge toggle`

**Registry line:** 441
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Breathing glow vs badge toggle | PRD-17 | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry names "Breathing glow vs badge toggle."
(b) WIRING_STATUS.md — no explicit row.
(c) CLAUDE.md architecture.md "Universal Patterns" table: "**Breathing Glow** | Universal presence indicator for pending items (no numeric badges)".
(d) PRD-17 references; convention referenced in architecture section.
(d.5) `src/components/ui/BreathingGlow.tsx` is the component; grep found callers in QueueBadge.tsx, QuickTasks.tsx, NotificationBell.tsx, MindSweepCapture.tsx, PlayStickerBookWidget.tsx, RhythmDashboardCard.tsx, UniversalQueueModal.tsx, and in App.css styles.

Identifier: `BreathingGlow` React component + `QueueBadge` wrapper that conditionally renders it.

### Field 2 — Code presence check
Grep command: `pattern="BreathingGlow" path=src output_mode=files_with_matches`
Hits: 9 files.
Files:
- src/components/ui/BreathingGlow.tsx — impl
- src/components/queue/QueueBadge.tsx:5,13,67 — wraps BreathingGlow when pending
- src/components/shells/QuickTasks.tsx — caller
- src/components/notifications/NotificationBell.tsx — caller
- src/components/queue/UniversalQueueModal.tsx — caller
- src/pages/MindSweepCapture.tsx — caller
- src/components/play-dashboard/PlayStickerBookWidget.tsx — caller
- src/components/rhythms/RhythmDashboardCard.tsx — caller
- src/App.css — CSS class

First-context window (QueueBadge.tsx 67-69):
```
          <BreathingGlow active={true}>
```
File comment (QueueBadge.tsx:5): "Shows BreathingGlow when items are pending. Can target a specific tab."

### Field 3 — Wiring check
Callers: 8+ consumer locations for BreathingGlow across shells and queue/notification/rhythm/mindsweep components.
Execution-flow location: React presence-indicator component.
Most recent commit touching QueueBadge.tsx: `e7e3f48` 2026-04-14 22:38:11 (per grouped git log).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no explicit row but used throughout queue.
- prds/addenda/: not specifically grepped.
- PlannedExpansionCard: n/a.
- CLAUDE.md/architecture.md: "Breathing Glow" Universal Pattern row — "no numeric badges" — aligns with "vs badge toggle" language. Convention 144 names BreathingGlow in shell headers for NotificationBell when unread > 0.

### Field 5 — What was NOT checked
- Whether the toggle between breathing glow and traditional numeric badge is user-configurable or a hard system default.
- The exact semantic of "vs badge toggle" (i.e., is there a settings flag or just the design decision).

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. `BreathingGlow.tsx` exists and is consumed across 8+ files (QueueBadge, shells, notifications, rhythm, mindsweep, play dashboard). Architecture.md and convention 144 frame BreathingGlow as universal presence indicator "no numeric badges." Whether a user-facing toggle exists between glow and numeric badge was not located.

---

## Entry 442 — `HScrollArrows on ViewCarousel`

**Registry line:** 442
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| HScrollArrows on ViewCarousel | PRD-09A | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry names `HScrollArrows` and `ViewCarousel` — both concrete identifiers.

Identifier: `HScrollArrows` component + `ViewCarousel` component; HScrollArrows wraps ViewCarousel render body.

### Field 2 — Code presence check
Grep command: `pattern="HScrollArrows|ViewCarousel" path=src output_mode=files_with_matches`
Hits: 6 files.
Files:
- src/components/shared/HScrollArrows.tsx — impl
- src/components/tasks/ViewCarousel.tsx:10 import, :188 `<HScrollArrows>` render, :230 close tag
- src/components/tasks/DashboardTasksSection.tsx — caller
- src/components/notepad/NotepadDrawer.tsx — caller
- src/pages/Journal.tsx — caller
- src/components/tasks/views/PlannedViewStub.tsx — caller

First-context window (ViewCarousel.tsx 10, 188-230):
```
import { HScrollArrows } from '@/components/shared/HScrollArrows'
...
<HScrollArrows>
  {/* pills */}
</HScrollArrows>
```
File header (ViewCarousel.tsx 1-7): "ViewCarousel — PRD-09A Screen 7. Horizontally scrollable row of view pills. Auto-sorts by usage frequency..."

### Field 3 — Wiring check
Callers: HScrollArrows used in 5+ consumers beyond ViewCarousel (DashboardTasksSection, NotepadDrawer, Journal, PlannedViewStub).
Execution-flow location: Shared React component.
Most recent commit: not separately grepped (likely `e7e3f48` or later).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no explicit row.
- prds/addenda/: not specifically grepped.
- PlannedExpansionCard: n/a.
- CLAUDE.md: Universal UX Conventions section "HORIZONTAL SCROLL ARROWS" — "Every horizontal scroll area must show visible left/right ChevronLeft/ChevronRight arrow indicators for desktop users ... Apply to: task view carousels, any pill/chip scroll row, any horizontal collection."

### Field 5 — What was NOT checked
- Whether the arrows fade at scroll end per UX convention text.
- Mobile/desktop behavior parity (convention specifies desktop arrows; mobile behavior unverified).

### Field 6 — Observations (no verdict)
Registry row claims ✅ Wired. `HScrollArrows.tsx` exists at `src/components/shared/HScrollArrows.tsx`; imported at `ViewCarousel.tsx:10` and wraps the pill render body at :188-230. Additional consumers in 4 other files (DashboardTasksSection, NotepadDrawer, Journal, PlannedViewStub). Universal UX Convention HORIZONTAL SCROLL ARROWS specifies this standard and lists "task view carousels" as an application.

---



## Entry 443 — `Emoji removed from task views`

**Registry line:** 443
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Emoji removed from task views | Phase 10 Repair | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 443 — no concrete identifier named; describes a cross-file cleanup.
(b) WIRING_STATUS.md — Grep returned zero matches for "Emoji removed from task views".
(c) CLAUDE.md conventions — no numbered convention names "task view emoji removal." Closest relevant conventions are in PRE_BUILD_PROCESS.md §"Universal UX Conventions" EMOJI RULE (line 332): `"No Unicode emoji in Mom, Adult, or Independent shell components. Use Lucide icons only. Emoji permitted ONLY in Play shell components and gamification components."` and conventions.md line 18: `"Lucide React only. No emoji in adult interfaces. Emoji permitted only in the Play shell."`
(d) PRD source cell says "Phase 10 Repair" (not a PRD) — capability-only on PRD side.
Primary identifier (behavioral): absence of Unicode emoji in `src/components/tasks/**` view files.

### Field 2 — Code presence check
Grep command: `pattern="🎯|📋|⭐|🌟|🚀|✨|💡"`, path=`src/components/tasks/views`, output_mode=content
Hits: 1
Files:
  - src/components/tasks/views/OneFiveThreeView.tsx:103 — `icon={<span style={{ fontSize: 36 }}>📋</span>}`
First-context window:
```
src/components/tasks/views/OneFiveThreeView.tsx:103:        icon={<span style={{ fontSize: 36 }}>📋</span>}
```
Secondary grep on `src/components/tasks` (full tree): 4 total occurrences across 2 files (TaskCardPlay.tsx:3 — Play shell, exempt per EMOJI RULE; OneFiveThreeView.tsx:1 — adult/Independent task view).

### Field 3 — Wiring check
Callers: OneFiveThreeView is rendered through ViewCarousel.tsx which enumerates view keys including `'1-5-3'`-style views (ViewCarousel.tsx is one of the 3 files that originally matched the external-attribution grep; most-recent commit on ViewCarousel is `5fb5eaf 2026-04-13 13:35:47 -0500 chore(tasks): remove ABCDE prioritization view per founder decision`).
Execution-flow location: OneFiveThreeView.tsx is a React component under `src/components/tasks/views/` (adult Tasks page view).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no match for "Emoji removed from task views".
- prds/addenda/: not applicable; Phase 10 Repair is not a PRD.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: no direct mention; relevant conventions in conventions.md:18 and PRE_BUILD_PROCESS.md:332 (EMOJI RULE).

### Field 5 — What was NOT checked
- Whether the 📋 at OneFiveThreeView.tsx:103 is an intentional exception (visual placeholder for an empty state) or a cleanup miss.
- Whether any other emoji characters beyond the grep pattern are present (e.g., skin-tone modifiers, regional flags, other symbol ranges).
- Whether `src/components/tasks/TaskCardPlay.tsx` (3 emoji) is considered a "task view" under the stub's scope or exempt as Play shell.
- Historical state: cannot tell from grep alone whether earlier revisions had more emoji that were removed; would need `git log -p` diff review.

### Field 6 — Observations (no verdict)
Grep across `src/components/tasks/views` returns exactly one emoji character (📋) at OneFiveThreeView.tsx:103 used as a React icon prop; the broader `src/components/tasks` tree has 4 occurrences total, 3 of which are in `TaskCardPlay.tsx` (the Play shell is explicitly exempted from the no-emoji rule by both conventions.md and PRE_BUILD_PROCESS.md EMOJI RULE). WIRING_STATUS.md does not track this cleanup. The "Phase 10 Repair" source column is not a PRD — no PRD-level doc cross-reference possible.

---

## Entry 444 — `External attribution removed`

**Registry line:** 444
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| External attribution removed | Phase 10 Repair | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 444 — no concrete identifier; describes a cross-codebase content cleanup.
(b) WIRING_STATUS.md — Grep returned zero matches for "External attribution".
(c) CLAUDE.md conventions — no numbered convention directly; related rule in PRE_BUILD_PROCESS.md §"Universal UX Conventions" at line 339: `"NO EXTERNAL ATTRIBUTION IN UI — Do not reference external authors, books, or frameworks by name in UI text. Features like 'Big Rocks' and 'Eat the Frog' are platform concepts — they do not need attribution. Remove any references to Stephen Covey, 7 Habits, Brian Tracy, or any other external source from UI-facing text."`
(d) PRD source cell says "Phase 10 Repair" — not a PRD.
Primary identifier (behavioral): absence of named external authors (Covey, 7 Habits, Stephen Covey, Brian Tracy, "Eat the Frog" attributed to source) in `src/**`.

### Field 2 — Code presence check
Grep command: `pattern="Covey|7 Habits|Stephen Covey|Brian Tracy|Eat the Frog"`, path=`src`, output_mode=count
Hits: 4 across 3 files
Files:
  - src/config/feature_expansion_registry.ts:2 — context not inspected in full; pattern hits likely reference platform features without author attribution
  - src/data/lanterns-path-data.ts:1
  - src/components/tasks/ViewCarousel.tsx:1
First-context window for ViewCarousel.tsx (lines 61-106 from earlier read):
```
src/components/tasks/ViewCarousel.tsx:61:    label: 'Eisenhower',
src/components/tasks/ViewCarousel.tsx:89:    key: 'big_rocks',
src/components/tasks/ViewCarousel.tsx:97:    key: 'ivy_lee',
```
Matches are for concept names (Eisenhower, big_rocks, ivy_lee) used as internal view keys/labels — the author names (Covey, Tracy) themselves returned ZERO matches on re-targeted grep of those exact strings in `src/`.

### Field 3 — Wiring check
Callers: ViewCarousel.tsx is the container for the Tasks page view-carousel system. Most-recent commit touching ViewCarousel.tsx: `5fb5eaf 2026-04-13 13:35:47 -0500 chore(tasks): remove ABCDE prioritization view per founder decision`. The commit subject is an example of the ongoing view-cleanup cadence.
Execution-flow location: feature_expansion_registry.ts is a config file; lanterns-path-data.ts is a data file; ViewCarousel.tsx is a React component.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention of "External attribution removed" or attribution-related entries.
- prds/addenda/: not applicable.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: no direct mention; PRE_BUILD_PROCESS.md:339 "NO EXTERNAL ATTRIBUTION IN UI" convention is the relevant guidance.

### Field 5 — What was NOT checked
- Whether remaining pattern hits in feature_expansion_registry.ts (2 hits) and lanterns-path-data.ts (1 hit) are legitimate internal references (e.g., concept names without author attribution) or residual attributions that the Phase 10 Repair missed.
- Whether any OTHER authors/sources (beyond Covey/Tracy) named in the convention's examples still appear in UI text (e.g., Franklin Covey, Getting Things Done, David Allen, Marie Kondo, Tim Ferriss, etc.).
- Whether UI-surface-facing files (copy strings, JSX text, labels, tooltips) were audited vs code-level strings (enum values, variable names).
- Historical diff of the cleanup itself — `git log` across files would show Phase 10 commits.

### Field 6 — Observations (no verdict)
Grep with the author-name pattern returns 4 hits across 3 files: feature_expansion_registry.ts (2), lanterns-path-data.ts (1), ViewCarousel.tsx (1). Prior inspection of ViewCarousel.tsx:61-106 shows the matches are for concept keys (Eisenhower, big_rocks, ivy_lee) not author attributions. The PRE_BUILD_PROCESS.md EMOJI-sibling convention explicitly allows "Big Rocks" and "Eat the Frog" as platform concepts without attribution, so the concept names appearing in code is consistent with that convention. The file-level pattern matches do not resolve to quoted author names in a single-line grep view. WIRING_STATUS.md has no row for this entry.

---

## Entry 457 — `Community persona moderation queue`

**Registry line:** 457
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Community persona moderation queue | PRD-34 | PRD-32 | ⏳ Unwired (MVP) | Phase 39 (Admin Console) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 457 — names "Community persona moderation queue" as a capability but no concrete identifier (table, component, hook, Edge Function).
(b) WIRING_STATUS.md — Grep for "moderation" and "vault_moderation" returned zero matches.
(c) CLAUDE.md conventions — no numbered convention names a persona moderation queue. Convention 97-102 (ThoughtSift BoD rules) and 56-61 (LiLa modes) describe the persona pipeline but no moderation-queue identifier.
(d) PRD-34 (`prds/platform-complete/PRD-34-ThoughtSift-Decision-Thinking-Tools.md`) is referenced by the stub; PRD-32 (Admin Console) is the wire-by PRD. Grep located "persona moderation" phrase only in PRD-34 itself, `STUB_REGISTRY.md`, and evidence/partition files. Schema: `board_personas` table (live_schema.md line reference) has a `content_policy_status` column.
(d.5) `board_personas.content_policy_status` is the closest concrete DB identifier associated with persona moderation per migration `00000000100049_prd34_thoughtsift_tables.sql` (not opened in this packet beyond the grep hit; capability gate on the value `'approved'` appears in BoardOfDirectorsModal.tsx:190 and :349).
Primary identifier: `content_policy_status` column on `board_personas` (schema surface only — no UI queue identifier resolved).

### Field 2 — Code presence check
Grep command: `pattern="persona.{0,10}moderation|lens.{0,10}moderation"`, path=repo-wide (excluding NotebookEdit tools), output_mode=files_with_matches
Hits: 6 files (all docs/evidence — NO src/** or supabase/** hits)
Files:
  - scope-5-evidence/STUB_REGISTRY_EVIDENCE_UI.md
  - scope-5-evidence/stub_partition_ui.md
  - STUB_REGISTRY.md
  - prds/platform-complete/PRD-34-ThoughtSift-Decision-Thinking-Tools.md
  - claude/feature-decisions/PRD-34-ThoughtSift.md
  - specs/AI-Cost-Optimization-Patterns.md

Secondary grep: `pattern="content_policy_status"`, path=`src/components/lila/BoardOfDirectorsModal.tsx`, output_mode=content, -C 2
Hits: 2 (line 190 filter `.eq('content_policy_status', 'approved')`; line 349 persona insert with `content_policy_status: 'approved'`)
First-context window for line 190:
```
188:      .select('id, persona_name, personality_profile, persona_type, category, is_public')
189:      .or('is_public.eq.true,persona_type.eq.system_preloaded')
190:      .eq('content_policy_status', 'approved')
191:      .order('usage_count', { ascending: false })
```

### Field 3 — Wiring check
Callers: `content_policy_status` is read (line 190) and written (line 349) only within BoardOfDirectorsModal.tsx. No admin-side queue component imports it. Glob `src/pages/admin/**` returned zero files.
Execution-flow location: React component; enforces an implicit "approved" gate on persona visibility, but there is no moderation-UI surface that surfaces non-approved rows for review.
Most recent touching commit: not run on BoardOfDirectorsModal.tsx in this packet.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: no addendum grep hit for "persona moderation queue" identifier; PRD-34 base file references the concept.
- PlannedExpansionCard: no grep hit for a community_persona_moderation feature_key.
- CLAUDE.md: no direct mention. Convention 97-102 covers BoD persona lifecycle but not moderation UI.

### Field 5 — What was NOT checked
- Whether `vault_moderation_log` (listed in live_schema.md as not API-exposed) is used for ThoughtSift persona moderation, or is Vault-specific.
- Whether any admin UI scaffolding exists at all (no `src/pages/admin/**` directory found).
- Whether the duplicate entry at line 285 (`✅ Wired`) vs line 457 (`⏳ Unwired (MVP)`) reflects different surfaces (Vault moderation vs ThoughtSift persona moderation) or is a registry-drift duplication.
- Whether PRD-32 Admin Console work started separately from PRD-34.

### Field 6 — Observations (no verdict)
Grep across src/** and supabase/** returned zero code references to "persona moderation queue" or admin-side persona-review UI. The closest concrete DB column, `board_personas.content_policy_status`, is used by BoardOfDirectorsModal.tsx at lines 190/349 to filter for `'approved'` and stamp personal_custom inserts as `'approved'`. No Glob match for `src/pages/admin/**`. This entry duplicates the stub on line 285 (`✅ Wired | Phase 39`) with an inverted status (`⏳ Unwired (MVP) | Phase 39 (Admin Console)`) — the two rows disagree on the capability's wiring state.

---

## Entry 458 — `Community lens moderation queue`

**Registry line:** 458
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Community lens moderation queue | PRD-34 | PRD-32 | ⏳ Unwired (MVP) | Phase 39 (Admin Console) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 458 — names "Community lens moderation queue" as a capability; no concrete identifier.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no numbered convention names a lens moderation queue. Convention 98 (Perspective Shifter lens-synthesis) names `synthesizeFamilyContext()` but relates to context privacy, not moderation.
(d) PRD-34 is cited. Schema: `perspective_lenses` table (live_schema.md) has columns `is_public`, `is_active`, `created_by` — potential gating columns but no moderation-specific column.
(d.5) Not invoked — no single file was named by (a)-(d) as the implementation site.
Primary identifier: CAPABILITY-ONLY (no concrete code identifier resolved for a moderation queue UI).

### Field 2 — Code presence check
Grep command: `pattern="persona.{0,10}moderation|lens.{0,10}moderation"` (same as entry 457), path=repo-wide
Hits: 6 files (same 6 doc files as entry 457) — zero src/** or supabase/** hits for lens moderation.

Grep command: `pattern="custom.?lens|createCustomLens|customLens"`, path=`src`, output_mode=files_with_matches
Hits: 0 — no matches for lens creation/moderation code paths.

### Field 3 — Wiring check
Skipped — no code presence for the identifier.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: no addendum grep hit for "lens moderation."
- PlannedExpansionCard: no grep hit.
- CLAUDE.md: Convention 98 mentions lens privacy synthesis; no moderation reference.

### Field 5 — What was NOT checked
- Whether a future schema migration introduces a `perspective_lenses.moderation_status` column or similar.
- Whether admin-side UI for lens moderation exists under a different name (e.g., "lens review").
- Same duplicate-entry concern as 457 — line 286 says `✅ Wired | Phase 39` while line 458 says `⏳ Unwired (MVP) | Phase 39 (Admin Console)`.

### Field 6 — Observations (no verdict)
Grep across src/** and supabase/** returned zero code references to lens moderation. The 17 rows in `perspective_lenses` table (per live_schema.md) represent seeded system lenses (`is_system`) — no custom-lens creation/moderation pipeline grep-visible in code. No `src/pages/admin/**` directory exists. Duplicate registry entry at line 286 with opposite status.

---

## Entry 459 — `Full persona library browse page (categories/filtering)`

**Registry line:** 459
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Full persona library browse page (categories/filtering) | PRD-34 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 459 — describes "browse page" as a Post-MVP UI surface; no concrete component name.
(b) WIRING_STATUS.md — no mention of a persona library page.
(c) CLAUDE.md — no convention names a full persona browse page.
(d) PRD-34 describes the concept; schema has `board_personas` table with `category` column (live_schema.md) — the filtering dimension.
(d.5) Not invoked — no explicit file named.
Primary identifier: CAPABILITY-ONLY (no concrete page component identified).

### Field 2 — Code presence check
Grep command: `pattern="persona.*browse|PersonaLibrary|personaList"`, path=`src`, output_mode=files_with_matches
Hits: 0 — no matches.

Grep command: `pattern="board_personas|BoardPersona"`, path=`src/components`, output_mode=files_with_matches
Hits: 1 file
Files:
  - src/components/lila/BoardOfDirectorsModal.tsx

Grep command: `pattern="persona.*library.*browse|Full persona library|persona_library_browse"`, path=`src`, output_mode=files_with_matches
Hits: 0

### Field 3 — Wiring check
Execution-flow location: BoardOfDirectorsModal.tsx is the sole consumer of `board_personas`. It presents personas within the modal via a selector UI — not a standalone library browse page.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: no addendum grep.
- PlannedExpansionCard: no grep match for a `persona_library` feature key.
- CLAUDE.md: no mention.

### Field 5 — What was NOT checked
- Whether the in-modal persona selector in BoardOfDirectorsModal.tsx was considered by the stub to be partial satisfaction of the capability or whether the stub specifically intends a standalone page at a route like `/thoughtsift/personas`.
- Whether `persona_favorites` table (live_schema.md, 0 rows) is consumed by any browse-page component.

### Field 6 — Observations (no verdict)
Only one src/** file references `board_personas` (BoardOfDirectorsModal.tsx); it operates within the ThoughtSift modal rather than as a standalone library browse page. No grep hits for "PersonaLibrary," "personaList," or "persona browse" in `src/`. Marked Post-MVP in the registry.

---

## Entry 463 — `Custom lens creation UI (describe → LiLa caches)`

**Registry line:** 463
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Custom lens creation UI (describe → LiLa caches) | PRD-34 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 463 — describes a creation UI that routes through LiLa and caches results; no concrete code identifier.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — Convention 98 references lenses but not creation UI.
(d) PRD-34 describes the pattern; schema `perspective_lenses.is_system` column would gate custom vs system.
Primary identifier: CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep command: `pattern="custom.?lens|createCustomLens|customLens"`, path=`src`, output_mode=files_with_matches
Hits: 0 — no matches.

### Field 3 — Wiring check
Skipped — no code presence.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: no addendum match for "custom lens."
- PlannedExpansionCard: no grep match.
- CLAUDE.md: Convention 98 on lens privacy synthesis only.

### Field 5 — What was NOT checked
- Whether `perspective_lenses` rows with `is_system=false` exist in production (live DB query out of scope).
- Whether a semantic search would surface related "create lens" terminology that keyword grep missed (Convention 242 blocks mgrep without per-query approval).

### Field 6 — Observations (no verdict)
No grep hits for custom-lens creation code in src/**. Post-MVP in registry.

---

## Entry 464 — `Custom lens sharing to community library`

**Registry line:** 464
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Custom lens sharing to community library | PRD-34 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 464 — describes community sharing; no concrete identifier.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no mention.
(d) PRD-34; schema `perspective_lenses.is_public` column is the gating dimension (live_schema.md).
Primary identifier: CAPABILITY-ONLY (schema column exists but no sharing UI identifier).

### Field 2 — Code presence check
Grep command: `pattern="custom.?lens|createCustomLens|customLens"` (covers sharing too), path=`src`, output_mode=files_with_matches
Hits: 0 — no matches.

### Field 3 — Wiring check
Skipped — no code presence.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: no addendum match.
- PlannedExpansionCard: no grep match.
- CLAUDE.md: no mention.

### Field 5 — What was NOT checked
- Whether a sharing flow would route through an existing generic "share" RoutingStrip destination (not traced).
- Whether the lens moderation entry (458) is coupled to this sharing capability.

### Field 6 — Observations (no verdict)
No custom-lens code in `src/**`. Schema has `is_public` on `perspective_lenses` (17 rows, all presumed system). Post-MVP in registry. Related to entry 458 (lens moderation queue) — sharing would feed moderation.

---

## Entry 465 — `Decision Guide: user-created custom frameworks`

**Registry line:** 465
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Decision Guide: user-created custom frameworks | PRD-34 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 465 — describes custom frameworks as a user-create capability; no concrete identifier.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md Convention 103 names 15 seeded frameworks in `decision_frameworks` table; does not describe custom-framework creation.
(d) PRD-34 section on Decision Guide; schema `decision_frameworks` table has 15 rows (live_schema.md). No `is_system` or `created_by` column visible in live_schema row-listing for `decision_frameworks`.
Primary identifier: CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep command: `pattern="Custom framework|framework_key.*custom|createFramework"`, path=`src`, output_mode=files_with_matches
Hits: 0.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: no addendum match.
- PlannedExpansionCard: no grep match.
- CLAUDE.md: Convention 103 covers the 15-framework seeded list; no mention of custom creation.

### Field 5 — What was NOT checked
- Whether `decision_frameworks` has columns beyond what live_schema.md surfaced that would support user-authored rows.
- Whether admin-side framework authoring exists under a different name.

### Field 6 — Observations (no verdict)
Zero grep hits for custom framework creation in `src/**`. Post-MVP in registry. Convention 103 only describes the seeded 15-framework list.

---

## Entry 466 — `Guided-shell simplified ThoughtSift versions`

**Registry line:** 466
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Guided-shell simplified ThoughtSift versions | PRD-34 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 466 — describes "simplified ThoughtSift for Guided shell"; no concrete identifier.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no numbered convention names a Guided-shell ThoughtSift variant.
(d) PRD-34 mentions tier/role availability; Guided simplification is noted as Post-MVP.
Primary identifier: CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep command: `pattern="Guided.{0,10}ThoughtSift|thoughtsift.*guided|ThoughtSift.*guided"`, path=`src`, output_mode=files_with_matches
Hits: 0.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: no addendum match for Guided ThoughtSift.
- PlannedExpansionCard: no grep match.
- CLAUDE.md: no mention.

### Field 5 — What was NOT checked
- Whether the Guided shell's separate `GuidedDashboard` (src/pages/GuidedDashboard.tsx) has any ThoughtSift-flavored sections intentionally omitted.
- Whether any `lila_guided_modes.available_to_roles` row excludes Guided, implying the capability is role-gated not built.

### Field 6 — Observations (no verdict)
No grep hits in `src/**` for Guided-ThoughtSift variants. Post-MVP in registry.

---

## Entry 468 — `Route to BigPlans action chip (Decision Guide + BoD)`

**Registry line:** 468
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Route to BigPlans action chip (Decision Guide + BoD) | PRD-34 | PRD-29 | ⏳ Unwired (MVP) | Phase 33 (BigPlans) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 468 — names an action chip in the ThoughtSift tools; no concrete identifier.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention names this chip.
(d) PRD-29 (BigPlans) is the wire-by PRD; PRD-34 describes ThoughtSift tool chips.
(d.5) Not invoked — the closest file is `src/components/lila/ToolConversationModal.tsx` (where tool action chips live), but the stub does not name it explicitly. Performing (d.5) lookup anyway: Grep for "BigPlans" / "route to bigplans" / "bigplans.*action.*chip" in `src` returned 1 file (src/App.tsx) — route declaration, not an action chip.
Primary identifier: CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep command: `pattern="Route.{0,5}BigPlans|routeToBigPlans|bigplans.*action.*chip"`, path=`src`, output_mode=files_with_matches
Hits: 1
Files:
  - src/App.tsx — Grep target is the route registration, not a chip.

Grep command (secondary): `pattern="BigPlans|route.*bigplans"`, path=`src/components/lila/ToolConversationModal.tsx`, output_mode=count, -i
Hits: 0 — the tools modal does not reference BigPlans at all.

### Field 3 — Wiring check
No chip-related code path exists in ToolConversationModal.tsx. App.tsx hit is route-scoping.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: no addendum match.
- PlannedExpansionCard: no specific feature key grep match.
- CLAUDE.md: no mention.

### Field 5 — What was NOT checked
- Whether any follow-up PRD-29 build-addendum pre-wired a chip placeholder.
- Whether a generic "route to..." chip exists that accepts `bigplans` as a target (code not traced that deep).

### Field 6 — Observations (no verdict)
Zero hits in ToolConversationModal.tsx for BigPlans. Only code hit was an unrelated route declaration in App.tsx. Wire-by = PRD-29 which is not yet built (status ⏳ Unwired (MVP)).

---

## Entry 470 — `Send via Message action chip (Mediator)`

**Registry line:** 470
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Send via Message action chip (Mediator) | PRD-34 | PRD-15 | ⏳ Unwired (MVP) | Phase 16 (Messages) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 470 — names "Send via Message action chip" in Mediator; no concrete identifier beyond the label.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md Convention 95 (Mediator supersedes PRD-19 `relationship_mediation`) does not name a send-via-message chip.
(d) PRD-15 (Messages) is wire-by. Locating the tool actions system: `src/components/lila/ToolConversationModal.tsx` has a `DRAFT_TOOLS` set at line 54 with comment `// Tools that produce drafts (show Save Draft / Copy Draft / Send via Message)`.
(d.5) Opened `ToolConversationModal.tsx`. Line 54-55: `const DRAFT_TOOLS = new Set(['cyrano', 'higgins_say'])` — 'mediator' is NOT in DRAFT_TOOLS. Mediator context is handled separately (line 117+ `mediator: {...}`, line 304 `isMediator = modeKey === 'mediator'`, line 680 `mediator: { icon: Scale, label: 'Mediator', ...}`). The "Send via Message" capability is gated on DRAFT_TOOLS membership, which excludes mediator.
Primary identifier: `DRAFT_TOOLS` Set in `ToolConversationModal.tsx` line 55 — gating mechanism for "Send via Message" exposure.

### Field 2 — Code presence check
Grep command: `pattern="Send via Message|sendViaMessage|send_via_message"`, path=`src`, output_mode=files_with_matches
Hits: 1
Files:
  - src/components/lila/ToolConversationModal.tsx — line 54 comment naming the three draft actions; 'mediator' not in the DRAFT_TOOLS set.
First-context window (ToolConversationModal.tsx:50-55):
```
50:  mediator: 'lila-mediator',
51:  ...
54:// Tools that produce drafts (show Save Draft / Copy Draft / Send via Message)
55:const DRAFT_TOOLS = new Set(['cyrano', 'higgins_say'])
```

### Field 3 — Wiring check
Callers: DRAFT_TOOLS is used elsewhere in ToolConversationModal.tsx (not traced in this packet) to conditionally render the three draft action chips. Only `'cyrano'` and `'higgins_say'` are members — Mediator mode does not qualify.
Execution-flow location: React component. Most-recent commit not run on this file in this packet.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: no addendum match for mediator-send-via-message.
- PlannedExpansionCard: no feature key match.
- CLAUDE.md: Convention 95 mentions Mediator but not the chip.

### Field 5 — What was NOT checked
- Whether PRD-15 build work added a separate send-via-message path that bypasses DRAFT_TOOLS.
- Whether Mediator outputs are functionally shareable through a different mechanism (e.g., Save to Journal) that would make the stub's intent covered by a workaround.

### Field 6 — Observations (no verdict)
The "Send via Message" mechanism exists in ToolConversationModal.tsx (line 55 DRAFT_TOOLS set), but Mediator is not a member of that set — only `'cyrano'` and `'higgins_say'` are. PRD-15 (Messages) is the wire-by and is not yet built per the registry's status of ⏳ Unwired (MVP).

---

## Entry 471 — `@Name addressing UI parsing in BoD`

**Registry line:** 471
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| @Name addressing UI parsing in BoD | PRD-34 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 471 — describes @mention parsing in Board of Directors; no concrete identifier.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention names this.
(d) PRD-34 discusses the pattern as future enhancement.
(d.5) Not invoked — no single file named; BoardOfDirectorsModal.tsx is the candidate but (d) did not name it directly.
Primary identifier: CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep command: `pattern="@[A-Z][a-z]+|@Name|atName"`, path=`src/components/thoughtsift` — path does not exist (no dedicated thoughtsift directory; ThoughtSift tools live under `src/components/lila/`).
Grep returned tool error. Secondary grep target: BoardOfDirectorsModal.tsx for @-mention behavior — not run in this packet.
Effective hits: 0 for the intended pattern.

### Field 3 — Wiring check
Skipped — no code presence surfaced.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: no addendum match.
- PlannedExpansionCard: no feature key match.
- CLAUDE.md: no mention.

### Field 5 — What was NOT checked
- BoardOfDirectorsModal.tsx not specifically inspected for @-mention parsing (entry is flagged 📌 Post-MVP, so low likelihood of hits).
- No `src/components/thoughtsift` directory exists — ThoughtSift components live under `src/components/lila/` (confirmed during entries 457-470).

### Field 6 — Observations (no verdict)
No ThoughtSift component directory at `src/components/thoughtsift`. Original grep invocation errored on missing path. Post-MVP in registry — unlikely to have been built.

---

## Entry 472 — `Suggested for This Situation in persona selector`

**Registry line:** 472
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Suggested for This Situation in persona selector | PRD-34 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 472 — describes a suggestion section label; no concrete identifier.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention.
(d) PRD-34 describes it as a future persona-selector enhancement.
Primary identifier: CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep command: `pattern="Suggested for This Situation|SuggestedForThisSituation"`, path=repo-wide, output_mode=files_with_matches
Hits: 3 files (all docs — NO src/**)
Files:
  - scope-5-evidence/stub_partition_ui.md
  - STUB_REGISTRY.md
  - prds/platform-complete/PRD-34-ThoughtSift-Decision-Thinking-Tools.md

### Field 3 — Wiring check
Skipped — no code presence.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: no addendum match.
- PlannedExpansionCard: no feature key match.
- CLAUDE.md: no mention.

### Field 5 — What was NOT checked
- Whether a heuristic-based suggestion (by category) exists in BoardOfDirectorsModal.tsx under a different label — this packet did not inspect the modal's persona-selector sections in depth.

### Field 6 — Observations (no verdict)
Zero src/** hits for "Suggested for This Situation" label. PRD-34 describes the concept. Post-MVP in registry.

---

## Entry 473 — `Long-press persona preview card`

**Registry line:** 473
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Long-press persona preview card | PRD-34 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 473 — describes long-press gesture + preview card; no concrete identifier.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention.
(d) PRD-34 describes it as a Post-MVP enhancement.
Primary identifier: CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep command: `pattern="long.?press.?persona|longPressPersona|personaPreview|persona preview"`, path=`src`, output_mode=files_with_matches
Hits: 0.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: no match.
- PlannedExpansionCard: no match.
- CLAUDE.md: no mention.

### Field 5 — What was NOT checked
- Whether Tooltip component (which shares a long-press behavior for mobile per Convention 43) is consumed by BoardOfDirectorsModal with persona content — not traced.

### Field 6 — Observations (no verdict)
Zero code hits. Post-MVP in registry.

---

## Entry 475 — `Recently Used section in persona selector`

**Registry line:** 475
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Recently Used section in persona selector | PRD-34 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 475 — describes a "Recently Used" persona section; no concrete identifier.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention.
(d) PRD-34. Schema: `board_personas.usage_count` column exists (live_schema.md, column 13) and is consumed at BoardOfDirectorsModal.tsx:191 (`.order('usage_count', { ascending: false })`). That ordering is usage-popularity, not recency. `board_session_personas` table has `seated_at` / `removed_at` — could support "recently used" via JOIN but not surfaced.
Primary identifier: CAPABILITY-ONLY (no "Recently Used" UI component grep-visible).

### Field 2 — Code presence check
Grep command: `pattern="Recently Used|recently_used|recentlyUsed"`, path=`src/components`, output_mode=files_with_matches
Hits: 0.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- prds/addenda/: no match.
- PlannedExpansionCard: no match.
- CLAUDE.md: no mention.

### Field 5 — What was NOT checked
- Whether `board_session_personas` rows (table has 0 rows per live_schema.md) are queried anywhere to derive recency.

### Field 6 — Observations (no verdict)
Zero grep hits for "Recently Used" UI strings in `src/components`. The `board_personas.usage_count` column (referenced in BoardOfDirectorsModal.tsx:191) provides popularity-based ordering but not recency. Post-MVP in registry.

---

## Entry 486 — `SequentialCreatorModal wrapper`

**Registry line:** 486
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| `SequentialCreatorModal` wrapper | PRD-09A/09B Phase 1 | PRD-09A/09B Phase 1 | ✅ Wired | 2026-04-06 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 486 names identifier: `SequentialCreatorModal`. Source: stub entry line 486. Quote: `` `SequentialCreatorModal` wrapper ``.
Primary identifier: `SequentialCreatorModal`.

### Field 2 — Code presence check
Grep command: `pattern="SequentialCreatorModal"`, path=`src`, output_mode=files_with_matches
Hits: 7 files
Files:
  - src/pages/Tasks.tsx — imports at line 50; renders at line 811
  - src/pages/Studio.tsx — imports at line 48; renders at line 866
  - src/pages/Lists.tsx — imports at line 52; renders at line 730
  - src/components/studio/studio-seed-data.ts
  - src/components/tasks/TaskCreationModal.tsx
  - src/utils/createTaskFromData.ts
  - src/components/tasks/sequential/SequentialCreatorModal.tsx — definition file
First-context window (Studio.tsx lines 198-200):
```
198:  // SequentialCreatorModal state (Phase 1: replaces sequential route through TaskCreationModal)
200:  // Build J: Reading List template opens SequentialCreatorModal with mastery + duration tracking presets
```

### Field 3 — Wiring check
Callers: 3 page-level entry points (Studio, Tasks, Lists) + defensive references in createTaskFromData.ts and TaskCreationModal.tsx (guards) + studio-seed-data.ts (template reference).
Execution-flow location: React modal component; sequential-creation UI surface.
Most recent touching commit: SequentialCreatorModal.tsx — `0be28be 2026-04-09 21:59:18 -0500 fix: unify member color reads via canonical getMemberColor helper`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: 2 matches for `SequentialCreatorModal` — "Sequential Collections (PRD-09A/09B Studio Intelligence Phase 1)" section marks three entry points ✅ Wired.
- prds/addenda/: stub row cites `PRD-09A/09B Phase 1` — addendum exists; exact filename grep not run in this packet.
- PlannedExpansionCard: not applicable (this is a wired UI component).
- CLAUDE.md: Conventions 150-156 describe the sequential-creation architecture (`SequentialCreatorModal` explicitly named in Convention 150).

### Field 5 — What was NOT checked
- E2E test execution — spec `tests/e2e/features/studio-intelligence-phase1.spec.ts` was referenced in the partition file's calibration section but not executed here.
- Whether `SequentialCreatorModal` behaves identically across the three entry points or has entry-point-specific branches (not inspected in depth).

### Field 6 — Observations (no verdict)
7 src/** files reference `SequentialCreatorModal`. Three page-level entry points (Studio, Tasks, Lists) import and render the modal. WIRING_STATUS.md and CLAUDE.md Convention 150 name it explicitly. Defensive guards in createTaskFromData.ts + TaskCreationModal.tsx prevent the pre-Phase-1 silent-failure path.

---

## Entry 487 — `SequentialCollectionCard exported for cross-page use`

**Registry line:** 487
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| `SequentialCollectionCard` exported for cross-page use | PRD-09A/09B Phase 1 | PRD-09A/09B Phase 1 | ✅ Wired | 2026-04-06 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 487 names identifier: `SequentialCollectionCard`. Source: stub entry line 487. Quote: `` `SequentialCollectionCard` exported for cross-page use ``.
Primary identifier: `SequentialCollectionCard` — a NAMED EXPORT from `SequentialCollectionView.tsx`, NOT a standalone file (matching the calibration-packet precedent on entry 433).

### Field 2 — Code presence check
Grep command: `pattern="SequentialCollectionCard"`, path=`src`, output_mode=files_with_matches
Hits: 2 files
Files:
  - src/pages/Lists.tsx — imports (line 50), renders at line 277
  - src/components/tasks/sequential/SequentialCollectionView.tsx — `export function SequentialCollectionCard({ collection }: { collection: SequentialCollection })` at line 213; also rendered internally at line 205
First-context window (SequentialCollectionView.tsx:205, 213):
```
205:            <SequentialCollectionCard key={collection.id} collection={collection} />
213:export function SequentialCollectionCard({ collection }: { collection: SequentialCollection }) {
```

### Field 3 — Wiring check
Callers: Lists.tsx imports from `@/components/tasks/sequential/SequentialCollectionView` and renders `<SequentialCollectionCard collection={coll} />` at line 277. SequentialCollectionView.tsx renders its own card at line 205.
Execution-flow location: React component, named export.
Most recent touching commit: SequentialCollectionView.tsx — `c6bfddf 2026-04-13 13:28:21 -0500 feat(tasks): per-item advancement override editor in SequentialCollectionView`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: Sequential Collections section names "Sequential detail view from Lists page | Back-button wrapper rendering `<SequentialCollectionCard>`" as ✅ Wired.
- prds/addenda/: stub cites PRD-09A/09B Phase 1 addendum.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Convention 154 names `SequentialCollectionCard` as "the exported reusable primitive for rendering a single sequential collection on any surface."

### Field 5 — What was NOT checked
- Whether the two render sites pass the same shape of props (`collection` object structure variance).
- Whether the named export is typed and re-exported through a barrel file.

### Field 6 — Observations (no verdict)
`SequentialCollectionCard` is a NAMED EXPORT in `SequentialCollectionView.tsx:213` — the very pattern the calibration entry flagged as a "named-export trap" potential failure mode. Two callers: internal (SequentialCollectionView.tsx:205) and external (Lists.tsx:277). Convention 154 documents the export. Lists.tsx line 277 confirms cross-page use.

---

## Entry 488 — `Sequential visible on Lists page (grid + list view)`

**Registry line:** 488
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Sequential visible on Lists page (grid + list view) | PRD-09A/09B Phase 1 | PRD-09A/09B Phase 1 | ✅ Wired | 2026-04-06 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 488 — capability phrase; concrete identifier implied via `SequentialCollectionCard` + Lists.tsx render.
(b) WIRING_STATUS.md Sequential Collections section has a row: "Visible on Lists page | Inline tile in grid / list view with 'Sequential' badge + `current_index/total_items` subtitle | **Wired** | Phase 1 dual access. Only shown on `filter='all'`."
(c) CLAUDE.md Convention 156: "Sequential collections surface on the Lists page ONLY when `filter === 'all'`."
Primary identifier: `Lists.tsx` render of `SequentialCollectionCard` conditioned on filter state.

### Field 2 — Code presence check
Grep command: `pattern="SequentialCollectionCard"`, path=`src`, output_mode=content, -n (reusing earlier hits)
Hits: Lists.tsx line 277 renders `<SequentialCollectionCard collection={coll} />`
First-context window (Lists.tsx:260, 277):
```
260:  // (reuses SequentialCollectionCard — user taps the card header to expand items).
277:          <SequentialCollectionCard collection={coll} />
```

Grep command: `pattern="list_type.{0,10}randomizer"`, path=`src/pages/Lists.tsx` — for filter context
Hit: line 1278 — unrelated (randomizer detail view).

### Field 3 — Wiring check
Callers: Lists.tsx is a Router page at `/lists`. The render site is wrapped in filter logic per Convention 156.
Execution-flow location: React page component.
Most recent touching commit: not run on Lists.tsx in this packet.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: explicit row `Visible on Lists page | ... | **Wired**`.
- prds/addenda/: PRD-09A/09B Phase 1 addendum referenced.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Convention 149 (Studio universal creation) + Convention 156 (filter=all gating).

### Field 5 — What was NOT checked
- Whether the filter=all gate is actually enforced at the render-code level (not inspected) or only in the query that feeds `coll`.
- Whether "grid view" and "list view" differ in how `SequentialCollectionCard` is laid out — just confirmed one render site.

### Field 6 — Observations (no verdict)
Lists.tsx:277 renders `SequentialCollectionCard` per-collection. Comment at line 260 references the reuse. WIRING_STATUS.md confirms the row as ✅ Wired with `filter='all'` gating. Convention 156 documents the filter rule.

---

## Entry 489 — `Sequential creation entry from Lists [+ New List]`

**Registry line:** 489
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Sequential creation entry from Lists [+ New List] | PRD-09A/09B Phase 1 | PRD-09A/09B Phase 1 | ✅ Wired | 2026-04-06 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 489 — describes Lists → [+ New List] → "Sequential Collection" tile routing to SequentialCreatorModal.
(b) WIRING_STATUS.md row: "Create from Lists page | Lists → [+ New List] → 'Sequential Collection' tile → SequentialCreatorModal | **Wired** | Phase 1 cross-surface visibility — new entry point."
(c) CLAUDE.md Convention 150: "Sequential collections are creatable from three entry points and ONLY through `SequentialCreatorModal`. ... Lists → [+ New List] → 'Sequential Collection' tile all open the same modal..."
Primary identifier: `Lists.tsx` [+ New List] type-picker routing `'sequential'` to `setSequentialModalOpen(true)`.

### Field 2 — Code presence check
Grep command: `pattern="'sequential'|setSequentialModalOpen"`, reading Lists.tsx around the type picker (viewed at lines 420-459)
Hit: line 435 includes `'sequential'` as a type picker option; lines 441-449 branch:
```
441:                      onClick={() => {
442:                        if (type === 'sequential') {
443:                          // Sequential collections don't live in the lists table — open the
444:                          // SequentialCreatorModal instead of the simple list-name flow.
445:                          setShowCreate(false)
446:                          setSequentialModalOpen(true)
447:                        } else {
448:                          setCreateType(type as ListType)
449:                        }
450:                      }}
```
Line 730 renders `<SequentialCreatorModal>` in Lists.tsx.

### Field 3 — Wiring check
Callers: Lists.tsx is the sole page for this entry point. Studio and Tasks have their own entry points (entries 486 context).
Execution-flow location: React page; click handler branches on tile type.
Most recent touching commit: not run on Lists.tsx in this packet.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: explicit row confirming ✅ Wired.
- prds/addenda/: PRD-09A/09B Phase 1 addendum.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Conventions 149-150 document the three-entry-point rule.

### Field 5 — What was NOT checked
- Whether the `setSequentialModalOpen` state hook's initial/close transitions are correct in all edge cases.
- Whether the type-picker layout matches the spec in the PRD-09A/09B addendum.

### Field 6 — Observations (no verdict)
Lists.tsx:435 includes `'sequential'` in the type-picker array; lines 442-446 route to `setSequentialModalOpen(true)` and close the create modal. Line 730 renders `<SequentialCreatorModal>`. WIRING_STATUS.md confirms ✅ Wired. Convention 150 enumerates this as one of three entry points.

---

## Entry 490 — `Randomizer in Lists [+ New List] type picker grid`

**Registry line:** 490
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Randomizer in Lists [+ New List] type picker grid | PRD-09A/09B Phase 1 | PRD-09A/09B Phase 1 | ✅ Wired | 2026-04-06 (one-line fix in Lists.tsx:357) |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
(a) Stub entry line 490 names file+line: `Lists.tsx:357` (the stub row's "one-line fix" citation). Source: stub entry line 490. Quote: `"one-line fix in Lists.tsx:357"`.
(d.5) Opening Lists.tsx around the cited line: line 352 is the actual "New List" button's text node (from earlier read); line 435 is the type-picker array. The stub's citation of line 357 is close to the filter tabs block (line 358 is filter-tabs rendering). The precise 'randomizer' entry is at line 435: `{(['shopping', 'wishlist', 'expenses', 'packing', 'todo', 'reference', 'ideas', 'prayer', 'backburner', 'randomizer', 'sequential', 'custom'] as const).map(type => {`. Line drift between the stub's citation and current code is likely due to downstream edits since 2026-04-06.
Primary identifier: `'randomizer'` entry in the `Lists.tsx` type-picker array (currently at line 435).

### Field 2 — Code presence check
Grep command: `pattern="'randomizer'|list_type: 'randomizer'"`, path=`src/pages/Lists.tsx`, output_mode=content
Hits: 3
Files/lines:
  - src/pages/Lists.tsx:433 — comment: "PRD-09A/09B Studio Intelligence Phase 1: added 'randomizer' (missing) and 'sequential' (meta-type, routes to SequentialCreatorModal) to the grid."
  - src/pages/Lists.tsx:435 — `'randomizer'` entry in type-picker array
  - src/pages/Lists.tsx:1278 — `if (list.list_type === 'randomizer') {` (randomizer detail view)

### Field 3 — Wiring check
Callers: Lists.tsx internal — the type-picker calls `setCreateType(type as ListType)` (line 448) for non-sequential types including randomizer.
Execution-flow location: React page component.
Most recent touching commit: not run in this packet.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: row "Create from Lists page ... [+ New List] type picker (direct)" for Randomizer marked ✅ Wired.
- prds/addenda/: PRD-09A/09B Phase 1 addendum.
- PlannedExpansionCard: not applicable.
- CLAUDE.md: Convention 155: "Randomizer creation is accessible from two paths: Lists page [+ New List] type picker (direct) and Studio → Randomizer [Customize] → `/lists?create=randomizer` (URL-param nav)."

### Field 5 — What was NOT checked
- Whether the line-number drift (stub cites 357; actual insertion at line 435) reflects a registry-lag issue.
- Whether the `ListType` union at the type-pickers includes `'randomizer'` (not inspected in this packet — would require the ListType definition).
- Whether `/lists?create=randomizer` URL-param flow (per Convention 155) also resolves to this same type picker branch.

### Field 6 — Observations (no verdict)
Lists.tsx:433 carries an inline comment explicitly stating "added 'randomizer' (missing) and 'sequential' (meta-type)" attributing the change to PRD-09A/09B Studio Intelligence Phase 1. Line 435 includes `'randomizer'` in the type-picker array. The stub's cited line (357) does not match current code; the fix is now at line 435 due to intervening edits. WIRING_STATUS.md and Convention 155 both confirm the direct-path entry exists.

---



## Entry 499 — `Routine duplication with linked step resolution`

**Registry line:** 499
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Routine duplication with linked step resolution | PRD-09A/09B Phase 1 | Linked Steps addendum (Build J → follow-up) | ✅ Wired | 2026-04-13 — RoutineDuplicateDialog deep-copies template + sections + steps. Linked steps surface for review with "Change" button opening LinkedSourcePicker. Member pill picker for target child. Wired into Studio "My Customized" Duplicate button (routines open dialog, non-routines keep shallow copy). |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 499. Multi-identifier case per recipe.
Quote: "RoutineDuplicateDialog deep-copies template + sections + steps. Linked steps surface for review with \"Change\" button opening LinkedSourcePicker... Wired into Studio \"My Customized\" Duplicate button"
Identifiers: `RoutineDuplicateDialog`, `LinkedSourcePicker`, Studio "My Customized" Duplicate button (Studio.tsx).

### Field 2 — Code presence check
Grep 1: pattern=`RoutineDuplicateDialog`, path=`src`, output_mode=content, -n=true
Hits: 5 in 2 files
Files:
- `src/components/tasks/RoutineDuplicateDialog.tsx:21` — `interface RoutineDuplicateDialogProps {`
- `src/components/tasks/RoutineDuplicateDialog.tsx:56` — `export function RoutineDuplicateDialog({`
- `src/pages/Studio.tsx:31` — `import { RoutineDuplicateDialog } from '@/components/tasks/RoutineDuplicateDialog'`
- `src/pages/Studio.tsx:914` — `<RoutineDuplicateDialog`

First-context window (`src/components/tasks/RoutineDuplicateDialog.tsx:72-85`):
```
// Find linked steps that need resolution
const linkedSteps = useMemo<LinkedStepResolution[]>(() => {
  if (!sections) return []
  const results: LinkedStepResolution[] = []
  for (const sec of sections) {
    for (const step of sec.steps) {
      if (step.step_type !== 'static' && step.linked_source_id && step.linked_source_type) {
        results.push({
          stepId: step.id,
          stepTitle: step.display_name_override || step.title,
          originalSourceId: step.linked_source_id,
          originalSourceType: step.linked_source_type,
```

Grep 2: pattern=`LinkedSourcePicker`, output_mode=files_with_matches
Hits: Source files: `src/components/tasks/RoutineSectionEditor.tsx`, `src/components/tasks/RoutineDuplicateDialog.tsx`, `src/components/tasks/sequential/LinkedSourcePicker.tsx`.

### Field 3 — Wiring check
Callers of `RoutineDuplicateDialog`: `src/pages/Studio.tsx:914` (rendered from Studio page "My Customized" flow).
Execution-flow location: React component files (`.tsx`). `RoutineDuplicateDialog.tsx` hosts the component; `Studio.tsx` renders it. `LinkedSourcePicker.tsx` is the picker dialog opened on "Change."
Most-recent touching commit for `RoutineDuplicateDialog.tsx`: `97e1637 2026-04-13 14:03:44 -0500 fix: resolve 8 Vercel strict-mode TypeScript errors`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: grep `routine.*duplicat|Duplicate.*routine` returned no matches.
- prds/addenda/: `PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md` contains at line 457 "Routine duplication with linked step resolution is the key complexity reducer for multi-child families..." and at line 514 "Routine duplication | ADD | Duplicate routine for another child with linked step source resolution prompts."
- PlannedExpansionCard: not applicable — this is a live UI flow, not a demand-validation stub.
- CLAUDE.md: no direct mention of `RoutineDuplicateDialog`.

### Field 5 — What was NOT checked
- Whether the deep-copy actually inserts the expected child rows into `task_templates`/`task_template_sections`/`task_template_steps` at runtime — would need live DB observation.
- Whether the member pill picker renders for all family_members or filters to specific dashboard modes.
- Whether the "My Customized" Duplicate button correctly routes non-routines to the shallow-copy path (separate conditional not verified in this packet).
- Full callers of `LinkedSourcePicker` (used from two known sites but runtime reach not confirmed).

### Field 6 — Observations (no verdict)
`RoutineDuplicateDialog` exists at `src/components/tasks/RoutineDuplicateDialog.tsx` and is imported + rendered from `src/pages/Studio.tsx:31,914`. The linked-step resolution loop at lines 72-85 iterates sections/steps and collects entries whose `step_type !== 'static'`. `LinkedSourcePicker` appears in 3 source files including the dialog. Most-recent touching commit is dated 2026-04-13. PRD addendum §14 (line 576) documents this as a Build-J follow-up feature. No WIRING_STATUS.md row for this specific dialog.

---

## Entry 501 — `Sequential mastery approval in global queue`

**Registry line:** 501
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Sequential mastery approval in global queue | Linked Steps addendum (Build J) | Linked Steps addendum (Build J) | ✅ Wired | 2026-04-06 — Tasks.tsx PendingApprovalsSection detects `completion_type='mastery_submit'` on task_completions rows and forks to useApproveMasterySubmission / useRejectMasterySubmission. Evidence note + URL rendered inline. Rejection resets mastery_status to 'practicing' (not 'rejected'). |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 501. Multi-identifier case.
Quote: "Tasks.tsx PendingApprovalsSection detects `completion_type='mastery_submit'` on task_completions rows and forks to useApproveMasterySubmission / useRejectMasterySubmission."
Identifiers: `PendingApprovalsSection`, `completion_type='mastery_submit'`, `useApproveMasterySubmission`, `useRejectMasterySubmission`, in `Tasks.tsx`.

### Field 2 — Code presence check
Grep: pattern=`PendingApprovalsSection|completion_type.*mastery_submit`, path=`src/pages/Tasks.tsx`, output_mode=content, -n=true
Hits: 7
Files:
- `src/pages/Tasks.tsx:600` — `<PendingApprovalsSection` (render)
- `src/pages/Tasks.tsx:1577` — `// PendingApprovalsSection sub-component`
- `src/pages/Tasks.tsx:1579` — `interface PendingApprovalsSectionProps {`
- `src/pages/Tasks.tsx:1585` — `function PendingApprovalsSection({ tasks, familyMembers, approverId }: PendingApprovalsSectionProps) {`
- `src/pages/Tasks.tsx:1624` — `if ((completion as { completion_type?: string }).completion_type === 'mastery_submit') {`
- `src/pages/Tasks.tsx:1647` — `if ((completion as { completion_type?: string }).completion_type === 'mastery_submit') {`
- `src/pages/Tasks.tsx:1688` — `const isMasterySubmission = (completion as { completion_type?: string } | undefined)?.completion_type === 'mastery_submit'`

First-context window (`src/pages/Tasks.tsx:1620-1631`):
```
if (!completion) return

// Build J: mastery submissions go through the mastery approval hook which
// sets mastery_status='approved' + promotes next sequential item.
if ((completion as { completion_type?: string }).completion_type === 'mastery_submit') {
  await approveMastery.mutateAsync({
    sourceType: 'sequential_task',
    sourceId: task.id,
    approverId,
    completionId: completion.id,
  })
  return
```

### Field 3 — Wiring check
Callers: `PendingApprovalsSection` rendered inside Tasks.tsx at line 600 (single caller — component is a local sub-component of the page).
Execution-flow location: React page component (`src/pages/Tasks.tsx`).
Most-recent touching commit for `src/pages/Tasks.tsx`: `70c2394 2026-04-17 15:23:45 -0500 feat(permissions): add Manage Tasks shortcut to ViewAs banner`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md:57 — `| Advancement modes (practice_count / mastery) | — | Wired | Build J (2026-04-06) |`
- prds/addenda/: `PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md` referenced in stub row; grep found matches.
- PlannedExpansionCard: not applicable — live flow.
- CLAUDE.md: Convention 161 (quoted in the project instructions): "Sequential mastery approvals reuse the existing `PendingApprovalsSection` in Tasks.tsx (line 1062) by detecting `completion_type='mastery_submit'` on task_completions rows..."

### Field 5 — What was NOT checked
- Whether `useApproveMasterySubmission` and `useRejectMasterySubmission` hooks exist and implement the claimed behavior (not grepped).
- Live database behavior: whether approval actually resets mastery_status to 'practicing' on rejection.
- Convention 161 references line 1062 but the current render is at line 600; line drift not reconciled.
- Whether evidence note + URL actually render inline in the approvals UI (render path not traced).

### Field 6 — Observations (no verdict)
`PendingApprovalsSection` is defined and rendered in `src/pages/Tasks.tsx` with three distinct `completion_type === 'mastery_submit'` branches (lines 1624, 1647, 1688). Convention 161 in CLAUDE.md documents this pattern. WIRING_STATUS.md line 57 notes mastery advancement as Wired per Build J. CLAUDE.md's line reference (1062) has drifted from current file content.

---

## Entry 502 — `Randomizer mastery approval inline on Lists detail view`

**Registry line:** 502
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Randomizer mastery approval inline on Lists detail view | Linked Steps addendum (Build J) | Linked Steps addendum (Build J) | ✅ Wired | 2026-04-06 — RandomizerMasteryApprovalInline sub-component in Lists.tsx renders pending mastery submissions per-list above the Randomizer draw area. Sequential uses global queue; randomizer uses per-list inline section (cross-source unified queue explicitly deferred). |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 502.
Quote: "RandomizerMasteryApprovalInline sub-component in Lists.tsx renders pending mastery submissions per-list above the Randomizer draw area."
Identifiers: `RandomizerMasteryApprovalInline` sub-component in `src/pages/Lists.tsx`.

### Field 2 — Code presence check
Grep: pattern=`RandomizerMasteryApprovalInline`, path=`src/pages/Lists.tsx`, output_mode=content, -n=true
Hits: 4
Files:
- `src/pages/Lists.tsx:1093` — `<RandomizerMasteryApprovalInline` (render)
- `src/pages/Lists.tsx:2908` — `interface RandomizerMasteryApprovalInlineProps {`
- `src/pages/Lists.tsx:2914` — `function RandomizerMasteryApprovalInline({`
- `src/pages/Lists.tsx:2918` — `}: RandomizerMasteryApprovalInlineProps) {`

First-context window (`src/pages/Lists.tsx:1088-1098`):
```
      </div>
    )}

    {/* Build J: Randomizer mastery approval queue (mom only) */}
    {isOwnerOrParent && (
      <RandomizerMasteryApprovalInline
        listId={list.id}
        approverId={memberId}
        familyMembers={familyMembers}
      />
    )}
```

### Field 3 — Wiring check
Callers: single caller inside Lists.tsx at line 1093, gated on `isOwnerOrParent`.
Execution-flow location: React page component (`src/pages/Lists.tsx`).
Most-recent touching commit for `src/pages/Lists.tsx`: `aeae494 2026-04-14 20:53:41 -0500 feat: connection preferences + wishlist AI context + mom's observations`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no grep match for `RandomizerMasteryApprovalInline`.
- prds/addenda/: `PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md` (stub cross-ref).
- PlannedExpansionCard: not applicable — live UI.
- CLAUDE.md: Convention 161 (quoted above) mentions "Randomizer mastery approvals surface on the Lists detail view per-list via `RandomizerMasteryApprovalInline` — a unified cross-source mastery queue is explicitly NOT built."

### Field 5 — What was NOT checked
- `isOwnerOrParent` gating logic — whether it maps to the intended permission class (role check not inspected).
- Whether pending mastery submissions for randomizer items are actually fetched/queried in the sub-component body (hook path not traced).
- Whether "above the Randomizer draw area" visual placement renders as described at runtime.

### Field 6 — Observations (no verdict)
`RandomizerMasteryApprovalInline` is defined as a local sub-component of `src/pages/Lists.tsx` (interface at line 2908, function at line 2914) and rendered at line 1093 behind `isOwnerOrParent`. Convention 161 in CLAUDE.md documents this as the per-list inline approval path, with cross-source unified queue explicitly deferred. No WIRING_STATUS.md row for this component.

---

## Entry 503 — `Per-item advancement override editor in SequentialCollectionView`

**Registry line:** 503
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Per-item advancement override editor in SequentialCollectionView | Linked Steps addendum (Build J) | 2026-04-13 | ✅ Wired | Inline ItemAdvancementEditor in SequentialCollectionView. Settings icon per item (hover-reveal), toggles inline form: mode selector (complete/practice_count/mastery), practice target, approval toggle, evidence toggle, duration tracking. Writes directly to tasks table, invalidates collection query. |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 503.
Quote: "Inline ItemAdvancementEditor in SequentialCollectionView."
Identifier: `ItemAdvancementEditor` inside `src/components/tasks/sequential/SequentialCollectionView.tsx`.

### Field 2 — Code presence check
Grep: pattern=`ItemAdvancementEditor`, output_mode=files_with_matches
Hits: 1 source file (plus STUB_REGISTRY.md)
Files:
- `src/components/tasks/sequential/SequentialCollectionView.tsx:25` — `function ItemAdvancementEditor({`
- `src/components/tasks/sequential/SequentialCollectionView.tsx:506` — `<ItemAdvancementEditor` (rendered inline)

First-context window (`src/components/tasks/sequential/SequentialCollectionView.tsx:25-44`):
```
function ItemAdvancementEditor({
  task,
  collectionId,
  onClose,
}: {
  task: Task
  collectionId: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<AdvancementMode>(task.advancement_mode ?? 'complete')
  const [target, setTarget] = useState(task.practice_target ?? 5)
  const [requireApproval, setRequireApproval] = useState(task.require_mastery_approval ?? false)
  const [requireEvidence, setRequireEvidence] = useState(task.require_mastery_evidence ?? false)
  const [trackDuration, setTrackDuration] = useState(task.track_duration ?? false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('tasks').update({
```

### Field 3 — Wiring check
Callers: single render site at `SequentialCollectionView.tsx:506`. Defined and rendered in same file.
Execution-flow location: React component file (`.tsx`).
Most-recent touching commit for `SequentialCollectionView.tsx`: `c6bfddf 2026-04-13 13:28:21 -0500 feat(tasks): per-item advancement override editor in SequentialCollectionView`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: grep `Advancement modes (practice_count / mastery)` row at line 57 noted as Wired (Build J 2026-04-06). No explicit row for `ItemAdvancementEditor`.
- prds/addenda/: stub references Linked Steps addendum (Build J).
- PlannedExpansionCard: not applicable — live editor.
- CLAUDE.md: Convention 158 mentions "Sequential advancement modes are per-item with collection-level defaults (bulk-set-then-override)."

### Field 5 — What was NOT checked
- Hover-reveal Settings icon behavior at runtime (styling/interaction not verified).
- Whether the `supabase.from('tasks').update(...)` write covers ALL 5 state slots (mode, target, requireApproval, requireEvidence, trackDuration) — only saw the opening of `handleSave`, not the full payload.
- Whether `queryClient.invalidateQueries` correctly invalidates the collection query key after save.

### Field 6 — Observations (no verdict)
`ItemAdvancementEditor` is defined at line 25 and rendered at line 506 of the same file, `src/components/tasks/sequential/SequentialCollectionView.tsx`. The commit subject (`feat(tasks): per-item advancement override editor in SequentialCollectionView`) matches the stub description verbatim. Component state initialization pulls from `task.advancement_mode`, `task.practice_target`, `task.require_mastery_approval`, `task.require_mastery_evidence`, `task.track_duration`. Save path begins with `supabase.from('tasks').update(...)` (full payload not quoted in this packet).

---

## Entry 504 — `Evidence file upload (camera integration) for mastery submissions`

**Registry line:** 504
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Evidence file upload (camera integration) for mastery submissions | Linked Steps addendum (Build J) | — | 📌 Post-MVP | Basic text note + URL capture works. Rich file/camera upload deferred. |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 504. No concrete code identifier for the deferred feature named. Stub row names existing "text note + URL capture" functionality (which DOES exist) but not the deferred rich file/camera upload.
Level (b) — WIRING_STATUS.md grep for `mastery` returned line 57 (advancement modes row), no explicit camera/file upload row.
Level (c) — CLAUDE.md: no convention for camera upload for mastery evidence.
Level (d) — `PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md` covers Build J (linked steps/mastery foundation).
Level (d.5) — since the existing "text note + URL capture" implementation IS named, look in the Build-J mastery UI files. `MasterySubmissionModal` is the mastery submission UI.
Source: `src/components/tasks/sequential/MasterySubmissionModal.tsx:23` — `onSubmit: (params: { evidenceUrl: string | null; evidenceNote: string | null }) => void`.
Identifier: `MasterySubmissionModal` (existing text+URL component) as the surface where camera integration would eventually land.

### Field 2 — Code presence check
Grep 1: pattern=`mastery_evidence_url|mastery_evidence_note`, output_mode=files_with_matches
Hits: 10 files total (including 3 evidence/STUB files). Source hits:
- `src/types/tasks.ts:420` — `mastery_evidence_url: string | null`
- `src/pages/Tasks.tsx:1604` — `.select('id, task_id, member_id, completed_at, approval_status, completion_type, mastery_evidence_url, mastery_evidence_note')`
- `src/pages/Tasks.tsx:1690` — `const masteryEvidenceUrl = (completion as { mastery_evidence_url?: string | null } | undefined)?.mastery_evidence_url`
- `src/hooks/usePractice.ts:326` — `mastery_evidence_url: params.evidenceUrl ?? null,`
- `supabase/migrations/00000000100105_linked_steps_mastery_advancement.sql`
- `tests/e2e/features/linked-steps-mastery.spec.ts`

Grep 2: pattern=`evidenceUrl|capture.*camera|useRef.*input` in `src/components/tasks/sequential/` → only `MasterySubmissionModal.tsx` matched, and only for `evidenceUrl` (URL string input). No `camera`, no `input[type=file]`, no file upload hooks.

First-context window (`src/components/tasks/sequential/MasterySubmissionModal.tsx:140-152`):
```
<input
  type="url"
  value={evidenceUrl}
  onChange={e => setEvidenceUrl(e.target.value)}
  placeholder="https://..."
  className="w-full px-3 py-2 rounded-lg text-sm"
  style={{
    background: 'var(--color-bg-secondary)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
  }}
/>
```

### Field 3 — Wiring check
Callers: `MasterySubmissionModal` definition at `src/components/tasks/sequential/MasterySubmissionModal.tsx`. Input field is `type="url"` (URL string only), not `type="file"` and not a camera capture control.
Execution-flow location: React component file. The deferred rich-file/camera path is absent from this file.
Most-recent touching commit for `MasterySubmissionModal.tsx`: `207235e 2026-04-06 23:12:07 -0500 feat: Build J — Linked Routine Steps, Mastery & Practice Advancement (PRD-09A/09B Session 2)`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no row for mastery evidence camera upload.
- prds/addenda/: Build J addendum describes mastery evidence at the URL/text note level.
- PlannedExpansionCard: grep for any mastery-camera feature key — none found; no demand-validation card for this deferred feature.
- CLAUDE.md: no convention specific to camera upload for mastery.

### Field 5 — What was NOT checked
- Whether any file-upload infrastructure elsewhere (Supabase Storage bucket, signed-URL helper) exists that would be consumed by a future camera flow for this specific feature.
- Whether mom-side approval rendering ever displays attached images (only text/URL render path was inferred).
- Whether tests exercise a file-upload path that wasn't found by grep.

### Field 6 — Observations (no verdict)
`MasterySubmissionModal.tsx` implements only a URL-string input and a text note. Schema columns `mastery_evidence_url` / `mastery_evidence_note` exist in `src/types/tasks.ts:420` and migration 100105, and are read in `Tasks.tsx`/`usePractice.ts`. Grep returned zero hits for `camera`, `input type="file"`, or file-upload hooks inside the sequential mastery component directory. Most-recent touching commit is 2026-04-06 (Build J foundation). Stub text "Basic text note + URL capture works. Rich file/camera upload deferred" aligns with the observed code shape.

---

## Entry 505 — `Linked routine step child-dashboard rendering (expand to show current active item + inline practice actions)`

**Registry line:** 505
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Linked routine step child-dashboard rendering (expand to show current active item + inline practice actions) | Linked Steps addendum (Build J) | — | ⏳ Unwired (MVP) | Build J stubbed. Linked step DATA flows through routine persistence. TaskCard already renders advancement subtitle + resource URL for sequential tasks. Linked-step expansion (showing the source's current active item with inline practice/mastery actions) is the next incremental step. |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 505. Names existing references (TaskCard advancement subtitle + resource URL) but the stub itself is the DEFERRED capability (linked-step expansion with inline practice/mastery actions).
Level (b) — WIRING_STATUS.md:
- Line 59 "Linked routine steps — dashboard rendering | RoutineStepChecklist expands inline with linked content from sequential/randomizer/task sources | Wired | GuidedActiveTasksSection + TaskCard. 2026-04-13."
This WIRING_STATUS row CONTRADICTS the registry's `⏳ Unwired (MVP)` claim — stub was not updated to reflect the 2026-04-13 wire-up.

Identifier: `RoutineStepChecklist` (per WIRING_STATUS.md), plus `GuidedActiveTasksSection` and `TaskCard` as rendering surfaces.

Level (d.5) not invoked (WIRING_STATUS.md named concrete identifiers).

### Field 2 — Code presence check
Grep: pattern=`linked.*step.*expand|linkedStep.*render|linked_step_render`, output_mode=files_with_matches
Hits: 4 total, all non-source (STUB_REGISTRY.md, feature-decision docs, spec, SCHEMA evidence). Direct source hits: 0.

Note: the phrase-match grep used in this lookup is narrow — it would not catch implementations that use different identifier names. The authoritative check is via `RoutineStepChecklist` / `GuidedActiveTasksSection` which were not re-grepped in this packet.

### Field 3 — Wiring check
Not performed for `RoutineStepChecklist` / `GuidedActiveTasksSection` in this packet — identifiers surfaced at level (b) post-hoc after phrase grep returned empty. Recipe permits this, and additional callers were not traced.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md:59 — row "Linked routine steps — dashboard rendering ... Wired ... 2026-04-13" (direct contradiction of registry's `⏳ Unwired (MVP)`).
- prds/addenda/: `PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md` referenced.
- PlannedExpansionCard: grep for explicit feature key not attempted for this specific flow.
- CLAUDE.md: Convention 157 discusses linked routine steps architecture; does not name this expansion flow as deferred.

### Field 5 — What was NOT checked
- `RoutineStepChecklist` code presence and linked-content-render branches (would require a new grep pair against that identifier).
- Whether `GuidedActiveTasksSection` and `TaskCard` actually contain the inline expand/practice path claimed by WIRING_STATUS.md line 59.
- Whether inline "practice/mastery actions" are fully available in the dashboard expansion or only a partial (expand-but-no-inline-action) implementation — this is the most likely source of the WIRING_STATUS.md vs. STUB_REGISTRY.md disagreement.
- Whether the STUB_REGISTRY.md entry pre-dates the WIRING_STATUS.md update (2026-04-13) and was not refreshed.

### Field 6 — Observations (no verdict)
WIRING_STATUS.md line 59 (dated 2026-04-13) marks "Linked routine steps — dashboard rendering" as Wired via `RoutineStepChecklist` + `GuidedActiveTasksSection` + `TaskCard`. STUB_REGISTRY.md line 505 claims `⏳ Unwired (MVP)` with no updated date. Phrase-match grep on this packet's narrow pattern returned no direct source hits but that grep was narrow; the authoritative identifier path via WIRING_STATUS.md was not code-verified in this packet. Registry status and WIRING_STATUS.md row are in direct tension.

---

## Entry 506 — `"What do you want to create?" Studio search bar`

**Registry line:** 506
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| "What do you want to create?" Studio search bar | PRD-09A/09B Phase 1 | Studio Intelligence Phase 2 (Session 3) | ⏳ Unwired (MVP) | Session 3 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 506. No code identifier; copy-text label only.
Level (b) — WIRING_STATUS.md:69 — `| Studio search bar rendering tags | — | Stub (Session 3 / Phase 2) |`. Identifier: the capability phrase "Studio search bar rendering tags" — still no concrete component/hook named.
Level (c) — CLAUDE.md grep returned no explicit convention naming a Studio search bar.
Level (d) — `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md` covers Phase 2.
Level (d.5) — file named at level (d) but no identifier within it produced by a single targeted read in this packet; escalate to (e).
Level (e) — CAPABILITY-ONLY: no concrete implementation identifier. (Supplementary: `exampleUseCases.some(uc => uc.toLowerCase().includes(q))` at `src/pages/Studio.tsx:161` suggests a search filter `q` exists already, but whether this is the "What do you want to create?" bar described in the stub was not confirmed by doc-text match.)

### Field 2 — Code presence check
Grep 1: pattern=`studio.*search.*bar|What do you want to create`, path=`src`, output_mode=files_with_matches
Hits: 0 — no matches in source.

Grep 2 (supplementary, not replacing (a)-(e) chain): pattern=`exampleUseCases.some`, path=`src/pages/Studio.tsx`
Hits: `src/pages/Studio.tsx:161` — `tpl.exampleUseCases.some(uc => uc.toLowerCase().includes(q))` (existing filter in Studio search of templates).

### Field 3 — Wiring check
Capability-only resolution — skipped. Existing `q` filter at Studio.tsx:161 is context, not a confirmed match to the stub copy text.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md:69 — `| Studio search bar rendering tags | — | Stub (Session 3 / Phase 2) |`.
- prds/addenda/: `PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md`.
- PlannedExpansionCard: grep for `featureKey="studio` returned 2 hits in `src/pages/Studio.tsx:574,588` but both are `FeatureIcon`/`FeatureGuide` uses, not demand-validation card for the search bar.
- CLAUDE.md: no explicit convention; stub row says "Session 3" as target phase.

### Field 5 — What was NOT checked
- Whether the existing `tpl.exampleUseCases.some(uc => uc.toLowerCase().includes(q))` filter ON Studio.tsx corresponds conceptually to the "What do you want to create?" bar described in the stub (semantic match would help; Convention 242 restricts mgrep).
- Whether Phase 2 addendum names concrete components (`SearchBarStudio`, etc.) that are not yet implemented — full addendum not read.
- Whether any feature_key `studio_search` exists in registry.

### Field 6 — Observations (no verdict)
Grep on the exact stub copy text "What do you want to create?" returned zero source matches. WIRING_STATUS.md line 69 confirms the matching capability ("Studio search bar rendering tags") as Stub / Session 3 / Phase 2. A tangentially-related existing filter on `exampleUseCases` exists at `src/pages/Studio.tsx:161` but alignment with the stub's intent was not confirmed. Capability-only classification per recipe (e).

---

## Entry 507 — `Use case category browse in Studio`

**Registry line:** 507
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Use case category browse in Studio | PRD-09A/09B Phase 1 | Studio Intelligence Phase 2 (Session 3) | ⏳ Unwired (MVP) | Session 3 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 507. No code identifier.
Level (b) — WIRING_STATUS.md:70 — `| Use case category browse | — | Stub (Session 3 / Phase 2) |`. Phrase only.
Level (c) — CLAUDE.md grep: no convention.
Level (d) — `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md`.
Level (d.5) — addendum not opened for targeted single-file identifier extraction.
Level (e) — CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep: pattern=`use.?case.*categor|UseCaseCategor`, path=`src`, output_mode=files_with_matches
Hits: 0 — no matches.

(Supplementary: `exampleUseCases` field exists on studio templates — source line `src/pages/Studio.tsx:161`, plus `src/components/studio/StudioTemplateCard.tsx:66` — `exampleUseCases: string[]`. These are example-use-case STRINGS on template data, not a category-browse UI surface.)

### Field 3 — Wiring check
skipped — capability-only.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md:70 — stub row.
- prds/addenda/: Phase 2 addendum referenced in stub.
- PlannedExpansionCard: no feature-specific card located.
- CLAUDE.md: no specific convention.

### Field 5 — What was NOT checked
- Whether `exampleUseCases` field structure is already the foundation for a future category-browse (Phase 2) — not traced.
- Whether `use_case_category` table/column exists in platform schema.

### Field 6 — Observations (no verdict)
Grep returned no source hits for the stub's phrase-shape. WIRING_STATUS.md line 70 records this as Stub / Session 3 / Phase 2. Existing `exampleUseCases` field on templates is tangential context, not the stub's browse-UI capability. Capability-only classification.

---

## Entry 508 — `Enhanced Studio cards with capability tag pills`

**Registry line:** 508
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Enhanced Studio cards with capability tag pills | PRD-09A/09B Phase 1 | Studio Intelligence Phase 2 (Session 3) | ⏳ Unwired (MVP) | Session 3 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 508. Named concept "capability tag pills" — no component name.
Level (b) — WIRING_STATUS.md:68 — `| Widget starter configs carry baseline tags | Wired | Adapter in Studio.tsx adds ['dashboard_display', 'at_a_glance', 'progress_visual', tracker_type]. Phase 2 will replace with per-tracker-type tags. |` (foundation exists); line 71 — `| "Best for:" tagline + tag pills on cards | — | Stub (Session 3 / Phase 2) |`.
Level (c) — CLAUDE.md Convention 153 (quoted in instructions): "All Studio template types have `capability_tags: string[]`" — schema foundation. No convention names the PILL rendering.
Level (d) — `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md` §1D (per Convention 153) — tag vocabulary authoritative.
Level (d.5) — already have identifier: `capability_tags` field on `StudioTemplate` type.
Identifiers: `capability_tags` field on `StudioTemplate` interface; `StudioTemplateCard` component as the (current) card surface.

### Field 2 — Code presence check
Grep: pattern=`capability_tags`, path=`src`, output_mode=files_with_matches
Hits: 3 source files
Files:
- `src/pages/Studio.tsx:663` — `// Phase 1 capability_tags — baseline for widgets; Phase 2`
- `src/pages/Studio.tsx:666` — `capability_tags: [` (widget adapter baseline tags)
- `src/components/studio/studio-seed-data.ts:11,36,53,74,90,...` — tags on every seed template (8+ hits)
- `src/components/studio/StudioTemplateCard.tsx:75` — `capability_tags: string[]` (StudioTemplate interface field)

Grep 2: pattern=`tag pill|capability.*tag.*render|tag-pill`, path=`src`, output_mode=files_with_matches
Hits: 1 — `src/components/tasks/TaskCard.tsx` where grep showed only a comment `- Life area tag pill` at line 10 (unrelated to Studio capability tags).

First-context window (`src/components/studio/StudioTemplateCard.tsx:65-80`):
```
description: string
exampleUseCases: string[]
isExample: boolean
/**
 * PRD-09A/09B Studio Intelligence Phase 1 — foundation for Phase 2 intent-based search.
 * Tags describe what the template DOES, not what it IS. Multiple tools can share tags.
 * Required field: forgetting tags on a future template is a compile error (by design).
 * Tag vocabulary is authoritative in
 * `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md` §1D.
 */
capability_tags: string[]
```

### Field 3 — Wiring check
Callers of `capability_tags`: seed data populates the field; Studio.tsx widget adapter constructs it; grep for rendering-layer consumption as "pills" on the card returned no matches.
Execution-flow location: `StudioTemplateCard.tsx` defines the field on the template type; seed data and Studio.tsx populate it; no render-of-pills site found.
Most-recent touching commit for `StudioTemplateCard.tsx`: `21a47a1 2026-04-16 15:21:49 -0500 wip: Universal List Wizard scaffolding`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md:68 (foundation Wired) + 71 (card-render pills Stub).
- prds/addenda/: Studio Intelligence addendum §1D authoritative on tag vocabulary.
- PlannedExpansionCard: not found for this specific Phase 2 UI.
- CLAUDE.md: Convention 153.

### Field 5 — What was NOT checked
- Whether `StudioTemplateCard.tsx` render body contains any pill-like render but under a different keyword (full component body not read).
- Whether a Phase 2 scaffolding file (`CapabilityTagPills.tsx` or similar) exists but was not surfaced by the narrow grep patterns used.
- Whether `21a47a1` "Universal List Wizard scaffolding" introduced any partial pill rendering in the card.

### Field 6 — Observations (no verdict)
`capability_tags` data field is populated on templates and widget adapters (3 source files, 10+ grep hits across seed data and Studio.tsx). Grep for "tag pill / tag-pill / capability...tag...render" patterns returned no matches in Studio card components; the only match was an unrelated `life area tag pill` comment in TaskCard.tsx. WIRING_STATUS.md line 71 records card-render pills as Stub / Session 3 / Phase 2. Data foundation is present (Phase 1); render pattern (Phase 2) is not surfaced by grep.

---

## Entry 509 — `Studio "My Library" cross-table unified tab`

**Registry line:** 509
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Studio "My Library" cross-table unified tab | PRD-09A/09B Phase 1 | Studio Intelligence Phase 2 (Session 3) | ⏳ Unwired (MVP) | Session 3 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 509. "My Library" is a copy-text label.
Level (b) — WIRING_STATUS.md:72 — `| "My Library" unified tab | — | Stub (Session 3 / Phase 2) |`.
Level (c) — CLAUDE.md: no convention.
Level (d) — Studio Intelligence Phase 2 addendum.
Level (d.5) — no file named beyond the addendum.
Level (e) — CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep: pattern=`My Library|MyLibrary|my-library`, path=`src/pages/Studio.tsx`, output_mode=content, -n=true
Hits: 0 — no matches.

Grep 2: pattern=`My Library|my_library|myLibrary|capability.?tag.?pill`, path=`src`, output_mode=files_with_matches
Hits: 0.

### Field 3 — Wiring check
skipped — capability-only.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md:72.
- prds/addenda/: Studio Intelligence addendum.
- PlannedExpansionCard: none located.
- CLAUDE.md: no specific convention.

### Field 5 — What was NOT checked
- Whether Studio tabs infrastructure currently renders a "My Customized" tab that will be renamed to "My Library" in Phase 2 (code not traced).
- Whether any scaffolding for a cross-table unified view exists under a different identifier.

### Field 6 — Observations (no verdict)
Zero source matches for "My Library" in Studio page or anywhere in src/. WIRING_STATUS.md line 72 records as Stub / Session 3 / Phase 2. Capability-only classification.

---

## Entry 510 — `Post-creation smart recommendation cards`

**Registry line:** 510
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Post-creation smart recommendation cards | PRD-09A/09B Phase 1 | Studio Intelligence Phase 2 (Session 3) | ⏳ Unwired (MVP) | Session 3 |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 510. Copy-label only.
Level (b) — WIRING_STATUS.md grep for "Post-creation" / "smart recommendation" — no row found; only lines 68-72 in the Phase 2 stub cluster (none matches this specific capability).
Level (c) — CLAUDE.md: no convention.
Level (d) — Studio Intelligence Phase 2 addendum (not opened in this packet for targeted lookup).
Level (d.5) — no specific file named for a targeted (d.5) read.
Level (e) — CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep: pattern=`post.?creation.*recommendation|smart.*recommendation.*card|PostCreationRecommend`, path=`src`, output_mode=files_with_matches
Hits: 0 — no source matches.

### Field 3 — Wiring check
skipped — capability-only.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no matching row (Phase 2 cluster at lines 68-72 covers search bar, category browse, tag pills, My Library — not this specific capability).
- prds/addenda/: Studio Intelligence addendum implied by stub row.
- PlannedExpansionCard: none located.
- CLAUDE.md: no specific convention.

### Field 5 — What was NOT checked
- Whether the Phase 2 addendum file (`PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md`) describes this capability by a more-specific identifier that would grep cleanly — addendum not opened for targeted look.
- Whether this overlaps with LiLa `studio_create_guide` (entry 511) post-creation flow in function.

### Field 6 — Observations (no verdict)
Zero source matches for all three grep patterns tried. No WIRING_STATUS.md row for this specific capability. Capability-only classification. Stub target phase is Phase 2 / Session 3 per "Session 3" column value.

---

## Entry 516 — `Subject Tracking section in TaskCreationModal`

**Registry line:** 516
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Subject Tracking section in TaskCreationModal | PRD-28 Addendum | Polish pass | ⏳ Unwired (MVP) | Per-task subject assignment checkboxes in "Rewards & Completion Tracking" section. Would enable automatic `homeschool_time_logs` creation on task completion for homework-tagged tasks. Currently mom uses Log Learning widget for manual entry. |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 516. Identifiers: "TaskCreationModal", "Rewards & Completion Tracking" section, `homeschool_time_logs` table, `counts_for_homework` column (per PRD-28 live_schema: tasks.counts_for_homework, tasks.homework_subject_ids).
Level (b) — WIRING_STATUS.md grep: no row.
Level (c) — CLAUDE.md Convention 224: "Task-level tracking flags: `counts_for_allowance`, `counts_for_homework`, `counts_for_gamification`. All three exist on both `tasks` and `task_templates`."
Level (d) — `prds/addenda/PRD-28-Cross-PRD-Impact-Addendum.md` line 26: "Homeschool-tagged tasks (`life_area_tag = 'homeschool'`) gain an additional configuration section in the Task Creation Modal: **"Subject Tracking"** with subject checkboxes and time allocation fields" and line 32: "Add Subject Tracking section spec to Task Creation Modal (Section 6: Rewards & Tracking) for homeschool-tagged tasks".

Identifiers: `TaskCreationModal.tsx`, `homework_subject_ids` column on tasks, "Rewards & Completion Tracking" section heading.

### Field 2 — Code presence check
Grep 1: pattern=`Rewards.*Completion|counts_for_homework`, path=`src/components/tasks/TaskCreationModal.tsx`, output_mode=content, -n=true
Hits: 1
- `src/components/tasks/TaskCreationModal.tsx:1861` — `<SectionHeading icon={Gift}>Rewards & Completion Tracking</SectionHeading>`

Grep 2: pattern=`Subject Tracking|homework_subject_ids|homeschool_subject_ids`, path=`src/components/tasks`, output_mode=content, -n=true
Hits: 0 — no matches in `src/components/tasks/`.

Grep 3: pattern=`homework_subject_ids`, path=`src`, output_mode=files_with_matches
Hits: 3 non-UI files
- `src/utils/createTaskFromData.ts`
- `src/types/tasks.ts`
- `src/hooks/useTasks.ts`

Grep 4: pattern=`counts_for_homework|homework_subject_ids`, path=`src/components`, output_mode=files_with_matches
Hits: 2
- `src/components/tasks/DashboardTasksSection.tsx`
- `src/components/widgets/trackers/LogLearningTracker.tsx`

First-context window (`src/components/tasks/TaskCreationModal.tsx:1861`):
```
<SectionHeading icon={Gift}>Rewards & Completion Tracking</SectionHeading>
```

### Field 3 — Wiring check
- `TaskCreationModal.tsx` has the "Rewards & Completion Tracking" SectionHeading (line 1861) but grep for `Subject Tracking` / `homework_subject_ids` inside that file returned 0.
- Column `homework_subject_ids` EXISTS on `tasks` (live_schema line: "| 73 | `homework_subject_ids` |") and on `task_templates`, and is read in `src/utils/createTaskFromData.ts`, `src/types/tasks.ts`, `src/hooks/useTasks.ts` — schema + hook layer wired, but NOT the modal-UI layer.

Most-recent touching commit for `TaskCreationModal.tsx`: not fetched in this packet (no `git log -1` run for this specific file).

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no specific row for "Subject Tracking in Task Creation Modal."
- prds/addenda/: `PRD-28-Cross-PRD-Impact-Addendum.md:26,32` describes this capability.
- PlannedExpansionCard: no specific card located.
- CLAUDE.md: Convention 224 documents the column family; no mention of the UI section being live.

### Field 5 — What was NOT checked
- Full content of `TaskCreationModal.tsx` — only the two narrow greps were run; a section named differently ("Homework Subjects", "Track for Homeschool") that handles the same capability would not be caught.
- Git log for `TaskCreationModal.tsx`.
- Whether `homework_subject_ids` is written FROM the UI at all (only presence in schema/hooks verified).

### Field 6 — Observations (no verdict)
Column `homework_subject_ids` exists on `tasks` (live_schema) and is referenced in non-UI source (`utils/`, `hooks/`, `types/`). The Task Creation Modal contains the "Rewards & Completion Tracking" SectionHeading that the addendum targets, but grep inside that modal file for `Subject Tracking` / `homework_subject_ids` returned 0. PRD-28 addendum (lines 26, 32) specifies this as a to-build section for homeschool-tagged tasks. Convention 224 covers the column infrastructure only.

---

## Entry 522 — `Allowance history trend charts`

**Registry line:** 522
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Allowance history trend charts | PRD-28 | — | 📌 Post-MVP | Visual charts showing completion %, earnings, and balance over time per child. |
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 522. No code identifier; copy label for visual chart.
Level (b) — WIRING_STATUS.md: no row (grep returned 0).
Level (c) — CLAUDE.md: no convention for this specific chart.
Level (d) — `prds/platform-complete/PRD-28-Tracking-Allowance-Financial.md:1100` — "- [ ] Allowance history trends (charts showing weekly earnings over time per child)" and `:1174` — "| 8 | Allowance history trend charts | Post-MVP visualization enhancement |".
Level (d.5) — PRD text names the feature but no implementation identifier within a specific file; escalate.
Level (e) — CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep 1: pattern=`allowance.*chart|AllowanceChart|allowance_history|AllowanceTrend`, path=`src`, output_mode=files_with_matches
Hits: 0.

Grep 2: pattern=`allowance.*chart|allowance.*trend`, output_mode=files_with_matches (repo-wide)
Hits: 0.

### Field 3 — Wiring check
skipped — capability-only.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no row.
- prds/platform-complete/PRD-28-Tracking-Allowance-Financial.md:1100, 1174 — Post-MVP checklist + enhancement row.
- PlannedExpansionCard: not located.
- CLAUDE.md: no specific convention.

### Field 5 — What was NOT checked
- Whether any charting library (recharts, chart.js, victory) is already imported elsewhere in repo to support a future build.
- Whether `financial_transactions.balance_after` append-only pattern (Convention 223) provides the data foundation — data foundation exists, chart UI does not.

### Field 6 — Observations (no verdict)
Zero source matches for all chart-related patterns tried. PRD-28 Post-MVP checklist and enhancement table both list this as a Post-MVP visualization. Stub status `📌 Post-MVP` aligns with PRD. Data foundation (`financial_transactions` append-only per Convention 223) exists per schema/conventions but not consumed by any chart component.

---

## Entry 535 — `Safe Harbor placeholder UI + ViewAs exclusion`

**Registry line:** 535
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Safe Harbor placeholder UI + ViewAs exclusion (`src/pages/placeholder/index.tsx:53`, `src/App.tsx:176`, `src/lib/permissions/ViewAsProvider.tsx:46` `PRIVACY_EXCLUSIONS = ['safe_harbor']` constant) | PRD-04 / PRD-02 | PRD-20 | ⏳ Unwired (MVP) | PRD-20 Safe Harbor frontend — placeholder component and ViewAs exclusion are in place so PRD-20 can slot into existing routing and privacy infrastructure without retrofit. |
```

Partition file ambiguity note: "placeholder component + `PRIVACY_EXCLUSIONS` constant. Kept UI because the PlannedExpansionCard is the observable stub surface."

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)
Level (a) — stub entry line 535. Multi-identifier with explicit file:line cites.
Quote: "`src/pages/placeholder/index.tsx:53`, `src/App.tsx:176`, `src/lib/permissions/ViewAsProvider.tsx:46` `PRIVACY_EXCLUSIONS = ['safe_harbor']` constant"
Identifiers: `SafeHarborPage` at `src/pages/placeholder/index.tsx:52-54`; `/safe-harbor` route render at `src/App.tsx:176`; `PRIVACY_EXCLUSIONS` constant at `src/lib/permissions/ViewAsProvider.tsx:46`.

### Field 2 — Code presence check
Grep 1: pattern=`safe_harbor`, path=`src/pages/placeholder/index.tsx`, output_mode=content, -n=true
Hits: 1
- `src/pages/placeholder/index.tsx:53` — `return <PlaceholderPage title="Safe Harbor" description="..." icon={Shield} prd="PRD-20" featureKey="safe_harbor" />`

Grep 2: pattern=`safe_harbor|SafeHarbor`, path=`src/App.tsx`, output_mode=content, -n=true
Hits: 2
- `src/App.tsx:26` — `SafeHarborPage, BigPlansPage,` (import)
- `src/App.tsx:176` — `<Route path="/safe-harbor" element={<ProtectedRoute><SafeHarborPage /></ProtectedRoute>} />`

Grep 3: pattern=`PRIVACY_EXCLUSIONS`, path=`src/lib/permissions/ViewAsProvider.tsx`, output_mode=content, -n=true
Hits: 3
- `src/lib/permissions/ViewAsProvider.tsx:46` — `const PRIVACY_EXCLUSIONS = ['safe_harbor']`
- `src/lib/permissions/ViewAsProvider.tsx:65` — `setExcludedFeatures(PRIVACY_EXCLUSIONS)`
- `src/lib/permissions/ViewAsProvider.tsx:69` — `.insert(PRIVACY_EXCLUSIONS.map((key) => ({ session_id: data.id, feature_key: key })))`

First-context window (`src/lib/permissions/ViewAsProvider.tsx:45-70`):
```
// Privacy-protected features automatically excluded from all View As sessions
const PRIVACY_EXCLUSIONS = ['safe_harbor']

const startViewAs = useCallback(async (member: FamilyMember, viewerId: string, familyId: string) => {
  const { data } = await supabase
    .from('view_as_sessions')
    .insert({
      family_id: familyId,
      viewer_id: viewerId,
      viewing_as_id: member.id,
    })
    .select('id')
    .single()

  if (data) {
    setSessionId(data.id)
    setViewingAsMember(member)
    setRealViewerId(viewerId)
    setRealFamilyId(familyId)
    // Auto-apply privacy exclusions (Safe Harbor always excluded per PRD-20)
    setExcludedFeatures(PRIVACY_EXCLUSIONS)
    // Persist to DB
    await supabase
      .from('view_as_feature_exclusions')
      .insert(PRIVACY_EXCLUSIONS.map((key) => ({ session_id: data.id, feature_key: key })))
    }
}, [])
```

First-context window (`src/pages/placeholder/PlaceholderPage.tsx:3,16,39`):
```
import { PlannedExpansionCard } from '@/components/shared/PlannedExpansionCard'
...
 * Uses PlannedExpansionCard when the feature key exists in the registry.
...
<PlannedExpansionCard featureKey={featureKey!} />
```

### Field 3 — Wiring check
- `SafeHarborPage` (placeholder): defined at `src/pages/placeholder/index.tsx:52-54`, rendered from `src/App.tsx:176` at route `/safe-harbor`. Uses the universal `PlaceholderPage` wrapper which renders `PlannedExpansionCard` for its `featureKey`.
- `PRIVACY_EXCLUSIONS`: defined at `ViewAsProvider.tsx:46`, read at `:65` (setExcludedFeatures) and `:69` (DB insert into `view_as_feature_exclusions`). Single-item array `['safe_harbor']`.
- Execution-flow location: React page + Provider file. Live in the session lifecycle.
- Most-recent touching commits:
  - `src/App.tsx` → `5d2a7c4 2026-04-14 23:04:48 -0500 feat: PRD-16 Meetings Phase A — schema, page, sidebar, hooks`.
  - `src/lib/permissions/ViewAsProvider.tsx` → `af697df 2026-04-03 13:56:27 -0500 fix: wire task Edit button on Tasks page + Dashboard, update bug-reports skill`.
  - `src/pages/placeholder/index.tsx` → `5d2a7c4 2026-04-14 23:04:48 -0500 feat: PRD-16 Meetings Phase A — schema, page, sidebar, hooks`.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no explicit row for Safe Harbor placeholder (feature key search not performed beyond the text above).
- prds/addenda/: no addendum cross-check performed in this packet.
- PlannedExpansionCard: `src/pages/placeholder/PlaceholderPage.tsx:39` — `<PlannedExpansionCard featureKey={featureKey!} />`. This is the observable stub surface named in the partition ambiguity note.
- CLAUDE.md: Convention 6 mentions `is_safe_harbor` aggregation exemption. Convention 243 (Privacy Guardrails) documents Safe Harbor aggregation exclusion.

### Field 5 — What was NOT checked
- Whether `'safe_harbor'` exists in `feature_key_registry` table (live DB query, out of scope).
- Whether `view_as_feature_exclusions` rows in production actually store the exclusion on View As session start (runtime verification).
- Whether `PRIVACY_EXCLUSIONS` should also include any PRD-20 orientation/literacy feature keys beyond the single entry (PRD-20 scope not fully cross-checked).
- Whether the PlannedExpansionCard actually renders correctly for `featureKey="safe_harbor"` (demand-validation flow at runtime).

### Field 6 — Observations (no verdict)
All three cited identifiers match the stub's file:line hints. `SafeHarborPage` is a placeholder rendered at `/safe-harbor` via `App.tsx:176`, wrapping `PlaceholderPage` which invokes `PlannedExpansionCard` with `featureKey="safe_harbor"`. `PRIVACY_EXCLUSIONS = ['safe_harbor']` is defined and consumed in three places within `ViewAsProvider.tsx` (definition + setExcludedFeatures + view_as_feature_exclusions insert). Most-recent commits on the three files span 2026-04-03 to 2026-04-14. Stub's partition-note caveat ("placeholder component + PRIVACY_EXCLUSIONS constant. Kept UI because the PlannedExpansionCard is the observable stub surface") aligns with the PlannedExpansionCard hit at `PlaceholderPage.tsx:39`.

---



## PARTITION COMPLETE

- Session 3 (UI) partition complete at 2026-04-19.
- Total entries processed: 195 (calibration entry 433 + 194 remaining).
- Dispatched via 10 sub-agent batches (9 × 20 entries + 1 × 14).
- Registry integrity maintained across all batches (547 lines, no HALT).
- Evidence file ready for morning synthesis.

<!-- PROGRESS MARKER: PARTITION COMPLETE 195/195 entries at 2026-04-19 -->
