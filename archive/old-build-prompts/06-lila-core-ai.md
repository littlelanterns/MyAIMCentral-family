# Build Prompt 06: LiLa Core AI System

## PRD Reference
- PRD-05: `prds/personal-growth/PRD-05-LiLa-Core-AI-System.md`
- PRD-05 Addendum: `prds/addenda/PRD-05-Planning-Decisions-Addendum.md`

## Prerequisites
- Phase 04 (Shell Routing) complete

## Objective
Build LiLa's conversation engine, drawer/modal UI, guided mode registry, context assembly pipeline, 4 core modes, streaming responses, crisis override.

## Database Work
Create tables:
- `lila_conversations` — Parent conversation records
- `lila_messages` — Individual messages
- `lila_guided_modes` — Mode registry (seed all known modes)
- `lila_tool_permissions` — Per-member tool access grants

## Edge Function Work
- `lila-chat` Edge Function:
  - Receives conversation_id, message, mode
  - Assembles context (mode-specific)
  - Routes to correct model (Sonnet or Haiku via OpenRouter)
  - Streams response back
  - Logs to ai_usage_log (fire-and-forget)

## Component Work
- LiLa drawer (mom) — bottom pull-up with conversation UI
- LiLa modal (others) — full-screen modal with conversation UI
- Conversation message list with streaming
- Message input with voice-to-text option
- Mode indicator and switching suggestion
- 4 core LiLa avatars (Happy to Help, Your Guide, Smart AI, Sitting)
- Crisis override detection and resource display
- Action chips (Edit in Notepad, Save to Journal, etc.)
- Human-in-the-Mix wrapper for AI outputs

## AI Integration
- Context assembly pipeline (8 steps from PRD-05)
- System prompt construction per mode
- Crisis override in EVERY system prompt
- Model routing (Sonnet default, Haiku for lightweight)
- Streaming response handling

## Testing Checklist
- [ ] LiLa drawer renders for mom, modal for others
- [ ] Messages stream correctly
- [ ] Mode registry contains all seeded modes
- [ ] Context assembly loads appropriate sources per mode
- [ ] Crisis keywords trigger immediate resource display
- [ ] Conversation history persists
- [ ] Safe Harbor conversations flagged with is_safe_harbor = true
- [ ] Human-in-the-Mix options appear on AI responses

## Definition of Done
- LiLa conversational in all 4 core modes
- Context assembly pipeline functional
- Crisis override tested and working
- Guided mode registry seeded with all modes
