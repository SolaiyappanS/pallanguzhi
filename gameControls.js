var gameCode = "";
var kuli = new Array(14).fill(0);
var isNewRound = false;
var canPress = false;
var p1Amount = 35;
var p2Amount = 35;
var isP1Turn = true;
var roundCount = 0;
var p1Blocks = 0;
var p2Blocks = 0;
var previousKuli = 0;
var currentKuli = 0;
var isCollected = true;
var isPlayer1 = true;
var canPlayerPlay = true;

function switchPlayer() {
  if (document.getElementById("playerInfo").innerHTML !== "Player 2") {
    if (confirm("You're Player 1. Do you want to be Player 2?")) {
      document.getElementById("playerInfo").innerHTML = "Player 2";
      isPlayer1 = false;
    }
  } else if (confirm("You're Player 2. Do you want to be Player 1?")) {
    document.getElementById("playerInfo").innerHTML = "Player 1";
    isPlayer1 = true;
  }
  canPlayerPlay = isP1Turn == isPlayer1;
}

function updateData(data, value) {
  firebase
    .database()
    .ref("/" + gameCode + "/" + data)
    .set(value);
}

function startTheGame() {
  firebase
    .database()
    .ref("/" + gameCode)
    .on("value", (res) => {
      for (var i = 0; i < 14; i++) {
        document.getElementById("kuli" + (i + 1)).innerHTML = res.val().kuli[i];
        document.getElementById("kuli" + (i + 1)).classList =
          res.val().classes[i];
      }
      document.getElementById("kuli15").innerHTML = res.val().p1Amount;
      document.getElementById("kuli16").innerHTML = res.val().p2Amount;
      kuli = res.val().kuli;
      p1Amount = res.val().p1Amount;
      p2Amount = res.val().p2Amount;
      isNewRound = res.val().isNewRound;
      canPress = res.val().canPress;
      isP1Turn = res.val().isP1Turn;
      roundCount = res.val().roundCount;
      p1Blocks = res.val().p1Blocks;
      p2Blocks = res.val().p2Blocks;
      previousKuli = res.val().previousKuli;
      currentKuli = res.val().currentKuli;
      isCollected = res.val().isCollected;
      document.getElementById("playButton").classList = res.val().playButton;
      canPlayerPlay = res.val().isP1Turn == isPlayer1;
    });
}

function createGameCode() {
  const Characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
  var result = [];
  for (var i = 0; i < 6; i++) {
    result[i] =
      Characters.split("")[Math.floor(Math.random() * Characters.length)];
  }
  gameCode = result.join("");
  return gameCode;
}

function resetGame() {
  firebase
    .database()
    .ref("/" + gameCode)
    .set({
      kuli: new Array(14).fill(0),
      classes: new Array(14).fill("kuli"),
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
      playButton: "fas fa-play",
    });

  document.getElementById("gameCode").innerHTML = "GAME CODE: " + gameCode;
  document.getElementById("homePage").style.display = "none";
  document.getElementById("gamePage").style.display = "block";
  document.getElementById("restartBtn").style.display = "block";
  document.getElementById("playerBtn").style.display = "block";
  startTheGame();
}

function createNewGame() {
  firebase
    .database()
    .ref("/" + createGameCode())
    .set({
      kuli: new Array(14).fill(0),
      classes: new Array(14).fill("kuli"),
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
      playButton: "fas fa-play",
    });

  document.getElementById("gameCode").innerHTML = "GAME CODE: " + gameCode;
  document.getElementById("homePage").style.display = "none";
  document.getElementById("gamePage").style.display = "block";
  document.getElementById("restartBtn").style.display = "block";
  document.getElementById("playerBtn").style.display = "block";
  startTheGame();
}

function joinExistingGame() {
  var code = document.getElementById("oldGameCode").value;
  firebase
    .database()
    .ref("/")
    .on("value", (res) => {
      if (code in res.val()) {
        gameCode = code;
        document.getElementById("homePage").style.display = "none";
        document.getElementById("gamePage").style.display = "block";
        document.getElementById("gameCode").innerHTML =
          "GAME CODE: " + gameCode;
        document.getElementById("restartBtn").style.display = "block";
        document.getElementById("playerBtn").style.display = "block";
        document.getElementById("noGameFound").style.display = "none";
        startTheGame();
      } else {
        document.getElementById("noGameFound").style.display = "block";
        document.getElementById("homePage").style.display = "block";
        document.getElementById("gamePage").style.display = "none";
        document.getElementById("restartBtn").style.display = "none";
        document.getElementById("playerBtn").style.display = "none";
      }
    });
}

