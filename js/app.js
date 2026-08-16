/*
 *   Copyright (c) 2026 
 *   All rights reserved.
 */
// Logica dell'app (stato, rendering, persistenza). Dipende da js/parser.js.
// Caricato come classic script dopo js/parser.js.

// --- DATABASE GIOCATORI E LOGHI (STATO INIZIALE) ---
let csvPlayersData = []; // Dati caricati dal CSV
const initialPlayersData = {
    'P': {
        'Top': [],
        'Buoni': [],
        'Scommesse': [],
        'Altri': []
    },
    'D': {
        'Top': [],
        'Buoni': [],
        'Scommesse': [],
        'Altri': []
    },
    'C': {
        'Top': [],
        'Buoni': [],
        'Scommesse': [],
        'Altri': []
    },
    'A': {
        'Top': [],
        'Buoni': [],
        'Scommesse': [],
        'Altri': []
    }
};
// Loghi Serie A 2026/27, salvati in locale: nessuna dipendenza di rete durante l'asta.
// Squadra non presente -> placeholder (vedi fallback nei render delle card).
const TEAM_LOGO_PLACEHOLDER = "data:image/svg+xml;utf8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 40 40%27%3E%3Crect width=%2740%27 height=%2740%27 rx=%2720%27 fill=%27%232d3748%27/%3E%3Ctext x=%2720%27 y=%2727%27 font-family=%27sans-serif%27 font-size=%2720%27 fill=%27%23e2e8f0%27 text-anchor=%27middle%27%3E?%3C/text%3E%3C/svg%3E";

const teamLogos = {
    'Atalanta': 'resources/logos/atalanta.png',
    'Bologna': 'resources/logos/bologna.png',
    'Cagliari': 'resources/logos/cagliari.png',
    'Como': 'resources/logos/como.png',
    'Fiorentina': 'resources/logos/fiorentina.png',
    'Frosinone': 'resources/logos/frosinone.png',
    'Genoa': 'resources/logos/genoa.png',
    'Inter': 'resources/logos/inter.png',
    'Juventus': 'resources/logos/juventus.png',
    'Lazio': 'resources/logos/lazio.png',
    'Lecce': 'resources/logos/lecce.png',
    'Milan': 'resources/logos/milan.png',
    'Monza': 'resources/logos/monza.png',
    'Napoli': 'resources/logos/napoli.png',
    'Parma': 'resources/logos/parma.png',
    'Roma': 'resources/logos/roma.png',
    'Sassuolo': 'resources/logos/sassuolo.png',
    'Torino': 'resources/logos/torino.png',
    'Udinese': 'resources/logos/udinese.png',
    'Venezia': 'resources/logos/venezia.png'
};

function loadCSVData() {
    const fileInput = document.getElementById('csv-file-input');
    const file = fileInput.files[0];

    if (!file) {
        alert('Seleziona un file prima di caricarlo');
        return;
    }

    // Check file type
    if (!/\.(csv|xlsx)$/i.test(file.name)) {
        alert('Seleziona un file valido (.xlsx o .csv)');
        return;
    }

    if (typeof XLSX === 'undefined') {
        alert('❌ Libreria di lettura file non caricata. Ricarica la pagina.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            csvPlayersData = parseQuotazioniFile(e.target.result);

            if (csvPlayersData.length > 0) {
                document.getElementById('show-player-selector-btn').classList.remove('hidden');
                document.getElementById('populate-others-btn').classList.remove('hidden');
                updatePopulateButtonText(); // Update button text when the list is loaded
                alert(`✅ Caricati ${csvPlayersData.length} giocatori da "${file.name}"!`);
                console.log('Players loaded:', csvPlayersData.slice(0, 5)); // Log first 5 for debugging
                saveState(); // Salva lo stato con i dati caricati
            } else {
                alert('❌ Nessun giocatore valido trovato nel file. Verifica che il formato sia corretto.');
            }
        } catch (error) {
            console.error('Error parsing quotazioni file:', error);
            alert(`❌ Errore nel parsing del file: ${error.message}`);
        }
    };

    reader.onerror = function () {
        alert('❌ Errore nel caricamento del file.');
    };

    reader.readAsArrayBuffer(file);
}

function showPlayerSelector() {
    const modal = document.getElementById('player-selector-modal');
    populateTeamFilter();
    populatePlayersTable();
    modal.classList.remove('hidden');
}

function populateTeamFilter() {
    const teamFilter = document.getElementById('team-filter');
    const teams = [...new Set(csvPlayersData.map(p => p.squadra))].sort();

    teamFilter.innerHTML = '<option value="">Tutte le squadre</option>';
    teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        teamFilter.appendChild(option);
    });
}

function getFilteredPlayers() {
    const roleFilter = document.getElementById('role-filter').value;
    const teamFilter = document.getElementById('team-filter').value;
    const nameFilter = document.getElementById('name-filter').value.toLowerCase();

    return csvPlayersData.filter(player => {
        const matchesRole = !roleFilter || player.role === roleFilter;
        const matchesTeam = !teamFilter || player.squadra === teamFilter;
        const matchesName = !nameFilter || player.nome.toLowerCase().includes(nameFilter);

        // Check if player already exists in any tier of any role (exclude already added players)
        const existsInAnyTier = Object.values(playersData).some(roleData =>
            Object.values(roleData).some(tierPlayers =>
                tierPlayers.some(p => p.id === player.id)
            )
        );

        return matchesRole && matchesTeam && matchesName && !existsInAnyTier;
    });
}

function populatePlayersTable() {
    const tbody = document.getElementById('players-table-body');
    const filteredPlayers = getFilteredPlayers();

    tbody.innerHTML = '';

    filteredPlayers.forEach(player => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-700';
        row.innerHTML = `
            <td class="px-2 sm:px-3 py-2">
                <input type="checkbox" class="player-checkbox rounded min-h-[20px] min-w-[20px]" data-player-id="${player.id}">
            </td>
            <td class="px-2 sm:px-3 py-2 text-xs sm:text-sm">${player.nome}</td>
            <td class="px-2 sm:px-3 py-2 text-center text-xs sm:text-sm">${player.role}</td>
            <td class="px-2 sm:px-3 py-2 text-xs sm:text-sm">${player.squadra}</td>
            <td class="px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold">${player.qta}</td>
            <td class="px-2 sm:px-3 py-2 text-xs sm:text-sm">${player.fvm}</td>
        `;
        tbody.appendChild(row);
    });

    updateSelectedCount();
}

function updateSelectedCount() {
    const checkboxes = document.querySelectorAll('.player-checkbox:checked');
    document.getElementById('selected-count').textContent = checkboxes.length;
}

function addSelectedPlayers() {
    const checkboxes = document.querySelectorAll('.player-checkbox:checked');
    const tierSelector = document.getElementById('tier-selector');
    const selectedTier = tierSelector.value;

    if (checkboxes.length === 0) {
        alert('Seleziona almeno un giocatore');
        return;
    }

    let addedCount = 0;

    checkboxes.forEach(checkbox => {
        const playerId = parseInt(checkbox.dataset.playerId);
        const player = csvPlayersData.find(p => p.id === playerId);

        if (player) {
            // Check if player already exists in any tier
            const existsInAnyTier = Object.values(playersData[player.role]).some(tier =>
                tier.some(p => p.id === player.id)
            );

            if (!existsInAnyTier) {
                const playerForList = {
                    id: player.id,
                    nome: player.nome,
                    squadra: player.squadra,
                    qta: player.qta,
                    role: player.role
                };

                playersData[player.role][selectedTier].push(playerForList);
                addedCount++;
            }
        }
    });

    if (addedCount > 0) {
        renderPlayers();
        saveState();
        // Update the players table to remove added players from the list
        populatePlayersTable();
        alert(`Aggiunti ${addedCount} giocatori alla categoria ${selectedTier}!`);
    }

    document.getElementById('player-selector-modal').classList.add('hidden');
}

