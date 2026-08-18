/*
 * Test delle categorie (tier): `node test/tiers.test.js`.
 *
 * Estrae da js/app.js le parti che non dipendono dal DOM (initialPlayersData,
 * TIER_ORDER, tierSlug, ensureTiers, calculateRecommendedPrice) e le esegue in un
 * contesto isolato. Il punto piu' delicato coperto qui e' la migrazione: un'asta
 * salvata prima dell'aggiunta di una categoria non la contiene, e senza migrazione
 * la sezione non verrebbe disegnata e spostarci un giocatore romperebbe il render.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

function block(startMarker, endMarker) {
    const i = SRC.indexOf(startMarker);
    if (i === -1) throw new Error(`non trovato: ${startMarker}`);
    const j = SRC.indexOf(endMarker, i);
    if (j === -1) throw new Error(`fine non trovata per: ${startMarker}`);
    return SRC.slice(i, j);
}
function fn(name) {
    const start = SRC.indexOf(`function ${name}(`);
    if (start === -1) throw new Error(`funzione non trovata: ${name}`);
    const next = SRC.indexOf('\nfunction ', start + 1);
    return SRC.slice(start, next === -1 ? SRC.length : next);
}

// Un solo script: le dichiarazioni `const` di uno script vm non sono visibili
// agli script successivi ne' diventano proprieta' del contesto, quindi il codice
// estratto va concatenato ed esportato esplicitamente.
const ctx = { console, Math, Object, Array, JSON };
vm.createContext(ctx);
vm.runInContext([
    block('const initialPlayersData', '// Ordine canonico'),
    block('const TIER_ORDER', '// Loghi Serie A'),
    fn('calculateRecommendedPrice'),
    'globalThis.estratto = { initialPlayersData, TIER_ORDER, tierSlug, ensureTiers, calculateRecommendedPrice };'
].join('\n'), ctx);
Object.assign(ctx, ctx.estratto);

let failures = 0;
function check(name, actual, expected) {
    const a = JSON.stringify(actual), e = JSON.stringify(expected);
    if (a === e) { console.log(`  ok   ${name}`); }
    else { failures++; console.log(`  FAIL ${name}\n       atteso:  ${e}\n       trovato: ${a}`); }
}

console.log('ordine e nomi delle categorie');
check('ordine canonico', ctx.TIER_ORDER, ['Top', 'Buoni', 'Scommesse', 'Titolari cheap', 'Altri']);
check('tutti i ruoli hanno le stesse categorie',
    Object.keys(ctx.initialPlayersData).map(r => Object.keys(ctx.initialPlayersData[r]).join('|')),
    new Array(4).fill(ctx.TIER_ORDER.join('|')));
check('lo slug per gli id non contiene spazi', ctx.tierSlug('Titolari cheap'), 'Titolari-cheap');
check('gli id restano validi per tutte le categorie',
    ctx.TIER_ORDER.filter(t => /\s/.test(ctx.tierSlug(t))), []);

console.log('prezzi consigliati della nuova categoria');
// Moltiplicatori scelti: P 1.1, D 1.2, C 1.3, A 1.4 (consigliato vicino alla quotazione)
check('difensore qt. 8', ctx.calculateRecommendedPrice({ qta: 8, role: 'D' }, 'Titolari cheap'), 10);
check('centrocampista qt. 12', ctx.calculateRecommendedPrice({ qta: 12, role: 'C' }, 'Titolari cheap'), 16);
check('attaccante qt. 15', ctx.calculateRecommendedPrice({ qta: 15, role: 'A' }, 'Titolari cheap'), 21);
check('portiere qt. 10', ctx.calculateRecommendedPrice({ qta: 10, role: 'P' }, 'Titolari cheap'), 11);
check('quotazione 1 resta 1', ctx.calculateRecommendedPrice({ qta: 1, role: 'A' }, 'Titolari cheap'), 1);
// La nuova categoria non deve aver cambiato i prezzi di quelle esistenti
check('Buoni invariato (C qt. 12)', ctx.calculateRecommendedPrice({ qta: 12, role: 'C' }, 'Buoni'), 30);
check('Scommesse invariato (D qt. 8)', ctx.calculateRecommendedPrice({ qta: 8, role: 'D' }, 'Scommesse'), 10);
check('Top invariato (A qt. 30)', ctx.calculateRecommendedPrice({ qta: 30, role: 'A' }, 'Top'), 135);

console.log('migrazione di uno stato salvato prima della nuova categoria');
const vecchio = {
    P: { Top: [{ id: 1, nome: 'Svilar' }], Buoni: [], Scommesse: [], Altri: [] },
    D: { Top: [], Buoni: [{ id: 2, nome: 'Bastoni' }], Scommesse: [], Altri: [] },
    C: { Top: [], Buoni: [], Scommesse: [], Altri: [] },
    A: { Top: [], Buoni: [], Scommesse: [], Altri: [{ id: 3, nome: 'Tizio' }] }
};
const migrato = ctx.ensureTiers(JSON.parse(JSON.stringify(vecchio)));
check('la categoria mancante viene aggiunta a ogni ruolo',
    Object.keys(ctx.initialPlayersData).map(r => Array.isArray(migrato[r]['Titolari cheap'])),
    [true, true, true, true]);
check('le categorie finiscono nell ordine canonico', Object.keys(migrato.P), ctx.TIER_ORDER);
check('i giocatori salvati non vengono persi',
    [migrato.P.Top[0].nome, migrato.D.Buoni[0].nome, migrato.A.Altri[0].nome],
    ['Svilar', 'Bastoni', 'Tizio']);

// Una categoria creata a mano in una versione futura non deve sparire
const conExtra = ctx.ensureTiers({ P: { Top: [], Buoni: [], Scommesse: [], Altri: [], Mie: [{ id: 9 }] } });
check('una categoria sconosciuta viene conservata', conExtra.P.Mie.length, 1);
check('la categoria sconosciuta finisce in coda', Object.keys(conExtra.P).slice(-1), ['Mie']);

// Robustezza: stato corrotto o parziale non deve far esplodere il caricamento
const parziale = ctx.ensureTiers({ P: { Top: 'non-un-array' } });
check('un valore non valido diventa lista vuota', parziale.P.Top, []);
check('un ruolo mancante viene ricreato', Object.keys(ctx.ensureTiers({}).A), ctx.TIER_ORDER);

console.log(failures === 0 ? '\nTutti i test superati.' : `\n${failures} test falliti.`);
process.exit(failures === 0 ? 0 : 1);
