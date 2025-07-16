import { useState, useEffect } from 'react';
import { Users, Clock, Building2, Upload, AlertCircle, CheckCircle, XCircle, Pause, ChevronUp, ChevronDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Tipi per i dati
interface ProjectData {
  progetto: string;
  area: string;
  inizioLavori: string;
  responsabile: string;
  deliveryDeadline: string;
  stato: string;
  priorita: string;
  ore: number;
  type: string;
  note?: string;
}

interface DashboardData {
  totali: {
    progetti: number;
    persone: number;
    oreStimate: number;
    progettiAttivi: number;
    progettiCompletati: number;
    progettiBloccati: number;
  };
  stati: {
    [key: string]: number;
  };
  aree: {
    [key: string]: number;
  };
  persone: Array<{
    nome: string;
    progetti: number;
    ore: number;
    areaPrevalente: string;
    mediaOrePerMese: number;
    mediaOrePerProgetto: number;
  }>;
  priorita: {
    [key: string]: number;
  };
  timeline: Array<{
    mese: string;
    progetti: number;
    ore: number;
  }>;
}

const Dashboard = () => {
  // State per i dati della dashboard
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<string | null>(null);
  
  // State per l'ordinamento della tabella persone
  const [sortConfig, setSortConfig] = useState<{
    key: keyof DashboardData['persone'][0] | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  
  // State per il filtro priorità (drill-down)
  const [selectedPriorita, setSelectedPriorita] = useState<string | null>(null);

  // Funzione per gestire l'ordinamento
  const handleSort = (key: keyof DashboardData['persone'][0]) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Funzione per ordinare i dati delle persone
  const getSortedPersone = () => {
    if (!dashboardData?.persone) return [];
    
    const sortablePersone = [...dashboardData.persone];
    
    if (sortConfig.key) {
      sortablePersone.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue, 'it', { sensitivity: 'base' });
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          const comparison = aValue - bValue;
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }
        
        return 0;
      });
    }
    
    return sortablePersone;
  };

  // Componente per l'header ordinabile
  const SortableHeader = ({ 
    children, 
    sortKey, 
    className = "border border-gray-200 px-4 py-3 text-left font-semibold text-gray-800"
  }: { 
    children: React.ReactNode; 
    sortKey: keyof DashboardData['persone'][0];
    className?: string;
  }) => (
    <th 
      className={`${className} cursor-pointer hover:bg-gray-100 transition-colors select-none`}
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        <span>{children}</span>
        <div className="flex flex-col">
          <ChevronUp 
            className={`w-3 h-3 ${
              sortConfig.key === sortKey && sortConfig.direction === 'asc' 
                ? 'text-blue-600' 
                : 'text-gray-400'
            }`} 
          />
          <ChevronDown 
            className={`w-3 h-3 -mt-1 ${
              sortConfig.key === sortKey && sortConfig.direction === 'desc' 
                ? 'text-blue-600' 
                : 'text-gray-400'
            }`} 
          />
        </div>
      </div>
    </th>
  );

  // Dati vuoti di default
  const emptyData: DashboardData = {
    totali: {
      progetti: 0,
      persone: 0,
      oreStimate: 0,
      progettiAttivi: 0,
      progettiCompletati: 0,
      progettiBloccati: 0,
    },
    stati: {},
    aree: {},
    persone: [],
    priorita: {},
    timeline: [
      { mese: "Gen", progetti: 0, ore: 0 },
      { mese: "Feb", progetti: 0, ore: 0 },
      { mese: "Mar", progetti: 0, ore: 0 },
      { mese: "Apr", progetti: 0, ore: 0 },
      { mese: "Mag", progetti: 0, ore: 0 },
      { mese: "Giu", progetti: 0, ore: 0 },
      { mese: "Lug", progetti: 0, ore: 0 },
      { mese: "Ago", progetti: 0, ore: 0 },
      { mese: "Set", progetti: 0, ore: 0 },
      { mese: "Ott", progetti: 0, ore: 0 },
      { mese: "Nov", progetti: 0, ore: 0 },
      { mese: "Dic", progetti: 0, ore: 0 },
    ]
  };

  // Inizializza con dati vuoti e carica dati salvati
  useEffect(() => {
    // Prova a caricare dati salvati dal localStorage
    const savedData = localStorage.getItem('people-dashboard-data');
    const savedCsv = localStorage.getItem('people-dashboard-csv');
    const savedLastUpdate = localStorage.getItem('people-dashboard-lastUpdate');
    
    if (savedData && savedCsv) {
      try {
        setDashboardData(JSON.parse(savedData));
        setCsvData(savedCsv);
        setLastUpdate(savedLastUpdate);
        console.log('Dati caricati dal localStorage');
      } catch (error) {
        console.error('Errore nel caricamento dati salvati:', error);
        setDashboardData(emptyData);
      }
    } else {
      setDashboardData(emptyData);
    }
  }, []);
  
  // Re-processa i dati quando cambia il filtro priorità
  useEffect(() => {
    if (csvData) {
      try {
        const newData = processCSV(csvData, selectedPriorita);
        setDashboardData(newData);
      } catch (err) {
        console.error("Errore nel re-processing:", err);
      }
    }
  }, [selectedPriorita, csvData]);

  // Funzione per processare il CSV
  const processCSV = (csvText: string, prioritaFilter?: string | null): DashboardData => {
    try {
      console.log("=== INIZIO ELABORAZIONE CSV PEOPLE ===");
      
      const cleanText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const allLines = cleanText.split('\n');
      console.log("Totale righe nel file:", allLines.length);
      
      // Trova l'header e le righe di dati
      let headerIndex = -1;
      for (let i = 0; i < allLines.length; i++) {
        if (allLines[i].includes('Progetti Correnti e Pianificati') && allLines[i].includes('Area di Competenza')) {
          headerIndex = i;
          break;
        }
      }
      
      if (headerIndex === -1) {
        throw new Error("Header non trovato nel CSV");
      }
      
      const dataLines = allLines.slice(headerIndex + 1).filter(line => line.trim());
      console.log("Righe di dati trovate:", dataLines.length);
      
      const records: ProjectData[] = [];
      
      dataLines.forEach((line) => {
        const parts = line.split(';').map(p => p.replace(/"/g, '').trim());
        
        if (parts.length >= 12 && parts[0]) {
          records.push({
            progetto: parts[0],
            area: parts[1] || '',
            inizioLavori: parts[2] || '',
            responsabile: parts[3] || '',
            deliveryDeadline: parts[6] || '',
            stato: parts[7] || '',
            priorita: parts[8] || '',
            ore: parseInt(parts[10]) || 0,
            type: parts[12] || '',
            note: parts[11] || ''
          });
        }
      });
      
      console.log("Record processati:", records.length);
      
      // Filtro per priorità se specificato
      const filteredRecords = prioritaFilter 
        ? records.filter(r => r.priorita === prioritaFilter)
        : records;
      
      console.log("Record dopo filtro priorità:", filteredRecords.length);
      
      if (filteredRecords.length === 0) {
        throw new Error("Nessun record valido trovato");
      }
      
      // === CALCOLI ===
      
      // Totali
      const totalOre = filteredRecords.reduce((sum, r) => sum + r.ore, 0);
      const personeUniche = new Set(
        filteredRecords
          .map(r => r.responsabile)
          .filter(r => r)
          .flatMap(r => r.split('-').map(n => n.trim()))
          .filter(n => n)
      );
      
      // Stati
      const statiCount: { [key: string]: number } = {};
      filteredRecords.forEach(r => {
        const stato = r.stato || 'Non specificato';
        statiCount[stato] = (statiCount[stato] || 0) + 1;
      });
      
      // Aree
      const areeCount: { [key: string]: number } = {};
      filteredRecords.forEach(r => {
        const area = r.area || 'Non specificata';
        areeCount[area] = (areeCount[area] || 0) + 1;
      });
      
      // Priorità
      const prioritaCount: { [key: string]: number } = {};
      records.forEach(r => {
        const priorita = r.priorita || 'Non specificata';
        prioritaCount[priorita] = (prioritaCount[priorita] || 0) + 1;
      });
      
      // Persone
      const personeMap: { [key: string]: { progetti: number; ore: number; aree: { [key: string]: number } } } = {};
      
      filteredRecords.forEach(r => {
        if (r.responsabile) {
          const nomi = r.responsabile.split('-').map(n => n.trim()).filter(n => n);
          nomi.forEach(nome => {
            if (!personeMap[nome]) {
              personeMap[nome] = { progetti: 0, ore: 0, aree: {} };
            }
            personeMap[nome].progetti++;
            personeMap[nome].ore += r.ore / nomi.length;
            
            const area = r.area || 'Non specificata';
            personeMap[nome].aree[area] = (personeMap[nome].aree[area] || 0) + 1;
          });
        }
      });
      
      const persone = Object.entries(personeMap).map(([nome, data]) => {
        const areaPrevalente = Object.entries(data.aree).reduce((max, [area, count]) => 
          count > max.count ? { area, count } : max, { area: '', count: 0 }
        ).area;
        
        // Calcolo media ore per mese (assumendo 12 mesi)
        const mediaOrePerMese = Math.round((data.ore / 12) * 10) / 10;
        
        // Calcolo media ore per progetto
        const mediaOrePerProgetto = data.progetti > 0 ? Math.round((data.ore / data.progetti) * 10) / 10 : 0;
        
        return {
          nome,
          progetti: data.progetti,
          ore: Math.round(data.ore),
          areaPrevalente,
          mediaOrePerMese,
          mediaOrePerProgetto
        };
      }).sort((a, b) => b.progetti - a.progetti);
      
      // Timeline (placeholder - da implementare logica specifica se necessario)
      const timeline = emptyData.timeline;
      
      console.log("=== ELABORAZIONE COMPLETATA ===");
      
      return {
        totali: {
          progetti: filteredRecords.length,
          persone: personeUniche.size,
          oreStimate: totalOre,
          progettiAttivi: statiCount['In corso'] || 0,
          progettiCompletati: statiCount['Completato'] || 0,
          progettiBloccati: statiCount['Bloccato'] || 0,
        },
        stati: statiCount,
        aree: areeCount,
        persone,
        priorita: prioritaCount,
        timeline
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
      
      const newData = processCSV(text, selectedPriorita);
      console.log("Dati elaborati con successo!");
      
      setCsvData(text); // Salva i dati CSV per future elaborazioni
      setDashboardData(newData);
      setLastUpdate(new Date().toLocaleTimeString());
      
      // Salva i dati nel localStorage per la funzionalità offline
      localStorage.setItem('people-dashboard-csv', text);
      localStorage.setItem('people-dashboard-data', JSON.stringify(newData));
      localStorage.setItem('people-dashboard-lastUpdate', new Date().toLocaleTimeString());
      
      // Reset del file input
      event.target.value = '';
      
    } catch (err) {
      console.error("Errore caricamento:", err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Controllo se dashboardData è null
  if (!dashboardData) {
    return <div className="flex items-center justify-center min-h-screen">Caricamento...</div>;
  }

  // Controllo se non ci sono dati
  const hasData = dashboardData.totali.progetti > 0;

  // Funzioni di utilità per icone stato
  const getStatoIcon = (stato: string) => {
    switch (stato.toLowerCase()) {
      case 'completato': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in corso': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'bloccato': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'da fare': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'in revisione': return <Pause className="w-4 h-4 text-purple-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-between mb-4">
            <div></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center justify-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
              </div>
              People Dashboard
            </h1>
            <div></div>
          </div>
          <p className="text-gray-600 text-sm mb-4">Gestione progetti e allocazione risorse</p>
        </div>

        {!hasData ? (
          // Stato vuoto
          <div className="bg-white rounded-lg shadow-md p-8 text-center mb-6">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Nessun Dato Disponibile</h2>
            <p className="text-gray-500 mb-4">Carica un CSV per visualizzare i progetti e le persone</p>
          </div>
        ) : (
          // Dashboard con dati
          <>
            {/* Cards metriche principali */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-900">{dashboardData.totali.progetti}</div>
                  <div className="text-blue-700 text-md font-medium">Progetti Totali</div>
                  <div className="text-s text-blue-600 bg-blue-100 px-2 py-1 rounded mt-1">
                    📋 {dashboardData.totali.progettiAttivi} attivi
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-900">{dashboardData.totali.persone}</div>
                  <div className="text-green-700 text-md font-medium">Persone Coinvolte</div>
                  <div className="text-s text-green-600 bg-green-100 px-2 py-1 rounded mt-1">
                    👥 {(dashboardData.totali.progetti / dashboardData.totali.persone).toFixed(1)} prog/pers
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-900">{dashboardData.totali.oreStimate}</div>
                  <div className="text-orange-700 text-md font-medium">Ore Stimate</div>
                  <div className="text-s text-orange-600 bg-orange-100 px-2 py-1 rounded mt-1">
                    ⏱️ {(dashboardData.totali.oreStimate / dashboardData.totali.progetti).toFixed(1)} ore/prog
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-900">{dashboardData.totali.progettiCompletati}</div>
                  <div className="text-purple-700 text-md font-medium">Completati</div>
                  <div className="text-s text-purple-600 bg-purple-100 px-2 py-1 rounded mt-1">
                    ✅ {((dashboardData.totali.progettiCompletati / dashboardData.totali.progetti) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Layout principale */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              {/* Stati Progetti */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Stati Progetti</h3>
                <div className="space-y-3">
                  {Object.entries(dashboardData.stati).map(([stato, count]) => (
                    <div key={stato} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {getStatoIcon(stato)}
                        <span className="font-medium text-gray-900">{stato}</span>
                      </div>
                      <span className="text-lg font-bold text-gray-700">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aree di Competenza */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Aree di Competenza</h3>
                <div className="space-y-3">
                  {Object.entries(dashboardData.aree).map(([area, count]) => (
                    <div key={area} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-gray-900">{area}</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priorità - Grafico a torta */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Distribuzione Priorità
                  {selectedPriorita && (
                    <div className="text-sm font-normal text-blue-600 mt-1">
                      Filtro attivo: {selectedPriorita}
                      <button 
                        onClick={() => setSelectedPriorita(null)}
                        className="ml-2 px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs transition-colors"
                      >
                        Rimuovi filtro
                      </button>
                    </div>
                  )}
                </h3>
                <div className="h-96 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(dashboardData.priorita).map(([priorita, count]) => ({
                          name: priorita,
                          value: count,
                          color: priorita === 'Alta' ? '#dc2626' : 
                                 priorita === 'Media' ? '#f59e0b' : 
                                 priorita === 'Bassa' ? '#059669' : '#6366f1'
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={120}
                        paddingAngle={2}
                        fill="#8884d8"
                        dataKey="value"
                        onClick={(data) => {
                          if (selectedPriorita === data.name) {
                            setSelectedPriorita(null);
                          } else {
                            setSelectedPriorita(data.name);
                          }
                        }}
                        className="cursor-pointer"
                      >
                        {Object.entries(dashboardData.priorita).map(([priorita], index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={priorita === 'Alta' ? '#dc2626' : 
                                  priorita === 'Media' ? '#f59e0b' : 
                                  priorita === 'Bassa' ? '#059669' : '#6366f1'}
                            stroke={selectedPriorita === priorita ? '#ffffff' : 'transparent'}
                            strokeWidth={selectedPriorita === priorita ? 4 : 0}
                            style={{
                              filter: selectedPriorita === priorita ? 'brightness(1.1)' : 'none',
                              transition: 'all 0.2s ease'
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [
                          `${value} progetti`, 
                          `Priorità ${name}`
                        ]}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          fontSize: '14px'
                        }}
                        labelStyle={{ 
                          color: '#1f2937',
                          fontWeight: '600'
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                          <span style={{ 
                            color: selectedPriorita === value ? '#1f2937' : '#6b7280',
                            fontWeight: selectedPriorita === value ? '600' : '500',
                            fontSize: '14px'
                          }}>
                            {value}
                          </span>
                        )}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Testo centrale della ciambella */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="text-3xl font-bold text-gray-800">
                      {Object.values(dashboardData.priorita).reduce((sum, count) => sum + count, 0)}
                    </div>
                    <div className="text-sm text-gray-600 font-semibold mt-1">
                      Progetti Totali
                    </div>
                    {selectedPriorita && (
                      <div className="text-xs text-blue-600 mt-2 font-semibold px-2 py-1 bg-blue-100 rounded-full">
                        Filtrato: {selectedPriorita}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-800 font-medium">
                      💡 Clicca su una fetta per filtrare tutta la dashboard per priorità
                    </span>
                  </div>
                  {selectedPriorita && (
                    <div className="text-xs text-blue-600 mt-2 italic">
                      Dashboard attualmente filtrata per priorità: <strong>{selectedPriorita}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Persone */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Allocazione Persone</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <SortableHeader sortKey="nome">Nome</SortableHeader>
                      <SortableHeader sortKey="progetti" className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-800">Progetti</SortableHeader>
                      <SortableHeader sortKey="ore" className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-800">Ore Totali</SortableHeader>
                      <SortableHeader sortKey="mediaOrePerMese" className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-800">Ore/Mese</SortableHeader>
                      <SortableHeader sortKey="mediaOrePerProgetto" className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-800">Ore/Progetto</SortableHeader>
                      <SortableHeader sortKey="areaPrevalente">Area Prevalente</SortableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedPersone().map((persona, index) => (
                      <tr key={persona.nome} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="border border-gray-200 px-4 py-3 font-medium text-gray-800">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {persona.nome.split(' ').map(n => n.charAt(0)).join('').substring(0, 2)}
                            </div>
                            {persona.nome}
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                            {persona.progetti}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center font-medium text-gray-700">
                          {persona.ore}h
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                            {persona.mediaOrePerMese}h
                          </span>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm">
                            {persona.mediaOrePerProgetto}h
                          </span>
                        </td>
                        <td className="border border-gray-200 px-4 py-3">
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                            {persona.areaPrevalente}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-600 border-t pt-4">
                <p><strong>Legenda:</strong></p>
                <div className="flex gap-6 mt-2">
                  <p>• <strong>Ore/Mese:</strong> Media ore distribuite su 12 mesi</p>
                  <p>• <strong>Ore/Progetto:</strong> Media ore per progetto assegnato</p>
                  <p>• <strong>Ordinamento:</strong> Clicca su qualsiasi header per ordinare</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Sezione Upload CSV */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Carica Dati Progetti</h3>
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
            Carica un file CSV per visualizzare progetti, persone e allocazioni
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
