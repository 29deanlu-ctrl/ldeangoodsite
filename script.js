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

        // photos, powerUps as before...
        this.photos = [
            'images/018879bf.png', 'images/1fa2f337.png','images/051dde8f.png'
        ]; // truncated for brevity
        document.getElementById("clickerImg").src = savedData.currentPhoto || this.photos[0];

        this.photoUpgrades = this.photos.map((photo,i)=>({
            index:i, photo, cost: Math.ceil(Math.pow(2.2,i)*100), purchased: savedData.photoUpgrades?.[i]?.purchased || i===0, passiveValue: Math.ceil(i*0.3)
        }));

        this.powerUpgrades = [
            {id:"clickPower", name:"+10 Per Click", cost:500, purchased:savedData.powerUpgrades?.clickPower||0, costMultiplier:1.15},
            {id:"autoClicker", name:"Auto-Clicker Bot", cost:2000, purchased:savedData.powerUpgrades?.autoClicker||0, costMultiplier:1.2},
            {id:"boostMultiplier", name:"Multiplier Boost", cost:5000, purchased:savedData.powerUpgrades?.boostMultiplier||0, costMultiplier:1.25}
        ];

        this.setupEventListeners();
        this.initializePhotoUpgrades();
        this.initializePowerUpgrades();
        this.updateUI();
        this.startGameLoop();
        this.fetchLeaderboard();

        setInterval(()=>this.submitScore(),10000);
        window.addEventListener("beforeunload",()=>this.submitScore());
    }

    saveGame(){ localStorage.setItem("clickerSave",JSON.stringify({
        score:this.score, perClick:this.perClick, passivePerSecond:this.passivePerSecond,
        photoCount:this.photoCount, currentPhoto:document.getElementById("clickerImg").src,
        photoUpgrades:this.photoUpgrades.map(u=>({purchased:u.purchased})),
        powerUpgrades:Object.fromEntries(this.powerUpgrades.map(u=>[u.id,u.purchased]))
    })); }

    setupEventListeners(){
        document.getElementById("clickerImg").addEventListener("click",()=>{
            this.randomMultiplier = Math.random()*2+1; // 1x-3x
            this.score += this.perClick*this.multiplierValue*this.randomMultiplier;
            document.getElementById("multiplierIndicator").textContent=`x${this.randomMultiplier.toFixed(2)}`;
            document.getElementById("multiplierIndicator").classList.add("active");
            setTimeout(()=>document.getElementById("multiplierIndicator").classList.remove("active"),500);
            this.updateUI();
            this.saveGame();
        });
    }

    startGameLoop(){
        setInterval(()=>{
            if(this.passivePerSecond>0){this.score+=this.passivePerSecond;this.updateUI();this.saveGame();}
        },1000);
    }

    // Photo upgrades, power-ups, leaderboard, submitScore, blackjack setup as before...
}

// ==================== INIT ====================
window.addEventListener("DOMContentLoaded",()=>{
    const game=new AdvancedClickerGame();
    document.getElementById("casinoScore").textContent = game.score;

    // Blackjack playable
    document.getElementById("casinoPlayBtn").addEventListener("click",()=>{
        const bet = parseInt(document.getElementById("casinoBet").value);
        if(bet>game.score||bet<=0)return;
        game.score-=bet;

        // simple blackjack
        const player = Math.floor(Math.random()*21)+1;
        const dealer = Math.floor(Math.random()*21)+1;

        let result="";
        if(player>21) result="You busted!";
        else if(dealer>21||player>dealer) result=`You win! (${player} vs ${dealer})`;
        else if(player===dealer) result=`Draw! (${player} vs ${dealer})`;
        else result=`You lose! (${player} vs ${dealer})`;

        if(result.includes("win")) game.score+=bet*2;
        document.getElementById("casinoResult").textContent=result;
        document.getElementById("casinoScore").textContent=game.score;
        game.updateUI();
        game.saveGame();
    });
});
