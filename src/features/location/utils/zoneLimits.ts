// Definir las zonas permitidas (polígonos)
export interface Zone {
  name: string;
  points: [number, number][]; // Array de [lat, lng] que forman el polígono
}

// Configura tus zonas aquí - DEFINE LOS PUNTOS DE TU POLÍGONO
export const ALLOWED_ZONES: Zone[] = [
  {
    name: "Zona 1 - Campus Central",
    points: [
      [-17.393091, -66.149434],
      [-17.391898, -66.142798],
      [-17.393812, -66.141939],
      [-17.395363, -66.143233],
      [-17.394820, -66.143458],
      [-17.395598, -66.148028],
      [-17.394984, -66.148200],
      [-17.395148, -66.149133]
      // Cierra el polígono (el último punto se conecta con el primero)
    ],
  },
  {
    name: "Zona 2 - campus medicina",
    points: [
      [-17.388028, -66.149090],
      [-17.387352, -66.148564],
      [-17.386625, -66.149396],
      [-17.386451, -66.149401],
      [-17.386356, -66.149554],
      [-17.387163, -66.150291],
      [-17.387301, -66.150147],
      [-17.387200, -66.149994],
      [-17.387828, -66.149696],
      [-17.387767, -66.149471]
    ],
  },
];

// Función para verificar si un punto está dentro de un polígono (Ray Casting Algorithm)
export function isPointInPolygon(
  point: [number, number],
  polygon: [number, number][]
): boolean {
  const [lat, lng] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [lat1, lng1] = polygon[i];
    const [lat2, lng2] = polygon[j];
    
    const intersect = ((lng1 > lng) !== (lng2 > lng)) &&
      (lat < (lat2 - lat1) * (lng - lng1) / (lng2 - lng1) + lat1);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

// Función para verificar si una ubicación está en alguna zona permitida
export function isLocationValid(lat: number, lng: number): boolean {
  for (const zone of ALLOWED_ZONES) {
    if (isPointInPolygon([lat, lng], zone.points)) {
      return true;
    }
  }
  return false;
}

// Función para obtener en qué zona está
export function getCurrentZone(lat: number, lng: number): string | null {
  for (const zone of ALLOWED_ZONES) {
    if (isPointInPolygon([lat, lng], zone.points)) {
      return zone.name;
    }
  }
  return null;
}