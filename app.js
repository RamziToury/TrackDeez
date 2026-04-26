/* ══════════════════════════════════════════════════
   AniTrack v4
══════════════════════════════════════════════════ */

const JIKAN = 'https://api.jikan.moe/v4';

let currentUser   = null;
let currentView   = 'list';
let currentFilter = 'all';
let currentGenre  = '';
let currentTop10Type = 'series';
let currentLang   = 'fr';

// discover state
let discoverPool  = [];
let discoverIndex = 0;
let discoverPage  = 1;

// search pagination state
let currentSearchPage = 1;
let searchTotalPages  = 1;
let lastSearchQuery   = '';
let lastSearchGenre   = '';

// ── TRANSLATIONS ──────────────────────────────────
const LANG = {
  fr: {
    // Auth
    login:'Connexion', register:'Inscription', username:'Identifiant',
    password:'Mot de passe', confirm:'Confirmer', connect:'Se connecter',
    create_account:'Créer mon compte', tagline:'Suivez vos animés. Célébrez chaque épisode.',
    err_fill:'Remplissez tous les champs.', err_creds:'Identifiant ou mot de passe incorrect.',
    err_min3:'3 caractères minimum.', err_chars:'Lettres, chiffres et _ uniquement.',
    err_min4:'Mot de passe : 4 caractères minimum.', err_nomatch:'Les mots de passe ne correspondent pas.',
    err_taken:'Identifiant déjà pris.',
    // Nav
    my_list:'Ma Liste', search:'Rechercher', discover:'À découvrir',
    favorites:'Favoris', top10:'Top 10',
    // Views
    view_profile:'Voir le profil →',
    // List
    all:'Tout', watching:'En cours', plan:'À voir', completed:'Terminé',
    series:'Séries', movies:'Films',
    empty_list:'Aucun animé dans cette liste.\nCherchez-en via la recherche ou découvrez !',
    // Search
    search_ph:'Naruto, Attack on Titan, Your Name…', search_btn:'Rechercher',
    genres_all:'Tous', in_list:'✓ Dans la liste', add:'+ Ajouter',
    no_results:'Aucun résultat.', searching:'Recherche…',
    page_of:'Page',
    // Discover
    disc_subtitle:'Swipez pour explorer de nouveaux animés',
    not_interested:'Pas intéressé', to_watch:'À voir', in_progress:'En cours',
    done:'Terminé', watch_trailer:'▶ Trailer', no_trailer:'Pas de trailer',
    where_watch:'Où regarder :', no_stream:'Info streaming non disponible',
    score_label:'Score MAL', seasons_label:'Saison',
    eps_label:'éps', loading:'Chargement…',
    season_spring:'Printemps', season_summer:'Été', season_fall:'Automne', season_winter:'Hiver',
    // Modal
    add_to_list:'Ajouter à la liste', status:'Statut', progress:'Progression',
    scores_title:'Notes', optional:'(optionnel — la moyenne donne la note globale)',
    global_avg:'Note globale (moyenne)', in_favorites:'Dans les favoris',
    add_favorites:'Ajouter aux favoris', delete_list:'🗑 Supprimer de la liste',
    added_fav:'⭐ Ajouté aux favoris !', removed_fav:'Retiré des favoris',
    no_synopsis:'Aucun synopsis disponible.',
    viewed_pct:'% visionné', tags_label:'Tags', see_all_tags:'Voir tous les tags',
    hide_tags:'Masquer',
    // Top 10
    add_ranking:'Ajouter au classement', drag_reorder:'Glissez pour réordonner',
    top10_full:'Top 10 complet ! Retirez un animé pour en ajouter un autre.',
    all_ranked_series:'Toutes les séries terminées sont classées !',
    all_ranked_movies:'Tous les films terminés sont classés !',
    finish_series:'Terminez des séries pour les classer ici !',
    finish_movies:'Terminez des films pour les classer ici !',
    // Profile
    member_since:'Membre depuis', total:'Total', completed_lbl:'Terminés',
    completion:'Complétés', watching_lbl:'En cours', plan_lbl:'À voir',
    fav_genre:'Genre préféré',
    // Status labels
    status_watching:'En cours', status_plan:'À voir', status_completed:'Terminé',
    // Toasts
    added_to:'Ajouté : ', added_list:'ajouté à la liste !', deleted:'supprimé.',
    added_top:'Ajouté au Top', films:'Films',
  },
  en: {
    // Auth
    login:'Login', register:'Register', username:'Username',
    password:'Password', confirm:'Confirm', connect:'Sign in',
    create_account:'Create account', tagline:'Track your anime. Celebrate every episode.',
    err_fill:'Please fill all fields.', err_creds:'Wrong username or password.',
    err_min3:'Minimum 3 characters.', err_chars:'Letters, digits and _ only.',
    err_min4:'Password: minimum 4 characters.', err_nomatch:'Passwords do not match.',
    err_taken:'Username already taken.',
    // Nav
    my_list:'My List', search:'Search', discover:'Discover',
    favorites:'Favorites', top10:'Top 10',
    // Views
    view_profile:'View profile →',
    // List
    all:'All', watching:'Watching', plan:'Plan to Watch', completed:'Completed',
    series:'Series', movies:'Movies',
    empty_list:'No anime in this list.\nSearch or discover new ones!',
    // Search
    search_ph:'Naruto, Attack on Titan, Your Name…', search_btn:'Search',
    genres_all:'All', in_list:'✓ In list', add:'+ Add',
    no_results:'No results.', searching:'Searching…',
    page_of:'Page',
    // Discover
    disc_subtitle:'Swipe to explore new anime',
    not_interested:'Not interested', to_watch:'Plan to watch', in_progress:'Watching',
    done:'Completed', watch_trailer:'▶ Trailer', no_trailer:'No trailer',
    where_watch:'Where to watch:', no_stream:'Streaming info not available',
    score_label:'MAL Score', seasons_label:'Season',
    eps_label:'eps', loading:'Loading…',
    season_spring:'Spring', season_summer:'Summer', season_fall:'Fall', season_winter:'Winter',
    // Modal
    add_to_list:'Add to list', status:'Status', progress:'Progress',
    scores_title:'Scores', optional:'(optional — average gives global score)',
    global_avg:'Global score (average)', in_favorites:'In favorites',
    add_favorites:'Add to favorites', delete_list:'🗑 Remove from list',
    added_fav:'⭐ Added to favorites!', removed_fav:'Removed from favorites',
    no_synopsis:'No synopsis available.',
    viewed_pct:'% watched', tags_label:'Tags', see_all_tags:'See all tags',
    hide_tags:'Hide',
    // Top 10
    add_ranking:'Add to ranking', drag_reorder:'Drag to reorder',
    top10_full:'Top 10 full! Remove an anime to add another.',
    all_ranked_series:'All completed series are ranked!',
    all_ranked_movies:'All completed movies are ranked!',
    finish_series:'Complete series to rank them here!',
    finish_movies:'Complete movies to rank them here!',
    // Profile
    member_since:'Member since', total:'Total', completed_lbl:'Completed',
    completion:'Completion', watching_lbl:'Watching', plan_lbl:'Plan to watch',
    fav_genre:'Favorite genre',
    // Status labels
    status_watching:'Watching', status_plan:'Plan to watch', status_completed:'Completed',
    // Toasts
    added_to:'Added: ', added_list:'added to list!', deleted:'deleted.',
    added_top:'Added to Top', films:'Movies',
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
  if (currentView === 'top10') renderTop10();
  if (currentView === 'discover') showDiscoverCard();
}

// ── SCORE CATEGORIES ──────────────────────────────
const SCORE_CATS = [
  { key:'story',      labelFr:'Histoire',                 labelEn:'Story',              emoji:'📖' },
  { key:'animation',  labelFr:'Animation',                labelEn:'Animation',           emoji:'🎨' },
  { key:'music',      labelFr:'Musiques & OST',           labelEn:'Music & OST',         emoji:'🎵' },
  { key:'chardesign', labelFr:'Character Design',         labelEn:'Character Design',    emoji:'✏️' },
  { key:'chardev',    labelFr:'Développement des persos', labelEn:'Character Development',emoji:'🌱' },
];

function scoreCatLabel(cat) {
  return currentLang === 'en' ? cat.labelEn : cat.labelFr;
}

function computeGlobal(scores) {
  if (!scores) return null;
  const vals = SCORE_CATS.map(c => scores[c.key]).filter(v => v !== null && v !== undefined);
  if (!vals.length) return null;
  return Math.round((vals.reduce((a,b) => a+b, 0) / vals.length) * 10) / 10;
}

function isMovie(a) { return a?.type === 'Movie'; }

// ══ STORAGE ══════════════════════════════════════
function getDB() {
  return JSON.parse(localStorage.getItem('anitrack_db') || '{"users":{},"sessions":{}}');
}
function saveDB(db) { localStorage.setItem('anitrack_db', JSON.stringify(db)); }

function getUserData(u) {
  const db = getDB();
  if (!db.users[u]) db.users[u] = { list:{}, theme:'dark', top10:{series:[],movies:[]}, joinedAt:Date.now() };
  if (!db.users[u].top10) db.users[u].top10 = {series:[],movies:[]};
  if (!db.users[u].joinedAt) db.users[u].joinedAt = Date.now();
  return db.users[u];
}
function saveUserData(u,d) { const db=getDB(); db.users[u]=d; saveDB(db); }
function getList()  { return getUserData(currentUser).list || {}; }
function saveList(list) {
  const db=getDB();
  if (!db.users[currentUser]) db.users[currentUser]={};
  db.users[currentUser].list=list; saveDB(db);
}
function getTop10() { return getUserData(currentUser).top10 || {series:[],movies:[]}; }
function saveTop10(t) {
  const db=getDB();
  if (!db.users[currentUser]) db.users[currentUser]={};
  db.users[currentUser].top10=t; saveDB(db);
}

// ══ AUTH ═════════════════════════════════════════
function hash(p) {
  let h=0;
  for (let i=0;i<p.length;i++) { h=((h<<5)-h)+p.charCodeAt(i); h=h&h; }
  return h.toString(36);
}

function handleLogin() {
  const u=$('login-username').value.trim(), p=$('login-password').value;
  const e=$('login-error');
  if (!u||!p) { showErr(e,t('err_fill')); return; }
  const db=getDB();
  if (!db.users[u]||db.users[u].password!==hash(p)) { showErr(e,t('err_creds')); return; }
  e.classList.add('hidden');
  loginUser(u);
}

function handleRegister() {
  const u=$('reg-username').value.trim(), p=$('reg-password').value, p2=$('reg-password2').value;
  const e=$('reg-error');
  if (!u||!p||!p2) { showErr(e,t('err_fill')); return; }
  if (u.length<3) { showErr(e,t('err_min3')); return; }
  if (!/^[a-zA-Z0-9_]+$/.test(u)) { showErr(e,t('err_chars')); return; }
  if (p.length<4) { showErr(e,t('err_min4')); return; }
  if (p!==p2) { showErr(e,t('err_nomatch')); return; }
  const db=getDB();
  if (db.users[u]) { showErr(e,t('err_taken')); return; }
  db.users[u]={password:hash(p),list:{},theme:'dark',top10:{series:[],movies:[]},joinedAt:Date.now()};
  saveDB(db); e.classList.add('hidden'); loginUser(u);
}

function loginUser(u) {
  currentUser=u;
  const db=getDB(); db.sessions=db.sessions||{}; db.sessions.current=u; saveDB(db);
  $('auth-screen').classList.add('hidden');
  $('app').classList.remove('hidden');
  const ini=u.slice(0,2).toUpperCase();
  $('sb-avatar').textContent=ini;
  $('sb-username').textContent=u;
  applyTheme(getUserData(u).theme||'dark');
  currentLang = getUserData(u).lang || 'fr';
  applyLang();
  discoverPool=[]; discoverIndex=0; discoverPage=1;
  _searchCache={}; currentFilter='all'; currentGenre='';
  currentSearchPage=1; searchTotalPages=1;
  document.querySelectorAll('.status-tab').forEach(t2=>t2.classList.remove('active'));
  document.querySelector('.status-tab[data-status="all"]')?.classList.add('active');
  document.querySelectorAll('.genre-btn').forEach(b=>b.classList.remove('active'));
  document.querySelector('.genre-btn[data-genre=""]')?.classList.add('active');
  switchView('list');
  document.querySelectorAll('.snav-btn,.mnav-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('[data-view="list"]').forEach(b=>b.classList.add('active'));
  updateCounts();
}

function handleLogout() {
  const db=getDB(); if (db.sessions) db.sessions.current=null; saveDB(db);
  currentUser=null;
  $('app').classList.add('hidden');
  $('auth-screen').classList.remove('hidden');
  $('login-username').value=''; $('login-password').value='';
}
function showErr(el,m) { el.textContent=m; el.classList.remove('hidden'); }

// ══ THEME ═════════════════════════════════════════
function toggleTheme() {
  const n=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
  applyTheme(n);
  if (currentUser) { const d=getUserData(currentUser); d.theme=n; saveUserData(currentUser,d); }
}
function applyTheme(t2) {
  document.documentElement.setAttribute('data-theme',t2);
  document.querySelectorAll('.theme-icon').forEach(i=>i.textContent=t2==='dark'?'☀':'☾');
}

// ══ NAV ══════════════════════════════════════════
function initNav() {
  document.querySelectorAll('.snav-btn').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('.snav-btn,.mnav-btn').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll(`[data-view="${b.dataset.view}"]`).forEach(x=>x.classList.add('active'));
    switchView(b.dataset.view);
  }));
  document.querySelectorAll('.mnav-btn[data-view]').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('.snav-btn,.mnav-btn').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll(`[data-view="${b.dataset.view}"]`).forEach(x=>x.classList.add('active'));
    switchView(b.dataset.view);
  }));
}

