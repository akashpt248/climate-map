import { getJson } from "../utils/http.js";

export async function fetchRateToInr(currencyCode) {
  if (currencyCode === "INR") {
    return {
      code: "INR",
      rateToInr: 1,
      baseCurrency: "INR"
    };
  }

  const url = `https://open.er-api.com/v6/latest/${currencyCode}`;
  const data = await getJson(url);

  return {
    code: currencyCode,
    rateToInr: data?.rates?.INR ?? null,
    baseCurrency: currencyCode
  };
}
