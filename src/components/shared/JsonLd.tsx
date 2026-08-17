/**
 * Renders a JSON-LD structured-data script.
 *
 * This is a Server Component. The value is serialized once at render time and
 * injected as a script tag. Nothing from user input reaches JSON-LD without
 * going through the typed content models first.
 *
 * `JSON.stringify` does not escape `<`, `>`, or `&`, so a `</script>` sequence
 * inside CMS-controlled content could break out of this script tag. We escape
 * those characters to prevent script-tag breakout / stored XSS.
 */
function escapeJsonLd(value: string): string {
  return value
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e");
}

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const payload = Array.isArray(data) ? data : [data];
  return payload.map((item, index) => (
    <script
      key={index}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJsonLd(JSON.stringify(item)) }}
    />
  ));
}
