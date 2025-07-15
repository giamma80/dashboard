import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Clock, Target, Calendar, Building2, Upload, FileText } from 'lucide-react';

// Tipi per TypeScript
interface DashboardData {
  totali: {
    proposte: number;
    ore: number;
    manDays: number;
    clienti: number;
    persone: number;
    proposteConcluse: number;
    proposteVinte: number;
    propostePerse: number;
    tassoSuccesso: number;
    percentualeVinte: number;
  };
  timeline: Array<{
    mese: string;
    proposte: number;
    manDays: number;
  }>;
  status: {
    Wait: number;
    Vinte: number;
    Perse: number;
    Altro: number;
  };
  risorse: Array<{
    nome: string;
    progetti: number;
    manDays: number;
    allocazioneMedia: number;
  }>;
  topClienti: Array<{
    cliente: string;
    proposte: number;
    manDays: number;
  }>;
}

interface CSVRecord {
  cliente: string;
  gara: string;
  persone: string;
  ore: number;
  status: string;
  mese: string;
}

const Dashboard = () => {
  // State per i dati della dashboard
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState('both'); // 'proposte', 'mandays', 'both'
  const [clientiSortMode, setClientiSortMode] = useState('proposte'); // 'proposte', 'mandays'
  const [risorseSortMode, setRisorseSortMode] = useState('mandays'); // 'mandays', 'progetti'

  // Dati di default vuoti (in attesa di caricamento CSV)
  const defaultData: DashboardData = {
    totali: {
      proposte: 0,
      ore: 0,
      manDays: 0,
      clienti: 0,
      persone: 0,
      proposteConcluse: 0,
      proposteVinte: 0,
      propostePerse: 0,
      tassoSuccesso: 0,
      percentualeVinte: 0
    },
    timeline: [
      { mese: "Gen", proposte: 0, manDays: 0 },
      { mese: "Feb", proposte: 0, manDays: 0 },
      { mese: "Mar", proposte: 0, manDays: 0 },
      { mese: "Apr", proposte: 0, manDays: 0 },
      { mese: "Mag", proposte: 0, manDays: 0 },
      { mese: "Giu", proposte: 0, manDays: 0 },
      { mese: "Lug", proposte: 0, manDays: 0 },
      { mese: "Ago", proposte: 0, manDays: 0 },
      { mese: "Set", proposte: 0, manDays: 0 },
      { mese: "Ott", proposte: 0, manDays: 0 },
      { mese: "Nov", proposte: 0, manDays: 0 },
      { mese: "Dic", proposte: 0, manDays: 0 }
    ],
    status: {
      "Wait": 0,
      "Vinte": 0,
      "Perse": 0,
      "Altro": 0
    },
    risorse: [],
    topClienti: []
  };

  // Inizializza con dati di default
  useEffect(() => {
    setDashboardData(defaultData);
  }, []);

  // Funzione semplificata per processare il CSV
  const processCSV = (csvText: string): DashboardData => {
    try {
      console.log("=== INIZIO ELABORAZIONE CSV ===");
      
      // Pulisci il testo e dividi in righe
      const cleanText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const allLines = cleanText.split('\n');
      console.log("Totale righe nel file:", allLines.length);
      
      // Trova la prima riga che sembra contenere dati (non header)
      let dataLines: string[] = [];
      let foundData = false;
      
      for (let i = 0; i < allLines.length; i++) {
        const line = allLines[i].trim();
        if (!line) continue;
        
        const parts = line.split(';');
        
        // Se la riga ha 6 parti e la quarta è un numero, probabilmente è una riga di dati
        if (parts.length >= 6 && !isNaN(parseFloat(parts[3]))) {
          foundData = true;
          console.log(`Prima riga di dati trovata alla riga ${i}:`, line);
        }
        
        if (foundData) {
          dataLines.push(line);
        }
      }
      
      console.log("Righe di dati trovate:", dataLines.length);
      
      if (dataLines.length === 0) {
        throw new Error("Nessuna riga di dati valida trovata");
      }
      
      // Processa ogni riga di dati
      const records: CSVRecord[] = [];
      
      dataLines.forEach((line, index) => {
        const parts = line.split(';').map((p: string) => p.replace(/"/g, '').trim());
        
        if (parts.length >= 6) {
          const mese = parts[5];
          
          // Filtra solo Gen-Giu (esclude Luglio)
          if (mese && !mese.toLowerCase().includes('luglio')) {
            records.push({
              cliente: parts[0] || '',
              gara: parts[1] || '',
              persone: parts[2] || '',
              ore: parseFloat(parts[3]) || 0,
              status: parts[4] || '',
              mese: mese
            });
          }
        }
      });
      
      console.log("Record validi processati:", records.length);
      console.log("Primi 3 record:", records.slice(0, 3));
      
      if (records.length === 0) {
        throw new Error("Nessun record valido dopo il filtraggio");
      }
      
      // === CALCOLI ===
      
      // Totali
      const totalOre = records.reduce((sum, r) => sum + r.ore, 0);
      const totalManDays = parseFloat((totalOre / 8).toFixed(1));
      const clientiUnici = new Set(records.map(r => r.cliente).filter(c => c)).size;
      
      // Status
      const statusCount = { Wait: 0, Vinte: 0, Perse: 0, Altro: 0 };
      records.forEach(r => {
        const s = r.status.toLowerCase();
        if (s === 'si') statusCount.Vinte++;
        else if (s === 'no') statusCount.Perse++;
        else if (s === 'wait') statusCount.Wait++;
        else statusCount.Altro++;
      });
      
      const proposteConcluse = statusCount.Vinte + statusCount.Perse;
      const tassoSuccesso = proposteConcluse > 0 ? parseFloat(((statusCount.Vinte / proposteConcluse) * 100).toFixed(1)) : 0;
      const percentualeVinte = parseFloat(((statusCount.Vinte / records.length) * 100).toFixed(1));
      
      // Timeline
      const mesiMap: Record<string, { proposte: number; ore: number }> = {};
      records.forEach(r => {
        const m = r.mese;
        if (!mesiMap[m]) mesiMap[m] = { proposte: 0, ore: 0 };
        mesiMap[m].proposte++;
        mesiMap[m].ore += r.ore;
      });
      
      const mesiOrdinati = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
      const timeline = mesiOrdinati.map(m => ({
        mese: m.substring(0, 3),
        proposte: mesiMap[m]?.proposte || 0,
        manDays: parseFloat(((mesiMap[m]?.ore || 0) / 8).toFixed(1))
      }));
      
      // Top clienti (in base alle proposte)
      const clientiMap: Record<string, { proposte: number; ore: number }> = {};
      records.forEach(r => {
        if (!clientiMap[r.cliente]) clientiMap[r.cliente] = { proposte: 0, ore: 0 };
        clientiMap[r.cliente].proposte++;
        clientiMap[r.cliente].ore += r.ore;
      });
      
      const topClienti = Object.entries(clientiMap)
        .map(([nome, data]) => ({
          cliente: nome,
          proposte: data.proposte,
          manDays: parseFloat((data.ore / 8).toFixed(1))
        }))
        .sort((a, b) => b.proposte - a.proposte)
        .slice(0, 7);
      
      // Risorse
      const nomiPrincipali = ['Morelli', 'Peli', 'Bignotti', 'Costantino', 'Roveda'];
      const risorseMap: Record<string, { progetti: number; ore: number }> = {};
      nomiPrincipali.forEach(n => risorseMap[n] = { progetti: 0, ore: 0 });
      risorseMap['Altre risorse'] = { progetti: 0, ore: 0 };
      
      records.forEach(r => {
        if (r.persone) {
          const nomi = r.persone.split(',').map((n: string) => n.trim());
          nomi.forEach((nome: string) => {
            if (nomiPrincipali.includes(nome)) {
              risorseMap[nome].progetti++;
              risorseMap[nome].ore += r.ore / nomi.length;
            } else {
              risorseMap['Altre risorse'].progetti++;
              risorseMap['Altre risorse'].ore += r.ore / nomi.length;
            }
          });
        }
      });
      
      const risorse = nomiPrincipali
        .map(nome => ({
          nome,
          progetti: risorseMap[nome].progetti,
          manDays: parseFloat((risorseMap[nome].ore / 8).toFixed(1)),
          allocazioneMedia: parseFloat((risorseMap[nome].ore / 8 / 6).toFixed(1))
        }))
        .sort((a, b) => b.manDays - a.manDays);
      
      risorse.push({
        nome: 'Altre risorse',
        progetti: risorseMap['Altre risorse'].progetti,
        manDays: parseFloat((risorseMap['Altre risorse'].ore / 8).toFixed(1)),
        allocazioneMedia: parseFloat((risorseMap['Altre risorse'].ore / 8 / 6).toFixed(1))
      });
      
      console.log("=== RISULTATI FINALI ===");
      console.log("Proposte totali:", records.length);
      console.log("Man/days totali:", totalManDays);
      console.log("Clienti unici:", clientiUnici);
      console.log("Status:", statusCount);
      console.log("Timeline:", timeline);
      console.log("=== ELABORAZIONE COMPLETATA ===");
      
      return {
        totali: {
          proposte: records.length,
          ore: totalOre,
          manDays: totalManDays,
          clienti: clientiUnici,
          persone: 23,
          proposteConcluse,
          proposteVinte: statusCount.Vinte,
          propostePerse: statusCount.Perse,
          tassoSuccesso,
          percentualeVinte
        },
        timeline,
        status: statusCount,
        risorse,
        topClienti
      };
      
    } catch (err) {
      console.error("ERRORE:", err);
      throw new Error(`Errore elaborazione: ${(err as Error).message}`);
    }
  };

  // Handler per il caricamento del file
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log("Caricamento file:", file.name);
      const text = await file.text();
      console.log("File letto, dimensione:", text.length, "caratteri");
      
      const newData = processCSV(text);
      console.log("Dati elaborati con successo!");
      
      setDashboardData(newData);
      setLastUpdate(new Date().toLocaleTimeString());
      
      // Reset del file input per permettere di ricaricare lo stesso file
      event.target.value = '';
      
    } catch (err) {
      console.error("Errore caricamento:", err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Verifica se i dati sono vuoti (non è stato caricato nessun CSV)
  const isDataEmpty = dashboardData && 
    dashboardData.totali.proposte === 0 && 
    dashboardData.risorse.length === 0 && 
    dashboardData.topClienti.length === 0;

  // Guard clause per null check
  if (!dashboardData) {
    return <div className="flex items-center justify-center min-h-screen">Caricamento...</div>;
  }

  // Messaggio quando non ci sono dati
  if (isDataEmpty) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-full mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center justify-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              </div>
              Effort Proposte
            </h1>
            <p className="text-gray-600 text-sm mb-4">Analisi attività di supporto alle vendite</p>
          </div>

          {/* Messaggio di benvenuto */}
          <div className="bg-white rounded-lg shadow-md p-8 text-center mb-8">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Benvenuto nella Dashboard</h2>
            <p className="text-gray-600 mb-6">
              La dashboard è pronta per visualizzare i tuoi dati.<br />
              Carica un file CSV per iniziare l'analisi delle proposte.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">📋 Formato CSV Richiesto:</h3>
              <p className="text-sm text-blue-700">
                <code>Cliente; Gara; Persone; Ore; Status; Mese</code>
              </p>
            </div>
          </div>

          {/* Sezione Upload CSV */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Carica i Tuoi Dati</h3>
            <div className="flex items-center justify-center gap-4">
              <label className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors">
                <Upload className="w-5 h-5" />
                <span className="font-medium">Carica CSV</span>
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isLoading}
                />
              </label>
              {isLoading && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="font-medium">Elaborazione in corso...</span>
                </div>
              )}
              {error && (
                <div className="text-red-600 text-sm font-medium">
                  ❌ Errore: {error}
                </div>
              )}
            </div>
            <p className="text-center text-gray-500 text-sm mt-3">
              Seleziona un file CSV per popolare automaticamente tutti i grafici e le statistiche
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Preparazione dati per i grafici
  const statusData = Object.entries(dashboardData.status).map(([status, count]) => ({
    name: status,
    value: count,
    percentage: ((count / dashboardData.totali.proposte) * 100).toFixed(1)
  }));

  // Genera dinamicamente i top clienti in base alla modalità selezionata
  const getTopClienti = () => {
    // Se abbiamo dati elaborati dal CSV, ricrea la lista clienti dai dati grezzi
    // Altrimenti usa la lista di default
    const allClienti = dashboardData.topClienti || [];
    
    if (clientiSortMode === 'proposte') {
      return [...allClienti]
        .sort((a, b) => b.proposte - a.proposte)
        .slice(0, 7);
    } else {
      return [...allClienti]
        .sort((a, b) => b.manDays - a.manDays)
        .slice(0, 7);
    }
  };

  // Genera dinamicamente l'ordinamento delle risorse in base alla modalità selezionata
  const getSortedRisorse = () => {
    const allRisorse = dashboardData.risorse || [];
    
    if (risorseSortMode === 'mandays') {
      return [...allRisorse].sort((a, b) => b.manDays - a.manDays);
    } else {
      return [...allRisorse].sort((a, b) => b.progetti - a.progetti);
    }
  };

  const sortedTopClienti = getTopClienti();
  const sortedRisorse = getSortedRisorse();

  // Funzione per generare commenti dinamici del trend
  const generateTrendComments = () => {
    if (!dashboardData?.timeline || dashboardData.timeline.length === 0) {
      return [
        { text: "Nessun dato disponibile", type: "neutral" },
        { text: "Carica un CSV per vedere i trend", type: "neutral" }
      ];
    }

    const timeline = dashboardData.timeline;
    const comments = [];

    // Trova il mese con più proposte
    const maxProposteMese = timeline.reduce((max, current) => 
      current.proposte > max.proposte ? current : max
    );
    
    // Trova il mese con più man/days
    const maxManDaysMese = timeline.reduce((max, current) => 
      current.manDays > max.manDays ? current : max
    );

    // Calcola la tendenza generale (confronto primo vs ultimo trimestre con dati)
    const mesiConDati = timeline.filter(m => m.proposte > 0 || m.manDays > 0);
    
    if (mesiConDati.length >= 2) {
      const primoTrimestre = mesiConDati.slice(0, Math.ceil(mesiConDati.length / 2));
      const ultimoTrimestre = mesiConDati.slice(Math.floor(mesiConDati.length / 2));
      
      const mediaPrimoTrimestre = primoTrimestre.reduce((sum, m) => sum + m.proposte, 0) / primoTrimestre.length;
      const mediaUltimoTrimestre = ultimoTrimestre.reduce((sum, m) => sum + m.proposte, 0) / ultimoTrimestre.length;
      
      // Commento sul picco
      if (maxProposteMese.proposte > 0) {
        comments.push({
          text: `${maxProposteMese.mese}: picco massimo (${maxProposteMese.proposte} proposte)`,
          type: "success"
        });
      }

      // Commento sulla tendenza
      if (mediaUltimoTrimestre > mediaPrimoTrimestre * 1.1) {
        comments.push({
          text: "Trend crescente nel periodo finale",
          type: "success"
        });
      } else if (mediaUltimoTrimestre < mediaPrimoTrimestre * 0.9) {
        comments.push({
          text: "Rallentamento nel periodo finale",
          type: "warning"
        });
      } else {
        comments.push({
          text: "Attività stabile nel periodo",
          type: "neutral"
        });
      }

      // Commento sui man/days
      if (maxManDaysMese.manDays > 0 && maxManDaysMese.mese !== maxProposteMese.mese) {
        comments.push({
          text: `${maxManDaysMese.mese}: massimo effort (${maxManDaysMese.manDays} m/d)`,
          type: "info"
        });
      }

      // Analisi distribuzione
      const mesiAttivi = timeline.filter(m => m.proposte > 0).length;
      if (mesiAttivi <= 2) {
        comments.push({
          text: "Attività concentrata in pochi mesi",
          type: "warning"
        });
      } else if (mesiAttivi >= 5) {
        comments.push({
          text: "Attività distribuita costantemente",
          type: "success"
        });
      }
    } else {
      comments.push({
        text: "Dati insufficienti per l'analisi trend",
        type: "neutral"
      });
    }

    return comments.slice(0, 3); // Massimo 3 commenti
  };

  const trendComments = generateTrendComments();

  const COLORS = ['#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B'];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center justify-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            </div>
            Effort Proposte
          </h1>
          <p className="text-gray-600 text-sm mb-4">Analisi attività di supporto alle vendite</p>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              📅 Timeline 2025
            </h2>
            
            {/* Controlli visualizzazione */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('proposte')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'proposte' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Proposte
              </button>
              <button
                onClick={() => setViewMode('mandays')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'mandays' 
                    ? 'bg-orange-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Man/Days
              </button>
              <button
                onClick={() => setViewMode('both')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'both' 
                    ? 'bg-green-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Entrambe
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="grid grid-cols-12 gap-2 relative">
              {dashboardData.timeline.map((month, index) => {
                const maxProposte = Math.max(...dashboardData.timeline.map(d => d.proposte));
                const maxManDays = Math.max(...dashboardData.timeline.map(d => d.manDays));
                const proposteHeight = maxProposte > 0 ? (month.proposte / maxProposte) * 100 : 0;
                const manDaysHeight = maxManDays > 0 ? (month.manDays / maxManDays) * 100 : 0;
                
                return (
                  <div key={index} className="text-center relative">
                    <div className="text-sm font-medium text-gray-600 mb-2">{month.mese}</div>
                    <div className="flex justify-center gap-1 mb-2">
                      {/* Barra Proposte */}
                      {(viewMode === 'proposte' || viewMode === 'both') && (
                        <div className={`h-24 bg-gray-200 rounded-full flex items-end overflow-hidden relative ${
                          viewMode === 'both' ? 'w-6' : 'w-8'
                        }`}>
                          <div 
                            className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-full transition-all duration-500" 
                            style={{ height: `${proposteHeight}%` }}
                          ></div>
                          <div 
                            className="absolute w-2 h-2 bg-red-600 rounded-full border border-white" 
                            style={{ 
                              left: '50%', 
                              transform: 'translateX(-50%)', 
                              top: `${100 - proposteHeight}%`,
                              marginTop: '-4px' 
                            }}
                          ></div>
                        </div>
                      )}
                      
                      {/* Barra Man/Days */}
                      {(viewMode === 'mandays' || viewMode === 'both') && (
                        <div className={`h-24 bg-gray-200 rounded-full flex items-end overflow-hidden relative ${
                          viewMode === 'both' ? 'w-6' : 'w-8'
                        }`}>
                          <div 
                            className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-full transition-all duration-500" 
                            style={{ height: `${manDaysHeight}%` }}
                          ></div>
                          <div 
                            className="absolute w-2 h-2 bg-orange-800 rounded-full border border-white" 
                            style={{ 
                              left: '50%', 
                              transform: 'translateX(-50%)', 
                              top: `${100 - manDaysHeight}%`,
                              marginTop: '-4px' 
                            }}
                          ></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-700 space-y-1">
                      {(viewMode === 'proposte' || viewMode === 'both') && (
                        <div className="font-bold text-blue-600">{month.proposte}</div>
                      )}
                      {(viewMode === 'mandays' || viewMode === 'both') && (
                        <div className="font-bold text-orange-600">{month.manDays}</div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Linea di tendenza Proposte */}
              {(viewMode === 'proposte' || viewMode === 'both') && dashboardData.timeline.map((month, index) => {
                if (index >= dashboardData.timeline.length - 1) return null;
                
                const maxProposte = Math.max(...dashboardData.timeline.map(d => d.proposte));
                if (maxProposte === 0) return null;
                
                const currentHeight = (month.proposte / maxProposte) * 100;
                const nextMonth = dashboardData.timeline[index + 1];
                const nextHeight = (nextMonth.proposte / maxProposte) * 100;
                
                // Calcola le posizioni Y (invertite perché 0% = top, 100% = bottom)
                const startY = 100 - currentHeight;
                const endY = 100 - nextHeight;
                
                // Calcola offset basato sulla modalità di visualizzazione
                const leftOffset = viewMode === 'both' 
                  ? `${(index * 100 / 12) + (100 / 24)}%`  // Offset per prima barra quando entrambe visibili
                  : `${(index * 100 / 12) + (100 / 24)}%`; // Centrato quando solo proposte (stesso offset perché la barra è già centrata)
                
                return (
                  <div 
                    key={`line-proposte-${index}`} 
                    className="absolute pointer-events-none" 
                    style={{ 
                      left: leftOffset, 
                      top: '24px', 
                      width: `${100 / 12}%`, 
                      height: '96px' 
                    }}
                  >
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <line 
                        x1="0" 
                        y1={`${startY}%`} 
                        x2="100" 
                        y2={`${endY}%`} 
                        stroke="#2563eb" 
                        strokeWidth="2" 
                        strokeDasharray="4,4" 
                        opacity="0.8" 
                      />
                    </svg>
                  </div>
                );
              })}
              
              {/* Linea di tendenza Man/Days */}
              {(viewMode === 'mandays' || viewMode === 'both') && dashboardData.timeline.map((month, index) => {
                if (index >= dashboardData.timeline.length - 1) return null;
                
                const maxManDays = Math.max(...dashboardData.timeline.map(d => d.manDays));
                if (maxManDays === 0) return null;
                
                const currentHeight = (month.manDays / maxManDays) * 100;
                const nextMonth = dashboardData.timeline[index + 1];
                const nextHeight = (nextMonth.manDays / maxManDays) * 100;
                
                // Calcola le posizioni Y (invertite perché 0% = top, 100% = bottom)
                const startY = 100 - currentHeight;
                const endY = 100 - nextHeight;
                
                // Calcola offset basato sulla modalità di visualizzazione
                const leftOffset = viewMode === 'both' 
                  ? `${(index * 100 / 12) + (100 / 24) + (100 / 24 / 2)}%` // Offset per seconda barra quando entrambe visibili
                  : `${(index * 100 / 12) + (100 / 24)}%`; // Centrato quando solo man/days
                
                return (
                  <div 
                    key={`line-mandays-${index}`} 
                    className="absolute pointer-events-none" 
                    style={{ 
                      left: leftOffset,
                      top: '24px', 
                      width: `${100 / 12}%`, 
                      height: '96px' 
                    }}
                  >
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <line 
                        x1="0" 
                        y1={`${startY}%`} 
                        x2="100" 
                        y2={`${endY}%`} 
                        stroke="#ea580c" 
                        strokeWidth="2" 
                        strokeDasharray="6,3" 
                        opacity="0.8" 
                      />
                    </svg>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-center mt-2 text-xs text-gray-600">
              <div className="flex items-center gap-4">
                {(viewMode === 'proposte' || viewMode === 'both') && (
                  <>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span>Proposte mensili</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-0.8 bg-blue-600" style={{ borderTop: '2px dashed #2563eb' }}></div>
                      <span>Trend Proposte</span>
                    </div>
                  </>
                )}
                {(viewMode === 'mandays' || viewMode === 'both') && (
                  <>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-orange-500 rounded"></div>
                      <span>Man/Days mensili</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-0.8 bg-orange-600" style={{ borderTop: '2px dashed #ea580c' }}></div>
                      <span>Trend Man/Days</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cards metriche principali sotto la timeline */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="col-span-2 grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-900">{dashboardData.totali.proposte}</div>
                <div className="text-blue-700 text-md font-medium">Proposte Totali</div>
                <div className="text-s text-blue-600 bg-blue-100 px-2 py-1 rounded mt-1">📋 {dashboardData.totali.proposteConcluse}</div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-900">{dashboardData.status.Vinte}</div>
                <div className="text-green-700 text-md font-medium">Proposte Vinte</div>
                <div className="text-s text-green-600 bg-green-100 px-2 py-1 rounded mt-1">💎 {dashboardData.totali.percentualeVinte}%</div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-900">{dashboardData.status.Wait}</div>
                <div className="text-purple-700 text-md font-medium">In Attesa</div>
                <div className="text-s text-purple-600 bg-purple-100 px-2 py-1 rounded mt-1">⏳ {((dashboardData.status.Wait / dashboardData.totali.proposte) * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>

          <div className="col-span-2 bg-orange-50 rounded-lg p-6 border-l-4 border-orange-500">
            <div className="text-center">
              <div className="text-5xl font-bold text-orange-900">{dashboardData.totali.manDays}</div>
              <div className="text-orange-700 text-xl font-medium">Man/Days Totali</div>
              <div className="text-lg text-orange-600 bg-orange-100 px-4 py-2 rounded mt-3">
                ⏱️ {(dashboardData.totali.manDays / dashboardData.totali.proposte).toFixed(1)} per proposta
              </div>
            </div>
          </div>
        </div>

        {/* Layout principale ORIZZONTALE - 2 colonne sotto Man/Days, 2 colonne a sinistra */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {/* Colonna 1 - Grafico a torta CSS */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuzione Proposte</h3>
              <div className="flex-1 flex justify-center">
                <div className="flex flex-col">
                  <div 
                    className="relative rounded-full border-4 flex items-center justify-center"
                    style={{ 
                      width: 270, 
                      height: 270, 
                      background: `conic-gradient(
                        #3b82f6 0deg ${(dashboardData.status.Wait / dashboardData.totali.proposte) * 360}deg,
                        #10b981 ${(dashboardData.status.Wait / dashboardData.totali.proposte) * 360}deg ${((dashboardData.status.Wait + dashboardData.status.Vinte) / dashboardData.totali.proposte) * 360}deg,
                        #ef4444 ${((dashboardData.status.Wait + dashboardData.status.Vinte) / dashboardData.totali.proposte) * 360}deg ${((dashboardData.status.Wait + dashboardData.status.Vinte + dashboardData.status.Perse) / dashboardData.totali.proposte) * 360}deg,
                        #8b5cf6 ${((dashboardData.status.Wait + dashboardData.status.Vinte + dashboardData.status.Perse) / dashboardData.totali.proposte) * 360}deg 360deg
                      )`,
                      borderColor: '#e2e8f0' 
                    }}
                  >
                    <div 
                      className="bg-white rounded-full flex flex-col items-center justify-center text-center"
                      style={{ width: 150, height: 150 }}
                    >
                      <div className="text-2xl font-bold text-gray-800">{dashboardData.totali.proposte}</div>
                      <div className="text-s text-gray-600">Proposte</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span>Wait: {dashboardData.status.Wait}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Vinte: {dashboardData.status.Vinte}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>Perse: {dashboardData.status.Perse}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-purple-500 rounded"></div>
                      <span>Altro: {dashboardData.status.Altro}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Clienti Unici</span>
                    <span className="text-lg font-bold text-blue-600">{dashboardData.totali.clienti}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Media/Cliente</span>
                    <span className="text-lg font-bold text-green-600">{(dashboardData.totali.proposte / dashboardData.totali.clienti).toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Media/Mese</span>
                    <span className="text-lg font-bold text-purple-600">{(dashboardData.totali.proposte / 6).toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Colonna 2 - Top Clienti */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Top Clienti</h3>
                
                {/* Controllo ordinamento clienti */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setClientiSortMode('proposte')}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      clientiSortMode === 'proposte' 
                        ? 'bg-blue-500 text-white shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Proposte
                  </button>
                  <button
                    onClick={() => setClientiSortMode('mandays')}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      clientiSortMode === 'mandays' 
                        ? 'bg-orange-500 text-white shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Man/Days
                  </button>
                </div>
              </div>
              <div className="space-y-3 flex-1">
                {sortedTopClienti.map((cliente, index) => (
                  <div key={cliente.cliente} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{cliente.cliente}</div>
                        <div className="text-sm text-gray-500">
                          {clientiSortMode === 'proposte' 
                            ? `${cliente.proposte} proposte` 
                            : `${cliente.manDays} man/days`
                          }
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${clientiSortMode === 'proposte' ? 'text-blue-600' : 'text-orange-600'}`}>
                        {clientiSortMode === 'proposte' ? cliente.proposte : cliente.manDays}
                      </div>
                      <div className="text-sm text-gray-500">
                        {clientiSortMode === 'proposte' ? 'proposte' : 'man/days'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Colonna 3 - Allocazione per Risorsa */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Allocazione per Risorsa</h3>
                
                {/* Controllo ordinamento risorse */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setRisorseSortMode('mandays')}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      risorseSortMode === 'mandays' 
                        ? 'bg-green-500 text-white shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Man/Days
                  </button>
                  <button
                    onClick={() => setRisorseSortMode('progetti')}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      risorseSortMode === 'progetti' 
                        ? 'bg-purple-500 text-white shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Progetti
                  </button>
                </div>
              </div>
              <div className="space-y-3 flex-1">
                {sortedRisorse.map((risorsa, index) => (
                  <div key={risorsa.nome} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3 ${
                        risorsa.nome === 'Altre risorse' ? 'bg-gray-400' : 'bg-green-500'
                      }`}>
                        {risorsa.nome === 'Altre risorse' ? 'A' : risorsa.nome.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{risorsa.nome}</div>
                        <div className="text-sm text-gray-500">
                          {risorseSortMode === 'mandays' 
                            ? `${risorsa.progetti} progetti` 
                            : `${risorsa.manDays.toFixed(1)} man/days`
                          }
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${risorseSortMode === 'mandays' ? 'text-green-600' : 'text-purple-600'}`}>
                        {risorseSortMode === 'mandays' ? risorsa.manDays.toFixed(1) : risorsa.progetti}
                      </div>
                      <div className="text-sm text-gray-500">
                        {risorseSortMode === 'mandays' ? 'man/days' : 'progetti'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Colonna 4 - Allocazione Media Mensile e Trend Generale */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistica Mensile</h3>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-3">Allocazione Media Mensile</h4>
                <div className="space-y-2">
                  {sortedRisorse.map((risorsa) => (
                    <div key={risorsa.nome} className="flex justify-between items-center">
                      <span className="text-sm text-blue-700">{risorsa.nome}</span>
                      <span className="text-sm font-medium text-blue-900">{risorsa.allocazioneMedia} m/d</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Trend Generale</h4>
                <ul className="text-sm space-y-2">
                  {trendComments.map((comment, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className={`
                        ${comment.type === 'success' ? 'text-green-600' : ''}
                        ${comment.type === 'warning' ? 'text-orange-600' : ''}
                        ${comment.type === 'info' ? 'text-blue-600' : ''}
                        ${comment.type === 'neutral' ? 'text-gray-600' : ''}
                      `}>•</span>
                      <span className={`
                        ${comment.type === 'success' ? 'text-green-700' : ''}
                        ${comment.type === 'warning' ? 'text-orange-700' : ''}
                        ${comment.type === 'info' ? 'text-blue-700' : ''}
                        ${comment.type === 'neutral' ? 'text-gray-600' : ''}
                      `}>{comment.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Sezione Upload CSV - Riga dedicata in basso */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Aggiorna Dati Dashboard</h3>
          <div className="flex items-center justify-center gap-4">
            <label className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors">
              <Upload className="w-5 h-5" />
              <span className="font-medium">Carica CSV Aggiornato</span>
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoading}
              />
            </label>
            {isLoading && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="font-medium">Elaborazione in corso...</span>
              </div>
            )}
            {lastUpdate && (
              <div className="text-green-600 text-sm font-medium">
                ✅ Ultimo aggiornamento: {lastUpdate}
              </div>
            )}
            {error && (
              <div className="text-red-600 text-sm font-medium">
                ❌ Errore: {error}
              </div>
            )}
          </div>
          <p className="text-center text-gray-500 text-sm mt-3">
            Carica un file CSV per aggiornare tutti i dati della dashboard
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;