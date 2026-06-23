import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Input,
  PageHeader,
  Select,
  Spinner,
} from "../components/ui.jsx";
import { useToast } from "../components/Toast.jsx";
import { platformLabel } from "../lib/format.js";

const CONTENT_TYPES = [
  { key: "seo_article", label: "SEO Article", hint: "800 words", platform: "WordPress" },
  { key: "press_release", label: "Press Release", hint: "250 words", platform: "WordPress" },
  { key: "linkedin_post", label: "LinkedIn Post", hint: "150 words", platform: "LinkedIn" },
  {
    key: "gbp_response",
    label: "Google Business Profile Response",
    hint: "review replies",
    platform: "Draft",
  },
  {
    key: "faq_page",
    label: "FAQ Page",
    hint: 'targets "[name] review / complaint"',
    platform: "WordPress",
  },
];

export default function Generate() {
  const [params] = useSearchParams();
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [selected, setSelected] = useState({});
  const [angle, setAngle] = useState("");
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");
  const [results, setResults] = useState(null);
  const [active, setActive] = useState(null);
  const toast = useToast();
  const statusTimer = useRef(null);

  useEffect(() => {
    api.listClients().then((cs) => {
      setClients(cs);
      const preset = params.get("client");
      if (preset && cs.some((c) => c.id === preset)) setClientId(preset);
      else if (cs.length) setClientId((id) => id || cs[0].id);
    });
    return () => clearInterval(statusTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chosen = useMemo(
    () => CONTENT_TYPES.filter((t) => selected[t.key]),
    [selected]
  );

  const toggle = (key) =>
    setSelected((s) => ({ ...s, [key]: !s[key] }));

  const runStatusReel = () => {
    const steps = [];
    chosen.forEach((t) => {
      steps.push(`Writing ${t.label.toLowerCase()}…`);
      if (t.platform !== "Draft") steps.push(`Publishing to ${t.platform}…`);
    });
    steps.push("Finishing up…");
    let i = 0;
    setStatus(steps[0]);
    statusTimer.current = setInterval(() => {
      i = Math.min(i + 1, steps.length - 1);
      setStatus(steps[i]);
    }, 1400);
  };

  const generate = async () => {
    if (!clientId) {
      toast("Select a client first", "error");
      return;
    }
    if (chosen.length === 0) {
      toast("Pick at least one content type", "error");
      return;
    }
    setRunning(true);
    setResults(null);
    setActive(null);
    runStatusReel();
    try {
      const res = await api.generate({
        client_id: clientId,
        content_types: chosen.map((t) => t.key),
        custom_angle: angle,
      });
      setResults(res);
      const published = res.filter((r) => r.platform !== "draft" && r.url).length;
      toast(
        `Generated ${res.length} piece${res.length > 1 ? "s" : ""}${
          published ? `, ${published} published live` : ""
        }`,
        "success"
      );
    } catch (err) {
      toast(err.message, "error");
    } finally {
      clearInterval(statusTimer.current);
      setStatus("");
      setRunning(false);
    }
  };

  const client = clients.find((c) => c.id === clientId);

  return (
    <div className="fade-up">
      <PageHeader
        title="Generate"
        subtitle="Write and publish a batch of positive SEO content."
      />

      {clients.length === 0 ? (
        <Empty
          title="Add a client first"
          subtitle="You need at least one client before you can generate."
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* Configurator */}
          <Card className="h-fit p-6">
            <Step n={1} title="Select client">
              <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                {clients.map((c) => (
                  <option key={c.id} value={c.id} className="bg-elevated">
                    {c.name}
                    {c.brand ? ` — ${c.brand}` : ""}
                  </option>
                ))}
              </Select>
              {client && !client.wp_configured && (
                <p className="mt-2 text-xs text-white/40">
                  No WordPress configured — articles will be saved as drafts.
                </p>
              )}
            </Step>

            <Step n={2} title="Content types">
              <div className="flex flex-col gap-2">
                {CONTENT_TYPES.map((t) => {
                  const on = !!selected[t.key];
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => toggle(t.key)}
                      className={`flex items-center gap-3 rounded-btn border px-3.5 py-3 text-left transition-colors ${
                        on
                          ? "border-hover bg-white/[0.06]"
                          : "border-subtle hover:border-hover"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                          on ? "border-white bg-white text-black" : "border-white/30"
                        }`}
                      >
                        {on ? "✓" : ""}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{t.label}</span>
                        <span className="block font-mono text-[11px] text-white/35">
                          {t.hint}
                        </span>
                      </span>
                      <Badge>{t.platform}</Badge>
                    </button>
                  );
                })}
              </div>
            </Step>

            <Step n={3} title="Custom angle" optional>
              <Input
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
                placeholder="Focus this batch on… (e.g. recent award, new venture)"
              />
            </Step>

            <div className="mt-6">
              <Button className="w-full" onClick={generate} loading={running}>
                {running ? "Generating…" : "Generate & Publish"}
              </Button>
            </div>
          </Card>

          {/* Output */}
          <div>
            {running && (
              <Card className="mb-4 flex items-center gap-3 p-5">
                <Spinner />
                <span className="text-sm text-white/70">{status}</span>
              </Card>
            )}

            {!running && !results && (
              <Empty
                title="Results will appear here"
                subtitle="Select content types and run a batch. Each piece shows a preview and live link."
              />
            )}

            {results && (
              <div className="flex flex-col gap-3">
                {results.map((r, i) => (
                  <Card key={i} className="overflow-hidden">
                    <button
                      onClick={() => setActive(active === i ? null : i)}
                      className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] uppercase tracking-wide text-white/40">
                            {r.type_label}
                          </span>
                          <Badge>{platformLabel(r.platform)}</Badge>
                          {r.word_count > 0 && (
                            <span className="font-mono text-[11px] text-white/30">
                              {r.word_count}w
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 truncate text-sm font-medium">{r.title}</div>
                        {!r.error ? (
                          <p className="mt-1 line-clamp-2 text-xs text-white/45">
                            {r.preview}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-white/50">{r.error}</p>
                        )}
                      </div>
                      <span className="mt-1 font-mono text-xs text-white/30">
                        {active === i ? "−" : "+"}
                      </span>
                    </button>

                    {active === i && (
                      <div className="border-t border-subtle px-5 py-4">
                        {r.url && (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mb-3 inline-block font-mono text-xs text-white/60 underline-offset-2 hover:text-white hover:underline"
                          >
                            {r.url} ↗
                          </a>
                        )}
                        <pre className="max-h-80 overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/75">
                          {r.content_text || "—"}
                        </pre>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Step({ n, title, optional, children }) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-subtle font-mono text-[11px] text-white/50">
          {n}
        </span>
        <span className="text-sm font-medium">{title}</span>
        {optional && (
          <span className="font-mono text-[10px] uppercase tracking-wide text-white/30">
            optional
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
