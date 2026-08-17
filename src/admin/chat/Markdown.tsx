import { memo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Message renderer modelled on Vercel's AI Chatbot markdown component,
// themed through admin tokens so light/dark modes stay readable.
const components: Components = {
  p: ({ children }) => <p className="mb-3 leading-7 text-current last:mb-0">{children}</p>,
  strong: ({ children }) => <span className="font-semibold text-current">{children}</span>,
  em: ({ children }) => <em className="italic opacity-75">{children}</em>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="font-medium text-accent underline underline-offset-4 hover:opacity-80">{children}</a>
  ),
  ul: ({ children }) => <ul className="mb-3 ml-5 list-outside list-disc space-y-1.5 text-current">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 ml-5 list-outside list-decimal space-y-1.5 text-current">{children}</ol>,
  li: ({ children }) => <li className="pl-1 leading-7 marker:text-muted">{children}</li>,
  h1: ({ children }) => <h1 className="mb-3 mt-5 text-xl font-semibold text-current first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-5 text-base font-semibold text-current first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-4 text-sm font-semibold text-current first:mt-0">{children}</h3>,
  blockquote: ({ children }) => <blockquote className="my-4 rounded-[var(--admin-radius-control)] border border-rule border-l-2 border-l-accent/60 bg-accent/5 py-2 pl-4 pr-3 text-current opacity-85">{children}</blockquote>,
  hr: () => <hr className="my-5 border-rule" />,
  code: ({ className, children }) => {
    const block = (className ?? '').includes('language-');
    if (block) {
      return (
        <pre className="my-4 overflow-x-auto rounded-[var(--admin-radius-control)] border border-rule bg-bg/60 p-3 text-[0.82rem] leading-6 text-current">
          <code>{children}</code>
        </pre>
      );
    }
    return <code className="rounded-[0.45rem] bg-accent/10 px-1.5 py-0.5 text-[0.85em] text-accent">{children}</code>;
  },
  table: ({ children }) => <div className="my-4 overflow-hidden rounded-[var(--admin-radius-control)] border border-rule"><div className="overflow-x-auto"><table className="w-full border-collapse text-sm">{children}</table></div></div>,
  th: ({ children }) => <th className="border-b border-r border-rule bg-accent/5 px-3 py-2 text-left font-medium text-current last:border-r-0">{children}</th>,
  td: ({ children }) => <td className="border-b border-r border-rule px-3 py-2 text-current last:border-r-0">{children}</td>,
};

function MarkdownImpl({ children }: { children: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{children}</ReactMarkdown>;
}

export const Markdown = memo(MarkdownImpl, (a, b) => a.children === b.children);
