/* بصمة التميّز – واجهة المعلمة الأولى (تطبيق صفحة واحدة) */
(function () {
'use strict';

var S = { token: null, d: null, view: 'home', p: {}, stack: [], tab: {}, temp: {} };
var appEl = document.getElementById('app');
var overlayEl = document.getElementById('overlay');

/* ---------- أدوات ---------- */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function attr(s) { return esc(s); }
function C() { return S.d.constants; }
function byId(list, id) { for (var i = 0; i < list.length; i++) if (String(list[i].id) === String(id)) return list[i]; return null; }
function upsert(list, rec) { for (var i = 0; i < list.length; i++) if (String(list[i].id) === String(rec.id)) { list[i] = rec; return; } list.push(rec); }
function drop(list, id) { for (var i = list.length - 1; i >= 0; i--) if (String(list[i].id) === String(id)) list.splice(i, 1); }
function tname(id) { var t = byId(S.d.teachers, id); return t ? t.name : ''; }
function shortName(n) { var p = String(n || '').replace(/ بنت | بن /g, ' ').split(' ').filter(Boolean); return p.length > 2 ? p[0] + ' ' + p[p.length - 1] : n; }
function activeTeachers() { return S.d.teachers.filter(function (t) { return t.active !== false; }); }
function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
function checked(name) { var el = document.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }
function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function fmtDate(s) { if (!s) return ''; var p = String(s).slice(0, 10).split('-'); return p.length === 3 ? Number(p[2]) + '/' + Number(p[1]) + '/' + p[0] : s; }
function lines(s) { return String(s || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); }
var SITE_BASE = location.href.split('#')[0].split('?')[0].replace(/[^\/]*$/, '');
function formUrl(id) { return SITE_BASE + 'form.html?id=' + encodeURIComponent(id); }
function printUrl(type, extra) { var q = 'print.html?type=' + encodeURIComponent(type); for (var k in (extra || {})) q += '&' + k + '=' + encodeURIComponent(extra[k]); return SITE_BASE + q + '#t=' + encodeURIComponent(S.token || ''); }
function waUrl(text) { return 'https://api.whatsapp.com/send?text=' + encodeURIComponent(text); }
/* حقول الأرقام: type=text + inputmode=numeric (لأن آيفون يرفض الأرقام العربية في type=number)، وتحويل ٠-٩ إلى 0-9 أثناء الكتابة */
function numAttr(type) { return type === 'number' ? 'type="text" inputmode="decimal" autocomplete="off" data-num="1"' : 'type="' + (type || 'text') + '"'; }
document.addEventListener('input', function (ev) {
  var el = ev.target;
  if (!el || el.tagName !== 'INPUT' || !(el.getAttribute('data-num') || el.type === 'tel')) return;
  var v = el.value, n = v.replace(/[\u0660-\u0669]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); }).replace(/[\u06F0-\u06F9]/g, function (d) { return String(d.charCodeAt(0) - 0x06F0); }).replace(/[\u066B\u060C,]/g, '.');
  if (el.getAttribute('data-num')) n = n.replace(/[^0-9.]/g, '');
  if (n !== v) { el.value = n; }
}, true);
var PAL = [['#F7E8EF', '#8E4270'], ['#E8EEF6', '#1F3F66'], ['#FDF3E4', '#7A4405'], ['#F1E9F7', '#5B2B7A']];

var I = {
  home: '<path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.4 3.4-5.5 6.5-5.5s5.7 2.1 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.5.8 2.6 2.6 3 5.2"/>',
  inbox: '<path d="M3 13h5l2 3h4l2-3h5"/><path d="M5 5h14l2 8v6H3v-6z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  back: '<path d="M9 6l6 6-6 6"/>', chev: '<path d="M15 6l-6 6 6 6"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  link: '<path d="M10 14a4 4 0 0 0 6 .5l3-3a4 4 0 0 0-5.7-5.7l-1.3 1.3"/><path d="M14 10a4 4 0 0 0-6-.5l-3 3a4 4 0 0 0 5.7 5.7l1.3-1.3"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>', book: '<path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 0 2 2h13"/>',
  meet: '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2.5 19c.7-2.8 2.9-4.5 5.5-4.5s4.8 1.7 5.5 4.5M13.5 15c.8-.3 1.6-.5 2.5-.5 2.6 0 4.8 1.7 5.5 4.5"/>',
  check: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>',
  cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>', print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', wa: '<path d="M4 20l1.3-3.8A8 8 0 1 1 8 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2z"/>',
  print2: '', logo: '<path d="M12 3c-4 0-7 3-7 7v2"/><path d="M19 12v-2c0-3.9-3.1-7-7-7"/><path d="M8.5 21c-1-2-1.5-4-1.5-7v-4a5 5 0 0 1 10 0v2"/><path d="M12 10v5c0 2 .5 4 1.5 6"/><path d="M16.5 15.5c0 1.8.3 3.5.9 5"/>'
};
function ic(name, size, color) { return '<svg width="' + (size || 20) + '" height="' + (size || 20) + '" viewBox="0 0 24 24" fill="none" stroke="' + (color || 'currentColor') + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (I[name] || '') + '</svg>'; }

/* ---------- اتصال بالخادم ---------- */
function rpc(fnName, args) {
  return window.basmatRpc(fnName, args).then(null, function (e) {
    if (e && e.auth) { forgetToken(); S.token = null; render(); }
    throw e;
  });
}
function call(action, args) { return rpc('api', [S.token, action, args || {}]); }
var busyCount = 0;
function busy(on) { busyCount += on ? 1 : -1; overlayEl.innerHTML = busyCount > 0 ? '<div class="loading" role="status" aria-label="جارٍ التحميل"><div class="spinner"></div></div>' : ''; }
function run(promise, okMsg) {
  busy(true);
  return promise.then(function (r) { busy(false); if (okMsg) toast(okMsg); return r; }, function (e) { busy(false); toast(e.message, true); throw e; });
}
var toastTimer;
function toast(msg, err) {
  var el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.className = 'toast' + (err ? ' err' : ''); el.textContent = msg; el.style.display = 'block';
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.style.display = 'none'; }, err ? 5000 : 2600);
}
function saveToken(t) { try { localStorage.setItem('basmat_token', t); } catch (e) {} }
function loadToken() { try { return localStorage.getItem('basmat_token'); } catch (e) { return null; } }
function forgetToken() { try { localStorage.removeItem('basmat_token'); } catch (e) {} }
function copyText(text) {
  function fallback() { var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta); }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () {}, fallback); else fallback();
  toast('تم النسخ');
}
/* تصغير الصور قبل الرفع (أطول ضلع 1600px، JPEG 82%) – صورة جوال 4 ميجا تصبح ~300 كيلو فيصير الرفع أسرع بكثير */
function shrinkImage(file) {
  return new Promise(function (resolve) {
    if (!/^image\/(jpe?g|png|webp|hei[cf])$/i.test(file.type || '') || file.size < 350 * 1024 || !window.URL || !document.createElement('canvas').getContext) { resolve(null); return; }
    var url = URL.createObjectURL(file), img = new Image();
    var done = function (x) { try { URL.revokeObjectURL(url); } catch (e) {} resolve(x); };
    img.onload = function () {
      try {
        var max = 1600, w = img.naturalWidth, h = img.naturalHeight;
        if (!w || !h) { done(null); return; }
        var k = Math.min(1, max / Math.max(w, h));
        var cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
        var cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(img, 0, 0, cv.width, cv.height);
        var data = cv.toDataURL('image/jpeg', 0.82);
        if (data.length * 0.75 >= file.size) { done(null); return; }
        done({ name: String(file.name || 'صورة').replace(/\.[^.]+$/, '') + '.jpg', mime: 'image/jpeg', data: data, size: Math.round(data.length * 0.75) });
      } catch (e) { done(null); }
    };
    img.onerror = function () { done(null); };
    img.src = url;
  });
}
function readFile(file) {
  return shrinkImage(file).then(function (small) {
    if (small) return small;
    return new Promise(function (resolve, reject) {
      if (file.size > C().MAX_FILE_BYTES) { reject(new Error('حجم «' + file.name + '» أكبر من 10 ميجابايت')); return; }
      var r = new FileReader();
      r.onload = function () { resolve({ name: file.name, mime: file.type || guessMime(file.name), data: r.result }); };
      r.onerror = function () { reject(new Error('تعذرت قراءة الملف')); };
      r.readAsDataURL(file);
    });
  });
}
/* رفع عدة ملفات بالتوازي (طلب لكل ملف) بدل طلب واحد كبير */
function uploadAll(list, path) {
  return Promise.all(list.map(function (f) { return call('uploadFiles', { files: [f], path: path }); })).then(function (parts) { return [].concat.apply([], parts); });
}
var _jszip = null;
function loadScript(src) { return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = function () { rej(new Error('تعذر تحميل ' + src)); }; document.head.appendChild(s); }); }
function readXlsx(file) {
  _jszip = _jszip || (window.JSZip ? Promise.resolve() : loadScript('vendor/jszip.min.js'));
  return _jszip.then(function () { return file.arrayBuffer ? file.arrayBuffer() : new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsArrayBuffer(file); }); })
    .then(function (buf) { return window.XlsxLite.read(buf); });
}
function guessMime(n) { n = String(n).toLowerCase(); if (/\.pdf$/.test(n)) return 'application/pdf'; if (/\.xlsx$/.test(n)) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; if (/\.docx$/.test(n)) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; if (/\.(jpe?g)$/.test(n)) return 'image/jpeg'; if (/\.png$/.test(n)) return 'image/png'; return ''; }

/* ---------- حسابات ---------- */
function entriesFor(ownerType, teacherId, n) {
  return S.d.entries.filter(function (e) { return e.ownerType === ownerType && (ownerType === 'senior' || String(e.teacherId) === String(teacherId)) && (n == null || String(e.indicatorNo) === String(n)); });
}
function qualityLetters(es) {
  var out = [];
  if (!es.length) return out;
  out.push('A');
  if (es.some(function (e) { return (e.files || []).length || (e.links || []).length; })) out.push('B');
  if (es.some(function (e) { return e.results || e.after || e.beneficiaries; })) out.push('C');
  if (es.some(function (e) { return e.impact || (e.before && e.after); })) out.push('D');
  var m = {}; es.forEach(function (e) { if (e.date) m[String(e.date).slice(0, 7)] = 1; });
  if (Object.keys(m).length >= 2) out.push('E');
  return out;
}
function teacherIndPct(tid, n) { return qualityLetters(entriesFor('teacher', tid, n)).length * 20; }
function teacherPct(tid) { var s = 0; C().TEACHER_INDICATORS.forEach(function (ind) { s += teacherIndPct(tid, ind.n); }); return Math.round(s / C().TEACHER_INDICATORS.length); }
function seniorAuto() {
  var d = S.d, v = d.visits.filter(function (x) { return x.status !== 'removed'; });
  var parentIds = d.forms.filter(function (f) { return f.audience === 'parents'; }).map(function (f) { return f.id; });
  var fm = {}; d.followups.forEach(function (f) { fm[f.month] = 1; });
  return {
    meetings: d.meetings.length, supervisory: v.filter(function (x) { return x.type === 'supervisory'; }).length,
    exchange: v.filter(function (x) { return x.type === 'exchange'; }).length,
    profdev: d.profdev.filter(function (x) { return x.done === true || x.done === 'true'; }).length,
    teacherForms: d.forms.filter(function (f) { return f.audience !== 'parents'; }).length,
    grades: d.grades.length, followups: Object.keys(fm).length, platform: d.forms.length + d.responses.length > 0 ? 1 : 0,
    parents: d.responses.filter(function (r) { return parentIds.indexOf(r.formId) >= 0 && r.status !== 'removed'; }).length
  };
}
function seniorItemPct(item, auto) {
  var x = entriesFor('senior', null, item.n).length;
  item.auto.forEach(function (k) { if (auto[k] > 0) x++; });
  return Math.min(100, Math.round(x / 3 * 100));
}
function statusChip(p) {
  if (p >= 100) return '<span class="chip c-ok">مكتمل</span>';
  if (p >= 60) return '<span class="chip c-blue">قيد التوثيق</span>';
  if (p > 0) return '<span class="chip c-warn">يحتاج أدلة</span>';
  return '<span class="chip c-gray">لم يبدأ</span>';
}
function qHtml(letters) { return '<span class="q" aria-label="جودة الدليل: ' + letters.length + ' من 5">' + ['A', 'B', 'C', 'D', 'E'].map(function (l) { return '<span class="' + (letters.indexOf(l) >= 0 ? 'on' : '') + '">' + l + '</span>'; }).join('') + '</span>'; }
function newResponses() { return S.d.responses.filter(function (r) { return r.status === 'new'; }); }
function formById(id) { return byId(S.d.forms, id); }
function exchangeForm() { return S.d.forms.filter(function (f) { return f.template === 'exchange'; })[0]; }

/* ---------- التنقل ---------- */
var ROOTS = ['home', 'teachers', 'inbox', 'more'];
function go(view, p) { if (ROOTS.indexOf(view) >= 0) S.stack = []; else S.stack.push({ view: S.view, p: S.p }); S.view = view; S.p = p || {}; render(); window.scrollTo(0, 0); }
function back() { var prev = S.stack.pop(); if (prev) { S.view = prev.view; S.p = prev.p; } else { S.view = 'home'; S.p = {}; } render(); window.scrollTo(0, 0); }

/* ---------- الهيكل ---------- */
function shell(title, sub, body, opts) {
  opts = opts || {};
  var nb = newResponses().length;
  var root = ROOTS.indexOf(S.view) >= 0;
  var navBtn = function (v, label, icon, badge) {
    var cur = S.view === v || (!root && ROOTS.indexOf(v) >= 0 && rootOf(S.view) === v);
    return '<button type="button" data-act="nav" data-v="' + v + '"' + (cur ? ' aria-current="page"' : '') + '>' + ic(icon, 22) + '<span>' + label + '</span>' + (badge ? '<span class="badge">' + badge + '</span>' : '') + '</button>';
  };
  return '<div class="shell"><nav class="nav" aria-label="التنقل الرئيسي"><div class="brand"><span class="logo">' + ic('logo', 22, '#fff') + '</span>بصمة التميّز</div>' +
    navBtn('home', 'خريطتي', 'home') + navBtn('teachers', 'المعلمات', 'users') + navBtn('inbox', 'الوارد', 'inbox', nb) + navBtn('more', 'المزيد', 'grid') + '</nav>' +
    '<div class="main"><header class="topbar">' + (root ? '<span class="logo" aria-hidden="true">' + ic('logo', 22, '#fff') + '</span>' : '<button type="button" class="iconbtn" data-act="back" aria-label="رجوع">' + ic('back') + '</button>') +
    '<div class="t">' + (sub ? '<span class="sub">' + esc(sub) + '</span>' : '') + '<h1>' + esc(title) + '</h1></div>' + (opts.right || '') + '</header>' +
    '<main class="page">' + body + '</main></div></div>';
}
function rootOf(v) {
  if (['teacher', 'indicator', 'teacherEdit'].indexOf(v) >= 0 && S.p.ownerType !== 'senior') return 'teachers';
  if (['response'].indexOf(v) >= 0) return 'inbox';
  if (v === 'indicator' || v === 'entry') return S.p.ownerType === 'senior' ? 'home' : 'teachers';
  return 'more';
}

