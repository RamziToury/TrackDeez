/* ══════════════════════════════════════════════════
   Track Deez v5
══════════════════════════════════════════════════ */

const JIKAN = 'https://api.jikan.moe/v4';

let currentUser = null;
let currentView = 'list';
let currentFilter = 'all';
let currentGenre = '';
let currentTop10Type = 'series';
let currentLang = 'fr';

// discover state
let discoverPool = [];
let discoverIndex = 0;
let discoverPage = 1;
let _recoCache = {};
// Per-genre rolling pool: { genreId: { items: [], page: 1, done: false, mode: 'score'|'recent' } }
let _recoPools = {};
let _recoFallback = null; // top-rated overall, lazy-loaded
let listSortMode = 'recent';
let searchHideAdded = false;
let searchHideNsfw = false;
let _modalTab = 'details';
let _charCache = {};
let _themesCache = {};
let _reviewsCache = {};

// Profile progression badges (based on completed anime count)
const BADGES = [
  { key: 'neophyte', labelFr: 'Néophyte', labelEn: 'Neophyte', emoji: '🌱', min: 0, max: 9, color: '#22c67a' },
  { key: 'initie', labelFr: 'Initié', labelEn: 'Initiate', emoji: '⚔️', min: 10, max: 29, color: '#3b82f6' },
  { key: 'otaku', labelFr: 'Otaku', labelEn: 'Otaku', emoji: '🔥', min: 30, max: 99, color: '#ec4899' },
  { key: 'encyclo', labelFr: 'Encyclopédie', labelEn: 'Encyclopedia', emoji: '📚', min: 100, max: Infinity, color: '#f6c90e' },
];

function getUserBadge(completedCount) {
  for (const b of BADGES) {
    if (completedCount >= b.min && completedCount <= b.max) return b;
  }
  return BADGES[BADGES.length - 1];
}

function badgeLabel(b) { return currentLang === 'en' ? b.labelEn : b.labelFr; }

// ── ACHIEVEMENTS (special milestones) ──────────────
const ACHIEVEMENTS = [
  // ═══ Demographic completions (20+ each) ═══
  { key: 'warrior', labelFr: 'Guerrier', labelEn: 'Warrior', emoji: '⚔️', color: '#ef4444', descFr: 'Termine 20 shōnen', descEn: 'Complete 20 shōnen anime', type: 'demoCount', demo: 'shounen', target: 20 },
  { key: 'saint', labelFr: 'Saint', labelEn: 'Saint', emoji: '🛐', color: '#a78bfa', descFr: 'Termine 20 seinen', descEn: 'Complete 20 seinen anime', type: 'demoCount', demo: 'seinen', target: 20 },
  { key: 'magicienne', labelFr: 'Magicienne', labelEn: 'Magician', emoji: '🌸', color: '#f472b6', descFr: 'Termine 20 shōjo', descEn: 'Complete 20 shōjo anime', type: 'demoCount', demo: 'shoujo', target: 20 },
  { key: 'femfatale', labelFr: 'Femme fatale', labelEn: 'Femme Fatale', emoji: '🌹', color: '#dc2626', descFr: 'Termine 20 josei', descEn: 'Complete 20 josei anime', type: 'demoCount', demo: 'josei', target: 20 },
  { key: 'innocent', labelFr: 'Innocent', labelEn: 'Innocent', emoji: '🧸', color: '#22c67a', descFr: 'Termine 20 anime "kids"', descEn: 'Complete 20 kids anime', type: 'demoCount', demo: 'kids', target: 20 },
  // ═══ Specific anime completions ═══
  { key: 'pirate', labelFr: 'Pirate', labelEn: 'Pirate', emoji: '☠️', color: '#0891b2', descFr: 'Atteins l\'épisode 500 de One Piece', descEn: 'Reach episode 500 of One Piece', type: 'episodeCount', mal: 21, target: 500 },
  { key: 'ninja', labelFr: 'Ninja', labelEn: 'Ninja', emoji: '🥷', color: '#fb923c', descFr: 'Termine Naruto original', descEn: 'Complete Naruto original', type: 'completed', mals: [20] },
  { key: 'hokage', labelFr: 'Hokage', labelEn: 'Hokage', emoji: '🍥', color: '#f59e0b', descFr: 'Termine Naruto Shippūden', descEn: 'Complete Naruto Shippūden', type: 'completed', mals: [1735] },
  { key: 'shinigami', labelFr: 'Shinigami', labelEn: 'Shinigami', emoji: '⚰️', color: '#c20343', descFr: 'Termine Bleach', descEn: 'Complete Bleach', type: 'completed', mals: [269] },
  { key: 'saiyan', labelFr: 'Saiyan', labelEn: 'Saiyan', emoji: '🐉', color: '#fbbf24', descFr: 'Termine Dragon Ball Z', descEn: 'Complete Dragon Ball Z', type: 'completed', mals: [813] },
  { key: 'noname', labelFr: 'No Name', labelEn: 'No Name', emoji: '🎭', color: '#6b7280', descFr: 'Termine Monster', descEn: 'Complete Monster', type: 'completed', mals: [19] },
  { key: 'timetrav', labelFr: 'Voyageur Temporel', labelEn: 'Time Traveler', emoji: '⏳', color: '#06d2e0', descFr: 'Termine Steins;Gate + Steins;Gate 0', descEn: 'Complete Steins;Gate + Steins;Gate 0', type: 'completed', mals: [9253, 30484] },
  { key: 'hunter', labelFr: 'Chasseur', labelEn: 'Hunter', emoji: '🎯', color: '#16a34a', descFr: 'Termine Hunter x Hunter (2011)', descEn: 'Complete Hunter x Hunter (2011)', type: 'completed', mals: [11061] },
  { key: 'titan', labelFr: 'Titan', labelEn: 'Titan', emoji: '🔰', color: '#794f01', descFr: 'Termine Attack on Titan saisons 1, 2 et 3', descEn: 'Complete Attack on Titan seasons 1, 2 and 3', type: 'completed', mals: [16498, 25777, 35760] },
  { key: 'alchemist', labelFr: 'Alchimiste', labelEn: 'Alchemist', emoji: '⚗️', color: '#facc15', descFr: 'Termine Fullmetal Alchemist Brotherhood', descEn: 'Complete Fullmetal Alchemist Brotherhood', type: 'completed', mals: [5114] },
  { key: 'exorcist', labelFr: 'Exorciste', labelEn: 'Exorcist', emoji: '🧿', color: '#7c5cfc', descFr: 'Termine Jujutsu Kaisen S1 + S2', descEn: 'Complete Jujutsu Kaisen S1 + S2', type: 'completed', mals: [40748, 51009] },
  // ═══ Visible behavior achievements ═══
  { key: 'ponctuel', labelFr: 'Ponctuel', labelEn: 'Punctual', emoji: '📅', color: '#22c67a', descFr: 'Connecte-toi 7 jours d\'affilée', descEn: 'Log in 7 days in a row', type: 'loginStreak', target: 7 },
  { key: 'procrast', labelFr: 'Procrastinateur', labelEn: 'Procrastinator', emoji: '⏰', color: '#f59e0b', descFr: 'Aie 10 anime "En cours"', descEn: 'Have 10 anime "Watching"', type: 'statusCount', status: 'watching', target: 10 },
  { key: 'ambitieux', labelFr: 'Ambitieux', labelEn: 'Ambitious', emoji: '🎯', color: '#06d2e0', descFr: 'Aie 30 anime "À voir"', descEn: 'Have 30 anime "To watch"', type: 'statusCount', status: 'planToWatch', target: 30 },
  { key: 'donateur', labelFr: 'Donateur', labelEn: 'Donor', emoji: '💸​', color: '#00ff95ff', descFr: 'Faire un don PayPal', descEn: 'Donate on PayPal', type: 'flag', flag: 'donated' },
  { key: 'romantique', labelFr: 'Romantique', labelEn: 'Romantic', emoji: '💕', color: '#f472b6', descFr: 'Termine 20 anime de romance', descEn: 'Complete 20 romance anime', type: 'genreCount', genre: 'romance', target: 20 },
  // ═══ Hidden achievements (revealed only when unlocked) ═══
  { key: 'topdutop', labelFr: 'Top du top', labelEn: 'Top of the Top', emoji: '👑', color: '#f6c90e', descFr: 'Remplis ton top 10 séries en entier', descEn: 'Fill your full Top 10 series', type: 'topFull', target: 10, hidden: true },
  { key: 'compulsive', labelFr: 'Compulsive Scroller', labelEn: 'Compulsive Scroller', emoji: '⚡', color: '#a47dff', descFr: 'Swipe 10 fois en moins de 5 sec dans Discover', descEn: 'Swipe 10 times in under 5s on Discover', type: 'flag', flag: 'compulsiveScroller', hidden: true },
  { key: 'fanboy', labelFr: 'FanBoy', labelEn: 'FanBoy', emoji: '😍', color: '#ef4444', descFr: 'Donne 20/20 de moyenne à un personnage', descEn: 'Give a 20/20 average to one character', type: 'fanboy', hidden: true },
  { key: 'voyeur', labelFr: '👀', labelEn: '👀', emoji: '👀', color: '#dc2626', descFr: 'Marque un anime Rx (hentai) comme "À voir"', descEn: 'Mark an Rx (hentai) anime as "To watch"', type: 'rxPlan', hidden: true },
  { key: 'darksasuke', labelFr: 'Dark Sasuke', labelEn: 'Dark Sasuke', emoji: '🌑', color: '#5900ff', descFr: 'Rechercher un Seinen', descEn: 'Search a Seinen', type: 'flag', flag: 'seenSeinenFilter', hidden: true },
  // ═══ Quiz achievements ═══
  { key:'curieux',  labelFr:'Curieux', labelEn:'Curious', emoji:'🤔', color:'#06d2e0', descFr:'Termine ton premier quizz',               descEn:'Complete your first quiz',                  type:'flag', flag:'quizFirst' },
  { key:'fivehead', labelFr:'5Head',   labelEn:'5Head',   emoji:'🧠', color:'#a78bfa', descFr:'Obtiens 100% de bonnes réponses sur 5 quizz', descEn:'Get 100% on 5 quizzes',                 type:'quizPerfect', target:5, hidden:true },
  { key:'onehead',  labelFr:'1Head',   labelEn:'1Head',   emoji:'🤡', color:'#dc2626', descFr:'Obtiens 0% à un quizz',                   descEn:'Get 0% on a quiz',                          type:'flag', flag:'quizZero', hidden:true },
];

function achLabel(ach) {
  return currentLang === 'en' ? (ach.labelEn || ach.label || '') : (ach.labelFr || ach.label || '');
}

const DEMO_PATTERNS = {
  shounen: /shounen|shōnen|shonen/i,
  seinen: /seinen/i,
  shoujo: /shoujo|shōjo|shojo/i,
  josei: /josei/i,
  kids: /\bkids\b/i,
};

function _animeMatchesDemo(a, demoKey) {
  const re = DEMO_PATTERNS[demoKey];
  if (!re) return false;
  const pool = [
    ...(a.demographics || []),
    ...(a.genres || []),
    ...(a.themes || []),
  ];
  return pool.some(s => re.test(s));
}

function checkAchievement(ach) {
  const list = getList();
  const arr = Object.values(list);
  const data = currentUser ? getUserData(currentUser) : {};

  if (ach.type === 'demoCount') {
    const count = arr.filter(a => a.status === 'completed' && _animeMatchesDemo(a, ach.demo)).length;
    return { unlocked: count >= ach.target, progress: Math.min(count, ach.target), target: ach.target };
  }
  if (ach.type === 'episodeCount') {
    const a = list[ach.mal];
    const eps = a?.currentEp || 0;
    const done = a?.status === 'completed';
    const reached = done || eps >= ach.target;
    return { unlocked: reached, progress: done ? ach.target : Math.min(eps, ach.target), target: ach.target };
  }
  if (ach.type === 'completed') {
    const completed = ach.mals.filter(id => list[id]?.status === 'completed').length;
    return { unlocked: completed === ach.mals.length, progress: completed, target: ach.mals.length };
  }
  if (ach.type === 'statusCount') {
    const count = arr.filter(a => a.status === ach.status).length;
    return { unlocked: count >= ach.target, progress: Math.min(count, ach.target), target: ach.target };
  }
  if (ach.type === 'genreCount') {
    const re = new RegExp(ach.genre, 'i');
    const count = arr.filter(a =>
      a.status === 'completed' &&
      (a.genres || []).some(g => re.test(g))
    ).length;
    return { unlocked: count >= ach.target, progress: Math.min(count, ach.target), target: ach.target };
  }
  if (ach.type === 'loginStreak') {
    const streak = computeLoginStreak(data.loginDays);
    return { unlocked: streak >= ach.target, progress: Math.min(streak, ach.target), target: ach.target };
  }
  if (ach.type === 'flag') {
    const ok = !!data[ach.flag];
    return { unlocked: ok, progress: ok ? 1 : 0, target: 1 };
  }
  if (ach.type === 'topFull') {
    const t10 = data.top10 || {};
    const len = (t10.series || []).length;
    return { unlocked: len >= ach.target, progress: Math.min(len, ach.target), target: ach.target };
  }
  if (ach.type === 'fanboy') {
    for (const malId in list) {
      const cs = list[malId].characterScores || {};
      for (const cid in cs) {
        const s = cs[cid];
        const vals = ['charadesign', 'backstory', 'dev'].map(k => s[k]).filter(v => v != null);
        if (vals.length === 3 && vals.every(v => v === 20)) {
          return { unlocked: true, progress: 1, target: 1 };
        }
      }
    }
    return { unlocked: false, progress: 0, target: 1 };
  }
  if (ach.type === 'quizPerfect') {
    const n = data.perfectQuizCount || 0;
    return { unlocked: n >= ach.target, progress: Math.min(n, ach.target), target: ach.target };
  }
  if (ach.type === 'rxPlan') {
    for (const malId in list) {
      const a = list[malId];
      if (a.status !== 'planToWatch') continue;
      const info = getRatingInfo(a.rating);
      if (info && info.tier === 'extreme') return { unlocked: true, progress: 1, target: 1 };
    }
    return { unlocked: false, progress: 0, target: 1 };
  }
  return { unlocked: false, progress: 0, target: 1 };
}

// ── LOGIN STREAK COMPUTATION ──
function computeLoginStreak(loginDays) {
  if (!loginDays || !loginDays.length) return 0;
  const sorted = [...new Set(loginDays)].sort();
  // Walk back from the most recent day
  let streak = 1;
  for (let i = sorted.length - 1; i > 0; i--) {
    const a = new Date(sorted[i]);
    const b = new Date(sorted[i - 1]);
    const diff = Math.round((a - b) / (1000 * 60 * 60 * 24));
    if (diff === 1) streak++;
    else break;
  }
  // Streak only valid if last login was today or yesterday
  const todayStr = new Date().toISOString().slice(0, 10);
  const today = new Date(todayStr);
  const lastDay = new Date(sorted[sorted.length - 1]);
  const sinceLast = Math.round((today - lastDay) / (1000 * 60 * 60 * 24));
  if (sinceLast > 1) return 0;
  return streak;
}

function recordLoginDay() {
  if (!currentUser) return;
  const data = getUserData(currentUser);
  const today = new Date().toISOString().slice(0, 10);
  if (!data.loginDays) data.loginDays = [];
  if (data.loginDays[data.loginDays.length - 1] !== today) {
    data.loginDays.push(today);
    if (data.loginDays.length > 60) data.loginDays = data.loginDays.slice(-60);
    saveUserData(currentUser, data);
  }
}

function markDonateClicked() {
  if (!currentUser) return;
  const data = getUserData(currentUser);
  if (!data.donated) {
    data.donated = true;
    saveUserData(currentUser, data);
    showToast(`🏆 ${achLabel(ACHIEVEMENTS.find(a => a.key === 'donateur'))} !`);
  }
}

// Detect a tier upgrade and trigger the unlock animation
function checkBadgeUnlock() {
  if (!currentUser) return;
  const data = getUserData(currentUser);
  const completed = Object.values(data.list || {}).filter(a => a.status === 'completed').length;
  const current = getUserBadge(completed);
  const prev = data.lastBadge;
  // First time tracking: just store silently (no retroactive popup)
  if (!prev) {
    data.lastBadge = current.key;
    saveUserData(currentUser, data);
    return;
  }
  const prevIdx = BADGES.findIndex(b => b.key === prev);
  const currIdx = BADGES.findIndex(b => b.key === current.key);
  if (currIdx > prevIdx) {
    data.lastBadge = current.key;
    saveUserData(currentUser, data);
    showBadgeUnlock(current);
  }
}

function showBadgeUnlock(badge) {
  const overlay = document.getElementById('badge-unlock-overlay');
  if (!overlay) return;
  overlay.style.setProperty('--badge-color', badge.color);
  document.getElementById('bu-emoji').textContent = badge.emoji;
  document.getElementById('bu-label').textContent = badgeLabel(badge);
  // Update progress text for context
  const progEl = document.getElementById('bu-progress-text');
  if (progEl && currentUser) {
    const completed = Object.values(getList()).filter(a => a.status === 'completed').length;
    progEl.textContent = `${completed} ${t('total_completed')}`;
  }
  emitConfetti();
  // Reset state so animations re-trigger every time
  overlay.classList.remove('animate', 'closing');
  overlay.classList.add('hidden');
  // Force reflow to flush state
  void overlay.offsetWidth;
  // Now show + trigger
  overlay.classList.remove('hidden');
  void overlay.offsetWidth;
  overlay.classList.add('animate');
}

// Manual trigger for preview / testing — ignores tier progression check
function previewBadgeAnimation() {
  if (!currentUser) return;
  const completed = Object.values(getList()).filter(a => a.status === 'completed').length;
  showBadgeUnlock(getUserBadge(completed));
}

function closeBadgeUnlock() {
  const overlay = document.getElementById('badge-unlock-overlay');
  if (!overlay) return;
  overlay.classList.add('closing');
  setTimeout(() => {
    overlay.classList.add('hidden');
    overlay.classList.remove('animate', 'closing');
    const c = document.getElementById('bu-confetti');
    if (c) c.innerHTML = '';
  }, 380);
}

function emitConfetti() {
  const container = document.getElementById('bu-confetti');
  if (!container) return;
  container.innerHTML = '';
  const colors = ['#7c5cfc', '#06d2e0', '#f6c90e', '#ec4899', '#22c67a', '#a47dff', '#ffffff'];
  const shapes = ['rect', 'circle', 'rect', 'rect']; // weighted toward rects
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece confetti-' + shapes[Math.floor(Math.random() * shapes.length)];
    piece.style.left = (Math.random() * 100) + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = (1.8 + Math.random() * 1.6) + 's';
    piece.style.animationDelay = (Math.random() * 0.6) + 's';
    piece.style.setProperty('--rot-end', (Math.random() * 1080 - 540) + 'deg');
    piece.style.setProperty('--x-drift', ((Math.random() * 200) - 100) + 'px');
    container.appendChild(piece);
  }
}

const CHAR_AXES = [
  { key: 'charadesign', emojiFr: '✏️', labelFr: 'Character Design', labelEn: 'Character Design' },
  { key: 'backstory', emojiFr: '📖', labelFr: 'Histoire perso', labelEn: 'Backstory' },
  { key: 'dev', emojiFr: '🌱', labelFr: 'Développement', labelEn: 'Development' },
];

// Genre name → Jikan ID map (for recommendations)
const GENRE_MAP = {
  'Action': 1, 'Adventure': 2, 'Comedy': 4, 'Drama': 8, 'Fantasy': 10,
  'Horror': 14, 'Mystery': 7, 'Romance': 22, 'Sci-Fi': 24, 'Slice of Life': 36,
  'Sports': 30, 'Supernatural': 37, 'Thriller': 41, 'Mecha': 18, 'Isekai': 62,
  'Ecchi': 9, 'Hentai': 12, 'Suspense': 41, 'Award Winning': 46, 'Erotica': 49,
  'Avant Garde': 5, 'Boys Love': 28, 'Girls Love': 26, 'Gourmet': 47
};

// search pagination state
let currentSearchPage = 1;
let searchTotalPages = 1;
let lastSearchQuery = '';
let lastSearchGenre = '';

// ── TRANSLATIONS ──────────────────────────────────
const LANG = {
  fr: {
    // Auth
    login: 'Connexion', register: 'Inscription', username: 'Identifiant',
    password: 'Mot de passe', confirm: 'Confirmer', connect: 'Se connecter',
    create_account: 'Créer mon compte', tagline: 'Suivez vos animés. Célébrez chaque épisode.',
    err_fill: 'Remplissez tous les champs.', err_creds: 'Identifiant ou mot de passe incorrect.',
    err_min3: '3 caractères minimum.', err_chars: 'Lettres, chiffres et _ uniquement.',
    err_min4: 'Mot de passe : 4 caractères minimum.', err_nomatch: 'Les mots de passe ne correspondent pas.',
    err_taken: 'Identifiant déjà pris.',
    // Nav
    my_list: 'Ma Liste', search: 'Rechercher', discover: 'À découvrir',
    favorites: 'Favoris', top10: 'Top 10',
    // Views
    view_profile: 'Voir le profil →',
    // List
    all: 'Tout', watching: 'En cours', plan: 'À voir', completed: 'Terminé',
    series: 'Séries', movies: 'Films',
    empty_list: 'Aucun animé dans cette liste.\nCherchez-en via la recherche ou découvrez !',
    // Search
    search_ph: 'Naruto, Attack on Titan, Your Name…', search_btn: 'Rechercher',
    genres_all: 'Tous', in_list: '✓ Dans la liste', add: '+ Ajouter',
    no_results: 'Aucun résultat.', searching: 'Recherche…',
    page_of: 'Page',
    // Discover
    disc_subtitle: 'Swipez pour explorer de nouveaux animés',
    not_interested: 'Pas intéressé', to_watch: 'À voir', in_progress: 'En cours',
    done: 'Terminé', watch_trailer: '▶ Trailer', no_trailer: 'Pas de trailer',
    where_watch: 'Où regarder :', no_stream: 'Info streaming non disponible',
    score_label: 'Score MAL', seasons_label: 'Saison',
    eps_label: 'éps', loading: 'Chargement…',
    season_spring: 'Printemps', season_summer: 'Été', season_fall: 'Automne', season_winter: 'Hiver',
    // Modal
    add_to_list: 'Ajouter à la liste', status: 'Statut', progress: 'Progression',
    scores_title: 'Notes', optional: '(optionnel — la moyenne donne la note globale)',
    global_avg: 'Note globale (moyenne)', in_favorites: 'Dans les favoris',
    add_favorites: 'Ajouter aux favoris', delete_list: '🗑 Supprimer de la liste',
    added_fav: '⭐ Ajouté aux favoris !', removed_fav: 'Retiré des favoris',
    no_synopsis: 'Aucun synopsis disponible.',
    viewed_pct: '% visionné', tags_label: 'Tags', see_all_tags: 'Voir tous les tags',
    hide_tags: 'Masquer',
    // Top 10
    add_ranking: 'Ajouter au classement', drag_reorder: 'Glissez pour réordonner',
    top10_full: 'Top 10 complet ! Retirez un animé pour en ajouter un autre.',
    all_ranked_series: 'Toutes les séries terminées sont classées !',
    all_ranked_movies: 'Tous les films terminés sont classés !',
    finish_series: 'Terminez des séries pour les classer ici !',
    finish_movies: 'Terminez des films pour les classer ici !',
    // Profile
    member_since: 'Membre depuis', total: 'Total', completed_lbl: 'Terminés',
    completion: 'Complétés', watching_lbl: 'En cours', plan_lbl: 'À voir',
    fav_genre: 'Genre préféré',
    // Status labels
    status_watching: 'En cours', status_plan: 'À voir', status_completed: 'Terminé',
    // Toasts
    added_to: 'Ajouté : ', added_list: 'ajouté à la liste !', deleted: 'supprimé.',
    added_top: 'Ajouté au Top', films: 'Films',
    // Sidebar / recos
    recos_title: 'Recommandés pour toi', stats_title: 'Tes stats',
    no_recos: 'Termine des animés pour avoir des recos !',
    avg_score: 'Note moyenne', top_genres: 'Genres préférés',
    nothing_yet: 'Aucun animé pour l\'instant',
    based_on: 'Basées sur tes genres préférés',
    new_badge: 'FÉLICITATIONS !', new_badge_sub: 'Nouveau badge débloqué', awesome: 'Génial !',
    test_animation: 'Tester l\'animation', total_completed: 'animés terminés',
    rating_legend_title: 'Légende — Rating', rating_legend_sub: 'Public visé par l\'œuvre',
    rating_g: 'Tout public', rating_pg: 'Enfants', rating_pg13: 'Ados 13+',
    rating_r: '17+ violence/langage', rating_rplus: 'Nudité légère', rating_rx: 'Hentai',
    trailer_title: 'Trailer', no_trailer_panel: 'Pas de bande-annonce disponible pour cet animé.',
    play_trailer: 'Lancer le trailer', watch_on_yt: 'Voir sur YouTube',
    tab_music: '🎵 Musique', loading_music: 'Chargement des musiques…',
    no_themes: 'Aucun opening / ending référencé pour cet animé.',
    openings: 'Openings', endings: 'Endings',
    listen_on_yt: 'Écouter sur YouTube', music_global: 'Note musique globale',
    music_like: 'J\'aime', music_dislike: 'Je n\'aime pas', music_favorite: 'Favori',
    top_op: 'Openings', top_ed: 'Endings',
    t10_op_empty: 'Favorise des openings pour les classer ici !',
    t10_ed_empty: 'Favorise des endings pour les classer ici !',
    t10_op_picker_empty: 'Aucun opening favorisé. Marque des tracks ⭐ dans l\'onglet Musique d\'un animé.',
    t10_ed_picker_empty: 'Aucun ending favorisé. Marque des tracks ⭐ dans l\'onglet Musique d\'un animé.',
    t10_full_op: 'Top 10 complet ! Retire un opening pour en ajouter un autre.',
    t10_full_ed: 'Top 10 complet ! Retire un ending pour en ajouter un autre.',
    tab_reviews: '📰 Reviews', loading_reviews: 'Chargement des avis…',
    no_reviews: 'Aucune review pour cet animé.',
    reviews_count_one: 'avis', reviews_count_more: 'avis',
    preliminary: 'Préliminaire', spoiler: 'Spoiler',
    click_to_reveal: 'Spoiler — clique pour afficher', helpful_count: 'utile',
    show_more: 'Voir plus', show_less: 'Voir moins',
    by_user: 'par', view_full_yt_link: 'Voir l\'avis complet sur MAL',
    demographics: 'Démographie',
    shounen: 'Shōnen', shoujo: 'Shōjo', seinen: 'Seinen', josei: 'Josei', kids: 'Kids',
    donation: 'Don', donate_title: 'Soutenir Track Deez',
    donate_msg: 'Track Deez est gratuit et open-source. Si l\'app te plaît, tu peux soutenir le développement avec un petit don ☕',
    donate_btn: 'Faire un don via PayPal', donate_thanks: 'Merci pour ton soutien !',
    pseudo_label: 'Pseudo (nom affiché)', pseudo_ph: 'Comment veux-tu être appelé ?',
    pseudo_required: 'Choisis un pseudo (nom affiché).',
    avatar_change: 'Changer ma photo de profil',
    avatar_picker_title: 'Choisir une photo de profil',
    avatar_picker_sub: 'Personnages issus des animés ⭐ favoris',
    avatar_remove: 'Retirer la photo (revenir aux initiales)',
    no_fav_for_avatar: 'Marque d\'abord des animés comme ⭐ favori dans Ma Liste pour pouvoir choisir un personnage.',
    no_chars_for_avatar: 'Aucun personnage trouvé pour tes animés favoris.',
    avatar_loading_chars: 'Chargement des personnages…',
    avatar_set: 'Photo de profil mise à jour !',
    achievements: 'Achievements', achievements_title: 'Achievements',
    achievements_sub: 'Badges et succès débloqués selon ce que tu as regardé',
    your_tier: 'Ton palier actuel', special_achievements: 'Succès spéciaux', hidden_achievements_section: 'Succès cachés',
    locked: 'Verrouillé', unlocked: 'Débloqué',
    hidden_ach: 'Achievement caché', hidden_ach_hint: 'Continue à explorer pour le découvrir…',
    quiz:'Quizz', quiz_title:'Quizz',
    quiz_sub:'Teste tes connaissances sur tes animés ⭐ favoris',
    quiz_select:'Choisis un animé pour lancer un quizz',
    quiz_no_fav:'Marque d\'abord des animés en ⭐ favori. Quizz disponibles pour : One Piece, Naruto, Bleach, Dragon Ball Z, Monster, Steins;Gate, Hunter x Hunter, Attack on Titan, FMA Brotherhood, Jujutsu Kaisen.',
    quiz_q_count:'questions', quiz_start:'Commencer',
    quiz_question:'Question', quiz_score:'Score',
    quiz_next:'Suivant', quiz_finish:'Voir le résultat',
    quiz_correct:'Bonne réponse !', quiz_wrong:'Mauvaise réponse',
    quiz_lore:'📖 Lore', quiz_complete:'Quizz terminé !',
    quiz_your_score:'Ton score', quiz_review:'Tes erreurs',
    quiz_perfect_msg:'Score parfait ! 🎉', quiz_zero_msg:'Aïe… 0/10 !',
    quiz_retry:'Refaire', quiz_back:'Choisir un autre animé',
    quiz_you_picked:'Ta réponse', quiz_correct_was:'Bonne réponse',
    quiz_difficulty:'Difficulté', quiz_diff_1:'Facile', quiz_diff_2:'Moyen', quiz_diff_3:'Difficile',
    quiz_no_questions:'Pas de questions à ce niveau pour le moment.',
    quiz_completed:'✓ Complété', quiz_success:'% de réussite',
    quiz_locked:'🔒 Favorise l\'animé pour débloquer',
    quiz_best:'Meilleur score :',
    sync_btn:'🔄 Synchroniser les métadonnées',
    sync_hint:'Si certains achievements semblent ne pas compter, lance une resynchro pour rapatrier les démographies/genres manquants depuis Jikan.',
    sync_progress:'Synchronisation en cours…',
    sync_done:'Toutes les métadonnées sont à jour',
    sync_done_n:'animés synchronisés',
    sync_skip_uptodate:'Toutes les métadonnées sont déjà à jour ✓',
    install_title:'Installe Track Deez sur ton iPhone',
    install_msg:'Profite de l\'app en plein écran, sans la barre Safari, comme une vraie app.',
    install_step_1:'Appuie sur', install_step_1b:'en bas de Safari',
    install_step_2:'Choisis « Sur l\'écran d\'accueil »',
    install_step_3:'Tape « Ajouter » en haut à droite',
    podium_title: 'Podium des séries', no_top_yet: 'Classe des séries dans ton Top 10 pour voir le podium ici.',
    hide_nsfw: 'Masquer le contenu sensible (Rx)',
    data_section: 'Sauvegarde des données',
    data_msg: 'Migre tes données entre appareils ou fais une copie de sauvegarde.',
    export_btn: '📤 Exporter mes données',
    import_btn: '📥 Importer une sauvegarde',
    import_link_auth: '📥 Importer une sauvegarde existante',
    import_success: 'Import réussi',
    import_error: 'Fichier invalide ou corrompu',
    export_done: 'Sauvegarde téléchargée',
    confirm_import: 'Importer écrasera les comptes existants portant le même identifiant. Continuer ?',
    // Sort & filters
    sort_by: 'Trier', sort_recent: 'Récent', sort_alpha: 'A → Z',
    sort_alpha_rev: 'Z → A', sort_score_desc: 'Note ↓', sort_score_asc: 'Note ↑',
    hide_added: 'Masquer ceux déjà ajoutés',
    // Modal tabs
    tab_details: '📋 Détails', tab_characters: '👥 Personnages',
    no_chars: 'Pas de personnages disponibles.', loading_chars: 'Chargement…',
    char_global: 'Global perso',
    translating: 'Traduction…', translated_auto: 'Traduit auto',
    show_original: 'Voir l\'original', show_translation: 'Voir la traduction',
  },
  en: {
    // Auth
    login: 'Login', register: 'Register', username: 'Username',
    password: 'Password', confirm: 'Confirm', connect: 'Sign in',
    create_account: 'Create account', tagline: 'Track your anime. Celebrate every episode.',
    err_fill: 'Please fill all fields.', err_creds: 'Wrong username or password.',
    err_min3: 'Minimum 3 characters.', err_chars: 'Letters, digits and _ only.',
    err_min4: 'Password: minimum 4 characters.', err_nomatch: 'Passwords do not match.',
    err_taken: 'Username already taken.',
    // Nav
    my_list: 'My List', search: 'Search', discover: 'Discover',
    favorites: 'Favorites', top10: 'Top 10',
    // Views
    view_profile: 'View profile →',
    // List
    all: 'All', watching: 'Watching', plan: 'Plan to Watch', completed: 'Completed',
    series: 'Series', movies: 'Movies',
    empty_list: 'No anime in this list.\nSearch or discover new ones!',
    // Search
    search_ph: 'Naruto, Attack on Titan, Your Name…', search_btn: 'Search',
    genres_all: 'All', in_list: '✓ In list', add: '+ Add',
    no_results: 'No results.', searching: 'Searching…',
    page_of: 'Page',
    // Discover
    disc_subtitle: 'Swipe to explore new anime',
    not_interested: 'Not interested', to_watch: 'Plan to watch', in_progress: 'Watching',
    done: 'Completed', watch_trailer: '▶ Trailer', no_trailer: 'No trailer',
    where_watch: 'Where to watch:', no_stream: 'Streaming info not available',
    score_label: 'MAL Score', seasons_label: 'Season',
    eps_label: 'eps', loading: 'Loading…',
    season_spring: 'Spring', season_summer: 'Summer', season_fall: 'Fall', season_winter: 'Winter',
    // Modal
    add_to_list: 'Add to list', status: 'Status', progress: 'Progress',
    scores_title: 'Scores', optional: '(optional — average gives global score)',
    global_avg: 'Global score (average)', in_favorites: 'In favorites',
    add_favorites: 'Add to favorites', delete_list: '🗑 Remove from list',
    added_fav: '⭐ Added to favorites!', removed_fav: 'Removed from favorites',
    no_synopsis: 'No synopsis available.',
    viewed_pct: '% watched', tags_label: 'Tags', see_all_tags: 'See all tags',
    hide_tags: 'Hide',
    // Top 10
    add_ranking: 'Add to ranking', drag_reorder: 'Drag to reorder',
    top10_full: 'Top 10 full! Remove an anime to add another.',
    all_ranked_series: 'All completed series are ranked!',
    all_ranked_movies: 'All completed movies are ranked!',
    finish_series: 'Complete series to rank them here!',
    finish_movies: 'Complete movies to rank them here!',
    // Profile
    member_since: 'Member since', total: 'Total', completed_lbl: 'Completed',
    completion: 'Completion', watching_lbl: 'Watching', plan_lbl: 'Plan to watch',
    fav_genre: 'Favorite genre',
    // Status labels
    status_watching: 'Watching', status_plan: 'Plan to watch', status_completed: 'Completed',
    // Toasts
    added_to: 'Added: ', added_list: 'added to list!', deleted: 'deleted.',
    added_top: 'Added to Top', films: 'Movies',
    // Sidebar / recos
    recos_title: 'Recommended for you', stats_title: 'Your stats',
    no_recos: 'Complete some anime to get recommendations!',
    avg_score: 'Average score', top_genres: 'Top genres',
    nothing_yet: 'No anime yet',
    based_on: 'Based on your top genres',
    new_badge: 'CONGRATULATIONS!', new_badge_sub: 'New badge unlocked', awesome: 'Awesome!',
    test_animation: 'Preview animation', total_completed: 'anime completed',
    rating_legend_title: 'Legend — Audience rating', rating_legend_sub: 'Intended audience',
    rating_g: 'All ages', rating_pg: 'Children', rating_pg13: 'Teens 13+',
    rating_r: '17+ violence/language', rating_rplus: 'Mild nudity', rating_rx: 'Hentai',
    trailer_title: 'Trailer', no_trailer_panel: 'No trailer available for this anime.',
    play_trailer: 'Play trailer', watch_on_yt: 'Watch on YouTube',
    tab_music: '🎵 Music', loading_music: 'Loading themes…',
    no_themes: 'No opening/ending listed for this anime.',
    openings: 'Openings', endings: 'Endings',
    listen_on_yt: 'Listen on YouTube', music_global: 'Music global score',
    music_like: 'Like', music_dislike: 'Dislike', music_favorite: 'Favorite',
    top_op: 'Openings', top_ed: 'Endings',
    t10_op_empty: 'Favorite some openings to rank them here!',
    t10_ed_empty: 'Favorite some endings to rank them here!',
    t10_op_picker_empty: 'No favorited openings yet. Mark tracks as ⭐ in the Music tab of an anime.',
    t10_ed_picker_empty: 'No favorited endings yet. Mark tracks as ⭐ in the Music tab of an anime.',
    t10_full_op: 'Top 10 full! Remove an opening to add another.',
    t10_full_ed: 'Top 10 full! Remove an ending to add another.',
    tab_reviews: '📰 Reviews', loading_reviews: 'Loading reviews…',
    no_reviews: 'No reviews yet for this anime.',
    reviews_count_one: 'review', reviews_count_more: 'reviews',
    preliminary: 'Preliminary', spoiler: 'Spoiler',
    click_to_reveal: 'Spoiler — click to reveal', helpful_count: 'helpful',
    show_more: 'Show more', show_less: 'Show less',
    by_user: 'by', view_full_yt_link: 'View full review on MAL',
    demographics: 'Demographics',
    shounen: 'Shōnen', shoujo: 'Shōjo', seinen: 'Seinen', josei: 'Josei', kids: 'Kids',
    donation: 'Donate', donate_title: 'Support Track Deez',
    donate_msg: 'Track Deez is free and open-source. If you enjoy it, you can support development with a small donation ☕',
    donate_btn: 'Donate via PayPal', donate_thanks: 'Thank you for supporting!',
    pseudo_label: 'Display name', pseudo_ph: 'How should we call you?',
    pseudo_required: 'Pick a display name.',
    avatar_change: 'Change profile picture',
    avatar_picker_title: 'Choose a profile picture',
    avatar_picker_sub: 'Characters from your ⭐ favorited anime',
    avatar_remove: 'Remove picture (back to initials)',
    no_fav_for_avatar: 'Favorite some anime in My List first to pick a character.',
    no_chars_for_avatar: 'No characters found in your favorited anime.',
    avatar_loading_chars: 'Loading characters…',
    avatar_set: 'Profile picture updated!',
    achievements: 'Achievements', achievements_title: 'Achievements',
    achievements_sub: 'Badges and milestones unlocked based on what you watched',
    your_tier: 'Your current tier', special_achievements: 'Special achievements', hidden_achievements_section: 'Hidden achievements',
    locked: 'Locked', unlocked: 'Unlocked',
    hidden_ach: 'Hidden achievement', hidden_ach_hint: 'Keep exploring to discover it…',
    quiz:'Quiz', quiz_title:'Quiz',
    quiz_sub:'Test your knowledge on your ⭐ favorited anime',
    quiz_select:'Pick an anime to start a quiz',
    quiz_no_fav:'Favorite some anime first. Quizzes available for: One Piece, Naruto, Bleach, Dragon Ball Z, Monster, Steins;Gate, Hunter x Hunter, Attack on Titan, FMA Brotherhood, Jujutsu Kaisen.',
    quiz_q_count:'questions', quiz_start:'Start',
    quiz_question:'Question', quiz_score:'Score',
    quiz_next:'Next', quiz_finish:'See result',
    quiz_correct:'Correct!', quiz_wrong:'Wrong',
    quiz_lore:'📖 Lore', quiz_complete:'Quiz complete!',
    quiz_your_score:'Your score', quiz_review:'Your mistakes',
    quiz_perfect_msg:'Perfect score! 🎉', quiz_zero_msg:'Ouch… 0/10!',
    quiz_retry:'Retry', quiz_back:'Pick another anime',
    quiz_you_picked:'Your answer', quiz_correct_was:'Correct answer',
    quiz_difficulty:'Difficulty', quiz_diff_1:'Easy', quiz_diff_2:'Medium', quiz_diff_3:'Hard',
    quiz_no_questions:'No questions at this level yet.',
    quiz_completed:'✓ Completed', quiz_success:'% success rate',
    quiz_locked:'🔒 Favorite the anime to unlock',
    quiz_best:'Best score:',
    sync_btn:'🔄 Sync metadata',
    sync_hint:'If some achievements don\'t seem to count, run a resync to pull missing demographics/genres from Jikan.',
    sync_progress:'Syncing…',
    sync_done:'All metadata is up to date',
    sync_done_n:'anime synced',
    sync_skip_uptodate:'All metadata is already up to date ✓',
    install_title:'Install Track Deez on your iPhone',
    install_msg:'Enjoy the app full-screen without Safari\'s bars, like a real native app.',
    install_step_1:'Tap', install_step_1b:'at the bottom of Safari',
    install_step_2:'Choose "Add to Home Screen"',
    install_step_3:'Tap "Add" in the top-right corner',
    podium_title: 'Series podium', no_top_yet: 'Rank some series in your Top 10 to see the podium here.',
    hide_nsfw: 'Hide sensitive content (Rx)',
    data_section: 'Data backup',
    data_msg: 'Migrate your data between devices or back it up.',
    export_btn: '📤 Export my data',
    import_btn: '📥 Import a backup',
    import_link_auth: '📥 Import an existing backup',
    import_success: 'Import successful',
    import_error: 'Invalid or corrupt file',
    export_done: 'Backup downloaded',
    confirm_import: 'Importing will overwrite existing accounts with the same identifier. Continue?',
    locked: 'Locked', unlocked: 'Unlocked',
    // Sort & filters
    sort_by: 'Sort', sort_recent: 'Recent', sort_alpha: 'A → Z',
    sort_alpha_rev: 'Z → A', sort_score_desc: 'Score ↓', sort_score_asc: 'Score ↑',
    hide_added: 'Hide already added',
    // Modal tabs
    tab_details: '📋 Details', tab_characters: '👥 Characters',
    no_chars: 'No characters available.', loading_chars: 'Loading…',
    char_global: 'Personal global',
    translating: 'Translating…', translated_auto: 'Auto-translated',
    show_original: 'Show original', show_translation: 'Show translation',
  }
};

