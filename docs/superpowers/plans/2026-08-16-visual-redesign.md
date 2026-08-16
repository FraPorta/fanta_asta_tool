# Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Fanta Asta Tool to the "Notte teal" design — split shell with a fixed squad rail, accent cards in the grid, dense rows in the list view — without changing any behaviour or data.

**Architecture:** A CSS custom-property token layer lives in `index.html`. Component styling moves out of scattered Tailwind colour utilities into semantic classes (`.fa-card`, `.fa-btn-primary`, `.is-bought`) so that JavaScript toggles *state*, never colours. `js/app.js` render functions emit the new markup; every existing control class and element id is preserved so event wiring is untouched.

**Tech Stack:** Vanilla JS (classic scripts, no build step), Tailwind Play CDN 3.4.16 (vendored, compiles runtime-inserted classes via MutationObserver), SheetJS (vendored), Node ≥18 for tests.

## Global Constraints

- **No behavioural change.** Same features, same `localStorage` state shape, same import/export JSON format, same `calculateRecommendedPrice` multipliers.
- **Do not touch** `js/parser.js` or `test/parser.test.js`. `node test/parser.test.js` must stay green after every task.
- **No new runtime dependency and no build step.** Everything served locally from `resources/`.
- **Offline-capable:** no new network requests at runtime. Inter is vendored to `resources/fonts/`.
- **Every player card variant must keep all five control classes** — `.buy-btn`, `.toggle-remove-btn`, `.move-player-btn`, `.permanent-delete-btn`, `.favorite-btn` — and the input `id="paid-price-${player.id}"`. `addPlayerCardEventListeners` calls `card.querySelector(...)` on each with **no null guard**; a missing control throws a TypeError and the whole grid fails to render.
- **Tokens are the only place colours are defined.** No new `bg-gray-*`, `bg-green-*`, `bg-red-*`, `text-cyan-*` utilities in redesigned code.
- **Element ids bound at script parse time must never disappear.** `js/app.js:281-299` runs
  `document.getElementById(...)` at top level for `players-container`, `remaining-budget`,
  `squad-count`, `empty-squad-msg`, `squad-P|D|C|A`, `squad-P|D|C|A-section`. `updateUI()` writes to
  `remainingBudgetEl` and `squadCountEl` with no null guard — if either id is missing the app throws
  on every state change. Moving an element is fine; dropping its id is not.
- Language of all user-visible copy stays Italian.
- Commit after every task with author `FraPorta <francy857@gmail.com>` (repo config already matches).

## Two deviations from the mockups, resolved here

1. **Cards have four actions, not two.** The mockups showed Compra + remove. Real cards also carry *Rimuovi/Ripristina*, *Sposta Categoria* and *Elimina definitivamente*. Resolution: **Compra stays the filled primary; the other three become quiet 32px icon buttons in a row beside it**, each with `title` and `aria-label`. No overflow menu — one-click access matters more during an auction.
2. **"Prezzo Consigliato" is currently an editable input** (`#rec-price-${id}`). Grep confirms **nothing reads it** — it is write-only decoration. Resolution: it becomes the static hero number from the design. The `paid-price` input stays a real input.

## File Structure

| File | Responsibility | Change |
| --- | --- | --- |
| `index.html` | Token layer, component CSS, page shell, modals | Modified |
| `js/app.js` | Render functions emitting new markup | Modified |
| `resources/fonts/*.woff2` | Inter served locally | Created |
| `test/card-contract.test.js` | Guards the five-control contract + token discipline | Created |
| `js/parser.js`, `test/parser.test.js` | — | Untouched |

---

### Task 1: Token layer and local Inter

**Files:**
- Modify: `index.html:10` (Google Fonts link), `index.html:11-…` (`<style>` block)
- Create: `resources/fonts/inter-400.woff2`, `inter-600.woff2`, `inter-700.woff2`, `inter-800.woff2`

**Interfaces:**
- Consumes: nothing
- Produces: CSS custom properties on `:root` (`--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-muted`, `--text-dim`, `--primary`, `--primary-strong`, `--bought`, `--removed`, `--accent`, `--role-p-bg`/`--role-p-fg` … `--role-a-bg`/`--role-a-fg`, `--radius-sm|md|lg`), and the utility classes `.num` (tabular numerals) and `.fa-surface`.

- [ ] **Step 1: Download the four Inter weights**

Google's CSS returns several unicode-range slices per weight; this picks the **latin** one
(`unicode-range` starting `U+0000-00FF`) for each weight and downloads it. Run verbatim:

```bash
cd /home/fporta/Documents/fanta_asta_tool-1
mkdir -p resources/fonts
python3 - <<'EOF'
import re, urllib.request
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36'}
url = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap'
css = urllib.request.urlopen(urllib.request.Request(url, headers=UA)).read().decode()
blocks = re.findall(r'@font-face\s*\{[^}]*\}', css)
for weight in (400, 600, 700, 800):
    latin = [b for b in blocks
             if f'font-weight: {weight};' in b and 'U+0000-00FF' in b]
    assert latin, f'slice latin mancante per il peso {weight}'
    src = re.search(r'url\((https://[^)]+\.woff2)\)', latin[-1]).group(1)
    data = urllib.request.urlopen(urllib.request.Request(src, headers=UA)).read()
    open(f'resources/fonts/inter-{weight}.woff2', 'wb').write(data)
    print(f'inter-{weight}.woff2  {len(data)} byte')
EOF
ls -l resources/fonts/   # 4 file, ognuno non vuoto
```

- [ ] **Step 2: Remove the Google Fonts link**

Delete this line from `index.html` (currently line 10):

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 3: Add `@font-face` and the token layer at the top of the `<style>` block**