function switchView(v) {
  currentView=v;
  document.querySelectorAll('.view').forEach(el=>el.classList.remove('active'));
  const target=$(`view-${v}`);
  if (target) target.classList.add('active');
  if (v==='list') renderListView();
  if (v==='search') { if (!Object.keys(_searchCache).length) searchAnime(); }
  if (v==='favorites') renderFavorites();
  if (v==='top10') renderTop10();
  if (v==='discover') initDiscover();
}

// ══ STATUS TABS ════════════════════════════════════
function initStatusTabs() {
  document.querySelectorAll('.status-tab').forEach(t2=>t2.addEventListener('click',()=>{
    document.querySelectorAll('.status-tab').forEach(x=>x.classList.remove('active'));
    t2.classList.add('active');
    currentFilter=t2.dataset.status;
    renderListView();
  }));
}

// ══ AUTH TABS ═════════════════════════════════════
function initAuthTabs() {
  document.querySelectorAll('.auth-tab').forEach(t2=>t2.addEventListener('click',()=>{
    document.querySelectorAll('.auth-tab').forEach(x=>x.classList.remove('active'));
    t2.classList.add('active');
    const w=t2.dataset.tab;
    $('login-form').classList.toggle('hidden',w!=='login');
    $('register-form').classList.toggle('hidden',w!=='register');
    $('login-error').classList.add('hidden');
    $('reg-error').classList.add('hidden');
  }));
}

