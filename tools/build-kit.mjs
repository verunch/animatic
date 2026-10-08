// UI kit: tokens/tokens.json + компоненты → ui-kit.html (без JS).
// node tools/build-kit.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const T = JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8'));
const P = T.primitives;

const leaves = (obj, path = []) => Object.entries(obj)
  .filter(([k]) => !k.startsWith('$'))
  .flatMap(([k, v]) => (v && typeof v === 'object' && '$value' in v ? [[[...path, k], v]] : leaves(v, [...path, k])));
const refName = (v) => (typeof v === 'string' && v.startsWith('{') ? v.slice(12, -1).replace(/\./g, '/') : v);
const L = (t, cls = 't-label') => `<span class="${cls}">${t}</span>`;

/* ---------- Цвета ---------- */
const primitives = Object.entries(P.color).map(([group, shades]) => `
  <p class="kit-sub t-label">${group}</p>
  <div class="sw-group">${leaves(shades).map(([[shade], t]) => `
    <div class="sw">
      <div class="sw__chip" style="background:${t.$value}"></div>
      <p class="sw__name">color/${group}/${shade}</p>
      <div class="sw__meta t-label-s"><span>${t.$value}</span><span>--color-${group}-${shade}</span><span>${t.$description || ''}</span></div>
    </div>`).join('')}
  </div>`).join('');

const semRows = leaves(T.semantic.dark).map(([[k]]) => {
  const cell = (mode) => {
    const t = T.semantic[mode][k];
    return `<td><div class="sem__cell" data-theme="${mode}"><span class="sem__chip" style="background:var(--${k})"></span>
      <span class="t-label-s">${refName(t.$value)}${t.$description ? '<br>' + t.$description : ''}</span></div></td>`;
  };
  return `<tr><td><span class="sem__name">--${k}</span></td>${cell('dark')}${cell('light')}</tr>`;
}).join('');

/* ---------- Типографика ---------- */
const SAMPLES = {
  display: 'Renovation.', h2: 'Complex spaces', 'title-l': 'From structure', 'title-s': 'Villa Lumière',
  logo: 'mono', 'body-l': 'Apartments and villas. Complex transformations.', body: 'Analysis, design, engineering, construction and handover — one studio, one point of contact.',
  ui: 'Projects  Services  Process  Studio  Journal', button: 'Schedule a Consultation', label: '[ 01 ] Turnkey interior renovation', 'label-s': '6 700 · +3.200 · Section A–A',
};
const type = leaves(T.typography).map(([[k], t]) => {
  const v = t.$value;
  return `<div class="ty">
    <div class="ty__meta t-label-s">
      <b class="t-label">type/${k}</b><span>${t.$description}</span>
      <span>${refName(v.fontFamily).split('/').pop() === 'sans' ? 'Inter Tight' : 'JetBrains Mono'} · ${v.fontWeight}</span>
      <span>${v.fontSize} / ${v.lineHeight} · ${v.letterSpacing}${v.textCase ? ' · UPPERCASE' : ''}</span>
      <span>.t-${k}</span>
    </div>
    <div class="ty__sample t-${k}">${SAMPLES[k]}</div>
  </div>`;
}).join('');

/* ---------- Сетка, отступы, движение ---------- */
const lay = P.layout;
const specs = [['Frame', `${lay['frame-width'].$value} × ${lay['frame-height'].$value}`], ['Columns × Rows', `${lay.columns.$value} × ${lay.rows.$value}`],
  ['Margin', lay.margin.$value], ['Gutter', lay.gutter.$value], ['Column', lay.column.$value], ['Row', lay.row.$value],
  ['Aside / Content', `${lay.aside.$value} / ${lay.content.$value}`], ['Header / Footer', `${lay.header.$value} / ${lay.footer.$value}`]]
  .map(([k, v]) => `<div class="kit-spec"><span class="t-label-s">${k}</span><b>${v}</b></div>`).join('');
const space = leaves(P.space).map(([[k], t]) => `<div class="sp"><div class="sp__meta t-label-s"><span>space/${k}</span><span>${t.$value}</span></div><div><div class="sp__bar" style="width:${parseFloat(t.$value) / 10}rem"></div></div></div>`).join('');
const radii = [...leaves(P.radius).map(([[k], t]) => [`radius/${k}`, t.$value]), ...leaves(P.stroke).map(([[k], t]) => [`stroke/${k}`, t.$value]), ...leaves(P.size).map(([[k], t]) => [`size/${k}`, t.$value])]
  .map(([k, v]) => `<div class="kit-spec"><span class="t-label-s">${k}</span><b>${v}</b></div>`).join('');
