-- Migration 100159 — Update LiLa Assist opening messages for concierge framing.
--
-- Per PRD-05 Drawer Default and Routing Concierge Addendum section 4e rule 11
-- (2026-04-23). The drawer default flipped from General / Sitting LiLa to
-- LiLa Assist; Assist is now mom's always-on front-door concierge. The old
-- opening messages primed mom for pure feature-discovery. The new variants
-- reflect Assist's dual identity (guide AND concierge) so the first thing
-- mom sees on drawer-open matches the concierge behavior.
--
-- These three strings are the canonical source (addendum section 4e rule 11);
-- the Assist system prompt in system-prompts.ts and lila-chat/index.ts also
-- lists them, but the DB row at lila_guided_modes.opening_messages is what
-- the drawer actually surfaces on first-turn for a new conversation
-- (LilaDrawer.tsx:163).
--
-- Column type is JSONB (not TEXT[]), so we cast the new value to jsonb and
-- guard with a JSONB containment check.
--
-- Idempotent: WHERE clause guards against re-running when the first concierge
-- opener is already present in the array.

UPDATE lila_guided_modes
SET opening_messages = '[
  "Hey! I''m Assist — I can walk you through anything in the app, or point you toward the right LiLa tool if I can tell you need something more specific. What''s up?",
  "Hi there! What are you trying to do? I can help you figure out the how, or get you to the right tool for what you need.",
  "Welcome! Looking for how to do something, or working through a situation? Either way, I''ve got you."
]'::jsonb
WHERE mode_key = 'assist'
  AND NOT (
    opening_messages @> '["Hey! I''m Assist — I can walk you through anything in the app, or point you toward the right LiLa tool if I can tell you need something more specific. What''s up?"]'::jsonb
  );
