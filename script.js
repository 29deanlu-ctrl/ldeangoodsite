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

    this.rebirths = save.rebirths || 0;
    this.rebirthBonus = 1 + this.rebirths * 0.1;

    this.score = save.score || 0;
    this.perClick = save.perClick || 1;
    this.passivePerSecond = save.passivePerSecond || 0;
    this.multiplierValue = save.multiplierValue || 2;
    this.photoCount = save.photoCount || 1;

    this.photos = Array.from({ length: 20 }, (_, i) => `images/${i + 1}.png`);

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

    document.getElementById("rebirthBtn").onclick = () => this.rebirth();

    this.bindClick();
    this.renderPhotos();
    this.renderPowers();
    this.loop();
    this.updateUI();
    this.fetchLeaderboards();

    setInterval(() => this.submitScores(), 10000);
  }

  bindClick() {
    document.getElementById("clickerImg").onclick = () => {
      this.score += this.perClick * this.multiplierValue * this.rebirthBonus;
      this.updateUI();
      this.save();
    };
  }

  loop() {
    setInterval(() => {
      this.score += this.passivePerSecond * this.multiplierValue * this.rebirthBonus;
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
      if (u.purchased) b.classList.add("purchased");
      b.disabled = u.purchased;
      b.innerHTML = `<div class="photo-inner"><img src="${u.photo}"></div><div class="photo-cost">${u.cost}</div>`;
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
      b.disabled = this.score < cost;
      b.innerHTML = `<div class="power-info"><span>${p.name}</span><span>Owned: ${p.owned}</span></div><div class="power-cost">${cost}</div>`;
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

  rebirth() {
    if (!confirm("Rebirth resets everything but gives +10% permanently. Continue?")) return;
    this.rebirths++;
    localStorage.removeItem("clickerSave");
    localStorage.setItem("clickerSave", JSON.stringify({ rebirths: this.rebirths }));
    location.reload();
  }

  updateUI() {
    document.getElementById("clickerScore").textContent = Math.floor(this.score);
    document.getElementById("casinoScore").textContent = Math.floor(this.score);
    document.getElementById("rebirthCount").textContent = this.rebirths;
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
      rebirths: this.rebirths
    }));
  }

  async fetchLeaderboards() {
    const rb = document.getElementById("rebirthLeaderboard");
    rb.innerHTML = "";
    const snap = await db.collection("rebirths").orderBy("rebirths", "desc").limit(5).get();
    snap.forEach(d => rb.innerHTML += `<li>${d.data().name}: ${d.data().rebirths}</li>`);
  }

  submitScores() {
    db.collection("rebirths").doc(this.username).set({
      name: this.username,
      rebirths: this.rebirths
    }, { merge: true });
  }
}

// ==================== MYSTERY BOX ====================
class MysteryBoxCasino {
  constructor(game) {
    const btn = document.getElementById("openMystery");
    const costInput = document.getElementById("mysteryCost");
    const display = document.getElementById("mysteryResult");

    btn.onclick = () => {
      const cost = +costInput.value;
      if (cost <= 0 || cost > game.score) return;
      game.score -= cost;
      const r = Math.random();
      let reward = 0;

      if (r < 0.5) reward = -cost;
      else if (r < 0.75) reward = -Math.floor(cost * 0.5);
      else if (r < 0.9) reward = Math.floor(cost * 1.2);
      else if (r < 0.98) reward = cost * 3;
      else reward = cost * 10;

      game.score += reward;
      display.textContent = reward >= 0 ? `🎉 You won ${reward}` : `💀 Lost ${Math.abs(reward)}`;
      game.updateUI();
      game.save();
    };
  }
}

// ==================== ROULETTE ====================
class RouletteCasino {
  constructor(game) {
    document.getElementById("spinRoulette").onclick = () => {
      const bet = +rouletteBet.value;
      if (bet === 1930) {
        game.score += 1_000_000;
        rouletteResult.textContent = "💰 SECRET JACKPOT! +1,000,000";
        game.updateUI();
        game.save();
        return;
      }
      game.score -= bet;
      game.updateUI();
      game.save();
    };
  }
}

// ==================== INIT ====================
window.onload = () => {
  setupTabs();
  const game = new AdvancedClickerGame();
  new MysteryBoxCasino(game);
  new RouletteCasino(game);
};
