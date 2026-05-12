import mongoose from "mongoose";

const citySnapshotSchema = new mongoose.Schema(
  {
    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: true,
      index: true
    },
    weather: {
      temperature: Number,
      feelsLike: Number,
      humidity: Number,
      pressure: Number,
      windSpeed: Number,
      condition: String,
      icon: String
    },
    airQuality: {
      aqi: Number,
      pm25: Number,
      pm10: Number,
      no2: Number,
      o3: Number,
      source: String
    },
    population: Number,
    currency: {
      code: String,
      rateToInr: Number,
      baseCurrency: String
    },
    recordedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

citySnapshotSchema.index({ cityId: 1, recordedAt: -1 });

export const CitySnapshot = mongoose.model("CitySnapshot", citySnapshotSchema);
