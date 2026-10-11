export type PlayerSeat = 'player1' | 'player2';

export interface LegacyGameState {
  kuli: number[];
  classes: string[];
  p1Amount: number;
  p2Amount: number;
  isNewRound: boolean;
  canPress: boolean;
  isCollected: boolean;
  isP1Turn: boolean;
  roundCount: number;
  p1Blocks: number;
  p2Blocks: number;
  previousKuli: number;
  currentKuli: number;
  playButton: string;
  msgTextBox: string;
  pasuTextBox: string;
  gameOverTextBox: string;
}

export type GameAction =
  | { type: 'start' }
  | { type: 'select'; pit: number }
  | { type: 'advance' }
  | { type: 'reset' };

const START_MESSAGE = 'Press Play button or Space Key to start the game';

export function createInitialGame(): LegacyGameState {
  return {
    kuli: Array<number>(14).fill(0),
    classes: Array<string>(14).fill('kuli'),
    p1Amount: 35,
    p2Amount: 35,
    isNewRound: false,
    canPress: false,
    isCollected: true,
    isP1Turn: true,
    roundCount: 0,
    p1Blocks: 0,
    p2Blocks: 0,
    previousKuli: 0,
    currentKuli: 0,
    playButton: 'fas fa-circle-play',
    msgTextBox: START_MESSAGE,
    pasuTextBox: '',
    gameOverTextBox: '',
  };
}

export function normalizeGame(value: unknown): LegacyGameState {
  const initial = createInitialGame();
  if (!value || typeof value !== 'object') return initial;

  const data = value as Partial<LegacyGameState>;
  return {
    ...initial,
    ...data,
    kuli: Array.isArray(data.kuli) && data.kuli.length === 14 ? data.kuli : initial.kuli,
    classes:
      Array.isArray(data.classes) && data.classes.length === 14
        ? data.classes
        : initial.classes,
  };
}

function blocked(state: LegacyGameState, pit: number): boolean {
  return state.classes[pit]?.split(' ').includes('blocked') ?? false;
}

function nextOpenPit(state: LegacyGameState, from: number): number {
  let pit = (from + 1) % 14;
  let checked = 0;
  while (blocked(state, pit) && checked < 14) {
    pit = (pit + 1) % 14;
    checked += 1;
  }
  return pit;
}

function decoratePath(state: LegacyGameState, start: number, end: number): void {
  state.classes = state.classes.map((currentClass, pit) => {
    if (currentClass.split(' ').includes('blocked')) return 'kuli blocked';
    if (pit === start) return 'kuli start';
    if (pit === end) return 'kuli end';
    const onPath = start < end ? pit > start && pit < end : pit > start || pit < end;
    return onPath ? 'kuli path' : 'kuli';
  });
}

function sow(state: LegacyGameState, pit: number): void {
  const count = state.kuli[pit];
  state.previousKuli = pit;
  state.kuli[pit] = 0;

  let lastPit = pit;
  for (let seed = 0; seed < count; seed += 1) {
    lastPit = nextOpenPit(state, lastPit);
    state.kuli[lastPit] += 1;
  }

  state.currentKuli = nextOpenPit(state, lastPit);
  decoratePath(state, state.previousKuli, state.currentKuli);
  state.canPress = false;
  state.playButton = 'fas fa-circle-chevron-right';
}

function finishTurn(state: LegacyGameState, emptyPit: number): void {
  const capturePit = nextOpenPit(state, emptyPit);
  const captured = state.kuli[capturePit];
  if (state.isP1Turn) state.p1Amount += captured;
  else state.p2Amount += captured;
  state.kuli[capturePit] = 0;
  state.msgTextBox = captured
    ? `Player ${state.isP1Turn ? 1 : 2} earns ${captured} shell(s)`
    : `Player ${state.isP1Turn ? 1 : 2} earns no shells in this turn`;

  state.isP1Turn = !state.isP1Turn;
  state.canPress = true;
  state.classes = state.classes.map((currentClass) =>
    currentClass.split(' ').includes('blocked') ? 'kuli blocked' : 'kuli',
  );

  let player1Pasu = 0;
  let player2Pasu = 0;
  state.kuli.forEach((shells, pit) => {
    if (shells !== 4) return;
    if (pit < 7) {
      state.p1Amount += 4;
      player1Pasu += 1;
    } else {
      state.p2Amount += 4;
      player2Pasu += 1;
    }
    state.kuli[pit] = 0;
  });

  if (player1Pasu && player2Pasu) {
    state.pasuTextBox = `and Player 1 earns ${player1Pasu} Pasu(s),\nPlayer 2 earns ${player2Pasu} Pasu(s).`;
  } else if (player1Pasu) {
    state.pasuTextBox = `and Player 1 earns ${player1Pasu} Pasu(s).`;
  } else if (player2Pasu) {
    state.pasuTextBox = `and Player 2 earns ${player2Pasu} Pasu(s).`;
  } else {
    state.pasuTextBox = '';
  }

  const firstRowEmpty = state.kuli.slice(0, 7).every((shells) => shells === 0);
  const secondRowEmpty = state.kuli.slice(7).every((shells) => shells === 0);
  if (firstRowEmpty || secondRowEmpty) {
    const emptyPlayer = firstRowEmpty ? 1 : 2;
    state.isCollected = false;
    state.isNewRound = false;
    state.roundCount += 1;
    state.playButton = 'fas fa-circle-play';
    state.gameOverTextBox = `Player ${emptyPlayer} has no more shells to play. So, the round ${state.roundCount - 1} is completed. Press the Play button or Space Key to continue.`;
  } else {
    state.playButton = 'fas fa-circle-info';
  }
}

