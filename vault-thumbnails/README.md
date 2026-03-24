# Vault Thumbnails

This folder contains 54 AI-generated paper-craft style thumbnail images for the MyAIMCentral Vault tools.

## Contents

- **54 named thumbnail PNGs** at 1024×1024px each, prefixed with `vault_thumb_`
- **`grids/`** — The 4 source grid sheets (2048×2048px each) used to generate the thumbnails

## Naming Convention

Each file follows the pattern `vault_thumb_<tool_name>_<variant>.png` where variant is A, B, or C.

| Tool Group | Files |
|---|---|
| ThoughtSift | `board_of_directors`, `perspective_shifter`, `decision_guide`, `mediator`, `translator` |
| Love Languages | `love_languages_words`, `love_languages_service`, `love_languages_gifts`, `love_languages_time`, `love_languages_touch` |
| Other Tools | `cyrano_higgins`, `consistent_characters`, `photoshoot`, `task_breaker`, `image_style_library`, `getting_started_ai` |
| Planning | `meal_planning`, `building_app_ai` |

## Style

All images use the paper-craft art style with the project's defined warm color palette. See the `image-grid-slice` skill for the full style guide and regeneration instructions.

## Regeneration

To regenerate or add new thumbnails, use the `image-grid-slice` skill. The workflow is:
1. Generate 4×4 grid sheets using the standard prompt template
2. Run `slice_grid.py` to extract individual tiles
3. Name files using the `vault_thumb_<name>_<variant>` convention