// ══ COUNTS ════════════════════════════════════════
function updateCounts() {
  const arr=Object.values(getList());
  $('count-all').textContent=arr.length;
  $('count-watching').textContent=arr.filter(a=>a.status==='watching').length;
  $('count-plan').textContent=arr.filter(a=>a.status==='planToWatch').length;
  $('count-completed').textContent=arr.filter(a=>a.status==='completed').length;
}

// ══ RENDER LIST ════════════════════════════════════
function renderListView() {
  const all=Object.values(getList());
  let items=currentFilter==='all'?all:all.filter(a=>a.status===currentFilter);
  const series=items.filter(a=>!isMovie(a));
  const movies=items.filter(a=>isMovie(a));
  $('grid-series').innerHTML=series.map(a=>buildCard(a,'list')).join('');
  $('grid-movies').innerHTML=movies.map(a=>buildCard(a,'list')).join('');
  $('section-series').style.display=series.length?'':'none';
  $('section-movies').style.display=movies.length?'':'none';
  $('list-empty').classList.toggle('hidden',items.length>0);
  // update tab labels
  document.querySelectorAll('.status-tab').forEach(tab => {
    const s=tab.dataset.status;
    const lbl=tab.querySelector('.tab-lbl');
    if (lbl) {
      if (s==='all') lbl.textContent=t('all');
      else if (s==='watching') lbl.textContent=t('watching');
      else if (s==='planToWatch') lbl.textContent=t('plan');
      else if (s==='completed') lbl.textContent=t('completed');
    }
  });
  document.querySelectorAll('.type-label').forEach(el => {
    if (el.dataset.type==='series') el.textContent=t('series');
    if (el.dataset.type==='movies') el.textContent=t('movies');
  });
  updateCounts();
}

// ══ RENDER FAVORITES ══════════════════════════════
function renderFavorites() {
  const favs=Object.values(getList()).filter(a=>a.favorite);
  const series=favs.filter(a=>!isMovie(a));
  const movies=favs.filter(a=>isMovie(a));
  $('fav-grid-series').innerHTML=series.map(a=>buildCard(a,'list')).join('');
  $('fav-grid-movies').innerHTML=movies.map(a=>buildCard(a,'list')).join('');
  $('fav-section-series').style.display=series.length?'':'none';
  $('fav-section-movies').style.display=movies.length?'':'none';
  $('fav-empty').classList.toggle('hidden',favs.length>0);
}

// ══ BUILD CARD ════════════════════════════════════
function buildCard(anime, mode) {
  const cur=anime.currentEp||0, total=anime.episodes||0;
  const pct=total?Math.round((cur/total)*100):0;
  const global=computeGlobal(anime.scores);

  if (mode==='search') {
    const inList=!!getList()[anime.mal_id];
    return `<div class="anime-card" onclick="openModal(${anime.mal_id},'search')">
      <div class="card-img-wrap"><img src="${esc(anime.image)}" alt="${esc(anime.title)}" loading="lazy"/></div>
      <div class="card-body">
        <div class="card-title">${esc(anime.title)}</div>
        <button class="card-add-btn ${inList?'added':''}" onclick="event.stopPropagation();${inList?'':'quickAdd('+anime.mal_id+')'}">
          ${inList?t('in_list'):t('add')}
        </button>
      </div>
    </div>`;
  }

  const statusLabels = {watching:t('watching'),planToWatch:t('plan'),completed:t('completed')};
  const progress=(anime.status==='watching'&&!isMovie(anime))?`
    <div class="progress-wrap">
      <div class="progress-label"><span>Ép. ${cur}</span><span>${pct}%</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>`:'';

  const scoreBadge=(anime.status==='completed'&&global)
    ?`<div class="card-score">★ ${global}/20</div>`:'';

  return `<div class="anime-card" onclick="openModal(${anime.mal_id},'list')">
    <div class="card-img-wrap">
      <img src="${esc(anime.image)}" alt="${esc(anime.title)}" loading="lazy"/>
      <div class="card-badge badge-${anime.status}">${statusLabels[anime.status]}</div>
      ${anime.favorite?'<div class="card-fav">⭐</div>':''}
      ${scoreBadge}
    </div>
    <div class="card-body"><div class="card-title">${esc(anime.title)}</div>${progress}</div>
  </div>`;
}

// ══ SEARCH ════════════════════════════════════════
let _searchCache = {};

