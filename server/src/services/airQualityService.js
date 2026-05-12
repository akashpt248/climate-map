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

export async function fetchAirQuality(cityName, countryCode) {
  const url = new URL("https://api.openaq.org/v3/locations");
  url.searchParams.set("city", cityName);
  url.searchParams.set("country_id", countryCode);
  url.searchParams.set("limit", "1");

  const data = await getJson(url.toString(), {
    headers: {
      "X-API-Key": env.openAqApiKey
    }
  });

  const sensors = data?.results?.[0]?.sensors || [];
  const values = Object.fromEntries(
    sensors.map((sensor) => [
      sensor.parameter?.name,
      sensor.latest?.value ?? null
    ])
  );

  const pm25 = values.pm25 ?? null;

  return {
    aqi: buildAqiFromPm25(pm25),
    pm25,
    pm10: values.pm10 ?? null,
    no2: values.no2 ?? null,
    o3: values.o3 ?? null,
    source: "OpenAQ"
  };
}
