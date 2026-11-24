/* بصمة التميّز – قارئ Excel خفيف في المتصفح (xlsx فقط) يعتمد على JSZip.
 * يُخرج لكل ورقة: { name, values, formulas } بنفس شكل getValues()/getFormulas() في Google Sheets،
 * حتى يحللها الخادم مباشرة بلا تحويل الملف إلى Google Sheets (أسرع بكثير). */
(function (root) {
  'use strict';

  function decode(s) {
    return String(s).replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, function (_, e) {
      var k = e.toLowerCase();
      if (k === 'amp') return '&'; if (k === 'lt') return '<'; if (k === 'gt') return '>';
      if (k === 'quot') return '"'; if (k === 'apos') return "'";
      return String.fromCodePoint(k.charAt(1) === 'x' ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10));
    });
  }
  function attr(tag, name) {
    var m = new RegExp('\\s' + name + '="([^"]*)"').exec(tag);
    return m ? decode(m[1]) : null;
  }
  function texts(xml) { // كل نصوص <t> داخل عنصر (يتجاهل النطق الصوتي rPh)
    var out = '', re = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>|<t(?:\s[^>]*)?\/>|<rPh\b[\s\S]*?<\/rPh>/g, m;
    while ((m = re.exec(xml))) if (m[0].slice(0, 4) !== '<rPh' && m[1] !== undefined) out += decode(m[1]);
    return out;
  }
  function colIndex(ref) {
    var m = /^([A-Z]+)(\d+)$/.exec(ref);
    if (!m) return null;
    var c = 0;
    for (var i = 0; i < m[1].length; i++) c = c * 26 + (m[1].charCodeAt(i) - 64);
    return { c: c - 1, r: Number(m[2]) - 1 };
  }
  function resolve(base, target) {
    if (target.charAt(0) === '/') return target.slice(1);
    var parts = base.split('/'); parts.pop();
    target.split('/').forEach(function (p) { if (p === '..') parts.pop(); else if (p && p !== '.') parts.push(p); });
    return parts.join('/');
  }

  function parseSheet(xml, shared) {
    var cells = [], maxR = -1, maxC = -1;
    var data = /<sheetData\b[^>]*>([\s\S]*)<\/sheetData>/.exec(xml);
    if (!data) return { values: [], formulas: [] };
    var re = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g, m;
    var autoR = -1, autoC = -1;
    var body = data[1];
    while ((m = re.exec(body))) {
      var tag = '<c' + m[1] + '>', inner = m[2] || '';
      var ref = attr(tag, 'r');
      var pos = ref ? colIndex(ref) : null;
      if (!pos) { autoC++; pos = { r: Math.max(autoR, 0), c: autoC }; }
      autoR = pos.r; autoC = pos.c;
      var t = attr(tag, 't') || 'n';
      var fm = /<f\b([^>]*?)(?:\/>|>([\s\S]*?)<\/f>)/.exec(inner);
      var vm = /<v>([\s\S]*?)<\/v>/.exec(inner);
      var v = '';
      if (t === 's') v = vm ? (shared[Number(vm[1])] || '') : '';
      else if (t === 'inlineStr') v = texts(inner);
      else if (t === 'str' || t === 'e') v = vm ? decode(vm[1]) : '';
      else if (t === 'b') v = vm ? vm[1] === '1' : '';
      else if (vm && vm[1] !== '') { var num = Number(vm[1]); v = isNaN(num) ? decode(vm[1]) : num; }
      var f = fm ? '=' + (fm[2] ? decode(fm[2]) : 'SHARED') : '';
      if (v === '' && !f) continue;
      cells.push([pos.r, pos.c, v, f]);
      if (pos.r > maxR) maxR = pos.r;
      if (pos.c > maxC) maxC = pos.c;
    }
    var values = [], formulas = [];
    for (var r = 0; r <= maxR; r++) {
      var rv = [], rf = [];
      for (var c = 0; c <= maxC; c++) { rv.push(''); rf.push(''); }
      values.push(rv); formulas.push(rf);
    }
    cells.forEach(function (x) { values[x[0]][x[1]] = x[2]; formulas[x[0]][x[1]] = x[3]; });
    return { values: values, formulas: formulas };
  }

  /** data: ArrayBuffer/Uint8Array. يُرجع وعداً بقائمة الأوراق */
  function read(data, JSZipLib) {
    var Z = JSZipLib || root.JSZip;
    return Z.loadAsync(data).then(function (zip) {
      var get = function (p) { var f = zip.file(p); return f ? f.async('string') : Promise.resolve(''); };
      return Promise.all([get('xl/workbook.xml'), get('xl/_rels/workbook.xml.rels'), get('xl/sharedStrings.xml')]).then(function (r) {
        var wb = r[0], rels = r[1], ss = r[2];
        if (!wb) throw new Error('الملف ليس Excel صالحاً (xlsx)');
        var relMap = {}, m, re = /<Relationship\b[^>]*>/g;
        while ((m = re.exec(rels))) relMap[attr(m[0], 'Id')] = attr(m[0], 'Target');
        var shared = [], sre = /<si\b[^>]*>([\s\S]*?)<\/si>|<si\s*\/>/g;
        while ((m = sre.exec(ss))) shared.push(m[1] ? texts(m[1]) : '');
        var sheets = [], shre = /<sheet\b[^>]*\/?>/g;
        while ((m = shre.exec(wb))) {
          var rid = attr(m[0], 'r:id') || attr(m[0], 'id');
          var target = relMap[rid];
          if (target) sheets.push({ name: attr(m[0], 'name') || '', path: resolve('xl/workbook.xml', target) });
        }
        return Promise.all(sheets.map(function (sh) {
          return get(sh.path).then(function (xml) { var p = parseSheet(xml, shared); return { name: sh.name, values: p.values, formulas: p.formulas }; });
        }));
      });
    });
  }

  root.XlsxLite = { read: read, _parseSheet: parseSheet };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.XlsxLite;
})(typeof window !== 'undefined' ? window : globalThis);
