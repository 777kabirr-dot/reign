// Demo backend — used only for the static GitHub Pages preview build
// (VITE_DEMO=1). It mirrors the real api.js surface with seeded, in-memory data
// so every page is fully interactive without a running FastAPI backend.

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function iso(daysAgo, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

let clients = [
  {
    id: "c1",
    name: "Jane Doe",
    brand: "Doe Capital",
    industry: "Finance",
    tone: "Authoritative",
    keywords: "wealth advisor, philanthropy, ESG investing",
    location: "New York, NY",
    brief:
      "Founder of Doe Capital, a boutique wealth-management firm. Pioneer of ESG investing, board member of the Hudson Youth Foundation.",
    wp_url: "https://blog.doecapital.com",
    wp_user: "editor",
    wp_configured: true,
    last_generated_at: iso(1, 9),
    created_at: iso(40),
  },
  {
    id: "c2",
    name: "Marcus Lee",
    brand: "Lumen Health",
    industry: "Healthcare",
    tone: "Warm",
    keywords: "telehealth, patient care, preventive medicine",
    location: "Austin, TX",
    brief:
      "CEO of Lumen Health, a telehealth platform expanding access to preventive care in underserved communities.",
    wp_url: "",
    wp_user: "",
    wp_configured: false,
    last_generated_at: iso(6, 14),
    created_at: iso(30),
  },
  {
    id: "c3",
    name: "Sofia Reyes",
    brand: "Reyes Studio",
    industry: "Architecture",
    tone: "Bold",
    keywords: "sustainable design, adaptive reuse, public space",
    location: "Los Angeles, CA",
    brief:
      "Principal at Reyes Studio, award-winning architect known for adaptive-reuse projects and sustainable civic spaces.",
    wp_url: "https://reyesstudio.com/journal",
    wp_user: "sofia",
    wp_configured: true,
    last_generated_at: iso(12, 11),
    created_at: iso(20),
  },
];

const TYPE_LABEL = {
  seo_article: "SEO Article",
  press_release: "Press Release",
  linkedin_post: "LinkedIn Post",
  gbp_response: "Google Business Profile Response",
  faq_page: "FAQ Page",
};

let content = [
  mk("c1", "seo_article", "wordpress", 1,
    "How Jane Doe Is Redefining ESG Investing at Doe Capital",
    "Jane Doe has spent two decades building Doe Capital into one of New York's most respected boutique wealth-management firms. Her approach pairs rigorous financial discipline with a conviction that capital can be a force for measurable good.\n\nUnder her leadership, Doe Capital was among the first firms in the region to integrate environmental, social, and governance criteria into every portfolio review. Clients describe a process that is as transparent as it is thorough.\n\nBeyond the balance sheet, Doe's work with the Hudson Youth Foundation has funded scholarships for more than four hundred students. It is a throughline in everything she does: long-term thinking, applied patiently.", 812),
  mk("c1", "linkedin_post", "linkedin", 1,
    "What two decades in finance taught me about patience",
    "Twenty years in, the lesson that keeps proving itself is patience. The best outcomes — for portfolios and for people — rarely arrive on the timeline we'd prefer.\n\nAt Doe Capital we build for decades, not quarters. That mindset shapes how we invest and how we show up for the communities we work in.\n\nWhat's a long-term bet you're glad you made? #investing #ESG", 151),
  mk("c1", "press_release", "wordpress", 9,
    "Doe Capital Expands ESG Advisory Practice",
    "NEW YORK — Doe Capital today announced the expansion of its ESG advisory practice, adding three senior analysts to meet growing client demand for values-aligned investing...", 248),
  mk("c1", "faq_page", "wordpress", 16,
    "Frequently Asked Questions About Jane Doe",
    "Q: Is Jane Doe a legitimate financial advisor?\nA: Yes. Jane Doe is the founder of Doe Capital, a registered investment firm with two decades of operating history...\n\nQ: What is Doe Capital's investment philosophy?\nA: Long-term, values-aligned investing with rigorous risk management...", 690),
  mk("c2", "linkedin_post", "linkedin", 6,
    "Preventive care shouldn't depend on your zip code",
    "Every week our team hears from someone who put off a checkup because the nearest clinic was an hour away. That gap is exactly why we built Lumen Health.\n\nTelehealth isn't a replacement for great clinicians — it's a way to put them within reach of everyone. Curious how others are closing access gaps in their communities. #telehealth #healthcare", 148),
  mk("c2", "seo_article", "draft", 6,
    "Marcus Lee and the Mission Behind Lumen Health",
    "When Marcus Lee founded Lumen Health, the goal was simple to state and hard to achieve: make preventive care reachable for everyone, regardless of geography or income...", 798),
  mk("c2", "gbp_response", "draft", 7,
    "Review responses for Marcus Lee",
    "Positive review reply:\nThank you so much for the kind words — our care team will be thrilled to hear this. We're grateful you trust Lumen Health with your care.\n\nNeutral review reply:\nThanks for taking the time to share your experience. We'd love to make your next visit even better — please reach out anytime.\n\nCritical review reply:\nWe're sorry your experience fell short. That's not the standard we hold ourselves to. We'd like to make it right — please contact our care team directly.", 132),
  mk("c3", "seo_article", "wordpress", 12,
    "Inside Sofia Reyes's Vision for Adaptive Reuse",
    "Sofia Reyes does not believe in tearing down what can be reimagined. As principal of Reyes Studio, she has turned aging warehouses, shuttered libraries, and forgotten transit halls into vibrant public spaces...", 826),
  mk("c3", "linkedin_post", "linkedin", 12,
    "The greenest building is the one already standing",
    "Adaptive reuse isn't nostalgia — it's the most sustainable thing we can do. Every structure we save keeps tons of carbon out of the atmosphere and a piece of a neighborhood's story intact.\n\nReyes Studio's latest project breathes new life into a 1920s transit hall. Proud of this one. #architecture #sustainability", 149),
  mk("c3", "press_release", "wordpress", 34,
    "Reyes Studio Wins Civic Design Award",
    "LOS ANGELES — Reyes Studio has been awarded the 2026 Civic Design Award for its adaptive-reuse transformation of the historic Alameda transit hall...", 251),
];

function mk(client_id, type, platform, daysAgo, title, body, words) {
  return {
    id: `m${Math.random().toString(36).slice(2)}`,
    client_id,
    type,
    type_label: TYPE_LABEL[type],
    platform,
    title,
    url:
      platform === "draft"
        ? null
        : platform === "linkedin"
        ? "https://www.linkedin.com/feed/update/urn:li:ugcPost:7000000000000000000"
        : "https://blog.example.com/" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40),
    content_text: body,
    word_count: words,
    published_at: iso(daysAgo, 10 + (daysAgo % 6)),
  };
}

