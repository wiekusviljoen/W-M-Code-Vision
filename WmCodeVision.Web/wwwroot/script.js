(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Warm only local HTML links the visitor is about to use, without loading media.
  const prefetchedPages = new Set();
  const prefetchPage = event => {
    if (navigator.connection?.saveData) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !url.pathname.endsWith('.html') || url.pathname === location.pathname) return;
    url.hash = '';
    if (prefetchedPages.has(url.href)) return;
    prefetchedPages.add(url.href);
    const hint = document.createElement('link');
    hint.rel = 'prefetch';
    hint.href = url.href;
    document.head.appendChild(hint);
  };
  document.addEventListener('pointerover', prefetchPage, { passive: true });
  document.addEventListener('focusin', prefetchPage);

  // The homepage uses one lightweight looping preview; full films live in the gallery.
  const droneReel = $('#homepage-drone-reel');
  if (droneReel) {
    droneReel.defaultPlaybackRate = 0.8;
    droneReel.playbackRate = 0.8;
    if (reduceMotion) {
      droneReel.autoplay = false;
      droneReel.pause();
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


// Close dropdown when clicking outside, pressing Escape, or resizing.
document.addEventListener('DOMContentLoaded', () => {
 const toggle=document.querySelector('.menu-toggle');
 const nav=document.querySelector('.nav-links');
 if(!toggle||!nav)return;
 const close=()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation menu');};
 toggle.addEventListener('click',()=>toggle.setAttribute('aria-label',nav.classList.contains('open')?'Close navigation menu':'Open navigation menu'));
 document.addEventListener('click',e=>{if(!toggle.contains(e.target)&&!nav.contains(e.target))close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){close();toggle.focus();}});
});

// Discreet page progress and feedback only where media is actively loading.
(() => {
  const track = document.createElement('div');
  track.className = 'page-load-track';
  track.setAttribute('aria-hidden', 'true');
  track.hidden = true;
  document.body.append(track);
  let trackTimer;
  const stop = () => { clearTimeout(trackTimer); track.hidden = true; };
  const start = () => { stop(); trackTimer = setTimeout(() => { track.hidden = false; trackTimer = setTimeout(stop, 10000); }, 200); };
  if (document.readyState !== 'complete') start();
  window.addEventListener('load', stop);
  window.addEventListener('pageshow', stop);
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href);
    if (url.origin === location.origin && url.pathname !== location.pathname && /\.html$/.test(url.pathname)) start();
  });
  const selectors = '.media-frame video, .reel-frame video, .showreel-tile video, .footage-photo-link img, .content-artwork img, .design-art img, .app-preview-screen img';
  document.querySelectorAll(selectors).forEach(media => {
    const video = media.tagName === 'VIDEO';
    const host = media.parentElement;
    host.classList.add('media-loading-host');
    const badge = document.createElement('span');
    badge.className = 'media-loading-badge';
    badge.setAttribute('role', 'status');
    badge.hidden = true;
    host.append(badge);
    let delay, deadline;
    const clear = () => { clearTimeout(delay); clearTimeout(deadline); };
    const done = () => { clear(); badge.hidden = true; };
    const unavailable = () => {
      clear(); badge.classList.add('is-unavailable');
      badge.textContent = navigator.onLine ? (video ? 'Video unavailable. Try again.' : 'Image unavailable.') : 'Reconnect to load this ' + (video ? 'video.' : 'image.');
      badge.hidden = false;
    };
    const loading = () => {
      clear();
      delay = setTimeout(() => {
        badge.classList.remove('is-unavailable');
        badge.textContent = video ? 'Loading video' : 'Loading image';
        badge.hidden = false;
        deadline = setTimeout(() => { badge.classList.add('is-unavailable'); badge.textContent = 'Taking longer than usual. Check your connection.'; }, 20000);
      }, 300);
    };
    media.addEventListener('error', unavailable);
    if (video) {
      ['waiting', 'play'].forEach(name => media.addEventListener(name, () => { if (media.readyState < 3) loading(); }));
      ['playing', 'canplay', 'pause', 'ended', 'emptied'].forEach(name => media.addEventListener(name, done));
      // Do not show an indefinite spinner on videos waiting for the visitor to press Play.
      if (media.autoplay && media.readyState < 3 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) loading();
    } else {
      media.addEventListener('load', done);
      if (media.complete) { if (!media.naturalWidth) unavailable(); }
      else if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
          if (entries.some(entry => entry.isIntersecting)) { if (!media.complete) loading(); observer.disconnect(); }
        });
        observer.observe(media);
      } else loading();
    }
    window.addEventListener('pageshow', () => { if (video ? media.readyState >= 3 : media.complete && media.naturalWidth) done(); });
  });
})();
