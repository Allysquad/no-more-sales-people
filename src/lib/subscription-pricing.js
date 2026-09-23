const countryBasePricePence = {
  SCOTLAND: 100000,
  ENGLAND: 200000,
  WALES: 80000,
  IRELAND: 50000,
};

const ratingMultipliers = {
  BRONZE: 1,
  SILVER: 1.2,
  GOLD: 1.75,
  PLATINUM: 2.25,
};

const countryLabels = {
  SCOTLAND: "Scotland",
  ENGLAND: "England",
  WALES: "Wales",
  IRELAND: "Ireland",
};

const uniqueSorted = (values) => [...new Set(values)].sort();

export const subscriptionCountries = Object.keys(countryBasePricePence);
export const subscriptionRatings = Object.keys(ratingMultipliers);

export const calculateSubscription = ({ type, countries, rating }) => {
  const normalizedCountries = uniqueSorted(countries);
  const isAllCountries = type === "ALL_COUNTRIES";
  const selectedCountries = isAllCountries ? subscriptionCountries : normalizedCountries;

  if (!subscriptionRatings.includes(rating)) {
    throw new Error("Choose a valid lead rating.");
  }
  if (isAllCountries && normalizedCountries.length !== 0) {
    throw new Error("All countries subscriptions must not include individual countries.");
  }
  if (type === "ONE_COUNTRY" && normalizedCountries.length !== 1) {
    throw new Error("Choose exactly one country for a one-country subscription.");
  }
  if (type === "MULTIPLE_COUNTRIES" && (normalizedCountries.length < 2 || normalizedCountries.length === subscriptionCountries.length)) {
    throw new Error("Choose two or more, but not all, countries for a multiple-country subscription.");
  }
  if (selectedCountries.some((country) => !countryBasePricePence[country])) {
    throw new Error("Choose valid countries.");
  }

  const basePricePence = selectedCountries.reduce((total, country) => total + countryBasePricePence[country], 0);
  const ratingPricePence = Math.round(basePricePence * ratingMultipliers[rating]);
  const discountRate = type === "MULTIPLE_COUNTRIES" ? 0.1 : type === "ALL_COUNTRIES" ? 0.2 : 0;
  const monthlyPricePence = Math.round(ratingPricePence * (1 - discountRate));

  return {
    type,
    countries: isAllCountries ? [] : normalizedCountries,
    rating,
    basePricePence,
    discountRate,
    monthlyPricePence,
    countryLabels: selectedCountries.map((country) => countryLabels[country]),
  };
};

export const getSubscriptionOptions = () => ({
  countries: subscriptionCountries.map((value) => ({ value, label: countryLabels[value], basePricePence: countryBasePricePence[value] })),
  ratings: subscriptionRatings.map((value) => ({ value, multiplier: ratingMultipliers[value] })),
  discounts: { multipleCountries: 0.1, allCountries: 0.2 },
});
