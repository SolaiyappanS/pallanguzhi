import type { LegacyGameState } from '../../shared/gameEngine';

export type { LegacyGameState };
export type GameRole = 'player1' | 'player2' | 'viewer';

export interface LobbyEntry {
  code: string;
  status: 'waiting' | 'in-progress' | 'completed';
  occupiedSeats: number;
  createdAt: number;
  updatedAt: number;
  roundCount: number;
  revision: number;
}

export interface Membership {
  role: GameRole;
  uid: string;
}