function t(key) { return LANG[currentLang]?.[key] ?? LANG.fr[key] ?? key; }

function toggleLang() {
  currentLang = currentLang === 'fr' ? 'en' : 'fr';
  if (currentUser) {
    const d = getUserData(currentUser);
    d.lang = currentLang;
    saveUserData(currentUser, d);
  }
  applyLang();
}

function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (el.tagName === 'INPUT' && el.placeholder !== undefined) {
      el.placeholder = t(key);
    } else {
      el.textContent = t(key);
    }
  });
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.textContent = currentLang === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR';
  });
  // Re-render current view with new lang
  if (currentView === 'list') renderListView();
  if (currentView === 'search') refreshSearchCards();
  if (currentView === 'favorites') renderFavorites();
  if (currentView === 'quizz') renderQuizView();
  if (currentView === 'top10') renderTop10();
  if (currentView === 'achievements') renderAchievements();
  if (currentView === 'discover') { showDiscoverCard(); renderDiscoverStats(); renderDiscoverRecos(); }
}

// ── SCORE CATEGORIES ──────────────────────────────
const SCORE_CATS = [
  { key: 'story', labelFr: 'Histoire', labelEn: 'Story', emoji: '📖' },
  { key: 'animation', labelFr: 'Animation', labelEn: 'Animation', emoji: '🎨' },
  { key: 'music', labelFr: 'Musiques & OST', labelEn: 'Music & OST', emoji: '🎵' },
  { key: 'chardesign', labelFr: 'Character Design', labelEn: 'Character Design', emoji: '✏️' },
  { key: 'chardev', labelFr: 'Développement des persos', labelEn: 'Character Development', emoji: '🌱' },
  { key: 'ambiance', labelFr: 'Ambiance', labelEn: 'Atmosphere', emoji: '🌙' },
];

function scoreCatLabel(cat) {
  return currentLang === 'en' ? cat.labelEn : cat.labelFr;
}

function computeGlobal(scores) {
  if (!scores) return null;
  const vals = SCORE_CATS.map(c => scores[c.key]).filter(v => v !== null && v !== undefined);
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

function isMovie(a) { return a?.type === 'Movie'; }

// ── TRAILER ID extraction (handles all Jikan response shapes) ──
function extractTrailerId(t) {
  if (!t) return null;
  if (typeof t === 'string') return /^[\w-]{11}$/.test(t) ? t : null;
  if (t.youtube_id) return t.youtube_id;
  if (t.url) {
    const m = String(t.url).match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([\w-]{11})/);
    if (m) return m[1];
  }
  if (t.embed_url) {
    const m = String(t.embed_url).match(/\/embed\/([\w-]{11})/);
    if (m) return m[1];
  }
  return null;
}

// ══ QUIZ BANK ═════════════════════════════════════
// Question format: { q (FR), qe (EN), c [4 choices], ans (correct idx), l (FR lore), le (EN lore) }
// Choices share same array for both langs (mostly proper nouns).
const QUIZ_BANK = {
  21: { // One Piece
    title: 'One Piece', image: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg',
    questions: [
      { q:'Quel personnage maîtrise le pouvoir du caoutchouc ?', qe:'Which character masters the rubber power?', c:['Roronoa Zoro','Monkey D. Luffy','Sanji','Nami'], ans:1, l:'Luffy a mangé le Gomu Gomu no Mi (fruit du caoutchouc), qui rend tout son corps élastique.', le:'Luffy ate the Gomu Gomu no Mi (Gum-Gum Fruit), making his entire body elastic.' },
      { q:'Qui a donné son chapeau de paille à Luffy ?', qe:'Who gave Luffy his straw hat?', c:['Gol D. Roger','Shanks','Garp','Whitebeard'], ans:1, l:'Shanks le Roux confie son chapeau à Luffy enfant, en lui faisant promettre de le lui rendre devenu grand pirate.', le:'Red-Haired Shanks lent the hat to a young Luffy, asking him to return it once he became a great pirate.' },
      { q:'Quel est le nom du frère de Luffy mort à Marineford ?', qe:'What is the name of Luffy\'s brother who died at Marineford?', c:['Sabo','Portgas D. Ace','Marco','Edward Newgate'], ans:1, l:'Ace, fils de Gol D. Roger et possesseur du Mera Mera no Mi, est tué par Akainu en protégeant Luffy.', le:'Ace, son of Gol D. Roger and user of the Mera Mera no Mi, was killed by Akainu while protecting Luffy.' },
      { q:'Quel style de combat utilise Roronoa Zoro ?', qe:'What fighting style does Roronoa Zoro use?', c:['Ittōryū','Nitōryū','Santōryū','Yontōryū'], ans:2, l:'Zoro utilise le Santōryū (style à 3 sabres) — un dans chaque main et un dans la bouche.', le:'Zoro uses Santōryū (Three-Sword Style): one in each hand and one in his mouth.' },
      { q:'Quel fruit du démon possède Barbe Blanche ?', qe:'Which Devil Fruit does Whitebeard wield?', c:['Magu Magu no Mi','Gura Gura no Mi','Yami Yami no Mi','Ope Ope no Mi'], ans:1, l:'Le Gura Gura no Mi (fruit des tremblements) lui permet de fissurer l\'air et provoquer des séismes.', le:'The Gura Gura no Mi (Tremor-Tremor Fruit) lets him crack the air and cause earthquakes.' },
      { q:'Qui est le capitaine des Heart Pirates ?', qe:'Who captains the Heart Pirates?', c:['Eustass Kid','Trafalgar D. Water Law','X Drake','Basil Hawkins'], ans:1, l:'Law, possesseur du Ope Ope no Mi, devient l\'allié clé de Luffy à partir de Punk Hazard.', le:'Law, holder of the Ope Ope no Mi, becomes a key ally of Luffy starting from Punk Hazard.' },
      { q:'Quel personnage est un médecin renne ?', qe:'Which crew member is a reindeer doctor?', c:['Chopper','Brook','Franky','Usopp'], ans:0, l:'Tony Tony Chopper a mangé le Hito Hito no Mi (fruit humain) : c\'est un renne qui peut prendre forme humaine.', le:'Tony Tony Chopper ate the Hito Hito no Mi (Human-Human Fruit): a reindeer that can take human form.' },
      { q:'Quel est le nom du village de Luffy ?', qe:'What is the name of Luffy\'s home village?', c:['Foosha','Syrup','Cocoyashi','Loguetown'], ans:0, l:'Luffy a grandi à Foosha Village, où il a rencontré Shanks et Makino.', le:'Luffy grew up in Foosha Village, where he met Shanks and Makino.' },
    ],
  },
  20: { // Naruto
    title: 'Naruto', image: 'https://cdn.myanimelist.net/images/anime/13/17405.jpg',
    questions: [
      { q:'Quelle technique signature utilise Naruto ?', qe:'What is Naruto\'s signature jutsu?', c:['Chidori','Rasengan','Kage Bunshin','Amaterasu'], ans:1, l:'Le Rasengan a été créé par Minato (4e Hokage), le père de Naruto. Naruto le perfectionne ensuite avec le chakra Vent.', le:'The Rasengan was created by Minato (4th Hokage), Naruto\'s father. Naruto later refines it with Wind chakra.' },
      { q:'Comment s\'appelle le père de Naruto ?', qe:'What is the name of Naruto\'s father?', c:['Hiruzen Sarutobi','Jiraiya','Minato Namikaze','Hashirama Senju'], ans:2, l:'Minato Namikaze, le 4e Hokage surnommé "Éclair Jaune de Konoha", a scellé Kyuubi dans Naruto au prix de sa vie.', le:'Minato Namikaze, the 4th Hokage known as the "Yellow Flash of Konoha", sealed Kurama into Naruto at the cost of his life.' },
      { q:'Qui a massacré le clan Uchiha ?', qe:'Who massacred the Uchiha clan?', c:['Madara Uchiha','Itachi Uchiha','Obito Uchiha','Danzō'], ans:1, l:'Itachi a tué tout le clan sur ordre du Conseil de Konoha pour empêcher un coup d\'état, épargnant son frère Sasuke.', le:'Itachi killed the entire clan under orders from Konoha\'s Council to prevent a coup, sparing his brother Sasuke.' },
      { q:'Quel élément maîtrise principalement Gaara ?', qe:'Which element does Gaara primarily wield?', c:['Le feu','L\'eau','Le sable','La foudre'], ans:2, l:'Gaara contrôle le sable grâce au démon Shukaku (Ichibi) scellé en lui dès sa naissance.', le:'Gaara controls sand through the Shukaku (One-Tails) sealed inside him since birth.' },
      { q:'Quelle est la technique signature de Kakashi ?', qe:'What is Kakashi\'s signature technique?', c:['Rasengan','Chidori','Susanoo','Kamui'], ans:1, l:'Le Chidori (mille oiseaux) a été créé par Kakashi, qui l\'a ensuite enseigné à Sasuke.', le:'The Chidori (Thousand Birds) was created by Kakashi, who later taught it to Sasuke.' },
      { q:'Qui est le maître de Sakura ?', qe:'Who is Sakura\'s mentor?', c:['Tsunade','Shizune','Hiruzen','Jiraiya'], ans:0, l:'Tsunade, 5e Hokage et l\'une des trois Sannin, forme Sakura en médecine ninja.', le:'Tsunade, the 5th Hokage and one of the Three Sannin, trains Sakura in medical ninjutsu.' },
      { q:'Combien de Hokage y a-t-il eu avant Naruto ?', qe:'How many Hokage came before Naruto?', c:['4','5','6','7'], ans:2, l:'Hashirama (1er), Tobirama (2e), Hiruzen (3e), Minato (4e), Tsunade (5e), Kakashi (6e). Naruto devient le 7e.', le:'Hashirama (1st), Tobirama (2nd), Hiruzen (3rd), Minato (4th), Tsunade (5th), Kakashi (6th). Naruto becomes the 7th.' },
      { q:'Quel doujutsu possède Sasuke ?', qe:'Which dōjutsu does Sasuke have?', c:['Byakugan','Sharingan','Rinnegan','Tenseigan'], ans:1, l:'Sasuke éveille son Sharingan contre Haku, puis évolue vers le Mangekyō Sharingan, le Mangekyō Eternal et finalement le Rinnegan.', le:'Sasuke awakens his Sharingan against Haku, later evolving to Mangekyō, Eternal Mangekyō, and ultimately the Rinnegan.' },
    ],
  },
  269: { // Bleach
    title: 'Bleach', image: 'https://cdn.myanimelist.net/images/anime/3/40451.jpg',
    questions: [
      { q:'Quel est le nom du Zanpakutō d\'Ichigo ?', qe:'What is the name of Ichigo\'s Zanpakutō?', c:['Sode no Shirayuki','Zangetsu','Senbonzakura','Hyōrinmaru'], ans:1, l:'Zangetsu (lune-coupant) reflète la dualité Shinigami/Hollow d\'Ichigo : son esprit Quincy se révèle plus tard être le vrai Zangetsu.', le:'Zangetsu (Slaying Moon) reflects Ichigo\'s Shinigami/Hollow duality; his Quincy spirit is later revealed to be the true Zangetsu.' },
      { q:'Qui est le père d\'Ichigo Kurosaki ?', qe:'Who is Ichigo\'s father?', c:['Isshin Kurosaki','Ryūken Ishida','Kisuke Urahara','Sōsuke Aizen'], ans:0, l:'Isshin était l\'ancien capitaine de la 10e division. Il a quitté la Soul Society par amour pour Masaki.', le:'Isshin was the former captain of the 10th Division. He left Soul Society out of love for Masaki.' },
      { q:'Quel artefact Aizen veut-il pour devenir un dieu ?', qe:'Which artifact does Aizen seek to become a god?', c:['Hōgyoku','Sōkyoku','Senkaimon','Garganta'], ans:0, l:'Le Hōgyoku, créé par Urahara, brise la barrière entre Hollows et Shinigami et amplifie les pouvoirs.', le:'The Hōgyoku, created by Urahara, dissolves the boundary between Hollows and Shinigami and amplifies powers.' },
      { q:'De quel élément est le Zanpakutō de Tōshirō Hitsugaya ?', qe:'What element is Hitsugaya\'s Zanpakutō?', c:['Feu','Glace','Foudre','Vent'], ans:1, l:'Hyōrinmaru est le plus puissant Zanpakutō de glace de la Soul Society. Hitsugaya devient capitaine de la 10e division.', le:'Hyōrinmaru is the most powerful ice-type Zanpakutō in Soul Society. Hitsugaya becomes captain of the 10th Division.' },
      { q:'Qui dirige la 1ère division du Gotei 13 ?', qe:'Who captains the 1st Division of the Gotei 13?', c:['Byakuya Kuchiki','Genryūsai Yamamoto','Jūshirō Ukitake','Kenpachi Zaraki'], ans:1, l:'Yamamoto, le Capitaine-Commandant, manie Ryūjin Jakka, le plus ancien et puissant Zanpakutō de feu.', le:'Yamamoto, the Captain-Commander, wields Ryūjin Jakka, the oldest and most powerful fire-type Zanpakutō.' },
      { q:'Comment s\'appelle le Bankai de Renji ?', qe:'What is the name of Renji\'s Bankai?', c:['Senbonzakura Kageyoshi','Hihiō Zabimaru','Tensa Zangetsu','Daiguren Hyōrinmaru'], ans:1, l:'Hihiō Zabimaru transforme son Zanpakutō en serpent-babouin géant articulé contrôlable.', le:'Hihiō Zabimaru transforms his Zanpakutō into a massive segmented snake-baboon under his control.' },
      { q:'Qui est le frère adoptif de Rukia ?', qe:'Who is Rukia\'s adoptive brother?', c:['Renji Abarai','Kaien Shiba','Byakuya Kuchiki','Gin Ichimaru'], ans:2, l:'Byakuya, capitaine de la 6e division, a adopté Rukia pour respecter la dernière volonté de sa femme défunte Hisana.', le:'Byakuya, captain of the 6th Division, adopted Rukia to honor the dying wish of his late wife Hisana.' },
      { q:'Combien de divisions compte le Gotei 13 ?', qe:'How many Divisions does the Gotei 13 have?', c:['10','12','13','15'], ans:2, l:'Le Gotei 13 (les "13 Cours de Garde") regroupe 13 divisions, chacune dirigée par un capitaine.', le:'The Gotei 13 ("13 Court Guard Squads") is made up of 13 divisions, each led by a captain.' },
    ],
  },
  813: { // Dragon Ball Z
    title: 'Dragon Ball Z', image: 'https://cdn.myanimelist.net/images/anime/1607/117271.jpg',
    questions: [
      { q:'Quelle est l\'attaque signature de Goku ?', qe:'What is Goku\'s signature attack?', c:['Final Flash','Kamehameha','Galick Gun','Special Beam Cannon'], ans:1, l:'Le Kamehameha a été créé par Maître Roshi. Goku l\'apprend très jeune et le perfectionne au fil de ses combats.', le:'The Kamehameha was created by Master Roshi. Goku learns it very young and refines it through countless battles.' },
      { q:'Quel est le nom Saiyan de Goku ?', qe:'What is Goku\'s Saiyan name?', c:['Bardock','Kakarot','Raditz','Turles'], ans:1, l:'Kakarot, fils de Bardock, a été envoyé sur Terre comme bébé pour la conquérir avant l\'extermination des Saiyans.', le:'Kakarot, son of Bardock, was sent to Earth as a baby to conquer it before the Saiyans\' extinction.' },
      { q:'Quels androïdes Cell absorbe-t-il pour devenir parfait ?', qe:'Which androids does Cell absorb to reach Perfect form?', c:['16 et 17','17 et 18','18 et 19','17 et 20'], ans:1, l:'Cell, créé par le Dr Gero, doit absorber les androïdes C-17 et C-18 pour atteindre sa forme parfaite et organiser le Cell Game.', le:'Cell, created by Dr. Gero, must absorb androids 17 and 18 to reach Perfect form and host the Cell Games.' },
      { q:'Combien de formes possède Freezer ?', qe:'How many forms does Frieza have?', c:['3','4','5','6'], ans:1, l:'Freezer a 4 formes connues à l\'origine. Plus tard, il développe Golden Freezer puis Black Freezer.', le:'Frieza originally has 4 known forms. Later he develops Golden Frieza and Black Frieza.' },
      { q:'De quelle planète vient Piccolo ?', qe:'Which planet is Piccolo from?', c:['Vegeta','Namek','Yardrat','Kanassa'], ans:1, l:'Piccolo et Kami sont des Nameks. Kami a séparé sa partie maléfique pour devenir gardien de la Terre.', le:'Piccolo and Kami are Namekians. Kami separated his evil half to become Earth\'s guardian.' },
      { q:'Qui est le fils de Vegeta dans la chronologie de Trunks du futur ?', qe:'Who is Vegeta\'s son in Future Trunks\' timeline?', c:['Goten','Trunks','Tarble','Bra'], ans:1, l:'Trunks, fils de Vegeta et Bulma, voyage du futur pour avertir les héros au sujet des androïdes.', le:'Trunks, son of Vegeta and Bulma, travels from the future to warn the heroes about the androids.' },
      { q:'Comment Goku atteint-il pour la première fois Super Saiyan ?', qe:'How does Goku first turn Super Saiyan?', c:['Contre Vegeta','Contre Freezer sur Namek','Contre Cell','Lors d\'un entraînement'], ans:1, l:'Goku se transforme la première fois en SSJ contre Freezer sur Namek, après la mort de Krilin.', le:'Goku first transforms into SSJ against Frieza on Namek, after Krillin\'s death.' },
      { q:'Quel est le rang de Vegeta avant son arrivée sur Terre ?', qe:'What is Vegeta\'s rank before arriving on Earth?', c:['Soldat','Élite','Prince','Roi'], ans:2, l:'Vegeta est le Prince des Saiyans, fils du Roi Vegeta, et un guerrier d\'élite au service de Freezer.', le:'Vegeta is the Prince of all Saiyans, son of King Vegeta, and an elite warrior serving Frieza.' },
    ],
  },
  19: { // Monster
    title: 'Monster', image: 'https://cdn.myanimelist.net/images/anime/10/18793.jpg',
    questions: [
      { q:'Quelle est la profession du Dr Tenma ?', qe:'What is Dr. Tenma\'s profession?', c:['Cardiologue','Neurochirurgien','Psychiatre','Pédiatre'], ans:1, l:'Le Dr Kenzō Tenma est neurochirurgien à l\'hôpital Eisler Memorial à Düsseldorf.', le:'Dr. Kenzō Tenma is a neurosurgeon at the Eisler Memorial Hospital in Düsseldorf.' },
      { q:'Comment s\'appelle l\'antagoniste principal ?', qe:'What is the name of the main antagonist?', c:['Hans Liebert','Johan Liebert','Anton Liebert','Friedrich Liebert'], ans:1, l:'Johan Liebert est l\'enfant que Tenma a sauvé en début de série. Il devient un tueur en série calme et terrifiant.', le:'Johan Liebert is the child Tenma saved at the start of the series. He becomes a calm and terrifying serial killer.' },
      { q:'Comment s\'appelle la sœur jumelle de Johan ?', qe:'What is the name of Johan\'s twin sister?', c:['Eva Heinemann','Anna Liebert (Nina Fortner)','Lotte Frank','Karin Lipsky'], ans:1, l:'Anna, élevée plus tard sous le nom de Nina Fortner, est la jumelle de Johan et un personnage central de l\'histoire.', le:'Anna, later raised as Nina Fortner, is Johan\'s twin sister and a central character of the story.' },
      { q:'Quel inspecteur traque Tenma à travers l\'Europe ?', qe:'Which inspector hunts Tenma across Europe?', c:['Heinrich Lunge','Wolfgang Grimmer','Eisler','Verdemann'], ans:0, l:'L\'inspecteur Heinrich Lunge est obsédé par Tenma qu\'il croit coupable, et utilise une mémoire photographique remarquable.', le:'Inspector Heinrich Lunge is obsessed with Tenma — whom he believes guilty — and relies on his remarkable photographic memory.' },
      { q:'Où se déroulent les expériences sur les enfants ?', qe:'Where were the experiments on children conducted?', c:['Kinderheim 511','Schloss Berg','Roter Rosen','Heineman Institute'], ans:0, l:'Kinderheim 511 était un orphelinat est-allemand où des expériences psychologiques étaient menées pendant la Guerre Froide.', le:'Kinderheim 511 was an East German orphanage that ran psychological experiments during the Cold War.' },
      { q:'Dans quelle ville se déroule le climax final ?', qe:'In which town does the final climax take place?', c:['Munich','Prague','Ruhenheim','Vienne'], ans:2, l:'Ruhenheim, petite ville isolée, devient le théâtre du plan final de Johan visant à recréer un "suicide parfait".', le:'Ruhenheim, an isolated small town, becomes the stage for Johan\'s final plan to recreate a "perfect suicide".' },
      { q:'Comment s\'appelle l\'ex-fiancée de Tenma ?', qe:'What is the name of Tenma\'s ex-fiancée?', c:['Eva Heinemann','Karin Lipsky','Margot Langer','Maria'], ans:0, l:'Eva Heinemann, fille du directeur Heinemann, rompt avec Tenma au début et sombre dans l\'alcoolisme avant de l\'aider plus tard.', le:'Eva Heinemann, daughter of director Heinemann, breaks up with Tenma at the start and falls into alcoholism before helping him later.' },
      { q:'Quel livre déclenche les souvenirs traumatiques chez Johan ?', qe:'Which picture book triggers Johan\'s traumatic memories?', c:['Le Chat sans nom','Le Monstre sans nom','La Forêt qui pleure','La Maison rouge'], ans:1, l:'"Le Monstre sans nom" est un livre pour enfants tchèque qui sert de métaphore à l\'identité absorbée par Johan et à la fluidité du mal.', le:'"The Nameless Monster" is a Czech children\'s book that serves as a metaphor for Johan\'s absorbed identity and the fluid nature of evil.' },
    ],
  },
  9253: { // Steins;Gate
    title: 'Steins;Gate', image: 'https://cdn.myanimelist.net/images/anime/5/73199.jpg',
    questions: [
      { q:'Quel pseudo Okabe se donne-t-il ?', qe:'What alias does Okabe give himself?', c:['Hououin Kyouma','Mad Scientist','Daru Hashida','John Titor'], ans:0, l:'Okabe Rintarō se proclame Hououin Kyouma, "scientifique fou" qui combat une organisation imaginaire à laquelle il finit par croire.', le:'Okabe Rintarō calls himself Hououin Kyouma, the "mad scientist" fighting an imaginary organization he eventually starts believing in.' },
      { q:'Quel objet sert de machine à voyager dans le temps ?', qe:'Which device works as a time machine?', c:['Une montre','Un micro-ondes','Un téléphone à clapet','Un IBN 5100'], ans:1, l:'Le PhoneWave, micro-ondes connecté à un téléphone, envoie des "D-Mails" (textos courts) dans le passé.', le:'The PhoneWave — a microwave hooked to a phone — sends "D-Mails" (short text messages) into the past.' },
      { q:'Quel est le vrai nom de Christina ?', qe:'What is Christina\'s real name?', c:['Mayuri Shiina','Suzuha Amane','Kurisu Makise','Faris NyanNyan'], ans:2, l:'Kurisu Makise, brillante chercheuse en neurosciences à seulement 18 ans, déteste être appelée "Christina" par Okabe.', le:'Kurisu Makise, a brilliant neuroscience researcher at just 18, hates being called "Christina" by Okabe.' },
      { q:'Quelle organisation traque les voyageurs temporels ?', qe:'Which organization hunts the time travelers?', c:['CERN','SERN','NASA','MAGES'], ans:1, l:'SERN (déformation de "CERN") cherche à monopoliser la technologie du voyage dans le temps pour instaurer une dystopie.', le:'SERN (a play on "CERN") seeks to monopolize time travel technology to enforce a dystopian future.' },
      { q:'Quelle est la phrase fétiche de Mayuri ?', qe:'What is Mayuri\'s catchphrase?', c:['El Psy Congroo','Tutturu~','Stand by, ready','Hyaa~ha'], ans:1, l:'"Tutturu~" est le salut musical de Mayuri Shiina, l\'amie d\'enfance d\'Okabe.', le:'"Tutturu~" is the singsong greeting of Mayuri Shiina, Okabe\'s childhood friend.' },
      { q:'Comment se nomme la ligne temporelle finale ?', qe:'What is the name of the final timeline?', c:['Alpha','Beta','Steins Gate','Omega'], ans:2, l:'La ligne Steins Gate (>1% de divergence) permet de sauver à la fois Mayuri et Kurisu, échappant aux dystopies SERN et 3e Guerre Mondiale.', le:'The Steins Gate line (>1% divergence) lets Okabe save both Mayuri and Kurisu, escaping the SERN dystopia and WW3 timelines.' },
      { q:'Comment s\'appelle le chercheur "John Titor" en réalité ?', qe:'Who is "John Titor" in reality?', c:['Daru','Suzuha Amane','Moeka','Faris'], ans:1, l:'Suzuha Amane vient du futur (2036) sous l\'identité de John Titor pour empêcher la dystopie de SERN.', le:'Suzuha Amane comes from the future (2036) under the John Titor identity to prevent SERN\'s dystopia.' },
      { q:'Quel ordinateur antique est crucial à l\'intrigue ?', qe:'Which vintage computer is crucial to the plot?', c:['Apple Lisa','IBN 5100','Commodore 64','PDP-11'], ans:1, l:'L\'IBN 5100 (parodie de l\'IBM 5100) est requis pour décrypter les serveurs de SERN et changer la ligne temporelle.', le:'The IBN 5100 (a parody of the IBM 5100) is needed to decrypt SERN\'s servers and shift the timeline.' },
    ],
  },
  11061: { // HxH 2011
    title: 'Hunter x Hunter', image: 'https://cdn.myanimelist.net/images/anime/11/33657.jpg',
    questions: [
      { q:'Quel type de Nen utilise Gon ?', qe:'What Nen category does Gon use?', c:['Manipulation','Renforcement','Spécialisation','Émission'], ans:1, l:'Gon est un Renforceur (Enhancer). Sa nature directe et obstinée correspond parfaitement à cette catégorie.', le:'Gon is an Enhancer. His straightforward and stubborn personality fits the category perfectly.' },
      { q:'Quel est le nom de famille de Killua ?', qe:'What is Killua\'s family name?', c:['Phantom','Zoldyck','Freecss','Morow'], ans:1, l:'La famille Zoldyck est une lignée d\'assassins légendaires vivant sur la Montagne Kukuroo.', le:'The Zoldyck family is a legendary lineage of assassins living atop Kukuroo Mountain.' },
      { q:'Quel type de Nen utilise Hisoka ?', qe:'Which Nen category does Hisoka use?', c:['Renforcement','Manipulation','Transformation','Émission'], ans:2, l:'Hisoka est un Transformer (Transmuter). Son Bungee Gum a "les propriétés du chewing-gum et du caoutchouc".', le:'Hisoka is a Transmuter. His Bungee Gum has "the properties of both rubber and gum".' },
      { q:'Qui est le père de Gon ?', qe:'Who is Gon\'s father?', c:['Ging Freecss','Kite','Wing','Netero'], ans:0, l:'Ging est l\'un des Hunters les plus accomplis et un Triple Star. Sa quête finale donne son sens au voyage de Gon.', le:'Ging is one of the most accomplished Hunters and a Triple Star. His ultimate quest gives meaning to Gon\'s journey.' },
      { q:'Comment s\'appelle le roi des Chimera Ants ?', qe:'What is the name of the Chimera Ant King?', c:['Pitou','Pouf','Meruem','Youpi'], ans:2, l:'Meruem est le roi né dans la chair, surpuissant dès la naissance, et progressivement humanisé par sa relation avec Komugi.', le:'Meruem is the King born from flesh, overwhelmingly powerful from birth, and gradually humanized by his bond with Komugi.' },
      { q:'Contre qui Kurapika cherche-t-il vengeance ?', qe:'Whom does Kurapika seek revenge against?', c:['Les Hunters','La Brigade Fantôme','Les Zoldyck','Les Chimera Ants'], ans:1, l:'La Brigade Fantôme (Genei Ryodan) a massacré son clan Kurta et volé leurs yeux écarlates uniques.', le:'The Phantom Troupe (Genei Ryodan) massacred his Kurta clan and stole their unique scarlet eyes.' },
      { q:'Quel est le pouvoir de Kurapika contre la Brigade ?', qe:'What is Kurapika\'s power against the Troupe?', c:['Renforcement','Spécialisation (5 doigts)','Émission pure','Manipulation des ombres'], ans:1, l:'Ses Cinq Chaînes Judiciaires fonctionnent grâce à un serment qui le tue s\'il les utilise sur quelqu\'un d\'autre que la Brigade.', le:'His Five Judgment Chains rely on a vow that kills him if used against anyone but the Troupe.' },
      { q:'Comment s\'appelle la sœur/frère cadet de Killua ?', qe:'Who is Killua\'s younger sibling?', c:['Illumi','Milluki','Alluka','Kalluto'], ans:2, l:'Alluka possède Nanika, une entité qui exauce les vœux à condition d\'effectuer trois requêtes croissantes au préalable.', le:'Alluka houses Nanika, an entity that grants wishes if three escalating requests are fulfilled first.' },
    ],
  },
  16498: { // AoT
    title: 'Attack on Titan', image: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg',
    questions: [
      { q:'Quel mur est détruit en premier dans la série ?', qe:'Which wall is breached first in the series?', c:['Maria','Rose','Sina','Trost'], ans:0, l:'Le Titan Colossal et le Titan Cuirassé brisent Wall Maria, forçant l\'humanité à se réfugier derrière Wall Rose.', le:'The Colossal and Armored Titans breach Wall Maria, forcing humanity to retreat behind Wall Rose.' },
      { q:'Qui se révèle être le Titan Cuirassé ?', qe:'Who is revealed to be the Armored Titan?', c:['Bertholdt','Reiner','Annie','Zeke'], ans:1, l:'Reiner Braun, originaire de Marley, est un Titan Guerrier ayant infiltré le bataillon d\'Eldia comme cadet.', le:'Reiner Braun, from Marley, is a Warrior Titan who infiltrated the Eldian regiment as a cadet.' },
      { q:'De quel clan descend Mikasa ?', qe:'From which clan does Mikasa descend?', c:['Reiss','Tybur','Ackerman','Yeager'], ans:2, l:'Le clan Ackerman possède une force surhumaine et une résistance aux pouvoirs du Titan Originel.', le:'The Ackerman clan has superhuman strength and resistance to the Founding Titan\'s influence.' },
      { q:'Comment s\'appelle le père d\'Eren ?', qe:'What is the name of Eren\'s father?', c:['Grisha Yeager','Rod Reiss','Willy Tybur','Kenny Ackerman'], ans:0, l:'Grisha Yeager, Eldien exilé à Marley, devient médecin à Shiganshina et hérite du Titan Originel avant de le transmettre à Eren.', le:'Grisha Yeager, an Eldian exiled to Marley, becomes a doctor in Shiganshina and inherits the Founding Titan before passing it to Eren.' },
      { q:'Qui est le caporal-chef du Bataillon d\'Exploration ?', qe:'Who is the Survey Corps Captain?', c:['Erwin Smith','Mike Zacharias','Levi Ackerman','Hange Zoë'], ans:2, l:'Levi est considéré comme le soldat le plus fort de l\'humanité, manie le double-épée et est un Ackerman.', le:'Levi is regarded as humanity\'s strongest soldier, wields dual blades, and is an Ackerman.' },
      { q:'Combien y a-t-il de Titans Primordiaux/Capacités au total ?', qe:'How many primary Titan powers exist in total?', c:['7','9','11','13'], ans:1, l:'Il existe 9 Titans, créés par la déesse Ymir Fritz : Originel, Bestial, Mâchoires, Cuirassé, Colossal, Femelle, Charrette, Marteau, Attaquant.', le:'There are 9 Titans, created by the goddess Ymir Fritz: Founding, Beast, Jaw, Armored, Colossal, Female, Cart, Warhammer, Attack.' },
      { q:'Quel personnage est le Titan Femelle ?', qe:'Which character is the Female Titan?', c:['Ymir','Annie Leonhart','Pieck','Historia'], ans:1, l:'Annie Leonhart, originaire de Marley comme Reiner et Bertholdt, infiltre le bataillon avant d\'être encapsulée dans la cristallisation.', le:'Annie Leonhart, from Marley like Reiner and Bertholdt, infiltrates the regiment before encasing herself in crystal.' },
      { q:'Quel est le vrai nom d\'Historia ?', qe:'What is Historia\'s real name?', c:['Christa Lenz','Ymir Fritz','Frieda Reiss','Krista Reiss'], ans:0, l:'"Christa Lenz" est l\'identité fausse qu\'Historia Reiss utilise pour cacher sa lignée royale.', le:'"Christa Lenz" is the false identity Historia Reiss uses to hide her royal bloodline.' },
    ],
  },
  5114: { // FMA Brotherhood
    title: 'Fullmetal Alchemist: Brotherhood', image: 'https://cdn.myanimelist.net/images/anime/1223/96541.jpg',
    questions: [
      { q:'Que perd Edward lors de la transmutation humaine ?', qe:'What does Edward lose during the human transmutation?', c:['Bras gauche et jambe droite','Bras droit et jambe gauche','Les deux bras','Les deux jambes'], ans:1, l:'Edward perd son bras droit et sa jambe gauche, remplacés par des automails. Alphonse perd tout son corps, son âme étant scellée dans une armure.', le:'Edward loses his right arm and left leg, replaced by automail. Alphonse loses his entire body, his soul sealed in a suit of armor.' },
      { q:'Pourquoi les frères Elric ont-ils tenté la transmutation humaine ?', qe:'Why did the Elric brothers attempt human transmutation?', c:['Ressusciter leur père','Ressusciter leur mère','Atteindre la pierre philosophale','Tuer un homonculus'], ans:1, l:'Les frères Elric voulaient ramener leur mère Trisha à la vie, mais ont créé un être déformé qui n\'était pas elle.', le:'The Elric brothers wanted to bring their mother Trisha back to life, but they created a deformed being that wasn\'t her.' },
      { q:'Quelle est la spécialité alchimique du Colonel Mustang ?', qe:'What is Colonel Mustang\'s alchemical specialty?', c:['Eau','Glace','Feu','Métal'], ans:2, l:'Roy Mustang, l\'Alchimiste de Flamme, utilise des gants spéciaux qui produisent des étincelles, et contrôle l\'oxygène pour générer du feu.', le:'Roy Mustang, the Flame Alchemist, uses special gloves that produce sparks and controls oxygen to ignite flames.' },
      { q:'Qui est l\'antagoniste principal de Brotherhood ?', qe:'Who is the main antagonist of Brotherhood?', c:['Dante','Father','King Bradley','Pride'], ans:1, l:'Father est le premier homonculus, créé à partir d\'un fragment de Vérité par Hohenheim. Il cherche à devenir un dieu en absorbant Dieu.', le:'Father is the first homunculus, created from a fragment of Truth by Hohenheim. He seeks to become a god by consuming God itself.' },
      { q:'Quel homonculus est l\'hôte du prince Ling Yao ?', qe:'Which homunculus possesses Prince Ling Yao\'s body?', c:['Lust','Envy','Greed','Wrath'], ans:2, l:'Greed (deuxième version) prend possession de Ling, qui parvient à coexister avec lui, créant une alliance unique avec Edward.', le:'Greed (the second version) possesses Ling, who manages to coexist with him, forming a unique alliance with Edward.' },
      { q:'Comment Mustang récupère-t-il la vue à la fin ?', qe:'How does Mustang regain his sight at the end?', c:['Une potion alchimique','Une pierre philosophale','Une greffe','Il ne la récupère pas'], ans:1, l:'Une pierre philosophale de Marcoh est utilisée pour restaurer la vue de Mustang, sacrifiée par Father lors du combat final.', le:'One of Marcoh\'s philosopher\'s stones is used to restore Mustang\'s eyesight, recovered after Father\'s final battle.' },
      { q:'Quel pays a créé une armée de pierres philosophales ?', qe:'Which country built an army of philosopher\'s stones?', c:['Xing','Ishval','Drachma','Amestris'], ans:3, l:'Tout le territoire d\'Amestris a été conçu comme un cercle de transmutation géant pour permettre à Father de devenir divin.', le:'The entire territory of Amestris was designed as a giant transmutation circle to allow Father to become divine.' },
      { q:'Quel est le sacrifice d\'Edward à la fin ?', qe:'What does Edward sacrifice at the end?', c:['Sa vie','Ses automails','Sa capacité à utiliser l\'alchimie','Sa mémoire'], ans:2, l:'Edward sacrifie sa Porte de la Vérité (donc l\'alchimie) pour récupérer le corps d\'Alphonse, choix profondément humaniste.', le:'Edward sacrifices his Gate of Truth (and thus alchemy) to retrieve Alphonse\'s body — a deeply humanist choice.' },
    ],
  },
  40748: { // Jujutsu Kaisen
    title: 'Jujutsu Kaisen', image: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg',
    questions: [
      { q:'Combien de doigts compte Sukuna ?', qe:'How many fingers does Sukuna have in total?', c:['10','15','20','25'], ans:2, l:'Le Roi des Fléaux a légué 20 doigts maudits, qu\'il faut tous absorber pour le ramener à pleine puissance.', le:'The King of Curses left behind 20 cursed fingers; all must be consumed to fully restore him.' },
      { q:'Quelle technique maudite Megumi maîtrise-t-il ?', qe:'Which cursed technique does Megumi wield?', c:['Tonnerre Noir','Dix Ombres','Boogie Woogie','Idle Death Gamble'], ans:1, l:'La Technique des Dix Ombres invoque dix bêtes-divines servantes ; lorsqu\'une est vaincue, elle ne peut plus être invoquée à nouveau.', le:'The Ten Shadows Technique summons ten divine-beast shikigami; once defeated, a shikigami can never be summoned again.' },
      { q:'Quelle est l\'expansion du domaine de Gojo ?', qe:'What is Gojo\'s domain expansion?', c:['Malevolent Shrine','Infinite Void','Chimera Shadow Garden','Time Cell Moon Palace'], ans:1, l:'Muryōkūsho (Vide Infini) inonde la cible d\'une infinité d\'informations, la paralysant à un niveau cognitif.', le:'Muryōkūsho (Infinite Void) floods the target with infinite information, paralyzing them at a cognitive level.' },
      { q:'De quel personnage Yuji est-il le réceptacle ?', qe:'Whose vessel is Yuji?', c:['Mahito','Sukuna','Kenjaku','Tengen'], ans:1, l:'Yuji a avalé un doigt de Sukuna pour sauver ses amis, devenant son réceptacle vivant et conservant sa volonté.', le:'Yuji swallowed a Sukuna finger to save his friends, becoming his living vessel while keeping his own will.' },
      { q:'Quel est l\'outil de combat de Nobara ?', qe:'What weapon does Nobara use?', c:['Sabre','Marteau et clous','Arc','Chaînes'], ans:1, l:'Nobara Kugisaki utilise un marteau et des clous, combinés à sa technique "poupée de paille" pour atteindre des cibles à distance.', le:'Nobara Kugisaki uses a hammer and nails combined with her "Straw Doll" technique to strike targets remotely.' },
      { q:'Comment s\'appelle la technique de Toji Fushiguro qui annule le Cursed Energy ?', qe:'What is the name of Toji Fushiguro\'s ability to nullify cursed energy?', c:['Heavenly Restriction','Curse Nullification','Black Flash','Reverse Cursed Technique'], ans:0, l:'La Restriction Céleste de Toji lui ôte la moindre énergie maudite mais décuple ses capacités physiques au-delà de l\'humain.', le:'Toji\'s Heavenly Restriction strips him of all cursed energy but pushes his physical abilities far beyond human limits.' },
      { q:'Quelle école Yuji intègre-t-il ?', qe:'Which school does Yuji join?', c:['Kyoto Jujutsu High','Tokyo Jujutsu High','Shibuya High','Tengen Academy'], ans:1, l:'Tokyo Jujutsu High forme les élèves exorcistes du Japon Est ; sa rivale est l\'école de Kyoto.', le:'Tokyo Jujutsu High trains the eastern Japanese sorcerer students; its rival is the Kyoto school.' },
      { q:'Quel personnage incarne le "Star Plasma Vessel" lié à Tengen ?', qe:'Who is the Star Plasma Vessel linked to Tengen?', c:['Yuki Tsukumo','Riko Amanai','Maki Zenin','Kasumi Miwa'], ans:1, l:'Riko Amanai est le réceptacle destiné à fusionner avec Tengen pour stabiliser sa structure cosmique.', le:'Riko Amanai is the vessel meant to merge with Tengen to stabilize his cosmic structure.' },
    ],
  },
};

