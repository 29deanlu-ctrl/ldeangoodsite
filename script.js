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

// ==================== ADVANCED CLICKER GAME ====================
class AdvancedClickerGame {
    constructor() {
        const savedData = JSON.parse(localStorage.getItem('clickerSave')) || {};
        this.score = savedData.score || 0;
        this.perClick = savedData.perClick || 1;
        this.passivePerSecond = savedData.passivePerSecond || 0;
        this.photoCount = savedData.photoCount || 0;
        this.maxPhotos = 20;
        this.multiplierActive = false;
        this.multiplierValue = 2;

        const allPhotos = Array.from({length:20}, (_,i)=>`images/photo${i+1}.png`);
        this.photos = [...allPhotos.sort(()=>Math.random()-0.5),'images/IMG_8714.jpeg'];
        this.randomStartIndex = 0;
        document.getElementById('clickerImg').src = savedData.currentPhoto || this.photos[0];

        this.photoUpgrades = this.photos.map((photo,index)=>({
            index,
            photo,
            cost: Math.ceil(Math.pow(2.2,index)*100),
            purchased: savedData.photoUpgrades?.[index]?.purchased || index===0,
            passiveValue: Math.ceil(index*0.3),
            name: `Photo #${index+1}`
        }));

        this.powerUpgrades = [
            {id:'clickPower',name:'+10 Per Click',cost:500,purchased:savedData.powerUpgrades?.clickPower||0,costMultiplier:1.15},
            {id:'autoClicker',name:'Auto-Clicker Bot',cost:2000,purchased:savedData.powerUpgrades?.autoClicker||0,costMultiplier:1.2},
            {id:'boostMultiplier',name:'Multiplier Boost',cost:5000,purchased:savedData.powerUpgrades?.boostMultiplier||0,costMultiplier:1.25}
        ];

        this.setupEventListeners();
        this.initializePhotoUpgrades();
        this.initializePowerUpgrades();
        this.updateUI();
        this.startGameLoop();
        this.fetchLeaderboard();
    }

    saveGame() {
        localStorage.setItem('clickerSave', JSON.stringify({
            score: this.score,
            perClick: this.perClick,
            passivePerSecond: this.passivePerSecond,
            photoCount: this.photoCount,
            currentPhoto: document.getElementById('clickerImg').src,
            photoUpgrades: this.photoUpgrades.map(u=>({purchased:u.purchased})),
            powerUpgrades: Object.fromEntries(this.powerUpgrades.map(u=>[u.id,u.purchased]))
        }));
    }

    setupEventListeners() {
        const img = document.getElementById('clickerImg');
        img.addEventListener('click',()=>{this.click(); this.saveGame();});
        img.style.cursor='pointer';
        document.getElementById('submitScoreBtn')?.addEventListener('click',()=>{
            const name = prompt("Enter your name for leaderboard:");
            if(name) this.submitScore(name);
        });
    }

    click() { this.score += this.perClick; this.updateUI(); this.checkUpgradeAvailability(); }

    unlockPhoto(index) {
        const upg=this.photoUpgrades[index];
        if(this.score>=upg.cost && !upg.purchased){
            this.score-=upg.cost; upg.purchased=true;
            this.photoCount++; this.passivePerSecond+=upg.passiveValue;
            document.getElementById('clickerImg').src=upg.photo;
            this.initializePhotoUpgrades(); this.updateUI(); this.saveGame();
        }
    }

    buyPowerUpgrade(id){
        const upg=this.powerUpgrades.find(u=>u.id===id);
        const cost=upg.purchased>0?Math.ceil(upg.cost*Math.pow(upg.costMultiplier,upg.purchased)):upg.cost;
        if(this.score>=cost){ this.score-=cost; upg.purchased++;
            if(id==='clickPower') this.perClick+=10;
            else if(id==='autoClicker') this.passivePerSecond+=5;
            else if(id==='boostMultiplier') this.multiplierValue+=0.5;
            this.initializePowerUpgrades(); this.updateUI(); this.saveGame();
        }
    }

    startGameLoop() {
        setInterval(()=>{
            if(this.passivePerSecond>0){
                this.score+=this.passivePerSecond; this.updateUI(); this.checkUpgradeAvailability(); this.saveGame();
            }
        },1000);
    }

    initializePhotoUpgrades(){
        const container=document.getElementById('photoUpgrades'); container.innerHTML='';
        this.photoUpgrades.forEach(u=>{
            const btn=document.createElement('button'); btn.className='photo-btn';
            if(u.purchased) btn.classList.add('purchased'); else btn.disabled=false;
            btn.innerHTML=`<div class="photo-inner"><img src="${u.photo}" alt="${u.name}"></div>
            <div class="photo-cost">${u.cost}</div>`; btn.onclick=()=>this.unlockPhoto(u.index);
            container.appendChild(btn);
        });
        document.getElementById('photoCount').textContent=this.photoCount;
    }

    initializePowerUpgrades(){
        const container=document.getElementById('powerUpgrades'); container.innerHTML='';
        this.powerUpgrades.forEach(u=>{
            const btn=document.createElement('button'); btn.className='power-btn';
            const nextCost=u.purchased>0?Math.ceil(u.cost*Math.pow(u.costMultiplier,u.purchased)):u.cost;
            btn.innerHTML=`<div class="power-info"><span class="power-name">${u.name}</span><span class="power-count">Owned: ${u.purchased}</span></div>
            <div class="power-cost">${nextCost}</div>`; btn.disabled=this.score<nextCost;
            btn.onclick=()=>this.buyPowerUpgrade(u.id);
            container.appendChild(btn);
        });
    }

    updateUI(){
        document.getElementById('clickerScore').textContent=this.score;
        document.getElementById('clickerPerClick').textContent=this.perClick;
        document.getElementById('clickerPassive').textContent=this.passivePerSecond;
        document.getElementById('clickerMultiplier').textContent=`x${this.multiplierValue}`;
        this.initializePhotoUpgrades(); this.initializePowerUpgrades();
    }

    checkUpgradeAvailability(){ this.initializePowerUpgrades(); this.initializePhotoUpgrades(); }

    fetchLeaderboard = async () => {
        try {
            const lb=document.getElementById('leaderboard'); lb.innerHTML='Loading...';
            const snap = await db.collection('leaderboard').orderBy('score','desc').limit(10).get();
            lb.innerHTML=''; snap.forEach(d=>{ const data=d.data(); const li=document.createElement('li'); li.textContent=`${data.name}: ${data.score}`; lb.appendChild(li); });
        } catch(err){ console.error(err); }
    }

    submitScore = async (name) => {
        try { await db.collection('leaderboard').add({name,score:this.score,timestamp:firebase.firestore.FieldValue.serverTimestamp()});
            alert('Score submitted!'); this.fetchLeaderboard();
        } catch(err){ console.error(err); }
    }
}

// ==================== INIT GAME ====================
window.addEventListener('DOMContentLoaded',()=>{ new AdvancedClickerGame(); });