function initGenreFilters() {
  document.querySelectorAll('.genre-btn').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('.genre-btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    currentGenre=b.dataset.genre;
    currentSearchPage=1;
    searchAnime();
  }));
}

async function searchAnime(page) {
  page = page || 1;
  currentSearchPage = page;
  const q=$('search-input')?.value.trim()||'';
  lastSearchQuery=q; lastSearchGenre=currentGenre;
  $('search-results').innerHTML='';
  $('search-pagination').innerHTML='';
  $('search-loading').classList.remove('hidden');
  $('search-empty').classList.add('hidden');
  try {
    await rl();
    let url=`${JIKAN}/anime?limit=24&sfw=false&page=${page}`;
    if (q) url+=`&q=${encodeURIComponent(q)}`;
    if (currentGenre) url+=`&genres=${currentGenre}`;
    if (!q) url+=`&order_by=score&sort=desc`;
    const res=await fetch(url);
    const data=await res.json();
    $('search-loading').classList.add('hidden');
    if (!data.data?.length) { $('search-empty').classList.remove('hidden'); return; }

    // Pagination info
    searchTotalPages=data.pagination?.last_visible_page||1;
    const totalItems=data.pagination?.items?.total||0;

    _searchCache={};
    data.data.forEach(a=>{
      _searchCache[a.mal_id]={
        mal_id:a.mal_id,
        title:a.title_english||a.title,
        image:a.images?.jpg?.image_url||'',
        episodes:a.episodes,
        synopsis:a.synopsis,
        genres:a.genres?.map(g=>g.name)||[],
        themes:a.themes?.map(g=>g.name)||[],
        year:a.year||(a.aired?.from?new Date(a.aired.from).getFullYear():null),
        type:a.type,
        score:a.score,
        trailer_id:a.trailer?.youtube_id||null,
        season:a.season||null,
      };
    });
    $('search-results').innerHTML=Object.values(_searchCache).map(a=>buildCard(a,'search')).join('');
    renderSearchPagination(totalItems);
  } catch(err) {
    $('search-loading').classList.add('hidden');
    showToast('Erreur de recherche. Réessayez.');
    console.error(err);
  }
}

function renderSearchPagination(totalItems) {
  const el=$('search-pagination');
  if (!el||searchTotalPages<=1) { if(el) el.innerHTML=''; return; }
  const p=currentSearchPage, last=searchTotalPages;
  const info=totalItems?`<span class="pg-total">${totalItems} résultats</span>`:'';
  let pages='';
  // Always show first, last, current ±2
  const shown=new Set();
  [1,2,p-2,p-1,p,p+1,p+2,last-1,last].forEach(n=>{if(n>=1&&n<=last)shown.add(n);});
  const sorted=[...shown].sort((a,b)=>a-b);
  let prev=-1;
  sorted.forEach(n=>{
    if (prev!==-1&&n-prev>1) pages+=`<span class="pg-dots">…</span>`;
    pages+=`<button class="pg-btn${n===p?' pg-active':''}" onclick="searchAnime(${n})">${n}</button>`;
    prev=n;
  });
  el.innerHTML=`<div class="pagination-wrap">${info}<div class="pg-pages">
    <button class="pg-btn pg-arrow" ${p<=1?'disabled':''} onclick="searchAnime(${p-1})">‹</button>
    ${pages}
    <button class="pg-btn pg-arrow" ${p>=last?'disabled':''} onclick="searchAnime(${p+1})">›</button>
  </div></div>`;
}

function quickAdd(malId) {
  const c=_searchCache[malId]; if (!c) return;
  const list=getList();
  list[malId]={...c,status:'planToWatch',currentEp:0,scores:{},favorite:false,addedAt:Date.now()};
  saveList(list); updateCounts();
  showToast(`"${c.title}" ${t('added_list')}`);
  refreshSearchCards();
}

function refreshSearchCards() {
  if (!Object.keys(_searchCache).length) return;
  $('search-results').innerHTML=Object.values(_searchCache).map(a=>buildCard(a,'search')).join('');
}

// ══ DISCOVER ══════════════════════════════════════
function seasonLabel(s) {
  const map={spring:t('season_spring'),summer:t('season_summer'),fall:t('season_fall'),winter:t('season_winter')};
  return map[s]||s;
}

async function initDiscover() {
  if (discoverPool.length&&discoverIndex<discoverPool.length) { showDiscoverCard(); return; }
  $('discover-loading').classList.remove('hidden');
  $('discover-card').style.display='none';
  $('discover-actions').style.opacity='0.3';
  $('discover-actions').style.pointerEvents='none';
  try {
    await rl();
    const res=await fetch(`${JIKAN}/anime?limit=25&order_by=score&sort=desc&page=${discoverPage}&min_score=6`);
    const data=await res.json();
    discoverPage++;
    const list=getList();
    const fresh=(data.data||[]).filter(a=>
      !list[a.mal_id]&&a.images?.jpg?.image_url&&(a.synopsis?.length>50)
    );
    discoverPool=[...discoverPool,...fresh.map(a=>({
      mal_id:a.mal_id,
      title:a.title_english||a.title,
      image:a.images?.jpg?.large_image_url||a.images?.jpg?.image_url||'',
      episodes:a.episodes,
      synopsis:a.synopsis,
      genres:a.genres?.map(g=>g.name)||[],
      themes:a.themes?.map(g=>g.name)||[],
      year:a.year||(a.aired?.from?new Date(a.aired.from).getFullYear():null),
      type:a.type,
      score:a.score,
      trailer_id:a.trailer?.youtube_id||null,
      season:a.season||null,
      season_year:a.year||null,
    }))];
    $('discover-loading').classList.add('hidden');
    $('discover-card').style.display='';
    $('discover-actions').style.opacity='';
    $('discover-actions').style.pointerEvents='';
    showDiscoverCard();
  } catch {
    $('discover-loading').classList.add('hidden');
    showToast('Erreur de chargement. Réessayez.');
  }
}

