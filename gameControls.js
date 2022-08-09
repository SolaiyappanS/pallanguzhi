var gameCode = "";
var kuli = new Array(14);
var begin = false;
var canPress = false;
var p1Amount = 35;
var p2Amount = 35;
var p1turn = true;
var roundCount = 0;
var p1blocks = 0;
var p2blocks = 0;
var positionPrevious = 0;
var positionCurrent = 0;
var collected = true;
var playbutton = "fas fa-play";

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
    .on(
      "value",
      (res) => {
        pallanguzhi = res.val();
        for (var i = 0; i < 14; i++) {
          document.getElementById("kuli" + (i + 1)).innerHTML =
            res.val().kuli[i];
          document.getElementById("kuli" + (i + 1)).classList =
            res.val().classes[i];
        }
        document.getElementById("kuli15").innerHTML = res.val().p1Amount;
        document.getElementById("kuli16").innerHTML = res.val().p2Amount;
        begin = res.val().begin;
        canPress = res.val().canPress;
        p1turn = res.val().p1turn;
        roundCount = res.val().roundCount;
        p1blocks = res.val().p1blocks;
        p2blocks = res.val().p2blocks;
        positionPrevious = res.val().positionPrevious;
        positionCurrent = res.val().positionCurrent;
        collected = res.val().collected;
        document.getElementById("playbutton").classList = res.val().playbutton;
      },
      (errorObject) => {
        console.log(errorObject.name);
        location.reload();
        alert("Game code doesn't exists");
      }
    );
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

function createNewGame() {
  firebase
    .database()
    .ref("/" + createGameCode())
    .set({
      kuli: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      classes: [
        "kuli",
        "kuli",
        "kuli",
        "kuli",
        "kuli",
        "kuli",
        "kuli",
        "kuli",
        "kuli",
        "kuli",
        "kuli",
        "kuli",
        "kuli",
        "kuli",
      ],
      p1Amount: 35,
      p2Amount: 35,
      begin: false,
      canPress: false,
      collected: true,
      p1turn: true,
      roundCount: 0,
      p1blocks: 0,
      p2blocks: 0,
      positionPrevious: 0,
      positionCurrent: 0,
      playbutton: "fas fa-play",
    });

  document.getElementById("gameCode").innerHTML = "GAME CODE: " + gameCode;
  document.getElementById("homePage").style.display = "none";
  document.getElementById("gamePage").style.display = "block";
  startTheGame();
}

function joinExistingGame() {
  var code = document.getElementById("oldGameCode").value;
  if (/^[A-Z0-9]{6}$/.test(code)) {
    gameCode = code;
    document.getElementById("homePage").style.display = "none";
    document.getElementById("gamePage").style.display = "block";
    document.getElementById("gameCode").innerHTML = "GAME CODE: " + gameCode;
    startTheGame();
  } else alert("Invalid Code");
}

function updateVal() {
  var np1blocks = 0,
    np2blocks = 0;
  for (i = 0; i < 7 - p1blocks; i++) {
    if (p1Amount >= 5) {
      updateData("kuli/" + i, 5);
      updateData("p1Amount", p1Amount - 5);
      updateData("classes/" + i, "kuli");
    } else {
      np1blocks++;
      updateData("classes/" + i, "kuli-block");
    }
  }
  for (i = 7; i < 14 - p2blocks; i++) {
    if (p2Amount >= 5) {
      updateData("kuli/" + i, 5);
      updateData("p2Amount", p2Amount - 5);
      updateData("classes/" + i, "kuli");
    } else {
      np2blocks++;
      updateData("classes/" + i, "kuli-block");
    }
  }
  updateData("p1blocks", np1blocks);
  updateData("p2blocks", np2blocks);
}

