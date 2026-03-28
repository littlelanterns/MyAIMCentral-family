# Platform Assets Manifest

> Auto-generated from Supabase `platform_assets` table.
> Use `feature_key` + `variant` + `category` to fetch any image via `assets.ts` helpers.
> All images are semantically searchable via the `match_assets()` RPC function.

## Summary

| Stat | Value |
|---|---|
| Total rows | 144 |
| App feature icons | 90 (30 features × 3 variants) |
| Vault thumbnails | 54 (18 tools × 3 variants) |
| Rows with embeddings | 144 / 144 |
| Sizes available | 512px, 128px, 32px |
| Storage bucket | `platform-assets` (public) |

## How to Use

```typescript
import { getAsset, getAssetVariants, getFeatureIcon } from '@/lib/assets'

// Get a specific image URL
const url = await getAsset('feature_dashboard', 'app_icon', 'A', 128)

// Get all 3 variants for user to choose from
const variants = await getAssetVariants('vault_board_of_directors', 'vault_thumbnail', 512)

// Get illustrated icon for current vibe (returns null for non-illustrated vibes)
const icon = await getFeatureIcon('dashboard', currentVibe, 'A', 128)

// Semantic search (via Supabase RPC)
const { data } = await supabase.rpc('match_assets', {
  query_embedding: myEmbedding,  // from OpenAI text-embedding-3-small
  match_threshold: 0.5,
  match_count: 5,
  filter_category: 'app_icon'    // optional
})
```

---

## App Feature Icons (`app_icon`)

30 features × 3 variants = 90 images. Used for navigation, sidebar, and feature headers.

### `ai_vault`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | AI Vault tool library | vault, ai, tools, library | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_ai_vault_A.png) |
| B | None | AI Vault tool library | vault, ai, tools, library | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_ai_vault_B.png) |
| C | None | AI Vault tool library | vault, ai, tools, library | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_ai_vault_C.png) |

### `archives`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Archives and memory storage | archives, memory, history, storage | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_archives_A.png) |
| B | None | Archives and memory storage | archives, memory, history, storage | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_archives_B.png) |
| C | None | Archives and memory storage | archives, memory, history, storage | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_archives_C.png) |

### `bigplans`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Big plans and long-term goals | plans, goals, future, vision | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_bigplans_A.png) |
| B | None | Big plans and long-term goals | plans, goals, future, vision | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_bigplans_B.png) |
| C | None | Big plans and long-term goals | plans, goals, future, vision | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_bigplans_C.png) |

### `bookshelf`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Bookshelf and reading list | books, reading, learning, library | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_bookshelf_A.png) |
| B | None | Bookshelf and reading list | books, reading, learning, library | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_bookshelf_B.png) |
| C | None | Bookshelf and reading list | books, reading, learning, library | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_bookshelf_C.png) |

### `calendar`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Calendar and scheduling | calendar, schedule, dates, time | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_calendar_A.png) |
| B | None | Calendar and scheduling | calendar, schedule, dates, time | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_calendar_B.png) |
| C | None | Calendar and scheduling | calendar, schedule, dates, time | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_calendar_C.png) |

### `command_center`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Central command and control hub | command, hub, control, center | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_command_center_A.png) |
| B | None | Central command and control hub | command, hub, control, center | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_command_center_B.png) |
| C | None | Central command and control hub | command, hub, control, center | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_command_center_C.png) |

### `dashboard`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Main dashboard overview | dashboard, home, overview, summary | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_dashboard_A.png) |
| B | None | Main dashboard overview | dashboard, home, overview, summary | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_dashboard_B.png) |
| C | None | Main dashboard overview | dashboard, home, overview, summary | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_dashboard_C.png) |

### `evening_review`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Evening review and wind-down | evening, review, reflection, end | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_evening_review_A.png) |
| B | None | Evening review and wind-down | evening, review, reflection, end | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_evening_review_B.png) |
| C | None | Evening review and wind-down | evening, review, reflection, end | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_evening_review_C.png) |

### `family_feeds`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Family feeds and memories | family, feeds, memories, moments | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_family_feeds_A.png) |
| B | None | Family feeds and memories | family, feeds, memories, moments | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_family_feeds_B.png) |
| C | None | Family feeds and memories | family, feeds, memories, moments | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_family_feeds_C.png) |

