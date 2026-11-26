/* Frames are derived from the same Floyd engine as the matrices. */
(function () {
  'use strict';
  const E = typeof module === 'object' ? require('./matrix-engine.js') : window.MatrixLabEngine;
  const v = i => String(i + 1);
  const pair = (i, j) => v(i) + ' → ' + v(j);
  const cell = (key, i, j) => key + '[' + v(i) + '][' + v(j) + ']';
  const val = (key, x) => key === 'D' ? E.fmt(x) : x < 0 ? '−1' : v(x);

  function buildFrames(model, key, changesOnly) {
    const first = {
      step: 0, state: model.frames[0].state, route: [],
      title: 'Khởi tạo D và ' + key + '.',
      detail: key === 'N' ? 'Với cạnh i → j, N[i][j] = j. Trên đường chéo, N[i][i] = i.' :
        'Chưa có đỉnh trung gian. Mọi ô M bằng −1.'
    };
    const frames = [first];
    for (const snapshot of model.frames.slice(1)) {
      const { event, state, step } = snapshot;
      const { i, j, k, candidate, left, right, old, improved } = event;
      if (changesOnly && !improved) continue;
      const reads = [['D', i, k], ['D', k, j]];
      const writes = [];
      let detail = 'Giữ ' + cell('D', i, j) + ' = ' + E.fmt(old) + '.';
      if (improved) {
        writes.push(['D', i, j], [key, i, j]);
        if (key === 'N') reads.push(['N', i, k]);
        detail = cell('D', i, j) + ' giảm từ ' + E.fmt(old) + ' xuống ' + E.fmt(candidate) + '. ' +
          cell(key, i, j) + ' ← ' + (key === 'N' ? cell('N', i, k) + ' = ' : '') + val(key, state[key][i][j]) + '.';
      }
      let route = [];
      if (Number.isFinite(candidate)) {
        const previous = model.frames[step - 1].state;
        const a = E.path(model, i, k, 'N', previous).paths[0];
        const b = E.path(model, k, j, 'N', previous).paths[0];
        route = a.concat(b.slice(1));
      }
      frames.push({
        step, state, reads, writes, target: ['D', i, j], route, focus: k, endpoints: [i, j],
        title: pair(i, j) + ' qua ' + v(k) + '   ·   ' + E.fmt(left) + ' + ' + E.fmt(right) +
          (improved ? ' < ' : candidate === old ? ' = ' : ' > ') + E.fmt(old),
        detail
      });
    }
    frames.push({
      step: model.frames.length, state: model.final, route: [], title: 'Đã xét đủ ' + model.n + ' đỉnh trung gian.',
      detail: ''
    });
    return frames;
  }

  function traceFrames(model, key, s, t) {
    const result = E.path(model, s, t, key);
    const d = E.fmt(result.distance);
    const base = { state: model.final, endpoints: [s, t] };
    if (result.status !== 'finite') return [{
      ...base, route: [], reads: [['D', s, t]], title: cell('D', s, t) + ' = ' + d,
      detail: result.status === 'unreachable' ? 'Không có đường đi từ ' + v(s) + ' đến ' + v(t) + '.' : 'Chi phí có thể giảm vô hạn qua chu trình âm.'
    }];
    const route = result.paths[0];
    const final = {
      ...base, route, focus: t, title: 'Đường đi: ' + E.routeText(route),
      detail: 'Tổng trọng số ' + (route.length > 2 ?
        route.slice(1).map((u, i) => model.W[route[i]][u]).join(' + ') + ' = ' : '') + d + '.'
    };
    if (s === t) return [{ ...final, reads: [['D', s, t]], detail: 'Nguồn trùng đích. Tổng trọng số 0.' }];
    const frames = [{
      ...base, route: [s], focus: s, reads: [['D', s, t]], title: cell('D', s, t) + ' = ' + d,
      detail: key === 'N' ? 'Bắt đầu ở ' + v(s) + ', giữ nguyên cột đích ' + v(t) + '.' : 'Bắt đầu với đoạn ' + pair(s, t) + '.'
    }];
    let leafDepth = 0;
    for (const step of result.frames) {
      if (step.kind === 'read') {
        const [, i, j] = step.lookups[0], next = model.final.N[i][j];
        frames.push({
          ...base, route: step.route, focus: next, reads: step.lookups,
          title: cell('N', i, j) + ' = ' + v(next),
          detail: 'Thêm cạnh ' + pair(i, next) + ' vào đường đi.'
        });
      } else if (step.kind === 'split') {
        const [, i, j] = step.lookups[0], k = model.final.M[i][j];
        const split = k >= 0, segment = pair(i, j);
        const call = 'Dựng (' + v(i) + ', ' + v(j) + ')';
        leafDepth = step.depth;
        frames.push({
          ...base, route: step.route, endpoints: [i, j], focus: split ? k : null,
          reads: step.lookups, title: cell('M', i, j) + ' = ' + val('M', k),
          detail: split ? 'Tách tại đỉnh ' + v(k) + '. Dựng ' + pair(i, k) + ' trước rồi dựng ' + pair(k, j) + '.' :
            'Đoạn ' + segment + ' là một cạnh trực tiếp.',
          entry: { depth: step.depth, text: call + (split ? ' · tách tại ' + v(k) : ' · cạnh trực tiếp') }
        });
      } else if (step.kind === 'advance') {
        const [, i, j] = step.lookups[0];
        frames.push({
          ...base, route: step.route, focus: j, reads: [['M', i, j]],
          title: 'Ghép cạnh ' + pair(i, j), detail: 'Thêm đỉnh ' + v(j) + ' vào cuối danh sách.',
          entry: { depth: leafDepth + 1, text: 'Ghép ' + pair(i, j) }
        });
      }
    }
    frames.push(final);
    return frames;
  }

  function mount(root, model) {
    const key = root.dataset.method;
    const role = name => root.querySelector('[data-role="' + name + '"]');
    const action = name => root.querySelector('[data-action="' + name + '"]');
    const phase = role('phase'), filter = role('filter'), speed = role('speed');
    const play = action('play'), prev = action('prev'), next = action('next');
    const matrices = [...root.querySelectorAll('[data-matrix]')].map(table => ({
      key: table.dataset.matrix, cells: [...table.querySelectorAll('[data-cell]')].map(el => {
        const [i, j] = el.dataset.cell.split(',').map(Number);
        return { el, i, j };
      })
    }));
    const nodes = [...root.querySelectorAll('[data-node]')], edges = [...root.querySelectorAll('[data-edge]')];
    let frames = buildFrames(model, key, filter.checked), pos = 0, timer = null;
    let source = null, target = null;

    function stop() {
      clearInterval(timer);
      timer = null;
      play.textContent = 'Phát';
      play.setAttribute('aria-pressed', 'false');
    }
    function render() {
      const building = phase.value === 'build';
      const f = frames[pos] || { state: model.final, route: [], focus: source,
        title: 'D và ' + key + ' sau khi chạy Floyd.', detail: '' };
      function isCell(a, matrix, i, j) { return a && a[0] === matrix && a[1] === i && a[2] === j; }
      for (const { key: matrix, cells } of matrices) {
        for (const { el, i, j } of cells) {
          const value = val(matrix, f.state[matrix][i][j]);
          if (el.textContent !== value) el.textContent = value;
          const read = f.reads?.some(a => isCell(a, matrix, i, j));
          const write = f.writes?.some(a => isCell(a, matrix, i, j));
          el.className = write ? 'write' : read ? 'read' : isCell(f.target, matrix, i, j) ? 'target' : '';
          el.title = cell(matrix, i, j) + ' = ' + value + (write ? ' · vừa ghi' : read ? ' · đang đọc' : '');
        }
      }
      const routeEdges = f.route.slice(1).map((u, i) => f.route[i] + ',' + u);
      for (const edge of edges) {
        edge.classList.toggle('active', routeEdges.includes(edge.dataset.edge));
        edge.classList.toggle('latest', !building && edge.dataset.edge === routeEdges.at(-1));
      }
      for (const node of nodes) {
        const u = Number(node.dataset.node);
        node.classList.toggle('visited', f.route.includes(u));
        node.classList.toggle('endpoint', !!f.endpoints?.includes(u));
        node.classList.toggle('focus', u === f.focus);
      }
      role('filter-label').hidden = !building;
      role('pick').textContent = source !== null && target === null ? 'Từ đỉnh ' + v(source) + '. Chọn đỉnh đích.' :
        'Chọn đỉnh nguồn, rồi chọn đỉnh đích.';
      role('route').textContent = !building && f.route.length && pos < frames.length - 1 ? 'Đường đang dựng   ' + E.routeText(f.route) : '';
      role('statement').textContent = f.title;
      role('detail').textContent = f.detail;
      role('count').textContent = frames.length ? 'Bước ' + (pos + 1) + ' / ' + frames.length : '';
      prev.disabled = pos === 0;
      next.disabled = pos >= frames.length - 1;
      play.disabled = frames.length < 2;
      const showLog = !building && key === 'M' && frames.length > 0;
      if (key === 'M') role('calls-box').hidden = !showLog;
      if (showLog) {
        const entries = frames.slice(0, pos + 1).map(frame => frame.entry).filter(Boolean);
        const list = role('calls');
        list.replaceChildren();
        for (const entry of entries) {
          const li = document.createElement('li');
          li.style.marginInlineStart = entry.depth + 'em';
          li.textContent = entry.text;
          list.append(li);
        }
        role('calls-box').hidden = !entries.length;
      }
    }
    function advance(delta) {
      pos = Math.max(0, Math.min(pos + delta, frames.length - 1));
      render();
      if (pos === frames.length - 1) stop();
    }
    function start() {
      stop();
      if (frames.length < 2) return;
      if (pos === frames.length - 1) pos = 0;
      render();
      play.textContent = 'Tạm dừng';
      play.setAttribute('aria-pressed', 'true');
      timer = setInterval(() => advance(1), Number(speed.value));
    }
    function reset() {
      stop();
      source = target = null;
      pos = 0;
      frames = phase.value === 'build' ? buildFrames(model, key, filter.checked) : [];
      render();
    }
    function choose(u) {
      stop();
      phase.value = 'trace';
      pos = 0;
      if (source === null || target !== null) {
        source = u; target = null; frames = [];
        render();
      } else {
        target = u;
        frames = traceFrames(model, key, source, target);
        render();
        if (frames.length > 1) start();
      }
    }
    for (const node of nodes) {
      node.addEventListener('click', () => choose(Number(node.dataset.node)));
      node.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!e.repeat) choose(Number(node.dataset.node));
        }
      });
    }
    phase.addEventListener('change', reset);
    filter.addEventListener('change', () => {
      stop();
      const step = frames[pos].step;
      frames = buildFrames(model, key, filter.checked);
      pos = frames.findIndex(f => f.step >= step);
      render();
    });
    speed.addEventListener('change', () => { if (timer !== null) start(); });
    play.addEventListener('click', () => { if (timer === null) start(); else stop(); });
    prev.addEventListener('click', () => { stop(); advance(-1); });
    next.addEventListener('click', () => { stop(); advance(1); });
    action('reset').addEventListener('click', reset);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    render();
  }
  if (typeof module === 'object' && module.exports) {
    module.exports = { buildFrames, traceFrames, mount };
  } else {
    const graph = document.querySelector('.initial .route-graph');
    const edges = [...graph.querySelectorAll('[data-edge]')].map(el =>
      [...el.dataset.edge.split(',').map(Number), Number(el.querySelector('text').textContent)]);
    const model = E.build(graph.querySelectorAll('[data-node]').length, edges);
    document.querySelectorAll('.demo').forEach(root => mount(root, model));
  }
})();
