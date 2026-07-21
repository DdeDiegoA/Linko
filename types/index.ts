export interface User {
  id: number;
  email: string;
  username: string;
  created_at: string;
}

export interface Page {
  id: number;
  user_id: number;
  background_type: "image" | "color";
  background_value: string;
  avatar_path: string | null;
  title: string;
  title_color: string;
  subtitle: string;
  subtitle_color: string;
  // Estilo por defecto heredado por links/redes sin custom.
  link_color: string;
  link_background_color: string;
  link_border_color: string;
  link_border_width: number;
  social_icon_color: string;
  social_icon_background_color: string;
}

// 0 = hereda defaults del page, 1 = usa sus propios campos de estilo.
export type CustomFlag = 0 | 1;

export interface LinkItem {
  id: number;
  page_id: number;
  icon: string | null;
  text: string;
  url: string;
  color: string;
  background_color: string;
  border_color: string;
  border_width: number;
  custom_style: CustomFlag;
  position: number;
}

export type SocialPlatform =
  | "github"
  | "twitter"
  | "instagram"
  | "linkedin"
  | "youtube"
  | "tiktok"
  | "other";

export interface SocialLink {
  id: number;
  page_id: number;
  platform: SocialPlatform;
  icon: string | null;
  icon_color: string;
  icon_background_color: string;
  custom_color: CustomFlag;
  text: string;
  url: string;
  position: number;
}

// Mapa de ícono tabler por defecto para cada plataforma conocida.
// Para platform="other" el usuario elige el ícono en el picker.
export const DEFAULT_SOCIAL_ICON: Record<SocialPlatform, string | null> = {
  github: "IconBrandGithub",
  twitter: "IconBrandX",
  instagram: "IconBrandInstagram",
  linkedin: "IconBrandLinkedin",
  youtube: "IconBrandYoutube",
  tiktok: "IconBrandTiktok",
  other: null,
};

export interface PublicPageData {
  page: Page;
  links: LinkItem[];
  socials: SocialLink[];
}
