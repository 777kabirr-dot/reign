import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Textarea,
} from "../components/ui.jsx";
import { useToast } from "../components/Toast.jsx";
import { relativeTime } from "../lib/format.js";

const TONES = ["Professional", "Authoritative", "Warm", "Bold"];

const EMPTY = {
  name: "",
  brand: "",
  industry: "",
  tone: "Professional",
  keywords: "",
  location: "",
  wp_url: "",
  wp_user: "",
  wp_pass: "",
  brief: "",
};

export default function Clients() {
  const [clients, setClients] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const load = () => api.listClients().then(setClients).catch(() => setClients([]));
  useEffect(() => {
    load();
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const resetForm = () => {
    setForm(EMPTY);
    setEditingId(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast("Name is required", "error");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.updateClient(editingId, form);
        toast("Client updated", "success");
      } else {
        await api.createClient(form);
        toast("Client added", "success");
      }
      resetForm();
      load();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = async (c) => {
    const full = await api.getClient(c.id);
    setForm({
      name: full.name || "",
      brand: full.brand || "",
      industry: full.industry || "",
      tone: full.tone || "Professional",
      keywords: full.keywords || "",
      location: full.location || "",
      wp_url: full.wp_url || "",
      wp_user: full.wp_user || "",
      wp_pass: "",
      brief: full.brief || "",
    });
    setEditingId(c.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete ${c.name}? This cannot be undone.`)) return;
    try {
      await api.deleteClient(c.id);
      toast("Client deleted", "success");
      if (editingId === c.id) resetForm();
      load();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  return (
    <div className="fade-up">
      <PageHeader title="Clients" subtitle="Who you generate content for." />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* List */}
        <section className="order-2 lg:order-1">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/45">
            {clients?.length ? `${clients.length} client${clients.length > 1 ? "s" : ""}` : "Clients"}
          </h2>
          {clients === null ? (
            <Card className="p-6 text-sm text-white/40">Loading…</Card>
          ) : clients.length === 0 ? (
            <Empty title="No clients yet" subtitle="Use the form to add one." />
          ) : (
            <Card className="overflow-hidden">
              <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.9fr_auto] gap-4 border-b border-subtle px-5 py-3 font-mono text-[11px] uppercase tracking-wide text-white/35 md:grid">
                <span>Name</span>
                <span>Industry</span>
                <span>Tone</span>
                <span>Last generated</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="divide-y divide-white/[0.06]">
                {clients.map((c) => (
                  <div
                    key={c.id}
                    className="grid grid-cols-1 gap-2 px-5 py-3.5 text-sm transition-colors hover:bg-white/[0.02] md:grid-cols-[1.4fr_1fr_0.8fr_0.9fr_auto] md:items-center md:gap-4"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{c.name}</div>
                      <div className="flex items-center gap-2 text-xs text-white/35">
                        {c.brand || "—"}
                        {c.wp_configured && <Badge>WP</Badge>}
                      </div>
                    </div>
                    <div className="truncate text-white/55">{c.industry || "—"}</div>
                    <div className="text-white/55">{c.tone}</div>
                    <div className="font-mono text-xs text-white/45">
                      {relativeTime(c.last_generated_at)}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/generate?client=${c.id}`)}
                        className="rounded-btn border border-subtle px-2.5 py-1 text-xs text-white/60 hover:border-hover hover:text-white"
                      >
                        Generate
                      </button>
                      <button
                        onClick={() => startEdit(c)}
                        className="rounded-btn px-2.5 py-1 text-xs text-white/45 hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(c)}
                        className="rounded-btn px-2.5 py-1 text-xs text-white/30 hover:text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>

        {/* Form */}
        <section className="order-1 lg:order-2">
          <Card className="sticky top-6 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {editingId ? "Edit client" : "Add client"}
              </h2>
              {editingId && (
                <button
                  onClick={resetForm}
                  className="font-mono text-xs text-white/40 hover:text-white"
                >
                  Cancel
                </button>
              )}
            </div>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <Field label="Name">
                <Input value={form.name} onChange={set("name")} placeholder="Jane Doe" />
              </Field>
              <Field label="Brand / company">
                <Input value={form.brand} onChange={set("brand")} placeholder="Doe Capital" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Industry">
                  <Input value={form.industry} onChange={set("industry")} placeholder="Finance" />
                </Field>
                <Field label="Tone">
                  <Select value={form.tone} onChange={set("tone")}>
                    {TONES.map((t) => (
                      <option key={t} value={t} className="bg-elevated">
                        {t}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Location" hint="optional">
                <Input value={form.location} onChange={set("location")} placeholder="New York, NY" />
              </Field>
              <Field label="Target keywords" hint="comma separated">
                <Input
                  value={form.keywords}
                  onChange={set("keywords")}
                  placeholder="wealth advisor, philanthropy"
                />
              </Field>

              <div className="rounded-btn border border-subtle p-3">
                <div className="mb-3 font-mono text-[11px] uppercase tracking-wide text-white/35">
                  WordPress
                </div>
                <div className="flex flex-col gap-3">
                  <Field label="Site URL">
                    <Input
                      value={form.wp_url}
                      onChange={set("wp_url")}
                      placeholder="https://blog.example.com"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Username">
                      <Input value={form.wp_user} onChange={set("wp_user")} placeholder="editor" />
                    </Field>
                    <Field label="App password" hint={editingId ? "blank = keep" : ""}>
                      <Input
                        type="password"
                        value={form.wp_pass}
                        onChange={set("wp_pass")}
                        placeholder="xxxx xxxx xxxx"
                      />
                    </Field>
                  </div>
                </div>
              </div>

              <Field label="Brief" hint="who they are, achievements, what to highlight">
                <Textarea
                  rows={5}
                  value={form.brief}
                  onChange={set("brief")}
                  placeholder="Describe the client: background, achievements, community work, and the narrative to reinforce."
                />
              </Field>

              <Button type="submit" loading={saving}>
                {editingId ? "Save changes" : "Add client"}
              </Button>
            </form>
          </Card>
        </section>
      </div>
    </div>
  );
}
