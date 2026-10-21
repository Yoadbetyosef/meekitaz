/* Preview only: the press-logo masks are built from a template string, so resolve /press/<name>.png to embedded data at runtime. */
(function () {
  var M = __MAP__;
  var re = /url\(["']?\/press\/([a-z-]+)\.png["']?\)/g;
  function fix() {
    document.querySelectorAll('[style*="/press/"]').forEach(function (e) {
      e.setAttribute("style", e.getAttribute("style").replace(re, function (m, k) { return M[k] ? 'url("' + M[k] + '")' : m; }));
    });
  }
  fix();
  new MutationObserver(fix).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style"] });
})();
