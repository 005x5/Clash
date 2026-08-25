// ===================== ARENA CLASH =====================
// An original lane-based card battler: charge your elixir,
// deploy troops, and knock down the enemy towers.
// =========================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const elixirBar = document.getElementById('elixirBar');
const elixirLabel = document.getElementById('elixirLabel');
const handEl = document.getElementById('hand');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlayText');
const restartBtn = document.getElementById('restartBtn');
const hint = document.getElementById('hint');

const MID_Y = H / 2;
const LANES_X = [110, 290]; // left lane, right lane center-x guides

// ---------- Card / unit definitions (original names & stats) ----------
const CARD_DB = [
  { id: 'swordsman', name: 'Swordsman', icon: '🗡️', cost: 3, hp: 220, dmg: 30, range: 22, speed: 40, atkSpeed: 1.0, radius: 12, color: '#e0e0e0', count: 1 },
  { id: 'bowman',    name: 'Bowman',    icon: '🏹', cost: 3, hp: 90,  dmg: 22, range: 90, speed: 45, atkSpeed: 0.9, radius: 10, color: '#8be08b', count: 2, spread: 14 },
  { id: 'brute',     name: 'Brute',     icon: '🪓', cost: 5, hp: 520, dmg: 55, range: 24, speed: 30, atkSpeed: 1.4, radius: 16, color: '#e08b5a', count: 1 },
  { id: 'scout',     name: 'Scout',     icon: '🐎', cost: 2, hp: 130, dmg: 18, range: 20, speed: 75, atkSpeed: 0.8, radius: 10, color: '#5ab6e0', count: 1 },
  { id: 'firebolt',  name: 'Fire Bolt', icon: '🔥', cost: 4, spell: true, dmg: 140, radius: 55, color: '#ff6a3d' },
  { id: 'shieldbot', name: 'Shieldbot', icon: '🛡️', cost: 4, hp: 260, dmg: 14, range: 20, speed: 25, atkSpeed: 1.0, radius: 13, color: '#c9b458', count: 1 },
];

function cardById(id) { return CARD_DB.find(c => c.id === id); }

// ---------- Game state ----------
let state;