function showDiscoverCard() {
  const list=getList();
  while (discoverIndex<discoverPool.length&&list[discoverPool[discoverIndex]?.mal_id]) discoverIndex++;
  if (discoverIndex>=discoverPool.length) { initDiscover(); return; }
  const a=discoverPool[discoverIndex];

  $('dc-img').src=a.image;
  $('dc-img').alt=a.title;
  $('dc-title').textContent=a.title;
  $('dc-synopsis').textContent=a.synopsis||'';

  // Tags (genres + themes combined)
  const allTags=[...a.genres,...(a.themes||[])];
  $('dc-genres').innerHTML=allTags.slice(0,5).map(g=>`<span class="dc-genre-tag">${esc(g)}</span>`).join('');

  // Meta: score /20, season, episodes, type
  const meta=[];
  if (a.type) meta.push(`<span class="dc-meta-tag ${isMovie(a)?'tag-movie':'tag-series'}">${isMovie(a)?'🎬 Film':'📺 Série'}</span>`);
  if (a.score) {
    const score20=(a.score*2).toFixed(1);
    meta.push(`<span class="dc-meta-tag dc-score">★ ${score20}/20</span>`);
  }
  if (a.season&&a.season_year) meta.push(`<span class="dc-meta-tag">📅 ${seasonLabel(a.season)} ${a.season_year}</span>`);
  else if (a.year) meta.push(`<span class="dc-meta-tag">📅 ${a.year}</span>`);
  if (a.episodes) meta.push(`<span class="dc-meta-tag">📺 ${a.episodes} ${t('eps_label')}</span>`);
  $('dc-meta').innerHTML=meta.join('');

  // Trailer button
  const trailerEl=$('dc-trailer');
  if (trailerEl) {
    if (a.trailer_id) {
      trailerEl.innerHTML=`<a class="trailer-btn" href="https://www.youtube.com/watch?v=${esc(a.trailer_id)}" target="_blank" rel="noopener">▶ ${t('watch_trailer')}</a>`;
    } else {
      trailerEl.innerHTML=`<span class="trailer-btn trailer-none">${t('no_trailer')}</span>`;
    }
  }
}

function discoverAction(action) {
  const a=discoverPool[discoverIndex];
  if (!a) return;
  if (action!=='skip') {
    const list=getList();
    list[a.mal_id]={...a,status:action,currentEp:0,scores:{},favorite:false,addedAt:Date.now()};
    saveList(list); updateCounts();
    const labels={
      planToWatch:`🕐 ${t('to_watch')}`,
      watching:`▶ ${t('in_progress')}`,
      completed:`✓ ${t('done')}`
    };
    showToast(labels[action]);
  }
  discoverIndex++;
  const card=$('discover-card');
  card.style.transition='transform .25s,opacity .25s';
  card.style.transform=action==='skip'?'translateX(-60px) rotate(-3deg)':'translateX(60px) rotate(3deg)';
  card.style.opacity='0';
  setTimeout(()=>{ card.style.transition=''; card.style.transform=''; card.style.opacity=''; showDiscoverCard(); },260);
}

// ══ MODAL ═════════════════════════════════════════
let _modal=null;

async function openModal(malId, source) {
  const list=getList();
  let anime=list[malId]||(_searchCache[malId]?{..._searchCache[malId],status:null}:null);
  if (!anime) {
    $('modal-overlay').classList.remove('hidden');
    $('modal-content').innerHTML=`<div class="loading-state"><div class="spinner"></div><p>${t('loading')}</p></div>`;
    try {
      await rl();
      const d=(await (await fetch(`${JIKAN}/anime/${malId}`)).json()).data;
      anime={
        mal_id:d.mal_id,
        title:d.title_english||d.title,
        image:d.images?.jpg?.large_image_url||d.images?.jpg?.image_url||'',
        episodes:d.episodes,
        synopsis:d.synopsis,
        genres:d.genres?.map(g=>g.name)||[],
        themes:d.themes?.map(g=>g.name)||[],
        demographics:d.demographics?.map(g=>g.name)||[],
        year:d.year||(d.aired?.from?new Date(d.aired.from).getFullYear():null),
        type:d.type,
        score:d.score,
        trailer_id:d.trailer?.youtube_id||null,
        season:d.season||null,
        status:null, currentEp:0, scores:{}, favorite:false
      };
    } catch { $('modal-content').innerHTML='<p style="padding:20px">Impossible de charger.</p>'; return; }
  }
  if (!anime.scores) anime.scores={};
  _modal={...anime,mal_id:malId};
  renderModal(malId);
  $('modal-overlay').classList.remove('hidden');
}

