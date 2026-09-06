# Case Management System - Raw Element Architecture & DOM Structure

```text
<!DOCTYPE html>
<html lang="en">
├── <head>
│   ├── Meta Tags: UTF-8, Viewport, Theme Color, Apple/Mobile PWA
│   ├── Web Fonts: Google Fonts (Plus Jakarta Sans, Inter)
│   ├── Tailwind CSS CDN (Preflight disabled)
│   ├── Inline Auth Validation Script (cmUser session check)
│   ├── Font Awesome 6 Icons (CDN)
│   ├── Main Application Stylesheet: admin.css
│   └── Web App Manifest & App Icons (manifest.webmanifest, icons/)
│
└── <body>
    │
    ├── [1] #loginScreen (.auth-shell)
    │   └── .login-card
    │       ├── .auth-header (.brand-pill, h1, p, .creator-badge-card)
    │       ├── form#loginForm (#username, #password, #rememberMe, button:submit)
    │       ├── button#guestModeBtn (Continue as Guest)
    │       ├── button#loginInstallBtn (PWA Install / Shortcut)
    │       └── p#loginError
    │
    ├── [2] #guestScreen (.guest-screen.hidden)
    │   ├── header.guest-header-bar (.materialize-nav)
    │   │   └── .nav-wrapper (Brand Logo, #guestDesktopInstallBtn, #guestLogoutBtn)
    │   └── .guest-content
    │       ├── .search-panel (h2, input#guestSearch)
    │       ├── .search-results-panel (table#guestCasesTable)
    │       └── #guestCaseDetailsSection (Case Details Grid, Print Dossier)
    │           ├── .case-details-header (#guestCaseTypeBadge, #guestDetailPrintBtn)
    │           ├── #guestCaseDetailsEmpty
    │           └── #guestCaseDetailsContent (.case-details-grid)
    │
    ├── [3] #adminScreen (.page-shell.hidden)
    │   ├── header.top-header (.materialize-nav)
    │   │   └── #sidebarToggleBtn, CaseBook Logo, #desktopInstallBtn, #adminLogoutBtn
    │   ├── #sidebarOverlay (.sidebar-overlay)
    │   ├── nav.sidebar (.sidenav)
    │   │   ├── .user-view (.sidebar-author-card: Avatar, Name, Title, Jurisdiction)
    │   │   ├── Overview & Schedule:
    │   │   │   ├── #home (Home Dashboard)
    │   │   │   ├── #search (My Cases)
    │   │   │   ├── #causelist (My Cause List + badge)
    │   │   │   ├── #upcoming (Upcoming 7 Days + badge)
    │   │   │   ├── #calendar (Calendar Scheduler)
    │   │   │   └── #todo (To-Do & Deadlines + badge)
    │   │   ├── Case Workflow:
    │   │   │   ├── #add (Add New Case)
    │   │   │   ├── #update (Update Case)
    │   │   │   ├── #hearing (Update Hearing)
    │   │   │   ├── #transfer (Transfer Case)
    │   │   │   ├── #delete (Delete Case)
    │   │   │   ├── #courts (Manage Courts)
    │   │   │   └── #helpers (Court Helpers Directory + badge)
    │   │   ├── Case Registers:
    │   │   │   ├── #all (All Cases + badge)
    │   │   │   ├── #undated (Undated Cases + badge)
    │   │   │   └── #disposed (Disposed Cases + badge)
    │   │   ├── Database & Sync:
    │   │   │   └── #dbmanager (Supabase DB Manager)
    │   │   └── Settings:
    │   │       └── #settings (Change Password)
    │   │
    │   ├── main.content (Active Workspace Tab Container)
    │   │   ├── [Tab: #home] Home Dashboard (Hero Card, 6 KPI Metric Cards, Today's Board, Priority Tasks, Registers)
    │   │   ├── [Tab: #search] My Cases Registry (Counters Bar, Filter Drawer, Results Table, Complete Case Dossier)
    │   │   ├── [Tab: #causelist] Daily Cause List (Date Selector, Court Filter, Badges, Table, Printable View)
    │   │   ├── [Tab: #upcoming] 7-Day Upcoming Hearings (Horizon Header, Dynamic Docket Cards Grid)
    │   │   ├── [Tab: #todo] To-Do & Deadlines (Stats Bar, Add Task Form with Case Autocomplete, Tasks List)
    │   │   ├── [Tab: #calendar] Calendar Scheduler (Monthly Overview, Grid View, Selected Day Agenda)
    │   │   ├── [Tab: #add] Add New Case (Filing Year, Classification Forms: Civil, State, Family, Revenue, Misc, Complaint)
    │   │   ├── [Tab: #update] Update Case (Case Lookup, Edit Metadata, Status Switcher, Disposal Entry, Type Forms)
    │   │   ├── [Tab: #hearing] Forward / Update Hearing (Case Lookup, Before/After Comparison, Date Shortcuts, Stage Pills)
    │   │   ├── [Tab: #transfer] Transfer Case (Single Case Transfer Mode vs Bulk Cases Transfer Mode, History)
    │   │   ├── [Tab: #delete] Delete Case (Search, Case Preview Card, Confirmation Safeguard)
    │   │   ├── [Tab: #courts] Manage Courts (Directory Toolbar, Add Court Form, Courts Table)
    │   │   ├── [Tab: #helpers] Court Helpers Directory (Add Helper Card, Search Bar, Staff Directory Table)
    │   │   ├── [Tab: #all] All Cases Master Register (Type Pills, Unified Filters, Master Table, Pagination)
    │   │   ├── [Tab: #undated] Undated Cases (Unlisted Matters Table, Direct Date Assignment)
    │   │   ├── [Tab: #disposed] Disposed Cases (Concluded Files Table, Disposal Order Archive)
    │   │   ├── [Tab: #civil..#complaint] Legacy mounts for backwards compatibility
    │   │   ├── [Tab: #dbmanager] Supabase Cloud DB Manager (Table Selector, CRUD Form, Metadata Tool, Raw Grid)
    │   │   ├── [Tab: #settings] Admin Security Settings (Change Password Form)
    │   │   └── footer.modern-chambers-footer (Pillars, Navigation Portals, Watermarks, Copyright)
    │   │
    │   └── footer#fixedBottomNav (Back, Home, Forward Quick Navigation Buttons)
    │
    ├── [4] Print & Export Documents (Hidden on screen, Visible on @media print)
    │   ├── #printableCauseList (.printable-cause-list: A4 Printable Daily Cause List)
    │   │   ├── .cause-list-header & .cause-meta-box
    │   │   ├── table.cause-print-table
    │   │   └── .cause-list-footer
    │   └── #printableCaseDossier (.printable-case-dossier: Infographic Case Dossier)
    │       ├── .dossier-info-header & .dossier-info-title-strip
    │       ├── .dossier-info-metrics-grid (4-Metric KPI Strip)
    │       ├── .dossier-info-two-col (Particulars & Representation)
    │       ├── .proceedings-panel (Timeline Table)
    │       └── .dossier-info-footer
    │
    ├── [5] Dialogs & Interactive Modals
    │   ├── #editCourtModal (.modal-overlay.hidden) -> Edit Court Dialog
    │   ├── #deleteCourtModal (.modal-overlay.danger) -> Delete Court Confirmation
    │   ├── #editHelperModal (.modal-overlay.hidden) -> Edit Court Staff Dialog
    │   ├── #deleteHelperModal (.modal-overlay.danger) -> Delete Court Staff Confirmation
    │   ├── #caseHistoryModal (.modal-overlay.hidden) -> Case Proceedings Timeline Dialog
    │   └── #pwaGuideModal (.modal-overlay.hidden) -> App Installation Instructions Dialog
    │
    ├── [6] Floating Controls & Backdrops
    │   ├── #mobileFilterBackdrop (.mobile-filter-backdrop: Mobile Drawer Mask)
    │   └── button.mobile-fab-btn (.mobile-fab-btn: Floating Action Button + Add Case)
    │
    └── [7] Scripts (Supabase JS CDN, components/chambers-footer.js, admin.js)
```

