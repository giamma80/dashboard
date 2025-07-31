# 📊 Team Dashboard

[![Deploy to GitHub Pages](https://github.com/giamma80/dashboard/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/giamma80/dashboard/actions/workflows/deploy-pages.yml)
[![Build and Release](https://github.com/giamma80/dashboard/actions/workflows/build-release.yml/badge.svg)](https://github.com/giamma80/dashboard/actions/workflows/build-release.yml)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://giamma80.github.io/dashboard/)
[![Latest Release](https://img.shields.io/github/v/release/giamma80/dashboard)](https://github.com/giamma80/dashboard/releases/latest)

**Una dashboard completa per la gestione e visualizzazione di progetti, allocazione risorse e performance del team.**

🌐 **[PROVA LA DEMO LIVE](https://giamma80.github.io/dashboard/)** | 📦 **[SCARICA L'APP DESKTOP](https://github.com/giamma80/dashboard/releases/latest)**

## 🚀 Accesso Rapido

### 🌐 **Versione Web (Gratuita)**
Accedi subito alla dashboard online: **[https://giamma80.github.io/dashboard/](https://giamma80.github.io/dashboard/)**

### 💻 **App Desktop per Windows**
Scarica l'applicazione desktop dalla [pagina delle release](https://github.com/giamma80/dashboard/releases/latest):

- **🔧 People.Dashboard.Setup.1.0.0.exe** - Installer completo (559 MB)
- **📦 People.Dashboard-1.0.0-win.zip** - Versione portable x64 (231 MB)  
- **📦 People.Dashboard-1.0.0-ia32-win.zip** - Versione portable x32 (486 MB)

> 💡 **Consiglio**: Per uso occasionale usa la versione web, per uso quotidiano scarica l'app desktop.

## 🎯 Descrizione del Progetto

**Team Dashboard** è una soluzione web moderna e intuitiva progettata per team leader, project manager e responsabili delle risorse che necessitano di una visione chiara e dettagliata sull'allocazione del lavoro, i carichi di lavoro e le performance del team.

La dashboard consente di:
- **Visualizzare il carico di lavoro** di ogni membro del team con indicatori visivi
- **Monitorare la distribuzione dei progetti** per stream, priorità, stato e tipologia
- **Analizzare timeline temporali** con grafici interattivi
- **Filtrare e segmentare i dati** per ottenere insights specifici
- **Gestire file CSV** con validazione e reporting degli errori

## 🚀 Caratteristiche Principali

### 📈 Visualizzazioni Avanzate
- **Gauge di Pressione Lavoro**: Indicatori visivi del carico di lavoro per team e singoli membri
- **Timeline Interattive**: Grafici a barre e linee per analisi temporali
- **Grafici a Torta**: Distribuzione di stati, priorità, stream e tipi di progetto
- **Tabelle Ordinabili**: Lista membri del team con sorting multiplo

### 🔍 Sistema di Filtri Avanzato
- **Filtri Multi-Select**: Selezione multipla di membri, stream, status e tipi
- **FilterManager**: Sistema centralizzato per gestione errori e suggerimenti intelligenti  
- **Filtri Temporali**: Range di date personalizzabile e quarter predefiniti
- **Toast Notifications**: Messaggi informativi per conflitti filtri e suggerimenti
- **Chip di Quarter**: Selezione rapida per trimestri
- **Reset Filtri**: Pulizia rapida di tutti i filtri applicati
- **Gestione Errori Intelligente**: Suggerimenti automatici quando i filtri non producono risultati

### 📁 Gestione File CSV
- **Caricamento Drag & Drop**: Interfaccia intuitiva per il caricamento
- **Validazione Robusta**: Controllo campi obbligatori e formati
- **Report Errori**: Notifiche dettagliate per progetti non validi
- **Toast Notifications**: Feedback visivo per operazioni e errori

### � Accuratezza e Affidabilità Dati
- **Progetti Unici**: Conteggio corretto dei progetti evitando duplicati multi-membro
- **Top 5 Preciso**: Classifica progetti per ore aggregate senza duplicazioni
- **Aggregazione Intelligente**: Progetti raggruppati per nome con somma ore totali
- **Multi-Team Support**: Gestione ottimale progetti con più membri coinvolti
- **Consistenza Dati**: Logica uniforme tra diverse visualizzazioni

### �🎨 Interfaccia Utente
- **Design Responsivo**: Ottimizzato per desktop, tablet e mobile
- **Tema Moderno**: Design pulito con colori corporate
- **Animazioni Fluide**: Transizioni smooth per better UX
- **Accessibilità**: Conformità agli standard di accessibilità web

## 💻 Tecnologie Utilizzate

### 🖥️ **Frontend & Web**
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Grafici**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Package Manager**: npm

### 📱 **Desktop App**
- **Framework**: Electron
- **Builder**: electron-builder
- **Piattaforme**: Windows (x64, x32)
- **Auto-Update**: GitHub Releases integration

### 🔄 **CI/CD & Deployment**
- **GitHub Actions**: Workflow automatizzati
- **GitHub Pages**: Hosting web gratuito
- **Auto-Release**: Binari generati automaticamente
- **Multi-Platform**: Build automatico per diverse architetture

## 📦 Installazione e Utilizzo

### 🌐 **Versione Web (Veloce)**
1. Vai su [https://giamma80.github.io/dashboard/](https://giamma80.github.io/dashboard/)
2. Carica il tuo file CSV
3. Inizia ad analizzare i dati!

### 💻 **App Desktop Windows**
1. Vai alle [Release](https://github.com/giamma80/dashboard/releases/latest)
2. Scarica il file appropriato:
   - **Setup.exe** per installazione completa
   - **win.zip** per versione portable
3. Installa o estrai ed esegui l'applicazione

### 🛠️ **Sviluppo Locale**
```bash
# Clona il repository
git clone https://github.com/giamma80/dashboard.git
cd dashboard/people-dashboard

# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev

# Build per produzione
npm run build

# Build app Electron (solo Windows)
npm run electron:build
```

## 📄 Formato CSV Supportato

Il file CSV deve contenere le seguenti colonne (separate da `;`):

1. **Nome Progetto**
2. **Stream** 
3. **Membro del Team**
4. **Data Inizio** (formato DD/MM/YY)
5. **Deadline Consegna** (formato DD/MM/YY)
6. **Stato**
7. **Priorità**
8. **Group Driven**
9. **Ore Necessarie** (numero)
10. **Note**
11. **Stakeholder**
12. **Tipo Progetto**

## 🏗️ Architettura & CI/CD

### 📁 **Struttura Progetto**
```
dashboard/
├── people-dashboard/          # App principale React
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx      # Componente principale
│   │   │   ├── Toast.tsx         # Sistema notifiche
│   │   │   └── DownloadSection.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── dist/                 # Build web per GitHub Pages
│   └── package.json
├── .github/
│   └── workflows/
│       ├── deploy-pages.yml  # Deploy automatico web
│       └── build-release.yml # Build binari Electron
└── README.md
```

### 🔄 **Flusso CI/CD Automatico**

#### 🌐 **GitHub Pages (Web)**
- **Trigger**: Push su branch `main`
- **Processo**: Build → Test → Deploy su GitHub Pages
- **URL Live**: https://giamma80.github.io/dashboard/
- **Stato**: [![Deploy Status](https://github.com/giamma80/dashboard/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/giamma80/dashboard/actions/workflows/deploy-pages.yml)

#### 📦 **Release Binari (Desktop)**  
- **Trigger**: Creazione nuovo tag (es. `v1.8`)
- **Processo**: Build → Package → Release automatico
- **Output**: 3 binari Windows (Setup.exe, x64.zip, x32.zip)
- **Stato**: [![Release Status](https://github.com/giamma80/dashboard/actions/workflows/build-release.yml/badge.svg)](https://github.com/giamma80/dashboard/actions/workflows/build-release.yml)

### 🎯 **Workflow di Release**
1. **Sviluppo**: Modifica codice in locale
2. **Commit**: `git commit -m "feature: nuova funzionalità"`
3. **Push**: `git push origin main` → Aggiorna sito web
4. **Tag**: `git tag v1.x && git push origin v1.x` → Genera binari
5. **Automatico**: GitHub Actions crea release con binari Windows

---

# 📋 Changelog

## [v2.1.1] - 2025-07-31
### 🐛 **CRITICAL FIXES - PROGETTI DUPLICATI**
- **✅ Fix Critico**: Risolto problema progetti duplicati in "Top 5 Progetti"
- **✅ Fix Critico**: Risolto problema conteggio "Progetti Totali" errato
- **✅ Aggregazione Intelligente**: Progetti raggruppati per nome con somma ore
- **✅ Conteggio Accurato**: Progetti unici contati correttamente (non per membro)
- **✅ Tooltip Migliorati**: Informazioni aggiuntive sui progetti multi-membro

### 🔧 **Miglioramenti Logica**
- **Top Progetti**: Ora raggruppa per nome progetto evitando duplicati
- **Progetti Totali**: Utilizza Set di nomi unici invece di somma per membro
- **Multi-Membro**: Gestione corretta progetti con più membri del team
- **Visualizzazione**: Tooltip con dettagli stream e membri coinvolti
- **Consistency**: Fix applicato sia in Dashboard.tsx che NewDashboard.tsx

### 🛠️ **Modifiche Tecniche**
- **Grouping Logic**: Implementato reduce per raggruppamento progetti per nome
- **Unique Count**: Sostituito reduce sum con Set.size per conteggio unico
- **Dominant Stream**: Utilizzato stream del primo progetto per colore
- **Member Display**: "X membri" quando progetto ha più di un membro
- **Key Optimization**: Chiavi React migliorate per evitare re-render inutili

### 📋 **Risultati**
- **🎯 Dati Accurati**: Conteggi e classifiche ora riflettono progetti reali
- **📊 Top 5 Corretto**: Lista progetti più impegnativi senza duplicati
- **🔢 Totali Giusti**: Numero progetti totali ora corretto
- **👥 Multi-Team**: Gestione migliorata progetti cross-team

---

## [v2.1.0] - 2025-07-31
### 🎉 **MAJOR UX IMPROVEMENTS - FILTRI AVANZATI**
- **✅ Fix Critico UX**: Risolto problema reset dashboard con filtri vuoti
- **✅ Filtri Status e Type**: Aggiunti nuovi filtri con stessa UI degli esistenti
- **✅ FilterManager Class**: Sistema centralizzato per gestione filtri intelligente
- **✅ Toast Intelligenti**: Messaggi informativi per errori e suggerimenti filtri
- **✅ Mantenimento Stato**: I filtri rimangono attivi anche con risultati vuoti

### 🔧 **Miglioramenti Critici**
- **Comportamento UX**: Dashboard non si resetta più alla pagina upload CSV
- **Gestione Errori**: Sostituiti throw con gestione graziosa dei risultati vuoti
- **Suggerimenti Intelligenti**: Sistema suggerisce soluzioni per filtri incompatibili
- **Debugging Avanzato**: Logging dettagliato per tracciare comportamento filtri
- **Robustezza Sistema**: Eliminati crash e reset indesiderati

### 🛠️ **Modifiche Tecniche**
- **processCSV Interface**: Aggiunto supporto per errori e suggerimenti
- **useEffect Dependencies**: Inclusi tutti i tipi di filtro nelle dipendenze
- **hasData Logic**: Distinta gestione tra "nessun CSV" vs "filtri vuoti"
- **FilterResult Types**: Nuove interfacce per gestione errori strutturata

### 📋 **Risultati**
- **🚀 UX Migliorata**: Esperienza utente fluida senza reset indesiderati
- **🎯 Filtri Potenti**: Sistema filtri più robusto e informativo
- **💡 Feedback Utile**: Suggerimenti automatici per risolvere problemi filtri
- **🔧 Sistema Stabile**: Architettura più robusta per gestione errori

---

## [v1.7] - 2025-07-30
### 🎉 **RELEASE COMPLETA - CI/CD FUNZIONANTE!**
- **✅ Sistema CI/CD Completo**: Pipeline automatico GitHub Actions
- **✅ Release Automatiche**: Binari Windows generati per ogni tag
- **✅ GitHub Pages Live**: Dashboard online su https://giamma80.github.io/dashboard/
- **📦 3 Binari Windows**: Setup.exe (559MB), win.zip (231MB), ia32-win.zip (486MB)

### 🔧 **Miglioramenti Tecnici**
- **PowerShell Compatibility**: Fix comandi Windows in GitHub Actions
- **Multi-Architecture**: Supporto x64 e x32 per Windows
- **Professional Packaging**: Installer completo + versioni portable
- **Auto-Release**: Creazione automatica release GitHub con binari

### 🚀 **Sistema Deployment**
- **Web Deployment**: Auto-deploy su GitHub Pages per ogni push
- **Desktop Release**: Auto-build binari Electron per ogni tag
- **Professional Workflow**: CI/CD enterprise-grade completo
- **Zero Manual Work**: Tutto automatico dalla creazione tag

---

## [v1.6] - 2025-07-30
### ✨ Nuove Funzionalità
- **Sistema Toast Avanzato**: Notifiche visuali per operazioni e errori
- **Report Errori CSV**: Dettagli specifici sui progetti non caricati
- **Toast Layout Migliorato**: Dimensioni ottimizzate e testo leggibile
- **Debug Console Integration**: Pulsante per visualizzare tutti gli errori nella console

### 🔧 Miglioramenti
- **Larghezza Toast**: Aumentata da `max-w-sm` a `min-w-80 max-w-md`
- **Spacing Migliorato**: Gap e padding ottimizzati per better readability
- **Validazione CSV Enhanced**: Messaggi di errore più specifici e informativi
- **User Experience**: Feedback visivo completo per tutte le operazioni

### 🐛 Correzioni
- **Eliminata Duplicazione**: Rimosso warning fisso che duplicava i toast
- **Toast Verticali**: Risolto problema di testo incomprensibile
- **Layout Responsivo**: Migliorata visualizzazione su dispositivi diversi

### 🛠️ Modifiche Tecniche
- **Refactor processCSV**: Funzione ora restituisce `{ data, errors }`
- **Rimozione filterError**: Eliminato stato non più necessario
- **TypeScript Types**: Aggiornati per supportare nuovo formato errori

---

## [v1.5] - 2025-07-29
### ✨ Nuove Funzionalità
- **Multi-Select Filters**: Dropdown con checkbox per membri e stream
- **Quarter Chips**: Selezione rapida trimestri nella seconda riga filtri
- **Filtri Combinati**: Possibilità di applicare più filtri simultaneamente
- **Reset Filtri**: Pulsante per pulire tutti i filtri applicati

### 🔧 Miglioramenti
- **UI Filtri**: Layout migliorato con due righe (date/filtri + quarter)
- **Dropdown UX**: Backdrop click per chiusura automatica
- **Feedback Visivo**: Contatori elementi selezionati
- **Responsive Design**: Ottimizzazione per dispositivi mobili

### 🐛 Correzioni
- **Stabilità Sistema**: Risolti crash durante selezione filtri
- **useEffect Dependencies**: Pulite dipendenze circolari
- **Memory Leaks**: Risolti problemi di memoria sui dropdown

---

## [v1.4] - 2025-07-28
### ✨ Nuove Funzionalità
- **Sistema Filtri Base**: Implementazione filtri data, membri e stream
- **Interfaccia Filtri**: Pannello dedicato con controlli intuitivi
- **Validazione Filtri**: Controllo compatibilità e fallback automatici

### 🔧 Miglioramenti
- **Performance**: Ottimizzazione rendering con filtri applicati
- **UX Design**: Indicatori visivi per filtri attivi
- **Data Processing**: Algoritmi migliorati per elaborazione dati

---

## [v1.3] - 2025-07-27
### ✨ Nuove Funzionalità
- **Dettagli Membri**: Card espandibile con informazioni dettagliate
- **Gauge Pressione Lavoro**: Indicatori visivi per carico di lavoro
- **Sorting Tabelle**: Ordinamento multi-colonna per tabella membri

### 🔧 Miglioramenti
- **Visual Design**: Grafica migliorata per gauge e indicatori
- **Animazioni**: Transizioni smooth per apertura/chiusura card
- **Accessibility**: Miglioramento navigazione da tastiera

---

## [v1.2] - 2025-07-26
### ✨ Nuove Funzionalità
- **Timeline Interattive**: Click sui mesi per filtraggio automatico
- **Grafici Recharts**: Implementazione completa libreria grafici
- **Hover Effects**: Tooltip informativi su tutti i grafici

### 🔧 Miglioramenti
- **Responsività**: Layout adattivo per tutti i dispositivi
- **Color Scheme**: Palette colori corporate per stream
- **Performance**: Ottimizzazione rendering grafici

---

## [v1.1] - 2025-07-25
### ✨ Nuove Funzionalità
- **Caricamento CSV**: Sistema completo per import dati
- **Validazione Dati**: Controlli robustness su campi obbligatori
- **LocalStorage**: Persistenza dati tra sessioni

### 🔧 Miglioramenti
- **Error Handling**: Gestione errori migliorata
- **UI/UX**: Interfaccia utente più intuitiva
- **File Processing**: Algoritmi ottimizzati per parsing CSV

---

## [v1.0] - 2025-07-24
### 🎉 Release Iniziale
- **Dashboard Base**: Struttura principale applicazione
- **Componenti Core**: Layout base e navigazione
- **Configurazione Progetto**: Setup React + TypeScript + Vite
- **Styling Framework**: Integrazione Tailwind CSS

### 📋 Funzionalità Base
- **Visualizzazione Dati**: Layout base per metriche team
- **Responsive Design**: Adattamento mobile-first
- **Component Architecture**: Struttura modulare e riutilizzabile

---

## 🤝 Contribuire

Per contribuire al progetto:

1. **Fork del repository**
2. **Crea un branch per la feature** (`git checkout -b feature/amazing-feature`)
3. **Commit delle modifiche** (`git commit -m 'Add amazing feature'`)
4. **Push al branch** (`git push origin feature/amazing-feature`)  
5. **Apri una Pull Request**

### � **Processo Release**
Per i maintainer del progetto:
```bash
# 1. Aggiorna il README con nuove feature (questo file)
# 2. Committa le modifiche
git add README.md
git commit -m "📝 Update README per v1.x"

# 3. Crea e pusha il tag
git tag v1.x
git push origin main
git push origin v1.x

# 4. GitHub Actions farà automaticamente:
#    - Deploy web su GitHub Pages  
#    - Build e release binari Windows
#    - Creazione release GitHub con changelog
```

## 📊 Statistiche Progetto

- **🌐 Demo Live**: [giamma80.github.io/dashboard](https://giamma80.github.io/dashboard/)
- **� Download Totali**: [![GitHub Downloads](https://img.shields.io/github/downloads/giamma80/dashboard/total)](https://github.com/giamma80/dashboard/releases)
- **⭐ Stars**: [![GitHub Stars](https://img.shields.io/github/stars/giamma80/dashboard)](https://github.com/giamma80/dashboard/stargazers)
- **🐛 Issues**: [![GitHub Issues](https://img.shields.io/github/issues/giamma80/dashboard)](https://github.com/giamma80/dashboard/issues)
- **🔄 Last Release**: [![GitHub Release Date](https://img.shields.io/github/release-date/giamma80/dashboard)](https://github.com/giamma80/dashboard/releases/latest)

## 📝 Licenza

Questo progetto è sotto licenza MIT. Vedi il file `LICENSE` per maggiori dettagli.

## 📞 Supporto & Community

### 💬 **Supporto**
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/giamma80/dashboard/issues)
- � **Feature Requests**: [GitHub Discussions](https://github.com/giamma80/dashboard/discussions)
- 📖 **Documentazione**: [Wiki del Progetto](https://github.com/giamma80/dashboard/wiki)

### 🚀 **Links Utili**
- **🌐 Demo Live**: https://giamma80.github.io/dashboard/
- **📦 Scarica App**: https://github.com/giamma80/dashboard/releases/latest
- **📊 Statistiche**: https://github.com/giamma80/dashboard/pulse
- **🔄 CI/CD Status**: https://github.com/giamma80/dashboard/actions

---

## 🏆 **Risultati del Progetto**

✅ **Dashboard Web Funzionante** - Live su GitHub Pages  
✅ **App Desktop Windows** - Binari automatici per ogni release  
✅ **CI/CD Completo** - Pipeline automatico professionale  
✅ **Zero Manual Deployment** - Tutto automatizzato da git tag  

⭐ **Se questo progetto ti è utile, considera di dargli una stella su GitHub!**

---

*Team Dashboard - Trasforma i tuoi dati CSV in insights azionabili.* 🚀
