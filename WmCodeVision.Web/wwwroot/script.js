(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const loader = $('#site-loader');
  const loaderVideo = $('.loader-video');
  // Slow the aerial footage slightly for a calmer, more cinematic feel.
  [loaderVideo, $('#homepage-drone-reel')].filter(Boolean).forEach(video => {
    video.playbackRate = 0.8;
    video.defaultPlaybackRate = 0.8;
  });
  const hideLoader = () => {
    if (!loader || loader.classList.contains('is-done')) return;
    loader.classList.add('is-done');
    document.body.classList.remove('is-loading');
    document.documentElement.classList.remove('is-loading');
    document.body.classList.add('site-ready');
    window.setTimeout(() => loader.remove(), 750);
  };

  // Keep the intro visible until the actual background footage can play.
  // Do not use a timer that dismisses the loader while the drone video is still loading.
  if (loader) {
    document.body.classList.add('is-loading');
    if (!loaderVideo) {
      window.addEventListener('load', hideLoader, { once: true });
    } else {
      let loaderResolved = false;
      const startIntro = async (usePosterFallback = false) => {
        if (loaderResolved || (!usePosterFallback && loaderVideo.readyState < HTMLMediaElement.HAVE_FUTURE_DATA)) return;
        loaderResolved = true;
        try {
          loaderVideo.play().catch(() => {});
        } catch (_) {
          // The first frame is ready even if the browser blocks autoplay.
        }
        // Finish the progress sweep, then draw the W&M mark before opening the page.
        loader.classList.add('is-ready');
        const progress = $('.loader-progress span', loader);
        const drawLogo = () => {
          loader.classList.add('is-drawing');
          window.setTimeout(hideLoader, 3000);
        };
        if (progress) {
          progress.addEventListener('animationend', drawLogo, { once: true });
          // CSS switches the sweep to a finite completion animation in is-ready state.
          window.setTimeout(() => {
            if (!loader.classList.contains('is-drawing')) drawLogo();
          }, 900);
        } else {
          drawLogo();
        }
      };
      loaderVideo.addEventListener('canplay', startIntro);
      loaderVideo.addEventListener('error', () => {
        // If the video genuinely fails, reveal the page rather than trapping visitors.
        if (!loaderResolved) hideLoader();
      }, { once: true });
      loaderVideo.load();
      if (loaderVideo.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) startIntro();
      // On slow mobile connections, keep the sketches moving and use the poster
      // rather than trapping visitors indefinitely waiting for full video readiness.
      window.setTimeout(() => {
        if (!loaderResolved) startIntro(true);
      }, 0);
    }
  }

  // Homepage aerial showreel: play all three original drone films in sequence, then repeat.
  const droneReel = $('#homepage-drone-reel');
  if (droneReel) {
    const droneFilms = [
      { src: 'drone-film-01.mp4', poster: 'DJI_0211-poster.jpg' },
      { src: 'drone-film-02.mp4', poster: 'DJI_0227-poster.jpg' },
      { src: 'drone-film-03.mp4', poster: 'DJI_0478-poster.jpg' }
    ];
    let filmIndex = 0;
    const playDroneFilm = (index) => {
      filmIndex = (index + droneFilms.length) % droneFilms.length;
      const film = droneFilms[filmIndex];
      droneReel.poster = film.poster;
      droneReel.src = film.src;
      droneReel.load();
      const attempt = droneReel.play();
      if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});
    };
    droneReel.addEventListener('loadedmetadata', () => { droneReel.playbackRate = 0.8; }, { once: false });
    droneReel.addEventListener('ended', () => playDroneFilm(filmIndex + 1));
    droneReel.addEventListener('error', () => {
      if (droneReel.dataset.skipping) return;
      droneReel.dataset.skipping = 'true';
      window.setTimeout(() => {
        droneReel.dataset.skipping = '';
        playDroneFilm(filmIndex + 1);
      }, 250);
    });
    droneReel.addEventListener('playing', () => { droneReel.dataset.skipping = ''; });
    if (!reduceMotion) playDroneFilm(0);
  }

  const menuToggle = $('.menu-toggle');
  const navLinks = $('.nav-links');
  menuToggle?.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  $$('.nav-links a').forEach(link => link.addEventListener('click', () => {
    navLinks?.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  }));

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();


  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.12 });
    $$('.service-card, .section-heading, .about-visual, .about-copy, .contact-copy, .contact-form, .showreel-tile').forEach(el => {
      el.classList.add('reveal');
      observer.observe(el);
    });
  } else {
    $$('.reveal').forEach(el => el.classList.add('is-visible'));
  }

  const serviceSelect = $('#service');
  $$('.service-card a, [data-enquiry-service]').forEach(link => link.addEventListener('click', () => {
    const service = link.closest('.service-card')?.querySelector('h3')?.textContent || link.dataset.enquiryService;
    if (serviceSelect && service) {
      const option = [...serviceSelect.options].find(item => item.textContent.trim().toLowerCase() === service.trim().toLowerCase());
      if (option) serviceSelect.value = option.value || option.textContent;
    }
  }));

  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.reel-frame, .showreel-tile').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty('--pointer-x', (x * 5) + 'px');
        card.style.setProperty('--pointer-y', (y * 5) + 'px');
      }, { passive: true });
    });
  }
})();