function clientName(id) {
  return clients.find((c) => c.id === id)?.name || "Unknown client";
}

function withNames(rows) {
  return rows.map((r) => ({ ...r, client_name: clientName(r.client_id) }));
}

function stats() {
  const month = new Date().toISOString().slice(0, 7);
  const thisMonth = content.filter((r) => r.published_at.startsWith(month));
  return {
    total_clients: clients.length,
    articles_this_month: thisMonth.filter((r) =>
      ["seo_article", "faq_page"].includes(r.type)
    ).length,
    press_releases_sent: content.filter((r) => r.type === "press_release").length,
    linkedin_posts_live: content.filter(
      (r) => r.type === "linkedin_post" && r.platform === "linkedin"
    ).length,
  };
}

function sortByDate(rows) {
  return [...rows].sort((a, b) => b.published_at.localeCompare(a.published_at));
}

const SAMPLE_BODY = {
  seo_article: (c) =>
    `${c.name} has built a reputation in ${c.industry || "their field"} on substance rather than noise. This profile looks at the work, the milestones, and the vision that defines ${c.brand || c.name}.\n\n(Demo preview — connect an Anthropic API key in the real deployment to generate the full 800-word article.)`,
  press_release: (c) =>
    `FOR IMMEDIATE RELEASE — ${c.brand || c.name} today reaffirmed its commitment to the communities it serves...\n\n(Demo preview — the live backend generates a full AP-style release.)`,
  linkedin_post: (c) =>
    `A quick reflection from ${c.name}: the work that matters rarely announces itself loudly. Grateful for the team making it possible.\n\n(Demo preview.) #${(c.industry || "work").toLowerCase()}`,
  gbp_response: (c) =>
    `Positive review reply:\nThank you for the generous feedback — it means a lot to everyone at ${c.brand || c.name}.\n\n(Demo preview — the live backend returns positive, neutral, and critical reply variants.)`,
  faq_page: (c) =>
    `Q: Is ${c.name} legitimate?\nA: Yes — and this FAQ addresses the most common questions transparently.\n\n(Demo preview — the live backend generates 8 full Q&A pairs.)`,
};