const curve = ([a, b, c, d]) => `<svg viewBox="-4 -4 108 108"><path class="axis" d="M0 0V100H100"/><path class="curve" d="M0 100C${a * 100} ${100 - b * 100} ${c * 100} ${100 - d * 100} 100 0"/></svg>`;
const motion = [
  ...leaves(P.motion.ease).map(([[k], t]) => `<div class="mo__card">${curve(t.$value)}<span class="t-label">motion/ease/${k}</span><span class="t-label-s muted">cubic-bezier(${t.$value.join(', ')}) ${t.$description || ''}</span></div>`),
  `<div class="mo__card">${leaves(P.motion.duration).map(([[k], t]) => `<div class="sp__meta t-label-s"><span>motion/duration/${k}</span><span>${t.$value}</span></div>`).join('')}</div>`,
].join('');

/* ---------- Компоненты ---------- */
const both = (inner) => ['dark', 'light'].map((m) => `<div class="panel" data-theme="${m}"><span class="panel__theme t-label-s">${m}</span>${inner}</div>`).join('');
const variant = (label, html) => `<div class="var"><span class="var__label t-label-s">${label}</span>${html}</div>`;
const cmp = (name, desc, inner) => `<div class="cmp"><div class="cmp__info"><p class="t-label">${name}</p><p class="t-body">${desc}</p></div><div class="cmp__themes">${both(inner)}</div></div>`;

const slats = [[0, 1], [1, 0], [2, 2], [3, 1], [4, 0]]
  .map(([i, o]) => `<div class="slat" style="--i:${i};--off:${o * 5}rem"><div class="ph"></div><span class="slat__id t-label-s">A${i + 1}</span></div>`).join('');
const stepsHtml = `<ol class="steps t-label"><li class="step is-done"><b>01</b> Analysis</li><li class="step is-done"><b>02</b> Design</li><li class="step is-done"><b>03</b> Engineering</li><li class="step is-active"><b>04</b> Build</li><li class="step"><b>05</b> Handover</li></ol>`;
const card = `<aside class="card">
  <div class="card__row t-label"><span class="live"></span>Now on site</div>
  <p class="t-title-s">Villa Lumière</p>
  <div class="card__row card__row--between t-label"><span>Stage 04 / 05 — Build</span><span>68%</span></div>
  <div class="bar"><span class="bar__fill"></span></div>
  <div class="card__row card__row--between t-label card__muted"><span>Engineering · MEP</span><span>Handover Q3</span></div>
</aside>`;
const header = `<div class="bleed-stage"><header class="hdr">
  <a class="logo" href="#">mono<span class="logo__sub t-label">design</span></a>
  <nav class="nav t-ui"><a class="nav-link is-active" href="#">Projects</a><a class="nav-link" href="#">Services</a><a class="nav-link" href="#">Process</a><a class="nav-link" href="#">Studio</a><a class="nav-link" href="#">Journal</a></nav>
  <div class="hdr__right t-ui"><span class="theme-btn t-label"><span class="theme-btn__dot"></span>Theme</span><a class="link-cta" href="#">Let’s talk <span class="arr">↗</span></a></div>
  <span class="hline hdr__line"></span></header></div>`;
const footer = `<div class="bleed-stage"><footer class="foot">
  <span class="hline foot__line"></span>
  <div class="foot__scroll t-label"><span class="foot__tick"></span>Scroll</div>
  <ol class="steps t-label"><li class="step"><b>01</b> Analysis</li><li class="step"><b>02</b> Design</li><li class="step"><b>03</b> Engineering</li><li class="step is-active"><b>04</b> Build</li><li class="step"><b>05</b> Handover</li></ol>
  <div class="foot__ratio t-label">70 / 30 — aesthetics × function</div></footer></div>`;
const bleed = (name, inner) => `<p class="kit-sub t-label">${name}</p>${['dark', 'light'].map((m) => `<div class="bleed"><div class="panel" data-theme="${m}"><span class="panel__theme t-label-s">${m}</span>${inner}</div></div>`).join('')}`;