### `family_hub`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Shared family hub | family, hub, shared, together | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_family_hub_A.png) |
| B | None | Shared family hub | family, hub, shared, together | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_family_hub_B.png) |
| C | None | Shared family hub | family, hub, shared, together | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_family_hub_C.png) |

### `family_management`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Family management and organization | family, management, organize, household | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_family_management_A.png) |
| B | None | Family management and organization | family, management, organize, household | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_family_management_B.png) |
| C | None | Family management and organization | family, management, organize, household | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_family_management_C.png) |

### `guiding_stars`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Personal guiding stars and values | stars, values, north star, purpose | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_guiding_stars_A.png) |
| B | None | Personal guiding stars and values | stars, values, north star, purpose | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_guiding_stars_B.png) |
| C | None | Personal guiding stars and values | stars, values, north star, purpose | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_guiding_stars_C.png) |

### `journal`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Personal journal and reflections | journal, writing, reflection, diary | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_journal_A.png) |
| B | None | Personal journal and reflections | journal, writing, reflection, diary | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_journal_B.png) |
| C | None | Personal journal and reflections | journal, writing, reflection, diary | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_journal_C.png) |

### `lifelantern`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | LifeLantern personal mission | lantern, mission, light, purpose | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_lifelantern_A.png) |
| B | None | LifeLantern personal mission | lantern, mission, light, purpose | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_lifelantern_B.png) |
| C | None | LifeLantern personal mission | lantern, mission, light, purpose | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_lifelantern_C.png) |

### `lila_chat`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | LiLa AI assistant chat | lila, ai, chat, assistant | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_lila_chat_A.png) |
| B | None | LiLa AI assistant chat | lila, ai, chat, assistant | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_lila_chat_B.png) |
| C | None | LiLa AI assistant chat | lila, ai, chat, assistant | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_lila_chat_C.png) |

### `lists`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Lists and quick capture | lists, capture, notes, quick | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_lists_A.png) |
| B | None | Lists and quick capture | lists, capture, notes, quick | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_lists_B.png) |
| C | None | Lists and quick capture | lists, capture, notes, quick | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_lists_C.png) |

### `meetings`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Meetings and scheduled connections | meetings, schedule, connect, gather | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_meetings_A.png) |
| B | None | Meetings and scheduled connections | meetings, schedule, connect, gather | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_meetings_B.png) |
| C | None | Meetings and scheduled connections | meetings, schedule, connect, gather | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_meetings_C.png) |

### `messages`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Messages and communication | messages, communication, chat, connect | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_messages_A.png) |
| B | None | Messages and communication | messages, communication, chat, connect | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_messages_B.png) |
| C | None | Messages and communication | messages, communication, chat, connect | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_messages_C.png) |

### `mindsweep`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | MindSweep brain dump and capture | mindsweep, brain dump, capture, clarity | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_mindsweep_A.png) |
| B | None | MindSweep brain dump and capture | mindsweep, brain dump, capture, clarity | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_mindsweep_B.png) |
| C | None | MindSweep brain dump and capture | mindsweep, brain dump, capture, clarity | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_mindsweep_C.png) |

### `morning_rhythm`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Morning routine and rhythm | morning, routine, rhythm, start | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_morning_rhythm_A.png) |
| B | None | Morning routine and rhythm | morning, routine, rhythm, start | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_morning_rhythm_B.png) |
| C | None | Morning routine and rhythm | morning, routine, rhythm, start | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_morning_rhythm_C.png) |

### `my_foundation`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Personal foundation and core beliefs | foundation, core, beliefs, self | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_my_foundation_C.png) |
| B | None | Personal foundation and core beliefs | foundation, core, beliefs, self | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_my_foundation_B.png) |
| C | None | Personal foundation and core beliefs | foundation, core, beliefs, self | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_my_foundation_A.png) |

### `people_relationships`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | People and relationships management | people, relationships, connections, family | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_people_relationships_A.png) |
| B | None | People and relationships management | people, relationships, connections, family | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_people_relationships_B.png) |
| C | None | People and relationships management | people, relationships, connections, family | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_people_relationships_C.png) |

### `safe_harbor`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Safe Harbor personal sanctuary | safe, harbor, sanctuary, peace | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_safe_harbor_A.png) |
| B | None | Safe Harbor personal sanctuary | safe, harbor, sanctuary, peace | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_safe_harbor_B.png) |
| C | None | Safe Harbor personal sanctuary | safe, harbor, sanctuary, peace | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_safe_harbor_C.png) |

