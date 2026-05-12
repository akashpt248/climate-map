import { useEffect, useState } from "react";
import { fetchCities, fetchCityHistory } from "./api/cities";
import CityModal from "./components/CityModal";
import LoadingSpinner from "./components/LoadingSpinner";
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

function findLatestHistoryValue(history, getter) {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const value = getter(history[index]);
    if (value != null) {
      return value;
    }
  }

  return null;
}

function buildSelectedSnapshot(city, history) {
  const latestHistorySnapshot = history.length ? history[history.length - 1] : null;

  if (!latestHistorySnapshot) {
    return city?.latestSnapshot || null;
  }

  const latestAqi = findLatestHistoryValue(history, (entry) => entry?.airQuality?.aqi);
  const latestPm25 = findLatestHistoryValue(history, (entry) => entry?.airQuality?.pm25);
  const latestPopulation = findLatestHistoryValue(history, (entry) => entry?.population);

  return {
    ...latestHistorySnapshot,
    airQuality: {
      ...latestHistorySnapshot.airQuality,
      aqi: latestHistorySnapshot.airQuality?.aqi ?? latestAqi,
      pm25: latestHistorySnapshot.airQuality?.pm25 ?? latestPm25
    },
    population: latestHistorySnapshot.population ?? latestPopulation ?? city?.population ?? null
  };
}

