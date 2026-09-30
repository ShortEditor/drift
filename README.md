# Drift

> Current build: 1.6 / Android versionCode 7. The early design notes below describe the original prototype and are not all current. Production catalog requests now use same-origin Vercel GET relays, not direct JSONP. Jamendo indie/CC discovery, artist follows, refresh rotation, preview highlight jumps, After Dark player UI, website APK downloads, Vercel visit analytics and an anonymous Firestore request counter have since been added. Lyrics use Jamendo provider text only. If that text contains real LRC timestamps, lines can highlight during the 30-second preview; otherwise plain text is shown. Mainstream/Deezer tracks show no lyrics. No separate lyrics API is used. See ANDROID.md and ANDROID-VERIFICATION.txt for the current release, setup and test limits. Music is still capped to 30 seconds. Public/commercial music and lyric reuse rights are not cleared merely because the app is free.

A mobile-first, private music-discovery prototype built with React, Vite, TypeScript and custom CSS. Scroll through real Deezer catalog tracks and hear their 30-second previews. No Spotify, Deezer OAuth, API key, invented music API, paid service or required browsing login.

## Run locally

Use Node 22 LTS (tested on 22.23.3) and npm 10 or newer.

```sh
npm ci
cp .env.example .env.local  # optional; leave blank for device-only likes
npm run dev
```

Open the localhost URL printed by Vite. To test a phone on your LAN, open the printed Network URL. Production PWA installation/service workers need HTTPS, except on localhost. A mobile LAN HTTP page will not install as a PWA.

```sh
npm run typecheck
npm test
npm run build
npm run preview
npx playwright install chromium
npm run test:e2e
```

`build` also writes the hashed local JS/CSS filenames into the service worker. Do not omit `scripts/finalize.mjs`. The ZIP includes a compiled `dist/` as well as full source and a locked dependency tree, but no `node_modules`, credentials or music files. Open this folder in Antigravity or any IDE.

## Firebase is optional and manual

Blank Firebase env values use localStorage, visibly labeled "Saved on this device". Likes store only track ID, title, artist name and likedAt. Preferences store genre ID, mood chip and search text. Signed preview URLs, audio bytes and artwork are never persisted.

To use Firebase, create a **new project for this app**, manually, without enabling billing or Functions. Register its web app. Enable Authentication > Anonymous, create Firestore, and publish the included `firestore.rules` in the rules editor. Fill all four `VITE_FIREBASE_*` fields in `.env.local` from your new web configuration. Firebase web configuration identifies a project; rules, not hiding this client configuration, protect data. Restart Vite after changing env values. Never paste Admin SDK/service-account credentials into this app. Never reuse another app's project.

Storage: `users/{uid}/likes/{trackId}` and `users/{uid}/preferences/discovery`. Rules restrict all reads/writes to the authenticated owner, validate field names/types and reject all other paths. Failed likes roll back visibly and offer Retry. Partial/invalid Firebase configuration blocks saving rather than silently switching storage. Browsing still works if auth/storage fails.

Anonymous identities usually remain in the same browser but can be lost when browser data is cleared, on another device or if the anonymous account is deleted. There is no cross-device account recovery/login linking UI in this prototype.

### Local Firebase rule tests

No real cloud project is used. Java 11+ and Firebase CLI are required for the pinned emulator workflow tested here:

```sh
npx --yes firebase-tools@13.35.1 emulators:exec --project demo-drift --only firestore "npx vitest run --config vitest.rules.config.ts"
```

Or install Firebase CLI locally/globally and use `npm run test:rules` with a compatible version. Prefer the exact command above; newer emulator versions can require newer Java. Firestore uses port **8189** (8080 can conflict), auth 9099. For an emulated app, start both auth and firestore emulators with demo-drift, set all Firebase env fields to dummy demo-drift values and `VITE_USE_FIREBASE_EMULATORS=true`. These loopback emulator settings work on the local desktop, not automatically from a phone. Emulator tests exercise own writes, user isolation, unauthenticated denial, extra-field rejection, ID mismatch, type validation and deny-all paths.

## What is implemented

