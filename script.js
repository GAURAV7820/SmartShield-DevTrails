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

function getCoveredPerils(coverageType) {
  if (coverageType === "Rain") {
    return ["rain"];
  }

  if (coverageType === "Pollution") {
    return ["aqi"];
  }

  return ["rain", "aqi", "curfew", "orders"];
}

const form = document.getElementById("payguardForm");
const demoPresetButton = document.getElementById("demoPreset");
const weatherPresetButton = document.getElementById("weatherPreset");
const previewRunButton = document.getElementById("previewRun");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const authShell = document.getElementById("authShell");
const appShell = document.getElementById("appShell");
const userbar = document.getElementById("userbar");
const authMessage = document.getElementById("authMessage");
const showLoginButton = document.getElementById("showLogin");
const showSignupButton = document.getElementById("showSignup");
const logoutButton = document.getElementById("logoutButton");
const opsImpact = document.getElementById("opsImpact");
const formActionStatus = document.getElementById("formActionStatus");
const navButtons = [...document.querySelectorAll(".nav-pill")];

const fields = {
  name: document.getElementById("name"),
  city: document.getElementById("city"),
  platform: document.getElementById("platform"),
  workingHours: document.getElementById("workingHours"),
  coverageType: document.getElementById("coverageType"),
  plan: document.getElementById("plan"),
  rainfall: document.getElementById("rainfall"),
  aqi: document.getElementById("aqi"),
  orderDrop: document.getElementById("orderDrop"),
  curfew: document.getElementById("curfew"),
};

const targets = {
  rainfallValue: document.getElementById("rainfallValue"),
  aqiValue: document.getElementById("aqiValue"),
  orderDropValue: document.getElementById("orderDropValue"),
  summaryUser: document.getElementById("summaryUser"),
  summaryPolicy: document.getElementById("summaryPolicy"),
  premiumAmount: document.getElementById("premiumAmount"),
  premiumDetails: document.getElementById("premiumDetails"),
  policyDetails: document.getElementById("policyDetails"),
  triggerRain: document.getElementById("triggerRain"),
  triggerAqi: document.getElementById("triggerAqi"),
  triggerCurfew: document.getElementById("triggerCurfew"),
  triggerOrders: document.getElementById("triggerOrders"),
  fraudStatus: document.getElementById("fraudStatus"),
  claimStatus: document.getElementById("claimStatus"),
  trustScore: document.getElementById("trustScore"),
  resilienceScore: document.getElementById("resilienceScore"),
  judgeNarrative: document.getElementById("judgeNarrative"),
  heroPremium: document.getElementById("heroPremium"),
  heroPayout: document.getElementById("heroPayout"),
  heroTrust: document.getElementById("heroTrust"),
  heroTriggers: document.getElementById("heroTriggers"),
  heroWorkers: document.getElementById("heroWorkers"),
  heroClaims: document.getElementById("heroClaims"),
  backendStatus: document.getElementById("backendStatus"),
  enrollmentStatus: document.getElementById("enrollmentStatus"),
  protectionProfile: document.getElementById("protectionProfile"),
  portfolioStats: document.getElementById("portfolioStats"),
  recentWorkers: document.getElementById("recentWorkers"),
  recentClaims: document.getElementById("recentClaims"),
  currentUserName: document.getElementById("currentUserName"),
  currentUserMeta: document.getElementById("currentUserMeta"),
};

const authFields = {
  loginPhone: document.getElementById("loginPhone"),
  loginPassword: document.getElementById("loginPassword"),
  signupName: document.getElementById("signupName"),
  signupPhone: document.getElementById("signupPhone"),
  signupPassword: document.getElementById("signupPassword"),
  signupCity: document.getElementById("signupCity"),
  signupPlatform: document.getElementById("signupPlatform"),
  signupHours: document.getElementById("signupHours"),
};

let currentAccount = null;

function formatCurrency(amount) {
  return `Rs. ${amount.toFixed(2)}`;
}

function formatPremium(amount, periodLabel = "week") {
  return `${formatCurrency(amount)} / ${periodLabel}`;
}

