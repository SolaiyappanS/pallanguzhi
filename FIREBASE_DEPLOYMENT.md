# Firebase and deployment notes

## Local application

1. Copy `.env.example` to `.env.local` and supply the Firebase web app settings when needed. The existing Pallanguzhi web configuration is kept as a fallback for the current project; web API keys are identifiers, not privileged secrets.
2. Enable **Anonymous** as a Firebase Authentication sign-in provider. The browser persists the anonymous Firebase UID locally, so a refresh/reconnect keeps the same player assignment in that browser profile.
3. For isolated local multiplayer testing, install Java 21+ and run `firebase emulators:start --project pallanguzhi-4871c --only auth,database,functions`; set `VITE_USE_FIREBASE_EMULATORS=true` in `.env.local` and run `npm run dev`. This directs Auth, RTDB, and callable Functions to localhost, not production. Disable the flag to use the configured Firebase project.
4. Install root dependencies and run `npm run dev`. `npm test`, `npm run typecheck`, and `npm run build` cover the shared rules engine and frontend.

## Trusted multiplayer backend and security

Seat assignment and every game mutation are handled by callable Cloud Functions. The join function reserves an open seat inside an RTDB transaction; concurrent transactions retry against the winning record. Rejoining with the same Firebase UID returns its existing seat. Viewers are not written as players, and the move function only accepts UIDs stored in `players.player1Uid` or `players.player2Uid` and checks turn ownership on the authoritative state. Browser controls are not the security boundary.

`database.rules.json` is a proposed restrictive baseline: authenticated clients may read lobby/game records, but direct client writes are denied. Admin SDK Functions bypass these client rules. The deployed rules and Authentication providers were not accessible from this repository, so inspect the Firebase console and test these rules against the existing project before deploying them. Do not deploy these rules or functions until approved. Legacy clients that write directly to `/{CODE}` must be upgraded before direct writes are disabled.

Do not put service-account credentials in this application. Cloud Functions use the platform Admin SDK identity. Anonymous identities are not durable across cleared browser data/devices; a user who loses their UID cannot reclaim a seat automatically. Stronger account recovery requires a durable sign-in provider or an explicit trusted identity-recovery process.

## Existing data and lobby index

The existing game state fields (`kuli`, `classes`, shell totals, turn/round flags, highlights, and messages) remain under `/{CODE}`. New records add `players`, `ownerUid`, `createdAt`, `updatedAt`, and a monotonic `revision`. Existing alphanumeric six-character codes remain joinable; newly created codes are six digits. Joining a legacy game atomically adds its player seats without reshaping its board. The `lobby/{CODE}` node is a compact index and does not include board data. Its trigger updates a revision-guarded projection when game records change. There is no one-time backfill of legacy games; old games become indexed when changed/joined, and remain accessible by shared link/code beforehand.

## Hosting and SPA routes

`firebase.json` configures Firebase Hosting to rewrite application paths (including `/game/123456`) to `/index.html`, so React Router works on direct navigation and refresh. Static hosts need the equivalent fallback/rewrite to `index.html` for all non-asset routes. Deploy Hosting only after the SPA build is ready. Functions and database rules are separate production changes and are not deployed by this repository workflow.

## Verification limits

Pure game-rule tests run locally without Firebase. Real-time lobby delivery, Auth-provider setup, transaction contention, callable authorization, and Hosting rewrites require the Firebase Emulator Suite or an approved staging project. Do not test game creation against the production database as part of a local build check.
