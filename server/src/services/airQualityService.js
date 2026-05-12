import { env } from "../config/env.js";
import { getJson } from "../utils/http.js";

function buildAqiFromPm25(pm25) {
  if (pm25 == null) return null;
  if (pm25 <= 12) return 40;
  if (pm25 <= 35.4) return 90;
  if (pm25 <= 55.4) return 140;
  if (pm25 <= 150.4) return 190;
  if (pm25 <= 250.4) return 260;
  return 350;
}

function buildEmptyAirQuality(source = "OpenAQ") {
  return {
    aqi: null,
    pm25: null,
    pm10: null,
    no2: null,
    o3: null,
    source
  };
}

function mapOpenWeatherAqiIndexToApprox(aqiIndex) {
  if (aqiIndex == null) return null;
  const value = Number(aqiIndex);
  if (!Number.isFinite(value)) return null;

  const mapping = {
    1: 30,
    2: 75,
    3: 125,
    4: 175,
    5: 250
  };

  return mapping[value] ?? null;
}

function buildHeaders() {
  return {
    "X-API-Key": env.openAqApiKey
  };
}

function sensorHasParameter(sensor, parameterName) {
  return sensor?.parameter?.name === parameterName;
}

function buildValueMap(readings, sensors) {
  const sensorNamesById = new Map(
    sensors.map((sensor) => [sensor.id, sensor.parameter?.name ?? null])
  );

  return Object.fromEntries(
    readings.map((reading) => [
      sensorNamesById.get(reading.sensorsId) ?? reading.parameter ?? null,
      reading.value ?? null
    ])
  );
}

async function fetchNearbyLocations(latitude, longitude, countryCode) {
  const url = new URL("https://api.openaq.org/v3/locations");
  url.searchParams.set("coordinates", `${latitude},${longitude}`);
  url.searchParams.set("radius", "25000");
  url.searchParams.set("country_id", countryCode);
  url.searchParams.set("limit", "25");

  const data = await getJson(url.toString(), { headers: buildHeaders() });

  return {
    requestUrl: url.toString(),
    locations: data?.results ?? []
  };
}

async function fetchLatestReadings(locationId) {
  const url = new URL(`https://api.openaq.org/v3/locations/${locationId}/latest`);
  const data = await getJson(url.toString(), { headers: buildHeaders() });

  return {
    requestUrl: url.toString(),
    readings: data?.results ?? []
  };
}

async function fetchOpenWeatherFallback(cityName, countryCode, latitude, longitude, reason) {
  if (!env.openWeatherApiKey) {
    return null;
  }

  try {
    const url = new URL("https://api.openweathermap.org/data/2.5/air_pollution");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("appid", env.openWeatherApiKey);

    const data = await getJson(url.toString());
    const sample = data?.list?.[0] ?? null;
    const components = sample?.components ?? {};
    const pm25 = components.pm2_5 ?? null;

    const fallback = {
      aqi: buildAqiFromPm25(pm25) ?? mapOpenWeatherAqiIndexToApprox(sample?.main?.aqi),
      pm25,
      pm10: components.pm10 ?? null,
      no2: components.no2 ?? null,
      o3: components.o3 ?? null,
      source: "OpenWeather Air Pollution"
    };

    if (fallback.aqi == null || fallback.pm25 == null) {
      console.warn("[BugReport][AQI] OpenWeather fallback returned partial AQI", {
        cityName,
        countryCode,
        latitude,
        longitude,
        reason,
        openWeatherAqiIndex: sample?.main?.aqi ?? null,
        resolvedAirQuality: fallback
      });
    }

    return fallback;
  } catch (error) {
    console.warn("[BugReport][AQI] OpenWeather AQI fallback failed", {
      cityName,
      countryCode,
      latitude,
      longitude,
      reason,
      message: error.message
    });
    return null;
  }
}

export async function fetchAirQuality(cityName, countryCode, latitude, longitude) {
  const openAqEmptyResult = buildEmptyAirQuality("OpenAQ");

  try {
    const { requestUrl, locations } = await fetchNearbyLocations(
      latitude,
      longitude,
      countryCode
    );

    const candidateLocations = locations
      .filter((location) =>
        Array.isArray(location?.sensors) &&
        location.sensors.some((sensor) => sensorHasParameter(sensor, "pm25"))
      )
      .sort(
        (a, b) => (a.distance ?? Number.MAX_SAFE_INTEGER) - (b.distance ?? Number.MAX_SAFE_INTEGER)
      );

    const chosenLocation = candidateLocations[0] ?? locations[0] ?? null;

    if (!chosenLocation) {
      console.warn("[BugReport][AQI] No nearby OpenAQ locations found", {
        cityName,
        countryCode,
        latitude,
        longitude,
        requestUrl,
        locationsReturned: 0,
        resolvedAirQuality: openAqEmptyResult
      });

      const fallback = await fetchOpenWeatherFallback(
        cityName,
        countryCode,
        latitude,
        longitude,
        "No nearby OpenAQ locations"
      );

      return fallback ?? openAqEmptyResult;
    }

    const { requestUrl: latestRequestUrl, readings } = await fetchLatestReadings(
      chosenLocation.id
    );

    const sensors = chosenLocation.sensors || [];
    const values = buildValueMap(readings, sensors);

    const pm25 = values.pm25 ?? null;
    const result = {
      aqi: buildAqiFromPm25(pm25),
      pm25,
      pm10: values.pm10 ?? null,
      no2: values.no2 ?? null,
      o3: values.o3 ?? null,
      source: "OpenAQ"
    };

    if (result.aqi == null || result.pm25 == null) {
      console.warn("[BugReport][AQI] Missing AQI values from OpenAQ", {
        cityName,
        countryCode,
        latitude,
        longitude,
        requestUrl,
        latestRequestUrl,
        locationsReturned: locations.length,
        chosenLocationId: chosenLocation.id ?? null,
        chosenLocationName: chosenLocation.name ?? null,
        chosenLocationDistance: chosenLocation.distance ?? null,
        sensorCount: sensors.length,
        sensorParameters: sensors.map((sensor) => sensor.parameter?.name ?? null),
        latestReadingsCount: readings.length,
        latestValues: values,
        resolvedAirQuality: result
      });

      const fallback = await fetchOpenWeatherFallback(
        cityName,
        countryCode,
        latitude,
        longitude,
        "OpenAQ returned null AQI/PM2.5"
      );

      return fallback ?? result;
    }

    return result;
  } catch (error) {
    console.warn("[BugReport][AQI] OpenAQ lookup failed", {
      cityName,
      countryCode,
      latitude,
      longitude,
      message: error.message
    });
    const fallback = await fetchOpenWeatherFallback(
      cityName,
      countryCode,
      latitude,
      longitude,
      "OpenAQ request error"
    );
    return fallback ?? openAqEmptyResult;
  }
}