function renderModal(malId) {
  const list=getList();
  const inList=!!list[malId];
  const a=_modal;
  const s=a.scores||{};
  const movie=isMovie(a);
  const cur=a.currentEp||0, total=a.episodes||0;
  const pct=total?Math.round((cur/total)*100):0;
  const global=computeGlobal(s);

  const typeTag=a.type?`<span class="modal-meta-tag ${movie?'tag-movie':'tag-series'}">${movie?'🎬 Film':'📺 '+t('series')}</span>`:'';
  const yearTag=a.year?`<span class="modal-meta-tag">📅 ${a.year}</span>`:'';
  const epsTag=a.episodes?`<span class="modal-meta-tag">📺 ${a.episodes} ${t('eps_label')}</span>`:'';
  const scoreTag=a.score?`<span class="modal-meta-tag dc-score">★ ${(a.score*2).toFixed(1)}/20</span>`:'';
  const seasonTag=(a.season&&a.year)?`<span class="modal-meta-tag">🗓 ${seasonLabel(a.season)} ${a.year}</span>`:'';

  // Tags: genres + themes + demographics
  const allTags=[...(a.genres||[]),...(a.themes||[]),...(a.demographics||[])];
  const TAGS_INITIAL=5;
  const tagsHtml=allTags.length?`
    <div class="modal-tags-wrap" id="modal-tags-wrap">
      <div class="modal-tags" id="modal-tags-list">
        ${allTags.slice(0,TAGS_INITIAL).map(g=>`<span class="modal-tag">${esc(g)}</span>`).join('')}
      </div>
      ${allTags.length>TAGS_INITIAL?`<button class="tags-toggle-btn" id="tags-toggle-btn" onclick="toggleTagsExpand(${JSON.stringify(allTags).replace(/"/g,'&quot;')})">
        ${t('see_all_tags')} (${allTags.length})
      </button>`:''}
    </div>`:'';

  // Trailer link
  const trailerHtml=a.trailer_id?`<a class="trailer-btn modal-trailer" href="https://www.youtube.com/watch?v=${esc(a.trailer_id)}" target="_blank" rel="noopener">▶ ${t('watch_trailer')}</a>`:'';

  const addBtn=!inList?`
    <div class="modal-section">
      <div class="msec-title">${t('add_to_list')}</div>
      <div class="status-selector">
        <button class="status-opt" onclick="addToList('planToWatch')">🕐 ${t('plan')}</button>
        <button class="status-opt" onclick="addToList('watching')">▶ ${t('watching')}</button>
        <button class="status-opt" onclick="addToList('completed')">✓ ${t('completed')}</button>
      </div>
    </div>`:'' ;

  const statusSec=inList?`
    <div class="modal-section">
      <div class="msec-title">${t('status')}</div>
      <div class="status-selector">
        <button class="status-opt ${a.status==='planToWatch'?'sel-planToWatch':''}" onclick="setStatus('planToWatch')">🕐 ${t('plan')}</button>
        <button class="status-opt ${a.status==='watching'?'sel-watching':''}" onclick="setStatus('watching')">▶ ${t('watching')}</button>
        <button class="status-opt ${a.status==='completed'?'sel-completed':''}" onclick="setStatus('completed')">✓ ${t('completed')}</button>
      </div>
    </div>`:'';

  const epSec=(inList&&a.status==='watching'&&!movie)?`
    <div class="modal-section">
      <div class="msec-title">${t('progress')}</div>
      <div class="ep-control">
        <button class="ep-btn" onclick="changeEp(-1)">−</button>
        <input class="ep-input" id="ep-val" type="number" value="${cur}" min="0" max="${a.episodes||9999}" onchange="setEp(this.value)"/>
        <span class="ep-total">/ ${total||'?'} éps</span>
        <button class="ep-plus-btn" onclick="changeEp(1)">+1 ép</button>
      </div>
      <div class="ep-progress">
        <div class="progress-label"><span>${pct}${t('viewed_pct')}</span><span>${cur} / ${total||'?'}</span></div>
        <div class="progress-bar"><div class="progress-fill" id="modal-pfill" style="width:${pct}%"></div></div>
      </div>
    </div>`:'';

  const ratingsSec=(inList&&a.status==='completed')?`
    <div class="modal-section">
      <div class="msec-title">${t('scores_title')} <span style="color:var(--text2);font-size:10px;font-weight:400;text-transform:none;letter-spacing:0">${t('optional')}</span></div>
      <div class="ratings-grid">
        ${SCORE_CATS.map(c=>buildRatingItem(c.key,c.emoji,scoreCatLabel(c),s[c.key])).join('')}
      </div>
      ${global!==null?`<div style="margin-top:12px;padding:10px 14px;background:var(--bg3);border-radius:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:16px">⭐</span>
        <span style="font-size:13px;color:var(--text2)">${t('global_avg')}</span>
        <strong id="global-score-val" style="margin-left:auto;color:var(--star);font-size:18px">${global}/20</strong>
      </div>`:''}
      <div class="fav-toggle ${a.favorite?'is-fav':''}" onclick="toggleFav()" id="fav-toggle">
        <span class="fav-icon">${a.favorite?'⭐':'☆'}</span>
        <span>${a.favorite?t('in_favorites'):t('add_favorites')}</span>
      </div>
    </div>`:'';

  const removeBtn=inList?`
    <div class="modal-danger">
      <button class="btn-danger" onclick="removeAnime(${malId})">${t('delete_list')}</button>
    </div>`:'';

  $('modal-content').innerHTML=`
    <div class="modal-hero">
      <div class="modal-poster"><img src="${esc(a.image)}" alt="${esc(a.title)}"/></div>
      <div class="modal-info">
        <div class="modal-title">${esc(a.title)}</div>
        <div class="modal-meta">${typeTag}${yearTag}${epsTag}${scoreTag}${seasonTag}</div>
        ${tagsHtml}
        ${trailerHtml}
        <p class="modal-synopsis">${esc(a.synopsis||t('no_synopsis'))}</p>
      </div>
    </div>
    ${addBtn}${statusSec}${epSec}${ratingsSec}${removeBtn}
  `;
}

function toggleTagsExpand(tags) {
  const listEl=$('modal-tags-list');
  const btn=$('tags-toggle-btn');
  if (!listEl||!btn) return;
  const expanded=btn.dataset.expanded==='true';
  if (!expanded) {
    listEl.innerHTML=tags.map(g=>`<span class="modal-tag">${esc(g)}</span>`).join('');
    btn.textContent=t('hide_tags');
    btn.dataset.expanded='true';
  } else {
    listEl.innerHTML=tags.slice(0,5).map(g=>`<span class="modal-tag">${esc(g)}</span>`).join('');
    btn.textContent=`${t('see_all_tags')} (${tags.length})`;
    btn.dataset.expanded='false';
  }
}

function buildRatingItem(key, emoji, label, val) {
  const filled=val?Math.round(val/2):0;
  const stars=Array.from({length:10},(_,i)=>
    `<button class="star-btn ${i<filled?'filled':''}" onclick="setScore('${key}',${(i+1)*2})" title="${(i+1)*2}/20">★</button>`
  ).join('');
  return `<div class="rating-item">
    <div class="rating-item-label"><span class="ri-emoji">${emoji}</span>${label}</div>
    <div class="rating-stars" id="stars-${key}">${stars}</div>
    <div class="rating-val" id="rval-${key}">${val?`<strong>${val}</strong>/20`:`<span style="color:var(--text2)">—</span>`}</div>
  </div>`;
}

// ══ MODAL ACTIONS ══════════════════════════════════
function addToList(status) {
  const list=getList(); const a=_modal;
  list[a.mal_id]={...a,status,currentEp:0,scores:{},favorite:false,addedAt:Date.now()};
  saveList(list); updateCounts();
  _modal={...list[a.mal_id]};
  showToast(`${t('added_to')}"${statusLbl(status)}"`);
  renderModal(a.mal_id);
  if (currentView==='list') renderListView();
  refreshSearchCards();
}

function setStatus(status) {
  const list=getList(), id=_modal.mal_id; if (!list[id]) return;
  list[id].status=status;
  if (status==='completed'&&list[id].episodes) list[id].currentEp=list[id].episodes;
  saveList(list); updateCounts();
  _modal={..._modal,status,currentEp:list[id].currentEp};
  renderModal(id);
  if (currentView==='list') renderListView();
  if (currentView==='favorites') renderFavorites();
  showToast(`${t('status')}: ${statusLbl(status)}`);
}

function changeEp(d) {
  const inp=$('ep-val'); if (!inp) return;
  const max=_modal.episodes||Infinity;
  inp.value=Math.max(0,Math.min(max,(parseInt(inp.value)||0)+d));
  setEp(inp.value);
}
function setEp(v) {
  const list=getList(), id=_modal.mal_id; if (!list[id]) return;
  const ep=Math.max(0,Math.min(list[id].episodes||Infinity,parseInt(v)||0));
  list[id].currentEp=ep; _modal.currentEp=ep; saveList(list);
  const total=list[id].episodes, pct=total?Math.round((ep/total)*100):0;
  const fill=$('modal-pfill'); if (fill) fill.style.width=pct+'%';
  const lbl=document.querySelector('.ep-progress .progress-label');
  if (lbl) { lbl.children[0].textContent=`${pct}${t('viewed_pct')}`; lbl.children[1].textContent=`${ep} / ${total||'?'}`; }
  const inp=$('ep-val'); if (inp) inp.value=ep;
  if (currentView==='list') renderListView();
}

