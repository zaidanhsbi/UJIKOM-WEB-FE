import katex from 'katex';
import 'katex/dist/katex.min.css';

/** Merender teks biasa yang mengandung ekspresi LaTeX inline ($...$) atau display ($$...$$). */
export default function MathText({ text = '', className = '' }) {
  if (!text) return null;

  const str = String(text);
  const parts = str.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);

  return (
    <span className={className}>
      {parts.map((part, idx) => {
        if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
          const math = part.slice(2, -2);
          const html = katex.renderToString(math, {
            displayMode: true,
            throwOnError: false,
          });
          return (
            <span
              key={idx}
              className="block my-xs"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const math = part.slice(1, -1);
          const html = katex.renderToString(math, {
            displayMode: false,
            throwOnError: false,
          });
          return (
            <span
              key={idx}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
}
