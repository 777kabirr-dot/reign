/* ============================================================
   ELYPHANT — site interactions
   ============================================================ */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Preloader ---------- */
  window.addEventListener("load", () => {
    setTimeout(() => {
      const p = document.getElementById("preloader");
      if (p) p.classList.add("is-done");
    }, reduce ? 200 : 1500);
  });

  /* ---------- Year ---------- */
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Nav: scroll state + hide on scroll-down ---------- */
  const nav = document.getElementById("nav");
  let lastY = 0;
  window.addEventListener("scroll", () => {
    const sy = window.scrollY;
    nav.classList.toggle("is-scrolled", sy > 30);
    if (sy > lastY && sy > 400) nav.classList.add("is-hidden");
    else nav.classList.remove("is-hidden");
    lastY = sy;
  }, { passive: true });

  /* ---------- Burger menu ---------- */
  const burger = document.getElementById("navBurger");
  if (burger) {
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", open);
    });
    nav.querySelectorAll(".nav__links a").forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        burger.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll("[data-reveal]");
  if (reduce) {
    reveals.forEach((r) => r.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          // stagger siblings a touch
          e.target.style.transitionDelay = (e.target.dataset.delay || (i % 3) * 80) + "ms";
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((r) => io.observe(r));
  }

  /* ---------- Mineral counters + bars ---------- */
  const panel = document.getElementById("mineralList");
  function animateCounters(root) {
    root.querySelectorAll("[data-count]").forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const decimals = (el.dataset.count.split(".")[1] || "").length;
      const dur = 1300; const t0 = performance.now();
      function step(now) {
        const k = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        el.textContent = (target * e).toFixed(decimals);
        if (k < 1) requestAnimationFrame(step);
        else el.textContent = decimals ? target.toFixed(decimals) : String(target);
      }
      requestAnimationFrame(step);
    });
    // bars
    const lis = root.querySelectorAll("li[data-val]");
    let max = 0; lis.forEach((li) => max = Math.max(max, parseFloat(li.dataset.val)));
    lis.forEach((li) => {
      const bar = li.querySelector(".mineral-list__bar i");
      if (bar) bar.style.width = Math.max(8, (parseFloat(li.dataset.val) / max) * 100) + "%";
    });
  }
  if (panel) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const sec = document.getElementById("minerals");
          if (reduce) {
            sec.querySelectorAll("[data-count]").forEach((el) => {
              const d = (el.dataset.count.split(".")[1] || "").length;
              el.textContent = parseFloat(el.dataset.count).toFixed(d);
            });
          } else {
            animateCounters(sec);
          }
          cio.disconnect();
        }
      });
    }, { threshold: 0.3 });
    cio.observe(panel);
  }

  /* ---------- Tilt cards ---------- */
  if (!reduce && window.matchMedia("(hover:hover)").matches) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${py * -7}deg) rotateY(${px * 9}deg) translateY(-6px)`;
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
  }

  /* ---------- Signup form ---------- */
  const form = document.getElementById("signupForm");
  const note = document.getElementById("formNote");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input");
      const val = (input.value || "").trim();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (!ok) {
        note.textContent = "Please enter a valid email address.";
        note.classList.remove("is-ok");
        input.focus();
        return;
      }
      note.textContent = "Thank you — you're on the list. We'll be in touch.";
      note.classList.add("is-ok");
      form.reset();
    });
  }

  /* ---------- Background bubbles canvas ---------- */
  const bg = document.getElementById("bgBubbles");
  if (bg && !reduce) {
    const ctx = bg.getContext("2d");
    let W, H, bubbles = [], raf;
    function size() {
      W = bg.width = window.innerWidth * Math.min(window.devicePixelRatio, 2);
      H = bg.height = window.innerHeight * Math.min(window.devicePixelRatio, 2);
    }
    size();
    const COUNT = Math.min(46, Math.floor(window.innerWidth / 28));
    for (let i = 0; i < COUNT; i++) {
      bubbles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: (Math.random() * 2.4 + 0.6) * Math.min(window.devicePixelRatio, 2),
        s: Math.random() * 0.35 + 0.12,
        a: Math.random() * 0.4 + 0.08,
        d: Math.random() * 0.6 - 0.3,
      });
    }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      bubbles.forEach((b) => {
        b.y -= b.s * 1.4;
        b.x += b.d * 0.3;
        if (b.y < -10) { b.y = H + 10; b.x = Math.random() * W; }
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(69,89,143,${b.a})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(frame);
    }
    frame();
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(size, 200); });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else frame();
    });
  }

  /* ---------- Active nav link ---------- */
  const sections = ["difference", "minerals", "source", "gallery", "contact"]
    .map((id) => document.getElementById(id)).filter(Boolean);
  const linkFor = {};
  document.querySelectorAll(".nav__links a").forEach((a) => {
    linkFor[a.getAttribute("href").slice(1)] = a;
  });
  if (sections.length) {
    const sio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const a = linkFor[e.target.id];
        if (a && e.isIntersecting) {
          Object.values(linkFor).forEach((l) => l.style.color = "");
          a.style.color = "var(--navy)";
        }
      });
    }, { threshold: 0.5 });
    sections.forEach((s) => sio.observe(s));
  }
})();
