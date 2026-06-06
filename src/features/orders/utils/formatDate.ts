import { Timestamp } from "firebase/firestore";

/**
 * Formats a Firestore Timestamp into the format: DD/MM/YYYY - HH:mm am/pm
 * @param date The Firestore Timestamp to format
 * @returns A formatted string
 */
export const formatOrderDate = (date: Timestamp | null | undefined): string => {
  if (!date || typeof date.toDate !== 'function') return "Fecha no disponible";
  
  const d = date.toDate();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = d.getHours() >= 12 ? 'pm' : 'am';

  return `${day}/${month}/${year} - ${hours}:${minutes} ${ampm}`;
};

/**
 * Formats a Firestore Timestamp into a human-readable "hace X..." format
 * @param date The Firestore Timestamp to format
 * @returns A formatted string
 */
export const timeAgo = (date: Timestamp | null | undefined): string => {
  if (!date || typeof date.toDate !== 'function') return "No disponible";

  const d = date.toDate();
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "hace unos segundos";
  if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} horas`;
  return `hace ${Math.floor(diffInSeconds / 86400)} días`;
};
