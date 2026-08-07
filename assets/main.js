/* =============================================================
   WICKR GROUP — interactions
   ============================================================= */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';
  var hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    loader();
    mobileNav();
    adaptiveHeader();
    reveals();
    counters();
    smoothScroll();
    formNotes();
  }

  /* ---------------- Loader ---------------- */
  function loader() {
    var el = document.querySelector('.loader');
    if (!el) return;
    var count = el.querySelector('.loader__count');
    var bar = el.querySelector('.loader__bar');
    var n = 0, ready = false, min = performance.now();

    function finish() {
      el.classList.add('done');
      document.body.style.overflow = '';
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 900);
    }
    document.addEventListener('globe:ready', function () { ready = true; });
    window.addEventListener('load', function () { ready = true; });
    // safety: never hang
    setTimeout(function () { ready = true; }, 2600);

    var iv = setInterval(function () {
      var cap = ready ? 100 : 88;
      n += Math.max(1, (cap - n) * 0.18);
      if (n > cap) n = cap;
      var v = Math.round(n);
      if (count) count.textContent = (v < 10 ? '00' : v < 100 ? '0' : '') + v;
      if (bar) bar.style.width = v + '%';
      if (v >= 100 && performance.now() - min > 500) { clearInterval(iv); setTimeout(finish, 180); }
    }, 32);
  }

  /* ---------------- Mobile nav ---------------- */
  function mobileNav() {
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open'); toggle.classList.remove('open'); document.body.style.overflow = '';
      });
    });
  }

  /* ---------------- Adaptive header (dark/light + hide on scroll down) ---------------- */
  function adaptiveHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var themed = Array.prototype.slice.call(document.querySelectorAll('[data-nav-theme]'));
    var lastY = window.scrollY, ticking = false;

    function update() {
      var y = window.scrollY;
      header.classList.toggle('scrolled', y > 60);
      // hide when scrolling down (past hero), show when scrolling up
      if (y > 220) header.classList.toggle('hide', y > lastY);
      else header.classList.remove('hide');
      lastY = y;

      // which themed section sits under the header?
      var probe = 90, light = false;
      for (var i = 0; i < themed.length; i++) {
        var r = themed[i].getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) { light = themed[i].getAttribute('data-nav-theme') === 'light'; break; }
      }
      header.classList.toggle('on-light', light && !header.classList.contains('scrolled'));
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------------- Reveals ---------------- */
  function reveals() {
    var items = document.querySelectorAll('.reveal, .reveal-line');
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
    } else {
      var obs = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
      }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
      items.forEach(function (el) { obs.observe(el); });
    }

    // gentle parallax on marked media / titles
    if (hasST && !reduced) {
      document.querySelectorAll('[data-parallax]').forEach(function (el) {
        var amt = parseFloat(el.getAttribute('data-parallax')) || 60;
        gsap.fromTo(el, { yPercent: -amt / 10 }, {
          yPercent: amt / 10, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
      // image reveal-scale
      document.querySelectorAll('[data-grow]').forEach(function (el) {
        gsap.fromTo(el, { scale: 1.18 }, {
          scale: 1, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 30%', scrub: true }
        });
      });
    }
  }

  /* ---------------- Counters ---------------- */
  function counters() {
    var nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;
    function run(el) {
      var end = parseFloat(el.getAttribute('data-count'));
      if (reduced) { el.firstChild ? el.childNodes[0].nodeValue = end : el.textContent = end; return; }
      var start = performance.now(), dur = 1600;
      function step(t) {
        var p = Math.min((t - start) / dur, 1);
        var e = 1 - Math.pow(1 - p, 3);
        var val = Math.round(end * e);
        el.childNodes[0].nodeValue = val;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    var obs = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) { run(e.target); obs.unobserve(e.target); } });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { obs.observe(n); });
  }

  /* ---------------- Smooth scroll (Lenis, guarded) ---------------- */
  function smoothScroll() {
    var Lenis = window.Lenis;
    if (Lenis && !reduced && !('ontouchstart' in window)) {
      var lenis = new Lenis({ duration: 1.1, easing: function (t) { return 1 - Math.pow(1 - t, 3); }, smoothWheel: true });
      function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
      if (hasST) { lenis.on('scroll', ScrollTrigger.update); }
      // anchor links via lenis
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (ev) {
          var id = a.getAttribute('href');
          if (id.length > 1) { var t = document.querySelector(id); if (t) { ev.preventDefault(); lenis.scrollTo(t, { offset: -70 }); } }
        });
      });
    } else {
      // native smooth for anchors
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (ev) {
          var id = a.getAttribute('href');
          if (id.length > 1) { var t = document.querySelector(id); if (t) { ev.preventDefault(); t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); } }
        });
      });
    }
  }

  /* ---------------- Contact form notes ---------------- */
  function formNotes() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('sent') === '1') { var n = document.getElementById('formNote'); if (n) n.style.display = 'block'; }
    else if (params.get('error') === '1') { var e = document.getElementById('formError'); if (e) e.style.display = 'block'; }
  }
})();
