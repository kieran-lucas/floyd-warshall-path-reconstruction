'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('./matrix-engine.js');

const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');
const pages = ['index.html', 'khoang-cach.html', 'buoc-ke-tiep.html', 'cac-cach-truy-vet.html', 'cai-dat.html'];
const html = pages.map(read);
const unescape = s => s.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"')
  .replaceAll('&#x27;', "'").replaceAll('&amp;', '&');

for (const [i, page] of html.entries()) {
  assert.ok(page.includes('Trang ' + (i + 1) + ' / 5'));
  assert.ok(page.includes('href="' + pages[i] + '" aria-current="page"'));
  for (const [, target] of page.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (target.startsWith('https:')) continue;
    const [name, anchor] = target.split('#');
    const file = name.split('?')[0] || pages[i];
    if (file === './') continue;
    assert.ok(fs.existsSync(path.join(__dirname, file)), 'Missing local file ' + file);
    if (anchor) assert.ok(read(file).includes('id="' + anchor + '"'), 'Missing anchor ' + target);
  }
}
const edges = [...html[2].matchAll(/data-edge="(\d+),(\d+)">.*?<text[^>]*>(\d+)<\/text>/g)]
  .map(match => match.slice(1).map(Number));
assert.equal(edges.length, 6);
const model = engine.build(4, edges);
const tables = html.slice(1, 4).flatMap(page =>
  [...page.matchAll(/<figure class="sheet-matrix">.*?<tbody>(.*?)<\/tbody>/gs)].map(match =>
    [...match[1].matchAll(/<tr>(.*?)<\/tr>/gs)].map(row =>
      [...row[1].matchAll(/<td[^>]*>([^<]+)<\/td>/g)].map(cell => cell[1]))));
const expected = [
  ['D', model.frames[0].state.D], ['D', model.frames[32].state.D], ['D', model.final.D],
  ['N', model.final.N], ['P', model.final.P], ['M', model.final.M]
].map(([kind, array]) => array.map(row => row.map(kind === 'D' ? engine.fmt : engine.vertex)));
assert.deepEqual(tables, expected);

const examples = html[4].split('class="reading source"')[1];
const displayed = [...examples.matchAll(/<pre><code>(.*?)<\/code><\/pre>/gs)]
  .map(match => unescape(match[1])).join('\n\n') + '\n';
assert.equal(displayed, read('FloydWarshallPaths.java'));
console.log('PASS five-page navigation, six printed matrices and complete Java listing.');
