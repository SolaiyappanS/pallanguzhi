import cors from "cors";
import express from "express";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { applyAction, initialState, publicState } from "./game.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const firebaseApp = getApps().length ? getApps()[0] : initializeApp();
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(",") || true }));
app.use(express.json({ limit: "16kb" }));

async function requireUser(request, response, next) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return response.status(401).json({ error: "Sign-in required." });
  try {
    request.user = await auth.verifyIdToken(token);
    await db.collection("users").doc(request.user.uid).set({
      uid: request.user.uid,
      lastSeenAt: FieldValue.serverTimestamp()
    }, { merge: true });
    next();
  } catch {
    response.status(401).json({ error: "Invalid sign-in token." });
  }
}

function cleanCode(value) {
  return String(value || "").trim().toUpperCase();
}
function gameRef(code) { return db.collection("games").doc(code); }

app.get("/api/health", (_request, response) => response.json({ ok: true }));

app.post("/api/games", requireUser, async (request, response) => {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const ref = gameRef(code);
  await ref.create({ code, state: initialState(), player1Id: request.user.uid, player2Id: null, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  response.status(201).json({ code, player: 1, state: publicState(initialState()) });
});

app.post("/api/games/:code/join", requireUser, async (request, response) => {
  const code = cleanCode(request.params.code);
  if (!/^[A-Z0-9]{6}$/.test(code)) return response.status(400).json({ error: "Game codes contain six letters or numbers." });
  try {
    const result = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(gameRef(code));
      if (!snapshot.exists) throw new Error("Game not found.");
      const game = snapshot.data();
      const player = game.player1Id === request.user.uid ? 1 : game.player2Id === request.user.uid ? 2 : game.player2Id ? 0 : 2;
      if (player === 0) throw new Error("This game already has two players.");
      if (player === 2 && !game.player2Id) transaction.update(gameRef(code), { player2Id: request.user.uid, updatedAt: FieldValue.serverTimestamp() });
      return { player, state: publicState(game.state) };
    });
    if (!result.player) return response.status(409).json({ error: "This game already has two players." });
    response.json({ code, ...result });
  } catch (error) {
    response.status(error.message === "Game not found." ? 404 : 409).json({ error: error.message });
  }
});

app.get("/api/games/:code", requireUser, async (request, response) => {
  const snapshot = await gameRef(cleanCode(request.params.code)).get();
  if (!snapshot.exists) return response.status(404).json({ error: "Game not found." });
  const game = snapshot.data();
  const player = game.player1Id === request.user.uid ? 1 : game.player2Id === request.user.uid ? 2 : 0;
  if (!player) return response.status(403).json({ error: "You are not a player in this game." });
  response.json({ code: game.code, player, state: publicState(game.state) });
});

app.post("/api/games/:code/actions", requireUser, async (request, response) => {
  const code = cleanCode(request.params.code);
  try {
    const result = await db.runTransaction(async (transaction) => {
      const ref = gameRef(code);
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new Error("Game not found.");
      const game = snapshot.data();
      const player = game.player1Id === request.user.uid ? 1 : game.player2Id === request.user.uid ? 2 : 0;
      if (!player) throw new Error("You are not a player in this game.");
      const nextState = applyAction(game.state, request.body, player);
      transaction.update(ref, { state: nextState, updatedAt: FieldValue.serverTimestamp() });
      return { player, state: publicState(nextState) };
    });
    response.json({ code, ...result });
  } catch (error) {
    response.status(error.message === "Game not found." ? 404 : 400).json({ error: error.message });
  }
});

app.post("/api/games/:code/reset", requireUser, async (request, response) => {
  const code = cleanCode(request.params.code);
  const ref = gameRef(code);
  const snapshot = await ref.get();
  if (!snapshot.exists) return response.status(404).json({ error: "Game not found." });
  const game = snapshot.data();
  if (![game.player1Id, game.player2Id].includes(request.user.uid)) return response.status(403).json({ error: "You are not a player in this game." });
  const state = initialState();
  await ref.update({ state, updatedAt: FieldValue.serverTimestamp() });
  response.json({ code, player: game.player1Id === request.user.uid ? 1 : 2, state: publicState(state) });
});

app.listen(port, () => console.log(`Pallanguzhi API listening on ${port}`));
