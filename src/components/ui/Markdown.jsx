import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock.jsx';

const components = {
  code({ node, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const text = String(children);
    if (match || text.includes('\n')) {
      return <CodeBlock code={text} language={match ? match[1] : 'text'} copy={false} />;
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  pre({ children }) {
    return <>{children}</>;
  },
  a({ node, href, children }) {
    // no links out of the app: a link to another website shows as its text only
    if (href && /^(https?:)?\/\//.test(href)) return <>{children}</>;
    return <a href={href}>{children}</a>;
  },
};

function Markdown({ children, className = '' }) {
  if (!children) return null;
  return (
    <div className={`md ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {String(children)}
      </ReactMarkdown>
    </div>
  );
}

export default memo(Markdown);
