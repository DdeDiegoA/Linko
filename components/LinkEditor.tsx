import { useState } from "react";
import { AnimateButton } from "@/components/animate-ui/buttons/button";
import IconPicker from "@/components/IconPicker";
import TablerIcon from "@/components/TablerIcon";
import type { LinkItem } from "@/types";

const EMPTY_DRAFT = {
  icon: "",
  text: "",
  url: "",
  color: "#1a1a1a",
  background_color: "#898ef6",
  border_color: "#7e82df",
  border_width: 1,
};

type DraftLink = typeof EMPTY_DRAFT;

export default function LinkEditor({
  links,
  onChange,
}: {
  links: LinkItem[];
  onChange: (links: LinkItem[]) => void;
}) {
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const res = await fetch("/api/links");
    const data = await res.json();
    if (res.ok) onChange(data.links);
  }

  async function handleSave(id: number | "new", draft: DraftLink) {
    setError(null);
    const res = await fetch("/api/links", {
      method: id === "new" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id === "new" ? draft : { id, ...draft }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al guardar link");
      return;
    }
    setEditingId(null);
    await reload();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/links?id=${id}`, { method: "DELETE" });
    await reload();
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= links.length) return;
    const reordered = [...links];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const res = await fetch("/api/links", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reorder: reordered.map((l) => l.id) }),
    });
    const data = await res.json();
    if (res.ok) onChange(data.links);
  }

  return (
    <div className="flex max-w-[1100px] gap-10">
      <div className="w-[680px]">
      <h2 className="mb-1 font-display text-[32px] font-normal text-fg">Links</h2>
      <p className="mb-9 text-sm text-muted">20 links máximo. Usá las flechas para reordenar.</p>

      <section className="mb-5 rounded-lg border border-[#e6e6e4] border-t-[3px] border-t-accent bg-white p-6 shadow-sm">
        {links.map((link, i) =>
          editingId === link.id ? (
            <LinkForm
              key={link.id}
              initial={link}
              onCancel={() => setEditingId(null)}
              onSave={(draft) => handleSave(link.id, draft)}
            />
          ) : (
            <div
              key={link.id}
              className="mb-2 flex items-center gap-3.5 rounded border border-[#e6e6e4] bg-[#fafaf9] px-4 py-3.5"
            >
              <div className="flex flex-col text-muted">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="leading-none disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === links.length - 1}
                  className="leading-none disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
              <div className="flex-1 text-sm">
                <strong className="block font-semibold text-fg">{link.text}</strong>
                <span className="text-muted">{link.url}</span>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditingId(link.id)}
                  title="Editar"
                  className="flex h-[34px] w-[34px] items-center justify-center rounded border border-[#e6e6e4] hover:border-accent"
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(link.id)}
                  title="Eliminar"
                  className="flex h-[34px] w-[34px] items-center justify-center rounded border border-[#e6e6e4] hover:border-accent"
                >
                  ✕
                </button>
              </div>
            </div>
          )
        )}

        {links.length === 0 && editingId !== "new" && (
          <p className="text-sm text-muted">Todavía no agregaste links.</p>
        )}

        {editingId === "new" && (
          <LinkForm onCancel={() => setEditingId(null)} onSave={(draft) => handleSave("new", draft)} />
        )}
      </section>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {editingId !== "new" && links.length < 20 && (
        <button
          type="button"
          onClick={() => setEditingId("new")}
          className="rounded-lg bg-accent px-7 py-3.5 font-semibold text-fg shadow-[0_2px_12px_rgba(71,246,84,0.35)] hover:opacity-90"
        >
          + Agregar link
        </button>
      )}
      </div>

      <LinkPreview links={links} />
    </div>
  );
}

function LinkPreview({ links }: { links: LinkItem[] }) {
  return (
    <aside className="w-[380px] flex-shrink-0">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-xs text-muted">/u/preview</span>
      </div>
      <div className="flex flex-col items-center rounded-lg border border-[#e6e6e4] bg-[#8e93ff] px-5 py-8 shadow-sm">
        <div className="mb-4 h-12 w-12 rounded-full border-2 border-fg bg-white/40" />
        <div className="mb-1.5 h-3 w-3/5 rounded-full bg-fg/70" />
        <div className="mb-6 h-2 w-2/5 rounded-full bg-fg/40" />
        {links.length === 0 ? (
          <p className="text-center text-xs text-fg/60">Sin links todavía. Agregá uno para verlo acá.</p>
        ) : (
          <div className="flex w-full flex-col gap-2">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-2 rounded-md px-3.5 py-3 text-sm font-medium"
                style={{
                  color: link.color,
                  backgroundColor: link.background_color,
                  borderColor: link.border_color,
                  borderWidth: link.border_width,
                  borderStyle: "solid",
                }}
              >
                {link.icon && (
                  <span className="w-5 flex-shrink-0 text-center">
                    <TablerIcon name={link.icon} size={18} />
                  </span>
                )}
                <span className="flex-1 truncate">{link.text || "(sin texto)"}</span>
                <span className="text-xs opacity-60">→</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-xs text-muted">Vista previa en vivo de tus links.</p>
    </aside>
  );
}

function LinkForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: LinkItem;
  onSave: (draft: DraftLink) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<DraftLink>(
    initial ? { ...initial, icon: initial.icon ?? "" } : EMPTY_DRAFT
  );

  function update<K extends keyof DraftLink>(key: K, value: DraftLink[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <div className="mb-2 flex flex-col gap-2.5 rounded border border-accent bg-[#fafaf9] p-4">
      <div className="flex gap-2.5">
        <IconPicker value={draft.icon ?? ""} onChange={(v) => update("icon", v)} label="" />
        <input
          placeholder="Texto"
          value={draft.text}
          onChange={(e) => update("text", e.target.value)}
          className="flex-1 rounded border border-[#e6e6e4] px-3 py-2 text-sm"
        />
      </div>
      <input
        placeholder="https://..."
        value={draft.url}
        onChange={(e) => update("url", e.target.value)}
        className="rounded border border-[#e6e6e4] px-3 py-2 text-sm"
      />
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs text-muted">
          Color texto
          <input
            type="color"
            value={draft.color}
            onChange={(e) => update("color", e.target.value)}
            className="ml-1 h-7 w-9 cursor-pointer align-middle"
          />
        </label>
        <label className="text-xs text-muted">
          Fondo
          <input
            type="color"
            value={draft.background_color}
            onChange={(e) => update("background_color", e.target.value)}
            className="ml-1 h-7 w-9 cursor-pointer align-middle"
          />
        </label>
        <label className="text-xs text-muted">
          Borde
          <input
            type="color"
            value={draft.border_color}
            onChange={(e) => update("border_color", e.target.value)}
            className="ml-1 h-7 w-9 cursor-pointer align-middle"
          />
        </label>
        <label className="text-xs text-muted">
          Grosor
          <input
            type="number"
            min={0}
            max={20}
            value={draft.border_width}
            onChange={(e) => update("border_width", Number(e.target.value))}
            className="ml-1 w-14 rounded border border-[#e6e6e4] px-1.5 py-1"
          />
        </label>
      </div>
      <div className="flex gap-2">
        <AnimateButton
          type="button"
          onClick={() => onSave(draft)}
          className="rounded bg-accent px-4 py-2 text-sm font-semibold text-fg hover:opacity-90"
        >
          Guardar
        </AnimateButton>
        <AnimateButton
          type="button"
          onClick={onCancel}
          className="rounded border border-[#e6e6e4] px-4 py-2 text-sm hover:border-accent"
        >
          Cancelar
        </AnimateButton>
      </div>
    </div>
  );
}