function freshState() {
  return {
    running: true,
    time: 0,
    player: {
      elixir: 5,
      hand: [],
      deck: shuffle(CARD_DB.map(c => c.id)),
      selected: null,
      towers: makeTowers('player'),
    },
    enemy: {
      elixir: 5,
      deck: shuffle(CARD_DB.map(c => c.id)),
      timer: 2.5,
      towers: makeTowers('enemy'),
    },
    units: [],       // troops on field
    effects: [],      // transient visuals (spell blasts, hits)
    nextId: 1,
  };
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeTowers(side) {
    const isPlayer = side === 'player';
    const kingY = isPlayer ? H - 40 : 40;
    const princessY = isPlayer ? H - 130 : 130;
    return [
    { id: side + '-king', side, kind: 'king', x: W / 2, y: kingY, hp: 1400, maxHp: 1400, dmg: 50, range: 90, atkSpeed: 1.0, cd: 0, active: isPlayer ? false : false, alive: true },
    { id: side + '-left', side, kind: 'princess', x: LANES_X[0], y: princessY, hp: 800, maxHp: 800, dmg: 40, range: 100, atkSpeed: 0.8, cd: 0, active: true, alive: true },
    { id: side + '-right', side, kind: 'princess', x: LANES_X[1], y: princessY, hp: 800, maxHp: 800, dmg: 40, range: 100, atkSpeed: 0.8, cd: 0, active: true, alive: true },
  ];
}

function drawHandFromDeck(p) {
  while (p.hand.length < 4) {
    if (p.deck.length === 0) p.deck = shuffle(CARD_DB.map(c => c.id));
    p.hand.push(p.deck.pop());
  }
}

function init() {
  state = freshState();
  drawHandFromDeck(state.player);
  overlay.style.display = 'none';
  renderHand();
  requestAnimationFrame(loop);
}

// ---------- Hand UI ----------
function renderHand() {
  handEl.innerHTML = '';
  state.player.hand.forEach((cardId, idx) => {
    const card = cardById(cardId);
    const div = document.createElement('div');
    div.className = 'card' + (state.player.selected === idx ? ' selected' : '') + (card.cost > state.player.elixir ? ' disabled' : '');
    div.innerHTML = `
      <div class="cost">${card.cost}</div>
      <div class="icon">${card.icon}</div>
      <div class="name">${card.name}</div>
    `;
    div.onclick = () => {
      if (card.cost > state.player.elixir) return;
      state.player.selected = (state.player.selected === idx) ? null : idx;
      renderHand();
      hint.textContent = state.player.selected !== null
        ? 'Tap your half of the field to deploy'
        : 'Tap a card, then tap your half of the field to deploy';
    };
    handEl.appendChild(div);
  });
}

canvas.addEventListener('click', (e) => {
  if (!state.running) return;
  if (state.player.selected === null) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (W / rect.width);
  const y = (e.clientY - rect.top) * (H / rect.height);
  if (y < MID_Y + 30) { hint.textContent = "You can only deploy on your half!"; return; }

  const idx = state.player.selected;
  const cardId = state.player.hand[idx];
  const card = cardById(cardId);
  if (card.cost > state.player.elixir) return;

  playCard('player', card, x, y);
  state.player.elixir -= card.cost;
  state.player.hand.splice(idx, 1);
  drawHandFromDeck(state.player);
  state.player.selected = null;
  renderHand();
  hint.textContent = 'Tap a card, then tap your half of the field to deploy';
});

function playCard(side, card, x, y) {
  if (card.spell) {
    state.effects.push({ type: 'blast', x, y, r: card.radius, t: 0.4, color: card.color });
    const targets = state.units.filter(u => u.side !== side && dist(u.x, u.y, x, y) <= card.radius);
    targets.forEach(u => damageUnit(u, card.dmg));
    const enemyTowers = (side === 'player' ? state.enemy.towers : state.player.towers);
    enemyTowers.forEach(t => { if (t.alive && dist(t.x, t.y, x, y) <= card.radius) damageTower(t, card.dmg); });
    return;
  }
  const count = card.count || 1;
  for (let i = 0; i < count; i++) {
    const offset = count > 1 ? (i - (count - 1) / 2) * (card.spread || 20) : 0;
    state.units.push(makeUnit(side, card, x + offset, y));
  }
}

function makeUnit(side, card, x, y) {
  return {
    id: state.nextId++,
    side,
    cardId: card.id,
    name: card.name,
    x, y,
    hp: card.hp,
    maxHp: card.hp,
    dmg: card.dmg,
    range: card.range,
    speed: card.speed,
    atkSpeed: card.atkSpeed,
    radius: card.radius,
    color: card.color,
    cd: 0,
    target: null,
  };
}

function dist(x1, y1, x2, y2) { return Math.hypot(x1 - x2, y1 - y2); }

// ---------- AI ----------
function aiTick(dt) {
  const ai = state.enemy;
  ai.elixir = Math.min(10, ai.elixir + dt / 2.8);
  ai.timer -= dt;
  if (ai.timer <= 0) {
    ai.timer = 2 + Math.random() * 2.5;
    const affordable = ai.deck.filter(id => cardById(id).cost <= ai.elixir);
    if (affordable.length > 0) {
      const pick = affordable[Math.floor(Math.random() * affordable.length)];
      const card = cardById(pick);
      const lane = Math.random() < 0.5 ? LANES_X[0] : LANES_X[1];
      const y = 90 + Math.random() * 60;
      playCard('enemy', card, lane + (Math.random() * 30 - 15), y);
      ai.elixir -= card.cost;
      ai.deck.splice(ai.deck.indexOf(pick), 1);
      if (ai.deck.length === 0) ai.deck = shuffle(CARD_DB.map(c => c.id));
    }
  }
}

// ---------- Combat / movement ----------
function damageUnit(u, amount) {
  u.hp -= amount;
  state.effects.push({ type: 'hit', x: u.x, y: u.y, t: 0.15 });
}

function damageTower(t, amount) {
  t.hp -= amount;
  state.effects.push({ type: 'hit', x: t.x, y: t.y, t: 0.15 });
  if (t.hp <= 0) {
    t.hp = 0;
    t.alive = false;
    if (t.kind === 'princess') {
      const towers = t.side === 'player' ? state.player.towers : state.enemy.towers;
      const king = towers.find(tt => tt.kind === 'king');
      if (king) king.active = true;
    }
    if (t.kind === 'king') endGame(t.side === 'player' ? 'enemy' : 'player');
  }
}

function nearestEnemy(u) {
  let best = null, bestD = Infinity;
  for (const o of state.units) {
    if (o.side === u.side || o.hp <= 0) continue;
    const d = dist(u.x, u.y, o.x, o.y);
    if (d < bestD) { bestD = d; best = { obj: o, d, isTower: false }; }
  }
  const towers = u.side === 'player' ? state.enemy.towers : state.player.towers;
  for (const t of towers) {
    if (!t.alive) continue;
    if (t.kind === 'king' && !t.active) continue;
    const d = dist(u.x, u.y, t.x, t.y);
    if (d < bestD) { bestD = d; best = { obj: t, d, isTower: true }; }
  }
  return best;
}

function updateUnits(dt) {
  for (const u of state.units) {
    if (u.hp <= 0) continue;
    const nearest = nearestEnemy(u);
    if (nearest && nearest.d <= u.range + nearest.obj.radius) {
      u.cd -= dt;
      if (u.cd <= 0) {
        u.cd = u.atkSpeed;
        if (nearest.isTower) damageTower(nearest.obj, u.dmg);
        else damageUnit(nearest.obj, u.dmg);
      }
    } else {
      const dir = (u.side === 'player') ? -1 : 1;
      let moveX = 0;
      let targetX = nearest ? nearest.obj.x : (u.x < W / 2 ? LANES_X[0] : LANES_X[1]);
      if (Math.abs(u.x - targetX) > 4) moveX = Math.sign(targetX - u.x) * u.speed * 0.35;
      u.x += moveX * dt;
      u.y += dir * u.speed * dt;
      u.x = Math.max(20, Math.min(W - 20, u.x));
      u.y = Math.max(20, Math.min(H - 20, u.y));
    }
  }
  state.units = state.units.filter(u => u.hp > 0);
}

function towerAttacks(dt) {
  const allTowers = [...state.player.towers, ...state.enemy.towers];
  for (const t of allTowers) {
    if (!t.alive) continue;
    if (t.kind === 'king' && !t.active) continue;
    t.cd -= dt;
    if (t.cd > 0) continue;
    let best = null, bestD = Infinity;
    for (const u of state.units) {
      if (u.side === t.side) continue;
      const d = dist(t.x, t.y, u.x, u.y);
      if (d <= t.range && d < bestD) { bestD = d; best = u; }
    }
    if (best) { t.cd = t.atkSpeed; damageUnit(best, t.dmg); state.effects.push({ type: 'line', x1: t.x, y1: t.y, x2: best.x, y2: best.y, t: 0.12 }); }
  }
}

function endGame(winnerSide) {
  state.running = false;
  overlayText.textContent = winnerSide === 'player' ? '🏆 Victory!' : '💀 Defeat...';
  overlay.style.display = 'flex';
}

// ---------- Rendering ----------
function draw() {
  ctx.clearRect(0, 0, W, H);

  // field background stripes
  ctx.fillStyle = '#3a6b2e';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let y = 0; y < H; y += 40) ctx.fillRect(0, y, W, 20);

  // river / mid line
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(0, MID_Y);
  ctx.lineTo(W, MID_Y);
  ctx.stroke();
  ctx.setLineDash([]);

  // towers
  [...state.player.towers, ...state.enemy.towers].forEach(drawTower);

  // units
  state.units.forEach(drawUnit);

  // effects
  state.effects.forEach(drawEffect);
}

