'use strict';
// =================================================================
//  ARENA CLASH — Mobile Edition
//  Deck (8) · Shop · 12 Arenen · Deutsch/Englisch · Touch & Drag
// =================================================================
const $ = id => document.getElementById(id);
const KEY = 'arenaClash_v1';          // Gast-Spielstand
const USERS = 'arenaClash_users', SESSION = 'arenaClash_session', LANGK = 'arenaClash_lang';
const BADGES = { '005x5': '👾' };      // Spezial-Emoji für bestimmte Accounts
const STARTERS = ['knight', 'archer', 'goblin'];
const PEN_XP = 25, PEN_COINS = 20;     // Strafe fürs Verlassen eines Kampfes
const lsGet = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

let LANG = localStorage.getItem(LANGK) || ((navigator.language || 'de').toLowerCase().startsWith('de') ? 'de' : 'en');
let USER = null;          // { key, name, guest }
let authMode = 'login';
function fresh() {
  return { level: 1, xp: 0, coins: 200, wins: 0, losses: 0, trophies: 0, battle: 0, cl: {},
    owned: STARTERS.slice(), decks: [STARTERS.slice(), [], [], [], []], di: 0, arena: 0 };
}
let S = fresh();
const saveKey = () => USER.guest ? KEY : 'arenaClash_u_' + USER.key;
const save = () => { if (USER) lsSet(saveKey(), S); };
const dk = () => S.decks[S.di];
function loadSave() {
  const s = lsGet(saveKey()), f = fresh();
  if (s && !s.decks) s.decks = [s.deck || STARTERS.slice(), [], [], [], []];
  return s ? { ...f, ...s } : f;
}

// ---------- Sprachen ----------
const L = {
  de: {
    battle: 'KAMPF', battleNav: 'Kampf', shop: 'Shop', cards: 'Karten', arenas: 'Arenen', cont: '▶ Weiter',
    settings: '⚙️ Einstellungen', lang: 'Sprache', reset: 'Fortschritt löschen', close: 'Schließen',
    resetQ: 'Wirklich den gesamten Fortschritt löschen?', arena: 'Arena', next: 'Nächste:',
    deck: 'Dein Deck', coll: 'Sammlung', hint: 'Tippe eine Karte, um sie ins Deck zu legen oder zu entfernen (max. 4, mind. 4 zum Spielen)',
    deckFull: 'Deck ist voll (max. 4)', deckMin: 'Mindestens 1 Karte im Deck!', need4: 'Du brauchst mind. 4 Karten im Deck!',
    buyFirst: 'Erst im Shop kaufen!', owned: '✓ Besitzt', noCoins: 'Zu wenig Coins!', bought: 'freigeschaltet!',
    noElix: 'Zu wenig Elixier!', onlyHalf: 'Nur in deiner Hälfte!', win: '🏆 Sieg!', loss: '💀 Niederlage', draw: '🤝 Unentschieden',
    lvlUp: '⭐ Level {n} erreicht!', active: 'AKTIV', pick: 'WÄHLEN', lvl: 'Level', reward: 'Belohnung', switched: 'Arena gewechselt!'
  },
  en: {
    battle: 'BATTLE', battleNav: 'Battle', shop: 'Shop', cards: 'Cards', arenas: 'Arenas', cont: '▶ Continue',
    settings: '⚙️ Settings', lang: 'Language', reset: 'Reset progress', close: 'Close',
    resetQ: 'Really delete all progress?', arena: 'Arena', next: 'Next:',
    deck: 'Your Deck', coll: 'Collection', hint: 'Tap a card to add/remove it (max. 4, at least 4 to play)',
    deckFull: 'Deck is full (max. 4)', deckMin: 'Keep at least 1 card in your deck!', need4: 'You need at least 4 cards in your deck!',
    buyFirst: 'Buy it in the shop first!', owned: '✓ Owned', noCoins: 'Not enough coins!', bought: 'unlocked!',
    noElix: 'Not enough elixir!', onlyHalf: 'Only on your side!', win: '🏆 Victory!', loss: '💀 Defeat', draw: '🤝 Draw',
    lvlUp: '⭐ Reached level {n}!', active: 'ACTIVE', pick: 'SELECT', lvl: 'Level', reward: 'Reward', switched: 'Arena switched!'
  }
};
Object.assign(L.de, {
  lv: 'Lv', maxed: 'Schon auf Maximal-Level!',
  need3: 'Du brauchst mind. 3 Karten im Deck!',
  hint: 'Tippe eine Karte, um sie ins Deck zu legen oder zu entfernen (max. 4, mind. 3 zum Spielen)',
  login: 'Anmelden', register: 'Registrieren', username: 'Benutzername', password: 'Passwort', password2: 'Passwort wiederholen',
  guest: '👤 Als Gast spielen', logout: 'Abmelden / Konto wechseln', guestName: 'Gast',
  errName: 'Name: 3–16 Zeichen (Buchstaben, Zahlen, _ . -)', errPw: 'Passwort: mind. 4 Zeichen', errExists: 'Name ist schon vergeben',
  errBad: 'Name oder Passwort falsch', errMatch: 'Passwörter stimmen nicht überein',
  leaveT: '⚠️ Kampf verlassen?',
  leaveW: 'Wenn du jetzt gehst, zählt der Kampf als Niederlage: du verlierst {x} XP, {c} Münzen und 15 Trophäen.',
  stay: '▶ Weiterkämpfen', leaveGo: 'Verlassen (Niederlage)',
  crashPen: 'Kampf abgebrochen: Niederlage! −{x} XP, −{c} 🪙'
});
Object.assign(L.en, {
  lv: 'Lv', maxed: 'Already at max level!',
  need3: 'You need at least 3 cards in your deck!',
  hint: 'Tap a card to add/remove it (max. 4, at least 3 to play)',
  login: 'Log in', register: 'Register', username: 'Username', password: 'Password', password2: 'Repeat password',
  guest: '👤 Play as guest', logout: 'Log out / switch account', guestName: 'Guest',
  errName: 'Name: 3–16 characters (letters, numbers, _ . -)', errPw: 'Password: at least 4 characters', errExists: 'Name is already taken',
  errBad: 'Wrong username or password', errMatch: 'Passwords do not match',
  leaveT: '⚠️ Leave battle?',
  leaveW: 'If you leave now, the battle counts as a defeat: you lose {x} XP, {c} coins and 15 trophies.',
  stay: '▶ Keep fighting', leaveGo: 'Leave (defeat)',
  crashPen: 'Battle abandoned: defeat! −{x} XP, −{c} 🪙'
});
const t = k => L[LANG][k] || k;
const li = () => (LANG === 'de' ? 0 : 1);
function applyLang() {
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-t]').forEach(e => e.textContent = t(e.dataset.t));
  document.querySelectorAll('.lg').forEach(b => b.classList.toggle('on', b.dataset.l === LANG));
  $('uN').placeholder = t('username'); $('uP').placeholder = t('password'); $('uP2').placeholder = t('password2');
  $('aGo').textContent = t(authMode);
}

