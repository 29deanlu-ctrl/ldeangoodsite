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
        username = prompt("Choose a username for the leaderboard:");
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
        
        // Reset broken saves once
        if (!saved.photoUpgrades) localStorage.removeItem("clickerSave");

        this.score = saved.score || 0;
        this.perClick = saved.perClick || 1;
        this.passivePerSecond = saved.passivePerSecond || 0;
        this.photoCount = saved.photoCount ?? 1;
        this.multiplierValue = 2;

        // ===== PHOTOS =====
        const normalPhotos = Array.from({ length: 20 }, (_, i) =>
            `images/photo_${i + 1}.png`
        );
        this.photos = [...normalPhotos, "images/final.jpeg"];

        this.photoUpgrades = this.photos.map((photo, index) => ({
            index,
            photo,
            cost: Math.ceil(Math.pow(2.1, index) * 100),
            purchased: saved.photoUpgrades?.[index]?.purchased || index === 0,
            passiveValue: index,
            name: index === this.photos.length - 1 ? "Final Photo 👑" : `Photo #${index + 1}`
        }));

        // Set the displayed image to the first purchased photo
        const firstUnlocked = this.photoUpgrades.find(p => p.purchased);
        document.getElementById("clickerImg").src = firstUnlocked.photo;

        this.powerUpgrades = [
            { id: "clickPower", name: "+10 Per Click", cost: 500, purchased: saved.powerUpgrades?.clickPower || 0, costMultiplier: 1.15 },
            { id: "autoClicker", name: "Auto-Clicker Bot", cost: 2000, purchased: saved.powerUpgrades?.autoClicker || 0, costMultiplier: 1.2 }
        ];

        this.setupEventListeners();
        this.initializePhotoUpgrades();
        this.initializePowerUpgrades();
        this.updateUI();
        this.startGameLoop();
        this.fetchLeaderboard();

        setInterval(() => this.submitScore(), 10000);
    }

    saveGame() {
        localStorage.setItem("clickerSave", JSON.stringify({
            score: this.score,
            perClick: this.perClick,
            passivePerSecond: this.passivePerSecond,
            photoCount: this.photoCount,
            currentPhoto: document.getElementById("clickerImg").src,
            photoUpgrades: this.photoUpgrades.map(u => ({ purchased: u.purchased })),
            powerUpgrades: Object.fromEntries(this.powerUpgrades.map(u => [u.id, u.purchased]))
        }));
    }

    setupEventListeners() {
        document.getElementById("clickerImg").addEventListener("click", () => {
            this.score += this.perClick * this.multiplierValue;
            this.updateUI();
            this.saveGame();
        });
    }

    startGameLoop() {
        setInterval(() => {
            this.score += this.passivePerSecond;
            this.updateUI();
            this.saveGame();
        }, 1000);
    }

    unlockPhoto(index) {
        const upg = this.photoUpgrades[index];
        if (this.score >= upg.cost && !upg.purchased) {
            this.score -= upg.cost;
            upg.purchased = true;
            this.photoCount++;
            this.passivePerSecond += upg.passiveValue;
            document.getElementById("clickerImg").src = upg.photo;

            this.initializePhotoUpgrades(); // refresh buttons
            this.updateUI();
            this.saveGame();
        }
    }

    initializePhotoUpgrades() {
        const container = document.getElementById("photoUpgrades");
        container.innerHTML = "";

        this.photoUpgrades.forEach(u => {
            const btn = document.createElement("button");
            btn.className = "photo-btn";
            btn.disabled = u.purchased;
            if (u.purchased) btn.classList.add("purchased");

            btn.innerHTML = `
                <div class="photo-inner">
                    <img src="${u.photo}">
                </div>
                <div class="photo-cost">${u.cost}</div>
            `;

            btn.onclick = () => this.unlockPhoto(u.index);
            container.appendChild(btn);
        });

        document.getElementById("photoCount").textContent = this.photoCount;
    }

    initializePowerUpgrades() {
        const container = document.getElementById("powerUpgrades");
        container.innerHTML = "";

        this.powerUpgrades.forEach(u => {
            const cost = Math.ceil(u.cost * Math.pow(u.costMultiplier, u.purchased));
            const btn = document.createElement("button");
            btn.className = "power-btn";
            btn.disabled = this.score < cost;

            btn.innerHTML = `
                <div class="power-info">
                    <span class="power-name">${u.name}</span>
                    <span class="power-count">Owned: ${u.purchased}</span>
                </div>
                <div class="power-cost">${cost}</div>
            `;

            btn.onclick = () => {
                if (this.score >= cost) {
                    this.score -= cost;
                    u.purchased++;
                    if (u.id === "clickPower") this.perClick += 10;
                    if (u.id === "autoClicker") this.passivePerSecond += 5;
                    this.updateUI();
                    this.saveGame();
                }
            };

            container.appendChild(btn);
        });
    }

    updateUI() {
        document.getElementById("clickerScore").textContent = Math.floor(this.score);
        document.getElementById("clickerPerClick").textContent = this.perClick;
        document.getElementById("clickerPassive").textContent = this.passivePerSecond;
        document.getElementById("clickerMultiplier").textContent = `x${this.multiplierValue}`;
        this.initializePowerUpgrades();
    }

    async fetchLeaderboard() {
        const lb = document.getElementById("leaderboard");
        lb.innerHTML = "";

        const snap = await db.collection("leaderboard")
            .orderBy("score", "desc")
            .limit(3)
            .get();

        let rank = 1;
        snap.forEach(doc => {
            const d = doc.data();
            const li = document.createElement("li");
            li.textContent = `${rank}. ${d.name}: ${Math.floor(d.score)}`;
            lb.appendChild(li);
            rank++;
        });
    }

    async submitScore() {
        await db.collection("leaderboard").doc(this.username).set({
            name: this.username,
            score: Math.floor(this.score),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }
}

// ==================== BLACKJACK (REAL GAME) ====================
class BlackjackCasino {
    constructor(game) {
        this.game = game;
        this.reset();
        this.updateCasinoUI();
        document.getElementById("casinoPlayBtn").onclick = () => this.hit();
    }

    reset() {
        this.player = this.draw() + this.draw();
        this.dealer = this.draw();
        document.getElementById("casinoResult").textContent =
            `You: ${this.player} | Dealer: ${this.dealer}`;
    }

    draw() {
        return Math.min(10, Math.floor(Math.random() * 13) + 1);
    }

    updateCasinoUI() {
        document.getElementById("casinoScore").textContent = Math.floor(this.game.score);
    }

    hit() {
        const bet = parseInt(document.getElementById("casinoBet").value);
        if (bet > this.game.score || bet <= 0) return;

        this.player += this.draw();

        if (this.player > 21) {
            this.game.score -= bet;
            document.getElementById("casinoResult").textContent = "💥 Bust!";
            this.reset();
        } else if (this.player >= 21 || this.player > this.dealer) {
            this.game.score += bet;
            document.getElementById("casinoResult").textContent = "🎉 You win!";
            this.reset();
        } else {
            document.getElementById("casinoResult").textContent =
                `You: ${this.player} | Dealer: ${this.dealer}`;
        }

        this.game.updateUI();
        this.updateCasinoUI();
        this.game.saveGame();
    }
}

// ==================== TAB SWITCHING ====================
function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

document.addEventListener("keydown", e => {
    if (e.key === "1") showPage("clicker");
    if (e.key === "2") showPage("casino");
});

// ==================== INIT ====================
window.addEventListener("DOMContentLoaded", () => {
    const game = new AdvancedClickerGame();
    new BlackjackCasino(game);
});
