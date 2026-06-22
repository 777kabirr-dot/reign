import { useEffect, useState } from "react";
import api from "../api.js";
import MentionRow from "../components/MentionRow.jsx";

export default function Mentions() {
  const [clients, setClients] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [filters, setFilters] = useState({ client: "", severity: "", sentiment: "", status: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/clients").then(setClients).catch((e) => setError(e.message));
  }, []);

  const load = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    params.set("limit", "500");
    api.get(`/mentions?${params}`).then(setMentions).catch((e) => setError(e.message));
  };

  useEffect(load, [filters]);

  const setStatus = async (mention, status) => {
    await api.patch(`/mentions/${mention.id}/status`, { status });
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text">Mentions</h1>

      <div className="panel p-4 flex flex-wrap gap-3">
        <select className="input max-w-[200px]" value={filters.client} onChange={(e) => setFilters({ ...filters, client: e.target.value })}>
          <option value="">All clients</option>
          {clients.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <select className="input max-w-[160px]" value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })}>
          <option value="">All severities</option>
          {["critical", "high", "medium", "low"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input max-w-[160px]" value={filters.sentiment} onChange={(e) => setFilters({ ...filters, sentiment: e.target.value })}>
          <option value="">All sentiment</option>
          {["positive", "neutral", "negative"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input max-w-[160px]" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>
          {["new", "flagged", "resolved"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <div className="panel p-4 text-danger text-sm">Error: {error}</div>}

      <div className="panel overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/[0.02]">
            <tr>
              <th className="th">Client</th>
              <th className="th">Title</th>
              <th className="th">Source</th>
              <th className="th">Severity</th>
              <th className="th">Sentiment</th>
              <th className="th">Detected</th>
              <th className="th">Status</th>
            </tr>
          </thead>
          <tbody>
            {mentions.map((m) => (
              <MentionRow
                key={m.id}
                mention={m}
                onResolve={(x) => setStatus(x, "resolved")}
                onFlag={(x) => setStatus(x, "flagged")}
              />
            ))}
            {mentions.length === 0 && (
              <tr><td colSpan={7} className="td text-dim text-center py-8">No mentions match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
