// Сборка статичных экранов для Figma: node tools/build-static.mjs
// Каждый файл самодостаточный: CSS встроен, JS вырезан, заглушки — data URI.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

// Ключевые кадры анимации: один DOM, разные состояния (css/states.css).
// k04 — основной статичный экран.
const STATES = [
  ['k00-blank', 'k00', 'Вход · пустой кадр'],
  ['k01-grid', 'k01', 'Вход · сетка и линии прорисованы'],
  ['k02-columns', 'k02', 'Вход · колонны поднимаются'],
  ['k03-title', 'k03', 'Вход · заголовок и чертёжные пометки'],
  ['k04-hero', 'k04', 'Hero — основной статичный экран'],
  ['k05-merge', 'k05', 'Скролл · текст уходит, колонны смыкаются'],
  ['k06-photo', 'k06', 'Скролл · колонны сомкнулись в одно фото'],
  ['k07-expand', 'k07', 'Скролл · окно раскрыто на весь кадр'],
  ['k08-next', 'k08', 'Переход · следующий блок'],
];
const THEMES = ['dark', 'light'];

const MIME = { svg: 'image/svg+xml', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const assetData = (name) =>
  `data:${MIME[name.split('.').pop()]};base64,` + readFileSync(join(root, 'assets', name)).toString('base64');

const css = (read('css/tokens.css') + '\n' + read('css/style.css') + '\n' + read('css/states.css'))
  .replace(/url\("\.\.\/assets\/([^"]+)"\)/g, (_, f) => `url("${assetData(f)}")`);

const html = read('index.html')
  .replace(/<script[\s\S]*?<\/script>\s*/g, '')
  .replace('<link rel="stylesheet" href="css/tokens.css">', `<style>\n${css}\n</style>`).replace(/\s*<link rel="stylesheet" href="css\/style.css">/, '')
  .replace(/<button class="theme-btn[^"]*"[\s\S]*?<\/button>\s*/, '');

mkdirSync(join(root, 'static'), { recursive: true });
const links = [];
for (const theme of THEMES) {
  for (const [file, state, label] of STATES) {
    const name = `${theme}-${file}.html`;
    const out = html
      .replace(/<html[^>]*>/, `<html lang="en" data-theme="${theme}" data-mode="static" data-state="${state}">`)
      .replace(/<title>[^<]*<\/title>/, `<title>Mono — ${theme} — ${file}</title>`);
    writeFileSync(join(root, 'static', name), out);
    links.push(`<li><a href="${name}">${name}</a> — ${label}</li>`);
  }
}
// Чистый экран и доска со всеми элементами
const BOARD = [
  ['k04', '01', 'Hero — основной экран', 'шапка, интро, окно из 5 колонн, заголовок, подзаголовок, CTA, карточка объекта, полоса этапов, сетка и чертёжные пометки'],
  ['k07', '02', 'Окно раскрыто', 'цельное фото, затемнение, подпись проекта, светлая шапка'],
  ['k08', '03', 'Следующий блок', 'тег секции, H2, три карточки проектов по колонкам сетки'],
];
const body = html.match(/<body>([\s\S]*)<\/body>/)[1].trim();
for (const theme of THEMES) {
  const head = (state, title) => html.split('<body>')[0]
    .replace(/<html[^>]*>/, `<html lang="en" data-theme="${theme}" data-mode="static" data-state="${state}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  writeFileSync(join(root, 'static', `${theme}-final-static.html`),
    html.replace(/<html[^>]*>/, `<html lang="en" data-theme="${theme}" data-mode="static" data-state="clean">`)
        .replace(/<title>[^<]*<\/title>/, `<title>Mono — Final static — ${theme}</title>`));
  const frames = BOARD.map(([state, n, name, what]) =>
    `<p class="board__title"><b>${n} — ${name}</b>${what}</p>\n<div class="board__frame" data-state="${state}" data-theme="${theme}">\n${body}\n</div>`).join('\n');
  writeFileSync(join(root, 'static', `${theme}-final-static-expanded.html`),
    `${head('board', `Mono — Final static expanded — ${theme}`)}<body>\n<p class="board__title board__title--main"><b>Final static — expanded · ${theme}</b>все экраны и элементы hero</p>\n${frames}\n</body>\n</html>\n`);
  links.unshift(`<li><a href="${theme}-final-static-expanded.html">${theme}-final-static-expanded.html</a> — Final static expanded: все экраны и элементы на одной доске</li>`);
  links.unshift(`<li><a href="${theme}-final-static.html">${theme}-final-static.html</a> — Final static: чистый главный экран</li>`);
}

// UI kit — тот же принцип: CSS встроен, ассеты — data URI
const kitCss = [read('css/tokens.css'), read('css/style.css'), read('css/ui-kit.css')].join('\n')
  .replace(/url\("\.\.\/assets\/([^"]+)"\)/g, (_, f) => `url("${assetData(f)}")`);
writeFileSync(join(root, 'static', 'ui-kit.html'), read('ui-kit.html')
  .replace(/\s*<link rel="stylesheet" href="css\/(?:style|ui-kit)\.css">/g, '')
  .replace('<link rel="stylesheet" href="css/tokens.css">', () => `<style>\n${kitCss}\n</style>`));
links.unshift('<li><a href="ui-kit.html">ui-kit.html</a> — UI kit: токены, переменные, компоненты</li>');

writeFileSync(join(root, 'static', 'index.html'),
  `<!doctype html><meta charset="utf-8"><title>Mono — static screens</title>
<body style="font:16px/1.6 system-ui;padding:40px"><h1>Ключевые кадры 1920×1080</h1><p>Порядок и настройки переходов — FIGMA-ANIMATION.md</p><ul>${links.join('')}</ul></body>\n`);
console.log(`built ${links.length} files → static/`);
