import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Clock, Target, Calendar, Building2, Upload, FileText } from 'lucide-react';

const Dashboard = () => {
  // State per i dati della dashboard
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Dati di default (quelli attuali)
  const defaultData = {
    totali: {
      proposte: 75,
      ore: 3717,
      manDays: 464.6,
      clienti: 54,
      persone: 23,
      proposteConcluse: 15,
      proposteVinte: 8,
      propostePerse: 7,
      tassoSuccesso: 53.3,
      percentualeVinte: 10.7
    },
    timeline: [
      { mese: "Gen", proposte: 13, manDays: 185.1 },
      { mese: "Feb", proposte: 7, manDays: 24.1 },
      { mese: "Mar", proposte: 12, manDays: 44.0 },
      { mese: "Apr", proposte: 9, manDays: 51.3 },
      { mese: "Mag", proposte: 13, manDays: 70.5 },
      { mese: "Giu", proposte: 20, manDays: 80.6 }
    ],
    status: {
      "Wait": 57,
      "Vinte": 8,
      "Perse": 7,
      "Altro": 3
    },
    risorse: [
      { nome: "Bignotti", progetti: 17, manDays: 53.1, allocazioneMedia: 8.9 },
      { nome: "Costantino", progetti: 23, manDays: 52.8, allocazioneMedia: 8.8 },
      { nome: "Morelli", progetti: 21, manDays: 46.6, allocazioneMedia: 7.8 },
      { nome: "Roveda", progetti: 18, manDays: 43.6, allocazioneMedia: 7.3 },
      { nome: "Peli", progetti: 20, manDays: 21.3, allocazioneMedia: 3.6 },
      { nome: "Altre risorse", progetti: 33, manDays: 247.2, allocazioneMedia: 41.2 }
    ],
    topClienti: [
      { cliente: "IntesaSanPaolo", proposte: 4, manDays: 130.0 },
      { cliente: "Nexi", proposte: 3, manDays: 16.5 },
      { cliente: "CRIF", proposte: 3, manDays: 7.4 },
      { cliente: "CSI", proposte: 3, manDays: 8.4 },
      { cliente: "CONSIP", proposte: 3, manDays: 14.1 }
    ]
  };

  // Inizializza con dati di default
  useEffect(() => {
    setDashboardData(defaultData);
  }, []);

  // Funzione semplificata per processare il CSV
  const processCSV = (csvText) => {
    try {
      console.log("=== INIZIO ELABORAZIONE CSV ===");
      
      // Pulisci il testo e dividi in righe
      const cleanText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const allLines = cleanText.split('\n');
      console.log("Totale righe nel file:", allLines.length);
      
      // Trova la prima riga che sembra contenere dati (non header)
      let dataLines = [];
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
      const records = [];
      
      dataLines.forEach((line, index) => {
        const parts = line.split(';').map(p => p.replace(/"/g, '').trim());
        
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
      const mesiMap = {};
      records.forEach(r => {
        const m = r.mese;
        if (!mesiMap[m]) mesiMap[m] = { proposte: 0, ore: 0 };
        mesiMap[m].proposte++;
        mesiMap[m].ore += r.ore;
      });
      
      const mesiOrdinati = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno'];
      const timeline = mesiOrdinati.map(m => ({
        mese: m.substring(0, 3),
        proposte: mesiMap[m]?.proposte || 0,
        manDays: parseFloat(((mesiMap[m]?.ore || 0) / 8).toFixed(1))
      }));
      
      // Top clienti
      const clientiMap = {};
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
        .slice(0, 5);
      
      // Risorse
      const nomiPrincipali = ['Morelli', 'Peli', 'Bignotti', 'Costantino', 'Roveda'];
      const risorseMap = {};
      nomiPrincipali.forEach(n => risorseMap[n] = { progetti: 0, ore: 0 });
      risorseMap['Altre risorse'] = { progetti: 0, ore: 0 };
      
      records.forEach(r => {
        if (r.persone) {
          const nomi = r.persone.split(',').map(n => n.trim());
          nomi.forEach(nome => {
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
      throw new Error(`Errore elaborazione: ${err.message}`);
    }
  };

  // Handler per il caricamento del file
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
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
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!dashboardData) {
    return <div className="flex items-center justify-center min-h-screen">Caricamento...</div>;
  }

  // Preparazione dati per i grafici
  const statusData = Object.entries(dashboardData.status).map(([status, count]) => ({
    name: status,
    value: count,
    percentage: ((count / dashboardData.totali.proposte) * 100).toFixed(1)
  }));

  const COLORS = ['#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B'];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto">
        {/* Header con upload */}
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
          
          {/* Upload CSV */}
          <div className="flex items-center justify-center gap-4">
            <label className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>Carica CSV Aggiornato</span>
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
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span>Elaborazione...</span>
              </div>
            )}
            {lastUpdate && (
              <div className="text-green-600 text-sm">
                ✅ Aggiornato: {lastUpdate}
              </div>
            )}
            {error && <div className="text-red-600 text-sm">❌ {error}</div>}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            📅 Timeline 2025
          </h2>
          <div className="relative">
            <div className="grid grid-cols-6 gap-4 relative">
              {dashboardData.timeline.map((month, index) => {
                const maxProposte = Math.max(...dashboardData.timeline.map(d => d.proposte));
                const maxManDays = Math.max(...dashboardData.timeline.map(d => d.manDays));
                const proposteHeight = maxProposte > 0 ? (month.proposte / maxProposte) * 100 : 0;
                const manDaysHeight = maxManDays > 0 ? (month.manDays / maxManDays) * 100 : 0;
                
                return (
                  <div key={index} className="text-center relative">
                    <div className="text-sm font-medium text-gray-600 mb-2">{month.mese}</div>
                    <div className="h-20 w-8 bg-gray-200 rounded-full mx-auto flex items-end overflow-hidden relative">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-full transition-all duration-500" 
                        style={{ height: `${proposteHeight}%` }}
                      ></div>
                      <div 
                        className="absolute w-2 h-2 bg-red-600 rounded-full border border-white" 
                        style={{ 
                          left: '50%', 
                          transform: 'translateX(-50%)', 
                          top: `${100 - manDaysHeight}%`,
                          marginTop: '-4px' 
                        }}
                      ></div>
                    </div>
                    <div className="text-sm font-bold text-gray-700 mt-1">{month.proposte}</div>
                  </div>
                );
              })}
              
              {dashboardData.timeline.map((month, index) => {
                if (index === dashboardData.timeline.length - 1) return null;
                const maxManDays = Math.max(...dashboardData.timeline.map(d => d.manDays));
                if (maxManDays === 0) return null;
                
                const currentHeight = (month.manDays / maxManDays) * 100;
                const nextHeight = (dashboardData.timeline[index + 1].manDays / maxManDays) * 100;
                const startY = 100 - currentHeight;
                const endY = 100 - nextHeight;
                
                return (
                  <div 
                    key={`line-${index}`} 
                    className="absolute pointer-events-none" 
                    style={{ 
                      left: `${((index + 1) * 100 / 6) - (100 / 12)}%`, 
                      top: '24px', 
                      width: `${100 / 6}%`, 
                      height: '80px' 
                    }}
                  >
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <line 
                        x1="0" 
                        y1={`${startY}%`} 
                        x2="100" 
                        y2={`${endY}%`} 
                        stroke="#ef4444" 
                        strokeWidth="2" 
                        strokeDasharray="4,4" 
                        opacity="0.8" 
                      />
                    </svg>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-center mt-2 text-xs text-gray-600">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Proposte mensili</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-0.8 bg-red-500" style={{ borderTop: '2px dashed #ef4444' }}></div>
                  <span>Trend Man/Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards metriche principali sotto la timeline */}
        <div className="grid grid-cols-4 gap-6 mb-6">
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
        <div className="grid grid-cols-4 gap-6 h-[calc(100vh-900px)]">
          {/* Colonna 1 - Grafico a torta CSS */}
          <div className="col-span-1 h-full">
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
          <div className="col-span-1 h-full">
            <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Clienti</h3>
              <div className="space-y-3 flex-1">
                {dashboardData.topClienti.map((cliente, index) => (
                  <div key={cliente.cliente} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{cliente.cliente}</div>
                        <div className="text-sm text-gray-500">{cliente.proposte} proposte</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-blue-600">{cliente.manDays}</div>
                      <div className="text-sm text-gray-500">man/days</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Colonna 3 - Allocazione per Risorsa (sotto Man/Days) */}
          <div className="col-span-1 h-full">
            <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Allocazione per Risorsa</h3>
              <div className="space-y-3 flex-1">
                {dashboardData.risorse.map((risorsa, index) => (
                  <div key={risorsa.nome} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3 ${
                        risorsa.nome === 'Altre risorse' ? 'bg-gray-400' : 'bg-green-500'
                      }`}>
                        {risorsa.nome === 'Altre risorse' ? 'A' : risorsa.nome.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{risorsa.nome}</div>
                        <div className="text-sm text-gray-500">{risorsa.progetti} progetti</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">{risorsa.manDays.toFixed(1)}</div>
                      <div className="text-sm text-gray-500">man/days</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Colonna 4 - Allocazione Media Mensile e Trend Generale (sotto Man/Days) */}
          <div className="col-span-1 h-full">
            <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistica Mensile</h3>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-3">Allocazione Media Mensile</h4>
                <div className="space-y-2">
                  {dashboardData.risorse.map((risorsa) => (
                    <div key={risorsa.nome} className="flex justify-between items-center">
                      <span className="text-sm text-blue-700">{risorsa.nome}</span>
                      <span className="text-sm font-medium text-blue-900">{risorsa.allocazioneMedia} m/d</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Trend Generale</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span><strong>Gen:</strong> picco massimo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span><strong>Feb-Mar:</strong> consolidamento</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span><strong>Apr-Giu:</strong> crescita graduale</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;