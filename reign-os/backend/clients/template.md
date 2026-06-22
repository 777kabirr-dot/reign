# Client Context Template

Reign agents read this file (stored in the `clients.context` column) to tailor
monitoring, content, and legal drafts. Keep the `Key: Value` lines — Sentinel
and Publisher parse them. Free-form prose below the fields is also passed to
Claude as background.

Client Name: {{ Full legal / public name }}
Brand Name: {{ Primary brand, if different from the person }}
Location: {{ City, Country }}
Industry: {{ e.g. Real Estate, FinTech, Hospitality }}
Tone: {{ Desired content voice, e.g. authoritative, warm, visionary }}
Key Search Terms: {{ comma-separated extra terms to monitor }}

## Background

{{ 1–2 paragraphs about who the client is, their reputation goals, notable
   achievements, and anything the AI should know. DO NOT include controversies
   you want suppressed here verbatim — describe the desired narrative instead. }}

## Positioning / Narrative

{{ The story Reign should reinforce: pillars, values, milestones. }}

## Sensitivities

{{ Topics to avoid, names not to mention, regions of concern. }}