// ---------- Karten (c=Kosten, n=Anzahl, fly=fliegt, tOnly=nur Türme) ----------
const CARDS = {
  skeleton: { c: 1, n: 3, hp: 70,   d: 26,  sp: 1.7,  r: 18,  as: .6,  col: '#e8e8e8', ic: '💀', rad: 9,  p: 0,   rg: 0, nm: ['Skelette', 'Skeletons'] },
  goblin:   { c: 2, n: 2, hp: 140,  d: 30,  sp: 1.6,  r: 20,  as: .7,  col: '#88ff22', ic: '👺', rad: 10, p: 0,   rg: 0, nm: ['Goblins', 'Goblins'] },
  knight:   { c: 3, n: 1, hp: 380,  d: 55,  sp: 1.15, r: 26,  as: 1.0, col: '#4488ff', ic: '🛡️', rad: 14, p: 0,   rg: 0, nm: ['Ritter', 'Knight'] },
  archer:   { c: 3, n: 1, hp: 220,  d: 32,  sp: 1.05, r: 190, as: 1.1, col: '#44ff88', ic: '🏹', rad: 12, p: 0,   rg: 1, nm: ['Bogenschütze', 'Archer'] },
  bomber:   { c: 3, n: 1, hp: 190,  d: 70,  sp: .95,  r: 120, as: 1.5, col: '#ff7755', ic: '💣', rad: 12, p: 0,   rg: 1, nm: ['Bomber', 'Bomber'] },
  musketeer:{ c: 4, n: 1, hp: 250,  d: 60,  sp: .9,   r: 200, as: 1.0, col: '#ffcc66', ic: '🎯', rad: 13, p: 0,   rg: 1, nm: ['Musketier', 'Musketeer'] },
  valkyrie: { c: 4, n: 1, hp: 600,  d: 55,  sp: 1.0,  r: 28,  as: 1.1, col: '#ff9966', ic: '🪓', rad: 14, p: 250, rg: 0, nm: ['Walküre', 'Valkyrie'] },
  hog:      { c: 4, n: 1, hp: 520,  d: 80,  sp: 1.9,  r: 24,  as: 1.5, col: '#cc8844', ic: '🐗', rad: 15, p: 350, rg: 0, tOnly: 1, nm: ['Schweinereiter', 'Hog Rider'] },
  mage:     { c: 4, n: 1, hp: 260,  d: 75,  sp: .9,   r: 155, as: 1.4, col: '#cc44ff', ic: '🧙', rad: 13, p: 300, rg: 1, nm: ['Magier', 'Mage'] },
  dragon:   { c: 4, n: 1, hp: 400,  d: 70,  sp: 1.1,  r: 110, as: 1.3, col: '#ff6633', ic: '🐲', rad: 15, p: 400, rg: 1, fly: 1, nm: ['Baby-Drache', 'Baby Dragon'] },
  giant:    { c: 5, n: 1, hp: 1200, d: 95,  sp: .65,  r: 28,  as: 1.5, col: '#ff8844', ic: '👹', rad: 18, p: 300, rg: 0, tOnly: 1, nm: ['Riese', 'Giant'] },
  prince:   { c: 5, n: 1, hp: 650,  d: 120, sp: 1.3,  r: 28,  as: 1.3, col: '#4488dd', ic: '🐴', rad: 16, p: 450, rg: 0, nm: ['Prinz', 'Prince'] },
  wizard:   { c: 5, n: 1, hp: 200,  d: 110, sp: .85,  r: 175, as: 1.6, col: '#22ddff', ic: '🧙‍♂️', rad: 13, p: 500, rg: 1, nm: ['Zauberer', 'Wizard'] },
  pekka:    { c: 7, n: 1, hp: 1500, d: 260, sp: .7,   r: 28,  as: 1.8, col: '#6677aa', ic: '🤖', rad: 18, p: 800, rg: 0, nm: ['P.E.K.K.A', 'P.E.K.K.A'] },
  minion:     { c: 3, n: 3, hp: 90,   d: 35,  sp: 1.8,  r: 20,  as: .9,  col: '#6aa0ff', ic: '🦇', rad: 10, p: 200, rg: 0, fly: 1, nm: ['Wichte', 'Minions'] },
  lumberjack: { c: 4, n: 1, hp: 420,  d: 110, sp: 1.5,  r: 24,  as: 1.0, col: '#cc5522', ic: '🪵', rad: 14, p: 380, rg: 0, nm: ['Holzfäller', 'Lumberjack'] },
  electro:    { c: 4, n: 1, hp: 240,  d: 50,  sp: .95,  r: 170, as: .6,  col: '#66ddff', ic: '⚡', rad: 12, p: 420, rg: 1, nm: ['Elektro-Magier', 'Electro Mage'] },
  barbarian:  { c: 5, n: 3, hp: 300,  d: 50,  sp: 1.2,  r: 24,  as: 1.1, col: '#ffb04a', ic: '🧔', rad: 12, p: 350, rg: 0, nm: ['Barbaren', 'Barbarians'] },
  witch:      { c: 5, n: 1, hp: 300,  d: 60,  sp: .9,   r: 160, as: 1.1, col: '#bb66ff', ic: '🧙‍♀️', rad: 13, p: 550, rg: 1, nm: ['Hexe', 'Witch'] },
  golem:      { c: 8, n: 1, hp: 2600, d: 130, sp: .55,  r: 30,  as: 1.8, col: '#998877', ic: '🗿', rad: 20, p: 900, rg: 0, tOnly: 1, nm: ['Golem', 'Golem'] },
  bandit:     { c: 3, n: 1, hp: 350,  d: 75,  sp: 1.9,  r: 24,  as: .9,  col: '#8899aa', ic: '🥷', rad: 13, p: 320, rg: 0, nm: ['Banditin', 'Bandit'] },
  princess:   { c: 3, n: 1, hp: 140,  d: 45,  sp: .9,   r: 260, as: 1.4, col: '#ff88cc', ic: '👸', rad: 11, p: 380, rg: 1, nm: ['Prinzessin', 'Princess'] },
  royalghost: { c: 3, n: 1, hp: 280,  d: 60,  sp: 1.3,  r: 24,  as: 1.0, col: '#aabbee', ic: '👻', rad: 12, p: 360, rg: 0, nm: ['Königsgeist', 'Royal Ghost'] },
  icewiz:     { c: 4, n: 1, hp: 240,  d: 45,  sp: .95,  r: 165, as: .9,  col: '#88ddff', ic: '🧊', rad: 12, p: 400, rg: 1, nm: ['Eismagier', 'Ice Mage'] },
  ram:        { c: 4, n: 1, hp: 580,  d: 95,  sp: 1.7,  r: 26,  as: 1.4, col: '#bb8855', ic: '🐏', rad: 15, p: 420, rg: 0, tOnly: 1, nm: ['Rammbock', 'Battering Ram'] },
  darkprince: { c: 4, n: 1, hp: 500,  d: 85,  sp: 1.2,  r: 26,  as: 1.1, col: '#5544aa', ic: '🌑', rad: 15, p: 450, rg: 0, nm: ['Dunkler Prinz', 'Dark Prince'] },
  balloon:    { c: 5, n: 1, hp: 1000, d: 200, sp: .8,   r: 22,  as: 2.0, col: '#ff6677', ic: '🎈', rad: 16, p: 600, rg: 0, fly: 1, tOnly: 1, nm: ['Ballon', 'Balloon'] },
  megaknight: { c: 7, n: 1, hp: 2000, d: 190, sp: 1.0,  r: 30,  as: 1.7, col: '#556677', ic: '🦾', rad: 19, p: 850, rg: 0, nm: ['Mega-Ritter', 'Mega Knight'] }
};
// rv = Flussfarben, th = Rasterfarben
// th=Boden, pat=Muster (0 Schach,1 Streifen,2 Diagonal,3 Punkte), pt=Wege, rv/wv=Fluss, br=Brücke, dec/dec2=Deko
const mkA = (n, ic, lv, rw, o) => ({ n, ic, lv, rw, ...o });
const ARENAS = [
  mkA(['Trainingslager', 'Training Camp'], '🏟️', 1, 30, { th: ['#6aa84f', '#62a049'], pat: 0, pt: '#e0c88c80', dec: '🌳', dec2: '🌼', br: ['#9a6a38', '#3a2410'] }),
  mkA(['Goblin-Stadion', 'Goblin Stadium'], '👺', 2, 45, { th: ['#7aa83a', '#6c9a30'], pat: 1, pt: '#d9c08a80', dec: '🌲', dec2: '🍄', br: ['#8a5a2c', '#2e1c0a'] }),
  mkA(['Knochengrube', 'Bone Pit'], '💀', 3, 60, { th: ['#6a6a7a', '#5e5e6c'], pat: 3, pt: '#b0a89488', dec: '🪦', dec2: '💀', br: ['#bdb5a2', '#4a4438'], rv: ['#4a6a5a', '#2e4a3e'] }),
  mkA(['Barbaren-Arena', 'Barbarian Arena'], '⚔️', 4, 75, { th: ['#d8b36a', '#cfa95f'], pat: 2, pt: '#a8794080', dec: '🌵', dec2: '🪨', br: ['#7a4a22', '#2a1608'] }),
  mkA(['P.E.K.K.A-Halle', 'P.E.K.K.A Hall'], '🤖', 5, 90, { th: ['#6a7a9a', '#5e6e92'], pat: 0, pt: '#9aa8c880', dec: '⚙️', dec2: '🔩', br: ['#8a9ab8', '#2a3248'], rv: ['#2a5fb8', '#1a3f88'] }),
  mkA(['Königsarena', 'Royal Arena'], '👑', 6, 105, { th: ['#a85a7a', '#9a4e70'], pat: 0, pt: '#f0d08a80', dec: '🌹', dec2: '👑', br: ['#d4aa4a', '#5a420e'] }),
  mkA(['Eispalast', 'Frozen Peak'], '❄️', 7, 120, { th: ['#bfe3ee', '#b2d9e6'], pat: 2, pt: '#ffffffaa', dec: '⛄', dec2: '❄️', br: ['#d8e8f0', '#5a7a90'], rv: ['#7fd0f0', '#4aa6d8'], wv: '#ffffff99' }),
  mkA(['Vulkankrater', 'Volcano Crater'], '🌋', 8, 140, { th: ['#7a4a38', '#6e4232'], pat: 3, pt: '#c8883a70', dec: '🌋', dec2: '🔥', br: ['#3a2a28', '#140c0a'], rv: ['#ff8a2a', '#c8421a'], wv: '#ffd24a88' }),
  mkA(['Geisterschloss', 'Haunted Castle'], '👻', 10, 160, { th: ['#4a4a6a', '#424262'], pat: 1, pt: '#8a8ab080', dec: '🎃', dec2: '🦇', br: ['#5a4a6a', '#1a1228'], rv: ['#5a4aa0', '#3a2a78'], wv: '#c8b8ff66' }),
  mkA(['Dracheninsel', 'Dragon Isle'], '🐲', 12, 185, { th: ['#3f8a6a', '#377e60'], pat: 2, pt: '#e8d89a80', dec: '🌴', dec2: '🥚', br: ['#9a6a38', '#3a2410'], rv: ['#20b8c0', '#10808a'] }),
  mkA(['Himmelsfestung', 'Sky Fortress'], '☁️', 15, 210, { th: ['#9ab6d8', '#8eacd0'], pat: 0, pt: '#ffffffaa', dec: '☁️', dec2: '🕊️', br: ['#f0f4fa', '#7a8aa8'], rv: ['#ddeeff', '#b0c8e8'], wv: '#ffffffcc' }),
  mkA(['Legendenarena', 'Legendary Arena'], '🏆', 18, 250, { th: ['#c8aa4a', '#be9f42'], pat: 3, pt: '#fff0b090', dec: '🗿', dec2: '⭐', br: ['#e8c860', '#6a4a08'], rv: ['#ffd24a', '#d89a10'], wv: '#fff8' }),
  mkA(['Dschungel', 'Jungle'], '🦜', 20, 280, { th: ['#2f8a3a', '#287a32'], pat: 1, pt: '#d8c08a80', dec: '🌴', dec2: '🦜', br: ['#7a5a2a', '#2a1c08'], rv: ['#2aa88a', '#157a62'] }),
  mkA(['Piratenbucht', 'Pirate Bay'], '🏴‍☠️', 22, 310, { th: ['#e0c88a', '#d6bc7c'], pat: 2, pt: '#a8794080', dec: '🌴', dec2: '⚓', br: ['#6a4a22', '#241406'], rv: ['#1a9ad8', '#0a6aa8'] }),
  mkA(['Kristallhöhle', 'Crystal Cave'], '💎', 25, 340, { th: ['#5a4a8a', '#524280'], pat: 3, pt: '#b8a8e880', dec: '💎', dec2: '🔮', br: ['#8a7aca', '#2a1a5a'], rv: ['#7a4ae0', '#4a2ab0'], wv: '#e0d0ff88' }),
  mkA(['Wüstenruinen', 'Desert Ruins'], '🏜️', 28, 370, { th: ['#e8c070', '#dcb264'], pat: 0, pt: '#b88a4a80', dec: '🏺', dec2: '🐍', br: ['#a87a3a', '#3a2208'], rv: ['#58b8d8', '#2a88b0'] }),
  mkA(['Raumstation', 'Space Station'], '🚀', 32, 400, { th: ['#2a2a4a', '#242442'], pat: 3, pt: '#6a6aa080', dec: '🛰️', dec2: '🌟', br: ['#8a9ac0', '#1a2038'], rv: ['#1a1a60', '#0a0a38'], wv: '#8a8aff88' }),
  mkA(['Chaos-Arena', 'Chaos Arena'], '🌀', 36, 450, { th: ['#6a2a6a', '#5e2260'], pat: 1, pt: '#ff80c080', dec: '🌀', dec2: '⚡', br: ['#c040a0', '#3a0a30'], rv: ['#ff40a0', '#a01070'], wv: '#ffd0f088' })
];
const MAXLV = 10;
const lvl = k => (S.cl && S.cl[k]) || 1;
const upCost = k => (40 + CARDS[k].c * 15) * lvl(k);
const xpFor = l => 100 + (l - 1) * 80;
const cn = k => CARDS[k].nm[li()];
const an = a => a.n[li()];

