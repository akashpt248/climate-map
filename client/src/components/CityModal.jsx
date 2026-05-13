import TrendChart from "./TrendChart";
import TemperatureGauge from "./TemperatureGauge";
import LoadingSpinner from "./LoadingSpinner";
import {
  formatNumber,
  formatRate,
  formatTimestamp,
  getAqiColor,
  getAqiLabel
} from "../utils/formatters";

function DataRow({ label, value }) {
  return (
    <div className="data-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function CityModal({
  city,
  snapshot,
  history,
  historyDays,
  onHistoryDaysChange,
  snapshotRefreshHint,
  historyLoading,
  historyError,
  onRetryHistory,
  onClose
}) {
  if (!city) return null;

  const aqi = snapshot?.airQuality?.aqi;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="modal-header">
          <div>
            <p className="eyebrow">City Insight</p>
            <h2>
              {city.name}, {city.countryCode}
            </h2>
            <p className="timestamp">
              Last updated: {formatTimestamp(snapshot?.recordedAt)}
            </p>
          </div>
          <div
            className="aqi-pill"
            style={{ backgroundColor: getAqiColor(aqi) }}
          >
            AQI {aqi ?? "--"} · {getAqiLabel(aqi)}
          </div>
        </div>

        <div className="modal-top-grid">
          <TemperatureGauge value={snapshot?.weather?.temperature} />

          <div className="stats-card">
            <div className="section-title">Live Metrics</div>
            <DataRow label="Feels Like" value={snapshot?.weather?.feelsLike != null ? `${Math.round(snapshot.weather.feelsLike)}°C` : "--"} />
            <DataRow label="Humidity" value={snapshot?.weather?.humidity != null ? `${snapshot.weather.humidity}%` : "--"} />
            <DataRow label="Pressure" value={snapshot?.weather?.pressure != null ? `${snapshot.weather.pressure} hPa` : "--"} />
            <DataRow label="Wind Speed" value={snapshot?.weather?.windSpeed != null ? `${snapshot.weather.windSpeed} m/s` : "--"} />
            <DataRow label="Condition" value={snapshot?.weather?.condition || "--"} />
          </div>
        </div>

        <div className="table-card">
          <div className="section-title">Dashboard Table</div>
          <div className="data-grid">
            <DataRow
              label="Population"
              value={formatNumber(snapshot?.population ?? city.population)}
            />
            <DataRow label="PM2.5" value={snapshot?.airQuality?.pm25 ?? "--"} />
            <DataRow label="PM10" value={snapshot?.airQuality?.pm10 ?? "--"} />
            <DataRow label="NO2" value={snapshot?.airQuality?.no2 ?? "--"} />
            <DataRow label="O3" value={snapshot?.airQuality?.o3 ?? "--"} />
            <DataRow
              label="Currency vs INR"
              value={formatRate(snapshot?.currency?.rateToInr, snapshot?.currency?.code || city.currencyCode)}
            />
            <p className="metric-note metric-note-block">
              INR cross-rate is fetched when the server writes each snapshot (same job as weather and AQI).
              {snapshotRefreshHint ? ` Typical cadence: ${snapshotRefreshHint}.` : ""} Not polled separately on
              this page.
            </p>
          </div>
        </div>

        <div className="history-range-block modal-history-range">
          <div className="section-title">Trend window</div>
          <div className="segmented-control" role="group" aria-label="Historical trend length">
            {[7, 15].map((days) => (
              <button
                key={days}
                type="button"
                className={`segmented-option ${historyDays === days ? "active" : ""}`}
                onClick={() => onHistoryDaysChange(days)}
                aria-pressed={historyDays === days}
              >
                {days} days
              </button>
            ))}
          </div>
        </div>

        {historyLoading ? (
          <div className="status-card">
            <LoadingSpinner label="Loading historical trends..." />
          </div>
        ) : historyError ? (
          <div className="status-card error-card">
            {historyError}
            <button className="secondary-button" onClick={onRetryHistory}>
              Retry history fetch
            </button>
          </div>
        ) : (
          <TrendChart history={history} days={historyDays} />
        )}
      </div>
    </div>
  );
}
