/* بصمة التميّز – الاتصال بخادم Apps Script عبر fetch (بدون google.script.run) */
(function () {
  'use strict';
  function call(fn, args) {
    var url = window.BASMAT_API;
    if (!url || url.indexOf('PUT_') === 0) return Promise.reject(new Error('لم يُضبط رابط الخادم في config.js'));
    return fetch(url, {
      method: 'POST',
      // text/plain يجعل الطلب "بسيطاً" فلا يحتاج Apps Script إلى دعم CORS preflight
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn: fn, args: args || [] }),
      redirect: 'follow',
      credentials: 'omit'
    }).then(function (r) {
      if (!r.ok) throw new Error('تعذّر الاتصال بالخادم (' + r.status + ')');
      return r.text();
    }, function () {
      throw new Error('تعذّر الاتصال. تحققي من الإنترنت وحاولي مجدداً.');
    }).then(function (t) {
      var x;
      try { x = JSON.parse(t); } catch (e) { throw new Error('استجابة غير متوقعة من الخادم'); }
      return x;
    });
  }
  /* يُرجع وعداً بالبيانات، أو يرفض بخطأ يحمل auth=true إن انتهت الجلسة */
  window.basmatRpc = function (fn, args) {
    return call(fn, args).then(function (x) {
      if (x.ok) return x.data;
      var err = new Error(x.error || 'خطأ غير معروف');
      err.auth = !!x.auth;
      throw err;
    });
  };
})();