function populateOthersCategory() {
    if (csvPlayersData.length === 0) {
        alert('Carica prima il listone quotazioni!');
        return;
    }

    const activeRole = state.activeRole;
    let addedCount = 0;

    // Filter players by active role only
    csvPlayersData.filter(player => player.role === activeRole).forEach(player => {
        // Check if player already exists in any tier of the active role
        const existsInAnyTier = Object.values(playersData[activeRole]).some(tier =>
            tier.some(p => p.id === player.id)
        );

        if (!existsInAnyTier) {
            const playerForList = {
                id: player.id,
                nome: player.nome,
                squadra: player.squadra,
                qta: player.qta,
                role: player.role
            };

            playersData[activeRole]['Altri'].push(playerForList);
            addedCount++;
        }
    });

    if (addedCount > 0) {
        renderPlayers();
        saveState();
        const roleNames = { 'P': 'Portieri', 'D': 'Difensori', 'C': 'Centrocampisti', 'A': 'Attaccanti' };
        alert(`Aggiunti ${addedCount} ${roleNames[activeRole].toLowerCase()} rimanenti nella categoria "Altri"!`);
    } else {
        const roleNames = { 'P': 'Portieri', 'D': 'Difensori', 'C': 'Centrocampisti', 'A': 'Attaccanti' };
        alert(`Tutti i ${roleNames[activeRole].toLowerCase()} sono già stati aggiunti alle categorie!`);
    }
}

function updatePopulateButtonText() {
    const roleNames = { 'P': 'Portieri', 'D': 'Difensori', 'C': 'Centrocampisti', 'A': 'Attaccanti' };
    const populateBtn = document.getElementById('populate-others-btn');
    if (populateBtn) {
        populateBtn.innerHTML = `Popola "Altri" ${roleNames[state.activeRole]}`;
    }
}

// --- STATO DELL'APPLICAZIONE (CARICATO O DI DEFAULT) ---
let playersData = JSON.parse(JSON.stringify(initialPlayersData)); // Deep copy
let state = { budget: 500, squad: [], activeRole: 'P', sortOptions: {}, removedPlayers: [], searchQuery: '', viewMode: 'large', favorites: [] };
let playerToDelete = { id: null, role: null, tier: null };

// --- ELEMENTI DEL DOM ---
const playersContainer = document.getElementById('players-container');
const remainingBudgetEl = document.getElementById('remaining-budget');
const squadCountEl = document.getElementById('squad-count');
const emptySquadMsgEl = document.getElementById('empty-squad-msg');

// Squad elements by role
const squadSections = {
    P: document.getElementById('squad-P-section'),
    D: document.getElementById('squad-D-section'),
    C: document.getElementById('squad-C-section'),
    A: document.getElementById('squad-A-section')
};

const squadContainers = {
    P: document.getElementById('squad-P'),
    D: document.getElementById('squad-D'),
    C: document.getElementById('squad-C'),
    A: document.getElementById('squad-A')
};

const squadSummary = document.getElementById('squad-summary');

const tabs = document.querySelectorAll('.role-tab');
const addPlayerModal = document.getElementById('add-player-modal');
const addPlayerForm = document.getElementById('add-player-form');
const cancelAddPlayerBtn = document.getElementById('cancel-add-player');
const confirmModal = document.getElementById('confirm-modal');
const confirmActionBtn = document.getElementById('confirm-action-btn');
const cancelConfirmBtn = document.getElementById('cancel-confirm-btn');
const confirmTitle = document.getElementById('confirm-title');
const confirmMessage = document.getElementById('confirm-message');
const resetBtn = document.getElementById('reset-btn');

// CSV elements
const csvFileInput = document.getElementById('csv-file-input');
const loadCSVBtn = document.getElementById('load-csv-btn');
const showPlayerSelectorBtn = document.getElementById('show-player-selector-btn');
const populateOthersBtn = document.getElementById('populate-others-btn');
const playerSelectorModal = document.getElementById('player-selector-modal');
const closePlayerSelectorBtn = document.getElementById('close-player-selector');
const cancelPlayerSelectionBtn = document.getElementById('cancel-player-selection');
const addSelectedPlayersBtn = document.getElementById('add-selected-players');
const selectAllPlayersBtn = document.getElementById('select-all-players');
const roleFilter = document.getElementById('role-filter');
const teamFilter = document.getElementById('team-filter');
const nameFilter = document.getElementById('name-filter');

// Add player modal elements
const csvModeBtn = document.getElementById('csv-mode-btn');
const manualModeBtn = document.getElementById('manual-mode-btn');
const csvSelectionMode = document.getElementById('csv-selection-mode');
const manualInputMode = document.getElementById('manual-input-mode');
const csvPlayerFilter = document.getElementById('csv-player-filter');
const csvPlayersList = document.getElementById('csv-players-list');
const selectedCsvPlayer = document.getElementById('selected-csv-player');
const selectedPlayerInfo = document.getElementById('selected-player-info');
const saveAddPlayerBtn = document.getElementById('save-add-player');

// State for add player modal
let selectedPlayerFromCSV = null;
let currentModalRole = null;
let currentModalTier = null;

// Export/Import elements
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFileInput = document.getElementById('import-file-input');
const importConfirmModal = document.getElementById('import-confirm-modal');
const importPreview = document.getElementById('import-preview');
const cancelImportBtn = document.getElementById('cancel-import-btn');
const confirmImportBtn = document.getElementById('confirm-import-btn');

// State for import
let pendingImportData = null;

// Move player modal elements
const movePlayerModal = document.getElementById('move-player-modal');
const movePlayerInfo = document.getElementById('move-player-info');
const moveToTierSelect = document.getElementById('move-to-tier');
const cancelMoveBtn = document.getElementById('cancel-move-btn');
const confirmMoveBtn = document.getElementById('confirm-move-btn');

// State for move player
let playerToMove = { id: null, role: null, tier: null, name: null };


// --- FUNZIONI DI GESTIONE STATO ---
function saveState() {
    const appState = {
        state: state,
        playersData: playersData,
        csvPlayersData: csvPlayersData
    };
    localStorage.setItem('fantacalcioAppState', JSON.stringify(appState));
}

function loadState() {
    const savedData = localStorage.getItem('fantacalcioAppState');
    if (savedData) {
        try {
            const appState = JSON.parse(savedData);
            state = appState.state;
            playersData = appState.playersData;
            
            // Carica anche i dati CSV se disponibili
            if (appState.csvPlayersData && appState.csvPlayersData.length > 0) {
                csvPlayersData = appState.csvPlayersData;
                // Mostra i bottoni per aprire il selettore di giocatori e popolare "Altri"
                document.getElementById('show-player-selector-btn').classList.remove('hidden');
                document.getElementById('populate-others-btn').classList.remove('hidden');
                updatePopulateButtonText(); // Update button text when CSV is restored
            }
        } catch (e) {
            console.error("Errore nel caricamento dello stato, resetto.", e);
            resetState();
        }
    }
}

function resetState() {
    localStorage.removeItem('fantacalcioAppState');
    location.reload();
}

// --- HELPER FUNCTIONS FOR VIEW MODES ---
function getTierContainerClass() {
    switch (state.viewMode) {
        case 'large':
            return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';
        case 'small':
            return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3';
        case 'list':
            return 'space-y-2';
        default:
            return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';
    }
}

function updateViewMode() {
    // Update button states
    const buttons = ['view-large', 'view-small', 'view-list'];
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            const isActive = (btnId === `view-${state.viewMode}`);
            btn.className = `px-3 py-1 text-xs rounded-md transition-colors ${isActive ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'
                }`;
        }
    });

    // Update tier containers
    const roleData = playersData[state.activeRole];
    for (const tier in roleData) {
        const tierContainer = document.getElementById(`tier-container-${tier}`);
        if (tierContainer) {
            tierContainer.className = getTierContainerClass();
            renderTierContent(tier, roleData[tier]);
        }
    }
}

