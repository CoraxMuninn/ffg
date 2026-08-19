import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

import type { Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/routes";
import { cn } from "@/lib/utils";

function localizeMarkdownHref(href: string | undefined, locale?: Locale): string | undefined {
  if (!href || !locale) return href;
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const first = href.split("/")[1];
  if (first === locale) return href;
  return localizedPath(locale, href);
}

interface ProseProps {
  content: string;
  className?: string;
  locale?: Locale;
  /**
   * Demotes every heading in the body by one level (h2 → h3, h3 → h4).
   *
   * Used where CMS body copy is nested under a heading the page already
   * renders — e.g. a market panel whose country name is the `h2`. Without
   * this, a body `##` would sit at the same level as its own section title
   * and break the document outline.
   */
  demoteHeadings?: boolean;
}

/**
 * Renders CMS Markdown body content.
 *
 * `react-markdown` does not render raw HTML by default, so CMS body content
 * stays safe from injected markup. Root-relative links (e.g. `/contact`) are
 * prefixed with the active locale when `locale` is provided.
 */
export function Prose({ content, className, locale, demoteHeadings = false }: ProseProps) {
  const components: Components = {
    p: ({ children }) => (
      <p className="my-4 text-base font-normal leading-[1.75] text-ink first:mt-0">{children}</p>
    ),
    h1: ({ children }) =>
      demoteHeadings ? (
        <h2 className="mb-4 mt-8 text-2xl font-bold text-navy first:mt-0">{children}</h2>
      ) : (
        <h1 className="mb-4 mt-8 text-2xl font-bold text-navy first:mt-0">{children}</h1>
      ),
    h2: ({ children }) =>
      demoteHeadings ? (
        <h3 className="mb-3 mt-7 text-xl font-bold text-navy first:mt-0">{children}</h3>
      ) : (
        <h2 className="mb-3 mt-7 text-xl font-bold text-navy first:mt-0">{children}</h2>
      ),
    h3: ({ children }) =>
      demoteHeadings ? (
        <h4 className="mb-2 mt-6 text-lg font-semibold text-navy">{children}</h4>
      ) : (
        <h3 className="mb-2 mt-6 text-lg font-semibold text-navy">{children}</h3>
      ),
    ul: ({ children }) => (
      <ul className="my-4 list-disc space-y-2 ps-5 text-ink">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="my-4 list-decimal space-y-2 ps-5 text-ink">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-[1.75]">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold text-navy">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-s-2 border-cyan-brand/40 ps-4 text-ink">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-8 border-navy/10" />,
    img: ({ src, alt }) =>
      src ? (
        // Markdown body images have no known width/height at compile time.
        // eslint-disable-next-line @next/next/no-img-element -- CMS markdown <img>
        <img
          src={src}
          alt={alt ?? ""}
          className="my-6 h-auto w-full rounded-2xl"
          loading="lazy"
        />
      ) : null,
    a: ({ children, href }) => (
      <a
        href={localizeMarkdownHref(href, locale)}
        className="font-medium text-cyan-link underline-offset-2 hover:underline hover:text-cyan-link-hover"
      >
        {children}
      </a>
    ),
  };

  return (
    <div className={cn("text-base", className)}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
