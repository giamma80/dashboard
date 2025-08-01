/**
 * Date and time utility functions
 */

import { WORK_HOURS_PER_DAY } from '../types';

/**
 * Calcola le ore lavorative disponibili in un periodo
 * considerando solo i giorni feriali (lunedì-venerdì)
 */
export function calculateAvailableWorkHours(startDate: Date, endDate: Date): number {
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
