#include <algorithm>
#include <iomanip>
#include <iostream>
#include <limits>
#include <map>
#include <sstream>
#include <string>
#include <vector>

using namespace std;

struct User {
    string name;
    string city;
    string platform;
    int workingHours = 0;
    int pastClaimsCount = 0;
};

struct Policy {
    string coverageType;
    string planName;
    double weeklyBasePremium = 0.0;
};

struct EnvironmentData {
    double rainfallMm = 0.0;
    int aqi = 0;
    bool curfew = false;
    int orderDropPercent = 0;
    string systemCity;
};

struct PremiumBreakdown {
    double rainfallScore = 0.0;
    double aqiScore = 0.0;
    double riskScore = 0.0;
    double claimsScore = 0.0;
    double weightedScore = 0.0;
    double finalPremium = 0.0;
};

struct TriggerResult {
    bool rainTrigger = false;
    bool aqiTrigger = false;
    bool curfewTrigger = false;
    bool orderDropTrigger = false;

    bool anyTriggered() const {
        return rainTrigger || aqiTrigger || curfewTrigger || orderDropTrigger;
    }
};

struct FraudResult {
    bool locationMismatch = false;
    bool duplicateClaim = false;

    bool flagged() const {
        return locationMismatch || duplicateClaim;
    }
};

struct ClaimResult {
    bool triggered = false;
    bool approved = false;
    int payout = 0;
    string severity;
    vector<string> reasons;
};

string toLowerCopy(string value) {
    transform(value.begin(), value.end(), value.begin(),
              [](unsigned char c) { return static_cast<char>(tolower(c)); });
    return value;
}

string trim(const string& value) {
    size_t start = value.find_first_not_of(" \t\r\n");
    if (start == string::npos) {
        return "";
    }

    size_t end = value.find_last_not_of(" \t\r\n");
    return value.substr(start, end - start + 1);
}

void printDivider() {
    cout << "\n============================================================\n";
}

void printSection(const string& title) {
    printDivider();
    cout << title << '\n';
    printDivider();
}

void clearInputBuffer() {
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
}

int readInt(const string& prompt, int minValue, int maxValue) {
    while (true) {
        cout << prompt;
        int value;
        if (cin >> value && value >= minValue && value <= maxValue) {
            clearInputBuffer();
            return value;
        }

        cout << "Invalid input. Please enter a value between "
             << minValue << " and " << maxValue << ".\n";
        cin.clear();
        clearInputBuffer();
    }
}

double readDouble(const string& prompt, double minValue, double maxValue) {
    while (true) {
        cout << prompt;
        double value;
        if (cin >> value && value >= minValue && value <= maxValue) {
            clearInputBuffer();
            return value;
        }

        cout << "Invalid input. Please enter a value between "
             << minValue << " and " << maxValue << ".\n";
        cin.clear();
        clearInputBuffer();
    }
}

string readLine(const string& prompt) {
    while (true) {
        cout << prompt;
        string value;
        getline(cin, value);
        value = trim(value);
        if (!value.empty()) {
            return value;
        }
        cout << "This field cannot be empty. Please try again.\n";
    }
}

bool readYesNo(const string& prompt) {
    while (true) {
        string value = toLowerCopy(readLine(prompt));
        if (value == "yes" || value == "y") {
            return true;
        }
        if (value == "no" || value == "n") {
            return false;
        }
        cout << "Please enter yes or no.\n";
    }
}

double getCityRiskFactor(const string& city) {
    static const map<string, double> riskFactors = {
        {"mumbai", 1.35},
        {"delhi", 1.40},
        {"bangalore", 1.10},
        {"bengaluru", 1.10},
        {"hyderabad", 1.05},
        {"chennai", 1.20},
        {"kolkata", 1.15},
        {"pune", 1.00},
        {"ahmedabad", 0.95}
    };

    string normalized = toLowerCopy(city);
    auto it = riskFactors.find(normalized);
    if (it != riskFactors.end()) {
        return it->second;
    }
    return 1.00;
}

User registerUser() {
    printSection("1. Registration Module");

    User user;
    user.name = readLine("Enter delivery partner name: ");
    user.city = readLine("Enter city: ");

    while (true) {
        string platform = toLowerCopy(readLine("Choose platform (Zomato/Swiggy): "));
        if (platform == "zomato") {
            user.platform = "Zomato";
            break;
        }
        if (platform == "swiggy") {
            user.platform = "Swiggy";
            break;
        }
        cout << "Please choose either Zomato or Swiggy.\n";
    }

    user.workingHours = readInt("Enter daily working hours (1-16): ", 1, 16);
    user.pastClaimsCount = readInt("Enter past claims count (0-10): ", 0, 10);

    cout << "\nRegistration successful.\n";
    cout << "Stored User: " << user.name << " | " << user.city
         << " | " << user.platform << " | " << user.workingHours
         << " hrs/day\n";

    return user;
}

