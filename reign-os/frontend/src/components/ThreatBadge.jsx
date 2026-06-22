const SEVERITY = {
  critical: "bg-danger/15 text-danger border-danger/40",
  high: "bg-[#E67E22]/15 text-[#E67E22] border-[#E67E22]/40",
  medium: "bg-warn/15 text-warn border-warn/40",
  low: "bg-white/5 text-dim border-border",
};

const SENTIMENT = {
  positive: "text-safe",
  neutral: "text-dim",
  negative: "text-danger",
};

const STATUS = {
  pending: "bg-warn/15 text-warn border-warn/40",
  approved: "bg-safe/15 text-safe border-safe/40",
  rejected: "bg-white/5 text-dim border-border",
  sent: "bg-blue-500/15 text-blue-400 border-blue-500/40",
  new: "bg-gold/10 text-gold border-gold/30",
  flagged: "bg-[#E67E22]/15 text-[#E67E22] border-[#E67E22]/40",
  resolved: "bg-safe/15 text-safe border-safe/40",
};

export function ThreatBadge({ severity }) {
  const cls = SEVERITY[severity] || SEVERITY.low;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md border text-[11px] font-semibold uppercase tracking-wide ${cls}`}>
      {severity || "low"}
    </span>
  );
}

export function SentimentTag({ sentiment }) {
  return (
    <span className={`text-xs font-medium capitalize ${SENTIMENT[sentiment] || "text-dim"}`}>
      {sentiment || "neutral"}
    </span>
  );
}

export function StatusBadge({ status }) {
  const cls = STATUS[status] || "bg-white/5 text-dim border-border";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md border text-[11px] font-semibold uppercase tracking-wide ${cls}`}>
      {status}
    </span>
  );
}

export function TierBadge({ tier }) {
  const map = {
    shield: "border-dim/50 text-dim",
    sovereign: "border-gold/50 text-gold",
    dynasty: "border-safe/50 text-safe",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md border text-[11px] font-semibold uppercase tracking-wide ${map[tier] || map.shield}`}>
      {tier || "—"}
    </span>
  );
}

export default ThreatBadge;
