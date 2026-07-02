Body Tracker v6.0.0

Local-first RPG-style fitness tracker.

Install/update on GitHub Pages:
1. Export a JSON backup from Settings before replacing files.
2. Replace the repository files with this folder's contents.
3. Commit changes and wait for GitHub Pages to redeploy.
4. In the installed phone app, use Settings -> Reload latest app version if the old build is cached.

v6 changes:
- Day tab renamed from Today to Day.
- More compact top bar and nutrition/habit layout.
- Version number only appears in Settings.
- Date navigation restored with previous/next date buttons around the selected date.
- Calendar dates with measurements are subtly shaded.
- Nutrition/habit scoring includes 200%+.
- Full Day log restored at the bottom with delete controls for activities, habits, exceptions, and measurements.
- Profile XP bar moved above the rank bar so it does not interfere with benchmark text.
- Level system changed to earned progression: starts low and is capped until enough logged days and/or benchmark measurements exist.

Storage:
- IndexedDB-first local storage.
- localStorage fallback mirror.
- JSON and CSV export.
