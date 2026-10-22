(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Mobile navigation
  const menuToggle = $('.menu-toggle');
  const navLinks = $('.nav-links');
  menuToggle?.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
  $$('.nav-links a').forEach(link => link.addEventListener('click', () => {
    navLinks?.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  }));

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // Scroll-in reveals, with reduced-motion support.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    }), { threshold: 0.12 });
    $$('.reveal, .service-card, .section-heading, .about-visual, .about-copy, .contact-copy, .contact-form').forEach(el => {
      el.classList.add('reveal');
      revealObserver.observe(el);
    });
  } else {
    $$('.reveal').forEach(el => el.classList.add('is-visible'));
  }

  // Custom interactive 3D scene. The page remains useful if WebGL/CDN is unavailable.
  const canvas = $('#studio-canvas');
  const stage = $('.studio-stage');
  const sceneStatus = $('.scene-status');
  const fallback = $('.scene-fallback');
  let renderer, scene, camera, mainObject, ringGroup, starField, animationId;
  let targetX = 0, targetY = 0, pointerX = 0, pointerY = 0;
  let activeShape = 'knot';
  const objects = {};

  function init3D(THREE) {
    if (!canvas || !stage) return;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
      renderer.setSize(stage.clientWidth, stage.clientHeight, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x000000, 0);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(42, stage.clientWidth / stage.clientHeight, 0.1, 100);
      camera.position.set(0, 0, 8.6);

      scene.add(new THREE.AmbientLight(0xffffff, 1.6));
      const keyLight = new THREE.PointLight(0xc8f36a, 45, 25);
      keyLight.position.set(3, 3, 5); scene.add(keyLight);
      const warmLight = new THREE.PointLight(0xd69a63, 30, 20);
      warmLight.position.set(-4, -2, 3); scene.add(warmLight);

      const material = new THREE.MeshPhysicalMaterial({
        color: 0xc8f36a, metalness: 0.68, roughness: 0.22,
        clearcoat: 1, clearcoatRoughness: 0.14
      });
      const goldMaterial = new THREE.MeshStandardMaterial({
        color: 0xd69a63, metalness: 0.8, roughness: 0.25
      });
      const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x7c9b88, metalness: 0.32, roughness: 0.12,
        transmission: 0.35, transparent: true, opacity: 0.9, clearcoat: 1
      });
      mainObject = new THREE.Group();
      scene.add(mainObject);

      objects.knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.02, 0.3, 180, 24, 2, 3), material);
      objects.orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.22, 4), glassMaterial);
      objects.orb.material = glassMaterial.clone();
      objects.orb.material.wireframe = false;
      objects.orb.scale.setScalar(0.92);
      objects.rings = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85 + i * 0.16, 0.025, 12, 120), i % 2 ? goldMaterial : material);
        ring.rotation.x = Math.PI / 2 + i * 0.45;
        ring.rotation.y = i * 0.62;
        objects.rings.add(ring);
      }
      objects.cube = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.65, 1.65, 3, 3, 3),
        new THREE.MeshPhysicalMaterial({ color: 0xc8f36a, metalness: 0.55, roughness: 0.2, wireframe: true }));
      Object.values(objects).forEach(obj => { obj.visible = false; mainObject.add(obj); });
      Object.entries(objects).forEach(([name, object]) => { object.visible = name === activeShape; });
      ringGroup = new THREE.Group();
      scene.add(ringGroup);
      const outer = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.008, 8, 160), new THREE.MeshBasicMaterial({ color: 0xc8f36a, transparent: true, opacity: 0.48 }));
      outer.rotation.x = 1.15; outer.rotation.y = 0.28; ringGroup.add(outer);
      const outer2 = new THREE.Mesh(new THREE.TorusGeometry(2.32, 0.006, 8, 160), new THREE.MeshBasicMaterial({ color: 0xd69a63, transparent: true, opacity: 0.4 }));
      outer2.rotation.x = 0.5; outer2.rotation.y = -0.5; ringGroup.add(outer2);

      const positions = [];
      for (let i = 0; i < 700; i++) {
        positions.push((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 11, (Math.random() - 0.5) * 8 - 2);
      }
      const starGeometry = new THREE.BufferGeometry();
      starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      starField = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xb6c3a2, size: 0.018, transparent: true, opacity: 0.72 }));
      scene.add(starField);
      if (fallback) fallback.hidden = true;
      if (sceneStatus) sceneStatus.textContent = 'INTERACTIVE 3D / DRAG TO EXPLORE';

      const resize = () => {
        if (!renderer || !camera || !stage) return;
        const w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight);
        renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', resize, { passive: true });

      const clock = new THREE.Clock();
      const animate = () => {
        animationId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        mainObject.rotation.y += (targetX * 0.12 - mainObject.rotation.y) * 0.025;
        mainObject.rotation.x += (targetY * 0.12 - mainObject.rotation.x) * 0.025;
        mainObject.rotation.y += 0.003;
        mainObject.position.y = Math.sin(t * 0.8) * 0.12;
        ringGroup.rotation.z = t * 0.055;
        ringGroup.rotation.y = Math.sin(t * 0.3) * 0.12;
        starField.rotation.y = t * 0.008;
        renderer.render(scene, camera);
      };
      animate();
    } catch (error) {
      console.warn('3D scene could not start; using the static visual fallback.', error);
      if (sceneStatus) sceneStatus.textContent = 'DESIGNED TO MOVE / BUILT TO WORK';
    }
  }

  stage?.addEventListener('pointermove', event => {
    const rect = stage.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) / rect.width - 0.5;
    pointerY = (event.clientY - rect.top) / rect.height - 0.5;
    targetX = pointerX * 2.2;
    targetY = pointerY * 1.4;
    stage.style.setProperty('--pointer-x', `${pointerX * 16}px`);
    stage.style.setProperty('--pointer-y', `${pointerY * 16}px`);
  }, { passive: true });
  stage?.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; });
  // Playground cursor movement is handled by CSS fallback.

  $$('.shape-button').forEach(button => button.addEventListener('click', () => {
    activeShape = button.dataset.shape;
    const visualOrb = $(".playground-orb"); if (visualOrb) visualOrb.dataset.shape = activeShape;
    const visualFallback = $(".scene-fallback"); if (visualFallback) visualFallback.dataset.shape = activeShape;
    Object.entries(objects).forEach(([name, object]) => { object.visible = name === activeShape; });
    $$('.shape-button').forEach(item => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    const labels = { knot: 'TORUS KNOT / 01', orb: 'CRYSTAL ORB / 02', rings: 'ORBITAL RINGS / 03', cube: 'WIREFRAME CUBE / 04' };
    const shapeLabel = $('.shape-current');
    if (shapeLabel) shapeLabel.textContent = labels[activeShape];
    if (!renderer && fallback) fallback.dataset.shape = activeShape;
  }));

  // Interactive service cards preselect the matching enquiry.
  const serviceSelect = $('#service');
  $$('.service-card a, [data-enquiry-service]').forEach(link => link.addEventListener('click', () => {
    const service = link.closest('.service-card')?.querySelector('h3')?.textContent || link.dataset.enquiryService;
    if (serviceSelect && service) {
      const option = [...serviceSelect.options].find(item => item.textContent.trim().toLowerCase() === service.trim().toLowerCase());
      if (option) serviceSelect.value = option.value || option.textContent;
    }
  }));

  // Gentle 3D tilt on service cards on pointer devices only.
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.service-card, .interactive-panel').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty('--tilt-x', `${-y * 3}deg`);
        card.style.setProperty('--tilt-y', `${x * 4}deg`);
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
  }

  // Optional external 3D library; CSS still supplies a polished fallback offline.
  const threeScript = document.createElement('script');
  threeScript.src = 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.min.js';
  threeScript.async = true;
  threeScript.onload = () => { if (window.THREE) init3D(window.THREE); };
  threeScript.onerror = () => {
    if (sceneStatus) sceneStatus.textContent = '3D PREVIEW / MOTION-READY FALLBACK';
    if (fallback) fallback.hidden = false;
  };
  document.head.appendChild(threeScript);

  // Respect reduced-motion settings by stopping nonessential continuous animation.
  if (reduceMotion && animationId) cancelAnimationFrame(animationId);
})();