function setFormStatus(message, type = "info") {
  formActionStatus.textContent = message;
  formActionStatus.className = `form-action-status is-${type}`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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

function getRiskFactor(city) {
  return cityRiskFactors[city.trim().toLowerCase()] || 1;
}

function getFormData() {
  return {
    name: fields.name.value.trim(),
    city: fields.city.value,
    platform: fields.platform.value,
    workingHours: Number(fields.workingHours.value),
    pastClaims: Number(currentAccount?.pastClaimsCount || 0),
    coverageType: fields.coverageType.value,
    plan: fields.plan.value,
    rainfall: Number(fields.rainfall.value),
    aqi: Number(fields.aqi.value),
    orderDrop: Number(fields.orderDrop.value),
    curfew: fields.curfew.value === "true",
    accountId: currentAccount?.id || null,
  };
}

function setAuthMessage(message, type = "") {
  authMessage.textContent = message;
  authMessage.className = `auth-message ${type}`.trim();
}

function switchAuthTab(mode) {
  const loginActive = mode === "login";
  loginForm.classList.toggle("auth-hidden", !loginActive);
  signupForm.classList.toggle("auth-hidden", loginActive);
  showLoginButton.classList.toggle("active", loginActive);
  showSignupButton.classList.toggle("active", !loginActive);
  setAuthMessage("");
}

function persistAccount(account) {
  currentAccount = account;
  localStorage.setItem("payguardAccount", JSON.stringify(account));
  targets.currentUserName.textContent = account.name;
  targets.currentUserMeta.textContent = `${account.city} | ${account.platform} | ${account.phone}`;

  fields.name.value = account.name;
  fields.city.value = account.city;
  fields.platform.value = account.platform;
  fields.workingHours.value = String(account.workingHours || 10);
  currentAccount.pastClaimsCount = Number(account.pastClaimsCount || 0);

  fields.name.disabled = true;
  fields.platform.disabled = true;

  authShell.classList.add("auth-hidden");
  userbar.classList.remove("auth-hidden");
  appShell.classList.remove("auth-hidden");
  setFormStatus("Profile loaded. Preview updates instantly while you adjust cover settings.", "success");
}

function clearAccount() {
  currentAccount = null;
  localStorage.removeItem("payguardAccount");
  authShell.classList.remove("auth-hidden");
  userbar.classList.add("auth-hidden");
  appShell.classList.add("auth-hidden");
  fields.name.disabled = false;
  fields.platform.disabled = false;
  setFormStatus("Your plan preview updates instantly as city conditions change.", "info");
}

async function restoreSession() {
  const saved = localStorage.getItem("payguardAccount");
  if (!saved) {
    clearAccount();
    return false;
  }

  try {
    const account = JSON.parse(saved);
    const response = await fetch(`/api/auth/profile/${account.id}`);
    if (!response.ok) {
      throw new Error("profile unavailable");
    }

    const data = await response.json();
    persistAccount(data.account);
    return true;
  } catch (_error) {
    clearAccount();
    return false;
  }
}

function renderStackedItems(container, items) {
  container.innerHTML = items
    .map(
      (item) => `
        <div class="stacked-item">
          <span>${item.label}</span>
          <span>${item.value}</span>
        </div>
      `
    )
    .join("");
}

function renderTriggerCard(container, title, active, description, currentValue) {
  container.className = `trigger-card ${active ? "is-active" : "is-inactive"}`;
  container.innerHTML = `
    <h4>${title}</h4>
    <p>${description}</p>
    <p>${currentValue}</p>
    <span class="trigger-status">${active ? "ACTIVE" : "Inactive"}</span>
  `;
}

function renderList(container, items, emptyMessage, formatter) {
  if (!items || items.length === 0) {
    container.innerHTML = `<div class="list-item"><span>${emptyMessage}</span></div>`;
    return;
  }

  container.innerHTML = items.map(formatter).join("");
}

function renderPortfolio(dashboard) {
  const portfolio = dashboard?.portfolio || {
    totalWorkers: 0,
    activePolicies: 0,
    totalClaims: 0,
    approvedClaims: 0,
    totalPayout: 0,
    citiesCovered: 0,
  };

  targets.heroWorkers.textContent = String(portfolio.totalWorkers);
  targets.heroClaims.textContent = String(portfolio.approvedClaims);

  targets.portfolioStats.innerHTML = [
    { label: "Workers onboarded", value: portfolio.totalWorkers },
    { label: "Active covers", value: portfolio.activePolicies },
    { label: "Claim records", value: portfolio.totalClaims },
    { label: "Total payout", value: `Rs. ${portfolio.totalPayout}` },
    { label: "Claims approved", value: portfolio.approvedClaims },
    { label: "Claims blocked", value: portfolio.blockedClaims },
    { label: "Cities covered", value: portfolio.citiesCovered },
    { label: "Risk checks run", value: portfolio.totalSimulations },
  ]
    .map(
      (item) => `
        <div class="portfolio-stat">
          <span>${item.label}</span>
          <strong>${item.value}</strong>
        </div>
      `
    )
    .join("");

  renderList(
    targets.recentWorkers,
    dashboard?.recentWorkers || [],
    "No workers added yet.",
    (worker) => `
      <div class="list-item">
        <strong>${worker.name}</strong>
        <span>${worker.city} | ${worker.platform}</span>
        <span>${worker.workingHours} hrs/day | Past claims: ${worker.pastClaimsCount}</span>
      </div>
    `
  );

  renderList(
    targets.recentClaims,
    dashboard?.recentClaims || [],
    "No payout records yet.",
    (claim) => `
      <div class="list-item">
        <strong>${claim.workerName}</strong>
        <span>${claim.city} | ${claim.platform}</span>
        <span>Severity: ${claim.severity} | Payout: Rs. ${claim.payout}</span>
        <span class="tag ${claim.status === "BLOCKED" ? "blocked" : ""}">${claim.status}</span>
      </div>
    `
  );
}

function updateRangeLabels() {
  targets.rainfallValue.textContent = `${fields.rainfall.value} mm`;
  targets.aqiValue.textContent = fields.aqi.value;
  targets.orderDropValue.textContent = `${fields.orderDrop.value}%`;
}

function renderDashboard(result, options = {}) {
  const { backendMode = true, persisted = false, dashboard = null } = options;
  const {
    user,
    policy,
    environment,
    premium,
    triggers,
    fraud,
    claim,
    insights,
  } = result;

  targets.summaryUser.textContent = `${user.name} | ${user.city} | ${user.platform}`;
  targets.summaryPolicy.textContent = `${policy.coverageType} | ${policy.plan}`;
  targets.premiumAmount.textContent = formatPremium(premium.finalPremium, policy.periodLabel || premium.periodLabel || "week");
  targets.heroPremium.textContent = formatPremium(premium.finalPremium, policy.periodLabel || premium.periodLabel || "week");
  targets.heroPayout.textContent = claim.payout ? `Rs. ${claim.payout}` : "Rs. 0";
  targets.heroTrust.textContent = String(insights.trustScore);
  targets.heroTriggers.textContent = `${insights.activeTriggerCount} alerts`;
  targets.trustScore.textContent = `${insights.trustScore} / 100`;
  targets.resilienceScore.textContent = `${insights.resilienceScore.toFixed(1)} / 100`;
  targets.judgeNarrative.textContent = insights.judgeNarrative;

  if (currentAccount) {
    currentAccount.pastClaimsCount = Number(user.pastClaimsCount || 0);
    localStorage.setItem("payguardAccount", JSON.stringify(currentAccount));
  }

  targets.premiumDetails.innerHTML = [
    `Base weekly price: ${formatCurrency(premium.basePremium)}`,
    `Rain risk input: ${premium.rainfallScore.toFixed(2)}`,
    `Air quality input: ${premium.aqiScore.toFixed(2)}${environment.aqi <= 100 ? " [safe air buffer]" : ""}`,
    `City risk factor: ${premium.riskScore.toFixed(2)} [factor ${getRiskFactor(user.city).toFixed(2)}]`,
    `Claim history impact: ${premium.claimsScore.toFixed(2)}`,
    `Shift exposure impact: ${premium.exposureScore.toFixed(2)} [${user.workingHours} hrs/day]`,
    `Operations impact: ${premium.operationsScore.toFixed(2)}`,
    `Overall risk score: ${premium.weightedScore.toFixed(2)}`,
    `Cover multiplier: ${premium.coverageMultiplier.toFixed(2)}`,
    `Plan discount: ${(premium.planDiscount * 100).toFixed(0)}%`,
    `${insights.premiumSignal}`,
  ]
    .map((detail) => `<li>${detail}</li>`)
    .join("");

  renderStackedItems(targets.policyDetails, [
    { label: "Coverage Type", value: policy.coverageType },
    { label: "Plan", value: policy.plan },
    { label: "Platform", value: user.platform },
    { label: "Working Hours", value: `${user.workingHours} hrs/day` },
    { label: "Best Fit", value: policy.recommendedFor || "Weekly income protection" },
    { label: "Past Claims", value: String(user.pastClaimsCount || 0) },
  ]);

  renderTriggerCard(
    targets.triggerRain,
    "Rainfall Trigger",
    triggers.rain,
    "Support turns on when heavy rain crosses the threshold.",
    `Today's rainfall: ${environment.rainfall} mm`
  );
  renderTriggerCard(
    targets.triggerAqi,
    "AQI Trigger",
    triggers.aqi,
    "Support turns on when air quality becomes hazardous.",
    `Current AQI: ${environment.aqi}`
  );
  renderTriggerCard(
    targets.triggerCurfew,
    "Curfew Trigger",
    triggers.curfew,
    "Support turns on when movement restrictions affect deliveries.",
    `Curfew in effect: ${environment.curfew ? "Yes" : "No"}`
  );
  renderTriggerCard(
    targets.triggerOrders,
    "Order Drop Trigger",
    triggers.orders,
    "Support turns on when demand drops sharply in the city.",
    `Demand drop: ${environment.orderDrop}%`
  );

  opsImpact.textContent =
    environment.curfew || environment.orderDrop >= 45
      ? `Operational pressure is active. Curfew and order-demand slowdown are increasing the protection risk score for this ${policy.coverageType.toLowerCase()} plan.`
      : "Operational pressure is low. Curfew and order-demand conditions are currently not adding much extra risk.";

  renderStackedItems(targets.fraudStatus, [
    { label: "Registered City", value: user.city },
    { label: "System City", value: environment.systemCity },
    {
      label: "Location Check",
      value: fraud.locationMismatch ? "Mismatch detected" : "Verified",
    },
    {
      label: "Duplicate Check",
      value: fraud.duplicateClaim ? "Duplicate request detected" : "No duplicate claim",
    },
    {
      label: "Verification status",
      value: fraud.flagged ? "Blocked until details match" : "Checks passed",
    },
  ]);

  if (!claim.triggered) {
    targets.claimStatus.innerHTML = `
      <span class="claim-badge claim-pending">No support triggered</span>
      <strong class="claim-amount">Rs. 0</strong>
      <div>Your cover is active, but today's conditions have not crossed a payout threshold.</div>
    `;
  } else if (!claim.approved) {
    targets.claimStatus.innerHTML = `
      <span class="claim-badge claim-blocked">Verification required</span>
      <strong class="claim-amount">Rs. 0</strong>
      <div>A payout event was detected, but verification stopped the automatic release.</div>
    `;
  } else {
    targets.claimStatus.innerHTML = `
      <span class="claim-badge claim-approved">Support approved</span>
      <strong class="claim-amount">Rs. ${claim.payout}</strong>
      <div>Severity: ${claim.severity}</div>
      <div>Triggered by: ${claim.reasons.join(", ")}</div>
    `;
  }

  renderStackedItems(targets.backendStatus, [
    { label: "App mode", value: persisted ? "Saved worker flow" : "Preview only" },
    { label: "Service connection", value: backendMode ? "Connected" : "Offline preview" },
    { label: "Risk engine", value: "Live weighted pricing" },
    { label: "City feed", value: backendMode ? "Connected city conditions" : "Manual entry" },
    { label: "Coverage summary", value: insights.impactSummary },
  ]);

  renderStackedItems(targets.protectionProfile, [
    { label: "Risk Band", value: insights.riskBand },
    { label: "Estimated Daily Income", value: `Rs. ${insights.estimatedDailyIncome}` },
    { label: "Estimated Weekly Income", value: `Rs. ${insights.estimatedWeeklyIncome}` },
    { label: "Payout ETA", value: insights.payoutETA },
    { label: "Worker Resilience", value: `${insights.resilienceScore.toFixed(1)} / 100` },
  ]);

  if (result.enrollment) {
    renderStackedItems(targets.enrollmentStatus, [
      { label: "Worker ID", value: result.enrollment.workerId },
      { label: "Cover ID", value: result.enrollment.policyId },
      { label: "Risk check ID", value: result.enrollment.simulationId },
      { label: "Payout ID", value: result.enrollment.claimId || "No payout created" },
      { label: "Record status", value: result.enrollment.status },
    ]);
  } else {
    targets.enrollmentStatus.innerHTML = `
      <div class="list-item">
        <strong>Preview mode</strong>
        <span>Use the main action to save the worker profile, issue cover, and record payout activity.</span>
        <span class="tag preview">Not saved yet</span>
      </div>
    `;
  }

  renderPortfolio(dashboard || { portfolio: { totalWorkers: 0, activePolicies: 0, totalClaims: 0, approvedClaims: 0, totalPayout: 0, blockedClaims: 0, citiesCovered: 0, totalSimulations: 0 }, recentWorkers: [], recentClaims: [] });
}

function createLocalFallbackResult(data) {
  const rainfallScore = clamp(data.rainfall / 200, 0, 1);
  const aqiScore = getAqiRiskScore(data.aqi);
  const riskScore = clamp(getRiskFactor(data.city) / 1.5, 0, 1);
  const claimsScore = clamp(data.pastClaims / 5, 0, 1);
  const exposureScore = getExposureScore(data.workingHours);
  const operationsScore = clamp((data.curfew ? 0.65 : 0) + (clamp(data.orderDrop / 100, 0, 1) * 0.35), 0, 1);
  const weightedScore =
    rainfallScore * 0.24 +
    aqiScore * 0.18 +
    riskScore * 0.18 +
    claimsScore * 0.15 +
    exposureScore * 0.10 +
    operationsScore * 0.15;
  const coverageMultiplier = data.coverageType === "All" ? 1.1 : 1;
  const basePremium = basePremiums[data.coverageType];
  const planMultiplier = data.plan === "annual" ? 48 : 1;
  const planDiscount = data.plan === "annual" ? 0.85 : 1;
  const finalPremium = basePremium * (1 + weightedScore) * coverageMultiplier * planMultiplier * planDiscount;
  const rawTriggers = {
    rain: data.rainfall > 150,
    aqi: data.aqi > 400,
    curfew: data.curfew,
    orders: data.orderDrop >= 45,
  };
  const coveredPerils = new Set(getCoveredPerils(data.coverageType));
  const triggers = {
    rain: coveredPerils.has("rain") ? rawTriggers.rain : false,
    aqi: coveredPerils.has("aqi") ? rawTriggers.aqi : false,
    curfew: coveredPerils.has("curfew") ? rawTriggers.curfew : false,
    orders: coveredPerils.has("orders") ? rawTriggers.orders : false,
  };
  const fraud = {
    locationMismatch: false,
    duplicateClaim: false,
    flagged: false,
  };
  const activeTriggerCount = Object.values(triggers).filter(Boolean).length;
  const reasons = [];
  if (triggers.rain) reasons.push("Heavy rainfall disruption");
  if (triggers.aqi) reasons.push("Hazardous AQI disruption");
  if (triggers.curfew) reasons.push("Curfew restriction");
  if (triggers.orders) reasons.push("Significant order demand drop");

  let claim = {
    triggered: activeTriggerCount > 0,
    approved: false,
    payout: 0,
    severity: "None",
    reasons,
  };

  if (activeTriggerCount > 0 && !fraud.flagged) {
    const score =
      (triggers.rain ? Math.min(Math.floor((data.rainfall - 150) / 10), 20) + 10 : 0) +
      (triggers.aqi ? Math.min(Math.floor((data.aqi - 400) / 10), 20) + 10 : 0) +
      (triggers.curfew ? 18 : 0) +
      (triggers.orders ? Math.min(Math.floor((data.orderDrop - 45) / 2), 15) + 10 : 0);

    let severity = "Low";
    let payout = 300;
    if (activeTriggerCount >= 2 && score >= 30) {
      severity = "High";
      payout = 700;
    } else if (score >= 14) {
      severity = "Medium";
      payout = 500;
    }

    claim = {
      triggered: true,
      approved: true,
      payout,
      severity,
      reasons,
    };
  }

  return {
    user: {
      name: data.name,
      city: data.city,
      platform: data.platform,
      workingHours: data.workingHours,
      pastClaimsCount: data.pastClaims,
    },
    policy: {
      coverageType: data.coverageType,
      plan: data.plan === "annual" ? "Annual PayGuard Plan" : "Weekly PayGuard Plan",
      planType: data.plan,
      periodLabel: data.plan === "annual" ? "year" : "week",
      weeklyBasePremium: basePremium,
    },
    environment: {
      rainfall: data.rainfall,
      aqi: data.aqi,
      curfew: data.curfew,
      orderDrop: data.orderDrop,
      systemCity: data.city,
    },
    premium: {
      rainfallScore,
      aqiScore,
      riskScore,
      claimsScore,
      exposureScore,
      operationsScore,
      weightedScore,
      basePremium,
      coverageMultiplier,
      planDiscount,
      periodLabel: data.plan === "annual" ? "year" : "week",
      finalPremium,
    },
    triggers,
    fraud,
    claim,
    insights: {
      activeTriggerCount,
      resilienceScore: clamp(
        100 - weightedScore * 45 - (fraud.flagged ? 25 : 0) + (claim.approved ? 10 : 0),
        0,
        100
      ),
      trustScore: fraud.flagged ? 72 : 94,
      riskBand:
        weightedScore >= 0.75 ? "High" : weightedScore >= 0.45 ? "Medium" : "Low",
      estimatedDailyIncome: data.workingHours * 90,
      estimatedWeeklyIncome: data.workingHours * 90 * 6,
      payoutETA: claim.approved ? "Under 10 minutes" : "Hold / manual review not needed in normal flow",
      premiumSignal:
        weightedScore >= 0.75
          ? "Very high risk week detected. Premium increased sharply."
          : weightedScore >= 0.45
            ? "Moderate risk week detected. Premium increased moderately."
            : "Low to controlled risk week detected.",
      judgeNarrative:
        "AI pricing + trigger automation + fraud controls + instant payout",
      impactSummary:
        `PayGuard protects ${data.platform} delivery partners in ${data.city} from external shocks without paperwork.`,
    },
  };
}

async function fetchDashboard() {
  try {
    const response = await fetch("/api/dashboard");
    if (!response.ok) {
      throw new Error("dashboard failed");
    }

    const dashboard = await response.json();
    renderPortfolio(dashboard);
    return dashboard;
  } catch (_error) {
    renderPortfolio({
      portfolio: {
        totalWorkers: 0,
        activePolicies: 0,
        totalClaims: 0,
        approvedClaims: 0,
        blockedClaims: 0,
        totalPayout: 0,
        citiesCovered: 0,
        totalSimulations: 0,
      },
      recentWorkers: [],
      recentClaims: [],
    });
    return null;
  }
}

async function signupAccountRequest(payload) {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Signup failed");
  }
  return data.account;
}

