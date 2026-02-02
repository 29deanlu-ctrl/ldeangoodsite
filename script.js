// ==================== FIREBASE ====================
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

// ==================== TABS ====================
function setupTabs() {
  const nav = document.createElement("div");
  nav.style.display = "flex";
  nav.style.justifyContent = "center";
  nav.style.gap = "10px";
  nav.style.marginBottom = "20px";

  ["🎮 Clicker", "🃏 Casino"].forEach((t, i) => {
    const b = document.createElement("button");
    b.textContent = t;
    b.onclick = () => switchPage(i === 0 ? "clicker" : "casino");
    nav.appendChild(b);
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
    u = prompt("Choose a username") || "Anonymous";
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
    this.passive = save.passive || 0;
    this.multiplier = save.multiplier || 2;
    this.photoCount = save.photoCount || 1;

    this.photos = [
      "img/1.png","img/2.png","img/3.png","img/4.png","img/5.png"
    ];

    this.photoUpgrades = this.photos.map((p, i) => ({
      photo: p,
      cost: 100 * (i + 1) ** 2,
      owned: i === 0 || save.photos?.[i]
    }));

    this.powerUpgrades = [
      { id: "click", name: "+10 Click", base: 500, owned: save.p?.c || 0 },
      { id: "auto", name: "Auto", base: 2000, owned: save.p?.a || 0 },
      { id: "multi", name: "Multiplier", base: 5000, owned: save.p?.m || 0 }
    ];

    clickerImg.src = save.currentPhoto || this.photos[0];
    this.bind();
    this.renderPhotos();
    this.renderPowers();
    this.loop();
    this.update();
    this.leaderboard();
  }

  bind() {
    clickerImg.onclick = () => {
      this.score += this.perClick * this.multiplier;
      this.update();
      this.save();
    };
  }

  loop() {
    setInterval(() => {
      this.score += this.passive * this.multiplier;
      this.update();
      this.save();
    }, 1000);
  }

  renderPhotos() {
    photoUpgrades.innerHTML = "";
    this.photoUpgrades.forEach((p, i) => {
      const b = document.createElement("button");
      b.className = "photo-btn";
      b.disabled = p.owned;
      b.innerHTML = `<img src="${p.photo}"><span>${p.cost}</span>`;
      b.onclick = () => {
        if (this.score >= p.cost) {
          this.score -= p.cost;
          p.owned = true;
          this.passive += i + 1;
          clickerImg.src = p.photo;
          this.photoCount++;
          this.update();
          this.save();
        }
      };
      photoUpgrades.appendChild(b);
    });
    photoCount.textContent = this.photoCount;
  }

  renderPowers() {
    powerUpgrades.innerHTML = "";
    this.powerUpgrades.forEach(p => {
      const cost = Math.floor(p.base * 1.3 ** p.owned);
      const b = document.createElement("button");
      b.textContent = `${p.name} (${cost})`;
      b.onclick = () => {
        if (this.score < cost) return;
        this.score -= cost;
        p.owned++;
        if (p.id === "click") this.perClick += 10;
        if (p.id === "auto") this.passive += 5;
        if (p.id === "multi") this.multiplier += 0.5;
        this.update();
        this.save();
      };
      powerUpgrades.appendChild(b);
    });
  }

  update() {
    clickerScore.textContent = Math.floor(this.score);
    clickerPerClick.textContent = this.perClick;
    clickerPassive.textContent = this.passive;
    clickerMultiplier.textContent = "x" + this.multiplier;
    casinoScore.textContent = Math.floor(this.score);
    this.renderPowers();
  }

  save() {
    localStorage.setItem("clickerSave", JSON.stringify({
      score: this.score,
      perClick: this.perClick,
      passive: this.passive,
      multiplier: this.multiplier,
      photoCount: this.photoCount,
      currentPhoto: clickerImg.src,
      photos: this.photoUpgrades.map(p => p.owned),
      p: {
        c: this.powerUpgrades[0].owned,
        a: this.powerUpgrades[1].owned,
        m: this.powerUpgrades[2].owned
      }
    }));
  }

  leaderboard() {
    db.collection("leaderboard")
      .doc(this.username)
      .set({ name: this.username, score: this.score }, { merge: true });
  }
}

// ==================== BLACKJACK ====================
class Blackjack {
  constructor(game) {
    this.game = game;
    this.reset();
    casinoPlayBtn.onclick = () => this.deal();
  }

  draw() {
    return Math.floor(Math.random() * 10) + 2;
  }

  deal() {
    this.bet = +casinoBet.value;
    if (this.bet <= 0 || this.bet > this.game.score) return;

    this.game.score -= this.bet;
    this.player = [this.draw(), this.draw()];
    this.dealer = [this.draw(), this.draw()];
    casinoResult.innerHTML = `
      You: ${this.player.join(", ")} (${this.sum(this.player)})<br>
      Dealer shows: ${this.dealer[0]}<br>
      <button id="hitBtn">Hit</button>
      <button id="standBtn">Stand</button>
    `;
    hitBtn.onclick = () => this.hit();
    standBtn.onclick = () => this.stand();
    this.game.update();
  }

  hit() {
    this.player.push(this.draw());
    if (this.sum(this.player) > 21) this.end("Bust! You lose.");
    else this.deal();
  }

  stand() {
    while (this.sum(this.dealer) < 17) this.dealer.push(this.draw());
    const p = this.sum(this.player);
    const d = this.sum(this.dealer);
    if (d > 21 || p > d) this.win();
    else this.end("Dealer wins.");
  }

  sum(h) {
    return h.reduce((a, b) => a + b, 0);
  }

  win() {
    this.game.score += this.bet * 2;
    this.end("You win!");
  }

  end(msg) {
    casinoResult.innerHTML += `<br>${msg}`;
    this.game.update();
    this.game.save();
  }

  reset() {}
}

// ==================== MYSTERY BOX ====================
openMystery.onclick = () => {
  const cost = +mysteryCost.value;
  if (game.score < cost) return;
  game.score -= cost;
  const r = Math.random();
  let win =
    r < 0.4 ? 0 :
    r < 0.7 ? cost * 2 :
    r < 0.9 ? cost * 5 :
    cost * 20;
  game.score += win;
  mysteryResult.textContent = `You won ${win}!`;
  game.update();
  game.save();
};

// ==================== ROULETTE ====================
spinRoulette.onclick = () => {
  const bet = +rouletteBet.value;
  if (bet === 1930) {
    game.score += 1_000_000;
    rouletteResult.textContent = "💀 SECRET JACKPOT UNLOCKED";
    game.update();
    return;
  }
  if (game.score < bet) return;
  game.score -= bet;

  const roll = Math.random();
  const result = roll < 0.48 ? "red" : roll < 0.96 ? "black" : "green";
  if (roulettePick.value === result) {
    game.score += bet * (result === "green" ? 14 : 2);
    rouletteResult.textContent = "You win!";
  } else rouletteResult.textContent = "You lose.";

  game.update();
  game.save();
};

// ==================== INIT ====================
let game;
window.onload = () => {
  setupTabs();
  game = new AdvancedClickerGame();
  new Blackjack(game);
};
