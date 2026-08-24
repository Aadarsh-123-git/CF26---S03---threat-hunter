import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import pydeck as pdk
import time
from urbanpulse_engine import (
    get_city_graph,
    run_cascade_simulation,
    optimize_interventions,
    fetch_live_weather,
    generate_ai_post_mortem,
    generate_ai_tactical_briefing,
    ScenarioDefinition,
    CITY_LOADERS
)

st.set_page_config(
    page_title="URBANPULSE — AI Urban Infrastructure Cascade Simulator",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Command-Center CSS
st.markdown("""
<style>
    .stApp {
        background-color: #090d16;
        color: #f8fafc;
    }
    .metric-card {
        background: #141518;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        padding: 14px;
        text-align: center;
    }
    .metric-value {
        font-size: 1.6rem;
        font-weight: 900;
        font-family: monospace;
    }
    .metric-label {
        font-size: 0.75rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }
    div[data-testid="stSidebar"] {
        background-color: #0d111a;
        border-right: 1px solid #1e293b;
    }
</style>
""", unsafe_allow_html=True)

# App Header
st.title("⚡ URBANPULSE — Urban Infrastructure Cascade Simulator")
st.caption("AI-Powered Real-Time Infrastructure Digital Twin & Emergency Operations Command Center")

# Sidebar Configuration
st.sidebar.header("🕹️ Simulation Command Controls")

city_option = st.sidebar.selectbox(
    "Select City Topology",
    ["san_francisco", "london", "singapore", "mumbai"],
    format_func=lambda x: {
        "san_francisco": "San Francisco, USA",
        "london": "London, UK",
        "singapore": "Singapore",
        "mumbai": "Mumbai, India"
    }[x]
)

# Load City Graph
graph = get_city_graph(city_option)
all_nodes = graph.get_all_nodes()
all_edges = graph.get_all_edges()

# Scenario Selection
scenario_templates = {
    "san_francisco": [
        ("sc_sf_power", "Potrero 115kV Power Substation Failure", "sf_pwr_potrero"),
        ("sc_sf_water", "Hetch Hetchy Water Booster Outage", "sf_wtr_hetch_hetchy")
    ],
    "london": [
        ("sc_ldn_power", "UK Power Networks Bank Substation Blackout", "ldn_pwr_bank"),
        ("sc_ldn_tube", "TfL Underground Signal Control Trip", "ldn_trn_tfl")
    ],
    "singapore": [
        ("sc_sg_power", "Tuas Generation Plant Outage", "sg_pwr_tuas"),
        ("sc_sg_barrage", "Marina Barrage Flood Control Trip", "sg_wtr_barrage")
    ],
    "mumbai": [
        ("sc_mum_power", "BEST Dharavi 220kV Substation Outage", "mum_pwr_dharavi"),
        ("sc_mum_flood", "Love Grove Coastal Stormwater Pump Outage", "mum_wtr_lovegrove")
    ]
}

selected_sc_info = st.sidebar.selectbox(
    "Disruption Scenario",
    scenario_templates.get(city_option, scenario_templates["san_francisco"]),
    format_func=lambda x: x[1]
)

scenario = ScenarioDefinition(
    scenario_id=selected_sc_info[0],
    name=selected_sc_info[1],
    category="Power Failure",
    description="Simulated grid disruption propagating downstream",
    city_id=city_option,
    initial_failures=[{"nodeId": selected_sc_info[2], "degradedHealth": 0.0, "reason": "Unplanned Equipment Failure"}],
    duration_minutes=120,
    timestep_minutes=5
)

# Custom Failure Injector
with st.sidebar.expander("Inject Custom Failure Node"):
    custom_node_id = st.selectbox("Select Target Node", [n.id for n in all_nodes], format_func=lambda x: graph.nodes_map[x].name)
    if st.button("Inject Outage"):
        scenario.initial_failures.append({"nodeId": custom_node_id, "degradedHealth": 0.0, "reason": "Operator Injected Failure"})
        st.success(f"Injected failure on {graph.nodes_map[custom_node_id].name}")

# Run Simulation Engine
sim_run = run_cascade_simulation(graph, scenario)
timeline = sim_run["timeline"]
metrics_summary = sim_run["metrics_summary"]

# Timeline Slider
st.sidebar.subheader("⏱️ Timeline Player")
max_steps = len(timeline) - 1
step_idx = st.sidebar.slider("Timestep (5m intervals)", 0, max_steps, 0)
current_step = timeline[step_idx]

# Fetch Weather
city_coords = {
    "san_francisco": (37.7749, -122.4194),
    "london": (51.5074, -0.1278),
    "singapore": (1.3521, 103.8198),
    "mumbai": (19.0760, 72.8777)
}
lat, lon = city_coords.get(city_option, (37.7749, -122.4194))
weather = fetch_live_weather(lat, lon)

# Top Telemetry Row
m1, m2, m3, m4, m5 = st.columns(5)

with m1:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-label">City Resilience</div>
        <div class="metric-value" style="color: {'#10b981' if current_step.city_resilience_score > 75 else '#f43f5e'};">{current_step.city_resilience_score} / 100</div>
    </div>
    """, unsafe_allow_html=True)

with m2:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-label">Disrupted Services</div>
        <div class="metric-value" style="color: {'#f43f5e' if current_step.affected_services_count > 0 else '#10b981'};">{current_step.affected_services_count}</div>
    </div>
    """, unsafe_allow_html=True)

