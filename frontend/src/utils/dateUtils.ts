import { formatDistanceToNow, format } from 'date-fns';
import { he } from 'date-fns/locale';

/**
 * Format date as relative time (e.g., "לפני 3 ימים")
 */
export const formatRelativeTime = (date: string | Date): string => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: he });
  } catch {
    return 'תאריך לא ידוע';
  }
};

/**
 * Format date as Hebrew date string
 */
export const formatHebrewDate = (date: string | Date): string => {
  try {
    return format(new Date(date), 'dd MMM yyyy', { locale: he });
  } catch {
    return 'תאריך לא ידוע';
  }
};

/**
 * Calculate reading ETA based on current page and pages per day
 */
export const calculateReadingETA = (currentPage: number, totalPages: number, pagesPerDay: number = 20): Date | null => {
  if (!totalPages || currentPage >= totalPages) return null;
  
  const remainingPages = totalPages - currentPage;
  const daysRemaining = Math.ceil(remainingPages / pagesPerDay);
  
  const eta = new Date();
  eta.setDate(eta.getDate() + daysRemaining);
  
  return eta;
};

/**
 * Format ETA message
 */
export const formatETAMessage = (eta: Date | null): string => {
  if (!eta) return '';
  
  const days = Math.ceil((eta.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'סיום היום!';
  if (days === 1) return 'סיום מחר';
  if (days <= 7) return `סיום בעוד ${days} ימים`;
  if (days <= 30) return `סיום בעוד ${Math.ceil(days / 7)} שבועות`;
  
  return `סיום ב-${formatHebrewDate(eta)}`;
};
