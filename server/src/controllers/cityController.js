import { City } from "../models/City.js";
import { CitySnapshot } from "../models/CitySnapshot.js";
import { getLatestSnapshotsByCity } from "../services/insightsService.js";

export async function getCities(req, res, next) {
  try {
    const cities = await getLatestSnapshotsByCity();
    res.json({ data: cities });
  } catch (error) {
    next(error);
  }
}

export async function getCityDetails(req, res, next) {
  try {
    const city = await City.findById(req.params.id).lean();

    if (!city) {
      return res.status(404).json({ message: "City not found" });
    }

    const latestSnapshot = await CitySnapshot.findOne({ cityId: city._id })
      .sort({ recordedAt: -1 })
      .lean();

    res.json({
      data: {
        ...city,
        latestSnapshot
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getCityHistory(req, res, next) {
  try {
    const days = Math.min(Number(req.query.days || 7), 15);
    const city = await City.findById(req.params.id).lean();

    if (!city) {
      return res.status(404).json({ message: "City not found" });
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const history = await CitySnapshot.find({
      cityId: city._id,
      recordedAt: { $gte: since }
    })
      .sort({ recordedAt: 1 })
      .lean();

    res.json({
      data: {
        city,
        history
      }
    });
  } catch (error) {
    next(error);
  }
}
