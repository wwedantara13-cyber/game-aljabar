const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const actionBtn = document.getElementById('action-button');

const bgImage = new Image();
bgImage.src = 'dungeon-bg.png'; // Pastikan file ini ada
let bgLoaded = false;
bgImage.onload = () => bgLoaded = true;

let completedDungeons = [];
let activeDungeon = null;
let nearDungeonId = null;

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

let player = { x: 0, y: 0, speed: 5 };
let moveDir = { x: 0, y: 0 }, isDragging = false;

function init() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    player.x = canvas.width / 2; player.y = canvas.height / 2;
}
window.addEventListener('resize', init);
init();

// Joystick Logic
const stick = document.getElementById('joystick-stick');
const base = document.getElementById('joystick-base');
const handleMove = (e) => {
    if(!isDragging) return;
    const pos = e.touches ? e.touches[0] : e;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
    let dx = pos.clientX - cx, dy = pos.clientY - cy;
    const dist = Math.sqrt(dx*dx + dy*dy), max = rect.width/2;
    if(dist > max) { dx *= max/dist; dy *= max/dist; }
    stick.style.left = `calc(50% + ${dx}px)`; stick.style.top = `calc(50% + ${dy}px)`;
    moveDir = { x: dx/max, y: dy/max };
};
base.addEventListener('mousedown', () => isDragging = true);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', () => { isDragging = false; moveDir = {x:0,y:0}; stick.style.left="50%"; stick.style.top="50%"; });
base.addEventListener('touchstart', (e) => { e.preventDefault(); isDragging = true; }, {passive:false});
window.addEventListener('touchmove', (e) => { e.preventDefault(); handleMove(e); }, {passive:false});
window.addEventListener('touchend', () => { isDragging = false; moveDir = {x:0,y:0}; stick.style.left="50%"; stick.style.top="50%"; });

function update() {
    if(!activeDungeon) {
        player.x += moveDir.x * player.speed;
        player.y += moveDir.y * player.speed;
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
            if(completedDungeons.includes(nearDungeonId)) {
                actionBtn.innerText = `GOA ${nearDungeonId} (SELESAI)`;
                actionBtn.style.background = "#eab308";
            } else {
                actionBtn.innerText = `MASUK GOA ${nearDungeonId} (E)`;
                actionBtn.style.background = "#00ff87";
            }
        } else actionBtn.classList.remove('show');
    }
    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0,0, canvas.width, canvas.height);
    if(bgLoaded) ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    dungeons.forEach(d => {
        const dx = d.x * canvas.width, dy = d.y * canvas.height;
        if(completedDungeons.includes(d.id)) {
            ctx.beginPath(); ctx.arc(dx, dy, 30, 0, Math.PI*2);
            ctx.fillStyle = "rgba(234, 179, 8, 0.4)"; ctx.fill();
            ctx.strokeStyle = "#eab308"; ctx.lineWidth = 3; ctx.stroke();
            ctx.fillStyle = "#eab308"; ctx.font = "bold 20px Arial"; ctx.fillText("✔", dx-8, dy+8);
        }
    });
    ctx.fillStyle = "#00ff87"; ctx.shadowBlur = 15; ctx.shadowColor = "#00ff87";
    ctx.fillRect(player.x-12, player.y-12, 25, 25); ctx.shadowBlur = 0;
}

function confirmEntry() {
    if(nearDungeonId) {
        activeDungeon = databaseSoal[nearDungeonId] || databaseSoal[1];
        activeDungeon.id = nearDungeonId;
        document.getElementById('dungeon-info-text').innerText = `📍 GOA ${nearDungeonId}`;
        document.getElementById('puzzle-overlay').classList.remove('hidden');
        resetPuzzle();
    }
}
window.addEventListener('keydown', (e) => { if(e.key.toLowerCase()==='e') confirmEntry(); });

function exitDungeon() { activeDungeon = null; document.getElementById('puzzle-overlay').classList.add('hidden'); player.y += 80; }

function resetPuzzle() {
    document.getElementById('prison-scene').classList.remove('freed');
    document.getElementById('character-jail').innerText = "😭";
    document.querySelector('.puzzle-container').style.borderColor = "var(--primary)";
    document.getElementById('stage-1').style.display = 'block';
    document.getElementById('stage-2').style.display = 'none';
    document.getElementById('display-soal').innerText = activeDungeon.teks;
    document.getElementById('ans-1').value = ""; document.getElementById('ans-2').value = "";
    document.getElementById('zone-v1').innerHTML = `<p>Wadah ${activeDungeon.v1.toUpperCase()}</p>`;
    document.getElementById('zone-v2').innerHTML = `<p>Wadah ${activeDungeon.v2.toUpperCase()}</p>`;
    const container = document.getElementById('drag-items-container'); container.innerHTML = "";
    activeDungeon.item.forEach((s, i) => {
        const div = document.createElement('div'); div.className = "item"; div.draggable = true; div.id = `it-${i}`;
        div.innerText = s.t; div.dataset.v = s.v;
        div.addEventListener('dragstart', e => e.dataTransfer.setData("text", e.target.id));
        container.appendChild(div);
    });
}

function allowDrop(ev) { ev.preventDefault(); }
function drop(ev) {
    ev.preventDefault(); const dataId = ev.dataTransfer.getData("text");
    const el = document.getElementById(dataId); if(ev.target.classList.contains('zone')) ev.target.appendChild(el);
}

function validateStage1() {
    const v1 = document.querySelectorAll('#zone-v1 .item'), v2 = document.querySelectorAll('#zone-v2 .item');
    if(v1.length + v2.length < 4) return Swal.fire('Belum Lengkap!', 'Pindahkan semua!', 'warning');
    let salah = false;
    v1.forEach(it => { if(it.dataset.v !== activeDungeon.v1) salah = true; });
    v2.forEach(it => { if(it.dataset.v !== activeDungeon.v2) salah = true; });
    if(salah) return Swal.fire('Salah Wadah!', 'Suku belum sejenis.', 'error');
    document.getElementById('stage-1').style.display = 'none';
    document.getElementById('stage-2').style.display = 'block';
    setTimeout(() => document.getElementById('ans-1').focus(), 150);
}

function addPower(tid) { const inp = document.getElementById(tid); inp.value += "^2"; inp.focus(); }

function checkLock() {
    let a1 = document.getElementById('ans-1').value.trim().toLowerCase().replace('²', '^2');
    let a2 = document.getElementById('ans-2').value.trim().toLowerCase().replace('²', '^2');
    const k1 = activeDungeon.kunci[0].toLowerCase().replace('²', '^2');
    const k2 = activeDungeon.kunci[1].toLowerCase().replace('²', '^2');
    if(a1 === k1 && a2 === k2) {
        if(!completedDungeons.includes(activeDungeon.id)) completedDungeons.push(activeDungeon.id);
        document.querySelector('.puzzle-container').style.borderColor = "var(--success)";
        document.getElementById('character-jail').innerText = "🤩"; 
        document.getElementById('prison-scene').classList.add('freed');
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        Swal.fire('BERHASIL!', 'Tahanan bebas!', 'success');
    } else {
        document.getElementById('character-jail').innerText = "😰";
        setTimeout(() => { if(!document.getElementById('prison-scene').classList.contains('freed')) document.getElementById('character-jail').innerText = "😭"; }, 1000);
        Swal.fire('Salah!', 'Cek hitunganmu.', 'error');
    }
}
update();