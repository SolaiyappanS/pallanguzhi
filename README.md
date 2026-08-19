# Pallanguzhi

React + Express migration of the original Pallanguzhi board game.

## Local setup

1. Copy `.env.example` to `.env`.
2. In Firebase Console, enable Anonymous sign-in and create/confirm the Firestore database.
3. For the API, provide a Firebase Admin credential through `GOOGLE_APPLICATION_CREDENTIALS` or a deployed service identity. Never commit that JSON file.
4. Run `npm install` and then `npm run dev`.

The Vite client runs at `http://localhost:5173`; the Express API runs at `http://localhost:3001`.

## Deployment

GitHub Pages can serve the React client, but it cannot run Express or protect Firestore credentials. Deploy the API to Cloud Run, Render, Railway, or another server host, then set `VITE_API_URL` to its HTTPS URL and build with `VITE_BASE_PATH=/pallanguzhi/` for `https://solaiyappans.github.io/pallanguzhi/`.

Alternatively, deploy `dist` with Firebase Hosting using `firebase deploy --only hosting,firestore`. The Express API still needs a server runtime; Firebase App Hosting or Cloud Run are suitable choices.

## Security changes

- The browser no longer writes game state directly.
- Firebase Auth issues an ID token and the API verifies it on every request.
- Game actions are validated against the authenticated player and committed in Firestore transactions.
- Firestore client rules deny direct reads and writes; the Admin SDK is used only by the API.
- Secrets and service-account files are excluded from Git.