const PLATFORM_FOR = {
  seo_article: "wordpress",
  press_release: "wordpress",
  linkedin_post: "linkedin",
  gbp_response: "draft",
  faq_page: "wordpress",
};

export const demo = {
  async dashboard() {
    await delay(150);
    return {
      stats: stats(),
      recent: withNames(sortByDate(content)).slice(0, 10),
      clients: clients.map((c) => ({
        id: c.id,
        name: c.name,
        tone: c.tone,
        industry: c.industry,
        last_generated_at: c.last_generated_at,
      })),
      backend: "demo",
    };
  },

  async stats() {
    await delay(80);
    return stats();
  },

  async listClients() {
    await delay(120);
    return clients;
  },

  async getClient(id) {
    await delay(80);
    return clients.find((c) => c.id === id);
  },

  async createClient(data) {
    await delay(200);
    const c = {
      ...data,
      id: `c${Math.random().toString(36).slice(2)}`,
      wp_configured: !!(data.wp_url && data.wp_user && data.wp_pass),
      last_generated_at: null,
      created_at: new Date().toISOString(),
    };
    delete c.wp_pass;
    clients = [c, ...clients];
    return c;
  },

  async updateClient(id, data) {
    await delay(180);
    clients = clients.map((c) =>
      c.id === id
        ? {
            ...c,
            ...data,
            wp_configured: !!(data.wp_url && data.wp_user),
          }
        : c
    );
    return clients.find((c) => c.id === id);
  },

  async deleteClient(id) {
    await delay(120);
    clients = clients.filter((c) => c.id !== id);
    content = content.filter((r) => r.client_id !== id);
    return null;
  },

  async generate({ client_id, content_types }) {
    // Simulate per-piece generation latency so the status reel feels real.
    await delay(900 + content_types.length * 500);
    const c = clients.find((x) => x.id === client_id);
    const out = content_types.map((type) => {
      const platform = c?.wp_configured || PLATFORM_FOR[type] !== "wordpress"
        ? PLATFORM_FOR[type]
        : "draft";
      const body = SAMPLE_BODY[type](c);
      const row = {
        id: `g${Math.random().toString(36).slice(2)}`,
        client_id,
        type,
        type_label: TYPE_LABEL[type],
        platform,
        title:
          type === "seo_article"
            ? `Profile: ${c.name}`
            : type === "faq_page"
            ? `Frequently Asked Questions About ${c.name}`
            : type === "press_release"
            ? `${c.brand || c.name} — Announcement`
            : type === "gbp_response"
            ? `Review responses for ${c.name}`
            : `Update from ${c.name}`,
        url:
          platform === "draft"
            ? null
            : platform === "linkedin"
            ? "https://www.linkedin.com/feed/update/urn:li:ugcPost:7100000000000000000"
            : `${c.wp_url || "https://blog.example.com"}/?p=${Math.floor(Math.random() * 9000)}`,
        content_text: body,
        word_count: body.split(/\s+/).length,
        published_at: new Date().toISOString(),
        preview: body.split("\n")[0],
        error: null,
      };
      content = [row, ...content];
      return row;
    });
    clients = clients.map((x) =>
      x.id === client_id ? { ...x, last_generated_at: new Date().toISOString() } : x
    );
    return out;
  },

  async listContent(params = {}) {
    await delay(150);
    let rows = sortByDate(content);
    if (params.client_id) rows = rows.filter((r) => r.client_id === params.client_id);
    if (params.type) rows = rows.filter((r) => r.type === params.type);
    if (params.platform) rows = rows.filter((r) => r.platform === params.platform);
    if (params.month) rows = rows.filter((r) => r.published_at.startsWith(params.month));
    return withNames(rows);
  },

  async getSettings() {
    await delay(80);
    return {
      keys: {
        ANTHROPIC_API_KEY: { label: "Anthropic API key", configured: false, masked: "" },
        SUPABASE_URL: { label: "Supabase URL", configured: false, masked: "" },
        SUPABASE_KEY: { label: "Supabase key", configured: false, masked: "" },
        MEDIUM_TOKEN: { label: "Medium token", configured: false, masked: "" },
        MEDIUM_USER_ID: { label: "Medium user id", configured: false, masked: "" },
        LINKEDIN_TOKEN: { label: "LinkedIn token", configured: false, masked: "" },
        LINKEDIN_AUTHOR_URN: { label: "LinkedIn author URN", configured: false, masked: "" },
      },
      supabase_connected: false,
      anthropic_connected: false,
    };
  },

  async updateSettings() {
    await delay(120);
    return this.getSettings();
  },
};
