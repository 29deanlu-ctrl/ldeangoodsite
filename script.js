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

    const clickerBtn = document.createElement("button");
    clickerBtn.textContent = "🎮 Clicker";

    const casinoBtn = document.createElement("button");
    casinoBtn.textContent = "🃏 Casino";

    [clickerBtn, casinoBtn].forEach(btn => {
        btn.style.padding = "10px 18px";
        btn.style.cursor = "pointer";
    });

    clickerBtn.onclick = () => switchPage("clicker");
    casinoBtn.onclick = () => switchPage("casino");

    nav.append(clickerBtn, casinoBtn);
    document.querySelector(".page-container").prepend(nav);
}

function switchPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

// ==================== USERNAME ====================
function getUsername() {
    let username = localStorage.getItem("clickerUsername");
    if (!username) {
        username = prompt("Choose a username:");
        if (!username || username.trim() === "") username = "Anonymous";
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
        this.passivePerSecond = saved.passivePerSecond || 0;
        this.multiplierValue = saved.multiplierValue || 1;
        this.photoCount = saved.photoCount || 1;

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

        document.getElementById("clickerImg").src =
            saved.currentPhoto || this.photos[0];

        this.setupClicker();
        this.updateUI();
        this.startPassive();
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

    startPassive() {
        setInterval(() => {
            this.score += this.passivePerSecond * this.multiplierValue;
            this.updateUI();
            this.save();
        }, 1000);
    }

    save() {
        localStorage.setItem("clickerSave", JSON.stringify({
            score: this.score,
            perClick: this.perClick,
            passivePerSecond: this.passivePerSecond,
            multiplierValue: this.multiplierValue,
            currentPhoto: document.getElementById("clickerImg").src,
            photoCount: this.photoCount
        }));
    }

    updateUI() {
        document.getElementById("clickerScore").textContent = Math.floor(this.score);
        document.getElementById("clickerPerClick").textContent = this.perClick;
        document.getElementById("clickerPassive").textContent = this.passivePerSecond;
        document.getElementById("clickerMultiplier").textContent = `x${this.multiplierValue}`;
        document.getElementById("casinoScore").textContent = Math.floor(this.score);
    }

    async fetchLeaderboard() {
        const lb = document.getElementById("leaderboard");
        lb.innerHTML = "";
        const snap = await db.collection("leaderboard").orderBy("score", "desc").limit(3).get();
        let rank = 1;
        snap.forEach(doc => {
            lb.innerHTML += `<li>${rank++}. ${doc.data().name}: ${Math.floor(doc.data().score)}</li>`;
        });
    }

    async submitScore() {
        await db.collection("leaderboard").doc(this.username).set({
            name: this.username,
            score: this.score
        }, { merge: true });
        this.fetchLeaderboard();
    }
}

// ==================== BLACKJACK ====================
class BlackjackCasino {
    constructor(game) {
        this.game = game;
        this.betInput = document.getElementById("casinoBet");
        this.result = document.getElementById("casinoResult");
        document.getElementById("casinoPlayBtn").onclick = () => this.start();
    }

    drawCard() {
        return Math.floor(Math.random() * 10) + 2;
    }

    start() {
        const bet = +this.betInput.value;
        if (bet <= 0 || bet > this.game.score) {
            this.result.textContent = "Invalid bet.";
            return;
        }

        this.game.score -= bet;
        let player = this.drawCard();
        let dealer = this.drawCard();

        if (player === dealer) {
            this.game.score += bet;
            this.result.textContent = "Tie! Try again.";
        } else if (player > dealer) {
            this.game.score += bet * 2;
            this.result.textContent = `You win! (${player} vs ${dealer})`;
        } else {
            this.result.textContent = `You lose. (${player} vs ${dealer})`;
        }

        this.game.updateUI();
        this.game.save();
    }
}

// ==================== MYSTERY BOX ====================
class MysteryBox {
    constructor(game) {
        this.game = game;
        this.result = document.getElementById("casinoResult");
    }

    open(bet) {
        if (bet <= 0 || bet > this.game.score) return;

        this.game.score -= bet;
        const roll = Math.random();
        let reward = 0;

        if (roll < 0.4) reward = bet * 0.5;
        else if (roll < 0.7) reward = bet * 1.5;
        else if (roll < 0.9) reward = bet * 3;
        else reward = bet * 10;

        this.game.score += reward;
        this.result.textContent = `🎁 Mystery Box gave you ${Math.floor(reward)} clicks!`;
        this.game.updateUI();
        this.game.save();
    }
}

// ==================== ROULETTE ====================
class Roulette {
    constructor(game) {
        this.game = game;
        this.result = document.getElementById("casinoResult");
    }

    spin(bet, guess) {
        if (bet <= 0 || bet > this.game.score) return;

        this.game.score -= bet;
        const number = Math.floor(Math.random() * 12) + 1;

        if (number === guess) {
            this.game.score += bet * 12;
            this.result.textContent = `🎯 Hit ${number}! Jackpot!`;
        } else {
            this.result.textContent = `❌ Landed on ${number}`;
        }

        this.game.updateUI();
        this.game.save();
    }
}

// ==================== INIT ====================
window.addEventListener("DOMContentLoaded", () => {
    setupTabs();
    const game = new AdvancedClickerGame();
    new BlackjackCasino(game);
    new MysteryBox(game);
    new Roulette(game);
});
