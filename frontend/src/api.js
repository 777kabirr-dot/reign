const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.detail) detail = body.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  base: BASE,
  dashboard: () => request("/dashboard"),
  stats: () => request("/stats"),

  listClients: () => request("/clients"),
  getClient: (id) => request(`/clients/${id}`),
  createClient: (data) =>
    request("/clients", { method: "POST", body: JSON.stringify(data) }),
  updateClient: (id, data) =>
    request(`/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteClient: (id) => request(`/clients/${id}`, { method: "DELETE" }),

  generate: (payload) =>
    request("/generate", { method: "POST", body: JSON.stringify(payload) }),

  listContent: (params = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v)
    ).toString();
    return request(`/content${q ? `?${q}` : ""}`);
  },

  getSettings: () => request("/settings"),
  updateSettings: (values) =>
    request("/settings", { method: "PUT", body: JSON.stringify({ values }) }),
};
