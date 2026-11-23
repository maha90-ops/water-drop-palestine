/* =========================================================
   الرسوم التوضيحية (SVG) — مشاهد فلسطينية بأسلوب كرتوني ناعم
   كل مشهد دالة تُرجع نص SVG. الحركة تعمل فقط داخل .is-anim
   وتتوقف تلقائيًا عند تفعيل «إيقاف الحركة».
   ========================================================= */
(function () {
  var n = 0;
  function uid(p) { n += 1; return p + n; }

  function wrap(inner, label, defs) {
    return '<svg class="scene" viewBox="0 0 320 200" role="img" aria-label="' + label + '" xmlns="http://www.w3.org/2000/svg">' +
      '<defs>' + (defs || '') + '</defs>' + inner + '</svg>';
  }
  function skyDefs(id, top, bot) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + (top || '#9fd4f5') + '"/><stop offset="1" stop-color="' + (bot || '#e8f5fd') + '"/></linearGradient>';
  }
  function seaDefs(id) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fa9e0"/><stop offset="1" stop-color="#1f6fa8"/></linearGradient>';
  }
  function sun(x, y, r) {
    r = r || 22;
    var rays = '';
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4;
      rays += '<line x1="' + (x + Math.cos(a) * (r + 5)) + '" y1="' + (y + Math.sin(a) * (r + 5)) + '" x2="' + (x + Math.cos(a) * (r + 13)) + '" y2="' + (y + Math.sin(a) * (r + 13)) + '" />';
    }
    return '<g class="sun-g"><g class="spin" style="transform-origin:' + x + 'px ' + y + 'px" stroke="#f3b62b" stroke-width="4" stroke-linecap="round">' + rays + '</g>' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#ffd34d" stroke="#f0a91c" stroke-width="3"/>' +
      '<circle cx="' + (x - r * 0.35) + '" cy="' + (y - r * 0.35) + '" r="' + r * 0.28 + '" fill="#fff3b5" opacity=".8"/></g>';
  }
  function cloud(x, y, s, fill, cls) {
    s = s || 1; fill = fill || '#ffffff';
    return '<g class="' + (cls || '') + '" transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<ellipse cx="0" cy="8" rx="40" ry="14" fill="rgba(60,90,120,.15)"/>' +
      '<path d="M-38 6 a16 16 0 0 1 14-22 a22 22 0 0 1 40-6 a16 16 0 0 1 22 18 a10 10 0 0 1 0 18 h-68 a10 10 0 0 1 -8 -8z" fill="' + fill + '" stroke="#b9cfe0" stroke-width="2"/></g>';
  }
  function olive(x, y, s) {
    s = s || 1;
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<path d="M-3 0 q2 -14 -2 -24 M3 0 q-1 -12 4 -22" stroke="#6b4a2b" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="0" cy="-30" rx="20" ry="13" fill="#6f8d3a"/><ellipse cx="-10" cy="-36" rx="11" ry="8" fill="#86a64a"/>' +
      '<ellipse cx="9" cy="-37" rx="10" ry="7" fill="#7c9b42"/><circle cx="-6" cy="-28" r="2" fill="#2e2a3a"/><circle cx="7" cy="-30" r="2" fill="#2e2a3a"/></g>';
  }
  function house(x, y, s) {
    s = s || 1;
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<rect x="0" y="-26" width="36" height="26" rx="2" fill="#e8d3a6" stroke="#c4a873" stroke-width="2"/>' +
      '<path d="M-2 -26 q20 -16 40 0z" fill="#dcc391" stroke="#c4a873" stroke-width="2"/>' +
      '<path d="M14 0 v-12 a4 4 0 0 1 8 0 v12z" fill="#7a5a3a"/><rect x="4" y="-20" width="6" height="7" rx="3" fill="#5f7fa0"/><rect x="26" y="-20" width="6" height="7" rx="3" fill="#5f7fa0"/></g>';
  }
  function drop(x, y, s, cls) {
    s = s || 1;
    return '<path class="' + (cls || '') + '" transform="translate(' + x + ' ' + y + ') scale(' + s + ')" d="M0 -9 C4 -3 6 0 6 3 a6 6 0 0 1 -12 0 C-6 0 -4 -3 0 -9z" fill="#3c9ee0" stroke="#1f6fa8" stroke-width="1"/>';
  }
  function vapor(x, y, cls, delay) {
    return '<path class="' + (cls || 'rise') + '" style="animation-delay:' + (delay || 0) + 's" d="M' + x + ' ' + y + ' q-6 -8 0 -16 q6 -8 0 -16" stroke="#9cc8e6" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".9"/>';
  }
  function label(x, y, t, anchor) {
    return '<g class="lbl"><text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'middle') + '" paint-order="stroke" stroke="#fff" stroke-width="4" font-size="13" font-weight="700" fill="#2b2320">' + t + '</text></g>';
  }
  function hills(fill1, fill2) {
    return '<path d="M0 140 Q60 90 120 125 T240 115 T320 120 V200 H0z" fill="' + (fill1 || '#a9c27a') + '"/>' +
      '<path d="M0 160 Q80 125 170 150 T320 145 V200 H0z" fill="' + (fill2 || '#8daf5c') + '"/>';
  }
  function tatreezBand(y) {
    var s = '<g transform="translate(0 ' + y + ')"><rect width="320" height="10" fill="#f6efe2"/>';
    for (var i = 0; i < 32; i++) s += '<path d="M' + (i * 10 + 5) + ' 1 l4 4 l-4 4 l-4 -4z" fill="' + (i % 2 ? '#b1252e' : '#2f5a2a') + '"/>';
    return s + '</g>';
  }

  var S = {};

  S.sunSea = function () {
    var g = uid('sk'), s = uid('se');
    return wrap('<rect width="320" height="200" fill="url(#' + g + ')"/>' + sun(60, 45) +
      cloud(240, 40, .8) +
      '<rect y="120" width="320" height="80" fill="url(#' + s + ')"/>' +
      '<path class="wave" d="M0 125 q20 -8 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#bfe3fa" stroke-width="3" fill="none"/>' +
      vapor(120, 115, 'rise', 0) + vapor(170, 112, 'rise', .7) + vapor(220, 115, 'rise', 1.4) + vapor(270, 113, 'rise', .35) +
      label(200, 80, 'بخار ماء ⬆️') + label(80, 160, 'البحر المتوسط'),
      'الشمس تسخّن ماء البحر فيتصاعد بخار الماء', skyDefs(g) + seaDefs(s));
  };
  S.deadSea = function () {
    var g = uid('sk');
    return wrap('<rect width="320" height="200" fill="url(#' + g + ')"/>' + sun(260, 40, 24) +
      '<path d="M0 110 Q50 80 90 105 L110 125 H0z" fill="#d9b48a"/><path d="M320 100 Q270 78 230 104 L210 125 H320z" fill="#cfa77b"/>' +
      '<rect y="125" width="320" height="75" fill="#5bb3c9"/>' +
      '<g fill="#fff">' + [40, 90, 150, 210, 270].map(function (x) { return '<rect x="' + x + '" y="' + (128 + (x % 3) * 4) + '" width="18" height="6" rx="3" opacity=".9"/>'; }).join('') + '</g>' +
      vapor(120, 120, 'rise', 0) + vapor(180, 120, 'rise', .8) + vapor(240, 120, 'rise', .4) +
      label(160, 175, 'البحر الميت: ماء ← بخار، والملح 🧂 يبقى'),
      'البحر الميت يتبخر ماؤه ويبقى الملح', skyDefs(g, '#f7d58f', '#fff3d6'));
  };
  S.puddle = function () {
    var g = uid('sk');
    return wrap('<rect width="320" height="200" fill="url(#' + g + ')"/>' + sun(270, 40) +
      '<rect y="120" width="320" height="80" fill="#e4d3b0"/>' + house(30, 120, 1.5) +
      '<ellipse cx="170" cy="160" rx="60" ry="14" fill="#5aa9dd" stroke="#2f7fb5" stroke-width="2"/>' +
      vapor(150, 148, 'rise', 0) + vapor(185, 148, 'rise', .6) + label(170, 192, 'بركة ماء في ساحة المدرسة'),
      'بركة ماء في ساحة المدرسة تحت الشمس', skyDefs(g));
  };
  S.clothes = function () {
    var g = uid('sk');
    var shirt = function (x, c) { return '<path d="M' + x + ' 70 l-14 8 l6 10 l6 -3 v30 h24 v-30 l6 3 l6 -10 l-14 -8 q-10 6 -20 0z" fill="' + c + '" stroke="rgba(0,0,0,.2)" stroke-width="1.5"/>'; };
    return wrap('<rect width="320" height="200" fill="url(#' + g + ')"/>' + sun(270, 40) +
      '<rect y="150" width="320" height="50" fill="#dcc79c"/>' +
      '<line x1="40" y1="70" x2="250" y2="70" stroke="#6b4a2b" stroke-width="2"/><line x1="40" y1="70" x2="40" y2="150" stroke="#6b4a2b" stroke-width="5"/><line x1="250" y1="70" x2="250" y2="150" stroke="#6b4a2b" stroke-width="5"/>' +
      shirt(80, '#e86a6a') + shirt(140, '#6fb0e0') + shirt(200, '#f3d35d') +
      vapor(90, 66, 'rise', 0) + vapor(150, 66, 'rise', .5) + vapor(210, 66, 'rise', 1),
      'ملابس مبللة على حبل الغسيل تحت الشمس', skyDefs(g));
  };
  S.twoGlasses = function () {
    var g = uid('sk');
    var gl = function (x, lvl) { return '<path d="M' + x + ' 100 l6 70 h36 l6 -70z" fill="rgba(255,255,255,.6)" stroke="#7aa4c4" stroke-width="3"/><path d="M' + (x + 4) + ' ' + (100 + lvl) + ' l' + (2 + lvl * 0.06) + ' ' + (70 - lvl) + ' h36 l' + (2 + lvl * 0.06) + ' -' + (70 - lvl) + 'z" fill="#5aa9dd" opacity=".85"/>'; };
    return wrap('<rect width="320" height="200" fill="url(#' + g + ')"/>' + sun(70, 40) +
      '<rect x="170" y="0" width="150" height="200" fill="#5d7b4a" opacity=".35"/>' + olive(280, 180, 1.8) +
      '<rect y="170" width="320" height="30" fill="#d8c398"/>' + gl(60, 15) + gl(200, 15) +
      label(85, 92, 'في الشمس ☀️') + label(225, 92, 'في الظل 🌳'),
      'كأسان من الماء: واحدة في الشمس وأخرى في الظل', skyDefs(g));
  };
  S.plates = function () {
    var g = uid('sk');
    return wrap('<rect width="320" height="200" fill="url(#' + g + ')"/>' + sun(160, 40) +
      '<rect y="160" width="320" height="40" fill="#d8c398"/>' +
      '<ellipse cx="90" cy="150" rx="60" ry="12" fill="#fff" stroke="#9aa" stroke-width="2"/><ellipse cx="90" cy="148" rx="48" ry="7" fill="#5aa9dd"/>' +
      '<path d="M222 160 v-60 q0 -8 8 -12 v-18 h16 v18 q8 4 8 12 v60z" fill="rgba(255,255,255,.7)" stroke="#7aa4c4" stroke-width="3"/><rect x="225" y="120" width="26" height="38" fill="#5aa9dd" opacity=".85"/>' +
      label(90, 185, 'صحن واسع') + label(238, 185, 'زجاجة ضيقة'),
      'صحن واسع فيه ماء وزجاجة ضيقة فيها ماء', skyDefs(g));
  };
  S.glass = function () {
    return wrap('<rect width="320" height="200" fill="#fbf3e6"/><rect y="160" width="320" height="40" fill="#c9a77a"/>' +
      '<path d="M120 50 l10 110 h60 l10 -110z" fill="rgba(220,240,255,.8)" stroke="#7aa4c4" stroke-width="3"/>' +
      '<path d="M125 80 l8 78 h54 l8 -78z" fill="#8fd0f0"/><rect x="140" y="90" width="14" height="14" rx="3" fill="#e6f7ff" stroke="#a8d4ee"/>' +
      [[118, 90], [204, 100], [116, 125], [206, 135], [122, 150], [200, 70]].map(function (p, i) { return drop(p[0], p[1], .9, i % 2 ? 'bob' : ''); }).join('') +
      '<g opacity=".7">' + vapor(70, 120, 'drift', 0) + vapor(250, 120, 'drift', .6) + '</g>' +
      label(160, 30, 'كأس ماء بارد 🧊') + label(60, 150, 'بخار في الهواء'),
      'كأس ماء بارد تظهر على سطحها الخارجي قطرات ماء');
  };
  S.mirror = function () {
    return wrap('<rect width="320" height="200" fill="#e9f1f5"/>' +
      '<rect x="90" y="25" width="140" height="130" rx="20" fill="#cfe6f2" stroke="#8a6a45" stroke-width="8"/>' +
      '<rect x="100" y="35" width="120" height="110" rx="14" fill="#fff" opacity=".55"/>' +
      [[120, 60], [160, 80], [200, 55], [140, 110], [190, 120], [175, 100]].map(function (p) { return drop(p[0], p[1], .7); }).join('') +
      vapor(60, 170, 'rise', 0) + vapor(260, 170, 'rise', .7) + label(160, 185, 'بخار دافئ يلمس المرآة الباردة'),
      'مرآة ضبابية عليها قطرات بعد الاستحمام');
  };
  S.cloudForm = function () {
    var g = uid('sk'), s = uid('se');
    var dots = '';
    for (var i = 0; i < 14; i++) dots += '<circle class="gather" style="animation-delay:' + (i * 0.15) + 's" cx="' + (90 + (i * 37) % 150) + '" cy="' + (70 + (i * 23) % 50) + '" r="3" fill="#9cc8e6"/>';
    return wrap('<rect width="320" height="200" fill="url(#' + g + ')"/>' +
      '<rect y="0" width="320" height="60" fill="#c9e3f5" opacity=".6"/>' + label(285, 22, '🥶 بارد') +
      cloud(160, 45, 1.1, '#ffffff', 'grow') + dots +
      '<rect y="165" width="320" height="35" fill="url(#' + s + ')"/>' +
      vapor(80, 160, 'rise', 0) + vapor(160, 160, 'rise', .6) + vapor(240, 160, 'rise', 1.2) +
      label(70, 120, 'بخار يصعد ⬆️') + label(240, 100, 'قطرات صغيرة'),
      'بخار الماء يصعد ويبرد فيتحول إلى قطرات تكوّن غيمة', skyDefs(g) + seaDefs(s));
  };
  S.states = function () {
    return wrap('<rect width="320" height="200" fill="#fbf7f0"/>' +
      '<g transform="translate(60 100)"><circle r="40" fill="#e8f3fb" stroke="#9cc8e6" stroke-width="3"/>' + vapor(-10, 20, 'rise', 0) + vapor(10, 20, 'rise', .5) + '</g>' +
      '<g transform="translate(260 100)"><circle r="40" fill="#e1f0fa" stroke="#3c9ee0" stroke-width="3"/>' + drop(0, 4, 2.4) + '</g>' +
      '<path d="M110 100 h90" stroke="#b1252e" stroke-width="5" marker-end="url(#ah)"/>' +
      label(60, 165, 'غاز (بخار)') + label(260, 165, 'سائل (ماء)') + label(160, 85, 'يبرد 🥶'),
      'تحول بخار الماء إلى ماء سائل', '<marker id="ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#b1252e"/></marker>');
  };
  S.rain = function () {
    var g = uid('sk');
    var drops = '';
    for (var i = 0; i < 12; i++) drops += drop(90 + (i * 29) % 150, 95 + (i * 17) % 40, 1, 'fall d' + (i % 4));
    return wrap('<rect width="320" height="200" fill="url(#' + g + ')"/>' +
      cloud(160, 55, 1.5, '#e3eaf1') + drops + hills('#9cba6b', '#7fa152') + house(230, 170, 1) + house(255, 175, .8) + olive(70, 178, 1),
      'غيمة ثقيلة يسقط منها المطر على قرية فلسطينية', skyDefs(g, '#8aa7bf', '#d6e3ec'));
  };
  S.weatherIcons = S.rain;
  S.cloudsMixed = function () {
    var g = uid('sk');
    var drops = '';
    for (var i = 0; i < 8; i++) drops += drop(205 + (i * 19) % 70, 100 + (i * 13) % 40, .9, 'fall d' + (i % 4));
    return wrap('<rect width="320" height="200" fill="url(#' + g + ')"/>' + cloud(85, 60, 1, '#ffffff') + cloud(240, 60, 1.3, '#9fb0c0') + drops +
      hills() + label(85, 105, 'غيمة خفيفة') + label(240, 30, 'غيمة ثقيلة'),
      'غيمة بيضاء خفيفة وغيمة رمادية ثقيلة تمطر', skyDefs(g));
  };
  S.seasons = function () {
    var g = uid('sk'), g2 = uid('sk');
    var drops = '';
    for (var i = 0; i < 6; i++) drops += drop(30 + (i * 23) % 110, 90 + (i * 17) % 40, .9, 'fall d' + (i % 4));
    return wrap('<rect width="160" height="200" fill="url(#' + g + ')"/><rect x="160" width="160" height="200" fill="url(#' + g2 + ')"/>' +
      cloud(80, 55, 1, '#dfe6ee') + drops + sun(240, 60) + '<rect y="160" width="320" height="40" fill="#9cba6b"/><rect x="160" y="160" width="160" height="40" fill="#d9c38c"/>' +
      label(80, 185, 'الشتاء') + label(240, 185, 'الصيف'),
      'مقارنة بين الشتاء الماطر والصيف المشمس', skyDefs(g, '#8aa7bf', '#d6e3ec') + skyDefs(g2, '#86c9f2', '#fff1c4'));
  };
  S.snowHills = function () {
    var g = uid('sk');
    var flakes = '';
    for (var i = 0; i < 14; i++) flakes += '<text class="fall slow d' + (i % 4) + '" x="' + (20 + (i * 41) % 290) + '" y="' + (70 + (i * 19) % 60) + '" font-size="13" fill="#fff">❄</text>';
    return wrap('<rect width="320" height="200" fill="url(#' + g + ')"/>' + cloud(110, 45, 1.2, '#e9eef3') + cloud(240, 40, 1, '#e9eef3') + flakes +
      '<path d="M0 150 Q70 95 140 135 T320 120 V200 H0z" fill="#f5f8fb"/><path d="M0 175 Q90 145 180 165 T320 160 V200 H0z" fill="#e3ebf2"/>' + house(200, 160, 1.1),
      'ثلج يتساقط على جبال القدس', skyDefs(g, '#a9b8c6', '#e7edf2'));
  };
  S.landscape = function () {
    var g = uid('sk'), s = uid('se');
    return wrap('<rect width="320" height="200" fill="url(#' + g + ')"/>' + sun(276, 24, 16) + cloud(128, 32, .9) +
      '<path d="M110 160 L225 55 L320 150 V200 H110z" fill="#9b8a6c"/><path d="M200 78 L225 55 L250 80 q-12 6 -25 0 q-13 6 -25 0z" fill="#fff"/>' +
      '<path d="M120 170 Q200 120 320 165 V200 H120z" fill="#8daf5c"/>' + olive(250, 185, .9) + olive(190, 182, .8) +
      '<path d="M0 150 Q60 145 130 160 L150 200 H0z" fill="url(#' + s + ')"/>' +
      '<path class="flow" d="M222 70 Q200 120 150 160" stroke="#5aa9dd" stroke-width="4" fill="none" stroke-dasharray="8 8"/>',
      'منظر طبيعي: بحر وجبل وغيمة وشمس', skyDefs(g) + seaDefs(s));
  };
  S.valley = function () {
    var g = uid('sk');
    return wrap('<rect width="320" height="200" fill="url(#' + g + ')"/>' + cloud(245, 26, .9, '#e3eaf1') +
      '<path d="M0 60 L80 50 L160 168 L0 200z" fill="#a89573"/><path d="M320 80 L250 70 L160 168 L320 200z" fill="#b6a37f"/>' +
      '<path d="M0 200 L160 160 L320 200z" fill="#8daf5c"/>' +
      '<path class="flow" d="M70 60 Q100 110 150 165" stroke="#5aa9dd" stroke-width="4" fill="none" stroke-dasharray="8 8"/>' +
      '<path class="flow" d="M260 78 Q220 120 170 165" stroke="#5aa9dd" stroke-width="4" fill="none" stroke-dasharray="8 8"/>' +
      '<path d="M110 172 Q160 162 210 172" stroke="#3c9ee0" stroke-width="8" fill="none" stroke-linecap="round"/>' + olive(40, 150, .7) + olive(285, 160, .7),
      'جبلان بينهما وادٍ يجري فيه الماء', skyDefs(g, '#8aa7bf', '#d6e3ec'));
  };
  S.slope = function () {
    var g = uid('sk'), s = uid('se');
    var drops = '';
    for (var i = 0; i < 6; i++) drops += drop(40 + (i * 17) % 80, 40 + (i * 13) % 30, .8, 'fall d' + (i % 4));
    return wrap('<rect width="320" height="200" fill="url(#' + g + ')"/>' + cloud(80, 28, .9, '#e3eaf1') + drops +
      '<path d="M0 90 Q40 70 80 85 Q170 120 250 170 L320 175 V200 H0z" fill="#a9c27a"/>' +
      '<path d="M0 120 Q60 110 120 135 Q190 165 260 180 L320 182 V200 H0z" fill="#8daf5c"/>' +
      olive(60, 102, .8) + olive(130, 128, .8) + olive(190, 155, .7) +
      '<path class="flow" d="M40 95 Q140 120 255 172" stroke="#3c9ee0" stroke-width="5" fill="none" stroke-dasharray="10 8" stroke-linecap="round"/>' +
      '<path d="M240 178 Q285 172 320 178 V200 H230z" fill="url(#' + s + ')"/>' +
      label(70, 70, 'قمة الجبل') + label(280, 168, 'الوادي'),
      'ماء المطر يجري على سفح جبل مزروع بالزيتون نحو الوادي', skyDefs(g, '#8aa7bf', '#d6e3ec') + seaDefs(s));
  };
  S.hardGround = function () {
    var drops = '';
    for (var i = 0; i < 6; i++) drops += drop(40 + (i * 43) % 260, 30 + (i * 13) % 40, .8, 'fall d' + (i % 4));
    return wrap('<rect width="320" height="200" fill="#dce7ef"/>' + drops +
      '<rect y="120" width="160" height="80" fill="#6d6a66"/><rect x="160" y="120" width="160" height="80" fill="#8a6a45"/>' +
      '<path class="flow" d="M20 125 H150" stroke="#3c9ee0" stroke-width="5" stroke-dasharray="10 8" fill="none"/>' +
      '<g stroke="#3c9ee0" stroke-width="3" class="seep">' + [190, 230, 270].map(function (x) { return '<line x1="' + x + '" y1="125" x2="' + x + '" y2="160"/>'; }).join('') + '</g>' +
      label(80, 180, 'أرض صلبة: يجري الماء', 'middle') + label(240, 185, 'تربة: يتسرب الماء'),
      'مقارنة بين أرض صلبة يجري عليها الماء وتربة يتسرب فيها');
  };
  S.terraces = function () {
    var g = uid('sk');
    var t = '';
    for (var i = 0; i < 5; i++) {
      var y = 70 + i * 26, x = 40 + i * 50;
      t += '<path d="M' + x + ' ' + y + ' H320 V' + (y + 26) + ' H' + x + 'z" fill="' + (i % 2 ? '#a9c27a' : '#9cb86c') + '"/>' +
        '<rect x="' + x + '" y="' + (y - 4) + '" width="' + (320 - x) + '" height="6" fill="#d8c398" stroke="#b8a070"/>' + olive(x + 60, y + 2, .6) + olive(x + 150, y + 2, .6);
    }
    return wrap('<rect width="320" height="200" fill="url(#' + g + ')"/>' + sun(40, 34, 16) + t,
      'مدرّجات حجرية (سناسل) مزروعة بأشجار الزيتون على سفح الجبل', skyDefs(g));
  };
  S.soil = function () {
    var drops = '';
    for (var i = 0; i < 6; i++) drops += drop(50 + (i * 41) % 230, 20 + (i * 11) % 30, .8, 'fall d' + (i % 4));
    return wrap('<rect width="320" height="70" fill="#cfe3f0"/>' + drops +
      '<rect y="70" width="320" height="40" fill="#8a6a45"/><rect y="110" width="320" height="45" fill="#a98a62"/><rect y="155" width="320" height="45" fill="#4f9fd6" opacity=".85"/>' +
      '<g class="seep" stroke="#9fd2f3" stroke-width="3" stroke-dasharray="5 6">' + [70, 140, 210, 270].map(function (x) { return '<line x1="' + x + '" y1="72" x2="' + x + '" y2="152"/>'; }).join('') + '</g>' +
      olive(30, 72, .8) + label(160, 95, 'تربة') + label(160, 138, 'صخور') + label(160, 182, 'مياه جوفية 💧'),
      'ماء المطر يتسرب عبر التربة والصخور ويتجمع مياهًا جوفية');
  };
  S.lake = function () {
    var g = uid('sk');
    return wrap('<rect width="320" height="200" fill="url(#' + g + ')"/>' + sun(270, 36, 16) + hills('#9cba6b', '#86a85a') +
      '<ellipse cx="160" cy="165" rx="120" ry="26" fill="#4fa9e0" stroke="#2f7fb5" stroke-width="2"/>' + olive(40, 150, .8) + olive(285, 152, .8) +
      label(160, 170, 'بحيرة طبريا'),
      'بحيرة طبريا محاطة بالتلال', skyDefs(g));
  };
  S.cistern = function () {
    var drops = '';
    for (var i = 0; i < 6; i++) drops += drop(70 + (i * 29) % 150, 15 + (i * 11) % 25, .8, 'fall d' + (i % 4));
    return wrap('<rect width="320" height="120" fill="#d6e3ec"/>' + drops + '<rect y="120" width="320" height="80" fill="#a98a62"/>' +
      '<rect x="70" y="55" width="150" height="65" fill="#e8d3a6" stroke="#c4a873" stroke-width="3"/><path d="M62 55 h166" stroke="#c4a873" stroke-width="6"/>' +
      '<path d="M224 58 v80 h-20" stroke="#7a7a7a" stroke-width="5" fill="none"/>' +
      '<path d="M150 140 h100 v45 a10 10 0 0 1 -10 10 h-80 a10 10 0 0 1 -10 -10z" fill="#4f9fd6" stroke="#6d5a3d" stroke-width="4"/>' +
      '<path d="M128 120 v-30 a17 17 0 0 1 34 0 v30z" fill="#7a5a3a"/>' + label(200, 175, 'بئر ماء المطر'),
      'بيت فلسطيني قديم يجمع ماء المطر من السطح إلى بئر تحت الأرض');
  };
  S.spring = function () {
    var g = uid('sk');
    return wrap('<rect width="320" height="200" fill="url(#' + g + ')"/>' + hills('#9cba6b', '#86a85a') +
      '<path d="M120 120 q40 -30 80 0 v30 h-80z" fill="#cbb58a" stroke="#a38b5f" stroke-width="3"/><path d="M150 150 v-15 a10 10 0 0 1 20 0 v15z" fill="#4a3a2a"/>' +
      '<path class="flow" d="M160 150 Q170 175 230 185" stroke="#3c9ee0" stroke-width="6" fill="none" stroke-dasharray="10 8" stroke-linecap="round"/>' + olive(60, 160, .9) + olive(270, 165, .9) + label(160, 108, 'عين ماء'),
      'نبع ماء يخرج من بين الصخور', skyDefs(g));
  };
  S.cycle = function () {
    var g = uid('sk'), s = uid('se');
    return wrap('<rect width="320" height="200" fill="url(#' + g + ')"/>' + sun(40, 36, 16) + cloud(200, 40, 1.1) +
      '<path d="M140 140 L230 70 L320 140 V200 H140z" fill="#a9c27a"/>' + olive(255, 150, .8) +
      '<rect y="150" width="170" height="50" fill="url(#' + s + ')"/>' +
      '<path class="flow" d="M80 140 Q90 90 150 55" stroke="#e08a2e" stroke-width="4" fill="none" stroke-dasharray="7 7" marker-end="url(#am1)"/>' +
      '<path class="flow" d="M250 70 Q270 100 262 115" stroke="#3c9ee0" stroke-width="4" fill="none" stroke-dasharray="7 7" marker-end="url(#am2)"/>' +
      '<path class="flow" d="M235 130 Q190 160 150 168" stroke="#2f7fb5" stroke-width="4" fill="none" stroke-dasharray="7 7" marker-end="url(#am2)"/>' +
      [233, 248, 263].map(function (x, i) { return drop(x, 80 + i * 6, .7, 'fall d' + i); }).join('') +
      label(70, 100, '١ تبخر') + label(200, 18, '٢ تكاثف') + label(292, 98, '٣ هطول') + label(80, 185, '٤ تجمع'),
      'رسم دورة المياه: تبخر ثم تكاثف ثم هطول ثم تجمع',
      skyDefs(g) + seaDefs(s) +
      '<marker id="am1" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#e08a2e"/></marker>' +
      '<marker id="am2" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#2f7fb5"/></marker>');
  };

  Q.scene = function (name) { return (S[name] || S.cycle)(); };
  Q.tatreezBand = tatreezBand;

  /* ---------- قطرة الماء (الشخصية) ---------- */
  Q.dropMascot = function (mood) {
    var id = uid('dm');
    var mouth = mood === 'sad' ? '<path d="M44 78 q10 -7 20 0" stroke="#173b5c" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
      : mood === 'wow' ? '<ellipse cx="54" cy="78" rx="6" ry="7" fill="#173b5c"/>'
      : '<path d="M42 74 q12 12 24 0" stroke="#173b5c" stroke-width="3.5" fill="#e8576a" stroke-linecap="round"/>';
    var band = '';
    for (var i = 0; i < 7; i++) band += '<path d="M' + (24 + i * 10) + ' 40 l4 4 l-4 4 l-4 -4z" fill="' + (i % 2 ? '#2f5a2a' : '#b1252e') + '"/>';
    return '<svg class="mascot" viewBox="0 0 108 130" aria-hidden="true">' +
      '<defs><radialGradient id="' + id + '" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#bfe6ff"/><stop offset=".55" stop-color="#4fb0ec"/><stop offset="1" stop-color="#1f74b5"/></radialGradient></defs>' +
      '<ellipse cx="54" cy="124" rx="30" ry="5" fill="rgba(20,40,60,.18)"/>' +
      '<path d="M54 4 C70 30 96 52 96 80 a42 42 0 0 1 -84 0 C12 52 38 30 54 4z" fill="url(#' + id + ')" stroke="#1a5f94" stroke-width="2.5"/>' +
      '<rect x="18" y="36" width="72" height="16" rx="8" fill="#f6efe2" stroke="#d9c7a8"/>' + band +
      '<ellipse cx="38" cy="22" rx="6" ry="10" fill="#fff" opacity=".55" transform="rotate(30 38 22)"/>' +
      '<g class="blink"><ellipse cx="40" cy="64" rx="6" ry="7.5" fill="#173b5c"/><ellipse cx="68" cy="64" rx="6" ry="7.5" fill="#173b5c"/>' +
      '<circle cx="42" cy="61" r="2.2" fill="#fff"/><circle cx="70" cy="61" r="2.2" fill="#fff"/></g>' +
      '<ellipse cx="28" cy="76" rx="6" ry="4" fill="#ff9fb0" opacity=".7"/><ellipse cx="80" cy="76" rx="6" ry="4" fill="#ff9fb0" opacity=".7"/>' +
      mouth + '</svg>';
  };

  /* ---------- لوحة البازل الفلسطينية ---------- */
  Q.puzzleScene = function () {
    var g = uid('pz'), s = uid('ps'), f = '';
    return '<defs>' + skyDefs(g, '#7fc4ee', '#fdf0d8') + seaDefs(s) + '</defs>' +
      '<rect width="400" height="300" fill="url(#' + g + ')"/>' + sun(330, 60, 26) +
      cloud(90, 60, 1.1) + cloud(210, 45, .9) +
      [100, 112, 124].map(function (x, i) { return drop(x, 95 + i * 10, .8); }).join('') +
      '<path d="M0 170 Q70 110 150 150 T300 135 T400 140 V300 H0z" fill="#a9c27a"/>' +
      /* القدس على التلة */
      '<g transform="translate(250 128)"><rect x="-30" y="0" width="60" height="22" fill="#e8d3a6" stroke="#c4a873"/><rect x="-16" y="-8" width="32" height="10" fill="#3a6fb5"/>' +
      '<path d="M-14 -8 a14 14 0 0 1 28 0z" fill="#f0c33c" stroke="#c99a1f"/><line x1="0" y1="-22" x2="0" y2="-28" stroke="#c99a1f" stroke-width="2"/></g>' +
      '<path d="M0 205 Q90 160 200 195 T400 185 V300 H0z" fill="#8daf5c"/>' +
      olive(60, 205, 1.3) + olive(150, 200, 1.1) + olive(330, 200, 1.2) + house(190, 205, 1.1) + house(232, 210, .9) +
      /* علم صغير على البيت */
      '<g transform="translate(205 168)"><line x1="0" y1="0" x2="0" y2="-28" stroke="#5b4630" stroke-width="2"/>' +
      '<rect x="0" y="-28" width="24" height="5" fill="#111"/><rect x="0" y="-23" width="24" height="5" fill="#fff"/><rect x="0" y="-18" width="24" height="5" fill="#149954"/><path d="M0 -28 L9 -20.5 L0 -13z" fill="#e4312b"/></g>' +
      '<path d="M0 240 Q100 228 200 242 T400 238 V300 H0z" fill="url(#' + s + ')"/>' +
      '<path class="wave" d="M0 255 q25 -8 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0" stroke="#bfe3fa" stroke-width="3" fill="none"/>' +
      '<g transform="translate(40 268) scale(.9)">' + Q.dropMascot('happy').replace('<svg class="mascot" viewBox="0 0 108 130" aria-hidden="true">', '<svg width="34" height="41" viewBox="0 0 108 130" y="-30">') + '</g>' +
      '<g transform="translate(40 290)">' + tatreezBand(0).replace('<g transform="translate(0 0)">', '<g transform="translate(-40 0) scale(1.25 1)">') + '</g>';
  };
})();