const components = [
  cmp('Logo', 'Wordmark «mono» + подпись DESIGN. type/logo + type/label.',
    `<a class="logo" href="#">mono<span class="logo__sub t-label">design</span></a>`),
  cmp('Nav link', 'Пункт навигации. Hover — линия выезжает слева направо, Active — акцент + линия.',
    `<div class="row t-ui">${variant('Default', '<a class="nav-link" href="#">Projects</a>')}${variant('Hover', '<a class="nav-link is-hover" href="#">Projects</a>')}${variant('Active', '<a class="nav-link is-active" href="#">Projects</a>')}</div>`),
  cmp('Link CTA', 'Текстовое действие в шапке. Hover — акцент, стрелка уходит по диагонали.',
    `<div class="row t-ui">${variant('Default', '<a class="link-cta" href="#">Let’s talk <span class="arr">↗</span></a>')}${variant('Hover', '<a class="link-cta is-hover" href="#">Let’s talk <span class="arr">↗</span></a>')}</div>`),
  cmp('Button / Primary', 'Главное действие. Высота 64, pill, отступ 24. Hover — инверсия, стрелка смещается.',
    `<div class="row">${variant('Default', '<a class="btn btn--primary" href="#">Schedule a Consultation <span class="arr">→</span></a>')}${variant('Hover', '<a class="btn btn--primary is-hover" href="#">Schedule a Consultation <span class="arr">→</span></a>')}${variant('Disabled', '<a class="btn btn--primary is-disabled" href="#">Schedule a Consultation <span class="arr">→</span></a>')}</div>`),
  cmp('Button / Secondary', 'Второстепенное действие, контур + счётчик. Hover — заливка цветом текста.',
    `<div class="row">${variant('Default', '<a class="btn btn--secondary" href="#">View Projects <span class="btn__count t-label-s">24</span></a>')}${variant('Hover', '<a class="btn btn--secondary is-hover" href="#">View Projects <span class="btn__count t-label-s">24</span></a>')}${variant('Disabled', '<a class="btn btn--secondary is-disabled" href="#">View Projects <span class="btn__count t-label-s">24</span></a>')}</div>`),
  cmp('Theme toggle', 'Переключатель темы в шапке.',
    `<span class="theme-btn t-label"><span class="theme-btn__dot"></span>Dark</span>`),
  cmp('Section tag / Label', 'Чертёжные подписи: тег секции (акцент), метаданные, пометки.',
    `<div class="var">${variant('Tag', '<span class="tag t-label">[ 01 ] Turnkey interior renovation</span>')}${variant('Meta', '<span class="t-label muted">Fig. 024 — Villa Lumière</span>')}${variant('Note (label-s)', '<span class="t-label-s muted">[ Living area — after ]</span>')}</div>`),
  cmp('Progress bar + Live dot', 'Прогресс этапа объекта (--progress). Live dot — статус «на объекте».',
    `<div class="var">${variant('0%', '<div class="bar" style="--progress:0%"><span class="bar__fill"></span></div>')}${variant('68%', '<div class="bar" style="--progress:68%"><span class="bar__fill"></span></div>')}${variant('100%', '<div class="bar" style="--progress:100%"><span class="bar__fill"></span></div>')}${variant('Live dot', '<span class="live"></span>')}</div>`),
  cmp('Status card', '«Now on site»: объект, этап, прогресс, срок. Поверхность surface, обводка surface-line.', card),
  cmp('Step / Steps', 'Этапы процесса. Состояния: Default, Done, Active.',
    `<div class="row t-label">${variant('Default', '<span class="step"><b>05</b> Handover</span>')}${variant('Done', '<span class="step is-done"><b>01</b> Analysis</span>')}${variant('Active', '<span class="step is-active"><b>04</b> Build</span>')}</div>${variant('Steps', stepsHtml)}`),
  cmp('Dimension line / Cross marker', 'Чертёжный слой: размерная линия (H, V) с засечками и маркер-перекрестие 20. Маркеры ставятся на пересечения линий сетки.',
    `<div class="row" style="gap:var(--space-56)">${variant('Dimension / H', '<div style="position:relative;width:24rem;height:2rem"><div class="dim dim--h" style="left:0;right:0;top:1rem"><span class="t-label-s">6 700</span></div></div>')}${variant('Dimension / V', '<div style="position:relative;width:3rem;height:12rem"><div class="dim dim--v" style="top:0;bottom:0;left:0"><span class="t-label-s">+3.200</span></div></div>')}${variant('Cross', '<div style="position:relative;width:1.6rem;height:1.6rem"><span class="cross" style="left:0;top:0"></span></div>')}</div>`),
  cmp('Column window (Т-паттерн)', '5 колонн = 5 колонок сетки контентной зоны, зазор = гаттер 8. Уступы верхов кратны ряду (--off). --k: 1 — уступы, 0 — сомкнуты.',
    `<div class="mini-win"><div class="dim dim--h"><span class="t-label-s">6 700</span></div><span class="cross cross--tl"></span><div class="slats">${slats}</div></div>`),
  cmp('Project card', 'Карточка проекта следующего блока. Ширина — 2 колонки сетки (широкая — 3), фото 5:6.',
    `<div class="row" style="align-items:flex-end;flex-wrap:nowrap">${variant('Project', '<article class="proj" style="width:12rem"><div class="ph proj__ph"></div><p class="t-label-s">Villa Lumière</p></article>')}${variant('Project', '<article class="proj" style="width:12rem"><div class="ph proj__ph proj__ph--b"></div><p class="t-label-s">Ostozhenka</p></article>')}${variant('Project', '<article class="proj" style="width:12rem"><div class="ph proj__ph proj__ph--c"></div><p class="t-label-s">Arbat</p></article>')}</div>`),
  cmp('Photo caption', 'Подпись проекта поверх фото (on-photo), с затемнением.',
    `<div class="cap-demo"><div class="ph ph--full"></div><div class="win__scrim"></div><div class="caption"><p class="t-label">Villa Lumière · 420 m² · 14 months</p><p class="caption__title t-title-l">From structure<br>to atmosphere.</p></div></div>`),
].join('');