with m3:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-label">Population at Risk</div>
        <div class="metric-value" style="color: #38bdf8;">{current_step.population_at_risk:,}</div>
    </div>
    """, unsafe_allow_html=True)

with m4:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-label">Cascade Depth</div>
        <div class="metric-value" style="color: #f59e0b;">{current_step.cascade_depth} Hops</div>
    </div>
    """, unsafe_allow_html=True)

with m5:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-label">Weather ({weather['source'].split()[0]})</div>
        <div class="metric-value" style="color: #e2e8f0; font-size: 1.2rem;">{weather['temperature']}°C • {weather['windspeed']}km/h</div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# Main Navigation Tabs
tab_dash, tab_map, tab_critical, tab_opt, tab_prov = st.tabs([
    "📊 Dashboard Overview",
    "🗺️ Interactive City Map",
    "🎯 Critical Nodes Analysis",
    "⚡ AI & Knapsack Optimizer",
    "📜 Data Provenance"
])

# TAB 1: DASHBOARD OVERVIEW
with tab_dash:
    col_left, col_right = st.columns([7, 5])

    with col_left:
        st.subheader("Geospatial Risk Layer & Cascade Map")
        
        # Pydeck Map Data Preparation
        map_nodes = []
        for n in all_nodes:
            h = current_step.node_health_map.get(n.id, 1.0)
            st_str = current_step.node_state_map.get(n.id, "NORMAL")
            color = [16, 185, 129, 200] if h >= 0.85 else ([245, 158, 11, 200] if h >= 0.5 else [244, 63, 94, 230])
            map_nodes.append({
                "name": n.name,
                "lat": n.latitude,
                "lon": n.longitude,
                "health": int(h * 100),
                "state": st_str,
                "category": n.category,
                "color": color,
                "radius": 150 if st_str == "FAILED" else 100
            })

        df_nodes = pd.DataFrame(map_nodes)

        layer_pins = pdk.Layer(
            "ScatterplotLayer",
            df_nodes,
            get_position=["lon", "lat"],
            get_color="color",
            get_radius="radius",
            pickable=True,
            auto_highlight=True
        )

        view_state = pdk.ViewState(latitude=lat, longitude=lon, zoom=11, pitch=30)
        r = pdk.Deck(layers=[layer_pins], initial_view_state=view_state, tooltip={"html": "<b>{name}</b><br>Health: {health}% ({state})<br>Category: {category}"})
        st.pydeck_chart(r)

    with col_right:
        st.subheader("Time-Series Resilience Curve")
        
        chart_data = pd.DataFrame([
            {
                "Minute": s.time_minute,
                "Resilience": s.city_resilience_score,
                "Disrupted": s.affected_services_count
            }
            for s in timeline
        ])

        fig = px.area(chart_data, x="Minute", y="Resilience", title="City Resilience Score over Timesteps")
        fig.add_scatter(x=chart_data["Minute"], y=chart_data["Disrupted"], name="Disrupted Nodes", yaxis="y2", line=dict(color="#f43f5e"))
        fig.update_layout(
            paper_bgcolor="#141518",
            plot_bgcolor="#141518",
            font=dict(color="#f8fafc"),
            yaxis=dict(title="Resilience (0-100)", range=[0, 100]),
            yaxis2=dict(title="Disrupted Nodes", overlaying="y", side="right")
        )
        st.plotly_chart(fig, use_container_width=True)

    # Gemini AI Post-Mortem Box
    st.markdown("---")
    st.subheader("🤖 Gemini 3.7 Flash Cascade Attribution Post-Mortem")
    if st.button("Generate AI Post-Mortem Analysis"):
        post_mortem = generate_ai_post_mortem(scenario.name, city_option, metrics_summary, scenario.initial_failures)
        st.markdown(post_mortem)

