import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const deliveryIcon = L.icon({
  iconUrl: '/usuario.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

type Position = [number, number];

type Props = {
  position: Position;
  name: string;
  zone: string;
};

export default function DeliveryMarker({ position, name, zone }: Props) {
  return (
    <Marker position={position} icon={deliveryIcon}>
      <Popup>
        <strong>{name}</strong><br />{zone}
      </Popup>
    </Marker>
  );
}
