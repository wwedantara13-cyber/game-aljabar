const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const actionBtn = document.getElementById('action-button');
const bgm = document.getElementById('bgm-player');

// --- 1. LOGIKA AUDIO & BACKGROUND ---
let isMusicPlaying = false;
function playAudio() {
    if (!isMusicPlaying && bgm) {
        bgm.volume = 0.4;
        bgm.play().then(() => { isMusicPlaying = true; }).catch(e => console.log("Menunggu klik user..."));
    }
}

const bgImage = new Image();
bgImage.src = 'dungeon-bg.png'; 
let bgLoaded = false;
bgImage.onload = () => { bgLoaded = true; };
bgImage.onerror = () => { bgLoaded = false; console.warn("Gambar tidak ditemukan, menggunakan warna cadangan."); };

// --- 2. DATA GAME ---
let completedDungeons = [];
let activeDungeon = null;
let nearDungeonId = null;
let selectedItem = null;

const databaseSoal = {
    1: { teks: "(4a + 7) + (2a - 3)", item: [{t:"4a",v:"a"}, {t:"7",v:"k"}, {t:"2a",v:"a"}, {t:"-3",v:"k"}], kunci: ["6a", "4"], v1: "a", v2: "k" },
    2: { teks: "(8x - 5) - (2x + 4)", item: [{t:"8x",v:"x"}, {t:"-5",v:"k"}, {t:"-2x",v:"x"}, {t:"-4",v:"k"}], kunci: ["6x", "-9"], v1: "x", v2: "k" },
    3: { teks: "(3m + 2n) + (5m - 6n)", item: [{t:"3m",v:"m"}, {t:"2n",v:"n"}, {t:"5m",v:"m"}, {t:"-6n",v:"n"}], kunci: ["8m", "-4n"], v1: "m", v2: "n" },
    5: { teks: "(-2x² + 5x) + (7x² - 3x)", item: [{t:"-2x²",v:"x2"}, {t:"5x",v:"x"}, {t:"7x²",v:"x2"}, {t:"-3x",v:"x"}], kunci: ["5x^2", "2x"], v1: "x2", v2: "x" },
    9: { teks: "(x² + 4x) + (2x² - 4x)", item: [{t:"x²",v:"x2"}, {t:"4x",v:"x"}, {t:"2x²",v:"x2"}, {t:"-4x",v:"x"}], kunci: ["3x^2", "0"], v1: "x2", v2: "x" }
};

const dungeons = [
    {id: 1, x: 0.22, y: 0.28}, {id: 2, x: 0.50, y: 0.22}, {id: 5, x: 0.78, y: 0.28},
    {id: 4, x: 0.38, y: 0.45}, {id: 3, x: 0.18, y: 0.55}, {id: 6, x: 0.82, y: 0.55},
    {id: 7, x: 0.25, y: 0.78}, {id: 8, x: 0.50, y: 0.85}, {id: 9, x: 0.75, y: 0.78}
];

let player = { x: 0, y: 0, speed: 6 };
let moveDir = { x: 0, y: 0 }, isJoystickActive = false;

function init() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    player.x = canvas.width / 2; player.y = canvas.height / 2;
}
window.addEventListener('resize', init);
init();

// --- 3. JOYSTICK ---
const stick = document.getElementById('joystick-stick');
const base = document.getElementById('joystick-base');

const handleJoyMove = (e) => {
    playAudio();
    if(!isJoystickActive) return;
    const pos = e.touches ? e.touches[0] : e;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
    let dx = pos.clientX - cx, dy = pos.clientY - cy;
    const dist = Math.sqrt(dx*dx + dy*dy), max = rect.width/2;
    if(dist > max) { dx *= max/dist; dy *= max/dist; }
    stick.style.left = `calc(50% + ${dx}px)`; stick.style.top = `calc(50% + ${dy}px)`;
    moveDir = { x: dx/max, y: dy/max };
};

base.addEventListener('mousedown', (e) => { isJoystickActive = true; handleJoyMove(e); });
window.addEventListener('mousemove', (e) => { if(isJoystickActive) handleJoyMove(e); });
window.addEventListener('mouseup', () => { isJoystickActive = false; moveDir = {x:0,y:0}; stick.style.left="50%"; stick.style.top="50%"; });

base.addEventListener('touchstart', (e) => { isJoystickActive = true; handleJoyMove(e); if(e.cancelable) e.preventDefault(); }, {passive:false});
window.addEventListener('touchmove', (e) => { if(isJoystickActive) { handleJoyMove(e); if(e.cancelable) e.preventDefault(); } }, {passive:false});
window.addEventListener('touchend', () => { isJoystickActive = false; moveDir = {x:0,y:0}; stick.style.left="50%"; stick.style.top="50%"; });

