import type { GetServerSideProps } from "next";
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { verifyToken } from "@/lib/auth";
import db from "@/lib/db";
import { InView } from "@/components/animate-ui/effects/in-view";
import { AnimateButton } from "@/components/animate-ui/buttons/button";
import { SlidingNumber } from "@/components/animate-ui/primitives/texts/sliding-number";

interface Props {
  username: string;
}

interface Stats {
  users: number;
  pages: number;
  links: number;
  socials: number;
  visits: number;
  clicks: number;
}

interface UserRow {
  id: number;
  username: string;
  email: string;
  role: string;
  active: number;
  created_at: string;
  links: number;
  socials: number;
  visits: number;
  clicks: number;
}

interface UserAnalytics {
  visits_7d: number;
  visits_30d: number;
  clicks_30d: number;
  click_rate: number;
  top_links: { id: number; text: string; clicks: number }[];
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const token = ctx.req.cookies.token ?? "";
  const payload = verifyToken(token);
  if (!payload) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  const row = db.prepare("SELECT role, username FROM users WHERE id = ?").get(payload.userId) as
    | { role: string; username: string }
    | undefined;
  if (!row || row.role !== "super") {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }
  return { props: { username: row.username } };
};

const TABS = ["general", "usuarios"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = { general: "General", usuarios: "Usuarios" };

const STAT_CARDS: { key: keyof Stats; label: string }[] = [
  { key: "users", label: "Usuarios" },
  { key: "pages", label: "Páginas" },
  { key: "links", label: "Links" },
  { key: "socials", label: "Redes sociales" },
  { key: "visits", label: "Visitas" },
  { key: "clicks", label: "Clicks" },
];

export default function AdminPage({ username }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("general");
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement>>>({});
  const [indicator, setIndicator] = useState<{ top: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const el = tabRefs.current[tab];
    if (el) setIndicator({ top: el.offsetTop + el.offsetHeight / 2, height: el.offsetHeight * 0.6 });
  }, [tab]);

  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [analyticsById, setAnalyticsById] = useState<Record<number, UserAnalytics | null>>({});
  const [analyticsLoading, setAnalyticsLoading] = useState<number | null>(null);

  const [form, setForm] = useState({ username: "", email: "", password: "", role: "user" });
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function fetchStats() {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setStatsError(data.error ?? "Error al cargar estadísticas");
        return;
      }
      setStats((await res.json()) as Stats);
    } finally {
      setStatsLoading(false);
    }
  }

  async function fetchUsers() {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers((await res.json()) as UserRow[]);
    } finally {
      setUsersLoading(false);
    }
  }

  async function toggleAnalytics(id: number) {
    if (expandedUser === id) {
      setExpandedUser(null);
      return;
    }
    setExpandedUser(id);
    if (analyticsById[id] !== undefined) return;
    setAnalyticsLoading(id);
    try {
      const res = await fetch(`/api/admin/analytics?userId=${id}`);
      const data = res.ok ? ((await res.json()) as UserAnalytics) : null;
      setAnalyticsById((m) => ({ ...m, [id]: data }));
    } finally {
      setAnalyticsLoading(null);
    }
  }

  async function updateUser(id: number, patch: { role?: string; active?: number }) {
    const prev = users;
    setUsers((us) => us.map((u) => ({ ...u, ...(patch.role ? { role: patch.role } : {}), ...(patch.active !== undefined ? { active: patch.active } : {}) })));
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setFormError(data.error ?? "Error al actualizar usuario");
      setUsers(prev);
    } else {
      setFormError(null);
    }
    fetchUsers();
  }

  async function deleteUser(id: number, username: string) {
    const ok = window.confirm(
      `¿Eliminar a "${username}" definitivamente?\n\nEsto borrará su página, links, redes sociales y todas las métricas (visitas y clicks). Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setFormError(data.error ?? "Error al eliminar usuario");
    } else {
      setFormError(null);
    }
    fetchUsers();
  }

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({}))) as { username?: string; error?: string };
      if (!res.ok) {
        setFormError(data.error ?? "Error al crear usuario");
        return;
      }
      setSuccess(`Usuario ${data.username ?? form.username} creado`);
      setForm({ username: "", email: "", password: "", role: "user" });
      fetchUsers();
    } finally {
      setCreating(false);
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen bg-[#fafaf9]">
        <nav className="flex w-[248px] flex-shrink-0 flex-col gap-0.5 bg-[#141416] p-7 px-3.5">
          <div className="mb-7 px-3.5 font-display text-2xl text-white">Linko Admin</div>
          <div className="relative flex flex-col gap-0.5">
            <motion.span
              className="pointer-events-none absolute left-0 w-0.5 -translate-y-1/2 rounded-full bg-accent"
              initial={false}
              animate={indicator ? { top: indicator.top, height: indicator.height, opacity: 1 } : { opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
            />
            {TABS.map((t) => (
              <motion.button
                key={t}
                ref={(el) => {
                  tabRefs.current[t] = el ?? undefined;
                }}
                type="button"
                onClick={() => setTab(t)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`rounded px-3.5 py-2.5 text-left text-base font-medium transition ${
                  tab === t
                    ? "bg-white/10 pl-3 font-semibold text-white"
                    : "text-[#8b8b8b] hover:bg-white/5 hover:text-[#e0e0e0]"
                }`}
              >
                {TAB_LABELS[t]}
              </motion.button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-auto rounded px-3.5 py-2.5 text-left text-base text-[#6b6b6b] hover:bg-white/5 hover:text-[#e0e0e0]"
          >
            ← Cerrar sesión
          </button>
        </nav>

        <main className="max-h-screen flex-1 overflow-y-auto px-11 py-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {tab === "general" && (
                <InView as="div" className="w-full" offset={18}>
                  <h2 className="mb-1 font-display text-[32px] font-normal text-fg">General</h2>
                  <p className="mb-7 text-base text-[#6b6b6b]">
                    Estadísticas globales de la plataforma.
                  </p>

                  {statsError && (
                    <p role="alert" className="mb-4 text-sm text-red-700">
                      {statsError}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
                    {STAT_CARDS.map((card, i) => (
                      <motion.div
                        key={card.key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ y: -2 }}
                        className="rounded-lg border border-white/10 bg-[#141416] px-6 py-7 shadow-sm"
                      >
                        <div className="font-display text-4xl font-normal text-accent">
                          {statsLoading ? (
                            "Cargando…"
                          ) : (
                            <SlidingNumber value={stats?.[card.key] ?? 0} />
                          )}
                        </div>
                        <div className="mt-2 text-xs uppercase tracking-wide text-[#8b8b8b]">
                          {card.label}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </InView>
              )}

              {tab === "usuarios" && (
                <InView as="div" className="w-full" offset={18}>
                  <h2 className="mb-1 font-display text-[32px] font-normal text-fg">Usuarios</h2>
                  <p className="mb-7 text-base text-[#6b6b6b]">
                    Crea cuentas nuevas y revisa las existentes.
                  </p>

                  <div className="grid grid-cols-1 gap-7 xl:grid-cols-[380px_1fr]">
                    <form
                      onSubmit={handleCreate}
                      className="flex w-full flex-col gap-[18px] self-start rounded-lg border border-[#e6e6e4] border-t-[3px] border-t-accent bg-white px-8 py-9 shadow-sm"
                    >
                      <h3 className="text-xl text-fg">Nuevo usuario</h3>

                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="username" className="text-xs font-semibold uppercase tracking-wide text-fg">
                          Username
                        </label>
                        <input
                          id="username"
                          required
                          pattern="[a-z0-9_-]{3,30}"
                          title="3-30 caracteres: minúsculas, números, - o _"
                          placeholder="usuario"
                          value={form.username}
                          onChange={(e) => setForm({ ...form, username: e.target.value })}
                          className="rounded border border-[#e6e6e4] bg-[#fafaf9] px-4 py-3 text-fg outline-none placeholder:text-[#8b8b8b] focus:border-accent focus:ring-2 focus:ring-accent/20"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-fg">
                          Email
                        </label>
                        <input
                          id="email"
                          type="email"
                          required
                          autoComplete="off"
                          placeholder="tu@email.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="rounded border border-[#e6e6e4] bg-[#fafaf9] px-4 py-3 text-fg outline-none placeholder:text-[#8b8b8b] focus:border-accent focus:ring-2 focus:ring-accent/20"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-fg">
                          Contraseña
                        </label>
                        <input
                          id="password"
                          type="password"
                          required
                          minLength={8}
                          autoComplete="new-password"
                          placeholder="••••••••"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          className="rounded border border-[#e6e6e4] bg-[#fafaf9] px-4 py-3 text-fg outline-none placeholder:text-[#8b8b8b] focus:border-accent focus:ring-2 focus:ring-accent/20"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="role" className="text-xs font-semibold uppercase tracking-wide text-fg">
                          Rol
                        </label>
                        <select
                          id="role"
                          value={form.role}
                          onChange={(e) => setForm({ ...form, role: e.target.value })}
                          className="rounded border border-[#e6e6e4] bg-[#fafaf9] px-4 py-3 text-fg outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                        >
                          <option value="user">user</option>
                          <option value="super">super</option>
                        </select>
                      </div>

                      {formError && <p role="alert" className="text-sm text-red-700">{formError}</p>}
                      {success && <p className="text-sm text-accent">{success}</p>}

                      <AnimateButton
                        type="submit"
                        disabled={creating}
                        className="rounded-lg bg-accent px-7 py-3.5 font-semibold text-fg shadow-[0_2px_12px_rgba(71,246,84,0.35)] transition hover:opacity-90 disabled:opacity-60"
                      >
                        {creating ? "Creando…" : "Crear usuario"}
                      </AnimateButton>
                    </form>

                    <div className="flex flex-col gap-3">
                      <h3 className="text-xl text-fg">Listado</h3>
                      {usersLoading ? (
                        <p className="text-sm text-[#8b8b8b]">Cargando…</p>
                      ) : users.length === 0 ? (
                        <p className="text-sm text-[#8b8b8b]">No hay usuarios.</p>
                      ) : (
                        <div>
                        <div className="overflow-x-auto rounded-lg border border-[#e6e6e4]">
                          <table className="w-full text-left text-base">
                            <thead className="bg-[#fafaf9] text-xs uppercase tracking-wide text-[#8b8b8b]">
                              <tr>
                                <th className="px-4 py-2.5 font-semibold">Usuario</th>
                                <th className="px-4 py-2.5 font-semibold">Links</th>
                                <th className="px-4 py-2.5 font-semibold">Redes</th>
                                <th className="px-4 py-2.5 font-semibold">Visitas</th>
                                <th className="px-4 py-2.5 font-semibold">Clicks</th>
                                <th className="px-4 py-2.5 font-semibold">Rol</th>
                                <th className="px-4 py-2.5 font-semibold">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {users.map((u) => {
                                const isMe = u.username === username;
                                const isExpanded = expandedUser === u.id;
                                const analytics = analyticsById[u.id];
                                return (
                                <Fragment key={u.id}>
                                  <tr
                                    className={`border-t border-[#e6e6e4] bg-white ${
                                      isMe ? "bg-accent/10" : ""
                                    } ${!u.active ? "opacity-60" : ""}`}
                                  >
                                    <td className="px-4 py-2.5 text-fg">
                                      <button
                                        type="button"
                                        onClick={() => u.role !== "super" && toggleAnalytics(u.id)}
                                        disabled={u.role === "super"}
                                        aria-expanded={isExpanded}
                                        className="flex items-center gap-1.5 text-left hover:text-accent disabled:cursor-default disabled:hover:text-fg"
                                      >
                                        {u.role !== "super" && (
                                          <motion.span
                                            aria-hidden="true"
                                            animate={{ rotate: isExpanded ? 90 : 0 }}
                                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                            className="inline-block text-xs text-[#8b8b8b]"
                                          >
                                            ▸
                                          </motion.span>
                                        )}
                                        {u.username}{isMe && (
                                          <span className="ml-2 text-xs uppercase tracking-wide text-accent">
                                            tú
                                          </span>
                                        )}
                                        {!u.active && (
                                          <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                                            Inactivo
                                          </span>
                                        )}
                                      </button>
                                      <div className="text-xs text-fg/60">{u.email}</div>
                                      <div className="text-xs text-fg/50">
                                        {new Date(u.created_at).toLocaleDateString("es-419")}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-fg/80">{u.links}</td>
                                    <td className="px-4 py-2.5 text-fg/80">{u.socials}</td>
                                    <td className="px-4 py-2.5 text-fg/80">{u.visits}</td>
                                    <td className="px-4 py-2.5 text-fg/80">{u.clicks}</td>
                                    <td className="px-4 py-2.5">
                                      <select
                                        value={u.role}
                                        disabled={isMe}
                                        onChange={(e) => updateUser(u.id, { role: e.target.value })}
                                        className="rounded border border-[#e6e6e4] bg-[#fafaf9] px-2 py-1 text-xs text-fg outline-none focus:border-accent disabled:opacity-50"
                                      >
                                        <option value="user">user</option>
                                        <option value="super">super</option>
                                      </select>
                                    </td>
                                    <td className="px-4 py-2.5">
                                      <div className="flex gap-1.5">
                                        <button
                                          type="button"
                                          disabled={isMe}
                                          onClick={() => updateUser(u.id, { active: u.active ? 0 : 1 })}
                                          className="rounded border border-[#e6e6e4] bg-[#fafaf9] px-2.5 py-1 text-xs text-fg outline-none hover:border-accent hover:text-accent disabled:opacity-40"
                                        >
                                          {u.active ? "Desactivar" : "Reactivar"}
                                        </button>
                                        <button
                                          type="button"
                                          disabled={isMe}
                                          onClick={() => deleteUser(u.id, u.username)}
                                          className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs text-red-700 outline-none hover:border-red-400 disabled:opacity-40"
                                        >
                                          Eliminar
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                  <AnimatePresence initial={false}>
                                  {isExpanded && (
                                    <motion.tr
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ duration: 0.15 }}
                                      className="border-t border-[#e6e6e4] bg-[#fafaf9]"
                                    >
                                      <td colSpan={7} className="p-0">
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                        style={{ overflow: "hidden" }}
                                      >
                                      <div className="px-4 py-4">
                                        {analyticsLoading === u.id ? (
                                          <p className="text-sm text-[#8b8b8b]">Cargando analíticas…</p>
                                        ) : !analytics ? (
                                          <p className="text-sm text-[#8b8b8b]">Sin página / sin datos.</p>
                                        ) : (
                                          <div className="flex flex-col gap-3">
                                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                              <div>
                                                <div className="text-2xl text-fg">{analytics.visits_7d}</div>
                                                <div className="text-xs uppercase tracking-wide text-[#8b8b8b]">Visitas 7d</div>
                                              </div>
                                              <div>
                                                <div className="text-2xl text-fg">{analytics.visits_30d}</div>
                                                <div className="text-xs uppercase tracking-wide text-[#8b8b8b]">Visitas 30d</div>
                                              </div>
                                              <div>
                                                <div className="text-2xl text-fg">{analytics.clicks_30d}</div>
                                                <div className="text-xs uppercase tracking-wide text-[#8b8b8b]">Clicks 30d</div>
                                              </div>
                                              <div>
                                                <div className="text-2xl text-fg">{analytics.click_rate.toFixed(1)}%</div>
                                                <div className="text-xs uppercase tracking-wide text-[#8b8b8b]">Tasa de click</div>
                                              </div>
                                            </div>
                                            {analytics.top_links.length > 0 && (
                                              <div>
                                                <div className="mb-1.5 text-xs uppercase tracking-wide text-[#8b8b8b]">Top links</div>
                                                <ul className="flex flex-col gap-1 text-sm text-fg/80">
                                                  {analytics.top_links.slice(0, 5).map((l) => (
                                                    <li key={l.id}>
                                                      {l.text} — {l.clicks} clicks
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      </motion.div>
                                      </td>
                                    </motion.tr>
                                  )}
                                  </AnimatePresence>
                                </Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-xs text-[#8b8b8b]">
                          Usuarios inactivos no pueden iniciar sesión, pero siguen listados aquí (marcados como &quot;Inactivo&quot;) hasta que los reactives o elimines.
                        </p>
                        </div>
                      )}
                    </div>
                  </div>
                </InView>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </MotionConfig>
  );
}