# URBANPULSE — AI-Powered Urban Infrastructure Cascade Simulator

> **"We don't just simulate how cities fail. We simulate how cities can survive."**

URBANPULSE is a real-world decision support platform and emergency operations digital twin designed for urban crisis commanders, resilience engineers, and municipal authorities. It models how disruptions propagate across tightly coupled infrastructure networks (power grids, water supply, transportation, telecommunications, healthcare, and emergency dispatch) and calculates mathematically optimized intervention strategies to halt cascading failures.

---

## 🌟 Key Features

1. **Deterministic Graph Cascade Engine**: Models multi-hop failure propagation across 4 tier layers with discrete 5-minute timesteps, upstream health failure thresholds, and propagation delay logic (`lib/engine/cascade.ts`).
2. **Network Topology Analytics & Criticality Scores**: Computes Brandes' Betweenness Centrality, BFS transitive downstream reach, degree centrality, and multi-factor weighted criticality scores (0–100) for every facility (`lib/engine/graph.ts`).
3. **Multi-Objective Resource Knapsack Optimizer**: Evaluates intervention candidate sequences under strict budget and crew constraints to maximize city resilience recovery and minimize recovery time (`lib/engine/optimizer.ts`).
4. **Real-World Grounded Topologies**: Built-in high-fidelity geospatial topologies for **San Francisco**, **London**, **Singapore**, and **Mumbai**, complete with GIS coordinates, transformer ratings, bed counts, and public open data citations.
5. **Dual Interactive Visualizer**:
   - **Geospatial City Map**: Interactive SVG canvas with grid backdrops, pulse indicators, cascade flow arcs, and animated risk heat zones (`components/CityMap.tsx`).
   - **Layered Topological Cascade Graph**: Clear tier layout showing downstream dependencies and blast radius highlighting (`components/InfrastructureGraph.tsx`).
6. **Gemini 3.7 Flash AI Decision Support**: Server-side AI analysis generating technical post-mortems and tactical incident command directives with transparent fallback for offline demo modes.
7. **Full Data Provenance & Open Data Registry**: Categorized data source matrix (`OPEN_DATA`, `OBSERVED`, `MODELED`, `SIMULATED`, `ASSUMED`) citing OpenStreetMap, DataSF, London Datastore, Data.gov.sg, MCGM, and Open-Meteo API.
8. **Reproducible Simulation Seeds**: Every run logs random seeds, timestamps, and parameters for 100% deterministic replay.

---

## 🏗️ Technical Architecture & Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript.
- **Styling**: Tailwind CSS v4, Lucide React icons, Framer Motion (`motion`).
- **Data Visualization**: Recharts (time-series area charts), SVG interactive canvas.
- **Graph & Math Engine**: Custom TypeScript `UrbanGraph` class (Brandes' algorithm $O(V \cdot E)$, BFS transitive closure, Knapsack optimization).
- **APIs**: Open-Meteo (Live atmospheric weather telemetry), `@google/genai` (Gemini 3.7 Flash).

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation & Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables (optional for live AI key)
cp .env.example .env.local

# 3. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Variables

Create `.env.local`:

```env
# Optional: Set Gemini API key for live AI decision support briefings
# If omitted, URBANPULSE automatically engages its high-fidelity deterministic engine fallback.
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🎈 Streamlit App & Streamlit Community Cloud Deployment

URBANPULSE includes a standalone **Streamlit** Python application (`app.py`) built with NetworkX, Pydeck, Plotly, and Streamlit Community Cloud support.

### Run Streamlit Locally

```bash
# 1. Install Python dependencies
python3 -m pip install -r requirements.txt

# 2. Launch Streamlit app
python3 -m streamlit run app.py
```

Open [http://localhost:8501](http://localhost:8501) in your browser.

### Deploy to Streamlit Community Cloud (https://streamlit.io)

1. Push this repository to GitHub.
2. Go to **[share.streamlit.io](https://share.streamlit.io)** and log in with GitHub.
3. Click **"New app"**.
4. Select your repository, set **Main file path** to `app.py`.
5. Under **Advanced settings > Secrets** (Optional):
   ```toml
   GEMINI_API_KEY = "your_gemini_api_key_here"
   ```
6. Click **Deploy!** Your app will be live globally in under 2 minutes.

---

## 🎬 Hackathon Demo Procedure

Follow this 60-second end-to-end workflow to demonstrate URBANPULSE:

1. **Dashboard Overview**: Open the command dashboard showing live city resilience score, active incidents, and weather telemetry.
2. **Visualizer Switch**: Toggle between **GEOSPATIAL MAP** (showing risk zones & cascade arcs) and **CASCADE GRAPH** (showing topological tier dependencies).
3. **Trigger Cascade**: Click **JUMP TO PEAK** on the timeline or inject a custom failure on any power substation.
4. **AI Post-Mortem**: Click **EXPLAIN CASCADE** on the dashboard to generate a Gemini 3.7 Flash post-mortem attribution breakdown.
5. **Launch Optimizer**: Navigate to **AI OPTIMIZER**, adjust resource sliders (Budget, Repair Teams, Mobile Generators), and click **OPTIMIZE RESPONSE SEQUENCE**.
6. **Before vs. After**: Inspect the side-by-side metric comparison (+Resilience score, % Faster Recovery, Population Protected) and view the executive report.


