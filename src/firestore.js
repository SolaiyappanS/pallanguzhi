import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  runTransaction,
  serverTimestamp
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { applyAction, initialState, publicState } from "../server/game.js";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA9wnNqhECGRFg_OefPMC_RCmKWtmKSoXs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pallanguzhi-4871c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pallanguzhi-4871c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pallanguzhi-4871c.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "706492757994",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:706492757994:web:fa69ac76b0525962342493"
};

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);
const games = collection(db, "games");

async function currentUser() {
  if (auth.currentUser) return auth.currentUser;
  return (await signInAnonymously(auth)).user;
}

function cleanCode(value) {
  return String(value || "").trim().toUpperCase();
}

function gameResponse(snapshot, uid) {
  if (!snapshot.exists()) throw new Error("Game not found.");
  const game = snapshot.data();
  const player = game.player1Id === uid ? 1 : game.player2Id === uid ? 2 : 0;
  if (!player) throw new Error("You are not a player in this game.");
  return { code: game.code, player, state: publicState(game.state) };
}

export async function createGame() {
  const user = await currentUser();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
    const ref = doc(games, code);
    try {
      const result = await runTransaction(db, async (transaction) => {
        const state = initialState();
        transaction.create(ref, { code, state, player1Id: user.uid, player2Id: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        return { code, player: 1, state: publicState(state) };
      });
      return result;
    } catch (error) {
      if (error.code !== "already-exists" || attempt === 4) throw error;
    }
  }
  throw new Error("Could not create a game. Try again.");
}

export async function joinGame(value) {
  const user = await currentUser();
  const code = cleanCode(value);
  if (!/^[A-Z0-9]{6}$/.test(code)) throw new Error("Game codes contain six letters or numbers.");
  return runTransaction(db, async (transaction) => {
    const ref = doc(games, code);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error("Game not found.");
    const game = snapshot.data();
    if (game.player1Id !== user.uid && game.player2Id && game.player2Id !== user.uid) throw new Error("This game already has two players.");
    const player = game.player1Id === user.uid ? 1 : 2;
    if (player === 2 && !game.player2Id) transaction.update(ref, { player2Id: user.uid, updatedAt: serverTimestamp() });
    return { code, player, state: publicState(game.state) };
  });
}

export async function subscribeGame(code, callback, onError) {
  const user = await currentUser();
  return onSnapshot(doc(games, cleanCode(code)), (snapshot) => {
    try { callback(gameResponse(snapshot, user.uid)); } catch (error) { onError(error); }
  }, onError);
}

export async function performAction(code, action) {
  const user = await currentUser();
  return runTransaction(db, async (transaction) => {
    const ref = doc(games, cleanCode(code));
    const snapshot = await transaction.get(ref);
    const result = gameResponse(snapshot, user.uid);
    const nextState = applyAction(snapshot.data().state, action, result.player);
    transaction.update(ref, { state: nextState, updatedAt: serverTimestamp() });
    return { ...result, state: publicState(nextState) };
  });
}

export async function resetGame(code) {
  const user = await currentUser();
  return runTransaction(db, async (transaction) => {
    const ref = doc(games, cleanCode(code));
    const snapshot = await transaction.get(ref);
    const result = gameResponse(snapshot, user.uid);
    const state = initialState();
    transaction.update(ref, { state, updatedAt: serverTimestamp() });
    return { ...result, state: publicState(state) };
  });
}
