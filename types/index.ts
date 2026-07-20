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
}

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