// Spielstand bereinigen / alte Spielstände ergänzen
function sanitize() {
  S.owned = [...new Set([...STARTERS, ...S.owned.filter(k => CARDS[k])])];
  S.decks = S.decks.slice(0, 5); while (S.decks.length < 5) S.decks.push([]);
  S.decks = S.decks.map(d => d.filter(k => CARDS[k] && S.owned.includes(k)).slice(0, 4));
  if (!(S.di >= 0 && S.di < 5)) S.di = 0;
  if (dk().length < 3) S.decks[S.di] = S.owned.slice(0, 3);
  if (!ARENAS[S.arena] || ARENAS[S.arena].lv > S.level) S.arena = 0;
}

// ---------- UI ----------
function toast(m, err) {
  const e = $('toast');
  e.textContent = m;
  e.className = 'o on' + (err ? ' err' : '');
  clearTimeout(e._t);
  e._t = setTimeout(() => e.className = 'o', 1700);
}
function screen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
  $(id).classList.add('on');
}
function cardHTML(k, cls, extra) {
  const c = CARDS[k];
  return `<div class="gc ${cls || ''}" data-k="${k}" style="--c:${c.col}"><i class="el">${c.c}</i><b>${c.ic}</b><span class="o">${cn(k)}</span>${S.owned.includes(k) ? `<em class="lvb o">${t('lv')} ${lvl(k)}</em>` : ''}${extra || ''}</div>`;
}
function renderTop() {
  $('lv').textContent = S.level;
  $('xpf').style.width = Math.min(100, S.xp / xpFor(S.level) * 100) + '%';
  $('xpt').textContent = S.xp + ' / ' + xpFor(S.level);
  $('tr').textContent = S.trophies;
  $('co').textContent = S.coins;
}
function renderBattle() {
  const a = ARENAS[S.arena];
  $('aName').textContent = a.ic + ' ' + an(a);
  $('aSub').textContent = t('arena') + ' ' + (S.arena + 1);
  $('castle').textContent = a.ic === '🏟️' ? '🏰' : a.ic;
  $('scene').style.background = `radial-gradient(circle at 50% 60%,${a.th[0]},${a.th[1]} 55%,#0a1a10)`;
  $('who').textContent = USER.guest ? '👤 ' + t('guestName') : (BADGES[USER.key] || '🙂') + ' ' + USER.name;
  $('miniDeck').innerHTML = dk().map(k => cardHTML(k)).join('');
}
function renderCards() {
  const d = dk();
  let slots = d.map(k => cardHTML(k, 'in')).join('');
  for (let i = d.length; i < 4; i++) slots += '<div class="empty"></div>';
  const tabs = S.decks.map((x, i) => `<button class="dt${i === S.di ? ' on' : ''}" data-d="${i}">${i + 1}</button>`).join('');
  $('v-cards').innerHTML =
    `<h3 class="o">${t('deck')} ${S.di + 1} (${d.length}/4)</h3><div class="dtabs">${tabs}</div><div class="slots">${slots}</div>
     <p class="hint">${t('hint')}</p>
     <h3 class="o">${t('coll')}</h3>
     <div class="grid">${Object.keys(CARDS).map(k => {
       const own = S.owned.includes(k);
       return cardHTML(k, (d.includes(k) ? 'in ' : '') + (own ? '' : 'lock'));
     }).join('')}</div>`;
}
function renderShop() {
  $('v-shop').innerHTML = `<h3 class="o">🛒 ${t('shop')}</h3><div class="grid" style="padding-bottom:12px">${
    Object.keys(CARDS).map(k => {
      const own = S.owned.includes(k);
      const extra = !own ? `<div class="price o">🪙 ${CARDS[k].p}</div>`
        : lvl(k) >= MAXLV ? `<div class="price ok o">MAX</div>`
        : `<div class="price up o">⬆ 🪙 ${upCost(k)}</div>`;
      return cardHTML(k, own ? 'in' : '', extra);
    }).join('')}</div>`;
}
function renderArenas() {
  $('v-arena').innerHTML = `<h3 class="o">🏟️ ${t('arenas')}</h3>` + ARENAS.map((a, i) => {
    const un = S.level >= a.lv, cur = S.arena === i;
    const tag = cur ? `<div class="tag c o">${t('active')}</div>` : un ? `<div class="tag o" data-s="${i}">${t('pick')}</div>` : `<div class="tag l o">Lvl ${a.lv}</div>`;
    return `<div class="ar ${cur ? 'cur' : un ? '' : 'lock'}"><i>${a.ic}</i><div><span class="o">${t('arena')} ${i + 1} · ${an(a)}</span><small>${t('lvl')} ${a.lv} · ${t('reward')} 🪙 ${a.rw}</small></div>${tag}</div>`;
  }).join('');
}
function view(v) {
  document.querySelectorAll('.view').forEach(e => e.classList.toggle('on', e.id === 'v-' + v));
  document.querySelectorAll('.nb').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  ({ battle: renderBattle, cards: renderCards, shop: renderShop, arena: renderArenas })[v]();
}
function renderAll() {
  applyLang(); renderTop();
  view(document.querySelector('.nb.on').dataset.v);
}

