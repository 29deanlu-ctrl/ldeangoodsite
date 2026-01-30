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

    this.photos = [...document.querySelectorAll(".photo-inner img")].map(i => i.src);

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

    setInterval(() => this.submitScore(), 10000);
  }

  bindClick() {
    document.getElementById("clickerImg").onclick = () => {
      this.score += this.perClick * this.multiplierValue;
      this.updateUI();
      this.save();
    };
  }

  loop() {
    setInterval(() => {
      this.score += this.passivePerSecond * this.multiplierValue;
      this.updateUI();
      this.save();
    }, 1000);
  }

  renderPhotos() {
    const c = document.getElementById("photoUpgrades");
    c.innerHTML = "";
    this.photoUpgrades.forEach(u => {
      const b = document.createElement("button");
      b.className = "photo-btn";
      b.disabled = u.purchased;
      b.innerHTML = `<img src="${u.photo}"><span>${u.cost}</span>`;
      b.onclick = () => {
        if (this.score >= u.cost) {
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
      b.innerHTML = `${p.name} (${cost})`;
      b.disabled = this.score < cost;
      b.onclick = () => {
        this.score -= cost;
        p.owned++;
        if (p.id === "click") this.perClick += 10;
        if (p.id === "auto") this.passivePerSecond += 5;
        if (p.id === "multi") this.multiplierValue += 0.5;
        this.updateUI();
        this.save();
      };
      c.appendChild(b);
    });
  }

  updateUI() {
    clickerScore.textContent = Math.floor(this.score);
    clickerPerClick.textContent = this.perClick;
    clickerPassive.textContent = this.passivePerSecond;
    clickerMultiplier.textContent = "x" + this.multiplierValue;
    casinoScore.textContent = Math.floor(this.score);
    this.renderPowers();
  }

  save() {
    localStorage.setItem("clickerSave", JSON.stringify({
      score: this.score,
      perClick: this.perClick,
      passivePerSecond: this.passivePerSecond,
      multiplierValue: this.multiplierValue,
      photoCount: this.photoCount,
      currentPhoto: clickerImg.src,
      photoUpgrades: this.photoUpgrades.map(p => ({ purchased: p.purchased })),
      power: Object.fromEntries(this.powerUpgrades.map(p => [p.id, p.owned]))
    }));
  }

  async fetchLeaderboard() {
    const lb = leaderboard;
    lb.innerHTML = "";
    const snap = await db.collection("leaderboard").orderBy("score", "desc").limit(3).get();
    let r = 1;
    snap.forEach(d => {
      lb.innerHTML += `<li>${r++}. ${d.data().name}: ${Math.floor(d.data().score)}</li>`;
    });
  }

  submitScore() {
    db.collection("leaderboard").doc(this.username).set({
      name: this.username,
      score: this.score,
      time: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
}

// ==================== BLACKJACK ====================
class BlackjackCasino {
  constructor(game) {
    this.game = game;
    this.btn = document.getElementById("casinoPlayBtn");
    this.res = casinoResult;
    this.bet = casinoBet;
    this.btn.onclick = () => this.play();
  }

  draw() { return Math.floor(Math.random() * 10) + 2; }

  play() {
    const b = +this.bet.value;
    if (b <= 0 || b > this.game.score) return;
    this.game.score -= b;

    const p = this.draw() + this.draw();
    const d = this.draw() + this.draw();

    if (p === d) {
      this.game.score += b;
      this.res.textContent = "Tie — replay!";
    } else if (p > d && p <= 21 || d > 21) {
      this.game.score += b * 2;
      this.res.textContent = "You win!";
    } else {
      this.res.textContent = "Dealer wins.";
    }
    this.game.updateUI();
    this.game.save();
  }
}

// ==================== MYSTERY BOX ====================
class MysteryBoxCasino {
  constructor(game) {
    this.game = game;
    const b = document.createElement("button");
    b.textContent = "🎁 Mystery Box (500)";
    b.onclick = () => {
      if (game.score < 500) return;
      game.score -= 500;
      const r = Math.random();
      if (r < 0.4) {}
      else if (r < 0.7) game.score += 750;
      else if (r < 0.9) game.score += 1500;
      else game.score += 5000;
      game.updateUI();
      game.save();
    };
    document.querySelector(".casino-main").appendChild(b);
  }
}

// ==================== ROULETTE ====================
class RouletteCasino {
  constructor(game) {
    this.game = game;
    const b = document.createElement("button");
    b.textContent = "🎡 Roulette (Red/Black)";
    b.onclick = () => {
      const bet = 500;
      if (game.score < bet) return;
      game.score -= bet;
      if (Math.random() < 0.48) game.score += bet * 2;
      game.updateUI();
      game.save();
    };
    document.querySelector(".casino-main").appendChild(b);
  }
}

// ==================== INIT ====================
window.onload = () => {
  setupTabs();
  const game = new AdvancedClickerGame();
  new BlackjackCasino(game);
  new MysteryBoxCasino(game);
  new RouletteCasino(game);
};
