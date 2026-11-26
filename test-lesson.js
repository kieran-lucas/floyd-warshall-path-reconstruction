'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('./matrix-engine.js');
const { buildFrames, traceFrames } = require('./lesson.js');
const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8');
const html = read('index.html');
const javaN = read('FloydWarshallNextHop.java');
const javaM = read('FloydWarshallIntermediate.java');
for (const [key, source, name, method] of [
  ['n', javaN, 'FloydWarshallNextHop', 'next-hop'],
  ['m', javaM, 'FloydWarshallIntermediate', 'intermediate']
]) {
  const listing = html.match(new RegExp('<code id="java-' + key + '-source">([\\s\\S]*?)<\\/code>'));
  assert.ok(listing, name + ' must appear in the article.');
  const escaped = source.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  assert.equal(listing[1], escaped);
  assert.ok(source.includes('public final class ' + name));
  assert.ok(html.includes('href="' + name + '.java"'));
  const start = html.indexOf('<div id="' + method + '">');
  const end = html.indexOf(key === 'n' ? '<div id="intermediate">' : '<section id="comparison">');
  assert.ok(start >= 0 && listing.index > start && listing.index < end, 'Complete code belongs to its method.');
}
assert.doesNotMatch(javaN, /\\bmid\\b|midPath|appendSegment/);
assert.doesNotMatch(javaM, /\\bnext\\b|nextPath/);
assert.doesNotMatch(html, /<section id="code">|FloydWarshallPaths\\.java|id="java-source"/);
assert.doesNotMatch(html, /<details\b|role="tab(?:list|panel)?"/i);
assert.doesNotMatch(html, /(?:href|src)\s*=\s*["'](?:https?:)?\/\//i);
const diagrams = [...html.matchAll(/<svg class="route-graph"[\s\S]*?<\/svg>/g)].map(x => x[0]);
assert.equal(diagrams.length, 3);
const input = diagram => [...diagram.matchAll(/data-edge="(\d+),(\d+)"><path[^>]*\/><text[^>]*>(\d+)<\/text>/g)]
  .map(m => m.slice(1).map(Number)).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
const edges = input(diagrams[0]);
for (const drawing of diagrams.slice(1)) {
  assert.deepEqual(input(drawing), edges);
  assert.equal((drawing.match(/role="button" tabindex="0"/g) || []).length, 4);
}
for (const java of [javaN, javaM]) {
  const javaEdges = [...java.matchAll(/\{(\d+), (\d+), (\d+)\}/g)].map(([,u,v,w]) => [+u - 1, +v - 1, +w]);
  assert.deepEqual(edges, javaEdges);
}
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(ids).size, ids.length);
const m = engine.build(4, edges);
const textValue = (v, key) => key === 'D' ? engine.fmt(v) : v < 0 ? '−1' : String(v + 1);
const tables = [...html.matchAll(/<table class="matrix" data-matrix="([DMN])">([\s\S]*?)<\/table>/g)];
assert.equal(tables.length, 5);
for (const [, key, markup] of tables) {
  const cells = [...markup.matchAll(/<td data-cell="(\d+),(\d+)"[^>]*>([^<]+)<\/td>/g)];
  assert.equal(cells.length, 16);
  for (const [,i,j,value] of cells) assert.equal(value,textValue(m.frames[0].state[key][i][j],key));
}
for (const key of ['N', 'M']) {
  const full = buildFrames(m, key, false);
  const filtered = buildFrames(m, key, true);
  assert.equal(full.length, 66); // Initialization, 64 comparisons and completion.
  const firstWrite = filtered[1];
  assert.equal(firstWrite.state.D[0][2], 7);
  assert.deepEqual(firstWrite.writes, [['D', 0, 2], [key, 0, 2]]);
  assert.deepEqual(firstWrite.route, [0, 1, 2]);
  assert.ok(filtered.slice(1, -1).every(frame => frame.writes.length === 2));
  for (let s = 0; s < m.n; s++) for (let t = 0; t < m.n; t++) {
    const trace = traceFrames(m, key, s, t), last = trace.at(-1);
    assert.ok(trace.every(f => f.state === m.final));
    assert.deepEqual(last.route, engine.path(m, s, t, key).paths[0] || []);
    for (const frame of trace) for (let j = 1; j < frame.route.length; j++)
      assert.ok(Number.isFinite(m.W[frame.route[j-1]][frame.route[j]]));
    if (s === t) assert.match(last.detail, /Tổng trọng số 0/);
    if (m.final.D[s][t] === Infinity) assert.match(last.detail, /Không có đường đi/);
  }
  const main = traceFrames(m, key, 0, 3);
  assert.match(main.at(-1).detail, /4 \+ 3 \+ 2 = 9/);
  if (key === 'N') assert.deepEqual(main.slice(1,-1).map(f => f.reads[0]), [['N',0,3],['N',1,3],['N',2,3]]);
  else assert.deepEqual(main.filter(f => f.entry).map(f => f.entry.depth), [0,1,2,3,2,3,1,2]);
}
console.log('PASS inline diagrams, Java input, 64 build comparisons, all 32 traces, matrix reads and recursive call order.');
