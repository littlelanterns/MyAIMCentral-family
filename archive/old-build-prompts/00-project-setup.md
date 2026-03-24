# Build Prompt 00: Project Setup & Infrastructure

## PRD References
- Pre-Build Setup Checklist: `specs/Pre-Build-Setup-Checklist.md`
- Semantic Context Infrastructure: `specs/Semantic-Context-Infrastructure-Addendum.md`
- Platform Intelligence Pipeline v2: `specs/Platform-Intelligence-Pipeline-v2.md`

## Prerequisites
- None (this is the first phase)
- Tenise must have installed: AURI Security Scanner (MCP), mgrep Semantic Search
- `.env.local` populated with Supabase credentials

## Objective
Scaffold the entire project infrastructure: Vite + React 19 app, Supabase project, database extensions, embedding pipeline, Vercel deployment, testing framework, and CI/CD pipeline.

## Steps

### 1. Create Vite + React Project
```bash
npm create vite@latest myaim-central -- --template react-ts
cd myaim-central
npm install
```

### 2. Install Dependencies
```bash
# Supabase
npm install @supabase/supabase-js

# Routing (Vite SPA)
npm install react-router-dom

# UI
npm install lucide-react @tanstack/react-query

# Scheduling
npm install rrule

# Payments
npm install stripe @stripe/stripe-js

# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Supabase CLI
npm install -D supabase
```

### 3. Supabase Project Setup
- Create new Supabase project for MyAIM v2
- Enable extensions: pgvector, pgmq, pg_net, pg_cron
- Create `platform_intelligence` schema
- Update `.env.local` with new project credentials

### 4. Database Infrastructure
```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgmq;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create platform_intelligence schema
CREATE SCHEMA IF NOT EXISTS platform_intelligence;

-- Create embedding queue
SELECT pgmq.create('embedding_jobs');

-- Create generic embedding trigger function
CREATE OR REPLACE FUNCTION util.queue_embedding_job()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue embedding job for the changed row
  PERFORM pgmq.send('embedding_jobs', jsonb_build_object(
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'id', NEW.id,
    'operation', TG_OP
  ));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Schedule embedding queue processing (every 10 seconds)
SELECT cron.schedule('process-embeddings', '*/10 * * * * *',
  $$ SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/embed',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
    body := '{}'::jsonb
  ) $$
);
```

### 5. Deploy `embed` Edge Function
Generic embedding function that:
- Reads from pgmq `embedding_jobs` queue
- Calls OpenAI text-embedding-3-small (1536 dimensions)
- Writes halfvec(1536) embedding to source table
- Processes batch of up to 100 items per invocation

### 6. Vercel Deployment
- Connect GitHub repo to Vercel
- Configure environment variables
- Set up preview deployments for PRs

### 7. Project Structure
```
/src
  /pages        — Route components (react-router-dom)
  /components   — UI components
  /features     — Feature modules (one per PRD domain)
  /hooks        — Shared React hooks
  /lib
    /supabase   — Client, server, middleware
    /ai         — LiLa context assembly, model routing
    /permissions — useCanAccess, PermissionGate
    /theme      — Theme provider, vibe system
  /types        — TypeScript types (Supabase generated)
  /utils        — Shared utilities
/supabase
  /migrations   — SQL migrations
  /functions    — Edge Functions
  /seed.sql     — Seed data
/tests          — Test files
/public         — Static assets
```

### 8. TypeScript Configuration
- Strict mode enabled
- Path aliases configured
- Supabase type generation script

### 9. Testing Framework
- Vitest configured with jsdom environment
- Test files in `/tests/`
- Scripts: `npm test`, `npm run test:watch`

## Testing Checklist
- [ ] Vite + React app runs locally on localhost:5173
- [ ] Supabase connection works (can query empty database)
- [ ] pgvector extension enabled (can create vector columns)
- [ ] pgmq queue exists (embedding_jobs)
- [ ] embed Edge Function deployed and responds
- [ ] Embedding pipeline test: insert test record → embedding appears within 30 seconds
- [ ] Vercel deployment succeeds
- [ ] TypeScript compiles without errors
- [ ] Vitest runs test suite

## Definition of Done
- Project scaffold complete and deployed
- All extensions enabled
- Embedding pipeline operational
- CI/CD pipeline working
- All tracking files initialized (FIXME-LOG, PATTERN-DECISIONS, etc.)