Policy createPolicy() {
    printSection("2. Insurance Policy Management");

    Policy policy;
    while (true) {
        cout << "Coverage Options:\n";
        cout << "1. Rain Shield\n";
        cout << "2. Pollution Shield\n";
        cout << "3. All Risk Shield\n";

        int choice = readInt("Select coverage type (1-3): ", 1, 3);
        if (choice == 1) {
            policy.coverageType = "Rain";
            policy.weeklyBasePremium = 79.0;
            break;
        }
        if (choice == 2) {
            policy.coverageType = "Pollution";
            policy.weeklyBasePremium = 89.0;
            break;
        }
        policy.coverageType = "All";
        policy.weeklyBasePremium = 109.0;
        break;
    }

    policy.planName = "Weekly SmartShield Plan";

    cout << "\nPolicy created successfully.\n";
    cout << "Plan Name       : " << policy.planName << '\n';
    cout << "Coverage Type   : " << policy.coverageType << '\n';
    cout << "Base Premium    : Rs. " << fixed << setprecision(2)
         << policy.weeklyBasePremium << " / week\n";

    return policy;
}

PremiumBreakdown calculatePremium(const User& user, const Policy& policy,
                                  const EnvironmentData& env) {
    PremiumBreakdown breakdown;

    breakdown.rainfallScore = min(env.rainfallMm / 200.0, 1.0);
    breakdown.aqiScore = min(env.aqi / 500.0, 1.0);
    breakdown.riskScore = min(getCityRiskFactor(user.city) / 1.5, 1.0);
    breakdown.claimsScore = min(user.pastClaimsCount / 5.0, 1.0);

    double coverageBoost = (policy.coverageType == "All") ? 1.10 : 1.00;

    // Weighted scoring simulates a simple explainable ML risk model.
    breakdown.weightedScore =
        (breakdown.rainfallScore * 0.30) +
        (breakdown.aqiScore * 0.25) +
        (breakdown.riskScore * 0.25) +
        (breakdown.claimsScore * 0.20);

    breakdown.finalPremium =
        policy.weeklyBasePremium * (1.0 + breakdown.weightedScore) * coverageBoost;

    return breakdown;
}

EnvironmentData captureEnvironmentData(const User& user) {
    printSection("3. Environment Simulation Dashboard");

    EnvironmentData env;
    env.rainfallMm = readDouble("Enter rainfall in mm (0-500): ", 0.0, 500.0);
    env.aqi = readInt("Enter AQI level (0-600): ", 0, 600);
    env.curfew = readYesNo("Is curfew active? (yes/no): ");
    env.orderDropPercent = readInt("Enter order drop percentage (0-100): ", 0, 100);

    bool useSameCity = readYesNo("Use same system city as registered city? (yes/no): ");
    if (useSameCity) {
        env.systemCity = user.city;
    } else {
        env.systemCity = readLine("Enter current system city for fraud check: ");
    }

    return env;
}

void showPremiumBreakdown(const User& user, const Policy& policy,
                          const EnvironmentData& env,
                          const PremiumBreakdown& breakdown) {
    printSection("4. AI Dynamic Premium Calculation");

    cout << fixed << setprecision(2);
    cout << "Base Weekly Premium          : Rs. " << policy.weeklyBasePremium << '\n';
    cout << "Rainfall Score (30%)         : " << breakdown.rainfallScore << '\n';
    cout << "AQI Score (25%)              : " << breakdown.aqiScore << '\n';
    cout << "City Risk Score (25%)        : " << breakdown.riskScore
         << "  [Risk Factor: " << getCityRiskFactor(user.city) << "]\n";
    cout << "Past Claims Score (20%)      : " << breakdown.claimsScore << '\n';
    cout << "Weighted Risk Score          : " << breakdown.weightedScore << '\n';
    cout << "Coverage Multiplier          : "
         << ((policy.coverageType == "All") ? "1.10 (All Risk Shield)" : "1.00") << '\n';
    cout << "Final Weekly Premium         : Rs. " << breakdown.finalPremium << '\n';

    cout << "\nPremium Insight: ";
    if (breakdown.weightedScore >= 0.75) {
        cout << "Very high risk week detected. Premium increased sharply.\n";
    } else if (breakdown.weightedScore >= 0.45) {
        cout << "Moderate risk week detected. Premium increased moderately.\n";
    } else {
        cout << "Low to controlled risk week detected. Premium remains competitive.\n";
    }

    cout << "Dynamic Inputs Used          : Rainfall=" << env.rainfallMm
         << " mm, AQI=" << env.aqi
         << ", Curfew=" << (env.curfew ? "Yes" : "No")
         << ", Order Drop=" << env.orderDropPercent << "%\n";
}

