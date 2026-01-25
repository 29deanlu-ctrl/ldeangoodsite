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

// ==================== USERNAME ====================
function getUsername() {
  let username = localStorage.getItem("clickerUsername");
  if (!username) {
    username = prompt("Choose a username:") || "Anonymous";
    localStorage.setItem("clickerUsername", username);
  }
  return username;
}

// ==================== CLICKER GAME ====================
class AdvancedClickerGame {
  constructor() {
    this.username = getUsername();
    const saved = JSON.parse(localStorage.getItem("clickerSave")) || {};

    this.score = saved.score || 0;
    this.perClick = saved.perClick || 1;
    this.passivePerSecond = 0;
    this.multiplierValue = 2;

    this.photos = [...document.querySelectorAll(".photo-btn")].length
      ? []
      : [
          'images/018879bf-19f7-488c-9b8e-b187de3e160d (1).png',
          'images/1fa2f337-ba2b-402e-973a-4cddd7761054.png',
          'images/051dde8f-8d8b-474e-9188-282b5adbf160.png',
          'images/IMG_8714.jpeg'
        ];

    this.photoUpgrades = this.photos.map((photo, index) => ({
      index,
      photo,
      cost: Math.ceil(Math.pow(2.2, index) * 100),
      purchased: saved.photoUpgrades?.[index]?.purchased || index === 0,
      passiveValue: Math.ceil(index * 0.3)
    }));

    // 🔧 FIX: recompute photoCount + passive income
    this.photoCount = 0;
    this.photoUpgrades.forEach(p => {
      if (p.purchased) {
        this.photoCount++;
        this.passivePerSecond += p.passiveValue;
      }
    });

    document.getElementById("clickerImg").src =
      saved.currentPhoto || this.photos[0];

    this.setupClicker();
    this.renderPhotos();
    this.updateUI();
    this.startLoop();
    this.fetchLeaderboard();

    setInterval(() => this.submitScore(), 10000);
  }

  setupClicker() {
    document.getElementById("clickerImg").onclick = () => {
      this.score += this.perClick * this.multiplierValue;
      this.updateUI();
      this.save();
    };
  }

  startLoop() {
    setInterval(() => {
      this.score += this.passivePerSecond;
      this.updateUI();
      this.save();
    }, 1000);
  }

  unlockPhoto(index) {
    const p = this.photoUpgrades[index];
    if (p.purchased || this.score < p.cost) return;

    this.score -= p.cost;
    p.purchased = true;
    this.photoCount++;
    this.passivePerSecond += p.passiveValue;

    document.getElementById("clickerImg").src = p.photo;

    this.renderPhotos();
    this.updateUI();
    this.save();
  }

  renderPhotos() {
    const container = document.getElementById("photoUpgrades");
    container.innerHTML = "";

    this.photoUpgrades.forEach(p => {
      const btn = document.createElement("button");
      btn.className = "photo-btn";
      if (p.purchased) btn.classList.add("purchased");
      btn.disabled = p.purchased;

      btn.innerHTML = `
        <div class="photo-inner">
          <img src="${p.photo}">
        </div>
        <div class="photo-cost">${p.cost}</div>
      `;

      btn.onclick = () => this.unlockPhoto(p.index);
      container.appendChild(btn);
    });

    document.getElementById("photoCount").textContent = this.photoCount;
  }

  updateUI() {
    document.getElementById("clickerScore").textContent = this.score;
    document.getElementById("clickerPerClick").textContent = this.perClick;
    document.getElementById("clickerPassive").textContent = this.passivePerSecond;
    document.getElementById("clickerMultiplier").textContent = `x${this.multiplierValue}`;
    document.getElementById("casinoScore").textContent = this.score;
  }

  save() {
    localStorage.setItem("clickerSave", JSON.stringify({
      score: this.score,
      perClick: this.perClick,
      currentPhoto: document.getElementById("clickerImg").src,
      photoUpgrades: this.photoUpgrades.map(p => ({ purchased: p.purchased }))
    }));
  }

  async fetchLeaderboard() {
    const lb = document.getElementById("leaderboard");
    lb.innerHTML = "";
    const snap = await db.collection("leaderboard").orderBy("score", "desc").limit(3).get();
    let i = 1;
    snap.forEach(doc => {
      const li = document.createElement("li");
      li.textContent = `${i++}. ${doc.data().name}: ${doc.data().score}`;
      lb.appendChild(li);
    });
  }

  async submitScore() {
    await db.collection("leaderboard").doc(this.username).set({
      name: this.username,
      score: this.score
    }, { merge: true });
  }
}

// ==================== REAL BLACKJACK ====================
class BlackjackCasino {
  constructor(game) {
    this.game = game;
    this.result = document.getElementById("casinoResult");
    document.getElementById("casinoPlayBtn").onclick = () => this.play();
  }

  draw() {
    return Math.min(10, Math.floor(Math.random() * 13) + 1);
  }

  play() {
    const bet = +document.getElementById("casinoBet").value;
    if (bet <= 0 || bet > this.game.score) return;

    let player = this.draw() + this.draw();
    let dealer = this.draw() + this.draw();

    while (player < 17) player += this.draw();
    while (dealer < 17) dealer += this.draw();

    this.game.score -= bet;

    let msg;
    if (player > 21) msg = "Bust! You lose.";
    else if (dealer > 21 || player > dealer) {
      this.game.score += bet * 2;
      msg = "You win!";
    } else msg = "Dealer wins.";

    this.result.textContent = `You: ${player} | Dealer: ${dealer} — ${msg}`;
    this.game.updateUI();
    this.game.save();
  }
}

// ==================== INIT ====================
window.addEventListener("DOMContentLoaded", () => {
  const game = new AdvancedClickerGame();
  new BlackjackCasino(game);
});
