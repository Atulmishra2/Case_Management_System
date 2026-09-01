# ⚖️ Case Management System

> **Digital Legal Record, Court Hearing Scheduler & Client Portal**
> Developed by **Atul Kumar Mishra** (Advocate & Developer)
> Chambers of **Mr. Sushil Kumar Mishra** (Senior Advocate)

---

## 🌟 Key Features

1. **🛡️ Admin Management Console**:
   - Dynamic Case Registration with tailored legal inputs for **Civil**, **Criminal**, and **Revenue** cases.
   - Comprehensive **Search & Case Dossier** card with live filters.
   - Protected **Danger Zone** for secure case record deletion.
   - Live **Courts Directory** management (Add / Edit / Delete courts).

2. **📅 Interactive Hearing Calendar & Cause List Generator**:
   - Monthly visual court appearance scheduler with case type color-coding (Civil, Criminal, Revenue).
   - **`🖨️ Print Daily Cause List`**: Instant 1-click generation of A4 print-ready court board with advocate signature block.

3. **💬 Direct WhatsApp Client Hearing Notifications**:
   - Instant WhatsApp notice generation featuring customized chamber header and contact details for **Mr. Sushil Kumar Mishra** (Senior Advocate) & **Mr. Atul Kumar Mishra** (Advocate).

4. **👤 Guest / Client Tracking Portal**:
   - Public read-only search portal allowing clients to track their next hearing date securely.

5. **☁️ Supabase Cloud Synchronization & Offline Fallback**:
   - Real-time cloud sync with fallback local storage for uninterrupted offline operation.

---

## 🚀 How to Host on GitHub Pages (Step-by-Step)

### Step 1: Initialize Git and Commit Your Files
Open PowerShell or your terminal in this project folder:
```bash
git init
git add .
git commit -m "Initial commit: Case Management System"
```

### Step 2: Push to GitHub
1. Create a new public repository on [GitHub](https://github.com/new) (e.g. `Case_Management_System`).
2. Link and push your repository:
```bash
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/Case_Management_System.git
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repository on GitHub.
2. Click **Settings** (⚙️) $\rightarrow$ **Pages** (on the left menu).
3. Under **Branch**, select `main` and folder `/ (root)`, then click **Save**.
4. In ~1 minute, your live site will be published at:
   `https://YOUR_GITHUB_USERNAME.github.io/Case_Management_System/`

---

## 🔑 Default Login Credentials
- **Username**: `admin`
- **Password**: `admin123`
- **Guest Access**: Click **"Continue as Guest"** on the login card.
