TASK MANAGER V4.1

V4.1 is based on V4 and keeps the existing localStorage data format.

Fixes:
- Added Safari-safe task ID generation with a fallback when crypto.randomUUID() is unavailable.
- Added cache-busting for app.js and style.css.
- Existing V2/V2.1/V3/V4 localStorage task data remains compatible.
- Existing tasks are preserved on the device.

IMPORTANT:
Task data remains local to the browser/device. Updating GitHub Pages does not delete existing local data.
