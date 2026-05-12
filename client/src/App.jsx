import { useEffect, useState } from "react";
import { fetchCities, fetchCityHistory } from "./api/cities";
import CityModal from "./components/CityModal";
import MapView from "./components/MapView";
import {
  formatRate,
  formatTemperature,
  formatTimestamp,
  getAqiColor,
  getAqiLabel
} from "./utils/formatters";

function SummaryCard({ title, value, subtitle }) {
  return (
    <div className="summary-card">
      <p>{title}</p>
      <h3>{value}</h3>
      <span>{subtitle}</span>
    </div>
  );
}

export default function App() {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadCities() {
      try {
        const data = await fetchCities();
        const nextCities = Array.isArray(data) ? data : [];

        if (ignore) return;
        setCities(nextCities);
        setError(nextCities.length ? "" : "No city data is available right now.");

        setSelectedCity((current) => {
          if (!current) return nextCities[0] || null;
          return (
            nextCities.find((city) => city?._id === current._id) ||
            nextCities[0] ||
            null
          );
        });
      } catch (requestError) {
        if (!ignore) {
          setError(requestError.message);
          setCities([]);
          setSelectedCity(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadCities();
    const interval = setInterval(loadCities, 30000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!selectedCity?._id) return;

    let ignore = false;

    async function loadHistory() {
      setHistoryLoading(true);

      try {
        const payload = await fetchCityHistory(selectedCity._id, 7);
        if (!ignore) {
          setHistory(Array.isArray(payload.history) ? payload.history : []);
        }
      } catch (requestError) {
        if (!ignore) {
          setHistory([]);
          console.error(requestError);
        }
      } finally {
        if (!ignore) {
          setHistoryLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      ignore = true;
    };
  }, [selectedCity?._id]);

  const hottestCity = [...cities]
    .filter((city) => city.latestSnapshot?.weather?.temperature != null)
    .sort(
      (a, b) =>
        b.latestSnapshot.weather.temperature - a.latestSnapshot.weather.temperature
    )[0];

  const selectedSnapshot = selectedCity?.latestSnapshot;

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Global City Insights Map</p>
          <h1>Real-Time Climate, AQI, Population and Currency Dashboard</h1>
          <p className="hero-copy">
            Monitor 10 world cities through a clean live map interface backed by
            scheduled API refreshes and historical snapshot storage.
          </p>
        </div>

        <div className="hero-side">
          <SummaryCard
            title="Tracked Cities"
            value={String(cities.length).padStart(2, "0")}
            subtitle="Clickable markers with live city panels"
          />
          <SummaryCard
            title="Hottest City"
            value={hottestCity?.name || "--"}
            subtitle={formatTemperature(hottestCity?.latestSnapshot?.weather?.temperature)}
          />
        </div>
      </header>

      {error ? <div className="status-card error-card">{error}</div> : null}

      <section className="content-grid">
        <div className="map-card">
          {loading ? (
            <div className="status-card">Loading world map data...</div>
          ) : (
            <MapView
              cities={cities}
              onSelectCity={(city) => {
                setSelectedCity(city);
                setIsModalOpen(true);
              }}
              selectedCityId={selectedCity?._id}
            />
          )}
        </div>

        <aside className="sidebar-card">
          <div className="section-title">Focus City</div>
          {selectedCity ? (
            <>
              <h2>
                {selectedCity.name}, {selectedCity.countryCode}
              </h2>
              <p className="timestamp">
                Last updated: {formatTimestamp(selectedSnapshot?.recordedAt)}
              </p>

              <div className="focus-chip-row">
                <span className="chip">{formatTemperature(selectedSnapshot?.weather?.temperature)}</span>
                <span
                  className="chip"
                  style={{ backgroundColor: getAqiColor(selectedSnapshot?.airQuality?.aqi) }}
                >
                  {getAqiLabel(selectedSnapshot?.airQuality?.aqi)}
                </span>
              </div>

              <div className="sidebar-metrics">
                <SummaryCard
                  title="AQI"
                  value={selectedSnapshot?.airQuality?.aqi ?? "--"}
                  subtitle="Approximate index from latest measurements"
                />
                <SummaryCard
                  title="Population"
                  value={
                    selectedCity.population
                      ? new Intl.NumberFormat().format(selectedCity.population)
                      : "--"
                  }
                  subtitle="GeoDB sourced city population"
                />
                <SummaryCard
                  title="Currency"
                  value={selectedCity.currencyCode}
                  subtitle={formatRate(
                    selectedSnapshot?.currency?.rateToInr,
                    selectedCity.currencyCode
                  )}
                />
              </div>

              <button className="primary-button" onClick={() => setIsModalOpen(true)}>
                Open detailed view
              </button>
            </>
          ) : (
            <div className="status-card">Select a city marker to inspect details.</div>
          )}
        </aside>
      </section>

      <section className="city-strip">
        {cities.map((city) => (
          <button
            key={city._id}
            className={`city-pill ${selectedCity?._id === city._id ? "active" : ""}`}
            onClick={() => {
              setSelectedCity(city);
              setIsModalOpen(false);
            }}
          >
            <strong>{city.name}</strong>
            <span>{formatTemperature(city.latestSnapshot?.weather?.temperature)}</span>
          </button>
        ))}
      </section>

      {selectedCity && isModalOpen ? (
        <CityModal
          city={selectedCity}
          history={history}
          historyLoading={historyLoading}
          onClose={() => setIsModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
