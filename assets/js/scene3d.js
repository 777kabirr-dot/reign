/* ================================================================
   AZIMUTH — scene3d.js
   3D node-and-line network for the hero. Nodes map to real things:
   office nodes (Pune / Perth / Houston) sit brighter and carry HTML
   labels; the rest are rig/survey data points. Thin lines connect
   neighbours; light pulses travel the edges like live data packets.
   Degrades to a static CSS/DOM state if three.js / WebGL is absent.
   ================================================================ */
(function () {
  "use strict";
  var THREE = window.THREE;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function hasWebGL() {
    try { var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl"))); }
    catch (e) { return false; }
  }

  var el = document.getElementById("hero-canvas");
  var labelHost = document.getElementById("hero-labels");
  if (!el) return;
  if (!THREE || !hasWebGL()) { document.body.classList.add("no-webgl"); return; }

  var COL = { node: 0xE8E8E6, line: 0xffffff, depth: 0x2A4A47 };

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0A0A0B, 0.055);

  var camera = new THREE.PerspectiveCamera(55, el.clientWidth / el.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 17);

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(el.clientWidth, el.clientHeight, false);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.setClearColor(0x000000, 0);
  el.appendChild(renderer.domElement);

  var group = new THREE.Group();
  scene.add(group);

  /* ---- build nodes ---- */
  // three named office nodes placed deliberately; rest are scattered rig/survey points
  var NAMED = [
    { name: "PUNE",    tag: "HQ",       pos: new THREE.Vector3(-6.5, 2.4, 1) },
    { name: "PERTH",   tag: "AU",       pos: new THREE.Vector3(5.8, -2.2, -1) },
    { name: "HOUSTON", tag: "OPENING",  pos: new THREE.Vector3(1.5, 3.4, -2) }
  ];
  var NCOUNT = 46;
  var nodes = [];
  var i;

  for (i = 0; i < NAMED.length; i++) {
    nodes.push({ p: NAMED[i].pos.clone(), named: true, meta: NAMED[i], base: NAMED[i].pos.clone() });
  }
  for (i = NAMED.length; i < NCOUNT; i++) {
    var v = new THREE.Vector3(
      (Math.random() - 0.5) * 22,
      (Math.random() - 0.5) * 13,
      (Math.random() - 0.5) * 10
    );
    nodes.push({ p: v, named: false, base: v.clone() });
  }

  /* node points (two sizes: named brighter/bigger) */
  function makePoints(list, size, opacity) {
    var g = new THREE.BufferGeometry();
    var arr = new Float32Array(list.length * 3);
    list.forEach(function (n, k) { arr[k*3]=n.p.x; arr[k*3+1]=n.p.y; arr[k*3+2]=n.p.z; });
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    var m = new THREE.PointsMaterial({ color: COL.node, size: size, transparent: true, opacity: opacity, sizeAttenuation: true, depthWrite: false });
    return { pts: new THREE.Points(g, m), geo: g };
  }
  var namedList = nodes.filter(function (n) { return n.named; });
  var restList  = nodes.filter(function (n) { return !n.named; });
  var namedP = makePoints(namedList, 0.42, 1);
  var restP  = makePoints(restList, 0.16, 0.75);
  group.add(namedP.pts); group.add(restP.pts);

  /* halo sprites for named nodes */
  function haloTexture() {
    var c = document.createElement("canvas"); c.width = c.height = 64;
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0, "rgba(232,232,230,.9)"); g.addColorStop(.4, "rgba(232,232,230,.25)"); g.addColorStop(1, "rgba(232,232,230,0)");
    ctx.fillStyle = g; ctx.fillRect(0,0,64,64);
    return new THREE.CanvasTexture(c);
  }
  var halo = haloTexture();
  namedList.forEach(function (n) {
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, transparent: true, opacity: .7, depthWrite: false }));
    s.position.copy(n.p); s.scale.set(1.6,1.6,1); group.add(s);
    n.sprite = s;
  });

  /* ---- edges: connect near neighbours ---- */
  var edges = [];
  var maxDist = 6.2, maxPer = 3;
  for (i = 0; i < nodes.length; i++) {
    var cnt = 0;
    for (var j = i + 1; j < nodes.length; j++) {
      if (nodes[i].p.distanceTo(nodes[j].p) < maxDist) {
        edges.push([i, j]); cnt++;
        if (cnt >= maxPer) break;
      }
    }
  }
  var lineGeo = new THREE.BufferGeometry();
  var linePos = new Float32Array(edges.length * 6);
  function writeLines() {
    for (var e = 0; e < edges.length; e++) {
      var a = nodes[edges[e][0]].p, b = nodes[edges[e][1]].p;
      linePos[e*6]=a.x; linePos[e*6+1]=a.y; linePos[e*6+2]=a.z;
      linePos[e*6+3]=b.x; linePos[e*6+4]=b.y; linePos[e*6+5]=b.z;
    }
    lineGeo.attributes.position.needsUpdate = true;
  }
  lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
  writeLines();
  var lineMat = new THREE.LineBasicMaterial({ color: COL.line, transparent: true, opacity: 0.1 });
  group.add(new THREE.LineSegments(lineGeo, lineMat));

  /* ---- travelling pulses along random edges ---- */
  var PCOUNT = Math.min(14, edges.length);
  var pulseGeo = new THREE.BufferGeometry();
  var pulsePos = new Float32Array(PCOUNT * 3);
  pulseGeo.setAttribute("position", new THREE.BufferAttribute(pulsePos, 3));
  var pulseMat = new THREE.PointsMaterial({ color: COL.node, size: 0.28, transparent: true, opacity: 0.95, depthWrite: false });
  group.add(new THREE.Points(pulseGeo, pulseMat));
  var pulses = [];
  for (i = 0; i < PCOUNT; i++) pulses.push({ e: Math.floor(Math.random()*edges.length), t: Math.random(), spd: 0.12 + Math.random()*0.5 });

  /* ---- petrol depth blob (large soft plane behind) ---- */
  // handled in CSS (.atmos .petrol); keep scene minimal

  /* ---- HTML labels for named nodes ---- */
  var labels = [];
  if (labelHost) {
    namedList.forEach(function (n) {
      var d = document.createElement("div");
      d.className = "node-label";
      d.innerHTML = '<span class="d"></span>' + n.meta.name + ' <span class="tag">' + n.meta.tag + '</span>';
      labelHost.appendChild(d);
      n.label = d; labels.push(n);
    });
    setTimeout(function(){ labels.forEach(function(n){ n.label.classList.add("on"); }); }, 700);
  }

  /* ---- interaction: pointer parallax ---- */
  var tx = 0, ty = 0, mx = 0, my = 0;
  if (!reduced) {
    window.addEventListener("pointermove", function (e) {
      tx = (e.clientX / window.innerWidth - 0.5);
      ty = (e.clientY / window.innerHeight - 0.5);
    }, { passive: true });
  }

  /* ---- render loop ---- */
  var visible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { visible = e.isIntersecting; }); }, { rootMargin: "80px" }).observe(el);
  }
  document.addEventListener("visibilitychange", function () { visible = !document.hidden; });

  var clock = new THREE.Clock();
  var pv = new THREE.Vector3();

  function projectTo2D(vec) {
    var p = vec.clone().project(camera);
    return { x: (p.x * 0.5 + 0.5) * el.clientWidth, y: (-p.y * 0.5 + 0.5) * el.clientHeight, vis: p.z < 1 };
  }

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    var t = clock.getElapsedTime();

    // gentle node drift (organic breathing)
    if (!reduced) {
      for (i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.p.x = n.base.x + Math.sin(t * 0.3 + i) * 0.22;
        n.p.y = n.base.y + Math.cos(t * 0.25 + i * 1.3) * 0.22;
        n.p.z = n.base.z + Math.sin(t * 0.2 + i * 0.7) * 0.18;
      }
      // push updated positions to point buffers
      namedList.forEach(function (n, k) { var a=namedP.geo.attributes.position; a.setXYZ(k, n.p.x,n.p.y,n.p.z); if(n.sprite) n.sprite.position.copy(n.p); });
      namedP.geo.attributes.position.needsUpdate = true;
      restList.forEach(function (n, k) { var a=restP.geo.attributes.position; a.setXYZ(k, n.p.x,n.p.y,n.p.z); });
      restP.geo.attributes.position.needsUpdate = true;
      writeLines();

      // advance pulses
      for (i = 0; i < pulses.length; i++) {
        var pl = pulses[i];
        pl.t += pl.spd * 0.016;
        if (pl.t > 1) { pl.t = 0; pl.e = Math.floor(Math.random()*edges.length); pl.spd = 0.12 + Math.random()*0.5; }
        var ed = edges[pl.e];
        pv.copy(nodes[ed[0]].p).lerp(nodes[ed[1]].p, pl.t);
        pulseGeo.attributes.position.setXYZ(i, pv.x, pv.y, pv.z);
      }
      pulseGeo.attributes.position.needsUpdate = true;

      // sprite twinkle
      namedList.forEach(function (n, k) { if (n.sprite) { var s = 1.5 + Math.sin(t*2 + k)*0.25; n.sprite.scale.set(s, s, 1); } });
    }

    // camera parallax + slow orbit
    mx += (tx - mx) * 0.03; my += (ty - my) * 0.03;
    camera.position.x = mx * 5 + Math.sin(t * 0.08) * 1.2;
    camera.position.y = -my * 3 + Math.cos(t * 0.06) * 0.8;
    camera.lookAt(0, 0, 0);
    group.rotation.y = Math.sin(t * 0.05) * 0.12;

    // hero → content handoff: network drifts up and dims as you scroll away
    if (!reduced) {
      var sf = Math.min(1, (window.pageYOffset || 0) / (window.innerHeight * 0.95));
      group.position.y = sf * 3.6;
      renderer.domElement.style.opacity = String(1 - sf * 0.85);
    }

    // update HTML labels
    for (i = 0; i < labels.length; i++) {
      var s2 = projectTo2D(labels[i].p);
      var lab = labels[i].label;
      if (s2.vis) { lab.style.left = s2.x + "px"; lab.style.top = (s2.y - 20) + "px"; }
    }

    renderer.render(scene, camera);
  }

  function resize() {
    camera.aspect = el.clientWidth / el.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(el.clientWidth, el.clientHeight, false);
  }
  window.addEventListener("resize", resize);
  requestAnimationFrame(frame);
})();