// QUIZ_BANK_EXTRA: niveaux 2 (Moyen) et 3 (Difficile) par anime
const QUIZ_BANK_EXTRA = {
  21: { // One Piece
    2: [
      { q:'Comment s\'appelle le bateau actuel des Mugiwara ?', qe:'What is the Straw Hats\' current ship?', c:['Going Merry','Thousand Sunny','Striker','Red Force'], ans:1, l:'Construit par Franky à Water 7 avec le bois d\'Adam, le Thousand Sunny remplace le Going Merry.', le:'Built by Franky at Water 7 from Adam Wood, the Thousand Sunny replaces the Going Merry.' },
      { q:'Quel est le pouvoir d\'Eustass Kid ?', qe:'What is Eustass Kid\'s power?', c:['Magnétisme','Foudre','Glace','Vent'], ans:0, l:'Kid contrôle le magnétisme grâce au Jiki Jiki no Mi, attirant et fusionnant les métaux.', le:'Kid wields magnetism through the Jiki Jiki no Mi, attracting and fusing metal objects.' },
      { q:'Quelle est la prime de Luffy après l\'arc Wano ?', qe:'What is Luffy\'s bounty after the Wano arc?', c:['500M ฿','1.5 milliard ฿','3 milliards ฿','5 milliards ฿'], ans:2, l:'La prime atteint 3 milliards de berrys après que Luffy a vaincu Kaido aux côtés de Law et Kid.', le:'The bounty rises to 3 billion berries after Luffy defeats Kaido alongside Law and Kid.' },
      { q:'Vrai nom de famille de Sanji ?', qe:'Sanji\'s real family name?', c:['Vinsmoke','Black','Charlotte','D.'], ans:0, l:'Sanji est Vinsmoke Sanji, 3e fils de la famille royale du Germa 66 qu\'il a renié.', le:'Sanji is Vinsmoke Sanji, the third son of the Germa 66 royal family he disowned.' },
      { q:'Qui est Joy Boy ?', qe:'Who is Joy Boy?', c:['Le 1er Roi des Pirates','Une figure légendaire de l\'Ère du Vide','Le créateur des Devil Fruits','Un ancien amiral'], ans:1, l:'Joy Boy est une figure héroïque du Siècle Vide dont l\'esprit habite Luffy via le Nika.', le:'Joy Boy is a heroic figure of the Void Century whose spirit inhabits Luffy through Nika.' },
    ],
    3: [
      { q:'Sur quelle île se trouve le trésor One Piece ?', qe:'On which island lies One Piece?', c:['Raftel','Laugh Tale','Marie Geoise','Lodestar'], ans:1, l:'L\'île était surnommée "Raftel" mais sa vraie écriture est Laugh Tale, dévoilée par Roger lui-même.', le:'The island was called "Raftel" but the true spelling is Laugh Tale, revealed by Roger himself.' },
      { q:'Quel type de Devil Fruit possède Sengoku ?', qe:'What type of Devil Fruit does Sengoku have?', c:['Logia Magma','Zoan Mythique modèle Daibutsu','Paramecia Tremblement','Logia Foudre'], ans:1, l:'Sengoku se change en Bouddha doré géant capable de créer des ondes de choc dévastatrices.', le:'Sengoku transforms into a giant golden Buddha that can release devastating shockwaves.' },
      { q:'Épée maudite de Zoro qui aurait tué 1000 personnes ?', qe:'Zoro\'s cursed sword that supposedly killed 1000 people?', c:['Wado Ichimonji','Sandai Kitetsu','Shusui','Enma'], ans:1, l:'Sandai Kitetsu est la 3e génération de cette lignée; Zoro la dompte par défi du destin à Loguetown.', le:'Sandai Kitetsu is the 3rd of its bloodline; Zoro tames it by daring fate at Loguetown.' },
      { q:'Bartholomew Kuma était roi de quelle nation avant les Pacifistas ?', qe:'Which kingdom did Bartholomew Kuma rule before the Pacifistas?', c:['Sorbet','Drum','Alabasta','Goa'], ans:0, l:'Kuma régnait sur le royaume de Sorbet avant de rejoindre l\'Armée Révolutionnaire puis devenir Pacifista.', le:'Kuma ruled the Kingdom of Sorbet before joining the Revolutionary Army, then becoming a Pacifista.' },
      { q:'Quel âge a réellement Brook ?', qe:'What is Brook\'s actual age?', c:['38','55','73','90'], ans:3, l:'Mort à 38 ans, Brook a erré 50 ans dans le Triangle de Florian avant de croiser les Mugiwara à 88+ ans (90 actualisé).', le:'Brook died at 38, then drifted 50 years in the Florian Triangle before meeting the Straw Hats around 90.' },
    ],
  },
  20: { // Naruto
    2: [
      { q:'Combien de queues a Kurama ?', qe:'How many tails does Kurama have?', c:['7','8','9','10'], ans:2, l:'Kurama est le Bijū à 9 queues, le plus puissant des démons à queues, scellé en Naruto à sa naissance.', le:'Kurama is the Nine-Tailed Beast, the most powerful Bijū, sealed in Naruto at his birth.' },
      { q:'Combien de Bijū existe-t-il en tout ?', qe:'How many Tailed Beasts exist?', c:['7','8','9','10'], ans:2, l:'9 Bijū au total, de Shukaku (1 queue) à Kurama (9 queues), tous issus du chakra du Jūbi.', le:'There are 9 Tailed Beasts, from Shukaku (1) to Kurama (9), all born from the Ten-Tails\' chakra.' },
      { q:'Élément naturel principal de Kakashi ?', qe:'Kakashi\'s primary nature element?', c:['Eau','Feu','Foudre','Vent'], ans:2, l:'L\'affinité Foudre permet à Kakashi de maîtriser le Chidori et le Raikiri.', le:'His Lightning affinity lets Kakashi wield Chidori and Raikiri.' },
      { q:'Surnom de Minato ?', qe:'Minato\'s nickname?', c:['Hokage de Cristal','Éclair Jaune','Vent du Sud','Maître des Sceaux'], ans:1, l:'L\'"Éclair Jaune de Konoha" doit son nom à sa téléportation Hiraishin et à ses cheveux blonds.', le:'The "Yellow Flash of Konoha" earned the name from his Flying Thunder God technique and blond hair.' },
      { q:'Maître de Naruto pour le Mode Sage (Ermite) ?', qe:'Naruto\'s Sage Mode mentor?', c:['Kakashi','Jiraiya','Hashirama','Iruka'] , ans:1, l:'Naruto apprend le Mode Sage des crapauds au Mont Myōboku, terminant ce que Jiraiya avait commencé.', le:'Naruto learns Sage Mode from the toads atop Mount Myōboku, completing what Jiraiya started.' },
    ],
    3: [
      { q:'Vraie identité de "Tobi" au début de Shippūden ?', qe:'Real identity of "Tobi" early in Shippūden?', c:['Obito Uchiha','Izuna Uchiha','Shisui Uchiha','Indra Ōtsutsuki'], ans:0, l:'Obito, ami d\'enfance de Kakashi présumé mort à Kannabi, opère sous le masque pour Madara puis le double.', le:'Obito, Kakashi\'s childhood friend presumed dead at Kannabi, operates under the mask for Madara before double-crossing him.' },
      { q:'Mère biologique de Sasuke ?', qe:'Sasuke\'s biological mother?', c:['Mikoto Uchiha','Kushina Uzumaki','Mebuki','Tsumi'], ans:0, l:'Mikoto Uchiha, meilleure amie de Kushina, est massacrée par son fils aîné Itachi avec le reste du clan.', le:'Mikoto Uchiha, Kushina\'s best friend, was killed by her eldest son Itachi alongside the rest of the clan.' },
      { q:'Kekkei genkai signature d\'Hashirama Senju ?', qe:'Hashirama Senju\'s signature kekkei genkai?', c:['Glace','Mokuton (Bois)','Lave','Tempête'], ans:1, l:'Le Mokuton, fusion Terre+Eau, est unique à Hashirama; tous les autres utilisateurs ont reçu ses cellules.', le:'Mokuton, a fusion of Earth+Water, is unique to Hashirama; every other user received his cells.' },
      { q:'Capitaine de l\'unité Anbu Racine où Itachi servait ?', qe:'Captain of the Root Anbu where Itachi served?', c:['Yamato','Kakashi','Danzō','Tenzō'], ans:2, l:'Danzō dirige la Racine, Anbu noire qui pousse Itachi à massacrer le clan Uchiha pour éviter un coup d\'État.', le:'Danzō led Root, a black Anbu unit that pushed Itachi into massacring the Uchiha clan to prevent a coup.' },
      { q:'Trois techniques iconiques du Mangekyō d\'Itachi ?', qe:'Three iconic techniques of Itachi\'s Mangekyō?', c:['Tsukuyomi, Amaterasu, Susanoo','Kotoamatsukami','Izanagi','Kamui'], ans:0, l:'Itachi maîtrise les trois doujutsu mythiques : Tsukuyomi (genjutsu), Amaterasu (feu noir), Susanoo (avatar).', le:'Itachi wields all three mythic doujutsu: Tsukuyomi (genjutsu), Amaterasu (black flame), Susanoo (avatar).' },
    ],
  },
  269: { // Bleach
    2: [
      { q:'Capitaine de la 11e division ?', qe:'Captain of the 11th Division?', c:['Byakuya Kuchiki','Kenpachi Zaraki','Sajin Komamura','Mayuri Kurotsuchi'], ans:1, l:'Kenpachi Zaraki, brutal et obsédé par le combat, dirige la 11e division — la plus belliqueuse du Gotei 13.', le:'Kenpachi Zaraki, brutal and battle-obsessed, leads the 11th — the most warlike Gotei 13 division.' },
      { q:'Mère biologique d\'Ichigo ?', qe:'Ichigo\'s biological mother?', c:['Yoruichi','Masaki Kurosaki','Retsu Unohana','Hisana'], ans:1, l:'Masaki, Quincy de naissance, meurt en protégeant Ichigo enfant d\'un Hollow nommé Grand Fisher.', le:'Masaki, a Quincy by birth, died protecting young Ichigo from a Hollow named Grand Fisher.' },
      { q:'Combien de divisions compte initialement le Gotei 13 ?', qe:'How many divisions does the Gotei 13 originally have?', c:['10','12','13','15'], ans:2, l:'13 divisions fondées par Yamamoto à l\'origine, chacune dirigée par un capitaine et son lieutenant.', le:'13 divisions founded by Yamamoto, each led by a captain and lieutenant.' },
      { q:'Race d\'Uryū Ishida ?', qe:'Uryū Ishida\'s race?', c:['Shinigami','Quincy','Hollow','Fullbringer'], ans:1, l:'Les Quincy sont des humains aux pouvoirs spirituels capables de créer des armes d\'esprit (Reishi).', le:'Quincies are spiritually empowered humans who craft weapons from Reishi.' },
      { q:'Vitesse spéciale des Shinigami à grande échelle ?', qe:'Shinigami fast-movement technique?', c:['Sonido','Hirenkyaku','Shunpo','Bringer Light'], ans:2, l:'Le Shunpo (pas-éclair) est la téléportation par bonds des Shinigami — Yoruichi en est la maîtresse incontestée.', le:'Shunpo (Flash Step) is the Shinigami\'s burst-teleport technique — Yoruichi is its undisputed master.' },
    ],
    3: [
      { q:'Nom du Zanpakutō d\'Aizen ?', qe:'Aizen\'s Zanpakutō name?', c:['Kyōka Suigetsu','Suzumebachi','Tobiume','Shinsō'], ans:0, l:'Kyōka Suigetsu impose une "hypnose totale" à quiconque voit son Shikai — l\'arme parfaite de manipulation.', le:'Kyōka Suigetsu imposes "complete hypnosis" on anyone who sees its Shikai — the perfect manipulation weapon.' },
      { q:'3e Espada (numéro 3) ?', qe:'3rd Espada (rank 3)?', c:['Ulquiorra','Tier Halibel','Nelliel','Starrk'], ans:1, l:'Tier Halibel, Espada à thème requin, incarne le Sacrifice ; Aizen la trahit pendant la Fake Karakura Town.', le:'Tier Halibel, the shark-themed Espada, embodies Sacrifice; Aizen betrays her during the Fake Karakura Town arc.' },
      { q:'Forme finale d\'Ichigo dans la guerre Quincy ?', qe:'Ichigo\'s final form in the Quincy War?', c:['Mugetsu','True Bankai (double Tensa Zangetsu)','Vasto Lorde','Hollow Form'], ans:1, l:'Lors de TYBW, Ichigo manie la version vraie de Tensa Zangetsu : un fragment d\'épée Shinigami fusionné avec une lame Quincy.', le:'In TYBW, Ichigo wields the true Tensa Zangetsu: a Shinigami sword fragment fused with a Quincy blade.' },
      { q:'Roi des Quincy / antagoniste de TYBW ?', qe:'King of the Quincy / TYBW villain?', c:['Yhwach','Aizen','Juhabach','Bach'], ans:0, l:'Yhwach, fils d\'Âme du Roi-Soul, vise à fusionner les trois mondes en supprimant la mort.', le:'Yhwach, son of the Soul King, aims to merge the three worlds by erasing death itself.' },
      { q:'Bankai de Byakuya Kuchiki ?', qe:'Byakuya Kuchiki\'s Bankai?', c:['Senbonzakura Kageyoshi','Hihiō Zabimaru','Kōkō no Mitsurugi','Tensa Zangetsu'], ans:0, l:'Senbonzakura Kageyoshi disperse mille épées en pétales tranchants, contrôlés par Byakuya à distance.', le:'Senbonzakura Kageyoshi scatters a thousand blades into razor petals controlled remotely by Byakuya.' },
    ],
  },
  813: { // Dragon Ball Z
    2: [
      { q:'Forme finale de Buu ?', qe:'Buu\'s final form?', c:['Super Buu','Kid Buu','Fat Buu','Evil Buu'], ans:1, l:'Kid Buu est la forme originelle pure et imprévisible — Goku le détruit avec une Genkidama universelle.', le:'Kid Buu is the original pure, unpredictable form — Goku destroys him with a universal Spirit Bomb.' },
      { q:'Couleur des cheveux en Super Saiyan 2 ?', qe:'Super Saiyan 2 hair color?', c:['Bleu','Jaune avec éclairs','Rouge','Noir argenté'], ans:1, l:'SSJ2 conserve les cheveux blonds dressés mais ajoute des éclairs dans l\'aura, signature de Gohan vs Cell.', le:'SSJ2 keeps blond spikes but adds crackling lightning in the aura, debuted by Gohan vs Cell.' },
      { q:'Plus jeune fils de Goku ?', qe:'Goku\'s youngest son?', c:['Gohan','Goten','Trunks','Bra'], ans:1, l:'Goten naît durant l\'absence de Goku au paradis ; il forme la fusion Gotenks avec Trunks.', le:'Goten is born during Goku\'s afterlife stay; he later forms the Gotenks fusion with Trunks.' },
      { q:'Ressource énergétique des androïdes 17 et 18 ?', qe:'Androids 17 and 18 energy source?', c:['Cellules Saiyan','Énergie illimitée','Solaire','Pile au plutonium'], ans:1, l:'Le Dr Gero a converti deux humains en cyborgs alimentés par un réacteur d\'énergie infinie.', le:'Dr. Gero converted two humans into cyborgs powered by an infinite-energy reactor.' },
      { q:'Quel ennemi est créé par les ondes du Z-Sword ?', qe:'Which enemy emerges from breaking the Z-Sword?', c:['Cell','Old Kai','Buu','Beerus'], ans:1, l:'Briser la Z-Sword libère le Vieux Kaiō Shin enfermé qui éveille le potentiel ultime de Gohan.', le:'Breaking the Z-Sword releases the imprisoned Old Kai who unlocks Gohan\'s ultimate potential.' },
    ],
    3: [
      { q:'Race ayant peuplé Vegeta avant les Saiyans ?', qe:'Race that lived on Planet Vegeta before the Saiyans?', c:['Tsufurians','Yardrats','Konats','Démons Maïjins'], ans:0, l:'Les Tsufurians (peuple pacifique et techno) ont été massacrés par les Saiyans qui ont rebaptisé la planète.', le:'The Tsufurians (peaceful, technological people) were wiped out by the Saiyans who renamed the planet.' },
      { q:'Forme "Mystic Gohan" est obtenue grâce à ?', qe:'How does Gohan obtain "Mystic" form?', c:['Une transformation SSJ3','Le rituel d\'Old Kai','La salle de l\'esprit du temps','Une potion de Bulma'], ans:1, l:'Old Kai sacrifie sa vie via un rituel pour libérer le potentiel caché de Gohan, dépassant le SSJ.', le:'Old Kai performs a life-bonding ritual to unlock Gohan\'s hidden potential, surpassing SSJ.' },
      { q:'Grand-père adoptif de Goku ?', qe:'Goku\'s adoptive grandfather?', c:['Maître Roshi','Son Gohan','Karin','Ox-Satan'], ans:1, l:'Son Gohan recueille bébé Goku tombé du ciel ; Goku nommera son fils en l\'honneur de son grand-père.', le:'Son Gohan rescued baby Goku found in a pod; Goku later names his own son after his grandfather.' },
      { q:'Combien de souhaits accordent les Dragon Balls de Namek ?', qe:'How many wishes do Namek Dragon Balls grant?', c:['1','2','3','4'], ans:2, l:'Porunga (Namek) accorde 3 souhaits au lieu d\'un seul comme Shenron (Terre).', le:'Porunga (Namek) grants 3 wishes per summon, unlike Shenron (Earth) who grants only one.' },
      { q:'Quelle planète enseigne la téléportation à Goku ?', qe:'Which planet teaches Goku Instant Transmission?', c:['Vegeta','Yardrat','Namek','Kaiō du Nord'], ans:1, l:'Après sa lutte contre Freezer, Goku atterrit sur Yardrat où il apprend le Shunkan Idō (téléportation).', le:'Following his battle with Frieza, Goku lands on Yardrat where he learns Shunkan Idō (Instant Transmission).' },
    ],
  },
  19: { // Monster
    2: [
      { q:'Profession de Reichwein, l\'allié de Tenma ?', qe:'Profession of Reichwein, Tenma\'s ally?', c:['Avocat','Psychiatre','Journaliste','Ancien policier'], ans:1, l:'Le Dr Reichwein est psychiatre et aide Tenma à comprendre les traumatismes de Johan.', le:'Dr. Reichwein is a psychiatrist who helps Tenma understand Johan\'s traumas.' },
      { q:'Code du livre pour enfants au cœur du mystère ?', qe:'Title of the children\'s book at the mystery\'s core?', c:['"Le Chat sans nom"','"Le Monstre sans nom"','"La Maison rouge"','"Les Yeux de Bonaparta"'], ans:1, l:'"Le Monstre sans nom" est l\'histoire allégorique qui a façonné l\'identité de Johan dans son enfance.', le:'"The Nameless Monster" is the allegorical story that shaped Johan\'s identity in childhood.' },
      { q:'Où Tenma exerce-t-il en début de série ?', qe:'Where does Tenma practice at the start?', c:['Berlin','Düsseldorf','Munich','Vienne'], ans:1, l:'Tenma travaille à l\'Hôpital Eisler Memorial à Düsseldorf comme jeune neurochirurgien étoile.', le:'Tenma works at Eisler Memorial Hospital in Düsseldorf as a rising-star neurosurgeon.' },
      { q:'Identité du tueur en série "Le Roses Rouges" ?', qe:'Identity of "the Red Roses Mansion" killer?', c:['Petr Čapek','Roberto','Johan Liebert','Karl Bonaparta'], ans:2, l:'Johan oriente puis force d\'autres à tuer pour effacer ses souvenirs ; les Roses Rouges sont son traumatisme fondateur.', le:'Johan manipulates others into killing to erase his memories; the Red Roses Mansion is his founding trauma.' },
      { q:'Mémoire spéciale de l\'inspecteur Lunge ?', qe:'Inspector Lunge\'s special skill?', c:['Photographique','Synesthésique','Auditive parfaite','Hyper-vitesse'], ans:0, l:'Lunge enregistre tout en mémoire absolue, mimant la frappe d\'un clavier sur ses doigts pour stocker.', le:'Lunge records everything via perfect memory, miming keyboard strokes on his fingers to file information.' },
    ],
    3: [
      { q:'Pseudonymes de Franz Bonaparta ?', qe:'Aliases used by Franz Bonaparta?', c:['Klaus Poppe / Emil Sebe','Hermann Führ','Wolfgang Grimmer','Petr Čapek'], ans:0, l:'L\'ex-psychiatre de la Stasi a publié des livres pour enfants sous "Klaus Poppe" et "Emil Sebe".', le:'The former Stasi psychiatrist published children\'s books as "Klaus Poppe" and "Emil Sebe".' },
      { q:'Profession de Wolfgang Grimmer ?', qe:'Wolfgang Grimmer\'s profession?', c:['Pédiatre','Journaliste pigiste','Procureur','Ingénieur'], ans:1, l:'Grimmer est journaliste freelance enquêtant sur Kinderheim 511 — survivant lui-même de l\'orphelinat.', le:'Grimmer is a freelance journalist investigating Kinderheim 511 — himself a survivor of the orphanage.' },
      { q:'Pays d\'origine du livre "Le Monstre sans nom" ?', qe:'Origin country of the "Nameless Monster" book?', c:['Allemagne','Tchécoslovaquie','Pologne','Roumanie'], ans:1, l:'Bonaparta a publié le conte en Tchécoslovaquie communiste pour formater psychologiquement les jumeaux.', le:'Bonaparta published the tale in communist Czechoslovakia to psychologically condition the twins.' },
      { q:'Lieu où Johan a passé la nuit traumatique des Roses Rouges ?', qe:'Where did Johan endure the Red Roses traumatic night?', c:['Prague','Berlin-Est','Roses Rouges Mansion','Ruhenheim'], ans:2, l:'Le manoir des Roses Rouges en Tchécoslovaquie hébergeait l\'expérience secrète d\'élite de Bonaparta.', le:'The Red Roses Mansion in Czechoslovakia hosted Bonaparta\'s secret elite experiment.' },
      { q:'Quel personnage tente de devenir "le nouveau Johan" ?', qe:'Which character tries to become "the new Johan"?', c:['Roberto','Christof Sievernich','Petr Čapek','Lipsky'], ans:1, l:'Christof, ex-orphelin manipulé, copie le mode opératoire de Johan dans une candidature politique sinistre.', le:'Christof, a manipulated orphan, copies Johan\'s methods within a sinister political bid.' },
    ],
  },
  9253: { // Steins;Gate
    2: [
      { q:'Limite de caractères d\'un D-Mail ?', qe:'D-Mail character limit?', c:['16','36','100','512'], ans:1, l:'Un D-Mail est limité à 36 caractères pour économiser l\'énergie nécessaire au saut temporel.', le:'A D-Mail is capped at 36 characters to limit the energy needed for time-jumping.' },
      { q:'Vrai nom du propriétaire qui se révèle être un agent de SERN ?', qe:'Real name of the landlord revealed as a SERN agent?', c:['Yūgo Tennouji','Tetsu Hashida','Mr. Braun','Les deux : Tennouji et Mr. Braun'], ans:3, l:'Yūgo Tennouji, alias Mr. Braun, est l\'agent de SERN qui surveille discrètement Okabe.', le:'Yūgo Tennouji, alias Mr. Braun, is the SERN operative quietly monitoring Okabe.' },
      { q:'Café/lieu de travail de Mayuri ?', qe:'Mayuri\'s workplace café?', c:['MayQueen+Nyan2','A-1 Beta','Tsutaya','Akiba Co\'s'], ans:0, l:'Le café cosplay MayQueen+Nyan2 emploie Mayuri (et Faris NyanNyan, sa propriétaire-cliente).', le:'The cosplay café MayQueen+Nyan2 employs Mayuri (and Faris NyanNyan, its owner-client).' },
      { q:'Pseudo en ligne de Daru ?', qe:'Daru\'s online handle?', c:['Itaru Hashida','BARREL TITOR','HACKING WIZARD','@channel_admin'], ans:0, l:'Itaru "Daru" Hashida est l\'as du hack et un membre fondateur du Future Gadget Lab.', le:'Itaru "Daru" Hashida is the hacker ace and a founding member of the Future Gadget Lab.' },
      { q:'Compositrice du célèbre opening "Hacking to the Gate" ?', qe:'Composer of the iconic opening "Hacking to the Gate"?', c:['Yui','Kanako Itō','LiSA','Aimer'], ans:1, l:'Kanako Itō chante "Hacking to the Gate", titre signature de la série.', le:'Kanako Itō performs "Hacking to the Gate", the show\'s signature track.' },
    ],
    3: [
      { q:'Identifiant numérique de la Steins Gate Worldline ?', qe:'Numerical ID of the Steins Gate Worldline?', c:['1.048596','1.130426','0.571024','2.615074'], ans:1, l:'Le coefficient 1.130426 marque la Steins Gate, divergeant de plus de 1% des lignes Alpha et Beta.', le:'Coefficient 1.130426 marks Steins Gate, diverging by over 1% from both Alpha and Beta worldlines.' },
      { q:'De quelle année provient Suzuha ?', qe:'What year does Suzuha come from?', c:['2025','2030','2036','2050'], ans:2, l:'Suzuha vient de 2036, futur où SERN règne en dystopie après avoir maîtrisé le voyage temporel.', le:'Suzuha hails from 2036, a dystopian future where SERN rules after mastering time travel.' },
      { q:'Surnom donné par Okabe à la divergence où Mayuri meurt ?', qe:'Okabe\'s name for the divergence where Mayuri dies?', c:['Alpha','Beta','Gamma','Omega'], ans:0, l:'Les Alpha Worldlines mènent à la mort répétée de Mayuri ; les Beta mènent à la 3e Guerre Mondiale.', le:'Alpha worldlines lead to Mayuri\'s repeated death; Beta worldlines lead to WW3.' },
      { q:'Phrase fétiche d\'Okabe à la fin d\'un appel ?', qe:'Okabe\'s catchphrase ending a phone call?', c:['Tutturu~','El Psy Congroo','I am Mad Scientist','La science triomphera'], ans:1, l:'"El Psy Congroo" sert de signature paranoïaque de Hououin Kyouma — son sens reste volontairement obscur.', le:'"El Psy Congroo" is Hououin Kyouma\'s paranoid sign-off — its meaning is intentionally obscure.' },
      { q:'Première phrase clé qui prouve à Kurisu qu\'Okabe vient du futur ?', qe:'First key phrase that proves to Kurisu that Okabe comes from the future?', c:['"Tutturu"','"Kurisu, tu m\'as poignardé"','"Hououin Kyouma"','"Ils me cherchent"'], ans:1, l:'Okabe choque Kurisu en évoquant un futur où elle l\'a poignardé — événement encore impossible dans la timeline présente.', le:'Okabe shocks Kurisu by mentioning a future where she stabbed him — an event still impossible in the present timeline.' },
    ],
  },
  11061: { // HxH 2011
    2: [
      { q:'Catégorie de Nen de Killua ?', qe:'Killua\'s Nen category?', c:['Renforcement','Manipulation','Spécialisation','Transformation'], ans:3, l:'Killua est Transformer (Transmuter), ce qui colle à son aura de foudre Godspeed/Whirlwind.', le:'Killua is a Transmuter, fitting his lightning-based Godspeed/Whirlwind aura.' },
      { q:'Numéro de Hisoka dans la Brigade Fantôme ?', qe:'Hisoka\'s Phantom Troupe number?', c:['#3','#4','#5','#7'], ans:1, l:'Hisoka occupe la 4e place — il a obtenu le tatouage en battant son ancien titulaire.', le:'Hisoka holds the 4th seat — he earned the tattoo by killing the previous holder.' },
      { q:'Famille royale de Kakin sur le bateau Black Whale ?', qe:'Kakin royal family on the Black Whale?', c:['Hui Guo Rou','Beyond Netero','Pariston Hill','Cheadle Yorkshire'], ans:0, l:'Le roi Nasubi Hui Guo Rou de Kakin entreprend l\'expédition vers le Continent Noir avec ses 14 enfants.', le:'King Nasubi Hui Guo Rou of Kakin sets out for the Dark Continent with his 14 children aboard the Black Whale.' },
      { q:'Qui a tué Pokkle pendant l\'arc Chimera Ant ?', qe:'Who kills Pokkle during the Chimera Ant arc?', c:['Pitou','Pouf','Knuckle','Meleoron'], ans:0, l:'Neferpitou capture, lobotomise puis tue Pokkle pour étudier son Nen et nourrir Meruem.', le:'Neferpitou captures, lobotomizes, then kills Pokkle to study his Nen and feed Meruem.' },
      { q:'Adversaire final de Gon dans l\'arc Chimera Ant ?', qe:'Gon\'s final opponent in the Chimera Ant arc?', c:['Meruem','Pouf','Pitou','Youpi'], ans:2, l:'Gon affronte Pitou en l\'éveillant comme adulte définitif — au prix de toute son existence Nen.', le:'Gon fights Pitou by aging into his final adult form — sacrificing his entire Nen existence.' },
    ],
    3: [
      { q:'Vrai nom de la spécialité de Chrollo ?', qe:'Chrollo\'s ability name?', c:['Skill Hunter','Bookmark','Genjutsu','Ten Heroes'], ans:0, l:'Skill Hunter (Bandit\'s Secret) permet à Chrollo de voler les pouvoirs Nen — sous conditions strictes.', le:'Skill Hunter (Bandit\'s Secret) lets Chrollo steal Nen abilities — under strict conditions.' },
      { q:'Composant clé du serment de Kurapika ?', qe:'Key element of Kurapika\'s vow?', c:['Sa propre vie si utilisé hors Brigade','La vie de Leorio','Une perte de mémoire','Un sacrifice de Nen'], ans:0, l:'Kurapika a juré qu\'utiliser la chaîne Judgment hors de la Brigade Fantôme le tuerait instantanément.', le:'Kurapika swore that using the Judgment chain on anyone but the Phantom Troupe would kill him instantly.' },
      { q:'Capacité de Meleoron, l\'Ant chien-caméléon ?', qe:'Meleoron, the chameleon-Ant\'s ability?', c:['Invisibilité totale','Téléportation','Lecture mentale','Vol'], ans:0, l:'God\'s Accomplice rend Meleoron et ses alliés invisibles aux yeux et au Nen — limité par sa respiration.', le:'God\'s Accomplice turns Meleoron and his allies invisible to sight and Nen — limited by his breathing.' },
      { q:'Pseudonyme de Pariston Hill ?', qe:'Pariston Hill\'s reputation?', c:['Le Ange Sourire','Le Loup Solitaire','Le Renard','Le Sage'], ans:0, l:'Pariston, l\'"Ange Sourire", est l\'antagoniste politique de Netero — un manipulateur charmant.', le:'Pariston, the "Smiling Angel", is Netero\'s political antagonist — a charming manipulator.' },
      { q:'Hatsu de Hisoka qui imite la peau ?', qe:'Hisoka\'s skin-mimicking ability?', c:['Bungee Gum','Texture Surprise','Skill Hunter','Big Bang Impact'], ans:1, l:'Texture Surprise convertit son aura en feuilles imitant n\'importe quelle surface — pour piéger ses adversaires.', le:'Texture Surprise converts his aura into sheets mimicking any surface — used to trap opponents.' },
    ],
  },
  16498: { // AoT
    2: [
      { q:'Détenteur du Titan Bête ?', qe:'Beast Titan holder?', c:['Reiner Braun','Zeke Yeager','Bertholdt Hoover','Tom Ksaver'], ans:1, l:'Zeke Yeager, demi-frère d\'Eren et fils de Grisha, hérite du Bestial après Tom Ksaver.', le:'Zeke Yeager, Eren\'s half-brother and Grisha\'s son, inherits the Beast Titan after Tom Ksaver.' },
      { q:'Quel personnage hérite du Titan Mâchoires ?', qe:'Who inherits the Jaw Titan?', c:['Marcel Galliard','Porco Galliard','Falco Grice','Galliard family chain'], ans:3, l:'Marcel d\'abord (mangé par Ymir), puis Ymir, puis Porco, et enfin Falco — le Titan circule chez les Galliard.', le:'Marcel first (eaten by Ymir), then Ymir, then Porco, then Falco — the Titan stays in the Galliard line.' },
      { q:'Bras droit d\'Erwin parmi les nouveaux soldats ?', qe:'Erwin\'s right hand among the new soldiers?', c:['Eren','Levi','Hange','Mike'], ans:1, l:'Levi est le bras armé d\'Erwin, exécutant ses plans les plus risqués jusqu\'à la perte du commandant.', le:'Levi is Erwin\'s sword arm, executing his riskiest plans up until Erwin\'s death.' },
      { q:'Wall Maria est brisée à quel district ?', qe:'Wall Maria is breached at which district?', c:['Trost','Shiganshina','Karanes','Yarckel'], ans:1, l:'Le Titan Colossal apparaît à Shiganshina en l\'an 845, ouvrant le récit principal.', le:'The Colossal Titan appears at Shiganshina in year 845, igniting the main story.' },
      { q:'Quelle race vit dans Wall Maria à l\'origine ?', qe:'Which people originally lived in Wall Maria?', c:['Eldiens','Marleyens','Hizurus','Ackerman'], ans:0, l:'Le Roi Fritz a fui à Paradis avec une partie du peuple eldien, créant les murs avec le Titan Originel.', le:'King Fritz fled to Paradis with part of the Eldian people, raising the walls using the Founding Titan.' },
    ],
    3: [
      { q:'Vrai nom de famille originel d\'Eren ?', qe:'Eren\'s original family name?', c:['Yeager','Kruger','Fritz','Reiss'], ans:0, l:'Yeager (Jaeger en allemand) est le nom de Grisha exilé de Marley sous identité d\'éleveur.', le:'Yeager (Jaeger in German) is Grisha\'s name, exiled from Marley as a doctor in disguise.' },
      { q:'Qui possédait le Titan Originel avant Grisha ?', qe:'Who held the Founding Titan before Grisha?', c:['Frieda Reiss','Uri Reiss','Rod Reiss','Karl Fritz'], ans:0, l:'Frieda Reiss héritait du Titan Originel; Grisha l\'a tuée pour récupérer le pouvoir et le donner à Eren.', le:'Frieda Reiss carried the Founding Titan; Grisha killed her to claim it and pass it to Eren.' },
      { q:'Qui hérite du Titan Charrette ?', qe:'Who carries the Cart Titan?', c:['Pieck Finger','Annie','Gabi','Ymir Fritz'], ans:0, l:'Pieck Finger est connue pour son endurance et sa capacité à marcher des jours en forme Titan.', le:'Pieck Finger is known for her endurance and ability to walk for days in Titan form.' },
      { q:'Premier roi à avoir scellé le serment "renoncer à la guerre" ?', qe:'First king to swear the "renounce war" oath?', c:['Karl Fritz (145e)','Reiner Braun','Helos','Ymir Fritz'], ans:0, l:'Le 145e roi Karl Fritz a effacé l\'histoire et imposé le serment de pacifisme via le Titan Originel.', le:'The 145th king Karl Fritz erased history and locked a pacifist oath through the Founding Titan.' },
      { q:'Combien d\'années depuis le serment de pacifisme jusqu\'à Eren ?', qe:'Years since the pacifist oath until Eren?', c:['100','107','215','500'], ans:1, l:'107 ans séparent Karl Fritz et la chute du mur Maria — durée durant laquelle Paradis a vécu en isolement.', le:'107 years stand between Karl Fritz and Wall Maria\'s fall — Paradis spent that time in isolation.' },
    ],
  },
  5114: { // FMA Brotherhood
    2: [
      { q:'Vrai nom de "Father" ?', qe:'Father\'s real designation?', c:['L\'homonculus de la Vérité','Le Petit Hohenheim','Greed le Premier','Le Roi Cristallin'], ans:1, l:'Father est créé à partir d\'une fraction de Truth tirée du sang de Hohenheim — son surnom est "Le Petit Hohenheim".', le:'Father was created from a fraction of Truth drawn from Hohenheim\'s blood — nicknamed "Little Hohenheim".' },
      { q:'Quel homonculus correspond au péché capital de l\'Envie ?', qe:'Which homunculus matches the sin of Envy?', c:['Lust','Envy','Wrath','Sloth'], ans:1, l:'Envy, jaloux des humains, peut prendre n\'importe quelle apparence — sa vraie forme est un monstre rampant.', le:'Envy, jealous of humans, can shapeshift into anyone — his true form is a writhing monster.' },
      { q:'Pays voisin que la transmutation d\'âmes a peuplé d\'Ishvalans ?', qe:'Neighboring country that took in Ishvalan refugees?', c:['Drachma','Aerugo','Xing','Creta'], ans:2, l:'De nombreux Ishvalans fuient Amestris vers Xing, traversant le désert oriental après le génocide.', le:'Many Ishvalans flee Amestris to Xing, crossing the eastern desert after the genocide.' },
      { q:'Identité de "Hawkeye" parmi les militaires ?', qe:'"Hawkeye" identity in the military?', c:['Riza Hawkeye','Maes Hughes','Olivier Mira Armstrong','Riza Mustang'], ans:0, l:'Sous-lieutenant Riza Hawkeye, sniper exceptionnelle, est la garde rapprochée et la confidente de Mustang.', le:'2nd Lt. Riza Hawkeye, an exceptional sniper, is Mustang\'s close guard and confidante.' },
      { q:'Spécialité alchimique de Scar dans son bras tatoué ?', qe:'Scar\'s alchemical specialty via his tattooed arm?', c:['Décomposition uniquement','Reconstruction','Foudre','Création de pierres'], ans:0, l:'Le tatouage de Scar n\'effectue que la phase de "destruction" : il déclenche le bris atomique sans la reconstruction.', le:'Scar\'s tattoo only performs the "destruction" half of alchemy: atomic breakdown without reconstruction.' },
    ],
    3: [
      { q:'Vrai nom de Pride dans Brotherhood ?', qe:'Pride\'s real identity in Brotherhood?', c:['Selim Bradley','Roy Bradley','Heinkel','Zolf Kimblee'], ans:0, l:'Selim Bradley, le "fils" du président Bradley, est en réalité Pride — le plus ancien des homonculi.', le:'Selim Bradley, "son" of President Bradley, is actually Pride — the eldest of the homunculi.' },
      { q:'Quelle nation utilise les pierres philosophales pour la guerre ?', qe:'Which nation uses philosopher\'s stones in warfare?', c:['Aerugo','Drachma','Amestris','Xing'], ans:2, l:'Amestris est conçu en cercle de transmutation national pour ériger Father en dieu — chaque guerre alimente le rituel.', le:'Amestris is shaped as a national transmutation circle to elevate Father into a god — every war feeds the ritual.' },
      { q:'Comment Roy Mustang récupère-t-il la vue à la fin ?', qe:'How does Roy Mustang regain his sight?', c:['Une greffe de Marcoh','Une pierre philosophale','Un échange avec la Vérité','Une potion de Pinako'], ans:1, l:'Marcoh utilise sa propre pierre philosophale pour restaurer les yeux de Mustang après la défaite de Father.', le:'Marcoh uses his own philosopher\'s stone to restore Mustang\'s eyesight after Father\'s defeat.' },
      { q:'Sacrifice d\'Edward à la fin du combat final ?', qe:'Edward\'s sacrifice at the final battle?', c:['Sa vie','Son alchimie (sa Porte)','Son bras automail','Sa mémoire'], ans:1, l:'Edward troque sa Porte de la Vérité — donc tous ses pouvoirs alchimiques — pour récupérer Alphonse.', le:'Edward trades his Gate of Truth — meaning all his alchemy — to recover Alphonse.' },
      { q:'Hôte humain de Greed (deuxième version) ?', qe:'Greed\'s human vessel (second version)?', c:['Ling Yao','Lan Fan','Bradley','Edward'], ans:0, l:'Le prince xinois Ling Yao avale une pierre philosophale et fusionne avec Greed, formant une coexistence rare.', le:'Xingese prince Ling Yao swallows a philosopher\'s stone and merges with Greed, a rare coexistence.' },
    ],
  },
  40748: { // JJK
    2: [
      { q:'Combien de doigts a Sukuna ?', qe:'How many fingers does Sukuna have?', c:['10','15','20','25'], ans:2, l:'Le Roi des Fléaux a légué 20 doigts maudits — leur consommation totale ranime ses pouvoirs absolus.', le:'The King of Curses left 20 cursed fingers — consuming all of them fully restores his peak power.' },
      { q:'Domaine de Gojo ?', qe:'Gojo\'s domain expansion?', c:['Sanctuaire Malveillant','Vide Infini','Jardin de l\'Ombre','Palais de la Lune'], ans:1, l:'Muryōkūsho impose une infinité d\'informations à la cible, paralysant son cerveau pendant 0.2s perçues comme l\'éternité.', le:'Muryōkūsho floods the target with infinite information, paralyzing the brain for 0.2s that feel like eternity.' },
      { q:'Outil utilisé par Nobara avec sa technique poupée de paille ?', qe:'Tool used by Nobara with the Straw Doll technique?', c:['Aiguilles','Marteau et clous','Sabre','Arc'], ans:1, l:'Nobara cloue une poupée pour transférer les dégâts et énergie maudite à distance vers la cible.', le:'Nobara nails a straw doll to transfer cursed damage remotely to her target.' },
      { q:'École rivale du lycée Jujutsu de Tokyo ?', qe:'Rival school of Tokyo Jujutsu High?', c:['Kyoto Jujutsu High','Osaka Jujutsu','Sapporo Sect','Yokohama School'], ans:0, l:'Le lycée Jujutsu de Kyoto, plus traditionaliste, est l\'école rivale dans le tournoi annuel d\'échange.', le:'Kyoto Jujutsu High, more traditional, is the rival school during the annual Sister-School Goodwill Event.' },
      { q:'Capacité innée de Megumi Fushiguro ?', qe:'Megumi Fushiguro\'s innate technique?', c:['Six Yeux','Dix Ombres','Boogie Woogie','Flamme Noire'], ans:1, l:'La Technique des Dix Ombres invoque dix shikigami divins ; vaincu, un shikigami est perdu pour toujours.', le:'The Ten Shadows Technique summons ten divine shikigami; once defeated, a shikigami is gone forever.' },
    ],
    3: [
      { q:'Vrai nom de Geto contrôlé par Kenjaku ?', qe:'Real identity of post-canon Geto?', c:['Suguru Geto réincarné','Kenjaku dans le corps de Geto','Le frère de Geto','Yuki Tsukumo'], ans:1, l:'Kenjaku, sorcier millénaire qui transfère son cerveau, occupe le corps de Suguru Geto pour comploter à grande échelle.', le:'Kenjaku, a millennium-old sorcerer who transplants his brain, occupies Suguru Geto\'s body to scheme on a grand scale.' },
      { q:'Star Plasma Vessel destiné à Tengen ?', qe:'Tengen\'s designated Star Plasma Vessel?', c:['Yuki Tsukumo','Riko Amanai','Maki Zenin','Kasumi Miwa'], ans:1, l:'Riko Amanai devait fusionner avec Tengen pour stabiliser son évolution cosmique — mais elle est tuée avant.', le:'Riko Amanai was meant to merge with Tengen to stabilize his cosmic evolution — but she\'s killed beforehand.' },
      { q:'Hatsu de Toji Fushiguro ?', qe:'Toji Fushiguro\'s ability?', c:['Restriction Céleste','Six Yeux','Black Flash permanent','Dix Ombres'], ans:0, l:'La Restriction Céleste prive Toji de toute énergie maudite mais décuple sa physique au-delà du surhumain.', le:'Heavenly Restriction strips Toji of cursed energy but enhances his physical body beyond superhuman.' },
      { q:'Combien d\'élèves comptait l\'école de Tokyo en 1ère année ?', qe:'How many 1st-year students at Tokyo Jujutsu High?', c:['2','3','4','5'], ans:1, l:'Yuji, Megumi et Nobara forment la promotion de 1ère année, épaulée par Gojo comme professeur principal.', le:'Yuji, Megumi, and Nobara make up the 1st-year class, mentored by Gojo as homeroom teacher.' },
      { q:'Restriction principale du Domain Expansion ?', qe:'Domain Expansion\'s main restriction?', c:['Aucune','Doit être déclenchée à voix haute','La cible doit voir le sortilège','Doit "garantir" un sort réussi en l\'enfermant'], ans:3, l:'Une expansion crée un espace où le sort de l\'utilisateur est garanti — mais les domaines opposés s\'annulent.', le:'A Domain creates a space where the user\'s technique is guaranteed — but opposing Domains cancel each other.' },
    ],
  },
};

