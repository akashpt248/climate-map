const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function getJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function fetchCities() {
  const payload = await getJson("/cities");
  return payload.data;
}

export async function fetchCityHistory(cityId, days = 7) {
  const payload = await getJson(`/cities/${cityId}/history?days=${days}`);
  return payload.data;
}
