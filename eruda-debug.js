/**
 * eruda-debug.js — on-phone developer console, opt-in.
 *
 * eruda (https://github.com/liriliri/eruda) adds a floating DevTools panel
 * (Console, Network, Elements…) on top of the page, so you can read errors on a
 * phone without a USB cable. See README > "Mobile Debugging".
 *
 * It is OFF by default. Two ways to turn it on:
 *   - add ?debug to the page URL, e.g.  .../01_primitives.html?debug
 *     (this page only, nothing is remembered)
 *   - tick "On-phone console (eruda)" on the landing page: every example on this
 *     phone, until you untick it (saved in localStorage, the browser's small storage)
 * ?debug=0 hides it on one page even when the box is ticked.
 *
 * Load it as the FIRST script in <head> (classic script, no async/defer) so it
 * can catch errors thrown by the scripts that come after it.
 */
(function () {
  var params = new URLSearchParams(location.search);
  var on;
  if (params.has('debug')) {
    // 1. ?debug (or ?debug=1) in the URL wins, for THIS page only. ?debug=0 forces it off.
    on = params.get('debug') !== '0';
  } else {
    // 2. Otherwise use the landing-page checkbox, saved under the name 'erudaDebug'.
    //    localStorage can fail (private browsing, blocked storage): then it stays off.
    try { on = localStorage.getItem('erudaDebug') === '1'; } catch (e) { on = false; }
  }
  if (!on) return;

  // eruda's Network tab only lists files loaded by JavaScript (fetch/XHR): a missing
  // image, video, script or image target would show nothing useful. So we print a
  // clear "Could not load ..." line in the Console for those.
  function reportMissing(el) {
    if (el && el !== window && (el.src || el.href)) {
      console.error('Could not load ' + (el.src || el.href) + ' : wrong path or upper/lower case?');
    }
  }
  window.addEventListener('error', function (e) { reportMissing(e.target); }, true);
  window.addEventListener('unhandledrejection', function (e) { reportMissing(e.reason && e.reason.target); });

  // document.write keeps the load synchronous, so eruda is ready before the AR scripts run.
  document.write(
    '<script src="https://cdn.jsdelivr.net/npm/eruda@3/eruda.min.js"><\/script>' +
    '<script>eruda.init();<\/script>'
  );
})();