function setScore(key, val) {
  const list=getList(), id=_modal.mal_id; if (!list[id]) return;
  if (!list[id].scores) list[id].scores={};
  const score=Math.max(0,Math.min(20,parseFloat(val)||0));
  list[id].scores[key]=score; if (!_modal.scores) _modal.scores={};
  _modal.scores[key]=score; saveList(list);
  const filled=Math.round(score/2);
  const starsEl=$(`stars-${key}`);
  if (starsEl) starsEl.innerHTML=Array.from({length:10},(_,i)=>
    `<button class="star-btn ${i<filled?'filled':''}" onclick="setScore('${key}',${(i+1)*2})" title="${(i+1)*2}/20">★</button>`
  ).join('');
  const rvalEl=$(`rval-${key}`);
  if (rvalEl) rvalEl.innerHTML=`<strong>${score}</strong>/20`;
  const global=computeGlobal(_modal.scores);
  if (global!==null) {
    let el=$('global-score-val');
    if (!el) {
      const rg=document.querySelector('.ratings-grid');
      if (rg) {
        const div=document.createElement('div');
        div.style.cssText='margin-top:12px;padding:10px 14px;background:var(--bg3);border-radius:10px;display:flex;align-items:center;gap:10px';
        div.innerHTML=`<span style="font-size:16px">⭐</span><span style="font-size:13px;color:var(--text2)">${t('global_avg')}</span><strong id="global-score-val" style="margin-left:auto;color:var(--star);font-size:18px">${global}/20</strong>`;
        rg.after(div);
      }
    } else { el.textContent=global+'/20'; }
  }
  if (currentView==='list') renderListView();
  if (currentView==='favorites') renderFavorites();
  if (currentView==='top10') renderTop10();
}

function toggleFav() {
  const list=getList(), id=_modal.mal_id; if (!list[id]) return;
  list[id].favorite=!list[id].favorite; _modal.favorite=list[id].favorite; saveList(list);
  const toggle=$('fav-toggle');
  if (toggle) {
    toggle.classList.toggle('is-fav',list[id].favorite);
    toggle.innerHTML=`<span class="fav-icon">${list[id].favorite?'⭐':'☆'}</span><span>${list[id].favorite?t('in_favorites'):t('add_favorites')}</span>`;
  }
  showToast(list[id].favorite?t('added_fav'):t('removed_fav'));
  if (currentView==='list') renderListView();
  if (currentView==='favorites') renderFavorites();
}

function removeAnime(malId) {
  const list=getList(), title=list[malId]?.title||'';
  delete list[malId];
  const t10=getTop10(); t10.series=t10.series.filter(i=>i!=malId); t10.movies=t10.movies.filter(i=>i!=malId); saveTop10(t10);
  saveList(list); closeModal(); updateCounts();
  if (currentView==='list') renderListView();
  if (currentView==='favorites') renderFavorites();
  if (currentView==='top10') renderTop10();
  refreshSearchCards();
  showToast(`"${title}" ${t('deleted')}`);
}

function closeModal() { $('modal-overlay').classList.add('hidden'); _modal=null; }
function closeModalOutside(e) { if (e.target===$('modal-overlay')) closeModal(); }

// ══ PROFILE ═══════════════════════════════════════
function openProfile() { renderProfile(); $('profile-overlay').classList.remove('hidden'); }
function closeProfile() { $('profile-overlay').classList.add('hidden'); }
function closeProfileOutside(e) { if (e.target===$('profile-overlay')) closeProfile(); }

function renderProfile() {
  const list=getList(), arr=Object.values(list);
  const total=arr.length, watching=arr.filter(a=>a.status==='watching').length;
  const completed=arr.filter(a=>a.status==='completed').length;
  const planToWatch=arr.filter(a=>a.status==='planToWatch').length;
  const completionRate=total?Math.round((completed/total)*100):0;
  const genreCount={};
  arr.forEach(a=>(a.genres||[]).forEach(g=>{genreCount[g]=(genreCount[g]||0)+1;}));
  const sortedGenres=Object.entries(genreCount).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxG=sortedGenres[0]?.[1]||1;
  const joined=getUserData(currentUser).joinedAt;
  const joinedStr=joined?new Date(joined).toLocaleDateString(currentLang==='fr'?'fr-FR':'en-US',{month:'long',year:'numeric'}):'';
  const favGenre=sortedGenres[0]?.[0];
  const ini=currentUser.slice(0,2).toUpperCase();
  const genreChart=sortedGenres.length?`
    <div class="profile-section">
      <div class="profile-section-title">${t('fav_genre')}</div>
      <div class="genre-chart">
        ${sortedGenres.map(([g,c])=>`
          <div class="genre-bar-row">
            <span class="genre-bar-name">${esc(g)}</span>
            <div class="genre-bar-track"><div class="genre-bar-fill" style="width:${Math.round((c/maxG)*100)}%"></div></div>
            <span class="genre-bar-count">${c}</span>
          </div>`).join('')}
      </div>
    </div>`:'';
  $('profile-content').innerHTML=`
    <div class="profile-hero">
      <div class="profile-avatar-big">${ini}</div>
      <div>
        <div class="profile-name">${esc(currentUser)}</div>
        <div class="profile-joined">${joinedStr?`${t('member_since')} ${joinedStr}`:''}${favGenre?` · ❤️ ${favGenre}`:''}</div>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-label">${t('total')}</div></div>
      <div class="stat-card"><div class="stat-val">${completed}</div><div class="stat-label">${t('completed_lbl')}</div></div>
      <div class="stat-card"><div class="stat-val">${completionRate}%</div><div class="stat-label">${t('completion')}</div></div>
      <div class="stat-card"><div class="stat-val">${watching}</div><div class="stat-label">${t('watching_lbl')}</div></div>
      <div class="stat-card"><div class="stat-val">${planToWatch}</div><div class="stat-label">${t('plan_lbl')}</div></div>
      <div class="stat-card"><div class="stat-val">${arr.filter(a=>a.favorite).length}</div><div class="stat-label">${t('favorites')}</div></div>
    </div>
    ${genreChart}
  `;
}

// ══ TOP 10 ════════════════════════════════════════
function switchTop10Type(type) {
  currentTop10Type=type;
  document.querySelectorAll('.t10-toggle').forEach(b=>b.classList.toggle('active',b.dataset.top===type));
  $('top10-series-panel').dataset.hidden=type!=='series'?'true':'false';
  $('top10-movies-panel').dataset.hidden=type!=='movies'?'true':'false';
}

