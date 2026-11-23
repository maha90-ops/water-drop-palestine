/* =========================================================
   أنواع المهام التفاعلية
   choice | order | match | sort | scene
   كل مهمة تُرجع متحكمًا: ready() evaluate() mark() reveal() lock()
   السحب والإفلات يعمل باللمس والفأرة، وله بديل بالنقر ولوحة المفاتيح.
   ========================================================= */
(function () {
  var esc = function (s) { return Q.esc(s); };

  /* ---------- محرّك سحب وإفلات عام (مع بديل النقر) ---------- */
  function dnd(root, opts) {
    var selected = null;
    function zones() { return root.querySelectorAll('[data-zone]'); }
    function place(chip, zone) {
      if (!zone || !chip) return;
      var max = Number(zone.getAttribute('data-max') || 0);
      var holder = zone.querySelector('.zone-items') || zone;
      if (max && holder.querySelectorAll('.chip').length >= max) {
        var existing = holder.querySelector('.chip');
        if (existing !== chip) root.querySelector('[data-zone="pool"] .zone-items').appendChild(existing);
      }
      holder.appendChild(chip);
      select(null);
      opts.onChange && opts.onChange();
    }
    function select(chip) {
      if (selected) selected.classList.remove('selected');
      selected = chip;
      root.classList.toggle('has-selection', !!chip);
      if (chip) { chip.classList.add('selected'); chip.setAttribute('aria-pressed', 'true'); }
      root.querySelectorAll('.chip').forEach(function (c) { if (c !== chip) c.setAttribute('aria-pressed', 'false'); });
    }
    root.addEventListener('click', function (e) {
      if (root.classList.contains('locked')) return;
      var chip = e.target.closest('.chip');
      if (chip && root.contains(chip)) {
        if (chip.dataset.justDragged) { delete chip.dataset.justDragged; return; }
        select(selected === chip ? null : chip);
        return;
      }
      var zone = e.target.closest('[data-zone]');
      if (zone && selected) place(selected, zone);
    });
    // سحب بالمؤشر (فأرة/لمس/قلم)
    root.addEventListener('pointerdown', function (e) {
      if (root.classList.contains('locked')) return;
      var chip = e.target.closest('.chip');
      if (!chip || e.button > 0) return;
      var sx = e.clientX, sy = e.clientY, dragging = false;
      var rect = chip.getBoundingClientRect();
      function move(ev) {
        var dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (!dragging && Math.hypot(dx, dy) > 6) {
          dragging = true; chip.classList.add('dragging');
          chip.style.width = rect.width + 'px';
        }
        if (dragging) {
          ev.preventDefault();
          chip.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(-2deg)';
          zones().forEach(function (z) { z.classList.remove('over'); });
          var under = document.elementFromPoint(ev.clientX, ev.clientY);
          var z = under && under.closest('[data-zone]');
          if (z && root.contains(z)) z.classList.add('over');
        }
      }
      function up(ev) {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', up);
        if (!dragging) return;
        chip.classList.remove('dragging'); chip.style.transform = ''; chip.style.width = '';
        zones().forEach(function (z) { z.classList.remove('over'); });
        var under = document.elementFromPoint(ev.clientX, ev.clientY);
        var z = under && under.closest('[data-zone]');
        chip.dataset.justDragged = '1';
        setTimeout(function () { delete chip.dataset.justDragged; }, 50);
        if (z && root.contains(z)) place(chip, z);
      }
      document.addEventListener('pointermove', move, { passive: false });
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', up);
    });
  }

  var T = {};

  /* ---------- اختيار من متعدد ---------- */
  T.choice = function (item, el, opts) {
    var options = Q.shuffle(item.options.map(function (o, i) { return Object.assign({ i: i }, o); }));
    var picked = null;
    el.innerHTML = (item.visual ? '<figure class="task-visual">' + Q.scene(item.visual) + '</figure>' : '') +
      '<div class="options" role="radiogroup" aria-label="الخيارات">' +
      options.map(function (o, k) {
        return '<button type="button" class="opt" role="radio" aria-checked="false" data-i="' + o.i + '">' +
          '<span class="opt-key" aria-hidden="true">' + 'أبجد'[k] + '</span><span class="opt-icon" aria-hidden="true">' + (o.icon || '') + '</span><span class="opt-t">' + esc(o.t) + '</span></button>';
      }).join('') + '</div>';
    var group = el.querySelector('.options');
    group.addEventListener('click', function (e) {
      var b = e.target.closest('.opt');
      if (!b || group.classList.contains('locked')) return;
      group.querySelectorAll('.opt').forEach(function (x) { x.setAttribute('aria-checked', 'false'); x.classList.remove('picked'); });
      b.setAttribute('aria-checked', 'true'); b.classList.add('picked');
      picked = Number(b.dataset.i);
      opts.onChange && opts.onChange();
    });
    return {
      ready: function () { return picked !== null; },
      evaluate: function () {
        var ok = picked !== null && !!item.options[picked].correct;
        var r = { score: ok ? 1 : 0, correct: ok, perSkill: {} };
        if (item.credit) Object.keys(item.credit).forEach(function (k) { r.perSkill[k] = [ok ? 1 : 0, 1]; });
        return r;
      },
      mark: function () {
        var b = group.querySelector('.opt.picked');
        if (b) b.classList.add(item.options[picked].correct ? 'is-right' : 'is-wrong');
      },
      reveal: function () { group.querySelectorAll('.opt').forEach(function (b) { if (item.options[b.dataset.i].correct) b.classList.add('is-right'); }); },
      lock: function () { group.classList.add('locked'); group.querySelectorAll('.opt').forEach(function (b) { b.disabled = true; }); }
    };
  };

  /* ---------- ترتيب المراحل ---------- */
  T.order = function (item, el, opts) {
    var idx = item.items.map(function (_, i) { return i; });
    var order;
    do { order = Q.shuffle(idx); } while (order.every(function (v, i) { return v === i; }));
    el.innerHTML = '<p class="task-help">اسحب البطاقات أو استخدم الأسهم ▲▼ لترتيبها. الأولى في الأعلى.</p><ol class="order-list"></ol>';
    var list = el.querySelector('.order-list');
    function draw(focusId) {
      list.innerHTML = order.map(function (v, p) {
        return '<li class="order-item" data-v="' + v + '"><span class="order-num">' + Q.toAr(p + 1) + '</span>' +
          '<span class="order-grip" aria-hidden="true">⠿</span><span class="order-t">' + esc(item.items[v]) + '</span>' +
          '<span class="order-btns"><button type="button" class="mini" data-act="up" aria-label="انقل «' + esc(item.items[v]) + '» إلى الأعلى" ' + (p === 0 ? 'disabled' : '') + '>▲</button>' +
          '<button type="button" class="mini" data-act="down" aria-label="انقل «' + esc(item.items[v]) + '» إلى الأسفل" ' + (p === order.length - 1 ? 'disabled' : '') + '>▼</button></span></li>';
      }).join('');
      if (focusId) {
        var f = list.querySelector('[data-v="' + focusId.v + '"] [data-act="' + focusId.act + '"]');
        if (f && !f.disabled) f.focus(); else { var any = list.querySelector('[data-v="' + focusId.v + '"] .mini:not([disabled])'); any && any.focus(); }
      }
    }
    draw();
    list.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b || list.classList.contains('locked')) return;
      var v = Number(b.closest('.order-item').dataset.v), p = order.indexOf(v), q = b.dataset.act === 'up' ? p - 1 : p + 1;
      if (q < 0 || q >= order.length) return;
      order[p] = order[q]; order[q] = v;
      draw({ v: v, act: b.dataset.act });
      opts.onChange && opts.onChange();
    });
    // سحب لإعادة الترتيب
    list.addEventListener('pointerdown', function (e) {
      if (list.classList.contains('locked') || e.target.closest('button')) return;
      var li = e.target.closest('.order-item');
      if (!li) return;
      var startY = e.clientY, dragging = false;
      function move(ev) {
        if (!dragging && Math.abs(ev.clientY - startY) > 6) { dragging = true; li.classList.add('dragging'); }
        if (!dragging) return;
        ev.preventDefault();
        li.style.transform = 'translateY(' + (ev.clientY - startY) + 'px)';
        var items = Array.prototype.slice.call(list.children);
        var p = items.indexOf(li);
        var next = items[p + 1], prev = items[p - 1];
        if (next && ev.clientY > next.getBoundingClientRect().top + next.offsetHeight / 2) {
          list.insertBefore(next, li); startY += next.offsetHeight + 10; li.style.transform = 'translateY(' + (ev.clientY - startY) + 'px)';
        } else if (prev && ev.clientY < prev.getBoundingClientRect().top + prev.offsetHeight / 2) {
          list.insertBefore(li, prev); startY -= prev.offsetHeight + 10; li.style.transform = 'translateY(' + (ev.clientY - startY) + 'px)';
        }
      }
      function up() {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', up);
        if (!dragging) return;
        order = Array.prototype.map.call(list.children, function (c) { return Number(c.dataset.v); });
        draw();
        opts.onChange && opts.onChange();
      }
      document.addEventListener('pointermove', move, { passive: false });
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', up);
    });
    return {
      ready: function () { return true; },
      evaluate: function () {
        var right = order.filter(function (v, i) { return v === i; }).length;
        var r = { score: right / order.length, correct: right === order.length, perSkill: {} };
        if (item.credit) Object.keys(item.credit).forEach(function (k) { r.perSkill[k] = [r.score, 1]; });
        return r;
      },
      mark: function () {
        list.querySelectorAll('.order-item').forEach(function (li, i) { li.classList.add(Number(li.dataset.v) === i ? 'is-right' : 'is-wrong'); });
      },
      reveal: function () { order = idx.slice(); draw(); list.querySelectorAll('.order-item').forEach(function (li) { li.classList.add('is-right'); }); this.lock(); },
      lock: function () { list.classList.add('locked'); list.querySelectorAll('button').forEach(function (b) { b.disabled = true; }); }
    };
  };

  /* ---------- ربط الصورة بالمفهوم ---------- */
  T.match = function (item, el, opts) {
    var pairs = item.pairs.map(function (p, i) { return Object.assign({ i: i }, p); });
    var targets = Q.shuffle(pairs), chips = Q.shuffle(pairs);
    el.innerHTML = '<p class="task-help">اسحب البطاقة إلى الصورة، أو اضغط البطاقة ثم اضغط الصورة.</p>' +
      '<div class="dnd match">' +
      '<div class="zone pool" data-zone="pool" aria-label="بطاقات المفاهيم"><div class="zone-items">' +
      chips.map(function (p) { return '<button type="button" class="chip" data-i="' + p.i + '" aria-pressed="false">' + esc(p.b) + '</button>'; }).join('') +
      '</div></div><div class="match-grid">' +
      targets.map(function (p) {
        return '<div class="zone slot" data-zone="t' + p.i + '" data-max="1" data-target="' + p.i + '" role="button" tabindex="0" aria-label="ضع هنا المفهوم المناسب لـ: ' + esc(p.a) + '">' +
          '<span class="slot-pic" aria-hidden="true">' + p.icon + '</span><span class="slot-cap">' + esc(p.a) + '</span><div class="zone-items"></div></div>';
      }).join('') + '</div></div>';
    var root = el.querySelector('.dnd');
    dnd(root, opts);
    keyZones(root);
    return {
      ready: function () { return root.querySelectorAll('.slot .chip').length === pairs.length; },
      evaluate: function () {
        var per = {}, right = 0;
        pairs.forEach(function (p) {
          var chip = root.querySelector('[data-target="' + p.i + '"] .chip');
          var ok = chip && Number(chip.dataset.i) === p.i;
          if (ok) right++;
          if (p.skill) { per[p.skill] = per[p.skill] || [0, 0]; per[p.skill][0] += ok ? 1 : 0; per[p.skill][1] += 1; }
        });
        return { score: right / pairs.length, correct: right === pairs.length, perSkill: per };
      },
      mark: function () {
        root.querySelectorAll('.slot').forEach(function (s) {
          var c = s.querySelector('.chip');
          if (c) c.classList.add(Number(c.dataset.i) === Number(s.dataset.target) ? 'is-right' : 'is-wrong');
        });
      },
      reveal: function () {
        pairs.forEach(function (p) {
          var chip = root.querySelector('.chip[data-i="' + p.i + '"]');
          root.querySelector('[data-target="' + p.i + '"] .zone-items').appendChild(chip);
          chip.classList.remove('is-wrong'); chip.classList.add('is-right');
        });
        this.lock();
      },
      lock: function () { root.classList.add('locked'); root.querySelectorAll('button').forEach(function (b) { b.disabled = true; }); }
    };
  };

  /* ---------- تصنيف البطاقات في سلال ---------- */
  T.sort = function (item, el, opts) {
    var cards = Q.shuffle(item.cards.map(function (c, i) { return Object.assign({ i: i }, c); }));
    el.innerHTML = '<p class="task-help">اسحب كل بطاقة إلى السلة المناسبة، أو اضغط البطاقة ثم اضغط السلة.</p>' +
      '<div class="dnd sorter">' +
      '<div class="zone pool" data-zone="pool" aria-label="البطاقات"><div class="zone-items">' +
      cards.map(function (c) { return '<button type="button" class="chip" data-i="' + c.i + '" aria-pressed="false">' + esc(c.t) + '</button>'; }).join('') +
      '</div></div><div class="bins bins-' + item.bins.length + '">' +
      item.bins.map(function (b, k) {
        return '<div class="zone bin" data-zone="b' + k + '" data-bin="' + k + '" role="button" tabindex="0" aria-label="سلة: ' + esc(b) + '">' +
          '<span class="bin-title">🧺 ' + esc(b) + '</span><div class="zone-items"></div></div>';
      }).join('') + '</div></div>';
    var root = el.querySelector('.dnd');
    dnd(root, opts);
    keyZones(root);
    return {
      ready: function () { return root.querySelectorAll('.bin .chip').length === cards.length; },
      evaluate: function () {
        var per = {}, right = 0;
        item.cards.forEach(function (c, i) {
          var chip = root.querySelector('.chip[data-i="' + i + '"]');
          var bin = chip.closest('.bin');
          var ok = bin && Number(bin.dataset.bin) === c.bin;
          if (ok) right++;
          if (c.skill) { per[c.skill] = per[c.skill] || [0, 0]; per[c.skill][0] += ok ? 1 : 0; per[c.skill][1] += 1; }
        });
        return { score: right / item.cards.length, correct: right === item.cards.length, perSkill: per };
      },
      mark: function () {
        root.querySelectorAll('.bin .chip').forEach(function (c) {
          c.classList.add(item.cards[c.dataset.i].bin === Number(c.closest('.bin').dataset.bin) ? 'is-right' : 'is-wrong');
        });
      },
      reveal: function () {
        item.cards.forEach(function (c, i) {
          var chip = root.querySelector('.chip[data-i="' + i + '"]');
          root.querySelector('[data-bin="' + c.bin + '"] .zone-items').appendChild(chip);
          chip.classList.remove('is-wrong'); chip.classList.add('is-right');
        });
        this.lock();
      },
      lock: function () { root.classList.add('locked'); root.querySelectorAll('button').forEach(function (b) { b.disabled = true; }); }
    };
  };

  /* ---------- سؤال بصري: اضغط على المكان ---------- */
  T.scene = function (item, el, opts) {
    var picked = null;
    el.innerHTML = '<div class="hotspot-wrap"><figure class="task-visual">' + Q.scene(item.visual) + '</figure>' +
      item.spots.map(function (s, i) {
        return '<button type="button" class="spot" style="left:' + s.x + '%;top:' + s.y + '%" data-i="' + i + '" aria-pressed="false">' +
          '<span class="spot-dot" aria-hidden="true"></span><span class="spot-l">' + esc(s.label) + '</span></button>';
      }).join('') + '</div>';
    var wrap = el.querySelector('.hotspot-wrap');
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('.spot');
      if (!b || wrap.classList.contains('locked')) return;
      wrap.querySelectorAll('.spot').forEach(function (x) { x.classList.remove('picked'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('picked'); b.setAttribute('aria-pressed', 'true');
      picked = Number(b.dataset.i);
      opts.onChange && opts.onChange();
    });
    return {
      ready: function () { return picked !== null; },
      evaluate: function () {
        var ok = picked !== null && !!item.spots[picked].correct;
        var r = { score: ok ? 1 : 0, correct: ok, perSkill: {} };
        if (item.credit) Object.keys(item.credit).forEach(function (k) { r.perSkill[k] = [ok ? 1 : 0, 1]; });
        return r;
      },
      mark: function () { var b = wrap.querySelector('.spot.picked'); if (b) b.classList.add(item.spots[picked].correct ? 'is-right' : 'is-wrong'); },
      reveal: function () { wrap.querySelectorAll('.spot').forEach(function (b) { if (item.spots[b.dataset.i].correct) b.classList.add('is-right'); }); },
      lock: function () { wrap.classList.add('locked'); wrap.querySelectorAll('.spot').forEach(function (b) { b.disabled = true; }); }
    };
  };

  function keyZones(root) {
    root.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-zone][role="button"]')) {
        e.preventDefault(); e.target.click();
      }
    });
  }

  Q.tasks = {
    render: function (item, el, opts) { return (T[item.type] || T.choice)(item, el, opts || {}); }
  };

  /* =========================================================
     🧩 الأنشطة الموجّهة (المستوى الخامس من السقالات)
     ========================================================= */
  var G = {};

  G.heat = function (el, done) {
    el.innerHTML = '<p class="g-ins">حرّك المؤشر لزيادة حرارة الشمس، وراقب ماذا يحدث لماء البحر.</p>' +
      '<div class="g-stage"><svg viewBox="0 0 320 170" class="scene" aria-hidden="true">' +
      '<rect width="320" height="170" fill="#e8f5fd"/><circle class="g-sun" cx="60" cy="40" r="22" fill="#ffd34d" stroke="#f0a91c" stroke-width="3"/>' +
      '<rect y="115" width="320" height="55" fill="#3a92cf"/><g class="g-vap"></g></svg></div>' +
      '<label class="g-range">🌡️ حرارة الشمس: <input type="range" min="0" max="4" value="0" step="1" aria-label="حرارة الشمس"></label>' +
      '<p class="g-out" aria-live="polite">الماء هادئ… لا يوجد تبخر واضح.</p>';
    var input = el.querySelector('input'), vap = el.querySelector('.g-vap'), out = el.querySelector('.g-out'), sunEl = el.querySelector('.g-sun');
    var msgs = ['الماء هادئ… لا يوجد تبخر واضح.', 'الماء بدأ يسخن قليلًا… ♨️', 'ظهر بخار أكثر يصعد إلى الأعلى ⬆️', 'تبخر كثير! الحرارة تحوّل الماء إلى بخار.', '✅ لاحظت: كلما زادت الحرارة زاد التبخر! الماء السائل ← بخار ماء (غاز).'];
    input.addEventListener('input', function () {
      var v = Number(input.value);
      sunEl.setAttribute('r', 22 + v * 4);
      var s = '';
      for (var i = 0; i < v * 3; i++) s += '<path class="rise" style="animation-delay:' + (i * 0.25) + 's" d="M' + (90 + (i * 47) % 210) + ' 110 q-6 -8 0 -16 q6 -8 0 -16" stroke="#9cc8e6" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
      vap.innerHTML = s;
      out.textContent = msgs[v];
      if (v === 4) done();
    });
  };

  G.cool = function (el, done) {
    el.innerHTML = '<p class="g-ins">حرّك المؤشر لتبريد الهواء في الأعلى، وراقب بخار الماء.</p>' +
      '<div class="g-stage"><svg viewBox="0 0 320 170" class="scene" aria-hidden="true"><rect width="320" height="170" fill="#e8f5fd"/>' +
      '<g class="g-cloud" opacity="0"><path d="M120 60 a16 16 0 0 1 14-22 a22 22 0 0 1 40-6 a16 16 0 0 1 22 18 a10 10 0 0 1 0 18 h-68 a10 10 0 0 1 -8 -8z" fill="#fff" stroke="#b9cfe0" stroke-width="2"/></g>' +
      '<g class="g-dots"></g></svg></div>' +
      '<label class="g-range">🥶 برودة الجو: <input type="range" min="0" max="4" value="0" step="1" aria-label="برودة الجو"></label>' +
      '<p class="g-out" aria-live="polite">بخار الماء منتشر في الهواء ولا نراه.</p>';
    var input = el.querySelector('input'), dots = el.querySelector('.g-dots'), out = el.querySelector('.g-out'), cl = el.querySelector('.g-cloud');
    var pts = [];
    for (var i = 0; i < 16; i++) pts.push([20 + (i * 67) % 280, 30 + (i * 41) % 120]);
    var msgs = ['بخار الماء منتشر في الهواء ولا نراه.', 'البخار يبرد ويقترب من بعضه…', 'بدأت تظهر قطرات صغيرة جدًا 💧', 'القطرات تتجمع معًا…', '✅ تكوّنت غيمة! البخار برد فتحوّل إلى قطرات: هذا هو التكاثف.'];
    function draw(v) {
      var t = v / 4;
      dots.innerHTML = pts.map(function (p) {
        var x = p[0] + (160 - p[0]) * t * 0.8, y = p[1] + (55 - p[1]) * t * 0.8;
        return '<circle cx="' + x + '" cy="' + y + '" r="' + (2.5 + t * 2) + '" fill="' + (t > 0.4 ? '#3c9ee0' : '#b7dbf2') + '" opacity="' + (1 - t * 0.6) + '"/>';
      }).join('');
      cl.setAttribute('opacity', String(Math.max(0, t * 1.2 - 0.2)));
    }
    draw(0);
    input.addEventListener('input', function () { var v = Number(input.value); draw(v); out.textContent = msgs[v]; if (v === 4) done(); });
  };

  G.rain = function (el, done) {
    var n = 0;
    el.innerHTML = '<p class="g-ins">اضغط الزر لإضافة قطرات إلى الغيمة حتى تصبح ثقيلة.</p>' +
      '<div class="g-stage"><svg viewBox="0 0 320 170" class="scene" aria-hidden="true"><rect width="320" height="170" fill="#dfe8ef"/>' +
      '<path d="M100 70 a20 20 0 0 1 18-28 a28 28 0 0 1 52-8 a20 20 0 0 1 28 22 a13 13 0 0 1 0 24 h-88 a12 12 0 0 1 -10 -10z" class="g-cl" fill="#f4f7fa" stroke="#9fb0c0" stroke-width="2"/>' +
      '<g class="g-in"></g><g class="g-fall"></g><rect y="150" width="320" height="20" fill="#8daf5c"/></svg></div>' +
      '<button type="button" class="btn btn-soft g-add">💧 أضف قطرة للغيمة</button>' +
      '<div class="g-meter" aria-hidden="true"><span></span></div>' +
      '<p class="g-out" aria-live="polite">القطرات في الغيمة: ٠ من ٥</p>';
    var btn = el.querySelector('.g-add'), gin = el.querySelector('.g-in'), fall = el.querySelector('.g-fall'), out = el.querySelector('.g-out'), cl = el.querySelector('.g-cl'), meter = el.querySelector('.g-meter span');
    btn.addEventListener('click', function () {
      if (n >= 5) return;
      n++;
      gin.innerHTML += '<circle cx="' + (125 + n * 14) + '" cy="' + (55 + (n % 2) * 8) + '" r="' + (3 + n) + '" fill="#3c9ee0"/>';
      var shade = ['#f4f7fa', '#e6ecf1', '#d3dce4', '#bcc8d3', '#a4b3c1', '#8c9dad'][n];
      cl.setAttribute('fill', shade);
      meter.style.width = (n * 20) + '%';
      out.textContent = 'القطرات في الغيمة: ' + Q.toAr(n) + ' من ٥' + (n === 5 ? ' — ✅ أصبحت الغيمة ثقيلة فسقط المطر! هذا هو الهطول.' : '');
      if (n === 5) {
        var s = '';
        for (var i = 0; i < 12; i++) s += '<path class="fall d' + (i % 4) + '" d="M' + (110 + (i * 13) % 110) + ' 95 c3 5 4 7 4 9 a4 4 0 0 1 -8 0 c0 -2 1 -4 4 -9z" fill="#3c9ee0"/>';
        fall.innerHTML = s; gin.innerHTML = ''; btn.disabled = true;
        done();
      }
    });
  };

  G.slope = function (el, done) {
    el.innerHTML = '<p class="g-ins">اضغط «أنزل المطر» وتابع أين يذهب الماء.</p>' +
      '<div class="g-stage">' + Q.scene('slope') + '</div>' +
      '<button type="button" class="btn btn-soft g-go">🌧️ أنزل المطر</button>' +
      '<ol class="g-steps" aria-live="polite"></ol>';
    var steps = ['يهطل المطر على قمة الجبل 🌧️', 'جزء من الماء يتسرب داخل التربة ⬇️ (ويتجمع مياهًا جوفية)', 'والماء الزائد يجري على السفح نحو الأسفل ↘️ (جريان سطحي)', '✅ يصل الماء إلى الوادي ثم يتجمع في النهر أو البحر 🌊'];
    var stage = el.querySelector('.g-stage');
    el.querySelector('.g-go').addEventListener('click', function () {
      this.disabled = true;
      stage.classList.add('is-anim');
      var list = el.querySelector('.g-steps'), i = 0;
      var delay = Q.motionOK() ? 900 : 0;
      (function next() {
        list.innerHTML += '<li>' + steps[i] + '</li>'; i++;
        if (i < steps.length) setTimeout(next, delay); else done();
      })();
    });
  };

  G.cycle = function (el, done) {
    var stages = [
      { t: 'التبخر', i: '☀️', why: 'الشمس تسخّن الماء فيصعد بخارًا.' },
      { t: 'التكاثف', i: '☁️', why: 'البخار يبرد ويتحول إلى قطرات تكوّن الغيوم.' },
      { t: 'الهطول', i: '🌧️', why: 'القطرات الثقيلة تسقط مطرًا أو ثلجًا.' },
      { t: 'التجمع', i: '🌊', why: 'الماء يجري ويتجمع في البحار والأنهار وتحت الأرض.' }
    ];
    var next = 0;
    var order = Q.shuffle([0, 1, 2, 3]);
    el.innerHTML = '<p class="g-ins">اضغط المراحل بالترتيب. المرحلة المطلوبة يظهر حولها توهج خفيف.</p>' +
      '<div class="g-cycle">' + order.map(function (k) {
        return '<button type="button" class="g-node" data-k="' + k + '"><span aria-hidden="true">' + stages[k].i + '</span> ' + stages[k].t + '</button>';
      }).join('') + '<span class="g-center" aria-hidden="true">🔄</span></div>' +
      '<ol class="g-steps" aria-live="polite"></ol>';
    function glow() {
      el.querySelectorAll('.g-node').forEach(function (b) { b.classList.toggle('glow', Number(b.dataset.k) === next); });
    }
    glow();
    el.querySelector('.g-cycle').addEventListener('click', function (e) {
      var b = e.target.closest('.g-node');
      if (!b || b.disabled) return;
      var k = Number(b.dataset.k);
      if (k !== next) { Q.toast('🌱 ليس بعد! ابحث عن المرحلة المتوهجة.'); return; }
      b.disabled = true; b.classList.add('done');
      el.querySelector('.g-steps').innerHTML += '<li><b>' + Q.toAr(k + 1) + '. ' + stages[k].t + ':</b> ' + stages[k].why + '</li>';
      next++;
      glow();
      if (next === 4) done();
    });
  };

  Q.guided = function (type, el, done) { (G[type] || G.cycle)(el, done); };
})();