function render() {
  if (!S.token) { appEl.innerHTML = loginView(); var p = document.getElementById('pw'); if (p) p.focus(); return; }
  if (!S.d) { appEl.innerHTML = '<div class="login"><div class="spinner" role="status" aria-label="جارٍ التحميل"></div></div>'; return; }
  var fn = V[S.view] || V.home;
  try { appEl.innerHTML = fn(S.p); }
  catch (e) { console.error(e); appEl.innerHTML = shell('خطأ', '', '<div class="note warn">حدث خطأ في عرض الصفحة: ' + esc(e.message) + '</div>'); }
  var af = appEl.querySelector('[data-autofocus]'); if (af) af.focus();
}

function loginView() {
  return '<div class="login"><form class="box" data-form="login"><div style="display:flex;align-items:center;gap:12px"><span class="logo" style="width:52px;height:52px;border-radius:15px">' + ic('logo', 28, '#fff') + '</span><div><h1 style="font-size:22px">بصمة التميّز</h1><p class="muted small">منصة الأداء والأثر للمعلم الأول</p></div></div>' +
    '<div class="card"><label class="field">كلمة المرور<input id="pw" class="in" type="password" autocomplete="current-password" required></label><button class="btn pri block" type="submit">دخول</button></div>' +
    '<p class="muted xs" style="text-align:center">«أوثّق ممارستي، أقيس أثرها، وأقود التغيير.»</p></form></div>';
}

function load() {
  return run(call('bootstrap')).then(function (d) { S.d = d; render(); });
}

/* ================================================================== */
/*                              الشاشات                               */
/* ================================================================== */
var V = {};

/* ---------- خريطتي (المعلمة الأولى) ---------- */
V.home = function () {
  var auto = seniorAuto(), items = C().SENIOR_ITEMS;
  var pcts = items.map(function (it) { return seniorItemPct(it, auto); });
  var overall = Math.round(pcts.reduce(function (a, b) { return a + b; }, 0) / items.length);
  var weak = items.map(function (it, i) { return { it: it, p: pcts[i] }; }).filter(function (x) { return x.p < 50; }).slice(0, 3);
  var groups = [];
  items.forEach(function (it, i) { var g = groups[groups.length - 1]; if (!g || g.name !== it.criterion) { g = { name: it.criterion, items: [] }; groups.push(g); } g.items.push({ it: it, p: pcts[i] }); });
  var nb = newResponses().length;
  var b = '<section class="hero"><span class="lbl">جاهزية ملفك للزيارة الإشرافية · 14 بنداً</span><div style="display:flex;align-items:flex-end;gap:10px"><span class="big">' + overall + '٪</span></div>' +
    '<div class="hbar"><span style="width:' + overall + '%"></span></div><p>كل ما تُنجزينه في المنصة يُحسب دليلاً تلقائياً: الزيارات، الاجتماعات، تحليل النتائج، النماذج، الاستبيانات.</p>' +
    '<div class="btns"><button class="btn" type="button" data-act="newEntry" data-owner="senior" style="background:#fff;color:var(--pri-d);border-color:#fff">' + ic('plus', 18) + 'توثيق إنجاز</button><a class="btn" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.45)" target="_blank" rel="noopener" href="' + attr(printUrl('senior')) + '">' + ic('print', 18) + 'تقرير ملفي</a></div></section>';
  b += '<section class="quick" aria-label="إجراءات سريعة">' +
    '<button type="button" class="pri" data-act="go" data-v="formNew">' + ic('link', 22) + 'نموذج جديد</button>' +
    '<button type="button" data-act="go" data-v="visits">' + ic('eye', 22, 'var(--pri)') + 'الزيارات</button>' +
    '<button type="button" data-act="go" data-v="grades">' + ic('chart', 22, 'var(--pri)') + 'النتائج</button>' +
    '<button type="button" data-act="go" data-v="register">' + ic('book', 22, 'var(--pri)') + 'السجل</button></section>';
  if (nb) b += '<button type="button" class="note warn" data-act="nav" data-v="inbox" style="border:0;text-align:right;cursor:pointer;font-family:inherit">لديكِ <b>' + nb + '</b> ' + (nb === 1 ? 'رد جديد' : 'ردود جديدة') + ' في صندوق الوارد ›</button>';
  if (weak.length) b += '<section class="card"><h2>يحتاج انتباهك</h2>' + weak.map(function (w) { return '<button type="button" class="row" style="border-radius:12px;background:var(--amb-s);border:0" data-act="indicator" data-owner="senior" data-n="' + w.it.n + '"><span class="circle" style="background:#fff;border:0">' + w.it.n + '</span><span class="grow"><span class="ttl">' + esc(w.it.text) + '</span><span class="small muted">الجاهزية ' + w.p + '٪ – أضيفي أدلة</span></span>' + ic('chev', 18) + '</button>'; }).join('') + '</section>';
  b += '<div class="secttl"><div><h2 style="font-size:18px">خريطة بنودي</h2><p class="small muted">استمارة الزيارة الإشرافية لمعلم أول مجال/مادة</p></div></div>';
  groups.forEach(function (g) {
    b += '<section class="card flush"><h3 style="padding:12px 16px;background:#FCF9FB;border-bottom:1px solid var(--line2)">' + esc(g.name) + '</h3>' + g.items.map(function (x) {
      var chips = x.it.auto.map(function (k) { var n = auto[k] || 0; return '<span class="chip ' + (n ? 'c-ok' : 'c-gray') + '">' + esc(C().AUTO_SOURCES[k]) + (k === 'platform' ? '' : ' (' + n + ')') + '</span>'; });
      var man = entriesFor('senior', null, x.it.n).length;
      if (man) chips.push('<span class="chip c-blue">أدلة موثقة (' + man + ')</span>');
      if (!chips.length) chips.push('<span class="chip c-warn">يُوثّق يدوياً</span>');
      return '<button type="button" class="row" data-act="indicator" data-owner="senior" data-n="' + x.it.n + '"><span class="circle">' + x.it.n + '</span><span class="grow"><span class="ttl">' + esc(x.it.text) + '</span><span class="chips">' + chips.join('') + '</span></span><span class="num" style="font-weight:700;color:' + (x.p >= 70 ? 'var(--pri-t)' : x.p >= 40 ? 'var(--ink)' : 'var(--red)') + '">' + x.p + '٪</span></button>';
    }).join('') + '</section>';
  });
  return shell('خريطتي', S.d.settings.seniorName + ' · ' + S.d.settings.currentYear, b);
};

/* ---------- المعلمات ---------- */
V.teachers = function () {
  var q = (S.temp.tq || '').trim();
  var openForms = S.d.forms.filter(function (f) { return f.open !== false && f.audience !== 'parents'; });
  var act = activeTeachers();
  var b = '<section class="quick" aria-label="إجراءات سريعة"><button type="button" class="pri" data-act="go" data-v="formNew">' + ic('link', 22) + 'نموذج جديد</button><button type="button" data-act="go" data-v="visits">' + ic('eye', 22, 'var(--pri)') + 'الزيارات</button><button type="button" data-act="go" data-v="grades">' + ic('chart', 22, 'var(--pri)') + 'النتائج</button><button type="button" data-act="newEntry" data-owner="teacher">' + ic('plus', 22, 'var(--pri)') + 'توثيق إنجاز</button></section>';
  if (openForms.length) {
    b += '<section class="card"><div class="card-h"><h2>النماذج المفتوحة</h2><button type="button" class="btn sm" data-act="go" data-v="forms">كل النماذج</button></div>' + openForms.slice(0, 4).map(function (f) {
      var sent = submittedIds(f).length, tot = act.length;
      return '<button type="button" class="row" style="padding:10px 0" data-act="form" data-id="' + f.id + '"><span class="grow"><span class="ttl">' + esc(f.title) + '</span><span class="bar"><span style="width:' + (tot ? Math.round(sent / tot * 100) : 0) + '%"></span></span><span class="small" style="color:var(--amb)">لم ترسل: ' + (tot - sent) + ' معلمة' + (f.deadline ? ' · الموعد ' + fmtDate(f.deadline) : '') + '</span></span><span class="num" style="font-weight:700">' + sent + '/' + tot + '</span></button>';
    }).join('') + '</section>';
  }
  var list = act.filter(function (t) { return !q || t.name.indexOf(q) >= 0; });
  b += '<div class="secttl"><h2 style="font-size:18px">ملفات المعلمات <span class="muted num" style="font-size:13px">(' + act.length + ')</span></h2><button type="button" class="btn sm" data-act="go" data-v="teacherEdit">' + ic('plus', 16) + 'إضافة</button></div>' +
    '<label class="field"><span class="sr">بحث</span><input id="tq" class="in" type="search" placeholder="بحث باسم المعلمة" value="' + attr(q) + '" data-input="tq"></label>' +
    '<section class="card flush" id="tlist">' + teacherRows(list) + '</section>';
  return shell('المعلمات', S.d.settings.fieldName, b);
};
function teacherRows(list) {
  if (!list.length) return '<p class="empty">لا توجد نتائج</p>';
  return list.map(function (t, i) {
    var p = teacherPct(t.id), pal = PAL[i % 4];
    return '<button type="button" class="row" data-act="teacher" data-id="' + t.id + '"><span class="avatar" style="background:' + pal[0] + ';color:' + pal[1] + '" aria-hidden="true">' + esc(t.name.charAt(0)) + '</span><span class="grow"><span class="ttl ellipsis">' + esc(t.name) + '</span><span class="bar"><span style="width:' + p + '%"></span></span>' + (t.subject || t.grades ? '<span class="xs muted">' + esc([t.subject, t.grades].filter(Boolean).join(' · ')) + '</span>' : '') + '</span><span class="num" style="font-weight:700;width:42px;text-align:left">' + p + '٪</span></button>';
  }).join('');
}
function submittedIds(f) {
  var ids = {};
  S.d.responses.forEach(function (r) { if (r.formId === f.id && r.status !== 'removed') { if (f.template === 'exchange') { if (r.values && r.values.visitor) ids[r.values.visitor] = 1; } else if (r.teacherId) ids[r.teacherId] = 1; } });
  return Object.keys(ids);
}

/* ---------- ملف معلمة (13 مؤشراً) ---------- */
V.teacher = function (p) {
  var t = byId(S.d.teachers, p.id);
  if (!t) return shell('غير موجود', '', '<p class="empty">المعلمة غير موجودة</p>');
  var overall = teacherPct(t.id), all = entriesFor('teacher', t.id);
  var complete = C().TEACHER_INDICATORS.filter(function (ind) { return teacherIndPct(t.id, ind.n) >= 100; }).length;
  var b = '<section class="hero"><span class="lbl">جاهزية ملف المعلمة · 13 مؤشراً</span><span class="big">' + overall + '٪</span><div class="hbar"><span style="width:' + overall + '%"></span></div><p>' + complete + ' من 13 مؤشراً مكتمل التوثيق · ' + all.length + ' إنجازاً موثقاً</p>' +
    '<div class="btns"><button class="btn" type="button" data-act="newEntry" data-owner="teacher" data-tid="' + t.id + '" style="background:#fff;color:var(--pri-d);border-color:#fff">' + ic('plus', 18) + 'توثيق إنجاز</button><a class="btn" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.45)" target="_blank" rel="noopener" href="' + attr(printUrl('teacher', { id: t.id })) + '">' + ic('print', 18) + 'تقرير الاستعداد</a></div></section>';
  b += '<div style="display:flex;gap:12px;flex-wrap:wrap;font-size:11px" class="muted"><span>جودة الدليل:</span>' + C().QUALITY.map(function (q) { return '<span>' + q.l + ' ' + q.name + '</span>'; }).join('') + '</div>';
  var dom = '';
  C().TEACHER_INDICATORS.forEach(function (ind) {
    if (ind.domain !== dom) { if (dom) b += '</section>'; dom = ind.domain; b += '<section class="card flush"><h3 style="padding:12px 16px;background:#FCF9FB;border-bottom:1px solid var(--line2)">' + esc(dom) + '</h3>'; }
    var es = entriesFor('teacher', t.id, ind.n), L = qualityLetters(es), pc = L.length * 20;
    b += '<button type="button" class="row" data-act="indicator" data-owner="teacher" data-tid="' + t.id + '" data-n="' + ind.n + '"><span class="circle">' + ind.n + '</span><span class="grow"><span class="xs muted">' + esc(ind.criterion) + '</span><span class="ttl">' + esc(ind.text) + '</span><span style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' + statusChip(pc) + qHtml(L) + '</span></span><span class="num muted" style="font-weight:700">' + pc + '٪</span></button>';
  });
  b += '</section>';
  b += '<button class="btn" type="button" data-act="go" data-v="teacherEdit" data-id="' + t.id + '">تعديل بيانات المعلمة</button>';
  return shell(shortName(t.name), [t.subject, t.grades].filter(Boolean).join(' · ') || 'ملف المعلمة', b);
};