### `settings`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Settings and preferences | settings, preferences, customize, configure | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_settings_A.png) |
| B | None | Settings and preferences | settings, preferences, customize, configure | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_settings_B.png) |
| C | None | Settings and preferences | settings, preferences, customize, configure | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_settings_C.png) |

### `studio`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Creative studio and templates | studio, creative, templates, design | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_studio_A.png) |
| B | None | Creative studio and templates | studio, creative, templates, design | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_studio_B.png) |
| C | None | Creative studio and templates | studio, creative, templates, design | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_studio_C.png) |

### `tasks`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Task management and to-dos | tasks, todo, checklist, action | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_tasks_A.png) |
| B | None | Task management and to-dos | tasks, todo, checklist, action | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_tasks_B.png) |
| C | None | Task management and to-dos | tasks, todo, checklist, action | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_tasks_C.png) |

### `thoughtsift`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | ThoughtSift thinking tool | thoughtsift, thinking, clarity, process | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_thoughtsift_A.png) |
| B | None | ThoughtSift thinking tool | thoughtsift, thinking, clarity, process | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_thoughtsift_B.png) |
| C | None | ThoughtSift thinking tool | thoughtsift, thinking, clarity, process | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_thoughtsift_C.png) |

### `universal_timer`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Universal timer and time tools | timer, time, countdown, focus | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_universal_timer_A.png) |
| B | None | Universal timer and time tools | timer, time, countdown, focus | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_universal_timer_B.png) |
| C | None | Universal timer and time tools | timer, time, countdown, focus | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_universal_timer_C.png) |

### `victories`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Wins and victories log | victories, wins, celebration, achievement | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_victories_A.png) |
| B | None | Wins and victories log | victories, wins, celebration, achievement | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_victories_B.png) |
| C | None | Wins and victories log | victories, wins, celebration, achievement | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_victories_C.png) |

### `widgets_trackers`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Widgets and habit trackers | widgets, trackers, habits, progress | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_widgets_trackers_A.png) |
| B | None | Widgets and habit trackers | widgets, trackers, habits, progress | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_widgets_trackers_B.png) |
| C | None | Widgets and habit trackers | widgets, trackers, habits, progress | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_widgets_trackers_C.png) |

---

## Vault Thumbnails (`vault_thumbnail`)

18 tools × 3 variants = 54 images. Used in the AI Vault tool cards.

### `board_of_directors`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Board of Directors thinking tool | board, directors, advisors, thinking | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_board_of_directors_A.png) |
| B | None | Board of Directors thinking tool | board, directors, advisors, thinking | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_board_of_directors_B.png) |
| C | None | Board of Directors thinking tool | board, directors, advisors, thinking | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_board_of_directors_C.png) |

### `building_app_ai`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Building an App with AI guide | building, app, ai, development | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_building_app_ai_A.png) |
| B | None | Building an App with AI guide | building, app, ai, development | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_building_app_ai_B.png) |
| C | None | Building an App with AI guide | building, app, ai, development | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_building_app_ai_C.png) |

### `consistent_characters`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Consistent Characters AI image tool | characters, consistent, ai, image | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_consistent_characters_A.png) |
| B | None | Consistent Characters AI image tool | characters, consistent, ai, image | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_consistent_characters_B.png) |
| C | None | Consistent Characters AI image tool | characters, consistent, ai, image | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_consistent_characters_C.png) |

### `cyrano_higgins`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Cyrano & Higgins communication coach | cyrano, higgins, coach, communication | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_cyrano_higgins_A.png) |
| B | None | Cyrano & Higgins communication coach | cyrano, higgins, coach, communication | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_cyrano_higgins_B.png) |
| C | None | Cyrano & Higgins communication coach | cyrano, higgins, coach, communication | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_cyrano_higgins_C.png) |

### `decision_guide`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Decision Guide decision-making tool | decision, guide, choice, framework | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_decision_guide_A.png) |
| B | None | Decision Guide decision-making tool | decision, guide, choice, framework | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_decision_guide_B.png) |
| C | None | Decision Guide decision-making tool | decision, guide, choice, framework | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_decision_guide_C.png) |

### `getting_started_ai`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Getting Started with AI guide | getting started, ai, guide, beginner | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_getting_started_ai_A.png) |
| B | None | Getting Started with AI guide | getting started, ai, guide, beginner | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_getting_started_ai_B.png) |
| C | None | Getting Started with AI guide | getting started, ai, guide, beginner | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_getting_started_ai_C.png) |

