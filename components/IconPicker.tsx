import { useEffect, useMemo, useRef, useState } from "react";
import { TABLER_ICON_NAMES } from "@/lib/icons";
import { resolveTablerIcon } from "@/lib/icons";

const MAX_RESULTS = 120;

/**
 * Picker de íconos Tabler con búsqueda. El valor guardado es el nombre
 * del ícono ("IconHome", "IconBrandGithub", ...).
 *
 * Botón principal → abre modal → input de búsqueda + grilla. Click en un
 * ícono dispara onSelect(name) y cierra. Si ya hay un ícono seleccionado
 * se muestra previsualizado y se puede limpiar.
 */
export default function IconPicker({
  value,
  onChange,
  label = "Ícono",
  allowClear = true,
}: {
  value: string;
  onChange: (name: string) => void;
  label?: string;
  allowClear?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TABLER_ICON_NAMES.slice(0, MAX_RESULTS);
    const filtered: string[] = [];
    for (const name of TABLER_ICON_NAMES) {
      if (filtered.length >= MAX_RESULTS) break;
      if (name.toLowerCase().includes(q)) filtered.push(name);
    }
    return filtered;
  }, [query]);

  const Preview = value ? resolveTablerIcon(value) : null;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded border border-[#e6e6e4] bg-white px-3 text-sm hover:border-accent"
        title={value || "Elegir ícono"}
      >
        {Preview ? (
          <Preview size={18} stroke={1.8} />
        ) : (
          <span className="w-[18px] text-center text-muted">+</span>
        )}
        <span className="max-w-[120px] truncate text-muted">{value || "Sin ícono"}</span>
      </button>
      {allowClear && value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="h-7 w-7 rounded border border-[#e6e6e4] text-xs hover:border-accent"
          title="Quitar ícono"
        >
          ✕
        </button>
      )}
      {label && <span className="text-xs text-muted">{label}</span>}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-20"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-[640px] max-w-[92vw] rounded-lg border border-[#e6e6e4] bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-[#e6e6e4] p-3">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Buscar entre ${TABLER_ICON_NAMES.length} íconos…`}
                className="flex-1 rounded border border-[#e6e6e4] px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-9 w-9 rounded border border-[#e6e6e4] text-sm hover:border-accent"
                title="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[420px] overflow-y-auto p-3">
              {results.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">Sin resultados</p>
              ) : (
                <div className="grid grid-cols-8 gap-2 sm:grid-cols-10">
                  {results.map((name) => {
                    const Cmp = resolveTablerIcon(name);
                    if (!Cmp) return null;
                    const active = name === value;
                    return (
                      <button
                        key={name}
                        type="button"
                        title={name}
                        onClick={() => {
                          onChange(name);
                          setOpen(false);
                        }}
                        className={
                          "flex h-12 w-12 items-center justify-center rounded border text-fg transition-colors " +
                          (active
                            ? "border-accent bg-accent/15"
                            : "border-[#e6e6e4] hover:border-accent hover:bg-[#fafaf9]")
                        }
                      >
                        <Cmp size={22} stroke={1.8} />
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="mt-3 text-center text-xs text-muted">
                Mostrando {results.length} de {TABLER_ICON_NAMES.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}