/* ---------- صفحة مؤشر/بند ---------- */
V.indicator = function (p) {
  var senior = p.ownerType === 'senior';
  var list = senior ? C().SENIOR_ITEMS : C().TEACHER_INDICATORS;
  var ind = list.filter(function (x) { return String(x.n) === String(p.n); })[0];
  if (!ind) return shell('غير موجود', '', '');
  var es = entriesFor(p.ownerType, p.tid, ind.n);
  var a = S.d.assess.filter(function (x) { return x.ownerType === p.ownerType && String(x.teacherId || '') === String(senior ? '' : p.tid) && String(x.indicatorNo) === String(ind.n); })[0] || {};
  var checks = a.checks || [];
  var b = '<section class="card"><p class="small muted">' + esc(senior ? 'القيادة والإدارة والحوكمة › ' + ind.criterion : ind.domain + ' › ' + ind.criterion) + '</p><h1 style="font-size:19px">' + esc(ind.text) + '</h1>';
  if (!senior) b += '<div class="note info"><b>ماذا يُنظر إليه؟</b> ' + esc(ind.hint) + '</div>';
  b += '</section>';
  if (senior) {
    var auto = seniorAuto();
    b += '<section class="card"><h2>ماذا أوثّق هنا؟</h2><p class="small muted">ممارسات البند كما في تفاصيل الاستمارة. علّمي ما نُفّذ:</p>' + ind.practices.map(function (pr, i) { return '<label class="check"><input type="checkbox" data-act="check" data-i="' + i + '"' + (checks[i] ? ' checked' : '') + '><span>' + esc(pr) + '</span></label>'; }).join('') + '</section>';
    if (ind.auto.length) b += '<section class="card"><h2>أدلة تلقائية من المنصة</h2><div class="chips">' + ind.auto.map(function (k) { return '<span class="chip ' + (auto[k] ? 'c-ok' : 'c-gray') + '">' + esc(C().AUTO_SOURCES[k]) + (k === 'platform' ? (auto[k] ? ' ✓' : '') : ': ' + (auto[k] || 0)) + '</span>'; }).join('') + '</div></section>';
  } else {
    b += '<section class="card"><h2>التقييم الذاتي</h2><p class="small muted">قواعد التقييم من الاستمارة. للاستعداد فقط – التقدير النهائي للمشرف.</p>' + C().LEVELS.map(function (L, i) {
      return '<button type="button" class="lvl" data-act="level" data-l="' + L.n + '" aria-pressed="' + (String(a.level) === String(L.n)) + '"><span class="n">' + L.n + '</span><span><b style="font-size:14px">' + esc(L.name) + '</b><br><span class="small" style="color:#4E3E49">' + esc(ind.rubric[i]) + '</span></span></button>';
    }).join('') + '</section>';
    var L2 = qualityLetters(es);
    b += '<section class="card"><h2>جودة الدليل</h2><div class="grid3" style="grid-template-columns:repeat(5,1fr)">' + C().QUALITY.map(function (q) { var on = L2.indexOf(q.l) >= 0; return '<div style="border-radius:12px;padding:10px 4px;text-align:center;background:' + (on ? 'var(--pri)' : 'var(--line2)') + ';color:' + (on ? '#fff' : 'var(--muted)') + '"><b class="num">' + q.l + '</b><br><span class="xs">' + q.name + '</span></div>'; }).join('') + '</div><p class="xs muted">تُحسب تلقائياً: A وجود إنجاز · B أدلة مرفقة · C نتائج أو مستفيدون · D أثر أو قبل/بعد · E استمرار في شهرين أو أكثر.</p></section>';
    b += '<section class="card"><div class="card-h"><h2>قائمة المراجعة</h2><span class="num" style="color:var(--pri);font-weight:700">' + checks.filter(Boolean).length + '/8</span></div>' + C().CHECKLIST.map(function (c, i) { return '<label class="check"><input type="checkbox" data-act="check" data-i="' + i + '"' + (checks[i] ? ' checked' : '') + '><span>' + esc(c) + '</span></label>'; }).join('') + '</section>';
  }
  b += '<div class="secttl"><h2>الإنجازات والأدلة <span class="num muted">(' + es.length + ')</span></h2></div>';
  b += es.length ? '<section class="card flush">' + es.map(entryRow).join('') + '</section>' : '<p class="empty">لا توجد أدلة بعد لهذا ' + (senior ? 'البند' : 'المؤشر') + '.</p>';
  b += '<button class="btn pri block" type="button" data-act="newEntry" data-owner="' + p.ownerType + '" data-tid="' + (p.tid || '') + '" data-n="' + ind.n + '">' + ic('plus', 18) + 'توثيق إنجاز لهذا ' + (senior ? 'البند' : 'المؤشر') + '</button>';
  return shell((senior ? 'البند ' : 'المؤشر ') + ind.n, senior ? 'خريطتي' : tname(p.tid), b);
};
function entryRow(e) {
  var nf = (e.files || []).length + (e.links || []).length;
  return '<button type="button" class="row" data-act="entry" data-id="' + e.id + '"><span class="avatar" style="background:#EADDE5;border-radius:12px" aria-hidden="true">' + ic('file', 20, '#5F4D59') + '</span><span class="grow"><span class="ttl">' + esc(e.title) + '</span><span class="small muted">' + esc([e.type, fmtDate(e.date), nf ? nf + ' دليل' : 'بلا أدلة', e.source === 'form' ? 'من نموذج' : ''].filter(Boolean).join(' · ')) + '</span></span><span class="chip ' + (e.status === 'تم قياس الأثر' || e.status === 'مكتمل' ? 'c-ok' : e.status === 'يحتاج استكمال الأدلة' ? 'c-warn' : 'c-blue') + '">' + esc(e.status || 'قيد التنفيذ') + '</span></button>';
}

/* ---------- بطاقة توثيق إنجاز ---------- */
V.entry = function (p) {
  var e = p.id ? byId(S.d.entries, p.id) : null;
  if (p.id && !e) return shell('غير موجود', '', '');
  var st = S.temp.entry;
  if (!st || st.key !== (p.id || 'new')) {
    e = e || { ownerType: p.ownerType || 'teacher', teacherId: p.tid || '', indicatorNo: p.n || '', type: '', role: '', status: 'قيد التنفيذ', files: [], links: [], date: today() };
    st = S.temp.entry = { key: p.id || 'new', files: (e.files || []).slice(), links: (e.links || []).slice(), owner: e.ownerType === 'senior' ? 'senior' : (e.teacherId || '') };
  }
  var e0 = e || {};
  var ownerSenior = st.owner === 'senior';
  var inds = ownerSenior ? C().SENIOR_ITEMS : C().TEACHER_INDICATORS;
  var ownerOpts = '<option value="senior"' + (ownerSenior ? ' selected' : '') + '>أنا (المعلمة الأولى) – بنود استمارتي</option>' + activeTeachers().map(function (t) { return '<option value="' + t.id + '"' + (String(st.owner) === String(t.id) ? ' selected' : '') + '>' + esc(t.name) + '</option>'; }).join('');
  var radio = function (name, opts, v) { return '<div class="pills" role="radiogroup">' + opts.map(function (o) { return '<label><input type="radio" name="' + name + '" value="' + attr(o) + '"' + (o === v ? ' checked' : '') + '><span>' + esc(o) + '</span></label>'; }).join('') + '</div>'; };
  var ta = function (id, label, v, ph, rows) { return '<label class="field">' + label + '<textarea id="' + id + '" class="in" rows="' + (rows || 2) + '" placeholder="' + attr(ph || '') + '">' + esc(v || '') + '</textarea></label>'; };
  var inp = function (id, label, v, ph, type) { return '<label class="field">' + label + '<input id="' + id + '" class="in" ' + numAttr(type) + ' value="' + attr(v || '') + '" placeholder="' + attr(ph || '') + '"></label>'; };
  var b = '<section class="card"><h2>1. الإنجاز والمؤشر</h2>' +
    '<label class="field">صاحبة الإنجاز<select id="e_owner" class="in" data-change="owner">' + ownerOpts + '</select></label>' +
    inp('e_title', 'اسم الإنجاز', e0.title, 'مثال: أربعة في أربعة – مدرسة الصراط') +
    '<div class="field">النوع' + radio('e_type', C().ENTRY_TYPES, e0.type) + '</div>' +
    '<label class="field">' + (ownerSenior ? 'البند في استمارة المعلم الأول' : 'المؤشر في الاستمارة') + '<select id="e_ind" class="in"><option value="">اختاري…</option>' + inds.map(function (x) { return '<option value="' + x.n + '"' + (String(x.n) === String(e0.indicatorNo) ? ' selected' : '') + '>' + x.n + ' · ' + esc(x.text) + '</option>'; }).join('') + '</select></label>' +
    inp('e_date', 'التاريخ', e0.date || today(), '', 'date') + '</section>';
  b += '<section class="card"><h2>2. التنفيذ</h2>' + ta('e_goal', 'الهدف', e0.goal, 'ما الذي أردتِ تحقيقه؟') + ta('e_desc', 'وصف التنفيذ', e0.description, 'الخطوات، المدة، الأدوات', 3) +
    '<div class="field">الدور' + radio('e_role', C().ROLES, e0.role) + '</div>' + inp('e_target', 'الفئة المستهدفة', e0.target, 'مثال: طالبات الصف الثالث (3 شعب)') +
    '<div class="grid2">' + inp('e_ben', 'الطلبة المستفيدون', e0.beneficiaries, '', 'number') + inp('e_tot', 'إجمالي الطلبة', e0.total, '', 'number') + '</div><div id="ratioBox">' + ratioHtml(e0.beneficiaries, e0.total) + '</div>' +
    '<details' + (e0.timeline || e0.mechanism || e0.impactMeasure || e0.type === 'مبادرة' ? ' open' : '') + '><summary class="small" style="cursor:pointer;color:var(--pri);font-weight:600">حقول المبادرة (الخطة الزمنية، آلية التنفيذ، قياس الأثر)</summary><div style="display:flex;flex-direction:column;gap:12px;margin-top:12px">' +
    ta('e_timeline', 'الخطة الزمنية', e0.timeline) + ta('e_mech', 'آلية التنفيذ', e0.mechanism) + ta('e_im', 'آلية قياس الأثر', e0.impactMeasure) + '</div></details></section>';
  b += '<section class="card"><h2>3. الأدلة</h2><label class="dash">' + ic('upload', 18) + 'رفع صور أو PDF أو ملفات<input type="file" multiple accept="image/*,application/pdf,.docx,.xlsx,.pptx" data-change="entryFiles"></label>' +
    '<div id="filesBox" style="display:flex;flex-direction:column;gap:8px">' + filesHtml(st) + '</div>' +
    '<div class="grid2" style="grid-template-columns:1fr auto"><input id="e_link" class="in" type="url" placeholder="رابط فيديو أو ملف (Drive / YouTube)" aria-label="رابط"><button type="button" class="btn sm" data-act="addLink">إضافة</button></div>' +
    '<p class="xs muted">الفيديو يُضاف رابطاً. صور الطلبة بيانات قاصرين – يُفضّل صور لا تُظهر الوجوه أو بموافقة ولي الأمر.</p></section>';
  b += '<section class="card"><h2>4. النتائج والأثر</h2><div class="grid2">' + inp('e_before', 'قبل', e0.before, 'مثال: 52٪ إتقان') + inp('e_after', 'بعد', e0.after, 'مثال: 81٪ إتقان') + '</div>' + ta('e_results', 'النتائج', e0.results, 'ما الذي تحقق فعلاً؟') + ta('e_impact', 'الأثر', e0.impact, 'ما الذي تغيّر في تعلم الطلبة أو ممارسة الفريق؟') + '</section>';
  b += '<section class="card"><h2>5. التأمل المهني</h2>' + ta('e_why', 'لماذا؟', e0.why, 'الحاجة التي دفعت للإنجاز') + ta('e_what', 'ماذا؟', e0.what, 'ما الذي نُفّذ باختصار') + ta('e_next', 'ما الأثر وما التطوير القادم؟', e0.next) + (ownerSenior ? '' : ta('e_opinion', 'الرأي الفني للمعلمة الأولى', e0.opinion)) + '</section>';
  b += '<section class="card"><h2>6. الحالة</h2>' + radio('e_status', C().ENTRY_STATUS, e0.status || 'قيد التنفيذ') + '</section>';
  b += '<div class="btns">' + (p.id ? '<button class="btn danger" type="button" data-act="delEntry" data-id="' + p.id + '">' + ic('trash', 18) + 'حذف</button>' : '') + '<button class="btn pri" type="button" data-act="saveEntry" data-id="' + (p.id || '') + '" style="flex:2">حفظ الإنجاز</button></div>';
  return shell(p.id ? 'تعديل إنجاز' : 'توثيق إنجاز', e0.source === 'form' ? 'من رد نموذج' : 'يُحفظ في حساب المعلمة الأولى', b);
};
function ratioHtml(b, t) {
  b = Number(b); t = Number(t);
  if (!b || !t) return '<p class="xs muted">أدخلي المستفيدين والإجمالي لمعرفة أقرب وصف في قواعد التقييم.</p>';
  var r = Math.min(100, Math.round(b / t * 100)), w, l;
  if (r >= 90) { w = 'جميع'; l = 'متميز'; } else if (r >= 75) { w = 'معظم'; l = 'جيد'; } else if (r >= 50) { w = 'أغلب'; l = 'ملائم'; } else if (r >= 25) { w = 'قليل من'; l = 'غير ملائم'; } else { w = 'عدد نادر من'; l = 'يحتاج إلى تدخل'; }
  return '<div class="note info" style="display:flex;gap:10px;align-items:center"><b class="num" style="font-size:20px;color:var(--pri)">' + r + '٪</b><span>أقرب وصف: <b>' + w + '</b> الطلبة ← ' + l + ' <span class="muted">(تقدير استرشادي)</span></span></div>';
}
function filesHtml(st) {
  var all = st.files.map(function (f, i) { return { k: 'f', i: i, name: f.name || 'ملف', url: f.url }; }).concat(st.links.map(function (l, i) { return { k: 'l', i: i, name: l, url: l }; }));
  if (!all.length) return '';
  return all.map(function (x) { return '<div class="file">' + ic(x.k === 'l' ? 'link' : 'file', 18, '#5F4D59') + '<a class="grow ellipsis" target="_blank" rel="noopener" href="' + attr(x.url) + '">' + esc(x.name) + '</a><button type="button" class="iconbtn" style="width:36px;height:36px" aria-label="إزالة" data-act="rmFile" data-k="' + x.k + '" data-i="' + x.i + '">' + ic('trash', 16) + '</button></div>'; }).join('');
}

