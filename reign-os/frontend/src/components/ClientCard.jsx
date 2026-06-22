import { TierBadge } from "./ThreatBadge.jsx";

export default function ClientCard({ client, stats, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left panel p-5 hover:border-gold/50 transition-colors w-full"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-text">{client.name}</h3>
          <p className="text-xs text-dim font-mono mt-0.5">{client.slug}</p>
        </div>
        <TierBadge tier={client.tier} />
      </div>
      {stats && (
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div>
            <div className="text-lg font-semibold text-text">{stats.mentions_total}</div>
            <div className="text-[10px] uppercase text-dim tracking-wide">Mentions</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-danger">
              {stats.mentions_critical + stats.mentions_high}
            </div>
            <div className="text-[10px] uppercase text-dim tracking-wide">Threats</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gold">{stats.content_total}</div>
            <div className="text-[10px] uppercase text-dim tracking-wide">Content</div>
          </div>
        </div>
      )}
    </button>
  );
}
