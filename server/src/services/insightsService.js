import { City } from "../models/City.js";
import { CitySnapshot } from "../models/CitySnapshot.js";
import { env } from "../config/env.js";
import { fetchAirQuality } from "./airQualityService.js";
import { fetchRateToInr } from "./currencyService.js";
import { fetchCityPopulation, fetchCountryCurrency } from "./geodbService.js";
import { fetchWeather } from "./weatherService.js";

export async function hydrateCityMetadata() {
  const cities = await City.find().lean();

  for (const city of cities) {
    const updates = {};

    if (!city.population) {
      try {
        updates.population = await fetchCityPopulation(city.wikiDataId);
      } catch (error) {
        console.warn(`Population lookup failed for ${city.name}: ${error.message}`);
      }
    }

    if (!city.currencyCode) {
      try {
        updates.currencyCode = await fetchCountryCurrency(city.countryCode);
      } catch (error) {
        console.warn(`Currency lookup failed for ${city.name}: ${error.message}`);
      }
    }

    if (Object.keys(updates).length) {
      await City.findByIdAndUpdate(city._id, updates);
    }
  }
}

export async function refreshCitySnapshots() {
  const cities = await City.find();

  for (const city of cities) {
    try {
      const [weather, airQuality, currency] = await Promise.all([
        fetchWeather(city.latitude, city.longitude),
        fetchAirQuality(city.name, city.countryCode),
        fetchRateToInr(city.currencyCode)
      ]);

      await CitySnapshot.create({
        cityId: city._id,
        weather,
        airQuality,
        population: city.population,
        currency,
        recordedAt: new Date()
      });

      console.log(`Snapshot stored for ${city.name}`);
    } catch (error) {
      console.error(`Snapshot refresh failed for ${city.name}: ${error.message}`);
    }
  }

  await deleteExpiredSnapshots();
}

export async function deleteExpiredSnapshots() {
  const cutoff = new Date(
    Date.now() - env.snapshotRetentionDays * 24 * 60 * 60 * 1000
  );

  await CitySnapshot.deleteMany({
    recordedAt: { $lt: cutoff }
  });
}

export async function getLatestSnapshotsByCity() {
  return City.aggregate([
    {
      $lookup: {
        from: "citysnapshots",
        let: { cityId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$cityId", "$$cityId"] }
            }
          },
          {
            $sort: { recordedAt: -1 }
          },
          {
            $limit: 1
          }
        ],
        as: "latestSnapshot"
      }
    },
    {
      $unwind: {
        path: "$latestSnapshot",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $sort: { name: 1 }
    }
  ]);
}
