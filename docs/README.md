# YouTube Free — web

Standalone GPL-3.0-or-later web client in `docs/`, maintained on branch `web`.
The Android application on `dev` and its APK workflow are unchanged.

## Publishing

GitHub Settings → Pages → Deploy from a branch → `web` → `/docs`.
Each push to that branch automatically updates GitHub Pages.
Expected project URL: https://bsanj46-code.github.io/YouTube-Free/
Use relative asset URLs so the PWA works below this repository subpath.

## Viewing and search

- Standard YouTube IFrame API, privacy-enhanced embed host; controls and ads are not hidden or blocked.
- Watch/share/Shorts/live links and video IDs open in the player.
- Name search opens official YouTube search until a developer-owned YouTube Data API v3 key is supplied.
- Optional integrated video search is implemented through the official Data API. Set `youtubeApiKey` in `docs/config.js` only after restricting a **public browser key** to `https://bsanj46-code.github.io/*` and to YouTube Data API v3. Never add unrestricted keys or server credentials. API quota exhaustion is handled without scraping or unofficial proxies.
- No login, scraping, stream extraction, ad bypass, analytics or server-side user storage.
- Favorites are local browser data, not YouTube account favorites. Not synchronized across devices.
- YouTube oEmbed provides optional video titles. Failure does not block playback.
- Some videos forbid embedding, require login, or are restricted by country/age; users can open YouTube.
- Background playback is not provided in this web version.

## Fullscreen

A tap on ⛶ requests the browser Fullscreen API. While playing on a touch device,
portrait-to-landscape rotation expands the player. A rejected browser fullscreen
request falls back to a viewport-sized player; browser chrome may remain.
Returning to portrait restores the page. Orientation is never locked globally.
No controls, branding or ads inside the YouTube iframe are covered or altered.

## PWA and privacy

The service worker caches only this app's same-origin shell. It does **not**
cache videos, iframe content, thumbnails or YouTube API responses. Watching and
search require the internet. Install via the browser prompt/menu. The install
button explains manual installation when automatic installation isn't supported.
Fonts are requested from Google Fonts, with a system-font fallback.
YouTube/Google process playback requests under their own policies; links and
an explanation are available inside the app.

## Validation

Run `node --test tests/*.test.mjs` and `node --check docs/app.mjs` from repository root.
UI checks cover loading by URL, favorites persistence, empty state, dialogs,
phone/tablet layout and PWA assets. Actual installation and device rotation
must also be checked on a physical Android device; browser support varies.