Insert immediately after `<style>`, before the existing `body { … }` rule:

```css
@font-face { font-family:'Inter'; font-weight:400; font-display:swap; src:url('resources/fonts/inter-400.woff2') format('woff2'); }
@font-face { font-family:'Inter'; font-weight:600; font-display:swap; src:url('resources/fonts/inter-600.woff2') format('woff2'); }
@font-face { font-family:'Inter'; font-weight:700; font-display:swap; src:url('resources/fonts/inter-700.woff2') format('woff2'); }
@font-face { font-family:'Inter'; font-weight:800; font-display:swap; src:url('resources/fonts/inter-800.woff2') format('woff2'); }

:root {
    --bg:            #080d18;
    --surface:       #0f1729;
    --surface-2:     #131d33;
    --border:        #223050;
    --text:          #f8fafc;
    --text-muted:    #8595b0;
    --text-dim:      #5b6b86;

    --primary:       #14b8a6;
    --primary-strong:#0d9488;
    --bought:        #22c55e;
    --removed:       #f43f5e;
    --accent:        #f59e0b;

    --role-p-bg: #1e3a8a; --role-p-fg: #bfdbfe;
    --role-d-bg: #065f46; --role-d-fg: #a7f3d0;
    --role-c-bg: #78350f; --role-c-fg: #fde68a;
    --role-a-bg: #7f1d1d; --role-a-fg: #fecaca;

    --radius-sm: 10px;
    --radius-md: 14px;
    --radius-lg: 16px;
}

body {
    font-family: 'Inter', system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
}

.num { font-variant-numeric: tabular-nums; }

.fa-surface {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
}
```

Then delete the old `body { font-family: 'Inter', sans-serif; }` rule so it is not defined twice.

- [ ] **Step 4: Remove the page's hard-coded background class**

In `index.html`, the `<body>` tag carries Tailwind background/text classes (e.g. `bg-gray-900 text-white`). Remove only those two colour utilities — the body colours now come from the token layer. Leave any layout classes on `<body>` untouched.

- [ ] **Step 5: Verify**

```bash
node test/parser.test.js >/dev/null && echo "parser OK"
grep -c "fonts.googleapis.com" index.html   # expected: 0
ls resources/fonts/*.woff2 | wc -l          # expected: 4
```

Then reload `http://127.0.0.1:8765/index.html`: the page must still render with Inter (not a fallback serif), on the new near-black background. Layout will still be the old one — that is expected at this stage.

- [ ] **Step 6: Commit**

```bash
git add index.html resources/fonts
git commit -m "Aggiungi token di design e Inter in locale"
```

---

### Task 2: Card contract test and state-class refactor

This task changes **no visuals**. It removes the coupling that would otherwise break when cards are restyled: `addPlayerCardEventListeners` currently mutates Tailwind colour utilities directly (`classList.replace('bg-green-600', 'bg-gray-600')`, `bg-red-600` ↔ `bg-yellow-600`). Those class names disappear in Task 3, so state handling must move to semantic classes first.

**Files:**
- Create: `test/card-contract.test.js`
- Modify: `js/app.js:750-920` (three card creators), `js/app.js:922-1015` (`addPlayerCardEventListeners`), `index.html` `<style>` block

**Interfaces:**
- Consumes: tokens from Task 1
- Produces: CSS classes `.is-bought`, `.is-removed`, `.is-favorite` on `.player-card`; `.fa-btn-primary`, `.fa-btn-icon` on controls; guarantees the five-control contract that Tasks 3–4 must honour.

- [ ] **Step 1: Write the failing contract test**

Create `test/card-contract.test.js`:

```javascript
// Contratto delle card giocatore. Non serve un DOM: analizza il sorgente di js/app.js.
// `addPlayerCardEventListeners` chiama querySelector su questi controlli senza null-check:
// se una variante di card ne perde uno, il render dell'intera griglia va in errore.
const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
let failures = 0;

function check(name, ok) {
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name}`);
    if (!ok) failures++;
}

function bodyOf(fnName) {
    const start = SRC.indexOf(`function ${fnName}(`);
    if (start === -1) throw new Error(`funzione non trovata: ${fnName}`);
    const next = SRC.indexOf('\nfunction ', start + 1);
    return SRC.slice(start, next === -1 ? SRC.length : next);
}

const CONTROLS = ['buy-btn', 'toggle-remove-btn', 'move-player-btn', 'permanent-delete-btn', 'favorite-btn'];
const CREATORS = ['createLargePlayerCard', 'createSmallPlayerCard', 'createListPlayerCard'];

console.log('contratto controlli card');
for (const creator of CREATORS) {
    const body = bodyOf(creator);
    for (const control of CONTROLS) {
        check(`${creator} contiene .${control}`, body.includes(control));
    }
    check(`${creator} contiene input paid-price`, body.includes('paid-price-${player.id}'));
}

