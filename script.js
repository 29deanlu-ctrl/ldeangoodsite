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

// ==================== ADVANCED PHOTO CLICKER GAME ====================
class AdvancedClickerGame {
    constructor() {
        const savedData = JSON.parse(localStorage.getItem('clickerSave')) || {};

        this.score = savedData.score || 0;
        this.perClick = savedData.perClick || 1;
        this.clickMultiplier = savedData.clickMultiplier || 1;
        this.passivePerSecond = savedData.passivePerSecond || 0;
        this.photoCount = savedData.photoCount || 0;
        this.maxPhotos = 20;

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
            'images/f3a95d98-89d8-4e5f-8527-55b9e15d685d.png'
        ];

        const shuffledPhotos = [...allPhotos].sort(() => Math.random() - 0.5);
        this.photos = [...shuffledPhotos, 'images/IMG_8714.jpeg'];

        this.randomStartIndex = 0;
        const startingPhoto = this.photos[this.randomStartIndex];
        document.getElementById('clickerImg').src = savedData.currentPhoto || startingPhoto;

        this.photoUpgrades = this.photos.map((photo, index) => ({
            index,
            photo,
            cost: Math.ceil(Math.pow(2.2, index) * 100),
            purchased: savedData.photoUpgrades?.[index]?.purchased || index === this.randomStartIndex,
            passiveValue: Math.ceil(index * 0.3),
            name: `Photo #${index + 1}`
        }));

        this.photoCount = savedData.photoCount || 1;

        this.powerUpgrades = [
            { id: 'clickPower', name: '+10 Per Click', cost: 500, purchased: savedData.powerUpgrades?.clickPower || 0, costMultiplier: 1.15 },
            { id: 'autoClicker', name: 'Auto-Clicker Bot', cost: 2000, purchased: savedData.powerUpgrades?.autoClicker || 0, effect: 1, costMultiplier: 1.2 },
            { id: 'boostMultiplier', name: 'Multiplier Boost', cost: 5000, purchased: savedData.powerUpgrades?.boostMultiplier || 0, effect: 1, costMultiplier: 1.25 }
        ];

        this.multiplierActive = false;
        this.multiplierDuration = 0;
        this.multiplierValue = 2;
        this.multiplierChance = 0.008;
        this.multiplierWindow = 8000;

        this.setupEventListeners();
        this.initializePhotoUpgrades();
        this.initializePowerUpgrades();
        this.updateUI();

        this.startGameLoop();
        this.startMultiplierChecker();
        this.fetchLeaderboard();
    }

    saveGame() {
        const saveData = {
            score: this.score,
            perClick: this.perClick,
            clickMultiplier: this.clickMultiplier,
            passivePerSecond: this.passivePerSecond,
            photoCount: this.photoCount,
            currentPhoto: document.getElementById('clickerImg').src,
            photoUpgrades: this.photoUpgrades.map(upg => ({ purchased: upg.purchased })),
            powerUpgrades: Object.fromEntries(this.powerUpgrades.map(upg => [upg.id, upg.purchased]))
        };
        localStorage.setItem('clickerSave', JSON.stringify(saveData));
    }

    setupEventListeners() {
        const img = document.getElementById('clickerImg');
        img.addEventListener('click', () => { 
            this.click(); 
            this.saveGame();
        });
        img.style.cursor = 'pointer';

        document.getElementById('submitScoreBtn')?.addEventListener('click', () => {
            const playerName = prompt("Enter your name for the leaderboard:");
            if (playerName) this.submitScore(playerName);
        });
    }

    click() {
        const clickValue = this.multiplierActive ? this.perClick * this.multiplierValue : this.perClick;
        this.score += clickValue;
        this.updateUI();
        this.checkUpgradeAvailability();
    }

    unlockPhoto(index) {
        const upgrade = this.photoUpgrades[index];
        if (this.score >= upgrade.cost && !upgrade.purchased) {
            this.score -= upgrade.cost;
            upgrade.purchased = true;
            this.photoCount++;
            this.passivePerSecond += upgrade.passiveValue;

            document.getElementById('clickerImg').src = upgrade.photo;
            this.initializePhotoUpgrades();
            this.updateUI();
            this.showUnlockAnimation(index);
            this.saveGame();
        }
    }

    buyPowerUpgrade(upgradeId) {
        const upgrade = this.powerUpgrades.find(u => u.id === upgradeId);
        const nextCost = upgrade.purchased > 0 
            ? Math.ceil(upgrade.cost * Math.pow(upgrade.costMultiplier, upgrade.purchased))
            : upgrade.cost;
        
        if (this.score >= nextCost) {
            this.score -= nextCost;
            upgrade.purchased++;
            
            if (upgradeId === 'clickPower') this.perClick += 10;
            else if (upgradeId === 'autoClicker') this.passivePerSecond += 5;
            else if (upgradeId === 'boostMultiplier') this.multiplierValue += 0.5;
            
            this.initializePowerUpgrades();
            this.updateUI();
            this.saveGame();
        }
    }

    startGameLoop() {
        setInterval(() => {
            if (this.passivePerSecond > 0) {
                const passiveValue = this.multiplierActive ? this.passivePerSecond * this.multiplierValue : this.passivePerSecond;
                this.score += passiveValue;
                this.updateUI();
                this.checkUpgradeAvailability();
                this.saveGame();
            }
        }, 1000);
    }

    // ==================== FIREBASE LEADERBOARD ====================
    async submitScore(name) {
        try {
            await db.collection('leaderboard').add({
                name,
                score: this.score,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('Score submitted!');
            this.fetchLeaderboard();
        } catch (err) {
            console.error('Error submitting score:', err);
        }
    }

    async fetchLeaderboard() {
        try {
            const leaderboardEl = document.getElementById('leaderboard');
            leaderboardEl.innerHTML = 'Loading...';

            const snapshot = await db.collection('leaderboard')
                .orderBy('score', 'desc')
                .limit(10)
                .get();

            leaderboardEl.innerHTML = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const li = document.createElement('li');
                li.textContent = `${data.name}: ${data.score}`;
                leaderboardEl.appendChild(li);
            });
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
        }
    }
}

// ==================== INITIALIZE GAME ====================
window.addEventListener('DOMContentLoaded', () => {
    new AdvancedClickerGame();
});
