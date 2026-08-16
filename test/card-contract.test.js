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
    // Le card griglia (Grande/Piccola) delegano i quattro controlli secondari
    // (stella, rimuovi, sposta, elimina) all'helper condiviso cardSecondaryControls,
    // riusato anche da createListPlayerCard (Task 4). Se il creator chiama l'helper,
    // il grep deve guardare anche dentro l'helper: il controllo runtime che conta
    // davvero (querySelector senza null-check in addPlayerCardEventListeners) è
    // comunque soddisfatto dal markup prodotto a runtime.
    const searchable = body.includes('cardSecondaryControls(') ? body + bodyOf('cardSecondaryControls') : body;
    for (const control of CONTROLS) {
        check(`${creator} contiene .${control}`, searchable.includes(control));
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