function start() {
  if (!collected) {
    updateData("collected", true);
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
      roundCount +
        "வது சுற்று முடிவில் முதலாம் ஆட்டக்காரர் " +
        p1Amount +
        " புள்ளிகளையும், இரண்டாம் ஆட்டக்காரர் " +
        p2Amount +
        " புள்ளிகளையும் பெற்றுள்ளனர். அடுத்த சுற்றுக்கு Space Key அல்லது play பட்டனை அழுத்தவும்",
      "At the end of round " +
        roundCount +
        ", Player 1 has " +
        p1Amount +
        " points and Player 2 has " +
        p2Amount +
        " points. Press the play button or Space Key to continue."
    );
    tempAlertGameOver("", "");
    tempAlertPasu("", "");
  } else if (!begin) {
    if (p1Amount >= 5 && p2Amount >= 5) {
      updateData("p1blocks", 0);
      updateData("p2blocks", 0);
      updateVal();
      updateData("begin", true);
      if (roundCount % 2 == 0) updateData("p1turn", true);
      else updateData("p1turn", false);
      updateData("canPress", true);
      updateData("playbutton", "fas fa-info-circle");
      tempAlertGameOver("", "");
      tempAlertPasu("", "");
      if (p1turn)
        tempAlert(
          "இது முதலாம் ஆட்டக்காரரின் முறை. பூஜ்ஜியமற்ற குழியைத் தேர்ந்தெடுக்கவும்.",
          "It's player 1's turn. Select any one non zero hole."
        );
      else
        tempAlert(
          "இது இரண்டாம் ஆட்டக்காரரின் முறை. பூஜ்ஜியமற்ற குழியைத் தேர்ந்தெடுக்கவும்",
          "It's player 2's turn. Select any one non zero hole."
        );
    } else {
      gameOver();
    }
  } else if (!canPress) nextTurn();
  else {
    isEmpty();
    if (begin) playerturn();
  }
}

function gameOver() {
  if (p1Amount > p2Amount)
    tempAlertGameOver(
      "ஆட்டம் முடிந்தது. முதலாம் ஆட்டக்காரர் வெற்றி பெற்றுவிட்டார். மீண்டும் விளையாட Space Key அல்லது play பட்டனை அழுத்தவும்",
      "Game Over. Player 1 Wins. Press the play button or Space Key to play again"
    );
  else
    tempAlertGameOver(
      "ஆட்டம் முடிந்தது. இரண்டாம் ஆட்டக்காரர் வெற்றி பெற்றுவிட்டார். மீண்டும் விளையாட Space Key அல்லது play பட்டனை அழுத்தவும்",
      "Game Over. Player 2 Wins. Press the play button or Space Key to play again"
    );
  tempAlert("", "");
  tempAlertPasu("", "");
  updateData("p1Amount", 35);
  updateData("p2Amount", 35);
  updateData("p1blocks", 0);
  updateData("p2blocks", 0);
  updateData("roundCount", 0);
}

function playerturn() {
  if (p1turn)
    tempAlert(
      "இது முதலாம் ஆட்டக்காரரின் முறை. பூஜ்ஜியமற்ற குழியைத் தேர்ந்தெடுக்கவும்.",
      "It's player 1's turn. Select any one non zero hole."
    );
  else
    tempAlert(
      "இது இரண்டாம் ஆட்டக்காரரின் முறை. பூஜ்ஜியமற்ற குழியைத் தேர்ந்தெடுக்கவும்.",
      "It's player 2's turn. Select any one non zero hole."
    );
  tempAlertGameOver("", "");
  tempAlertPasu("", "");
}

