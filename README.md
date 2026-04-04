# 🚀 PayGuard AI

### Zero-Touch Income Protection for Delivery Partners

---

## 📌 Overview

**PayGuard AI** is an AI-powered parametric insurance platform built specifically for **food delivery partners (Zomato/Swiggy) operating in high-risk urban zones**.

It protects workers from income loss caused by real-world disruptions such as **heavy rainfall, air pollution, curfews, and order drops** — using a fully automated, zero-touch insurance model.

---

## 🎯 What Makes PayGuard AI Different

Unlike traditional or generic hackathon solutions, PayGuard AI simulates a **real insurance system**:

* 🧾 Worker onboarding with reusable profiles
* 📑 Policy issuance & active policy tracking
* 🧪 Live preview mode (test scenarios without saving)
* 📊 Admin dashboard with portfolio insights
* 📜 Claims ledger for transparency

---

## 🧠 AI-Powered Risk Model

We implement a **weighted risk scoring system**:

[
RiskScore = 0.5 \times Rainfall + 0.3 \times AQI + 0.2 \times PastClaims
]

### This enables:

* Dynamic weekly premium calculation
* Risk classification (Low / Medium / High)
* Automated claim triggering

---

## ⚙️ How It Works

```text
User Registration
   ↓
Policy Creation (Weekly Coverage)
   ↓
AI Risk Calculation
   ↓
Disruption Detection (Rain / AQI / Curfew / Orders)
   ↓
Auto Claim Triggered
   ↓
Instant Payout 💰
```

---

## 🔥 Key Features

### 🧾 Insurance System Simulation

* Worker onboarding & storage
* Policy creation & tracking
* Claims ledger for transparency

### 🤖 AI-Based Pricing

* Dynamic premium using environmental + behavioral signals
* Risk-based pricing adjustments

### ⚡ Zero-Touch Claims

* No manual claim requests
* Automatic trigger detection
* Instant payout processing

### 🔍 Fraud Detection

* Location mismatch detection
* Duplicate claim prevention

### 📊 Dashboard

* Workers, policies, claims overview
* Total payout tracking
* Recent claims log

---

## 🧪 Automated Triggers

The system monitors parametric conditions:

* 🌧️ Rainfall > 150mm
* 🌫️ AQI > 400
* 🚫 Curfew / restricted zones
* 📉 Order volume drop

---

## 🛠️ Tech Stack

* **Frontend:** HTML, CSS, JavaScript
* **Backend:** Node.js, Express.js
* **AI Logic:** Weighted Risk Scoring Model
* **APIs:** Mock Weather API (extendable to real APIs)

---

## 🧑‍💻 System Architecture

```text
Frontend (UI)
        ↓
Backend (Node.js)
        ↓
Risk Engine (AI Logic)
        ↓
Trigger Detection System
        ↓
Auto Claim & Payout Engine
```

---

## 🎥 Demo Scenario (Recommended)

Use this scenario for a strong demo:

* Name: Ravi
* City: Mumbai
* Platform: Zomato
* Working Hours: 10
* Past Claims: 1
* Coverage: All
* Rainfall: 220
* AQI: 435
* Curfew: Yes
* Order Drop: 55

### Expected Output:

* Premium dynamically increases
* All triggers activate
* Fraud checks pass
* ✅ Auto claim approved
* 💰 Payout: ₹700

---

## ▶️ How to Run

### 🔹 Full Stack Mode

```bash
npm install
npm start
```

Visit:
`http://localhost:3000`

---

### 🔹 Static Mode (Quick Demo)

```bash
open index.html
```

## Deploy On Render

PayGuard is ready to deploy on Render as a Node web service.

1. Push this project to GitHub.
2. In Render, create a new `Web Service` from the repo.
3. Use:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add a persistent disk:
   - Mount Path: `/var/data`
   - Size: `1 GB`
5. Add this environment variable:
   - `PAYGUARD_DATA_DIR=/var/data/payguard`

Why this matters:

- PayGuard stores accounts, workers, policies, and claims in a local JSON file.
- The persistent disk keeps that data after restarts and redeploys.

You can also deploy with the included [render.yaml](/Users/archa/SmartShield/render.yaml).

---

## 📁 Project Structure

```text
index.html
styles.css
script.js
server.js
services/
 ├── mockWeather.js
 └── riskEngine.js
```

---

## 💻 C++ Backup Prototype

A console-based version is included for logic validation:

```bash
g++ -std=c++17 -o payguard main.cpp
./payguard
```

---

## 🚧 Challenges

* Designing a fair and explainable premium model
* Simulating real-world disruptions
* Building a complete insurance flow under time constraints
* Making AI logic simple yet meaningful

---

## 📚 What We Learned

* Practical implementation of parametric insurance
* AI-driven decision systems without heavy ML
* Importance of automation in financial products
* Building demo-ready systems under hackathon pressure

---

## 🌍 Impact

PayGuard AI ensures that delivery partners are not financially vulnerable to uncontrollable external events.

👉 This is not just insurance — it is **predictive income protection**.

---

## 🏆 Built For

Guidewire DevTrails 2026 Hackathon 🚀

---