/* ---------- صندوق الوارد ---------- */
V.inbox = function () {
  var tab = S.tab.inbox || 'new';
  var rs = S.d.responses.filter(function (r) { var f = formById(r.formId); return !f || f.audience !== 'parents'; });
  var groups = { new: rs.filter(function (r) { return r.status === 'new'; }), more: rs.filter(function (r) { return r.status === 'more'; }), done: rs.filter(function (r) { return r.status === 'accepted' || r.status === 'removed'; }) };
  var list = groups[tab].slice().sort(function (a, b) { return String(b.createdAt) < String(a.createdAt) ? -1 : 1; });
  var b = '<div class="tabs" role="tablist">' + [['new', 'جديد'], ['more', 'بانتظار الاستكمال'], ['done', 'تمت معالجته']].map(function (t) { return '<button type="button" role="tab" aria-selected="' + (tab === t[0]) + '" data-act="tab" data-k="inbox" data-v="' + t[0] + '">' + t[1] + ' <span class="num">(' + groups[t[0]].length + ')</span></button>'; }).join('') + '</div>';
  b += list.length ? list.map(responseCard).join('') : '<p class="empty">' + (tab === 'new' ? 'لا توجد ردود جديدة. أرسلي رابط نموذج للمعلمات من «النماذج».' : 'لا يوجد شيء هنا.') + '</p>';
  return shell('صندوق الوارد', 'ردود المعلمات من روابط النماذج', b);
};
function responseSummary(r, f) {
  var v = r.values || {}, parts = [];
  if (f && f.template === 'exchange') {
    return 'زارت: ' + (tname(v.visited) || '—') + ' · الصف ' + (v.cls || '') + ' · ' + (v.subject || '') + ' · الحصة ' + (v.period || '') + (v.topic ? ' · ' + v.topic : '');
  }
  ((f && f.fields) || []).forEach(function (fl) { if (['text', 'textarea', 'select', 'radio', 'number'].indexOf(fl.type) >= 0 && v[fl.id] && parts.length < 3) parts.push(String(v[fl.id]).slice(0, 90)); });
  return parts.join(' · ');
}
function responseCard(r) {
  var f = formById(r.formId) || { title: 'نموذج محذوف', fields: [] };
  var who = r.teacherName || tname(r.teacherId) || '—';
  var b = '<article class="card"><div class="card-h"><span class="chip c-blue">' + esc(f.title) + '</span><span class="small muted">' + esc(fmtDate(r.createdAt)) + '</span></div>' +
    '<button type="button" class="row" style="padding:0;border:0" data-act="response" data-id="' + r.id + '"><span class="grow"><span class="ttl">' + esc(who) + '</span><span class="small" style="color:#4E3E49">' + esc(responseSummary(r, f)) + '</span></span>' + ic('chev', 18) + '</button>';
  if ((r.files || []).length) b += '<div class="chips">' + r.files.map(function (x) { return '<a class="chip c-gray" target="_blank" rel="noopener" href="' + attr(x.url) + '">' + ic('file', 14) + esc(x.name) + '</a>'; }).join('') + '</div>';
  if (r.status === 'new' || r.status === 'more') {
    var defInd = f.indicatorNo || '';
    b += '<div style="display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--line2);padding-top:10px">' +
      (r.status === 'more' && r.note ? '<div class="note warn"><b>طُلب استكمال:</b> ' + esc(r.note) + '</div>' : '') +
      '<label class="field" style="font-size:12px">يُضاف دليلاً لمؤشر المعلمة<select class="in" id="ind_' + r.id + '"><option value="">بدون مؤشر</option>' + C().TEACHER_INDICATORS.map(function (x) { return '<option value="' + x.n + '"' + (String(x.n) === String(defInd) ? ' selected' : '') + '>' + x.n + ' · ' + esc(x.text) + '</option>'; }).join('') + '</select></label>' +
      '<div class="btns"><button type="button" class="btn pri sm" data-act="respond" data-a="accept" data-id="' + r.id + '" style="flex:2">قبول وإضافة</button><button type="button" class="btn warn sm" data-act="askMore" data-id="' + r.id + '">طلب استكمال</button><button type="button" class="btn danger sm" style="flex:0 0 44px;padding:0" aria-label="حذف الرد" data-act="respond" data-a="remove" data-id="' + r.id + '">' + ic('trash', 16) + '</button></div></div>';
  } else {
    b += '<div class="card-h"><span class="chip ' + (r.status === 'accepted' ? 'c-ok' : 'c-gray') + '">' + (r.status === 'accepted' ? 'أُضيف دليلاً في ملف المعلمة' : 'محذوف') + '</span><button type="button" class="btn sm" data-act="respond" data-a="restore" data-id="' + r.id + '">تراجع</button></div>';
  }
  return b + '</article>';
}
V.response = function (p) {
  var r = byId(S.d.responses, p.id);
  if (!r) return shell('غير موجود', '', '');
  var f = formById(r.formId) || { title: '', fields: [] };
  var v = r.values || {};
  var b = '<section class="card"><p class="small muted">' + esc(f.title) + ' · ' + esc(fmtDate(r.createdAt)) + '</p><h2>' + esc(r.teacherName || tname(r.teacherId) || '—') + '</h2></section><section class="card">';
  (f.fields || []).forEach(function (fl) {
    var x = v[fl.id];
    if (fl.type === 'file') { var fs = (r.files || []); if (fs.length) b += '<div class="field">' + esc(fl.label) + fs.map(function (z) { return '<a class="file" target="_blank" rel="noopener" href="' + attr(z.url) + '">' + ic('file', 18) + esc(z.name) + '</a>'; }).join('') + '</div>'; return; }
    if (fl.type === 'grid') {
      var ans = (x && x.answers) || [], notes = (x && x.notes) || [];
      b += '<div class="field">' + esc(fl.label) + '<div class="tablewrap"><table class="table"><thead><tr><th>العنصر</th><th>التقدير</th><th>ملاحظة</th></tr></thead><tbody>' + (fl.rows || []).map(function (row, i) { return '<tr><td>' + esc(row) + '</td><td>' + esc(ans[i] != null ? fl.options[ans[i]] : '—') + '</td><td>' + esc(notes[i] || '') + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
      return;
    }
    if (fl.type === 'table') {
      if (Array.isArray(x) && x.length) b += '<div class="field">' + esc(fl.label) + '<div class="tablewrap"><table class="table"><thead><tr>' + (fl.columns || []).map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + x.map(function (row) { return '<tr>' + row.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div></div>';
      return;
    }
    if (fl.type === 'section') { b += '<h3 style="margin:6px 0 0">' + esc(fl.label) + '</h3>'; return; }
    if (x === undefined || x === '') return;
    var shown = fl.type === 'teacher' ? tname(x) : fl.type === 'link' ? '<a target="_blank" rel="noopener" href="' + attr(x) + '">' + esc(x) + '</a>' : esc(x);
    b += '<div class="field">' + esc(fl.label) + '<span style="font-weight:400;white-space:pre-line">' + (fl.type === 'link' ? shown : shown) + '</span></div>';
  });
  b += '</section>';
  if (f.template === 'exchange') { var vis = S.d.visits.filter(function (z) { return z.responseId === r.id; })[0]; if (vis) b += '<a class="btn out" target="_blank" rel="noopener" href="' + attr(printUrl('visit', { id: vis.id })) + '">' + ic('print', 18) + 'طباعة الاستمارة للتوقيع</a>'; } else b += '<a class="btn out" target="_blank" rel="noopener" href="' + attr(printUrl('response', { id: r.id })) + '">' + ic('print', 18) + 'طباعة الرد</a>';
  b += responseCard(r);
  return shell('تفاصيل الرد', f.title, b);
};

/* ---------- المزيد ---------- */
V.more = function () {
  var items = [['forms', 'النماذج والروابط', 'link'], ['visits', 'الزيارات الصفية', 'eye'], ['grades', 'تحليل النتائج', 'chart'], ['register', 'سجل المعلم الأول', 'book'], ['meetings', 'الاجتماعات', 'meet'], ['followups', 'المتابعة الشهرية', 'check'], ['profdev', 'الإنماء المهني', 'cap'], ['settings', 'الإعدادات', 'gear']];
  var b = '<section class="card flush">' + items.map(function (x) { return '<button type="button" class="row" data-act="go" data-v="' + x[0] + '"><span class="avatar" style="background:var(--pri-s);border-radius:12px">' + ic(x[2], 20, 'var(--pri)') + '</span><span class="grow"><span class="ttl">' + x[1] + '</span></span>' + ic('chev', 18) + '</button>'; }).join('') + '</section>';
  b += '<p class="xs muted" style="text-align:center">بصمة التميّز ' + esc(C().APP_VERSION) + ' · WEBORA</p>';
  return shell('المزيد', S.d.settings.currentYear, b);
};

/* ---------- النماذج ---------- */
V.forms = function () {
  var fs = S.d.forms.slice().sort(function (a, b) { return String(b.createdAt) < String(a.createdAt) ? -1 : 1; });
  var b = '<button class="btn pri block" type="button" data-act="go" data-v="formNew">' + ic('plus', 18) + 'نموذج جديد</button>';
  b += fs.length ? '<section class="card flush">' + fs.map(function (f) {
    var n = S.d.responses.filter(function (r) { return r.formId === f.id && r.status !== 'removed'; }).length;
    return '<button type="button" class="row" data-act="form" data-id="' + f.id + '"><span class="avatar" style="background:' + (f.audience === 'parents' ? 'var(--blue-s)' : 'var(--pri-s)') + ';border-radius:12px">' + ic('link', 20, f.audience === 'parents' ? 'var(--blue)' : 'var(--pri)') + '</span><span class="grow"><span class="ttl">' + esc(f.title) + '</span><span class="small muted">' + (f.audience === 'parents' ? 'لأولياء الأمور' : 'للمعلمات') + ' · ' + n + ' رد' + (f.deadline ? ' · حتى ' + fmtDate(f.deadline) : '') + '</span></span><span class="chip ' + (f.open !== false ? 'c-ok' : 'c-gray') + '">' + (f.open !== false ? 'مفتوح' : 'مغلق') + '</span></button>';
  }).join('') + '</section>' : '<p class="empty">لا توجد نماذج بعد.</p>';
  return shell('النماذج والروابط', 'رابط واحد لكل موضوع – مثل نماذج قوقل', b);
};
V.formNew = function () {
  var tpl = S.temp.tpl || '';
  var T = C().FORM_TEMPLATES;
  var b = '<section class="card"><h2>1. اختاري القالب</h2>' + (function () {
    var pill = function (k) { return '<label><input type="radio" name="tpl" value="' + k + '"' + (k === tpl ? ' checked' : '') + ' data-change="tpl"><span>' + esc(T[k].name) + '</span></label>'; };
    var keys = Object.keys(T), groups = {}, order = [];
    keys.forEach(function (k) { var g = T[k].group || ''; if (!groups[g]) { groups[g] = []; order.push(g); } groups[g].push(k); });
    order.sort(function (a, b2) { return (a ? 1 : 0) - (b2 ? 1 : 0); });
    return order.map(function (g) { return (g ? '<p class="small" style="font-weight:700;margin:8px 0 0">' + esc(g) + '</p>' : '') + '<div class="pills" role="radiogroup">' + groups[g].map(pill).join('') + '</div>'; }).join('');
  })() + (tpl ? '<p class="small muted">' + esc(T[tpl].description || '') + ' · الحقول: ' + T[tpl].fields.map(function (f) { return f.label; }).join('، ') + '</p>' : '') + '</section>';
  if (tpl) {
    var t = T[tpl];
    b += '<section class="card"><h2>2. التفاصيل</h2><label class="field">عنوان النموذج<input id="f_title" class="in" value="' + attr(tpl === 'custom' ? '' : t.name) + '" placeholder="مثال: الخطة العلاجية – الفترة الأولى"></label>' +
      '<label class="field">وصف يظهر للمعلمات<textarea id="f_desc" class="in" rows="2">' + esc(t.description || '') + '</textarea></label>' +
      '<label class="field">آخر موعد (اختياري)<input id="f_deadline" class="in" type="date"></label>';
    if (t.audience !== 'parents') b += '<label class="field">يُضاف الرد دليلاً لمؤشر المعلمة<select id="f_ind" class="in"><option value="">يُحدد عند القبول</option>' + C().TEACHER_INDICATORS.map(function (x) { return '<option value="' + x.n + '"' + (String(x.n) === String(t.indicatorNo) ? ' selected' : '') + '>' + x.n + ' · ' + esc(x.text) + '</option>'; }).join('') + '</select></label>';
    b += '</section>';
    if (tpl === 'custom') b += builderHtml();
    b += '<button class="btn pri block" type="button" data-act="createForm">إنشاء الرابط</button>';
  }
  return shell('نموذج جديد', 'إنشاء رابط للمعلمات أو أولياء الأمور', b);
};
function builderHtml() {
  var fs = S.temp.builder || (S.temp.builder = [{ type: 'teacher', label: 'اسم المعلمة', required: true }, { type: 'textarea', label: 'الوصف' }, { type: 'file', label: 'المرفقات' }]);
  var types = [['teacher', 'اسم المعلمة (قائمة)'], ['text', 'نص قصير'], ['textarea', 'نص طويل'], ['number', 'رقم'], ['date', 'تاريخ'], ['radio', 'اختيار واحد'], ['select', 'قائمة منسدلة'], ['grid', 'جدول تقدير'], ['file', 'رفع ملفات'], ['link', 'رابط']];
  return '<section class="card"><h2>3. الحقول</h2>' + fs.map(function (f, i) {
    return '<div style="border:1px solid var(--line);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:8px"><div class="grid2" style="grid-template-columns:1fr 150px"><input class="in" aria-label="عنوان الحقل" data-bf="label" data-i="' + i + '" value="' + attr(f.label || '') + '" placeholder="عنوان الحقل"><select class="in" aria-label="نوع الحقل" data-bf="type" data-i="' + i + '">' + types.map(function (t) { return '<option value="' + t[0] + '"' + (t[0] === f.type ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select></div>' +
      (['radio', 'select', 'grid'].indexOf(f.type) >= 0 ? '<input class="in" data-bf="options" data-i="' + i + '" value="' + attr((f.options || []).join('، ')) + '" placeholder="الخيارات مفصولة بفاصلة: جيد، متوسط، ضعيف">' : '') +
      (f.type === 'grid' ? '<textarea class="in" rows="3" data-bf="rows" data-i="' + i + '" placeholder="العناصر – كل عنصر في سطر">' + esc((f.rows || []).join('\n')) + '</textarea>' : '') +
      '<div class="card-h"><label class="check" style="border:0;min-height:36px"><input type="checkbox" data-bf="required" data-i="' + i + '"' + (f.required ? ' checked' : '') + '><span class="small">مطلوب</span></label><button type="button" class="btn danger sm" data-act="bDel" data-i="' + i + '">حذف</button></div></div>';
  }).join('') + '<button type="button" class="btn out" data-act="bAdd">' + ic('plus', 18) + 'إضافة حقل</button></section>';
}
V.form = function (p) {
  var f = formById(p.id);
  if (!f) return shell('غير موجود', '', '');
  var url = formUrl(f.id);
  var rs = S.d.responses.filter(function (r) { return r.formId === f.id && r.status !== 'removed'; });
  var b = '<section class="hero"><span class="lbl">' + (f.audience === 'parents' ? 'رابط لأولياء الأمور' : 'رابط للمعلمات') + ' · ' + (f.open !== false ? 'مفتوح' : 'مغلق') + '</span><span class="big">' + rs.length + '</span><p>رد' + (f.deadline ? ' · آخر موعد ' + fmtDate(f.deadline) : '') + '</p>' +
    '<div class="btns"><button class="btn" type="button" data-act="copy" data-text="' + attr(url) + '" style="background:#fff;color:var(--pri-d);border-color:#fff">' + ic('link', 18) + 'نسخ الرابط</button><a class="btn" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.45)" target="_blank" rel="noopener" href="' + attr(waUrl(f.title + '\n' + (f.description ? f.description + '\n' : '') + url)) + '">' + ic('wa', 18) + 'إرسال واتساب</a></div></section>';
  b += '<div class="btns"><a class="btn" target="_blank" rel="noopener" href="' + attr(url) + '">' + ic('eye', 18) + 'معاينة</a><button class="btn" type="button" data-act="toggleForm" data-id="' + f.id + '">' + (f.open !== false ? 'إغلاق الرابط' : 'فتح الرابط') + '</button><a class="btn" target="_blank" rel="noopener" href="' + attr(printUrl('form', { id: f.id })) + '">' + ic('print', 18) + 'طباعة النتائج</a></div>';
  if (f.audience !== 'parents') {
    var sent = submittedIds(f);
    var missing = activeTeachers().filter(function (t) { return sent.indexOf(String(t.id)) < 0; });
    b += '<section class="card"><div class="card-h"><h2>من لم ترسل <span class="num muted">(' + missing.length + ')</span></h2>' + (missing.length ? '<a class="btn sm out" target="_blank" rel="noopener" href="' + attr(waUrl('تذكير: «' + f.title + '»' + (f.deadline ? ' – آخر موعد ' + fmtDate(f.deadline) : '') + '\nنرجو التعبئة من الرابط:\n' + url + '\n\n' + missing.map(function (t) { return '• ' + t.name; }).join('\n'))) + '">' + ic('wa', 16) + 'تذكير</a>' : '') + '</div>' +
      (missing.length ? '<p class="small" style="line-height:2">' + missing.map(function (t) { return esc(shortName(t.name)); }).join(' · ') + '</p>' : '<p class="note ok">أرسلت جميع المعلمات ✓</p>') + '</section>';
  }
  b += analysisHtml(f, rs);
  if (f.audience !== 'parents' && rs.length) b += '<button class="btn" type="button" data-act="nav" data-v="inbox">فتح الردود في صندوق الوارد</button>';
  b += '<section class="card"><h2>الإعدادات</h2><label class="field">العنوان<input id="fe_title" class="in" value="' + attr(f.title) + '"></label><label class="field">الوصف<textarea id="fe_desc" class="in" rows="2">' + esc(f.description || '') + '</textarea></label><label class="field">آخر موعد<input id="fe_deadline" class="in" type="date" value="' + attr(f.deadline || '') + '"></label><div class="btns"><button class="btn danger" type="button" data-act="delForm" data-id="' + f.id + '">حذف النموذج</button><button class="btn pri" type="button" data-act="saveForm" data-id="' + f.id + '" style="flex:2">حفظ</button></div></section>';
  return shell(f.title, 'نموذج', b);
};
function analysisHtml(f, rs) {
  var out = '';
  (f.fields || []).forEach(function (fl) {
    if ((fl.type === 'radio' || fl.type === 'select') && rs.length) {
      var cnt = {}; rs.forEach(function (r) { var v = (r.values || {})[fl.id]; if (v) cnt[v] = (cnt[v] || 0) + 1; });
      out += '<section class="card"><h3>' + esc(fl.label) + '</h3>' + fl.options.map(function (o) { var n = cnt[o] || 0, pc = Math.round(n / rs.length * 100); return '<div class="dist" style="grid-template-columns:1fr 2fr 64px"><span class="small">' + esc(o) + '</span><span class="b"><span style="width:' + pc + '%;background:var(--pri)"></span></span><span class="small num">' + n + ' · ' + pc + '٪</span></div>'; }).join('') + '</section>';
    }
    if (fl.type === 'grid' && rs.length) {
      out += '<section class="card"><h3>' + esc(fl.label) + '</h3>' + (fl.rows || []).map(function (row, i) {
        var n = 0, sum = 0; rs.forEach(function (r) { var g = (r.values || {})[fl.id]; var x = g && g.answers ? g.answers[i] : null; if (x !== null && x !== undefined) { n++; sum += (fl.options.length - x); } });
        var mean = n ? sum / n : 0, pc = Math.round(mean / fl.options.length * 100);
        return '<div style="display:flex;flex-direction:column;gap:4px"><div class="card-h"><span class="small">' + esc(row) + '</span><span class="small num" style="font-weight:700">' + (n ? mean.toFixed(1) : '—') + ' / ' + fl.options.length + '</span></div><span class="bar"><span style="width:' + pc + '%"></span></span></div>';
      }).join('') + '<p class="xs muted">المتوسط من ' + fl.options.length + ' (الخيار الأول = أعلى درجة)</p></section>';
    }
  });
  return out;
}

/* ---------- الزيارات ---------- */
V.visits = function () {
  var tab = S.tab.visits || 'exchange';
  var b = '<div class="tabs" role="tablist"><button type="button" role="tab" aria-selected="' + (tab === 'exchange') + '" data-act="tab" data-k="visits" data-v="exchange">تبادل الزيارات</button><button type="button" role="tab" aria-selected="' + (tab === 'sup') + '" data-act="tab" data-k="visits" data-v="sup">الزيارات الإشرافية</button></div>';
  if (tab === 'exchange') {
    var ex = S.d.visits.filter(function (v) { return v.type === 'exchange' && v.status !== 'removed'; }).sort(function (a, c) { return String(c.date) < String(a.date) ? -1 : 1; });
    var visited = {}; ex.forEach(function (v) { visited[v.visitedId] = 1; });
    var ef = exchangeForm();
    b += '<section class="hero"><span class="lbl">زيارات تبادلية هذا العام</span><span class="big">' + ex.length + '</span><p>' + (activeTeachers().length - Object.keys(visited).length) + ' من ' + activeTeachers().length + ' معلمة لم تُزَر بعد</p><div class="btns">' +
      (ef ? '<button class="btn" type="button" data-act="copy" data-text="' + attr(formUrl(ef.id)) + '" style="background:#fff;color:var(--pri-d);border-color:#fff">' + ic('link', 18) + 'نسخ رابط الاستمارة</button>' : '<button class="btn" type="button" data-act="mkExchange" style="background:#fff;color:var(--pri-d)">إنشاء رابط الاستمارة</button>') +
      '<a class="btn" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.45)" target="_blank" rel="noopener" href="' + attr(printUrl('exchangeTable')) + '">' + ic('print', 18) + 'طباعة الجدول</a></div></section>';
    b += ex.length ? '<div class="tablewrap"><table class="table"><thead><tr><th>الزائرة ← المزارة</th><th>التاريخ</th><th>الحصة</th><th>المادة</th><th><span class="sr">فتح</span></th></tr></thead><tbody>' + ex.map(function (v) {
      return '<tr><td><b>' + esc(shortName(tname(v.visitorId))) + '</b><br><span class="small muted">← ' + esc(shortName(tname(v.visitedId))) + ' · ' + esc(v.cls || '') + '</span>' + (v.status === 'new' ? ' <span class="chip c-blue">جديد</span>' : '') + '</td><td class="num">' + esc(fmtDate(v.date)) + '</td><td class="num">' + esc(v.period || '') + '</td><td>' + esc(v.subject || '') + '</td><td><a class="btn sm" target="_blank" rel="noopener" href="' + attr(printUrl('visit', { id: v.id })) + '" aria-label="طباعة الاستمارة">' + ic('print', 16) + '</a></td></tr>';
    }).join('') + '</tbody></table></div>' : '<p class="empty">لم تصل زيارات تبادلية بعد. أرسلي رابط الاستمارة لمجموعة المعلمات.</p>';
  } else {
    var sv = S.d.visits.filter(function (v) { return v.type === 'supervisory'; }).sort(function (a, c) { return String(c.date) < String(a.date) ? -1 : 1; });
    var st = S.temp.supFiles || [];
    b += '<section class="card"><h2>إضافة زيارة إشرافية</h2><p class="small muted">الاستمارة تُعبأ في بوابة الوزارة؛ هنا ترفعين نسختها PDF مع بياناتها لتظهر في السجل.</p>' +
      '<label class="field">المعلمة<select id="sv_t" class="in"><option value="">اختاري…</option>' + activeTeachers().map(function (t) { return '<option value="' + t.id + '">' + esc(t.name) + '</option>'; }).join('') + '</select></label>' +
      '<div class="grid3"><label class="field">التاريخ<input id="sv_date" class="in" type="date" value="' + today() + '"></label><label class="field">الحصة<select id="sv_period" class="in">' + [1, 2, 3, 4, 5, 6, 7, 8].map(function (n) { return '<option>' + n + '</option>'; }).join('') + '</select></label><label class="field">المادة<select id="sv_subj" class="in"><option>رياضيات</option><option>علوم</option></select></label></div>' +
      '<div class="grid2"><label class="field">الصف<input id="sv_cls" class="in" placeholder="مثال: 3/2"></label><label class="field">الحالة<select id="sv_status" class="in"><option value="accepted">نُفذت</option><option value="planned">مخطط لها</option></select></label></div>' +
      '<label class="field">هدف الزيارة<input id="sv_goal" class="in"></label>' +
      '<label class="dash">' + ic('upload', 18) + (st.length ? 'تم اختيار: ' + esc(st[0].name) : 'رفع الاستمارة PDF') + '<input type="file" accept="application/pdf,image/*" data-change="supFile"></label>' +
      '<button class="btn pri" type="button" data-act="saveSup">حفظ الزيارة</button></section>';
    b += sv.length ? '<section class="card flush">' + sv.map(function (v) {
      return '<div class="row" style="cursor:default"><span class="avatar" style="background:var(--red-s);color:var(--red);border-radius:10px;font-size:11px">PDF</span><span class="grow"><span class="ttl">' + esc(tname(v.teacherId)) + '</span><span class="small muted">' + esc([fmtDate(v.date), 'الحصة ' + (v.period || ''), v.subject, v.cls, v.status === 'planned' ? 'مخطط لها' : 'نُفذت'].filter(Boolean).join(' · ')) + '</span></span>' + ((v.files || [])[0] ? '<a class="btn sm" target="_blank" rel="noopener" href="' + attr(v.files[0].url) + '">فتح</a>' : '') + '<button type="button" class="iconbtn" style="width:38px;height:38px" aria-label="حذف" data-act="delVisit" data-id="' + v.id + '">' + ic('trash', 16) + '</button></div>';
    }).join('') + '</section>' : '<p class="empty">لا توجد زيارات إشرافية مسجلة.</p>';
  }
  return shell('الزيارات الصفية', S.d.settings.currentYear, b);
};

/* ---------- تحليل النتائج ---------- */
V.grades = function () {
  var gf = S.temp.gradeFile;
  var b = '<section class="card"><h2>رفع سجل درجات</h2><p class="small muted">«استمارة المتابعة اليومية ورصد الدرجات» كما هي (ملف صف واحد أو ملف شامل بعدة أوراق).</p>' +
    '<label class="dash">' + ic('upload', 18) + (gf ? esc(gf.name) : 'اختاري ملف Excel') + '<input type="file" accept=".xlsx,.xls" data-change="gradeFile"></label>' +
    '<label class="field">المعلمة<select id="g_t" class="in"><option value="">اختاري…</option>' + activeTeachers().map(function (t) { return '<option value="' + t.id + '">' + esc(t.name) + '</option>'; }).join('') + '</select></label>' +
    '<div class="grid3"><label class="field">المادة<select id="g_s" class="in"><option value="">من الملف</option><option>رياضيات</option><option>علوم</option></select></label><label class="field">الصف<input id="g_c" class="in" placeholder="من الملف"></label><label class="field">الفترة<select id="g_p" class="in"><option>الأولى</option><option>الثانية</option><option>الثالثة</option><option>الرابعة</option></select></label></div>' +
    '<button class="btn pri" type="button" data-act="importGrades"' + (gf ? '' : ' disabled') + '>تحليل الملف</button></section>';
  var gs = S.d.grades.slice().sort(function (a, c) { return String(c.createdAt) < String(a.createdAt) ? -1 : 1; });
  b += gs.length ? '<section class="card flush">' + gs.map(function (g) { var s = g.stats || {}; return '<button type="button" class="row" data-act="grade" data-id="' + g.id + '"><span class="avatar" style="background:var(--pri-s);border-radius:12px">' + ic('chart', 20, 'var(--pri)') + '</span><span class="grow"><span class="ttl">' + esc([g.subject, g.cls, g.period].filter(Boolean).join(' · ')) + '</span><span class="small muted">' + esc(tname(g.teacherId) || 'بدون معلمة') + ' · ' + (s.count || 0) + ' طالباً · المتوسط ' + (s.avg || 0) + '</span></span><span class="chip ' + ((s.passC || 0) >= 75 ? 'c-ok' : 'c-warn') + '">ج فأعلى ' + (s.passC || 0) + '٪</span></button>'; }).join('') + '</section>' : '<p class="empty">لم تُرفع سجلات بعد.</p>';
  return shell('تحليل النتائج', 'سجلات الدرجات', b);
};
V.grade = function (p) {
  var g = byId(S.d.grades, p.id);
  if (!g) return shell('غير موجود', '', '');
  var s = g.stats || {}, L = s.levels || {};
  var colors = { 'أ': '#AC5389', 'ب': '#2F8F89', 'ج': '#7FB7B2', 'د': '#D98A3D', 'هـ': '#B4501E' };
  var maxL = Math.max.apply(null, ['أ', 'ب', 'ج', 'د', 'هـ'].map(function (k) { return L[k] || 0; }).concat([1]));
  var names = S.temp.names && S.temp.names.id === g.id ? S.temp.names.list : null;
  var b = '<section class="card"><p class="small muted">' + esc(tname(g.teacherId) || 'بدون معلمة') + ' · ' + (s.count || 0) + ' طالباً</p>' +
    '<div class="kpis"><div class="kpi"><b>' + (s.avg || 0) + '</b><span>المتوسط من 100</span></div><div class="kpi" style="background:var(--pri-s)"><b style="color:var(--pri-t)">' + (s.passC || 0) + '٪</b><span>ج فأعلى</span></div><div class="kpi warn"><b>' + (s.remedial || 0) + '</b><span>د وهـ</span></div></div>' +
    '<h2>توزيع المستويات</h2>' + ['أ', 'ب', 'ج', 'د', 'هـ'].map(function (k) { var n = L[k] || 0; return '<div class="dist"><b style="text-align:center">' + k + '</b><span class="b"><span style="width:' + Math.round(n / maxL * 100) + '%;background:' + colors[k] + '"></span></span><span class="small num">' + n + ' · ' + (s.count ? Math.round(n / s.count * 100) : 0) + '٪</span></div>'; }).join('') + '</section>';
  b += '<section class="card"><h2>أدوات التقويم (نسبة من الدرجة العظمى)</h2>' + (s.tools || []).map(function (t) { var weak = t.pct < 65; return '<div style="display:flex;flex-direction:column;gap:4px"><div class="card-h"><span class="small" style="font-weight:' + (weak ? 700 : 500) + '">' + esc(t.name) + '</span><b class="num small" style="color:' + (weak ? 'var(--red)' : 'var(--ink)') + '">' + t.pct + '٪</b></div><span class="bar lg"><span style="width:' + t.pct + '%;background:' + (weak ? '#C2410C' : 'var(--pri)') + '"></span></span></div>'; }).join('') +
    (s.weakest ? '<div class="note warn">أضعف أداة: <b>' + esc(s.weakest.name) + ' (' + s.weakest.pct + '٪)</b>' + ((s.sections || []).length > 1 ? ' · ' + s.sections.map(function (x) { return esc(x.name) + ' ' + x.pct + '٪'; }).join(' مقابل ') : '') + '</div>' : '') + '</section>';
  b += '<section class="card"><h2>الفئات المستهدفة</h2><div class="note warn" style="display:flex;gap:12px;align-items:center;background:var(--red-s)"><b class="num" style="font-size:22px;color:var(--red)">' + (s.remedial || 0) + '</b><span style="flex:1">طلبة للخطة العلاجية (د، هـ)</span><button class="btn sm danger" type="button" data-act="names" data-id="' + g.id + '">' + (names ? 'إخفاء الأسماء' : 'عرض الأسماء') + '</button></div>' +
    (names ? '<div class="tablewrap"><table class="table"><thead><tr><th>الاسم</th><th>المجموع</th><th>المستوى</th></tr></thead><tbody>' + names.filter(function (x) { return x.level === 'د' || x.level === 'هـ' || x.level === 'أ'; }).map(function (x) { return '<tr><td>' + esc(x.name) + '</td><td class="num">' + x.total + '</td><td>' + esc(x.level) + '</td></tr>'; }).join('') + '</tbody></table></div><p class="xs muted">الأسماء ظاهرة لكِ فقط ولا تُطبع إلا باختيارك.</p>' : '') +
    '<div class="note ok" style="display:flex;gap:12px;align-items:center"><b class="num" style="font-size:22px">' + (s.enrichment || 0) + '</b><span>طلبة للخطة الإثرائية (أ)</span></div>' +
    '<div class="btns"><button class="btn pri" type="button" data-act="gradeEntry" data-id="' + g.id + '">حفظ كدليل للمعلمة</button><button class="btn out" type="button" data-act="gradeRemedial" data-id="' + g.id + '">طلب خطة علاجية</button></div>' +
    '<div class="btns"><a class="btn" target="_blank" rel="noopener" href="' + attr(printUrl('grades', { id: g.id })) + '">' + ic('print', 18) + 'طباعة</a><a class="btn" target="_blank" rel="noopener" href="' + attr(printUrl('grades', { id: g.id, names: '1' })) + '">طباعة مع الأسماء</a>' + (g.fileUrl ? '<a class="btn" target="_blank" rel="noopener" href="' + attr(g.fileUrl) + '">فتح السجل</a>' : '') + '</div>' +
    '<button class="btn danger" type="button" data-act="delGrade" data-id="' + g.id + '">حذف التحليل</button></section>';
  return shell('تحليل ' + [g.subject, g.cls].filter(Boolean).join(' – '), g.period ? 'الفترة ' + g.period : 'تحليل النتائج', b);
};

/* ---------- سجل المعلم الأول ---------- */
V.register = function () {
  var d = S.d, s = d.settings, auto = seniorAuto();
  var classesOk = Array.isArray(s.classes) && s.classes.some(function (c) { return c.sections || c.students; });
  var tFilled = activeTeachers().filter(function (t) { return t.fileNo || t.qualification || t.phone; }).length;
  var pd1 = d.profdev.filter(function (x) { return String(x.term) === '1'; }).length, pd2 = d.profdev.filter(function (x) { return String(x.term) === '2'; }).length;
  var acts = d.entries.filter(function (e) { return e.type === 'مبادرة' || e.type === 'نشاط'; }).length;
  var rows = [
    ['بيانات المعلم الأول', s.seniorFileNo || s.seniorQualification ? 'مكتملة' : 'أكملي بياناتك من الإعدادات', s.seniorFileNo ? 1 : 0, 'settings'],
    ['بيانات المعلمين', tFilled + ' من ' + activeTeachers().length + ' معلمة اكتملت بياناتها', tFilled, 'teachers'],
    ['التشكيلات الصفية بالمدرسة', classesOk ? 'مُدخلة' : 'أدخليها من الإعدادات', classesOk ? 1 : 0, 'settings'],
    ['خطة الإنماء المهني (فصلان)', pd1 + ' برامج للفصل الأول · ' + pd2 + ' للفصل الثاني', pd1 + pd2, 'profdev'],
    ['الزيارات الصفية للمعلم الأول', auto.supervisory + ' زيارة (PDF)', auto.supervisory, 'visits'],
    ['تبادل الزيارات بين المعلمين', auto.exchange + ' زيارة – جدول تلقائي', auto.exchange, 'visits'],
    ['متابعة أعمال المعلمين', auto.followups + ' شهر', auto.followups, 'followups'],
    ['تحليل نتائج الاختبارات والتحصيل', auto.grades + ' تحليل', auto.grades, 'grades'],
    ['الاجتماعات', auto.meetings + ' محضر', auto.meetings, 'meetings'],
    ['مناشط وفعاليات المادة', acts + ' منشط من الإنجازات الموثقة', acts, 'teachers']
  ];
  var filled = rows.filter(function (r) { return r[2]; }).length;
  var b = '<section class="hero"><p>السجل يُملأ تلقائياً مما يُدخل في المنصة، ويُطبع بنفس ترتيب «سجل المعلم الأول».</p><div style="display:flex;align-items:center;gap:10px"><span class="big" style="font-size:32px">' + filled + '/' + rows.length + '</span><span class="lbl">قسماً فيه بيانات</span></div>' +
    '<a class="btn" style="background:#fff;color:var(--pri-d);border-color:#fff" target="_blank" rel="noopener" href="' + attr(printUrl('register')) + '">' + ic('print', 18) + 'طباعة السجل / حفظه PDF</a></section>';
  b += '<section class="card flush">' + rows.map(function (r) { return '<button type="button" class="row" data-act="go" data-v="' + r[3] + '"><span class="avatar" style="border-radius:10px;background:' + (r[2] ? 'var(--pri-s)' : 'var(--line2)') + '">' + ic('book', 18, r[2] ? 'var(--pri)' : 'var(--muted)') + '</span><span class="grow"><span class="ttl">' + esc(r[0]) + '</span><span class="small muted">' + esc(r[1]) + '</span></span><span class="chip ' + (r[2] ? 'c-ok' : 'c-gray') + '">' + (r[2] ? 'فيه بيانات' : 'فارغ') + '</span></button>'; }).join('') + '</section>';
  return shell('سجل المعلم الأول', 'العام الدراسي ' + s.currentYear, b);
};

/* ---------- الاجتماعات ---------- */
V.meetings = function () {
  var ms = S.d.meetings.slice().sort(function (a, c) { return String(c.date) < String(a.date) ? -1 : 1; });
  var b = '<button class="btn pri block" type="button" data-act="go" data-v="meeting">' + ic('plus', 18) + 'محضر اجتماع جديد</button>';
  b += ms.length ? '<section class="card flush">' + ms.map(function (m) { return '<button type="button" class="row" data-act="go" data-v="meeting" data-id="' + m.id + '"><span class="circle">' + esc(m.number || '') + '</span><span class="grow"><span class="ttl">' + esc(m.title || 'اجتماع رقم ' + m.number) + '</span><span class="small muted">' + esc(fmtDate(m.date)) + ' · ' + ((m.attendees || []).length) + ' حاضرة · ' + ((m.recs || []).length) + ' توصيات</span></span>' + ic('chev', 18) + '</button>'; }).join('') + '</section>' : '<p class="empty">لا توجد محاضر بعد.</p>';
  return shell('الاجتماعات', S.d.settings.currentYear, b);
};
V.meeting = function (p) {
  var m = p.id ? byId(S.d.meetings, p.id) : { number: S.d.meetings.length + 1, date: today(), attendees: [], topics: [], recs: [] };
  if (!m) return shell('غير موجود', '', '');
  var att = m.attendees || [];
  var b = '<section class="card"><div class="grid2"><label class="field">رقم الاجتماع<input id="m_no" class="in" type="text" inputmode="decimal" autocomplete="off" data-num="1" value="' + attr(m.number || '') + '"></label><label class="field">الوقت<input id="m_time" class="in" type="time" value="' + attr(m.time || '') + '"></label></div>' +
    '<label class="field">عنوان الاجتماع<input id="m_title" class="in" value="' + attr(m.title || '') + '" placeholder="مثال: الاجتماع التنظيمي الأول لمعلمات المجال"></label><label class="field">التاريخ<input id="m_date" class="in" type="date" value="' + attr(m.date || '') + '"></label>' +
    '<label class="field">محاور الاجتماع<span class="hint">كل محور في سطر</span><textarea id="m_topics" class="in" rows="4">' + esc((m.topics || []).join('\n')) + '</textarea></label>' +
    '<label class="field">التوصيات<span class="hint">كل توصية في سطر</span><textarea id="m_recs" class="in" rows="4">' + esc((m.recs || []).join('\n')) + '</textarea></label></section>' +
    '<section class="card"><div class="card-h"><h2>الحضور</h2><button type="button" class="btn sm" data-act="allAtt">تحديد الكل</button></div>' + activeTeachers().map(function (t) { return '<label class="check"><input type="checkbox" name="att" value="' + t.id + '"' + (att.indexOf(t.id) >= 0 ? ' checked' : '') + '><span>' + esc(t.name) + '</span></label>'; }).join('') + '</section>' +
    '<div class="btns">' + (p.id ? '<button class="btn danger" type="button" data-act="delMeeting" data-id="' + p.id + '">حذف</button><a class="btn" target="_blank" rel="noopener" href="' + attr(printUrl('meeting', { id: p.id })) + '">' + ic('print', 18) + 'طباعة</a>' : '') + '<button class="btn pri" type="button" data-act="saveMeeting" data-id="' + (p.id || '') + '" style="flex:2">حفظ المحضر</button></div>';
  return shell(p.id ? 'محضر اجتماع' : 'اجتماع جديد', 'الاجتماعات', b);
};

/* ---------- المتابعة الشهرية ---------- */
V.followups = function () {
  var month = S.temp.month || today().slice(0, 7);
  var by = {}, meta = {};
  S.d.followups.forEach(function (f) { if (f.month !== month) return; if (f.teacherId === '__month') meta = f.values || {}; else by[f.teacherId] = f; });
  var items = C().FOLLOWUP_ITEMS;
  var subj = S.temp.fuSubject || '';
  var b = '<section class="card"><div class="grid2"><label class="field">الشهر<input id="fu_month" class="in" type="month" value="' + attr(month) + '" data-change="month"></label><label class="field">تاريخ المتابعة<input id="fu_date" class="in" type="date" value="' + attr(meta.date || '') + '"></label></div>' +
    '<div class="grid2"><label class="field">المادة في الطباعة<select id="fu_subj" class="in" data-change="fuSubject"><option value="">الرياضيات والعلوم</option><option' + (subj === 'رياضيات' ? ' selected' : '') + '>رياضيات</option><option' + (subj === 'علوم' ? ' selected' : '') + '>علوم</option></select></label>' +
    '<div class="field" style="justify-content:flex-end"><a id="fu_print" class="btn" target="_blank" rel="noopener" href="' + attr(printUrl('followups', subj ? { month: month, subject: subj } : { month: month })) + '">' + ic('print', 18) + 'طباعة استمارة الشهر</a></div></div>' +
    '<label class="field">الملاحظات والتوصيات العامة<textarea id="fu_notes" class="in" rows="2">' + esc(meta.notes || '') + '</textarea></label></section>';
  b += activeTeachers().map(function (t) {
    var f = by[t.id] || {}, v = f.values || {};
    var groups = items.map(function (it) {
      var cur = v[it.key];
      var on = function (o) { return it.multi ? (Array.isArray(cur) ? cur.indexOf(o) >= 0 : cur === o) : it.check ? !!cur : cur === o; };
      return '<div class="field"><span>' + esc(it.name) + (it.multi ? ' <span class="xs muted">(يمكن اختيار أكثر من واحد)</span>' : '') + '</span><div class="pills" data-fk="' + it.key + '" data-mode="' + (it.multi ? 'multi' : it.check ? 'check' : 'one') + '">' +
        it.options.map(function (o) { return '<label><input type="checkbox" value="' + attr(o) + '"' + (on(o) ? ' checked' : '') + ' data-change="fuPick"><span>' + esc(o) + '</span></label>'; }).join('') + '</div></div>';
    }).join('');
    return '<details class="card" data-fu="' + t.id + '"><summary style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:8px;list-style:none"><b>' + esc(t.name) + '</b><span class="chip ' + (f.id ? 'c-ok' : 'c-gray') + '">' + (f.id ? 'مُتابَعة' : 'لم تُتابَع') + '</span></summary><div style="display:flex;flex-direction:column;gap:12px;margin-top:12px">' + groups +
      '<label class="field">ملاحظات<input class="in" data-fnote="1" value="' + attr(f.notes || '') + '"></label></div></details>';
  }).join('');
  b += '<button class="btn pri block" type="button" data-act="saveFollowups">حفظ متابعة الشهر</button>';
  return shell('المتابعة الشهرية', 'استمارة متابعة أعمال المعلمات', b);
};

/* ---------- الإنماء المهني ---------- */
V.profdev = function () {
  var term = S.tab.pd || '1';
  var list = S.d.profdev.filter(function (x) { return String(x.term) === term; }).sort(function (a, c) { return String(a.date) < String(c.date) ? -1 : 1; });
  var b = '<div class="tabs" role="tablist"><button type="button" role="tab" aria-selected="' + (term === '1') + '" data-act="tab" data-k="pd" data-v="1">الفصل الأول</button><button type="button" role="tab" aria-selected="' + (term === '2') + '" data-act="tab" data-k="pd" data-v="2">الفصل الثاني</button></div>';
  b += '<section class="card"><h2>إضافة برنامج</h2><label class="field">البرنامج<input id="pd_prog" class="in" placeholder="مثال: ورشة استراتيجيات التعلم النشط"></label><div class="grid2"><label class="field">تاريخ التنفيذ<input id="pd_date" class="in" type="date"></label><label class="field">المستهدفون<input id="pd_target" class="in" placeholder="معلمات المجال"></label></div><div class="grid2"><label class="field">المنفذ<input id="pd_pres" class="in"></label><label class="field">ملاحظات<input id="pd_notes" class="in"></label></div><button class="btn pri" type="button" data-act="addPd">إضافة للخطة</button></section>';
  b += list.length ? '<section class="card flush">' + list.map(function (x) { var done = x.done === true || x.done === 'true'; return '<div class="row" style="cursor:default"><input type="checkbox" aria-label="نُفذ" data-act="pdDone" data-id="' + x.id + '"' + (done ? ' checked' : '') + ' style="width:22px;height:22px;accent-color:var(--pri)"><span class="grow"><span class="ttl">' + esc(x.program) + '</span><span class="small muted">' + esc([fmtDate(x.date), x.target, x.presenter, x.notes].filter(Boolean).join(' · ')) + '</span></span><span class="chip ' + (done ? 'c-ok' : 'c-gray') + '">' + (done ? 'نُفذ' : 'مخطط') + '</span><button type="button" class="iconbtn" style="width:38px;height:38px" aria-label="حذف" data-act="delPd" data-id="' + x.id + '">' + ic('trash', 16) + '</button></div>'; }).join('') + '</section>' : '<p class="empty">لا توجد برامج في هذا الفصل.</p>';
  return shell('الإنماء المهني', 'خطة الإنماء المهني ' + S.d.settings.currentYear, b);
};

/* ---------- الإعدادات ---------- */
V.settings = function () {
  var s = S.d.settings;
  var inp = function (k, label, type) { return '<label class="field">' + label + '<input class="in" data-sk="' + k + '" ' + numAttr(type) + ' value="' + attr(s[k] || '') + '"></label>'; };
  var cls = Array.isArray(s.classes) ? s.classes : [];
  var b = '<section class="card"><h2>المدرسة</h2>' + inp('schoolName', 'اسم المدرسة') + inp('fieldName', 'المجال') + '</section>' +
    '<section class="card"><h2>بيانات المعلم الأول</h2>' + inp('seniorName', 'الاسم') + '<div class="grid2">' + inp('seniorFileNo', 'رقم الملف') + inp('seniorPhone', 'رقم الهاتف', 'tel') + '</div>' + inp('seniorQualification', 'المؤهل العلمي') + '<div class="grid2">' + inp('seniorQualDate', 'تاريخه') + inp('seniorQualPlace', 'مكان الحصول عليه') + '</div><div class="grid2">' + inp('seniorHireDate', 'تاريخ التعيين كمعلم') + inp('seniorSeniorDate', 'تاريخ التعيين كمعلم أول') + '</div>' + inp('seniorEmail', 'البريد الإلكتروني', 'email') + '</section>' +
    '<section class="card"><h2>التشكيلات الصفية</h2><div class="tablewrap"><table class="table"><thead><tr><th>الصف</th><th>عدد الشعب</th><th>عدد الطلبة</th></tr></thead><tbody>' + cls.map(function (c, i) { return '<tr><td>' + esc(c.grade) + '</td><td><input class="in" style="min-height:38px" type="text" inputmode="decimal" autocomplete="off" data-num="1" aria-label="عدد الشعب" data-ci="' + i + '" data-cf="sections" value="' + attr(c.sections || '') + '"></td><td><input class="in" style="min-height:38px" type="text" inputmode="decimal" autocomplete="off" data-num="1" aria-label="عدد الطلبة" data-ci="' + i + '" data-cf="students" value="' + attr(c.students || '') + '"></td></tr>'; }).join('') + '</tbody></table></div><div class="grid2">' + inp('staffRequired', 'عدد معلمات المادة – المقرر', 'number') + inp('staffExisting', 'الموجود', 'number') + '</div></section>' +
    '<button class="btn pri block" type="button" data-act="saveSettings">حفظ الإعدادات</button>';
  b += '<section class="card"><div class="card-h"><h2>المعلمات</h2><button type="button" class="btn sm" data-act="go" data-v="teacherEdit">' + ic('plus', 16) + 'إضافة</button></div>' + S.d.teachers.map(function (t) { return '<button type="button" class="row" style="padding:10px 0" data-act="go" data-v="teacherEdit" data-id="' + t.id + '"><span class="grow"><span class="ttl">' + esc(t.name) + '</span></span>' + (t.active === false ? '<span class="chip c-gray">غير نشطة</span>' : '') + ic('chev', 16) + '</button>'; }).join('') + '</section>';
  b += '<section class="card"><h2>كلمة المرور</h2><label class="field">الحالية<input id="pw_old" class="in" type="password" autocomplete="current-password"></label><label class="field">الجديدة (6 أحرف على الأقل)<input id="pw_new" class="in" type="password" autocomplete="new-password"></label><button class="btn" type="button" data-act="changePw">تغيير كلمة المرور</button></section>';
  b += '<section class="card"><h2>العام الدراسي</h2><p class="small muted">العام الحالي: <b>' + esc(s.currentYear) + '</b>. عند بدء عام جديد تبقى بيانات الأعوام السابقة محفوظة، وتبقى المعلمات والقوالب.</p><label class="field">العام الجديد<input id="ny" class="in" placeholder="2027/2028" dir="ltr"></label><label class="check" style="border:0"><input type="checkbox" id="ny_backup" checked><span>نسخة احتياطية قبل التغيير</span></label><button class="btn warn" type="button" data-act="newYear">بدء العام الجديد</button>' +
    (S.d.years.length > 1 ? '<p class="small muted">الأعوام المتاحة: ' + S.d.years.map(esc).join('، ') + '. للتنقل بينها اكتبي العام وابدئيه.</p>' : '') + '</section>';
  b += '<section class="card"><h2>البيانات والنسخ</h2><div class="btns"><a class="btn" target="_blank" rel="noopener" href="' + attr(S.d.dataUrl) + '">قاعدة البيانات (Sheet)</a><a class="btn" target="_blank" rel="noopener" href="' + attr(S.d.folderUrl) + '">مجلد الملفات (Drive)</a></div><button class="btn" type="button" data-act="backup">نسخة احتياطية الآن</button><button class="btn danger" type="button" data-act="logout">تسجيل الخروج</button></section>';
  return shell('الإعدادات', 'بصمة التميّز ' + C().APP_VERSION, b);
};
V.teacherEdit = function (p) {
  var t = p.id ? byId(S.d.teachers, p.id) : { active: true };
  if (!t) return shell('غير موجود', '', '');
  var inp = function (k, label, type, ph) { return '<label class="field">' + label + '<input class="in" data-tk="' + k + '" ' + numAttr(type) + ' value="' + attr(t[k] || '') + '" placeholder="' + attr(ph || '') + '"></label>'; };
  var b = '<section class="card">' + inp('name', 'الاسم') + '<div class="grid2">' + inp('subject', 'المادة', 'text', 'رياضيات / علوم') + inp('grades', 'الصفوف التي تدرّسها', 'text', 'مثال: 3/1، 3/2') + '</div><div class="grid2">' + inp('periods', 'عدد الحصص', 'number') + inp('fileNo', 'رقم الملف') + '</div><div class="grid2">' + inp('hireDate', 'تاريخ التعيين') + inp('qualification', 'المؤهل الدراسي') + '</div><div class="grid2">' + inp('qualDate', 'تاريخ الحصول عليه') + inp('qualPlace', 'مكان الحصول عليه') + '</div><div class="grid2">' + inp('residence', 'محل الإقامة') + inp('phone', 'رقم الهاتف', 'tel') + '</div>' +
    '<label class="check" style="border:0"><input type="checkbox" id="t_active"' + (t.active !== false ? ' checked' : '') + '><span>نشطة (تظهر في قوائم الأسماء)</span></label></section><button class="btn pri block" type="button" data-act="saveTeacher" data-id="' + (p.id || '') + '">حفظ</button>';
  return shell(p.id ? 'بيانات المعلمة' : 'معلمة جديدة', 'سجل المعلم الأول › بيانات المعلمين', b);
};

/* ================================================================== */
/*                              الأحداث                                */
/* ================================================================== */
var A = {};
A.nav = function (el) { go(el.dataset.v); };
A.back = function () { back(); };
A.go = function (el) { if (el.dataset.v === 'formNew') { S.temp.tpl = ''; S.temp.builder = null; } go(el.dataset.v, el.dataset.id ? { id: el.dataset.id } : {}); };
A.teacher = function (el) { go('teacher', { id: el.dataset.id }); };
A.indicator = function (el) { go('indicator', { ownerType: el.dataset.owner, tid: el.dataset.tid || '', n: el.dataset.n }); };
A.entry = function (el) { S.temp.entry = null; var e = byId(S.d.entries, el.dataset.id); go('entry', { id: el.dataset.id, ownerType: e ? e.ownerType : '' }); };
A.newEntry = function (el) { S.temp.entry = null; go('entry', { ownerType: el.dataset.owner, tid: el.dataset.tid || '', n: el.dataset.n || '' }); };
A.form = function (el) { go('form', { id: el.dataset.id }); };
A.grade = function (el) { S.temp.names = null; go('grade', { id: el.dataset.id }); };
A.response = function (el) { go('response', { id: el.dataset.id }); };
A.tab = function (el) { S.tab[el.dataset.k] = el.dataset.v; render(); };
A.copy = function (el) { copyText(el.dataset.text); };
A.logout = function () { rpc('logout', [S.token]).catch(function () {}); forgetToken(); S.token = null; S.d = null; render(); };

A.level = function (el) {
  var p = S.p, lvl = Number(el.dataset.l);
  run(call('saveAssess', { ownerType: p.ownerType, teacherId: p.tid, indicatorNo: p.n, level: lvl })).then(function (r) { upsert(S.d.assess, r); render(); });
};
A.check = function (el) {
  var p = S.p;
  var a = S.d.assess.filter(function (x) { return x.ownerType === p.ownerType && String(x.teacherId || '') === String(p.ownerType === 'senior' ? '' : p.tid) && String(x.indicatorNo) === String(p.n); })[0] || {};
  var checks = (a.checks || []).slice(); checks[Number(el.dataset.i)] = el.checked;
  call('saveAssess', { ownerType: p.ownerType, teacherId: p.ownerType === 'senior' ? '' : p.tid, indicatorNo: p.n, checks: checks }).then(function (r) { upsert(S.d.assess, r); }, function (e) { toast(e.message, true); });
};

A.addLink = function () {
  var v = val('e_link');
  if (!/^https?:\/\//i.test(v)) { toast('الرابط يجب أن يبدأ بـ https://', true); return; }
  S.temp.entry.links.push(v); document.getElementById('e_link').value = '';
  document.getElementById('filesBox').innerHTML = filesHtml(S.temp.entry);
};
A.rmFile = function (el) { var st = S.temp.entry; if (el.dataset.k === 'f') st.files.splice(Number(el.dataset.i), 1); else st.links.splice(Number(el.dataset.i), 1); document.getElementById('filesBox').innerHTML = filesHtml(st); };
A.saveEntry = function (el) {
  var st = S.temp.entry, owner = val('e_owner');
  var e = {
    id: el.dataset.id || undefined, ownerType: owner === 'senior' ? 'senior' : 'teacher', teacherId: owner === 'senior' ? '' : owner,
    title: val('e_title'), type: checked('e_type'), indicatorNo: val('e_ind'), date: val('e_date'), goal: val('e_goal'), description: val('e_desc'),
    role: checked('e_role'), target: val('e_target'), beneficiaries: val('e_ben'), total: val('e_tot'), timeline: val('e_timeline'), mechanism: val('e_mech'), impactMeasure: val('e_im'),
    before: val('e_before'), after: val('e_after'), results: val('e_results'), impact: val('e_impact'), why: val('e_why'), what: val('e_what'), next: val('e_next'), opinion: val('e_opinion'),
    status: checked('e_status') || 'قيد التنفيذ', files: st.files, links: st.links
  };
  if (!e.title) { toast('اكتبي اسم الإنجاز', true); document.getElementById('e_title').focus(); return; }
  if (!e.indicatorNo) { toast('اختاري المؤشر / البند', true); document.getElementById('e_ind').focus(); return; }
  run(call('saveEntry', { entry: e }), 'تم حفظ الإنجاز').then(function (r) { upsert(S.d.entries, r); S.temp.entry = null; back(); });
};
A.delEntry = function (el) {
  if (!confirm('حذف هذا الإنجاز؟')) return;
  run(call('deleteEntry', { id: el.dataset.id }), 'تم الحذف').then(function () { drop(S.d.entries, el.dataset.id); S.temp.entry = null; back(); });
};

A.respond = function (el) {
  var id = el.dataset.id, action = el.dataset.a;
  var sel = document.getElementById('ind_' + id);
  var args = { id: id, action: action, indicatorNo: sel ? sel.value : '' };
  if (action === 'remove' && !confirm('حذف هذا الرد؟')) return;
  run(call('respond', args), action === 'accept' ? 'أُضيف دليلاً في ملف المعلمة' : action === 'remove' ? 'حُذف الرد' : 'تم').then(function (r) {
    if (r.response) upsert(S.d.responses, r.response);
    if (r.entry) upsert(S.d.entries, r.entry);
    if (r.removedEntryId) drop(S.d.entries, r.removedEntryId);
    if (r.visit) upsert(S.d.visits, r.visit);
    render();
  });
};
A.askMore = function (el) {
  var r = byId(S.d.responses, el.dataset.id), f = formById(r.formId) || {};
  var note = prompt('ما المطلوب استكماله؟ (تُرسل للمعلمة عبر واتساب)', '');
  if (note === null) return;
  run(call('respond', { id: r.id, action: 'more', note: note })).then(function (x) {
    upsert(S.d.responses, x.response);
    var t = byId(S.d.teachers, r.teacherId);
    var msg = 'الأستاذة ' + (t ? t.name : '') + '، بخصوص «' + (f.title || '') + '»: نرجو استكمال ' + note + '\nوإعادة الإرسال من الرابط:\n' + formUrl(r.formId);
    var phone = t && t.phone ? String(t.phone).replace(/\D/g, '') : '';
    var url = phone ? 'https://api.whatsapp.com/send?phone=' + (phone.length === 8 ? '968' + phone : phone) + '&text=' + encodeURIComponent(msg) : waUrl(msg);
    window.open(url, '_blank');
    render();
  });
};

A.createForm = function () {
  var tpl = S.temp.tpl;
  var args = { template: tpl, title: val('f_title'), description: val('f_desc'), deadline: val('f_deadline') };
  if (document.getElementById('f_ind')) args.indicatorNo = val('f_ind');
  if (!args.title) { toast('اكتبي عنوان النموذج', true); return; }
  if (tpl === 'custom') args.fields = S.temp.builder;
  run(call('createForm', args), 'تم إنشاء الرابط').then(function (f) { S.d.forms.push(f); S.view = 'form'; S.p = { id: f.id }; render(); window.scrollTo(0, 0); });
};
A.bAdd = function () { syncBuilder(); S.temp.builder.push({ type: 'text', label: '' }); render(); };
A.bDel = function (el) { syncBuilder(); S.temp.builder.splice(Number(el.dataset.i), 1); render(); };
function syncBuilder() {
  var b = S.temp.builder; if (!b) return;
  document.querySelectorAll('[data-bf]').forEach(function (el) {
    var f = b[Number(el.dataset.i)]; if (!f) return; var k = el.dataset.bf;
    if (k === 'required') f.required = el.checked;
    else if (k === 'options') f.options = el.value.split(/[،,]/).map(function (s) { return s.trim(); }).filter(Boolean);
    else if (k === 'rows') f.rows = lines(el.value);
    else f[k] = el.value;
  });
}
A.toggleForm = function (el) { var f = formById(el.dataset.id); run(call('updateForm', { id: f.id, patch: { open: f.open === false } }), f.open === false ? 'فُتح الرابط' : 'أُغلق الرابط').then(function (r) { upsert(S.d.forms, r); render(); }); };
A.saveForm = function (el) { run(call('updateForm', { id: el.dataset.id, patch: { title: val('fe_title'), description: val('fe_desc'), deadline: val('fe_deadline') } }), 'تم الحفظ').then(function (r) { upsert(S.d.forms, r); render(); }); };
A.delForm = function (el) {
  if (!confirm('حذف النموذج؟ الردود غير المقبولة ستُحذف أيضاً. الأدلة المقبولة تبقى.')) return;
  run(call('deleteForm', { id: el.dataset.id }), 'حُذف النموذج').then(function () { load().then(function () { S.stack = []; S.view = 'forms'; render(); }); });
};
A.mkExchange = function () { run(call('createForm', { template: 'exchange' }), 'تم إنشاء الرابط').then(function (f) { S.d.forms.push(f); render(); }); };

A.saveSup = function () {
  var v = { type: 'supervisory', teacherId: val('sv_t'), date: val('sv_date'), period: val('sv_period'), subject: val('sv_subj'), cls: val('sv_cls'), goal: val('sv_goal'), status: val('sv_status') };
  if (!v.teacherId) { toast('اختاري المعلمة', true); return; }
  var files = S.temp.supFiles || [];
  var p = files.length ? uploadAll(files, ['الزيارات الإشرافية', tname(v.teacherId)]) : Promise.resolve([]);
  run(p.then(function (saved) { v.files = saved; return call('saveVisit', { visit: v }); }), 'تم حفظ الزيارة').then(function (r) { S.d.visits.push(r); S.temp.supFiles = null; render(); });
};
A.delVisit = function (el) { if (!confirm('حذف الزيارة؟')) return; run(call('deleteVisit', { id: el.dataset.id }), 'تم الحذف').then(function () { drop(S.d.visits, el.dataset.id); render(); }); };

A.importGrades = function () {
  var f = S.temp.gradeFile; if (!f) return;
  var meta = { teacherId: val('g_t'), subject: val('g_s'), cls: val('g_c'), period: val('g_p') };
  var slow = function () { return call('importGrades', Object.assign({ file: { name: f.name, mime: f.mime, data: f.data } }, meta)); };
  var job = /\.xlsx$/i.test(f.name) && f.raw && window.XlsxLite
    ? readXlsx(f.raw).then(function (sheets) { return call('importGradesParsed', Object.assign({ sheets: sheets, file: { name: f.name, data: f.data } }, meta)); }, function () { return slow(); })
    : slow();
  run(job).then(function (r) {
    r.records.forEach(function (g) { S.d.grades.push(g); });
    S.temp.gradeFile = null;
    toast('تم تحليل ' + r.records.length + (r.records.length === 1 ? ' صف' : ' صفوف') + (r.skipped.length ? ' · تُجوهلت أوراق فارغة: ' + r.skipped.length : ''));
    if (r.records.length === 1) go('grade', { id: r.records[0].id }); else render();
  });
};
A.names = function (el) {
  if (S.temp.names && S.temp.names.id === el.dataset.id) { S.temp.names = null; render(); return; }
  run(call('gradeStudents', { id: el.dataset.id })).then(function (r) { S.temp.names = { id: el.dataset.id, list: r.students }; render(); });
};
A.gradeEntry = function (el) {
  var g = byId(S.d.grades, el.dataset.id);
  if (!g.teacherId) { var tid = prompt('هذا التحليل بلا معلمة. اكتبي رقم المعلمة من القائمة:\n' + activeTeachers().map(function (t, i) { return (i + 1) + '. ' + t.name; }).join('\n')); var t = activeTeachers()[Number(tid) - 1]; if (!t) return; return run(call('updateGrades', { id: g.id, teacherId: t.id })).then(function (r) { upsert(S.d.grades, r); A.gradeEntry(el); }); }
  run(call('gradesToEntry', { id: g.id, indicatorNo: 1 }), 'أُضيف دليلاً للمؤشر 1 في ملف المعلمة').then(function (r) { S.d.entries.push(r); });
};
A.gradeRemedial = function (el) {
  var g = byId(S.d.grades, el.dataset.id), s = g.stats || {};
  S.temp.tpl = 'remedial'; S.temp.builder = null;
  go('formNew');
  setTimeout(function () { var t = document.getElementById('f_title'); if (t) t.value = 'الخطة العلاجية – ' + [g.subject, g.cls, g.period].filter(Boolean).join(' – '); var d = document.getElementById('f_desc'); if (d) d.value = 'عدد الطلبة المستهدفين بالخطة العلاجية: ' + (s.remedial || 0) + '. أضعف أداة تقويم: ' + (s.weakest ? s.weakest.name : '') + '. أرفقي الخطة ونتائج الطلبة.'; }, 0);
};
A.delGrade = function (el) { if (!confirm('حذف هذا التحليل؟')) return; run(call('deleteGrades', { id: el.dataset.id }), 'تم الحذف').then(function () { drop(S.d.grades, el.dataset.id); back(); }); };

A.saveMeeting = function (el) {
  var m = { id: el.dataset.id || undefined, number: val('m_no'), title: val('m_title'), date: val('m_date'), time: val('m_time'), topics: lines(val('m_topics')), recs: lines(val('m_recs')),
    attendees: Array.prototype.map.call(document.querySelectorAll('input[name="att"]:checked'), function (x) { return x.value; }) };
  if (!m.date) { toast('تاريخ الاجتماع مطلوب', true); return; }
  run(call('saveMeeting', { meeting: m }), 'تم حفظ المحضر').then(function (r) { upsert(S.d.meetings, r); back(); });
};
A.allAtt = function () { document.querySelectorAll('input[name="att"]').forEach(function (x) { x.checked = true; }); };
A.delMeeting = function (el) { if (!confirm('حذف المحضر؟')) return; run(call('deleteMeeting', { id: el.dataset.id }), 'تم الحذف').then(function () { drop(S.d.meetings, el.dataset.id); back(); }); };

A.saveFollowups = function () {
  var month = S.temp.month || today().slice(0, 7), rows = [];
  document.querySelectorAll('[data-fu]').forEach(function (box) {
    var values = {}, any = false;
    box.querySelectorAll('[data-fk]').forEach(function (g) {
      var picked = Array.prototype.map.call(g.querySelectorAll('input:checked'), function (x) { return x.value; });
      var mode = g.dataset.mode;
      values[g.dataset.fk] = mode === 'multi' ? picked : mode === 'check' ? picked.length > 0 : (picked[0] || '');
      if (picked.length) any = true;
    });
    var noteEl = box.querySelector('[data-fnote]'), notes = noteEl ? noteEl.value.trim() : '';
    if (notes) any = true;
    var had = S.d.followups.some(function (f) { return f.month === month && String(f.teacherId) === String(box.dataset.fu); });
    if (any || had) rows.push({ teacherId: box.dataset.fu, values: values, notes: notes });
  });
  var meta = { date: val('fu_date'), notes: val('fu_notes') };
  if (!rows.length && !meta.date && !meta.notes) { toast('لم تُدخل أي متابعة', true); return; }
  run(call('saveFollowups', { month: month, rows: rows, meta: meta }), 'تم حفظ متابعة ' + rows.length + ' معلمة').then(function (r) { r.forEach(function (x) { upsert(S.d.followups, x); }); render(); });
};

A.addPd = function () {
  var item = { term: S.tab.pd || '1', program: val('pd_prog'), date: val('pd_date'), target: val('pd_target'), presenter: val('pd_pres'), notes: val('pd_notes'), done: false };
  if (!item.program) { toast('اكتبي اسم البرنامج', true); return; }
  run(call('saveProfDev', { item: item }), 'أُضيف البرنامج').then(function (r) { S.d.profdev.push(r); render(); });
};
A.pdDone = function (el) { call('saveProfDev', { item: { id: el.dataset.id, done: el.checked } }).then(function (r) { upsert(S.d.profdev, r); render(); }, function (e) { toast(e.message, true); }); };
A.delPd = function (el) { if (!confirm('حذف البرنامج؟')) return; run(call('deleteProfDev', { id: el.dataset.id }), 'تم الحذف').then(function () { drop(S.d.profdev, el.dataset.id); render(); }); };

A.saveSettings = function () {
  var v = {};
  document.querySelectorAll('[data-sk]').forEach(function (x) { v[x.dataset.sk] = x.value.trim(); });
  var cls = JSON.parse(JSON.stringify(S.d.settings.classes || []));
  document.querySelectorAll('[data-ci]').forEach(function (x) { cls[Number(x.dataset.ci)][x.dataset.cf] = x.value.trim(); });
  v.classes = cls;
  run(call('saveSettings', { values: v }), 'تم حفظ الإعدادات').then(function (s) { S.d.settings = s; render(); });
};
A.saveTeacher = function (el) {
  var t = { id: el.dataset.id || undefined, active: document.getElementById('t_active').checked };
  document.querySelectorAll('[data-tk]').forEach(function (x) { t[x.dataset.tk] = x.value.trim(); });
  if (!t.name) { toast('الاسم مطلوب', true); return; }
  run(call('saveTeacher', { teacher: t }), 'تم الحفظ').then(function (r) { upsert(S.d.teachers, r); back(); });
};
A.changePw = function () {
  var o = val('pw_old'), n = document.getElementById('pw_new').value;
  if (n.length < 6) { toast('كلمة المرور الجديدة 6 أحرف على الأقل', true); return; }
  run(call('changePassword', { old: o, password: n }), 'تم تغيير كلمة المرور').then(function (r) { S.token = r.token; saveToken(r.token); render(); });
};
A.newYear = function () {
  var y = val('ny');
  if (!/^\d{4}\/\d{4}$/.test(y)) { toast('اكتبي العام بالصيغة 2027/2028', true); return; }
  if (!confirm('بدء العام الدراسي ' + y + '؟ تبقى بيانات العام الحالي محفوظة ويمكن الرجوع إليها.')) return;
  run(call('setYear', { year: y, backup: document.getElementById('ny_backup').checked }), 'بدأ العام ' + y).then(function () { S.stack = []; S.view = 'home'; return load(); });
};
A.backup = function () { run(call('backup'), 'تم إنشاء نسخة احتياطية في Drive'); };

/* تغييرات الحقول */
var CH = {};
CH.fuPick = function (el) {
  var g = el.closest('[data-mode]');
  if (g && g.dataset.mode === 'one' && el.checked) g.querySelectorAll('input').forEach(function (x) { if (x !== el) x.checked = false; });
};
CH.fuSubject = function (el) { S.temp.fuSubject = el.value; var a = document.getElementById('fu_print'); var month = S.temp.month || today().slice(0, 7); if (a) a.href = printUrl('followups', el.value ? { month: month, subject: el.value } : { month: month }); };
CH.owner = function (el) { S.temp.entry.owner = el.value; var keep = captureEntryDraft(); render(); restoreEntryDraft(keep); };
CH.entryFiles = function (el) {
  var files = Array.prototype.slice.call(el.files || []); if (!files.length) return;
  var st = S.temp.entry, owner = val('e_owner');
  run(Promise.all(files.map(readFile)).then(function (list) { return uploadAll(list, [owner === 'senior' ? 'المعلمة الأولى' : tname(owner)]); }), 'تم رفع ' + files.length + ' ملف').then(function (saved) {
    saved.forEach(function (f) { st.files.push(f); }); document.getElementById('filesBox').innerHTML = filesHtml(st); el.value = '';
  }, function () { el.value = ''; });
};
CH.tpl = function (el) { S.temp.tpl = el.value; S.temp.builder = null; render(); };
CH.supFile = function (el) { var f = el.files[0]; if (!f) return; readFile(f).then(function (x) { S.temp.supFiles = [x]; var sel = { t: val('sv_t'), d: val('sv_date'), p: val('sv_period'), s: val('sv_subj'), c: val('sv_cls'), g: val('sv_goal'), st: val('sv_status') }; render(); ['t', 'd', 'p', 's', 'c', 'g', 'st'].forEach(function (k) { var id = { t: 'sv_t', d: 'sv_date', p: 'sv_period', s: 'sv_subj', c: 'sv_cls', g: 'sv_goal', st: 'sv_status' }[k]; var e = document.getElementById(id); if (e) e.value = sel[k]; }); }, function (e) { toast(e.message, true); }); };
CH.gradeFile = function (el) { var f = el.files[0]; if (!f) return; if (!/\.xlsx?$/i.test(f.name)) { toast('اختاري ملف Excel', true); return; } var keep = { t: val('g_t'), s: val('g_s'), c: val('g_c'), p: val('g_p') }; readFile(f).then(function (x) { x.raw = f; S.temp.gradeFile = x; render(); document.getElementById('g_t').value = keep.t; document.getElementById('g_s').value = keep.s; document.getElementById('g_c').value = keep.c; document.getElementById('g_p').value = keep.p; }, function (e) { toast(e.message, true); }); };
CH.month = function (el) { S.temp.month = el.value; render(); };

function captureEntryDraft() { var o = {}; document.querySelectorAll('#app input.in, #app textarea.in').forEach(function (x) { if (x.id) o[x.id] = x.value; }); ['e_type', 'e_role', 'e_status'].forEach(function (n) { o['r:' + n] = checked(n); }); return o; }
function restoreEntryDraft(o) { Object.keys(o).forEach(function (k) { if (k.indexOf('r:') === 0) { var el = document.querySelector('input[name="' + k.slice(2) + '"][value="' + (o[k] || '').replace(/"/g, '') + '"]'); if (el) el.checked = true; } else { var e = document.getElementById(k); if (e && k !== 'e_ind') e.value = o[k]; } }); }

document.addEventListener('click', function (ev) {
  var el = ev.target.closest('[data-act]');
  if (!el || el.tagName === 'INPUT') return;
  var fn = A[el.dataset.act]; if (fn) { ev.preventDefault(); fn(el, ev); }
});
document.addEventListener('change', function (ev) {
  var el = ev.target;
  if (el.dataset && el.dataset.act && A[el.dataset.act] && el.tagName === 'INPUT') { A[el.dataset.act](el, ev); return; }
  if (el.dataset && el.dataset.change && CH[el.dataset.change]) CH[el.dataset.change](el, ev);
  if (el.id === 'e_ben' || el.id === 'e_tot') { var rb = document.getElementById('ratioBox'); if (rb) rb.innerHTML = ratioHtml(val('e_ben'), val('e_tot')); }
});
document.addEventListener('input', function (ev) {
  var el = ev.target;
  if (el.dataset && el.dataset.input === 'tq') { S.temp.tq = el.value; var box = document.getElementById('tlist'); if (box) box.innerHTML = teacherRows(activeTeachers().filter(function (t) { return !el.value.trim() || t.name.indexOf(el.value.trim()) >= 0; })); }
  if (el.dataset && el.dataset.bf) syncBuilder();
  if (el.id === 'e_ben' || el.id === 'e_tot') { var rb = document.getElementById('ratioBox'); if (rb) rb.innerHTML = ratioHtml(val('e_ben'), val('e_tot')); }
});
document.addEventListener('submit', function (ev) {
  if (ev.target.dataset.form !== 'login') return;
  ev.preventDefault();
  var pw = document.getElementById('pw').value;
  run(rpc('login', [pw])).then(function (r) { S.token = r.token; saveToken(r.token); var t = document.getElementById('toast'); if (t) t.style.display = 'none'; render(); return load(); });
});

/* الأخطاء تظهر للمستخدمة عبر toast داخل run()، فلا داعي لتسجيلها مرة أخرى */
window.addEventListener('unhandledrejection', function (ev) { ev.preventDefault(); });

/* بدء التشغيل */
S.token = loadToken();
render();
if (S.token) load().catch(function () {});
})();
