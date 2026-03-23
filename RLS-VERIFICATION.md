# RLS Verification Matrix

Per-table, per-role access verification. Run after each build phase.

**Access Level Shorthand:**
- ✅ Full — CRUD on own/family data
- 👀 Read — Read-only access
- 🔒 Scoped — Access filtered by permissions (member_permissions, access_schedules)
- ❌ None — No access
- 👑 All — Unrestricted within family (mom only)

| Table | Mom | Dad/Adult | Special Adult | Independent Teen | Guided/Play | RLS Policy Name | Verified | Notes |
|-------|-----|-----------|---------------|-----------------|-------------|-----------------|----------|-------|
| families | 👑 | 👀 | 👀 | 👀 | 👀 | | | |
| family_members | 👑 | 🔒 | 🔒 | 👀 own | 👀 own | | | |
| | | | | | | | | |
