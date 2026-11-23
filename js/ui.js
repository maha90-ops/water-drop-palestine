/* =========================================================
   أدوات الواجهة: نافذة منبثقة، إشعارات، قراءة صوتية، احتفال
   ========================================================= */
(function () {
  Q.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  Q.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  Q.motionOK = function () {
    var st = Q.store.get();
    return st.settings.motion && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };

  /* ---------- نافذة منبثقة يمكن الوصول إليها ---------- */
  var lastFocus = null;
  Q.modal = {
    open: function (opts) {
      Q.modal.close(true);
      lastFocus = document.activeElement;
      var root = document.getElementById('modal-root');
      root.innerHTML = '<div class="modal-backdrop" data-close="1"></div>' +
        '<div class="modal ' + (opts.cls || '') + '" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
        '<button type="button" class="modal-x" data-close="1" aria-label="إغلاق">✕</button>' +
        '<h2 id="modal-title">' + opts.title + '</h2><div class="modal-body">' + opts.body + '</div>' +
        '<div class="modal-actions">' + (opts.actions || '') + '<button type="button" class="btn btn-ghost" data-close="1">إغلاق</button></div></div>';
      root.hidden = false;
      document.body.classList.add('modal-open');
      root.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', function () { Q.modal.close(); }); });
      root.addEventListener('keydown', trap);
      var first = root.querySelector('.modal-actions .btn') || root.querySelector('.modal-x');
      setTimeout(function () { first && first.focus(); }, 30);
      if (opts.onOpen) opts.onOpen(root.querySelector('.modal'));
      return root.querySelector('.modal');
    },
    close: function (silent) {
      var root = document.getElementById('modal-root');
      if (!root || root.hidden) return;
      root.hidden = true; root.innerHTML = '';
      root.removeEventListener('keydown', trap);
      document.body.classList.remove('modal-open');
      if (!silent && lastFocus && lastFocus.focus) lastFocus.focus();
    }
  };
  function trap(e) {
    if (e.key === 'Escape') { Q.modal.close(); return; }
    if (e.key !== 'Tab') return;
    var f = Array.prototype.slice.call(document.querySelectorAll('#modal-root button, #modal-root [href], #modal-root input'));
    if (!f.length) return;
    var i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  }

  /* ---------- إشعارات قصيرة ---------- */
  Q.toast = function (html, ms) {
    var root = document.getElementById('toast-root');
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = html;
    root.appendChild(el);
    setTimeout(function () { el.classList.add('out'); }, ms || 2800);
    setTimeout(function () { el.remove(); }, (ms || 2800) + 500);
  };

  /* ---------- قراءة صوتية (دعم صوتي أولي) ---------- */
  Q.speak = function (text) {
    if (!('speechSynthesis' in window)) { Q.toast('🔇 القراءة الصوتية غير مدعومة في هذا المتصفح'); return; }
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(String(text).replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, ''));
      u.lang = 'ar-SA'; u.rate = 0.9;
      var voices = window.speechSynthesis.getVoices() || [];
      var ar = voices.filter(function (v) { return /^ar/i.test(v.lang); })[0];
      if (ar) u.voice = ar;
      window.speechSynthesis.speak(u);
    } catch (e) { /* تجاهل */ }
  };

  /* ---------- احتفال هادئ ---------- */
  Q.celebrate = function () {
    if (!Q.motionOK()) return;
    var root = document.createElement('div');
    root.className = 'confetti';
    root.setAttribute('aria-hidden', 'true');
    var shapes = ['🫒', '💧', '🌿', '✨', '🌺'];
    for (var i = 0; i < 26; i++) {
      var s = document.createElement('span');
      s.textContent = shapes[i % shapes.length];
      s.style.left = (Math.random() * 100) + '%';
      s.style.animationDelay = (Math.random() * 1.2) + 's';
      s.style.animationDuration = (2.6 + Math.random() * 1.6) + 's';
      s.style.fontSize = (16 + Math.random() * 14) + 'px';
      root.appendChild(s);
    }
    document.body.appendChild(root);
    setTimeout(function () { root.remove(); }, 5000);
  };
})();