function drawTower(t) {
  const w = t.kind === 'king' ? 46 : 34;
  const h = t.kind === 'king' ? 34 : 26;
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.fillStyle = t.alive ? (t.side === 'player' ? '#4b7bd6' : '#d64b4b') : '#555';
  if (!t.alive) ctx.globalAlpha = 0.35;
  roundRect(ctx, -w/2, -h/2, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  if (t.alive) {
    const barW = w;
    const pct = Math.max(0, t.hp / t.maxHp);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(t.x - barW/2, t.y - h/2 - 10, barW, 5);
    ctx.fillStyle = pct > 0.3 ? '#5adf5a' : '#df5a5a';
    ctx.fillRect(t.x - barW/2, t.y - h/2 - 10, barW * pct, 5);
  }
}

function drawUnit(u) {
  ctx.save();
  ctx.translate(u.x, u.y);
  ctx.fillStyle = u.color;
  ctx.beginPath();
  ctx.arc(0, 0, u.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = u.side === 'player' ? '#2255cc' : '#cc2222';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  const pct = Math.max(0, u.hp / u.maxHp);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(u.x - u.radius, u.y - u.radius - 8, u.radius * 2, 4);
  ctx.fillStyle = pct > 0.3 ? '#5adf5a' : '#df5a5a';
  ctx.fillRect(u.x - u.radius, u.y - u.radius - 8, u.radius * 2 * pct, 4);
}

function drawEffect(fx) {
  if (fx.type === 'blast') {
    ctx.save();
    ctx.globalAlpha = Math.max(0, fx.t / 0.4) * 0.6;
    ctx.fillStyle = fx.color;
    ctx.beginPath();
    ctx.arc(fx.x, fx.y, fx.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (fx.type === 'hit') {
    ctx.save();
    ctx.globalAlpha = Math.max(0, fx.t / 0.15);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(fx.x, fx.y, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (fx.type === 'line') {
    ctx.save();
    ctx.globalAlpha = Math.max(0, fx.t / 0.12);
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx.x1, fx.y1);
    ctx.lineTo(fx.x2, fx.y2);
    ctx.stroke();
    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---------- Main loop ----------
let lastTime = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  if (state.running) {
    state.time += dt;
    state.player.elixir = Math.min(10, state.player.elixir + dt / 2.8);
    aiTick(dt);
    updateUnits(dt);
    towerAttacks(dt);

    state.effects.forEach(fx => fx.t -= dt);
    state.effects = state.effects.filter(fx => fx.t > 0);

    elixirBar.style.width = (state.player.elixir / 10 * 100) + '%';
    elixirLabel.textContent = state.player.elixir.toFixed(1) + ' / 10';
    renderHand();
  }

  draw();
  requestAnimationFrame(loop);
}

restartBtn.onclick = init;

init();