- Native vertical CSS snap feed, safe areas, accessible 44px controls, phone-width desktop layout, reduced-motion support, fallback art and a five-card render window.
- Real Deezer JSONP metadata reads with encoded queries, unique callbacks, eight-second timeout, error-envelope validation, abort/error cleanup and stale-feed generation guards.
- Genre picker from runtime `/genre` IDs; All charts uses `/chart/0/tracks`. 400ms debounced free-text artist/song search supports Unicode (including Telugu/Hindi). Mood chips are editable heuristic seeds in `src/components/Picker.tsx`, not provider mood metadata or AI recommendations.
- Shuffled/deduplicated batches, adjacent artist avoidance where possible, search index pagination, stop on absent `next`, empty/repeated pools, explicit exhausted/empty fallbacks. Next batch requested only below five unseen tracks. Preview-unavailable cards stay honest rather than silently replacing the provider.
- One shared `HTMLAudioElement`, `preload=none`, 75% visibility observation and short settle delay. The initial button calls play directly within its gesture. Fast swipes pause/reset previous tracks; pause persists across swipes. Visibility/route changes suspend listening and require deliberate resume. Ends stop; replay/next are explicit. Progress caps at 30 seconds. No crossOrigin override or audio fetching/decoding.
- Playback errors refetch `/track/{id}` once for a new signed URL, with skip/manual retry when unavailable. Autoplay rejection shows Tap to play. URLs are never reconstructed or stripped of signed parameters.
- Device-only likes or anonymous Firebase likes. Liked list resolves live metadata at concurrency two; unavailable entries remain removable. Idempotent writes and visible rollback/retry.
- Original icons, install manifest, standalone shell. Service worker only precaches own shell, hashed assets and icons; all external requests bypass it, including metadata, artwork and preview CDN. Offline shell shows "Connect to load music". No offline music.
- Adapter queue: at most two active metadata requests, at least 250ms between starts, coalesced overlapping unscoped calls, capped retries (three attempts with 500ms/1000ms backoff) for transport/rate failures, no arbitrary-host JSONP and no public CORS proxy. Queue timing is a conservative design choice, **not a verified quota**. No indefinite request loops.

## Modules

`src/api/` owns JSONP, runtime envelopes/types and the throttled Deezer adapter. `src/feed/pool.ts` owns shuffle, deduplication and exhaustion. `src/audio/controller.ts` owns the single audio element. `src/likes/` owns local/Firebase storage and rollback. `src/components/` contains picker, card and liked list. `src/App.tsx` coordinates feed lifecycle, routes and state. `public/` contains original app icons, manifest and shell-only worker. `tests/` contains unit, emulator and browser tests. `vercel.json` sets build/output and noindex headers; no remote credentials are included.

## Deezer transport and security

Browser `fetch` to Deezer frequently lacks CORS headers. This app deliberately uses public catalog JSONP, not `mode:no-cors`, browser extensions or random proxies. Only `https://api.deezer.com` is allowed, with catalog-path and parameter allowlists. No tokens are sent. A late callback's captured handler is a no-op after settlement; a response executing after its window name is deleted may produce a harmless console ReferenceError, but cannot update another request. This tradeoff avoids permanent callback globals.

JSONP grants the provider script execution in the page. A later same-origin server GET adapter is the safer production option; the `Transport` interface makes it replaceable. Vite's dev proxy is not a deployed backend. No proxy or Firebase Functions dependency is included.

If you add CSP, permit own code plus `https://api.deezer.com` in `script-src`, the actual Deezer artwork CDN in `img-src`, actual preview CDN in `media-src`, and the Firebase project endpoints in `connect-src` when configured. Example starting points are `script-src 'self' https://api.deezer.com`, `img-src 'self' https://*.dzcdn.net`, `media-src https://*.dzcdn.net`, `worker-src 'self'`, `object-src 'none'`, `base-uri 'self'`. Inline React progress styles need a style-attribute allowance or a refactor. Verify current provider hosts and Firebase config before enforcing a full policy. No CSP is blindly imposed here that could break a regional CDN.

## PWA and private hosting

No music/audio/artwork is stored in Cache Storage, IndexedDB, Firestore or downloaded. Browser-native HTTP media/image buffering can still happen; this app does not control the browser's ordinary network cache, and does not implement a remote asset cache.

For a personal Vercel deployment, create a separate project, use Vite preset, build `npm run build`, output `dist`, Node 22, no Firebase env unless you supplied your new project. Keep Vercel Deployment Protection enabled for private preview access. `robots.txt` and X-Robots-Tag disallow indexing, but **unlisted/noindex is not access control**. A publicly accessible production alias needs a separate private-use/terms decision. Do not promote as a public entertainment service. No existing projects should be overwritten; no paid upgrades are needed for this static prototype.

## Provider limits and remaining checks

