import { useState, type FormEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { verifyToken } from "@/lib/auth";
import { InView } from "@/components/animate-ui/effects/in-view";
import { AnimateButton } from "@/components/animate-ui/buttons/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al iniciar sesión");
        return;
      }
      router.push("/dashboard");
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
          <h1 className="text-center font-display text-[32px] font-normal text-fg">Entrar</h1>
          <p className="-mt-3 text-center font-display text-sm text-fg/80">Accedé a tu panel de edición</p>

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
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-border bg-bg px-4 py-3 text-fg outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

        <AnimateButton
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-7 py-3.5 font-semibold text-fg shadow-[0_2px_12px_rgba(71,246,84,0.35)] transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </AnimateButton>

        <p className="text-center font-display text-sm text-fg/80">
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="font-semibold text-fg underline underline-offset-4 hover:text-accent">
            Crear una
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