console.log('disciplina dei colori');
const LEGACY = /\b(bg|text|border)-(gray|green|red|cyan|yellow|purple|amber)-\d{3}\b/g;
for (const creator of CREATORS) {
    const found = [...new Set(bodyOf(creator).match(LEGACY) || [])];
    check(`${creator} non usa utility colore legacy${found.length ? ' — trovate: ' + found.join(', ') : ''}`, found.length === 0);
}
const listeners = bodyOf('addPlayerCardEventListeners');
check('addPlayerCardEventListeners non manipola classi colore',
    !/classList\.(replace|add|remove)\(\s*'(bg|text|hover:bg)-/.test(listeners));

console.log(failures === 0 ? '\nTutti i test superati.' : `\n${failures} test falliti.`);
process.exit(failures === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it and watch it fail**

```bash
node test/card-contract.test.js
```

Expected: the five control checks PASS (current cards already have them), the colour-discipline checks FAIL — the creators are full of `bg-gray-800`, `bg-green-600`, etc., and the listener replaces `bg-green-600`.

- [ ] **Step 3: Add state and control classes to the stylesheet**

Append to the `<style>` block in `index.html`:

```css
.player-card { position: relative; transition: transform .18s ease-out, box-shadow .18s ease-out, opacity .25s ease-out; }
.player-card.is-bought   { border-color: var(--bought); opacity: .55; }
.player-card.is-bought .buy-btn,
.player-card.is-bought input { pointer-events: none; }
.player-card.is-removed  { border-color: var(--removed); opacity: .5; }
.player-card.is-favorite { box-shadow: 0 0 0 1px var(--accent); }
.player-card.is-bought.is-favorite,
.player-card.is-removed.is-favorite { box-shadow: none; }

.fa-btn-primary {
    background: linear-gradient(180deg, var(--primary), var(--primary-strong));
    color: #04201d; font-weight: 800; border-radius: var(--radius-sm);
    padding: 10px 16px; transition: filter .15s ease-out;
}
.fa-btn-primary:hover:not(:disabled) { filter: brightness(1.08); }
.fa-btn-primary:disabled { background: #24324e; color: var(--text-dim); cursor: not-allowed; }

.fa-btn-icon {
    width: 32px; height: 32px; border-radius: var(--radius-sm);
    background: rgba(148,163,184,.08); color: var(--text-dim);
    display: inline-flex; align-items: center; justify-content: center;
    transition: background .15s ease-out, color .15s ease-out;
}
.fa-btn-icon:hover:not(:disabled) { background: rgba(148,163,184,.16); color: var(--text); }
.fa-btn-icon:disabled { opacity: .4; cursor: not-allowed; }
.fa-btn-icon.is-danger:hover { color: var(--removed); }
.fa-btn-icon.is-active { color: var(--accent); }
```

Keep the existing `.bought`, `.bought-by-me`, `.removed-card`, `.favorite-card` rules for now — Task 3 deletes them once nothing references them.

- [ ] **Step 4: Switch the three creators to state classes**

In each of `createLargePlayerCard`, `createSmallPlayerCard`, `createListPlayerCard`, replace the border-class block:

```javascript
    let borderClass = '';
    if (isBoughtByMe) {
        borderClass = 'bought-by-me';
    } else if (isRemoved) {
        borderClass = 'removed-card';
    } else if (isFavorite) {
        borderClass = 'favorite-card';
    }
```

with:

```javascript
    // Priorità stati: acquistato > rimosso > preferito
    const stateClass = isBoughtByMe ? 'is-bought' : (isRemoved ? 'is-removed' : (isFavorite ? 'is-favorite' : ''));
```

and in the `card.className = …` line replace `${borderClass} ${isRemoved ? 'bought' : ''}` with `${stateClass}`.

- [ ] **Step 5: Switch the listener to state classes**

In `addPlayerCardEventListeners`, replace the `isBoughtByMe` block:

```javascript
    if (isBoughtByMe) {
        const buyBtn = card.querySelector('.buy-btn');
        if (buyBtn) {
            buyBtn.disabled = true;
            buyBtn.textContent = 'Acquistato';
        }
        const toggleBtn = card.querySelector('.toggle-remove-btn');
        if (toggleBtn) toggleBtn.disabled = true;
    }
```

and in the `.toggle-remove-btn` handler replace the class/colour juggling with:

```javascript
        const nowRemoved = !card.classList.contains('is-removed');
        card.classList.toggle('is-removed', nowRemoved);
        card.classList.toggle('is-favorite', !nowRemoved && state.favorites.includes(playerId));
        if (nowRemoved) {
            if (!state.removedPlayers.includes(playerId)) state.removedPlayers.push(playerId);
        } else {
            state.removedPlayers = state.removedPlayers.filter(id => id !== playerId);
        }
        button.title = nowRemoved ? 'Ripristina' : 'Rimuovi dalla lista';
        button.setAttribute('aria-label', button.title);
        button.classList.toggle('is-active', nowRemoved);
        saveState();
```

Note the behaviour preserved exactly: toggling never applies to a player already in the squad (the early `if (isBoughtByMe) return;` guard above stays).

- [ ] **Step 6: Run the contract test and the parser test**

```bash
node test/card-contract.test.js   # expected: tutti i test superati
node test/parser.test.js >/dev/null && echo "parser OK"
node --check js/app.js && echo "syntax OK"
```

The colour-discipline check on the *creators* will still fail if legacy utilities remain in their markup — that is fine and expected until Task 3; if you want the suite green at this point, restrict the run to the control checks. Do **not** weaken the test to make it pass.

- [ ] **Step 7: Reload the page and confirm nothing changed functionally**

At `http://127.0.0.1:8765/index.html`: buy a player (card dims, button reads "Acquistato" and is disabled), remove one (rose border), favourite one (amber ring), reload the page and confirm the states survived.

- [ ] **Step 8: Commit**

```bash
git add js/app.js index.html test/card-contract.test.js
git commit -m "Sostituisci le classi colore di stato con classi semantiche"
```

---

### Task 3: Grid card (Grande + Piccola)

**Files:**
- Modify: `js/app.js:750-865` (`createLargePlayerCard`, `createSmallPlayerCard`), `index.html` `<style>` block

**Interfaces:**
- Consumes: tokens (Task 1), `.is-*` state classes and `.fa-btn-*` (Task 2)
- Produces: `.fa-card` + `[data-tier]` accent styling reused by Task 4's list rows for tier colour.

- [ ] **Step 1: Add card and tier CSS**

Append to the `<style>` block:

```css
.fa-card {
    position: relative; overflow: hidden;
    background: linear-gradient(160deg, var(--surface-2), #0d1526);
    border: 1px solid var(--border); border-radius: var(--radius-lg);
    padding: 15px; display: flex; flex-direction: column; gap: 12px;
}
.fa-card::before { content:''; position:absolute; inset:0 0 auto 0; height:3px; background: var(--tier-accent, #475569); }
.fa-card::after {
    content:''; position:absolute; right:-40px; top:-40px; width:130px; height:130px; border-radius:50%;
    background: radial-gradient(circle, var(--tier-glow, transparent), transparent 70%); pointer-events:none;
}
.fa-card > * { position: relative; }

.fa-card[data-tier="Top"]        { --tier-accent: linear-gradient(90deg,#f59e0b,#fb7185); --tier-glow: rgba(245,158,11,.16); }
.fa-card[data-tier="Buoni"]      { --tier-accent: linear-gradient(90deg,#14b8a6,#38bdf8); --tier-glow: rgba(20,184,166,.14); }
.fa-card[data-tier="Scommesse"]  { --tier-accent: linear-gradient(90deg,#a78bfa,#6366f1); --tier-glow: rgba(167,139,250,.14); }
.fa-card[data-tier="Altri"]      { --tier-accent: #475569; --tier-glow: transparent; }

.fa-crest { width:34px; height:34px; border-radius:var(--radius-sm); object-fit:contain; background:rgba(255,255,255,.06); flex-shrink:0; }
.fa-name  { font-size:16px; font-weight:750; letter-spacing:-.01em; color:var(--text); line-height:1.2; }
.fa-sub   { font-size:11px; color:var(--text-muted); display:flex; align-items:center; gap:6px; margin-top:3px; }
.fa-role  { font-size:10px; font-weight:800; padding:1px 6px; border-radius:6px; }
.fa-role[data-role="P"] { background:var(--role-p-bg); color:var(--role-p-fg); }
.fa-role[data-role="D"] { background:var(--role-d-bg); color:var(--role-d-fg); }
.fa-role[data-role="C"] { background:var(--role-c-bg); color:var(--role-c-fg); }
.fa-role[data-role="A"] { background:var(--role-a-bg); color:var(--role-a-fg); }
.fa-hero  { font-size:30px; font-weight:800; line-height:1; letter-spacing:-.02em; color:var(--text); }
.fa-hero-label { font-size:12px; color:var(--text-muted); font-weight:600; }
.fa-meta  { font-size:11px; color:var(--text-muted); }
.fa-meta b { color:#5eead4; font-weight:700; }
.fa-input {
    width:74px; background:rgba(2,6,23,.6); border:1px solid #2b3a5c; border-radius:var(--radius-sm);
    padding:9px; color:var(--text); text-align:center; font-weight:700; min-height:44px;
}
.fa-input:focus { outline:none; border-color:var(--primary); box-shadow:0 0 0 2px rgba(20,184,166,.25); }

.fa-card.compact { padding:11px; gap:8px; }
.fa-card.compact .fa-hero { font-size:22px; }
.fa-card.compact .fa-name { font-size:14px; }
.fa-card.compact .fa-crest { width:26px; height:26px; }

@media (hover: hover) {
    .player-card:hover { transform: translateY(-3px); box-shadow: 0 12px 24px -12px rgba(0,0,0,.7); }
}
@media (prefers-reduced-motion: reduce) {
    .player-card, .fa-btn-primary, .fa-btn-icon { transition: none; }
    .player-card:hover { transform: none; }
}
```

Now delete the superseded rules from the same `<style>` block: `.player-card:hover` (old), `.bought`, `.bought .buy-btn`, `.bought input`, `.bought-by-me`, `.removed-card`, `.favorite-card`.

- [ ] **Step 2: Add the shared icon-button helper to `js/app.js`**

Insert immediately above `function createPlayerCard(` :

```javascript
// Icone dei controlli secondari della card (stella, rimuovi, sposta, elimina).
const CARD_ICONS = {
    star: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />',
    eyeOff: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />',
    move: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />',
    trash: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />'
};

function cardIconButton({ cls, icon, title, filled = false, size = 16, data = '' }) {
    return `<button type="button" class="fa-btn-icon ${cls}" title="${title}" aria-label="${title}" ${data}>
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="${filled ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">${CARD_ICONS[icon]}</svg>
    </button>`;
}

// Controlli secondari comuni a tutte le varianti di card. L'ordine dei pulsanti è
// stella · rimuovi/ripristina · sposta · elimina.
function cardSecondaryControls(player, role, tier, isRemoved, isFavorite) {
    const d = `data-id="${player.id}" data-role="${role}" data-tier="${tier}"`;
    return [
        cardIconButton({ cls: `favorite-btn ${isFavorite ? 'is-active' : ''}`, icon: 'star', title: isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti', filled: isFavorite, data: `data-id="${player.id}"` }),
        cardIconButton({ cls: `toggle-remove-btn ${isRemoved ? 'is-active' : ''}`, icon: 'eyeOff', title: isRemoved ? 'Ripristina' : 'Rimuovi dalla lista' }),
        cardIconButton({ cls: 'move-player-btn', icon: 'move', title: 'Sposta categoria', data: d }),
        cardIconButton({ cls: 'permanent-delete-btn is-danger', icon: 'trash', title: 'Elimina definitivamente', data: `${d} data-name="${player.nome}"` })
    ].join('');
}
```

- [ ] **Step 3: Rewrite `createLargePlayerCard`**

Replace the whole function body after the `stateClass` line with:

```javascript
    card.className = `player-card fa-card ${stateClass}`;
    card.dataset.tier = tier;

    card.innerHTML = `
        <div class="flex items-start gap-3">
            <img src="${teamLogos[player.squadra] || TEAM_LOGO_PLACEHOLDER}" alt="${player.squadra}" class="fa-crest">
            <div class="min-w-0">
                <div class="fa-name truncate">${player.nome}</div>
                <div class="fa-sub"><span class="fa-role" data-role="${player.role}">${player.role}</span>${player.squadra}</div>
            </div>
        </div>
        <div>
            <div class="flex items-baseline gap-2">
                <span class="fa-hero num">${recommendedPrice}</span>
                <span class="fa-hero-label">consigliato</span>
            </div>
            <div class="fa-meta">Quotazione <b class="num">${player.qta}</b> · FVM <span class="num">${player.fvm ?? 0}</span></div>
        </div>
        <div class="flex items-center gap-2">
            <input type="number" id="paid-price-${player.id}" value="${player.qta}" class="fa-input num" aria-label="Prezzo pagato">
            <button type="button" class="buy-btn fa-btn-primary flex-1" data-id="${player.id}">Compra</button>
        </div>
        <div class="flex items-center gap-1.5">
            ${cardSecondaryControls(player, role, tier, isRemoved, isFavorite)}
        </div>
    `;

    addPlayerCardEventListeners(card, player);
    return card;
```

- [ ] **Step 4: Rewrite `createSmallPlayerCard`**

Identical markup, with `card.className = \`player-card fa-card compact ${stateClass}\`` and the meta line shortened to:

```javascript
            <div class="fa-meta">Qt. <b class="num">${player.qta}</b></div>
```

- [ ] **Step 5: Run the tests**

```bash
node --check js/app.js && echo "syntax OK"
node test/card-contract.test.js    # ora anche la disciplina colori deve passare per le due card griglia
node test/parser.test.js >/dev/null && echo "parser OK"
```

- [ ] **Step 6: Visual check**

Reload with a list loaded. Verify: tier accent bar differs across Top/Buoni/Scommesse/Altri; the hero number is the recommended price; buying dims the card and disables Compra; the four icon buttons all work (favourite, remove/restore, move, delete) and show tooltips.

- [ ] **Step 7: Commit**

```bash
git add js/app.js index.html
git commit -m "Ridisegna le card della griglia con accento per tier"
```

---

### Task 4: List row

**Files:**
- Modify: `js/app.js:867-920` (`createListPlayerCard`), `index.html` `<style>` block

**Interfaces:**
- Consumes: everything from Tasks 1–3
- Produces: `.fa-row`

- [ ] **Step 1: Add row CSS**

```css
.fa-row {
    display:flex; align-items:center; gap:12px; padding:11px 14px;
    background: var(--surface); border:1px solid var(--border); border-radius: var(--radius-md);
}
.fa-row.is-favorite { box-shadow: inset 3px 0 0 var(--accent); }
.fa-row .fa-crest { width:30px; height:30px; }
.fa-col { text-align:right; min-width:56px; }
.fa-col-k { font-size:9px; letter-spacing:.08em; text-transform:uppercase; color:var(--text-dim); }
.fa-col-v { font-size:15px; font-weight:700; color:var(--text); }
.fa-col-v.sug { color:#5eead4; }
@media (max-width: 640px) { .fa-row { flex-wrap: wrap; } .fa-row .fa-input { width:64px; } }
```

- [ ] **Step 2: Rewrite `createListPlayerCard`** (body after `stateClass`)

```javascript
    card.className = `player-card fa-row ${stateClass}`;
    card.dataset.tier = tier;

    card.innerHTML = `
        <img src="${teamLogos[player.squadra] || TEAM_LOGO_PLACEHOLDER}" alt="${player.squadra}" class="fa-crest">
        <div class="min-w-0 flex-1">
            <div class="fa-name truncate" style="font-size:14px">${player.nome}</div>
            <div class="fa-sub"><span class="fa-role" data-role="${player.role}">${player.role}</span>${player.squadra}</div>
        </div>
        <div class="fa-col"><div class="fa-col-k">Qt.</div><div class="fa-col-v num">${player.qta}</div></div>
        <div class="fa-col"><div class="fa-col-k">Cons.</div><div class="fa-col-v sug num">${recommendedPrice}</div></div>
        <input type="number" id="paid-price-${player.id}" value="${player.qta}" class="fa-input num" aria-label="Prezzo pagato">
        <button type="button" class="buy-btn fa-btn-primary" data-id="${player.id}">Compra</button>
        <div class="flex items-center gap-1.5">
            ${cardSecondaryControls(player, role, tier, isRemoved, isFavorite)}
        </div>
    `;

    addPlayerCardEventListeners(card, player);
    return card;
```

- [ ] **Step 3: Verify**

```bash
node --check js/app.js && node test/card-contract.test.js && node test/parser.test.js >/dev/null && echo "tutto verde"
```

Visual: switch to Lista view, confirm rows align in columns, favourites show the amber left bar, and all controls work.

- [ ] **Step 4: Commit**

```bash
git add js/app.js index.html
git commit -m "Ridisegna la vista lista con righe dense"
```

---

### Task 5: Shell — top bar, two columns, squad rail

**Files:**
- Modify: `index.html:137-325` (header, La Mia Squadra, loader, tabs, container), `js/app.js:443-500` (search/view-mode block in `renderPlayers`), `js/app.js:1191-1312` (`renderMySquad`, `createSquadPlayerCard`), `js/app.js:419-440` (`updateViewMode`)

**Interfaces:**
- Consumes: tokens and components from Tasks 1–4
- Produces: shell containers `#fa-topbar`, `#fa-main`, `#fa-rail`; all pre-existing element ids preserved (`#players-container`, `#role-tabs`, `#csv-file-input`, the four `#squad-<role>` lists, the summary spans).

- [ ] **Step 1: Add shell CSS**

```css
#fa-topbar {
    position: sticky; top: 0; z-index: 40;
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    padding: 10px 16px; background: rgba(15,23,41,.92); backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border);
}
.fa-chip { padding:4px 10px; border-radius:999px; font-size:11px; font-weight:600; background:#1a2440; color:var(--text-muted); }
.fa-chip.ok   { background:rgba(45,212,191,.13); color:#5eead4; }
.fa-chip.warn { background:rgba(245,158,11,.14); color:#fcd34d; }

.fa-shell { display:block; }
@media (min-width: 1280px) {
    .fa-shell { display:grid; grid-template-columns: minmax(0,1fr) 320px; gap:20px; align-items:start; }
    #fa-rail { position: sticky; top: 68px; max-height: calc(100vh - 88px); overflow-y: auto; }
}
.fa-meter { height:7px; border-radius:4px; background:#1a2440; overflow:hidden; }
.fa-meter > i { display:block; height:100%; background:linear-gradient(90deg,var(--primary),var(--bought)); transition:width .3s ease-out; }
.fa-meter.is-tight > i { background:linear-gradient(90deg,var(--accent),var(--removed)); }
.fa-slot { display:flex; align-items:center; justify-content:space-between; padding:6px 9px; border-radius:var(--radius-sm); background:#111c33; font-size:11px; }
```

- [ ] **Step 2: Replace the header markup**

Replace `index.html:137-205` (the whole `<!-- HEADER FISSO -->` block) with:

```html
    <!-- BARRA SUPERIORE -->
    <header id="fa-topbar">
        <span class="font-extrabold text-[15px]" style="color:var(--primary)">⚽ Guida Asta</span>
        <span class="fa-chip ok num">€<span id="remaining-budget">500</span> / 500</span>
        <span class="fa-chip num" id="squad-count">0 / 25</span>
        <div class="ml-auto flex items-center gap-2">
            <button id="export-btn" class="fa-btn-icon" title="Esporta" aria-label="Esporta">💾</button>
            <button id="import-btn" class="fa-btn-icon" title="Importa" aria-label="Importa">📥</button>
            <button id="reset-btn" class="fa-btn-icon is-danger" title="Reset asta" aria-label="Reset asta">↺</button>
        </div>
    </header>
```

**This is the riskiest edit in the plan.** The header being deleted (`index.html:137-205`) carries
ids that `js/app.js` binds at parse time or writes to without null guards. Every one of them must
survive the move:

| id | Consumer | New home |
| --- | --- | --- |
| `remaining-budget` | `remainingBudgetEl`, written by `updateUI` | top bar chip (above) |
| `squad-count` | `squadCountEl`, written by `updateUI` | top bar chip (above) |
| `spent-P`, `spent-D`, `spent-C`, `spent-A` | `updateUI` loop, guarded by `if (spentElement)` | rail slot pills (Step 4) |

Note `updateUI` also does `remainingBudgetEl.classList.toggle('text-red-500' / 'text-green-400', …)`.
Those two Tailwind utilities are colour classes on an element the token layer now styles: replace
that pair with `classList.toggle('is-tight', state.budget < 100)` and add
`#remaining-budget.is-tight { color: var(--removed); }` to the stylesheet, so the sweep in Task 7
finds nothing left behind.

Before deleting anything, confirm the full list yourself:

```bash
grep -n "getElementById('" js/app.js | grep -v "player-\|paid-price\|tier-container" | head -40
```

- [ ] **Step 3: Wrap main and rail**

Wrap the listone section and the squad section:

```html
    <div class="fa-shell max-w-[1600px] mx-auto p-4">
        <main id="fa-main"><!-- tabs ruolo, loader, #players-container restano qui --></main>
        <aside id="fa-rail" class="fa-surface p-4 space-y-4"><!-- budget, slot, La Mia Squadra --></aside>
    </div>
```

Move the existing `<!-- LA MIA SQUADRA -->` block (`index.html:206-281`) inside `#fa-rail`, and the loader + tabs + `#players-container` inside `#fa-main`. Do not rename any inner id.

- [ ] **Step 4: Add the budget meter and slot pills to the rail**

At the top of `#fa-rail`:

```html
        <div>
            <div class="text-[10px] uppercase tracking-widest" style="color:var(--text-dim)">Budget rimanente</div>
            <div class="text-2xl font-extrabold num" style="color:var(--bought)">€<span id="rail-budget-mirror">0</span></div>
            <div class="fa-meter mt-2" id="rail-meter"><i style="width:100%"></i></div>
        </div>
        <div class="grid grid-cols-2 gap-2">
            <div class="fa-slot"><span>P</span><span class="num"><span id="rail-slot-P">0/3</span> · €<span id="spent-P">0</span></span></div>
            <div class="fa-slot"><span>D</span><span class="num"><span id="rail-slot-D">0/8</span> · €<span id="spent-D">0</span></span></div>
            <div class="fa-slot"><span>C</span><span class="num"><span id="rail-slot-C">0/8</span> · €<span id="spent-C">0</span></span></div>
            <div class="fa-slot"><span>A</span><span class="num"><span id="rail-slot-A">0/6</span> · €<span id="spent-A">0</span></span></div>
        </div>
```

- [ ] **Step 5: Feed the new elements from `updateUI`**

At the end of `updateUI()` in `js/app.js`, add — reusing the totals `updateUI` already computes (read the function first and reuse its existing variables rather than recomputing):

**Read `updateUI` first.** Two facts the code must respect, both verified in the current source:
`state.budget` is the **remaining** budget (decremented in `buyPlayer`, restored in `sellPlayer`);
the total is the hard-coded `500` already used at `js/app.js:1614`. And role counts per player come
from `getPlayerById(p.id).R`, **not** `p.role` — `updateUI` already computes them into `counts`.
Reuse that object; do not recompute.

Append at the end of `updateUI()`, after the existing `counts`/`spent` loop and before
`renderMySquad()`:

```javascript
    // Rail: barra budget e slot per ruolo. `state.budget` è il RIMANENTE, il totale è 500.
    const TOTAL_BUDGET = 500;
    const slotsLeft = 25 - state.squad.length;
    const meter = document.getElementById('rail-meter');
    if (meter) {
        const pct = Math.max(0, Math.min(100, (state.budget / TOTAL_BUDGET) * 100));
        meter.querySelector('i').style.width = `${pct}%`;
        // Allerta: budget rimanente sotto il numero di slot ancora da riempire
        meter.classList.toggle('is-tight', state.budget < slotsLeft);
    }
    const MAX_SLOTS = { P: 3, D: 8, C: 8, A: 6 };
    for (const role in MAX_SLOTS) {
        setText(`rail-slot-${role}`, `${counts[role]}/${MAX_SLOTS[role]}`);
    }
    setText('rail-budget-mirror', state.budget);
```

and add this helper next to `updateUI`:

```javascript
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}
```

The `is-tight` rule implements the spec's alert state: remaining budget below the number of slots still to fill.

- [ ] **Step 6: Restyle the search + view switcher block**

In `renderPlayers`, replace the `searchEl.className` and the button classes with token classes: container `fa-surface p-3 mb-4`, input `fa-input w-full text-left`, and each view button `fa-btn-icon`. In `updateViewMode`, replace the Tailwind string with:

```javascript
            btn.className = `fa-btn-icon ${isActive ? 'is-active' : ''}`;
```

- [ ] **Step 7: Turn the role tabs into filter chips and add tier counts**

Add the CSS:

```css
.fa-tabs { display:flex; gap:8px; flex-wrap:wrap; position:sticky; top:56px; z-index:30;
           padding:10px 0; background:var(--bg); }
.fa-tab { padding:6px 14px; border-radius:999px; font-size:12px; font-weight:600;
          background:#111c33; color:var(--text-muted); border:1px solid var(--border); }
.fa-tab.is-active { background:var(--primary-strong); color:#fff; border-color:transparent; }
.fa-tier-head { display:flex; align-items:baseline; gap:10px; margin:20px 0 10px; }
.fa-tier-head h3 { font-size:14px; font-weight:750; color:var(--text); letter-spacing:-.01em; }
.fa-tier-head .count { font-size:11px; color:var(--text-dim); }
```

In `index.html`, replace the `<nav class="flex flex-wrap -mb-px" id="role-tabs">` wrapper class with
`class="fa-tabs" id="role-tabs"` and give each tab button `class="fa-tab"`. Then find where
`js/app.js` sets the active-tab styling (`grep -n "role-tabs\|activeRole" js/app.js`) and replace
whatever Tailwind class string it applies with `fa-tab` / `fa-tab is-active`.

For tier headers, locate the markup emitted around `data-tier="${tier}"` in `renderPlayers` and
wrap it as `<div class="fa-tier-head"><h3>${tier}</h3><span class="count">${n} giocatori</span></div>`,
keeping the existing `data-tier` attribute and the count `<span>` position — the search handler in
`renderPlayers` finds that span via `tierHeader?.querySelector('span')` and rewrites its text.
Breaking that selector silently stops the live counts from updating.

- [ ] **Step 8: Verify**

```bash
node --check js/app.js && node test/card-contract.test.js && node test/parser.test.js >/dev/null && echo "tutto verde"
grep -c 'id="export-btn"\|id="import-btn"\|id="reset-btn"' index.html   # expected: 3
```

Visual, at ≥1280px: two columns, rail sticky while scrolling, budget meter shrinking as you buy, slot counters correct, meter turning amber/rose when the budget gets tight. Below 1280px: single column, rail beneath.

- [ ] **Step 9: Commit**

```bash
git add index.html js/app.js
git commit -m "Nuova shell: barra superiore e rail con budget e rosa"
```

---

### Task 6: Modals, loader panel, empty state

**Files:**
- Modify: `index.html:326-529` (all modals + loader), `js/app.js:1191-1312` (`renderMySquad`, `createSquadPlayerCard`)

- [ ] **Step 1: Add modal and empty-state CSS**

```css
.fa-modal-backdrop { background: rgba(2,6,23,.72); backdrop-filter: blur(6px); }
.fa-modal { background: var(--surface); border:1px solid var(--border); border-radius: var(--radius-lg); box-shadow: 0 30px 60px -20px rgba(0,0,0,.8); }
.fa-modal-head, .fa-modal-foot { position: sticky; background: var(--surface); z-index: 1; }
.fa-modal-head { top:0; border-bottom:1px solid var(--border); }
.fa-modal-foot { bottom:0; border-top:1px solid var(--border); }
.fa-empty { text-align:center; padding:48px 24px; color:var(--text-muted); }
.fa-empty h3 { font-size:18px; font-weight:700; color:var(--text); margin-bottom:6px; }
```

- [ ] **Step 2: Apply the classes**

For each modal in `index.html`: the backdrop wrapper gets `fa-modal-backdrop`, the panel gets `fa-modal`, its title bar `fa-modal-head p-4`, its button row `fa-modal-foot p-4`. Replace `bg-gray-800`/`bg-gray-900`/`text-cyan-400` colour utilities inside the modals with the token classes (`fa-surface`, `style="color:var(--primary)"`). Keep every id and every `onclick`/listener target unchanged.

- [ ] **Step 3: Empty state for the loader**

In the loader block, wrap the existing file input and buttons so that when no list is loaded the panel reads as the page's focal point:

```html
            <div class="fa-empty" id="loader-empty">
                <h3>Nessun listone caricato</h3>
                <p class="text-sm">Carica il listone ufficiale Fantacalcio in formato .xlsx o .csv per iniziare.</p>
            </div>
```

Show/hide it in `loadCSVData` success path with `document.getElementById('loader-empty')?.classList.add('hidden')`, and on load in `loadState()` when `csvPlayersData.length > 0`.

- [ ] **Step 4: Restyle the squad rows**

In `createSquadPlayerCard`, replace the colour utilities with `.fa-row`-style tokens: role chip via `<span class="fa-role" data-role="${role}">`, price with `class="num"`, sell button as `fa-btn-icon is-danger`. Keep the existing sell handler binding intact (`sellPlayer` is attached by class/onclick — check before editing and preserve exactly).

- [ ] **Step 5: Verify**

```bash
node --check js/app.js && node test/card-contract.test.js && node test/parser.test.js >/dev/null && echo "tutto verde"
```

Visual: open each modal (Seleziona Giocatori, Aggiungi Giocatore, Conferma, Import, Sposta) and confirm they are readable, scroll correctly, and their buttons still work. Clear localStorage and confirm the empty state shows.

- [ ] **Step 6: Commit**

```bash
git add index.html js/app.js
git commit -m "Allinea modali, loader e rosa ai nuovi token"
```

---

### Task 7: Sweep and documentation

**Files:**
- Modify: `index.html`, `js/app.js`, `README.md`
- Modify: `test/card-contract.test.js` (extend the colour sweep to the whole file)

- [ ] **Step 0: Vendor the missing Inter weight 500**

Task 1 vendored 400/600/700/800, but the markup uses `font-medium` (weight 500) in ~12 places,
which currently falls back to 400. Download the 500 slice the same way Task 1 did (same script,
same old-Chrome User-Agent that yields static per-weight files rather than one variable font),
save it as `resources/fonts/inter-500.woff2`, and add the matching rule next to the others:

```css
@font-face { font-family:'Inter'; font-weight:500; font-display:swap; src:url('resources/fonts/inter-500.woff2') format('woff2'); }
```

Verify all five files are distinct: `md5sum resources/fonts/*.woff2 | sort | uniq -c -w32`
must show five separate hashes.

- [ ] **Step 0b: Remove the dead legacy class mutations**

`buyPlayer` (`js/app.js` ~1111-1140) and `sellPlayer` (~1291-1309) still add/remove the class names
`bought`, `bought-by-me`, `removed-card`, `favorite-card` and still call
`classList.replace('bg-green-600', …)`. Task 3 deleted the CSS for all of them and the new markup
never carries those classes, so every one of these calls is a no-op. Delete them, keeping the
`is-bought` / `is-removed` / `is-favorite` mutations that Task 2 added in the same functions.

After deleting, buy a player and sell it back in the browser to confirm the card still dims and
un-dims — these two functions patch the DOM in place without a re-render, so a wrong deletion here
shows up immediately.

- [ ] **Step 1: Find leftover legacy utilities**

```bash
grep -o '\b\(bg\|text\|border\)-\(gray\|green\|red\|cyan\|yellow\|purple\|amber\)-[0-9]\{3\}\b' index.html js/app.js | sort | uniq -c | sort -rn
```

Convert each remaining hit to a token class. Anything intentionally kept (if any) must be listed in a comment explaining why.

- [ ] **Step 2: Widen the contract test**

In `test/card-contract.test.js`, add a check that the *whole* of `js/app.js` is free of legacy colour utilities:

```javascript
const allHits = [...new Set(SRC.match(LEGACY) || [])];
check(`js/app.js senza utility colore legacy${allHits.length ? ' — ' + allHits.join(', ') : ''}`, allHits.length === 0);
```

- [ ] **Step 3: Run everything**

```bash
node test/card-contract.test.js && node test/parser.test.js && node --check js/app.js && node --check js/parser.js && echo "TUTTO VERDE"
```

- [ ] **Step 4: Update the README**

Replace the "Colori Tema" customisation section with the token block from Task 1 (tokens are now the single place colours are defined), and note in the offline section that Inter is served locally so nothing is fetched at runtime.

- [ ] **Step 5: Refresh the screenshots**

`resources/lista.png` and `resources/squadra.png` show the old design and are embedded at the top of the README. Ask the user for two fresh screenshots (grid view and squad rail) and replace the files, keeping the same filenames so the README needs no edit.

- [ ] **Step 6: Commit**

```bash
git add index.html js/app.js README.md test/card-contract.test.js
git commit -m "Completa il redesign: sweep dei colori legacy e documentazione"
```

---

## Verification summary

Automated, after every task:

```bash
node test/parser.test.js        # il parser non deve mai regredire
node test/card-contract.test.js # contratto dei controlli + disciplina dei colori
node --check js/app.js js/parser.js
```

Manual (the assistant has no browser tooling — this is the user's pass), on `http://127.0.0.1:8765/index.html`:

1. Load `Quotazioni_Fantacalcio_Stagione_2026_27.xlsx` → 501 giocatori.
2. Grid: tier accents differ; hero price correct; crests visible (Frosinone, Monza, Venezia, Juventus).
3. Buy / remove / restore / favourite / move / delete all work from every view mode.
4. Rail: budget shrinks on purchase, slot counters correct, meter turns amber when tight.
5. Switch Grande / Piccola / Lista; reload the page and confirm state survived.
6. Narrow the window below 1280px: single column, rail below, nothing overlaps.