Diff Applied to admin.html and index.html



+<!-- ==========================================================================
+     DOCUMENT HEAD & ASSET CONFIGURATION
+     Raw Format:
+     <head>
+     ├── Meta Tags: UTF-8, Viewport, Theme Color, Apple/Mobile PWA
+     ├── Web Fonts: Google Fonts (Plus Jakarta Sans, Inter)
+     ├── Tailwind CSS CDN (Preflight disabled)
+     ├── Inline Auth Validation Script (cmUser session check)
+     ├── Font Awesome 6 Icons (CDN)
+     ├── Main Application Stylesheet: admin.css
+     └── Web App Manifest & App Icons (manifest.webmanifest, icons/)
+     ========================================================================== -->
 <head>

 <body>
+    <!-- ==========================================================================
+         CMS RAW ELEMENT ARCHITECTURE & DOM SCHEMATIC
+         [Raw Format Diagram of All 7 Root Sections and Child Elements]
+         ========================================================================== -->
+
+    <!-- ==========================================================================
+         SECTION 1: AUTHENTICATION & LOGIN SCREEN
+         Raw Format:
+         #loginScreen (.auth-shell)
+         └── .login-card
+             ├── .auth-header (.brand-pill, h1, p, .creator-badge-card)
+             ├── form#loginForm (#username, #password, #rememberMe, button:submit)
+             ├── button#guestModeBtn
+             ├── button#loginInstallBtn
+             └── p#loginError
+         ========================================================================== -->
     <div id="loginScreen" class="auth-shell">

