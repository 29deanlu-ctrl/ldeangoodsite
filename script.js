// ==================== ADVANCED PHOTO CLICKER GAME ====================
class AdvancedClickerGame {
    constructor() {
        this.score = 0;
        this.perClick = 1;
        this.clickMultiplier = 1;
        this.passivePerSecond = 0;
        this.photoCount = 0;
        this.maxPhotos = 20;
        
        // All photos - final photo is always IMG_8714.jpeg
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
        
        // Shuffle first 19 photos
        const shuffledPhotos = [...allPhotos].sort(() => Math.random() - 0.5);
        // Add final photo at the end
        this.photos = [...shuffledPhotos, 'images/IMG_8714.jpeg'];

        // Set starting photo to always be the first one
        this.randomStartIndex = 0;
        const startingPhoto = this.photos[this.randomStartIndex];
        document.getElementById('clickerImg').src = startingPhoto;

        // Photo unlock costs based on rarity - exponential scaling
        this.photoUpgrades = this.photos.map((photo, index) => ({
            index,
            photo,
            cost: Math.ceil(Math.pow(2.2, index) * 100),
            purchased: index === this.randomStartIndex, // Starting photo is free
            passiveValue: Math.ceil(index * 0.3),
            name: `Photo #${index + 1}`
        }));

        // Initialize photo count with the starting photo
        this.photoCount = 1;

        // Power upgrades
        this.powerUpgrades = [
            { id: 'clickPower', name: '+10 Per Click', cost: 500, purchased: 0, costMultiplier: 1.15 },
            { id: 'autoClicker', name: 'Auto-Clicker Bot', cost: 2000, purchased: 0, effect: 1, costMultiplier: 1.2 },
            { id: 'boostMultiplier', name: 'Multiplier Boost', cost: 5000, purchased: 0, effect: 1, costMultiplier: 1.25 }
        ];

        this.multiplierActive = false;
        this.multiplierDuration = 0;
        this.multiplierValue = 2;
        this.multiplierChance = 0.008; // 0.8% chance per tick (rarer)
        this.multiplierWindow = 8000; // 8 second window for x2 event

        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize UI
        this.initializePhotoUpgrades();
        this.initializePowerUpgrades();
        this.updateUI();
        
        // Start passive generation loop
        this.startGameLoop();
        this.startMultiplierChecker();
    }

    setupEventListeners() {
        const img = document.getElementById('clickerImg');
        img.addEventListener('click', () => this.click());
        img.style.cursor = 'pointer';
    }

    initializePhotoUpgrades() {
        const container = document.getElementById('photoUpgrades');
        container.innerHTML = '';
        
        this.photoUpgrades.forEach((upgrade, idx) => {
            const btn = document.createElement('button');
            btn.className = 'photo-btn';
            btn.id = `photo-${idx}`;
            
            if (upgrade.purchased) {
                btn.classList.add('purchased');
                btn.innerHTML = `
                    <div class="photo-inner">
                        <img src="${upgrade.photo}" alt="Photo ${idx + 1}">
                        <span class="check">✓</span>
                    </div>
                    <p class="photo-earned">+${upgrade.passiveValue}/sec</p>
                `;
                btn.disabled = true;
            } else {
                btn.innerHTML = `
                    <div class="photo-inner">
                        <img src="${upgrade.photo}" alt="Photo ${idx + 1}" style="filter: blur(3px);">
                        <span class="lock">🔒</span>
                    </div>
                    <p class="photo-cost">${upgrade.cost.toLocaleString()}</p>
                `;
                btn.disabled = this.score < upgrade.cost;
                btn.addEventListener('click', () => this.unlockPhoto(idx));
            }
            
            container.appendChild(btn);
        });
    }

    initializePowerUpgrades() {
        const container = document.getElementById('powerUpgrades');
        container.innerHTML = '';
        
        this.powerUpgrades.forEach((upgrade) => {
            const btn = document.createElement('button');
            btn.className = 'power-btn';
            btn.id = `power-${upgrade.id}`;
            
            let costText = upgrade.cost.toLocaleString();
            if (upgrade.purchased > 0) {
                const nextCost = Math.ceil(upgrade.cost * Math.pow(upgrade.costMultiplier, upgrade.purchased));
                costText = nextCost.toLocaleString();
            }
            
            btn.innerHTML = `
                <div class="power-info">
                    <span class="power-name">${upgrade.name}</span>
                    ${upgrade.purchased > 0 ? `<span class="power-count">(x${upgrade.purchased})</span>` : ''}
                </div>
                <span class="power-cost">${costText}</span>
            `;
            
            const nextCost = upgrade.purchased > 0 
                ? Math.ceil(upgrade.cost * Math.pow(upgrade.costMultiplier, upgrade.purchased))
                : upgrade.cost;
            
            btn.disabled = this.score < nextCost;
            btn.addEventListener('click', () => this.buyPowerUpgrade(upgrade.id));
            
            container.appendChild(btn);
        });
    }

    unlockPhoto(index) {
        const upgrade = this.photoUpgrades[index];
        if (this.score >= upgrade.cost && !upgrade.purchased) {
            this.score -= upgrade.cost;
            upgrade.purchased = true;
            this.photoCount++;
            this.passivePerSecond += upgrade.passiveValue;
            
            // Change current image
            document.getElementById('clickerImg').src = upgrade.photo;
            
            this.initializePhotoUpgrades();
            this.updateUI();
            
            // Show unlock animation
            this.showUnlockAnimation(index);
        }
    }

