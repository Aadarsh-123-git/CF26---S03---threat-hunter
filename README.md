# 🌆 URBANPULSE

## AI-Powered Urban Infrastructure Cascade Simulator

> **We don't just simulate how cities fail. We simulate how cities can survive.**

URBANPULSE is an interactive urban resilience platform that models a city's critical infrastructure as an interconnected dynamic graph and simulates how disruptions can cascade across dependent services.

Instead of monitoring infrastructure systems independently, URBANPULSE answers a more important question:

> **"If this infrastructure fails, what happens next?"**

The platform combines real-world geospatial/infrastructure data, graph algorithms, time-based simulation, risk analysis, and AI-assisted intervention recommendations to help visualize and understand cascading urban failures.

---

# 🚨 Problem

Modern cities depend on highly interconnected infrastructure.

A disruption to one service can affect multiple other services.

For example:

```text
⚡ POWER FAILURE
        ↓
🚦 Traffic Signals Degraded
        ↓
🚗 Traffic Congestion
        ↓
🚑 Ambulance Delay
        ↓
🏥 Hospital Response Reduced
        ↓
🛡️ Public Safety Risk
```

Traditional monitoring systems often monitor these services individually.

URBANPULSE models their **dependencies as a dynamic graph** and simulates how failures propagate through the system.

---

# 💡 Solution

URBANPULSE creates a digital representation of urban infrastructure and provides:

* 🌐 Infrastructure dependency graph
* 🗺️ Interactive city map
* ⚡ Failure simulation
* 🌪️ Multiple simultaneous disruptions
* ⏱️ Time-dependent cascade simulation
* 🔄 Recovery simulation
* 🎯 Critical-node detection
* 📊 Cascade risk scoring
* 🏙️ City resilience scoring
* 👥 Population impact estimation
* 🤖 AI intervention recommendations
* 💰 Resource-constrained recovery optimization
* 📈 Before/after intervention comparison
* 🧪 Reproducible simulation scenarios
* 📚 Data provenance
* 📊 Scenario comparison
* 💾 Simulation history

---

# 🧠 How URBANPULSE Works

```text
             REAL-WORLD DATA
                    │
                    ▼
          ┌───────────────────┐
          │   CITY DIGITAL    │
          │      MODEL        │
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │ INFRASTRUCTURE    │
          │      GRAPH        │
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │    DISRUPTION     │
          │    SCENARIO       │
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │ CASCADE SIMULATION│
          └─────────┬─────────┘
                    │
          ┌─────────┴──────────┐
          ▼                    ▼
   RISK ANALYSIS       CRITICAL NODES
          │                    │
          └─────────┬──────────┘
                    ▼
          ┌───────────────────┐
          │ AI INTERVENTION   │
          │   OPTIMIZATION    │
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │ RESILIENT CITY    │
          └───────────────────┘
```

---

# 🌐 Infrastructure Graph

Every infrastructure component is represented as a node.

Examples:

* ⚡ Electricity
* 🚰 Water
* 🚦 Traffic systems
* 🏥 Hospitals
* 🚑 Ambulance services
* 📡 Telecommunications
* 🚇 Metro
* 🚆 Railway
* 🚌 Public transportation
* 🛡️ Police
* 🔥 Fire services
* 🗑️ Waste management
* 🏦 Banking infrastructure

Dependencies are represented as directed edges.

Example:

```text
             ⚡ POWER
            /   |    \
           ↓    ↓     ↓
       🚰 WATER 🚦 TRAFFIC 🏥 HOSPITAL
                   ↓
                🚑 AMBULANCE
```

---

# 🔥 Cascade Simulation

Users can select one or more disruptions.

Example:

```text
⚡ Power Substation Failure
```

The simulator then propagates the failure through the dependency graph.

Example timeline:

```text
00 min
⚡ Power failure detected

05 min
🚦 Traffic infrastructure degraded

12 min
🚗 Traffic congestion increases

20 min
🚑 Emergency response affected

30 min
🏥 Hospital response capacity reduced

45 min
🔴 Critical cascade detected
```

The system calculates the actual cascade from the graph instead of displaying a predefined animation.

---

# 🌪️ Multiple Simultaneous Disruptions

URBANPULSE supports compound scenarios.

Example:

```text
🌧️ Heavy Rain
+
⚡ Power Failure
+
📡 Telecom Outage
```

The simulator evaluates the combined effect of these disruptions.

This allows users to investigate complex urban emergencies rather than isolated failures.

---

# 🎯 Critical Node Detection

URBANPULSE identifies infrastructure that has disproportionately large downstream impact.

Criticality can consider:

* Degree centrality
* Betweenness centrality
* Downstream reach
* Dependency strength
* Population exposure
* Service importance
* Recovery time
* Failure probability

Example:

