'use strict';
const assert = require('node:assert/strict');
const { copyText, mountCopyButtons } = require('./copy-code.js');

async function run() {
  const source = '  if (i <= n && j > 0) {\n    return i;\n  }\n';
  let copied = '', modernCalls = 0, legacyCalls = 0, removed = 0, restored = 0;
  let field, legacyWorks = true;
  const doc = {
    activeElement: { focus() { restored++; } },
    getSelection() { return null; },
    createElement() { return { value: '', style: {}, focus() {}, select() {}, setSelectionRange() {}, remove() { removed++; } }; },
    body: { append(el) { field = el; } },
    execCommand(cmd) { assert.equal(cmd, 'copy'); legacyCalls++; if (legacyWorks) copied = field.value; return legacyWorks; }
  };
  const nav = { clipboard: { async writeText(text) { modernCalls++; copied = text; } } };
  assert.equal(await copyText(source, doc, nav, false), true);
  assert.equal(copied, source);
  assert.equal(modernCalls, 1);
  assert.equal(legacyCalls, 0);

  assert.equal(await copyText(source, doc, nav, true), true);
  assert.equal(copied, source);
  assert.equal(modernCalls, 1);
  assert.equal(legacyCalls, 1);
  assert.equal(removed, 1);
  assert.equal(restored, 1);

  const denied = { clipboard: { async writeText() { throw new Error('NotAllowedError'); } } };
  assert.equal(await copyText(source, doc, denied, false), true);
  assert.equal(copied, source);
  legacyWorks = false;
  assert.equal(await copyText(source, doc, denied, true), false);
  assert.equal(await copyText(source, doc, nav, true), true);

  // Check that each block gets exactly one button and that feedback reflects success.
  let reset;
  const label = { textContent: 'Copy' };
  const parent = { classList: { contains() { return false; } } };
  const code = { textContent: source };
  const pre = { parentElement: parent, querySelector() { return code; }, before(wrapper) { this.wrapper = wrapper; } };
  const wrapper = { className: '', classList: { contains(name) { return name === 'copy-block'; } }, append(el) { el.parentElement = this; this.last = el; } };
  const button = { dataset: {}, setAttribute() {}, querySelector() { return label; }, addEventListener(name, fn) { this.click = fn; } };
  const page = { querySelectorAll() { return [pre]; }, createElement(tag) { return tag === 'div' ? wrapper : button; } };
  const win = { self: {}, top: null, clearTimeout() {}, setTimeout(fn) { reset = fn; } };
  win.top = win.self;
  mountCopyButtons(page, nav, win);
  assert.equal(wrapper.last, button);
  await button.click();
  assert.equal(label.textContent, 'Copied');
  assert.equal(button.dataset.state, 'copied');
  assert.equal(copied, source);
  reset();
  assert.equal(label.textContent, 'Copy');
  mountCopyButtons(page, nav, win);
  assert.equal(pre.parentElement, wrapper);
  console.log('PASS clipboard, iframe fallback, exact code text, button feedback and repeat mounting.');
}
if (typeof module !== 'undefined') module.exports = run;