    showUnlockAnimation(index) {
        const btn = document.getElementById(`photo-${index}`);
        btn.style.animation = 'none';
        setTimeout(() => {
            btn.style.animation = 'photoUnlock 0.6s ease';
        }, 10);
    }

    buyPowerUpgrade(upgradeId) {
        const upgrade = this.powerUpgrades.find(u => u.id === upgradeId);
        const nextCost = upgrade.purchased > 0 
            ? Math.ceil(upgrade.cost * Math.pow(upgrade.costMultiplier, upgrade.purchased))
            : upgrade.cost;
        
        if (this.score >= nextCost) {
            this.score -= nextCost;
            upgrade.purchased++;
            
            if (upgradeId === 'clickPower') {
                this.perClick += 10;
            } else if (upgradeId === 'autoClicker') {
                this.passivePerSecond += 5;
            } else if (upgradeId === 'boostMultiplier') {
                this.multiplierValue += 0.5;
            }
            
            this.initializePowerUpgrades();
            this.updateUI();
        }
    }

    startMultiplierChecker() {
        setInterval(() => {
            if (!this.multiplierActive && Math.random() < this.multiplierChance) {
                this.activateMultiplier();
            }
        }, 1000);
    }

    activateMultiplier() {
        this.multiplierActive = true;
        this.multiplierDuration = this.multiplierWindow;
        
        const indicator = document.getElementById('multiplierIndicator');
        indicator.classList.add('active');
        indicator.innerHTML = `<span class="pulse">⚡ ${this.multiplierValue}X ACTIVE! CLICK NOW!</span>`;
        
        const updateCountdown = setInterval(() => {
            this.multiplierDuration -= 100;
            const percent = (this.multiplierDuration / this.multiplierWindow) * 100;
            indicator.style.setProperty('--progress', percent + '%');
            
            if (this.multiplierDuration <= 0) {
                clearInterval(updateCountdown);
                this.multiplierActive = false;
                indicator.classList.remove('active');
                indicator.innerHTML = '';
            }
        }, 100);
        
        this.updateUI();
    }

    click() {
        const clickValue = this.multiplierActive ? this.perClick * this.multiplierValue : this.perClick;
        this.score += clickValue;
        
        // Show feedback
        const feedback = document.getElementById('clickFeedback');
        feedback.textContent = '+' + Math.round(clickValue) + (this.multiplierActive ? '⚡' : '');
        feedback.style.color = this.multiplierActive ? '#FFD700' : '#00ff88';
        feedback.style.animation = 'none';
        setTimeout(() => {
            feedback.style.animation = 'floatUp 0.8s ease forwards';
        }, 10);

        // Pulse effect
        const img = document.getElementById('clickerImg');
        img.style.transform = 'scale(0.92)';
        setTimeout(() => {
            img.style.transform = 'scale(1)';
        }, 100);

        this.updateUI();
        this.checkUpgradeAvailability();
    }

    startGameLoop() {
        setInterval(() => {
            if (this.passivePerSecond > 0) {
                const passiveValue = this.multiplierActive ? this.passivePerSecond * this.multiplierValue : this.passivePerSecond;
                this.score += passiveValue;
                
                // Show passive feedback
                const feedback = document.getElementById('clickFeedback');
                feedback.textContent = '+' + Math.round(passiveValue) + (this.multiplierActive ? '⚡' : '');
                feedback.style.color = this.multiplierActive ? '#FFD700' : '#00ff88';
                feedback.style.animation = 'none';
                setTimeout(() => {
                    feedback.style.animation = 'floatUp 0.8s ease forwards';
                }, 10);
                
                this.updateUI();
                this.checkUpgradeAvailability();
            }
        }, 1000);
    }

    checkUpgradeAvailability() {
        // Update photo buttons
        this.photoUpgrades.forEach((upgrade, idx) => {
            if (!upgrade.purchased) {
                const btn = document.getElementById(`photo-${idx}`);
                if (btn) {
                    btn.disabled = this.score < upgrade.cost;
                }
            }
        });

        // Update power buttons
        this.powerUpgrades.forEach((upgrade) => {
            const btn = document.getElementById(`power-${upgrade.id}`);
            if (btn) {
                const nextCost = upgrade.purchased > 0 
                    ? Math.ceil(upgrade.cost * Math.pow(upgrade.costMultiplier, upgrade.purchased))
                    : upgrade.cost;
                btn.disabled = this.score < nextCost;
            }
        });
    }

    updateUI() {
        document.getElementById('clickerScore').textContent = Math.round(this.score).toLocaleString();
        document.getElementById('clickerPerClick').textContent = this.perClick.toLocaleString();
        document.getElementById('clickerPassive').textContent = this.passivePerSecond.toLocaleString();
        document.getElementById('photoCount').textContent = this.photoCount;
        document.getElementById('clickerMultiplier').textContent = this.multiplierActive ? `x${this.multiplierValue}` : 'x1';
        
        if (this.multiplierActive) {
            document.getElementById('clickerMultiplier').style.color = '#FFD700';
        } else {
            document.getElementById('clickerMultiplier').style.color = '#a0a0a0';
        }
    }
}

// ==================== INITIALIZE GAME ====================
window.addEventListener('DOMContentLoaded', () => {
    new AdvancedClickerGame();
});
