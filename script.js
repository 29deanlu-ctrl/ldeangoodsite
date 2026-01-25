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

        // Add your photo array here...
        this.photos = savedData.photos || []; // simplified

        document.getElementById("clickerImg").src = savedData.currentPhoto || "";

        this.photoUpgrades = []; // simplified for brevity
        this.powerUpgrades = []; // simplified for brevity

        this.setupEventListeners();
        this.updateUI();
        this.startGameLoop();
        this.fetchLeaderboard();

        setInterval(() => this.submitScore(), 10000);
        window.addEventListener("beforeunload", () => this.submitScore());
    }

    saveGame() {
        localStorage.setItem("clickerSave", JSON.stringify({
            score: this.score
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

    updateUI() {
        document.getElementById("clickerScore").textContent = this.score;
        document.getElementById("clickerPerClick").textContent = this.perClick;
        document.getElementById("clickerPassive").textContent = this.passivePerSecond;
        document.getElementById("clickerMultiplier").textContent = `x${this.multiplierValue}`;
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
            li.textContent = `${rank}. ${d.name}: ${d.score}`;
            lb.appendChild(li);
            rank++;
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

// ==================== PLAYABLE BLACKJACK ====================
class BlackjackCasino {
    constructor(game) {
        this.game = game;

        this.dealerHandEl = document.getElementById("dealerHand");
        this.playerHandEl = document.getElementById("playerHand");
        this.resultEl = document.getElementById("casinoResult");
        this.hitBtn = document.getElementById("hitBtn");
        this.standBtn = document.getElementById("standBtn");
        this.playBtn = document.getElementById("casinoPlayBtn");
        this.betInput = document.getElementById("casinoBet");
        this.updateCasinoScore();

        this.playBtn.addEventListener("click", () => this.startRound());
        this.hitBtn.addEventListener("click", () => this.playerHit());
        this.standBtn.addEventListener("click", () => this.playerStand());
    }

    updateCasinoScore() {
        document.getElementById("casinoScore").textContent = this.game.score;
    }

    startRound() {
        let bet = parseInt(this.betInput.value);
        if (isNaN(bet) || bet < 1) bet = 1;
        if (bet > this.game.score) {
            this.resultEl.textContent = "You can't bet more clicks than you have!";
            return;
        }

        this.bet = bet;
        this.game.score -= bet;
        this.updateCasinoScore();

        this.resultEl.textContent = "";
        this.dealerHand = [this.drawCard(), this.drawCard()];
        this.playerHand = [this.drawCard(), this.drawCard()];

        this.updateHandsDisplay(true);

        this.hitBtn.disabled = false;
        this.standBtn.disabled = false;
        this.playBtn.disabled = true;
    }

    drawCard() {
        const cards = [2,3,4,5,6,7,8,9,10,10,10,10,11];
        return cards[Math.floor(Math.random() * cards.length)];
    }

    handValue(hand) {
        let sum = hand.reduce((a,b) => a+b, 0);
        let aces = hand.filter(c => c===11).length;
        while(sum>21 && aces>0){sum-=10; aces--;}
        return sum;
    }

    updateHandsDisplay(hideDealer=false) {
        this.dealerHandEl.textContent = hideDealer ? `[${this.dealerHand[0]}, ?]` : `[${this.dealerHand.join(", ")}] (Total: ${this.handValue(this.dealerHand)})`;
        this.playerHandEl.textContent = `[${this.playerHand.join(", ")}] (Total: ${this.handValue(this.playerHand)})`;
    }

    playerHit() {
        this.playerHand.push(this.drawCard());
        this.updateHandsDisplay(true);
        if(this.handValue(this.playerHand)>21)this.endRound();
    }

    playerStand() {
        while(this.handValue(this.dealerHand)<17)this.dealerHand.push(this.drawCard());
        this.endRound();
    }

    endRound() {
        this.hitBtn.disabled = true;
        this.standBtn.disabled = true;
        this.playBtn.disabled = false;

        const playerTotal = this.handValue(this.playerHand);
        const dealerTotal = this.handValue(this.dealerHand);
        this.updateHandsDisplay(false);

        let message = "";
        let payout = 0;

        if(playerTotal>21){
            message="You busted! You lose your bet.";
        } else if(dealerTotal>21 || playerTotal>dealerTotal){
            payout=this.bet*2;
            message=`You win! You earned ${payout} clicks.`;
        } else if(playerTotal===dealerTotal){
            payout=this.bet;
            message="It's a tie! Your bet is returned.";
        } else {
            message="Dealer wins! You lose your bet.";
        }

        this.game.score+=payout;
        this.updateCasinoScore();
        this.resultEl.textContent=message;
    }
}

// ==================== INIT ====================
window.addEventListener("DOMContentLoaded", () => {
    const game = new AdvancedClickerGame();
    new BlackjackCasino(game);
});
