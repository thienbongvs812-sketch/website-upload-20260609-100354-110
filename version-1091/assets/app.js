(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function setupMobileNavigation() {
    var toggle = document.querySelector("[data-mobile-toggle]");
    var menu = document.querySelector("[data-mobile-nav]");
    if (!toggle || !menu) {
      return;
    }
    toggle.addEventListener("click", function () {
      menu.classList.toggle("open");
    });
  }

  function setupFilters() {
    var scopes = document.querySelectorAll("[data-filter-scope]");
    scopes.forEach(function (scope) {
      var searchInput = scope.querySelector("[data-filter-search]");
      var regionSelect = scope.querySelector("[data-filter-region]");
      var typeSelect = scope.querySelector("[data-filter-type]");
      var yearSelect = scope.querySelector("[data-filter-year]");
      var result = scope.querySelector("[data-filter-result]");
      var grid = scope.parentElement.querySelector("[data-card-grid]") || document.querySelector("[data-card-grid]");
      if (!grid) {
        return;
      }
      var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-card]"));

      function update() {
        var query = normalize(searchInput ? searchInput.value : "");
        var region = regionSelect ? regionSelect.value : "";
        var type = typeSelect ? typeSelect.value : "";
        var year = yearSelect ? yearSelect.value : "";
        var visible = 0;

        cards.forEach(function (card) {
          var text = normalize(card.getAttribute("data-search"));
          var cardRegion = card.getAttribute("data-region") || "";
          var cardType = card.getAttribute("data-type") || "";
          var cardYear = card.getAttribute("data-year") || "";
          var matched = true;

          if (query && text.indexOf(query) === -1) {
            matched = false;
          }
          if (region && cardRegion !== region) {
            matched = false;
          }
          if (type && cardType.indexOf(type) === -1) {
            matched = false;
          }
          if (year && cardYear !== year) {
            matched = false;
          }

          card.classList.toggle("is-hidden", !matched);
          if (matched) {
            visible += 1;
          }
        });

        if (result) {
          result.textContent = "当前显示 " + visible + " 部影片";
        }
      }

      [searchInput, regionSelect, typeSelect, yearSelect].forEach(function (control) {
        if (control) {
          control.addEventListener("input", update);
          control.addEventListener("change", update);
        }
      });

      var params = new URLSearchParams(window.location.search);
      var q = params.get("q");
      if (q && searchInput) {
        searchInput.value = q;
      }
      update();
    });
  }

  window.createMoviePlayer = function (videoId, overlayId, streamUrl) {
    var video = document.getElementById(videoId);
    var overlay = document.getElementById(overlayId);
    var hls = null;
    var prepared = false;

    if (!video) {
      return;
    }

    function prepare() {
      if (prepared) {
        return;
      }
      prepared = true;
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (!data || !data.fatal) {
            return;
          }
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
            return;
          }
          if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
            return;
          }
          hls.destroy();
        });
        return;
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
        return;
      }
      video.src = streamUrl;
    }

    function play() {
      prepare();
      if (overlay) {
        overlay.hidden = true;
      }
      var attempt = video.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(function () {
          if (overlay) {
            overlay.hidden = false;
          }
        });
      }
    }

    if (overlay) {
      overlay.addEventListener("click", play);
    }
    video.addEventListener("click", function () {
      if (video.paused) {
        play();
      }
    });
    video.addEventListener("play", function () {
      if (overlay) {
        overlay.hidden = true;
      }
    });
    video.addEventListener("pause", function () {
      if (overlay && video.currentTime === 0) {
        overlay.hidden = false;
      }
    });
    prepare();
  };

  ready(function () {
    setupMobileNavigation();
    setupFilters();
  });
})();
