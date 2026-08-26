(function () {
  // mobile nav
  var t = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (t && links) t.addEventListener('click', function () { links.classList.toggle('open'); });

  // contact form result (send.php redirects back with ?sent=1 / ?error=1)
  var q = location.search;
  var note = document.getElementById(/error=1/.test(q) ? 'formError' : /sent=1/.test(q) ? 'formNote' : '');
  if (note) note.hidden = false;

  // vertical tabs (home only)
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  if (!tabs.length) return;
  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));
  var shell = document.getElementById('shell');
  var active = 0, timer;
  var keys = ['real-estate', 'technology', 'sport', 'retail'];

  function show(i, push) {
    if (i === active || i < 0 || i > 3) return;
    shell.classList.add('fading');
    clearTimeout(timer);
    timer = setTimeout(function () {
      active = i;
      tabs.forEach(function (el, n) { el.setAttribute('aria-selected', n === i ? 'true' : 'false'); });
      panels.forEach(function (p, n) { p.hidden = n !== i; });
      shell.classList.remove('fading');
      if (push && history.replaceState) history.replaceState(null, '', '#' + keys[i]);
    }, 180);
  }

  tabs.forEach(function (el) {
    el.addEventListener('click', function () { show(+el.dataset.i, true); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { show((+el.dataset.i + 1) % 4, true); tabs[(+el.dataset.i + 1) % 4].focus(); }
      if (e.key === 'ArrowLeft') { show((+el.dataset.i + 3) % 4, true); tabs[(+el.dataset.i + 3) % 4].focus(); }
    });
  });

  // deep links: index.html#technology etc.
  function fromHash(scroll) {
    var i = keys.indexOf((location.hash || '').replace('#', ''));
    if (i > -1) {
      show(i, false);
      if (scroll) setTimeout(function () {
        window.scrollTo({ top: document.querySelector('.tabs').offsetTop - 90, behavior: 'smooth' });
      }, 260);
    }
  }
  fromHash(true);
  window.addEventListener('hashchange', function () { fromHash(true); });
})();
