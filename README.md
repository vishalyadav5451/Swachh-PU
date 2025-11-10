# 🧹 Swachh PU – University Complaint Management System

Swachh PU is a **smart complaint management system** built for **Pondicherry University** students and staff.  
It allows users to easily report campus cleanliness and infrastructure-related issues, upload photos, track complaint status, and get notified by email when their issues are resolved.

---

## 🚀 Features

✅ **Online Complaint Submission** – Students can submit complaints with description, location, and photo evidence.  
✅ **Photo Upload to Google Drive** – Images are uploaded automatically to a secure Drive folder.  
✅ **Google Sheets Integration** – Complaints are stored and managed in Google Sheets via Google Apps Script.  
✅ **Email Notification System** – Users receive a confirmation email with their unique complaint tracking ID.  
✅ **Admin Dashboard** – Admins can view, update, and resolve complaints directly from the panel.  
✅ **Complaint Tracking** – Users can check the live status of their complaint using their tracking ID.  
✅ **Responsive UI** – Clean, mobile-friendly interface designed for accessibility and ease of use.

---

## 🏗️ Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (Vanilla JS)
- EmailJS for sending email notifications

**Backend:**
- Google Apps Script (Node-like environment)
- Google Sheets (database)
- Google Drive API (photo uploads)

**Hosting:**
- GitHub Pages (Frontend)
- Google Apps Script Web App (Backend)

---

## ⚙️ System Architecture

User → [HTML Form + JS]
→ Google Apps Script Web App (POST)
→ Stores data in Google Sheet
→ Uploads photo to Google Drive
→ Sends confirmation email via EmailJS
Admin Panel → Fetches data (GET) → Update/Notify user


Swachh-PU/
│
├── index.html # Homepage with project overview
├── complain.html # Complaint submission page
├── admin.html # Admin panel for viewing complaints
├── track.html # Track complaint status page
│
├── script.js # Shared or utility scripts
├── complain.js # Handles complaint form logic (frontend)
├── admin.js # Handles admin dashboard logic
├── Code.gs # Google Apps Script backend (API + Drive + Sheet)
│
├── styles/ # CSS files
└── README.md # Project documentation



---

## 🧠 How It Works

1. User fills out the complaint form and uploads an image.
2. The data and image are sent to the backend (`Code.gs`).
3. Google Apps Script:
   - Uploads the photo to Drive.
   - Stores complaint details in Google Sheets.
   - Generates a unique complaint ID (e.g., `PU0023`).
4. The user receives a confirmation email with tracking info.
5. Admin can update status or resolve the issue; user gets a notification.

---

## 🔐 Admin Panel Access

The admin panel requires a login (set in `admin.js`).  
Admins can:
- View all complaints
- Update status (Pending → In Progress → Resolved)
- Send notification emails to users

---

## 🧰 Setup & Deployment

### 1. Deploy Google Apps Script
- Copy `Code.gs` into your Google Apps Script editor.
- Connect it to a Google Sheet.
- Deploy as **Web App**:
  - Execute as: **Me (the developer)**
  - Who has access: **Anyone**
- Copy the **Web App URL** and update it in:
  ```js
  const GOOGLE_SCRIPT_URL = 'YOUR_SCRIPT_URL';
