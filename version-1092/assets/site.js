(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function setupMenu() {
    var toggle = qs('[data-menu-toggle]');
    var menu = qs('[data-menu]');
    var search = qs('.top-search');
    if (!toggle || !menu) {
      return;
    }
    toggle.addEventListener('click', function () {
      menu.classList.toggle('is-open');
      if (search) {
        search.classList.toggle('is-open');
      }
    });
  }

  function setupSearchNavigation() {
    qsa('[data-search-go]').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var input = qs('input[name="q"]', form);
        var query = input ? input.value.trim() : '';
        var url = './library.html';
        if (query) {
          url += '?q=' + encodeURIComponent(query);
        }
        window.location.href = url;
      });
    });
  }

  function setupFilters() {
    var panel = qs('[data-filter-panel]');
    if (!panel) {
      return;
    }
    var input = qs('[data-filter-input]');
    var year = qs('[data-filter-year]');
    var region = qs('[data-filter-region]');
    var empty = qs('[data-empty-state]');
    var cards = qsa('[data-card]');
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';
    if (query && input) {
      input.value = query;
    }

    function apply() {
      var text = normalize(input && input.value);
      var selectedYear = normalize(year && year.value);
      var selectedRegion = normalize(region && region.value);
      var visible = 0;
      cards.forEach(function (card) {
        var searchText = normalize(card.getAttribute('data-search'));
        var cardYear = normalize(card.getAttribute('data-year'));
        var cardRegion = normalize(card.getAttribute('data-region'));
        var matchedText = !text || searchText.indexOf(text) !== -1;
        var matchedYear = !selectedYear || cardYear === selectedYear;
        var matchedRegion = !selectedRegion || cardRegion === selectedRegion;
        var matched = matchedText && matchedYear && matchedRegion;
        card.hidden = !matched;
        if (matched) {
          visible += 1;
        }
      });
      if (empty) {
        empty.hidden = visible !== 0;
      }
    }

    [input, year, region].forEach(function (el) {
      if (el) {
        el.addEventListener('input', apply);
        el.addEventListener('change', apply);
      }
    });
    apply();
  }

  function setupHero() {
    var hero = qs('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = qsa('[data-hero-slide]', hero);
    var dots = qsa('[data-hero-dot]', hero);
    var prev = qs('[data-hero-prev]', hero);
    var next = qs('[data-hero-next]', hero);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function move(step) {
      show(index + step);
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        move(1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        move(-1);
        start();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        move(1);
        start();
      });
    }
    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        show(dotIndex);
        start();
      });
    });
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function setupPlayers() {
    qsa('[data-video-player]').forEach(function (shell) {
      var video = qs('video', shell);
      var button = qs('[data-play-button]', shell);
      var message = qs('[data-player-message]', shell.parentElement || document);
      var source = shell.getAttribute('data-source');
      var initialized = false;
      var hls = null;

      function setMessage(text) {
        if (message) {
          message.textContent = text || '';
        }
      }

      function init() {
        if (initialized || !video || !source) {
          return Promise.resolve();
        }
        initialized = true;
        setMessage('正在加载播放源');
        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hls.loadSource(source);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            setMessage('');
          });
          hls.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              setMessage('播放源暂时无法加载');
            }
          });
          return Promise.resolve();
        }
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          setMessage('');
          return Promise.resolve();
        }
        video.src = source;
        setMessage('');
        return Promise.resolve();
      }

      function play() {
        init().then(function () {
          var result = video.play();
          if (result && typeof result.catch === 'function') {
            result.catch(function () {
              setMessage('点击播放器可继续播放');
            });
          }
        });
      }

      if (button) {
        button.addEventListener('click', play);
      }
      if (video) {
        video.addEventListener('click', function () {
          if (video.paused) {
            play();
          } else {
            video.pause();
          }
        });
        video.addEventListener('play', function () {
          shell.classList.add('is-playing');
        });
        video.addEventListener('pause', function () {
          shell.classList.remove('is-playing');
        });
      }
      window.addEventListener('beforeunload', function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    setupSearchNavigation();
    setupFilters();
    setupHero();
    setupPlayers();
  });
}());