export default function App() {
  const pollIntervalMs = Math.max(
    5000,
    Number.parseInt(import.meta.env.VITE_POLL_INTERVAL_MS || "30000", 10) || 30000
  );
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [citiesRequestKey, setCitiesRequestKey] = useState(0);
  const [historyRequestKey, setHistoryRequestKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    setLoading(true);

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
          setError(
            `Failed to load cities. ${requestError.message || "Please try again."}`
          );
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
    const interval = setInterval(loadCities, pollIntervalMs);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [citiesRequestKey, pollIntervalMs]);

  useEffect(() => {
    const historyCityId = selectedCity?.routeId || selectedCity?._id;
    if (!historyCityId) return;

    let ignore = false;

    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError("");

      try {
        const payload = await fetchCityHistory(historyCityId, 7);
        if (!ignore) {
          const nextHistory = Array.isArray(payload.history) ? payload.history : [];
          const nextSnapshot = buildSelectedSnapshot(selectedCity, nextHistory);

          setHistory(nextHistory);
          setCities((currentCities) =>
            currentCities.map((city) =>
              city._id === selectedCity?._id
                ? {
                    ...city,
                    population: nextSnapshot?.population ?? city.population,
                    latestSnapshot: nextSnapshot ?? city.latestSnapshot
                  }
                : city
            )
          );
          setSelectedCity((currentCity) =>
            currentCity && currentCity._id === selectedCity?._id
              ? {
                  ...currentCity,
                  population: nextSnapshot?.population ?? currentCity.population,
                  latestSnapshot: nextSnapshot ?? currentCity.latestSnapshot
                }
              : currentCity
          );
        }
      } catch (requestError) {
        if (!ignore) {
          setHistory([]);
          setHistoryError(
            `Failed to load historical trends for ${selectedCity.name}. ${
              requestError.message || "Please try again."
            }`
          );
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
  }, [selectedCity?.routeId, selectedCity?._id, historyRequestKey]);

  const hottestCity = [...cities]
    .filter((city) => city.latestSnapshot?.weather?.temperature != null)
    .sort(
      (a, b) =>
        b.latestSnapshot.weather.temperature - a.latestSnapshot.weather.temperature
    )[0];

  const selectedSnapshot = buildSelectedSnapshot(selectedCity, history);
  const selectedAqi =
    selectedSnapshot?.airQuality?.aqi ??
    findLatestHistoryValue(history, (entry) => entry?.airQuality?.aqi);
  const selectedPopulation =
    selectedSnapshot?.population ??
    selectedCity?.population ??
    findLatestHistoryValue(history, (entry) => entry?.population);

  useEffect(() => {
    if (!selectedCity || historyLoading) return;

    if (selectedAqi != null && selectedPopulation != null) return;

    const latestHistoryPoint = history.length ? history[history.length - 1] : null;
    const latestHistoryWithAqi = [...history]
      .reverse()
      .find((entry) => entry?.airQuality?.aqi != null);
    const latestHistoryWithPopulation = [...history]
      .reverse()
      .find((entry) => entry?.population != null);

    console.groupCollapsed(
      `[BugReport] Missing live city fields for ${selectedCity.routeId || selectedCity._id}`
    );
    console.warn("Selected city", {
      id: selectedCity._id,
      routeId: selectedCity.routeId,
      name: selectedCity.name,
      country: selectedCity.country,
      cityPopulation: selectedCity.population ?? null,
      cityLatestSnapshotRecordedAt: selectedCity.latestSnapshot?.recordedAt ?? null,
      cityLatestSnapshotTemperature:
        selectedCity.latestSnapshot?.weather?.temperature ?? null,
      cityLatestSnapshotAqi: selectedCity.latestSnapshot?.airQuality?.aqi ?? null,
      cityLatestSnapshotPm25: selectedCity.latestSnapshot?.airQuality?.pm25 ?? null,
      cityLatestSnapshotPopulation: selectedCity.latestSnapshot?.population ?? null
    });
    console.warn("History summary", {
      historyLength: history.length,
      latestHistoryRecordedAt: latestHistoryPoint?.recordedAt ?? null,
      latestHistoryTemperature: latestHistoryPoint?.weather?.temperature ?? null,
      latestHistoryAqi: latestHistoryPoint?.airQuality?.aqi ?? null,
      latestHistoryPm25: latestHistoryPoint?.airQuality?.pm25 ?? null,
      latestHistoryPopulation: latestHistoryPoint?.population ?? null,
      latestNonNullAqiRecordedAt: latestHistoryWithAqi?.recordedAt ?? null,
      latestNonNullAqiValue: latestHistoryWithAqi?.airQuality?.aqi ?? null,
      latestNonNullPm25Value: latestHistoryWithAqi?.airQuality?.pm25 ?? null,
      latestNonNullPopulationRecordedAt:
        latestHistoryWithPopulation?.recordedAt ?? null,
      latestNonNullPopulationValue: latestHistoryWithPopulation?.population ?? null
    });
    console.warn("Resolved display values", {
      selectedSnapshotRecordedAt: selectedSnapshot?.recordedAt ?? null,
      selectedSnapshotTemperature: selectedSnapshot?.weather?.temperature ?? null,
      selectedSnapshotAqi: selectedSnapshot?.airQuality?.aqi ?? null,
      selectedSnapshotPm25: selectedSnapshot?.airQuality?.pm25 ?? null,
      selectedSnapshotPopulation: selectedSnapshot?.population ?? null,
      selectedAqi,
      selectedPopulation
    });
    console.groupEnd();
  }, [
    history,
    historyLoading,
    selectedAqi,
    selectedCity,
    selectedPopulation,
    selectedSnapshot
  ]);

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

      {error ? (
        <div className="status-card error-card">
          {error}
          <button
            className="secondary-button"
            onClick={() => {
              setError("");
              setCitiesRequestKey((value) => value + 1);
            }}
          >
            Retry city fetch
          </button>
        </div>
      ) : null}

      <section className="content-grid">
        <div className="map-card">
          {loading ? (
            <div className="status-card">
              <LoadingSpinner label="Loading world map data..." />
            </div>
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
                  style={{ backgroundColor: getAqiColor(selectedAqi) }}
                >
                  {getAqiLabel(selectedAqi)}
                </span>
              </div>

              <div className="sidebar-metrics">
                <SummaryCard
                  title="AQI"
                  value={selectedAqi ?? "--"}
                  subtitle="Approximate index from latest measurements"
                />
                <SummaryCard
                  title="Population"
                  value={
                    selectedPopulation
                      ? new Intl.NumberFormat().format(selectedPopulation)
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
          snapshot={selectedSnapshot}
          history={history}
          historyLoading={historyLoading}
          historyError={historyError}
          onRetryHistory={() => setHistoryRequestKey((value) => value + 1)}
          onClose={() => setIsModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
