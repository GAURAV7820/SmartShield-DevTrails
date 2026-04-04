const cityRiskFactors = {
  mumbai: 1.35,
  delhi: 1.4,
  bangalore: 1.1,
  bengaluru: 1.1,
  hyderabad: 1.05,
  chennai: 1.2,
  kolkata: 1.15,
  pune: 1.0,
  ahmedabad: 0.95,
};

const basePremiums = {
  Rain: 79,
  Pollution: 89,
  All: 109,
};

function getPlanConfig(plan) {
  if (plan === "annual") {
    return {
      label: "Annual PayGuard Plan",
      premiumMultiplier: 48,
      discount: 0.85,
      periodLabel: "year",
    };
  }

  return {
    label: "Weekly PayGuard Plan",
    premiumMultiplier: 1,
    discount: 1,
    periodLabel: "week",
  };
}

function getCoveredPerils(coverageType) {
  if (coverageType === "Rain") {
    return ["rain"];
  }

  if (coverageType === "Pollution") {
    return ["aqi"];
  }

  return ["rain", "aqi", "curfew", "orders"];
}

function normalizeCity(city) {
  return String(city || "").trim().toLowerCase();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getRiskFactor(city) {
  return cityRiskFactors[normalizeCity(city)] || 1;
}

function getAqiRiskScore(aqi) {
  const normalizedAqi = Number(aqi || 0);

  if (normalizedAqi <= 100) {
    return 0;
  }

  return clamp((normalizedAqi - 100) / 400, 0, 1);
}

function getExposureScore(workingHours) {
  return clamp((Number(workingHours || 0) - 4) / 8, 0, 1);
}

function validatePayload(payload) {
  const required = ["name", "city", "platform", "coverageType"];
  for (const field of required) {
    if (!payload[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}

function calculatePremium(data) {
  const rainfallScore = clamp(Number(data.rainfall) / 200, 0, 1);
  const aqiScore = getAqiRiskScore(data.aqi);
  const riskScore = clamp(getRiskFactor(data.city) / 1.5, 0, 1);
  const claimsScore = clamp(Number(data.pastClaims) / 5, 0, 1);
  const exposureScore = getExposureScore(data.workingHours);
  const operationsScore = clamp(
    (Boolean(data.curfew) ? 0.65 : 0) + (clamp(Number(data.orderDrop) / 100, 0, 1) * 0.35),
    0,
    1
  );
  const weightedScore =
    rainfallScore * 0.24 +
    aqiScore * 0.18 +
    riskScore * 0.18 +
    claimsScore * 0.15 +
    exposureScore * 0.10 +
    operationsScore * 0.15;

  const basePremium = basePremiums[data.coverageType] || basePremiums.All;
  const coverageMultiplier = data.coverageType === "All" ? 1.1 : 1;
  const planConfig = getPlanConfig(data.plan);
  const finalPremium =
    basePremium *
    (1 + weightedScore) *
    coverageMultiplier *
    planConfig.premiumMultiplier *
    planConfig.discount;

  return {
    rainfallScore,
    aqiScore,
    riskScore,
    claimsScore,
    exposureScore,
    operationsScore,
    weightedScore,
    basePremium,
    coverageMultiplier,
    planDiscount: planConfig.discount,
    periodLabel: planConfig.periodLabel,
    finalPremium,
  };
}

function detectTriggers(data) {
  const rawTriggers = {
    rain: Number(data.rainfall) > 150,
    aqi: Number(data.aqi) > 400,
    curfew: Boolean(data.curfew),
    orders: Number(data.orderDrop) >= 45,
  };

  const coveredPerils = new Set(getCoveredPerils(data.coverageType));

  return {
    rain: coveredPerils.has("rain") ? rawTriggers.rain : false,
    aqi: coveredPerils.has("aqi") ? rawTriggers.aqi : false,
    curfew: coveredPerils.has("curfew") ? rawTriggers.curfew : false,
    orders: coveredPerils.has("orders") ? rawTriggers.orders : false,
  };
}

function detectFraud(data) {
  const locationMismatch =
    normalizeCity(data.city) !== normalizeCity(data.systemCity);
  const duplicateClaim = Boolean(data.duplicateClaim);
  return {
    locationMismatch,
    duplicateClaim,
    flagged: locationMismatch || duplicateClaim,
  };
}

function calculateSeverityScore(data, triggers) {
  let score = 0;

  if (triggers.rain) {
    score += Math.min(Math.floor((Number(data.rainfall) - 150) / 10), 20) + 10;
  }
  if (triggers.aqi) {
    score += Math.min(Math.floor((Number(data.aqi) - 400) / 10), 20) + 10;
  }
  if (triggers.curfew) {
    score += 18;
  }
  if (triggers.orders) {
    score += Math.min(Math.floor((Number(data.orderDrop) - 45) / 2), 15) + 10;
  }

  return score;
}

function processClaim(data, triggers, fraud) {
  const activeTriggerCount = Object.values(triggers).filter(Boolean).length;
  if (activeTriggerCount === 0) {
    return {
      triggered: false,
      approved: false,
      payout: 0,
      severity: "None",
      reasons: [],
      message: "No trigger activated",
    };
  }

  if (fraud.flagged) {
    return {
      triggered: true,
      approved: false,
      payout: 0,
      severity: "Blocked",
      reasons: ["Fraud risk detected"],
      message: "Auto-claim blocked by fraud engine",
    };
  }

  const severityScore = calculateSeverityScore(data, triggers);
  let severity = "Low";
  let payout = 300;

  if (activeTriggerCount >= 2 && severityScore >= 30) {
    severity = "High";
    payout = 700;
  } else if (severityScore >= 14) {
    severity = "Medium";
    payout = 500;
  }

  const reasons = [];
  if (triggers.rain) reasons.push("Heavy rainfall disruption");
  if (triggers.aqi) reasons.push("Hazardous AQI disruption");
  if (triggers.curfew) reasons.push("Curfew restriction");
  if (triggers.orders) reasons.push("Significant order demand drop");

  return {
    triggered: true,
    approved: true,
    payout,
    severity,
    reasons,
    message: "Auto Claim Approved",
  };
}

function buildInsights(data, premium, triggers, fraud, claim) {
  const activeTriggerCount = Object.values(triggers).filter(Boolean).length;
  const estimatedDailyIncome = Number(data.workingHours || 0) * 90;
  const estimatedWeeklyIncome = estimatedDailyIncome * 6;
  const resilienceScore = clamp(
    100 - premium.weightedScore * 45 - (fraud.flagged ? 25 : 0) + (claim.approved ? 10 : 0),
    0,
    100
  );
  const trustScore = fraud.flagged ? 72 : 94;

  let premiumSignal = "Low to controlled risk week detected.";
  if (premium.weightedScore >= 0.75) {
    premiumSignal = "Very high risk week detected. Premium increased sharply.";
  } else if (premium.weightedScore >= 0.45) {
    premiumSignal = "Moderate risk week detected. Premium increased moderately.";
  }

  return {
    activeTriggerCount,
    resilienceScore,
    trustScore,
    riskBand:
      premium.weightedScore >= 0.75
        ? "High"
        : premium.weightedScore >= 0.45
          ? "Medium"
          : "Low",
    estimatedDailyIncome,
    estimatedWeeklyIncome,
    payoutETA: claim.approved ? "Under 10 minutes" : "Hold / manual review not needed in normal flow",
    premiumSignal,
    judgeNarrative:
      "AI pricing + trigger automation + fraud controls + instant payout",
    impactSummary:
      `PayGuard protects ${data.platform} delivery partners in ${data.city} from external shocks without paperwork.`,
  };
}

function runPayGuardSimulation(payload) {
  validatePayload(payload);

  const normalized = {
    ...payload,
    rainfall: Number(payload.rainfall || 0),
    aqi: Number(payload.aqi || 0),
    orderDrop: Number(payload.orderDrop || 0),
    pastClaims: Number(payload.pastClaims || 0),
    workingHours: Number(payload.workingHours || 0),
    curfew: Boolean(payload.curfew),
    duplicateClaim: Boolean(payload.duplicateClaim),
    systemCity: payload.systemCity || payload.city,
    plan: payload.plan || "weekly",
  };

  const premium = calculatePremium(normalized);
  const triggers = detectTriggers(normalized);
  const fraud = detectFraud(normalized);
  const claim = processClaim(normalized, triggers, fraud);
  const insights = buildInsights(normalized, premium, triggers, fraud, claim);

  return {
    user: {
      name: normalized.name,
      city: normalized.city,
      platform: normalized.platform,
      workingHours: normalized.workingHours,
      pastClaimsCount: normalized.pastClaims,
    },
    policy: {
      coverageType: normalized.coverageType,
      plan: getPlanConfig(normalized.plan).label,
      planType: normalized.plan,
      periodLabel: premium.periodLabel,
      weeklyBasePremium: premium.basePremium,
      recommendedFor:
        normalized.coverageType === "All"
          ? "Workers exposed to mixed urban disruptions"
          : normalized.coverageType === "Rain"
            ? "Cities with heavy weather-linked delivery interruptions"
            : "Cities with severe air quality and restriction risk",
    },
    environment: {
      rainfall: normalized.rainfall,
      aqi: normalized.aqi,
      curfew: normalized.curfew,
      orderDrop: normalized.orderDrop,
      systemCity: normalized.systemCity,
    },
    premium,
    triggers,
    fraud,
    claim,
    insights,
  };
}

module.exports = {
  runPayGuardSimulation,
};
