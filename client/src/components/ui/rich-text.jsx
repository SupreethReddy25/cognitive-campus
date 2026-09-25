/**
 * RichText — tiny, safe markdown-ish renderer for problem statements, editorials and plans.
 * Supports: paragraphs, `- ` bullet lists, numbered lists, **bold**, *italic*, `inline code`,
 * ``` fenced code blocks ```, and ## headings. No HTML injection (everything is a React node).
 */

import { Fragment } from 'react';

const inline = (text, keyBase = '') => {
  const out = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('`')) out.push(<code key={`${keyBase}c${i}`} className="rounded bg-white/[0.07] px-1.5 py-0.5 font-mono text-[0.88em] text-emerald-200">{tok.slice(1, -1)}</code>);
    else if (tok.startsWith('**')) out.push(<strong key={`${keyBase}b${i}`} className="font-semibold text-zinc-100">{tok.slice(2, -2)}</strong>);
    else out.push(<em key={`${keyBase}i${i}`} className="italic text-zinc-300">{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
    i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
};

export function CodeBlock({ code, lang, className = '' }) {
  return (
    <pre className={`overflow-x-auto rounded-xl border border-white/[0.07] bg-[#070a0e] p-4 font-mono text-[12px] leading-relaxed text-zinc-300 scrollbar-surgical ${className}`}>
      {lang && <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600">{lang}</div>}
      <code>{code}</code>
    </pre>
  );
}

export function RichText({ text = '', className = '' }) {
  const lines = String(text).replace(/\r/g, '').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3);
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) buf.push(lines[i++]);
      i++;
      blocks.push({ type: 'code', lang, code: buf.join('\n') });
    } else if (/^\s*[-*•]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*•]\s+/, ''));
      blocks.push({ type: 'ul', items });
    } else if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ''));
      blocks.push({ type: 'ol', items });
    } else if (/^#{1,4}\s+/.test(line)) {
      blocks.push({ type: 'h', text: line.replace(/^#{1,4}\s+/, '') });
      i++;
    } else if (!line.trim()) {
      i++;
    } else {
      const buf = [line];
      i++;
      while (i < lines.length && lines[i].trim() && !/^\s*([-*•]|\d+[.)]|#{1,4}|```)/.test(lines[i])) buf.push(lines[i++]);
      blocks.push({ type: 'p', text: buf.join(' ') });
    }
  }

  return (
    <div className={`space-y-3 text-[13px] leading-[1.7] text-zinc-400 ${className}`}>
      {blocks.map((b, k) => (
        <Fragment key={k}>
          {b.type === 'p' && <p>{inline(b.text, `p${k}`)}</p>}
          {b.type === 'h' && <h4 className="pt-2 text-[13px] font-semibold text-zinc-200">{inline(b.text, `h${k}`)}</h4>}
          {b.type === 'ul' && <ul className="space-y-1.5 pl-1">{b.items.map((it, j) => <li key={j} className="flex gap-2.5"><span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-zinc-600" /><span>{inline(it, `u${k}${j}`)}</span></li>)}</ul>}
          {b.type === 'ol' && <ol className="space-y-1.5">{b.items.map((it, j) => <li key={j} className="flex gap-2.5"><span className="w-4 shrink-0 text-right font-mono text-[11px] text-zinc-600">{j + 1}.</span><span>{inline(it, `o${k}${j}`)}</span></li>)}</ol>}
          {b.type === 'code' && <CodeBlock code={b.code} lang={b.lang} />}
        </Fragment>
      ))}
    </div>
  );
}
