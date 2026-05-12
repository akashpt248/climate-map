const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

function hasSnapshotFields(value) {
  if (!value || typeof value !== "object") {
    return false;
  }

  return [
    "capturedAt",
    "recordedAt",
    "temperatureC",
    "temperature",
    "humidity",
    "aqi",
    "pm25"
  ].some((key) => value[key] != null);
}

function normalizeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  const weather =
    snapshot.weather && typeof snapshot.weather === "object"
      ? snapshot.weather
      : {
          temperature: snapshot.temperatureC ?? snapshot.temperature ?? null,
          feelsLike: snapshot.feelsLikeC ?? snapshot.feelsLike ?? null,
          humidity: snapshot.humidity ?? null,
          pressure: snapshot.pressure ?? null,
          windSpeed: snapshot.windSpeed ?? null,
          condition: snapshot.condition ?? null,
          icon: snapshot.icon ?? null
        };

  const airQuality =
    snapshot.airQuality && typeof snapshot.airQuality === "object"
      ? snapshot.airQuality
      : {
          aqi: snapshot.aqi ?? null,
          pm25: snapshot.pm25 ?? null,
          pm10: snapshot.pm10 ?? null,
          no2: snapshot.no2 ?? null,
          o3: snapshot.o3 ?? null,
          source: snapshot.source ?? null
        };

  const currency =
    snapshot.currency && typeof snapshot.currency === "object"
      ? snapshot.currency
      : {
          code: snapshot.currencyCode ?? snapshot.code ?? null,
          rateToInr: snapshot.rateToInr ?? null,
          baseCurrency: snapshot.baseCurrency ?? null
        };

  return {
    ...snapshot,
    weather,
    airQuality,
    currency,
    population: snapshot.population ?? null,
    recordedAt: snapshot.recordedAt || snapshot.capturedAt || null
  };
}

function normalizeCity(city) {
  if (!city || typeof city !== "object") {
    return null;
  }

  const cityId = city._id || city.id || city.slug || city.name;
  const routeId = city.id || city.slug || city.cityId || city._id || city.name;
  const latitude = city.latitude ?? city.lat ?? null;
  const longitude = city.longitude ?? city.lon ?? null;
  const latestSnapshotSource =
    city.latestSnapshot && typeof city.latestSnapshot === "object"
      ? city.latestSnapshot
      : city.snapshot && typeof city.snapshot === "object"
        ? city.snapshot
        : hasSnapshotFields(city)
          ? city
          : null;

  return {
    ...city,
    _id: cityId,
    routeId,
    latitude,
    longitude,
    countryCode: city.countryCode || city.country_code || "",
    latestSnapshot: latestSnapshotSource ? normalizeSnapshot(latestSnapshotSource) : null
  };
}

function normalizeCitiesPayload(payload) {
  const rawCities = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];

  return rawCities
    .map(normalizeCity)
    .filter((city) => city && city._id && city.latitude != null && city.longitude != null);
}

async function getJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function fetchCities() {
  const payload = await getJson("/cities");
  const cities = normalizeCitiesPayload(payload);

  if (!cities.length) {
    throw new Error("API returned an invalid cities payload");
  }

  return cities;
}

export async function fetchCityHistory(cityId, days = 7) {
  const payload = await getJson(`/cities/${cityId}/history?days=${days}`);
  const rawHistory = Array.isArray(payload?.data?.history)
    ? payload.data.history
    : Array.isArray(payload?.history)
      ? payload.history
      : Array.isArray(payload?.data?.points)
        ? payload.data.points
        : Array.isArray(payload?.points)
          ? payload.points
          : [];
  const history = Array.isArray(rawHistory)
    ? rawHistory.map(normalizeSnapshot).filter(Boolean)
      : [];

  if (!Array.isArray(history)) {
    throw new Error("API returned an invalid city history payload");
  }

  return {
    ...(payload?.data && typeof payload.data === "object" ? payload.data : {}),
    history
  };
}
