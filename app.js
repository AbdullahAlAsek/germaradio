// Germalingo Radio: a Bengali village that lives with the real daylight, and a radio that plays our own music in random order.
(function () {
'use strict';
var $ = function (id) { return document.getElementById(id); };
var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function sm(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
function rnd(a, b) { return a + Math.random() * (b - a); }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function fmt(s) { if (!isFinite(s) || s < 0) return '0:00'; s = Math.floor(s); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
var LS = { get: function (k, d) { try { var v = localStorage.getItem('gr_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set: function (k, v) { try { localStorage.setItem('gr_' + k, JSON.stringify(v)); } catch (e) {} } };

// ---------- texts ----------
var TX = {
  de: { air: 'On Air', paused: 'Pausiert', ready: 'Bereit', talk: 'Durchsage', tagline: 'Bansuri, Dotara und Tabla. Rund um die Uhr.', tune: 'Tippe auf Play und lass das Dorf klingen.',
    list: 'Titel', car: 'Germalingo Radio auch im Autoradio', err: 'Dieser Titel lässt sich gerade nicht laden.', errPl: 'Die Titelliste lässt sich nicht laden.',
    about: 'Über das Radio', contact: 'Kontakt', live: 'Jetzt', preview: 'Vorschau', dialNote: 'Ziehe über den Tag, um ihn vorzuspulen.', place: 'Tageslicht wie in {z}', rise: 'Aufgang', set: 'Untergang',
    aboutP: ['Germalingo Radio spielt Musik von Germalingo, rund um die Uhr und in zufälliger Reihenfolge. Jeden Titel kannst du auch direkt in der Liste wählen.',
      'Die ersten Stücke sind Instrumentalmusik für Bansuri-Flöte, Dotara, Ektara, Tabla, Khol und Dhol. Sie wurden eigens für diesen Sender komponiert und am Computer erzeugt, nach Ragas und Volksweisen aus Bengalen.',
      'Das Dorf im Hintergrund lebt mit dem echten Tageslicht. Morgendämmerung, Mittag, Abendrot und Nacht kommen zur gleichen Zeit wie bei dir draußen; Sonnenaufgang und Sonnenuntergang werden aus deiner Zeitzone berechnet. Auch die Vögel wechseln mit der Tageszeit: Reiher und Singvögel am Morgen, kreisende Milane am Mittag, heimkehrende Schwärme am Abend, Fledermäuse, Eulen und Glühwürmchen in der Nacht.',
      'Zwischendurch gibt es kurze Durchsagen. Das Radio läuft auch im Spiel GermaDrive.'],
    contactP: 'Fragen, Wünsche oder Ideen für den Sender? Wir freuen uns über jede Nachricht.' },
  en: { air: 'On Air', paused: 'Paused', ready: 'Ready', talk: 'Announcement', tagline: 'Bansuri, dotara and tabla. Around the clock.', tune: 'Tap play and let the village sing.',
    list: 'Tracks', car: 'Germalingo Radio on the car radio too', err: 'This track cannot be loaded right now.', errPl: 'The track list cannot be loaded.',
    about: 'About the radio', contact: 'Contact', live: 'Now', preview: 'Preview', dialNote: 'Drag across the day to fast-forward it.', place: 'Daylight as in {z}', rise: 'Sunrise', set: 'Sunset',
    aboutP: ['Germalingo Radio plays music by Germalingo, around the clock and in random order. You can also pick any track straight from the list.',
      'The first pieces are instrumentals for bansuri flute, dotara, ektara, tabla, khol and dhol. They were composed for this station and made on the computer, based on ragas and folk tunes from Bengal.',
      'The village in the background lives with the real daylight. Dawn, midday, sunset and night arrive at the same time as outside your window; sunrise and sunset are worked out from your time zone. The birds change with the hour too: egrets and songbirds in the morning, circling kites at midday, flocks flying home in the evening, bats, owls and fireflies at night.',
      'Short announcements play in between. The radio also plays in the game GermaDrive.'],
    contactP: 'Questions, wishes or ideas for the station? We are happy to hear from you.' }
};
var PH = {
  night: { bn: 'রাত', de: 'Nacht', en: 'Night', acc: ['#c3cffc', '#e6ecff'], shade: 0.42 },
  dawn: { bn: 'ভোর', de: 'Morgendämmerung', en: 'Dawn', acc: ['#ffb4a1', '#ffe0d6'], shade: 0.46 },
  morning: { bn: 'সকাল', de: 'Morgen', en: 'Morning', acc: ['#ffcf6e', '#fff0c4'], shade: 0.62 },
  noon: { bn: 'দুপুর', de: 'Mittag', en: 'Midday', acc: ['#ffd65e', '#fff2b8'], shade: 0.7 },
  afternoon: { bn: 'বিকেল', de: 'Nachmittag', en: 'Afternoon', acc: ['#ffbb4d', '#ffe6b0'], shade: 0.64 },
  golden: { bn: 'গোধূলি', de: 'Abendrot', en: 'Golden hour', acc: ['#ffa94d', '#ffdcaa'], shade: 0.5 },
  evening: { bn: 'সন্ধ্যা', de: 'Abend', en: 'Evening', acc: ['#f0a3d0', '#ffd9ef'], shade: 0.44 }
};
var lang = LS.get('lang', (navigator.language || 'de').slice(0, 2) === 'de' ? 'de' : 'en');
function t(k) { return TX[lang][k]; }
function la(x) { if (!x) return ''; if (typeof x === 'string') return x; return x[lang] || x.en || x.de || x.bn || ''; }

// ---------- where the viewer is (from the time zone only, no location request) ----------
var ZONES = { 'Europe/Berlin': [52.52, 13.4], 'Europe/Vienna': [48.2, 16.37], 'Europe/Zurich': [47.37, 8.54], 'Europe/London': [51.5, -0.13], 'Europe/Paris': [48.86, 2.35], 'Europe/Amsterdam': [52.37, 4.9], 'Europe/Brussels': [50.85, 4.35], 'Europe/Luxembourg': [49.61, 6.13], 'Europe/Rome': [41.9, 12.5], 'Europe/Madrid': [40.4, -3.7], 'Europe/Lisbon': [38.7, -9.14], 'Europe/Warsaw': [52.23, 21.0], 'Europe/Prague': [50.08, 14.44], 'Europe/Stockholm': [59.33, 18.07], 'Europe/Oslo': [59.91, 10.75], 'Europe/Copenhagen': [55.68, 12.57], 'Europe/Helsinki': [60.17, 24.94], 'Europe/Athens': [37.98, 23.73], 'Europe/Istanbul': [41.01, 28.98], 'Europe/Moscow': [55.75, 37.62], 'Europe/Dublin': [53.35, -6.26], 'Europe/Budapest': [47.5, 19.04], 'Europe/Bucharest': [44.43, 26.1], 'Europe/Kiev': [50.45, 30.52], 'Europe/Kyiv': [50.45, 30.52],
  'Asia/Dhaka': [23.81, 90.41], 'Asia/Kolkata': [22.57, 88.36], 'Asia/Calcutta': [22.57, 88.36], 'Asia/Karachi': [24.86, 67.0], 'Asia/Kathmandu': [27.7, 85.32], 'Asia/Colombo': [6.93, 79.86], 'Asia/Dubai': [25.2, 55.27], 'Asia/Riyadh': [24.71, 46.68], 'Asia/Qatar': [25.29, 51.53], 'Asia/Kuwait': [29.38, 47.99], 'Asia/Singapore': [1.35, 103.82], 'Asia/Kuala_Lumpur': [3.14, 101.69], 'Asia/Bangkok': [13.75, 100.5], 'Asia/Jakarta': [-6.2, 106.85], 'Asia/Shanghai': [31.23, 121.47], 'Asia/Hong_Kong': [22.3, 114.17], 'Asia/Tokyo': [35.68, 139.69], 'Asia/Seoul': [37.57, 126.98],
  'Australia/Sydney': [-33.87, 151.21], 'Australia/Melbourne': [-37.81, 144.96], 'America/New_York': [40.71, -74.0], 'America/Toronto': [43.65, -79.38], 'America/Chicago': [41.88, -87.63], 'America/Denver': [39.74, -104.99], 'America/Los_Angeles': [34.05, -118.24], 'America/Sao_Paulo': [-23.55, -46.63], 'America/Mexico_City': [19.43, -99.13],
  'Africa/Cairo': [30.04, 31.24], 'Africa/Lagos': [6.52, 3.38], 'Africa/Johannesburg': [-26.2, 28.05], 'Africa/Nairobi': [-1.29, 36.82] };
var TZ = ''; try { TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
var GEO = ZONES[TZ] || (function () {
  var lon = -new Date().getTimezoneOffset() / 4, r = TZ.split('/')[0];
  return [{ Europe: 50, Asia: 25, America: 38, Africa: 5, Australia: -30, Pacific: -15 }[r] || 40, clamp(lon, -180, 180)];
})();
var CITY = TZ.indexOf('/') > 0 ? TZ.split('/').pop().replace(/_/g, ' ') : '';
if (CITY === 'Calcutta') CITY = 'Kolkata';

// ---------- the sun ----------
var D2R = Math.PI / 180;
function sunAlt(ms) {
  var d = ms / 86400000 - 10957.5;
  var M = D2R * (357.5291 + 0.98560028 * d);
  var C = D2R * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  var L = M + C + D2R * 102.9372 + Math.PI, e = D2R * 23.4397;
  var dec = Math.asin(Math.sin(e) * Math.sin(L)), ra = Math.atan2(Math.sin(L) * Math.cos(e), Math.cos(L));
  var H = D2R * (280.16 + 360.9856235 * d) + D2R * GEO[1] - ra, phi = D2R * GEO[0];
  return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)) / D2R;
}
var DAYS = {};
function dayStart(ms) { var d = new Date(ms); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }
function dayInfo(ms) {
  var s0 = dayStart(ms);
  if (DAYS[s0]) return DAYS[s0];
  var mx = -99, mn = 99, rise = null, set = null, prev = sunAlt(s0), H = -0.833;
  for (var m = 5; m <= 1440; m += 5) {
    var a = sunAlt(s0 + m * 60000);
    if (prev < H && a >= H && rise === null) rise = s0 + (m - 5 + 5 * (H - prev) / (a - prev)) * 60000;
    if (prev >= H && a < H && set === null) set = s0 + (m - 5 + 5 * (prev - H) / (prev - a)) * 60000;
    mx = Math.max(mx, a); mn = Math.min(mn, a); prev = a;
  }
  return (DAYS[s0] = { start: s0, max: mx, min: mn, rise: rise, set: set });
}
function sunState(ms) {
  var alt = sunAlt(ms), rising = sunAlt(ms + 600000) > alt, I = dayInfo(ms);
  var s = alt <= 0 ? alt : 100 * alt / Math.max(I.max, 8);
  var hr = new Date(ms).getHours() + new Date(ms).getMinutes() / 60;
  var ph;
  if (rising) ph = s < -12 ? 'night' : s < 3 ? 'dawn' : hr < 11 ? 'morning' : 'noon';
  else ph = s < -12 ? 'night' : s < -3 ? 'evening' : s < 14 ? 'golden' : hr < 14 && s > 60 ? 'noon' : 'afternoon';
  var W = {
    night: sm(-7, -13, s),
    dawn: rising ? sm(-14, -8, s) * (1 - sm(-1, 6, s)) : 0,
    rise: rising ? sm(-10, -4, s) * (1 - sm(10, 24, s)) : 0,
    morning: rising ? sm(4, 16, s) * (1 - sm(55, 75, s)) : 0,
    day: sm(45, 72, s),
    afternoon: rising ? 0 : sm(70, 50, s) * (1 - sm(18, 8, s)),
    gold: rising ? 0 : sm(22, 10, s) * (1 - sm(-2, -6, s)),
    dusk: rising ? 0 : sm(-1, -5, s) * (1 - sm(-10, -14, s)),
    light: clamp((s + 8) / 22, 0, 1)
  };
  return { ms: ms, alt: alt, s: s, rising: rising, info: I, ph: ph, W: W };
}

// ---------- the scenes ----------
var BASES = {
  K: { w: 1672, h: 941, sun: [1372, 436], hor: 500, fx: 0.8 }, A: { w: 1672, h: 941, sun: [1392, 536], hor: 600, fx: 0.8 },
  E: { w: 1672, h: 941, sun: [473, 481], hor: 560, fx: 0.33 }, D: { w: 1672, h: 941, sun: [1415, 531], hor: 600, fx: 0.8 },
  C: { w: 1672, h: 941, sun: [1220, 506], hor: 590, fx: 0.7 }, B: { w: 1672, h: 941, sun: [1360, 544], hor: 610, fx: 0.78 },
  F: { w: 1672, h: 941, sun: [1256, 474], hor: 575, fx: 0.74 }, J: { w: 1679, h: 937, sun: null, hor: 560, fx: 0.3 }
};
var EVE = ['K', 'A', 'E', 'D'], MORN = ['C', 'B', 'F'];
function frames(st) {
  var di = Math.floor((dayStart(st.ms) + 43200000) / 86400000), hr = new Date(st.ms).getHours();
  var e = EVE[((hr < 12 ? di - 1 : di) % 4 + 4) % 4], m = MORN[(di % 3 + 3) % 3];
  if (st.rising) return [[-91, m + '-night'], [-14, m + '-night'], [-8, m + '-predawn'], [-1.5, m + '-sunrise'], [7, m + '-sunrise'], [32, 'J-morning'], [72, 'J-day'], [101, 'J-day']];
  return [[101, 'J-day'], [72, 'J-day'], [44, 'J-afternoon'], [14, e + '-gold'], [0.5, e + '-gold'], [-5, e + '-dusk'], [-12.5, e + '-night'], [-91, e + '-night']];
}
function sceneFor(st) {
  var F = frames(st), s = st.s;
  for (var i = 0; i < F.length - 1; i++) {
    var a = F[i], b = F[i + 1], lo = Math.min(a[0], b[0]), hi = Math.max(a[0], b[0]);
    if (s >= lo && s <= hi) {
      var w = a[1] === b[1] ? 0 : sm(0, 1, (s - a[0]) / (b[0] - a[0]));
      var res = { a: a[1], b: b[1], w: w, next: (F[i + 2] || b)[1] };
      // just after the deepest point of the night the picture changes to the morning village, very slowly
      if (st.rising && s < -14) {
        var prevE = frames({ ms: st.ms, rising: false })[7][1], k = sm(0, 1, (s - st.info.min) / 4);
        if (prevE !== res.a) res = { a: prevE, b: res.a, w: k, next: res.a };
      }
      return res;
    }
  }
  return { a: F[0][1], b: F[0][1], w: 0, next: F[1][1] };
}
var IMGS = {};
function img(name) {
  if (!IMGS[name]) {
    var o = IMGS[name] = { im: new Image(), ok: false };
    o.p = new Promise(function (res) { o.im.onload = function () { o.ok = true; res(o); }; o.im.onerror = function () { res(o); }; });
    o.im.decoding = 'async'; o.im.src = 'scenes/' + name + '.webp';
  }
  return IMGS[name];
}
var MASKS = {};
function mask(base) {
  if (!MASKS[base]) {
    var o = MASKS[base] = { ok: false, stars: [] }, im = new Image();
    im.onload = function () {
      var c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
      var x = c.getContext('2d'); x.drawImage(im, 0, 0);
      var d; try { d = x.getImageData(0, 0, c.width, c.height).data; } catch (e) { return; }
      var B = BASES[base], n = 0, tries = 0;
      while (n < 190 && tries++ < 4000) {
        var u = Math.random(), v = Math.random() * (B.hor / B.h) * 0.96;
        var px = Math.floor(u * c.width), py = Math.floor(v * c.height);
        if (d[(py * c.width + px) * 4] < 150) continue;
        var big = Math.random();
        o.stars.push({ x: u * B.w, y: v * B.h, r: 0.45 + big * big * big * 1.5, a: 0.35 + Math.random() * 0.65, f: rnd(0.6, 2.2), p: rnd(0, 7), c: Math.random() < 0.15 ? '255,226,190' : Math.random() < 0.3 ? '200,215,255' : '255,255,255' });
        n++;
      }
      o.ok = true;
    };
    im.src = 'masks/' + base + '.png';
  }
  return MASKS[base];
}

// ---------- canvases ----------
var SC = $('scene'), FX = $('fx'), LF = $('life'), sx = SC.getContext('2d'), fx = FX.getContext('2d'), lx = LF.getContext('2d');
var DPR = Math.min(window.devicePixelRatio || 1, 1.75), VW = 0, VH = 0;
function fit(base) {
  var B = BASES[base], k = Math.max(VW / B.w, VH / B.h), w = B.w * k, h = B.h * k;
  return { x: clamp(VW / 2 - B.fx * w, VW - w, 0), y: clamp(VH / 2 - 0.52 * h, VH - h, 0), w: w, h: h, k: k };
}
function bOf(name) { return name.split('-')[0]; }
function kOf(name) { return name.split('-')[1]; }
function drawImg(name, alpha) {
  var o = IMGS[name]; if (!o || !o.ok) return;
  var r = fit(bOf(name)); sx.globalAlpha = alpha; sx.drawImage(o.im, r.x, r.y, r.w, r.h); sx.globalAlpha = 1;
}
var SCN = null, FADE = null, WANT = null;
function dom(x) { return x.w >= 0.5 ? x.b : x.a; }
function paint() {
  sx.setTransform(DPR, 0, 0, DPR, 0, 0);
  sx.fillStyle = '#0d0b14'; sx.fillRect(0, 0, VW, VH);
  if (SCN) { drawImg(SCN.a, 1); if (SCN.w > 0.002 && SCN.b !== SCN.a) drawImg(SCN.b, SCN.w); }
  if (FADE) {
    var k = clamp((performance.now() - FADE.t0) / FADE.dur, 0, 1);
    sx.globalAlpha = 1 - sm(0, 1, k); sx.setTransform(1, 0, 0, 1, 0, 0); sx.drawImage(FADE.c, 0, 0); sx.globalAlpha = 1;
    if (k >= 1) FADE = null;
  }
}
function setScene(want) {
  WANT = want;
  var A = img(want.a), B = img(want.b);
  img(want.next);
  if (!A.ok || (want.w > 0.002 && !B.ok)) { Promise.all([A.p, B.p]).then(function () { if (WANT === want) setScene(want); }); return; }
  var jump = !SCN || ((SCN.a !== want.a || SCN.b !== want.b) && dom(SCN) !== dom(want));
  if (jump) {
    var c = document.createElement('canvas'); c.width = SC.width; c.height = SC.height;
    if (SCN) c.getContext('2d').drawImage(SC, 0, 0); else { var cx = c.getContext('2d'); cx.fillStyle = '#0d0b14'; cx.fillRect(0, 0, c.width, c.height); }
    FADE = { c: c, t0: performance.now(), dur: SCN ? 1500 : 1900 };
  }
  SCN = want; paint();
}
function resize() {
  VW = window.innerWidth; VH = window.innerHeight;
  [SC, FX, LF].forEach(function (c) { c.width = Math.round(VW * DPR); c.height = Math.round(VH * DPR); });
  FADE = null; paint(); if (DIAL.open) dialDraw();
}

// ---------- sky effects inside the picture: stars, glow of sun and moon, morning mist ----------
var SHOOT = null, nextShoot = performance.now() + rnd(8000, 20000);
var MIST = []; for (var mi = 0; mi < 7; mi++) MIST.push({ x: Math.random(), y: rnd(-30, 40), r: rnd(160, 320), v: rnd(4, 11) * (Math.random() < 0.5 ? -1 : 1), a: rnd(0.5, 1) });
function drawFx(now, dt) {
  fx.setTransform(DPR, 0, 0, DPR, 0, 0); fx.clearRect(0, 0, VW, VH);
  if (!SCN || !ST) return;
  var name = dom(SCN), base = bOf(name), kind = kOf(name), r = fit(base), B = BASES[base], T = now / 1000, W = ST.W;
  // stars over the open sky only
  var sA = sm(-3, -11, ST.s) * (kind === 'night' || kind === 'dusk' || kind === 'predawn' ? 1 : 0);
  if (sA > 0.01) {
    var M = mask(base);
    if (M.ok) {
      fx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < M.stars.length; i++) {
        var s = M.stars[i], tw = RM ? 1 : 0.62 + 0.38 * Math.sin(T * s.f + s.p);
        fx.globalAlpha = sA * s.a * tw;
        fx.fillStyle = 'rgb(' + s.c + ')';
        var x = r.x + s.x * r.k, y = r.y + s.y * r.k;
        fx.beginPath(); fx.arc(x, y, s.r, 0, 6.283); fx.fill();
        if (s.r > 1.2) { fx.globalAlpha *= 0.25; fx.beginPath(); fx.arc(x, y, s.r * 3, 0, 6.283); fx.fill(); }
      }
      // a shooting star now and then
      if (!RM && sA > 0.6 && !SHOOT && now > nextShoot && M.stars.length) {
        var st0 = M.stars[Math.floor(Math.random() * M.stars.length)];
        SHOOT = { x: st0.x, y: st0.y, dx: rnd(-1, 1) > 0 ? 1 : -1, t0: now, dur: rnd(700, 1100), len: rnd(90, 170) };
        nextShoot = now + rnd(16000, 40000);
      }
      if (SHOOT) {
        var k = (now - SHOOT.t0) / SHOOT.dur;
        if (k > 1) SHOOT = null;
        else {
          var hx = r.x + SHOOT.x * r.k + SHOOT.dx * k * SHOOT.len * 1.6, hy = r.y + SHOOT.y * r.k + k * SHOOT.len * 0.6;
          var g = fx.createLinearGradient(hx, hy, hx - SHOOT.dx * SHOOT.len, hy - SHOOT.len * 0.38);
          g.addColorStop(0, 'rgba(255,255,255,' + (0.9 * (1 - k) * sA) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
          fx.globalAlpha = 1; fx.strokeStyle = g; fx.lineWidth = 1.6; fx.beginPath(); fx.moveTo(hx, hy); fx.lineTo(hx - SHOOT.dx * SHOOT.len, hy - SHOOT.len * 0.38); fx.stroke();
        }
      }
      fx.globalAlpha = 1; fx.globalCompositeOperation = 'source-over';
    }
  }
  // the sun breathing, or the moon shimmering
  if (B.sun && (kind === 'gold' || kind === 'sunrise' || kind === 'night')) {
    var moon = kind === 'night', gx = r.x + B.sun[0] * r.k, gy = r.y + (B.sun[1] - (moon ? 8 : 0)) * r.k, R = (moon ? 110 : 170) * r.k;
    var pulse = RM ? 0.5 : 0.5 + 0.5 * Math.sin(T * (moon ? 0.5 : 0.7));
    var gg = fx.createRadialGradient(gx, gy, 0, gx, gy, R);
    var col = moon ? '200,215,255' : kind === 'sunrise' ? '255,210,170' : '255,190,120';
    gg.addColorStop(0, 'rgba(' + col + ',' + ((moon ? 0.10 : 0.16) + pulse * 0.07) + ')'); gg.addColorStop(1, 'rgba(' + col + ',0)');
    fx.globalCompositeOperation = 'lighter'; fx.fillStyle = gg; fx.fillRect(gx - R, gy - R, R * 2, R * 2); fx.globalCompositeOperation = 'source-over';
  }
  // drifting mist at dawn and in the early morning
  var mA = Math.max(W.dawn * 0.9, W.rise * 0.8, W.morning * 0.45) * (kind === 'predawn' || kind === 'sunrise' || kind === 'morning' ? 1 : 0);
  if (mA > 0.02) {
    var mc = kind === 'predawn' ? '196,196,226' : kind === 'sunrise' ? '255,226,212' : '238,244,255', hy0 = r.y + B.hor * r.k;
    for (var j = 0; j < MIST.length; j++) {
      var m = MIST[j]; if (!RM) m.x += m.v * dt / Math.max(VW, 1);
      if (m.x > 1.3) m.x = -0.3; if (m.x < -0.3) m.x = 1.3;
      var mx = m.x * VW, my = hy0 + m.y * r.k, mr = m.r * r.k;
      var mg = fx.createRadialGradient(mx, my, 0, mx, my, mr);
      mg.addColorStop(0, 'rgba(' + mc + ',' + (0.22 * mA * m.a) + ')'); mg.addColorStop(1, 'rgba(' + mc + ',0)');
      fx.save(); fx.translate(mx, my); fx.scale(2.6, 0.42); fx.translate(-mx, -my); fx.fillStyle = mg; fx.fillRect(mx - mr, my - mr, mr * 2, mr * 2); fx.restore();
    }
  }
}

// ---------- life in front of the picture: birds, bats, owls, fireflies, rain ----------
var FLOCKS = [], KITES = [], BATS = [], FLIES = [], DROPS = [];
var FLY = (function () {
  var c = document.createElement('canvas'); c.width = c.height = 48; var x = c.getContext('2d'), g = x.createRadialGradient(24, 24, 0, 24, 24, 24);
  g.addColorStop(0, 'rgba(255,248,180,1)'); g.addColorStop(0.12, 'rgba(255,246,170,.95)'); g.addColorStop(0.3, 'rgba(220,255,120,.42)'); g.addColorStop(1, 'rgba(200,255,120,0)');
  x.fillStyle = g; x.fillRect(0, 0, 48, 48); return c;
})();
function wingM(c, S, f, wl) {
  var tx = S * wl, ty = -f * 0.62 * S, cy = -f * 0.2 * S - 0.1 * S;
  c.beginPath();
  c.moveTo(-tx, ty);
  c.quadraticCurveTo(-tx * 0.5, cy - 0.16 * S, -0.12 * S, -0.02 * S);
  c.quadraticCurveTo(0, -0.13 * S, 0.12 * S, -0.02 * S);
  c.quadraticCurveTo(tx * 0.5, cy - 0.16 * S, tx, ty);
  c.quadraticCurveTo(tx * 0.48, cy + 0.07 * S, 0.12 * S, 0.14 * S);
  c.lineTo(0, 0.27 * S); c.lineTo(-0.12 * S, 0.14 * S);
  c.quadraticCurveTo(-tx * 0.48, cy + 0.07 * S, -tx, ty);
  c.closePath(); c.fill();
}
function birdColor(type) {
  var L = ST ? ST.W.light : 1, g = ST ? ST.W.gold : 0;
  if (type === 'egret') return L > 0.75 && g < 0.5 ? '#fbf8f1' : L > 0.35 ? '#ffe3c6' : '#cbbfd6';
  if (type === 'owl') return '#2a2630';
  if (type === 'bat') return '#141119';
  return L > 0.6 && g < 0.3 ? '#2b2527' : '#1a1418';
}
function drawBird(m, type, x, y, dir, T) {
  var S = m.S, c = lx;
  c.save(); c.translate(x, y); c.scale(dir, 1); c.globalAlpha = m.al;
  c.fillStyle = c.strokeStyle = birdColor(type);
  var ph = T * m.fq * 6.283 + m.p, f;
  if (type === 'small') {
    var cyc = (T * 1.25 + m.p) % 1;
    if (cyc < 0.55) wingM(c, S, Math.sin(ph * 1.6), 1.0);
    else { c.beginPath(); c.ellipse(0, 0, S * 0.42, S * 0.2, -0.15, 0, 6.283); c.fill(); }
  } else if (type === 'egret') {
    f = Math.sin(ph) * 0.95 + 0.1; wingM(c, S, f, 1.35);
    c.lineWidth = Math.max(0.8, S * 0.07); c.beginPath(); c.moveTo(-0.05 * S, 0.15 * S); c.lineTo(-1.0 * S, 0.3 * S); c.stroke();
    c.beginPath(); c.arc(0.34 * S, -0.02 * S, 0.1 * S, 0, 6.283); c.fill();
  } else if (type === 'kite') {
    f = m.flap > 0 ? Math.sin(ph) * 0.5 : 0.12 + Math.sin(T * 0.8 + m.p) * 0.05;
    c.rotate(m.bank || 0); wingM(c, S, f, 1.55);
    c.beginPath(); c.moveTo(-0.1 * S, 0.2 * S); c.lineTo(-0.17 * S, 0.62 * S); c.lineTo(0, 0.5 * S); c.lineTo(0.17 * S, 0.62 * S); c.lineTo(0.1 * S, 0.2 * S); c.fill();
  } else if (type === 'bat') {
    f = Math.sin(ph);
    c.beginPath(); c.moveTo(0, -0.12 * S);
    var P = [[0.3, -0.16, 0.4], [0.75, -0.06, 0.55], [1.0, 0.05, 0.4], [0.82, 0.13, 0.2], [0.62, 0.07, 0.15], [0.46, 0.17, 0.1], [0.3, 0.09, 0], [0.12, 0.22, 0]];
    for (var i = 0; i < P.length; i++) c.lineTo(-P[i][0] * S, (P[i][1] - f * P[i][2]) * S);
    for (i = P.length - 1; i >= 0; i--) c.lineTo(P[i][0] * S, (P[i][1] - f * P[i][2]) * S);
    c.closePath(); c.fill();
  } else if (type === 'owl') {
    f = m.glide ? 0.05 : Math.sin(ph) * 0.8; wingM(c, S, f, 1.25);
    c.beginPath(); c.ellipse(0, 0.06 * S, 0.2 * S, 0.27 * S, 0, 0, 6.283); c.fill();
    c.beginPath(); c.arc(0, -0.13 * S, 0.16 * S, 0, 6.283); c.fill();
  } else {
    f = Math.sin(ph) * 0.9 + 0.08; wingM(c, S, f, type === 'vee' ? 1.15 : 1.05);
  }
  c.restore();
}
function spawn(type) {
  if (FLOCKS.length > 6) return;
  var dir = Math.random() < 0.5 ? 1 : -1, d = Math.random(), n, S, v, fq, mem = [], sc, i;
  var y = VH * rnd(0.09, type === 'owl' ? 0.5 : 0.42);
  if (type === 'small') { n = 1 + Math.floor(Math.random() * 3); S = 4 + d * 3; v = 85 + d * 50; fq = 7; for (i = 0; i < n; i++) mem.push({ ox: -i * rnd(18, 34), oy: rnd(-14, 14) }); }
  else if (type === 'egret') { n = 2 + Math.floor(Math.random() * 6); S = 8 + d * 9; v = 36 + d * 26; fq = 1.9; sc = S / 10; for (i = 0; i < n; i++) mem.push({ ox: -i * 30 * sc, oy: i * 9 * sc * (Math.random() < 0.5 ? 1 : 0.6) + rnd(-3, 3) }); }
  else if (type === 'crow') { n = 4 + Math.floor(Math.random() * 10); S = 4.5 + d * 5; v = 48 + d * 28; fq = 3.1; for (i = 0; i < n; i++) mem.push({ ox: -rnd(0, 140) * (0.6 + d), oy: rnd(-36, 36) * (0.6 + d) }); }
  else if (type === 'vee') { n = 7 + Math.floor(Math.random() * 9); S = 5.5 + d * 6; v = 46 + d * 24; fq = 2.7; sc = S / 8; for (i = 0; i < n; i++) { var rk = Math.ceil(i / 2), sd = i % 2 ? 1 : -1; mem.push({ ox: -rk * 24 * sc, oy: sd * rk * 13 * sc }); } }
  else if (type === 'owl') { n = 1; S = 13 + d * 9; v = 70 + d * 30; fq = 1.5; mem.push({ ox: 0, oy: 0 }); }
  else return;
  mem.forEach(function (m) { m.S = S * rnd(0.88, 1.12); m.p = rnd(0, 6.28); m.fq = fq * rnd(0.85, 1.15); m.al = 0.55 + d * 0.45; m.wo = rnd(0, 6.28); m.glide = false; });
  FLOCKS.push({ type: type, dir: dir, x: dir > 0 ? -60 : VW + 60, y: y, v: v * rnd(0.9, 1.1), mem: mem, t: 0, bob: rnd(4, 12), seed: rnd(0, 6) });
}
var RATE = { small: 0, egret: 0, crow: 0, vee: 0, owl: 0 };
function rates() {
  var W = ST.W, rain = document.body.classList.contains('rain') ? 0.15 : 1;
  RATE.small = (3.2 * W.rise + 2.2 * W.morning + 1.0 * W.day + 1.3 * W.afternoon) * rain;
  RATE.egret = (1.2 * W.rise + 0.9 * W.morning + 0.4 * W.day + 0.9 * W.afternoon + 1.4 * W.gold) * rain;
  RATE.crow = (0.5 * W.morning + 0.5 * W.day + 0.7 * W.afternoon + 1.1 * W.gold + 0.4 * W.rise) * rain;
  RATE.vee = (1.8 * W.gold + 1.0 * W.dusk) * rain;
  RATE.owl = 0.45 * W.night * rain;
}
function drawLife(now, dt) {
  lx.setTransform(DPR, 0, 0, DPR, 0, 0); lx.clearRect(0, 0, VW, VH);
  if (!ST) return;
  var T = now / 1000, W = ST.W, rain = document.body.classList.contains('rain');
  if (!RM) for (var k in RATE) if (Math.random() < RATE[k] / 60 * dt) spawn(k);
  // flocks
  for (var i = FLOCKS.length - 1; i >= 0; i--) {
    var g = FLOCKS[i]; g.t += dt; g.x += g.dir * g.v * dt;
    var gy = g.y + Math.sin(g.t * 0.45 + g.seed) * g.bob, out = true;
    for (var j = 0; j < g.mem.length; j++) {
      var m = g.mem[j], x = g.x + g.dir * m.ox + Math.sin(g.t * 0.9 + m.wo) * 3, y = gy + m.oy + Math.sin(g.t * 1.3 + m.wo) * 2.5;
      if (g.type === 'small') y += Math.sin(g.t * 7.8 + m.p) * 4;
      if (g.type === 'owl') m.glide = Math.sin(g.t * 0.9) > 0.2;
      if (x > -120 && x < VW + 120) out = false;
      drawBird(m, g.type, x, y, g.dir, T);
    }
    if (out && g.t > 3) FLOCKS.splice(i, 1);
  }
  // kites circling high at midday
  var wantK = RM ? 0 : Math.round(clamp(2.2 * W.day + 1.0 * W.morning + 1.1 * W.afternoon, 0, 2) * (rain ? 0 : 1));
  while (KITES.filter(function (q) { return !q.gone; }).length < wantK) KITES.push({ cx: rnd(0.15, 0.85) * VW, cy: VH * rnd(0.1, 0.24), R: rnd(60, 130), th: rnd(0, 6.28), w: rnd(0.18, 0.3) * (Math.random() < 0.5 ? 1 : -1), S: rnd(12, 19), a: 0, gone: false, p: rnd(0, 6), fq: 2.2, flap: 0, al: 1 });
  var alive = 0;
  for (i = KITES.length - 1; i >= 0; i--) {
    var q = KITES[i]; if (!q.gone && ++alive > wantK) q.gone = true;
    q.a = clamp(q.a + (q.gone ? -0.25 : 0.25) * dt, 0, 1); if (q.gone && q.a <= 0) { KITES.splice(i, 1); continue; }
    q.th += q.w * dt; q.cx += Math.sin(T * 0.05 + q.p) * 4 * dt;
    q.flap = q.flap > 0 ? q.flap - dt : Math.random() < dt * 0.08 ? 0.9 : 0;
    q.bank = Math.cos(q.th) * 0.22 * Math.sign(q.w);
    q.al = q.a * 0.92;
    drawBird(q, 'kite', q.cx + Math.cos(q.th) * q.R, q.cy + Math.sin(q.th) * q.R * 0.32, Math.sin(q.th) * q.w < 0 ? 1 : -1, T);
  }
  // bats at dusk and at night
  var wantB = RM ? 0 : Math.round(7 * W.dusk + 2.5 * W.night * (1 - W.dusk) + 4 * (ST.rising ? W.dawn * 0.4 : 0));
  while (BATS.length < wantB) BATS.push({ x: rnd(0, VW), y: VH * rnd(0.1, 0.45), vx: rnd(-80, 80), vy: rnd(-20, 20), S: rnd(6, 9.5), p: rnd(0, 6), fq: rnd(8, 11), a: 0, al: 0 });
  for (i = BATS.length - 1; i >= 0; i--) {
    var b = BATS[i], leave = i >= wantB;
    b.a = clamp(b.a + (leave ? -0.5 : 0.5) * dt, 0, 1); if (leave && b.a <= 0) { BATS.splice(i, 1); continue; }
    b.vx += rnd(-260, 260) * dt; b.vy += rnd(-200, 200) * dt; b.vx = clamp(b.vx, -120, 120); b.vy = clamp(b.vy, -70, 70);
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.y < VH * 0.06 || b.y > VH * 0.5) b.vy *= -1; if (b.x < -40) b.x = VW + 30; if (b.x > VW + 40) b.x = -30;
    b.al = b.a * 0.9; drawBird(b, 'bat', b.x, b.y, b.vx > 0 ? 1 : -1, T);
  }
  // fireflies low over the grass and water
  var boost = CUR && CUR.scene === 'fireflies' ? 1.6 : 1;
  var wantF = Math.round((46 * W.night + 26 * W.dusk + 12 * W.dawn) * boost * (rain ? 0.2 : 1));
  while (FLIES.length < wantF) FLIES.push({ x: rnd(0, VW), y: VH * rnd(0.58, 0.97), vx: rnd(-12, 12), vy: rnd(-8, 8), p: rnd(0, 6.28), f: rnd(0.35, 0.9), r: rnd(1.4, 2.6), a: 0 });
  if (FLIES.length) {
    lx.globalCompositeOperation = 'lighter';
    for (i = FLIES.length - 1; i >= 0; i--) {
      var fl = FLIES[i], go = i >= wantF;
      fl.a = clamp(fl.a + (go ? -0.4 : 0.4) * dt, 0, 1); if (go && fl.a <= 0) { FLIES.splice(i, 1); continue; }
      if (!RM) { fl.vx += rnd(-18, 18) * dt; fl.vy += rnd(-14, 14) * dt; fl.vx = clamp(fl.vx, -16, 16); fl.vy = clamp(fl.vy, -10, 10); fl.x += fl.vx * dt; fl.y += fl.vy * dt; }
      if (fl.y < VH * 0.52 || fl.y > VH) fl.vy *= -1; if (fl.x < 0 || fl.x > VW) fl.vx *= -1;
      var bl = Math.pow(Math.max(0, Math.sin(T * fl.f * 2 + fl.p)), 3);
      lx.globalAlpha = fl.a * (0.12 + 0.88 * bl);
      lx.drawImage(FLY, fl.x - fl.r * 6, fl.y - fl.r * 6, fl.r * 12, fl.r * 12);
    }
    lx.globalAlpha = 1;
    lx.globalCompositeOperation = 'source-over';
  }
  // rain for the rainy song
  var wantD = rain && !RM ? Math.round(VW * VH / 9000) : 0;
  while (DROPS.length < wantD) DROPS.push({ x: rnd(-100, VW), y: rnd(-VH, VH), v: rnd(520, 820), l: rnd(12, 26), a: rnd(0.15, 0.4) });
  if (DROPS.length > wantD) DROPS.length = wantD;
  if (DROPS.length) {
    lx.lineWidth = 1; lx.strokeStyle = 'rgba(220,230,245,1)';
    for (i = 0; i < DROPS.length; i++) {
      var dr = DROPS[i]; dr.y += dr.v * dt; dr.x += dr.v * 0.18 * dt;
      if (dr.y > VH) { dr.y = rnd(-80, -10); dr.x = rnd(-100, VW); }
      lx.globalAlpha = dr.a; lx.beginPath(); lx.moveTo(dr.x, dr.y); lx.lineTo(dr.x - dr.l * 0.18, dr.y - dr.l); lx.stroke();
    }
    lx.globalAlpha = 1;
  }
}

// ---------- time of day: live, or a preview from the day dial ----------
var PREVIEW = null, ST = null;
(function () { var q = location.search.match(/[?&]t=(\d{1,2}):(\d{2})/); if (q) { var d = new Date(); d.setHours(+q[1], +q[2], 0, 0); PREVIEW = d.getTime(); } })();
function nowMs() { return PREVIEW !== null ? PREVIEW : Date.now(); }
function tfmt(ms) { return new Date(ms).toLocaleTimeString(lang === 'de' ? 'de-DE' : 'en-GB', { hour: '2-digit', minute: '2-digit' }); }
var ICN = {
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.4" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></g></svg>',
  rise: '<svg viewBox="0 0 24 24"><path d="M6.5 16a5.5 5.5 0 0 1 11 0z" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 19.5h18M12 4v3M4.6 9.2l1.8 1.4M19.4 9.2l-1.8 1.4"/></g></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1z" fill="currentColor"/></svg>'
};
function applyState(force) {
  var st = sunState(nowMs()), prevPh = ST && ST.ph;
  ST = st; rates();
  var P = PH[st.ph];
  document.documentElement.style.setProperty('--acc', P.acc[0]);
  document.documentElement.style.setProperty('--acc2', P.acc[1]);
  document.documentElement.style.setProperty('--shade', P.shade);
  $('phIcon').innerHTML = st.ph === 'night' || st.ph === 'evening' ? ICN.moon : st.ph === 'dawn' || st.ph === 'golden' ? ICN.rise : ICN.sun;
  $('phBn').textContent = P.bn; $('phTr').textContent = P[lang]; $('phClock').textContent = tfmt(st.ms);
  $('phase').classList.toggle('pv', PREVIEW !== null);
  $('phase').setAttribute('aria-label', P[lang] + ' ' + tfmt(st.ms));
  setScene(sceneFor(st));
  if (DIAL.open) dialUpdate();
  if (force || prevPh !== st.ph) document.querySelector('meta[name=theme-color]').setAttribute('content', st.ph === 'noon' || st.ph === 'morning' ? '#2c4a6a' : '#0d0b14');
}

// ---------- the day dial ----------
var DIAL = { open: false, cv: $('dcv') };
var SKY = {
  up: [[-91, [7, 10, 28]], [-14, [11, 16, 48]], [-8, [51, 48, 94]], [-3, [141, 90, 124]], [1, [241, 154, 114]], [8, [247, 194, 124]], [30, [169, 211, 242]], [72, [95, 166, 230]], [101, [95, 166, 230]]],
  dn: [[101, [95, 166, 230]], [72, [95, 166, 230]], [44, [143, 188, 224]], [14, [245, 182, 94]], [1, [240, 123, 63]], [-4, [154, 74, 106]], [-9, [59, 43, 90]], [-14, [11, 16, 48]], [-91, [7, 10, 28]]]
};
function skyCol(st) {
  var L = st.rising ? SKY.up : SKY.dn;
  for (var i = 0; i < L.length - 1; i++) {
    var a = L[i], b = L[i + 1];
    if (st.s >= Math.min(a[0], b[0]) && st.s <= Math.max(a[0], b[0])) {
      var k = (st.s - a[0]) / (b[0] - a[0]);
      return [0, 1, 2].map(function (c) { return Math.round(a[1][c] + (b[1][c] - a[1][c]) * k); });
    }
  }
  return L[0][1];
}
function dialDraw() {
  var c = DIAL.cv, w = c.clientWidth, h = c.clientHeight; if (!w) return;
  c.width = Math.round(w * DPR); c.height = Math.round(h * DPR);
  var x = c.getContext('2d'); x.setTransform(DPR, 0, 0, DPR, 0, 0);
  var I = dayInfo(nowMs()), amp = Math.max(Math.abs(I.max), Math.abs(I.min), 10), mid = h * 0.56, ky = h * 0.4 / amp;
  DIAL.pts = [];
  for (var px = 0; px <= w; px += 2) {
    var ms = I.start + px / w * 86400000, st = sunState(ms), col = skyCol(st);
    x.fillStyle = 'rgb(' + col.join(',') + ')'; x.fillRect(px - 0.5, 0, 3, h);
    DIAL.pts.push([px, mid - st.alt * ky]);
  }
  x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, mid, w, h - mid);
  x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 1; x.beginPath(); x.moveTo(0, mid); x.lineTo(w, mid); x.stroke();
  x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 1.6; x.setLineDash([3, 4]); x.beginPath();
  DIAL.pts.forEach(function (p, i) { if (i) x.lineTo(p[0], p[1]); else x.moveTo(p[0], p[1]); }); x.stroke(); x.setLineDash([]);
  DIAL.I = I; DIAL.mid = mid; DIAL.ky = ky; DIAL.w = w;
  var lab = function (el, ms, txt) { if (ms) { el.hidden = false; el.style.left = ((ms - I.start) / 86400000 * 100) + '%'; el.textContent = txt + ' ' + tfmt(ms); } else el.hidden = true; };
  lab($('dRise'), I.rise, '↑'); lab($('dSet'), I.set, '↓');
  dialUpdate();
}
function dialUpdate() {
  if (!DIAL.I) return;
  var ms = nowMs(), I = DIAL.I;
  if (dayStart(ms) !== I.start) { dialDraw(); return; }
  var k = (ms - I.start) / 86400000, st = ST, sun = $('dsun');
  sun.style.left = (k * 100) + '%'; sun.style.top = (DIAL.mid - st.alt * DIAL.ky) + 'px';
  sun.classList.toggle('moon', st.alt < -0.833);
  $('dPh').textContent = PH[st.ph].bn + ' · ' + PH[st.ph][lang];
  $('dTime').textContent = tfmt(ms);
  $('dPlace').textContent = CITY ? t('place').replace('{z}', CITY) : '';
  $('dLive').textContent = PREVIEW !== null ? '↺ ' + t('live') : '● ' + t('live');
  $('dLive').disabled = PREVIEW === null;
  $('dNote').textContent = PREVIEW !== null ? t('preview') : t('dialNote');
}
function dialOpen(on) {
  DIAL.open = on; $('dial').hidden = !on; $('phase').setAttribute('aria-expanded', on);
  if (on) { closeSheet(); requestAnimationFrame(dialDraw); }
}
$('phase').addEventListener('click', function (e) { e.stopPropagation(); dialOpen(!DIAL.open); });
$('dLive').addEventListener('click', function () { PREVIEW = null; applyState(true); });
(function () {
  var bar = $('dbar'), drag = false;
  function at(e) {
    var r = bar.getBoundingClientRect(), k = clamp((e.clientX - r.left) / r.width, 0, 0.9999);
    PREVIEW = DIAL.I.start + Math.round(k * 1440 / 5) * 5 * 60000; applyState();
  }
  bar.addEventListener('pointerdown', function (e) { drag = true; bar.setPointerCapture(e.pointerId); at(e); });
  bar.addEventListener('pointermove', function (e) { if (drag) at(e); });
  bar.addEventListener('pointerup', function () { drag = false; });
  bar.addEventListener('pointercancel', function () { drag = false; });
})();
document.addEventListener('pointerdown', function (e) {
  if (DIAL.open && !$('dial').contains(e.target) && !$('phase').contains(e.target)) dialOpen(false);
  if (!$('sheet').hidden && !$('sheet').contains(e.target) && !$('lst').contains(e.target)) closeSheet();
});

// ---------- the radio ----------
var PL = null, SONGS = [], TALKS = [], bag = [], hist = [], CUR = null, sinceTalk = 0, talkI = 0, errs = 0, started = false;
var A = new Audio(); A.preload = 'auto'; window.GRAudio = A;
var vol = LS.get('vol', 0.85); A.volume = vol; $('vol').value = Math.round(vol * 100);
function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
function refill() {
  bag = shuffle(SONGS.slice());
  var k = Math.min(3, Math.floor(SONGS.length / 2)), rec = hist.slice(-k);
  for (var i = bag.length - 1; i >= bag.length - k; i--) if (rec.indexOf(bag[i]) >= 0) for (var j = 0; j < bag.length - k; j++) if (rec.indexOf(bag[j]) < 0) { var x = bag[i]; bag[i] = bag[j]; bag[j] = x; break; }
}
function talkDue() { return PL.talkEvery && TALKS.length && sinceTalk >= PL.talkEvery; }
function peek() { if (talkDue()) return TALKS[talkI % TALKS.length]; if (!bag.length) refill(); return bag[bag.length - 1]; }
function take() { if (talkDue()) { sinceTalk = 0; return TALKS[talkI++ % TALKS.length]; } if (!bag.length) refill(); return bag.pop(); }
function coverOf(it) {
  if (!it) return 'covers/v1.jpg';
  if (it.cover) return /\//.test(it.cover) ? it.cover : 'covers/' + it.cover + '.jpg';
  return 'covers/v' + (hash(it.id || it.file || '') % 6 + 1) + '.jpg';
}
function setMsg(s) { $('msg').textContent = s || ''; }
function playItem(it) {
  if (!it) return;
  CUR = it; if (it.type !== 'talk') { hist.push(it); if (hist.length > 20) hist.shift(); sinceTalk++; }
  A.src = it.file;
  var p = A.play(); if (p && p.catch) p.catch(function (e) { if (e && e.name === 'NotAllowedError') { started = false; document.body.classList.add('idle'); setMsg(t('tune')); render(); } });
  setMsg(''); document.body.classList.toggle('rain', it.scene === 'rain'); rates();
  var h = $('hero'); h.classList.remove('swap'); void h.offsetWidth; h.classList.add('swap');
  render(); media();
  var nx = peek(); if (nx) { var pre = new Image(); pre.src = coverOf(nx); }
}
function next() { playItem(take()); }
function toggle() {
  if (!PL) return;
  if (!started) { started = true; document.body.classList.remove('idle'); if (CUR && A.src) A.play(); else { var first = (PL.items || []).filter(function (x) { return x.first; })[0]; if (first) playItem(first); else next(); } render(); return; }
  if (A.paused) A.play(); else A.pause();
}
A.addEventListener('ended', function () { errs = 0; next(); });
A.addEventListener('play', render); A.addEventListener('pause', render);
A.addEventListener('playing', function () { errs = 0; setMsg(''); render(); });
A.addEventListener('error', function () {
  if (!A.getAttribute('src') || !started) return;
  errs++; setMsg(t('err'));
  if (errs < Math.max(3, SONGS.length)) setTimeout(next, 1200); else render();
});
A.addEventListener('timeupdate', prog); A.addEventListener('durationchange', prog);
function prog() {
  var d = isFinite(A.duration) ? A.duration : (CUR && CUR.dur) || 0;
  $('bar').style.width = d ? (A.currentTime / d * 100) + '%' : '0';
  $('tc').textContent = fmt(A.currentTime); $('td').textContent = fmt(d);
  $('prog').setAttribute('aria-valuenow', d ? Math.round(A.currentTime / d * 100) : 0);
}
function seek(e) {
  if (!isFinite(A.duration) || !CUR || CUR.type === 'talk') return;
  var r = $('prog').getBoundingClientRect(); A.currentTime = clamp((e.clientX - r.left) / r.width, 0, 0.999) * A.duration;
}
$('prog').addEventListener('pointerdown', seek);
$('prog').addEventListener('keydown', function (e) { if (!isFinite(A.duration)) return; if (e.key === 'ArrowRight') A.currentTime = Math.min(A.duration - 1, A.currentTime + 10); if (e.key === 'ArrowLeft') A.currentTime = Math.max(0, A.currentTime - 10); });
$('pp').addEventListener('click', toggle);
$('nx').addEventListener('click', function () { if (!PL) return; if (!started) { started = true; document.body.classList.remove('idle'); } next(); });
$('vol').addEventListener('input', function () { vol = this.value / 100; A.volume = vol; LS.set('vol', vol); });
document.addEventListener('keydown', function (e) {
  if (e.code === 'Space' && !/^(INPUT|BUTTON|A)$/.test(e.target.tagName)) { e.preventDefault(); toggle(); }
  if (e.key === 'Escape') { dialOpen(false); closeSheet(); var m = document.querySelector('.mbg'); if (m) m.remove(); }
});
function titles(it) {
  if (!it) return ['Germalingo Radio', t('tagline'), ''];
  if (it.type === 'talk') return ['Germalingo Radio', t('talk'), ''];
  var T = it.title || {};
  if (typeof T === 'string') return [T, it.artist || '', [la(it.style), la(it.instruments)].filter(Boolean).join(' · ')];
  return [T.bn || la(T), T.bn ? la(T) : (it.artist || ''), [la(it.style), la(it.instruments)].filter(Boolean).join(' · ')];
}
function render() {
  var playing = started && !A.paused;
  document.body.classList.toggle('playing', playing);
  $('pp').innerHTML = playing ? '<svg viewBox="0 0 24 24"><rect x="6.5" y="5" width="4" height="14" rx="1.3" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1.3" fill="currentColor"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M8 5.2v13.6l11-6.8z" fill="currentColor"/></svg>';
  $('pp').setAttribute('aria-label', playing ? 'Pause' : 'Play');
  $('air').textContent = !started ? t('ready') : playing ? (CUR && CUR.type === 'talk' ? t('talk') : t('air')) : t('paused');
  var tt = titles(CUR);
  $('t1').textContent = tt[0]; $('t2').textContent = tt[1];
  $('meta').textContent = CUR ? tt[2] : (started ? '' : t('tune'));
  $('n1').textContent = tt[0]; $('n2').textContent = CUR ? tt[1] : t('tagline');
  var cv = coverOf(CUR || null);
  if ($('cov')._s !== cv) { $('cov')._s = cv; $('cov').innerHTML = '<img alt="" src="' + esc(cv) + '">'; }
  document.querySelectorAll('.song').forEach(function (b) { b.classList.toggle('cur', !!CUR && b._it === CUR); });
  document.title = playing && CUR ? tt[0] + ' · Germalingo Radio' : 'Germalingo Radio';
  prog();
}
function media() {
  if (!('mediaSession' in navigator) || !CUR) return;
  var tt = titles(CUR), abs = new URL(coverOf(CUR), location.href).href;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({ title: tt[0] + (tt[1] && CUR.title && CUR.title.bn ? ' · ' + tt[1] : ''), artist: CUR.artist || 'Germalingo', album: 'Germalingo Radio', artwork: [{ src: abs, sizes: '600x600', type: 'image/jpeg' }] });
    navigator.mediaSession.setActionHandler('play', function () { toggle(); });
    navigator.mediaSession.setActionHandler('pause', function () { A.pause(); });
    navigator.mediaSession.setActionHandler('nexttrack', function () { next(); });
  } catch (e) {}
}
function list() {
  var g = $('list'); g.innerHTML = '';
  SONGS.forEach(function (it) {
    var tt = titles(it), b = document.createElement('button'); b.className = 'song'; b._it = it;
    b.innerHTML = '<img alt="" loading="lazy" src="' + esc(coverOf(it)) + '"><span><b>' + esc(tt[0]) + '</b><small>' + esc(tt[1]) + '</small><em>' + esc(la(it.style) || '') + (it.dur ? ' · ' + fmt(it.dur) : '') + '</em></span><span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
    b.onclick = function () { started = true; document.body.classList.remove('idle'); bag = bag.filter(function (x) { return x !== it; }); playItem(it); };
    g.appendChild(b);
  });
  render();
}
function openSheet() { dialOpen(false); $('sheet').hidden = false; $('lst').setAttribute('aria-expanded', 'true'); }
function closeSheet() { $('sheet').hidden = true; $('lst').setAttribute('aria-expanded', 'false'); }
$('lst').addEventListener('click', function (e) { e.stopPropagation(); if ($('sheet').hidden) openSheet(); else closeSheet(); });
$('shx').addEventListener('click', closeSheet);
function modal(title, ps) {
  var bg = document.createElement('div'); bg.className = 'mbg';
  bg.innerHTML = '<div class="mbox glass" role="dialog" aria-modal="true"><button class="ib x" aria-label="close"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button><h3>' + esc(title) + '</h3>' + ps.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '<a class="go" href="https://germalingo.com" target="_blank" rel="noopener">germalingo.com</a></div>';
  bg.addEventListener('click', function (e) { if (e.target === bg || e.target.closest('.x')) bg.remove(); });
  document.body.appendChild(bg); bg.querySelector('.x').focus();
}
$('fAbout').onclick = function (e) { e.preventDefault(); modal(t('about'), t('aboutP')); };
$('fContact').onclick = function (e) { e.preventDefault(); modal(t('contact'), [t('contactP')]); };
function texts() {
  document.documentElement.lang = lang;
  document.querySelectorAll('.lang button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-l') === lang); });
  $('hList').textContent = t('list'); $('carTxt').textContent = t('car');
  $('fAbout').textContent = t('about'); $('fContact').textContent = t('contact');
  if (PL) list(); else render();
  if (ST) applyState(true);
}
document.querySelectorAll('.lang button').forEach(function (b) { b.onclick = function () { lang = b.getAttribute('data-l'); LS.set('lang', lang); texts(); media(); }; });

// gentle parallax with the mouse or the tilt of the phone
(function () {
  if (RM) return;
  var cam = $('cam'), tx = 0, ty = 0;
  function set(x, y) { var m = Math.min(12, VW * 0.016); tx = clamp(x, -1, 1) * m; ty = clamp(y, -1, 1) * m * 0.6; cam.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0)'; }
  window.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') set((e.clientX / VW - 0.5) * -2, (e.clientY / VH - 0.5) * -2); });
  window.addEventListener('deviceorientation', function (e) { if (e.gamma !== null) set(-e.gamma / 30, -(e.beta - 45) / 40); });
})();

// ---------- run ----------
var last = performance.now();
function frame(now) {
  var dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (FADE) paint();
  drawFx(now, dt); drawLife(now, dt);
  requestAnimationFrame(frame);
}
window.addEventListener('resize', resize);
resize(); texts(); applyState(true);
setInterval(function () { if (PREVIEW === null) applyState(); else $('phClock').textContent = tfmt(nowMs()); }, 20000);
document.addEventListener('visibilitychange', function () { if (!document.hidden) applyState(); });
requestAnimationFrame(frame);
fetch('playlist.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (j) {
  PL = j; PL.talkEvery = +PL.talkEvery || 0;
  SONGS = (j.items || []).filter(function (x) { return (x.type || 'song') === 'song' && x.file; });
  TALKS = (j.items || []).filter(function (x) { return x.type === 'talk' && x.file && !x.first; });
  refill(); list();
}).catch(function () { setMsg(t('errPl')); });
window.GR = { state: function () { return ST; }, scene: function () { return SCN; }, preview: function (ms) { PREVIEW = ms; applyState(true); }, flocks: function () { return { flocks: FLOCKS.length, kites: KITES.length, bats: BATS.length, flies: FLIES.length }; }, spawn: spawn };
})();
