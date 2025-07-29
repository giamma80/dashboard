import { useState, useEffect } from 'react';
import { Users, Upload, Download, Calendar, User, TrendingUp, BarChart3, PieChart as PieChartIcon, Gauge, Filter, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, ComposedChart } from 'recharts';
import DownloadSection from './DownloadSection';

// Tipi per i nuovi dati
interface ProjectData {
  name: string;
  stream: string;
  teamMember: string;
  startDate: string;
  deliveryDeadline: string;
  status: string;
  priority: string;
  groupDriven: string;
  neededHours: number;
  notes?: string;
  stakeholder?: string;
  type: string;
}

// Tipi per i dati aggregati
interface StreamData {
  stream: string;
  hours: number;
  projects: number;
  color: string;
}

interface TimelineData {
  month: string;
  date: Date;
  streamData: { [stream: string]: number };
  totalHours: number;
  totalProjects: number;
}

interface TeamMemberData {
  name: string;
  totalHours: number;
  totalProjects: number;
  streams: StreamData[];
  workPressure: number; // percentuale del carico annuale
}

interface DashboardData {
  timeline: TimelineData[];
  teamMembers: TeamMemberData[];
  totalTeamHours: number;
  totalTeamProjects: number;
  teamWorkPressure: number;
  statusDistribution: { [status: string]: number };
  priorityDistribution: { [priority: string]: number };
  typeDistribution: { [type: string]: number };
  streamDistribution: StreamData[];
  topProjects: { name: string; hours: number; stream: string; member: string; color: string }[];
}

// Configurazione colori per stream
const STREAM_COLORS: { [key: string]: string } = {
  'UnifAI': '#3B82F6',
  'Data': '#10B981',
  'Product Detail Page': '#F59E0B',
  'Network Page': '#8B5CF6',
  'AB Testing': '#EF4444',
  'E-Business Performance': '#06B6D4',
  'Migrations': '#84CC16',
  'Compliance': '#F97316',
  'Training': '#EC4899',
  'Innovation': '#6366F1',
  'Tech Development': '#14B8A6',
  'Payment Methods': '#F472B6',
  'Testing Automation': '#A855F7',
  'UX/UI/CRO': '#22C55E',
  'Accessibility': '#0EA5E9',
  'Tech Maintenance': '#EAB308',
  'E-Pos': '#DC2626',
  'Content / Editorial': '#7C3AED',
  'Heritage': '#059669',
  'E-com exclusives': '#DB2777',
  'E-Business': '#2563EB',
  'Site Speed': '#16A34A',
  'Finance': '#CA8A04',
  'Strategy & Governance': '#9333EA',
  'External driven streams': '#0891B2',
  'Processes': '#65A30D',
  'Network Management': '#C2410C',
  'OCP': '#BE185D',
  'Release Management': '#7C2D12',
  'Procurement': '#1E40AF',
  'Ceremonies': '#991B1B',
  'Local Digital Reviews': '#365314',
  'Altri': '#9CA3AF',
  'default': '#6B7280'
};

// Configurazione ore lavorative
const WORK_HOURS_PER_DAY = 8;
const WORK_DAYS_PER_WEEK = 5; // Lunedì-Venerdì

// Funzione per calcolare le ore lavorative disponibili in un periodo
function calculateAvailableWorkHours(startDate: Date, endDate: Date): number {
  let totalWorkDays = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    // 1-5 sono lunedì-venerdì (0 = domenica, 6 = sabato)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      totalWorkDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return totalWorkDays * WORK_HOURS_PER_DAY;
}

