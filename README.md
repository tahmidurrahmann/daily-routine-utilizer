# Daily Routine Checklist

A mobile-first, offline-capable daily routine and habit checklist web app built specifically for personal use with the **Asia/Dhaka** timezone. It features zero build steps, vanilla JavaScript, `localStorage` persistence, customizable day schedules with inheritance, prayer tracking, streak analytics, and PWA "Add to Home Screen" support.

---

## Features

- **Asia/Dhaka Timezone**: All date, streak, and routine logic adheres strictly to Dhaka time (UTC+6).
- **Auto-Detected Day Types**:
  - Sunday, Wednesday: *Early class day*
  - Monday: *Monday (late class)*
  - Thursday: *Thursday (late class, long)*
  - Tuesday, Saturday: *Free day*
  - Friday: *Friday* (Jumu'ah prayer & light work)
  - Manual override dropdown for holidays or cancelled classes.
- **Independent Daily Prayers**: 5 prayer tracking buttons (Fajr, Dhuhr, Asr, Maghrib, Isha) at the top of the routine.
- **Smart Task States**:
  - Highlights current task by time of day and auto-scrolls on load.
  - Gently mutes uncompleted past tasks without shame.
  - Large thumb-friendly tap targets with strike-through and checkmark animations.
- **Streak Tracking**: Requires all 5 prayers AND at least 80% of daily routine tasks completed. Tracks current and best streak across missed days.
- **Week Overview**: 7-column bar chart fitting 360px mobile screens without horizontal scrolling.
- **Schedule Editor**:
  - Add, edit, delete, and reorder tasks (with ▲/▼ buttons).
  - Snapshot protection: past days preserve their historical task counts even if tasks are deleted today.
  - "Edited today" badge appears when today's task list differs from the default config.
  - Reset to default per day type or for all days.
- **Data Portability**: Full JSON export and validated import for backup and device transfer.
- **PWA & Offline Ready**: Service worker caching and web manifest for full standalone installation.

---

## 1. Run Locally

No build step or dependencies required. You can serve the folder with any static file server:

### Option A: Python
```bash
# Python 3
python -m http.server 8080
```
Open `http://localhost:8080` in your browser.

### Option B: Node.js (npx)
```bash
npx serve .
```

### Option C: VS Code Live Server
Right-click `index.html` and select **"Open with Live Server"**.

---

## 2. Deploy to Vercel

The app is completely static and ready for zero-config Vercel deployment:

### Via Vercel CLI
```bash
npm i -g vercel
vercel
```
Follow the prompts (accept default settings for static HTML).

### Via GitHub / Vercel Dashboard
1. Push this directory to a GitHub repository.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New > Project**.
3. Import your repository and click **Deploy**.

---

## 3. Install on Phone ("Add to Home Screen")

### On Android (Chrome / Brave / Edge)
1. Navigate to your deployed URL in Chrome.
2. Tap the three-dot menu (**⋮**) in the top-right corner.
3. Select **"Add to Home screen"** or **"Install app"**.
4. The app icon will appear on your home screen and run full-screen as a standalone PWA offline.

### On iOS (Safari)
1. Open the deployed URL in Safari.
2. Tap the **Share** button (box with an upward arrow) at the bottom.
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **"Add"** in the top-right corner.

---

## Testing & Verification Suite

All core capabilities (Dhaka date rollover, day type switching, undo, streak across missed days, schedule editor add/edit/delete/reorder, snapshots, and export/import round-trip) are thoroughly validated via automated unit tests in `test-app.js`.
