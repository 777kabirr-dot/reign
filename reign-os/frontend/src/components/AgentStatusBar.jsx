const AGENTS = ["Sentinel", "Publisher", "Analyst", "Advocate", "Orchestrator"];

// Derive a per-agent last-run map from orchestrator runs.
function deriveStatus(runs) {
  const status = {};
  AGENTS.forEach((a) => (status[a] = null));
  for (const run of runs || []) {
    const log = run.agents_run || {};
    const when = run.completed_at || run.run_date;
    // Orchestrator itself ran whenever a run exists.
    if (!status.Orchestrator) status.Orchestrator = when;
    ["sentinel", "publisher", "analyst", "advocate"].forEach((key) => {
      const cap = key.charAt(0).toUpperCase() + key.slice(1);
      if (log[key] && !log[key].skipped && !status[cap]) status[cap] = when;
    });
  }
  return status;
}

export default function AgentStatusBar({ runs }) {
  const status = deriveStatus(runs);
  return (
    <div className="panel p-5">
      <h3 className="text-sm font-semibold text-text mb-4">Agent Status</h3>
      <ul className="space-y-3">
        {AGENTS.map((agent) => {
          const last = status[agent];
          const active = Boolean(last);
          return (
            <li key={agent} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${active ? "bg-safe shadow-[0_0_8px] shadow-safe/60" : "bg-dim/40"}`}
                />
                <span className="text-sm text-text">{agent}</span>
              </div>
              <span className="text-[11px] text-dim font-mono">
                {last ? new Date(last).toLocaleDateString() : "idle"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