$('v-cards').onclick = e => {
  const tb = e.target.closest('[data-d]');
  if (tb) { S.di = +tb.dataset.d; save(); return renderCards(); }
  const el = e.target.closest('[data-k]'); if (!el) return;
  const k = el.dataset.k, d = dk();
  if (!S.owned.includes(k)) return toast(t('buyFirst'), true);
  const i = d.indexOf(k);
  if (i >= 0) { if (d.length <= 1) return toast(t('deckMin'), true); d.splice(i, 1); }
  else { if (d.length >= 4) return toast(t('deckFull'), true); d.push(k); }
  save(); renderCards();
};
$('v-shop').onclick = e => {
  const el = e.target.closest('[data-k]'); if (!el) return;
  const k = el.dataset.k, c = CARDS[k];
  if (S.owned.includes(k)) {            // Karte verbessern
    const l = lvl(k);
    if (l >= MAXLV) return toast(t('maxed'), true);
    const cost = upCost(k);
    if (S.coins < cost) return toast(t('noCoins'), true);
    S.coins -= cost; S.cl[k] = l + 1;
    save(); renderTop(); renderShop();
    return toast('⬆ ' + cn(k) + ' ' + t('lv') + ' ' + (l + 1));
  }
  if (S.coins < c.p) return toast(t('noCoins'), true);
  S.coins -= c.p; S.owned.push(k);
  if (dk().length < 4) dk().push(k);
  save(); renderTop(); renderShop();
  toast('✅ ' + cn(k) + ' ' + t('bought'));
};
$('v-arena').onclick = e => {
  const el = e.target.closest('[data-s]'); if (!el) return;
  S.arena = +el.dataset.s; save(); renderArenas(); toast('🏟️ ' + t('switched'));
};
document.querySelectorAll('.nb').forEach(b => b.onclick = () => view(b.dataset.v));
$('miniDeck').onclick = () => view('cards');
$('gear').onclick = () => $('set').classList.add('on');
$('cl').onclick = () => $('set').classList.remove('on');
document.querySelectorAll('.lg').forEach(b => b.onclick = () => {
  LANG = b.dataset.l; localStorage.setItem(LANGK, LANG);
  if (USER) { renderAll(); refreshAcc(); } else applyLang();
});
$('rst').onclick = () => {
  if (!confirm(t('resetQ'))) return;
  S = fresh(); save(); $('set').classList.remove('on'); renderAll();
};
$('lo').onclick = () => { $('set').classList.remove('on'); logout(); };

// =================================================================
//  KAMPF
// =================================================================
const W = 720, H = 1080, RY = 540, RH = 76, BR = [180, 540], BW = 100, TIME = 90, SPD = 55;
const BLUE = '#3a8bff', RED = '#ff4455';
const TREES = [[34, 70], [690, 60], [30, 330], [692, 340], [30, 760], [692, 770], [36, 1030], [690, 1030], [30, 560], [692, 540]];
const cv = $('cv'), cx = cv.getContext('2d');
let G = null, raf = 0, last = 0, drag = null;