// ── ANIME STATUS (airing/complete/upcoming) ──
function getStatusInfo(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase();
  if (s.includes('not yet') || s === 'upcoming') {
    return { key: 'upcoming', labelFr: 'Prochainement', labelEn: 'Upcoming' };
  }
  if (s.includes('finished') || s === 'complete') {
    return { key: 'complete', labelFr: 'Terminé', labelEn: 'Finished' };
  }
  if (s.includes('airing') || s === 'airing') {
    return { key: 'airing', labelFr: 'En cours', labelEn: 'Airing' };
  }
  return null;
}

// ── ANIME RATING (G / PG / PG-13 / R / R+ / Rx) ──
function getRatingInfo(raw) {
  if (!raw) return null;
  const r = String(raw).toLowerCase().replace(/\s+/g, '');
  // Order matters: PG-13 before PG, R+ before R, Rx before R
  if (r.startsWith('pg-13') || r.startsWith('pg13')) return { tier: 'mid', labelFr: 'PG-13 — 13+', labelEn: 'PG-13 — Teens 13+' };
  if (r.startsWith('pg')) return { tier: 'low', labelFr: 'PG — Enfants', labelEn: 'PG — Children' };
  if (r.startsWith('r+') || r.includes('mildnudity')) return { tier: 'high', labelFr: 'R+ — Nudité légère', labelEn: 'R+ — Mild Nudity' };
  if (r.startsWith('rx') || r.includes('hentai')) return { tier: 'extreme', labelFr: 'Rx — Hentai', labelEn: 'Rx — Hentai' };
  if (r.startsWith('r')) return { tier: 'high', labelFr: 'R — 17+', labelEn: 'R — 17+' };
  if (r.startsWith('g')) return { tier: 'low', labelFr: 'G — Tout public', labelEn: 'G — All Ages' };
  return null;
}