TriggerResult detectTriggers(const EnvironmentData& env) {
    TriggerResult result;
    result.rainTrigger = env.rainfallMm > 150.0;
    result.aqiTrigger = env.aqi > 400;
    result.curfewTrigger = env.curfew;
    result.orderDropTrigger = env.orderDropPercent >= 45;
    return result;
}

void showTriggers(const TriggerResult& triggers, const EnvironmentData& env) {
    printSection("5. Parametric Trigger Detection");

    cout << "Rain Trigger      : " << (triggers.rainTrigger ? "ACTIVE" : "Inactive")
         << "  [Rainfall > 150 mm, current " << env.rainfallMm << "]\n";
    cout << "AQI Trigger       : " << (triggers.aqiTrigger ? "ACTIVE" : "Inactive")
         << "  [AQI > 400, current " << env.aqi << "]\n";
    cout << "Curfew Trigger    : " << (triggers.curfewTrigger ? "ACTIVE" : "Inactive")
         << "  [Curfew flag = " << (env.curfew ? "Yes" : "No") << "]\n";
    cout << "Order Drop Trigger: " << (triggers.orderDropTrigger ? "ACTIVE" : "Inactive")
         << "  [Drop >= 45%, current " << env.orderDropPercent << "%]\n";

    if (triggers.anyTriggered()) {
        cout << "\nAt least one disruption threshold is breached.\n";
    } else {
        cout << "\nNo parametric trigger is active right now.\n";
    }
}

FraudResult detectFraud(const User& user, const EnvironmentData& env,
                        bool existingClaimForCycle) {
    FraudResult fraud;
    fraud.locationMismatch = toLowerCopy(trim(user.city)) != toLowerCopy(trim(env.systemCity));
    fraud.duplicateClaim = existingClaimForCycle;
    return fraud;
}

void showFraudResult(const FraudResult& fraud, const User& user,
                     const EnvironmentData& env) {
    printSection("6. Fraud Detection Engine");

    cout << "Registered city : " << user.city << '\n';
    cout << "System city     : " << env.systemCity << '\n';
    cout << "Location Check  : "
         << (fraud.locationMismatch ? "Mismatch detected" : "Verified") << '\n';
    cout << "Duplicate Check : "
         << (fraud.duplicateClaim ? "Duplicate claim attempt detected" : "No duplicate claim") << '\n';

    if (fraud.flagged()) {
        cout << "\nFraud Warning: Claim cannot be auto-approved due to risk flags.\n";
    } else {
        cout << "\nFraud screening passed.\n";
    }
}

int calculateSeverityScore(const EnvironmentData& env, const TriggerResult& triggers) {
    int score = 0;

    if (triggers.rainTrigger) {
        score += min(static_cast<int>((env.rainfallMm - 150.0) / 10.0), 20) + 10;
    }
    if (triggers.aqiTrigger) {
        score += min((env.aqi - 400) / 10, 20) + 10;
    }
    if (triggers.curfewTrigger) {
        score += 18;
    }
    if (triggers.orderDropTrigger) {
        score += min((env.orderDropPercent - 45) / 2, 15) + 10;
    }

    return score;
}

ClaimResult processClaim(const TriggerResult& triggers, const FraudResult& fraud,
                         const EnvironmentData& env) {
    ClaimResult claim;
    claim.triggered = triggers.anyTriggered();

    if (!claim.triggered || fraud.flagged()) {
        return claim;
    }

    claim.approved = true;
    int severityScore = calculateSeverityScore(env, triggers);

    if (severityScore >= 55) {
        claim.severity = "High";
        claim.payout = 700;
    } else if (severityScore >= 30) {
        claim.severity = "Medium";
        claim.payout = 500;
    } else {
        claim.severity = "Low";
        claim.payout = 300;
    }

    if (triggers.rainTrigger) {
        claim.reasons.push_back("Heavy rainfall disruption");
    }
    if (triggers.aqiTrigger) {
        claim.reasons.push_back("Hazardous AQI disruption");
    }
    if (triggers.curfewTrigger) {
        claim.reasons.push_back("Curfew restriction");
    }
    if (triggers.orderDropTrigger) {
        claim.reasons.push_back("Significant order demand drop");
    }

    return claim;
}

