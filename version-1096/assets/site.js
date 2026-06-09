(function () {
  var navToggle = document.querySelector(".nav-toggle");
  var navMenu = document.querySelector(".nav-menu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      var isOpen = navMenu.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
  var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
  var currentSlide = 0;
  var slideTimer = null;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }

    currentSlide = (index + slides.length) % slides.length;

    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle("active", slideIndex === currentSlide);
    });

    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle("active", dotIndex === currentSlide);
    });
  }

  function startSlides() {
    if (slides.length < 2) {
      return;
    }

    slideTimer = window.setInterval(function () {
      showSlide(currentSlide + 1);
    }, 5200);
  }

  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      var index = Number(dot.getAttribute("data-hero-dot") || 0);
      window.clearInterval(slideTimer);
      showSlide(index);
      startSlides();
    });
  });

  startSlides();

  var searchPanels = Array.prototype.slice.call(document.querySelectorAll(".search-panel"));

  searchPanels.forEach(function (panel) {
    var section = panel.parentElement;
    var list = section ? section.querySelector(".searchable-list") : null;
    var input = panel.querySelector(".search-input");
    var typeButtons = Array.prototype.slice.call(panel.querySelectorAll("[data-filter-type]"));
    var yearButtons = Array.prototype.slice.call(panel.querySelectorAll("[data-filter-year]"));
    var selectedType = "all";
    var selectedYear = "all";

    if (!list) {
      return;
    }

    function matches(card, query) {
      var haystack = [
        card.getAttribute("data-title"),
        card.getAttribute("data-type"),
        card.getAttribute("data-year"),
        card.getAttribute("data-tags"),
        card.getAttribute("data-region")
      ].join(" ").toLowerCase();
      var type = card.getAttribute("data-type") || "";
      var year = card.getAttribute("data-year") || "";
      var queryOk = !query || haystack.indexOf(query) !== -1;
      var typeOk = selectedType === "all" || type === selectedType;
      var yearOk = selectedYear === "all" || year === selectedYear;
      return queryOk && typeOk && yearOk;
    }

    function applyFilters() {
      var query = input ? input.value.trim().toLowerCase() : "";
      var cards = Array.prototype.slice.call(list.querySelectorAll(".movie-card"));

      cards.forEach(function (card) {
        card.classList.toggle("is-filtered-out", !matches(card, query));
      });
    }

    if (input) {
      input.addEventListener("input", applyFilters);
    }

    typeButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        selectedType = button.getAttribute("data-filter-type") || "all";
        typeButtons.forEach(function (item) {
          item.classList.toggle("active", item === button);
        });
        applyFilters();
      });
    });

    yearButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        selectedYear = button.getAttribute("data-filter-year") || "all";
        yearButtons.forEach(function (item) {
          item.classList.toggle("active", item === button);
        });
        applyFilters();
      });
    });
  });
})();

function initializeMoviePlayer(config) {
  var video = document.getElementById(config.videoId);
  var overlay = document.getElementById(config.overlayId);
  var source = config.source;
  var hlsInstance = null;
  var ready = false;

  if (!video || !overlay || !source) {
    return;
  }

  function attachSource() {
    if (ready) {
      return;
    }

    ready = true;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({
        enableWorker: true,
        lowLatencyMode: false
      });
      hlsInstance.loadSource(source);
      hlsInstance.attachMedia(video);
      return;
    }

    video.src = source;
  }

  function startPlayback() {
    attachSource();
    overlay.classList.add("is-hidden");
    var playResult = video.play();

    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(function () {
        overlay.classList.remove("is-hidden");
      });
    }
  }

  overlay.addEventListener("click", startPlayback);

  video.addEventListener("click", function () {
    if (video.paused) {
      startPlayback();
    }
  });

  video.addEventListener("play", function () {
    overlay.classList.add("is-hidden");
  });

  window.addEventListener("pagehide", function () {
    if (hlsInstance) {
      hlsInstance.destroy();
    }
  });
}
