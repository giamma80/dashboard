/**
 * Filter management utilities
 */

import type { ProjectData, FilterState, FilterResult, FilterSuggestion } from '../types';

/**
 * Classe per gestire la logica dei filtri in modo centralizzato
 */
export class FilterManager {
  private allProjects: ProjectData[];
  
  constructor(projects: ProjectData[]) {
    this.allProjects = projects;
  }

  /**
   * Applica tutti i filtri in sequenza e traccia i risultati
   */
  applyFilters(filters: FilterState): FilterResult {
    const errors: string[] = [];
    const suggestions: FilterSuggestion[] = [];
    
    let currentProjects = [...this.allProjects];
    const filterSteps: Array<{name: keyof FilterState, count: number}> = [];
    
    // Applica filtri in ordine e traccia i risultati
    if (filters.members.length > 0) {
      currentProjects = currentProjects.filter(p => filters.members.includes(p.teamMember));
      filterSteps.push({name: 'members', count: currentProjects.length});
    }
    
    if (filters.streams.length > 0) {
      currentProjects = currentProjects.filter(p => filters.streams.includes(p.stream));
      filterSteps.push({name: 'streams', count: currentProjects.length});
    }
    
    if (filters.status.length > 0) {
      currentProjects = currentProjects.filter(p => filters.status.includes(p.status));
      filterSteps.push({name: 'status', count: currentProjects.length});
    }
    
    if (filters.type.length > 0) {
      currentProjects = currentProjects.filter(p => filters.type.includes(p.type));
      filterSteps.push({name: 'type', count: currentProjects.length});
    }

    // Analizza i risultati e genera suggerimenti
    if (currentProjects.length === 0 && this.hasActiveFilters(filters)) {
      const failureAnalysis = this.analyzeFilterFailure(filters, filterSteps);
      errors.push(...failureAnalysis.errors);
      suggestions.push(...failureAnalysis.suggestions);
    }

    return {
      projects: currentProjects,
      errors,
      suggestions
    };
  }

  /**
   * Verifica se ci sono filtri attivi
   */
  private hasActiveFilters(filters: FilterState): boolean {
    return Object.values(filters).some(filterArray => filterArray.length > 0);
  }

  /**
   * Analizza perché i filtri hanno fallito e suggerisce soluzioni
   */
  private analyzeFilterFailure(filters: FilterState, filterSteps: Array<{name: keyof FilterState, count: number}>): {errors: string[], suggestions: FilterSuggestion[]} {
    const errors: string[] = [];
    const suggestions: FilterSuggestion[] = [];

    // Trova il primo filtro che ha eliminato tutti i progetti
    const failingStep = filterSteps.find(step => step.count === 0);
    
    if (failingStep) {
      const filterType = failingStep.name;
      const filterValues = filters[filterType];
      
      switch (filterType) {
        case 'members':
          errors.push(`Nessun progetto trovato per i membri selezionati: ${filterValues.join(', ')}`);
          suggestions.push({
            filterType: 'members',
            action: 'remove',
            message: 'Rimuovi filtro membri'
          });
          break;
          
        case 'streams':
          errors.push(`Nessun progetto trovato per gli stream selezionati: ${filterValues.join(', ')}`);
          // Suggerisci stream alternativi se c'è un filtro membro attivo
          if (filters.members.length > 0) {
            const memberProjects = this.allProjects.filter(p => filters.members.includes(p.teamMember));
            const availableStreams = [...new Set(memberProjects.map(p => p.stream))];
            if (availableStreams.length > 0) {
              errors[errors.length - 1] = `Il membro "${filters.members[0]}" non ha progetti negli stream selezionati. Stream disponibili: ${availableStreams.join(', ')}`;
              suggestions.push({
                filterType: 'streams',
                action: 'replace',
                values: availableStreams,
                message: 'Usa stream disponibili'
              });
            }
          }
          suggestions.push({
            filterType: 'streams',
            action: 'remove',
            message: 'Rimuovi filtro stream'
          });
          break;
          
        case 'status':
          errors.push(`Nessun progetto trovato per gli status selezionati: ${filterValues.join(', ')}`);
          suggestions.push({
            filterType: 'status',
            action: 'remove',
            message: 'Rimuovi filtro status'
          });
          break;
          
        case 'type':
          errors.push(`Nessun progetto trovato per i tipi selezionati: ${filterValues.join(', ')}`);
          suggestions.push({
            filterType: 'type',
            action: 'remove',
            message: 'Rimuovi filtro type'
          });
          break;
      }
    } else {
      // Combinazione generale di filtri incompatibili
      errors.push('Nessun progetto trovato con la combinazione di filtri selezionata.');
      suggestions.push({
        filterType: 'members', // Generico
        action: 'remove',
        message: 'Rimuovi alcuni filtri'
      });
    }

    return { errors, suggestions };
  }

  /**
   * Ottieni tutti i valori unici per un campo
   */
  getUniqueValues(field: keyof ProjectData): string[] {
    const values = new Set<string>();
    this.allProjects.forEach(project => {
      const value = project[field];
      if (typeof value === 'string' && value.trim() !== '') {
        values.add(value.trim());
      }
    });
    return Array.from(values).sort();
  }
}