function renderTop10() {
  renderTop10Panel('series');
  renderTop10Panel('movies');
}

function renderTop10Panel(type) {
  const list=getList(), t10=getTop10();
  // Normalize IDs to numbers for consistency
  let ranked=(t10[type]||[]).map(Number).filter(id=>list[id]&&list[id].status==='completed'&&(isMovie(list[id])===(type==='movies')));
  if (ranked.length!==(t10[type]||[]).length) { t10[type]=ranked; saveTop10(t10); }

  const allDone=Object.values(list).filter(a=>a.status==='completed'&&(isMovie(a)===(type==='movies')));
  const unranked=allDone.filter(a=>!ranked.includes(Number(a.mal_id)));
  const maxFull=ranked.length>=10;

  const listEl=$(`top10-list-${type}`), emptyEl=$(`top10-empty-${type}`);
  const pickerEl=$(`top10-picker-${type}`), pickerEmptyEl=$(`top10-picker-empty-${type}`);

  if (!ranked.length) { listEl.innerHTML=''; emptyEl.classList.remove('hidden'); emptyEl.textContent=type==='series'?t('finish_series'):t('finish_movies'); }
  else {
    emptyEl.classList.add('hidden');
    listEl.innerHTML=ranked.map((id,i)=>{
      const a=list[id]; if (!a) return '';
      const rc=i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':'rank-n';
      const g=computeGlobal(a.scores);
      const sc=a.scores||{};
      const pills=[
        g!==null?`<span class="t10-score-pill">⭐ <b>${g}</b></span>`:'',
        sc.story?`<span class="t10-score-pill">📖 <b>${sc.story}</b></span>`:'',
        sc.animation?`<span class="t10-score-pill">🎨 <b>${sc.animation}</b></span>`:'',
        sc.music?`<span class="t10-score-pill">🎵 <b>${sc.music}</b></span>`:'',
      ].filter(Boolean).join('');
      return `<div class="top10-item" draggable="true" data-id="${id}" data-type="${type}"
          ondragstart="onDS(event)" ondragover="onDO(event)" ondrop="onDrop(event)" ondragleave="onDL(event)" ondragend="onDE(event)">
        <div class="t10-rank ${rc}">${i+1}</div>
        <img class="t10-thumb" src="${esc(a.image)}" alt="${esc(a.title)}"/>
        <div class="t10-info">
          <div class="t10-title">${esc(a.title)}</div>
          <div class="t10-scores">${pills||`<span style="font-size:11px;color:var(--text2)">—</span>`}</div>
        </div>
        <span class="t10-drag">⠿</span>
        <button class="t10-remove" onclick="removeTop10(${id},'${type}')">✕</button>
      </div>`;
    }).join('');
  }

  if (!unranked.length||maxFull) {
    pickerEl.innerHTML='';
    pickerEmptyEl.textContent=maxFull?t('top10_full'):(type==='movies'?t('all_ranked_movies'):t('all_ranked_series'));
    pickerEmptyEl.classList.remove('hidden');
  } else {
    pickerEmptyEl.classList.add('hidden');
    pickerEl.innerHTML=unranked.map(a=>`
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
  malId=Number(malId);
  const t10=getTop10();
  if (!t10[type]) t10[type]=[];
  const arr=t10[type].map(Number);
  if (arr.includes(malId)||arr.length>=10) return;
  arr.push(malId); t10[type]=arr; saveTop10(t10);
  renderTop10Panel(type);
  showToast(`${t('added_top')} ${type==='movies'?t('films'):t('series')} !`);
}

function removeTop10(malId, type) {
  malId=Number(malId);
  const t10=getTop10();
  t10[type]=(t10[type]||[]).map(Number).filter(id=>id!==malId); saveTop10(t10);
  renderTop10Panel(type);
}

// ── DRAG & DROP ───────────────────────────────────
let _dsrc=null, _dtype=null;
function onDS(e) {
  _dsrc=Number(e.currentTarget.dataset.id);
  _dtype=e.currentTarget.dataset.type;
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed='move';
  e.dataTransfer.setData('text/plain', _dsrc);
}
function onDE(e) {
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.top10-item').forEach(el=>el.classList.remove('drag-over'));
}
function onDO(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect='move';
  if (Number(e.currentTarget.dataset.id)!==_dsrc) e.currentTarget.classList.add('drag-over');
}
function onDL(e) { e.currentTarget.classList.remove('drag-over'); }
function onDrop(e) {
  e.preventDefault();
  const tid=Number(e.currentTarget.dataset.id), type=_dtype;
  e.currentTarget.classList.remove('drag-over');
  if (!_dsrc||_dsrc===tid||!type) return;
  const t10=getTop10();
  const arr=t10[type].map(Number);
  const si=arr.indexOf(_dsrc), di=arr.indexOf(tid);
  if (si===-1||di===-1) return;
  arr.splice(si,1); arr.splice(di,0,_dsrc);
  t10[type]=arr; saveTop10(t10); _dsrc=null;
  renderTop10Panel(type);
}

// ══ UTILS ═════════════════════════════════════════
function $(id) { return document.getElementById(id); }
function esc(s) { if(!s)return''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function statusLbl(s) { return {watching:t('status_watching'),planToWatch:t('status_plan'),completed:t('status_completed')}[s]||s; }

let _rl=0;
function rl() { return new Promise(r=>{ const now=Date.now(), w=Math.max(0,420-(now-_rl)); _rl=now+w; setTimeout(r,w); }); }

let _toastT=null;
function showToast(msg) {
  const el=$('toast'); el.textContent=msg; el.classList.remove('hidden');
  clearTimeout(_toastT); _toastT=setTimeout(()=>el.classList.add('hidden'),2800);
}

// ══ BOOT ══════════════════════════════════════════
(function boot() {
  initAuthTabs();
  initNav();
  initStatusTabs();
  initGenreFilters();

  document.getElementById('search-input')?.addEventListener('keydown', e=>{
    if (e.key==='Enter') { currentSearchPage=1; searchAnime(); }
  });

  ['login-username','login-password'].forEach(id=>$(id)?.addEventListener('keydown',e=>{if(e.key==='Enter')handleLogin();}));
  ['reg-username','reg-password','reg-password2'].forEach(id=>$(id)?.addEventListener('keydown',e=>{if(e.key==='Enter')handleRegister();}));

  applyLang();

  const db=getDB(), saved=db.sessions?.current;
  if (saved&&db.users?.[saved]) loginUser(saved);
})();