const html = `<!doctype html>
<html lang="ru" data-theme="light" data-page="kit">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=1920">
  <title>Mono design — UI Kit</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/tokens.css">
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="css/ui-kit.css">
</head>
<body>
<!-- СГЕНЕРИРОВАНО: node tools/build-kit.mjs (источник — tokens/tokens.json) -->
<main class="kit">
  <section class="kit-cover">
    <div><p class="tag t-label">[ UI kit ]</p><h1 class="t-h2" style="margin-top:var(--space-16)">Mono design</h1></div>
    <div class="kit-cover__meta t-label"><span>Hero Section · v1.0</span><span>Tokens: primitives → semantic (dark / light) → components</span><span>Frame 1920 × 1080 · grid 7 × 6 · 1rem = 10px</span></div>
  </section>

  <section class="kit-sec">
    <div class="kit-sec__head"><p class="t-label">01 · Color / Primitives</p><p class="t-body">Палитра бренда из брифа + три производных тона (помечены). Примитивы не используются в компонентах напрямую — только через семантические токены.</p></div>
    ${primitives}
  </section>

  <section class="kit-sec">
    <div class="kit-sec__head"><p class="t-label">02 · Color / Semantic</p><p class="t-body">Коллекция с двумя режимами — dark и light. Компоненты ссылаются только на эти переменные, поэтому тема меняется одной сменой режима.</p></div>
    <table class="sem"><thead><tr><th class="t-label-s">Token</th><th class="t-label-s">Dark</th><th class="t-label-s">Light</th></tr></thead><tbody>${semRows}</tbody></table>
  </section>

  <section class="kit-sec">
    <div class="kit-sec__head"><p class="t-label">03 · Typography</p><p class="t-body">Два шрифта — два языка: Inter Tight для эмоции и смысла, JetBrains Mono для инженерного слоя. 11 текстовых стилей.</p></div>
    ${type}
  </section>

  <section class="kit-sec">
    <div class="kit-sec__head"><p class="t-label">04 · Grid &amp; Layout</p><p class="t-body">Модульная сетка клиента: кадр 1920 × 1080, 7 колонок × 6 рядов, поля 60, гаттер 8. Асайд 577 (поле + 2 колонки) + контентная зона 1343 (5 колонок + поле). В Figma: Layout grid → Columns 7 / Stretch / Margin 60 / Gutter 8 и Rows 6 / Stretch / Margin 60 / Gutter 8.</p></div>
    <div class="kit-frame-wrap">
      <div class="kit-frame">
        <div class="kit-frame__cols">${'<i></i>'.repeat(7)}</div>
        <div class="kit-frame__rows">${'<i></i>'.repeat(6)}</div>
        <span class="kit-frame__aside"></span>
        <span class="kit-frame__tag kit-frame__tag--a t-label-s">Aside 577</span>
        <span class="kit-frame__tag kit-frame__tag--c t-label-s">Content 1343</span>
      </div>
      <div class="kit-specs">${specs}</div>
    </div>
    <p class="kit-sub t-label">Колонки в реальном размере</p>
    <div class="kit-grid">${Array.from({ length: 7 }, (_, i) => `<span class="t-label-s">${i + 1}</span>`).join('')}</div>
  </section>

  <section class="kit-sec">
    <div class="kit-sec__head"><p class="t-label">05 · Spacing · Radius · Stroke · Size</p><p class="t-body">Шкала отступов на базе 4/8. Скругления: 0 для плоскостей (архитектурная строгость), pill только для кнопок.</p></div>
    ${space}
    <div class="kit-specs" style="margin-top:var(--space-40)">${radii}</div>
  </section>

  <section class="kit-sec">
    <div class="kit-sec__head"><p class="t-label">06 · Motion</p><p class="t-body">Кривые и длительности анимации прототипа.</p></div>
    <div class="mo">${motion}</div>
  </section>

  <section class="kit-sec">
    <div class="kit-sec__head"><p class="t-label">07 · Components</p><p class="t-body">Каждый компонент — в обеих темах, со всеми вариантами и состояниями. Состояния (hover, active, disabled) показаны статично.</p></div>
    ${bleed('Header', header)}
    ${bleed('Footer / Process bar', footer)}
    ${components}
  </section>
</main>
</body>
</html>
`;
writeFileSync(join(root, 'ui-kit.html'), html);
console.log('ui-kit.html built');