async function loginAccountRequest(payload) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }
  return data.account;
}

function setButtonsBusy(busy, source = "") {
  const buttonConfigs = [
    {
      button: form.querySelector('button[type="submit"]'),
      source: "save",
      busyLabel: "Saving cover...",
    },
    {
      button: previewRunButton,
      source: "preview",
      busyLabel: "Refreshing preview...",
    },
    {
      button: weatherPresetButton,
      source: "weather",
      busyLabel: "Loading city conditions...",
    },
    {
      button: demoPresetButton,
      source: "demo",
      busyLabel: "Loading demo scenario...",
    },
  ];

  buttonConfigs.forEach(({ button, source: buttonSource, busyLabel }) => {
    if (!button) {
      return;
    }

    if (!button.dataset.defaultLabel) {
      button.dataset.defaultLabel = button.textContent.trim();
    }

    button.disabled = busy;
    button.textContent = busy && source === buttonSource ? busyLabel : button.dataset.defaultLabel;
  });
}

function activateNav(targetId) {
  navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.target === targetId);
  });
}

function loadScenario(preset, preserveProfile = true) {
  if (!preserveProfile) {
    fields.name.value = preset.name;
    fields.city.value = preset.city;
    fields.platform.value = preset.platform;
  }

  fields.workingHours.value = String(preset.workingHours);
  fields.coverageType.value = preset.coverageType;
  fields.plan.value = preset.plan;
  fields.rainfall.value = String(preset.rainfall);
  fields.aqi.value = String(preset.aqi);
  fields.orderDrop.value = String(preset.orderDrop);
  fields.curfew.value = String(preset.curfew);
  updateRangeLabels();
}

