const fs = require("fs");
const path = require("path");

const defaultDataDir = path.join(__dirname, "..", "data");
const dataDir = process.env.PAYGUARD_DATA_DIR || process.env.RENDER_DISK_PATH || defaultDataDir;
const storePath = path.join(dataDir, "payguard-store.json");

function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(storePath)) {
    fs.writeFileSync(
      storePath,
      JSON.stringify(
        {
          accounts: [],
          workers: [],
          policies: [],
          simulations: [],
          claims: [],
        },
        null,
        2
      )
    );
  }
}

function hydrateStoreShape(store) {
  return {
    accounts: Array.isArray(store.accounts) ? store.accounts : [],
    workers: Array.isArray(store.workers) ? store.workers : [],
    policies: Array.isArray(store.policies) ? store.policies : [],
    simulations: Array.isArray(store.simulations) ? store.simulations : [],
    claims: Array.isArray(store.claims) ? store.claims : [],
  };
}

function readStore() {
  ensureStore();
  const parsed = JSON.parse(fs.readFileSync(storePath, "utf8"));
  const hydrated = hydrateStoreShape(parsed);

  if (JSON.stringify(parsed) !== JSON.stringify(hydrated)) {
    fs.writeFileSync(storePath, JSON.stringify(hydrated, null, 2));
  }

  return hydrated;
}

function writeStore(store) {
  ensureStore();
  fs.writeFileSync(storePath, JSON.stringify(hydrateStoreShape(store), null, 2));
}

function buildId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function sanitizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function findWorkerIndex(store, payload) {
  return store.workers.findIndex((worker) => {
    return (
      normalize(worker.name) === normalize(payload.name) &&
      normalize(worker.city) === normalize(payload.city) &&
      normalize(worker.platform) === normalize(payload.platform)
    );
  });
}

function findWorker(store, payload) {
  const index = findWorkerIndex(store, payload);
  return index >= 0 ? store.workers[index] : null;
}

function findAccountByPhone(store, phone) {
  return store.accounts.find((account) => account.phone === sanitizePhone(phone));
}

function signupAccount(payload) {
  const store = readStore();
  const timestamp = new Date().toISOString();
  const phone = sanitizePhone(payload.phone);

  if (!phone || phone.length < 10) {
    throw new Error("Phone number must be at least 10 digits");
  }

  if (!payload.password || String(payload.password).length < 4) {
    throw new Error("Password must be at least 4 characters");
  }

  if (findAccountByPhone(store, phone)) {
    throw new Error("Account already exists for this phone number");
  }

  const account = {
    id: buildId("acc"),
    name: payload.name,
    phone,
    password: String(payload.password),
    city: payload.city,
    platform: payload.platform,
    workingHours: Number(payload.workingHours || 0),
    createdAt: timestamp,
    lastLoginAt: timestamp,
  };

  store.accounts.unshift(account);
  writeStore(store);
  return account;
}

function loginAccount(phone, password) {
  const store = readStore();
  const account = findAccountByPhone(store, phone);

  if (!account || account.password !== String(password || "")) {
    throw new Error("Invalid phone number or password");
  }

  account.lastLoginAt = new Date().toISOString();
  writeStore(store);
  return account;
}

function getAccountProfile(accountId) {
  const store = readStore();
  return store.accounts.find((account) => account.id === accountId) || null;
}

function hasClaimInCurrentCycle(payload) {
  const store = readStore();
  const worker = findWorker(store, payload);

  if (!worker) {
    return false;
  }

  const cycleStart = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return store.claims.some((claim) => {
    const createdAt = new Date(claim.createdAt).getTime();
    return (
      claim.workerId === worker.id &&
      claim.status === "APPROVED" &&
      createdAt >= cycleStart
    );
  });
}

function getHistoricalClaimsCount(payload) {
  const store = readStore();
  const worker = findWorker(store, payload);

  if (!worker) {
    return 0;
  }

  return store.claims.filter((claim) => {
    return claim.workerId === worker.id && claim.status === "APPROVED";
  }).length;
}

