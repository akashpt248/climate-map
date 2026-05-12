import { env } from "../config/env.js";
import { getJson } from "../utils/http.js";

function buildHeaders() {
  return {
    "X-RapidAPI-Key": env.geodbApiKey,
    "X-RapidAPI-Host": env.geodbApiHost
  };
}

function parseWikidataPopulationClaim(claim) {
  const amount = claim?.mainsnak?.datavalue?.value?.amount;
  if (typeof amount !== "string") return null;

  const parsed = Number(amount.replace("+", ""));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return Math.round(parsed);
}

async function getPopulationFromWikidata(wikiDataId) {
  if (!wikiDataId) return null;

  const url = new URL("https://www.wikidata.org/w/api.php");
  url.searchParams.set("action", "wbgetentities");
  url.searchParams.set("ids", wikiDataId);
  url.searchParams.set("props", "claims");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const data = await getJson(url.toString());
  const claims = data?.entities?.[wikiDataId]?.claims?.P1082 ?? [];

  const preferredClaim = claims.find((claim) => claim?.rank === "preferred");
  const preferredPopulation = parseWikidataPopulationClaim(preferredClaim);
  if (preferredPopulation != null) {
    return preferredPopulation;
  }

  for (const claim of claims) {
    const population = parseWikidataPopulationClaim(claim);
    if (population != null) {
      return population;
    }
  }

  return null;
}

async function getPopulationByCityId(cityId) {
  const url = `https://${env.geodbApiHost}/v1/geo/cities/${cityId}`;
  const data = await getJson(url, {
    headers: buildHeaders()
  });

  return data?.data?.population ?? null;
}

async function searchCityPopulation({ name, countryCode }) {
  const url = new URL(`https://${env.geodbApiHost}/v1/geo/cities`);
  url.searchParams.set("namePrefix", name);
  url.searchParams.set("countryIds", countryCode);
  url.searchParams.set("limit", "10");
  url.searchParams.set("sort", "-population");

  const data = await getJson(url.toString(), {
    headers: buildHeaders()
  });

  const match = data?.data?.find(
    (city) =>
      city?.name?.toLowerCase() === name.toLowerCase() &&
      city?.countryCode === countryCode
  );

  const population = match?.population ?? data?.data?.[0]?.population ?? null;

  if (population == null) {
    console.warn("[BugReport][Population] GeoDB search returned no population", {
      name,
      countryCode,
      requestUrl: url.toString(),
      resultsReturned: data?.data?.length ?? 0,
      firstResult: data?.data?.[0] ?? null
    });
  }

  return population;
}

async function searchPopulationWithOpenMeteo({ name, countryCode }) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", name);
  url.searchParams.set("count", "20");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const data = await getJson(url.toString());
  const results = Array.isArray(data?.results) ? data.results : [];
  const normalizedName = name.toLowerCase();

  const exactCountryAndName = results.find(
    (city) =>
      city?.country_code === countryCode &&
      city?.name?.toLowerCase() === normalizedName &&
      city?.population != null
  );
  if (exactCountryAndName) {
    return exactCountryAndName.population;
  }

  const sameCountry = results
    .filter((city) => city?.country_code === countryCode && city?.population != null)
    .sort((a, b) => (b.population ?? 0) - (a.population ?? 0));
  if (sameCountry.length) {
    return sameCountry[0].population;
  }

  const population = results.find((city) => city?.population != null)?.population ?? null;
  if (population == null) {
    console.warn("[BugReport][Population] Open-Meteo returned no population", {
      name,
      countryCode,
      requestUrl: url.toString(),
      resultsReturned: results.length
    });
  }

  return population;
}

export async function fetchCityPopulation(city) {
  if (!city) return null;

  const directIds = [city.geodbCityId].filter(Boolean);

  for (const cityId of directIds) {
    try {
      const population = await getPopulationByCityId(cityId);
      if (population != null) {
        return population;
      }
      console.warn("[BugReport][Population] Direct GeoDB lookup returned null population", {
        cityName: city.name,
        countryCode: city.countryCode,
        attemptedCityId: cityId
      });
    } catch (error) {
      console.warn("[BugReport][Population] Direct GeoDB lookup failed", {
        cityName: city.name,
        countryCode: city.countryCode,
        attemptedCityId: cityId,
        message: error.message
      });
    }
  }

  if (!city.name || !city.countryCode) {
    return null;
  }

  let population = null;
  try {
    population = await searchCityPopulation({
      name: city.name,
      countryCode: city.countryCode
    });
  } catch (error) {
    console.warn("[BugReport][Population] GeoDB search lookup failed", {
      cityName: city.name,
      countryCode: city.countryCode,
      message: error.message
    });
  }

  if (population != null) {
    return population;
  }

  if (city.wikiDataId) {
    try {
      const wikidataPopulation = await getPopulationFromWikidata(city.wikiDataId);
      if (wikidataPopulation != null) {
        return wikidataPopulation;
      }
      console.warn("[BugReport][Population] Wikidata returned no population", {
        cityName: city.name,
        countryCode: city.countryCode,
        wikiDataId: city.wikiDataId
      });
    } catch (error) {
      console.warn("[BugReport][Population] Wikidata lookup failed", {
        cityName: city.name,
        countryCode: city.countryCode,
        wikiDataId: city.wikiDataId,
        message: error.message
      });
    }
  }

  try {
    const openMeteoPopulation = await searchPopulationWithOpenMeteo({
      name: city.name,
      countryCode: city.countryCode
    });
    if (openMeteoPopulation != null) {
      return openMeteoPopulation;
    }
  } catch (error) {
    console.warn("[BugReport][Population] Open-Meteo lookup failed", {
      cityName: city.name,
      countryCode: city.countryCode,
      message: error.message
    });
  }

  if (population == null) {
    console.warn("[BugReport][Population] Population unresolved after all provider attempts", {
      cityName: city.name,
      countryCode: city.countryCode,
      geodbCityId: city.geodbCityId ?? null,
      wikiDataId: city.wikiDataId ?? null
    });
  }

  return population;
}

export async function fetchCountryCurrency(countryCode) {
  const url = `https://${env.geodbApiHost}/v1/locale/currencies?countryId=${countryCode}&limit=1`;
  const data = await getJson(url, {
    headers: buildHeaders()
  });

  return data?.data?.[0]?.code ?? null;
}