void showClaimResult(const ClaimResult& claim) {
    printSection("7. Zero-Touch Claims Management");

    if (!claim.triggered) {
        cout << "No auto-claim created because no trigger was activated.\n";
        return;
    }

    if (!claim.approved) {
        cout << "Auto-claim generated, but approval blocked by fraud detection.\n";
        return;
    }

    cout << "Auto Claim Approved\n";
    cout << "Severity Level : " << claim.severity << '\n';
    cout << "Payout Amount  : Rs. " << claim.payout << '\n';
    cout << "Trigger Reasons : ";

    for (size_t i = 0; i < claim.reasons.size(); ++i) {
        if (i > 0) {
            cout << ", ";
        }
        cout << claim.reasons[i];
    }
    cout << '\n';
}

void showWinningPitchLayer(const User& user, const Policy& policy,
                           const PremiumBreakdown& breakdown,
                           const ClaimResult& claim,
                           const FraudResult& fraud) {
    printSection("8. Hackathon Value Add");

    double resilienceScore =
        max(0.0, 100.0 - (breakdown.weightedScore * 45.0) -
                        (fraud.flagged() ? 25.0 : 0.0) +
                        (claim.approved ? 10.0 : 0.0));

    cout << fixed << setprecision(1);
    cout << "SmartShield Trust Score     : "
         << (fraud.flagged() ? "72.0 / 100" : "94.0 / 100") << '\n';
    cout << "Worker Resilience Score     : " << resilienceScore << " / 100\n";
    cout << "Recommended Coverage Story  : ";

    if (policy.coverageType == "All") {
        cout << "Full-spectrum protection for uncertain gig work conditions.\n";
    } else if (policy.coverageType == "Rain") {
        cout << "Rain-focused cover for delivery slowdown during severe weather.\n";
    } else {
        cout << "Pollution-focused cover for unsafe and low-demand air quality days.\n";
    }

    cout << "Judge-Friendly Narrative    : AI pricing + trigger automation + fraud controls + instant payout.\n";
    cout << "Future Scope               : API integration with weather feeds, AQI boards, geofencing, and platform order data.\n";
    cout << "Impact Snapshot            : Protects worker cash flow without paperwork or manual claim filing.\n";
    cout << "Demo Persona               : " << user.name << " from " << user.city
         << " using " << user.platform << '\n';
}

void showSystemSummary(const User& user, const Policy& policy,
                       const PremiumBreakdown& breakdown, const TriggerResult& triggers,
                       const FraudResult& fraud, const ClaimResult& claim) {
    printSection("9. End-to-End Flow Summary");

    cout << "1. User Registered      : " << user.name << " | " << user.city
         << " | " << user.platform << '\n';
    cout << "2. Policy Created       : " << policy.coverageType << " | "
         << policy.planName << '\n';
    cout << "3. Premium Calculated   : Rs. " << fixed << setprecision(2)
         << breakdown.finalPremium << " / week\n";
    cout << "4. Trigger Detected     : " << (triggers.anyTriggered() ? "Yes" : "No") << '\n';
    cout << "5. Fraud Flagged        : " << (fraud.flagged() ? "Yes" : "No") << '\n';
    cout << "6. Auto Payout Status   : "
         << (claim.approved ? ("Approved - Rs. " + to_string(claim.payout)) : "Not Paid") << '\n';
}

int main() {
    cout << "SmartShield - AI-powered Parametric Insurance for Gig Workers\n";
    cout << "Hackathon Prototype | Console Demo | Zero-Touch Claims Engine\n";

    User user = registerUser();
    Policy policy = createPolicy();
    EnvironmentData env = captureEnvironmentData(user);
    PremiumBreakdown breakdown = calculatePremium(user, policy, env);

    showPremiumBreakdown(user, policy, env, breakdown);

    TriggerResult triggers = detectTriggers(env);
    showTriggers(triggers, env);

    bool existingClaimForCycle =
        readYesNo("\nHas a claim already been processed in this weekly cycle? (yes/no): ");
    FraudResult fraud = detectFraud(user, env, existingClaimForCycle);
    showFraudResult(fraud, user, env);

    ClaimResult claim = processClaim(triggers, fraud, env);
    showClaimResult(claim);
    showWinningPitchLayer(user, policy, breakdown, claim, fraud);
    showSystemSummary(user, policy, breakdown, triggers, fraud, claim);

    printDivider();
    cout << "Demo complete. SmartShield prototype is ready for hackathon presentation.\n";
    printDivider();

    return 0;
}
