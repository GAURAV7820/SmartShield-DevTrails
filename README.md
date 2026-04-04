# PayGuard

PayGuard is now available in two prototype formats inside this project:

- a browser-based web app for polished demo presentations
- a C++ console prototype for logic validation and offline backup

## What Makes It Feel Like A Real Insurance System

- worker onboarding with reusable worker records
- policy issuance and active-policy tracking
- live preview mode for underwriting without saving
- persisted enrollment mode for real worker + policy + claim ledger creation
- admin portfolio dashboard with workers, policies, claims, and total payout
- recent claims ledger to show operational transparency during demo

## Web App Features

- worker registration with city, platform, and working-hours input
- weekly policy setup with Rain, Pollution, or All coverage
- AI-style dynamic premium pricing using weighted risk scoring
- automated trigger detection for rain, AQI, curfew, and order drop
- zero-touch claim approval and payout calculation
- fraud detection using location mismatch and duplicate-claim rules
- hackathon-friendly dashboard with trust and resilience metrics

## Run The Website

Recommended full-stack option:

```bash
cd /Users/archa/SmartShield
npm install
npm start
```

Then visit:

```bash
http://localhost:3000
```

Quick static fallback:

```bash
cd /Users/archa/SmartShield
open index.html
```

## Main Web Files

- `index.html`
- `styles.css`
- `script.js`
- `server.js`
- `services/mockWeather.js`
- `services/riskEngine.js`

## Winning Demo Scenario

Use these values for a strong live demo:

- Name: Ravi
- City: Mumbai
- Platform: Zomato
- Working Hours: 10
- Past Claims Count: 1
- Coverage: All
- Rainfall: 220
- AQI: 435
- Curfew: Yes
- Order Drop: 55
- System City: Mumbai
- Existing claim in cycle: No

Expected outcome:

- premium rises dynamically due to high-risk conditions
- all 4 parametric triggers activate
- fraud checks pass
- auto-claim is approved
- payout reaches `Rs. 700`

## C++ Backup Prototype

You still have the console version available in [main.cpp](/Users/archa/SmartShield/main.cpp).

Build and run it with:

```bash
cd /Users/archa/SmartShield
g++ -std=c++17 -Wall -Wextra -pedantic -o smartshield main.cpp
./smartshield
```
