import { useEffect, useState } from "react";
import api from "../api.js";

function thisMonth() {
  return new Date().toISOString().slice(0, 7);
}

function ReportRow({ client, reports, onGenerated }) {
  const [month, setMonth] = useState(thisMonth());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const existing = reports.find((r) => r.month === month);

  const generate = async () => {
    setGenerating(true);
    setError("");
    try {
      await api.post("/reports/generate", { client: client.slug, month });
      onGenerated();
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <tr className="border-t border-border">
      <td className="td">
        <div className="font-medium text-text">{client.name}</div>
        <div className="text-xs text-dim font-mono">{client.slug}</div>
      </td>
      <td className="td">
        <input
          type="month"
          className="input max-w-[160px]"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </td>
      <td className="td">
        {generating ? (
          <span className="text-warn text-xs">Generating…</span>
        ) : existing ? (
          <span className="text-safe text-xs">Generated · {(existing.generated_at || "").slice(0, 10)}</span>
        ) : (
          <span className="text-dim text-xs">Not yet generated</span>
        )}
        {error && <div className="text-danger text-xs mt-1">{error}</div>}
      </td>
      <td className="td">
        <div className="flex gap-2">
          <button className="btn-gold text-xs" onClick={generate} disabled={generating}>
            Generate
          </button>
          {existing && (
            <a
              className="btn-ghost text-xs"
              href={`${api.base}/reports/${existing.id}/download`}
              target="_blank"
              rel="noreferrer"
            >
              Download PDF
            </a>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function Reports() {
  const [clients, setClients] = useState([]);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");

  const load = () =>
    Promise.all([api.get("/clients"), api.get("/reports")])
      .then(([c, r]) => { setClients(c); setReports(r); })
      .catch((e) => setError(e.message));

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text">Reports</h1>
      {error && <div className="panel p-4 text-danger text-sm">Error: {error}</div>}
      <div className="panel overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/[0.02]">
            <tr>
              <th className="th">Client</th>
              <th className="th">Month</th>
              <th className="th">Status</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <ReportRow
                key={c.id}
                client={c}
                reports={reports.filter((r) => r.client_id === c.id)}
                onGenerated={load}
              />
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={4} className="td text-dim text-center py-8">No clients yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