// ══ STORAGE ══════════════════════════════════════
function getDB() {
  return JSON.parse(localStorage.getItem('anitrack_db') || '{"users":{},"sessions":{}}');
}
function saveDB(db) { localStorage.setItem('anitrack_db', JSON.stringify(db)); }

function getUserData(u) {
  const db = getDB();
  if (!db.users[u]) db.users[u] = { list: {}, theme: 'dark', top10: { series: [], movies: [] }, joinedAt: Date.now() };
  if (!db.users[u].top10) db.users[u].top10 = { series: [], movies: [] };
  if (!db.users[u].joinedAt) db.users[u].joinedAt = Date.now();
  return db.users[u];
}
function saveUserData(u, d) { const db = getDB(); db.users[u] = d; saveDB(db); }
function getList() { return getUserData(currentUser).list || {}; }
function saveList(list) {
  const db = getDB();
  if (!db.users[currentUser]) db.users[currentUser] = {};
  db.users[currentUser].list = list; saveDB(db);
}
function getTop10() {
  const t = getUserData(currentUser).top10 || {};
  if (!t.series) t.series = [];
  if (!t.movies) t.movies = [];
  if (!t.openings) t.openings = [];
  if (!t.endings) t.endings = [];
  return t;
}
function saveTop10(t) {
  const db = getDB();
  if (!db.users[currentUser]) db.users[currentUser] = {};
  db.users[currentUser].top10 = t; saveDB(db);
}

// ── SKIP TRACKING ─────────────────────────────────
const SKIP_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSkipped() {
  const data = getUserData(currentUser);
  const sk = data.skipped || {};
  const cutoff = Date.now() - SKIP_TTL_MS;
  let dirty = false;
  for (const id in sk) {
    if (sk[id] < cutoff) { delete sk[id]; dirty = true; }
  }
  if (dirty) { data.skipped = sk; saveUserData(currentUser, data); }
  return sk;
}

function addSkipped(malId) {
  const data = getUserData(currentUser);
  if (!data.skipped) data.skipped = {};
  data.skipped[malId] = Date.now();
  saveUserData(currentUser, data);
}

function isSkipped(malId) {
  const sk = getSkipped();
  return sk[malId] !== undefined;
}

// ══ AUTH ═════════════════════════════════════════
function hash(p) {
  let h = 0;
  for (let i = 0; i < p.length; i++) { h = ((h << 5) - h) + p.charCodeAt(i); h = h & h; }
  return h.toString(36);
}

function handleLogin() {
  const u = $('login-username').value.trim(), p = $('login-password').value;
  const e = $('login-error');
  if (!u || !p) { showErr(e, t('err_fill')); return; }
  const db = getDB();
  if (!db.users[u] || db.users[u].password !== hash(p)) { showErr(e, t('err_creds')); return; }
  e.classList.add('hidden');
  loginUser(u);
}

function handleRegister() {
  const u = $('reg-username').value.trim();
  const pseudo = $('reg-pseudo')?.value.trim() || '';
  const p = $('reg-password').value, p2 = $('reg-password2').value;
  const e = $('reg-error');
  if (!u || !p || !p2) { showErr(e, t('err_fill')); return; }
  if (!pseudo) { showErr(e, t('pseudo_required')); return; }
  if (u.length < 3) { showErr(e, t('err_min3')); return; }
  if (!/^[a-zA-Z0-9_]+$/.test(u)) { showErr(e, t('err_chars')); return; }
  if (pseudo.length < 2 || pseudo.length > 24) { showErr(e, 'Pseudo : 2-24 caractères.'); return; }
  if (p.length < 4) { showErr(e, t('err_min4')); return; }
  if (p !== p2) { showErr(e, t('err_nomatch')); return; }
  const db = getDB();
  if (db.users[u]) { showErr(e, t('err_taken')); return; }
  db.users[u] = { password: hash(p), pseudo: pseudo, list: {}, theme: 'dark', top10: { series: [], movies: [] }, joinedAt: Date.now() };
  saveDB(db); e.classList.add('hidden'); loginUser(u);
}

// Display name fallback for legacy accounts without a pseudo
function getDisplayName(username) {
  const u = username || currentUser;
  if (!u) return '';
  const data = getUserData(u);
  return data.pseudo || u;
}

// ── AVATAR RENDERING ──
function renderUserAvatar() {
  if (!currentUser) return;
  const data = getUserData(currentUser);
  const display = data.pseudo || currentUser;
  const ini = display.slice(0, 2).toUpperCase();
  const pic = data.profilePic || '';
  // Sidebar avatar
  const sb = $('sb-avatar');
  if (sb) {
    if (pic) {
      sb.style.backgroundImage = `url("${pic}")`;
      sb.classList.add('has-pic');
      sb.textContent = '';
    } else {
      sb.style.backgroundImage = '';
      sb.classList.remove('has-pic');
      sb.textContent = ini;
    }
  }
  // Sidebar username (display name)
  const nameEl = $('sb-username');
  if (nameEl) nameEl.textContent = display;
}

function loginUser(u) {
  currentUser = u;
  const db = getDB(); db.sessions = db.sessions || {}; db.sessions.current = u; saveDB(db);
  $('auth-screen').classList.add('hidden');
  $('app').classList.remove('hidden');
  renderUserAvatar();
  recordLoginDay();
  applyTheme(getUserData(u).theme || 'dark');
  currentLang = getUserData(u).lang || 'fr';
  applyLang();
  discoverPool = []; discoverIndex = 0; discoverPage = 1;
  _searchCache = {}; _recoCache = {}; _recoPools = {}; _recoFallback = null;
  currentFilter = 'all'; currentGenre = '';
  currentSearchPage = 1; searchTotalPages = 1;
  document.querySelectorAll('.status-tab').forEach(t2 => t2.classList.remove('active'));
  document.querySelector('.status-tab[data-status="all"]')?.classList.add('active');
  document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.genre-btn[data-genre=""]')?.classList.add('active');
  switchView('list');
  document.querySelectorAll('.snav-btn,.mnav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('[data-view="list"]').forEach(b => b.classList.add('active'));
  updateCounts();
  // Baseline-store current badge on login so we don't fire retroactive popups
  checkBadgeUnlock();
}

function handleLogout() {
  const db = getDB(); if (db.sessions) db.sessions.current = null; saveDB(db);
  currentUser = null;
  $('app').classList.add('hidden');
  $('auth-screen').classList.remove('hidden');
  $('login-username').value = ''; $('login-password').value = '';
}
function showErr(el, m) { el.textContent = m; el.classList.remove('hidden'); }

// ══ DATA EXPORT / IMPORT ═══════════════════════════
function exportAllData() {
  try {
    const db = getDB();
    const payload = {
      app: 'TrackDeez',
      version: 1,
      exportedAt: new Date().toISOString(),
      db: db,
      translations: JSON.parse(localStorage.getItem('anitrack_translations') || '{}'),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().slice(0, 10);
    link.download = `trackdeez-backup-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast(`✓ ${t('export_done')}`);
  } catch (err) {
    showToast(`${t('import_error')} : ${err.message}`);
  }
}

function triggerImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.style.display = 'none';
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    document.body.removeChild(input);
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || !parsed.db || !parsed.db.users || typeof parsed.db.users !== 'object') {
        throw new Error('format');
      }
      const userCount = Object.keys(parsed.db.users).length;
      if (!userCount) throw new Error('empty');
      if (!confirm(t('confirm_import'))) return;
      // Merge: imported users override on conflict
      const currentDb = getDB();
      const mergedUsers = { ...(currentDb.users || {}), ...parsed.db.users };
      const newDb = { ...currentDb, users: mergedUsers, sessions: currentDb.sessions || {} };
      saveDB(newDb);
      // Merge translations cache
      if (parsed.translations && typeof parsed.translations === 'object') {
        const cur = JSON.parse(localStorage.getItem('anitrack_translations') || '{}');
        Object.assign(cur, parsed.translations);
        try { localStorage.setItem('anitrack_translations', JSON.stringify(cur)); } catch { }
      }
      showToast(`✓ ${t('import_success')} (${userCount})`);
      setTimeout(() => location.reload(), 1500);
    } catch (err) {
      showToast(`${t('import_error')}`);
      console.error('Import failed:', err);
    }
  });
  document.body.appendChild(input);
  input.click();
}

// ══ SYNOPSIS TRANSLATION ═══════════════════════════
function getTransCache() {
  let c = {};
  try { c = JSON.parse(localStorage.getItem('anitrack_translations') || '{}'); } catch { }
  // Sweep out any poisoned entries from previous broken translations
  let dirty = false;
  for (const k in c) {
    if (typeof c[k] !== 'string' || /MYMEMORY WARNING|QUERY LENGTH LIMIT|YOU USED ALL AVAILABLE FREE/i.test(c[k])) {
      delete c[k]; dirty = true;
    }
  }
  if (dirty) {
    try { localStorage.setItem('anitrack_translations', JSON.stringify(c)); } catch { }
  }
  return c;
}
function saveTransCache(c) {
  try { localStorage.setItem('anitrack_translations', JSON.stringify(c)); } catch { }
}

// Detect API error messages so we never cache or display them
function looksLikeTranslationError(s) {
  if (!s) return true;
  return /MYMEMORY WARNING|QUERY LENGTH LIMIT|YOU USED ALL AVAILABLE FREE/i.test(s);
}

// Primary: Google Translate gtx endpoint (no auth, generous limits, used by extensions)
async function translateWithGoogle(text, targetLang) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('google http ' + r.status);
  const d = await r.json();
  // Response shape: [[[translated, original, ...], ...], ...]
  const segments = (Array.isArray(d) && Array.isArray(d[0])) ? d[0] : [];
  const out = segments.map(seg => seg && seg[0] ? seg[0] : '').join('');
  if (!out || looksLikeTranslationError(out)) throw new Error('google empty/error');
  return out;
}

// Fallback: MyMemory (chunked by sentence, ~480 char limit)
async function translateWithMyMemory(text, targetLang) {
  const chunks = [];
  let buf = '';
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if ((buf + ' ' + sentence).length > 480) {
      if (buf) chunks.push(buf.trim());
      buf = sentence;
    } else {
      buf = buf ? buf + ' ' + sentence : sentence;
    }
  }
  if (buf) chunks.push(buf.trim());
  const out = [];
  for (const c of chunks) {
    const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(c)}&langpair=en|${encodeURIComponent(targetLang)}`);
    const d = await r.json();
    const piece = d.responseData?.translatedText || '';
    if (looksLikeTranslationError(piece) || d.responseStatus === 429) {
      throw new Error('mymemory error/quota');
    }
    out.push(piece);
  }
  return out.join(' ');
}

async function translateText(text, targetLang) {
  if (!text || targetLang === 'en') return text || '';
  // 1. Try Google first
  try {
    const g = await translateWithGoogle(text, targetLang);
    if (g) return g;
  } catch { }
  // 2. Fallback to MyMemory
  try {
    const m = await translateWithMyMemory(text, targetLang);
    if (m) return m;
  } catch { }
  // 3. Both failed → return original (English) so the user always sees something readable
  return text;
}

async function getTranslatedSynopsis(malId, originalEn, targetLang) {
  if (!originalEn || targetLang === 'en') return originalEn || '';
  const cache = getTransCache();
  const key = `${malId}_${targetLang}`;
  // Self-heal: drop any previously-cached error/warning text
  if (cache[key] && looksLikeTranslationError(cache[key])) {
    delete cache[key];
    saveTransCache(cache);
  }
  if (cache[key]) return cache[key];
  const translated = await translateText(originalEn, targetLang);
  // Only cache real translations (not the original fallback, not errors)
  if (translated && translated !== originalEn && !looksLikeTranslationError(translated)) {
    cache[key] = translated;
    saveTransCache(cache);
  }
  return translated || originalEn;
}

async function applySynopsisTranslation(elId, malId, originalText) {
  const el = document.getElementById(elId);
  if (!el || !originalText) return;
  if (currentLang === 'en') { el.textContent = originalText; return; }
  // Show loading state with original text faded
  el.dataset.malid = String(malId);
  el.innerHTML = `<span style="opacity:.55">${esc(originalText)}</span>`;
  const lockId = String(malId);
  try {
    const translated = await getTranslatedSynopsis(malId, originalText, 'fr');
    // Make sure we still want to show this (modal/card not changed)
    if (el.dataset.malid === lockId) {
      el.textContent = translated;
    }
  } catch {
    if (el.dataset.malid === lockId) el.textContent = originalText;
  }
}

// ══ THEME ═════════════════════════════════════════
function toggleTheme() {
  const n = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(n);
  if (currentUser) { const d = getUserData(currentUser); d.theme = n; saveUserData(currentUser, d); }
}
function applyTheme(t2) {
  document.documentElement.setAttribute('data-theme', t2);
  document.querySelectorAll('.theme-icon').forEach(i => i.textContent = t2 === 'dark' ? '☀' : '☾');
}

// ══ NAV ══════════════════════════════════════════
function initNav() {
  document.querySelectorAll('.snav-btn').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.snav-btn,.mnav-btn').forEach(x => x.classList.remove('active'));
    document.querySelectorAll(`[data-view="${b.dataset.view}"]`).forEach(x => x.classList.add('active'));
    switchView(b.dataset.view);
  }));
  document.querySelectorAll('.mnav-btn[data-view]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.snav-btn,.mnav-btn').forEach(x => x.classList.remove('active'));
    document.querySelectorAll(`[data-view="${b.dataset.view}"]`).forEach(x => x.classList.add('active'));
    switchView(b.dataset.view);
  }));
}

function switchView(v) {
  currentView = v;
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  const target = $(`view-${v}`);
  if (target) target.classList.add('active');
  if (v === 'list') renderListView();
  if (v === 'search') { if (!Object.keys(_searchCache).length) searchAnime(); }
  if (v === 'favorites') {
    // Favorites is now a filter inside list view
    document.querySelectorAll('.snav-btn,.mnav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('[data-view="list"]').forEach(b => b.classList.add('active'));
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    $('view-list').classList.add('active');
    currentView = 'list';
    currentFilter = 'favorites';
    document.querySelectorAll('.status-tab').forEach(x => x.classList.remove('active'));
    document.querySelector('.status-tab[data-status="favorites"]')?.classList.add('active');
    renderListView();
  }
  if (v === 'quizz') renderQuizView();
  if (v === 'top10') renderTop10();
  if (v === 'achievements') renderAchievements();
  if (v === 'donation') { /* static view, nothing to render */ }
  if (v === 'discover') { initDiscover(); renderDiscoverStats(); renderDiscoverRecos(); }
}

// ══ STATUS TABS ════════════════════════════════════
function initStatusTabs() {
  document.querySelectorAll('.status-tab').forEach(t2 => t2.addEventListener('click', () => {
    document.querySelectorAll('.status-tab').forEach(x => x.classList.remove('active'));
    t2.classList.add('active');
    currentFilter = t2.dataset.status;
    renderListView();
  }));
}

// ══ AUTH TABS ═════════════════════════════════════
function initAuthTabs() {
  document.querySelectorAll('.auth-tab').forEach(t2 => t2.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(x => x.classList.remove('active'));
    t2.classList.add('active');
    const w = t2.dataset.tab;
    $('login-form').classList.toggle('hidden', w !== 'login');
    $('register-form').classList.toggle('hidden', w !== 'register');
    $('login-error').classList.add('hidden');
    $('reg-error').classList.add('hidden');
  }));
}

// ══ COUNTS ════════════════════════════════════════
function updateCounts() {
  const arr = Object.values(getList());
  $('count-all').textContent = arr.length;
  $('count-watching').textContent = arr.filter(a => a.status === 'watching').length;
  $('count-plan').textContent = arr.filter(a => a.status === 'planToWatch').length;
  $('count-completed').textContent = arr.filter(a => a.status === 'completed').length;
  const favEl = $('count-fav');
  if (favEl) favEl.textContent = arr.filter(a => a.favorite).length;
}

// ══ LIST SORT ══════════════════════════════════════
const LIST_SORTERS = {
  recent: (a, b) => (b.addedAt || 0) - (a.addedAt || 0),
  alpha: (a, b) => (a.title || '').localeCompare(b.title || ''),
  alpha_rev: (a, b) => (b.title || '').localeCompare(a.title || ''),
  score_desc: (a, b) => (computeGlobal(b.scores) ?? -1) - (computeGlobal(a.scores) ?? -1),
  score_asc: (a, b) => (computeGlobal(a.scores) ?? 999) - (computeGlobal(b.scores) ?? 999),
};

function setListSort(mode) {
  listSortMode = mode;
  document.querySelectorAll('.sort-opt').forEach(b => b.classList.toggle('active', b.dataset.sort === mode));
  renderListView();
}

// ══ RENDER LIST ════════════════════════════════════
function renderListView() {
  const all = Object.values(getList());
  let items;
  if (currentFilter === 'all') items = all;
  else if (currentFilter === 'favorites') items = all.filter(a => a.favorite);
  else items = all.filter(a => a.status === currentFilter);
  // Apply sort
  const sorter = LIST_SORTERS[listSortMode] || LIST_SORTERS.recent;
  items = [...items].sort(sorter);
  const series = items.filter(a => !isMovie(a));
  const movies = items.filter(a => isMovie(a));
  $('grid-series').innerHTML = series.map(a => buildCard(a, 'list')).join('');
  $('grid-movies').innerHTML = movies.map(a => buildCard(a, 'list')).join('');
  $('section-series').style.display = series.length ? '' : 'none';
  $('section-movies').style.display = movies.length ? '' : 'none';
  $('list-empty').classList.toggle('hidden', items.length > 0);
  // update tab labels
  document.querySelectorAll('.status-tab').forEach(tab => {
    const s = tab.dataset.status;
    const lbl = tab.querySelector('.tab-lbl');
    if (lbl) {
      if (s === 'all') lbl.textContent = t('all');
      else if (s === 'watching') lbl.textContent = t('watching');
      else if (s === 'planToWatch') lbl.textContent = t('plan');
      else if (s === 'completed') lbl.textContent = t('completed');
    }
  });
  document.querySelectorAll('.type-label').forEach(el => {
    if (el.dataset.type === 'series') el.textContent = t('series');
    if (el.dataset.type === 'movies') el.textContent = t('movies');
  });
  updateCounts();
}

// ══ RENDER FAVORITES (now an alias to list view filtered) ══
function renderFavorites() {
  // Favorites is integrated as a status-tab in the list view.
  if (currentView === 'list') renderListView();
}

// ══ BUILD CARD ════════════════════════════════════
function buildCard(anime, mode) {
  const cur = anime.currentEp || 0, total = anime.episodes || 0;
  const pct = total ? Math.round((cur / total) * 100) : 0;
  const global = computeGlobal(anime.scores);

  if (mode === 'search') {
    const inList = !!getList()[anime.mal_id];
    return `<div class="anime-card" onclick="openModal(${anime.mal_id},'search')">
      <div class="card-img-wrap"><img src="${esc(anime.image)}" alt="${esc(anime.title)}" loading="lazy"/></div>
      <div class="card-body">
        <div class="card-title">${esc(anime.title)}</div>
        <button class="card-add-btn ${inList ? 'added' : ''}" onclick="event.stopPropagation();${inList ? '' : 'quickAdd(' + anime.mal_id + ')'}">
          ${inList ? t('in_list') : t('add')}
        </button>
      </div>
    </div>`;
  }

  const statusLabels = { watching: t('watching'), planToWatch: t('plan'), completed: t('completed') };
  const progress = (anime.status === 'watching' && !isMovie(anime)) ? `
    <div class="progress-wrap">
      <div class="progress-label"><span>Ép. ${cur}</span><span>${pct}%</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>`: '';

  const scoreBadge = (anime.status === 'completed' && global)
    ? `<div class="card-score">★ ${global}/20</div>` : '';

  return `<div class="anime-card" onclick="openModal(${anime.mal_id},'list')">
    <div class="card-img-wrap">
      <img src="${esc(anime.image)}" alt="${esc(anime.title)}" loading="lazy"/>
      <div class="card-badge badge-${anime.status}">${statusLabels[anime.status]}</div>
      ${anime.favorite ? '<div class="card-fav">⭐</div>' : ''}
      ${scoreBadge}
    </div>
    <div class="card-body"><div class="card-title">${esc(anime.title)}</div>${progress}</div>
  </div>`;
}

// ══ SEARCH ════════════════════════════════════════
let _searchCache = {};

function initGenreFilters() {
  document.querySelectorAll('.genre-btn').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.genre-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    currentGenre = b.dataset.genre;
    currentSearchPage = 1;
    searchAnime();
    // "Dark Sasuke" — clicked the Seinen demographic filter
    if (b.dataset.genre === '42' && currentUser) {
      const data = getUserData(currentUser);
      if (!data.seenSeinenFilter) {
        data.seenSeinenFilter = true;
        saveUserData(currentUser, data);
        showToast(`🏆 ${achLabel(ACHIEVEMENTS.find(x => x.key === 'darksasuke'))} !`);
      }
    }
  }));
}

async function searchAnime(page) {
  page = page || 1;
  currentSearchPage = page;
  const q = $('search-input')?.value.trim() || '';
  lastSearchQuery = q; lastSearchGenre = currentGenre;
  $('search-results').innerHTML = '';
  $('search-pagination').innerHTML = '';
  $('search-loading').classList.remove('hidden');
  $('search-empty').classList.add('hidden');
  try {
    await rl();
    let url = `${JIKAN}/anime?limit=24&sfw=false&page=${page}`;
    if (q) url += `&q=${encodeURIComponent(q)}`;
    if (currentGenre) url += `&genres=${currentGenre}`;
    if (!q) url += `&order_by=score&sort=desc`;
    const res = await fetch(url);
    const data = await res.json();
    $('search-loading').classList.add('hidden');
    if (!data.data?.length) { $('search-empty').classList.remove('hidden'); return; }

    // Pagination info
    searchTotalPages = data.pagination?.last_visible_page || 1;
    const totalItems = data.pagination?.items?.total || 0;

    _searchCache = {};
    let items = data.data;
    if (searchHideAdded) {
      const userList = getList();
      items = items.filter(a => !userList[a.mal_id]);
    }
    if (searchHideNsfw) {
      items = items.filter(a => {
        const info = getRatingInfo(a.rating);
        return !info || info.tier !== 'extreme';
      });
    }
    items.forEach(a => {
      _searchCache[a.mal_id] = {
        mal_id: a.mal_id,
        title: a.title_english || a.title,
        image: a.images?.jpg?.image_url || '',
        episodes: a.episodes,
        synopsis: a.synopsis,
        genres: a.genres?.map(g => g.name) || [],
        themes: a.themes?.map(g => g.name) || [],
        year: a.year || (a.aired?.from ? new Date(a.aired.from).getFullYear() : null),
        type: a.type,
        score: a.score,
        trailer_id: extractTrailerId(a.trailer),
        season: a.season || null,
        status_airing: a.status || null,
        rating: a.rating || null,
      };
    });
    $('search-results').innerHTML = Object.values(_searchCache).map(a => buildCard(a, 'search')).join('');
    if (searchHideAdded && !Object.keys(_searchCache).length) {
      $('search-empty').classList.remove('hidden');
    }
    renderSearchPagination(totalItems);
  } catch (err) {
    $('search-loading').classList.add('hidden');
    showToast('Erreur de recherche. Réessayez.');
    console.error(err);
  }
}

function renderSearchPagination(totalItems) {
  const el = $('search-pagination');
  if (!el || searchTotalPages <= 1) { if (el) el.innerHTML = ''; return; }
  const p = currentSearchPage, last = searchTotalPages;
  const info = totalItems ? `<span class="pg-total">${totalItems} résultats</span>` : '';
  let pages = '';
  // Always show first, last, current ±2
  const shown = new Set();
  [1, 2, p - 2, p - 1, p, p + 1, p + 2, last - 1, last].forEach(n => { if (n >= 1 && n <= last) shown.add(n); });
  const sorted = [...shown].sort((a, b) => a - b);
  let prev = -1;
  sorted.forEach(n => {
    if (prev !== -1 && n - prev > 1) pages += `<span class="pg-dots">…</span>`;
    pages += `<button class="pg-btn${n === p ? ' pg-active' : ''}" onclick="searchAnime(${n})">${n}</button>`;
    prev = n;
  });
  el.innerHTML = `<div class="pagination-wrap">${info}<div class="pg-pages">
    <button class="pg-btn pg-arrow" ${p <= 1 ? 'disabled' : ''} onclick="searchAnime(${p - 1})">‹</button>
    ${pages}
    <button class="pg-btn pg-arrow" ${p >= last ? 'disabled' : ''} onclick="searchAnime(${p + 1})">›</button>
  </div></div>`;
}

function toggleSearchHideAdded() {
  searchHideAdded = !searchHideAdded;
  const cb = $('search-hide-added');
  if (cb) cb.checked = searchHideAdded;
  currentSearchPage = 1;
  searchAnime();
}

function toggleSearchHideNsfw() {
  searchHideNsfw = !searchHideNsfw;
  const cb = $('search-hide-nsfw');
  if (cb) cb.checked = searchHideNsfw;
  currentSearchPage = 1;
  searchAnime();
}

function quickAdd(malId) {
  const c = _searchCache[malId]; if (!c) return;
  const list = getList();
  list[malId] = { ...c, status: 'planToWatch', currentEp: 0, scores: {}, favorite: false, addedAt: Date.now() };
  saveList(list); updateCounts();
  showToast(`"${c.title}" ${t('added_list')}`);
  refreshSearchCards();
}

function refreshSearchCards() {
  if (!Object.keys(_searchCache).length) return;
  $('search-results').innerHTML = Object.values(_searchCache).map(a => buildCard(a, 'search')).join('');
}

// ══ DISCOVER ══════════════════════════════════════
function seasonLabel(s) {
  const map = { spring: t('season_spring'), summer: t('season_summer'), fall: t('season_fall'), winter: t('season_winter') };
  return map[s] || s;
}

