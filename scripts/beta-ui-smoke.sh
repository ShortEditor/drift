#!/bin/sh
VITE_DRIFT_BETA=1 VITE_BETA_FIREBASE_API_KEY=demo-key VITE_BETA_FIREBASE_PROJECT_ID=demo-drift-beta VITE_BETA_FIREBASE_AUTH_DOMAIN=demo-drift-beta.firebaseapp.com VITE_BETA_FIREBASE_APP_ID=demo-app VITE_BETA_EMULATORS=1 node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174 --strictPort >/tmp/beta-dev.log 2>&1 &
PID=$!
trap 'kill "$PID"' EXIT
node scripts/beta-ui-smoke.mjs
