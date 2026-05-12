import { env } from "../config/env.js";
import { getJson } from "../utils/http.js";

export async function fetchWeather(latitude, longitude) {
  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("lat", latitude);
  url.searchParams.set("lon", longitude);
  url.searchParams.set("appid", env.openWeatherApiKey);
  url.searchParams.set("units", "metric");

  const data = await getJson(url.toString());
  const primaryWeather = data.weather?.[0] || {};

  return {
    temperature: data.main?.temp ?? null,
    feelsLike: data.main?.feels_like ?? null,
    humidity: data.main?.humidity ?? null,
    pressure: data.main?.pressure ?? null,
    windSpeed: data.wind?.speed ?? null,
    condition: primaryWeather.main ?? "Unknown",
    icon: primaryWeather.icon ?? null
  };
}
