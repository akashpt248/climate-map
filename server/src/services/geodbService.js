import { env } from "../config/env.js";
import { getJson } from "../utils/http.js";

function buildHeaders() {
  return {
    "X-RapidAPI-Key": env.geodbApiKey,
    "X-RapidAPI-Host": env.geodbApiHost
  };
}

export async function fetchCityPopulation(wikiDataId) {
  const url = `https://${env.geodbApiHost}/v1/geo/cities/${wikiDataId}`;
  const data = await getJson(url, {
    headers: buildHeaders()
  });

  return data?.data?.population ?? null;
}

export async function fetchCountryCurrency(countryCode) {
  const url = `https://${env.geodbApiHost}/v1/locale/currencies?countryId=${countryCode}&limit=1`;
  const data = await getJson(url, {
    headers: buildHeaders()
  });

  return data?.data?.[0]?.code ?? null;
}
