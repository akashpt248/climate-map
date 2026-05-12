export function formatTemperature(value) {
  return value == null ? "--" : `${Math.round(value)}°C`;
}

export function formatNumber(value) {
  return value == null ? "--" : new Intl.NumberFormat().format(value);
}

export function formatRate(value, code) {
  if (value == null) return "--";
  return `1 ${code} = ${value.toFixed(2)} INR`;
}

export function formatTimestamp(value) {
  if (!value) return "--";
  return new Date(value).toLocaleString();
}

export function getAqiLabel(aqi) {
  if (aqi == null) return "Unknown";
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  return "Very Unhealthy";
}

export function getAqiColor(aqi) {
  if (aqi == null) return "#94a3b8";
  if (aqi <= 50) return "#16a34a";
  if (aqi <= 100) return "#eab308";
  if (aqi <= 150) return "#f97316";
  if (aqi <= 200) return "#ef4444";
  return "#7f1d1d";
}