async function runSimulation(persist = false, source = "preview") {
  const data = getFormData();
  setButtonsBusy(true, source);

  try {
    const response = await fetch(persist ? "/api/enroll" : "/api/simulate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || "Backend simulation failed");
    }

    const result = payload;
    const dashboard = persist
      ? result.dashboard
      : await fetchDashboard();
    renderDashboard(result, { backendMode: true, persisted: persist, dashboard });
    setFormStatus(
      persist
        ? "Cover saved successfully. Worker record, policy, and payout checks have been updated."
        : "Preview refreshed. You can save the current cover when it looks right.",
      "success"
    );
  } catch (_error) {
    const fallbackResult = createLocalFallbackResult(data);
    renderDashboard(fallbackResult, { backendMode: false, persisted: false, dashboard: null });
    setFormStatus(
      persist
        ? "Live save was unavailable, so the app showed an offline preview instead of recording data."
        : "Backend was unavailable, so this preview is running in local offline mode.",
      "warning"
    );
  } finally {
    setButtonsBusy(false);
  }
}

async function useMockWeather() {
  const city = fields.city.value;
  setButtonsBusy(true, "weather");

  try {
    const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
    if (!response.ok) {
      throw new Error("Weather fetch failed");
    }

    const weather = await response.json();
    fields.rainfall.value = String(weather.rainfall);
    fields.aqi.value = String(weather.aqi);
    fields.orderDrop.value = String(weather.orderDrop);
    fields.curfew.value = String(Boolean(weather.curfew));
    updateRangeLabels();
    setFormStatus(`Loaded live city conditions for ${city}.`, "success");
    await runSimulation(false, "weather");
  } catch (_error) {
    updateRangeLabels();
    setFormStatus(`Could not load city conditions for ${city}, so the current manual values were kept.`, "warning");
    await runSimulation(false, "weather");
  } finally {
    setButtonsBusy(false);
  }
}

