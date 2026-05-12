import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { formatTemperature, getAqiColor } from "../utils/formatters";

export default function MapView({ cities, onSelectCity, selectedCityId }) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      scrollWheelZoom
      className="map-shell"
      worldCopyJump
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {cities.map((city) => {
        const snapshot = city.latestSnapshot;
        const color = getAqiColor(snapshot?.airQuality?.aqi);

        return (
          <CircleMarker
            key={city._id}
            center={[city.latitude, city.longitude]}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.85,
              weight: selectedCityId === city._id ? 4 : 2
            }}
            radius={selectedCityId === city._id ? 12 : 9}
            eventHandlers={{
              click: () => onSelectCity(city)
            }}
          >
            <Popup>
              <strong>{city.name}</strong>
              <br />
              {city.country}
              <br />
              {formatTemperature(snapshot?.weather?.temperature)}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
