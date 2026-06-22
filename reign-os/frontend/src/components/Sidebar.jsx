import { NavLink } from "react-router-dom";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: "▦" },
  { to: "/clients", label: "Clients", icon: "◈" },
  { to: "/mentions", label: "Mentions", icon: "◎" },
  { to: "/suppression", label: "Suppression", icon: "▲" },
  { to: "/reports", label: "Reports", icon: "▤" },
  { to: "/legal", label: "Legal", icon: "§" },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-[64px] md:w-[220px] bg-bg border-r border-border flex flex-col z-20">
      <div className="h-16 flex items-center px-4 md:px-6 border-b border-border">
        <span className="text-white font-bold text-xl tracking-widest">R</span>
        <span className="hidden md:inline ml-2 font-semibold tracking-[0.2em] text-white">
          REIGN
        </span>
      </div>
      <nav className="flex-1 py-4">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 md:px-6 py-3 text-xs uppercase tracking-label border-l transition-colors ${
                isActive
                  ? "border-white text-white"
                  : "border-transparent text-dim hover:text-white"
              }`
            }
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span className="hidden md:inline">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="hidden md:block px-6 py-4 border-t border-border text-[11px] text-dim font-mono">
        Reign OS v1.0
      </div>
    </aside>
  );
}
