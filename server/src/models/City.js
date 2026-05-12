import mongoose from "mongoose";

const citySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    country: { type: String, required: true },
    countryCode: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    wikiDataId: { type: String, required: true },
    currencyCode: { type: String, required: true },
    population: { type: Number, default: null }
  },
  {
    timestamps: true
  }
);

export const City = mongoose.model("City", citySchema);