const inR = y => Math.abs(y - RY) < RH / 2;
const onB = x => BR.some(b => Math.abs(x - b) < BW / 2);
const okPos = (x, y) => !inR(y) || onB(x);
const rd = o => o.isT ? o.r : o.rad;
const dst = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const nb = x => Math.abs(x - BR[0]) < Math.abs(x - BR[1]) ? BR[0] : BR[1];
const rate = () => (G.time < 30 ? 2 : 1) * 0.6;   // Elixier/Sekunde (doppelt in den letzten 30 s)

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function mkHand() { const d = shuffle(dk().slice()); return { hand: d.slice(0, 4), q: d.slice(4) }; }
function cyc(h, i) { const k = h.hand[i]; h.q.push(k); h.hand[i] = h.q.shift(); return k; }

function mkT(team, x, y, king) {
  const hp = king ? 2400 * G.m : 1500 * G.m;
  return { isT: 1, team, x, y, king, hp, maxhp: hp, r: king ? 44 : 36, dmg: (king ? 70 : 60) * G.m, cd: 1, dead: 0, act: !king, fl: 0 };
}

function start() {
  if (dk().length < 3) return toast(t('need3'), true);
  const ar = ARENAS[S.arena];
  G = {
    ar, i: S.arena, m: 1 + (S.level - 1) * .06,   // Bot hat dieselben Werte wie du
    u: [], p: [], tw: [], fx: [], time: TIME, t: 0, pe: 5, ee: 5,
    sel: -1, gh: null, over: 0, h: mkHand(), bo: mkHand(), mq: [], idle: 0, lblc: ''
  };
  G.tw.push(mkT('e', 180, 200), mkT('e', 540, 200), mkT('e', 360, 100, 1),
            mkT('p', 180, 880), mkT('p', 540, 880), mkT('p', 360, 980, 1));
  drag = null;
  S.battle = 1; save();     // Falls die Seite mitten im Kampf geschlossen wird, zählt das als Niederlage
  $('over').classList.remove('on');
  $('lbl').textContent = ARENAS[S.arena].ic + ' ' + t('arena') + ' ' + (S.arena + 1) + ' · ' + an(ARENAS[S.arena]);
  screen('game');
  renderHand();
  fit();
  last = performance.now();
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
}
function leave() {
  cancelAnimationFrame(raf); G = null; drag = null;
  $('over').classList.remove('on');
  screen('home'); renderTop(); renderBattle();
}
function fit() {
  const g = $('game'), cw = $('cw');
  const max = Math.min(window.innerWidth, 520);
  g.style.setProperty('--cw', max + 'px');                 // Brett erst mit maximaler Breite messen
  const s = Math.min(max / W, cw.clientHeight / H);
  const wpx = Math.floor(W * s);
  cv.style.width = wpx + 'px';
  cv.style.height = Math.floor(H * s) + 'px';
  g.style.setProperty('--cw', wpx + 'px');                 // Brett und Anzeige genau so breit wie das Feld
}
window.addEventListener('resize', () => { if (G) fit(); });

// ---------- Hand (unten wie im Original, mit "Nächste"-Karte) ----------
function renderHand() {
  $('hand').innerHTML = G.h.hand.map(k => cardHTML(k)).join('');
  [...$('hand').children].forEach((el, i) => {
    el.addEventListener('pointerdown', ev => {
      ev.preventDefault();
      if (!G || G.over) return;
      if (G.pe < CARDS[G.h.hand[i]].c) return toast(t('noElix'), true);
      drag = { i, was: G.sel === i, moved: false };
      G.sel = i;
      refreshHand();
      dragMove(ev);
    });
  });
  refreshHand();
}
function refreshHand() {
  [...$('hand').children].forEach((el, i) => {
    const off = G.pe < CARDS[G.h.hand[i]].c;
    el.classList.toggle('off', off);
    el.classList.toggle('sel', G.sel === i && !off);
  });
  if (G.sel >= 0 && G.pe < CARDS[G.h.hand[G.sel]].c) G.sel = -1;
}

// Karte auf das Feld ziehen (Touch & Maus) oder antippen + Feld antippen
function dragMove(ev) {
  if (!drag || !G) return;
  const r = cv.getBoundingClientRect();
  const inside = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
  if (inside) {
    drag.moved = true;
    const off = ev.pointerType === 'touch' ? -70 : 0;   // Finger verdeckt sonst die Vorschau
    G.gh = { x: (ev.clientX - r.left) * W / r.width, y: (ev.clientY - r.top) * H / r.height + off };
  } else if (drag.moved) G.gh = null;
}
document.addEventListener('pointermove', dragMove);
document.addEventListener('pointerup', ev => {
  if (!drag || !G) return;
  dragMove(ev);
  const d = drag; drag = null;
  if (G.over) return;
  if (d.moved && G.gh) {
    if (!canPlace(G.gh.x, G.gh.y)) { toast(t('onlyHalf'), true); G.gh = null; }
    else place(d.i, G.gh.x, G.gh.y);
  } else if (!d.moved && d.was) G.sel = -1;
  refreshHand();
});
document.addEventListener('pointercancel', () => { drag = null; });

function place(i, x, y) {
  const k = G.h.hand[i], c = CARDS[k];
  if (G.pe < c.c) return toast(t('noElix'), true);
  G.pe -= c.c;
  spawn('p', k, x, y);
  mirror(k, x, y);
  cyc(G.h, i);
  G.sel = -1; G.gh = null;
  renderHand();
}

// ---------- Einheiten ----------
function spawn(team, key, x, y) {
  const c = CARDS[key], lm = 1 + .1 * (lvl(key) - 1);   // Karten-Level (Bot hat dieselben Level wie du)
  for (let i = 0; i < c.n; i++) {
    G.u.push({
      team, key, x: x + (i - (c.n - 1) / 2) * 20, y,
      hp: c.hp * G.m * lm, maxhp: c.hp * G.m * lm, dmg: c.d * G.m * lm, speed: c.sp * SPD, range: c.r, as: c.as,
      rad: c.rad, col: c.col, ic: c.ic, rg: c.rg, fly: c.fly, tOnly: c.tOnly, cd: .5, fl: 0
    });
  }
  G.fx.push({ x, y, s: '✨', c: '#fff', l: .6 });
}

function target(u) {
  let best = null, bd = Infinity;
  if (!u.tOnly) {
    const ag = Math.max(150, u.range + 30);
    for (const o of G.u) {
      if (o.team === u.team || o.hp <= 0) continue;
      const d = dst(u, o) - o.rad - u.rad;
      if (d < ag && d < bd) { bd = d; best = o; }
    }
    if (best) return best;
  }
  bd = Infinity;
  for (const w of G.tw) {
    if (w.team === u.team || w.dead) continue;
    const d = dst(u, w);
    if (d < bd) { bd = d; best = w; }
  }
  return best;
}

function hit(o, dmg) {
  if (o.hp <= 0) return;
  o.hp -= dmg; o.fl = .12;
  G.fx.push({ x: o.x + (Math.random() - .5) * 20, y: o.y - rd(o), s: Math.round(dmg), c: o.team === 'p' ? '#ff9a9a' : '#fff', l: .7 });
  if (o.hp <= 0) {
    o.hp = 0;
    if (o.isT) o.dead = 1;
    G.fx.push({ x: o.x, y: o.y, s: o.isT ? '💥' : '💨', c: '#fff', l: .8 });
  }
  if (o.isT && o.king) o.act = true;
}

