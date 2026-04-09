(function () {
  "use strict";

  var start = Date.now();

  function log(msg) {
    console.log("[hello_logger] " + msg);
  }

  function reportTiming() {
    var elapsed = Date.now() - start;
    log("Page loaded in " + elapsed + "ms");
    log("URL: " + window.location.pathname);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", reportTiming);
  } else {
    reportTiming();
  }
})();