function updateVal() {
  var np1Blocks = 0,
    np2Blocks = 0;
  for (i = 0; i < 7 - p1Blocks; i++) {
    if (p1Amount >= 5) {
      updateData("kuli/" + i, 5);
      updateData("p1Amount", p1Amount - 5);
      updateData("classes/" + i, "kuli");
    } else {
      np1Blocks++;
      updateData("classes/" + i, "kuli-block");
    }
  }
  for (i = 7; i < 14 - p2Blocks; i++) {
    if (p2Amount >= 5) {
      updateData("kuli/" + i, 5);
      updateData("p2Amount", p2Amount - 5);
      updateData("classes/" + i, "kuli");
    } else {
      np2Blocks++;
      updateData("classes/" + i, "kuli-block");
    }
  }
  updateData("p1Blocks", np1Blocks);
  updateData("p2Blocks", np2Blocks);
}

function start() {
  if (!isCollected) {
    updateData("isCollected", true);
    for (i = 0; i < 7; i++) {
      // adding elements in first row
      updateData("p1Amount", p1Amount + kuli[i]);
      updateData("kuli/" + i, 0);
    }
    for (i = 7; i < 14; i++) {
      // adding elements in second row
      updateData("p2Amount", p2Amount + kuli[i]);
      updateData("kuli/" + i, 0);
    }
    tempAlert(
      "At the end of round " +
        roundCount +
        ", Player 1 has " +
        p1Amount +
        " points and Player 2 has " +
        p2Amount +
        " points. Press the play button to continue."
    );
    tempAlertGameOver("");
    tempAlertPasu("");
  } else if (!isNewRound) {
    if (p1Amount >= 5 && p2Amount >= 5) {
      updateData("p1Blocks", 0);
      updateData("p2Blocks", 0);
      updateVal();
      updateData("isNewRound", true);
      if (roundCount % 2 == 0) updateData("isP1Turn", true);
      else updateData("isP1Turn", false);
      updateData("canPress", true);
      updateData("playButton", "fas fa-info-circle");
      tempAlertGameOver("");
      tempAlertPasu("");
      if (isP1Turn)
        tempAlert("It's player 1's turn. Select any one non zero hole.");
      else tempAlert("It's player 2's turn. Select any one non zero hole.");
    } else {
      gameOver();
    }
  } else if (!canPress) nextTurn();
  else {
    isEmpty();
    if (isNewRound) playerturn();
  }
}

function gameOver() {
  if (p1Amount > p2Amount)
    tempAlertGameOver(
      "Game Over. Player 1 Wins. Press the play button to play again"
    );
  else
    tempAlertGameOver(
      "Game Over. Player 2 Wins. Press the play button to play again"
    );
  tempAlert("");
  tempAlertPasu("");
  updateData("p1Amount", 35);
  updateData("p2Amount", 35);
  updateData("p1Blocks", 0);
  updateData("p2Blocks", 0);
  updateData("roundCount", 0);
}

function playerturn() {
  if (isP1Turn)
    tempAlert("It's player 1's turn. Select any one non zero hole.");
  else tempAlert("It's player 2's turn. Select any one non zero hole.");
  tempAlertGameOver("");
  tempAlertPasu("");
}

function excecute(v) {
  updateData("previousKuli", v);
  var amount = kuli[v];
  var v1;
  var x = 0;
  updateData("kuli/" + v, 0);
  for (var i = 0, j = 0; i < amount; j++, i++) {
    //Continuing excecution
    if (
      document.getElementById("kuli" + (((v + j) % 14) + 2)).classList ==
      "kuli-block"
    ) {
      x++;
      i--;
    } else {
      v1 = v + i + x + 1;
      v1 %= 14;
      updateData("kuli/" + v1, kuli[v1] + 1);
    }
  }
  v = v + amount + x + 1;
  v %= 14;
  updateData("currentKuli", v);
  if (
    document.getElementById("kuli" + (currentKuli + 1)).classList ==
    "kuli-block"
  ) {
    if (currentKuli < 7) updateData("currentKuli", 7);
    else updateData("currentKuli", 0);
  }
  var i;
  for (i = 0; i < 7 - p1Blocks; i++) {
    if (i == previousKuli) updateData("classes/" + i, "kuli-start");
    else if (i > previousKuli && i < currentKuli && previousKuli < currentKuli)
      updateData("classes/" + i, "kuli-path");
    else if (i > previousKuli && i != currentKuli && previousKuli > currentKuli)
      updateData("classes/" + i, "kuli-path");
    else if (i < currentKuli && previousKuli > currentKuli)
      updateData("classes/" + i, "kuli-path");
    else if (i == currentKuli) updateData("classes/" + i, "kuli-end");
    else updateData("classes/" + i, "kuli");
  }
  for (i = 7; i < 14 - p2Blocks; i++) {
    if (i == previousKuli) updateData("classes/" + i, "kuli-start");
    else if (i > previousKuli && i < currentKuli && previousKuli < currentKuli)
      updateData("classes/" + i, "kuli-path");
    else if (i > previousKuli && i != currentKuli && previousKuli > currentKuli)
      updateData("classes/" + i, "kuli-path");
    else if (i < currentKuli && previousKuli > currentKuli)
      updateData("classes/" + i, "kuli-path");
    else if (i == currentKuli) updateData("classes/" + i, "kuli-end");
    else updateData("classes/" + i, "kuli");
  }
}

