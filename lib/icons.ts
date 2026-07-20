import * as TablerIcons from "@tabler/icons-react";
import type { ComponentType, SVGProps } from "react";

// Lista plana para el IconPicker. Filtrado perezoso en el cliente.
export const TABLER_ICON_NAMES = Object.keys(TablerIcons).filter(
  (k) => k.startsWith("Icon") && k !== "Icon" && k !== "Icons"
) as string[];

// ponytail: tipamos como cualquier ícono tabler (acepta size, color, stroke,
// className, style y el resto de SVGProps). Aceptar ComponentType<any> evita
// pelearme con 6000 overloads de forwardRef individuales.
/* eslint-disable @typescript-eslint/no-explicit-any */
export type TablerIconComponent = ComponentType<any>;

const COMPONENT_MAP = TablerIcons as unknown as Record<string, TablerIconComponent>;

/**
 * Resuelve un nombre de ícono tabler ("IconHome", "IconBrandGithub", ...)
 * a su componente. Devuelve null si no existe.
 *
 * Soporta también strings legacy (emoji / texto): el renderer decide si
 * mostrar el SVG (cuando name existe en tabler) o renderizar el string tal cual.
 */
export function resolveTablerIcon(name: string | null | undefined): TablerIconComponent | null {
  if (!name) return null;
  const Cmp = COMPONENT_MAP[name];
  return Cmp ?? null;
}

export type IconableProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  color?: string;
  stroke?: number;
};