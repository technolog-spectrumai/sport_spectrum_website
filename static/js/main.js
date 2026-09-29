(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Theme toggle: an explicit choice is stored; otherwise the OS setting applies. */
  var themeToggle = document.getElementById('themeToggle');
  function currentTheme() {
    var set = root.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  themeToggle && themeToggle.addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('kroton-ai-theme', next); } catch (e) {}
  });

  /* Mobile navigation */
  var menuToggle = document.getElementById('menuToggle');
  var navLinks = document.getElementById('navLinks');
  function setMenu(open) {
    if (!navLinks || !menuToggle) return;
    navLinks.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  menuToggle && menuToggle.addEventListener('click', function () {
    setMenu(!navLinks.classList.contains('open'));
  });
  navLinks && navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  /* Hero ball animation respects reduced motion. */
  var court = document.querySelector('.court');
  if (court && reduceMotion && court.pauseAnimations) court.pauseAnimations();

  /* Reveal cards as they scroll into view. */
  var reveals = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduceMotion) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* Win-probability chart (illustrative data from data/win_probability.yaml).
     Drawn at the container's pixel width so text stays readable on phones. */
  var chart = document.getElementById('winChart');
  if (chart) initChart(chart);

  function initChart(el) {
    var NS = 'http://www.w3.org/2000/svg';
    var series = JSON.parse(el.getAttribute('data-series') || '[]');
    var eventRally = parseInt(el.getAttribute('data-event'), 10);
    var eventLabel = el.getAttribute('data-event-label') || '';
    var xLabel = el.getAttribute('data-x-label') || '';
    var yLabel = el.getAttribute('data-y-label') || '';
    var lowLabel = el.getAttribute('data-low-label') || '';
    var pct = el.getAttribute('data-pct') || '%';
    var tip = el.querySelector('.chart-tip');
    if (!series.length) return;

    var svg, geom, cross, hoverDot, active = -1, lastWidth = 0;

    function node(name, attrs, parent) {
      var n = document.createElementNS(NS, name);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(n);
      return n;
    }
    function text(parent, x, y, str, cls, anchor) {
      var t = node('text', { x: x, y: y, 'class': cls || '', 'text-anchor': anchor || 'start' }, parent);
      t.textContent = str;
      return t;
    }

    function render() {
      var w = Math.round(el.clientWidth);
      if (!w || w === lastWidth) return;
      lastWidth = w;
      if (svg) svg.remove();

      var narrow = w < 520;
      var h = Math.round(Math.max(250, Math.min(420, w * 0.55)));
      var pad = { l: 50, r: 44, t: narrow ? 58 : 44, b: 34 };
      var pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
      var n = series.length;
      var x = function (i) { return pad.l + (pw * i) / (n - 1); };
      var y = function (v) { return pad.t + ph * (1 - v / 100); };
      geom = { x: x, y: y, pad: pad, pw: pw, ph: ph, w: w, h: h };

      svg = node('svg', {
        viewBox: '0 0 ' + w + ' ' + h, width: w, height: h, tabindex: '0', role: 'img',
        'aria-label': yLabel + ': ' + xLabel + ' 1–' + n + ', ' + series[0] + pct + ' → ' + series[n - 1] + pct
      });
      el.insertBefore(svg, tip);

      // Recessive grid with clean ticks
      var grid = node('g', { 'class': 'grid' }, svg);
      var axis = node('g', { 'class': 'axis' }, svg);
      [0, 25, 50, 75, 100].forEach(function (v) {
        node('line', { x1: pad.l, x2: pad.l + pw, y1: y(v), y2: y(v) }, grid);
        text(axis, pad.l - 8, y(v) + 4, v + pct, '', 'end');
      });
      // X ticks; drop any that would collide with the previous label.
      var lastRight = -Infinity;
      [1, 10, 20, 30, 40].forEach(function (r, k) {
        var t = text(axis, x(r - 1), h - 10, k === 0 ? xLabel + ' ' + r : String(r), '', k === 0 ? 'start' : 'middle');
        var bb = t.getBBox ? t.getBBox() : null;
        if (bb && bb.x < lastRight + 12) { t.remove(); return; }
        if (bb) lastRight = bb.x + bb.width;
      });

      // Area wash and line
      var d = '';
      series.forEach(function (v, i) { d += (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); });
      node('path', { d: d + 'L' + x(n - 1).toFixed(1) + ' ' + y(0) + 'L' + x(0) + ' ' + y(0) + 'Z', 'class': 'area' }, svg);

      // Event annotation (timeout)
      if (eventRally >= 1 && eventRally <= n) {
        var ev = node('g', { 'class': 'event' }, svg);
        var ex = x(eventRally - 1);
        node('line', { x1: ex, x2: ex, y1: pad.t - (narrow ? 44 : 30), y2: y(0) }, ev);
        placeLabel(ev, ex, pad.t - 18, eventLabel);
      }

      node('path', { d: d, 'class': 'line' }, svg);

      // Selective direct labels: the low point and the latest value
      var low = 0;
      series.forEach(function (v, i) { if (v < series[low]) low = i; });
      node('circle', { cx: x(low), cy: y(series[low]), r: 4, 'class': 'dot' }, svg);
      var lowText = text(svg, x(low) + 4, y(series[low]) + 20, lowLabel + ' · ' + series[low] + pct, 'label muted', 'end');
      if (lowText.getBBox && lowText.getBBox().x < pad.l + 4) lowText.remove(); // no room: tooltip and table carry it
      node('circle', { cx: x(n - 1), cy: y(series[n - 1]), r: 5, 'class': 'dot' }, svg);
      text(svg, x(n - 1) + 9, y(series[n - 1]) + 4, series[n - 1] + pct, 'label', 'start');

      // Hover layer
      cross = node('line', { 'class': 'cross', y1: pad.t, y2: y(0), visibility: 'hidden' }, svg);
      hoverDot = node('circle', { r: 5, 'class': 'dot', visibility: 'hidden' }, svg);
      var hit = node('rect', { x: pad.l - 10, y: 0, width: pw + 20, height: h, fill: 'transparent' }, svg);

      function fromEvent(evt) {
        var box = svg.getBoundingClientRect();
        var px = (evt.clientX - box.left) * (w / box.width);
        return Math.max(0, Math.min(n - 1, Math.round(((px - pad.l) / pw) * (n - 1))));
      }
      hit.addEventListener('pointermove', function (evt) { show(fromEvent(evt)); });
      hit.addEventListener('pointerdown', function (evt) { show(fromEvent(evt)); });
      hit.addEventListener('pointerleave', hide);
      svg.addEventListener('focus', function () { show(active < 0 ? n - 1 : active); });
      svg.addEventListener('blur', hide);
      svg.addEventListener('keydown', function (evt) {
        if (evt.key === 'ArrowLeft' || evt.key === 'ArrowRight') {
          evt.preventDefault();
          var step = evt.key === 'ArrowLeft' ? -1 : 1;
          show(Math.max(0, Math.min(n - 1, (active < 0 ? n - 1 : active) + step)));
        } else if (evt.key === 'Home') { evt.preventDefault(); show(0); }
        else if (evt.key === 'End') { evt.preventDefault(); show(n - 1); }
      });
      if (active >= 0) show(active);
    }

    // Put the annotation beside its line; flip sides or wrap (by measured width) when space runs out.
    function placeLabel(parent, ex, ty, str) {
      var t = text(parent, ex + 8, ty, str, '', 'start');
      if (!t.getComputedTextLength) return;
      var right = geom.w - (ex + 8), left = ex - 8;
      if (t.getComputedTextLength() <= right) return;
      if (t.getComputedTextLength() <= left) { t.setAttribute('x', ex - 8); t.setAttribute('text-anchor', 'end'); return; }
      var useLeft = left > right, avail = Math.max(left, right) - 6, x0 = useLeft ? ex - 8 : ex + 8;
      t.textContent = '';
      t.setAttribute('x', x0);
      t.setAttribute('text-anchor', useLeft ? 'end' : 'start');
      var probe = node('tspan', {}, t), lines = [], cur = '';
      str.split(' ').forEach(function (word) {
        var attempt = cur ? cur + ' ' + word : word;
        probe.textContent = attempt;
        if (cur && probe.getComputedTextLength() > avail) { lines.push(cur); cur = word; } else { cur = attempt; }
      });
      lines.push(cur);
      t.removeChild(probe);
      lines.forEach(function (line, k) {
        var span = node('tspan', { x: x0, y: 14 + k * 14 }, t);
        span.textContent = line;
      });
    }

    function show(i) {
      active = i;
      var cx = geom.x(i), cy = geom.y(series[i]);
      cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.setAttribute('visibility', 'visible');
      hoverDot.setAttribute('cx', cx); hoverDot.setAttribute('cy', cy); hoverDot.setAttribute('visibility', 'visible');
      tip.textContent = '';
      var strong = document.createElement('strong');
      strong.textContent = series[i] + pct;
      var label = document.createElement('span');
      label.textContent = xLabel + ' ' + (i + 1) + (i + 1 === eventRally ? ' · ' + eventLabel : '');
      tip.appendChild(strong); tip.appendChild(label);
      tip.hidden = false;
      var scale = svg.getBoundingClientRect().width / geom.w;
      var tipW = tip.offsetWidth;
      var left = Math.max(tipW / 2, Math.min(el.clientWidth - tipW / 2, cx * scale));
      tip.style.left = left + 'px';
      tip.style.top = (cy * scale) + 'px';
    }
    function hide() {
      if (!cross) return;
      cross.setAttribute('visibility', 'hidden');
      hoverDot.setAttribute('visibility', 'hidden');
      tip.hidden = true;
    }

    render();
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { render(); }).observe(el);
    } else {
      window.addEventListener('resize', render);
    }
  }
})();
