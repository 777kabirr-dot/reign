/* ================================================================
   AZIMUTH — app.js
   Reveals, nav frost, counters, glass-card tilt, hero data-card
   rotation, forte connector pulse, mailto. Reduced-motion aware.
   ================================================================ */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- scroll reveals ---- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- nav frost on scroll ---- */
  var nav = document.getElementById("nav");
  if (nav) {
    var nt = false;
    function navScroll() {
      if (nt) return; nt = true;
      requestAnimationFrame(function () { nav.classList.toggle("scrolled", window.pageYOffset > 30); nt = false; });
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