const Dashboard = () => {
  // State per i dati della dashboard
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<string | null>(null);
  
  // State per i filtri
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '2025-04-01',
    end: '2026-03-31'
  });
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>('');
  
  // State per il modale download
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // Dati vuoti di default
  const emptyData: DashboardData = {
    timeline: [],
    teamMembers: [],
    totalTeamHours: 0,
    totalTeamProjects: 0,
    teamWorkPressure: 0,
    statusDistribution: {},
    priorityDistribution: {},
    typeDistribution: {},
    streamDistribution: [],
    topProjects: []
  };

  // Funzione per parsare la data in formato DD/MM/YY
  const parseDate = (dateStr: string): Date | null => {
    // Restituisce null per date vuote o invalide invece di new Date()
    if (!dateStr || dateStr.trim() === '') {
      return null;
    }
    
    try {
      // Pulisce la stringa da caratteri strani
      const cleanDateStr = dateStr.trim().replace(/[^\d\/]/g, '');
      const parts = cleanDateStr.split('/');
      
      if (parts.length !== 3) {
        console.warn('Formato data invalido (parti mancanti):', dateStr, '→', parts);
        return null;
      }
      
      const [day, month, year] = parts;
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      let yearNum = parseInt(year);
      
      // Validazione base
      if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
        console.warn('Formato data invalido (non numerici):', dateStr);
        return null;
      }
      
      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) {
        console.warn('Formato data invalido (valori fuori range):', dateStr);
        return null;
      }
      
      // Logica migliorata per l'anno
      let fullYear: number;
      if (yearNum < 100) {
        // Anno a 2 cifre: assumiamo che 00-30 sia 2000-2030, 31-99 sia 1931-1999
        if (yearNum <= 30) {
          fullYear = 2000 + yearNum;
        } else {
          fullYear = 1900 + yearNum;
        }
      } else {
        // Anno già a 4 cifre
        fullYear = yearNum;
      }
      
      // Sanity check: gli anni dovrebbero essere ragionevoli (tra 1990 e 2050)
      if (fullYear < 1990 || fullYear > 2050) {
        console.warn('Anno fuori range ragionevole:', dateStr, '→', fullYear);
        return null;
      }
      
      const parsedDate = new Date(fullYear, monthNum - 1, dayNum);
      
      if (isNaN(parsedDate.getTime())) {
        console.warn('Data risultante invalida:', dateStr, '→', parsedDate);
        return null;
      }
      
      return parsedDate;
    } catch (error) {
      console.warn('Errore nel parsing della data:', dateStr, error);
      return null;
    }
  };

  // Funzione per generare i mesi della timeline
  const generateMonthsInRange = (startDate: Date, endDate: Date): TimelineData[] => {
    const months: TimelineData[] = [];
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    
    while (current <= endDate) {
      months.push({
        month: current.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }),
        date: new Date(current),
        streamData: {},
        totalHours: 0,
        totalProjects: 0
      });
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  };

  // Funzione per verificare se un progetto è attivo in un determinato mese
  const isProjectActiveInMonth = (project: ProjectData, monthDate: Date): boolean => {
    const startDate = parseDate(project.startDate);
    const endDate = parseDate(project.deliveryDeadline);
    
    // Se le date non sono valide, escludiamo il progetto
    if (!startDate || !endDate) {
      return false;
    }
    
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    
    return startDate <= monthEnd && endDate >= monthStart;
  };

  // Funzione per processare i dati CSV
  const processCSV = (csvContent: string, dateFilter: { start: string; end: string }, memberFilter: string): DashboardData => {
    const lines = csvContent.trim().split('\n');
    
    const projects: ProjectData[] = lines.slice(1).map(line => {
      const values = line.split(';');
      return {
        name: values[0] || '',
        stream: values[1] || '',
        teamMember: values[2] || '',
        startDate: values[3] || '',
        deliveryDeadline: values[4] || '',
        status: values[5] || '',
        priority: values[6] || '',
        groupDriven: values[7] || '',
        neededHours: parseInt(values[8]) || 0,
        notes: values[9] || '',
        stakeholder: values[10] || '',
        type: values[11] || ''
      };
    }).filter(project => project.name && project.teamMember);

    // Applica filtro membro del team
    const filteredProjects = memberFilter 
      ? projects.filter(p => p.teamMember === memberFilter)
      : projects;

    // Applica filtro data
    const startFilterDate = new Date(dateFilter.start);
    const endFilterDate = new Date(dateFilter.end);
    
    const dateFilteredProjects = filteredProjects.filter(project => {
      const projectStart = parseDate(project.startDate);
      const projectEnd = parseDate(project.deliveryDeadline);
      
      // Escludiamo progetti con date invalide
      if (!projectStart || !projectEnd) {
        console.warn('Progetto escluso per date invalide:', project.name, 'Start:', project.startDate, 'End:', project.deliveryDeadline);
        return false;
      }
      
      return projectEnd >= startFilterDate && projectStart <= endFilterDate;
    });

    // Genera timeline
    const timeline = generateMonthsInRange(startFilterDate, endFilterDate);
    
    // Popola timeline con dati dei progetti
    timeline.forEach(month => {
      const activeProjects = dateFilteredProjects.filter(project => 
        isProjectActiveInMonth(project, month.date)
      );
      
      month.totalProjects = activeProjects.length;
      month.totalHours = activeProjects.reduce((sum, project) => {
        // Distribuzione ore del progetto sui mesi attivi
        const projectStart = parseDate(project.startDate);
        const projectEnd = parseDate(project.deliveryDeadline);
        
        // Se le date non sono valide, salta il progetto
        if (!projectStart || !projectEnd) {
          return sum;
        }
        
        const monthsActive = Math.max(1, Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (30 * 24 * 60 * 60 * 1000)));
        return sum + (project.neededHours / monthsActive);
      }, 0);
      
      // Raggruppa per stream con aggregazione degli stream minori
      const monthStreamMap = new Map<string, number>();
      
      activeProjects.forEach(project => {
        const projectStart = parseDate(project.startDate);
        const projectEnd = parseDate(project.deliveryDeadline);
        
        // Se le date non sono valide, salta il progetto
        if (!projectStart || !projectEnd) {
          return;
        }
        
        const monthsActive = Math.max(1, Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (30 * 24 * 60 * 60 * 1000)));
        const hoursPortion = project.neededHours / monthsActive;
        
        if (!monthStreamMap.has(project.stream)) {
          monthStreamMap.set(project.stream, 0);
        }
        monthStreamMap.set(project.stream, monthStreamMap.get(project.stream)! + hoursPortion);
      });
      
      // Se c'è un filtro membro attivo, mostra tutti i suoi stream senza aggregazione
      if (memberFilter && memberFilter.trim() !== '') {
        // Mostra tutti gli stream del membro filtrato
        monthStreamMap.forEach((hours, stream) => {
          month.streamData[stream] = hours;
          (month as any)[stream] = hours;
        });
      } else {
        // Logica normale: ordina stream per ore e prendi i top 8
        const monthStreamEntries = Array.from(monthStreamMap.entries()).sort((a, b) => b[1] - a[1]);
        const topMonthStreams = monthStreamEntries.slice(0, 8);
        const minorMonthStreams = monthStreamEntries.slice(8);
        
        // Popola i dati per i top stream
        topMonthStreams.forEach(([stream, hours]) => {
          month.streamData[stream] = hours;
          (month as any)[stream] = hours;
        });
        
        // Aggrega stream minori in "Altri"
        if (minorMonthStreams.length > 0) {
          const othersHours = minorMonthStreams.reduce((sum, [, hours]) => sum + hours, 0);
          month.streamData['Altri'] = othersHours;
          (month as any)['Altri'] = othersHours;
        }
      }
    });

    // Calcola dati membri del team
    const teamMemberMap = new Map<string, TeamMemberData>();
    
    dateFilteredProjects.forEach(project => {
      if (!teamMemberMap.has(project.teamMember)) {
        teamMemberMap.set(project.teamMember, {
          name: project.teamMember,
          totalHours: 0,
          totalProjects: 0,
          streams: [],
          workPressure: 0
        });
      }
      
      const member = teamMemberMap.get(project.teamMember)!;
      member.totalHours += project.neededHours;
      member.totalProjects += 1;
    });

    // Calcola distribuzione stream per ogni membro
    teamMemberMap.forEach((member, memberName) => {
      const memberProjects = dateFilteredProjects.filter(p => p.teamMember === memberName);
      const streamMap = new Map<string, { hours: number; projects: number }>();
      
      memberProjects.forEach(project => {
        if (!streamMap.has(project.stream)) {
          streamMap.set(project.stream, { hours: 0, projects: 0 });
        }
        const streamData = streamMap.get(project.stream)!;
        streamData.hours += project.neededHours;
        streamData.projects += 1;
      });
      
      // Ordina stream per ore e prendi i top 5 per ogni membro
      const memberStreamEntries = Array.from(streamMap.entries()).map(([stream, data]) => ({
        stream,
        hours: data.hours,
        projects: data.projects,
        color: STREAM_COLORS[stream] || STREAM_COLORS.default
      })).sort((a, b) => b.hours - a.hours);
      
      const topMemberStreams = memberStreamEntries.slice(0, 5);
      const minorMemberStreams = memberStreamEntries.slice(5);
      
      member.streams = [...topMemberStreams];
      
      // Se ci sono stream minori, aggregali in "Altri"
      if (minorMemberStreams.length > 0) {
        const othersHours = minorMemberStreams.reduce((sum, stream) => sum + stream.hours, 0);
        const othersProjects = minorMemberStreams.reduce((sum, stream) => sum + stream.projects, 0);
        
        member.streams.push({
          stream: 'Altri',
          hours: othersHours,
          projects: othersProjects,
          color: '#9CA3AF'
        });
      }
    });

    // Calcola il periodo dei dati per determinare le ore lavorative disponibili
    // USA SEMPRE il range di filtro selezionato dall'utente
    console.log('Usando range di filtro selezionato per calcolo ore:', {
      startFilterDate: startFilterDate.toLocaleDateString(),
      endFilterDate: endFilterDate.toLocaleDateString(),
      totalProjects: dateFilteredProjects.length
    });
    
    // Calcola le ore lavorative disponibili per persona nel periodo di filtro
    const availableWorkHoursPerPerson = calculateAvailableWorkHours(startFilterDate, endFilterDate);
    
    console.log('Ore lavorative disponibili per persona (range filtro):', availableWorkHoursPerPerson);
    
    // Se il periodo è troppo breve (meno di un mese), usa un periodo minimo ragionevole
    const minimumWorkHours = WORK_HOURS_PER_DAY * WORK_DAYS_PER_WEEK * 4; // 1 mese minimo
    const finalAvailableHours = Math.max(availableWorkHoursPerPerson, minimumWorkHours);
    
    console.log('Ore finali usate per il calcolo:', finalAvailableHours);
    
    // Calcola work pressure per ogni membro
    teamMemberMap.forEach(member => {
      const rawPressure = (member.totalHours / finalAvailableHours) * 100;
      member.workPressure = Math.min(rawPressure, 150);
      console.log(`${member.name}: ${member.totalHours}h / ${finalAvailableHours}h = ${rawPressure.toFixed(1)}% (cap: ${member.workPressure.toFixed(1)}%)`);
    });

    const teamMembers = Array.from(teamMemberMap.values());
    
    // Calcola totali team
    const totalTeamHours = teamMembers.reduce((sum, member) => sum + member.totalHours, 0);
    const totalTeamProjects = teamMembers.reduce((sum, member) => sum + member.totalProjects, 0);
    const totalTeamWorkHours = teamMembers.length * finalAvailableHours;
    const teamWorkPressure = Math.min((totalTeamHours / totalTeamWorkHours) * 100, 150);

    // Calcola distribuzioni
    const statusDistribution: { [status: string]: number } = {};
    const priorityDistribution: { [priority: string]: number } = {};
    const typeDistribution: { [type: string]: number } = {};
    const streamMap = new Map<string, { hours: number; projects: number }>();

    dateFilteredProjects.forEach(project => {
      statusDistribution[project.status] = (statusDistribution[project.status] || 0) + 1;
      priorityDistribution[project.priority] = (priorityDistribution[project.priority] || 0) + 1;
      typeDistribution[project.type] = (typeDistribution[project.type] || 0) + 1;
      
      if (!streamMap.has(project.stream)) {
        streamMap.set(project.stream, { hours: 0, projects: 0 });
      }
      const streamData = streamMap.get(project.stream)!;
      streamData.hours += project.neededHours;
      streamData.projects += 1;
    });

    // Raggruppa gli stream minori sotto "Altri"
    const streamEntries = Array.from(streamMap.entries()).map(([stream, data]) => ({
      stream,
      hours: data.hours,
      projects: data.projects,
      color: STREAM_COLORS[stream] || STREAM_COLORS.default
    }));

    // Se c'è un filtro membro attivo, mostra tutti i suoi stream senza aggregazione
    if (memberFilter && memberFilter.trim() !== '') {
      // Ordina per ore decrescenti ma mostra tutti gli stream del membro
      streamEntries.sort((a, b) => b.hours - a.hours);
      var streamDistribution = streamEntries;
    } else {
      // Logica normale: ordina per ore decrescenti e prendi i top 8
      streamEntries.sort((a, b) => b.hours - a.hours);
      const topStreams = streamEntries.slice(0, 8);
      const minorStreams = streamEntries.slice(8);

      var streamDistribution = [...topStreams];
      
      // Se ci sono stream minori, aggregali in "Altri"
      if (minorStreams.length > 0) {
        const othersHours = minorStreams.reduce((sum, stream) => sum + stream.hours, 0);
        const othersProjects = minorStreams.reduce((sum, stream) => sum + stream.projects, 0);
        
        streamDistribution.push({
          stream: 'Altri',
          hours: othersHours,
          projects: othersProjects,
          color: '#9CA3AF' // Grigio per "Altri"
        });
      }
    }

    // Calcola top 5 progetti per ore
    const topProjects = dateFilteredProjects
      .sort((a, b) => b.neededHours - a.neededHours)
      .slice(0, 5)
      .map(project => ({
        name: project.name,
        hours: project.neededHours,
        stream: project.stream,
        member: project.teamMember,
        color: STREAM_COLORS[project.stream] || STREAM_COLORS.default
      }));

    return {
      timeline,
      teamMembers,
      totalTeamHours,
      totalTeamProjects,
      teamWorkPressure,
      statusDistribution,
      priorityDistribution,
      typeDistribution,
      streamDistribution,
      topProjects
    };
  };

  // Inizializza con dati vuoti e carica dati salvati
  useEffect(() => {
    const savedData = localStorage.getItem('team-dashboard-data');
    const savedCsv = localStorage.getItem('team-dashboard-csv');
    const savedLastUpdate = localStorage.getItem('team-dashboard-lastUpdate');
    
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
  
  // Re-processa i dati quando cambiano i filtri
  useEffect(() => {
    if (csvData) {
      try {
        const newData = processCSV(csvData, dateRange, selectedTeamMember);
        setDashboardData(newData);
      } catch (err) {
        console.error('Errore nel processamento CSV:', err);
        setError('Errore nel processamento dei dati');
      }
    }
  }, [csvData, dateRange, selectedTeamMember]);

  // Funzione per gestire il caricamento del file CSV
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        const processedData = processCSV(csvContent, dateRange, selectedTeamMember);
        
        setDashboardData(processedData);
        setCsvData(csvContent);
        
        const now = new Date().toLocaleString('it-IT');
        setLastUpdate(now);
        
        // Salva dati nel localStorage
        localStorage.setItem('team-dashboard-data', JSON.stringify(processedData));
        localStorage.setItem('team-dashboard-csv', csvContent);
        localStorage.setItem('team-dashboard-lastUpdate', now);
        
        console.log('Dati processati e salvati con successo');
      } catch (err) {
        console.error('Errore nel caricamento file:', err);
        setError('Errore nel caricamento del file CSV. Verifica il formato.');
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Errore nella lettura del file');
      setIsLoading(false);
    };

    reader.readAsText(file);
  };

  // Componente Gauge per la pressione di lavoro
  const WorkPressureGauge = ({ value, maxValue = 150, size = 120, title }: { 
    value: number; 
    maxValue?: number; 
    size?: number; 
    title: string;
  }) => {
    // Calcola la percentuale reale del valore rispetto al range 0-maxValue
    const valuePercentage = Math.min((value / maxValue) * 100, 100);
    
    // L'arco va da -90° a +90° (180° totali)
    // 0% = -90°, 100% = +90°
    const needleAngle = -90 + (valuePercentage / 100) * 180;
    
    const getColor = (val: number) => {
      if (val < 80) return '#10B981'; // Verde (sotto 80%)
      if (val <= 100) return '#F59E0B'; // Giallo (80-100%)
      return '#EF4444'; // Rosso (sopra 100%)
    };

    const radius = size / 2 - 20;
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Calcola la lunghezza dell'arco da colorare
    const arcLength = (valuePercentage / 100) * Math.PI * radius;
    const totalArcLength = Math.PI * radius;

    return (
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
          {/* Sfondo gauge - arco completo grigio */}
          <svg width={size} height={size / 2 + 20} className="absolute">
            {/* Arco di sfondo */}
            <path
              d={`M 20 ${centerY} A ${radius} ${radius} 0 0 1 ${size - 20} ${centerY}`}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="8"
              strokeLinecap="round"
            />
            
            {/* Arco colorato - deve partire da sinistra */}
            <path
              d={`M 20 ${centerY} A ${radius} ${radius} 0 0 1 ${size - 20} ${centerY}`}
              fill="none"
              stroke={getColor(value)}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${arcLength} ${totalArcLength}`}
              strokeDashoffset="0"
            />
          </svg>
          
          {/* Ago - ruotato dall'angolo calcolato */}
          <div 
            className="absolute bg-gray-800 origin-bottom rounded-full"
            style={{
              width: '2px',
              height: radius - 15,
              left: centerX - 1,
              bottom: 20,
              transform: `rotate(${needleAngle}deg)`,
              transformOrigin: 'bottom center'
            }}
          />
          
          {/* Centro - punto di rotazione */}
          <div 
            className="absolute w-4 h-4 bg-gray-800 rounded-full border-2 border-white"
            style={{
              left: centerX - 8,
              bottom: 12
            }}
          />
        </div>
        
        <div className="text-center mt-2">
          <div className="text-sm font-medium text-gray-900">{title}</div>
          <div className="text-xs text-gray-600">
            {Math.round(value)}% {value > 150 ? '(Max 150%)' : value > 100 ? '(Overtime)' : ''}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Ore effettive / Ore disponibili
          </div>
        </div>
      </div>
    );
  };

  // Componente per i filtri
  const FilterPanel = () => (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtri:</span>
        </div>
        
        {/* Filtro data */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <label className="text-sm text-gray-600">Dal:</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          />
          <label className="text-sm text-gray-600">Al:</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          />
        </div>
        
        {/* Filtro membro del team */}
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-500" />
          <label className="text-sm text-gray-600">Membro:</label>
          <select
            value={selectedTeamMember}
            onChange={(e) => setSelectedTeamMember(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="">Tutti</option>
            {dashboardData?.teamMembers.map(member => (
              <option key={member.name} value={member.name}>
                {member.name}
              </option>
            ))}
          </select>
          {selectedTeamMember && (
            <button
              onClick={() => setSelectedTeamMember('')}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const hasData = dashboardData && (dashboardData.totalTeamHours > 0 || dashboardData.teamMembers.length > 0);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Caricamento...</div>;
  }

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
              Team Dashboard
            </h1>
            <div>
              <button
                onClick={() => setShowDownloadModal(true)}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-md"
              >
                <Download className="w-4 h-4" />
                Scarica App
              </button>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-4">Dashboard di gestione progetti e allocazione risorse del team</p>
          {lastUpdate && (
            <p className="text-xs text-gray-500">
              Ultimo aggiornamento: {lastUpdate}
            </p>
          )}
        </div>

        {!hasData ? (
          // Stato vuoto
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Carica dati del team
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                Carica un file CSV con i dati dei progetti per visualizzare la dashboard
              </p>
              <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Seleziona file CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {error && (
                <p className="text-red-600 text-sm mt-4">{error}</p>
              )}
              <p className="text-center text-gray-500 text-sm mt-3">
                Carica un file CSV per visualizzare progetti, timeline e allocazioni del team
              </p>
            </div>
          </div>
        ) : (
          // Dashboard con dati
          <div className="space-y-6">
            {/* Panel filtri */}
            <FilterPanel />

            {/* Riga 1: Statistiche Generali + Pressione Team */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Statistics Card - Espansa */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  Statistiche Generali
                </h3>
                
                {/* Statistiche Base */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{dashboardData.totalTeamProjects}</div>
                    <div className="text-sm text-gray-600">Progetti Totali</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{dashboardData.totalTeamHours}</div>
                    <div className="text-sm text-gray-600">Ore Totali</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{dashboardData.teamMembers.length}</div>
                    <div className="text-sm text-gray-600">Membri Team</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{dashboardData.streamDistribution.length}</div>
                    <div className="text-sm text-gray-600">Stream Attivi</div>
                  </div>
                </div>

                {/* Sezione Avanzata */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Top 5 Stream */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      Top 5 Stream (per ore)
                    </h4>
                    <div className="space-y-2">
                      {dashboardData.streamDistribution
                        .sort((a, b) => b.hours - a.hours)
                        .slice(0, 5)
                        .map((stream, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-500 w-4">#{index + 1}</span>
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: stream.color }}
                              ></div>
                              <span className="text-sm text-gray-700 truncate max-w-[100px]">
                                {stream.stream}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {stream.hours}h
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Top 5 Progetti */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      Top 5 Progetti (per ore)
                    </h4>
                    <div className="space-y-2">
                      {dashboardData.topProjects.map((project, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 w-4">#{index + 1}</span>
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: project.color }}
                            ></div>
                            <span className="text-sm text-gray-700 truncate max-w-[100px]" title={project.name}>
                              {project.name}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {project.hours}h
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Team Members */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      Status Membri Team
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Disponibili (&lt;80%)</span>
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {dashboardData.teamMembers.filter(m => m.workPressure < 80).length}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Occupati (80-100%)</span>
                        </div>
                        <div className="text-lg font-bold text-yellow-600">
                          {dashboardData.teamMembers.filter(m => m.workPressure >= 80 && m.workPressure <= 100).length}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Sovraccarichi (&gt;100%)</span>
                        </div>
                        <div className="text-lg font-bold text-red-600">
                          {dashboardData.teamMembers.filter(m => m.workPressure > 100).length}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Total Gauge */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-orange-500" />
                  Pressione Team
                </h3>
                <div className="flex justify-center">
                  <WorkPressureGauge
                    value={dashboardData.teamWorkPressure}
                    maxValue={150}
                    size={180}
                    title="Carico Team Totale"
                  />
                </div>
                <div className="mt-4 text-center text-sm text-gray-600">
                  <div>Ore totali: {dashboardData.totalTeamHours}</div>
                  <div>Progetti totali: {dashboardData.totalTeamProjects}</div>
                  <div className="text-xs mt-2 text-gray-500">
                    <div>Pressione calcolata su:</div>
                    <div>8h/giorno × 5 giorni/sett. × {dashboardData.teamMembers.length} membri</div>
                    <div>nel periodo {dashboardData.timeline[0]?.month} - {dashboardData.timeline[dashboardData.timeline.length - 1]?.month}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Riga 2: Timeline ore per stream */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Timeline Ore per Stream
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(1)}h`, 
                      name
                    ]}
                    labelFormatter={(label) => `Mese: ${label}`}
                  />
                  <Legend />
                  {/* Barra per ogni stream */}
                  {Object.keys(dashboardData.timeline[0]?.streamData || {}).map((stream) => (
                    <Bar
                      key={stream}
                      dataKey={stream}
                      fill={STREAM_COLORS[stream] || STREAM_COLORS.default}
                      name={stream}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Riga 3: Timeline progetti per mese */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-500" />
                Timeline Progetti per Mese
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={dashboardData.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalProjects" fill="#10B981" name="Progetti" />
                  <Line 
                    type="monotone" 
                    dataKey="totalProjects" 
                    stroke="#DC2626" 
                    strokeWidth={3}
                    dot={{ fill: '#DC2626', strokeWidth: 2, r: 4 }}
                    name="Tendenza Progetti"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Riga 4: Tutti i grafici a torta */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Status Distribution */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-blue-500" />
                  Stati Progetti
                </h4>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={Object.entries(dashboardData.statusDistribution).map(([status, count]) => ({
                        name: status,
                        value: count
                      }))}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {Object.keys(dashboardData.statusDistribution).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Priority Distribution */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-red-500" />
                  Priorità Progetti
                </h4>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={Object.entries(dashboardData.priorityDistribution).map(([priority, count]) => ({
                        name: priority,
                        value: count
                      }))}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {Object.keys(dashboardData.priorityDistribution).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 60 + 20}, 70%, 60%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Stream Distribution */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-purple-500" />
                  Distribuzione Stream
                </h4>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={dashboardData.streamDistribution.map(stream => ({
                        name: stream.stream,
                        value: stream.projects
                      }))}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {dashboardData.streamDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Type Distribution */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-orange-500" />
                  Tipi Progetti
                </h4>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={Object.entries(dashboardData.typeDistribution).map(([type, count]) => ({
                        name: type,
                        value: count
                      }))}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {Object.keys(dashboardData.typeDistribution).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 80 + 40}, 70%, 60%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Team Members Cards - sotto tutto */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                Membri del Team
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardData.teamMembers.map((member) => (
                  <div 
                    key={member.name} 
                    className={`bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl hover:scale-105 ${
                      selectedTeamMember === member.name 
                        ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-blue-100' 
                        : 'hover:shadow-xl'
                    }`}
                    onClick={() => setSelectedTeamMember(
                      selectedTeamMember === member.name ? '' : member.name
                    )}
                  >
                    {/* Header con avatar e info base */}
                    <div className="flex items-center gap-4 mb-6">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                          <svg 
                            className="w-8 h-8 text-white" 
                            fill="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        </div>
                      </div>
                      
                      {/* Info personali */}
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg mb-1">
                          {member.name}
                        </h4>
                        <div className="text-sm text-gray-500 mb-2">
                          Senior Developer
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            {member.totalProjects} progetti
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            {member.totalHours}h totali
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Gauge centrale - più prominente */}
                    <div className="mb-6 bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-center">
                        <WorkPressureGauge
                          value={member.workPressure}
                          maxValue={150}
                          size={140}
                          title="Carico di Lavoro"
                        />
                      </div>
                    </div>
                    
                    {/* Stream distribution - ridisegnata */}
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-3">Distribuzione Stream</div>
                      <div className="space-y-2">
                        {member.streams.slice(0, 3).map((stream, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: stream.color }}
                              ></div>
                              <span className="text-xs text-gray-600 truncate max-w-[120px]">
                                {stream.stream}
                              </span>
                            </div>
                            <div className="text-xs font-medium text-gray-800">
                              {stream.projects}p
                            </div>
                          </div>
                        ))}
                        {member.streams.length > 3 && (
                          <div className="text-xs text-gray-500 text-center pt-1">
                            +{member.streams.length - 3} altri stream
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Footer con statistiche */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-blue-600">
                            {Math.round(member.totalHours / member.totalProjects)}h
                          </div>
                          <div className="text-xs text-gray-500">Media/Progetto</div>
                        </div>
                        <div>
                          <div className={`text-lg font-bold ${
                            member.workPressure > 100 ? 'text-red-600' : 
                            member.workPressure > 80 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {member.workPressure > 100 ? 'Sovraccarico' : 
                             member.workPressure > 80 ? 'Occupato' : 'Disponibile'}
                          </div>
                          <div className="text-xs text-gray-500">Status</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload new data button */}
            <div className="text-center">
              <label className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                <Upload className="w-5 h-5 mr-2" />
                Carica nuovi dati CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {error && (
                <p className="text-red-600 text-sm mt-2">{error}</p>
              )}
            </div>
          </div>
        )}

        {/* Download Modal */}
        <DownloadSection 
          isOpen={showDownloadModal} 
          onClose={() => setShowDownloadModal(false)} 
        />
      </div>
    </div>
  );
};

export default Dashboard;
