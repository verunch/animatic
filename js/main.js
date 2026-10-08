/* Mono design — Hero motion
   ?mode=static  — без анимаций (для конвертации в Figma)
   ?theme=light|dark
   Клавиши: T — сменить тему, R — повторить входную анимацию */

(function () {
  var root = document.documentElement;

  /* ---------- Тема ---------- */
  var themeBtn = document.querySelector('.theme-btn');
  var themeLabel = document.querySelector('.theme-btn__label');
  function syncLabel() { themeLabel.textContent = root.dataset.theme === 'light' ? 'Light' : 'Dark'; }
  function toggleTheme() {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('mono-theme', root.dataset.theme); } catch (e) {}
    syncLabel();
  }
  syncLabel();
  themeBtn.addEventListener('click', toggleTheme);
  document.addEventListener('keydown', function (e) {
    if (e.key === 't' || e.key === 'T') toggleTheme();
  });

  if (root.dataset.mode === 'static' || !window.gsap) {
    document.querySelector('.hero').style.visibility = 'visible';
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // ?record — покадровое время для записи видео (без Lenis и реального курсора)
  var REC = new URLSearchParams(location.search).has('record');

  /* ---------- Разбивка заголовка на буквы ---------- */
  document.querySelectorAll('.line__in').forEach(function (el) {
    el.innerHTML = el.textContent.split('').map(function (c) {
      return '<span class="ch">' + c + '</span>';
    }).join('');
  });

  /* ---------- Плавный скролл ---------- */
  if (window.Lenis && !reduce && !REC) {
    var lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  var q = function (s) { return document.querySelectorAll(s); };
  var E = 'power4.out';

  /* ---------- 1. Входная анимация ---------- */
  var intro = gsap.timeline({ paused: true, defaults: { ease: E } });
  intro
    .set('.hero', { visibility: 'visible' })
    .from('.grid i', { scaleY: 0, transformOrigin: 'top', duration: 1.4, stagger: 0.05, ease: 'power3.inOut' }, 0)
    .from('.grid-rows i', { scaleX: 0, transformOrigin: 'left', duration: 1.4, stagger: 0.05, ease: 'power3.inOut' }, 0.1)
    .from('.vline', { scaleY: 0, duration: 1.4, ease: 'power3.inOut' }, 0.2)
    .from('.hdr__line, .foot__line', { scaleX: 0, duration: 1.4, ease: 'power3.inOut' }, 0.1)
    .from('.slat', {
      clipPath: 'inset(100% 0% 0% 0%)', duration: 1.4, ease: 'power3.inOut',
      stagger: { each: 0.09, from: 'center' }
    }, 0.35)
    .from('.slat .ph', { scale: 1.35, duration: 2, stagger: { each: 0.09, from: 'center' } }, 0.35)
    .from('.dim--h', { scaleX: 0, duration: 1.2, ease: 'power3.inOut' }, 0.8)
    .from('.dim--v', { scaleY: 0, transformOrigin: 'top', duration: 1.2, ease: 'power3.inOut' }, 0.9)
    .from('.cross', { rotate: -90, autoAlpha: 0, duration: 1 }, 1.0)
    .from('.win__meta span, .dim span, .slat__id, .win__ph-label', { autoAlpha: 0, y: 8, duration: 0.8, stagger: 0.04 }, 1.1)
    .from('.line--1 .ch', { yPercent: 115, duration: 1.2, stagger: 0.03 }, 0.9)
    .from('.line--2 .ch', { yPercent: 115, duration: 1.2, stagger: 0.03 }, 1.1)
    .from('.logo, .nav a, .hdr__right > *', { autoAlpha: 0, y: -12, duration: 0.9, stagger: 0.05 }, 1.2)
    .from('.intro > *', { autoAlpha: 0, y: 20, duration: 1, stagger: 0.1 }, 1.4)
    .from('.lead .t-body-l, .ctas .btn', { autoAlpha: 0, y: 24, duration: 1, stagger: 0.1 }, 1.6)
    .from('.card', { autoAlpha: 0, y: 60, duration: 1.2 }, 1.7)
    .from('.bar__fill', { scaleX: 0, duration: 1.6, ease: 'power2.inOut' }, 2.0)
    .from('.foot > *:not(.foot__line), .steps li', { autoAlpha: 0, y: 10, duration: 0.8, stagger: 0.05 }, 1.8);

  /* ---------- 2. Слои: параллакс по курсору ---------- */
  var layers = [
    ['.grid, .grid-rows, .vline', 4], ['.slats', 10], ['.dim, .cross, .win__meta', 14],
    ['.h1', 22], ['.intro', 8], ['.card', 34]
  ].map(function (l) {
    var el = q(l[0]);
    return { x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3' }),
             y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3' }), d: l[1] };
  });
  function pointer(nx, ny) { layers.forEach(function (l) { l.x(-nx * l.d); l.y(-ny * l.d); }); }
  if (!reduce && !REC) {
    window.addEventListener('pointermove', function (e) {
      var nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      layers.forEach(function (l) { l.x(-nx * l.d); l.y(-ny * l.d); });
    });
  }

  /* ---------- 3. Скролл: колонны смыкаются → окно раскрывается → переход ---------- */
  var scroll = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=220%', scrub: REC ? true : 1, pin: true }
  });
  scroll
    // текст расходится в глубину с разной скоростью
    .to('.line--1', { xPercent: -14, autoAlpha: 0, duration: 0.35 }, 0)
    .to('.line--2', { xPercent: 10, autoAlpha: 0, duration: 0.35 }, 0.03)
    .to('.intro', { yPercent: -60, autoAlpha: 0, duration: 0.25 }, 0)
    .to('.lead', { yPercent: -40, autoAlpha: 0, duration: 0.25 }, 0.02)
    .to('.card', { yPercent: -180, autoAlpha: 0, duration: 0.3 }, 0)
    .to('.foot', { autoAlpha: 0, duration: 0.15 }, 0.05)
    .to('.grid, .grid-rows, .vline', { autoAlpha: 0, duration: 0.3 }, 0.05)
    .to('.win__meta, .dim, .cross, .slat__id, .win__ph-label', { autoAlpha: 0, duration: 0.15 }, 0.05)
    // колонны выравниваются и смыкаются в единую плоскость
    .to('.slats', { '--k': 0, duration: 0.35, ease: 'power2.inOut' }, 0.05)
    .to('.slats', { '--gap': '0rem', duration: 0.2, ease: 'power2.inOut' }, 0.25)
    .set('.win__full', { autoAlpha: 1 }, 0.45)
    .set('.slats', { autoAlpha: 0 }, 0.45)
    // окно раскрывается на весь экран
    .to('.win', { top: 0, left: 0, right: 0, bottom: 0, duration: 0.35, ease: 'power2.inOut' }, 0.45)
    .fromTo('.ph--full', { scale: 1 }, { scale: 1.12, duration: 0.55 }, 0.45)
    .to('.hdr', { color: '#F2F1EC', duration: 0.2 }, 0.55)
    // подпись проекта → следующий блок
    .fromTo('.win__caption', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.15, ease: 'power2.out' }, 0.8)
    .to({}, { duration: 0.05 });

  // Следующий блок въезжает поверх
  gsap.from('.next__head > *, .proj', {
    y: 80, autoAlpha: 0, stagger: 0.08, duration: 1.2, ease: E,
    scrollTrigger: { trigger: '.next', start: 'top 85%' }
  });

  /* ---------- Старт ---------- */
  function play() { window.scrollTo(0, 0); intro.restart(); }
  if (REC) {
    gsap.globalTimeline.pause();
    window.__rec = { t: 0, ready: false, pointer: pointer,
      step: function (dt) { this.t += dt; gsap.globalTimeline.time(this.t); ScrollTrigger.update(); } };
  }
  document.fonts.ready.then(function () {
    intro.play(); ScrollTrigger.refresh();
    if (REC) window.__rec.ready = true;
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'r' || e.key === 'R') play();
  });
})();
