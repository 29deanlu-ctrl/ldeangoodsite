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

function showPage(pageId){
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

class AdvancedClickerGame {
    constructor(){
        const savedData = JSON.parse(localStorage.getItem('clickerSave')) || {};
        this.score = savedData.score || 0;
        this.perClick = savedData.perClick || 1;
        this.passivePerSecond = savedData.passivePerSecond || 0;
        this.photoCount = savedData.photoCount || 0;
        this.multiplierValue = 2;

        // Images
        this.photos = [
            'images/018879bf-19f7-488c-9b8e-b187de3e160d.png',
            'images/1fa2f337-ba2b-402e-973a-4cddd7761054.png',
            'images/051dde8f-8d8b-474e-9188-282b5adbf160.png',
            'images/10b773cf-6f38-4daf-b13b-40835c18fea8.png',
            'images/4359f31f-41df-4605-a3a0-f60d82e4d54d.png',
            'images/IMG_8714.jpeg'
        ];
        document.getElementById('clickerImg').src = savedData.currentPhoto || this.photos[0];

        this.photoUpgrades = this.photos.map((photo,index)=>({
            index, photo,
            cost: Math.ceil(Math.pow(2.2,index)*100),
            purchased: savedData.photoUpgrades?.[index]?.purchased || index===0,
            passiveValue: Math.ceil(index*0.3),
            name:`Photo #${index+1}`
        }));
        this.photoCount = savedData.photoCount || 1;

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
        this.startMultiplierChecker();
        this.fetchLeaderboard();
        this.initCasino();
    }

    saveGame(){ localStorage.setItem('clickerSave',JSON.stringify({
        score:this.score, perClick:this.perClick, passivePerSecond:this.passivePerSecond,
        photoCount:this.photoCount, currentPhoto:document.getElementById('clickerImg').src,
        photoUpgrades:this.photoUpgrades.map(u=>({purchased:u.purchased})),
        powerUpgrades:Object.fromEntries(this.powerUpgrades.map(u=>[u.id,u.purchased]))
    })); }

    setupEventListeners(){
        const img = document.getElementById('clickerImg');
        img.addEventListener('click',()=>{this.click();this.saveGame();});
        img.style.cursor='pointer';
        document.getElementById('submitScoreBtn')?.addEventListener('click',()=>{
            const playerName = prompt("Enter your name for the leaderboard:");
            if(playerName) this.submitScore(playerName);
        });
    }

    click(){ this.score += this.perClick; this.updateUI(); this.checkUpgradeAvailability(); }

    unlockPhoto(index){
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
        const cost = upg.purchased>0 ? Math.ceil(upg.cost*Math.pow(upg.costMultiplier,upg.purchased)) : upg.cost;
        if(this.score>=cost){
            this.score-=cost; upg.purchased++;
            if(id==='clickPower') this.perClick+=10;
            else if(id==='autoClicker') this.passivePerSecond+=5;
            else if(id==='boostMultiplier') this.multiplierValue+=0.5;
            this.initializePowerUpgrades(); this.updateUI(); this.saveGame();
        }
    }

    startGameLoop(){ setInterval(()=>{
        if(this.passivePerSecond>0){ this.score+=this.passivePerSecond; this.updateUI(); this.checkUpgradeAvailability(); this.saveGame(); }
    },1000); }

    initializePhotoUpgrades(){
        const container=document.getElementById('photoUpgrades'); container.innerHTML='';
        this.photoUpgrades.forEach(u=>{
            const btn=document.createElement('button'); btn.className='photo-btn'; btn.disabled=u.purchased;
            if(u.purchased) btn.classList.add('purchased');
            btn.innerHTML=`<div class="photo-inner"><img src="${u.photo}" alt="${u.name}"></div>
            <div class="photo-cost">${u.cost}</div>`;
            btn.onclick=()=>this.unlockPhoto(u.index);
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

    startMultiplierChecker(){}

    fetchLeaderboard=async()=>{
        try{ const lb=document.getElementById('leaderboard'); lb.innerHTML='Loading...';
        const snap=await db.collection('leaderboard').orderBy('score','desc').limit(10).get();
        lb.innerHTML=''; snap.forEach(d=>{ const data=d.data(); const li=document.createElement('li'); li.textContent=`${data.name}: ${data.score}`; lb.appendChild(li);});
        }catch(err){console.error(err);}
    }

    submitScore=async(name)=>{ try{ await db.collection('leaderboard').add({name,score:this.score,timestamp:firebase.firestore.FieldValue.serverTimestamp()}); alert('Score submitted!'); this.fetchLeaderboard(); }catch(err){console.error(err);} }

    // ==================== CASINO ====================
    initCasino(){
        document.getElementById('spinSlotsBtn').addEventListener('click',()=>this.playSlots());
        document.getElementById('playBlackjackBtn').addEventListener('click',()=>this.playBlackjack());
        document.getElementById('playRouletteBtn').addEventListener('click',()=>this.playRoulette());
    }

    playSlots(){
        const cost=500; if(this.score<cost) return alert("Not enough clicks!"); this.score-=cost;
        const symbols=['🍒','🍋','🍊','🍇','⭐'];
        const result=Array.from({length:3},()=>symbols[Math.floor(Math.random()*symbols.length)]);
        document.getElementById('slotsResult').textContent=result.join(' | ');
        if(result[0]===result[1] && result[1]===result[2] && Math.random()<1/13){
            const payout=cost*5; this.score+=payout; alert(`Big Win! +${payout} clicks`);
        }
        this.updateUI();
    }

    playBlackjack(){
        const bet=parseInt(document.getElementById('blackjackBet').value);
        if(this.score<bet) return alert("Not enough clicks!"); this.score-=bet;
        if(Math.random()<1/13){
            const payout=bet*2; this.score+=payout;
            document.getElementById('blackjackResult').textContent=`You won! +${payout} clicks`;
        }else{
            document.getElementById('blackjackResult').textContent=`You lost ${bet} clicks`;
        }
        this.updateUI();
    }

    playRoulette(){
        const cost=200; const betNumber=parseInt(document.getElementById('rouletteBetNumber').value);
        if(this.score<cost) return alert("Not enough clicks!"); this.score-=cost;
        const winningNumber=Math.floor(Math.random()*10);
        if(winningNumber===betNumber && Math.random()<1/13){
            const payout=cost*5; this.score+=payout;
            document.getElementById('rouletteResult').textContent=`You won! Number was ${winningNumber} (+${payout} clicks)`;
        }else{
            document.getElementById('rouletteResult').textContent=`You lost. Number was ${winningNumber}`;
        }
        this.updateUI();
    }
}

window.addEventListener('DOMContentLoaded',()=>{ new AdvancedClickerGame(); });
