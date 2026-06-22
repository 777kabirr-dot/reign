import { useEffect, useState } from "react";
import api from "../api.js";

const TYPE_LABEL = {
  article: "Article",
  press_release: "Press Release",
  social_post: "Social Post",
  gbp_response: "GBP Response",
};

function ContentCard({ item }) {
  return (
    <div className="panel p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-text text-sm line-clamp-2">{item.title || "(untitled)"}</h3>
        <span className="text-[10px] uppercase tracking-wide text-gold border border-gold/30 rounded px-1.5 py-0.5 whitespace-nowrap">
          {TYPE_LABEL[item.type] || item.type}
        </span>
      </div>
      <p className="text-xs text-dim">{item.clients?.name || "—"}</p>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-dim font-mono">{item.platform}</span>
        <span className="text-xs text-dim font-mono">{(item.published_at || "").slice(0, 10)}</span>
      </div>
      {item.url && (
        <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-gold hover:underline truncate">
          {item.url} ↗
        </a>
      )}
    </div>
  );
}

export default function Suppression() {
  const [content, setContent] = useState([]);
  const [clients, setClients] = useState([]);
  const [filters, setFilters] = useState({ client: "", type: "", platform: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/clients").then(setClients).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.client) params.set("client", filters.client);
    api.get(`/content?${params}`).then(setContent).catch((e) => setError(e.message));
  }, [filters.client]);

  const filtered = content.filter(
    (c) =>
      (!filters.type || c.type === filters.type) &&
      (!filters.platform || (c.platform || "").toLowerCase().includes(filters.platform.toLowerCase()))
  );

  const now = new Date();
  const month = now.toISOString().slice(0, 7);
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  const thisMonth = filtered.filter((c) => (c.published_at || "").slice(0, 7) === month).length;
  const thisWeek = filtered.filter((c) => (c.published_at || "").slice(0, 10) >= weekAgo).length;

  const platforms = [...new Set(content.map((c) => c.platform).filter(Boolean))];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text">Suppression</h1>

      <div className="grid grid-cols-3 gap-4 max-w-xl">
        <div className="stat-card"><span className="text-xs text-dim uppercase">Total</span><span className="text-2xl font-semibold">{filtered.length}</span></div>
        <div className="stat-card"><span className="text-xs text-dim uppercase">This Month</span><span className="text-2xl font-semibold text-gold">{thisMonth}</span></div>
        <div className="stat-card"><span className="text-xs text-dim uppercase">This Week</span><span className="text-2xl font-semibold text-safe">{thisWeek}</span></div>
      </div>

      <div className="panel p-4 flex flex-wrap gap-3">
        <select className="input max-w-[200px]" value={filters.client} onChange={(e) => setFilters({ ...filters, client: e.target.value })}>
          <option value="">All clients</option>
          {clients.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <select className="input max-w-[180px]" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All types</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="input max-w-[180px]" value={filters.platform} onChange={(e) => setFilters({ ...filters, platform: e.target.value })}>
          <option value="">All platforms</option>
          {platforms.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {error && <div className="panel p-4 text-danger text-sm">Error: {error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => <ContentCard key={c.id} item={c} />)}
        {filtered.length === 0 && <p className="text-dim text-sm">No content published yet.</p>}
      </div>
    </div>
  );
}
