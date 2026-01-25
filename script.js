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
        username = prompt("Choose a username for the leaderboard:") || "Anonymous";
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
        this.randomMultiplier = 1;

        const allPhotos = [ /* same images array from your JS */ ];
        this.photos = allPhotos;
        document.getElementById("clickerImg").src = savedData.currentPhoto || this.photos[0];

        // photoUpgrades & powerUpgrades initialization
        // ... same as before

        this.setupEventListeners();
        this.initializePhotoUpgrades();
        this.initializePowerUpgrades();
        this.updateUI();
        this.startGameLoop();
        this.fetchLeaderboard();

        setInterval(() => this.submitScore(), 10000);
        window.addEventListener("beforeunload", () => this.submitScore());
    }

    // all methods same as in your previous JS
    // unlockPhoto, saveGame, setupEventListeners, startGameLoop, buyPowerUpgrade, updateUI, fetchLeaderboard, submitScore
}

// ==================== CASINO ====================
class BlackjackCasino {
    constructor(game) {
        this.game = game;
        document.getElementById("casinoPlayBtn").addEventListener("click", () => this.play());
    }
    play() {
        const bet = parseInt(document.getElementById("casinoBet").value);
        if (bet > this.game.score) return;
        this.game.score -= bet;
        if (Math.random() < 1 / 13) { this.game.score += bet * 10; }
        this.game.updateUI();
    }
}

// ==================== INIT ====================
window.addEventListener("DOMContentLoaded", () => {
    const game = new AdvancedClickerGame();
    new BlackjackCasino(game);
});