function move(u, tg, dt) {
  const st = u.speed * dt;
  let nx, ny;
  if (u.fly) {
    const dx = tg.x - u.x, dy = tg.y - u.y, len = Math.hypot(dx, dy) || 1;
    nx = u.x + dx / len * st; ny = u.y + dy / len * st;
  } else if (inR(u.y)) {
    nx = u.x; ny = u.y + Math.sign(tg.y - u.y || (u.team === 'p' ? -1 : 1)) * st;
  } else {
    let gx = tg.x, gy = tg.y;
    if ((u.y - RY) * (tg.y - RY) < 0) { gx = nb(u.x); gy = RY; }
    const dx = gx - u.x, dy = gy - u.y, len = Math.hypot(dx, dy) || 1;
    nx = u.x + dx / len * st; ny = u.y + dy / len * st;
    if (inR(ny) && !onB(nx)) { ny = u.y; nx = u.x + Math.sign(nb(u.x) - u.x) * st; }
  }
  u.x = Math.max(12, Math.min(W - 12, nx));
  u.y = Math.max(12, Math.min(H - 12, ny));
}

function updUnit(u, dt) {
  u.cd -= dt; u.fl -= dt;
  const tg = target(u); if (!tg) return;
  const d = dst(u, tg) - rd(tg) - u.rad;
  if (d <= u.range) {
    if (u.cd <= 0) {
      u.cd = u.as;
      if (u.rg) G.p.push({ x: u.x, y: u.y, tg, dmg: u.dmg, sp: 520, col: u.col, sz: 5 });
      else hit(tg, u.dmg);
    }
  } else move(u, tg, dt);
}

function separate() {
  const us = G.u;
  for (let i = 0; i < us.length; i++) for (let j = i + 1; j < us.length; j++) {
    const a = us[i], b = us[j];
    if (!!a.fly !== !!b.fly) continue;
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || .01, mn = (a.rad + b.rad) * .9;
    if (d < mn) {
      const k = (mn - d) / 2, px = dx / d * k, py = dy / d * k;
      if (a.fly || okPos(a.x - px, a.y - py)) { a.x -= px; a.y -= py; }
      if (b.fly || okPos(b.x + px, b.y + py)) { b.x += px; b.y += py; }
    }
  }
}

function updTower(w, dt) {
  w.fl -= dt;
  if (w.dead) return;
  if (w.king && !w.act && (w.hp < w.maxhp || G.tw.some(o => o.team === w.team && !o.king && o.dead))) w.act = true;
  w.cd -= dt;
  if (!w.act || w.cd > 0) return;
  let best = null, bd = Infinity;
  for (const u of G.u) {
    if (u.team === w.team || u.hp <= 0) continue;
    const d = dst(w, u) - u.rad;
    if (d <= 230 && d < bd) { bd = d; best = u; }
  }
  if (best) { w.cd = 1.1; G.p.push({ x: w.x, y: w.y, tg: best, dmg: w.dmg, sp: 560, col: w.team === 'p' ? '#9cf' : '#f99', sz: 6 }); }
}

function updProj(dt) {
  for (const p of G.p) {
    const o = p.tg;
    if (o.hp <= 0) { p.done = 1; continue; }
    const dx = o.x - p.x, dy = o.y - p.y, d = Math.hypot(dx, dy), st = p.sp * dt;
    if (d <= st + 6) { hit(o, p.dmg); p.done = 1; } else { p.x += dx / d * st; p.y += dy / d * st; }
  }
  G.p = G.p.filter(p => !p.done);
}

// ---------- Bot: gleiches Deck, gleiche Werte, spiegelt deine Karten ----------
function mirror(k, x, y) {
  if (Math.random() > .9) return;
  const d = G.i / (ARENAS.length - 1);               // höhere Arena = schnellere Reaktion
  G.mq.push({
    k,
    x: Math.max(40, Math.min(W - 40, x + (Math.random() - .5) * 50)),
    y: Math.max(60, Math.min(RY - RH / 2 - 40, H - y + (Math.random() - .5) * 40)),
    at: G.t + (2.0 - 1.2 * d) + Math.random() * 1.2
  });
}
function botPlay(i, x, y) {
  const k = cyc(G.bo, i);
  G.ee -= CARDS[k].c;
  spawn('e', k, x, y);
}
function ai(dt) {
  G.ee = Math.min(10, G.ee + rate() * dt);
  const a = G.mq[0];
  if (a && a.at <= G.t) {
    let i = G.bo.hand.indexOf(a.k);
    if (i < 0 && G.t - a.at > 1) i = G.bo.hand.findIndex(h => CARDS[h].c <= G.ee);
    if (i >= 0 && G.ee >= CARDS[G.bo.hand[i]].c) { botPlay(i, a.x, a.y); G.mq.shift(); }
    else if (G.t - a.at > 6) G.mq.shift();
  }
  // Leerlauf: sonst passiert am Anfang nichts / bei vollem Elixier
  G.idle -= dt;
  if (G.idle <= 0 && !G.mq.length && G.ee >= (G.t < 8 ? 5 : 9)) {
    const opts = G.bo.hand.map((h, i) => i).filter(i => CARDS[G.bo.hand[i]].c <= G.ee);
    if (opts.length) {
      const bx = BR[Math.floor(Math.random() * 2)];
      botPlay(opts[Math.floor(Math.random() * opts.length)], bx + (Math.random() - .5) * 80, 200 + Math.random() * 170);
    }
    G.idle = 2;
  }
}

// ---------- Loop ----------
function update(dt) {
  G.t += dt; G.time -= dt;
  G.pe = Math.min(10, G.pe + rate() * dt);
  if (G.t > 2.5) ai(dt);
  G.u.forEach(u => updUnit(u, dt));
  separate();
  G.tw.forEach(w => updTower(w, dt));
  updProj(dt);
  G.u = G.u.filter(u => u.hp > 0);
  G.fx.forEach(f => { f.l -= dt; f.y -= 34 * dt; });
  G.fx = G.fx.filter(f => f.l > 0);

  $('ef').style.width = G.pe / 10 * 100 + '%';
  $('en').textContent = Math.floor(G.pe);
  refreshHand();

  const mine = G.tw.filter(w => w.team === 'e' && w.dead).length;
  const theirs = G.tw.filter(w => w.team === 'p' && w.dead).length;
  G.mine = mine; G.theirs = theirs;
  const sec = Math.max(0, Math.ceil(G.time));
  const lb = `🕐 ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}${G.time < 30 ? ' ⚡x2' : ''}`;
  if (lb !== G.lblc) { G.lblc = lb; $('tm').textContent = lb; }

  if (G.tw.find(w => w.team === 'e' && w.king).dead) return end('win', 3);
  if (G.tw.find(w => w.team === 'p' && w.king).dead) return end('loss', mine);
  if (G.time <= 0) {
    if (mine !== theirs) return end(mine > theirs ? 'win' : 'loss', mine);
    const f = tm => G.tw.filter(w => w.team === tm).reduce((s, w) => s + w.hp / w.maxhp, 0);
    const a = f('p'), b = f('e');
    return end(a > b + .05 ? 'win' : b > a + .05 ? 'loss' : 'draw', mine);
  }
}
function loop(now) {
  if (!G) return;
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (!G.over && !G.paused) update(dt);
  draw();
  if (G && !G.over) raf = requestAnimationFrame(loop);
}

