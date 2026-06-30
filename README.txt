Body Tracker

Open index.html in a modern browser. Data is stored locally on the device.

Storage model:
- Primary save layer: IndexedDB, the browser's lightweight local database.
- Fallback mirror: localStorage, only so the app can recover if IndexedDB is unavailable.
- Manual backups: Settings > Export JSON. Use this for long-term backups or moving data between devices.

Important: IndexedDB is not the browser cache, but it is still controlled by the browser/app. Data can be removed if you clear site data, uninstall the PWA/browser, or the browser/app purges storage. Use Export JSON periodically if you care about long-term history.

This v1 is local-first and has no cloud sync or direct AI integration. The ChatGPT assist buttons copy prompts you can paste manually when creating new activities or habits.
