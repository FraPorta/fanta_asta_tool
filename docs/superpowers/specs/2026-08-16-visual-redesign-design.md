# Redesign visivo — Fanta Asta Tool

Data: 2026-08-16
Stato: approvato in brainstorming, pronto per il piano di implementazione

## Obiettivo

Rendere l'app moderna e curata mantenendo intatte funzioni e dati. Priorità dichiarate:
velocità d'uso durante l'asta dal vivo, cura visiva, desktop-first.

Il redesign è **puramente presentazionale**. Nessuna modifica a comportamento, formato dello
stato in `localStorage`, formato di import/export o parsing del listone.

## Decisioni prese

| Decisione | Scelta |
| --- | --- |
| Struttura | Split: listone a sinistra, rail fissa a destra con budget e rosa |
| Card griglia | "Card con accento": prezzo consigliato protagonista, barra tier in alto |
| Vista lista | Riga densa tabellare |
| Palette | "Notte teal": blu notte, primario teal, ambra per preferiti e tier |

## 1. Fondamenta

### Token

Definiti come custom properties CSS su `:root` in `index.html`, usati sia da CSS scritto a mano
sia dalle utility Tailwind con valori arbitrari (`bg-[var(--surface)]`).

```
--bg:            #080d18   /* sfondo pagina */
--surface:       #0f1729   /* barra, rail, pannelli */
--surface-2:     #131d33   /* card sollevate */
--border:        #223050
--text:          #f8fafc
--text-muted:    #8595b0
--text-dim:      #5b6b86

--primary:       #14b8a6   /* azioni: Compra, primari */
--primary-strong:#0d9488
--bought:        #22c55e   /* stato acquistato, SOLO questo significato */
--removed:       #f43f5e   /* stato rimosso, SOLO questo significato */
--accent:        #f59e0b   /* preferiti e tier Top */

--role-p: #1e3a8a / #bfdbfe   (bg / testo)
--role-d: #065f46 / #a7f3d0
--role-c: #78350f / #fde68a
--role-a: #7f1d1d / #fecaca

--radius-sm: 10px   --radius-md: 14px   --radius-lg: 16px
```

Regola cromatica: verde e rosso restano riservati agli **stati** (acquistato / rimosso). Le
azioni usano il teal. È il motivo per cui la palette "campo notturno" è stata scartata.

### Tipografia

- Inter, pesi 400/600/700/800, **servito in locale** (`resources/fonts/`) come Tailwind e SheetJS:
  l'asta deve funzionare senza rete. Rimosso il `<link>` a Google Fonts.
- Tutti i numeri (quotazioni, prezzi, budget) con `font-variant-numeric: tabular-nums`.
- Scala: nome giocatore 16px/750, prezzo hero 30px/800 con `letter-spacing:-.02em`,
  etichette 9–10px maiuscoletto con `letter-spacing:.1em`, corpo 11–13px.

### Ambiguità nota

Il ruolo C e lo stato "preferito" usano entrambi l'ambra. Restano distinguibili perché hanno
forme diverse: C è un chip pieno sulla riga della squadra, il preferito è la stella più un
anello sul bordo della card. Nessun altro elemento ambra sulla card.

## 2. Shell

### Barra superiore (sticky)

Marchio · campo di ricerca · selettore vista (Grande/Piccola/Lista) · chip budget rimanente ·
chip rosa `9/25` · azioni Esporta / Importa / Reset come pulsanti ghost con icona ed etichetta.

Sostituisce l'attuale header alto: il budget resta visibile senza scorrere.

### Colonne

- **≥1280px**: griglia a due colonne. Colonna principale con filtri e listone; rail destra
  larga 320px, `position: sticky`, contenente:
  - budget rimanente con barra di avanzamento
  - pillole slot per ruolo (P 0/3 · D 0/8 · C 3/8 · A 6/6)
  - "La Mia Squadra" come lista compatta scorrevole con prezzo e azione vendi
  - totale speso
- **<1280px**: la rail scende sotto la colonna principale. L'ordine dei contenuti su telefono
  resta quello di oggi.

### Filtri

Le tab dei ruoli diventano chip filtro sticky sotto la barra superiore. Le sezioni per tier
(Top / Buoni / Scommesse / Altri) diventano intestazioni con conteggio.

