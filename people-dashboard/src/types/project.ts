/**
 * Core data types for project management
 */

export interface ProjectData {
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

export interface StreamData {
  stream: string;
  hours: number;
  projects: number;
  color: string;
}

export interface TimelineData {
  month: string;
  date: Date;
  streamData: { [stream: string]: number };
  totalHours: number;
  totalProjects: number;
}

export interface TeamMemberData {
  name: string;
  totalHours: number;
  totalProjects: number;
  streams: StreamData[];
  workPressure: number; // percentuale del carico annuale
}

export interface DashboardData {
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