// --- 4. GAME LOOP ---
function update() {
    if(!activeDungeon) {
        player.x += moveDir.x * player.speed; player.y += moveDir.y * player.speed;
        player.x = Math.max(20, Math.min(canvas.width-20, player.x));
        player.y = Math.max(20, Math.min(canvas.height-20, player.y));
        let found = null;
        dungeons.forEach(d => {
            const dx = d.x * canvas.width, dy = d.y * canvas.height;
            if(Math.sqrt((player.x - dx)**2 + (player.y - dy)**2) < 65) found = d.id;
        });
        nearDungeonId = found;
        if(nearDungeonId) {
            actionBtn.classList.add('show');
            actionBtn.innerText = completedDungeons.includes(nearDungeonId) ? `GOA ${nearDungeonId} (✔)` : `MASUK GOA ${nearDungeonId}`;
        } else actionBtn.classList.remove('show');
    }
    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0,0, canvas.width, canvas.height);
    if (bgLoaded) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#1a1a1a"; ctx.fillRect(0,0, canvas.width, canvas.height);
        ctx.strokeStyle = "#333";
        for(let i=0; i<canvas.width; i+=50) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); ctx.stroke(); }
    }
    dungeons.forEach(d => {
        const dx = d.x * canvas.width, dy = d.y * canvas.height;
        ctx.beginPath(); ctx.arc(dx, dy, completedDungeons.includes(d.id) ? 30 : 25, 0, Math.PI*2);
        ctx.strokeStyle = completedDungeons.includes(d.id) ? "#eab308" : "#00f2fe";
        ctx.lineWidth = 3; ctx.stroke();
    });
    ctx.fillStyle = "#00ff87"; ctx.fillRect(player.x-12, player.y-12, 25, 25);
}

// --- 5. PUZZLE ---
function selectItem(el) { playAudio(); if (selectedItem) selectedItem.classList.remove('selected'); selectedItem = el; selectedItem.classList.add('selected'); }
function moveToZone(id) { if (selectedItem) { document.getElementById(id).appendChild(selectedItem); selectedItem.classList.remove('selected'); selectedItem = null; } }

function confirmEntry() {
    if(nearDungeonId) {
        activeDungeon = JSON.parse(JSON.stringify(databaseSoal[nearDungeonId] || databaseSoal[1]));
        activeDungeon.currId = nearDungeonId;
        document.getElementById('puzzle-overlay').classList.remove('hidden');
        resetPuzzle();
    }
}

function exitDungeon() { activeDungeon = null; document.getElementById('puzzle-overlay').classList.add('hidden'); player.y += 80; selectedItem = null; }

function resetPuzzle() {
    document.getElementById('prison-scene').classList.remove('freed');
    document.getElementById('stage-1').style.display = 'block';
    document.getElementById('stage-2').style.display = 'none';
    document.getElementById('display-soal').innerText = activeDungeon.teks;
    document.getElementById('zone-v1').innerHTML = `<p>WADAH ${activeDungeon.v1.toUpperCase()}</p>`;
    document.getElementById('zone-v2').innerHTML = `<p>WADAH ${activeDungeon.v2.toUpperCase()}</p>`;
    const container = document.getElementById('drag-items-container');
    container.innerHTML = "";
    activeDungeon.item.forEach(s => {
        const div = document.createElement('div');
        div.className = "item"; div.innerText = s.t; div.dataset.v = s.v;
        div.onclick = function() { selectItem(this); };
        container.appendChild(div);
    });
}

function validateStage1() {
    const v1 = document.querySelectorAll('#zone-v1 .item'), v2 = document.querySelectorAll('#zone-v2 .item');
    if(v1.length + v2.length < 4) return Swal.fire('Belum Lengkap!', 'Pindahkan semua kotak!', 'warning');
    let salah = false;
    v1.forEach(it => { if(it.dataset.v !== activeDungeon.v1) salah = true; });
    v2.forEach(it => { if(it.dataset.v !== activeDungeon.v2) salah = true; });
    if(salah) return Swal.fire('Salah Wadah!', 'Suku belum sejenis.', 'error');
    document.getElementById('stage-1').style.display = 'none';
    document.getElementById('stage-2').style.display = 'block';
}

function addPower(id) { document.getElementById(id).value += "^2"; }

function checkLock() {
    const a1 = document.getElementById('ans-1').value.trim().toLowerCase();
    const a2 = document.getElementById('ans-2').value.trim().toLowerCase();
    if(a1 === activeDungeon.kunci[0] && a2 === activeDungeon.kunci[1]) {
        if(!completedDungeons.includes(activeDungeon.currId)) completedDungeons.push(activeDungeon.currId);
        document.getElementById('character-jail').innerText = "🤩"; 
        document.getElementById('prison-scene').classList.add('freed');
        confetti({ particleCount: 150 });
        Swal.fire('BERHASIL!', 'Tahanan bebas!', 'success');
    } else {
        Swal.fire('Salah!', 'Cek hitunganmu.', 'error');
    }
}
update();
