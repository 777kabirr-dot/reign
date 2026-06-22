import { useEffect, useState } from "react";
import api from "../api.js";
import { StatusBadge } from "../components/ThreatBadge.jsx";

const TYPE_LABEL = {
  takedown: "Takedown",
  cease_desist: "Cease & Desist",
  platform_report: "Platform Report",
  dmca: "DMCA",
};

function DraftModal({ draft, onClose, onSaved }) {
  const [text, setText] = useState(draft.draft_text || "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/legal/${draft.id}`, { draft_text: text });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="panel p-6 w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-text">
              {TYPE_LABEL[draft.type] || draft.type}
            </h3>
            <p className="text-xs text-dim">{draft.clients?.name}</p>
          </div>
          <StatusBadge status={draft.status} />
        </div>
        {editing ? (
          <textarea
            className="input flex-1 font-mono text-xs h-96"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        ) : (
          <pre className="flex-1 overflow-auto whitespace-pre-wrap text-sm text-text/90 bg-bg border border-border rounded-lg p-4">
            {text}
          </pre>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn-ghost" onClick={onClose}>Close</button>
          {editing ? (
            <button className="btn-gold" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save edits"}
            </button>
          ) : (
            <button className="btn-ghost" onClick={() => setEditing(true)}>Edit Draft</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Legal() {
  const [drafts, setDrafts] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [error, setError] = useState("");

  const load = () => api.get("/legal").then(setDrafts).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const approve = async (d) => { await api.patch(`/legal/${d.id}/approve`, { approved_by: "Neel" }); load(); };
  const reject = async (d) => { await api.patch(`/legal/${d.id}/reject`, {}); load(); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text">Legal — Advocate Queue</h1>
        <div className="mt-2 panel p-3 border-warn/40 bg-warn/5 text-sm text-warn">
          This panel requires Neel's review. No draft is sent without approval.
        </div>
      </div>

      {error && <div className="panel p-4 text-danger text-sm">Error: {error}</div>}

      <div className="panel overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/[0.02]">
            <tr>
              <th className="th">Client</th>
              <th className="th">Threat URL</th>
              <th className="th">Type</th>
              <th className="th">Draft preview</th>
              <th className="th">Status</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((d) => (
              <tr key={d.id} className="border-t border-border align-top">
                <td className="td text-text">{d.clients?.name || "—"}</td>
                <td className="td max-w-[180px]">
                  <span className="text-xs font-mono text-dim line-clamp-1">{d.mention_id || "—"}</span>
                </td>
                <td className="td text-xs">{TYPE_LABEL[d.type] || d.type}</td>
                <td className="td max-w-[280px]">
                  <p className="text-xs text-dim line-clamp-2">{d.draft_text}</p>
                </td>
                <td className="td">
                  <StatusBadge status={d.status} />
                  {d.status === "approved" && d.approved_by && (
                    <div className="text-[10px] text-safe mt-1">
                      Approved by {d.approved_by}
                    </div>
                  )}
                </td>
                <td className="td">
                  <div className="flex flex-wrap gap-1.5">
                    <button className="btn-ghost text-xs" onClick={() => setViewing(d)}>View</button>
                    {d.status === "pending" && (
                      <>
                        <button className="btn text-xs bg-safe/15 text-safe border border-safe/40 hover:bg-safe/25" onClick={() => approve(d)}>Approve</button>
                        <button className="btn-danger text-xs" onClick={() => reject(d)}>Reject</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {drafts.length === 0 && (
              <tr><td colSpan={6} className="td text-dim text-center py-8">No legal drafts in the queue.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {viewing && (
        <DraftModal
          draft={viewing}
          onClose={() => setViewing(null)}
          onSaved={() => { setViewing(null); load(); }}
        />
      )}
    </div>
  );
}