function getUserTopGenres(limit) {
  const list = getList();
  const counts = {};
  Object.values(list).forEach(a => {
    // weight completed > watching > plan
    const w = a.status === 'completed' ? 3 : a.status === 'watching' ? 2 : 1;
    (a.genres || []).forEach(g => { counts[g] = (counts[g] || 0) + w; });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit || 3);
}

function getUserAvgScore() {
  const list = getList();
  const completed = Object.values(list).filter(a => a.status === 'completed');
  const globals = completed.map(a => computeGlobal(a.scores)).filter(v => v !== null);
  if (!globals.length) return null;
  return Math.round((globals.reduce((a, b) => a + b, 0) / globals.length) * 10) / 10;
}

function renderDiscoverStats() {
  const arr = Object.values(getList());
  const total = arr.length;
  const completed = arr.filter(a => a.status === 'completed').length;
  const avg = getUserAvgScore();
  const top = getUserTopGenres(4);
  const el = $('discover-stats'); if (!el) return;
  if (!total) {
    el.innerHTML = `<div class="ds-empty">${t('nothing_yet')}</div>`;
    return;
  }
  const maxC = top[0]?.[1] || 1;
  el.innerHTML = `
    <div class="ds-stat-row"><span class="ds-stat-lbl">${t('total')}</span><span class="ds-stat-val">${total}</span></div>
    <div class="ds-stat-row"><span class="ds-stat-lbl">${t('completed_lbl')}</span><span class="ds-stat-val">${completed}</span></div>
    ${avg !== null ? `<div class="ds-stat-row"><span class="ds-stat-lbl">${t('avg_score')}</span><span class="ds-stat-val ds-stat-star">★ ${avg}/20</span></div>` : ''}
    ${top.length ? `<div class="ds-genre-block">
      <div class="ds-block-title">${t('top_genres')}</div>
      ${top.map(([g, c]) => `<div class="ds-genre-row">
        <span class="ds-genre-name">${esc(g)}</span>
        <div class="ds-genre-track"><div class="ds-genre-fill" style="width:${Math.round((c / maxC) * 100)}%"></div></div>
      </div>`).join('')}
    </div>`: ''}
  `;
}

function shapeRecoItem(a) {
  return {
    mal_id: a.mal_id,
    title: a.title_english || a.title,
    image: a.images?.jpg?.image_url || '',
    score: a.score,
    episodes: a.episodes,
    synopsis: a.synopsis,
    genres: a.genres?.map(g => g.name) || [],
    themes: a.themes?.map(g => g.name) || [],
    year: a.year || (a.aired?.from ? new Date(a.aired.from).getFullYear() : null),
    type: a.type,
    trailer_id: extractTrailerId(a.trailer),
    season: a.season || null,
    status_airing: a.status || null,
    rating: a.rating || null,
  };
}

async function fetchGenrePage(genreId, page, minScore, mode) {
  await rl();
  // mode 'score' → top-rated, 'recent' → score-weighted recent (start_date filter)
  const since = new Date(); since.setFullYear(since.getFullYear() - 4);
  const isoDate = since.toISOString().slice(0, 10);
  const baseUrl = mode === 'recent'
    ? `${JIKAN}/anime?genres=${genreId}&order_by=score&sort=desc&min_score=${minScore.toFixed(1)}&limit=25&page=${page}&start_date=${isoDate}`
    : `${JIKAN}/anime?genres=${genreId}&order_by=score&sort=desc&min_score=${minScore.toFixed(1)}&limit=25&page=${page}`;
  const r = await fetch(baseUrl);
  const d = await r.json();
  const items = (d.data || []).filter(a => a.images?.jpg?.image_url).map(shapeRecoItem);
  const hasNext = !!d.pagination?.has_next_page;
  return { items, hasNext };
}

async function ensureRecoPool(genreId, minScore) {
  if (!_recoPools[genreId]) _recoPools[genreId] = { items: [], page: 1, done: false, mode: 'score', switched: false };
  const p = _recoPools[genreId];
  // Fetch up to 4 pages on first call, then incrementally
  while (!p.done && p.items.length < 60) {
    try {
      const { items, hasNext } = await fetchGenrePage(genreId, p.page, minScore, p.mode);
      p.items = [...p.items, ...items];
      p.page++;
      if (!hasNext) {
        if (!p.switched) {
          // Switch from score mode to recent mode for fresh material
          p.switched = true;
          p.mode = 'recent';
          p.page = 1;
        } else {
          p.done = true;
          break;
        }
      }
      // Stop early once we have enough
      if (p.items.length >= 60) break;
    } catch { p.done = true; break; }
  }
  return p;
}

function getAvailableFromPool(p) {
  const list = getList();
  const skipped = getSkipped();
  return p.items.filter(a => !list[a.mal_id] && !skipped[a.mal_id]);
}

async function loadFallbackRecos() {
  if (_recoFallback) return _recoFallback;
  try {
    await rl();
    const r = await fetch(`${JIKAN}/top/anime?limit=25&filter=bypopularity`);
    const d = await r.json();
    _recoFallback = (d.data || []).filter(a => a.images?.jpg?.image_url).map(shapeRecoItem);
  } catch { _recoFallback = []; }
  return _recoFallback;
}

async function renderDiscoverRecos() {
  const el = $('discover-recos'); if (!el) return;
  const top = getUserTopGenres(3);
  const validGenres = top.filter(([g]) => GENRE_MAP[g]);
  if (!validGenres.length) { el.innerHTML = `<div class="ds-empty">${t('no_recos')}</div>`; return; }

  const userAvg = getUserAvgScore();
  const minScore = userAvg !== null
    ? Math.min(8.5, Math.max(6.5, (userAvg / 2) - 0.3))
    : 7;

  // Weighted-random pick of primary genre (rotates among top 3)
  const totalWeight = validGenres.reduce((s, [, c]) => s + c, 0);
  let pickW = Math.random() * totalWeight, primaryIdx = 0;
  for (let i = 0; i < validGenres.length; i++) {
    pickW -= validGenres[i][1];
    if (pickW <= 0) { primaryIdx = i; break; }
  }
  // Reorder: primary first, then others (so we fall back through user's top genres)
  const order = [primaryIdx, ...validGenres.map((_, i) => i).filter(i => i !== primaryIdx)];

  // Show loading only on first build
  if (!el.children.length) {
    el.innerHTML = `<div class="ds-loading"><div class="spinner-sm"></div></div>`;
  }

  // Try each top genre in order until one yields ≥1 available item
  let chosenName = null, chosenAvail = [];
  for (const idx of order) {
    const [name] = validGenres[idx];
    const id = GENRE_MAP[name];
    const pool = await ensureRecoPool(id, minScore);
    const avail = getAvailableFromPool(pool);
    if (avail.length) { chosenName = name; chosenAvail = avail; break; }
    // Pool exhausted for this genre — try next one
  }

  // Final fallback: most-popular anime overall (excluding list + skipped)
  if (!chosenAvail.length) {
    const fallback = await loadFallbackRecos();
    const list = getList(), skipped = getSkipped();
    chosenAvail = fallback.filter(a => !list[a.mal_id] && !skipped[a.mal_id]);
    chosenName = currentLang === 'fr' ? 'Populaires' : 'Popular';
  }

  if (!chosenAvail.length) { el.innerHTML = `<div class="ds-empty">${t('no_recos')}</div>`; return; }

  // Shuffle and pick 4
  const shuffled = [...chosenAvail].sort(() => Math.random() - 0.5).slice(0, 4);
  shuffled.forEach(a => { _searchCache[a.mal_id] = a; });
  renderRecoCards(el, shuffled, chosenName);
}

function renderRecoCards(el, list, genreName) {
  if (!list.length) { el.innerHTML = `<div class="ds-empty">${t('no_recos')}</div>`; return; }
  el.innerHTML = `
    <div class="ds-reco-genre">🎯 ${esc(genreName)}</div>
    ${list.map(a => {
    const raw = Number(a.score) || 0;
    const score20 = raw ? Math.min(20, raw <= 10 ? raw * 2 : raw).toFixed(1) : null;
    return `<div class="ds-reco-card" onclick="openModal(${a.mal_id},'reco')">
        <img class="ds-reco-thumb" src="${esc(a.image)}" alt="${esc(a.title)}" loading="lazy"/>
        <div class="ds-reco-info">
          <div class="ds-reco-title">${esc(a.title)}</div>
          ${score20 ? `<div class="ds-reco-score">★ ${score20}/20</div>` : ''}
        </div>
      </div>`;
  }).join('')}
  `;
}

async function initDiscover() {
  if (discoverPool.length && discoverIndex < discoverPool.length) { showDiscoverCard(); return; }
  $('discover-loading').classList.remove('hidden');
  $('discover-card').style.display = 'none';
  $('discover-actions').style.opacity = '0.3';
  $('discover-actions').style.pointerEvents = 'none';
  try {
    await rl();
    const res = await fetch(`${JIKAN}/anime?limit=25&order_by=score&sort=desc&page=${discoverPage}&min_score=6`);
    const data = await res.json();
    discoverPage++;
    const list = getList();
    const skipped = getSkipped();
    const fresh = (data.data || []).filter(a =>
      !list[a.mal_id] && !skipped[a.mal_id] && a.images?.jpg?.image_url && (a.synopsis?.length > 50)
    );
    discoverPool = [...discoverPool, ...fresh.map(a => ({
      mal_id: a.mal_id,
      title: a.title_english || a.title,
      image: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || '',
      episodes: a.episodes,
      synopsis: a.synopsis,
      genres: a.genres?.map(g => g.name) || [],
      themes: a.themes?.map(g => g.name) || [],
      year: a.year || (a.aired?.from ? new Date(a.aired.from).getFullYear() : null),
      type: a.type,
      score: a.score,
      trailer_id: extractTrailerId(a.trailer),
      season: a.season || null,
      season_year: a.year || null,
      status_airing: a.status || null,
      rating: a.rating || null,
    }))];
    $('discover-loading').classList.add('hidden');
    $('discover-card').style.display = '';
    $('discover-actions').style.opacity = '';
    $('discover-actions').style.pointerEvents = '';
    showDiscoverCard();
  } catch {
    $('discover-loading').classList.add('hidden');
    showToast('Erreur de chargement. Réessayez.');
  }
}

function showDiscoverCard() {
  const list = getList();
  const skipped = getSkipped();
  while (discoverIndex < discoverPool.length) {
    const id = discoverPool[discoverIndex]?.mal_id;
    if (!id || list[id] || skipped[id]) { discoverIndex++; continue; }
    break;
  }
  if (discoverIndex >= discoverPool.length) { initDiscover(); return; }
  const a = discoverPool[discoverIndex];

  $('dc-img').src = a.image;
  $('dc-img').alt = a.title;
  $('dc-title').textContent = a.title;
  if (a.synopsis) {
    applySynopsisTranslation('dc-synopsis', a.mal_id, a.synopsis);
  } else {
    $('dc-synopsis').textContent = '';
  }

  // Tags (genres + themes combined)
  const allTags = [...a.genres, ...(a.themes || [])];
  $('dc-genres').innerHTML = allTags.slice(0, 5).map(g => `<span class="dc-genre-tag">${esc(g)}</span>`).join('');

  // Meta: score /20, season, episodes, type
  const meta = [];
  if (a.type) meta.push(`<span class="dc-meta-tag ${isMovie(a) ? 'tag-movie' : 'tag-series'}">${isMovie(a) ? '🎬 Film' : '📺 Série'}</span>`);
  // Status airing
  const dcStatusInfo = getStatusInfo(a.status_airing);
  if (dcStatusInfo) meta.push(`<span class="dc-meta-tag status-tag-${dcStatusInfo.key}"><span class="status-dot"></span>${dcStatusInfo[currentLang === 'en' ? 'labelEn' : 'labelFr']}</span>`);
  // Audience rating
  const dcRatingInfo = getRatingInfo(a.rating);
  if (dcRatingInfo) meta.push(`<span class="dc-meta-tag rating-tag rating-${dcRatingInfo.tier}">${dcRatingInfo[currentLang === 'en' ? 'labelEn' : 'labelFr']}</span>`);
  if (a.score) {
    const raw = Number(a.score) || 0;
    const score20 = Math.min(20, Math.max(0, raw <= 10 ? raw * 2 : raw)).toFixed(1);
    meta.push(`<span class="dc-meta-tag dc-score" title="${t('score_label')}">★ MAL ${score20}/20</span>`);
  }
  if (a.season && a.season_year) meta.push(`<span class="dc-meta-tag">📅 ${seasonLabel(a.season)} ${a.season_year}</span>`);
  else if (a.year) meta.push(`<span class="dc-meta-tag">📅 ${a.year}</span>`);
  if (a.episodes) meta.push(`<span class="dc-meta-tag">📺 ${a.episodes} ${t('eps_label')}</span>`);
  $('dc-meta').innerHTML = meta.join('');

  // Trailer + reviews live in the right side panel
  renderDiscoverTrailer(a);
  renderDiscoverReviewsPanel(a);
}

function renderDiscoverTrailer(a) {
  const el = $('discover-trailer');
  const subEl = $('dc-trailer-sub');
  if (!el) return;
  if (a && a.trailer_id) {
    if (subEl) subEl.textContent = a.title || '';
    const tid = esc(a.trailer_id);
    const safeTitle = esc(a.title || 'Trailer');
    el.innerHTML = `
      <div class="trailer-embed-wrap" id="trailer-embed-wrap" data-tid="${tid}">
        <img class="trailer-thumb"
             src="https://i.ytimg.com/vi/${tid}/maxresdefault.jpg"
             onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${tid}/hqdefault.jpg'"
             alt="${safeTitle}" loading="lazy"/>
        <button class="trailer-play-btn" type="button" onclick="playTrailerEmbed('${tid}', this)" aria-label="${t('play_trailer')}">
          <svg viewBox="0 0 68 48" aria-hidden="true">
            <path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55C3.97 2.33 2.27 4.81 1.48 7.74 0.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="#f00"/>
            <path d="M45 24 27 14v20z" fill="#fff"/>
          </svg>
        </button>
      </div>
      <a class="trailer-yt-link" href="https://www.youtube.com/watch?v=${tid}" target="_blank" rel="noopener">↗ ${t('watch_on_yt')}</a>
    `;
  } else {
    if (subEl) subEl.textContent = '';
    el.innerHTML = `<div class="trailer-empty">
      <div class="trailer-empty-icon">🎬</div>
      <div>${t('no_trailer_panel')}</div>
    </div>`;
  }
}

function playTrailerEmbed(tid, btn) {
  const wrap = document.getElementById('trailer-embed-wrap');
  if (!wrap) return;
  wrap.innerHTML = `<iframe class="trailer-embed"
    src="https://www.youtube-nocookie.com/embed/${esc(tid)}?autoplay=1&rel=0&modestbranding=1&playsinline=1"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen frameborder="0"
    title="Trailer"></iframe>`;
}

function discoverAction(action) {
  const a = discoverPool[discoverIndex];
  if (!a) return;
  // Track swipe timing for "Compulsive Scroller" achievement (10 swipes < 5s)
  if (currentUser) {
    const userData = getUserData(currentUser);
    const now = Date.now();
    if (!userData.swipeTimes) userData.swipeTimes = [];
    userData.swipeTimes.push(now);
    if (userData.swipeTimes.length > 12) userData.swipeTimes = userData.swipeTimes.slice(-12);
    if (userData.swipeTimes.length >= 10 && !userData.compulsiveScroller) {
      const last10 = userData.swipeTimes.slice(-10);
      if (last10[9] - last10[0] < 5000) {
        userData.compulsiveScroller = true;
        showToast(`🏆 ${achLabel(ACHIEVEMENTS.find(x => x.key === 'compulsive'))} !`);
      }
    }
    saveUserData(currentUser, userData);
  }
  if (action === 'skip') {
    addSkipped(a.mal_id);
  } else {
    const list = getList();
    list[a.mal_id] = { ...a, status: action, currentEp: 0, scores: {}, favorite: false, addedAt: Date.now() };
    saveList(list); updateCounts();
    const labels = {
      planToWatch: `🕐 ${t('to_watch')}`,
      watching: `▶ ${t('in_progress')}`,
      completed: `✓ ${t('done')}`
    };
    showToast(labels[action]);
    if (action === 'completed') checkBadgeUnlock();
  }
  discoverIndex++;
  const card = $('discover-card');
  card.style.transition = 'transform .25s,opacity .25s';
  card.style.transform = action === 'skip' ? 'translateX(-60px) rotate(-3deg)' : 'translateX(60px) rotate(3deg)';
  card.style.opacity = '0';
  setTimeout(() => {
    card.style.transition = ''; card.style.transform = ''; card.style.opacity = '';
    showDiscoverCard();
    renderDiscoverStats();
    renderDiscoverRecos();
  }, 260);
}

// ══ MODAL ═════════════════════════════════════════
let _modal = null;

async function openModal(malId, source) {
  const list = getList();
  let anime = list[malId] || (_searchCache[malId] ? { ..._searchCache[malId], status: null } : null);
  if (!anime) {
    $('modal-overlay').classList.remove('hidden');
    $('modal-content').innerHTML = `<div class="loading-state"><div class="spinner"></div><p>${t('loading')}</p></div>`;
    try {
      await rl();
      const d = (await (await fetch(`${JIKAN}/anime/${malId}`)).json()).data;
      anime = {
        mal_id: d.mal_id,
        title: d.title_english || d.title,
        image: d.images?.jpg?.large_image_url || d.images?.jpg?.image_url || '',
        episodes: d.episodes,
        synopsis: d.synopsis,
        genres: d.genres?.map(g => g.name) || [],
        themes: d.themes?.map(g => g.name) || [],
        demographics: d.demographics?.map(g => g.name) || [],
        year: d.year || (d.aired?.from ? new Date(d.aired.from).getFullYear() : null),
        type: d.type,
        score: d.score,
        trailer_id: extractTrailerId(d.trailer),
        season: d.season || null,
        status_airing: d.status || null,
        rating: d.rating || null,
        status: null, currentEp: 0, scores: {}, favorite: false
      };
    } catch { $('modal-content').innerHTML = '<p style="padding:20px">Impossible de charger.</p>'; return; }
  }
  if (!anime.scores) anime.scores = {};
  _modal = { ...anime, mal_id: malId };
  _modalTab = 'details';
  renderModal(malId);
  $('modal-overlay').classList.remove('hidden');
  // Backfill missing fields (status_airing, rating) for old entries — re-renders modal once data arrives
  backfillAnimeMeta(malId);
}

// ── BULK METADATA RESYNC ──
// Re-fetches /anime/{id} for every list entry that's missing common metadata
// (demographics, status_airing, rating, etc.). Used to rescue achievements
// that depend on fields that weren't returned by the original /anime search.
function _animeNeedsResync(a) {
  if (!a) return false;
  return !a.demographics || !a.demographics.length
      || !a.status_airing || !a.rating
      || !a.genres || !a.genres.length;
}

async function syncAllMetadata() {
  if (!currentUser) return;
  const list = getList();
  const items = Object.entries(list).filter(([_, a]) => _animeNeedsResync(a));
  if (!items.length) {
    showToast(`✓ ${t('sync_skip_uptodate')}`);
    return;
  }
  const total = items.length;
  let done = 0;
  showSyncOverlay(0, total);
  for (const [malId, a] of items) {
    try {
      await rl();
      const resp = await fetch(`${JIKAN}/anime/${malId}`);
      const json = await resp.json();
      const d = json?.data;
      if (d) {
        if (!a.demographics || !a.demographics.length) a.demographics = d.demographics?.map(g => g.name) || [];
        if (!a.genres       || !a.genres.length)       a.genres       = d.genres?.map(g => g.name) || [];
        if (!a.themes       || !a.themes.length)       a.themes       = d.themes?.map(g => g.name) || [];
        if (!a.status_airing) a.status_airing = d.status || null;
        if (!a.rating)        a.rating        = d.rating || null;
        if (!a.season)        a.season        = d.season || null;
        if (!a.year)          a.year          = d.year || (d.aired?.from ? new Date(d.aired.from).getFullYear() : null);
        if (!a.trailer_id)    a.trailer_id    = extractTrailerId(d.trailer);
      }
    } catch {}
    done++;
    showSyncOverlay(done, total);
    // Persist incrementally so a refresh mid-sync doesn't lose progress
    saveList(list);
  }
  hideSyncOverlay();
  showToast(`✓ ${done} ${t('sync_done_n')}`);
  if (currentView === 'achievements') renderAchievements();
}

function showSyncOverlay(done, total) {
  let overlay = document.getElementById('sync-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'sync-overlay';
    overlay.className = 'sync-overlay';
    document.body.appendChild(overlay);
  }
  const pct = total ? Math.round((done / total) * 100) : 0;
  overlay.innerHTML = `
    <div class="sync-card">
      <div class="sync-spinner"></div>
      <div class="sync-text">${t('sync_progress')}</div>
      <div class="sync-counter">${done} / ${total}</div>
      <div class="sync-bar"><div class="sync-fill" style="width:${pct}%"></div></div>
    </div>
  `;
}

function hideSyncOverlay() {
  const overlay = document.getElementById('sync-overlay');
  if (overlay) overlay.remove();
}

async function backfillAnimeMeta(malId) {
  if (!_modal || _modal.mal_id !== malId) return;
  if (_modal.status_airing && _modal.rating) return; // nothing missing
  try {
    await rl();
    const d = (await (await fetch(`${JIKAN}/anime/${malId}`)).json()).data;
    if (!d) return;
    // Fill any missing meta fields
    const patch = {
      status_airing: _modal.status_airing || d.status || null,
      rating: _modal.rating || d.rating || null,
      season: _modal.season || d.season || null,
      year: _modal.year || d.year || (d.aired?.from ? new Date(d.aired.from).getFullYear() : null),
      trailer_id: _modal.trailer_id || extractTrailerId(d.trailer),
      genres: (_modal.genres && _modal.genres.length) ? _modal.genres : (d.genres?.map(g => g.name) || []),
      themes: (_modal.themes && _modal.themes.length) ? _modal.themes : (d.themes?.map(g => g.name) || []),
      demographics: (_modal.demographics && _modal.demographics.length) ? _modal.demographics : (d.demographics?.map(g => g.name) || []),
    };
    // Persist into list if anime is tracked
    const list = getList();
    if (list[malId]) {
      Object.assign(list[malId], patch);
      saveList(list);
    }
    // Update _modal and re-render if still open on same anime
    if (_modal && _modal.mal_id === malId) {
      Object.assign(_modal, patch);
      renderModal(malId);
    }
  } catch { }
}

function renderModal(malId) {
  const list = getList();
  const inList = !!list[malId];
  const a = _modal;
  const s = a.scores || {};
  const movie = isMovie(a);
  const cur = a.currentEp || 0, total = a.episodes || 0;
  const pct = total ? Math.round((cur / total) * 100) : 0;
  const global = computeGlobal(s);

  const typeTag = a.type ? `<span class="modal-meta-tag ${movie ? 'tag-movie' : 'tag-series'}">${movie ? '🎬 Film' : '📺 ' + t('series')}</span>` : '';
  const yearTag = a.year ? `<span class="modal-meta-tag">📅 ${a.year}</span>` : '';
  const epsTag = a.episodes ? `<span class="modal-meta-tag">📺 ${a.episodes} ${t('eps_label')}</span>` : '';
  // MAL community score, clamped to /10 then displayed on /20 (max 20)
  const malRaw = Number(a.score) || 0;
  const mal20 = Math.min(20, Math.max(0, malRaw <= 10 ? malRaw * 2 : malRaw)).toFixed(1);
  const scoreTag = malRaw ? `<span class="modal-meta-tag dc-score" title="${t('score_label')}">★ MAL ${mal20}/20</span>` : '';
  const seasonTag = (a.season && a.year) ? `<span class="modal-meta-tag">🗓 ${seasonLabel(a.season)} ${a.year}</span>` : '';
  const statusInfo = getStatusInfo(a.status_airing);
  const statusTag = statusInfo ? `<span class="modal-meta-tag status-tag-${statusInfo.key}"><span class="status-dot"></span>${statusInfo[currentLang === 'en' ? 'labelEn' : 'labelFr']}</span>` : '';
  const ratingInfo = getRatingInfo(a.rating);
  const ratingTag = ratingInfo ? `<span class="modal-meta-tag rating-tag rating-${ratingInfo.tier}">${ratingInfo[currentLang === 'en' ? 'labelEn' : 'labelFr']}</span>` : '';

  // Tags: genres + themes + demographics
  const allTags = [...(a.genres || []), ...(a.themes || []), ...(a.demographics || [])];
  const TAGS_INITIAL = 5;
  const tagsHtml = allTags.length ? `
    <div class="modal-tags-wrap" id="modal-tags-wrap">
      <div class="modal-tags" id="modal-tags-list">
        ${allTags.slice(0, TAGS_INITIAL).map(g => `<span class="modal-tag">${esc(g)}</span>`).join('')}
      </div>
      ${allTags.length > TAGS_INITIAL ? `<button class="tags-toggle-btn" id="tags-toggle-btn" onclick="toggleTagsExpand(${JSON.stringify(allTags).replace(/"/g, '&quot;')})">
        ${t('see_all_tags')} (${allTags.length})
      </button>`: ''}
    </div>`: '';

  // Trailer link
  const trailerHtml = a.trailer_id ? `<a class="trailer-btn modal-trailer" href="https://www.youtube.com/watch?v=${esc(a.trailer_id)}" target="_blank" rel="noopener">▶ ${t('watch_trailer')}</a>` : '';

  const addBtn = !inList ? `
    <div class="modal-section">
      <div class="msec-title">${t('add_to_list')}</div>
      <div class="status-selector">
        <button class="status-opt" onclick="addToList('planToWatch')">🕐 ${t('plan')}</button>
        <button class="status-opt" onclick="addToList('watching')">▶ ${t('watching')}</button>
        <button class="status-opt" onclick="addToList('completed')">✓ ${t('completed')}</button>
      </div>
    </div>`: '';

  const statusSec = inList ? `
    <div class="modal-section">
      <div class="msec-title">${t('status')}</div>
      <div class="status-selector">
        <button class="status-opt ${a.status === 'planToWatch' ? 'sel-planToWatch' : ''}" onclick="setStatus('planToWatch')">🕐 ${t('plan')}</button>
        <button class="status-opt ${a.status === 'watching' ? 'sel-watching' : ''}" onclick="setStatus('watching')">▶ ${t('watching')}</button>
        <button class="status-opt ${a.status === 'completed' ? 'sel-completed' : ''}" onclick="setStatus('completed')">✓ ${t('completed')}</button>
      </div>
    </div>`: '';

  const epSec = (inList && a.status === 'watching' && !movie) ? `
    <div class="modal-section">
      <div class="msec-title">${t('progress')}</div>
      <div class="ep-control">
        <button class="ep-btn" onclick="changeEp(-1)">−</button>
        <input class="ep-input" id="ep-val" type="number" value="${cur}" min="0" max="${a.episodes || 9999}" onchange="setEp(this.value)"/>
        <span class="ep-total">/ ${total || '?'} éps</span>
        <button class="ep-plus-btn" onclick="changeEp(1)">+1 ép</button>
      </div>
      <div class="ep-progress">
        <div class="progress-label"><span>${pct}${t('viewed_pct')}</span><span>${cur} / ${total || '?'}</span></div>
        <div class="progress-bar"><div class="progress-fill" id="modal-pfill" style="width:${pct}%"></div></div>
      </div>
    </div>`: '';

  const ratingsSec = (inList && a.status === 'completed') ? `
    <div class="modal-section">
      <div class="msec-title">${t('scores_title')} <span style="color:var(--text2);font-size:10px;font-weight:400;text-transform:none;letter-spacing:0">${t('optional')}</span></div>
      <div class="ratings-grid">
        ${SCORE_CATS.map(c => buildRatingItem(c.key, c.emoji, scoreCatLabel(c), s[c.key])).join('')}
      </div>
      ${global !== null ? `<div style="margin-top:12px;padding:10px 14px;background:var(--bg3);border-radius:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:16px">⭐</span>
        <span style="font-size:13px;color:var(--text2)">${t('global_avg')}</span>
        <strong id="global-score-val" style="margin-left:auto;color:var(--star);font-size:18px">${global}/20</strong>
      </div>`: ''}
      <div class="fav-toggle ${a.favorite ? 'is-fav' : ''}" onclick="toggleFav()" id="fav-toggle">
        <span class="fav-icon">${a.favorite ? '⭐' : '☆'}</span>
        <span>${a.favorite ? t('in_favorites') : t('add_favorites')}</span>
      </div>
    </div>`: '';

  const removeBtn = inList ? `
    <div class="modal-danger">
      <button class="btn-danger" onclick="removeAnime(${malId})">${t('delete_list')}</button>
    </div>`: '';

  $('modal-content').innerHTML = `
    <div class="modal-hero">
      <div class="modal-poster"><img src="${esc(a.image)}" alt="${esc(a.title)}"/></div>
      <div class="modal-info">
        <div class="modal-title">${esc(a.title)}</div>
        <div class="modal-meta">${typeTag}${statusTag}${ratingTag}${yearTag}${epsTag}${scoreTag}${seasonTag}</div>
        ${tagsHtml}
        ${trailerHtml}
        <p class="modal-synopsis" id="modal-synopsis">${esc(a.synopsis || t('no_synopsis'))}</p>
      </div>
    </div>
    <div class="modal-tabs">
      <button class="m-tab ${_modalTab === 'reviews' ? 'active' : ''}" onclick="switchModalTab('reviews')">${t('tab_reviews')}</button>
      <button class="m-tab ${_modalTab === 'details' ? 'active' : ''}" onclick="switchModalTab('details')">${t('tab_details')}</button>
      <button class="m-tab ${_modalTab === 'characters' ? 'active' : ''}" onclick="switchModalTab('characters')">${t('tab_characters')}</button>
      <button class="m-tab ${_modalTab === 'music' ? 'active' : ''}" onclick="switchModalTab('music')">${t('tab_music')}</button>
    </div>
    <div id="mtab-reviews" class="m-tab-content ${_modalTab === 'reviews' ? 'active' : ''}">
      <div class="char-loading"><div class="spinner-sm"></div><span>${t('loading_reviews')}</span></div>
    </div>
    <div id="mtab-details" class="m-tab-content ${_modalTab === 'details' ? 'active' : ''}">
      ${addBtn}${statusSec}${epSec}${ratingsSec}${removeBtn}
    </div>
    <div id="mtab-characters" class="m-tab-content ${_modalTab === 'characters' ? 'active' : ''}">
      <div class="char-loading"><div class="spinner-sm"></div><span>${t('loading_chars')}</span></div>
    </div>
    <div id="mtab-music" class="m-tab-content ${_modalTab === 'music' ? 'active' : ''}">
      <div class="char-loading"><div class="spinner-sm"></div><span>${t('loading_music')}</span></div>
    </div>
  `;
  // Async translate synopsis if FR
  if (a.synopsis && currentLang === 'fr') applySynopsisTranslation('modal-synopsis', malId, a.synopsis);
  // Initialize slider fills (WebKit gradient needs JS-driven CSS var)
  initSliderFills($('modal-content'));
  // If a non-default tab is active, render its content
  if (_modalTab === 'reviews') renderReviewsTab(malId);
  if (_modalTab === 'characters') renderCharactersTab(malId);
  if (_modalTab === 'music') renderMusicTab(malId);
}

// ══ MODAL TABS ════════════════════════════════════
const TAB_KEYS = ['reviews', 'details', 'characters', 'music'];
function switchModalTab(tab) {
  _modalTab = tab;
  const idx = TAB_KEYS.indexOf(tab);
  document.querySelectorAll('.m-tab').forEach((b, i) => b.classList.toggle('active', i === idx));
  $('mtab-reviews').classList.toggle('active', tab === 'reviews');
  $('mtab-details').classList.toggle('active', tab === 'details');
  $('mtab-characters').classList.toggle('active', tab === 'characters');
  $('mtab-music').classList.toggle('active', tab === 'music');
  if (tab === 'reviews' && _modal) renderReviewsTab(_modal.mal_id);
  if (tab === 'characters' && _modal) renderCharactersTab(_modal.mal_id);
  if (tab === 'music' && _modal) renderMusicTab(_modal.mal_id);
}

// ══ CHARACTERS ════════════════════════════════════
async function loadCharacters(malId) {
  if (_charCache[malId]) return _charCache[malId];
  // Check user list first
  const list = getList();
  if (list[malId]?.characters?.length) {
    _charCache[malId] = list[malId].characters;
    return _charCache[malId];
  }
  try {
    await rl();
    const r = await fetch(`${JIKAN}/anime/${malId}/characters`);
    const d = await r.json();
    const main = (d.data || [])
      .filter(c => c.role === 'Main')
      .slice(0, 8)
      .map(c => ({
        id: c.character.mal_id,
        name: c.character.name,
        image: c.character.images?.jpg?.image_url || ''
      }));
    _charCache[malId] = main;
    if (list[malId]) {
      list[malId].characters = main;
      saveList(list);
    }
    return main;
  } catch { return []; }
}

async function renderCharactersTab(malId) {
  const el = $('mtab-characters');
  if (!el) return;
  const inList = !!getList()[malId];
  el.innerHTML = `<div class="char-loading"><div class="spinner-sm"></div><span>${t('loading_chars')}</span></div>`;
  const chars = await loadCharacters(malId);
  if (!_modal || _modal.mal_id !== malId) return;
  if (!chars.length) {
    el.innerHTML = `<div class="char-empty">${t('no_chars')}</div>`;
    return;
  }
  const userList = getList();
  const charScores = userList[malId]?.characterScores || {};
  // Build then init slider fills after innerHTML set
  el.innerHTML = `<div class="characters-grid">
    ${chars.map(c => {
    const s = charScores[c.id] || {};
    const vals = CHAR_AXES.map(ax => s[ax.key]).filter(v => v !== undefined && v !== null);
    const charGlobal = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
    return `<div class="char-card" id="char-card-${c.id}">
        <div class="char-card-top">
          <img class="char-img" src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy"/>
          <div class="char-head">
            <div class="char-name">${esc(c.name)}</div>
            <div class="char-global-wrap" id="char-global-wrap-${c.id}">
              ${charGlobal !== null ? `<div class="char-global" id="char-global-${c.id}">★ ${charGlobal}/20</div>` : ''}
            </div>
          </div>
        </div>
        ${inList ? `<div class="char-axes">${CHAR_AXES.map(ax => buildCharAxis(c.id, ax, s[ax.key])).join('')}</div>` : `<div class="char-locked">${t('add_to_list')}</div>`}
      </div>`;
  }).join('')}
  </div>`;
  initSliderFills(el);
}

function buildCharAxis(charId, axis, val) {
  const label = currentLang === 'en' ? axis.labelEn : axis.labelFr;
  const v = val !== undefined && val !== null ? val : 0;
  const valDisplay = val !== undefined && val !== null ? `${v}/20` : '—/20';
  return `<div class="char-axis">
    <span class="char-axis-lbl"><span class="char-axis-emoji">${axis.emojiFr}</span>${label}</span>
    <input type="range" class="rating-slider char-slider" min="0" max="20" step="0.5" value="${v}"
           oninput="updateSliderFill(this); onCharSlide(${charId},'${axis.key}',this.value)"
           onchange="setCharScore(${charId},'${axis.key}',this.value)"/>
    <span class="char-axis-val" id="cval-${charId}-${axis.key}">${valDisplay}</span>
  </div>`;
}

function onCharSlide(charId, axisKey, val) {
  const v = parseFloat(val) || 0;
  const valEl = $(`cval-${charId}-${axisKey}`);
  if (valEl) valEl.textContent = v + '/20';
}

// ══ REVIEWS ═══════════════════════════════════════
async function loadReviews(malId) {
  if (_reviewsCache[malId]) return _reviewsCache[malId];
  try {
    await rl();
    const r = await fetch(`${JIKAN}/anime/${malId}/reviews?preliminary=true&spoilers=true&page=1`);
    const d = await r.json();
    _reviewsCache[malId] = d.data || [];
    return _reviewsCache[malId];
  } catch {
    return [];
  }
}

function _formatReviewDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(currentLang === 'en' ? 'en-US' : 'fr-FR',
      { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return ''; }
}

function _truncateReview(text, max) {
  if (!text || text.length <= max) return { short: text, needsExpand: false };
  return { short: text.slice(0, max).trimEnd() + '…', needsExpand: true };
}

function buildReviewCard(r, idx, compact) {
  const isSpoiler = !!(r.is_spoiler || (r.tags || []).some(t => /spoiler/i.test(t)));
  const isPreliminary = !!(r.is_preliminary || (r.tags || []).some(t => /preliminary/i.test(t)));
  const username = r.user?.username || 'Anonymous';
  const userUrl = r.user?.url || '#';
  const avatar = r.user?.images?.jpg?.image_url || '';
  const score = r.score || null;
  const overall = r.reactions?.overall || 0;
  const date = _formatReviewDate(r.date);
  const reviewId = `review-${idx}`;
  const maxLen = compact ? 220 : 700;
  const { short, needsExpand } = _truncateReview(r.review || '', maxLen);
  const safeShort = esc(short).replace(/\n+/g, '<br>');
  const safeFull = esc(r.review || '').replace(/\n+/g, '<br>');
  const malLink = r.url ? `<a class="review-mal-link" href="${esc(r.url)}" target="_blank" rel="noopener">${t('view_full_yt_link')}</a>` : '';

  const bodyContent = `
    <div class="review-text" id="${reviewId}-short">${safeShort}</div>
    ${needsExpand ? `<div class="review-text review-text-hidden" id="${reviewId}-full">${safeFull}</div>` : ''}
    ${needsExpand ? `<button class="review-expand-btn" type="button" onclick="toggleReviewExpand('${reviewId}')" data-state="short">${t('show_more')}</button>` : ''}
    ${malLink}
  `;

  const body = isSpoiler
    ? `<div class="review-spoiler-wrap" id="${reviewId}-spoiler">
        <button class="review-spoiler-cover" type="button" onclick="revealReview('${reviewId}')">
          <span class="spoiler-icon">⚠️</span>
          <span class="spoiler-msg">${t('click_to_reveal')}</span>
        </button>
        <div class="review-body-hidden">${bodyContent}</div>
      </div>`
    : `<div class="review-body">${bodyContent}</div>`;

  return `<div class="review-card${compact ? ' review-card-compact' : ''}">
    <div class="review-head">
      ${avatar ? `<img class="review-avatar" src="${esc(avatar)}" alt="${esc(username)}" loading="lazy"/>` : '<div class="review-avatar review-avatar-placeholder">👤</div>'}
      <div class="review-meta">
        <a class="review-user" href="${esc(userUrl)}" target="_blank" rel="noopener">${esc(username)}</a>
        <div class="review-meta-row">
          ${score ? `<span class="review-score">★ ${score}/10</span>` : ''}
          ${date ? `<span class="review-date">${date}</span>` : ''}
          ${isPreliminary ? `<span class="review-badge review-badge-prelim">${t('preliminary')}</span>` : ''}
          ${isSpoiler ? `<span class="review-badge review-badge-spoiler">${t('spoiler')}</span>` : ''}
        </div>
      </div>
      ${overall ? `<span class="review-helpful" title="${t('helpful_count')}">👍 ${overall}</span>` : ''}
    </div>
    ${body}
  </div>`;
}

