const PIT_COUNT = 14;
const SIDE_SIZE = 7;

export function initialState() {
  return {
    kuli: Array(PIT_COUNT).fill(0),
    classes: Array(PIT_COUNT).fill("kuli"),
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
    msgTextBox: "Press Play button or Space Key to start the game",
    pasuTextBox: "",
    gameOverTextBox: ""
  };
}

function sideIsEmpty(kuli, side) {
  const start = side * SIDE_SIZE;
  return kuli.slice(start, start + SIDE_SIZE).every((value) => value === 0);
}

function resetClasses(state) {
  state.classes = state.classes.map((value, index) => {
    const blocked = index < 7 ? index >= 7 - state.p1Blocks : index >= 14 - state.p2Blocks;
    return blocked ? "kuli blocked" : "kuli";
  });
}

function fillPits(state) {
  let p1Blocks = 0;
  let p2Blocks = 0;
  for (let index = 0; index < 7 - state.p1Blocks; index += 1) {
    if (state.p1Amount >= 5) {
      state.kuli[index] = 5;
      state.p1Amount -= 5;
      state.classes[index] = "kuli";
    } else {
      p1Blocks += 1;
      state.classes[index] = "kuli blocked";
    }
  }
  for (let index = 7; index < 14 - state.p2Blocks; index += 1) {
    if (state.p2Amount >= 5) {
      state.kuli[index] = 5;
      state.p2Amount -= 5;
      state.classes[index] = "kuli";
    } else {
      p2Blocks += 1;
      state.classes[index] = "kuli blocked";
    }
  }
  state.p1Blocks = p1Blocks;
  state.p2Blocks = p2Blocks;
}

function collectRound(state) {
  state.p1Amount += state.kuli.slice(0, 7).reduce((sum, value) => sum + value, 0);
  state.p2Amount += state.kuli.slice(7).reduce((sum, value) => sum + value, 0);
  state.kuli.fill(0);
  state.isCollected = true;
  state.isNewRound = false;
  state.canPress = false;
  state.classes = Array(PIT_COUNT).fill("kuli");
  state.msgTextBox = `At the end of round ${state.roundCount}, Player 1 has ${state.p1Amount} shells and Player 2 has ${state.p2Amount} shells. Press Play to continue.`;
  state.pasuTextBox = "";
  state.gameOverTextBox = "";
}

function finishRound(state, side) {
  state.isCollected = false;
  state.isNewRound = false;
  state.canPress = false;
  state.roundCount += 1;
  state.gameOverTextBox = `Player ${side} has no more shells to play. Round ${state.roundCount} is completed. Press Play to continue.`;
  state.msgTextBox = "Press Play button or Space Key to continue.";
}

function applyPasu(state) {
  let p1 = 0;
  let p2 = 0;
  state.kuli.forEach((value, index) => {
    if (value === 4) {
      state.kuli[index] = 0;
      if (index < 7) {
        state.p1Amount += 4;
        p1 += 1;
      } else {
        state.p2Amount += 4;
        p2 += 1;
      }
    }
  });
  const messages = [];
  if (p1) messages.push(`Player 1 earns ${p1} Pasu(s).`);
  if (p2) messages.push(`Player 2 earns ${p2} Pasu(s).`);
  state.pasuTextBox = messages.join(" ");
}

function distribute(state, start) {
  const amount = state.kuli[start];
  state.previousKuli = start;
  state.kuli[start] = 0;
  let cursor = start;
  let placed = 0;
  while (placed < amount) {
    cursor = (cursor + 1) % PIT_COUNT;
    if (state.classes[cursor] === "kuli blocked") continue;
    state.kuli[cursor] += 1;
    placed += 1;
  }
  let next = (cursor + 1) % PIT_COUNT;
  while (state.classes[next] === "kuli blocked") next = (next + 1) % PIT_COUNT;
  state.currentKuli = next;
  state.classes = state.classes.map((value, index) => {
    if (value === "kuli blocked") return value;
    if (index === start) return "kuli start";
    if (index === next) return "kuli end";
    return "kuli";
  });
  state.playButton = "fas fa-circle-chevron-right";
}

function takeNext(state, cursor) {
  let next = (cursor + 1) % PIT_COUNT;
  while (state.classes[next] === "kuli blocked") next = (next + 1) % PIT_COUNT;
  const earned = state.kuli[next];
  state.kuli[next] = 0;
  if (state.isP1Turn) state.p1Amount += earned;
  else state.p2Amount += earned;
  state.isP1Turn = !state.isP1Turn;
  state.canPress = true;
  state.classes = state.classes.map((value) => value === "kuli blocked" ? value : "kuli");
  state.msgTextBox = earned ? `Player ${state.isP1Turn ? 2 : 1} earns ${earned} shell(s).` : `Player ${state.isP1Turn ? 2 : 1} earns no shells in this turn.`;
  state.pasuTextBox = "";
  applyPasu(state);
  if (sideIsEmpty(state.kuli, 0)) finishRound(state, 1);
  else if (sideIsEmpty(state.kuli, 1)) finishRound(state, 2);
}

export function applyAction(state, action, player) {
  const next = structuredClone(state);
  if (action.type === "select") {
    if (!next.canPress) throw new Error("Wait for the current move to finish.");
    const index = Number(action.index);
    const ownsPit = next.isP1Turn ? index < 7 : index >= 7 && index < 14;
    if (!Number.isInteger(index) || index < 0 || index >= PIT_COUNT || !ownsPit) throw new Error("Select a kuzhi on your side.");
    if (next.classes[index] === "kuli blocked") throw new Error("That kuzhi is blocked.");
    if (next.kuli[index] === 0) throw new Error("Select a non-zero kuzhi.");
    if (player !== (next.isP1Turn ? 1 : 2)) throw new Error("It is not your turn.");
    next.canPress = false;
    distribute(next, index);
    next.msgTextBox = `Player ${next.isP1Turn ? 1 : 2} is distributing shells.`;
    return next;
  }
  if (action.type !== "play") throw new Error("Unknown game action.");
  if (!next.isCollected) {
    collectRound(next);
    return next;
  }
  if (!next.isNewRound) {
    if (next.p1Amount < 5 || next.p2Amount < 5) {
      next.gameOverTextBox = next.p1Amount > next.p2Amount ? "Game Over. Player 1 Wins." : "Game Over. Player 2 Wins.";
      next.p1Amount = 35;
      next.p2Amount = 35;
      next.roundCount = 0;
      return next;
    }
    next.p1Blocks = 0;
    next.p2Blocks = 0;
    fillPits(next);
    next.isNewRound = true;
    next.canPress = true;
    next.isP1Turn = next.roundCount % 2 === 0;
    next.msgTextBox = `It's player ${next.isP1Turn ? 1 : 2}'s turn. Select any one non-zero kuzhi.`;
    next.gameOverTextBox = "";
    next.pasuTextBox = "";
    return next;
  }
  if (!next.canPress) {
    if (next.kuli[next.currentKuli] !== 0) distribute(next, next.currentKuli);
    else takeNext(next, next.currentKuli);
  }
  return next;
}

export function publicState(state) {
  return { ...state, playButton: state.canPress ? "fas fa-circle-play" : "fas fa-circle-chevron-right" };
}
