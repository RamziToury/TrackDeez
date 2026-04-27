<div align="center">

# 🎌 Track Deez

**Suis tes animés. Note tes personnages. Classe tes openings.**

Une application web autonome pour traquer tes animés, noter chaque critère qui compte (histoire, animation, OST, ambiance, character design, character development), classer tes morceaux préférés et célébrer ta progression de Néophyte à Encyclopédie.

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
- **15 filtres genre** (Action, Aventure, Comédie, Drame, Fantasy, Horror, Mystery, Romance, Sci-Fi, Slice of Life, Sports, Supernatural, Thriller, Mecha, Isekai)
- **Pagination cliquable** (jusqu'à 248 résultats par requête)
- Filtre **« Masquer ceux déjà ajoutés »**

### ✨ À Découvrir
- Carte swipeable avec animation (skip / à voir / en cours / terminé)
- Persistence du « pas intéressé » pendant **30 jours**
- **Recommandations qui ne s'épuisent jamais** :
  - Pondération par les 3 genres les plus regardés (terminés ×3, en cours ×2, à voir ×1)
  - Pool auto-extensible (jusqu'à 60 items par genre, 4 pages d'API)
  - Bascule automatique en mode « récent » (filtre `start_date`) quand le top all-time est épuisé
  - Fallback sur les top genres secondaires
  - Fallback ultime sur les anime les plus populaires globalement
- **Trailer YouTube embarqué** avec miniature + bouton play (et lien externe en fallback)
- Légende visuelle des **ratings audience** (G → Rx)

### 🏆 Top 10
4 onglets indépendants avec **drag & drop** pour réordonner :
- 📺 Séries
- 🎬 Films
- ▶️ **Openings** (depuis tes favoris)
- ⏹️ **Endings** (depuis tes favoris)

Picker intelligent qui affiche uniquement les morceaux marqués ⭐ favori dans l'onglet Musique.

### 🎬 Fiche d'animé (modale)
3 onglets :

#### 📋 Détails
- Poster + titre + meta tags : Type / Statut diffusion (🟢 en cours, ⚪ terminé, 🔵 prochainement, point pulsant) / Rating audience (G→Rx, code couleur 4 niveaux) / Année / Saison / Score MAL /20 / Épisodes
- Tags **genres + thèmes + démographie** combinés avec bouton « voir tout »
- Synopsis **auto-traduit en français** via Google Translate (fallback MyMemory → original anglais)
- Sliders de notation **0–20 step 0.5** sur 6 critères (visibles si statut = Terminé) :
  - 📖 Histoire
  - 🎨 Animation
  - 🎵 Musiques & OST
  - ✏️ Character Design
  - 🌱 Développement des persos
  - 🌙 Ambiance
- Calcul automatique de la **note globale** (moyenne des 6 critères)
- ⭐ Bouton favori

#### 👥 Personnages
- Top 8 personnages principaux fetché depuis Jikan
- Notation **3 axes par personnage** : Character Design / Histoire perso / Développement
- Note globale par personnage (moyenne des 3 axes)

#### 🎵 Musique
- Tous les openings et endings depuis l'endpoint `/anime/{id}/themes`
- Chaque morceau : numéro / titre / artiste / épisodes
- **Bouton play** qui ouvre une recherche YouTube ciblée (titre anime + titre morceau + artiste)
- **Réactions** par track : 👍 Like / 👎 Dislike / ⭐ Favori
- Notation **0–20 step 0.5** par track (si statut = Terminé)
- **Note musique globale** = moyenne de tous les tracks notés

### 🏅 Système de progression
4 paliers basés sur le nombre d'animes terminés :

| Palier | Animes terminés | Couleur |
|---|---|---|
| 🌱 **Néophyte** | 0 – 9 | Vert |
| ⚔️ **Initié** | 10 – 29 | Bleu |
| 🔥 **Otaku** | 30 – 99 | Rose |
| 📚 **Encyclopédie** | 100+ | Or |

Animation **plein écran « FÉLICITATIONS ! »** au passage de palier :
- Card qui pop avec rebond élastique
- Halo coloré pulsant en arrière-plan
- 80 confettis multicolores qui tombent
- Rayons solaires en rotation
- Light sweep diagonal
- Bouton « Tester l'animation » dans le profil pour prévisualiser

### 👤 Profil
- Avatar (initiales)
- Date d'inscription
- Stats : Total / Terminés / Taux de complétion / En cours / À voir / Favoris
- **Top genres** avec barres de progression
- Badge actuel + grille des 4 paliers
- Barre de progression vers le palier suivant

### 🌐 Internationalisation
- **Français / Anglais** avec switch dans la sidebar
- Traduction automatique des synopsis EN → FR
- Préférence sauvegardée par utilisateur

### 🌌 Bonus
- **Background starfield** animé en canvas (port vanilla d'un composant React, ~80 lignes)
- Couleurs adaptées au thème (sombre par défaut, clair disponible)
- Sidebar translucide avec backdrop-filter pour laisser passer les étoiles
- Sidebar nav avec **flèche qui slide à l'hover** (style MenuVertical)

---

## 🛠️ Stack technique

**Aucune dépendance, aucun bundler, aucun build.**

- **HTML5** + **CSS3** (custom properties, grid, flexbox, animations, backdrop-filter)
- **Vanilla JavaScript ES6+** (fetch API, localStorage, async/await)
- **API Jikan v4** (https://api.jikan.moe) pour toutes les données MyAnimeList
- **Google Translate** (endpoint `gtx`) + **MyMemory** en fallback pour les synopsis FR
- **YouTube** (embed iframe, search results, miniatures `i.ytimg.com`)
- **Storage** : `localStorage` (pas de backend)
- **Polices** : Bebas Neue (display) + Outfit (texte) via Google Fonts

---

## 🚀 Démarrage

Pas de build, pas de `npm install`. Trois fichiers, c'est tout.

```bash
git clone https://github.com/RamziToury/TrackDeez.git
cd TrackDeez
# Ouvre index.html dans ton navigateur, ou avec un petit serveur local :
python -m http.server 8000
# puis http://localhost:8000
```

> ⚠️ Recommandé d'utiliser un serveur local plutôt qu'`open index.html` directement, certains navigateurs bloquent les requêtes `fetch` en `file://` selon la config CORS.

---

## 📁 Architecture

```
trackdeez/
├── index.html      # Structure DOM, modales, overlays, SVG defs (gradients logo)
├── style.css       # Design system (CSS variables, thèmes), composants, animations
├── app.js          # Logique complète : auth, storage, API, render, drag&drop, i18n
└── README.md       # ce fichier
```

### Modules logiques dans `app.js`

| Section | Responsabilité |
|---|---|
| `getDB / saveDB / getList / saveList / getTop10 / saveTop10` | Wrapper localStorage par utilisateur |
| `handleLogin / handleRegister / loginUser / handleLogout` | Auth basique (hash maison, multi-utilisateurs) |
| `applyLang / t()` | i18n FR/EN avec `T_DICT` |
| `renderListView / renderTop10 / renderProfile / etc.` | Rendu des vues |
| `searchAnime / initDiscover / loadCharacters / loadThemes` | Fetch Jikan rate-limité (`rl()` 420ms) |
| `getStatusInfo / getRatingInfo / extractTrailerId` | Helpers de parsing API |
| `translateText / getTranslatedSynopsis` | Pipeline Google → MyMemory → original |
| `Starfield` | Animation canvas plein écran |
| `BADGES / getUserBadge / checkBadgeUnlock / showBadgeUnlock` | Système de progression |
| `onDS / onDO / onDrop / onDE / onDL` | Drag & drop générique (primitives + objets) |

### Modèle de données utilisateur

```js
db.users[username] = {
  password,           // hash maison (à NE PAS utiliser en prod)
  list: {             // Animes trackés
    [malId]: {
      mal_id, title, image, episodes, synopsis, genres, themes, demographics,
      year, type, score, trailer_id, season, status_airing, rating,
      status,         // 'watching' | 'planToWatch' | 'completed'
      currentEp,
      scores: { story, animation, music, chardesign, chardev, ambiance },  // /20 step 0.5
      favorite,
      addedAt,
      // Onglet Personnages
      characters: [{ id, name, image }],          // top 8 main, fetched lazy
      characterScores: {
        [charId]: { charadesign, backstory, dev }
      },
      // Onglet Musique
      musicReactions: {
        [themeKey]: { reaction:'like|dislike|null', favorite, title, artist, eps, type, index }
      },
      musicScores: { [themeKey]: number }          // /20 step 0.5
    }
  },
  top10: {
    series:   [malId, ...],                        // primitives
    movies:   [malId, ...],
    openings: [{ id, malId, themeKey, title, ... }],  // objets (snapshot)
    endings:  [{ ... }]
  },
  skipped: { [malId]: timestamp },                 // « pas intéressé » TTL 30j
  theme: 'dark' | 'light',
  joinedAt,
  lastBadge                                        // pour détecter les progressions
}
```

---

## 🔌 Endpoints API utilisés

| Endpoint | Usage |
|---|---|
| `GET /anime?q=...&genres=...&page=...` | Recherche + Discover pool |
| `GET /anime/{id}` | Backfill modale |
| `GET /anime/{id}/characters` | Onglet Personnages |
| `GET /anime/{id}/themes` | Onglet Musique (openings/endings) |
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

Polices : **Bebas Neue** (titres, view-titles, badges) + **Outfit** (texte courant).

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

---

## 📄 Licence

Projet personnel sans licence définie. Utilise-le, fork-le, modifie-le librement.

---

<div align="center">
Fait avec ☕ et un 🌙 par <a href="https://github.com/RamziToury">@RamziToury</a>
</div>
