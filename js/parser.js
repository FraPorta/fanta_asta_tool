// Parsing del listone quotazioni (XLSX / CSV) tramite SheetJS. Nessuna dipendenza dal DOM: testabile a parte.
// Caricato come classic script: le funzioni restano globali e disponibili in app.js.

// --- FUNZIONI QUOTAZIONI (CSV / XLSX) ---
// Colonne richieste nel listone ufficiale (classic, non Mantra).
// Il match è esatto dopo trim: "FVM M" e "Qt.A M" sono le colonne Mantra e vanno ignorate.
const REQUIRED_COLUMNS = ['R', 'Nome', 'Squadra', 'Qt.A'];

function normalizeHeader(value) {
    return String(value == null ? '' : value).trim();
}

// Il file ufficiale ha una riga di titolo prima dell'intestazione: cerchiamo
// la riga che contiene davvero le colonne, invece di assumerne la posizione.
function findHeaderRowIndex(rows) {
    const limit = Math.min(rows.length, 10);
    for (let i = 0; i < limit; i++) {
        const headers = (rows[i] || []).map(normalizeHeader);
        if (headers.includes('Nome') && headers.includes('Squadra')) return i;
    }
    return -1;
}

function buildHeaderMap(headerRow) {
    const map = {};
    headerRow.forEach((cell, index) => {
        const name = normalizeHeader(cell);
        if (name !== '' && !(name in map)) map[name] = index;
    });
    return map;
}

function toNumber(value, fallback) {
    const text = String(value == null ? '' : value).trim();
    if (text === '') return fallback; // cella vuota: Number('') sarebbe 0
    const num = Number(text.replace(',', '.'));
    return Number.isFinite(num) ? num : fallback;
}

// rows = array di array (una riga per elemento), come restituito da SheetJS
function parseQuotazioniRows(rows) {
    const headerIndex = findHeaderRowIndex(rows);
    if (headerIndex === -1) return null;

    const headers = buildHeaderMap(rows[headerIndex]);
    const missing = REQUIRED_COLUMNS.filter(col => !(col in headers));
    if (missing.length > 0) {
        throw new Error(`Colonne mancanti nel file: ${missing.join(', ')}`);
    }

    const players = [];
    for (let i = headerIndex + 1; i < rows.length; i++) {
        const row = rows[i] || [];
        const nome = normalizeHeader(row[headers['Nome']]);
        const squadra = normalizeHeader(row[headers['Squadra']]);
        if (nome === '' || squadra === '') continue;

        const rawRole = normalizeHeader(row[headers['R']]).toUpperCase();
        players.push({
            id: toNumber(row[headers['Id']], null) || Date.now() + i,
            role: ['P', 'D', 'C'].includes(rawRole) ? rawRole : 'A',
            nome: nome,
            squadra: squadra,
            qta: toNumber(row[headers['Qt.A']], 1) || 1, // quotazione minima 1, come nel listone ufficiale
            fvm: 'FVM' in headers ? toNumber(row[headers['FVM']], 0) : 0
        });
    }

    console.log(`Parsed ${players.length} players from quotazioni file`);
    return players;
}

// SheetJS legge sia .xlsx/.xls sia .csv: un solo percorso di parsing per entrambi.
function parseQuotazioniFile(arrayBuffer) {
    // codepage 65001: i CSV vengono decodificati come UTF-8 (accenti nei nomi)
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array', codepage: 65001 });
    let lastError = null;

    for (const sheetName of workbook.SheetNames) {
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: true, blankrows: false });
        try {
            const players = parseQuotazioniRows(rows);
            if (players && players.length > 0) return players;
        } catch (error) {
            lastError = error; // intestazione trovata ma incompleta: proviamo il foglio successivo
        }
    }

    if (lastError) throw lastError;
    throw new Error('Nessuna intestazione con le colonne "Nome" e "Squadra" trovata nel file.');
}