function upsertWorker(payload) {
  const store = readStore();
  const workerIndex = findWorkerIndex(store, payload);
  const timestamp = new Date().toISOString();

  if (workerIndex >= 0) {
    const updatedWorker = {
      ...store.workers[workerIndex],
      workingHours: Number(payload.workingHours || store.workers[workerIndex].workingHours || 0),
      pastClaimsCount: Number(payload.pastClaims || 0),
      lastSeenAt: timestamp,
    };
    store.workers[workerIndex] = updatedWorker;
    writeStore(store);
    return updatedWorker;
  }

  const worker = {
    id: buildId("wrk"),
    name: payload.name,
    city: payload.city,
    platform: payload.platform,
    workingHours: Number(payload.workingHours || 0),
    pastClaimsCount: Number(payload.pastClaims || 0),
    createdAt: timestamp,
    lastSeenAt: timestamp,
  };

  store.workers.unshift(worker);
  writeStore(store);
  return worker;
}

function issuePolicy(workerId, policy) {
  const store = readStore();
  const timestamp = new Date().toISOString();

  const policyRecord = {
    id: buildId("pol"),
    workerId,
    coverageType: policy.coverageType,
    plan: policy.plan,
    weeklyBasePremium: policy.weeklyBasePremium,
    status: "ACTIVE",
    createdAt: timestamp,
  };

  store.policies.unshift(policyRecord);
  writeStore(store);
  return policyRecord;
}

function recordSimulation(worker, policy, result) {
  const store = readStore();
  const timestamp = new Date().toISOString();

  const simulation = {
    id: buildId("sim"),
    workerId: worker.id,
    policyId: policy.id,
    city: worker.city,
    platform: worker.platform,
    premium: Number(result.premium.finalPremium.toFixed(2)),
    activeTriggerCount: result.insights.activeTriggerCount,
    trustScore: result.insights.trustScore,
    claimApproved: result.claim.approved,
    createdAt: timestamp,
  };

  store.simulations.unshift(simulation);
  writeStore(store);
  return simulation;
}

function recordClaim(worker, policy, simulation, result) {
  if (!result.claim.triggered) {
    return null;
  }

  const store = readStore();
  const timestamp = new Date().toISOString();

  const claim = {
    id: buildId("clm"),
    workerId: worker.id,
    policyId: policy.id,
    simulationId: simulation.id,
    workerName: worker.name,
    city: worker.city,
    platform: worker.platform,
    status: result.claim.approved ? "APPROVED" : "BLOCKED",
    payout: result.claim.approved ? result.claim.payout : 0,
    severity: result.claim.severity,
    reasons: result.claim.reasons,
    premium: Number(result.premium.finalPremium.toFixed(2)),
    createdAt: timestamp,
  };

  store.claims.unshift(claim);
  writeStore(store);
  return claim;
}

function getDashboardSnapshot() {
  const store = readStore();
  const approvedClaims = store.claims.filter((claim) => claim.status === "APPROVED");
  const blockedClaims = store.claims.filter((claim) => claim.status === "BLOCKED");
  const totalPayout = approvedClaims.reduce((sum, claim) => sum + Number(claim.payout || 0), 0);

  const cityCoverage = new Set(store.workers.map((worker) => normalize(worker.city)).filter(Boolean));

  return {
    portfolio: {
      totalWorkers: store.workers.length,
      activePolicies: store.policies.filter((policy) => policy.status === "ACTIVE").length,
      totalSimulations: store.simulations.length,
      totalClaims: store.claims.length,
      approvedClaims: approvedClaims.length,
      blockedClaims: blockedClaims.length,
      totalPayout,
      citiesCovered: cityCoverage.size,
    },
    recentWorkers: store.workers.slice(0, 5),
    recentClaims: store.claims.slice(0, 5),
    recentSimulations: store.simulations.slice(0, 5),
  };
}

module.exports = {
  ensureStore,
  signupAccount,
  loginAccount,
  getAccountProfile,
  hasClaimInCurrentCycle,
  getHistoricalClaimsCount,
  upsertWorker,
  issuePolicy,
  recordSimulation,
  recordClaim,
  getDashboardSnapshot,
};
