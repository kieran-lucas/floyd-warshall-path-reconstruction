/* Copy the original code text, including indentation and decoded HTML entities. */
(function () {
  'use strict';

  function legacyCopy(text, doc) {
    const active = doc.activeElement;
    const selection = doc.getSelection?.();
    const ranges = [];
    if (selection) {
      for (let i = 0; i < selection.rangeCount; i++) ranges.push(selection.getRangeAt(i).cloneRange());
    }
    const field = doc.createElement('textarea');
    field.value = text;
    field.readOnly = true;
    field.tabIndex = -1;
    Object.assign(field.style, {
      position: 'fixed', top: '0', left: '0', width: '1px',
      height: '1px', opacity: '0', pointerEvents: 'none'
    });
    doc.body.append(field);
    try {
      field.focus({ preventScroll: true });
      field.select();
      field.setSelectionRange(0, field.value.length);
      return doc.execCommand('copy') === true;
    } catch (_) {
      return false;
    } finally {
      field.remove();
      if (active && typeof active.focus === 'function') active.focus({ preventScroll: true });
      if (selection) {
        selection.removeAllRanges();
        for (const range of ranges) selection.addRange(range);
      }
    }
  }

  async function copyText(text, doc, nav, framed) {
    // Cross-origin portal iframes may prohibit the modern Clipboard API.
    // Try the synchronous fallback first in an iframe to preserve user activation.
    if (framed && legacyCopy(text, doc)) return true;
    try {
      if (nav.clipboard && typeof nav.clipboard.writeText === 'function') {
        await nav.clipboard.writeText(text);
        return true;
      }
    } catch (_) {
      // Clipboard permission denied or unavailable.
    }
    return !framed && legacyCopy(text, doc);
  }

  function mountCopyButtons(doc, nav, win) {
    for (const pre of doc.querySelectorAll('pre')) {
      const code = pre.querySelector('code');
      if (!code || pre.parentElement.classList.contains('copy-block')) continue;
      const wrapper = doc.createElement('div');
      wrapper.className = 'copy-block';
      pre.before(wrapper);
      wrapper.append(pre);

      const button = doc.createElement('button');
      button.type = 'button';
      button.className = 'copy-code';
      button.setAttribute('aria-label', 'Sao chép mã');
      button.title = 'Sao chép mã';
      button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg><span aria-live="polite">Copy</span>';
      const label = button.querySelector('span');
      let timeout;
      button.addEventListener('click', async () => {
        win.clearTimeout(timeout);
        const ok = await copyText(code.textContent, doc, nav, win.self !== win.top);
        label.textContent = ok ? 'Copied' : 'Failed';
        button.dataset.state = ok ? 'copied' : 'failed';
        button.setAttribute('aria-label', ok ? 'Đã sao chép mã' : 'Không thể sao chép mã');
        button.title = ok ? 'Đã sao chép mã' : 'Không thể sao chép; hãy chọn mã và sao chép thủ công';
        timeout = win.setTimeout(() => {
          label.textContent = 'Copy';
          delete button.dataset.state;
          button.setAttribute('aria-label', 'Sao chép mã');
          button.title = 'Sao chép mã';
        }, 1800);
      });
      wrapper.append(button);
    }
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { copyText, mountCopyButtons };
  } else {
    mountCopyButtons(document, navigator, window);
  }
})();