function revealReview(reviewId) {
  const wrap = document.getElementById(`${reviewId}-spoiler`);
  if (!wrap) return;
  wrap.classList.add('revealed');
}

function toggleReviewExpand(reviewId) {
  const shortEl = document.getElementById(`${reviewId}-short`);
  const fullEl = document.getElementById(`${reviewId}-full`);
  const btn = document.querySelector(`button[onclick="toggleReviewExpand('${reviewId}')"]`);
  if (!shortEl || !fullEl || !btn) return;
  const state = btn.dataset.state;
  if (state === 'short') {
    shortEl.classList.add('review-text-hidden');
    fullEl.classList.remove('review-text-hidden');
    btn.textContent = t('show_less');
    btn.dataset.state = 'full';
  } else {
    shortEl.classList.remove('review-text-hidden');
    fullEl.classList.add('review-text-hidden');
    btn.textContent = t('show_more');
    btn.dataset.state = 'short';
  }
}

async function renderReviewsTab(malId) {
  const el = $('mtab-reviews');
  if (!el) return;
  el.innerHTML = `<div class="char-loading"><div class="spinner-sm"></div><span>${t('loading_reviews')}</span></div>`;
  const reviews = await loadReviews(malId);
  if (!_modal || _modal.mal_id !== malId) return;
  if (!reviews.length) {
    el.innerHTML = `<div class="char-empty">${t('no_reviews')}</div>`;
    return;
  }
  const shown = reviews.slice(0, 12);
  const countLabel = shown.length === 1 ? t('reviews_count_one') : t('reviews_count_more');
  el.innerHTML = `
    <div class="reviews-header">
      <span class="reviews-count"><strong>${shown.length}</strong> ${countLabel}</span>
    </div>
    <div class="reviews-list">${shown.map((r, i) => buildReviewCard(r, `m${i}`, false)).join('')}</div>
  `;
}

async function renderDiscoverReviewsPanel(a) {
  const el = $('discover-reviews');
  if (!el) return;
  if (!a) { el.innerHTML = `<div class="ds-empty">${t('no_reviews')}</div>`; return; }
  el.innerHTML = `<div class="ds-loading"><div class="spinner-sm"></div></div>`;
  const reviews = await loadReviews(a.mal_id);
  // Bail out if user already swiped to another card
  const currentMalId = discoverPool[discoverIndex]?.mal_id;
  if (currentMalId !== a.mal_id) return;
  if (!reviews.length) {
    el.innerHTML = `<div class="ds-empty">${t('no_reviews')}</div>`;
    return;
  }
  const top = reviews.slice(0, 2);
  el.innerHTML = top.map((r, i) => buildReviewCard(r, `d${a.mal_id}_${i}`, true)).join('');
}

// ══ MUSIC / THEMES ═══════════════════════════════
function parseTheme(raw, type, idx) {
  if (!raw) return null;
  // Format examples: '1: "Crossing Field" by LiSA (eps 1-14)'
  //                  '"Crossing Field" by LiSA'
  //                  'Crossing Field by LiSA (eps 1-14)'
  const m = String(raw).match(/^(?:(\d+):\s*)?"?([^"]+?)"?(?:\s+by\s+([^(]+?))?(?:\s*\((.+?)\))?\s*$/);
  return {
    key: `${type}_${idx}`,
    type,
    index: m?.[1] || String(idx + 1),
    title: (m?.[2] || raw).trim(),
    artist: (m?.[3] || '').trim(),
    eps: (m?.[4] || '').trim(),
    raw: String(raw),
  };
}

async function loadThemes(malId) {
  if (_themesCache[malId]) return _themesCache[malId];
  try {
    await rl();
    const r = await fetch(`${JIKAN}/anime/${malId}/themes`);
    const d = await r.json();
    const data = d.data || {};
    _themesCache[malId] = {
      openings: (data.openings || []).map((s, i) => parseTheme(s, 'op', i)).filter(Boolean),
      endings: (data.endings || []).map((s, i) => parseTheme(s, 'ed', i)).filter(Boolean),
    };
    return _themesCache[malId];
  } catch {
    return { openings: [], endings: [] };
  }
}

function ytSearchUrl(animeTitle, theme) {
  const q = `${animeTitle} ${theme.title} ${theme.artist}`.replace(/\s+/g, ' ').trim();
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

async function renderMusicTab(malId) {
  const el = $('mtab-music');
  if (!el) return;
  el.innerHTML = `<div class="char-loading"><div class="spinner-sm"></div><span>${t('loading_music')}</span></div>`;
  const themes = await loadThemes(malId);
  if (!_modal || _modal.mal_id !== malId) return;
  const total = themes.openings.length + themes.endings.length;
  if (!total) {
    el.innerHTML = `<div class="char-empty">${t('no_themes')}</div>`;
    return;
  }
  const list = getList();
  const isCompleted = list[malId]?.status === 'completed';
  const musicScores = list[malId]?.musicScores || {};
  const ratedVals = Object.values(musicScores).filter(v => v != null);
  const musicGlobal = ratedVals.length ? Math.round((ratedVals.reduce((a, b) => a + b, 0) / ratedVals.length) * 10) / 10 : null;

  const animeTitle = _modal.title || '';

  el.innerHTML = `
    <div id="music-global-wrap">${musicGlobal !== null ? `<div class="music-global">🎵 ${t('music_global')} : <strong id="music-global-val">${musicGlobal}/20</strong></div>` : ''}</div>
    ${themes.openings.length ? `<div class="music-section">
      <div class="music-section-title"><span class="ms-bullet">▶</span>${t('openings')}</div>
      <div class="music-list">${themes.openings.map(th => buildThemeRow(th, animeTitle, musicScores[th.key], isCompleted)).join('')}</div>
    </div>` : ''}
    ${themes.endings.length ? `<div class="music-section">
      <div class="music-section-title"><span class="ms-bullet">⏹</span>${t('endings')}</div>
      <div class="music-list">${themes.endings.map(th => buildThemeRow(th, animeTitle, musicScores[th.key], isCompleted)).join('')}</div>
    </div>` : ''}
  `;
  initSliderFills(el);
}

function getMusicReaction(malId, themeKey) {
  const list = getList();
  return list[malId]?.musicReactions?.[themeKey] || { reaction: null, favorite: false };
}

function buildThemeRow(th, animeTitle, val, canRate) {
  const v = val != null ? val : 0;
  const valDisplay = val != null ? `${v}/20` : '—/20';
  const malId = _modal?.mal_id;
  const r = malId ? getMusicReaction(malId, th.key) : { reaction: null, favorite: false };
  return `<div class="music-row" id="music-row-${th.key}">
    <div class="music-info">
      <div class="music-title-line">
        <span class="music-idx">#${esc(th.index)}</span>
        <span class="music-title">${esc(th.title)}</span>
      </div>
      ${th.artist ? `<div class="music-artist">${esc(th.artist)}</div>` : ''}
      ${th.eps ? `<div class="music-eps">${esc(th.eps)}</div>` : ''}
    </div>
    <a class="music-play-btn" href="${ytSearchUrl(animeTitle, th)}" target="_blank" rel="noopener" title="${t('listen_on_yt')}" aria-label="${t('listen_on_yt')}">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
    </a>
    <div class="music-reactions" id="music-react-${th.key}">
      <button class="music-react-btn ${r.reaction === 'like' ? 'active-like' : ''}" type="button" onclick="toggleMusicReaction('${th.key}','like','${esc(th.type)}')" title="${t('music_like')}" aria-label="${t('music_like')}">👍</button>
      <button class="music-react-btn ${r.reaction === 'dislike' ? 'active-dislike' : ''}" type="button" onclick="toggleMusicReaction('${th.key}','dislike','${esc(th.type)}')" title="${t('music_dislike')}" aria-label="${t('music_dislike')}">👎</button>
      <button class="music-react-btn ${r.favorite ? 'active-fav' : ''}" type="button" onclick="toggleMusicFavorite('${th.key}','${esc(th.type)}')" title="${t('music_favorite')}" aria-label="${t('music_favorite')}">⭐</button>
    </div>
    ${canRate ? `<div class="music-rating-row">
      <input type="range" class="rating-slider music-slider" min="0" max="20" step="0.5" value="${v}"
             oninput="updateSliderFill(this); onMusicSlide('${th.key}', this.value)"
             onchange="setMusicScore('${th.key}', this.value)"/>
      <span class="music-val" id="mval-${th.key}">${valDisplay}</span>
    </div>` : ''}
  </div>`;
}

function _findThemeMeta(malId, themeKey) {
  const themes = _themesCache[malId];
  if (!themes) return null;
  return [...(themes.openings || []), ...(themes.endings || [])].find(t => t.key === themeKey) || null;
}

function _ensureReactionEntry(malId, themeKey) {
  const list = getList();
  if (!list[malId]) return null;
  if (!list[malId].musicReactions) list[malId].musicReactions = {};
  if (!list[malId].musicReactions[themeKey]) {
    list[malId].musicReactions[themeKey] = { reaction: null, favorite: false };
  }
  // Snapshot metadata so Top 10 picker can render without re-fetching themes
  const th = _findThemeMeta(malId, themeKey);
  if (th) {
    const e = list[malId].musicReactions[themeKey];
    e.title = th.title;
    e.artist = th.artist;
    e.eps = th.eps;
    e.type = th.type;
    e.index = th.index;
  }
  return list;
}

function toggleMusicReaction(themeKey, kind /* 'like'|'dislike' */, themeType) {
  const malId = _modal?.mal_id;
  if (!malId) return;
  const list = _ensureReactionEntry(malId, themeKey);
  if (!list) return;
  const entry = list[malId].musicReactions[themeKey];
  entry.reaction = entry.reaction === kind ? null : kind;
  saveList(list);
  const wrap = document.getElementById(`music-react-${themeKey}`);
  if (wrap) {
    const btns = wrap.querySelectorAll('.music-react-btn');
    btns[0]?.classList.toggle('active-like', entry.reaction === 'like');
    btns[1]?.classList.toggle('active-dislike', entry.reaction === 'dislike');
  }
}

function toggleMusicFavorite(themeKey, themeType) {
  const malId = _modal?.mal_id;
  if (!malId) return;
  const list = _ensureReactionEntry(malId, themeKey);
  if (!list) return;
  const entry = list[malId].musicReactions[themeKey];
  entry.favorite = !entry.favorite;
  saveList(list);
  const wrap = document.getElementById(`music-react-${themeKey}`);
  const favBtn = wrap?.querySelectorAll('.music-react-btn')[2];
  if (favBtn) favBtn.classList.toggle('active-fav', entry.favorite);
  if (entry.favorite) showToast(`⭐ ${t('music_favorite')}`);
}

function onMusicSlide(key, val) {
  const v = parseFloat(val) || 0;
  const el = $(`mval-${key}`);
  if (el) el.textContent = v + '/20';
}

function setMusicScore(key, val) {
  const malId = _modal?.mal_id;
  if (!malId) return;
  const list = getList();
  if (!list[malId]) return;
  if (!list[malId].musicScores) list[malId].musicScores = {};
  let score = Math.max(0, Math.min(20, parseFloat(val) || 0));
  score = Math.round(score * 2) / 2;
  list[malId].musicScores[key] = score;
  saveList(list);
  const el = $(`mval-${key}`);
  if (el) el.textContent = score + '/20';
  // recompute and update global music score
  const ratedVals = Object.values(list[malId].musicScores).filter(v => v != null);
  const musicGlobal = ratedVals.length ? Math.round((ratedVals.reduce((a, b) => a + b, 0) / ratedVals.length) * 10) / 10 : null;
  const wrap = $('music-global-wrap');
  if (wrap) {
    if (musicGlobal !== null) {
      const valEl = $('music-global-val');
      if (valEl) valEl.textContent = `${musicGlobal}/20`;
      else wrap.innerHTML = `<div class="music-global">🎵 ${t('music_global')} : <strong id="music-global-val">${musicGlobal}/20</strong></div>`;
    }
  }
}

function setCharScore(charId, axisKey, val) {
  const malId = _modal?.mal_id;
  if (!malId) return;
  const list = getList();
  if (!list[malId]) return;
  if (!list[malId].characterScores) list[malId].characterScores = {};
  if (!list[malId].characterScores[charId]) list[malId].characterScores[charId] = {};
  let score = Math.max(0, Math.min(20, parseFloat(val) || 0));
  score = Math.round(score * 2) / 2;
  list[malId].characterScores[charId][axisKey] = score;
  saveList(list);
  const valEl = $(`cval-${charId}-${axisKey}`);
  if (valEl) valEl.textContent = score + '/20';
  // recompute char global
  const s = list[malId].characterScores[charId];
  const vals = CHAR_AXES.map(ax => s[ax.key]).filter(v => v !== undefined && v !== null);
  const charGlobal = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  const wrap = $(`char-global-wrap-${charId}`);
  if (wrap && charGlobal !== null) {
    let pill = $(`char-global-${charId}`);
    if (!pill) {
      wrap.innerHTML = `<div class="char-global" id="char-global-${charId}">★ ${charGlobal}/20</div>`;
    } else {
      pill.textContent = `★ ${charGlobal}/20`;
    }
  }
}

function toggleTagsExpand(tags) {
  const listEl = $('modal-tags-list');
  const btn = $('tags-toggle-btn');
  if (!listEl || !btn) return;
  const expanded = btn.dataset.expanded === 'true';
  if (!expanded) {
    listEl.innerHTML = tags.map(g => `<span class="modal-tag">${esc(g)}</span>`).join('');
    btn.textContent = t('hide_tags');
    btn.dataset.expanded = 'true';
  } else {
    listEl.innerHTML = tags.slice(0, 5).map(g => `<span class="modal-tag">${esc(g)}</span>`).join('');
    btn.textContent = `${t('see_all_tags')} (${tags.length})`;
    btn.dataset.expanded = 'false';
  }
}

function buildRatingItem(key, emoji, label, val) {
  const v = val !== undefined && val !== null ? val : 0;
  return `<div class="rating-item">
    <div class="rating-item-label"><span class="ri-emoji">${emoji}</span>${label}</div>
    <div class="rating-slider-row">
      <input type="range" class="rating-slider" min="0" max="20" step="0.5" value="${v}"
             oninput="updateSliderFill(this); onRatingSlide('${key}', this.value)"
             onchange="setScore('${key}', this.value)"/>
      <span class="rating-val" id="rval-${key}">${val !== undefined && val !== null ? `<strong>${v}</strong>/20` : `<span style="color:var(--text2)">—/20</span>`}</span>
    </div>
  </div>`;
}

// Set slider fill percentage via CSS variable (WebKit doesn't support ::-webkit-slider-progress)
function updateSliderFill(input) {
  if (!input) return;
  const min = parseFloat(input.min) || 0;
  const max = parseFloat(input.max) || 100;
  const val = parseFloat(input.value) || 0;
  const pct = max === min ? 0 : ((val - min) / (max - min)) * 100;
  input.style.setProperty('--rng-pct', pct + '%');
}

function initSliderFills(scope) {
  (scope || document).querySelectorAll('input[type=range].rating-slider').forEach(updateSliderFill);
}

// Live update during drag (no save)
function onRatingSlide(key, val) {
  const v = parseFloat(val) || 0;
  const rvalEl = $(`rval-${key}`);
  if (rvalEl) rvalEl.innerHTML = `<strong>${v}</strong>/20`;
  // Live global preview
  if (!_modal) return;
  const previewScores = { ..._modal.scores, [key]: v };
  const g = computeGlobal(previewScores);
  const el = $('global-score-val');
  if (el && g !== null) el.textContent = g + '/20';
}

// ══ MODAL ACTIONS ══════════════════════════════════
function addToList(status) {
  const list = getList(); const a = _modal;
  list[a.mal_id] = { ...a, status, currentEp: 0, scores: {}, favorite: false, addedAt: Date.now() };
  saveList(list); updateCounts();
  _modal = { ...list[a.mal_id] };
  showToast(`${t('added_to')}"${statusLbl(status)}"`);
  renderModal(a.mal_id);
  if (currentView === 'list') renderListView();
  refreshSearchCards();
  if (status === 'completed') checkBadgeUnlock();
}

function setStatus(status) {
  const list = getList(), id = _modal.mal_id; if (!list[id]) return;
  const wasCompleted = list[id].status === 'completed';
  list[id].status = status;
  if (status === 'completed' && list[id].episodes) list[id].currentEp = list[id].episodes;
  saveList(list); updateCounts();
  _modal = { ..._modal, status, currentEp: list[id].currentEp };
  renderModal(id);
  if (currentView === 'list') renderListView();
  if (currentView === 'favorites') renderFavorites();
  showToast(`${t('status')}: ${statusLbl(status)}`);
  if (status === 'completed' && !wasCompleted) checkBadgeUnlock();
}

function changeEp(d) {
  const inp = $('ep-val'); if (!inp) return;
  const max = _modal.episodes || Infinity;
  inp.value = Math.max(0, Math.min(max, (parseInt(inp.value) || 0) + d));
  setEp(inp.value);
}
function setEp(v) {
  const list = getList(), id = _modal.mal_id; if (!list[id]) return;
  const ep = Math.max(0, Math.min(list[id].episodes || Infinity, parseInt(v) || 0));
  list[id].currentEp = ep; _modal.currentEp = ep; saveList(list);
  const total = list[id].episodes, pct = total ? Math.round((ep / total) * 100) : 0;
  const fill = $('modal-pfill'); if (fill) fill.style.width = pct + '%';
  const lbl = document.querySelector('.ep-progress .progress-label');
  if (lbl) { lbl.children[0].textContent = `${pct}${t('viewed_pct')}`; lbl.children[1].textContent = `${ep} / ${total || '?'}`; }
  const inp = $('ep-val'); if (inp) inp.value = ep;
  if (currentView === 'list') renderListView();
}

function setScore(key, val) {
  const list = getList(), id = _modal.mal_id; if (!list[id]) return;
  if (!list[id].scores) list[id].scores = {};
  // Round to nearest 0.5 for clean display
  let score = Math.max(0, Math.min(20, parseFloat(val) || 0));
  score = Math.round(score * 2) / 2;
  list[id].scores[key] = score;
  if (!_modal.scores) _modal.scores = {};
  _modal.scores[key] = score;
  saveList(list);
  const rvalEl = $(`rval-${key}`);
  if (rvalEl) rvalEl.innerHTML = `<strong>${score}</strong>/20`;
  const global = computeGlobal(_modal.scores);
  if (global !== null) {
    let el = $('global-score-val');
    if (!el) {
      const rg = document.querySelector('.ratings-grid');
      if (rg) {
        const div = document.createElement('div');
        div.className = 'global-score-display';
        div.innerHTML = `<span style="font-size:16px">⭐</span><span style="font-size:13px;color:var(--text2)">${t('global_avg')}</span><strong id="global-score-val" style="margin-left:auto;color:var(--star);font-size:18px">${global}/20</strong>`;
        rg.after(div);
      }
    } else { el.textContent = global + '/20'; }
  }
  if (currentView === 'list') renderListView();
  if (currentView === 'favorites') renderFavorites();
  if (currentView === 'top10') renderTop10();
}

function toggleFav() {
  const list = getList(), id = _modal.mal_id; if (!list[id]) return;
  list[id].favorite = !list[id].favorite; _modal.favorite = list[id].favorite; saveList(list);
  const toggle = $('fav-toggle');
  if (toggle) {
    toggle.classList.toggle('is-fav', list[id].favorite);
    toggle.innerHTML = `<span class="fav-icon">${list[id].favorite ? '⭐' : '☆'}</span><span>${list[id].favorite ? t('in_favorites') : t('add_favorites')}</span>`;
  }
  showToast(list[id].favorite ? t('added_fav') : t('removed_fav'));
  if (currentView === 'list') renderListView();
  if (currentView === 'favorites') renderFavorites();
}

function removeAnime(malId) {
  const list = getList(), title = list[malId]?.title || '';
  delete list[malId];
  const t10 = getTop10(); t10.series = t10.series.filter(i => i != malId); t10.movies = t10.movies.filter(i => i != malId); saveTop10(t10);
  saveList(list); closeModal(); updateCounts();
  if (currentView === 'list') renderListView();
  if (currentView === 'favorites') renderFavorites();
  if (currentView === 'top10') renderTop10();
  refreshSearchCards();
  showToast(`"${title}" ${t('deleted')}`);
}

function closeModal() { $('modal-overlay').classList.add('hidden'); _modal = null; }
function closeModalOutside(e) { if (e.target === $('modal-overlay')) closeModal(); }

// ══ PROFILE ═══════════════════════════════════════
function openProfile() { renderProfile(); $('profile-overlay').classList.remove('hidden'); }
function closeProfile() { $('profile-overlay').classList.add('hidden'); }
function closeProfileOutside(e) { if (e.target === $('profile-overlay')) closeProfile(); }

// ── AVATAR PICKER ──
async function openAvatarPicker() {
  const overlay = $('avatar-picker-overlay');
  const grid = $('avatar-picker-grid');
  if (!overlay || !grid) return;
  overlay.classList.remove('hidden');
  const list = getList();
  const favorited = Object.entries(list).filter(([_, a]) => a && a.favorite);
  if (!favorited.length) {
    grid.innerHTML = `<div class="char-empty">${t('no_fav_for_avatar')}</div>`;
    return;
  }
  grid.innerHTML = `<div class="char-loading"><div class="spinner-sm"></div><span>${t('avatar_loading_chars')}</span></div>`;
  // Lazy fetch characters for each favorited anime (rate-limited via rl())
  const allChars = [];
  for (const [malId, anime] of favorited) {
    let chars = anime.characters;
    if (!chars || !chars.length) {
      try { chars = await loadCharacters(Number(malId)); } catch { chars = []; }
    }
    (chars || []).forEach(c => {
      if (c.image) {
        allChars.push({
          id: c.id,
          name: c.name,
          image: c.image,
          animeTitle: anime.title || '',
          malId: Number(malId),
        });
      }
    });
  }
  if (!allChars.length) {
    grid.innerHTML = `<div class="char-empty">${t('no_chars_for_avatar')}</div>`;
    return;
  }
  grid.innerHTML = allChars.map(c => `
    <button class="ap-item" type="button" onclick="setProfilePic('${esc(c.image)}','${esc(c.name)}')">
      <img class="ap-img" src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy"/>
      <div class="ap-name">${esc(c.name)}</div>
      <div class="ap-anime">${esc(c.animeTitle)}</div>
    </button>
  `).join('');
}

function closeAvatarPicker() { $('avatar-picker-overlay')?.classList.add('hidden'); }
function closeAvatarPickerOutside(e) { if (e.target === $('avatar-picker-overlay')) closeAvatarPicker(); }

function setProfilePic(url, name) {
  if (!currentUser) return;
  const data = getUserData(currentUser);
  data.profilePic = url;
  saveUserData(currentUser, data);
  renderUserAvatar();
  renderProfile();
  closeAvatarPicker();
  showToast(`✓ ${t('avatar_set')}`);
}

function clearProfilePic() {
  if (!currentUser) return;
  const data = getUserData(currentUser);
  delete data.profilePic;
  saveUserData(currentUser, data);
  renderUserAvatar();
  renderProfile();
  closeAvatarPicker();
}

// ══ QUIZ ═════════════════════════════════════════
let _quizState = null;
let _quizDifficulty = 1; // 1 = Facile, 2 = Moyen, 3 = Difficile

function getQuizQuestions(malId, level) {
  if (level === 1) return QUIZ_BANK[malId]?.questions || [];
  return QUIZ_BANK_EXTRA[malId]?.[level] || [];
}

function setQuizDifficulty(level) {
  _quizDifficulty = Number(level) || 1;
  renderQuizView();
}
// _quizState shape:
// { malId, title, image, questions:[Q,...], idx:0, score:0, answers:[{picked, correct}], lockUntilNext:false }

function _shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getAvailableQuizzes() {
  const list = getList();
  const data = currentUser ? getUserData(currentUser) : {};
  const scores = data.quizScores || {};
  const out = [];
  for (const malId in QUIZ_BANK) {
    const meta = QUIZ_BANK[malId];
    const fav = !!list[malId]?.favorite;
    out.push({
      malId: Number(malId),
      title: meta.title,
      image: meta.image,
      unlocked: fav,
      counts: {
        1: getQuizQuestions(malId, 1).length,
        2: getQuizQuestions(malId, 2).length,
        3: getQuizQuestions(malId, 3).length,
      },
      scores: {
        1: scores[malId]?.[1] || null,
        2: scores[malId]?.[2] || null,
        3: scores[malId]?.[3] || null,
      },
    });
  }
  // Show unlocked first, then locked
  out.sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0));
  return out;
}

function renderQuizView() {
  const el = $('view-quizz');
  if (!el) return;

  if (_quizState && _quizState.idx < _quizState.questions.length) {
    return renderQuizQuestion();
  }
  if (_quizState && _quizState.idx >= _quizState.questions.length) {
    return renderQuizResults();
  }

  const quizzes = getAvailableQuizzes();
  const lvl = _quizDifficulty;
  el.innerHTML = `
    <div class="view-header">
      <h1 class="view-title">${t('quiz_title')}</h1>
      <p class="view-subtitle">${t('quiz_sub')}</p>
    </div>
    <div class="quiz-difficulty-bar">
      <span class="qd-label">${t('quiz_difficulty')}</span>
      <button type="button" class="qd-btn qd-1 ${lvl===1?'active':''}" onclick="setQuizDifficulty(1)">${t('quiz_diff_1')}</button>
      <button type="button" class="qd-btn qd-2 ${lvl===2?'active':''}" onclick="setQuizDifficulty(2)">${t('quiz_diff_2')}</button>
      <button type="button" class="qd-btn qd-3 ${lvl===3?'active':''}" onclick="setQuizDifficulty(3)">${t('quiz_diff_3')}</button>
    </div>
    ${quizzes.length === 0 ? `
      <div class="quiz-empty"><div class="empty-icon">🎓</div><p>${t('quiz_no_fav')}</p></div>
    ` : `
      <div class="quiz-section-title">${t('quiz_select')}</div>
      <div class="quiz-grid quiz-grid-lvl-${lvl}">
        ${quizzes.map(q => {
          const count = q.counts[lvl] || 0;
          const noQuestions = count === 0;
          const locked = !q.unlocked;
          const scoreEntry = q.scores[lvl];
          const pct = scoreEntry && scoreEntry.total ? Math.round((scoreEntry.best / scoreEntry.total) * 100) : null;
          const completed = scoreEntry?.completed === true;
          const disabled = locked || noQuestions;
          // Build status block: locked / completed / best score with bar / no record
          let statusBlock = '';
          if (locked) {
            statusBlock = `<div class="quiz-card-locked">${t('quiz_locked')}</div>`;
          } else if (completed) {
            statusBlock = `<div class="quiz-card-completed">${t('quiz_completed')}</div>`;
          } else if (pct !== null) {
            statusBlock = `<div class="quiz-card-score-row">
              <div class="quiz-card-score-bar"><div class="quiz-card-score-fill" style="width:${pct}%"></div></div>
              <span class="quiz-card-score-pct">${pct}%</span>
            </div>`;
          }
          return `<button class="quiz-card halo-${lvl} ${disabled?'quiz-card-disabled':''} ${locked?'quiz-card-locked-card':''} ${completed?'quiz-card-complete':''}" type="button" ${disabled?'disabled':`onclick="startQuiz(${q.malId})"`}>
            <img class="quiz-card-img" src="${esc(q.image)}" alt="${esc(q.title)}" loading="lazy"/>
            <div class="quiz-card-body">
              <div class="quiz-card-title">${esc(q.title)}</div>
              <div class="quiz-card-meta">${count} ${t('quiz_q_count')}</div>
              ${statusBlock}
              ${locked ? '' : (noQuestions
                ? `<span class="quiz-card-go quiz-card-na">${t('quiz_no_questions')}</span>`
                : `<span class="quiz-card-go">▶ ${t('quiz_start')}</span>`)}
            </div>
          </button>`;
        }).join('')}
      </div>
    `}
  `;
}

function startQuiz(malId) {
  const meta = QUIZ_BANK[malId];
  if (!meta) return;
  const level = _quizDifficulty;
  const sourcePool = getQuizQuestions(malId, level);
  if (!sourcePool.length) return;
  const pool = _shuffle(sourcePool).slice(0, Math.min(10, sourcePool.length));
  // Shuffle choices per question while preserving the correct answer
  const questions = pool.map(q => {
    const indices = [0, 1, 2, 3];
    const shuffledIdx = _shuffle(indices);
    const newChoices = shuffledIdx.map(i => q.c[i]);
    const newAns = shuffledIdx.indexOf(q.ans);
    return { ...q, c: newChoices, ans: newAns };
  });
  _quizState = {
    malId,
    level,
    title: meta.title,
    image: meta.image,
    questions,
    idx: 0,
    score: 0,
    answers: [],
    lockUntilNext: false,
  };
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const el = $('view-quizz');
  if (!el || !_quizState) return;
  const s = _quizState;
  const q = s.questions[s.idx];
  const total = s.questions.length;
  const pct = Math.round(((s.idx) / total) * 100);
  const questionText = currentLang === 'en' ? q.qe : q.q;
  const last = s.lockUntilNext ? s.answers[s.answers.length - 1] : null;
  const showFeedback = !!last;

  const choicesHtml = q.c.map((choice, i) => {
    let cls = 'quiz-choice';
    let icon = '';
    if (showFeedback) {
      if (i === q.ans) { cls += ' quiz-choice-correct'; icon = '✓'; }
      else if (i === last.picked) { cls += ' quiz-choice-wrong'; icon = '✗'; }
      else { cls += ' quiz-choice-disabled'; }
    }
    return `<button class="${cls}" type="button" ${showFeedback ? 'disabled' : `onclick="pickQuizAnswer(${i})"`}>
      <span class="quiz-choice-letter">${String.fromCharCode(65 + i)}</span>
      <span class="quiz-choice-text">${esc(choice)}</span>
      ${icon ? `<span class="quiz-choice-icon">${icon}</span>` : ''}
    </button>`;
  }).join('');

  const lore = currentLang === 'en' ? q.le : q.l;
  const isLast = s.idx === total - 1;

  const diffLabel = t('quiz_diff_' + (s.level || 1));
  el.innerHTML = `
    <div class="view-header">
      <h1 class="view-title">${t('quiz_title')} — ${esc(s.title)}</h1>
      <p class="view-subtitle"><span class="qd-pill qd-pill-${s.level||1}">${diffLabel}</span></p>
    </div>
    <div class="quiz-runner">
      <div class="quiz-runner-head">
        <span class="quiz-q-num">${t('quiz_question')} <strong>${s.idx + 1}/${total}</strong></span>
        <span class="quiz-runner-score">${t('quiz_score')} : <strong>${s.score}</strong></span>
      </div>
      <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
      <div class="quiz-question-text">${esc(questionText)}</div>
      <div class="quiz-choices">${choicesHtml}</div>
      ${showFeedback ? `
        <div class="quiz-feedback ${last.correct ? 'fb-ok' : 'fb-ko'}">
          <div class="quiz-feedback-head">${last.correct ? '✓ ' + t('quiz_correct') : '✗ ' + t('quiz_wrong')}</div>
          <div class="quiz-feedback-lore"><strong>${t('quiz_lore')}</strong> ${esc(lore)}</div>
        </div>
        <button class="quiz-next-btn" type="button" onclick="nextQuizQuestion()">
          ${isLast ? t('quiz_finish') : t('quiz_next')} →
        </button>
      ` : ''}
    </div>
  `;
}

