# CaseBook Azure — Custom Style Raw Structure & Token Map

> The app-wide design system (Sept 2026). Ambient blue palette built on soft
> periwinkle, atmospheric sky blue, and deep ambient navy — calm, immersive.
> Reference implementation: the `★ CASEBOOK AZURE ★` banner comment in
> `admin.css` above the Case Cards Board section (~line 19178).

```text
CASEBOOK AZURE (Design System)
│
├── [1] COLOR TOKENS
│   ├── Deep Ambient Navy (headings, primary text)
│   │   ├── #0B132B  (case-card-name, home-today-card KPI value dark)
│   │   ├── #1C2541  (section headers, action-btn text)
│   │   └── #3A506B  (case-number chip text, pill text, KPI Total value)
│   ├── Azure (accents, icons, active states)
│   │   ├── #6FFFE9  (default accent strip gradient start, icon color)
│   │   ├── #5BC0BE  (active pill bg, accent strip gradient end, chevron open)
│   │   └── #8FD3F4  (soft sky — Pending KPI strip, family strip)
│   ├── Sky Blue (borders, dividers, type strips)
│   │   ├── #A0C4FF  (atmospheric sky — hover borders, disposed chip border)
│   │   ├── #B8D3FE  (light sky — default hover border, chip borders)
│   │   └── #E0E8F9  (soft periwinkle — card borders, section dashed rules)
│   ├── Blue Tints (backgrounds, washes)
│   │   ├── #EEF3FE  (chip/caseno bg, pill bg, expand-hint bg)
│   │   ├── #E0E8F9  (caseno chip bg, undated KPI icon bg)
│   │   ├── #F4F7FE  (actions-bar bg, details gradient start)
│   │   └── #F7FAFE  (card body gradient end, today-card bg)
│   ├── Amber Exception (criminal-type only)
│   │   ├── #f59e0b  (criminal strip gradient start)
│   │   └── #d97706  (criminal strip gradient end, criminal section icons)
│   ├── Red Exception (destructive only)
│   │   └── #b91c1c / #f87171 / #fef2f2 (delete btn text/border/hover bg)
│   ├── Undated Warning (soft, stays scannable)
│   │   └── #b45309 / #fefce8 / #fde68a (text/bg/border)
│   └── Base :root tokens (whole-app foundation)
│       ├── --surface-app #F4F7FE, --surface-tint #E0E8F9, --surface-subtle #F7FAFE
│       ├── --text-primary #1C2541, --text-secondary #3A506B, --text-muted #5A6B87
│       ├── --accent #0B132B, --accent-hover #1C2541, --accent-soft #E0E8F9
│       └── shadows rgba(28,37,65,…) navy-tinted
│
├── [2] CARD ANATOMY (.case-card — reference implementation)
│   ├── .case-card
│   │   ├── background: linear-gradient(135deg, #ffffff, #F7FAFE)
│   │   ├── border: 1.5px solid #E0E8F9; radius 16px
│   │   ├── shadow: 0 2px 6px rgba(58,80,107,0.06)
│   │   ├── hover: border #B8D3FE, shadow rgba(91,192,190,0.14), translateY(-1px)
│   │   └── expanded: border #A0C4FF, shadow rgba(91,192,190,0.18)
│   ├── .case-card::before  (LEFT ACCENT STRIP, 4px → 6px on hover)
│   │   ├── civil  → linear-gradient(#6FFFE9, #5BC0BE)
│   │   ├── criminal/state/complaint → linear-gradient(#f59e0b, #d97706)
│   │   ├── family  → linear-gradient(#8FD3F4, #5BC0BE)
│   │   ├── revenue → linear-gradient(#A0C4FF, #6FFFE9)
│   │   └── disposed → linear-gradient(#6FFFE9, #E0E8F9)
│   ├── .case-card-caseno     (pill: bg #E0E8F9, border #B8D3FE, text #3A506B)
│   ├── .case-card-nextdate   (pill: dated #EEF3FE/#3A506B, undated amber, disposed sky)
│   └── .case-card-details    (gradient #F4F7FE → #ffffff, border-top #E0E8F9)
│
├── [3] COMPONENT MAP (where CaseBook Azure lives)
│   ├── Case Cards Board (#cards tab)
│   │   ├── .case-card / type strips / chips / details grid
│   │   ├── .case-cards-pill (filters: periwinkle bg → #5BC0BE active)
│   │   ├── .case-card-action-btn (sky outline → #E0E8F9 hover)
│   │   └── .case-cards-empty (dashed #A0C4FF panel on #EEF3FE)
│   ├── Home KPI Cards (6 themes, all azure family now)
│   │   ├── .kpi-theme-total     (deep navy #3A506B)
│   │   ├── .kpi-theme-today     (azure #5BC0BE)
│   │   ├── .kpi-theme-upcoming  (aqua #6FFFE9)
│   │   ├── .kpi-theme-pending   (soft sky #8FD3F4)
│   │   ├── .kpi-theme-undated   (sky #A0C4FF)
│   │   └── .kpi-theme-disposed  (azure #5BC0BE / #1C2541)
│   │   └── pattern: radial azure wash on white + accent strips top/bottom
│   ├── Today's Court Appearance Board (#home)
│   │   ├── .home-today-list (flex column, 6px gap, 340px scroll)
│   │   ├── .home-today-card (bg #F7FAFE, border #E0E8F9 → #EEF3FE hover)
│   │   ├── .home-today-index (periwinkle circle #E0E8F9 / #3A506B)
│   │   └── .home-today-stage-pill (bg #EEF3FE, border #B8D3FE, #3A506B)
│   ├── Hearing history timeline (.case-card-hearing-item)
│   │   └── border-left 3px #A0C4FF, date #0B132B
│   └── Nav Case Search dropdown (white panel, #3A506B open icon)
│
├── [4] LAYOUT RULES
│   ├── Case Cards grid: single column (mobile AND desktop), gap 8px (6px mobile)
│   ├── Card detail rows: TWO-COLUMN section grid
│   │   ├── col 1: titles  minmax(150px, max-content), uppercase, nowrap, #94a3b8
│   │   ├── col 2: contents 1fr, #1e293b, left-aligned
│   │   └── rows use display:contents → all values share one left edge
│   ├── Chips/pills: border-radius 9999px, 2px 10px padding, 700 weight
│   └── Sections: flat/borderless, dashed #E0E8F9 dividers, header padding 8px 4px 6px
│
├── [5] USAGE RULES (keep the system coherent)
│   ├── New UI → use these tokens; never reintroduce emerald/teal/green defaults
│   ├── Amber ONLY for criminal-case accents; red ONLY for destructive actions
│   ├── Disposed = sky blue (not red/green generic); undated = soft amber warning
│   ├── Shadows: azure-tinted rgba(91,192,190,…)/rgba(58,80,107,…), not slate
│   └── When in doubt, copy from .case-card block in admin.css
│
└── [6] CHANGELOG
    ├── v7.35 — FULL THEME CONVERSION: CaseBook Mint (emerald) → CaseBook
    │            Azure (ambient blue): #0B132B deep navy / #1C2541 / #3A506B
    │            tones, #5BC0BE azure + #6FFFE9 aqua accents, #A0C4FF sky
    │            + #B8D3FE + #E0E8F9 periwinkle borders/tints. :root base
    │            tokens converted (whole-app surfaces, text, borders,
    │            shadows). Restore point: commit d96778e (Mint final);
    │            backup admin.css.mint-backup.
    ├── v7.34 — Court directory cards: Edit/Delete buttons stretch evenly
    │            across full card width (no trailing empty space); hearing
    │            case dropdown now shows ONLY undated cases (dated &
    │            disposed excluded), relabeled "Undated Cases List"
    ├── v7.33 — Court stage pills are now case-type-aware: selecting a case
    │            in Forward/Update Hearing re-renders pills (type-specific
    │            stages in solid azure + common core in periwinkle); added
    │            ~30 new presets across civil/criminal/state/complaint/
    │            family/revenue/misc (incl. Adjourned, Order Reserved,
    │            Charge Sheet, 313 CrPC, Maintenance, Mutation, PI etc.)
    ├── v7.32 — Bug fixes: deleted courts filtered out of all court
    │            filter dropdowns; native OS date picker fully suppressed
    │            (pointerdown interception + pointer-events CSS on the
    │            calendar indicator / edit segments)
    ├── v7.31 — Cause list desktop toolbar: Date + Court filter split
    │            50/50 on line 1, Quick Date pills on line 2
    ├── v7.30 — Cause list desktop toolbar fills full width (Quick Date
    │            group right-aligned via flex: 1, no trailing empty space)
    ├── v7.29 — Cause List toolbar reordered (Date → Court filter → Quick
    │            Date) with inline label+control rows on desktop; toolbar
    │            card + inputs + preset pills themed
    ├── v7.28 — Custom date picker (mint-datepicker.js): consistent
    │            Monday-first calendar popup on ALL 30+ date inputs;
    │            navy header, periwinkle grid, azure selected day,
    │            Today/Clear footer; values stay ISO YYYY-MM-DD
    ├── v7.27 — Data table headers unified (#EEF3FE thead, #1C2541
    │            text); sticky Quick Actions header cell now matches its
    │            row (was teal/white mismatch)
    ├── v7.26 — Fixed bottom nav re-tinted to navy gradient + sky top
    │            rule; z-index 2000 re-asserted so it spans full width
    │            ON TOP of the sidenav and overlay
    ├── v7.25 — Court Hearing Calendar & Scheduler re-tinted (blue grid
    │            container, azure day cells/today/selected, sky type
    │            pills w/ amber criminal exception, sky schedule cards)
    ├── v7.24 — Top nav re-tinted to deep navy gradient (#0B132B →
    │            #3A506B) with sky #B8D3FE bottom rule, sky brand icon,
    │            sky-bordered action buttons, sky search dropdown
    ├── v7.23 — Sidenav re-tinted to CaseBook Azure (sky gradient rail,
    │            #E0E8F9 borders/dividers, azure active pill w/ inset
    │            #5BC0BE strip, sky badges, azure scrollbar)
    ├── v7.22 — Courts directory table → cards grid (.courts-cards-grid /
    │            .court-directory-card with azure accent strip, index pill,
    │            sky icon tile, caseload chip)
    ├── v7.21 — #courts .court-add-card themed (panel-card look: sky
    │            gradient bg, #E0E8F9 border, sky header divider, azure
    │            focus ring on #courtInput, azure Submit button)
    └── v7.20 and earlier — see git history (Mint-era equivalent work)
```

**Companion file:** `RAW_STRUCTURE.md` documents the DOM element architecture;
this file documents the visual language applied to that structure.
