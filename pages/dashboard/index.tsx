import type { GetServerSideProps } from "next";
import { useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/middleware";
import StyleEditor from "@/components/StyleEditor";
import LinkEditor from "@/components/LinkEditor";
import SocialEditor from "@/components/SocialEditor";
import AnalyticsBars from "@/components/AnalyticsBars";
import { InView } from "@/components/animate-ui/effects/in-view";
import { AnimateButton } from "@/components/animate-ui/buttons/button";
import type { Page, LinkItem, SocialLink } from "@/types";

interface Props {
  username: string;
  page: Page;
  links: LinkItem[];
  socials: SocialLink[];
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const authUser = getAuthUser(ctx.req as Parameters<typeof getAuthUser>[0]);
  if (!authUser) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const userRow = db.prepare("SELECT role FROM users WHERE id = ?").get(authUser.userId) as
    | { role: string }
    | undefined;
  if (userRow?.role === "super") {
    return { redirect: { destination: "/admin", permanent: false } };
  }

  const page = db.prepare("SELECT * FROM pages WHERE user_id = ?").get(authUser.userId) as Page;
  const links = db
    .prepare("SELECT * FROM links WHERE page_id = ? ORDER BY position ASC")
    .all(page.id) as LinkItem[];
  const socials = db
    .prepare("SELECT * FROM social_links WHERE page_id = ? ORDER BY position ASC")
    .all(page.id) as SocialLink[];

  return { props: { username: authUser.username, page, links, socials } };
};

const TABS = ["perfil", "links", "redes", "analytics"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  perfil: "Perfil",
  links: "Links",
  redes: "Redes sociales",
  analytics: "Analíticas",
};

export default function DashboardPage({
  username,
  page: initialPage,
  links: initialLinks,
  socials: initialSocials,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("perfil");
  const [page, setPage] = useState(initialPage);
  const [links, setLinks] = useState(initialLinks);
  const [socials, setSocials] = useState(initialSocials);
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function handleLogout() {
    setDrawerOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col bg-[#fafaf9] md:flex-row">
        <div className="sticky top-0 z-20 flex items-center justify-between bg-[#141416] px-4 py-3 md:hidden">
          <span className="font-display text-lg text-white">Linko</span>
          <button
            type="button"
            onClick={() => setDrawerOpen((o) => !o)}
            aria-label={drawerOpen ? "Cerrar menú" : "Abrir menú"}
            className="text-xl leading-none text-white"
          >
            {drawerOpen ? "✕" : "☰"}
          </button>
        </div>

        {drawerOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
        )}

        <nav
          className={`fixed inset-y-0 left-0 z-[41] flex w-[248px] flex-shrink-0 flex-col gap-0.5 bg-[#141416] p-7 px-3.5 transition-transform duration-200 md:static md:translate-x-0 ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-7 px-3.5 font-display text-2xl text-white">Linko</div>
          {TABS.map((t) => (
            <motion.button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setDrawerOpen(false);
              }}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
className={`font-body relative rounded px-3.5 py-2.5 text-left text-sm transition tracking-widest
 ${
                tab === t
                  ? "bg-white/10 pl-3 font-semibold text-white"
                  : "text-[#8b8b8b] hover:bg-white/5 hover:text-[#e0e0e0]"
                }`}
            >
              {tab === t && (
                <motion.span
                  layoutId="dash-active-tab"
                  className="absolute left-0 inset-y-[20%] w-0.5 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                />
              )}
              {TAB_LABELS[t]}
            </motion.button>
          ))}
          <a
            href={`/u/${username}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setDrawerOpen(false)}
            className="mt-2 rounded px-3.5 py-2.5 text-sm text-[#6b6b6b] hover:bg-white/5 hover:text-[#e0e0e0]"
          >
            Ver página pública ↗
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="font-display mt-auto rounded px-3.5 py-2.5 text-left text-sm text-[#6b6b6b] hover:bg-white/5 hover:text-[#e0e0e0]"
          >
            ← Cerrar sesión
          </button>
        </nav>

        <main className="max-h-screen w-full flex-1 overflow-y-auto overflow-x-hidden px-4 pt-6 pb-9 sm:px-6 md:px-11 md:py-9 md:pt-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {tab === "perfil" && <StyleEditor page={page} links={links} socials={socials} onSaved={setPage} />}
              {tab === "links" && <LinkEditor page={page} links={links} onChange={setLinks} onPageSaved={setPage} />}
              {tab === "redes" && <SocialEditor page={page} socials={socials} onChange={setSocials} onPageSaved={setPage} />}
              {tab === "analytics" && (
                <InView as="div" className="max-w-[720px]" offset={18}>
                  <h2 className="mb-1 font-display text-[32px] font-normal text-fg">Analíticas</h2>
                  <p className="mb-9 text-sm text-muted">Tráfico de tu página y clicks por link</p>
                  <AnalyticsBars />
                </InView>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </MotionConfig>
  );
}
