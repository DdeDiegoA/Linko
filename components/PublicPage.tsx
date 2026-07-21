import { useEffect, useState, type CSSProperties } from "react";
import { DEFAULT_SOCIAL_ICON, type PublicPageData } from "@/types";
import { InView } from "@/components/animate-ui/effects/in-view";
import TablerIcon from "@/components/TablerIcon";

const DEFAULT_BG = "#8e93ff";

export default function PublicPage({ data }: { data: PublicPageData }) {
  const { page, links, socials } = data;
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: page.id }),
    }).catch(() => {});
  }, [page.id]);

  const backgroundStyle: CSSProperties =
    page.background_type === "image" && page.background_value
      ? {
          backgroundColor: DEFAULT_BG,
          backgroundImage: `url(${page.background_value})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : { backgroundColor: page.background_value || DEFAULT_BG };

  const placeholderLetter = (page.title || "?").charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-16" style={backgroundStyle}>
      <div className="flex w-full max-w-[520px] flex-col items-center">
        <InView as="div" className="mb-7 h-[104px] w-[104px] flex-shrink-0" offset={18}>
          <div className="h-[104px] w-[104px] flex-shrink-0 overflow-hidden rounded-full border-[3px] border-fg bg-surface shadow-lg">
            {page.avatar_path && !avatarError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={page.avatar_path}
                alt={page.title}
                className="h-full w-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-[42px] font-normal text-fg">
                {placeholderLetter}
              </div>
            )}
          </div>
        </InView>

        {page.title && (
          <InView as="div" className="mb-1.5 w-full" offset={14} delay={0.05}>
            <h1
              className="break-words text-center font-display text-[44px] font-normal leading-[1.05] tracking-wide"
              style={{ color: page.title_color }}
            >
              {page.title}
            </h1>
          </InView>
        )}

        {page.subtitle && (
          <InView as="div" className="mb-12 w-full" offset={10} delay={0.1}>
            <p
              className="mx-auto max-w-[380px] text-center font-display text-base leading-normal"
              style={{ color: page.subtitle_color }}
            >
              {page.subtitle}
            </p>
          </InView>
        )}

        {links.length > 0 && (
          <div className="mb-11 flex w-full flex-col gap-2.5">
            {links.map((link, i) => {
              const custom = link.custom_style === 1;
              const color = custom ? link.color : page.link_color;
              const backgroundColor = custom ? link.background_color : page.link_background_color;
              const borderColor = custom ? link.border_color : page.link_border_color;
              const borderWidth = custom ? link.border_width : page.link_border_width;
              return (
                <InView key={link.id} as="div" className="w-full" offset={16} delay={0.15 + i * 0.05}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    onClick={() => {
                      navigator.sendBeacon?.(
                        "/api/click",
                        new Blob([JSON.stringify({ linkId: link.id })], { type: "application/json" })
                      );
                    }}
                    className="flex items-center gap-3.5 rounded-lg px-[22px] py-[18px] text-base font-medium no-underline transition-transform hover:-translate-y-0.5"
                    style={{
                      color,
                      backgroundColor,
                      borderColor,
                      borderWidth,
                      borderStyle: "solid",
                    }}
                  >
                    {link.icon && (
                      <span className="w-7 flex-shrink-0 text-center leading-none">
                        <TablerIcon name={link.icon} size={24} />
                      </span>
                    )}
                    <span className="flex-1 font-medium">{link.text}</span>
                    <span className="text-sm opacity-60">→</span>
                  </a>
                </InView>
              );
            })}
          </div>
        )}

        {socials.length > 0 && (
          <InView as="div" className="flex flex-wrap justify-center gap-3" offset={12} delay={0.15 + links.length * 0.05}>
            {socials.map((s) => {
              const iconName = s.icon ?? DEFAULT_SOCIAL_ICON[s.platform] ?? null;
              const custom = s.custom_color === 1;
              const color = custom ? s.icon_color : page.social_icon_color;
              const backgroundColor = custom ? s.icon_background_color : page.social_icon_background_color;
              return (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  title={s.text || s.platform}
                  aria-label={s.text || s.platform}
                  className="font-display flex h-11 w-11 items-center justify-center rounded-full border border-border text-base font-semibold no-underline transition-transform hover:scale-110"
                  style={{ color, backgroundColor }}
                >
                  <TablerIcon name={iconName} size={24} />
                </a>
              );
            })}
          </InView>
        )}
      </div>
    </div>
  );
}