function excecute(v) {
  updateData("positionPrevious", v);
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
  updateData("positionCurrent", v);
  if (
    document.getElementById("kuli" + (positionCurrent + 1)).classList ==
    "kuli-block"
  ) {
    if (positionCurrent < 7) updateData("positionCurrent", 7);
    else updateData("positionCurrent", 0);
  }
  var i;
  for (i = 0; i < 7 - p1blocks; i++) {
    if (i == positionPrevious) updateData("classes/" + i, "kuli-start");
    else if (
      i > positionPrevious &&
      i < positionCurrent &&
      positionPrevious < positionCurrent
    )
      updateData("classes/" + i, "kuli-path");
    else if (
      i > positionPrevious &&
      i != positionCurrent &&
      positionPrevious > positionCurrent
    )
      updateData("classes/" + i, "kuli-path");
    else if (i < positionCurrent && positionPrevious > positionCurrent)
      updateData("classes/" + i, "kuli-path");
    else if (i == positionCurrent) updateData("classes/" + i, "kuli-end");
    else updateData("classes/" + i, "kuli");
  }
  for (i = 7; i < 14 - p2blocks; i++) {
    if (i == positionPrevious) updateData("classes/" + i, "kuli-start");
    else if (
      i > positionPrevious &&
      i < positionCurrent &&
      positionPrevious < positionCurrent
    )
      updateData("classes/" + i, "kuli-path");
    else if (
      i > positionPrevious &&
      i != positionCurrent &&
      positionPrevious > positionCurrent
    )
      updateData("classes/" + i, "kuli-path");
    else if (i < positionCurrent && positionPrevious > positionCurrent)
      updateData("classes/" + i, "kuli-path");
    else if (i == positionCurrent) updateData("classes/" + i, "kuli-end");
    else updateData("classes/" + i, "kuli");
  }
}

function empty(v) {
  var v1 = v + 1;
  v1 %= 14;
  while (document.getElementById("kuli" + (v1 + 1)).classList == "kuli-block")
    v1 = (v1 + 1) % 14;
  if (p1turn) {
    updateData("p1Amount", p1Amount + kuli[v1]);
    if (kuli[v1] != 0)
      tempAlert(
        "முதலாம் ஆட்டக்காரர், " + kuli[v1] + " புள்ளிகளைப் பெறுகிறார்.",
        "Player 1 earns " + kuli[v1] + " point(s)."
      );
    else
      tempAlert(
        "முதலாம் ஆட்டக்காரர் இம்முறை எந்த புள்ளிகளையும் பெறவில்லை.",
        "Player 1 earns no points in this turn."
      );
  } else {
    updateData("p2Amount", p2Amount + kuli[v1]);
    if (kuli[v1] != 0)
      tempAlert(
        "இரண்டாம் ஆட்டக்காரர், " + kuli[v1] + " புள்ளிகளைப் பெறுகிறார்.",
        "Player 2 earns " + kuli[v1] + " point(s)."
      );
    else
      tempAlert(
        "இரண்டாம் ஆட்டக்காரர் இம்முறை எந்த புள்ளிகளையும் பெறவில்லை.",
        "Player 2 earns no points in this turn."
      );
  }
  updateData("kuli/" + v1, 0);
  updateData("p1turn", !p1turn);
  updateData("canPress", true);
  for (i = 0; i < 7 - p1blocks; i++) updateData("classes/" + i, "kuli");
  for (i = 7; i < 14 - p2blocks; i++) updateData("classes/" + i, "kuli");
  updateData("playbutton", "fas fa-info-circle");
  pasu();
  isEmpty();
}

function nextTurn() {
  if (begin) {
    if (kuli[positionCurrent] != 0) excecute(positionCurrent);
    else empty(positionCurrent);
  }
}

function changelang() {
  if (document.getElementById("langbtn").innerHTML !== "Switch to English") {
    document.getElementById("tamilMsg").style.display = "block";
    document.getElementById("englishMsg").style.display = "none";
    document.getElementById("tamilPasu").style.display = "block";
    document.getElementById("englishPasu").style.display = "none";
    document.getElementById("tamilGameOver").style.display = "block";
    document.getElementById("englishGameOver").style.display = "none";
    document.getElementById("langbtn").innerHTML = "Switch to English";
    document.getElementById("titleHomePage").innerHTML = "பல்லாங்குழி";
    document.getElementById("titleNavBar").innerHTML = "பல்லாங்குழி";
  } else {
    document.getElementById("tamilMsg").style.display = "none";
    document.getElementById("englishMsg").style.display = "block";
    document.getElementById("tamilPasu").style.display = "none";
    document.getElementById("englishPasu").style.display = "block";
    document.getElementById("tamilGameOver").style.display = "none";
    document.getElementById("englishGameOver").style.display = "block";
    document.getElementById("langbtn").innerHTML = "Switch to Tamil";
    document.getElementById("titleHomePage").innerHTML = "Pallanguzhi";
    document.getElementById("titleNavBar").innerHTML = "Pallanguzhi";
  }
}

