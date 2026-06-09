(function () {
    var menuButton = document.querySelector("[data-menu-button]");
    var mobileNav = document.querySelector("[data-mobile-nav]");

    if (menuButton && mobileNav) {
        menuButton.addEventListener("click", function () {
            mobileNav.classList.toggle("is-open");
        });
    }

    document.querySelectorAll("img").forEach(function (image) {
        image.addEventListener("error", function () {
            image.classList.add("image-missing");
        });
    });

    document.querySelectorAll("[data-hero]").forEach(function (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var prev = hero.querySelector("[data-hero-prev]");
        var next = hero.querySelector("[data-hero-next]");
        var activeIndex = 0;
        var timer = null;

        function show(index) {
            if (!slides.length) {
                return;
            }
            activeIndex = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === activeIndex);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === activeIndex);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(activeIndex + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                start();
            });
        });

        if (prev) {
            prev.addEventListener("click", function () {
                show(activeIndex - 1);
                start();
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                show(activeIndex + 1);
                start();
            });
        }

        hero.addEventListener("mouseenter", stop);
        hero.addEventListener("mouseleave", start);
        show(0);
        start();
    });

    document.querySelectorAll("[data-filter-panel]").forEach(function (panel) {
        var input = panel.querySelector("[data-filter-input]");
        var year = panel.querySelector("[data-filter-year]");
        var type = panel.querySelector("[data-filter-type]");
        var scope = panel.closest("section") || document;
        var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-movie-card]"));

        function normalize(value) {
            return String(value || "").toLowerCase().trim();
        }

        function applyFilter() {
            var keyword = normalize(input && input.value);
            var selectedYear = year ? year.value : "";
            var selectedType = type ? type.value : "";

            cards.forEach(function (card) {
                var text = normalize([
                    card.getAttribute("data-title"),
                    card.getAttribute("data-region"),
                    card.getAttribute("data-type"),
                    card.getAttribute("data-genre"),
                    card.getAttribute("data-tags")
                ].join(" "));
                var matchKeyword = !keyword || text.indexOf(keyword) !== -1;
                var matchYear = !selectedYear || card.getAttribute("data-year") === selectedYear;
                var matchType = !selectedType || card.getAttribute("data-type") === selectedType;
                card.classList.toggle("is-filter-hidden", !(matchKeyword && matchYear && matchType));
            });
        }

        [input, year, type].forEach(function (field) {
            if (field) {
                field.addEventListener("input", applyFilter);
                field.addEventListener("change", applyFilter);
            }
        });
    });

    document.querySelectorAll("[data-player]").forEach(function (player) {
        var video = player.querySelector("video");
        var button = player.querySelector("[data-player-start]");
        var message = player.querySelector("[data-player-message]");
        var stream = player.getAttribute("data-stream") || "";
        var attached = false;

        function showMessage(text) {
            if (!message) {
                return;
            }
            message.textContent = text;
            message.classList.add("is-visible");
            window.setTimeout(function () {
                message.classList.remove("is-visible");
            }, 2800);
        }

        function attachStream() {
            if (attached || !video || !stream) {
                return;
            }
            attached = true;
            if (window.Hls && window.Hls.isSupported()) {
                var hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(stream);
                hls.attachMedia(video);
                hls.on(window.Hls.Events.ERROR, function (event, data) {
                    if (data && data.fatal) {
                        showMessage("视频加载失败，请刷新重试");
                    }
                });
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = stream;
            } else {
                video.src = stream;
            }
        }

        function playVideo() {
            attachStream();
            if (!video) {
                return;
            }
            var playTask = video.play();
            if (playTask && playTask.catch) {
                playTask.catch(function () {
                    showMessage("点击视频区域可继续播放");
                });
            }
        }

        if (button) {
            button.addEventListener("click", function () {
                button.classList.add("is-hidden");
                playVideo();
            });
        }

        if (video) {
            video.addEventListener("play", function () {
                if (button) {
                    button.classList.add("is-hidden");
                }
            });
            video.addEventListener("pause", function () {
                if (button && video.currentTime === 0) {
                    button.classList.remove("is-hidden");
                }
            });
            video.addEventListener("click", function () {
                if (video.paused) {
                    playVideo();
                }
            });
        }
    });
})();