Deezer API accessibility does not authorize a public entertainment service. Treat this as a private/non-commercial prototype. Previews are 30 seconds, not full songs, including for Premium users. Do not scrape, download, rehost covers, cache audio, imply a Deezer partnership, add ads or paid access. Terms acceptance and any public rollout remain manual decisions:

- https://developers.deezer.com/termsofuse
- https://developers.deezer.com/guidelines

Signed preview URLs expire. Some regions/tracks have no preview. Search mood relevance can be poor; use charts or specific artists. Current official numeric API quota was not publicly verified. There is no Spotify integration or iTunes fallback.

### Verified on September 30, 2026

- TypeScript typecheck and production build passed.
- 17 unit tests passed: JSONP success/timeout/abort/script error cleanup, error envelopes, allowlists, deduplication/exhaustion/coalescing, likes persistence/rollback, single audio/rapid transitions, user pause/suspension, autoplay rejection, expired preview refresh and 30-second stop; shell cache exclusions.
- 3 Chromium browser tests passed: 360x800 and 1440x1000 feed/likes/preferences, seven-card scroll and bounded render count, offline reload of cached shell with only local assets cached.
- Firestore emulator isolation/validation test passed with Java 11 and firebase-tools 13.35.1, covering ten allow/deny assertions.
- Actual UI pixels inspected at mobile and desktop sizes; controls and nav are unobstructed. Browser layout tests use intercepted catalog fixtures for determinism; they do not claim real audio or physical-phone validation.
- Real unauthenticated Deezer JSONP search returned a signed preview, provider link and track metadata during build verification. The Vercel deployment loaded real chart tracks in a fresh Chromium browser. A live signed preview played in headless Chromium after the listening gesture, with the progress counter advancing to 3 seconds. This verifies transport and browser playback state, not human-audible output or physical-phone audio. Physical-phone audio checks remain manual.
- Production npm dependency audit reported zero vulnerabilities at check time.

### Manual iOS/Android checklist (still required)

1. Open HTTPS on a real iPhone Safari and Android Chrome. Tap listening. Check rejection recovery, fast swipes and only one audible track.
2. Pause, swipe twice, confirm silence; explicitly resume. Switch to Liked/About or another browser tab, return and confirm no surprise playback.
3. Wait for end, confirm stop and progress at/below 30s. Replay, no loop or automatic infinite advance.
4. Try no-preview/expired/region-blocked track; confirm single refresh then skip/retry. Check API errors/offline states without retry storms.
5. Install from Safari Share > Add to Home Screen or Android's install UI; confirm safe areas/nav at browser-bar changes and landscape. Force airplane mode and verify shell message, never offline audio.
6. Configure a new Firebase project and verify physical-device likes, permission denial and rollback; confirm one user's likes cannot be read by another. Rules emulator checks do not validate live configuration.
7. Verify keyboard focus, screen-reader labels, long song names, 200% zoom, Telugu/Hindi inputs and reduced-motion behavior.

## Personal deployment

Built and deployed to https://drift-music-scroll.vercel.app/ on September 30, 2026 using a new project in the existing account. No Firebase config is set, so likes are device-only. The first Vercel deployment is automatically production. This production alias is publicly reachable with noindex/nofollow/noarchive and robots exclusion; it is unlisted, **not password protected**. Generated previews retain Vercel Authentication. Do not promote or treat noindex as privacy. No existing portfolio project, cloud Firebase project, billing or paid service was changed.

## September 30 update: artist feeds and same-origin relay

- `api/deezer.js` is the Vercel GET relay with strict path/parameter allowlists. Catalog reads use relay-first `src/api/transport.ts`; JSONP is a fallback only. Timeouts are 12s desktop, 18s mobile and 25s on slow/save-data connections. The adapter makes at most three attempts with backoff and explains relay/direct failures. Local `vite` alone does not serve serverless endpoints; use Vercel dev or production to test the relay.
- The Global tab keeps chart/search/mood discovery. Following is built from followed artists' top 50 tracks, shuffled, deduplicated and restricted to those artist IDs. It does not fall back to global charts. Empty state links to artist search. API failure shows a retry rather than silently substituting artists.
- Artist search has Telugu/Hindi starter searches and Follow/Unfollow controls. `drift-follows-v1` saves only artist IDs/names on this device, independently of optional Firebase likes. Clearing browser data removes follows. Search results can include similarly named or collaborative artists; choose the intended artist.
- Likes, previews, snap scrolling and PWA shell remain. Provider display names/links are removed from the current UI at the owner's request. This is a personal, non-commercial prototype, not a claim of copyright-free content or permission for public rollout. Provider attribution/terms must be reviewed before launch.
- 27 unit tests pass, including six relay tests and four artist tests. Live mobile validation checks 360x800 with a Vivo Android user agent. Device/network-specific availability and complete catalog coverage are not guaranteed.
- Planned Jamendo and intelligent source routing are not enabled until a real developer client ID is configured. Jamendo cards must credit the artist and Jamendo, backlink to the real track page and show the actual Creative Commons license. Never call the entire library "copyright-free". CC/reuse intent must never silently fall back to mainstream copyrighted tracks; explicit source selection should remain binding.
- Optional Jev intent classification is not configured: only a TypeSafe login is stored, no verified API key. A later classifier must use a server-only key, short timeout, normalized-query cache and rules fallback, never calls per swipe.

