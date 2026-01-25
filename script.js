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
        if (!username || username.trim() === "") {
            username = "Anonymous";
        }
        localStorage.setItem("clickerUsername", username);
    }
    return username;
}

// ==================== CLICKER GAME ====================
class AdvancedClickerGame {
    constructor() {
        this.username = getUsername();

        const savedData = JSON.parse(localStorage.getItem("clickerSave")) || {};
        this.score = savedData.score || 0;
        this.perClick = savedData.perClick || 1;
        this.passivePerSecond = savedData.passivePerSecond || 0;
        this.photoCount = savedData.photoCount || 1;
        this.multiplierValue = 2;

        const allPhotos = [
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

        this.photos = allPhotos;
        document.getElementById("clickerImg").src =
            savedData.currentPhoto || this.photos[0];

        this.photoUpgrades = this.photos.map((photo, index) => ({
            index,
            photo,
            cost: Math.ceil(Math.pow(2.2, index) * 100),
            purchased: savedData.photoUpgrades?.[index]?.purchased || index === 0,
            passiveValue: Math.ceil(index * 0.3),
            name: `Photo #${index + 1}`
        }));

        this.powerUpgrades = [
            { id: "clickPower", name: "+10 Per Click", cost: 500, purchased: savedData.powerUpgrades?.clickPower || 0, costMultiplier: 1.15 },
            { id: "autoClicker", name: "Auto-Clicker Bot", cost: 2000, purchased: savedData.powerUpgrades?.autoClicker || 0, costMultiplier: 1.2 },
            { id: "boostMultiplier", name: "Multiplier Boost", cost: 5000, purchased: savedData.powerUpgrades?.boostMultiplier || 0, costMultiplier: 1.25 }
        ];

        this.setupEventListeners();
        this.initializePhotoUpgrades();
        this.initializePowerUpgrades();
        this.updateUI();
        this.startGameLoop();
        this.fetchLeaderboard();

        setInterval(() => this.submitScore(), 10000);
        window.addEventListener("beforeunload", () => this.submitScore());
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
            this.score += this.perClick;
            this.updateUI();
            this.saveGame();
        });
    }

    startGameLoop() {
        setInterval(() => {
            if (this.passivePerSecond > 0) {
                this.score += this.passivePerSecond;
                this.updateUI();
                this.saveGame();
            }
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
                    <img src="${u.photo}" alt="${u.name}">
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

            btn.onclick = () => this.buyPowerUpgrade(u.id);
            container.appendChild(btn);
        });
    }

    buyPowerUpgrade(id) {
        const upg = this.powerUpgrades.find(u => u.id === id);
        const cost = Math.ceil(upg.cost * Math.pow(upg.costMultiplier, upg.purchased));
        if (this.score >= cost) {
            this.score -= cost;
            upg.purchased++;
            if (id === "clickPower") this.perClick += 10;
            if (id === "autoClicker") this.passivePerSecond += 5;
            if (id === "boostMultiplier") this.multiplierValue += 0.5;
            this.updateUI();
            this.saveGame();
        }
    }

    updateUI() {
        document.getElementById("clickerScore").textContent = this.score;
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
            .limit(5)
            .get();

        snap.forEach(doc => {
            const d = doc.data();
            const li = document.createElement("li");
            li.textContent = `${d.name}: ${d.score}`;
            lb.appendChild(li);
        });
    }

    async submitScore() {
        try {
            await db.collection("leaderboard")
                .doc(this.username)
                .set({
                    name: this.username,
                    score: this.score,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

            this.fetchLeaderboard();
        } catch (err) {
            console.error(err);
        }
    }
}

// ==================== CASINO ====================
class BlackjackCasino {
    constructor(game) {
        this.game = game;
        document.getElementById("casinoPlayBtn")
            .addEventListener("click", () => this.play());
    }

    play() {
        const bet = parseInt(document.getElementById("casinoBet").value);
        if (bet > this.game.score) return;

        this.game.score -= bet;
        if (Math.random() < 1 / 13) {
            this.game.score += bet * 10;
        }
        this.game.updateUI();
    }
}

// ==================== INIT ====================
window.addEventListener("DOMContentLoaded", () => {
    const game = new AdvancedClickerGame();
    new BlackjackCasino(game);
});
