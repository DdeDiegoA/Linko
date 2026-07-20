import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { InView } from "@/components/animate-ui/effects/in-view";
import { AnimateButton } from "@/components/animate-ui/buttons/button";
import PublicPage from "@/components/PublicPage";
import type { LinkItem, Page, SocialLink } from "@/types";

const SWATCHES = ["#8e93ff", "#1a1a1a", "#898ef6", "#5a5d98"];

export default function StyleEditor({
  page,
  links,
  socials,
  onSaved,
}: {
  page: Page;
  links: LinkItem[];
  socials: SocialLink[];
  onSaved: (p: Page) => void;
}) {
  const [form, setForm] = useState(page);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  function update<K extends keyof Page>(key: K, value: Page[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function uploadFile(file: File): Promise<string | null> {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al subir imagen");
      return null;
    }
    return data.path as string;
  }

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const path = await uploadFile(file);
      if (path) update("avatar_path", path);
    } finally {
      setUploading(false);
    }
  }

  async function handleBackgroundImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const path = await uploadFile(file);
      if (path) update("background_value", path);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al guardar");
        return;
      }
      onSaved(data.page);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-9 lg:flex-row lg:items-start">
      <form onSubmit={handleSubmit} className="w-full max-w-[720px] lg:flex-1">
      <h2 className="mb-1 font-display text-[32px] font-normal text-fg">Perfil</h2>
      <p className="mb-9 text-sm text-muted">Personalizá cómo te ve el mundo</p>

      <section className="mb-5 rounded-lg border border-[#e6e6e4] border-t-[3px] border-t-accent bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-fg">Imagen de perfil</h3>
        <div className="flex items-center gap-4">
          <div className="h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-full border-[3px] border-fg bg-[#e6e6e4]">
            {form.avatar_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.avatar_path} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-2xl text-fg">
                {(form.title || "?").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <input
            ref={avatarInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <AnimateButton
            type="button"
            onClick={() => avatarInput.current?.click()}
            disabled={uploading}
            className="rounded border border-[#e6e6e4] px-4 py-2 text-sm font-medium hover:border-accent disabled:opacity-60"
          >
            {uploading ? "Subiendo…" : "Cambiar imagen"}
          </AnimateButton>
        </div>
      </section>

      <section className="mb-5 rounded-lg border border-[#e6e6e4] border-t-[3px] border-t-accent bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-fg">Fondo</h3>
        <FieldRow label="Tipo">
          <select
            value={form.background_type}
            onChange={(e) => update("background_type", e.target.value as Page["background_type"])}
            className="flex-1 rounded border border-[#e6e6e4] bg-[#fafaf9] px-3.5 py-2.5 text-sm"
          >
            <option value="color">Color sólido</option>
            <option value="image">Imagen</option>
          </select>
        </FieldRow>

        {form.background_type === "color" ? (
          <FieldRow label="Color">
            <input
              type="color"
              value={form.background_value}
              onChange={(e) => update("background_value", e.target.value)}
              className="h-[34px] w-11 cursor-pointer rounded border border-[#e6e6e4] p-0.5"
            />
            <div className="ml-3 flex gap-2">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => update("background_value", c)}
                  className={`h-[30px] w-[30px] rounded-full border-2 transition ${
                    form.background_value === c ? "scale-110 border-accent" : "border-[#e6e6e4]"
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </FieldRow>
        ) : (
          <FieldRow label="Imagen">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleBackgroundImageChange}
              className="text-sm"
            />
          </FieldRow>
        )}
      </section>

      <section className="mb-5 rounded-lg border border-[#e6e6e4] border-t-[3px] border-t-accent bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-fg">Texto</h3>
        <FieldRow label="Título">
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="flex-1 rounded border border-[#e6e6e4] bg-[#fafaf9] px-3.5 py-2.5 text-sm"
          />
        </FieldRow>
        <FieldRow label="Color título">
          <input
            type="color"
            value={form.title_color}
            onChange={(e) => update("title_color", e.target.value)}
            className="h-[34px] w-11 cursor-pointer rounded border border-[#e6e6e4] p-0.5"
          />
        </FieldRow>
        <FieldRow label="Subtítulo">
          <input
            type="text"
            value={form.subtitle}
            onChange={(e) => update("subtitle", e.target.value)}
            className="flex-1 rounded border border-[#e6e6e4] bg-[#fafaf9] px-3.5 py-2.5 text-sm"
          />
        </FieldRow>
        <FieldRow label="Color subtítulo">
          <input
            type="color"
            value={form.subtitle_color}
            onChange={(e) => update("subtitle_color", e.target.value)}
            className="h-[34px] w-11 cursor-pointer rounded border border-[#e6e6e4] p-0.5"
          />
        </FieldRow>
      </section>

      {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}

      <AnimateButton
        type="submit"
        disabled={saving}
        className="rounded-lg bg-accent px-7 py-3.5 font-semibold text-fg shadow-[0_2px_12px_rgba(71,246,84,0.35)] hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "Guardando…" : "Guardar cambios"}
      </AnimateButton>
      </form>

      <aside className="w-full lg:w-[360px] lg:flex-shrink-0">
        <div className="lg:sticky lg:top-9">
          <h3 className="mb-3 font-display text-xs font-semibold uppercase tracking-wide text-muted">Vista previa</h3>
          <div className="overflow-hidden rounded-[28px] border-[10px] border-[#141416] bg-[#141416] shadow-xl">
            <div className="h-[560px] overflow-y-auto rounded-[18px]">
              <PublicPage data={{ page: form, links, socials }} />
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted">Cambios en vivo · no guardado hasta confirmar</p>
        </div>
      </aside>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <InView className="mb-3.5 flex items-center gap-3.5" offset={12}>
      <label className="w-[110px] flex-shrink-0 text-xs font-semibold uppercase text-muted">{label}</label>
      {children}
    </InView>
  );
}