function end(res, crowns) {
  if (G.over) return;
  G.over = 1; G.sel = -1; drag = null;
  let coins, xp, key, col;
  if (res === 'win') { coins = G.ar.rw + crowns * 10; xp = 40 + crowns * 10; S.wins++; S.trophies += 25; key = 'win'; col = '#ffdd44'; }
  else if (res === 'loss') { coins = 10; xp = 15; S.losses++; S.trophies = Math.max(0, S.trophies - 15); key = 'loss'; col = '#ff6666'; }
  else { coins = 15; xp = 20; key = 'draw'; col = '#ccc'; }
  S.coins += coins; S.xp += xp; S.battle = 0;
  let ups = 0;
  while (S.xp >= xpFor(S.level)) { S.xp -= xpFor(S.level); S.level++; ups++; }
  save();
  $('rt').textContent = t(key); $('rt').style.color = col;
  $('crn').innerHTML = [0, 1, 2].map(i => `<span style="opacity:${i < crowns ? 1 : .25}">👑</span>`).join('');
  $('rw').innerHTML = `+${coins} 🪙 · +${xp} XP` + (ups ? '<br>' + t('lvlUp').replace('{n}', S.level) : '');
  $('over').classList.add('on');
  draw();
}

// ---------- Antippen des Feldes (Karte vorher antippen) ----------
const pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
function canPlace(x, y) {
  if (x < 24 || x > W - 24 || y < RY + RH / 2 + 20 || y > H - 30) return false;
  return !G.tw.some(w => !w.dead && Math.hypot(w.x - x, w.y - y) < w.r + 26);
}
cv.addEventListener('pointermove', e => { if (G && !G.over && !drag && G.sel >= 0) G.gh = pos(e); });
cv.addEventListener('pointerdown', e => {
  if (!G || G.over) return;
  e.preventDefault();
  const p = pos(e); G.gh = p;
  if (G.sel < 0) return;
  if (!canPlace(p.x, p.y)) return toast(t('onlyHalf'), true);
  place(G.sel, p.x, p.y);
});

// ---------- Rendering ----------
function rr(x, y, w, h, r) { cx.beginPath(); cx.roundRect ? cx.roundRect(x, y, w, h, r) : cx.rect(x, y, w, h); }
function bar(x, y, w, hp, mx, col) {
  cx.fillStyle = '#000b'; cx.fillRect(x - w / 2 - 2, y - 2, w + 4, 10);
  cx.fillStyle = col; cx.fillRect(x - w / 2, y, w * Math.max(0, hp / mx), 6);
}
const DEC2 = [[110, 430], [610, 430], [110, 680], [610, 680], [360, 340], [360, 760]];
function field() {
  const a = G.ar, th = a.th, rv = a.rv || ['#2a7fd6', '#1c5fa8'], br = a.br;
  cx.fillStyle = th[0]; cx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 60) for (let x = 0; x < W; x += 60) {
    const i = x / 60, k = y / 60;
    const alt = a.pat === 1 ? i % 2 : a.pat === 2 ? ((i + k) % 3 === 0) : a.pat === 3 ? 0 : (i + k) % 2;
    if (alt) { cx.fillStyle = th[1]; cx.fillRect(x, y, 60, 60); }
  }
  if (a.pat === 3) {
    cx.fillStyle = th[1];
    for (let y = 20; y < H; y += 40) for (let x = (y / 40) % 2 ? 20 : 40; x < W; x += 40) { cx.beginPath(); cx.arc(x, y, 5, 0, 6.3); cx.fill(); }
  }
  cx.fillStyle = a.pt;
  for (const b of BR) {
    cx.fillRect(b - 26, 200, 52, RY - RH / 2 - 200);
    cx.fillRect(b - 26, RY + RH / 2, 52, 880 - RY - RH / 2);
  }
  cx.fillRect(180, 174, 360, 52); cx.fillRect(180, 854, 360, 52);
  cx.fillRect(334, 100, 52, 100); cx.fillRect(334, 880, 52, 100);
  const ry = RY - RH / 2, g = cx.createLinearGradient(0, ry, 0, ry + RH);
  g.addColorStop(0, rv[0]); g.addColorStop(1, rv[1]);
  cx.fillStyle = g; cx.fillRect(0, ry, W, RH);
  cx.strokeStyle = a.wv || '#fff5'; cx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    cx.beginPath();
    for (let x = 0; x <= W; x += 10) {
      const y = ry + 16 + i * 22 + Math.sin((x + G.t * 60 + i * 40) / 22) * 3;
      x ? cx.lineTo(x, y) : cx.moveTo(x, y);
    }
    cx.stroke();
  }
  for (const b of BR) {
    cx.fillStyle = br[0]; cx.fillRect(b - BW / 2, ry - 6, BW, RH + 12);
    cx.strokeStyle = br[1]; cx.lineWidth = 3; cx.strokeRect(b - BW / 2, ry - 6, BW, RH + 12);
    cx.strokeStyle = '#0003'; cx.lineWidth = 2;
    for (let k = ry; k < ry + RH; k += 14) { cx.beginPath(); cx.moveTo(b - BW / 2, k); cx.lineTo(b + BW / 2, k); cx.stroke(); }
  }
  cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = '#fff';
  cx.font = '58px serif';
  TREES.forEach(([x, y]) => cx.fillText(a.dec, x, y));
  cx.font = '36px serif'; cx.globalAlpha = .9;
  DEC2.forEach(([x, y]) => cx.fillText(a.dec2, x, y));
  cx.globalAlpha = 1;
  if (G.sel >= 0) { cx.fillStyle = '#50a0ff26'; cx.fillRect(0, RY + RH / 2, W, H - RY - RH / 2); }
}
function crownBox(y, n, col) {
  rr(W - 50, y, 44, 56, 8); cx.fillStyle = col; cx.fill(); cx.strokeStyle = '#000'; cx.lineWidth = 3; cx.stroke();
  cx.fillStyle = '#fff'; cx.font = '20px serif'; cx.fillText('👑', W - 28, y + 17);
  cx.font = 'bold 22px sans-serif'; cx.lineWidth = 4; cx.strokeStyle = '#000';
  cx.strokeText(n, W - 28, y + 40); cx.fillText(n, W - 28, y + 40);
}
function drawT(w) {
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  const r = w.r;
  if (w.dead) { cx.font = r + 'px serif'; cx.fillStyle = '#fff'; cx.fillText('🪨', w.x, w.y); return; }
  const col = w.team === 'p' ? BLUE : RED;
  rr(w.x - r, w.y - r, r * 2, r * 2, 10);
  cx.fillStyle = w.fl > 0 ? '#fff' : '#a9adbb'; cx.fill();
  cx.strokeStyle = col; cx.lineWidth = 6; cx.stroke();
  cx.fillStyle = col; cx.fillRect(w.x - r + 7, w.y - r + 7, r * 2 - 14, 10);
  cx.font = r * 1.0 + 'px serif'; cx.fillStyle = '#fff';
  cx.fillText(w.king ? '👑' : '🏰', w.x, w.y + 6);
  bar(w.x, w.y - r - 14, 70, w.hp, w.maxhp, w.team === 'p' ? '#44aaff' : '#ff5566');
  if (w.king && !w.act) { cx.font = '18px serif'; cx.fillText('💤', w.x + r, w.y - r); }
}
function drawU(u) {
  const sh = u.fly ? 18 : 0;
  cx.fillStyle = '#0005'; cx.beginPath(); cx.ellipse(u.x, u.y + u.rad * .7 + sh, u.rad, u.rad * .45, 0, 0, 6.3); cx.fill();
  const y = u.y - sh * .5;
  cx.fillStyle = u.fl > 0 ? '#fff' : u.col; cx.strokeStyle = u.team === 'p' ? BLUE : RED; cx.lineWidth = 3;
  cx.beginPath(); cx.arc(u.x, y, u.rad, 0, 6.3); cx.fill(); cx.stroke();
  cx.font = u.rad * 1.4 + 'px serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = '#fff';
  cx.fillText(u.ic, u.x, y + 1);
  if (u.hp < u.maxhp) bar(u.x, y - u.rad - 10, Math.max(26, u.rad * 2), u.hp, u.maxhp, u.team === 'p' ? '#44aaff' : '#ff5566');
}
function draw() {
  if (!G) return;
  cx.clearRect(0, 0, W, H);
  field();
  G.tw.forEach(drawT);
  [...G.u].sort((a, b) => a.y - b.y).forEach(drawU);
  for (const p of G.p) {
    cx.fillStyle = p.col; cx.strokeStyle = '#fff'; cx.lineWidth = 1.5;
    cx.beginPath(); cx.arc(p.x, p.y, p.sz, 0, 6.3); cx.fill(); cx.stroke();
  }
  crownBox(RY - 150, G.theirs || 0, '#c4283a');
  crownBox(RY + 94, G.mine || 0, '#2a6fd0');
  if (G.sel >= 0 && G.gh && !G.over) {
    const c = CARDS[G.h.hand[G.sel]], ok = canPlace(G.gh.x, G.gh.y);
    cx.save(); cx.globalAlpha = .75;
    cx.strokeStyle = ok ? '#6f9' : '#f66'; cx.fillStyle = ok ? '#6f93' : '#f663'; cx.lineWidth = 3;
    cx.beginPath(); cx.arc(G.gh.x, G.gh.y, c.rad + 8, 0, 6.3); cx.fill(); cx.stroke();
    if (c.rg) { cx.setLineDash([8, 8]); cx.beginPath(); cx.arc(G.gh.x, G.gh.y, c.r, 0, 6.3); cx.stroke(); }
    cx.font = c.rad * 1.6 + 'px serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = '#fff';
    cx.fillText(c.ic, G.gh.x, G.gh.y);
    cx.restore();
  }
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  for (const f of G.fx) {
    cx.globalAlpha = Math.min(1, f.l * 1.6);
    const num = typeof f.s === 'number';
    cx.font = num ? 'bold 24px sans-serif' : '30px serif';
    if (num) { cx.lineWidth = 4; cx.strokeStyle = '#000'; cx.strokeText(f.s, f.x, f.y); }
    cx.fillStyle = f.c; cx.fillText(f.s, f.x, f.y);
  }
  cx.globalAlpha = 1;
}

