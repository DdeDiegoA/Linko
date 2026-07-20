import { useState, type ReactNode } from "react";
import { DEFAULT_SOCIAL_ICON, type SocialLink, type SocialPlatform } from "@/types";
import { AnimateButton } from "@/components/animate-ui/buttons/button";
import IconPicker from "@/components/IconPicker";
import TablerIcon from "@/components/TablerIcon";

const PLATFORMS: SocialPlatform[] = [
  "github",
  "twitter",
  "instagram",
  "linkedin",
  "youtube",
  "tiktok",
  "other",
];

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  github: "GitHub",
  twitter: "Twitter / X",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
  other: "Otro",
};

export default function SocialEditor({
  socials,
  onChange,
}: {
  socials: SocialLink[];
  onChange: (socials: SocialLink[]) => void;
}) {
  const [platform, setPlatform] = useState<SocialPlatform>("github");
  const [url, setUrl] = useState("");
  const [iconColor, setIconColor] = useState("#1a1a1a");
  const [text, setText] = useState("");
  const [icon, setIcon] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Known → ícono por defecto. other → el del usuario. Si vuelve a una known,
  // reseteamos el icon para que persistencia use el default. Si es other y no
  // tiene, dejamos vacío y la API valida.
  function changePlatform(p: SocialPlatform) {
    setPlatform(p);
    if (p !== "other") setIcon("");
    else setIcon((cur) => cur || "");
  }

  const effectiveIcon =
    platform !== "other" ? DEFAULT_SOCIAL_ICON[platform] ?? "" : icon;

  async function reload() {
    const res = await fetch("/api/socials");
    const data = await res.json();
    if (res.ok) onChange(data.socials);
  }

  async function handleAdd() {
    setError(null);
    const res = await fetch("/api/socials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform,
        url,
        icon_color: iconColor,
        text,
        icon: platform === "other" ? icon : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al agregar red social");
      return;
    }
    setUrl("");
    setText("");
    if (platform === "other") setIcon("");
    await reload();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/socials?id=${id}`, { method: "DELETE" });
    await reload();
  }

  return (
    <div className="max-w-[720px]">
      <h2 className="mb-1 font-display text-[32px] font-normal text-fg">Redes sociales</h2>
      <p className="mb-9 text-sm text-muted">Los íconos que aparecen al final de tu página</p>

      <section className="mb-5 rounded-lg border border-[#e6e6e4] border-t-[3px] border-t-accent bg-white p-6 shadow-sm">
        <FieldRow label="Plataforma">
          <select
            value={platform}
            onChange={(e) => changePlatform(e.target.value as SocialPlatform)}
            className="flex-1 rounded border border-[#e6e6e4] bg-[#fafaf9] px-3.5 py-2.5 text-sm"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LABELS[p]}
              </option>
            ))}
          </select>
        </FieldRow>
        <FieldRow label="Ícono">
          {platform !== "other" ? (
            <div className="flex flex-1 items-center gap-2 rounded border border-[#e6e6e4] bg-[#fafaf9] px-3.5 py-2 text-sm text-muted">
              <TablerIcon name={effectiveIcon} size={18} />
              <span>Automático para {PLATFORM_LABELS[platform]}</span>
            </div>
          ) : (
            <div className="flex flex-1 items-center">
              <IconPicker value={icon} onChange={setIcon} label="" />
              {!icon && <span className="ml-2 text-xs text-red-600">Elegí un ícono</span>}
            </div>
          )}
        </FieldRow>
        <FieldRow label="URL">
          <input
            type="url"
            placeholder="https://github.com/usuario"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 rounded border border-[#e6e6e4] bg-[#fafaf9] px-3.5 py-2.5 text-sm"
          />
        </FieldRow>
        <FieldRow label="Color icono">
          <input
            type="color"
            value={iconColor}
            onChange={(e) => setIconColor(e.target.value)}
            className="h-[34px] w-11 cursor-pointer rounded border border-[#e6e6e4] p-0.5"
          />
        </FieldRow>
        <FieldRow label="Texto">
          <input
            type="text"
            placeholder="@usuario"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 rounded border border-[#e6e6e4] bg-[#fafaf9] px-3.5 py-2.5 text-sm"
          />
        </FieldRow>
        {error && <p role="alert" className="mb-2 text-sm text-red-600">{error}</p>}
        <AnimateButton
          type="button"
          onClick={handleAdd}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-fg hover:opacity-90"
        >
          Agregar red social
        </AnimateButton>
      </section>

      <section className="rounded-lg border border-[#e6e6e4] border-t-[3px] border-t-accent bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-fg">Redes actuales</h3>
        {socials.length === 0 && <p className="text-sm text-muted">Todavía no agregaste redes sociales.</p>}
        {socials.map((s) => {
          const iconName = s.icon ?? DEFAULT_SOCIAL_ICON[s.platform];
          return (
            <div
              key={s.id}
              className="mb-2 flex items-center gap-3.5 rounded border border-[#e6e6e4] bg-[#fafaf9] px-4 py-3.5"
            >
              <span
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[#e6e6e4] bg-white"
                style={{ color: s.icon_color }}
              >
                <TablerIcon name={iconName} size={20} />
              </span>
              <div className="flex-1 text-sm">
                <strong className="block font-semibold text-fg">{PLATFORM_LABELS[s.platform]}</strong>
                <span className="text-muted">{s.url}</span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(s.id)}
                className="flex h-[34px] w-[34px] items-center justify-center rounded border border-[#e6e6e4] hover:border-accent"
              >
                ✕
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center gap-3.5">
      <label className="w-[110px] flex-shrink-0 text-xs font-semibold uppercase text-muted">{label}</label>
      {children}
    </div>
  );
}
