Body Tracker v4

Open via GitHub Pages or another HTTPS host for the best installed PWA behavior. Data is stored locally on the device.

Storage model:
- Primary: IndexedDB local database managed by the browser for this site/app origin.
- Fallback mirror: localStorage.
- Backup: JSON export/import. Export often while testing.

v4 changes:
- Version number appears in Settings.
- Removed the 'editable forever' text from the main date header.
- Date header opens a calendar picker.
- Calendar dots: blank = no logged activity/data, yellow = logged but below full daily target, green = full daily target met/exceeded.
- Character bars are tappable and show what activities, habits, and modifiers increase each attribute.
- Service worker cache name bumped to body-tracker-v4.


Body Tracker v4.0.0 build 2026-06-30.4
- Version displayed in header/footer and Settings.
- Calendar/date picker and attribute bar guide are included.
- Service worker is network-first and cache versioned to reduce stale installs.
