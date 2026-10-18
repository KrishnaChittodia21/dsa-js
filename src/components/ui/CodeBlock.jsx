import { useState } from 'react';
import { Highlight } from 'prism-react-renderer';
import Icon from './Icon.jsx';

// Prism theme from the Kinetic Voxel code palette (tokens.css § 3) — code blocks are dark in both themes.
const varTheme = {
  plain: { color: 'var(--code-text)', backgroundColor: 'transparent' },
  styles: [
    { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: 'var(--code-c)', fontStyle: 'italic' } },
    { types: ['keyword', 'builtin', 'important', 'atrule'], style: { color: 'var(--code-k)' } },
    { types: ['string', 'char', 'template-string', 'regex', 'attr-value'], style: { color: 'var(--code-s)' } },
    { types: ['number', 'boolean', 'constant'], style: { color: 'var(--code-n)' } },
    { types: ['function', 'class-name', 'method'], style: { color: 'var(--code-f)' } },
    { types: ['punctuation', 'operator'], style: { color: 'var(--code-p)' } },
    { types: ['variable', 'property', 'parameter'], style: { color: 'var(--code-v)' } },
  ],
};

export default function CodeBlock({ code, language = 'javascript', title, caption, copy = true }) {
  const [copied, setCopied] = useState(false);
  const text = (code || '').replace(/\n$/, '');
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };
  const lang = language === 'text' || language === 'txt' ? 'markup' : language === 'js' ? 'javascript' : language;
  return (
    <div className="code-block">
      {(title || copy) && (
        <div className="code-block-header">
          <span>{title || (language === 'text' ? '' : 'JavaScript')}</span>
          <span className="spacer" />
          {copy && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onCopy} aria-label="Copy code">
              <Icon name={copied ? 'check' : 'copy'} size={14} /> {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
      )}
      {lang === 'markup' ? (
        <pre>
          <code>{text}</code>
        </pre>
      ) : (
        <Highlight code={text} language={lang} theme={varTheme}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre className={className} style={style}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, k) => (
                    <span key={k} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      )}
      {caption && <div className="code-caption">{caption}</div>}
    </div>
  );
}
