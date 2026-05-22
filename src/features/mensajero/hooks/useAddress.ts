import { useEffect, useState } from 'react';

export type Position = [number, number];

export async function geocodeAddress(address: string): Promise<Position | null> {
  const apiKey = import.meta.env.PUBLIC_GEOCODE_MAPS_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://geocode.maps.co/search?q=${address}&api_key=${apiKey}`
    );
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const cercado = data.find((r: { address?: { county?: string } }) => r.address?.county === 'Cercado');
    const best = cercado ?? data[0];
    return [parseFloat(best.lat), parseFloat(best.lon)];
  } catch { /* ignore */ }
  return null;
}

export function useAddress(address: string | null): Position | null {
  const [position, setPosition] = useState<Position | null>(null);

  useEffect(() => {
    if (!address) return;
    geocodeAddress(address).then((pos) => {
      if (pos) setPosition(pos);
    });
  }, [address]);

  return position;
}
