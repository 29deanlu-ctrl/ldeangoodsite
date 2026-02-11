// ==================== FIREBASE SETUP ====================
const firebaseConfig = {
 apiKey: "AIzaSyCTdrmc2bX4Q3OXyf3L9PGGFluOszBPtO0",
 authDomain: "ldean-clicker-leaderboard.firebaseapp.com",
 projectId: "ldean-clicker-leaderboard",
 storageBucket: "ldean-clicker-leaderboard.firebasestorage.app",
 messagingSenderId: "611226135294",
 appId: "1:611226135294:web:e4562b5e71e99f2fb713af"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();


// ==================== TAB SYSTEM ====================
function setupTabs() {
 const nav = document.createElement("div");
 nav.style.display = "flex";
 nav.style.gap = "10px";
 nav.style.justifyContent = "center";
 nav.style.marginBottom = "20px";

 ["🎮 Clicker", "🃏 Casino"].forEach((txt, i) => {
   const btn = document.createElement("button");
   btn.textContent = txt;
   btn.style.padding = "10px 18px";
   btn.style.cursor = "pointer";
   btn.onclick = () => switchPage(i === 0 ? "clicker" : "casino");
   nav.appendChild(btn);
 });

 document.querySelector(".page-container").prepend(nav);
}

function switchPage(id) {
 document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
 document.getElementById(id).classList.add("active");
}


// ==================== USERNAME ====================
function getUsername() {
 let u = localStorage.getItem("clickerUsername");
 if (!u) {
   u = prompt("Choose a username:") || "Anonymous";
   localStorage.setItem("clickerUsername", u);
 }
 return u;
}


// ==================== CLICKER GAME ====================
class AdvancedClickerGame {
 constructor() {
   this.username = getUsername();
   const save = JSON.parse(localStorage.getItem("clickerSave")) || {};

   this.score = save.score || 0;
   this.perClick = save.perClick || 1;
   this.passivePerSecond = save.passivePerSecond || 0;
   this.multiplierValue = save.multiplierValue || 2;
   this.photoCount = save.photoCount || 1;

   // 🌀 REBIRTH DATA (SAFE ADD)
   this.rebirths = save.rebirths || 0;
   this.rebirthMultiplier = save.rebirthMultiplier || 1;

   this.photos = [
     'images/018879bf-19f7-488c-9b8e-b187de3e160d (1).png',
     'images/1fa2f337-ba2b-402e-973a-4cddd7761054.png',
     'images/051dde8f-8d8b-474e-9188-282b5adbf160.png',
     'images/10b773cf-6f38-4daf-b13b-40835c18fea8.png',
     'images/4359f31f-41df-4605-a3a0-f60d82e4d54d.png',
     'images/5701c659-4d24-4faa-b1ba-70cd37623490.png',
     'images/6f9d12ac-dd1b-4417-873e-de503eaf6b4f.png',
     'images/820be2fe-0cf5-4f99-afec-f1a5c9acc251.png',
     'images/9c85eb86-70a4-4a33-8363-26bb443117be.png',
     'images/9d6b7aee-b355-4d7f-8acb-1cf1ad31493f.png',
     'images/a413dca6-b8c3-43a8-98e0-2a9fe01d0ef1.png',
     'images/ad8cfdc8-d111-4daf-8f90-01c8c63e533b.png',
     'images/b62dbd0c-9860-40da-8dc1-18fcbb892034.png',
     'images/cdabf601-bec2-45d2-be3e-075525118585.png',
     'images/d1dd96e3-85b4-4250-bfa4-b53a83aaf2a3.png',
     'images/dcf4e2a1-954b-4486-aef7-42c041693c43.png',
     'images/de5a2afd-f1e4-4d04-bf90-c2995905e6e6.png',
     'images/e9fd8bda-f553-4d38-ad50-c878b86c0eb9.png',
     'images/f3a95d98-89d8-4e5f-8527-55b9e15d685d.png',
     'images/IMG_8714.jpeg'
   ];

   this.photoUpgrades = this.photos.map((p, i) => ({
     index: i,
     photo: p,
     cost: Math.ceil(Math.pow(2.2, i) * 100),
     purchased: save.photoUpgrades?.[i]?.purchased || i === 0,
     passiveValue: Math.ceil(i * 0.3)
   }));

   this.powerUpgrades = [
     { id: "click", name: "+10 Per Click", base: 500, owned: save.power?.click || 0 },
     { id: "auto", name: "Auto Clicker", base: 2000, owned: save.power?.auto || 0 },
     { id: "multi", name: "Multiplier Boost", base: 5000, owned: save.power?.multi || 0 }
   ];

   document.getElementById("clickerImg").src = save.currentPhoto || this.photoUpgrades[0].photo;

   this.bindClick();
   this.renderPhotos();
   this.renderPowers();
   this.loop();
   this.updateUI();
   this.fetchLeaderboard();
   this.fetchRebirthLeaderboard();

   setInterval(() => this.submitScore(), 10000);
 }

 bindClick() {
   document.getElementById("clickerImg").onclick = () => {
     this.score += this.perClick * this.multiplierValue * this.rebirthMultiplier;
     this.updateUI();
     this.save();
   };
 }

 loop() {
   setInterval(() => {
     if (this.passivePerSecond > 0) {
       this.score += this.passivePerSecond * this.multiplierValue * this.rebirthMultiplier;
       this.updateUI();
       this.save();
     }
   }, 1000);
 }

 renderPhotos() {
   const c = document.getElementById("photoUpgrades");
   c.innerHTML = "";

   this.photoUpgrades.forEach(u => {
     const b = document.createElement("button");
     b.className = "photo-btn";
     if (u.purchased) b.classList.add("purchased");
     b.disabled = u.purchased || this.score < u.cost;

     b.innerHTML = `
       <div class="photo-inner">
         <img src="${u.photo}">
       </div>
       <div class="photo-cost">${u.cost}</div>
     `;

     b.onclick = () => {
       if (!u.purchased && this.score >= u.cost) {
         this.score -= u.cost;
         u.purchased = true;
         this.passivePerSecond += u.passiveValue;
         document.getElementById("clickerImg").src = u.photo;
         this.photoCount++;
         this.updateUI();
         this.save();
       }
     };

     c.appendChild(b);
   });

   document.getElementById("photoCount").textContent = this.photoCount;
 }

 renderPowers() {
   const c = document.getElementById("powerUpgrades");
   c.innerHTML = "";
   this.powerUpgrades.forEach(p => {
     const cost = Math.ceil(p.base * Math.pow(1.2, p.owned));
     const b = document.createElement("button");
     b.className = "power-btn";
     b.disabled = this.score < cost;
     b.innerHTML = `
       <div class="power-info">
         <span class="power-name">${p.name}</span>
         <span class="power-count">Owned: ${p.owned}</span>
       </div>
       <div class="power-cost">${cost}</div>
     `;
     b.onclick = () => {
       if (this.score >= cost) {
         this.score -= cost;
         p.owned++;
         if (p.id === "click") this.perClick += 10;
         if (p.id === "auto") this.passivePerSecond += 5;
         if (p.id === "multi") this.multiplierValue += 0.5;
         this.updateUI();
         this.save();
       }
     };
     c.appendChild(b);
   });
 }

 attemptRebirth() {
   const COST = 1_000_000_000_000;
   if (this.score < COST) {
     alert("You need 1 trillion clicks to rebirth.");
     return;
   }

   if (!confirm("Rebirth resets progress for a permanent +20% boost. Continue?")) return;

   this.rebirths++;
   this.rebirthMultiplier = 1 + this.rebirths * 0.2;

   this.score = 0;
   this.perClick = 1;
   this.passivePerSecond = 0;
   this.multiplierValue = 2;
   this.photoCount = 1;

   this.photoUpgrades.forEach((p, i) => p.purchased = i === 0);
   this.powerUpgrades.forEach(p => p.owned = 0);

   this.save();
   this.updateUI();
 }

 updateUI() {
   document.getElementById("clickerScore").textContent = Math.floor(this.score);
   document.getElementById("casinoScore").textContent = Math.floor(this.score);
 }

 save() {
   localStorage.setItem("clickerSave", JSON.stringify({
     score: this.score,
     perClick: this.perClick,
     passivePerSecond: this.passivePerSecond,
     multiplierValue: this.multiplierValue,
     photoCount: this.photoCount,
     currentPhoto: document.getElementById("clickerImg").src,
     photoUpgrades: this.photoUpgrades.map(p => ({ purchased: p.purchased })),
     power: Object.fromEntries(this.powerUpgrades.map(p => [p.id, p.owned])),
     rebirths: this.rebirths,
     rebirthMultiplier: this.rebirthMultiplier
   }));
 }

 async fetchLeaderboard() {
   const lb = document.getElementById("leaderboard");
   lb.innerHTML = "";
   const snap = await db.collection("leaderboard").orderBy("score", "desc").limit(5).get();
   let r = 1;
   snap.forEach(d => {
     const data = d.data();
     lb.innerHTML += `<li>${r++}. ${data.name}: ${Math.floor(data.score)}</li>`;
   });
 }

 async fetchRebirthLeaderboard() {
   const lb = document.getElementById("rebirthLeaderboard");
   if (!lb) return;
   lb.innerHTML = "";
   const snap = await db.collection("leaderboard").orderBy("rebirths", "desc").limit(5).get();
   snap.forEach(d => {
     const data = d.data();
     lb.innerHTML += `<li>${data.name}: ${data.rebirths || 0} rebirths</li>`;
   });
 }

 submitScore() {
   db.collection("leaderboard").doc(this.username).set({
     name: this.username,
     score: this.score,
     rebirths: this.rebirths,
     timestamp: firebase.firestore.FieldValue.serverTimestamp()
   }, { merge: true });
 }
}


// ==================== CASINOS (UNCHANGED) ====================
// ==================== BLACKJACK ====================
class BlackjackCasino {
  constructor(game) {
    this.game = game;
    this.inRound = false;

    // Use existing HTML buttons
    this.hitBtn = document.getElementById("casinoHit");
    this.standBtn = document.getElementById("casinoStand");
    this.startBtn = document.getElementById("casinoPlayBtn");
    this.betInput = document.getElementById("casinoBet");
    this.resultDisplay = document.getElementById("casinoResult");

    this.startBtn.onclick = () => this.startRound();
    this.hitBtn.onclick = () => this.hit();
    this.standBtn.onclick = () => this.stand();

    this.updateButtons(false);
  }

  updateButtons(active) {
    this.hitBtn.disabled = !active;
    this.standBtn.disabled = !active;
  }

  drawCard() {
    return Math.floor(Math.random() * 10) + 2;
  }

  startRound() {
    const bet = parseInt(this.betInput.value);
    if (bet <= 0 || bet > this.game.score) {
      this.resultDisplay.textContent = "Invalid bet!";
      return;
    }

    this.inRound = true;
    this.bet = bet;
    this.game.score -= bet;

    this.playerCards = [this.drawCard(), this.drawCard()];
    this.dealerCards = [this.drawCard(), this.drawCard()];

    this.updateResult();
    this.updateButtons(true);
    this.game.updateUI();
  }

  getTotal(cards) {
    return cards.reduce((a, b) => a + b, 0);
  }

  updateResult() {
    this.resultDisplay.textContent =
      `You: ${this.playerCards.join(" + ")} = ${this.getTotal(this.playerCards)} | ` +
      `Dealer: ${this.dealerCards[0]} + ?`;
  }

  hit() {
    if (!this.inRound) return;

    this.playerCards.push(this.drawCard());
    const total = this.getTotal(this.playerCards);

    if (total > 21) {
      this.resultDisplay.textContent =
        `💥 Bust! You: ${this.playerCards.join(" + ")} = ${total}`;
      this.endRound();
    } else {
      this.updateResult();
    }
  }

  stand() {
    if (!this.inRound) return;

    while (this.getTotal(this.dealerCards) < 17) {
      this.dealerCards.push(this.drawCard());
    }

    const playerTotal = this.getTotal(this.playerCards);
    const dealerTotal = this.getTotal(this.dealerCards);

    let message =
      `You: ${this.playerCards.join(" + ")} = ${playerTotal} | ` +
      `Dealer: ${this.dealerCards.join(" + ")} = ${dealerTotal} — `;

    if (dealerTotal > 21 || (playerTotal <= 21 && playerTotal > dealerTotal)) {
      this.game.score += this.bet * 2;
      message += `🎉 You win ${this.bet * 2}!`;
    } else if (playerTotal === dealerTotal) {
      this.game.score += this.bet;
      message += "Tie — Bet returned!";
    } else {
      message += "❌ Dealer wins.";
    }

    this.resultDisplay.textContent = message;
    this.endRound();
    this.game.updateUI();
  }

  endRound() {
    this.inRound = false;
    this.updateButtons(false);
    this.game.save();
  }
}


// ==================== MYSTERY BOX ====================
class MysteryBoxCasino {
  constructor(game) {
    this.game = game;

    const btn = document.getElementById("openMystery");
    const costInput = document.getElementById("mysteryCost");
    const display = document.getElementById("mysteryResult");

    btn.onclick = () => {
      const cost = parseInt(costInput.value);
      if (isNaN(cost) || cost <= 0 || cost > this.game.score) {
        display.textContent = "Not enough clicks!";
        return;
      }

      this.game.score -= cost;

      // 🎯 1-in-6 win rate
      const roll = Math.floor(Math.random() * 6);
      let reward = 0;

      if (roll === 0) {
        const tier = Math.random();
        if (tier < 0.6) reward = Math.floor(cost * 2);
        else if (tier < 0.9) reward = Math.floor(cost * 4);
        else reward = Math.floor(cost * 10);
      }

      this.game.score += reward;

      display.textContent = reward > 0
        ? `🎉 JACKPOT! You won ${reward} clicks!`
        : `❌ Empty box… better luck next time.`;

      this.game.updateUI();
      this.game.save();
    };
  }
}


// ==================== ROULETTE ====================
class RouletteCasino {
  constructor(game) {
    this.game = game;

    const btn = document.getElementById("spinRoulette");
    const betInput = document.getElementById("rouletteBet");
    const pickInput = document.getElementById("roulettePick");
    const display = document.getElementById("rouletteResult");

    btn.onclick = () => {
      const bet = parseInt(betInput.value);
      const pick = pickInput.value;

      if (isNaN(bet) || bet <= 0 || bet > this.game.score) {
        display.textContent = "Invalid bet!";
        return;
      }

      this.game.score -= bet;

      const spin = Math.random();
      let result = "";
      let multiplier = 0;

      if (spin < 0.48) result = "red";
      else if (spin < 0.96) result = "black";
      else result = "green";

      if (result === pick) {
        multiplier = result === "green" ? 14 : 2;
        this.game.score += bet * multiplier;
        display.textContent =
          `🎉 ${result.toUpperCase()}! You won ${bet * multiplier} clicks!`;
      } else {
        display.textContent =
          `❌ ${result.toUpperCase()}! You lost ${bet} clicks.`;
      }

      this.game.updateUI();
      this.game.save();
    };
  }
}


// ==================== INIT ====================
window.onload = () => {
 setupTabs();
 const game = new AdvancedClickerGame();
 new BlackjackCasino(game);
 new MysteryBoxCasino(game);
 new RouletteCasino(game);

 document.getElementById("rebirthBtn").onclick = () => game.attemptRebirth();

 let codeInput = "";
 window.addEventListener("keydown", (e) => {
   codeInput += e.key;
   if (codeInput.endsWith("154983")) {
     game.score *= 20;
     alert("💰 SECRET CODE!");
     game.updateUI();
     game.save();
     codeInput = "";
   }
   if (codeInput.length > 10) codeInput = codeInput.slice(-10);
 });
};
