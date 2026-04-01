-- PRD-25 Phase B: Write Drawer + Spelling Coaching
-- Adds entry_category to journal_entries, seeds spelling coaching cache

-- ─── entry_category on journal_entries ──────────────────────
-- Hook for homework tagging and PRD-37 → PRD-28B portfolio pipeline
-- NULL = standard journal entry (no special category)
-- Common categories: 'homework', 'school', 'creative_writing', 'book_report', etc.
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS entry_category TEXT;

CREATE INDEX IF NOT EXISTS idx_je_entry_category
  ON journal_entries (entry_category)
  WHERE entry_category IS NOT NULL;

-- ─── Seed spelling coaching cache ──────────────────────────
-- Common kid misspellings with kid-friendly teaching explanations
-- Only inserts if table is empty (idempotent)
INSERT INTO spelling_coaching_cache (misspelling, correction, explanation, source, language)
SELECT misspelling, correction, explanation, source, language FROM (VALUES
  ('their', 'there/they''re', 'Remember: "their" means belonging to them. "There" means a place. "They''re" means "they are."', 'seed_data', 'en'),
  ('there', 'their/they''re', '"There" means a place or "there is." "Their" means belonging to them. "They''re" means "they are."', 'seed_data', 'en'),
  ('your', 'you''re', '"Your" means belonging to you. "You''re" means "you are." Try replacing it with "you are" — if it makes sense, use "you''re."', 'seed_data', 'en'),
  ('its', 'it''s', '"Its" means belonging to it (no apostrophe!). "It''s" means "it is." Try replacing with "it is" — if it works, use "it''s."', 'seed_data', 'en'),
  ('alot', 'a lot', '"A lot" is always two words. Think of it like "a bunch" — two separate words.', 'seed_data', 'en'),
  ('becuase', 'because', 'Remember: "be-CAUSE." The cause comes after "be."', 'seed_data', 'en'),
  ('untill', 'until', '"Until" has only one L at the end. No double letters needed!', 'seed_data', 'en'),
  ('freind', 'friend', 'Remember: "I before E" — fr-I-E-nd. Your frIEnd to the END.', 'seed_data', 'en'),
  ('wierd', 'weird', '"Weird" is weird — it breaks the "I before E" rule! W-E-I-R-D.', 'seed_data', 'en'),
  ('definately', 'definitely', 'There''s "finite" hiding in "definitely" — de-FINITE-ly. No A!', 'seed_data', 'en'),
  ('wich', 'which', '"Which" starts with W-H. Think "WHich one?"', 'seed_data', 'en'),
  ('thier', 'their', '"Their" — think "THE-IR" — the thing that is theirs.', 'seed_data', 'en'),
  ('recieve', 'receive', '"I before E except after C" — re-C-E-I-ve. The C comes first, then EI.', 'seed_data', 'en'),
  ('tomorow', 'tomorrow', '"Tomorrow" has two R''s: to-MOR-ROW.', 'seed_data', 'en'),
  ('seperate', 'separate', 'There''s "A RAT" in "separate" — sep-A-R-A-T-e.', 'seed_data', 'en'),
  ('diffrent', 'different', '"Different" has three syllables: DIF-FER-ENT. Don''t forget the second one!', 'seed_data', 'en'),
  ('realy', 'really', '"Really" has two L''s — real-LY. It''s REAL + LY.', 'seed_data', 'en'),
  ('goverment', 'government', 'There''s a silent N hiding in there: go-VERN-ment. Think "to govern."', 'seed_data', 'en'),
  ('probly', 'probably', '"Probably" has all its syllables: PROB-AB-LY. Say each one!', 'seed_data', 'en'),
  ('wen', 'when', '"When" starts with W-H, just like "where," "what," and "why."', 'seed_data', 'en'),
  ('wat', 'what', '"What" starts with W-H. All question words do: what, when, where, why, who.', 'seed_data', 'en'),
  ('dont', 'don''t', '"Don''t" needs an apostrophe — it''s short for "do not." The apostrophe replaces the missing O.', 'seed_data', 'en'),
  ('cant', 'can''t', '"Can''t" needs an apostrophe — it''s short for "cannot." The apostrophe replaces the missing letters.', 'seed_data', 'en'),
  ('wont', 'won''t', '"Won''t" needs an apostrophe — it''s short for "will not" (English is funny sometimes!).', 'seed_data', 'en'),
  ('could of', 'could have', 'It sounds like "could of" but it''s actually "could have" (or "could''ve"). Same for "would have" and "should have."', 'seed_data', 'en'),
  ('would of', 'would have', 'It sounds like "would of" but it''s actually "would have" (or "would''ve").', 'seed_data', 'en'),
  ('should of', 'should have', 'It sounds like "should of" but it''s actually "should have" (or "should''ve").', 'seed_data', 'en'),
  ('to', 'too/two', '"To" = direction (go TO school). "Too" = also or excessive (me TOO, TOO much). "Two" = the number 2.', 'seed_data', 'en'),
  ('then', 'than', '"Then" = time (first this, THEN that). "Than" = comparison (bigger THAN).', 'seed_data', 'en'),
  ('are', 'our', '"Are" = a verb (you ARE). "Our" = belonging to us (OUR house).', 'seed_data', 'en')
) AS seed(misspelling, correction, explanation, source, language)
WHERE NOT EXISTS (SELECT 1 FROM spelling_coaching_cache LIMIT 1);
