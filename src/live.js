window.addEventListener('message', (event) => {
  if (event.source !== window.parent) return;
  if (event.data?.type !== 'readmode-render-html') return;
  const html = typeof event.data.html === 'string' ? event.data.html : '';
  if (!html) return;
  // This page is declared as a manifest sandbox page. The document is
  // intentionally isolated from the extension and may execute the source
  // HTML's inline and external scripts inside that sandbox.
  document.open();
  document.write(html);
  document.close();
});

// Tell the parent viewer that the sandbox listener is ready before it sends the document.
window.parent.postMessage({ type: 'readmode-live-ready' }, '*');
