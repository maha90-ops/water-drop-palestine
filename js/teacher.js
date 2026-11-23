/* =========================================================
   📊 لوحة المعلم — بيانات تجريبية (مولّدة ببذرة ثابتة) + الطالب المحلي
   ========================================================= */
(function () {
  var ar = Q.toAr, esc = Q.esc;
  var view = 'pre', selectedSkill = null;

  /* مولد أرقام عشوائية ثابت البذرة حتى تبقى البيانات نفسها عند كل فتح */
  var seed = 20261123;
  function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }
  function gauss() { return (rnd() + rnd() + rnd() - 1.5) / 1.5; }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function q(v) { return Math.round(v * 20) / 20; }

  var NAMES = ['ليان', 'محمد', 'سلمى', 'يوسف', 'جنى', 'أحمد', 'تالا', 'كريم', 'ريم', 'عمر', 'سارة', 'آدم', 'لمى', 'خالد', 'هيا', 'زيد', 'نور', 'إياد', 'مريم', 'سامي', 'دانة', 'باسل', 'رهف', 'علي', 'جود', 'حمزة', 'ميار', 'طارق', 'شهد', 'فارس'];
  var FAMILY = ['الخطيب', 'عودة', 'النجار', 'حمدان', 'البرغوثي', 'شاهين', 'الأسمر', 'دراغمة', 'أبو سنينة', 'الحسيني'];
  var BASE = { evap: .82, cond: .5, precip: .66, collect: .74, runoff: .6, seq: .62 };

  function makeDemo() {
    return NAMES.map(function (n, i) {
      var ability = gauss() * .18, progress = Math.min(1, .35 + rnd() * .9);
      var s = { name: n + ' ' + FAMILY[i % FAMILY.length], demo: true, progress: progress, pre: {}, during: {}, after: {} };
      Q.SKILL_ORDER.forEach(function (k) {
        var pre = clamp(q(BASE[k] + ability + gauss() * .2));
        var gain = progress >= .99 ? 1 : progress;
        s.pre[k] = pre;
        s.during[k] = clamp(q(pre + (1 - pre) * (.45 + gauss() * .1) * gain));
        s.after[k] = clamp(q(pre + (1 - pre) * (.72 + gauss() * .12) * gain));
      });
      return s;
    });
  }

  function localStudent() {
    var st = Q.store.get();
    if (!st.diag || !st.diag.done) return null;
    var s = { name: (st.name || 'طالب') + ' ⭐', demo: false, pre: {}, during: {}, after: {} };
    var done = Q.STAGES.filter(function (x) { return st.stages[x.id] && st.stages[x.id].status === 'done'; }).length;
    s.progress = done / Q.STAGES.length;
    Q.SKILL_ORDER.forEach(function (k) {
      var m = st.metrics[k];
      var avg = function (a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : null; };
      s.pre[k] = m.pre || 0;
      var during = avg(m.supported);
      var afterArr = m.independent.filter(function (x) { return x.after; }).map(function (x) { return x.v; });
      if (!afterArr.length && !m.supported.length) afterArr = m.independent.map(function (x) { return x.v; });
      var after = avg(afterArr);
      s.during[k] = during == null ? (after == null ? s.pre[k] : after) : during;
      s.after[k] = after == null ? s.during[k] : after;
    });
    return s;
  }

  var students = makeDemo();
  var me = localStudent();
  if (me) students.unshift(me);

  function score(s, k) { return view === 'pre' ? s.pre[k] : s.after[k]; }
  function lv(s, k) { return Q.levelOf(score(s, k)); }
  function lvBadge(l) { var L = Q.LEVELS[l]; return '<span class="lv ' + L.cls + '">' + L.emoji + ' ' + L.label.replace('أحتاج', 'يحتاج').replace('أتقنت', 'أتقن') + '</span>'; }
  function pct(v) { return ar(Math.round(v * 100)) + '٪'; }
  function overall(s) {
    var c = { green: 0, yellow: 0, red: 0 };
    Q.SKILL_ORDER.forEach(function (k) { c[lv(s, k)]++; });
    return c.red >= 2 ? 'red' : c.red || c.yellow >= 2 ? 'yellow' : 'green';
  }
  function plural(n) { return n === 1 ? 'طالب' : n === 2 ? 'طالبان' : n <= 10 ? 'طلاب' : 'طالبًا'; }

  function kpis() {
    var pairs = 0, notMastered = 0, sum = 0;
    students.forEach(function (s) { Q.SKILL_ORDER.forEach(function (k) { pairs++; sum += score(s, k); if (lv(s, k) !== 'green') notMastered++; }); });
    var done = students.filter(function (s) { return s.progress >= .99; }).length;
    var weakest = Q.SKILL_ORDER.slice().sort(function (a, b) {
      return students.reduce(function (t, s) { return t + score(s, a); }, 0) - students.reduce(function (t, s) { return t + score(s, b); }, 0);
    })[0];
    var preLoss = 0;
    students.forEach(function (s) { Q.SKILL_ORDER.forEach(function (k) { if (Q.levelOf(s.pre[k]) !== 'green') preLoss++; }); });
    document.getElementById('kpis').innerHTML =
      tile('👥', 'عدد الطلاب', ar(students.length), me ? 'منهم طالب حقيقي من هذا الجهاز ⭐' : 'بيانات تجريبية') +
      tile('📉', 'الفاقد التعليمي', pct(notMastered / pairs), view === 'pre' ? 'نسبة المهارات غير المتقنة قبل التدخل' : 'كان ' + pct(preLoss / pairs) + ' قبل التدخل') +
      tile('🎯', 'متوسط الإتقان', pct(sum / pairs), view === 'pre' ? 'في التشخيص القبلي' : 'بعد إزالة السقالات') +
      tile('🏁', 'أكملوا الرحلة', ar(done) + ' من ' + ar(students.length), 'جميع المراحل الخمس') +
      tile(Q.SKILLS[weakest].icon, 'المهارة الأضعف', Q.SKILLS[weakest].name, 'تحتاج تدخلًا جماعيًا');
  }
  function tile(ic, label, value, note) {
    return '<div class="kpi"><span class="kpi-ic" aria-hidden="true">' + ic + '</span><span class="kpi-l">' + label + '</span><b class="kpi-v">' + value + '</b><small>' + note + '</small></div>';
  }

  function dist() {
    var html = Q.SKILL_ORDER.map(function (k) {
      var c = { green: 0, yellow: 0, red: 0 };
      students.forEach(function (s) { c[lv(s, k)]++; });
      var n = students.length;
      var seg = function (l) {
        if (!c[l]) return '';
        var L = Q.LEVELS[l];
        return '<span class="seg-' + l + '" style="flex:' + c[l] + '" title="' + Q.SKILLS[k].name + ' — ' + L.emoji + ' ' + L.label + ': ' + ar(c[l]) + ' ' + plural(c[l]) + '"></span>';
      };
      return '<button type="button" class="dist-row' + (selectedSkill === k ? ' sel' : '') + '" data-skill="' + k + '" aria-pressed="' + (selectedSkill === k) + '">' +
        '<span class="dist-name">' + Q.SKILLS[k].icon + ' ' + Q.SKILLS[k].name + '</span>' +
        '<span class="stack" role="img" aria-label="' + Q.SKILLS[k].name + ': ' + ar(c.green) + ' أتقنوا، ' + ar(c.yellow) + ' يحتاجون تدريبًا، ' + ar(c.red) + ' يحتاجون دعمًا">' + seg('green') + seg('yellow') + seg('red') + '</span>' +
        '<span class="dist-counts"><span>🟢 ' + ar(c.green) + '</span><span>🟡 ' + ar(c.yellow) + '</span><span>🔴 ' + ar(c.red) + '</span></span></button>';
    }).join('');
    var el = document.getElementById('dist');
    el.innerHTML = html;
    el.querySelectorAll('[data-skill]').forEach(function (b) {
      b.addEventListener('click', function () { selectedSkill = b.dataset.skill; dist(); detail(); });
    });
  }

  var SUGGEST = {
    red: '🪜 ابدأ بالسقالة ٢ (صورة توضيحية) ثم المثال المحلول، مع مجموعة صغيرة.',
    yellow: '🪜 تلميح ثم تدريب موجّه، ثم سؤال تحقق بدون مساعدة.'
  };
  function detail() {
    var el = document.getElementById('detail');
    if (!selectedSkill) return;
    var k = selectedSkill;
    var red = students.filter(function (s) { return lv(s, k) === 'red'; }).sort(function (a, b) { return score(a, k) - score(b, k); });
    var yel = students.filter(function (s) { return lv(s, k) === 'yellow'; }).sort(function (a, b) { return score(a, k) - score(b, k); });
    var list = function (arr, l) {
      if (!arr.length) return '<p class="muted small">لا يوجد طلاب في هذا المستوى 🎉</p>';
      return '<ul class="who">' + arr.map(function (s) {
        return '<li><span>' + esc(s.name) + '</span><span class="who-v">' + pct(score(s, k)) + '</span></li>';
      }).join('') + '</ul><p class="suggest">' + SUGGEST[l] + '</p>';
    };
    el.innerHTML = '<h3>' + Q.SKILLS[k].icon + ' ' + Q.SKILLS[k].name + ' <small class="muted">(' + (view === 'pre' ? 'التشخيص القبلي' : 'بعد التدخل') + ')</small></h3>' +
      '<h4>🔴 يحتاجون إلى دعم (' + ar(red.length) + ')</h4>' + list(red, 'red') +
      '<h4>🟡 يحتاجون إلى تدريب (' + ar(yel.length) + ')</h4>' + list(yel, 'yellow');
    if (window.innerWidth < 900) document.getElementById('detail-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function impact() {
    var avg = function (key, k) { return students.reduce(function (t, s) { return t + s[key][k]; }, 0) / students.length; };
    document.getElementById('impact').innerHTML = Q.SKILL_ORDER.map(function (k) {
      var vals = [['قبل التدخل', avg('pre', k), 's1'], ['بعد السقالات', avg('during', k), 's2'], ['بعد إزالة السقالات', avg('after', k), 's3']];
      return '<div class="imp-skill"><h3>' + Q.SKILLS[k].icon + ' ' + Q.SKILLS[k].name + '</h3>' + vals.map(function (v) {
        return '<div class="rbar" title="' + v[0] + ': ' + pct(v[1]) + '"><span class="rbar-l">' + v[0] + '</span><span class="rbar-track"><span class="rbar-fill ' + v[2] + '" style="width:' + Math.round(v[1] * 100) + '%"></span></span><span class="rbar-v">' + pct(v[1]) + '</span></div>';
      }).join('') + '</div>';
    }).join('');
  }

  function table() {
    var f = document.getElementById('filter').value;
    var rows = students.filter(function (s) {
      if (f === 'all') return true;
      var ls = Q.SKILL_ORDER.map(function (k) { return lv(s, k); });
      if (f === 'green') return ls.every(function (l) { return l === 'green'; });
      return ls.indexOf(f) !== -1;
    });
    var L = function (l) { return '<span class="cell-lv" title="' + Q.LEVELS[l].label + '">' + Q.LEVELS[l].emoji + '<span class="sr-only">' + Q.LEVELS[l].label + '</span></span>'; };
    document.getElementById('table').innerHTML =
      '<caption class="sr-only">مستوى كل طالب في كل مهارة</caption><thead><tr><th scope="col">الطالب</th>' +
      Q.SKILL_ORDER.map(function (k) { return '<th scope="col"><span aria-hidden="true">' + Q.SKILLS[k].icon + '</span> ' + Q.SKILLS[k].short + '</th>'; }).join('') +
      '<th scope="col">التقدم</th><th scope="col">المستوى العام</th></tr></thead><tbody>' +
      rows.map(function (s, i) {
        return '<tr' + (s.demo ? '' : ' class="me"') + '><th scope="row"><button type="button" class="link-b" data-i="' + students.indexOf(s) + '">' + esc(s.name) + '</button></th>' +
          Q.SKILL_ORDER.map(function (k) { return '<td>' + L(lv(s, k)) + '</td>'; }).join('') +
          '<td><span class="prog"><span style="width:' + Math.round(s.progress * 100) + '%"></span></span> ' + ar(Math.round(s.progress * 100)) + '٪</td>' +
          '<td>' + lvBadge(overall(s)) + '</td></tr>';
      }).join('') + '</tbody>';
    document.querySelectorAll('.link-b').forEach(function (b) {
      b.addEventListener('click', function () { studentModal(students[Number(b.dataset.i)]); });
    });
  }

  function studentModal(s) {
    Q.modal.open({
      title: '👤 ' + esc(s.name),
      body: '<p class="muted">التقدم في الرحلة: ' + ar(Math.round(s.progress * 100)) + '٪' + (s.demo ? ' • بيانات تجريبية' : ' • بيانات حقيقية من هذا الجهاز') + '</p>' +
        '<div class="legend"><span><i class="sw s1"></i> قبل</span><span><i class="sw s2"></i> بالسقالات</span><span><i class="sw s3"></i> بعد الإزالة</span></div>' +
        Q.SKILL_ORDER.map(function (k) {
          return '<div class="imp-skill"><h3>' + Q.SKILLS[k].icon + ' ' + Q.SKILLS[k].name + ' ' + lvBadge(Q.levelOf(s.pre[k])) + ' ← ' + lvBadge(Q.levelOf(s.after[k])) + '</h3>' +
            [['قبل التدخل', s.pre[k], 's1'], ['بعد السقالات', s.during[k], 's2'], ['بعد إزالة السقالات', s.after[k], 's3']].map(function (v) {
              return '<div class="rbar"><span class="rbar-l">' + v[0] + '</span><span class="rbar-track"><span class="rbar-fill ' + v[2] + '" style="width:' + Math.round(v[1] * 100) + '%"></span></span><span class="rbar-v">' + pct(v[1]) + '</span></div>';
            }).join('') + '</div>';
        }).join('')
    });
  }

  function renderAll() { kpis(); dist(); detail(); impact(); table(); }

  document.addEventListener('DOMContentLoaded', function () {
    var st = Q.store.get();
    document.documentElement.style.setProperty('--fs-scale', st.settings.font);
    document.documentElement.classList.toggle('hc', !!st.settings.contrast);
    document.documentElement.classList.toggle('no-motion', !st.settings.motion);
    document.querySelectorAll('[data-view]').forEach(function (b) {
      b.addEventListener('click', function () {
        view = b.dataset.view;
        document.querySelectorAll('[data-view]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        renderAll();
      });
    });
    document.getElementById('filter').addEventListener('change', table);
    selectedSkill = 'cond';
    renderAll();
  });
})();
