/* The graph labels are the input for both the drawing and the Floyd snapshots. */
(() => {
  'use strict';

  const engine = window.MatrixLabEngine;
  const byId = id => document.getElementById(id);
  const edges = [...document.querySelectorAll('#graph [data-edge]')];
  const nodes = [...document.querySelectorAll('#graph [data-node]')];
  const model = engine.build(nodes.length, edges.map(edge => [
    ...edge.dataset.edge.split(',').map(Number),
    Number(edge.querySelector('text').textContent)
  ]));
  const s = 0, t = nodes.length - 1;
  const name = { D: 'Khoảng cách', N: 'Bước kế tiếp', P: 'Đỉnh liền trước', M: 'Đỉnh trung gian' };
  const fmt = (key, value) => key === 'D' ? engine.fmt(value) : engine.vertex(value);
  const cell = (key, i, j) => key + '[' + engine.vertex(i) + '][' + engine.vertex(j) + ']';
  const stages = [...document.querySelectorAll('[data-stage]')];
  const matrix = byId('matrix');
  const methods = byId('method');
  const distance = model.final.D[s][t];
  let frames = [], position = 0, timer = null;

  function buildFrames(key) {
    const initial = model.frames[0].state;
    const direct = {
      phase: 'build', key, state: initial, at: [s, t], route: [s, t],
      headline: cell(key, s, t) + ' = ' + fmt(key, initial[key][s][t]),
      note: 'Lúc khởi tạo, cạnh trực tiếp 1 → 4 có trọng số ' + initial.D[s][t] + '. ' + {
        N: 'Bước đầu của cạnh này là đi thẳng sang 4.',
        P: 'Trên cạnh này, đỉnh ngay trước 4 là 1.',
        M: 'Đường trực tiếp chưa có đỉnh trung gian. Ta ghi dấu gạch ngang.'
      }[key]
    };
    const changes = [direct];
    for (const frame of model.frames) {
      const ev = frame.event;
      if (!ev || !ev.improved || ev.i !== s || ev.j !== t) continue;
      const { k, left, right, old, candidate } = ev;
      const previous = model.frames[frame.step - 1].state;
      const leftPath = engine.path(model, s, k, 'N', previous).paths[0];
      const rightPath = engine.path(model, k, t, 'N', previous).paths[0];
      const via = engine.vertex(k);
      const source = key === 'N' ? [s, k] : key === 'P' ? [k, t] : null;
      const stored = fmt(key, frame.state[key][s][t]);
      const rule = source ? cell(key, ...source) : via;
      const prefix = key === 'N' ? 'Bước đầu của đoạn 1 → ' + via :
        key === 'P' ? 'Đỉnh liền trước 4 trên đoạn ' + via + ' → 4' : 'Đỉnh chia đường';
      changes.push({
        phase: 'build', key, state: frame.state, at: [s, t], source, focus: [k],
        route: leftPath.concat(rightPath.slice(1)),
        headline: left + ' + ' + right + ' = ' + candidate + ' < ' + old,
        note: 'Qua đỉnh ' + via + ', D[1][4] giảm từ ' + old + ' xuống ' + candidate +
          '. ' + prefix + ' là ' + stored + '. Ghi ' + cell(key, s, t) + ' ← ' + rule +
          (source ? ' = ' + stored : '') + '.'
      });
    }
    return changes;
  }

  function traceFrames(key) {
    const result = engine.path(model, s, t, key);
    const steps = [];
    for (const step of result.frames) {
      // For M, each leaf lookup and its direct edge form a single visible step.
      if (step.kind !== 'read' && step.kind !== 'split' && step.kind !== 'found') continue;
      const route = step.route.slice();
      const frame = { phase: 'trace', key, state: model.final, route };
      if (step.kind === 'found') {
        const weights = route.slice(1).map((v, i) => model.W[route[i]][v]);
        frame.headline = engine.routeText(route);
        frame.note = (key === 'P' ? 'Đảo thứ tự các đỉnh vừa đọc. ' : '') + 'Tổng trọng số các cạnh là ' + weights.join(' + ') + ' = ' + result.distance + ', đúng bằng D[1][4].';
      } else {
        const [, i, j] = step.lookups[0];
        const value = model.final[key][i][j];
        const label = fmt(key, value);
        frame.at = [i, j];
        frame.headline = cell(key, i, j) + ' = ' + label;
        if (key === 'N') {
          frame.focus = [value];
          frame.note = 'Giữ cột đích 4. Ở hàng ' + engine.vertex(i) + ', ô này chỉ sang đỉnh ' + label + '. Đường đã đi là ' + engine.routeText(route) + '.';
        } else if (key === 'P') {
          frame.focus = [value];
          frame.note = 'Giữ hàng nguồn 1. Đỉnh ngay trước ' + engine.vertex(j) + ' là ' + label + '. Các đỉnh đọc được lần lượt là ' + [t, ...route.slice(0, -1).reverse()].map(engine.vertex).join(' → ') + '.';
        } else if (value < 0) {
          route.push(j);
          frame.focus = [j];
          frame.note = 'Đoạn ' + engine.routeText([i, j]) + ' là cạnh trực tiếp. Sau khi ghép, ta được ' + engine.routeText(route) + '.';
        } else {
          frame.focus = [value];
          frame.note = 'Tách tại ' + label + '. Dựng đoạn ' + engine.routeText([i, value]) + ' trước, sau đó dựng đoạn ' + engine.routeText([value, j]) + '.';
        }
      }
      steps.push(frame);
    }
    return steps;
  }

  function makeLesson(key) {
    return [{
      phase: 'distance', key: 'D', state: model.final, at: [s, t], route: [],
      headline: cell('D', s, t) + ' = ' + distance,
      note: 'Ô ở hàng 1, cột 4 cho biết tổng trọng số nhỏ nhất là ' + distance + '. Từ đỉnh 1, ta phải đi sang đỉnh nào trước?'
    }, ...buildFrames(key), ...traceFrames(key)];
  }

  function renderMatrix(frame) {
    const { key, state, at, source, phase } = frame;
    byId('matrix-caption').textContent = key + ' · ' + name[key];
    byId('axis').textContent = phase === 'build'
      ? (source ? 'Ô nét đứt được sao chép sang ô viền xanh lá.' : 'Ô viền xanh lá là ô được ghi.')
      : 'Hàng là nguồn, cột là đích.';
    const headers = matrix.tHead.rows[0].cells;
    for (let j = 0; j < model.n; j++) headers[j + 1].classList.toggle('axis-on', at?.[1] === j);
    for (let i = 0; i < model.n; i++) {
      const cells = matrix.tBodies[0].rows[i].cells;
      cells[0].classList.toggle('axis-on', at?.[0] === i);
      for (let j = 0; j < model.n; j++) {
        const el = cells[j + 1];
        const value = fmt(key, state[key][i][j]);
        el.textContent = value;
        el.className = value === '∞' || value === '—' ? 'empty' : '';
        if (source && source[0] === i && source[1] === j) el.classList.add('source-cell');
        if (at && at[0] === i && at[1] === j) el.classList.add(phase === 'build' ? 'write' : 'read');
      }
    }
  }

  function render() {
    const frame = frames[position], last = position === frames.length - 1;
    const routeEdges = new Set(frame.route.slice(1).map((v, i) => frame.route[i] + ',' + v));
    const visited = new Set(frame.route);
    for (const el of edges) el.classList.toggle('active', routeEdges.has(el.dataset.edge));
    for (const [i, el] of nodes.entries()) {
      el.classList.toggle('visited', visited.has(i));
      el.classList.toggle('focus', !!frame.focus?.includes(i));
    }
    renderMatrix(frame);
    byId('graph-title').textContent = frame.route.length > 1
      ? 'Đường đang tô trên đồ thị là ' + engine.routeText(frame.route) + '.' : 'Đồ thị có hướng từ đỉnh 1 đến đỉnh 4.';
    byId('headline').textContent = frame.headline;
    byId('explain').textContent = frame.note;
    byId('progress').textContent = 'Bước ' + (position + 1) + ' / ' + frames.length;
    for (const button of stages) {
      button.disabled = false;
      button.setAttribute('aria-pressed', String(button.dataset.stage === frame.phase));
    }
    byId('prev').disabled = position === 0;
    byId('next').textContent = last ? 'Xem lại ↺' : 'Bước tiếp →';
  }

  function stop() {
    window.clearInterval(timer);
    timer = null;
    byId('play').firstElementChild.textContent = '▶';
    byId('play-label').textContent = 'Tự chạy';
  }

  function go(index) {
    stop();
    position = index;
    render();
  }

  methods.addEventListener('change', () => {
    const phase = frames[position].phase;
    frames = makeLesson(methods.value);
    go(frames.findIndex(f => f.phase === (phase === 'trace' ? 'trace' : 'build')));
  });
  for (const button of stages) {
    button.addEventListener('click', () => go(frames.findIndex(f => f.phase === button.dataset.stage)));
  }
  byId('prev').addEventListener('click', () => go(Math.max(0, position - 1)));
  byId('next').addEventListener('click', () => go((position + 1) % frames.length));
  byId('play').addEventListener('click', () => {
    if (timer !== null) { stop(); return; }
    if (position === frames.length - 1) go(0);
    byId('play').firstElementChild.textContent = 'Ⅱ';
    byId('play-label').textContent = 'Tạm dừng';
    timer = window.setInterval(() => {
      position++;
      render();
      if (position === frames.length - 1) stop();
    }, 3200);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });

  frames = makeLesson(methods.value);
  render();
  for (const control of [methods, byId('next'), byId('play')]) control.disabled = false;
})();
