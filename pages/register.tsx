import { useState, type FormEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { verifyToken } from "@/lib/auth";
import { InView } from "@/components/animate-ui/effects/in-view";
import { AnimateButton } from "@/components/animate-ui/buttons/button";
import { useToast } from "@/components/Toast";

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Error al crear la cuenta");
        return;
      }
      toast.success("Cuenta creada");
      router.push("/dashboard");
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <InView as="div" className="w-full max-w-[420px]">
        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col gap-[22px] rounded-lg border border-border bg-surface px-9 py-11 shadow-lg"
        >
          <h1 className="text-center font-display text-[32px] font-normal text-fg">Crear cuenta</h1>
          <p className="-mt-3 text-center font-display text-sm text-fg/80">Elige tu username y empieza</p>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="username" className="text-xs font-semibold uppercase tracking-wide text-fg">
            Username
          </label>
          <input
            id="username"
            type="text"
            required
            pattern="[a-z0-9_-]{3,30}"
            autoComplete="username"
            placeholder="diegoarenas"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded border border-border bg-bg px-4 py-3 text-fg outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
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
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-border bg-bg px-4 py-3 text-fg outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
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
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-border bg-bg px-4 py-3 text-fg outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <AnimateButton
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-7 py-3.5 font-semibold text-fg shadow-[0_2px_12px_rgba(71,246,84,0.35)] transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Creando…" : "Crear cuenta"}
        </AnimateButton>

        <p className="text-center font-display text-sm text-fg/80">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-fg underline underline-offset-4 hover:text-accent">
            Entrar
          </Link>
        </p>
      </form>
      </InView>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const token = ctx.req.cookies.token ?? "";
  if (verifyToken(token)) {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }
  return { props: {} };
};