function empty(v) {
  var v1 = v + 1;
  v1 %= 14;
  while (document.getElementById("kuli" + (v1 + 1)).classList == "kuli-block")
    v1 = (v1 + 1) % 14;
  if (isP1Turn) {
    updateData("p1Amount", p1Amount + kuli[v1]);
    if (kuli[v1] != 0)
      tempAlert(
        "Player 1 earns " + kuli[v1] + " point(s). Now it's Player 2's turn."
      );
    else tempAlert("Player 1 earns no points in this turn.");
  } else {
    updateData("p2Amount", p2Amount + kuli[v1]);
    if (kuli[v1] != 0)
      tempAlert(
        "Player 2 earns " + kuli[v1] + " point(s). Now it's Player 1's turn."
      );
    else tempAlert("Player 2 earns no points in this turn.");
  }
  updateData("kuli/" + v1, 0);
  updateData("isP1Turn", !isP1Turn);
  updateData("canPress", true);
  for (i = 0; i < 7 - p1Blocks; i++) updateData("classes/" + i, "kuli");
  for (i = 7; i < 14 - p2Blocks; i++) updateData("classes/" + i, "kuli");
  updateData("playButton", "fas fa-info-circle");

  pasu();
  isEmpty();
}

function nextTurn() {
  if (isNewRound) {
    if (kuli[currentKuli] != 0) excecute(currentKuli);
    else empty(currentKuli);
  }
}

function tempAlert(msg) {
  document.getElementById("msg").innerHTML = msg;
}
function tempAlertPasu(msg) {
  document.getElementById("pasu").innerHTML = msg;
}
function tempAlertGameOver(msg) {
  document.getElementById("gameOver").innerHTML = msg;
}

function pasu() {
  var i = 0;
  var pasuCount1 = 0;
  var pasuCount2 = 0;
  for (i = 0; i < 14; i++) {
    //Checking for Pasu
    if (kuli[i] == 4) {
      if (i < 7) {
        updateData("p1Amount", p1Amount + 4);
        pasuCount1 += 1;
      } else {
        updateData("p2Amount", p2Amount + 4);
        pasuCount2 += 1;
      }
      updateData("kuli/" + i, 0);
    }
  }
  if (pasuCount1 > 0 && pasuCount2 == 0)
    tempAlertPasu("And Player 1 earns " + pasuCount1 + " Pasu(s).");
  else if (pasuCount1 == 0 && pasuCount2 > 0)
    tempAlertPasu("And Player 2 earns " + pasuCount2 + " Pasu(s).");
  else if (pasuCount1 > 0 && pasuCount2 > 0)
    tempAlertPasu(
      "And Player 1 earns " +
        pasuCount1 +
        " Pasu(s),\nPlayer 2 earns " +
        pasuCount2 +
        " Pasu(s)."
    );
  else tempAlertPasu("");
}

function select(v) {
  if (canPress && canPlayerPlay) {
    if ((isP1Turn && v < 7) || (!isP1Turn && v >= 7 && v < 14)) {
      if (kuli[v] != 0) {
        updateData("playButton", "fas fa-angle-double-right");
        updateData("canPress", false);
        updateData("previousKuli", currentKuli);
        excecute(v);
      } else {
        if (document.getElementById("kuli" + (v + 1)).classList == "kuli-block")
          tempAlert("Can't select a blocked hole. Select any other hole.");
        else tempAlert("Can't select zero. Select any other hole.");
      }
      tempAlertGameOver("");
      tempAlertPasu("");
    } else {
      if (isP1Turn) tempAlert("It's Player 1's turn.");
      else tempAlert("It's Player 2's turn.");
    }
    tempAlertGameOver("");
    tempAlertPasu("");
  }
}

function isEmpty() {
  if (
    kuli[0] == 0 &&
    kuli[1] == 0 &&
    kuli[2] == 0 &&
    kuli[3] == 0 &&
    kuli[4] == 0 &&
    kuli[5] == 0 &&
    kuli[6] == 0
  )
    addAll();
  else if (
    kuli[7] == 0 &&
    kuli[8] == 0 &&
    kuli[9] == 0 &&
    kuli[10] == 0 &&
    kuli[11] == 0 &&
    kuli[12] == 0 &&
    kuli[13] == 0
  )
    addAll();
}
function addAll() {
  updateData("isCollected", false);
  updateData("isNewRound", false);
  updateData("playButton", "fas fa-play");
  updateData("roundCount", roundCount + 1);
  tempAlertGameOver(
    "The round " +
      roundCount +
      " is completed. Press Play button to play the round " +
      (roundCount + 1) +
      "."
  );
}

document.addEventListener(
  "keydown",
  (event) => {
    if (event.code === "Space") start();
  },
  false
);
