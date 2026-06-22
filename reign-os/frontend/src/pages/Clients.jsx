import { useEffect, useState } from "react";
import api from "../api.js";
import { TierBadge } from "../components/ThreatBadge.jsx";

const EMPTY = { name: "", slug: "", tier: "shield", context: "" };

function AddClientModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const created = await api.post("/clients", form);
      onCreated(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const slugify = (v) =>
    v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <form onSubmit={submit} className="panel p-6 w-full max-w-lg space-y-4">
        <h3 className="text-lg font-semibold text-text">Add Client</h3>
        {error && <p className="text-danger text-sm">{error}</p>}
        <div>
          <label className="text-xs text-dim">Name</label>
          <input
            className="input mt-1"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })}
            required
          />
        </div>
        <div>
          <label className="text-xs text-dim">Slug</label>
          <input
            className="input mt-1 font-mono"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
            required
          />
        </div>
        <div>
          <label className="text-xs text-dim">Tier</label>
          <select
            className="input mt-1"
            value={form.tier}
            onChange={(e) => setForm({ ...form, tier: e.target.value })}
          >
            <option value="shield">Shield</option>
            <option value="sovereign">Sovereign</option>
            <option value="dynasty">Dynasty</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-dim">Context (markdown)</label>
          <textarea
            className="input mt-1 h-40 font-mono text-xs"
            value={form.context}
            onChange={(e) => setForm({ ...form, context: e.target.value })}
            placeholder={"Client Name: ...\nBrand Name: ...\nLocation: ...\nIndustry: ...\nTone: ..."}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-gold" disabled={saving}>
            {saving ? "Saving…" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ClientDetail({ slug, onBack }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [context, setContext] = useState("");

  const load = () =>
    api
      .get(`/clients/${slug}`)
      .then((d) => {
        setData(d);
        setContext(d.client.context || "");
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, [slug]);

  const runNow = async () => {
    setRunning(true);
    try {
      await api.post("/orchestrator/run", { client: slug });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  const saveContext = async () => {
    try {
      await api.put(`/clients/${slug}/context`, { context });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (error) return <div className="panel p-4 text-danger text-sm">Error: {error}</div>;
  if (!data) return <p className="text-dim">Loading…</p>;

  const { client, stats } = data;
  return (
    <div className="space-y-6">
      <button className="text-sm text-dim hover:text-gold" onClick={onBack}>
        ← Back to clients
      </button>
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-text">{client.name}</h1>
          <TierBadge tier={client.tier} />
        </div>
        <button className="btn-gold" onClick={runNow} disabled={running}>
          {running ? "Running pipeline…" : "Run pipeline now"}
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card"><span className="text-xs text-dim uppercase">Mentions</span><span className="text-2xl font-semibold">{stats.mentions_total}</span></div>
        <div className="stat-card"><span className="text-xs text-dim uppercase">Critical + High</span><span className="text-2xl font-semibold text-danger">{stats.mentions_critical + stats.mentions_high}</span></div>
        <div className="stat-card"><span className="text-xs text-dim uppercase">Content</span><span className="text-2xl font-semibold text-gold">{stats.content_total}</span></div>
        <div className="stat-card"><span className="text-xs text-dim uppercase">Pending Drafts</span><span className="text-2xl font-semibold text-warn">{stats.drafts_pending}</span></div>
      </div>

      <div className="panel p-5">
        <h3 className="text-sm font-semibold text-text mb-3">Context file</h3>
        <textarea
          className="input h-64 font-mono text-xs"
          value={context}
          onChange={(e) => setContext(e.target.value)}
        />
        <div className="flex justify-end mt-3">
          <button className="btn-ghost" onClick={saveContext}>Save context</button>
        </div>
      </div>
    </div>
  );
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const load = () =>
    api
      .get("/clients")
      .then(async (list) => {
        setClients(list);
        // Pull lightweight stats per client for the "last scan" + counts.
        const map = {};
        await Promise.all(
          list.map(async (c) => {
            try {
              const d = await api.get(`/clients/${c.slug}`);
              map[c.slug] = d.stats;
            } catch {
              /* ignore */
            }
          })
        );
        setStats(map);
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  if (selected) return <ClientDetail slug={selected} onBack={() => { setSelected(null); load(); }} />;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text">Clients</h1>
        <button className="btn-gold" onClick={() => setShowModal(true)}>+ Add Client</button>
      </header>

      {error && <div className="panel p-4 text-danger text-sm">Error: {error}</div>}

      <div className="panel overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/[0.02]">
            <tr>
              <th className="th">Name</th>
              <th className="th">Tier</th>
              <th className="th">Status</th>
              <th className="th">Threats</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr
                key={c.id}
                className="border-t border-border hover:bg-white/[0.04] cursor-pointer"
                onClick={() => setSelected(c.slug)}
              >
                <td className="td">
                  <div className="font-medium text-text">{c.name}</div>
                  <div className="text-xs text-dim font-mono">{c.slug}</div>
                </td>
                <td className="td"><TierBadge tier={c.tier} /></td>
                <td className="td">
                  <span className={c.status === "active" ? "text-safe text-xs" : "text-dim text-xs"}>
                    {c.status}
                  </span>
                </td>
                <td className="td text-danger font-semibold">
                  {stats[c.slug]
                    ? stats[c.slug].mentions_critical + stats[c.slug].mentions_high
                    : "—"}
                </td>
                <td className="td">
                  <button
                    className="btn-ghost text-xs"
                    onClick={(e) => { e.stopPropagation(); setSelected(c.slug); }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={5} className="td text-dim text-center py-8">No clients yet. Add one to begin.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <AddClientModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}