### `image_style_library`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Image Style Library visual reference | image, style, library, visual | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_image_style_library_A.png) |
| B | None | Image Style Library visual reference | image, style, library, visual | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_image_style_library_B.png) |
| C | None | Image Style Library visual reference | image, style, library, visual | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_image_style_library_C.png) |

### `love_languages_gifts`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Love Languages: Receiving Gifts | love, gifts, receiving, language | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_gifts_A.png) |
| B | None | Love Languages: Receiving Gifts | love, gifts, receiving, language | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_gifts_B.png) |
| C | None | Love Languages: Receiving Gifts | love, gifts, receiving, language | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_gifts_C.png) |

### `love_languages_service`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Love Languages: Acts of Service | love, service, acts, language | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_service_A.png) |
| B | None | Love Languages: Acts of Service | love, service, acts, language | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_service_B.png) |
| C | None | Love Languages: Acts of Service | love, service, acts, language | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_service_C.png) |

### `love_languages_time`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Love Languages: Quality Time | love, time, quality, language | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_time_A.png) |
| B | None | Love Languages: Quality Time | love, time, quality, language | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_time_B.png) |
| C | None | Love Languages: Quality Time | love, time, quality, language | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_time_C.png) |

### `love_languages_touch`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Love Languages: Physical Touch | love, touch, physical, language | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_touch_A.png) |
| B | None | Love Languages: Physical Touch | love, touch, physical, language | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_touch_B.png) |
| C | None | Love Languages: Physical Touch | love, touch, physical, language | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_touch_C.png) |

### `love_languages_words`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Love Languages: Words of Affirmation | love, words, affirmation, language | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_words_A.png) |
| B | None | Love Languages: Words of Affirmation | love, words, affirmation, language | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_words_B.png) |
| C | None | Love Languages: Words of Affirmation | love, words, affirmation, language | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_words_C.png) |

### `meal_planning`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Meal Planning assistant | meal, planning, food, cooking | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_meal_planning_A.png) |
| B | None | Meal Planning assistant | meal, planning, food, cooking | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_meal_planning_B.png) |
| C | None | Meal Planning assistant | meal, planning, food, cooking | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_meal_planning_C.png) |

### `mediator`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Mediator conflict resolution tool | mediator, conflict, resolution, balance | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_mediator_A.png) |
| B | None | Mediator conflict resolution tool | mediator, conflict, resolution, balance | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_mediator_B.png) |
| C | None | Mediator conflict resolution tool | mediator, conflict, resolution, balance | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_mediator_C.png) |

### `perspective_shifter`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Perspective Shifter reframing tool | perspective, reframe, shift, viewpoint | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_perspective_shifter_A.png) |
| B | None | Perspective Shifter reframing tool | perspective, reframe, shift, viewpoint | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_perspective_shifter_B.png) |
| C | None | Perspective Shifter reframing tool | perspective, reframe, shift, viewpoint | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_perspective_shifter_C.png) |

### `photoshoot`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Photoshoot AI photography tool | photoshoot, photography, ai, image | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_photoshoot_A.png) |
| B | None | Photoshoot AI photography tool | photoshoot, photography, ai, image | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_photoshoot_B.png) |
| C | None | Photoshoot AI photography tool | photoshoot, photography, ai, image | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_photoshoot_C.png) |

### `task_breaker`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Task Breaker project planning tool | task, breaker, planning, project | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_task_breaker_A.png) |
| B | None | Task Breaker project planning tool | task, breaker, planning, project | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_task_breaker_B.png) |
| C | None | Task Breaker project planning tool | task, breaker, planning, project | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_task_breaker_C.png) |

### `translator`

| Variant | Display Name | Description | Tags | 512px URL |
|---|---|---|---|---|
| A | None | Translator communication bridge tool | translator, communication, bridge, language | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_translator_A.png) |
| B | None | Translator communication bridge tool | translator, communication, bridge, language | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_translator_B.png) |
| C | None | Translator communication bridge tool | translator, communication, bridge, language | [link](https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_translator_C.png) |

---

## Auto-Embedding

New rows inserted into `platform_assets` are automatically embedded via the
`embed-platform-asset` Supabase Edge Function (triggered by database webhook).
See `build-prompts/platform-assets-auto-embed-edge-function.md` for setup instructions.

Embedding source text format:
```
{display_name}. {description}. Tags: {tags joined with ", "}
```