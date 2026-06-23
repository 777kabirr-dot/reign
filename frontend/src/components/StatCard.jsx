import { Card } from "./ui.jsx";

export default function StatCard({ label, value, hint, loading }) {
  return (
    <Card className="p-5 transition-colors hover:border-hover">
      <div className="font-mono text-[11px] uppercase tracking-widest text-white/40">
        {label}
      </div>
      <div className="mt-3 font-mono text-3xl font-semibold tabular-nums tracking-tight">
        {loading ? <span className="text-white/20">—</span> : value}
      </div>
      {hint && <div className="mt-1 text-xs text-white/35">{hint}</div>}
    </Card>
  );
}
