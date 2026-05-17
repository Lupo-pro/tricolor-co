# LATRICOLOR.CO · Content Machine

Automated Instagram content pipeline for the 6-week sprint into Mundial 2026.

```
satori (HTML/JSX → SVG)  →  sharp (SVG → PNG 1080×… )
            ↓                            ↓
   Claude API (captions)          /data/drafts/{date}/
            ↓                            ↓
     /admin/swipe          (Tinder-style validation, 5 min/day)
            ↓
   PostEverywhere → Instagram (scheduled in Colombia time)
```

This is the **scaffold** commit. See subsequent commits for templater, AI, sequences, calendar, publisher, dashboard, cron, full docs.
