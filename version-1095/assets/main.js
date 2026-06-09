(function () {
    var mobileToggle = document.querySelector('[data-mobile-toggle]');
    var mobileNav = document.querySelector('[data-mobile-nav]');

    if (mobileToggle && mobileNav) {
        mobileToggle.addEventListener('click', function () {
            mobileNav.classList.toggle('is-open');
        });
    }

    function setupHero(carousel) {
        var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-dot]'));
        var prev = carousel.querySelector('[data-hero-prev]');
        var next = carousel.querySelector('[data-hero-next]');
        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === current);
            });
        }

        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5600);
        }

        if (!slides.length) {
            return;
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(Number(dot.getAttribute('data-hero-dot')) || 0);
                restart();
            });
        });

        if (prev) {
            prev.addEventListener('click', function () {
                show(current - 1);
                restart();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                show(current + 1);
                restart();
            });
        }

        restart();
    }

    document.querySelectorAll('[data-hero-carousel]').forEach(setupHero);

    function setupSearch(scope) {
        var input = scope.querySelector('[data-search-input]');
        var cards = Array.prototype.slice.call(scope.querySelectorAll('.searchable-card'));
        var buttons = Array.prototype.slice.call(scope.querySelectorAll('[data-filter-button]'));
        var activeFilter = 'all';

        function apply() {
            var query = input ? input.value.trim().toLowerCase() : '';
            cards.forEach(function (card) {
                var text = (card.getAttribute('data-search') || card.textContent || '').toLowerCase();
                var type = card.getAttribute('data-filter') || '';
                var matchedQuery = !query || text.indexOf(query) !== -1;
                var matchedFilter = activeFilter === 'all' || type === activeFilter;
                card.hidden = !(matchedQuery && matchedFilter);
            });
        }

        if (input) {
            try {
                var initialQuery = new URLSearchParams(window.location.search).get('q');
                if (initialQuery && !input.value) {
                    input.value = initialQuery;
                }
            } catch (error) {}
            input.addEventListener('input', apply);
        }

        apply();

        buttons.forEach(function (button) {
            button.addEventListener('click', function () {
                activeFilter = button.getAttribute('data-filter-button') || 'all';
                buttons.forEach(function (item) {
                    item.classList.toggle('is-active', item === button);
                });
                apply();
            });
        });
    }

    document.querySelectorAll('[data-search-scope]').forEach(setupSearch);
}());
