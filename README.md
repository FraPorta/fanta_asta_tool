# 🏆 Fanta Asta Tool

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](#)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](#)
[![Mobile Responsive](https://img.shields.io/badge/Mobile-Responsive-green)](#)

Un **tool web interattivo** per gestire le aste del Fantacalcio 2025/26. Ottimizzato per desktop e mobile, ti aiuta a organizzare la tua asta con un'interfaccia moderna e funzionalità avanzate.

![Preview 2](resources/squadra.png)

![Fanta Asta Tool Preview](resources/lista.png)

## ✨ Caratteristiche Principali

### 🎯 **Gestione Asta Completa**
- **Importazione CSV**: Carica le quotazioni ufficiali Fantacalcio 2025/26
- **Ricerca Intelligente**: Filtra per nome, ruolo, squadra e tier
- **Selezione Multipla**: Aggiungi più giocatori contemporaneamente
- **Prezzi Suggeriti**: Calcolo automatico prezzi consigliati per tier

### 💎 **Sistema Favoriti**
- **Wishlist Personalizzata**: Contrassegna i tuoi giocatori preferiti con la stella ⭐
- **Bordi Colorati**: Identificazione visiva immediata (dorato per favoriti, verde per acquistati, rosso per rimossi)
- **Priorità Visuale**: Sistema di bordi con priorità per stato del giocatore

### 📱 **Esperienza Mobile-First**
- **Design Responsive**: Ottimizzato per smartphone, tablet e desktop
- **Touch Targets**: Pulsanti dimensionati per il tocco (minimum 44px)
- **Layout Adattivo**: 3 modalità di visualizzazione (Grande, Piccola, Lista)
- **Gesture Friendly**: Input ottimizzati per dispositivi touch

### 📊 **Monitoraggio Budget**
- **Budget Tracker**: Visualizzazione in tempo reale del budget rimanente
- **Spesa per Ruolo**: Breakdown dettagliato P/D/C/A
- **Limiti Rosa**: Controllo automatico limiti 25 giocatori per ruolo
- **Calcoli Automatici**: Aggiornamento istantaneo di tutte le statistiche

### 💾 **Persistenza Dati**
- **AutoSave**: Salvataggio automatico su localStorage
- **Import/Export**: Backup e ripristino configurazioni asta
- **Stato Completo**: Mantiene favoriti, rimozioni e acquisti tra sessioni

## 🚀 Come Iniziare

### Metodo 1: GitHub Pages (Consigliato)
```bash
# Apri direttamente nel browser
https://fraporta.github.io/fanta_asta_tool/
```

### Metodo 2: Download Locale
```bash
# Clona la repository
git clone https://github.com/FraPorta/fanta_asta_tool.git

# Entra nella cartella
cd fanta_asta_tool

# Apri il file index.html nel browser
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

### Metodo 3: Server Locale
```bash
# Con Python 3
python -m http.server 8000

# Con Node.js
npx serve .

# Visita http://localhost:8000
```

## 📖 Guida all'Uso

### 1️⃣ **Importazione Giocatori**
1. Clicca **"Seleziona Giocatori"** per aprire il selettore CSV
2. Usa i filtri per trovare i giocatori desiderati
3. Seleziona i checkbox e clicca **"Aggiungi Selezionati"**
4. Scegli il tier appropriato (Top/Buoni/Scommesse)

### 2️⃣ **Gestione Durante l'Asta**
- **⭐ Favoriti**: Clicca la stella per aggiungere alla wishlist
- **💰 Acquisto**: Inserisci il prezzo e clicca "Compra"
- **🙈 Nascondi**: Usa "Rimuovi" per nascondere giocatori non interessanti
- **🗑️ Elimina**: Pulsante X per rimuovere definitivamente

### 3️⃣ **Visualizzazioni**
- **🔍 Grande**: Card dettagliate con tutte le info
- **📱 Piccola**: Card compatte per overview rapida
- **📋 Lista**: Vista tabulare ottimizzata per mobile

### 4️⃣ **Backup e Ripristino**
- **📤 Esporta**: Salva configurazione corrente in JSON
- **📥 Importa**: Ripristina da file di backup precedente
- **🔄 Reset**: Pulisci tutto e ricomincia

## 🛠️ Tecnologie Utilizzate

| Tecnologia          | Versione | Scopo                         |
| ------------------- | -------- | ----------------------------- |
| **HTML5**           | -        | Struttura semantica           |
| **CSS3**            | -        | Styling avanzato e animazioni |
| **JavaScript ES6+** | -        | Logica applicativa            |
| **Tailwind CSS**    | 3.x      | Framework CSS utility-first   |
| **Web APIs**        | -        | localStorage, File API        |

## 📂 Struttura del Progetto

```
fanta_asta_tool/
├── 📄 index.html                          # App principale (SPA)
├── 📊 Quotazioni_Fantacalcio_2025_26.csv  # Dataset giocatori ufficiale
├── 📝 README.md                           # Documentazione
├── ⚖️ LICENSE                             # Licenza Apache 2.0
└── 🔧 .git/                              # Controllo versione
```

## 🎨 Personalizzazione

Il tool supporta diverse personalizzazioni tramite modifica del codice:

### Colori Tema
```css
/* Modifica i colori principali in index.html */
:root {
  --primary-color: #06b6d4;    /* Cyan */
  --success-color: #22c55e;    /* Green */
  --warning-color: #f59e0b;    /* Amber */
  --danger-color: #ef4444;     /* Red */
}
```

### Calcolo Prezzi
```javascript
// Personalizza i moltiplicatori per ruolo e tier
function calculateRecommendedPrice(player, tier) {
    const multipliers = {
        'Top': {
            'P': 2.0,    // Portieri: 2x (es. 7 → 14)
            'D': 2.5,    // Difensori: 2.5x (es. 20 → 50)
            'C': 3.5,    // Centrocampisti: 3.5x (es. 30 → 105)
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
        }
    };
    
    const roleMultiplier = multipliers[tier][player.role] || 1.0;
    return Math.round(player.qta * roleMultiplier);
}
```

## 🐛 Problemi Noti & Soluzioni

### Browser Safari iOS
- **Problema**: Input potrebbero causare zoom automatico
- **Soluzione**: Font-size 16px già implementato

### Modalità Offline
- **Problema**: Tailwind CSS richiede connessione internet
- **Soluzione**: In sviluppo versione con CSS inline

### File CSV Grandi
- **Problema**: Performance su file CSV molto grandi (>5MB)
- **Soluzione**: Paginazione in sviluppo

## 🤝 Contribuire

Contributi benvenuti! Per favore:

1. **Fork** del progetto
2. **Branch** per la feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** modifiche (`git commit -m 'Add AmazingFeature'`)
4. **Push** al branch (`git push origin feature/AmazingFeature`)
5. **Pull Request**

### 💡 Idee per Contributi
- [ ] Supporto per più leghe/campionati
- [ ] Statistiche avanzate giocatori
- [ ] Integrazione API esterne
- [ ] Modalità dark/light theme
- [ ] PWA (Progressive Web App)
- [ ] Notifiche push

## 📄 Licenza

Distribuito sotto licenza **Apache 2.0**. Vedi `LICENSE` per maggiori informazioni.

## 👤 Autore

**FraPorta**
- 🐙 GitHub: [@FraPorta](https://github.com/FraPorta)
- 📧 Email: [Contattami](https://github.com/FraPorta)

## 🙏 Ringraziamenti

- [Tailwind CSS](https://tailwindcss.com/) per il framework CSS
- [Heroicons](https://heroicons.com/) per le icone
- Comunità Fantacalcio per feedback e suggerimenti

---

<div align="center">

**[⬆ Torna in cima](#-fanta-asta-tool)**

Made with ❤️ for the Fantacalcio community

[![Fantacalcio](https://img.shields.io/badge/⚽-Fantacalcio%202025%2F26-green?style=for-the-badge)](https://www.fantacalcio.it/)

</div>