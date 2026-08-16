// Test del parser del listone. Nessuna dipendenza esterna: `node test/parser.test.js`.
// Carica js/parser.js e resources/xlsx.mini.min.js in un contesto isolato (niente DOM).
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ctx = { console, Date, Number, Math, String, JSON };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'resources/xlsx.mini.min.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/parser.js'), 'utf8'), ctx);

let failures = 0;
function check(name, actual, expected) {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a === e) {
        console.log(`  ok   ${name}`);
    } else {
        failures++;
        console.log(`  FAIL ${name}\n       atteso:  ${e}\n       trovato: ${a}`);
    }
}

const HEADER = ['Id', 'R', 'RM', 'Nome', 'Squadra', 'Qt.A', 'Qt.I', 'Diff.', 'Qt.A M', 'Qt.I M', 'Diff.M', 'FVM', 'FVM M'];
const rowsWith = (...data) => [['Quotazioni Fantacalcio Stagione 2026 27'], HEADER, ...data];

console.log('parseQuotazioniRows');

check('riga standard',
    ctx.parseQuotazioniRows(rowsWith([5841, 'P', 'Por', 'Svilar', 'Roma', 18, 18, 0, 19, 19, 0, 65, 70])),
    [{ id: 5841, role: 'P', nome: 'Svilar', squadra: 'Roma', qta: 18, fvm: 65 }]);

// Le colonne Mantra ("Qt.A M", "FVM M") non devono mai essere lette al posto di quelle classic
check('ignora le colonne Mantra',
    ctx.parseQuotazioniRows(rowsWith([1, 'A', 'Pc', 'Tizio', 'Inter', 30, 30, 0, 99, 99, 0, 40, 999]))[0],
    { id: 1, role: 'A', nome: 'Tizio', squadra: 'Inter', qta: 30, fvm: 40 });

check('ordine delle colonne indifferente',
    ctx.parseQuotazioniRows([['titolo'], ['Squadra', 'Nome', 'FVM', 'R', 'Qt.A', 'Id'], ['Lecce', 'Caio', 12, 'D', 8, 77]]),
    [{ id: 77, role: 'D', nome: 'Caio', squadra: 'Lecce', qta: 8, fvm: 12 }]);

check('celle vuote: quotazione minima 1, fvm 0',
    ctx.parseQuotazioniRows([['t'], ['Id', 'R', 'Nome', 'Squadra', 'Qt.A', 'FVM'], [9, 'C', 'Vuoto', 'Lecce', '', '']]),
    [{ id: 9, role: 'C', nome: 'Vuoto', squadra: 'Lecce', qta: 1, fvm: 0 }]);

check('quotazione 0 vale 1 (come nel listone ufficiale)',
    ctx.parseQuotazioniRows([['t'], ['Id', 'R', 'Nome', 'Squadra', 'Qt.A', 'FVM'], [10, 'A', 'Zero', 'Como', 0, 7]])[0].qta,
    1);

check('nomi con virgola e valori decimali',
    ctx.parseQuotazioniRows([['t'], ['Id', 'R', 'Nome', 'Squadra', 'Qt.A', 'FVM'], [1, 'D', 'Rossi, Mario', 'Inter', 12.5, 40]]),
    [{ id: 1, role: 'D', nome: 'Rossi, Mario', squadra: 'Inter', qta: 12.5, fvm: 40 }]);

check('righe senza nome o squadra vengono scartate',
    ctx.parseQuotazioniRows(rowsWith(
        [1, 'P', 'Por', '', 'Roma', 5, 5, 0, 5, 5, 0, 1, 1],
        [2, 'P', 'Por', 'Valido', 'Roma', 5, 5, 0, 5, 5, 0, 1, 1],
        [3, 'P', 'Por', 'SenzaSquadra', '', 5, 5, 0, 5, 5, 0, 1, 1])).map(p => p.nome),
    ['Valido']);

check('nessuna intestazione riconosciuta', ctx.parseQuotazioniRows([['a', 'b'], ['c', 'd']]), null);

let msg = '';
try {
    ctx.parseQuotazioniRows([['titolo'], ['Id', 'R', 'Nome', 'Squadra', 'FVM'], [1, 'P', 'X', 'Y', 3]]);
} catch (e) {
    msg = e.message;
}
check('colonna mancante segnalata per nome', msg, 'Colonne mancanti nel file: Qt.A');

console.log('parseQuotazioniFile');

// Fixture xlsx generato al volo: stessa struttura del file ufficiale (riga titolo + intestazione)
const wb = ctx.XLSX.utils.book_new();
ctx.XLSX.utils.book_append_sheet(wb, ctx.XLSX.utils.aoa_to_sheet([['Ceduti']]), 'Ceduti');
ctx.XLSX.utils.book_append_sheet(wb, ctx.XLSX.utils.aoa_to_sheet(rowsWith(
    [5841, 'P', 'Por', 'Svilar', 'Roma', 18, 18, 0, 18, 18, 0, 65, 65],
    [4957, 'P', 'Por', 'Montipò', 'Como', 5, 5, 0, 5, 5, 0, 10, 10])), 'Tutti');
const xlsxBytes = ctx.XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

check('xlsx: salta i fogli senza listone e legge gli accenti',
    ctx.parseQuotazioniFile(Buffer.from(xlsxBytes).buffer).map(p => p.nome),
    ['Svilar', 'Montipò']);

// Stesso contenuto in CSV: xlsx e csv devono produrre giocatori identici
const csv = 'Quotazioni Fantacalcio Stagione 2026 27\n' + HEADER.join(',') + '\n' +
    '5841,P,Por,Svilar,Roma,18,18,0,18,18,0,65,65\n4957,P,Por,Montipò,Como,5,5,0,5,5,0,10,10\n';
const csvBuf = Buffer.from(csv, 'utf8');
check('csv: stesso risultato dell\'xlsx',
    ctx.parseQuotazioniFile(csvBuf.buffer.slice(csvBuf.byteOffset, csvBuf.byteOffset + csvBuf.byteLength)),
    ctx.parseQuotazioniFile(Buffer.from(xlsxBytes).buffer));

// Se il listone ufficiale è presente nel repo, verifichiamo anche quello
const official = fs.readdirSync(ROOT).find(f => /^Quotazioni_Fantacalcio.*\.(xlsx|csv)$/i.test(f));
if (official) {
    const buf = fs.readFileSync(path.join(ROOT, official));
    const players = ctx.parseQuotazioniFile(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    const teams = new Set(players.map(p => p.squadra));
    const roles = new Set(players.map(p => p.role));
    console.log(`  info ${official}: ${players.length} giocatori, ${teams.size} squadre`);
    check('listone ufficiale: giocatori trovati', players.length > 400, true);
    check('listone ufficiale: 20 squadre', teams.size, 20);
    check('listone ufficiale: 4 ruoli', [...roles].sort(), ['A', 'C', 'D', 'P']);
    check('listone ufficiale: quotazioni valide', players.every(p => p.qta >= 1), true);
} else {
    console.log('  skip listone ufficiale non presente nel repo');
}

console.log(failures === 0 ? '\nTutti i test superati.' : `\n${failures} test falliti.`);
process.exit(failures === 0 ? 0 : 1);
