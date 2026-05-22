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
};

export default function DeliveryMarker({position}: Props) {
  return (
    <Marker position={position} icon={deliveryIcon}>
      <Popup>
      </Popup>
    </Marker>
  );
}
