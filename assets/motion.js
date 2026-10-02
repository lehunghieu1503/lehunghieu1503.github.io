// Scroll reveal, the count-up on the home page numbers, and the reading
// progress bar. Runs only when the head script has set .motion, which it
// skips for readers who prefer reduced motion.
(function () {
  var root = document.documentElement;
  if (!root.classList.contains('motion')) return;

  // Set when the reader turns on reduced motion while the page is open.
  var stopped = false;

  // Reveal on scroll

  var proseBlocks = document.querySelectorAll(
    '.prose h2, .prose div.highlighter-rouge, .prose table, .prose blockquote'
  );
  for (var i = 0; i < proseBlocks.length; i++) proseBlocks[i].setAttribute('data-reveal', '');

  var items = document.querySelectorAll('[data-reveal]');

  // Once shown, drop the hooks so the element's own hover transitions apply.
  function settle(el) {
    el.removeAttribute('data-reveal');
    el.classList.remove('is-in');
    el.style.removeProperty('--d');
  }

  if ('IntersectionObserver' in window && items.length) {
    var observer = new IntersectionObserver(function (entries) {
      var shown = 0;
      entries.forEach(function (entry) {
        var el = entry.target;
        // Not yet reached. Elements already scrolled past are shown at once.
        if (!entry.isIntersecting && entry.boundingClientRect.bottom > 0) return;
        observer.unobserve(el);
        el.style.setProperty('--d', Math.min(shown++, 6) * 70 + 'ms');
        el.classList.add('is-in');
        setTimeout(function () { settle(el); }, 1400);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    root.classList.add('reveal-ready');
    for (var j = 0; j < items.length; j++) observer.observe(items[j]);

    // A jump (anchor link, End key) can pass an element without it ever
    // intersecting. Show whatever is now above the viewport, without animating.
    var sweeping = false;
    window.addEventListener('scroll', function () {
      if (sweeping) return;
      sweeping = true;
      requestAnimationFrame(function () {
        sweeping = false;
        var pending = document.querySelectorAll('[data-reveal]:not(.is-in)');
        for (var n = 0; n < pending.length; n++) {
          if (pending[n].getBoundingClientRect().bottom < 0) {
            observer.unobserve(pending[n]);
            settle(pending[n]);
          }
        }
      });
    }, { passive: true });
  }

  // Count up

  function countUp(el, delay, duration) {
    var parts = el.textContent.trim().split(/(\d+)/);
    function render(progress) {
      el.textContent = parts.map(function (part) {
        if (!/^\d+$/.test(part)) return part;
        var value = String(Math.round(parseInt(part, 10) * progress));
        while (value.length < part.length) value = '0' + value;
        return value;
      }).join('');
    }
    var start = null;
    function frame(now) {
      if (start === null) start = now;
      var t = stopped ? 1 : Math.min(1, Math.max(0, (now - start - delay) / duration));
      render(1 - Math.pow(1 - t, 3));
      if (t < 1) requestAnimationFrame(frame);
    }
    render(0);
    requestAnimationFrame(frame);
  }

  var counters = document.querySelectorAll('[data-count]');
  for (var k = 0; k < counters.length; k++) countUp(counters[k], 900, 1400);

  // Reading progress

  var bar = document.querySelector('.progress');
  if (bar) {
    var queued = false;
    function update() {
      queued = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      bar.style.transform = 'scaleX(' + progress + ')';
    }
    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  // Reduced motion switched on mid-session: show everything, stop the rest.
  // The CSS media query drops the animations; this clears what JS started.
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  function onReduce(event) {
    if (!event.matches) return;
    stopped = true;
    root.classList.remove('motion', 'reveal-ready');
    var pending = document.querySelectorAll('[data-reveal]');
    for (var m = 0; m < pending.length; m++) settle(pending[m]);
  }
  if (reduce) {
    if (reduce.addEventListener) reduce.addEventListener('change', onReduce);
    else if (reduce.addListener) reduce.addListener(onReduce);
  }
})();
