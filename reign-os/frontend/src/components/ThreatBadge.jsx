// Monochrome badge system. White is the only color; meaning is encoded in
// opacity. Severity uses the canonical intelligence scale:
//   CRITICAL 1.0 · HIGH 0.65 · MEDIUM 0.35 · LOW 0.15

const SEVERITY_OPACITY = {
  critical: 1.0,
  high: 0.65,
  medium: 0.35,
  low: 0.15,
};

const SENTIMENT_OPACITY = {
  negative: 1.0,
  neutral: 0.35,
  positive: 0.65,
};

const badgeBase =
  "inline-block px-2 py-0.5 border text-[11px] font-semibold uppercase tracking-label bg-transparent";

export function ThreatBadge({ severity }) {
  const key = severity || "low";
  const o = SEVERITY_OPACITY[key] ?? SEVERITY_OPACITY.low;
  return (
    <span
      className={badgeBase}
      style={{ color: `rgba(255,255,255,${o})`, borderColor: `rgba(255,255,255,${o})` }}
    >
      {key}
    </span>
  );
}

export function SentimentTag({ sentiment }) {
  const key = sentiment || "neutral";
  const o = SENTIMENT_OPACITY[key] ?? SENTIMENT_OPACITY.neutral;
  return (
    <span
      className="text-xs font-medium uppercase tracking-label"
      style={{ color: `rgba(255,255,255,${o})` }}
    >
      {key}
    </span>
  );
}

// Status + tier badges: white border, white text, transparent fill — uniform.
export function StatusBadge({ status }) {
  return <span className={`${badgeBase} text-white border-white`}>{status}</span>;
}

export function TierBadge({ tier }) {
  return <span className={`${badgeBase} text-white border-white`}>{tier || "—"}</span>;
}

export default ThreatBadge;
