// tokens/tokens.json → css/tokens.css: node tools/build-tokens.mjs
// Размеры px переводятся в rem (1rem = 10px при 1920), обводки остаются в px.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const T = JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8'));
const P = T.primitives;

const FALLBACK = {
  sans: '"Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, Menlo, monospace',
};
const rem = (v) => (typeof v === 'string' && v.endsWith('px') ? +(parseFloat(v) / 10).toFixed(4) + 'rem' : v);
const leaves = (obj, path = []) => Object.entries(obj)
  .filter(([k]) => !k.startsWith('$'))
  .flatMap(([k, v]) => (v && typeof v === 'object' && '$value' in v ? [[[...path, k], v]] : leaves(v, [...path, k])));
// {primitives.color.black.900} → var(--color-black-900)
const ref = (v) => typeof v === 'string'
  ? v.replace(/\{primitives\.([^}]+)\}/g, (_, p) => `var(--${p.replace(/\./g, '-')})`)
  : v;

const out = [];
const line = (name, value, note) => out.push(`  --${name}: ${value};${note ? ' /* ' + note + ' */' : ''}`);

out.push('/* =========================================================');
out.push('   СГЕНЕРИРОВАНО из tokens/tokens.json — не править вручную.');
out.push('   node tools/build-tokens.mjs');
out.push('   ========================================================= */', '', ':root {');

out.push('  /* --- Примитивы: цвет --- */');
for (const [p, t] of leaves(P.color)) line(`color-${p.join('-')}`, t.$value, t.$description);
out.push('', '  /* --- Шрифты --- */');
for (const [[k], t] of leaves(P.font.family)) line(`font-family-${k}`, `"${t.$value}", ${FALLBACK[k]}`);
for (const [[k], t] of leaves(P.font.weight)) line(`font-weight-${k}`, t.$value);
out.push('', '  /* --- Отступы --- */');
for (const [[k], t] of leaves(P.space)) line(`space-${k}`, rem(t.$value));
out.push('', '  /* --- Скругления, обводки --- */');
for (const [[k], t] of leaves(P.radius)) line(`radius-${k}`, rem(t.$value));
for (const [[k], t] of leaves(P.stroke)) line(`stroke-${k}`, t.$value);
out.push('', '  /* --- Сетка и каркас --- */');
for (const [[k], t] of leaves(P.layout)) line(`layout-${k}`, rem(t.$value));
out.push('', '  /* --- Размеры компонентов --- */');
for (const [[k], t] of leaves(P.size)) line(`size-${k}`, rem(t.$value));
out.push('', '  /* --- Движение --- */');
for (const [[k], t] of leaves(P.motion.duration)) line(`motion-duration-${k}`, t.$value);
for (const [[k], t] of leaves(P.motion.ease)) line(`motion-ease-${k}`, `cubic-bezier(${t.$value.join(', ')})`, t.$description);

out.push('', '  /* --- Типографика --- */');
const ty = leaves(T.typography);
for (const [[k], t] of ty) {
  const v = t.$value;
  line(`type-${k}-family`, ref(v.fontFamily));
  line(`type-${k}-weight`, v.fontWeight);
  line(`type-${k}-size`, rem(v.fontSize));
  line(`type-${k}-line`, v.lineHeight);
  line(`type-${k}-tracking`, parseFloat(v.letterSpacing) / 100 + 'em');
}
out.push('}', '');

for (const mode of ['dark', 'light']) {
  out.push(mode === 'dark' ? ':root, [data-theme="dark"] {' : '[data-theme="light"] {');
  for (const [[k], t] of leaves(T.semantic[mode])) line(k, ref(t.$value), t.$description);
  out.push(`  color-scheme: ${mode};`, '}', '');
}

out.push('/* --- Текстовые стили (классы) --- */');
for (const [[k], t] of ty) {
  out.push(`.t-${k} {`,
    `  font-family: var(--type-${k}-family);`,
    `  font-weight: var(--type-${k}-weight);`,
    `  font-size: var(--type-${k}-size);`,
    `  line-height: var(--type-${k}-line);`,
    `  letter-spacing: var(--type-${k}-tracking);`,
    ...(t.$value.textCase ? [`  text-transform: ${t.$value.textCase};`] : []),
    '}');
}

writeFileSync(join(root, 'css/tokens.css'), out.join('\n') + '\n');
console.log(`css/tokens.css: ${out.filter((l) => l.startsWith('  --')).length} variables, ${ty.length} text styles`);
