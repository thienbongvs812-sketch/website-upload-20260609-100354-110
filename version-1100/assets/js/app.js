(function () {
  const root = document.body.getAttribute("data-root") || "./";
  const normalize = function (text) {
    return String(text || "").toLowerCase().trim();
  };

  const menuButton = document.querySelector(".menu-toggle");
  const mobilePanel = document.querySelector(".mobile-panel");
  if (menuButton && mobilePanel) {
    menuButton.addEventListener("click", function () {
      const opened = mobilePanel.hasAttribute("hidden");
      if (opened) {
        mobilePanel.removeAttribute("hidden");
      } else {
        mobilePanel.setAttribute("hidden", "");
      }
      menuButton.setAttribute("aria-expanded", String(opened));
    });
  }

  const slides = Array.from(document.querySelectorAll("[data-hero-slide]"));
  const dots = Array.from(document.querySelectorAll("[data-hero-dot]"));
  const prev = document.querySelector("[data-hero-prev]");
  const next = document.querySelector("[data-hero-next]");
  let current = 0;
  let timer = null;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle("is-active", slideIndex === current);
    });
    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle("is-active", dotIndex === current);
    });
  }

  function scheduleHero() {
    if (!slides.length) {
      return;
    }
    clearInterval(timer);
    timer = setInterval(function () {
      showSlide(current + 1);
    }, 5000);
  }

  if (slides.length) {
    showSlide(0);
    scheduleHero();
    if (prev) {
      prev.addEventListener("click", function () {
        showSlide(current - 1);
        scheduleHero();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        showSlide(current + 1);
        scheduleHero();
      });
    }
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        showSlide(Number(dot.getAttribute("data-hero-dot")) || 0);
        scheduleHero();
      });
    });
  }

  document.querySelectorAll("[data-filter-scope]").forEach(function (scope) {
    const keyword = scope.querySelector("[data-filter-keyword]");
    const year = scope.querySelector("[data-filter-year]");
    const type = scope.querySelector("[data-filter-type]");
    const cards = Array.from(scope.querySelectorAll(".movie-card"));
    const empty = scope.querySelector("[data-filter-empty]");

    function applyFilter() {
      const key = normalize(keyword && keyword.value);
      const selectedYear = year && year.value;
      const selectedType = type && type.value;
      let visible = 0;

      cards.forEach(function (card) {
        const text = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-region"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-type"),
          card.getAttribute("data-year")
        ].join(" "));
        const matchKey = !key || text.indexOf(key) !== -1;
        const matchYear = !selectedYear || card.getAttribute("data-year") === selectedYear;
        const matchType = !selectedType || card.getAttribute("data-type") === selectedType;
        const matched = matchKey && matchYear && matchType;
        card.hidden = !matched;
        if (matched) {
          visible += 1;
        }
      });

      if (empty) {
        empty.hidden = visible > 0;
      }
    }

    [keyword, year, type].forEach(function (node) {
      if (node) {
        node.addEventListener("input", applyFilter);
        node.addEventListener("change", applyFilter);
      }
    });
  });

  function movieCardHtml(movie) {
    const url = root + movie.url;
    const image = root + movie.cover;
    return [
      '<article class="movie-card">',
      '<a href="' + url + '" class="poster-link">',
      '<img src="' + image + '" alt="' + escapeHtml(movie.title) + '" loading="lazy" decoding="async">',
      '<span class="play-badge">▶</span>',
      '<span class="type-badge">' + escapeHtml(movie.type) + '</span>',
      '</a>',
      '<div class="card-body">',
      '<h3><a href="' + url + '">' + escapeHtml(movie.title) + '</a></h3>',
      '<div class="meta-row"><span>' + escapeHtml(movie.year) + '年</span><span>' + escapeHtml(movie.region) + '</span></div>',
      '</div>',
      '</article>'
    ].join("");
  }

  function escapeHtml(text) {
    return String(text || "").replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function searchMovies(query, limit) {
    if (typeof MOVIE_INDEX === "undefined") {
      return [];
    }
    const key = normalize(query);
    if (!key) {
      return [];
    }
    return MOVIE_INDEX.filter(function (movie) {
      return normalize([movie.title, movie.year, movie.region, movie.type, movie.genre, movie.tags].join(" ")).indexOf(key) !== -1;
    }).slice(0, limit || 24);
  }

  document.querySelectorAll(".global-search").forEach(function (form) {
    const input = form.querySelector("input[type='search']");
    const suggest = form.querySelector(".search-suggest");
    if (!input || !suggest) {
      return;
    }

    function renderSuggest() {
      const results = searchMovies(input.value, 6);
      if (!results.length) {
        suggest.hidden = true;
        suggest.innerHTML = "";
        return;
      }
      suggest.innerHTML = results.map(function (movie) {
        return '<a href="' + root + movie.url + '"><img src="' + root + movie.cover + '" alt="' + escapeHtml(movie.title) + '"><span><strong>' + escapeHtml(movie.title) + '</strong><small>' + escapeHtml(movie.year) + ' · ' + escapeHtml(movie.region) + '</small></span></a>';
      }).join("");
      suggest.hidden = false;
    }

    input.addEventListener("input", renderSuggest);
    input.addEventListener("focus", renderSuggest);
    document.addEventListener("click", function (event) {
      if (!form.contains(event.target)) {
        suggest.hidden = true;
      }
    });
  });

  const searchPage = document.querySelector("[data-search-page]");
  if (searchPage) {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q") || "";
    const input = searchPage.querySelector(".search-panel input");
    const title = searchPage.querySelector("[data-search-title]");
    const resultsWrap = searchPage.querySelector("[data-search-results]");
    const empty = searchPage.querySelector("[data-search-empty]");
    if (input) {
      input.value = query;
    }
    const results = searchMovies(query, 120);
    if (title) {
      title.textContent = query ? "“" + query + "” 的搜索结果" : "搜索结果";
    }
    if (resultsWrap) {
      resultsWrap.innerHTML = results.map(movieCardHtml).join("");
    }
    if (empty) {
      empty.hidden = results.length > 0 || !query;
    }
  }
}());
