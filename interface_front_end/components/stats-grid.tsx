import { Stat } from "@/lib/mock-data";

type StatsGridProps = {
  stats: Stat[];
};

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="card-grid" role="list" aria-label="Indicateurs clés">
      {stats.map((statistique) => (
        <article key={statistique.label} className="card" role="listitem">
          <h3>{statistique.label}</h3>
          <p className="badge">{statistique.value}</p>
        </article>
      ))}
    </div>
  );
}
