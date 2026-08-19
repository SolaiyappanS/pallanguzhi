# Pallanguzhi

React + Firebase migration of the original Pallanguzhi board game.

## Local setup

1. Copy `.env.example` to `.env`.
2. In Firebase Console, enable Anonymous sign-in and create/confirm the Firestore database.
3. Run `npm install` and then `npm run dev`.

The Vite client runs at `http://localhost:5173` and talks directly to Firestore.

## Deployment

GitHub Pages serves the React client directly; no Express, Cloud Run, or billing account is required. Build with `VITE_BASE_PATH=/pallanguzhi/` for `https://solaiyappans.github.io/pallanguzhi/`.

Alternatively, deploy `dist` with Firebase Hosting using `firebase deploy --only hosting,firestore`.

## Security changes

- Firebase Auth issues an anonymous identity for each player.
- Game actions run in Firestore transactions and are restricted to authenticated game participants.
- Firestore rules validate ownership and the game-state shape.
- No service-account credentials are shipped to the browser.
- Secrets and service-account files are excluded from Git.

This billing-free option cannot make game rules fully server-authoritative: a malicious authenticated client could still submit a valid-shaped but dishonest state. For casual play, the transaction and ownership controls are appropriate; strict anti-cheat enforcement requires a trusted backend such as Cloud Run.
