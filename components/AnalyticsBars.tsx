import { useEffect, useState } from "react";
import { InView } from "@/components/animate-ui/effects/in-view";

interface TopLink {
  id: number;
  text: string;
  clicks: number;
}

interface AnalyticsData {
  visits_7d: number;
  visits_30d: number;
  clicks_30d: number;
  click_rate: number;
  top_links: TopLink[];
}

function StatCard({ value, label, delay = 0 }: { value: string; label: string; delay?: number }) {
  return (
    <InView as="div" offset={12} delay={delay}>
      <div className="rounded-lg border border-[#e6e6e4] border-t-[3px] border-t-accent bg-white p-6 shadow-sm">
        <div className="font-display text-[44px] font-normal leading-none tracking-[0.03em] text-fg">
          {value}
        </div>
        <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8b8b8b]">
          {label}
        </div>
      </div>
    </InView>
  );
}

// ponytail: CSS bars, add recharts if multi-dataset needed
export default function AnalyticsBars() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <p className="font-display text-sm text-[#8b8b8b]">No se pudieron cargar las analíticas.</p>;
  }

  if (!data) {
    return <p className="font-display text-sm text-[#8b8b8b]">Cargando...</p>;
  }

  const { visits_7d, visits_30d, clicks_30d, click_rate, top_links } = data;
  const hasClicks = top_links.some((l) => l.clicks > 0);
  const max = Math.max(1, ...top_links.map((l) => l.clicks));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard value={String(visits_7d)} label="Visitas últimos 7 días" />
        <StatCard value={String(visits_30d)} label="Visitas últimos 30 días" delay={0.05} />
        <StatCard value={String(clicks_30d)} label="Clicks totales (30d)" delay={0.1} />
        <StatCard value={`${click_rate.toFixed(1)}%`} label="Tasa de click" delay={0.15} />
      </div>

      <InView as="div" offset={14} delay={0.2}>
        <div className="rounded-lg border border-[#e6e6e4] border-t-[3px] border-t-accent bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-[15px] font-semibold tracking-[-0.005em] text-fg">
            Ranking de links más clickeados
          </h3>
          {!hasClicks ? (
            <p className="text-sm text-[#8b8b8b]">Sin clics todavía.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-[#e6e6e4] px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8b8b8b]">
                    #
                  </th>
                  <th className="border-b border-[#e6e6e4] px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8b8b8b]">
                    Link
                  </th>
                  <th className="border-b border-[#e6e6e4] px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8b8b8b]">
                    Clicks
                  </th>
                  <th className="border-b border-[#e6e6e4] px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8b8b8b]" />
                </tr>
              </thead>
              <tbody>
                {top_links.map((l, i) => (
                  <tr key={l.id}>
                    <td className="border-b border-[#e6e6e4] px-3.5 py-3 font-display text-lg font-normal text-fg">
                      {i + 1}
                    </td>
                    <td className="border-b border-[#e6e6e4] px-3.5 py-3 text-sm text-fg">{l.text}</td>
                    <td className="border-b border-[#e6e6e4] px-3.5 py-3 text-sm text-fg">{l.clicks}</td>
                    <td className="border-b border-[#e6e6e4] px-3.5 py-3">
                      <div
                        className="h-1.5 min-w-1 rounded-[3px] bg-accent"
                        style={{ width: `${(l.clicks / max) * 100}%` }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </InView>
    </div>
  );
}
