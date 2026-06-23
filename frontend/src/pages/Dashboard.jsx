import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { Badge, Button, Card, Empty, PageHeader } from "../components/ui.jsx";
import StatCard from "../components/StatCard.jsx";
import { formatDate, platformLabel, relativeTime } from "../lib/format.js";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .dashboard()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  const stats = data?.stats;
  const loading = !data && !error;

  return (
    <div className="fade-up">
      <PageHeader
        title="Dashboard"
        subtitle="Everything published, at a glance."
        action={
          <Button onClick={() => navigate("/generate")}>Generate content</Button>
        }
      />

      {error && (
        <Card className="mb-8 p-4 text-sm text-white/60">
          Couldn’t reach the backend: {error}
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total clients" value={stats?.total_clients ?? 0} loading={loading} />
        <StatCard
          label="Articles this month"
          value={stats?.articles_this_month ?? 0}
          loading={loading}
        />
        <StatCard
          label="Press releases sent"
          value={stats?.press_releases_sent ?? 0}
          loading={loading}
        />
        <StatCard
          label="LinkedIn posts live"
          value={stats?.linkedin_posts_live ?? 0}
          loading={loading}
        />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/45">
          Recent activity
        </h2>
        {data?.recent?.length ? (
          <Card className="divide-y divide-white/[0.06] overflow-hidden">
            {data.recent.map((row) => (
              <div
                key={row.id}
                className="flex items-center gap-4 px-5 py-3.5 text-sm transition-colors hover:bg-white/[0.02]"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{row.title}</div>
                  <div className="mt-0.5 text-xs text-white/40">
                    {row.client_name} · {row.type_label}
                  </div>
                </div>
                <Badge>{platformLabel(row.platform)}</Badge>
                <div className="hidden w-24 text-right font-mono text-xs text-white/35 sm:block">
                  {formatDate(row.published_at)}
                </div>
                {row.url ? (
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-white/50 underline-offset-2 hover:text-white hover:underline"
                  >
                    View ↗
                  </a>
                ) : (
                  <span className="font-mono text-xs text-white/20">—</span>
                )}
              </div>
            ))}
          </Card>
        ) : (
          <Empty
            title="Nothing published yet"
            subtitle="Add a client, then generate a batch to see it land here."
            action={<Button onClick={() => navigate("/clients")}>Add a client</Button>}
          />
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/45">
          Clients
        </h2>
        {data?.clients?.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.clients.map((c) => (
              <Card
                key={c.id}
                className="group flex flex-col p-5 transition-colors hover:border-hover"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{c.name}</div>
                    <div className="mt-0.5 truncate text-xs text-white/40">
                      {c.industry || "—"}
                    </div>
                  </div>
                  {c.tone && <Badge>{c.tone}</Badge>}
                </div>
                <div className="mt-4 font-mono text-[11px] uppercase tracking-wide text-white/35">
                  Last generated
                </div>
                <div className="text-sm text-white/70">
                  {relativeTime(c.last_generated_at)}
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => navigate(`/generate?client=${c.id}`)}
                  >
                    Generate now
                  </Button>
                  <Link
                    to="/clients"
                    className="rounded-btn border border-subtle px-3 py-2 text-sm text-white/50 hover:border-hover hover:text-white"
                  >
                    Edit
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Empty
            title="No clients yet"
            subtitle="Clients are who you generate content for."
            action={<Button onClick={() => navigate("/clients")}>Add your first client</Button>}
          />
        )}
      </section>
    </div>
  );
}