function distributeForRound(state: LegacyGameState): void {
  state.p1Blocks = 0;
  state.p2Blocks = 0;
  for (let pit = 0; pit < 7; pit += 1) {
    if (state.p1Amount >= 5) {
      state.kuli[pit] = 5;
      state.p1Amount -= 5;
      state.classes[pit] = 'kuli';
    } else {
      state.kuli[pit] = 0;
      state.classes[pit] = 'kuli blocked';
      state.p1Blocks += 1;
    }
  }
  for (let pit = 7; pit < 14; pit += 1) {
    if (state.p2Amount >= 5) {
      state.kuli[pit] = 5;
      state.p2Amount -= 5;
      state.classes[pit] = 'kuli';
    } else {
      state.kuli[pit] = 0;
      state.classes[pit] = 'kuli blocked';
      state.p2Blocks += 1;
    }
  }
  state.isNewRound = true;
  state.isP1Turn = state.roundCount % 2 === 0;
  state.canPress = true;
  state.playButton = 'fas fa-circle-chevron-right';
  state.gameOverTextBox = '';
  state.pasuTextBox = '';
  state.msgTextBox = `It's player ${state.isP1Turn ? 1 : 2}'s turn. Select any one non zero kuzhi.`;
}

function startOrAdvance(state: LegacyGameState): void {
  if (!state.isCollected) {
    state.isCollected = true;
    state.p1Amount += state.kuli.slice(0, 7).reduce((total, shells) => total + shells, 0);
    state.p2Amount += state.kuli.slice(7).reduce((total, shells) => total + shells, 0);
    state.kuli.fill(0);
    state.msgTextBox = `At the end of round ${state.roundCount}, Player 1 has ${state.p1Amount} shells and Player 2 has ${state.p2Amount} shells. Press the Play button or Space Key to continue.`;
    state.gameOverTextBox = '';
    state.pasuTextBox = '';
    return;
  }

  if (!state.isNewRound) {
    if (state.p1Amount < 5 || state.p2Amount < 5) {
      state.gameOverTextBox = state.p1Amount > state.p2Amount
        ? 'Game Over. Player 1 Wins. Press the Play button or Space Key to play again.'
        : 'Game Over. Player 2 Wins. Press the Play button or Space Key to play again.';
      state.msgTextBox = '';
      state.pasuTextBox = '';
      state.p1Amount = 35;
      state.p2Amount = 35;
      state.p1Blocks = 0;
      state.p2Blocks = 0;
      state.roundCount = 0;
      return;
    }
    distributeForRound(state);
    return;
  }

  if (!state.canPress) {
    if (state.kuli[state.currentKuli] !== 0) sow(state, state.currentKuli);
    else finishTurn(state, state.currentKuli);
    return;
  }

  const firstRowEmpty = state.kuli.slice(0, 7).every((shells) => shells === 0);
  const secondRowEmpty = state.kuli.slice(7).every((shells) => shells === 0);
  if (firstRowEmpty || secondRowEmpty) {
    state.isCollected = false;
    state.isNewRound = false;
    state.roundCount += 1;
    state.playButton = 'fas fa-circle-play';
    state.gameOverTextBox = `Player ${firstRowEmpty ? 1 : 2} has no more shells to play. So, the round ${state.roundCount - 1} is completed. Press the Play button or Space Key to continue.`;
    return;
  }
  state.msgTextBox = `It's player ${state.isP1Turn ? 1 : 2}'s turn. Select any one non zero kuzhi.`;
}

export function applyGameAction(
  current: LegacyGameState,
  action: GameAction,
): LegacyGameState {
  const state = normalizeGame(current);
  if (action.type === 'reset') return createInitialGame();

  if (action.type === 'start' || action.type === 'advance') {
    startOrAdvance(state);
    return state;
  }

  const { pit } = action;
  if (!Number.isInteger(pit) || pit < 0 || pit >= 14 || !state.canPress || !state.isNewRound) {
    return state;
  }
  const ownRow = state.isP1Turn ? pit < 7 : pit >= 7;
  if (!ownRow || state.kuli[pit] === 0 || blocked(state, pit)) return state;

  state.gameOverTextBox = '';
  state.pasuTextBox = '';
  sow(state, pit);
  return state;
}

export function lobbyStatus(state: LegacyGameState): 'waiting' | 'in-progress' | 'completed' {
  if (state.gameOverTextBox.startsWith('Game Over.')) return 'completed';
  return state.isNewRound ? 'in-progress' : 'waiting';
}
