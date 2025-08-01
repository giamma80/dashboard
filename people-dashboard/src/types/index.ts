/**
 * Centralized type exports for the dashboard
 */

// Project-related types
export type {
  ProjectData,
  StreamData,
  TimelineData,
  TeamMemberData,
  DashboardData
} from './project';

// Filter-related types
export type {
  FilterState,
  FilterResult,
  FilterSuggestion
} from './filters';

// Constants
export {
  STREAM_COLORS,
  WORK_HOURS_PER_DAY,
  WORK_DAYS_PER_WEEK
} from './constants';
