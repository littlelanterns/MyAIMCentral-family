-- Phase 3 Connector Architecture — Sub-task 12
-- victory_godmother: creates a victory record for a family member when a
-- deed fires and a contract routes here. Uses inline payload only (no config table).
-- payload_text = victory description (or NULL for auto-generation from deed metadata).

CREATE OR REPLACE FUNCTION public.execute_victory_godmother(
  p_contract_id  UUID,
  p_deed_firing  JSONB,
  p_payload      JSONB,
  p_stroke_of    TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_family_id    UUID;
  v_member_id    UUID;
  v_description  TEXT;
  v_source_type  TEXT;
  v_source_id    UUID;
  v_victory_id   UUID;
  v_existing     UUID;
BEGIN
  v_family_id   := (p_deed_firing ->> 'family_id')::uuid;
  v_member_id   := (p_deed_firing ->> 'family_member_id')::uuid;
  v_source_type := p_deed_firing ->> 'source_type';
  v_source_id   := (p_deed_firing ->> 'source_id')::uuid;

  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error_message', 'victory_godmother: deed firing has no family_member_id'
    );
  END IF;

  -- Resolve description from payload or auto-generate
  v_description := p_payload ->> 'payload_text';
  IF v_description IS NULL OR v_description = '' THEN
    v_description := format('Achievement via %s', REPLACE(COALESCE(v_source_type, 'unknown'), '_', ' '));
  END IF;

  -- Idempotency: check for existing victory from this exact deed
  SELECT id INTO v_existing
    FROM public.victories
   WHERE family_id = v_family_id
     AND family_member_id = v_member_id
     AND source = 'contract_grant'
     AND source_reference_id = (p_deed_firing ->> 'id')::uuid::text
   LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'already_granted',
      'grant_reference', v_existing,
      'metadata', jsonb_build_object('family_member_id', v_member_id)
    );
  END IF;

  -- Insert victory
  INSERT INTO public.victories (
    family_id, family_member_id, description,
    source, source_reference_id,
    importance
  ) VALUES (
    v_family_id, v_member_id, v_description,
    'contract_grant', (p_deed_firing ->> 'id'),
    'small_win'
  )
  RETURNING id INTO v_victory_id;

  RETURN jsonb_build_object(
    'status', 'granted',
    'grant_reference', v_victory_id,
    'metadata', jsonb_build_object(
      'family_member_id', v_member_id,
      'description', v_description,
      'deed_source_type', v_source_type
    )
  );
END;
$fn$;

COMMENT ON FUNCTION public.execute_victory_godmother IS
  'Phase 3 connector: creates a victory record from a deed firing. '
  'Uses payload_text as description or auto-generates from deed metadata.';

DO $$ BEGIN RAISE NOTICE 'migration 100212: execute_victory_godmother created'; END $$;
