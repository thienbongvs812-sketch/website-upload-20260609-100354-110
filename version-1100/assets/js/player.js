(function () {
  function attach(videoId, layerId, buttonId, stream) {
    const video = document.getElementById(videoId);
    const layer = document.getElementById(layerId);
    const button = document.getElementById(buttonId);
    if (!video || !stream) {
      return;
    }

    let ready = false;
    let hls = null;

    function prepare() {
      if (ready) {
        return;
      }
      ready = true;
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(stream);
        hls.attachMedia(video);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = stream;
      }
    }

    function start() {
      prepare();
      if (layer) {
        layer.classList.add("is-hidden");
      }
      const action = video.play();
      if (action && typeof action.catch === "function") {
        action.catch(function () {
          if (layer) {
            layer.classList.remove("is-hidden");
          }
        });
      }
    }

    prepare();

    if (layer) {
      layer.addEventListener("click", start);
    }
    if (button) {
      button.addEventListener("click", function (event) {
        event.stopPropagation();
        start();
      });
    }
    video.addEventListener("play", function () {
      if (layer) {
        layer.classList.add("is-hidden");
      }
    });
    video.addEventListener("pause", function () {
      if (video.currentTime === 0 && layer) {
        layer.classList.remove("is-hidden");
      }
    });
    window.addEventListener("beforeunload", function () {
      if (hls) {
        hls.destroy();
      }
    });
  }

  window.MoviePlayer = {
    attach: attach
  };
}());
