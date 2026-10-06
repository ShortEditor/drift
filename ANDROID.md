# Drift for Android

This is a Capacitor Android app with the same React UI bundled locally, not a Kotlin/Java UI rewrite. It uses the existing HTTPS backend and needs internet for catalog/audio. Device-local follows/likes are stored in the app's WebView and are separate from browser saves. Android 6.0+ is the build minimum; use a current Android System WebView/Chrome. Actual runtime testing limits are in the delivered verification report.

- App ID: `app.drift.music`, app name `drift`, version 1.7 / versionCode 8.
- Target/compile SDK 35, Capacitor 7, Java 21, Gradle wrapper included.
- Release signing: RSA 3072, alias `drift-release`, passwords saved in the owner's vault. Keep the same key for updates. The encrypted PKCS12 key backup is saved separately in the vault; no private signing key/password is in source.
- HTTPS only, Android cleartext disabled, mixed content disabled, release WebView debugging disabled, backup disabled, only INTERNET plus an app-private AndroidX receiver permission. No camera/location/microphone/storage/contacts permissions.
- API calls from `https://localhost` use `https://drift-music-scroll.vercel.app` and restricted CORS. The package does not load remote code with native bridge access. Preview decode/audio remains online; no offline music or download feature.
- External platform handoff opens Spotify/Apple Music/YouTube Music search, not guaranteed exact track matches.

## Build

```sh
npm ci
npm run build
rm -rf dist/releases # Keep the public APK out of bundled Android assets
npx cap sync android
# Set ANDROID_HOME and JAVA_HOME. Make android/local.properties for your SDK path.
# Supply DRIFT_KEYSTORE, DRIFT_STORE_PASS and DRIFT_KEY_PASS securely from your vault.
cd android
./gradlew assembleRelease bundleRelease --no-daemon
```

Never use a new signing key for an update to the same installed app. Increment versionCode for future releases. APK installs directly; AAB is for later Play Console upload, not directly installable. Play Store submission requires a developer account, policy compliance and current target-API requirements; this build is not a store approval.

## Install

Download the APK, open it on Android and allow installation from that specific browser/Drive/file manager if Android asks. Turn that permission off afterwards. Do not disable Play Protect. If Play Protect blocks installation, stop and review the warning rather than bypassing it. The APK signature verifies publisher identity/integrity, not a security audit or a promise that Android will show no warning.

## Website download and counts

The website offers /download and the signed v1.6 APK at /releases/drift-1.6.apk. The download button is hidden in native Capacitor. GET /api/download attempts an anonymous Firestore count increment and then redirects to the APK, even if the counter is unavailable. It counts requests, not installs or completed downloads. Repeat requests and bots can inflate it; direct APK requests bypass it.

Vercel Hobby Web Analytics measures website visits only; native builds skip it. Its free allowance is 50,000 events/month with 30-day history. Firestore uses the separate drift-download-counters Spark project without billing; the counter contains only one integer. Rules allow public get and exact +1 updates only, with no create/delete/list or other document access. Public increments can consume the free quota. No personal data is sent to this counter; hosting and Web Analytics have their own metadata handling.

## Lyrics

Only Jamendo native lyrics are used, through the catalog include=licenses+lyrics request. Lyrics open without another network request. Provider text is shown as plain text unless it contains LRC timestamps, when the parser highlights the active line. No timing availability is promised. Mainstream/Deezer tracks show no lyrics. Lyrics remain their owners' work; API access is not blanket public/commercial reuse permission.

## After Dark layout and optional synced lyrics

The player uses the actual Stitch concept HTML geometry, SVG paths and bundled fonts, adapted to React. Art covers the screen; top bar and dock float over it. Tune holds search/genre/source controls, Profile holds About and artist management. Placeholder social numbers and verified badges are removed. Real catalog artwork is not the generated singer photograph.

Artist credit, Jamendo credit, the provider-returned direct track-page backlink and individual CC license are shown per Jamendo track, including the lyrics sheet. This implements Jamendo API terms clause 4.1, not clearance for all downstream uses: https://devportal.jamendo.com/api_terms_of_use . Audio remains capped to 30 seconds. Instrumental intros can contain no active lyric line within that cap.

Native status-bar overlay uses Android window insets with WebView safe-padding CSS. This native-specific behavior still needs phone verification.

## Android 1.5 spacing fix

Owner Vivo screenshot showed top controls too low. Native inset is now converted from physical px to density-adjusted CSS px, and native top spacing is 8px beneath that inset instead of 48px. Native desktop harness places controls at y=32 for a 24px status bar. Actual phone retest is still needed.

## Android 1.7 (October 6, 2026)

This release uses a NEW signing key, explicitly chosen by the owner. It cannot update the previous installed app. Uninstall the old app before installing; device-local saved songs and follows are lost. The previous key entries remain untouched. New signing credentials and encrypted key backup are separate entries labelled 2026-10 New Key. Keep an independent encrypted keystore-file backup as well.

Includes four-tab Artists dock fix, three Drift original share templates, song/title and artist search hidden behind a search icon. Native share sends a PNG with temporary URI access; native Download card opens Android's Create Document picker. No broad storage permission, album-art export or audio export.

Release compiled on Java21/SDK35. APK signature and package verified. Web unit/browser tests and simulated native bridge test pass. No real phone or emulator runtime test was available, so installation, preview playback, Android chooser/save picker, Instagram availability and status/keyboard insets still need phone verification. Android unit-test task completes with NO-SOURCE; it is not native test coverage.