```text
🔴 CRITICAL NODE

Power Substation A

Criticality Score: 93/100

Downstream Services: 8
Population Exposure: High
Dependency Reach: High
Recovery Time: High
```

---

# 📊 Cascade Risk Score

Every infrastructure node can receive a risk score from:

```text
0 → 100
```

Risk can incorporate:

* Failure probability
* Infrastructure criticality
* Downstream impact
* Population exposure
* Recovery time
* Dependency strength

Risk levels:

```text
🟢 LOW
🟡 MODERATE
🟠 HIGH
🔴 CRITICAL
```

---

# 🏙️ City Resilience Score

URBANPULSE calculates an overall resilience score:

```text
0 → 100
```

Example:

```text
NORMAL CITY

🟢 Resilience
94 / 100
```

After a major disruption:

```text
AFTER POWER FAILURE

🟠 Resilience
61 / 100
```

After intervention:

```text
AFTER OPTIMIZED RESPONSE

🟢 Resilience
87 / 100
```

All values are calculated dynamically by the simulation engine.

---

RUN THIS CODE : cd "/Users/aadarshj/Downloads/urbanpulse-—-urban-infrastructure-cascade-simulator"
npm run dev(after downloading the zip and open it on vs code)

# 🤖 AI-Powered Intervention

URBANPULSE does not stop at predicting failures.

After a cascade is detected, the system identifies possible interventions.

Example:

```text
🚨 CASCADE DETECTED

Recommended Response:

1. Restore Power Substation A
   ⭐⭐⭐⭐⭐

2. Activate Hospital Backup Power
   ⭐⭐⭐⭐

3. Reroute Emergency Vehicles
   ⭐⭐⭐

4. Activate Emergency Traffic Control
   ⭐⭐⭐
```

Recommendations are based on simulation results and intervention impact.

---

# 💰 Resource Optimization

Emergency resources can be limited.

Users can specify:

```text
Emergency Budget
Repair Teams
Emergency Crews
Backup Generators
Ambulances
```

The optimizer then identifies interventions that provide the greatest simulated reduction in:

* Affected services
* Population at risk
* Recovery time
* Cascade severity

Example:

```text
Available Budget: ₹10,00,000
Repair Teams: 3

Recommended:

Restore Substation A
Cost: ₹5,00,000
Impact: HIGH
```

Simulation assumptions are clearly labeled where real operational cost data is unavailable.

---

# 🗺️ Interactive City Map

URBANPULSE provides a geographic view of infrastructure.

The map can display:

* Roads
* Hospitals
* Fire stations
* Police stations
* Transit
* Railway
* Infrastructure
* Risk areas

Infrastructure changes state during a simulation.

```text
🟢 Normal
🟡 Warning
🟠 Degraded
🔴 Failed
🔵 Recovering
```

---

# 📚 Real-World Data

URBANPULSE is designed to use real-world publicly available data wherever possible.

Potential sources include:

* OpenStreetMap
* Open-Meteo
* Government open-data portals
* Public transportation datasets
* Public infrastructure datasets
* Population datasets
* Environmental datasets

The application distinguishes between:

```text
OBSERVED
OPEN_DATA
API_DATA
DERIVED
MODELED
SIMULATED
ASSUMED
```

This prevents simulated assumptions from being presented as real-world facts.

---

# 🧪 Reproducible Simulations

Every simulation can store:

```text
Simulation ID
Scenario ID
City ID
Random Seed
Graph Version
Simulation Parameters
Timestamp
```

Using the same inputs and seed produces reproducible simulation results.

This makes it possible to:

* Replay simulations
* Compare scenarios
* Validate interventions
* Analyze previous incidents

---

# 🏗️ Architecture

```text
┌───────────────────────────────────────┐
│              FRONTEND                 │
│                                       │
│ React + TypeScript                    │
│ React Flow                            │
│ MapLibre / Leaflet                    │
│ Recharts                              │
└───────────────────┬───────────────────┘
                    │
                    │ REST / WebSocket
                    ▼
┌───────────────────────────────────────┐
│               BACKEND                 │
│                                       │
│ FastAPI                               │
│ Pydantic                              │
│ NetworkX                              │
│ Simulation Engine                     │
│ Risk Engine                           │
│ Optimization Engine                  │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│              DATABASE                 │
│                                       │
│ PostgreSQL + PostGIS                  │
│ or SQLite for local demo              │
└───────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│          EXTERNAL DATA                │
│                                       │
│ OpenStreetMap                         │
│ Weather APIs                          │
│ Government Open Data                  │
│ Population / GIS Data                 │
└───────────────────────────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Flow
* MapLibre GL JS / Leaflet
* Recharts
* Framer Motion

## Backend

* Python
* FastAPI
* NetworkX
* Pydantic
* Pandas
* NumPy
* GeoPandas
* Shapely

## Database

* PostgreSQL
* PostGIS

SQLite can be used for local/demo environments.

---

# 📁 Project Structure

```text
URBANPULSE/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── graph/
│   │   ├── models/
│   │   ├── simulation/
│   │   ├── optimization/
│   │   ├── data/
│   │   └── tests/
│   ├── requirements.txt
│   └── seed_data/
│
├── .env.example
├── README.md
└── docker-compose.yml
```

---

# 🚀 Getting Started

## Prerequisites

Install:

* Node.js 20+
* Python 3.11+
* npm
* Git

For PostgreSQL mode:

* PostgreSQL
* PostGIS

---

# 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd URBANPULSE
```

