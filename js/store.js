/* =========================================================
   حفظ تقدم الطالب محليًا (localStorage)
   ========================================================= */
(function () {
  var KEY = 'qatra-palestine.v1';

  function fresh() {
    var metrics = {};
    Q.SKILL_ORDER.forEach(function (k) {
      metrics[k] = { pre: null, supported: [], independent: [], scaffoldUse: [0, 0, 0, 0, 0, 0] };
    });
    return {
      v: 1,
      name: '',
      startedAt: null,
      screen: 'home',
      diag: { idx: 0, answers: {}, done: false },
      skillLevel: {},           // مستوى المهارة الحالي green|yellow|red
      preLevel: {},             // مستوى التشخيص القبلي
      stages: {},               // حالة كل مرحلة
      stageIdx: 0,              // المرحلة المفتوحة حاليًا
      metrics: metrics,
      stars: 0, drops: 0,
      pieces: 0,
      badges: [],
      facts: [],                // فهارس المعلومات التي ظهرت
      independentTotal: 0,
      completedAt: null,
      settings: { font: 1, contrast: false, motion: true, digital: true, autoRead: false }
    };
  }

  var state;
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var s = JSON.parse(raw);
        if (s && s.v === 1) {
          var base = fresh();
          // دمج آمن مع البنية الافتراضية
          Object.keys(base).forEach(function (k) { if (s[k] === undefined) s[k] = base[k]; });
          Object.keys(base.settings).forEach(function (k) { if (s.settings[k] === undefined) s.settings[k] = base.settings[k]; });
          Q.SKILL_ORDER.forEach(function (k) { if (!s.metrics[k]) s.metrics[k] = base.metrics[k]; });
          return s;
        }
      }
    } catch (e) { /* التخزين غير متاح: نكمل بحالة جديدة */ }
    return fresh();
  }
  state = load();

  Q.store = {
    get: function () { return state; },
    save: function () {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* تجاهل */ }
    },
    reset: function (keepSettings) {
      var settings = state.settings;
      state = fresh();
      if (keepSettings) state.settings = settings;
      Q.store.save();
      return state;
    },
    KEY: KEY
  };
})();
