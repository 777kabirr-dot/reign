import { useState } from "react";
import { ThreatBadge, SentimentTag } from "./ThreatBadge.jsx";

export default function MentionRow({ mention, onResolve, onFlag }) {
  const [open, setOpen] = useState(false);
  const client = mention.clients?.name || "—";
  const date = (mention.detected_at || "").slice(0, 10);

  return (
    <>
      <tr
        className="border-t border-border hover:bg-white/[0.02] cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        <td className="td text-dim">{client}</td>
        <td className="td max-w-[320px]">
          <a
            href={mention.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-text hover:text-gold line-clamp-1"
          >
            {mention.title || mention.url}
          </a>
        </td>
        <td className="td text-dim font-mono text-xs">{mention.source}</td>
        <td className="td"><ThreatBadge severity={mention.severity} /></td>
        <td className="td"><SentimentTag sentiment={mention.sentiment} /></td>
        <td className="td text-dim font-mono text-xs">{date}</td>
        <td className="td text-dim text-xs uppercase">{mention.status}</td>
      </tr>
      {open && (
        <tr className="bg-bg/60">
          <td colSpan={7} className="td">
            <p className="text-sm text-text/90 mb-3">{mention.snippet || "No snippet."}</p>
            <div className="flex gap-2">
              <button
                className="btn-ghost text-xs"
                onClick={() => onResolve?.(mention)}
              >
                Mark resolved
              </button>
              <button
                className="btn-ghost text-xs"
                onClick={() => onFlag?.(mention)}
              >
                Flag for Advocate
              </button>
              <a className="btn-ghost text-xs" href={mention.url} target="_blank" rel="noreferrer">
                Open source ↗
              </a>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
