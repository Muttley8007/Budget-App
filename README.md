# Budget App

Static GitHub Pages app for planning pay cycles.

## Files
- `index.html`
- `styles.css`
- `app.js`

## Deploy on GitHub
1. Create a repo.
2. Upload these files to the repo root.
3. Enable GitHub Pages from the main branch / root.
4. Open the Pages URL.

## Notes
- Data is stored in browser localStorage.
- Use Export / Import in the app to back up and restore data.


## PWA setup
This repo is now PWA-ready.

### Files added
- `manifest.json`
- `service-worker.js`
- `icon.svg`
- `icon-192.svg`
- `icon-512.svg`

### To use on phone
1. Open the GitHub Pages site in Chrome.
2. Open the browser menu.
3. Choose **Add to Home screen** or **Install app**.

### Note
If you change files and do not see updates straight away, refresh once or clear the app/site cache because the service worker caches assets for offline use.
