<div align="center">

# 🎌 Track Deez

**Suis tes animés. Note tes personnages. Classe tes openings. Débloque tes titres.**

Une application web autonome pour traquer tes animés, noter chaque critère qui compte (histoire, animation, OST, ambiance, character design, character development), classer tes morceaux préférés, débloquer des **achievements** comme Hokage / Shinigami / Saiyan, et célébrer ta progression de Néophyte à Encyclopédie.

[Issues](https://github.com/RamziToury/TrackDeez/issues) • [Pull Requests](https://github.com/RamziToury/TrackDeez/pulls)

</div>

---

## ✨ Fonctionnalités

### 📋 Ma Liste
- **4 statuts** : En cours / À voir / Terminé / ⭐ Favoris
- **Tri** : récent, A→Z, Z→A, note ↓, note ↑
- Séparation automatique **séries** / **films**
- Compteurs en temps réel par statut

### 🔍 Recherche
- Recherche par titre via l'API Jikan (MyAnimeList)
- **15 filtres genre** + **5 filtres démographie** (Shōnen, Shōjo, Seinen, Josei, Kids — IDs MAL : 27 / 25 / 42 / 43 / 15)
- **Pagination cliquable** (jusqu'à 248 résultats par requête)
- 2 cases à cocher : **« Masquer ceux déjà ajoutés »** + **« Masquer le contenu sensible (Rx) »**

### ✨ À Découvrir
Layout 3 colonnes :
- **Gauche** : Recommandations personnalisées + Légende rating
- **Centre** : Carte swipeable (skip / à voir / en cours / terminé)
- **Droite** : Trailer YouTube + Reviews

Détails :
- Persistence du « pas intéressé » pendant **30 jours**
- **Recommandations qui ne s'épuisent jamais** :
  - Pondération par les 3 genres les plus regardés (terminés ×3, en cours ×2, à voir ×1)
  - Pool auto-extensible (jusqu'à 60 items par genre, 4 pages d'API)
  - Bascule automatique en mode « récent » (filtre `start_date`) quand le top all-time est épuisé
  - Fallback sur les top genres secondaires
  - Fallback ultime sur les anime les plus populaires globalement
- **Trailer YouTube** : miniature toujours visible + bouton play (embed nocookie au clic) + lien externe garanti
- **Reviews** : 2 avis compacts par anime, badges Spoiler/Préliminaire, click-to-reveal sur les spoilers

### 🏆 Top 10
4 onglets indépendants avec **drag & drop** pour réordonner :
- 📺 Séries
- 🎬 Films
- ▶️ **Openings** (depuis tes ⭐ favoris dans l'onglet Musique)
- ⏹️ **Endings** (depuis tes ⭐ favoris)

### 🎯 Achievements
Onglet dédié avec :
- **Badge principal en grand** (Néophyte/Initié/Otaku/Encyclopédie) avec barre de progression vers le palier suivant
- **16 succès thématiques** déblocables :

| Achievement | Condition |
|---|---|
| ⚔️ **Warrior** | Terminer 20 shōnen |
| 🛐 **Saint** | Terminer 20 seinen |
| 🌸 **Magicienne** | Terminer 20 shōjo |
| 🌹 **Femme fatale** | Terminer 20 josei |
| 🧸 **Innocent** | Terminer 20 anime "kids" |
| ☠️ **Pirate** | Atteindre l'épisode 500 de One Piece |
| 🥷 **Ninja** | Terminer Naruto original (220 ép) |
| 🍥 **Hokage** | Terminer Naruto Shippūden (500 ép) |
| ⚰️ **Shinigami** | Terminer Bleach (366 ép, hors films & TYBW) |
| 🐉 **Saiyan** | Terminer Dragon Ball Z (291 ép) |
| 🎭 **No Name** | Terminer Monster (74 ép) |
| ⏳ **Time Traveler** | Terminer Steins;Gate + Steins;Gate 0 |
| 🎯 **Hunter** | Terminer Hunter x Hunter 2011 (148 ép) |
| 🗡️ **Titan** | Terminer Attack on Titan saisons 1, 2 et 3 |
| ⚗️ **Alchemist** | Terminer Fullmetal Alchemist Brotherhood |
| 🧿 **Exorcist** | Terminer Jujutsu Kaisen S1 + S2 |

Cards avec couleur signature, état grisé tant que verrouillé, barre de progression en temps réel.

### 🎬 Fiche d'animé (modale)
4 onglets :

#### 📰 Reviews
- Endpoint Jikan `/anime/{id}/reviews?preliminary=true&spoilers=true`
- Avatar utilisateur, score /10, date, badges Préliminaire / Spoiler
- **Click-to-reveal** sur les spoilers (cover rayé rouge avec icône ⚠️)
- Show more/less pour les longs avis
- Lien externe vers la review complète sur MAL

#### 📋 Détails
- Poster + meta tags : Type / **Statut diffusion** (🟢 en cours avec point pulsant, ⚪ terminé, 🔵 prochainement) / **Rating audience** (G→Rx, code couleur 4 niveaux) / Année / Saison / Score MAL /20 / Épisodes
- Tags **genres + thèmes + démographie** combinés avec bouton « voir tout »
- Synopsis **auto-traduit en français** (Google Translate primaire, MyMemory fallback, original anglais en dernier recours)
- Sliders de notation **0–20 step 0.5** sur 6 critères :
  - 📖 Histoire / 🎨 Animation / 🎵 Musiques & OST / ✏️ Character Design / 🌱 Développement / 🌙 **Ambiance**
- Note globale automatique (moyenne)

#### 👥 Personnages
- Top 8 personnages principaux fetché depuis Jikan
- Notation **3 axes par personnage** : Character Design / Histoire perso / Développement

#### 🎵 Musique
- Tous les openings et endings via `/anime/{id}/themes`
- **Bouton play** qui ouvre une recherche YouTube ciblée
- **Réactions** par track : 👍 Like / 👎 Dislike / ⭐ Favori (le favori débloque l'ajout au Top 10 OPs/EDs)
- Notation /20 par track (si statut Terminé)
- Note musique globale automatique

### 🏅 Système de progression
4 paliers basés sur le nombre d'animes terminés :

| Palier | Animes terminés | Couleur |
|---|---|---|
| 🌱 **Néophyte** | 0 – 9 | Vert |
| ⚔️ **Initié** | 10 – 29 | Bleu |
| 🔥 **Otaku** | 30 – 99 | Rose |
| 📚 **Encyclopédie** | 100+ | Or |

Animation **plein écran « FÉLICITATIONS ! »** au passage de palier : card pop-bounce, halo pulsant, 80 confettis multicolores, rayons solaires en rotation, light sweep, emoji bouncing.

### 👤 Profil
- **Avatar cliquable** : ouvre un sélecteur permettant de choisir un personnage parmi les animés ⭐ favoris
- **Pseudo** (nom affiché) distinct de l'**identifiant** (login)
- **Podium 🏆** avec le top 3 séries (or/argent/bronze, image + nom, cliquable vers la fiche)
- Stats : Total / Terminés / Taux de complétion / En cours / À voir / Favoris
- **Top genres** avec barres de progression
- Badge actuel + grille des 4 paliers + barre de progression vers le palier suivant

### 💖 Don
Onglet dédié pour soutenir le projet via PayPal (lien `paypal.me/RamziToury`).

### 🌐 Internationalisation
- **Français / Anglais** avec switch dans la sidebar
- Traduction automatique des synopsis EN → FR
- Préférence sauvegardée par utilisateur

### 🌌 Bonus
- **Background starfield** animé en canvas (vanilla)
- Sidebar nav avec **flèche qui slide à l'hover** (style MenuVertical, sans emojis)
- Sidebar translucide avec backdrop-filter

---

## 🛠️ Stack technique

**Aucune dépendance, aucun bundler, aucun build.**

- **HTML5** + **CSS3** (custom properties, grid, flexbox, animations, backdrop-filter)
- **Vanilla JavaScript ES6+** (fetch API, localStorage, async/await)
- **API Jikan v4** (https://api.jikan.moe) pour toutes les données MyAnimeList
- **Google Translate** + **MyMemory** en fallback pour les synopsis FR
- **YouTube** (embed iframe, search results, miniatures `i.ytimg.com`)
- **Storage** : `localStorage` (pas de backend)
- **Polices** : Bebas Neue (display) + Outfit (texte) via Google Fonts

---

## 🚀 Démarrage

```bash
git clone https://github.com/RamziToury/TrackDeez.git
cd TrackDeez
python -m http.server 8000
# http://localhost:8000
```

> ⚠️ Recommandé d'utiliser un serveur local plutôt qu'`open index.html` directement, certains navigateurs bloquent les requêtes `fetch` en `file://`.

---

## 📁 Architecture

```
trackdeez/
├── index.html      # Structure DOM, modales, overlays, SVG defs
├── style.css       # Design system, composants, animations
├── app.js          # Logique complète : auth, storage, API, render, drag&drop, i18n
└── README.md       # ce fichier
```

### Modules logiques dans `app.js`

| Section | Responsabilité |
|---|---|
| `getDB / saveDB / getList / saveList / getTop10` | Wrapper localStorage par utilisateur |
| `handleLogin / handleRegister / loginUser` | Auth basique (hash maison) avec username + pseudo séparés |
| `applyLang / t()` | i18n FR/EN avec `T_DICT` |
| `renderListView / renderTop10 / renderProfile / renderAchievements` | Rendu des vues |
| `searchAnime / initDiscover / loadCharacters / loadThemes / loadReviews` | Fetch Jikan rate-limité (`rl()` 420ms) |
| `getStatusInfo / getRatingInfo / extractTrailerId` | Helpers de parsing API |
| `translateText / getTranslatedSynopsis` | Pipeline Google → MyMemory → original |
| `Starfield` | Animation canvas plein écran |
| `BADGES / getUserBadge / checkBadgeUnlock / showBadgeUnlock` | Système de paliers + animation FÉLICITATIONS |
| `ACHIEVEMENTS / checkAchievement` | 16 succès thématiques (démographies, anime spécifiques, séries multi-saisons) |
| `onDS / onDO / onDrop / onDE / onDL` | Drag & drop générique (primitives + objets) |
| `openAvatarPicker / setProfilePic` | Sélecteur de photo de profil depuis perso d'animes favoris |

### Modèle de données utilisateur

```js
db.users[username] = {
  password,           // hash maison
  pseudo,             // nom affiché (séparé du login)
  profilePic,         // URL d'image de personnage
  list: {
    [malId]: {
      mal_id, title, image, episodes, synopsis, genres, themes, demographics,
      year, type, score, trailer_id, season, status_airing, rating,
      status, currentEp, favorite, addedAt,
      scores: { story, animation, music, chardesign, chardev, ambiance },
      // Onglet Personnages
      characters: [{ id, name, image }],
      characterScores: { [charId]: { charadesign, backstory, dev } },
      // Onglet Musique
      musicReactions: { [themeKey]: { reaction, favorite, title, artist, eps, type, index } },
      musicScores: { [themeKey]: number }
    }
  },
  top10: {
    series:   [malId, ...],
    movies:   [malId, ...],
    openings: [{ id, malId, themeKey, title, ... }],
    endings:  [{ ... }]
  },
  skipped: { [malId]: timestamp },   // TTL 30j
  theme: 'dark' | 'light',
  lang:  'fr' | 'en',
  joinedAt,
  lastBadge                          // pour détecter les progressions de palier
}
```

---

## 🔌 Endpoints API utilisés

| Endpoint | Usage |
|---|---|
| `GET /anime?q=...&genres=...&page=...` | Recherche + Discover pool |
| `GET /anime/{id}` | Backfill modale |
| `GET /anime/{id}/characters` | Onglet Personnages + Avatar picker |
| `GET /anime/{id}/themes` | Onglet Musique (openings/endings) |
| `GET /anime/{id}/reviews?preliminary=true&spoilers=true` | Onglet Reviews + panneau Discover |
| `GET /top/anime?filter=bypopularity` | Fallback ultime des recommandations |
| `GET https://translate.googleapis.com/translate_a/single` | Traduction primaire |
| `GET https://api.mymemory.translated.net/get` | Traduction fallback |
| `GET https://i.ytimg.com/vi/{id}/maxresdefault.jpg` | Miniature trailer |

Rate-limit Jikan respecté via `rl()` (420ms entre les requêtes).

---

## 🎨 Design system

```css
--accent:  #7c5cfc;   /* violet primaire */
--accent2: #a47dff;   /* violet clair */
--accent3: #06d2e0;   /* cyan secondaire */
--gold:    #f6c90e;   /* doré (Top 10, badges) */
```

Gradient signature : `linear-gradient(135deg, #7c5cfc, #a47dff, #06d2e0)` — logo, sliders, boutons CTA.

Polices : **Bebas Neue** (titres, badges) + **Outfit** (texte courant).

Mode sombre par défaut, mode clair via toggle dans la sidebar.

---

## 🙏 Crédits

- Données anime : [Jikan REST API v4](https://docs.api.jikan.moe/) (proxy non officiel de [MyAnimeList](https://myanimelist.net/))
- Traductions : [Google Translate](https://translate.google.com/) + [MyMemory](https://mymemory.translated.net/)
- Trailers : [YouTube](https://www.youtube.com/)
- Icônes : SVG inline inspirées de [Lucide](https://lucide.dev/)
- Polices : [Google Fonts](https://fonts.google.com/) — Bebas Neue, Outfit

---

## 🗺️ Roadmap (idées)

- [ ] Export / import des données utilisateur (JSON)
- [ ] Mode hors-ligne / PWA installable
- [ ] Synchronisation cross-device (backend optionnel)
- [ ] Statistiques avancées (heatmap année, durée totale visionnée)
- [ ] Recommandations basées sur la similarité des notes (collaborative filtering)
- [ ] Partage d'un Top 10 via lien public
- [ ] Notifications de nouveaux épisodes pour les anime « en cours »
- [ ] Plus d'achievements thématiques

---

## 📄 Licence

Projet personnel sans licence définie. Utilise-le, fork-le, modifie-le librement.

---

<div align="center">
Fait avec ☕ et un 🌙 par <a href="https://github.com/RamziToury">@RamziToury</a>
</div>
