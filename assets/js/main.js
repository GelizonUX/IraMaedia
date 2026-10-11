/* IraMaedia v2 · interactions
   Full motion = GSAP 3.12.5 + ScrollTrigger (+ Lenis 1.1.13 smooth scroll), self-hosted in assets/vendor.
   Fallback  = vanilla IntersectionObserver reveals (no GSAP, or reduced motion).
   No JS     = everything visible in its final state (CSS default). */
(function () {
  'use strict';

  var doc = document.documentElement;
  var body = document.body;
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = mqReduce.matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  var M = !reduced && !!(gsap && ST) && doc.classList.contains('motion-ok');
  var lenis = null;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function safe(fn) { try { fn(); } catch (err) { if (window.console) console.warn('[IraMaedia]', fn.name || 'init', err); } }
  function navOffset() { return window.innerWidth >= 768 ? 88 : 72; }

  if (!M) doc.classList.remove('motion-ok');
  if (M) {
    gsap.registerPlugin(ST);
    doc.classList.add('gsap-live');
  }

  /* ---------- Boot ---------- */
  safe(initLenis);
  safe(initAnchors);
  safe(initNav);
  safe(initMenu);
  safe(initSplitHeadings);
  safe(initReveals);
  safe(initAccordions);
  safe(initQuotes);
  safe(initForm);
  safe(initBottomBar);
  safe(initOffscreenPause);
  safe(initWorkRow);
  if (M) {
    safe(initHero3D);
    safe(initMarquee);
    safe(initTextFill);
    safe(initCards);
    safe(initGallery);
    safe(initProcess);
    safe(initBackgrounds);
    safe(initCounters);
    safe(initCursor);
    safe(initMagnetic);
  }
  doc.classList.add('js-live');
  safe(function preloader() {
    try { runPreloader(startHero); }
    catch (err) { var p = $('.preloader'); if (p) p.remove(); startHero(); throw err; }
  });

  // Re-measure once fonts are in (line breaks change pin distances etc.)
  if (M) {
    var hashDone = false;
    var onRefresh = function () {
      if (hashDone) return;
      hashDone = true;
      ST.removeEventListener('refresh', onRefresh);
      requestAnimationFrame(jumpToHash);
    };
    var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    Promise.all([ready, new Promise(function (r) { if (document.readyState === 'complete') r(); else window.addEventListener('load', r); })])
      .then(function () { ST.addEventListener('refresh', onRefresh); ST.refresh(); });
  }

  /* ---------- Lenis smooth scroll ---------- */
  function initLenis() {
    if (!M || !window.Lenis) return;
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false, wheelMultiplier: 1 });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  var userMoved = false;
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (t) { window.addEventListener(t, function () { userMoved = true; }, { once: true, passive: true }); });
  function jumpToHash() {
    if (userMoved || !location.hash || location.hash.length < 2) return;
    var t;
    try { t = document.querySelector(location.hash); } catch (e) { return; }
    if (!t) return;
    var y = t.getBoundingClientRect().top + window.scrollY - navOffset();
    if (lenis && lenis.resize) lenis.resize();
    window.scrollTo(0, y);
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
  }

  /* ---------- Anchors: smooth scroll + focus + hash ---------- */
  function focusTarget(el) {
    if (!el) return;
    var focusable = el.matches('a[href], button, input, select, textarea, [tabindex]');
    if (!focusable) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
  function scrollToTarget(target, hash) {
    var top = hash === '#top';
    var focusEl = top ? $('#main') : target;
    var called = false;
    function done() {
      if (called) return;
      called = true;
      if (history.pushState) history.pushState(null, '', top ? location.pathname + location.search : hash);
      focusTarget(focusEl);
    }
    if (lenis) {
      if (lenis.resize) lenis.resize();
      setTimeout(done, 1500);
      lenis.scrollTo(top ? 0 : target, {
        offset: top ? 0 : -navOffset(),
        duration: 1.2,
        easing: function (t) { return 1 - Math.pow(1 - t, 4); },
        force: true,
        onComplete: done
      });
    } else {
      var behavior = reduced ? 'auto' : 'smooth';
      if (top) window.scrollTo({ top: 0, behavior: behavior });
      else target.scrollIntoView({ behavior: behavior, block: 'start' });
      done();
    }
  }
  function initAnchors() {
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var hash = a.getAttribute('href');
      if (hash === '#') return;
      var target = null;
      if (hash !== '#top') {
        try { target = document.querySelector(hash); } catch (err) { return; }
        if (!target) return;
      }
      e.preventDefault();
      scrollToTarget(target, hash);
    });
  }

  /* ---------- Nav: scrolled state, progress, active link ---------- */
  function initNav() {
    var nav = $('.nav');
    var progress = $('.progress');
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset;
      nav.classList.toggle('is-scrolled', y > 40);
      var max = doc.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();

    var links = $$('.nav__links a');
    if (!('IntersectionObserver' in window) || !links.length) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = map[e.target.id];
        if (!a) return;
        if (e.isIntersecting) {
          links.forEach(function (l) { l.removeAttribute('aria-current'); });
          a.setAttribute('aria-current', 'true');
        } else if (a.getAttribute('aria-current')) {
          a.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }

  /* ---------- Mobile menu ---------- */
  function initMenu() {
    var toggle = $('.nav__toggle');
    var menu = $('#menu');
    if (!toggle || !menu) return;
    var lastFocus = null, closeTimer = null;
    var outside = [$('#main'), $('.footer'), $('.skip-link'), $('.bbar')];
    function focusables() { return [toggle].concat($$('a, button', menu)); }
    function open() {
      clearTimeout(closeTimer);
      lastFocus = document.activeElement;
      menu.hidden = false;
      void menu.offsetWidth;
      menu.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      body.classList.add('is-locked');
      if (lenis) lenis.stop();
      outside.forEach(function (el) { if (el) el.setAttribute('inert', ''); });
      document.dispatchEvent(new CustomEvent('imd:menu', { detail: true }));
      var first = $('a', menu);
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, reduced ? 0 : 200);
    }
    function close(restore) {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      body.classList.remove('is-locked');
      if (lenis) lenis.start();
      outside.forEach(function (el) { if (el) el.removeAttribute('inert'); });
      document.dispatchEvent(new CustomEvent('imd:menu', { detail: false }));
      closeTimer = setTimeout(function () { menu.hidden = true; }, reduced ? 160 : 320);
      if (restore !== false) (lastFocus && lastFocus !== body ? lastFocus : toggle).focus({ preventScroll: true });
    }
    function isOpen() { return toggle.getAttribute('aria-expanded') === 'true'; }
    toggle.addEventListener('click', function () { if (isOpen()) close(); else open(); });
    menu.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (a && a.getAttribute('href').charAt(0) === '#') close(false);
    });
    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'Tab') {
        var f = focusables();
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.addEventListener('resize', function () { if (isOpen() && window.innerWidth >= 1024) close(false); });
  }

  /* ---------- Word-mask headings ---------- */
  function splitWords(el, cls) {
    var nodes = Array.prototype.slice.call(el.childNodes);
    var i = 0;
    el.textContent = '';
    function wrap(node) {
      var outer = document.createElement('span');
      outer.className = cls;
      outer.style.setProperty('--wi', i++);
      var inner = document.createElement('span');
      inner.appendChild(node);
      outer.appendChild(inner);
      return outer;
    }
    var out = [];
    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) el.appendChild(document.createTextNode(' '));
          else { var w = wrap(document.createTextNode(part)); el.appendChild(w); out.push(w); }
        });
      } else if (n.nodeType === 1) {
        var w2 = wrap(n); el.appendChild(w2); out.push(w2);
      }
    });
    return out;
  }
  function initSplitHeadings() {
    $$('.split-words').forEach(function (h) {
      if (M) { splitWords(h, 'w'); h.classList.add('is-split'); }
      else h.classList.add('reveal');
    });
  }

  /* ---------- Reveals (IntersectionObserver, all modes) ---------- */
  function initReveals() {
    var els = $$('.reveal, .is-split, .wordmark');
    $$('.wordmark span').forEach(function (s, i) { s.style.setProperty('--i', i); });
    var arch = $('.arch');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      if (arch) arch.classList.add('is-in');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -1px 0px' });
    document.addEventListener('focusin', function (e) {
      var el = e.target;
      while (el && el !== document.body) {
        if (el.classList && (el.classList.contains('reveal') || el.classList.contains('is-split')) && !el.classList.contains('is-in')) {
          el.classList.add('is-instant', 'is-in');
          (function (x) { requestAnimationFrame(function () { requestAnimationFrame(function () { x.classList.remove('is-instant'); }); }); })(el);
        }
        el = el.parentNode;
      }
    });
    els.forEach(function (el) { io.observe(el); });

    // clip-path hides the arch from IO, so watch its parent
    if (arch) {
      var io2 = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && entries[0].intersectionRatio > 0) { arch.classList.add('is-in'); io2.disconnect(); }
      }, { threshold: [0, 0.2], rootMargin: '0px 0px -20% 0px' });
      io2.observe(arch.parentElement);
      els.push(arch);
    }

    // Anything that ends up above the viewport (anchor jump, fast scroll) appears instantly
    var pending = els.slice();
    var queued = false;
    function sweep() {
      queued = false;
      pending = pending.filter(function (el) {
        if (el.classList.contains('is-in')) return false;
        if (el.getBoundingClientRect().bottom < 0) {
          el.classList.add('is-instant', 'is-in');
          requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.remove('is-instant'); }); });
          return false;
        }
        return true;
      });
      if (!pending.length) window.removeEventListener('scroll', onSweep);
    }
    function onSweep() { if (!queued) { queued = true; requestAnimationFrame(sweep); } }
    window.addEventListener('scroll', onSweep, { passive: true });
    window.addEventListener('load', onSweep);
    onSweep();
  }

  /* ---------- Preloader + hero start ---------- */
  var heroStarted = false;
  function startHero() {
    if (heroStarted) return;
    heroStarted = true;
    requestAnimationFrame(function () { requestAnimationFrame(function () { doc.classList.add('hero-in'); }); });
  }
  function runPreloader(done) {
    var pl = $('.preloader');
    if (!M || doc.classList.contains('intro-seen') || !pl) {
      if (pl) pl.remove();
      done();
      return;
    }
    try { sessionStorage.setItem('imd-intro', '1'); } catch (e) {}
    var count = $('[data-count]', pl);
    var counter = { v: 0 };
    var curtainOn = false, finished = false;
    function pad(n) { n = Math.round(n); return n < 10 ? '00' + n : n < 100 ? '0' + n : '' + n; }

    var intro = gsap.timeline();
    intro
      .fromTo($('.preloader__globe', pl), { opacity: 0, scale: 0.92 }, { opacity: 0.25, scale: 1, duration: 0.9, ease: 'expo.out' }, 0)
      .fromTo($$('.pm > span', pl), { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.09 }, 0.08)
      .fromTo($$('.preloader__word span', pl), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.022 }, 0.42)
      .to(counter, { v: 99, duration: 1.15, ease: 'power2.inOut', onUpdate: function () { count.textContent = pad(counter.v); } }, 0);

    function curtain(fast) {
      if (curtainOn) return;
      curtainOn = true;
      intro.kill();
      count.textContent = '100';
      var tl = gsap.timeline({ onComplete: finish });
      tl.to($('.preloader__logo', pl), { y: -40, opacity: 0, duration: 0.4, ease: 'power2.in' }, 0)
        .to([$('.preloader__tag', pl), count.parentNode, $('.preloader__globe', pl)], { opacity: 0, duration: 0.3 }, 0)
        .fromTo(pl, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.75, ease: 'expo.inOut' }, 0);
      if (fast) tl.timeScale(2);
      setTimeout(done, fast ? 60 : 150);
    }
    function finish() {
      if (finished) return;
      finished = true;
      ['click', 'keydown', 'wheel', 'touchstart'].forEach(function (t) { window.removeEventListener(t, skip, true); });
      if (pl.parentNode) pl.remove();
      done();
      ST.refresh();
    }
    function skip() { curtain(true); }
    ['click', 'keydown', 'wheel', 'touchstart'].forEach(function (t) { window.addEventListener(t, skip, { capture: true, passive: true }); });

    var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    var minTime = new Promise(function (r) { setTimeout(r, 1150); });
    Promise.all([fontsReady, minTime]).then(function () { curtain(false); });
    // Hard cap: never more than 2.4s
    setTimeout(function () { if (!finished) { gsap.killTweensOf(pl); finish(); } }, 2400);
  }

  /* ---------- Hero: 3D stack tilt + scroll fan-out ---------- */
  function initHero3D() {
    var hero = $('.hero');
    var stage = $('.hero__stage');
    var stack = $('.stack');
    var title = $('.hero__title');
    var L = $('.stack__slot--l'), R = $('.stack__slot--r'), C = $('.stack__slot--c');
    if (!hero || !stack) return;
    var mm = gsap.matchMedia();
    mm.add({ lg: '(min-width: 1280px)', md: '(min-width: 1024px) and (max-width: 1279px)', sm: '(max-width: 1023px)' }, function (ctx) {
      var k = ctx.conditions.lg ? 1 : ctx.conditions.md ? 0.7 : 0.5;
      var narrow = window.innerWidth < 640;
      var base = {
        l: { xPercent: narrow ? -30 : -22, yPercent: 4, z: -160, rotationZ: -7 },
        r: { xPercent: 22, yPercent: 8, z: -110, rotationZ: 6 },
        c: { xPercent: narrow ? 14 : 0, yPercent: 0, z: 0, rotationZ: 0, scale: 1 }
      };
      gsap.set(stack, { rotationY: -14, rotationX: 6 });
      gsap.set(L, base.l); gsap.set(R, base.r); gsap.set(C, base.c);

      var tl = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true } });
      tl.to(L, { xPercent: base.l.xPercent - 16 * k, rotationZ: -7 - 5 * k, ease: 'none' }, 0)
        .to(R, { xPercent: 22 + 16 * k, rotationZ: 6 + 5 * k, ease: 'none' }, 0)
        .to(C, { yPercent: -14 * k, scale: 1 + 0.04 * k, ease: 'none' }, 0)
        .to(stage, { y: function () { return -window.innerHeight * 0.08 * k; }, ease: 'none' }, 0)
        .to(title, { y: function () { return -window.innerHeight * 0.06 * k * 0.5; }, ease: 'none' }, 0);

      if (ctx.conditions.sm || !fine) return function () { gsap.set([stage, title], { clearProps: 'transform' }); };

      var rY = gsap.quickTo(stack, 'rotationY', { duration: 0.9, ease: 'power3.out' });
      var rX = gsap.quickTo(stack, 'rotationX', { duration: 0.9, ease: 'power3.out' });
      var xC = gsap.quickTo(C, 'x', { duration: 0.9, ease: 'power3.out' });
      var xL = gsap.quickTo(L, 'x', { duration: 0.9, ease: 'power3.out' });
      var xR = gsap.quickTo(R, 'x', { duration: 0.9, ease: 'power3.out' });
      function move(e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        var nx = e.clientX / window.innerWidth * 2 - 1;
        var ny = e.clientY / window.innerHeight * 2 - 1;
        rY(-14 + nx * 8); rX(6 - ny * 6);
        xC(nx * 10); xL(nx * -6); xR(nx * -6);
      }
      function leave() { rY(-14); rX(6); xC(0); xL(0); xR(0); }
      hero.addEventListener('pointermove', move);
      hero.addEventListener('pointerleave', leave);
      return function () {
        hero.removeEventListener('pointermove', move);
        hero.removeEventListener('pointerleave', leave);
        gsap.set([stage, title], { clearProps: 'transform' });
      };
    });
  }

  /* ---------- Velocity-reactive marquee ---------- */
  function initMarquee() {
    var sec = $('.marquee');
    var track = $('.marquee__track');
    var group = $('.marquee__group');
    if (!track || !group) return;
    var w = group.offsetWidth;
    window.addEventListener('resize', function () { w = group.offsetWidth; });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { w = group.offsetWidth; });
    var x = 0, dir = -1, lastY = window.scrollY;
    var boost = { v: 0 };
    var setBoost = gsap.quickTo(boost, 'v', { duration: 0.6, ease: 'power3.out' });
    var setX = gsap.quickSetter(track, 'x', 'px');
    gsap.ticker.add(function (time, dt) {
      var y = window.scrollY;
      var v = y - lastY;
      lastY = y;
      if (v !== 0) { dir = v > 0 ? -1 : 1; setBoost(Math.min(600, Math.abs(v) * 18)); }
      else if (boost.v > 0.5) setBoost(0);
      if (sec.classList.contains('is-offscreen') || document.hidden || !w) return;
      x += dir * (60 + boost.v) * Math.min(dt, 64) / 1000;
      if (x <= -w) x += w;
      if (x > 0) x -= w;
      setX(x);
    });
  }

  /* ---------- About: scroll-driven text fill ---------- */
  function initTextFill() {
    var st = $('[data-fill]');
    if (!st) return;
    var words = [];
    var nodes = Array.prototype.slice.call(st.childNodes);
    st.textContent = '';
    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { st.appendChild(document.createTextNode(' ')); return; }
          var s = document.createElement('span'); s.className = 'fw'; s.textContent = part; st.appendChild(s); words.push(s);
        });
      } else { n.classList.add('fw'); st.appendChild(n); words.push(n); }
    });
    gsap.fromTo(words, { opacity: 0.18 }, {
      opacity: 1, ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: st, start: 'top 75%', end: 'bottom 40%', scrub: true }
    });
  }

  /* ---------- Services: stacking cards ---------- */
  function initCards() {
    var cards = $$('[data-cards] .card');
    var n = cards.length;
    if (n < 2) return;
    gsap.matchMedia().add('(min-width: 768px)', function () {
      cards.forEach(function (card, i) {
        if (i === n - 1) return;
        var trig = { trigger: cards[i + 1], start: 'top bottom', end: 'top top+=' + (96 + (i + 1) * 20), scrub: true };
        gsap.to(card, { scale: 1 - (n - 1 - i) * 0.04, ease: 'none', scrollTrigger: trig });
        gsap.to($('.card__shade', card), { opacity: 0.35, ease: 'none', scrollTrigger: { trigger: trig.trigger, start: trig.start, end: trig.end, scrub: true } });
      });
    });
  }

  /* ---------- Work: pinned horizontal gallery (desktop) ---------- */
  function initGallery() {
    var section = $('.work');
    var pin = $('.work__pin');
    var track = $('.work__track');
    var items = $$('.work__item');
    var bar = $('.work__bar i');
    var cur = $('[data-work-current]');
    if (!section || !track) return;
    gsap.matchMedia().add('(min-width: 1024px) and (min-height: 680px)', function () {
      doc.classList.add('pin-work');
      function dist() { return Math.max(0, track.scrollWidth - window.innerWidth); }
      var tween = gsap.to(track, {
        x: function () { return -dist(); },
        ease: 'none',
        scrollTrigger: {
          trigger: pin, pin: pin, start: 'top top',
          end: function () { return '+=' + dist(); },
          scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: function (self) {
            if (bar) bar.style.transform = 'scaleX(' + self.progress.toFixed(4) + ')';
            if (cur) { var idx = Math.min(items.length, Math.max(1, Math.round(self.progress * (items.length - 1)) + 1)); cur.textContent = (idx < 10 ? '0' : '') + idx; }
          }
        }
      });
      items.forEach(function (item) {
        var art = $('.art, .mini-grid', item);
        if (!art) return;
        gsap.fromTo(art, { xPercent: 8 }, { xPercent: -8, ease: 'none', scrollTrigger: { trigger: item, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
      function onFocus(e) {
        var item = e.target.closest('.work__item, .work__outro');
        if (!item) return;
        pin.scrollLeft = 0;
        var st = tween.scrollTrigger;
        var max = dist();
        if (!st || !max) return;
        var x = item.getBoundingClientRect().left - track.getBoundingClientRect().left;
        var p = item.classList.contains('work__outro') ? 1 : Math.min(1, Math.max(0, (x - window.innerWidth / 2 + item.offsetWidth / 2) / max));
        var y = st.start + p * (st.end - st.start);
        if (lenis) lenis.scrollTo(y, { duration: 0.6, force: true });
        else window.scrollTo(0, y);
      }
      track.addEventListener('focusin', onFocus);
      ST.refresh();
      return function () {
        track.removeEventListener('focusin', onFocus);
        doc.classList.remove('pin-work');
      };
    });
  }

  /* Swipe row progress (mobile / tablet / reduced motion) */
  function initWorkRow() {
    var list = $('.work__list');
    var bar = $('.work__bar i');
    var cur = $('[data-work-current]');
    var items = $$('.work__item');
    if (!list || !bar) return;
    var t = false;
    function sync() {
      t = false;
      if (doc.classList.contains('pin-work')) return;
      var max = list.scrollWidth - list.clientWidth;
      var p = max > 0 ? list.scrollLeft / max : 0;
      bar.style.transform = 'scaleX(' + Math.max(0.08, p).toFixed(4) + ')';
      var idx = Math.min(items.length, Math.round(p * (items.length - 1)) + 1);
      if (cur) cur.textContent = (idx < 10 ? '0' : '') + idx;
    }
    list.addEventListener('scroll', function () { if (!t) { t = true; requestAnimationFrame(sync); } }, { passive: true });
    sync();
  }

  /* ---------- Process: scrubbed progress line ---------- */
  function initProcess() {
    var steps = $('[data-steps]');
    if (!steps) return;
    var items = $$('.step', steps);
    var marks = [0.001, 0.33, 0.66, 0.99];
    steps.classList.add('steps--scrub');
    function apply(p) {
      steps.style.setProperty('--p', p.toFixed(4));
      items.forEach(function (s, i) { s.classList.toggle('is-on', p >= marks[i]); });
    }
    var st = ST.create({ trigger: steps, start: 'top 70%', end: 'bottom 60%', onUpdate: function (self) { apply(self.progress); }, onRefresh: function (self) { apply(self.progress); } });
    apply(st.progress);
  }

  /* ---------- Theme flag for cursor (light/dark section under the pointer area) ---------- */
  function initBackgrounds() {
    var secs = $$('.surface[data-theme]');
    doc.setAttribute('data-theme', 'dark');
    secs.forEach(function (sec) {
      ST.create({
        trigger: sec, start: 'top 50%', end: 'bottom 50%',
        onToggle: function (self) { if (self.isActive) doc.setAttribute('data-theme', sec.getAttribute('data-theme') || 'dark'); }
      });
    });
  }

  /* ---------- Package counters ---------- */
  function initCounters() {
    var els = $$('.count[data-to]');
    if (!els.length || !('IntersectionObserver' in window)) return;
    // The HTML holds the real value. Only counters still below the fold are zeroed and counted up.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target, to = parseInt(el.getAttribute('data-to'), 10), o = { v: 0 };
        gsap.to(o, { v: to, duration: 1.2, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(o.v); }, onComplete: function () { el.textContent = to; } });
      });
    }, { threshold: 0 });
    els.forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight) { el.textContent = '0'; io.observe(el); }
    });
    // Jumped past (anchor, deep link)? Show the real value straight away.
    function sweep() {
      els.forEach(function (el) {
        if (el.textContent === '0' && el.getBoundingClientRect().bottom < 0) { io.unobserve(el); el.textContent = el.getAttribute('data-to'); }
      });
    }
    window.addEventListener('scroll', sweep, { passive: true });
  }

  /* ---------- Custom cursor ---------- */
  function initCursor() {
    var c = $('.cursor');
    if (!c || !fine) return;
    doc.classList.add('has-cursor');
    c.classList.add('is-hidden');
    var qx = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3.out' });
    var qy = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3.out' });
    var first = true;
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      if (first) { gsap.set(c, { x: e.clientX, y: e.clientY }); first = false; }
      qx(e.clientX); qy(e.clientY);
      c.classList.remove('is-hidden');
      var t = e.target;
      var view = t.closest && t.closest('.work__item .phone');
      var link = !view && t.closest && t.closest('a, button, label.pill, input, textarea, .work__item');
      c.classList.toggle('is-view', !!view);
      c.classList.toggle('is-link', !!link);
    }, { passive: true });
    document.addEventListener('mouseleave', function () { c.classList.add('is-hidden'); });
    window.addEventListener('blur', function () { c.classList.add('is-hidden'); });
  }

  /* ---------- Magnetic CTAs ---------- */
  function initMagnetic() {
    if (!fine) return;
    $$('.magnetic').forEach(function (el) {
      var label = $('.btn__label', el);
      el.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = el.getBoundingClientRect();
        var mx = Math.max(-10, Math.min(10, (e.clientX - (r.left + r.width / 2)) * 0.25));
        var my = Math.max(-10, Math.min(10, (e.clientY - (r.top + r.height / 2)) * 0.35));
        gsap.to(el, { x: mx, y: my, duration: 0.3, ease: 'power3.out', overwrite: 'auto' });
        if (label) gsap.to(label, { x: mx * 0.3, y: my * 0.3, duration: 0.3, ease: 'power3.out', overwrite: 'auto' });
      });
      el.addEventListener('pointerleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'expo.out', overwrite: 'auto' });
        if (label) gsap.to(label, { x: 0, y: 0, duration: 0.6, ease: 'expo.out', overwrite: 'auto' });
      });
    });
  }

  /* ---------- FAQ accordions ---------- */
  function initAccordions() {
    $$('.acc__btn').forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      var item = btn.closest('.acc__item');
      if (!panel) return;
      panel.classList.add('is-closed-done');
      var timer;
      btn.addEventListener('click', function () {
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        clearTimeout(timer);
        btn.setAttribute('aria-expanded', String(!expanded));
        if (!expanded) {
          panel.classList.remove('is-closed-done');
          void panel.offsetWidth;
          panel.classList.add('is-open');
          item.classList.add('is-open');
        } else {
          panel.classList.remove('is-open');
          item.classList.remove('is-open');
          timer = setTimeout(function () { panel.classList.add('is-closed-done'); }, reduced ? 0 : 340);
        }
        if (M) setTimeout(function () { ST.refresh(); }, 360);
      });
    });
  }

  /* ---------- Testimonials ---------- */
  function initQuotes() {
    var slides = $$('.quote');
    if (slides.length < 2) return;
    var current = 0, busy = false;
    var counter = $('[data-quote-current]');
    function go(dir) {
      if (busy) return;
      var next = (current + dir + slides.length) % slides.length;
      var out = slides[current], inn = slides[next];
      if (reduced) {
        out.hidden = true; out.classList.remove('is-active');
        inn.hidden = false; inn.classList.add('is-active');
      } else {
        busy = true;
        out.classList.add('is-leaving');
        inn.hidden = false;
        inn.classList.add('is-entering');
        void inn.offsetWidth;
        requestAnimationFrame(function () { inn.classList.remove('is-entering'); });
        setTimeout(function () {
          out.hidden = true;
          out.classList.remove('is-leaving', 'is-active');
          inn.classList.add('is-active');
          busy = false;
        }, 460);
      }
      current = next;
      if (counter) counter.textContent = ('0' + (current + 1)).slice(-2);
    }
    $$('[data-quote]').forEach(function (b) {
      b.addEventListener('click', function () { go(b.getAttribute('data-quote') === 'next' ? 1 : -1); });
    });
  }

  /* ---------- Contact form ---------- */
  function initForm() {
    var form = $('#contact-form');
    if (!form) return;
    var to = (form.getAttribute('action') || 'mailto:hello@iramaedia.com').replace(/^mailto:/, '');
    var summary = $('#form-summary');
    var summaryList = $('.form__summary-list', form);
    var status = $('.form__status', form);
    var submit = $('button[type="submit"]', form);
    var submitText = $('[data-submit-text]', form);
    var success = $('#form-success');
    var msg = $('#f-msg');

    $$('[data-package]').forEach(function (a) {
      a.addEventListener('click', function () {
        if (msg && !msg.value.trim()) msg.value = 'Hi Ira, I’m interested in the ' + a.getAttribute('data-package') + ' package. ';
      });
    });

    var required = ['f-name', 'f-email', 'f-msg'].map(function (id) { return document.getElementById(id); });
    var names = { 'f-name': 'Your name', 'f-email': 'Email', 'f-msg': 'Tell me about your brand' };
    function validate(input) {
      var v = input.value.trim();
      if (input.id === 'f-name') return v ? '' : 'Please tell me your name.';
      if (input.id === 'f-email') {
        if (!v) return 'I need an email to reply to.';
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'That email looks off. Mind checking it?';
      }
      if (input.id === 'f-msg') return v ? '' : 'A line or two about your brand helps a lot.';
      return '';
    }
    function setErr(input, text) {
      var err = document.getElementById(input.id + '-err');
      if (text) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
      if (!err) return;
      err.innerHTML = '';
      if (text) {
        var ns = 'http://www.w3.org/2000/svg';
        var svg = document.createElementNS(ns, 'svg'); svg.setAttribute('aria-hidden', 'true');
        var use = document.createElementNS(ns, 'use'); use.setAttribute('href', '#i-alert'); svg.appendChild(use);
        err.appendChild(svg);
        err.appendChild(document.createTextNode(text));
      }
    }
    var submitted = false;
    required.forEach(function (input) {
      input.addEventListener('blur', function () { if (submitted || input.value) setErr(input, validate(input)); });
      input.addEventListener('input', function () { if (input.getAttribute('aria-invalid')) setErr(input, validate(input)); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (submit.getAttribute('aria-busy') === 'true') return;
      submitted = true;
      var bad = [];
      required.forEach(function (input) {
        var m = validate(input);
        setErr(input, m);
        if (m) bad.push({ input: input, msg: m });
      });
      if (bad.length) {
        summaryList.innerHTML = '';
        bad.forEach(function (b) {
          var li = document.createElement('li');
          var a = document.createElement('a');
          a.href = '#' + b.input.id;
          a.textContent = names[b.input.id] + ': ' + b.msg;
          li.appendChild(a); summaryList.appendChild(li);
        });
        summary.hidden = false;
        summary.focus({ preventScroll: true });
        var y = summary.getBoundingClientRect().top + window.scrollY - navOffset() - 16;
        if (lenis) lenis.scrollTo(y, { duration: 0.6, force: true }); else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
        return;
      }
      summary.hidden = true;
      var needs = $$('input[name="needs"]:checked', form).map(function (c) { return c.value; });
      var budget = $('input[name="budget"]:checked', form);
      var name = $('#f-name').value.trim();
      var bodyText = [
        'Name: ' + name,
        'Email: ' + $('#f-email').value.trim(),
        'Brand / Instagram: ' + ($('#f-brand').value.trim() || '-'),
        'Needs: ' + (needs.length ? needs.join(', ') : '-'),
        'Monthly budget: ' + (budget ? budget.value : '-'),
        '',
        msg.value.trim()
      ].join('\n');
      var href = 'mailto:' + to + '?subject=' + encodeURIComponent('New enquiry from ' + name) + '&body=' + encodeURIComponent(bodyText);
      submit.classList.add('is-loading');
      submit.setAttribute('aria-disabled', 'true');
      submit.setAttribute('aria-busy', 'true');
      submitText.textContent = 'Opening your email…';
      status.textContent = 'Opening your email app…';
      setTimeout(function () {
        window.location.href = href;
        submit.classList.remove('is-loading');
        submit.removeAttribute('aria-disabled');
        submit.removeAttribute('aria-busy');
        submitText.textContent = 'Send my enquiry';
        status.textContent = '';
        form.hidden = true;
        success.hidden = false;
        success.classList.remove('is-swapping'); void success.offsetWidth;
        if (!reduced) success.classList.add('is-swapping');
        $('.form-success__title', success).focus({ preventScroll: false });
      }, 600);
    });

    var copyBtn = $('[data-copy]', success);
    var copyStatus = $('[data-copy-status]', success);
    if (copyBtn) copyBtn.addEventListener('click', function () {
      var email = copyBtn.getAttribute('data-copy');
      function ok() {
        copyBtn.textContent = 'Copied ✓';
        copyStatus.textContent = 'Email address copied to your clipboard.';
        setTimeout(function () { copyBtn.textContent = 'Copy my email instead'; copyStatus.textContent = ''; }, 2000);
      }
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = email; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); ok(); } catch (err) { copyStatus.textContent = 'Copy failed. My email is ' + email + '.'; }
        body.removeChild(ta);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(email).then(ok, fallback);
      else fallback();
    });
    var edit = $('[data-edit]', success);
    if (edit) edit.addEventListener('click', function () {
      success.hidden = true;
      form.hidden = false;
      msg.focus();
    });
  }

  /* ---------- Mobile bottom bar ---------- */
  function initBottomBar() {
    var bar = $('[data-bbar]');
    var ctas = $('.hero__ctas');
    var contact = $('#contact');
    if (!bar || !ctas || !('IntersectionObserver' in window)) { if (bar) bar.classList.add('is-shown'); return; }
    var pastHero = false, inContact = false, menuOpen = false, typing = false;
    function update() { bar.classList.toggle('is-shown', pastHero && !inContact && !menuOpen && !typing); }
    new IntersectionObserver(function (es) {
      var e = es[0];
      pastHero = !e.isIntersecting && e.boundingClientRect.top < 0;
      update();
    }).observe(ctas);
    // Hidden while the contact section covers the main part of the viewport (viewport-based, not ratio-based)
    if (contact) {
      var q = false;
      var check = function () {
        q = false;
        var r = contact.getBoundingClientRect(), h = window.innerHeight;
        var next = r.top < h * 0.75 && r.bottom > h * 0.25;
        if (next !== inContact) { inContact = next; update(); }
      };
      window.addEventListener('scroll', function () { if (!q) { q = true; requestAnimationFrame(check); } }, { passive: true });
      window.addEventListener('resize', check, { passive: true });
      check();
    }
    document.addEventListener('imd:menu', function (e) { menuOpen = !!e.detail; update(); });
    document.addEventListener('focusin', function (e) { typing = !!(e.target.matches && e.target.matches('input, textarea, select')); update(); });
    document.addEventListener('focusout', function () { setTimeout(function () { var a = document.activeElement; typing = !!(a && a.matches && a.matches('input, textarea, select')); update(); }, 0); });
  }

  /* ---------- Pause continuous motion offscreen / hidden tab ---------- */
  function initOffscreenPause() {
    document.addEventListener('visibilitychange', function () { doc.classList.toggle('is-hidden', document.hidden); });
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('is-offscreen', !e.isIntersecting); });
    });
    $$('.marquee, .hero, .contact, .about__media, .footer').forEach(function (t) { io.observe(t); });
  }
})();
