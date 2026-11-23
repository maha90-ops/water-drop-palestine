/* =========================================================
   🕰️ الساعة الفلسطينية التفاعلية — وقت حقيقي من جهاز المستخدم
   - تُحسب الزوايا من new Date() في كل نبضة (لا وقت وهمي)
   - تتزامن النبضة مع بداية كل ثانية (setTimeout حتى الثانية التالية)
   - زوايا تراكمية حتى لا تدور العقارب للخلف عند ٥٩ ← ٠٠
   - عقرب الساعات يتحرك تدريجيًا مع الدقائق والثواني
   ========================================================= */
(function () {
  var PIVOT = { x: 52.3, y: 47.1 }; // مركز محور العقارب في صورة الساعة (٪)

  function leaf(x, y, len, rot, flip) {
    var w = len * 0.42;
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + (flip ? -1 : 1) + ' 1)">' +
      '<path d="M0 0 C' + len * 0.3 + ' ' + -w + ' ' + len * 0.8 + ' ' + -w + ' ' + len + ' 0 C' + len * 0.75 + ' ' + w * 0.75 + ' ' + len * 0.3 + ' ' + w * 0.75 + ' 0 0Z" fill="url(#lf)" stroke="#24350f" stroke-width="1.4"/>' +
      '<path d="M2 0 L' + len * 0.85 + ' 0" stroke="#a7c46a" stroke-width="1.1" opacity=".8"/></g>';
  }
  var DEFS = '<defs><linearGradient id="lf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7e9f3e"/><stop offset="1" stop-color="#34501a"/></linearGradient>' +
    '<linearGradient id="stem" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1c1613"/><stop offset=".5" stop-color="#4a3a2e"/><stop offset="1" stop-color="#1c1613"/></linearGradient></defs>';

  function hourHand() {
    return '<svg viewBox="0 0 70 280" aria-hidden="true">' + DEFS +
      '<path d="M27 274 Q35 282 43 274 L42 240 L39.5 60 L35 8 L30.5 60 L28 240Z" fill="url(#stem)" stroke="#f6efe2" stroke-width="1.6" paint-order="stroke"/>' +
      leaf(37, 78, 32, -52) + leaf(33, 112, 32, -128) + leaf(37, 150, 30, -50) + leaf(33, 186, 28, -130) +
      leaf(35, 34, 30, -90) + '</svg>';
  }
  function minuteHand() {
    return '<svg viewBox="0 0 60 390" aria-hidden="true">' + DEFS +
      '<path d="M24 382 Q30 390 36 382 L35.5 340 L33 70 L30 8 L27 70 L24.5 340Z" fill="url(#stem)" stroke="#f6efe2" stroke-width="1.6" paint-order="stroke"/>' +
      leaf(32, 70, 26, -55) + leaf(28, 104, 26, -125) + leaf(32, 138, 24, -52) + leaf(28, 170, 22, -128) + leaf(30, 34, 26, -90) + '</svg>';
  }
  function secondHand() {
    return '<svg viewBox="0 0 30 470" aria-hidden="true">' +
      '<path d="M14 460 L16 460 L16.2 380 L15.6 20 L14.4 20 L13.8 380Z" fill="#b1252e"/>' +
      '<ellipse cx="15" cy="448" rx="6.5" ry="10" fill="#2b2433" stroke="#120f16" stroke-width="1"/><ellipse cx="13" cy="444" rx="2" ry="3" fill="#7d7690"/>' +
      '<path d="M15 24 C9 14 10 6 15 0 C20 6 21 14 15 24Z" fill="#6f8d3a" stroke="#2f4419" stroke-width="1"/>' +
      '<circle cx="15" cy="380" r="5" fill="#b1252e"/></svg>';
  }
  function hub() {
    var stitches = '';
    for (var i = 0; i < 16; i++) {
      var a = i * Math.PI / 8, x = 50 + Math.cos(a) * 40, y = 50 + Math.sin(a) * 40;
      stitches += '<path d="M' + (x - 3) + ' ' + (y - 3) + 'l6 6M' + (x + 3) + ' ' + (y - 3) + 'l-6 6" stroke="' + (i % 2 ? '#2f5a2a' : '#b1252e') + '" stroke-width="2.2" stroke-linecap="round"/>';
    }
    var star = '';
    for (var k = 0; k < 8; k++) star += '<path transform="rotate(' + k * 45 + ' 50 50)" d="M50 50 L46 30 L50 20 L54 30Z" fill="' + (k % 2 ? '#2f5a2a' : '#b1252e') + '"/>';
    return '<svg viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="gold" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff2b8"/><stop offset=".45" stop-color="#e2b33e"/><stop offset="1" stop-color="#8a6516"/></radialGradient>' +
      '<radialGradient id="linen" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#f7efe1"/><stop offset="1" stop-color="#e6d8bf"/></radialGradient></defs>' +
      '<circle cx="50" cy="50" r="48" fill="url(#linen)" stroke="#c9b48e" stroke-width="2"/>' + stitches + star +
      '<circle cx="50" cy="50" r="15" fill="url(#gold)" stroke="#6b4e12" stroke-width="1.5"/><circle cx="45" cy="45" r="4" fill="#fff8d8" opacity=".85"/></svg>';
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function phaseOf(h) {
    if (h >= 6 && h < 12) return 'morning';
    if (h >= 12 && h < 18) return 'day';
    if (h >= 18 && h < 21) return 'sunset';
    return 'night';
  }
  var PHASE_TEXT = {
    morning: '🌅 صباح الخير من فلسطين',
    day: '☀️ نهار مشمس في بلادنا',
    sunset: '🌇 وقت الغروب على التلال',
    night: '🌙 ليلة هادئة تحت النجوم'
  };

  var mounted = null, timer = null;
  var cum = { h: null, m: null, s: null };

  function unwrap(prev, target) {
    if (prev === null) return target;
    var cur = ((prev % 360) + 360) % 360;
    var delta = ((target - cur + 540) % 360) - 180;
    return prev + delta;
  }

  function render(instant) {
    if (!mounted || !document.body.contains(mounted.root)) { mounted = null; return; }
    var now = new Date();
    var h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    var sA = s * 6;
    var mA = (m + s / 60) * 6;
    var hA = ((h % 12) + m / 60 + s / 3600) * 30;
    cum.s = unwrap(cum.s, sA); cum.m = unwrap(cum.m, mA); cum.h = unwrap(cum.h, hA);

    var r = mounted.root;
    if (instant) r.classList.add('no-trans');
    mounted.hs.style.transform = 'rotate(' + cum.h + 'deg)';
    mounted.ms.style.transform = 'rotate(' + cum.m + 'deg)';
    mounted.ss.style.transform = 'rotate(' + cum.s + 'deg)';
    if (instant) { void r.offsetWidth; r.classList.remove('no-trans'); }

    var h12 = h % 12 === 0 ? 12 : h % 12;
    var period = h < 12 ? 'صباحًا' : 'مساءً';
    var txt = Q.toAr(pad(h12) + ':' + pad(m) + ':' + pad(s));
    mounted.digital.textContent = txt;
    mounted.period.textContent = period;
    mounted.tipTime.textContent = Q.toAr(pad(h12) + ':' + pad(m)) + ' ' + period;
    mounted.root.setAttribute('data-time', now.toISOString());

    var minuteKey = h + ':' + m;
    if (mounted.lastMinute !== minuteKey) {
      mounted.lastMinute = minuteKey;
      mounted.btn.setAttribute('aria-label', 'ساعة فلسطينية مطرزة. الوقت الآن ' + Q.toAr(h12 + ':' + pad(m)) + ' ' + period + '. اضغط لفتح بوابة من بلادنا');
      var ph = phaseOf(h);
      mounted.stage.setAttribute('data-phase', ph);
      mounted.phaseText.textContent = PHASE_TEXT[ph];
    }
  }

  function loop() {
    render(false);
    var ms = new Date().getMilliseconds();
    timer = setTimeout(loop, 1000 - ms + 8); // نبضة متزامنة مع بداية كل ثانية
  }

  Q.clock = {
    markup: function () {
      return '<div class="clock-stage" data-phase="day">' +
        '<div class="sky" aria-hidden="true"><span class="sky-sun"></span><span class="sky-moon"></span>' +
        '<span class="stars"></span><span class="cl c1"></span><span class="cl c2"></span>' +
        '<svg class="hills-bg" viewBox="0 0 400 80" preserveAspectRatio="none"><path d="M0 60 Q60 20 130 45 T260 35 T400 40 V80 H0z"/><path class="h2" d="M0 70 Q90 45 200 62 T400 58 V80 H0z"/></svg></div>' +
        '<p class="phase-chip" aria-live="off"></p>' +
        '<div class="clock-wrap">' +
        '<button type="button" class="clock" id="pal-clock" aria-haspopup="dialog">' +
        '<img src="assets/clock-face.webp" alt="" width="840" height="840" draggable="false">' +
        '<span class="hand-pivot" style="left:' + PIVOT.x + '%;top:' + PIVOT.y + '%">' +
        '<span class="hand hour">' + hourHand() + '</span>' +
        '<span class="hand minute">' + minuteHand() + '</span>' +
        '<span class="hand second">' + secondHand() + '</span>' +
        '<span class="hub">' + hub() + '</span></span>' +
        '<span class="clock-tip" role="tooltip">الوقت الآن<br><b class="tip-time"></b></span>' +
        '</button></div>' +
        '<div class="digital-row"><p class="digital" aria-hidden="true"><span class="digital-time">--:--:--</span> <small class="digital-period"></small></p>' +
        '<button type="button" class="chip-btn" id="toggle-digital" aria-pressed="true">⏱️ الوقت الرقمي</button></div>' +
        '</div>';
    },
    mount: function (container, onClick) {
      var stage = container.querySelector('.clock-stage');
      var pivot = stage.querySelector('.hand-pivot');
      mounted = {
        root: pivot, stage: stage,
        btn: stage.querySelector('.clock'),
        hs: pivot.querySelector('.hour'), ms: pivot.querySelector('.minute'), ss: pivot.querySelector('.second'),
        digital: stage.querySelector('.digital-time'), period: stage.querySelector('.digital-period'),
        tipTime: stage.querySelector('.tip-time'), phaseText: stage.querySelector('.phase-chip'),
        lastMinute: null
      };
      cum = { h: null, m: null, s: null };
      mounted.btn.addEventListener('click', onClick);
      var st = Q.store.get();
      var dBtn = stage.querySelector('#toggle-digital');
      var applyDigital = function () {
        stage.classList.toggle('hide-digital', !st.settings.digital);
        dBtn.setAttribute('aria-pressed', String(!!st.settings.digital));
        dBtn.textContent = st.settings.digital ? '⏱️ إخفاء الوقت الرقمي' : '⏱️ إظهار الوقت الرقمي';
      };
      dBtn.addEventListener('click', function () { st.settings.digital = !st.settings.digital; Q.store.save(); applyDigital(); });
      applyDigital();
      render(true);
      if (!timer) loop();
    },
    phaseOf: phaseOf
  };

  // عند العودة إلى التبويب: قفزة فورية إلى الوقت الصحيح دون دوران طويل
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && mounted) render(true);
  });
})();
