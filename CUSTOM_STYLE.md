# CaseBook Mint — Custom Style Raw Structure & Token Map

> The app-wide design system (named Sept 2026). Emerald-mint palette built on
> Tailwind's emerald scale, with amber reserved for criminal-type accents.
> Reference implementation: the `★ CASEBOOK MINT ★` banner comment in
> `admin.css` above the Case Cards Board section (~line 19178).

```text
CASEBOOK MINT (Design System)
│
├── [1] COLOR TOKENS
│   ├── Deep Emerald (headings, primary text)
│   │   ├── #064e3b  (case-card-name, home-today-card KPI value dark)
│   │   ├── #065f46  (section headers, action-btn text)
│   │   └── #047857  (case-number chip text, pill text, KPI Total value)
│   ├── Emerald (accents, icons, active states)
│   │   ├── #10b981  (default accent strip gradient start, icon color)
│   │   ├── #059669  (active pill bg, accent strip gradient end, chevron open)
│   │   └── #34d399  (soft emerald — Pending KPI strip, family strip)
│   ├── Mint (borders, dividers, type strips)
│   │   ├── #6ee7b7  (mid mint — hover borders, disposed chip border)
│   │   ├── #a7f3d0  (light mint — default hover border, chip borders)
│   │   └── #d1fae5  (pale mint — card borders, section dashed rules)
│   ├── Mint Tints (backgrounds, washes)
│   │   ├── #ecfdf5  (chip/caseno bg, pill bg, expand-hint bg)
│   │   ├── #d1fae5  (caseno chip bg, undated KPI icon bg)
│   │   ├── #f0fdf9  (actions-bar bg, details gradient start)
│   │   └── #f7fdfb  (card body gradient end, today-card bg)
│   ├── Amber Exception (criminal-type only)
│   │   ├── #f59e0b  (criminal strip gradient start)
│   │   └── #d97706  (criminal strip gradient end, criminal section icons)
│   ├── Red Exception (destructive only)
│   │   └── #b91c1c / #f87171 / #fef2f2 (delete btn text/border/hover bg)
│   ├── Undated Warning (soft, stays scannable)
│   │   └── #b45309 / #fefce8 / #fde68a (text/bg/border)
│   └── Slate Neutrals (body text, meta, labels)
│       ├── #1e293b (values), #475569 (meta), #64748b (sub), #94a3b8 (labels)
│       └── #0f172a → #064e3b swap for dark titles
│
├── [2] CARD ANATOMY (.case-card — reference implementation)
│   ├── .case-card
│   │   ├── background: linear-gradient(135deg, #ffffff, #f7fdfb)
│   │   ├── border: 1.5px solid #d1fae5; radius 16px
│   │   ├── shadow: 0 2px 6px rgba(6,95,70,0.06)
│   │   ├── hover: border #a7f3d0, shadow rgba(5,150,105,0.14), translateY(-1px)
│   │   └── expanded: border #6ee7b7, shadow rgba(5,150,105,0.18)
│   ├── .case-card::before  (LEFT ACCENT STRIP, 4px → 6px on hover)
│   │   ├── civil  → linear-gradient(#10b981, #059669)
│   │   ├── criminal/state/complaint → linear-gradient(#f59e0b, #d97706)
│   │   ├── family  → linear-gradient(#34d399, #059669)
│   │   ├── revenue → linear-gradient(#6ee7b7, #10b981)
│   │   └── disposed → linear-gradient(#10b981, #a7f3d0)
│   ├── .case-card-caseno     (pill: bg #d1fae5, border #a7f3d0, text #047857)
│   ├── .case-card-nextdate   (pill: dated #ecfdf5/#047857, undated amber, disposed mint)
│   └── .case-card-details    (gradient #f0fdf9 → #ffffff, border-top #d1fae5)
│
├── [3] COMPONENT MAP (where CaseBook Mint lives)
│   ├── Case Cards Board (#cards tab)
│   │   ├── .case-card / type strips / chips / details grid
│   │   ├── .case-cards-pill (filters: mint bg → #059669 active)
│   │   ├── .case-card-action-btn (mint outline → #d1fae5 hover)
│   │   └── .case-cards-empty (dashed #6ee7b7 panel on #ecfdf5)
│   ├── Home KPI Cards (6 themes, all emerald-mint now)
│   │   ├── .kpi-theme-total     (deep emerald #047857)
│   │   ├── .kpi-theme-today     (emerald #059669)
│   │   ├── .kpi-theme-upcoming  (emerald #10b981)
│   │   ├── .kpi-theme-pending   (soft #34d399)
│   │   ├── .kpi-theme-undated   (mint #6ee7b7)
│   │   └── .kpi-theme-disposed  (jade #059669 / #065f46)
│   │   └── pattern: radial emerald wash on white + accent strips top/bottom
│   ├── Today's Court Appearance Board (#home)
│   │   ├── .home-today-list (flex column, 6px gap, 340px scroll)
│   │   ├── .home-today-card (bg #f7fdfb, border #d1fae5 → #ecfdf5 hover)
│   │   ├── .home-today-index (mint circle #d1fae5 / #047857)
│   │   └── .home-today-stage-pill (bg #ecfdf5, border #a7f3d0, #047857)
│   ├── Hearing history timeline (.case-card-hearing-item)
│   │   └── border-left 3px #6ee7b7, date #064e3b
│   └── Nav Case Search dropdown (white panel, #007b6a open icon)
│
├── [4] LAYOUT RULES
│   ├── Case Cards grid: single column (mobile AND desktop), gap 8px (6px mobile)
│   ├── Card detail rows: TWO-COLUMN section grid
│   │   ├── col 1: titles  minmax(150px, max-content), uppercase, nowrap, #94a3b8
│   │   ├── col 2: contents 1fr, #1e293b, left-aligned
│   │   └── rows use display:contents → all values share one left edge
│   ├── Chips/pills: border-radius 9999px, 2px 10px padding, 700 weight
│   └── Sections: flat/borderless, dashed #d1fae5 dividers, header padding 8px 4px 6px
│
├── [5] USAGE RULES (keep the system coherent)
│   ├── New UI → use these tokens; never reintroduce blue/purple/green-600 defaults
│   ├── Amber ONLY for criminal-case accents; red ONLY for destructive actions
│   ├── Disposed = mint (not red/green generic); undated = soft amber warning
│   ├── Shadows: emerald-tinted rgba(5,150,105,…), not slate rgba(15,23,42,…)
│   └── When in doubt, copy from .case-card block in admin.css
│
└── [6] CHANGELOG
    ├── v7.34 — Court directory cards: Edit/Delete buttons stretch evenly
    │            across full card width (no trailing empty space); hearing
    │            case dropdown now shows ONLY undated cases (dated &
    │            disposed excluded), relabeled "Undated Cases List"
    ├── v7.33 — Court stage pills are now case-type-aware: selecting a case
    │            in Forward/Update Hearing re-renders pills (type-specific
    │            stages in solid emerald + common core in mint); added
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
    │            card + inputs + preset pills minted
    ├── v7.28 — Custom CaseBook Mint date picker (mint-datepicker.js):
    │            consistent Monday-first calendar popup on ALL 30+ date
    │            inputs; deep-emerald header, mint grid, emerald selected
    │            day, Today/Clear footer; values stay ISO YYYY-MM-DD
    ├── v7.27 — Data table headers unified to mint (#ecfdf5 thead, #065f46
    │            text); sticky Quick Actions header cell now matches its
    │            row (was teal/white mismatch)
    ├── v7.26 — Fixed bottom nav re-tinted to deep emerald gradient + mint
    │            top rule; z-index 2000 re-asserted so it spans full width
    │            ON TOP of the sidenav and overlay
    ├── v7.25 — Court Hearing Calendar & Scheduler re-tinted (mint grid
    │            container, emerald day cells/today/selected, mint type
    │            pills w/ amber criminal exception, mint schedule cards)
    ├── v7.24 — Top nav re-tinted to deep emerald gradient (#064e3b →
    │            #047857) with mint #a7f3d0 bottom rule, mint brand icon,
    │            mint-bordered action buttons, mint search dropdown
    ├── v7.23 — Sidenav re-tinted to CaseBook Mint (mint gradient rail,
    │            #d1fae5 borders/dividers, emerald active pill w/ inset
    │            #059669 strip, mint badges, emerald scrollbar)
    ├── v7.22 — Courts directory table → CaseBook Mint cards grid
    │            (.courts-cards-grid / .court-directory-card with emerald
    │            accent strip, index pill, mint icon tile, caseload chip)
    ├── v7.21 — #courts .court-add-card minted (panel-card look: mint
    │            gradient bg, #d1fae5 border, mint header divider, emerald
    │            focus ring on #courtInput, emerald Submit button)
    ├── v7.20 — #courtsTable minted (mint thead, row dividers, index badge)
    ├── v7.19 — Today's Board converted table → CaseBook Mint list cards
    ├── v7.18 — KPI 6 cards recolored to emerald-mint family; My Cases/All Cases
    │            nav links hidden on mobile (.nav-hide-mobile)
    └── v7.12–v7.17 — Case Cards emerald-mint restyle, two-column detail grid,
                 filter pills, spacing normalization
```

**Companion file:** `RAW_STRUCTURE.md` documents the DOM element architecture;
this file documents the visual language applied to that structure.
