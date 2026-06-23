import { NavLink, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";

const MOBILE_NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/clients", label: "Clients" },
  { to: "/generate", label: "Generate" },
  { to: "/library", label: "Library" },
  { to: "/settings", label: "Settings" },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top nav */}
        <header className="sticky top-0 z-30 flex items-center gap-1 overflow-x-auto border-b border-subtle bg-black/80 px-4 py-3 backdrop-blur md:hidden">
          <div className="mr-2 font-mono text-sm font-semibold">Reign</div>
          {MOBILE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-btn px-3 py-1.5 text-xs ${
                  isActive ? "bg-white/10 text-white" : "text-white/50"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </header>

        <main className="mx-auto w-full max-w-shell flex-1 px-5 py-8 sm:px-8 sm:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