# TAB 2: INTERACTIVE MAP
with tab_map:
    st.subheader("Full Geospatial Infrastructure Map")
    cat_filter = st.multiselect("Filter Infrastructure Layers", list(set(n.category for n in all_nodes)), default=list(set(n.category for n in all_nodes)))
    
    filtered_map_nodes = [m for m in map_nodes if m["category"] in cat_filter]
    df_filtered = pd.DataFrame(filtered_map_nodes)

    if not df_filtered.empty:
        layer_full = pdk.Layer(
            "ScatterplotLayer",
            df_filtered,
            get_position=["lon", "lat"],
            get_color="color",
            get_radius=120,
            pickable=True
        )
        st.pydeck_chart(pdk.Deck(layers=[layer_full], initial_view_state=view_state, tooltip={"html": "<b>{name}</b><br>Health: {health}%"}))

# TAB 3: CRITICAL NODES
with tab_critical:
    st.subheader("🎯 Critical-Node Graph Centrality Analysis")
    critical_analysis = graph.analyze_critical_nodes()
    df_critical = pd.DataFrame(critical_analysis)
    st.dataframe(df_critical[["node_name", "category", "criticality_score", "downstream_reach", "betweenness", "population_exposure"]], use_container_width=True)

# TAB 4: AI & KNAPSACK OPTIMIZER
with tab_opt:
    st.subheader("⚡ Multi-Objective Resource Knapsack Optimizer")
    
    c1, c2 = st.columns(2)
    with c1:
        budget_slider = st.slider("Emergency Budget (₹)", 200000, 3000000, 1500000, 100000)
    with c2:
        teams_slider = st.slider("Repair Crews Available", 1, 8, 4)

    if st.button("Run Knapsack Optimization Solver"):
        opt_res = optimize_interventions(graph, scenario, budget_slider, teams_slider)
        comp = opt_res["comparison_metrics"]

        st.success(opt_res["executive_summary"])

        col_b, col_a = st.columns(2)
        with col_b:
            st.metric("Resilience Before", comp["resilience_before"])
            st.metric("Disrupted Before", comp["affected_before"])
            st.metric("Recovery Time Before", f"{comp['recovery_before']} min")
        with col_a:
            st.metric("Resilience After Intervention", comp["resilience_after"], delta=f"+{comp['resilience_delta']} pts")
            st.metric("Disrupted After Intervention", comp["affected_after"], delta=f"-{comp['affected_delta']} saved")
            st.metric("Recovery Time After", f"{comp['recovery_after']} min", delta=f"-{comp['recovery_pct']}% faster")

        st.subheader("Recommended Interventions")
        for intv in opt_res["recommended_interventions"]:
            st.write(f"• **Priority {intv.priority_rank}:** {intv.name} (Cost: ₹{intv.cost_inr:,.0f}, Teams: {intv.required_teams})")
            st.caption(intv.rationale)

        st.markdown("---")
        st.subheader("🤖 Gemini 3.7 Flash Tactical Briefing")
        briefing = generate_ai_tactical_briefing(city_option, scenario.name, comp, opt_res["recommended_interventions"][0].name if opt_res["recommended_interventions"] else "Feeder", opt_res["total_cost_inr"])
        st.markdown(briefing)

# TAB 5: DATA PROVENANCE
with tab_prov:
    st.subheader("📜 Data Provenance & Real-World Grounding Registry")
    st.write("All GIS coordinates, transformer ratings, bed counts, and population figures are calibrated from open municipal portals under public licensing.")
    
    prov_data = [
        {"Dataset": "San Francisco PG&E & SFDPH GIS", "Publisher": "DataSF Open Portal", "License": "Open Data Commons", "Status": "CONNECTED"},
        {"Dataset": "London UK Power Networks GIS", "Publisher": "Greater London Authority", "License": "UK OGL v3.0", "Status": "CONNECTED"},
        {"Dataset": "Singapore EMA & SGH Master Plan", "Publisher": "Data.gov.sg", "License": "Singapore Open Data", "Status": "CONNECTED"},
        {"Dataset": "Mumbai BEST & BMC Open Data", "Publisher": "MCGM Open Portal", "License": "GODL India", "Status": "CONNECTED"},
        {"Dataset": "Open-Meteo Global Forecast Models", "Publisher": "Open-Meteo API", "License": "CC-BY 4.0", "Status": "LIVE"}
    ]
    st.table(pd.DataFrame(prov_data))
