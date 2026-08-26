const escapeHtml = (value = '') => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const safeUrl = (value = '', baseUrl = '') => {
  const raw = value.trim();
  if (!raw || /^(javascript|data|vbscript):/i.test(raw)) return '#';
  if (baseUrl && !raw.startsWith('#')) {
    try { return new URL(raw, baseUrl).href.replaceAll('"', '%22'); } catch { return '#'; }
  }
  return raw.replaceAll('"', '%22');
};

function inlineMarkdown(value, baseUrl = '') {
  const stash = [];
  const keep = (html) => `\u0000${stash.push(html) - 1}\u0000`;
  let text = escapeHtml(value);

  text = text.replace(/!\[([^\]]*)\]\((\S+?)(?:\s+["']([^"']*)["'])?\)/g, (_, alt, url, title) => {
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    return keep(`<img src="${escapeHtml(safeUrl(url, baseUrl))}" alt="${escapeHtml(alt)}"${titleAttr} loading="lazy">`);
  });
  text = text.replace(/\[([^\]]+)\]\((\S+?)(?:\s+["']([^"']*)["'])?\)/g, (_, label, url, title) => {
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    return keep(`<a href="${escapeHtml(safeUrl(url, baseUrl))}" target="_blank" rel="noreferrer noopener"${titleAttr}>${label}</a>`);
  });
  text = text.replace(/`([^`]+)`/g, (_, code) => keep(`<code>${code}</code>`));
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  text = text.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?]|$)/g, '$1<em>$2</em>');
  text = text.replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,!?]|$)/g, '$1<em>$2</em>');
  text = text.replace(/&lt;((?:https?:\/\/|mailto:)[^\s&]+)&gt;/g, (_, url) => keep(`<a href="${escapeHtml(safeUrl(url, baseUrl))}" target="_blank" rel="noreferrer noopener">${url}</a>`));
  text = text.replaceAll('\n', '<br>');
  return text.replace(/\u0000(\d+)\u0000/g, (_, index) => stash[Number(index)]);
}

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^\p{Letter}\p{Number}]+/gu, '-').replace(/^-|-$/g, '') || 'section';
}

function renderTable(lines, baseUrl = '') {
  const parseRow = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
  const headers = parseRow(lines[0]);
  const rows = lines.slice(2).map(parseRow);
  return `<div class="table-wrap"><table><thead><tr>${headers.map((cell) => `<th>${inlineMarkdown(cell, baseUrl)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((_, i) => `<td>${inlineMarkdown(row[i] || '', baseUrl)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

export function renderMarkdown(markdown, baseUrl = '') {
  let lines = markdown.replace(/^\uFEFF/, '').replaceAll('\r\n', '\n').split('\n');
  if (lines[0]?.trim() === '---') {
    const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
    if (end > 0) lines = lines.slice(end + 1);
  }
  const output = [];
  const headings = [];
  let i = 0;
  let paragraph = [];
  let list = null;
  let quote = [];
  let code = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push(`<p>${inlineMarkdown(paragraph.join('\n'), baseUrl)}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    const tag = list.type === 'ol' ? 'ol' : 'ul';
    output.push(`<${tag}>${list.items.join('')}</${tag}>`);
    list = null;
  };
  const flushQuote = () => {
    if (!quote.length) return;
    const alert = quote[0].match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i);
    if (alert) {
      const kind = alert[1].toLowerCase();
      const body = [alert[2], ...quote.slice(1)].filter(Boolean).join('\n');
      output.push(`<aside class="md-alert md-alert-${kind}"><div class="md-alert-title">${alert[1].toUpperCase()}</div><div>${renderMarkdown(body, baseUrl).html}</div></aside>`);
    } else {
      output.push(`<blockquote>${renderMarkdown(quote.join('\n'), baseUrl).html}</blockquote>`);
    }
    quote = [];
  };

  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(/^\s*```\s*([\w-]*)\s*$/);
    if (fence) {
      flushParagraph(); flushList(); flushQuote();
      if (!code) code = { language: fence[1] || 'text', lines: [] };
      else {
        const language = escapeHtml(code.language);
        const className = code.language === 'mermaid' ? ' code-diagram' : '';
        output.push(`<pre class="code-block${className}"><span class="code-language">${language}</span><button class="copy-code" type="button">复制</button><code data-language="${language}">${escapeHtml(code.lines.join('\n'))}</code></pre>`);
        code = null;
      }
      i += 1;
      continue;
    }
    if (code) { code.lines.push(line); i += 1; continue; }

    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      flushParagraph(); flushList(); flushQuote();
      const level = heading[1].length;
      const raw = heading[2].replace(/[*_`]/g, '').trim();
      const id = `${slugify(raw)}-${headings.length + 1}`;
      headings.push({ level, text: raw, id });
      output.push(`<h${level} id="${id}">${inlineMarkdown(heading[2], baseUrl)}</h${level}>`);
      i += 1;
      continue;
    }
    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      flushParagraph(); flushList(); flushQuote(); output.push('<hr>'); i += 1; continue;
    }
    if (/^\s*>/.test(line)) {
      flushParagraph(); flushList();
      quote.push(line.replace(/^\s*>\s?/, ''));
      i += 1; continue;
    }
    if (/^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(line)) {
      flushParagraph(); flushQuote();
      const match = line.match(/^\s*(?:([-*+])|(\d+)[.)])\s+(.+)$/);
      const type = match[2] ? 'ol' : 'ul';
      if (!list || list.type !== type) { flushList(); list = { type, items: [] }; }
      let content = match[3];
      const task = content.match(/^\[([ xX])\]\s+(.*)$/);
      if (task) content = `<label class="task"><input type="checkbox" disabled ${task[1].toLowerCase() === 'x' ? 'checked' : ''}><span>${inlineMarkdown(task[2], baseUrl)}</span></label>`;
      else content = inlineMarkdown(content, baseUrl);
      list.items.push(`<li>${content}</li>`);
      i += 1;
      continue;
    }
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[i + 1])) {
      flushParagraph(); flushList(); flushQuote();
      output.push(renderTable(lines.slice(i, i + 2 + (() => { let n = 0; while (lines[i + 2 + n]?.includes('|') && lines[i + 2 + n].trim()) n += 1; return n; })()), baseUrl));
      let skip = 2; while (lines[i + skip]?.includes('|') && lines[i + skip].trim()) skip += 1; i += skip; continue;
    }
    if (!line.trim()) { flushParagraph(); flushList(); flushQuote(); i += 1; continue; }
    paragraph.push(line); i += 1;
  }
  flushParagraph(); flushList(); flushQuote();
  if (code) output.push(`<pre class="code-block"><code data-language="${escapeHtml(code.language)}">${escapeHtml(code.lines.join('\n'))}</code></pre>`);
  return { html: output.join('\n'), headings };
}

const HTML_URL_ATTRIBUTES = new Set(['src', 'href', 'action', 'formaction', 'poster', 'cite', 'background', 'xlink:href']);
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

function isSafeImageDataUrl(value) {
  return /^data:image\/(?:png|gif|jpe?g|webp|avif|svg\+xml)(?:[;,])/i.test(value);
}

function isSvgImageReference(node, attributeName) {
  const localName = node.localName?.toLowerCase();
  if (attributeName === 'src') return localName === 'img' || localName === 'image';
  if (attributeName === 'href' || attributeName === 'xlink:href') {
    return node.namespaceURI === SVG_NAMESPACE && ['image', 'use'].includes(localName);
  }
  return false;
}

function resolveCssUrls(value, baseUrl) {
  if (!baseUrl || !value) return value;
  return value.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (match, quote, rawUrl) => {
    const candidate = rawUrl.trim();
    if (!candidate || candidate.startsWith('#') || /^(?:data|blob|javascript|vbscript):/i.test(candidate)) return match;
    try {
      const resolved = new URL(candidate, baseUrl).href;
      return `url(${quote || '"'}${resolved}${quote || '"'})`;
    } catch {
      return match;
    }
  });
}

function prepareHtmlDocument(html, baseUrl = '', options = {}) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  if (!options.keepBase) doc.querySelectorAll('base').forEach((node) => node.remove());
  doc.querySelectorAll('style').forEach((node) => {
    node.textContent = resolveCssUrls(node.textContent || '', baseUrl);
  });
  doc.querySelectorAll('[style]').forEach((node) => {
    node.setAttribute('style', resolveCssUrls(node.getAttribute('style') || '', baseUrl));
  });
  doc.querySelectorAll('svg').forEach((node) => {
    if (!node.getAttribute('xmlns')) node.setAttribute('xmlns', SVG_NAMESPACE);
  });
  doc.querySelectorAll('*').forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (name === 'srcset') {
        const candidates = value.split(',').map((candidate) => candidate.trim()).filter(Boolean).map((candidate) => {
          const [candidateUrl, ...descriptor] = candidate.split(/\s+/);
          if (!candidateUrl || candidateUrl.startsWith('#') || /^(?:data|blob|javascript|vbscript):/i.test(candidateUrl)) {
            return [candidateUrl, ...descriptor].join(' ');
          }
          try { return [new URL(candidateUrl, baseUrl).href, ...descriptor].join(' '); } catch { return candidate; }
        });
        node.setAttribute(attribute.name, candidates.join(', '));
        return;
      }
      if (baseUrl && HTML_URL_ATTRIBUTES.has(name) && value && !value.startsWith('#') && !/^(?:data|blob|javascript|vbscript):/i.test(value)) {
        try { node.setAttribute(attribute.name, new URL(value, baseUrl).href); } catch { /* keep the original URL */ }
      }
    });
  });
  if (options.keepBase && baseUrl && doc.head && !doc.head.querySelector('base[href]')) {
    const base = doc.createElement('base');
    base.href = baseUrl;
    doc.head.prepend(base);
  }
  return doc;
}

export function sanitizeHtmlDocument(html, baseUrl = '') {
  const doc = prepareHtmlDocument(html, baseUrl);
  doc.querySelectorAll('script, iframe, object, embed, form, meta[http-equiv]').forEach((node) => node.remove());
  doc.querySelectorAll('*').forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (/^on/i.test(name)) {
        node.removeAttribute(attribute.name);
        return;
      }
      if (HTML_URL_ATTRIBUTES.has(name) && /^(javascript|data|vbscript):/i.test(value)) {
        const isImageData = /^data:/i.test(value) && isSafeImageDataUrl(value) && isSvgImageReference(node, name);
        if (!isImageData) node.removeAttribute(attribute.name);
      }
    });
  });
  if (!doc.head) doc.documentElement.insertBefore(doc.createElement('head'), doc.body);
  const policy = doc.createElement('meta');
  policy.httpEquiv = 'Content-Security-Policy';
  policy.content = "default-src 'none'; script-src 'none'; object-src 'none'; frame-src 'none'; style-src 'unsafe-inline' http: https: file:; img-src data: blob: http: https: file:; font-src data: blob: http: https: file:; media-src blob: http: https: file:; connect-src 'none'; form-action 'none'";
  doc.head.prepend(policy);
  return `<!doctype html>${doc.documentElement.outerHTML}`;
}

export { prepareHtmlDocument };
