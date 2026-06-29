import { useMemo } from 'react';

interface Props {
  content: string;
}

export default function MarkdownRenderer({ content }: Props) {
  const html = useMemo(() => renderMarkdown(content), [content]);
  return (
    <div
      className="ai-markdown prose prose-invert prose-sm max-w-none
        prose-headings:text-gray-100 prose-headings:mt-3 prose-headings:mb-1.5
        prose-p:my-1.5 prose-p:leading-relaxed
        prose-li:my-0.5
        prose-strong:text-muse-300
        prose-code:text-pink-300 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
        prose-pre:bg-dark-900 prose-pre:border prose-pre:border-white/5 prose-pre:rounded-lg
        prose-a:text-muse-400 prose-a:no-underline hover:prose-a:underline
        prose-blockquote:border-muse-500/50 prose-blockquote:text-gray-400"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function renderMarkdown(md: string): string {
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) =>
    `<pre class="overflow-x-auto"><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`
  );

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>');
  html = html.replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');

  html = html.replace(/\n{2,}/g, '</p><p>');
  html = html.replace(/\n/g, '<br/>');
  html = `<p>${html}</p>`;

  html = html.replace(/<p><(h[1-3]|pre|li)/g, '<$1');
  html = html.replace(/<\/(h[1-3]|pre|li)><\/p>/g, '</$1>');
  html = html.replace(/<p><\/p>/g, '');

  return html;
}
