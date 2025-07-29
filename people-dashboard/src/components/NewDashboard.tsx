import { useState, useEffect } from 'react';
import { Users, Clock, Building2, Upload, AlertCircle, CheckCircle, XCircle, Pause, Download, Calendar, User, TrendingUp, BarChart3, PieChart as PieChartIcon, Gauge, Filter, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
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
  'default': '#6B7280'
};

// Ore lavorative annuali (aprile-marzo)
const ANNUAL_WORK_HOURS = 1920; // ~40 ore/settimana * 48 settimane

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
    streamDistribution: []
  };

  // Funzione per parsare la data in formato DD/MM/YY
  const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const [day, month, year] = dateStr.split('/');
    const fullYear = parseInt(year) + (parseInt(year) > 50 ? 1900 : 2000);
    return new Date(fullYear, parseInt(month) - 1, parseInt(day));
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
    
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    
    return startDate <= monthEnd && endDate >= monthStart;
  };

  // Funzione per processare i dati CSV
  const processCSV = (csvContent: string, dateFilter: { start: string; end: string }, memberFilter: string): DashboardData => {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(';');
    
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
        const monthsActive = Math.max(1, Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (30 * 24 * 60 * 60 * 1000)));
        return sum + (project.neededHours / monthsActive);
      }, 0);
      
      // Raggruppa per stream
      activeProjects.forEach(project => {
        if (!month.streamData[project.stream]) {
          month.streamData[project.stream] = 0;
        }
        const projectStart = parseDate(project.startDate);
        const projectEnd = parseDate(project.deliveryDeadline);
        const monthsActive = Math.max(1, Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (30 * 24 * 60 * 60 * 1000)));
        month.streamData[project.stream] += project.neededHours / monthsActive;
      });
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
      
      member.streams = Array.from(streamMap.entries()).map(([stream, data]) => ({
        stream,
        hours: data.hours,
        projects: data.projects,
        color: STREAM_COLORS[stream] || STREAM_COLORS.default
      }));
      
      member.workPressure = (member.totalHours / ANNUAL_WORK_HOURS) * 100;
    });

    const teamMembers = Array.from(teamMemberMap.values());
    
    // Calcola totali team
    const totalTeamHours = teamMembers.reduce((sum, member) => sum + member.totalHours, 0);
    const totalTeamProjects = teamMembers.reduce((sum, member) => sum + member.totalProjects, 0);
    const totalTeamWorkHours = teamMembers.length * ANNUAL_WORK_HOURS;
    const teamWorkPressure = (totalTeamHours / totalTeamWorkHours) * 100;

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

    const streamDistribution = Array.from(streamMap.entries()).map(([stream, data]) => ({
      stream,
      hours: data.hours,
      projects: data.projects,
      color: STREAM_COLORS[stream] || STREAM_COLORS.default
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
      streamDistribution
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
  const WorkPressureGauge = ({ value, maxValue = 100, size = 120, title }: { 
    value: number; 
    maxValue?: number; 
    size?: number; 
    title: string;
  }) => {
    const percentage = Math.min((value / maxValue) * 100, 150); // Permette di andare oltre il 100%
    const rotation = (percentage / 100) * 180 - 90; // Da -90 a +90 gradi
    
    const getColor = (perc: number) => {
      if (perc <= 70) return '#10B981'; // Verde
      if (perc <= 90) return '#F59E0B'; // Giallo
      if (perc <= 110) return '#EF4444'; // Rosso
      return '#7C2D12'; // Rosso scuro per overtime
    };

    return (
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
          {/* Sfondo gauge */}
          <svg width={size} height={size / 2 + 20} className="absolute">
            <path
              d={`M 20 ${size / 2} A ${size / 2 - 20} ${size / 2 - 20} 0 0 1 ${size - 20} ${size / 2}`}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="8"
            />
            {/* Arco colorato */}
            <path
              d={`M 20 ${size / 2} A ${size / 2 - 20} ${size / 2 - 20} 0 0 1 ${size - 20} ${size / 2}`}
              fill="none"
              stroke={getColor(percentage)}
              strokeWidth="8"
              strokeDasharray={`${(percentage / 100) * Math.PI * (size / 2 - 20)} ${Math.PI * (size / 2 - 20)}`}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </svg>
          
          {/* Ago */}
          <div 
            className="absolute w-1 bg-gray-800 origin-bottom"
            style={{
              height: size / 2 - 30,
              left: size / 2 - 0.5,
              bottom: 20,
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'bottom center'
            }}
          />
          
          {/* Centro */}
          <div 
            className="absolute w-3 h-3 bg-gray-800 rounded-full"
            style={{
              left: size / 2 - 6,
              bottom: 14
            }}
          />
        </div>
        
        <div className="text-center mt-2">
          <div className="text-sm font-medium text-gray-900">{title}</div>
          <div className="text-xs text-gray-600">
            {Math.round(value)}% {value > 100 && '(Overtime)'}
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

            {/* Timeline Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Timeline ore per stream */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Timeline Ore per Stream
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {Object.keys(dashboardData.timeline[0]?.streamData || {}).map((stream, index) => (
                      <Line
                        key={stream}
                        type="monotone"
                        dataKey={`streamData.${stream}`}
                        stroke={STREAM_COLORS[stream] || STREAM_COLORS.default}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Timeline progetti per mese */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-500" />
                  Timeline Progetti per Mese
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalProjects" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Team Members Section */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Team Members Cards */}
              <div className="xl:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  Membri del Team
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashboardData.teamMembers.map((member) => (
                    <div 
                      key={member.name} 
                      className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all ${
                        selectedTeamMember === member.name 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:shadow-lg'
                      }`}
                      onClick={() => setSelectedTeamMember(
                        selectedTeamMember === member.name ? '' : member.name
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {member.name}
                        </h4>
                        <div className="text-xs text-gray-500">
                          {member.totalProjects} progetti
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {/* Mini pie chart per stream */}
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Stream Distribution</div>
                          <ResponsiveContainer width="100%" height={80}>
                            <PieChart>
                              <Pie
                                data={member.streams}
                                dataKey="projects"
                                cx="50%"
                                cy="50%"
                                innerRadius={15}
                                outerRadius={35}
                                paddingAngle={2}
                              >
                                {member.streams.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value, name) => [value, name]} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        
                        {/* Mini gauge per work pressure */}
                        <div>
                          <WorkPressureGauge
                            value={member.workPressure}
                            maxValue={100}
                            size={80}
                            title="Carico Lavoro"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-3 text-xs text-gray-600">
                        Totale ore: {member.totalHours}
                      </div>
                    </div>
                  ))}
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
                    maxValue={100}
                    size={180}
                    title="Carico Team Totale"
                  />
                </div>
                <div className="mt-4 text-center text-sm text-gray-600">
                  <div>Ore totali: {dashboardData.totalTeamHours}</div>
                  <div>Progetti totali: {dashboardData.totalTeamProjects}</div>
                </div>
              </div>

              {/* Distribution Charts */}
              <div className="space-y-4">
                {/* Status Distribution */}
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-blue-500" />
                    Stati Progetti
                  </h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={Object.entries(dashboardData.statusDistribution).map(([status, count]) => ({
                          name: status,
                          value: count
                        }))}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        paddingAngle={2}
                      >
                        {Object.keys(dashboardData.statusDistribution).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Priority Distribution */}
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-red-500" />
                    Priorità Progetti
                  </h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={Object.entries(dashboardData.priorityDistribution).map(([priority, count]) => ({
                          name: priority,
                          value: count
                        }))}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        paddingAngle={2}
                      >
                        {Object.keys(dashboardData.priorityDistribution).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 60 + 20}, 70%, 60%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Statistics Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Statistiche Generali
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
