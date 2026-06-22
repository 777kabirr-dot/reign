import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import api from "../api.js";
import AgentStatusBar from "../components/AgentStatusBar.jsx";
import { ThreatBadge } from "../components/ThreatBadge.jsx";

function StatCard({ label, value, accent }) {
  return (
    <div className="stat-card">
      <span className="text-xs uppercase tracking-wider text-dim">{label}</span>
      <span className={`text-3xl font-semibold ${accent || "text-text"}`}>{value}</span>
    </div>
  );
}

function buildSeries(mentions) {
  // 30-day buckets, counts by sentiment.
  const days = [];
  const byDay = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    byDay[key] = { date: key.slice(5), positive: 0, neutral: 0, negative: 0 };
    days.push(key);
  }
  for (const m of mentions) {
    const key = (m.detected_at || "").slice(0, 10);
    if (byDay[key]) byDay[key][m.sentiment || "neutral"] += 1;
  }
  return days.map((k) => byDay[k]);
}

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [content, setContent] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [runs, setRuns] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/clients"),
      api.get("/mentions?limit=500"),
      api.get("/content"),
      api.get("/legal?status=pending"),
      api.get("/orchestrator/runs?limit=10"),
    ])
      .then(([c, m, ct, l, r]) => {
        setClients(c);
        setMentions(m);
        setContent(ct);
        setDrafts(l);
        setRuns(r);
      })
      .catch((e) => setError(e.message));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const newToday = mentions.filter((m) => (m.detected_at || "").slice(0, 10) === today).length;
  const contentThisMonth = content.filter((c) => (c.published_at || "").slice(0, 7) === month).length;
  const series = buildSeries(mentions);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">Dashboard</h1>
          <p className="text-sm text-dim">Reign OS — autonomous reputation intelligence</p>
        </div>
        <span className="text-xs text-dim font-mono">{today}</span>
      </header>

      {error && <div className="panel p-4 text-danger text-sm">Error: {error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Clients" value={clients.filter((c) => c.status === "active").length} accent="text-gold" />
        <StatCard label="New Threats Today" value={newToday} accent="text-danger" />
        <StatCard label="Content This Month" value={contentThisMonth} accent="text-safe" />
        <StatCard label="Pending Legal Drafts" value={drafts.length} accent="text-warn" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 panel p-5">
          <h3 className="text-sm font-semibold text-text mb-4">Mentions · last 30 days</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={series}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.35)" fontSize={11} tickMargin={8} interval={4} />
              <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} allowDecimals={false} />
              <Tooltip
                cursor={{ stroke: "rgba(255,255,255,0.2)" }}
                contentStyle={{ background: "#000", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 0, color: "#FFFFFF" }}
                labelStyle={{ color: "rgba(255,255,255,0.35)" }}
              />
              <Legend wrapperStyle={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em" }} />
              <Line type="monotone" dataKey="negative" stroke="#FFFFFF" strokeWidth={1} strokeOpacity={1} dot={{ r: 2, fill: "#FFFFFF", strokeWidth: 0 }} />
              <Line type="monotone" dataKey="neutral" stroke="#FFFFFF" strokeWidth={1} strokeOpacity={0.4} dot={{ r: 2, fill: "#FFFFFF", fillOpacity: 0.4, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="positive" stroke="#FFFFFF" strokeWidth={1} strokeOpacity={0.7} dot={{ r: 2, fill: "#FFFFFF", fillOpacity: 0.7, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <AgentStatusBar runs={runs} />
      </div>

      <div className="panel p-5">
        <h3 className="text-sm font-semibold text-text mb-4">Recent Activity</h3>
        {runs.length === 0 && <p className="text-sm text-dim">No orchestrator runs yet.</p>}
        <ul className="space-y-2">
          {runs.map((run) => (
            <li key={run.id} className="flex items-center justify-between text-sm border-b border-border/60 pb-2">
              <div className="flex items-center gap-3">
                <ThreatBadge severity={run.status === "error" ? "high" : "low"} />
                <span className="text-text">{run.clients?.name || run.client_id}</span>
                <span className="text-dim text-xs">
                  {Object.entries(run.agents_run || {})
                    .filter(([, v]) => v && !v.skipped)
                    .map(([k]) => k)
                    .join(", ") || "no agents"}
                </span>
              </div>
              <span className="text-xs text-dim font-mono">{run.run_date}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
