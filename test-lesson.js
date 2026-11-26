'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('./matrix-engine.js');
const { buildFrames, traceFrames, mount } = require('./lesson.js');
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
assert.doesNotMatch(javaN, /\bmid\b|midPath|appendSegment/);
assert.doesNotMatch(javaM, /\bnext\b|nextPath/);
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
  assert.equal((drawing.match(/role="button" tabindex="0"/g) || []).length, 6);
}
for (const java of [javaN, javaM]) {
  const javaEdges = [...java.matchAll(/\{(\d+), (\d+), (\d+)\}/g)].map(([,u,v,w]) => [+u - 1, +v - 1, +w]);
  assert.deepEqual(edges, javaEdges);
}
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(ids).size, ids.length);
const m = engine.build(6, edges);
const textValue = (v, key) => key === 'D' ? engine.fmt(v) : v < 0 ? '−1' : String(v + 1);
const tables = [...html.matchAll(/<table class="matrix" data-matrix="([DMN])">([\s\S]*?)<\/table>/g)];
assert.equal(tables.length, 5);
for (const [, key, markup] of tables) {
  const cells = [...markup.matchAll(/<td data-cell="(\d+),(\d+)"[^>]*>([^<]+)<\/td>/g)];
  assert.equal(cells.length, 36);
  for (const [,i,j,value] of cells) assert.equal(value,textValue(m.frames[0].state[key][i][j],key));
}
for (const key of ['N', 'M']) {
  const full = buildFrames(m, key, false);
  const filtered = buildFrames(m, key, true);
  assert.equal(full.length, 218); // Initialization, 216 comparisons and completion.
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
  const extended = traceFrames(m, key, 0, 5);
  assert.match(extended.at(-1).detail, /4 \+ 3 \+ 2 \+ 2 \+ 3 = 14/);
  assert.deepEqual(extended.at(-1).route, [0,1,2,3,4,5]);
  const main = traceFrames(m, key, 0, 3);
  assert.match(main.at(-1).detail, /4 \+ 3 \+ 2 = 9/);
  if (key === 'N') assert.deepEqual(main.slice(1,-1).map(f => f.reads[0]), [['N',0,3],['N',1,3],['N',2,3]]);
  else assert.deepEqual(main.filter(f => f.entry).map(f => f.entry.depth), [0,1,2,3,2,3,1,2]);
}

// Exercise the shipped controller with a minimal DOM and deterministic timers.
function element(data = {}) {
  const el = { dataset: data, textContent: '', value: '', checked: false, disabled: false,
    hidden: false, className: '', style: {}, children: [], attrs: {}, listeners: {},
    classList: { toggle(name, on) { const s = new Set(el.className.split(/\s+/).filter(Boolean)); if (on) s.add(name); else s.delete(name); el.className = [...s].join(' '); } },
    setAttribute(name, value) { this.attrs[name] = String(value); },
    addEventListener(name, fn) { this.listeners[name] = fn; },
    emit(name, extra = {}) { this.listeners[name]?.({ target: this, preventDefault() {}, ...extra }); },
    replaceChildren() { this.children = []; }, append(child) { this.children.push(child); }
  }; return el;
}
function mockRoot(key) {
  const roles = Object.fromEntries(['phase','filter','speed','range','filter-label','pick','route','statement','detail','count','calls-box','calls'].map(name => [name, element()]));
  roles.phase.value = 'build'; roles.filter.checked = true; roles.speed.value = '1100';
  const actions = Object.fromEntries(['play','prev','next','reset'].map(name => [name, element()]));
  const nodes = Array.from({length:m.n}, (_,i)=>element({node:String(i)}));
  const lines = edges.map(([i,j])=>element({edge:i+','+j}));
  const mats = ['D',key].map(matrix => {
    const cells = Array.from({length:m.n*m.n},(_,p)=>element({cell:Math.floor(p/m.n)+','+(p%m.n)}));
    return {dataset:{matrix},querySelectorAll(){return cells;},cells};
  });
  const root = {dataset:{method:key}, querySelector(q) {const a=q.match(/\[data-(role|action)="([^"]+)"\]/); return (a[1]==='role'?roles:actions)[a[2]];},
    querySelectorAll(q){return q==='[data-matrix]'?mats:q==='[data-node]'?nodes:lines;}};
  return {root,roles,actions,nodes,lines,mats};
}
const saved = { document: globalThis.document, setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval };
const timers = new Map(); let timerId = 0;
globalThis.document = { createElement:()=>element(), addEventListener(){}, hidden:false };
globalThis.setInterval = fn => {timers.set(++timerId,fn);return timerId;};
globalThis.clearInterval = id => timers.delete(id);
try {
  for (const key of ['N','M']) {
    const {root,roles,actions,nodes,lines,mats} = mockRoot(key);
    mount(root,m);
    assert.equal(mats[0].cells[5].textContent,'∞');
    assert.equal(actions.prev.disabled,true);
    actions.next.emit('click'); assert.equal(mats[0].cells[2].textContent,'7');
    roles.filter.checked=false;roles.filter.emit('change');
    assert.equal(roles.range.max,'218');
    roles.range.value='218';roles.range.emit('input');
    assert.equal(mats[0].cells[5].textContent,'14');
    assert.equal(actions.next.disabled,true);
    actions.play.emit('click');assert.equal(actions.play.textContent,'Tạm dừng');
    assert.equal(roles.range.value,'1'); [...timers.values()].forEach(fn=>fn());
    assert.equal(roles.range.value,'2');actions.play.emit('click');assert.equal(timers.size,0);
    nodes[0].emit('click');assert.equal(roles.phase.value,'trace');assert.match(roles.pick.textContent,/Nguồn: 1/);
    assert.equal(nodes[0].attrs['aria-pressed'],'true');
    nodes[5].emit('keydown',{key:'Enter'});
    assert.match(roles.pick.textContent,/Nguồn: 1 · Đích: 6/);
    assert.equal(nodes[5].attrs['aria-pressed'],'true');
    actions.play.emit('click');assert.equal(timers.size,0);
    roles.range.value=roles.range.max;roles.range.emit('input');
    assert.match(roles.statement.textContent,/1 → 2 → 3 → 4 → 5 → 6/);
    assert.match(roles.detail.textContent,/14/);
    assert.equal(lines.filter(e=>e.className.split(' ').includes('active')).length,5);
    actions.prev.emit('click');assert.equal(actions.next.disabled,false);
    nodes[5].emit('click');nodes[0].emit('click');assert.match(roles.detail.textContent,/Không có đường đi/);
    nodes[2].emit('click');nodes[2].emit('click');assert.match(roles.detail.textContent,/Tổng trọng số 0/);
    actions.reset.emit('click');assert.equal(roles.range.disabled,true);assert.match(roles.pick.textContent,/Chọn đỉnh nguồn/);
    roles.phase.value='build';roles.phase.emit('change');assert.equal(roles.range.value,'1');
    assert.equal(timers.size,0);
  }
} finally {
  for (const [name,value] of Object.entries(saved)) { if (value === undefined) delete globalThis[name]; else globalThis[name]=value; }
}
console.log('PASS 5 initial matrices, 216 build comparisons, all 72 traces, Java listings and interactive controls.');
