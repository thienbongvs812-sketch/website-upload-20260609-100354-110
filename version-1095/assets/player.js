(function () {
    function initMoviePlayer(options) {
        var video = document.querySelector(options.videoSelector);
        var trigger = document.querySelector(options.triggerSelector);
        var shell = document.querySelector(options.shellSelector);
        var attached = false;
        var hls = null;

        if (!video || !options.source) {
            return;
        }

        if (options.poster) {
            video.poster = options.poster;
        }

        function nativeHlsReady() {
            return video.canPlayType('application/vnd.apple.mpegurl') || video.canPlayType('application/x-mpegURL');
        }

        function attach() {
            if (attached) {
                return;
            }

            attached = true;

            if (nativeHlsReady()) {
                video.src = options.source;
                return;
            }

            if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(options.source);
                hls.attachMedia(video);
                return;
            }

            video.src = options.source;
        }

        function begin() {
            attach();
            if (trigger) {
                trigger.classList.add('is-hidden');
            }
            var playResult = video.play();
            if (playResult && typeof playResult.catch === 'function') {
                playResult.catch(function () {});
            }
        }

        if (trigger) {
            trigger.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                begin();
            });
        }

        if (shell) {
            shell.addEventListener('click', function (event) {
                if (event.target === shell || event.target === video) {
                    begin();
                }
            });
        }

        video.addEventListener('play', function () {
            if (trigger) {
                trigger.classList.add('is-hidden');
            }
        });

        video.addEventListener('error', function () {
            if (hls && typeof hls.recoverMediaError === 'function') {
                hls.recoverMediaError();
            }
        });
    }

    window.initMoviePlayer = initMoviePlayer;
}());
