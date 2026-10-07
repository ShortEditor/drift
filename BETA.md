# Drift private beta
Separate deployment from the public main site. Branch beta-social. Google sign-in, email allowlist controlled only in Firebase console, unique immutable usernames and a private songs-only inbox. No free-text chat, uploads or contacts access. All approved testers can find each other by username; this version has no friend-request or group-chat system.

Security: Firebase verified Google identities; default-deny Firestore rules; no user self-invites; own private likes; song-ID-only messages to active approved accounts. The server verifies Firebase JWT signature, issuer/audience/expiry and active invitation before serving catalog or APK APIs. No public APK asset is included in the beta build. Download currently unavailable in beta; use the main site's approved v1.7 download. No service account private key required.

Revoke: set the invite document active=false. This blocks subsequent database/server requests. Firebase authentication itself may create a user record for an uninvited login, but it grants no app/data access.

Free-only Spark Firebase and Hobby Vercel. Analytics/Gemini disabled on new Firebase project. No billing/card, SMS login, functions or paid storage.

Build: VITE_DRIFT_BETA=1 with VITE_BETA_FIREBASE_{API_KEY,AUTH_DOMAIN,PROJECT_ID,APP_ID}; npm run build:beta. Runtime DRIFT_BETA=1, BETA_FIREBASE_PROJECT_ID. Only beta deployment sets these; main remains at v1.7 download commit.

Validation: unit tests, Firebase rules emulator (revoked invites, identity/provider, email privacy, own likes/preferences, unique usernames, message sender/recipient/song fields), authenticated emulator inbox send/receive and mobile/desktop pixels. Emulator accounts are fixtures, not real testers. No invitation documents are created in production until approved identities are supplied. There is no background notification or read receipt in this beta. Current list may show a revoked tester's username, but server/rules block sending and access immediately.
