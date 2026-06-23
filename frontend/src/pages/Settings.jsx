import { useEffect, useState } from "react";
import { api } from "../api.js";
import { Badge, Button, Card, Input, PageHeader } from "../components/ui.jsx";
import { useToast } from "../components/Toast.jsx";

const GROUPS = [
  {
    title: "Anthropic",
    blurb: "Powers content generation (Claude).",
    keys: ["ANTHROPIC_API_KEY"],
  },
  {
    title: "Supabase",
    blurb: "Database. Leave blank to use the local in-memory store.",
    keys: ["SUPABASE_URL", "SUPABASE_KEY"],
  },
  {
    title: "Medium",
    blurb: "Optional. Integration token + user id.",
    keys: ["MEDIUM_TOKEN", "MEDIUM_USER_ID"],
  },
  {
    title: "LinkedIn",
    blurb: "Optional. Access token + author URN.",
    keys: ["LINKEDIN_TOKEN", "LINKEDIN_AUTHOR_URN"],
  },
];

export default function Settings() {
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState({});
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = () => api.getSettings().then(setData);
  useEffect(() => {
    load();
  }, []);

  const startEdit = (key) => {
    setEditing((e) => ({ ...e, [key]: true }));
    setValues((v) => ({ ...v, [key]: "" }));
  };

  const cancelEdit = (key) => {
    setEditing((e) => ({ ...e, [key]: false }));
    setValues((v) => {
      const next = { ...v };
      delete next[key];
      return next;
    });
  };

  const save = async () => {
    const payload = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v.trim())
    );
    if (Object.keys(payload).length === 0) {
      toast("Nothing to save", "error");
      return;
    }
    setSaving(true);
    try {
      const next = await api.updateSettings(payload);
      setData(next);
      setEditing({});
      setValues({});
      toast("Settings saved", "success");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const dirty = Object.values(values).some((v) => v.trim());

  return (
    <div className="fade-up max-w-3xl">
      <PageHeader
        title="Settings"
        subtitle="API keys are stored in the backend .env. Per-client WordPress credentials live on each client."
      />

      {data && (
        <div className="mb-6 flex flex-wrap gap-3">
          <ConnBadge label="Anthropic" ok={data.anthropic_connected} />
          <ConnBadge
            label={data.supabase_connected ? "Supabase" : "In-memory store"}
            ok={data.supabase_connected}
            neutralLabel
          />
        </div>
      )}

      <div className="flex flex-col gap-4">
        {GROUPS.map((group) => (
          <Card key={group.title} className="p-5">
            <div className="mb-4">
              <h2 className="text-sm font-semibold">{group.title}</h2>
              <p className="mt-0.5 text-xs text-white/40">{group.blurb}</p>
            </div>
            <div className="flex flex-col gap-3">
              {group.keys.map((key) => {
                const meta = data?.keys?.[key];
                const isEditing = editing[key];
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-44 shrink-0 font-mono text-xs text-white/45">
                      {key}
                    </div>
                    {isEditing ? (
                      <>
                        <Input
                          autoFocus
                          value={values[key] || ""}
                          onChange={(e) =>
                            setValues((v) => ({ ...v, [key]: e.target.value }))
                          }
                          placeholder="Enter new value"
                        />
                        <button
                          onClick={() => cancelEdit(key)}
                          className="shrink-0 font-mono text-xs text-white/40 hover:text-white"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 truncate font-mono text-sm text-white/60">
                          {meta?.configured ? meta.masked : (
                            <span className="text-white/25">Not set</span>
                          )}
                        </div>
                        <button
                          onClick={() => startEdit(key)}
                          className="shrink-0 rounded-btn border border-subtle px-3 py-1.5 text-xs text-white/60 hover:border-hover hover:text-white"
                        >
                          {meta?.configured ? "Edit" : "Add"}
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={save} loading={saving} disabled={!dirty}>
          Save changes
        </Button>
        {dirty && (
          <span className="text-xs text-white/40">
            Only the fields you edited will be written.
          </span>
        )}
      </div>
    </div>
  );
}

function ConnBadge({ label, ok, neutralLabel }) {
  return (
    <Badge className={ok ? "border-hover text-white/80" : ""}>
      <span
        className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
          ok ? "bg-white" : "bg-white/30"
        }`}
      />
      {neutralLabel ? label : `${label} ${ok ? "connected" : "missing"}`}
    </Badge>
  );
}
