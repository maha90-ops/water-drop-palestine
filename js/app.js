/* =========================================================
   رحلة قطرة ماء في فلسطين — منطق تطبيق الطالب
   الشاشات: home → story → diagIntro → diag → map → stage → stageDone → … → final
   المحرك التكيفي + السقالات التدريجية + البازل + التلعيب
   ========================================================= */
(function () {
  var st = Q.store.get();
  var app, esc = Q.esc, ar = Q.toAr;
  var current = null; // متحكم المهمة الحالية

  /* ============ أدوات عامة ============ */
  function save() { Q.store.save(); hud(); }
  function go(screen) { st.screen = screen; save(); render(); }
  function bankItem(id) { return Q.BANK.filter(function (b) { return b.id === id; })[0]; }
  function pct(v) { return v == null ? null : Math.round(v * 100); }
  function avg(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : null; }
  function levelBadge(lv) {
    if (!lv) return '<span class="lv lv-none">⚪ لم يُقَس بعد</span>';
    var L = Q.LEVELS[lv];
    return '<span class="lv ' + L.cls + '">' + L.emoji + ' ' + L.label + '</span>';
  }
  function speakBtn(text) { return '<button type="button" class="icon-btn" data-speak="' + esc(text) + '" aria-label="استمع إلى النص">🔊</button>'; }

  function applySettings() {
    var s = st.settings, html = document.documentElement;
    html.style.setProperty('--fs-scale', s.font);
    html.classList.toggle('hc', !!s.contrast);
    html.classList.toggle('no-motion', !s.motion);
  }

  /* ============ الشريط العلوي ============ */
  function hud() {
    var h = document.getElementById('hud');
    if (!h) return;
    h.innerHTML =
      '<span class="hud-chip" title="النجوم"><span aria-hidden="true">⭐</span> <b>' + ar(st.stars) + '</b><span class="sr-only"> نجمة</span></span>' +
      '<span class="hud-chip" title="القطرات"><span aria-hidden="true">💧</span> <b>' + ar(st.drops) + '</b><span class="sr-only"> قطرة</span></span>' +
      '<span class="hud-chip" title="قطع البازل"><span aria-hidden="true">🧩</span> <b>' + ar(st.pieces) + '/' + ar(Q.PUZZLE_PIECES) + '</b><span class="sr-only"> قطعة بازل</span></span>' +
      '<span class="hud-chip" title="الأوسمة"><span aria-hidden="true">🏅</span> <b>' + ar(st.badges.length) + '</b><span class="sr-only"> وسام</span></span>';
  }

  /* ============ المكافآت ============ */
  function award(id) {
    if (st.badges.indexOf(id) !== -1) return;
    st.badges.push(id);
    var b = Q.BADGES[id];
    Q.toast('<span class="toast-badge">' + b.icon + '</span><div><b>حصلت على ' + b.name + '!</b><br><small>' + b.desc + '</small></div>', 3600);
  }
  function nextFact() {
    var unseen = Q.FACTS.map(function (_, i) { return i; }).filter(function (i) { return st.facts.indexOf(i) === -1; });
    var pool = unseen.length ? unseen : Q.FACTS.map(function (_, i) { return i; });
    var i = pool[Math.floor(Math.random() * pool.length)];
    if (st.facts.indexOf(i) === -1) st.facts.push(i);
    if (st.facts.length >= 6) award('palestine');
    return Q.FACTS[i];
  }
  function factCard(f) {
    return '<aside class="fact-card" aria-label="معلومة من بلادنا"><p class="fact-h">🇵🇸 هل تعلم؟</p><p class="fact-t"><span aria-hidden="true">' + f.icon + '</span> ' + esc(f.t) + '</p></aside>';
  }

  /* ============ بوابة من بلادنا (الساعة) ============ */
  var lastGateFact = -1;
  function openGate() {
    function pick() {
      var i;
      do { i = Math.floor(Math.random() * Q.FACTS.length); } while (i === lastGateFact && Q.FACTS.length > 1);
      lastGateFact = i;
      if (st.facts.indexOf(i) === -1) { st.facts.push(i); if (st.facts.length >= 6) award('palestine'); save(); }
      return Q.FACTS[i];
    }
    function body(f) {
      return '<div class="gate"><div class="gate-icon" aria-hidden="true">' + f.icon + '</div><p class="gate-t">🌿 هل تعلم؟ ' + esc(f.t) + '</p></div>';
    }
    var m = Q.modal.open({
      title: '🇵🇸 بوابة من بلادنا', cls: 'modal-gate', body: body(pick()),
      actions: '<button type="button" class="btn btn-primary" id="gate-more">معلومة أخرى 🌿</button>' +
        '<button type="button" class="btn btn-soft" id="gate-say">🔊 استمع</button>'
    });
    m.querySelector('#gate-more').addEventListener('click', function () {
      var b = m.querySelector('.modal-body');
      b.innerHTML = body(pick());
      b.querySelector('.gate').classList.add('pop');
    });
    m.querySelector('#gate-say').addEventListener('click', function () { Q.speak(m.querySelector('.gate-t').textContent); });
  }

  /* ============ الشاشات ============ */
  var screens = {};

  screens.home = function () {
    var started = st.diag.done || st.diag.idx > 0;
    var cta = st.completedAt ? 'شاهد إنجازك 🏅' : started ? 'تابع رحلتك 💧' : 'ابدأ الرحلة 💧';
    return '<section class="home">' +
      '<div class="home-text">' +
      '<p class="kicker">درس «دورة المياه في الطبيعة» • المرحلة الأساسية</p>' +
      '<h1 tabindex="-1">رحلة قطرة ماء<br><span>في فلسطين</span> <span class="flag-dot" aria-hidden="true">🇵🇸</span></h1>' +
      '<div class="hero-drop">' + Q.dropMascot('happy') +
      '<p class="bubble">' + (st.name ? 'أهلًا ' + esc(st.name) + '! أنا قطرة، صديقتك في هذه الرحلة.' : 'أهلًا! أنا قطرة 💧 ما اسمك؟') + '</p></div>' +
      (st.name ? '' :
        '<form class="name-form" id="name-form"><label for="name-in">اكتب اسمك لنبدأ:</label>' +
        '<div class="name-row"><input id="name-in" autocomplete="given-name" maxlength="30" placeholder="مثلًا: ليان" required>' +
        '</div></form>') +
      '<div class="home-actions">' +
      '<button type="button" class="btn btn-primary btn-xl" id="start">' + cta + '</button>' +
      (started ? '<button type="button" class="btn btn-ghost" id="restart">↺ ابدأ من جديد</button>' : '') +
      '</div>' +
      '<ul class="home-steps" aria-label="مراحل الرحلة">' +
      '<li><span aria-hidden="true">🔎</span> تشخيص قصير</li><li><span aria-hidden="true">🗺️</span> خريطة تعلمك</li>' +
      '<li><span aria-hidden="true">🪜</span> مساعدة خطوة بخطوة</li><li><span aria-hidden="true">🧩</span> لوحة فلسطينية تكتمل</li></ul>' +
      '</div>' +
      '<div class="home-clock">' + Q.clock.markup() + '<p class="clock-note">🕰️ اضغط على الساعة لتفتح «بوابة من بلادنا»</p></div>' +
      '</section>';
  };
  screens.home.after = function () {
    Q.clock.mount(app, openGate);
    var start = app.querySelector('#start');
    start.addEventListener('click', function () {
      if (!st.name) {
        var inp = app.querySelector('#name-in');
        var v = (inp.value || '').trim();
        if (!v) { inp.focus(); inp.classList.add('shake'); setTimeout(function () { inp.classList.remove('shake'); }, 500); Q.toast('✍️ اكتب اسمك أولًا لنبدأ الرحلة'); return; }
        st.name = v; st.startedAt = st.startedAt || new Date().toISOString();
      }
      if (st.completedAt) return go('final');
      if (!st.diag.done) return go(st.diag.idx > 0 ? 'diag' : 'story');
      go('map');
    });
    var form = app.querySelector('#name-form');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); start.click(); });
    var rs = app.querySelector('#restart');
    if (rs) rs.addEventListener('click', confirmReset);
  };

  function confirmReset() {
    var m = Q.modal.open({
      title: '↺ البدء من جديد؟',
      body: '<p>سيُحذف تقدمك المحفوظ على هذا الجهاز (النجوم والقطع والأوسمة). هل أنت متأكد؟</p>',
      actions: '<button type="button" class="btn btn-danger" id="do-reset">نعم، ابدأ من جديد</button>'
    });
    m.querySelector('#do-reset').addEventListener('click', function () {
      st = Q.store.reset(true); Q.modal.close(true); applySettings(); go('home');
    });
  }

  screens.story = function () {
    var msg = 'مرحبًا يا صديقي! أنا قطرة ماء، وقد ضللت طريقي في دورة المياه. هل تساعدني على إكمال رحلتي؟';
    return '<section class="card story">' +
      '<div class="story-scene">' + Q.scene('sunSea') + '</div>' +
      '<div class="story-talk">' + Q.dropMascot('wow') +
      '<div class="bubble big"><h1 tabindex="-1" class="sr-only">بداية القصة</h1><p>' + msg + '</p>' + speakBtn(msg) + '</div></div>' +
      '<div class="center"><button type="button" class="btn btn-primary btn-xl" id="help-yes">نعم، سأساعدك! 💪</button></div></section>';
  };
  screens.story.after = function () {
    app.querySelector('.story-scene').classList.add('is-anim');
    app.querySelector('#help-yes').addEventListener('click', function () { go('diagIntro'); });
    if (st.settings.autoRead) Q.speak(app.querySelector('.bubble p').textContent);
  };

  screens.diagIntro = function () {
    var msg = 'قبل أن نبدأ، أريد أن أعرف ماذا تعرف عن رحلتي. ستجد ٧ مهام قصيرة. لا بأس إن لم تعرف الإجابة، اضغط «لا أعرف بعد» وسأساعدك لاحقًا.';
    return '<section class="card narrow center">' + Q.dropMascot('happy') +
      '<h1 tabindex="-1">🔎 لنتعرّف على ما تعرفه</h1><p class="lead">' + msg + '</p>' + speakBtn(msg) +
      '<ul class="pill-list"><li>☀️ التبخر</li><li>☁️ التكاثف</li><li>🌧️ الهطول</li><li>🌊 التجمع</li><li>⛰️ الجريان</li><li>🔄 التسلسل</li></ul>' +
      '<button type="button" class="btn btn-primary btn-xl" id="go-diag">ابدأ المهام 🔎</button></section>';
  };
  screens.diagIntro.after = function () { app.querySelector('#go-diag').addEventListener('click', function () { go('diag'); }); };

  /* ---------- التشخيص ---------- */
  screens.diag = function () {
    var i = st.diag.idx, item = Q.DIAGNOSIS[i], total = Q.DIAGNOSIS.length;
    return '<section class="card task-card">' +
      '<header class="task-head"><p class="step-label">🔎 التشخيص • المهمة ' + ar(i + 1) + ' من ' + ar(total) + '</p>' +
      '<div class="dots" aria-hidden="true">' + Q.DIAGNOSIS.map(function (_, k) { return '<span class="' + (k < i ? 'done' : k === i ? 'now' : '') + '"></span>'; }).join('') + '</div></header>' +
      '<div class="prompt-row"><h1 class="prompt" tabindex="-1">' + esc(item.prompt) + '</h1>' + speakBtn(item.prompt) +
      '<button type="button" class="icon-btn" id="reread" aria-label="أعد التعليمات">🔁</button></div>' +
      '<div id="task"></div>' +
      '<footer class="task-foot"><button type="button" class="btn btn-ghost" id="dunno">🤔 لا أعرف بعد</button>' +
      '<button type="button" class="btn btn-primary" id="check" disabled>تأكيد الإجابة ✔</button></footer></section>';
  };
  screens.diag.after = function () {
    var item = Q.DIAGNOSIS[st.diag.idx];
    var check = app.querySelector('#check');
    current = Q.tasks.render(item, app.querySelector('#task'), { onChange: function () { check.disabled = !current.ready(); } });
    check.disabled = !current.ready();
    bindReread(item.prompt);
    function submit(res) {
      st.diag.answers[item.id] = res;
      st.diag.idx++;
      current.lock();
      Q.toast('✔ حُفظت إجابتك، لننتقل إلى المهمة التالية', 1400);
      if (st.diag.idx >= Q.DIAGNOSIS.length) finishDiagnosis();
      else go('diag');
    }
    check.addEventListener('click', function () { if (current.ready()) submit(current.evaluate()); });
    app.querySelector('#dunno').addEventListener('click', function () {
      var per = {};
      if (item.credit) Object.keys(item.credit).forEach(function (k) { per[k] = [0, 1]; });
      (item.pairs || item.cards || []).forEach(function (p) { if (p.skill) { per[p.skill] = per[p.skill] || [0, 0]; per[p.skill][1]++; } });
      submit({ score: 0, correct: false, perSkill: per, dunno: true });
    });
  };

  function finishDiagnosis() {
    var sums = {};
    Object.keys(st.diag.answers).forEach(function (id) {
      var per = st.diag.answers[id].perSkill || {};
      Object.keys(per).forEach(function (k) { sums[k] = sums[k] || [0, 0]; sums[k][0] += per[k][0]; sums[k][1] += per[k][1]; });
    });
    Q.SKILL_ORDER.forEach(function (k) {
      var s = sums[k] ? sums[k][0] / sums[k][1] : 0;
      st.metrics[k].pre = s;
      st.preLevel[k] = Q.levelOf(s);
      st.skillLevel[k] = st.preLevel[k];
    });
    st.diag.done = true;
    Q.STAGES.forEach(function (s, i) { st.stages[s.id] = st.stages[s.id] || { status: i === 0 ? 'open' : 'locked' }; });
    award('explorer');
    go('map');
  }

  /* ---------- خريطة التعلم ---------- */
  function pathFor(stage) {
    // مسار المرحلة = أضعف مستوى بين مهاراتها
    var rank = { red: 0, yellow: 1, green: 2 }, worst = 'green';
    stage.skills.forEach(function (k) { var l = st.preLevel[k] || 'yellow'; if (rank[l] < rank[worst]) worst = l; });
    return worst;
  }

  screens.map = function () {
    var counts = { green: 0, yellow: 0, red: 0 };
    Q.SKILL_ORDER.forEach(function (k) { counts[st.skillLevel[k]]++; });
    return '<section class="map-screen">' +
      '<div class="card">' +
      '<h1 tabindex="-1">🧠 خريطة تعلمي</h1>' +
      '<p class="lead">' + esc(st.name || 'صديقي') + '، هذه نتيجة التشخيص لكل مهارة. لن نبدأ جميعًا من النقطة نفسها: مسارك مصمم لك! 🌱</p>' +
      '<div class="legend" aria-label="مفتاح الألوان"><span>🟢 أتقنت</span><span>🟡 أحتاج إلى تدريب</span><span>🔴 أحتاج إلى دعم</span></div>' +
      '<ul class="skill-list">' + Q.SKILL_ORDER.map(function (k) {
        var S = Q.SKILLS[k], pre = pct(st.metrics[k].pre), now = st.skillLevel[k];
        return '<li class="skill-row"><span class="skill-ic" aria-hidden="true">' + S.icon + '</span><span class="skill-n">' + S.name + '</span>' +
          '<span class="meter" role="img" aria-label="نتيجة التشخيص ' + ar(pre) + '٪"><span style="width:' + Math.max(4, pre) + '%"></span></span>' +
          '<span class="skill-pct">' + ar(pre) + '٪</span>' + levelBadge(now) + '</li>';
      }).join('') + '</ul>' +
      '<p class="muted small">🟢 ' + ar(counts.green) + ' • 🟡 ' + ar(counts.yellow) + ' • 🔴 ' + ar(counts.red) + ' — المهارات التي تحتاج تدخلًا ستحصل على دعم إضافي.</p></div>' +
      '<div class="card">' +
      '<h2>💧 مراحل رحلة القطرة</h2>' +
      '<ol class="journey">' + Q.STAGES.map(function (s, i) {
        var ss = st.stages[s.id] || { status: 'locked' }, p = Q.PATHS[pathFor(s)];
        var stat = ss.status === 'done' ? '<span class="st st-done">✔ مكتملة</span>' : ss.status === 'open' ? '<span class="st st-open">▶ متاحة الآن</span>' : '<span class="st st-lock">🔒 مقفلة</span>';
        return '<li class="j-node ' + ss.status + '">' +
          '<span class="j-ic" aria-hidden="true">' + s.icon + '</span>' +
          '<div class="j-body"><h3>المرحلة ' + ar(i + 1) + ': ' + s.title + '</h3>' +
          '<p class="j-path">' + p.icon + ' مسارك: <b>' + p.label + '</b> — ' + p.desc + '</p>' + stat + '</div>' +
          (ss.status === 'open' ? '<button type="button" class="btn btn-primary" data-stage="' + i + '">' + (ss.skills ? 'تابع' : 'ابدأ') + ' ▶</button>' :
            ss.status === 'done' ? '<button type="button" class="btn btn-ghost" data-review="' + i + '">مراجعة 🔁</button>' : '') +
          '</li>';
      }).join('') + '</ol></div></section>';
  };
  screens.map.after = function () {
    app.querySelectorAll('[data-stage]').forEach(function (b) {
      b.addEventListener('click', function () { st.stageIdx = Number(b.dataset.stage); go('stage'); });
    });
    app.querySelectorAll('[data-review]').forEach(function (b) {
      b.addEventListener('click', function () {
        var s = Q.STAGES[Number(b.dataset.review)];
        st.stages[s.id] = { status: 'open', review: true };
        st.stageIdx = Number(b.dataset.review); go('stage');
      });
    });
  };

  /* ============ المحرك التكيفي داخل المرحلة ============ */
  function stageObj() { return Q.STAGES[st.stageIdx]; }
  function stageState() {
    var s = stageObj(), ss = st.stages[s.id];
    if (!ss.skills) {
      ss.skills = {};
      s.skills.forEach(function (k) {
        var lv = st.preLevel[k] || 'yellow', P = Q.PATHS[lv];
        ss.skills[k] = { path: lv, d: P.startD, used: [], indep: 0, needCheck: false, items: 0, done: false, supportedOnce: false };
      });
      ss.skillIdx = 0; ss.phase = 'intro'; ss.cur = null; ss.earned = 0;
    }
    return ss;
  }
  function curSkill(ss) { return stageObj().skills[ss.skillIdx]; }

  function pickItem(skill, sk) {
    var pool = Q.BANK.filter(function (b) { return b.skill === skill; });
    var fresh = pool.filter(function (b) { return sk.used.indexOf(b.id) === -1; });
    if (!fresh.length) { sk.used = []; fresh = pool; }
    // الأقرب إلى مستوى الصعوبة المطلوب
    fresh.sort(function (a, b) { return Math.abs(a.d - sk.d) - Math.abs(b.d - sk.d) || Math.random() - 0.5; });
    var best = fresh.filter(function (b) { return b.d === fresh[0].d; });
    return best[Math.floor(Math.random() * best.length)];
  }

  function newItem(ss) {
    var k = curSkill(ss), sk = ss.skills[k];
    var item = pickItem(k, sk);
    sk.used.push(item.id);
    var P = Q.PATHS[sk.path];
    var pre = (sk.items === 0 && P.preSupport) ? P.preSupport : 0;
    if (pre) st.metrics[k].scaffoldUse[pre]++;
    ss.cur = { id: item.id, level: pre, startLevel: pre, check: sk.needCheck, firstTry: true, solved: false, phase: 'q' };
    ss.phase = 'q';
  }

  screens.stage = function () {
    var ss = stageState(), s = stageObj();
    if (ss.phase === 'intro') return stageIntro(s, ss);
    return questionView(s, ss);
  };
  screens.stage.after = function () {
    var ss = stageState();
    if (ss.phase === 'intro') return stageIntroAfter();
    questionAfter(ss);
  };

  function stageIntro(s, ss) {
    var red = s.skills.filter(function (k) { return ss.skills[k].path === 'red'; });
    var pathHtml = s.skills.map(function (k) {
      var P = Q.PATHS[ss.skills[k].path];
      return '<li>' + Q.SKILLS[k].icon + ' <b>' + Q.SKILLS[k].name + '</b>: ' + P.icon + ' مسار ' + P.label + ' — ' + P.desc + '</li>';
    }).join('');
    var pre = red.length ? '<div class="scaffold pre"><p class="sc-title">🤝 دعم مسبق: صورة توضيحية قبل أن نبدأ</p>' +
      red.map(function (k) { var V = Q.SCAFFOLDS[k].visual; return '<figure>' + Q.scene(V.svg) + '<figcaption>' + V.caption + '</figcaption></figure>'; }).join('') + '</div>' : '';
    return '<section class="card stage-intro">' +
      '<p class="step-label">' + s.icon + ' المرحلة ' + ar(st.stageIdx + 1) + ' من ' + ar(Q.STAGES.length) + '</p>' +
      '<h1 tabindex="-1">' + s.title + '</h1>' +
      '<div class="story-scene is-anim">' + Q.scene(s.scene) + '</div>' +
      '<div class="story-talk">' + Q.dropMascot('happy') + '<div class="bubble"><p>' + esc(s.story) + '</p>' + speakBtn(s.story) + '</div></div>' +
      '<ul class="path-list">' + pathHtml + '</ul>' + pre +
      '<div class="center"><button type="button" class="btn btn-primary btn-xl" id="begin">لنبدأ! ▶</button></div></section>';
  }
  function stageIntroAfter() {
    app.querySelector('#begin').addEventListener('click', function () {
      var ss = stageState(); newItem(ss); save(); render();
    });
    if (st.settings.autoRead) Q.speak(stageObj().story);
  }

  function ladder(level, check) {
    var steps = '';
    for (var i = 1; i <= 5; i++) {
      var L = Q.SCAFFOLD_LEVELS[i];
      steps += '<li class="' + (i <= level ? 'on' : '') + '" title="' + L.name + '"><span aria-hidden="true">' + L.icon + '</span><span class="sr-only">' + L.name + '</span></li>';
    }
    var label = check ? '💪 تحقق بدون مساعدة (أُزيلت السقالة)' : level ? '🪜 مستوى المساعدة: ' + ar(level) + ' — ' + Q.SCAFFOLD_LEVELS[level].name : '💪 أنت تحل بمفردك';
    return '<div class="ladder" aria-label="' + label + '"><span class="ladder-l">' + label + '</span><ol>' + steps + '</ol></div>';
  }

  function scaffoldPanel(item, level) {
    if (!level) return '';
    var S = Q.SCAFFOLDS[item.skill], L = Q.SCAFFOLD_LEVELS[level], inner = '';
    if (level === 1) inner = '<p class="sc-hint">💬 ' + esc(item.hint || S.hint) + '</p>';
    if (level === 2) inner = '<p class="sc-hint">💬 ' + esc(item.hint || S.hint) + '</p><figure>' + Q.scene(S.visual.svg) + '<figcaption>' + S.visual.caption + '</figcaption></figure>';
    if (level === 3) inner = '<div class="worked"><p><b>مثال:</b> ' + esc(S.example.q) + '</p><ol>' +
      S.example.steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol><p class="worked-a">✅ ' + esc(S.example.answer) + '</p></div>';
    if (level === 4) inner = '<div class="anim-box is-anim" id="anim-box">' + Q.scene(S.anim.svg) +
      '<p class="anim-line" aria-live="polite">' + esc(S.anim.lines[0]) + '</p>' +
      '<div class="anim-ctrl"><button type="button" class="btn btn-soft btn-sm" id="anim-toggle" aria-pressed="false">⏸️ إيقاف الحركة</button>' +
      '<button type="button" class="btn btn-soft btn-sm" id="anim-replay">🔁 أعد الشرح</button></div></div>';
    if (level === 5) inner = '<div class="guided" id="guided"></div>';
    return '<section class="scaffold lv' + level + '" aria-label="سقالة: ' + L.name + '"><p class="sc-title">' + L.icon + ' ' + L.name + '</p>' + inner + '</section>';
  }

  function questionView(s, ss) {
    var cur = ss.cur, item = bankItem(cur.id), k = item.skill, sk = ss.skills[k];
    var diffDots = '<span class="diff" aria-label="مستوى الصعوبة ' + ar(item.d) + ' من ٣">' + [1, 2, 3].map(function (d) { return '<i class="' + (d <= item.d ? 'on' : '') + '"></i>'; }).join('') + '</span>';
    return '<section class="card task-card">' +
      '<header class="task-head"><p class="step-label">' + s.icon + ' ' + s.title + (s.skills.length > 1 ? ' • ' : ' ') + (s.skills.length > 1 ? '<span class="skill-tag">' + Q.SKILLS[k].icon + ' ' + Q.SKILLS[k].name + '</span> ' : '') + diffDots + '</p>' +
      ladder(cur.level, cur.check && cur.level === 0) + '</header>' +
      (cur.check && cur.level === 0 ? '<p class="fade-note">🌱 نجحت بمساعدة السقالة. الآن أزلنا المساعدة: جرّب سؤالًا مشابهًا بمفردك!</p>' : '') +
      '<div class="prompt-row"><h1 class="prompt" tabindex="-1">' + esc(item.prompt) + '</h1>' + speakBtn(item.prompt) +
      '<button type="button" class="icon-btn" id="reread" aria-label="أعد التعليمات">🔁</button></div>' +
      '<div id="task"></div>' +
      '<div id="scaffold">' + scaffoldPanel(item, cur.level) + '</div>' +
      '<div id="feedback" aria-live="polite"></div>' +
      '<footer class="task-foot"><button type="button" class="btn btn-ghost" id="need-help"' + (cur.level >= 5 ? ' disabled' : '') + '>🪜 أحتاج مساعدة</button>' +
      '<button type="button" class="btn btn-primary" id="check" disabled>تحقق ✔</button></footer></section>';
  }

  function questionAfter(ss) {
    var cur = ss.cur, item = bankItem(cur.id);
    var check = app.querySelector('#check');
    current = Q.tasks.render(item, app.querySelector('#task'), { onChange: function () { check.disabled = !current.ready() || guidedPending; } });
    var guidedPending = false;
    bindReread(item.prompt);
    mountScaffold(cur.level, function (pending) { guidedPending = pending; check.disabled = !current.ready() || guidedPending; });
    check.disabled = !current.ready() || guidedPending;
    if (st.settings.autoRead) Q.speak(item.prompt);

    check.addEventListener('click', function () {
      if (!current.ready()) return;
      var res = current.evaluate();
      current.mark(); current.lock();
      check.disabled = true;
      app.querySelector('#need-help').disabled = true;
      if (res.correct) onCorrect(ss, item); else onWrong(ss, item);
    });
    app.querySelector('#need-help').addEventListener('click', function () {
      // طلب مساعدة طوعي (UDL): نصعد درجة في السلم دون اعتباره خطأ
      if (cur.level >= 5) return;
      cur.level++; cur.firstTry = false; save();
      st.metrics[item.skill].scaffoldUse[cur.level]++;
      render();
    });
  }

  function mountScaffold(level, setPending) {
    var item = bankItem(stageState().cur.id);
    if (level === 4) {
      var S = Q.SCAFFOLDS[item.skill], box = app.querySelector('#anim-box'), line = box.querySelector('.anim-line'), i = 0, t;
      var run = function () { clearInterval(t); i = 0; line.textContent = S.anim.lines[0]; t = setInterval(function () { i++; if (i >= S.anim.lines.length) { clearInterval(t); return; } line.textContent = S.anim.lines[i]; }, 2600); };
      run();
      var tg = box.querySelector('#anim-toggle');
      tg.addEventListener('click', function () {
        var paused = box.classList.toggle('paused');
        tg.setAttribute('aria-pressed', String(paused));
        tg.textContent = paused ? '▶️ تشغيل الحركة' : '⏸️ إيقاف الحركة';
      });
      box.querySelector('#anim-replay').addEventListener('click', function () { run(); Q.speak(S.anim.lines.join(' ')); });
    }
    if (level === 5) {
      setPending(true);
      var el = app.querySelector('#guided');
      Q.guided(Q.SCAFFOLDS[item.skill].guided, el, function () {
        setPending(false);
        el.insertAdjacentHTML('beforeend', '<p class="g-done">👏 أحسنت! الآن عد إلى السؤال وأجب عنه.</p>');
      });
    }
  }

  function onCorrect(ss, item) {
    var cur = ss.cur, k = item.skill, sk = ss.skills[k], m = st.metrics[k];
    var supported = cur.level > 0;
    var stars = cur.level === 0 ? 3 : cur.level <= 2 ? 2 : 1;
    st.stars += stars; st.drops += 1;
    var gotPiece = st.pieces < Q.PUZZLE_PIECES;
    if (gotPiece) { st.pieces++; ss.earned = (ss.earned || 0) + 1; }
    sk.items++;
    if (supported) {
      m.supported.push(Math.max(0.5, 1 - 0.1 * cur.level));
      sk.needCheck = true; sk.supportedOnce = true;
      award('persist');
    } else {
      m.independent.push({ v: 1, after: sk.supportedOnce || cur.check });
      if (!sk.supportedOnce && cur.firstTry) m.supportedNotNeeded = true;
      sk.indep++; sk.needCheck = false;
      sk.d = Math.min(3, sk.d + 1);
      st.independentTotal++;
      if (st.independentTotal >= 3) award('scientist');
    }
    var P = Q.PATHS[sk.path];
    if ((!sk.needCheck && sk.indep >= P.need) || sk.items >= 6) sk.done = true;
    ss.phase = 'fb';
    save();

    var msg = supported
      ? '🪜 أحسنت! نجحت بمساعدة السقالة. سنُزيل المساعدة الآن ونتأكد أنك تستطيع وحدك.'
      : cur.check ? '💪 رائع! نجحت بمفردك بعد إزالة السقالة. لقد انتقل تعلّمك!' : '🌟 ممتاز! أجبت بمفردك. ' + (sk.d > item.d ? 'سأعطيك سؤالًا أكثر تحديًا ⚡' : '');
    var fb = app.querySelector('#feedback');
    fb.innerHTML = '<div class="fb fb-ok"><div class="fb-head">' + Q.dropMascot('happy') +
      '<div><p class="fb-title">إجابة صحيحة! ' + '⭐'.repeat(stars) + '</p><p>' + msg + '</p>' +
      (gotPiece ? '<p class="piece-got"><span class="piece-fly" aria-hidden="true">🧩</span> حصلت على قطعة بازل جديدة! (' + ar(st.pieces) + ' من ' + ar(Q.PUZZLE_PIECES) + ')</p>' : '') +
      '<p class="muted small">💡 ' + esc(item.explain) + '</p></div></div>' + factCard(nextFact()) +
      '<div class="fb-actions"><button type="button" class="btn btn-primary" id="next">التالي ⬅</button></div></div>';
    save();
    Q.celebrate && st.pieces === Q.PUZZLE_PIECES && gotPiece && Q.celebrate();
    var nx = fb.querySelector('#next'); nx.focus();
    nx.addEventListener('click', function () { advance(ss); });
  }

  function onWrong(ss, item) {
    var cur = ss.cur, k = item.skill, sk = ss.skills[k], m = st.metrics[k];
    if (cur.firstTry && cur.level === 0) m.independent.push({ v: 0, after: sk.supportedOnce || cur.check });
    cur.firstTry = false;
    var fb = app.querySelector('#feedback');
    if (cur.level < 5) {
      cur.level++;
      m.scaffoldUse[cur.level]++;
      save();
      var L = Q.SCAFFOLD_LEVELS[cur.level];
      fb.innerHTML = '<div class="fb fb-try"><div class="fb-head">' + Q.dropMascot('sad') +
        '<div><p class="fb-title">لنحاول معًا 🌱</p><p>لا بأس! الخطأ جزء من التعلم. جهّزت لك مساعدة: <b>' + L.icon + ' ' + L.name + '</b>، ثم أعد المحاولة.</p></div></div>' +
        '<div class="fb-actions"><button type="button" class="btn btn-primary" id="retry">أرني المساعدة وأعد المحاولة 🪜</button></div></div>';
      var r = fb.querySelector('#retry'); r.focus();
      r.addEventListener('click', function () { render(); });
    } else {
      // استُنفدت السقالات الخمس: نعرض الحل ونتعلم منه، ثم سؤال جديد مع تحقق لاحق
      current.reveal();
      m.supported.push(0);
      sk.items++; sk.needCheck = true; sk.supportedOnce = true;
      sk.d = Math.max(1, sk.d - 1);
      if (sk.items >= 6) sk.done = true;
      ss.phase = 'fb';
      save();
      fb.innerHTML = '<div class="fb fb-learn"><div class="fb-head">' + Q.dropMascot('happy') +
        '<div><p class="fb-title">لنتعلم من الإجابة الصحيحة 📖</p><p>' + esc(item.explain) + '</p>' +
        '<p class="muted small">سأعطيك سؤالًا مشابهًا لتجرّب من جديد. أنا متأكدة أنك تستطيع! 💪</p></div></div>' +
        '<div class="fb-actions"><button type="button" class="btn btn-primary" id="next">التالي ⬅</button></div></div>';
      var nx = fb.querySelector('#next'); nx.focus();
      nx.addEventListener('click', function () { advance(ss); });
    }
  }

  function advance(ss) {
    var s = stageObj();
    var k = curSkill(ss), sk = ss.skills[k];
    if (sk.done) {
      if (ss.skillIdx < s.skills.length - 1) { ss.skillIdx++; newItem(ss); save(); return render(); }
      return finishStage(ss);
    }
    newItem(ss); save(); render();
  }

  function finishStage(ss) {
    var s = stageObj();
    s.skills.forEach(function (k) {
      var sk = ss.skills[k];
      st.skillLevel[k] = (sk.indep > 0 && !sk.needCheck) ? 'green' : sk.indep > 0 || sk.supportedOnce ? 'yellow' : 'red';
    });
    ss.status = 'done'; ss.phase = 'done';
    var next = Q.STAGES[st.stageIdx + 1];
    if (next && (!st.stages[next.id] || st.stages[next.id].status === 'locked')) st.stages[next.id] = { status: 'open' };
    if (s.id === 's4') award('eco');
    st.screen = 'stageDone';
    save(); render();
  }

  screens.stageDone = function () {
    var s = stageObj(), ss = st.stages[s.id], last = st.stageIdx === Q.STAGES.length - 1;
    return '<section class="card narrow center stage-done">' + Q.dropMascot('happy') +
      '<h1 tabindex="-1">🎉 أكملت مرحلة ' + s.title + '!</h1>' +
      '<ul class="skill-list compact">' + s.skills.map(function (k) {
        return '<li class="skill-row"><span class="skill-ic" aria-hidden="true">' + Q.SKILLS[k].icon + '</span><span class="skill-n">' + Q.SKILLS[k].name + '</span>' +
          '<span class="was">قبل: ' + levelBadge(st.preLevel[k]) + '</span><span class="now">الآن: ' + levelBadge(st.skillLevel[k]) + '</span></li>';
      }).join('') + '</ul>' +
      '<div class="mini-puzzle">' + puzzleSVG(true) + '</div>' +
      '<p>🧩 قطع البازل: ' + ar(st.pieces) + ' من ' + ar(Q.PUZZLE_PIECES) + '</p>' +
      '<div class="center row-gap">' + (last ? '<button type="button" class="btn btn-primary btn-xl" id="finish">أكمل الرحلة 🏁</button>' :
        '<button type="button" class="btn btn-primary btn-xl" id="next-stage">المرحلة التالية ▶</button>') +
      '<button type="button" class="btn btn-ghost" id="to-map">🗺️ خريطتي</button></div></section>';
  };
  screens.stageDone.after = function () {
    var n = app.querySelector('#next-stage');
    if (n) n.addEventListener('click', function () { st.stageIdx++; go('stage'); });
    var f = app.querySelector('#finish');
    if (f) f.addEventListener('click', completeJourney);
    app.querySelector('#to-map').addEventListener('click', function () { go('map'); });
  };

  function completeJourney() {
    var allDone = Q.STAGES.every(function (s) { return st.stages[s.id] && st.stages[s.id].status === 'done'; });
    if (!allDone) { Q.toast('🗺️ ما زالت هناك مراحل لم تكتمل بعد'); return go('map'); }
    st.pieces = Q.PUZZLE_PIECES;
    st.completedAt = st.completedAt || new Date().toISOString();
    award('cycle');
    go('final');
  }

  /* ---------- البازل ---------- */
  function puzzleSVG(small) {
    var cols = 4, rows = 3, w = 100, h = 100, clips = '', pieces = '', holes = '';
    var id = 'pz' + Math.floor(Math.random() * 1e6);
    var order = [0, 4, 1, 5, 2, 6, 3, 7, 8, 9, 10, 11]; // ترتيب الظهور: السماء والتلال ثم الماء
    var earned = order.slice(0, st.pieces);
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var i = r * cols + c, x = c * w, y = r * h;
      clips += '<clipPath id="' + id + 'c' + i + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10"/></clipPath>';
      if (earned.indexOf(i) !== -1) {
        pieces += '<g clip-path="url(#' + id + 'c' + i + ')" class="pz-piece" style="animation-delay:' + (earned.indexOf(i) * 0.05) + 's"><use href="#' + id + 'art"/></g>' +
          '<rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="' + (w - 2) + '" height="' + (h - 2) + '" rx="10" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="2"/>';
      } else {
        holes += '<rect x="' + (x + 4) + '" y="' + (y + 4) + '" width="' + (w - 8) + '" height="' + (h - 8) + '" rx="10" fill="#efe4d0" stroke="#cdb894" stroke-width="2" stroke-dasharray="6 5"/>' +
          '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 8) + '" text-anchor="middle" font-size="24" fill="#b9a47e">🧩</text>';
      }
    }
    var complete = st.pieces >= Q.PUZZLE_PIECES;
    return '<svg class="puzzle-svg' + (small ? ' small' : '') + '" viewBox="0 0 400 300" role="img" aria-label="لوحة البازل الفلسطينية: ' + ar(st.pieces) + ' من ' + ar(Q.PUZZLE_PIECES) + ' قطعة">' +
      '<defs>' + clips + '<g id="' + id + 'art">' + Q.puzzleScene() + '</g></defs>' +
      '<rect width="400" height="300" rx="14" fill="#f6efe2"/>' + holes + pieces +
      (complete && !small ? '<g class="free-text"><rect x="95" y="112" width="210" height="62" rx="31" fill="rgba(255,255,255,.88)" stroke="#b1252e" stroke-width="2"/>' +
        '<text x="200" y="154" text-anchor="middle" font-size="30" font-weight="800" fill="#1d3b1a">فلسطين حرة 🇵🇸</text></g>' : '') +
      '</svg>';
  }

  screens.puzzle = function () {
    var complete = st.pieces >= Q.PUZZLE_PIECES;
    return '<section class="card narrow center">' +
      '<h1 tabindex="-1">🧩 لوحتي الفلسطينية</h1>' +
      '<p class="lead">كل إجابة صحيحة تضيف قطعة جديدة إلى اللوحة. ' + (complete ? 'اكتملت اللوحة! 🎉' : 'بقي ' + ar(Q.PUZZLE_PIECES - st.pieces) + ' قطعة.') + '</p>' +
      '<div class="puzzle-frame">' + puzzleSVG(false) + '</div>' +
      '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + Q.PUZZLE_PIECES + '" aria-valuenow="' + st.pieces + '"><span style="width:' + (st.pieces / Q.PUZZLE_PIECES * 100) + '%"></span></div>' +
      '<h2>🏅 أوسمتي</h2>' + badgesGrid() +
      '<p class="muted">🇵🇸 اكتشفت ' + ar(st.facts.length) + ' معلومة عن بلادنا.</p>' +
      '<button type="button" class="btn btn-primary" id="back">رجوع ⬅</button></section>';
  };
  screens.puzzle.after = function () { app.querySelector('#back').addEventListener('click', function () { go(backTarget()); }); };

  function badgesGrid() {
    return '<ul class="badges">' + Object.keys(Q.BADGES).map(function (id) {
      var b = Q.BADGES[id], has = st.badges.indexOf(id) !== -1;
      return '<li class="badge ' + (has ? 'has' : 'not') + '"><span class="b-ic" aria-hidden="true">' + (has ? b.icon : '🔒') + '</span><b>' + b.name + '</b><small>' + (has ? b.desc : 'لم تحصل عليه بعد: ' + b.desc) + '</small></li>';
    }).join('') + '</ul>';
  }
  function backTarget() {
    if (st.completedAt) return 'final';
    if (!st.diag.done) return st.diag.idx > 0 ? 'diag' : 'home';
    return 'map';
  }

  /* ---------- تقرير أثر السقالات ---------- */
  function skillReport(k) {
    var m = st.metrics[k];
    var pre = pct(m.pre);
    var during = m.supported.length ? pct(avg(m.supported)) : null;
    var afterArr = m.independent.filter(function (x) { return x.after; }).map(function (x) { return x.v; });
    if (!afterArr.length && !m.supported.length) afterArr = m.independent.map(function (x) { return x.v; });
    var after = afterArr.length ? pct(avg(afterArr)) : null;
    return { pre: pre, during: during, after: after, uses: m.scaffoldUse };
  }
  function bar(label, v, cls, note) {
    return '<div class="rbar"><span class="rbar-l">' + label + '</span><span class="rbar-track"><span class="rbar-fill ' + cls + '" style="width:' + (v == null ? 0 : Math.max(2, v)) + '%"></span></span>' +
      '<span class="rbar-v">' + (v == null ? (note || '—') : ar(v) + '٪') + '</span></div>';
  }
  screens.report = function () {
    var totalUses = [0, 0, 0, 0, 0, 0];
    var rows = Q.SKILL_ORDER.map(function (k) {
      var r = skillReport(k);
      r.uses.forEach(function (u, i) { totalUses[i] += u; });
      return '<article class="report-skill"><h3>' + Q.SKILLS[k].icon + ' ' + Q.SKILLS[k].name + ' ' + levelBadge(st.skillLevel[k]) + '</h3>' +
        bar('قبل التدخل', r.pre, 's1') +
        bar('بعد السقالات', r.during, 's2', r.pre != null && st.metrics[k].independent.length && !st.metrics[k].supported.length ? 'لم تحتج 💪' : 'لم يبدأ بعد') +
        bar('بعد إزالة السقالات', r.after, 's3', 'لم يُقَس بعد') + '</article>';
    }).join('');
    var maxUse = Math.max.apply(null, totalUses.slice(1).concat([1]));
    return '<section class="card report">' +
      '<h1 tabindex="-1">📈 تقريري: أثر السقالات على تعلمي</h1>' +
      '<p class="lead">كيف تغيّر مستواك في كل مهارة: قبل التدخل (التشخيص) ← أثناء الحل بالسقالات ← بعد إزالة السقالات والحل بمفردك.</p>' +
      '<div class="legend"><span><i class="sw s1"></i> قبل التدخل</span><span><i class="sw s2"></i> بعد السقالات</span><span><i class="sw s3"></i> بعد إزالة السقالات</span></div>' +
      (st.diag.done ? '<div class="report-grid">' + rows + '</div>' : '<p class="empty">🔎 أكمل التشخيص أولًا ليظهر تقريرك.</p>') +
      '<h2>🪜 السقالات التي استخدمتها</h2><div class="uses">' +
      [1, 2, 3, 4, 5].map(function (i) {
        var L = Q.SCAFFOLD_LEVELS[i];
        return '<div class="use-col"><span class="use-bar"><span style="height:' + (totalUses[i] / maxUse * 100) + '%"></span></span><b>' + ar(totalUses[i]) + '</b><small>' + L.icon + ' ' + L.name + '</small></div>';
      }).join('') + '</div>' +
      '<p class="muted small">💡 الهدف أن تقلّ حاجتك للمساعدة تدريجيًا: من «أحتاج مساعدة» إلى «أستطيع الحل بمفردي».</p>' +
      '<div class="center"><button type="button" class="btn btn-primary" id="back">رجوع ⬅</button></div></section>';
  };
  screens.report.after = function () { app.querySelector('#back').addEventListener('click', function () { go(backTarget()); }); };

  /* ---------- النهاية والشهادة ---------- */
  screens.final = function () {
    return '<section class="card final center">' +
      '<h1 tabindex="-1">🎉 لقد أكملت رحلة قطرة الماء!</h1>' +
      '<p class="lead">لقد تعلمت كيف تتحرك المياه في الطبيعة، واكتشفت بعضًا من جمال بلادنا.</p>' +
      '<div class="puzzle-frame final-frame">' + puzzleSVG(false) + '</div>' +
      '<div class="final-badge"><span aria-hidden="true">🏅</span><div><b>وسام مستكشف دورة المياه</b><small>حصلت عليه ' + esc(st.name) + ' لإكمال الرحلة كاملة</small></div></div>' +
      '<div class="stats"><span>⭐ ' + ar(st.stars) + ' نجمة</span><span>💧 ' + ar(st.drops) + ' قطرة</span><span>🏅 ' + ar(st.badges.length) + ' أوسمة</span><span>🇵🇸 ' + ar(st.facts.length) + ' معلومات</span></div>' +
      '<div class="center row-gap"><button type="button" class="btn btn-primary btn-xl" id="cert">🎓 شهادتي الرقمية</button>' +
      '<button type="button" class="btn btn-soft" id="rep">📈 تقريري</button><button type="button" class="btn btn-ghost" id="map">🗺️ خريطتي</button></div></section>';
  };
  screens.final.after = function () {
    Q.celebrate();
    app.querySelector('#cert').addEventListener('click', openCertificate);
    app.querySelector('#rep').addEventListener('click', function () { go('report'); });
    app.querySelector('#map').addEventListener('click', function () { go('map'); });
  };

  function openCertificate() {
    var d = new Date(st.completedAt || Date.now());
    var date = ar(d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear());
    var m = Q.modal.open({
      title: '🎓 شهادة إنجاز', cls: 'modal-cert',
      body: '<div class="certificate" id="certificate">' +
        '<div class="cert-in"><p class="cert-top">🇵🇸 رحلة قطرة ماء في فلسطين 💧</p>' +
        '<h3>شهادة إنجاز</h3><p>تُمنح هذه الشهادة للطالب/ة المتميز/ة</p>' +
        '<p class="cert-name">' + esc(st.name || 'صديق القطرة') + '</p>' +
        '<p>لإكماله/ا رحلة «دورة المياه في الطبيعة» بنجاح، واكتشاف مراحل التبخر والتكاثف والهطول والتجمع.</p>' +
        '<p class="cert-badge">🏅 وسام مستكشف دورة المياه</p>' +
        '<p class="cert-meta">⭐ ' + ar(st.stars) + ' نجمة • 🧩 ' + ar(Q.PUZZLE_PIECES) + ' قطعة • التاريخ: ' + date + '</p>' +
        '<p class="cert-free">فلسطين حرة 🇵🇸</p></div></div>',
      actions: '<button type="button" class="btn btn-primary" id="print">🖨️ طباعة / حفظ PDF</button>'
    });
    m.querySelector('#print').addEventListener('click', function () { document.body.classList.add('printing-cert'); window.print(); setTimeout(function () { document.body.classList.remove('printing-cert'); }, 500); });
  }

  /* ---------- الإعدادات (UDL) ---------- */
  function openSettings() {
    var s = st.settings;
    var m = Q.modal.open({
      title: '⚙️ إعدادات العرض والوصول',
      body: '<div class="settings">' +
        '<fieldset><legend>🔠 حجم الخط</legend><div class="seg">' +
        [[1, 'عادي'], [1.15, 'كبير'], [1.3, 'كبير جدًا']].map(function (f) { return '<button type="button" class="seg-b" data-font="' + f[0] + '" aria-pressed="' + (s.font === f[0]) + '">' + f[1] + '</button>'; }).join('') + '</div></fieldset>' +
        toggle('contrast', '🌓 تباين عالٍ', s.contrast) + toggle('motion', '🎞️ الحركة والمؤثرات', s.motion) +
        toggle('autoRead', '🔊 قراءة التعليمات تلقائيًا', s.autoRead) + toggle('digital', '⏱️ إظهار الوقت الرقمي تحت الساعة', s.digital) +
        '<p class="muted small">يمكنك دائمًا استخدام لوحة المفاتيح: Tab للتنقل، وEnter أو المسافة للاختيار.</p>' +
        '<button type="button" class="btn btn-danger btn-sm" id="reset-all">↺ حذف التقدم والبدء من جديد</button></div>'
    });
    function toggle(key, label, on) {
      return '<label class="switch"><input type="checkbox" data-key="' + key + '"' + (on ? ' checked' : '') + '><span class="sw-ui" aria-hidden="true"></span>' + label + '</label>';
    }
    m.querySelectorAll('[data-font]').forEach(function (b) {
      b.addEventListener('click', function () {
        s.font = Number(b.dataset.font); save(); applySettings();
        m.querySelectorAll('[data-font]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      });
    });
    m.querySelectorAll('[data-key]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        s[inp.dataset.key] = inp.checked; save(); applySettings();
        if (inp.dataset.key === 'digital' && st.screen === 'home') render();
      });
    });
    m.querySelector('#reset-all').addEventListener('click', confirmReset);
  }

  /* ============ التشغيل ============ */
  function bindReread(text) {
    var b = app.querySelector('#reread');
    if (!b) return;
    b.addEventListener('click', function () {
      var p = app.querySelector('.prompt');
      p.classList.remove('flash'); void p.offsetWidth; p.classList.add('flash');
      p.focus();
      Q.speak(text);
    });
  }

  function render() {
    var name = st.screen;
    if (!screens[name]) name = 'home';
    if ((name === 'map' || name === 'stage' || name === 'stageDone') && !st.diag.done) name = st.diag.idx > 0 ? 'diag' : 'home';
    if (name === 'final' && !st.completedAt) name = 'map';
    if ((name === 'stage' || name === 'stageDone') && !st.stages[Q.STAGES[st.stageIdx].id]) name = 'map';
    app.innerHTML = screens[name]();
    app.setAttribute('data-screen', name);
    document.querySelectorAll('[data-nav]').forEach(function (b) { b.classList.toggle('active', b.dataset.nav === name); });
    if (screens[name].after) screens[name].after();
    // نقل التركيز إلى عنوان الشاشة الجديدة (لقارئات الشاشة) — ليس في أول تحميل
    var h = app.querySelector('h1');
    if (h && render.count++) h.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: Q.motionOK() ? 'smooth' : 'auto' });
  }
  render.count = 0;

  document.addEventListener('click', function (e) {
    var sp = e.target.closest('[data-speak]');
    if (sp) Q.speak(sp.getAttribute('data-speak'));
    var nav = e.target.closest('[data-nav]');
    if (nav) {
      var t = nav.dataset.nav;
      if (t === 'settings') return openSettings();
      if (t === 'map' && !st.diag.done) { Q.toast('🔎 أكمل مهام التشخيص أولًا لتظهر خريطتك'); return; }
      go(t);
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    app = document.getElementById('app');
    applySettings();
    hud();
    render();
  });

  Q.app = { render: render, go: go, state: function () { return st; } };
})();