function tempAlert(msg1, msg2) {
  document.getElementById("tamilMsg").innerHTML = msg1;
  document.getElementById("englishMsg").innerHTML = msg2;
}
function tempAlertPasu(msg1, msg2) {
  document.getElementById("tamilPasu").innerHTML = msg1;
  document.getElementById("englishPasu").innerHTML = msg2;
}
function tempAlertGameOver(msg1, msg2) {
  document.getElementById("tamilGameOver").innerHTML = msg1;
  document.getElementById("englishGameOver").innerHTML = msg2;
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
    tempAlertPasu(
      "மற்றும் முதலாம் ஆட்டக்காரர் " + pasuCount1 + " பசுக்களைப் பெறுகிறார்.",
      "And Player 1 earns " + pasuCount1 + " Pasu(s)."
    );
  else if (pasuCount1 == 0 && pasuCount2 > 0)
    tempAlertPasu(
      "மற்றும் இரண்டாம் ஆட்டக்காரர் " + pasuCount2 + " பசுக்களைப் பெறுகிறார்.",
      "And Player 2 earns " + pasuCount2 + " Pasu(s)."
    );
  else if (pasuCount1 > 0 && pasuCount2 > 0)
    tempAlertPasu(
      "மற்றும் முதலாம் ஆட்டக்காரர் " +
        pasuCount1 +
        " பசுக்களைப் பெறுகிறார்,\nஇரண்டாம் ஆட்டக்காரர் " +
        pasuCount2 +
        " பசுக்களைப் பெறுகிறார்.",
      "And Player 1 earns " +
        pasuCount1 +
        " Pasu(s),\nPlayer 2 earns " +
        pasuCount2 +
        " Pasu(s)."
    );
  else tempAlertPasu("", "");
}

function select(v) {
  if (canPress) {
    if ((p1turn && v < 7) || (!p1turn && v >= 7 && v < 14)) {
      if (kuli[v] != 0) {
        updateData("playbutton", "fas fa-angle-double-right");
        updateData("canPress", false);
        updateData("positionPrevious", positionCurrent);
        excecute(v);
      } else {
        if (document.getElementById("kuli" + (v + 1)).classList == "kuli-block")
          tempAlert(
            "தடுக்கப்பட்ட குழியை தேர்வு செய்ய இயலாது. வேறு ஏதேனும் குழியை தேர்வு செய்யவும்.",
            "Can't select a blocked hole. Select any other hole."
          );
        else
          tempAlert(
            "பூஜ்யம் உள்ள குழியை தேர்வு செய்ய இயலாது. வேறு ஏதேனும் குழியை தேர்வு செய்யவும்.",
            "Can't select zero. Select any other hole."
          );
      }
      tempAlertGameOver("", "");
      tempAlertPasu("", "");
    } else {
      if (p1turn)
        tempAlert("இது முதலாம் ஆட்டக்காரரின் முறை.", "It's Player 1's turn.");
      else
        tempAlert("இது இரண்டாம் ஆட்டக்காரரின் முறை.", "It's Player 2's turn.");
    }
    tempAlertGameOver("", "");
    tempAlertPasu("", "");
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
  updateData("collected", false);
  updateData("begin", false);
  updateData("playbutton", "fas fa-play");
  updateData("roundCount", roundCount + 1);
  tempAlertGameOver(
    "சுற்று " +
      roundCount +
      " முடிந்தது. சுற்று " +
      (roundCount + 1) +
      "க்கு Space Key அல்லது Play பட்டனை அழுத்தவும்.",
    "The round " +
      roundCount +
      " is completed. Press Play button or Space Key to play the round " +
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
