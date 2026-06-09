(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function initNavigation() {
    var toggle = document.querySelector(".nav-toggle");
    var mobile = document.getElementById("mobileNav");
    if (!toggle || !mobile) {
      return;
    }
    toggle.addEventListener("click", function () {
      var open = mobile.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "×" : "☰";
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    var prev = hero.querySelector(".hero-control.prev");
    var next = hero.querySelector(".hero-control.next");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
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
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-slide")) || 0);
        start();
      });
    });
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function initFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll(".filter-panel"));
    panels.forEach(function (panel) {
      var scope = panel.parentElement || document;
      var list = scope.querySelector(".filter-list");
      if (!list) {
        list = document.querySelector(".filter-list");
      }
      if (!list) {
        return;
      }
      var cards = Array.prototype.slice.call(list.querySelectorAll(".movie-card, .horizontal-card"));
      var search = panel.querySelector(".js-search");
      var genre = panel.querySelector(".js-filter-genre");
      var year = panel.querySelector(".js-filter-year");
      var type = panel.querySelector(".js-filter-type");
      var reset = panel.querySelector(".filter-reset");
      var empty = scope.querySelector(".empty-state");

      function value(el) {
        return el ? String(el.value || "").trim().toLowerCase() : "";
      }

      function apply() {
        var q = value(search);
        var g = value(genre);
        var y = value(year);
        var t = value(type);
        var visible = 0;
        cards.forEach(function (card) {
          var haystack = [
            card.getAttribute("data-title"),
            card.getAttribute("data-genre"),
            card.getAttribute("data-region"),
            card.getAttribute("data-year"),
            card.getAttribute("data-type")
          ].join(" ").toLowerCase();
          var ok = true;
          if (q && haystack.indexOf(q) === -1) {
            ok = false;
          }
          if (g && String(card.getAttribute("data-genre") || "").toLowerCase().indexOf(g) === -1) {
            ok = false;
          }
          if (y && String(card.getAttribute("data-year") || "").toLowerCase().indexOf(y) === -1) {
            ok = false;
          }
          if (t && String(card.getAttribute("data-type") || "").toLowerCase().indexOf(t) === -1) {
            ok = false;
          }
          card.hidden = !ok;
          if (ok) {
            visible += 1;
          }
        });
        if (empty) {
          empty.hidden = visible !== 0;
        }
      }

      [search, genre, year, type].forEach(function (el) {
        if (el) {
          el.addEventListener("input", apply);
          el.addEventListener("change", apply);
        }
      });
      if (reset) {
        reset.addEventListener("click", function () {
          [search, genre, year, type].forEach(function (el) {
            if (el) {
              el.value = "";
            }
          });
          apply();
        });
      }
      scope.querySelectorAll("[data-pick-year]").forEach(function (link) {
        link.addEventListener("click", function (event) {
          event.preventDefault();
          if (year) {
            year.value = link.getAttribute("data-pick-year") || "";
            apply();
            panel.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        });
      });
      apply();
    });
  }

  function initPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll(".video-player"));
    players.forEach(function (video) {
      var stage = video.closest(".video-stage");
      var overlay = stage ? stage.querySelector(".js-player-start") : null;
      var stream = video.getAttribute("data-stream") || "";
      var attached = false;
      var hls = null;

      function attach() {
        if (attached || !stream) {
          return;
        }
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = stream;
        } else if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(stream);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad();
              } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
              }
            }
          });
        } else {
          video.src = stream;
        }
        attached = true;
      }

      function play() {
        attach();
        if (overlay) {
          overlay.classList.add("is-hidden");
        }
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {
            if (overlay) {
              overlay.classList.remove("is-hidden");
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
          overlay.classList.add("is-hidden");
        }
      });
      window.addEventListener("pagehide", function () {
        if (hls) {
          hls.destroy();
          hls = null;
        }
      });
    });
  }

  ready(function () {
    initNavigation();
    initHero();
    initFilters();
    initPlayers();
  });
})();
