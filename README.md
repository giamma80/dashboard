# 📊 Team Dashboard

Una dashboard completa per la gestione e visualizzazione di progetti, allocazione risorse e performance del team.

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

### 🔍 Sistema di Filtri
- **Filtri Multi-Select**: Selezione multipla di membri e stream
- **Filtri Temporali**: Range di date personalizzabile e quarter predefiniti
- **Chip di Quarter**: Selezione rapida per trimestri
- **Reset Filtri**: Pulizia rapida di tutti i filtri applicati

### 📁 Gestione File CSV
- **Caricamento Drag & Drop**: Interfaccia intuitiva per il caricamento
- **Validazione Robusta**: Controllo campi obbligatori e formati
- **Report Errori**: Notifiche dettagliate per progetti non validi
- **Toast Notifications**: Feedback visivo per operazioni e errori

### 🎨 Interfaccia Utente
- **Design Responsivo**: Ottimizzato per desktop, tablet e mobile
- **Tema Moderno**: Design pulito con colori corporate
- **Animazioni Fluide**: Transizioni smooth per better UX
- **Accessibilità**: Conformità agli standard di accessibilità web

## 💻 Tecnologie Utilizzate

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Grafici**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Package Manager**: npm

## 📦 Installazione e Utilizzo

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

## 🏗️ Architettura

```
people-dashboard/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx      # Componente principale
│   │   ├── Toast.tsx         # Sistema notifiche
│   │   └── DownloadSection.tsx
│   ├── App.tsx
│   └── main.tsx
├── public/
└── package.json
```

---

# 📋 Changelog

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

1. Fork del repository
2. Crea un branch per la feature (`git checkout -b feature/amazing-feature`)
3. Commit delle modifiche (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Apri una Pull Request

## 📝 Licenza

Questo progetto è sotto licenza MIT. Vedi il file `LICENSE` per maggiori dettagli.

## 📞 Supporto

Per supporto o domande:
- 📧 Email: [supporto@teamdashboard.com](mailto:supporto@teamdashboard.com)
- 🐛 Issues: [GitHub Issues](https://github.com/giamma80/dashboard/issues)
- 📖 Wiki: [Documentazione Completa](https://github.com/giamma80/dashboard/wiki)

---

⭐ **Se questo progetto ti è utile, considera di dargli una stella su GitHub!**
