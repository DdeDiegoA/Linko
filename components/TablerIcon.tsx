import { resolveTablerIcon } from "@/lib/icons";

/**
 * Rendera un ícono tabler por nombre. Si el nombre no es un ícono tabler
 * válido (ej: emoji legacy, texto suelto) lo renderiza como string.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export default function TablerIcon({
  name,
  size = 24,
  className,
  style,
}: {
  name: string | null | undefined;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (!name) return null;
  const Cmp = resolveTablerIcon(name) as any;
  if (Cmp) {
    return <Cmp size={size} stroke={1.8} className={className} style={style} />;
  }
  return (
    <span className={className} style={style}>
      {name}
    </span>
  );
}