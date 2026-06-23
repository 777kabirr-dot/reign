import { NavLink } from "react-router-dom";

const NAV = [
  { to: "/", label: "Dashboard", end: true, glyph: "◇" },
  { to: "/clients", label: "Clients", glyph: "◎" },
  { to: "/generate", label: "Generate", glyph: "✦" },
  { to: "/library", label: "Library", glyph: "▤" },
  { to: "/settings", label: "Settings", glyph: "⚙" },
];

export default function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-subtle bg-surface px-4 py-6 md:flex">
      <div className="mb-9 flex items-center gap-2.5 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-btn border border-subtle font-mono text-sm">
          R
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">Reign</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-white/35">
            Content Publisher
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-btn px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-white/[0.06] text-white"
                  : "text-white/45 hover:bg-white/[0.03] hover:text-white/80"
              }`
            }
          >
            <span className="w-4 text-center font-mono text-xs text-white/40 group-hover:text-white/60">
              {item.glyph}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-2">
        <div className="rounded-card border border-subtle p-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/35">
            Solo workspace
          </p>
          <p className="mt-1 text-xs text-white/45">
            Positive SEO content, generated and published.
          </p>
        </div>
      </div>
    </aside>
  );
}
