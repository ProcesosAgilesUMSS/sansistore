import { useState, useEffect } from 'react';
import type { PanelOrder } from '../components/OrderPanel';

export type MapOrder = {
  buyerName: string;
  deliveryZone: string;
  deliveryLat: number | null;
  deliveryLng: number | null;
  total: number;
};

export function useMapOrders() {
  const [mapOrder, setMapOrder] = useState<MapOrder | null>(null);
  const [panelOrder, setPanelOrder] = useState<PanelOrder | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('courier_map_order');
      if (raw) setMapOrder(JSON.parse(raw) as MapOrder);
    } catch { /* ignore */ }

    try {
      const raw = localStorage.getItem('courier_panel_order');
      if (raw) setPanelOrder(JSON.parse(raw) as PanelOrder);
    } catch { /* ignore */ }
  }, []);

  return { mapOrder, panelOrder };
}
