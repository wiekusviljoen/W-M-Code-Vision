(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const loader = $('#site-loader');
  const loaderVideo = $('.loader-video');
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
      const startIntro = async () => {
        if (loaderResolved || loaderVideo.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) return;
        loaderResolved = true;
        try {
          await loaderVideo.play();
        } catch (_) {
          // The first frame is ready even if the browser blocks autoplay.
        }
        // Let the footage paint behind the logo before revealing the page.
        requestAnimationFrame(() => requestAnimationFrame(hideLoader));
      };
      loaderVideo.addEventListener('canplay', startIntro);
      loaderVideo.addEventListener('error', () => {
        // If the video genuinely fails, reveal the page rather than trapping visitors.
        if (!loaderResolved) hideLoader();
      }, { once: true });
      loaderVideo.load();
      if (loaderVideo.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) startIntro();
    }
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

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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