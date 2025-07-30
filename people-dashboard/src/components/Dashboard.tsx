import { useState, useEffect } from 'react';
import { Users, Upload, Download, Calendar, TrendingUp, BarChart3, PieChart as PieChartIcon, Gauge, Filter, X, ChevronDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, XAxis, YAxis, CartesianGrid, BarChart, Bar, ComposedChart, Line } from 'recharts';
import DownloadSection from './DownloadSection';
import { ToastContainer, useToast } from './Toast';

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
  totalTeamWorkHours: number;
  statusDistribution: { [status: string]: number };
  priorityDistribution: { [priority: string]: number };
  typeDistribution: { [type: string]: number };
  streamDistribution: StreamData[]; // Per le statistiche: tutti gli stream reali
  streamDistributionForCharts: StreamData[]; // Per i grafici: con aggregazione "Altri"
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
  // Hook per i toast
  const { toasts, showToast, closeToast } = useToast();
  
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
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [selectedStreams, setSelectedStreams] = useState<string[]>([]);
  
  // State per la card dettagliata del membro
  const [selectedMemberForCard, setSelectedMemberForCard] = useState<string>('');
  
  // State per l'ordinamento della tabella membri
  const [membersSortColumn, setMembersSortColumn] = useState<string>('');
  const [membersSortDirection, setMembersSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // State per il modale download
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  
  // State per l'accordion del Gantt
  const [isGanttExpanded, setIsGanttExpanded] = useState(false);
  
  // State per il filtro quarter
  const [selectedQuarter, setSelectedQuarter] = useState<string>('');
  
  // State per dropdown aperti
  const [isTeamMembersDropdownOpen, setIsTeamMembersDropdownOpen] = useState(false);
  const [isStreamsDropdownOpen, setIsStreamsDropdownOpen] = useState(false);

  // Funzioni helper per i quarter
  const getQuarterOptions = () => {
    return [
      { value: '', label: 'Anno completo' },
      { value: '2025-Q1', label: 'Q1 2025 (Apr-Giu)' },
      { value: '2025-Q2', label: 'Q2 2025 (Lug-Set)' },
      { value: '2025-Q3', label: 'Q3 2025 (Ott-Dic)' },
      { value: '2025-Q4', label: 'Q4 2025 (Gen-Mar 2026)' },
    ];
  };

  const getQuarterDateRange = (quarter: string) => {
    switch (quarter) {
      case '2025-Q1':
        return { start: '2025-04-01', end: '2025-06-30' };
      case '2025-Q2':
        return { start: '2025-07-01', end: '2025-09-30' };
      case '2025-Q3':
        return { start: '2025-10-01', end: '2025-12-31' };
      case '2025-Q4':
        return { start: '2026-01-01', end: '2026-03-31' };
      default:
        return { start: '2025-04-01', end: '2026-03-31' };
    }
  };

  const handleQuarterChange = (quarter: string) => {
    setSelectedQuarter(quarter);
    const dateRange = getQuarterDateRange(quarter);
    setDateRange(dateRange);
  };

  // Dati vuoti di default
  const emptyData: DashboardData = {
    timeline: [],
    teamMembers: [],
    totalTeamHours: 0,
    totalTeamProjects: 0,
    teamWorkPressure: 0,
    totalTeamWorkHours: 0,
    statusDistribution: {},
    priorityDistribution: {},
    typeDistribution: {},
    streamDistribution: [],
    streamDistributionForCharts: [],
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

  // Funzione per calcolare le ore effettive di un progetto in un periodo specifico
  const calculateProjectHoursInPeriod = (project: ProjectData, periodStart: Date, periodEnd: Date): number => {
    const projectStart = parseDate(project.startDate);
    const projectEnd = parseDate(project.deliveryDeadline);
    
    if (!projectStart || !projectEnd || project.neededHours <= 0) {
      return 0;
    }
    
    // Calcola l'overlap effettivo tra il progetto e il periodo
    const overlapStart = new Date(Math.max(projectStart.getTime(), periodStart.getTime()));
    const overlapEnd = new Date(Math.min(projectEnd.getTime(), periodEnd.getTime()));
    
    // Se non c'è overlap, ritorna 0
    if (overlapStart > overlapEnd) {
      return 0;
    }
    
    // Calcola la durata totale del progetto in giorni lavorativi
    const totalProjectDays = calculateWorkingDaysBetween(projectStart, projectEnd);
    
    // Calcola i giorni lavorativi nell'overlap
    const overlapWorkingDays = calculateWorkingDaysBetween(overlapStart, overlapEnd);
    
    // Se non ci sono giorni lavorativi totali, distribuisci uniformemente
    if (totalProjectDays === 0) {
      return project.neededHours;
    }
    
    // Calcola la proporzione di ore per il periodo di overlap
    const hoursProportion = (overlapWorkingDays / totalProjectDays) * project.neededHours;
    
    return Math.max(0, hoursProportion);
  };

  // Funzione per calcolare i giorni lavorativi tra due date (escludi weekend)
  const calculateWorkingDaysBetween = (startDate: Date, endDate: Date): number => {
    let workingDays = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      // 1-5 sono lunedì-venerdì (0 = domenica, 6 = sabato)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDays;
  };

  // Funzione per processare i dati CSV
  const processCSV = (csvContent: string, dateFilter: { start: string; end: string }, memberFilters: string[], streamFilters: string[]): { data: DashboardData; errors: string[] } => {
    try {
      // Validazione input
      if (!csvContent || csvContent.trim() === '') {
        throw new Error('Il contenuto del file CSV è vuoto');
      }

      const lines = csvContent.trim().split('\n');
      
      if (lines.length < 2) {
        throw new Error('Il file CSV deve contenere almeno una riga di intestazione e una di dati');
      }

      // Parsing progetti con validazione
      const projects: ProjectData[] = [];
      const errors: string[] = [];

      lines.slice(1).forEach((line, index) => {
        try {
          const values = line.split(';');
          
          if (values.length < 12) {
            errors.push(`Riga ${index + 2}: numero insufficiente di colonne (trovate ${values.length}, richieste 12)`);
            return;
          }

          const project = {
            name: values[0]?.trim() || '',
            stream: values[1]?.trim() || '',
            teamMember: values[2]?.trim() || '',
            startDate: values[3]?.trim() || '',
            deliveryDeadline: values[4]?.trim() || '',
            status: values[5]?.trim() || '',
            priority: values[6]?.trim() || '',
            groupDriven: values[7]?.trim() || '',
            neededHours: parseInt(values[8]) || 0,
            notes: values[9]?.trim() || '',
            stakeholder: values[10]?.trim() || '',
            type: values[11]?.trim() || ''
          };

          // Validazione campi obbligatori
          if (!project.name) {
            errors.push(`Riga ${index + 2}: nome progetto mancante`);
            return;
          }
          if (!project.teamMember) {
            errors.push(`Riga ${index + 2}: membro del team mancante per progetto "${project.name}"`);
            return;
          }
          if (project.neededHours <= 0) {
            errors.push(`Riga ${index + 2}: ore necessarie non valide per progetto "${project.name}"`);
            return;
          }

          projects.push(project);
        } catch (rowError) {
          errors.push(`Riga ${index + 2}: errore nel parsing - ${rowError instanceof Error ? rowError.message : 'errore sconosciuto'}`);
        }
      });

      // Se ci sono troppi errori, interrompi
      if (errors.length > 0) {
        console.warn('Errori nel parsing CSV:', errors);
        if (errors.length > projects.length / 2) {
          throw new Error(`Troppi errori nel file CSV (${errors.length} errori). Primi errori:\n${errors.slice(0, 5).join('\n')}`);
        }
      }

      if (projects.length === 0) {
        throw new Error('Nessun progetto valido trovato nel file CSV');
      }

      console.log(`Processati ${projects.length} progetti (${errors.length} errori ignorati)`);

      // Validazione filtri
      const validMemberFilters = memberFilters.filter(member => member && member.trim() !== '');
      const validStreamFilters = streamFilters.filter(stream => stream && stream.trim() !== '');

      // Applica filtro membri del team (se vuoto, mostra tutti)
      const memberFilteredProjects = validMemberFilters.length > 0 
        ? projects.filter(p => validMemberFilters.includes(p.teamMember))
        : projects;

      // Applica filtro stream (se vuoto, mostra tutti)
      const filteredProjects = validStreamFilters.length > 0 
        ? memberFilteredProjects.filter(p => validStreamFilters.includes(p.stream))
        : memberFilteredProjects;

      // Debug: Log dei risultati filtri
      console.log('Filtri applicati:', {
        memberFilters: validMemberFilters,
        streamFilters: validStreamFilters,
        totalProjects: projects.length,
        afterMemberFilter: memberFilteredProjects.length,
        afterStreamFilter: filteredProjects.length
      });

      // Verifica se i filtri combinati hanno eliminato tutti i progetti
      if (filteredProjects.length === 0 && (validMemberFilters.length > 0 || validStreamFilters.length > 0)) {
        console.warn('I filtri combinati hanno eliminato tutti i progetti!');
        
        // Verifica quale filtro causa il problema
        if (validMemberFilters.length > 0 && memberFilteredProjects.length === 0) {
          throw new Error(`Nessun progetto trovato per i membri selezionati: ${validMemberFilters.join(', ')}`);
        }
        
        if (validStreamFilters.length > 0 && validMemberFilters.length > 0) {
          // Controlla se il membro ha progetti in altri stream
          const memberProjects = projects.filter(p => validMemberFilters.includes(p.teamMember));
          const memberStreams = [...new Set(memberProjects.map(p => p.stream))];
          
          if (memberStreams.length > 0) {
            throw new Error(`Il membro "${validMemberFilters[0]}" non ha progetti nello stream "${validStreamFilters[0]}". Stream disponibili: ${memberStreams.join(', ')}`);
          }
        }
        
        throw new Error(`Nessun progetto trovato con i filtri combinati. Prova a rimuovere alcuni filtri.`);
      }

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
      month.totalHours = Math.round(activeProjects.reduce((sum, project) => {
        // Calcola l'inizio e la fine del mese corrente
        const monthStart = new Date(month.date.getFullYear(), month.date.getMonth(), 1);
        const monthEnd = new Date(month.date.getFullYear(), month.date.getMonth() + 1, 0);
        
        // Calcola le ore effettive del progetto in questo mese
        const hoursInThisMonth = calculateProjectHoursInPeriod(project, monthStart, monthEnd);
        
        return sum + hoursInThisMonth;
      }, 0) * 10) / 10; // Arrotonda a 1 cifra decimale
      
      // Raggruppa per stream con aggregazione degli stream minori
      const monthStreamMap = new Map<string, number>();
      
      activeProjects.forEach(project => {
        // Calcola l'inizio e la fine del mese corrente
        const monthStart = new Date(month.date.getFullYear(), month.date.getMonth(), 1);
        const monthEnd = new Date(month.date.getFullYear(), month.date.getMonth() + 1, 0);
        
        // Calcola le ore effettive del progetto in questo mese
        const hoursInThisMonth = calculateProjectHoursInPeriod(project, monthStart, monthEnd);
        
        if (!monthStreamMap.has(project.stream)) {
          monthStreamMap.set(project.stream, 0);
        }
        const currentHours = monthStreamMap.get(project.stream)!;
        monthStreamMap.set(project.stream, Math.round((currentHours + hoursInThisMonth) * 10) / 10); // Arrotonda a 1 cifra decimale
      });
      
      // Se ci sono filtri membri attivi, mostra tutti i loro stream senza aggregazione
      if (memberFilters.length > 0) {
        // Mostra tutti gli stream dei membri filtrati
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
          const othersHours = Math.round(minorMonthStreams.reduce((sum, [, hours]) => sum + hours, 0) * 10) / 10; // Arrotonda a 1 cifra decimale
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
      
      // Calcola le ore effettive del progetto nel periodo di filtro
      const effectiveHours = calculateProjectHoursInPeriod(project, startFilterDate, endFilterDate);
      
      member.totalHours = Math.round((member.totalHours + effectiveHours) * 10) / 10; // Arrotonda a 1 cifra decimale
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
        
        // Calcola le ore effettive del progetto nel periodo di filtro
        const effectiveHours = calculateProjectHoursInPeriod(project, startFilterDate, endFilterDate);
        
        streamData.hours = Math.round((streamData.hours + effectiveHours) * 10) / 10; // Arrotonda a 1 cifra decimale
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
        const othersHours = Math.round(minorMemberStreams.reduce((sum, stream) => sum + stream.hours, 0) * 10) / 10; // Arrotonda a 1 cifra decimale
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
    console.log('=== CALCOLO CARICO DI LAVORO ===');
    console.log('Range di filtro selezionato:', {
      startFilterDate: startFilterDate.toLocaleDateString('it-IT'),
      endFilterDate: endFilterDate.toLocaleDateString('it-IT'),
      totalProjects: dateFilteredProjects.length
    });
    
    // Debug: verifica distribuzione ore per alcuni progetti campione
    const sampleProjects = dateFilteredProjects.slice(0, 3);
    console.log('Campione distribuzione ore:');
    sampleProjects.forEach(project => {
      const projectStart = parseDate(project.startDate);
      const projectEnd = parseDate(project.deliveryDeadline);
      const effectiveHours = calculateProjectHoursInPeriod(project, startFilterDate, endFilterDate);
      
      console.log(`- ${project.name}:`, {
        totalHours: project.neededHours,
        effectiveHours: effectiveHours.toFixed(1),
        startDate: projectStart?.toLocaleDateString('it-IT'),
        endDate: projectEnd?.toLocaleDateString('it-IT'),
        percentage: ((effectiveHours / project.neededHours) * 100).toFixed(1) + '%'
      });
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
      member.workPressure = Math.min(rawPressure, 200);
      console.log(`${member.name}: ${member.totalHours.toFixed(1)}h / ${finalAvailableHours}h = ${rawPressure.toFixed(1)}% (cap: ${member.workPressure.toFixed(1)}%)`);
    });

    const teamMembers = Array.from(teamMemberMap.values());
    
    // Calcola totali team
    const totalTeamHours = Math.round(teamMembers.reduce((sum, member) => sum + member.totalHours, 0) * 10) / 10; // Arrotonda a 1 cifra decimale
    const totalTeamProjects = teamMembers.reduce((sum, member) => sum + member.totalProjects, 0);
    const totalTeamWorkHours = teamMembers.length * finalAvailableHours;
    const teamWorkPressure = Math.min((totalTeamHours / totalTeamWorkHours) * 100, 200);

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
      
      // Calcola le ore effettive del progetto nel periodo di filtro
      const effectiveHours = calculateProjectHoursInPeriod(project, startFilterDate, endFilterDate);
      
      streamData.hours = Math.round((streamData.hours + effectiveHours) * 10) / 10; // Arrotonda a 1 cifra decimale
      streamData.projects += 1;
    });

    // STREAM DISTRIBUTION per STATISTICHE: mostra SEMPRE tutti gli stream reali (senza aggregazione)
    const allStreamEntries = Array.from(streamMap.entries()).map(([stream, data]) => ({
      stream,
      hours: data.hours,
      projects: data.projects,
      color: STREAM_COLORS[stream] || STREAM_COLORS.default
    })).sort((a, b) => b.hours - a.hours);

    // Per le statistiche usiamo tutti gli stream reali
    const streamDistribution = [...allStreamEntries];

    // STREAM DISTRIBUTION per GRAFICI: mantiene l'aggregazione "Altri" per migliore visualizzazione
    let streamDistributionForCharts;
    if (memberFilters.length > 0) {
      // Per membri specifici: mostra tutti i loro stream
      streamDistributionForCharts = [...allStreamEntries];
    } else {
      // Per vista globale: aggrega gli stream minori in "Altri" solo per i grafici
      const topStreamsForCharts = allStreamEntries.slice(0, 8);
      const minorStreamsForCharts = allStreamEntries.slice(8);

      streamDistributionForCharts = [...topStreamsForCharts];
      
      // Aggrega stream minori in "Altri" solo per i grafici
      if (minorStreamsForCharts.length > 0) {
        const othersHours = Math.round(minorStreamsForCharts.reduce((sum, stream) => sum + stream.hours, 0) * 10) / 10; // Arrotonda a 1 cifra decimale
        const othersProjects = minorStreamsForCharts.reduce((sum, stream) => sum + stream.projects, 0);
        
        streamDistributionForCharts.push({
          stream: 'Altri',
          hours: othersHours,
          projects: othersProjects,
          color: '#9CA3AF'
        });
      }
    }

    // Calcola top 5 progetti per ore effettive nel periodo di filtro
    const projectsWithEffectiveHours = dateFilteredProjects.map(project => ({
      ...project,
      effectiveHours: Math.round(calculateProjectHoursInPeriod(project, startFilterDate, endFilterDate) * 10) / 10 // Arrotonda a 1 cifra decimale
    }));

    const topProjects = projectsWithEffectiveHours
      .sort((a, b) => b.effectiveHours - a.effectiveHours)
      .slice(0, 5)
      .map(project => ({
        name: project.name,
        hours: project.effectiveHours,
        stream: project.stream,
        member: project.teamMember,
        color: STREAM_COLORS[project.stream] || STREAM_COLORS.default
      }));

    return {
      data: {
        timeline,
        teamMembers,
        totalTeamHours,
        totalTeamProjects,
        teamWorkPressure,
        totalTeamWorkHours,
        statusDistribution,
        priorityDistribution,
        typeDistribution,
        streamDistribution, // Per le statistiche: tutti gli stream reali
        streamDistributionForCharts, // Per i grafici: con aggregazione "Altri"
        topProjects
      },
      errors
    };
    } catch (error) {
      console.error('Errore nel processamento CSV:', error);
      throw new Error(`Errore nel processamento dei dati CSV: ${error instanceof Error ? error.message : 'errore sconosciuto'}`);
    }
  };

  // Inizializza con dati vuoti e carica dati salvati
  useEffect(() => {
    const savedData = localStorage.getItem('team-dashboard-data');
    const savedCsv = localStorage.getItem('team-dashboard-csv');
    const savedLastUpdate = localStorage.getItem('team-dashboard-lastUpdate');
    
    if (savedData && savedCsv) {
      try {
        const parsedData = JSON.parse(savedData);
        // Assicurati che tutti i campi necessari siano presenti
        const completeData = {
          ...emptyData,
          ...parsedData,
          // Assicurati che questi array esistano sempre
          topProjects: parsedData.topProjects || [],
          streamDistribution: parsedData.streamDistribution || [],
          streamDistributionForCharts: parsedData.streamDistributionForCharts || parsedData.streamDistribution || [],
          timeline: parsedData.timeline || [],
          teamMembers: parsedData.teamMembers || []
        };
        setDashboardData(completeData);
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
        const result = processCSV(csvData, dateRange, selectedTeamMembers, selectedStreams);
        setDashboardData(result.data);
        setError(null);
      } catch (err) {
        console.error('Errore nel ri-processamento dati:', err);
        const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto nel processamento dei dati';
        
        // Per errori specifici sui filtri, mostra un messaggio più dettagliato con toast
        if (errorMessage.includes('Stream disponibili:') || errorMessage.includes('non ha progetti nello stream')) {
          // Mostra toast per errori di filtri incompatibili
          if (errorMessage.includes('Stream disponibili:')) {
            const streamPart = errorMessage.split('Stream disponibili: ')[1];
            showToast({
              type: 'warning',
              title: 'Filtri incompatibili',
              message: `Il membro selezionato non ha progetti nello stream scelto. Stream disponibili: ${streamPart}`,
              duration: 8000,
              action: {
                label: 'Rimuovi filtro stream',
                onClick: () => setSelectedStreams([])
              }
            });
          } else {
            showToast({
              type: 'warning', 
              title: 'Filtri incompatibili',
              message: errorMessage,
              duration: 6000
            });
          }
          
          // Non fare fallback automatico per questi errori, lascia che l'utente scelga
          try {
            const fallbackResult = processCSV(csvData, dateRange, selectedTeamMembers, []); // Rimuovi solo filtro stream
            setDashboardData(fallbackResult.data);
          } catch (fallbackError) {
            // Se anche senza stream filter non funziona, rimuovi tutti i filtri
            try {
              const fullFallbackResult = processCSV(csvData, dateRange, [], []);
              setDashboardData(fullFallbackResult.data);
            } catch (finalError) {
              setError('Errore critico nel processamento dei dati. Ricaricare la pagina.');
            }
          }
        } else {
          // Per altri errori, usa il fallback standard
          
          try {
            const fallbackResult = processCSV(csvData, dateRange, [], []);
            setDashboardData(fallbackResult.data);
          } catch (fallbackError) {
            setError('Errore critico nel processamento dei dati. Ricaricare la pagina.');
          }
        }
      }
    }
  }, [csvData, dateRange, selectedTeamMembers, selectedStreams]);

  // Funzione per gestire il clic sulla timeline
  const handleTimelineClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const clickedMonth = data.activePayload[0].payload;
      if (clickedMonth.date) {
        const selectedDate = new Date(clickedMonth.date);
        
        // Calcola primo e ultimo giorno del mese selezionato
        const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        
        // Aggiorna il filtro date
        setDateRange({
          start: firstDay.toISOString().split('T')[0],
          end: lastDay.toISOString().split('T')[0]
        });
        
        console.log(`Timeline: selezionato mese ${clickedMonth.month}, periodo: ${firstDay.toLocaleDateString()} - ${lastDay.toLocaleDateString()}`);
      }
    }
  };

  // Funzione per gestire il caricamento del file CSV
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset errori precedenti
    setError(null);
    setIsLoading(true);

    // Validazione file
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Il file deve essere in formato CSV (.csv)');
      setIsLoading(false);
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limite
      setError('Il file è troppo grande. Dimensione massima: 10MB');
      setIsLoading(false);
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        
        if (!csvContent || csvContent.trim() === '') {
          throw new Error('Il file CSV è vuoto');
        }

        // Reset filtri quando si carica un nuovo file
        setSelectedTeamMembers([]);
        setSelectedStreams([]);
        setSelectedQuarter('');
        
        console.log('Processamento nuovo file CSV...');
        const result = processCSV(csvContent, dateRange, [], []);
        
        setDashboardData(result.data);
        setCsvData(csvContent);
        
        const now = new Date().toLocaleString('it-IT');
        setLastUpdate(now);
        
        // Salva dati nel localStorage
        localStorage.setItem('team-dashboard-data', JSON.stringify(result.data));
        localStorage.setItem('team-dashboard-csv', csvContent);
        localStorage.setItem('team-dashboard-lastUpdate', now);
        
        console.log(`File caricato con successo: ${result.data.teamMembers.length} membri, ${result.data.totalTeamProjects} progetti`);
        
        // Mostra toast di successo
        showToast({
          type: 'success',
          title: 'File caricato con successo!',
          message: `Processati ${result.data.teamMembers.length} membri e ${result.data.totalTeamProjects} progetti`,
          duration: 4000
        });
        
        // Se ci sono errori nel parsing, mostra anche un toast di warning
        if (result.errors.length > 0) {
          const maxErrorsToShow = 5;
          const errorList = result.errors.slice(0, maxErrorsToShow).join('\n');
          const moreErrors = result.errors.length > maxErrorsToShow ? `\n... e altri ${result.errors.length - maxErrorsToShow} errori` : '';
          
          showToast({
            type: 'warning',
            title: `${result.errors.length} progetti non caricati`,
            message: `Alcuni progetti hanno valori non validi e sono stati ignorati:\n\n${errorList}${moreErrors}`,
            duration: 8000,
            action: {
              label: 'Vedi tutti gli errori',
              onClick: () => {
                console.group('🚨 Errori nel caricamento CSV:');
                result.errors.forEach((error, index) => {
                  console.warn(`${index + 1}. ${error}`);
                });
                console.groupEnd();
                
                // Mostra un toast con informazioni per il debug
                showToast({
                  type: 'info',
                  title: 'Debug errori CSV',
                  message: `Lista completa di ${result.errors.length} errori salvata nella console del browser (F12)`,
                  duration: 5000
                });
              }
            }
          });
        }
        
        // Reset del file input per permettere ricaricamento dello stesso file
        event.target.value = '';
        
      } catch (err) {
        console.error('Errore nel caricamento file:', err);
        const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto nel caricamento del file';
        setError(`Errore nel caricamento del file CSV: ${errorMessage}`);
        
        // Mostra toast di errore
        showToast({
          type: 'error',
          title: 'Errore nel caricamento file',
          message: errorMessage,
          duration: 6000
        });
        
        // Reset del file input
        event.target.value = '';
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Errore nella lettura del file. Riprovare.');
      setIsLoading(false);
      event.target.value = '';
    };

    // Timeout per evitare che il caricamento si blocchi
    const timeout = setTimeout(() => {
      reader.abort();
      setError('Timeout nel caricamento del file. Il file potrebbe essere troppo grande o corrotto.');
      setIsLoading(false);
    }, 30000); // 30 secondi

    reader.readAsText(file);
    
    // Pulisci il timeout se il caricamento termina prima
    reader.addEventListener('loadend', () => {
      clearTimeout(timeout);
    });
  };

  // Componente Gauge per la pressione di lavoro
  const WorkPressureGauge = ({ value, maxValue = 200, size = 120, title }: { 
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
            {Math.round(value)}% {value > 200 ? '(Max 200%)' : value > 100 ? '(Overtime)' : ''}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Ore effettive / Ore disponibili
          </div>
        </div>
      </div>
    );
  };

  // Componente per i filtri
  const FilterPanel = () => {
    // Verifica se è stato selezionato un singolo mese
    const isMonthFilter = () => {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      const startOfMonth = new Date(start.getFullYear(), start.getMonth(), 1);
      const endOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      
      return start.getTime() === startOfMonth.getTime() && 
             end.getTime() === endOfMonth.getTime();
    };

    const resetToFullRange = () => {
      setDateRange({
        start: '2025-04-01',
        end: '2026-03-31'
      });
    };

    const clearAllFilters = () => {
      const hadFilters = selectedTeamMembers.length > 0 || selectedStreams.length > 0 || selectedQuarter !== '';
      
      setDateRange({
        start: '2025-04-01',
        end: '2026-03-31'
      });
      setSelectedTeamMembers([]);
      setSelectedQuarter('');
      setSelectedStreams([]);
      
      if (hadFilters) {
        showToast({
          type: 'info',
          title: 'Filtri rimossi',
          message: 'Tutti i filtri sono stati rimossi. Visualizzando tutti i dati.',
          duration: 3000
        });
      }
    };

    // Ottieni tutti i membri unici dai dati CSV
    const getAllMembers = (): string[] => {
      try {
        if (!csvData) return [];
        const lines = csvData.trim().split('\n');
        
        if (lines.length < 2) return [];
        
        const members = new Set<string>();
        
        lines.slice(1).forEach((line, index) => {
          try {
            const values = line.split(';');
            const teamMember = values[2]?.trim();
            if (teamMember && teamMember !== '') {
              members.add(teamMember);
            }
          } catch (error) {
            console.warn(`Errore nel parsing membro alla riga ${index + 2}:`, error);
          }
        });
        
        return Array.from(members).sort();
      } catch (error) {
        console.error('Errore nel recupero membri:', error);
        return [];
      }
    };

    // Ottieni tutti gli stream unici dai dati CSV
    const getAllStreams = (): string[] => {
      try {
        if (!csvData) return [];
        const lines = csvData.trim().split('\n');
        
        if (lines.length < 2) return [];
        
        const streams = new Set<string>();
        
        lines.slice(1).forEach((line, index) => {
          try {
            const values = line.split(';');
            const stream = values[1]?.trim();
            if (stream && stream !== '') {
              streams.add(stream);
            }
          } catch (error) {
            console.warn(`Errore nel parsing stream alla riga ${index + 2}:`, error);
          }
        });
        
        return Array.from(streams).sort();
      } catch (error) {
        console.error('Errore nel recupero stream:', error);
        return [];
      }
    };

    const allMembers = getAllMembers();
    const allStreams = getAllStreams();

    // Toggle member selection
    const toggleMember = (member: string) => {
      try {
        if (!member || member.trim() === '') return;
        
        setSelectedTeamMembers(prev => {
          const updated = prev.includes(member) 
            ? prev.filter(m => m !== member)
            : [...prev, member];
          
          console.log('Membri selezionati aggiornati:', updated);
          
          // Mostra toast informativo se vengono combinati filtri
          if (updated.length > 0 && selectedStreams.length > 0) {
            showToast({
              type: 'info',
              title: 'Filtri combinati applicati',
              message: `Visualizzando dati per membro "${member}" e ${selectedStreams.length} stream selezionat${selectedStreams.length === 1 ? 'o' : 'i'}`,
              duration: 3000
            });
          }
          
          return updated;
        });
      } catch (error) {
        console.error('Errore nel toggle membro:', error);
      }
    };

    // Toggle stream selection
    const toggleStream = (stream: string) => {
      try {
        if (!stream || stream.trim() === '') return;
        
        setSelectedStreams(prev => {
          const updated = prev.includes(stream) 
            ? prev.filter(s => s !== stream)
            : [...prev, stream];
          
          console.log('Stream selezionati aggiornati:', updated);
          return updated;
        });
      } catch (error) {
        console.error('Errore nel toggle stream:', error);
      }
    };

    // Select/Deselect all members
    const toggleAllMembers = () => {
      try {
        const allValidMembers = allMembers.filter(m => m && m.trim() !== '');
        
        if (selectedTeamMembers.length === allValidMembers.length) {
          setSelectedTeamMembers([]);
          console.log('Deselezionati tutti i membri');
        } else {
          setSelectedTeamMembers([...allValidMembers]);
          console.log('Selezionati tutti i membri:', allValidMembers.length);
        }
      } catch (error) {
        console.error('Errore nel toggle tutti i membri:', error);
      }
    };

    // Select/Deselect all streams
    const toggleAllStreams = () => {
      try {
        const allValidStreams = allStreams.filter(s => s && s.trim() !== '');
        
        if (selectedStreams.length === allValidStreams.length) {
          setSelectedStreams([]);
          console.log('Deselezionati tutti gli stream');
        } else {
          setSelectedStreams([...allValidStreams]);
          console.log('Selezionati tutti gli stream:', allValidStreams.length);
        }
      } catch (error) {
        console.error('Errore nel toggle tutti gli stream:', error);
      }
    };

    // Componente Dropdown per Multi-select
    const MultiSelectDropdown = ({ 
      title, 
      selectedItems, 
      allItems, 
      onToggleItem, 
      onToggleAll, 
      isOpen, 
      setIsOpen 
    }: {
      title: string;
      selectedItems: string[];
      allItems: string[];
      onToggleItem: (item: string) => void;
      onToggleAll: () => void;
      isOpen: boolean;
      setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    }) => {
      return (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-left cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                {selectedItems.length === 0 
                  ? `Tutti i ${title.toLowerCase()}` 
                  : selectedItems.length === allItems.length
                  ? `Tutti i ${title.toLowerCase()} (${selectedItems.length})`
                  : `${selectedItems.length} ${title.toLowerCase()} selezionati`
                }
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {isOpen && (
            <>
              {/* Backdrop per chiudere il dropdown */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsOpen(false)}
              />
              
              {/* Dropdown content */}
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {/* Seleziona tutti */}
                <div className="px-3 py-2 border-b border-gray-200">
                  <label className="flex items-center cursor-pointer hover:bg-gray-50 rounded px-2 py-1">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === allItems.length}
                      onChange={onToggleAll}
                      className="mr-2 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      Seleziona tutti ({allItems.length})
                    </span>
                  </label>
                </div>

                {/* Lista items */}
                <div className="py-1">
                  {allItems.map((item) => (
                    <label
                      key={item}
                      className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item)}
                        onChange={() => onToggleItem(item)}
                        className="mr-2 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 truncate" title={item}>
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      );
    };

    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        {/* Prima riga: Range date, Membri, Stream */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Range Date */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Dropdown Membri */}
            <div className="min-w-60">
              {allMembers.length > 0 ? (
                <>
                  <MultiSelectDropdown
                    title="Membri"
                    selectedItems={selectedTeamMembers}
                    allItems={allMembers}
                    onToggleItem={toggleMember}
                    onToggleAll={toggleAllMembers}
                    isOpen={isTeamMembersDropdownOpen}
                    setIsOpen={setIsTeamMembersDropdownOpen}
                  />
                </>
              ) : (
                <div className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500">
                  Nessun membro disponibile
                </div>
              )}
            </div>

            {/* Dropdown Stream */}
            <div className="min-w-60">
              {allStreams.length > 0 ? (
                <>
                  <MultiSelectDropdown
                    title="Stream"
                    selectedItems={selectedStreams}
                    allItems={allStreams}
                    onToggleItem={toggleStream}
                    onToggleAll={toggleAllStreams}
                    isOpen={isStreamsDropdownOpen}
                    setIsOpen={setIsStreamsDropdownOpen}
                  />
                </>
              ) : (
                <div className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500">
                  Nessun stream disponibile
                </div>
              )}
            </div>
          </div>

          {/* Pulsante Reset Range */}
          {isMonthFilter() && (
            <button
              onClick={resetToFullRange}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition-colors"
            >
              Reset a vista completa
            </button>
          )}
        </div>

        {/* Seconda riga: Quarter Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Quarter:</span>
          {getQuarterOptions().map((quarter) => (
            <button
              key={quarter.value}
              onClick={() => handleQuarterChange(quarter.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedQuarter === quarter.value
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              {quarter.label}
            </button>
          ))}
        </div>

        {/* Pulsante Pulisci tutti i filtri */}
        {(selectedTeamMembers.length > 0 || selectedQuarter || selectedStreams.length > 0 || isMonthFilter()) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-sm font-medium"
            >
              <X className="w-4 h-4" />
              Pulisci tutti i filtri
            </button>
          </div>
        )}
      </div>
    );
  };

  // Componente per la sezione membri del team
  const TeamMembersSection = () => {
    const getStatusInfo = (workPressure: number) => {
      if (workPressure > 100) {
        return { status: 'Sovraccarico', color: 'text-red-600', bgColor: 'bg-red-100', dotColor: 'bg-red-500' };
      } else if (workPressure > 80) {
        return { status: 'Occupato', color: 'text-yellow-600', bgColor: 'bg-yellow-100', dotColor: 'bg-yellow-500' };
      } else {
        return { status: 'Disponibile', color: 'text-green-600', bgColor: 'bg-green-100', dotColor: 'bg-green-500' };
      }
    };

    const handleMemberCardClick = (memberName: string) => {
      if (selectedMemberForCard === memberName) {
        // Se clicco di nuovo sulla stessa card, aggiorno la dashboard (applico filtro)
        setSelectedTeamMembers([memberName]);
        setSelectedMemberForCard('');
      } else {
        // Apro la card del membro
        setSelectedMemberForCard(memberName);
      }
    };

    // Funzione per gestire l'ordinamento - usa lo stato globale
    const handleSort = (column: string) => {
      if (membersSortColumn === column) {
        // Se è la stessa colonna, cambia direzione
        setMembersSortDirection(membersSortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        // Se è una nuova colonna, imposta ascendente
        setMembersSortColumn(column);
        setMembersSortDirection('asc');
      }
    };

    // Applica i filtri globali ai membri del team
    const filteredMembers = dashboardData?.teamMembers.filter(member => {
      // Se ci sono filtri membri attivi, mostra solo quei membri
      if (selectedTeamMembers.length > 0) {
        return selectedTeamMembers.includes(member.name);
      }
      // Altrimenti mostra tutti i membri (potrebbero essere già filtrati per data)
      return true;
    }) || [];

    // Applica l'ordinamento - usa lo stato globale
    const sortedMembers = [...filteredMembers].sort((a, b) => {
      if (!membersSortColumn) return 0;

      let aValue: any, bValue: any;

      switch (membersSortColumn) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'status':
          aValue = a.workPressure;
          bValue = b.workPressure;
          break;
        case 'workPressure':
          aValue = a.workPressure;
          bValue = b.workPressure;
          break;
        case 'totalProjects':
          aValue = a.totalProjects;
          bValue = b.totalProjects;
          break;
        case 'totalHours':
          aValue = a.totalHours;
          bValue = b.totalHours;
          break;
        case 'mainStream':
          aValue = a.streams.length > 0 ? a.streams[0].stream.toLowerCase() : '';
          bValue = b.streams.length > 0 ? b.streams[0].stream.toLowerCase() : '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return membersSortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return membersSortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    const selectedMember = sortedMembers.find(m => m.name === selectedMemberForCard);

    // Componente per le intestazioni ordinabili - usa lo stato globale
    const SortableHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
      <th 
        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center justify-between">
          <span>{children}</span>
          <div className="flex flex-col ml-1">
            <svg 
              className={`w-3 h-3 ${membersSortColumn === column && membersSortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`}
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <svg 
              className={`w-3 h-3 ${membersSortColumn === column && membersSortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`}
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </th>
    );

    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-500" />
          Membri del Team
          {selectedTeamMembers.length > 0 && (
            <span className="text-sm text-gray-500 ml-2">
              (Filtrati: {selectedTeamMembers.length})
            </span>
          )}
        </h3>

        {filteredMembers.length === 0 ? (
          // Messaggio quando non ci sono membri da mostrare
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Nessun membro trovato</h4>
            <p className="text-gray-600 text-sm">
              {selectedTeamMembers.length > 0 
                ? `Nessun dato disponibile per i membri selezionati nel periodo selezionato.`
                : 'Nessun membro del team ha progetti nel periodo selezionato.'
              }
            </p>
            {selectedTeamMembers.length > 0 && (
              <button
                onClick={() => setSelectedTeamMembers([])}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Mostra tutti i membri
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Vista tabella */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <SortableHeader column="name">Nome</SortableHeader>
                      <SortableHeader column="status">Status</SortableHeader>
                      <SortableHeader column="workPressure">Carico</SortableHeader>
                      <SortableHeader column="totalProjects">Progetti</SortableHeader>
                      <SortableHeader column="totalHours">Ore Totali</SortableHeader>
                      <SortableHeader column="mainStream">Stream Principale</SortableHeader>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedMembers.map((member) => {
                      const statusInfo = getStatusInfo(member.workPressure);
                      return (
                        <tr 
                          key={member.name}
                          onClick={() => setSelectedMemberForCard(member.name)}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                <div className="text-sm text-gray-500">Senior Developer</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                              <div className={`w-2 h-2 ${statusInfo.dotColor} rounded-full mr-1.5`}></div>
                              {statusInfo.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <span className={`font-medium ${statusInfo.color}`}>
                                {Math.round(member.workPressure)}%
                              </span>
                              <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    member.workPressure > 100 ? 'bg-red-500' : 
                                    member.workPressure > 80 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(member.workPressure, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.totalProjects}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.totalHours.toFixed(1)}h
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.streams.length > 0 ? (
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-full mr-2" 
                                  style={{ backgroundColor: member.streams[0].color }}
                                ></div>
                                <span className="truncate max-w-[120px]">{member.streams[0].stream}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">Nessuno stream</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Pannello laterale scorrevole per i dettagli */}
        {selectedMemberForCard && selectedMember && (
          <>
            {/* Overlay semi-trasparente */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
              onClick={() => setSelectedMemberForCard('')}
              style={{ top: 0, left: 0 }}
            />
            
            {/* Pannello scorrevole da destra */}
            <div 
              className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
                selectedMemberForCard ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-2xl font-bold text-gray-900">Dettagli Membro</h4>
                  <button
                    onClick={() => setSelectedMemberForCard('')}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Header con avatar e info base */}
                  <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-gray-900 text-2xl mb-2">{selectedMember.name}</h5>
                      <div className="text-sm text-gray-600 mb-4">Senior Developer</div>
                      <div className="flex items-center gap-6 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="font-medium">{selectedMember.totalProjects} progetti</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="font-medium">{selectedMember.totalHours.toFixed(1)}h totali</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gauge del carico di lavoro */}
                  <div className="bg-gray-50 rounded-xl p-8">
                    <div className="text-center mb-4">
                      <h6 className="text-lg font-semibold text-gray-800">Carico di Lavoro</h6>
                    </div>
                    <div className="flex justify-center">
                      <WorkPressureGauge
                        value={selectedMember.workPressure}
                        maxValue={200}
                        size={200}
                        title=""
                      />
                    </div>
                  </div>

                  {/* Statistiche rapide */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-6 rounded-xl text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {(selectedMember.totalHours / selectedMember.totalProjects).toFixed(1)}h
                      </div>
                      <div className="text-sm font-medium text-gray-700">Media per Progetto</div>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-xl text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {selectedMember.streams.length}
                      </div>
                      <div className="text-sm font-medium text-gray-700">Stream Attivi</div>
                    </div>
                  </div>

                  {/* Distribuzione stream dettagliata */}
                  <div className="space-y-4">
                    <h6 className="text-lg font-semibold text-gray-800">Distribuzione Stream</h6>
                    <div className="space-y-3">
                      {selectedMember.streams.map((stream, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-5 h-5 rounded-full shadow-sm" 
                              style={{ backgroundColor: stream.color }}
                            ></div>
                            <div>
                              <span className="text-sm font-medium text-gray-900">{stream.stream}</span>
                              <div className="text-xs text-gray-500 mt-1">
                                {stream.projects} progett{stream.projects === 1 ? 'o' : 'i'} • {stream.hours.toFixed(1)} ore
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">{stream.hours.toFixed(1)}h</div>
                            <div className="text-xs text-gray-500">{stream.projects}p</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottoni di azione */}
                  <div className="flex gap-4 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => handleMemberCardClick(selectedMember.name)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      Applica Filtro Dashboard
                    </button>
                    <button
                      onClick={() => setSelectedMemberForCard('')}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      Chiudi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const hasData = dashboardData && (dashboardData.totalTeamHours > 0 || dashboardData.teamMembers.length > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-red-900 mb-2">Errore nella Dashboard</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setError(null);
                  setDashboardData(emptyData);
                }}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mr-2"
              >
                Riprova
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reset Completo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
                  <div className="text-center bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{dashboardData.totalTeamProjects}</div>
                    <div className="text-sm text-gray-600">Progetti Totali</div>
                  </div>
                  <div className="text-center bg-green-50 rounded-lg p-4 border border-green-100">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{dashboardData.totalTeamHours.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Ore Totali</div>
                  </div>
                  <div className="text-center bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">{dashboardData.teamMembers.length}</div>
                    <div className="text-sm text-gray-600">Membri Team</div>
                  </div>
                  <div className="text-center bg-orange-50 rounded-lg p-4 border border-orange-100">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">{dashboardData.streamDistribution.length}</div>
                    <div className="text-sm text-gray-600">Stream Attivi</div>
                  </div>
                </div>

                {/* Sezione Avanzata */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Top 5 Stream */}
                  <div className="md:border-r md:border-gray-200 md:pr-4">
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
                              <span className="text-sm text-gray-700 truncate max-w-[100px]" title={stream.stream}>
                                {stream.stream}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {stream.hours.toFixed(1)}h
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Top 5 Progetti */}
                  <div className="md:border-r md:border-gray-200 md:pr-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      Top 5 Progetti (per ore)
                    </h4>
                    <div className="space-y-2">
                      {(dashboardData.topProjects || []).map((project, index) => (
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
                            {project.hours.toFixed(1)}h
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
                    maxValue={200}
                    size={180}
                    title="Carico Team Totale"
                  />
                </div>
                <div className="mt-4 text-center text-sm text-gray-600">
                  <div>Allocazione ore: {dashboardData.totalTeamHours.toFixed(1)}</div>
                  <div>Ore lavorative disponibili: {dashboardData.totalTeamWorkHours.toFixed(1)}</div>
                  <div>Progetti totali: {dashboardData.totalTeamProjects}</div>
                  <div className="text-xs mt-2 text-gray-500">
                    <div className="text-sm font-bold text-gray-700 mb-1">
                      {(() => {
                        const hoursPerPerson = dashboardData.totalTeamWorkHours / dashboardData.teamMembers.length;
                        const exactResources = dashboardData.totalTeamHours / hoursPerPerson;
                        const requiredResources = Math.ceil(exactResources * 2) / 2; // Arrotonda a 0.5
                        return `${requiredResources.toFixed(1)}/${dashboardData.teamMembers.length} risorse necessarie`;
                      })()}
                    </div>
                    <div>Pressione calcolata su: 8h/giorno × 5 giorni/sett. × {dashboardData.teamMembers.length} membri</div>
                    <div>nel periodo {dashboardData.timeline[0]?.month} - {dashboardData.timeline[dashboardData.timeline.length - 1]?.month}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Riga 2: Gantt Chart degli Stream */}
            <div className="bg-white rounded-lg shadow-md">
              {/* Header cliccabile */}
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors select-none"
                onClick={() => setIsGanttExpanded(!isGanttExpanded)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Gantt Chart degli Stream
                    </h3>
                    <span className="text-xs text-gray-500">
                      (Timeline di attività per stream)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {isGanttExpanded ? 'Nascondi' : 'Mostra'}
                    </span>
                    <ChevronDown 
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                        isGanttExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>
              
              {/* Contenuto espandibile */}
              {isGanttExpanded && (
                <div className="px-6 pb-6 border-t border-gray-100">
                  {/* Gantt Chart Container */}
                  <div className="overflow-x-auto mt-4">
                    <div className="min-w-full">
                      {/* Header con i mesi */}
                      <div className="flex border-b border-gray-200 mb-4">
                        <div className="w-48 py-2 px-4 font-medium text-gray-700 bg-gray-50">
                          Stream
                        </div>
                        <div className="flex-1 flex">
                          {dashboardData.timeline.map((month, index) => (
                            <div 
                              key={index} 
                              className="flex-1 min-w-20 py-2 px-2 text-xs font-medium text-gray-600 text-center bg-gray-50 border-l border-gray-200"
                            >
                              {month.month}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Stream Rows */}
                      <div className="space-y-2">
                        {dashboardData.streamDistribution
                          .sort((a, b) => b.hours - a.hours)
                          .map((stream, streamIndex) => {
                            // Calcola in quali mesi questo stream è attivo
                            const streamActivity = dashboardData.timeline.map(month => ({
                              month: month.month,
                              hours: month.streamData[stream.stream] || 0,
                              hasActivity: (month.streamData[stream.stream] || 0) > 0
                            }));
                            
                            return (
                              <div key={streamIndex} className="flex items-center hover:bg-gray-50 rounded-lg">
                                {/* Stream Name */}
                                <div className="w-48 py-3 px-4 flex items-center gap-3">
                                  <div 
                                    className="w-4 h-4 rounded-full flex-shrink-0" 
                                    style={{ backgroundColor: stream.color }}
                                  ></div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate" title={stream.stream}>
                                      {stream.stream}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {stream.hours.toFixed(1)}h • {stream.projects} progetti
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Timeline Bars */}
                                <div className="flex-1 flex">
                                  {streamActivity.map((activity, monthIndex) => {
                                    const maxHours = Math.max(...dashboardData.timeline.map(m => 
                                      Math.max(...Object.values(m.streamData))
                                    ));
                                    const intensity = activity.hours / maxHours;
                                    
                                    return (
                                      <div 
                                        key={monthIndex}
                                        className="flex-1 min-w-20 py-3 px-2 border-l border-gray-200"
                                      >
                                        {activity.hasActivity && (
                                          <div className="relative group">
                                            <div 
                                              className="h-6 rounded transition-all duration-200 hover:h-8"
                                              style={{ 
                                                backgroundColor: stream.color,
                                                opacity: Math.max(0.3, intensity),
                                                width: `${Math.max(20, intensity * 100)}%`
                                              }}
                                            ></div>
                                            
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                              {activity.month}: {activity.hours.toFixed(1)}h
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                      
                      {/* Legend */}
                      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-2 bg-gray-400 rounded" style={{ opacity: 0.3 }}></div>
                          <span>Bassa attività</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-2 bg-gray-400 rounded" style={{ opacity: 0.6 }}></div>
                          <span>Media attività</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-2 bg-gray-400 rounded" style={{ opacity: 1 }}></div>
                          <span>Alta attività</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Riga 3: Timeline ore per stream */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Timeline Ore per Stream
                <span className="text-xs text-gray-500 ml-2">(Clicca su un mese per filtrare)</span>
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={dashboardData.timeline}
                  onClick={handleTimelineClick}
                  style={{ cursor: 'pointer' }}
                >
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

            {/* Riga 4: Timeline progetti per mese */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-500" />
                Timeline Progetti per Mese
                <span className="text-xs text-gray-500 ml-2">(Clicca su un mese per filtrare)</span>
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart 
                  data={dashboardData.timeline}
                  onClick={handleTimelineClick}
                  style={{ cursor: 'pointer' }}
                >
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

            {/* Riga 5: Tutti i grafici a torta */}
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
                      data={(dashboardData.streamDistributionForCharts || []).map(stream => ({
                        name: stream.stream,
                        value: stream.projects
                      }))}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {(dashboardData.streamDistributionForCharts || []).map((entry, index) => (
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

            {/* Team Members Section - sotto tutto */}
            <TeamMembersSection />

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
        
        {/* Toast Container */}
        <ToastContainer toasts={toasts} onClose={closeToast} />
      </div>
    </div>
  );
};

export default Dashboard;
