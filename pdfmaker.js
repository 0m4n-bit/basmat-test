/* بصمة التميّز – صانع PDF في المتصفح بلا مكتبات.
 * يرسم مستند الكتل (نفس بيانات صفحة الطباعة) على صفحات A4 بـ canvas (يدعم العربية والاتجاه من اليمين لليسار)،
 * ثم يجمع الصفحات في ملف PDF حقيقي (صور JPEG). يعمل في آيفون وأندرويد والكمبيوتر. */
(function (root) {
  'use strict';
  var FONT = "'IBM Plex Sans Arabic', Tahoma, 'Segoe UI', sans-serif";
  var C = { ink: '#2E1D2A', muted: '#5F4D59', faint: '#8B7984', pri: '#AC5389', dark: '#7E3A64', line: '#B9A3B0', head: '#F3DDE7', sub: '#FAF0F5', kv: '#FAF4F7', box: '#FBF7F9' };
  var S = 2.5; // بكسل لكل نقطة (≈180dpi)

  function font(size, weight) { return (weight || 400) + ' ' + size + 'px ' + FONT; }

  function Doc(landscape) {
    this.W = landscape ? 842 : 595; this.H = landscape ? 595 : 842;
    this.mx = landscape ? 28 : 34; this.top = 36; this.bottom = this.H - 40;
    this.pages = []; this.newPage();
  }
  Doc.prototype.newPage = function () {
    var cv = document.createElement('canvas');
    cv.width = Math.round(this.W * S); cv.height = Math.round(this.H * S);
    var g = cv.getContext('2d');
    g.scale(S, S); g.fillStyle = '#fff'; g.fillRect(0, 0, this.W, this.H);
    g.direction = 'rtl'; g.textBaseline = 'alphabetic';
    this.pages.push(cv); this.g = g; this.y = this.top;
  };
  Doc.prototype.right = function () { return this.W - this.mx; };
  Doc.prototype.width = function () { return this.W - 2 * this.mx; };
  Doc.prototype.ensure = function (h) { if (this.y + h > this.bottom && this.y > this.top + 1) { this.newPage(); return true; } return false; };

  Doc.prototype.measure = function (text, f) { this.g.font = f; return this.g.measureText(text).width; };
  /** يقسم النص إلى أسطر بعرض أقصى */
  Doc.prototype.wrap = function (text, f, maxW) {
    var g = this.g; g.font = f;
    var out = [];
    String(text == null ? '' : text).split('\n').forEach(function (para) {
      var words = para.split(/\s+/).filter(function (w) { return w; });
      if (!words.length) { out.push(''); return; }
      var line = '';
      words.forEach(function (w) {
        var test = line ? line + ' ' + w : w;
        if (g.measureText(test).width <= maxW) { line = test; return; }
        if (line) out.push(line);
        if (g.measureText(w).width <= maxW) { line = w; return; }
        var part = '';
        Array.from(w).forEach(function (ch) { if (g.measureText(part + ch).width > maxW && part) { out.push(part); part = ch; } else part += ch; });
        line = part;
      });
      out.push(line);
    });
    return out;
  };
  Doc.prototype.text = function (s, x, y, f, color, align) {
    var g = this.g; g.font = f; g.fillStyle = color || C.ink; g.textAlign = align || 'right'; g.direction = 'rtl';
    g.fillText(s, x, y);
  };
  Doc.prototype.rect = function (x, y, w, h, fill, stroke, lw) {
    var g = this.g;
    if (fill) { g.fillStyle = fill; g.fillRect(x, y, w, h); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 0.7; g.strokeRect(x, y, w, h); }
  };
  Doc.prototype.dotted = function (x1, x2, y, color) {
    var g = this.g; g.save(); g.strokeStyle = color || C.muted; g.lineWidth = 0.7; g.setLineDash([1.2, 2]);
    g.beginPath(); g.moveTo(x1, y); g.lineTo(x2, y); g.stroke(); g.restore();
  };

  /* ---------- الكتل ---------- */
  Doc.prototype.header = function (D) {
    var sub = 'سلطنة عُمان · وزارة التعليم' + (D.subtitle ? ' · ' + D.subtitle : '');
    var f = font(9.5), lines = this.wrap(sub, f, this.width()), self = this;
    lines.forEach(function (l) { self.y += 13; self.text(l, self.right(), self.y, f, C.muted); });
    var ft = font(17, 700);
    this.wrap(D.title || '', ft, this.width()).forEach(function (l) { self.y += 24; self.text(l, self.right(), self.y, ft, C.dark); });
    this.y += 9; this.rect(this.mx, this.y, this.width(), 2.2, C.pri); this.y += 14;
  };
  Doc.prototype.heading = function (text, big) {
    var f = font(big ? 13 : 11.5, 700), lines = this.wrap(text, f, this.width() - 10), lh = big ? 19 : 17;
    this.ensure(lines.length * lh + 30);
    this.y += big ? 10 : 6;
    var y0 = this.y, self = this;
    lines.forEach(function (l) { self.y += lh; self.text(l, self.right() - (big ? 9 : 0), self.y - 4, f, big ? C.dark : C.ink); });
    if (big) this.rect(this.right() - 3, y0 + 2, 3, this.y - y0 - 2, C.pri);
    this.y += 5;
  };
  Doc.prototype.kv = function (rows) {
    var self = this, f = font(10.5), fb = font(10.5, 600), lh = 15.5, pad = 5;
    var W = this.width(), lw = Math.round(W * 0.38), vw = W - lw, R = this.right();
    rows.forEach(function (r) {
      var a = self.wrap(r[0], fb, lw - 2 * pad), b = self.wrap(r[1], f, vw - 2 * pad);
      var h = Math.max(a.length, b.length) * lh + 2 * pad;
      self.ensure(h);
      self.rect(R - lw, self.y, lw, h, C.kv, C.line); self.rect(self.mx, self.y, vw, h, null, C.line);
      a.forEach(function (l, i) { self.text(l, R - pad, self.y + pad + (i + 1) * lh - 4, fb); });
      b.forEach(function (l, i) { self.text(l, R - lw - pad, self.y + pad + (i + 1) * lh - 4, f); });
      self.y += h;
    });
    this.y += 8;
  };
  Doc.prototype.kv3 = function (rows) {
    var self = this, fb = font(10.5, 700), f = font(10.5), lh = 18, pad = 8, R = this.right(), W = this.width();
    var items = rows.map(function (r) {
      var lab = r[0] + ': ', lw = self.measure(lab, fb), vw = Math.max(self.measure(r[1] || '', f), 80);
      return { lab: lab, val: r[1] || '', lw: lw, vw: vw, w: lw + vw + 22 };
    });
    var lines = [[]], used = 0;
    items.forEach(function (it) { if (used + it.w > W - 2 * pad && lines[lines.length - 1].length) { lines.push([]); used = 0; } lines[lines.length - 1].push(it); used += it.w; });
    var h = lines.length * lh + 2 * pad;
    this.ensure(h);
    this.rect(this.mx, this.y, W, h, C.box, C.line);
    lines.forEach(function (ln, i) {
      var x = R - pad, y = self.y + pad + (i + 1) * lh - 5;
      ln.forEach(function (it) {
        self.text(it.lab, x, y, fb); x -= it.lw;
        self.text(it.val, x, y, f); self.dotted(x - it.vw, x, y + 3);
        x -= it.vw + 22;
      });
    });
    this.y += h + 8;
  };
  Doc.prototype.textBox = function (title, text) {
    if (title) this.heading(title, false);
    var self = this, f = font(10.5), lh = 15.5, pad = 7;
    var lines = this.wrap(text || '', f, this.width() - 2 * pad);
    if (!lines.length) lines = [''];
    var minH = 34;
    var i = 0;
    while (i < lines.length) {
      var room = Math.floor((this.bottom - this.y - 2 * pad) / lh);
      if (room < 2) { this.newPage(); continue; }
      var chunk = lines.slice(i, i + room);
      var h = Math.max(chunk.length * lh + 2 * pad, minH);
      this.rect(this.mx, this.y, this.width(), h, null, C.line);
      chunk.forEach(function (l, k) { self.text(l, self.right() - pad, self.y + pad + (k + 1) * lh - 4, f); });
      this.y += h; i += chunk.length;
      if (i < lines.length) this.newPage();
    }
    this.y += 8;
  };
  Doc.prototype.list = function (title, items) {
    this.heading(title, false);
    if (!items || !items.length) { this.textBox('', ''); return; }
    var self = this, f = font(10.5), lh = 15.5;
    items.forEach(function (it) {
      var lines = self.wrap(it, f, self.width() - 16);
      lines.forEach(function (l, k) {
        self.ensure(lh); self.y += lh;
        if (k === 0) self.text('•', self.right() - 2, self.y - 3, font(11, 700), C.pri);
        self.text(l, self.right() - 14, self.y - 3, f);
      });
    });
    this.y += 8;
  };
  Doc.prototype.sign = function (names) {
    var self = this, f = font(10.5, 600), n = names.length || 1, gap = 18;
    var cw = (this.width() - gap * (n - 1)) / n;
    this.ensure(78);
    this.y += 20;
    names.forEach(function (nm, i) {
      var xr = self.right() - i * (cw + gap), xc = xr - cw / 2;
      self.text(nm, xc, self.y + 12, f, C.ink, 'center');
      self.dotted(xr - cw, xr, self.y + 44);
      self.text('التوقيع', xc, self.y + 58, f, C.ink, 'center');
    });
    this.y += 70;
  };
  Doc.prototype.mark = function (cx, cy, on) {
    var g = this.g, s = 8.5;
    g.save(); g.lineWidth = 0.9; g.strokeStyle = on ? C.dark : C.line;
    if (on) { g.fillStyle = C.dark; g.fillRect(cx - s / 2, cy - s / 2, s, s); }
    g.strokeRect(cx - s / 2, cy - s / 2, s, s);
    if (on) { g.strokeStyle = '#fff'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(cx - 2.6, cy + 0.2); g.lineTo(cx - 0.6, cy + 2.2); g.lineTo(cx + 2.8, cy - 2.2); g.stroke(); }
    g.restore();
  };
  Doc.prototype.table = function (b) {
    var self = this, small = !!b.small, fs = small ? 9 : 10, f = font(fs), fh = font(fs, 700), fsub = font(small ? 7.8 : 8.5, 600);
    var lh = fs * 1.45, pad = small ? 3.5 : 5;
    var ncol = b.groups ? b.groups.reduce(function (n, g) { return n + (g.span || 1); }, 0) : b.head.length;
    var rows = (b.rows || []).map(function (r) { return r.map(function (c) { return c == null ? '' : String(c); }); });
    var empty = Math.max(0, (b.minRows || 0) - rows.length);
    for (var e = 0; e < empty; e++) { var er = []; for (var k = 0; k < ncol; k++) er.push(''); rows.push(er); }
    var isMark = function (c) { return c === '☑' || c === '☐'; };
    var markCol = [];
    for (var c = 0; c < ncol; c++) markCol.push(rows.length > 0 && rows.every(function (r) { return isMark(r[c]) || r[c] === '' || r[c] === ' '; }) && rows.some(function (r) { return isMark(r[c]); }));
    // رؤوس الأعمدة لكل عمود (للحساب)
    var colHead = [], groupCells = [], subCells = [];
    if (b.groups) {
      var ci = 0, hi = 0;
      b.groups.forEach(function (g) {
        var span = g.span || 1;
        groupCells.push({ text: g.text, c0: ci, span: span, two: g.rows > 1 });
        for (var s2 = 0; s2 < span; s2++) {
          if (g.rows > 1) colHead[ci] = g.text; else { colHead[ci] = b.head[hi]; subCells.push({ text: b.head[hi], c: ci }); hi++; }
          ci++;
        }
      });
    } else colHead = b.head.slice();
    // عرض الأعمدة
    var W = this.width(), cap = Math.min(220, W * 0.45);
    var nat = [], minw = [];
    for (c = 0; c < ncol; c++) {
      if (markCol[c]) { var hw = Math.min(self.measure(colHead[c] || '', b.groups ? fsub : fh), 46); nat[c] = Math.max(26, hw + 2 * pad); minw[c] = 24; continue; }
      var texts = [colHead[c] || ''].concat(rows.map(function (r) { return r[c] || ''; }));
      var n0 = 0, m0 = 0;
      texts.forEach(function (t, i) {
        var ff = i === 0 ? (b.groups ? fsub : fh) : f;
        n0 = Math.max(n0, Math.min(self.measure(t, ff), cap));
        String(t).split(/\s+/).forEach(function (w) { m0 = Math.max(m0, Math.min(self.measure(w, ff), 70)); });
      });
      nat[c] = n0 + 2 * pad + 1; minw[c] = Math.max(m0 + 2 * pad, 22);
    }
    var sumN = nat.reduce(function (a, x) { return a + x; }, 0), widths;
    if (sumN <= W) {
      var flex = 0; for (c = 0; c < ncol; c++) if (!markCol[c]) flex += nat[c];
      widths = nat.map(function (x, i) { return markCol[i] || !flex ? x : x + (W - sumN) * (x / flex); });
      if (!flex) widths = nat.map(function (x) { return x * W / sumN; });
    } else {
      var sumM = minw.reduce(function (a, x) { return a + x; }, 0);
      if (sumM >= W) widths = minw.map(function (x) { return x * W / sumM; });
      else { var kf = (W - sumM) / (sumN - sumM); widths = nat.map(function (x, i) { return minw[i] + (x - minw[i]) * kf; }); }
    }
    var xs = []; var xr = this.right();
    for (c = 0; c < ncol; c++) { xs.push(xr); xr -= widths[c]; } // الحافة اليمنى لكل عمود
    var spanW = function (c0, span) { var w = 0; for (var i = c0; i < c0 + span; i++) w += widths[i]; return w; };

    function drawCellText(lines, xRight, w, y, ff, color, center) {
      lines.forEach(function (l, i) { self.text(l, center ? xRight - w / 2 : xRight - pad, y + pad + (i + 1) * lh - 3.5, ff, color, center ? 'center' : 'right'); });
    }
    function drawHeader() {
      if (b.groups) {
        var gl = groupCells.map(function (g) { return self.wrap(g.text, fh, spanW(g.c0, g.span) - 2 * pad); });
        var sl = subCells.map(function (s) { return self.wrap(s.text, fsub, widths[s.c] - 2 * pad); });
        var h1 = 0, h2 = 0;
        groupCells.forEach(function (g, i) { if (!g.two) h1 = Math.max(h1, gl[i].length * lh + 2 * pad); });
        sl.forEach(function (l) { h2 = Math.max(h2, l.length * (lh - 1) + 2 * pad); });
        groupCells.forEach(function (g, i) { if (g.two) { var need = gl[i].length * lh + 2 * pad; if (need > h1 + h2) h1 = need - h2; } });
        self.ensure(h1 + h2 + 24);
        groupCells.forEach(function (g, i) {
          var w = spanW(g.c0, g.span), h = g.two ? h1 + h2 : h1;
          self.rect(xs[g.c0] - w, self.y, w, h, C.head, C.line);
          var off = (h - (gl[i].length * lh + 2 * pad)) / 2;
          drawCellText(gl[i], xs[g.c0], w, self.y + off, fh, C.ink, true);
        });
        subCells.forEach(function (s, i) {
          self.rect(xs[s.c] - widths[s.c], self.y + h1, widths[s.c], h2, C.sub, C.line);
          sl[i].forEach(function (l, k) { self.text(l, xs[s.c] - widths[s.c] / 2, self.y + h1 + pad + (k + 1) * (lh - 1) - 3.5, fsub, C.ink, 'center'); });
        });
        self.y += h1 + h2;
      } else {
        var hl = colHead.map(function (t, i) { return self.wrap(t, fh, widths[i] - 2 * pad); });
        var hh = Math.max.apply(null, hl.map(function (l) { return l.length; })) * lh + 2 * pad;
        self.ensure(hh + 24);
        hl.forEach(function (l, i) { self.rect(xs[i] - widths[i], self.y, widths[i], hh, C.head, C.line); drawCellText(l, xs[i], widths[i], self.y, fh, C.ink, markCol[i]); });
        self.y += hh;
      }
    }
    this.y += 3;
    drawHeader();
    if (!rows.length) {
      var hh0 = lh + 2 * pad;
      this.rect(this.mx, this.y, W, hh0, null, C.line);
      this.text('لا توجد بيانات', this.mx + W / 2, this.y + pad + lh - 3.5, f, C.faint, 'center');
      this.y += hh0 + 8; return;
    }
    rows.forEach(function (r) {
      var cl = r.map(function (t, i) { return markCol[i] ? [] : self.wrap(t, f, widths[i] - 2 * pad); });
      var rh = Math.max(1, Math.max.apply(null, cl.map(function (l) { return l.length; }))) * lh + 2 * pad;
      if (self.y + rh > self.bottom) { self.newPage(); drawHeader(); }
      for (var i = 0; i < ncol; i++) {
        self.rect(xs[i] - widths[i], self.y, widths[i], rh, null, C.line);
        if (markCol[i]) { if (isMark(r[i])) self.mark(xs[i] - widths[i] / 2, self.y + Math.min(rh / 2, pad + lh / 2 + 1), r[i] === '☑'); }
        else drawCellText(cl[i], xs[i], widths[i], self.y, f, C.ink, false);
      }
      self.y += rh;
    });
    this.y += 10;
  };

  function footers(doc) {
    var date = new Date().toLocaleDateString('ar-OM'), n = doc.pages.length;
    doc.pages.forEach(function (cv, i) {
      var g = cv.getContext('2d');
      g.save(); g.setTransform(S, 0, 0, S, 0, 0);
      g.font = font(8); g.fillStyle = C.faint; g.textAlign = 'center'; g.direction = 'rtl';
      g.fillText('أُعدّ عبر منصة بصمة التميّز · ' + date + (n > 1 ? ' · صفحة ' + (i + 1) + ' من ' + n : ''), doc.W / 2, doc.H - 18);
      g.restore();
    });
  }

  function layout(D) {
    var doc = new Doc(!!D.landscape);
    doc.header(D);
    (D.blocks || []).forEach(function (b) {
      if (b.type === 'h') doc.heading(b.text, true);
      else if (b.type === 'h2') doc.heading(b.text, false);
      else if (b.type === 'break') doc.newPage();
      else if (b.type === 'kv') doc.kv(b.rows || []);
      else if (b.type === 'kv3') doc.kv3(b.rows || []);
      else if (b.type === 'table') doc.table(b);
      else if (b.type === 'text') doc.textBox(b.title, b.text);
      else if (b.type === 'list') doc.list(b.title, b.items);
      else if (b.type === 'sign') doc.sign(b.names || []);
    });
    footers(doc);
    return doc;
  }

  /* ---------- كاتب PDF (صفحات JPEG) ---------- */
  function toJpeg(cv) {
    return new Promise(function (res, rej) {
      if (cv.toBlob) cv.toBlob(function (bl) { if (!bl) { rej(new Error('تعذّر إنشاء الصفحة')); return; } bl.arrayBuffer().then(function (ab) { res(new Uint8Array(ab)); }, rej); }, 'image/jpeg', 0.9);
      else { var d = atob(cv.toDataURL('image/jpeg', 0.9).split(',')[1]); var u = new Uint8Array(d.length); for (var i = 0; i < d.length; i++) u[i] = d.charCodeAt(i); res(u); }
    });
  }
  function buildPdf(doc, jpegs) {
    var parts = [], offs = [], len = 0, enc = function (s) { return new TextEncoder().encode(s); };
    var push = function (u) { parts.push(u); len += u.length; };
    var obj = function (n, body, stream) {
      offs[n] = len;
      push(enc(n + ' 0 obj\n' + body + (stream ? '\nstream\n' : '\nendobj\n')));
      if (stream) { push(stream); push(enc('\nendstream\nendobj\n')); }
    };
    push(enc('%PDF-1.4\n%âãÏÓ\n'));
    var n = jpegs.length, kids = [];
    for (var i = 0; i < n; i++) kids.push((3 + i * 3) + ' 0 R');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + n + ' >>');
    jpegs.forEach(function (jp, i) {
      var p = 3 + i * 3, cv = doc.pages[i];
      var content = enc('q ' + doc.W + ' 0 0 ' + doc.H + ' 0 0 cm /Im0 Do Q');
      obj(p, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + doc.W + ' ' + doc.H + '] /Resources << /XObject << /Im0 ' + (p + 2) + ' 0 R >> >> /Contents ' + (p + 1) + ' 0 R >>');
      obj(p + 1, '<< /Length ' + content.length + ' >>', content);
      obj(p + 2, '<< /Type /XObject /Subtype /Image /Width ' + cv.width + ' /Height ' + cv.height + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jp.length + ' >>', jp);
    });
    var total = 3 + n * 3, xref = len;
    var x = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
    for (var k = 1; k < total; k++) x += String(offs[k]).padStart(10, '0') + ' 00000 n \n';
    push(enc(x + 'trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n'));
    return new Blob(parts, { type: 'application/pdf' });
  }

  function loadFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var fam = '"IBM Plex Sans Arabic"';
    return Promise.all(['400', '600', '700'].map(function (w) { return document.fonts.load(w + ' 12px ' + fam, 'بصمة'); }))
      .then(function () { return document.fonts.ready; }, function () {});
  }

  /** D = مستند الكتل. يُرجع وعداً بـ Blob لملف PDF */
  function make(D) {
    return loadFonts().then(function () {
      var doc = layout(D);
      return doc.pages.reduce(function (p, cv) { return p.then(function (arr) { return toJpeg(cv).then(function (j) { arr.push(j); return arr; }); }); }, Promise.resolve([]))
        .then(function (jpegs) { return buildPdf(doc, jpegs); });
    });
  }

  root.BasmatPDF = { make: make, _layout: layout };
})(window);