### Gated source router

`api/catalog.js` and `api/lib/router.js` implement the source router. Global defaults to Auto with a Mainstream override; Jamendo appears only when the server reports `JAMENDO_CLIENT_ID` configured. Artist follow/search remains mainstream-catalog-only. Rules inspect query/intent, make no LLM calls and return `{routing: {chosen, served, reason, fallback, attempts}}`. Explicit source overrides never switch silently. Reuse/CC intent never falls back to mainstream. General auto searches can try the other provider on errors or fewer than three results, preferring a larger result without combining cards. Signed audio stays in memory. Jamendo IDs use negative integers to avoid collisions in local likes/feed/audio. Its credit retains original track and license URLs.

Set `JAMENDO_CLIENT_ID` as a server-only Vercel environment variable using the owner's real registered developer app. Do not ship the documentation's testing client ID. Jamendo is not live-tested until that setup is complete. CC restrictions apply per track; no downloads/reuse promises are made by this app. The current 30-second player cap applies to both libraries. Unit tests include injected provider failures; no public failure-injection endpoint is exposed.

### Full-song platform handoff

Each song card and liked song has an expandable "Listen full on" row for Spotify, Apple Music and YouTube Music. Links open externally; this app does not stream or download their audio. Search URLs encode the song title and artist and are labeled Search, not an exact match. The keyless Odesli endpoint returned HTTP 401 `PUBLIC_API_ACCESS_DEPRECATED` during Kalaavathi verification on September 30, so exact matching is best-effort, not promised. `api/listen-links.js` accepts only positive numeric catalog track IDs, lazily calls Odesli, validates exact platform HTTPS hosts, caches matches for a day and paces instance-local calls; upstream quotas still apply across instances. No Odesli key is configured, so the relay skips matching calls until a server-only `ODESLI_API_KEY` is provided. Jamendo tracks use search handoff without claiming an exact mainstream release exists. Subscription, account, regional availability and an external platform's own terms still apply.

### Suggested preview highlight

Energy and positive-energy-change analysis suggests an energetic 12-second window **within the supplied preview**, not the hook/chorus of the full song. A 600ms settled-card delay avoids requests while fast swiping. Web Audio decodes a transient same-origin preview response; only the offset is cached in memory, not audio bytes. If analysis completes before Play, playback can begin at the suggested offset. If already playing, analysis never interrupts or seeks automatically: tap Jump to try it, or From start to hear the original preview. Decode/network failures leave normal playback unchanged. Artist/full-song/rights boundaries are unchanged.

`api/preview-audio.js` only accepts numeric track IDs, fetches current catalog metadata, validates HTTPS provider preview CDN hosts, rejects redirects, limits responses to 2MB and returns `Cache-Control: no-store`. Service worker ignores it. No persistent/offline audio or download UI exists. Analysis currently supports positive-ID mainstream previews; Jamendo falls back to regular preview playback until an equivalent licensed analysis route is verified. The heuristic is intentionally labeled Suggested highlight, not best part.

### Live Jamendo setup (September 30)

The owner's new developer account (ShortEditor, g.nagaganesh44@gmail.com) is verified. Its Drift application is marked Non-commercial and links to this deployed app. The real client ID is saved separately in the vault and Production Vercel secrets, never in this archive/browser code. The default developer application plan is labeled Read & write, but this code uses only public GET/read endpoints with no user OAuth or write calls. Real catalog responses include licenses such as BY-NC-SA and BY-NC-ND: these are not unrestricted/copyright-free songs. Check each license before any reuse, commercial work or edits. Jamendo's card credit and real track/license links are required and stay visible.
