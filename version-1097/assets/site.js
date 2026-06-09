(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  ready(function () {
    initNavigation();
    initHero();
    initSearchScopes();
    initHomeSearch();
    initActions();
    initPlayers();
  });

  function initNavigation() {
    var toggle = document.querySelector(".nav-toggle");
    if (!toggle) {
      return;
    }
    toggle.addEventListener("click", function () {
      document.body.classList.toggle("nav-open");
    });
    document.querySelectorAll(".main-nav a").forEach(function (link) {
      link.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
      });
    });
  }

  function initHero() {
    var slider = document.querySelector("[data-hero-slider]");
    if (!slider) {
      return;
    }
    var slides = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-dot]"));
    var prev = slider.querySelector("[data-hero-prev]");
    var next = slider.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        start();
      });
    });
    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    start();
  }

  function initSearchScopes() {
    document.querySelectorAll(".search-scope").forEach(function (scope) {
      var search = scope.querySelector(".js-search");
      var filters = Array.prototype.slice.call(scope.querySelectorAll(".js-filter"));
      var cards = Array.prototype.slice.call(scope.querySelectorAll(".movie-card, .rank-row"));
      if (!cards.length) {
        return;
      }

      function apply() {
        var query = search ? search.value.trim().toLowerCase() : "";
        var visible = 0;
        cards.forEach(function (card) {
          var text = (card.getAttribute("data-search") || "").toLowerCase();
          var matched = !query || text.indexOf(query) !== -1;
          filters.forEach(function (filter) {
            var field = filter.getAttribute("data-field");
            var value = filter.value;
            if (value && card.getAttribute("data-" + field) !== value) {
              matched = false;
            }
          });
          card.style.display = matched ? "" : "none";
          if (matched) {
            visible += 1;
          }
        });
        scope.classList.toggle("is-empty", visible === 0);
      }

      if (search) {
        search.addEventListener("input", apply);
      }
      filters.forEach(function (filter) {
        filter.addEventListener("change", apply);
      });
      apply();
    });
  }

  function initHomeSearch() {
    var input = document.querySelector(".home-search .js-search");
    if (!input) {
      return;
    }
    var cards = Array.prototype.slice.call(document.querySelectorAll("main .movie-card, main .rank-row"));
    if (!cards.length) {
      return;
    }
    input.addEventListener("input", function () {
      var query = input.value.trim().toLowerCase();
      cards.forEach(function (card) {
        var text = (card.getAttribute("data-search") || "").toLowerCase();
        card.style.display = !query || text.indexOf(query) !== -1 ? "" : "none";
      });
    });
  }

  function initActions() {
    document.querySelectorAll(".favorite-button").forEach(function (button) {
      button.addEventListener("click", function () {
        button.classList.toggle("is-active");
        button.textContent = button.classList.contains("is-active") ? "已收藏" : "收藏";
      });
    });

    document.querySelectorAll(".share-button").forEach(function (button) {
      button.addEventListener("click", function () {
        var payload = {
          title: button.getAttribute("data-title") || document.title,
          text: button.getAttribute("data-text") || document.title,
          url: window.location.href
        };
        if (navigator.share) {
          navigator.share(payload).catch(function () {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(payload.url).then(function () {
            var old = button.textContent;
            button.textContent = "已复制";
            window.setTimeout(function () {
              button.textContent = old;
            }, 1200);
          });
        }
      });
    });
  }

  function initPlayers() {
    document.querySelectorAll("[data-player]").forEach(function (panel) {
      var video = panel.querySelector("video");
      var button = panel.querySelector(".player-button");
      if (!video || !button) {
        return;
      }
      var streamUrl = video.getAttribute("data-stream");
      var setupPromise = null;
      var hlsInstance = null;

      function prepare() {
        if (setupPromise) {
          return setupPromise;
        }
        setupPromise = new Promise(function (resolve) {
          if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({
              enableWorker: true,
              lowLatencyMode: true
            });
            hlsInstance.loadSource(streamUrl);
            hlsInstance.attachMedia(video);
            hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
              resolve();
            });
            hlsInstance.on(window.Hls.Events.ERROR, function () {
              resolve();
            });
            window.setTimeout(resolve, 1400);
          } else {
            video.src = streamUrl;
            if (video.readyState >= 1) {
              resolve();
            } else {
              video.addEventListener("loadedmetadata", resolve, { once: true });
              window.setTimeout(resolve, 1400);
            }
          }
        });
        return setupPromise;
      }

      function play() {
        prepare().then(function () {
          var result = video.play();
          if (result && result.then) {
            result.catch(function () {});
          }
        });
      }

      button.addEventListener("click", play);
      video.addEventListener("click", function () {
        if (video.paused) {
          play();
        } else {
          video.pause();
        }
      });
      video.addEventListener("play", function () {
        panel.classList.add("is-playing");
      });
      video.addEventListener("pause", function () {
        panel.classList.remove("is-playing");
      });
      window.addEventListener("beforeunload", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }
})();
