/* IraMaedia · interactions (vanilla, no dependencies) */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fineMQ = window.matchMedia('(hover: hover) and (pointer: fine)');
  var reduced = reduceMQ.matches;
  var fine = fineMQ.matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  if (reduceMQ.addEventListener) {
    reduceMQ.addEventListener('change', function (e) { reduced = e.matches; });
  }

  /* ---------- Load sequence ---------- */
  function start() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { doc.classList.add('is-loaded'); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  function init() {
    start();
    initNav();
    initMenu();
    initReveals();
    initAccordions();
    initServicePreview();
    initWork();
    initQuotes();
    initForm();
    initMagnetic();
    initCursor();
    initOffscreenPause();
    initWordmark();
    initTopLinks();
  }

  /* ---------- Nav state, progress, parallax (one rAF-throttled listener) ---------- */
  function initNav() {
    var nav = $('.nav');
    var progress = $('.progress');
    var slots = $$('[data-parallax]');
    var hero = $('.hero');
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset;
      nav.classList.toggle('is-scrolled', y > 40);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';

      if (!reduced && window.innerWidth >= 1024 && hero && y < hero.offsetHeight) {
        for (var i = 0; i < slots.length; i++) {
          var f = parseFloat(slots[i].getAttribute('data-parallax')) || 1;
          slots[i].style.translate = '0 ' + ((1 - f) * y * 0.6).toFixed(1) + 'px';
        }
      } else if (slots.length && slots[0].style.translate) {
        slots.forEach(function (s) { s.style.translate = ''; });
      }
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();

    // Active section highlighting
    var links = $$('.nav__links a');
    if ('IntersectionObserver' in window && links.length) {
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
  }

  /* ---------- Mobile menu ---------- */
  function initMenu() {
    var toggle = $('.nav__toggle');
    var menu = $('#menu');
    if (!toggle || !menu) return;
    var lastFocus = null;
    var closeTimer = null;
    var mainEls = [$('#main'), $('.footer'), $('.skip-link')];

    function focusables() {
      return [toggle].concat($$('a, button', menu));
    }
    function open() {
      clearTimeout(closeTimer);
      lastFocus = document.activeElement;
      menu.hidden = false;
      // force reflow so the clip-path transition runs
      void menu.offsetWidth;
      menu.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      document.body.classList.add('is-locked');
      mainEls.forEach(function (el) { if (el) el.setAttribute('inert', ''); });
      var first = $('a', menu);
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, reduced ? 0 : 200);
    }
    function close(restore) {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('is-locked');
      mainEls.forEach(function (el) { if (el) el.removeAttribute('inert'); });
      closeTimer = setTimeout(function () { menu.hidden = true; }, reduced ? 160 : 320);
      if (restore !== false) (lastFocus && lastFocus !== document.body ? lastFocus : toggle).focus({ preventScroll: true });
    }
    function isOpen() { return toggle.getAttribute('aria-expanded') === 'true'; }

    toggle.addEventListener('click', function () { isOpen() ? close() : open(); });
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
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.addEventListener('resize', function () {
      if (isOpen() && window.innerWidth >= 1024) close(false);
    });
  }

  /* ---------- Scroll reveals ---------- */
  function initReveals() {
    var els = $$('.reveal, .reveal-line, .reveal-clip, [data-steps]');

    // Work items rise per column
    $$('.work-item').forEach(function (el, i) {
      el.classList.add('rise');
      el.style.setProperty('--i', i % 4);
      els.push(el);
    });

    if (reduced || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); if (el.hasAttribute('data-steps')) lightSteps(el); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        if (e.target.hasAttribute('data-steps')) lightSteps(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
    // clip-path elements report a zero intersection area while clipped, so watch their parent instead
    var proxied = new Map();
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        (proxied.get(e.target) || []).forEach(function (el) { el.classList.add('is-in'); });
        io2.unobserve(e.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
    els.forEach(function (el) {
      if (el.classList.contains('reveal-line') || el.classList.contains('reveal-clip')) {
        var parent = el.parentElement;
        if (!proxied.has(parent)) proxied.set(parent, []);
        proxied.get(parent).push(el);
        io2.observe(parent);
      } else {
        io.observe(el);
      }
    });

    // Anything that ends up above the viewport (anchor jump, fast scroll, reload mid-page)
    // is revealed instantly so scrolling back up never shows empty gaps.
    var pending = els.slice();
    var sweeping = false;
    function sweep() {
      sweeping = false;
      pending = pending.filter(function (el) {
        if (el.classList.contains('is-in')) return false;
        var r = el.getBoundingClientRect();
        if (r.bottom < 0) {
          el.classList.add('is-instant', 'is-in');
          if (el.hasAttribute('data-steps')) lightSteps(el);
          requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.remove('is-instant'); }); });
          return false;
        }
        return true;
      });
      if (!pending.length) window.removeEventListener('scroll', onSweep);
    }
    function onSweep() { if (!sweeping) { sweeping = true; requestAnimationFrame(sweep); } }
    window.addEventListener('scroll', onSweep, { passive: true });
    window.addEventListener('hashchange', onSweep);
    window.addEventListener('load', onSweep);
    onSweep();
  }
  function lightSteps(list) {
    $$('.step', list).forEach(function (s, i) {
      setTimeout(function () { s.classList.add('is-on'); }, reduced ? 0 : 300 + i * 250);
    });
  }

  /* ---------- Accordions (services + FAQ) ---------- */
  function initAccordions() {
    $$('.svc__btn, .acc__btn').forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      var item = btn.closest('.svc, .acc__item');
      if (!panel) return;
      panel.classList.add('is-closed-done');
      panel.setAttribute('aria-hidden', 'true');
      var timer;
      btn.addEventListener('click', function () {
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        clearTimeout(timer);
        btn.setAttribute('aria-expanded', String(!expanded));
        if (!expanded) {
          panel.classList.remove('is-closed-done');
          panel.removeAttribute('aria-hidden');
          void panel.offsetWidth;
          panel.classList.add('is-open');
          item.classList.add('is-open');
        } else {
          panel.classList.remove('is-open');
          item.classList.remove('is-open');
          panel.setAttribute('aria-hidden', 'true');
          timer = setTimeout(function () { panel.classList.add('is-closed-done'); }, reduced ? 0 : 340);
        }
      });
    });
  }

  /* ---------- Service hover preview (fine pointer only) ---------- */
  function initServicePreview() {
    var list = $('[data-preview-list]');
    var prev = $('.svc-preview');
    if (!list || !prev || !fine) return;
    var tints = {
      rose: 'linear-gradient(160deg,#E8B4C4,#C9849B)',
      sage: 'linear-gradient(160deg,#98B2AB,#467E5C)',
      cream: 'linear-gradient(160deg,#F7F1EA,#C9A96E)',
      berry: 'linear-gradient(160deg,#C9849B,#7A3A52)'
    };
    var img = $('.svc-preview__img', prev);
    var x = 0, y = 0, tx = 0, ty = 0, raf = null, active = false;
    function loop() {
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      prev.style.setProperty('--x', x.toFixed(1) + 'px');
      prev.style.setProperty('--y', y.toFixed(1) + 'px');
      if (active || Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) raf = requestAnimationFrame(loop);
      else raf = null;
    }
    list.addEventListener('pointermove', function (e) {
      if (reduced || e.pointerType !== 'mouse') return;
      tx = e.clientX + 140; ty = e.clientY;
      if (!active) { x = tx; y = ty; }
      var row = e.target.closest('.svc');
      if (row) img.style.setProperty('--tint', tints[row.getAttribute('data-tint')] || tints.rose);
      active = true;
      prev.classList.add('is-visible');
      if (!raf) raf = requestAnimationFrame(loop);
    });
    list.addEventListener('pointerleave', function () {
      active = false;
      prev.classList.remove('is-visible');
    });
  }

  /* ---------- Work: filters, tilt, carousel dots ---------- */
  function initWork() {
    var grid = $('#work-grid');
    if (!grid) return;
    var items = $$('.work-item', grid);
    var chips = $$('.chip[data-filter]');
    var status = $('#work-status');
    var dotsWrap = $('.work__dots');

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-filter');
        grid.classList.add('is-filtering');
        chips.forEach(function (c) {
          var on = c === chip;
          c.classList.toggle('is-active', on);
          c.setAttribute('aria-pressed', String(on));
        });
        var outs = [], ins = [];
        items.forEach(function (it) {
          (f === 'all' || it.getAttribute('data-type') === f ? ins : outs).push(it);
        });
        // fade out non-matching, then hide; fade in matching
        outs.forEach(function (it) { if (!it.hidden) it.classList.add('is-filtered-out'); });
        var delay = reduced ? 0 : 260;
        setTimeout(function () {
          outs.forEach(function (it) { it.hidden = true; });
          grid.classList.toggle('is-filtered', f !== 'all');
          ins.forEach(function (it) {
            var wasHidden = it.hidden;
            it.hidden = false;
            it.classList.add('is-in');
            if (wasHidden) {
              it.classList.add('is-filtered-out');
              void it.offsetWidth;
            }
            it.classList.remove('is-filtered-out');
          });
          grid.scrollLeft = 0;
          buildDots();
        }, delay);
        if (status) status.textContent = 'Showing ' + ins.length + ' ' + (f === 'all' ? 'projects' : chip.textContent.toLowerCase());
      });
    });

    // Tilt toward cursor (max 6deg)
    if (fine) {
      items.forEach(function (it) {
        var phone = $('.phone', it);
        it.addEventListener('pointermove', function (e) {
          if (reduced) return;
          var r = phone.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          phone.style.setProperty('--ty', (px * 12).toFixed(2) + 'deg');
          phone.style.setProperty('--tx', (-py * 12).toFixed(2) + 'deg');
        });
        it.addEventListener('pointerleave', function () {
          phone.style.setProperty('--ty', '0deg');
          phone.style.setProperty('--tx', '0deg');
        });
      });
    }

    // Mobile carousel dots
    function visibleItems() { return items.filter(function (it) { return !it.hidden; }); }
    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      visibleItems().forEach(function (_, i) {
        var d = document.createElement('i');
        if (i === 0) d.className = 'on';
        dotsWrap.appendChild(d);
      });
    }
    function syncDots() {
      if (!dotsWrap) return;
      var vis = visibleItems();
      var left = grid.scrollLeft;
      var idx = 0, best = Infinity;
      vis.forEach(function (it, i) {
        var d = Math.abs(it.offsetLeft - grid.offsetLeft - left - parseFloat(getComputedStyle(grid).paddingLeft));
        if (d < best) { best = d; idx = i; }
      });
      if (grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 4) idx = vis.length - 1;
      $$('i', dotsWrap).forEach(function (d, i) { d.classList.toggle('on', i === idx); });
    }
    var t = false;
    grid.addEventListener('scroll', function () {
      if (t) return; t = true;
      requestAnimationFrame(function () { t = false; syncDots(); });
    }, { passive: true });
    buildDots();
  }

  /* ---------- Testimonials ---------- */
  function initQuotes() {
    var slides = $$('.quote');
    if (slides.length < 2) return;
    var current = 0;
    var counter = $('[data-quote-current]');
    var busy = false;
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

  /* ---------- Contact form: validate + compose mailto ---------- */
  function initForm() {
    var form = $('#contact-form');
    if (!form) return;
    var to = (form.getAttribute('action') || 'mailto:hello@iramaedia.com').replace(/^mailto:/, '');
    var status = $('.form__status', form);

    // Prefill "what do you need" from package buttons
    $$('[data-package]').forEach(function (a) {
      a.addEventListener('click', function () {
        var msg = $('#f-msg');
        if (msg && !msg.value) msg.value = "Hi Ira, I’m interested in the " + a.getAttribute('data-package') + ' package. ';
      });
    });

    function setErr(input, text) {
      var err = document.getElementById(input.id + '-err');
      if (text) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
      if (err) err.textContent = text || '';
    }
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
    var required = ['f-name', 'f-email', 'f-msg'].map(function (id) { return document.getElementById(id); });
    required.forEach(function (input) {
      input.addEventListener('blur', function () { if (input.value) setErr(input, validate(input)); });
      input.addEventListener('input', function () { if (input.getAttribute('aria-invalid')) setErr(input, validate(input)); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      required.forEach(function (input) {
        var msg = validate(input);
        setErr(input, msg);
        if (msg && !firstBad) firstBad = input;
      });
      if (firstBad) {
        status.classList.remove('is-success');
        status.textContent = 'Almost there. Check the highlighted fields.';
        firstBad.focus();
        return;
      }
      var needs = $$('input[name="needs"]:checked', form).map(function (c) { return c.value; });
      var name = $('#f-name').value.trim();
      var body = [
        'Name: ' + name,
        'Email: ' + $('#f-email').value.trim(),
        'Brand / Instagram: ' + ($('#f-brand').value.trim() || '-'),
        'Needs: ' + (needs.length ? needs.join(', ') : '-'),
        '',
        $('#f-msg').value.trim()
      ].join('\n');
      var href = 'mailto:' + to + '?subject=' + encodeURIComponent('New enquiry from ' + name) + '&body=' + encodeURIComponent(body);
      status.classList.add('is-success');
      status.textContent = 'Thank you! Your email app should open with everything filled in. If it doesn’t, write to ' + to + '.';
      window.location.href = href;
    });
  }

  /* ---------- Magnetic primary CTAs ---------- */
  function initMagnetic() {
    if (!fine) return;
    $$('.magnetic').forEach(function (el) {
      var label = $('.btn__label', el);
      el.addEventListener('pointermove', function (e) {
        if (reduced || e.pointerType !== 'mouse') return;
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        var mx = Math.max(-10, Math.min(10, dx * 0.25));
        var my = Math.max(-10, Math.min(10, dy * 0.35));
        el.style.transition = 'transform 200ms cubic-bezier(.23,1,.32,1), background-color 200ms ease, color 200ms ease';
        el.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
        if (label) {
          label.style.transition = 'transform 200ms cubic-bezier(.23,1,.32,1)';
          label.style.transform = 'translate(' + mx * 0.3 + 'px,' + my * 0.3 + 'px)';
        }
      });
      el.addEventListener('pointerleave', function () {
        el.style.transition = 'transform 500ms cubic-bezier(.23,1,.32,1), background-color 200ms ease, color 200ms ease';
        el.style.transform = '';
        if (label) { label.style.transition = 'transform 500ms cubic-bezier(.23,1,.32,1)'; label.style.transform = ''; }
      });
    });
  }

  /* ---------- Cursor dot (garnish; system cursor stays) ---------- */
  function initCursor() {
    var c = $('.cursor');
    if (!c || !fine || reduced) return;
    doc.classList.add('has-cursor');
    var x = -100, y = -100, tx = -100, ty = -100, running = false;
    function loop() {
      x += (tx - x) * 0.2; y += (ty - y) * 0.2;
      c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      if (Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1) requestAnimationFrame(loop);
      else running = false;
    }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX; ty = e.clientY;
      if (x < -50) { x = tx; y = ty; }
      c.classList.remove('is-hidden');
      var view = e.target.closest && e.target.closest('.work-item .phone');
      var link = !view && e.target.closest && e.target.closest('a, button, label.need, input, textarea');
      c.classList.toggle('is-view', !!view);
      c.classList.toggle('is-link', !!link);
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });
    document.addEventListener('pointerleave', function () { c.classList.add('is-hidden'); });
    document.addEventListener('mouseleave', function () { c.classList.add('is-hidden'); });
  }

  /* ---------- Pause continuous motion offscreen / hidden tab ---------- */
  function initOffscreenPause() {
    if (!('IntersectionObserver' in window)) return;
    var targets = $$('.marquee, .hero, .about__media, .footer');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('is-offscreen', !e.isIntersecting); });
    });
    targets.forEach(function (t) { io.observe(t); });
    document.addEventListener('visibilitychange', function () {
      doc.classList.toggle('is-offscreen', document.hidden);
    });
  }

  /* ---------- Footer wordmark letters ---------- */
  function initWordmark() {
    var wm = $('.wordmark');
    if (!wm) return;
    $$('span', wm).forEach(function (s, i) { s.style.setProperty('--i', i); });
    if (!('IntersectionObserver' in window)) { wm.classList.add('is-in'); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { wm.classList.add('is-in'); io.disconnect(); }
    }, { threshold: 0.2 });
    io.observe(wm);
  }

  /* ---------- Back to top / logo ---------- */
  function initTopLinks() {
    $$('a[href="#top"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
        if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
        var skip = $('#main');
        if (a.hasAttribute('data-top') && skip) {
          // move focus to the top of the document for keyboard users
          $('.logo').focus({ preventScroll: true });
        }
      });
    });
  }
})();
