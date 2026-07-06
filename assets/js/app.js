/* ================================================================
   AZIMUTH — app.js
   Reveals, nav frost, counters, glass-card tilt, hero data-card
   rotation, forte connector pulse, mailto. Reduced-motion aware.
   ================================================================ */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer:fine)").matches;

  /* ---- branded preloader → masked headline reveal ---- */
  var pre = document.getElementById("preloader");
  var loadedFired = false;
  function finishLoad() {
    if (loadedFired) return;
    loadedFired = true;
    document.body.classList.add("loaded");
    if (pre) { pre.classList.add("done"); setTimeout(function () { pre.remove(); }, 750); }
  }
  if (reduced || !pre) {
    if (pre) pre.remove();
    document.body.classList.add("loaded");
    loadedFired = true;
  } else {
    var pct = pre.querySelector(".pre-pct");
    var bar = pre.querySelector(".pre-bar span");
    var n = 0;
    var iv = setInterval(function () {
      n = Math.min(100, n + 3 + Math.ceil(Math.random() * 9));
      if (pct) pct.textContent = ("00" + n).slice(-3);
      if (bar) bar.style.width = n + "%";
      if (n >= 100) { clearInterval(iv); setTimeout(finishLoad, 220); }
    }, 52);
    setTimeout(finishLoad, 2800); // failsafe — never trap the visitor
  }

  /* ---- scroll progress hairline ---- */
  var progBar = document.querySelector(".scroll-progress span");

  /* ---- cursor light + magnetic pills (desktop, motion allowed) ---- */
  if (!reduced && finePointer) {
    var glow = document.querySelector(".cursor-glow");
    if (glow) {
      var gx = -600, gy = -600, gtx = gx, gty = gy, glowOn = false;
      window.addEventListener("pointermove", function (e) {
        gtx = e.clientX; gty = e.clientY;
        if (!glowOn) { glowOn = true; document.body.classList.add("glow-on"); }
      }, { passive: true });
      (function glowLoop() {
        gx += (gtx - gx) * 0.12; gy += (gty - gy) * 0.12;
        glow.style.left = gx + "px"; glow.style.top = gy + "px";
        requestAnimationFrame(glowLoop);
      })();
    }
    document.querySelectorAll(".pill, .btn").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) / r.width;
        var dy = (e.clientY - r.top - r.height / 2) / r.height;
        el.style.transform = "translate(" + dx * 6 + "px," + dy * 5 + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ---- live office clocks ---- */
  var tzEls = document.querySelectorAll("[data-tz]");
  function updClocks() {
    tzEls.forEach(function (el) {
      try {
        el.textContent = new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit", minute: "2-digit", hour12: false,
          timeZone: el.getAttribute("data-tz")
        }).format(new Date());
      } catch (e) { el.textContent = ""; }
    });
  }
  if (tzEls.length) { updClocks(); setInterval(updClocks, 20000); }

  /* ---- cascade timing: capability tags + log rows ---- */
  if (!reduced) {
    document.querySelectorAll(".cap-node").forEach(function (node) {
      node.querySelectorAll(".cap-tag, .nested-label").forEach(function (tag, i) {
        tag.style.transitionDelay = Math.min(i * 24, 620) + "ms";
      });
    });
    document.querySelectorAll(".log .log-row").forEach(function (row, i) {
      row.style.transitionDelay = (i * 70) + "ms";
    });
  }

  /* ---- scroll reveals ---- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
        // clear cascade delays after entry so hover states stay snappy
        if (e.target.classList.contains("cap-node") || e.target.classList.contains("log")) {
          setTimeout(function () {
            e.target.querySelectorAll(".cap-tag, .nested-label, .log-row").forEach(function (el) {
              el.style.transitionDelay = "";
            });
          }, 1400);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- mobile menu ---- */
  var burger = document.getElementById("nav-burger");
  var mmenu = document.getElementById("mmenu");
  if (burger && mmenu) {
    function setMenu(open) {
      document.body.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      mmenu.setAttribute("aria-hidden", open ? "false" : "true");
    }
    burger.addEventListener("click", function () {
      setMenu(!document.body.classList.contains("menu-open"));
    });
    mmenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) setMenu(false);
    });
  }

  /* ---- scroll-drawn well path (Forte) ---- */
  var wpLine = document.getElementById("wp-line");
  var wpDot = document.getElementById("wp-dot");
  var forteSec = document.getElementById("forte");
  if (wpLine && forteSec && wpLine.getTotalLength) {
    var wpLen = wpLine.getTotalLength();
    if (!reduced) {
      wpLine.style.strokeDasharray = wpLen;
      wpLine.style.strokeDashoffset = wpLen;
      var wpTick = false;
      function wpScrub() {
        if (wpTick) return; wpTick = true;
        requestAnimationFrame(function () {
          var r = forteSec.getBoundingClientRect();
          var p = (window.innerHeight - r.top) / (r.height + window.innerHeight * 0.35);
          p = Math.max(0, Math.min(1, p));
          wpLine.style.strokeDashoffset = wpLen * (1 - p);
          if (wpDot) {
            var pt = wpLine.getPointAtLength(wpLen * p);
            wpDot.setAttribute("transform", "translate(" + pt.x.toFixed(1) + " " + pt.y.toFixed(1) + ")");
            wpDot.style.opacity = (p > 0.01 && p < 0.99) ? "1" : "0";
          }
          wpTick = false;
        });
      }
      window.addEventListener("scroll", wpScrub, { passive: true });
      window.addEventListener("resize", wpScrub);
      wpScrub();
    } else if (wpDot) {
      wpDot.style.display = "none";
    }
  }

  /* ---- nav frost on scroll ---- */
  var nav = document.getElementById("nav");
  var navNeedle = document.getElementById("nav-needle");
  var navBrg = document.getElementById("nav-brg");
  if (nav) {
    var nt = false;
    function navScroll() {
      if (nt) return; nt = true;
      requestAnimationFrame(function () {
        nav.classList.toggle("scrolled", window.pageYOffset > 30);
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var frac = max > 0 ? window.pageYOffset / max : 0;
        if (progBar) progBar.style.width = (frac * 100) + "%";
        // live bearing: the Azimuth needle tracks scroll through the page
        var deg = Math.round(frac * 360) % 361;
        if (navNeedle) navNeedle.style.transform = "rotate(" + deg + "deg)";
        if (navBrg) navBrg.textContent = ("00" + deg).slice(-3) + "°";
        nt = false;
      });
    }
    window.addEventListener("scroll", navScroll, { passive: true });
    navScroll();
  }

  /* ---- hero live data-card: rotate tags ---- */
  var dcItems = document.querySelectorAll(".dc-item");
  if (dcItems.length && !reduced) {
    var di = 0;
    setInterval(function () {
      dcItems[di].classList.remove("on");
      di = (di + 1) % dcItems.length;
      dcItems[di].classList.add("on");
    }, 3200);
  } else if (dcItems.length) {
    dcItems[0].classList.add("on");
  }

  /* ---- glass card tilt ---- */
  if (!reduced && window.matchMedia("(pointer:fine)").matches) {
    document.querySelectorAll(".will-tilt").forEach(function (card) {
      var raf = null;
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          card.style.transform = "perspective(900px) rotateX(" + (-py*4) + "deg) rotateY(" + (px*5) + "deg) translateY(-3px)";
        });
      });
      card.addEventListener("pointerleave", function () { if (raf) cancelAnimationFrame(raf); card.style.transform = ""; });
    });
  }

  /* ---- forte connector: animate a pulse dot along the SVG path ---- */
  var fLine = document.getElementById("forte-line");
  if (fLine && !reduced) {
    var path = fLine.querySelector("path");
    var dot = fLine.querySelector(".pulse");
    if (path && dot && path.getTotalLength) {
      var len = path.getTotalLength();
      var start = null;
      function pulseStep(ts) {
        if (!start) start = ts;
        var k = ((ts - start) / 3400) % 1;
        var pt = path.getPointAtLength(k * len);
        dot.setAttribute("cx", pt.x); dot.setAttribute("cy", pt.y);
        requestAnimationFrame(pulseStep);
      }
      requestAnimationFrame(pulseStep);
    }
  }

  /* ---- stat counters ---- */
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && !reduced && counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target, target = parseInt(el.getAttribute("data-count"), 10), t0 = null;
        function step(ts) {
          if (!t0) t0 = ts;
          var k = Math.min((ts - t0) / 1400, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---- contact form → mailto ---- */
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var name = document.getElementById("f-name").value.trim();
      var email = document.getElementById("f-email").value.trim();
      var msg = document.getElementById("f-msg").value.trim();
      var body = msg + "\n\n— " + name + (email ? " <" + email + ">" : "");
      window.location.href = "mailto:projects@azimuthenergysolutions.com"
        + "?subject=" + encodeURIComponent("Project enquiry — " + (name || "via website"))
        + "&body=" + encodeURIComponent(body);
    });
  }

  /* ---- footer year ---- */
  var yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();
})();
