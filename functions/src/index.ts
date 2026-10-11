import { randomInt } from 'node:crypto';
import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { onValueWritten } from 'firebase-functions/v2/database';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { applyGameAction as runGameAction, createInitialGame, lobbyStatus, normalizeGame, type GameAction } from '../../shared/gameEngine.js';

initializeApp();
const database = getDatabase();
const GAME_CODE_PATTERN = /^[A-Z0-9]{6}$/;
const MAX_CODE_ATTEMPTS = 30;

type Role = 'player1' | 'player2' | 'viewer';
interface Players { player1Uid: string | null; player2Uid: string | null }
interface GameRecord {
  players?: Players;
  createdAt?: number;
  revision?: number;
  ownerUid?: string;
  [key: string]: unknown;
}

function requireUid(request: { auth?: { uid: string } | null }): string {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in before joining a game.');
  return uid;
}

function validateCode(value: unknown): string {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (!GAME_CODE_PATTERN.test(code)) {
    throw new HttpsError('invalid-argument', 'Enter a valid six-character game code.');
  }
  return code;
}

function toLobbyRecord(code: string, game: GameRecord) {
  const state = normalizeGame(game);
  const players = game.players;
  return {
    code,
    status: lobbyStatus(state),
    occupiedSeats: Number(Boolean(players?.player1Uid)) + Number(Boolean(players?.player2Uid)),
    createdAt: game.createdAt ?? Date.now(),
    updatedAt: Date.now(),
    roundCount: state.roundCount,
    revision: game.revision ?? 0,
  };
}

async function updateLobby(code: string, game: GameRecord | null): Promise<void> {
  const lobbyRef = database.ref(`lobby/${code}`);
  if (!game || (!game.createdAt && !game.players)) {
    await lobbyRef.remove();
    return;
  }
  const next = toLobbyRecord(code, game);
  await lobbyRef.transaction((current: ReturnType<typeof toLobbyRecord> | null) => {
    if (current && current.revision > next.revision) return;
    return next;
  });
}

export const createGame = onCall({ cors: true }, async (request) => {
  const uid = requireUid(request);
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const code = String(randomInt(100000, 1000000));
    const gameRef = database.ref(code);
    const createdAt = Date.now();
    const initial = {
      ...createInitialGame(),
      players: { player1Uid: uid, player2Uid: null },
      ownerUid: uid,
      createdAt,
      revision: 1,
    };
    const result = await gameRef.transaction((current: GameRecord | null) =>
      current === null ? initial : undefined,
    );
    if (!result.committed) continue;
    await updateLobby(code, result.snapshot.val() as GameRecord);
    return { code, role: 'player1' as const };
  }
  throw new HttpsError('resource-exhausted', 'Could not reserve a game code. Please try again.');
});

export const joinGame = onCall({ cors: true }, async (request) => {
  const uid = requireUid(request);
  const code = validateCode(request.data?.code);
  const allowViewer = request.data?.allowViewer === true;
  const gameRef = database.ref(code);
  let role: Role | null = null;

  const result = await gameRef.transaction((current: GameRecord | null) => {
    if (current === null) return;
    const players = current.players ?? { player1Uid: null, player2Uid: null };
    if (players.player1Uid === uid) {
      role = 'player1';
      return current;
    }
    if (players.player2Uid === uid) {
      role = 'player2';
      return current;
    }
    if (!players.player1Uid) {
      role = 'player1';
      return { ...current, players: { ...players, player1Uid: uid }, createdAt: current.createdAt ?? Date.now(), revision: (current.revision ?? 0) + 1 };
    }
    if (!players.player2Uid) {
      role = 'player2';
      return { ...current, players: { ...players, player2Uid: uid }, createdAt: current.createdAt ?? Date.now(), revision: (current.revision ?? 0) + 1 };
    }
    if (allowViewer) {
      role = 'viewer';
      return current;
    }
    role = null;
    return;
  });

  if (!result.snapshot.exists()) {
    throw new HttpsError('not-found', 'That game could not be found. Check the code and try again.');
  }
  if (role === null) {
    throw new HttpsError('failed-precondition', 'This game already has 2 players.', { reason: 'GAME_FULL' });
  }
  if (result.committed) await updateLobby(code, result.snapshot.val() as GameRecord);
  return { code, role };
});

export const applyGameAction = onCall({ cors: true }, async (request) => {
  const uid = requireUid(request);
  const code = validateCode(request.data?.code);
  const action = request.data?.action as GameAction | undefined;
  if (!action || !['start', 'advance', 'select', 'reset'].includes(action.type)) {
    throw new HttpsError('invalid-argument', 'That game action is not supported.');
  }
  if (action.type === 'select' && (!Number.isInteger(action.pit) || action.pit < 0 || action.pit > 13)) {
    throw new HttpsError('invalid-argument', 'Choose a valid kuzhi.');
  }

  const gameRef = database.ref(code);
  let authorized = false;
  let changed = false;
  const result = await gameRef.transaction((current: GameRecord | null) => {
    if (current === null) return;
    const players = current.players;
    const seat: 'player1' | 'player2' | null =
      players?.player1Uid === uid ? 'player1' : players?.player2Uid === uid ? 'player2' : null;
    if (!seat) return;

    const state = normalizeGame(current);
    if (action.type !== 'reset' && state.isNewRound && (seat === 'player1') !== state.isP1Turn) return;
    authorized = true;
    const next: GameRecord = {
      ...(action.type === 'reset' ? createInitialGame() : runGameAction(state, action)),
      players,
      ownerUid: current.ownerUid,
      createdAt: current.createdAt,
      updatedAt: Date.now(),
      revision: (current.revision ?? 0) + 1,
    };
    changed = JSON.stringify(next) !== JSON.stringify(current);
    return changed ? next : current;
  });

  if (!result.snapshot.exists()) {
    throw new HttpsError('not-found', 'That game could not be found.');
  }
  if (!authorized) {
    throw new HttpsError('permission-denied', 'Only an assigned player can change this game, and only the player whose turn it is may move.');
  }
  if (!result.committed || !changed) {
    throw new HttpsError('failed-precondition', 'That action is not available in the current game state.');
  }
  await updateLobby(code, result.snapshot.val() as GameRecord);
  return { ok: true };
});

export const syncLobbyEntry = onValueWritten('/{gameCode}', async (event) => {
  const code = event.params.gameCode;
  if (!GAME_CODE_PATTERN.test(code)) return;
  const game = event.data.after.exists() ? event.data.after.val() as GameRecord : null;
  await updateLobby(code, game);
});
