/* ============================================================
   ELYPHANT — site interactions
   Slow, restrained, heritage. No bounce, no spring.
   ============================================================ */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  document.body.classList.add('is-loading');

  /* ----------------------------------------------------------
     PRELOADER — logo mark animates alone, then content reveals
     ---------------------------------------------------------- */
  function endPreloader() {
    const pre = $('#preloader');
    document.body.classList.remove('is-loading');
    if (pre) pre.classList.add('is-done');
    // kick the first reveals (hero) once content is unlocked
    revealNow();
  }

  if (reduceMotion) {
    window.addEventListener('DOMContentLoaded', endPreloader);
  } else {
    // mark animates ~1.5s on its own before we reveal the page
    window.addEventListener('load', () => setTimeout(endPreloader, 1500));
    // safety net in case `load` never fires
    setTimeout(endPreloader, 4200);
  }

  /* ----------------------------------------------------------
     YEAR
     ---------------------------------------------------------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ----------------------------------------------------------
     NAV — opaque on scroll, mobile toggle
     ---------------------------------------------------------- */
  const nav    = $('#nav');
  const burger = $('#navBurger');
  const links  = $('#navLinks');

  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (burger && links) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('a', links).forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }));
  }

  /* ----------------------------------------------------------
     SCROLL REVEALS — fade + slight upward translate, staggered
     ---------------------------------------------------------- */
  const revealEls = $$('[data-reveal]');

  function show(el) {
    el.classList.add('is-in');
  }

  // immediate reveal for whatever is already in view (after preloader)
  function revealNow() {
    revealEls.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92 && !el.classList.contains('is-in')) {
        const group = el.closest('[data-reveal-group]');
        const sibs = group ? $$('[data-reveal]', group) : [el];
        const i = sibs.indexOf(el);
        setTimeout(() => show(el), reduceMotion ? 0 : Math.max(0, i) * 110);
      }
    });
  }

  if (reduceMotion) {
    revealEls.forEach(show);
  } else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      // stagger within shared groups
      const groups = new Map();
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const g = e.target.closest('[data-reveal-group]') || e.target;
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g).push(e.target);
      });
      groups.forEach(list => {
        list.forEach((el, i) => {
          setTimeout(() => show(el), i * 120);
          obs.unobserve(el);
        });
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(show);
  }

  /* ----------------------------------------------------------
     ACTIVE NAV LINK (scroll spy)
     ---------------------------------------------------------- */
  const sections = $$('main section[id]');
  const navAnchors = links ? $$('a', links) : [];
  if (sections.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const id = e.target.id;
        navAnchors.forEach(a =>
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
      });
    }, { threshold: 0.5 });
    sections.forEach(s => spy.observe(s));
  }

  /* ----------------------------------------------------------
     CURSOR-REACTIVE GLOW (dark sections only)
     ---------------------------------------------------------- */
  const glow = $('#cursorGlow');
  if (glow && !reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    const darkSelectors = '.hero, .bottle, .range, .find, .footer';
    let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;

    const loop = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      glow.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', (e) => {
      tx = e.clientX; ty = e.clientY;
      const overDark = !!(e.target.closest && e.target.closest(darkSelectors));
      glow.classList.toggle('is-on', overDark);
      if (!raf) loop();
    });
    window.addEventListener('mouseleave', () => glow.classList.remove('is-on'));
  }

  /* ----------------------------------------------------------
     THE BOTTLE — scroll-linked transform (zoom + slow rotate)
     ---------------------------------------------------------- */
  const bStage  = $('#bottleStage');
  const bObject = $('#bottleObject');
  if (bStage && bObject && !reduceMotion) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = bStage.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress 0 (entering bottom) -> 1 (leaving top)
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      const scale = 0.82 + p * 0.34;          // 0.82 -> 1.16
      const rotate = (p - 0.5) * 14;           // gentle -7deg -> 7deg
      const lift = (0.5 - p) * 40;             // subtle parallax
      bObject.style.transform =
        `translateY(${lift}px) scale(${scale.toFixed(3)}) rotate(${rotate.toFixed(2)}deg)`;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ----------------------------------------------------------
     HERO — slow light-dust particle field
     ---------------------------------------------------------- */
  const canvas = $('#heroDust');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    let w, h, dots = [], anim = 0;
    const GOLD = [156, 122, 60];
    const CREAM = [244, 241, 234];

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.parentElement.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }
    function build() {
      const count = Math.round(Math.min(70, (w * h) / 22000));
      dots = Array.from({ length: count }, () => {
        const gold = Math.random() < 0.4;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.6 + 0.4,
          vy: -(Math.random() * 0.14 + 0.03),   // slow drift up
          vx: (Math.random() - 0.5) * 0.05,
          a: Math.random() * 0.4 + 0.08,
          c: gold ? GOLD : CREAM
        };
      });
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.y += d.vy; d.x += d.vx;
        if (d.y < -5) { d.y = h + 5; d.x = Math.random() * w; }
        if (d.x < -5) d.x = w + 5; else if (d.x > w + 5) d.x = -5;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${d.c[0]},${d.c[1]},${d.c[2]},${d.a})`;
        ctx.fill();
      }
      anim = requestAnimationFrame(frame);
    }
    size();
    window.addEventListener('resize', size);
    // pause when hero is off-screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { if (!anim) frame(); }
        else { cancelAnimationFrame(anim); anim = 0; }
      }, { threshold: 0 }).observe(canvas);
    } else { frame(); }
  }

  /* ----------------------------------------------------------
     WAITLIST FORM
     ---------------------------------------------------------- */
  const form = $('#waitForm');
  const note = $('#formNote');
  if (form && note) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('#email', form);
      const val = (input.value || '').trim();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (!ok) {
        note.textContent = 'Please enter a valid email address.';
        input.focus();
        return;
      }
      note.textContent = 'Thank you — you’re on the list. We’ll be in touch.';
      form.reset();
    });
  }
})();
