/**
 * Filter-related types and interfaces
 */

import type { ProjectData } from './project';

export interface FilterState {
  members: string[];
  streams: string[];
  status: string[];
  type: string[];
}

export interface FilterResult {
  projects: ProjectData[];
  errors: string[];
  suggestions: FilterSuggestion[];
}

export interface FilterSuggestion {
  filterType: keyof FilterState;
  action: 'remove' | 'replace';
  values?: string[];
  message: string;
}