+    <!-- ==========================================================================
+         SECTION 2: GUEST PORTAL SCREEN (PUBLIC CASE TRACKING)
+         Raw Format:
+         #guestScreen (.guest-screen.hidden)
+         ├── header.guest-header-bar (.materialize-nav)
+         │   └── .nav-wrapper (Brand, Desktop Install Button, Logout Button)
+         └── .guest-content
+             ├── .search-panel (Heading, input#guestSearch)
+             ├── .search-results-panel (table#guestCasesTable)
+             └── #guestCaseDetailsSection
+                 ├── .case-details-header (#guestCaseTypeBadge, #guestDetailPrintBtn)
+                 ├── #guestCaseDetailsEmpty (Placeholder prompt)
+                 └── #guestCaseDetailsContent (.case-details-grid)
+         ========================================================================== -->
     <div id="guestScreen" class="guest-screen hidden">

+    <!-- ==========================================================================
+         SECTION 3: ADMIN MAIN APPLICATION SHELL
+         Raw Format:
+         #adminScreen (.page-shell.hidden)
+         ├── header.top-header (.materialize-nav: Menu Toggle, Brand Logo, Install, Logout)
+         ├── #sidebarOverlay (.sidebar-overlay: Mobile Backdrop)
+         ├── nav.sidebar (.sidenav: Author profile + Full navigation link hierarchy)
+         ├── main.content (.content: Active Workspace Tabs)
+         └── footer#fixedBottomNav (.fixed-bottom-nav: Mobile Bottom Bar)
+         ========================================================================== -->
     <div id="adminScreen" class="page-shell hidden">

-    <!-- Printable Daily Cause List Document (Optimized for A4 Print/PDF Export) -->
+    <!-- ==========================================================================
+         SECTION 4: PRINTABLE DOCUMENTS & PDF EXPORTS (@media print)
+         Raw Format:
+         ├── #printableCauseList (.printable-cause-list: A4 Printable Daily Cause List)
+         │   ├── .cause-list-header & .cause-meta-box
+         │   ├── table.cause-print-table
+         │   └── .cause-list-footer
+         └── #printableCaseDossier (.printable-case-dossier: Infographic Case Dossier)
+             ├── .dossier-info-header & .dossier-info-title-strip
+             ├── .dossier-info-metrics-grid (4-Metric KPI Strip)
+             ├── .dossier-info-two-col (Particulars & Representation)
+             ├── .proceedings-panel (Timeline Table)
+             └── .dossier-info-footer
+         ========================================================================== -->
     <div id="printableCauseList" class="printable-cause-list">

+    <!-- ==========================================================================
+         SECTION 5: INTERACTIVE MODALS & POPUP DIALOGS
+         Raw Format:
+         ├── #editCourtModal (.modal-overlay.hidden) -> Edit Court Dialog
+         ├── #deleteCourtModal (.modal-overlay.danger) -> Delete Court Confirmation
+         ├── #editHelperModal (.modal-overlay.hidden) -> Edit Court Staff Dialog
+         ├── #deleteHelperModal (.modal-overlay.danger) -> Delete Court Staff Confirmation
+         ├── #caseHistoryModal (.modal-overlay.hidden) -> Case Proceedings Timeline Dialog
+         └── #pwaGuideModal (.modal-overlay.hidden) -> App Installation Instructions Dialog
+         ========================================================================== -->
     <!-- Edit Court Modal Dialog -->
     <div id="editCourtModal" class="modal-overlay hidden"

+    <!-- ==========================================================================
+         SECTION 6: FLOATING CONTROLS & BACKDROPS
+         Raw Format:
+         ├── #mobileFilterBackdrop (.mobile-filter-backdrop: Mobile Drawer Mask)
+         └── button.mobile-fab-btn (.mobile-fab-btn: Floating Action Button + Add Case)
+         ========================================================================== -->
     <!-- Mobile Filter Backdrop (for sliding drawer) -->
     <div id="mobileFilterBackdrop"

+    <!-- ==========================================================================
+         SECTION 7: CLIENT-SIDE JAVASCRIPT & RUNTIME LIBRARIES
+         Raw Format:
+         ├── Supabase JS SDK CDN (@supabase/supabase-js@2)
+         ├── Modern Chambers Footer Web Component (components/chambers-footer.js)
+         └── Core Application Controller (admin.js)
+         ========================================================================== -->
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" defer></script>
         
         
         
         
         
         
    # Case Management System - Raw Element Architecture & DOM Structure

```text
<!DOCTYPE html>
<html lang="en">
├── <head>
│   ├── Meta Tags: UTF-8, Viewport, Theme Color, Apple/Mobile PWA
│   ├── Web Fonts: Google Fonts (Plus Jakarta Sans, Inter)
│   ├── Tailwind CSS CDN (Preflight disabled)
│   ├── Inline Auth Validation Script (cmUser session check)
│   ├── Font Awesome 6 Icons (CDN)
│   ├── Main Application Stylesheet: admin.css
│   └── Web App Manifest & App Icons (manifest.webmanifest, icons/)
│
└── <body>
    │
    ├── [1] #loginScreen (.auth-shell)
    │   └── .login-card
    │       ├── .auth-header (.brand-pill, h1, p, .creator-badge-card)
    │       ├── form#loginForm (#username, #password, #rememberMe, button:submit)
    │       ├── button#guestModeBtn (Continue as Guest)
    │       ├── button#loginInstallBtn (PWA Install / Shortcut)
    │       └── p#loginError
    │
    ├── [2] #guestScreen (.guest-screen.hidden)
    │   ├── header.guest-header-bar (.materialize-nav)
    │   │   └── .nav-wrapper (Brand Logo, #guestDesktopInstallBtn, #guestLogoutBtn)
    │   └── .guest-content
    │       ├── .search-panel (h2, input#guestSearch)
    │       ├── .search-results-panel (table#guestCasesTable)
    │       └── #guestCaseDetailsSection (Case Details Grid, Print Dossier)
    │           ├── .case-details-header (#guestCaseTypeBadge, #guestDetailPrintBtn)
    │           ├── #guestCaseDetailsEmpty
    │           └── #guestCaseDetailsContent (.case-details-grid)
    │
    ├── [3] #adminScreen (.page-shell.hidden)
    │   ├── header.top-header (.materialize-nav)
    │   │   └── #sidebarToggleBtn, CaseBook Logo, #desktopInstallBtn, #adminLogoutBtn
    │   ├── #sidebarOverlay (.sidebar-overlay)
    │   ├── nav.sidebar (.sidenav)
    │   │   ├── .user-view (.sidebar-author-card: Avatar, Name, Title, Jurisdiction)
    │   │   ├── Overview & Schedule (Home, Search, Cause List, Upcoming, Calendar, Todo)
    │   │   ├── Case Workflow (Add, Update, Hearing, Transfer, Delete, Courts, Helpers)
    │   │   ├── Case Registers (All, Undated, Disposed)
    │   │   ├── Database (Supabase DB Manager)
    │   │   └── Settings (Change Password)
    │   │
    │   ├── main.content (Active Workspace Tab Container)
    │   │   ├── [Tab: #home] Home Dashboard
    │   │   ├── [Tab: #search] My Cases Registry
    │   │   ├── [Tab: #causelist] Daily Cause List
    │   │   ├── [Tab: #upcoming] 7-Day Upcoming Hearings
    │   │   ├── [Tab: #todo] To-Do & Deadlines
    │   │   ├── [Tab: #calendar] Calendar Scheduler
    │   │   ├── [Tab: #add] Add New Case
    │   │   ├── [Tab: #update] Update Case
    │   │   ├── [Tab: #hearing] Forward / Update Hearing
    │   │   ├── [Tab: #transfer] Transfer Case
    │   │   ├── [Tab: #delete] Delete Case
    │   │   ├── [Tab: #courts] Manage Courts
    │   │   ├── [Tab: #helpers] Court Helpers Directory
    │   │   ├── [Tab: #all] All Cases Master Register
    │   │   ├── [Tab: #undated] Undated Cases
    │   │   ├── [Tab: #disposed] Disposed Cases
    │   │   ├── [Tab: #civil..#complaint] Legacy mounts
    │   │   ├── [Tab: #dbmanager] Supabase Cloud DB Manager
    │   │   ├── [Tab: #settings] Admin Security Settings
    │   │   └── footer.modern-chambers-footer
    │   │
    │   └── footer#fixedBottomNav (Back, Home, Forward Quick Navigation Buttons)
    │
    ├── [4] Print & Export Documents (Hidden on screen, Visible on @media print)
    │   ├── #printableCauseList (.printable-cause-list)
    │   └── #printableCaseDossier (.printable-case-dossier)
    │
    ├── [5] Dialogs & Interactive Modals
    │   ├── #editCourtModal
    │   ├── #deleteCourtModal
    │   ├── #editHelperModal
    │   ├── #deleteHelperModal
    │   ├── #caseHistoryModal
    │   └── #pwaGuideModal
    │
    ├── [6] Floating Controls & Backdrops
    │   ├── #mobileFilterBackdrop
    │   └── button.mobile-fab-btn (+ Add Case)
    │
    └── [7] Scripts (Supabase JS CDN, components/chambers-footer.js, admin.js)