// ---------- Start ----------
$('battle').onclick = start;
function applyPenalty() {
  S.losses++; S.trophies = Math.max(0, S.trophies - 15);
  S.xp = Math.max(0, S.xp - PEN_XP); S.coins = Math.max(0, S.coins - PEN_COINS);
  S.battle = 0; save();
}
$('back').onclick = () => {
  if (G && !G.over) {
    G.paused = 1;
    $('lmT').textContent = t('leaveW').replace('{x}', PEN_XP).replace('{c}', PEN_COINS);
    $('leaveM').classList.add('on');
  } else leave();
};
$('lmStay').onclick = () => { $('leaveM').classList.remove('on'); if (G) G.paused = 0; };
$('lmGo').onclick = () => {
  $('leaveM').classList.remove('on');
  if (G && !G.over) applyPenalty();
  leave();
};
$('ok').onclick = leave;
document.addEventListener('dblclick', e => e.preventDefault());

// =================================================================
//  KONTEN (lokal im Browser, ohne E-Mail) + Gast
// =================================================================
async function hashPw(pw, salt) {
  const data = new TextEncoder().encode(salt + ':' + pw);
  if (window.crypto && crypto.subtle) {
    const b = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  let h = 5381; for (const c of salt + pw) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
  return 'x' + h;
}
function setAuthMode(m) {
  authMode = m;
  $('tL').classList.toggle('on', m === 'login');
  $('tR').classList.toggle('on', m === 'register');
  $('uP2').classList.toggle('hide', m === 'login');
  $('aGo').textContent = t(m);
  $('aErr').textContent = '';
}
$('tL').onclick = () => setAuthMode('login');
$('tR').onclick = () => setAuthMode('register');
async function submitAuth() {
  const name = $('uN').value.trim(), pw = $('uP').value, key = name.toLowerCase();
  const users = lsGet(USERS) || {};
  const err = k => { $('aErr').textContent = t(k); };
  if (!/^[A-Za-z0-9_.-]{3,16}$/.test(name)) return err('errName');
  if (pw.length < 4) return err('errPw');
  if (authMode === 'register') {
    if (pw !== $('uP2').value) return err('errMatch');
    if (users[key] || key === 'guest' || key === 'gast') return err('errExists');
    const salt = Math.random().toString(36).slice(2) + Date.now().toString(36);
    users[key] = { name, salt, hash: await hashPw(pw, salt) };
    lsSet(USERS, users);
  } else {
    const u = users[key];
    if (!u || u.hash !== await hashPw(pw, u.salt)) return err('errBad');
  }
  enter({ key, name: users[key].name, guest: false });
}
$('aGo').onclick = submitAuth;
$('uP').addEventListener('keydown', e => { if (e.key === 'Enter' && authMode === 'login') submitAuth(); });
$('uP2').addEventListener('keydown', e => { if (e.key === 'Enter') submitAuth(); });
$('aGuest').onclick = () => enter({ key: 'guest', name: 'Guest', guest: true });

function refreshAcc() {
  $('acc').textContent = !USER ? '' : USER.guest ? '👤 ' + t('guestName') : (BADGES[USER.key] || '🙂') + ' ' + USER.name;
}
function enter(u) {
  USER = u; lsSet(SESSION, u.guest ? 'guest' : u.key);
  S = loadSave(); sanitize();
  let pen = false;
  if (S.battle) { applyPenalty(); pen = true; }   // Kampf wurde abgebrochen (Seite geschlossen)
  save();
  $('uP').value = $('uP2').value = '';
  screen('home'); view('battle'); renderAll(); refreshAcc();
  if (pen) toast(t('crashPen').replace('{x}', PEN_XP).replace('{c}', PEN_COINS), true);
}
function logout() {
  USER = null; G = null; drag = null;
  localStorage.removeItem(SESSION);
  setAuthMode('login'); applyLang();
  screen('auth');
}

// Start: gespeicherte Anmeldung wiederherstellen, sonst Login-Bildschirm
{
  const sess = lsGet(SESSION), users = lsGet(USERS) || {};
  applyLang();
  if (sess === 'guest') enter({ key: 'guest', name: 'Guest', guest: true });
  else if (sess && users[sess]) enter({ key: sess, name: users[sess].name, guest: false });
  else screen('auth');
}
