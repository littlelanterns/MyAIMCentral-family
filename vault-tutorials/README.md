# AI Vault Tutorials

Two self-contained HTML tutorial pages for the MyAIM Central AI Vault. Both are designed to be embedded in the Vault modal system via `<iframe>` and are fully gated by the platform's existing authentication.

## Files

| File | Description | Vault Category |
|------|-------------|----------------|
| `tutorial1_consistent_characters.html` | The image grid method for consistent characters, styles, and visual assets | Creative & Fun |
| `tutorial2_build_app.html` | How to build a real app with AI — the full process from idea to deployment | Build & Create |
| `prompt_pack.pdf` | Downloadable prompt pack — all prompts used in Tutorial 1 with annotations | Attachment |
| `prompt_pack.md` | Source markdown for the prompt pack | Source |

## Integration Notes

### Embedding in the Vault Modal

Both HTML files are fully self-contained — all images are embedded as base64 data URIs, so no external assets are required. To embed in the Vault modal:

1. Host the HTML file (or serve it from a Supabase Storage bucket)
2. Set the `iframe_url` field in the `vault_items` table to the hosted URL
3. The modal renders the iframe at full height; both tutorials use sticky navigation and a scroll progress bar

### Vault Item Metadata Suggestions

**Tutorial 1:**
- `title`: "One Prompt. Hundreds of Matching Images."
- `category`: Creative & Fun
- `tier`: Free or Member (your choice)
- `read_time`: 20–30 min
- `tags`: image generation, consistent characters, prompt engineering, visual schedule

**Tutorial 2:**
- `title`: "I Spent Months Learning What NOT to Do. Here's What Works."
- `category`: Build & Create
- `tier`: Member
- `read_time`: 45–60 min
- `tags`: app building, AI tools, no-code, PRD, Claude Code, Supabase

### Prompt Pack Attachment

The `prompt_pack.pdf` is designed to be linked from the "Download the Grid Skill" and "Prompt Pack" buttons in Tutorial 1. Store in Supabase Storage and update the `href="#"` placeholders in the HTML.

## Manus Referral Link

Both tutorials include the referral link: `https://manus.im/invitation/F0KVQFJNF28T1L`

This is embedded in the CTA block at the bottom of each tutorial.