---

# 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:3000
```

---

# 3. Backend

Open another terminal:

```bash
cd backend

python -m venv venv
```

### macOS / Linux

```bash
source venv/bin/activate
```

### Windows

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

---

# 🔐 Environment Variables

Create:

```text
.env
```

based on:

```text
.env.example
```

Example:

```env
DATABASE_URL=sqlite:///./urbanpulse.db

OPEN_METEO_URL=https://api.open-meteo.com

OSM_API_URL=https://overpass-api.de/api/interpreter

AI_API_KEY=
```

Never commit real API keys.

---

# 🎮 Demo Mode

URBANPULSE includes a demo/cached-data mode for hackathon presentations.

This ensures the application can continue functioning if external APIs are temporarily unavailable.

The interface clearly indicates whether data is:

```text
LIVE
```

or:

```text
CACHED / DEMO
```

---

# 🧪 Example Hackathon Scenario

## Scenario

### Flood + Power Failure + Telecom Degradation

Start with:

```text
🟢 City Resilience: 94
```

Trigger:

```text
⚡ Power Failure
```

Then observe the simulated cascade:

```text
Power
 ↓
Traffic
 ↓
Emergency Response
 ↓
Hospital
 ↓
Public Safety
```

The dashboard calculates:

```text
Cascade Depth
Affected Services
Population at Risk
Risk Score
Recovery Time
Resilience Score
```

Then select:

```text
🤖 AI OPTIMIZE RESPONSE
```

The system evaluates intervention strategies.

Finally compare:

```text
WITHOUT INTERVENTION
        VS
WITH INTERVENTION
```

The objective is to demonstrate that intelligent intervention can reduce the simulated impact of a cascading infrastructure failure.

---

# 📊 Key Metrics

URBANPULSE tracks:

| Metric              | Description                                   |
| ------------------- | --------------------------------------------- |
| Resilience Score    | Overall city health                           |
| Cascade Depth       | Maximum dependency propagation depth          |
| Affected Services   | Number of degraded/failed services            |
| Population at Risk  | Estimated population exposed                  |
| Recovery Time       | Time required to restore system resilience    |
| Criticality Score   | Importance of infrastructure within the graph |
| Cascade Risk        | Potential impact of infrastructure failure    |
| Intervention Impact | Improvement produced by a response action     |

---

# 🔒 Important Disclaimer

URBANPULSE is a **simulation and decision-support prototype**.

It does not replace:

* Official emergency management systems
* Government emergency guidance
* Engineering assessments
* Infrastructure control systems
* Emergency dispatch systems
* Real operational decision-making

Where authoritative infrastructure dependency data is unavailable, URBANPULSE uses explicitly labeled modeled assumptions.

Simulation results should not be interpreted as predictions of actual infrastructure failures.

---

# 🏆 Hackathon Value

URBANPULSE moves beyond simply visualizing infrastructure.

Traditional monitoring asks:

> **What is failing right now?**

URBANPULSE asks:

> **What could fail next?**

and:

> **How far can the failure propagate?**

and:

> **Which infrastructure is most critical?**

and:

> **Where should emergency resources be deployed?**

and:

> **Which intervention produces the greatest improvement in resilience?**

---

# 🚀 Future Scope

Potential future capabilities include:

* Real-time IoT sensor integration
* Digital twins
* Live traffic feeds
* Real-time power-grid data
* Advanced flood models
* ML-based failure prediction
* Historical incident validation
* Multi-city comparison
* Advanced optimization
* Reinforcement learning for emergency response
* Real-time emergency operations integration

---

# 👥 Team

Built for:

**Hackathon — Smart Cities & Urban Infrastructure**

Problem Statement:

**S-03 — Urban Infrastructure Cascade Simulator**

Project:

# URBANPULSE

### AI-Powered Urban Crisis & Resilience Simulator

> **We don't just simulate how cities fail. We simulate how cities can survive.**

---

## ⭐ Why URBANPULSE?

Because a city doesn't fail one service at a time.

**It fails through dependencies.**

URBANPULSE makes those dependencies visible, simulates how disruptions propagate, and identifies interventions that can help the city recover faster.

---