function loadWinningDemo() {
  loadScenario(
    {
      name: "Ravi",
      city: "Mumbai",
      platform: "Zomato",
      workingHours: 10,
      coverageType: "All",
      plan: "weekly",
      rainfall: 220,
      aqi: 435,
      orderDrop: 55,
      curfew: true,
    },
    Boolean(currentAccount)
  );
  setFormStatus(
    currentAccount
      ? "Demo scenario loaded on your current worker profile."
      : "Sample worker and demo scenario loaded for preview.",
    "success"
  );
  runSimulation(false, "demo");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  updateRangeLabels();
  runSimulation(true, "save");
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const account = await loginAccountRequest({
      phone: authFields.loginPhone.value,
      password: authFields.loginPassword.value,
    });
    persistAccount(account);
    setAuthMessage("Login successful.", "success");
    fetchDashboard();
    runSimulation(false, "preview");
  } catch (error) {
    setAuthMessage(error.message, "error");
  }
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const account = await signupAccountRequest({
      name: authFields.signupName.value.trim(),
      phone: authFields.signupPhone.value,
      password: authFields.signupPassword.value,
      city: authFields.signupCity.value,
      platform: authFields.signupPlatform.value,
      workingHours: Number(authFields.signupHours.value),
    });
    persistAccount(account);
    setAuthMessage("Account created successfully.", "success");
    fetchDashboard();
    runSimulation(false, "preview");
  } catch (error) {
    setAuthMessage(error.message, "error");
  }
});

[fields.rainfall, fields.aqi, fields.orderDrop].forEach((field) => {
  field.addEventListener("input", () => {
    updateRangeLabels();
    runSimulation(false, "preview");
  });
});

[
  fields.name,
  fields.city,
  fields.platform,
  fields.workingHours,
  fields.coverageType,
  fields.plan,
  fields.curfew,
].forEach((field) => {
  field.addEventListener("change", () => runSimulation(false, "preview"));
});

demoPresetButton.addEventListener("click", loadWinningDemo);
weatherPresetButton.addEventListener("click", useMockWeather);
previewRunButton.addEventListener("click", () => runSimulation(false, "preview"));
showLoginButton.addEventListener("click", () => switchAuthTab("login"));
showSignupButton.addEventListener("click", () => switchAuthTab("signup"));
logoutButton.addEventListener("click", clearAccount);
navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const section = document.getElementById(button.dataset.target);
    if (!section) {
      return;
    }

    activateNav(button.dataset.target);
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

updateRangeLabels();
switchAuthTab("login");
restoreSession().then((loggedIn) => {
  if (loggedIn) {
    fetchDashboard();
    runSimulation(false, "preview");
  }
});
