/* =============================================================
   WICKR GROUP — Monochrome interactive globe
   Three.js (r128). Sculptural, minimal, real locations only.
   ============================================================= */
(function () {
  var mount = document.getElementById('globe');
  var hero = document.querySelector('.hero');
  if (!mount || !hero) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 760px)').matches;

  // ---- WebGL support + Three present? ----
  function webglOK() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }
  if (typeof THREE === 'undefined' || !webglOK()) {
    hero.classList.add('no-webgl');
    return;
  }

  var W = mount.clientWidth, H = mount.clientHeight;
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
  camera.position.set(0, 0, 8.4);

  var renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
  mount.appendChild(renderer.domElement);

  var root = new THREE.Group();          // holds everything, driven by scroll
  var globe = new THREE.Group();         // spins autonomously
  root.add(globe);
  scene.add(root);

  var R = 2.4;

  // ---- lat/lon -> vector ----
  function ll(lat, lon, r) {
    var phi = (90 - lat) * Math.PI / 180;
    var theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    );
  }

  // ---- 1. Core sphere (matte dark) ----
  var core = new THREE.Mesh(
    new THREE.SphereGeometry(R, 64, 64),
    new THREE.MeshBasicMaterial({ color: 0x0d0e11 })
  );
  globe.add(core);

  // ---- 2. Fresnel rim (sculptural edge light) ----
  var rimMat = new THREE.ShaderMaterial({
    transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false,
    uniforms: { uColor: { value: new THREE.Color(0x8f8b82) }, uPower: { value: 3.4 } },
    vertexShader:
      'varying vec3 vN; varying vec3 vV;' +
      'void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader:
      'varying vec3 vN; varying vec3 vV; uniform vec3 uColor; uniform float uPower;' +
      'void main(){ float f = pow(1.0 - max(dot(vN,vV),0.0), uPower); gl_FragColor = vec4(uColor, f*0.9); }'
  });
  var rim = new THREE.Mesh(new THREE.SphereGeometry(R * 1.03, 48, 48), rimMat);
  globe.add(rim);

  // ---- 3. Fine surface dots (subtle geometry / continental texture feel) ----
  var dotCount = isMobile ? 1400 : 3200;
  var dpos = new Float32Array(dotCount * 3);
  var gold = Math.PI * (3 - Math.sqrt(5));
  for (var i = 0; i < dotCount; i++) {
    var y = 1 - (i / (dotCount - 1)) * 2;
    var rad = Math.sqrt(1 - y * y);
    var th = gold * i;
    dpos[i * 3]     = Math.cos(th) * rad * R * 1.004;
    dpos[i * 3 + 1] = y * R * 1.004;
    dpos[i * 3 + 2] = Math.sin(th) * rad * R * 1.004;
  }
  var dgeo = new THREE.BufferGeometry();
  dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  var dots = new THREE.Points(dgeo, new THREE.PointsMaterial({
    color: 0x4a4c52, size: 0.02, sizeAttenuation: true, transparent: true, opacity: 0.55, depthWrite: false
  }));
  globe.add(dots);

  // ---- 4. Graticule (fine lat/long geometry) ----
  var gratMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06 });
  var gg = new THREE.Group();
  for (var la = -60; la <= 60; la += 30) {
    var pts = [];
    for (var lo = 0; lo <= 360; lo += 4) pts.push(ll(la, lo, R * 1.006));
    gg.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gratMat));
  }
  for (var lo2 = 0; lo2 < 360; lo2 += 30) {
    var pts2 = [];
    for (var la2 = -90; la2 <= 90; la2 += 4) pts2.push(ll(la2, lo2, R * 1.006));
    gg.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2), gratMat));
  }
  globe.add(gg);

  // ---- 5. Real Wickr locations (never invented) ----
  var HQ = { lat: 50.07, lon: 14.44, name: 'Prague · HQ' };
  var LOCS = [
    HQ,
    { lat: 45.15, lon: 14.62, name: 'Krk · Croatia' },   // Čižići residential project
    { lat: 43.85, lon: 18.30, name: 'Bjelašnica · Bosnia' } // stadium / snowmaking work
  ];
  var brass = new THREE.Color(0xc7a56a);

  LOCS.forEach(function (L) {
    var p = ll(L.lat, L.lon, R * 1.012);
    var m = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 12), new THREE.MeshBasicMaterial({ color: brass }));
    m.position.copy(p);
    globe.add(m);
    // pulse ring
    var ring = new THREE.Mesh(
      new THREE.RingGeometry(0.05, 0.062, 24),
      new THREE.MeshBasicMaterial({ color: brass, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.position.copy(p);
    ring.lookAt(p.clone().multiplyScalar(2));
    ring.userData.base = 0.05;
    globe.add(ring);
    globe.userData.rings = globe.userData.rings || [];
    globe.userData.rings.push(ring);
  });

  // ---- 6. Arcs (genuine HQ -> project relationships) ----
  function arc(a, b) {
    var va = ll(a.lat, a.lon, R * 1.01), vb = ll(b.lat, b.lon, R * 1.01);
    var mid = va.clone().add(vb).multiplyScalar(0.5);
    var lift = 1 + va.distanceTo(vb) * 0.28;
    mid.normalize().multiplyScalar(R * lift);
    var curve = new THREE.QuadraticBezierCurve3(va, mid, vb);
    var g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(60));
    return new THREE.Line(g, new THREE.LineBasicMaterial({ color: brass, transparent: true, opacity: 0.4 }));
  }
  LOCS.slice(1).forEach(function (L) { globe.add(arc(HQ, L)); });

  // ---- Orientation: bring Europe toward the viewer, gentle axial tilt ----
  globe.rotation.x = 0.34;
  globe.rotation.y = -1.15;
  root.rotation.z = 0.05;

  // ---- Interaction: subtle pointer parallax ----
  var pointer = { x: 0, y: 0 }, target = { x: 0, y: 0 };
  if (!reduced) {
    window.addEventListener('pointermove', function (e) {
      target.x = (e.clientX / window.innerWidth - 0.5);
      target.y = (e.clientY / window.innerHeight - 0.5);
    }, { passive: true });
  }

  // ---- Scroll transition: globe drifts & fades as hero leaves ----
  var scrollP = 0;
  function onScroll() {
    var h = hero.offsetHeight || window.innerHeight;
    scrollP = Math.min(Math.max(window.scrollY / h, 0), 1);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- Resize ----
  function resize() {
    W = mount.clientWidth; H = mount.clientHeight;
    camera.aspect = W / H; camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  }
  window.addEventListener('resize', resize);

  // ---- Render loop ----
  var t0 = performance.now();
  function frame(now) {
    var dt = (now - t0) / 1000; t0 = now;

    if (!reduced) {
      globe.rotation.y += dt * 0.05;                 // slow, weighted autonomous spin
      target.x *= 1; target.y *= 1;
      pointer.x += (target.x - pointer.x) * 0.04;
      pointer.y += (target.y - pointer.y) * 0.04;
      root.rotation.y = pointer.x * 0.35;
      root.rotation.x = 0.05 + pointer.y * 0.2;

      // pulse rings
      var rings = globe.userData.rings || [];
      var pulse = (Math.sin(now * 0.0016) + 1) / 2;
      rings.forEach(function (r) {
        var s = 1 + pulse * 1.6; r.scale.set(s, s, s);
        r.material.opacity = 0.55 * (1 - pulse);
      });
    }

    // scroll-driven camera / globe evolution into first chapter
    var e = scrollP * scrollP * (3 - 2 * scrollP); // smoothstep
    root.position.x = e * -1.4;
    root.position.y = e * 0.5;
    root.scale.setScalar(1 - e * 0.16);
    camera.position.z = 8.4 + e * 1.6;
    mount.style.opacity = String(1 - e * 0.9);

    renderer.render(scene, camera);
    if (!reduced) requestAnimationFrame(frame);
  }

  // Reveal after first paint; signal loader
  requestAnimationFrame(function (n) {
    t0 = n;
    frame(n);
    if (reduced) { // render once, then keep updating only on scroll
      window.addEventListener('scroll', function () { frame(performance.now()); }, { passive: true });
      window.addEventListener('resize', function () { frame(performance.now()); });
    }
    window.__globeReady = true;
    document.dispatchEvent(new Event('globe:ready'));
  });
})();