function pickQuizAnswer(idx) {
  if (!_quizState || _quizState.lockUntilNext) return;
  const s = _quizState;
  const q = s.questions[s.idx];
  const correct = idx === q.ans;
  s.answers.push({ qIdx: s.idx, picked: idx, correct });
  if (correct) s.score++;
  s.lockUntilNext = true;
  renderQuizQuestion();
}

function nextQuizQuestion() {
  if (!_quizState) return;
  _quizState.idx++;
  _quizState.lockUntilNext = false;
  if (_quizState.idx >= _quizState.questions.length) {
    finishQuiz();
  } else {
    renderQuizQuestion();
  }
}

function finishQuiz() {
  if (!_quizState || !currentUser) return;
  const s = _quizState;
  const total = s.questions.length;
  const data = getUserData(currentUser);
  if (!data.quizFirst) data.quizFirst = true;
  if (s.score === total) data.perfectQuizCount = (data.perfectQuizCount || 0) + 1;
  if (s.score === 0)     data.quizZero = true;
  // Persist best score per (malId, level). Only write if this run is better
  // than the stored record OR if no record exists yet.
  if (!data.quizScores) data.quizScores = {};
  if (!data.quizScores[s.malId]) data.quizScores[s.malId] = {};
  const cur = data.quizScores[s.malId][s.level];
  const newPct = total ? (s.score / total) : 0;
  const curPct = (cur && cur.total) ? (cur.best / cur.total) : -1;
  if (!cur || newPct > curPct) {
    data.quizScores[s.malId][s.level] = {
      best: s.score,
      total,
      completed: s.score === total,
      lastAt: Date.now(),
    };
  } else if (s.score === total && cur && !cur.completed) {
    // Edge case: same percentage but new run is a perfect — mark completed
    cur.completed = true;
  }
  saveUserData(currentUser, data);
  renderQuizResults();
}

function renderQuizResults() {
  const el = $('view-quizz');
  if (!el || !_quizState) return;
  const s = _quizState;
  const total = s.questions.length;
  const wrong = s.answers.filter(a => !a.correct);
  const isPerfect = s.score === total;
  const isZero = s.score === 0;
  const headlineMsg = isPerfect ? t('quiz_perfect_msg') : (isZero ? t('quiz_zero_msg') : '');

  el.innerHTML = `
    <div class="view-header">
      <h1 class="view-title">${t('quiz_complete')}</h1>
    </div>
    <div class="quiz-result-card ${isPerfect ? 'qr-perfect' : ''} ${isZero ? 'qr-zero' : ''}">
      <div class="qr-emoji">${isPerfect ? '🎉' : (isZero ? '💀' : (s.score >= total / 2 ? '🎯' : '😅'))}</div>
      <div class="qr-score">${s.score}<span class="qr-total">/${total}</span></div>
      <div class="qr-label">${t('quiz_your_score')}</div>
      ${headlineMsg ? `<div class="qr-headline">${headlineMsg}</div>` : ''}
      <div class="qr-actions">
        <button class="qr-btn qr-btn-retry" type="button" onclick="retryCurrentQuiz()">↻ ${t('quiz_retry')}</button>
        <button class="qr-btn qr-btn-back"  type="button" onclick="exitQuiz()">← ${t('quiz_back')}</button>
      </div>
    </div>
    ${wrong.length ? `
      <div class="quiz-section-title">${t('quiz_review')}</div>
      <div class="quiz-wrong-list">
        ${wrong.map(w => {
          const q = s.questions[w.qIdx];
          const qText = currentLang === 'en' ? q.qe : q.q;
          const lore = currentLang === 'en' ? q.le : q.l;
          return `<div class="quiz-wrong-item">
            <div class="qw-q">${esc(qText)}</div>
            <div class="qw-row qw-picked"><span class="qw-tag tag-bad">${t('quiz_you_picked')}</span><span>${esc(q.c[w.picked])}</span></div>
            <div class="qw-row qw-correct"><span class="qw-tag tag-ok">${t('quiz_correct_was')}</span><span>${esc(q.c[q.ans])}</span></div>
            <div class="qw-lore"><strong>${t('quiz_lore')}</strong> ${esc(lore)}</div>
          </div>`;
        }).join('')}
      </div>
    ` : ''}
  `;
}

function retryCurrentQuiz() {
  if (!_quizState) return;
  startQuiz(_quizState.malId);
}

function exitQuiz() {
  _quizState = null;
  renderQuizView();
}

function renderAchievements() {
  const arr = Object.values(getList());
  const completed = arr.filter(a => a.status === 'completed').length;
  const badge = getUserBadge(completed);
  const nextBadge = BADGES.find(b => b.min > completed);
  const progressPct = nextBadge
    ? Math.min(100, Math.round(((completed - badge.min) / (nextBadge.min - badge.min)) * 100))
    : 100;
  const progressLabel = nextBadge
    ? `${completed}/${nextBadge.min} → ${badgeLabel(nextBadge)}`
    : (currentLang === 'fr' ? 'Niveau maximum atteint !' : 'Max tier reached!');

  // Card builder used by both visible and hidden sections
  const buildCard = (ach) => {
    const r = checkAchievement(ach);
    const desc = currentLang === 'en' ? ach.descEn : ach.descFr;
    const pct = r.target ? Math.round((r.progress / r.target) * 100) : 0;
    // Hidden + still locked → show the obscured "?" placeholder
    if (ach.hidden && !r.unlocked) {
      return `<div class="ach-card ach-locked ach-hidden-card" style="--ach-color:${ach.color}">
        <div class="ach-icon">❓</div>
        <div class="ach-body">
          <div class="ach-title-row">
            <span class="ach-title">${t('hidden_ach')}</span>
            <span class="ach-state">${t('locked')}</span>
          </div>
          <div class="ach-desc ach-mystery">${t('hidden_ach_hint')}</div>
        </div>
      </div>`;
    }
    return `<div class="ach-card ${r.unlocked ? 'ach-unlocked' : 'ach-locked'} ${ach.hidden ? 'ach-hidden-revealed' : ''}" style="--ach-color:${ach.color}">
      <div class="ach-icon">${ach.emoji}</div>
      <div class="ach-body">
        <div class="ach-title-row">
          <span class="ach-title">${esc(achLabel(ach))}</span>
          <span class="ach-state">${r.unlocked ? '✓ ' + t('unlocked') : t('locked')}</span>
        </div>
        <div class="ach-desc">${esc(desc)}</div>
        ${r.target > 1 ? `<div class="ach-progress">
          <div class="ach-progress-bar"><div class="ach-progress-fill" style="width:${pct}%"></div></div>
          <span class="ach-progress-val">${r.progress}/${r.target}</span>
        </div>` : ''}
      </div>
    </div>`;
  };

  const visibleAchs = ACHIEVEMENTS.filter(a => !a.hidden);
  const hiddenAchs  = ACHIEVEMENTS.filter(a =>  a.hidden);
  const visibleCards = visibleAchs.map(buildCard).join('');
  const hiddenCards  = hiddenAchs.map(buildCard).join('');
  const hiddenUnlockedCount = hiddenAchs.filter(a => checkAchievement(a).unlocked).length;

  // Count anime that still have incomplete metadata to nudge resync
  const needSync = Object.values(getList()).filter(_animeNeedsResync).length;

  $('view-achievements').innerHTML = `
    <div class="view-header">
      <h1 class="view-title">${t('achievements_title')}</h1>
      <p class="view-subtitle">${t('achievements_sub')}</p>
    </div>
    <div class="sync-banner ${needSync ? 'sync-banner-warn' : ''}">
      <div class="sync-banner-text">${t('sync_hint')}${needSync ? ` (${needSync})` : ''}</div>
      <button class="sync-banner-btn" type="button" onclick="syncAllMetadata()">${t('sync_btn')}</button>
    </div>
    <div class="ach-hero" style="--badge-color:${badge.color}">
      <div class="ach-hero-emoji">${badge.emoji}</div>
      <div class="ach-hero-info">
        <div class="ach-hero-label">${t('your_tier')}</div>
        <div class="ach-hero-name">${badgeLabel(badge)}</div>
        <div class="ach-hero-completed">${completed} ${t('total_completed')}</div>
        <div class="ach-hero-progress-wrap">
          <div class="ach-hero-progress-bar"><div class="ach-hero-progress-fill" style="width:${progressPct}%;background:${nextBadge ? `linear-gradient(90deg,${badge.color},${nextBadge.color})` : badge.color}"></div></div>
          <div class="ach-hero-progress-meta">${progressLabel}</div>
        </div>
      </div>
    </div>
    ${visibleAchs.length ? `
      <div class="ach-section-title">${t('special_achievements')}</div>
      <div class="ach-grid">${visibleCards}</div>
    ` : ''}
    ${hiddenAchs.length ? `
      <div class="ach-section-title ach-section-hidden">
        ${t('hidden_achievements_section')}
        <span class="ach-section-counter">${hiddenUnlockedCount}/${hiddenAchs.length}</span>
      </div>
      <div class="ach-grid">${hiddenCards}</div>
    ` : ''}
  `;
}

function renderProfile() {
  const list = getList(), arr = Object.values(list);
  const total = arr.length, watching = arr.filter(a => a.status === 'watching').length;
  const completed = arr.filter(a => a.status === 'completed').length;
  const planToWatch = arr.filter(a => a.status === 'planToWatch').length;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;
  const genreCount = {};
  arr.forEach(a => (a.genres || []).forEach(g => { genreCount[g] = (genreCount[g] || 0) + 1; }));
  const sortedGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxG = sortedGenres[0]?.[1] || 1;
  const joined = getUserData(currentUser).joinedAt;
  const joinedStr = joined ? new Date(joined).toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' }) : '';
  const favGenre = sortedGenres[0]?.[0];
  const userData = getUserData(currentUser);
  const display = userData.pseudo || currentUser;
  const ini = display.slice(0, 2).toUpperCase();
  const profilePic = userData.profilePic || '';
  const genreChart = sortedGenres.length ? `
    <div class="profile-section">
      <div class="profile-section-title">${t('fav_genre')}</div>
      <div class="genre-chart">
        ${sortedGenres.map(([g, c]) => `
          <div class="genre-bar-row">
            <span class="genre-bar-name">${esc(g)}</span>
            <div class="genre-bar-track"><div class="genre-bar-fill" style="width:${Math.round((c / maxG) * 100)}%"></div></div>
            <span class="genre-bar-count">${c}</span>
          </div>`).join('')}
      </div>
    </div>`: '';

  // Top 3 series podium (from Top 10 series)
  const topSeriesIds = (getTop10().series || []).map(Number).filter(id => list[id] && list[id].status === 'completed' && !isMovie(list[id])).slice(0, 3);
  const podiumOrder = [1, 0, 2]; // visually arrange as silver-gold-bronze (2nd, 1st, 3rd)
  const podiumHtml = topSeriesIds.length ? `
    <div class="profile-section">
      <div class="profile-section-title">🏆 ${t('podium_title')}</div>
      <div class="podium-row">
        ${podiumOrder.map(rank => {
    if (rank >= topSeriesIds.length) return '<div class="podium-slot podium-empty"></div>';
    const a = list[topSeriesIds[rank]];
    const rankClass = rank === 0 ? 'podium-1' : rank === 1 ? 'podium-2' : 'podium-3';
    const rankNum = rank + 1;
    return `<div class="podium-slot ${rankClass}" onclick="openModal(${a.mal_id},'profile')">
            <div class="podium-rank-num">${rankNum}</div>
            <img class="podium-img" src="${esc(a.image)}" alt="${esc(a.title)}" loading="lazy"/>
            <div class="podium-name">${esc(a.title)}</div>
          </div>`;
  }).join('')}
      </div>
    </div>` : `
    <div class="profile-section">
      <div class="profile-section-title">🏆 ${t('podium_title')}</div>
      <div class="podium-empty-msg">${t('no_top_yet')}</div>
    </div>`;
  // Badge progression
  const badge = getUserBadge(completed);
  const nextBadge = BADGES.find(b => b.min > completed);
  const progressPct = nextBadge
    ? Math.min(100, Math.round(((completed - badge.min) / (nextBadge.min - badge.min)) * 100))
    : 100;
  const progressLabel = nextBadge
    ? `${completed}/${nextBadge.min} → ${badgeLabel(nextBadge)}`
    : (currentLang === 'fr' ? 'Niveau maximum atteint !' : 'Max level reached!');

  $('profile-content').innerHTML = `
    <div class="profile-hero">
      <button class="profile-avatar-big ${profilePic ? 'has-pic' : ''}" type="button" onclick="openAvatarPicker()" title="${t('avatar_change')}" style="${profilePic ? `background-image:url('${esc(profilePic)}')` : ''}">${profilePic ? '' : esc(ini)}<span class="avatar-edit-hint">✎</span></button>
      <div class="profile-hero-info">
        <div class="profile-name">${esc(display)}</div>
        <div class="profile-handle">@${esc(currentUser)}</div>
        <div class="profile-joined">${joinedStr ? `${t('member_since')} ${joinedStr}` : ''}${favGenre ? ` · ❤️ ${favGenre}` : ''}</div>
        <div class="profile-badge" style="--badge-color:${badge.color}">
          <span class="badge-emoji">${badge.emoji}</span>
          <span class="badge-label">${badgeLabel(badge)}</span>
        </div>
      </div>
    </div>
    <div class="badge-progress">
      <div class="badge-progress-head">
        <span class="badge-progress-current"><span style="font-size:14px">${badge.emoji}</span> ${badgeLabel(badge)}</span>
        <span class="badge-progress-meta">${progressLabel}</span>
      </div>
      <div class="badge-progress-bar"><div class="badge-progress-fill" style="width:${progressPct}%;background:${nextBadge ? `linear-gradient(90deg,${badge.color},${nextBadge.color})` : badge.color}"></div></div>
      <div class="badge-tiers">
        ${BADGES.map(b => `
          <div class="badge-tier ${completed >= b.min ? 'unlocked' : ''} ${b.key === badge.key ? 'current' : ''}" style="--tier-color:${b.color}">
            <span class="badge-tier-emoji">${b.emoji}</span>
            <span class="badge-tier-name">${badgeLabel(b)}</span>
            <span class="badge-tier-range">${b.max === Infinity ? `${b.min}+` : `${b.min}-${b.max}`}</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-label">${t('total')}</div></div>
      <div class="stat-card"><div class="stat-val">${completed}</div><div class="stat-label">${t('completed_lbl')}</div></div>
      <div class="stat-card"><div class="stat-val">${completionRate}%</div><div class="stat-label">${t('completion')}</div></div>
      <div class="stat-card"><div class="stat-val">${watching}</div><div class="stat-label">${t('watching_lbl')}</div></div>
      <div class="stat-card"><div class="stat-val">${planToWatch}</div><div class="stat-label">${t('plan_lbl')}</div></div>
      <div class="stat-card"><div class="stat-val">${arr.filter(a => a.favorite).length}</div><div class="stat-label">${t('favorites')}</div></div>
    </div>
    ${podiumHtml}
    ${genreChart}
    <div class="profile-section data-section">
      <div class="profile-section-title">💾 ${t('data_section')}</div>
      <p class="data-msg">${t('data_msg')}</p>
      <div class="data-actions">
        <button class="data-btn data-btn-export" type="button" onclick="exportAllData()">${t('export_btn')}</button>
        <button class="data-btn data-btn-import" type="button" onclick="triggerImport()">${t('import_btn')}</button>
      </div>
    </div>
  `;
}

// ══ TOP 10 ════════════════════════════════════════
function switchTop10Type(type) {
  currentTop10Type = type;
  document.querySelectorAll('.t10-toggle').forEach(b => b.classList.toggle('active', b.dataset.top === type));
  ['series', 'movies', 'openings', 'endings'].forEach(k => {
    const p = $(`top10-${k}-panel`);
    if (p) p.dataset.hidden = (k !== type) ? 'true' : 'false';
  });
}

function renderTop10() {
  renderTop10Panel('series');
  renderTop10Panel('movies');
  renderTop10MusicPanel('openings');
  renderTop10MusicPanel('endings');
}

function renderTop10Panel(type) {
  const list = getList(), t10 = getTop10();
  // Normalize IDs to numbers for consistency
  let ranked = (t10[type] || []).map(Number).filter(id => list[id] && list[id].status === 'completed' && (isMovie(list[id]) === (type === 'movies')));
  if (ranked.length !== (t10[type] || []).length) { t10[type] = ranked; saveTop10(t10); }

  const allDone = Object.values(list).filter(a => a.status === 'completed' && (isMovie(a) === (type === 'movies')));
  const unranked = allDone.filter(a => !ranked.includes(Number(a.mal_id)));
  const maxFull = ranked.length >= 10;

  const listEl = $(`top10-list-${type}`), emptyEl = $(`top10-empty-${type}`);
  const pickerEl = $(`top10-picker-${type}`), pickerEmptyEl = $(`top10-picker-empty-${type}`);

  if (!ranked.length) { listEl.innerHTML = ''; emptyEl.classList.remove('hidden'); emptyEl.textContent = type === 'series' ? t('finish_series') : t('finish_movies'); }
  else {
    emptyEl.classList.add('hidden');
    listEl.innerHTML = ranked.map((id, i) => {
      const a = list[id]; if (!a) return '';
      const rc = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-n';
      const g = computeGlobal(a.scores);
      const sc = a.scores || {};
      const pills = [
        g !== null ? `<span class="t10-score-pill">⭐ <b>${g}</b></span>` : '',
        sc.story ? `<span class="t10-score-pill">📖 <b>${sc.story}</b></span>` : '',
        sc.animation ? `<span class="t10-score-pill">🎨 <b>${sc.animation}</b></span>` : '',
        sc.music ? `<span class="t10-score-pill">🎵 <b>${sc.music}</b></span>` : '',
      ].filter(Boolean).join('');
      return `<div class="top10-item" draggable="true" data-id="${id}" data-type="${type}"
          ondragstart="onDS(event)" ondragover="onDO(event)" ondrop="onDrop(event)" ondragleave="onDL(event)" ondragend="onDE(event)">
        <div class="t10-rank ${rc}">${i + 1}</div>
        <img class="t10-thumb" src="${esc(a.image)}" alt="${esc(a.title)}"/>
        <div class="t10-info">
          <div class="t10-title">${esc(a.title)}</div>
          <div class="t10-scores">${pills || `<span style="font-size:11px;color:var(--text2)">—</span>`}</div>
        </div>
        <span class="t10-drag">⠿</span>
        <button class="t10-remove" onclick="removeTop10(${id},'${type}')">✕</button>
      </div>`;
    }).join('');
  }

  if (!unranked.length || maxFull) {
    pickerEl.innerHTML = '';
    pickerEmptyEl.textContent = maxFull ? t('top10_full') : (type === 'movies' ? t('all_ranked_movies') : t('all_ranked_series'));
    pickerEmptyEl.classList.remove('hidden');
  } else {
    pickerEmptyEl.classList.add('hidden');
    pickerEl.innerHTML = unranked.map(a => `
      <div class="t10-pick-item">
        <img class="t10-pick-thumb" src="${esc(a.image)}" alt="${esc(a.title)}"/>
        <span class="t10-pick-name">${esc(a.title)}</span>
        <button class="t10-pick-btn" onclick="addTop10(${a.mal_id},'${type}')">+</button>
      </div>`).join('');
  }

  // Update panel header
  const subtitle = document.querySelector(`#top10-${type}-panel .t10-subtitle`);
  if (subtitle) subtitle.textContent = t('drag_reorder');
  const pickerTitle = document.querySelector(`#top10-${type}-panel .picker-title`);
  if (pickerTitle) pickerTitle.textContent = t('add_ranking');
}

function addTop10(malId, type) {
  malId = Number(malId);
  const t10 = getTop10();
  if (!t10[type]) t10[type] = [];
  const arr = t10[type].map(Number);
  if (arr.includes(malId) || arr.length >= 10) return;
  arr.push(malId); t10[type] = arr; saveTop10(t10);
  renderTop10Panel(type);
  showToast(`${t('added_top')} ${type === 'movies' ? t('films') : t('series')} !`);
}

function removeTop10(malId, type) {
  malId = Number(malId);
  const t10 = getTop10();
  t10[type] = (t10[type] || []).map(Number).filter(id => id !== malId); saveTop10(t10);
  renderTop10Panel(type);
}

// ── DRAG & DROP ───────────────────────────────────
let _dsrc = null, _dtype = null;
function _dataIdOf(arrItem) {
  return (typeof arrItem === 'object' && arrItem !== null) ? String(arrItem.id) : String(arrItem);
}
function _findIdxInArr(arr, idStr) {
  return arr.findIndex(item => _dataIdOf(item) === String(idStr));
}
function _isMusicTopType(type) { return type === 'openings' || type === 'endings'; }

function onDS(e) {
  _dsrc = String(e.currentTarget.dataset.id);
  _dtype = e.currentTarget.dataset.type;
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', _dsrc);
}
function onDE(e) {
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.top10-item').forEach(el => el.classList.remove('drag-over'));
}
function onDO(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (String(e.currentTarget.dataset.id) !== _dsrc) e.currentTarget.classList.add('drag-over');
}
function onDL(e) { e.currentTarget.classList.remove('drag-over'); }
function onDrop(e) {
  e.preventDefault();
  const tid = String(e.currentTarget.dataset.id), type = _dtype;
  e.currentTarget.classList.remove('drag-over');
  if (!_dsrc || _dsrc === tid || !type) return;
  const t10 = getTop10();
  const arr = t10[type] || [];
  const si = _findIdxInArr(arr, _dsrc), di = _findIdxInArr(arr, tid);
  if (si === -1 || di === -1) return;
  const moved = arr[si];
  arr.splice(si, 1); arr.splice(di, 0, moved);
  t10[type] = arr; saveTop10(t10); _dsrc = null;
  if (_isMusicTopType(type)) renderTop10MusicPanel(type);
  else renderTop10Panel(type);
}

// ── TOP 10 — MUSIC PANEL (Openings / Endings) ──
function _buildMusicEntry(malId, themeKey, animeMeta, r) {
  return {
    id: `${malId}_${themeKey}`,
    malId: Number(malId),
    themeKey,
    title: r.title || themeKey,
    artist: r.artist || '',
    eps: r.eps || '',
    type: r.type,
    animeTitle: animeMeta.title || '',
    animeImage: animeMeta.image || '',
  };
}

function renderTop10MusicPanel(panelType) {
  // panelType: 'openings' | 'endings'
  const themeType = panelType === 'openings' ? 'op' : 'ed';
  const t10 = getTop10();
  const userList = getList();
  const ranked = (t10[panelType] || []).filter(e => e && typeof e === 'object' && e.id);

  // Build picker pool: all favorited tracks of matching type, not already ranked
  const rankedIds = new Set(ranked.map(e => e.id));
  const pool = [];
  for (const malId in userList) {
    const animeMeta = userList[malId];
    const reactions = animeMeta.musicReactions || {};
    for (const themeKey in reactions) {
      const r = reactions[themeKey];
      if (!r || !r.favorite || r.type !== themeType) continue;
      const id = `${malId}_${themeKey}`;
      if (rankedIds.has(id)) continue;
      pool.push(_buildMusicEntry(malId, themeKey, animeMeta, r));
    }
  }

  const listEl = $(`top10-list-${panelType}`);
  const emptyEl = $(`top10-empty-${panelType}`);
  const pickerEl = $(`top10-picker-${panelType}`);
  const pickerEmptyEl = $(`top10-picker-empty-${panelType}`);
  if (!listEl) return;

  if (!ranked.length) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
  } else {
    emptyEl.classList.add('hidden');
    listEl.innerHTML = ranked.map((entry, i) => {
      const rc = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-n';
      const yt = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${entry.animeTitle} ${entry.title} ${entry.artist}`.trim())}`;
      return `<div class="top10-item music-t10-item" draggable="true" data-id="${esc(entry.id)}" data-type="${panelType}"
          ondragstart="onDS(event)" ondragover="onDO(event)" ondrop="onDrop(event)" ondragleave="onDL(event)" ondragend="onDE(event)">
        <div class="t10-rank ${rc}">${i + 1}</div>
        <img class="t10-thumb" src="${esc(entry.animeImage)}" alt="${esc(entry.animeTitle)}"/>
        <div class="t10-info">
          <div class="t10-title">${esc(entry.title)}</div>
          <div class="t10-music-sub">${entry.artist ? esc(entry.artist) + ' · ' : ''}${esc(entry.animeTitle)}</div>
        </div>
        <a class="t10-yt-mini" href="${yt}" target="_blank" rel="noopener" title="${t('listen_on_yt')}" onclick="event.stopPropagation()" draggable="false">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
        </a>
        <span class="t10-drag">⠿</span>
        <button class="t10-remove" onclick="removeMusicTop10('${esc(entry.id)}','${panelType}')">✕</button>
      </div>`;
    }).join('');
  }

  const maxFull = ranked.length >= 10;
  if (!pool.length || maxFull) {
    pickerEl.innerHTML = '';
    pickerEmptyEl.textContent = maxFull
      ? t(panelType === 'openings' ? 't10_full_op' : 't10_full_ed')
      : t(panelType === 'openings' ? 't10_op_picker_empty' : 't10_ed_picker_empty');
    pickerEmptyEl.classList.remove('hidden');
  } else {
    pickerEmptyEl.classList.add('hidden');
    pickerEl.innerHTML = pool.map(entry => `
      <div class="t10-pick-item">
        <img class="t10-pick-thumb" src="${esc(entry.animeImage)}" alt="${esc(entry.animeTitle)}"/>
        <div class="t10-pick-info">
          <span class="t10-pick-name">${esc(entry.title)}</span>
          <span class="t10-pick-sub">${esc(entry.animeTitle)}</span>
        </div>
        <button class="t10-pick-btn" onclick="addMusicTop10('${esc(entry.id)}','${panelType}')">+</button>
      </div>
    `).join('');
  }
}

function addMusicTop10(entryId, panelType) {
  // entryId format: `${malId}_${themeKey}` where themeKey is e.g. 'op_1' or 'ed_0'
  // MAL IDs are pure digits, so split on the FIRST underscore only.
  const firstUs = entryId.indexOf('_');
  if (firstUs === -1) return;
  const malIdStr = entryId.slice(0, firstUs);
  const themeKey = entryId.slice(firstUs + 1);
  const malId = Number(malIdStr);
  const list = getList();
  const animeMeta = list[malId];
  const r = animeMeta?.musicReactions?.[themeKey];
  if (!animeMeta || !r) return;
  const entry = _buildMusicEntry(malId, themeKey, animeMeta, r);
  const t10 = getTop10();
  if (!t10[panelType]) t10[panelType] = [];
  if (t10[panelType].length >= 10) return;
  if (t10[panelType].find(e => e && e.id === entryId)) return;
  t10[panelType].push(entry);
  saveTop10(t10);
  renderTop10MusicPanel(panelType);
  showToast(`${t('added_top')} ${panelType === 'openings' ? t('top_op') : t('top_ed')} !`);
}

function removeMusicTop10(entryId, panelType) {
  const t10 = getTop10();
  t10[panelType] = (t10[panelType] || []).filter(e => !(e && e.id === entryId));
  saveTop10(t10);
  renderTop10MusicPanel(panelType);
}

// ══ UTILS ═════════════════════════════════════════
function $(id) { return document.getElementById(id); }
function esc(s) { if (!s) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function statusLbl(s) { return { watching: t('status_watching'), planToWatch: t('status_plan'), completed: t('status_completed') }[s] || s; }

let _rl = 0;
function rl() { return new Promise(r => { const now = Date.now(), w = Math.max(0, 420 - (now - _rl)); _rl = now + w; setTimeout(r, w); }); }

let _toastT = null;
function showToast(msg) {
  const el = $('toast'); el.textContent = msg; el.classList.remove('hidden');
  clearTimeout(_toastT); _toastT = setTimeout(() => el.classList.add('hidden'), 2800);
}

// ══ iOS PWA INSTALL PROMPT ═══════════════════════
function _isIosSafari() {
  const ua = navigator.userAgent || '';
  // iPhone, iPad (incl. iPad in desktop mode on iOS 13+ which reports MacIntel + touch)
  const isIos = /iPhone|iPod/.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIos) return false;
  // Exclude in-app browsers (FB, Insta, etc.) — they often hide Add-to-Home-Screen
  if (/FBAN|FBAV|Instagram|Line\/|Snapchat/.test(ua)) return false;
  return true;
}

function _isStandalone() {
  return window.navigator.standalone === true
    || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
}

function maybeShowIosInstallPrompt() {
  if (!_isIosSafari() || _isStandalone()) return;
  // Respect user dismissal for 14 days
  const dismissed = Number(localStorage.getItem('anitrack_install_dismissed') || 0);
  if (dismissed && (Date.now() - dismissed) < 14 * 24 * 60 * 60 * 1000) return;
  const el = document.getElementById('ios-install-prompt');
  if (!el) return;
  setTimeout(() => el.classList.remove('hidden'), 1200);
}

function dismissIosInstall() {
  const el = document.getElementById('ios-install-prompt');
  if (el) el.classList.add('hidden');
  try { localStorage.setItem('anitrack_install_dismissed', String(Date.now())); } catch {}
}

// ══ STARFIELD BACKGROUND ═══════════════════════════
// Vanilla port of https://21st.dev Starfield component (canvas + RAF, no React)
const Starfield = {
  canvas: null, ctx: null,
  w: 0, h: 0, cx: 0, cy: 0, cz: 0,
  colorRatio: 0, ratio: 0,
  stars: [], raf: 0, running: false,
  opts: {
    speed: 0.25,
    quantity: 220,
    starColor: 'rgba(255,255,255,0.75)',
    bgColor: 'rgba(13,13,20,1)',
  },

  init() {
    this.canvas = document.getElementById('starfield-bg');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.ratio = this.opts.quantity / 2;
    this.measure();
    this.bigBang();
    this.start();
    window.addEventListener('resize', () => this.onResize());
  },

  measure() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.cx = this.w / 2;
    this.cy = this.h / 2;
    this.cz = (this.w + this.h) / 2;
    this.colorRatio = 1 / this.cz;
    this.canvas.width = this.w;
    this.canvas.height = this.h;
  },

  bigBang() {
    this.stars = new Array(this.opts.quantity).fill(0).map(() => [
      Math.random() * this.w * 2 - this.cx * 2,
      Math.random() * this.h * 2 - this.cy * 2,
      Math.round(Math.random() * this.cz),
      0, 0, 0, 0, true,
    ]);
  },

  onResize() {
    this.measure();
    this.bigBang();
  },

  update() {
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      s[7] = true;
      s[5] = s[3];
      s[6] = s[4];
      s[2] -= this.opts.speed;
      if (s[2] > this.cz) { s[2] -= this.cz; s[7] = false; }
      if (s[2] < 0) { s[2] += this.cz; s[7] = false; }
      s[3] = this.cx + (s[0] / s[2]) * this.ratio;
      s[4] = this.cy + (s[1] / s[2]) * this.ratio;
    }
  },

  draw() {
    const ctx = this.ctx;
    // Pull the starfield bgColor from the current theme
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    ctx.fillStyle = isLight ? 'rgba(242,242,250,1)' : this.opts.bgColor;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.strokeStyle = isLight ? 'rgba(60,40,180,0.55)' : this.opts.starColor;
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      if (s[5] > 0 && s[5] < this.w && s[6] > 0 && s[6] < this.h && s[7]) {
        ctx.lineWidth = (1 - this.colorRatio * s[2]) * 2;
        ctx.beginPath();
        ctx.moveTo(s[5], s[6]);
        ctx.lineTo(s[3], s[4]);
        ctx.stroke();
      }
    }
  },

  loop() {
    if (!this.running) return;
    this.update();
    this.draw();
    this.raf = requestAnimationFrame(() => this.loop());
  },

  start() {
    if (this.running) return;
    this.running = true;
    this.loop();
  },

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  },
};

// ══ BOOT ══════════════════════════════════════════
(function boot() {
  initAuthTabs();
  initNav();
  initStatusTabs();
  initGenreFilters();

  document.getElementById('search-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { currentSearchPage = 1; searchAnime(); }
  });

  ['login-username', 'login-password'].forEach(id => $(id)?.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); }));
  ['reg-username', 'reg-password', 'reg-password2'].forEach(id => $(id)?.addEventListener('keydown', e => { if (e.key === 'Enter') handleRegister(); }));

  applyLang();
  Starfield.init();
  maybeShowIosInstallPrompt();

  const db = getDB(), saved = db.sessions?.current;
  if (saved && db.users?.[saved]) loginUser(saved);
})();
