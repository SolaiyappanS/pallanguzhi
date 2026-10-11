import { describe, expect, it } from 'vitest';
import { applyGameAction, createInitialGame, lobbyStatus, normalizeGame } from './gameEngine.js';

describe('Pallanguzhi game engine', () => {
  it('keeps the legacy initial board and totals', () => {
    expect(createInitialGame()).toMatchObject({
      kuli: Array(14).fill(0),
      classes: Array(14).fill('kuli'),
      p1Amount: 35,
      p2Amount: 35,
      isP1Turn: true,
      isNewRound: false,
    });
  });

  it('distributes five shells per available kuzhi and blocks unaffordable pits', () => {
    const state = { ...createInitialGame(), p1Amount: 9, isCollected: true };
    const next = applyGameAction(state, { type: 'start' });

    expect(next.kuli.slice(0, 7)).toEqual([5, 0, 0, 0, 0, 0, 0]);
    expect(next.classes.slice(0, 7)).toEqual(['kuli', ...Array(6).fill('kuli blocked')]);
    expect(next.p1Amount).toBe(4);
    expect(next.p2Amount).toBe(0);
    expect(next.p1Blocks).toBe(6);
    expect(next.isNewRound).toBe(true);
  });

  it('sows clockwise, highlights the path, and skips blocked kuzhis', () => {
    const state = createInitialGame();
    state.isNewRound = true;
    state.canPress = true;
    state.kuli[0] = 3;
    state.classes[1] = 'kuli blocked';

    const next = applyGameAction(state, { type: 'select', pit: 0 });

    expect(next.kuli[0]).toBe(0);
    expect(next.kuli[1]).toBe(0);
    expect(next.kuli.slice(2, 5)).toEqual([1, 1, 1]);
    expect(next.currentKuli).toBe(5);
    expect(next.classes[0]).toBe('kuli start');
    expect(next.classes[1]).toBe('kuli blocked');
    expect(next.classes[4]).toBe('kuli path');
    expect(next.classes[5]).toBe('kuli end');
  });

  it('captures the next kuzhi, awards pasu, and changes turns', () => {
    const state = createInitialGame();
    state.isNewRound = true;
    state.canPress = false;
    state.currentKuli = 4;
    state.kuli[1] = 2;
    state.kuli[5] = 3;
    state.kuli[8] = 4;
    state.kuli[7] = 1;
    state.kuli[0] = 1;

    const next = applyGameAction(state, { type: 'advance' });

    expect(next.p1Amount).toBe(38);
    expect(next.p2Amount).toBe(39);
    expect(next.kuli[5]).toBe(0);
    expect(next.kuli[8]).toBe(0);
    expect(next.pasuTextBox).toContain('Player 2 earns 1 Pasu');
    expect(next.isP1Turn).toBe(false);
    expect(next.canPress).toBe(true);
  });

  it('does not accept an invalid or empty-pit selection', () => {
    const state = createInitialGame();
    state.isNewRound = true;
    state.canPress = true;
    state.kuli[0] = 5;

    expect(applyGameAction(state, { type: 'select', pit: 8 })).toEqual(state);
    expect(applyGameAction(state, { type: 'select', pit: 1 })).toEqual(state);
    expect(applyGameAction(state, { type: 'select', pit: 14 })).toEqual(state);
  });

  it('preserves additional legacy record metadata during regular moves', () => {
    const state = { ...createInitialGame(), players: { player1Uid: 'uid-one', player2Uid: null } };
    const next = applyGameAction(state, { type: 'start' });
    expect((next as typeof state).players).toEqual(state.players);
    expect(normalizeGame(state)).toMatchObject(state);
  });

  it('resets the board using the original starting totals', () => {
    const state = { ...createInitialGame(), p1Amount: 4, kuli: Array(14).fill(2) };
    expect(applyGameAction(state, { type: 'reset' })).toEqual(createInitialGame());
  });

  it('collects remaining shells into player stores at the end of a round', () => {
    const state = { ...createInitialGame(), isCollected: false, roundCount: 2 };
    state.kuli = Array.from({ length: 14 }, (_, index) => index + 1);

    const next = applyGameAction(state, { type: 'start' });

    expect(next.p1Amount).toBe(63);
    expect(next.p2Amount).toBe(112);
    expect(next.kuli).toEqual(Array(14).fill(0));
    expect(next.isCollected).toBe(true);
    expect(next.msgTextBox).toContain('Player 1 has 63 shells and Player 2 has 112 shells');
  });

  it('marks completed legacy game messages in the lobby', () => {
    expect(lobbyStatus(createInitialGame())).toBe('waiting');
    expect(lobbyStatus({ ...createInitialGame(), isNewRound: true })).toBe('in-progress');
    expect(lobbyStatus({ ...createInitialGame(), gameOverTextBox: 'Game Over. Player 1 Wins.' })).toBe('completed');
  });
});
