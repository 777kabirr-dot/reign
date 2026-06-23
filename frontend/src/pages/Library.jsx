import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { Badge, Card, Empty, PageHeader, Select } from "../components/ui.jsx";
import { formatDate, platformLabel } from "../lib/format.js";

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "seo_article", label: "SEO Article" },
  { value: "press_release", label: "Press Release" },
  { value: "linkedin_post", label: "LinkedIn Post" },
  { value: "gbp_response", label: "GBP Response" },
  { value: "faq_page", label: "FAQ Page" },
];

const PLATFORM_OPTIONS = [
  { value: "", label: "All platforms" },
  { value: "wordpress", label: "WordPress" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "medium", label: "Medium" },
  { value: "draft", label: "Draft" },
];

export default function Library() {
  const [all, setAll] = useState([]);
  const [clients, setClients] = useState([]);
  const [filters, setFilters] = useState({ client_id: "", type: "", platform: "", month: "" });
  const [active, setActive] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([api.listContent(), api.listClients()]).then(([content, cs]) => {
      setAll(content);
      setClients(cs);
      setLoaded(true);
    });
  }, []);

  const months = useMemo(() => {
    const set = new Set(all.map((r) => (r.published_at || "").slice(0, 7)).filter(Boolean));
    return [...set].sort().reverse();
  }, [all]);

  const rows = useMemo(() => {
    return all.filter((r) => {
      if (filters.client_id && r.client_id !== filters.client_id) return false;
      if (filters.type && r.type !== filters.type) return false;
      if (filters.platform && r.platform !== filters.platform) return false;
      if (filters.month && !(r.published_at || "").startsWith(filters.month)) return false;
      return true;
    });
  }, [all, filters]);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fade-up">
      <PageHeader
        title="Content Library"
        subtitle="Everything published across all clients."
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Select value={filters.client_id} onChange={set("client_id")}>
          <option value="" className="bg-elevated">
            All clients
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id} className="bg-elevated">
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={filters.type} onChange={set("type")}>
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-elevated">
              {o.label}
            </option>
          ))}
        </Select>
        <Select value={filters.platform} onChange={set("platform")}>
          {PLATFORM_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-elevated">
              {o.label}
            </option>
          ))}
        </Select>
        <Select value={filters.month} onChange={set("month")}>
          <option value="" className="bg-elevated">
            All months
          </option>
          {months.map((m) => (
            <option key={m} value={m} className="bg-elevated">
              {m}
            </option>
          ))}
        </Select>
      </div>

      {!loaded ? (
        <Card className="p-6 text-sm text-white/40">Loading…</Card>
      ) : rows.length === 0 ? (
        <Empty
          title="No content matches"
          subtitle={all.length ? "Try clearing the filters." : "Generate a batch to populate the library."}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1fr_1.6fr_0.9fr_0.8fr_0.8fr_0.5fr] gap-4 border-b border-subtle px-5 py-3 font-mono text-[11px] uppercase tracking-wide text-white/35 lg:grid">
            <span>Client</span>
            <span>Title</span>
            <span>Type</span>
            <span>Platform</span>
            <span>Published</span>
            <span className="text-right">Words</span>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {rows.map((r) => (
              <button
                key={r.id}
                onClick={() => setActive(r)}
                className="grid w-full grid-cols-1 gap-1 px-5 py-3.5 text-left text-sm transition-colors hover:bg-white/[0.02] lg:grid-cols-[1fr_1.6fr_0.9fr_0.8fr_0.8fr_0.5fr] lg:items-center lg:gap-4"
              >
                <div className="truncate text-white/55">{r.client_name}</div>
                <div className="truncate font-medium">{r.title}</div>
                <div className="truncate text-white/55">{r.type_label}</div>
                <div>
                  <Badge>{platformLabel(r.platform)}</Badge>
                </div>
                <div className="font-mono text-xs text-white/45">
                  {formatDate(r.published_at)}
                </div>
                <div className="text-right font-mono text-xs text-white/45">
                  {r.word_count}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {active && <PreviewPanel row={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function PreviewPanel({ row, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="slide-in relative flex h-full w-full max-w-xl flex-col border-l border-subtle bg-surface">
        <div className="flex items-start justify-between gap-4 border-b border-subtle px-6 py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wide text-white/40">
                {row.type_label}
              </span>
              <Badge>{platformLabel(row.platform)}</Badge>
            </div>
            <h2 className="mt-2 text-lg font-semibold leading-snug">{row.title}</h2>
            <div className="mt-1 text-xs text-white/40">
              {row.client_name} · {formatDate(row.published_at)} · {row.word_count} words
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-btn border border-subtle px-2.5 py-1 font-mono text-xs text-white/50 hover:border-hover hover:text-white"
          >
            Esc ✕
          </button>
        </div>
        {row.url && (
          <div className="border-b border-subtle px-6 py-3">
            <a
              href={row.url}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-white/60 underline-offset-2 hover:text-white hover:underline"
            >
              {row.url} ↗
            </a>
          </div>
        )}
        <div className="flex-1 overflow-auto px-6 py-5">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/80">
            {row.content_text}
          </pre>
        </div>
      </div>
    </div>
  );
}
