# Case Management System (CaseBook)

> **Digital Legal Record, Court Hearing Scheduler & Client Portal**
> Developed by **Atul Kumar Mishra** (Advocate & Developer)
> Chambers of **Mr. Sushil Kumar Mishra** (Senior Advocate)

---

## Key Features

1. **Admin Management Console**:
   - Dynamic Case Registration with tailored legal inputs for **Civil**, **Criminal**, and **Revenue** cases.
   - Comprehensive **Search & Case Dossier** card with live filters.
   - Protected **Danger Zone** for secure case record deletion.
   - Live **Courts Directory** management (Add / Edit / Delete courts).

2. **Interactive Hearing Calendar & Cause List Generator**:
   - Monthly visual court appearance scheduler with case type color-coding (Civil, Criminal, Revenue).
   - **Print Daily Cause List**: Instant 1-click generation of A4 print-ready court board with advocate signature block.

3. **Direct WhatsApp Client Hearing Notifications**:
   - Instant WhatsApp notice generation featuring customized chamber header and contact details.

4. **Guest / Client Tracking Portal**:
   - Public read-only search portal allowing clients to track their next hearing date securely.

5. **Supabase Cloud Synchronization & Offline Fallback**:
   - Real-time cloud sync with fallback local storage for uninterrupted offline operation.

---

## Modern Architecture

This application is built as a modular, mobile-first web application:

### File Structure
```
index.html          -- Main HTML (modern, semantic, icon-based)
styles.css          -- Modern CSS design system with CSS custom properties
   app.js              -- Main ES6 module entry point
   auth-service.js     -- Authentication and session management
   supabase-service.js -- Database operations and cloud sync
   case-service.js     -- Case management operations
   hearing-service.js  -- Hearing and scheduling operations
   calendar-service.js -- Calendar and scheduling UI
   task-service.js     -- To-do and deadline management
   ui-service.js       -- UI rendering and DOM manipulation
   app-core.js         -- Main orchestrator coordinating all services
```

### Design Principles
- **Mobile-First**: Responsive layout with 1-column on mobile, 2x2 grid on tablet, 4-column on desktop
- **Professional Iconography**: All icons use FontAwesome 6 SVG (no emojis)
- **Component-Based CSS**: CSS custom properties for consistency
- **WCAG Accessibility**: Focus visible states, ARIA labels, semantic HTML

---

## How to Host on GitHub Pages

### Step 1: Initialize Git
```bash
git init
git add .
git commit -m "Initial commit: CaseBook"
```

### Step 2: Push to GitHub
1. Create a new repo at [GitHub](https://github.com/new)
2. Link and push:
```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/Case_Management_System.git
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to repo **Settings** -> **Pages** 
2. Select `main` branch and `/ (root)` folder
3. Save — site publishes in ~1 minute

---

## Login Credentials
- **Username**: `AtulMishra`
- **Password**: `Mishraatul161`
- **Guest Access**: Click **"Continue as Guest"** to search by Case Number or Mobile Number

---

## Technologies Used
- **Frontend**: Vanilla HTML/CSS/JS (ES6 Modules)
- **UI Framework**: Tailwind CSS (for utility classes)
- **Icons**: Font Awesome 6 (SVG-based, no emojis)
- **Fonts**: Plus Jakarta Sans & Inter (Google Fonts)
- **Database**: Supabase (PostgreSQL backend)
- **PWA**: Service Worker for offline capability