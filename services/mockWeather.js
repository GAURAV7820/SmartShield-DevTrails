const cityProfiles = {
  mumbai: {
    rainfall: 220,
    aqi: 165,
    curfew: false,
    orderDrop: 38,
    riskHeadline: "Heavy rain risk with moderate air quality stress",
  },
  delhi: {
    rainfall: 40,
    aqi: 435,
    curfew: false,
    orderDrop: 47,
    riskHeadline: "Severe pollution risk with demand suppression",
  },
  bangalore: {
    rainfall: 85,
    aqi: 120,
    curfew: false,
    orderDrop: 16,
    riskHeadline: "Moderate rain exposure with low pollution pressure",
  },
  hyderabad: {
    rainfall: 70,
    aqi: 140,
    curfew: false,
    orderDrop: 19,
    riskHeadline: "Stable city conditions with occasional weather swings",
  },
  chennai: {
    rainfall: 165,
    aqi: 110,
    curfew: false,
    orderDrop: 42,
    riskHeadline: "Monsoon pressure likely to slow deliveries",
  },
  kolkata: {
    rainfall: 150,
    aqi: 170,
    curfew: false,
    orderDrop: 35,
    riskHeadline: "High rainfall sensitivity for delivery operations",
  },
  pune: {
    rainfall: 62,
    aqi: 102,
    curfew: false,
    orderDrop: 15,
    riskHeadline: "Low disruption environment",
  },
  ahmedabad: {
    rainfall: 20,
    aqi: 188,
    curfew: false,
    orderDrop: 14,
    riskHeadline: "Mostly stable with moderate pollution watch",
  },
};

function getMockWeatherByCity(city) {
  const key = String(city || "").trim().toLowerCase();
  return (
    cityProfiles[key] || {
      rainfall: 75,
      aqi: 140,
      curfew: false,
      orderDrop: 22,
      riskHeadline: "Fallback mock profile",
    }
  );
}

module.exports = {
  getMockWeatherByCity,
};