// --- FUNZIONI DI RENDER ---
function renderPlayers() {
    playersContainer.innerHTML = '';
    const roleData = playersData[state.activeRole];
    const budgetAdvice = { P: 'Budget Consigliato: 20-30 (4-6%)', D: 'Budget Consigliato: 40-60 (8-12%)', C: 'Budget Consigliato: 120-150 (24-30%)', A: 'Budget Consigliato: 250-280 (50-56%)' };

    const budgetEl = document.createElement('div');
    budgetEl.className = 'bg-gray-800 p-3 rounded-lg mb-4 text-center';
    budgetEl.innerHTML = `<p class="font-semibold text-cyan-300">${budgetAdvice[state.activeRole]}</p>`;
    playersContainer.appendChild(budgetEl);

    // Add search field
    const searchEl = document.createElement('div');
    searchEl.className = 'bg-gray-800 p-4 rounded-lg mb-4';
    searchEl.innerHTML = `
        <div class="flex flex-col space-y-3">
            <div class="flex items-center space-x-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                    type="text" 
                    id="player-search-input"
                    placeholder="Cerca giocatori nella tua lista..." 
                    value="${state.searchQuery}"
                    class="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                ${state.searchQuery ? `
                    <button id="clear-search-btn" class="text-gray-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                ` : ''}
            </div>
            <div class="flex items-center justify-between">
                <span class="text-sm text-gray-400">Modalità visualizzazione:</span>
                <div class="flex bg-gray-700 rounded-lg p-1">
                    <button id="view-large" class="px-3 py-1 text-xs rounded-md transition-colors ${state.viewMode === 'large' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}" title="Card Grandi">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </button>
                    <button id="view-small" class="px-3 py-1 text-xs rounded-md transition-colors ${state.viewMode === 'small' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}" title="Card Piccole">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                        </svg>
                    </button>
                    <button id="view-list" class="px-3 py-1 text-xs rounded-md transition-colors ${state.viewMode === 'list' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}" title="Lista">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
    playersContainer.appendChild(searchEl);

    // Add event listeners for search
    const searchInput = document.getElementById('player-search-input');
    searchInput.addEventListener('input', (e) => {
        const cursorPosition = e.target.selectionStart;
        state.searchQuery = e.target.value;

        // Update clear button visibility
        const searchContainer = searchInput.parentElement;
        const existingClearBtn = document.getElementById('clear-search-btn');

        if (state.searchQuery && !existingClearBtn) {
            // Add clear button
            const clearBtn = document.createElement('button');
            clearBtn.id = 'clear-search-btn';
            clearBtn.className = 'text-gray-400 hover:text-white transition-colors';
            clearBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            `;
            clearBtn.addEventListener('click', () => {
                state.searchQuery = '';
                renderPlayers();
                saveState();
            });
            searchContainer.appendChild(clearBtn);
        } else if (!state.searchQuery && existingClearBtn) {
            // Remove clear button
            existingClearBtn.remove();
        }

        // Update only the tier contents and headers
        const roleData = playersData[state.activeRole];
        for (const tier in roleData) {
            // Update tier header counts
            const tierHeaders = document.querySelectorAll(`[data-tier="${tier}"]`);
            if (tierHeaders.length > 0) {
                const tierHeader = tierHeaders[0].closest('.flex');
                const countSpan = tierHeader?.querySelector('span');

                if (countSpan) {
                    let filteredCount = roleData[tier].length;
                    if (state.searchQuery && state.searchQuery.trim() !== '') {
                        const searchTerm = state.searchQuery.toLowerCase().trim();
                        filteredCount = roleData[tier].filter(player =>
                            player.nome.toLowerCase().includes(searchTerm) ||
                            player.squadra.toLowerCase().includes(searchTerm)
                        ).length;
                    }

                    countSpan.textContent = state.searchQuery && state.searchQuery.trim() !== '' ?
                        `${filteredCount}/${roleData[tier].length} giocatori` :
                        `${roleData[tier].length} giocatori`;
                }
            }

            // Update tier content
            renderTierContent(tier, roleData[tier]);
        }

        saveState();

        // Restore cursor position and focus
        setTimeout(() => {
            const newSearchInput = document.getElementById('player-search-input');
            if (newSearchInput) {
                newSearchInput.focus();
                newSearchInput.setSelectionRange(cursorPosition, cursorPosition);
            }
        }, 0);
    });

    const clearBtn = document.getElementById('clear-search-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            state.searchQuery = '';
            renderPlayers();
            saveState();
        });
    }

    // Add event listeners for view mode buttons
    document.getElementById('view-large').addEventListener('click', () => {
        state.viewMode = 'large';
        updateViewMode();
        saveState();
    });

    document.getElementById('view-small').addEventListener('click', () => {
        state.viewMode = 'small';
        updateViewMode();
        saveState();
    });

    document.getElementById('view-list').addEventListener('click', () => {
        state.viewMode = 'list';
        updateViewMode();
        saveState();
    });

    for (const tier in roleData) {
        const sortKey = `${state.activeRole}-${tier}`;
        if (!state.sortOptions[sortKey]) {
            state.sortOptions[sortKey] = 'price'; // Default sort
        }

        // Calculate filtered count for display
        let filteredCount = roleData[tier].length;
        if (state.searchQuery && state.searchQuery.trim() !== '') {
            const searchTerm = state.searchQuery.toLowerCase().trim();
            filteredCount = roleData[tier].filter(player =>
                player.nome.toLowerCase().includes(searchTerm) ||
                player.squadra.toLowerCase().includes(searchTerm)
            ).length;
        }

        const tierHeader = document.createElement('div');
        tierHeader.className = 'flex justify-between items-center mt-6 mb-3 border-b border-gray-700 pb-2';
        tierHeader.innerHTML = `
            <div class="flex items-center space-x-3">
                <h3 class="text-xl font-bold text-amber-400">${tier}</h3>
                <span class="text-sm text-gray-400">
                    ${state.searchQuery && state.searchQuery.trim() !== '' ?
                `${filteredCount}/${roleData[tier].length} giocatori` :
                `${roleData[tier].length} giocatori`
            }
                </span>
            </div>
            <div class="flex space-x-2" data-tier="${tier}">
                <button class="sort-btn text-xs py-1 px-3 rounded-full bg-gray-700 hover:bg-gray-600 ${state.sortOptions[sortKey] === 'price' ? 'active' : ''}" data-sort="price">Prezzo</button>
                <button class="sort-btn text-xs py-1 px-3 rounded-full bg-gray-700 hover:bg-gray-600 ${state.sortOptions[sortKey] === 'team' ? 'active' : ''}" data-sort="team">Squadra</button>
            </div>
        `;
        playersContainer.appendChild(tierHeader);

        const tierContainer = document.createElement('div');
        tierContainer.id = `tier-container-${tier}`;
        tierContainer.className = getTierContainerClass();
        playersContainer.appendChild(tierContainer);

        renderTierContent(tier, roleData[tier]);

        const addBtnContainer = document.createElement('div');
        addBtnContainer.className = 'flex justify-center items-center mt-4';
        const addBtn = document.createElement('button');
        addBtn.className = 'bg-cyan-800 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-full flex items-center transition-colors';
        addBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" /></svg> Aggiungi Giocatore`;
        addBtn.onclick = () => showAddPlayerModal(state.activeRole, tier);
        addBtnContainer.appendChild(addBtn);
        playersContainer.appendChild(addBtnContainer);
    }
}

function renderTierContent(tier, players) {
    const tierContainer = document.getElementById(`tier-container-${tier}`);
    tierContainer.innerHTML = '';
    const sortKey = `${state.activeRole}-${tier}`;
    const sortType = state.sortOptions[sortKey] || 'price';

    // Filter players based on search query
    let filteredPlayers = players;
    if (state.searchQuery && state.searchQuery.trim() !== '') {
        const searchTerm = state.searchQuery.toLowerCase().trim();
        filteredPlayers = players.filter(player =>
            player.nome.toLowerCase().includes(searchTerm) ||
            player.squadra.toLowerCase().includes(searchTerm)
        );
    }

    const sortedPlayers = [...filteredPlayers].sort((a, b) => {
        if (sortType === 'team') {
            return a.squadra.localeCompare(b.squadra);
        }
        const priceA = calculateRecommendedPrice(a, tier);
        const priceB = calculateRecommendedPrice(b, tier);
        return priceB - priceA;
    });

    sortedPlayers.forEach(player => {
        const isBoughtByMe = state.squad.some(p => p.id === player.id);
        const card = createPlayerCard(player, isBoughtByMe, state.activeRole, tier);
        tierContainer.appendChild(card);
    });

    // Show "no results" message if search yields no results
    if (state.searchQuery && state.searchQuery.trim() !== '' && sortedPlayers.length === 0) {
        const noResultsEl = document.createElement('div');
        noResultsEl.className = 'col-span-full text-center py-8 text-gray-400';
        noResultsEl.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p>Nessun giocatore trovato per "${state.searchQuery}"</p>
        `;
        tierContainer.appendChild(noResultsEl);
    }
}

function calculateRecommendedPrice(player, tier) {
    const qta = player.qta;
    if (qta === 1) return 1;

    // Moltiplicatori differenziati per ruolo e tier
    const multipliers = {
        'Top': {
            'P': 2.0,    // Portieri: 2x (es. 7 → 14)
            'D': 2.5,    // Difensori: 2.5x (es. 20 → 50)
            'C': 3.0,    // Centrocampisti: 3.0x (es. 30 → 90)
            'A': 4.5     // Attaccanti: 4.5x (es. 45 → 200)
        },
        'Buoni': {
            'P': 1.5,    // Portieri: 1.5x
            'D': 2.0,    // Difensori: 2x
            'C': 2.5,    // Centrocampisti: 2.5x
            'A': 3.0     // Attaccanti: 3x
        },
        'Scommesse': {
            'P': 1.0,    // Portieri: prezzo base
            'D': 1.2,    // Difensori: 1.2x
            'C': 1.5,    // Centrocampisti: 1.5x
            'A': 2.0     // Attaccanti: 2x
        },
        'Altri': {
            'P': 1.0,    // Portieri: prezzo base
            'D': 1.0,    // Difensori: prezzo base
            'C': 1.0,    // Centrocampisti: prezzo base
            'A': 1.0     // Attaccanti: prezzo base
        }
    };

    const roleMultiplier = multipliers[tier]?.[player.role] || 1.0; // fallback per Altri
    return Math.round(qta * roleMultiplier);
}

function createPlayerCard(player, isBoughtByMe = false, role, tier) {
    const card = document.createElement('div');
    card.id = `player-${player.id}`;
    const isRemoved = state.removedPlayers.includes(player.id);
    const recommendedPrice = calculateRecommendedPrice(player, tier);

    if (state.viewMode === 'list') {
        return createListPlayerCard(player, isBoughtByMe, role, tier, isRemoved, recommendedPrice);
    } else if (state.viewMode === 'small') {
        return createSmallPlayerCard(player, isBoughtByMe, role, tier, isRemoved, recommendedPrice);
    } else {
        return createLargePlayerCard(player, isBoughtByMe, role, tier, isRemoved, recommendedPrice);
    }
}

function createLargePlayerCard(player, isBoughtByMe, role, tier, isRemoved, recommendedPrice) {
    const card = document.createElement('div');
    card.id = `player-${player.id}`;
    const isFavorite = state.favorites.includes(player.id);
    // Priorità stati: acquistato > rimosso > preferito
    const stateClass = isBoughtByMe ? 'is-bought' : (isRemoved ? 'is-removed' : (isFavorite ? 'is-favorite' : ''));
    card.className = `player-card bg-gray-800 rounded-lg p-4 shadow-md flex flex-col justify-between relative ${stateClass}`;

    card.innerHTML = `
        <button class="absolute top-2 right-2 text-red-500 hover:text-red-400 permanent-delete-btn" data-id="${player.id}" data-role="${role}" data-tier="${tier}" data-name="${player.nome}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </button>
        <button class="absolute top-2 right-10 favorite-btn ${isFavorite ? 'active' : 'text-gray-400 hover:text-amber-400'}" data-id="${player.id}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="${isFavorite ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
        </button>
        <div>
            <div class="flex items-center mb-3">
                <img src="${teamLogos[player.squadra] || TEAM_LOGO_PLACEHOLDER}" alt="${player.squadra}" class="w-8 h-8 mr-3 object-contain rounded-full bg-white/10">
                <div>
                    <p class="font-bold text-lg">${player.nome}</p>
                    <p class="text-sm text-gray-400">${player.squadra}</p>
                </div>
            </div>
            <div class="flex justify-between items-center text-sm mb-3">
                <span class="text-gray-400">Quotazione:</span>
                <span class="font-semibold text-cyan-400">${player.qta}</span>
            </div>
            <div class="space-y-2">
                 <div>
                    <label for="rec-price-${player.id}" class="text-xs text-gray-400">Prezzo Consigliato:</label>
                    <input type="number" id="rec-price-${player.id}" value="${recommendedPrice}" class="w-full bg-gray-700 rounded p-2 text-center text-white min-h-[44px] text-sm sm:text-base">
                </div>
                <div>
                    <label for="paid-price-${player.id}" class="text-xs text-gray-400">Prezzo Pagato:</label>
                    <input type="number" id="paid-price-${player.id}" value="${player.qta}" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-center text-white focus:ring-2 focus:ring-cyan-500 min-h-[44px] text-sm sm:text-base">
                </div>
            </div>
        </div>
        <div class="mt-4 space-y-2">
            <div class="flex flex-col sm:flex-row gap-2">
                <button class="buy-btn bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded w-full transition-colors mobile-touch-btn text-sm sm:text-base" data-id="${player.id}">Compra</button>
                <button class="toggle-remove-btn ${isRemoved ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'} text-white font-bold py-3 px-4 rounded w-full transition-colors mobile-touch-btn text-sm sm:text-base">${isRemoved ? 'Ripristina' : 'Rimuovi'}</button>
            </div>
            <button class="move-player-btn bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded w-full transition-colors mobile-touch-btn text-sm sm:text-base" data-id="${player.id}" data-role="${role}" data-tier="${tier}">Sposta Categoria</button>
        </div>
    `;

    addPlayerCardEventListeners(card, player);
    return card;
}

function createSmallPlayerCard(player, isBoughtByMe, role, tier, isRemoved, recommendedPrice) {
    const card = document.createElement('div');
    card.id = `player-${player.id}`;
    const isFavorite = state.favorites.includes(player.id);
    // Priorità stati: acquistato > rimosso > preferito
    const stateClass = isBoughtByMe ? 'is-bought' : (isRemoved ? 'is-removed' : (isFavorite ? 'is-favorite' : ''));
    card.className = `player-card bg-gray-800 rounded-lg p-3 shadow-md flex flex-col justify-between relative ${stateClass}`;

    card.innerHTML = `
        <button class="absolute top-1 right-1 text-red-500 hover:text-red-400 permanent-delete-btn" data-id="${player.id}" data-role="${role}" data-tier="${tier}" data-name="${player.nome}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        <button class="absolute top-1 right-6 favorite-btn ${isFavorite ? 'active' : 'text-gray-400 hover:text-amber-400'}" data-id="${player.id}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="${isFavorite ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
        </button>
        <div>
            <div class="flex items-center mb-2">
                <img src="${teamLogos[player.squadra] || TEAM_LOGO_PLACEHOLDER}" alt="${player.squadra}" class="w-6 h-6 mr-2 object-contain rounded-full bg-white/10">
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-sm truncate">${player.nome}</p>
                    <p class="text-xs text-gray-400 truncate">${player.squadra}</p>
                </div>
            </div>
            <div class="text-center mb-2">
                <span class="text-xs text-gray-400">Q.ta: </span>
                <span class="font-semibold text-cyan-400 text-sm">${player.qta}</span>
            </div>
            <div class="space-y-1">
                <input type="number" id="paid-price-${player.id}" value="${player.qta}" placeholder="Prezzo" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-center text-white text-xs sm:text-sm focus:ring-1 focus:ring-cyan-500 min-h-[40px]">
            </div>
        </div>
        <div class="mt-2 space-y-1">
            <div class="flex gap-1">
                <button class="buy-btn bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-2 rounded flex-1 transition-colors text-xs sm:text-sm mobile-touch-btn" data-id="${player.id}">Compra</button>
                <button class="toggle-remove-btn ${isRemoved ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'} text-white font-bold py-2 px-2 rounded flex-1 transition-colors text-xs sm:text-sm mobile-touch-btn">${isRemoved ? 'Ripr.' : 'Rim.'}</button>
            </div>
            <button class="move-player-btn bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-2 rounded w-full transition-colors text-xs sm:text-sm mobile-touch-btn" data-id="${player.id}" data-role="${role}" data-tier="${tier}">Sposta</button>
        </div>
    `;

    addPlayerCardEventListeners(card, player);
    return card;
}

function createListPlayerCard(player, isBoughtByMe, role, tier, isRemoved, recommendedPrice) {
    const card = document.createElement('div');
    card.id = `player-${player.id}`;
    const isFavorite = state.favorites.includes(player.id);
    // Priorità stati: acquistato > rimosso > preferito
    const stateClass = isBoughtByMe ? 'is-bought' : (isRemoved ? 'is-removed' : (isFavorite ? 'is-favorite' : ''));
    card.className = `player-card bg-gray-800 rounded-lg p-3 shadow-md relative ${stateClass}`;

    card.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
            <!-- Info del giocatore -->
            <div class="flex items-center flex-1 min-w-0">
                <button class="favorite-btn ${isFavorite ? 'active' : 'text-gray-400 hover:text-amber-400'} mr-2 p-2" data-id="${player.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5" fill="${isFavorite ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                </button>
                <img src="${teamLogos[player.squadra] || TEAM_LOGO_PLACEHOLDER}" alt="${player.squadra}" class="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 object-contain rounded-full bg-white/10 flex-shrink-0">
                <div class="flex-1 min-w-0">
                    <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <p class="font-bold text-sm sm:text-lg truncate">${player.nome}</p>
                        <div class="flex items-center gap-2 text-xs sm:text-sm">
                            <p class="text-gray-400 truncate">${player.squadra}</p>
                            <span class="bg-gray-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs flex-shrink-0">Q.ta: ${player.qta}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Controlli -->
            <div class="flex flex-wrap items-center gap-2 justify-end sm:justify-start">
                <input type="number" id="paid-price-${player.id}" value="${player.qta}" class="w-16 sm:w-20 bg-gray-900 border border-gray-600 rounded p-2 text-center text-white text-xs sm:text-sm focus:ring-2 focus:ring-cyan-500 min-h-[40px] sm:min-h-[44px]" placeholder="€">
                <button class="buy-btn bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-2 sm:px-3 rounded transition-colors text-xs sm:text-sm mobile-touch-btn flex-shrink-0" data-id="${player.id}">Compra</button>
                <button class="toggle-remove-btn ${isRemoved ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'} text-white font-bold py-2 px-2 sm:px-3 rounded transition-colors text-xs sm:text-sm mobile-touch-btn flex-shrink-0">${isRemoved ? 'Ripr.' : 'Rim.'}</button>
                <button class="move-player-btn bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-2 sm:px-3 rounded transition-colors text-xs sm:text-sm mobile-touch-btn flex-shrink-0" data-id="${player.id}" data-role="${role}" data-tier="${tier}">Sposta</button>
                <button class="text-red-500 hover:text-red-400 permanent-delete-btn p-2 flex-shrink-0" data-id="${player.id}" data-role="${role}" data-tier="${tier}" data-name="${player.nome}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    `;

    addPlayerCardEventListeners(card, player);
    return card;
}

function addPlayerCardEventListeners(card, player) {
    const isBoughtByMe = state.squad.find(p => p.id === player.id);
    const isRemoved = state.removedPlayers.includes(player.id);

    if (isBoughtByMe) {
        const buyBtn = card.querySelector('.buy-btn');
        if (buyBtn) {
            buyBtn.disabled = true;
            buyBtn.textContent = 'Acquistato';
        }
        const toggleBtn = card.querySelector('.toggle-remove-btn');
        if (toggleBtn) toggleBtn.disabled = true;
    }

    card.querySelector('.buy-btn').addEventListener('click', () => buyPlayer(player.id));

    card.querySelector('.toggle-remove-btn').addEventListener('click', (e) => {
        const card = e.currentTarget.closest('.player-card');
        const button = e.currentTarget;
        const playerId = player.id;
        const isBoughtByMe = state.squad.some(p => p.id === playerId);

        // Previeni l'azione se il giocatore è nella squadra
        if (isBoughtByMe) {
            return;
        }

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
        if (nowRemoved) {
            button.textContent = button.textContent.includes('Ripr') ? 'Ripr.' : 'Ripristina';
        } else {
            button.textContent = button.textContent.includes('Rim') ? 'Rim.' : 'Rimuovi';
        }
        saveState();
    });

    card.querySelector('.permanent-delete-btn').addEventListener('click', (e) => {
        const button = e.currentTarget;
        const playerId = parseInt(button.dataset.id);
        const role = button.dataset.role;
        const tier = button.dataset.tier;
        const name = button.dataset.name;

        showConfirmModal(
            'Conferma Eliminazione',
            `Sei sicuro di voler eliminare ${name} dalla lista? L'azione è irreversibile.`,
            'Elimina',
            () => {
                playerToDelete.id = playerId;
                playerToDelete.role = role;
                playerToDelete.tier = tier;
                deletePlayer();
            }
        );
    });

    card.querySelector('.favorite-btn').addEventListener('click', (e) => {
        e.preventDefault();
        toggleFavorite(player.id);
    });

    card.querySelector('.move-player-btn').addEventListener('click', (e) => {
        const button = e.currentTarget;
        const playerId = parseInt(button.dataset.id);
        const role = button.dataset.role;
        const tier = button.dataset.tier;
        showMovePlayerModal(playerId, role, tier, player.nome);
    });
}

function toggleFavorite(playerId) {
    const index = state.favorites.indexOf(playerId);
    if (index > -1) {
        state.favorites.splice(index, 1);
    } else {
        state.favorites.push(playerId);
    }
    saveState();
    renderPlayers(); // Re-render to update the visual state
}

function showMovePlayerModal(playerId, role, tier, playerName) {
    playerToMove = { id: playerId, role: role, tier: tier, name: playerName };
    
    // Popola le informazioni del giocatore
    movePlayerInfo.innerHTML = `
        <div class="flex items-center">
            <div>
                <p class="font-bold text-white">${playerName}</p>
                <p class="text-sm text-gray-400">Attualmente in: ${tier}</p>
            </div>
        </div>
    `;
    
    // Imposta la categoria attuale come selezionata (disabilitata)
    moveToTierSelect.innerHTML = '';
    const tiers = ['Top', 'Buoni', 'Scommesse', 'Altri'];
    tiers.forEach(tierOption => {
        const option = document.createElement('option');
        option.value = tierOption;
        option.textContent = tierOption;
        if (tierOption === tier) {
            option.disabled = true;
            option.textContent += ' (attuale)';
        }
        moveToTierSelect.appendChild(option);
    });
    
    // Seleziona la prima opzione disponibile
    const availableOptions = Array.from(moveToTierSelect.options).filter(opt => !opt.disabled);
    if (availableOptions.length > 0) {
        availableOptions[0].selected = true;
    }
    
    movePlayerModal.classList.remove('hidden');
}

function movePlayer() {
    const newTier = moveToTierSelect.value;
    const { id, role, tier } = playerToMove;
    
    // Trova il giocatore nella categoria attuale
    const currentTierArray = playersData[role][tier];
    const playerIndex = currentTierArray.findIndex(p => p.id === id);
    
    if (playerIndex > -1) {
        // Rimuovi il giocatore dalla categoria attuale
        const player = currentTierArray.splice(playerIndex, 1)[0];
        
        // Aggiungi il giocatore alla nuova categoria
        playersData[role][newTier].push(player);
        
        // Riaggiorna l'interfaccia
        renderPlayers();
        saveState();
        
        alert(`${playerToMove.name} spostato da "${tier}" a "${newTier}"!`);
    }
    
    movePlayerModal.classList.add('hidden');
}

function updateUI() {
    remainingBudgetEl.textContent = state.budget;
    remainingBudgetEl.classList.toggle('text-red-500', state.budget < 100);
    remainingBudgetEl.classList.toggle('text-green-400', state.budget >= 100);
    squadCountEl.textContent = `${state.squad.length} / 25`;

    const counts = { P: 0, D: 0, C: 0, A: 0 };
    const spent = { P: 0, D: 0, C: 0, A: 0 };

    state.squad.forEach(p => {
        const playerInfo = getPlayerById(p.id);
        if (playerInfo) {
            const role = playerInfo.R;
            counts[role]++;
            spent[role] += p.price;
        }
    });

    // Update the elements in the header (these still exist)
    for (const role in counts) {
        const spentElement = document.getElementById(`spent-${role}`);
        if (spentElement) {
            spentElement.textContent = spent[role];
        }
    }

    renderMySquad();
}

function buyPlayer(playerId) {
    const playerCard = document.getElementById(`player-${playerId}`);
    const pricePaid = parseInt(playerCard.querySelector(`#paid-price-${playerId}`).value);

    if (isNaN(pricePaid) || pricePaid <= 0) { alert("Inserisci un prezzo valido."); return; }
    if (state.budget < pricePaid) { alert("Budget non sufficiente!"); return; }

    const playerInfo = getPlayerById(playerId);
    const role = playerInfo.R;
    const roleLimits = { P: 3, D: 8, C: 8, A: 6 };
    const currentRoleCount = state.squad.filter(p => getPlayerById(p.id)?.R === role).length;

    if (currentRoleCount >= roleLimits[role]) { alert(`Hai già raggiunto il limite di ${roleLimits[role]} giocatori per questo ruolo.`); return; }

    state.budget -= pricePaid;
    state.squad.push({ id: playerId, price: pricePaid });

    // Aggiungi automaticamente il giocatore alla lista dei rimossi
    if (!state.removedPlayers.includes(playerId)) {
        state.removedPlayers.push(playerId);
    }

    // Rimuovi automaticamente il giocatore dai preferiti
    const favoriteIndex = state.favorites.indexOf(playerId);
    if (favoriteIndex > -1) {
        state.favorites.splice(favoriteIndex, 1);
    }

    playerCard.classList.add('bought-by-me');
    playerCard.classList.add('bought'); // Aggiungi anche la classe 'bought' per l'opacità ridotta
    playerCard.classList.add('is-bought');

    // Rimuovi il bordo dorato dei preferiti se presente
    playerCard.classList.remove('favorite-card');
    playerCard.classList.remove('is-favorite');

    const buyBtn = playerCard.querySelector('.buy-btn');
    buyBtn.disabled = true;
    buyBtn.textContent = 'Acquistato';
    buyBtn.classList.replace('bg-green-600', 'bg-gray-600');

    // Aggiorna il tasto stella per mostrare che non è più preferito
    const favoriteBtn = playerCard.querySelector('.favorite-btn');
    if (favoriteBtn) {
        favoriteBtn.classList.remove('active');
        favoriteBtn.classList.add('text-gray-400', 'hover:text-amber-400');
        const star = favoriteBtn.querySelector('svg');
        if (star) {
            star.setAttribute('fill', 'none');
        }
    }

    // Aggiorna anche il tasto rimuovi per mostrare "Ripristina"
    const toggleBtn = playerCard.querySelector('.toggle-remove-btn');
    if (toggleBtn) {
        toggleBtn.textContent = toggleBtn.textContent.includes('Ripr') ? 'Ripr.' : 'Ripristina';
        toggleBtn.classList.replace('bg-red-600', 'bg-yellow-600');
        toggleBtn.classList.replace('hover:bg-red-700', 'hover:bg-yellow-700');
    }

    updateUI();
    saveState();
}

function getPlayerById(id) {
    for (const role in playersData) {
        for (const tier in playersData[role]) {
            const player = playersData[role][tier].find(p => p.id === id);
            if (player) return { ...player, R: role };
        }
    }
    return null;
}

function renderMySquad() {
    // Show/hide empty message
    const hasPlayers = state.squad.length > 0;
    emptySquadMsgEl.style.display = hasPlayers ? 'none' : 'block';

    // Check if squadSummary exists before using it
    if (squadSummary) {
        squadSummary.classList.toggle('hidden', !hasPlayers);
    }

    // Clear all role containers - check if they exist first
    Object.values(squadContainers).forEach(container => {
        if (container) container.innerHTML = '';
    });

    if (!hasPlayers) {
        // Hide all role sections
        Object.values(squadSections).forEach(section => {
            if (section) section.classList.add('hidden');
        });
        return;
    }

    // Group players by role
    const playersByRole = { P: [], D: [], C: [], A: [] };
    const counts = { P: 0, D: 0, C: 0, A: 0 };
    const spent = { P: 0, D: 0, C: 0, A: 0 };

    state.squad.forEach(boughtPlayer => {
        const playerInfo = getPlayerById(boughtPlayer.id);
        if (playerInfo) {
            const role = playerInfo.R;
            playersByRole[role].push({ ...boughtPlayer, playerInfo });
            counts[role]++;
            spent[role] += boughtPlayer.price;
        }
    });

    // Render each role section
    Object.keys(playersByRole).forEach(role => {
        const players = playersByRole[role];
        const section = squadSections[role];
        const container = squadContainers[role];

        if (players.length > 0 && section && container) {
            section.classList.remove('hidden');

            // Sort players by price (highest first)
            players.sort((a, b) => b.price - a.price);

            players.forEach(({ id, price, playerInfo }) => {
                const squadCard = createSquadPlayerCard(playerInfo, price, id, role);
                container.appendChild(squadCard);
            });

            // Update role counters
            const countElement = document.getElementById(`squad-count-${role}`);
            const spentElement = document.getElementById(`squad-spent-${role}`);

            if (countElement) countElement.textContent = players.length;
            if (spentElement) spentElement.textContent = spent[role];
        } else if (section) {
            section.classList.add('hidden');
        }
    });

    // Update summary
    Object.keys(counts).forEach(role => {
        const summaryCountElement = document.getElementById(`summary-count-${role}`);
        const summarySpentElement = document.getElementById(`summary-spent-${role}`);

        if (summaryCountElement) summaryCountElement.textContent = counts[role];
        if (summarySpentElement) summarySpentElement.textContent = spent[role];
    });
}

function createSquadPlayerCard(playerInfo, price, playerId, role) {
    const roleColors = {
        P: 'border-blue-500 bg-blue-900/10',
        D: 'border-green-500 bg-green-900/10',
        C: 'border-yellow-500 bg-yellow-900/10',
        A: 'border-red-500 bg-red-900/10'
    };

    const priceColors = {
        P: 'text-blue-400',
        D: 'text-green-400',
        C: 'text-yellow-400',
        A: 'text-red-400'
    };

    const squadCard = document.createElement('div');
    squadCard.className = `bg-gray-800 rounded-lg p-3 shadow-md border-l-4 ${roleColors[role]} hover:bg-gray-750 transition-colors`;

    squadCard.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center flex-1">
                <img src="${teamLogos[playerInfo.squadra] || TEAM_LOGO_PLACEHOLDER}" 
                     alt="${playerInfo.squadra}" 
                     class="w-8 h-8 mr-3 object-contain rounded-full bg-white/10">
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <p class="font-semibold text-white">${playerInfo.nome}</p>
                        <span class="px-2 py-1 text-xs font-bold rounded-full bg-gray-700 text-gray-300">${role}</span>
                    </div>
                    <p class="text-sm text-gray-400">${playerInfo.squadra} • Q.ta: ${playerInfo.qta}</p>
                </div>
            </div>
            <div class="text-right ml-3">
                <p class="font-bold text-lg ${priceColors[role]}">€${price}</p>
                <button class="sell-btn text-xs text-red-500 hover:text-red-400 font-medium" 
                        data-id="${playerId}" data-price="${price}">
                    Vendi
                </button>
            </div>
        </div>
    `;

    squadCard.querySelector('.sell-btn').addEventListener('click', sellPlayer);
    return squadCard;
}

function sellPlayer(event) {
    const playerId = parseInt(event.target.dataset.id);
    const price = parseInt(event.target.dataset.price);

    state.squad = state.squad.filter(p => p.id !== playerId);
    state.budget += price;

    // Ripristina automaticamente il giocatore rimuovendolo dalla lista dei rimossi
    state.removedPlayers = state.removedPlayers.filter(id => id !== playerId);

    const playerCard = document.getElementById(`player-${playerId}`);
    if (playerCard) {
        playerCard.classList.remove('bought-by-me');
        playerCard.classList.remove('bought'); // Rimuovi anche l'opacità
        playerCard.classList.remove('removed-card'); // Rimuovi anche il bordo rosso
        playerCard.classList.remove('is-bought', 'is-removed');

        const buyBtn = playerCard.querySelector('.buy-btn');
        buyBtn.disabled = false;
        buyBtn.textContent = 'Compra';
        buyBtn.classList.replace('bg-gray-600', 'bg-green-600');

        // Aggiorna il tasto rimuovi per tornare a "Rimuovi" e riabilitarlo
        const toggleBtn = playerCard.querySelector('.toggle-remove-btn');
        if (toggleBtn) {
            toggleBtn.disabled = false;
            toggleBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            toggleBtn.classList.add('hover:bg-red-700'); // Ripristina hover effect
            toggleBtn.textContent = toggleBtn.textContent.includes('Ripr') ? 'Rim.' : 'Rimuovi';
            toggleBtn.classList.replace('bg-yellow-600', 'bg-red-600');
            toggleBtn.classList.replace('hover:bg-yellow-700', 'hover:bg-red-700');
        }
    }
    updateUI();
    saveState();
}

function showAddPlayerModal(role, tier) {
    currentModalRole = role;
    currentModalTier = tier;
    selectedPlayerFromCSV = null;

    // Reset modal state
    csvModeBtn.classList.add('bg-cyan-600');
    csvModeBtn.classList.remove('bg-gray-600');
    manualModeBtn.classList.add('bg-gray-600');
    manualModeBtn.classList.remove('bg-cyan-600');
    csvSelectionMode.classList.remove('hidden');
    manualInputMode.classList.add('hidden');
    selectedCsvPlayer.classList.add('hidden');

    // Populate CSV players for the specific role
    populateCSVPlayersForRole(role);

    addPlayerModal.classList.remove('hidden');
}

function populateCSVPlayersForRole(role) {
    if (csvPlayersData.length === 0) {
        csvPlayersList.innerHTML = '<p class="text-gray-400 text-sm">Carica prima il listone quotazioni per vedere i giocatori disponibili.</p>';
        return;
    }

    // Filter players by role and exclude already added players
    const availablePlayers = csvPlayersData.filter(player => {
        if (player.role !== role) return false;

        // Check if player already exists in any tier
        const existsInAnyTier = Object.values(playersData[role]).some(tierPlayers =>
            tierPlayers.some(p => p.id === player.id)
        );

        return !existsInAnyTier;
    });

    if (availablePlayers.length === 0) {
        csvPlayersList.innerHTML = '<p class="text-gray-400 text-sm">Nessun giocatore disponibile per questo ruolo.</p>';
        return;
    }

    renderAvailablePlayers(availablePlayers);
}

function renderAvailablePlayers(players) {
    csvPlayersList.innerHTML = '';

    players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'p-2 bg-gray-700 rounded-md hover:bg-gray-600 cursor-pointer player-option';
        playerDiv.dataset.playerId = player.id;

        playerDiv.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <div class="font-medium">${player.nome}</div>
                    <div class="text-sm text-gray-400">${player.squadra}</div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-cyan-400">${player.qta}</div>
                    ${player.fvm ? `<div class="text-xs text-gray-400">FVM: ${player.fvm}</div>` : ''}
                </div>
            </div>
        `;

        playerDiv.addEventListener('click', () => selectPlayerFromCSV(player));
        csvPlayersList.appendChild(playerDiv);
    });
}

function selectPlayerFromCSV(player) {
    selectedPlayerFromCSV = player;

    // Update selection visual
    document.querySelectorAll('.player-option').forEach(el => {
        el.classList.remove('bg-cyan-600', 'bg-gray-600');
        el.classList.add('bg-gray-700');
    });

    const selectedDiv = document.querySelector(`[data-player-id="${player.id}"]`);
    selectedDiv.classList.remove('bg-gray-700');
    selectedDiv.classList.add('bg-cyan-600');

    // Show selected player info
    selectedPlayerInfo.innerHTML = `
        <div class="flex justify-between items-center">
            <div>
                <div class="font-medium">${player.nome}</div>
                <div class="text-sm text-gray-400">${player.squadra} - ${player.role}</div>
            </div>
            <div class="text-right">
                <div class="font-bold text-cyan-400">Q.ta: ${player.qta}</div>
                ${player.fvm ? `<div class="text-xs text-gray-400">FVM: ${player.fvm}</div>` : ''}
            </div>
        </div>
    `;

    selectedCsvPlayer.classList.remove('hidden');
}

function filterCSVPlayers() {
    const filterValue = csvPlayerFilter.value.toLowerCase();
    const playerOptions = document.querySelectorAll('.player-option');

    playerOptions.forEach(option => {
        const playerName = option.querySelector('.font-medium').textContent.toLowerCase();
        const playerTeam = option.querySelector('.text-gray-400').textContent.toLowerCase();

        if (playerName.includes(filterValue) || playerTeam.includes(filterValue)) {
            option.style.display = 'block';
        } else {
            option.style.display = 'none';
        }
    });
}

function addPlayerToList() {
    if (csvSelectionMode.classList.contains('hidden')) {
        // Manual mode
        const name = document.getElementById('new-player-name').value;
        const team = document.getElementById('new-player-team').value;
        const qta = parseInt(document.getElementById('new-player-qta').value);

        if (!name || !team || !qta) {
            alert('Compila tutti i campi');
            return;
        }

        const newPlayer = {
            id: Date.now(),
            nome: name,
            squadra: team,
            qta: qta,
            role: currentModalRole
        };

        playersData[currentModalRole][currentModalTier].push(newPlayer);
    } else {
        // CSV mode
        if (!selectedPlayerFromCSV) {
            alert('Seleziona un giocatore dalla lista');
            return;
        }

        const playerForList = {
            id: selectedPlayerFromCSV.id,
            nome: selectedPlayerFromCSV.nome,
            squadra: selectedPlayerFromCSV.squadra,
            qta: selectedPlayerFromCSV.qta,
            role: selectedPlayerFromCSV.role
        };

        playersData[currentModalRole][currentModalTier].push(playerForList);
    }

    renderTierContent(currentModalTier, playersData[currentModalRole][currentModalTier]);
    addPlayerModal.classList.add('hidden');

    // Reset form
    document.getElementById('new-player-name').value = '';
    document.getElementById('new-player-team').value = '';
    document.getElementById('new-player-qta').value = '';
    selectedPlayerFromCSV = null;

    saveState();
}

function deletePlayer() {
    const { id, role, tier } = playerToDelete;
    const tierArray = playersData[role][tier];
    const playerIndex = tierArray.findIndex(p => p.id === id);

    if (playerIndex > -1) {
        tierArray.splice(playerIndex, 1);
    }

    const cardToRemove = document.getElementById(`player-${id}`);
    if (cardToRemove) {
        cardToRemove.remove();
    }

    confirmModal.classList.add('hidden');
    saveState();
}

function showConfirmModal(title, message, confirmText, onConfirm) {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmActionBtn.textContent = confirmText;

    // This replaces any previous handler by assigning a new one.
    confirmActionBtn.onclick = () => {
        onConfirm();
        confirmModal.classList.add('hidden');
    };

    confirmModal.classList.remove('hidden');
}

// --- EXPORT/IMPORT FUNCTIONS ---
function exportData() {
    const exportData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        state: state,
        playersData: playersData,
        csvPlayersData: csvPlayersData
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);

    const date = new Date().toLocaleDateString('it-IT').replace(/\//g, '-');
    link.download = `fantacalcio-backup-${date}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show success message
    alert('Dati esportati con successo! Il file è stato scaricato.');
}

function importData() {
    importFileInput.click();
}

function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedData = JSON.parse(e.target.result);

            // Validate the imported data
            if (!importedData.state || !importedData.playersData) {
                alert('File non valido: struttura dati mancante.');
                return;
            }

            pendingImportData = importedData;
            showImportPreview(importedData);

        } catch (error) {
            alert('Errore nel leggere il file: ' + error.message);
        }
    };

    reader.readAsText(file);
    // Reset input
    event.target.value = '';
}

function showImportPreview(data) {
    const { state: importState, timestamp } = data;
    const date = timestamp ? new Date(timestamp).toLocaleString('it-IT') : 'Sconosciuta';

    const squadCount = importState.squad ? importState.squad.length : 0;
    const budgetRemaining = importState.budget || 500;
    const budgetSpent = 500 - budgetRemaining;

    // Count players by role
    const roleCounts = { P: 0, D: 0, C: 0, A: 0 };
    if (importState.squad) {
        importState.squad.forEach(player => {
            // Try to find player info to determine role
            for (const role in data.playersData) {
                for (const tier in data.playersData[role]) {
                    if (data.playersData[role][tier].some(p => p.id === player.id)) {
                        roleCounts[role]++;
                        break;
                    }
                }
            }
        });
    }

    importPreview.innerHTML = `
        <h4 class="font-bold text-cyan-400 mb-3">Anteprima Backup</h4>
        <div class="space-y-2 text-sm">
            <p><strong>Data:</strong> ${date}</p>
            <p><strong>Giocatori in squadra:</strong> ${squadCount}/25</p>
            <p><strong>Budget speso:</strong> €${budgetSpent}/500 (rimanente: €${budgetRemaining})</p>
            <div class="mt-3">
                <strong>Giocatori per ruolo:</strong>
                <div class="grid grid-cols-2 gap-2 mt-1 text-xs">
                    <span>Portieri: ${roleCounts.P}/3</span>
                    <span>Difensori: ${roleCounts.D}/8</span>
                    <span>Centrocampisti: ${roleCounts.C}/8</span>
                    <span>Attaccanti: ${roleCounts.A}/6</span>
                </div>
            </div>
        </div>
    `;

    importConfirmModal.classList.remove('hidden');
}

function confirmImport() {
    if (!pendingImportData) return;

    try {
        // Apply imported data
        state = { ...pendingImportData.state };
        playersData = JSON.parse(JSON.stringify(pendingImportData.playersData));

        if (pendingImportData.csvPlayersData) {
            csvPlayersData = [...pendingImportData.csvPlayersData];
        }

        // Save to localStorage
        saveState();

        // Update UI
        renderPlayers();
        updateUI();

        // Close modal
        importConfirmModal.classList.add('hidden');
        pendingImportData = null;

        alert('Dati importati con successo!');

    } catch (error) {
        alert('Errore nell\'importazione: ' + error.message);
    }
}

function cancelImport() {
    importConfirmModal.classList.add('hidden');
    pendingImportData = null;
}

// --- INIZIALIZZAZIONE E EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    renderPlayers();
    updateUI();
    updatePopulateButtonText(); // Initialize button text
});

tabs.forEach(tab => {
    tab.addEventListener('click', e => {
        e.preventDefault();
        tabs.forEach(t => {
            t.classList.remove('border-cyan-400', 'text-cyan-400');
            t.classList.add('border-transparent', 'text-gray-400');
        });
        e.target.classList.add('border-cyan-400', 'text-cyan-400');
        e.target.classList.remove('border-transparent', 'text-gray-400');
        state.activeRole = e.target.dataset.role;
        updatePopulateButtonText(); // Update button text when role changes
        renderPlayers();
    });
});

playersContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('sort-btn')) {
        const sortType = e.target.dataset.sort;
        const tier = e.target.parentElement.dataset.tier;
        const sortKey = `${state.activeRole}-${tier}`;
        state.sortOptions[sortKey] = sortType;

        e.target.parentElement.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        renderTierContent(tier, playersData[state.activeRole][tier]);
        saveState();
    }
});

// Add player modal event listeners
csvModeBtn.addEventListener('click', () => {
    csvModeBtn.classList.add('bg-cyan-600');
    csvModeBtn.classList.remove('bg-gray-600');
    manualModeBtn.classList.add('bg-gray-600');
    manualModeBtn.classList.remove('bg-cyan-600');
    csvSelectionMode.classList.remove('hidden');
    manualInputMode.classList.add('hidden');
});

manualModeBtn.addEventListener('click', () => {
    manualModeBtn.classList.add('bg-cyan-600');
    manualModeBtn.classList.remove('bg-gray-600');
    csvModeBtn.classList.add('bg-gray-600');
    csvModeBtn.classList.remove('bg-cyan-600');
    manualInputMode.classList.remove('hidden');
    csvSelectionMode.classList.add('hidden');
});

csvPlayerFilter.addEventListener('input', filterCSVPlayers);
saveAddPlayerBtn.addEventListener('click', addPlayerToList);

cancelAddPlayerBtn.addEventListener('click', () => {
    document.getElementById('new-player-name').value = '';
    document.getElementById('new-player-team').value = '';
    document.getElementById('new-player-qta').value = '';
    selectedPlayerFromCSV = null;
    addPlayerModal.classList.add('hidden');
});

cancelConfirmBtn.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
});

resetBtn.addEventListener('click', () => {
    showConfirmModal(
        'Reset Asta',
        'Sei sicuro di voler resettare tutti i dati? La tua squadra e tutte le modifiche andranno perse.',
        'Reset',
        resetState
    );
});

// Export/Import Event Listeners
exportBtn.addEventListener('click', exportData);
importBtn.addEventListener('click', importData);
importFileInput.addEventListener('change', handleImportFile);
cancelImportBtn.addEventListener('click', cancelImport);
confirmImportBtn.addEventListener('click', confirmImport);

// Move player modal event listeners
cancelMoveBtn.addEventListener('click', () => {
    movePlayerModal.classList.add('hidden');
});
confirmMoveBtn.addEventListener('click', movePlayer);

// CSV Event Listeners
csvFileInput.addEventListener('change', () => {
    loadCSVBtn.disabled = !csvFileInput.files[0];
});

loadCSVBtn.addEventListener('click', loadCSVData);
showPlayerSelectorBtn.addEventListener('click', showPlayerSelector);
populateOthersBtn.addEventListener('click', populateOthersCategory);
closePlayerSelectorBtn.addEventListener('click', () => {
    playerSelectorModal.classList.add('hidden');
});
cancelPlayerSelectionBtn.addEventListener('click', () => {
    playerSelectorModal.classList.add('hidden');
});
addSelectedPlayersBtn.addEventListener('click', addSelectedPlayers);

// Filter event listeners
roleFilter.addEventListener('change', populatePlayersTable);
teamFilter.addEventListener('change', populatePlayersTable);
nameFilter.addEventListener('input', populatePlayersTable);

// Select all functionality
selectAllPlayersBtn.addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.player-checkbox');
    checkboxes.forEach(cb => cb.checked = e.target.checked);
    updateSelectedCount();
});

// Update count when individual checkboxes change
document.addEventListener('change', (e) => {
    if (e.target.classList.contains('player-checkbox')) {
        updateSelectedCount();

        // Update select all checkbox state
        const allCheckboxes = document.querySelectorAll('.player-checkbox');
        const checkedCheckboxes = document.querySelectorAll('.player-checkbox:checked');

        if (checkedCheckboxes.length === 0) {
            selectAllPlayersBtn.indeterminate = false;
            selectAllPlayersBtn.checked = false;
        } else if (checkedCheckboxes.length === allCheckboxes.length) {
            selectAllPlayersBtn.indeterminate = false;
            selectAllPlayersBtn.checked = true;
        } else {
            selectAllPlayersBtn.indeterminate = true;
        }
    }
});
