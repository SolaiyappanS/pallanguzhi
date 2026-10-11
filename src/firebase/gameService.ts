import { httpsCallable } from 'firebase/functions';
import { onValue, ref } from 'firebase/database';
import { auth, database, functions } from './client';
import type { GameAction } from '../../shared/gameEngine';
import type { LegacyGameState, LobbyEntry, Membership } from '../types/game';

interface CodeResult { code: string }
interface JoinResult extends CodeResult { role: Membership['role'] }

const createGameCall = httpsCallable<void, CodeResult>(functions, 'createGame');
const joinGameCall = httpsCallable<{ code: string; allowViewer: boolean }, JoinResult>(functions, 'joinGame');
const applyActionCall = httpsCallable<{ code: string; action: GameAction }, { ok: true }>(functions, 'applyGameAction');

export async function createGame(): Promise<string> {
  const result = await createGameCall();
  return result.data.code;
}

export async function joinGame(code: string, allowViewer = false): Promise<Membership> {
  const result = await joinGameCall({ code, allowViewer });
  return { role: result.data.role, uid: auth.currentUser?.uid ?? '' };
}

export async function applyAction(code: string, action: GameAction): Promise<void> {
  await applyActionCall({ code, action });
}

export function subscribeToGame(
  code: string,
  onChange: (game: LegacyGameState | null) => void,
  onError: (error: Error) => void,
): () => void {
  return onValue(
    ref(database, code),
    (snapshot) => onChange(snapshot.exists() ? snapshot.val() as LegacyGameState : null),
    (error) => onError(error),
  );
}

export function subscribeToLobby(
  onChange: (entries: LobbyEntry[]) => void,
  onError: (error: Error) => void,
): () => void {
  return onValue(
    ref(database, 'lobby'),
    (snapshot) => {
      const values = snapshot.val() as Record<string, Omit<LobbyEntry, 'code'>> | null;
      const entries = Object.entries(values ?? {}).map(([code, entry]) => ({ code, ...entry }));
      entries.sort((a, b) => b.updatedAt - a.updatedAt);
      onChange(entries);
    },
    (error) => onError(error),
  );
}
