/* ============================================================
   ELYPHANT — 3D can (three.js r128)
   Procedural aluminium can + canvas-painted label.
   Auto-rotates, draggable, light reflections.
   ============================================================ */
(function () {
  "use strict";

  const NAVY = "#1b2c5b";
  const NAVY_SOFT = "#45598f";
  const STILL = typeof location !== "undefined" && location.search.indexOf("still") !== -1;
  const FRONT = Math.PI; // rotation.y that brings the label (texture u=0.5) to face the camera (+Z)
  const mountEl = document.getElementById("canStage");
  const canvasEl = document.getElementById("canCanvas");
  const fallbackEl = document.getElementById("stageFallback");

  // Graceful fallback if WebGL / three.js unavailable
  function fail() {
    if (canvasEl) canvasEl.style.display = "none";
    if (fallbackEl) fallbackEl.classList.add("is-on");
  }
  if (!window.THREE) { fail(); return; }

  let renderer, scene, camera, canGroup, raf;
  let targetRotY = FRONT, curRotY = FRONT, velRotY = 0;
  let curRotX = 0, targetRotX = 0;
  let dragging = false, lastX = 0, lastY = 0, autoIdle = 0;

  /* ---------- Label texture (front + wrap) ---------- */
  function makeLabelTexture() {
    const W = 2048, H = 1024;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const x = c.getContext("2d");

    // base white wrap
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.5, "#fcfcfd");
    g.addColorStop(1, "#f4f5f7");
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);

    // The texture wraps around; center band = the front face.
    // Draw front art centred at W*0.5.
    const cx = W * 0.5;

    // Wordmark ELYPHANT — tall condensed
    x.save();
    x.translate(cx, H * 0.34);
    x.fillStyle = NAVY;
    x.textAlign = "center";
    x.textBaseline = "middle";
    // emulate tall condensed by scaling Y
    x.scale(1, 1.75);
    x.font = "700 168px 'Oswald','Arial Narrow',sans-serif";
    // letter-spacing manually
    drawTracked(x, "ELYPHANT", 0, 0, 14);
    x.restore();

    // small divider tick
    x.strokeStyle = "rgba(27,44,91,.45)";
    x.lineWidth = 3;
    x.beginPath(); x.moveTo(cx, H * 0.55); x.lineTo(cx, H * 0.60); x.stroke();

    // PREMIUM MINERAL WATER
    x.fillStyle = NAVY_SOFT;
    x.textAlign = "center";
    x.font = "500 40px 'Oswald',sans-serif";
    drawTracked(x, "PREMIUM", cx, H * 0.66, 16);
    drawTracked(x, "MINERAL WATER", cx, H * 0.715, 16);

    // divider tick
    x.beginPath(); x.moveTo(cx, H * 0.76); x.lineTo(cx, H * 0.80); x.stroke();

    // water drop icon
    x.save();
    x.translate(cx, H * 0.86);
    x.strokeStyle = NAVY;
    x.lineWidth = 4;
    x.beginPath();
    x.moveTo(0, -42);
    x.bezierCurveTo(34, -2, 30, 34, 0, 34);
    x.bezierCurveTo(-30, 34, -34, -2, 0, -42);
    x.stroke();
    x.restore();

    // 500 mL
    x.fillStyle = NAVY_SOFT;
    x.font = "italic 400 44px 'Cormorant Garamond',Georgia,serif";
    x.fillText("500 mL", cx, H * 0.95);

    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  }

  function drawTracked(ctx, text, cx, y, tracking) {
    const widths = [];
    let total = 0;
    for (const ch of text) { const w = ctx.measureText(ch).width + tracking; widths.push(w); total += w; }
    let sx = cx - total / 2;
    ctx.textAlign = "left";
    for (let i = 0; i < text.length; i++) {
      ctx.fillText(text[i], sx, y);
      sx += widths[i];
    }
    ctx.textAlign = "center";
  }

  /* ---------- Environment for metallic reflections ---------- */
  function makeEnv() {
    const c = document.createElement("canvas");
    c.width = 16; c.height = 256;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.35, "#dfe5f0");
    g.addColorStop(0.5, "#9fb0d0");
    g.addColorStop(0.65, "#eef1f7");
    g.addColorStop(1, "#c2cadd");
    x.fillStyle = g; x.fillRect(0, 0, 16, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    return tex;
  }

  /* ---------- Build can ---------- */
  function build() {
    scene = new THREE.Scene();

    const w = mountEl.clientWidth, h = mountEl.clientHeight;
    camera = new THREE.PerspectiveCamera(28, w / h, 0.1, 100);
    camera.position.set(0, 0, 16);

    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);

    const env = makeEnv();
    scene.environment = env;

    // lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(5, 8, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0xbcd0ff, 0.9);
    rim.position.set(-6, 2, -4); scene.add(rim);
    const fill = new THREE.PointLight(0xffffff, 0.5);
    fill.position.set(0, -4, 6); scene.add(fill);

    canGroup = new THREE.Group();
    scene.add(canGroup);

    const R = 1.32, BODY = 5.0;

    // body with label
    const label = makeLabelTexture();
    const bodyMat = new THREE.MeshStandardMaterial({
      map: label, metalness: 0.12, roughness: 0.42, envMap: env, envMapIntensity: 0.45,
    });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, BODY, 96, 1, true), bodyMat);
    canGroup.add(body);

    // aluminium material for rims / ends
    const alu = new THREE.MeshStandardMaterial({
      color: 0xdfe3ea, metalness: 1.0, roughness: 0.22, envMap: env, envMapIntensity: 1.0,
    });
    const aluDark = new THREE.MeshStandardMaterial({
      color: 0xb8bdc8, metalness: 1.0, roughness: 0.3, envMap: env, envMapIntensity: 0.9,
    });

    // top taper (neck in)
    const topTaper = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.78, R, 0.5, 96, 1, true), alu);
    topTaper.position.y = BODY / 2 + 0.25;
    canGroup.add(topTaper);

    // top rim ring
    const topRim = new THREE.Mesh(new THREE.TorusGeometry(R * 0.78, 0.06, 16, 80), alu);
    topRim.rotation.x = Math.PI / 2;
    topRim.position.y = BODY / 2 + 0.5;
    canGroup.add(topRim);

    // top lid
    const lid = new THREE.Mesh(new THREE.CircleGeometry(R * 0.78, 80), aluDark);
    lid.rotation.x = -Math.PI / 2;
    lid.position.y = BODY / 2 + 0.5;
    canGroup.add(lid);

    // bottom taper
    const botTaper = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.82, 0.45, 96, 1, true), alu);
    botTaper.position.y = -BODY / 2 - 0.22;
    canGroup.add(botTaper);

    // bottom rim
    const botRim = new THREE.Mesh(new THREE.TorusGeometry(R * 0.82, 0.07, 16, 80), aluDark);
    botRim.rotation.x = Math.PI / 2;
    botRim.position.y = -BODY / 2 - 0.44;
    canGroup.add(botRim);

    // bottom cap
    const cap = new THREE.Mesh(new THREE.CircleGeometry(R * 0.82, 80), aluDark);
    cap.rotation.x = Math.PI / 2;
    cap.position.y = -BODY / 2 - 0.44;
    canGroup.add(cap);

    canGroup.rotation.x = 0.06;
    canGroup.scale.setScalar(0.001); // grow-in on load
  }

  /* ---------- Interaction ---------- */
  function bindEvents() {
    const onDown = (e) => {
      dragging = true; autoIdle = 0;
      const p = e.touches ? e.touches[0] : e;
      lastX = p.clientX; lastY = p.clientY;
      hideHint();
    };
    const onMove = (e) => {
      if (!dragging) return;
      const p = e.touches ? e.touches[0] : e;
      const dx = p.clientX - lastX, dy = p.clientY - lastY;
      lastX = p.clientX; lastY = p.clientY;
      targetRotY += dx * 0.008;
      velRotY = dx * 0.008;
      targetRotX = Math.max(-0.45, Math.min(0.45, targetRotX + dy * 0.005));
    };
    const onUp = () => { dragging = false; };

    canvasEl.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    canvasEl.addEventListener("touchstart", onDown, { passive: true });
    canvasEl.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);

    // subtle parallax on pointer over the stage
    mountEl.addEventListener("mousemove", (e) => {
      if (dragging) return;
      const r = mountEl.getBoundingClientRect();
      parallax = (e.clientX - r.left) / r.width - 0.5;
    });
  }
  let parallax = 0;
  let hintHidden = false;
  function hideHint() {
    if (hintHidden) return; hintHidden = true;
    const hint = document.getElementById("stageHint");
    if (hint) hint.classList.add("is-hidden");
  }

  /* ---------- Loop ---------- */
  let grown = 0;
  function loop() {
    raf = requestAnimationFrame(loop);

    // grow-in
    if (grown < 1) {
      grown = Math.min(1, grown + 0.022);
      const s = easeOutBack(grown) * 1.0;
      canGroup.scale.setScalar(s);
    }

    // auto rotate when idle (slow turntable); skipped in ?still mode
    if (!dragging) {
      autoIdle += 1;
      if (!STILL && autoIdle > 40) targetRotY += 0.0024;
      velRotY *= 0.95;
      targetRotY += velRotY * 0.0;
    }

    curRotY += (targetRotY - curRotY) * 0.08;
    curRotX += (targetRotX - curRotX) * 0.08;
    canGroup.rotation.y = curRotY;
    canGroup.rotation.x = 0.06 + curRotX;

    // gentle float + parallax
    const t = performance.now() * 0.001;
    canGroup.position.y = Math.sin(t * 0.9) * 0.12;
    canGroup.position.x += ((parallax * 0.4) - canGroup.position.x) * 0.06;

    renderer.render(scene, camera);
  }

  function easeOutBack(t) {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  /* ---------- Resize ---------- */
  function onResize() {
    if (!renderer) return;
    const w = mountEl.clientWidth, h = mountEl.clientHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  /* ---------- Boot ---------- */
  function init() {
    try {
      build();
      bindEvents();
      loop();
      window.addEventListener("resize", onResize);
      // pause when off-screen
      const io = new IntersectionObserver((es) => {
        es.forEach((en) => {
          if (en.isIntersecting) { if (!raf) loop(); }
          else { cancelAnimationFrame(raf); raf = null; }
        });
      }, { threshold: 0 });
      io.observe(mountEl);
    } catch (err) {
      console.warn("3D can failed:", err);
      fail();
    }
  }

  // fonts may need to load before painting label; try after fonts ready
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => setTimeout(init, 30));
  } else {
    window.addEventListener("load", init);
  }
})();
