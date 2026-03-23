# Build Prompt 41: Tier Assignment Review

## PRD Reference
- PRD-31: `prds/scale-monetize/PRD-31-Subscription-Tier-System.md` (seed data phase)

## Prerequisites
- Phase 38 (Subscription Tier System) complete

## Objective
Review all TBD feature keys across the platform and assign final subscription tiers based on actual AI costs and value delivered. Seed the `feature_access_v2` table with per-role-group thresholds. Verify that Sonnet-powered features require Enhanced tier minimum, display-only features are available at Essential tier, and heavy AI features require Full Magic tier. This is a Small phase.

## Database Work
No new tables. This phase seeds and validates existing tables:

### Seed Data
- `feature_access_v2` — Populate all feature keys with correct tier assignments and role-group thresholds
- `feature_key_registry` — Verify all feature keys are registered with accurate descriptions
- `subscription_tiers` — Verify tier definitions match final pricing and feature sets

### Tier Assignment Rules
- **Essential ($9.99)** — Display-only features, basic CRUD, manual features with no AI cost
- **Enhanced ($16.99)** — Features using Sonnet (standard AI interactions, LiLa conversations, analysis)
- **Full Magic ($24.99)** — Heavy AI features (multi-model pipelines, RAG, Board of Directors, extensive extraction)
- **Creator ($39.99)** — Creator/power-user features (blog, advanced analytics, AI Vault content creation)

## Component Work
### Audit & Assignment
- Feature key audit — Review every feature_key in the registry; confirm none are TBD
- AI cost analysis — For each AI-powered feature, document the model(s) used and estimated per-use cost
- Tier assignment — Assign each feature to appropriate tier based on cost and value:
  - Display-only / no AI → Essential
  - Haiku-powered → Essential or Enhanced (based on frequency)
  - Sonnet-powered → Enhanced minimum
  - Multi-Sonnet or RAG pipelines → Full Magic
  - Creator tools → Creator
- Role-group thresholds — Set per-role-group access levels (mom, partner, teen, child, caregiver, co-parent)

### Verification
- Tier boundary verification — Confirm no Sonnet features are accessible at Essential tier
- Heavy AI verification — Confirm multi-model features require Full Magic
- Free feature verification — Confirm Friction Finder and other designated free features remain accessible without subscription
- Founding family verification — Confirm founding family rates apply correctly across all tiers

### Seed Script
- Migration script — Generate and run seed migration that populates feature_access_v2 with all assignments
- Rollback plan — Ensure seed data can be rolled back cleanly if needed

## Testing Checklist
- [ ] All feature keys in feature_key_registry have descriptions (no TBD)
- [ ] All feature keys have tier assignments in feature_access_v2 (no TBD)
- [ ] No Sonnet-powered feature is accessible at Essential tier
- [ ] Display-only features are all accessible at Essential tier
- [ ] Heavy AI features (multi-model, RAG) require Full Magic
- [ ] Creator features require Creator tier
- [ ] Role-group thresholds are set for all 6 role groups
- [ ] useCanAccess correctly gates features at assigned tiers
- [ ] Free features (Friction Finder, etc.) accessible without any subscription
- [ ] Founding family rates apply correctly across all 4 tiers
- [ ] Tier sampling costs are set for all samplable features
- [ ] Seed migration runs successfully and is reversible

## Definition of Done
- Zero TBD feature keys remaining in the system
- All feature_access_v2 rows populated with correct tier and role-group thresholds
- Tier assignment rules verified: Essential = display-only, Enhanced = Sonnet, Full Magic = heavy AI, Creator = creator tools
- useCanAccess three-layer check passing for all features at correct tiers
- Free features confirmed accessible without subscription
- Seed migration committed and tested
- Tier assignment documented for future reference
