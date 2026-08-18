/*
 * Test di larghezza del layout: `node test/layout-widths.test.js`.
 *
 * Perche' esiste: le card hanno `overflow: hidden`, quindi un controllo che non
 * ci sta non trabocca in modo visibile — sparisce. Il numero di colonne della
 * griglia va quindi scelto in base allo spazio DAVVERO disponibile, non alla
 * larghezza della finestra: sopra i 1280px la rail laterale si porta via 340px
 * (320 di larghezza + 20 di gap) proprio alla stessa soglia in cui la griglia
 * aumenta le colonne.
 *
 * Il test non apre un browser: legge le regole vere da js/app.js e index.html,
 * ricostruisce l'aritmetica del layout e verifica che la riga "prezzo + Compra"
 * ci stia, o che le sia permesso andare a capo.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APP = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

let failures = 0;
function check(name, ok, detail) {
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name}${detail && !ok ? `\n       ${detail}` : ''}`);
    if (!ok) failures++;
}

// --- costanti del layout, lette dal foglio di stile dove possibile ---
const SHELL_MAX = 1600;   // .fa-shell max-w-[1600px]
const SHELL_PAD = 16 * 2; // p-4
const RAIL = 320 + 20;    // .fa-shell grid-template-columns ... 320px, gap 20px
const RAIL_FROM = 1280;   // @media (min-width: 1280px)
const GAP = 12;           // gap-3
const COMPACT_PAD = 11 * 2;

// Riga "prezzo pagato + Compra": input a larghezza fissa, gap, e il pulsante
// alla sua larghezza minima (testo "Compra" + padding orizzontale).
const INPUT_W = Number((/\.fa-input\s*{[^}]*width:\s*(\d+)px/.exec(HTML) || [])[1] || 74);
const ROW_GAP = 8;
const BUY_MIN = 92;
const NEEDED = INPUT_W + ROW_GAP + BUY_MIN;

// --- come sono definite le colonne della vista "Piccola" ---
// Il ramo 'small' puo' contenere righe di commento fra `case` e `return`.
const smallBranch = (/case 'small':([\s\S]*?)case 'list':/.exec(APP) || [])[1] || '';
const smallRule = (/return\s*'([^']+)'/.exec(smallBranch) || [])[1] || '';
if (!smallRule) { console.error('ERRORE: ramo \'small\' di getTierContainerClass non riconosciuto'); process.exit(2); }
const viewportCols = [...smallRule.matchAll(/(?:^|\s)(?:(sm|md|lg|xl):)?grid-cols-(\d+)/g)]
    .map(m => ({ bp: { sm: 640, md: 768, lg: 1024, xl: 1280 }[m[1]] || 0, cols: Number(m[2]) }));
const usesContainerGrid = /fa-grid-small/.test(smallRule);
const minmaxMin = Number((/\.fa-grid-small\s*{[^}]*minmax\(\s*(\d+)px/.exec(HTML) || [])[1] || 0);
if (usesContainerGrid && !minmaxMin) { console.error('ERRORE: .fa-grid-small usata ma minmax(...px) non trovato in index.html'); process.exit(2); }
if (!usesContainerGrid && !viewportCols.length) { console.error('ERRORE: nessuna definizione di colonne riconosciuta'); process.exit(2); }

// --- il wrap e' permesso a questa larghezza? ---
// `flex-wrap: wrap` e' permissivo: non cambia nulla quando lo spazio basta.
// Serve sapere se la regola vale a TUTTE le larghezze o solo sotto una soglia.
function wrapAllowedAt(vw) {
    const re = /@media\s*\(max-width:\s*([\d.]+)px\)[^{]*{([\s\S]*?)\n        }/g;
    let m;
    while ((m = re.exec(HTML))) {
        if (/\.fa-buy-row\s*,?[\s\S]{0,80}flex-wrap:\s*wrap/.test(m[2]) && vw <= Number(m[1])) return true;
    }
    // regola fuori da qualsiasi media query
    const stripped = HTML.replace(re, '');
    return /\.fa-buy-row\s*,?[\s\S]{0,120}flex-wrap:\s*wrap/.test(stripped);
}

// Sotto i 640px .fa-grid-small tiene un numero fisso di colonne (densita' su telefono).
const baseCols = Number((/\.fa-grid-small\s*{[^}]*repeat\(\s*(\d+)\s*,/.exec(HTML) || [])[1] || 0);

function columnsAt(vw, mainWidth) {
    if (usesContainerGrid && minmaxMin > 0) {
        if (vw < 640) return baseCols || 2;
        return Math.max(1, Math.floor((mainWidth + GAP) / (minmaxMin + GAP)));
    }
    let cols = 1;
    for (const { bp, cols: c } of viewportCols) if (vw >= bp) cols = c;
    return cols;
}

function innerWidthAt(vw) {
    const content = Math.min(vw, SHELL_MAX) - SHELL_PAD;
    const main = vw >= RAIL_FROM ? content - RAIL : content;
    const cols = columnsAt(vw, main);
    const col = (main - GAP * (cols - 1)) / cols;
    return { cols, col, inner: col - COMPACT_PAD };
}

// Viewport rappresentative. 1366 = iPad Pro 12,9" orizzontale, 1180 = iPad Air
// orizzontale, 1440 = portatile 13", 1024 = iPad orizzontale base.
const VIEWPORTS = [375, 414, 768, 1024, 1180, 1279, 1280, 1366, 1440, 1600, 1920];

console.log(`vista "Piccola": la riga prezzo+Compra richiede ${NEEDED}px (input ${INPUT_W} + gap ${ROW_GAP} + pulsante ${BUY_MIN})`);
for (const vw of VIEWPORTS) {
    const { cols, inner } = innerWidthAt(vw);
    const fits = inner >= NEEDED;
    const canWrap = wrapAllowedAt(vw);
    check(
        `${vw}px — ${cols} colonne, ${inner.toFixed(0)}px interni`,
        fits || canWrap,
        `servono ${NEEDED}px, disponibili ${inner.toFixed(0)}px e il wrap non e' attivo a questa larghezza: ` +
        `il pulsante Compra viene tagliato da overflow:hidden`
    );
}

console.log(failures === 0 ? '\nTutti i test superati.' : `\n${failures} test falliti.`);
process.exit(failures === 0 ? 0 : 1);
