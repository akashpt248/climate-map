import { formatTemperature } from "../utils/formatters";

export default function TemperatureGauge({ value }) {
  const normalized = value == null ? 0 : Math.min(Math.max((value + 10) / 50, 0), 1);
  const angle = normalized * 180 - 90;

  return (
    <div className="gauge-card">
      <div className="gauge-label">Temperature</div>
      <div className="gauge">
        <div className="gauge-arc" />
        <div
          className="gauge-needle"
          style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
        />
        <div className="gauge-value">{formatTemperature(value)}</div>
      </div>
    </div>
  );
}
