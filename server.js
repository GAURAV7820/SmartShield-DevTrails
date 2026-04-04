const express = require("express");
const path = require("path");
const { getMockWeatherByCity } = require("./services/mockWeather");
const { runPayGuardSimulation } = require("./services/riskEngine");
const {
  ensureStore,
  getAccountProfile,
  getDashboardSnapshot,
  getHistoricalClaimsCount,
  hasClaimInCurrentCycle,
  issuePolicy,
  loginAccount,
  recordClaim,
  recordSimulation,
  signupAccount,
  upsertWorker,
} = require("./services/store");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "127.0.0.1";

ensureStore();

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});
app.use(express.static(path.join(__dirname), { etag: false, lastModified: false }));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "PayGuard API",
    date: new Date().toISOString(),
  });
});

app.get("/api/weather", (req, res) => {
  const city = req.query.city || "Mumbai";
  const weather = getMockWeatherByCity(city);
  res.json({
    source: "mock-weather-engine",
    city,
    ...weather,
  });
});

function enrichSystemContext(payload) {
  const accountProfile = payload.accountId ? getAccountProfile(payload.accountId) : null;
  const systemCity = accountProfile?.city || payload.city;

  return {
    ...payload,
    systemCity,
    duplicateClaim: hasClaimInCurrentCycle(payload),
    pastClaims: getHistoricalClaimsCount(payload),
  };
}

app.post("/api/simulate", (req, res) => {
  try {
    const result = runPayGuardSimulation(enrichSystemContext(req.body || {}));
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: "Simulation failed",
      message: error.message,
    });
  }
});

app.post("/api/auth/signup", (req, res) => {
  try {
    const account = signupAccount(req.body || {});
    res.json({
      message: "Signup successful",
      account: {
        id: account.id,
        name: account.name,
        phone: account.phone,
        city: account.city,
        platform: account.platform,
        workingHours: account.workingHours,
        pastClaimsCount: getHistoricalClaimsCount(account),
      },
    });
  } catch (error) {
    res.status(400).json({
      error: "Signup failed",
      message: error.message,
    });
  }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const account = loginAccount(req.body?.phone, req.body?.password);
    res.json({
      message: "Login successful",
      account: {
        id: account.id,
        name: account.name,
        phone: account.phone,
        city: account.city,
        platform: account.platform,
        workingHours: account.workingHours,
        pastClaimsCount: getHistoricalClaimsCount(account),
      },
    });
  } catch (error) {
    res.status(401).json({
      error: "Login failed",
      message: error.message,
    });
  }
});

app.get("/api/auth/profile/:accountId", (req, res) => {
  const profile = getAccountProfile(req.params.accountId);
  if (!profile) {
    return res.status(404).json({
      error: "Profile not found",
    });
  }

  res.json({
    account: {
      id: profile.id,
      name: profile.name,
      phone: profile.phone,
      city: profile.city,
      platform: profile.platform,
      workingHours: profile.workingHours,
      pastClaimsCount: getHistoricalClaimsCount(profile),
    },
  });
});

app.post("/api/enroll", (req, res) => {
  try {
    const payload = enrichSystemContext(req.body || {});
    const result = runPayGuardSimulation(payload);
    const worker = upsertWorker(payload);
    const policy = issuePolicy(worker.id, result.policy);
    const simulation = recordSimulation(worker, policy, result);
    const claim = recordClaim(worker, policy, simulation, result);
    const dashboard = getDashboardSnapshot();

    res.json({
      ...result,
      enrollment: {
        workerId: worker.id,
        policyId: policy.id,
        simulationId: simulation.id,
        claimId: claim ? claim.id : null,
        status: claim?.status || "SIMULATION_RECORDED",
      },
      dashboard,
    });
  } catch (error) {
    res.status(400).json({
      error: "Enrollment failed",
      message: error.message,
    });
  }
});

app.get("/api/dashboard", (_req, res) => {
  res.json(getDashboardSnapshot());
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`PayGuard running on http://${HOST}:${PORT}`);
});
