const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

function normalizeCity(city) {
  if (!city || typeof city !== "object") {
    return null;
  }

  const cityId = city._id || city.id || city.slug || city.name;
  const latitude = city.latitude ?? city.lat ?? null;
  const longitude = city.longitude ?? city.lon ?? null;

  return {
    ...city,
    _id: cityId,
    latitude,
    longitude,
    countryCode: city.countryCode || city.country_code || "",
    latestSnapshot:
      city.latestSnapshot && typeof city.latestSnapshot === "object"
        ? city.latestSnapshot
        : null
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
  const history = Array.isArray(payload?.data?.history)
    ? payload.data.history
    : Array.isArray(payload?.history)
      ? payload.history
      : [];

  if (!Array.isArray(history)) {
    throw new Error("API returned an invalid city history payload");
  }

  return {
    ...(payload?.data && typeof payload.data === "object" ? payload.data : {}),
    history
  };
}
