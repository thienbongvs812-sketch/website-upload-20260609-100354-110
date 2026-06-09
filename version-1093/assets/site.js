import { H as Hls } from './hls-vendor.js';

const mobileToggle = document.querySelector('[data-mobile-toggle]');
const mobilePanel = document.querySelector('[data-mobile-panel]');

if (mobileToggle && mobilePanel) {
  mobileToggle.addEventListener('click', () => {
    mobilePanel.classList.toggle('is-open');
  });
}

const hero = document.querySelector('[data-hero-carousel]');

if (hero) {
  const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
  const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
  let current = 0;

  const showSlide = (index) => {
    if (!slides.length) {
      return;
    }

    current = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === current);
    });

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === current);
    });
  };

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => showSlide(index));
  });

  window.setInterval(() => {
    showSlide(current + 1);
  }, 5200);
}

const normalize = (value) => (value || '').toString().trim().toLowerCase();

const searchInput = document.querySelector('#searchInput');
const yearFilter = document.querySelector('#yearFilter');
const typeFilter = document.querySelector('#typeFilter');
const regionFilter = document.querySelector('#regionFilter');
const resultCount = document.querySelector('#resultCount');
const searchResults = document.querySelector('#searchResults');

if (searchInput && searchResults) {
  const cards = Array.from(searchResults.querySelectorAll('.movie-card'));
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get('q') || '';

  searchInput.value = initialQuery;

  const applyFilters = () => {
    const keyword = normalize(searchInput.value);
    const year = normalize(yearFilter ? yearFilter.value : '');
    const type = normalize(typeFilter ? typeFilter.value : '');
    const region = normalize(regionFilter ? regionFilter.value : '');
    let visibleCount = 0;

    cards.forEach((card) => {
      const haystack = normalize([
        card.dataset.title,
        card.dataset.year,
        card.dataset.type,
        card.dataset.region,
        card.dataset.category,
        card.dataset.genre,
        card.dataset.tags,
        card.textContent
      ].join(' '));

      const matchesKeyword = !keyword || haystack.includes(keyword);
      const matchesYear = !year || normalize(card.dataset.year) === year;
      const matchesType = !type || normalize(card.dataset.type) === type;
      const matchesRegion = !region || normalize(card.dataset.region) === region;
      const isVisible = matchesKeyword && matchesYear && matchesType && matchesRegion;

      card.classList.toggle('is-hidden', !isVisible);

      if (isVisible) {
        visibleCount += 1;
      }
    });

    if (resultCount) {
      resultCount.textContent = String(visibleCount);
    }
  };

  [searchInput, yearFilter, typeFilter, regionFilter].forEach((element) => {
    if (element) {
      element.addEventListener('input', applyFilters);
      element.addEventListener('change', applyFilters);
    }
  });

  applyFilters();
}

const loadHlsSource = (video, source, message) => {
  if (!video || !source) {
    return Promise.reject(new Error('播放源不存在'));
  }

  if (video.dataset.loaded === 'true') {
    return Promise.resolve();
  }

  if (Hls && Hls.isSupported()) {
    return new Promise((resolve, reject) => {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });

      window.__staticMoviePlayers = window.__staticMoviePlayers || [];
      window.__staticMoviePlayers.push(hls);

      hls.loadSource(source);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.dataset.loaded = 'true';
        resolve();
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data && data.fatal) {
          const error = new Error('视频加载失败，请稍后重试');
          if (message) {
            message.textContent = error.message;
          }
          reject(error);
        }
      });
    });
  }

  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = source;
    video.dataset.loaded = 'true';
    return Promise.resolve();
  }

  return Promise.reject(new Error('当前浏览器不支持 HLS 播放'));
};

document.querySelectorAll('[data-player]').forEach((player) => {
  const source = player.dataset.source;
  const video = player.querySelector('video');
  const button = player.querySelector('[data-play-button]');
  const message = player.querySelector('[data-player-message]');

  const play = () => {
    if (message) {
      message.textContent = '正在加载播放源…';
    }

    loadHlsSource(video, source, message)
      .then(() => {
        if (button) {
          button.classList.add('is-hidden');
        }

        if (message) {
          message.textContent = '';
        }

        return video.play();
      })
      .catch((error) => {
        if (message) {
          message.textContent = error.message || '播放失败，请稍后重试';
        }
      });
  };

  if (button) {
    button.addEventListener('click', play);
  }

  if (video) {
    video.addEventListener('play', () => {
      if (button) {
        button.classList.add('is-hidden');
      }
    });
  }
});
