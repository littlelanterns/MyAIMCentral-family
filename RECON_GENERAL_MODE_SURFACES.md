# Recon Report — General Mode UI Surfaces

Worker: Recon-2 | Date: 2026-04-21 | Read-only inventory

---

## 1. Inventory Table

| File:Line | Surface Type | Current Behavior | User-Facing? | Recommended Action |
|---|---|---|---|---|
| `src/components/shells/MomShell.tsx:42` | Drawer state default | `lilaMode` initialized to `undefined` — drawer falls through to `'general'` at line 101 of LilaDrawer | **Y** (Mom shell) | Change default to `'help'` or `'assist'` |
| `src/components/lila/LilaDrawer.tsx:101` | Drawer boot default | `useState(initialMode \|\| 'general')` — when mom taps the LiLa pull-tab with no pre-selected mode, she lands in General | **Y** — PRIMARY EXPOSURE | Change fallback to `'help'` (recommended option ii) |
| `src/components/lila/LilaDrawer.tsx:212-215` | Conversation creation | Sends `mode: 'general'` + `guided_mode: undefined` when currentMode is 'general' | **Y** | Follows drawer default change |
| `src/components/lila/LilaDrawer.tsx:587` | HumanInTheMix gating | Treats 'general' as conversational mode (hides HITM buttons) | **Y** (indirect) | Remove 'general' from the list once default is changed |
| `src/components/lila/LilaModeSwitcher.tsx:13-14` | Mode picker dropdown — description | `MODE_DESCRIPTIONS.general = 'Open conversation — talk about anything'` | **Y** — the pitch itself | Remove entry |
| `src/components/lila/LilaModeSwitcher.tsx:20-21` | Mode picker — display label | `DISPLAY_OVERRIDES.general = 'General Chat'` | **Y** | Remove entry |
| `src/components/lila/LilaModeSwitcher.tsx:29-30` | Mode picker allowlist | `DRAWER_MODES` Set includes 'general' — renders it as a picker option in "Core Modes" section | **Y** — EXPLICIT ENTRY POINT | Remove `'general'` from the Set |
| `src/components/lila/LilaModeSwitcher.tsx:35-36` | Built-modes registry | `BUILT_MODES` Set includes 'general' — gates the dropdown button as clickable | **Y** (indirect) | Remove |
| `src/components/lila/LilaModeSwitcher.tsx:79` | Header fallback label | `currentLabel = ... \|\| 'General Chat'` | **Y** | Change fallback to `'Help'` |
| `src/components/lila/LilaModeSwitcher.tsx:82-83` | coreModes/guidedModes partition | Uses `['general', 'help', 'assist', 'optimizer']` to partition list | **Y** (indirect) | Remove `'general'` |
| `src/components/lila/LilaAvatar.tsx:70-71` | Display-name helper | `case 'general': return 'General Chat'` + default fallback | **Y** (history rows, resumed convos) | Remove case — keep default fallback but make it non-labeled |
| `src/components/lila/LilaConversationHistory.tsx:193-197` | History filter chip | "General" FilterChip button in Mode-filter row | **Y** — EXPLICIT ENTRY POINT (resumes a general convo → drawer re-opens in general mode) | Remove chip |
| `src/components/lila/LilaConversationHistory.tsx:287` | History list row avatar | `getAvatarKeyForMode(conv.mode \|\| 'general')` | N (avatar fallback) | Keep (defensive) |
| `src/components/shells/MomShell.tsx:103` | History select handler | `setLilaMode(conv.mode \|\| 'general')` — resuming a general convo puts drawer back in general | **Y** (indirect resume path) | Defensive fallback — leave, but will be unreachable after drawer default change |
| `src/components/shells/MomShell.tsx:197` | LilaModal modeKey | `activeConversation.guided_mode \|\| activeConversation.mode \|\| 'general'` | **Y** (resume flow) | Defensive — leave |
| `src/components/shells/GuidedShell.tsx:541` | History row avatar | `getAvatarKeyForMode(conv.mode \|\| 'general')` — Guided Write drawer history list | N (visual fallback) | Keep |
| `src/features/vault/components/VaultMyConversations.tsx:228` | Vault conversations avatar | Same fallback | N | Keep |
| `src/data/lanterns-path-data.ts:125` | Lanterns Path tour action | `tourAction: { type: 'lila', lilaMode: 'general', route: '/inner-workings' }` — InnerWorkings feature card CTA | **Y** — EXPLICIT ENTRY POINT | Change to `'assist'` |
| `src/data/lanterns-path-data.ts:171` | Lanterns Path tour action | `tourAction: { type: 'lila', lilaMode: 'general' }` — LiLa feature card CTA ("Ask LiLa: What do you know about my family?") | **Y** — EXPLICIT ENTRY POINT | Change to `'assist'` |
| `src/components/tour/GuidedIntroTour.tsx:117-121` | Tour event dispatch | Fires `tour-open-lila` with `{mode: action.lilaMode}` | N (pass-through) | No change needed |
| `src/lib/ai/system-prompts.ts:62` | Edge Function system prompt | `general:` prompt for Sitting LiLa | N (server-side, kept as technical fallback) | Keep (CLAUDE.md says mode_key stays in DB) |
| `supabase/functions/lila-chat/index.ts:347` | Edge Function mode resolution | `const modeKey = conversation.guided_subtype \|\| conversation.mode \|\| 'general'` | N (last-resort) | Keep (defensive fallback) |

---

## 2. Fallback Audit — modals that set `mode: 'general'` on `createConversation`

All four ToolConversationModal/TranslatorModal/BoardOfDirectorsModal/MeetingConversationView invocations set `mode: 'general'` but PAIR it with a specific `guided_mode`/`guided_subtype`. Analysis of whether `guided_mode` is reliably set:

| Modal | File:Line | `guided_mode` value | Reached by normal flow? | Verdict |
|---|---|---|---|---|
| `BoardOfDirectorsModal` | 398-400 | Hardcoded `guided_mode: 'board_of_directors'`, `guided_subtype: 'board_of_directors'` | Only via `ToolLauncherProvider` → `openTool('board_of_directors', ...)` | **Safe** — `general` is parent mode label only, never surfaces in UI. Keep. |
| `TranslatorModal` | 150-153 | Hardcoded `guided_mode: 'translator'` | Only via `openTool('translator', ...)` | **Safe** — same pattern. Keep. |
| `ToolConversationModal` | 487-496 | `guided_mode: modeKey` (prop) — modeKey comes from `ToolLauncherProvider.activeTool`, which is always a non-null specific tool key | Only reached when `activeTool !== null && !== 'translator' && !== 'board_of_directors'` | **Safe** — `modeKey` cannot be `'general'` by construction. Keep. |
| `MeetingConversationView` | 78-81 | Hardcoded `guided_mode: 'meeting'`, `guided_subtype: 'meeting'` | Only when mom opens a Meeting | **Safe** — keep. |
| `LilaModal` (expanded drawer view) | 118-124 | `guided_mode: modeKey` where `modeKey` comes from `activeConversation.guided_mode \|\| activeConversation.mode \|\| 'general'` (MomShell.tsx:197) | **DEFECT candidate** — if an existing conversation has `mode='general'` and `guided_mode=null`, expanding it lands in General | **User-facing once drawer default is General**; becomes unreachable once drawer default is changed |

No fallback is reached by normal flow today **except** the drawer's own default (LilaDrawer:101) — which is the whole point of this recon. The four tool modals correctly scope `general` to the DB `mode` column only, with a required `guided_mode` that drives the Edge Function's system-prompt selection.

---

## 3. Drawer-default UX Scope

### Option (i) — Require mom to pick a mode before talking
**Scope:** Larger. LilaDrawer:101 change to `null` + conditional render of a mode-picker landing panel (in place of the textarea) when `currentMode === null`. ~1 file, ~40 new lines for the landing panel. **Friction cost:** High — every fresh drawer-open requires 2 taps instead of 0. Mom loses the "just start typing" flow.

### Option (ii) — Drawer defaults to Help (Haiku, pattern-matched, near-zero cost)
**Scope:** Minimal. Three surgical changes: LilaDrawer.tsx:101 (default fallback), LilaModeSwitcher.tsx (remove 'general' from DRAWER_MODES/BUILT_MODES/overrides/descriptions — 5 line edits), MomShell.tsx:131 FloatingLilaButton for Help already exists so no shell change. ~2 files, ~8 line edits. **Friction cost:** Low — Help is already a FAB and a mode; mom lands in the same Help surface whether she taps the Help FAB or the pull-tab.

### Option (iii) — Drawer defaults to Assist (Haiku, conversational)
**Scope:** Identical to (ii), swap `'help'` for `'assist'`. **Friction cost:** Low — but Assist is tuned for "walk me through a feature" not "I have a thought," so the opening message may feel off for ambient journal-y usage.

### Option (iv) — Drawer shows "pick a tool" landing surface
**Scope:** Larger. New landing component rendered inside the drawer when `currentMode === null`: grid of mode cards (Help / Assist / Optimizer / tools). ~1 new component file, ~120 lines, plus LilaDrawer.tsx wiring. **Friction cost:** Medium — pretty, discoverable, but adds a step before every conversation.

### Recommendation: **Option (ii) — default to Help**

Rationale: lowest-friction removal of the open-chat surface. Help already does pattern-matching (near-zero cost when FAQ-matched), falls through to Haiku (cheap) when not, and the avatar/framing already exist in the FAB row. Mom's mental model — pull up the drawer, ask a question — stays identical; only the underlying model tier changes from Sonnet→Haiku.

---

## 4. Estimated Total Change Scope

**~7 files, 1 hook type, 2 drawer components, 2 tour data entries:**

- `src/components/lila/LilaDrawer.tsx` — default fallback (line 101), create-conversation branch (212-215), HITM gating list (587)
- `src/components/lila/LilaModeSwitcher.tsx` — remove from DRAWER_MODES/BUILT_MODES/MODE_DESCRIPTIONS/DISPLAY_OVERRIDES/partition filters (lines 13-14, 20-21, 29-30, 35-36, 79, 82-83)
- `src/components/lila/LilaAvatar.tsx` — `getModeDisplayName` case (line 70)
- `src/components/lila/LilaConversationHistory.tsx` — remove General filter chip (lines 193-197)
- `src/components/shells/MomShell.tsx` — change lilaMode initial state or leave (line 42 — optional; LilaDrawer default change makes this moot)
- `src/data/lanterns-path-data.ts` — two tour action entries (lines 125, 171) change `lilaMode: 'general'` → `lilaMode: 'assist'`
- `src/hooks/useLila.ts` — `LilaConversation.mode` and `useCreateConversation` param type union (lines 12, 264) — OPTIONAL (drop `'general'` from union, or leave as technical fallback for legacy rows)

**Defensive fallbacks KEPT:**
- `supabase/functions/lila-chat/index.ts:347` — server last-resort
- `src/lib/ai/system-prompts.ts:62` — server prompt
- `MomShell.tsx:103, 197` — history resume fallbacks
- `VaultMyConversations.tsx:228`, `GuidedShell.tsx:541`, `LilaConversationHistory.tsx:287` — avatar fallbacks

Legacy `lila_conversations.mode='general'` rows (72 conversations in DB per live_schema) remain readable in history; no migration required.
