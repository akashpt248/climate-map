import { connectDatabase } from "../config/db.js";
import { citySeeds } from "../data/cities.js";
import { City } from "../models/City.js";

async function seedCities() {
  await connectDatabase();

  for (const city of citySeeds) {
    await City.updateOne({ name: city.name }, { $set: city }, { upsert: true });
  }

  console.log(`Seeded ${citySeeds.length} cities`);
  process.exit(0);
}

seedCities().catch((error) => {
  console.error(error);
  process.exit(1);
});