## 3. Componenti

### Card giocatore — griglia ("Grande")

Struttura: barra accento tier in alto (3px) + alone radiale d'angolo · stemma 34px ·
nome · chip ruolo + squadra + chip tier · stella preferito · prezzo consigliato come numero
hero · riga meta `Quotazione N · FVM N` · input prezzo pagato · pulsante Compra primario ·
icona rimuovi discreta.

Colore della barra accento e dell'alone per tier (l'unico punto in cui il tier è codificato a colore):

| Tier | Accento |
| --- | --- |
| Top | ambra `#f59e0b` → rosa `#fb7185` |
| Buoni | teal `#14b8a6` → blu `#38bdf8` |
| Scommesse | viola `#a78bfa` → indaco `#6366f1` |
| Altri | grigio `#475569`, senza alone |

Stati:
- acquistato: opacità ridotta, contorno `--bought`, controlli disabilitati (come oggi)
- rimosso: contorno `--removed`
- preferito: stella ambra piena + anello ambra tenue

Priorità dei bordi invariata rispetto a oggi: acquistato > rimosso > preferito.

### Card giocatore — "Piccola"

Stessa card, padding ridotti, prezzo hero a 22px, riga meta compressa.

### Riga giocatore — "Lista"

Riga tabellare: stemma · nome + squadra · chip ruolo · Qt. · Cons. · input · Compra.
Preferito = barra ambra a sinistra (`box-shadow: inset 3px 0 0`).

### Rail destra

Righe rosa: chip ruolo · nome · prezzo · azione vendi visibile su hover/focus.
Barra budget: gradiente teal→verde, con stato di allerta quando il budget rimanente
scende sotto il numero di slot ancora da riempire.

### Modali

Stessi token, `border-radius: var(--radius-lg)`, backdrop con blur, header e footer sticky
quando il contenuto scorre.

### Stato vuoto

Senza listone caricato, il pannello di caricamento diventa il fuoco della pagina (icona,
titolo, spiegazione dei formati accettati) invece di una griglia vuota con un box sotto.

## 4. Movimento

- Transizioni 150–200ms `ease-out`.
- Sollevamento su hover solo con `@media (hover: hover)`.
- Tutto rispetta `prefers-reduced-motion: reduce`.
- Acquisto: breve lampo teal sulla card, nessuna animazione lunga.

## 5. Ambito tecnico

File toccati:

- `index.html` — token, stile, shell a due colonne, barra superiore, filtri, modali, stato vuoto
- `js/app.js` — funzioni di rendering: `createLargePlayerCard`, `createSmallPlayerCard`,
  `createListPlayerCard`, `renderTierContent`, `renderMySquad`, `createSquadPlayerCard`,
  `updateUI`, `updateViewMode`
- `resources/fonts/` — Inter servito in locale

Non toccati: `js/parser.js`, `test/parser.test.js`, formato dello stato, logica di
`calculateRecommendedPrice`, `buyPlayer`, import/export.

## 6. Rischi e verifica

| Rischio | Mitigazione |
| --- | --- |
| Tailwind Play CDN non compila le classi generate da JS | Verificato: il CDN installa un `MutationObserver` su `document.documentElement` con `childList`/`subtree` e `attributeFilter` sulla classe. Le classi inserite a runtime vengono compilate. |
| Regressione funzionale durante il rifacimento del markup | Le funzioni di rendering cambiano una alla volta; gli id e i gestori di eventi restano invariati; `addPlayerCardEventListeners` continua a ricevere gli stessi selettori. |
| Stato salvato di stagioni precedenti | Nessuna modifica alla forma dello stato: i salvataggi esistenti restano validi. |
| Nessuno strumento browser lato assistente | La verifica visiva finale è dell'utente, con checklist fornita a fine implementazione sul server locale. |

Verifica automatica disponibile: `node test/parser.test.js` deve restare verde (il parser non
viene toccato) e `node --check` su `js/app.js`.

## Fuori ambito

- Nuove funzionalità (statistiche, filtri aggiuntivi, ordinamenti nuovi)
- Tema chiaro
- Sostituzione di Tailwind con CSS compilato
- Modifiche ai moltiplicatori dei prezzi consigliati
