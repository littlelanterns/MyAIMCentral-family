# CLAUDE.md Header Addition

**Instructions for Claude Code:** Prepend this block to the TOP of the existing CLAUDE.md file, before any existing content. Do not remove existing conventions — add this above them.

---

**Text to prepend:**

```markdown
# MyAIM Family — Builder Context

## What This Product Is

MyAIM Family is a family management and transformation platform paired with AI Magic for Moms (AIMfM), an AI literacy membership. The platform serves moms managing complex households — including homeschool families, disability families, and families navigating Education Savings Accounts. The AI assistant LiLa (Little Lanterns) is a context-aware family AI that assembles knowledge about each family member to make every interaction specific to this family, not generic advice.

The core design philosophy is **Human-in-the-Mix**: every AI output passes through Edit / Approve / Regenerate / Reject before becoming permanent. This is simultaneously a UX pattern, a COPPA compliance mechanism, and a legal liability shield. It is non-negotiable in every feature.

The platform serves five user types through five purpose-built shells: Mom (full command center), Adult (scoped view), Independent (teens), Guided (kids 8-12), and Play (young children). These are not permission layers — they are fundamentally different interfaces.

## Why 40+ PRDs Exist Before Most Code

This repository contains 40+ Product Requirement Documents that were written before building. This is intentional. The platform handles children's data, disability documentation, family finances, and sensitive relationship context. Each PRD specifies screens, interactions, data models, permission structures across all five roles, and architectural decisions with rationale.

A 97-file compliance audit was conducted before the build sprint. When it found that early code diverged from the PRDs, we rebuilt from scratch. The PRDs are the single source of truth. The corrected reference documents in `audit/` are authoritative. Old build prompts and summary documents are superseded.

**PRDs answer what and why. Build prompts answer how.** No file paths, component architecture, or session setup instructions belong in PRDs.

## Key Architectural Principles

- **Mom-first:** Every design decision serves mom's workflow first. Other roles get scoped access that ultimately serves mom's goals.
- **Family context is the differentiator:** Without context, LiLa is just another chatbot. With it, she's a partner who knows this specific family.
- **Embedding-first classification:** ~90% of routine classification uses pgvector embeddings, not LLM calls. Total AI cost: ~$0.20/family/month.
- **Templates as data, not code:** Report templates, guided modes, and widget configurations are database rows, not code files.
- **Celebration only, never punishment:** Victory Recorder shows what was done, never what wasn't. No shame mechanics anywhere.

---

```

**Below this, all existing CLAUDE.md conventions remain unchanged.**
