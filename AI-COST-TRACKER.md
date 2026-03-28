# AI Cost Tracker — Edge Function Cost Log

Track actual AI costs per Edge Function to validate P1-P9 optimization assumptions.

| Edge Function | Model | Avg Tokens/Call | Est. Cost/Call | Calls/Day (Est.) | Daily Cost (Est.) | Monthly Cost (Est.) | Notes |
|--------------|-------|-----------------|----------------|------------------|-------------------|---------------------|-------|
| embed | text-embedding-3-small | ~200 | $0.000004 | ~500 | $0.002 | $0.06 | Generic embedding processor. Batch via pgmq queue. |
| lila-chat | Claude Sonnet | ~2000 | ~$0.02 | TBD | TBD | TBD | Primary conversation handler |
| safety-classify | Claude Haiku | ~500 | ~$0.001 | TBD | TBD | TBD | Async safety classification |
| mindsweep-sort | Embedding + Haiku fallback | ~300 | ~$0.001 | TBD | TBD | TBD | Classification with P2 pattern |
| blog-comment-moderate | Claude Haiku | ~200 | ~$0.0005 | TBD | TBD | TBD | Binary moderation |
| | | | | | | | |
