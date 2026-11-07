import type { WebsiteDoc } from "@/lib/domain";
import { safeHttpUrl } from "@/lib/utils";

export function SitePreview({ site, locale, width }: { site: WebsiteDoc; locale: "he" | "en"; width: "desktop" | "mobile" }) {
  const theme = site.theme;
  const visible = site.sections.filter((section) => section.visible);
  return (
    <div className={width === "mobile" ? "mx-auto w-[390px] max-w-full border border-line" : "w-full border border-line"} style={{ background: theme.background, color: theme.text, fontFamily: theme.bodyFont }} dir={locale === "he" ? "rtl" : "ltr"}>
      {visible.map((section) => {
        const items = section.content.items ?? [];
        if (section.type === "nav") {
          return (
            <header key={section.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4" style={{ borderBottom: `1px solid ${theme.text}22` }}>
              <strong style={{ fontFamily: theme.headingFont }}>{section.content.title}</strong>
              <nav className="flex flex-wrap gap-4 text-sm">{items.map((item) => <span key={item.title}>{item.title}</span>)}</nav>
            </header>
          );
        }
        if (section.type === "hero") {
          const image = section.content.image === "custom" ? safeHttpUrl(section.content.imageUrl) : "";
          const wash = section.content.image === "wash" ? { background: `linear-gradient(180deg, ${theme.accent}88, ${theme.background})` } : {};
          return (
            <section key={section.id} className="px-5 py-12" style={{ ...wash, backgroundImage: image ? `url(${image})` : undefined, backgroundSize: "cover" }}>
              <p className="text-sm" style={{ color: theme.muted }}>{section.content.eyebrow}</p>
              <h2 className="mt-3 text-4xl leading-none md:text-6xl" style={{ fontFamily: theme.headingFont }}>{section.content.title}</h2>
              <p className="mt-4 max-w-xl text-lg">{section.content.subtitle}</p>
              <p className="mt-3 max-w-xl text-sm" style={{ color: theme.muted }}>{section.content.body}</p>
              {section.content.button && <span className="mt-6 inline-block px-4 py-2" style={{ background: theme.accent, color: theme.accentText }}>{section.content.button}</span>}
            </section>
          );
        }
        if (section.type === "footer") {
          return <footer key={section.id} className="px-5 py-6 text-sm" style={{ borderTop: `1px solid ${theme.text}22` }}><strong>{section.content.title}</strong><p>{section.content.body}</p></footer>;
        }
        return (
          <section key={section.id} className="px-5 py-8">
            {section.content.eyebrow && <p className="text-sm" style={{ color: theme.muted }}>{section.content.eyebrow}</p>}
            {section.content.title && <h3 className="text-3xl" style={{ fontFamily: theme.headingFont }}>{section.content.title}</h3>}
            {section.content.subtitle && <p className="mt-2 max-w-xl">{section.content.subtitle}</p>}
            {section.content.body && <p className="mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: theme.muted }}>{section.content.body}</p>}
            {items.length > 0 && (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {items.map((item) => (
                  <article key={item.title} className="p-4" style={{ background: theme.surface }}>
                    <h4 style={{ fontFamily: theme.headingFont }}>{item.title}</h4>
                    <p className="mt-2 text-sm">{item.text}</p>
                    {item.meta && <p className="mt-2 text-xs" style={{ color: theme.muted }}>{item.meta}</p>}
                  </article>
                ))}
              </div>
            )}
            {section.content.button && section.type === "contact" && <p className="mt-3 text-sm">{section.content.button}</p>}
          </section>
        );
      })}
    </div>
  );
}
